import type { SeedProblem } from "../../seed-problems";

export const PREFIX_SUM_DIFFERENCE_EXTRA_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m3-prefix-sum-difference-x1",
    title: "Balanced Shelf Index",
    statement: `লাইব্রেরির এক ধারায় বইয়ের পাতা সংখ্যা দেখে রফি খুঁজছে এমন একটা ঘর, যার বাঁ পাশের সব বইয়ের পাতার যোগফল আর ডান পাশের যোগফল হুবহু সমান। নিজের ঘরটা বাদ দিয়ে হিসাব হবে। এমন প্রথম ঘরটার নম্বর (১-ভিত্তিক) ছাপাও, না থাকলে \`-1\`।

উদাহরণ: \`2 3 1 3 2\`-এ তৃতীয় ঘরের বাঁয়ে \`2 + 3 = 5\`, ডানে \`3 + 2 = 5\` — উত্তর \`3\`।`,
    inputFormat: `প্রথম লাইনে \`n\`; দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা।`,
    outputFormat: `প্রথম ভারসাম্যপূর্ণ ঘরের নম্বর (১-ভিত্তিক), না থাকলে \`-1\`।`,
    constraints: `\`1 <= n <= 200000\`, \`-10^9 <= value <= 10^9\`; যোগফল 64-বিটে ফিট করে।`,
    editorial: `## ধারণা
প্রতিটি ঘরের জন্য বাঁ-আর-ডান আলাদা করে যোগ করলে \`O(n^2)\`। কিন্তু মোট যোগফল \`total\` জানা থাকলে ডানের অংশ হিসাব করতে হয় না: \`right = total - left - a[i]\`। আর \`left\` তো এক পাসে চলার সময় আগে থেকেই ধরা যায় — শর্ত \`left == right\` হলেই উত্তর। এটাই প্রিফিক্স আইডিয়ার সবচেয়ে সহজ ব্যবহার।

## ধাপে ধাপে
1. \`n\` আর সব মান পড়ে \`total\` বের করো।
2. \`left = 0\` ধরে ঘর বাঁ থেকে ডানে ঘোরো।
3. প্রতি ঘরে \`right = total - left - a[i]\`; সমান হলে \`i + 1\` ছাপে থামো।
4. না মিললে \`left += a[i]\` করে পরের ঘরে যাও; শেষ পর্যন্ত না মিললে \`-1\`।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
a = data[1:]
total = sum(a)
left = 0
for i, v in enumerate(a):
    if left == total - left - v:
        print(i + 1)
        break
    left += v
else:
    print(-1)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\` (এক পাস + একবার \`sum\`), মেমোরি \`O(1)\` অতিরিক্ত।

## সাধারণ ভুল
- \`right\` বের করতে \`total - left\` দিয়ে থামা — নিজের ঘরের মান কেটে দিতে হবে, নাহলে সমান মানও আসে না ভুলভাবে আসে।
- \`left\` আপডেট করার ক্রম: আগে যাচাই, পরে \`left += v\` — উল্টালে নিজের ঘরটাই বাঁয়ে ধরা হয়।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Prefix Sum", "Arrays"],
    tests: [
      { input: "5\n1 2 3 4 5\n", expectedOutput: "-1\n", isSample: true },
      { input: "3\n1 2 1\n", expectedOutput: "2\n", isSample: true },
      { input: "1\n5\n", expectedOutput: "1\n", isSample: false },
      { input: "4\n0 0 0 0\n", expectedOutput: "1\n", isSample: false },
      { input: "5\n2 3 1 3 2\n", expectedOutput: "3\n", isSample: false },
      {
        input: `199999\n${Array(199999).fill(1).join(" ")}\n`,
        expectedOutput: "100000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\ntotal = sum(a)\nleft = 0\nfor i, v in enumerate(a):\n    if left == total - left - v:\n        print(i + 1)\n        break\n    left += v\nelse:\n    print(-1)\n",
  },
  {
    slug: "learn-m3-prefix-sum-difference-x2",
    title: "Busiest Reading-Room Seat",
    statement: `রিডিং রুমের \`n\`টি সিটে কোন সিটে সবচেয়ে বেশিবার বসা হয়েছে সেটা জানতে চায় লাইব্রেরি। \`q\`টা রেকর্ড আছে: \`l r\` মানে একজন পাঠক \`l\` থেকে \`r\` সিট (দুটোই ধরে) একসাথে ব্যবহার করেছে। সবচেয়ে বেশিবার ব্যবহৃত সিটের ব্যবহার সংখ্যা আর তার নম্বর (ছোট নম্বর, টাই হলে) ছাপাও।

উদাহরণ: \`1 3\`, \`2 5\`, \`3 3\` রেকর্ডে সিট ৩-এ \`3\` বার — উত্তর \`3 3\`।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`q\`; পরের \`q\` লাইনে প্রতিটিতে \`l r\` (১-ভিত্তিক)।`,
    outputFormat: `এক লাইনে দুটি সংখ্যা: সর্বোচ্চ ব্যবহার সংখ্যা আর সেই সিটের নম্বর।`,
    constraints: `\`1 <= n, q <= 200000\`, \`1 <= l <= r <= n\`।`,
    editorial: `## ধারণা
প্রতিটি রেকর্ডে লুপ চালালে \`O(n * q)\` — আটকে যাবে। ডিফারেন্স অ্যারেতে প্রতিটি রেকর্ড মাত্র দুই ঘরে দাগ দেয়: \`d[l] += 1\`, \`d[r + 1] -= 1\`। শেষে এক পাসে চলমান যোগফল নিয়ে প্রতিটি সিটের ব্যবহার সংখ্যা পাওয়া যায়, আর সেই পাসেই সর্বোচ্চটা ও তার বাঁয়ের প্রথম অবস্থানটাও ধরা যায় — শর্ত \`>\` দিয়ে আপডেট করলে টাই-তে ছোট নম্বরই থাকে।

## ধাপে ধাপে
1. \`n\`, \`q\` পড়ে \`n + 2\` আকারের ডিফারেন্স অ্যারে বানাও।
2. প্রতিটি \`l r\`-এ \`d[l] += 1\`, \`d[r + 1] -= 1\` করো (০-ভিত্তিকে \`d[l-1]\`, \`d[r]\`)।
3. \`cur = 0\`, \`best = -1\`, \`bestPos = 0\` ধরে সিট ১ থেকে \`n\` পর্যন্ত চলো: \`cur += d[i]\`।
4. \`cur > best\` হলে \`best = cur\`, \`bestPos = i\` — শুধু \`>\` দিলে প্রথম সর্বোচ্চই থাকে।
5. \`best bestPos\` এক লাইনে ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, q = data[0], data[1]
diff = [0] * (n + 2)
idx = 2
for _ in range(q):
    l, r = data[idx], data[idx + 1]
    idx += 2
    diff[l - 1] += 1
    diff[r] -= 1
cur = 0
best = -1
best_pos = 0
for i in range(n):
    cur += diff[i]
    if cur > best:
        best = cur
        best_pos = i + 1
print(best, best_pos)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n + q)\`, মেমোরি \`O(n)\` — প্রতি রেকর্ড \`O(1)\` কাজ।

## সাধারণ ভুল
- \`d[r + 1] -= 1\` না দিলে রেকর্ডের পরের সিটগুলোও এক বাড়ে।
- \`>=\` দিয়ে আপডেট করলে শেষ সর্বোচ্চ সিটটাই বসে যায় — শর্তে ছোট নম্বর চাইলে শুধু \`>\`।
- প্রথম সিটের আগেই \`best\` ছাপা — শুরুতে \`best = -1\` না রাখলে সব সিট শূন্য হলে উত্তর ভুল হয়।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Difference Array", "Sweep Line"],
    tests: [
      { input: "5 3\n1 3\n2 5\n3 3\n", expectedOutput: "3 3\n", isSample: true },
      { input: "1 2\n1 1\n1 1\n", expectedOutput: "2 1\n", isSample: true },
      { input: "4 2\n1 4\n1 4\n", expectedOutput: "2 1\n", isSample: false },
      { input: "3 3\n1 1\n2 2\n3 3\n", expectedOutput: "1 1\n", isSample: false },
      { input: "6 4\n1 2\n5 6\n1 6\n3 4\n", expectedOutput: "2 1\n", isSample: false },
      {
        input: `200000 100000\n${Array(100000).fill("1 200000").join("\n")}\n`,
        expectedOutput: "100000 1\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, q = data[0], data[1]\ndiff = [0] * (n + 2)\nidx = 2\nfor _ in range(q):\n    l, r = data[idx], data[idx + 1]\n    idx += 2\n    diff[l - 1] += 1\n    diff[r] -= 1\ncur = 0\nbest = -1\nbest_pos = 0\nfor i in range(n):\n    cur += diff[i]\n    if cur > best:\n        best = cur\n        best_pos = i + 1\nprint(best, best_pos)\n",
  },
];
