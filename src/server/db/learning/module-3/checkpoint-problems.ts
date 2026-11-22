import type { SeedProblem } from "../../seed-problems";

export const MODULE3_CHECKPOINT_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m3-checkpoint-1",
    title: "Pair Sum Exists",
    statement: `মডিউল ৩-এর চেকপয়েন্টের প্রথম প্রশ্ন: রফির দোকানে \`n\`টি আইটেমের দাম আছে (একই দাম একাধিকবার থাকতে পারে)। গ্রাহক দুটো আইটেম নিতে চায় যার মোট দাম হুবহু \`T\` টাকা। এমন জোড়া আছে কি না — \`YES\` বা \`NO\` বলো। দুটো আইটেমই তালিকার ভিন্ন ভিন্ন ঘর থেকে নিতে হবে।

উদাহরণ: \`1 4 6 9 3\` আর \`T = 10\` হলে \`4 + 6 = 10\` — \`YES\`।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`T\`; দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা।`,
    outputFormat: `সম্ভব হলে \`YES\`, নাহলে \`NO\` (ক্যাপিটাল)।`,
    constraints: `\`1 <= n <= 200000\`, \`-10^9 <= value, T <= 10^9\`; মান পুনরাবৃত্তি হতে পারে।`,
    editorial: `## ধারণা
দুই লুপে \`O(n^2)\` — \`n = 200000\`-এ চলবে না। অ্যারে সর্ট করে দুই পয়েন্টার রাখলে যোগফল ছোট হলে \`l\` এগিয়ে, বড় হলে \`r\` সরিয়ে \`O(n log n)\`-এ জবাব পাওয়া যায়। শুধু একটা জোড়া খুঁজলেই হয়, তাই মিলে গেলে সঙ্গে সঙ্গে \`YES\` ছাপে থামা যায় — মান পুনরাবৃত্ত থাকলেও এই কৌশল ঠিক থাকে, কারণ আমরা গোনা নয়, খুঁজছি।

## ধাপে ধাপে
1. \`n\` আর \`T\` পড়ে অ্যারে \`sort\` করো।
2. \`l = 0\`, \`r = n - 1\` বসাও।
3. \`l < r\` পর্যন্ত: \`s = a[l] + a[r]\`। মিলে গেলে \`YES\` ছাপে থামো; \`s < T\` হলে \`l += 1\`, নাহলে \`r -= 1\`।
4. লুপ শেষ হলে \`NO\` ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, t = data[0], data[1]
a = sorted(data[2:])
l, r = 0, n - 1
while l < r:
    s = a[l] + a[r]
    if s == t:
        print("YES")
        break
    if s < t:
        l += 1
    else:
        r -= 1
else:
    print("NO")
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n log n)\` (সর্ট + এক পাস লুপ), মেমোরি \`O(n)\`।

## সাধারণ ভুল
- সর্ট না করে লুপ চালানো — ফল ইচ্ছেমতো হয়।
- \`while-else\` বা ফ্ল্যাগ না রেখে লুপের পরে সবসময় \`NO\` ছাপে দেওয়া — মিলে গেলেও \`NO\` আসে।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Two Pointers", "Sorting"],
    tests: [
      { input: "5 10\n1 4 6 9 3\n", expectedOutput: "YES\n", isSample: true },
      { input: "3 100\n1 2 3\n", expectedOutput: "NO\n", isSample: true },
      { input: "4 10\n5 5 5 5\n", expectedOutput: "YES\n", isSample: false },
      { input: "2 10\n5 5\n", expectedOutput: "YES\n", isSample: false },
      { input: "1 10\n5\n", expectedOutput: "NO\n", isSample: false },
      {
        input: `200000 399999\n${Array.from({ length: 200000 }, (_, i) => i + 1).join(" ")}\n`,
        expectedOutput: "YES\n",
        isSample: false,
      },
      {
        input: `200000 400001\n${Array.from({ length: 200000 }, (_, i) => i + 1).join(" ")}\n`,
        expectedOutput: "NO\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, t = data[0], data[1]\na = sorted(data[2:])\nl, r = 0, n - 1\nwhile l < r:\n    s = a[l] + a[r]\n    if s == t:\n        print(\"YES\")\n        break\n    if s < t:\n        l += 1\n    else:\n        r -= 1\nelse:\n    print(\"NO\")\n",
  },
  {
    slug: "learn-m3-checkpoint-2",
    title: "Divisible Subarray Count",
    statement: `দ্বিতীয় প্রশ্ন: ক্লাবের \`n\` দিনের রোজনামচায় প্রতিদিনের আয় আছে (ঋণাত্মক হতে পারে, ফেরত দেওয়া বাড়ি ফেরত)। টানা কতগুলো দিনের মোট আয় \`K\` দিয়ে ভাগ করলে শূন্য ভাগশেষ থাকে — এমন টানা অংশের (শূন্য দিন বাদ) সংখ্যা বের করো।

উদাহরণ: \`1 2 3 4\` আর \`K = 2\` হলে \`[2]\`, \`[4]\`, \`[1,3]\`, \`[1,2,3,4]\` — উত্তর \`4\`।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`K\`; দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা।`,
    outputFormat: `যোগফল \`K\` দিয়ে ভাগ হওয়া উপ-অ্যারের সংখ্যা।`,
    constraints: `\`1 <= n <= 200000\`, \`1 <= K <= 10^9\`, \`-10^9 <= value <= 10^9\`; উত্তর 64-বিটে ফিট করে।`,
    editorial: `## ধারণা
\`a[l..r]\` এর যোগফল \`K\` দিয়ে ভাগ হলে \`pref[r] ≡ pref[l-1] (mod K)\` — অর্থাৎ দুইটা প্রিফিক্স একই ভাগশেষে পড়ে। তাই প্রতিটি প্রিফিক্সের ভাগশেষ ধরে গোনা যায়: চলতি ভাগশেষ \`x\` এলে আগে \`x\` ভাগশেষ কয়বার এসেছে, সেই সংখ্যাটাই এখান পর্যন্ত শেষ হওয়া উপ-অ্যারের গণনা। Python-এ \`%\` ঋণাত্মক সংখ্যার জন্যও ফল শূন্য-থেকে-কম দেয় না, তাই নিশ্চিন্তে কাজ করে; অথচ C++-এ এটা সামান্য ভিন্ন — ওখানে \`((x % k) + k) % k\` লাগে।

## ধাপে ধাপে
1. \`n\`, \`K\` আর সব মান পড়ো।
2. হ্যাশ ম্যাপ \`seen\` দিয়ে শুরু করে \`seen[0] = 1\` বসাও (খালি অংশের ভাগশেষ ০)।
3. \`pref = 0\`, উত্তর \`0\`; প্রতিটি মানে: \`pref = (pref + value) % K\`, তারপর \`answer += seen[pref]\`, এরপর \`seen[pref] += 1\`।
4. শেষে উত্তর ছাপাও।

\`\`\`python
import sys
from collections import Counter
data = list(map(int, sys.stdin.read().split()))
n, k = data[0], data[1]
seen = Counter({0: 1})
pref = answer = 0
for v in data[2:]:
    pref = (pref + v) % k
    answer += seen[pref]
    seen[pref] += 1
print(answer)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\` গড় (হ্যাশ লুকআপ), মেমোরি \`O(n)\` — সর্বোচ্চ \`K\` নয়, \`n + 1\` পর্যন্ত ভিন্ন ভাগশেষ।

## সাধারণ ভুল
- \`seen[pref]\` বাড়ানোর আগে \`answer += seen[pref]\` না করে পরে গোনা — একই ঘর শুরু-শেষ ধরা উপ-অ্যারে বাদ বা দ্বিগুণ হয়।
- \`seen[0] = 1\` না রাখা — প্রথম ঘর থেকে শুরু হওয়া অংশ গোনা হয় না।
- ঋণাত্মক মানে ভাগশেষ নেগেটিভ হয় ধরে নেওয়া (C++ হিসাবে) — এখানে Python-এ তা হয় না, কিন্তু ভাষা বদলালে মনে রাখতে হবে।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Prefix Sum", "Hash Map", "Modulo"],
    tests: [
      { input: "4 2\n1 2 3 4\n", expectedOutput: "4\n", isSample: true },
      { input: "3 3\n1 1 1\n", expectedOutput: "1\n", isSample: true },
      { input: "5 1\n2 4 6 8 10\n", expectedOutput: "15\n", isSample: false },
      { input: "1 7\n14\n", expectedOutput: "1\n", isSample: false },
      { input: "6 4\n2 2 2 2 2 2\n", expectedOutput: "9\n", isSample: false },
      { input: "5 2\n-1 3 -2 5 -4\n", expectedOutput: "6\n", isSample: false },
      {
        input: `200000 7\n${Array(200000).fill(0).join(" ")}\n`,
        expectedOutput: "20000100000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import Counter\ndata = list(map(int, sys.stdin.read().split()))\nn, k = data[0], data[1]\nseen = Counter({0: 1})\npref = answer = 0\nfor v in data[2:]:\n    pref = (pref + v) % k\n    answer += seen[pref]\n    seen[pref] += 1\nprint(answer)\n",
  },
  {
    slug: "learn-m3-checkpoint-3",
    title: "Minimize the Largest Pair Sum",
    statement: `শেষ প্রশ্ন: সাদিয়া \`n\` জন শিক্ষার্থীকে (সবাই জোড়া সংখ্যায়) ল্যাব পার্টনার বানাচ্ছে — প্রতি জোড়ার দুজনের মোট নম্বর যত বড় হতে পারে সেটা যত ছোট হয়, জোড়া সেভাবেই বানাতে হবে। সেরা বিন্যাসে সবচেয়ে বড় জোড়ার যোগফল কত সেটা বের করো।

উদাহরণ: \`1 8 3 6\` হলে \`1 + 6\` আর \`3 + 8\` — সবচেয়ে বড় \`9\`।`,
    inputFormat: `প্রথম লাইনে \`n\` (জোড় সংখ্যা); দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা।`,
    outputFormat: `সেরা বিন্যাসে সবচেয়ে বড় জোড়ার যোগফল।`,
    constraints: `\`2 <= n <= 100000\`, \`n\` জোড় সংখ্যা, \`-10^9 <= value <= 10^9\`; ফল 64-বিটে ফিট করে।`,
    editorial: `## ধারণা
সাজানোর পরে ছোটটা বড়ের সাথে জোড়া দিলেই সেরা। কেন? ধরো সবচেয়ে বড়টা \`a[n-1]\` কারও ছোট মানের সাথে জোড়া হয়েছে — তাহলে সেই ছোট মানটা যে বড়টার সাথে জোড়া হতে পারত, সে বড়টাকে বাদ দেওয়া যেত না; অর্থাৎ অন্তত সমান বড় জোড়া থাকত। ছোট-বড় মিলিয়ে দিলে প্রতিটি জোড়ার যোগফল \`n + 1\` আশেপাশে থাকে এবং কোনো জোড়াই ছাড়া যায় না — এটাই exchange argument-এর ছোট রূপ। পরের দিক মনে রাখো: এখানে সর্বোচ্চটা কমাতে চাই, তাই সর্বোচ্চটাই গুরুত্বপূর্ণ।

## ধাপে ধাপে
1. \`n\` আর সব নম্বর পড়ে \`sort\` করো।
2. বেস্ট মান একটা খুব ছোট মান দিয়ে শুরু করো (ঋণাত্মক উত্তরও সম্ভব)।
3. \`i = 0 .. n/2 - 1\`: \`s = a[i] + a[n-1-i]\`; \`s > best\` হলে \`best = s\`।
4. \`best\` ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
a = sorted(data[1:])
best = -10**18
for i in range(n // 2):
    s = a[i] + a[n - 1 - i]
    if s > best:
        best = s
print(best)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n log n)\` (সর্ট) + \`O(n)\` জোড়া পরীক্ষা; মেমোরি \`O(n)\`। সব মান সমান হলে প্রতিটি জোড়াই একই — উত্তর সেটাই।

## সাধারণ ভুল
- পাশাপাশি জোড়া বানানো (\`a[0]+a[1]\`, \`a[2]+a[3]\` ...) — সবচেয়ে বড় দুটো একসাথে এসে সর্বোচ্চ জোড়া ভাঙে।
- \`best\` শূন্য দিয়ে শুরু করা — সব যোগফল ঋণাত্মক হলে উত্তর \`0\` ছাপবে, অথচ ঋণাত্মকই সঠিক।
- শুধু প্রথম জোড়া ধরে \`best\` ঠিক করে লুপ না চালানো — মাঝের জোড়া বড় হতে পারে (ঋণাত্মক-ইয়োগে)।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Sorting", "Greedy", "Two Pointers"],
    tests: [
      { input: "4\n1 8 3 6\n", expectedOutput: "9\n", isSample: true },
      { input: "2\n5 5\n", expectedOutput: "10\n", isSample: true },
      { input: "4\n1 2 3 4\n", expectedOutput: "5\n", isSample: false },
      { input: "6\n1 100 2 99 3 98\n", expectedOutput: "101\n", isSample: false },
      { input: "4\n-10 0 0 10\n", expectedOutput: "0\n", isSample: false },
      { input: "4\n-5 -4 -3 -2\n", expectedOutput: "-7\n", isSample: false },
      {
        input: `100000\n${Array.from({ length: 100000 }, (_, i) => i + 1).join(" ")}\n`,
        expectedOutput: "100001\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = sorted(data[1:])\nbest = -10**18\nfor i in range(n // 2):\n    s = a[i] + a[n - 1 - i]\n    if s > best:\n        best = s\nprint(best)\n",
  },
];
