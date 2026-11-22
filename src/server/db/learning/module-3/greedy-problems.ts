import type { SeedProblem } from "../../seed-problems";
import { lineInput } from "../generated-tests";
import { GREEDY_EXTRA_PROBLEMS } from "./greedy-extra-problems";

export const GREEDY_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m3-greedy-g1",
    title: "Minimum Coins for the Bill",
    statement: `ক্যান্টিনের ক্যাশ ডেস্কে ফেরত টাকা দিতে হয় মুদ্রায়। তুমার কাছে \`1\`, \`5\`, \`10\`, \`25\` টাকার মুদ্রা যত খুশি আছে — মোট \`amount\` টাকা ফেরত দিতে সবচেয়ে কম কয় মুদ্রা লাগবে বের করো। এই মুদ্রা সেটে সবচেয়ে বড়টা আগে নেওয়াই সবসময় সঠিক।

উদাহরণ: \`40\` টাকা → \`25 + 10 + 5\` — উত্তর \`3\`।`,
    inputFormat: `এক লাইনে একটা পূর্ণসংখ্যা \`amount\`।`,
    outputFormat: `সর্বনিম্ম মুদ্রা সংখ্যা।`,
    constraints: `\`0 <= amount <= 10^9\`; মুদ্রা মান \`1, 5, 10, 25\`, প্রতিটি যত খুশি।`,
    editorial: `## ধারণা
এই মুদ্রা সেট (১, ৫, ১০, ২৫) canonical — অর্থাৎ সবচেয়ে বড় মুদ্রাটা যতটুকু সম্ভব নিলেই বাকিটাও সর্বনিম্ম মুদ্রায় মেলে। তাই প্রতি ধাপে \`amount // coin\` গোনে আর \`amount % coin\` করে বাকিটা পরের মুদ্রায় ছেড়ে দিলেই হবে — কোনো পরিকল্পনা লাগে না। এখানে মনে রাখবে: গ্রিডি এখানে কাজ করে কারণ মুদ্রা সেটটার গুণ, সব সমস্যায় বড় মুদ্রা আগে নিলেই হবে এমন নয়।

## ধাপে ধাপে
1. \`amount\` পড়ো।
2. মুদ্রাগুলো বড় থেকে ছোট: \`25, 10, 5, 1\` — লুপ চালাও।
3. প্রতিটির জন্য \`count += amount // coin\` আর \`amount = amount % coin\`।
4. \`amount == 0\` হয়ে গেলে বাকি মুদ্রা অপ্রয়োজনীয়; শেষে \`count\` ছাপাও।

\`\`\`python
import sys
amount = int(sys.stdin.readline())
count = 0
for coin in (25, 10, 5, 1):
    count += amount // coin
    amount %= coin
print(count)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(1)\` — মাত্র চারটা মুদ্রা; মেমোরি \`O(1)\`। \`amount = 10^9\`-এও উত্তর সঙ্গে সঙ্গে।

## সাধারণ ভুল
- মুদ্রাগুলো ছোট থেকে বড় করে লুপ চালালে অকারণে অনেক মুদ্রা লাগে বা কাজ করে না — বড় থেকে ছোট করো।
- \`amount\` না কমিয়ে শুধু ভাগ দেখে যোগ করলে সব সময় একই ফল আসবে না — বাকিটা পরের ধাপে যেতে হবে।
- \`amount = 0\`-এ কোড ক্র্যাশ না করা উচিত — এখানে লুপই শূন্যবার চলে, উত্তর \`0\`।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Greedy", "Coins"],
    tests: [
      { input: "40\n", expectedOutput: "3\n", isSample: true },
      { input: "1\n", expectedOutput: "1\n", isSample: true },
      { input: "30\n", expectedOutput: "2\n", isSample: false },
      { input: "99\n", expectedOutput: "9\n", isSample: false },
      { input: "0\n", expectedOutput: "0\n", isSample: false },
      { input: "25\n", expectedOutput: "1\n", isSample: false },
      { input: "1000000000\n", expectedOutput: "40000000\n", isSample: false },
    ],
    referencePython:
      "import sys\namount = int(sys.stdin.readline())\ncount = 0\nfor coin in (25, 10, 5, 1):\n    count += amount // coin\n    amount %= coin\nprint(count)\n",
  },
  {
    slug: "learn-m3-greedy-g2",
    title: "Most Non-Overlapping Clubs",
    statement: `প্রাইমএশিয়া ক্লাবগুলো সেমিনার হলের ঘর বুক করেছে। প্রতিটি ক্লাবের জন্য \`s\` থেকে \`e\` সময় (দুটোই ধরে) দরকার, আর একটা ঘরে দুটো ক্লাব একসাথে থাকতে পারে না — একটার শেষ হওয়ার আগে পরেরটা শুরু হলে ঘর বদলাতে হবে। যত বেশি ক্লাব এক ঘরে চলতে পারে সেই সংখ্যাটা বের করো।

উদাহরণ: \`(1,3)\`, \`(2,5)\`, \`(4,6)\` হলে প্রথমটা শেষের পরে তৃতীয়টা বসে — উত্তর \`2\`।`,
    inputFormat: `প্রথম লাইনে \`n\`; পরের \`n\` লাইনে প্রতিটিতে \`s e\`।`,
    outputFormat: `এক ঘরে চলা সর্বোচ্চ ক্লাব সংখ্যা।`,
    constraints: `\`1 <= n <= 200000\`, \`1 <= s <= e <= 10^9\`।`,
    editorial: `## ধারণা
যে কাজ সবচেয়ে তাড়াতাড়ি শেষ হয়, সে ঘরের সবচেয়ে কম জায়গা খায় — তাই সেটা আগে বেছে নিলে পরেরদের জন্য সবচেয়ে বেশি জায়গা বাঁচে। এটাই exchange argument: কোনো অন্য সমাধানের প্রথম কাজটা যদি আমাদের বাছাইয়ের সাথে আলাদা হয়, তাকে আমাদেরটা দিয়ে বদলে দিলে উত্তর খারাপ হয় না — কারণ আমাদেরটা আগেই শেষ হয়ে যায়। শর্তটা একটু মনে রাখার: সময় ইনক্লুসিভ, তাই পরেরটার \`start\` আগেরটার \`end\`-এর চেয়ে বড় হতে হবে (\`start > lastEnd\`)।

## ধাপে ধাপে
1. \`n\` আর সব \`(s, e)\` জোড়া পড়ে তালিকা বানাও।
2. শেষ সময় অনুযায়ী সাজাও: \`pairs.sort(key=lambda p: p[1])\`।
3. \`lastEnd = None\`, কাউন্টার \`0\`; তালিকার প্রতিটি জোড়ায়: \`lastEnd\` না থাকলে বা \`s > lastEnd\` হলে বেছে নাও, \`lastEnd = e\` করো।
4. কাউন্টার ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
pairs = [(data[1 + 2 * i], data[2 + 2 * i]) for i in range(n)]
pairs.sort(key=lambda p: p[1])
count = 0
last_end = None
for start, end in pairs:
    if last_end is None or start > last_end:
        count += 1
        last_end = end
print(count)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n log n)\` (সর্ট) + \`O(n)\` লুপ; মেমোরি \`O(n)\`।

## সাধারণ ভুল
- শুরুর সময় দিয়ে সাজানো — দীর্ঘ কাজটা আগে ঢুকে পরের সবগুলো বাদ দিয়ে দেয়; শেষ সময় দিয়ে সাজাতে হয়।
- \`start >= lastEnd\` লিখে ফেলা: এক সময়ের শেষ ও পরের শুরু হুবহু মিললে ঘর বদলাতে হবে, তাই \`>\` চাই।
- টাই ভাঙার ক্রম এলোমেলো: \`sort(key=lambda p: (p[1], p[0]))\` করলে ফল সবসময় নির্দিষ্ট থাকে।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Greedy", "Activity Selection", "Sorting"],
    tests: [
      { input: "3\n1 3\n2 5\n4 6\n", expectedOutput: "2\n", isSample: true },
      { input: "1\n5 10\n", expectedOutput: "1\n", isSample: true },
      { input: "4\n1 2\n3 4\n5 6\n7 8\n", expectedOutput: "4\n", isSample: false },
      { input: "4\n1 10\n2 9\n3 8\n4 7\n", expectedOutput: "1\n", isSample: false },
      { input: "3\n1 1\n1 1\n1 1\n", expectedOutput: "1\n", isSample: false },
      {
        input: lineInput(
          Array.from({ length: 200000 }, (_, i) => `${2 * i + 1} ${2 * i + 2}`),
        ),
        expectedOutput: "200000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\npairs = [(data[1 + 2 * i], data[2 + 2 * i]) for i in range(n)]\npairs.sort(key=lambda p: p[1])\ncount = 0\nlast_end = None\nfor start, end in pairs:\n    if last_end is None or start > last_end:\n        count += 1\n        last_end = end\nprint(count)\n",
  },
  {
    slug: "learn-m3-greedy-e1",
    title: "Sum of the K Largest",
    statement: `নুসরাত বার্ষিক পুরস্কার তালিকা থেকে সর্বোচ্চ \`k\` জনের নম্বর মিলিয়ে মোট কত বের করছে। \`n\` জনের নম্বর দিলে সর্বোচ্চ \`k\` টার যোগফল জানাও — সমান নম্বর থাকলে ওগুলোও আলাদা আলাদা ধরা হবে।

উদাহরণ: \`1 9 3 7 5\` আর \`k = 2\` হলে \`9 + 7 = 16\`।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`k\`; দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা।`,
    outputFormat: `সর্বোচ্চ \`k\` সংখ্যার যোগফল।`,
    constraints: `\`1 <= k <= n <= 100000\`, \`-10^9 <= value <= 10^9\`; ফল 64-বিটে ফিট করে।`,
    editorial: `## ধারণা
সবচেয়ে বড় \`k\` টা নিতে হলে প্রথমেই সাজিয়ে ফেলা সবচেয়ে সহজ — বড় থেকে ছোট সাজালে প্রথম \`k\` টাই চাইলেটা। সাজানো না করে সর্বোচ্চ খোঁজে খোঁজেও চলে, কিন্তু তখন \`O(n * k)\`; সর্ট করলে \`O(n log n)\` এবং কোড এক লাইন — গ্রিডি মনে হলেও এখানে কাজের দরকার শুধু ক্রম।

## ধাপে ধাপে
1. \`n\`, \`k\` আর সব নম্বর পড়ো।
2. বড় থেকে ছোট করে সাজাও।
3. প্রথম \`k\` টার যোগফল নাও — \`sum(sorted(a, reverse=True)[:k])\`।
4. ফল ছাপাও; ঋণাত্মক নম্বর থাকলেও একই কথা।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, k = data[0], data[1]
a = sorted(data[2:], reverse=True)
print(sum(a[:k]))
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n log n)\` (সর্ট), মেমোরি \`O(n)\`; যোগ নিজে \`O(k)\`।

## সাধারণ ভুল
- বাইরে থেকে গোনা বা শেষ থেকে \`a[-k:]\` নিয়েও ছোট থেকে বড় সাজিয়ে দিলে উল্টো অংশ ধরা হয় — ক্রম আর স্লাইস মিলিয়ে দেখো।
- \`k > n\` ধরে চললে স্লাইস নিজে থেকে সীমা মানে, কিন্তু শর্তে \`k <= n\` দেওয়া আছে — দুই পক্ষেই কোড ঠিক থাকে।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Sorting", "Greedy"],
    tests: [
      { input: "5 2\n1 9 3 7 5\n", expectedOutput: "16\n", isSample: true },
      { input: "3 3\n4 4 4\n", expectedOutput: "12\n", isSample: true },
      { input: "4 1\n-5 -2 -9 -1\n", expectedOutput: "-1\n", isSample: false },
      { input: "1 1\n100\n", expectedOutput: "100\n", isSample: false },
      { input: "6 6\n1 2 3 4 5 6\n", expectedOutput: "21\n", isSample: false },
      {
        input: `100000 50000\n${Array.from({ length: 100000 }, (_, i) => i + 1).join(" ")}\n`,
        expectedOutput: "3750025000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, k = data[0], data[1]\na = sorted(data[2:], reverse=True)\nprint(sum(a[:k]))\n",
  },
  {
    slug: "learn-m3-greedy-m1",
    title: "Minimum Jumps Across the Yard",
    statement: `ক্যাম্পাস উঠান পার হতে হবে \`n\` টা ইটের ফাঁক বসানো পথে। প্রতিটি ইটের নিচে লেখা আছে সেখান থেকে সর্বোচ্চ কত ইট এগোনো যায়। প্রথম ইট থেকে শুরু করে শেষ ইটে পৌঁছাতে হবে — ন্যূনতম কতবার লাফ লাগবে? পথ সবসময় পৌঁছানো সম্ভব ধরা হবে।

উদাহরণ: \`2 3 1 1 4\` হলে প্রথম ইট থেকে দুইবারে (\`0 -> 1 -> 4\`) পৌঁছানো যায় — উত্তর \`2\`।`,
    inputFormat: `প্রথম লাইনে \`n\`; দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা — প্রতি ইট থেকে সর্বোচ্চ লাফ।`,
    outputFormat: `শেষ ইটে পৌঁছানোর ন্যূনতম লাফ সংখ্যা।`,
    constraints: `\`1 <= n <= 100000\`, \`0 <= jump <= 100000\`; পথ সবসময় পৌঁছানো সম্ভব।`,
    editorial: `## ধারণা
প্রতি ধাপে সবচেয়ে দূরে যাওয়া ইটটাই সেরা — কিন্তু লাফটা কখন দেবে তা ঠিক করতে হয়। ভাবো: এখন পর্যন্ত যে লাফগুলো দেওয়া হয়েছে, সেগুলোর মধ্যে সর্বোচ্চ কোথায় পৌঁছানো যায় (\`farthest\`)। যতক্ষণ পর্যন্ত এই সীমার ভিতরেই আছি, ততক্ষণ লাফ দিতে হয় নি; সীমাটা ছাড়ালেই একটা লাফ হয়ে গেল — তখন \`farthest\` নতুন সীমা। এই "সীমা ছাড়ালে লাফ" গ্রিডিই ন্যূনতম লাফ দেয়, কারণ প্রতিটি লাফে আমরা সম্ভব সবচেয়ে দূর গেছি।

## ধাপে ধাপে
1. \`n\` আর সব লাফ পড়ো; \`n == 1\` হলে আপাতত \`0\` লাফেই শেষ।
2. \`jumps = 0\`, বর্তমান সীমার শেষ \`cur_end = 0\`, সর্বোচ্চ পৌঁছানো \`farthest = 0\`।
3. শেষ ইট ছাড়া প্রতি ইটে \`farthest = max(farthest, i + jump)\` আপডেট করো।
4. ইটটা যদি ঠিক \`cur_end\` হয়, মানে এখন পর্যন্ত সীমা শেষ — \`jumps += 1\`, \`cur_end = farthest\`; সীমায় শেষ ইট পৌঁছালে থামো।
5. \`jumps\` ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
a = data[1:]
if n == 1:
    print(0)
else:
    jumps = cur_end = farthest = 0
    for i in range(n - 1):
        farthest = max(farthest, i + a[i])
        if i == cur_end:
            jumps += 1
            cur_end = farthest
            if cur_end >= n - 1:
                break
    print(jumps)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\` — এক পাস; মেমোরি \`O(1)\` অতিরিক্ত।

## সাধারণ ভুল
- সবসময় \`farthest\`-এ গিয়েই লাফ দেওয়া — না, লাফটা দিতে হয় সীমা (\`cur_end\`) পৌঁছালে; আগে দিলে লাফ গোনা বেশি হয়।
- \`n == 1\` হ্যান্ডেল না করলে লুপ চলেই না, উত্তর \`0\` — এখানে কোডে আলাদা শাখা ধরা আছে।
- শেষ ইটে পৌঁছানোর আগেও অকারণে লাফ গোনা — \`cur_end >= n - 1\` হলেই থামা উচিত, নাহলে এক লাফ বেশি যেতে পারে।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Greedy", "Arrays"],
    tests: [
      { input: "5\n2 3 1 1 4\n", expectedOutput: "2\n", isSample: true },
      { input: "1\n0\n", expectedOutput: "0\n", isSample: true },
      { input: "3\n1 1 1\n", expectedOutput: "2\n", isSample: false },
      { input: "6\n1 1 1 1 1 1\n", expectedOutput: "5\n", isSample: false },
      { input: "4\n4 0 0 0\n", expectedOutput: "1\n", isSample: false },
      { input: "5\n10 1 1 1 1\n", expectedOutput: "1\n", isSample: false },
      {
        input: `100000\n${Array(100000).fill(1).join(" ")}\n`,
        expectedOutput: "99999\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\nif n == 1:\n    print(0)\nelse:\n    jumps = cur_end = farthest = 0\n    for i in range(n - 1):\n        farthest = max(farthest, i + a[i])\n        if i == cur_end:\n            jumps += 1\n            cur_end = farthest\n            if cur_end >= n - 1:\n                break\n    print(jumps)\n",
  },
  {
    slug: "learn-m3-greedy-h1",
    title: "Minimum Candies for Children",
    statement: `হোস্টেলের অনুষ্ঠানে সারি ধরে \`n\` জন শিশু বসেছে। নিয়ম: প্রত্যেকে অন্তত একটা ক্যান্ডি পাবে; যার পাশের চেয়ে রেটিং (খুশির মাত্রা) বেশি, সে পাশের চেয়ে বেশি ক্যান্ডি পাবে। রেটিং সমান হলে বেশি-কমের শর্ত লাগবে না। মোট কত ক্যান্ডি কম লাগবে সেটা বের করো।

উদাহরণ: রেটিং \`1 0 2\` হলে সবচেয়ে কম \`2 + 1 + 2 = 5\` লাগে।`,
    inputFormat: `প্রথম লাইনে \`n\`; দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা — রেটিং।`,
    outputFormat: `ন্যূনতম মোট ক্যান্ডি।`,
    constraints: `\`1 <= n <= 100000\`, \`1 <= rating <= 100000\`; ফল 64-বিটে ফিট করে।`,
    editorial: `## ধারণা
এক পাসেই সব শর্ত মানা যায় না — বাঁ দিক আর ডান দিক দুটো শর্ত আলাদা। তাই দুইবার চলি। প্রথম পাশে বাঁ থেকে ডানে: যার রেটিং আগেরটার চেয়ে বেশি, তাকে আগেরটার চেয়ে এক বেশি দিই (সবাইকে এক দিয়ে শুরু)। তারপর ডান থেকে বাঁয়ে: যার রেটিং পরেরটার চেয়ে বেশি, তাকে পরেরটার চেয়ে বেশি দিতে হবে — কিন্তু আগের পাসে যা পেয়েছে সেটার বড় মানটাই রাখি (\`max\`), নাহলে আগের শর্ত ভেঙে যায়। এই "দুই পাশের সর্বোচ্চ" হিসাবটাই গুরুত্বপূর্ণ।

## ধাপে ধাপে
1. \`n\` আর সব রেটিং পড়ে \`candy = [1] * n\` বানাও।
2. \`i = 1 .. n-1\`: \`rating[i] > rating[i-1]\` হলে \`candy[i] = candy[i-1] + 1\`।
3. \`i = n-2 .. 0\`: \`rating[i] > rating[i+1]\` হলে \`candy[i] = max(candy[i], candy[i+1] + 1)\`।
4. \`sum(candy)\` ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
r = data[1:]
candy = [1] * n
for i in range(1, n):
    if r[i] > r[i - 1]:
        candy[i] = candy[i - 1] + 1
for i in range(n - 2, -1, -1):
    if r[i] > r[i + 1]:
        candy[i] = max(candy[i], candy[i + 1] + 1)
print(sum(candy))
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\` — দুটো পাস; মেমোরি \`O(n)\` (candy অ্যারে)। ক্রমবর্ধমান রেটিং-এ উত্তর \`1 + 2 + ... + n = n(n+1)/2\`।

## সাধারণ ভুল
- শুধু বাঁ-দিকের পাস করা — ডান পাশের বড় রেটিং বাদ পড়ে; \`1 0 2\`-এ \`2\` ও ক্যান্ডি কম পেত।
- দ্বিতীয় পাসে \`candy[i] = candy[i+1] + 1\` সরাসরি বসানো — প্রথম পাসের মান মুছে যায়; \`max\` লাগবে।
- সমান রেটিং-এ ও বেশি ধরে নেওয়া — \`1 2 2\`-এ তৃতীয়টাকে ১ই থাকতে হবে, না হলে অকারণে বেশি লাগে।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Greedy", "Arrays"],
    tests: [
      { input: "3\n1 0 2\n", expectedOutput: "5\n", isSample: true },
      { input: "3\n1 2 2\n", expectedOutput: "4\n", isSample: true },
      { input: "1\n5\n", expectedOutput: "1\n", isSample: false },
      { input: "4\n1 2 3 4\n", expectedOutput: "10\n", isSample: false },
      { input: "4\n4 3 2 1\n", expectedOutput: "10\n", isSample: false },
      {
        input: `100000\n${Array.from({ length: 100000 }, (_, i) => i + 1).join(" ")}\n`,
        expectedOutput: "5000050000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nr = data[1:]\ncandy = [1] * n\nfor i in range(1, n):\n    if r[i] > r[i - 1]:\n        candy[i] = candy[i - 1] + 1\nfor i in range(n - 2, -1, -1):\n    if r[i] > r[i + 1]:\n        candy[i] = max(candy[i], candy[i + 1] + 1)\nprint(sum(candy))\n",
  },
  ...GREEDY_EXTRA_PROBLEMS,
];
