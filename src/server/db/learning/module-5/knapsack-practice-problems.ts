import type { SeedProblem } from "../../seed-problems";
import { numbersInput } from "../generated-tests";

export const KNAPSACK_PRACTICE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m5-knapsack-e2",
    title: "Fair Bill Split",
    statement:
      "রফি আর নুসরাত ক্লাব-ট্রিপের বিল ভাগ করছে। মোট `n`টা খরচের এন্ট্রি আছে; প্রতিটি এন্ট্রি ঠিক একজনের ভাগে যাবে — কেউ এন্ট্রি বাদও দিতে পারে না, আর একই এন্ট্রি দুজন বহন করবে না। দুজনের মোট খরচের পার্থক্য যতটা পারা যায় কমাতে হবে।\n\nপ্রতিটি এন্ট্রি কার ভাগে গেল সেটা বেছে পার্থক্যের সর্বনিম্ন মান বের করো।\n\nউদাহরণ: এন্ট্রি `1 6 11 5` — মোট `23`; `1 + 5 + 6 = 12` বনাম `11` ভাগ করলে পার্থক্য `1`, আর কমানো যায় না।",
    inputFormat:
      "প্রথম লাইনে এন্ট্রির সংখ্যা `n`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।",
    outputFormat: "সর্বনিম্ন পার্থক্য এক লাইনে প্রিন্ট করো।",
    constraints: "`1 <= n <= 100`\n`1 <= a_i <= 500`",
    editorial:
      "## ধারণা\n\nমোট খরচ `total` হলে একজনের ভাগ `s` হলে অন্যজনের ভাগ `total - s`, আর পার্থক্য `|total - 2s|`। কাজেই সমস্যাটা দাঁড়ায়: `0` থেকে `total`-এর মধ্যে কোন কোন `s` সাবসেট যোগফল হিসেবে বানানো যায় — সেটা জেনে `total / 2`-এর সবচেয়ে কাছের `s` নিলেই পার্থক্য সর্বনিম্ন হয়। কোন `s` বানানো যায় তার টেবিলটাই subset sum: `reach[s]` সত্য হবে যদি কোনো এন্ট্রি-সাবসেটের যোগফল ঠিক `s` হয়; প্রতিটি এন্ট্রি `x`-এর জন্য লুপ পিছন থেকে ঘুরিয়ে `reach[s - x]` থেকে `reach[s]` বসাও।\n\n`total / 2` থেকে নিচে প্রথম সত্য `s`-ই সেরা ভাগ — উপরের দিকে খোঁজা দরকার নেই, কারণ `total - s`-এর জোড়া নিচের দিকেই আছে।\n\n## ধাপে ধাপে\n\n1. `n` আর এন্ট্রিগুলো পড়ে `total` বের করো।\n2. `reach = [False] * (total + 1)`, `reach[0] = True` দিয়ে প্রতিটি `x`-এ উল্টো লুপে টেবিল ভরো।\n3. `s = total // 2` থেকে নিচে প্রথম `reach[s]` সত্য ঘর খোঁজো।\n4. `total - 2s` প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\ntotal = sum(a)\nreach = [False] * (total + 1)\nreach[0] = True\nfor x in a:\n    for s in range(total, x - 1, -1):\n        if reach[s - x]:\n            reach[s] = True\nbest = total\nfor s in range(total // 2, -1, -1):\n    if reach[s]:\n        best = total - 2 * s\n        break\nprint(best)\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n * total)`, স্পেস `O(total)`। সর্বোচ্চ `100 * 50000 = 5 * 10^6` ধাপ।\n\n## সাধারণ ভুল\n\n- দুই ভাগের সাইজ সমান রাখতে যাওয়া: প্রশ্নে সাইজ নয়, টাকার পার্থক্য কমাতে বলা হয়েছে — বেশি এন্ট্রি কম টাকায়ও ভাগ হতে পারে।\n- প্রতিটি ঘর দুইবার বসানো: লুপ সামনের দিকে চালালে একই এন্ট্রি একাধিকবার গোনা হয়ে অসম্ভব যোগফলও সত্য হয়ে যায় — উল্টো লুপ জরুরি।\n- `total` বিজোড় হলে উত্তর `0` আসা আশা করা: বিজোড় মোটে পার্থক্য কখনোই শূন্য হয় না, সর্বনিম্ন `1` — তবে এন্ট্রির মানের কারণে তাও নাও হতে পারে, টেবিলই বলে দেবে।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Knapsack", "Subset Sum"],
    tests: [
      { input: "4\n1 6 11 5\n", expectedOutput: "1\n", isSample: true },
      { input: "6\n3 1 4 2 2 1\n", expectedOutput: "1\n", isSample: true },
      { input: "1\n7\n", expectedOutput: "7\n", isSample: false },
      { input: "4\n5 5 5 5\n", expectedOutput: "0\n", isSample: false },
      {
        input: numbersInput(Array.from({ length: 100 }, () => 500)),
        expectedOutput: "0\n",
        isSample: false,
      },
      {
        input: numbersInput([...Array.from({ length: 99 }, () => 500), 1]),
        expectedOutput: "499\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\ntotal = sum(a)\nreach = [False] * (total + 1)\nreach[0] = True\nfor x in a:\n    for s in range(total, x - 1, -1):\n        if reach[s - x]:\n            reach[s] = True\nbest = total\nfor s in range(total // 2, -1, -1):\n    if reach[s]:\n        best = total - 2 * s\n        break\nprint(best)\n",
  },
  {
    slug: "learn-m5-knapsack-e3",
    title: "All Possible Totals",
    statement:
      "ক্লাবের গিফট-শপের হিসাব খাতায় সাদিয়া `n`টা আইটেমের দাম লিখে রেখেছে। একবার কেনাকাটায় কিছু আইটেম বেছে নেওয়া যায় (প্রতিটি আইটেম সর্বোচ্চ একবার)। যেকোনো বৈধ কেনাকাটার মোট দাম কত কত হতে পারে — সব ভিন্ন সম্ভাব্য মোট দামের পূর্ণ তালিকা চাই।\n\nআইটেম না নেওয়ার মোট `0` তালিকায় রাখা হবে না; বাকি সব সম্ভাব্য যোগফল ঊর্ধ্বক্রমে ছাপাও।\n\nউদাহরণ: দাম `2 3 7 8` — সম্ভাব্য মোট `2, 3, 5, 7, 8, 9, 10, 11, 12, 13, 15, 17, 18, 20` — মোট `14`টা।",
    inputFormat:
      "প্রথম লাইনে আইটেমের সংখ্যা `n`। দ্বিতীয় লাইনে `n`টি দাম, স্পেস দিয়ে আলাদা।",
    outputFormat:
      "প্রথম লাইনে ভিন্ন যোগফলের সংখ্যা `K`। দ্বিতীয় লাইনে `K`টি যোগফল ঊর্ধ্বক্রমে, স্পেস দিয়ে আলাদা।",
    constraints: "`1 <= n <= 100`\n`1 <= a_i <= 1000`",
    editorial:
      "## ধারণা\n\nএটা subset sum-এর পূর্ণ টেবিল ছাপানোর রূপ। `reach[s]` সত্য মানে যোগফল `s` কোনো না কোনো আইটেম-সাবসেট দিয়ে বানানো যায়। প্রতিটি দাম `x`-এর জন্য লুপ **পিছন থেকে** ঘুরিয়ে `reach[s - x]` সত্য হলে `reach[s]` সত্য করো — উল্টো দিক না চালালে একই আইটেম একাধিকবার গোনা হয়ে যায়। `reach[0] = True` দিয়ে শুরু (খালি কেনাকাটা), তবে উত্তরে `0` বাদ। শেষে `1` থেকে `total` পর্যন্ত সত্য ঘরগুলোই তালিকা।\n\nসব দাম ধনাত্মক বলে `total = সবার যোগ`-ই টেবিলের সর্বোচ্চ সীমা — তার বাইরে কোনো যোগফল অসম্ভব।\n\n## ধাপে ধাপে\n\n1. `n` আর দামগুলো পড়ে `total` বের করো।\n2. `reach` অ্যারে বানিয়ে প্রতিটি দামে উল্টো লুপে ভরো।\n3. `1` থেকে `total`-এর সত্য ঘরগুলো তালিকায় তুলো — এই ক্রমেই ঊর্ধ্বক্রম হয়।\n4. প্রথমে তালিকার দৈর্ঘ্য, তারপর স্পেস দিয়ে মানগুলো ছাপাও।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\ntotal = sum(a)\nreach = [False] * (total + 1)\nreach[0] = True\nfor x in a:\n    for s in range(total, x - 1, -1):\n        if reach[s - x]:\n            reach[s] = True\nsums = [s for s in range(1, total + 1) if reach[s]]\nprint(len(sums))\nprint(' '.join(map(str, sums)))\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n * total)`, স্পেস `O(total)`। সর্বোচ্চ `100 * 100000 = 10^7` ধাপ — চেক শর্ত বসানো থাকায় বাস্তবে আরও দ্রুত চলে।\n\n## সাধারণ ভুল\n\n- লুপ সামনের দিকে চালানো: একই আইটেম বারবার গোনা হয়ে সত্য ঘর বেড়ে যায় — প্রতিটি আইটেম একবারই নেওয়া যায়।\n- ডুপ্লিকেট দাম আলাদা ভাবা: `5 5 5`-তে যোগফল `5, 10, 15` — একই দামের আইটেমগুলো তবু আলাদা আইটেম, টেবিল নিজেই ঠিক রাখবে।\n- `0` তালিকায় রাখা: প্রশ্নে বলা আছে খালি কেনাকাটার মোট বাদ; আউটপুট শুধু ধনাত্মক যোগফল।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Knapsack", "Subset Sum"],
    tests: [
      {
        input: "4\n2 3 7 8\n",
        expectedOutput:
          "14\n2 3 5 7 8 9 10 11 12 13 15 17 18 20\n",
        isSample: true,
      },
      {
        input: "5\n1 2 3 4 5\n",
        expectedOutput:
          "15\n1 2 3 4 5 6 7 8 9 10 11 12 13 14 15\n",
        isSample: true,
      },
      { input: "1\n5\n", expectedOutput: "1\n5\n", isSample: false },
      { input: "3\n5 5 5\n", expectedOutput: "3\n5 10 15\n", isSample: false },
      {
        input: numbersInput(Array.from({ length: 100 }, () => 1000)),
        expectedOutput:
          "100\n" +
          Array.from({ length: 100 }, (_, i) => (i + 1) * 1000).join(" ") +
          "\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\ntotal = sum(a)\nreach = [False] * (total + 1)\nreach[0] = True\nfor x in a:\n    for s in range(total, x - 1, -1):\n        if reach[s - x]:\n            reach[s] = True\nsums = [s for s in range(1, total + 1) if reach[s]]\nprint(len(sums))\nprint(' '.join(map(str, sums)))\n",
  },
  {
    slug: "learn-m5-knapsack-m2",
    title: "Ordered Coin Ways",
    statement:
      "ক্যান্টিনের ফেস্টিভাল কাউন্টারে মোট দাম ঠিক `x` টাকা বানাতে হবে। নুসরাতের হাতে `n` ধরনের মুদ্রা আছে, প্রতিটি ধরনের সরবরাহ অসীম। মুদ্রা ধরে ধরে সাজানোর ক্রমটাও গুরুত্বপূর্ণ — `1 + 2` আর `2 + 1` দুটো আলাদা উপায়।\n\nমোট কয়টা ভিন্ন ক্রমে `x` টাকা বানানো যায়, সেটা গোনো।\n\nফল বিশাল হতে পারে, তাই সংখ্যাটা `1000000007` দিয়ে ভাগের ভাগশেষ প্রিন্ট করো।\n\nউদাহরণ: মুদ্রা `1 2 3`, `x = 4` — `1+1+1+1`, `1+1+2` (৩ ক্রম), `1+3` (২ ক্রম), `2+2`, `3+1`... সব মিলিয়ে `7`টা।",
    inputFormat:
      "প্রথম লাইনে ধরনের সংখ্যা `n` আর টাকা `x`। দ্বিতীয় লাইনে `n`টি মুদ্রার মান।",
    outputFormat:
      "উপায়ের সংখ্যার `1000000007` ভাগশেষ এক লাইনে প্রিন্ট করো।",
    constraints:
      "`1 <= n <= 100`\n`0 <= x <= 100000`\n`1 <= coin_i <= 100000`",
    editorial:
      "## ধারণা\n\n`dp[s]` হোক ঠিক `s` টাকা বানানোর ক্রম-সহ উপায় সংখ্যা। শেষ মুদ্রাটা যদি `c` হয়, তার আগে পর্যন্ত বাকি ছিল `s - c` — তাই প্রতিটি `c`-এর জন্য `dp[s] += dp[s - c]`। ক্রম আলাদা গোনা হয় বলে মুদ্রার ধরনের কোনো বাইরের লুপ লাগবে না — সব ধরন একই ঘরে যোগ হয়:\n\n`dp[s] = dp[s-1] + dp[s-2] + ... (প্রতিটি বৈধ c এর জন্য)`\n\nমনে আছে মুদ্রার ধরন বাইরে রেখে সীমার লুপ সামনে চালালে ক্রমহীন (combination) গোনা হয়? এখানে উল্টোটা চাই — ক্রম গুনতে হলে সীমা `s`-ই বাইরের লুপ, মুদ্রাগুলো ভেতরে। Base: `dp[0] = 1` (শূন্য টাকা বানানোর একটামাত্র খালি উপায়)।\n\n## ধাপে ধাপে\n\n1. `n`, `x` আর মুদ্রাগুলো পড়ো।\n2. `dp = [0] * (x + 1)`, `dp[0] = 1`।\n3. `s = 1` থেকে `x`: প্রতিটি মুদ্রা `c <= s`-এর জন্য `total += dp[s - c]`; শেষে `dp[s] = total % 1000000007`।\n4. `dp[x]` প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn, x = data[0], data[1]\ncoins = data[2:2 + n]\nM = 1000000007\ndp = [0] * (x + 1)\ndp[0] = 1\nfor s in range(1, x + 1):\n    total = 0\n    for c in coins:\n        if c <= s:\n            total += dp[s - c]\n    dp[s] = total % M\nprint(dp[x])\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n * x)`, স্পেস `O(x)`। সর্বোচ্চ `100 * 100000 = 10^7` ধাপ।\n\n## সাধারণ ভুল\n\n- মুদ্রার ধরনকে বাইরের লুপ করা: তখন ক্রম হারিয়ে কেবল কোন ধরন কতবার — সেই গোনা হয়; প্রশ্নে ক্রম চাই।\n- `dp[0] = 0` রাখা: প্রথম ঘর থেকেই সব উপায় শূন্য হয়ে যায়।\n- মডুলাস একবারে শেষে দেওয়া: যোগফল দ্রুত বিশাল হয়; প্রতি ঘরে ভাগশেষ নাও।\n- `x = 0` বাদ দেওয়া: শূন্য টাকার একটামাত্র খালি উপায় — উত্তর `1`।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Knapsack", "Counting"],
    tests: [
      { input: "3 4\n1 2 3\n", expectedOutput: "7\n", isSample: true },
      { input: "2 10\n1 2\n", expectedOutput: "89\n", isSample: true },
      { input: "3 0\n1 2 3\n", expectedOutput: "1\n", isSample: false },
      { input: "1 3\n2\n", expectedOutput: "0\n", isSample: false },
      { input: "1 50000\n1\n", expectedOutput: "1\n", isSample: false },
      {
        input:
          "100 100000\n" +
          Array.from({ length: 100 }, (_, i) => i + 1).join(" ") +
          "\n",
        expectedOutput: "335907988\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, x = data[0], data[1]\ncoins = data[2:2 + n]\nM = 1000000007\ndp = [0] * (x + 1)\ndp[0] = 1\nfor s in range(1, x + 1):\n    total = 0\n    for c in coins:\n        if c <= s:\n            total += dp[s - c]\n    dp[s] = total % M\nprint(dp[x])\n",
  },
  {
    slug: "learn-m5-knapsack-m3",
    title: "Festival Stalls",
    statement:
      "উৎসবের সাজসজ্জার জন্য তানভির `n`টা স্টল ঘুরছে। প্রতিটি স্টলে কয়েকটা আইটেম আছে (প্রতিটির ওজন আর দাম আলাদা) — কিন্তু নিয়ম হলো **এক স্টল থেকে সর্বোচ্চ একটা আইটেম** কেনা যাবে; একই স্টলের দুইটা আইটেম একসাথে নেওয়া যাবে না। একটা স্টল থেকে কিছুই না নেওয়াও চলে।\n\nব্যাগের ওজন সীমা `W`; ওজনের মধ্যে রেখে মোট দাম সর্বোচ্চ কত করা যায়, সেটা বের করো।\n\nউদাহরণ: স্টলের আইটেম `((2,3),(3,4))`, `((4,5),(5,6))`, `((1,1))`, সীমা `8` — প্রথম স্টল থেকে `(3,4)` আর দ্বিতীয় থেকে `(5,6)` নিলে ওজন `8`, দাম `10`; এর বেশি কোনোভাবেই হয় না।",
    inputFormat:
      "প্রথম লাইনে স্টলের সংখ্যা `n` আর ওজন সীমা `W`। এরপর `n`টি লাইনের প্রতিটিতে: প্রথমে সেই স্টলের আইটেম সংখ্যা `k`, তারপর `k`টি জোড়া — আইটেমের ওজন `w` আর দাম `v`।",
    outputFormat: "সর্বোচ্চ মোট দাম এক লাইনে প্রিন্ট করো।",
    constraints:
      "`1 <= n <= 100`\n`1 <= k_i <= 10`\n`1 <= W <= 5000`\n`1 <= w_i <= W`\n`1 <= v_i <= 10^9`",
    editorial:
      "## ধারণা\n\nসাধারণ 0/1 ন্যাপস্যাকের মতোই `dp[s]` হোক ওজন সীমা `s`-এ সর্বোচ্চ দাম — তবে এখানে আইটেম নয়, **স্টল** ধরে ধরে টেবিল বানাবে। স্টলের সিদ্ধান্ত: হয় ওই স্টল থেকে কিছু নেব না (`dp[s]` আগের মানই), নয় স্টলের কোনো একটা আইটেম `(w, v)` নেব — তখন আগের টেবিলের `dp[s - w] + v`। এক স্টলের দুই আইটেম একসাথে নেওয়া যাবে না, তাই সব আইটেমের বিকল্প একই পুরনো টেবিল থেকে পড়ে — নতুন টেবিলে লেখা হয়।\n\n```\nনতুন টেবিলের ndp[s] = max(পুরনো dp[s], max(dp[s-w] + v) স্টলের সব আইটেমে)\n```\n\nপ্রতিটি স্টল শেষে `dp = ndp` বসাও। লুপের দিক নিয়ে ভাবতে হবে না, কারণ পুরনো আর নতুন টেবিল আলাদা — একই স্টলের দুই আইটেম মেশানোর সুযোগই নেই।\n\n## ধাপে ধাপে\n\n1. `n`, `W` পড়ো; টোকেন ধরে ধরে প্রতিটি স্টলের `k` আর `k`টি `(w, v)` তুলে নাও।\n2. `dp = [0] * (W + 1)` দিয়ে শুরু করো।\n3. প্রতিটি স্টলের জন্য নতুন `ndp` বানাও: প্রতিটি `s`-এ `dp[s]` থেকে শুরু করে স্টলের প্রতিটি `(w, v)`-এর জন্য `dp[s - w] + v` থেকে বড়টা নাও।\n4. `dp = ndp` করে পরের স্টলে যাও; শেষে `dp[W]` প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn, W = data[0], data[1]\nidx = 2\ndp = [0] * (W + 1)\nfor _ in range(n):\n    k = data[idx]\n    idx += 1\n    items = []\n    for _ in range(k):\n        items.append((data[idx], data[idx + 1]))\n        idx += 2\n    ndp = [0] * (W + 1)\n    for s in range(W + 1):\n        best = dp[s]\n        for w, v in items:\n            if w <= s and dp[s - w] + v > best:\n                best = dp[s - w] + v\n        ndp[s] = best\n    dp = ndp\nprint(dp[W])\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(sum(k) * W)` — সর্বোচ্চ `100 * 10 * 5000 = 5 * 10^6` ধাপ। স্পেস `O(W)`।\n\n## সাধারণ ভুল\n\n- সব আইটেম এক তালিকায় ঢেলে সাধারণ 0/1 ন্যাপস্যাক চালানো: তখন একই স্টলের দুই আইটেমও একসাথে নেওয়া যায় — নিয়ম ভাঙে।\n- আইটেমের বিকল্পগুলো `ndp` থেকে পড়া: তাতে এক স্টলের ভেতরেই দুই আইটেম জমে যায়; পড়ো পুরনো `dp` থেকে, লেখো নতুন `ndp`-তে।\n- স্টল থেকে কিছু না নেওয়ার বিকল্প বাদ দেওয়া: `best = dp[s]` দিয়ে শুরু করো — নাহলে ফাঁকা স্টল জোর করে খরচ বাধ্য করে।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Knapsack", "Grouped"],
    tests: [
      {
        input: "3 8\n2 2 3 3 4\n2 4 5 5 6\n1 1 1\n",
        expectedOutput: "10\n",
        isSample: true,
      },
      {
        input: "1 5\n1 5 10\n",
        expectedOutput: "10\n",
        isSample: true,
      },
      { input: "1 4\n1 5 10\n", expectedOutput: "0\n", isSample: false },
      {
        input: "2 10\n2 5 10 5 20\n1 6 40\n",
        expectedOutput: "40\n",
        isSample: false,
      },
      {
        input:
          "100 5000\n" +
          Array.from(
            { length: 100 },
            () =>
              "10 " +
              Array.from({ length: 10 }, () => "100 100").join(" "),
          ).join("\n") +
          "\n",
        expectedOutput: "5000\n",
        isSample: false,
      },
      {
        input:
          "100 4900\n" +
          Array.from(
            { length: 100 },
            () =>
              "10 " +
              Array.from({ length: 10 }, () => "100 100").join(" "),
          ).join("\n") +
          "\n",
        expectedOutput: "4900\n",
        isSample: false,
      },
      {
        input:
          "100 5000\n" +
          Array.from(
            { length: 100 },
            () => "2 5000 999 1 1",
          ).join("\n") +
          "\n",
        expectedOutput: "999\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, W = data[0], data[1]\nidx = 2\ndp = [0] * (W + 1)\nfor _ in range(n):\n    k = data[idx]\n    idx += 1\n    items = []\n    for _ in range(k):\n        items.append((data[idx], data[idx + 1]))\n        idx += 2\n    ndp = [0] * (W + 1)\n    for s in range(W + 1):\n        best = dp[s]\n        for w, v in items:\n            if w <= s and dp[s - w] + v > best:\n                best = dp[s - w] + v\n        ndp[s] = best\n    dp = ndp\nprint(dp[W])\n",
  },
  {
    slug: "learn-m5-knapsack-h2",
    title: "Two-Bag Split",
    statement:
      "ট্রিপে যাওয়ার পাত্রে রফির দুটো ব্যাগ — ব্যাগ ১-এর ওজন সীমা `W1`, ব্যাগ ২-এর সীমা `W2`। দোকানে `n`টা আইটেম; প্রতিটির ওজন `w` আর দাম `v`। প্রতিটি আইটেম হয় ব্যাগ ১-এ যাবে, বা ব্যাগ ২-এ, নয়তো কেনাই হবে না — একই আইটেম দুই ব্যাগে বা দুইবার নেওয়া যাবে না।\n\nদুই ব্যাগের ওজন সীমা দুটোই মেনে চলে মোট দাম সর্বোচ্চ কত করা যায়, সেটা বের করো।\n\nউদাহরণ: আইটেম `((3,5), (5,8), (2,4), (4,6))`, `W1 = W2 = 5` — ব্যাগ ১-এ `(3,5)` আর `(2,4)` (ওজন `5`, দাম `9`), ব্যাগ ২-এ `(5,8)` (দাম `8`), মোট `17`।",
    inputFormat:
      "প্রথম লাইনে `n`, `W1` আর `W2`। পরের `n` লাইনে প্রতিটিতে দুটি পূর্ণসংখ্যা — আইটেমের ওজন `w` আর দাম `v`।",
    outputFormat: "সর্বোচ্চ মোট দাম এক লাইনে প্রিন্ট করো।",
    constraints:
      "`1 <= n <= 60`\n`1 <= W1, W2 <= 150`\n`1 <= w_i <= 100`\n`1 <= v_i <= 10^9`",
    editorial:
      "## ধারণা\n\nএবার সীমা দুটো, তাই state-ও দুই মাত্রিক: `dp[a][b]` ধরো ব্যাগ ১-এ এখনো `a` ওজনের জায়গা খালি আর ব্যাগ ২-এ `b` খালি থাকলে আজ পর্যন্ত তোলা আইটেমগুলোর সর্বোচ্চ দাম। শুরুতে দুই ব্যাগই খালি: `dp[W1][W2] = 0`। প্রতিটি আইটেম `(w, v)`-এর তিনটা গন্তব্য:\n\n- ব্যাগ ১-এ: `dp[a - w][b]` (যদি `w <= a`) — জায়গা `a` কমে, দাম বাড়ে `v`\n- ব্যাগ ২-এ: `dp[a][b - w]` (যদি `w <= b`)\n- কোথাও না: মান অপরিবর্তিত\n\nযেকোনো ভরা অবস্থা বৈধ শেষ (সব জায়গা খরচ করতে হয় না), তাই উত্তর পুরো টেবিলের সর্বোচ্চ মান। প্রতিটি আইটেমে নতুন টেবিল `ndp` বানিয়ে পুরনো `dp` থেকে পড়ো — নাহলে একই আইটেম দুই ব্যাগে ঢুকে যাওয়ার পথ খোলা থাকে।\n\n## ধাপে ধাপে\n\n1. `n`, `W1`, `W2` আর আইটেমগুলো পড়ো।\n2. `dp` টেবিলের সব ঘর অসম্ভব (বিশাল ঋণ), শুধু `dp[W1][W2] = 0`।\n3. প্রতিটি আইটেমে: `ndp = dp`-এর কপি (না-নেওয়ার বিকল্প); প্রতিটি বৈধ `(a, b)` ঘর থেকে দুই ব্যাগের আপডেট `ndp`-তে লেখো; শেষে `dp = ndp`।\n4. টেবিলের সর্বোচ্চ মান প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn, W1, W2 = data[0], data[1], data[2]\nitems = [(data[3 + 2 * i], data[4 + 2 * i]) for i in range(n)]\nNEG = -(1 << 60)\ndp = [[NEG] * (W2 + 1) for _ in range(W1 + 1)]\ndp[W1][W2] = 0\nfor w, v in items:\n    ndp = [row[:] for row in dp]\n    for a in range(W1 + 1):\n        row = dp[a]\n        for b in range(W2 + 1):\n            cur = row[b]\n            if cur == NEG:\n                continue\n            if w <= a and cur + v > ndp[a - w][b]:\n                ndp[a - w][b] = cur + v\n            if w <= b and cur + v > ndp[a][b - w]:\n                ndp[a][b - w] = cur + v\n    dp = ndp\nprint(max(max(row) for row in dp))\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n * W1 * W2)` — সর্বোচ্চ `60 * 150 * 150 = 1.35 * 10^6` ঘর, প্রতিটিতে তিনটা বিকল্প। স্পেস `O(W1 * W2)` (দুই কপি)।\n\n## সাধারণ ভুল\n\n- এক ব্যাগের কাজ শেষে আরেক ব্যাগের টেবিল নতুন করা: দুই সীমা একসাথে চলে — আলাদা করে করলে একই আইটেম দুই ব্যাগে ঢুকে যায়।\n- টেবিলের ভেতরেই আপডেট করা: পুরনো মান আর নতুন মান মিশে যায়; প্রতি আইটেমে `ndp` কপি নাও।\n- `dp[0][0]` থেকে শুরু করে উত্তর `dp[W1][W2]` পড়া: জায়গা বাড়ানোর দিক উল্টো হয়ে যায় — খালি জায়গা গুনে পিছনে এগোও, উত্তর নাও টেবিলের সর্বোচ্চ ঘর থেকে।\n- দুই ব্যাগের সীমা আলাদা ভুলে যাওয়া: `w <= a` আর `w <= b` — দুই শর্তই আলাদা করে যাচাই করো।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Knapsack", "Two Bags"],
    tests: [
      {
        input: "4 5 5\n3 5\n5 8\n2 4\n4 6\n",
        expectedOutput: "17\n",
        isSample: true,
      },
      {
        input: "4 6 5\n2 3\n4 5\n5 6\n3 2\n",
        expectedOutput: "14\n",
        isSample: true,
      },
      { input: "1 3 3\n4 10\n", expectedOutput: "0\n", isSample: false },
      { input: "1 4 1\n4 10\n", expectedOutput: "10\n", isSample: false },
      {
        input:
          "60 150 150\n" +
          Array.from({ length: 60 }, () => "100 999").join("\n") +
          "\n",
        expectedOutput: "1998\n",
        isSample: false,
      },
      {
        input:
          "60 100 100\n" +
          Array.from({ length: 60 }, () => "10 5").join("\n") +
          "\n",
        expectedOutput: "100\n",
        isSample: false,
      },
      {
        input:
          "60 150 150\n" +
          Array.from({ length: 60 }, () => "3 7").join("\n") +
          "\n",
        expectedOutput: "420\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, W1, W2 = data[0], data[1], data[2]\nitems = [(data[3 + 2 * i], data[4 + 2 * i]) for i in range(n)]\nNEG = -(1 << 60)\ndp = [[NEG] * (W2 + 1) for _ in range(W1 + 1)]\ndp[W1][W2] = 0\nfor w, v in items:\n    ndp = [row[:] for row in dp]\n    for a in range(W1 + 1):\n        row = dp[a]\n        for b in range(W2 + 1):\n            cur = row[b]\n            if cur == NEG:\n                continue\n            if w <= a and cur + v > ndp[a - w][b]:\n                ndp[a - w][b] = cur + v\n            if w <= b and cur + v > ndp[a][b - w]:\n                ndp[a][b - w] = cur + v\n    dp = ndp\nprint(max(max(row) for row in dp))\n",
  },
];
