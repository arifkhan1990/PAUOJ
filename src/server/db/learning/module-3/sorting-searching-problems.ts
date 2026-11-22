import type { SeedProblem } from "../../seed-problems";
import { lineInput, newlineOutput, numbersInput, spaceOutput } from "../generated-tests";

export const SORTING_SEARCHING_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m3-sorting-searching-g1",
    title: "Sort the Shelf Page Counts",
    statement: `রফি প্রাইমএশিয়া লাইব্রেরির নতুন তাকে বই পাতা অনুযায়ী সাজাচ্ছে, যাতে পড়ার জন্য ছোট বই আগে পাওয়া যায়। কাগজে লেখা \`n\`টি পাতা সংখ্যা এলোমেলোভাবে আছে — ওগুলো ছোট থেকে বড় ক্রমে সাজিয়ে এক লাইনে ছাপাও।

উদাহরণ: \`12 7 10 3 20\` হলে উত্তর \`3 7 10 12 20\`।`,
    inputFormat: `প্রথম লাইনে \`n\`। দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।`,
    outputFormat: `এক লাইনে \`n\`টি সংখ্যা ছোট থেকে বড় ক্রমে, স্পেস দিয়ে আলাদা।`,
    constraints: `\`1 <= n <= 100000\`
প্রতিটি মান \`-100000 <= value <= 100000\`।`,
    editorial: `## ধারণা
ক্রমবদ্ধ অ্যারেতে অনেক কাজ — খোঁজা, নম্বর দেওয়া, সীমা বের করা — অনেক সহজ হয়ে যায়। তাই সমস্যার শুরুতেই অ্যারে সর্ট করে ফেলা সবচেয়ে সাধারণ প্রথম ধাপ। Python-এর \`list.sort()\` একই লিস্ট সাজায়, তাই কোনো অতিরিক্ত কোড লাগে না।

## ধাপে ধাপে
1. \`n\` আর পরের লাইনের সব সংখ্যা পড়ে একটা লিস্টে নাও।
2. লিস্টের \`sort()\` মেথড কল করো — এটা ইনপ্লেসে \`O(n log n)\` সময়ে সাজায়।
3. \`print(*arr)\` দিয়ে এক লাইনে স্পেস দিয়ে আলাদা করে ছাপাও।

\`\`\`python
import sys
values = list(map(int, sys.stdin.read().split()))
arr = sorted(values[1:])
print(*arr)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n log n)\` (সর্ট), অতিরিক্ত মেমোরি \`O(n)\` — ইনপুট ধরার জন্য।

## সাধারণ ভুল
- \`print(arr)\` লিখলে বন্ধনী ও কমা সহ ছাপে — নমুনার ফরম্যাট হুবহু মেলাতে \`print(*arr)\` লাগে।
- \`values[1:n+1]\` না নিয়ে \`values[1:]\` নিলেও চলে, কিন্তু ইনপুটে বাড়তি সংখ্যা থাকলে ভুল হবে — \`n\` মিলিয়ে নিও।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Sorting", "Arrays"],
    tests: [
      { input: "5\n12 7 10 3 20\n", expectedOutput: "3 7 10 12 20\n", isSample: true },
      { input: "1\n42\n", expectedOutput: "42\n", isSample: true },
      { input: "4\n5 5 1 9\n", expectedOutput: "1 5 5 9\n", isSample: false },
      { input: "3\n-20 -2 0\n", expectedOutput: "-20 -2 0\n", isSample: false },
      { input: "6\n1 2 3 4 5 6\n", expectedOutput: "1 2 3 4 5 6\n", isSample: false },
      {
        input: numbersInput(Array.from({ length: 100000 }, (_, i) => 100000 - i)),
        expectedOutput: spaceOutput(Array.from({ length: 100000 }, (_, i) => i + 1)),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nvalues = list(map(int, sys.stdin.read().split()))\narr = sorted(values[1:])\nprint(*arr)\n",
  },
  {
    slug: "learn-m3-sorting-searching-g2",
    title: "First Occurrence on a Sorted Roster",
    statement: `নুসরাত প্রাইমএশিয়া কোডিং ক্লাবের রেজিস্টার নম্বর ক্রমানুসারে সাজানো আছে, তবে একই নম্বর কয়েকজনের থাকতে পারে। তুমি একটা নম্বর \`X\` দিলে বলো — প্রথম কোন ঘরে \`X\` আছে? না থাকলে \`-1\`। ঘর ধরা হবে ১-ভিত্তিক।

উদাহরণ: \`1 5 5 5 9 10\`-এ \`X = 5\` হলে প্রথম \`5\` দ্বিতীয় ঘরে, তাই উত্তর \`2\`।`,
    inputFormat: `প্রথম লাইনে দুটি সংখ্যা \`n\` আর \`X\`। দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা — ইতিমধ্যেই ছোট থেকে বড় ক্রমে সাজানো।`,
    outputFormat: `\`X\` এর প্রথম অবস্থান (১-ভিত্তিক), না থাকলে \`-1\`।`,
    constraints: `\`1 <= n <= 100000\`
\`-10^9 <= value, X <= 10^9\`
অ্যারে আগে থেকেই ক্রমানুসারে সাজানো।`,
    editorial: `## ধারণা
ক্রমানুসারে অ্যারেতে লিনিয়ার সার্চ চালালেও হয়, কিন্তু \`n = 100000\`-এ বাইনারি সার্চ মাত্র \`log n\` ধাপে কাজ শেষ করে। নম্বর একাধিকবার থাকলে শুধু যেকোনো একটা ঘর পাওয়া যায় না — "প্রথম \`>= X\` এর ঘর" বের করতে হবে, সেটাই \`lower_bound\`। সেই ঘরে \`X\` থাকলে উত্তর পাওয়া গেল, নাহলে \`-1\`।

## ধাপে ধাপে
1. \`lo = 0\`, \`hi = n\` দিয়ে শুরু করো; \`hi\` ধরা হয় না, তাই উত্তরের সম্ভাব্য সব ঘর ভিতরে থাকে।
2. \`lo < hi\` পর্যন্ত চালাও: \`mid = (lo + hi) // 2\`।
3. \`arr[mid] >= X\` হলে \`hi = mid\`, নাহলে \`lo = mid + 1\`।
4. শেষে \`lo\`-ই প্রথম \`>= X\` এর ঘর; \`lo < n\` এবং \`arr[lo] == X\` যাচাই করে উত্তর দাও।

\`\`\`python
import sys, bisect
data = list(map(int, sys.stdin.read().split()))
n, x = data[0], data[1]
a = sorted(data[2:])
i = bisect.bisect_left(a, x)
print(i + 1 if i < n and a[i] == x else -1)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(log n)\` (অ্যারে আগে থেকেই সর্ট করা, তাই সর্ট লাগে না), মেমোরি \`O(n)\`।

## সাধারণ ভুল
- \`bisect_right\` বা প্রথম পাওয়া \`X\` না নিয়ে শেষ পাওয়া \`X\` ধরলে উত্তর ভুল হয় (উদাহরণে \`5\`-এর শেষ ঘর ৪, কিন্তু সঠিক উত্তর ২)।
- সীমা পরীক্ষা করো: \`X\` সবের ছোট বা সবের বড় হলে \`lo\` বেরিয়ে \`n\`-এ যাবে — তাই \`lo < n\` যাচাই ছাড়া কোড ক্র্যাশ করবে।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Binary Search", "Lower Bound"],
    tests: [
      { input: "6 7\n1 3 5 7 9 11\n", expectedOutput: "4\n", isSample: true },
      { input: "5 6\n1 2 3 4 5\n", expectedOutput: "-1\n", isSample: true },
      { input: "6 5\n1 5 5 5 9 10\n", expectedOutput: "2\n", isSample: false },
      { input: "3 0\n1 2 3\n", expectedOutput: "-1\n", isSample: false },
      { input: "3 9\n1 2 3\n", expectedOutput: "-1\n", isSample: false },
      {
        input: `100000 99999\n${Array.from({ length: 100000 }, (_, i) => i + 1).join(" ")}\n`,
        expectedOutput: "99999\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys, bisect\ndata = list(map(int, sys.stdin.read().split()))\nn, x = data[0], data[1]\na = sorted(data[2:])\ni = bisect.bisect_left(a, x)\nprint(i + 1 if i < n and a[i] == x else -1)\n",
  },
  {
    slug: "learn-m3-sorting-searching-e1",
    title: "Merit List Rank Score",
    statement: `তানভির প্রাইমএশিয়ার মেরিট লিস্ট তৈরি করছে — সর্বোচ্চ নম্বর পাওয়া ছাত্র প্রথমে। তুমি \`n\`টি নম্বর আর একটা র‍্যাঙ্ক \`R\` দিলে বলো \`R\` নম্বর ছাত্রটির নম্বর কত। র‍্যাঙ্ক ১ মানে সর্বোচ্চ নম্বর; সমান নম্বর থাকলে ওরাও সমান র‍্যাঙ্ক ধরা হবে এবং একই নম্বর একাধিকবার আসতে পারে।

উদাহরণ: \`88 95 76 95 60\`-এ \`R = 2\` হলে সর্বোচ্চ \`95\`, তারপর আবার \`95\` — উত্তর \`95\`।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`R\`। দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা — ছাত্রদের নম্বর।`,
    outputFormat: `\`R\` নম্বর র‍্যাঙ্কের নম্বর এক লাইনে।`,
    constraints: `\`1 <= n <= 100000\`, \`1 <= R <= n\`
\`-10^9 <= score <= 10^9\`।`,
    editorial: `## ধারণা
র‍্যাঙ্ক বের করার সবচেয়ে সহজ উপায় হলো নম্বরগুলো বড় থেকে ছোট করে সাজানো, তারপর \`R\`-এর ঘরে তাকানো। সাজানোর পর কোনো আরেকটা কাজ লাগে না — এজন্যই সর্টিং এত শক্তিশালী। মনে রাখবে ঘর \`R\` নয়, লিস্টের \`R - 1\` নম্বর ইনডেক্স, কারণ ইনডেক্স শূন্য থেকে শুরু হয়।

## ধাপে ধাপে
1. \`n\` আর \`R\` পড়ো, তারপর সব নম্বর।
2. নম্বরগুলো বড় থেকে ছোট করে সাজাও (\`sorted(..., reverse=True)\`)।
3. \`a[R - 1]\` ছাপাও — এটাই \`R\` নম্বর র‍্যাঙ্ক।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, r = data[0], data[1]
a = sorted(data[2:], reverse=True)
print(a[r - 1])
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n log n)\` (সর্ট), মেমোরি \`O(n)\`।

## সাধারণ ভুল
- \`R\` কে \`R - 1\` না করলে এক ঘর এগিয়ে নম্বর বের হয় — \`R = 1\` হলে \`a[0]\` চাই, \`a[1]\` নয়।
- ছোট থেকে বড় সাজিয়ে দিলে র‍্যাঙ্কের ঘর উল্টো প্রান্তে চলে যায়; \`reverse=True\` ভুলে গেলে ফল একদম উল্টে যায়।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Sorting", "Arrays"],
    tests: [
      { input: "5 2\n88 95 76 95 60\n", expectedOutput: "95\n", isSample: true },
      { input: "1 1\n77\n", expectedOutput: "77\n", isSample: true },
      { input: "4 4\n10 20 30 40\n", expectedOutput: "10\n", isSample: false },
      { input: "6 3\n50 50 50 50 50 50\n", expectedOutput: "50\n", isSample: false },
      { input: "3 2\n-5 -1 -10\n", expectedOutput: "-5\n", isSample: false },
      {
        input: `100000 50000\n${Array.from({ length: 100000 }, (_, i) => i + 1).join(" ")}\n`,
        expectedOutput: "50001\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, r = data[0], data[1]\na = sorted(data[2:], reverse=True)\nprint(a[r - 1])\n",
  },
  {
    slug: "learn-m3-sorting-searching-m1",
    title: "Minimize the Maximum Daily Load",
    statement: `প্রাইমএশিয়া কোডিং কনটেস্টের সমাধানপত্র \`n\`টি কার্টনে এসেছে, রফিকে এগুলো ল্যাবে পৌঁছে দিতে হবে \`d\` দিনে। প্রতিদিন পরপর ধরে কিছু কার্টন নেওয়া যাবে (একটা কার্টন দুই দিনে ভাগ করা যায় না)। প্রতিদিনের ওজনের মধ্যে সর্বোচ্চটা যত ছোট হতে পারে, সেটুকু বের করো। প্রতিদিন এক বা একাধিক কার্টন দেওয়া যাবে, তবে \`d\` দিনের বেশি চাইলে নয়।

উদাহরণ: \`n = 5\`, \`d = 3\`, ওজন \`1 2 3 4 5\` হলে ভাগ \`[1 2 3] [4] [5]\` করলে সর্বোচ্চ দৈনিক ওজন \`6\` — এর চেয়ে ছোট কোনো উত্তর নেই।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`d\`। দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা — প্রতিটি কার্টনের ওজন।`,
    outputFormat: `সর্বনিম্ন সম্ভাব্য সর্বোচ্চ দৈনিক ওজন এক লাইনে।`,
    constraints: `\`1 <= d <= n <= 100000\`
\`1 <= weight <= 10^9\`
ওজনের যোগফল 64-বিট সংখ্যায় ফিট করে।`,
    editorial: `## ধারণা
সরাসরি কোনো ভাগ পছন্দ করে মিলিয়ে দেখলে সময় নষ্ট — কিন্তু যদি ধরি সর্বোচ্চ দৈনিক ওজন \`C\` হতে পারে, তবে চেক করা যায় এটা কি সম্ভব: বাঁ থেকে ডানে গিয়ে যতটুকু যোগ হয় \`C\`-এর মধ্যে, ততটুকু রেখে বাকিটা পরের দিনে ফেলুন। \`ok(C)\` এই চেকের ফল একদিকমুখী — \`C\` বাড়লে ভাগ করা আরও সহজ, তাই binary search on answer চালানো যায়। উত্তরের সীমা: নিচে \`max(weight)\` (একদিনে একটা কার্টনও না নিলে হবে না), উপরে \`sum(weight)\` (সব একদিনে)।

## ধাপে ধাপে
1. \`lo = max(weights)\`, \`hi = sum(weights)\` বসাও।
2. \`lo < hi\` পর্যন্ত \`mid = (lo + hi) // 2\` নাও।
3. গ্রিডি চেক চালাও: চলমান দিনের ওজন \`cur + v > mid\` হলে নতুন দিন শুরু করো; দিন সংখ্যা \`d\` ছাড়া হলে \`ok\` সত্য।
4. সত্য হলে \`hi = mid\`, নাহলে \`lo = mid + 1\` — উভয় ক্ষেত্রেই লুপ অর্ধেক ছোট হয়।
5. লুপ শেষে \`lo\`-ই সর্বনিম্ন কার্যকর \`C\`; ছোট ইনপুটে হাতে মিলিয়ে নিশ্চিত হও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, d = data[0], data[1]
w = data[2:]
lo, hi = max(w), sum(w)
while lo < hi:
    mid = (lo + hi) // 2
    days, cur = 1, 0
    for v in w:
        if cur + v > mid:
            days += 1
            cur = v
        else:
            cur += v
    if days <= d:
        hi = mid
    else:
        lo = mid + 1
print(lo)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n log(sum))\` — প্রতি ধাপে \`O(n)\` চেক, ধাপ সংখ্যা প্রায় \`log(10^14)\` এর কম। মেমোরি \`O(1)\` অতিরিক্ত।

## সাধারণ ভুল
- \`lo\` শূন্য দিয়ে শুরু করলে সর্বনিম্ন ওজনের একটা কার্টনও না পারলে \`0\` দিয়ে ভাগ যায়, ফলে উত্তর ভুল হয় — \`max(w)\` থেকে শুরু করো।
- দিন গোনার সময় \`days <= d\` না দেখে \`days < d\` লিখলে \`d = n\` অবস্থায় সঠিক উত্তরও বাতিল হয়।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Binary Search", "Binary Search on Answer", "Greedy"],
    tests: [
      { input: "5 3\n1 2 3 4 5\n", expectedOutput: "6\n", isSample: true },
      { input: "3 3\n10 20 30\n", expectedOutput: "30\n", isSample: true },
      { input: "4 1\n1 2 3 4\n", expectedOutput: "10\n", isSample: false },
      { input: "4 4\n1 1 1 1\n", expectedOutput: "1\n", isSample: false },
      { input: "6 2\n5 5 5 5 5 5\n", expectedOutput: "15\n", isSample: false },
      { input: "3 2\n1000000000 1000000000 1\n", expectedOutput: "1000000001\n", isSample: false },
      {
        input: `100000 7\n${Array(100000).fill(1).join(" ")}\n`,
        expectedOutput: "14286\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, d = data[0], data[1]\nw = data[2:]\nlo, hi = max(w), sum(w)\nwhile lo < hi:\n    mid = (lo + hi) // 2\n    days, cur = 1, 0\n    for v in w:\n        if cur + v > mid:\n            days += 1\n            cur = v\n        else:\n            cur += v\n    if days <= d:\n        hi = mid\n    else:\n        lo = mid + 1\nprint(lo)\n",
  },
  {
    slug: "learn-m3-sorting-searching-h1",
    title: "Count the Inversions",
    statement: `তানভির লাইব্রেরির বই এক ধারায় সাজানো ক্রম আর নিজের পছন্দের ক্রম মিলিয়ে দেখছে। যে জোড়ায় \`i < j\` হলেও আগের বইটা পরের চেয়ে বড় (পরের অবস্থানে যেতে চায়), সেটাকে একটা উল্টো জোড়া (inversion) ধরা হয়। মোট কতটা উল্টো জোড়া আছে বের করো — এই সংখ্যাটাই পাশাপাশি সরিয়ে সাজাতে ন্যূনতম কতবার লাগবে।

উদাহরণ: \`3 1 4 1 5\`-এ উল্টো জোড়া \`(3,1)\`, \`(3,1)\`, \`(4,1)\` — উত্তর \`3\`।`,
    inputFormat: `প্রথম লাইনে \`n\`। দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা।`,
    outputFormat: `উল্টো জোড়ার মোট সংখ্যা এক লাইনে।`,
    constraints: `\`1 <= n <= 200000\`
\`-10^9 <= value <= 10^9\`
উত্তর 64-বিটে ফিট করে।`,
    editorial: `## ধারণা
নাকি \`i < j\` এবং \`a[i] > a[j]\` — এমন জোড়া গোনা হলো কাজ। দুই লুপে \`O(n^2)\` করলে \`n = 200000\`-এ সময় শেষ। দ্রুত উপায় মার্জসর্ট: ভাগ করে সাজানোর সময় যখন ডান অর্ধেকের একটা মান বাঁ অর্ধেকের বাকি সব মানের আগে চলে আসে, তখন বাঁ অর্ধেকের যতটা ঘর বাকি — সেগুলোই এই মানের সাথে উল্টো জোড়া তৈরি করে। প্রতিটি ধাপে সেই গণনাটা যোগ হয়।

## ধাপে ধাপে
1. অ্যারেকে মাঝখান দিয়ে দুই ভাগে ভাগ করো এবং প্রতিটি ভাগে সমাধান রিকার্সনে করো।
2. দুই সাজানো ভাগ মার্জ করো: \`left[i] <= right[j]\` হলে \`left[i]\` নাও, নাহলে \`right[j]\` নাও এবং উত্তরে \`len(left) - i\` যোগ করো।
3. উভয় ভাগের উত্তর আর মার্জের উত্তর যোগ করে ফেরত দাও।
4. মূল অ্যারের মোট উত্তর ছাপাও; সংখ্যা বড়, তাই 64-বিট ধরো।

\`\`\`python
import sys
sys.setrecursionlimit(1000000)
tokens = list(map(int, sys.stdin.read().split()))
def count_inv(arr):
    if len(arr) < 2:
        return arr, 0
    mid = len(arr) // 2
    left, inv = count_inv(arr[:mid])
    right, extra = count_inv(arr[mid:])
    inv += extra
    merged, i, j, nl = [], 0, 0, len(left)
    while i < nl and j < len(right):
        if left[i] <= right[j]:
            merged.append(left[i]); i += 1
        else:
            merged.append(right[j]); j += 1
            inv += nl - i
    merged.extend(left[i:])
    merged.extend(right[j:])
    return merged, inv
print(count_inv(tokens[1:])[1])
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n log n)\` — প্রতি লেভেলে \`O(n)\` কাজ, লেভেল \`log n\`। মেমোরি \`O(n)\` (সাময়িক লিস্ট)। উল্টো ক্রমে অ্যারে \`n = 200000\` হলে উত্তর \`n * (n - 1) / 2\` = \`19999900000\`।

## সাধারণ ভুল
- \`<=\` না লিখে \`<\` লিখলে সমান মানের জোড়া গোনা হয়ে যায় — কোডে আমরা বলেছি শুধু \`a[i] > a[j]\` জোড়া চাই।
- রিকার্সনে \`sys.setrecursionlimit\` না দিলে Python ডিফল্ট সীমা ১০০০-এ \`n = 200000\`-এ ক্র্যাশ হতে পারে (লেভেল কম হলেও সেফটি)।
- মার্জের সময় \`inv\` আপডেট না করে শুধু লিস্ট বানালে সাজানো তো হয়, কিন্তু উত্তর শূন্য আসে।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 4000,
    memoryLimitMb: 256,
    tags: ["Sorting", "Divide and Conquer", "Inversions"],
    tests: [
      { input: "5\n3 1 4 1 5\n", expectedOutput: "3\n", isSample: true },
      { input: "4\n4 3 2 1\n", expectedOutput: "6\n", isSample: true },
      { input: "5\n1 2 3 4 5\n", expectedOutput: "0\n", isSample: false },
      { input: "6\n2 2 2 2 2 2\n", expectedOutput: "0\n", isSample: false },
      { input: "1\n100\n", expectedOutput: "0\n", isSample: false },
      {
        input: numbersInput(Array.from({ length: 200000 }, (_, i) => 200000 - i)),
        expectedOutput: "19999900000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nsys.setrecursionlimit(1000000)\ntokens = list(map(int, sys.stdin.read().split()))\ndef count_inv(arr):\n    if len(arr) < 2:\n        return arr, 0\n    mid = len(arr) // 2\n    left, inv = count_inv(arr[:mid])\n    right, extra = count_inv(arr[mid:])\n    inv += extra\n    merged, i, j, nl = [], 0, 0, len(left)\n    while i < nl and j < len(right):\n        if left[i] <= right[j]:\n            merged.append(left[i]); i += 1\n        else:\n            merged.append(right[j]); j += 1\n            inv += nl - i\n    merged.extend(left[i:])\n    merged.extend(right[j:])\n    return merged, inv\nprint(count_inv(tokens[1:])[1])\n",
  },
  {
    slug: "learn-m3-sorting-searching-x1",
    title: "Three Way Split Around X",
    statement: `সাদিয়া তাকের বই একটা নির্দিষ্ট পাতা সংখ্যা \`X\` দিয়ে তিন ভাগে ভাগ করছে: \`X\`-এর চেয়ে কম, \`X\`-এর সমান, আর \`X\`-এর বেশি। কত করে বই প্রতিটি ভাগে আছে বলো।

উদাহরণ: \`1 5 2 5 9 0\` আর \`X = 5\` হলে কম \`3\`টি (\`1 2 0\`), সমান \`2\`টি, বেশি \`1\`টি — উত্তর \`3 2 1\`।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`X\`। দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা (ক্রমানুসারে নয়)।`,
    outputFormat: `\`কম সমান বেশি\` — তিনটি সংখ্যা এক লাইনে, স্পেস দিয়ে আলাদা।`,
    constraints: `\`1 <= n <= 100000\`
\`-10^9 <= value, X <= 10^9\`।`,
    editorial: `## ধারণা
এখানে সার্চের দরকার নেই, একটা লুপেই তিনটা কাউন্টার আপডেট করা যায়। তবে ক্রমানুসারে সাজিয়ে \`lower_bound\` আর \`upper_bound\` দিয়েও করা যায়: প্রথম \`>= X\` পর্যন্ত সবই "কম", \`< upper_bound\` পর্যন্ত অংশ "সমান", বাকিটা "বেশি"। দুই পদ্ধতিই ঠিক; ছোট ইনপুটে যেটা সহজ মনে হয় সেটা ব্যবহার করো, বড় ইনপুটের জন্য জটিলতা \`O(n)\` বা \`O(log n)\` — দুটোই সময় সীমার মধ্যে।

## ধাপে ধাপে
1. \`n\`, \`X\` আর সব মান পড়ো।
2. \`less = equal = greater = 0\` দিয়ে শুরু করো।
3. প্রতিটি মানের জন্য \`< X\`, \`== X\`, \`> X\` — যেটা মেলে সেই কাউন্টার বাড়াও।
4. \`less equal greater\` এক লাইনে ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, x = data[0], data[1]
less = equal = greater = 0
for v in data[2:]:
    if v < x:
        less += 1
    elif v == x:
        equal += 1
    else:
        greater += 1
print(less, equal, greater)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\`, মেমোরি \`O(1)\` অতিরিক্ত — এক পাসেই তিনটা কাউন্টার।

## সাধারণ ভুল
- \`elif\` বাদ দিয়ে দুটো \`if\` লিখলে একটা মান দুই কাউন্টারে যোগ হয় — যোগফল \`n\` ছাড়া গেলে ভুল ধরা পড়ে।
- \`X\`-এর সাথে মিলিয়ে দেখার জন্য \`>\` বনাম \`>=\` গুলিয়ে ফেলা — সমান মানগুলো ঠিক কোন ভাগে যাবে তা আগে ঠিক করো।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Sorting", "Counting", "Implementation"],
    tests: [
      { input: "6 5\n1 5 2 5 9 0\n", expectedOutput: "3 2 1\n", isSample: true },
      { input: "1 7\n7\n", expectedOutput: "0 1 0\n", isSample: true },
      { input: "3 10\n1 2 3\n", expectedOutput: "3 0 0\n", isSample: false },
      { input: "3 0\n1 2 3\n", expectedOutput: "0 0 3\n", isSample: false },
      { input: "4 5\n5 5 5 5\n", expectedOutput: "0 4 0\n", isSample: false },
      {
        input: `100000 50000\n${Array.from({ length: 100000 }, (_, i) => i + 1).join(" ")}\n`,
        expectedOutput: "49999 1 50000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, x = data[0], data[1]\nless = equal = greater = 0\nfor v in data[2:]:\n    if v < x:\n        less += 1\n    elif v == x:\n        equal += 1\n    else:\n        greater += 1\nprint(less, equal, greater)\n",
  },
  {
    slug: "learn-m3-sorting-searching-x2",
    title: "Honor Board Name Sort",
    statement: `প্রাইমএশিয়ার অনার বোর্ডে নাম বসানো হয় নিয়ম মেনে: আগে যার নম্বর বেশি সে আগে; নম্বর সমান হলে নাম বর্ণানুক্রমে ছোটটা আগে (ছোট হাতের ইংরেজি অক্ষর, ASCII ক্রমে)। \`n\` জনের নাম আর নম্বর দিলে সাজানো নামগুলো প্রতি লাইনে একটা করে ছাপাও।

উদাহরণ: \`rafi 88\`, \`nusrat 95\`, \`tanvir 88\` হলে আগে \`nusrat\`, তারপর \`rafi\`, তারপর \`tanvir\`।`,
    inputFormat: `প্রথম লাইনে \`n\`।
পরের \`n\` লাইনে প্রতিটিতে \`name score\` — নামে স্পেস নেই।`,
    outputFormat: `সাজানো অনুযায়ী \`n\` লাইন, প্রতি লাইনে একটা নাম।`,
    constraints: `\`1 <= n <= 100000\`
নাম: \`1\` থেকে \`12\` অক্ষর, ছোট হাতের ইংরেজি, সব নাম আলাদা।
\`0 <= score <= 100\`।`,
    editorial: `## ধারণা
কাস্টম কম্পেয়ারার মানে সর্ট করার সময় "কোনটা আগে" সেই নিয়মটা আমরা ঠিক করে দিই। এখানে নিয়ম দুই স্তরের: প্রথমে নম্বর বড় থেকে ছোট, তারপর নাম ছোট থেকে বড়। Python-এ \`sorted\`-এর \`key\` কল করে এটা এক লাইনে বোঝানো যায়: \`key=lambda t: (-t[1], t[0])\` — নম্বরের আগে ঋণাত্মক করলে বড় নম্বর আগে আসে, আর নাম স্বাভাবিক বর্ণানুক্রমে সাজে। টুপলের তুলনা Python বাঁ থেকে ডানে করে, তাই দুটো নিয়মই একসাথে চলে।

## ধাপে ধাপে
1. \`n\` পড়ে \`n\` জোড়া \`(name, score)\` তৈরি করো।
2. কী ফাংশন \`(-score, name)\` দিয়ে সর্ট করো।
3. সাজানো তালিকার প্রতিটি নাম আলাদা লাইনে ছাপাও।

\`\`\`python
import sys
lines = sys.stdin.read().splitlines()
n = int(lines[0])
people = []
for i in range(1, n + 1):
    name, score = lines[i].split()
    people.append((name, int(score)))
people.sort(key=lambda item: (-item[1], item[0]))
for name, _ in people:
    print(name)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n log n)\`, মেমোরি \`O(n)\`। নাম হুবহু আলাদা ধরা হয়েছে, তাই ফল অদ্বিতীয়।

## সাধারণ ভুল
- \`key=lambda p: p[1]\` লিখে শুধু নম্বর দিয়ে সাজালে টাই ভাঙা হয় না — ফল এলোমেলো হতে পারে, নাম দিয়ে টাই-ব্রেক করতে হবে।
- নাম ছোট করে সাজাতে গেলে অক্ষরের ASCII ক্রম মানতে হয়; নিজের মতো করে "বাংলা অর্থ" দিলে নমুনার ফল মিলবে না।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Sorting", "Custom Comparator"],
    tests: [
      {
        input: "3\nrafi 88\nnusrat 95\ntanvir 88\n",
        expectedOutput: "nusrat\nrafi\ntanvir\n",
        isSample: true,
      },
      { input: "1\nsadia 100\n", expectedOutput: "sadia\n", isSample: true },
      { input: "2\nbbb 50\naaa 50\n", expectedOutput: "aaa\nbbb\n", isSample: false },
      { input: "3\nc 10\na 30\nb 20\n", expectedOutput: "a\nb\nc\n", isSample: false },
      {
        input: "4\nzz 70\naa 70\nmm 90\nbb 70\n",
        expectedOutput: "mm\naa\nbb\nzz\n",
        isSample: false,
      },
      {
        input: lineInput(
          Array.from({ length: 100000 }, (_, i) => `s${String(100000 - i).padStart(6, "0")} 999`),
        ),
        expectedOutput: newlineOutput(
          Array.from({ length: 100000 }, (_, i) => `s${String(i + 1).padStart(6, "0")}`),
        ),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nlines = sys.stdin.read().splitlines()\nn = int(lines[0])\npeople = []\nfor i in range(1, n + 1):\n    name, score = lines[i].split()\n    people.append((name, int(score)))\npeople.sort(key=lambda item: (-item[1], item[0]))\nfor name, _ in people:\n    print(name)\n",
  },
];
