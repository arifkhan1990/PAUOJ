#!/usr/bin/env python3
"""SQL test runner: loads the ShopSphere fixture, runs the submitted SQL and prints TSV.

By default the submission must be one read-only SELECT. With ``--script`` the
submission may be a multi-statement script (DDL/DML/transactions) that runs
against the in-memory fixture; the last statement must be a SELECT/EXPLAIN and
its rows are printed.
"""
import os
import re
import sqlite3
import sys

FIXTURE = os.environ.get("SHOPSPHERE_SQL") or os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "shopsphere.sql"
)
READ_ONLY = {
    sqlite3.SQLITE_SELECT,
    sqlite3.SQLITE_READ,
    sqlite3.SQLITE_FUNCTION,
    sqlite3.SQLITE_RECURSIVE,
}

# Script mode allows writes, DDL and transactions inside the in-memory fixture.
# ATTACH/DETACH/PRAGMA and virtual tables stay denied so a submission cannot
# reach the filesystem or reconfigure the connection.
SCRIPT_ACTIONS = frozenset(
    {
        sqlite3.SQLITE_SELECT,
        sqlite3.SQLITE_READ,
        sqlite3.SQLITE_FUNCTION,
        sqlite3.SQLITE_RECURSIVE,
        sqlite3.SQLITE_INSERT,
        sqlite3.SQLITE_UPDATE,
        sqlite3.SQLITE_DELETE,
        sqlite3.SQLITE_CREATE_INDEX,
        sqlite3.SQLITE_CREATE_TABLE,
        sqlite3.SQLITE_CREATE_TEMP_INDEX,
        sqlite3.SQLITE_CREATE_TEMP_TABLE,
        sqlite3.SQLITE_CREATE_TEMP_TRIGGER,
        sqlite3.SQLITE_CREATE_TEMP_VIEW,
        sqlite3.SQLITE_CREATE_TRIGGER,
        sqlite3.SQLITE_CREATE_VIEW,
        sqlite3.SQLITE_DROP_INDEX,
        sqlite3.SQLITE_DROP_TABLE,
        sqlite3.SQLITE_DROP_TEMP_INDEX,
        sqlite3.SQLITE_DROP_TEMP_TABLE,
        sqlite3.SQLITE_DROP_TEMP_TRIGGER,
        sqlite3.SQLITE_DROP_TEMP_VIEW,
        sqlite3.SQLITE_DROP_TRIGGER,
        sqlite3.SQLITE_DROP_VIEW,
        sqlite3.SQLITE_ALTER_TABLE,
        # CREATE INDEX reports REINDEX for the new index; it is in-memory only.
        sqlite3.SQLITE_REINDEX,
        sqlite3.SQLITE_TRANSACTION,
        sqlite3.SQLITE_SAVEPOINT,
    }
)

RESULT_KEYWORDS = frozenset({"SELECT", "WITH", "VALUES", "EXPLAIN"})

from sql_compat import normalize, register_functions


def authorize(action, *_args):
    return sqlite3.SQLITE_OK if action in READ_ONLY else sqlite3.SQLITE_DENY


def authorize_script(action, *_args):
    return sqlite3.SQLITE_OK if action in SCRIPT_ACTIONS else sqlite3.SQLITE_DENY


def strip_comments(sql: str) -> str:
    """Remove SQL comments outside string literals, keeping the statement text."""
    result = []
    quote = None
    index = 0
    while index < len(sql):
        char = sql[index]
        if quote:
            result.append(char)
            if char == quote:
                if index + 1 < len(sql) and sql[index + 1] == quote:
                    result.append(sql[index + 1])
                    index += 2
                    continue
                quote = None
            index += 1
            continue
        if char in ("'", '"'):
            quote = char
            result.append(char)
            index += 1
            continue
        if sql.startswith("--", index):
            newline = sql.find("\n", index)
            index = len(sql) if newline == -1 else newline
            continue
        if sql.startswith("/*", index):
            closing = sql.find("*/", index + 2)
            index = len(sql) if closing == -1 else closing + 2
            continue
        result.append(char)
        index += 1
    return "".join(result)


def leading_keyword(statement: str) -> str:
    match = re.match(r"[A-Za-z]+", strip_comments(statement).strip())
    return match.group(0).upper() if match else ""


def split_statements(script: str) -> list[str]:
    """Split a script on statement boundaries using SQLite's own parser."""
    statements = []
    buffer = ""
    for char in script:
        buffer += char
        if char == ";" and sqlite3.complete_statement(buffer):
            statements.append(buffer)
            buffer = ""
    if buffer.strip():
        statements.append(buffer)
    return [statement for statement in statements if leading_keyword(statement)]


def write_rows(rows) -> None:
    lines = [
        "\t".join("\\N" if value is None else str(value) for value in row)
        for row in rows
    ]
    sys.stdout.write("\n".join(lines))


def run_script(connection: sqlite3.Connection, script: str, dialect: str):
    """Run a multi-statement script and return rows of the last result statement."""
    statements = split_statements(script)
    if not statements:
        raise SystemExit("empty script")
    if leading_keyword(statements[-1]) not in RESULT_KEYWORDS:
        raise SystemExit("script must end with a SELECT or EXPLAIN statement")

    connection.isolation_level = None
    connection.set_authorizer(authorize_script)
    rows = None
    try:
        for statement in statements:
            query = normalize(statement, dialect)
            if not query.strip():
                continue
            cursor = connection.execute(query)
            if cursor.description is not None:
                rows = cursor.fetchall()
    except sqlite3.Error as error:
        raise SystemExit(f"script error: {error}") from error
    finally:
        connection.set_authorizer(None)

    if rows is None:
        raise SystemExit("script produced no result rows")
    return rows


def main() -> None:
    args = sys.argv[1:]
    script_mode = False
    if args and args[-1] == "--script":
        script_mode = True
        args = args[:-1]
    if len(args) != 2:
        raise SystemExit("usage: sql-runner.py <query.sql> <dialect> [--script]")
    query_path, dialect = args

    connection = sqlite3.connect(":memory:")
    register_functions(connection)
    with open(FIXTURE, encoding="utf-8") as handle:
        connection.executescript(handle.read())

    extra = sys.stdin.read()
    if extra.strip():
        # Setup (including custom-run stdin) may write rows, but it must not
        # ATTACH a database, change PRAGMAs or open a virtual table.
        connection.set_authorizer(authorize_script)
        try:
            connection.executescript(extra)
        finally:
            connection.set_authorizer(None)

    with open(query_path, encoding="utf-8") as handle:
        submission = handle.read()

    if script_mode:
        write_rows(run_script(connection, submission, dialect))
        return

    query = normalize(submission, dialect)
    if not query.strip():
        raise SystemExit("empty query")

    connection.set_authorizer(authorize)
    cursor = connection.execute(query)
    write_rows(cursor.fetchall())


if __name__ == "__main__":
    main()
