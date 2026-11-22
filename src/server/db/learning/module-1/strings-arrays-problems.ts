import type { SeedProblem } from "../../seed-problems";

// Submatrix query tests: the largest case is generated so that a per-query
// O(n * m) solution cannot pass inside the time limit.
function submatrixInput(matrix: number[][], queries: number[][]): string {
  const header = `${matrix.length} ${matrix[0]?.length ?? 0} ${queries.length}`;
  const rows = matrix.map((row) => row.join(" "));
  const queryRows = queries.map((query) => query.join(" "));
  return `${header}\n${rows.join("\n")}\n${queryRows.join("\n")}\n`;
}

function submatrixAnswers(matrix: number[][], queries: number[][]): string {
  const n = matrix.length;
  const m = matrix[0]?.length ?? 0;
  const prefix: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      prefix[i][j] =
        matrix[i - 1][j - 1] + prefix[i - 1][j] + prefix[i][j - 1] - prefix[i - 1][j - 1];
    }
  }
  const answers = queries.map((query) => {
    const [r1, c1, r2, c2] = [query[0], query[1], query[2], query[3]];
    return String(
      prefix[r2][c2] - prefix[r1 - 1][c2] - prefix[r2][c1 - 1] + prefix[r1 - 1][c1 - 1],
    );
  });
  return `${answers.join("\n")}\n`;
}

const SUBMATRIX_MAX_MATRIX = Array.from({ length: 400 }, (_, i) =>
  Array.from({ length: 400 }, (_, j) => ((i * 37 + j * 17) % 2001) - 1000),
);

const SUBMATRIX_MAX_QUERIES = Array.from({ length: 100000 }, (_, i) => {
  const r1 = (i % 400) + 1;
  const c1 = ((i * 7) % 400) + 1;
  return [r1, c1, Math.min(400, r1 + (i % 400)), Math.min(400, c1 + ((i * 3) % 400))];
});

const SUBMATRIX_MAX_TEST = {
  input: submatrixInput(SUBMATRIX_MAX_MATRIX, SUBMATRIX_MAX_QUERIES),
  expectedOutput: submatrixAnswers(SUBMATRIX_MAX_MATRIX, SUBMATRIX_MAX_QUERIES),
};

export const STRINGS_ARRAYS_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m1-reverse-words",
    title: "Reverse the Words",
    statement:
      "সাদিয়া ক্লাসের হাজিরার নামগুলো এক লাইনে লিখে ফেলেছে, আর তানভির চায় শেষ নামটা সবার আগে দেখতে — অর্থাৎ শব্দগুলোর ক্রম উল্টাতে হবে।\n\nএক লাইনে শুধু ছোট হাতের ইংরেজি অক্ষর দিয়ে গঠিত শব্দ দেওয়া থাকবে, শব্দগুলো একটা করে স্পেস দিয়ে আলাদা। শব্দের ক্রম উল্টিয়ে প্রিন্ট করো — অক্ষর নয়, শব্দ।\n\nউদাহরণ: `campus code lab` হলে `lab code campus`।",
    inputFormat: "একটি লাইনে শব্দগুলো, স্পেস দিয়ে আলাদা।",
    outputFormat: "শব্দগুলো উল্টো ক্রমে স্পেস দিয়ে এক লাইনে প্রিন্ট করো।",
    constraints:
      "`1 <= শব্দের সংখ্যা <= 50`\nপ্রতিটি শব্দের দৈর্ঘ্য `1..50`, শুধু ছোট হাতের ইংরেজি অক্ষর।",
    editorial:
      "## ধারণা\n\nস্ট্রিংকে সরাসরি উল্টালে অক্ষরগুলো উল্টে যায়, কিন্তু শব্দের ক্রম বদলায় না — `campus code lab` হয় `bal edoc sumpac`। চাওয়া হলে শব্দ আলাদা করে তার ক্রম উল্টানো। `split()` স্পেস দিয়ে শব্দের লিস্ট বানায়, `[::-1]` সেই লিস্ট উল্টিয়ে দেয়।\n\n## ধাপে ধাপে\n\n1. পুরো লাইন পড়ো।\n2. `split()` দিয়ে শব্দের লিস্ট বানাও।\n3. লিস্টটা উল্টিয়ে স্পেস দিয়ে যোগ করে প্রিন্ট করো।\n\n```python\nimport sys\nwords = sys.stdin.read().split()\nprint(*words[::-1])\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(L)` (L = লাইনের দৈর্ঘ্য), স্পেস `O(L)`।\n\n## সাধারণ ভুল\n\n- পুরো স্ট্রিং উল্টিয়ে দেওয়া — অক্ষর উল্টায়, শব্দের ক্রম নয়।\n- C++-তে শুধু `cin >> w` দিয়ে প্রথম শব্দই আসে; পুরো লাইন নিতে `getline` লাগে।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Strings", "Arrays"],
    tests: [
      { input: "campus code lab\n", expectedOutput: "lab code campus\n", isSample: true },
      { input: "rafis laptop\n", expectedOutput: "laptop rafis\n", isSample: true },
      { input: "bangla\n", expectedOutput: "bangla\n", isSample: false },
      { input: "a b c d e\n", expectedOutput: "e d c b a\n", isSample: false },
      {
        input: "prime asia university judge\n",
        expectedOutput: "judge university asia prime\n",
        isSample: false,
      },
      {
        input: "alpha beta gamma delta epsilon\n",
        expectedOutput: "epsilon delta gamma beta alpha\n",
        isSample: false,
      },
      {
        input: "n na naa naaa naaaa naaaaa naaaaaa naaaaaaa naaaaaaaa naaaaaaaaa naaaaaaaaaa naaaaaaaaaaa naaaaaaaaaaaa naaaaaaaaaaaaa naaaaaaaaaaaaaa naaaaaaaaaaaaaaa naaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n",
        expectedOutput: "naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaaa naaaaaaaaaaaaaaaa naaaaaaaaaaaaaaa naaaaaaaaaaaaaa naaaaaaaaaaaaa naaaaaaaaaaaa naaaaaaaaaaa naaaaaaaaaa naaaaaaaaa naaaaaaaa naaaaaaa naaaaaa naaaaa naaaa naaa naa na n\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nwords = sys.stdin.read().split()\nprint(*words[::-1])\n",
  },
  {
    slug: "learn-m1-matrix-row-sum",
    title: "Matrix Row Sum",
    statement:
      "ল্যাবের সিট প্ল্যান একটা গ্রিডের মতো: প্রতিটি ঘরে লেখা আছে সেই সিটে কয়জন বসতে পারে। তানভির জানতে চায় প্রতিটি সারিতে মোট কয়জন বসবে — অর্থাৎ প্রতিটি সারির যোগফল।\n\nউদাহরণ: প্রথম সারি `1 2 3` হলে সেই সারির যোগফল `6`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `m`। পরের `n` লাইনে প্রতিটিতে `m`টি পূর্ণসংখ্যা।",
    outputFormat: "`n` লাইন, প্রতি লাইনে একটি পূর্ণসংখ্যা — সেই সারির যোগফল।",
    constraints: "`1 <= n, m <= 60`\n`-1000 <= a_ij <= 1000`",
    editorial:
      "## ধারণা\n\nইনপুট সাধারণত ফ্ল্যাটভাবে আসে: প্রথম দুটো সংখ্যা `n` ও `m`, তারপর `n * m`টি ঘর। সারি `i`-এর ঘরগুলো লিস্টে `i * m` থেকে `(i + 1) * m - 1` পর্যন্ত — এই অফসেট ধরে প্রতিটি সারি আলাদা করে যোগ করলেই হয়।\n\n## ধাপে ধাপে\n\n1. পুরো ইনপুট পড়ে সংখ্যার লিস্ট বানাও।\n2. `n`, `m` আর ঘরের লিস্ট আলাদা করো।\n3. `i = 0` থেকে `n - 1` লুপ চালিয়ে প্রতিটি সারির স্লাইস যোগ করে প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn, m = data[0], data[1]\nvalues = data[2:]\nfor i in range(n):\n    print(sum(values[i * m:(i + 1) * m]))\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n * m)` (প্রতিটি ঘর একবার), অতিরিক্ত স্পেস `O(1)` — ইনপুট ছাড়া আলাদা কিছু রাখতে হয় না।\n\n## সাধারণ ভুল\n\n- ভুলে গিয়ে কলামের যোগফল করা — বর্গাকার ম্যাট্রিক্সে ধরা পড়ে না, কিন্তু `2 x 3`-এ পুরোপুরি ভুল উত্তর দেয়।\n- `m` বুঝে না পুরো ঘরের লিস্টটাকে এক সারি ধরে নেওয়া।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Matrix", "Arrays", "Implementation"],
    tests: [
      { input: "2 3\n1 2 3\n4 5 6\n", expectedOutput: "6\n15\n", isSample: true },
      { input: "1 1\n7\n", expectedOutput: "7\n", isSample: true },
      { input: "3 2\n-1 -2\n0 0\n5 5\n", expectedOutput: "-3\n0\n10\n", isSample: false },
      { input: "2 2\n-5 -5\n5 5\n", expectedOutput: "-10\n10\n", isSample: false },
      {
        input: "1 4\n1000 1000 1000 1000\n",
        expectedOutput: "4000\n",
        isSample: false,
      },
      {
        input: "60 60\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n",
        expectedOutput: "60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n60\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, m = data[0], data[1]\nvalues = data[2:]\nfor i in range(n):\n    print(sum(values[i * m:(i + 1) * m]))\n",
  },
  {
    slug: "learn-m1-palindrome-check",
    title: "Palindrome Check",
    statement:
      "তানভির মেসের পুরোনো একটা ব্র্যান্ডের নাম লেখা আছে, যা বাঁ থেকে আর ডান থেকে পড়লে একই হয়। একটা শব্দ (কেবল ছোট হাতের ইংরেজি অক্ষর) দেওয়া থাকবে — সেটি কি palindrome তা বলো। palindrome মানে উল্টিয়ে পড়লেও একই হয়।\n\nউদাহরণ: `racecar` → `YES`, `campus` → `NO`।",
    inputFormat: "একটি লাইনে একটি শব্দ।",
    outputFormat: "Palindrome হলে `YES`, নাহলে `NO` এক লাইনে প্রিন্ট করো।",
    constraints:
      "`1 <= শব্দের দৈর্ঘ্য <= 1000`, শুধু ছোট হাতের ইংরেজি অক্ষর।",
    editorial:
      "## ধারণা\n\nশব্দটা উল্টিয়ে তুলনা করলেই চলবে: `s == s[::-1]`। অথবা দুই পয়েন্টার নিয়ে বাঁ থেকে আর ডান থেকে একসাথে যাওয়া যায় — যেকোনো ধাপে দুই অক্ষর মিললে না, তাহলে সঙ্গে সঙ্গে `NO`।\n\n## ধাপে ধাপে\n\n1. শব্দটা পড়ে নাও (শেষের নিউলাইন বাদ দাও)।\n2. উল্টো করে আসলের সাথে তুলনা করো।\n3. মিললে `YES`, নাহলে `NO` প্রিন্ট করো।\n\n```python\nimport sys\ns = sys.stdin.readline().strip()\nprint('YES' if s == s[::-1] else 'NO')\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(L)`, স্পেস `O(L)` (উল্টো করা স্ট্রিং ধরে)। দুই পয়েন্টার পদ্ধতিতে অতিরিক্ত স্পেস `O(1)` করা যায়।\n\n## সাধারণ ভুল\n\n- স্ট্রিং সাজিয়ে তুলনা করা: `aab` সাজালে `aab`ই হয়, তাই `YES` দেবে — কিন্তু `aab` উল্টিয়ে `baa`, অর্থাৎ উত্তর `NO`।\n- শুধু প্রথম ও শেষ অক্ষর মিলিয়ে দেখা, মাঝের অংশ বাদ দেওয়া।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Strings", "Two Pointers"],
    tests: [
      { input: "racecar\n", expectedOutput: "YES\n", isSample: true },
      { input: "campus\n", expectedOutput: "NO\n", isSample: true },
      { input: "a\n", expectedOutput: "YES\n", isSample: false },
      { input: "abba\n", expectedOutput: "YES\n", isSample: false },
      { input: "madam\n", expectedOutput: "YES\n", isSample: false },
      { input: "aab\n", expectedOutput: "NO\n", isSample: false },
      { input: "ab\n", expectedOutput: "NO\n", isSample: false },
      {
        input: "abcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijjihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcbajihgfedcba\n",
        expectedOutput: "YES\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ns = sys.stdin.readline().strip()\nprint('YES' if s == s[::-1] else 'NO')\n",
  },
  {
    slug: "learn-m1-vowel-count",
    title: "Count the Vowels",
    statement:
      "নুসরাত ইংরেজি অনুশীলনীর একটা অনুচ্ছেদ লিখেছে এবং জানতে চায় সেখানে কয়টা স্বরবর্ণ আছে — a, e, i, o, u; বড় হাতের A, E, I, O, U ও ধরতে হবে। স্পেস আর যতিচিহ্ন (`. , ! ?`) গোনবে না, শুধু অক্ষর গোনবে।\n\nউদাহরণ: `banana` তে তিনটা স্বরবর্ণ (a, a, a), তাই উত্তর `3`।",
    inputFormat:
      "একটি লাইন টেক্সট, যা খালিও হতে পারে। লাইনে ছোট ও বড় হাতের অক্ষর, স্পেস আর যতিচিহ্ন থাকতে পারে।",
    outputFormat: "স্বরবর্ণের মোট সংখ্যা এক লাইনে প্রিন্ট করো।",
    constraints: "লাইনের দৈর্ঘ্য `0 <= L <= 2000`।",
    editorial:
      "## ধারণা\n\nএক একটা অক্ষর ধরে ধরে পরীক্ষা করলেই হয়। অক্ষরটা `.lower()` দিয়ে ছোট হাতে নিয়ে এসে দেখো `a, e, i, o, u`-এর মধ্যে কিনা। যতিচিহ্ন বা স্পেস `.lower()` করলেও স্বরবর্ণ হয় না, তাই আলাদা চেক লাগে না।\n\n## ধাপে ধাপে\n\n1. পুরো লাইন পড়ে নাও।\n2. কাউন্টার `0` দিয়ে শুরু করো।\n3. প্রতিটি অক্ষরের জন্য: ছোট হাতে নিয়ে `aeiou`-তে আছে কিনা দেখো, থাকলে কাউন্টার বাড়াও।\n4. শেষে কাউন্টার প্রিন্ট করো।\n\n```python\nimport sys\nline = sys.stdin.readline().rstrip('\\n')\ncount = 0\nfor ch in line:\n    if ch.lower() in 'aeiou':\n        count += 1\nprint(count)\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(L)`, অতিরিক্ত স্পেস `O(1)`।\n\n## সাধারণ ভুল\n\n- শুধু ছোট হাতের সংস্করণ চেক করা: `AEIOU` লিখলে উত্তর `0` দেবে, কিন্তু সঠিক উত্তর `5`। `line.count('a') + ...` পদ্ধতিতেও একই সমস্যা।\n- খালি লাইন এলে ভয় পাওয়া — কাউন্টার `0` থাকবে, এটাই সঠিক উত্তর।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Strings", "Implementation"],
    tests: [
      { input: "banana\n", expectedOutput: "3\n", isSample: true },
      { input: "PrimeAsia University\n", expectedOutput: "9\n", isSample: true },
      { input: "\n", expectedOutput: "0\n", isSample: false },
      { input: "bcdfg\n", expectedOutput: "0\n", isSample: false },
      { input: "Hi, how are you?\n", expectedOutput: "6\n", isSample: false },
      { input: "AEIOU\n", expectedOutput: "5\n", isSample: false },
      {
        input: "aeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiouaeiou\n",
        expectedOutput: "1000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nline = sys.stdin.readline().rstrip('\\n')\ncount = 0\nfor ch in line:\n    if ch.lower() in 'aeiou':\n        count += 1\nprint(count)\n",
  },
  {
    slug: "learn-m1-matrix-transpose",
    title: "Matrix Transpose",
    statement:
      "ল্যাবের সিট ম্যাট্রিক্স সারি অনুযায়ী সাজানো, কিন্তু হল ঘরের দেয়ালে কলাম অনুযায়ী সাজাতে হবে — অর্থাৎ ম্যাট্রিক্সের transpose করতে হবে।\n\n`n x m` ম্যাট্রিক্সের transpose হলো `m x n` ম্যাট্রিক্স, যেখানে প্রতিটি ঘর `b[j][i] = a[i][j]`।\n\nউদাহরণ: `1 2 3` আর `4 5 6` ঘরে গঠিত 2x3 ম্যাট্রিক্সের transpose হলো `1 4`, `2 5`, `3 6` ঘরে গঠিত 3x2 ম্যাট্রিক্স।",
    inputFormat:
      "প্রথম লাইনে `n` ও `m`। পরের `n` লাইনে প্রতিটিতে `m`টি পূর্ণসংখ্যা।",
    outputFormat: "`m` লাইন, প্রতি লাইনে `n`টি পূর্ণসংখ্যা — transpose ম্যাট্রিক্স।",
    constraints: "`1 <= n, m <= 100`\n`-10^9 <= a_ij <= 10^9`",
    editorial:
      "## ধারণা\n\nTranspose-এ সারি আর কলামের ভূমিকা অদলবদল হয়। ফ্ল্যাট লিস্টে ঘর `(i, j)` থাকে `i * m + j` অফসেটে; transpose-এ সেই ঘর বসবে আউটপুটের `j`-তম সারির `i`-তম ঘরে। তাই কলাম ধরে বাইরে থেকে ঘোরাই যথেষ্ট।\n\n## ধাপে ধাপে\n\n1. `n`, `m` আর ঘরের ফ্ল্যাট লিস্ট পড়ে নাও।\n2. `j = 0` থেকে `m - 1` লুপ চালাও — প্রতিটি ধাপে কলাম `j`-এর সব ঘর এক সারিতে বসাও।\n3. প্রতিটি সারি স্পেস দিয়ে প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn, m = data[0], data[1]\nvalues = data[2:]\nfor j in range(m):\n    print(*[values[i * m + j] for i in range(n)])\n```\n\nPython-এ `print(*zip(*matrix))` দিয়েও একই কাজ হয়, কিন্তু ইনডেক্স বোঝাটা পরের সমস্যায় কাজে লাগে।\n\n## কমপ্লেক্সিটি\n\nসময় `O(n * m)`, আউটপুট ছাড়া অতিরিক্ত স্পেস `O(1)`।\n\n## সাধারণ ভুল\n\n- সঙ্গে সঙ্গে `a[j][i]` বসিয়ে in-place উল্টানো — বর্গাকার ম্যাট্রিক্সে চলে, কিন্তু `n != m` হলে ইনডেক্স বেরিয়ে যায়।\n- আউটপুটে `n` লাইন দেওয়া — সঠিক আকৃতি `m` লাইন, প্রতিটিতে `n` ঘর।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Matrix", "Arrays", "Implementation"],
    tests: [
      {
        input: "2 3\n1 2 3\n4 5 6\n",
        expectedOutput: "1 4\n2 5\n3 6\n",
        isSample: true,
      },
      {
        input: "2 2\n1 2\n3 4\n",
        expectedOutput: "1 3\n2 4\n",
        isSample: true,
      },
      { input: "1 3\n7 8 9\n", expectedOutput: "7\n8\n9\n", isSample: false },
      { input: "3 1\n1\n2\n3\n", expectedOutput: "1 2 3\n", isSample: false },
      { input: "1 1\n5\n", expectedOutput: "5\n", isSample: false },
      {
        input: "2 3\n-1 -2 -3\n4 5 6\n",
        expectedOutput: "-1 4\n-2 5\n-3 6\n",
        isSample: false,
      },
      {
        input: "60 40\n0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9\n1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0\n2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1\n3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2\n4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3\n5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4\n6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5\n7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6\n8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7\n9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8\n0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9\n1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0\n2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1\n3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2\n4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3\n5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4\n6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5\n7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6\n8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7\n9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8\n0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9\n1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0\n2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1\n3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2\n4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3\n5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4\n6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5\n7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6\n8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7\n9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8\n0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9\n1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0\n2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1\n3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2\n4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3\n5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4\n6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5\n7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6\n8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7\n9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8\n0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9\n1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0\n2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1\n3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2\n4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3\n5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4\n6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5\n7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6\n8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7\n9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8\n0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9\n1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0\n2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1\n3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2\n4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3\n5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4\n6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5\n7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6\n8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7\n9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8\n",
        expectedOutput: "0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9\n1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0\n2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1\n3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2\n4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3\n5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4\n6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5\n7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6\n8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7\n9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8\n0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9\n1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0\n2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1\n3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2\n4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3\n5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4\n6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5\n7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6\n8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7\n9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8\n0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9\n1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0\n2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1\n3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2\n4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3\n5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4\n6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5\n7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6\n8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7\n9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8\n0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9\n1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0\n2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1\n3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2\n4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3\n5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4\n6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5\n7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6\n8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7\n9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, m = data[0], data[1]\nvalues = data[2:]\nfor j in range(m):\n    print(*[values[i * m + j] for i in range(n)])\n",
  },
  {
    slug: "learn-m1-longest-word",
    title: "Find the Longest Word",
    statement:
      "সাদিয়া বইয়ের মাঝে মাঝে সবচেয়ে লম্বা শব্দটা খুঁজে বের করতে চায়। এক লাইনে ছোট হাতের শব্দগুলো স্পেস দিয়ে আলাদা করা থাকবে।\n\nসবচেয়ে লম্বা শব্দটি প্রিন্ট করো; দুই বা ততোধিক শব্দ সমান লম্বা হলে যেটি আগে আছে সেটিই দাও।\n\nউদাহরণ: `ant cat dog` — তিনটাই তিন অক্ষরের, তাই উত্তর `ant`।",
    inputFormat: "একটি লাইনে শব্দগুলো, স্পেস দিয়ে আলাদা।",
    outputFormat: "সবচেয়ে লম্বা শব্দটি (টাই হলে প্রথমটি) এক লাইনে প্রিন্ট করো।",
    constraints:
      "`1 <= শব্দের সংখ্যা <= 100`\nপ্রতিটি শব্দের দৈর্ঘ্য `1..50`, শুধু ছোট হাতের ইংরেজি অক্ষর।",
    editorial:
      "## ধারণা\n\nএক লুপে সব শব্দ ঘুরে সবচেয়ে লম্বাটা ধরে রাখা যায়। টাই হলে আগেরটাই রাখতে হবে, তাই শর্তে strict তুলনা (`>`) ব্যবহার করো — সমান হলে বদলাবে না।\n\n## ধাপে ধাপে\n\n1. শব্দের লিস্ট পড়ে নাও।\n2. প্রথম শব্দটাকে এখনকার সেরা ধরে নাও।\n3. বাকি শব্দগুলোর দৈর্ঘ্য যদি সেরাটার চেয়ে বড় হয়, তবে সেটাকে সেরা করো।\n4. শেষে সেরা শব্দটি প্রিন্ট করো।\n\n```python\nimport sys\nwords = sys.stdin.read().split()\nbest = words[0]\nfor w in words[1:]:\n    if len(w) > len(best):\n        best = w\nprint(best)\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(W * K)` (W = শব্দের সংখ্যা, K = সবচেয়ে লম্বা শব্দের দৈর্ঘ্য; Python-এ `len()` `O(1)`), স্পেস `O(L)` শব্দের লিস্টের জন্য (L = মোট অক্ষর); লাইন ধরে ধরে পড়লে `O(1)`।\n\n## সাধারণ ভুল\n\n- শর্তে `>=` ব্যবহার করলে টাই হলে শেষটা বসে যায় — `ant cat dog` এ উত্তর `dog` দেবে, কিন্তু চাওয়া হয়েছে `ant`।\n- `sorted(words, key=len)[-1]` দিলেও একই সমস্যা: স্থিতিশীল সর্টিং-এ টাই শব্দগুলো আগের ক্রমে থাকে, তাই শেষটা আসে।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Strings", "Arrays"],
    tests: [
      { input: "i love programming\n", expectedOutput: "programming\n", isSample: true },
      { input: "ant cat dog\n", expectedOutput: "ant\n", isSample: true },
      { input: "bangla\n", expectedOutput: "bangla\n", isSample: false },
      { input: "aa bb cc dd\n", expectedOutput: "aa\n", isSample: false },
      { input: "small tiny elephant\n", expectedOutput: "elephant\n", isSample: false },
      { input: "tiny elephant small\n", expectedOutput: "elephant\n", isSample: false },
      {
        input: "aaa bbb ccc ddd eee fff ggg hhh iii jjj kkk lll mmm nnn ooo ppp qqq rrr sss ttt uuu vvv www xxx yyy zzz aaa bbb ccc ddd eee fff ggg hhh iii jjj kkk lll mmm nnn ooo ppp qqq rrr sss ttt uuu vvv www zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz yyy zzz aaa bbb ccc ddd eee fff ggg hhh iii jjj kkk lll mmm nnn ooo ppp qqq rrr sss ttt uuu vvv www xxx yyy zzz aaa bbb yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy ddd eee fff ggg hhh iii jjj kkk lll mmm nnn ooo ppp qqq rrr sss ttt uuu vvv\n",
        expectedOutput: "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nwords = sys.stdin.read().split()\nbest = words[0]\nfor w in words[1:]:\n    if len(w) > len(best):\n        best = w\nprint(best)\n",
  },
  {
    slug: "learn-m1-diagonal-sum",
    title: "Diagonal Sums",
    statement:
      "হল ঘরের দেয়ালে সাজানো কোয়ার সিট ম্যাট্রিক্সের দুই ডায়াগোনাল জুড়ে পুরস্কার রাখা হয়েছে। মূল ডায়াগোনালের (`a[0][0]`, `a[1][1]`, ...) যোগফল এবং উল্টো ডায়াগোনালের (`a[0][n-1]`, `a[1][n-2]`, ...) যোগফল — দুটো স্পেস দিয়ে এক লাইনে প্রিন্ট করো।\n\n`n` বিজোড় হলে কেন্দ্রের ঘর দুই ডায়াগোনালেই পড়ে, তাই সেটি দুইবার যোগ হবে।\n\nউদাহরণ: `1 2 3 / 4 5 6 / 7 8 9` — মূল ডায়াগোনাল `1 + 5 + 9 = 15`, উল্টো `3 + 5 + 7 = 15`, উত্তর `15 15`।",
    inputFormat: "প্রথম লাইনে `n`। পরের `n` লাইনে প্রতিটিতে `n`টি পূর্ণসংখ্যা।",
    outputFormat:
      "এক লাইনে দুটো পূর্ণসংখ্যা: মূল ডায়াগোনালের যোগফল, তারপর উল্টো ডায়াগোনালের যোগফল।",
    constraints: "`1 <= n <= 100`\n`-10^9 <= a_ij <= 10^9`",
    editorial:
      "## ধারণা\n\nমূল ডায়াগোনালের ঘরে সারি আর কলামের ইনডেক্স সমান: `(i, i)`। উল্টো ডায়াগোনালে কলাম উল্টে যায়: `(i, n - 1 - i)`। ফ্ল্যাট লিস্টে ঘর `(i, j)` থাকে `i * n + j` অফসেটে (বর্গাকার বলে `n` দুইবারই কাজ করে)।\n\n## ধাপে ধাপে\n\n1. `n` আর ঘরের ফ্ল্যাট লিস্ট পড়ে নাও।\n2. দুটো কাউন্টার `0` দিয়ে শুরু করো।\n3. `i = 0` থেকে `n - 1`: মূল ডায়াগোনালের ঘর প্রথম কাউন্টারে, উল্টো ডায়াগোনালের ঘর দ্বিতীয় কাউন্টারে যোগ করো।\n4. দুই কাউন্টার স্পেস দিয়ে প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nvalues = data[1:]\nmain_total = 0\nanti_total = 0\nfor i in range(n):\n    main_total += values[i * n + i]\n    anti_total += values[i * n + (n - 1 - i)]\nprint(main_total, anti_total)\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n^2)` (পুরো ম্যাট্রিক্স পড়া), অতিরিক্ত স্পেস `O(1)`।\n\n## সাধারণ ভুল\n\n- শুধু মূল ডায়াগোনাল যোগ করে উল্টোটা ভুলে যাওয়া, বা দুইবার `a[i][i]` যোগ করে দেওয়া।\n- কেন্দ্রের ঘরটা একবার যোগ করে দেওয়া — প্রশ্ন অনুযায়ী `n` বিজোড় হলে সেটা দুই ডায়াগোনালেই পড়ে, তাই দুইবারই যোগ হবে।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Matrix", "Arrays"],
    tests: [
      {
        input: "3\n1 2 3\n4 5 6\n7 8 9\n",
        expectedOutput: "15 15\n",
        isSample: true,
      },
      { input: "2\n1 5\n5 1\n", expectedOutput: "2 10\n", isSample: true },
      { input: "1\n7\n", expectedOutput: "7 7\n", isSample: false },
      { input: "2\n-1 2\n3 -4\n", expectedOutput: "-5 5\n", isSample: false },
      { input: "2\n1 2\n3 4\n", expectedOutput: "5 5\n", isSample: false },
      {
        input: "4\n1 0 0 0\n0 1 0 0\n0 0 1 0\n0 0 0 1\n",
        expectedOutput: "4 0\n",
        isSample: false,
      },
      {
        input: "60\n0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9\n1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0\n2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1\n3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2\n4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3\n5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4\n6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5\n7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6\n8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7\n9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8\n0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9\n1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0\n2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1\n3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2\n4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3\n5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4\n6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5\n7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6\n8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7\n9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8\n0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9\n1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0\n2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1\n3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2\n4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3\n5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4\n6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5\n7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6\n8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7\n9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8\n0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9\n1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0\n2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1\n3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2\n4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3\n5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4\n6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5\n7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6\n8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7\n9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8\n0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9\n1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0\n2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1\n3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2\n4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3\n5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4\n6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5\n7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6\n8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7\n9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8\n0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9\n1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0\n2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1\n3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2\n4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3\n5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4\n6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5\n7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6\n8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7\n9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8\n",
        expectedOutput: "240 540\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nvalues = data[1:]\nmain_total = 0\nanti_total = 0\nfor i in range(n):\n    main_total += values[i * n + i]\n    anti_total += values[i * n + (n - 1 - i)]\nprint(main_total, anti_total)\n",
  },
  {
    slug: "learn-m1-submatrix-sum-queries",
    title: "Submatrix Sum Queries",
    statement:
      "হল ঘরের সিট প্ল্যান একটা `n x m` গ্রিড — প্রতিটি ঘরে লেখা ওই ঘরে কয়জন ছাত্র বসতে পারে। সুপারভাইজার বারবার জিজ্ঞেস করেন আয়তক্ষেত্রাকার একটা অংশে মোট কয়জন বসবে; ঘর ঘর করে যোগ করলে প্রতিবার সময় লেগে যায়। তুমি একবার প্রস্তুতি নিয়ে প্রতিটি প্রশ্নের উত্তর তাৎক্ষণিক দাও।\n\nপ্রথম লাইনে `n`, `m` আর প্রশ্নসংখ্যা `q`। এরপর `n` লাইনে ম্যাট্রিক্স, প্রতি লাইনে `m`টি পূর্ণসংখ্যা; শেষের `q` লাইনে প্রতিটিতে `r1 c1 r2 c2` — অর্থাৎ `(r1, c1)` ঘর থেকে `(r2, c2)` ঘর পর্যন্ত সেই আয়তক্ষেত্র (চারটি কোণাই ধরা)। ইনডেক্স ১ থেকে শুরু, আর `r1 <= r2`, `c1 <= c2`। প্রতিটি প্রশ্নের যোগফল এক লাইনে ছাপাও।\n\nউদাহরণ: ম্যাট্রিক্স `1 2 3 / 4 5 6 / 7 8 9` এবং প্রশ্ন `1 1 2 2` হলে অংশটা `1 2 / 4 5`, যোগফল `12`; প্রশ্ন `1 1 3 3` হলে পুরো ম্যাট্রিক্স, যোগফল `45`।",
    inputFormat:
      "প্রথম লাইনে `n`, `m`, `q`। পরের `n` লাইনে ম্যাট্রিক্স, শেষের `q` লাইনে প্রতিটিতে `r1 c1 r2 c2`।",
    outputFormat: "`q` লাইন; প্রতিটিতে সেই অংশের যোগফল।",
    constraints:
      "`1 <= n, m <= 500`\n`1 <= q <= 200000`\n`-1000 <= a_ij <= 1000`\n`1 <= r1 <= r2 <= n`\n`1 <= c1 <= c2 <= m`\nপ্রতিটি প্রশ্নে ঘর ঘর করে যোগ করলে মোট প্রায় `5 * 10^10` কাজ — তাই একবার প্রস্তুতি নিতেই হবে।",
    editorial:
      "## ধারণা\nপ্রতি প্রশ্নে ঘর ঘর করে যোগ করলে সর্বোচ্চ `n * m` কাজ লাগে — প্রশ্ন `200000` আর ম্যাট্রিক্স `500 x 500` হলে মোট প্রায় `5 * 10^10` কাজ, তাই এটাই ধীর পথ। বদলে একবার পুরো ম্যাট্রিক্স ঘুরে prefix sum ম্যাট্রিক্স `p` বানাও, যেখানে `p[i][j]` মানে `(1, 1)` থেকে `(i, j)` পর্যন্ত আয়তক্ষেত্রের যোগফল।\n\nবানানোর সূত্র: `p[i][j] = a[i][j] + p[i-1][j] + p[i][j-1] - p[i-1][j-1]`। উপরের সারি আর বাম কলাম মিলে কোণার অংশ দুইবার যোগ হয়ে যায়, তাই একবার বিয়োগ দিতে হয়।\n\nএকই যুক্তি দিয়ে চাওয়া অংশের উত্তর: `S(r1, c1, r2, c2) = p[r2][c2] - p[r1-1][c2] - p[r2][c1-1] + p[r1-1][c1-1]`। শুরুর সারি আর কলাম খালি রাখা হয়, তাই `r1 = 1` বা `c1 = 1` হলে সূচি ০-এর ঘর নিজে থেকেই শূন্য দেয়।\n\n## ধাপে ধাপে\n1. `n`, `m`, `q` আর পুরো ম্যাট্রিক্স পড়ে ফ্ল্যাট লিস্টে রাখো — ঘর `(i, j)` থাকবে `i * m + j` অফসেটে।\n2. `(n + 1) x (m + 1)` আকারের `p` বানাও, শুরুর সারি ও কলাম সব `0`।\n3. `i = 1..n`, `j = 1..m` ঘুরে উপরের সূত্রটা বসাও।\n4. প্রতিটি প্রশ্নে `p[r2][c2]`, `p[r1-1][c2]`, `p[r2][c1-1]`, `p[r1-1][c1-1]` — চারটা মান তুলে হিসাব করে ছাপাও।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn, m, q = data[0], data[1], data[2]\nvalues = data[3:]\np = [[0] * (m + 1) for _ in range(n + 1)]\nfor i in range(1, n + 1):\n    row = values[(i - 1) * m : i * m]\n    for j in range(1, m + 1):\n        p[i][j] = row[j - 1] + p[i - 1][j] + p[i][j - 1] - p[i - 1][j - 1]\nout = []\nidx = n * m\nfor _ in range(q):\n    r1, c1, r2, c2 = values[idx], values[idx + 1], values[idx + 2], values[idx + 3]\n    idx += 4\n    out.append(str(p[r2][c2] - p[r1 - 1][c2] - p[r2][c1 - 1] + p[r1 - 1][c1 - 1]))\nsys.stdout.write('\\n'.join(out))\n```\n\n## কমপ্লেক্সিটি\nপ্রস্তুতি `O(n * m)`, প্রতি প্রশ্ন `O(1)` — মোট `O(n * m + q)`। প্রতিটি প্রশ্নে নতুন করে যোগ করলে `O(q * n * m)`, যা সময় সীমা অনেক বেশি ছাড়িয়ে যায়।\n\n## সাধারণ ভুল\n- যোগ-বিয়োগের চারটি পদের একটা বাদ: শুধু `p[r2][c2] - p[r1-1][c2]` লিখলে `1 1 2 2` প্রশ্নে উত্তর `9` আসে, অথচ সঠিক উত্তর `12`।\n- `p`-এর শুরুর সারি ও কলাম বাদ দিয়ে ঘর সরিয়ে বসানো — তখন `r1 = 1` হলে `p[r1-1][c2]` ইনডেক্স বেরিয়ে যায় বা ভুল ঘরে পড়ে।\n- প্রতিটি প্রশ্নে আবার আবার `p` গোনতে বসা — প্রস্তুতি একবারই নিতে হয়, প্রশ্নগুলোর আগে নয়।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Matrix", "Arrays", "Prefix Sum"],
    tests: [
      {
        input: "3 3 3\n1 2 3\n4 5 6\n7 8 9\n1 1 2 2\n2 2 3 3\n1 1 3 3\n",
        expectedOutput: "12\n28\n45\n",
        isSample: true,
      },
      {
        input: "2 2 5\n-1 2\n3 -4\n1 1 1 1\n2 2 2 2\n1 1 1 2\n2 1 2 2\n1 1 2 2\n",
        expectedOutput: "-1\n-4\n1\n-1\n0\n",
        isSample: true,
      },
      {
        input: "1 1 2\n-7\n1 1 1 1\n1 1 1 1\n",
        expectedOutput: "-7\n-7\n",
        isSample: false,
      },
      {
        input: "1 5 3\n1 2 3 4 5\n1 1 1 5\n1 2 1 4\n1 5 1 5\n",
        expectedOutput: "15\n9\n5\n",
        isSample: false,
      },
      {
        input: "5 1 3\n1\n2\n3\n4\n5\n1 1 5 1\n2 1 2 1\n5 1 5 1\n",
        expectedOutput: "15\n2\n5\n",
        isSample: false,
      },
      {
        input: "4 4 4\n1 0 0 0\n0 1 0 0\n0 0 1 0\n0 0 0 1\n4 4 4 4\n1 1 4 4\n3 2 4 3\n2 2 3 3\n",
        expectedOutput: "1\n4\n1\n2\n",
        isSample: false,
      },
      {
        input: "2 2 1\n1000 1000\n1000 1000\n1 1 2 2\n",
        expectedOutput: "4000\n",
        isSample: false,
      },
      { ...SUBMATRIX_MAX_TEST, isSample: false },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, m, q = data[0], data[1], data[2]\nvalues = data[3:]\np = [[0] * (m + 1) for _ in range(n + 1)]\nfor i in range(1, n + 1):\n    row = values[(i - 1) * m : i * m]\n    for j in range(1, m + 1):\n        p[i][j] = row[j - 1] + p[i - 1][j] + p[i][j - 1] - p[i - 1][j - 1]\nout = []\nidx = n * m\nfor _ in range(q):\n    r1, c1, r2, c2 = values[idx], values[idx + 1], values[idx + 2], values[idx + 3]\n    idx += 4\n    out.append(str(p[r2][c2] - p[r1 - 1][c2] - p[r2][c1 - 1] + p[r1 - 1][c1 - 1]))\nsys.stdout.write('\\n'.join(out))\n",
  },
];
