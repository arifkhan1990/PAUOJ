import type { SeedProblem } from "../../seed-problems";

export const STL_COLLECTIONS_PRACTICE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m2-stl-collections-e2",
    title: "Count Distinct Badges",
    statement: `ক্লাবের অনুষ্ঠানে সদস্যরা ভিন্ন ভিন্ন রঙের ব্যাজ পরে। রফি জানতে চায় মোট কত রকমের **আলাদা** ব্যাজ আছে — একই রঙ একাধিকবার এলে সেটা একবারই গোনা হবে।

আলাদা রঙের সংখ্যা ছাপো।`,
    inputFormat: `প্রথম লাইনে \`n\`; দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা — প্রতিটি রঙের আইডি।`,
    outputFormat: `আলাদা রঙের সংখ্যা এক লাইনে।`,
    constraints: `\`1 <= n <= 200000\`
\`0 <= badge_i <= 10^9\``,
    editorial: `## ধারণা
\`set\` হলো এমন সংগ্রহ যেখানে ডুপ্লিকেট ঢুকতে পারে না। প্রতিটি মান সেটে ঢোকালে শেষে সেটের আকারই আলাদা মানের সংখ্যা। C++-এ \`std::set\` বা \`std::unordered_set\`, Python-এ \`set\` — দুটোই এই কাজের জন্য তৈরি।

## ধাপে ধাপে
1. \`n\` আর মানগুলো পড়ো।
2. প্রতিটি মান একটা সেটে যোগ করো।
3. সেটের আকার ছাপো।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
print(len(set(data[1:1 + n])))
\`\`\`

## কমপ্লেক্সিটি
গড়ে সময় \`O(n)\`, স্পেস \`O(n)\` — প্রতিটি মান একবার সেটে ঢোকে।

## সাধারণ ভুল
- সর্ট করে পরপর ডুপ্লিকেট গোনা: কাজ হয়, কিন্তু \`O(n log n)\`; সেটে গড়ে \`O(n)\`।
- \`n\`-কে উত্তর ধরে নেওয়া: ডুপ্লিকেট থাকলে উত্তর কম হবে।
- সেটের বদলে লিস্টে \`in\` চেক করা: প্রতিবার লিনিয়ার সার্চ হয়ে ধীর হয়।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Set", "STL", "Counting"],
    tests: [
      { input: "6\n1 2 2 3 3 3\n", expectedOutput: "3\n", isSample: true },
      { input: "1\n5\n", expectedOutput: "1\n", isSample: true },
      { input: "5\n-1 -1 0 0 0\n", expectedOutput: "2\n", isSample: false },
      { input: "4\n7 7 7 7\n", expectedOutput: "1\n", isSample: false },
      { input: "8\n4 1 4 2 1 2 4 1\n", expectedOutput: "3\n", isSample: false },
      {
        input: `200000\n${Array.from({ length: 200000 }, (_, i) => i % 1000).join(" ")}\n`,
        expectedOutput: "1000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nprint(len(set(data[1:1 + n])))\n",
  },
  {
    slug: "learn-m2-stl-collections-e3",
    title: "Second Best Score",
    statement: `ক্লাবের প্রতিযোগিতায় সাদিয়া সবার স্কোর লিখে রেখেছে। সে **দ্বিতীয় সর্বোচ্চ আলাদা স্কোর** জানতে চায় — একই স্কোর একাধিকবার থাকলে সেটা একবারই ধরতে হবে। দ্বিতীয় আলাদা স্কোর না থাকলে \`-1\` ছাপো।

যেমন স্কোর \`10 20 20 5 8\` হলে আলাদা স্কোর \`20, 10, 8, 5\`; দ্বিতীয় সর্বোচ্চ \`10\`।`,
    inputFormat: `প্রথম লাইনে \`n\`; দ্বিতীয় লাইনে \`n\`টি স্কোর।`,
    outputFormat: `দ্বিতীয় সর্বোচ্চ আলাদা স্কোর, অথবা \`-1\`।`,
    constraints: `\`1 <= n <= 200000\`
\`-10^9 <= score_i <= 10^9\``,
    editorial: `## ধারণা
সব স্কোর একটা সেটে নিয়ে \`O(n log n)\`-এ সর্ট করলে সহজ। সেটের আকার \`2\`-এর কম হলে দ্বিতীয় আলাদা মান নেই — \`-1\`। নাহলে সর্ট করা তালিকার শেষ থেকে দ্বিতীয় মানটাই উত্তর। C++-এ \`std::set\` স্বয়ংক্রিয়ভাবে সর্টেড থাকে; \`rbegin()\` থেকে এক ধাপ এগোলেই দ্বিতীয় সর্বোচ্চ।

## ধাপে ধাপে
1. \`n\` আর স্কোর পড়ো।
2. স্কোরগুলো সেটে নাও (ডুপ্লিকেট বাদ)।
3. সেটের আকার \`2\`-এর কম হলে \`-1\` ছাপো।
4. নাহলে সর্ট করা আলাদা মানের শেষ থেকে দ্বিতীয়টি ছাপো।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
values = sorted(set(data[1:1 + n]))
print(values[-2] if len(values) >= 2 else -1)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n log n)\`, স্পেস \`O(n)\` — সর্টই প্রধান খরচ।

## সাধারণ ভুল
- শুধু সর্ট করে \`values[-2]\` নেওয়া: সর্বোচ্চ মানের ডুপ্লিকেট থাকলে সেটাই দ্বিতীয় বলে ধরা পড়ে।
- এক উপাদানের তালিকায় \`-2\` সূচি: \`IndexError\` হয়, তাই আগে আকার যাচাই।
- ঋণাত্মক স্কোর বাদ দেওয়া: সব পূর্ণসংখ্যাই বৈধ।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Set", "Sorting", "STL"],
    tests: [
      { input: "5\n10 20 20 5 8\n", expectedOutput: "10\n", isSample: true },
      { input: "3\n5 5 5\n", expectedOutput: "-1\n", isSample: true },
      { input: "1\n7\n", expectedOutput: "-1\n", isSample: false },
      { input: "4\n-1 -2 -3 -4\n", expectedOutput: "-2\n", isSample: false },
      { input: "6\n100 99 100 98 99 0\n", expectedOutput: "99\n", isSample: false },
      {
        input: `200000\n${Array.from({ length: 200000 }, (_, i) => i + 1).join(" ")}\n`,
        expectedOutput: "199999\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nvalues = sorted(set(data[1:1 + n]))\nprint(values[-2] if len(values) >= 2 else -1)\n",
  },
  {
    slug: "learn-m2-stl-collections-m2",
    title: "Connect the Ropes",
    statement: `গুদামে বিভিন্ন দৈর্ঘ্যের \`n\`টা দড়ি আছে। রফি সব দড়ি জোড়া দিয়ে একটা লম্বা দড়ি বানাবে। দুইটা দড়ি জোড়া দিলে খরচ হয় তাদের দৈর্ঘ্যের যোগফল, আর নতুন দড়ির দৈর্ঘ্যও সেই যোগফল। সব দড়ি জোড়া দিতে মোট খরচ কত হওয়া উচিত সর্বনিম্ন?

যেমন \`4 3 2 6\`: \`2+3=5\` (খরচ ৫), \`5+4=9\` (খরচ ৯), \`9+6=15\` (খরচ ১৫) — মোট \`29\`।`,
    inputFormat: `প্রথম লাইনে \`n\`; দ্বিতীয় লাইনে \`n\`টি দৈর্ঘ্য।`,
    outputFormat: `সর্বনিম্ন মোট খরচ এক লাইনে।`,
    constraints: `\`1 <= n <= 200000\`
\`1 <= length_i <= 10^9\``,
    editorial: `## ধারণা
যত ছোট দড়ি, তত বার জোড়া লাগে — তাই ছোটগুলো আগে জোড়া দিলে খরচ কমে। এটা হাফম্যান-কোডিংয়ের মতো: প্রতিবার সবচেয়ে ছোট দুইটা দড়ি বেছে জোড়া দাও, নতুন দৈর্ঘ্য আবার গাদে ঢোকাও। \`priority_queue\` (মিন-হিপ) প্রতিবার সর্বনিম্ন দুইটা \`O(log n)\`-এ দেয়। অ্যারে সর্ট করে প্রতিবার নতুন যোগফল ঢোকালে \`O(n^2)\` হয়ে যেতে পারে।

## ধাপে ধাপে
1. সব দৈর্ঘ্য মিন-হিপে ঢোকাও।
2. হিপে একটার বেশি থাকা পর্যন্ত: দুইটা সর্বনিম্ন তোলো, যোগফল বের করো, \`cost += sum\`, নতুন যোগফল হিপে ঢোকাও।
3. \`cost\` ছাপো।

\`\`\`python
import sys
import heapq
data = list(map(int, sys.stdin.read().split()))
n = data[0]
heap = data[1:1 + n]
heapq.heapify(heap)
cost = 0
while len(heap) > 1:
    a = heapq.heappop(heap)
    b = heapq.heappop(heap)
    merged = a + b
    cost += merged
    heapq.heappush(heap, merged)
print(cost)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n log n)\`, স্পেস \`O(n)\` — প্রতিটি জোড়ায় দুইটি হিপ অপারেশন।

## সাধারণ ভুল
- সবচেয়ে বড় দুইটা আগে জোড়া দেওয়া: বড় দড়ি বারবার যোগ হয়ে খরচ বাড়ে।
- প্রতিবার অ্যারে সর্ট করা: \`O(n^2 log n)\`, বড় ইনপুটে সময় শেষ।
- \`n = 1\`-এ লুপ না চললেও উত্তর \`0\` — একটাই দড়ি, জোড়া লাগাতে হয় না।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Heap", "Greedy", "STL"],
    tests: [
      { input: "4\n4 3 2 6\n", expectedOutput: "29\n", isSample: true },
      { input: "5\n1 1 1 1 1\n", expectedOutput: "12\n", isSample: true },
      { input: "1\n10\n", expectedOutput: "0\n", isSample: false },
      { input: "2\n1 2\n", expectedOutput: "3\n", isSample: false },
      { input: "6\n5 5 5 5 5 5\n", expectedOutput: "80\n", isSample: false },
    ],
    referencePython:
      "import sys\nimport heapq\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nheap = data[1:1 + n]\nheapq.heapify(heap)\ncost = 0\nwhile len(heap) > 1:\n    a = heapq.heappop(heap)\n    b = heapq.heappop(heap)\n    merged = a + b\n    cost += merged\n    heapq.heappush(heap, merged)\nprint(cost)\n",
  },
  {
    slug: "learn-m2-stl-collections-m3",
    title: "Nearest Coffee Corners",
    statement: `ক্যাম্পাসের ম্যাপে \`n\`টা কফি কর্নারের অবস্থান \`(x, y)\` দেওয়া আছে। সাদিয়া মূল ভবন \`(0, 0)\` থেকে সবচেয়ে কাছের \`k\`টা কর্নার বেছে নিতে চায়। দূরত্বের তুলনায় বর্গ-দূরত্ব \`x*x + y*y\` ব্যবহার করো — বর্গমূলের দরকার নেই।

বেছে নেওয়া \`k\`টা বর্গ-দূরত্ব ছোট থেকে বড় ক্রমে ছাপো।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`k\`; পরের \`n\` লাইনে \`x y\`।`,
    outputFormat: `সবচেয়ে ছোট \`k\`টা বর্গ-দূরত্ব এক লাইনে স্পেস দিয়ে।`,
    constraints: `\`1 <= k <= n <= 100000\`
\`-10^4 <= x, y <= 10^4\``,
    editorial: `## ধারণা
প্রতিটি বিন্দুর বর্গ-দূরত্ব \`x*x + y*y\` বের করো। সব দূরত্ব সর্ট করে প্রথম \`k\`টা নিলেই উত্তর — \`O(n log n)\`। আরও দক্ষ করতে \`k\` আকারের **ম্যাক্স-হিপ** রাখো: হিপে \`k\`টার কম থাকলে ঢোকাও; নাহলে নতুন দূরত্ব হিপের সর্বোচ্চের চেয়ে ছোট হলে সর্বোচ্চটা বাদ দিয়ে নতুনটা ঢোকাও।

C++-এ \`priority_queue<int>\` ডিফল্ট ম্যাক্স-হিপ; Python-এ \`heapq\` মিন-হিপ, তাই ঋণাত্মক মান রেখে কাজ চালানো যায়।

## ধাপে ধাপে
1. \`n\`, \`k\` পড়ো।
2. প্রতিটি বিন্দুর \`d = x*x + y*y\` হিসাব করো।
3. \`d\`-গুলো সর্ট করো।
4. প্রথম \`k\`টা স্পেস দিয়ে ছাপো।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, k = data[0], data[1]
dist = []
for i in range(n):
    x = data[2 + 2 * i]
    y = data[3 + 2 * i]
    dist.append(x * x + y * y)
dist.sort()
print(' '.join(map(str, dist[:k])))
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n log n)\`, স্পেস \`O(n)\`; হিপ ব্যবহার করলে সময় \`O(n log k)\`।

## সাধারণ ভুল
- বর্গমূল করে ফ্লোটে তুলনা: বড় মানে নির্ভুলতা হারায়; পূর্ণসংখ্যার বর্গ-দূরত্বই যথেষ্ট।
- \`k = n\`-এ হিপের শর্ত ভুল: সব বিন্দুই উত্তর, কোনো বাদ দেওয়া নেই।
- একই দূরত্বের বিন্দু বাদ দেওয়া: প্রশ্নে \`k\`টা **মান** চাওয়া, তাই ডুপ্লিকেট দূরত্বও আলাদা করে গোনা।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Sorting", "Heap", "Geometry"],
    tests: [
      { input: "3 2\n1 3\n-2 2\n2 -2\n", expectedOutput: "8 8\n", isSample: true },
      { input: "4 3\n1 1\n2 2\n0 3\n3 0\n", expectedOutput: "2 8 9\n", isSample: true },
      { input: "1 1\n0 0\n", expectedOutput: "0\n", isSample: false },
      { input: "2 1\n10 10\n1 0\n", expectedOutput: "1\n", isSample: false },
      { input: "3 3\n1 0\n0 2\n2 2\n", expectedOutput: "1 4 8\n", isSample: false },
      {
        input: `100000 5\n${Array.from({ length: 100000 }, (_, i) => `${i} 0`).join("\n")}\n`,
        expectedOutput: "0 1 4 9 16\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, k = data[0], data[1]\ndist = []\nfor i in range(n):\n    x = data[2 + 2 * i]\n    y = data[3 + 2 * i]\n    dist.append(x * x + y * y)\ndist.sort()\nprint(' '.join(map(str, dist[:k])))\n",
  },
  {
    slug: "learn-m2-stl-collections-h2",
    title: "Running Median Ledger",
    statement: `সাদিয়া একের পর এক সংখ্যা লিখে চলেছে। প্রতিটি নতুন সংখ্যা লেখার পরেই সে বর্তমান তালিকার **নিম্ন মিডিয়ান** জানতে চায়। তালিকার আকার বিজোড় হলে মাঝের মানটাই মিডিয়ান; জোড় হলে দুই মাঝের ছোটটাকে নিম্ন মিডিয়ান ধরা হবে।

প্রতিটি ধাপের নিম্ন মিডিয়ান আলাদা লাইনে ছাপো।`,
    inputFormat: `প্রথম লাইনে \`n\`; দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা — লেখার ক্রমে।`,
    outputFormat: `প্রতিটি ধাপের নিম্ন মিডিয়ান, প্রতি লাইনে একটি।`,
    constraints: `\`1 <= n <= 100000\`
\`-10^9 <= a_i <= 10^9\``,
    editorial: `## ধারণা
প্রতিবার সর্ট করলে \`O(n^2 log n)\` লাগে। বদলে দুইটা হিপ রাখো: \`low\` (ম্যাক্স-হিপ) তালিকার ছোট অর্ধেক, \`high\` (মিন-হিপ) বড় অর্ধেক। নিয়ম: \`low\`-এর আকার \`high\`-এর সমান বা এক বেশি; আর \`low\`-এর সর্বোচ্চ \`high\`-এর সর্বনিম্নের চেয়ে বড় নয়। নতুন মান \`low\`-এ ঢোকাও, তারপর ভারসাম্য ঠিক করো। নিম্ন মিডিয়ান সবসময় \`low\`-এর সর্বোচ্চ।

## ধাপে ধাপে
1. \`low\` (ঋণাত্মক মান দিয়ে ম্যাক্স-হিপ), \`high\` (মিন-হিপ) নাও।
2. প্রতিটি \`x\`-এ: \`low\`-এ \`-x\` ঢোকাও; \`high\`-এ \`-low[0]\` ঢোকাও এবং \`low\` থেকে তোলো; \`low\`-এর আকার \`high\`-এর চেয়ে ছোট হলে \`high\` থেকে \`low\`-এ ফেরত দাও।
3. \`-low[0]\` ছাপো।
4. হিপের আকারের পার্থক্য সর্বোচ্চ \`1\` রাখো।

\`\`\`python
import sys
import heapq
data = list(map(int, sys.stdin.read().split()))
n = data[0]
a = data[1:1 + n]
low, high = [], []
out = []
for x in a:
    heapq.heappush(low, -x)
    heapq.heappush(high, -heapq.heappop(low))
    if len(low) < len(high):
        heapq.heappush(low, -heapq.heappop(high))
    out.append(str(-low[0]))
print('\\n'.join(out))
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n log n)\`, স্পেস \`O(n)\` — প্রতিটি সংখ্যায় কয়েকটি হিপ অপারেশন।

## সাধারণ ভুল
- \`low\` আর \`high\`-এর আকারের পার্থক্য না মেলানো: মিডিয়ান ভুল ঘরে চলে যায়।
- জোড় আকারে বড় মাঝটাকে নিম্ন মিডিয়ান ধরা: প্রশ্নে ছোটটাই চাওয়া।
- দুই হিপের ক্রম (\`low\`-এর সর্বোচ্চ \`<= high\`-এর সর্বনিম্ন) রক্ষা না করা।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Heap", "Two Heaps", "Median"],
    tests: [
      { input: "4\n1 2 3 4\n", expectedOutput: "1\n1\n2\n2\n", isSample: true },
      { input: "5\n5 4 3 2 1\n", expectedOutput: "5\n4\n4\n3\n3\n", isSample: true },
      { input: "1\n7\n", expectedOutput: "7\n", isSample: false },
      { input: "6\n2 2 2 2 2 2\n", expectedOutput: "2\n2\n2\n2\n2\n2\n", isSample: false },
      { input: "3\n-1 -5 10\n", expectedOutput: "-1\n-5\n-1\n", isSample: false },
      {
        input: `100000\n${Array.from({ length: 100000 }, (_, i) => i + 1).join(" ")}\n`,
        expectedOutput: `${Array.from({ length: 100000 }, (_, i) => Math.floor(i / 2) + 1).join("\n")}\n`,
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nimport heapq\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:1 + n]\nlow, high = [], []\nout = []\nfor x in a:\n    heapq.heappush(low, -x)\n    heapq.heappush(high, -heapq.heappop(low))\n    if len(low) < len(high):\n        heapq.heappush(low, -heapq.heappop(high))\n    out.append(str(-low[0]))\nprint('\\n'.join(out))\n",
  },
];
