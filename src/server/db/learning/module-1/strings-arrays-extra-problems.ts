import type { SeedProblem } from "../../seed-problems";
import { newlineOutput } from "../generated-tests";

// সর্বোচ্চ আকারের টেস্ট দুটোর ইনপুট ও প্রত্যাশিত আউটপুট একসাথে তৈরি হয়।
const SYMMETRIC_MAX_MATRIX = Array.from({ length: 100 }, (_, i) =>
  Array.from({ length: 100 }, (_, j) => {
    const lo = Math.min(i, j);
    const hi = Math.max(i, j);
    return ((lo + 1) * 131 + (hi + 1) * 137) % 2001 - 1000;
  }),
);

const ROTATED_MAX_MATRIX = Array.from({ length: 100 }, (_, i) =>
  Array.from(
    { length: 100 },
    (_, j) => ((i * 999999937 + j * 999999929) % 2000000001) - 1000000000,
  ),
);

function squareMatrixInput(rows: number[][]): string {
  return `${rows.length}\n${rows.map((row) => row.join(" ")).join("\n")}\n`;
}

export const STRINGS_ARRAYS_EXTRA_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m1-strings-e2",
    title: "Reverse the Characters",
    statement: `সাদিয়া বোর্ডে একটা শব্দ ঠিক উল্টো অক্ষরে লিখছে যাতে কেউ পড়তে না পারে — শব্দের প্রতিটা অক্ষর শেষ থেকে আগে করে। তানভির বুঝেছে এটা শব্দের ক্রম উল্টানোর সমস্যা নয়, বরং একই শব্দের অক্ষরগুলো উল্টানো।

এক লাইনে একটা শব্দ (শুধু ছোট হাতের ইংরেজি অক্ষর) দেওয়া থাকে; অক্ষরগুলো উল্টো ক্রমে প্রিন্ট করো। উদাহরণ: \`campus\` হলে \`supmac\`।`,
    inputFormat: `এক লাইনে একটা শব্দ।`,
    outputFormat: `অক্ষরগুলো উল্টো ক্রমে এক লাইনে।`,
    constraints: `\`1 <= শব্দের দৈর্ঘ্য <= 1000\`, শুধু ছোট হাতের ইংরেজি অক্ষর।`,
    editorial: `## ধারণা
স্ট্রিং-এর ইনডেক্স \`0\` থেকে শুরু হয়, তাই দৈর্ঘ্য \`L\` হলে শেষ অক্ষরের ইনডেক্স \`L - 1\`। Python-এর স্লাইসিং \`s[::-1]\` ধনাত্মক ধাপ \`-1\` দিয়ে ঘুরে শেষ থেকে আগে অক্ষরগুলো তুলে দেয় — এটাই উল্টো স্ট্রিং। মনে রাখো এখানে শব্দ নয়, অক্ষর উল্টছে; শব্দের ক্রম উল্টাতে \`split()\` লাগত (যেটা আলাদা একটা সমস্যা)।

## ধাপে ধাপে
1. লাইনটা পড়ে শেষের নিউলাইন বাদ দাও।
2. \`s[::-1]\` দিয়ে উল্টো স্ট্রিং বানাও।
3. ছাপাও।

\`\`\`python
import sys
s = sys.stdin.readline().strip()
print(s[::-1])
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(L)\`, মেমোরি \`O(L)\` (নতুন স্ট্রিং ধরে)। লুপ চালিয়ে শেষ থেকে অক্ষর তুললেও একই জটিলতা।

## সাধারণ ভুল
- \`split()\` করে শব্দের লিস্ট উল্টানো: \`campus\` একটাই শব্দ, তাই ফল একই থাকবে; কিন্তু একাধিক শব্দ এলে ভিন্ন কাজ হয়ে যায় — প্রশ্নে একটা শব্দ দেওয়া।
- শেষে নিউলাইন না সরানোয় \`print\` নিজে একটা যোগ করে; \`strip()\` না করলে ইনপুটের নিউলাইনও উল্টো অংশে চলে আসে।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Strings", "Implementation"],
    tests: [
      { input: "campus\n", expectedOutput: "supmac\n", isSample: true },
      { input: "a\n", expectedOutput: "a\n", isSample: true },
      { input: "ab\n", expectedOutput: "ba\n", isSample: false },
      { input: "racecar\n", expectedOutput: "racecar\n", isSample: false },
      { input: "primeasia\n", expectedOutput: "aisaemirp\n", isSample: false },
      { input: "abcxyz\n", expectedOutput: "zyxcba\n", isSample: false },
      {
        input: `${"a".repeat(1000)}\n`,
        expectedOutput: `${"a".repeat(1000)}\n`,
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ns = sys.stdin.readline().strip()\nprint(s[::-1])\n",
  },
  {
    slug: "learn-m1-strings-e3",
    title: "Count Palindromic Words",
    statement: `নুসরাত ক্লাসের একটা শব্দতালিকা নিয়ে বসেছে এবং জানতে চায় তার মধ্যে কয়টা শব্দ এভাবে যে উল্টিয়ে পড়লেও একই হয় — অর্থাৎ palindrome। যেমন \`madam\` উল্টিয়ে \`madam\`, কিন্তু \`campus\` নয়।

এক লাইনে এক বা তার বেশি শব্দ দেওয়া থাকবে, স্পেস দিয়ে আলাদা (শুধু ছোট হাতের ইংরেজি অক্ষর)। কয়টা শব্দ palindrome সেটি ছাপাও। উদাহরণ: \`madam racecar campus\` হলে উত্তর \`2\`।`,
    inputFormat: `এক লাইনে শব্দগুলো, স্পেস দিয়ে আলাদা।`,
    outputFormat: `Palindrome শব্দের সংখ্যা এক লাইনে।`,
    constraints: `শব্দের সংখ্যা \`1 <= W <= 100\`
প্রতিটি শব্দের দৈর্ঘ্য \`1..50\`, শুধু ছোট হাতের ইংরেজি অক্ষর।`,
    editorial: `## ধারণা
একটা শব্দ palindrome হলে \`w == w[::-1]\`। তাই প্রতিটি শব্দ আলাদা করে উল্টোটার সাথে তুলনা করে কাউন্টার বাড়ালেই হয়। এক অক্ষরের শব্দ সবসময় palindrome (\`a == a\`), আর জোড় দৈর্ঘ্যের শব্দও প্রায়ই — তাই বিশেষ কোনো ছাঁড়ার দরকার নেই।

## ধাপে ধাপে
1. পুরো লাইন পড়ে শব্দের লিস্ট বানাও।
2. \`count = 0\` দিয়ে শুরু করো।
3. প্রতিটি শব্দের জন্য \`w == w[::-1]\` হলে \`count += 1\`।
4. \`count\` ছাপাও।

\`\`\`python
import sys
words = sys.stdin.read().split()
count = 0
for w in words:
    if w == w[::-1]:
        count += 1
print(count)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(L)\` (L = মোট অক্ষর), মেমোরি \`O(L)\` শব্দের লিস্টের জন্য। প্রতিটি শব্দের পাশাপাশি উল্টো তুলনা করলেও একই জটিলতা।

## সাধারণ ভুল
- শুধু পুরো লাইনটা উল্টিয়ে তুলনা: \`aba ba a\` উল্টিয়ে \`a ba aba\` — পুরো লাইন palindrome না, অথচ শব্দ তিনটাই palindrome, সঠিক উত্তর \`3\`।
- \`len(w) % 2 == 1\` দিয়ে শুধু বিজোড় দৈর্ঘ্য ধরা: \`abba\` বাদ পড়বে, কিন্তু উত্তর \`2\` না হয়ে \`1\` হবে।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Strings", "Palindromes"],
    tests: [
      { input: "madam racecar campus\n", expectedOutput: "2\n", isSample: true },
      { input: "a bb ccc\n", expectedOutput: "3\n", isSample: true },
      { input: "abba ba a\n", expectedOutput: "2\n", isSample: false },
      { input: "xyz\n", expectedOutput: "0\n", isSample: false },
      { input: "aa aa\n", expectedOutput: "2\n", isSample: false },
      { input: "noon noone\n", expectedOutput: "1\n", isSample: false },
      {
        input: `${Array.from({ length: 100 }, () => "a".repeat(50)).join(" ")}\n`,
        expectedOutput: "100\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nwords = sys.stdin.read().split()\ncount = 0\nfor w in words:\n    if w == w[::-1]:\n        count += 1\nprint(count)\n",
  },
  {
    slug: "learn-m1-strings-m2",
    title: "Most Frequent Character",
    statement: `তানভির ল্যাবের টাইপিং টেস্টের রেজাল্ট একটা লাইনে এসেছে — কোন অক্ষরটা সবচেয়ে বেশিবার এসেছে সেটা জানলে সে পরের অনুশীলনে ওই অক্ষরটাই বেশি ঘুরাবে। দুই বা ততোধিক অক্ষর সমান সংখ্যায় থাকলে যেটি বর্ণানুক্রমে আগে, সেটিই ধরতে হবে।

এক লাইনে শুধু ছোট হাতের ইংরেজি অক্ষর দিয়ে গঠিত একটা স্ট্রিং দেওয়া থাকে; সবচেয়ে বেশিবার আসা অক্ষরটি ছাপাও। উদাহরণ: \`abracadabra\`-তে \`a\` পাঁচবার, তাই উত্তর \`a\`।`,
    inputFormat: `এক লাইনে একটা স্ট্রিং।`,
    outputFormat: `সবচেয়ে বেশিবার আসা অক্ষর (টাই হলে বর্ণানুক্রমে ছোটটা) এক লাইনে।`,
    constraints: `শব্দের দৈর্ঘ্য \`1 <= L <= 100000\`, শুধু ছোট হাতের \`a..z\`।`,
    editorial: `## ধারণা
প্রতিটি অক্ষর কয়বার এসেছে গোনতে হলে \`Counter\` বা ২৬ ঘরের একটা অ্যারে কাজে লাগে। এরপর সর্বোচ্চ কাউন্টারটা বেছে নিতে হবে; টাই হলে বর্ণানুক্রমে ছোট অক্ষরটাই চাওয়া হয়েছে। এটা একটা কী দিয়ে খোঁজা যায়: কাউন্টার নেগেটিভ করে সর্বোচ্চ বের করা (\`-count\` সর্বোচ্চ মানে কাউন্টার সর্বনিম্ন), আর টাই হলে অক্ষরটা ছোট হবে — \`min\` দুটো শর্ত একসাথে সামলায়।

## ধাপে ধাপে
1. লাইন পড়ে স্ট্রিং নাও।
2. প্রতিটি অক্ষরের কাউন্টার বের করো (\`Counter\` দিয়ে)।
3. কী \`(-count, ch)\` মিনিমাম করে সেই অক্ষরটা বেছে নাও — প্রথমটা সর্বোচ্চ সংখ্যা, দ্বিতীয়টা টাই-ব্রেকার।
4. ফল ছাপাও।

\`\`\`python
import sys
from collections import Counter

s = sys.stdin.readline().strip()
counts = Counter(s)
best = min(counts, key=lambda ch: (-counts[ch], ch))
print(best)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(L)\` (L = স্ট্রিংয়ের দৈর্ঘ্য), মেমোরি \`O(1)\` — অক্ষর সর্বোচ্চ ২৬টা। লুপের ভেতরে \`s.count(ch)\` চালালে \`O(26 * L)\`, যা ১০^৫-এ চললেও অপ্রয়োজনীয় ধীর।

## সাধারণ ভুল
- টাই-ব্রেকিং ভুল: \`if count >= best\` লিখলে শেষটা জিতবে — \`abc\`-এ উত্তর \`c\` পাবে, অথচ চাওয়া \`a\`।
- ডিকশনারির ক্রম ধরে ফেলা: Python-এ ক্রম অক্ষর অনুযায়ী নয়, প্রথম দেখা অনুযায়ী — সোর্ট বা \`min\` ছাড়া টাই ঠিক থাকবে না।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Strings", "Counting"],
    tests: [
      { input: "abracadabra\n", expectedOutput: "a\n", isSample: true },
      { input: "zzz\n", expectedOutput: "z\n", isSample: true },
      { input: "abc\n", expectedOutput: "a\n", isSample: false },
      { input: "ba\n", expectedOutput: "a\n", isSample: false },
      { input: "aabb\n", expectedOutput: "a\n", isSample: false },
      { input: "mississippi\n", expectedOutput: "i\n", isSample: false },
      {
        input: `${"z".repeat(60000)}${"a".repeat(40000)}\n`,
        expectedOutput: "z\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import Counter\n\ns = sys.stdin.readline().strip()\ncounts = Counter(s)\nbest = min(counts, key=lambda ch: (-counts[ch], ch))\nprint(best)\n",
  },
  {
    slug: "learn-m1-strings-m3",
    title: "Matrix Symmetry Check",
    statement: `হল ঘরের সিট প্ল্যান দেখে সাদিয়া বুঝতে চায় কি প্ল্যানটা কাঠামোগতভাবে সমানুপাতিক — যে ঘরে বসে আছে সেটা উল্টো জায়গাতেও একইভাবে লেখা কিনা। গাণিতিকভাবে একটা বর্গ ম্যাট্রিক্স তখনই symmetric যখন \`a[i][j]\` সবসময় \`a[j][i]\`-এর সমান।

প্রথম লাইনে \`n\`, তারপর \`n\` লাইনে \`n x n\` ম্যাট্রিক্স দেওয়া থাকবে। Symmetric হলে \`YES\`, না হলে \`NO\`। উদাহরণ: \`1 2 / 2 1\` হলে \`YES\`, \`1 2 / 3 4\` হলে \`NO\`।`,
    inputFormat: `প্রথম লাইনে \`n\`। পরের \`n\` লাইনে প্রতিটিতে \`n\`টি পূর্ণসংখ্যা।`,
    outputFormat: `Symmetric হলে \`YES\`, না হলে \`NO\` এক লাইনে।`,
    constraints: `ম্যাট্রিক্সের আকার \`1 <= n <= 100\`
\`-10^9 <= a_ij <= 10^9\`
ডায়াগোনালের ঘর নিজের সাথে সবসময় মিলে, তাই শুধু \`i != j\` ঘর তুলনা করলেই হয়।`,
    editorial: `## ধারণা
Transpose-এ সারি আর কলামের ভূমিকা অদলবদল হয়। ম্যাট্রিক্স symmetric হলে তার transpose নিজের সমান — অর্থাৎ \`i\`-তম সারির \`j\`-তম ঘর \`j\`-তম সারির \`i\`-তম ঘরের সমান। তাই \`i < j\` শুধু ঘরগুলো একবার তুলনা করলেই যথেষ্ট; \`i = j\` (ডায়াগোনাল) তুলনা করলেও সবসময় মিলবে, তাই সেটা বাদ দিলে অপ্রয়োজনীয় কাজ কমে।

## ধাপে ধাপে
1. \`n\` আর ঘরের ফ্ল্যাট লিস্ট পড়ে নাও — ঘর \`(i, j)\` থাকে \`i * n + j\` অফসেটে।
2. \`ok = True\` ধরে \`i = 0..n-1\`, \`j = i+1..n-1\` ঘুরো।
3. \`values[i*n + j] != values[j*n + i]\` পেলে \`ok = False\`।
4. \`ok\` অনুযায়ী \`YES\` বা \`NO\` ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
values = data[1:]
ok = True
for i in range(n):
    for j in range(i + 1, n):
        if values[i * n + j] != values[j * n + i]:
            ok = False
print("YES" if ok else "NO")
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n^2)\` — প্রতিটি ঘর একবার। মেমোরি ইনপুট ছাড়া \`O(1)\`। পুরো \`n^2\` ঘর সরাসরি তুলনা করলেও চলত, কিন্তু অর্ধেক ঘরই যথেষ্ট।

## সাধারণ ভুল
- \`i\` আর \`j\` দুটোই \`0..n-1\` ঘোরানো — তখন একই জোড়া দুইবার মিলিয়ে \`i = j\`-ও তুলনা হয়, ফল তো ঠিকই থাকে কিন্তু কাজ দ্বিগুণ।
- ফ্ল্যাট লিস্টে অফসেট ভুল: \`a[i][j]\`-এর জায়গায় \`values[i + j]\` লিখলে \`n > 1\`-এ সব ঘর মিলিয়ে যায়।
- বর্গাকার না হলেও সমানুপাতিক ধরা — এখানে শর্ত অনুযায়ী সবসময় \`n x n\`।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Matrix", "Arrays", "Implementation"],
    tests: [
      { input: "2\n1 2\n2 1\n", expectedOutput: "YES\n", isSample: true },
      { input: "2\n1 2\n3 4\n", expectedOutput: "NO\n", isSample: true },
      { input: "1\n5\n", expectedOutput: "YES\n", isSample: false },
      {
        input: "3\n1 2 3\n2 4 5\n3 5 6\n",
        expectedOutput: "YES\n",
        isSample: false,
      },
      {
        input: "3\n1 2 3\n2 4 99\n3 5 6\n",
        expectedOutput: "NO\n",
        isSample: false,
      },
      {
        input: squareMatrixInput(SYMMETRIC_MAX_MATRIX),
        expectedOutput: "YES\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nvalues = data[1:]\nok = True\nfor i in range(n):\n    for j in range(i + 1, n):\n        if values[i * n + j] != values[j * n + i]:\n            ok = False\nprint(\"YES\" if ok else \"NO\")\n",
  },
  {
    slug: "learn-m1-strings-h2",
    title: "Rotate Matrix 90 Degrees",
    statement: `ডিপার্টমেন্ট হলের দেয়ালে সাজানো বর্গাকার পোস্টার-গ্রিডটা এখন পাশে হেলানো — তানভির চায় পুরো গ্রিডটা ৯০ ডিগ্রি ঘড়ির কাঁটার দিকে ঘুরিয়ে নতুনভাবে সাজাতে। ঘোরানোর পর যে ঘরটা আগে \`i\` সারির \`j\` কলামে ছিল, সেটা নতুন গ্রিডে \`j\` সারির \`n - 1 - i\` নম্বর কলামে চলে যায় — হিসেবটা করে বলো।

প্রথম লাইনে \`n\`, তারপর \`n\` লাইনে \`n x n\` ম্যাট্রিক্স দেওয়া থাকবে; ঘড়ির কাঁটার দিকে ৯০ ডিগ্রি ঘোরানো ফল ছাপাও। উদাহরণ: \`1 2 / 3 4\` হলে \`3 1 / 4 2\`।`,
    inputFormat: `প্রথম লাইনে \`n\`। পরের \`n\` লাইনে প্রতিটিতে \`n\`টি পূর্ণসংখ্যা।`,
    outputFormat: `ঘোরানো ম্যাট্রিক্স \`n\` লাইনে, প্রতি লাইনে \`n\`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।`,
    constraints: `ম্যাট্রিক্সের আকার \`1 <= n <= 100\`
\`-10^9 <= a_ij <= 10^9\`
বর্গাকার বলে \`n\` দুইবারই কাজ করে — ঘোরানোর পরও আকৃতি \`n x n\`।`,
    editorial: `## ধারণা
ঘড়ির কাঁটার দিকে ৯০° ঘোরালে নতুন ম্যাট্রিক্সের ঘর \`b[j][n - 1 - i] = a[i][j]\`। সহজভাবে দুই ধাপে ভাঙা যায়: আগে transpose (\`a[j][i]\`), তারপর প্রতিটি সারি উল্টে দেওয়া। বা সরাসরি বলা যায় — নতুন সারি \`j\`-এ পুরনো কলাম \`j\`-এর ঘরগুলো উপর থেকে নিচে বসে: নতুন \`j\` সারির প্রথম ঘর \`a[n-1][j]\`, পরেরটা \`a[n-2][j]\`, ... শেষটা \`a[0][j]\`।

## ধাপে ধাপে
1. \`n\` আর ফ্ল্যাট লিস্ট পড়ে নাও — ঘর \`(i, j)\` অফসেট \`i * n + j\`।
2. \`j = 0\` থেকে \`n - 1\`: কলাম \`j\`-এর ঘর নিচ থেকে উপরে (প্রতিটি \`i\`-এর জন্য \`values[(n - 1 - i) * n + j]\`) এক সারিতে বসাও।
3. প্রতিটি সারি স্পেস দিয়ে প্রিন্ট করো।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
values = data[1:]
for j in range(n):
    print(*[values[(n - 1 - i) * n + j] for i in range(n)])
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n^2)\` — প্রতিটি ঘর একবার পড়া হয়, আউটপুটও \`n^2\`। মেমোরি ইনপুট ও আউটপুট ছাড়া \`O(1)\` (নতুন ম্যাট্রিক্স না বানিয়েও চলে)।

## সাধারণ ভুল
- উল্টো দিকে ঘোরানো (ঘড়ির কাঁটার বিপরীতে): \`1 2 / 3 4\`-এ তখন \`2 4 / 1 3\`, কিন্তু চাওয়া \`3 1 / 4 2\`।
- শুধু \`b[j][i] = a[i][j]\` (শুধু transpose) লেখা — সেটা ঘূর্ণন নয়, মাত্র অর্ধেক পথ।
- সারি উল্টানোর জায়গায় কলাম উল্টানো, বা \`n\` বিজোড় হলে কেন্দ্রের ঘর সামলানো ভুলে যাওয়া — সূত্র ব্যবহার করলে কেন্দ্র নিজে থেকেই ঠিক বসে।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Matrix", "Arrays", "Implementation"],
    tests: [
      { input: "1\n7\n", expectedOutput: "7\n", isSample: true },
      {
        input: "3\n1 2 3\n4 5 6\n7 8 9\n",
        expectedOutput: "7 4 1\n8 5 2\n9 6 3\n",
        isSample: true,
      },
      {
        input: "2\n1 2\n3 4\n",
        expectedOutput: "3 1\n4 2\n",
        isSample: false,
      },
      {
        input: "2\n-1 -2\n-4 -3\n",
        expectedOutput: "-4 -1\n-3 -2\n",
        isSample: false,
      },
      {
        input: "4\n1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15 16\n",
        expectedOutput: "13 9 5 1\n14 10 6 2\n15 11 7 3\n16 12 8 4\n",
        isSample: false,
      },
      {
        input: squareMatrixInput(ROTATED_MAX_MATRIX),
        expectedOutput: newlineOutput(
          ROTATED_MAX_MATRIX.map((_, j) =>
            ROTATED_MAX_MATRIX.map((row) => row[j])
              .reverse()
              .join(" "),
          ),
        ),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nvalues = data[1:]\nfor j in range(n):\n    print(*[values[(n - 1 - i) * n + j] for i in range(n)])\n",
  },
];
