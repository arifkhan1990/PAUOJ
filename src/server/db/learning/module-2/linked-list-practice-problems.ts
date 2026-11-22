import type { SeedProblem } from "../../seed-problems";

export const LINKED_LIST_PRACTICE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m2-linked-list-e2",
    title: "Keep Every Other Member",
    statement: `ক্লাবের পুরনো তালিকা থেকে রফি প্রতি দুইজনে একজনকে রেখে বাকিদের বাদ দিতে চায় — প্রথম সদস্য থাকবে, দ্বিতীয় বাদ, তৃতীয় থাকবে, এভাবে চলবে। তালিকাটা লিংকড লিস্ট হিসেবে সাজানো; তুমি শুধু বেঁচে থাকা সদস্যদের ক্রমটা ছাপো।

অর্থাৎ ১ম, ৩য়, ৫ম, ... অবস্থানের মানগুলো রাখতে হবে।`,
    inputFormat: `প্রথম লাইনে \`n\`; দ্বিতীয় লাইনে \`n\`টি মান।`,
    outputFormat: `বেঁচে থাকা মানগুলো এক লাইনে স্পেস দিয়ে আলাদা করে ছাপো।`,
    constraints: `\`1 <= n <= 200000\`
প্রতিটি মান ৩২-বিট পূর্ণসংখ্যার মধ্যে।`,
    editorial: `## ধারণা
লিংকড লিস্টে দুটি পয়েন্টার নাও: \`prev\` আর \`curr\`। \`curr\` হলো যে নোডটা রাখা হবে, আর \`curr.next\` হলো যে নোডটা বাদ যাবে। বাদ দেওয়ার নোডটা এড়িয়ে \`prev.next = curr.next\` করলেই লিংক ভেঙে যায় না, শুধু মাঝের নোডটা বাদ পড়ে। তারপর \`curr\`-কে দুই ধাপ এগোও।

অ্যারে দিয়ে ভাবলে কাজটা আরও সরল: সূচি \`0, 2, 4, ...\`-এর মানগুলোই থাকবে।

## ধাপে ধাপে
1. \`n\` আর মানগুলো পড়ো।
2. খালি ফলাফল তালিকা নাও।
3. \`i = 0\` থেকে দুই ধাপে এগিয়ে \`a[i]\` যোগ করো।
4. ফলাফল স্পেস দিয়ে ছাপো।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
a = data[1:1 + n]
print(' '.join(map(str, a[::2])))
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\`, স্পেস \`O(n)\` — প্রতিটি নোড একবার দেখা হয়।

## সাধারণ ভুল
- \`curr = curr.next\` লিখে দুই ধাপ এগোনো: দ্বিতীয় নোডটা বাদ দেওয়ার বদলে পরেরটাও বাদ পড়ে।
- শেষ নোডের \`next\` পরীক্ষা না করা: জোড় সংখ্যক নোডে শেষে \`None\` আসে, সেখানে ক্র্যাশ করা যাবে না।
- নতুন লিস্ট না বানিয়ে পুরনো লিস্টে ফেরত না দেওয়া: প্রশ্নে রূপান্তরিত ক্রমটাই চাওয়া।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Linked List", "Pointers"],
    tests: [
      { input: "5\n10 20 30 40 50\n", expectedOutput: "10 30 50\n", isSample: true },
      { input: "6\n1 2 3 4 5 6\n", expectedOutput: "1 3 5\n", isSample: true },
      { input: "1\n7\n", expectedOutput: "7\n", isSample: false },
      { input: "2\n9 8\n", expectedOutput: "9\n", isSample: false },
      { input: "4\n-1 -2 -3 -4\n", expectedOutput: "-1 -3\n", isSample: false },
      {
        input: `200000\n${Array.from({ length: 200000 }, (_, i) => i + 1).join(" ")}\n`,
        expectedOutput: `${Array.from({ length: 100000 }, (_, i) => 2 * i + 1).join(" ")}\n`,
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:1 + n]\nprint(' '.join(map(str, a[::2])))\n",
  },
  {
    slug: "learn-m2-linked-list-e3",
    title: "Remove a Value Everywhere",
    statement: `সাদিয়ার পুরনো সদস্য-তালিকায় একটা নির্দিষ্ট আইডি একাধিকবার ঢুকে গেছে। সে সেই আইডিটা সব জায়গা থেকে মুছে দিতে চায়, বাকি সদস্যদের ক্রম অপরিবর্তিত রেখে। সব মুছে গেলে \`EMPTY\` ছাপো।

লিংকড লিস্টে এ কাজ করতে হয় \`prev\`-এর \`next\` লিংক বদলে, যাতে বাদ পড়া নোডের পরের নোড সরাসরি জুড়ে যায়।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`x\`; দ্বিতীয় লাইনে \`n\`টি মান।`,
    outputFormat: `অবশিষ্ট মানগুলো স্পেস দিয়ে, অথবা \`EMPTY\`।`,
    constraints: `\`1 <= n <= 200000\`
\`-10^9 <= x, a_i <= 10^9\``,
    editorial: `## ধারণা
লিংকড লিস্টে দুটি অবস্থা সামলাতে হয়: বাদ দেওয়া নোড যদি **মাথা** হয়, তবে \`head\`-কে পরের নোডে সরাতে হবে; নাহলে আগের নোডের \`next\` বদলাতে হবে। ডামি নোড (\`dummy\`) দিয়ে শুরু করলে মাথার আলাদা কেস লাগে না: \`dummy.next = head\`, তারপর \`prev\` নিয়ে এগোও।

অ্যারে দিয়ে ভাবলে ফিল্টার করাই যথেষ্ট: যেসব মান \`x\` নয়, শুধু সেগুলো রাখো।

## ধাপে ধাপে
1. \`n\`, \`x\`, আর মানগুলো পড়ো।
2. যে মান \`x\`-এর সমান নয়, সেগুলো নতুন তালিকায় রাখো।
3. তালিকা খালি হলে \`EMPTY\` ছাপো, নাহলে স্পেস দিয়ে মানগুলো।
4. লিংকড লিস্টে করলে ডামি নোড দিয়ে শুরু করে প্রতিটি নোডে \`prev.next\` ঠিক করো।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, x = data[0], data[1]
kept = [v for v in data[2:2 + n] if v != x]
print('EMPTY' if not kept else ' '.join(map(str, kept)))
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\`, স্পেস \`O(n)\` — প্রতিটি নোড একবার দেখা হয়।

## সাধারণ ভুল
- শুধু মাঝের নোড মুছে মাথার কেস ভুলে যাওয়া: প্রথম কয়েকটা নোডই বাদ পড়তে পারে।
- একবারে সব ডুপ্লিকেট না মোছা: \`x\` পরপরหลายবার থাকলে প্রতিটা বাদ দিতে হবে।
- সব মুছে গেলে খালি লাইন ছাপা: নির্দিষ্ট \`EMPTY\` শব্দটাই চাওয়া।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Linked List", "Pointers"],
    tests: [
      { input: "6 3\n1 3 2 3 3 4\n", expectedOutput: "1 2 4\n", isSample: true },
      { input: "3 5\n5 5 5\n", expectedOutput: "EMPTY\n", isSample: true },
      { input: "1 1\n2\n", expectedOutput: "2\n", isSample: false },
      { input: "5 2\n2 1 2 3 2\n", expectedOutput: "1 3\n", isSample: false },
      { input: "4 -1\n-1 0 -1 7\n", expectedOutput: "0 7\n", isSample: false },
      {
        input: `200000 5\n${Array.from({ length: 200000 }, () => 5).join(" ")}\n`,
        expectedOutput: "EMPTY\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, x = data[0], data[1]\nkept = [v for v in data[2:2 + n] if v != x]\nprint('EMPTY' if not kept else ' '.join(map(str, kept)))\n",
  },
  {
    slug: "learn-m2-linked-list-m2",
    title: "Rotate the Member Line",
    statement: `ক্লাবের সদস্যদের লিংকড লিস্টটা রফি ডান দিকে \`k\` ধাপ ঘোরাতে চায়। এক ধাপ ডানে ঘোরালে শেষ সদস্য সবার আগে আসে, বাকিরা এক ধাপ পিছিয়ে যায়।

\`k\` বড় হলেও চলবে; মোট দৈর্ঘ্যের সমান ঘোরালে তালিকা অপরিবর্তিত থাকে।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`k\`; দ্বিতীয় লাইনে \`n\`টি মান।`,
    outputFormat: `ঘোরানোর পরের তালিকা এক লাইনে স্পেস দিয়ে।`,
    constraints: `\`1 <= n <= 200000\`
\`0 <= k <= 10^9\``,
    editorial: `## ধারণা
ডান দিকে \`k\` ঘোরানো মানে শেষ \`k % n\`টি নোড সামনে আসবে। লিংকড লিস্টে প্রথমে \`n\`, তারপর \`k % n\` বের করো। তালিকার শেষ নোডকে প্রথম নোডের সঙ্গে জুড়ে দিলে পুরোটা বৃত্ত হয়; তারপর নতুন শেষ নোড (মূল তালিকার \`n - k % n\`-তম) থেকে লিংক কেটে দিলেই ঘোরানো তালিকা পাওয়া যায়।

অ্যারে দিয়ে সরল রূপ: শেষ \`k\`টা মান সামনে নিয়ে বাকিটা পরে বসাও, অথবা সূচি \`(i + n - k) % n\` ধরে পড়ো।

## ধাপে ধাপে
1. \`n\`, \`k\`, আর মানগুলো পড়ো।
2. \`k = k % n\`; \`k == 0\` হলে তালিকা অপরিবর্তিত।
3. শেষ \`k\`টি মান আগে, তারপর প্রথম \`n - k\`টি মান ছাপো।
4. লিংকড লিস্টে শেষ নোডের \`next\` প্রথমে জুড়ে বৃত্ত বানিয়ে নতুন শেষ থেকে কেটে দাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, k = data[0], data[1]
a = data[2:2 + n]
k %= n
rotated = a[n - k:] + a[:n - k] if k else a
print(' '.join(map(str, rotated)))
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\`, স্পেস \`O(n)\` — তালিকা একবার পড়তে হয়।

## সাধারণ ভুল
- \`k\` কে \`n\` দিয়ে ভাগ না করা: \`k = 10^9\`, \`n = 5\` হলে সরাসরি সূচি ঋণাত্মক হয়ে যায়।
- বাঁ দিকে ঘোরানোর সঙ্গে গুলিয়ে ফেলা: ডানে \`k\` মানে শেষের \`k\`টা সামনে।
- \`k = 0\`-তে খালি টুকরো যোগ করে \`a[:0]\` ভুলভাবে সামনে বসানো।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Linked List", "Two Pointers"],
    tests: [
      { input: "5 2\n1 2 3 4 5\n", expectedOutput: "4 5 1 2 3\n", isSample: true },
      { input: "3 5\n1 2 3\n", expectedOutput: "2 3 1\n", isSample: true },
      { input: "3 0\n7 8 9\n", expectedOutput: "7 8 9\n", isSample: false },
      { input: "1 1000000000\n42\n", expectedOutput: "42\n", isSample: false },
      { input: "4 2\n-1 -2 -3 -4\n", expectedOutput: "-3 -4 -1 -2\n", isSample: false },
      {
        input: `200000 199999\n${Array.from({ length: 200000 }, (_, i) => i + 1).join(" ")}\n`,
        expectedOutput: `${Array.from({ length: 199999 }, (_, i) => i + 2).join(" ")} 1\n`,
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, k = data[0], data[1]\na = data[2:2 + n]\nk %= n\nrotated = a[n - k:] + a[:n - k] if k else a\nprint(' '.join(map(str, rotated)))\n",
  },
  {
    slug: "learn-m2-linked-list-m3",
    title: "Partition Around a Pivot",
    statement: `সাদিয়া সদস্যদের আইডি একটা পিভটের চারপাশে দুই ভাগে ভাগ করতে চায়: পিভটের চেয়ে ছোট আইডিগুলো আগে, বড় বা সমান আইডিগুলো পরে। দুই ভাগের ভেতরের ক্রম যেন আগের মতোই থাকে — এটাই **স্থিতিশীল** ভাগ।

লিংকড লিস্টে দুইটা আলাদা তালিকা (\`small\`, \`large\`) বানিয়ে শেষে জুড়ে দিলেই স্থিতিশীলতা রক্ষা পায়।`,
    inputFormat: `প্রথম লাইনে \`n\` আর পিভট \`x\`; দ্বিতীয় লাইনে \`n\`টি মান।`,
    outputFormat: `ভাগ করা তালিকা এক লাইনে স্পেস দিয়ে।`,
    constraints: `\`1 <= n <= 200000\`
\`-10^9 <= x, a_i <= 10^9\``,
    editorial: `## ধারণা
লিংকড লিস্টে সরাসরি অদলবদল করলে স্থিতিশীলতা নষ্ট হতে পারে। তাই দুটি ডামি নোড নাও: \`small\` আর \`large\`। প্রতিটি নোড দেখে \`value < x\` হলে \`small\`-এর শেষে জুড়ো, নাহলে \`large\`-এর শেষে। শেষে \`small\`-এর লেজকে \`large\`-এর মাথার সঙ্গে জুড়ে দাও, আর \`large\`-এর লেজের \`next = None\` করো।

অ্যারে দিয়ে একই কাজ দুইবার ফিল্টার করে করা যায়।

## ধাপে ধাপে
1. \`n\`, \`x\`, আর মানগুলো পড়ো।
2. \`x\`-এর চেয়ে ছোট মানগুলো প্রথম তালিকায়, বাকিগুলো দ্বিতীয় তালিকায় রাখো।
3. দুই তালিকা জোড়া দাও।
4. ফলাফল স্পেস দিয়ে ছাপো।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, x = data[0], data[1]
a = data[2:2 + n]
small = [v for v in a if v < x]
large = [v for v in a if v >= x]
print(' '.join(map(str, small + large)))
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\`, স্পেস \`O(n)\` — প্রতিটি নোড একবার দেখে দুই তালিকার একটায় যায়।

## সাধারণ ভুল
- \`<= x\` আর \`< x\` এলোমেলো করা: পিভটের সমান মান ডান ভাগে যাবে।
- স্থিতিশীলতা না রাখা: বড় মানের মধ্যে আগের ক্রম উল্টে গেলে উত্তর ভুল।
- \`large\`-এর লেজের \`next\` না কেটে পুরনো লিংক রেখে দেওয়া: চক্র তৈরি হতে পারে।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Linked List", "Two Pointers", "Partition"],
    tests: [
      { input: "6 3\n1 4 3 2 5 2\n", expectedOutput: "1 2 2 4 3 5\n", isSample: true },
      { input: "5 0\n3 -1 0 -5 2\n", expectedOutput: "-1 -5 3 0 2\n", isSample: true },
      { input: "5 5\n1 2 3 4 5\n", expectedOutput: "1 2 3 4 5\n", isSample: false },
      { input: "3 10\n1 2 3\n", expectedOutput: "1 2 3\n", isSample: false },
      { input: "3 -5\n-6 -5 -4\n", expectedOutput: "-6 -5 -4\n", isSample: false },
      {
        input: `200000 100000\n${Array.from({ length: 200000 }, (_, i) => i + 1).join(" ")}\n`,
        expectedOutput: `${Array.from({ length: 200000 }, (_, i) => i + 1).join(" ")}\n`,
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, x = data[0], data[1]\na = data[2:2 + n]\nsmall = [v for v in a if v < x]\nlarge = [v for v in a if v >= x]\nprint(' '.join(map(str, small + large)))\n",
  },
  {
    slug: "learn-m2-linked-list-h2",
    title: "Reverse Alternate Blocks",
    statement: `ক্লাবের সদস্য-তালিকায় রফি ব্লক-ব্লক উল্টো করতে চায়: প্রথম \`k\` জনকে উল্টো করবে, পরের \`k\` জনকে যেমন আছে তেমন রাখবে, আবার পরের \`k\` জনকে উল্টো করবে — এভাবে সবশেষ পর্যন্ত। শেষের অসম্পূর্ণ ব্লকও একই নিয়মে উল্টো হবে (প্রথম ব্লক হলে) বা অপরিবর্তিত থাকবে।

রূপান্তরিত তালিকা ছাপো।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`k\`; দ্বিতীয় লাইনে \`n\`টি মান।`,
    outputFormat: `রূপান্তরের পরের তালিকা এক লাইনে স্পেস দিয়ে।`,
    constraints: `\`1 <= n <= 200000\`
\`1 <= k <= n\``,
    editorial: `## ধারণা
লিংকড লিস্টে ব্লক ধরে এগোও। \`reverse\` পতাকা দিয়ে বুঝে রাখো এখন উল্টো করতে হবে কি না। প্রতিটি ব্লকে \`k\`টি নোডের আগের-পরের লিংক উল্টে দাও; উল্টো না করার ব্লকে শুধু পয়েন্টার এগিয়ে নাও। ব্লকের শেষে পতাকা উল্টে দাও। শেষের অসম্পূর্ণ ব্লকেও একই যুক্তি খাটে, কারণ লুপ \`k\`-এর কম নোড পেলেও পুরোটা প্রসেস করে।

অ্যারে দিয়ে ভাবলে প্রতিটি \`k\` আকারের টুকরোতে: জোড় অবস্থানে (০, ২, ...) টুকরোটা উল্টে দাও, বিজোড় অবস্থানে যেমন আছে তেমন রাখো।

## ধাপে ধাপে
1. \`n\`, \`k\`, আর মানগুলো পড়ো।
2. \`i = 0\` থেকে \`k\` করে এগোও; ব্লক নম্বর জোড় হলে টুকরোটা উল্টো করো।
3. সব টুকরো জোড়া দিয়ে ফলাফল বানাও।
4. স্পেস দিয়ে ছাপো।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, k = data[0], data[1]
a = data[2:2 + n]
out = []
for i in range(0, n, k):
    block = a[i:i + k]
    out.extend(block if (i // k) % 2 else block[::-1])
print(' '.join(map(str, out)))
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\`, স্পেস \`O(n)\` — প্রতিটি নোড একবারই নতুন তালিকায় যায়।

## সাধারণ ভুল
- প্রতিটি ব্লকই উল্টে ফেলা: একান্তর ব্লক বাদ দিতে হবে।
- শেষ অসম্পূর্ণ ব্লকে আলাদা নিয়ম ভাবা: একই পতাকা-যুক্তি সেখানেও খাটে।
- \`k = 1\`-এ লিংক ভাঙা: এক উপাদানের ব্লক উল্টালে কিছুই বদলায় না।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Linked List", "Pointers", "Blocks"],
    tests: [
      { input: "8 2\n1 2 3 4 5 6 7 8\n", expectedOutput: "2 1 3 4 6 5 7 8\n", isSample: true },
      { input: "5 3\n1 2 3 4 5\n", expectedOutput: "3 2 1 4 5\n", isSample: true },
      { input: "4 2\n1 2 3 4\n", expectedOutput: "2 1 3 4\n", isSample: false },
      { input: "1 5\n9\n", expectedOutput: "9\n", isSample: false },
      { input: "6 4\n1 2 3 4 5 6\n", expectedOutput: "4 3 2 1 5 6\n", isSample: false },
      {
        input: `200000 1000\n${Array.from({ length: 200000 }, (_, i) => i + 1).join(" ")}\n`,
        expectedOutput: `${Array.from({ length: 200 }, (_, b) => {
          const block = Array.from({ length: 1000 }, (_, j) => b * 1000 + j + 1);
          return (b % 2 ? block : block.reverse()).join(" ");
        }).join(" ")}\n`,
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, k = data[0], data[1]\na = data[2:2 + n]\nout = []\nfor i in range(0, n, k):\n    block = a[i:i + k]\n    out.extend(block if (i // k) % 2 else block[::-1])\nprint(' '.join(map(str, out)))\n",
  },
];
