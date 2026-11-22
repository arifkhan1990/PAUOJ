import type { SeedProblem } from "../../seed-problems";

export const GREEDY_EXTRA_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m3-greedy-x1",
    title: "Rescue Boats with Limit",
    statement: `ক্যাম্পাস লেকে দুর্যোগ মহড়ায় উদ্ধার নৌকা পাঠাতে হবে। প্রতিটি নৌকায় সর্বোচ্চ দুজন বসতে পারে এবং ওজনের যোগফল \`limit\` ছাড়া হতে পারে না। প্রত্যেকের ওজন আলাদা জানা — সবাইকে নিয়ে যেতে সর্বনিম্ম কতটা নৌকা লাগবে?

উদাহরণ: ওজন \`1 2 3 4\`, \`limit = 5\` হলে \`(1, 4)\` আর \`(2, 3)\` — উত্তর \`2\`।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`limit\`; দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা — ওজন (প্রতিটি \`<= limit\`)।`,
    outputFormat: `সর্বনিম্ম নৌকা সংখ্যা।`,
    constraints: `\`1 <= n <= 100000\`, \`1 <= weight <= limit <= 100000\`।`,
    editorial: `## ধারণা
সবচেয়ে ভারী ব্যক্তিটাকে আলাদা পাঠানোর চেয়ে ভালো — যদি সামনের সবচেয়ে হালকাটার সাথে মিলে যায়, তাহলে দুজন একসাথে চলে যাবে, আর এতে এক নৌকা বাঁচে। কেন এটাই সেরা? ধরো ভারীটা কারও সাথে যায়নি — তাহলে সে আলাদা নৌকা নেয়; হালকাদের মধ্যেও সে কারও সাথে যেতে পারত না (ওজন বেশি হলেও যায়নি)। হালকাটাকে কারও সাথে জোড়া দিলে যে হালকা ফাঁকা হয়, সে ভারীটার সাথে মিলত না — অর্থাৎ বদলে দিলে উত্তর বা তার চেয়ে ভালো। এটাই exchange argument। তাই সাজিয়ে সবচেয়ে ভারী আর সবচেয়ে হালকা মিলিয়ে দেখা — মেললে এক নৌকায়, না মিললে ভারীটা একাই যাবে।

## ধাপে ধাপে
1. \`n\`, \`limit\` আর সব ওজন পড়ে সাজাও।
2. \`l = 0\` (হালকা), \`r = n - 1\` (ভারী), নৌকা কাউন্টার \`0\`।
3. \`l <= r\` পর্যন্ত: \`l < r\` এবং \`w[l] + w[r] <= limit\` হলে দুজনকে এক নৌকায় দাও (\`l += 1\`), আর যেকোনো অবস্থায় ভারীটা যাচ্ছেই — \`r -= 1\`, নৌকা বাড়াও।
4. শেষে নৌকা সংখ্যা ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, limit = data[0], data[1]
w = sorted(data[2:])
l, r = 0, n - 1
boats = 0
while l <= r:
    if l < r and w[l] + w[r] <= limit:
        l += 1
    r -= 1
    boats += 1
print(boats)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n log n)\` (সর্ট) + \`O(n)\` পয়েন্টার; মেমোরি \`O(n)\`।

## সাধারণ ভুল
- ওজন সাজানো ভুলে গেলে পয়েন্টার যুক্তিই ভাঙে — আগে \`sort\` করো।
- \`l < r\` শর্ত না রাখলে একজনকে নিজের সাথেই জোড়া ধরা হয়, উত্তর কমে যায় (একজন হলেও লুপ চলে এমন করে দেখো)।
- \`w[l] + w[r] <= limit\` মিললেও শুধু \`r -= 1\` করে \`l\` না বাড়ালে হালকাটা পরের নৌকায় চলে যায়, নৌকা বেশি দেখায়।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Greedy", "Two Pointers", "Sorting"],
    tests: [
      { input: "4 5\n1 2 3 4\n", expectedOutput: "2\n", isSample: true },
      { input: "3 3\n1 2 3\n", expectedOutput: "2\n", isSample: true },
      { input: "1 10\n10\n", expectedOutput: "1\n", isSample: false },
      { input: "5 10\n4 4 4 4 4\n", expectedOutput: "3\n", isSample: false },
      { input: "4 10\n1 1 1 10\n", expectedOutput: "3\n", isSample: false },
      {
        input: `100000 100\n${Array(100000).fill(50).join(" ")}\n`,
        expectedOutput: "50000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, limit = data[0], data[1]\nw = sorted(data[2:])\nl, r = 0, n - 1\nboats = 0\nwhile l <= r:\n    if l < r and w[l] + w[r] <= limit:\n        l += 1\n    r -= 1\n    boats += 1\nprint(boats)\n",
  },
  {
    slug: "learn-m3-greedy-x2",
    title: "Minimum Platforms at the Gate",
    statement: `ক্যাম্পাস গেটে নিয়মিত বাস চলাচল করে। প্রতিটি বাস \`arr[i]\` সময়ে আসে আর \`dep[i]\` সময়ে যায় — আসা থেকে যাওয়া পর্যন্ত (দুটো সময় ধরা) একটা প্ল্যাটফর্ম দখল থাকে; একই সময়ে একটা বাস যেতে চাইলে পরেরটা আসতে পারে না (একই সময়ে এসে যাওয়াও সংঘর্ষ)। সবচেয়ে ব্যস্ত মুহূর্তে কতগুলো প্ল্যাটফর্ম একসাথে লাগবে সেটা বের করো।

উদাহরণ: আগমন \`900 940 1100\`, প্রস্থান \`910 1200 1130\` হলে দ্বিতীয় ও তৃতীয় বাস কিছুটা সময় একসাথে — উত্তর \`2\`।`,
    inputFormat: `প্রথম লাইনে \`n\`; দ্বিতীয় লাইনে \`n\` আগমন সময়; তৃতীয় লাইনে \`n\` প্রস্থান সময়।`,
    outputFormat: `সর্বোচ্চ একসাথে প্রয়োজনীয় প্ল্যাটফর্ম সংখ্যা।`,
    constraints: `\`1 <= n <= 100000\`, \`1 <= arrival <= departure <= 10^9\`;
প্রতিটি বাসের আগমন তার প্রস্থানের আগে বা সমান।`,
    editorial: `## ধারণা
আগমন আর প্রস্থান আলাদা করে সাজিয়ে দুটো পয়েন্টার চালালেই হয়। বাঁ পয়েন্টার পরপর আগমন, ডান পয়েন্টার পরপর প্রস্থান। পরের আগমন যদি চলতি প্রস্থানের আগে বা সমান হয়, তাহলে একই সময়ে দুটো থাকবে — নতুন প্ল্যাটফর্ম লাগল। আগমন বড় হলে কোনো বাস চলে গেছে — একটা কমল। সর্বোচ্চ সংখ্যাটাই উত্তর। এখানে গুরুত্বপূর্ণ যুক্তি: একসাথে থাকা বাসগুলো কখনো ছাড়া ছাড়াই প্ল্যাটফর্ম নেয় না, আর যে ক্রমে আগমন-প্রস্থান আসে সেটাই মূল সমস্যার ক্রম — তাই আলাদা করে সাজানো নিরাপদ।

## ধাপে ধাপে
1. \`n\`, আগমন তালিকা আর প্রস্থান তালিকা পড়ে দুটোই আলাদা করে সাজাও।
2. \`i = 0\` (আগমন), \`j = 0\` (প্রস্থান), \`platforms = 0\`, \`best = 0\`।
3. \`i < n\` পর্যন্ত: \`j >= i\` বা \`arr[i] <= dep[j]\` হলে \`platforms += 1\`, \`i += 1\` (ব্যস্ত সময় এক এগিয়ে গেল); নাহলে \`platforms -= 1\`, \`j += 1\`।
4. প্রতিবার \`best\` আপডেট করো। শেষে \`best\` ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
arr = sorted(data[1:1 + n])
dep = sorted(data[1 + n:1 + 2 * n])
i = j = 0
platforms = best = 0
while i < n:
    if j >= i or arr[i] <= dep[j]:
        platforms += 1
        i += 1
    else:
        platforms -= 1
        j += 1
    if platforms > best:
        best = platforms
print(best)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n log n)\` (দুটো সর্ট) + \`O(n)\` সুইপ; মেমোরি \`O(n)\`।

## সাধারণ ভুল
- \`arr[i] < dep[j]\` লিখে \`<=\` না রাখা: এক সময়ে একটা যেতে চাইলে পরেরটা আসতে পারে না — শেষ মুহূর্তের সংঘর্ষ বাদ পড়ে, উত্তর কমে যায়।
- আলাদা সাজানো ছাড়া প্রস্থান তালিকার ঘরগুলো মিলিয়ে বসানো (তালিকা অসর্টিড রেখে) — তখন কোন বাস কখন ছাড়ল সেটাই বোঝা যায় না।
- শর্তে \`j >= i\` না রাখা — কখনো কখনো সব আগমনের আগে সব প্রস্থান গুনে ফেলা যায়, কাউন্ট ঋণাত্মক হতে পারে।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Greedy", "Sorting", "Two Pointers"],
    tests: [
      {
        input: "3\n900 940 1100\n910 1200 1130\n",
        expectedOutput: "2\n",
        isSample: true,
      },
      { input: "1\n1000\n1200\n", expectedOutput: "1\n", isSample: true },
      { input: "4\n100 200 300 400\n200 300 400 500\n", expectedOutput: "2\n", isSample: false },
      { input: "4\n100 200 300 400\n150 250 350 450\n", expectedOutput: "1\n", isSample: false },
      {
        input: "5\n100 100 100 100 100\n200 200 200 200 200\n",
        expectedOutput: "5\n",
        isSample: false,
      },
      {
        input: `100000\n${Array(100000).fill(1).join(" ")}\n${Array(100000).fill(100000).join(" ")}\n`,
        expectedOutput: "100000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\narr = sorted(data[1:1 + n])\ndep = sorted(data[1 + n:1 + 2 * n])\ni = j = 0\nplatforms = best = 0\nwhile i < n:\n    if j >= i or arr[i] <= dep[j]:\n        platforms += 1\n        i += 1\n    else:\n        platforms -= 1\n        j += 1\n    if platforms > best:\n        best = platforms\nprint(best)\n",
  },
];
