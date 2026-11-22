import type { SeedProblem } from "../../seed-problems";

export const SORTING_SEARCHING_PRACTICE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m3-sorting-searching-e2",
    title: "Count Books Within Price",
    statement: `নুসরাত বইমেলার স্টলে সহায়তা করছিল। ক্রেতারা বারবার একই প্রশ্ন করছিল — "X টাকা বা তার কমে কত বই পাওয়া যায়?" প্রতিবার পুরো তালিকা ঘেঁটে দেখা সময়ের অপচয়। অবশেষে সে দামগুলো একবার ছোট থেকে বড় করে সাজিয়ে রাখল — এবার প্রতিটা প্রশ্নের উত্তর বাইনারি সার্চে মুহূর্তেই মিলে যায়। তুমিও দামের তালিকা আর \`q\`টা প্রশ্ন পেয়ে প্রতিটার উত্তর দাও।

উদাহরণ: দাম \`10 20 15 30\` আর প্রশ্ন \`15\` হলে \`10\` আর \`15\` মেলে — উত্তর \`2\`।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`q\`। দ্বিতীয় লাইনে \`n\`টি দাম (এলোমেলো ক্রমে)। পরের \`q\` লাইনে প্রতিটিতে একটা করে বাজেট \`X\`।`,
    outputFormat: `\`q\` লাইন; প্রতি লাইনে সেই বাজেটের মধ্যে বইয়ের সংখ্যা।`,
    constraints: `\`1 <= n, q <= 200000\`
\`-10^9 <= দাম, X <= 10^9\`।`,
    editorial: `## ধারণা
এক প্রশ্নের উত্তর হলো "প্রথম \`X\`-এর বড় দামের আগ পর্যন্ত বই" — অর্থাৎ \`upper_bound\`। দামগুলো একবার সর্ট করে রাখলে Python-এর \`bisect_right\` সেই ঘরটা \`O(log n)\`-এ দিয়ে দেয়, আর ঘরের ইনডেক্সই সংখ্যা — \`X\` বা তার ছোট মানগুলো সবই ওই ঘরের আগে। \`q\`টা প্রশ্ন থাকলে সর্ট একবার \`O(n log n)\`, প্রতিটা প্রশ্ন শুধু \`O(log n)\` — প্রতিবার লুপ ঘোরানোর চেয়ে অনেক দ্রুত।

## ধাপে ধাপে
1. \`n\`, \`q\` আর সব দাম পড়ে দামগুলো \`sort\` করো।
2. প্রতিটি প্রশ্ন \`X\`-এর জন্য \`bisect_right(prices, X)\` বের করো — এটাই \`<= X\` দামের বইয়ের সংখ্যা।
3. উত্তরগুলো এক লিস্টে জমা করে শেষে এক এক লাইনে ছাপাও।

\`\`\`python
import sys, bisect
data = list(map(int, sys.stdin.read().split()))
n, q = data[0], data[1]
prices = sorted(data[2:2 + n])
out = []
for j in range(q):
    x = data[2 + n + j]
    out.append(str(bisect.bisect_right(prices, x)))
print("\\n".join(out))
\`\`\`

## কমপ্লেক্সিটি
সর্ট \`O(n log n)\`, প্রতি প্রশ্ন \`O(log n)\` — মোট \`O((n + q) log n)\`, মেমোরি \`O(n)\`।

## সাধারণ ভুল
- \`bisect_left\` ব্যবহার করলে হুবহু \`X\` দামের বইটা গোনা হয় না — "X বা কম" মানে \`bisect_right\`।
- প্রতি প্রশ্নে লুপ চালিয়ে গুনলে \`O(n * q)\` — \`n = q = 200000\`-এ সময় শেষ হয়ে যাবে।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Sorting", "Binary Search", "Upper Bound"],
    tests: [
      { input: "4 3\n10 20 15 30\n15\n30\n5\n", expectedOutput: "2\n4\n0\n", isSample: true },
      { input: "1 1\n7\n7\n", expectedOutput: "1\n", isSample: true },
      { input: "3 2\n-5 -10 0\n-10\n-4\n", expectedOutput: "1\n2\n", isSample: false },
      { input: "2 2\n1000000000 -1000000000\n-1000000000\n1000000000\n", expectedOutput: "1\n2\n", isSample: false },
      {
        input: `200000 3\n${Array.from({ length: 200000 }, (_, i) => 200000 - i).join(" ")}\n100000\n200000\n0\n`,
        expectedOutput: "100000\n200000\n0\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys, bisect\ndata = list(map(int, sys.stdin.read().split()))\nn, q = data[0], data[1]\nprices = sorted(data[2:2 + n])\nout = []\nfor j in range(q):\n    x = data[2 + n + j]\n    out.append(str(bisect.bisect_right(prices, x)))\nprint(\"\\n\".join(out))\n",
  },
  {
    slug: "learn-m3-sorting-searching-e3",
    title: "Nearest Temperature Reading",
    statement: `তানভির আবহাওয়া ক্লাবের রিপোর্ট ঘাঁটছিল — সেন্সরের \`n\`টা রিডিং এলোমেলোভাবে লেখা। অধ্যাপক জানতে চান লক্ষ্য তাপমাত্রা \`T\`-এর সবচেয়ে কাছের রিডিং কোনটা। পার্থক্য সমান হলে ছোট রিডিংটাই উত্তর। তুমি সেই রিডিংটা বের করো।

উদাহরণ: রিডিং \`10 2 8 5\` আর \`T = 7\` হলে \`8\` সবচেয়ে কাছে (পার্থক্য \`1\`)।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`T\`। দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা — রিডিং।`,
    outputFormat: `\`T\`-এর সবচেয়ে কাছের রিডিং এক লাইনে (টাই হলে ছোটটা)।`,
    constraints: `\`1 <= n <= 200000\`
\`-10^9 <= রিডিং, T <= 10^9\`।`,
    editorial: `## ধারণা
এলোমেলো রিডিংয়ের মধ্যে সবচেয়ে কাছেরটা খোঁজা কঠিন, কিন্তু সর্ট করলে \`T\`-এর কাছের রিডিংগুলো পাশাপাশি বসে। \`bisect_left\` দিয়ে \`T\` বসার ঘরটা বের করো — উত্তর হয় সেই ঘরের মান, নাহলে তার আগের ঘরের মান, কারণ বাকি সব আরও দূরে। দুটো প্রার্থীর পার্থক্য মেপে ছোটটা নাও; পার্থক্য সমান হলে বাঁয়ের (ছোট) মানটাই রাখো।

## ধাপে ধাপে
1. রিডিংগুলো \`sort\` করো।
2. \`i = bisect_left(readings, T)\` নাও — প্রথম \`>= T\` এর ঘর।
3. \`i < n\` হলে প্রার্থী \`readings[i]\`; \`i > 0\` হলে প্রার্থী \`readings[i-1]\`।
4. পার্থক্য ছোট প্রার্থীটাই উত্তর; সমান হলে ছোট মানটা নাও।

\`\`\`python
import sys, bisect
data = list(map(int, sys.stdin.read().split()))
n, t = data[0], data[1]
a = sorted(data[2:])
i = bisect.bisect_left(a, t)
best = None
if i < n:
    best = a[i]
if i > 0:
    cand = a[i - 1]
    if best is None or abs(cand - t) <= abs(best - t):
        best = cand
print(best)
\`\`\`

## কমপ্লেক্সিটি
সর্ট \`O(n log n)\`, সার্চ \`O(log n)\` — মোট \`O(n log n)\`, মেমোরি \`O(n)\`।

## সাধারণ ভুল
- সর্ট না করে সব ঘরের সাথে তুলনা করলে \`O(n)\`-এও হতো, কিন্তু এখানে শেখার উদ্দেশ্য সর্ট + বাইনারি সার্চ — দুই প্রতিবেশী ঘরই যথেষ্ট।
- টাই-এর নিয়ম ভুলে গেলে ফল অনিশ্চিত হয় — সমান পার্থক্যে ছোট মানটাই বেছে নাও; বাঁয়ের ঘর যেহেতু ছোট, \`<=\` দিয়ে আপডেট করলেই সেটা থেকে যায়।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Sorting", "Binary Search", "Lower Bound"],
    tests: [
      { input: "4 7\n10 2 8 5\n", expectedOutput: "8\n", isSample: true },
      { input: "1 100\n50\n", expectedOutput: "50\n", isSample: true },
      { input: "2 6\n3 9\n", expectedOutput: "3\n", isSample: false },
      { input: "5 3\n1 2 3 4 5\n", expectedOutput: "3\n", isSample: false },
      { input: "3 -1\n-5 -2 -9\n", expectedOutput: "-2\n", isSample: false },
      {
        input: `200000 200001\n${Array.from({ length: 200000 }, (_, i) => i + 1).join(" ")}\n`,
        expectedOutput: "200000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys, bisect\ndata = list(map(int, sys.stdin.read().split()))\nn, t = data[0], data[1]\na = sorted(data[2:])\ni = bisect.bisect_left(a, t)\nbest = None\nif i < n:\n    best = a[i]\nif i > 0:\n    cand = a[i - 1]\n    if best is None or abs(cand - t) <= abs(best - t):\n        best = cand\nprint(best)\n",
  },
  {
    slug: "learn-m3-sorting-searching-m2",
    title: "Place Routers Far Apart",
    statement: `প্রাইমএশিয়ার নতুন ল্যাবে Wi-Fi বসানোর দায়িত্ব পড়েছে সাদিয়ার ক্লাবের ওপর। ক্যাম্পাসে \`n\`টা খুঁটি আছে (প্রতিটির অবস্থান আলাদা), এগুলোর মধ্যে \`p\`টা খুঁটিতে রাউটার বসাতে হবে। রাউটারগুলোকে অবস্থান অনুযায়ী সাজালে পরপর দুই রাউটারের দূরত্বের মধ্যে যে সর্বনিম্নটা পাওয়া যায়, সেটা যত বড় হয় সিগন্যাল তত পরিষ্কার। সর্বনিম্ন দূরত্বটা সর্বোচ্চ করে বসাও — সেই সর্বোচ্চ মানটাই ছাপাও।

উদাহরণ: খুঁটি \`1 2 8 4 9\`, \`p = 3\` হলে খুঁটি 1, 4, 8 বা 1, 4, 9-এ বসালে সর্বনিম্ন দূরত্ব \`3\` — এর বেশি সম্ভব নয়।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`p\`। দ্বিতীয় লাইনে \`n\`টি আলাদা পূর্ণসংখ্যা — খুঁটির অবস্থান।`,
    outputFormat: `সর্বনিম্ন দূরত্বের সর্বোচ্চ সম্ভাব্য মান এক লাইনে।`,
    constraints: `\`2 <= p <= n <= 100000\`
\`0 <= অবস্থান <= 10^9\`, সব অবস্থান আলাদা।`,
    editorial: `## ধারণা
সরাসরি বিন্যাস খুঁজলে সংখ্যা বিশাল। উল্টো প্রশ্নটা সহজ: সর্বনিম্ন দূরত্ব অন্তত \`d\` রেখে \`p\`টা রাউটার বসানো যায় কি না — এটা গ্রিডি চেকে মুহূর্তেই বোঝা যায়: খুঁটি সর্ট করে প্রথমটায় বসাও, তারপর যে খুঁটি আগেরটার থেকে অন্তত \`d\` দূরে পড়ে সেটায়ই বসাতে থাকো। \`d\` বাড়লে বসানো কঠিন হয় — শর্তটা একদিকমুখী, তাই binary search on answer চলে: ক্ষুদ্রতম \`d\` বের করো যাতে \`p\`টা বসে।

## ধাপে ধাপে
1. অবস্থানগুলো \`sort\` করো; \`lo = 0\`, \`hi =\` শেষ আর প্রথম খুঁটির পার্থক্য।
2. \`ok(d)\`: প্রথম খুঁটিতে বসিয়ে শুরু করো; পরের খুঁটি আগের বসানো রাউটার থেকে \`>= d\` দূরে হলেই বসাও; মোট বসানো সংখ্যা \`p\` হলে সত্য।
3. \`lo < hi\` লুপে \`mid = (lo + hi + 1) // 2\`; \`ok(mid)\` সত্য হলে \`lo = mid\`, নাহলে \`hi = mid - 1\`।
4. লুপ শেষে \`lo\`-ই উত্তর।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, p = data[0], data[1]
pos = sorted(data[2:])
def ok(d):
    cnt = 1
    last = pos[0]
    for v in pos[1:]:
        if v - last >= d:
            cnt += 1
            last = v
    return cnt >= p
lo, hi = 0, pos[-1] - pos[0]
while lo < hi:
    mid = (lo + hi + 1) // 2
    if ok(mid):
        lo = mid
    else:
        hi = mid - 1
print(lo)
\`\`\`

## কমপ্লেক্সিটি
প্রতি চেক \`O(n)\`, ধাপ \`O(log(max))\` — মোট \`O(n log(max))\`, মেমোরি \`O(n)\`।

## সাধারণ ভুল
- গ্রিডি চেকে "প্রথম খুঁটিতেই বসানো" বাদ দিলে ভুল হয় — প্রথম রাউটার যত বাঁয়ে থাকে, পরের সব রাউটারের জায়গা তত বাঁচে।
- \`(lo + hi) // 2\` লিখে \`hi = mid - 1\` না সরালে সীমায় লুপ আটকে থাকে — এখানে উত্তর বাড়ানোর দিকে খুঁজছি, তাই \`(lo + hi + 1) // 2\` জোড়াটাই নিরাপদ।
- \`ok(d)\` একদিকমুখী না হলে বাইনারি সার্চের ফল অর্থহীন — \`d\` ছোট হলে বসানো সহজ, বড় হলে কঠিন, এই ধারাটা আগে হাতে মিলিয়ে নাও।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Binary Search on Answer", "Greedy", "Sorting"],
    tests: [
      { input: "5 3\n1 2 8 4 9\n", expectedOutput: "3\n", isSample: true },
      { input: "5 2\n1 2 4 8 9\n", expectedOutput: "8\n", isSample: true },
      { input: "3 3\n1 5 9\n", expectedOutput: "4\n", isSample: false },
      { input: "4 2\n1 100 2 99\n", expectedOutput: "99\n", isSample: false },
      { input: "2 2\n5 10\n", expectedOutput: "5\n", isSample: false },
      {
        input: `100000 50000\n${Array.from({ length: 100000 }, (_, i) => i + 1).join(" ")}\n`,
        expectedOutput: "2\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, p = data[0], data[1]\npos = sorted(data[2:])\ndef ok(d):\n    cnt = 1\n    last = pos[0]\n    for v in pos[1:]:\n        if v - last >= d:\n            cnt += 1\n            last = v\n    return cnt >= p\nlo, hi = 0, pos[-1] - pos[0]\nwhile lo < hi:\n    mid = (lo + hi + 1) // 2\n    if ok(mid):\n        lo = mid\n    else:\n        hi = mid - 1\nprint(lo)\n",
  },
  {
    slug: "learn-m3-sorting-searching-m3",
    title: "Collect Registration Numbers",
    statement: `কোডিং ক্লাবের সদস্য তালিকায় \`1\` থেকে \`n\` পর্যন্ত নম্বরগুলো এলোমেলো ক্রমে লেখা আছে। নুসরাত তালিকার বাঁ দিক থেকে ডানে এক পাসে হাঁটছে আর যেতে যেতে \`1, 2, 3, ...\` ক্রমে নম্বরগুলো তুলে নিচ্ছে — পাসের মধ্যে পেছনে ফেরা যায় না। একটা নম্বর তুলতে না পারলে বাঁ দিকে ফিরে নতুন পাস শুরু করতে হয়। সব নম্বর তুলে ফেলতে মোট কতটা পাস লাগবে?

উদাহরণ: \`3 1 2\` হলে প্রথম পাসে \`1\`, \`2\` তুলে ফেলে, কিন্তু \`3\` তো বাঁ দিকে পড়ে গেছে — দ্বিতীয় পাসে সেটা ওঠে — উত্তর \`2\`।`,
    inputFormat: `প্রথম লাইনে \`n\`। দ্বিতীয় লাইনে \`1\` থেকে \`n\` পর্যন্ত সংখ্যাগুলোর একটা বিন্যাস।`,
    outputFormat: `মোট পাসের সংখ্যা এক লাইনে।`,
    constraints: `\`1 <= n <= 200000\`
দ্বিতীয় লাইনে \`1..n\` প্রতিটি সংখ্যা ঠিক একবার আছে।`,
    editorial: `## ধারণা
কোন নম্বর কোন ঘরে আছে সেটা জানলেই পুরো হিসাব সহজ। নতুন পাস লাগে তখনই, যখন পরের নম্বর (\`v + 1\`) এই নম্বরের (\`v\`) চেয়ে বাঁ দিকে পড়ে থাকে — কারণ সেই নম্বরটা এই পাসে পাওয়া যাবে না, পাসটা সেখানেই শেষ। তাই উত্তর = ১ + এমন \`v\`-এর সংখ্যা যার জন্য \`pos[v+1] < pos[v]\`। সর্টিং-চিন্তা এখানে অবস্থান ধরে রাখার মধ্যেই — মূল কাজ হলো ইনডেক্সগুলো মান অনুযায়ী সাজিয়ে রাখা।

## ধাপে ধাপে
1. \`n\` পড়ে \`pos[v]\` অ্যারে বানাও — মান \`v\` কোন ঘরে আছে।
2. উত্তর \`1\` ধরে শুরু করো (প্রথম পাস তো লাগবেই)।
3. \`v = 1..n-1\` ঘুরে দেখো: \`pos[v+1] < pos[v]\` হলে উত্তর \`1\` বাড়াও।
4. উত্তর ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
pos = [0] * (n + 1)
for i, v in enumerate(data[1:]):
    pos[v] = i
rounds = 1
for v in range(1, n):
    if pos[v + 1] < pos[v]:
        rounds += 1
print(rounds)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\` — এক পাসে অবস্থান বসানো, আরেক পাসে গোনা; মেমোরি \`O(n)\`।

## সাধারণ ভুল
- প্রতিটা পাস সত্যিই সিমুলেট করতে গেলে খরচ \`O(n *\` পাস\`)\` — বিন্যাস অনুযায়ী \`O(n^2)\`-ও হতে পারে, \`n = 200000\`-এ চলবে না।
- \`pos\` অ্যারে উল্টো করে (কোন ঘরে কী মান) ধরে \`v\` আর \`v+1\` এর অবস্থান মেপার চেষ্টা করলে প্রতিবার খোঁজতে হয় — মান থেকে ঘরে যাওয়ার ম্যাপটাই বানিয়ে নাও।
- প্রথম পাস বাদ দিয়ে উত্তর শূন্য থেকে শুরু করলে এক কম আসে — বেস কাউন্ট \`1\`।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Sorting", "Permutation", "Ordering"],
    tests: [
      { input: "3\n3 1 2\n", expectedOutput: "2\n", isSample: true },
      { input: "5\n1 2 3 4 5\n", expectedOutput: "1\n", isSample: true },
      { input: "5\n5 4 3 2 1\n", expectedOutput: "5\n", isSample: false },
      { input: "1\n1\n", expectedOutput: "1\n", isSample: false },
      { input: "2\n2 1\n", expectedOutput: "2\n", isSample: false },
      {
        input: `200000\n${Array.from({ length: 200000 }, (_, i) => (i === 199999 ? 1 : i + 2)).join(" ")}\n`,
        expectedOutput: "2\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\npos = [0] * (n + 1)\nfor i, v in enumerate(data[1:]):\n    pos[v] = i\nrounds = 1\nfor v in range(1, n):\n    if pos[v + 1] < pos[v]:\n        rounds += 1\nprint(rounds)\n",
  },
  {
    slug: "learn-m3-sorting-searching-h2",
    title: "K-th Smallest Pair Distance",
    statement: `রফি লাইব্রেরির বইয়ের পাতা সংখ্যা নিয়ে খেলছিল — দুই বই বেছে পাতার পার্থক্য লিখে রাখছিল, তারপর ভাবল সব পার্থক্যগুলো ছোট থেকে বড় সাজালে কোনটা মাঝখানে পড়ে। \`n\`টা বইয়ের সব জোড়ার পার্থক্যগুলো ছোট থেকে বড় ক্রমে সাজিয়ে \`k\`-তম পার্থক্যটা বের করো। জোড়ার মোট সংখ্যা \`n(n-1)/2\` — বড় \`n\`-এ সব জোড়ার তালিকা বানানো সম্ভব নয়।

উদাহরণ: পাতা \`1 3 5\` হলে পার্থক্য \`2 2 4\` — \`k = 2\` হলে উত্তর \`2\`।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`k\`। দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা।`,
    outputFormat: `\`k\`-তম ছোট পার্থক্য এক লাইনে।`,
    constraints: `\`2 <= n <= 20000\`
\`1 <= k <= n(n-1)/2\`
\`0 <= মান <= 10^6\`।`,
    editorial: `## ধারণা
তালিকা বানানো যাবে না, তাই উত্তরটা বাইনারি সার্চে খুঁজি: কোনো দূরত্ব \`d\` দিলে "পার্থক্য \`<= d\` এমন জোড়া কতটা" সেটা সাজানো অ্যারেতে দুই পয়েন্টারে \`O(n)\`-এ গোনা যায়। এই গণনা \`d\` বাড়ালে বাড়ে — একদিকমুখী শর্ত, তাই binary search on answer চলে: ক্ষুদ্রতম \`d\` বের করো যার গণনা \`k\` বা তার বেশি। সেই \`d\`-ই k-তম পার্থক্য, কারণ ছোট পার্থক্যগুলো আগে গোনা পড়ে।

## ধাপে ধাপে
1. অ্যারে \`sort\` করো।
2. \`count(d)\`: \`left\` পয়েন্টার রেখে \`right\` ঘুরাও — \`a[right] - a[left] > d\` হলে \`left\` বাড়াও; প্রতি ধাপে জোড়া বাড়ে \`right - left\` করে। দুই পয়েন্টারই শুধু সামনে যায়, তাই \`O(n)\`।
3. \`lo = 0\`, \`hi =\` সর্বোচ্চ পার্থক্য ধরে বাইনারি সার্চ চালাও: \`count(mid) >= k\` হলে \`hi = mid\`, নাহলে \`lo = mid + 1\`।
4. লুপ শেষে \`lo\`-ই উত্তর।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, k = data[0], data[1]
a = sorted(data[2:])
def count(d):
    cnt = 0
    left = 0
    for right in range(n):
        while a[right] - a[left] > d:
            left += 1
        cnt += right - left
    return cnt
lo, hi = 0, a[-1] - a[0]
while lo < hi:
    mid = (lo + hi) // 2
    if count(mid) >= k:
        hi = mid
    else:
        lo = mid + 1
print(lo)
\`\`\`

## কমপ্লেক্সিটি
সর্ট \`O(n log n)\`, বাইনারি সার্চ \`O(log(max))\` ধাপ, প্রতি ধাপে \`O(n)\` গণনা — মোট প্রায় \`O(n log n + n log(max))\`, মেমোরি \`O(n)\`। জোড়ার তালিকা বানালে \`O(n^2)\` মেমোরিও লাগত — সেটাই এড়ানো হয়েছে।

## সাধারণ ভুল
- সব জোড়া বের করে সর্ট করলে \`n = 20000\`-এই প্রায় \`2 * 10^8\` জোড়া — সময় ও মেমোরি দুটোই ফুরিয়ে যায়।
- \`count(d)\` লেখার সময় প্রতি \`right\`-এ \`left\` রিসেট করলে \`O(n^2)\` হয়ে যায় — দুই পয়েন্টারই শুধু সামনে বাড়াও।
- \`>= k\` এর জায়গায় \`== k\` ধরলে সমান পার্থক্যের জোড়া অনেক থাকলে উত্তর মিস হয় — গণনা লাফ দিয়ে বাড়ে, ঠিক \`k\` নাও নাও না।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Binary Search on Answer", "Two Pointers", "Sorting"],
    tests: [
      { input: "3 2\n1 3 5\n", expectedOutput: "2\n", isSample: true },
      { input: "3 3\n1 3 5\n", expectedOutput: "4\n", isSample: true },
      { input: "4 3\n1 1 1 1\n", expectedOutput: "0\n", isSample: false },
      { input: "2 1\n10 3\n", expectedOutput: "7\n", isSample: false },
      { input: "4 5\n1 2 3 4\n", expectedOutput: "2\n", isSample: false },
      {
        input: `20000 1994950\n${Array.from({ length: 20000 }, (_, i) => i + 1).join(" ")}\n`,
        expectedOutput: "100\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, k = data[0], data[1]\na = sorted(data[2:])\ndef count(d):\n    cnt = 0\n    left = 0\n    for right in range(n):\n        while a[right] - a[left] > d:\n            left += 1\n        cnt += right - left\n    return cnt\nlo, hi = 0, a[-1] - a[0]\nwhile lo < hi:\n    mid = (lo + hi) // 2\n    if count(mid) >= k:\n        hi = mid\n    else:\n        lo = mid + 1\nprint(lo)\n",
  },
];
