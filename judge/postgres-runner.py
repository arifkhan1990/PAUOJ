#!/usr/bin/env python3
"""PostgreSQL test runner.

The judge image ships a pre-initialized PostgreSQL 15 data directory in
``/opt/postgres-template``. For every test we copy that template to /tmp, start
a private postgres server on a unix socket (no TCP, no fsync), load the
ShopSphere PostgreSQL fixture, apply the per-test setup script from stdin, and
run the submitted statement as a SELECT-only role inside a read-only
transaction. Output is TSV, byte-for-byte compatible with sql-runner.py: no
header, no trailing newline, ``\\N`` for NULL.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import signal
import subprocess
import sys
import tempfile
import time
from datetime import date, datetime, time as clock_time
from decimal import Decimal
from pathlib import Path

import psycopg2

TEMPLATE = os.environ.get("POSTGRES_TEMPLATE") or "/opt/postgres-template"
FIXTURE = os.environ.get("SHOPSPHERE_POSTGRES_SQL") or os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "shopsphere.postgres.sql"
)
PG_BIN = os.environ.get("POSTGRES_BIN") or "/usr/lib/postgresql/15/bin"
POSTGRES = os.path.join(PG_BIN, "postgres")
PSQL = os.path.join(PG_BIN, "psql")
START_TIMEOUT = 20.0
RESULT_KEYWORDS = frozenset({"SELECT", "WITH", "VALUES", "TABLE", "EXPLAIN"})
FORBIDDEN_SETUP = re.compile(
    r"\b(RESET|CREATE|DROP|ALTER|COPY|DO|CALL|GRANT|REVOKE|TRUNCATE|"
    r"VACUUM|LISTEN|NOTIFY|SET\s+ROLE|SET\s+SESSION|SET\s+LOCAL)\b",
    re.IGNORECASE,
)


# --------------------------------------------------------------------------- #
# SQL helpers
# --------------------------------------------------------------------------- #
def _skip_quoted(sql: str, index: int) -> int:
    quote = sql[index]
    index += 1
    while index < len(sql):
        if sql[index] == quote:
            if index + 1 < len(sql) and sql[index + 1] == quote:
                index += 2
                continue
            return index + 1
        index += 1
    return index


def _skip_line_comment(sql: str, index: int) -> int:
    newline = sql.find("\n", index)
    return len(sql) if newline == -1 else newline


def _skip_block_comment(sql: str, index: int) -> int:
    closing = sql.find("*/", index + 2)
    return len(sql) if closing == -1 else closing + 2


def strip_comments(sql: str) -> str:
    output: list[str] = []
    index = 0
    while index < len(sql):
        char = sql[index]
        if char in ("'", '"'):
            end = _skip_quoted(sql, index)
            output.append(sql[index:end])
            index = end
            continue
        if sql.startswith("--", index):
            index = _skip_line_comment(sql, index)
            continue
        if sql.startswith("/*", index):
            index = _skip_block_comment(sql, index)
            continue
        output.append(char)
        index += 1
    return "".join(output)


def leading_keyword(sql: str) -> str:
    match = re.match(r"[A-Za-z]+", strip_comments(sql).strip())
    return match.group(0).upper() if match else ""


def has_embedded_statement(sql: str) -> bool:
    index = 0
    while index < len(sql):
        char = sql[index]
        if char in ("'", '"'):
            index = _skip_quoted(sql, index)
            continue
        if sql.startswith("--", index):
            index = _skip_line_comment(sql, index)
            continue
        if sql.startswith("/*", index):
            index = _skip_block_comment(sql, index)
            continue
        if char == ";":
            if strip_comments(sql[index + 1 :]).strip():
                return True
        index += 1
    return False


def replace_outside_strings(sql: str, pattern: re.Pattern[str], replacement) -> str:
    output: list[str] = []
    index = 0
    while index < len(sql):
        char = sql[index]
        if char in ("'", '"'):
            end = _skip_quoted(sql, index)
            output.append(sql[index:end])
            index = end
            continue
        if sql.startswith("--", index):
            end = _skip_line_comment(sql, index)
            output.append(sql[index:end])
            index = end
            continue
        if sql.startswith("/*", index):
            end = _skip_block_comment(sql, index)
            output.append(sql[index:end])
            index = end
            continue
        match = pattern.match(sql, index)
        if match:
            output.append(replacement(match))
            index = match.end()
            continue
        output.append(char)
        index += 1
    return "".join(output)


def replace_function_name(sql: str, old: str, new: str) -> str:
    pattern = re.compile(rf"(?<![A-Za-z0-9_$]){re.escape(old)}\s*\(", re.IGNORECASE)

    def replace(match: re.Match[str]) -> str:
        return f"{new}("

    return replace_outside_strings(sql, pattern, replace)


JULIANDAY_CAST = re.compile(
    r"CAST\s*\(\s*((?:[^()]|\([^()]*\))*?julianday\s*\([^()]*\)"
    r"(?:[^()]|\([^()]*\))*?)\s+AS\s+(INTEGER|SIGNED)\s*\)",
    re.IGNORECASE,
)
IS_NOT_LITERAL = re.compile(
    r"([A-Za-z_][A-Za-z0-9_.]*)\s+IS\s+NOT\s+"
    r"(?!NULL\b|TRUE\b|FALSE\b|UNKNOWN\b|DISTINCT\b)(\d+|N?'(?:[^']|'')*')",
    re.IGNORECASE,
)
IS_LITERAL = re.compile(
    r"([A-Za-z_][A-Za-z0-9_.]*)\s+IS\s+"
    r"(?!NOT\b|NULL\b|TRUE\b|FALSE\b|UNKNOWN\b|DISTINCT\b)(\d+|N?'(?:[^']|'')*')",
    re.IGNORECASE,
)
GLOB = re.compile(
    r"([A-Za-z_][A-Za-z0-9_.]*)\s+(NOT\s+)?GLOB\s+('(?:[^']|'')*')",
    re.IGNORECASE,
)
MISSING_GROUP_COLUMN = re.compile(
    r'column "([^"]+)" must appear in the GROUP BY clause',
    re.IGNORECASE,
)
GROUP_LIST_END = re.compile(
    r"\b(HAVING|WINDOW|ORDER\s+BY|LIMIT|OFFSET|UNION|INTERSECT|EXCEPT|FOR|RETURNING)\b",
    re.IGNORECASE,
)


def translate_glob_pattern(quoted: str) -> str:
    pattern = quoted[1:-1].replace("''", "'")
    pattern = pattern.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    pattern = pattern.replace("*", "%").replace("?", "_")
    return "'" + pattern.replace("'", "''") + "'"


def _rewrite_glob(match: re.Match[str]) -> str:
    return (
        f"{match.group(1)} {'NOT ' if match.group(2) else ''}"
        f"LIKE {translate_glob_pattern(match.group(3))}"
    )


def _rewrite_julianday_cast(match: re.Match[str]) -> str:
    return f"TRUNC({match.group(1).strip()})::integer"


def _rewrite_is_literals(text: str) -> str:
    text = replace_outside_strings(
        text,
        IS_NOT_LITERAL,
        lambda match: f"{match.group(1)} IS DISTINCT FROM {match.group(2)}",
    )
    return replace_outside_strings(
        text,
        IS_LITERAL,
        lambda match: f"{match.group(1)} IS NOT DISTINCT FROM {match.group(2)}",
    )


def normalize(sql: str) -> str:
    text = sql.strip().rstrip(";").rstrip()
    text = replace_function_name(text, "IFNULL", "COALESCE")
    text = replace_function_name(text, "NVL", "COALESCE")
    text = replace_outside_strings(text, JULIANDAY_CAST, _rewrite_julianday_cast)
    text = _rewrite_is_literals(text)
    text = replace_outside_strings(text, GLOB, _rewrite_glob)
    text = re.sub(
        r"\bLIMIT\s+(\d+)\s*,\s*(\d+)\s*$",
        lambda match: f"LIMIT {match.group(2)} OFFSET {match.group(1)}",
        text,
        flags=re.IGNORECASE,
    )
    text = re.sub(
        r"\bCAST\s*\(([\s\S]*?)\s+AS\s+SIGNED\s*\)",
        r"CAST(\1 AS INTEGER)",
        text,
        flags=re.IGNORECASE,
    )
    return text.strip()


def _depths(sql: str) -> list[int]:
    """Return the paren depth at every character, ignoring strings/comments."""
    depths = [0] * (len(sql) + 1)
    depth = 0
    index = 0
    while index < len(sql):
        char = sql[index]
        if char in ("'", '"'):
            end = _skip_quoted(sql, index)
            for cursor in range(index, end):
                depths[cursor] = depth
            index = end
            continue
        if sql.startswith("--", index):
            end = _skip_line_comment(sql, index)
            for cursor in range(index, end):
                depths[cursor] = depth
            index = end
            continue
        if sql.startswith("/*", index):
            end = _skip_block_comment(sql, index)
            for cursor in range(index, end):
                depths[cursor] = depth
            index = end
            continue
        depths[index] = depth
        if char == "(":
            depth += 1
        elif char == ")":
            depth = max(0, depth - 1)
        index += 1
    depths[len(sql)] = depth
    return depths


def add_group_by_column(sql: str, column: str, position: int) -> str:
    """Append a column to the group list of the block containing the error.

    SQLite and MariaDB allow selecting a joined-table column while grouping by
    another table's primary key. PostgreSQL only allows functional dependency
    within the grouped table, so the same query needs the extra column. Adding
    it is result-preserving for the curriculum's functionally dependent reads.
    """
    depths = _depths(sql)
    position = max(0, min(position, len(sql)))
    containing: list[tuple[int, int, int]] = []
    stack: list[tuple[int, int]] = []
    index = 0
    while index < len(sql):
        char = sql[index]
        if char in ("'", '"'):
            index = _skip_quoted(sql, index)
            continue
        if sql.startswith("--", index):
            index = _skip_line_comment(sql, index)
            continue
        if sql.startswith("/*", index):
            index = _skip_block_comment(sql, index)
            continue
        if char == "(":
            stack.append((index, depths[index]))
        elif char == ")" and stack:
            open_index, open_depth = stack.pop()
            if open_index < position <= index:
                containing.append((open_index + 1, index, open_depth + 1))
        index += 1
    containing.append((0, len(sql), 0))

    for block_start, block_end, block_depth in containing:
        group_index = -1
        for match in re.finditer(r"\bGROUP\s+BY\b", sql, re.IGNORECASE):
            if (
                block_start <= match.start() < block_end
                and depths[match.start()] == block_depth
            ):
                group_index = match.end()
        if group_index < 0:
            continue

        end = block_end
        for match in GROUP_LIST_END.finditer(sql, group_index, block_end):
            if depths[match.start()] == block_depth:
                end = match.start()
                break
        prefix = sql[:end].rstrip()
        suffix = sql[end:]
        if suffix and not suffix[0].isspace():
            suffix = f" {suffix}"
        separator = "" if prefix.endswith("(") else ", "
        return f"{prefix}{separator}{column}{suffix}"
    return sql


# --------------------------------------------------------------------------- #
# Output
# --------------------------------------------------------------------------- #
def format_decimal(value: Decimal) -> str:
    text = format(value, "f")
    if "." in text:
        text = text.rstrip("0")
        if text.endswith("."):
            text += "0"
    return text


def format_value(value) -> str:
    if value is None:
        return "\\N"
    if isinstance(value, bool):
        return "1" if value else "0"
    if isinstance(value, Decimal):
        return format_decimal(value)
    if isinstance(value, datetime):
        return value.isoformat(sep=" ")
    if isinstance(value, (date, clock_time)):
        return value.isoformat()
    if isinstance(value, (dict, list)):
        return json.dumps(value, separators=(",", ":"), ensure_ascii=False)
    return str(value)


def write_rows(rows) -> None:
    lines = ["\t".join(format_value(value) for value in row) for row in rows]
    sys.stdout.write("\n".join(lines))


# --------------------------------------------------------------------------- #
# Server lifecycle
# --------------------------------------------------------------------------- #
def _psql(
    socket_dir: str,
    *,
    user: str = "postgres",
    database: str = "postgres",
    args: list[str] | None = None,
    stdin: str | None = None,
    timeout: float = 60.0,
) -> subprocess.CompletedProcess:
    command = [
        PSQL,
        f"--host={socket_dir}",
        "--port=5432",
        f"--username={user}",
        f"--dbname={database}",
        "--no-password",
        "--quiet",
        "--no-align",
        "--tuples-only",
        "--set=ON_ERROR_STOP=1",
    ]
    command.extend(args or [])
    environment = dict(os.environ)
    environment.update({"PGCONNECT_TIMEOUT": "5", "PGTZ": "UTC"})
    return subprocess.run(
        command,
        input=stdin.encode("utf-8") if stdin is not None else None,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        timeout=timeout,
        check=False,
        env=environment,
    )


def _connect(socket_dir: str, user: str, database: str = "shop"):
    return psycopg2.connect(
        host=socket_dir,
        port=5432,
        dbname=database,
        user=user,
        connect_timeout=5,
        options="-c timezone=UTC",
    )


def _wait_for_server(process: subprocess.Popen, socket_dir: str, error_log: Path) -> None:
    deadline = time.monotonic() + START_TIMEOUT
    while time.monotonic() < deadline:
        if process.poll() is not None:
            break
        try:
            connection = _connect(socket_dir, "postgres", "postgres")
            connection.close()
            return
        except psycopg2.Error:
            time.sleep(0.05)
    detail = ""
    try:
        detail = error_log.read_text(encoding="utf-8", errors="replace")[-2000:]
    except OSError:
        pass
    raise SystemExit(f"postgres did not start\n{detail}".strip())


def _start_server(tmp: Path) -> tuple[subprocess.Popen, str]:
    datadir = tmp / "data"
    shutil.copytree(TEMPLATE, datadir)
    socket_dir = tmp / "socket"
    socket_dir.mkdir(mode=0o700)
    error_log = tmp / "postgres.log"
    if os.geteuid() == 0:
        for path in [tmp, *tmp.rglob("*")]:
            try:
                os.chown(path, 65534, 65534)
            except OSError:
                pass
    command = [
        POSTGRES,
        "-D",
        str(datadir),
        "-k",
        str(socket_dir),
        "-c",
        "listen_addresses=",
        "-c",
        "unix_socket_permissions=0700",
        "-c",
        "fsync=off",
        "-c",
        "synchronous_commit=off",
        "-c",
        "full_page_writes=off",
        "-c",
        "shared_buffers=16MB",
        "-c",
        "max_connections=20",
        "-c",
        "log_min_messages=warning",
        "-c",
        "logging_collector=off",
        "-c",
        "timezone=UTC",
    ]
    process = subprocess.Popen(
        command,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    _wait_for_server(process, str(socket_dir), error_log)
    return process, str(socket_dir)


def _stop_server(process: subprocess.Popen) -> None:
    if process.poll() is not None:
        return
    try:
        process.send_signal(signal.SIGINT)
        process.wait(timeout=10)
    except (ProcessLookupError, subprocess.TimeoutExpired):
        try:
            process.kill()
            process.wait(timeout=5)
        except (ProcessLookupError, subprocess.TimeoutExpired):
            pass


def _fail(message: str) -> None:
    sys.stderr.write(f"{message}\n")
    raise SystemExit(1)


def main() -> None:
    if len(sys.argv) != 2:
        _fail("usage: postgres-runner.py <query.sql>")
    query_path = sys.argv[1]
    submission = normalize(Path(query_path).read_text(encoding="utf-8"))
    if not submission:
        _fail("empty query")
    keyword = leading_keyword(submission)
    if keyword not in RESULT_KEYWORDS:
        _fail(
            f"only read-only SELECT queries are allowed (got {keyword or 'nothing'})"
        )
    if has_embedded_statement(submission):
        _fail("only a single SQL statement may be submitted")

    setup = sys.stdin.read()
    fixture = Path(FIXTURE).read_text(encoding="utf-8")
    tmp = Path(tempfile.mkdtemp(prefix="postgres-", dir="/tmp"))
    process = None
    try:
        process, socket_dir = _start_server(tmp)

        created = _psql(
            socket_dir,
            args=["--command", "CREATE DATABASE shop;"],
        )
        if created.returncode != 0:
            _fail(created.stderr.decode("utf-8", errors="replace"))

        loaded = _psql(socket_dir, database="shop", stdin=fixture)
        if loaded.returncode != 0:
            _fail(loaded.stderr.decode("utf-8", errors="replace"))

        if setup.strip():
            if FORBIDDEN_SETUP.search(strip_comments(setup)):
                _fail("setup scripts may only read and modify rows")
            connection = _connect(socket_dir, "postgres")
            try:
                with connection.cursor() as cursor:
                    cursor.execute("BEGIN")
                    cursor.execute("SET LOCAL ROLE judge_setup")
                    cursor.execute(setup)
                connection.commit()
            except psycopg2.Error as error:
                connection.rollback()
                _fail(str(error).strip())
            finally:
                connection.close()

        connection = _connect(socket_dir, "postgres")
        try:
            attempts = 0
            while True:
                try:
                    with connection.cursor() as cursor:
                        cursor.execute("BEGIN TRANSACTION READ ONLY")
                        cursor.execute("SET LOCAL ROLE judge_ro")
                        cursor.execute(submission)
                        rows = cursor.fetchall()
                    connection.rollback()
                    break
                except psycopg2.Error as error:
                    connection.rollback()
                    message = (
                        error.diag.message_primary
                        if getattr(error, "diag", None)
                        else None
                    ) or str(error)
                    missing = MISSING_GROUP_COLUMN.search(message)
                    if missing and attempts < 20:
                        position = int(
                            getattr(error.diag, "statement_position", None) or 0
                        )
                        rewritten = add_group_by_column(
                            submission, missing.group(1), position
                        )
                        if rewritten != submission:
                            submission = rewritten
                            attempts += 1
                            continue
                    _fail(str(error).strip())
        finally:
            connection.close()
        write_rows(rows)
    finally:
        if process is not None:
            _stop_server(process)
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
