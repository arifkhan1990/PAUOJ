import { lineInput, numbersInput, spaceOutput } from "../generated-tests";
import type { SeedProblem } from "../../seed-problems";

function rangeValues(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index + 1);
}

function descendingValues(count: number): number[] {
  return Array.from({ length: count }, (_, index) => count - index);
}

function frequentPattern(count: number): number[] {
  return Array.from({ length: count }, (_, index) => (index % 1000) + 1);
}

export const HEAPS_PRIORITY_QUEUES_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m4-heaps-priority-queues-g1",
    title: "K-th Largest Number",
    statement:
      "ল্যাব টেস্টের নম্বরগুলো দিয়ে তানভীর জানতে চান তৃতীয় সর্বোচ্চ নম্বরটা কত, যাতে বোঝা যায় কোন ব্যাচ কেমন করছে। পুরো তালিকা সাজিয়ে ফেলা না করে শুধু k-তম বড় মানটা বের করতে হবে। ক্রম হিসেব ধরা হবে বড় থেকে ছোট: সবচেয়ে বড়টি ১-তম, তারপর ২-তম, এভাবে।\n\nউদাহরণ: `1 7 3 9 4` এবং `k = 2` হলে বড় থেকে ছোট `9 7 4 3 1`, তাই উত্তর `7`।",
    inputFormat:
      "এক লাইনে দুটো পূর্ণসংখ্যা `n` ও `k`।\nদ্বিতীয় লাইনে `n` টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।",
    outputFormat: "k-তম সর্বোচ্চ মান এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= k <= n <= 100000`\n`-10^9 <= value <= 10^9`\nমানগুলো স্বতন্ত্র নয় হতে পারে।",
    editorial:
      "### ধারণা\n\nk-তম বড় মান বের করার সবচেয়ে সহজ উপায় হলো একটা ছোট min-heap রাখা যেটায় ঠিক `k`টা মান থাকে। প্রতিটি মান ঢোকালে হিপে বসান, আর হিপের আকার `k` ছাড়িয়ে গেলে সঙ্গে সঙ্গে সবচেয়ে ছোটটা (`heapq.heappop`) সরিয়ে ফেলুন। লুপ শেষে হিপে থাকা kটার মধ্যে সবচেয়ে ছোটটাই হলো পুরো তালিকার k-তম বড় মান, কারণ বড় হিসেবে k টা ছাড়া বাকি সবকিছু ছোট হয়ে গেছে।\n\n### ধাপে ধাপে\n\n1. `n` ও `k` আর মানগুলো পড়ে নিন।\n2. একটা খালি min-heap নিন।\n3. প্রতিটি মানে: heap-এ push করুন, তারপর `len(heap) > k` হলে একটা pop করে ফেলুন।\n4. লুপ শেষে heap-এর সবচেয়ে ছোট মান (রুট) প্রিন্ট করুন — সেটিই k-তম বড়।\n\n```python\nimport sys, heapq\n\ndef main():\n    data = sys.stdin.read().split()\n    n, k = int(data[0]), int(data[1])\n    values = list(map(int, data[2:2 + n]))\n    heap = []\n    for value in values:\n        heapq.heappush(heap, value)\n        if len(heap) > k:\n            heapq.heappop(heap)\n    print(heap[0])\n\nmain()\n```\n\nআরেকটা সহজ কিন্তু বেশি খরচের পথ: `sorted(values, reverse=True)[k - 1]` — এটিও সঠিক, তবে প্রতিবার পুরো তালিকা সাজাতে `O(n log n)` লাগে, আর heap করলে `O(n log k)`।\n\n### কমপ্লেক্সিটি\n\nসময় `O(n log k)` — প্রতিটি ধাপে heap-এর আকার সর্বোচ্চ `k`। স্পেস `O(k)`। মান স্বতন্ত্র না হলেও কোনো সমস্যা হয় না, কারণ ক্রম শুধু মান অনুযায়ী।\n\n### সাধারণ ভুল\n\n- `k` ১-ভিত্তিক; min-heap-এর root `heap[0]`-ই k-তম বড়, তাই সাজানো লিস্টে `sorted(values, reverse=True)[k-1]`-এর সমান।\n- হিপের আকার `k` না রাখা: পুরো `n` টা রাখলে সুবিধা শূন্য, খরচ বেড়ে যায়।\n- Max-heap ভাবে ঋণাত্মক করে ফেলা: এখানে min-heap-ই লাগছে, ঋণাত্মক করলে উত্তর উল্টে যাবে।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Heap", "Top-K", "Selection"],
    tests: [
      { input: "5 2\n1 7 3 9 4\n", expectedOutput: "7\n", isSample: true },
      { input: "4 1\n-5 -2 -9 -1\n", expectedOutput: "-1\n", isSample: true },
      { input: "3 3\n5 5 5\n", expectedOutput: "5\n", isSample: false },
      { input: "6 3\n2 2 1 2 3 2\n", expectedOutput: "2\n", isSample: false },
      {
        input: `100000 50000\n${rangeValues(100000).join(" ")}\n`,
        expectedOutput: "50001\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys, heapq\n\ndef main():\n    data = sys.stdin.read().split()\n    n, k = int(data[0]), int(data[1])\n    values = list(map(int, data[2:2 + n]))\n    heap = []\n    for value in values:\n        heapq.heappush(heap, value)\n        if len(heap) > k:\n            heapq.heappop(heap)\n    print(heap[0])\n\nmain()\n",
  },
  {
    slug: "learn-m4-heaps-priority-queues-g2",
    title: "Top K Frequent Values",
    statement:
      "ক্যান্টিনের অর্ডার লগে সাদিয়া দেখছেন কোন আইটেম সবচেয়ে বেশিবার অর্ডার হয়েছে। তিনি চান প্রতিদিন শুরুতে ঠিক kটা আইটেমের নাম দেখানো হোক — বেশি আসা আগে, আর দুটো সমান হলে যেটার নাম/মান ছোট সেটা আগে।\n\nউদাহরণ: তালিকা `1 2 2 3 3 3` এবং `k = 2` হলে ফ্রিকোয়েন্সি `3 → 3`, `2 → 2`, `1 → 1`, তাই উত্তর `3 2`।",
    inputFormat:
      "এক লাইনে দুটো পূর্ণসংখ্যা `n` ও `k`।\nদ্বিতীয় লাইনে `n` টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।",
    outputFormat:
      "k টি মান এক লাইনে স্পেস দিয়ে: ফ্রিকোয়েন্সি বেশি আগে, টাই হলে ছোট মান আগে।",
    constraints:
      "`1 <= k <= min(n, 1000)`\n`1 <= n <= 100000`\n`1 <= value <= 100000`",
    editorial:
      "### ধারণা\n\nপ্রথমে প্রতিটি মান কয়বার এসেছে সেটা dict/Counter দিয়ে গুনে নিন। এরপর ঠিক k টা মান বাছাই করতে হবে যেগুলোর ফ্রিকোয়েন্সি সবচেয়ে বেশি। এখানে ক্রম দুই ধাপে: আগে ফ্রিকোয়েন্সি অবরোহী, টাই হলে মান আরোহী। এই ক্রম অনুযায়ী k টা নিলেই চলবে; বড় তালিকা থেকে শুধু k টা রাখতে `heapq.nsmallest` ব্যবহার করলে প্রতি ধাপে heap-এর আকার k-এর বেশি হয় না।\n\n### ধাপে ধাপে\n\n1. `n`, `k` আর মানগুলো পড়ে প্রতিটি মানের কাউন্টার বানান।\n2. key function লিখুন: `(-ফ্রিকোয়েন্সি, মান)` — নেগেটিভ দিলে ছোট ক্রমটাই আগে আসবে।\n3. সেই ক্রম অনুযায়ী প্রথম k টা মান তুলে এক লাইনে ছাড়ুন।\n4. k যদি মানের মোট সংখ্যার সমান হয়, তাহলে সবগুলোই আসবে — নিয়ম একই থাকে।\n\n```python\nimport sys, heapq\nfrom collections import Counter\n\ndef main():\n    data = sys.stdin.read().split()\n    n, k = int(data[0]), int(data[1])\n    values = list(map(int, data[2:2 + n]))\n    counts = Counter(values)\n    top = heapq.nsmallest(k, counts, key=lambda value: (-counts[value], value))\n    print(' '.join(map(str, top)))\n\nmain()\n```\n\n### কমপ্লেক্সিটি\n\nকাউন্টার বানানো `O(n)`; বাছাই `O(u log k)` যেখানে `u` হলো স্বতন্ত্র মানের সংখ্যা (`u <= n`)। স্পেস `O(u)`। পুরো সাজানো (`O(u log u)`)ও চলে, তবে k ছোট থাকলে heap সবসময় কম খরচে।\n\n### সাধারণ ভুল\n\n- টাই-ব্রেকিং না করা: ফ্রিকোয়েন্সি সমান হলে ইনপুটের আসা ক্রম নয় — প্রশ্ন বলেছে ছোট মান আগে।\n- শুধু ফ্রিকোয়েন্সি দিয়ে key বানানো: `Counter.most_common(k)` সাধারণত ঠিক দেয়, কিন্তু টাই-এর ক্রম ভাষা ও সংস্করণ অনুযায়ী বদলাতে পারে — নিশ্চিত হতে স্পষ্ট key লিখুন।\n- k-কে n ধরে ফেলা: প্রশ্নে `k <= 1000`, তাই বাইরের মান এলে কোড ভাঙতে পারে।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Heap", "Hash Map", "Top-K"],
    tests: [
      { input: "6 2\n1 2 2 3 3 3\n", expectedOutput: "3 2\n", isSample: true },
      { input: "6 3\n5 1 5 1 9 9\n", expectedOutput: "1 5 9\n", isSample: true },
      { input: "4 1\n7 7 7 8\n", expectedOutput: "7\n", isSample: false },
      {
        input: `1000 1000\n${rangeValues(1000).join(" ")}\n`,
        expectedOutput: spaceOutput(rangeValues(1000)),
        isSample: false,
      },
      {
        input: `100000 1000\n${frequentPattern(100000).join(" ")}\n`,
        expectedOutput: spaceOutput(rangeValues(1000)),
        isSample: false,
      },
    ],
    referencePython:
      "import sys, heapq\nfrom collections import Counter\n\ndef main():\n    data = sys.stdin.read().split()\n    n, k = int(data[0]), int(data[1])\n    values = list(map(int, data[2:2 + n]))\n    counts = Counter(values)\n    top = heapq.nsmallest(k, counts, key=lambda value: (-counts[value], value))\n    print(' '.join(map(str, top)))\n\nmain()\n",
  },
  {
    slug: "learn-m4-heaps-priority-queues-e1",
    title: "Smash the Stones",
    statement:
      "হোস্টেল ক্লাবের টাইল-সাজানো খেলায় নুসরাত ও তানভীর পাশাপাশি দাঁড়িয়ে দুটো সবচেয়ে ভারী পাথর তোলে এবং একসাথে আঘাত করে। আঘাতের পর যদি দুটোর ওজন সমান হয় তাহলে দুটোই উধাও হয়ে যায়, আর না হলে ভারীটি থেকে যায় ওজনের পার্থক্য মাত্র। এভাবে যতক্ষণ না একটা বা শূন্যটা পাথর থাকে, খেলা চলতে থাকে — শেষে কত ওজন থাকা সেটি বলুন।\n\nউদাহরণ: পাথর `2 7 4` হলে `7` ও `4` আঘাত করে `3` দেয়, তারপর `3` ও `2` দিয়ে `1` থাকে — উত্তর `1`।",
    inputFormat:
      "প্রথম লাইনে পাথর সংখ্যা `n`।\nদ্বিতীয় লাইনে `n` টি পূর্ণসংখ্যা — প্রতিটি পাথরের ওজন, স্পেস দিয়ে আলাদা।",
    outputFormat: "খেলা শেষে থাকা পাথরের ওজন এক লাইনে প্রিন্ট করুন; কিছু না থাকলে `0`।",
    constraints: "`1 <= n <= 100000`\n`1 <= weight <= 10^6`",
    editorial:
      "### ধারণা\n\nপ্রতিটি ধাপে সবচেয়ে ভারী দুটো পাথর লাগবে, তাই একটা max-heap ঠিক বসে। Python-এর `heapq` শুধু min-heap দেয়, তাই ওজন ঋণাত্মক করে ঢোকালে রুটটাই হয়ে যায় সবচেয়ে ভারী পাথর। দুটো তুলে পার্থক্য বের করে সেটি আবার হিপে ফেরত দিতে হবে — এখানেই সবচেয়ে বেশি ভুল হয়।\n\n### ধাপে ধাপে\n\n1. `n` আর ওজনগুলো পড়ে প্রতিটি ঋণাত্মক করে min-heap-এ বসান (max-heap হিসেবে)।\n2. হিপে অন্তত দুটো থাকা পর্যন্ত: দুটো সবচেয়ে ভারী (`heappop` দুবার) তুলুন।\n3. ভারী `a`, ছোট `b` হলে `a - b` হলো নতুন ওজন; সেটি শূন্য না হলে হিপে ফিরিয়ে দিন।\n4. একটা বা শূন্যটা বাকি থাকলে তার ওজন (ঋণাত্মক থাকলে `0`) প্রিন্ট করুন।\n\n```python\nimport sys, heapq\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    stones = [-int(value) for value in data[1:1 + n]]\n    heapq.heapify(stones)\n    while len(stones) > 1:\n        first = -heapq.heappop(stones)\n        second = -heapq.heappop(stones)\n        if first != second:\n            heapq.heappush(stones, -(first - second))\n    print(-stones[0] if stones else 0)\n\nmain()\n```\n\n### কমপ্লেক্সিটি\n\nপ্রতিটি ধাপে দুটো pop ও সর্বোচ্চ একটা push, মোট ধাপ `n - 1` — সময় `O(n log n)`। স্পেস `O(n)`।\n\n### সাধারণ ভুল\n\n- ঋণাত্মক করা ভুলে যাওয়া: `heapq` min-heap, তাই সরাসরি ঢোকালে সবসময় সবচেয়ে **হালকা** দুটো তোলা হবে।\n- পার্থক্য শূন্য হলেও হিপে ফেরত দেওয়া: শূন্য থাকলে পরের ধাপে ভুল জোড়া তোলা হতে পারে; শূন্য বাদ দিলেই চলে।\n- শেষ একটা ওজন ঋণাত্মক দেখিয়ে দেওয়া: ওজন কখনোই ঋণাত্মক হয় না, শেষটা `0` হলে `0` লিখুন।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Heap", "Simulation", "Greedy"],
    tests: [
      { input: "3\n2 7 4\n", expectedOutput: "1\n", isSample: true },
      { input: "2\n5 5\n", expectedOutput: "0\n", isSample: true },
      { input: "1\n9\n", expectedOutput: "9\n", isSample: false },
      { input: "4\n1 1 1 1\n", expectedOutput: "0\n", isSample: false },
      {
        input: numbersInput(Array(100000).fill(7)),
        expectedOutput: "0\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys, heapq\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    stones = [-int(value) for value in data[1:1 + n]]\n    heapq.heapify(stones)\n    while len(stones) > 1:\n        first = -heapq.heappop(stones)\n        second = -heapq.heappop(stones)\n        if first != second:\n            heapq.heappush(stones, -(first - second))\n    print(-stones[0] if stones else 0)\n\nmain()\n",
  },
  {
    slug: "learn-m4-heaps-priority-queues-m1",
    title: "Minimum Meeting Rooms",
    statement:
      "ক্লাব সিজনের সভার জন্য একটাই মিটিং রুম, কিন্তু অনেক বুথ কাজ করছে একসাথে। তানভীর জানতে চান সব মিটিং চলাকালীন সর্বোচ্চ কয়টা একসাথে চলছিল — ঠিক ততগুলো রুম লাগবে, কারণ একটা রুমে দুটো মিটিং একসাথে হতে পারে না। যদি একটার শেষ সময় আরেকটার শুরু হয়, তাহলে সেগুলো একই রুমে চলতে পারে।\n\nউদাহরণ: মিটিং `1 3`, `2 5`, `4 6` হলে `1 3` আর `2 5` একসাথে চলে, আর `4 6` আর `2 5`-ও — তাই সর্বোচ্চ `2` টি রুম।",
    inputFormat:
      "প্রথম লাইনে মিটিং সংখ্যা `n`।\nপরবর্তী `n` লাইনে প্রতিটিতে দুটো পূর্ণসংখ্যা `s` ও `e` — মিটিং শুরু ও শেষ সময় (`s` ধরা হয়েছে, `e` ছাড়া হয়েছে)।",
    outputFormat: "সব মিটিং চলাকালীন সর্বোচ্চ একসাথে চলার সংখ্যা এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= n <= 50000`\n`0 <= s < e <= 10^9`\nএকই সময়ে শুরু হওয়া একাধিক মিটিং থাকতে পারে।",
    editorial:
      "### ধারণা\n\nকোনো মুহূর্তে যতগুলো মিটিং চলছে, রুমও ঠিক ততগুলোই লাগবে — তাই সমস্যাটা বদলে যায় 'সর্বোচ্চ একসাথে চলা সংখ্যা' বের করা। সেটা করার সবচেয়ে দ্রুত কৌশল: মিটিংগুলো শুরুর সময় অনুযায়ী সাজিয়ে নিন, তারপর একটা **min-heap**-এ শুরু হওয়া মিটিংগুলোর শেষ সময় রাখুন। নতুন মিটিং শুরু হলে দেখুন হিপে সবচেয়ে ছোট শেষ সময়টা কি এখনোর আগে — হলে ওই রুমটা খালি হয়ে গেছে, তাই pop করে ফেলুন। হিপে যতগুলো রুম বাকি থাকে, উত্তরও ততটুকুই বেশি হয়েছে কোনো মুহূর্তে।\n\n### ধাপে ধাপে\n\n1. সব মিটিং `(শুরু, শেষ)` হিসেবে পড়ে শুরুর সময় অনুযায়ী সাজান।\n2. একটা খালি min-heap নিন (ভেতরে শেষ সময়গুলো থাকবে)।\n3. প্রতিটি মিটিংয়ের জন্য: হিপ খালি না হলে ওর সবচেয়ে ছোট শেষ সময় `<=` বর্তমান শুরু হলে একটা pop করুন (সেই রুম নতুন মিটিং নিচ্ছে)।\n4. বর্তমান মিটিংয়ের শেষ সময় heap-এ push করুন; লুপ চলাকালীন heap-এর আকারের সর্বোচ্চ মানটাই উত্তর।\n5. সর্বোচ্চ আকার প্রিন্ট করুন।\n\n```python\nimport sys, heapq\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    meetings = []\n    for index in range(n):\n        start = int(data[1 + 2 * index])\n        end = int(data[2 + 2 * index])\n        meetings.append((start, end))\n    meetings.sort()\n\n    ends = []\n    answer = 0\n    for start, end in meetings:\n        if ends and ends[0] <= start:\n            heapq.heappop(ends)\n        heapq.heappush(ends, end)\n        answer = max(answer, len(ends))\n    print(answer)\n\nmain()\n```\n\n### কমপ্লেক্সিটি\n\nসাজানো `O(n log n)`, তারপর প্রতিটি মিটিংয়ে সর্বোচ্চ একটা pop ও একটা push — মোট `O(n log n)`। স্পেস `O(n)` heap-এ।\n\n### সাধারণ ভুল\n\n- `ends[0]`-কে pop না করে তুলনা করা: শেষ সময় একটাই, তাই সেটা বাদ না দিলে ভুল রুম খালি হবে।\n- শুরু-শেষ সময় মিলিয়ে ফেলা: `s` আর `e` একই লাইনে আছে, ভুল সূচি থাকলে সাজানোই ভুল হয়।\n- `<=` বনাম `<`: একটার শেষ হয়েই আরেকটা শুরু হলে একই রুম চলে — তাই `ends[0] <= start` হলেই রুম খালি।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Heap", "Scheduling", "Sorting"],
    tests: [
      { input: "3\n1 3\n2 5\n4 6\n", expectedOutput: "2\n", isSample: true },
      { input: "2\n1 2\n2 3\n", expectedOutput: "1\n", isSample: true },
      { input: "1\n0 10\n", expectedOutput: "1\n", isSample: false },
      { input: "4\n5 9\n5 9\n5 9\n5 9\n", expectedOutput: "4\n", isSample: false },
      { input: "3\n1 10\n2 9\n3 8\n", expectedOutput: "3\n", isSample: false },
      {
        input: lineInput(
          Array.from({ length: 50000 }, (_, index) => `${index + 1} ${index + 101}`),
        ),
        expectedOutput: "100\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys, heapq\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    meetings = []\n    for index in range(n):\n        start = int(data[1 + 2 * index])\n        end = int(data[2 + 2 * index])\n        meetings.append((start, end))\n    meetings.sort()\n\n    ends = []\n    answer = 0\n    for start, end in meetings:\n        if ends and ends[0] <= start:\n            heapq.heappop(ends)\n        heapq.heappush(ends, end)\n        answer = max(answer, len(ends))\n    print(answer)\n\nmain()\n",
  },
  {
    slug: "learn-m4-heaps-priority-queues-h1",
    title: "Running Median",
    statement:
      "ল্যাবের মার্ক লিস্টে নতুন নতুন নম্বর যোগ হচ্ছে, আর প্রতিবার সাদিয়া জানতে চান এখন পর্যন্ত আসা নম্বরগুলোর মাঝের মানটা কত — অর্থাৎ running median। জোড় সংখ্যক নম্বর থাকলে মাঝের দুটোর গড় নিয়ে তলানো অঙ্কটা (floor) নেওয়া হবে, আর বিজোড় হলে মাঝেরটাই উত্তর। সব ধাপের উত্তর ক্রম অনুযায়ী এক লাইনে দিতে হবে।\n\nউদাহরণ: নম্বর `1 5 2` হলে ধাপগুলোতে উত্তর যথাক্রমে `1`, `3` (গড় 3), `2` — এক লাইনে `1 3 2`।",
    inputFormat:
      "প্রথম লাইনে নম্বর সংখ্যা `n`।\nদ্বিতীয় লাইনে `n` টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা — যে ক্রমে আসছে সেই ক্রমে।",
    outputFormat:
      "`n` টি উত্তর এক লাইনে স্পেস দিয়ে: প্রতিটি ধাপে সে পর্যন্ত আসা মানের median (জোড় সংখ্যক হলে মাঝের দুটোর গড়ের তলানো অঙ্ক)।",
    constraints:
      "`1 <= n <= 10000`\n`1 <= value <= 1000`\nউত্তরগুলোও `1` থেকে `1000` এর মধ্যে থাকবে।",
    editorial:
      "### ধারণা\n\nMedian বের করার ক্লাসিক কৌশল হলো **দুইটা heap**: ছোট অর্ধেকটা রাখে একটা max-heap-এ (রুটে সবচেয়ে বড়), আর বড় অর্ধেকটা রাখে একটা min-heap-এ (রুটে সবচেয়ে ছোট)। দুই অর্ধেকের আকার প্রায় সমান রাখা হয় — বিজোড় মোট হলে max-heap একটা বেশি, তাহলে median হয় max-heap-এর রুট। জোড় হলে দুই রুটের গড় (তলানো অঙ্কসহ)। নতুন মান ঢোকালে তার চেয়ে ছোট হলে বাম অর্ধেকে, নয়তে ডান অর্ধেকে, তারপর দুই হিপের আকার সমান করে দিতে হয় — এক ধাপ স্থানান্তর করলেই চলে।\n\n### ধাপে ধাপে\n\n1. `lower` (max-heap, ঋণাত্মক করে রাখা) আর `upper` (min-heap) — দুটো খালি দিয়ে শুরু করুন।\n2. নতুন মান `x`: `lower` খালি না হলে ওর রুটের সমান বা ছোট হলে `lower`-এ, নয়তে `upper`-এ push করুন।\n3. আকার মেলান: `lower` একটা বেশি হলে তার রুট `upper`-এ, `upper` বেশি হলে তার রুট `lower`-এ পাঠান।\n4. আকার জোড় হলে দুই রুটের গড়ের তলানো অঙ্ক, বিজোড় হলে `lower`-এর রুট উত্তর।\n5. প্রতিটি ধাপের উত্তর লিস্টে জমিয়ে শেষে এক লাইনে ছাড়ুন।\n\n```python\nimport sys, heapq\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    values = list(map(int, data[1:1 + n]))\n    lower = []   # max-heap হিসেবে: ঋণাত্মক মান\n    upper = []   # min-heap\n    answers = []\n    for value in values:\n        if not lower or value <= -lower[0]:\n            heapq.heappush(lower, -value)\n        else:\n            heapq.heappush(upper, value)\n        if len(lower) < len(upper):\n            heapq.heappush(lower, -heapq.heappop(upper))\n        elif len(lower) > len(upper) + 1:\n            heapq.heappush(upper, -heapq.heappop(lower))\n        if len(lower) == len(upper):\n            answers.append((-lower[0] + upper[0]) // 2)\n        else:\n            answers.append(-lower[0])\n    print(' '.join(map(str, answers)))\n\nmain()\n```\n\n### কমপ্লেক্সিটি\n\nপ্রতিটি ধাপে সর্বোচ্চ দুটো push ও একটা pop — `O(log n)`, মোট `O(n log n)`। স্পেস `O(n)` (দুই heap-এ মিলিয়ে `n` টা মান)।\n\n### সাধারণ ভুল\n\n- Max-heap বানাতে গিয়ে ঋণাত্মক করা ভুলে যাওয়া: Python-এ `heapq` শুধু min-heap, তাই `lower`-এ মান ঋণাত্মক করেই ঢোকাতে হয়।\n- আকার সমান না রাখা: এক পাশে বেশি থাকলে median ভুল হয়, বিশেষ করে জোড় ধাপে।\n- জোড় ধাপে গড় ভুলে যাওয়া: `// 2` মানে তলানো অঙ্ক; Python-এ `//` ঋণাত্মকেও নিচের দিকে যায়, তাই প্রশ্নের নিয়মের সাথে মেলে।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Heap", "Two Heaps", "Median"],
    tests: [
      { input: "3\n1 5 2\n", expectedOutput: "1 3 2\n", isSample: true },
      { input: "4\n4 4 4 4\n", expectedOutput: "4 4 4 4\n", isSample: true },
      { input: "1\n7\n", expectedOutput: "7\n", isSample: false },
      { input: "5\n5 4 3 2 1\n", expectedOutput: "5 4 4 3 3\n", isSample: false },
      {
        input: numbersInput(rangeValues(10000)),
        expectedOutput: spaceOutput(rangeValues(10000).map((value) => Math.ceil(value / 2))),
        isSample: false,
      },
      {
        input: numbersInput(descendingValues(10000)),
        expectedOutput: spaceOutput(
          rangeValues(10000).map((value) => Math.floor((20001 - value) / 2)),
        ),
        isSample: false,
      },
    ],
    referencePython:
      "import sys, heapq\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    values = list(map(int, data[1:1 + n]))\n    lower = []\n    upper = []\n    answers = []\n    for value in values:\n        if not lower or value <= -lower[0]:\n            heapq.heappush(lower, -value)\n        else:\n            heapq.heappush(upper, value)\n        if len(lower) < len(upper):\n            heapq.heappush(lower, -heapq.heappop(upper))\n        elif len(lower) > len(upper) + 1:\n            heapq.heappush(upper, -heapq.heappop(lower))\n        if len(lower) == len(upper):\n            answers.append((-lower[0] + upper[0]) // 2)\n        else:\n            answers.append(-lower[0])\n    print(' '.join(map(str, answers)))\n\nmain()\n",
  },
  {
    slug: "learn-m4-heaps-priority-queues-x1",
    title: "K-th Smallest Number",
    statement:
      "ফেস্টের অনলাইন র‍্যাংকিংয়ে সাদিয়া চান যে কোনো একজনের অবস্থানটা বোঝা যায় — অর্থাৎ সবচেয়ে ছোট থেকে গোনা k-তম নম্বরটা কত। তালিকাটা পুরো সাজিয়ে ফেলা না করে শুধু k-তম ছোট মানটি বের করুন। ক্রম হিসেব ছোট থেকে বড়: সবচেয়ে ছোটটি ১-তম।\n\nউদাহরণ: `9 3 7 1 5` এবং `k = 1` হলে উত্তর `1`; `k = 3` হলে সাজানো `1 3 5 7 9` থেকে `5`।",
    inputFormat:
      "এক লাইনে দুটো পূর্ণসংখ্যা `n` ও `k`।\nদ্বিতীয় লাইনে `n` টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।",
    outputFormat: "k-তম সবচেয়ে ছোট মান এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= k <= n <= 100000`\n`-10^9 <= value <= 10^9`\nমানগুলো স্বতন্ত্র নয় হতে পারে।",
    editorial:
      "### ধারণা\n\nk-তম ছোট মান বের করতে ঠিক k টা ছোট মান রাখা যথেষ্ট — কারণ সেই k টার মধ্যে **সবচেয়ে বড়টাই** হলো পুরো তালিকার k-তম ছোট মান। কিন্তু Python-এর `heapq` min-heap থেকে সবচেয়ে বড়টা তোলা যায় না, তাই মান ঋণাত্মক করে max-heap হিসেবে রাখা হয় — তখন রুট হয় k ছোট মানের মধ্যে বড়টা, অর্থাৎ k-তম ছোট। এটা `learn-m4-heaps-priority-queues-g1`-এর ঠিক উল্টো দিক, শুধু ঋণাত্মক করাটুকু পার্থক্য।\n\n### ধাপে ধাপে\n\n1. `n`, `k` আর মানগুলো পড়ে নিন।\n2. একটা খালি max-heap নিন — অর্থাৎ প্রতিটি মান `-value` করে push করুন।\n3. প্রতিটি push-এর পর `len(heap) > k` হলে একটা pop করে ফেলুন (ঋণাত্মক হিপে সেটি সবচেয়ে ছোট =আসলে সবচেয়ে বড় মান, যেটা বাইরে যেতে পারে)।\n4. লুপ শেষে `-heap[0]` প্রিন্ট করুন — সেটিই k-তম ছোট মান।\n\n```python\nimport sys, heapq\n\ndef main():\n    data = sys.stdin.read().split()\n    n, k = int(data[0]), int(data[1])\n    values = list(map(int, data[2:2 + n]))\n    heap = []\n    for value in values:\n        heapq.heappush(heap, -value)\n        if len(heap) > k:\n            heapq.heappop(heap)\n    print(-heap[0])\n\nmain()\n```\n\nসরাসরি `heapq.nsmallest(k, values)[-1]` লিখলেও একই ফল পাওয়া যায়।\n\n### কমপ্লেক্সিটি\n\nসময় `O(n log k)`, স্পেস `O(k)` — হিপের আকার কখনোই k ছাড়ে না।\n\n### সাধারণ ভুল\n\n- Min-heap-এ সরাসরি মান ঢোকিয়ে k ছোট রাখা: তাহলে pop হয় সবচেয়ে **ছোটটা**, ফলে হিপে থাকে সবচেয়ে বড় k টা আর উত্তর আসে ভুল (k-তম **বড়**)।\n- ঋণাত্মক করে আবার উল্টানো ভুলে যাওয়া: রুট থেকে ঋণাত্মক করে প্রিন্ট করতে হবে।\n- `sorted(values)[k-1]` — ঠিকই, তবে `O(n log n)`; heap হলে `O(n log k)`।\n- ঋণাত্মক মান এলে ভাবা আলাদা নিয়ম লাগবে: ঋণাত্মক করলেও তুলনা একইভাবে চলে।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Heap", "Top-K", "Selection"],
    tests: [
      { input: "5 1\n9 3 7 1 5\n", expectedOutput: "1\n", isSample: true },
      { input: "4 4\n6 2 8 4\n", expectedOutput: "8\n", isSample: true },
      { input: "5 3\n2 2 2 2 2\n", expectedOutput: "2\n", isSample: false },
      { input: "3 2\n-4 -1 -7\n", expectedOutput: "-4\n", isSample: false },
      {
        input: `100000 77777\n${descendingValues(100000).join(" ")}\n`,
        expectedOutput: "77777\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys, heapq\n\ndef main():\n    data = sys.stdin.read().split()\n    n, k = int(data[0]), int(data[1])\n    values = list(map(int, data[2:2 + n]))\n    heap = []\n    for value in values:\n        heapq.heappush(heap, -value)\n        if len(heap) > k:\n            heapq.heappop(heap)\n    print(-heap[0])\n\nmain()\n",
  },
  {
    slug: "learn-m4-heaps-priority-queues-x2",
    title: "Minimum Cost to Connect Ropes",
    statement:
      "ক্লাব টেন্ট সাজানোর জন্য দড়ি জোড়া লাগাচ্ছে। হাতে যতগুলো দড়ি আছে সবগুলো একটায় জোড়া লাগাতে হবে, আর দুটো দড়ি জোড়া লাগানোর খরচ হয় তাদের দৈর্ঘ্যের যোগফল। কোন ক্রমে জোড়া লাগালে মোট খরচ সবচেয়ে কম হবে সেটি বের করুন।\n\nউদাহরণ: দড়ি `1 2 3` — আগে `1` ও `2` জোড়া (খরচ `3`), তারপর `3` ও `3` (খরচ `6`) — মোট `9`।",
    inputFormat:
      "প্রথম লাইনে দড়ি সংখ্যা `n`।\nদ্বিতীয় লাইনে `n` টি পূর্ণসংখ্যা — প্রতিটি দড়ির দৈর্ঘ্য, স্পেস দিয়ে আলাদা।",
    outputFormat: "সবগুলো একটায় জোড়া লাগানোর সর্বনিম্ন মোট খরচ এক লাইনে প্রিন্ট করুন।",
    constraints: "`1 <= n <= 100000`\n`1 <= length <= 10^6`",
    editorial:
      "### ধারণা\n\nসবচেয়ে ছোট দুটো দড়ি আগে জোড়া লাগালেই খরচ সবচেয়ে কম হয় — কারণ ছোট দড়িটা যতবার জড়িত হবে, ততবার তার দৈর্ঘ্য বারবার যোগ হবে; তাই ছোটটাকে যত কম সম্ভব আগে জোড়ায় ধরা ভালো। এটাই Huffman-এর মতো একটা লোভী (greedy) নিয়ম, আর এটা কাজ করে একটা min-heap দিয়ে: প্রতিটি ধাপে দুটো সবচেয়ে ছোট তুলে যোগ করা, যোগফলটা আবার হিপে ফেরত, আর যোগফলগুলোর মোটটাই খরচ।\n\n### ধাপে ধাপে\n\n1. সব দৈর্ঘ্য একটা min-heap-এ বসান (`heapq.heapify`)।\n2. হিপে অন্তত দুটো থাকা পর্যন্ত: দুটো সবচেয়ে ছোট (`heappop` দুবার) তুলুন।\n3. তাদের যোগফল `total`-এ যোগ করুন এবং যোগফলটা হিপে ফিরিয়ে বসান।\n4. একটা বা শূন্যটা বাকি থাকলে `total` প্রিন্ট করুন (একটা দড়ি হলে খরচ `0`)।\n\n```python\nimport sys, heapq\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    ropes = [int(value) for value in data[1:1 + n]]\n    heapq.heapify(ropes)\n    total = 0\n    while len(ropes) > 1:\n        first = heapq.heappop(ropes)\n        second = heapq.heappop(ropes)\n        total += first + second\n        heapq.heappush(ropes, first + second)\n    print(total)\n\nmain()\n```\n\n### কমপ্লেক্সিটি\n\nপ্রতিটি ধাপে দুটো pop ও একটা push, ধাপ সংখ্যা `n - 1` — সময় `O(n log n)` (heapify মিলিয়ে)। স্পেস `O(n)`। খরচ `10^6 * 10^5` পর্যন্ত যায়, তাই ৬৪ বিটের মান লাগবে — Python-এ সমস্যা নেই, C++-এ `long long` দিতে হবে।\n\n### সাধারণ ভুল\n\n- খরচ হিসাবে শুধু যোগফলটা না নেওয়া: প্রতিটি ধাপের জোড়া-খরচ যোগ হয়, শেষের দড়িটার দৈর্ঘ্য আলাদা করে যোগ করা হয় না।\n- সবচেয়ে বড় দুটো তোলা: ছোট দুটো তুলতে হবে, নাহলে খরচ বেড়ে যায়।\n- একটা দড়ির ক্ষেত্রে খরচ `1` ভাবা: জোড়া লাগানোর কোনো কাজ হয়নি, উত্তর `0`।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Heap", "Greedy", "Huffman"],
    tests: [
      { input: "3\n1 2 3\n", expectedOutput: "9\n", isSample: true },
      { input: "2\n5 5\n", expectedOutput: "10\n", isSample: true },
      { input: "1\n4\n", expectedOutput: "0\n", isSample: false },
      { input: "4\n1 1 1 1\n", expectedOutput: "8\n", isSample: false },
      {
        input: numbersInput(Array(100000).fill(1)),
        expectedOutput: "1668928\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys, heapq\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    ropes = [int(value) for value in data[1:1 + n]]\n    heapq.heapify(ropes)\n    total = 0\n    while len(ropes) > 1:\n        first = heapq.heappop(ropes)\n        second = heapq.heappop(ropes)\n        total += first + second\n        heapq.heappush(ropes, first + second)\n    print(total)\n\nmain()\n",
  },
];
