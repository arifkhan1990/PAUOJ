import type { SeedProblem } from "../../seed-problems";
import { newlineOutput, spaceOutput } from "../generated-tests";
import { PREFIX_SUM_DIFFERENCE_EXTRA_PROBLEMS } from "./prefix-sum-difference-extra-problems";

export const PREFIX_SUM_DIFFERENCE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m3-prefix-sum-difference-g1",
    title: "Library Reading-Hall Range Queries",
    statement: `লাইব্রেরির রিডিং হলের সিরিজে বসা শত শত শিক্ষার্থীর প্রতিদিনের পড়ার পাতা সংখ্যা লেখা আছে। অধ্যাপক প্রতিবার জিজ্ঞেস করেন \`l\` থেকে \`r\` সিরিজ (দুটোই ধরে) মিলে কত পাতা পড়া হয়েছে। তুমি \`q\`টা এমন প্রশ্নের উত্তর দাও।

উদাহরণ: \`1 2 3 4 5\`-এ \`1 3\` হলে \`1 + 2 + 3 = 6\`, \`2 5\` হলে \`14\`।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`q\`; দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা; পরের \`q\` লাইনে প্রতিটিতে \`l r\` (১-ভিত্তিক)।`,
    outputFormat: `\`q\` লাইন; প্রতি লাইনে সেই রেঞ্জের যোগফল।`,
    constraints: `\`1 <= n, q <= 200000\`, \`1 <= l <= r <= n\`, \`-10^9 <= value <= 10^9\`; যোগফল 64-বিটে ফিট করে।`,
    editorial: `## ধারণা
প্রতিটি কুয়েরিতে আলাদা করে যোগ করলে \`O(n * q)\` — \`n = q = 200000\`-এ অসম্ভব। প্রিফিক্স সাম একবার বানালে \`l..r\` এর যোগফল হয় \`pref[r] - pref[l - 1]\`। কেন? \`pref[r]\`-এ আছে \`1..r\` সব, তার ভিতরে \`1..l-1\` অংশটা দরকার নেই — সেটা বাদ দিলেই \`l..r\` বাকি থাকে।

## ধাপে ধাপে
1. \`n\`, \`q\` আর \`n\`টি মান পড়ো।
2. \`pref = [0] * (n + 1)\` বানাও; লুপে \`pref[i + 1] = pref[i] + a[i]\`।
3. প্রতিটি \`l r\`-এর জন্য \`pref[r] - pref[l - 1]\` উত্তরের লিস্টে রাখো।
4. সব উত্তর এক এক লাইনে ছাপাও — ইনপুট বড়, তাই একবারে যোগ করে ছাপা দ্রুত।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, q = data[0], data[1]
a = data[2:2 + n]
pref = [0] * (n + 1)
for i, v in enumerate(a):
    pref[i + 1] = pref[i] + v
out = []
idx = 2 + n
for _ in range(q):
    l, r = data[idx], data[idx + 1]
    idx += 2
    out.append(str(pref[r] - pref[l - 1]))
print("\\n".join(out))
\`\`\`

## কমপ্লেক্সিটি
প্রিফিক্স তৈরি \`O(n)\`, প্রতি কুয়েরি \`O(1)\` — মোট \`O(n + q)\` সময়, \`O(n)\` মেমোরি।

## সাধারণ ভুল
- \`pref[r] - pref[l]\` লিখলে \`l\` নম্বর ঘরটা বাদ পড়ে — উদাহরণে \`1 3\`-এ \`6\` না এসে \`3\` আসে।
- \`pref\` কে \`n\` আকারে বানিয়ে \`pref[r]\` নিলে শেষ ঘরে \`IndexError\` — \`n + 1\` লাগবে।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Prefix Sum", "Range Query"],
    tests: [
      { input: "5 3\n1 2 3 4 5\n1 3\n2 5\n1 5\n", expectedOutput: "6\n14\n15\n", isSample: true },
      { input: "1 1\n10\n1 1\n", expectedOutput: "10\n", isSample: true },
      { input: "4 2\n5 5 5 5\n1 4\n2 3\n", expectedOutput: "20\n10\n", isSample: false },
      { input: "3 3\n1 2 3\n1 1\n2 2\n3 3\n", expectedOutput: "1\n2\n3\n", isSample: false },
      { input: "3 1\n-1 -2 -3\n1 3\n", expectedOutput: "-6\n", isSample: false },
      {
        input: `200000 100000\n${Array.from({ length: 200000 }, (_, i) => i + 1).join(" ")}\n${Array(100000).fill("1 200000").join("\n")}\n`,
        expectedOutput: newlineOutput(Array(100000).fill(20000100000)),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, q = data[0], data[1]\na = data[2:2 + n]\npref = [0] * (n + 1)\nfor i, v in enumerate(a):\n    pref[i + 1] = pref[i] + v\nout = []\nidx = 2 + n\nfor _ in range(q):\n    l, r = data[idx], data[idx + 1]\n    idx += 2\n    out.append(str(pref[r] - pref[l - 1]))\nprint(\"\\n\".join(out))\n",
  },
  {
    slug: "learn-m3-prefix-sum-difference-g2",
    title: "Electricity Bill Range Add",
    statement: `হোস্টেলের \`n\`টি কক্ষে বিদ্যুৎ বিল বাড়ছে। নুসরাতের কাছে \`q\`টা নির্দেশনা: \`l r x\` মানে কক্ষ \`l\` থেকে \`r\` (দুটোই ধরে) প্রতিটিতে \`x\` টাকা যোগ হবে। সব নির্দেশনা চালানোর পর প্রতিটি কক্ষের চূড়ান্ত বিল এক লাইনে ছাপাও।

উদাহরণ: শুরু \`0 0 0 0 0\`, তারপর \`1 3 2\` আর \`2 5 1\` হলে শেষে \`2 3 3 1 1\`।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`q\`; দ্বিতীয় লাইনে শুরুর \`n\`টি বিল; পরের \`q\` লাইনে \`l r x\` (১-ভিত্তিক)।`,
    outputFormat: `এক লাইনে \`n\`টি চূড়ান্ত বিল, স্পেস দিয়ে আলাদা।`,
    constraints: `\`1 <= n, q <= 200000\`, \`1 <= l <= r <= n\`, \`-10^9 <= value, x <= 10^9\`; ফল 64-বিটে ফিট করে।`,
    editorial: `## ধারণা
প্রতিটি আপডেটে \`l\` থেকে \`r\` লুপ চালালে \`O(n * q)\` — না চাইলেই হয়। ডিফারেন্স অ্যারেতে মাত্র দুটো ঘর বদলাই: \`d[l] += x\` আর \`d[r + 1] -= x\`। এরপর বাঁ থেকে চলমান যোগফল নিলেই আসল বিল ফিরে আসে, কারণ \`+x\` ধরে যায় শুধু \`r\` পর্যন্ত, \`r + 1\` থেকে টানা \`-x\` তাকে কেড়ে নেয়।

## ধাপে ধাপে
1. \`n\`, \`q\`, শুরুর অ্যারে পড়ে \`n + 1\` আকারের খালি \`diff\` বানাও।
2. প্রতিটি \`l r x\`-এ \`diff[l] += x\`, \`diff[r + 1] -= x\` করো (০-ভিত্তিকে \`diff[l-1]\`, \`diff[r]\`)।
3. \`cur = 0\` ধরে এক পাসে চলো: প্রতি ঘরে আগে \`cur += diff[i]\`, তারপর \`a[i] + cur\` ছাপাও — এটাই চূড়ান্ত বিল।
4. সব চূড়ান্ত বিল এক লাইনে ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, q = data[0], data[1]
a = list(data[2:2 + n])
diff = [0] * (n + 1)
idx = 2 + n
for _ in range(q):
    l, r, x = data[idx], data[idx + 1], data[idx + 2]
    idx += 3
    diff[l - 1] += x
    diff[r] -= x
cur = 0
out = []
for i in range(n):
    cur += diff[i]
    out.append(str(a[i] + cur))
print(" ".join(out))
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n + q)\` — প্রতি আপডেট মাত্র \`O(1)\`, ফাইনাল পাস \`O(n)\`; মেমোরি \`O(n)\`।

## সাধারণ ভুল
- \`diff[r] -= x\` না করলে রেঞ্জের পরেও সব ঘরে \`x\` থেকে যায়।
- শুরুর অ্যারেকেও ডিফারেন্সে বদলে ফেলা — নিয়ম মেনে চললে শুরুর মান আলাদাভাবে যোগ হয়, কোড সহজ থাকে।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Difference Array", "Range Update"],
    tests: [
      { input: "5 2\n0 0 0 0 0\n1 3 2\n2 5 1\n", expectedOutput: "2 3 3 1 1\n", isSample: true },
      { input: "3 1\n1 1 1\n1 1 5\n", expectedOutput: "6 1 1\n", isSample: true },
      { input: "4 3\n0 0 0 0\n1 1 1\n1 1 1\n1 1 1\n", expectedOutput: "3 0 0 0\n", isSample: false },
      { input: "3 2\n1 2 3\n1 3 1\n3 3 10\n", expectedOutput: "2 3 14\n", isSample: false },
      { input: "1 3\n0\n1 1 5\n1 1 5\n1 1 5\n", expectedOutput: "15\n", isSample: false },
      {
        input: `200000 100000\n${Array(200000).fill(0).join(" ")}\n${Array(100000).fill("1 200000 1").join("\n")}\n`,
        expectedOutput: spaceOutput(Array(200000).fill(100000)),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, q = data[0], data[1]\na = list(data[2:2 + n])\ndiff = [0] * (n + 1)\nidx = 2 + n\nfor _ in range(q):\n    l, r, x = data[idx], data[idx + 1], data[idx + 2]\n    idx += 3\n    diff[l - 1] += x\n    diff[r] -= x\ncur = 0\nout = []\nfor i in range(n):\n    cur += diff[i]\n    out.append(str(a[i] + cur))\nprint(\" \".join(out))\n",
  },
  {
    slug: "learn-m3-prefix-sum-difference-e1",
    title: "Running Donation Totals",
    statement: `তানভির ক্লাবের দান-খাতা দেখছে — এক লাইনে \`n\` দিনের অনুদান। প্রতিদিনের পরে মোট কত জমা হলো সেটা জানতে চায় সাদিয়া। অর্থাৎ প্রথম দিন পর্যন্ত, প্রথম দুই দিন পর্যন্ত, ... — ক্রমাগত যোগফলগুলো এক লাইনে ছাপাও।

উদাহরণ: \`1 2 3 4\` হলে \`1 3 6 10\`।`,
    inputFormat: `প্রথম লাইনে \`n\`; দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা।`,
    outputFormat: `এক লাইনে \`n\`টি ক্রমাগত যোগফল, স্পেস দিয়ে আলাদা।`,
    constraints: `\`1 <= n <= 200000\`, \`-10^9 <= value <= 10^9\`; যোগফল 64-বিটে ফিট করে।`,
    editorial: `## ধারণা
এটাই প্রিফিক্স সামের কাঠামো তৈরির প্রথম ধাপ: একটা চলমান যোগফল ধরে রেখে প্রতি ঘরে সেটা আপডেট করা। একটাই নিয়ম — চলমান যোগফল শূন্য থেকে শুরু করতে হবে; প্রথম মান দিয়ে শুরু করলে প্রথম ঘরটাই দুইবার যোগ হয়ে যায়।

## ধাপে ধাপে
1. \`n\` আর সব মান পড়ো।
2. \`cur = 0\` দিয়ে শুরু করো।
3. প্রতিটি মানের জন্য \`cur += value\`, তারপর \`cur\` উত্তরের লিস্টে রাখো।
4. সব উত্তর স্পেস দিয়ে আলাদা করে ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
cur = 0
out = []
for v in data[1:]:
    cur += v
    out.append(str(cur))
print(" ".join(out))
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\`, মেমোরি \`O(n)\` (আউটপুট); \`cur\` মাত্র \`O(1)\` জায়গা নেয়।

## সাধারণ ভুল
- \`cur\` শূন্য না দিয়ে প্রথম মান দিয়ে শুরু করলে দ্বিতীয় উত্তর ভুল — \`a[0]\` দুইবার ধরা হয়।
- \`print(*out)\` না লিখে লিস্ট হুবহু ছাপা — ফরম্যাটের সাথে মেলে না।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Prefix Sum", "Implementation"],
    tests: [
      { input: "4\n1 2 3 4\n", expectedOutput: "1 3 6 10\n", isSample: true },
      { input: "1\n5\n", expectedOutput: "5\n", isSample: true },
      { input: "3\n-1 -1 -1\n", expectedOutput: "-1 -2 -3\n", isSample: false },
      { input: "5\n0 0 0 0 0\n", expectedOutput: "0 0 0 0 0\n", isSample: false },
      { input: "2\n10 -10\n", expectedOutput: "10 0\n", isSample: false },
      {
        input: `200000\n${Array(200000).fill(1).join(" ")}\n`,
        expectedOutput: spaceOutput(Array.from({ length: 200000 }, (_, i) => i + 1)),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\ncur = 0\nout = []\nfor v in data[1:]:\n    cur += v\n    out.append(str(cur))\nprint(\" \".join(out))\n",
  },
  {
    slug: "learn-m3-prefix-sum-difference-m1",
    title: "Count Segments with Sum Exactly K",
    statement: `ক্লাবের টাকার রোজনামচা দেখে নুসরাত জানতে চায় — টানা কতগুলো দিনের মোট খরচ হুবহু \`K\` হয়? এমন টানা অংশের সংখ্যা বের করো (অন্তত একটা দিন ধরতে হবে)। মান ঋণাত্মকও হতে পারে।

উদাহরণ: \`1 2 3 0 3\` আর \`K = 3\` হলে \`[1,2]\`, \`[3]\`, \`[3,0]\`, \`[0,3]\`, \`[3]\` — উত্তর \`5\`।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`K\`; দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা।`,
    outputFormat: `যোগফল হুবহু \`K\` এমন টানা উপ-অ্যারের সংখ্যা।`,
    constraints: `\`1 <= n <= 200000\`, \`-10^9 <= value, K <= 10^9\`; উত্তর 64-বিটে ফিট করে।`,
    editorial: `## ধারণা
\`a[l..r]\` এর যোগফল \`pref[r] - pref[l-1] = K\` — অর্থাৎ \`pref[r] - K = pref[l-1]\`। অর্থাৎ ঘর \`r\`-এ পৌঁছে প্রশ্নটা হয়: আগে কয়বার এমন প্রিফিক্স এসেছে যার মান \`pref[r] - K\`? একটা হ্যাশ ম্যাপে প্রতিটি প্রিফিক্সের সংখ্যা রেখে প্রতি ধাপে \`count[pref - K]\` যোগ করলেই হবে। ঋণাত্মক মান থাকলেও একই কথা — প্রিফিক্স যা-ই হোক, সূত্র অপরিবর্তিত।

## ধাপে ধাপে
1. \`n\`, \`K\` আর সব মান পড়ো।
2. হ্যাশ ম্যাপ \`count\` দিয়ে শুরু করো, একবারেই \`count[0] = 1\` বসাও — শূন্য দৈর্ঘ্যের প্রিফিক্স শূন্য।
3. \`pref = 0\`, উত্তর \`0\` ধরে প্রতিটি মানের জন্য: \`pref += value\`, তারপর \`answer += count[pref - K]\`।
4. এরপর \`count[pref] += 1\` — আগে উত্তর নাও, তারপর এই প্রিফিক্সটাকে ভবিষ্যতের জন্য রাখো।
5. শেষে উত্তর ছাপাও।

\`\`\`python
import sys
from collections import Counter
data = list(map(int, sys.stdin.read().split()))
n, k = data[0], data[1]
seen = Counter({0: 1})
pref = answer = 0
for v in data[2:]:
    pref += v
    answer += seen[pref - k]
    seen[pref] += 1
print(answer)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\` গড় (হ্যাশ লুকআপ), মেমোরি \`O(n)\` — সর্বোচ্চ \`n + 1\`টা ভিন্ন প্রিফিক্স।

## সাধারণ ভুল
- \`count[pref]\` বাড়ানোর আগে \`count[pref - K]\` গোনা লাগবে — ক্রম উল্টালে হুবহু এক ঘরের উপ-অ্যারে (শুরু আর শেষ একই প্রিফিক্স) বাদ পড়ে বা দ্বিগুণ হয়।
- \`count[0] = 1\` না রাখলে প্রথম ঘর থেকেই শুরু হওয়া উপ-অ্যারে গোনা হয় না।
- সাধারণ ডিকশনারিতে \`count[x]\` ধরে নিতে \`KeyError\` আসে — \`Counter\` শূন্য ফেরত দেয়।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Prefix Sum", "Hash Map", "Counting"],
    tests: [
      { input: "5 3\n1 2 3 0 3\n", expectedOutput: "5\n", isSample: true },
      { input: "3 0\n0 0 0\n", expectedOutput: "6\n", isSample: true },
      { input: "4 5\n1 1 1 1\n", expectedOutput: "0\n", isSample: false },
      { input: "1 7\n7\n", expectedOutput: "1\n", isSample: false },
      { input: "4 0\n1 -1 1 -1\n", expectedOutput: "4\n", isSample: false },
      {
        input: `200000 0\n${Array(200000).fill(0).join(" ")}\n`,
        expectedOutput: "20000100000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import Counter\ndata = list(map(int, sys.stdin.read().split()))\nn, k = data[0], data[1]\nseen = Counter({0: 1})\npref = answer = 0\nfor v in data[2:]:\n    pref += v\n    answer += seen[pref - k]\n    seen[pref] += 1\nprint(answer)\n",
  },
  {
    slug: "learn-m3-prefix-sum-difference-h1",
    title: "Garden Plot Rainfall Queries",
    statement: `ক্যাম্পাস বাগানের \`n x m\` আকারের চারা লাগানো জমিতে প্রতিটি সেলে প্রতিদিন কত বৃষ্টি পড়েছে তা লেখা আছে। অধ্যাপক \`q\`টা আয়তক্ষেত্র জিজ্ঞেস করেন — রো \`r1..r2\` আর কলাম \`c1..c2\` (দুটোই ধরে, ১-ভিত্তিক) মিলে মোট কত বৃষ্টি পড়েছে।

উদাহরণ: \`[[1,2,3],[4,5,6]]\`-এ \`1 1 2 3\` হলে \`21\`, \`1 2 2 2\` হলে \`2 + 5 = 7\`।`,
    inputFormat: `প্রথম লাইনে \`n\`, \`m\`, \`q\`; পরের \`n\` লাইনে ম্যাট্রিক্স (\`m\` করে সংখ্যা); পরের \`q\` লাইনে \`r1 c1 r2 c2\`।`,
    outputFormat: `\`q\` লাইন; প্রতি লাইনে আয়তক্ষেত্রের যোগফল।`,
    constraints: `\`1 <= n, m <= 500\`, \`1 <= q <= 100000\`, \`-10^9 <= value <= 10^9\`; ফল 64-বিটে ফিট করে।`,
    editorial: `## ধারণা
এক মাত্রিক প্রিফিক্সের হিসাব দ্বিমাত্রিকে বিস্তারিত হয়: \`pref[i][j]\` হলো \`(1,1)\` থেকে \`(i,j)\` পর্যন্ত আয়তের যোগফল। একটা ঘর বসানোর সময় উপরের আয়ত + বাঁর কলাম যোগ করলে ক্রস অংশ \`(i-1, j-1)\` দুইবার ঢোকে, তাই একবার বিয়োগ করে তারপর নিজের মান যোগ করো। তারপর চার কোণ ব্যবহার করে কোনো আয়তের যোগফল: \`pref[r2][c2] - pref[r1-1][c2] - pref[r2][c1-1] + pref[r1-1][c1-1]\` — বাঁ-উপরের কোণটা দুইবার বাদ পড়ে, তাই শেষে একবার ফেরত আনতে হয়।

## ধাপে ধাপে
1. \`n\`, \`m\`, \`q\` পড়ে \`(n+1) x (m+1)\` শূন্য পূর্ণ প্রিফিক্স বানাও — শুরুর সারি ও কলাম শূন্য রাখলে সীমা যাচাই লাগে না।
2. ম্যাট্রিক্স পড়তে পড়তে \`pref[i][j] = a[i][j] + pref[i-1][j] + pref[i][j-1] - pref[i-1][j-1]\` বসাও।
3. প্রতিটি কুয়েরিতে চার কোণের সূত্র প্রয়োগ করে উত্তর সংগ্রহ করো।
4. সব উত্তর এক এক লাইনে ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, m, q = data[0], data[1], data[2]
pref = [[0] * (m + 1) for _ in range(n + 1)]
idx = 3
for i in range(1, n + 1):
    for j in range(1, m + 1):
        pref[i][j] = data[idx] + pref[i - 1][j] + pref[i][j - 1] - pref[i - 1][j - 1]
        idx += 1
out = []
for _ in range(q):
    r1, c1, r2, c2 = data[idx], data[idx + 1], data[idx + 2], data[idx + 3]
    idx += 4
    total = pref[r2][c2] - pref[r1 - 1][c2] - pref[r2][c1 - 1] + pref[r1 - 1][c1 - 1]
    out.append(str(total))
print("\\n".join(out))
\`\`\`

## কমপ্লেক্সিটি
প্রিফিক্স তৈরি \`O(n * m)\`, প্রতি কুয়েরি \`O(1)\` — মোট \`O(n * m + q)\`; মেমোরি \`O(n * m)\`। \`500 x 500\` আর \`q = 100000\`-এও Python সহজে চলে।

## সাধারণ ভুল
- \`- pref[i-1][j-1]\` বাদ দিলে ক্রস অংশ দুইবার যোগ হয় — আয়তের উত্তর বেশি আসে; নমুনার ছোট ম্যাট্রিক্সেই ধরা পড়ে।
- ইনডেক্স ১-ভিত্তিক কুয়েরি আর ০-ভিত্তিক পাইথন লিস্ট গুলিয়ে ফেলা — প্রিফিক্সের শুরুর সারি শূন্য রেখে লিখলে এই ঝামেলা থাকে না।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["2D Prefix Sum", "Range Query"],
    tests: [
      {
        input: "2 3 2\n1 2 3\n4 5 6\n1 1 2 3\n1 2 2 2\n",
        expectedOutput: "21\n7\n",
        isSample: true,
      },
      { input: "1 1 1\n7\n1 1 1 1\n", expectedOutput: "7\n", isSample: true },
      { input: "1 4 2\n1 2 3 4\n1 1 1 4\n1 2 1 3\n", expectedOutput: "10\n5\n", isSample: false },
      { input: "3 1 1\n1\n2\n3\n1 1 3 1\n", expectedOutput: "6\n", isSample: false },
      { input: "2 2 2\n-1 2\n3 -4\n1 1 1 1\n1 1 2 2\n", expectedOutput: "-1\n0\n", isSample: false },
      {
        input: `500 500 100000\n${Array.from({ length: 500 }, () => Array(500).fill(1).join(" ")).join("\n")}\n${Array(100000).fill("1 1 500 500").join("\n")}\n`,
        expectedOutput: newlineOutput(Array(100000).fill(250000)),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, m, q = data[0], data[1], data[2]\npref = [[0] * (m + 1) for _ in range(n + 1)]\nidx = 3\nfor i in range(1, n + 1):\n    for j in range(1, m + 1):\n        pref[i][j] = data[idx] + pref[i - 1][j] + pref[i][j - 1] - pref[i - 1][j - 1]\n        idx += 1\nout = []\nfor _ in range(q):\n    r1, c1, r2, c2 = data[idx], data[idx + 1], data[idx + 2], data[idx + 3]\n    idx += 4\n    total = pref[r2][c2] - pref[r1 - 1][c2] - pref[r2][c1 - 1] + pref[r1 - 1][c1 - 1]\n    out.append(str(total))\nprint(\"\\n\".join(out))\n",
  },
  ...PREFIX_SUM_DIFFERENCE_EXTRA_PROBLEMS,
];
