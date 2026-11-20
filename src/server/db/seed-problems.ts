import type { Difficulty } from "@/lib/types";

export type SeedTest = {
  input: string;
  expectedOutput: string;
  isSample: boolean;
};

export type SeededProblem = {
  id: string;
  definition: SeedProblem;
  tests: { id: string; position: number }[];
};

export type SeedProblem = {
  isPublic?: boolean;
  slug: string;
  title: string;
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  editorial: string;
  difficulty: Difficulty;
  points: number;
  timeLimitMs: number;
  memoryLimitMb: number;
  tags: string[];
  tests: SeedTest[];
  referencePython: string;
};

export const SEED_PROBLEMS: SeedProblem[] = [
  {
    slug: "a-plus-b",
    title: "A + B",
    statement:
      "You are given two integers, **a** and **b**. Print their sum.\n\nThis is the classic first problem. Use it to check that the judge is working and to get familiar with the editor.",
    inputFormat:
      "A single line containing two integers `a` and `b`, separated by a space.",
    outputFormat: "Print one integer: the value of `a + b`.",
    constraints: "`-10^9 <= a, b <= 10^9`",
    editorial:
      "Read both numbers and print their sum. In C++ you can use `long long` to be safe.\n\nIndented example:\n\n    long long a, b;\n    cin >> a >> b;\n    cout << a + b << '\\n';",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Math", "Implementation"],
    tests: [
      { input: "2 3\n", expectedOutput: "5\n", isSample: true },
      { input: "-10 4\n", expectedOutput: "-6\n", isSample: true },
      { input: "0 0\n", expectedOutput: "0\n", isSample: false },
      { input: "1000000000 1000000000\n", expectedOutput: "2000000000\n", isSample: false },
      { input: "-5 -7\n", expectedOutput: "-12\n", isSample: false },
      { input: "42 -42\n", expectedOutput: "0\n", isSample: false },
    ],
    referencePython:
      "import sys\na, b = map(int, sys.stdin.read().split())\nprint(a + b)\n",
  },
  {
    slug: "array-rotation",
    title: "Array Rotation",
    statement:
      "Given an array of **n** integers, rotate it to the right by **k** positions.\n\nFor example, the array `1 2 3 4 5` rotated right by `2` becomes `4 5 1 2 3`.",
    inputFormat:
      "The first line contains two integers `n` and `k`.\nThe second line contains `n` integers.",
    outputFormat:
      "Print the rotated array as `n` space-separated integers on one line.",
    constraints:
      "`1 <= n <= 200000`\n`0 <= k <= 10^9`\nEach array value fits in a 32-bit signed integer.",
    editorial:
      "Rotating right by `k` is the same as rotating by `k % n`. The last `k % n` elements move to the front. An in-place reversal of three ranges also works.",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Arrays", "Implementation"],
    tests: [
      { input: "5 2\n1 2 3 4 5\n", expectedOutput: "4 5 1 2 3\n", isSample: true },
      { input: "4 0\n1 2 3 4\n", expectedOutput: "1 2 3 4\n", isSample: true },
      { input: "1 5\n7\n", expectedOutput: "7\n", isSample: false },
      { input: "3 5\n1 2 3\n", expectedOutput: "2 3 1\n", isSample: false },
      { input: "6 6\n1 2 3 4 5 6\n", expectedOutput: "1 2 3 4 5 6\n", isSample: false },
      { input: "5 12\n1 2 3 4 5\n", expectedOutput: "4 5 1 2 3\n", isSample: false },
    ],
    referencePython:
      "import sys\nn, k = map(int, sys.stdin.readline().split())\narr = list(map(int, sys.stdin.read().split()))\nk %= n\nrotated = arr[-k:] + arr[:-k] if k else arr\nprint(*rotated)\n",
  },
  {
    slug: "reverse-array",
    title: "Reverse the Array",
    statement:
      "Read an array of **n** integers and print the same array in reverse order.",
    inputFormat:
      "The first line contains `n`.\nThe second line contains `n` integers.",
    outputFormat: "Print the reversed array on one line, separated by spaces.",
    constraints: "`1 <= n <= 200000`",
    editorial:
      "Print the elements from the last index to the first index. In Python you can use `reversed` or `arr[::-1]`.",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Arrays", "Implementation"],
    tests: [
      { input: "5\n1 2 3 4 5\n", expectedOutput: "5 4 3 2 1\n", isSample: true },
      { input: "1\n9\n", expectedOutput: "9\n", isSample: false },
      { input: "4\n-1 0 7 2\n", expectedOutput: "2 7 0 -1\n", isSample: false },
      { input: "3\n10 20 30\n", expectedOutput: "30 20 10\n", isSample: false },
      { input: "2\n5 5\n", expectedOutput: "5 5\n", isSample: false },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\narr = list(map(int, sys.stdin.read().split()))\nprint(*arr[::-1])\n",
  },
  {
    slug: "prime-counter",
    title: "Prime Counter",
    statement:
      "Given an integer **n**, count how many prime numbers are less than or equal to **n**.\n\nA prime number is greater than `1` and has no positive divisors other than `1` and itself.",
    inputFormat: "A single integer `n`.",
    outputFormat: "Print the number of primes not greater than `n`.",
    constraints: "`1 <= n <= 10^6`",
    editorial:
      "Use the Sieve of Eratosthenes. Create a boolean array of size `n + 1`, mark multiples of each prime as composite, and count the remaining primes. The complexity is `O(n log log n)`.",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Number Theory", "Sieve"],
    tests: [
      { input: "10\n", expectedOutput: "4\n", isSample: true },
      { input: "2\n", expectedOutput: "1\n", isSample: true },
      { input: "1\n", expectedOutput: "0\n", isSample: false },
      { input: "100\n", expectedOutput: "25\n", isSample: false },
      { input: "100000\n", expectedOutput: "9592\n", isSample: false },
      { input: "999983\n", expectedOutput: "78498\n", isSample: false },
      { input: "1000000\n", expectedOutput: "78498\n", isSample: false },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\nif n < 2:\n    print(0)\nelse:\n    sieve = bytearray(b'\\x01') * (n + 1)\n    sieve[0:2] = b'\\x00\\x00'\n    p = 2\n    while p * p <= n:\n        if sieve[p]:\n            sieve[p*p:n+1:p] = b'\\x00' * (((n - p*p) // p) + 1)\n        p += 1\n    print(sum(sieve))\n",
  },
  {
    slug: "matrix-multiplication",
    title: "Matrix Multiplication",
    statement:
      "You are given matrix **A** of size `n x m` and matrix **B** of size `m x p`. Compute the matrix product `A x B`, which has size `n x p`.",
    inputFormat:
      "The first line contains three integers `n`, `m` and `p`.\nThe next `n` lines describe matrix **A**, each with `m` integers.\nThe following `m` lines describe matrix **B**, each with `p` integers.",
    outputFormat:
      "Print `n` lines. Line `i` contains `p` integers: row `i` of the product.",
    constraints:
      "`1 <= n, m, p <= 100`\nEach matrix value fits in a 32-bit signed integer. The product fits in a 64-bit signed integer.",
    editorial:
      "Use three nested loops: for every row `i`, every column `j`, and every inner index `k`, add `A[i][k] * B[k][j]`. Use `long long` in C++ because the product can exceed 32 bits.",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Matrix", "Implementation"],
    tests: [
      {
        input: "2 2 2\n1 2\n3 4\n5 6\n7 8\n",
        expectedOutput: "19 22\n43 50\n",
        isSample: true,
      },
      { input: "1 1 1\n7\n9\n", expectedOutput: "63\n", isSample: false },
      {
        input: "2 3 2\n1 2 3\n4 5 6\n7 8\n9 10\n11 12\n",
        expectedOutput: "58 64\n139 154\n",
        isSample: false,
      },
      { input: "1 2 1\n2 3\n4\n5\n", expectedOutput: "23\n", isSample: false },
      { input: "2 1 2\n1\n2\n3 4\n", expectedOutput: "3 4\n6 8\n", isSample: false },
    ],
    referencePython:
      "import sys\nlines = sys.stdin.read().split()\nit = iter(lines)\nn = int(next(it)); m = int(next(it)); p = int(next(it))\nA = [[int(next(it)) for _ in range(m)] for _ in range(n)]\nB = [[int(next(it)) for _ in range(p)] for _ in range(m)]\nfor i in range(n):\n    row = []\n    for j in range(p):\n        row.append(sum(A[i][k] * B[k][j] for k in range(m)))\n    print(*row)\n",
  },
  {
    slug: "longest-increasing-subsequence",
    title: "Longest Increasing Subsequence",
    statement:
      "Given an array of **n** integers, find the length of its longest strictly increasing subsequence (LIS).\n\nA subsequence does not have to be contiguous, but the original order of elements must be preserved.",
    inputFormat:
      "The first line contains `n`.\nThe second line contains `n` integers.",
    outputFormat: "Print one integer: the length of the longest increasing subsequence.",
    constraints: "`1 <= n <= 100000`\nEach value fits in a 32-bit signed integer.",
    editorial:
      "Maintain the smallest possible tail value for every subsequence length. For each number, binary search for the first tail that is greater than or equal to it and replace that tail. The length of the tail array is the answer. Complexity is `O(n log n)`.",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Binary Search"],
    tests: [
      { input: "8\n10 9 2 5 3 7 101 18\n", expectedOutput: "4\n", isSample: true },
      { input: "5\n5 4 3 2 1\n", expectedOutput: "1\n", isSample: false },
      { input: "5\n1 2 3 4 5\n", expectedOutput: "5\n", isSample: false },
      { input: "3\n2 2 2\n", expectedOutput: "1\n", isSample: false },
      { input: "5\n3 10 2 1 20\n", expectedOutput: "3\n", isSample: false },
    ],
    referencePython:
      "import sys, bisect\nn = int(sys.stdin.readline())\narr = list(map(int, sys.stdin.read().split()))\ntails = []\nfor value in arr:\n    index = bisect.bisect_left(tails, value)\n    if index == len(tails):\n        tails.append(value)\n    else:\n        tails[index] = value\nprint(len(tails))\n",
  },
  {
    slug: "shortest-path",
    title: "Shortest Path",
    statement:
      "You are given a weighted undirected graph with **n** vertices and **m** edges. Find the shortest distance from a source vertex **s** to every vertex.\n\nIf a vertex is unreachable, its distance is `-1`.",
    inputFormat:
      "The first line contains `n`, `m` and `s`.\nThe next `m` lines each contain `u`, `v` and `w`: an edge between `u` and `v` with non-negative weight `w`.\nVertices are numbered from `1` to `n`.",
    outputFormat:
      "Print `n` integers on one line: the distance from `s` to vertex `1`, vertex `2`, ..., vertex `n`.",
    constraints:
      "`1 <= n <= 100000`\n`0 <= m <= 200000`\n`0 <= w <= 10^9`\nThe graph may be disconnected and may contain multiple edges.",
    editorial:
      "Use Dijkstra's algorithm with a min-heap. Distances can be as large as `10^14`, so use 64-bit integers. Skip stale heap entries when the stored distance is larger than the current best distance.",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Shortest Path", "Dijkstra"],
    tests: [
      {
        input: "4 4 1\n1 2 4\n1 3 1\n3 2 2\n2 4 1\n",
        expectedOutput: "0 3 1 4\n",
        isSample: true,
      },
      { input: "1 0 1\n", expectedOutput: "0\n", isSample: false },
      {
        input: "4 2 1\n1 2 5\n3 4 2\n",
        expectedOutput: "0 5 -1 -1\n",
        isSample: false,
      },
      {
        input: "3 3 1\n1 2 10\n1 3 1\n3 2 2\n",
        expectedOutput: "0 3 1\n",
        isSample: false,
      },
      {
        input: "5 5 2\n1 2 1\n2 3 1\n3 4 1\n4 5 1\n2 5 10\n",
        expectedOutput: "-1 0 1 2 3\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys, heapq\nline = sys.stdin.readline().split()\nif not line:\n    sys.exit()\nn, m, s = map(int, line)\ngraph = [[] for _ in range(n + 1)]\nfor _ in range(m):\n    u, v, w = map(int, sys.stdin.readline().split())\n    graph[u].append((v, w))\n    graph[v].append((u, w))\nINF = 10**30\ndist = [INF] * (n + 1)\ndist[s] = 0\nheap = [(0, s)]\nwhile heap:\n    d, u = heapq.heappop(heap)\n    if d != dist[u]:\n        continue\n    for v, w in graph[u]:\n        nd = d + w\n        if nd < dist[v]:\n            dist[v] = nd\n            heapq.heappush(heap, (nd, v))\nprint(*[-1 if dist[i] == INF else dist[i] for i in range(1, n + 1)])\n",
  },
  {
    slug: "balanced-brackets",
    title: "Balanced Brackets",
    statement:
      "Given a string containing only the characters `()[]{}`, decide whether the brackets are balanced.\n\nA string is balanced when every opening bracket has a matching closing bracket of the same type, and brackets close in the correct order.",
    inputFormat:
      "A single line containing the bracket string. The line may be empty.",
    outputFormat: "Print `YES` if the string is balanced, otherwise print `NO`.",
    constraints: "The string length is at most `200000`.",
    editorial:
      "Use a stack. Push every opening bracket. When you see a closing bracket, the stack must not be empty and the top must be its matching opening bracket. At the end, the stack must be empty.",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Strings", "Stack"],
    tests: [
      { input: "([]{})\n", expectedOutput: "YES\n", isSample: true },
      { input: "([)]\n", expectedOutput: "NO\n", isSample: true },
      { input: "((()))\n", expectedOutput: "YES\n", isSample: false },
      { input: "]\n", expectedOutput: "NO\n", isSample: false },
      { input: "", expectedOutput: "YES\n", isSample: false },
      { input: "{[()]}\n", expectedOutput: "YES\n", isSample: false },
      { input: "((\n", expectedOutput: "NO\n", isSample: false },
    ],
    referencePython:
      "import sys\ntext = sys.stdin.read().strip()\npairs = {')': '(', ']': '[', '}': '{'}\nstack = []\nfor char in text:\n    if char in '([{':\n        stack.append(char)\n    elif char in pairs:\n        if not stack or stack.pop() != pairs[char]:\n            print('NO')\n            sys.exit()\nprint('YES' if not stack else 'NO')\n",
  },
];
