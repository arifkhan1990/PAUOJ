import type { SeedProblem } from "../../seed-problems";
import { numbersInput } from "../generated-tests";

export const LCS_LIS_PRACTICE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m5-lcs-lis-e2",
    title: "Longest Palindromic Subsequence",
    statement:
      "ক্লাবের পোশাক প্রতিযোগিতার জন্য নুসরাত একটা স্লোগান বানাচ্ছে। শব্দটা এমন হওয়া চাই যেন ক্রম ঠিক রেখে কিছু অক্ষর বাদ দিয়ে একটা **সামনে-পিছনে একই পড়া যায় এমন** ধারা পাওয়া যায় — অর্থাৎ প্যালিনড্রোম। বাদ দেওয়া অক্ষরগুলো পাশাপাশি থাকতে হবে না; বাকিগুলোর আসার ক্রম বদলানো যাবে না।\n\nস্লোগান `s` থেকে এমন সবচেয়ে লম্বা ধারার দৈর্ঘ্য কত, সেটা বের করো।\n\nউদাহরণ: `bbbab` — বাদ দিয়ে `bbbb` বানানো যায়, উত্তর `4`; `cbbd` — `bb`, উত্তর `2`।",
    inputFormat: "একটি লাইনে ছোট হাতের ইংরেজি অক্ষরের স্ট্রিং `s`।",
    outputFormat: "সবচেয়ে লম্বা প্যালিনড্রোম ধারার দৈর্ঘ্য এক লাইনে প্রিন্ট করো।",
    constraints: "`1 <= len(s) <= 1000`",
    editorial:
      "## ধারণা\n\nপ্যালিনড্রোম মানে এমন ধারা যেটা সামনে পড়লেও পিছন থেকে পড়লেও একই। তাই একটা প্যালিনড্রোম ধারা `s`-এর যে অবস্থানগুলোতে আছে, `s` উল্টো করলে সেই ধারাটা ঠিক উল্টো অবস্থানগুলোতেই আবার পাওয়া যায় — কারণ ধারাটা পিছন দিক থেকে পড়লেও একই। বিপরীত দিকেও হিসাবটা মেলে, তাই দৈর্ঘ্যের হিসাবে `s` আর উল্টো `s`-এর LCS-ই এই প্রশ্নের উত্তর।\n\nশুধু দৈর্ঘ্য চাওয়া হয়েছে, ধারাটা নিজে নয় — আর এই টপিকে তোমার হাতে LCS-এর কোড আগেই আছে। বাকি কাজ শুধু `t = s`-এর উল্টো বানিয়ে LCS চালানো। LCS-এর সাধারণ টেবিলই ব্যবহার করো; স্ট্রিং দুটোর দৈর্ঘ্য সমান হওয়ায় টেবিল বর্গাকার।\n\n## ধাপে ধাপে\n\n1. `s` পড়ে `t = s[::-1]` বানাও।\n2. LCS-এর এক সারির টেবিল `prev` দিয়ে শুরু করো।\n3. `s`-এর প্রতিটি অক্ষরে `cur` বানাও: মিল হলে `cur[j] = prev[j-1] + 1`, নাহলে বড় প্রতিবেশী।\n4. শেষ ঘর প্রিন্ট করো।\n\n```python\nimport sys\ns = sys.stdin.readline().strip()\nt = s[::-1]\nn = len(s)\nprev = [0] * (n + 1)\nfor i in range(1, n + 1):\n    cur = [0] * (n + 1)\n    for j in range(1, n + 1):\n        if s[i - 1] == t[j - 1]:\n            cur[j] = prev[j - 1] + 1\n        else:\n            cur[j] = prev[j] if prev[j] >= cur[j - 1] else cur[j - 1]\n    prev = cur\nprint(prev[n])\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n^2)`, স্পেস `O(n)` — এক সারি ঘুরিয়ে ঘুরিয়ে। `n = 1000`-এ দশ লক্ষ ঘর।\n\n## সাধারণ ভুল\n\n- LCS-এর উত্তরকে সরাসরি প্যালিনড্রোম বলে ধরা: দৈর্ঘ্য ঠিক, কিন্তু LCS-এর অক্ষরগুলো জোড়া দিয়ে সাজালে বাহ্যিকভাবে প্যালিনড্রোম নাও হতে পারে — দৈর্ঘ্যের হিসাবটাই এখানে ভরসা।\n- উল্টো স্ট্রিং বানাতে ভুল: `s[: :-1]` লেখার সময় স্পেস বা ক্রম এলোমেলো হলে টেবিল জন্ম থেকেই ভুল।\n- LCS-এর বদলে সাবস্ট্রিং খোঁজা: বাদ দেওয়া অক্ষর পাশাপাশি থাকতে হবে না — এটা ধারা (subsequence), সাবস্ট্রিং নয়।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Strings", "Palindrome"],
    tests: [
      { input: "bbbab\n", expectedOutput: "4\n", isSample: true },
      { input: "cbbd\n", expectedOutput: "2\n", isSample: true },
      { input: "racecar\n", expectedOutput: "7\n", isSample: false },
      { input: "abcba\n", expectedOutput: "5\n", isSample: false },
      { input: "q\n", expectedOutput: "1\n", isSample: false },
      {
        input: "abcdefghijklmnopqrstuvwxyz\n",
        expectedOutput: "1\n",
        isSample: false,
      },
      { input: "a".repeat(1000) + "\n", expectedOutput: "1000\n", isSample: false },
      {
        input: "ab".repeat(500) + "\n",
        expectedOutput: "999\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ns = sys.stdin.readline().strip()\nt = s[::-1]\nn = len(s)\nprev = [0] * (n + 1)\nfor i in range(1, n + 1):\n    cur = [0] * (n + 1)\n    for j in range(1, n + 1):\n        if s[i - 1] == t[j - 1]:\n            cur[j] = prev[j - 1] + 1\n        else:\n            cur[j] = prev[j] if prev[j] >= cur[j - 1] else cur[j - 1]\n    prev = cur\nprint(prev[n])\n",
  },
  {
    slug: "learn-m5-lcs-lis-e3",
    title: "Maximum Sum Increasing Subsequence",
    statement:
      "রফির সেভিংস ডায়েরিতে পরপর কয়েকটা এন্ট্রি বেছে নিয়ে একটা সুন্দর প্রবণতা বানাতে চায়: এন্ট্রিগুলো ডায়েরির ক্রমে থাকবে, আর প্রতিটি পরের এন্ট্রি আগেরটার চেয়ে **কঠোরভাবে বড়** হবে। মাঝের কিছু এন্ট্রি বাদ দেওয়া যাবে, তবে বাছাই করা এন্ট্রিগুলোর যোগফল যত বড় হয়।\n\n`n`টি এন্ট্রির মধ্যে এমন বাছাইয়ের সর্বোচ্চ যোগফল কত? অন্তত একটা এন্ট্রি নিতেই হবে; যোগফল ঋণাত্মকও হতে পারে।\n\nউদাহরণ: `1 101 2 3 100 4 5` — `1 + 2 + 3 + 100 = 106`-ই সর্বোচ্চ।",
    inputFormat:
      "প্রথম লাইনে এন্ট্রির সংখ্যা `n`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।",
    outputFormat: "সর্বোচ্চ যোগফল এক লাইনে প্রিন্ট করো।",
    constraints: "`1 <= n <= 1000`\n`-10^9 <= a_i <= 10^9`",
    editorial:
      "## ধারণা\n\nLIS-এর ঠিক একই কাঠামো, শুধু গোনা নয় — যোগফল জমাতে হবে। `dp[i]` ধরো `i` নম্বর এন্ট্রি দিয়ে শেষ হওয়া বর্ধমান বাছাইয়ের সর্বোচ্চ যোগফল। আগের যেকোনো `j < i` থেকে এসে `a[j] < a[i]` হলে `dp[i] = max(dp[i], dp[j] + a[i])`। কেউ না মিললে `dp[i] = a[i]` — এন্ট্রিটা একা দাঁড়ায়। উত্তর `dp`-এর সর্বোচ্চ ঘর, কারণ সেরা বাছাই যেকোনো এন্ট্রিতে শেষ হতে পারে।\n\nঋণাত্মক এন্ট্রিতে একটা কথা মনে রাখো: খালি বাছাইয়ের যোগফল `0` নয় — অন্তত একটা এন্ট্রি নিতেই হবে, তাই সব `dp` ঋণাত্মক হলে উত্তরও ঋণাত্মক হবে।\n\n## ধাপে ধাপে\n\n1. `n` আর এন্ট্রিগুলো পড়ো।\n2. `dp = a`-এর কপি দিয়ে শুরু করো — প্রতিটি এন্ট্রি একা বাছাই হিসেবে বৈধ।\n3. `i = 0` থেকে `n - 1`: প্রতিটি `j < i`-এ `a[j] < a[i]` হলে `dp[i] = max(dp[i], dp[j] + a[i])`।\n4. `max(dp)` প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:1 + n]\ndp = a[:]\nfor i in range(n):\n    for j in range(i):\n        if a[j] < a[i] and dp[j] + a[i] > dp[i]:\n            dp[i] = dp[j] + a[i]\nprint(max(dp))\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n^2)`, স্পেস `O(n)` — LIS-এর মতোই। `n = 1000`-এ প্রায় পাঁচ লক্ষ জোড়া।\n\n## সাধারণ ভুল\n\n- `dp` শূন্য দিয়ে শুরু করা: সব এন্ট্রি ঋণাত্মক হলে উত্তর শূন্য দেখায়, অথচ একটা এন্ট্রি নিতেই হবে — শুরু `a[i]` নিজেই।\n- দৈর্ঘ্যের সর্বোচ্চ বাছাইয়ের যোগফল ধরা: লম্বা বাছাই কম যোগফল দিতে পারে; এখানে লক্ষ্য যোগফল, দৈর্ঘ্য নয়।\n- `<=` দিয়ে সমান মান নেওয়া: কঠোরভাবে বড় চাই, সমান এন্ট্রি পাশাপাশি বসলে নিয়ম ভাঙে।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "LIS", "Arrays"],
    tests: [
      {
        input: "7\n1 101 2 3 100 4 5\n",
        expectedOutput: "106\n",
        isSample: true,
      },
      { input: "4\n10 5 4 3\n", expectedOutput: "10\n", isSample: true },
      { input: "3\n-5 -2 -9\n", expectedOutput: "-2\n", isSample: false },
      { input: "1\n-7\n", expectedOutput: "-7\n", isSample: false },
      {
        input: numbersInput(
          Array.from({ length: 1000 }, (_, i) => 999999000 + i),
        ),
        expectedOutput: "999999499500\n",
        isSample: false,
      },
      {
        input: numbersInput(
          Array.from({ length: 1000 }, (_, i) => 1000 - i),
        ),
        expectedOutput: "1000\n",
        isSample: false,
      },
      {
        input: numbersInput(Array.from({ length: 1000 }, (_, i) => i + 1)),
        expectedOutput: "500500\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:1 + n]\ndp = a[:]\nfor i in range(n):\n    for j in range(i):\n        if a[j] < a[i] and dp[j] + a[i] > dp[i]:\n            dp[i] = dp[j] + a[i]\nprint(max(dp))\n",
  },
  {
    slug: "learn-m5-lcs-lis-m2",
    title: "Count the LIS",
    statement:
      "সাদিয়ার রানিং ডায়েরিতে `n` দিনের দূরত্ব লেখা। এখন সে জানতে চায় দীর্ঘতম কঠোরভাবে বর্ধমান ধারা (LIS) কত দিনের — আর সেই দৈর্ঘ্যের আলাদা আলাদা ধারা মোট কয়টা বানানো যায়।\n\nদুইটা ধারা আলাদা বলা হবে যদি তাদের ব্যবহৃত দিনের সেট আলাদা হয়।\n\nফল বড় হতে পারে, তাই সংখ্যাটা `1000000007` দিয়ে ভাগের ভাগশেষ প্রিন্ট করো।\n\nউদাহরণ: `1 3 5 4 7` — LIS দৈর্ঘ্য `4`; `1 3 5 7` আর `1 3 4 7` — দুইটা, উত্তর `2`।",
    inputFormat:
      "প্রথম লাইনে দিনের সংখ্যা `n`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।",
    outputFormat:
      "LIS-এর সংখ্যার `1000000007` ভাগশেষ এক লাইনে প্রিন্ট করো।",
    constraints: "`1 <= n <= 1000`\n`-10^9 <= a_i <= 10^9`",
    editorial:
      "## ধারণা\n\nদুইটা জিনিস একসাথে জমাও। `ln[i]` ধরো `i`-এ শেষ হওয়া LIS-এর দৈর্ঘ্য, আর `cnt[i]` সেই দৈর্ঘ্যের কয়টা আলাদা ধারা `i`-এ শেষ হয়। প্রতিটি `j < i`-এ `a[j] < a[i]` হলে:\n\n- `ln[j] + 1 > ln[i]` হলে `i`-এ নতুন সেরা দৈর্ঘ্য পেলাম — `ln[i]` বাড়ে, আর `cnt[i] = cnt[j]` (আগের সব ধারা এক ধাপ বাড়িয়ে এখানে শেষ হয়)।\n- `ln[j] + 1 == ln[i]` হলে নতুন রাস্তা পেলাম একই দৈর্ঘ্যে — `cnt[i] += cnt[j]`।\n\nপ্রতিটি ঘরে শুরু `ln[i] = 1`, `cnt[i] = 1` (এন্ট্রিটা একা একটা ধারা)। উত্তর: সব `ln`-এর সর্বোচ্চ দৈর্ঘ্যে শেষ হওয়া সব ঘরের `cnt` যোগফল।\n\n## ধাপে ধাপে\n\n1. `n` আর অ্যারে পড়ো।\n2. `ln`, `cnt` অ্যারে `1` দিয়ে শুরু করো।\n3. প্রতিটি `i`-এ সব `j < i` ঘুরে ওপরের দুই নিয়ম চালাও; যোগের পর প্রতিবার মডুলাস নাও।\n4. `best = max(ln)`; `best` দৈর্ঘ্যের সব ঘরের `cnt` যোগ করে মডুলাস নিয়ে প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:1 + n]\nM = 1000000007\nln = [1] * n\ncnt = [1] * n\nfor i in range(n):\n    for j in range(i):\n        if a[j] < a[i]:\n            if ln[j] + 1 > ln[i]:\n                ln[i] = ln[j] + 1\n                cnt[i] = cnt[j]\n            elif ln[j] + 1 == ln[i]:\n                cnt[i] = (cnt[i] + cnt[j]) % M\nbest = max(ln)\ntotal = 0\nfor i in range(n):\n    if ln[i] == best:\n        total = (total + cnt[i]) % M\nprint(total)\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n^2)`, স্পেস `O(n)` — LIS-এর কাজের সাথে কাউন্ট বই রাখা মাত্র।\n\n## সাধারণ ভুল\n\n- নতুন সেরা দৈর্ঘ্য পেলে যোগ করে ফেলা: `>` হলে আগের `cnt[i]` বাতিল — নতুন দৈর্ঘ্যের গণনাই এখন সঠিক মান।\n- শেষ ধাপে শুধু এক ঘরের `cnt` নেওয়া: সর্বোচ্চ দৈর্ঘ্যের ধারা যেকোনো কয়েকটি ঘরে শেষ হতে পারে — সবার `cnt` যোগ করো।\n- মডুলাস শেষে একবার দেওয়া: ধাপে ধাপে যোগ হতে হতে সংখ্যা অসীমের দিকে যায়; প্রতি যোগেই ভাগশেষ নাও।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "LIS", "Counting"],
    tests: [
      {
        input: "5\n1 3 5 4 7\n",
        expectedOutput: "2\n",
        isSample: true,
      },
      { input: "4\n2 2 2 2\n", expectedOutput: "4\n", isSample: true },
      { input: "1\n9\n", expectedOutput: "1\n", isSample: false },
      {
        input: numbersInput(Array.from({ length: 1000 }, (_, i) => i + 1)),
        expectedOutput: "1\n",
        isSample: false,
      },
      {
        input: numbersInput(
          Array.from({ length: 1000 }, (_, i) => 1000 - i),
        ),
        expectedOutput: "1000\n",
        isSample: false,
      },
      {
        input: numbersInput(Array.from({ length: 1000 }, () => 5)),
        expectedOutput: "1000\n",
        isSample: false,
      },
      {
        input: numbersInput(Array.from({ length: 500 }, () => [1, 2]).flat()),
        expectedOutput: "125250\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:1 + n]\nM = 1000000007\nln = [1] * n\ncnt = [1] * n\nfor i in range(n):\n    for j in range(i):\n        if a[j] < a[i]:\n            if ln[j] + 1 > ln[i]:\n                ln[i] = ln[j] + 1\n                cnt[i] = cnt[j]\n            elif ln[j] + 1 == ln[i]:\n                cnt[i] = (cnt[i] + cnt[j]) % M\nbest = max(ln)\ntotal = 0\nfor i in range(n):\n    if ln[i] == best:\n        total = (total + cnt[i]) % M\nprint(total)\n",
  },
  {
    slug: "learn-m5-lcs-lis-m3",
    title: "Nesting Gift Boxes",
    statement:
      "উৎসবের গিফট-বক্স গুদামে তানভির `n`টা বক্স পেল। প্রতিটি বক্সের ওজন আর বেড দুইটা মাপ দেওয়া — বক্স `A` বক্স `B`-এর **ভেতরে** ঢোকানো যাবে যদি `A`-এর দুই মাপই `B`-এর চেয়ে কঠোরভাবে ছোট হয়। একই মাপের দুই বক্স একটার ভেতরে আরেকটা যাবে না।\n\nবক্সগুলো একটার ভেতরে আরেকটা বসিয়ে সবচেয়ে লম্বা ধারা বানাতে হবে। সর্বোচ্চ কয়টা বক্স নেস্ট করা যায়?\n\nউদাহরণ: `(5,4), (6,4), (6,7), (2,3)` — `(2,3) ⊂ (5,4) ⊂ (6,7)`, উত্তর `3`।",
    inputFormat:
      "প্রথম লাইনে বক্সের সংখ্যা `n`। পরের `n` লাইনে প্রতিটিতে দুটি পূর্ণসংখ্যা — বক্সের দুই মাপ `x` আর `y`।",
    outputFormat: "সবচেয়ে লম্বা নেস্টিংয়ের বক্স সংখ্যা এক লাইনে প্রিন্ট করো।",
    constraints:
      "`1 <= n <= 2000`\n`1 <= x_i, y_i <= 10^6`",
    editorial:
      "## ধারণা\n\nদুই মাপ মিলিয়ে বাছতে হলে একটা মাপ দিয়ে ক্রম ঠিক করে অন্যটাকে সাজানো রাখা যায়। বক্সগুলোকে প্রথম মাপের ঊর্ধ্বক্রমে সাজাও — কিন্তু প্রথম মাপ সমান হলে দ্বিতীয় মাপ **অবরোহ** ক্রমে। এবার সাজানো তালিকায় শুধু দ্বিতীয় মাপের ওপর কঠোরভাবে বর্ধমান LIS খোঁজো।\n\nঅবরোহ ট্রিকটা কেন? প্রথম মাপ সমান দুই বক্স কখনোই একটার ভেতরে আরেকটা যেতে পারে না। সমান গ্রুপের ভেতরে দ্বিতীয় মাপ অবরোহ সাজালে সেই গ্রুপের ভেতরে কোনো কঠোরভাবে বর্ধমান জোড়াই থাকে না — অর্থাৎ LIS ভুল করে সমান-প্রথম-মাপের বক্স জুড়ে ফেলার সুযোগ পায় না। আর প্রথম মাপ কঠোরভাবে ছোট হলে LIS-এর স্বাভাবিক নিয়মই দ্বিতীয় মাপ কঠোরভাবে ছোট হওয়া চেক করে — দুই শর্ত একসাথে মেটে।\n\n## ধাপে ধাপে\n\n1. `n` আর বক্সগুলো পড়ো।\n2. `(x, -y)` ক্রমে সাজাও — অর্থাৎ `x` ঊর্ধ্বক্রম, সমান `x`-এ `y` অবরোহ।\n3. দ্বিতীয় মাপ `y`-এর ওপর LIS চালাও: `dp[i] = 1 + max(dp[j])` যেসব `j < i`-তে `y[j] < y[i]`।\n4. `max(dp)` প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nboxes = []\nidx = 1\nfor _ in range(n):\n    boxes.append((data[idx], data[idx + 1]))\n    idx += 2\nboxes.sort(key=lambda p: (p[0], -p[1]))\ndp = [1] * n\nbest = 1\nfor i in range(n):\n    for j in range(i):\n        if boxes[j][0] < boxes[i][0] and boxes[j][1] < boxes[i][1] and dp[j] + 1 > dp[i]:\n            dp[i] = dp[j] + 1\n    if dp[i] > best:\n        best = dp[i]\nprint(best)\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n^2)` (সাজানো অংশ `O(n log n)`), স্পেস `O(n)`। `n = 2000`-এ প্রায় চল্লিশ লক্ষ জোড়া — Python-এ কয়েক সেকেন্ডের মধ্যে চলে।\n\n## সাধারণ ভুল\n\n- দুই মাপকে আলাদা করে বাছা: শুধু `y`-এর LIS নিলে `x` সম্মান না-করা বক্সও জুড়ে যায় — সাজানোর পরেও `x`-এর কঠোর শর্তটা ধরে রাখা নিরাপদ।\n- সমান `x`-এ `y` ঊর্ধ্বক্রম সাজানো: তখন সমান `x`-এর ভেতরেই `y` বাড়তে থাকে, LIS এমন দুই বক্স জুড়ে ফেলে যারা আসলে একটার ভেতরে যায় না।\n- `<=` ব্যবহার করা: দুই মাপই কঠোরভাবে ছোট হতে হবে; সমান মাপ নেস্টিং নয়।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "LIS", "Sorting"],
    tests: [
      {
        input: "4\n5 4\n6 4\n6 7\n2 3\n",
        expectedOutput: "3\n",
        isSample: true,
      },
      { input: "1\n3 8\n", expectedOutput: "1\n", isSample: true },
      {
        input: "5\n4 4\n4 4\n4 4\n4 4\n4 4\n",
        expectedOutput: "1\n",
        isSample: false,
      },
      {
        input:
          "2000\n" +
          Array.from({ length: 2000 }, (_, i) => `${i + 1} ${i + 1}`).join("\n") +
          "\n",
        expectedOutput: "2000\n",
        isSample: false,
      },
      {
        input:
          "2000\n" +
          Array.from({ length: 1000 }, (_, i) => `${i + 1} 1\n${i + 1} 2`).join("\n") +
          "\n",
        expectedOutput: "2\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nboxes = []\nidx = 1\nfor _ in range(n):\n    boxes.append((data[idx], data[idx + 1]))\n    idx += 2\nboxes.sort(key=lambda p: (p[0], -p[1]))\ndp = [1] * n\nbest = 1\nfor i in range(n):\n    for j in range(i):\n        if boxes[j][0] < boxes[i][0] and boxes[j][1] < boxes[i][1] and dp[j] + 1 > dp[i]:\n            dp[i] = dp[j] + 1\n    if dp[i] > best:\n        best = dp[i]\nprint(best)\n",
  },
  {
    slug: "learn-m5-lcs-lis-h2",
    title: "Longest Common Increasing Subsequence",
    statement:
      "রফি আর নুসরাত দুই দলের প্রশিক্ষণ-তালিকা মিলিয়ে দেখছে। রফির তালিকায় `n`টা সংখ্যা, নুসরাতের তালিকায় `m`টা। এখন দরকার এমন একটা ধারা যেটা **দুই তালিকাতেই** ক্রম-মেনে আছে (subsequence), আর ধারাটা কঠোরভাবে বর্ধমান।\n\nসবচেয়ে লম্বা এমন ধারার দৈর্ঘ্য কত, সেটা বের করো। না পেলে উত্তর `0`।\n\nউদাহরণ: রফির তালিকা `3 1 2 4 5`, নুসরাতের `2 3 1 4` — `3, 4` দুই তালিকাতেই আছে আর বর্ধমান, উত্তর `2`।",
    inputFormat:
      "প্রথম লাইনে `n` আর `m`। দ্বিতীয় লাইনে রফির তালিকার `n`টি সংখ্যা। তৃতীয় লাইনে নুসরাতের তালিকার `m`টি সংখ্যা।",
    outputFormat: "সবচেয়ে লম্বা ধারার দৈর্ঘ্য এক লাইনে প্রিন্ট করো।",
    constraints:
      "`1 <= n, m <= 500`\n`-10^9 <= a_i, b_i <= 10^9`",
    editorial:
      "## ধারণা\n\nশুধু LCS হলে মান মিললেই আগ বাড়ানো যায়; শুধু LIS হলে ক্রম মিললেই যায়। দুইটা একসাথে চাই, তাই state দুই ইনডেক্স নেয়: `dp[i][j]` ধরো রফির তালিকার প্রথম `i`টা আর নুসরাতের প্রথম `j`টা ব্যবহার করে বানানো সবচেয়ে লম্বা কমন বর্ধমান ধারা — যেটা নুসরাতের `j` নম্বর সংখ্যাটায় শেষ হয়।\n\n`a[i] == b[j]` হলে এখানেই ধারা শেষ করা যায়: তার আগের সেরা হলো `a[i]`-এর চেয়ে ছোট কোনো মানে শেষ হওয়া সবচেয়ে লম্বা ধারা, তার লেজে `a[i]` বসে। প্রতিটা `i`-এ একটা চলমান `best` রাখো — নুসরাতের তালিকা ঘুরতে ঘুরতে `b[j] < a[i]` হলে `best = max(best, dp[j])`; মিল পেলে `ndp[j] = best + 1`। মিল না হলে আগের সারির মানই বহাল: `ndp[j] = dp[j]`। এভাবে প্রতি `i`-তে `m`টা ঘর ঘুরেই কাজ হয়ে যায় — ভেতরে আলাদা লুপ লাগে না, তাই মোট `O(n * m)`।\n\n## ধাপে ধাপে\n\n1. দুই তালিকা পড়ো।\n2. `dp = [0] * (m + 1)` দিয়ে শুরু করো।\n3. রফির প্রতিটি মান `x`-এ: নতুন সারি `ndp` আর `best = 0` নাও।\n4. `j = 1 ... m`: `b[j] == x` হলে `ndp[j] = best + 1`, নাহলে `ndp[j] = dp[j]`; তারপর `b[j] < x` হলে `best = max(best, dp[j])`।\n5. শেষে সব সারির সর্বোচ্চ মান প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn, m = data[0], data[1]\na = data[2:2 + n]\nb = data[2 + n:2 + n + m]\ndp = [0] * (m + 1)\nanswer = 0\nfor i in range(1, n + 1):\n    x = a[i - 1]\n    ndp = [0] * (m + 1)\n    best = 0\n    for j in range(1, m + 1):\n        if b[j - 1] == x:\n            ndp[j] = best + 1\n        else:\n            ndp[j] = dp[j]\n        if b[j - 1] < x and dp[j] > best:\n            best = dp[j]\n        if ndp[j] > answer:\n            answer = ndp[j]\n    dp = ndp\nprint(answer)\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n * m)`, স্পেস `O(m)` — প্রতি সারিতে একবারই নুসরাতের তালিকা ঘোরা হয়। `n = m = 500`-এ আড়াই লক্ষ ঘর।\n\n## সাধারণ ভুল\n\n- LCS-এর টেবিল হুবহু চালানো: মান মিললে `+1` দিলে ক্রম-মেনে-বর্ধমান শর্ত হারিয়ে যায় — `best` পয়েন্টারটাই ছোট-মানের সীমা ধরে রাখে।\n- `best` আপডেটের ক্রম উল্টো করা: মিলের ঘর বসানোর পরে `b[j] < x` দেখতে হবে, নাহলে একই `j` নিজের আগের অবস্থায় গুনে ঢুকে পড়ে।\n- মিল না হলে `0` বসানো: মিল না হলে আগের সারির `dp[j]`-ই বহাল রাখতে হবে, নাহলে পরের মানগুলোর হিসাব ভাঙে।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "LIS", "LCS"],
    tests: [
      {
        input: "5 4\n3 1 2 4 5\n2 3 1 4\n",
        expectedOutput: "2\n",
        isSample: true,
      },
      {
        input: "4 4\n1 2 4 5\n2 4 5 3\n",
        expectedOutput: "3\n",
        isSample: true,
      },
      { input: "3 3\n1 1 1\n1 1 1\n", expectedOutput: "1\n", isSample: false },
      { input: "3 3\n1 2 3\n4 5 6\n", expectedOutput: "0\n", isSample: false },
      {
        input:
          "500 500\n" +
          Array.from({ length: 500 }, (_, i) => i + 1).join(" ") +
          "\n" +
          Array.from({ length: 500 }, (_, i) => i + 1).join(" ") +
          "\n",
        expectedOutput: "500\n",
        isSample: false,
      },
      {
        input:
          "500 500\n" +
          Array.from({ length: 500 }, (_, i) => 500 - i).join(" ") +
          "\n" +
          Array.from({ length: 500 }, (_, i) => i + 1).join(" ") +
          "\n",
        expectedOutput: "1\n",
        isSample: false,
      },
      {
        input:
          "500 500\n" +
          Array.from({ length: 500 }, (_, i) => (i % 7) + 1).join(" ") +
          "\n" +
          Array.from({ length: 500 }, (_, i) => ((i * 3) % 7) + 1).join(" ") +
          "\n",
        expectedOutput: "7\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, m = data[0], data[1]\na = data[2:2 + n]\nb = data[2 + n:2 + n + m]\ndp = [0] * (m + 1)\nanswer = 0\nfor i in range(1, n + 1):\n    x = a[i - 1]\n    ndp = [0] * (m + 1)\n    best = 0\n    for j in range(1, m + 1):\n        if b[j - 1] == x:\n            ndp[j] = best + 1\n        else:\n            ndp[j] = dp[j]\n        if b[j - 1] < x and dp[j] > best:\n            best = dp[j]\n        if ndp[j] > answer:\n            answer = ndp[j]\n    dp = ndp\nprint(answer)\n",
  },
];
