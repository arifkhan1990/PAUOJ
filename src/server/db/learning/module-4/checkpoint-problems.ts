import type { SeedProblem } from "../../seed-problems";

export const MODULE4_CHECKPOINT_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m4-checkpoint-1",
    title: "Messenger Reach Count",
    statement: `নুসরাতের ক্যাম্পাস মেসেঞ্জারে মেসেজ একদিকেই যায়: \`u\` থেকে \`v\` পাঠানো যায় মানে ঠিক সেটুকুই জানা। তার নিজের অ্যাকাউন্ট \`s\`; সে যদি একটা মেসেজ ছাড়ে, কোন কোন অ্যাকাউন্টে সেটা পৌঁছাবে?
\`n\`টি অ্যাকাউন্ট আর \`m\`টি একমুখী লিংক দেওয়া আছে। বলো \`s\` থেকে যে যে অ্যাকাউন্টে (নিজেসহ) মেসেজ পৌঁছায় — মোট কয়টা।`,
    inputFormat: `প্রথম লাইনে \`n m s\`, পরের \`m\` লাইনে প্রতিটিতে \`u v\` — \`u\` থেকে \`v\` একমুখী লিংক।`,
    outputFormat: `এক লাইনে একটা পূর্ণসংখ্যা — পৌঁছানো যায় এমন অ্যাকাউন্ট সংখ্যা।`,
    constraints: `\`1 <= n <= 100000\`, \`0 <= m <= 200000\`, \`1 <= s <= n\``,
    editorial: `## ধারণা
এটাই directed BFS: \`s\` থেকে শুরু করে যে যে নোডে দিক মেনে যাওয়া যায়, তারা সবই পৌঁছানো যায়। ভিজিট করা নোড আবার queue-তে না দিয়ে প্রতিটি নোড একবারই যায়, তাই কাউন্টটাই উত্তর।

## ধাপে ধাপে
1. \`n\`, \`m\`, \`s\` পড়ে directed adjacency list বানাও — শুধু \`g[u].append(v)\`।
2. \`seen\` অ্যারে \`False\`, \`seen[s] = True\`, \`count = 1\`, queue-তে \`s\`।
3. queue থেকে \`u\` বের করে প্রতিটি \`v\`-এর \`seen[v]\` না হলে \`seen[v] = True\`, \`count += 1\`, queue-তে দাও।
4. \`count\` ছাপাও — শুরুর নোডটাও ধরা হয়েছে।

\`\`\`python
import sys; from collections import deque
d = list(map(int, sys.stdin.read().split()))
n, m, s = d[0], d[1], d[2]
g = [[] for _ in range(n + 1)]
for i in range(m):
    u, v = d[3+2*i], d[4+2*i]
    g[u].append(v)
seen = [False]*(n+1); seen[s] = True; count = 1; q = deque([s])
while q:
    u = q.popleft()
    for v in g[u]:
        if not seen[v]: seen[v] = True; count += 1; q.append(v)
print(count)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n + m)\`, মেমোরি \`O(n + m)\`।

## সাধারণ ভুল
- আনডিরেক্টেড ধরে \`g[v].append(u)\` যোগ করলে ফিরে আসা লিংকেও মেসেজ চলে যায়, কাউন্ট বেড়ে যায়।
- \`count\` শূন্য দিয়ে শুরু করলে \`s\` বাদ পড়ে — শুরুর নিজেও পৌঁছানো যায় এমন অ্যাকাউন্ট।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "BFS", "Reachability"],
    tests: [
      { input: "5 4 1\n1 2\n2 3\n1 4\n4 5\n", expectedOutput: "5\n", isSample: true },
      { input: "4 2 3\n1 2\n2 1\n", expectedOutput: "1\n", isSample: true },
      { input: "6 3 1\n1 2\n3 4\n5 6\n", expectedOutput: "2\n", isSample: false },
      { input: "1 0 1\n", expectedOutput: "1\n", isSample: false },
      { input: `100000 99999 1\n${Array.from({ length: 99999 }, (_, i) => `${i + 1} ${i + 2}`).join("\n")}\n`, expectedOutput: "100000\n", isSample: false },
      { input: "100000 0 50000\n", expectedOutput: "1\n", isSample: false },
    ],
    referencePython: "import sys\nfrom collections import deque\nd = list(map(int, sys.stdin.read().split()))\nn, m, s = d[0], d[1], d[2]\ng = [[] for _ in range(n + 1)]\nfor i in range(m):\n    u, v = d[3+2*i], d[4+2*i]\n    g[u].append(v)\nseen = [False]*(n+1)\nseen[s] = True\ncount = 1\nq = deque([s])\nwhile q:\n    u = q.popleft()\n    for v in g[u]:\n        if not seen[v]:\n            seen[v] = True\n            count += 1\n            q.append(v)\nprint(count)\n",
  },
  {
    slug: "learn-m4-checkpoint-2",
    title: "Delivery Budget Path",
    statement: `রফির ডেলিভারি বাইক হোস্টেল (\`s\`) থেকে গন্তব্য (\`t\`) যাবে — \`n\`টি জংশন, \`m\`টি দ্বিমুখী রাস্তা, প্রতিটির সময় \`w\` মিনিট। পেট্রোল বাজেট মাপা যায় শুধু সময় দিয়ে।
\`s\` থেকে \`t\` পৌঁছাতে সবচেয়ে কম সময় কত? যাওয়াই না গেলে \`-1\` ছাপাও।`,
    inputFormat: `প্রথম লাইনে \`n m s t\`, পরের \`m\` লাইনে প্রতিটিতে \`u v w\` — আনডিরেক্টেড রাস্তা।`,
    outputFormat: `এক লাইনে একটা সংখ্যা — ন্যূনতম সময় বা \`-1\`।`,
    constraints: `\`1 <= n <= 100000\`, \`0 <= m <= 200000\`, \`0 <= w <= 10^9\`; \`1 <= s, t <= n\``,
    editorial: `## ধারণা
ওজন ধনাত্মক বা শূন্য হলে Dijkstra-ই সঠিক: heap থেকে যে নোডটা বের হয়, তার দূরত্ব চূড়ান্ত। \`t\` বের হওয়ামাত্র \`break\` করা যায় — বাকি গ্রাফ ঘোরার দরকার নেই। অপ্রাপ্য হলে \`dist[t]\` থাকবে \`INF\`।

## ধাপে ধাপে
1. adjacency list বানাও (দুই দিকে), \`dist\` সব \`INF\`, \`dist[s] = 0\`, heap-এ \`(0, s)\`।
2. heap থেকে \`(du, u)\` বের করে \`du != dist[u]\` হলে বাদ দাও।
3. \`u == t\` হলে থামো; না হলে পাশেদের দূরত্ব আপডেট করে heap-এ দাও।
4. \`dist[t]\` \`INF\` হলে \`-1\`, না হলে সেটাই উত্তর।

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
সময় সর্বোচ্চ \`O((n + m) log n)\`, মেমোরি \`O(n + m)\`।

## সাধারণ ভুল
- \`s == t\` হলে উত্তর \`0\`; heap খালি হয়ে \`t\` না পেলে \`-1\` — দুই কেসই এক কোডে ঢাকা।
- ঋণাত্মক ওজন ধরে নিয়ে Dijkstra চালালে ভুল হয়; এখানে \`w >= 0\` নিশ্চিত, তাই নিরাপদ।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Dijkstra", "Shortest Path"],
    tests: [
      { input: "5 5 1 5\n1 2 3\n2 3 2\n3 4 4\n4 5 1\n1 5 20\n", expectedOutput: "10\n", isSample: true },
      { input: "3 1 1 3\n1 2 4\n", expectedOutput: "-1\n", isSample: true },
      { input: "2 1 2 1\n1 2 6\n", expectedOutput: "6\n", isSample: false },
      { input: "1 0 1 1\n", expectedOutput: "0\n", isSample: false },
      { input: "4 4 1 4\n1 2 5\n2 4 5\n1 3 1\n3 4 100\n", expectedOutput: "10\n", isSample: false },
      { input: `100000 99999 1 100000\n${Array.from({ length: 99999 }, (_, i) => `${i + 1} ${i + 2} 3`).join("\n")}\n`, expectedOutput: "299997\n", isSample: false },
    ],
    referencePython: "import sys, heapq\nd = list(map(int, sys.stdin.read().split()))\nn, m, s, t = d[0], d[1], d[2], d[3]\nadj = [[] for _ in range(n + 1)]\nfor i in range(m):\n    u, v, w = d[4+3*i], d[5+3*i], d[6+3*i]\n    adj[u].append((v, w))\n    adj[v].append((u, w))\nINF = 10**30\ndist = [INF]*(n+1)\ndist[s] = 0\nh = [(0, s)]\nwhile h:\n    du, u = heapq.heappop(h)\n    if du != dist[u]:\n        continue\n    if u == t:\n        break\n    for v, w in adj[u]:\n        if du + w < dist[v]:\n            dist[v] = du + w\n            heapq.heappush(h, (dist[v], v))\nprint(-1 if dist[t] == INF else dist[t])\n",
  },
  {
    slug: "learn-m4-checkpoint-3",
    title: "Connect the Campuses",
    statement: `প্রাইমএশিয়ার নতুন ক্যাম্পাসগুলো যোগ করতে হবে একটা নেটওয়ার্কে; \`n\`টি ক্যাম্পাস আর \`m\`টি সম্ভাব্য সংযোগ দেওয়া আছে, প্রতিটির খরচ \`w\`। একটা সংযোগ দুই ক্যাম্পাস জোড়া দেয়, আর কোনো লুপ থাকবে না।
সব ক্যাম্পাস যুক্ত রেখে মোট খরচ ন্যূনতম কত? প্রদত্ত সংযোগে অসম্ভব হলে \`-1\` ছাপাও।`,
    inputFormat: `প্রথম লাইনে \`n m\`, পরের \`m\` লাইনে প্রতিটিতে \`u v w\` — ক্যাম্পাস \`u\` ও \`v\` যুক্ত করলে খরচ \`w\`।`,
    outputFormat: `ন্যূনতম মোট খরচ, অসম্ভব হলে \`-1\`।`,
    constraints: `\`1 <= n <= 100000\`, \`0 <= m <= 200000\`, \`1 <= w <= 10^9\``,
    editorial: `## ধারণা
Kruskal + DSU: ওজন অনুযায়ী edge সাজিয়ে আলাদা দলেরগুলো যোগ করো। শেষে সব ক্যাম্পাস এক রুটে না থাকলে যুক্ত করা সম্ভব হয়নি — \`-1\`। MST-এ ঠিক \`n - 1\`টা edge লাগে, তাই একটা হলেই শেষ।

## ধাপে ধাপে
1. edge \`(w, u, v)\` করে ওজন অনুযায়ী \`sort\` করো; \`parent[i] = i\`।
2. প্রতিটি edge-এ \`find(u) != find(v)\` হলে union করে \`total += w\`, কাউন্টার এক বাড়াও।
3. কাউন্টার \`n\` হলে \`total\` ছাপিয়ে থামো; edge শেষ হয়েও না হলে \`-1\`।
4. \`n = 1\` হলে কোনো edge লাগে না — উত্তর \`0\`।

\`\`\`python
import sys
d = list(map(int, sys.stdin.read().split()))
n, m = d[0], d[1]
e = sorted((d[4+3*i], d[2+3*i], d[3+3*i]) for i in range(m))
p = list(range(n+1))
def find(x):
    while p[x] != x:
        p[x] = p[p[x]]; x = p[x]
    return x
total = 0
groups = n
for w, u, v in e:
    ru, rv = find(u), find(v)
    if ru != rv:
        p[ru] = rv; total += w; groups -= 1
        if groups == 1: break
print(total if groups == 1 else -1)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(m log m)\`, মেমোরি \`O(n + m)\`।

## সাধারণ ভুল
- \`n = 1\` বা \`m = 0\` বিশেষ কেস: একা ক্যাম্পাসে উত্তর \`0\`, আর একাধিক কিন্তু খালি হলে \`-1\`।
- edge শেষ না হওয়া পর্যন্ত \`groups\` না দেখে শুধু \`total\` ছাপালে অসম্ভব কেসে \`0\` বের হয়।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "MST", "Kruskal", "DSU"],
    tests: [
      { input: "4 3\n1 2 10\n2 3 5\n3 4 7\n", expectedOutput: "22\n", isSample: true },
      { input: "3 1\n1 2 4\n", expectedOutput: "-1\n", isSample: true },
      { input: "1 0\n", expectedOutput: "0\n", isSample: false },
      { input: "2 1\n1 2 3\n", expectedOutput: "3\n", isSample: false },
      { input: "4 4\n1 2 1\n2 3 1\n3 4 1\n1 4 100\n", expectedOutput: "3\n", isSample: false },
      { input: `100000 99999\n${Array.from({ length: 99999 }, (_, i) => `${i + 1} ${i + 2} 2`).join("\n")}\n`, expectedOutput: "199998\n", isSample: false },
      { input: "100000 0\n", expectedOutput: "-1\n", isSample: false },
    ],
    referencePython: "import sys\nd = list(map(int, sys.stdin.read().split()))\nn, m = d[0], d[1]\ne = sorted((d[4+3*i], d[2+3*i], d[3+3*i]) for i in range(m))\np = list(range(n+1))\ndef find(x):\n    while p[x] != x:\n        p[x] = p[p[x]]\n        x = p[x]\n    return x\ntotal = 0\ngroups = n\nfor w, u, v in e:\n    ru, rv = find(u), find(v)\n    if ru != rv:\n        p[ru] = rv\n        total += w\n        groups -= 1\n        if groups == 1:\n            break\nprint(total if groups == 1 else -1)\n",
  },
];
