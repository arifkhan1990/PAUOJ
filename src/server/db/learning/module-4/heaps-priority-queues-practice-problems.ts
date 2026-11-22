import type { SeedProblem } from "../../seed-problems";
import { newlineOutput, spaceOutput } from "../generated-tests";

export const HEAPS_PRIORITY_QUEUES_PRACTICE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m4-heaps-priority-queues-e2",
    title: "Heap Sort Ascending",
    statement: `ক্যাফেটেরিয়ার অর্ডার নম্বরগুলো এলোমেলো হয়ে গেছে, আর সাদিয়াকে ছোট থেকে বড় ক্রমে সাজিয়ে পরিবেশন তালিকা বানাতে হবে। সাজানোর কাজটা সে heap দিয়ে করবে — যে নিয়মে একটা min-heap বারবার সবচেয়ে ছোট মানটা উপরে তুলে দেয়।

প্রথম লাইনে \`n\`, দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা দেওয়া থাকবে। মানগুলো ছোট থেকে বড় ক্রমে এক লাইনে ছাপো।

উদাহরণ: \`3 1 2 5 4\` হলে উত্তর \`1 2 3 4 5\`।`,
    inputFormat: `প্রথম লাইনে \`n\`।
দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।`,
    outputFormat: "সাজানো মানগুলো ছোট থেকে বড় এক লাইনে, স্পেস দিয়ে আলাদা।",
    constraints: "`1 <= n <= 100000`\n`-10^9 <= value <= 10^9`; মান স্বতন্ত্র না-ও হতে পারে।",
    editorial: `## ধারণা

Min-heap-এর রুট সবসময় সবচেয়ে ছোট মান। তাই পুরো লিস্ট একবারে heap বানিয়ে (\`heapify\`) রুখে রুখে pop করলে মানগুলো ছোট থেকে বড় নিজে নিজেই বের হয়। \`heapify\` একবারে পুরো লিস্ট সাজিয়ে ফেলে \`O(n)\`-এ; প্রতিটি pop সর্বোচ্চ \`O(log n)\` — মিলিয়ে \`O(n log n)\`, যেকোনো তুলনা-ভিত্তিক সাজানোর সেরা ক্রম।

## ধাপে ধাপে

1. \`n\` আর মানগুলো পড়ে একটা লিস্টে রাখো।
2. \`heapify\` চালিয়ে লিস্টটাকে min-heap বানাও।
3. Heap খালি না হওয়া পর্যন্ত pop করে প্রতিটি মান আউটপুট লিস্টে নাও।
4. লিস্টটা স্পেস দিয়ে এক লাইনে ছাপাও।

\`\`\`python
import sys, heapq

def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    nums = [int(x) for x in data[1:1 + n]]
    heapq.heapify(nums)
    out = []
    while nums:
        out.append(heapq.heappop(nums))
    print(' '.join(map(str, out)))

main()
\`\`\`

## কমপ্লেক্সিটি

সময় \`O(n log n)\` — \`heapify\` মাত্র \`O(n)\`, pop গুলো \`O(n log n)\`। স্পেস \`O(n)\`।

## সাধারণ ভুল

- \`sorted()\` ডেকে কাজ শেষ করা যায়, কিন্তু এই টপিকের শেখা মূল কথা — heap থেকে বারবার সবচেয়ে ছোটটা বের হয় — সেটা নিজে হাতে না চালালে হাতে আসে না।
- Max-heap ভেবে মান উল্টো করে ঢোকালে বড় থেকে ছোট বের হয় — প্রশ্ন ছোট থেকে বড় চায়।
- প্রতিটি মান ঢুকিয়ে ঢুকিয়ে heap বানালে \`O(n log n)\`-ই লাগে, কিন্তু \`heapify\` এক পাসে \`O(n)\` — বড় ইনপুটে সেটাই সস্তা।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Heaps", "Heap Sort"],
    tests: [
      { input: "5\n3 1 2 5 4\n", expectedOutput: "1 2 3 4 5\n", isSample: true },
      { input: "1\n7\n", expectedOutput: "7\n", isSample: true },
      { input: "6\n2 2 1 1 3 3\n", expectedOutput: "1 1 2 2 3 3\n", isSample: false },
      { input: "3\n-5 0 -1\n", expectedOutput: "-5 -1 0\n", isSample: false },
      {
        input: `100000\n${Array.from({ length: 100000 }, (_, i) => 100000 - i).join(" ")}\n`,
        expectedOutput: spaceOutput(Array.from({ length: 100000 }, (_, i) => i + 1)),
        isSample: false,
      },
    ],
    referencePython:
      "import sys, heapq\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    nums = [int(x) for x in data[1:1 + n]]\n    heapq.heapify(nums)\n    out = []\n    while nums:\n        out.append(heapq.heappop(nums))\n    print(' '.join(map(str, out)))\n\nmain()\n",
  },
  {
    slug: "learn-m4-heaps-priority-queues-e3",
    title: "K Closest Benches",
    statement: `ফেস্টের মঞ্চটা মূল প্রাঙ্গণের \`(0, 0)\` বিন্দুতে। তানভির মঞ্চের কাছের \`k\`টি বেঞ্চ সংরক্ষণ করবে, দূরত্ব অনুযায়ী কাছেরটা আগে। দূরত্বের হিসেব হলো স্থানাঙ্ক \`(x, y)\` থেকে মঞ্চ পর্যন্ত সরলরেখা দৈর্ঘ্য — তুলনা করতে গেলে বর্গ \`x^2 + y^2\`-ই যথেষ্ট, কারণ বর্গ বাড়লে দূরত্বও বাড়ে।

প্রথম লাইনে \`n k\`, পরের \`n\` লাইনে প্রতিটিতে একটি বেঞ্চের স্থানাঙ্ক \`x y\`। কাছের \`k\`টি বেঞ্চ প্রতি লাইনে \`x y\` আকারে ছাপো — সবচেয়ে কাছেরটা আগে। সব বেঞ্চের দূরত্বের বর্গ আলাদা আলাদা, তাই ক্রমে কোনো টাই হবে না।

উদাহরণ: বেঞ্চ \`1 0\`, \`0 2\`, \`3 3\` আর \`k = 2\` হলে দূরত্বের বর্গ \`1, 4, 18\` — উত্তর \`1 0\` আর \`0 2\`।`,
    inputFormat: `প্রথম লাইনে \`n k\`।
পরের \`n\` লাইনে প্রতিটিতে \`x y\` — একটি বেঞ্চের স্থানাঙ্ক।`,
    outputFormat: "`k`টি লাইন, প্রতিটিতে `x y` — কাছের বেঞ্চ আগে।",
    constraints:
      "`1 <= k <= n <= 100000`\n`-10^9 <= x, y <= 10^9`\nসব বেঞ্চের `x^2 + y^2` মান স্বতন্ত্র।",
    editorial: `## ধারণা

প্রতিটি বেঞ্চের জন্য তুলনার চাবি হলো \`x^2 + y^2\` — বর্গমূল না নিয়েও কাছে-দূরের ক্রম ঠিক থাকে। সব বেঞ্চ \`(বর্গ, x, y)\` টুপল করে একটা min-heap বানালে রুটে সবচেয়ে কাছের বেঞ্চ বসে; বারবার pop করলে কাছ থেকে দূরের ক্রমেই বের হয়। \`k\` ছোট হলে বর্তমান k-টির মধ্যে সবচেয়ে দূরেরটা ফেলে দেওয়া max-heap কৌশলও চলে; এখানে \`k\` যেকোনো হতে পারে, তাই সরাসরি heapify করে pop করাই সহজ।

## ধাপে ধাপে

1. \`n k\` পড়ে প্রতিটি বেঞ্চের \`(x^2 + y^2, x, y)\` টুপল একটা লিস্টে নাও।
2. \`heapify\` চালাও — লিস্টটা min-heap।
3. \`k\` বার pop করে প্রতিটি টুপল থেকে \`x y\` এক লাইন করে সাজাও।
4. লাইনগুলো জুড়ে ছাপাও।

\`\`\`python
import sys, heapq

def main():
    data = sys.stdin.read().split()
    n, k = int(data[0]), int(data[1])
    pts = []
    idx = 2
    for _ in range(n):
        x, y = int(data[idx]), int(data[idx + 1])
        idx += 2
        pts.append((x * x + y * y, x, y))
    heapq.heapify(pts)
    lines = []
    for _ in range(k):
        _, x, y = heapq.heappop(pts)
        lines.append(str(x) + ' ' + str(y))
    print('\\n'.join(lines))

main()
\`\`\`

## কমপ্লেক্সিটি

\`heapify\` \`O(n)\` আর \`k\`টি pop \`O(k log n)\` — মোট \`O(n + k log n)\`। স্পেস \`O(n)\`।

## সাধারণ ভুল

- বর্গমূল নিতে গিয়ে ভাসমান সংখ্যা ব্যবহার — বড় স্থানাঙ্কে নির্ভুলতার ঝুঁকি; পূর্ণসংখ্যার বর্গই তুলনা দেয়।
- শুধু বর্গ না রেখে আসল স্থানাঙ্ক হারিয়ে ফেলা — টুপলে বর্গের সাথে \`x, y\`-ও রাখো।
- দূরত্বের বর্গ স্বতন্ত্র না হলে টাই ভাঙার নিয়ম না জানিয়ে ক্রম অস্পষ্ট হয়ে যায় — এখানে শর্তই বাঁধা।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Heaps", "Geometry", "Selection"],
    tests: [
      { input: "3 2\n1 0\n0 2\n3 3\n", expectedOutput: "1 0\n0 2\n", isSample: true },
      { input: "1 1\n5 5\n", expectedOutput: "5 5\n", isSample: true },
      {
        input: "4 4\n2 0\n0 3\n-1 1\n0 1\n",
        expectedOutput: "0 1\n-1 1\n2 0\n0 3\n",
        isSample: false,
      },
      { input: "3 1\n-3 -4\n1 1\n0 -7\n", expectedOutput: "1 1\n", isSample: false },
      {
        input: `100000 10\n${Array.from({ length: 100000 }, (_, i) => `${i + 1} ${i + 1}`).join("\n")}\n`,
        expectedOutput: newlineOutput(
          Array.from({ length: 10 }, (_, i) => `${i + 1} ${i + 1}`),
        ),
        isSample: false,
      },
    ],
    referencePython:
      "import sys, heapq\n\ndef main():\n    data = sys.stdin.read().split()\n    n, k = int(data[0]), int(data[1])\n    pts = []\n    idx = 2\n    for _ in range(n):\n        x, y = int(data[idx]), int(data[idx + 1])\n        idx += 2\n        pts.append((x * x + y * y, x, y))\n    heapq.heapify(pts)\n    lines = []\n    for _ in range(k):\n        _, x, y = heapq.heappop(pts)\n        lines.append(str(x) + ' ' + str(y))\n    print('\\n'.join(lines))\n\nmain()\n",
  },
  {
    slug: "learn-m4-heaps-priority-queues-m2",
    title: "Task Cooling Gap",
    statement: `ক্লাব অফিসে কাজের ফাইলগুলো অক্ষরে চেনা: \`A\`, \`B\`, \`C\` এভাবে। একই কাজ পরপর দুইবার ধরতে হলে মাঝে ঠিক \`g\` ধাপ ব্যবধান লাগবে — মানে মাঝের প্রতিটি ধাপে অন্য কোনো কাজ বা ফাঁকা বিরতি বসবে। প্রতিটি ধাপে একটা কাজ বা একটা বিরতি — দুই-ই এক ধাপ গণন হয়।

কাজের স্ট্রিং আর \`g\` দেওয়া থাকবে। সব কাজ শেষ করতে কমিয়েও কত ধাপ লাগবে সেটি ছাপো — কাজের ক্রম ইচ্ছেমতো বসানো যাবে, বিরতি যতখানি লাগে ততখানি।

উদাহরণ: কাজ \`AAABBB\`, \`g = 2\` হলে সাজানো যায় \`A B - A B - A B\` — মোট \`8\` ধাপ।`,
    inputFormat: `প্রথম লাইনে \`n g\` — কাজের সংখ্যা আর ব্যবধান।
দ্বিতীয় লাইনে \`n\`টি বড় হাতের ইংরেজি অক্ষর — কাজের ধারা।`,
    outputFormat: "এক লাইনে সবচেয়ে কম ধাপের সংখ্যা।",
    constraints: "`1 <= n <= 100000`\n`0 <= g <= 100000`\nঅক্ষর `A` থেকে `Z` পর্যন্ত।",
    editorial: `## ধারণা

সবচেয়ে বেশি বার আসা কাজটাই আসল বাধা — ধরো সে \`M\` বার আসে। তাকে সাজাতে হয় \`M - 1\`টা ফাঁকা গ্রুপের মাথায় রেখে, আর প্রতিবার পরের \`M\` আসতে আসতে ঠিক \`g\` ধাপ কেটে যেতে হয় — অর্থাৎ প্রতিটি ফাঁকে \`g\`টি ঘর বসানোর সুযোগ। যদি সর্বোচ্চ কাজ একাধিক প্রকারে থাকে (বলো \`t\`-টি কাজই সর্বোচ্চ \`M\` বার), শেষ গ্রুপে ওই সবগুলো পাশাপাশি বসে — উত্তর হয় \`(M - 1) * (g + 1) + t\`। বাকি সব কাজ এই ফাঁকগুলোতে আটকে গেলে বিরতির দরকারই পড়ে না, না আটকালে ফাঁকগুলো বিরতিতে ভরে যায় — দুই ক্ষেত্রেই এই আকারটাই সর্বনিম্ন। অবশ্য উত্তর \`n\`-এর কম হতে পারে না, তাই সর্বোচ্চটা নাও।

## ধাপে ধাপে

1. প্রতিটি অক্ষর কয়বার আছে গোনো।
2. \`M\` = সর্বোচ্চ বার, \`t\` = কয়টি অক্ষর ঠিক \`M\` বার আসে।
3. উত্তর \`= max(n, (M - 1) * (g + 1) + t)\`।
4. সেটিই ছাপাও।

\`\`\`python
import sys

def main():
    data = sys.stdin.read().split()
    n, g = int(data[0]), int(data[1])
    tasks = data[2]
    counts = {}
    for ch in tasks:
        counts[ch] = counts.get(ch, 0) + 1
    max_count = max(counts.values())
    num_max = sum(1 for v in counts.values() if v == max_count)
    print(max(n, (max_count - 1) * (g + 1) + num_max))

main()
\`\`\`

## কমপ্লেক্সিটি

গোনা \`O(n)\`, বাকি হিসাব \`O(26)\` — মোট \`O(n)\`। স্পেস \`O(26)\`। ধাপে ধাপে simulation করলে সঠিক উত্তর আসে, কিন্তু বড় \`g\` আর \`n\`-এ সময় বেশি লাগে।

## সাধারণ ভুল

- \`n\`-এর সাথে মেলাতে ভুলে যাওয়া: ফাঁকের হিসাব ছোট হলে সব কাজ ঢুকলেই উত্তর \`n\`।
- সর্বোচ্চ কাজ একাধিক হলে শুধু একটার হিসাব করা — \`AAABBB\` মতো কেসে শেষ গ্রুপে দুইটাই বসে।
- \`g = 0\` হলে কোনো বিরতিই লাগে না — উত্তর সরাসরি \`n\`; সূত্রেও তা-ই আসে।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Heaps", "Greedy", "Counting"],
    tests: [
      { input: "6 2\nAAABBB\n", expectedOutput: "8\n", isSample: true },
      { input: "3 1\nAAB\n", expectedOutput: "3\n", isSample: true },
      { input: "1 5\nA\n", expectedOutput: "1\n", isSample: false },
      { input: "7 2\nABCDEAB\n", expectedOutput: "7\n", isSample: false },
      { input: "5 0\nBBAAC\n", expectedOutput: "5\n", isSample: false },
      {
        input: `100000 3\n${"A".repeat(100000)}\n`,
        expectedOutput: "399997\n",
        isSample: false,
      },
      {
        input: `60000 3\n${"ABCDEF".repeat(10000)}\n`,
        expectedOutput: "60000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\n\ndef main():\n    data = sys.stdin.read().split()\n    n, g = int(data[0]), int(data[1])\n    tasks = data[2]\n    counts = {}\n    for ch in tasks:\n        counts[ch] = counts.get(ch, 0) + 1\n    max_count = max(counts.values())\n    num_max = sum(1 for v in counts.values() if v == max_count)\n    print(max(n, (max_count - 1) * (g + 1) + num_max))\n\nmain()\n",
  },
  {
    slug: "learn-m4-heaps-priority-queues-m3",
    title: "Merge K Sorted Lists",
    statement: `ক্লাবের \`k\`টি শাখা থেকে বাছাই-করা নম্বরের তালিকা এসেছে — প্রতিটি তালিকা নিজে ছোট থেকে বড় সাজানো। নুসরাতকে সব শাখার নম্বর এক প্রতিবেদনে মিশিয়ে একটাই সাজানো তালিকা বানাতে হবে।

প্রতিটি লিস্টের মাথার মানগুলো নিয়ে একটা ছোট heap রাখলে প্রতি ধাপে সবচেয়ে ছোটটা নিজে নিজেই সামনে আসে — পুরো ডেটা একসাথে সাজানোর দরকার নেই।

প্রথম লাইনে \`k\`; এরপর প্রতিটি তালিকার জন্য দুই লাইন — প্রথমে সংখ্যা \`m\`, পরে \`m\`টি সাজানো মান। সব মিলিয়ে এক লাইনে ছোট থেকে বড় ছাপো।

উদাহরণ: তালিকা \`1 4 7\`, \`2 5 8\`, \`3 6 9\` মিশলে \`1 2 3 4 5 6 7 8 9\`।`,
    inputFormat: `প্রথম লাইনে \`k\`।
তারপর প্রতিটি তালিকার জন্য: এক লাইনে সেই তালিকার সংখ্যা \`m\`, পরের লাইনে \`m\`টি সাজানো পূর্ণসংখ্যা।`,
    outputFormat: "সব তালিকার মান মিলিয়ে ছোট থেকে বড় এক লাইনে, স্পেস দিয়ে আলাদা।",
    constraints:
      "`1 <= k <= 100`\n`0 <= m <= 1000`\nপ্রতিটি তালিকা সাজানো; মোট মান `1 <= মোট <= 100000`\n`-10^9 <= value <= 10^9`, স্বতন্ত্র না-ও হতে পারে।",
    editorial: `## ধারণা

প্রতিটি মুহূর্তে পরের ছোট মানটা আসতে পারে শুধু কোনো না কোনো তালিকার মাথা থেকে — কারণ তালিকার ভেতরে মান সাজানোই আছে। তাই \`k\`টি মাথার মান নিয়ে একটা min-heap রাখো: প্রতিবার রুট থেকে সবচেয়ে ছোটটা তুলে আউটপুটে দাও, আর সেই তালিকার পরের মানটা heap-এ ঢোকাও। Heap-এ কখনো \`k\`-এর বেশি জিনিস থাকে না, তাই প্রতিটি ধাপ \`O(log k)\` — পুরো মিলিয়ে \`O(N log k)\`, যেখানে \`N\` মোট মানের সংখ্যা। সব মান এক লিস্টে ঢেলে সাজালে \`O(N log N)\` — বড় \`k\`-এর তুলনায় heap-কৌশলটা কম খরচে শেষ হয়।

## ধাপে ধাপে

1. \`k\`টি তালিকা পড়ে রাখো।
2. খালি নয় এমন প্রতিটি তালিকার প্রথম মান \`(মান, তালিকা নম্বর, অবস্থান)\` টুপল করে heap-এ ঢোকাও।
3. প্রতিটি pop-এ মানটা আউটপুটে দাও; ওই তালিকায় পরের মান থাকলে সেটা heap-এ push করো।
4. Heap খালি হলে আউটপুট এক লাইনে ছাড়ো।

\`\`\`python
import sys, heapq

def main():
    data = sys.stdin.read().split()
    k = int(data[0])
    idx = 1
    lists = []
    for _ in range(k):
        m = int(data[idx])
        idx += 1
        lists.append([int(x) for x in data[idx:idx + m]])
        idx += m
    heap = [(lst[0], i, 0) for i, lst in enumerate(lists) if lst]
    heapq.heapify(heap)
    out = []
    while heap:
        value, i, pos = heapq.heappop(heap)
        out.append(value)
        if pos + 1 < len(lists[i]):
            heapq.heappush(heap, (lists[i][pos + 1], i, pos + 1))
    print(' '.join(map(str, out)))

main()
\`\`\`

## কমপ্লেক্সিটি

প্রতিটি মান একবার push একবার pop — \`O(N log k)\`। স্পেস \`O(k)\` (heap) + ইনপুট ধরে রাখা \`O(N)\`।

## সাধারণ ভুল

- Heap-এ পুরো তালিকা ঢেলে দেওয়া — তাহলে \`k\`-এর সুবিধা হারিয়ে যায় আর সাজানো তথ্যও নষ্ট।
- পপ করা তালিকার পরের মান push করতে ভুলে যাওয়া — বাকি তালিকাটা প্রতিবেদনেই আসে না।
- খালি তালিকার প্রথম মান ঢুকিয়ে ফেলা — খালি তালিকা heap-এ ঢুকবেই না।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Heaps", "Merging", "K-way Merge"],
    tests: [
      {
        input: "3\n3\n1 4 7\n3\n2 5 8\n3\n3 6 9\n",
        expectedOutput: spaceOutput(Array.from({ length: 9 }, (_, i) => i + 1)),
        isSample: true,
      },
      { input: "1\n4\n-1 0 5 9\n", expectedOutput: "-1 0 5 9\n", isSample: true },
      { input: "3\n2\n5 5\n0\n\n3\n1 2 2\n", expectedOutput: "1 2 2 5 5\n", isSample: false },
      { input: "2\n3\n1 3 5\n3\n2 3 4\n", expectedOutput: "1 2 3 3 4 5\n", isSample: false },
      {
        input: `100\n${Array.from(
          { length: 100 },
          (_, j) => `1000\n${Array.from({ length: 1000 }, (_, t) => j + 1 + t * 100).join(" ")}`,
        ).join("\n")}\n`,
        expectedOutput: spaceOutput(Array.from({ length: 100000 }, (_, i) => i + 1)),
        isSample: false,
      },
    ],
    referencePython:
      "import sys, heapq\n\ndef main():\n    data = sys.stdin.read().split()\n    k = int(data[0])\n    idx = 1\n    lists = []\n    for _ in range(k):\n        m = int(data[idx])\n        idx += 1\n        lists.append([int(x) for x in data[idx:idx + m]])\n        idx += m\n    heap = [(lst[0], i, 0) for i, lst in enumerate(lists) if lst]\n    heapq.heapify(heap)\n    out = []\n    while heap:\n        value, i, pos = heapq.heappop(heap)\n        out.append(value)\n        if pos + 1 < len(lists[i]):\n            heapq.heappush(heap, (lists[i][pos + 1], i, pos + 1))\n    print(' '.join(map(str, out)))\n\nmain()\n",
  },
  {
    slug: "learn-m4-heaps-priority-queues-h2",
    title: "Startup Projects",
    statement: `ক্লাবের ইনকিউবেটরে \`n\`টি প্রজেক্ট পড়ে আছে। প্রজেক্ট \`i\` শুরু করতে অন্তত \`c_i\` বাজেট লাগে, আর শেষ করলে বাজেটে \`p_i\` লাভ যোগ হয়। হাতে শুরুর বাজেট \`W\`, আর সর্বোচ্চ \`k\`টি প্রজেক্ট নেওয়া যাবে (একটার পর একটা, বাজেট বাড়ার সাথে সাথে নতুন প্রজেক্ট সামর্থ্যের মধ্যে আসে)।

রফি বাজেট সবচেয়ে বড় করে শেষ করতে চায়। সর্বোচ্চ শেষ বাজেট কত হতে পারে সেটি ছাপো — একই প্রজেক্ট দুইবার নেওয়া যাবে না।

উদাহরণ: \`W = 0\`, \`k = 2\`; প্রজেক্ট (বাজেট 0, লাভ 2), (2, 3), (10, 5)। প্রথমটা নিলে বাজেট 2, দ্বিতীয়টা নিলে 5 — উত্তর \`5\`।`,
    inputFormat: `প্রথম লাইনে \`n k W\`।
পরের \`n\` লাইনে প্রতিটিতে \`c p\` — প্রজেক্টের লাগত বাজেট আর লাভ।`,
    outputFormat: "এক লাইনে সর্বোচ্চ সম্ভব শেষ বাজেট।",
    constraints:
      "`1 <= n, k <= 100000`\n`0 <= W, c <= 10^9`\n`0 <= p <= 10^9`।",
    editorial: `## ধারণা

প্রতিটি ধাপে সামর্থ্যের মধ্যে থাকা প্রজেক্টগুলোর মধ্যে সবচেয়ে বড় লাভটাই নেওয়া উচিত — এই লোভী নিয়মটা নিরাপদ, কারণ বেশি লাভ নিলে বাজেট কম কখনোই হয় না, ফলে পরের ধাপে সব প্রজেক্ট আগের মতোই সামর্থ্যে থাকে; তাই কোনো সেরা বিন্যাসে ছোট লাভ নেওয়ার জায়গায় বড় লাভ বসিয়ে ফল খারাপ হয় না। বাস্তবায়ন: প্রজেক্টগুলো বাজেট-লাগত অনুযায়ী সাজাও; একটা পয়েন্টার এগিয়ে যতটুকু লাগত বর্তমান \`W\`-এর মধ্যে তাদের লাভ একটা max-heap-এ ঢোকাও; সবচেয়ে বড় লাভটা নাও; \`W\` বাড়লে পয়েন্টার আবার এগোয়ে। প্রতিটি প্রজেক্ট একবারই ঢোকে আর একবারই বের হয়।

## ধাপে ধাপে

1. প্রজেক্টগুলো \`(c, p)\` জোড়ায় লাগত অনুযায়ী সাজাও।
2. \`i = 0\` পয়েন্টার আর খালি max-heap (Python-এ লাভ ঋণাত্মক করে min-heap হিসেবে) নাও।
3. প্রতিটি ধাপে: \`c_i <= W\` হওয়া পর্যন্ত প্রজেক্টের লাভ heap-এ ঢোকাও, \`i\` বাড়াও।
4. Heap খালি হলে থামো — আর কিছু নেওয়া যাবে না।
5. সবচেয়ে বড় লাভটা তুলে \`W\`-এ যোগ করো; \`k\` ধাপ শেষ হলে \`W\` ছাপাও।

\`\`\`python
import sys, heapq

def main():
    data = sys.stdin.read().split()
    n, k, w = int(data[0]), int(data[1]), int(data[2])
    projects = []
    idx = 3
    for _ in range(n):
        c, p = int(data[idx]), int(data[idx + 1])
        idx += 2
        projects.append((c, p))
    projects.sort()
    heap = []
    i = 0
    for _ in range(k):
        while i < n and projects[i][0] <= w:
            heapq.heappush(heap, -projects[i][1])
            i += 1
        if not heap:
            break
        w += -heapq.heappop(heap)
    print(w)

main()
\`\`\`

## কমপ্লেক্সিটি

সাজানো \`O(n log n)\`; প্রতিটি প্রজেক্ট একবার push একবার pop, মোট \`O((n + k) log n)\`। স্পেস \`O(n)\`। প্রতি ধাপে সব প্রজেক্ট আবার খোঁজা হলে \`O(nk)\` — এই সীমায় চলে না।

## সাধারণ ভুল

- সামর্থ্যের মধ্যে সবচেয়ে ছোট লাগতের প্রজেক্ট নেওয়া — লাভ না দেখলে বাজেট সর্বোচ্চ হয় না।
- \`W\` বাড়ার পর পয়েন্টার আবার না চালানো — নতুন সামর্থ্যের প্রজেক্ট চিরকাল বাদ থাকে।
- সব প্রজেক্ট একসাথে সামর্থ্যের ভিত্তিতে ছেঁকে নেওয়া — প্রথম ধাপে বড় লাগতের প্রজেক্ট পরে সামর্থ্যে আসবে, আগে বাদ দিলে হারিয়ে যায়।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Heaps", "Greedy", "Two Heaps"],
    tests: [
      { input: "3 2 0\n0 2\n2 3\n10 5\n", expectedOutput: "5\n", isSample: true },
      { input: "2 1 6\n10 100\n6 1\n", expectedOutput: "7\n", isSample: true },
      { input: "2 3 1\n5 10\n4 0\n", expectedOutput: "1\n", isSample: false },
      { input: "1 5 0\n0 3\n", expectedOutput: "3\n", isSample: false },
      {
        input: `100000 50000 7\n${Array.from({ length: 100000 }, (_, i) => `0 ${i + 1}`).join("\n")}\n`,
        expectedOutput: `${7 + Array.from({ length: 50000 }, (_, i) => 50001 + i).reduce((a, b) => a + b, 0)}\n`,
        isSample: false,
      },
    ],
    referencePython:
      "import sys, heapq\n\ndef main():\n    data = sys.stdin.read().split()\n    n, k, w = int(data[0]), int(data[1]), int(data[2])\n    projects = []\n    idx = 3\n    for _ in range(n):\n        c, p = int(data[idx]), int(data[idx + 1])\n        idx += 2\n        projects.append((c, p))\n    projects.sort()\n    heap = []\n    i = 0\n    for _ in range(k):\n        while i < n and projects[i][0] <= w:\n            heapq.heappush(heap, -projects[i][1])\n            i += 1\n        if not heap:\n            break\n        w += -heapq.heappop(heap)\n    print(w)\n\nmain()\n",
  },
];
