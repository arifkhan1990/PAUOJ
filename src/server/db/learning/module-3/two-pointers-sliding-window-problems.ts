import type { SeedProblem } from "../../seed-problems";
import { TWO_POINTERS_SLIDING_WINDOW_EXTRA_PROBLEMS } from "./two-pointers-sliding-window-extra-problems";

export const TWO_POINTERS_SLIDING_WINDOW_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m3-two-pointers-sliding-window-g1",
    title: "Count Pairs with Exact Total",
    statement: `তানভির ক্যাম্পাস স্টেশনারিতে দুটো আইটেম একসাথে নিলে মোট ঠিক \`T\` টাকা হয় — এমন কত জোড়া আছে বলতে চায়। তুমি \`n\`টি দাম দিলে বলো \`i < j\` এমন কতগুলো জোড়ায় \`a[i] + a[j] = T\` হয়। সব দাম আলাদা — কোনো মান দুইবার আসে না।

উদাহরণ: \`1 4 6 9 3\` আর \`T = 10\` হলে জোড়া \`(1, 9)\` আর \`(4, 6)\` — উত্তর \`2\`।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`T\`; দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা (আলাদা আলাদা মান)।`,
    outputFormat: `যোগফল \`T\` এমন জোড়ার সংখ্যা এক লাইনে।`,
    constraints: `\`1 <= n <= 200000\`, \`-10^9 <= value, T <= 10^9\`
সব মান আলাদা।`,
    editorial: `## ধারণা
দুই লুপে \`i < j\` সব জোড়া মিলিয়ে \`O(n^2)\` সময় লাগবে — \`n = 200000\`-এ চলবে না। কিন্তু অ্যারে সর্ট করে দুইটা পয়েন্টার রাখলে যে জোড়া ছোট, সে বাঁয়ে; বড়টা ডানে। যোগফল \`T\` এর চেয়ে ছোট হলে \`l\` এগিয়ে দিলেই ছোট মান আসে; বড় হলে \`r\` সরালেই কমে। মান আলাদা ধরায় প্রতি ধাপে শুধু একটা পয়েন্টার সরালেই হয়, আর কখনো পেছনে ফরে না — পুরো জোড়া একবারই পাশ কাটে।

## ধাপে ধাপে
1. \`n\` আর \`T\` পড়ে অ্যারে \`sort\` করো।
2. \`l = 0\`, \`r = n - 1\` বসাও, উত্তর শূন্য দিয়ে শুরু করো।
3. \`l < r\` পর্যন্ত চালাও: \`s = a[l] + a[r]\`।
4. \`s == T\` হলে উত্তর বাড়াও এবং দুই পয়েন্টারই সরাও; \`s < T\` হলে \`l += 1\`; নাহলে \`r -= 1\`।
5. শেষে উত্তর ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, t = data[0], data[1]
a = sorted(data[2:])
l, r, cnt = 0, n - 1, 0
while l < r:
    s = a[l] + a[r]
    if s == t:
        cnt += 1
        l += 1
        r -= 1
    elif s < t:
        l += 1
    else:
        r -= 1
print(cnt)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n log n)\` (সর্ট ভারী), লুপ নিজে \`O(n)\`। মেমোরি \`O(n)\`।

## সাধারণ ভুল
- সর্ট না করে লুপ চালালে উত্তর ভুল — \`1 4 6 9 3\` এলোমেলো থাকলে পয়েন্টার কথা মানবে না।
- মিলে গেলে \`l += 1\` না দিয়ে শুধু গোনা এবং লুপ না সরালে \`l == r\` অবস্থায় আটকে যায়; মান আলাদা ধরায় দুই পয়েন্টারই সরানো নিরাপদ।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Two Pointers", "Sorting"],
    tests: [
      { input: "5 10\n1 4 6 9 3\n", expectedOutput: "2\n", isSample: true },
      { input: "3 100\n1 2 3\n", expectedOutput: "0\n", isSample: true },
      { input: "4 0\n-5 5 -2 2\n", expectedOutput: "2\n", isSample: false },
      { input: "1 5\n5\n", expectedOutput: "0\n", isSample: false },
      { input: "6 7\n1 2 3 4 5 6\n", expectedOutput: "3\n", isSample: false },
      {
        input: `200000 200001\n${Array.from({ length: 200000 }, (_, i) => i + 1).join(" ")}\n`,
        expectedOutput: "100000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, t = data[0], data[1]\na = sorted(data[2:])\nl, r, cnt = 0, n - 1, 0\nwhile l < r:\n    s = a[l] + a[r]\n    if s == t:\n        cnt += 1\n        l += 1\n        r -= 1\n    elif s < t:\n        l += 1\n    else:\n        r -= 1\nprint(cnt)\n",
  },
  {
    slug: "learn-m3-two-pointers-sliding-window-g2",
    title: "Busiest Fixed-Size Window",
    statement: `ক্যাম্পাস গেটের ভিড় গোনার সেন্সর প্রতি ঘণ্টায় একটা করে সংখ্যা দেয়। তুমি \`k\` ঘণ্টার যেকোনো টানা সময়ের মোট ভিড় বের করতে চাও — কোন \`k\` ঘণ্টার অংশে সবচেয়ে বেশি মানুষ এসেছে? শুরু আর শেষ ঘণ্টা দুটোই ধরা হবে।

উদাহরণ: \`1 4 2 8 5\` আর \`k = 3\` হলে তিনটা উইন্ডো \`7\`, \`14\`, \`15\` — উত্তর \`15\`।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`k\`; দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা।`,
    outputFormat: `দৈর্ঘ্য \`k\`-এর যেকোনো উইন্ডোর সর্বোচ্চ যোগফল।`,
    constraints: `\`1 <= k <= n <= 200000\`
\`0 <= value <= 10^9\`, যোগফল 64-বিটে ফিট করে।`,
    editorial: `## ধারণা
প্রতিটি উইন্ডো আলাদা করে যোগ করলে \`O(n * k)\` — অথচ পরপর দুটো উইন্ডোর মাঝে শুধু একটা মান বদলায়: পুরনো শুরুটা বেরিয়ে যায়, নতুন শেষটা ঢোকে। তাই প্রথম উইন্ডো একবার যোগ করে রেখে প্রতি ধাপে \`cur += a[i] - a[i - k]\` করলেই হবে — পুরো কাজ \`O(n)\`। এটাই sliding window-র প্রথম রূপ: fixed size।

## ধাপে ধাপে
1. \`n\`, \`k\` আর সব মান পড়ো।
2. প্রথম \`k\` মানের যোগফল \`cur\` ধরো, \`best = cur\`।
3. \`i = k\` থেকে \`n - 1\` লুপ চালাও: \`cur += a[i] - a[i - k]\`।
4. প্রতিবার \`best = max(best, cur)\` করো।
5. শেষে \`best\` ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, k = data[0], data[1]
a = data[2:]
cur = sum(a[:k])
best = cur
for i in range(k, n):
    cur += a[i] - a[i - k]
    if cur > best:
        best = cur
print(best)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\`, অতিরিক্ত মেমোরি \`O(1)\` — শুধু দুটো ভেরিয়েবল।

## সাধারণ ভুল
- লুপ \`i = 1\` থেকে শুরু করে \`a[i] - a[i - k]\` বসালে নেগেটিভ ইনডেক্সে চলে যায় — শুরু \`i = k\`।
- শুরুর উইন্ডো গুনো না হলে \`k = n\` অবস্থায় লুপ একদমই চলে না, উত্তর ফাঁকা বা ভুল আসে।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Sliding Window", "Arrays"],
    tests: [
      { input: "5 3\n1 4 2 8 5\n", expectedOutput: "15\n", isSample: true },
      { input: "3 3\n2 2 2\n", expectedOutput: "6\n", isSample: true },
      { input: "4 1\n5 1 9 3\n", expectedOutput: "9\n", isSample: false },
      { input: "4 4\n1 2 3 4\n", expectedOutput: "10\n", isSample: false },
      { input: "6 2\n0 0 0 0 0 7\n", expectedOutput: "7\n", isSample: false },
      {
        input: `200000 100000\n${Array(200000).fill(10).join(" ")}\n`,
        expectedOutput: "1000000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, k = data[0], data[1]\na = data[2:]\ncur = sum(a[:k])\nbest = cur\nfor i in range(k, n):\n    cur += a[i] - a[i - k]\n    if cur > best:\n        best = cur\nprint(best)\n",
  },
  {
    slug: "learn-m3-two-pointers-sliding-window-e1",
    title: "Count Pairs with Given Difference",
    statement: `সাদিয়ার নিয়ম: উচ্চতার পার্থক্য হুবহু \`D\` সেন্টিমিটার হলে দুটো বই এক শেলফে বসতে পারে। কতগুলো জোড়া বইয়ের উচ্চতার পার্থক্য হুবহু \`D\`, সেটা গোনো। সব উচ্চতা আলাদা।

উদাহরণ: \`1 4 2 7 5\` আর \`D = 2\` হলে জোড়া \`(2, 4)\` আর \`(5, 7)\` — উত্তর \`2\`।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`D\`; দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা (আলাদা মান)।`,
    outputFormat: `পার্থক্য হুবহু \`D\` এমন জোড়ার সংখ্যা।`,
    constraints: `\`1 <= n <= 200000\`, \`1 <= D <= 10^9\`, \`-10^9 <= value <= 10^9\`
সব মান আলাদা।`,
    editorial: `## ধারণা
সর্ট করে ফেললে পার্থক্য খোঁজাটা হুবহু যোগফল খোঁজার মতো, শুধু শর্তটা \`a[r] - a[l] = D\`। ক্রমানুসারে থাকায় \`l\` ঠিক রাখলে \`r\` কেবল সামনেই যেতে পারে: \`a[r] - a[l]\` ছোট হলে \`r\` বাড়াতে হবে, বড় হলে \`l\` সামনে সরাতে হবে। দুই পয়েন্টারের কোনোটাই পেছনে যায় না, তাই পুরো কাজ একবার পাশ কাটে। মান আলাদা ধরায় এক \`l\`-এর জন্য সর্বোচ্চ একটাই \`r\` মিলবে।

## ধাপে ধাপে
1. অ্যারে \`sort\` করো।
2. \`l = 0\`, \`r = 0\`, উত্তর শূন্য দিয়ে শুরু করো।
3. \`l < n\` পর্যন্ত: \`r < n\` এবং \`a[r] - a[l] < D\` হলে \`r += 1\` চালাও।
4. \`r < n\` এবং \`a[r] - a[l] == D\` হলে উত্তর বাড়াও।
5. \`l += 1\` করে পরের ঘরে যাও; শেষে উত্তর ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, d = data[0], data[1]
a = sorted(data[2:])
l = r = 0
cnt = 0
while l < n:
    while r < n and a[r] - a[l] < d:
        r += 1
    if r < n and a[r] - a[l] == d:
        cnt += 1
    l += 1
print(cnt)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n log n)\` (সর্ট) আর পয়েন্টার লুপ \`O(n)\`; মেমোরি \`O(n)\`।

## সাধারণ ভুল
- সর্ট না করে \`D\` এর জন্য জোড়া খুঁজলে ভুল হয় — পাশাপাশি থাকা দরকার।
- প্রতি \`l\`-এ \`r = l + 1\` রিসেট করলে কাজ ঠিকই হয়, কিন্তু তখন \`O(n^2)\` — \`r\`-কে আগের অবস্থান থেকেই বাড়াতে হয়।
- \`a[r] - a[l]\` এর জায়গায় \`abs(a[r] - a[l])\` ধরলে সর্টের পরেও অর্থহীন; ক্রম থাকায় ঋণাত্মক হবেই না।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Two Pointers", "Sorting"],
    tests: [
      { input: "5 2\n1 4 2 7 5\n", expectedOutput: "2\n", isSample: true },
      { input: "3 10\n1 2 3\n", expectedOutput: "0\n", isSample: true },
      { input: "2 5\n10 5\n", expectedOutput: "1\n", isSample: false },
      { input: "6 1\n6 1 3 2 5 4\n", expectedOutput: "5\n", isSample: false },
      { input: "4 3\n-2 1 4 -5\n", expectedOutput: "3\n", isSample: false },
      {
        input: `200000 1\n${Array.from({ length: 200000 }, (_, i) => i + 1).join(" ")}\n`,
        expectedOutput: "199999\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, d = data[0], data[1]\na = sorted(data[2:])\nl = r = 0\ncnt = 0\nwhile l < n:\n    while r < n and a[r] - a[l] < d:\n        r += 1\n    if r < n and a[r] - a[l] == d:\n        cnt += 1\n    l += 1\nprint(cnt)\n",
  },
  {
    slug: "learn-m3-two-pointers-sliding-window-m1",
    title: "Longest Days Within Budget",
    statement: `নুসরাত তার ক্লাবের টাকার হিসাব একটা ফাইলে লিখছে — প্রতিদিনের খরচ আলাদা, কিন্তু টানা কোনো অংশের মোট খরচ বাজেট \`K\` ছাড়া হতে পারে না। টানা কতগুলো দিনের অংশ এমন হতে পারে সবচেয়ে লম্বা, সেটাই বের করো। আর যদি প্রতিটি দিনের খরচই \`K\`-এর বেশি হয়, কোনো অংশই হয় না — উত্তর \`0\`।

উদাহরণ: \`2 3 1 4 6 2\` আর \`K = 10\` হলে \`2 3 1 4\` এর যোগফল \`10\` — উত্তর \`4\`।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`K\`; দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা।`,
    outputFormat: `যোগফল \`K\`-এর মধ্যে থাকা সবচেয়ে লম্বা টানা অংশের দৈর্ঘ্য।`,
    constraints: `\`1 <= n <= 200000\`
\`0 <= value <= 10^9\`, \`0 <= K <= 10^14\`
সব মান অ-ঋণাত্মক।`,
    editorial: `## ধারণা
অ-ঋণাত্মক মানে ডানে একটা মান যোগ করলে যোগফল কখনো ছোট হয় না — এই একটা গুণই উইন্ডোকে কাজের করে। \`r\` ডানে বাড়াতে থাকি, যোগফল \`K\` ছাড়ালে \`l\` সরিয়ে যতক্ষণ ফেরত আনি না যোগফল ঠিক হয়ে যায়। কারণ মান অ-ঋণাত্মক, \`l\` কখনো পেছনে যেতে হয় না — প্রতিটি পয়েন্টার সর্বোচ্চ \`n\` বার চলে, তাই মোট \`O(n)\`।

## ধাপে ধাপে
1. \`n\`, \`K\` আর সব মান পড়ো।
2. \`l = 0\`, চলমান যোগফল \`cur = 0\`, উত্তর \`best = 0\`।
3. \`r = 0\` থেকে শেষ পর্যন্ত: \`cur += a[r]\`।
4. \`cur > K\` হলে \`cur -= a[l]\`, \`l += 1\` — যতক্ষণ না শর্ত ফিরে আসে এটা চালাও।
5. প্রতিবার \`best = max(best, r - l + 1)\`।
6. শেষে \`best\` ছাপাও; প্রতিটি দিনের খরচ \`K\` ছাড়া হলে \`best\` শূন্যই থাকবে।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, k = data[0], data[1]
a = data[2:]
left = cur = best = 0
for right in range(n):
    cur += a[right]
    while cur > k:
        cur -= a[left]
        left += 1
    if right - left + 1 > best:
        best = right - left + 1
print(best)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\` — প্রতিটি পয়েন্টার সর্বোচ্চ \`n\` বার চলে; মেমোরি \`O(1)\` অতিরিক্ত।

## সাধারণ ভুল
- ঋণাত্মক মান থাকলে "শুধু \`l\` বাড়া" কৌশল ভাঙে — পরের মান ঋণাত্মক হলে যোগফল আবার কমতে পারে। এখানে শর্তে অ-ঋণাত্মক তাই নিরাপদ।
- শর্ত ভাঙার আগে \`best\` আপডেট করে ফেলা: ভাঙা উইন্ডোর লেংথ ধরা মানে ভুল উত্তর। সঠিক ক্রম — আগে \`while\` শর্ত ঠিক করো, তারপর \`best\` দেখো।
- \`best\` শূন্য দিয়ে শুরু না করে লিস্টের প্রথম মান ধরলে \`K = 0\` আর প্রথম মান \`0\` না হলে ভুল হয়।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Sliding Window", "Two Pointers"],
    tests: [
      { input: "6 10\n2 3 1 4 6 2\n", expectedOutput: "4\n", isSample: true },
      { input: "3 5\n10 10 10\n", expectedOutput: "0\n", isSample: true },
      { input: "1 0\n0\n", expectedOutput: "1\n", isSample: false },
      { input: "5 100\n1 2 3 4 5\n", expectedOutput: "5\n", isSample: false },
      { input: "4 3\n1 1 1 5\n", expectedOutput: "3\n", isSample: false },
      { input: "7 0\n0 0 0 0 0 0 0\n", expectedOutput: "7\n", isSample: false },
      {
        input: `200000 150000\n${Array(200000).fill(1).join(" ")}\n`,
        expectedOutput: "150000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, k = data[0], data[1]\na = data[2:]\nleft = cur = best = 0\nfor right in range(n):\n    cur += a[right]\n    while cur > k:\n        cur -= a[left]\n        left += 1\n    if right - left + 1 > best:\n        best = right - left + 1\nprint(best)\n",
  },
  {
    slug: "learn-m3-two-pointers-sliding-window-h1",
    title: "Sliding Window Maximum",
    statement: `ক্যাম্পাস গেটের ভিড় মাপার সেন্সর প্রতি ঘণ্টায় একটা করে সংখ্যা দেয়। এবার তানভির জানতে চায় প্রতি \`k\` ঘণ্টার টানা অংশে সর্বোচ্চ ভিড় কত ছিল — ঘণ্টা \`1..k\`, তারপর \`2..k+1\`, এভাবে শেষ পর্যন্ত। প্রতিটি অংশের সর্বোচ্চ মান এক লাইনে ছাপাও।

উদাহরণ: \`1 4 2 8 5\` আর \`k = 2\` হলে অংশগুলো \`[1,4]\`, \`[4,2]\`, \`[2,8]\`, \`[8,5]\` — উত্তর \`4 4 8 8\`।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`k\`; দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা।`,
    outputFormat: `মোট \`n - k + 1\`টি সংখ্যা — প্রতিটি \`k\` ঘণ্টার অংশের সর্বোচ্চ মান, এক লাইনে স্পেস দিয়ে আলাদা।`,
    constraints: `\`1 <= k <= n <= 200000\`
\`0 <= value <= 10^9\`।`,
    editorial: `## ধারণা
প্রতিটি উইন্ডো আলাদা করে সর্বোচ্চ খুঁজলে \`O(n * k)\` — \`n = 200000\`-এ চলবে না। মূল পর্যবেক্ষণ: নতুন মান \`a[i]\` এলে, তার আগের যেসব মান তার চেয়ে ছোট বা সমান, তারা আর কখনো সর্বোচ্চ হতে পারে না — নতুনটা তাদের চেয়ে বড় এবং উইন্ডোতে তাদের চেয়ে বেশি সময় থাকবে। তাই একটা deque-তে (দুই-মুখো সারি) শুধু "সম্ভাব্য সর্বোচ্চ" ঘরগুলোর ইনডেক্স রাখি — মানগুলো সবসময় বড় থেকে ছোট ক্রমে, তাই সামনেরটা (front) এখনকার উইন্ডোর সর্বোচ্চ। প্রতিটি ঘর deque-তে একবার ঢোকে, সর্বোচ্চ একবার বের হয় — মোট কাজ \`O(n)\`। এই কাঠামোর নাম monotonic queue।

## ধাপে ধাপে
1. \`n\`, \`k\` আর সব মান পড়ো; খালি \`dq\` নাও — এতে থাকবে ইনডেক্স, মান নয়।
2. প্রতিটি \`i = 0..n-1\`-এ: পেছন থেকে \`a[dq[-1]] <= a[i]\` হলে পপ করো — ওরা আর সর্বোচ্চ হতে পারবে না।
3. \`i\` ঢোকাও deque-এর পেছনে।
4. \`dq[0] <= i - k\` হলে সামনেরটা উইন্ডোর বাইরে — front থেকে বাদ দাও।
5. \`i >= k - 1\` হলে উইন্ডো পূর্ণ — \`a[dq[0]]\` উত্তরের লিস্টে রাখো।
6. সব উত্তর এক লাইনে স্পেস দিয়ে ছাপাও।

\`\`\`python
import sys
from collections import deque
data = list(map(int, sys.stdin.read().split()))
n, k = data[0], data[1]
a = data[2:]
dq = deque()
out = []
for i in range(n):
    while dq and a[dq[-1]] <= a[i]:
        dq.pop()
    dq.append(i)
    if dq[0] <= i - k:
        dq.popleft()
    if i >= k - 1:
        out.append(str(a[dq[0]]))
print(" ".join(out))
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\` — প্রতিটি ইনডেক্স deque-তে একবার ঢোকে, সর্বোচ্চ একবার বের হয়; মেমোরি \`O(k)\`।

## সাধারণ ভুল
- উইন্ডোর বাইরে চলে যাওয়া পুরনো ইনডেক্স front-এ রেখে দেওয়া — ভুল মান সর্বোচ্চ হয়ে যায়; প্রতি ধাপে \`dq[0] <= i - k\` যাচাই করো।
- deque-তে মান রেখে ইনডেক্স হারানো — কোন ঘর উইন্ডোর বাইরে গেছে সেটা ধরতে ইনডেক্সই রাখতে হয়।
- \`a[dq[-1]] < a[i]\` (শুধু ছোট) দিয়ে পপ করলে সমান মান জমে যায় — উত্তর ঠিক থাকে, কিন্তু \`<=\` দিলে deque ছোট থাকে।
- \`i >= k - 1\` শর্ত ছাড়া ছাপলে প্রথম \`k - 1\` ঘরের অসম্পূর্ণ উইন্ডোর বাড়তি উত্তর এসে যায়।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Sliding Window", "Deque", "Monotonic Queue"],
    tests: [
      { input: "5 2\n1 4 2 8 5\n", expectedOutput: "4 4 8 8\n", isSample: true },
      { input: "8 3\n1 4 2 8 5 3 9 6\n", expectedOutput: "4 8 8 8 9 9\n", isSample: true },
      { input: "4 1\n7 2 9 2\n", expectedOutput: "7 2 9 2\n", isSample: false },
      { input: "5 5\n2 1 3 1 5\n", expectedOutput: "5\n", isSample: false },
      { input: "5 2\n9 7 5 3 1\n", expectedOutput: "9 7 5 3\n", isSample: false },
      { input: "5 2\n3 3 3 3 3\n", expectedOutput: "3 3 3 3\n", isSample: false },
      {
        input: `200000 100000\n${Array.from({ length: 200000 }, (_, i) => 200000 - i).join(" ")}\n`,
        expectedOutput: `${Array.from({ length: 100001 }, (_, i) => 200000 - i).join(" ")}\n`,
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\ndata = list(map(int, sys.stdin.read().split()))\nn, k = data[0], data[1]\na = data[2:]\ndq = deque()\nout = []\nfor i in range(n):\n    while dq and a[dq[-1]] <= a[i]:\n        dq.pop()\n    dq.append(i)\n    if dq[0] <= i - k:\n        dq.popleft()\n    if i >= k - 1:\n        out.append(str(a[dq[0]]))\nprint(\" \".join(out))\n",
  },
  ...TWO_POINTERS_SLIDING_WINDOW_EXTRA_PROBLEMS,
];
