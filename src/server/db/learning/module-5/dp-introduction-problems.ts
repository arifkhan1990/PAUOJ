import type { SeedProblem } from "../../seed-problems";
import { numbersInput } from "../generated-tests";

export const DP_INTRODUCTION_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m5-dp-introduction-g1",
    title: "N-th Fibonacci Number",
    statement:
      "রাফি ল্যাবের নতুন ডেকোরেশনের জন্য ফিবোনাচি ধারাটা ব্যবহার করছেন। সিরিজটা এভাবে শুরু হয়: `0, 1, 1, 2, 3, 5, 8, ...` — প্রতিটি সংখ্যা তার আগের দুইটির যোগ। তাই প্রথম ধাপ থেকে শুরু করে `n`-তম সংখ্যাটা কত, জানতে চান সাদিয়া।\n\nসংজ্ঞা: `fib(0) = 0`, `fib(1) = 1`, আর `n >= 2` হলে `fib(n) = fib(n-1) + fib(n-2)`।\n\nউদাহরণ: `n = 10` হলে সংখ্যাগুলো `0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55` — উত্তর `55`।",
    inputFormat: "একটি লাইনে একটি পূর্ণসংখ্যা `n`।",
    outputFormat: "`fib(n)` এক লাইনে প্রিন্ট করুন।",
    constraints: "`0 <= n <= 90`",
    editorial:
      "### ধারণা\n\nরিকার্সিভ সংজ্ঞা সরাসরি লিখলে `fib(n)` কল করলে `fib(n-1)` আর `fib(n-2)` কল হয়, আর সেগুলো আবার নিজেদের ছোট সমস্যা কল করে — ফলে একই মান বারবার হিসাব হয়। কিন্তু লক্ষ্য করলে দেখবেন প্রতিটি `i`-এর জন্য উত্তর ঠিক একবারই দরকার। তাই আগে থেকে দুইটা করে ঘর ভরে সামনে এগোলেই চলবে — এটাই tabulation।\n\n### ধাপে ধাপে\n\n1. ইনপুট থেকে `n` নিন।\n2. `a = 0`, `b = 1` ধরুন — যথাক্রমে `fib(0)` আর `fib(1)`।\n3. `2` থেকে `n` পর্যন্ত লুপ চালান: প্রতিবার `next = a + b`, তারপর `a = b`, `b = next`।\n4. লুপ শেষে `n == 0` হলে `a`, নাহলে `b` প্রিন্ট করুন।\n\n```python\nimport sys\nn = int(sys.stdin.readline())\na, b = 0, 1\nfor _ in range(n):\n    a, b = b, a + b\nprint(a)\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(1)` — পুরো অ্যারে ছাড়া শুধু দুইটা ভ্যারিয়েবলে কাজ হয়ে যায়। রিকার্সিভ সমাধান প্রায় `O(2^n)` সময় নেয়, তাই `n = 45`-এও সেটা শেষ হয় না।\n\n### সাধারণ ভুল\n\n- `n = 0`-এ `b` প্রিন্ট করে ফেলা — লুপ একবারও চলে না, তাই সঠিক উত্তর `a = 0`।\n- C++-তে `int` ব্যবহার করা: `n = 90`-এ মান `2880067194370816120`, `long long` ছাড়া overflow হবে।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Memoisation", "Math"],
    tests: [
      { input: "0\n", expectedOutput: "0\n", isSample: true },
      { input: "1\n", expectedOutput: "1\n", isSample: true },
      { input: "2\n", expectedOutput: "1\n", isSample: false },
      { input: "7\n", expectedOutput: "13\n", isSample: false },
      { input: "10\n", expectedOutput: "55\n", isSample: false },
      { input: "45\n", expectedOutput: "1134903170\n", isSample: false },
      {
        input: "90\n",
        expectedOutput: "2880067194370816120\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\na, b = 0, 1\nfor _ in range(n):\n    a, b = b, a + b\nprint(a)\n",
  },
  {
    slug: "learn-m5-dp-introduction-g2",
    title: "Maximum Non-Adjacent Sum",
    statement:
      "নুসরাত প্রাইমএশিয়ার হোস্টেলের সারি ধরে কয়েকটা ডোনার বাক্স সাজান। নিয়ম: একটা বাক্স নিলে তার ঠিক পাশের বাক্স আর নেওয়া যাবে না। প্রতিটি বাক্সে কয়টা টাকা আছে সেটা জানা, এখন সর্বোচ্চ কয় টাকা তোলা যায় সেটা বের করুন।\n\nএকটা বাক্সও না নেওয়াও যায়, কিন্তু সব মান ইতিবাচক হওয়ায় উত্তরে অন্তত একটা বাক্স থাকবেই।\n\nউদাহরণ: `1 2 3 4 5` বাক্সে সর্বোচ্চ `1 + 3 + 5 = 9`।",
    inputFormat:
      "প্রথম লাইনে বাক্সের সংখ্যা `n`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।",
    outputFormat: "সর্বোচ্চ যোগফল এক লাইনে প্রিন্ট করুন।",
    constraints: "`1 <= n <= 100000`\n`1 <= a_i <= 10^9`",
    editorial:
      "### ধারণা\n\n`dp[i]` ধরুন `i` পর্যন্ত বাক্সগুলো থেকে পাওয়া সর্বোচ্চ যোগফল। শেষ বাক্সটা নিলে আগেরটা বাদ যায়, না নিলে শেষটা বাদ যায় — তাই `dp[i] = max(dp[i-1], dp[i-2] + a[i])`। দুই আগের ঘরই যথেষ্ট, তাই দুইটা ভ্যারিয়েবলে ধরে রাখা যায়।\n\n### ধাপে ধাপে\n\n1. ইনপুট পড়ে অ্যারে `a` নিন।\n2. `p2 = 0` (দুই আগের সর্বোচ্চ), `p1 = a[0]` (এক আগের সর্বোচ্চ) দিয়ে শুরু করুন।\n3. প্রতিটি `x`-এর জন্য `p2, p1 = p1, max(p1, p2 + x)` চালান।\n4. শেষে `p1` প্রিন্ট করুন।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\np2, p1 = 0, a[0]\nfor x in a[1:]:\n    p2, p1 = p1, max(p1, p2 + x)\nprint(p1)\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(1)`। পুরো `dp` অ্যারে রাখলেও সময় একই, তবে প্রয়োজন নেই।\n\n### সাধারণ ভুল\n\n- `p2` আপডেটের আগেই `p1` ব্যবহার করা — তখন পুরনো `p2` হারিয়ে যায়। একসাথে টুপল অ্যাসাইনমেন্ট দিন।\n- `n = 1` বাদ: লুপ একবারও চলবে না, তবু `p1 = a[0]` ঠিক থাকে — শুধু লুপ শুরুর মান সঠিক রাখুন।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Arrays", "1D DP"],
    tests: [
      { input: "5\n1 2 3 4 5\n", expectedOutput: "9\n", isSample: true },
      { input: "3\n10 5 10\n", expectedOutput: "20\n", isSample: true },
      { input: "1\n7\n", expectedOutput: "7\n", isSample: false },
      { input: "2\n5 5\n", expectedOutput: "5\n", isSample: false },
      {
        input: "6\n3 1 1 3 100 2\n",
        expectedOutput: "104\n",
        isSample: false,
      },
      {
        input: numbersInput(Array.from({ length: 100000 }, () => 1000000000)),
        expectedOutput: "50000000000000\n",
        isSample: false,
      },
      {
        input: numbersInput(
          Array.from({ length: 100000 }, (_, i) => 100000 - i),
        ),
        expectedOutput: "2500050000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\np2, p1 = 0, a[0]\nfor x in a[1:]:\n    p2, p1 = p1, max(p1, p2 + x)\nprint(p1)\n",
  },
  {
    slug: "learn-m5-dp-introduction-e1",
    title: "Min Cost Climbing Stairs",
    statement:
      "তানভীর হোস্টেলের তিনতলার সিঁড়িতে উঠতে হয়, কিন্তু প্রতিটি ধাপে পা রাখলেই সেই ধাপের খরচ কাটা যায়। তিনি চান যেকোনো একটা ধাপ (`0` বা `1`) থেকে শুরু করে, প্রতিবার ১ বা ২ ধাপ করে এগিয়ে `n` ধাপের বেশি পৌঁছোনো পর্যন্ত সর্বনিম্ন খরচে উঠুন।\n\n`cost[i]` হলো `i` ধাপ ছাড়ার খরচ; শেষ ধাপ ছাড়ার খরচ নেই কারণ তার উপরে পৌঁছালেই কাজ শেষ।\n\nউদাহরণ: `cost = [10, 20]` — `0` ধাপ ছেড়ে `2`-এ গেলে খরচ `10`, তাই উত্তর `10`।",
    inputFormat:
      "প্রথম লাইনে ধাপের সংখ্যা `n`। দ্বিতীয় লাইনে `n`টি খরচ, স্পেস দিয়ে আলাদা।",
    outputFormat: "সর্বনিম্ন মোট খরচ এক লাইনে প্রিন্ট করুন।",
    constraints: "`2 <= n <= 100000`\n`1 <= cost_i <= 1000`",
    editorial:
      "### ধারণা\n\n`dp[i]` হোক `i` ধাপে দাঁড়ানোর সর্বনিম্ন খরচ; `dp[0] = 0`, `dp[1] = 0` (যেকোনো দুইয়ে ফ্রি শুরু)। `i`-তে আসা যায় `i-1` থেকে (`cost[i-1]` দিয়ে) বা `i-2` থেকে (`cost[i-2]` দিয়ে) — তাই `dp[i] = min(dp[i-1] + cost[i-1], dp[i-2] + cost[i-2])`। শেষ ঘর `dp[n]`-ই উত্তর, কারণ `n` ধাপ মানে সিঁড়ির উপরে পৌঁছানো।\n\n### ধাপে ধাপে\n\n1. `n` আর কস্ট অ্যারে পড়ুন।\n2. `p2 = 0`, `p1 = 0` দিয়ে শুরু করুন (`dp[0]`, `dp[1]`)।\n3. `i = 2 ... n` লুপ চালান: `cur = min(p1 + cost[i-1], p2 + cost[i-2])`, তারপর `p2, p1 = p1, cur`।\n4. লুপ শেষে `p1` প্রিন্ট করুন।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ncost = data[1:n + 1]\np2, p1 = 0, 0\nfor i in range(2, n + 1):\n    cur = min(p1 + cost[i - 1], p2 + cost[i - 2])\n    p2, p1 = p1, cur\nprint(p1)\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(1)` (দুই আগের ঘর)। পুরো `dp` অ্যারে রাখলেও `O(n)` সময়, কিন্তু স্পেস `O(n)`।\n\n### সাধারণ ভুল\n\n- শুরু ধাপের খরচ ধরে নেওয়া: প্রশ্নে `0` বা `1` থেকে ফ্রি শুরু — `cost[0]` বা `cost[1]` আগে যোগ করলে উত্তর বেড়ে যায়।\n- লুপ `i = 1` থেকে শুরু করে `cost[i-2]`-এ `cost[-1]` নিয়ে যাওয়া — Python-এ negative index নীরবে ভুল মান দেয়।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "1D DP", "Greedy Check"],
    tests: [
      { input: "2\n10 20\n", expectedOutput: "10\n", isSample: true },
      { input: "3\n1 100 1\n", expectedOutput: "2\n", isSample: true },
      { input: "4\n10 15 20 17\n", expectedOutput: "30\n", isSample: false },
      { input: "5\n5 1 1 1 1\n", expectedOutput: "2\n", isSample: false },
      {
        input: "6\n100 90 80 70 60 50\n",
        expectedOutput: "210\n",
        isSample: false,
      },
      {
        input: numbersInput(Array.from({ length: 100000 }, () => 1)),
        expectedOutput: "50000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ncost = data[1:n + 1]\np2, p1 = 0, 0\nfor i in range(2, n + 1):\n    cur = min(p1 + cost[i - 1], p2 + cost[i - 2])\n    p2, p1 = p1, cur\nprint(p1)\n",
  },
  {
    slug: "learn-m5-dp-introduction-m1",
    title: "Decode the Secret Message",
    statement:
      "সাদিয়া ক্যাম্পাস নোটিশ বোর্ডে একটা গোপন কোড পেয়েছেন: একটা অঙ্কের ধারা, যেখানে `1` থেকে `26` পর্যন্ত প্রতিটি সংখ্যা একটা ইংরেজি অক্ষর বোঝায় — `1 = A`, `2 = B`, ..., `26 = Z`। পুরো ধারাটা খণ্ড ভাগ করে অক্ষরে রূপান্তর করা যায় এমন ভাবে কয়টা আছে, সেটা গুনুন।\n\nনিয়ম: প্রতিটি খণ্ড অবশ্যই `1` থেকে `26`-এর মধ্যে হতে হবে এবং কোনো খণ্ড `0` দিয়ে শুরু হতে পারবে না। কোড ভাঙা সম্ভব না হলে উত্তর `0`।\n\nউদাহরণ: `1226` থেকে পাওয়া যায় `1 2 2 6`, `1 2 26`, `1 22 6`, `12 2 6`, `12 26` — মোট `5` টি।",
    inputFormat: "একটি লাইনে একটা অঙ্কের ধারা `s`।",
    outputFormat: "বৈধ ডিকোডিংয়ের সংখ্যা এক লাইনে প্রিন্ট করুন।",
    constraints: "`1 <= len(s) <= 50`\n`s` শুধু অঙ্ক (`0-9`) দিয়ে তৈরি।",
    editorial:
      "### ধারণা\n\n`dp[i]` হোক প্রথম `i` অঙ্ক দিয়ে ডিকোডিংয়ের সংখ্যা। শেষ অঙ্কটা একা নিলে (`s[i-1] != '0'`) `dp[i-1]` ভাগ চলে; শেষ দুই অঙ্ক একসাথে নিলে (`10` থেকে `26`-এর মধ্যে) `dp[i-2]` ভাগ চলে। দুই শর্তই মিললে দুইটার যোগই উত্তর। `0` একা কোনো খণ্ড হতে পারে না, তাই সেটা আলাদা করে যাচাই করতে হয়।\n\n### ধাপে ধাপে\n\n1. ধারাটা পড়ুন; `dp` অ্যারে `n + 1` আকারে বানান, `dp[0] = 1` (খালি অংশের একটা মাত্র ভাগ)।\n2. `i = 1` থেকে `n` লুপ চালান।\n3. এক অঙ্কের খণ্ড: `s[i-1] != '0'` হলে `dp[i] += dp[i-1]`।\n4. দুই অঙ্কের খণ্ড: `10 <= int(s[i-2:i]) <= 26` হলে `dp[i] += dp[i-2]`।\n5. `dp[n]` প্রিন্ট করুন।\n\n```python\nimport sys\ns = sys.stdin.readline().strip()\nn = len(s)\ndp = [0] * (n + 1)\ndp[0] = 1\nfor i in range(1, n + 1):\n    if s[i - 1] != '0':\n        dp[i] += dp[i - 1]\n    if i >= 2 and 10 <= int(s[i - 2:i]) <= 26:\n        dp[i] += dp[i - 2]\nprint(dp[n])\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(n)`। `n <= 50` হওয়ায় উত্তর সবসময় 64-বিটের মধ্যে থাকে।\n\n### সাধারণ ভুল\n\n- `0` নিয়ে ভুল: `06` ডিকোড করা যায় না (`06` সংখ্যা হয় `6`, কিন্তু খণ্ড শূন্য দিয়ে শুরু হওয়া নিষিদ্ধ) — উত্তর `0`।\n- দুই অঙ্কের যাচাই না করে শুধু এক অঙ্কের ধারায় গেলে `27`-এর মতো কেসেও ভাগ ধরা পড়ে, ফলে উত্তর বাড়ে।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Strings", "Counting"],
    tests: [
      { input: "1226\n", expectedOutput: "5\n", isSample: true },
      { input: "226\n", expectedOutput: "3\n", isSample: true },
      { input: "06\n", expectedOutput: "0\n", isSample: false },
      { input: "10\n", expectedOutput: "1\n", isSample: false },
      { input: "27\n", expectedOutput: "1\n", isSample: false },
      { input: "1111111111\n", expectedOutput: "89\n", isSample: false },
      { input: "1".repeat(50) + "\n", expectedOutput: "20365011074\n", isSample: false },
    ],
    referencePython:
      "import sys\ns = sys.stdin.readline().strip()\nn = len(s)\ndp = [0] * (n + 1)\ndp[0] = 1\nfor i in range(1, n + 1):\n    if s[i - 1] != '0':\n        dp[i] += dp[i - 1]\n    if i >= 2 and 10 <= int(s[i - 2:i]) <= 26:\n        dp[i] += dp[i - 2]\nprint(dp[n])\n",
  },
  {
    slug: "learn-m5-dp-introduction-h1",
    title: "Minimum Palindrome Cuts",
    statement:
      "তানভীর একটা টেক্সট ফাইলকে এমনভাবে ভাগ করতে চান যেন প্রতিটি অংশ পড়লে এগোলে পিছুলে একই থাকে — অর্থাৎ প্রতিটি অংশ palindrome হয়। সংখ্যাটা কমাতে হবে কাটার সংখ্যা।\n\nএকটা কাট দিয়ে দুই অংশ, দুই কাটে তিন অংশ — এভাবে। পুরো স্ট্রিংটাই যদি palindrome হয়, তাহলে কাট লাগবে না, উত্তর `0`।\n\nউদাহরণ: `aab` → `aa|b` একটাই কাট, উত্তর `1`; `abc` → `a|b|c` দুই কাট, উত্তর `2`।",
    inputFormat: "একটি লাইনে একটা ছোট হাতের অক্ষরের স্ট্রিং `s`।",
    outputFormat: "সর্বনিম্ন কাটের সংখ্যা এক লাইনে প্রিন্ট করুন।",
    constraints: "`1 <= len(s) <= 1000`\n`s` শুধু ছোট হাতের ইংরেজি অক্ষর।",
    editorial:
      "### ধারণা\n\n`dp[i]` হোক প্রথম `i + 1` অক্ষর (`s[0..i]`) কাটা সর্বনিম্ন সংখ্যা। `s[0..i]` নিজেই palindrome হলে `dp[i] = 0`। না হলে শেষ খণ্ডটা `s[j..i]` ধরে ভাগ করুন: তখন `dp[i] = dp[j-1] + 1`। সব `j`-এর জন্য সর্বনিম্নটা নিন। কোন `s[j..i]` palindrome কিনা দ্রুত যাচাই করতে আগে থেকে একটা টেবিল `pal[i][j]` বানান: `s[i] == s[j]` এবং ভেতরের অংশ palindrome হলেই `pal[i][j] = True`।\n\n### ধাপে ধাপে\n\n1. `n = len(s)` নিন; `n x n` টেবিল `pal` সব `False` দিয়ে শুরু করুন।\n2. `i` নিচ থেকে উপরে, `j` সামনে থেকে পিছনে ঘুরে: `s[i] == s[j]` এবং (`j - i < 2` বা `pal[i+1][j-1]`) হলে `pal[i][j] = True`।\n3. `dp[i]` ভরুন: `pal[0][i]` হলে `0`, নাহলে `min(dp[j-1] + 1)` যেখানে `pal[j][i]` সত্য।\n4. `dp[n-1]` প্রিন্ট করুন।\n\n```python\nimport sys\ns = sys.stdin.readline().strip()\nn = len(s)\npal = [[False] * n for _ in range(n)]\nfor i in range(n - 1, -1, -1):\n    for j in range(i, n):\n        if s[i] == s[j] and (j - i < 2 or pal[i + 1][j - 1]):\n            pal[i][j] = True\ndp = [0] * n\nfor i in range(n):\n    if pal[0][i]:\n        dp[i] = 0\n    else:\n        best = n\n        for j in range(1, i + 1):\n            if pal[j][i]:\n                best = min(best, dp[j - 1] + 1)\n        dp[i] = best\nprint(dp[n - 1])\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n^2)`, স্পেস `O(n^2)`। `n = 1000` হলে প্রায় দুই লক্ষ ঘর, Python-এও ২ সেকেন্ডের মধ্যে চলে।\n\n### সাধারণ ভুল\n\n- `dp[i] = min(dp[j])` লেখা (`+1` ভুলে): কাট সংখ্যা কমে যায়, শূন্য ফলেও আসে। প্রতিটি নতুন খণ্ডে একটা কাট যোগ হয়।\n- টেবিল ভরার ক্রম ভুল: `pal[i][j]` লেখার সময় `pal[i+1][j-1]` আগে ভরা থাকতে হবে, তাই `i` নিচ থেকে উপরে।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Palindrome", "Strings"],
    tests: [
      { input: "aab\n", expectedOutput: "1\n", isSample: true },
      { input: "abcba\n", expectedOutput: "0\n", isSample: true },
      { input: "abc\n", expectedOutput: "2\n", isSample: false },
      { input: "abab\n", expectedOutput: "1\n", isSample: false },
      { input: "aaaa\n", expectedOutput: "0\n", isSample: false },
      { input: "a".repeat(1000) + "\n", expectedOutput: "0\n", isSample: false },
      {
        input:
          Array.from({ length: 1000 }, (_, i) => "abc"[i % 3]).join("") + "\n",
        expectedOutput: "999\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ns = sys.stdin.readline().strip()\nn = len(s)\npal = [[False] * n for _ in range(n)]\nfor i in range(n - 1, -1, -1):\n    for j in range(i, n):\n        if s[i] == s[j] and (j - i < 2 or pal[i + 1][j - 1]):\n            pal[i][j] = True\ndp = [0] * n\nfor i in range(n):\n    if pal[0][i]:\n        dp[i] = 0\n    else:\n        best = n\n        for j in range(1, i + 1):\n            if pal[j][i]:\n                best = min(best, dp[j - 1] + 1)\n        dp[i] = best\nprint(dp[n - 1])\n",
  },
  {
    slug: "learn-m5-dp-introduction-x1",
    title: "Stairs with Steps 1, 2 or 3",
    statement:
      "প্রাইমএশিয়ার লাইব্রেরির সিঁড়িতে প্রতি ধাপে এক ধাপ, দুই ধাপ বা তিন ধাপ করে উঠা যায়। `n` ধাপ উঠার কয়টা ভিন্ন পথ সম্ভব, সেটা গুনে সাদিয়াকে জানান।\n\nপথ বলতে ধাপের ক্রম বোঝা; একই ধাপ নিয়ে আলাদা ক্রম আলাদা পথ।\n\nউদাহরণ: `n = 3` হলে `1+1+1`, `1+2`, `2+1`, `3` — মোট `4` পথ।",
    inputFormat: "একটি লাইনে একটি পূর্ণসংখ্যা `n`।",
    outputFormat: "পথের সংখ্যা এক লাইনে প্রিন্ট করুন।",
    constraints: "`1 <= n <= 60`",
    editorial:
      "### ধারণা\n\nশেষ ধাপে যেকোনো একটা অবস্থা থেকেই আসা যায়: শেষ ধাপটা এক ধাপ আগে থেকে এলে `dp[n-1]` পথ, দুই ধাপ আগে থেকে `dp[n-2]`, তিন ধাপ আগে থেকে `dp[n-3]`। তাই `dp[n] = dp[n-1] + dp[n-2] + dp[n-3]` — ফিবোনাচির চেয়ে একটা পদ বেশি যোগ। এটাই দেখায় একই state প্যাটার্নে নতুন transition যোগ করলে সমস্যাটা কীভাবে বদলায়।\n\n### ধাপে ধাপে\n\n1. ইনপুট `n` নিন।\n2. Base: `a = 1` (`n = 1`), `b = 2` (`n = 2`), `c = 4` (`n = 3`)।\n3. `4` থেকে `n` পর্যন্ত লুপ: `a, b, c = b, c, a + b + c`।\n4. `n` ছোট হলে সরাসরি মান প্রিন্ট, নাহলে লুপের পর `c` প্রিন্ট করুন।\n\n```python\nimport sys\nn = int(sys.stdin.readline())\nif n == 1:\n    print(1)\nelif n == 2:\n    print(2)\nelse:\n    a, b, c = 1, 2, 4\n    for _ in range(3, n):\n        a, b, c = b, c, a + b + c\n    print(c)\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(1)`। রিকার্সিভ কল করলে একই সমস্যা বারবার আসবে — memo না থাকলে সময় ঘাড়ে পড়বে।\n\n### সাধারণ ভুল\n\n- `n = 3`-এ লুপ না চালিয়ে শুধু দুই পদ রাখলে উত্তর `2` আসবে, আসল `4` নয়।\n- Base case `n = 3` পর্যন্ত ঠিক না দিলে লুপের প্রথম ঘরেই ভুল মান ঢোকে।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Counting", "1D DP"],
    tests: [
      { input: "1\n", expectedOutput: "1\n", isSample: true },
      { input: "3\n", expectedOutput: "4\n", isSample: true },
      { input: "2\n", expectedOutput: "2\n", isSample: false },
      { input: "4\n", expectedOutput: "7\n", isSample: false },
      { input: "10\n", expectedOutput: "274\n", isSample: false },
      { input: "30\n", expectedOutput: "53798080\n", isSample: false },
      { input: "60\n", expectedOutput: "4680045560037375\n", isSample: false },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\nif n == 1:\n    print(1)\nelif n == 2:\n    print(2)\nelse:\n    a, b, c = 1, 2, 4\n    for _ in range(3, n):\n        a, b, c = b, c, a + b + c\n    print(c)\n",
  },
  {
    slug: "learn-m5-dp-introduction-x2",
    title: "Circular House Robber",
    statement:
      "রাফির সারি ধরে ঘর — প্রথম আর শেষ ঘর একে অপরের পাশে, কারণ বাড়িটা গোল। প্রতিটি ঘরে কয় টাকা আছে জানা; ঠিক পাশের ঘর দুটো একসাথে তোলা যাবে না। এই চক্রাকার সারিতে সর্বোচ্চ কয় টাকা তোলা যায়, সেটা বের করুন।\n\nউদাহরণ: `1 2 3 1` ঘরে সর্বোচ্চ `1 + 3 = 4` — কিন্তু `1` আর শেষ `1` পাশাপাশি হওয়ায় দুটো একসাথে নেওয়া যায় না।",
    inputFormat:
      "প্রথম লাইনে ঘরের সংখ্যা `n`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।",
    outputFormat: "সর্বোচ্চ যোগফল এক লাইনে প্রিন্ট করুন।",
    constraints: "`1 <= n <= 100000`\n`1 <= a_i <= 10^9`",
    editorial:
      "### ধারণা\n\nচক্র হওয়ায় প্রথম আর শেষ ঘর একসাথে আসতে পারে না — এই সীমাটাই সমস্যাটার মূল। দুইটা কেসে ভাগ করুন: (১) প্রথম ঘর বাদ, অর্থাৎ `a[1:]` সাধারণ সারি; (২) শেষ ঘর বাদ, অর্থাৎ `a[:-1]` সাধারণ সারি। প্রতিটি কেসে `max(dp[i-1], dp[i-2] + a[i])` দিয়ে সাধারণ সমাধান চালান, দুই উত্তরের বড়টাই চূড়ান্ত। `n = 1` হলে ঘরটাই উত্তর।\n\n### ধাপে ধাপে\n\n1. `n` আর অ্যারে পড়ুন; `n == 1` হলে সেটাই প্রিন্ট করে থামুন।\n2. `rob(nums)` ফাংশন লিখুন: `p2, p1 = 0, 0` দিয়ে শুরু করে প্রতিটি `x`-এ `p2, p1 = p1, max(p1, p2 + x)`।\n3. `rob(a[:-1])` আর `rob(a[1:])` বের করুন।\n4. দুই ফলের বড় মান প্রিন্ট করুন।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\ndef rob(nums):\n    p2, p1 = 0, 0\n    for x in nums:\n        p2, p1 = p1, max(p1, p2 + x)\n    return p1\nif n == 1:\n    print(a[0])\nelse:\n    print(max(rob(a[:-1]), rob(a[1:])))\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(1)` — দুইবার ঘোরালেও মোট কাজ দুই গুণ, তাই একই ধরনের সীমায় চলে।\n\n### সাধারণ ভুল\n\n- পুরো সারিতে সাধারণ DP চালিয়ে দেওয়া: উত্তরে প্রথম আর শেষ একসাথে আসতে পারে, ফলে ভুল বড় মান আসে।\n- `n = 1` বাদ দিলে `a[:-1]` আর `a[1:]` দুটোই খালি হয়, ফলে উত্তর `0` — কিন্তু একটা ঘর থাকলে সেটার মানই উত্তর।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Arrays", "1D DP"],
    tests: [
      { input: "4\n1 2 3 1\n", expectedOutput: "4\n", isSample: true },
      { input: "5\n1 2 3 4 5\n", expectedOutput: "8\n", isSample: true },
      { input: "1\n7\n", expectedOutput: "7\n", isSample: false },
      { input: "3\n2 3 2\n", expectedOutput: "3\n", isSample: false },
      { input: "2\n1 2\n", expectedOutput: "2\n", isSample: false },
      {
        input: numbersInput(Array.from({ length: 100000 }, () => 1000000000)),
        expectedOutput: "50000000000000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\ndef rob(nums):\n    p2, p1 = 0, 0\n    for x in nums:\n        p2, p1 = p1, max(p1, p2 + x)\n    return p1\nif n == 1:\n    print(a[0])\nelse:\n    print(max(rob(a[:-1]), rob(a[1:])))\n",
  },
];
