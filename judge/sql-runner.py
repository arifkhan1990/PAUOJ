#!/usr/bin/env python3
"""SQL test runner: loads the ShopSphere fixture, runs one SELECT and prints TSV."""
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


def normalize(sql: str, dialect: str) -> str:
    text = sql.replace("`", "").strip().rstrip(";")
    text = re.sub(r"\bILIKE\b", "LIKE", text, flags=re.IGNORECASE)
    if dialect == "mysql":
        match = re.search(r"\bLIMIT\s+(\d+)\s*,\s*(\d+)\s*$", text, re.IGNORECASE)
        if match:
            offset, count = match.groups()
            text = re.sub(
                r"\bLIMIT\s+\d+\s*,\s*\d+\s*$",
                f"LIMIT {count} OFFSET {offset}",
                text,
                flags=re.IGNORECASE,
            )
    return text


def authorize(action, *_args):
    return sqlite3.SQLITE_OK if action in READ_ONLY else sqlite3.SQLITE_DENY


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: sql-runner.py <query.sql> <dialect>")
    query_path, dialect = sys.argv[1], sys.argv[2]

    connection = sqlite3.connect(":memory:")
    with open(FIXTURE, encoding="utf-8") as handle:
        connection.executescript(handle.read())

    extra = sys.stdin.read()
    if extra.strip():
        connection.executescript(extra)

    with open(query_path, encoding="utf-8") as handle:
        query = normalize(handle.read(), dialect)
    if not query.strip():
        raise SystemExit("empty query")

    connection.set_authorizer(authorize)
    cursor = connection.execute(query)
    rows = cursor.fetchall()
    lines = [
        "\t".join("\\N" if value is None else str(value) for value in row)
        for row in rows
    ]
    sys.stdout.write("\n".join(lines))


if __name__ == "__main__":
    main()
