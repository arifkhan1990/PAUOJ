#!/usr/bin/env python3
"""SQL test runner: loads the ShopSphere fixture, runs one SELECT and prints TSV."""
import os
import re
import sqlite3
import sys
from datetime import datetime

FIXTURE = os.environ.get("SHOPSPHERE_SQL") or os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "shopsphere.sql"
)
READ_ONLY = {
    sqlite3.SQLITE_SELECT,
    sqlite3.SQLITE_READ,
    sqlite3.SQLITE_FUNCTION,
    sqlite3.SQLITE_RECURSIVE,
}

DATE_FORMATS = ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d")


def parse_date(value):
    if value is None:
        return None
    text = str(value)
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(text[:19], fmt)
        except ValueError:
            continue
    return None


def concat(*values):
    return "".join("" if value is None else str(value) for value in values)


def concat_ws(separator, *values):
    return str(separator).join(
        str(value) for value in values if value is not None
    )


def mysql_if(condition, when_true, when_false):
    return when_true if condition else when_false


def greatest(*values):
    present = [value for value in values if value is not None]
    return max(present) if present else None


def least(*values):
    present = [value for value in values if value is not None]
    return min(present) if present else None


def date_part(part, value):
    parsed = parse_date(value)
    if parsed is None:
        text = str(value or "")
        return int(text[0:4]) if part == "year" and len(text) >= 4 else None
    return {
        "year": parsed.year,
        "month": parsed.month,
        "day": parsed.day,
    }[part]


MYSQL_TOKENS = {
    "%Y": "%Y",
    "%y": "%y",
    "%m": "%m",
    "%c": "%m",
    "%M": "%B",
    "%b": "%b",
    "%d": "%d",
    "%e": "%d",
    "%H": "%H",
    "%h": "%I",
    "%i": "%M",
    "%s": "%S",
    "%S": "%S",
}


def date_format(value, fmt):
    parsed = parse_date(value)
    if parsed is None:
        return None
    translated = re.sub(
        r"%[A-Za-z]",
        lambda match: MYSQL_TOKENS.get(match.group(0), match.group(0)),
        fmt,
    )
    return parsed.strftime(translated)


def to_char(value, fmt):
    parsed = parse_date(value)
    if parsed is None:
        return None
    translated = fmt
    for token, directive in (
        ("HH24", "%H"),
        ("YYYY", "%Y"),
        ("MONTH", "%B"),
        ("Month", "%B"),
        ("MON", "%b"),
        ("Mon", "%b"),
        ("YY", "%y"),
        ("MM", "%m"),
        ("DD", "%d"),
        ("MI", "%M"),
        ("SS", "%S"),
    ):
        translated = translated.replace(token, directive)
    return parsed.strftime(translated)


def date_trunc(unit, value):
    parsed = parse_date(value)
    if parsed is None:
        return None
    unit = str(unit).lower()
    if unit == "year":
        truncated = parsed.replace(month=1, day=1, hour=0, minute=0, second=0)
    elif unit == "month":
        truncated = parsed.replace(day=1, hour=0, minute=0, second=0)
    else:
        truncated = parsed.replace(hour=0, minute=0, second=0)
    return truncated.strftime("%Y-%m-%d %H:%M:%S")


def now():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def substring(value, start, length=None):
    text = str(value)
    index = int(start) - 1
    if length is None:
        return text[index:]
    return text[index : index + int(length)]


def normalize_casts(sql: str) -> str:
    return re.sub(
        r"(\b\w+\s*\([^()]*\)|\b[\w.]+|'[^']*'|\d+|\([^()]*\))\s*::\s*"
        r"(int|integer|bigint|smallint|text|varchar|numeric|decimal|real|boolean)\b",
        r"CAST(\1 AS \2)",
        sql,
        flags=re.IGNORECASE,
    )


def normalize_extract(sql: str) -> str:
    directives = {"YEAR": "%Y", "MONTH": "%m", "DAY": "%d"}

    def replace(match: re.Match) -> str:
        part = match.group(1).upper()
        return (
            f"CAST(strftime('{directives[part]}', "
            f"{match.group(2).strip()}) AS INTEGER)"
        )

    return re.sub(
        r"EXTRACT\s*\(\s*(YEAR|MONTH|DAY)\s+FROM\s+([^()]+?)\s*\)",
        replace,
        sql,
        flags=re.IGNORECASE,
    )


def normalize(sql: str, dialect: str) -> str:
    text = sql.replace("`", "").strip().rstrip(";")
    text = re.sub(r"\bILIKE\b", "LIKE", text, flags=re.IGNORECASE)
    text = re.sub(
        r"\bFETCH\s+(?:FIRST|NEXT)\s+(\d+)\s+ROWS?\s+ONLY\b",
        r"LIMIT \1",
        text,
        flags=re.IGNORECASE,
    )
    text = normalize_extract(text)
    text = normalize_casts(text)
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


def register_functions(connection: sqlite3.Connection) -> None:
    """Common MySQL/PostgreSQL functions that SQLite does not ship."""
    connection.create_function("concat", -1, concat)
    connection.create_function("concat_ws", -1, concat_ws)
    connection.create_function("if", 3, mysql_if)
    connection.create_function("greatest", -1, greatest)
    connection.create_function("least", -1, least)
    connection.create_function("year", 1, lambda value: date_part("year", value))
    connection.create_function("month", 1, lambda value: date_part("month", value))
    connection.create_function("day", 1, lambda value: date_part("day", value))
    connection.create_function("date_format", 2, date_format)
    connection.create_function("to_char", 2, to_char)
    connection.create_function("date_trunc", 2, date_trunc)
    connection.create_function("now", 0, now)
    connection.create_function("char_length", 1, lambda value: len(str(value)))
    connection.create_function("substring", 2, substring)
    connection.create_function("substring", 3, substring)


def authorize(action, *_args):
    return sqlite3.SQLITE_OK if action in READ_ONLY else sqlite3.SQLITE_DENY


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: sql-runner.py <query.sql> <dialect>")
    query_path, dialect = sys.argv[1], sys.argv[2]

    connection = sqlite3.connect(":memory:")
    register_functions(connection)
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
