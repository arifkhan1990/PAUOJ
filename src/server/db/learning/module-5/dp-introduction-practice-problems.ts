import type { SeedProblem } from "../../seed-problems";

export const DP_INTRODUCTION_PRACTICE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m5-dp-introduction-e2",
    title: "Lantern Signal Patterns",
    statement:
      "ফেস্টিভালের মঞ্চের সামনে তানভির `n`টা লণ্ঠন সাজাল। প্রতিটি লণ্ঠন হয় জ্বলবে নয় বন্ধ থাকবে — জ্বলা মানে `1`, বন্ধ মানে `0`। বিদ্যুৎ বিভাগের নিয়ম একটাই: পাশাপাশি দুটো লণ্ঠন একসাথে জ্বলতে পারবে না, কারণ তাতে লোড বেড়ে যায়।\n\n`n`টা লণ্ঠনের এমন কয়টা ভিন্ন সাজানোর প্যাটার্ন সম্ভব, সেটা বের করো।\n\nউদাহরণ: `n = 3` হলে বৈধ প্যাটার্ন `000, 001, 010, 100, 101` — মোট `5`টা।",
    inputFormat: "একটি লাইনে একটি পূর্ণসংখ্যা `n`।",
    outputFormat: "বৈধ প্যাটার্নের সংখ্যা এক লাইনে প্রিন্ট করো।",
    constraints: "`1 <= n <= 90`",
    editorial:
      "## ধারণা\n\nপ্যাটার্ন বানানোর সময় শেষ লণ্ঠনটাই আসল খবরটা রাখে: সে জ্বলছে না বন্ধ? `a` ধরো এমন বৈধ প্যাটার্নের সংখ্যা যাদের শেষ লণ্ঠন বন্ধ, `b` যাদের শেষ লণ্ঠন জ্বলছে। শেষে `0` বসালে আগের যেকোনো প্যাটার্নের ওপর চলে, তাই নতুন `a` = আগের `a + b`; শেষে `1` বসাতে হলে আগের লণ্ঠন অবশ্যই বন্ধ থাকতে হবে, তাই নতুন `b` = আগের `a`। এই হিসাব প্রতি ধাপে একই আসে — একবার করে মনে রেখে সামনে এগোও, এটাই state আর transition-এর খেলা।\n\n## ধাপে ধাপে\n\n1. ইনপুট `n` নাও।\n2. `a = 1`, `b = 0` দিয়ে শুরু করো — শূন্য লণ্ঠনে খালি প্যাটার্ন একটাই, সেটা বন্ধ-শেষ গণ্য।\n3. `n` বার লুপ চালাও: `a, b = a + b, a`।\n4. শেষে `a + b` প্রিন্ট করো।\n\n```python\nimport sys\nn = int(sys.stdin.readline())\na, b = 1, 0\nfor _ in range(n):\n    a, b = a + b, a\nprint(a + b)\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(1)` — পুরো টেবিল না রেখে দুইটা ভ্যারিয়েবলই যথেষ্ট। `n = 90`-এ উত্তর প্রায় `7.5 * 10^18`, যা 64-বিট পূর্ণসংখ্যার মধ্যে থাকে।\n\n## সাধারণ ভুল\n\n- শেষে শুধু `a` প্রিন্ট করা: `a` শুধু বন্ধ-শেষ প্যাটার্ন গোনে, `b`-ও যোগ করতে হবে।\n- এক ঘরের যোগফল ধরে ফিবোনাচির মতো ভেবে শুরু মান `0, 1` বসানো: এখানে state দুইটা, শুরু `1, 0` — খালি প্যাটার্নের হিসাবটা না রাখলে সব ঘর কমে যায়।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "1D DP", "Counting"],
    tests: [
      { input: "3\n", expectedOutput: "5\n", isSample: true },
      { input: "5\n", expectedOutput: "13\n", isSample: true },
      { input: "1\n", expectedOutput: "2\n", isSample: false },
      { input: "2\n", expectedOutput: "3\n", isSample: false },
      { input: "10\n", expectedOutput: "144\n", isSample: false },
      { input: "45\n", expectedOutput: "2971215073\n", isSample: false },
      {
        input: "90\n",
        expectedOutput: "7540113804746346429\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\na, b = 1, 0\nfor _ in range(n):\n    a, b = a + b, a\nprint(a + b)\n",
  },
  {
    slug: "learn-m5-dp-introduction-e3",
    title: "Magic Number Machine",
    statement:
      "পুরনো গেম মেশিনের পর্দায় নুসরাত একটা সংখ্যা দেখল। মেশিনে তিনটা বাটন: প্রথমটা চাপলে সংখ্যা `1` কমে, দ্বিতীয়টা সংখ্যাকে `2` দিয়ে ভাগ করে (শুধু সংখ্যা জোড় হলে চলে), তৃতীয়টা `3` দিয়ে ভাগ করে (শুধু `3` দিয়ে বিভাজ্য হলে চলে)। খেলা শেষ করতে হবে সংখ্যাটাকে ঠিক `1` এনে।\n\nসবচেয়ে কম কয়বার বাটন চাপলে কাজ হবে, সেটা বের করো। শুরুতেই যদি `1` থাকে, কোনো বাটনই লাগবে না।\n\nউদাহরণ: `n = 10` হলে `10 → 9 → 3 → 1` — মাত্র `3`টা বাটন। লোভ করে আগে ভাগ করে `10 → 5 → 4 → 2 → 1` গেলে `4`টা লাগত, যেটা সর্বনিম্ন নয়।",
    inputFormat: "একটি লাইনে একটি পূর্ণসংখ্যা `n`।",
    outputFormat: "সর্বনিম্ন বাটনের সংখ্যা এক লাইনে প্রিন্ট করো।",
    constraints: "`1 <= n <= 1000000`",
    editorial:
      "## ধারণা\n\n`dp[i]` হোক `i` থেকে `1` এ পৌঁছানোর সর্বনিম্ন বাটন সংখ্যা। `i` থেকে তিনটা রাস্তা: `i-1` এ যাওয়া, জোড় হলে `i/2`, বিভাজ্য হলে `i/3` — তিনটার সেরাটা নিয়ে এক যোগ করো:\n\n`dp[i] = min(dp[i-1] + 1, dp[i/2] + 1 যদি জোড়, dp[i/3] + 1 যদি বিভাজ্য)`\n\nমনে রাখো, ভাগ সবসময় ভালো নয় — `n = 10`-এ `10 → 5` গেলে পরে আরও চাপ লাগে, কিন্তু `10 → 9 → 3 → 1`-এ মাত্র তিনটা। তাই স্থানীয় লোভ (greedy) নয়, প্রতিটি `i`-এর সেরা উত্তর আলাদা করে জমিয়ে রাখাই নিরাপদ। `i` ছোট থেকে বড় ক্রমে ভরলে `dp[i-1]`, `dp[i/2]`, `dp[i/3]` সবই আগেই তৈরি থাকে।\n\n## ধাপে ধাপে\n\n1. ইনপুট `n` নাও।\n2. `dp` অ্যারে `n + 1` আকারে বানাও, `dp[1] = 0`।\n3. `i = 2` থেকে `n`: `best = dp[i-1] + 1` থেকে শুরু করে ভাগের শর্ত মিললে ছোট মান নাও।\n4. `dp[n]` প্রিন্ট করো।\n\n```python\nimport sys\nn = int(sys.stdin.readline())\ndp = [0] * (n + 1)\nfor i in range(2, n + 1):\n    best = dp[i - 1] + 1\n    if i % 2 == 0 and dp[i // 2] + 1 < best:\n        best = dp[i // 2] + 1\n    if i % 3 == 0 and dp[i // 3] + 1 < best:\n        best = dp[i // 3] + 1\n    dp[i] = best\nprint(dp[n])\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(n)`। `n = 10^6`-এও লক্ষ ধাপের বেশি নয়।\n\n## সাধারণ ভুল\n\n- ভাগ করতে পারলেই ভাগ করা: `10`-এর কেস দেখো — লোভী চাল এখানে হেরে যায়।\n- `dp[1]` ভুলে `1` রাখা: শুরুতেই `1` হলে বাটন লাগে না, মান `0`।\n- ভাগের আগে শর্ত না দেখা: বিজোড় সংখ্যাকে `2` দিয়ে ভাগ করলে ভগ্নাংশ এসে পুরো টেবিল ভেঙে পড়ে।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "1D DP", "Minimum"],
    tests: [
      { input: "10\n", expectedOutput: "3\n", isSample: true },
      { input: "27\n", expectedOutput: "3\n", isSample: true },
      { input: "1\n", expectedOutput: "0\n", isSample: false },
      { input: "2\n", expectedOutput: "1\n", isSample: false },
      { input: "3\n", expectedOutput: "1\n", isSample: false },
      { input: "1000000\n", expectedOutput: "19\n", isSample: false },
      { input: "999983\n", expectedOutput: "21\n", isSample: false },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\ndp = [0] * (n + 1)\nfor i in range(2, n + 1):\n    best = dp[i - 1] + 1\n    if i % 2 == 0 and dp[i // 2] + 1 < best:\n        best = dp[i // 2] + 1\n    if i % 3 == 0 and dp[i // 3] + 1 < best:\n        best = dp[i // 3] + 1\n    dp[i] = best\nprint(dp[n])\n",
  },
  {
    slug: "learn-m5-dp-introduction-m2",
    title: "Minimum Square Pieces",
    statement:
      "সাদিয়া একটা সাদা বোর্ডের ওপর রঙিন কাগজ বসাচ্ছে। বোর্ডের মোট ক্ষেত্রফল `n` বর্গ একক, আর প্রতিটি কাগজের ক্ষেত্রফল অবশ্যই একটা perfect square হবে — মানে `1, 4, 9, 16, ...`-এর মতো কোনো পূর্ণসংখ্যার বর্গ। কাগজ একটার ওপর আরেকটা রাখা যাবে না, আর কাগজ ভাঙা যাবে না।\n\nপুরো `n` ক্ষেত্রফল ঢেকে ফেলতে সর্বনিম্ন কয়টা কাগজ লাগবে, সেটা বের করো।\n\nউদাহরণ: `n = 12` হলে তিনটা `4`-ক্ষেত্রফলের কাগজ চলে, উত্তর `3`; `n = 13` হলে `4 + 9` — দুইটাতেই হয়, উত্তর `2`।",
    inputFormat: "একটি লাইনে একটি পূর্ণসংখ্যা `n`।",
    outputFormat: "সর্বনিম্ন কাগজের সংখ্যা এক লাইনে প্রিন্ট করো।",
    constraints: "`1 <= n <= 10000`",
    editorial:
      "## ধারণা\n\n`dp[i]` হোক ক্ষেত্রফল `i` ঢাকতে লাগা সর্বনিম্ন কাগজ। শেষ কাগজটার ক্ষেত্রফল `j * j` হলে বাকি `i - j*j` ক্ষেত্রফল ঢাকতে লাগবে `dp[i - j*j]`টা — তাই `dp[i] = min(dp[i - j*j] + 1)` সব `j`-এর জন্য যেখানে `j * j <= i`। Base: `dp[0] = 0` — খালি বোর্ডে কাগজই লাগে না। `i` ছোট থেকে ভরলে `i - j*j < i` সবসময় আগেই তৈরি থাকে। লক্ষ করো, লোভ করে সবসময় বড় বর্গ নেওয়া ঠিক নয় — যেমন `n = 12`-তে নয়ের বর্গ নিলে বাকি `3` এককে তিনটা কাগজ লাগে, মোট `4`টা; তিনটা `4` দিলে মোট `3`টাই যথেষ্ট।\n\n## ধাপে ধাপে\n\n1. ইনপুট `n` নাও।\n2. `dp = [0] * (n + 1)` বানাও।\n3. `i = 1` থেকে `n`: শুরুতে `best = i` (সব `1`-ক্ষেত্রফলের কাগজ), তারপর প্রতিটা `j * j <= i`-এর জন্য `dp[i - j*j] + 1` থেকে ছোটটা নাও।\n4. `dp[n]` প্রিন্ট করো।\n\n```python\nimport sys\nn = int(sys.stdin.readline())\ndp = [0] * (n + 1)\nfor i in range(1, n + 1):\n    best = i\n    j = 1\n    while j * j <= i:\n        if dp[i - j * j] + 1 < best:\n            best = dp[i - j * j] + 1\n        j += 1\n    dp[i] = best\nprint(dp[n])\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n * sqrt(n))` — প্রতিটি `i`-তে জড়িত `sqrt(i)`টা বর্গ ঘুরা হয়। `n = 10^4`-এ প্রায় `10^6` ধাপ। স্পেস `O(n)`।\n\n## সাধারণ ভুল\n\n- বড় বর্গ আগে নেওয়ার লোভ: `n = 12`-এ `9` নিলে উত্তর `4` আসে, সঠিক `3` — সব বিকল্প মিলিয়ে নিতে হবে।\n- `dp[0] = 0` না রাখা: `i` নিজেই একটা বর্গ হলেও ঘর থেকে ধার নেওয়ার জায়গা থাকতে হবে।\n- `j * j <= i`-এর বদলে `j <= i` লুপ চালানো: ঋণাত্মক ইনডেক্সে যাওয়ার ঝুঁকি আর অযথা কাজ — শর্তটা বর্গের ওপর রাখো।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "1D DP", "Minimum"],
    tests: [
      { input: "12\n", expectedOutput: "3\n", isSample: true },
      { input: "13\n", expectedOutput: "2\n", isSample: true },
      { input: "1\n", expectedOutput: "1\n", isSample: false },
      { input: "2\n", expectedOutput: "2\n", isSample: false },
      { input: "3\n", expectedOutput: "3\n", isSample: false },
      { input: "7\n", expectedOutput: "4\n", isSample: false },
      { input: "43\n", expectedOutput: "3\n", isSample: false },
      { input: "10000\n", expectedOutput: "1\n", isSample: false },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\ndp = [0] * (n + 1)\nfor i in range(1, n + 1):\n    best = i\n    j = 1\n    while j * j <= i:\n        if dp[i - j * j] + 1 < best:\n            best = dp[i - j * j] + 1\n        j += 1\n    dp[i] = best\nprint(dp[n])\n",
  },
  {
    slug: "learn-m5-dp-introduction-m3",
    title: "Ticket Resale with Fee",
    statement:
      "ফেস্টিভালের টিকিট রিসেলের ব্যবসায় নেমেছে নুসরাত। বাজারে টিকিটের দাম দিনভেদে `p_1, p_2, ..., p_n`; `i`-তম দিনে দাম `p_i`। নিয়ম তিনটা:\n\n- একসাথে একটার বেশি টিকিট রাখা যাবে না — নতুন কিনতে হলে হাতের টিকিট আগে বেচতে হবে।\n- প্রতিটা কেনা-বেচার জোড়ায় (একটা লেনদেন) ফি হিসেবে `f` টাকা কাটে।\n- যেকোনো দিনে কিছু না করে বসে থাকাও যায়।\n\nদিনগুলো দেখে সর্বোচ্চ কত লাভ করা সম্ভব, সেটা বের করো। কোনো লেনদেনই না করলে লাভ `0`।\n\nউদাহরণ: দাম `1 3 2 8 5 9`, ফি `3` — প্রথম দিনে `1` টাকায় কিনে চতুর্থ দিনে `8` টাকায় বেচলে লাভ `8 - 1 - 3 = 4`, তারপর পঞ্চম দিনে `5` টাকায় কিনে শেষ দিনে `9` টাকায় বেচলে `1` — মোট `5`।",
    inputFormat:
      "প্রথম লাইনে দিনের সংখ্যা `n` আর ফি `f`। দ্বিতীয় লাইনে `n`টি দাম, স্পেস দিয়ে আলাদা।",
    outputFormat: "সর্বোচ্চ লাভ এক লাইনে প্রিন্ট করো।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= p_i <= 10^9`\n`0 <= f <= 10^9`",
    editorial:
      "## ধারণা\n\nযেকোনো দিনে তোমার দুইটা অবস্থা: হাতে টিকিট আছে, নয় হাতে নেই। তাই state দুইটা — `hold` হোক হাতে টিকিট থাকা অবস্থায় সর্বোচ্চ লাভ, `free` হাতে না-থাকা অবস্থায় সর্বোচ্চ লাভ। দাম `x` এলে:\n\n- কেনার চাল: আগের `free` থেকে `x` খরচ করে হাতে টিকিট নাও → `hold = max(hold, free - x)`\n- বেচার চাল: আজকের `hold` থেকে `x` দামে বেচে ফি কাটো → `free = max(free, hold + x - f)`\n\nদুই অবস্থা পাশাপাশি চলে, প্রতিটা দিনে দুইটাই আপডেট হয়। শুরুতে `free = 0` (কিছু না করা) আর `hold` অসম্ভব মান — প্রথম দিনেই বেচা যাবে না। শেষ দিনে হাতে টিকিট রেখে লাভ হয় না, তাই উত্তর `free`।\n\n## ধাপে ধাপে\n\n1. `n`, `f` আর দামগুলো পড়ো।\n2. `free = 0`, `hold = -বিশাল মান` দিয়ে শুরু করো।\n3. প্রতিটা দাম `x`-এর জন্য: আগে `hold = max(hold, free - x)`, তারপর `free = max(free, hold + x - f)`।\n4. শেষে `free` প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn, f = data[0], data[1]\np = data[2:2 + n]\nhold = -(1 << 62)\nfree = 0\nfor x in p:\n    if free - x > hold:\n        hold = free - x\n    if hold + x - f > free:\n        free = hold + x - f\nprint(free)\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(1)` — প্রতিটা দিনে দুইটা তুলনা। `n = 10^5`-এও নিমেষে চলে।\n\n## সাধারণ ভুল\n\n- একই দিনে কিনে-বেচে ফি বাঁচানোর ভাবনা: একই দিনে কিনে বেচলে লাভ `x - x - f = -f`, কখনোই বাড়ে না — তাই সেই অবস্থা নিজে থেকেই বাদ পড়ে।\n- `hold` শূন্য দিয়ে শুরু করা: তখন টিকিট না কিনেই বেচে ফাঁকা লাভ বসে যায় — অসম্ভব অবস্থাকে বিশাল ঋণাত্মক মান দিয়ে আটকে রাখো।\n- সব দিন হাতে টিকিট না থাকলেও `hold` প্রিন্ট করা: উত্তর সবসময় `free`-তে, কারণ শেষ দিনে টিকিট হাতে রাখলে তার দাম পকেটে আসে না।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "State Machine", "Arrays"],
    tests: [
      {
        input: "6 3\n1 3 2 8 5 9\n",
        expectedOutput: "5\n",
        isSample: true,
      },
      { input: "5 2\n9 8 7 6 5\n", expectedOutput: "0\n", isSample: true },
      { input: "1 1\n5\n", expectedOutput: "0\n", isSample: false },
      { input: "4 3\n2 10 1 11\n", expectedOutput: "12\n", isSample: false },
      { input: "5 100\n1 2 3 4 5\n", expectedOutput: "0\n", isSample: false },
      {
        input:
          "100000 0\n" +
          Array.from({ length: 100000 }, (_, i) => i + 1).join(" ") +
          "\n",
        expectedOutput: "99999\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, f = data[0], data[1]\np = data[2:2 + n]\nhold = -(1 << 62)\nfree = 0\nfor x in p:\n    if free - x > hold:\n        hold = free - x\n    if hold + x - f > free:\n        free = hold + x - f\nprint(free)\n",
  },
  {
    slug: "learn-m5-dp-introduction-h2",
    title: "Coin Row Game",
    statement:
      "ক্লাবরুমের টেবিলে সারি ধরে `n`টা মুদ্রা পড়ে আছে, প্রতিটির ওপর মান লেখা। রফি আর তানভির একটা খেলায় বসল: রফি প্রথম চাল পাবে, তারপর পালা করে চাল। প্রতি চালে খেলোয়াড় সারির **বাম বা ডান প্রান্ত** থেকে একটা মুদ্রা তুলে নিজের সংগ্রহে রাখবে — মাঝ থেকে কিছু নেওয়া যাবে না। সারি ফুরনো পর্যন্ত খেলা চলবে।\n\nদুজনেই বুদ্ধি খাটিয়ে নিজের মোট সংগ্রহ সর্বোচ্চ করার চেষ্টা করবে। সর্বোত্তম খেলায় রফি (প্রথম খেলোয়াড়) সর্বোচ্চ কত টাকা পাবে, সেটা বের করো।\n\nউদাহরণ: মুদ্রা `5 3 7 10` — রফি ডানের `10` নেয়, তানভির `7`, রফি `5`, তানভির `3`; রফির মোট `15`।",
    inputFormat:
      "প্রথম লাইনে মুদ্রার সংখ্যা `n`। দ্বিতীয় লাইনে `n`টি মান, স্পেস দিয়ে আলাদা।",
    outputFormat: "প্রথম খেলোয়াড়ের সর্বোচ্চ মোট এক লাইনে প্রিন্ট করো।",
    constraints: "`1 <= n <= 500`\n`1 <= a_i <= 10^9`",
    editorial:
      "## ধারণা\n\n`dp[i][j]` ধরো: টেবিলে ঠিক `a[i..j]` অংশটা বাকি আছে আর এখন চাল দেওয়া খেলোয়াড় ওই অংশ থেকে সর্বোচ্চ কত পাবে। দুইটা বিকল্প:\n\n- বামের `a[i]` নিলে প্রতিপক্ষ `a[i+1..j]` নিয়ে চাল দেবে। প্রতিপক্ষ তার লাভ বাড়াবে — মানে সে এমন মুদ্রা নেবে যাতে তোমার পরের সারি যতটা পারো ছোট হয়। সে বামের `a[i+1]` নিলে তোমার পালে `a[i+2..j]`, ডানের `a[j]` নিলে তোমার পালে `a[i+1..j-1]` — দুটোর ছোটটাই তোমার ভাগে ধরতে হবে।\n- ডানের `a[j]` নিলে একই যুক্তি উল্টো দিক থেকে।\n\nতাই `dp[i][j] = max(a[i] + min(dp[i+2][j], dp[i+1][j-1]), a[j] + min(dp[i][j-2], dp[i+1][j-1]))`। খালি অংশ থেকে কেউ কিছু পায় না, তাই অসম্ভব ইনডেক্সের বদলে `0` ধরো। ছোট অংশ থেকে বড় অংশে ভরলে নির্ভর করা ঘরগুলো আগেই তৈরি থাকে — এটাই interval DP।\n\n## ধাপে ধাপে\n\n1. `n` আর মুদ্রাগুলো পড়ো।\n2. `dp[i][i] = a[i]` বসাও (একটা মুদ্রা বাকি — চাল দেওয়া জন পাবে)।\n3. দৈর্ঘ্য `2` থেকে `n`: প্রতিটা `(i, j)`-এর জন্য ওপরের সূত্র চালাও; খালি অংশ `0`।\n4. `dp[0][n-1]` প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\ndp = [[0] * n for _ in range(n)]\nfor i in range(n):\n    dp[i][i] = a[i]\nfor length in range(2, n + 1):\n    for i in range(n - length + 1):\n        j = i + length - 1\n        f1 = dp[i + 2][j] if i + 2 <= j else 0\n        f2 = dp[i + 1][j - 1] if i + 1 <= j - 1 else 0\n        take_left = a[i] + (f1 if f1 < f2 else f2)\n        g1 = dp[i][j - 2] if i <= j - 2 else 0\n        g2 = dp[i + 1][j - 1] if i + 1 <= j - 1 else 0\n        take_right = a[j] + (g1 if g1 < g2 else g2)\n        dp[i][j] = take_left if take_left > take_right else take_right\nprint(dp[0][n - 1])\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n^2)` — প্রতিটি `(i, j)` ঘরে `O(1)` কাজ। স্পেস `O(n^2)`; `n = 500`-এ প্রায় দুই লক্ষ পঞ্চাশ হাজার ঘর, Python-এও সহজে চলে।\n\n## সাধারণ ভুল\n\n- প্রতিটা চালে বড় প্রান্ত তুলে নেওয়া: ছোট কেসে ঠেকে যেতে পারে, কিন্তু প্রতিপক্ষের পাল্টা চাল ভাবলে এমন অবস্থান আসে যেখানে ছোট প্রান্ত নেওয়াই বেশি লাভ এনে দেয়।\n- `dp[i][j]`-কে দুজনের মোট ধরে নেওয়া: state বলছে চাল দেওয়া খেলোয়াড়ের ভাগ — প্রতিপক্ষের ভাগ `min` দিয়ে ঢুকে গেছে।\n- দৈর্ঘ্য `2`-এর ঘরে খালি অংশের বদলে প্রতিপক্ষের ঘর পড়া: `f1`, `f2` দুটোই অসম্ভব হলে `0` ধরতে হবে, নাহলে লুপ ভুল ইনডেক্সে যায়।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Game Theory", "Interval DP"],
    tests: [
      { input: "4\n5 3 7 10\n", expectedOutput: "15\n", isSample: true },
      { input: "4\n8 15 3 7\n", expectedOutput: "22\n", isSample: true },
      { input: "1\n9\n", expectedOutput: "9\n", isSample: false },
      { input: "2\n4 7\n", expectedOutput: "7\n", isSample: false },
      {
        input:
          "500\n" + Array.from({ length: 250 }, () => "1 2").join(" ") + "\n",
        expectedOutput: "500\n",
        isSample: false,
      },
      {
        input:
          "500\n" +
          Array.from({ length: 500 }, (_, i) => 500 - i).join(" ") +
          "\n",
        expectedOutput: "62750\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\ndp = [[0] * n for _ in range(n)]\nfor i in range(n):\n    dp[i][i] = a[i]\nfor length in range(2, n + 1):\n    for i in range(n - length + 1):\n        j = i + length - 1\n        f1 = dp[i + 2][j] if i + 2 <= j else 0\n        f2 = dp[i + 1][j - 1] if i + 1 <= j - 1 else 0\n        take_left = a[i] + (f1 if f1 < f2 else f2)\n        g1 = dp[i][j - 2] if i <= j - 2 else 0\n        g2 = dp[i + 1][j - 1] if i + 1 <= j - 1 else 0\n        take_right = a[j] + (g1 if g1 < g2 else g2)\n        dp[i][j] = take_left if take_left > take_right else take_right\nprint(dp[0][n - 1])\n",
  },
];
