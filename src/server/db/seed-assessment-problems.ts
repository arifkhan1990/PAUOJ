import type { SeedProblem } from "./seed-problems";

export const ASSESSMENT_PROBLEMS: SeedProblem[] = [
  {
    isPublic: false,
    slug: "assessment-pair-sum",
    title: "Pair Sum",
    statement:
      "You are given an array of **n** integers and a target value **t**.\n\nDecide whether there are two **different positions** `i` and `j` such that `a[i] + a[j] = t`.",
    inputFormat:
      "The first line contains `n` and `t`.\nThe second line contains `n` integers.",
    outputFormat: "Print `YES` if such a pair exists, otherwise print `NO`.",
    constraints:
      "`2 <= n <= 200000`\n`-10^9 <= a[i], t <= 10^9`",
    editorial:
      "Walk through the array once and keep a set of values seen so far. For each value `x`, check whether `t - x` is already in the set. Complexity `O(n)`.",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Assessment", "Arrays", "Hashing"],
    tests: [
      { input: "4 9\n2 7 11 15\n", expectedOutput: "YES\n", isSample: true },
      { input: "3 6\n1 2 10\n", expectedOutput: "NO\n", isSample: true },
      { input: "3 6\n3 3 3\n", expectedOutput: "YES\n", isSample: false },
      { input: "5 0\n-5 0 5 1 2\n", expectedOutput: "YES\n", isSample: false },
      {
        input: "2 1000000000\n500000000 500000000\n",
        expectedOutput: "YES\n",
        isSample: false,
      },
      { input: "2 10\n1 2\n", expectedOutput: "NO\n", isSample: false },
    ],
    referencePython:
      "import sys\nn,t=map(int,sys.stdin.readline().split())\narr=list(map(int,sys.stdin.read().split()))\nseen=set()\nfor x in arr:\n    if t-x in seen:\n        print('YES')\n        break\n    seen.add(x)\nelse:\n    print('NO')\n",
  },
  {
    isPublic: false,
    slug: "assessment-vowel-count",
    title: "Vowel Count",
    statement:
      "Given a line of text, count how many vowels it contains.\n\nThe vowels are `a`, `e`, `i`, `o` and `u`. Treat uppercase and lowercase letters as the same.",
    inputFormat: "A single line of text.",
    outputFormat: "Print one integer: the number of vowels in the line.",
    constraints: "The line length is between `1` and `100000` characters.",
    editorial:
      "Convert the line to lowercase (or compare case-insensitively) and count characters that appear in the string `aeiou`.",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Assessment", "Strings"],
    tests: [
      { input: "Hello World\n", expectedOutput: "3\n", isSample: true },
      { input: "PAU OJ\n", expectedOutput: "3\n", isSample: true },
      { input: "aeiou\n", expectedOutput: "5\n", isSample: false },
      { input: "BCDFG\n", expectedOutput: "0\n", isSample: false },
      { input: "Programming is fun\n", expectedOutput: "5\n", isSample: false },
    ],
    referencePython:
      "import sys\nline=sys.stdin.read().strip().lower()\nprint(sum(1 for c in line if c in 'aeiou'))\n",
  },
  {
    isPublic: false,
    slug: "assessment-grid-path",
    title: "Grid Paths",
    statement:
      "You start at the top-left cell of an `n x m` grid. You may only move **right** or **down**.\n\nCount how many different paths reach the bottom-right cell.",
    inputFormat: "A single line containing `n` and `m`.",
    outputFormat: "Print the number of paths.",
    constraints: "`1 <= n, m <= 12`\nThe answer fits in a 64-bit signed integer.",
    editorial:
      "Use dynamic programming: `dp[i][j] = dp[i-1][j] + dp[i][j-1]`. The first row and first column have exactly one path.",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Assessment", "Dynamic Programming", "Grid"],
    tests: [
      { input: "2 2\n", expectedOutput: "2\n", isSample: true },
      { input: "3 3\n", expectedOutput: "6\n", isSample: true },
      { input: "1 1\n", expectedOutput: "1\n", isSample: false },
      { input: "1 5\n", expectedOutput: "1\n", isSample: false },
      { input: "4 3\n", expectedOutput: "10\n", isSample: false },
      { input: "5 5\n", expectedOutput: "70\n", isSample: false },
    ],
    referencePython:
      "import sys\nn,m=map(int,sys.stdin.readline().split())\ndp=[1]*m\nfor _ in range(1,n):\n    for j in range(1,m):\n        dp[j]+=dp[j-1]\nprint(dp[-1])\n",
  },
];
