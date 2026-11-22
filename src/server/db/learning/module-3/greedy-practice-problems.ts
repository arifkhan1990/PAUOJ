import type { SeedProblem } from "../../seed-problems";

export const GREEDY_PRACTICE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m3-greedy-e2",
    title: "Satisfy Children with Cookies",
    statement: `ক্লাবের বিশেষ দিনে রফি বিস্কুট বিতরণ করছিল। প্রতিটি শিশুর একটা লোভ গুণ \`g[i]\` — সে তখনই খুশি হবে যখন পাওয়া বিস্কুটের সাইজ তার লোভের সমান বা বেশি। হাতে \`m\`টা বিস্কুট, প্রতিটার সাইজ \`s[j]\`; এক শিশু সর্বোচ্চ একটা বিস্কুট পাবে, এক বিস্কুট সর্বোচ্চ এক শিশুকেই দেওয়া যাবে। সর্বোচ্চ কতজন শিশুকে খুশি করা যায়?

উদাহরণ: লোভ \`1 2 3\`, বিস্কুট \`1 1\` হলে লোভ \`1\`-এর শিশুটা একটা বিস্কুট পাবে — উত্তর \`1\`।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`m\`; দ্বিতীয় লাইনে \`n\`টি লোভ গুণ; তৃতীয় লাইনে \`m\`টি বিস্কুট সাইজ।`,
    outputFormat: `খুশি করা যায় এমন শিশুর সর্বোচ্চ সংখ্যা।`,
    constraints: `\`1 <= n, m <= 100000\`
\`1 <= লোভ, সাইজ <= 10^9\`।`,
    editorial: `## ধারণা
সবচেয়ে ছোট লোভের শিশুকে সবচেয়ে ছোট বিস্কুট দিয়ে শুরু করাই সেরা। কেন? কোনো সমাধান যদি ছোট বিস্কুটটা বড় লোভের কারোকে দেয়, সে ক্ষেত্রে বড় লোভের শিশুটা ছোট বিস্কুট দিয়ে খুশি হয় না, আর বড় বিস্কুটটা ছোট লোভের শিশুর জন্য অপচয় — বদলে দিলে খুশির সংখ্যা কমে না। দুই লিস্টই সর্ট করে দুই পয়েন্টার চালাও: সামনের বিস্কুট সামনের লোভ মেটালে দুই পয়েন্টারই এগোও, নাহলে ওই বিস্কুট কারো কাজে আসবে না বলে শুধু বিস্কুট পয়েন্টার এগোও।

## ধাপে ধাপে
1. লোভ আর সাইজ দুটোই ছোট থেকে বড় সাজাও।
2. \`i = 0\` (শিশু), \`j = 0\` (বিস্কুট), খুশির সংখ্যা \`0\`।
3. \`s[j] >= g[i]\` হলে শিশুটা খুশি — \`i += 1\`, \`j += 1\`, কাউন্ট বাড়াও।
4. নাহলে \`j += 1\` — ছোট বিস্কুটটা বাদ, পরেরটা দেখো।
5. কোনো লিস্ট ফুরোলে থামো; কাউন্ট ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, m = data[0], data[1]
g = sorted(data[2:2 + n])
s = sorted(data[2 + n:2 + n + m])
i = j = happy = 0
while i < n and j < m:
    if s[j] >= g[i]:
        happy += 1
        i += 1
        j += 1
    else:
        j += 1
print(happy)
\`\`\`

## কমপ্লেক্সিটি
দুই সর্ট \`O(n log n + m log m)\`, লুপ \`O(n + m)\`; মেমোরি \`O(n + m)\`।

## সাধারণ ভুল
- বড় লোভের শিশুকে আগে বিস্কুট দিতে যাওয়া — বড় বিস্কুট ছোট লোভের শিশুতেও কাজে লাগত, অপচয় হয়।
- ছোট বিস্কুট কারো মিললে সেটা বাদ না দিয়ে লুপে রেখে দিলে একই বিস্কুট দুইবার গোনার ঝুঁকি — মেলা মাত্রই \`j\` এগোও।
- সাজানো ছাড়া দুই পয়েন্টার চালালে ছোট বিস্কুট পরে আসা মানেই ভুল সিদ্ধান্ত।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Greedy", "Two Pointers", "Sorting"],
    tests: [
      { input: "3 2\n1 2 3\n1 1\n", expectedOutput: "1\n", isSample: true },
      { input: "2 3\n1 2\n1 2 3\n", expectedOutput: "2\n", isSample: true },
      { input: "2 2\n5 5\n1 1\n", expectedOutput: "0\n", isSample: false },
      { input: "1 1\n1\n5\n", expectedOutput: "1\n", isSample: false },
      {
        input: `100000 100000\n${Array.from({ length: 100000 }, (_, i) => i + 1).join(" ")}\n${Array.from({ length: 100000 }, (_, i) => i + 1).join(" ")}\n`,
        expectedOutput: "100000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, m = data[0], data[1]\ng = sorted(data[2:2 + n])\ns = sorted(data[2 + n:2 + n + m])\ni = j = happy = 0\nwhile i < n and j < m:\n    if s[j] >= g[i]:\n        happy += 1\n        i += 1\n        j += 1\n    else:\n        j += 1\nprint(happy)\n",
  },
  {
    slug: "learn-m3-greedy-e3",
    title: "Plant Saplings with Gaps",
    statement: `বাগানের এক সারিতে \`n\`টা প্লট আছে — \`1\` মানে ওই প্লটে আগেই একটা গাছ, \`0\` মানে খালি। সাদিয়া নতুন চারা লাগাতে চায়, নিয়ম একটাই: চারা লাগানো যাবে শুধু এমন খালি প্লটে যার দুই পাশেই (মানে প্লটে গাছ বা চারা কিছুই না আছে) খালি প্লট আছে। প্রতিটি প্লটে সর্বোচ্চ একটা চারা। সারিতে সর্বোচ্চ কতটা নতুন চারা লাগানো যায়?

উদাহরণ: সারি \`1 0 0 0 0 1\` হলে মাঝের প্লটের ঠিক মাঝটাতেই একটা চারা লাগে — উত্তর \`1\`।`,
    inputFormat: `প্রথম লাইনে \`n\`; দ্বিতীয় লাইনে \`n\`টি সংখ্যা — প্রতিটি \`0\` বা \`1\`।`,
    outputFormat: `লাগানো যায় এমন নতুন চারার সর্বোচ্চ সংখ্যা।`,
    constraints: `\`1 <= n <= 200000\`।`,
    editorial: `## ধারণা
বাঁ থেকে ডানে এক পাসেই সিদ্ধান্ত নেওয়া যায়। প্লট \`i\` খালি হলে দেখো: বাঁয়ে কিছু আছে কি না (আগের প্লটে গাছ, নয়তো এইমাত্র লাগানো চারা), আর ডানে কিছু আছে কি না। দুই পাশই খালি মানে এখনই চারা লাগাও — যত বাঁয়ে লাগানো যায়, ডানের সব সিদ্ধান্তের জায়গা তত বাঁচে। কেন এটাই সর্বোচ্চ? কোনো অন্য সমাধানে যদি প্রথম সম্ভব প্লটটা খালি রাখে, সেখানে চারা বসিয়ে দিলে ডানের এক প্লট ব্যস্ত হয় ঠিকই, কিন্তু বাঁয়ের সুযোগটা ফিরে পাওয়া যায় না — বিনিময়ে উত্তর খারাপ হয় না।

## ধাপে ধাপে
1. \`n\` আর সারি পড়ো; \`planted = 0\`, \`prev_new = False\` (আগের প্লটে এইমাত্র চারা লাগিয়েছি কি না)।
2. প্রতিটি প্লটে: মান \`1\` হলে গাছ আছে — \`prev_new = False\` করে পরের প্লটে যাও।
3. মান \`0\` হলে দেখো — বাঁয়ে খালি (\`i == 0\` হলে বাঁয়ে কিছুই নেই) আর ডানে খালি (\`i == n-1\` হলে ডানে কিছুই নেই)।
4. দুই শর্তই মিললে চারা লাগাও: \`planted += 1\`, \`prev_new = True\`; নাহলে \`prev_new = False\`।
5. শেষে \`planted\` ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
bed = data[1:]
planted = 0
prev_new = False
for i in range(n):
    if bed[i] == 1:
        prev_new = False
        continue
    left_ok = i == 0 or (bed[i - 1] == 0 and not prev_new)
    right_ok = i == n - 1 or bed[i + 1] == 0
    if left_ok and right_ok:
        planted += 1
        prev_new = True
    else:
        prev_new = False
print(planted)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\` — একটাই পাস; মেমোরি \`O(1)\` অতিরিক্ত।

## সাধারণ ভুল
- শুধু বাঁয়ের প্লট দেখে চারা লাগালে ডানে গাছ থাকলে নিয়ম ভাঙে — দুই পাশই যাচাই করতে হবে।
- \`prev_new\` ট্র্যাক না করলে পরপর দুই খালি প্লটে দুটোই চারা লাগিয়ে নিয়ম ভেঙে ফেলে।
- শেষ প্লটের ডানে কিছু নেই ভুলে গেলে শেষ সুযোগটা হারায় — \`i == n - 1\` শর্তটা জরুরি।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Greedy", "Arrays"],
    tests: [
      { input: "6\n1 0 0 0 0 1\n", expectedOutput: "1\n", isSample: true },
      { input: "5\n0 0 0 0 0\n", expectedOutput: "3\n", isSample: true },
      { input: "4\n1 1 1 1\n", expectedOutput: "0\n", isSample: false },
      { input: "1\n0\n", expectedOutput: "1\n", isSample: false },
      { input: "1\n1\n", expectedOutput: "0\n", isSample: false },
      {
        input: `200000\n${Array(200000).fill(0).join(" ")}\n`,
        expectedOutput: "100000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nbed = data[1:]\nplanted = 0\nprev_new = False\nfor i in range(n):\n    if bed[i] == 1:\n        prev_new = False\n        continue\n    left_ok = i == 0 or (bed[i - 1] == 0 and not prev_new)\n    right_ok = i == n - 1 or bed[i + 1] == 0\n    if left_ok and right_ok:\n        planted += 1\n        prev_new = True\n    else:\n        prev_new = False\nprint(planted)\n",
  },
  {
    slug: "learn-m3-greedy-m2",
    title: "Complete the Fuel Circuit",
    statement: `ক্যাম্পাস সার্কুলার বাস রুটে \`n\`টা স্টেশন একটার পর একটা ঘিরে আছে। স্টেশন \`i\`-এ \`gas[i]\` লিটার জ্বালানি ভরা যায়, আর পরের স্টেশনে যেতে \`cost[i]\` লিটার লাগে। ট্যাংক শুরুতে খালি, জ্বালানি এক স্টেশনে না থামিয়ে পরেরটায় নেওয়া যায় না। এমন কোনো স্টেশন আছে কি যেখান থেকে শুরু করলে পুরো চক্র ঘুরে আবার ওই স্টেশনেই ফেরা যায়? সম্ভব হলে সেই স্টেশনের নম্বর (১-ভিত্তিক) ছাপাও, না হলে \`-1\`। সমাধান থাকলে সেটি অনন্য।

উদাহরণ: \`gas = 1 2 3 4 5\`, \`cost = 3 4 5 1 2\` হলে চতুর্থ স্টেশন থেকে শুরু করলে পুরো চক্র শেষ হয় — উত্তর \`4\`।`,
    inputFormat: `প্রথম লাইনে \`n\`; দ্বিতীয় লাইনে \`n\`টি \`gas\` মান; তৃতীয় লাইনে \`n\`টি \`cost\` মান।`,
    outputFormat: `শুরু করার স্টেশনের নম্বর, অসম্ভব হলে \`-1\`।`,
    constraints: `\`1 <= n <= 200000\`
\`0 <= gas[i], cost[i] <= 10^9\`।`,
    editorial: `## ধারণা
প্রথমেই দেখো মোট \`gas\` মোট \`cost\`-এর কম হলে কোনো শুরুই কাজ করবে না — \`-1\`। কম না হলে উত্তর অবশ্যই আছে, আর খুঁজে বের করার সহজ উপায়: বাঁ থেকে চলমান ট্যাংক ধরে চলো। স্টেশন \`i\`-এ ট্যাংক ঋণাত্মক হয়ে গেলে বোঝা যায় এই পর্যন্ত যেকোনো স্টেশন থেকেই শুরু করা সম্ভব না — কারণ মাঝের কোনো স্টেশন থেকে শুরু করলে ট্যাংক আরও কম হয়ে \`i\`-তে আগেই ঋণাত্মক হতো। তাই শুরু স্থানান্তর করে \`i + 1\` পর্যন্ত ঠেলে দাও, ট্যাংক শূন্য করে আবার চলা শুরু করো। সব পার হয়ে গেলে শেষ যে শুরুটা রয়ে গেছে সেটাই উত্তর।

## ধাপে ধাপে
1. \`gas\` আর \`cost\` পড়ে মোট যোগফল তুলনা করো — মোট \`gas\` কম হলে \`-1\` ছাপাও।
2. \`start = 0\`, \`tank = 0\` ধরে স্টেশনগুলো বাঁ থেকে ঘোরো।
3. \`tank += gas[i] - cost[i]\` করো।
4. \`tank < 0\` হলে এই অংশের কোনো স্টেশনই শুরু হতে পারে না — \`start = i + 1\`, \`tank = 0\`।
5. লুপ শেষে \`start + 1\` ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
gas = data[1:1 + n]
cost = data[1 + n:1 + 2 * n]
if sum(gas) < sum(cost):
    print(-1)
else:
    start = 0
    tank = 0
    for i in range(n):
        tank += gas[i] - cost[i]
        if tank < 0:
            start = i + 1
            tank = 0
    print(start + 1)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\` — একটাই পাস, প্রতিটি স্টেশন একবার দেখা হয়; মেমোরি \`O(n)\`।

## সাধারণ ভুল
- প্রতিটি স্টেশন থেকে শুরু করে পুরো চক্র ঘুরিয়ে দেখলে \`O(n^2)\` — \`n = 200000\`-এ চলবে না।
- মোট যোগফলের যাচাই বাদ দিলে অসম্ভব রুটে ভুল স্টেশন ছাপা হয়ে যেতে পারে।
- ট্যাংক ঋণাত্মক হলে শুধু এক ঘর এগিয়ে \`start += 1\` করা — ঠিক কারণটা হলো মাঝের কোনো স্টেশন থেকেও এই বিন্দু পার হওয়া সম্ভব না; শুরুটা \`i + 1\`-এ ঠেলে দাও।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Greedy", "Prefix Sum", "Arrays"],
    tests: [
      { input: "5\n1 2 3 4 5\n3 4 5 1 2\n", expectedOutput: "4\n", isSample: true },
      { input: "3\n2 3 4\n3 4 3\n", expectedOutput: "-1\n", isSample: true },
      { input: "1\n5\n5\n", expectedOutput: "1\n", isSample: false },
      { input: "1\n3\n5\n", expectedOutput: "-1\n", isSample: false },
      { input: "4\n3 1 1 3\n2 2 2 2\n", expectedOutput: "4\n", isSample: false },
      {
        input: `200000\n${Array(200000).fill(2).join(" ")}\n${Array(200000).fill(1).join(" ")}\n`,
        expectedOutput: "1\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ngas = data[1:1 + n]\ncost = data[1 + n:1 + 2 * n]\nif sum(gas) < sum(cost):\n    print(-1)\nelse:\n    start = 0\n    tank = 0\n    for i in range(n):\n        tank += gas[i] - cost[i]\n        if tank < 0:\n            start = i + 1\n            tank = 0\n    print(start + 1)\n",
  },
  {
    slug: "learn-m3-greedy-m3",
    title: "Minimize Total Late Penalty",
    statement: `প্রাইমএশিয়ার ল্যাবে \`n\`টা কাজ একটাই মেশিনে পরপর চালাতে হবে — কাজ \`i\`-এর দৈর্ঘ্য \`a[i]\` (যত সময় লাগে) আর ডেডলাইন \`d[i]\`। কাজগুলোর ভাগ বাছাই করে সাজাতে হবে; কোনো কাজ ভাঙা যায় না, সবগুলোই করতে হবে। কাজটা শেষ হওয়ার সময় \`C\` হলে জরিমানা ধরা হয় \`C - d\` (ঋণাত্মক হলে বোনাস)। সাজানোর ক্রম বেছে মোট জরিমানার যোগফল যত ছোট করা যায় করো — সেই সর্বনিম্ন যোগফলটা ছাপাও।

উদাহরণ: কাজ \`(4,2)\`, \`(3,5)\`, \`(2,7)\` হলে ক্রম \`(2,7)\`, \`(3,5)\`, \`(4,2)\` নিলে সমাপ্তি \`2, 5, 9\` — যোগফল \`(2-7) + (5-5) + (9-2) = 2\`।`,
    inputFormat: `প্রথম লাইনে \`n\`; পরের \`n\` লাইনে প্রতিটিতে \`a d\` — দৈর্ঘ্য আর ডেডলাইন।`,
    outputFormat: `মোট জরিমানার সর্বনিম্ন সম্ভাব্য যোগফল।`,
    constraints: `\`1 <= n <= 200000\`
\`1 <= a, d <= 10^6\`; ফল 64-বিটে ফিট করে।`,
    editorial: `## ধারণা
মোট জরিমানা = সব সমাপ্তি সময়ের যোগফল থেকে সব ডেডলাইনের যোগফল বাদ। ডেডলাইনের যোগফল তো স্থির — তাই কাজ বাকি শুধু সমাপ্তির যোগফল কমানো। পরপর দুই কাজ \`(a1, d1)\`, \`(a2, d2)\` বিবেচনা করো: আগে \`(a1,...)\` চালালে অবদান \`a1 + (a1 + a2)\`, উল্টোটাতে \`a2 + (a1 + a2)\` — পার্থক্য \`a1 - a2\`। অর্থাৎ ছোট \`a\` আগে চালালেই যোগফল ছোট; ডেডলাইন এই তুলনায় কোনো ভূমিকা রাখে না। তাই ক্রমটা হলো দৈর্ঘ্য অনুযায়ী ছোট থেকে বড় — এই আদান-প্রদানের যুক্তিই প্রমাণ।

## ধাপে ধাপে
1. \`n\` আর সব \`(a, d)\` জোড়া পড়ো।
2. জোড়াগুলো \`a\` অনুযায়ী ছোট থেকে বড় সাজাও (\`sort()\` — টাই হলে যেকোনো ক্রমেই ফল সমান)।
3. চলমান সময় \`t = 0\`, যোগফল রাখার \`total = 0\` ধরে প্রতিটি কাজে: \`t += a\`, \`total += t - d\`।
4. \`total\` ছাপাও — ঋণাত্মক হলেও সেটাই সর্বোচ্চ বোনাস।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
tasks = []
idx = 1
for _ in range(n):
    a, d = data[idx], data[idx + 1]
    idx += 2
    tasks.append((a, d))
tasks.sort()
t = 0
total = 0
for a, d in tasks:
    t += a
    total += t - d
print(total)
\`\`\`

## কমপ্লেক্সিটি
সর্ট \`O(n log n)\`-ই ভারী কাজ; লুপ \`O(n)\`। মেমোরি \`O(n)\`।

## সাধারণ ভুল
- ডেডলাইন অনুযায়ী সাজানো — স্বাভাবিক ধারণা এটাই, কিন্তু তুলনায় কেবল দৈর্ঘ্য আসে; নমুনাটা হাতে মিলিয়ে দেখো।
- সব কাজ করতেই হবে — কোনো কাজ বাদ দেওয়ার সুযোগ নেই, কেবল ক্রমই বদলায়।
- সমাপ্তি সময় ৬৪-বিট ছাড়ায় যেতে পারে — \`n = 200000\`, \`a = 10^6\` হলে শেষ সময় প্রায় \`2 * 10^11\`; যোগফলও তার সমানুপাতিক।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Greedy", "Exchange Argument", "Sorting"],
    tests: [
      { input: "3\n4 2\n3 5\n2 7\n", expectedOutput: "2\n", isSample: true },
      { input: "1\n5 5\n", expectedOutput: "0\n", isSample: true },
      { input: "2\n1 1\n1 100\n", expectedOutput: "-98\n", isSample: false },
      { input: "3\n1 1000000\n1 1\n1 1\n", expectedOutput: "-999996\n", isSample: false },
      {
        input: `200000\n${Array(200000).fill("1 1").join("\n")}\n`,
        expectedOutput: "19999900000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ntasks = []\nidx = 1\nfor _ in range(n):\n    a, d = data[idx], data[idx + 1]\n    idx += 2\n    tasks.append((a, d))\ntasks.sort()\nt = 0\ntotal = 0\nfor a, d in tasks:\n    t += a\n    total += t - d\nprint(total)\n",
  },
  {
    slug: "learn-m3-greedy-h2",
    title: "Movie Festival with K Rooms",
    statement: `ফিল্ম ক্লাবের উৎসবে \`n\`টা সিনেমা দেখানোর প্ল্যান আছে — সিনেমা \`i\` চলবে \`s\` থেকে \`e\` (দুটো সময়ই ধরে), আর হাতে \`k\`টা প্রজেকশন রুম। এক রুমে পরের সিনেমা শুরু হতে পারবে শুধু আগেরটা শেষ হওয়ার পরে — শেষের মুহূর্তেই নতুনটা বসানো যাবে না। সর্বোচ্চ কতটা সিনেমা দেখানো যায়, সেটা বের করো।

উদাহরণ: সিনেমা \`(1,3)\`, \`(2,5)\`, \`(4,7)\`, \`(6,9)\`, \`(8,10)\` আর \`k = 2\` হলে সবগুলোই দুই রুমে সাজানো যায় — উত্তর \`5\`।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`k\`; পরের \`n\` লাইনে প্রতিটিতে \`s e\`।`,
    outputFormat: `দেখানো যায় এমন সিনেমার সর্বোচ্চ সংখ্যা।`,
    constraints: `\`1 <= n <= 100000\`, \`1 <= k <= n\`
\`1 <= s <= e <= 10^9\`।`,
    editorial: `## ধারণা
এক রুমের জন্য যে গ্রিডি চলে (শেষ সময় অনুযায়ী সাজিয়ে, আগের শেষের পরে শুরু হলে নাও) — \`k\` রুমে সেটাই প্রসারিত হয় রুমের বাছাই দিয়ে। সিনেমাগুলো শেষ সময় অনুযায়ী সাজাও; প্রতিটি সিনেমার জন্য খালি-সম্ভাব্য রুমগুলোর মধ্যে যে রুম সবচেয়ে দেরিতে শেষ হয়েছে (কিন্তু এই সিনেমার শুরুর আগেই) সেটাতেই বসাও। কারণ: আগে শেষ হওয়া রুম ভবিষ্যতের বেশি সিনেমা ধরতে পারে — সবচেয়ে নমনীয় রুমটা বাঁচিয়ে রাখাই লাভ। ব্যস্ত না হওয়া রুম আর না থাকলে \`k\`-এর ভিতরে নতুন রুম খোলো; রুমও শেষ, মিলও না — সিনেমাটা বাদ। রুমের শেষ-সময়গুলো একটা সাজানো লিস্টে রাখলে "সবচেয়ে দেরিতে শেষ হওয়া সামঞ্জস্যপূর্ণ রুম" খোঁজা হয় বাইনারি সার্চে।

## ধাপে ধাপে
1. সিনেমাগুলো \`(e, s)\` করে সাজাও — শেষ সময় আগে, শুরু পরে।
2. রুমের শেষ-সময়ের সাজানো লিস্ট \`rooms = []\` নাও, দেখানোর সংখ্যা \`0\`।
3. প্রতিটি সিনেমায়: \`bisect_left(rooms, s) - 1\` দিয়ে সবচেয়ে দেরির সামঞ্জস্যপূর্ণ রুমের অবস্থান নাও — \`i >= 0\` হলে ওই রুমের শেষ-সময় সরিয়ে নতুন \`e\` বসাও, সিনেমা বাড়াও।
4. নাহলে \`len(rooms) < k\` হলে \`e\` ঢোকাও — নতুন রুম; সিনেমা বাড়াও।
5. কিছুই না হলে সিনেমাটা বাদ; শেষে সংখ্যাটা ছাপাও।

\`\`\`python
import sys, bisect
data = list(map(int, sys.stdin.read().split()))
n, k = data[0], data[1]
movies = []
idx = 2
for _ in range(n):
    s, e = data[idx], data[idx + 1]
    idx += 2
    movies.append((e, s))
movies.sort()
rooms = []
shown = 0
for e, s in movies:
    i = bisect.bisect_left(rooms, s) - 1
    if i >= 0:
        rooms.pop(i)
        bisect.insort(rooms, e)
        shown += 1
    elif len(rooms) < k:
        bisect.insort(rooms, e)
        shown += 1
print(shown)
\`\`\`

## কমপ্লেক্সিটি
সর্ট \`O(n log n)\`; প্রতি সিনেমায় বাইনারি সার্চ \`O(log n)\` আর লিস্টে ঢোকানো-সরানো C-গতির সরণ — মোট প্রায় \`O(n log n)\`। মেমোরি \`O(k)\`।

## সাধারণ ভুল
- যেকোনো মিলে যাওয়া রুমে বসিয়ে দিলে সময় বাঁচে না — আগে শেষ হওয়া রুম পরের সিনেমাগুলোর জন্য বেশি কাজে লাগে, তাই দেরিরটাই খরচ করো।
- শুরুর সময় অনুযায়ী সাজানো — লম্বা সিনেমা আগে ঢুকে পরের ছোটগুলোকে ঠেকিয়ে দেয়; শেষ সময়ই সাজানোর মাপকাঠি।
- \`e >= s\` মানে শেষ মুহূর্তে শুরু সংঘর্ষ — খোঁজার সময় শর্ত রাখো \`rooms\`-এর মান \`s\`-এর চেয়ে কড়া ছোট।
- রুম খোলার সুযোগ \`k\`-এ সীমিত — সীমা মিলিয়ে দেখো, নাহলে বেশি সিনেমা গোনা হয়ে যায়।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Greedy", "Binary Search", "Interval Scheduling"],
    tests: [
      { input: "5 2\n1 3\n2 5\n4 7\n6 9\n8 10\n", expectedOutput: "5\n", isSample: true },
      { input: "3 1\n1 5\n2 3\n4 7\n", expectedOutput: "2\n", isSample: true },
      { input: "3 5\n1 3\n2 5\n4 7\n", expectedOutput: "3\n", isSample: false },
      { input: "4 1\n1 2\n2 3\n3 4\n4 5\n", expectedOutput: "2\n", isSample: false },
      {
        input: `100000 50000\n${Array.from({ length: 100000 }, (_, i) => `${2 * i + 1} ${2 * i + 2}`).join("\n")}\n`,
        expectedOutput: "100000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys, bisect\ndata = list(map(int, sys.stdin.read().split()))\nn, k = data[0], data[1]\nmovies = []\nidx = 2\nfor _ in range(n):\n    s, e = data[idx], data[idx + 1]\n    idx += 2\n    movies.append((e, s))\nmovies.sort()\nrooms = []\nshown = 0\nfor e, s in movies:\n    i = bisect.bisect_left(rooms, s) - 1\n    if i >= 0:\n        rooms.pop(i)\n        bisect.insort(rooms, e)\n        shown += 1\n    elif len(rooms) < k:\n        bisect.insort(rooms, e)\n        shown += 1\nprint(shown)\n",
  },
];
