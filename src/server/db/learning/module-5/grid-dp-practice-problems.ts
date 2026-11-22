import type { SeedProblem } from "../../seed-problems";
import { matrixInput } from "../generated-tests";

function snakeGrid(size: number): string {
  let v = size * size;
  const rows: number[][] = [];
  for (let i = 0; i < size; i++) {
    const cells: number[] = [];
    if (i % 2 === 0) {
      for (let j = 0; j < size; j++) cells.push(v--);
    } else {
      for (let j = size - 1; j >= 0; j--) cells[j] = v--;
    }
    rows.push(cells);
  }
  return matrixInput(rows);
}

export const GRID_DP_PRACTICE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m5-grid-dp-e2",
    title: "Pyramid of Gift Boxes",
    statement:
      "ফেস্টিভালে সাদিয়া একটা পিরামিড-আকৃতির বক্স-সাজি দেখল: একদম উপরে `1`টা বক্স, তার নিচের সারিতে `2`টা, তার নিচে `3`টা — এভাবে মোট `n` সারি। প্রতিটি বক্সে একটা পূর্ণসংখ্যা লেখা: কিছু বক্স পয়েন্ট দেয়, কিছু বক্স পয়েন্ট কেটে নেয় (ঋণাত্মক)।\n\nচূড়ার একমাত্র বক্স থেকে নামা শুরু করে ভিত্তির সারি পর্যন্ত পৌঁছাতে হবে। প্রতি ধাপে নিচে-বাম বা নিচে-ডান বক্সে নামা যায় — অর্থাৎ `i`-তম সারির `j` নম্বর বক্স থেকে পরের সারির `j` বা `j + 1` নম্বর বক্সে। পথে পড়া বক্সগুলোর মানের যোগফল সর্বনিম্ন কত হতে পারে, সেটা বের করো।\n\nউদাহরণ: পিরামিড `2 / 3 4 / 6 5 7 / 4 1 8 3` — সর্বনিম্ন পথ `2 → 3 → 5 → 1`, যোগফল `11`।",
    inputFormat:
      "প্রথম লাইনে সারির সংখ্যা `n`। এরপর `i`-তম সারিতে (`i = 1 ... n`) `i`টি পূর্ণসংখ্যা, প্রতিটি আলাদা লাইনে।",
    outputFormat: "সর্বনিম্ন যোগফল এক লাইনে প্রিন্ট করো।",
    constraints: "`1 <= n <= 1000`\n`-1000 <= value <= 1000`",
    editorial:
      "## ধারণা\n\nলম্বা গ্রিডের মতোই state দুই ইনডেক্স — তবে এখানে সারিগুলোর দৈর্ঘ্য বাড়ছে, আর নামার নিয়ম `j` থেকে `j` বা `j + 1`। উপর থেকে ভরলে প্রতিটি ঘরের দুইটা আগের ঘর দেখতে হয়; কিন্তু উল্টো দিক থেকে ভাবলে কাজ আরও সহজ হয়ে যায়: `dp[i][j]` ধরো `(i, j)` বক্স থেকে ভিত্তি পর্যন্ত নামার সর্বনিম্ন যোগফল। তাহলে নিচের সারি আগে ভরা থাকবে, আর `dp[i][j] = value + min(dp[i+1][j], dp[i+1][j+1])`। শেষ সারির বক্স থেকে আর নামা লাগে না, তাই সেগুলোর `dp` নিজের মানই। উত্তর চূড়ার বক্সের `dp`।\n\nনিচ থেকে উপরে ভরাই এই প্রশ্নের স্বাভাবিক ক্রম — নির্ভর করা ঘর সবসময় এক সারি নিচে।\n\n## ধাপে ধাপে\n\n1. `n` পড়ে সারি ধরে পিরামিডের মানগুলো সাজাও।\n2. `dp`-এর শুরুতে শেষ সারিটা বসাও।\n3. `i = n - 2` থেকে `0` পর্যন্ত উল্টো ক্রমে: প্রতিটি `j`-এর জন্য `dp[j] = value + min(dp[j], dp[j + 1])` আপডেট করো।\n4. `dp[0]` প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ntri = []\nidx = 1\nfor i in range(1, n + 1):\n    tri.append(data[idx:idx + i])\n    idx += i\ndp = tri[-1][:]\nfor i in range(n - 2, -1, -1):\n    for j in range(i + 1):\n        dp[j] = tri[i][j] + min(dp[j], dp[j + 1])\nprint(dp[0])\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n^2)` — পিরামিডে মোট বক্স `n(n+1)/2`টা, প্রতিটিতে `O(1)` কাজ। স্পেস `O(n)` — শুধু চলতি দুই সারি লাগে। `n = 1000`-এ প্রায় পাঁচ লক্ষ বক্স।\n\n## সাধারণ ভুল\n\n- উপর থেকে ভরতে গিয়ে সারির দৈর্ঘ্য নিয়ম ভুল করা: পিরামিডে প্রতিটি বক্সের ঠিক দুইটা সন্তান-ঘর আছে, গ্রিডের মতো বাম সীমানা নেই।\n- শেষ সারির `dp` নিজের মান না বসিয়ে শূন্য রাখা: তখন সব পথের খরচ কমে যায়।\n- `min` এর জায়গায় প্রতিবার ছোট পাশের ঘর বেছে নেওয়া: পিরামিডে স্থানীয় ছোট পদ পরে বড় খরচে নামিয়ে দিতে পারে, তাই দুই সন্তানের সেরাটাই নাও।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Grid", "Triangle"],
    tests: [
      {
        input: "4\n2\n3 4\n6 5 7\n4 1 8 3\n",
        expectedOutput: "11\n",
        isSample: true,
      },
      {
        input: "3\n1\n2 3\n4 5 6\n",
        expectedOutput: "7\n",
        isSample: true,
      },
      { input: "1\n42\n", expectedOutput: "42\n", isSample: false },
      {
        input: "3\n-5\n-1 -2\n3 -4 5\n",
        expectedOutput: "-11\n",
        isSample: false,
      },
      {
        input:
          "1000\n" +
          Array.from({ length: 1000 }, (_, i) =>
            Array.from({ length: i + 1 }, () => 1).join(" "),
          ).join("\n") +
          "\n",
        expectedOutput: "1000\n",
        isSample: false,
      },
      {
        input:
          "500\n" +
          Array.from({ length: 500 }, (_, i) =>
            Array.from({ length: i + 1 }, () => i + 1).join(" "),
          ).join("\n") +
          "\n",
        expectedOutput: "125250\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ntri = []\nidx = 1\nfor i in range(1, n + 1):\n    tri.append(data[idx:idx + i])\n    idx += i\ndp = tri[-1][:]\nfor i in range(n - 2, -1, -1):\n    for j in range(i + 1):\n        dp[j] = tri[i][j] + min(dp[j], dp[j + 1])\nprint(dp[0])\n",
  },
  {
    slug: "learn-m5-grid-dp-e3",
    title: "Maximum Falling Path",
    statement:
      "মেলায় একটা টিল্টেড পিনবল মেশিনে রফি বল ফেলল। `n x n` বোর্ডের প্রতিটি ঘরে পয়েন্ট লেখা — ঋণাত্মকও হতে পারে। বলটা প্রথম সারির **যেকোনো** ঘর থেকে শুরু করে প্রতি ধাপে নিচে, নিচে-বাম বা নিচে-ডান ঘরে নামতে পারে; বোর্ডের বাইরে নামা যাবে না।\n\nবল যে যে ঘরে ছুঁয়েছে, সেই সব ঘরের পয়েন্টের যোগফল তার স্কোর। শেষ সারি পর্যন্ত নামার পথ বেছে সর্বোচ্চ স্কোর কত হতে পারে, সেটা বের করো।\n\nউদাহরণ: `1 2 3 / 4 5 6 / 7 8 9` — ডান প্রান্ত ধরে `3 → 6 → 9`, স্কোর `18`।",
    inputFormat:
      "প্রথম লাইনে `n`। পরের `n` লাইনে প্রতিটিতে `n`টি পূর্ণসংখ্যা — সেই সারির ঘরগুলোর পয়েন্ট।",
    outputFormat: "সর্বোচ্চ স্কোর এক লাইনে প্রিন্ট করো।",
    constraints: "`1 <= n <= 1000`\n`-1000 <= value <= 1000`",
    editorial:
      "## ধারণা\n\n`dp[i][j]` ধরো `(i, j)` ঘরে বল ঢুকলে সেখান থেকে শেষ সারি পর্যন্ত পাওয়া সর্বোচ্চ স্কোর। ঢোকার ঘর থেকে নামা যায় তিন জায়ায় — নিচে, নিচে-বাম, নিচে-ডান — তাই `dp[i][j] = value + max(dp[i+1][j-1], dp[i+1][j], dp[i+1][j+1])`, কলাম সীমার বাইরের ঘর বাদ। শেষ সারিতে আর নামা নেই, সেখানে `dp` নিজের মানই। প্রথম সারির যেকোনো ঘর থেকে শুরু হতে পারে, তাই উত্তর প্রথম সারির সব `dp`-এর সর্বোচ্চটা। নিচ থেকে উপরে ভরলে নির্ভর করা সারি আগেই তৈরি থাকে।\n\nপ্রথম সারিতে শুরু স্থির না থাকাটাই এই প্রশ্নের বাড়তি অংশ — শুরু বেছে নেওয়ার কাজটাও শেষ ধাপের সর্বোচ্চের মধ্যে ঢুকে যায়।\n\n## ধাপে ধাপে\n\n1. `n` আর বোর্ড পড়ো।\n2. `dp`-এ শেষ সারির মানগুলো বসাও।\n3. `i = n - 2` থেকে `0`: প্রতিটি `j`-এ তিন সন্তানের সর্বোচ্চ `dp`-এর সাথে ঘরের মান যোগ করো (কলাম সীমা যাচাই করো)।\n4. `max(dp)` প্রিন্ট করো — প্রথম সারির সেরা শুরু।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ng = data[1:1 + n * n]\ndp = g[n * n - n:n * n]\nfor i in range(n - 2, -1, -1):\n    base = i * n\n    below = (i + 1) * n\n    ndp = [0] * n\n    for j in range(n):\n        best = dp[j]\n        if j > 0 and dp[j - 1] > best:\n            best = dp[j - 1]\n        if j + 1 < n and dp[j + 1] > best:\n            best = dp[j + 1]\n        ndp[j] = best + g[base + j]\n    dp = ndp\nprint(max(dp))\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n^2)`, স্পেস `O(n)` — এক সারি ঘুরিয়ে ঘুরিয়ে কাজ হয়ে যায়। `n = 1000`-এ দশ লক্ষ ঘর।\n\n## সাধারণ ভুল\n\n- প্রথম সারি থেকে ভরতে গিয়ে উত্তর `dp[0][0]` ধরা: শুরু যেকোনো ঘরে হতে পারে, তাই প্রথম সারির সর্বোচ্চটা নাও।\n- কলাম সীমা না দেখা: `j = 0` থেকে `j - 1` বা `j = n - 1` থেকে `j + 1` এ নামলে বোর্ডের বাইরে চলে যায় — নিচের বোর্ডের ভুল ঘরের মান পড়ে।\n- সব মান ঋণাত্মক হলে উত্তর শূন্য ধরা: পথ তো নামতেই হবে, তাই সঠিক উত্তরও ঋণাত্মক হতে পারে।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Grid", "Falling Path"],
    tests: [
      {
        input: "3\n1 2 3\n4 5 6\n7 8 9\n",
        expectedOutput: "18\n",
        isSample: true,
      },
      {
        input: "3\n-1 -2 -3\n-4 -5 -6\n-7 -8 -9\n",
        expectedOutput: "-12\n",
        isSample: true,
      },
      { input: "1\n7\n", expectedOutput: "7\n", isSample: false },
      {
        input: "3\n2 1 3\n6 5 4\n7 8 9\n",
        expectedOutput: "17\n",
        isSample: false,
      },
      {
        input:
          "1000\n" +
          Array.from({ length: 1000 }, () =>
            Array.from({ length: 1000 }, () => -1000).join(" "),
          ).join("\n") +
          "\n",
        expectedOutput: "-1000000\n",
        isSample: false,
      },
      {
        input:
          "1000\n" +
          Array.from({ length: 1000 }, () =>
            Array.from({ length: 1000 }, (_, j) => (j % 1000) + 1).join(" "),
          ).join("\n") +
          "\n",
        expectedOutput: "1000000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ng = data[1:1 + n * n]\ndp = g[n * n - n:n * n]\nfor i in range(n - 2, -1, -1):\n    base = i * n\n    ndp = [0] * n\n    for j in range(n):\n        best = dp[j]\n        if j > 0 and dp[j - 1] > best:\n            best = dp[j - 1]\n        if j + 1 < n and dp[j + 1] > best:\n            best = dp[j + 1]\n        ndp[j] = best + g[base + j]\n    dp = ndp\nprint(max(dp))\n",
  },
  {
    slug: "learn-m5-grid-dp-m2",
    title: "Largest Square Plot",
    statement:
      "মেলার মাঠের ম্যাপ `m x n` গ্রিডে প্রতিটি ঘর `0` নয় `1`: `1` মানে ঘরটা খোলা, `0` মানে ঘরটা বন্ধ। নুসরাত একটা **বর্গাকার** স্টল বসাতে চায় — বর্গের ভেতরের প্রতিটি ঘর খোলা থাকতে হবে।\n\nসবচেয়ে বড় বর্গের বাহুর দৈর্ঘ্য কত হতে পারে? কোনো খোলা ঘরই না থাকলে উত্তর `0`।\n\nউদাহরণ: গ্রিডের দ্বিতীয়-তৃতীয় সারিতে পাশাপাশি খোলা ঘর থাকলে `2 x 2` বর্গ বসে — যেমন নিচের নমুনায়।",
    inputFormat:
      "প্রথম লাইনে `m` আর `n`। পরের `m` লাইনে প্রতিটিতে `n`টি `0`/`1`।",
    outputFormat: "সবচেয়ে বড় বর্গের বাহু এক লাইনে প্রিন্ট করো।",
    constraints: "`1 <= m, n <= 1000`\nপ্রতিটি ঘর `0` অথবা `1`।",
    editorial:
      "## ধারণা\n\n`dp[i][j]` ধরো `(i, j)` ঘরকে **নিচে-ডান কোণ** ধরে এখন পর্যন্ত বসানো যায় এমন সবচেয়ে বড় বর্গের বাহু। ঘরটা বন্ধ হলে সেখানে বর্গ বসেই না, `dp[i][j] = 0`। খোলা হলে বর্গের বাহু তিনটা প্রতিবেশীর ওপর নির্ভর করে — বাম, উপর আর কর্ণের ঘর:\n\n`dp[i][j] = 1 + min(dp[i][j-1], dp[i-1][j], dp[i-1][j-1])`\n\nকারণটা ছোট উদাহরণে দেখা যায়: বাহু `k` এর বর্গ বসাতে হলে বাম প্রতিবেশীতে অন্তত বাহু `k-1` এর বর্গ, উপরে অন্তত বাহু `k-1` এর বর্গ, আর কর্ণেও অন্তত বাহু `k-1` এর বর্গ বসানো সম্ভব হতে হবে — তিনটার সবচেয়ে ছোটটাই বাধা হয়ে দাঁড়ায়। উত্তর পুরো টেবিলের সর্বোচ্চ `dp`।\n\n## ধাপে ধাপে\n\n1. `m`, `n` আর গ্রিড পড়ো।\n2. এক সারির অ্যারে `prev` দিয়ে উপর থেকে ঘুরে `cur` বানাও: ঘর `1` হলে `cur[j+1] = min(prev[j], prev[j+1], cur[j]) + 1`, নাহলে `0`।\n3. প্রতিটি ধাপের সর্বোচ্চটা `best`-এ রাখো।\n4. শেষে `best` প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nm, n = data[0], data[1]\ngrid = data[2:2 + m * n]\nprev = [0] * (n + 1)\nbest = 0\nfor i in range(m):\n    base = i * n\n    cur = [0] * (n + 1)\n    for j in range(n):\n        if grid[base + j] == 1:\n            v = prev[j]\n            if prev[j + 1] < v:\n                v = prev[j + 1]\n            if cur[j] < v:\n                v = cur[j]\n            cur[j + 1] = v + 1\n            if cur[j + 1] > best:\n                best = cur[j + 1]\n    prev = cur\nprint(best)\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(m * n)`, স্পেস `O(n)`। `1000 x 1000`-এ দশ লক্ষ ঘর, Python-এও দ্রুত চলে।\n\n## সাধারণ ভুল\n\n- বর্গের বদলে সর্বোচ্চ আয়ত খোঁজা: `min` এর জায়গায় শুধু বাম-উপর দুই ঘর দেখলে আয়ত হয়ে যায় — কর্ণের ঘরটা না দেখলে বাহু দুই দিকে আলাদা বাড়ে।\n- `dp`-এর সংজ্ঞা ঘরকে কোণ না ধরে মাঝখান ধরা: তখন transition মেলে না; কোণ ধরলেই তিন প্রতিবেশীর `min` সূত্রটা দাঁড়ায়।\n- ঘর `0` হলেও আগের মান ধরে রাখা: বন্ধ ঘরে কোনো বর্গ বসে না, `dp` অবশ্যই `0`।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Grid", "Squares"],
    tests: [
      {
        input: "4 5\n1 0 1 0 0\n1 0 1 1 1\n1 1 1 1 1\n1 0 0 1 0\n",
        expectedOutput: "2\n",
        isSample: true,
      },
      {
        input: "2 2\n1 1\n1 1\n",
        expectedOutput: "2\n",
        isSample: true,
      },
      { input: "3 3\n0 0 0\n0 0 0\n0 0 0\n", expectedOutput: "0\n", isSample: false },
      {
        input: "5 5\n0 0 0 0 0\n0 0 0 0 0\n0 0 1 0 0\n0 0 0 0 0\n0 0 0 0 0\n",
        expectedOutput: "1\n",
        isSample: false,
      },
      {
        input: "5 5\n1 1 1 0 0\n1 1 1 0 0\n1 1 1 0 0\n0 0 0 0 0\n0 0 0 1 1\n",
        expectedOutput: "3\n",
        isSample: false,
      },
      {
        input: matrixInput(
          Array.from({ length: 1000 }, (_, i) =>
            Array.from({ length: 1000 }, (_, j) => (i + j) % 2),
          ),
        ),
        expectedOutput: "1\n",
        isSample: false,
      },
      {
        input: matrixInput(
          Array.from({ length: 1000 }, () =>
            Array.from({ length: 1000 }, () => 1),
          ),
        ),
        expectedOutput: "1000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nm, n = data[0], data[1]\ngrid = data[2:2 + m * n]\nprev = [0] * (n + 1)\nbest = 0\nfor i in range(m):\n    base = i * n\n    cur = [0] * (n + 1)\n    for j in range(n):\n        if grid[base + j] == 1:\n            v = prev[j]\n            if prev[j + 1] < v:\n                v = prev[j + 1]\n            if cur[j] < v:\n                v = cur[j]\n            cur[j + 1] = v + 1\n            if cur[j + 1] > best:\n                best = cur[j + 1]\n    prev = cur\nprint(best)\n",
  },
  {
    slug: "learn-m5-grid-dp-m3",
    title: "Minimum Starting Battery",
    statement:
      "তানভিরের রোবো-ক্লিনার `m x n` গ্রিডের `(1, 1)` ঘর থেকে রওনা দিয়ে `(m, n)` ঘরে পৌঁছাবে; প্রতি ধাপে শুধু ডানে বা নিচে এক ঘর এগোনো যায়। প্রতিটি ঘরে একটা পূর্ণসংখ্যা লেখা: ধনাত্মক হলে ব্যাটারি ততটা চার্জ হয়, ঋণাত্মক হলে ততটা খরচ হয়। যে ঘরে পা রাখা হয়, সেই ঘরের মান তৎক্ষণাৎ ব্যাটারিতে যোগ হয় — শুরুর ঘরসহ।\n\nনিয়ম একটাই: যাত্রার শুরুতে ব্যাটারিতে কিছু চার্জ নিয়ে রওনা দিতে হবে, আর যেকোনো ঘরে পা রাখার পর ব্যাটারি `1` এর কমে যাবে না। সবচেয়ে কম কত চার্জ (একটা ধনাত্মক পূর্ণসংখ্যা) নিয়ে বেরোলে যাত্রা সম্ভব, সেটা বের করো।\n\nউদাহরণ: `-2 -3 3 / -5 -10 1 / 10 30 -5` — `7` চার্জ নিয়ে বেরোলে পথ ধরে যাওয়া যায়, কম হলে মাঝপথে ব্যাটারি শূন্যে নেমে আসে।",
    inputFormat:
      "প্রথম লাইনে `m` আর `n`। পরের `m` লাইনে প্রতিটিতে `n`টি পূর্ণসংখ্যা।",
    outputFormat: "সর্বনিম্ন শুরুর চার্জ এক লাইনে প্রিন্ট করো।",
    constraints:
      "`1 <= m, n <= 100`\n`-1000 <= value <= 1000`",
    editorial:
      "## ধারণা\n\nসামনের দিক থেকে ভরা যায় না — কোনো ঘরে পৌঁছাতে কত চার্জ লাগবে তা জানা থাকে না। তাই উল্টো দিক থেকে ভাবো: `dp[i][j]` ধরো `(i, j)` ঘরে **ঢোকার আগে** ব্যাটারিতে অন্তত কত থাকতে হবে, যেন সেখান থেকে গন্তব্য পর্যন্ত নিয়ম রক্ষা করে পৌঁছানো যায়। তাহলে নিচের সারি থেকে উপরে ভরা যায়:\n\n`dp[i][j] = max(1, পরের ঘর দুটোর ছোট dp - এই ঘরের মান)`\n\n`max(1, ...)` কেন? ঘরে ঢোকার পর ব্যাটারি `1` এর নিচে নামবে না, আর শুরুর চার্জ ধনাত্মক — দুই শর্তই এই এক ঘরে বসে যায়। শেষ ঘর `(m, n)`-এর জন্য পরের ঘর নেই, সেখানে শুধু নিজের মান: `max(1, 1 - value)`। উত্তর `dp[1][1]`।\n\n## ধাপে ধাপে\n\n1. `m`, `n` আর গ্রিড পড়ো।\n2. `dp[m-1][n-1] = max(1, 1 - grid[m-1][n-1])` বসাও।\n3. `i` নিচ থেকে উপরে, `j` ডান থেকে বামে: শেষ সারি/কলামে একটা প্রতিবেশী, ভেতরের ঘরে দুইটার ছোটটা নাও, সূত্র চালাও।\n4. `dp[0][0]` প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nm, n = data[0], data[1]\ng = data[2:2 + m * n]\ndp = [[0] * n for _ in range(m)]\nfor i in range(m - 1, -1, -1):\n    base = i * n\n    for j in range(n - 1, -1, -1):\n        v = g[base + j]\n        if i == m - 1 and j == n - 1:\n            dp[i][j] = 1 - v\n            if dp[i][j] < 1:\n                dp[i][j] = 1\n            continue\n        if i == m - 1:\n            nxt = dp[i][j + 1]\n        elif j == n - 1:\n            nxt = dp[i + 1][j]\n        else:\n            nxt = dp[i + 1][j]\n            if dp[i][j + 1] < nxt:\n                nxt = dp[i][j + 1]\n        need = nxt - v\n        if need < 1:\n            need = 1\n        dp[i][j] = need\nprint(dp[0][0])\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(m * n)`, স্পেস `O(m * n)`। `100 x 100`-এ মাত্র দশ হাজার ঘর।\n\n## সাধারণ ভুল\n\n- সামনের দিক থেকে ভরা: সামনে জানা নেই শেষে কত লাগবে, তাই টেবিল দাঁড়ায় না — এই প্রশ্নে পিছন থেকে ভরাই মূল কৌশল।\n- `max(1, ...)` বাদ দেওয়া: ঘরের মান যত ধনাত্মকই হোক, শুরুর চার্জ ধনাত্মক হতেই হবে; `1` এর নিচের মান গ্রহণ করা যায় না।\n- `nxt - v` এর জায়গায় শুধু `nxt` ধরা: এই ঘরের চার্জ-খরচের হিসাবটা বাদ গেলে উত্তর দাঁড়ায় না।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Grid", "Backward DP"],
    tests: [
      {
        input: "3 3\n-2 -3 3\n-5 -10 1\n10 30 -5\n",
        expectedOutput: "7\n",
        isSample: true,
      },
      {
        input: "2 2\n2 3\n4 5\n",
        expectedOutput: "1\n",
        isSample: true,
      },
      {
        input: "2 2\n1 -3\n2 -1\n",
        expectedOutput: "1\n",
        isSample: false,
      },
      {
        input: "1 1\n-999\n",
        expectedOutput: "1000\n",
        isSample: false,
      },
      {
        input: matrixInput(
          Array.from({ length: 100 }, () =>
            Array.from({ length: 100 }, () => -1000),
          ),
        ),
        expectedOutput: "199001\n",
        isSample: false,
      },
      {
        input: matrixInput(
          Array.from({ length: 100 }, (_, i) =>
            Array.from({ length: 100 }, (_, j) => ((i * 31 + j * 17) % 2001) - 1000),
          ),
        ),
        expectedOutput: "16633\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nm, n = data[0], data[1]\ng = data[2:2 + m * n]\ndp = [[0] * n for _ in range(m)]\nfor i in range(m - 1, -1, -1):\n    base = i * n\n    for j in range(n - 1, -1, -1):\n        v = g[base + j]\n        if i == m - 1 and j == n - 1:\n            dp[i][j] = 1 - v\n            if dp[i][j] < 1:\n                dp[i][j] = 1\n            continue\n        if i == m - 1:\n            nxt = dp[i][j + 1]\n        elif j == n - 1:\n            nxt = dp[i + 1][j]\n        else:\n            nxt = dp[i + 1][j]\n            if dp[i][j + 1] < nxt:\n                nxt = dp[i][j + 1]\n        need = nxt - v\n        if need < 1:\n            need = 1\n        dp[i][j] = need\nprint(dp[0][0])\n",
  },
  {
    slug: "learn-m5-grid-dp-h2",
    title: "Longest Ski Descent",
    statement:
      "পাহাড়ি ক্যাম্পাসের `m x n` ম্যাপে প্রতিটি ঘরে ওই জায়গার উচ্চতা লেখা। রফি স্কি নামাচ্ছে: একটা ঘর থেকে সে শুধু প্রতিবেশী চার ঘরের (উপর, নিচ, বাম, ডান) যেকোনো একটায় যেতে পারে — তবে শর্ত হলো নতুন ঘরের উচ্চতা **কঠোরভাবে কম** হতে হবে। একই ঘরে দুইবার যাওয়ার দরকার হয় না, কারণ উচ্চতা কমছেই — ফিরে আসা অসম্ভব।\n\nযেখান থেকে যেখানে — পুরো ম্যাপের মধ্যে সবচেয়ে লম্বা নামার পথে সর্বোচ্চ কয়টা ঘর ঘোড়া যায়, সেটা বের করো।\n\nউদাহরণ: `8 6 4 / 7 5 3 / 9 2 1` — `8 → 7 → 5 → 3 → 1` পথে `5`টা ঘর; এর চেয়ে লম্বা পথ নেই।",
    inputFormat:
      "প্রথম লাইনে `m` আর `n`। পরের `m` লাইনে প্রতিটিতে `n`টি পূর্ণসংখ্যা — ঘরের উচ্চতা।",
    outputFormat: "সবচেয়ে লম্বা নামার ঘর সংখ্যা এক লাইনে প্রিন্ট করো।",
    constraints: "`1 <= m, n <= 100`\n`1 <= height <= 10^9`",
    editorial:
      "## ধারণা\n\nএইবার উচ্চতা কমার নিয়ম ডানে-বামে সব দিকে — তাই সারি ধরে ভরা টেবিল আর চলবে না; কোন ঘর আগে, কোনটা পরে ভরবে সেটাই প্রশ্ন। লক্ষ করো: প্রতিটি ধারা (path) উচ্চতার সাজানো ক্রমেই নামে। তাই ঘরগুলোকে **উচ্চতার ঊর্ধ্বক্রমে** সাজিয়ে নিলে প্রতিটি ঘর প্রক্রিয়া করার সময় তার চেয়ে ছোট প্রতিবেশীদের উত্তর আগেই তৈরি। `dp[c]` ধরো ঘর `c` থেকে শুরু করা সবচেয়ে লম্বা নামার ঘর সংখ্যা:\n\n`dp[c] = 1 + max(dp[neighbor])` — শুধু কঠোরভাবে ছোট উচ্চতার প্রতিবেশীদের মধ্যে থেকে\n\nসমান উচ্চতার ঘরে যাওয়া যায় না, তাই সমান-উচ্চতার জোড়া কখনো একে অপরকে আপডেট করে না — সাজানোর ভেতরে তাদের ভাগ কীভাবে পড়ে তাতে ফল বদলায় না। উত্তর সব `dp`-এর সর্বোচ্চ।\n\n## ধাপে ধাপে\n\n1. `m`, `n` আর উচ্চতাগুলো পড়ো।\n2. সব ঘরকে উচ্চতার ঊর্ধ্বক্রমে (ছোট থেকে বড়) সাজাও।\n3. সাজানো ক্রমে প্রতিটি ঘরের চার প্রতিবেশী দেখো: ছোট উচ্চতার প্রতিবেশী পেলে `1 + dp[neighbor]` থেকে বড়টা রাখো।\n4. সব `dp`-এর সর্বোচ্চ প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nm, n = data[0], data[1]\ng = data[2:2 + m * n]\ncells = sorted(range(m * n), key=lambda p: g[p])\ndp = [1] * (m * n)\nbest = 1\nfor p in cells:\n    i, j = p // n, p % n\n    for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):\n        ni, nj = i + di, j + dj\n        if 0 <= ni < m and 0 <= nj < n:\n            q = ni * n + nj\n            if g[q] < g[p] and dp[q] + 1 > dp[p]:\n                dp[p] = dp[q] + 1\n    if dp[p] > best:\n        best = dp[p]\nprint(best)\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(m * n * log(m * n))` — সাজানোই সবচেয়ে বড় কাজ, প্রতিটি ঘরে চারটা প্রতিবেশী যাচাই। স্পেস `O(m * n)`। `100 x 100`-এ দশ হাজার ঘর।\n\n## সাধারণ ভুল\n\n- সারি-কলাম ক্রমে ভরা: উচ্চতা সব দিকে নামে, তাই ক্রম ভুল ঘর থেকে মান আনে — ভরার ক্রম উচ্চতা মেনে হাঁটাও।\n- সমান উচ্চতাকে নামা ধরা: প্রশ্নে বলা আছে কঠোরভাবে কম; `<=` লিখলে সমান ঘরগুলোতে লুপের মতো গোনা শুরু হয়।\n- BFS দিয়ে ভাবা: এটা লম্বা পথের হিসাব, প্রতি ঘরে ঢুকে প্রথমবারই চূড়ান্ত উত্তর পাওয়া যায় না — প্রতিটি ঘরের সেরা মান জমিয়ে রাখতে হবে।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Grid", "DAG"],
    tests: [
      {
        input: "3 3\n8 6 4\n7 5 3\n9 2 1\n",
        expectedOutput: "5\n",
        isSample: true,
      },
      {
        input: "2 2\n5 5\n5 5\n",
        expectedOutput: "1\n",
        isSample: true,
      },
      { input: "1 1\n4\n", expectedOutput: "1\n", isSample: false },
      {
        input: matrixInput(
          Array.from({ length: 100 }, () =>
            Array.from({ length: 100 }, () => 9),
          ),
        ),
        expectedOutput: "1\n",
        isSample: false,
      },
      {
        input: matrixInput(
          Array.from({ length: 100 }, (_, i) =>
            Array.from({ length: 100 }, (_, j) => (99 - i) * 100 + (99 - j)),
          ),
        ),
        expectedOutput: "199\n",
        isSample: false,
      },
      {
        input: snakeGrid(100),
        expectedOutput: "10000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nm, n = data[0], data[1]\ng = data[2:2 + m * n]\ncells = sorted(range(m * n), key=lambda p: g[p])\ndp = [1] * (m * n)\nbest = 1\nfor p in cells:\n    i, j = p // n, p % n\n    for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):\n        ni, nj = i + di, j + dj\n        if 0 <= ni < m and 0 <= nj < n:\n            q = ni * n + nj\n            if g[q] < g[p] and dp[q] + 1 > dp[p]:\n                dp[p] = dp[q] + 1\n    if dp[p] > best:\n        best = dp[p]\nprint(best)\n",
  },
];
