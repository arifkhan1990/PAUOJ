import type { SeedProblem } from "../../seed-problems";

export const KNAPSACK_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m5-knapsack-g1",
    title: "0/1 Knapsack",
    statement:
      "বইমেলায় তানভীর একটা ব্যাগ নিয়ে ঘুরছেন — ব্যাগে ওজন সীমা `W`। দোকানে `n`টি বই আছে, প্রতিটির ওজন আর দাম জানা। প্রতিটি বই সর্বোচ্চ একবার নেওয়া যায়; ওজন `W` ছাড়ানো না করে সর্বোচ্চ কয় টাকার বই কেনা যায়, সেটা বলুন।\n\nউদাহরণ: ওজন সীমা `8`, বই `((2,3), (3,4), (4,5), (5,6))` (ওজন, দাম) — দ্বিতীয় ও চতুর্থ বই নিলে ওজন `3 + 5 = 8`, দাম `4 + 6 = 10`। এটাই সর্বোচ্চ।",
    inputFormat:
      "প্রথম লাইনে `n` আর `W`। পরের `n` লাইনে প্রতিটিতে দুটি পূর্ণসংখ্যা — বইয়ের ওজন `w` আর দাম `v`।",
    outputFormat: "সর্বোচ্চ মোট দাম এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= n <= 100`\n`1 <= W <= 10000`\n`1 <= w, v <= 1000`",
    editorial:
      "### ধারণা\n\n`dp[s]` হোক ওজন সীমা `s` পর্যন্ত পাওয়া সর্বোচ্চ দাম। প্রতিটি বই নিলে বা না নিলে — নিলে `dp[s - w] + v`, না নিলে আগের `dp[s]`; বড়টা রাখুন। মূল কথা লুপের দিক: এক বই যেন একাধিকবার না ঢোকে, তাই সীমা `W` থেকে `w` পর্যন্ত **পিছন থেকে** ঘোরাতে হয়। সামনে থেকে ঘোরালে `dp[s - w]`-এ একই বইয়ের মান আগে ঢোকানো হয়ে যেত, ফলে একটা বই বারবার ধরা পড়ত।\n\n### ধাপে ধাপে\n\n1. `n`, `W` আর সব `(w, v)` পড়ুন।\n2. `dp = [0] * (W + 1)` দিয়ে শুরু করুন।\n3. প্রতিটি বইয়ের জন্য `s = W` থেকে `w` পর্যন্ত উল্টো লুপ: `dp[s] = max(dp[s], dp[s - w] + v)`।\n4. লুপ শেষে `dp[W]` প্রিন্ট করুন।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn, W = data[0], data[1]\nitems = [(data[i], data[i + 1]) for i in range(2, len(data), 2)]\ndp = [0] * (W + 1)\nfor w, v in items:\n    for s in range(W, w - 1, -1):\n        if dp[s - w] + v > dp[s]:\n            dp[s] = dp[s - w] + v\nprint(dp[W])\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n * W)`, স্পেস `O(W)`। সর্বোচ্চ `100 * 10000 = 10^6` ধাপ — Python-এও এক সেকেন্ডের মধ্যে চলে।\n\n### সাধারণ ভুল\n\n- সীমার দিক সামনে থেকে ঘোরানো — তখন একই বই একাধিকবার নেওয়া হয়, উত্তর ভুল বড় আসে।\n- `s`-এর লুপ `w - 1` পর্যন্ত না রেখে `0` পর্যন্ত রাখা: `dp[s - w]` নেগেটিভ হয়ে যায়, Python-ে সেটা নীরবে শেষের ঘর ফেরত দিয়ে ভুল মান দেয়।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Knapsack", "0/1"],
    tests: [
      {
        input: "4 8\n2 3\n3 4\n4 5\n5 6\n",
        expectedOutput: "10\n",
        isSample: true,
      },
      { input: "1 10\n11 100\n", expectedOutput: "0\n", isSample: true },
      { input: "3 10\n6 30\n5 20\n5 20\n", expectedOutput: "40\n", isSample: false },
      { input: "1 5\n5 7\n", expectedOutput: "7\n", isSample: false },
      {
        input:
          "100 10000\n" +
          Array.from({ length: 100 }, () => "100 100").join("\n") +
          "\n",
        expectedOutput: "10000\n",
        isSample: false,
      },
      {
        input:
          "100 10000\n" +
          Array.from({ length: 100 }, () => "200 50").join("\n") +
          "\n",
        expectedOutput: "2500\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, W = data[0], data[1]\nitems = [(data[i], data[i + 1]) for i in range(2, len(data), 2)]\ndp = [0] * (W + 1)\nfor w, v in items:\n    for s in range(W, w - 1, -1):\n        if dp[s - w] + v > dp[s]:\n            dp[s] = dp[s - w] + v\nprint(dp[W])\n",
  },
  {
    slug: "learn-m5-knapsack-g2",
    title: "Subset Sum",
    statement:
      "সাদিয়া ক্যাম্পাস ক্যাশ কাউন্টারে বসে হিসাব করছেন: তার কাছে `n`টি মুদ্রা আছে, প্রতিটির মান জানা। ঠিক `S` টাকা কি কিছু মুদ্রা বেছে নিয়ে (একটা বা একাধিক, কিন্তু প্রতিটি সর্বোচ্চ একবার) জমা করা যায়?\n\nসম্ভব হলে `YES`, না হলে `NO` প্রিন্ট করুন। কোনো মুদ্রাই না নিলে `0` টাকা — সেটা সবসময় সম্ভব।\n\nউদাহরণ: মুদ্রা `2 3 7 8`, `S = 11` — `3 + 8 = 11`, তাই `YES`; `S = 14` হলে `NO`।",
    inputFormat:
      "প্রথম লাইনে `n` আর `S`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।",
    outputFormat: "`YES` অথবা `NO` এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= n <= 100`\n`0 <= S <= 10000`\n`1 <= a_i <= 1000`",
    editorial:
      "### ধারণা\n\n`dp[s]` হোক যোগফল `s` পাওয়া সম্ভব কিনা। খালি সাবসেটের যোগফল `0`, তাই `dp[0] = True` দিয়ে শুরু। প্রতিটি মুদ্রা `x` নিলে `dp[s]` সত্য হয় যদি আগে থেকে `dp[s - x]` সত্য থাকে। 0/1 ন্যাপস্যাকের মতোই লুপ পিছন থেকে, কারণ মুদ্রাও একবারই নেওয়া যায়। উত্তর `dp[S]`।\n\n### ধাপে ধাপে\n\n1. `n`, `S` আর মুদ্রার তালিকা পড়ুন।\n2. `dp = [False] * (S + 1)`, `dp[0] = True`।\n3. প্রতিটি `x`-এর জন্য `s = S` থেকে `x` পর্যন্ত উল্টো লুপ: `dp[s - x]` সত্য হলে `dp[s] = True`।\n4. `dp[S]` সত্য হলে `YES`, নাহলে `NO` প্রিন্ট করুন।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn, S = data[0], data[1]\na = data[2:]\ndp = [False] * (S + 1)\ndp[0] = True\nfor x in a:\n    for s in range(S, x - 1, -1):\n        if dp[s - x]:\n            dp[s] = True\nprint('YES' if dp[S] else 'NO')\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n * S)`, স্পেস `O(S)`। `S = 0` হলে লুপ একবারও চলে না, তবু `dp[0] = True` থাকায় উত্তর `YES` আসে।\n\n### সাধারণ ভুল\n\n- `dp[0]` সত্য না রাখা: `S = 0`-এ উত্তর `NO` আসবে, অথচ খালি সাবসেট দিয়েই সম্ভব।\n- `a_i > S` হলে লুপের রেঞ্জ খালি — সেটা স্বাভাবিক, তবে `range(S, x, -1)` লিখে `x - 1` বাদ দিলে `s = x` ধরা পড়ে যায়, যা `dp[0]` ছাড়া কাজ করে না।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Knapsack", "Subset Sum"],
    tests: [
      { input: "4 11\n2 3 7 8\n", expectedOutput: "YES\n", isSample: true },
      { input: "4 14\n2 3 7 8\n", expectedOutput: "NO\n", isSample: true },
      { input: "2 0\n5 5\n", expectedOutput: "YES\n", isSample: false },
      { input: "3 7\n2 4 8\n", expectedOutput: "NO\n", isSample: false },
      {
        input:
          "100 10000\n" +
          Array.from({ length: 100 }, () => "100").join(" ") +
          "\n",
        expectedOutput: "YES\n",
        isSample: false,
      },
      {
        input:
          "100 9999\n" +
          Array.from({ length: 100 }, () => "100").join(" ") +
          "\n",
        expectedOutput: "NO\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, S = data[0], data[1]\na = data[2:]\ndp = [False] * (S + 1)\ndp[0] = True\nfor x in a:\n    for s in range(S, x - 1, -1):\n        if dp[s - x]:\n            dp[s] = True\nprint('YES' if dp[S] else 'NO')\n",
  },
  {
    slug: "learn-m5-knapsack-e1",
    title: "Equal Sum Partition",
    statement:
      "রাফি ও নুসরাত একসাথে টাকা জমা রাখছেন। তাদের মোট `n`টি নোট আছে; সবগুলো মিলিয়ে দুইজন ঠিক সমান পরিমাণ পাবেন কিনা সেটা বের করুন। প্রতিটি নোট পুরোটা একজনই নেবে — ভাগ করে ভাঙা যাবে না।\n\nউদাহরণ: নোট `1 5 11 5` — সব মোট `22`, প্রতি পক্ষে `11`; `11` আর `1 + 5 + 5` দিয়ে পৌঁছানো যায়, তাই `YES`।",
    inputFormat:
      "প্রথম লাইনে `n`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।",
    outputFormat: "সমান ভাগ সম্ভব হলে `YES`, নাহলে `NO` এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= n <= 100`\n`1 <= a_i <= 500`",
    editorial:
      "### ধারণা\n\nসব মিলিয়ে মোট `total`। দুই ভাগ সমান হলে অবশ্যই `total` জোড় এবং প্রতি ভাগ `total / 2`। তাই সমস্যাটা দাঁড়ায়: কিছু নোট দিয়ে ঠিক `total / 2` যোগফল করা যায় কিনা — এটাই subset sum। শর্ত পূরণ হলে বাকি নোটগুলো নিজে থেকেই অন্য ভাগ বানাবে। `total` বিজোড় হলে সঙ্গে সঙ্গে `NO`।\n\n### ধাপে ধাপে\n\n1. সব মান পড়ে `total` বের করুন।\n2. `total` বিজোড় হলে `NO` প্রিন্ট করে থামুন।\n3. `target = total // 2`; `dp = [False] * (target + 1)`, `dp[0] = True`।\n4. প্রতিটি `x`-এর জন্য উল্টো লুপে `dp[s - x]` থেকে `dp[s]` ভরুন।\n5. `dp[target]` সত্য হলে `YES`, নাহলে `NO`।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\ntotal = sum(a)\nif total % 2 == 1:\n    print('NO')\nelse:\n    target = total // 2\n    dp = [False] * (target + 1)\n    dp[0] = True\n    for x in a:\n        for s in range(target, x - 1, -1):\n            if dp[s - x]:\n                dp[s] = True\n    print('YES' if dp[target] else 'NO')\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n * total)`, স্পেস `O(total)`। সর্বোচ্চ `total = 100 * 500 = 50000`, তাই `5 * 10^6` ধাপ।\n\n### সাধারণ ভুল\n\n- বিজোড় `total` না দেখে চালিয়ে যাওয়া — অথচ কখনোই সমান হতে পারে না।\n- `target` বাদ দিয়ে পুরো `total`-এর টেবিল বানানো: সময় প্রায় দ্বিগুণ হয়, ফল একই থাকলেও সীমায় TLE দিতে পারে।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Knapsack", "Subset Sum"],
    tests: [
      { input: "4\n1 5 11 5\n", expectedOutput: "YES\n", isSample: true },
      { input: "3\n1 2 4\n", expectedOutput: "NO\n", isSample: true },
      { input: "4\n2 2 2 2\n", expectedOutput: "YES\n", isSample: false },
      { input: "3\n1 2 3\n", expectedOutput: "YES\n", isSample: false },
      { input: "1\n7\n", expectedOutput: "NO\n", isSample: false },
      {
        input: "100\n" + Array.from({ length: 100 }, () => "500").join(" ") + "\n",
        expectedOutput: "YES\n",
        isSample: false,
      },
      {
        input: "99\n" + Array.from({ length: 99 }, () => "500").join(" ") + "\n",
        expectedOutput: "NO\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\ntotal = sum(a)\nif total % 2 == 1:\n    print('NO')\nelse:\n    target = total // 2\n    dp = [False] * (target + 1)\n    dp[0] = True\n    for x in a:\n        for s in range(target, x - 1, -1):\n            if dp[s - x]:\n                dp[s] = True\n    print('YES' if dp[target] else 'NO')\n",
  },
  {
    slug: "learn-m5-knapsack-m1",
    title: "Coin Change (Minimum Coins)",
    statement:
      "ক্যান্টিনে টাকা বদলের জন্য তানভীর কাছে `n`টি মুদ্রা ধরন আছে (প্রতিটি ধরন যত খুশি বার ব্যবহার করা যায়)। ঠিক `S` টাকা বানাতে হলে সর্বনিম্ন কয়টা মুদ্রা লাগবে?\n\nসম্ভবই না হলে `-1` প্রিন্ট করুন; `S = 0` হলে কোনো মুদ্রা লাগে না, উত্তর `0`।\n\nউদাহরণ: মুদ্রা `1 3 4`, `S = 6` — `3 + 3` দিয়ে হয়, উত্তর `2`।",
    inputFormat:
      "প্রথম লাইনে `n` আর `S`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা — মুদ্রার মান।",
    outputFormat: "সর্বনিম্ন মুদ্রা সংখ্যা, সম্ভব না হলে `-1`।",
    constraints:
      "`1 <= n <= 100`\n`0 <= S <= 10000`\n`1 <= coin_i <= 1000`",
    editorial:
      "### ধারণা\n\nএটা unbounded knapsack-এর রূপ, শুধু চাওয়া হয়েছে মূল্য নয় — মুদ্রা সংখ্যা সর্বনিম্ন। `dp[s]` হোক যোগফল `s` বানানোর সর্বনিম্ন মুদ্রা সংখ্যা; অসম্ভব হলে বিশাল মান ধরা হয়। শেষ মুদ্রাটা `c` হলে `dp[s] = dp[s - c] + 1` — সব মুদ্রা ধরে সর্বনিম্নটা নিন। মুদ্রা যত খুশি বার নেওয়া যায়, তাই লুপ সীমার দিকে সামনে থেকে চালান।\n\n### ধাপে ধাপে\n\n1. `n`, `S` আর মুদ্রাগুলো পড়ুন।\n2. `dp = [0] + [INF] * S` দিয়ে শুরু করুন — প্রথম ঘর `0`, বাকি ঘর অসম্ভব (`INF`) ধরে রাখুন।\n3. `s = 1` থেকে `S`: প্রতিটি মুদ্রা `c <= s` হলে `dp[s] = min(dp[s], dp[s - c] + 1)`।\n4. `dp[S]` এখনও অসম্ভব হলে `-1`, নাহলে `dp[S]` প্রিন্ট করুন।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn, S = data[0], data[1]\ncoins = data[2:]\nINF = 10 ** 18\ndp = [0] + [INF] * S\nfor s in range(1, S + 1):\n    for c in coins:\n        if c <= s and dp[s - c] + 1 < dp[s]:\n            dp[s] = dp[s - c] + 1\nprint(-1 if dp[S] >= INF else dp[S])\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n * S)`, স্পেস `O(S)`। `100 * 10000 = 10^6` ধাপ।\n\n### সাধারণ ভুল\n\n- লুপ পিছন থেকে ঘোরানো: unbounded হওয়ায় সামনে থেকে ঘোরাই ঠিক — পিছনে ঘোরালে এক মুদ্রা একবারই ধরা পড়ে, ফলে উত্তর বাড়ে।\n- অসম্ভব আলামতে `0` বসানো: `dp` সবসময় ভরা থাকে, তাই ইনিশিয়ালাইজেশন বিশাল মান না রেখে `0` রাখলে উত্তর ভুল হয়।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Knapsack", "Coin Change"],
    tests: [
      { input: "3 6\n1 3 4\n", expectedOutput: "2\n", isSample: true },
      { input: "3 11\n1 3 4\n", expectedOutput: "3\n", isSample: true },
      { input: "1 3\n2\n", expectedOutput: "-1\n", isSample: false },
      { input: "1 0\n5\n", expectedOutput: "0\n", isSample: false },
      { input: "3 7\n2 4 8\n", expectedOutput: "-1\n", isSample: false },
      {
        input:
          "100 10000\n" +
          Array.from({ length: 100 }, (_, i) => i + 1).join(" ") +
          "\n",
        expectedOutput: "100\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, S = data[0], data[1]\ncoins = data[2:]\nINF = 10 ** 18\ndp = [0] + [INF] * S\nfor s in range(1, S + 1):\n    for c in coins:\n        if c <= s and dp[s - c] + 1 < dp[s]:\n            dp[s] = dp[s - c] + 1\nprint(-1 if dp[S] >= INF else dp[S])\n",
  },
  {
    slug: "learn-m5-knapsack-h1",
    title: "Minimum Subset Sum Difference",
    statement:
      "নুসরাত বাড়িতে ফেরার সময় কয়েকটা বস্তু দুই ব্যাগে ভাগ করছেন যেন দুই ব্যাগের ওজনের পার্থক্য সবচেয়ে কম হয়। সব বস্তু একবারই যাবে, খালি ব্যাগও চলবে।\n\nবস্তু `n`টির ওজন জানা, দুই ভাগে ভাগ করে পার্থক্যের সর্বনিম্ন মান কত সেটা বের করুন।\n\nউদাহরণ: `1 6 11 5` — `1 + 6 + 5 = 12` আর `11` ভাগ করলে পার্থক্য `1`, এটাই সর্বনিম্ন।",
    inputFormat:
      "প্রথম লাইনে `n`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।",
    outputFormat: "সর্বনিম্ন পার্থক্য এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= n <= 100`\n`1 <= a_i <= 500`",
    editorial:
      "### ধারণা\n\nএক পক্ষের যোগফল `s` হলে অন্য পক্ষ `total - s`, পার্থক্য `total - 2*s`। তাই সর্বনিম্ন পার্থক্য পেতে হলে `total / 2`-এর চেয়ে কম যত বড় `s` পাওয়া যায়, সেটা বের করা — subset sum-এর ঠিক একই টেবিল। `dp[s]` সত্য হলে `s` পাওয়া যায়; তার মধ্যে `total // 2` পর্যন্ত সর্বোচ্চ সত্য `s` বেছে নিয়ে `total - 2*s` প্রিন্ট করুন। ধ্যান দিন সর্বোচ্চ `total = 100 * 500 = 50000`, তাই টেবিল ছোট থাকে।\n\n### ধাপে ধাপে\n\n1. সব মান পড়ে `total` বের করুন।\n2. `dp = [False] * (total + 1)`, `dp[0] = True`।\n3. প্রতিটি `x`-এর জন্য উল্টো লুপে `dp[s - x]` থেকে `dp[s]` ভরুন।\n4. `s = 0` থেকে `total // 2` পর্যন্ত ঘুরে শেষ সত্য `s` খুঁজুন (বা ছোট থেকে বড় `dp[s]` সত্য হলে `best = total - 2*s` আপডেট করুন)।\n5. `best` প্রিন্ট করুন।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\ntotal = sum(a)\ndp = [False] * (total + 1)\ndp[0] = True\nfor x in a:\n    for s in range(total, x - 1, -1):\n        if dp[s - x]:\n            dp[s] = True\nbest = total\nfor s in range(total // 2 + 1):\n    if dp[s]:\n        best = total - 2 * s\nprint(best)\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n * total)`, স্পেস `O(total)`। সর্বোচ্চ `5 * 10^6` ধাপ — Python-এ এক সেকেন্ডের কাছাকাছি, তাই টাইম লিমিট প্রশস্ত রাখা হয়েছে।\n\n### সাধারণ ভুল\n\n- পার্থক্য `s - (total - s)` লেখা — ঋণাত্মক হতে পারে; সোজা হিসেব `total - 2*s` অথবা পরম মান নিন।\n- শুধু `dp[total // 2]` যাচাই করা: `total / 2` অবশ্যই পাওয়া যায় না — কাছাকাছি যে কোনো পৌঁছানো সম্ভাবনাই প্রাসঙ্গিক।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Knapsack", "Subset Sum"],
    tests: [
      { input: "4\n1 6 11 5\n", expectedOutput: "1\n", isSample: true },
      { input: "3\n1 2 3\n", expectedOutput: "0\n", isSample: true },
      { input: "2\n1 100\n", expectedOutput: "99\n", isSample: false },
      { input: "5\n3 3 3 4 4\n", expectedOutput: "1\n", isSample: false },
      { input: "1\n10\n", expectedOutput: "10\n", isSample: false },
      {
        input: "100\n" + Array.from({ length: 100 }, () => "500").join(" ") + "\n",
        expectedOutput: "0\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\ntotal = sum(a)\ndp = [False] * (total + 1)\ndp[0] = True\nfor x in a:\n    for s in range(total, x - 1, -1):\n        if dp[s - x]:\n            dp[s] = True\nbest = total\nfor s in range(total // 2 + 1):\n    if dp[s]:\n        best = total - 2 * s\nprint(best)\n",
  },
  {
    slug: "learn-m5-knapsack-x1",
    title: "Unbounded Knapsack",
    statement:
      "এবার বইমেলায় তানভীর যে বইগুলো পছন্দ করেছেন সেগুলোর প্রতিটি যত খুশি কপি পাওয়া যায় — প্রতিটি কপি আলাদা করে গোনা হবে। ওজন সীমা `W`-এর মধ্যে রেখে সর্বোচ্চ কয় টাকার কপি একত্র করা যায়, সেটা বলুন।\n\nউদাহরণ: সীমা `11`, বই `((3,5), (5,8))` — তিন কপি প্রথম ধরনের ও এক কপি দ্বিতীয় ধরনের মিলে ওজন `3+3+5 = 11`, দাম `5+5+8 = 18`।",
    inputFormat:
      "প্রথম লাইনে `n` আর `W`। পরের `n` লাইনে প্রতিটিতে ওজন `w` আর দাম `v`।",
    outputFormat: "সর্বোচ্চ মোট দাম এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= n <= 100`\n`1 <= W <= 10000`\n`1 <= w, v <= 1000`",
    editorial:
      "### ধারণা\n\n0/1 ন্যাপস্যাকের ঠিক একই টেবিল, শুধু লুপের দিক উল্টো। আইটেম যত খুশি বার নেওয়া যায়, তাই সীমা `s`-এর ঘর ভরার সময় `dp[s - w]` যদি এখনই একই আইটেম দিয়ে ভরা থাকে, সেটা স্বাভাবিক — আপনি একই বই আবার নিচ্ছেন। সামনে থেকে পিছনে লুপ চালালে সেই সুযোগটাই থেকে যায়।\n\n### ধাপে ধাপে\n\n1. `n`, `W` আর সব `(w, v)` পড়ুন।\n2. `dp = [0] * (W + 1)` দিয়ে শুরু করুন।\n3. `s = 1` থেকে `W`: প্রতিটি আইটেমের জন্য `w <= s` হলে `dp[s] = max(dp[s], dp[s - w] + v)`।\n4. `dp[W]` প্রিন্ট করুন।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn, W = data[0], data[1]\nitems = [(data[i], data[i + 1]) for i in range(2, len(data), 2)]\ndp = [0] * (W + 1)\nfor s in range(1, W + 1):\n    for w, v in items:\n        if w <= s and dp[s - w] + v > dp[s]:\n            dp[s] = dp[s - w] + v\nprint(dp[W])\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n * W)`, স্পেস `O(W)` — 0/1 সংস্করণের সমান।\n\n### সাধারণ ভুল\n\n- পিছনের লুপ বসানো: তখন প্রতিটি আইটেম একবারই কাজ করে, ফলে উত্তর কমে যায় — এটা 0/1 হয়ে যায়।\n- `s` লুপ `w` থেকে শুরু করা (0/1-এর মতো): এখানে সেটা ভুল নয়, কিন্তু আউটার লুপ আইটেম-চালিকা হলে ভেতরেরটা সীমার দিকে হতে হবে — কোন একটা লুপ সীমার দিকে অবশ্যই হবে।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Knapsack", "Unbounded"],
    tests: [
      { input: "2 11\n3 5\n5 8\n", expectedOutput: "18\n", isSample: true },
      { input: "1 10\n11 100\n", expectedOutput: "0\n", isSample: true },
      { input: "4 10\n2 3\n3 4\n4 6\n6 10\n", expectedOutput: "16\n", isSample: false },
      { input: "2 7\n1 2\n3 5\n", expectedOutput: "14\n", isSample: false },
      {
        input:
          "5 10000\n" +
          Array.from({ length: 5 }, () => "1 1").join("\n") +
          "\n",
        expectedOutput: "10000\n",
        isSample: false,
      },
      {
        input:
          "5 10000\n" +
          Array.from({ length: 5 }, () => "1 7").join("\n") +
          "\n",
        expectedOutput: "70000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, W = data[0], data[1]\nitems = [(data[i], data[i + 1]) for i in range(2, len(data), 2)]\ndp = [0] * (W + 1)\nfor s in range(1, W + 1):\n    for w, v in items:\n        if w <= s and dp[s - w] + v > dp[s]:\n            dp[s] = dp[s - w] + v\nprint(dp[W])\n",
  },
  {
    slug: "learn-m5-knapsack-x2",
    title: "Count Subsets with Given Sum",
    statement:
      "সাদিয়া আবার মুদ্রার হিসাবে ফিরেছেন, এবার জানতে চান শুধু সম্ভব কিনা নয় — ঠিক কয়টা ভিন্ন উপায়ে যোগফল `S` পাওয়া যায়। প্রতিটি মুদ্রা সর্বোচ্চ একবার নেওয়া যায়; মুদ্রাদের অবস্থান বদলালে নতুন উপায় হিসেবে ধরা হবে না, তবে একই মানের আলাদা মুদ্রা আলাদা হিসেবে গোনা হবে।\n\nউদাহরণ: মুদ্রা `1 2 3`, `S = 3` — `{3}` আর `{1, 2}`: উত্তর `2`।",
    inputFormat:
      "প্রথম লাইনে `n` আর `S`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।",
    outputFormat: "উপায়ের সংখ্যা এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= n <= 40`\n`0 <= S <= 40000`\n`1 <= a_i <= 1000`",
    editorial:
      "### ধারণা\n\nsubset sum-এর টেবিল, শুধু বুলিয়ানের জায়গায় গণনা। `dp[s]` হোক যোগফল `s` তৈরির উপায় সংখ্যা। প্রতিটি আইটেম `x` যোগ করলে নতুন উপায় তৈরি হয় `dp[s - x]` সংখ্যক পুরনো উপায় থেকে — তাই `dp[s] += dp[s - x]`। পিছনের লুপ এখানেও অপরিহার্য, নাহলে একই আইটেম দুইবার ধরা পড়ে গণনা বেড়ে যায়। সর্বোচ্চ উপায় `2^40 ≈ 10^12`, তাই মডুলাস ছাড়াও 64-বিটে থাকে।\n\n### ধাপে ধাপে\n\n1. `n`, `S` আর তালিকা পড়ুন।\n2. `dp = [0] * (S + 1)`, `dp[0] = 1` (খালি সাবসেট একটাই)।\n3. প্রতিটি `x`-এর জন্য `s = S` থেকে `x` পর্যন্ত উল্টো লুপ: `dp[s] += dp[s - x]`।\n4. `dp[S]` প্রিন্ট করুন।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn, S = data[0], data[1]\na = data[2:]\ndp = [0] * (S + 1)\ndp[0] = 1\nfor x in a:\n    for s in range(S, x - 1, -1):\n        dp[s] += dp[s - x]\nprint(dp[S])\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n * S)`, স্পেস `O(S)`; সর্বোচ্চ `40 * 40000 = 1.6 * 10^6` ধাপ।\n\n### সাধারণ ভুল\n\n- `dp[0] = 0` রাখা: সব উত্তর শূন্য হয়ে যায়; `dp[0] = 1` ছাড়া শুরুই হয় না।\n- সামনের লুপ: একই আইটেম একাধিকবার ধরা পড়ে, গণনা অনেক বেড়ে যায় (স্বাভাবিক subset নয়)।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Knapsack", "Counting"],
    tests: [
      { input: "3 3\n1 2 3\n", expectedOutput: "2\n", isSample: true },
      { input: "3 0\n1 2 3\n", expectedOutput: "1\n", isSample: true },
      { input: "3 2\n1 1 1\n", expectedOutput: "3\n", isSample: false },
      { input: "3 10\n1 2 3\n", expectedOutput: "0\n", isSample: false },
      { input: "4 5\n1 2 3 4\n", expectedOutput: "2\n", isSample: false },
      {
        input:
          "40 20\n" + Array.from({ length: 40 }, () => "1").join(" ") + "\n",
        expectedOutput: "137846528820\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, S = data[0], data[1]\na = data[2:]\ndp = [0] * (S + 1)\ndp[0] = 1\nfor x in a:\n    for s in range(S, x - 1, -1):\n        dp[s] += dp[s - x]\nprint(dp[S])\n",
  },
];
