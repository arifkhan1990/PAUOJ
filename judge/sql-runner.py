#!/usr/bin/env python3
"""SQL test runner: loads the ShopSphere fixture, runs one SELECT and prints TSV."""
import json
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


def json_text(value):
    if isinstance(value, bool):
        return "true" if value else "false"
    if value is None:
        return None
    if isinstance(value, (str, int, float)):
        return str(value)
    return json.dumps(value, separators=(",", ":"))


def json_unquote(value):
    if value is None:
        return None
    try:
        parsed = json.loads(str(value))
    except (TypeError, ValueError):
        return value
    return json_text(parsed)


def json_path_text(value, *keys):
    if value is None:
        return None
    try:
        parsed = json.loads(str(value))
    except (TypeError, ValueError):
        return None
    for key in keys:
        if not isinstance(parsed, dict):
            return None
        parsed = parsed.get(str(key))
    return json_text(parsed)


def substring(value, start, length=None):
    text = str(value)
    index = int(start) - 1
    if length is None:
        return text[index:]
    return text[index : index + int(length)]


CAST_TYPES = re.compile(
    r"\s*((?:double\s+precision|character\s+varying|"
    r"timestamp\s+with\s+time\s+zone|timestamptz|timestamp|"
    r"smallint|bigint|integer|numeric|decimal|boolean|varchar|"
    r"real|text|bool|date|time|jsonb|json|int)"
    r"(?:\s*\(\s*\d+(?:\s*,\s*\d+)?\s*\))?)"
    r"(?![A-Za-z0-9_])",
    re.IGNORECASE,
)


def strip_backticks(sql: str) -> str:
    """Remove MySQL identifier backticks without touching string literals."""
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
        elif char != "`":
            result.append(char)
        index += 1
    return "".join(result)


def outside_quotes(sql: str, position: int) -> bool:
    quote = None
    index = 0
    while index < position:
        char = sql[index]
        if quote:
            if char == quote:
                if index + 1 < position and sql[index + 1] == quote:
                    index += 2
                    continue
                quote = None
        elif char in ("'", '"'):
            quote = char
        index += 1
    return quote is None


def expression_start(sql: str, end: int) -> int:
    """Find the start of the expression immediately before a Postgres ::."""
    index = end - 1
    while index >= 0 and sql[index].isspace():
        index -= 1
    if index < 0:
        return end
    if sql[index] == ")":
        depth = 0
        cursor = index
        while cursor >= 0:
            if sql[cursor] == ")":
                depth += 1
            elif sql[cursor] == "(":
                depth -= 1
                if depth == 0:
                    break
            cursor -= 1
        if cursor < 0:
            return end
        name_end = cursor - 1
        if name_end >= 0 and (sql[name_end].isalnum() or sql[name_end] in "_.$"):
            while name_end >= 0 and (
                sql[name_end].isalnum() or sql[name_end] in "_.$"
            ):
                name_end -= 1
            return name_end + 1
        return cursor
    if sql[index] in ("'", '"'):
        quote = sql[index]
        cursor = index - 1
        while cursor >= 0:
            if sql[cursor] == quote:
                if cursor > 0 and sql[cursor - 1] == quote:
                    cursor -= 2
                    continue
                return cursor
            cursor -= 1
        return 0
    if sql[index].isalnum() or sql[index] in "_.$":
        while index >= 0 and (sql[index].isalnum() or sql[index] in "_.$"):
            index -= 1
        return index + 1
    return index


def normalize_casts_once(sql: str) -> str:
    result = []
    cursor = 0
    for match in CAST_TYPES.finditer(sql):
        if sql[match.start() - 2 : match.start()] != "::":
            continue
        if not outside_quotes(sql, match.start()):
            continue
        start = expression_start(sql, match.start() - 2)
        if start < cursor:
            continue
        expression = sql[start : match.start() - 2].strip()
        if not expression:
            continue
        result.append(sql[cursor:start])
        target = match.group(1)
        # SQLite's JSON operators work on the original text, not CAST(... AS json).
        if target.lower() in ("json", "jsonb"):
            result.append(expression)
        else:
            result.append(f"CAST({expression} AS {target})")
        cursor = match.end()
    result.append(sql[cursor:])
    return "".join(result)


def normalize_casts(sql: str) -> str:
    for _ in range(3):
        normalized = normalize_casts_once(sql)
        if normalized == sql:
            return normalized
        sql = normalized
    return sql


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


def normalize_json_operators(sql: str) -> str:
    pattern = re.compile(r"(\b\w+(?:\.\w+)*|\([^()]*\))\s*->>\s*'([^']+)'")

    def replace(match: re.Match) -> str:
        if not outside_quotes(sql, match.start()):
            return match.group(0)
        return f"jsonb_extract_path_text({match.group(1)}, '{match.group(2)}')"

    return pattern.sub(replace, sql)


def normalize(sql: str, dialect: str) -> str:
    text = strip_backticks(sql).strip().rstrip(";")
    text = re.sub(r"\bILIKE\b", "LIKE", text, flags=re.IGNORECASE)
    text = re.sub(
        r"\bFETCH\s+(?:FIRST|NEXT)\s+(\d+)\s+ROWS?\s+ONLY\b",
        r"LIMIT \1",
        text,
        flags=re.IGNORECASE,
    )
    text = normalize_extract(text)
    text = normalize_casts(text)
    if dialect in ("mysql", "postgresql"):
        text = normalize_json_operators(text)
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
    connection.create_function("json_unquote", 1, json_unquote)
    connection.create_function("jsonb_extract_path_text", -1, json_path_text)
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
