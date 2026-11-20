export const LANGUAGES = [
  {
    id: "cpp",
    label: "C++ 20",
    shortLabel: "C++",
    extension: "main.cpp",
    monaco: "cpp",
    shiki: "cpp",
    compiler: "GCC 12",
  },
  {
    id: "c",
    label: "C 17",
    shortLabel: "C",
    extension: "main.c",
    monaco: "c",
    shiki: "c",
    compiler: "GCC 12",
  },
  {
    id: "python",
    label: "Python 3.11",
    shortLabel: "Python",
    extension: "main.py",
    monaco: "python",
    shiki: "python",
    compiler: "CPython 3.11",
  },
  {
    id: "java",
    label: "Java 17",
    shortLabel: "Java",
    extension: "Main.java",
    monaco: "java",
    shiki: "java",
    compiler: "OpenJDK 17",
  },
  {
    id: "javascript",
    label: "JavaScript (Node 24)",
    shortLabel: "JavaScript",
    extension: "main.js",
    monaco: "javascript",
    shiki: "javascript",
    compiler: "Node.js 24",
  },
  {
    id: "csharp",
    label: "C# (Mono 6)",
    shortLabel: "C#",
    extension: "main.cs",
    monaco: "csharp",
    shiki: "csharp",
    compiler: "Mono 6.8",
  },
  {
    id: "go",
    label: "Go 1.19",
    shortLabel: "Go",
    extension: "main.go",
    monaco: "go",
    shiki: "go",
    compiler: "Go 1.19",
  },
  {
    id: "php",
    label: "PHP 8.2",
    shortLabel: "PHP",
    extension: "main.php",
    monaco: "php",
    shiki: "php",
    compiler: "PHP 8.2",
  },
  {
    id: "kotlin",
    label: "Kotlin 1.3",
    shortLabel: "Kotlin",
    extension: "Main.kt",
    monaco: "kotlin",
    shiki: "kotlin",
    compiler: "Kotlin 1.3",
  },
  {
    id: "swift",
    label: "Swift 5",
    shortLabel: "Swift",
    extension: "main.swift",
    monaco: "swift",
    shiki: "swift",
    compiler: "Swift 5",
  },
] as const;

export type LanguageId = (typeof LANGUAGES)[number]["id"];

export function getLanguage(id: string): (typeof LANGUAGES)[number] {
  return LANGUAGES.find((language) => language.id === id) ?? LANGUAGES[0];
}

export const DEFAULT_LANGUAGE: LanguageId = "cpp";
