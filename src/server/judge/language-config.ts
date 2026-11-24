import type { JudgeLanguage } from "./types";

export const LANGUAGE_SOURCE: Record<JudgeLanguage, string> = {
  c: "main.c",
  cpp: "main.cpp",
  python: "main.py",
  javascript: "main.js",
  java: "Main.java",
  csharp: "main.cs",
  go: "main.go",
  php: "main.php",
  kotlin: "Main.kt",
  swift: "main.swift",
  sql: "main.sql",
  sqlite: "main.sql",
  mysql: "main.sql",
  postgresql: "main.sql",
};

export const COMPILE_COMMANDS: Record<JudgeLanguage, string[]> = {
  c: ["gcc", "-O2", "-std=c17", "-pipe", "-o", "main", "main.c"],
  cpp: ["g++", "-O2", "-std=c++20", "-pipe", "-o", "main", "main.cpp"],
  python: [
    "python3",
    "-c",
    'compile(open("/work/main.py", encoding="utf-8").read(), "main.py", "exec")',
  ],
  javascript: ["node", "--check", "main.js"],
  java: ["javac", "-encoding", "UTF-8", "Main.java"],
  csharp: ["mcs", "-optimize+", "-out:main.exe", "main.cs"],
  go: ["go", "build", "-o", "main", "main.go"],
  php: ["php", "-l", "main.php"],
  kotlin: ["kotlinc", "Main.kt", "-include-runtime", "-d", "main.jar"],
  swift: ["swiftc", "-O", "-o", "main", "main.swift"],
  sql: ["python3", "-c", "import sqlite3"],
  sqlite: ["python3", "-c", "import sqlite3"],
  mysql: ["mariadb", "--version"],
  postgresql: ["python3", "-c", "import psycopg2"],
};

export const COMPILE_MEMORY_MB = 1024;
export const COMPILE_OUTPUT_CAP = 16_384;

const MEMORY_OVERHEAD: Record<JudgeLanguage, number> = {
  c: 48,
  cpp: 48,
  python: 96,
  javascript: 160,
  java: 448,
  csharp: 256,
  go: 128,
  php: 96,
  kotlin: 512,
  sql: 64,
  sqlite: 64,
  // MariaDB's baseline RSS with tiny InnoDB buffers is ~120 MB; a real
  // PostgreSQL 15 server plus psycopg2 is ~50 MB.
  mysql: 256,
  postgresql: 96,
  swift: 256,
};

export function memoryWithOverhead(
  language: JudgeLanguage,
  memoryMb: number,
): number {
  return Math.min(2048, Math.max(192, memoryMb + MEMORY_OVERHEAD[language]));
}

/** Server boot time is part of each SQL test's wall clock. */
export function startupAllowanceMs(language: JudgeLanguage): number {
  if (language === "mysql") return 6_000;
  if (language === "postgresql") return 3_000;
  return 0;
}

/** MariaDB and PostgreSQL need a writable data directory and more files. */
export function runtimeResourceOverrides(language: JudgeLanguage): {
  tmpfsSizeMb: number;
  noFileLimit: number;
} {
  if (language === "mysql") return { tmpfsSizeMb: 256, noFileLimit: 512 };
  if (language === "postgresql") return { tmpfsSizeMb: 128, noFileLimit: 256 };
  return { tmpfsSizeMb: 64, noFileLimit: 128 };
}
