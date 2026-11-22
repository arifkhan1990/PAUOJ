import type { SeedProblem } from "../../seed-problems";

const HUNDRED_CHARS = Array.from(
  { length: 100 },
  (_, i) => "abcdefghijklmnopqrstuvwxyz"[i % 26],
).join("");

export const LCS_LIS_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m5-lcs-lis-g1",
    title: "Longest Common Substring",
    statement:
      "রাফি দুইটা টেক্সট ফাইল মিলিয়ে দেখছেন — পাশাপাশি থাকা অংশগুলোর মধ্যে দুই ফাইলেই যে দীর্ঘতম অংশ মিলে সেটা কত দৈর্ঘ্যের, সেটা জানতে চান। পাশাপাশি মানে substring: অক্ষরগুলো পরপর থাকতে হবে, ক্রমও ঠিক থাকবে।\n\nকোনো মিলিয়া অংশ না থাকলে উত্তর `0`।\n\nউদাহরণ: `abcd` আর `bc` — দুটোতেই `bc` পাশাপাশি আছে, উত্তর `2`।",
    inputFormat:
      "প্রথম লাইনে প্রথম স্ট্রিং `s`, দ্বিতীয় লাইনে দ্বিতীয় স্ট্রিং `t`। দুটোই ছোট হাতের ইংরেজি অক্ষরে।",
    outputFormat: "দীর্ঘতম কমন সাবস্ট্রিংয়ের দৈর্ঘ্য এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= len(s), len(t) <= 1000`",
    editorial:
      "### ধারণা\n\n`dp[i][j]` হোক `s`-এর প্রথম `i` অক্ষর আর `t`-এর প্রথম `j` অক্ষরের দীর্ঘতম কমন সাবস্ট্রিংয়ের দৈর্ঘ্য। শেষ অক্ষর দুটো মিললে `dp[i][j] = dp[i-1][j-1] + 1` — মিল একটা বাড়ল, আগের ডায়াগনাল অংশ যোগ হলো। মিললে না হলে শেষ মিল ভেঙে যায়, তাই `dp[i][j] = 0`। উত্তর হলো পুরো টেবিলের সর্বোচ্চ মান। স্ট্রিং শেষ হয়ে গেলেই `0` বসানো হয় — এটাই সাবস্ট্রিং আর সাবসেকোয়েন্সের মূল পার্থক্য।\n\n### ধাপে ধাপে\n\n1. দুই স্ট্রিং পড়ুন।\n2. `prev = [0] * (len(t) + 1)` দিয়ে শুরু করুন।\n3. `s`-এর প্রতিটি অক্ষরে নতুন `cur` বানিয়ে: মিল হলে `cur[j] = prev[j-1] + 1` এবং `best` আপডেট, মিললে না হলে `cur[j] = 0`।\n4. `prev = cur` করে অগ্রসর হোন; শেষে `best` প্রিন্ট করুন।\n\n```python\nimport sys\nlines = sys.stdin.read().splitlines()\na, b = lines[0], lines[1]\nprev = [0] * (len(b) + 1)\nbest = 0\nfor i in range(1, len(a) + 1):\n    cur = [0] * (len(b) + 1)\n    for j in range(1, len(b) + 1):\n        if a[i - 1] == b[j - 1]:\n            cur[j] = prev[j - 1] + 1\n            if cur[j] > best:\n                best = cur[j]\n    prev = cur\nprint(best)\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(len(s) * len(t))`, স্পেস `O(len(t))`। সর্বোচ্চ `10^6` ধাপ।\n\n### সাধারণ ভুল\n\n- মিল না হলেও আগের মান রেখে দেওয়া (`cur[j] = max(prev[j], cur[j-1])`) — সেটা LCS-এর নিয়ম, সাবস্ট্রিংয়ে চলবে না; এখানে মিল ভাঙলেই শূন্য।\n- উত্তর `dp[len(s)][len(t)]` ধরে নেওয়া — ভুল; দীর্ঘতম মিল মাঝখানেও থাকতে পারে, তাই সর্বোচ্চ খুঁজুন।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Strings", "Substring"],
    tests: [
      { input: "abcd\nbc\n", expectedOutput: "2\n", isSample: true },
      { input: "abc\ndef\n", expectedOutput: "0\n", isSample: true },
      { input: "programming\ngrammar\n", expectedOutput: "5\n", isSample: false },
      { input: "abcde\nabfde\n", expectedOutput: "2\n", isSample: false },
      { input: "a".repeat(1000) + "\n" + "a".repeat(1000) + "\n", expectedOutput: "1000\n", isSample: false },
      {
        input:
          "a".repeat(500) + "b".repeat(500) + "\n" +
          "b".repeat(500) + "a".repeat(500) + "\n",
        expectedOutput: "500\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nlines = sys.stdin.read().splitlines()\na, b = lines[0], lines[1]\nprev = [0] * (len(b) + 1)\nbest = 0\nfor i in range(1, len(a) + 1):\n    cur = [0] * (len(b) + 1)\n    for j in range(1, len(b) + 1):\n        if a[i - 1] == b[j - 1]:\n            cur[j] = prev[j - 1] + 1\n            if cur[j] > best:\n                best = cur[j]\n    prev = cur\nprint(best)\n",
  },
  {
    slug: "learn-m5-lcs-lis-g2",
    title: "Longest Common Subsequence",
    statement:
      "নুসরাত দুই কোর্সের নোট মিলিয়ে দেখছেন — ক্রম ঠিক রেখে দুই নোটেই যে দীর্ঘতম অংশ আছে তার দৈর্ঘ্য কত? এখানে অক্ষরগুলো পাশাপাশি থাকতে হবে না, শুধু আসার ক্রম ঠিক থাকতে হবে — এটাই subsequence।\n\nউদাহরণ: `abcdef` আর `ace` — `a`, `c`, `e` দুটোতেই ক্রম মেনে আছে, উত্তর `3`।",
    inputFormat:
      "প্রথম লাইনে `s`, দ্বিতীয় লাইনে `t`। দুটোই ছোট হাতের ইংরেজি অক্ষরে।",
    outputFormat: "LCS-এর দৈর্ঘ্য এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= len(s), len(t) <= 1000`",
    editorial:
      "### ধারণা\n\n`dp[i][j]` হোক `s`-এর প্রথম `i` আর `t`-এর প্রথম `j` অক্ষরের LCS দৈর্ঘ্য। শেষ অক্ষর মিললে `dp[i][j] = dp[i-1][j-1] + 1`; মিললে না হলে শেষ অক্ষরটা বাদ দিতে হবে — কোনটা বাদ দিলে ভালো হয় সেটা দুই শাখা থেকে বড়টা: `max(dp[i-1][j], dp[i][j-1])`। Base: খালি স্ট্রিংয়ের সাথে LCS `0`। সীমা ছোট হলে পুরো টেবিল, বড় হলে এক সারি করে ঘোরালেও চলে।\n\n### ধাপে ধাপে\n\n1. দুই স্ট্রিং পড়ুন।\n2. `prev = [0] * (len(t) + 1)` দিয়ে শুরু করুন।\n3. `s`-এর প্রতিটি অক্ষরে নতুন `cur` বানান: মিল হলে `cur[j] = prev[j-1] + 1`, নাহলে `cur[j] = max(prev[j], cur[j-1])`।\n4. `prev = cur`; শেষে `prev[len(t)]` প্রিন্ট করুন।\n\n```python\nimport sys\nlines = sys.stdin.read().splitlines()\na, b = lines[0], lines[1]\nprev = [0] * (len(b) + 1)\nfor i in range(1, len(a) + 1):\n    cur = [0] * (len(b) + 1)\n    for j in range(1, len(b) + 1):\n        if a[i - 1] == b[j - 1]:\n            cur[j] = prev[j - 1] + 1\n        else:\n            cur[j] = max(prev[j], cur[j - 1])\n    prev = cur\nprint(prev[len(b)])\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(len(s) * len(t))`, স্পেস `O(len(t))` (পুরো টেবিল রাখলে `O(len(s) * len(t))`, যা পুনরুদ্ধারে লাগে)।\n\n### সাধারণ ভুল\n\n- মিলের সময় ডায়াগনাল না দিয়ে `dp[i-1][j] + 1` লেখা — উত্তর বেড়ে যায়।\n- `max` না নিয়ে শুধু `dp[i-1][j]` রাখা: `t`-এর অক্ষর বাদ দেওয়ার সুযোগ হারায়, উত্তর কমে যায়।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Strings", "LCS"],
    tests: [
      { input: "abcdef\nace\n", expectedOutput: "3\n", isSample: true },
      { input: "abc\ndef\n", expectedOutput: "0\n", isSample: true },
      { input: "abc\nabc\n", expectedOutput: "3\n", isSample: false },
      { input: "kitten\nsitting\n", expectedOutput: "4\n", isSample: false },
      { input: "abcde\nace\n", expectedOutput: "3\n", isSample: false },
      {
        input:
          "ab".repeat(500) + "\n" + "a".repeat(500) + "b".repeat(500) + "\n",
        expectedOutput: "501\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nlines = sys.stdin.read().splitlines()\na, b = lines[0], lines[1]\nprev = [0] * (len(b) + 1)\nfor i in range(1, len(a) + 1):\n    cur = [0] * (len(b) + 1)\n    for j in range(1, len(b) + 1):\n        if a[i - 1] == b[j - 1]:\n            cur[j] = prev[j - 1] + 1\n        else:\n            cur[j] = max(prev[j], cur[j - 1])\n    prev = cur\nprint(prev[len(b)])\n",
  },
  {
    slug: "learn-m5-lcs-lis-e1",
    title: "Longest Increasing Subsequence",
    statement:
      "তানভীর ল্যাব রিপোর্টে কয়েকটা দিনের টাকা জমার তালিকা আছে; কোন একটা অংশে টাকা ক্রমাগত বাড়তে থাকে — সেই দীর্ঘতম অংশটা কত দিনের, সেটা জানতে চান। অংশ মানে subsequence: সামনেরটা পাশ করেও যেতে পারে, শুধু আগের চেয়ে বড় হতে হবে এবং ক্রম ঠিক থাকতে হবে।\n\nউদাহরণ: `10 9 2 5 3 7 101 18` — দীর্ঘতমটা `2 3 7 18` বা `2 5 7 18`, উত্তর `4`।",
    inputFormat:
      "প্রথম লাইনে `n`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।",
    outputFormat: "LIS-এর দৈর্ঘ্য এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= n <= 1000`\n`-10^9 <= a_i <= 10^9`",
    editorial:
      "### ধারণা\n\n`dp[i]` হোক `i` শেষ করে সর্বোচ্চ বর্ধমান subsequence-এর দৈর্ঘ্য। প্রতিটি `i`-এর জন্য আগের সব `j < i` দেখুন: `a[j] < a[i]` হলে `dp[i] = max(dp[i], dp[j] + 1)`। না কেউ মিললে `dp[i] = 1` (নিজে একা)। চূড়ান্ত উত্তর `dp`-এর সর্বোচ্চ মান — কারণ সেরা subsequence যেকোনো ঘরে শেষ হতে পারে।\n\n### ধাপে ধাপে\n\n1. `n` আর অ্যারে পড়ুন।\n2. `dp = [1] * n` দিয়ে শুরু করুন।\n3. `i = 0` থেকে `n - 1`: `j = 0` থেকে `i - 1` ঘুরে `a[j] < a[i]` হলে `dp[i] = max(dp[i], dp[j] + 1)`।\n4. `max(dp)` প্রিন্ট করুন।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\ndp = [1] * n\nfor i in range(n):\n    for j in range(i):\n        if a[j] < a[i] and dp[j] + 1 > dp[i]:\n            dp[i] = dp[j] + 1\nprint(max(dp))\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n^2)`, স্পেস `O(n)`। `n = 1000`-এ প্রায় ৫ লক্ষ ধাপ, সহজে চলে। `n = 10^5` হলে `O(n log n)` (binary search + টেইল অ্যারে) লাগবে।\n\n### সাধারণ ভুল\n\n- `<=` ব্যবহার করা: প্রশ্ন কঠোরভাবে বর্ধমান চায়, তাই সমান মান গোনা হলে উত্তর বাড়ে।\n- চূড়ান্ত উত্তর `dp[n-1]` ধরা: সেরা subsequence শেষ ঘরে নাও শেষ হতে পারে — সব ঘরের বড়টা নিন।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "LIS", "Arrays"],
    tests: [
      { input: "8\n10 9 2 5 3 7 101 18\n", expectedOutput: "4\n", isSample: true },
      { input: "5\n5 4 3 2 1\n", expectedOutput: "1\n", isSample: true },
      { input: "5\n1 2 3 4 5\n", expectedOutput: "5\n", isSample: false },
      { input: "4\n7 7 7 7\n", expectedOutput: "1\n", isSample: false },
      {
        input: "1000\n" + Array.from({ length: 1000 }, (_, i) => i + 1).join(" ") + "\n",
        expectedOutput: "1000\n",
        isSample: false,
      },
      {
        input: "1000\n" + Array.from({ length: 1000 }, (_, i) => 1000 - i).join(" ") + "\n",
        expectedOutput: "1\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\ndp = [1] * n\nfor i in range(n):\n    for j in range(i):\n        if a[j] < a[i] and dp[j] + 1 > dp[i]:\n            dp[i] = dp[j] + 1\nprint(max(dp))\n",
  },
  {
    slug: "learn-m5-lcs-lis-m1",
    title: "Edit Distance",
    statement:
      "সাদিয়া একটা শব্দকে অন্য শব্দে বদলাতে চান। এক ধাপে একটা অক্ষর যোগ করা, মুছে ফেলা বা অন্য অক্ষর দিয়ে বদলানো যায়। পুরো রূপান্তরে সর্বনিম্ন কয়টা ধাপ লাগবে, সেটা বের করুন।\n\nউদাহরণ: `horse` থেকে `ros` — `h` মুছি, `r` বসাই, `e` → `s`: মোট `3` ধাপ।",
    inputFormat:
      "প্রথম লাইনে `s`, দ্বিতীয় লাইনে `t`। দুটোই ছোট হাতের ইংরেজি অক্ষরে; খালি লাইনও হতে পারে।",
    outputFormat: "সর্বনিম্ন ধাপের সংখ্যা এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`0 <= len(s), len(t) <= 1000`",
    editorial:
      "### ধারণা\n\n`dp[i][j]` হোক `s`-এর প্রথম `i` অক্ষরকে `t`-এর প্রথম `j` অক্ষরে রূপান্তরের সর্বনিম্ন ধাপ। শেষ অক্ষর মিললে কোনো ধাপ লাগে না: `dp[i][j] = dp[i-1][j-1]`। মিললে না হলে তিন সম্ভাবনা — `s`-এর শেষ অক্ষর মুছি (`dp[i-1][j] + 1`), `t`-এ শেষ অক্ষর যোগ (`dp[i][j-1] + 1`), বা বদলাই (`dp[i-1][j-1] + 1`); তিনটার সর্বনিম্ন নিই। LCS-এর সাথে সম্পর্ক: insert/delete দিয়ে হলে উত্তর `len(s) + len(t) - 2 * LCS`, কিন্তু replace থাকায় সরাসরি এই DP-টাই চাই।\n\n### ধাপে ধাপে\n\n1. দুই স্ট্রিং পড়ুন।\n2. `prev = list(range(len(t) + 1))` — খালি `s` থেকে শুরু: প্রতিটি অক্ষর যোগ করলেই হয়।\n3. `s`-এর প্রতিটি অক্ষরে `cur[0] = i` (সব মুছে দিলেই খালি), তারপর `j = 1..len(t)`: তিন ধাপের সর্বনিম্ন বসান।\n4. শেষে `prev[len(t)]` প্রিন্ট করুন।\n\n```python\nimport sys\nlines = sys.stdin.read().splitlines()\na = lines[0] if len(lines) > 0 else ''\nb = lines[1] if len(lines) > 1 else ''\nprev = list(range(len(b) + 1))\nfor i in range(1, len(a) + 1):\n    cur = [i] + [0] * len(b)\n    for j in range(1, len(b) + 1):\n        cur[j] = min(prev[j] + 1, cur[j - 1] + 1,\n                     prev[j - 1] + (a[i - 1] != b[j - 1]))\n    prev = cur\nprint(prev[len(b)])\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(len(s) * len(t))`, স্পেস `O(len(t))`। সর্বোচ্চ `10^6` ধাপ।\n\n### সাধারণ ভুল\n\n- replace-এর খরচ `0` ধরা: মিল না হলেও কমপক্ষে এক ধাপ লাগে, তাই `(a[i-1] != b[j-1])` বুলিয়ানটা ০/১ হিসেবে যোগ হয়।\n- `cur[0]` ভরা না করা: খালি `t` হলে প্রতিটি সারির শুরুর মানই উত্তর দেয় — সেটা `i` ধাপ (সব মুছে `s` থেকে)।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Strings", "Edit Distance"],
    tests: [
      { input: "horse\nros\n", expectedOutput: "3\n", isSample: true },
      { input: "intention\nexecution\n", expectedOutput: "5\n", isSample: true },
      { input: "kitten\nsitting\n", expectedOutput: "3\n", isSample: false },
      { input: "abc\nabc\n", expectedOutput: "0\n", isSample: false },
      { input: "\nabc\n", expectedOutput: "3\n", isSample: false },
      {
        input: "a".repeat(1000) + "\n" + "b".repeat(1000) + "\n",
        expectedOutput: "1000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nlines = sys.stdin.read().splitlines()\na = lines[0] if len(lines) > 0 else ''\nb = lines[1] if len(lines) > 1 else ''\nprev = list(range(len(b) + 1))\nfor i in range(1, len(a) + 1):\n    cur = [i] + [0] * len(b)\n    for j in range(1, len(b) + 1):\n        cur[j] = min(prev[j] + 1, cur[j - 1] + 1,\n                     prev[j - 1] + (a[i - 1] != b[j - 1]))\n    prev = cur\nprint(prev[len(b)])\n",
  },
  {
    slug: "learn-m5-lcs-lis-h1",
    title: "Longest Bitonic Subsequence",
    statement:
      "প্রাইমএশিয়ার টাওয়ার রেনোভেশনে তানভীর উচ্চতার তালিকা দেখছেন — একটা অংশে উচ্চতা ক্রমাগত বাড়ে, তারপর ক্রমাগত কমে। এমন দীর্ঘতম অংশ (bitonic) কত দৈর্ঘ্যের সেটা বলুন। উভয় অংশই কঠোরভাবে বৃদ্ধি/ক্ষয় হতে হবে; এক অংশ একটা মাত্র ঘরও হতে পারে।\n\nউদাহরণ: `1 11 2 10 4 5 2 1` তালিকায় `1 2 4 5 2 1` একটা বৈধ অংশ (আগে ৪টা ক্রমাগত বাড়ে, পরে ২টা ক্রমাগত কমে) — উত্তর `6`।",
    inputFormat:
      "প্রথম লাইনে `n`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।",
    outputFormat: "দীর্ঘতম bitonic subsequence-এর দৈর্ঘ্য এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= n <= 1000`\n`-10^9 <= a_i <= 10^9`",
    editorial:
      "### ধারণা\n\n`inc[i]` = `i` শেষ করে দীর্ঘতম বর্ধমান অংশ, `dec[i]` = `i` দিয়ে শুরু করে দীর্ঘতম ক্ষয়মান অংশ। যেকোনো ঘর `i`-কে শৃঙ্গ ধরে বাঁকটা সাজানো যায়: দৈর্ঘ্য `inc[i] + dec[i] - 1` (`i` ঘরটা দুইবার গোনা হয়েছে)। সব শৃঙ্গের জন্য সর্বোচ্চটাই উত্তর। `inc` সামনে থেকে, `dec` পিছন থেকে ঘোরা হয় — দুটোই `O(n^2)`। পুরো স্ট্রিং/অ্যারে কঠোর বর্ধমান হলেও উত্তর নিজেই `n` (এক অংশ দৈর্ঘ্য ১ ধরে)।\n\n### ধাপে ধাপে\n\n1. `n` আর অ্যারে পড়ুন।\n2. `inc = [1] * n`: `i = 0..n-1`, `j < i`, `a[j] < a[i]` হলে `inc[i] = max(inc[i], inc[j] + 1)`।\n3. `dec = [1] * n`: `i = n-1..0`, `j > i`, `a[j] < a[i]` হলে `dec[i] = max(dec[i], dec[j] + 1)`।\n4. `max(inc[i] + dec[i] - 1)` প্রিন্ট করুন।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\ninc = [1] * n\nfor i in range(n):\n    for j in range(i):\n        if a[j] < a[i] and inc[j] + 1 > inc[i]:\n            inc[i] = inc[j] + 1\ndec = [1] * n\nfor i in range(n - 1, -1, -1):\n    for j in range(i + 1, n):\n        if a[j] < a[i] and dec[j] + 1 > dec[i]:\n            dec[i] = dec[j] + 1\nprint(max(inc[i] + dec[i] - 1 for i in range(n)))\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n^2)`, স্পেস `O(n)`। `n = 1000`-এ প্রায় ১০ লক্ষ ধাপ, Python-এও সহজে চলে।\n\n### সাধারণ ভুল\n\n- `inc[i] + dec[i]` লেখা বিনা `-1`: শৃঙ্গ ঘরটা দুইবার গোনা হয়, ফলে উত্তর এক বেড়ে যায়।\n- `dec` পাশাপাশি ঘোরা: তখন `dec` মানে বোঝা হয় `i` দিয়ে শেষ হওয়া ক্ষয়মান অংশ — যা চাওয়া হয়নি; পিছন থেকে ঘোরাতে হবে।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "LIS", "Bitonic"],
    tests: [
      {
        input: "8\n1 11 2 10 4 5 2 1\n",
        expectedOutput: "6\n",
        isSample: true,
      },
      { input: "4\n1 2 3 1\n", expectedOutput: "4\n", isSample: true },
      { input: "5\n5 4 3 2 1\n", expectedOutput: "5\n", isSample: false },
      { input: "5\n1 2 3 4 5\n", expectedOutput: "5\n", isSample: false },
      { input: "3\n2 2 2\n", expectedOutput: "1\n", isSample: false },
      {
        input:
          "999\n" +
          [
            ...Array.from({ length: 500 }, (_, i) => i + 1),
            ...Array.from({ length: 499 }, (_, i) => 499 - i),
          ].join(" ") +
          "\n",
        expectedOutput: "999\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\ninc = [1] * n\nfor i in range(n):\n    for j in range(i):\n        if a[j] < a[i] and inc[j] + 1 > inc[i]:\n            inc[i] = inc[j] + 1\ndec = [1] * n\nfor i in range(n - 1, -1, -1):\n    for j in range(i + 1, n):\n        if a[j] < a[i] and dec[j] + 1 > dec[i]:\n            dec[i] = dec[j] + 1\nprint(max(inc[i] + dec[i] - 1 for i in range(n)))\n",
  },
  {
    slug: "learn-m5-lcs-lis-x1",
    title: "LCS of Three Strings",
    statement:
      "তিনটা কোর্সের নোটে যে অংশ তিনটাতেই ক্রম ঠিক রেখে মিলে, তার দীর্ঘতম দৈর্ঘ্য কত — তানভীর জানা দরকার। তিনটা স্ট্রিং দেওয়া থাকবে; প্রতিটি অক্ষর সর্বোচ্চ একবার ব্যবহার করে LCS বের করুন।\n\nউদাহরণ: `abc`, `bc`, `abc` — তিনটাতেই `bc` আছে, উত্তর `2`।",
    inputFormat: "তিনটি লাইনে পরপর তিনটি স্ট্রিং `s`, `t`, `u`।",
    outputFormat: "তিনটির LCS-এর দৈর্ঘ্য এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= len(s), len(t), len(u) <= 100`",
    editorial:
      "### ধারণা\n\nদুই স্ট্রিংয়ের টেবিলে আরেকটা ইনডেক্স যোগ হয়: `dp[i][j][k]` = `s`-এর প্রথম `i`, `t`-এর প্রথম `j`, `u`-এর প্রথম `k` অক্ষরের LCS দৈর্ঘ্য। তিনটা শেষ অক্ষরই যদি এক হয়, তাহলে `dp[i-1][j-1][k-1] + 1`; না হলে তিনটার যে কোনো একটা শেষ অক্ষর বাদ দিয়ে তিনটা ঘরের সর্বোচ্চ নিন। ধারণা একই, শুধু state তিন মাত্রিক হয়ে যায়।\n\n### ধাপে ধাপে\n\n1. তিন স্ট্রিং পড়ুন; `dp` বানান `(n+1) x (m+1) x (k+1)`, সব `0`।\n2. `i`, `j`, `k` এক থেকে শুরু করে তিন লুপ চালান।\n3. তিন অক্ষর মিললে `dp[i][j][k] = dp[i-1][j-1][k-1] + 1`, নাহলে তিন পাশের বড় মান নিন।\n4. `dp[n][m][k]` প্রিন্ট করুন।\n\n```python\nimport sys\nlines = sys.stdin.read().splitlines()\na = lines[0]\nb = lines[1]\nc = lines[2]\nn, m, k = len(a), len(b), len(c)\ndp = [[[0] * (k + 1) for _ in range(m + 1)] for _ in range(n + 1)]\nfor i in range(1, n + 1):\n    for j in range(1, m + 1):\n        for l in range(1, k + 1):\n            if a[i - 1] == b[j - 1] == c[l - 1]:\n                dp[i][j][l] = dp[i - 1][j - 1][l - 1] + 1\n            else:\n                dp[i][j][l] = max(dp[i - 1][j][l],\n                                  dp[i][j - 1][l],\n                                  dp[i][j][l - 1])\nprint(dp[n][m][k])\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(len(s) * len(t) * len(u))`, স্পেস একই পরিমাণ। সর্বোচ্চ `100^3 = 10^6` ধাপ — ঠিক এক মিলিয়ন, Python-এও চলে।\n\n### সাধারণ ভুল\n\n- তিনটার মধ্যে দুটো মিললেই যোগ করা: অক্ষরটা তিনটাতেই থাকতে হবে, তাই ডায়াগনাল ঘর তিনটা একসাথে কমতে হবে।\n- সীমা না দেখে পুরো টেবিল রাখা: সীমা ছোট হওয়ায় চলে, কিন্তু `1000` হলে `10^9` ঘর — তখন অন্য কৌশল লাগবে।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Strings", "LCS"],
    tests: [
      { input: "abc\nbc\nabc\n", expectedOutput: "2\n", isSample: true },
      { input: "abc\ndef\nghi\n", expectedOutput: "0\n", isSample: true },
      { input: "aaaa\naaaa\naaaa\n", expectedOutput: "4\n", isSample: false },
      { input: "abcde\nace\nace\n", expectedOutput: "3\n", isSample: false },
      { input: "xyz\nxyzz\nxyz\n", expectedOutput: "3\n", isSample: false },
      {
        input: HUNDRED_CHARS + "\n" + HUNDRED_CHARS + "\n" + HUNDRED_CHARS + "\n",
        expectedOutput: "100\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nlines = sys.stdin.read().splitlines()\na = lines[0]\nb = lines[1]\nc = lines[2]\nn, m, k = len(a), len(b), len(c)\ndp = [[[0] * (k + 1) for _ in range(m + 1)] for _ in range(n + 1)]\nfor i in range(1, n + 1):\n    for j in range(1, m + 1):\n        for l in range(1, k + 1):\n            if a[i - 1] == b[j - 1] == c[l - 1]:\n                dp[i][j][l] = dp[i - 1][j - 1][l - 1] + 1\n            else:\n                dp[i][j][l] = max(dp[i - 1][j][l],\n                                  dp[i][j - 1][l],\n                                  dp[i][j][l - 1])\nprint(dp[n][m][k])\n",
  },
  {
    slug: "learn-m5-lcs-lis-x2",
    title: "Insertions and Deletions",
    statement:
      "নুসরাত একটা নোটকে অন্য নোটে রূপান্তর করতে চান — শুধু অক্ষর যোগ করা বা মুছে ফেলা দিয়ে (বদলানো যাবে না)। কমপক্ষে কয়টা ধাপ লাগবে, সেটা বলুন।\n\nসূত্রটা LCS দিয়ে সহজ: `s`-এর যে অংশ LCS-এ থাকছে সেগুলো ছাড়া বাকি অক্ষর `s` থেকে মুছতে হবে, আর `t`-এর বাকি অক্ষর যোগ করতে হবে।\n\nউদাহরণ: `abcd` থেকে `ac` — `b`, `d` মুছলেই হয়, উত্তর `2`।",
    inputFormat:
      "প্রথম লাইনে `s`, দ্বিতীয় লাইনে `t`। দুটোই ছোট হাতের ইংরেজি অক্ষরে।",
    outputFormat: "সর্বনিম্ন ধাপ (যোগ + মুছে ফেলা) এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= len(s), len(t) <= 1000`",
    editorial:
      "### ধারণা\n\nLCS-এর অক্ষরগুলো ঠিকই থেকে যায় — বাকি `s`-এর `len(s) - LCS` অক্ষর মুছতে হবে, আর `t`-এর `len(t) - LCS` অক্ষর যোগ করতে হবে। তাই উত্তর = `len(s) + len(t) - 2 * LCS`। LCS বের করলেই হয়, আলাদা DP লাগবে না।\n\n### ধাপে ধাপে\n\n1. দুই স্ট্রিং পড়ে LCS দৈর্ঘ্য বের করুন (এক সারির `prev`/`cur` দিয়ে)।\n2. `len(s) + len(t) - 2 * lcs` হিসাব করুন।\n3. ফল প্রিন্ট করুন।\n\n```python\nimport sys\nlines = sys.stdin.read().splitlines()\na, b = lines[0], lines[1]\nprev = [0] * (len(b) + 1)\nfor i in range(1, len(a) + 1):\n    cur = [0] * (len(b) + 1)\n    for j in range(1, len(b) + 1):\n        if a[i - 1] == b[j - 1]:\n            cur[j] = prev[j - 1] + 1\n        else:\n            cur[j] = max(prev[j], cur[j - 1])\n    prev = cur\nlcs = prev[len(b)]\nprint(len(a) + len(b) - 2 * lcs)\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(len(s) * len(t))`, স্পেস `O(len(t))`। সর্বোচ্চ `10^6` ধাপ।\n\n### সাধারণ ভুল\n\n- `2 * LCS` বাদ: দুই পক্ষেরই অতিরিক্ত অক্ষর আলাদা করে যোগ হয় — একবার নয়, দুইবার বিয়োগ হবে।\n- replace ধরে নেওয়া: প্রশ্নে শুধু যোগ ও মুছে ফেলা চলে; replace ধরলে উত্তর কমে যেত (সবসময় নয়, তবে ভুল সম্ভাবনা)।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Strings", "LCS"],
    tests: [
      { input: "abcd\nac\n", expectedOutput: "2\n", isSample: true },
      { input: "abc\nabc\n", expectedOutput: "0\n", isSample: true },
      { input: "horse\nros\n", expectedOutput: "4\n", isSample: false },
      { input: "abc\nab\n", expectedOutput: "1\n", isSample: false },
      { input: "abcdef\nghijkl\n", expectedOutput: "12\n", isSample: false },
      {
        input: "a".repeat(1000) + "\n" + "b".repeat(1000) + "\n",
        expectedOutput: "2000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nlines = sys.stdin.read().splitlines()\na, b = lines[0], lines[1]\nprev = [0] * (len(b) + 1)\nfor i in range(1, len(a) + 1):\n    cur = [0] * (len(b) + 1)\n    for j in range(1, len(b) + 1):\n        if a[i - 1] == b[j - 1]:\n            cur[j] = prev[j - 1] + 1\n        else:\n            cur[j] = max(prev[j], cur[j - 1])\n    prev = cur\nlcs = prev[len(b)]\nprint(len(a) + len(b) - 2 * lcs)\n",
  },
];
