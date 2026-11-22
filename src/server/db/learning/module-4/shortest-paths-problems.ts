import type { SeedProblem } from "../../seed-problems";
import { newlineOutput, spaceOutput } from "../generated-tests";

export const SHORTEST_PATHS_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m4-shortest-paths-g1",
    title: "Evening Bike Routes",
    statement: `সাদিয়া সন্ধ্যায় সাইকেল করে ক্যাম্পাসের এক প্রান্ত থেকে অন্য প্রান্তে যায়; \`n\`টি জংশন আর \`m\`টি রাস্তা আছে, প্রতিটি রাস্তা দুই দিকে চলা যায় এবং পার হতে \`w\` মিনিট লাগে। শুরুর জংশন হলো \`s\`।
\`s\` থেকে প্রতিটি জংশনে পৌঁছাতে সবচেয়ে কম সময় কত বের করে ছাপো; যাওয়াই না গেলে \`-1\`।`,
    inputFormat: `প্রথম লাইনে \`n m s\`, পরের \`m\` লাইনে প্রতিটিতে \`u v w\` — আনডিরেক্টেড রাস্তা।`,
    outputFormat: `এক লাইনে \`n\` সংখ্যা: জংশন \`1\` থেকে \`n\` পর্যন্ত দূরত্ব, স্পেস দিয়ে আলাদা।`,
    constraints: `\`1 <= n <= 100000\`, \`0 <= m <= 200000\`, \`0 <= w <= 10^9\`; self-loop নেই।`,
    editorial: `## ধারণা
ওজন শূন্য বা ধনাত্মক হলে Dijkstra সবচেয়ে ছোট দূরত্ব নিশ্চিত করে: যে নোডের দূরত্ব চূড়ান্ত হয়েছে সেটা থেকে পাশেদের দূরত্ব ঢিলে ঢিলে কমানো হয়। min-heap ছাড়া প্রতিবার সব ঘুরলে \`O(n*m)\` — বড় ইনপুটে TLE।

## ধাপে ধাপে
1. adjacency list-এ প্রতিটি রাস্তা দুই দিকে যোগ করো; \`dist\` সব \`INF\`, \`dist[s] = 0\`।
2. heap-এ \`(0, s)\` দিয়ে শুরু করো; প্রতিবার সবচেয়ে ছোট \`d\` বের করো।
3. \`d != dist[u]\` হলে (পুরনো এন্ট্রি) বাদ দাও; \`u\`-এর প্রতিটি পাশের \`v\`-এ \`d + w < dist[v]\` হলে আপডেট করে heap-এ দাও।
4. শেষে \`INF\` থাকা ঘরকে \`-1\` করে \`dist[1..n]\` ছাপাও।

\`\`\`python
import sys, heapq
d = list(map(int, sys.stdin.read().split()))
n, m, s = d[0], d[1], d[2]
adj = [[] for _ in range(n + 1)]
for i in range(m):
    u, v, w = d[3+3*i], d[4+3*i], d[5+3*i]
    adj[u].append((v, w)); adj[v].append((u, w))
INF = 10**30; dist = [INF]*(n+1); dist[s] = 0
h = [(0, s)]
while h:
    du, u = heapq.heappop(h)
    if du != dist[u]: continue
    for v, w in adj[u]:
        if du + w < dist[v]: dist[v] = du + w; heapq.heappush(h, (dist[v], v))
print(*[-1 if x == INF else x for x in dist[1:]])
\`\`\`

## কমপ্লেক্সিটি
সময় \`O((n + m) log n)\`, মেমোরি \`O(n + m)\`।

## সাধারণ ভুল
- heap থেকে বের হওয়া পুরনো (stale) এন্ট্রি বাদ না দিলে উত্তর ভুল হয় না, তবে একই নোড বারবার প্রসেস হয়ে বড় ইনপুটে সময় নষ্ট হয় — \`if du != dist[u]: continue\` রাখো।
- \`INF\` ছোট (যেমন \`10^9\`) রাখলে ওজন \`10^9\` যোগ করেই ছোট হয়ে যায়; \`10^{30}\` মতো বড় রাখো।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Dijkstra", "Shortest Path"],
    tests: [
      { input: "5 5 1\n1 2 5\n1 3 10\n2 3 2\n3 4 1\n2 4 20\n", expectedOutput: "0 5 7 8 -1\n", isSample: true },
      { input: "1 0 1\n", expectedOutput: "0\n", isSample: true },
      { input: "3 1 2\n1 2 7\n", expectedOutput: "7 0 -1\n", isSample: false },
      { input: "4 3 1\n1 2 0\n2 3 0\n3 4 0\n", expectedOutput: "0 0 0 0\n", isSample: false },
      { input: `100000 99999 1\n${Array.from({ length: 99999 }, (_, i) => `${i + 1} ${i + 2} 1`).join("\n")}\n`, expectedOutput: spaceOutput(Array.from({ length: 100000 }, (_, i) => i)), isSample: false },
      { input: `100000 99999 1\n${Array.from({ length: 99999 }, (_, i) => `1 ${i + 2} 5`).join("\n")}\n`, expectedOutput: spaceOutput([0, ...Array(99999).fill(5)]), isSample: false },
    ],
    referencePython: "import sys, heapq\nd = list(map(int, sys.stdin.read().split()))\nn, m, s = d[0], d[1], d[2]\nadj = [[] for _ in range(n + 1)]\nfor i in range(m):\n    u, v, w = d[3+3*i], d[4+3*i], d[5+3*i]\n    adj[u].append((v, w))\n    adj[v].append((u, w))\nINF = 10**30\ndist = [INF]*(n+1)\ndist[s] = 0\nh = [(0, s)]\nwhile h:\n    du, u = heapq.heappop(h)\n    if du != dist[u]:\n        continue\n    for v, w in adj[u]:\n        if du + w < dist[v]:\n            dist[v] = du + w\n            heapq.heappush(h, (dist[v], v))\nprint(*[-1 if x == INF else x for x in dist[1:]])\n",
  },
  {
    slug: "learn-m4-shortest-paths-g2",
    title: "Cashback Lanes",
    statement: `নুসরাতের থ্রিফট ক্লাবের গলিগুলো একমুখী, আর কোনো গলিতে ঢুকলে ক্যাশব্যাক পাওয়া যায় — অর্থাৎ খরচ ঋণাত্মকও হতে পারে। \`n\`টি জংশন আর \`m\`টি একমুখী পথ দেওয়া আছে, শুরু জংশন ১।
১ থেকে প্রতিটি জংশনে সবচেয়ে কম খরচ কত বের করে ছাপো; যাওয়াই না গেলে \`-1\`। মনে রেখো, দেওয়া পথগুলোতে কোনো নেগেটিভ সাইকেল নেই — অর্থাৎ কোনো পথ ঘুরে ঘুরে খরচ চিরকাল কমাতে থাকবে না।`,
    inputFormat: `প্রথম লাইনে \`n m\`, পরের \`m\` লাইনে প্রতিটিতে \`u v w\` — \`u\` থেকে \`v\` একমুখী, খরচ \`w\` (ঋণাত্মকও হতে পারে)।`,
    outputFormat: `এক লাইনে \`n\` সংখ্যা: জংশন \`1\` থেকে \`1, 2, ..., n\` পর্যন্ত ন্যূনতম খরচ।`,
    constraints: `\`2 <= n <= 500\`, \`0 <= m <= 3000\`, \`-1000 <= w <= 1000\`
দেওয়া গ্রাফে কোনো নেগেটিভ সাইকেল নেই।`,
    editorial: `## ধারণা
ঋণাত্মক edge থাকলে Dijkstra ভুল দিতে পারে — কারণ পরে আসা ছোট পথ আগে বাদ পড়ে যায়। Bellman-Ford সব edge নিয়ে ঘুরে দূরত্ব কমায়; সবচেয়ে ছোট পথে সবচেয়ে বেশি \`n - 1\`টা edge থাকে, তাই \`n - 1\` রাউন্ড ঘুরলেই চূড়ান্ত।

## ধাপে ধাপে
1. \`dist\` সব \`INF\`, \`dist[1] = 0\`; edges লিস্টে রাখো।
2. \`n - 1\` বার: প্রতিটি \`u v w\`-এর জন্য \`dist[u] + w < dist[v]\` হলে আপডেট করো।
3. কোনো রাউন্ডেই কিছু না বদলালে আগেই থেমে যাও (early exit)।
4. \`INF\` থাকা ঘর \`-1\` করে \`dist[1..n]\` ছাপাও।

\`\`\`python
import sys
d = list(map(int, sys.stdin.read().split()))
n, m = d[0], d[1]
e = [(d[2+3*i], d[3+3*i], d[4+3*i]) for i in range(m)]
INF = 10**30; dist = [INF]*(n+1); dist[1] = 0
for _ in range(n - 1):
    ch = False
    for u, v, w in e:
        if dist[u] + w < dist[v]: dist[v] = dist[u] + w; ch = True
    if not ch: break
print(*[-1 if x == INF else x for x in dist[1:]])
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n * m)\` — \`n = 500\`, \`m = 3000\`-এ Python-এও চলে; মেমোরি \`O(n + m)\`।

## সাধারণ ভুল
- ঠিক \`n\` বার না ঘুরে \`n - 1\` বার ঘুরলে শর্ত মেলে না — ছোট পথের ধাপ সর্বোচ্চ \`n - 1\`।
- edge উল্টো দিকে ধরে নিলে (ডিরেক্টেড প্রশ্নে বাইরে যোগ) ঋণাত্মক খরচ ভুলভাবে প্রযোজ্য হয়।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Bellman-Ford", "Shortest Path"],
    tests: [
      { input: "4 4\n1 2 4\n1 3 5\n2 3 -3\n3 4 1\n", expectedOutput: "0 4 1 2\n", isSample: true },
      { input: "2 1\n1 2 -5\n", expectedOutput: "0 -5\n", isSample: true },
      { input: "3 1\n1 2 3\n", expectedOutput: "0 3 -1\n", isSample: false },
      { input: "3 3\n1 2 2\n2 3 -1\n1 3 4\n", expectedOutput: "0 2 1\n", isSample: false },
      { input: `500 499\n${Array.from({ length: 499 }, (_, i) => `${i + 1} ${i + 2} 1`).join("\n")}\n`, expectedOutput: spaceOutput(Array.from({ length: 500 }, (_, i) => i)), isSample: false },
      { input: `500 499\n${Array.from({ length: 499 }, (_, i) => `${i + 1} ${i + 2} -1`).join("\n")}\n`, expectedOutput: spaceOutput(Array.from({ length: 500 }, (_, i) => -i)), isSample: false },
    ],
    referencePython: "import sys\nd = list(map(int, sys.stdin.read().split()))\nn, m = d[0], d[1]\ne = [(d[2+3*i], d[3+3*i], d[4+3*i]) for i in range(m)]\nINF = 10**30\ndist = [INF]*(n+1)\ndist[1] = 0\nfor _ in range(n - 1):\n    ch = False\n    for u, v, w in e:\n        if dist[u] + w < dist[v]:\n            dist[v] = dist[u] + w\n            ch = True\n    if not ch:\n        break\nprint(*[-1 if x == INF else x for x in dist[1:]])\n",
  },
  {
    slug: "learn-m4-shortest-paths-e1",
    title: "One Trip to the Lab",
    statement: `রফি শুধু একটা জায়গায় যাচ্ছে — হোস্টেল (\`s\`) থেকে ল্যাব (\`t\`)। \`n\`টি জংশন, \`m\`টি আনডিরেক্টেড রাস্তা, প্রতিটির সময় \`w\` মিনিট।
বলো \`s\` থেকে \`t\` পৌঁছাতে সবচেয়ে কম সময় কত; যাওয়াই না গেলে \`-1\`।`,
    inputFormat: `প্রথম লাইনে \`n m s t\`, পরের \`m\` লাইনে প্রতিটিতে \`u v w\`।`,
    outputFormat: `এক লাইনে একটা সংখ্যা — \`s\` থেকে \`t\`-এর ন্যূনতম সময় বা \`-1\`।`,
    constraints: `\`1 <= n <= 100000\`, \`0 <= m <= 200000\`, \`0 <= w <= 10^9\`; \`s\` আর \`t\` একইও হতে পারে।`,
    editorial: `## ধারণা
একই Dijkstra, শুধু উত্তর একটা ঘরের। সুবিধা: \`t\` heap থেকে বের হওয়ামাত্রই থেমে যাওয়া যায় — কারণ সেই মুহূর্তে \`dist[t]\` চূড়ান্ত (heap সবসময় ছোট থেকে বড় বের করে)। বাকি গ্রাফ ঘোরার দরকার নেই।

## ধাপে ধাপে
1. adjacency list বানাও, \`dist\` সব \`INF\`, \`dist[s] = 0\`, heap-এ \`(0, s)\`।
2. সামনের \`u\` বের করে stale এন্ট্রি হলে বাদ দাও; \`u == t\` হলে loop ভাঙো।
3. না হলে \`u\`-এর পাশেদের দূরত্ব আপডেট করে heap-এ দাও।
4. শেষে \`dist[t]\` \`INF\` হলে \`-1\`, না হলে সেটাই উত্তর।

\`\`\`python
import sys, heapq
d = list(map(int, sys.stdin.read().split()))
n, m, s, t = d[0], d[1], d[2], d[3]
adj = [[] for _ in range(n + 1)]
for i in range(m):
    u, v, w = d[4+3*i], d[5+3*i], d[6+3*i]
    adj[u].append((v, w)); adj[v].append((u, w))
INF = 10**30; dist = [INF]*(n+1); dist[s] = 0
h = [(0, s)]
while h:
    du, u = heapq.heappop(h)
    if du != dist[u]: continue
    if u == t: break
    for v, w in adj[u]:
        if du + w < dist[v]: dist[v] = du + w; heapq.heappush(h, (dist[v], v))
print(-1 if dist[t] == INF else dist[t])
\`\`\`

## কমপ্লেক্সিটি
সময় সর্বোচ্চ \`O((n + m) log n)\`, তবে \`t\` তাড়াতাড়ি পাওয়া গেলে অনেক কম। মেমোরি \`O(n + m)\`।

## সাধারণ ভুল
- \`s == t\` হলে উত্তর \`0\`, লুপে ঢুকবেও না — বিশেষ কেস সরাসরি যাচাই না করেও \`dist[s] = 0\` সেট থাকলে ঠিক থাকে।
- পুরো গ্রাফ না ঘুরে \`break\` করায় অন্য ঘরগুলোর দূরত্ব অসম্পূর্ণ থাকে — কিন্তু এখানে শুধু \`t\` চাওয়া হয়েছে, তাই নিরাপদ।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Dijkstra", "Shortest Path"],
    tests: [
      { input: "4 4 1 4\n1 2 3\n2 4 4\n1 3 10\n3 4 2\n", expectedOutput: "7\n", isSample: true },
      { input: "2 0 1 2\n", expectedOutput: "-1\n", isSample: true },
      { input: "3 3 1 3\n1 3 100\n1 2 1\n2 3 1\n", expectedOutput: "2\n", isSample: false },
      { input: "1 0 1 1\n", expectedOutput: "0\n", isSample: false },
      { input: "3 2 3 1\n1 2 5\n2 3 6\n", expectedOutput: "11\n", isSample: false },
      { input: `100000 99999 1 100000\n${Array.from({ length: 99999 }, (_, i) => `${i + 1} ${i + 2} 2`).join("\n")}\n`, expectedOutput: "199998\n", isSample: false },
    ],
    referencePython: "import sys, heapq\nd = list(map(int, sys.stdin.read().split()))\nn, m, s, t = d[0], d[1], d[2], d[3]\nadj = [[] for _ in range(n + 1)]\nfor i in range(m):\n    u, v, w = d[4+3*i], d[5+3*i], d[6+3*i]\n    adj[u].append((v, w))\n    adj[v].append((u, w))\nINF = 10**30\ndist = [INF]*(n+1)\ndist[s] = 0\nh = [(0, s)]\nwhile h:\n    du, u = heapq.heappop(h)\n    if du != dist[u]:\n        continue\n    if u == t:\n        break\n    for v, w in adj[u]:\n        if du + w < dist[v]:\n            dist[v] = du + w\n            heapq.heappush(h, (dist[v], v))\nprint(-1 if dist[t] == INF else dist[t])\n",
  },
  {
    slug: "learn-m4-shortest-paths-m1",
    title: "Zero-Toll Highways",
    statement: `তানভিরের নতুন হাইওয়ে নেটওয়ার্কে প্রতিটি রাস্তার টোল হয় ০ (স্পনসর্ড) বা ১ টাকা। \`n\`টি শহর আর \`m\`টি দ্বিমুখী রাস্তা দেওয়া আছে, শুরু শহর ১।
১ থেকে প্রতিটি শহরে সবচেয়ে কম টোল কত বের করে ছাপো; যাওয়াই না গেলে \`-1\`। ওজন মাত্র ০ বা ১ হওয়ায় সাধারণ Dijkstra-র চেয়ে দ্রুত করা যায়।`,
    inputFormat: `প্রথম লাইনে \`n m\`, পরের \`m\` লাইনে প্রতিটিতে \`u v w\` — \`w\` শুধু \`0\` বা \`1\`।`,
    outputFormat: `এক লাইনে \`n\` সংখ্যা: শহর \`1\` থেকে \`1, 2, ..., n\` পর্যন্ত ন্যূনতম টোল।`,
    constraints: `\`1 <= n <= 100000\`, \`0 <= m <= 200000\`, \`w ∈ {0, 1}\`; self-loop নেই।`,
    editorial: `## ধারণা
ওজন ০/১ হলে deque দিয়ে ০-১ BFS চালালে heap-এর দরকার নেই: \`dist[u]\`-এ পৌঁছে ওজন ০-এর edge সামনে (\`appendleft\`), ওজন ১-এর edge পেছনে (\`append\`) দিলে deque সবসময় ক্রমানুযায়ী থাকে। ফলে মোট ঢোকা-বের হওয়ার সংখ্যা \`O(n + m)\`-এর মধ্যেই থাকে।

## ধাপে ধাপে
1. adjacency list বানাও; \`dist\` সব \`INF\`, \`dist[1] = 0\`, deque-এ \`1\`।
2. সামনের \`u\` বের করো; \`dist[u]\` পুরনো হলে বাদ দাও।
3. পাশের \`v\`-এ \`dist[u] + w < dist[v]\` হলে আপডেট করে: \`w == 0\` হলে \`appendleft\`, না হলে \`append\`।
4. \`INF\` ঘর \`-1\` করে \`dist[1..n]\` ছাপাও।

\`\`\`python
import sys; from collections import deque
d = list(map(int, sys.stdin.read().split()))
n, m = d[0], d[1]; adj = [[] for _ in range(n + 1)]
for i in range(m):
    u, v, w = d[2+3*i], d[3+3*i], d[4+3*i]
    adj[u].append((v, w)); adj[v].append((u, w))
INF = 10**9; dist = [INF]*(n+1); dist[1] = 0; q = deque([1])
while q:
    u = q.popleft()
    if dist[u] == INF: continue
    for v, w in adj[u]:
        if dist[u] + w < dist[v]:
            dist[v] = dist[u] + w
            if w == 0: q.appendleft(v)
            else: q.append(v)
print(*[-1 if x == INF else x for x in dist[1:]])
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n + m)\`, মেমোরি \`O(n + m)\` — heap-এর \`log\` ফ্যাক্টর ছাড়াই।

## সাধারণ ভুল
- ওজন ০-এর edge \`append\` করলে সামনের ১ ওজনের রাস্তা আগে বের হয়ে যায় এবং দূরত্ব বড় থাকে — \`appendleft\` বাধ্যতামূলক।
- পুরনো \`u\` থেকে আবার relax করলেও সমস্যা নেই, তবে \`if dist[u] == INF: continue\` না থাকলে অপ্রয়োজনীয় কাজ বাড়ে।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "0-1 BFS", "Shortest Path"],
    tests: [
      { input: "4 4\n1 2 0\n2 3 1\n1 3 0\n3 4 1\n", expectedOutput: "0 0 0 1\n", isSample: true },
      { input: "2 1\n1 2 1\n", expectedOutput: "0 1\n", isSample: true },
      { input: "5 4\n1 2 1\n2 3 1\n3 4 1\n4 5 1\n", expectedOutput: "0 1 2 3 4\n", isSample: false },
      { input: "4 2\n1 2 0\n3 4 1\n", expectedOutput: "0 0 -1 -1\n", isSample: false },
      { input: "3 2\n1 2 1\n2 3 0\n", expectedOutput: "0 1 1\n", isSample: false },
      { input: `100000 99999\n${Array.from({ length: 99999 }, (_, i) => `${i + 1} ${i + 2} ${(i + 1) % 2}`).join("\n")}\n`, expectedOutput: spaceOutput(Array.from({ length: 100000 }, (_, j) => Math.floor((j + 1) / 2))), isSample: false },
    ],
    referencePython: "import sys\nfrom collections import deque\ndata = list(map(int, sys.stdin.read().split()))\nn, m = data[0], data[1]\nadj = [[] for _ in range(n + 1)]\nfor i in range(m):\n    u, v, w = data[2+3*i], data[3+3*i], data[4+3*i]\n    adj[u].append((v, w))\n    adj[v].append((u, w))\nINF = 10**9\ndist = [INF]*(n+1)\ndist[1] = 0\nq = deque([1])\nwhile q:\n    u = q.popleft()\n    if dist[u] == INF:\n        continue\n    for v, w in adj[u]:\n        if dist[u] + w < dist[v]:\n            dist[v] = dist[u] + w\n            if w == 0:\n                q.appendleft(v)\n            else:\n                q.append(v)\nprint(*[-1 if x == INF else x for x in dist[1:]])\n",
  },
  {
    slug: "learn-m4-shortest-paths-h1",
    title: "Night Bus with One Free Ride",
    statement: `রাতের শাটল বাসে প্রতিটি যাত্রীর একটা কুপন আছে — যেকোনো একটা রাস্তার ভাড়া সেটা দিয়ে মাফ করা যায়; চাইলে ব্যবহার করো, না চাইলে না-ও করো। \`n\`টি স্টপ, \`m\`টি দ্বিমুখী রাস্তা, প্রতিটির ভাড়া \`w\` (শূন্য বা ধনাত্মক); শুরু স্টপ ১, গন্তব্য স্টপ \`n\`।
বলো কুপন ব্যবহার করে (বা না করে) \`1\` থেকে \`n\` পৌঁছাতে সবচেয়ে কম ভাড়া কত। ধরে নাও সব স্টপ \`1\` থেকে পৌঁছানো যায়।`,
    inputFormat: `প্রথম লাইনে \`n m\`, পরের \`m\` লাইনে প্রতিটিতে \`u v w\` — আনডিরেক্টেড রাস্তা।`,
    outputFormat: `এক লাইনে একটা সংখ্যা — ন্যূনতম মোট ভাড়া।`,
    constraints: `\`1 <= n <= 100000\`, \`0 <= m <= 200000\`, \`0 <= w <= 10^9\`; সব স্টপ \`1\` থেকে পৌঁছানো যায়।`,
    editorial: `## ধারণা
কুপন ব্যবহার হয়েছে কি না — এই একটা অবস্থা যোগ করলেই হয়। প্রতিটি নোডকে দুই ভাবে ধরো: \`used = 0\` (কুপন বাকি) আর \`used = 1\` (ব্যবহার হয়ে গেছে)। অবস্থা ০ থেকে ওজন দিয়ে যাওয়া যায় অবস্থা ০-তে, আর কুপন ব্যবহার করে ওজন ০-এ অবস্থা ১-তে যাওয়া যায়; অবস্থা ১ থেকে আর কুপন নেই। এভাবে দ্বিগুণ নোডে Dijkstra চালালেই উত্তর।

## ধাপে ধাপে
1. \`dist[v][0]\` আর \`dist[v][1]\` সব \`INF\`; \`dist[1][0] = 0\`।
2. heap-এ \`(0, 1, 0)\`; প্রতিবার \`(du, u, k)\` বের করে stale যাচাই করো।
3. প্রতিটি রাস্তায়: ভাড়া দিয়ে যাও — \`du + w\` দিয়ে \`dist[v][k]\` আপডেট; \`k == 0\` হলে কুপন ব্যবহার করে \`du\` দিয়ে \`dist[v][1]\` আপডেট।
4. শেষে \`min(dist[n][0], dist[n][1])\` ছাপাও।

\`\`\`python
import sys, heapq
d = list(map(int, sys.stdin.read().split()))
n, m = d[0], d[1]; adj = [[] for _ in range(n + 1)]
for i in range(m):
    u, v, w = d[2+3*i], d[3+3*i], d[4+3*i]
    adj[u].append((v, w)); adj[v].append((u, w))
INF = 10**30
dist = [[INF, INF] for _ in range(n + 1)]
dist[1][0] = 0; h = [(0, 1, 0)]
while h:
    du, u, k = heapq.heappop(h)
    if du != dist[u][k]: continue
    for v, w in adj[u]:
        if du + w < dist[v][k]: dist[v][k] = du + w; heapq.heappush(h, (du + w, v, k))
        if k == 0 and du < dist[v][1]: dist[v][1] = du; heapq.heappush(h, (du, v, 1))
print(min(dist[n]))
\`\`\`

## কমপ্লেক্সিটি
সময় \`O((n + m) log n)\` (দ্বিগুণ অবস্থা), মেমোরি \`O(n)\`।

## সাধারণ ভুল
- শুধু \`dist[n]\` একটা রাখলে কুপন ব্যবহার করা/না করা আলাদা করে মেলানো যায় না — দুই অবস্থা লাগবে।
- কুপন ব্যবহারের সময় ওজন \`w\` যোগ করে দিলে ভুল; সেই ধাপে ভাড়া শূন্য হবে।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Dijkstra", "State Expansion"],
    tests: [
      { input: "4 4\n1 2 5\n2 4 5\n1 3 1\n3 4 100\n", expectedOutput: "1\n", isSample: true },
      { input: "1 0\n", expectedOutput: "0\n", isSample: true },
      { input: "2 1\n1 2 7\n", expectedOutput: "0\n", isSample: false },
      { input: "3 2\n1 2 4\n2 3 5\n", expectedOutput: "4\n", isSample: false },
      { input: "4 3\n1 2 1\n2 3 1\n3 4 1\n", expectedOutput: "2\n", isSample: false },
      { input: `100000 99999\n${Array.from({ length: 99999 }, (_, i) => `${i + 1} ${i + 2} 1`).join("\n")}\n`, expectedOutput: "99998\n", isSample: false },
    ],
    referencePython: "import sys, heapq\nd = list(map(int, sys.stdin.read().split()))\nn, m = d[0], d[1]\nadj = [[] for _ in range(n + 1)]\nfor i in range(m):\n    u, v, w = d[2+3*i], d[3+3*i], d[4+3*i]\n    adj[u].append((v, w))\n    adj[v].append((u, w))\nINF = 10**30\ndist = [[INF, INF] for _ in range(n + 1)]\ndist[1][0] = 0\nh = [(0, 1, 0)]\nwhile h:\n    du, u, k = heapq.heappop(h)\n    if du != dist[u][k]:\n        continue\n    for v, w in adj[u]:\n        if du + w < dist[v][k]:\n            dist[v][k] = du + w\n            heapq.heappush(h, (du + w, v, k))\n        if k == 0 and du < dist[v][1]:\n            dist[v][1] = du\n            heapq.heappush(h, (du, v, 1))\nprint(min(dist[n]))\n",
  },
  {
    slug: "learn-m4-shortest-paths-x1",
    title: "Campus Corner Distances",
    statement: `শিক্ষক একটা ক্যাম্পাস ম্যাপে প্রতিদিন জিজ্ঞেস করে — এই কোণ থেকে ওই কোণে কত দূরে? ম্যাপে \`n\`টি কোণ আর \`m\`টি আনডিরেক্টেড পথ (সময় \`w\`) আছে, কিছু কোণ সরাসরি যুক্তও নাও থাকতে পারে।
\`q\`টি প্রশ্ন দেওয়া হবে — প্রতিটিতে \`a b\`: \`a\` থেকে \`b\` সবচেয়ে কম সময় কত; যাওয়াই না গেলে \`-1\`।`,
    inputFormat: `প্রথম লাইনে \`n m q\`; পরের \`m\` লাইনে পথ \`u v w\`; এরপরের \`q\` লাইনে প্রশ্ন \`a b\`।`,
    outputFormat: `প্রতিটি প্রশ্নের উত্তর এক করে লাইনে — দূরত্ব বা \`-1\`।`,
    constraints: `\`1 <= n <= 150\`, \`0 <= m <= 22500\`, \`1 <= q <= 100000\`, \`0 <= w <= 10^9\`
একই জোড়ার পথ একাধিকবার থাকতে পারে — সবচেয়ে ছোট \`w\`-ই কাজে লাগবে।`,
    editorial: `## ধারণা
প্রশ্ন অনেক, \`n\` ছোট — Floyd-Warshall একবার চালিয়ে সব জোড়ার দূরত্ব বসিয়ে দিলে প্রতি প্রশ্ন \`O(1)\`। মূল কথা: \`k\` নোডকে মাঝখানে রেখে \`i\` থেকে \`j\`-এর পথ ভালো কিনা। \`k\` লুপটাই বাইরে রাখতে হবে, তাহলেই ক্রমটা সঠিক থাকে।

## ধাপে ধাপে
1. \`dist\` ম্যাট্রিক্স \`INF\` দিয়ে, ডায়াগনাল \`0\`; প্রতিটি পথ দুই দিকে বসাও (ছোট ওজন ধরে)।
2. \`k = 1..n\` লুপের ভিতরে \`i = 1..n\`, তারপর \`j = 1..n\`: \`dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])\`।
3. \`dist[i][k]\` \`INF\` হলে যোগ করো না — নইলে \`INF\` মান বেড়ে যায়।
4. প্রতিটি প্রশ্নে \`dist[a][b]\` \`INF\` হলে \`-1\`, না হলে সেটাই উত্তর।

\`\`\`python
import sys
d = list(map(int, sys.stdin.read().split()))
n, m, q = d[0], d[1], d[2]
INF = 10**30
dist = [[INF]*(n+1) for _ in range(n+1)]
for i in range(1, n+1): dist[i][i] = 0
for i in range(m):
    u, v, w = d[3+3*i], d[4+3*i], d[5+3*i]
    if w < dist[u][v]: dist[u][v] = dist[v][u] = w
for k in range(1, n+1):
    for i in range(1, n+1):
        a = dist[i][k]
        if a == INF: continue
        for j in range(1, n+1):
            if a + dist[k][j] < dist[i][j]: dist[i][j] = a + dist[k][j]
out = []; base = 3 + 3*m
for i in range(q):
    x, y = d[base+2*i], d[base+2*i+1]
    out.append(str(-1 if dist[x][y] == INF else dist[x][y]))
print("\\n".join(out))
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n^3 + q)\` — \`n = 150\`-এ \`n^3\` মাত্র \`3.4\` মিলিয়ন, Python-এও চলে। মেমোরি \`O(n^2)\`।

## সাধারণ ভুল
- \`k\` লুপ ভেতরে রাখলে অর্ধেক পথ মিস হয় — \`k\` সবচেয়ে বাইরে।
- \`INF + x\` যোগ করে \`dist\` বাড়িয়ে দেওয়া — \`dist[i][k] == INF\` হলে সেই \`i, j\` বাদ দাও।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Floyd-Warshall", "All Pairs"],
    tests: [
      { input: "4 3 3\n1 2 3\n2 3 4\n1 3 20\n1 4\n1 3\n2 4\n", expectedOutput: "-1\n7\n-1\n", isSample: true },
      { input: "1 0 1\n1 1\n", expectedOutput: "0\n", isSample: true },
      { input: "3 1 2\n2 3 5\n1 2\n3 1\n", expectedOutput: "-1\n-1\n", isSample: false },
      { input: "3 3 3\n1 2 1\n2 3 1\n1 3 5\n1 3\n2 1\n3 2\n", expectedOutput: "2\n1\n1\n", isSample: false },
      { input: `150 149 22500\n${Array.from({ length: 149 }, (_, i) => `${i + 1} ${i + 2} 1`).join("\n")}\n${Array.from({ length: 150 }, (_, i) => Array.from({ length: 150 }, (_, j) => `${i + 1} ${j + 1}`)).flat().join("\n")}\n`, expectedOutput: newlineOutput(Array.from({ length: 150 }, (_, i) => Array.from({ length: 150 }, (_, j) => Math.abs(i - j))).flat()), isSample: false },
      { input: `150 0 100000\n${Array.from({ length: 100000 }, (_, i) => `${(i % 150) + 1} ${((i + 1) % 150) + 1}`).join("\n")}\n`, expectedOutput: newlineOutput(Array(100000).fill("-1")), isSample: false },
    ],
    referencePython: "import sys\nd = list(map(int, sys.stdin.read().split()))\nn, m, q = d[0], d[1], d[2]\nINF = 10**30\ndist = [[INF]*(n+1) for _ in range(n+1)]\nfor i in range(1, n+1):\n    dist[i][i] = 0\nfor i in range(m):\n    u, v, w = d[3+3*i], d[4+3*i], d[5+3*i]\n    if w < dist[u][v]:\n        dist[u][v] = dist[v][u] = w\nfor k in range(1, n+1):\n    for i in range(1, n+1):\n        a = dist[i][k]\n        if a == INF:\n            continue\n        for j in range(1, n+1):\n            if a + dist[k][j] < dist[i][j]:\n                dist[i][j] = a + dist[k][j]\nout = []\nbase = 3 + 3*m\nfor i in range(q):\n    x, y = d[base+2*i], d[base+2*i+1]\n    out.append(str(-1 if dist[x][y] == INF else dist[x][y]))\nprint('\\n'.join(out))\n",
  },
  {
    slug: "learn-m4-shortest-paths-x2",
    title: "Negative Cycle Patrol",
    statement: `ক্যাম্পাস সিকিউরিটি একটা একমুখী পেট্রল পাথের ম্যাপ পেয়েছে, যেখানে কোনো পথে ঢুকলে টাকা ফিরেও পাওয়া যায় (ঋণাত্মক খরচ) — এমন সাইকেল থাকলে পেট্রল চলবেই না।
\`n\`টি জংশন আর \`m\`টি একমুখী পথ দেওয়া আছে। গ্রাফে যেকোনো জায়গায় একটাও নেগেটিভ সাইকেল থাকলে \`NEGATIVE CYCLE\` ছাপো; না থাকলে ১ থেকে প্রতিটি জংশনের ন্যূনতম খরচ ছাপো (যাওয়াই না গেলে \`-1\`)।`,
    inputFormat: `প্রথম লাইনে \`n m\`, পরের \`m\` লাইনে প্রতিটিতে \`u v w\` — \`u\` থেকে \`v\` একমুখী।`,
    outputFormat: `নেগেটিভ সাইকেল থাকলে এক লাইনে \`NEGATIVE CYCLE\`; না হলে এক লাইনে \`n\` সংখ্যা — ১ থেকে প্রতিটি জংশনের খরচ।`,
    constraints: `\`2 <= n <= 500\`, \`0 <= m <= 3000\`, \`-1000 <= w <= 1000\`
সাইকেল \`1\` থেকে না গেলেও গোনা হবে — পুরো গ্রাফ যাচাই করতে হবে।`,
    editorial: `## ধারণা
নেগেটিভ সাইকেল খুঁজতে সব দূরত্ব ০ দিয়ে শুরু করে \`n\` বার relax করা যায় — কোনো রাউন্ডেও কিছু না কমলে সাইকেল নেই, \`n\` নম্বর রাউন্ডেও কমলে আছে (সাইকেল ঘুরে ঘুরে চিরকাল কমবে)। সাইকেল না থাকলে আলাদা করে ১ থেকে Bellman-Ford চালিয়ে দূরত্ব বের করো।

## ধাপে ধাপে
1. \`dist\` সব \`0\` দিয়ে শুরু করে \`n\` বার সব edge relax করো; প্রতিবার কিছু বদলালে \`changed\` রাখো।
2. \`n\` নম্বর রাউন্ডেও বদলালে \`NEGATIVE CYCLE\` ছাপিয়ে থামো।
3. না হলে \`dist\` নতুন করে \`INF\`, \`dist[1] = 0\`; \`n - 1\` বার edge relax করো (early exit চাইলে)।
4. \`INF\` ঘর \`-1\` করে \`dist[1..n]\` ছাপাও।

\`\`\`python
import sys
d = list(map(int, sys.stdin.read().split()))
n, m = d[0], d[1]
e = [(d[2+3*i], d[3+3*i], d[4+3*i]) for i in range(m)]
INF = 10**30
dist = [0]*(n+1); ch = False
for _ in range(n):
    ch = False
    for u, v, w in e:
        if dist[u] + w < dist[v]: dist[v] = dist[u] + w; ch = True
    if not ch: break
if ch:
    print("NEGATIVE CYCLE")
else:
    dist = [INF]*(n+1); dist[1] = 0
    for _ in range(n - 1):
        up = False
        for u, v, w in e:
            if dist[u] + w < dist[v]: dist[v] = dist[u] + w; up = True
        if not up: break
    print(*[-1 if x == INF else x for x in dist[1:]])
\`\`\`

## কমপ্লেক্সিটি
সময় সর্বোচ্চ \`O(n * m)\` (দুইবার), মেমোরি \`O(n + m)\` — \`n = 500\`, \`m = 3000\`-এ চলে।

## সাধারণ ভুল
- শুধু \`1\` থেকে সাইকেল খোঁজা — অপ্রাপ্য অংশে সাইকেল থাকলে উত্তর বদলায়; সব নোড ০ দিয়ে শুরু করো।
- \`n - 1\` রাউন্ডের পরও এক রাউন্ড relax না করে সিদ্ধান্ত নেওয়া — detection-এ \`n\` নম্বর রাউন্ডই মূল কথা।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Bellman-Ford", "Negative Cycle"],
    tests: [
      { input: "3 3\n1 2 1\n2 3 -4\n3 2 1\n", expectedOutput: "NEGATIVE CYCLE\n", isSample: true },
      { input: "3 2\n1 2 5\n2 3 -2\n", expectedOutput: "0 5 3\n", isSample: true },
      { input: "4 3\n1 2 1\n3 4 -2\n4 3 -2\n", expectedOutput: "NEGATIVE CYCLE\n", isSample: false },
      { input: "4 4\n1 2 2\n2 3 -1\n3 4 3\n1 4 10\n", expectedOutput: "0 2 1 4\n", isSample: false },
      { input: `500 499\n${Array.from({ length: 499 }, (_, i) => `${i + 1} ${i + 2} 1`).join("\n")}\n`, expectedOutput: spaceOutput(Array.from({ length: 500 }, (_, i) => i)), isSample: false },
      { input: `500 500\n${Array.from({ length: 499 }, (_, i) => `${i + 1} ${i + 2} -1`).join("\n")}\n500 1 -1\n`, expectedOutput: "NEGATIVE CYCLE\n", isSample: false },
    ],
    referencePython: "import sys\nd = list(map(int, sys.stdin.read().split()))\nn, m = d[0], d[1]\ne = [(d[2+3*i], d[3+3*i], d[4+3*i]) for i in range(m)]\nINF = 10**30\ndist = [0]*(n+1)\nch = False\nfor _ in range(n):\n    ch = False\n    for u, v, w in e:\n        if dist[u] + w < dist[v]:\n            dist[v] = dist[u] + w\n            ch = True\n    if not ch:\n        break\nif ch:\n    print('NEGATIVE CYCLE')\nelse:\n    dist = [INF]*(n+1)\n    dist[1] = 0\n    for _ in range(n - 1):\n        up = False\n        for u, v, w in e:\n            if dist[u] + w < dist[v]:\n                dist[v] = dist[u] + w\n                up = True\n        if not up:\n            break\n    print(*[-1 if x == INF else x for x in dist[1:]])\n",
  },
];
