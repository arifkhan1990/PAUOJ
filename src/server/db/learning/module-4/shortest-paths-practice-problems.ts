import type { SeedProblem } from "../../seed-problems";

export const SHORTEST_PATHS_PRACTICE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m4-shortest-paths-e2",
    title: "Cheapest Park Walk",
    statement: `শহরের ছোট উদ্যানে প্রতিটি ঘরে ঢুকতে একটা প্রবেশ ফি লাগে। রফি উপরে-বাম কোণে দাঁড়িয়ে আছে আর নিচে-ডান কোণের বেঞ্চে যাবে; চলা যায় শুধু ডানে বা নিচে — কোনো ঘরে দুইবার ঢোকা লাগবে না।

পথের মোট খরচ হলো পথের প্রতিটি ঘরের ফি যোগ করা — শুরু আর শেষ ঘরসহ। সবচেয়ে কম খরচের পথের মোট ফি ছাপো।

উদাহরণ: ২x২ উদ্যানে ফি \`1 2\` আর \`3 4\` — ডানে গিয়ে নিচে নামলে \`1 + 2 + 4 = 7\`, নিচে গিয়ে ডানে গেলেও \`7\` — উত্তর \`7\`।`,
    inputFormat: `প্রথম লাইনে \`h w\`।
পরের \`h\` লাইনে প্রতিটিতে \`w\`টি পূর্ণসংখ্যা — ওই ঘরের প্রবেশ ফি।`,
    outputFormat: "এক লাইনে সবচেয়ে কম মোট ফি।",
    constraints: "`1 <= h, w <= 200`\n`1 <= fee <= 10^9`।",
    editorial: `## ধারণা

প্রতিটি ঘর একটা নোড, ডান আর নিচের ঘরে যাওয়ার edge-এর ওজন হলো গন্তব্য ঘরের ফি। শুরুর ঘরের ফি আলাদা যোগ করো। ওজন শূন্য বা ধনাত্মক, তাই Dijkstra-ই যথেষ্ট: heap থেকে সবচেয়ে কম খরচের ঘর তুলে প্রতিবেশীদের খরচ কমাও। ডান-নিচে চলা নিয়মের কারণে এখানে পথ কখনো পিছনে আসে না — চাইলে সারি ধরে ধরে ছোট DP-ও চলে, তবে Dijkstra জানা থাকলেই সমাধান হয়ে যায়।

## ধাপে ধাপে

1. গ্রিড পড়ে \`dist[0][0] = fee[0][0]\` দিয়ে heap-এ \`(ফি, 0, 0)\` বসাও।
2. প্রতিবার সবচেয়ে কম খরচের ঘর তুলে stale হলে বাদ দাও।
3. ডান আর নিচের ঘরে নতুন খরচ \`d + fee\` কম হলে আপডেট করে heap-এ দাও।
4. শেষে \`dist[h-1][w-1]\` ছাপাও।

\`\`\`python
import sys, heapq

def main():
    data = sys.stdin.read().split()
    h, w = int(data[0]), int(data[1])
    fee = [[int(data[2 + r * w + c]) for c in range(w)] for r in range(h)]
    INF = 10 ** 30
    dist = [[INF] * w for _ in range(h)]
    dist[0][0] = fee[0][0]
    heap = [(dist[0][0], 0, 0)]
    while heap:
        d, r, c = heapq.heappop(heap)
        if d != dist[r][c]:
            continue
        for nr, nc in ((r + 1, c), (r, c + 1)):
            if nr < h and nc < w and d + fee[nr][nc] < dist[nr][nc]:
                dist[nr][nc] = d + fee[nr][nc]
                heapq.heappush(heap, (dist[nr][nc], nr, nc))
    print(dist[h - 1][w - 1])

main()
\`\`\`

## কমপ্লেক্সিটি

ঘর \`h * w\`টি, প্রতিটি একবার প্রসেস — সময় \`O(h w log(h w))\`। স্পেস \`O(h w)\`।

## সাধারণ ভুল

- শুরুর ঘরের ফি বাদ দেওয়া — খরচ সবসময় এক কম আসে।
- প্রতিবেশীর ফি না বসিয়ে বর্তমান ঘরের ফি যোগ করা — edge-এর ওজন গন্তব্যের ঘরের।
- সামনের ঘরের ফি ছোট দেখে সেদিকে এগোনো — স্থানীয় সস্তা পথ পরে মোটা ফির ঘরে ঠেলে দিতে পারে; পুরো পথ মিলিয়ে দেখাই নিরাপদ।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Dijkstra", "Grid"],
    tests: [
      { input: "2 2\n1 2\n3 4\n", expectedOutput: "7\n", isSample: true },
      { input: "1 1\n5\n", expectedOutput: "5\n", isSample: true },
      {
        input: "3 3\n1 1 60\n2 50 1\n2 2 1\n",
        expectedOutput: "8\n",
        isSample: false,
      },
      { input: "1 4\n3 1 1 1\n", expectedOutput: "6\n", isSample: false },
      {
        input: `200 200\n${Array.from({ length: 200 }, () => Array(200).fill(1).join(" ")).join("\n")}\n`,
        expectedOutput: "399\n",
        isSample: false,
      },
      {
        input: `200 200\n${Array.from({ length: 200 }, (_, r) =>
          Array.from({ length: 200 }, (_, c) => ((r + c) % 2 === 0 ? 1 : 2)).join(" "),
        ).join("\n")}\n`,
        expectedOutput: "598\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys, heapq\n\ndef main():\n    data = sys.stdin.read().split()\n    h, w = int(data[0]), int(data[1])\n    fee = [[int(data[2 + r * w + c]) for c in range(w)] for r in range(h)]\n    INF = 10 ** 30\n    dist = [[INF] * w for _ in range(h)]\n    dist[0][0] = fee[0][0]\n    heap = [(dist[0][0], 0, 0)]\n    while heap:\n        d, r, c = heapq.heappop(heap)\n        if d != dist[r][c]:\n            continue\n        for nr, nc in ((r + 1, c), (r, c + 1)):\n            if nr < h and nc < w and d + fee[nr][nc] < dist[nr][nc]:\n                dist[nr][nc] = d + fee[nr][nc]\n                heapq.heappush(heap, (dist[nr][nc], nr, nc))\n    print(dist[h - 1][w - 1])\n\nmain()\n",
  },
  {
    slug: "learn-m4-shortest-paths-e3",
    title: "Nearest Medical Center",
    statement: `ক্যাম্পাসে \`k\`টি ভবনে মেডিকেল সেন্টার খুলেছে। প্রশাসন জানতে চায় প্রতিটি ভবন থেকে সবচেয়ে কাছের সেন্টারটা কত মিনিটে পাওয়া যায়, যাতে ম্যাপে সেরা রুট এঁকে দেওয়া যায়।

\`n\`টি ভবন, \`m\`টি দ্বিমুখী রাস্তা (প্রতিটির সময় \`w\`), আর \`k\`টি সেন্টারের ভবন নম্বর দেওয়া থাকবে। প্রতিটি ভবনের জন্য সবচেয়ে কাছের সেন্টারের ন্যূনতম সময় ছাপো; কোনো সেন্টারেই পৌঁছানো না গেলে \`-1\`। সেন্টারের ভবনের নিজের দূরত্ব \`0\`।

উদাহরণ: ৪টি ভবন, রাস্তা \`1-2\` (৫ মিনিট), \`2-3\` (৭), \`3-4\` (২), সেন্টার ভবন \`2\` — দূরত্বগুলো \`5 0 7 9\`।`,
    inputFormat: `প্রথম লাইনে \`n m k\`।
পরের \`m\` লাইনে প্রতিটিতে \`u v w\` — আনডিরেক্টেড রাস্তা।
শেষ লাইনে \`k\`টি ভবন নম্বর — সেন্টারগুলো।`,
    outputFormat: "এক লাইনে `n`টি সংখ্যা: প্রতিটি ভবনের সবচেয়ে কাছের সেন্টারের দূরত্ব, না পৌঁছালে `-1`।",
    constraints: "`1 <= n <= 100000`, `0 <= m <= 200000`, `1 <= k <= n`\n`0 <= w <= 10^9`; ভবন নম্বর স্বতন্ত্র।",
    editorial: `## ধারণা

এক সেন্টার থেকে Dijkstra চালালে সেই সেন্টারের জন্য সব ভবনের দূরত্ব পাওয়া যায়; \`k\`টি সেন্টার হলে \`k\` বার চালিয়ে প্রতিটি ঘরে সর্বনিম্নটা রাখা যায় — কিন্তু সেটা ধীর। বুদ্ধিটা এক লাইনে: সব সেন্টারকে একসাথে শূন্য দূরত্ব দিয়ে heap-এ ঢুকিয়ে দাও। Dijkstra তখন প্রথম ঢেউয়ে সব সেন্টার থেকে একসাথে ছড়িয়ে পড়ে, আর প্রতিটি ভবনে সবচেয়ে আগে পৌঁছানো ঢেউটাই সবচেয়ে কাছের সেন্টার থেকে আসে — ঠিক যেমন পানিতে কয়েকটা ঢেউ একসাথে পড়লে যে ঢেউ আগে পৌঁছায় সেটাই জেতে।

## ধাপে ধাপে

1. Adjacency list বানাও; \`dist\` সব \`INF\`।
2. প্রতিটি সেন্টার ভবনে \`dist = 0\` বসিয়ে heap-এ দাও।
3. সাধারণ Dijkstra চালাও — stale এন্ট্রি বাদ, প্রতিটি প্রতিবেশী কমালে ঢোকাও।
4. শেষে \`INF\` ঘর \`-1\` করে \`dist[1..n]\` ছাপাও।

\`\`\`python
import sys, heapq

def main():
    data = sys.stdin.read().split()
    n, m, k = int(data[0]), int(data[1]), int(data[2])
    adj = [[] for _ in range(n + 1)]
    for i in range(m):
        u, v, w = int(data[3 + 3 * i]), int(data[4 + 3 * i]), int(data[5 + 3 * i])
        adj[u].append((v, w))
        adj[v].append((u, w))
    INF = 10 ** 30
    dist = [INF] * (n + 1)
    heap = []
    for i in range(k):
        h = int(data[3 + 3 * m + i])
        dist[h] = 0
        heap.append((0, h))
    heapq.heapify(heap)
    while heap:
        d, u = heapq.heappop(heap)
        if d != dist[u]:
            continue
        for v, w in adj[u]:
            if d + w < dist[v]:
                dist[v] = d + w
                heapq.heappush(heap, (dist[v], v))
    print(' '.join('-1' if dist[i] == INF else str(dist[i]) for i in range(1, n + 1)))

main()
\`\`\`

## কমপ্লেক্সিটি

সব সেন্টার একসাথে ঢোকায় একটাই Dijkstra — সময় \`O((n + m) log n)\`, স্পেস \`O(n + m)\`। \`k\` বার আলাদা চালালে হতো \`k\` গুণ খরচ।

## সাধারণ ভুল

- সেন্টারের \`dist\` শূন্য না বসিয়ে নিজের দূরত্ব \`-1\` রেখে দেওয়া।
- সব সেন্টার একসাথে ঢোকানোর বদলে প্রতিটি ভবনে সব সেন্টারের দূরত্ব আলাদা গণনা করা — সময় অনেক বেশি লাগে।
- ওজন শূন্যের রাস্তায় \`INF\` যোগ করে ফেলা — বড় \`INF\` রাখলেই নিরাপদ।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Dijkstra", "Multi-source"],
    tests: [
      {
        input: "4 3 1\n1 2 5\n2 3 7\n3 4 2\n2\n",
        expectedOutput: "5 0 7 9\n",
        isSample: true,
      },
      {
        input: "5 3 2\n1 2 1\n2 3 1\n4 5 1\n1 5\n",
        expectedOutput: "0 1 2 1 0\n",
        isSample: true,
      },
      { input: "3 1 1\n2 3 4\n2\n", expectedOutput: "-1 0 4\n", isSample: false },
      { input: "1 0 1\n1\n", expectedOutput: "0\n", isSample: false },
      {
        input: `100000 99999 2\n${Array.from({ length: 99999 }, (_, i) => `${i + 1} ${i + 2} 1`).join("\n")}\n1 100000\n`,
        expectedOutput: `${Array.from({ length: 100000 }, (_, i) => Math.min(i, 99999 - i)).join(" ")}\n`,
        isSample: false,
      },
    ],
    referencePython:
      "import sys, heapq\n\ndef main():\n    data = sys.stdin.read().split()\n    n, m, k = int(data[0]), int(data[1]), int(data[2])\n    adj = [[] for _ in range(n + 1)]\n    for i in range(m):\n        u, v, w = int(data[3 + 3 * i]), int(data[4 + 3 * i]), int(data[5 + 3 * i])\n        adj[u].append((v, w))\n        adj[v].append((u, w))\n    INF = 10 ** 30\n    dist = [INF] * (n + 1)\n    heap = []\n    for i in range(k):\n        h = int(data[3 + 3 * m + i])\n        dist[h] = 0\n        heap.append((0, h))\n    heapq.heapify(heap)\n    while heap:\n        d, u = heapq.heappop(heap)\n        if d != dist[u]:\n            continue\n        for v, w in adj[u]:\n            if d + w < dist[v]:\n                dist[v] = d + w\n                heapq.heappush(heap, (dist[v], v))\n    print(' '.join('-1' if dist[i] == INF else str(dist[i]) for i in range(1, n + 1)))\n\nmain()\n",
  },
  {
    slug: "learn-m4-shortest-paths-m2",
    title: "At Most K Rides",
    statement: `নুসরাতের সিটি বাসে প্রতিটি রুট একমুখী, প্রতিটির ভাড়া \`w\`। জংশন \`1\` থেকে \`n\`-এ যেতে হবে, কিন্তু বাজেট কম — সর্বোচ্চ \`k\`টি রাইড নেওয়া যাবে, একটাও কম নিলে ভালো।

সবচেয়ে কম মোট ভাড়া কত হতে পারে বের করো; \`k\` রাইডের মধ্যে পৌঁছানোই না গেলে \`-1\`।

উদাহরণ: রুট \`1 → 2\` (ভাড়া 1), \`2 → 3\` (1), \`1 → 3\` (5) আর \`k = 2\` — দুই রাইডে \`2\` টাকায় পৌঁছানো যায়, সরাসরি এক রাইডে \`5\`; উত্তর \`2\`।`,
    inputFormat: `প্রথম লাইনে \`n m k\`।
পরের \`m\` লাইনে প্রতিটিতে \`u v w\` — \`u\` থেকে \`v\`-এর একমুখী রুট, ভাড়া \`w\`।`,
    outputFormat: "এক লাইনে `k` রাইডের মধ্যে ন্যূনতম মোট ভাড়া, বা `-1`।",
    constraints:
      "`2 <= n <= 500`, `0 <= m <= 2000`, `1 <= k <= 500`\n`0 <= w <= 10^9`; একই জোড়ার রুট একাধিক থাকতে পারে।",
    editorial: `## ধারণা

"কয়টি রাইড" — এই গণনাটাই নতুন মাপকাঠি। Bellman-Ford-এর রাউন্ডগুলো ঠিক এই কাজ করে: \`r\`-তম রাউন্ড শেষে \`dist[v]\` হয় সর্বোচ্চ \`r\`টি edge-ওয়ালা সবচেয়ে সস্তা পথ। তাই ঠিক \`k\` রাউন্ড চালালেই \`k\` রাইডের সেরা উত্তর বেরিয়ে আসে। একটা সতর্কতা: এক রাউন্ডের ভেতরে নতুন করা আপডেট সঙ্গে সঙ্গে আবার ব্যবহার করলে এক রাউন্ডেই অনেকগুলো রাইড জুড়ে যায় — তাই প্রতি রাউন্ডে আগের রাউন্ডের দূরত্ব আলাদা কপি থেকে নাও, নতুন মানগুলো পরের রাউন্ডের জন্য রাখো।

## ধাপে ধাপে

1. \`dist\` সব \`INF\`, \`dist[1] = 0\`; রুটগুলোর তালিকা রাখো।
2. \`k\` বার: \`nd = dist\`-এর কপি নাও; প্রতিটি রুটে \`dist[u] + w < nd[v]\` হলে \`nd[v]\` আপডেট।
3. রাউন্ড শেষে \`dist = nd\`; কিছু না বদলালে আগেই থামো।
4. \`dist[n]\` \`INF\` হলে \`-1\`, না হলে সেটাই উত্তর।

\`\`\`python
import sys

def main():
    data = sys.stdin.read().split()
    n, m, k = int(data[0]), int(data[1]), int(data[2])
    edges = []
    for i in range(m):
        u, v, w = int(data[3 + 3 * i]), int(data[4 + 3 * i]), int(data[5 + 3 * i])
        edges.append((u, v, w))
    INF = 10 ** 30
    dist = [INF] * (n + 1)
    dist[1] = 0
    for _ in range(k):
        nd = dist[:]
        changed = False
        for u, v, w in edges:
            if dist[u] + w < nd[v]:
                nd[v] = dist[u] + w
                changed = True
        dist = nd
        if not changed:
            break
    print(-1 if dist[n] == INF else dist[n])

main()
\`\`\`

## কমপ্লেক্সিটি

\`k\` রাউন্ড, প্রতিটিতে \`m\` রুট — সময় \`O(k * m)\`; এই সীমায় সর্বোচ্চ \`2.5\` লাখ ধাপ। স্পেস \`O(n + m)\`।

## সাধারণ ভুল

- এক রাউন্ডের ভেতরেই নতুন মান ব্যবহার করা — এক রাউন্ডে অনেক রাইড জুড়ে যায়, \`k\`-র শর্ত ভেঙে যায়।
- \`n - 1\` রাউন্ড ঘুরে \`k\` ভুলে যাওয়া — প্রশ্ন বলছে সর্বোচ্চ \`k\` রাইড, রাউন্ডও তাই \`k\`।
- \`k\` রাউন্ডে দূরত্ব না কমলেই \`-1\` লিখে দেওয়া — রুট না থাকলেই \`-1\`, কমছে না মানে উত্তর চূড়ান্ত।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Bellman-Ford", "Bounded Edges"],
    tests: [
      { input: "3 3 2\n1 2 1\n2 3 1\n1 3 5\n", expectedOutput: "2\n", isSample: true },
      { input: "3 1 1\n1 3 5\n", expectedOutput: "5\n", isSample: true },
      { input: "3 2 1\n1 2 1\n2 3 1\n", expectedOutput: "-1\n", isSample: false },
      { input: "2 0 1\n", expectedOutput: "-1\n", isSample: false },
      { input: "3 3 1\n1 2 1\n2 3 1\n1 3 5\n", expectedOutput: "5\n", isSample: false },
      { input: "3 2 2\n1 2 0\n2 3 0\n", expectedOutput: "0\n", isSample: false },
      {
        input: `500 499 499\n${Array.from({ length: 499 }, (_, i) => `${i + 1} ${i + 2} 1`).join("\n")}\n`,
        expectedOutput: "499\n",
        isSample: false,
      },
      {
        input: `101 100 100\n${Array.from({ length: 100 }, (_, i) => `${i + 1} ${i + 2} 1`).join("\n")}\n`,
        expectedOutput: "100\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\n\ndef main():\n    data = sys.stdin.read().split()\n    n, m, k = int(data[0]), int(data[1]), int(data[2])\n    edges = []\n    for i in range(m):\n        u, v, w = int(data[3 + 3 * i]), int(data[4 + 3 * i]), int(data[5 + 3 * i])\n        edges.append((u, v, w))\n    INF = 10 ** 30\n    dist = [INF] * (n + 1)\n    dist[1] = 0\n    for _ in range(k):\n        nd = dist[:]\n        changed = False\n        for u, v, w in edges:\n            if dist[u] + w < nd[v]:\n                nd[v] = dist[u] + w\n                changed = True\n        dist = nd\n        if not changed:\n            break\n    print(-1 if dist[n] == INF else dist[n])\n\nmain()\n",
  },
  {
    slug: "learn-m4-shortest-paths-m3",
    title: "Route Through a Friend",
    statement: `সাদিয়া হোস্টেল \`s\` থেকে ল্যাব \`t\`-এ যাবে, কিন্তু পথে বন্ধুর হোস্টেল \`x\`-এ ঢুকে যেতেই হবে — বই ধার করার জন্য। রাস্তাগুলো দ্বিমুখী, প্রতিটির সময় \`w\` মিনিট।

\`x\` হয়ে যাওয়া সবচেয়ে কম সময়ের পথটা বের করো; \`x\`-এ পৌঁছানোই না গেলে বা \`x\` থেকে \`t\` যাওয়া না গেলে \`-1\`।

উদাহরণ: \`s = 1\`, \`t = 3\`, \`x = 2\`; রাস্তা \`1-2\` (২ মিনিট), \`2-3\` (৩ মিনিট) — উত্তর \`5\`।`,
    inputFormat: `প্রথম লাইনে \`n m s t x\`।
পরের \`m\` লাইনে প্রতিটিতে \`u v w\` — আনডিরেক্টেড রাস্তা।`,
    outputFormat: "এক লাইনে `x` হয়ে যাওয়ার ন্যূনতম সময়, বা `-1`।",
    constraints:
      "`2 <= n <= 100000`, `0 <= m <= 200000`\n`0 <= w <= 10^9`; `s`, `t`, `x` আলাদা না-ও হতে পারে।",
    editorial: `## ধারণা

\`x\` হয়ে যাওয়া পথ দুই টুকরো: \`s\` থেকে \`x\`, আর \`x\` থেকে \`t\`। দুই টুকরোই স্বাধীনভাবে সবচেয়ে ছোট হলে মোটটাও সবচেয়ে ছোট — কারণ দুই টুকরোর পথ মিলিয়েই একটা বৈধ \`s → x → t\` পথ হয়, আর যেকোনো বৈধ পথ এই দুই টুকরোতেই ভাঙা যায়। রাস্তা দ্বিমুখী হওয়ায় \`x\` থেকে \`t\` এর দূরত্ব \`t\` থেকে \`x\` এর দূরত্বেই বের হয়। তাই দুইটা Dijkstra: একটা \`s\` থেকে, আরটা \`t\` থেকে — দুটোর \`x\`-এর ঘর যোগ করলেই উত্তর।

## ধাপে ধাপে

1. \`s\` থেকে একটা Dijkstra চালিয়ে \`ds\` নাও।
2. \`t\` থেকে আরেকটা Dijkstra চালিয়ে \`dt\` নাও।
3. \`ds[x]\` বা \`dt[x]\` \`INF\` হলে \`-1\`।
4. না হলে \`ds[x] + dt[x]\` ছাপাও।

\`\`\`python
import sys, heapq

def main():
    data = sys.stdin.read().split()
    n, m, s, t, x = (int(v) for v in data[:5])
    adj = [[] for _ in range(n + 1)]
    for i in range(m):
        u, v, w = int(data[5 + 3 * i]), int(data[6 + 3 * i]), int(data[7 + 3 * i])
        adj[u].append((v, w))
        adj[v].append((u, w))

    def dijkstra(src):
        INF = 10 ** 30
        dist = [INF] * (n + 1)
        dist[src] = 0
        heap = [(0, src)]
        while heap:
            d, u = heapq.heappop(heap)
            if d != dist[u]:
                continue
            for v, w in adj[u]:
                if d + w < dist[v]:
                    dist[v] = d + w
                    heapq.heappush(heap, (dist[v], v))
        return dist

    ds = dijkstra(s)
    dt = dijkstra(t)
    INF = 10 ** 30
    if ds[x] == INF or dt[x] == INF:
        print(-1)
    else:
        print(ds[x] + dt[x])

main()
\`\`\`

## কমপ্লেক্সিটি

দুইটা Dijkstra — মোট \`O((n + m) log n)\` সময়, \`O(n + m)\` স্পেস।

## সাধারণ ভুল

- \`s\` থেকে \`t\`-এর সবচেয়ে ছোট পথ বের করে দেখা সেটা \`x\` ছুঁয়েছে কি না — ছোট পথ \`x\` এড়িয়ে যেতে পারে, আর তখন সত্যিকারের উত্তর বড় হয়।
- \`x\` থেকে \`t\` আলাদা করে গণনা না করে \`ds[t]\` ব্যবহার করা — \`ds[t]\` এ \`x\` হয়ে যাওয়ার শর্ত নেই।
- \`x = s\` বা \`x = t\` হলে দূরত্ব \`0\` — যোগফলে সেটা নিজে থেকেই ঠিক বসে।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Dijkstra", "Decomposition"],
    tests: [
      { input: "3 2 1 3 2\n1 2 2\n2 3 3\n", expectedOutput: "5\n", isSample: true },
      { input: "3 2 1 3 2\n1 2 1\n1 3 10\n", expectedOutput: "12\n", isSample: true },
      { input: "4 2 1 4 3\n1 2 1\n2 3 1\n", expectedOutput: "-1\n", isSample: false },
      { input: "3 3 1 3 1\n1 2 1\n2 3 1\n1 3 10\n", expectedOutput: "2\n", isSample: false },
      { input: "2 1 1 2 1\n1 2 4\n", expectedOutput: "4\n", isSample: false },
      {
        input: `100000 99999 1 100000 50000\n${Array.from({ length: 99999 }, (_, i) => `${i + 1} ${i + 2} 1`).join("\n")}\n`,
        expectedOutput: "99999\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys, heapq\n\ndef main():\n    data = sys.stdin.read().split()\n    n, m, s, t, x = (int(v) for v in data[:5])\n    adj = [[] for _ in range(n + 1)]\n    for i in range(m):\n        u, v, w = int(data[5 + 3 * i]), int(data[6 + 3 * i]), int(data[7 + 3 * i])\n        adj[u].append((v, w))\n        adj[v].append((u, w))\n\n    def dijkstra(src):\n        INF = 10 ** 30\n        dist = [INF] * (n + 1)\n        dist[src] = 0\n        heap = [(0, src)]\n        while heap:\n            d, u = heapq.heappop(heap)\n            if d != dist[u]:\n                continue\n            for v, w in adj[u]:\n                if d + w < dist[v]:\n                    dist[v] = d + w\n                    heapq.heappush(heap, (dist[v], v))\n        return dist\n\n    ds = dijkstra(s)\n    dt = dijkstra(t)\n    INF = 10 ** 30\n    if ds[x] == INF or dt[x] == INF:\n        print(-1)\n    else:\n        print(ds[x] + dt[x])\n\nmain()\n",
  },
  {
    slug: "learn-m4-shortest-paths-h2",
    title: "Bus Lines with Switch Wait",
    statement: `শহরের বাস রাস্তাগুলো \`n\`টি স্টপকে জুড়েছে, প্রতিটি রাস্তা একটা নির্দিষ্ট লাইনের (\`1\` থেকে \`m\` নম্বরের কোনো লাইন)। রাস্তা \`(u, v)\` পার হতে \`w\` মিনিট, দুই দিকেই চলা যায়। ধরা যাক এক লাইনের বাসে করে এসে অন্য লাইনের বাসে উঠতে হলে স্টপে \`c\` মিনিট অপেক্ষা করতে হয়; একই লাইনে থাকলে অপেক্ষা লাগে না, আর যাত্রা শুরুতে প্রথম বাসে উঠতেও কোনো অপেক্ষা লাগে না।

স্টপ \`1\` থেকে স্টপ \`n\`-এ পৌঁছাতে সবচেয়ে কম মোট সময় (রাস্তার সময় + সব অপেক্ষা) কত বের করো; না পৌঁছানো গেলে \`-1\`।

উদাহরণ: ৪টি স্টপ, সব রাস্তা লাইন \`1\`-এর, প্রতিটি \`1\` মিনিট, \`c = 5\` — লাইন বদল লাগে না, উত্তর \`3\`।`,
    inputFormat: `প্রথম লাইনে \`n m c\` — স্টপ, রাস্তা আর লাইন-বদলের অপেক্ষা।
পরের \`m\` লাইনে প্রতিটিতে \`u v w l\` — \`u\` আর \`v\`-এর মধ্যে রাস্তা, সময় \`w\`, লাইন \`l\`।`,
    outputFormat: "এক লাইনে ন্যূনতম মোট সময়, বা `-1`।",
    constraints:
      "`2 <= n <= 20000`, `1 <= m <= 50000`\n`0 <= w <= 10^9`, `0 <= c <= 10^9`, `1 <= l <= m`।",
    editorial: `## ধারণা

কোন লাইনের বাসে এসে স্টপে নামলাম — এই তথ্যটাই দাম ঠিক করে: একই লাইনের পরের রাস্তায় অপেক্ষা নেই, নতুন লাইনে গেলে \`c\` যোগ। তাই অবস্থা ধরো \`(স্টপ, লাইন)\` — কোনো রাস্তায় ঢুকলে সেই রাস্তার লাইনের অবস্থায় বসব। শুরুতে এখনো কোনো বাসে ওঠেনি — সেটা আলাদা "লাইন নেই" অবস্থা, যেখান থেকে যেকোনো লাইনে প্রথম উঠতে অপেক্ষা লাগে না। সব ওজন শূন্য বা ধনাত্মক, তাই এই বড় গ্রাফে Dijkstra চালালেই উত্তর।

## ধাপে ধাপে

1. প্রতিটি রাস্তা দুই দিকে adjacency list-এ \`(প্রতিবেশী, w, লাইন)\` হিসেবে রাখো।
2. দূরত্ব ডিকশনারি নাও, চাবি \`(স্টপ, লাইন)\`; শুরুতে \`(1, লাইন-নেই) = 0\` দিয়ে heap-এ দাও।
3. প্রতিটি অবস্থা তুলে প্রতিবেশীর রাস্তায়: খরচ \`w + (0 যদি একই লাইন বা এখনো লাইন নেই, নয়তে c)\`।
4. নতুন অবস্থার দূরত্ব কমলে আপডেট করে heap-এ দাও।
5. শেষে \`n\`-এর সব অবস্থার মধ্যে সর্বনিম্নটা ছাপাও; কিছু না পাওয়া গেলে \`-1\`।

\`\`\`python
import sys, heapq

def main():
    data = sys.stdin.read().split()
    n, m, c = int(data[0]), int(data[1]), int(data[2])
    adj = [[] for _ in range(n + 1)]
    for i in range(m):
        u, v, w, l = (int(data[3 + 4 * i + j]) for j in range(4))
        adj[u].append((v, w, l))
        adj[v].append((u, w, l))
    INF = 10 ** 30
    dist = {(1, 0): 0}
    heap = [(0, 1, 0)]
    while heap:
        d, u, line = heapq.heappop(heap)
        if dist.get((u, line), INF) != d:
            continue
        for v, w, l2 in adj[u]:
            extra = 0 if line in (0, l2) else c
            nd = d + w + extra
            if nd < dist.get((v, l2), INF):
                dist[(v, l2)] = nd
                heapq.heappush(heap, (nd, v, l2))
    best = INF
    for (u, _), d in dist.items():
        if u == n and d < best:
            best = d
    print(-1 if best == INF else best)

main()
\`\`\`

## কমপ্লেক্সিটি

অবস্থা সর্বোচ্চ \`2m + 1\`টি, প্রতিটি একবার প্রসেস — সময় \`O(m log m)\`, স্পেস \`O(m)\`।

## সাধারণ ভুল

- লাইনের তথ্য না রেখে শুধু স্টপের দূরত্ব গণনা করা — অপেক্ষার হিসাবই হারিয়ে যায়।
- প্রথম উঠার সময়ও \`c\` যোগ করা — যাত্রা শুরুর বোর্ডিং অপেক্ষামুক্ত, সেটা "লাইন নেই" অবস্থা দিয়ে আলাদা করো।
- শেষ স্টপে শুধু এক লাইনের অবস্থা দেখা — যেকোনো লাইনে পৌঁছালেই গণনায় আসবে, সবগুলোর সর্বনিম্ন লাগবে।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Dijkstra", "State Expansion"],
    tests: [
      { input: "4 3 5\n1 2 1 1\n2 3 1 1\n3 4 1 1\n", expectedOutput: "3\n", isSample: true },
      { input: "4 3 5\n1 2 1 1\n2 3 1 2\n3 4 1 1\n", expectedOutput: "13\n", isSample: true },
      {
        input: "3 3 1\n1 2 5 1\n2 3 5 2\n1 3 20 1\n",
        expectedOutput: "11\n",
        isSample: false,
      },
      { input: "2 0 7\n", expectedOutput: "-1\n", isSample: false },
      { input: "2 1 7\n1 2 3 1\n", expectedOutput: "3\n", isSample: false },
      {
        input: `20000 19999 1\n${Array.from({ length: 19999 }, (_, i) => `${i + 1} ${i + 2} 1 1`).join("\n")}\n`,
        expectedOutput: "19999\n",
        isSample: false,
      },
      {
        input: `20000 19999 1\n${Array.from({ length: 19999 }, (_, i) => `${i + 1} ${i + 2} 1 ${1 + ((i + 1) % 2)}`).join("\n")}\n`,
        expectedOutput: "39997\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys, heapq\n\ndef main():\n    data = sys.stdin.read().split()\n    n, m, c = int(data[0]), int(data[1]), int(data[2])\n    adj = [[] for _ in range(n + 1)]\n    for i in range(m):\n        u, v, w, l = (int(data[3 + 4 * i + j]) for j in range(4))\n        adj[u].append((v, w, l))\n        adj[v].append((u, w, l))\n    INF = 10 ** 30\n    dist = {(1, 0): 0}\n    heap = [(0, 1, 0)]\n    while heap:\n        d, u, line = heapq.heappop(heap)\n        if dist.get((u, line), INF) != d:\n            continue\n        for v, w, l2 in adj[u]:\n            extra = 0 if line in (0, l2) else c\n            nd = d + w + extra\n            if nd < dist.get((v, l2), INF):\n                dist[(v, l2)] = nd\n                heapq.heappush(heap, (nd, v, l2))\n    best = INF\n    for (u, _), d in dist.items():\n        if u == n and d < best:\n            best = d\n    print(-1 if best == INF else best)\n\nmain()\n",
  },
];
