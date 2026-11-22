import type { SeedProblem } from "../../seed-problems";
import { newlineOutput } from "../generated-tests";

const RECUR_QUERIES = Array.from(
  { length: 5000 },
  (_, i) => (i % 2 ? "999999999999999999" : "1000000000000000000"),
).join("\n");

const TOTIENT_BIG_QUERIES = Array.from(
  { length: 50 },
  () => "1000000000000",
).join("\n");

const LUCAS_QUERIES = Array.from(
  { length: 50 },
  (_, i) =>
    i % 2 ? "1000000000000000000 987654321" : "1000000000000000000 123456789",
).join("\n");

export const ADVANCED_NUMBER_THEORY_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m7-advanced-number-theory-g1",
    title: "Euler Totient",
    statement:
      "ক্রিপ্টোগ্রাফির ল্যাবে নুসরাত জানতে চান — কোনো সংখ্যা `n`-এর সাথে কয়টা সংখ্যা (১ থেকে `n` পর্যন্ত) গুনগতভাবে সহগুণ। এই সংখ্যাটাকেই Euler's totient বা `φ(n)` বলে।\n\nসহগুণ মানে দুটো সংখ্যার gcd হওয়া `1`। যেমন `φ(12) = 4` — সেগুলো হলো `1, 5, 7, 11`। `φ(1) = 1` (নিজের সাথে নিজেই সহগুণ)।",
    inputFormat: "একটা পূর্ণসংখ্যা `n`।",
    outputFormat: "`φ(n)` এক লাইনে প্রিন্ট করুন।",
    constraints: "`1 <= n <= 10^12`",
    editorial:
      "### ধারণা\n\nসূত্রটা হলো `φ(n) = n * (1 - 1/p1) * (1 - 1/p2) * ...`, যেখানে `p1, p2, ...` হলো `n`-এর আলাদা মৌলিক ভাজক। হিসাবে ভাঙলে প্রতিটি ভাজকের জন্য `result -= result // p` — এই লেখাটাই ভাগ ছাড়া সবচেয়ে নিরাপদ। ভাজক বের করতে `2` থেকে `sqrt(n)` পর্যন্ত যাচাই করলেই হয়; প্রতিটি ভাজক দিয়ে সেই ভাজকের সব ঘাত বাদ দিয়ে `x` ছোট করে ফেললে শেষে `x > 1` থাকলে সেটাই একটা বড় মৌলিক ভাজক।\n\n### ধাপে ধাপে\n\n1. `n` পড়ে `result = n` এবং `x = n` ধরুন।\n2. `d = 2` থেকে `d * d <= x` পর্যন্ত লুপ চালান (প্রথম ধাপ `2`, তারপর বিজোড় সংখ্যা)।\n3. `x % d == 0` হলে `x` থেকে `d`-এর সব ঘাত ভাগ করে বাদ দিন এবং `result -= result // d` করুন।\n4. লুপের পর `x > 1` হলে `x` নিজেই একটা মৌলিক ভাজক — সেটার জন্যও একই করুন।\n5. `result` প্রিন্ট করুন।\n\n```python\nimport sys\nn = int(sys.stdin.readline())\nresult = x = n\nd = 2\nwhile d * d <= x:\n    if x % d == 0:\n        while x % d == 0:\n            x //= d\n        result -= result // d\n    d += 1 if d == 2 else 2\nif x > 1:\n    result -= result // x\nprint(result)\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(sqrt(n))` সবচেয়ে খারাপ ক্ষেত্রে; `n = 10^12` হলে `10^6` ধাপ, Python-এও এক সেকেন্ডের কমে চলে। স্পেস `O(1)`।\n\n### সাধারণ ভুল\n\n- শুধু `d = d + 1` করে লুপ চালানো — `10^12`-এ খুব ধীর; `2`-এর পর থেকে বিজোড় ধাপ নিন।\n- ভাজক পাওয়ার পরও `x` ছোট না করা — তখন একই ভাজক বারবার ধরা পড়ে এবং `result` ভুল হয়। `φ(12)` তখন `2` বার `2` দিয়ে কাটা হয়ে `3` আসবে, অথচ সঠিক `4`।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Number Theory", "Euler Totient"],
    tests: [
      { input: "1\n", expectedOutput: "1\n", isSample: true },
      { input: "10\n", expectedOutput: "4\n", isSample: true },
      { input: "12\n", expectedOutput: "4\n", isSample: false },
      { input: "7\n", expectedOutput: "6\n", isSample: false },
      { input: "999983\n", expectedOutput: "999982\n", isSample: false },
      { input: "123456789\n", expectedOutput: "82260072\n", isSample: false },
      { input: "1000000\n", expectedOutput: "400000\n", isSample: false },
      {
        input: "1000000000000\n",
        expectedOutput: "400000000000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\nresult = x = n\nd = 2\nwhile d * d <= x:\n    if x % d == 0:\n        while x % d == 0:\n            x //= d\n        result -= result // d\n    d += 1 if d == 2 else 2\nif x > 1:\n    result -= result // x\nprint(result)\n",
  },
  {
    slug: "learn-m7-advanced-number-theory-g2",
    title: "Fibonacci Modulo",
    statement:
      "রাফি জানতে চান ফিবোনাচি ধারার `n` পদ কত, কিন্তু সংখ্যাটা এত বড় হয়ে যায় যে শুধু `M`-এর মডিউলে দেখা হবে। `F(0) = 0`, `F(1) = 1` এবং `F(n) = F(n-1) + F(n-2)`।\n\n`n` আর `M` দেওয়া থাকবে — `F(n) mod M` প্রিন্ট করুন। `n` এত বড় হতে পারে যে ধারা বানিয়ে হিসাব করা যাবে না।\n\nউদাহরণ: `n = 10`, `M = 1000` হলে `F(10) = 55`, তাই উত্তর `55`।",
    inputFormat: "এক লাইনে দুটি পূর্ণসংখ্যা `n` ও `M`।",
    outputFormat: "`F(n) mod M` এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`0 <= n <= 10^18`\n`1 <= M <= 10^9`",
    editorial:
      "### ধারণা\n\nধারা ধীরে বানালে `n = 10^18`-এ অসম্ভব। মূল কথা: ধারাটা একটা linear recurrence, তাই অবস্থাটা ২টা সংখ্যা দিয়ে ধরা যায় এবং এক ধাপ ম্যাট্রিক্স গুণের সমতুল্য — `[F(n+1), F(n)] = [[1,1],[1,0]] * [F(n), F(n-1)]`। তাহলে `n` ধাপ মানে ম্যাট্রিক্সটার `n` ঘাত, আর ঘাত binary exponentiation-এ `O(log n)` ধাপে হয়। এখানে সরাসরি fast doubling ব্যবহার করা হয়েছে — একই লজিক, শুধু ২x২ ম্যাট্রিক্স না লিখে সূত্র দিয়ে: `F(2k) = F(k) * (2*F(k+1) - F(k))` এবং `F(2k+1) = F(k)^2 + F(k+1)^2`।\n\n### ধাপে ধাপে\n\n1. `n` আর `M` পড়ে নিন।\n2. `n`-এর বাইনারি রূপের সব বিট MSB থেকে ঘুরুন; প্রতিটি বিটে `(a, b) = (F(k), F(k+1))` থেকে ডাবলিং সূত্রে `(F(2k), F(2k+1))` হিসাব করুন।\n3. বিট `1` হলে এক ধাপ এগিয়ে `F(2k+1), F(2k+2)` নিন, বিট `0` হলে থেমে থাকুন।\n4. প্রতিটি ধাপে `M` দিয়ে ভাগ করুন যাতে সংখ্যা বড় না হয়।\n5. শেষে `a` প্রিন্ট করুন (`F(n)`)।\n\n```python\nimport sys\nn, M = map(int, sys.stdin.read().split())\na, b = 0, 1\nfor bit in bin(n)[2:]:\n    c = (a * ((2 * b - a) % M)) % M\n    d = (a * a + b * b) % M\n    if bit == '0':\n        a, b = c, d\n    else:\n        a, b = d, (c + d) % M\nprint(a)\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(log n)`, স্পেস `O(1)`। `n = 10^18`-এ মাত্র ৬০ বিট, তাই তাৎক্ষণিক।\n\n### সাধারণ ভুল\n\n- `2 * b - a` নেগেটিভ হতে পারে — Python-এ `(2*b - a) % M` ঠিক রাখে, কিন্তু C++-তে `((2*b - a) % M + M) % M` না করলে ভুল হয়।\n- প্রতিটি ধাপে মডিউল না নেওয়া — ঘাত বাড়তে বাড়তে `a * a` overflow করে।\n- `n = 0` সীমাটা ভুলে যাওয়া — `F(0) = 0`, শূন্য থেকে শুরু হলেই উত্তর `0`।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Number Theory", "Matrix Exponentiation", "Fibonacci"],
    tests: [
      { input: "10 1000\n", expectedOutput: "55\n", isSample: true },
      { input: "0 7\n", expectedOutput: "0\n", isSample: true },
      { input: "1 100\n", expectedOutput: "1\n", isSample: false },
      { input: "12 13\n", expectedOutput: "1\n", isSample: false },
      { input: "90 1000000007\n", expectedOutput: "210345902\n", isSample: false },
      { input: "1 1\n", expectedOutput: "0\n", isSample: false },
      {
        input: "1000000000000000000 1000000007\n",
        expectedOutput: "209783453\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nn, M = map(int, sys.stdin.read().split())\na, b = 0, 1\nfor bit in bin(n)[2:]:\n    c = (a * ((2 * b - a) % M)) % M\n    d = (a * a + b * b) % M\n    if bit == '0':\n        a, b = c, d\n    else:\n        a, b = d, (c + d) % M\nprint(a)\n",
  },
  {
    slug: "learn-m7-advanced-number-theory-e1",
    title: "Power Modulo",
    statement:
      "ল্যাবের হ্যাশ ফাংশনে `a` ঘাত `b` সংখ্যাটা `M`-এর মডিউলে দরকার। সংখ্যাগুলো এত বড় যে আগে ঘাত করে তারপর ভাগ করা যাবে না — প্রতিটি ধাপেই ভাগ করতে হবে।\n\n`a^b mod M` প্রিন্ট করুন। বিশেষভাবে মনে রাখুন: `b = 0` হলে উত্তর `1` (যদি `M = 1` না হয়, তখন সবসময় `0`)।\n\nউদাহরণ: `2^10 = 1024`, `1024 mod 1000 = 24`।",
    inputFormat: "এক লাইনে তিনটি পূর্ণসংখ্যা `a`, `b` ও `M`।",
    outputFormat: "`a^b mod M` এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`0 <= a <= 10^9`\n`0 <= b <= 10^18`\n`1 <= M <= 10^9`",
    editorial:
      "### ধারণা\n\n`b` কে বাইনারিতে ভাঙা যায়: `13 = 1101`। প্রতিটি বিটে `base` নিজেকে গুণ করে ঘাত দ্বিগুণ করা যায়, আর বিট `1` হলে `result`-এ বর্তমান `base` গুণ করা যায়। এতে করে `b` সংখ্যা গুণ না করে মাত্র `log b` ধাপে কাজ শেষ হয়। প্রতিটি ধাপে `mod M` নিলে মান কখনো `M^2`-এর বেশি হয় না, তাই ৩২/৬৪ বিটেও overflow হয় না।\n\n### ধাপে ধাপে\n\n1. `result = 1 % M` এবং `base = a % M` দিয়ে শুরু করুন (`M = 1` হলে উত্তর সবসময় `0`)।\n2. `b > 0` থাকা পর্যন্ত লুপ চালান।\n3. `b`-এর নিচের বিট `1` হলে `result = (result * base) % M`।\n4. `base = (base * base) % M` করে `b >>= 1` করুন।\n5. লুপ শেষে `result` প্রিন্ট করুন।\n\n```python\nimport sys\na, b, M = map(int, sys.stdin.read().split())\nresult = 1 % M\nbase = a % M\nwhile b > 0:\n    if b & 1:\n        result = (result * base) % M\n    base = (base * base) % M\n    b >>= 1\nprint(result)\n```\n\nPython-এ `pow(a, b, M)` সরাসরি একই কাজ করে, তবে নিজে লিখলে কাজটা বোঝা যায়।\n\n### কমপ্লেক্সিটি\n\nসময় `O(log b)`, স্পেস `O(1)`। `b = 10^18`-এ মাত্র ৬০ ধাপ।\n\n### সাধারণ ভুল\n\n- `result` শুরু করা `1` দিয়ে, কিন্তু `M = 1`-এ উত্তর হওয়া উচিত `0` — `1 % M` লিখুন।\n- `b = 0`-কে বাদ দেওয়া বা ভুলে `result = 0` ধরে নেওয়া — `a^0 = 1` (সীমার শর্ত অনুযায়ী)।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Number Theory", "Modular Arithmetic", "Binary Exponentiation"],
    tests: [
      { input: "2 10 1000\n", expectedOutput: "24\n", isSample: true },
      { input: "3 0 5\n", expectedOutput: "1\n", isSample: true },
      { input: "0 5 7\n", expectedOutput: "0\n", isSample: false },
      { input: "0 0 7\n", expectedOutput: "1\n", isSample: false },
      { input: "10 9 3\n", expectedOutput: "1\n", isSample: false },
      { input: "5 0 1\n", expectedOutput: "0\n", isSample: false },
      {
        input: "123456789 987654321 1000000007\n",
        expectedOutput: "652541198\n",
        isSample: false,
      },
      {
        input: "999999937 1000000000000000000 1000000007\n",
        expectedOutput: "339761968\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\na, b, M = map(int, sys.stdin.read().split())\nresult = 1 % M\nbase = a % M\nwhile b > 0:\n    if b & 1:\n        result = (result * base) % M\n    base = (base * base) % M\n    b >>= 1\nprint(result)\n",
  },
  {
    slug: "learn-m7-advanced-number-theory-m1",
    title: "Totient Sum",
    statement:
      "সাদিয়া একটা টেবিল বানাতে চান: `1` থেকে `n` পর্যন্ত প্রতিটি সংখ্যার `φ` মান যোগ করলে কত হয়? ছোট `n`-এ একটা করে হিসাব করা যায়, কিন্তু `n` বড় হলে প্রতিটির জন্আলাদা করে ভাজক বের করা অকাল।\n\n`φ(1) + φ(2) + ... + φ(n)` প্রিন্ট করুন।\n\nউদাহরণ: `n = 5` হলে `1 + 1 + 2 + 2 + 4 = 10`।",
    inputFormat: "একটা পূর্ণসংখ্যা `n`।",
    outputFormat: "`1` থেকে `n` পর্যন্ত `φ` মানগুলোর যোগফল এক লাইনে প্রিন্ট করুন।",
    constraints: "`1 <= n <= 10^6`",
    editorial:
      "### ধারণা\n\nএকটা করে `φ(i)` বানালে `n = 10^6`-এ প্রতিটির জন্য `sqrt(i)` ভাজক খোঁজা যায় না। বদলে sieve-এর মতো করে সব একসাথে করা যায়: `phi[i] = i` দিয়ে শুরু করুন, তারপর যেকোনো `i` যদি `phi[i] == i` হয় (অর্থাৎ প্রাইম), তাহলে তার গুণিতকগুলোর জন্য `phi[j] -= phi[j] // i` করুন। প্রতিটি প্রাইম `p` ঠিক একবার করে প্রতিটি সংখ্যা থেকে `1/p` অংশ কেটে দেয় — সূত্রের ঠিক অনুরূপ।\n\n### ধাপে ধাপে\n\n1. `phi = list(range(n + 1))` বানান।\n2. `i = 2` থেকে `n`: `phi[i] == i` হলে `i` প্রাইম।\n3. `j = i, 2i, 3i, ...` ধরে `phi[j] -= phi[j] // i`।\n4. `sum(phi[1:])` প্রিন্ট করুন।\n\n```python\nimport sys\nn = int(sys.stdin.readline())\nphi = list(range(n + 1))\nfor i in range(2, n + 1):\n    if phi[i] == i:\n        for j in range(i, n + 1, i):\n            phi[j] -= phi[j] // i\nprint(sum(phi[1:]))\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n log log n)` (প্রতিটি প্রাইমের গুণিতক ঘোরা), স্পেস `O(n)`। `n = 10^6`-এ Python-এ কয়েক সেকেন্ডের মধ্যে চলে।\n\n### সাধারণ ভুল\n\n- প্রতিটি `i`-এর জন্য আলাদা ভাজক খোঁজা — সময় `O(n * sqrt(n))`, এখানে পুরোপুরি অকাল।\n- `phi[0]`-ও যোগ করে ফেলা — শর্ত `1` থেকে `n`, তাই `phi[1:]` নিন (`phi[1] = 1` ঠিক আছে, কিন্তু `phi[0] = 0` যোগ করলেও ফল একই, তবু সীমা মিলিয়ে চলুন)।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Number Theory", "Sieve", "Euler Totient"],
    tests: [
      { input: "1\n", expectedOutput: "1\n", isSample: true },
      { input: "10\n", expectedOutput: "32\n", isSample: true },
      { input: "5\n", expectedOutput: "10\n", isSample: false },
      { input: "100\n", expectedOutput: "3044\n", isSample: false },
      { input: "1000\n", expectedOutput: "304192\n", isSample: false },
      { input: "100000\n", expectedOutput: "3039650754\n", isSample: false },
      {
        input: "1000000\n",
        expectedOutput: "303963552392\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\nphi = list(range(n + 1))\nfor i in range(2, n + 1):\n    if phi[i] == i:\n        for j in range(i, n + 1, i):\n            phi[j] -= phi[j] // i\nprint(sum(phi[1:]))\n",
  },
  {
    slug: "learn-m7-advanced-number-theory-h1",
    title: "Recurrence Queries",
    statement:
      "তানভীর একটা ধারা নিয়ে কাজ করছেন: `f(1)` থেকে `f(4)` দেওয়া আছে, আর তারপর প্রতিটি পদ\n`f(n) = c1*f(n-1) + c2*f(n-2) + c3*f(n-3) + c4*f(n-4)`\n\nসূত্র অনুযায়ী গঠিত (সব মান `M`-এর মডিউলে ধরা হবে)। অনেকগুলো প্রশ্ন আসবে — প্রতিটি প্রশ্নে একটা `n` দেওয়া থাকবে, সেই `f(n)` প্রিন্ট করতে হবে। `n` এত বড় হতে পারে যে ধারা সরাসরি বানানো যাবে না।\n\nউদাহরণ: `f = 1, 1, 2, 3` এবং `c1 = c2 = 1`, `c3 = c4 = 0` হলে ধারাটা ফিবোনাচি, `f(5) = 5`, `f(10) = 55`।",
    inputFormat:
      "প্রথম লাইনে `M` ও `q`। দ্বিতীয় লাইনে `c1 c2 c3 c4`। তৃতীয় লাইনে `f(1) f(2) f(3) f(4)`। পরের `q` লাইনে প্রতিটিতে একটা করে `n`।",
    outputFormat: "`q` লাইন, প্রতিটিতে একটা `f(n)`।",
    constraints:
      "`1 <= M <= 10^9`\n`1 <= q <= 5000`\n`0 <= c_i < M`\n`0 <= f(i) < M` (i = 1..4)\n`1 <= n <= 10^18`",
    editorial:
      "### ধারণা\n\nধারাটা linear recurrence, তাই অবস্থাটা ৪টা ধারার পদ দিয়ে ধরা যায় এবং এক ধাপ মানে একটা ৪x৪ ম্যাট্রিক্স গুণ:\n\n`[f(n+1), f(n), f(n-1), f(n-2)] = A * [f(n), f(n-1), f(n-2), f(n-3)]`\n\nযেখানে `A`-এর প্রথম সারি `c1 c2 c3 c4`, তার নিচের তিন সারি identity-এর প্রথম তিন কলাম। তাহলে `f(n) = (A^(n-4) * state4)[0]` যেখানে `state4 = [f(4), f(3), f(2), f(1)]`। ঘাত binary exponentiation-এ `O(log n)` ধাপে হয়, আর অনেক প্রশ্ন থাকলে ঘাতগুলো একবার বানিয়ে রেখে প্রতি প্রশ্নে শুধু matrix-vector গুণ করলেই হয় — ম্যাট্রিক্স আবার আবার বানাতে হয় না।\n\n### ধাপে ধাপে\n\n1. `M`, `q`, ঘাতগুলো (`c`) আর প্রাথমিক মানগুলো (`f`) পড়ে নিন।\n2. `A` বানান এবং `powers[i] = A^(2^i)` আগে থেকেই গুনে রাখুন (প্রায় ৬০টা)।\n3. প্রতিটি প্রশ্নে: `n <= 4` হলে সরাসরি `f[n-1]`।\n4. নাহলে `state = [f4, f3, f2, f1]` ধরে `n - 4`-এর সেট বিট অনুযায়ী সংশ্লিষ্ট `powers[i]` দিয়ে `state` গুণ করুন।\n5. `state[0]` প্রিন্ট করুন।\n\n```python\nimport sys\ndata = sys.stdin.read().split()\nit = iter(data)\nM = int(next(it)); q = int(next(it))\nc = [int(next(it)) % M for _ in range(4)]\nf = [int(next(it)) % M for _ in range(4)]\nA = [[c[0], c[1], c[2], c[3]],\n     [1, 0, 0, 0],\n     [0, 1, 0, 0],\n     [0, 0, 1, 0]]\ndef mm(X, Y):\n    return [[sum(X[i][k] * Y[k][j] for k in range(4)) % M\n             for j in range(4)] for i in range(4)]\npowers = [A]\nfor _ in range(60):\n    powers.append(mm(powers[-1], powers[-1]))\ndef apply(mat, vec):\n    return [sum(mat[i][j] * vec[j] for j in range(4)) % M for i in range(4)]\nout = []\nfor _ in range(q):\n    n = int(next(it))\n    if n <= 4:\n        out.append(str(f[n - 1]))\n        continue\n    vec = [f[3], f[2], f[1], f[0]]\n    e = n - 4\n    i = 0\n    while e:\n        if e & 1:\n            vec = apply(powers[i], vec)\n        e >>= 1\n        i += 1\n    out.append(str(vec[0]))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n### কমপ্লেক্সিটি\n\nম্যাট্রিক্স ঘাত তৈরি `O(64 * 4^3)`, প্রতি প্রশ্নে `O(64 * 4^2)` — মোট `q = 5000`-এ প্রায় `5 * 10^6` গুণ। স্পেস `O(64 * 16)`।\n\n### সাধারণ ভুল\n\n- ঘাতের ভুল সূচক: `state4` থেকে `A^(n-4)` লাগবে, `A^n` নয়; `n = 4`-এ ঘাত `0` মানে identity।\n- প্রতি প্রশ্নে নতুন করে ঘাত গুনে বানানো — সময় `q * log n` বেড়ে যায়; আগে থেকে ঘাত সংরক্ষণ করুন।\n- শুরুর ৪টা মানকেও সূত্র দিয়ে বদলে দেওয়া — প্রশ্ন অনুযায়ী `f(1..4)` দেওয়া মান হিসেবেই ধরতে হবে।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Number Theory", "Matrix Exponentiation", "Linear Recurrence"],
    tests: [
      {
        input: "1000 3\n1 1 0 0\n1 1 2 3\n1\n5\n10\n",
        expectedOutput: "1\n5\n55\n",
        isSample: true,
      },
      {
        input: "97 3\n1 1 1 0\n1 1 1 1\n4\n5\n6\n",
        expectedOutput: "1\n3\n5\n",
        isSample: true,
      },
      {
        input: "1000000007 4\n2 3 5 7\n10 20 30 40\n1\n2\n3\n4\n",
        expectedOutput: "10\n20\n30\n40\n",
        isSample: false,
      },
      {
        input: "13 3\n0 0 0 0\n1 2 3 4\n4\n5\n100\n",
        expectedOutput: "4\n0\n0\n",
        isSample: false,
      },
      {
        input:
          "1 3\n0 0 0 0\n0 0 0 0\n1\n5\n1000000000000000000\n",
        expectedOutput: "0\n0\n0\n",
        isSample: false,
      },
      {
        input:
          "1000000007 2\n1 1 0 0\n1 1 2 3\n1000000000000000000\n999999999999999999\n",
        expectedOutput: "209783453\n470273943\n",
        isSample: false,
      },
      {
        input: `1000000007 5000\n1 1 0 0\n1 1 2 3\n${RECUR_QUERIES}\n`,
        expectedOutput: newlineOutput(
          Array.from({ length: 5000 }, (_, i) =>
            i % 2 ? 470273943 : 209783453,
          ),
        ),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = sys.stdin.read().split()\nit = iter(data)\nM = int(next(it)); q = int(next(it))\nc = [int(next(it)) % M for _ in range(4)]\nf = [int(next(it)) % M for _ in range(4)]\nA = [[c[0], c[1], c[2], c[3]],\n     [1, 0, 0, 0],\n     [0, 1, 0, 0],\n     [0, 0, 1, 0]]\ndef mm(X, Y):\n    return [[sum(X[i][k] * Y[k][j] for k in range(4)) % M\n             for j in range(4)] for i in range(4)]\npowers = [A]\nfor _ in range(60):\n    powers.append(mm(powers[-1], powers[-1]))\ndef apply(mat, vec):\n    return [sum(mat[i][j] * vec[j] for j in range(4)) % M for i in range(4)]\nout = []\nfor _ in range(q):\n    n = int(next(it))\n    if n <= 4:\n        out.append(str(f[n - 1]))\n        continue\n    vec = [f[3], f[2], f[1], f[0]]\n    e = n - 4\n    i = 0\n    while e:\n        if e & 1:\n            vec = apply(powers[i], vec)\n        e >>= 1\n        i += 1\n    out.append(str(vec[0]))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m7-advanced-number-theory-x1",
    title: "Totient Queries",
    statement:
      "ক্যাম্পাস কুইজের প্রস্তুতিতে রাফির প্রতিটি প্রশ্নে একটা করে বড় সংখ্যা আসছে, আর প্রতিটির জন্য `φ(n)` বের করতে হবে। একটা করে ভাজক খোঁজা চললেও অনেক প্রশ্নে সময় বেশি লাগবে — আগে থেকে প্রাইম তালিকা রাখলে দ্রুত হয়।\n\n`q` টি সংখ্যার জন্য প্রতিটির `φ` মান আলাদা লাইনে প্রিন্ট করুন।",
    inputFormat:
      "প্রথম লাইনে `q`, পরের `q` লাইনে প্রতিটিতে একটা করে `n`।",
    outputFormat: "`q` লাইন, প্রতিটিতে একটা `φ(n)`।",
    constraints:
      "`1 <= q <= 50`\n`1 <= n <= 10^12`",
    editorial:
      "### ধারণা\n\nএকটা সংখ্যার `φ` বের করতে `sqrt(n)` পর্যন্ত ভাজক খুঁজতে হয়, যা `n = 10^12`-এ `10^6` ধাপ। `q = 50` হলে মোট `5 * 10^7` ধাপ — খুব টানা যায় না। বদলে `10^6` পর্যন্ত একবার sieve চালিয়ে সব প্রাইম (প্রায় ৭৮০০০টা) রেখে দিন; তারপর প্রতিটি `n` কে শুধু এই প্রাইম দিয়ে ভাগ করলেই হয়। বড় `n`-এর ভাজক সবসময় একটা করে প্রাইম থেকে শুরু হয়, তাই শুধু প্রাইম তালিকাই যথেষ্ট।\n\n### ধাপে ধাপে\n\n1. `10^6` পর্যন্ত sieve চালিয়ে প্রাইমের তালিকা বানান।\n2. প্রতিটি `n`-এর জন্য `result = n`, `x = n` ধরুন।\n3. প্রাইম `p` দিয়ে যতক্ষণ `p * p <= x`: `x % p == 0` হলে `x` থেকে পুরো ঘাত বাদ দিয়ে `result -= result // p`।\n4. শেষে `x > 1` হলে `x` নিজেই প্রাইম — `result -= result // x`।\n5. প্রতিটি উত্তর এক লাইনে প্রিন্ট করুন।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nq = data[0]\nLIMIT = 1000000\nsieve = bytearray(b'\\x01') * (LIMIT + 1)\nsieve[0:2] = b'\\x00\\x00'\nprimes = []\nfor i in range(2, LIMIT + 1):\n    if sieve[i]:\n        primes.append(i)\n        start = i * i\n        if start <= LIMIT:\n            sieve[start:LIMIT + 1:i] = b'\\x00' * (((LIMIT - start) // i) + 1)\nout = []\nfor idx in range(1, q + 1):\n    n = data[idx]\n    result = x = n\n    for p in primes:\n        if p * p > x:\n            break\n        if x % p == 0:\n            while x % p == 0:\n                x //= p\n            result -= result // p\n    if x > 1:\n        result -= result // x\n    out.append(str(result))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(LIMIT log log LIMIT + q * (π(LIMIT) পর্যন্ত লুপ))`, যেখানে `π(10^6)≈ 78498`; মোট প্রায় `4 * 10^6` ধাপ। স্পেস `O(LIMIT)`।\n\n### সাধারণ ভুল\n\n- প্রতিটি প্রশ্নে নতুন করে `sqrt(n)` পর্যন্ত লুপ — সময় প্রায় দ্বিগুণ; প্রাইম তালিকা একবার বানিয়ে রাখুন।\n- `p * p > x` শর্ত না রাখা — `x` ছোট হওয়া পর্যন্ত অকার্যকর ভাগ চলতে থাকে, আর ভুল হওয়ার সম্ভাবনাও বাড়ে।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Number Theory", "Euler Totient", "Sieve"],
    tests: [
      {
        input: "3\n1\n10\n7\n",
        expectedOutput: "1\n4\n6\n",
        isSample: true,
      },
      { input: "2\n12\n100\n", expectedOutput: "4\n40\n", isSample: true },
      { input: "1\n999983\n", expectedOutput: "999982\n", isSample: false },
      {
        input: "2\n1000000\n999999999999\n",
        expectedOutput: "400000\n461894400000\n",
        isSample: false,
      },
      {
        input: "1\n1000000000000\n",
        expectedOutput: "400000000000\n",
        isSample: false,
      },
      {
        input: `50\n${TOTIENT_BIG_QUERIES}\n`,
        expectedOutput: newlineOutput(Array(50).fill(400000000000)),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nq = data[0]\nLIMIT = 1000000\nsieve = bytearray(b'\\x01') * (LIMIT + 1)\nsieve[0:2] = b'\\x00\\x00'\nprimes = []\nfor i in range(2, LIMIT + 1):\n    if sieve[i]:\n        primes.append(i)\n        start = i * i\n        if start <= LIMIT:\n            sieve[start:LIMIT + 1:i] = b'\\x00' * (((LIMIT - start) // i) + 1)\nout = []\nfor idx in range(1, q + 1):\n    n = data[idx]\n    result = x = n\n    for p in primes:\n        if p * p > x:\n            break\n        if x % p == 0:\n            while x % p == 0:\n                x //= p\n            result -= result // p\n    if x > 1:\n        result -= result // x\n    out.append(str(result))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m7-advanced-number-theory-x2",
    title: "nCr Modulo Prime",
    statement:
      "নুসরাত সম্ভাবনার হিসাবে `C(n, r)` নিয়ে কাজ করছেন, কিন্তু `n` এত বড় যে বিনা ভাগে গুণ করা সম্ভব নয়। সুখবর এই যে ভাগকারী `p` একটা প্রাইম — তাহলে Lucas' theorem বলে পুরো হিসাবটা `p`-এর ঘরে ভেঙে ফেলা যায়।\n\nপ্রতিটি প্রশ্নে `n` ও `r` দেওয়া থাকবে, `C(n, r) mod p` প্রিন্ট করুন। `r > n` হলে `C(n, r) = 0`।\n\nউদাহরণ: `p = 7`-এ `C(7, 3) = 35`, `35 mod 7 = 0`।",
    inputFormat:
      "প্রথম লাইনে `p` ও `q`। পরের `q` লাইনে প্রতিটিতে `n` ও `r`।",
    outputFormat: "`q` লাইন, প্রতিটিতে একটা `C(n, r) mod p`।",
    constraints:
      "`2 <= p <= 1000`, `p` একটা প্রাইম\n`1 <= q <= 50`\n`0 <= r <= n <= 10^18`",
    editorial:
      "### ধারণা\n\nLucas' theorem: যদি `n` আর `r`-কে `p`-এর ঘরে লিখি (`n = n0 + n1*p + ...`, `r = r0 + r1*p + ...`), তাহলে\n\n`C(n, r) = C(n0, r0) * C(n1, r1) * ... (mod p)`\n\nপ্রতিটি `ni, ri < p`, তাই ছোট `C(ni, ri)` আগে থেকে factorial টেবিল দিয়ে হিসাব করা যায়। যদি কোনো ঘরে `ri > ni` হয়, তাহলে `C(n, r) = 0` (মানে `r`-এর কোনো বিট `n`-এর চেয়ে বড়)। প্রাইম `p`-এর জন্য `C(a, b) mod p = fact[a] * fact[b]^(p-2) * fact[a-b]^(p-2) mod p` — এখানে Fermat-এর উপপাদ্যের সাহায্যে বিপরীত `pow(x, p-2, p)`।\n\n### ধাপে ধাপে\n\n1. `p`-এর জন্য `fact[0..p-1]` টেবিল বানান।\n2. প্রতিটি প্রশ্নে `res = 1` ধরুন।\n3. `n` আর `r` যতক্ষণ শূন্য না হয়: `ni = n % p`, `ri = r % p`; `ri > ni` হলে `res = 0` থেমে যান, নাহলে `res = res * C(ni, ri) % p` এবং `n //= p`, `r //= p`।\n4. প্রতিটি উত্তর আলাদা লাইনে প্রিন্ট করুন।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\np = data[0]\nq = data[1]\nfact = [1] * p\nfor i in range(1, p):\n    fact[i] = fact[i - 1] * i % p\ndef small_c(nn, rr):\n    if rr < 0 or rr > nn:\n        return 0\n    return (fact[nn] * pow(fact[rr], p - 2, p)\n            % p * pow(fact[nn - rr], p - 2, p)) % p\nout = []\nidx = 2\nfor _ in range(q):\n    n = data[idx]\n    r = data[idx + 1]\n    idx += 2\n    res = 1\n    while n > 0 or r > 0:\n        ni, ri = n % p, r % p\n        if ri > ni:\n            res = 0\n            break\n        res = res * small_c(ni, ri) % p\n        n //= p\n        r //= p\n    out.append(str(res))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(p + q * log_p(n))`, স্পেস `O(p)`। `p <= 1000` তাই তাৎক্ষণিক।\n\n### সাধারণ ভুল\n\n- পুরো `C(n, r)` সরাসরি গুণ করা — `n = 10^18`-এ অসম্ভব; ঘরে ঘরে ভাঙতে হবে।\n- `ri > ni` চেক না করা — তখন `C(13, 1) mod 13` ভুল আসবে (সঠিক `0`)।\n- `p` প্রাইম না হলে `pow(x, p-2, p)` কাজ করে না — শর্ত অনুযায়ী `p` সবসময় প্রাইম।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Number Theory", "Combinatorics", "Lucas Theorem"],
    tests: [
      {
        input: "7 3\n7 3\n5 2\n0 0\n",
        expectedOutput: "0\n3\n1\n",
        isSample: true,
      },
      {
        input: "97 2\n100 2\n10 5\n",
        expectedOutput: "3\n58\n",
        isSample: true,
      },
      {
        input: "13 3\n13 1\n12 6\n0 0\n",
        expectedOutput: "0\n1\n1\n",
        isSample: false,
      },
      {
        input: "997 1\n1000000000000000000 0\n",
        expectedOutput: "1\n",
        isSample: false,
      },
      {
        input: "997 1\n1000000000000000000 1000000000000000000\n",
        expectedOutput: "1\n",
        isSample: false,
      },
      {
        input: `997 50\n${LUCAS_QUERIES}\n`,
        expectedOutput: newlineOutput(
          Array.from({ length: 50 }, (_, i) => (i % 2 ? 0 : 607)),
        ),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\np = data[0]\nq = data[1]\nfact = [1] * p\nfor i in range(1, p):\n    fact[i] = fact[i - 1] * i % p\ndef small_c(nn, rr):\n    if rr < 0 or rr > nn:\n        return 0\n    return (fact[nn] * pow(fact[rr], p - 2, p)\n            % p * pow(fact[nn - rr], p - 2, p)) % p\nout = []\nidx = 2\nfor _ in range(q):\n    n = data[idx]\n    r = data[idx + 1]\n    idx += 2\n    res = 1\n    while n > 0 or r > 0:\n        ni, ri = n % p, r % p\n        if ri > ni:\n            res = 0\n            break\n        res = res * small_c(ni, ri) % p\n        n //= p\n        r //= p\n    out.append(str(res))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
];
