import type { SeedProblem } from "../../seed-problems";
import { matrixInput } from "../generated-tests";

export const GRID_DP_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m5-grid-dp-g1",
    title: "Climbing Stairs",
    statement:
      "রাফি ল্যাবের সিঁড়ি ওঠার পথ গোনাচ্ছেন। প্রতি ধাপে এক ধাপ বা দুই ধাপ করে উঠা যায়; `n` ধাপ উঠার কয়টা ভিন্ন পথ সম্ভব সেটা জানা দরকার।\n\nপথ বলতে ধাপের ক্রম বোঝা। উদাহরণ: `n = 5` হলে `1+1+1+1+1`, `1+1+1+2`, `1+1+2+1`, `1+2+1+1`, `2+1+1+1`, `2+1+2`, `1+2+2`, `2+2+1` — মোট `8` পথ।",
    inputFormat: "একটি লাইনে একটি পূর্ণসংখ্যা `n`।",
    outputFormat: "পথের সংখ্যা এক লাইনে প্রিন্ট করুন।",
    constraints: "`1 <= n <= 90`",
    editorial:
      "### ধারণা\n\nশেষ ধাপে যাওয়ার আগে তুমি কোনো একটা অবস্থায় ছিলে: এক ধাপ আগে থেকে এলে `dp[n-1]` পথ ছিল, দুই ধাপ আগে থেকে এলে `dp[n-2]`। দুই ঘটনাই পাশাপাশি ঘটে, তাই যোগ করলেই উত্তর: `dp[n] = dp[n-1] + dp[n-2]` — এটাই ফিবোনাচি ধারা। Base case: `dp[1] = 1`, `dp[2] = 2`।\n\n### ধাপে ধাপে\n\n1. ইনপুট `n` নিন।\n2. `a = 0`, `b = 1` দিয়ে শুরু করুন (যথাক্রমে `dp[0]`, `dp[1]`-এর মতো দুই আগের মান)।\n3. `n` বার লুপ চালিয়ে `a, b = b, a + b` করুন — প্রতিবার নতুন ধাপের পথ যোগ হয়।\n4. লুপের পর `b` প্রিন্ট করুন; সেটাই `n` ধাপের পথ সংখ্যা।\n\n```python\nimport sys\nn = int(sys.stdin.readline())\na, b = 0, 1\nfor _ in range(n):\n    a, b = b, a + b\nprint(b)\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(1)`। `n = 90`-এ উত্তর `4660046610375530309`, যা 64-বিট signed integer-এর মধ্যে থাকে — তাই `long long` সাহায্য করবে।\n\n### সাধারণ ভুল\n\n- `n = 1`-এ লুপ একবার চলে, ফল `b = 1` — `n = 0` ধরে নিলে উত্তর `1` পাওয়া যায় (শূন্য ধাপে একটামাত্র পথ: কিছু না করা), কিন্তু প্রশ্নে `n >= 1`।\n- রিকার্সিভ `f(n) = f(n-1) + f(n-2)` মেমো ছাড়া লিখলে `n = 45`-এ সময় শেষ হয়ে যায়।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "1D DP", "Fibonacci"],
    tests: [
      { input: "1\n", expectedOutput: "1\n", isSample: true },
      { input: "5\n", expectedOutput: "8\n", isSample: true },
      { input: "2\n", expectedOutput: "2\n", isSample: false },
      { input: "10\n", expectedOutput: "89\n", isSample: false },
      { input: "45\n", expectedOutput: "1836311903\n", isSample: false },
      {
        input: "90\n",
        expectedOutput: "4660046610375530309\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\na, b = 0, 1\nfor _ in range(n):\n    a, b = b, a + b\nprint(b)\n",
  },
  {
    slug: "learn-m5-grid-dp-g2",
    title: "Unique Paths in a Grid",
    statement:
      "সাদিয়া ক্যাম্পাসের মানচিত্রে একটা `m` সারি আর `n` কলামের গ্রিড এনেছেন। শুরু ঘর উপরে-বামে `(1, 1)`, লক্ষ্য নিচে-ডানে `(m, n)`; প্রতি ধাপে শুধু ডানে বা নিচে এক ধামাচামা করা যায়। লক্ষ্যে পৌঁছানোর কয়টা ভিন্ন পথ আছে সেটা বলুন।\n\nউদাহরণ: `m = 3`, `n = 7` হলে উত্তর `28`।",
    inputFormat: "একটি লাইনে দুটি পূর্ণসংখ্যা `m` আর `n`।",
    outputFormat: "পথের সংখ্যা এক লাইনে প্রিন্ট করুন।",
    constraints: "`1 <= m, n <= 30`",
    editorial:
      "### ধারণা\n\n`dp[i][j]` হোক `(1,1)` থেকে `(i,j)` পর্যন্ত পথ সংখ্যা। `(i,j)`-তে আসা যায় ঠিক দুই জায়গা থেকে: উপরের ঘর `(i-1,j)` থেকে নিচে নামে, বা বামের ঘর `(i,j-1)` থেকে ডানে যায়। দুই ঘটনা পাশাপাশি, তাই `dp[i][j] = dp[i-1][j] + dp[i][j-1]`। Base: প্রথম সারি আর প্রথম কলামের প্রতিটি ঘরে ঠিক একটা করে পথ (সরাসরি ডানে/নিচে গিয়ে)। এক সারির অ্যারে দিয়েও কাজ হয়, কারণ `dp[i][j]` শুধু এক উপরের ঘর আর এক বাম ঘর দেখে।\n\n### ধাপে ধাপে\n\n1. `m`, `n` পড়ুন।\n2. `dp = [1] * n` দিয়ে শুরু করুন (প্রথম সারি)।\n3. প্রতিটি সারির জন্য `j = 1` থেকে `n-1`: `dp[j] = dp[j] + dp[j-1]` (উপরের মান + বামের মান)।\n4. `dp[n-1]` প্রিন্ট করুন।\n\n```python\nimport sys\nm, n = map(int, sys.stdin.readline().split())\ndp = [1] * n\nfor _ in range(1, m):\n    for j in range(1, n):\n        dp[j] += dp[j - 1]\nprint(dp[n - 1])\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(m * n)`, স্পেস `O(n)`। সীমা ছোট হওয়ায় পূর্ণ টেবিলও চলে, কিন্তু এক সারি নিয়েই পাঠযোগ্য।\n\n### সাধারণ ভুল\n\n- প্রথম সারি বা কলাম ভরা না করা — তখন শূন্য থেকে যোগ হয়ে অধিকাংশ পথ হারায়।\n- `m`, `n` উল্টো ধরে নেওয়া: উত্তর আসলে সমান (`C(m+n-2, m-1)`), কিন্তু base case ভেঙে গেলে কোড ভুল হতে পারে।\n- C++-তে `int` রাখা: `30 x 30`-এ উত্তর `30067266499541040`, `long long` ছাড়া overflow নিশ্চিত।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Grid", "Combinatorics"],
    tests: [
      { input: "1 1\n", expectedOutput: "1\n", isSample: true },
      { input: "3 7\n", expectedOutput: "28\n", isSample: true },
      { input: "3 3\n", expectedOutput: "6\n", isSample: false },
      { input: "2 2\n", expectedOutput: "2\n", isSample: false },
      { input: "1 30\n", expectedOutput: "1\n", isSample: false },
      {
        input: "30 30\n",
        expectedOutput: "30067266499541040\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nm, n = map(int, sys.stdin.readline().split())\ndp = [1] * n\nfor _ in range(1, m):\n    for j in range(1, n):\n        dp[j] += dp[j - 1]\nprint(dp[n - 1])\n",
  },
  {
    slug: "learn-m5-grid-dp-e1",
    title: "Minimum Path Sum",
    statement:
      "তানভীর লাইব্রেরি থেকে বই নিয়ে হলটার শেষে যেতে হবে; প্রতিটি ঘর পার হওয়ার সময় সেই ঘরের ক্লাক কাটে। শুরু উপরে-বামে, শেষ নিচে-ডানে, প্রতি ধাপে শুধু ডানে বা নিচে চলা যায়। সব ঘরের খরচ জানা, এখন সর্বনিম্ন মোট খরচে পৌঁছানো যায় কত — সেটা বের করুন।\n\nউদাহরণ: গ্রিড `1 3 1 / 1 5 1 / 4 2 1` হলে সর্বনিম্ন পথ `1 → 3 → 1 → 1 → 1`, খরচ `7`।",
    inputFormat:
      "প্রথম লাইনে `m` আর `n`। পরের `m` লাইনে প্রতিটিতে `n`টি পূর্ণসংখ্যা — সেই সারির ঘরের খরচ।",
    outputFormat: "সর্বনিম্ন মোট খরচ এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= m, n <= 100`\n`0 <= grid[i][j] <= 1000`",
    editorial:
      "### ধারণা\n\n`dp[i][j]` হোক `(0,0)` থেকে `(i,j)` পর্যন্ত সর্বনিম্ন খরচ। এখানে স্থানীয়ভাবে ছোট ঘর বেছে নেওয়া (greedy) কাজ করে না — একটা সস্তা ঘর পরে মহাংগায় নিয়ে যেতে পারে। DP প্রতিটি ঘরে সেখান পর্যন্ত সেরা মান মনে রাখে: `dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1])`। Base: `dp[0][0] = grid[0][0]`, প্রথম সারি আর কলাম আগের ঘরের সাথে যোগ করে ভরা হয়।\n\n### ধাপে ধাপে\n\n1. `m`, `n` আর গ্রিড পড়ুন।\n2. `dp` অ্যারে দিয়ে শুরু করুন: `dp[0] = grid[0][0]`, তারপর প্রথম সারি `dp[j] = dp[j-1] + grid[0][j]`।\n3. প্রতিটি সারির জন্য: `dp[0] += grid[i][0]`, আর ভেতরে `dp[j] = grid[i][j] + min(dp[j], dp[j-1])`।\n4. `dp[n-1]` প্রিন্ট করুন।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nm, n = data[0], data[1]\ngrid = data[2:]\ndp = [0] * n\ndp[0] = grid[0]\nfor j in range(1, n):\n    dp[j] = dp[j - 1] + grid[j]\nfor i in range(1, m):\n    base = i * n\n    dp[0] += grid[base]\n    for j in range(1, n):\n        dp[j] = grid[base + j] + min(dp[j], dp[j - 1])\nprint(dp[n - 1])\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(m * n)`, স্পেস `O(n)`। `100 x 100` গ্রিডে মাত্র এক লক্ষ ধাপ।\n\n### সাধারণ ভুল\n\n- Greedy: প্রতিটি ঘরে পাশের ছোট খরচটা বেছে নেওয়া — ছোট গ্রিডেও ভুল হতে পারে (উদাহরণে `5` খরচের ঘর এড়িয়ে যেতে হয়)।\n- প্রথম সারির ভুল ভরা: `dp[j]` আগের সারির মান ধরে নিলে শূন্য-খরচের ফল আসে।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Grid", "Minimum Path"],
    tests: [
      {
        input: "3 3\n1 3 1\n1 5 1\n4 2 1\n",
        expectedOutput: "7\n",
        isSample: true,
      },
      { input: "1 1\n5\n", expectedOutput: "5\n", isSample: true },
      {
        input: "3 3\n0 0 0\n0 0 0\n0 0 0\n",
        expectedOutput: "0\n",
        isSample: false,
      },
      { input: "2 2\n1 2\n3 4\n", expectedOutput: "7\n", isSample: false },
      {
        input: "3 3\n1 100 1\n1 100 1\n1 1 1\n",
        expectedOutput: "5\n",
        isSample: false,
      },
      {
        input: matrixInput(
          Array.from({ length: 100 }, () => Array.from({ length: 100 }, () => 1)),
        ),
        expectedOutput: "199\n",
        isSample: false,
      },
      {
        input: matrixInput(
          Array.from({ length: 100 }, (_, i) =>
            Array.from({ length: 100 }, (_, j) => i + j),
          ),
        ),
        expectedOutput: "19701\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nm, n = data[0], data[1]\ngrid = data[2:]\ndp = [0] * n\ndp[0] = grid[0]\nfor j in range(1, n):\n    dp[j] = dp[j - 1] + grid[j]\nfor i in range(1, m):\n    base = i * n\n    dp[0] += grid[base]\n    for j in range(1, n):\n        dp[j] = grid[base + j] + min(dp[j], dp[j - 1])\nprint(dp[n - 1])\n",
  },
  {
    slug: "learn-m5-grid-dp-m1",
    title: "Unique Paths with Obstacles",
    statement:
      "সাদিয়ার মানচিত্রে এখন কিছু ঘর বন্ধ — সেখানে পা রাখা যাবে না। `0` মানে খোলা ঘর, `1` মানে বাধা। উপরে-বাম থেকে শুরু করে নিচে-ডানে পৌঁছানোর কয়টা বাধাহীন পথ আছে, সেটা গুনুন।\n\nপথ বলতে শুধু খোলা ঘর দিয়ে ডানে/নিচে চলা বোঝা; শুরু বা লক্ষ্যের ঘর বন্ধ হলে উত্তর `0`। ফল বড় হতে পারে, তাই `1000000007` দিয়ে ভাগের ভাগশেষ দিন।\n\nউদাহরণ: `3 x 3` গ্রিডে মাঝের ঘর বন্ধ হলে উত্তর `2`।",
    inputFormat:
      "প্রথম লাইনে `m` আর `n`। পরের `m` লাইনে প্রতিটিতে `n`টি `0`/`1`।",
    outputFormat: "পথ সংখ্যার `1000000007` ভাগশেষ এক লাইনে প্রিন্ট করুন।",
    constraints: "`1 <= m, n <= 100`\nপ্রতিটি ঘর `0` অথবা `1`।",
    editorial:
      "### ধারণা\n\nআগের প্রশ্নের একই transition, শুধু বাধা যোগ হলো: `dp[i][j] = 0` যদি ঘরটি বাধাহীন না হয়, নাহলে `dp[i-1][j] + dp[i][j-1]` (উপর আর বাম থেকে আসা পথ যোগ)। বাধাহীন ঘরে ঢোকা যায় না, তাই সেখান থেকে কোনো পথ এগোয় না — ঘরটি শূন্য দিয়ে ভরা থাকে। মডুলাস প্রতিটি যোগের পরেই দিলে মান যত বড় হোক না কেন নিয়ন্ত্রিত থাকে।\n\n### ধাপে ধাপে\n\n1. `m`, `n` আর গ্রিড পড়ুন।\n2. এক সারির `dp` দিয়ে শুরু করুন; প্রতিটি সারির জন্য নতুন `ndp` বানান।\n3. প্রতিটি ঘরে: বাধা থাকলে `ndp[j] = 0`; নাহলে উপরের সারি (`dp[j]`) ও বামের ঘর (`ndp[j-1]`) যোগ করে `1000000007`-এর ভাগশেষ নিন।\n4. শেষ ঘরের মান প্রিন্ট করুন।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nm, n = data[0], data[1]\ngrid = data[2:]\nM = 1000000007\ndp = [0] * n\ndp[0] = 1\nfor i in range(m):\n    base = i * n\n    ndp = [0] * n\n    for j in range(n):\n        if grid[base + j] == 1:\n            continue\n        value = 0\n        if i == 0 and j == 0:\n            value = 1\n        if j > 0:\n            value += ndp[j - 1]\n        if i > 0:\n            value += dp[j]\n        ndp[j] = value % M\n    dp = ndp\nprint(dp[n - 1])\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(m * n)`, স্পেস `O(n)`। `100 x 100` সর্বোচ্চ ইনপুটেও প্রায় এক লক্ষ ধাপ।\n\n### সাধারণ ভুল\n\n- শুরু বা লক্ষ্য বাধা হলেও লুপ চালিয়ে যাওয়া — ঠিক আছে, কিন্তু আলাদা করে যাচাই না করে `dp`-তে শূন্য ঢুকেছে কিনা দেখুন।\n- মডুলাস শেষে একবার দেওয়া: মাঝের যোগগুলো `10^18` ছাড়িয়ে যেতে পারে, তাই প্রতিটি ধাপে দিন।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Grid", "Modulo"],
    tests: [
      {
        input: "3 3\n0 0 0\n0 1 0\n0 0 0\n",
        expectedOutput: "2\n",
        isSample: true,
      },
      { input: "1 1\n0\n", expectedOutput: "1\n", isSample: true },
      { input: "1 1\n1\n", expectedOutput: "0\n", isSample: false },
      {
        input: "3 3\n0 0 0\n1 1 0\n0 0 0\n",
        expectedOutput: "1\n",
        isSample: false,
      },
      { input: "2 2\n0 1\n1 0\n", expectedOutput: "0\n", isSample: false },
      {
        input:
          "5 5\n" +
          Array.from(
            { length: 5 },
            (_, i) => Array.from({ length: 5 }, () => i % 2).join(" "),
          ).join("\n") +
          "\n",
        expectedOutput: "0\n",
        isSample: false,
      },
      {
        input: matrixInput(
          Array.from({ length: 100 }, () => Array.from({ length: 100 }, () => 0)),
        ),
        expectedOutput: "690285631\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nm, n = data[0], data[1]\ngrid = data[2:]\nM = 1000000007\ndp = [0] * n\ndp[0] = 1\nfor i in range(m):\n    base = i * n\n    ndp = [0] * n\n    for j in range(n):\n        if grid[base + j] == 1:\n            continue\n        value = 0\n        if i == 0 and j == 0:\n            value = 1\n        if j > 0:\n            value += ndp[j - 1]\n        if i > 0:\n            value += dp[j]\n        ndp[j] = value % M\n    dp = ndp\nprint(dp[n - 1])\n",
  },
  {
    slug: "learn-m5-grid-dp-h1",
    title: "Maximum Path Sum in a Grid",
    statement:
      "প্রাইমএশিয়া ফেস্টিভালে তানভীর একটা গ্রিড-ভিত্তিক খেলা তৈরি করছেন। খেলোয়াড় প্রথম সারির যেকোনো ঘর থেকে শুরু করে প্রতি ধাপে নিচে-বাম, নিচে বা নিচে-ডানে যেতে পারে, আর শেষ সারির যেকোনো ঘরে থামতে পারে। প্রতিটি ঘরে পয়েন্ট আছে (ঋণাত্মকও হতে পারে)। সর্বোচ্চ কয় পয়েন্ট পাওয়া যায়, সেটা বলুন।\n\nএকটা ঘর অবশ্যই পার করতে হবে; এক সারির গ্রিডে শুধু সেই সারির সর্বোচ্চ ঘরটাই উত্তর।\n\nউদাহরণ: `1 2 3 / 4 5 6 / 7 8 9` গ্রিডে পথ `3 → 6 → 9`, উত্তর `18`।",
    inputFormat:
      "প্রথম লাইনে `m` আর `n`। পরের `m` লাইনে প্রতিটিতে `n`টি পূর্ণসংখ্যা।",
    outputFormat: "সর্বোচ্চ পয়েন্ট এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= m, n <= 500`\n`-1000 <= grid[i][j] <= 1000`",
    editorial:
      "### ধারণা\n\n`dp[i][j]` হোক প্রথম সারি থেকে শুরু করে `(i,j)`-তে এসে সর্বোচ্চ পয়েন্ট। `(i,j)`-তে আসা যায় উপরের সারির তিনটি পাশের ঘর থেকেই — তাই `dp[i][j] = grid[i][j] + max(উপরের তিন ঘর)`। প্রথম সারির ঘরগুলো নিজের মান দিয়েই শুরু হয় (সেখানে কোনো উপরের ঘর নেই)। শেষে শেষ সারির সব ঘরের মধ্যে বড়টাই উত্তর। সব মান ঋণাত্মক হলেও সঠিক থাকে, কারণ প্রথম ঘরের মান দিয়েই শুরু হয়েছে — শূন্য দিয়ে শুরু করলে উত্তর `0` হয়ে যেত, যা ভুল।\n\n### ধাপে ধাপে\n\n1. `m`, `n` আর গ্রিড পড়ুন।\n2. `prev` = প্রথম সারি হিসেবে শুরু করুন।\n3. প্রতিটি পরবর্তী সারির জন্য নতুন `cur` বানান; প্রতিটি `j`-তে `best = max(prev[j-1], prev[j], prev[j+1])` (সীমার বাইরের ঘর বাদ)।\n4. `cur[j] = grid[i][j] + best`। শেষে `prev = cur`।\n5. লুপের পরে `max(prev)` প্রিন্ট করুন।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nm, n = data[0], data[1]\ngrid = data[2:]\nprev = grid[:n]\nfor i in range(1, m):\n    base = i * n\n    cur = grid[base:base + n]\n    for j in range(n):\n        best = prev[j]\n        if j > 0 and prev[j - 1] > best:\n            best = prev[j - 1]\n        if j + 1 < n and prev[j + 1] > best:\n            best = prev[j + 1]\n        cur[j] += best\n    prev = cur\nprint(max(prev))\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(m * n)`, স্পেস `O(n)`। `500 x 500` সর্বোচ্চ ইনপুটে ২.৫ লক্ষ ঘর, প্রতিটিতে তিনটা তুলনা — Python-এও সহজে চলে।\n\n### সাধারণ ভুল\n\n- `dp` শূন্য দিয়ে শুরু করা: সব মান ঋণাত্মক হলে উত্তর `0` দেবে, কিন্তু প্রশ্ন বলছে অন্তত একটা ঘর পার করতে হবে।\n- সীমার বাইরে ইনডেক্স: `j = 0`-তে `prev[j-1]` Python-এ শেষ ঘরটা ফেরত দেবে — ভুল সংযোগ হবে। `j > 0` শর্ত দিন।\n- পুরো `m x n` টেবিল বানালে স্পেস `O(m*n)`; প্রয়োজন নেই, এক সারিই যথেষ্ট।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Grid", "Maximum Path"],
    tests: [
      {
        input: "3 3\n1 2 3\n4 5 6\n7 8 9\n",
        expectedOutput: "18\n",
        isSample: true,
      },
      {
        input: "3 3\n-1 -2 -3\n-4 -5 -6\n-7 -8 -9\n",
        expectedOutput: "-12\n",
        isSample: true,
      },
      {
        input: "3 3\n1 1 1\n100 1 1\n1 100 1\n",
        expectedOutput: "201\n",
        isSample: false,
      },
      { input: "1 5\n1 2 3 4 5\n", expectedOutput: "5\n", isSample: false },
      {
        input: matrixInput(
          Array.from({ length: 500 }, () =>
            Array.from({ length: 500 }, () => 1),
          ),
        ),
        expectedOutput: "500\n",
        isSample: false,
      },
      {
        input: matrixInput(
          Array.from({ length: 500 }, () =>
            Array.from({ length: 500 }, () => -1),
          ),
        ),
        expectedOutput: "-500\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nm, n = data[0], data[1]\ngrid = data[2:]\nprev = grid[:n]\nfor i in range(1, m):\n    base = i * n\n    cur = grid[base:base + n]\n    for j in range(n):\n        best = prev[j]\n        if j > 0 and prev[j - 1] > best:\n            best = prev[j - 1]\n        if j + 1 < n and prev[j + 1] > best:\n            best = prev[j + 1]\n        cur[j] += best\n    prev = cur\nprint(max(prev))\n",
  },
  {
    slug: "learn-m5-grid-dp-x1",
    title: "Frog Jump with Cost",
    statement:
      "রাফি হোস্টেলের সিঁড়ির ধাপগুলোর খরচ মাপছেন — প্রতিটি ধাপে পা রাখলে সেই ধাপের খরচ কাটে। প্রথম ধাপ (`0`) থেকে শুরু করে প্রতিবার এক বা দুই ধাপ এগিয়ে শেষ ধাপে (`n - 1`) দাঁড়াতে হবে। সর্বনিম্ন মোট খরচ কত, সেটা বের করুন।\n\nশুরুর ধাপে পা রাখার খরচ নেই। উদাহরণ: খরচ `0 5 2` হলে `0` থেকে সরাসরি `2`-এ দুই ধাপ দিয়ে গেলে খরচ `2`।",
    inputFormat:
      "প্রথম লাইনে ধাপের সংখ্যা `n`। দ্বিতীয় লাইনে `n`টি খরচ, স্পেস দিয়ে আলাদা।",
    outputFormat: "সর্বনিম্ন মোট খরচ এক লাইনে প্রিন্ট করুন।",
    constraints: "`2 <= n <= 100000`\n`0 <= cost_i <= 1000`",
    editorial:
      "### ধারণা\n\n`dp[i]` হোক `i` ধাপে দাঁড়ানোর সর্বনিম্ন খরচ। `i`-তে আসা যায় `i-1` থেকে (এক ধাপ লাফ) বা `i-2` থেকে (দুই ধাপ লাফ); উভয় ক্ষেত্রেই নিচে নামতে গিয়ে `i` ধাপের খরচই কাটে। তাই `dp[i] = cost[i] + min(dp[i-1], dp[i-2])`। Base: `dp[0] = 0` (শুরু ফ্রি), `dp[1] = cost[1]` (এক ধাপ লাফিয়ে এক নম্বরে আসতেই হবে)।\n\n### ধাপে ধাপে\n\n1. `n` আর কস্ট অ্যারে পড়ুন।\n2. `p2 = 0` (`dp[0]`), `p1 = cost[1]` (`dp[1]`) দিয়ে শুরু করুন।\n3. `i = 2` থেকে `n - 1`: `p2, p1 = p1, cost[i] + min(p1, p2)`।\n4. শেষে `p1` প্রিন্ট করুন।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ncost = data[1:]\np2, p1 = 0, cost[1]\nfor i in range(2, n):\n    p2, p1 = p1, cost[i] + min(p1, p2)\nprint(p1)\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(1)` — দুই আগের ঘর যথেষ্ট।\n\n### সাধারণ ভুল\n\n- `cost[0]` যোগ করা: প্রশ্নে শুরুর ধাপে খরচ নেই; যোগ করলে উত্তর বেড়ে যায়।\n- লুপের প্রথম ধাপে `min(p1, p2)` আপডেট করার আগেই `p2` বদলে দেওয়া — টুপল অ্যাসাইনমেন্ট একসাথে করুন, নাহলে পুরনো মান হারিয়ে যায়।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "1D DP", "Frog"],
    tests: [
      { input: "3\n0 5 2\n", expectedOutput: "2\n", isSample: true },
      { input: "4\n0 1 2 3\n", expectedOutput: "4\n", isSample: true },
      { input: "4\n0 10 15 20\n", expectedOutput: "30\n", isSample: false },
      { input: "6\n0 2 1 0 3 1\n", expectedOutput: "2\n", isSample: false },
      {
        input:
          "100000\n" +
          Array.from({ length: 100000 }, () => 0).join(" ") +
          "\n",
        expectedOutput: "0\n",
        isSample: false,
      },
      {
        input:
          "100000\n" +
          Array.from({ length: 100000 }, () => 1).join(" ") +
          "\n",
        expectedOutput: "50000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ncost = data[1:]\np2, p1 = 0, cost[1]\nfor i in range(2, n):\n    p2, p1 = p1, cost[i] + min(p1, p2)\nprint(p1)\n",
  },
  {
    slug: "learn-m5-grid-dp-x2",
    title: "Dice Combinations",
    statement:
      "সাদিয়া ছকে চাপড়া খেলার হিসাব করছেন: ছয় পাশের পাশা নিয়ে মোট যোগফল ঠিক `n` করার কয়টা ভিন্ন উপায় আছে? পাশার অগ্রগতি যোগ হয়, পাশা দুটোর ক্রম আলাদা পথ বোঝায় — যেমন `1 + 2` আর `2 + 1` আলাদা।\n\nফল বড় হতে পারে, তাই `1000000007` দিয়ে ভাগের ভাগশেষ দিন।\n\nউদাহরণ: `n = 3` হলে `1+1+1`, `1+2`, `2+1`, `3` — উত্তর `4`।",
    inputFormat: "একটি লাইনে একটি পূর্ণসংখ্যা `n`।",
    outputFormat: "উপায় সংখ্যার `1000000007` ভাগশেষ এক লাইনে প্রিন্ট করুন।",
    constraints: "`1 <= n <= 100000`",
    editorial:
      "### ধারণা\n\n`dp[i]` হোক যোগফল `i` তৈরির উপায় সংখ্যা। শেষ পাশাটা `1` হলে বাকি `i-1` তৈরি করতে হবে, `2` হলে `i-2`, ... `6` হলে `i-6` — সব সম্ভাবনা পাশাপাশি, তাই `dp[i] = dp[i-1] + dp[i-2] + ... + dp[i-6]` (যেসব `i - f >= 0`)। Base: `dp[0] = 1` (শূন্য তৈরির একটামাত্র উপায়: কোনো পাশা না নেওয়া)। প্রতিটি ধাপে `1000000007`-এর ভাগশেষ নিলে মান নিয়ন্ত্রিত থাকে।\n\n### ধাপে ধাপে\n\n1. ইনপুট `n` নিন।\n2. `dp` অ্যারে `n + 1` আকারে বানান, `dp[0] = 1`।\n3. `i = 1` থেকে `n`: `f = 1..6` ঘুরে `i - f >= 0` হলে `dp[i]`-এ `dp[i-f]` যোগ করুন, শেষে মডুলাস নিন।\n4. `dp[n]` প্রিন্ট করুন।\n\n```python\nimport sys\nn = int(sys.stdin.readline())\nM = 1000000007\ndp = [0] * (n + 1)\ndp[0] = 1\nfor i in range(1, n + 1):\n    total = 0\n    for face in range(1, 7):\n        if i - face >= 0:\n            total += dp[i - face]\n    dp[i] = total % M\nprint(dp[n])\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n * 6)` = `O(n)`, স্পেস `O(n)`। `n = 100000`-এ মাত্র ছয় লক্ষ ধাপ।\n\n### সাধারণ ভুল\n\n- `dp[0] = 0` রাখা: তাহলে `dp[1]` থেকে শুরুই শূন্য হয়ে সব উত্তর শূন্য হবে। `dp[0] = 1` অপরিহার্য।\n- মডুলাস না নেওয়া: `n` বাড়লে মান দ্রুত বেড়ে যায়, প্রশ্নে বলা আছে ভাগশেষ দিতে।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Counting", "Modulo"],
    tests: [
      { input: "1\n", expectedOutput: "1\n", isSample: true },
      { input: "6\n", expectedOutput: "32\n", isSample: true },
      { input: "2\n", expectedOutput: "2\n", isSample: false },
      { input: "3\n", expectedOutput: "4\n", isSample: false },
      { input: "10\n", expectedOutput: "492\n", isSample: false },
      { input: "100000\n", expectedOutput: "797925478\n", isSample: false },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\nM = 1000000007\ndp = [0] * (n + 1)\ndp[0] = 1\nfor i in range(1, n + 1):\n    total = 0\n    for face in range(1, 7):\n        if i - face >= 0:\n            total += dp[i - face]\n    dp[i] = total % M\nprint(dp[n])\n",
  },
];
