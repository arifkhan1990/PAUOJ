import type { SeedProblem } from "../../seed-problems";

export const HASHING_PRACTICE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m2-hashing-e2",
    title: "First Unique Letter",
    statement: `ক্লাবের নাম-তালিকায় কিছু অক্ষর বারবার ফিরে আসছে। রফি বাঁ দিক থেকে দেখে প্রথম এমন অক্ষরটা খুঁজছে যেটা পুরো স্ট্রিংয়ে ঠিক একবারই আছে।

সেই অক্ষরটা ছাপো; এমন অক্ষর না থাকলে \`-\` ছাপো।`,
    inputFormat: `এক লাইনে ছোট হাতের ইংরেজি অক্ষরের স্ট্রিং।`,
    outputFormat: `প্রথম অনন্য অক্ষর, অথবা \`-\`।`,
    constraints: `\`1 <= len(s) <= 100000\`
স্ট্রিংয়ে শুধু \`a\` থেকে \`z\` থাকে।`,
    editorial: `## ধারণা
প্রথমে প্রতিটি অক্ষর কতবার আছে তা গুনে রাখো — হ্যাশ ম্যাপ বা ২৬ আকারের অ্যারে দিয়ে। তারপর স্ট্রিংটা আবার বাঁ থেকে ডানে পড়ো; যে অক্ষরের গণনা \`1\`, সেটাই প্রথম অনন্য অক্ষর। দুই পাস লাগে, কিন্তু প্রতিটি পাস \`O(n)\`।

## ধাপে ধাপে
1. স্ট্রিংটা পড়ো।
2. প্রতিটি অক্ষরের গণনা বাড়াও।
3. আবার বাঁ থেকে ঘুরে প্রথম অক্ষর খোঁজো যার গণনা \`1\`।
4. পেলে সেটা, না পেলে \`-\` ছাপো।

\`\`\`python
import sys
from collections import Counter
s = sys.stdin.readline().strip()
count = Counter(s)
answer = '-'
for ch in s:
    if count[ch] == 1:
        answer = ch
        break
print(answer)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\`, স্পেস \`O(1)\` — অক্ষরের সংখ্যা সর্বোচ্চ ২৬।

## সাধারণ ভুল
- শেষ অনন্য অক্ষরটা ধরা: প্রশ্নে **প্রথম** অনন্য অক্ষর চাওয়া।
- গণনা না করে প্রতিবার পুরো স্ট্রিং স্ক্যান: \`O(n^2)\` হয়ে বড় ইনপুটে ধীর।
- অনন্য অক্ষর না থাকলে খালি লাইন ছাপা: \`-\` নির্দিষ্টভাবে চাওয়া।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Hashing", "String", "Counting"],
    tests: [
      { input: "statistics\n", expectedOutput: "a\n", isSample: true },
      { input: "aabbcc\n", expectedOutput: "-\n", isSample: true },
      { input: "z\n", expectedOutput: "z\n", isSample: false },
      { input: "aabbc\n", expectedOutput: "c\n", isSample: false },
      { input: "abcabcde\n", expectedOutput: "d\n", isSample: false },
      { input: "ab".repeat(50000) + "z\n", expectedOutput: "z\n", isSample: false },
    ],
    referencePython:
      "import sys\nfrom collections import Counter\ns = sys.stdin.readline().strip()\ncount = Counter(s)\nanswer = '-'\nfor ch in s:\n    if count[ch] == 1:\n        answer = ch\n        break\nprint(answer)\n",
  },
  {
    slug: "learn-m2-hashing-e3",
    title: "Are They Anagrams?",
    statement: `দুইটা শব্দকে অ্যানাগ্রাম বলা হয় যদি একই অক্ষরগুলোই শুধু ভিন্ন ক্রমে থাকে — প্রতিটি অক্ষরের সংখ্যাও সমান হতে হবে। রফি দুইটা শব্দ পেয়ে যাচাই করতে চায় তারা অ্যানাগ্রাম কি না।

অ্যানাগ্রাম হলে \`YES\`, নাহলে \`NO\` ছাপো।`,
    inputFormat: `এক লাইনে দুটি ছোট হাতের শব্দ, স্পেস দিয়ে আলাদা।`,
    outputFormat: `\`YES\` অথবা \`NO\`।`,
    constraints: `\`1 <= len(word) <= 100000\`
দুই শব্দে শুধু \`a\` থেকে \`z\` থাকে।`,
    editorial: `## ধারণা
অ্যানাগ্রাম হলে দুই শব্দের প্রতিটি অক্ষরের গণনা সমান। প্রথমে দৈর্ঘ্য আলাদা হলে সরাসরি \`NO\`। নাহলে ২৬ আকারের একটা গণনা-অ্যারে নিয়ে প্রথম শব্দের অক্ষর বাড়াও, দ্বিতীয় শব্দের অক্ষর কমাও। শেষে সব ঘর শূন্য হলে \`YES\`।

## ধাপে ধাপে
1. দুই শব্দ পড়ো; দৈর্ঘ্য আলাদা হলে \`NO\`।
2. \`count[26] = 0\` নাও।
3. প্রথম শব্দে গণনা বাড়াও, দ্বিতীয় শব্দে কমাও।
4. কোনো ঘর অশূন্য থাকলে \`NO\`, নাহলে \`YES\`।

\`\`\`python
import sys
from collections import Counter
a, b = sys.stdin.readline().split()
print('YES' if Counter(a) == Counter(b) else 'NO')
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n + m)\`, স্পেস \`O(1)\` — গণনা-অ্যারে সর্বোচ্চ ২৬ ঘর।

## সাধারণ ভুল
- শুধু অক্ষরের **সেট** মেলানো: \`aab\` আর \`abb\`-এর সেট এক, কিন্তু অ্যানাগ্রাম নয়।
- দৈর্ঘ্য না মেলানো: প্রথমেই দৈর্ঘ্য আলাদা হলে উত্তর \`NO\`।
- বড় হাতের অক্ষর ধরে নেওয়া: ইনপুটে শুধু ছোট হাতের অক্ষর থাকে।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Hashing", "String", "Counting"],
    tests: [
      { input: "listen silent\n", expectedOutput: "YES\n", isSample: true },
      { input: "hello world\n", expectedOutput: "NO\n", isSample: true },
      { input: "a a\n", expectedOutput: "YES\n", isSample: false },
      { input: "abc cba\n", expectedOutput: "YES\n", isSample: false },
      { input: "ab a\n", expectedOutput: "NO\n", isSample: false },
      { input: "letter letter\n", expectedOutput: "YES\n", isSample: false },
      {
        input: "a".repeat(100000) + " " + "a".repeat(100000) + "\n",
        expectedOutput: "YES\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import Counter\na, b = sys.stdin.readline().split()\nprint('YES' if Counter(a) == Counter(b) else 'NO')\n",
  },
  {
    slug: "learn-m2-hashing-m2",
    title: "Longest Consecutive Run",
    statement: `সাদিয়ার সংখ্যার ডায়েরিতে কিছু পূর্ণসংখ্যা এলোমেলোভাবে লেখা। সে এমন সবচেয়ে লম্বা দল খুঁজছে যেখানে সংখ্যাগুলো পরপর — যেমন \`4, 5, 6, 7\`। সংখ্যাগুলোর ক্রম ডায়েরিতে যেমন আছে তেমনই থাকুক, দলে থাকা প্রতিটি মান ঠিক এক ধাপ করে বাড়বে; ডুপ্লিকেট মান দলের দৈর্ঘ্য বাড়ায় না।

সর্বোচ্চ কত দৈর্ঘ্যের এমন পরপর দল পাওয়া যায়?`,
    inputFormat: `প্রথম লাইনে \`n\`; দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা।`,
    outputFormat: `সর্বোচ্চ দৈর্ঘ্য এক লাইনে।`,
    constraints: `\`1 <= n <= 200000\`
\`-10^9 <= a_i <= 10^9\``,
    editorial: `## ধারণা
সব মান একটা হ্যাশ সেটে রাখো, তারপর প্রতিটি মান \`x\`-এর জন্য দেখো \`x - 1\` সেটে আছে কি না। না থাকলে \`x\` কোনো দলের শুরু; সেখান থেকে \`x + 1\`, \`x + 2\` ... যতক্ষণ সেটে থাকে গুনে যাও। প্রতিটি মান সর্বোচ্চ একবার দলের শুরু হিসেবে পরীক্ষা হয়, তাই মোট কাজ \`O(n)\`।

শুরুর শর্তটা (\`x - 1\` নেই) বাদ দিলে প্রতিটি মান থেকে লম্বা লুপ চলতে পারে, তখন সময় \`O(n^2)\` হয়ে যায়।

## ধাপে ধাপে
1. \`n\` আর মানগুলো পড়ো; সব মান সেটে রাখো।
2. \`best = 0\`।
3. প্রতিটি \`x\`-এ: \`x - 1\` সেটে থাকলে এড়িয়ে যাও।
4. নাহলে \`current = x\`, \`length = 0\`; যতক্ষণ \`current\` সেটে আছে, \`current += 1\`, \`length += 1\`।
5. \`best\` হালনাগাদ করো, শেষে ছাপো।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
a = set(data[1:1 + n])
best = 0
for x in a:
    if x - 1 in a:
        continue
    length = 0
    while x + length in a:
        length += 1
    best = max(best, length)
print(best)
\`\`\`

## কমপ্লেক্সিটি
গড়ে সময় \`O(n)\`, স্পেস \`O(n)\` — প্রতিটি মান দলের শুরু হিসেবে সর্বোচ্চ একবার।

## সাধারণ ভুল
- অ্যারে সর্ট করে পরপর গোনা: কাজ হয়, কিন্তু \`O(n log n)\`; হ্যাশ সেটে \`O(n)\` সম্ভব।
- \`x - 1\` শর্ত না দেওয়া: প্রতিটি মান থেকে লম্বা লুপ চললে ধীর হয়ে যায়।
- ডুপ্লিকেট মান আলাদা গোনা: সেট ব্যবহার করলে এ সমস্যা থাকে না।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Hashing", "Set", "Arrays"],
    tests: [
      { input: "6\n100 4 200 1 3 2\n", expectedOutput: "4\n", isSample: true },
      { input: "5\n9 8 7 6 5\n", expectedOutput: "5\n", isSample: true },
      { input: "5\n1 1 1 1 1\n", expectedOutput: "1\n", isSample: false },
      { input: "7\n-3 -2 -1 0 1 100 101\n", expectedOutput: "5\n", isSample: false },
      { input: "6\n10 5 12 3 55 11\n", expectedOutput: "3\n", isSample: false },
      {
        input: `200000\n${Array.from({ length: 200000 }, (_, i) => i + 1).join(" ")}\n`,
        expectedOutput: "200000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = set(data[1:1 + n])\nbest = 0\nfor x in a:\n    if x - 1 in a:\n        continue\n    length = 0\n    while x + length in a:\n        length += 1\n    best = max(best, length)\nprint(best)\n",
  },
  {
    slug: "learn-m2-hashing-m3",
    title: "Balanced Zero-One Segments",
    statement: `সাদিয়ার বাইনারি ডায়েরিতে শুধু \`0\` আর \`1\` আছে। সে এমন কতগুলো পরপর অংশ (সাবঅ্যারে) খুঁজছে যেখানে \`0\` আর \`1\`-এর সংখ্যা সমান।

কতটি এমন সাবঅ্যারে আছে, সেটা বের করো। সাবঅ্যারে অন্তত একটি উপাদান থাকবে।`,
    inputFormat: `প্রথম লাইনে \`n\`; দ্বিতীয় লাইনে \`n\`টি সংখ্যা, প্রতিটি \`0\` বা \`1\`।`,
    outputFormat: `সমান \`0\`-\`1\` যুক্ত সাবঅ্যারের সংখ্যা।`,
    constraints: `\`1 <= n <= 200000\``,
    editorial: `## ধারণা
প্রতিটি \`0\`-কে \`-1\` ভাবো আর \`1\`-কে \`+1\`। তাহলে কোনো অংশে \`0\` আর \`1\` সমান মানে সেই অংশের যোগফল \`0\`। প্রিফিক্স যোগফল \`balance\` রাখো; যদি দুইটা সূচিতে \`balance\` একই হয়, তবে মাঝের অংশের যোগফল শূন্য। তাই প্রতিটি \`balance\` মান আগে কতবার এসেছে তা হ্যাশ ম্যাপে রাখো, আর নতুন প্রিফিক্সে সেই গণনা যোগ করো। শুরুতে \`balance = 0\` একবার আছে ধরে নাও।

## ধাপে ধাপে
1. \`n\` আর বাইনারি অ্যারে পড়ো।
2. \`count = {0: 1}\`, \`balance = 0\`, \`answer = 0\`।
3. প্রতিটি \`x\`-এ: \`balance += 1 if x == 1 else -1\`।
4. \`answer += count.get(balance, 0)\`; \`count[balance] += 1\`।
5. \`answer\` ছাপো।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
a = data[1:1 + n]
count = {0: 1}
balance = 0
answer = 0
for x in a:
    balance += 1 if x == 1 else -1
    answer += count.get(balance, 0)
    count[balance] = count.get(balance, 0) + 1
print(answer)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\`, স্পেস \`O(n)\` — প্রতিটি প্রিফিক্স একবার হ্যাশে যায়।

## সাধারণ ভুল
- প্রতিটি সাবঅ্যারে গুনে দেখা: \`O(n^2)\`, বড় ইনপুটে সময় শেষ।
- প্রিফিক্স গণনায় \`0\`-কে \`0\` ধরা: \`0\`-কে \`-1\` ধরলেই সমান সংখ্যার শর্ত যোগফল শূন্য হয়।
- শুরুতে \`0\` গণনা না রাখা: প্রথম উপাদান থেকেই সমান অংশ মিললে একটা সাবঅ্যারে বাদ পড়ে।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Hashing", "Prefix Sum", "Arrays"],
    tests: [
      { input: "4\n0 1 0 1\n", expectedOutput: "4\n", isSample: true },
      { input: "2\n0 0\n", expectedOutput: "0\n", isSample: true },
      { input: "1\n1\n", expectedOutput: "0\n", isSample: false },
      { input: "5\n1 0 1 0 1\n", expectedOutput: "6\n", isSample: false },
      { input: "6\n0 0 1 1 0 1\n", expectedOutput: "6\n", isSample: false },
      {
        input: `200000\n${Array.from({ length: 200000 }, (_, i) => i % 2).join(" ")}\n`,
        expectedOutput: "10000000000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:1 + n]\ncount = {0: 1}\nbalance = 0\nanswer = 0\nfor x in a:\n    balance += 1 if x == 1 else -1\n    answer += count.get(balance, 0)\n    count[balance] = count.get(balance, 0) + 1\nprint(answer)\n",
  },
  {
    slug: "learn-m2-hashing-h2",
    title: "Subarrays With XOR K",
    statement: `রফির সংখ্যার খাতায় কিছু অ-ঋণাত্মক পূর্ণসংখ্যা আছে। সে এমন কতগুলো পরপর অংশ খুঁজছে যাদের সব সংখ্যার **বিটওয়াইজ XOR** ঠিক \`k\`-এর সমান হয়।

কতটি এমন সাবঅ্যারে আছে, সেটা বের করো। সাবঅ্যারে অন্তত একটি সংখ্যা থাকবে।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`k\`; দ্বিতীয় লাইনে \`n\`টি সংখ্যা।`,
    outputFormat: `XOR \`k\` হয় এমন সাবঅ্যারের সংখ্যা।`,
    constraints: `\`1 <= n <= 200000\`
\`0 <= k, a_i < 2^30\``,
    editorial: `## ধারণা
যোগফলের বদলে XOR-এর জন্যও প্রিফিক্স কৌশল খাটে। \`px[i]\` = প্রথম \`i\`টি সংখ্যার XOR। সাবঅ্যারে \`l..r\`-এর XOR = \`px[r] XOR px[l-1]\`। এটা \`k\` হতে হলে দরকার \`px[l-1] = px[r] XOR k\`। তাই ডানে ঘুরতে ঘুরতে প্রতিটি প্রিফিক্স \`p\`-এর জন্য আগের কতগুলো প্রিফিক্স \`p XOR k\` ছিল, তা হ্যাশ ম্যাপে গুনে রাখো। শুরুতে প্রিফিক্স \`0\` একবার আছে।

XOR-এর ইনভার্স নিজেই, তাই \`px[r] XOR k\`-ই খোঁজার মান — বিয়োগের মতো আলাদা হিসাব লাগে না।

## ধাপে ধাপে
1. \`n\`, \`k\`, আর মান পড়ো।
2. \`count = {0: 1}\`, \`prefix = 0\`, \`answer = 0\`।
3. প্রতিটি \`x\`-এ: \`prefix ^= x\`; \`answer += count.get(prefix ^ k, 0)\`।
4. \`count[prefix] += 1\`।
5. \`answer\` ছাপো।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, k = data[0], data[1]
a = data[2:2 + n]
count = {0: 1}
prefix = 0
answer = 0
for x in a:
    prefix ^= x
    answer += count.get(prefix ^ k, 0)
    count[prefix] = count.get(prefix, 0) + 1
print(answer)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\`, স্পেস \`O(n)\` — প্রতিটি প্রিফিক্স একবার ম্যাপে ঢোকে।

## সাধারণ ভুল
- প্রিফিক্স XOR-কে সাধারণ যোগফল ভেবে বিয়োগ করা: XOR-এ \`p - k\` নয়, \`p ^ k\` লাগে।
- শুরুর \`0\` প্রিফিক্স না রাখা: প্রথম উপাদান থেকেই শুরু হওয়া সাবঅ্যারে বাদ পড়ে।
- প্রতিটি সাবঅ্যারে XOR গোনা: \`O(n^2)\`, বড় সীমায় সময় শেষ।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Hashing", "Prefix XOR", "Bit Manipulation"],
    tests: [
      { input: "5 6\n4 2 2 6 4\n", expectedOutput: "4\n", isSample: true },
      { input: "4 3\n1 2 3 0\n", expectedOutput: "3\n", isSample: true },
      { input: "1 7\n7\n", expectedOutput: "1\n", isSample: false },
      { input: "3 0\n5 5 5\n", expectedOutput: "2\n", isSample: false },
      { input: "5 1\n1 0 1 0 1\n", expectedOutput: "9\n", isSample: false },
      {
        input: `200000 0\n${Array.from({ length: 200000 }, () => 1).join(" ")}\n`,
        expectedOutput: "10000000000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, k = data[0], data[1]\na = data[2:2 + n]\ncount = {0: 1}\nprefix = 0\nanswer = 0\nfor x in a:\n    prefix ^= x\n    answer += count.get(prefix ^ k, 0)\n    count[prefix] = count.get(prefix, 0) + 1\nprint(answer)\n",
  },
];
