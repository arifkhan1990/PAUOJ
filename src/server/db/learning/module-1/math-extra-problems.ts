import type { SeedProblem } from "../../seed-problems";

export const MATH_EXTRA_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m1-math-e2",
    title: "Divisible by Nine",
    statement: `রফি ক্যাম্পাস লাইব্রেরির সিট নম্বর গোনার দায়িত্ভ পেয়েছেন। সিট নম্বর যত বড় হোক, দুই অঙ্কের হিসেব না করে সে জানেন নয়ের ভাগযোগ্যতার একটা পুরনো নিয়ম: সংখ্যার সব অঙ্কের যোগফল যদি ৯ দিয়ে ভাগ যায়, তাহলে সংখ্যাটাও ভাগ যায়। তুমি সেই নিয়মটা দিয়ে বলো দেওয়া সংখ্যাটা ৯ দিয়ে ভাগ হয় কিনা।

এক লাইনে একটা পূর্ণসংখ্যা \`n\` দেওয়া থাকে। ভাগ হয় হলে \`YES\`, না হলে \`NO\`। উদাহরণ: \`18\`-এর অঙ্কের যোগ \`1 + 8 = 9\`, তাই \`YES\`; \`7\`-এর যোগ \`7\`, তাই \`NO\`।`,
    inputFormat: `এক লাইনে একটা পূর্ণসংখ্যা \`n\`।`,
    outputFormat: `৯ দিয়ে ভাগ হয় হলে \`YES\`, না হলে \`NO\` এক লাইনে।`,
    constraints: `\`1 <= n <= 10^18\`
সংখ্যাটা এত বড় হতে পারে, তাই অঙ্ক ধরে ধরে যোগ করাই কাজের।`,
    editorial: `## ধারণা
৯ দিয়ে ভাগযোগ্যতার নিয়ম: সংখ্যার সব অঙ্কের যোগফল যদি ৯ দিয়ে ভাগ যায়, তাহলে সংখ্যাটাও ভাগ যায়; উল্টোটাও সত্য। কারণ কোনো সংখ্যা লেখা যায় \`d_k * 10^k + ... + d_1 * 10 + d_0\` আকারে, আর প্রতিটি \`10^i = 999...9 + 1\` — তাই সংখ্যাটা অঙ্কগুলোর যোগফলের সাথে একই ভাগশেষ দেয় ৯ দিয়ে। তাই পুরো \`n\` না ভাগ করে শুধু অঙ্কগুলো যোগ করলেই হয়।

## ধাপে ধাপে
1. লাইনটা পড়ে স্ট্রিং হিসেবে রাখো (১০^১৮ পর্যন্ত সংখ্যা, অঙ্কে ভাগ করাই সহজ)।
2. প্রতিটি অক্ষর থেকে অঙ্ক বের করে \`total\`-এ যোগ করো।
3. \`total % 9 == 0\` হলে \`YES\`, নাহলে \`NO\` ছাপাও।

\`\`\`python
import sys
n = sys.stdin.readline().strip()
total = 0
for ch in n:
    total += ord(ch) - 48
print("YES" if total % 9 == 0 else "NO")
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(d)\`, এখানে \`d\` = সংখ্যার অঙ্কের সংখ্যা (সর্বোচ্চ ১৯)। মেমোরি \`O(1)\`। নিজে থেকে \`n\` ভাগ করে হিসাব করলেও চলত, কিন্তু অঙ্কের যোগ সব ভাষায় সমান সহজ।

## সাধারণ ভুল
- শুধু শেষ অঙ্ক দেখে সিদ্ধান্ত: \`18\`-এর শেষ অঙ্ক ৮, তবু ভাগ হয় — নিয়মটা পুরো অঙ্কের যোগের উপর।
- অঙ্ক বের করার সময় \`ord(ch) - ord('0')\` না করে অক্ষরটার মান যোগ করে ফেলা — তখন ASCII মান যোগ হয়, উত্তর ভুল হয়।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Number Theory", "Digits"],
    tests: [
      { input: "18\n", expectedOutput: "YES\n", isSample: true },
      { input: "7\n", expectedOutput: "NO\n", isSample: true },
      { input: "9\n", expectedOutput: "YES\n", isSample: false },
      { input: "81\n", expectedOutput: "YES\n", isSample: false },
      { input: "999999998\n", expectedOutput: "NO\n", isSample: false },
      { input: "999999999\n", expectedOutput: "YES\n", isSample: false },
      { input: "1000000000000000000\n", expectedOutput: "NO\n", isSample: false },
    ],
    referencePython:
      "import sys\nn = sys.stdin.readline().strip()\ntotal = 0\nfor ch in n:\n    total += ord(ch) - 48\nprint(\"YES\" if total % 9 == 0 else \"NO\")\n",
  },
  {
    slug: "learn-m1-math-e3",
    title: "Coprime Check",
    statement: `নুসরাত ক্লাসের দুইটা দলকে একসাথে প্রজেক্টে বসাচ্ছেন, কিন্তু শর্ত হলো দুই দলের ব্যাচ নম্বরের কোনো সাধারণ ভাগকারী থাকতে পারবে না ছোট ছাড়া — অর্থাৎ দুই সংখ্যার GCD হতে হবে ঠিক \`1\`। এমন দুই সংখ্যাকে বলে coprime বা সহগুণিতক।

এক লাইনে দুইটা পূর্ণসংখ্যা \`a\` আর \`b\` দেওয়া থাকে। তারা coprime হলে \`YES\`, না হলে \`NO\`। উদাহরণ: \`12\` আর \`35\`-এর GCD \`1\`, তাই \`YES\`; \`6\` আর \`9\`-এর GCD \`3\`, তাই \`NO\`।`,
    inputFormat: `এক লাইনে দুইটি পূর্ণসংখ্যা \`a\` আর \`b\`, স্পেস দিয়ে আলাদা।`,
    outputFormat: `Coprime হলে \`YES\`, না হলে \`NO\` এক লাইনে।`,
    constraints: `\`1 <= a, b <= 10^18\`
এত বড় সংখ্যায় ভাগকারী খোঁজা যায় না, Euclid-এর ধাপেই যেতে হবে।`,
    editorial: `## ধারণা
দুইটা সংখ্যার GCD \`1\` হলে তাদের ছোট ছাড়া কোনো সাধারণ ভাগকারী নেই — সেটাই coprime হওয়ার সংজ্ঞা। তাই আলাদা কিছু করার দরকার নেই, শুধু \`gcd(a, b)\` বের করে \`1\` কিনা দেখলেই হয়। Euclid-এর নিয়ম \`gcd(a, b) = gcd(b, a % b)\` প্রতি ধাপে সংখ্যা দ্রুত ছোট হয়, তাই ১০^১৮-এও কয়েক ধাপেই শেষ।

## ধাপে ধাপে
1. \`a\` ও \`b\` পড়ো।
2. \`b\` শূন্য না হওয়া পর্যন্ত \`a, b = b, a % b\` চালাও।
3. বাকি থাকা \`a\` যদি \`1\` হয় \`YES\`, নাহলে \`NO\` ছাপাও।

\`\`\`python
import sys
a, b = map(int, sys.stdin.read().split())
while b != 0:
    a, b = b, a % b
print("YES" if a == 1 else "NO")
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(log min(a, b))\`, মেমোরি \`O(1)\`। \`1\` থেকে \`n\` পর্যন্ত সব ভাগকারী মেলানোর সময় \`O(n)\` — এই সীমায় অকল্পনীয়।

## সাধারণ ভুল
- GCD না বের করে শুধু \`a % b != 0\` দেখা: \`6\` আর \`9\`-এর ভাগশেষ আছে, কিন্তু তারা একই সাথে coprimeও নয়; আবার \`4\` আর \`9\`-এর ভাগশেষও আছে কিন্তু GCD \`1\` — শর্ত হলো GCD \`1\`।
- লুপে একসাথে বদল না করে শুধু \`a = a % b\` লিখলে ধাপ এগোয় না।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Number Theory", "GCD"],
    tests: [
      { input: "12 35\n", expectedOutput: "YES\n", isSample: true },
      { input: "6 9\n", expectedOutput: "NO\n", isSample: true },
      { input: "1 1\n", expectedOutput: "YES\n", isSample: false },
      { input: "17 19\n", expectedOutput: "YES\n", isSample: false },
      { input: "1000000000 999999937\n", expectedOutput: "YES\n", isSample: false },
      { input: "1000000000 999999938\n", expectedOutput: "NO\n", isSample: false },
      {
        input: "1000000000 1000000000\n",
        expectedOutput: "NO\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\na, b = map(int, sys.stdin.read().split())\nwhile b != 0:\n    a, b = b, a % b\nprint(\"YES\" if a == 1 else \"NO\")\n",
  },
  {
    slug: "learn-m1-math-m2",
    title: "Trailing Zeros of Factorial",
    statement: `তানভীর ল্যাব রিপোর্টে \`n!\` (n ফ্যাক্টোরিয়াল) লিখতে হয়েছে, আর শেষে কয়টা শূন্য আছে সেটা জানতে চান সহকর্মী। মুখে মুখে \`n!\` বানিয়ে গোনা যায় না — \`100!\`-এর শেষেই অনেক শূন্য। মনে করো প্রতিটি শূন্য আসে একটা \`10 = 2 × 5\` থেকে।

এক লাইনে একটা পূর্ণসংখ্যা \`n\` দেওয়া থাকে; \`n!\`-এর শেষে মোট কয়টা শূন্য আছে সেটি ছাপাও। উদাহরণ: \`5! = 120\`, তাই উত্তর \`1\`।`,
    inputFormat: `এক লাইনে একটা পূর্ণসংখ্যা \`n\`।`,
    outputFormat: `\`n!\`-এর শেষে শূন্যের সংখ্যা এক লাইনে।`,
    constraints: `\`0 <= n <= 10^9\`
\`n\` এত বড় হলে \`n!\` বানানোই যায় না; শুধু গুণক গুনতে হবে।`,
    editorial: `## ধারণা
একটা শূন্য মানে একটা \`10\` — অর্থাৎ একটা \`2\` আর একটা \`5\` যুগল। \`n!\`-এ ভাগকারী \`2\` সবসময় \`5\`-এর চেয়ে বেশি থাকে (জোড় সংখ্যাই অনেক), তাই শুধু \`5\` কয়বার আছে গোনাই যথেষ্ট। \`n\` থেকে ছোট প্রতিটি \`5\`-এর ঘাত একবার করে যোগ হয়: \`floor(n/5)\` সংখ্যা যেগুলো ৫ দিয়ে ভাগ যায়, \`floor(n/25)\` যেগুলো ২৫ দিয়ে (মানে দুইটা ৫), এভাবে চলতে থাকে।

## ধাপে ধাপে
1. \`n\` পড়ে \`count = 0\` ধরো।
2. \`n >= 5\` থাকতে পর্যন্ত: \`n //= 5\` করে তার ফল \`count\`-এ যোগ করো — এই এক লুপেই \`floor(n/5) + floor(n/25) + ...\` যোগ হয়ে যায়।
3. \`count\` ছাপাও।

\`\`\`python
import sys
n = int(sys.stdin.readline())
count = 0
while n >= 5:
    n //= 5
    count += n
print(count)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(log_5 n)\` — প্রতিবার \`n\` পাঁচে ভাগ হয়, তাই ১০^৯-এ মাত্র ১৩ ধাপ। মেমোরি \`O(1)\`। \`n!\` বানিয়ে গোনালে তো হয়ই না।

## সাধারণ ভুল
- শুধু \`floor(n / 5)\` যোগ করে থামা: \`125!\`-এ শূন্য \`25 + 5 + 1 = 31\`, কিন্তু শুধু \`floor(125/5) = 25\` পাবে।
- \`5\` আর \`2\` দুটোই গোনা — তখন অনেক বেশি শূন্য দেখাবে; অথচ \`2\` সীমাবদ্ধকারী নয়।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Math", "Factorial"],
    tests: [
      { input: "5\n", expectedOutput: "1\n", isSample: true },
      { input: "10\n", expectedOutput: "2\n", isSample: true },
      { input: "0\n", expectedOutput: "0\n", isSample: false },
      { input: "4\n", expectedOutput: "0\n", isSample: false },
      { input: "100\n", expectedOutput: "24\n", isSample: false },
      { input: "125\n", expectedOutput: "31\n", isSample: false },
      { input: "1000000000\n", expectedOutput: "249999998\n", isSample: false },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\ncount = 0\nwhile n >= 5:\n    n //= 5\n    count += n\nprint(count)\n",
  },
  {
    slug: "learn-m1-math-m3",
    title: "Prime Factorization",
    statement: `সাদিয়া অ্যাসাইনমেন্টে প্রতিটা সংখ্যার ফ্যাক্টর ট্রি আঁকছেন, কিন্তু শিক্ষক চান ফ্যাক্টরগুলো ছোট থেকে বড় প্রাইমে সাজিয়ে, কোন প্রাইম কয়বার বলে দেওয়া। যেমন \`360 = 2 × 2 × 2 × 3 × 3 × 5\` — এটাকে লিখতে হবে \`2 3 3 2 5 1\`, অর্থাৎ \`2\` ঘাত \`3\`, \`3\` ঘাত \`2\`, \`5\` ঘাত \`1\`।

এক লাইনে একটা পূর্ণসংখ্যা \`n\` দেওয়া থাকে; \`n\`-এর প্রাইম ফ্যাক্টর ঘাতসহ ছোট থেকে বড় ক্রমে স্পেস দিয়ে এক লাইনে ছাপাও।`,
    inputFormat: `এক লাইনে একটা পূর্ণসংখ্যা \`n\`।`,
    outputFormat: `\`p1 e1 p2 e2 ...\` আকারে প্রাইম আর তার ঘাত, স্পেস দিয়ে আলাদা।`,
    constraints: `\`2 <= n <= 10^12\`
\`sqrt(n)\` পর্যন্ত ভাগ করলেই হবে — পুরো \`n\` পর্যন্ত নয়।`,
    editorial: `## ধারণা
বিখ্যাত তথ্য: প্রতিটা সংখ্যার প্রাইম ফ্যাক্টরাইজেশন অদ্বিতীয়। \`d = 2\` থেকে শুরু করে \`d * d <= n\` পর্যন্ত ঘুরে যদি \`d\` দিয়ে ভাগ যায়, তাহলে \`d\` অবশ্যই প্রাইম (ছোট প্রাইম দিয়ে আগেই বাদ পড়ে গেছে) — \`n\` থেকে \`d\` যতবার যায় ততবার ভাগ করে ঘাত গোনো। লুপ শেষে \`n > 1\` থাকলে সেটা একটা প্রাইম বাকি থাকা ভাগকারী, তাই ঘাত \`১\`।

## ধাপে ধাপে
1. \`n\` পড়ে একটা খালি লিস্ট নাও।
2. \`d = 2\` থেকে \`d * d <= n\`: \`d\` দিয়ে যতবার ভাগ যায় ভাগ করে \`p\` আর \`e\` লিস্টে যোগ করো; \`d\` এগিয়ে ৩, ৫, ৭, ... (জোড় বাদ)।
3. লুপের পর \`n > 1\` থাকলে \`n\` আর \`1\` যোগ করো।
4. লিস্টটা স্পেস দিয়ে ছাপাও।

\`\`\`python
import sys
n = int(sys.stdin.readline())
pairs = []
d = 2
while d * d <= n:
    if n % d == 0:
        exponent = 0
        while n % d == 0:
            n //= d
            exponent += 1
        pairs.append(str(d))
        pairs.append(str(exponent))
    d = 3 if d == 2 else d + 2
if n > 1:
    pairs.append(str(n))
    pairs.append("1")
print(" ".join(pairs))
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(sqrt(n))\` — ১০^১২-এ সর্বোচ্চ ১০^৬ ধাপ, Python-এ কয়েক সেকেন্ডের মধ্যে বা তার কমে। মেমোরি ফল ছাড়া \`O(1)\`।

## সাধারণ ভুল
- শেষে \`n > 1\` চেক না করা: \`97\` লুপে কাটে না, তাই ফল খালি থাকবে — অথচ উত্তর \`97 1\`।
- \`d\`-কে ১ দিয়ে শুরু করা, বা ঘাত গোনার জন্য আলাদা করে প্রতিটি ভাগকারী যোগ করা — উভয়েই ফল ভুল বা অনন্ত হয়।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Number Theory", "Prime Factorization"],
    tests: [
      { input: "360\n", expectedOutput: "2 3 3 2 5 1\n", isSample: true },
      { input: "97\n", expectedOutput: "97 1\n", isSample: true },
      { input: "12\n", expectedOutput: "2 2 3 1\n", isSample: false },
      { input: "1024\n", expectedOutput: "2 10\n", isSample: false },
      { input: "65536\n", expectedOutput: "2 16\n", isSample: false },
      { input: "999999937\n", expectedOutput: "999999937 1\n", isSample: false },
      {
        input: "1000000000000\n",
        expectedOutput: "2 12 5 12\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\npairs = []\nd = 2\nwhile d * d <= n:\n    if n % d == 0:\n        exponent = 0\n        while n % d == 0:\n            n //= d\n            exponent += 1\n        pairs.append(str(d))\n        pairs.append(str(exponent))\n    d = 3 if d == 2 else d + 2\nif n > 1:\n    pairs.append(str(n))\n    pairs.append(\"1\")\nprint(\" \".join(pairs))\n",
  },
  {
    slug: "learn-m1-math-h2",
    title: "Fibonacci Modulo M",
    statement: `ডিসক্রিট ম্যাথের অ্যাসাইনমেন্টে তানভীরকে বের করতে হয় \`n\`-তম ফিবোনাচি সংখ্যার ভাগশেষ \`m\` দিয়ে, যেখানে \`n\` এত বড় যে সংখ্যাগুলো ধরে রাখাই সম্ভব নয়। ফিবোনাচি সংখ্যা হিসেব: \`F(0) = 0\`, \`F(1) = 1\`, আর \`F(k) = F(k-1) + F(k-2)\`।

এক লাইনে দুইটা পূর্ণসংখ্যা \`n\` আর \`m\` দেওয়া থাকে; \`F(n) mod m\` ছাপাও। উদাহরণ: \`n = 10\`, \`m = 1000\` হলে \`F(10) = 55\`, তাই উত্তর \`55\`।`,
    inputFormat: `এক লাইনে দুইটি পূর্ণসংখ্যা \`n\` আর \`m\`, স্পেস দিয়ে আলাদা।`,
    outputFormat: `\`F(n) mod m\` এক লাইনে।`,
    constraints: `\`0 <= n <= 10^18\`
\`1 <= m <= 10^9\`
\`F(n)\` নিজে কোটি অঙ্কের হতে পারে, তাই প্রতি ধাপে ভাগশেষ নিতে হবে।`,
    editorial: `## ধারণা
১০^১৮ ধাপে \`F(k) = F(k-1) + F(k-2)\` লুপ চালানো যায় না। দরকার \`O(log n)\` কৌশল: যেকোনো \`k\`-এর জন্য \`F(2k)\` আর \`F(2k+1)\` বের করা যায় \`F(k)\` আর \`F(k+1)\` দিয়ে — একে বলে fast doubling:

- \`F(2k) = F(k) × (2 × F(k+1) − F(k))\`
- \`F(2k+1) = F(k)^2 + F(k+1)^2\`

\`k\` অর্ধেক করে অর্ধেক করে নিচে নামলে প্রতিটি ধাপে \`m\` দিয়ে ভাগশেষ নিলে সংখ্যা ছোট থাকে, আর ধাপের সংখ্যা হয় \`O(log n)\`। জোড় হলে \`F(2k)\`, বিজোড় হলে \`F(2k+1)\` উত্তর হয়।

## ধাপে ধাপে
1. \`n\` ও \`m\` পড়ো; \`fib(k)\` ফাংশন লেখো যা \`F(k) mod m\` আর \`F(k+1) mod m\` ফেরত দেয়।
2. \`k = 0\` হলে \`(0, 1)\` ফেরত দাও।
3. বাকিতে \`a, b = fib(k // 2)\` নিয়ে উপরের দুটো সূত্র প্রয়োগ করো; প্রতিটি ধাপে \`% m\`।
4. \`k\` বিজোড় হলে \`F(2k+1)\` আর \`F(2k+2)\` ফেরত দাও, জোড় হলে \`F(2k)\`, \`F(2k+1)\`।
5. \`fib(n)\`-এর প্রথম মান ছাপাও।

\`\`\`python
import sys
n, m = map(int, sys.stdin.read().split())

def fib(k):
    if k == 0:
        return (0, 1)
    a, b = fib(k >> 1)
    c = (a * ((2 * b - a) % m)) % m
    d = (a * a + b * b) % m
    if k & 1:
        return (d, (c + d) % m)
    return (c, d)

print(fib(n)[0] % m)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(log n)\` — ১০^১৮-এও মাত্র ~৬০ ধাপ। স্পেস \`O(log n)\` (রিকারশন গভীরতা)। \`n\` ধাপের লুপ \`O(n)\` এই সীমায় কাজ করে না।

## সাধারণ ভুল
- \`2 * b - a\` ঋণাত্মক হলে সরাসরি গুণ: Python-এ সংখ্যা ঠিকই থাকে, কিন্তু ফল \`% m\` করার আগে \`% m\` দিয়ে ধরলে সব ভাষায় একই থাকে — আমাদের কোডে \`((2 * b - a) % m)\` সেটাই করেছে।
- \`m = 1\` সামলানো: যেকোনো সংখ্যার ১ দিয়ে ভাগশেষ ০, তাই উত্তর সবসময় \`0\` — টেস্টে ধরা আছে।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Math", "Fibonacci", "Modular Arithmetic"],
    tests: [
      { input: "0 1000\n", expectedOutput: "0\n", isSample: true },
      { input: "10 1000\n", expectedOutput: "55\n", isSample: true },
      { input: "1 1\n", expectedOutput: "0\n", isSample: false },
      { input: "7 13\n", expectedOutput: "0\n", isSample: false },
      { input: "50 1000000007\n", expectedOutput: "586268941\n", isSample: false },
      {
        input: "1000000000000000000 1000\n",
        expectedOutput: "875\n",
        isSample: false,
      },
      {
        input: "1000000000000000000 1000000007\n",
        expectedOutput: "209783453\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nn, m = map(int, sys.stdin.read().split())\n\ndef fib(k):\n    if k == 0:\n        return (0, 1)\n    a, b = fib(k >> 1)\n    c = (a * ((2 * b - a) % m)) % m\n    d = (a * a + b * b) % m\n    if k & 1:\n        return (d, (c + d) % m)\n    return (c, d)\n\nprint(fib(n)[0] % m)\n",
  },
];
