import type { SeedProblem } from "../../seed-problems";

export const COMPLEXITY_EXTRA_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m1-complexity-e2",
    title: "Tournament Halving Rounds",
    statement: `প্রাইমএশিয়া কোডিং ক্লাবের গেম নাইটে তানভির একটা নিয়ম বানিয়েছে: \`n\` জন খেলোয়াড় থাকে, আর প্রতি রাউন্ডে খেলোয়াড় সংখ্যা গোটা করে অর্ধেক হয়ে যায় (\`n // 2\`), যারা থাকে তারা পরের রাউন্ডে খেলে। কেউ না থাকা পর্যন্ত এই খেলাটা কয় রাউন্ড চলবে — তানভির সেটা বের করতে চায়।

এক লাইনে একটা পূর্ণসংখ্যা \`n\` দেওয়া থাকে; রাউন্ড সংখ্যাটা ছাপাও।`,
    inputFormat: `এক লাইনে একটা পূর্ণসংখ্যা \`n\`।`,
    outputFormat: `এক লাইনে রাউন্ড সংখ্যা।`,
    constraints: `\`1 <= n <= 10^18\`
উত্তর ছোটই আসবে — বড় ইনপুটে লুপ চালানোর আগে ভাবো কয় ধাপ লাগবে।`,
    editorial: `## ধারণা
প্রতি ধাপে সংখ্যাটা প্রায় অর্ধেক হয়ে যায়, তাই ধাপ সংখ্যা প্রায় \`log2(n)\` — \`n = 10^18\` হলেও সর্বোচ্চ ৬০ ধাপ চলে। এটাই \`O(log n)\`: ইনপুট কয় লক্ষ গুণ বাড়লেও কাজ বাড়ে মাত্র কয়েক ধাপ। উল্টো দিকে যদি প্রতি ধাপে একটা করে কমত, তাহলে সেটা হতো \`O(n)\`।

## ধাপে ধাপে
1. \`n\` পড়ো।
2. \`rounds = 0\` দিয়ে শুরু করো।
3. \`n > 0\` থাকা পর্যন্ত: \`n //= 2\` এবং \`rounds += 1\`।
4. \`rounds\` ছাপাও।

\`\`\`python
import sys
n = int(sys.stdin.readline())
rounds = 0
while n > 0:
    n //= 2
    rounds += 1
print(rounds)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(log n)\` — প্রতি ধাপে অর্ধেক হওয়ায় ধাপ সংখ্যা লগারিদমিক। মেমোরি \`O(1)\`। লুপ-ভিত্তিক চিন্তা \`O(n)\` ধরলে \`10^18\`-এ কোনো জাজ লুপটা দেখবেই না।

## সাধারণ ভুল
- \`n = n / 2\` লেখা: Python-এ এটা ফ্লোট, তাই \`n\` কখনো ঠিক ০ হয় না (\`1e-300\`-এর মতো হয়ে যায়) এবং লুপ চিরকাল চলে। অবশ্যই \`//=\`।
- \`while n > 1\` দিলে \`n = 1\`-এ কোনো রাউন্ডই গোনা হয় না, অথচ সঠিক উত্তর \`1\` (১ জন থাকলেও এক রাউন্ডে ০ হয়)।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Complexity", "Loops", "Math"],
    tests: [
      { input: "1\n", expectedOutput: "1\n", isSample: true },
      { input: "8\n", expectedOutput: "4\n", isSample: true },
      { input: "2\n", expectedOutput: "2\n", isSample: false },
      { input: "3\n", expectedOutput: "2\n", isSample: false },
      { input: "1000000\n", expectedOutput: "20\n", isSample: false },
      {
        input: "1000000000000000000\n",
        expectedOutput: "60\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\nrounds = 0\nwhile n > 0:\n    n //= 2\n    rounds += 1\nprint(rounds)\n",
  },
  {
    slug: "learn-m1-complexity-e3",
    title: "Even Tokens in a Range",
    statement: `ক্যাম্পাস উৎসবে টোকেন নম্বর দেওয়া হয় \`l\` থেকে \`r\` পর্যন্ত — একটার পর একটা, কোনো ফাঁক ছাড়া। সাদিয়া জানতে চায় এই পরিসরের মধ্যে কয়টা টোকেন জোড় নম্বরের। তার বন্ধু বলল লুপ চালিয়ে গুনে ফেলো, কিন্তু উৎসবের পরিসর অনেক বড় হতে পারে — তুমি সময় শেষ হওয়ার আগেই উত্তরটা বের করে দাও।

এক লাইনে দুইটি পূর্ণসংখ্যা \`l\` আর \`r\` দেওয়া থাকে।`,
    inputFormat: `এক লাইনে দুইটি পূর্ণসংখ্যা: \`l\` আর \`r\`।`,
    outputFormat: `এক লাইনে \`l\` থেকে \`r\` পর্যন্ত জোড় সংখ্যার সংখ্যা।`,
    constraints: `\`1 <= l <= r <= 10^12\`
\`r\` এত বড় যে এক এক করে গোনা (লুপ) টাইম লিমিটে পড়বে।`,
    editorial: `## ধারণা
\`1\` থেকে \`x\` পর্যন্ত জোড় সংখ্যা সবসময় \`x // 2\` — প্রতিটি জোড় সংখ্যার পাশে একটা করে বিজোড় আছে, তাই অর্ধেকই জোড়। তাই \`[l, r]\` পরিসরের জোড় সংখ্যা = \`r\` পর্যন্ত জোড় বিয়োগ \`(l - 1)\` পর্যন্ত জোড়। ফর্মুলাটা এক ধাপ, অর্থাৎ \`O(1)\`; লুপ \`O(r - l + 1)\` যা \`10^{12}\`-এ অসম্ভব।

## ধাপে ধাপে
1. \`l\` আর \`r\` পড়ো।
2. মনে করো \`count(x) = x // 2\` — \`x\` পর্যন্ত জোড় সংখ্যা।
3. উত্তর = \`count(r) - count(l - 1)\`।
4. ফল ছাপাও; Python-এ ইন্টিজার যত খুশি বড়, তাই কোনো ওভারফ্লো নেই।

\`\`\`python
import sys
l, r = map(int, sys.stdin.readline().split())
print(r // 2 - (l - 1) // 2)
\`\`\`

## কমপ্লেক্সিটি
সময় ও মেমোরি \`O(1)\` — শুধু দুটো ভাগ। লুপ-ভিত্তিক সমাধান \`O(n)\`, এই ইনপুট সীমায় কাজের নয়।

## সাধারণ ভুল
- লুপ চালিয়ে গোনা: \`r = 10^{12}\`-এ বছরেরও বেশি সময় লাগবে।
- \`(l - 1)\` না বসিয়ে \`r // 2 - l // 2\` লিখলে অদ্ভুত ফল: \`l = 2, r = 3\`-এ সঠিক উত্তর \`1\`, কিন্তু সেই সমীকরণ দেয় \`0\`।
- শুরু \`0\` ধরে না করে \`1\` ধরে গোনা — সীমার ঘরগুলো এক ঘর সরে যায়।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Complexity", "Math", "Formulas"],
    tests: [
      { input: "1 4\n", expectedOutput: "2\n", isSample: true },
      { input: "2 3\n", expectedOutput: "1\n", isSample: true },
      { input: "1 1\n", expectedOutput: "0\n", isSample: false },
      { input: "1 100\n", expectedOutput: "50\n", isSample: false },
      {
        input: "999999999999 1000000000000\n",
        expectedOutput: "1\n",
        isSample: false,
      },
      {
        input: "1 1000000000000\n",
        expectedOutput: "500000000000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nl, r = map(int, sys.stdin.readline().split())\nprint(r // 2 - (l - 1) // 2)\n",
  },
  {
    slug: "learn-m1-complexity-m2",
    title: "Trailing Zeros of Factorial",
    statement: `প্রাইমএশিয়া প্রিন্টিং প্রেসে প্রতিদিন \`n!\` সংখ্যাটা এক লম্বা স্ট্রিপে ছাপা হয়। মূল্যায়করণ কমিটি জানতে চায় শেষে কয়টা শূন্য থাকবে — অর্থাৎ গানার শেষে ধারাবাহিকভাবে কয়টা \`0\` লেখা আছে। \`n\` এত বড় যে \`n!\` নিজে ধরে রাখা যায় না, তাই হিসাবটা বুঝে করতে হবে।

এক লাইনে একটা পূর্ণসংখ্যা \`n\` দেওয়া থাকে; \`n!\`-এর trailing zero সংখ্যা ছাপাও।`,
    inputFormat: `এক লাইনে একটা পূর্ণসংখ্যা \`n\`।`,
    outputFormat: `এক লাইনে trailing zero সংখ্যা।`,
    constraints: `\`1 <= n <= 10^9\`
\`n!\` এখানে শুধু ধারণার জন্য — সরাসরি গুণ করে দেখা যাবে না।`,
    editorial: `## ধারণা
একটা trailing zero আসে যখন \`10 = 2 × 5\` যোগ হয়। \`n!\`-এ \`2\`-এর চেয়ে অনেক বেশি \`5\` থাকে (প্রতি দুইটা সংখ্যায় একটা ২, প্রতি পাঁচটায় একটা ৫), তাই শুধু \`5\`-এর গুণিতক গোনা যথেষ্ট: \`n // 5\` (এক বার ৫ দেয় এমন সংখ্যা) + \`n // 25\` (দুই বার ৫ দেয়) + \`n // 125\` + ... প্রতিটি পদ আগের চেয়ে প্রায় ৫ গুণ ছোট, তাই ধাপ সংখ্যা \`log_5(n)\`। এটাই \`O(log n)\` সময়ে সমাধান, \`O(n)\` লুপ নয়।

## ধাপে ধাপে
1. \`n\` পড়ো।
2. \`count = 0\`, \`power = 5\`।
3. \`power <= n\` থাকা পর্যন্ত: \`count += n // power\`, তারপর \`power *= 5\`।
4. \`count\` ছাপাও।

\`\`\`python
import sys
n = int(sys.stdin.readline())
count = 0
power = 5
while power <= n:
    count += n // power
    power *= 5
print(count)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(log_5 n)\` — \`n = 10^9\`-এ মাত্র ১৩ ধাপ। মেমোরি \`O(1)\`। \`n\`-এর জন্য লুপ চালানো \`O(n)\` এবং এখানে টাইম লিমিটে ফেলে দেবে।

## সাধারণ ভুল
- শুধু \`n // 5\` যোগ করা: \`25\` থেকে বড় সংখ্যা দুই বা তার বেশি বার ৫ দেয়, তাই \`25!\`-এ সঠিক উত্তর \`6\` আসে, কিন্তু শুধু \`n // 5\` দেয় \`5\`।
- \`while power <= n\` না লিখে \`while n > 0\`-এ \`n\` কমালে \`power\` কখনো বাড়ে না বা হিসাব উল্টে যায় — লুপের শর্তটা \`power\`-এর সাথে মেলাও।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Complexity", "Math", "Number Theory"],
    tests: [
      { input: "5\n", expectedOutput: "1\n", isSample: true },
      { input: "10\n", expectedOutput: "2\n", isSample: true },
      { input: "4\n", expectedOutput: "0\n", isSample: false },
      { input: "25\n", expectedOutput: "6\n", isSample: false },
      { input: "100\n", expectedOutput: "24\n", isSample: false },
      { input: "1000000\n", expectedOutput: "249998\n", isSample: false },
      {
        input: "1000000000\n",
        expectedOutput: "249999998\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\ncount = 0\npower = 5\nwhile power <= n:\n    count += n // power\n    power *= 5\nprint(count)\n",
  },
  {
    slug: "learn-m1-complexity-m3",
    title: "Pairs Within Budget",
    statement: `ক্যাম্পাস বুক ফেয়ারে রাফি জানতে চায় কতজোড়া বই একসাথে কেলে বাজেটের মধ্যে পড়বে। প্রতিটি বইয়ের দাম দেওয়া আছে, আর জোড়া মানে দুটো ভিন্ন বইয়ের দামের যোগফল \`budget\` বা তার কম হবে। দামের তালিকা বড়, তাই দুইটা লুপে ঘুরে ধরা যাবে না — তুমি সময় লিমিটের মধ্যে উত্তরটা দাও।

প্রথম লাইনে \`n\` আর \`budget\`, দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা — বইয়ের দাম।`,
    inputFormat: `প্রথম লাইনে দুইটি সংখ্যা: \`n\` আর \`budget\`।
দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।`,
    outputFormat: `এক লাইনে জোড়ার সংখ্যা (শূন্যও হতে পারে)।`,
    constraints: `\`2 <= n <= 200000\`
\`1 <= price, budget <= 10^9\`
জোড়া মানে \`i < j\`; প্রতিটি জোড়া একবারই গোনা হবে।`,
    editorial: `## ধারণা
দুই লুপে সব জোড়া দেখলে \`O(n^2)\` — \`n = 200000\`-এ প্রায় \`4 × 10^{10}\` ধাপ, যা টাইম লিমিটে পড়বে। কিন্তু তালিকাটা \`sort\` করলে দুই পয়েন্টার দিয়ে \`O(n)\`-এই শেষ: বাঁ পয়েন্টার \`l\` ছোট দাম থেকে শুরু হয়, ডান পয়েন্টার \`r\` বড় দাম থেকে। \`a[l] + a[r] > budget\` হলে \`r\` কমাও — কারণ \`l\` ঠিক আছে, ডানে যেকোনো বড় দাম শুধু আরও বেশি যোগ হবে। থামার পর \`l < j <= r\` সব জোড়াই বাজেটের মধ্যে, তাই \`count += r - l\`। \`l\` বাড়লে \`a[l]\` বাড়ে, তাই \`r\` কখনো পেছনে যায় না — মোট কাজ \`O(n)\`।

## ধাপে ধাপে
1. \`n\`, \`budget\` ও দামগুলো পড়ে তালিকা \`sort\` করো।
2. \`r = n - 1\`, \`count = 0\`।
3. \`l = 0\` থেকে \`n - 1\` পর্যন্ত:
   - \`r > l\` এবং \`a[l] + a[r] > budget\` হলে \`r -= 1\`।
   - \`r > l\` হলে \`count += r - l\`।
4. \`count\` ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, budget = data[0], data[1]
prices = sorted(data[2:])
count = 0
r = n - 1
for l in range(n):
    while r > l and prices[l] + prices[r] > budget:
        r -= 1
    if r > l:
        count += r - l
print(count)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n log n)\` (সর্ট) + \`O(n)\` (দুই পয়েন্টার, কারণ \`r\` শুধু একদিকে যায়) = \`O(n log n)\`। মেমোরি \`O(n)\`। দুই লুপের \`O(n^2)\` সমাধান এখানে কাজের নয়।

## সাধারণ ভুল
- \`sort\` না করে পয়েন্টার চালালে \`a[l] + a[r]\`-এর অর্থ থাকে না এবং উত্তর ভুল হয়।
- \`count += r - l + 1\` লিখলে নিজের সাথে জোড়াও গোনা হয়, আর \`count += r\` লিখলে সূচি এক ঘর সরে যায়।
- \`r\` প্রতিটি \`l\`-এর জন্য নতুন করে \`n - 1\` থেকে শুরু করলে লুপ আবার \`O(n^2)\` হয়ে যায়।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Complexity", "Two Pointers", "Sorting"],
    tests: [
      { input: "5 6\n1 2 3 4 5\n", expectedOutput: "6\n", isSample: true },
      { input: "3 3\n5 5 5\n", expectedOutput: "0\n", isSample: true },
      { input: "2 1\n1 1\n", expectedOutput: "0\n", isSample: false },
      { input: "4 100\n1 1 1 1\n", expectedOutput: "6\n", isSample: false },
      { input: "6 7\n1 2 3 4 5 6\n", expectedOutput: "9\n", isSample: false },
      {
        input: `200000 2\n${Array.from({ length: 200000 }, () => 1).join(" ")}\n`,
        expectedOutput: "19999900000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, budget = data[0], data[1]\nprices = sorted(data[2:])\ncount = 0\nr = n - 1\nfor l in range(n):\n    while r > l and prices[l] + prices[r] > budget:\n        r -= 1\n    if r > l:\n        count += r - l\nprint(count)\n",
  },
  {
    slug: "learn-m1-complexity-h2",
    title: "Last Player Standing",
    statement: `প্রাইমএশিয়া কোডিং ক্লাবের গেম নাইটে শেষ খেলাটা হয় বৃত্তে। \`n\` জন খেলোয়াড় সংখ্যা অনুসারে ১ থেকে \`n\` করে ঘরে দাঁড়ায়, আর তানভির একটা নম্বর \`k\` ধরে রাখেন। ১ নম্বর খেলোয়াড় থেকে শুরু করে ঘড়ির কাঁটার দিকে ১, ২, … গুনে \`k\` নম্বর খেলোয়াড় বাদ পড়ে; এরপর বাদ পড়া খেলোয়াড়ের ঠিক পরেরটা থেকে আবার ১ থেকে গুনা শুরু হয়। এভাবে একজন না থাকা পর্যন্ত চলে।

এক লাইনে \`n\` আর \`k\` দেওয়া থাকে; টিকে থাকা খেলোয়াড়ের নম্বর ছাপাও।`,
    inputFormat: `এক লাইনে দুইটি সংখ্যা: \`n\` আর \`k\`।`,
    outputFormat: `এক লাইনে টিকে থাকা খেলোয়াড়ের নম্বর (১ থেকে \`n\`-এর মধ্যে)।`,
    constraints: `\`1 <= n <= 200000\`
\`1 <= k <= 10^9\`
বৃত্তে ঘোরানো সিমুলেশন \`O(n^2)\` হয়ে যায় — ছোট সমস্যার উত্তর বড় সমস্যায় বসানোর চিন্তা করো।`,
    editorial: `## ধারণা
একজন থাকলে সে-ই উত্তর। এখন \`n\` জন থাকলে উত্তরটা কীভাবে যায় ভাবো: বৃত্তে \`n\` জনের মধ্যে প্রথমে যে বাদ পড়ল, তার পর থেকে গুনতি ঠিক \`n - 1\` জনের ছোট সমস্যার মতোই — শুধু শুরুর সূচিটা \`k\` ঘর এগিয়ে গেছে। সেটা একটা সুন্দর সম্পর্ক দেয়: শূন্য-সূচিত উত্তর \`surv(n) = (surv(n - 1) + k) % n\`, এবং \`surv(1) = 0\`। এক এক করে \`size = 2\` থেকে \`n\` পর্যন্ত বসালেই উত্তর পাওয়া যায় — সময় \`O(n)\`। বৃত্ত নিজে ঘোরালে (লিস্ট থেকে মাঝখানে বাদ দিয়ে) প্রতিটি ধাপে \`O(n)\` লাগে, মোট \`O(n^2)\`।

## ধাপে ধাপে
1. \`n\` আর \`k\` পড়ো।
2. \`survivor = 0\` দিয়ে শুরু করো — একজন থাকলে (০-সূচিত) সে-ই।
3. \`size = 2\` থেকে \`n\` পর্যন্ত: \`survivor = (survivor + k) % size\`।
4. \`survivor + 1\` ছাপাও (ব্যবহারকারী চায় ১-সূচিত নম্বর)।

\`\`\`python
import sys
n, k = map(int, sys.stdin.readline().split())
survivor = 0
for size in range(2, n + 1):
    survivor = (survivor + k) % size
print(survivor + 1)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\` — ঠিক \`n - 1\` ধাপ। মেমোরি \`O(1)\`। বৃত্ত সিমুলেট করলে \`O(n^2)\`, \`n = 200000\`-এ টাইম লিমিটে পড়বে।

## সাধারণ ভুল
- রিকারশনে লিখলে \`n = 200000\` Python-এর ডিফল্ট recursion limit (১০০০) ছাড়িয়ে \`RecursionError\` দেয় — ইটারেটিভ লুপই কাজের।
- শুরুতে \`survivor = 1\` ধরা: সম্পর্কটা ০-সূচিত, তাই শুরু \`0\` না করলে সব উত্তর এক ঘর বেশি আসে।
- \`k\`-এর জায়গায় \`k % size\` না বসিয়েও ঠিক থাকে, কিন্তু \`size\` মানে বর্তমান জনসংখ্যা — সেটা ভুলে গেলে উত্তর বদলে যায়।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Complexity", "Simulation", "Math"],
    tests: [
      { input: "5 2\n", expectedOutput: "3\n", isSample: true },
      { input: "1 7\n", expectedOutput: "1\n", isSample: true },
      { input: "7 1\n", expectedOutput: "7\n", isSample: false },
      { input: "10 3\n", expectedOutput: "4\n", isSample: false },
      { input: "2 1000000000\n", expectedOutput: "1\n", isSample: false },
      { input: "200000 1\n", expectedOutput: "200000\n", isSample: false },
      {
        input: "200000 999999937\n",
        expectedOutput: "141968\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nn, k = map(int, sys.stdin.readline().split())\nsurvivor = 0\nfor size in range(2, n + 1):\n    survivor = (survivor + k) % size\nprint(survivor + 1)\n",
  },
];
