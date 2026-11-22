import type { SeedProblem } from "../../seed-problems";

export const MODULE5_CHECKPOINT_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m5-checkpoint-1",
    title: "Best Campus Week (Maximum Subarray)",
    statement:
      "প্রাইমএশিয়া উৎসব সপ্তাহে রাফি প্রতিদিনের টাকা জমার হিসাব দেখছেন — কিছু দিনে খরচ বেশি হয়ে যায় (ঋণাত্মক)। টাকা কমে যাওয়া দিনগুলো মাঝখান থেকে এড়িয়ে যাওয়া যায়; পরপর কয়েকটা দিনের মোট জমা সবচেয়ে বেশি কত হতে পারে, সেটা বের করুন।\n\nপরপর মানে contiguous — দিনগুলো ছাড়া যাওয়া যাবে না, তবে কোনো একটা দিন দিয়েই শুরু করা যায়। সব দিনই ঋণাত্মক হলে একটা দিনই বেছে নিতে হবে (খালি রাখা যাবে না)।\n\nউদাহরণ: `5 -3 5` — `5 -3 + 5 = 7`।",
    inputFormat:
      "প্রথম লাইনে দিনের সংখ্যা `n`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।",
    outputFormat: "সর্বোচ্চ পরপর উপসারির যোগফল এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= n <= 100000`\n`-10^9 <= a_i <= 10^9`\nউত্তর 64-বিটের মধ্যে থাকবে।",
    editorial:
      "### ধারণা\n\n`cur` ধরুন যে উপসারিটা **শেষ হলো এখনকার ঘরে** সর্বোচ্চ যোগফল। নতুন মান `x` এলে দুইটার মধ্যে ভালো: আগের `cur`-এ `x` যোগ করা (পরপর চালিয়ে যাওয়া), বা `x` দিয়ে নতুন উপসারি শুরু করা — আগেরটা যদি ঋণাত্মক হয়ে যায়। অর্থাৎ `cur = max(x, cur + x)`। সেরা উত্তর যেকোনো ঘরে শেষ হতে পারে, তাই চলতি সময়ের সর্বোচ্চটাও রাখতে হবে: `best = max(best, cur)`। এটাই Kadane-এর সূত্র।\n\n### ধাপে ধাপে\n\n1. `n` আর অ্যারে পড়ুন।\n2. `best = cur = a[0]` দিয়ে শুরু করুন (প্রথম দিনটাই একমাত্র সম্ভাবনা হিসেবে)।\n3. বাকি মানের জন্য: `cur = max(x, cur + x)`, তারপর `best = max(best, cur)`।\n4. `best` প্রিন্ট করুন।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\nbest = cur = a[0]\nfor x in a[1:]:\n    cur = max(x, cur + x)\n    if cur > best:\n        best = cur\nprint(best)\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(1)` — এক বার লুপ ঘোরাই যথেষ্ট।\n\n### সাধারণ ভুল\n\n- `best` শূন্য দিয়ে শুরু করা: সব মান ঋণাত্মক হলে উত্তর `0` দেবে, কিন্তু প্রশ্ন বলছে অন্তত একটা দিন ধরতে হবে — সঠিক উত্তর ঋণাত্মক হবে (উদাহরণে `-1`)।\n- খালি উপসারি ধরে নেওয়া: `n = 1` আর `cur` ইনিশিয়ালাইজেশন `0` করলে ভুল হয়; `a[0]` দিয়ে শুরু করুন।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Kadane", "Arrays"],
    tests: [
      { input: "3\n5 -3 5\n", expectedOutput: "7\n", isSample: true },
      { input: "6\n1 -2 3 -2 5 -1\n", expectedOutput: "6\n", isSample: true },
      { input: "4\n4 -1 2 1\n", expectedOutput: "6\n", isSample: false },
      { input: "2\n-2 -1\n", expectedOutput: "-1\n", isSample: false },
      { input: "1\n-9\n", expectedOutput: "-9\n", isSample: false },
      {
        input:
          "100000\n" +
          Array.from({ length: 100000 }, () => 1000000000).join(" ") +
          "\n",
        expectedOutput: "100000000000000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\nbest = cur = a[0]\nfor x in a[1:]:\n    cur = max(x, cur + x)\n    if cur > best:\n        best = cur\nprint(best)\n",
  },
  {
    slug: "learn-m5-checkpoint-2",
    title: "Ways to Make an Amount",
    statement:
      "ক্যান্টিনে টাকা বদলের জন্য নুসরাতের কাছে `n` ধরনের মুদ্রা আছে (প্রতিটি ধরন যত খুশি বার ব্যবহার করা যায়)। ঠিক `S` টাকা বানানোর **কয়টা ভিন্ন উপায়** আছে সেটা গুনুন — মুদ্রাদের ক্রম বদলালে উপায় আলাদা হবে না, শুধু কোন কোন ধরন কতবার নেওয়া হলো সেটা মিললেই একই উপায়।\n\n`S = 0` হলে কোনো মুদ্রা না নেওয়াটাই একটামাত্র উপায়, উত্তর `1`। সম্ভব না হলে `0`।\n\nফল বড় হতে পারে, তাই `1000000007` দিয়ে ভাগের ভাগশেষ দিন।\n\nউদাহরণ: মুদ্রা `1 2 3`, `S = 4` — `1+1+1+1`, `1+1+2`, `2+2`, `1+3`: উত্তর `4`।",
    inputFormat:
      "প্রথম লাইনে `n` আর `S`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা — মুদ্রার মান।",
    outputFormat:
      "উপায় সংখ্যার `1000000007` ভাগশেষ এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= n <= 100`\n`0 <= S <= 1000`\n`1 <= coin_i <= 1000`",
    editorial:
      "### ধারণা\n\n`dp[s]` হোক যোগফল `s` বানানোর উপায় সংখ্যা, `dp[0] = 1` (খালি উপায়)। মুদ্রা `c` একটা যোগ করলে নতুন উপায় তৈরি হয় আগের `dp[s - c]` উপায় থেকে — তাই `dp[s] += dp[s - c]`। উপায়ের ক্রম গোনা নয়, তাই মুদ্রার লুপ বাইরে আর সীমার লুপ **সামনে থেকে** চালাতে হয় — এক মুদ্রা একই উপায়ে বারবার ধরা পড়তে পারে (unbounded)। প্রতিটি ধাপে মডুলাস নিলে মান নিয়ন্ত্রিত থাকে।\n\n### ধাপে ধাপে\n\n1. `n`, `S` আর মুদ্রাগুলো পড়ুন।\n2. `dp = [0] * (S + 1)`, `dp[0] = 1`।\n3. প্রতিটি মুদ্রা `c`-এর জন্য `s = c` থেকে `S` পর্যন্ত সামনের দিকে: `dp[s] = (dp[s] + dp[s - c]) % 1000000007`।\n4. `dp[S]` প্রিন্ট করুন।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn, S = data[0], data[1]\ncoins = data[2:]\nM = 1000000007\ndp = [0] * (S + 1)\ndp[0] = 1\nfor c in coins:\n    for s in range(c, S + 1):\n        dp[s] = (dp[s] + dp[s - c]) % M\nprint(dp[S])\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n * S)`, স্পেস `O(S)`। `100 * 1000 = 10^5` ধাপ।\n\n### সাধারণ ভুল\n\n- লুপ পিছনে ঘোরানো: তখন মুদ্রা একবারই ধরা পড়ে, উত্তর 0/1 subset count হয়ে যায় — প্রশ্ন বলছে যত খুশি বার।\n- `dp[0] = 0` রাখা: সব উত্তর শূন্য হয়; `dp[0] = 1` ছাড়া কোনো উপায়ই শুরু হয় না।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Knapsack", "Counting"],
    tests: [
      { input: "3 4\n1 2 3\n", expectedOutput: "4\n", isSample: true },
      { input: "3 0\n1 2 3\n", expectedOutput: "1\n", isSample: true },
      { input: "1 3\n2\n", expectedOutput: "0\n", isSample: false },
      { input: "3 15\n1 5 10\n", expectedOutput: "6\n", isSample: false },
      { input: "1 1000\n1\n", expectedOutput: "1\n", isSample: false },
      {
        input:
          "100 1000\n" +
          Array.from({ length: 100 }, (_, i) => i + 1).join(" ") +
          "\n",
        expectedOutput: "222372164\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, S = data[0], data[1]\ncoins = data[2:]\nM = 1000000007\ndp = [0] * (S + 1)\ndp[0] = 1\nfor c in coins:\n    for s in range(c, S + 1):\n        dp[s] = (dp[s] + dp[s - c]) % M\nprint(dp[S])\n",
  },
  {
    slug: "learn-m5-checkpoint-3",
    title: "Break the Study Notes",
    statement:
      "তানভীর নোটের শিরোনাম এমন একটা শব্দ আছে যেটাকে ছোট ছোট অংশে ভাঙা যায় — প্রতিটি অংশ ডিকশনারির একটা শব্দ হতে হবে, আর অংশগুলো পরপর বসিয়ে পুরো শব্দটা ফিরে আসতে হবে। এমনভাবে ভাঙা সম্ভব কিনা বলুন।\n\nএকই ডিকশনারি-শব্দ যত খুশি বার ব্যবহার করা যায়। খালি শব্দ (কোনো অংশ না নেওয়া) প্রয়োজন নেই।\n\nউদাহরণ: শব্দ `applepenapple`, ডিকশনারি `apple pen` — `apple + pen + apple` দিয়ে হয়, `YES`।",
    inputFormat:
      "প্রথম লাইনে শব্দ `s`। দ্বিতীয় লাইনে ডিকশনারির শব্দগুলো স্পেস দিয়ে আলাদা।",
    outputFormat: "সম্ভব হলে `YES`, নাহলে `NO` এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= len(s) <= 1000`\nডিকশনারিতে `1` থেকে `100`টি শব্দ, প্রতিটির দৈর্ঘ্য `1` থেকে `20`।\nসব শব্দ ছোট হাতের ইংরেজি অক্ষরে।",
    editorial:
      "### ধারণা\n\n`dp[i]` হোক `s`-এর প্রথম `i` অক্ষর ডিকশনারি শব্দ দিয়ে ভাঙা যায় কিনা। `dp[0] = True` (খালি অংশ দিয়ে শুরু করা যায়)। `dp[i]` সত্য হবে যদি কোনো `j < i`-এর জন্য `dp[j]` সত্য এবং অংশ `s[j:i]` ডিকশনারিতে থাকে। শেষে `dp[len(s)]`-ই উত্তর। অংশের দৈর্ঘ্য সীমিত (সর্বোচ্চ ২০) হওয়ায় লুপ সেভাবেও সীমিত করা যায়, তবে `n = 1000`-এ পূরো লুপও চলে।\n\n### ধাপে ধাপে\n\n1. শব্দ আর ডিকশনারি পড়ে `set` বানান (দ্রুত খোঁজার জন্য)।\n2. `dp = [False] * (n + 1)`, `dp[0] = True`।\n3. `i = 1` থেকে `n`: `j = 0` থেকে `i - 1` ঘুরে `dp[j]` সত্য এবং `s[j:i]` সেটে থাকলে `dp[i] = True` করে থামুন।\n4. `dp[n]` সত্য হলে `YES`, নাহলে `NO`।\n\n```python\nimport sys\nlines = sys.stdin.read().splitlines()\ns = lines[0]\nwords = set(lines[1].split())\nn = len(s)\ndp = [False] * (n + 1)\ndp[0] = True\nfor i in range(1, n + 1):\n    for j in range(i):\n        if dp[j] and s[j:i] in words:\n            dp[i] = True\n            break\nprint('YES' if dp[n] else 'NO')\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n^2)` (প্রতিটি অংশের খোঁজ `O(1)` গড়ে), স্পেস `O(n)`। `n = 1000`-এ প্রায় ৫ লক্ষ ধাপ।\n\n### সাধারণ ভুল\n\n- ডিকশনারিকে list রাখা: `in` খোঁজ `O(কতবার)` হয়ে যায়; set ব্যবহার করুন।\n- `dp[0] = True` না রাখা: শুরুর অংশটাই ভাঙা যায় না, ফলে প্রায় সব কেসে `NO` আসে।\n- অংশের দিক উল্টো: `s[:j]` বনাম `s[j:i]` — কোনটা ডিকশনারিতে আছে সেটা ঠিক স্লাইস করুন।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Strings", "Word Break"],
    tests: [
      { input: "leetcode\nleet code\n", expectedOutput: "YES\n", isSample: true },
      {
        input: "catsandog\ncats dog sand and cat\n",
        expectedOutput: "NO\n",
        isSample: true,
      },
      { input: "applepenapple\napple pen\n", expectedOutput: "YES\n", isSample: false },
      { input: "a\na\n", expectedOutput: "YES\n", isSample: false },
      { input: "abc\ndef\n", expectedOutput: "NO\n", isSample: false },
      { input: "a".repeat(1000) + "\na\n", expectedOutput: "YES\n", isSample: false },
      { input: "ab".repeat(500) + "\nba\n", expectedOutput: "NO\n", isSample: false },
    ],
    referencePython:
      "import sys\nlines = sys.stdin.read().splitlines()\ns = lines[0]\nwords = set(lines[1].split())\nn = len(s)\ndp = [False] * (n + 1)\ndp[0] = True\nfor i in range(1, n + 1):\n    for j in range(i):\n        if dp[j] and s[j:i] in words:\n            dp[i] = True\n            break\nprint('YES' if dp[n] else 'NO')\n",
  },
];
