import type { SeedProblem } from "../../seed-problems";
import { lineInput, nAndNumbers, newlineOutput, spaceOutput } from "../generated-tests";

export const IO_LOOPS_EXTRA_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m1-io-e2",
    title: "Canteen Rush Hours",
    statement: `প্রাইমএশিয়া ক্যান্টিনে দুপুরের সময় রাফি প্রতিঘণ্টায় কতজন ছাত্রছাত্রী এসেছে সেটা কাগজে লিখে রাখে। কোডিং ক্লাবের সদস্যরা বলেছে — যে ঘণ্টায় আসার সংখ্যা \`k\` বা তার বেশি, সেটাই "রাশ আওয়ার"। রফি এখন জানতে চায় তার লেখা দিনে মোট কতটা ঘণ্টা রাশ আওয়ার হয়েছে।

প্রথম লাইনে \`n\` আর \`k\`, দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা — ক্রমানুসারে প্রতি ঘণ্টার আসার সংখ্যা।`,
    inputFormat: `প্রথম লাইনে দুইটি সংখ্যা: \`n\` আর \`k\`।
দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।`,
    outputFormat: `এক লাইনে রাশ আওয়ার সংখ্যা।`,
    constraints: `\`1 <= n <= 100000\`
\`0 <= count <= 100000\` — প্রতি ঘণ্টার আসার সংখ্যা।
\`0 <= k <= 100000\``,
    editorial: `## ধারণা
শর্তটা প্রতিটি ঘণ্টার সংখ্যার সাথে মেলাতে হবে: \`count >= k\` হলে সে ঘণ্টা রাশ। ঘণ্টাগুলো আলাদা করে রাখার দরকার নেই, কারণ চাওয়া হয়েছে শুধু কতটা "রাশ" — তাই লুপের ভিতরে শুধু কাউন্ট বাড়ালেই হয়।

## ধাপে ধাপে
1. \`n\` আর \`k\` পড়ো।
2. \`n\`টি আসার সংখ্যা পড়ে একটা তালিকা বানাও।
3. \`rush = 0\` দিয়ে শুরু করো।
4. প্রতিটি \`count\`-এর জন্য: \`count >= k\` হলে \`rush += 1\`।
5. শেষে \`rush\` ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, k = data[0], data[1]
rush = 0
for value in data[2:2 + n]:
    if value >= k:
        rush += 1
print(rush)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\` — প্রতিটি ঘণ্টা একবার দেখা হয়। অতিরিক্ত মেমোরি \`O(n)\` (সব সংখ্যা একসাথে পড়লে), এক এক করে পড়লে \`O(1)\`।

## সাধারণ ভুল
- \`>\` লিখে \`>=\`: ঠিক \`k\` আসার ঘণ্টাটা তখন বাদ পড়ে (নমুনায় ধরা আছে)।
- \`n\` না দেখে পুরো লাইন ঘুরে গেলে বাড়তি সংখ্যা গোনা হয় — ঠিক \`n\` উপাদান নিয়ে লুপ চালাও।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Implementation", "Loops", "Conditionals"],
    tests: [
      { input: "5 3\n1 3 5 2 3\n", expectedOutput: "3\n", isSample: true },
      { input: "1 0\n0\n", expectedOutput: "1\n", isSample: true },
      { input: "4 10\n5 4 3 2\n", expectedOutput: "0\n", isSample: false },
      { input: "6 1\n1 1 1 1 1 1\n", expectedOutput: "6\n", isSample: false },
      { input: "3 5\n5 6 4\n", expectedOutput: "2\n", isSample: false },
      {
        input: `100000 100000\n${Array.from({ length: 100000 }, () => 100000).join(" ")}\n`,
        expectedOutput: "100000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, k = data[0], data[1]\nrush = 0\nfor value in data[2:2 + n]:\n    if value >= k:\n        rush += 1\nprint(rush)\n",
  },
  {
    slug: "learn-m1-io-e3",
    title: "Even and Odd Collection Sums",
    statement: `নুসরাত প্রাইমএশিয়া কোডিং ক্লাবের কোষাধ্যক্ষ হিসেবে বছরের প্রথম দিনে সদস্যদের জমা টাকার হিসাব রাখছে। কিছু এন্ট্রি ঋণাত্মকও আসে — ভুল সংশোধনের জন্য টাকা ফেরত দেওয়া হয়, তাই সংখ্যা যেকোনো পূর্ণসংখ্যা হতে পারে। তাকে দুইটা জিনিস দরকার: জোড় সংখ্যার মোট আর বিজোড় সংখ্যার মোট।

প্রথম লাইনে \`n\`, দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা — ক্রমানুসারে প্রতিটি সদস্যের জমা টাকা।`,
    inputFormat: `প্রথম লাইনে \`n\`।
দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।`,
    outputFormat: `এক লাইনে দুইটি সংখ্যা: \`evenSum oddSum\` — স্পেস দিয়ে আলাদা।`,
    constraints: `\`1 <= n <= 100000\`
\`-1000000 <= amount <= 1000000\` — ঋণাত্মক টাকাও আসতে পারে।`,
    editorial: `## ধারণা
জোড় যাচাই হয় \`x % 2 == 0\` দিয়ে, এবং Python-এ ঋণাত্মক সংখ্যায়ও একই আচরণ হয় — \`-4 % 2\` শূন্য দেয়, তাই \`-4\` জোড়। দুইটা চলমান যোগফল (\`even_sum\`, \`odd_sum\`) রাখলে এক লুপেই দুই উত্তর পাওয়া যায়।

## ধাপে ধাপে
1. \`n\` আর \`n\`টি টাকা পড়ো।
2. \`even_sum = 0\` আর \`odd_sum = 0\` দিয়ে শুরু করো।
3. প্রতিটি টাকার জন্য: জোড় হলে \`even_sum += value\`, না হলে \`odd_sum += value\`।
4. \`evenSum oddSum\` এক লাইনে ছাপাও — মাঝে ঠিক একটা স্পেস।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
even_sum = 0
odd_sum = 0
for value in data[1:1 + n]:
    if value % 2 == 0:
        even_sum += value
    else:
        odd_sum += value
print(even_sum, odd_sum)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\` — প্রতিটি টাকা একবার দেখা হয়। অতিরিক্ত মেমোরি \`O(n)\` (ইনপুট ধরলে) বা \`O(1)\` (এক এক করে পড়লে)।

## সাধারণ ভুল
- \`x > 0 and x % 2 == 0\` ধরলে ঋণাত্মক জোড় সংখ্যা (\`-4\`) বাদ পড়ে — শুধু \`% 2\` যাচাইই যথেষ্ট।
- দুই যোগফল একই ভ্যারিয়েবলে রাখলে বা শর্তে \`else\` না দিলে একটা সবসময় শূন্য থেকে যায়।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Implementation", "Loops", "Conditionals"],
    tests: [
      { input: "5\n10 15 20 7 8\n", expectedOutput: "38 22\n", isSample: true },
      { input: "1\n0\n", expectedOutput: "0 0\n", isSample: true },
      { input: "4\n-4 -7 1 0\n", expectedOutput: "-4 -6\n", isSample: false },
      {
        input: "2\n1000000 -1000000\n",
        expectedOutput: "0 0\n",
        isSample: false,
      },
      { input: "6\n1 3 5 7 9 11\n", expectedOutput: "0 36\n", isSample: false },
      {
        input: nAndNumbers(
          100000,
          Array.from({ length: 100000 }, (_, i) => i + 1),
        ),
        expectedOutput: spaceOutput([2500050000, 2500000000]),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\neven_sum = 0\nodd_sum = 0\nfor value in data[1:1 + n]:\n    if value % 2 == 0:\n        even_sum += value\n    else:\n        odd_sum += value\nprint(even_sum, odd_sum)\n",
  },
  {
    slug: "learn-m1-io-m2",
    title: "Longest Attendance Streak",
    statement: `সাদিয়া প্রাইমএশিয়া লাইব্রেরির ভলান্টিয়ার হিসেবে গত \`n\` দিনের হাজিরা একটা ফাইলে রেখেছে — প্রতিটি দিনে সে লিখেছে \`1\` (উপস্থিত) বা \`0\` (অনুপস্থিত)। মূল্যায়ন সভা জানতে চায় সবচেয়ে লম্বা টানা উপস্থিতির ধারা কত দিন ছিল।

প্রথম লাইনে \`n\`, দ্বিতীয় লাইনে \`n\`টি সংখ্যা — প্রতিটি \`0\` বা \`1\`।`,
    inputFormat: `প্রথম লাইনে \`n\`।
দ্বিতীয় লাইনে \`n\`টি সংখ্যা (\`0\` বা \`1\`), স্পেস দিয়ে আলাদা।`,
    outputFormat: `এক লাইনে সবচেয়ে লম্বা টানা \`1\`-এর সংখ্যা (কোনোদিনই না গেলে \`0\`)।`,
    constraints: `\`1 <= n <= 100000\`
প্রতিটি মান \`0\` বা \`1\`।`,
    editorial: `## ধারণা
দুইটা ভ্যারিয়েবলই লাগবে: চলমান ধারা \`current\` আর এখন পর্যন্ত সেরা \`best\`। \`1\` দেখলে \`current\` বাড়ে এবং \`best\`-এর চেয়ে বড় হলে আপডেট হয়; \`0\` দেখলে ধারাটা ভাঙে এবং \`current\` শূন্য হয়। শূন্য মানেই ধারা শেষ — এখানে \`if\` আর \`else\` দুটোই দরকার।

## ধাপে ধাপে
1. \`n\` আর \`n\`টি দিনের হাজিরা পড়ো।
2. \`current = 0\`, \`best = 0\` দিয়ে শুরু করো।
3. প্রতিটি দিনের জন্য: \`1\` হলে \`current += 1\` এবং \`best = max(best, current)\`, না হলে \`current = 0\`।
4. শেষে \`best\` ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
current = 0
best = 0
for value in data[1:1 + n]:
    if value == 1:
        current += 1
        if current > best:
            best = current
    else:
        current = 0
print(best)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\` — একবার ঘুরেই হয়। অতিরিক্ত মেমোরি \`O(1)\` (শুধু দুই কাউন্টার)।

## সাধারণ ভুল
- শুধু মোট \`1\`-এর সংখ্যা গোনা: নমুনায় মোট \`6\` কিন্তু সেরা ধারা \`3\`।
- \`0\`-এ \`current\` কমানো না করলে আগের ধারাটা নতুন দিনেও চলতে থাকে এবং উত্তর বাড়ে যায়।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Implementation", "Loops", "Conditionals"],
    tests: [
      { input: "8\n1 1 0 1 1 1 0 1\n", expectedOutput: "3\n", isSample: true },
      { input: "5\n0 0 0 0 0\n", expectedOutput: "0\n", isSample: true },
      { input: "1\n1\n", expectedOutput: "1\n", isSample: false },
      { input: "6\n1 1 1 1 1 1\n", expectedOutput: "6\n", isSample: false },
      { input: "7\n0 1 1 0 1 1 1\n", expectedOutput: "3\n", isSample: false },
      {
        input: nAndNumbers(
          100000,
          Array.from({ length: 100000 }, (_, i) =>
            i % 2000 < 1000 ? 1 : 0,
          ),
        ),
        expectedOutput: spaceOutput([1000]),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ncurrent = 0\nbest = 0\nfor value in data[1:1 + n]:\n    if value == 1:\n        current += 1\n        if current > best:\n            best = current\n    else:\n        current = 0\nprint(best)\n",
  },
  {
    slug: "learn-m1-io-m3",
    title: "Club Fund Ledger",
    statement: `তানভির প্রাইমএশিয়া কোডিং ক্লাবের তহবিলের লেজার রাখছে। প্রতিটি লেনদেন এক লাইনে আসে: \`C x\` মানে জমা, \`D x\` মানে উত্তোলন। ক্লাবের নিয়ম — উত্তোলনের টাকা বর্তমান ব্যালেন্সের চেয়ে বেশি হলে সে লেনদেন বাতিল হয়, অর্থাৎ ব্যালেন্স একই থাকে। শূন্য টাকা দিয়ে শুরু।

প্রথম লাইনে লেনদেন সংখ্যা \`n\`, তারপর \`n\` লাইন — প্রতিটিতে একটা অক্ষর আর একটা পূর্ণসংখ্যা। প্রতিটি লেনদেনের পরে বর্তমান ব্যালেন্স আলাদা লাইনে ছাপাও।`,
    inputFormat: `প্রথম লাইনে \`n\`।
পরের \`n\` লাইনে প্রতিটিতে \`C x\` বা \`D x\`।`,
    outputFormat: `\`n\` লাইন; \`i\`-তম লাইনে \`i\`-তম লেনদেনের পরে ব্যালেন্স।`,
    constraints: `\`1 <= n <= 100000\`
\`1 <= x <= 10^9\`
লেনদেন শুধু \`C\` বা \`D\`; ব্যালেন্স কখনো ঋণাত্মক হবে না।`,
    editorial: `## ধারণা
এটা একটা চলমান হিসাব (running balance): শুরু \`balance = 0\`, প্রতিটি লেনদেনে সেটা বদলায়। শর্তটা এখানেই — \`D x\` মানে বিয়োগ, কিন্তু \`x > balance\` হলে বিয়োগ করা যায় না; সেক্ষেত্রে \`if\` টা পুরোটা এড়িয়ে যায় এবং ব্যালেন্স অপরিবর্তিত থাকে। উত্তর লুপের ভিতরেই জমা করে শেষে একসাথে ছাপালে ফরম্যাট নিশ্চিত হয়।

## ধাপে ধাপে
1. \`n\` আর \`n\` লাইন পড়ে নাও।
2. \`balance = 0\` দিয়ে শুরু করো, উত্তরগুলো একটা তালিকায় রাখো।
3. প্রতি লাইনের জন্য: \`C\` হলে \`balance += x\`।
4. \`D\` হলে \`x <= balance\` মানে সেটাই বিয়োগ করো, নাহলে কিছুই কোরো না।
5. প্রতিবার \`balance\` তালিকায় যোগ করো, লুপ শেষে এক এক করে ছাপাও।

\`\`\`python
import sys
lines = sys.stdin.read().splitlines()
n = int(lines[0])
balance = 0
out = []
for i in range(1, n + 1):
    kind, raw = lines[i].split()
    amount = int(raw)
    if kind == "C":
        balance += amount
    elif amount <= balance:
        balance -= amount
    out.append(str(balance))
print("\\n".join(out))
\`\`\`

## কমপ্লেক্সিটি
সময় ও মেমোরি \`O(n)\` — একবার ঘুরে হিসাব এবং \`n\` লাইন আউটপুট।

## সাধারণ ভুল
- উত্তোলনে শর্ত না দিলে ব্যালেন্স ঋণাত্মক হয়ে যায় — \`elif amount <= balance\` বাধ্যতামূলক।
- প্রতিটি লেনদেনের পরে ছাপানো না করে শেষে শুধু চূড়ান্ত ব্যালেন্স ছাপালে \`n\` লাইনের বদলে এক লাইন আসে।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Implementation", "Loops", "Conditionals"],
    tests: [
      {
        input: "4\nC 100\nD 30\nD 200\nC 50\n",
        expectedOutput: "100\n70\n70\n120\n",
        isSample: true,
      },
      { input: "1\nD 10\n", expectedOutput: "0\n", isSample: true },
      {
        input: "3\nD 5\nC 5\nD 5\n",
        expectedOutput: "0\n5\n0\n",
        isSample: false,
      },
      {
        input: "2\nC 1000000000\nC 1000000000\n",
        expectedOutput: "1000000000\n2000000000\n",
        isSample: false,
      },
      {
        input: "5\nC 10\nD 10\nD 1\nC 1\nD 1\n",
        expectedOutput: "10\n0\n0\n1\n0\n",
        isSample: false,
      },
      {
        input: lineInput(Array.from({ length: 100000 }, () => "C 1")),
        expectedOutput: newlineOutput(
          Array.from({ length: 100000 }, (_, i) => i + 1),
        ),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nlines = sys.stdin.read().splitlines()\nn = int(lines[0])\nbalance = 0\nout = []\nfor i in range(1, n + 1):\n    kind, raw = lines[i].split()\n    amount = int(raw)\n    if kind == \"C\":\n        balance += amount\n    elif amount <= balance:\n        balance -= amount\n    out.append(str(balance))\nprint(\"\\n\".join(out))\n",
  },
  {
    slug: "learn-m1-io-h2",
    title: "Spiral Garden Path",
    statement: `প্রাইমএশিয়া উৎসবে সাদিয়া বর্গাকার বাগানে \`1\` থেকে \`n^2\` পর্যন্ত নম্বরযুক্ত পাথর সাজাচ্ছে সর্পিলভাবে — শুরু উপরের বাম কোণায় \`1\`, তারপর ডাদিকে এগোয়, শেষ হলে নিচে, তারপর বামে, তারপর আবার উপরে; প্রতিবার আগের দিকগুলো এক ঘর করে ছোট হতে থাকে। তুমি বাগানটার ম্যাপটা ছাপাবে।

উদাহরণ: \`n = 3\` হলে ঠিক এভাবে:

\`\`\`
1 2 3
8 9 4
7 6 5
\`\`\``,
    inputFormat: `এক লাইনে একটা পূর্ণসংখ্যা \`n\`।`,
    outputFormat: `\`n\` লাইন; \`i\`-তম লাইনে \`n\`টি সংখ্যা, স্পেস দিয়ে আলাদা।`,
    constraints: `\`1 <= n <= 20\`।`,
    editorial: `## ধারণা
সর্পিলকে ভাবো চারটা সীমা দিয়ে ঘরটা কাটা যাচ্ছে: \`top\`, \`bottom\`, \`left\`, \`right\`। প্রথমে \`top\` সারির \`left\` থেকে \`right\` পর্যন্ত ভরা, তারপর \`right\` কলামের \`top + 1\` থেকে \`bottom\` পর্যন্ত, এরপর \`bottom\` সারি উল্টো ক্রমে, শেষে \`left\` কলাম উল্টো ক্রমে। প্রতিটা ধাপে সংশ্লিষ্ট সীমাটা এক ঘর সরাও — তাহলে ভাঙা সারি বা ঘর দুইবার ভরা হয় না।

## ধাপে ধাপে
1. \`n × n\` খালি গ্রিড বানাও, \`value = 1\`।
2. \`top = 0\`, \`bottom = n - 1\`, \`left = 0\`, \`right = n - 1\`।
3. \`top <= bottom\` আর \`left <= right\` থাকা পর্যন্ত:
   - \`top\` সারি বাঁ→ডানে ভরো, তারপর \`top += 1\`।
   - \`right\` কলাম উপর→নিচে ভরো, তারপর \`right -= 1\`।
   - থাকা সারি থাকলে \`bottom\` সারি ডান→বামে ভরো, তারপর \`bottom -= 1\`।
   - থাকা কলাম থাকলে \`left\` কলাম নিচ→উপরে ভরো, তারপর \`left += 1\`।
4. গ্রিডের প্রতিটি সারি স্পেস দিয়ে যোগ করে ছাপাও।

\`\`\`python
import sys
n = int(sys.stdin.readline())
grid = [[0] * n for _ in range(n)]
top, bottom, left, right = 0, n - 1, 0, n - 1
value = 1
while top <= bottom and left <= right:
    for col in range(left, right + 1):
        grid[top][col] = value
        value += 1
    top += 1
    for row in range(top, bottom + 1):
        grid[row][right] = value
        value += 1
    right -= 1
    if top <= bottom:
        for col in range(right, left - 1, -1):
            grid[bottom][col] = value
            value += 1
        bottom -= 1
    if left <= right:
        for row in range(bottom, top - 1, -1):
            grid[row][left] = value
            value += 1
        left += 1
for row in grid:
    print(" ".join(map(str, row)))
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n^2)\` — প্রতিটি ঘর ঠিক একবার ভরা হয়। মেমোরি \`O(n^2)\` (গ্রিড ধরে রাখতেই হয়)।

## সাধারণ ভুল
- শেষ সারি/কলামে গার্ড না দিলে ঘর দুইবার ভরা হয় বা সীমা উল্টে যায় — \`if top <= bottom\` আর \`if left <= right\` ছাড়া চলে না।
- \`range\`-এর শেষ মান বাদ পড়া: \`range(left, right)\` লিখলে ডান দিকের শেষ ঘরটা খালি থাকে।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Implementation", "Loops", "Pattern", "Matrix"],
    tests: [
      { input: "1\n", expectedOutput: "1\n", isSample: true },
      {
        input: "3\n",
        expectedOutput: "1 2 3\n8 9 4\n7 6 5\n",
        isSample: true,
      },
      { input: "2\n", expectedOutput: "1 2\n4 3\n", isSample: false },
      {
        input: "4\n",
        expectedOutput: "1 2 3 4\n12 13 14 5\n11 16 15 6\n10 9 8 7\n",
        isSample: false,
      },
      {
        input: "5\n",
        expectedOutput:
          "1 2 3 4 5\n16 17 18 19 6\n15 24 25 20 7\n14 23 22 21 8\n13 12 11 10 9\n",
        isSample: false,
      },
      {
        input: "20\n",
        expectedOutput: `1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20
76 77 78 79 80 81 82 83 84 85 86 87 88 89 90 91 92 93 94 21
75 144 145 146 147 148 149 150 151 152 153 154 155 156 157 158 159 160 95 22
74 143 204 205 206 207 208 209 210 211 212 213 214 215 216 217 218 161 96 23
73 142 203 256 257 258 259 260 261 262 263 264 265 266 267 268 219 162 97 24
72 141 202 255 300 301 302 303 304 305 306 307 308 309 310 269 220 163 98 25
71 140 201 254 299 336 337 338 339 340 341 342 343 344 311 270 221 164 99 26
70 139 200 253 298 335 364 365 366 367 368 369 370 345 312 271 222 165 100 27
69 138 199 252 297 334 363 384 385 386 387 388 371 346 313 272 223 166 101 28
68 137 198 251 296 333 362 383 396 397 398 389 372 347 314 273 224 167 102 29
67 136 197 250 295 332 361 382 395 400 399 390 373 348 315 274 225 168 103 30
66 135 196 249 294 331 360 381 394 393 392 391 374 349 316 275 226 169 104 31
65 134 195 248 293 330 359 380 379 378 377 376 375 350 317 276 227 170 105 32
64 133 194 247 292 329 358 357 356 355 354 353 352 351 318 277 228 171 106 33
63 132 193 246 291 328 327 326 325 324 323 322 321 320 319 278 229 172 107 34
62 131 192 245 290 289 288 287 286 285 284 283 282 281 280 279 230 173 108 35
61 130 191 244 243 242 241 240 239 238 237 236 235 234 233 232 231 174 109 36
60 129 190 189 188 187 186 185 184 183 182 181 180 179 178 177 176 175 110 37
59 128 127 126 125 124 123 122 121 120 119 118 117 116 115 114 113 112 111 38
58 57 56 55 54 53 52 51 50 49 48 47 46 45 44 43 42 41 40 39
`,
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\ngrid = [[0] * n for _ in range(n)]\ntop, bottom, left, right = 0, n - 1, 0, n - 1\nvalue = 1\nwhile top <= bottom and left <= right:\n    for col in range(left, right + 1):\n        grid[top][col] = value\n        value += 1\n    top += 1\n    for row in range(top, bottom + 1):\n        grid[row][right] = value\n        value += 1\n    right -= 1\n    if top <= bottom:\n        for col in range(right, left - 1, -1):\n            grid[bottom][col] = value\n            value += 1\n        bottom -= 1\n    if left <= right:\n        for row in range(bottom, top - 1, -1):\n            grid[row][left] = value\n            value += 1\n        left += 1\nfor row in grid:\n    print(\" \".join(map(str, row)))\n",
  },
];
