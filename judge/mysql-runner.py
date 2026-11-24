#!/usr/bin/env python3
"""MariaDB/MySQL test runner.

The judge image ships a pre-initialized MariaDB data directory in
``/opt/mysql-template``. For every test we copy that template to /tmp, start a
private mariadbd on a unix socket (no networking, no binary log), load the
ShopSphere MySQL fixture, apply the per-test setup script from stdin, and run
the submitted statement as a SELECT-only user. Output is TSV, byte-for-byte
compatible with sql-runner.py: no header, no trailing newline, ``\\N`` for NULL.

Usage: mysql-runner.py <query.sql>
"""
from __future__ import annotations

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

import MySQLdb

TEMPLATE = os.environ.get("MYSQL_TEMPLATE") or "/opt/mysql-template"
FIXTURE = os.environ.get("SHOPSPHERE_MYSQL_SQL") or os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "shopsphere.mysql.sql"
)
MARIADBD = shutil.which("mariadbd") or "/usr/sbin/mariadbd"
CLIENT = shutil.which("mariadb") or shutil.which("mysql") or "/usr/bin/mariadb"
START_TIMEOUT = 20.0
RESULT_KEYWORDS = {"SELECT", "WITH", "VALUES", "TABLE", "EXPLAIN"}
JUDGE_USER = "judge_ro"
JUDGE_PASSWORD = "judge_ro"
SETUP_USER = "judge_setup"
SETUP_PASSWORD = "judge_setup"


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
        if char in ("'", '"', "`"):
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
        if char in ("'", '"', "`"):
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


def matching_paren(sql: str, open_index: int) -> int:
    depth = 0
    index = open_index
    while index < len(sql):
        char = sql[index]
        if char in ("'", '"', "`"):
            index = _skip_quoted(sql, index)
            continue
        if sql.startswith("--", index):
            index = _skip_line_comment(sql, index)
            continue
        if sql.startswith("/*", index):
            index = _skip_block_comment(sql, index)
            continue
        if char == "(":
            depth += 1
        elif char == ")":
            depth -= 1
            if depth == 0:
                return index
        index += 1
    return -1


def replace_outside_strings(sql: str, pattern: re.Pattern[str], replacement) -> str:
    output: list[str] = []
    index = 0
    while index < len(sql):
        char = sql[index]
        if char in ("'", '"', "`"):
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


JSON_EXTRACT = re.compile(r"(?<![A-Za-z0-9_$])json_extract\s*\(", re.IGNORECASE)
TO_CHAR = re.compile(r"(?<![A-Za-z0-9_$])to_char\s*\(", re.IGNORECASE)
GLOB = re.compile(
    r"([A-Za-z_][A-Za-z0-9_.]*)\s+(NOT\s+)?GLOB\s+('(?:[^']|'')*')",
    re.IGNORECASE,
)
IS_NOT_LITERAL = re.compile(
    r"([A-Za-z_][A-Za-z0-9_.]*)\s+IS\s+NOT\s+"
    r"(?!NULL\b|TRUE\b|FALSE\b|UNKNOWN\b)(\d+|N?'(?:[^']|'')*')",
    re.IGNORECASE,
)
IS_LITERAL = re.compile(
    r"([A-Za-z_][A-Za-z0-9_.]*)\s+IS\s+"
    r"(?!NOT\b|NULL\b|TRUE\b|FALSE\b|UNKNOWN\b)(\d+|N?'(?:[^']|'')*')",
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


def _rewrite_is_literals(text: str) -> str:
    text = replace_outside_strings(
        text,
        IS_NOT_LITERAL,
        lambda match: f"NOT ({match.group(1)} <=> {match.group(2)})",
    )
    return replace_outside_strings(
        text,
        IS_LITERAL,
        lambda match: f"({match.group(1)} <=> {match.group(2)})",
    )


def normalize(sql: str) -> str:
    text = sql.strip().rstrip(";").rstrip()
    text = replace_outside_strings(
        text, JSON_EXTRACT, lambda _m: "judge_json_extract("
    )
    # MariaDB ships a native TO_CHAR whose precedence beats a stored function,
    # so route the PostgreSQL-shaped text overload to our helper explicitly.
    text = replace_outside_strings(text, TO_CHAR, lambda _m: "judge_to_char(")
    text = _rewrite_casts(text)
    text = _rewrite_is_literals(text)
    text = replace_outside_strings(text, GLOB, _rewrite_glob)
    return text.strip()


CAST_OPEN = re.compile(r"(?<![A-Za-z0-9_$])CAST\s*\(", re.IGNORECASE)
CAST_TYPE = re.compile(
    r"\s+AS\s+(INTEGER|SIGNED|REAL|DOUBLE|TEXT|CHAR(?:ACTER)?|BOOLEAN)\s*$",
    re.IGNORECASE,
)


def _rewrite_casts(sql: str) -> str:
    """Map SQLite/PostgreSQL cast spellings to MariaDB and preserve truncation.

    MariaDB rounds when casting a decimal to SIGNED, while SQLite truncates.
    ``CAST(julianday(...) - julianday(...) AS INTEGER)`` therefore becomes
    ``TRUNCATE(expression, 0)``.
    """
    current = sql
    for _ in range(8):
        changed = False
        output: list[str] = []
        index = 0
        while index < len(current):
            char = current[index]
            if char in ("'", '"', "`"):
                end = _skip_quoted(current, index)
                output.append(current[index:end])
                index = end
                continue
            if current.startswith("--", index):
                end = _skip_line_comment(current, index)
                output.append(current[index:end])
                index = end
                continue
            if current.startswith("/*", index):
                end = _skip_block_comment(current, index)
                output.append(current[index:end])
                index = end
                continue
            match = CAST_OPEN.match(current, index)
            if match:
                open_index = match.end() - 1
                close_index = matching_paren(current, open_index)
                if close_index != -1:
                    inner = current[open_index + 1 : close_index]
                    type_match = CAST_TYPE.search(inner)
                    if type_match:
                        expression = inner[: type_match.start()].strip()
                        target = type_match.group(1).upper()
                        if target in ("INTEGER", "SIGNED", "BOOLEAN"):
                            if re.search(r"julianday\s*\(", expression, re.IGNORECASE):
                                output.append(
                                    f"CAST(TRUNCATE({expression}, 0) AS SIGNED)"
                                )
                            else:
                                output.append(f"CAST({expression} AS SIGNED)")
                        elif target in ("REAL", "DOUBLE"):
                            output.append(f"CAST({expression} AS DOUBLE)")
                        else:
                            output.append(f"CAST({expression} AS CHAR)")
                        index = close_index + 1
                        changed = True
                        continue
                    output.append(current[index : close_index + 1])
                    index = close_index + 1
                    continue
            output.append(char)
            index += 1
        current = "".join(output)
        if not changed:
            break
    return current


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
    if isinstance(value, bytes):
        try:
            return value.decode("utf-8")
        except UnicodeDecodeError:
            return value.hex()
    return str(value)


def write_rows(rows) -> None:
    lines = ["\t".join(format_value(value) for value in row) for row in rows]
    sys.stdout.write("\n".join(lines))


# --------------------------------------------------------------------------- #
# Server lifecycle
# --------------------------------------------------------------------------- #
def _client(
    socket_path: str,
    *,
    user: str = "root",
    password: str | None = None,
    database: str | None = None,
    args: list[str] | None = None,
    stdin: str | None = None,
    timeout: float = 30.0,
) -> subprocess.CompletedProcess:
    command = [
        CLIENT,
        f"--socket={socket_path}",
        f"--user={user}",
        "--batch",
        "--skip-column-names",
        "--default-character-set=utf8mb4",
    ]
    if database:
        command.append(database)
    command.extend(args or [])
    environment = dict(os.environ)
    if password is not None:
        # Keep the password out of the process argument list.
        environment["MYSQL_PWD"] = password
    return subprocess.run(
        command,
        input=stdin.encode("utf-8") if stdin is not None else None,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        timeout=timeout,
        check=False,
        env=environment,
    )


def _wait_for_socket(process: subprocess.Popen, socket_path: str, error_log: Path) -> None:
    deadline = time.monotonic() + START_TIMEOUT
    while time.monotonic() < deadline:
        if process.poll() is not None:
            break
        if os.path.exists(socket_path):
            probe = _client(
                socket_path, args=["--execute", "SELECT 1"], timeout=5.0
            )
            if probe.returncode == 0:
                return
        time.sleep(0.05)
    detail = ""
    try:
        detail = error_log.read_text(encoding="utf-8", errors="replace")[-2000:]
    except OSError:
        pass
    raise SystemExit(f"mariadbd did not start\n{detail}".strip())


def _start_server(tmp: Path) -> tuple[subprocess.Popen, str]:
    datadir = tmp / "data"
    shutil.copytree(TEMPLATE, datadir)
    socket_path = str(tmp / "mysql.sock")
    pid_file = str(tmp / "mysql.pid")
    error_log = tmp / "error.log"
    tmp_dir = tmp / "tmp"
    file_dir = tmp / "files"
    tmp_dir.mkdir(mode=0o700)
    file_dir.mkdir(mode=0o700)
    if os.geteuid() == 0:
        for path in [tmp, *tmp.rglob("*")]:
            try:
                os.chown(path, 65534, 65534)
            except OSError:
                pass

    command = [
        MARIADBD,
        f"--datadir={datadir}",
        f"--socket={socket_path}",
        f"--pid-file={pid_file}",
        f"--tmpdir={tmp_dir}",
        f"--secure-file-priv={file_dir}",
        f"--log-error={error_log}",
        "--skip-networking",
        "--skip-log-bin",
        "--skip-name-resolve",
        "--local-infile=0",
        "--performance-schema=OFF",
        "--max-connections=10",
        "--innodb-buffer-pool-size=8M",
        "--innodb-log-file-size=4M",
        "--key-buffer-size=8M",
        "--aria-pagecache-buffer-size=8M",
    ]
    if os.geteuid() == 0:
        command.append("--user=nobody")

    process = subprocess.Popen(
        command,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    _wait_for_socket(process, socket_path, error_log)
    return process, socket_path


def _stop_server(process: subprocess.Popen) -> None:
    if process.poll() is not None:
        return
    try:
        process.send_signal(signal.SIGTERM)
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
        _fail("usage: mysql-runner.py <query.sql>")
    query_path = sys.argv[1]
    submission = normalize(Path(query_path).read_text(encoding="utf-8"))
    if not submission:
        _fail("empty query")
    keyword = leading_keyword(submission)
    if keyword not in RESULT_KEYWORDS:
        _fail(f"only read-only SELECT queries are allowed (got {keyword or 'nothing'})")
    if has_embedded_statement(submission):
        _fail("only a single SQL statement may be submitted")
    if re.search(r"\bINTO\s+(OUTFILE|DUMPFILE)\b", strip_comments(submission), re.IGNORECASE):
        _fail("writing files from SQL is not allowed")
    if re.search(r"\bFOR\s+UPDATE\b|\bLOCK\s+IN\s+SHARE\s+MODE\b", strip_comments(submission), re.IGNORECASE):
        _fail("locking reads are not allowed")
    if re.search(r"\bLOAD_FILE\s*\(", strip_comments(submission), re.IGNORECASE):
        _fail("reading files from SQL is not allowed")

    setup = sys.stdin.read()
    fixture = Path(FIXTURE).read_text(encoding="utf-8")
    tmp = Path(tempfile.mkdtemp(prefix="mysql-", dir="/tmp"))
    process = None
    try:
        process, socket_path = _start_server(tmp)

        created = _client(
            socket_path,
            args=[
                "--execute",
                "CREATE DATABASE shop CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;",
            ],
        )
        if created.returncode != 0:
            _fail(created.stderr.decode("utf-8", errors="replace"))

        loaded = _client(socket_path, database="shop", stdin=fixture, timeout=60.0)
        if loaded.returncode != 0:
            _fail(loaded.stderr.decode("utf-8", errors="replace"))

        granted = _client(
            socket_path,
            args=[
                "--execute",
                f"CREATE USER '{SETUP_USER}'@'localhost' IDENTIFIED BY '{SETUP_PASSWORD}';"
                f" GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON shop.* TO '{SETUP_USER}'@'localhost';"
                f" CREATE USER '{JUDGE_USER}'@'localhost' IDENTIFIED BY '{JUDGE_PASSWORD}';"
                f" GRANT SELECT, EXECUTE ON shop.* TO '{JUDGE_USER}'@'localhost';",
            ],
        )
        if granted.returncode != 0:
            _fail(granted.stderr.decode("utf-8", errors="replace"))

        if setup.strip():
            applied = _client(
                socket_path,
                user=SETUP_USER,
                password=SETUP_PASSWORD,
                database="shop",
                stdin=setup,
            )
            if applied.returncode != 0:
                _fail(applied.stderr.decode("utf-8", errors="replace"))

        connection = MySQLdb.connect(
            unix_socket=socket_path,
            user=JUDGE_USER,
            passwd=JUDGE_PASSWORD,
            db="shop",
            charset="utf8mb4",
            connect_timeout=10,
        )
        try:
            cursor = connection.cursor()
            cursor.execute(
                "SET SESSION sql_mode=CONCAT(@@sql_mode, ',PIPES_AS_CONCAT')"
            )
            cursor.execute("START TRANSACTION READ ONLY")
            cursor.execute(submission)
            rows = cursor.fetchall()
            connection.rollback()
        except MySQLdb.Error as error:
            connection.rollback()
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
