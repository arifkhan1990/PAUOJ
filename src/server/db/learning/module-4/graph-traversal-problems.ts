import type { SeedProblem } from "../../seed-problems";
import { newlineOutput, spaceOutput } from "../generated-tests";

export const GRAPH_TRAVERSAL_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m4-graph-traversal-g1",
    title: "Shuttle Bus Distances",
    statement: `প্রাইমএশিয়া ক্যাম্পাসের শাটল বাস এখন রুট ঠিক করছে রফি। ক্যাম্পাসে \`n\`টি বিল্ডিং আর \`m\`টি করিডোর আছে; প্রতিটি করিডোর দুইটি বিল্ডিং জোড়া দেয় এবং পার হতে ঠিক ১ মিনিট লাগে, প্রশাসন ভবন হলো বিল্ডিং ১।
তুমি বলো ১ নম্বর বিল্ডিং থেকে প্রতিটি বিল্ডিংয়ে পৌঁছাতে কত মিনিট লাগবে; কোনোটায় যাওয়াই না গেলে তার জন্য \`-1\` লিখো।`,
    inputFormat: `প্রথম লাইনে \`n m\`, পরের \`m\` লাইনে প্রতিটিতে \`u v\` — আনডিরেক্টেড করিডোর।`,
    outputFormat: `এক লাইনে \`n\` সংখ্যা: বিল্ডিং \`1\` থেকে \`1, 2, ..., n\` পর্যন্ত দূরত্ব, স্পেস দিয়ে আলাদা।`,
    constraints: `\`1 <= n <= 100000\`, \`0 <= m <= 200000\`
কোনো self-loop নেই; একইজোড়া করিডোর একাধিকবার দেওয়া থাকতে পারে।`,
    editorial: `## ধারণা
সব করিডোরের সময় ১ হলে দূরত্ব মানে সবচেয়ে কম ধাপ — ঠিক তাই BFS লাগে; যে বিল্ডিং প্রথমবার queue থেকে বের হয়, তখনই তার দূরত্ব সবচেয়ে ছোট হয়।

## ধাপে ধাপে
1. \`n\`, \`m\` পড়ে \`adj\` adjacency list বানাও; প্রতিটি করিডোর দুই দিকেই যোগ করো।
2. \`dist\` অ্যারে \`n + 1\` সাইজের, সব \`-1\`; \`dist[1] = 0\` বসিয়ে \`1\` queue-তে দাও।
3. queue খালি না হওয়া পর্যন্ত সামনের \`u\` বের করো; \`dist[v] == -1\` হলে \`dist[v] = dist[u] + 1\` করে \`v\` queue-তে দাও।
4. \`dist[1..n]\` স্পেস দিয়ে ছাপাও — \`-1\` থাকলে সেটাই অপ্রাপ্য বিল্ডিং।

\`\`\`python
import sys; from collections import deque
d = list(map(int, sys.stdin.read().split()))
n, m = d[0], d[1]; adj = [[] for _ in range(n + 1)]
for i in range(m):
    u, v = d[2+2*i], d[3+2*i]
    adj[u].append(v); adj[v].append(u)
dist = [-1]*(n+1); dist[1] = 0; q = deque([1])
while q:
    u = q.popleft()
    for v in adj[u]:
        if dist[v] == -1:
            dist[v] = dist[u]+1; q.append(v)
print(*dist[1:])
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n + m)\`, মেমোরি \`O(n + m)\` — প্রতিটি edge সর্বোচ্চ দুইবার দেখা হয়।

## সাধারণ ভুল
- আনডিরেক্টেড edge শুধু এক দিকে যোগ করলে ঘোরা অসম্পূর্ণ হয় এবং ভুল দূরত্ব আসে।
- \`dist\` সাইজ \`n\` করলে \`dist[n]\` পড়তে গিয়ে ইনডেক্স এরর হয় — ১-ইনডেক্সড ইনপুটে \`n + 1\` লাগবে।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "BFS", "Shortest Path"],
    tests: [
      { input: "5 4\n1 2\n2 3\n1 4\n4 5\n", expectedOutput: "0 1 2 1 2\n", isSample: true },
      { input: "1 0\n", expectedOutput: "0\n", isSample: true },
      { input: "6 3\n1 2\n2 3\n4 5\n", expectedOutput: "0 1 2 -1 -1 -1\n", isSample: false },
      { input: "4 5\n1 2\n1 2\n2 3\n3 4\n1 4\n", expectedOutput: "0 1 2 1\n", isSample: false },
      { input: "7 0\n", expectedOutput: "0 -1 -1 -1 -1 -1 -1\n", isSample: false },
      { input: `100000 99999\n${Array.from({ length: 99999 }, (_, i) => `${i + 1} ${i + 2}`).join("\n")}\n`, expectedOutput: spaceOutput(Array.from({ length: 100000 }, (_, i) => i)), isSample: false },
    ],
    referencePython: "import sys\nfrom collections import deque\ndata = list(map(int, sys.stdin.read().split()))\nn, m = data[0], data[1]\nadj = [[] for _ in range(n + 1)]\nfor i in range(m):\n    u, v = data[2 + 2 * i], data[3 + 2 * i]\n    adj[u].append(v)\n    adj[v].append(u)\ndist = [-1] * (n + 1)\ndist[1] = 0\nq = deque([1])\nwhile q:\n    u = q.popleft()\n    for v in adj[u]:\n        if dist[v] == -1:\n            dist[v] = dist[u] + 1\n            q.append(v)\nprint(*dist[1:])\n",
  },
  {
    slug: "learn-m4-graph-traversal-g2",
    title: "Count Hostel Blocks",
    statement: `হোস্টেলের ম্যাপ দেখে নুসরাত বুঝতে চায় কয়টা আলাদা ব্লক আছে — যে রুমগুলো করিডোর দিয়ে একে অপরের সাথে যুক্ত, তারা একটাই ব্লক, বাকিগুলো আলাদা।
\`n\`টি রুম (১ থেকে \`n\`) আর \`m\`টি দ্বিমুখী করিডোর দেওয়া আছে। বলো মোট কয়টা আলাদা ব্লক (connected component) আছে।`,
    inputFormat: `প্রথম লাইনে \`n m\`, পরের \`m\` লাইনে প্রতিটিতে \`u v\`।`,
    outputFormat: `এক লাইনে একটা পূর্ণসংখ্যা — কম্পোনেন্ট সংখ্যা।`,
    constraints: `\`1 <= n <= 100000\`, \`0 <= m <= 200000\`; কোনো self-loop নেই।`,
    editorial: `## ধারণা
একটা নোড থেকে BFS চালালে ঠিক যে যে নোডে যাওয়া যায় — সেগুলোই একটা কম্পোনেন্ট। কাজ: যতক্ষণ unvisited নোড আছে, একটা করে বের করে সেখান থেকে BFS চালাও, প্রতিবার কাউন্ট এক বাড়াও।

## ধাপে ধাপে
1. adjacency list বানাও (প্রতিটি edge দুই দিকে), \`seen\` অ্যারে \`False\` দিয়ে শুরু করো।
2. \`components = 0\`; \`i = 1\` থেকে \`n\`: \`seen[i]\` না হলে কাউন্ট এক বাড়িয়ে \`i\` থেকে BFS চালাও।
3. BFS-তে প্রতিটি পাশের unvisited নোড \`seen\` করে queue-তে দাও।
4. লুপ শেষে \`components\` ছাপাও।

\`\`\`python
import sys; from collections import deque
d = list(map(int, sys.stdin.read().split()))
n, m = d[0], d[1]; adj = [[] for _ in range(n + 1)]
for i in range(m):
    u, v = d[2+2*i], d[3+2*i]
    adj[u].append(v); adj[v].append(u)
seen = [False]*(n+1); ans = 0
for s in range(1, n+1):
    if not seen[s]:
        ans += 1; seen[s] = True; q = deque([s])
        while q:
            u = q.popleft()
            for v in adj[u]:
                if not seen[v]: seen[v] = True; q.append(v)
print(ans)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n + m)\`, মেমোরি \`O(n + m)\` — প্রতিটি নোড ও edge একবারই দেখা হয়।

## সাধারণ ভুল
- শুধু নোড ১ থেকে BFS চালিয়ে "১টাই কম্পোনেন্ট" ভাবা — আলাদা থাকা অংশ বাদ পড়ে।
- \`m = 0\` হলে প্রতিটি নোডই আলাদা, উত্তর \`n\` — বিশেষ কেসটা যাচাই করো।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "DFS", "Connected Components"],
    tests: [
      { input: "5 3\n1 2\n2 3\n4 5\n", expectedOutput: "2\n", isSample: true },
      { input: "1 0\n", expectedOutput: "1\n", isSample: true },
      { input: "6 0\n", expectedOutput: "6\n", isSample: false },
      { input: "6 3\n1 2\n3 4\n5 6\n", expectedOutput: "3\n", isSample: false },
      { input: "4 3\n1 2\n2 3\n3 4\n", expectedOutput: "1\n", isSample: false },
      { input: `100000 99999\n${Array.from({ length: 99999 }, (_, i) => `${i + 1} ${i + 2}`).join("\n")}\n`, expectedOutput: "1\n", isSample: false },
    ],
    referencePython: "import sys\nfrom collections import deque\ndata = list(map(int, sys.stdin.read().split()))\nn, m = data[0], data[1]\nadj = [[] for _ in range(n + 1)]\nfor i in range(m):\n    u, v = data[2 + 2 * i], data[3 + 2 * i]\n    adj[u].append(v)\n    adj[v].append(u)\nseen = [False] * (n + 1)\ncomponents = 0\nfor start in range(1, n + 1):\n    if not seen[start]:\n        components += 1\n        seen[start] = True\n        q = deque([start])\n        while q:\n            u = q.popleft()\n            for v in adj[u]:\n                if not seen[v]:\n                    seen[v] = True\n                    q.append(v)\nprint(components)\n",
  },
  {
    slug: "learn-m4-graph-traversal-e1",
    title: "Dorm Wi-Fi Degrees",
    statement: `সাদিয়া হোস্টেলের ওয়াই-ফাই ম্যাপে দেখছে প্রতিটি রুম থেকে কয়টা করিডোর বের হয়েছে — যত বেশি করিডোর, তত বেশি লোক সেই রুম ব্যবহার করবে।
\`n\`টি রুম আর \`m\`টি দ্বিমুখী করিডোর দেওয়া আছে। প্রতিটি রুমের ডিগ্রি (সেটি ছুঁয়ে যাওয়া করিডোরের সংখ্যা) বের করে ছাপাও; একই করিডোর একাধিকবার থাকলে প্রতিটিই গোনা হবে।`,
    inputFormat: `প্রথম লাইনে \`n m\`, পরের \`m\` লাইনে প্রতিটিতে \`u v\`।`,
    outputFormat: `এক লাইনে \`n\` সংখ্যা: রুম \`1\` থেকে \`n\` পর্যন্ত ডিগ্রি, স্পেস দিয়ে আলাদা।`,
    constraints: `\`1 <= n <= 100000\`, \`0 <= m <= 200000\`; কোনো self-loop নেই।`,
    editorial: `## ধারণা
ডিগ্রি মানে adjacency list-এর দৈর্ঘ্য। প্রতিটি \`u v\` পড়ার সময় \`deg[u]\` আর \`deg[v]\` — দুটোই এক বাড়ে; লুপ শেষে \`deg[1..n]\`ই উত্তর।

## ধাপে ধাপে
1. \`deg\` অ্যারে \`n + 1\` সাইজের, সব \`0\`।
2. প্রতিটি \`u v\`-এর জন্য \`deg[u] += 1\` এবং \`deg[v] += 1\`।
3. \`deg[1..n]\` স্পেস দিয়ে এক লাইনে ছাপাও।

\`\`\`python
import sys
d = list(map(int, sys.stdin.read().split()))
n, m = d[0], d[1]
deg = [0]*(n+1)
for i in range(m):
    u, v = d[2+2*i], d[3+2*i]
    deg[u] += 1; deg[v] += 1
print(*deg[1:])
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n + m)\`, মেমোরি \`O(n)\`।

## সাধারণ ভুল
- ডুপ্লিকেট করিডোর প্রতিটি ইনপুট লাইন হিসেবে আলাদা করে যোগ করতে হবে — একবার গোনা হলে ভুল।
- \`deg\` সাইজ \`n\` করলে শেষ রুমের ডিগ্রি যোগ করার জায়গায় ইনডেক্স এরর হয়।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Degree", "Implementation"],
    tests: [
      { input: "4 3\n1 2\n2 3\n3 4\n", expectedOutput: "1 2 2 1\n", isSample: true },
      { input: "1 0\n", expectedOutput: "0\n", isSample: true },
      { input: "3 3\n1 2\n1 2\n1 3\n", expectedOutput: "3 2 1\n", isSample: false },
      { input: "2 1\n1 2\n", expectedOutput: "1 1\n", isSample: false },
      { input: "100000 0\n", expectedOutput: spaceOutput(Array(100000).fill(0)), isSample: false },
      { input: `100000 99999\n${Array.from({ length: 99999 }, (_, i) => `1 ${i + 2}`).join("\n")}\n`, expectedOutput: spaceOutput([99999, ...Array(99999).fill(1)]), isSample: false },
    ],
    referencePython: "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, m = data[0], data[1]\ndeg = [0] * (n + 1)\nfor i in range(m):\n    u, v = data[2 + 2 * i], data[3 + 2 * i]\n    deg[u] += 1\n    deg[v] += 1\nprint(*deg[1:])\n",
  },
  {
    slug: "learn-m4-graph-traversal-m1",
    title: "Two-Group Seating Check",
    statement: `প্রাইমএশিয়া কোডিং ক্লাবের আনুষ্ঠানিকতায় তানভির সদস্যদের দুইটা দলে ভাগ করবে; নিয়ম: বন্ধু দুজন সবসময় আলাদা দলে থাকবে, একই দলে থাকলে পাশাপাশি বসতে পারবে না। প্রতিটি বন্ধুত্ব একটা আনডিরেক্টেড edge।
বলো এভাবে দুই দলে ভাগ করা সম্ভব কি না; প্রতিটি সদস্যকে ঠিক একটা দলে দিতে হবে, দল দুটো খালি থাকতে পারে।`,
    inputFormat: `প্রথম লাইনে \`n m\`, পরের \`m\` লাইনে প্রতিটিতে \`u v\` — সদস্য \`u\` আর \`v\` বন্ধু।`,
    outputFormat: `সম্ভব হলে \`YES\`, না হলে \`NO\`।`,
    constraints: `\`1 <= n <= 100000\`, \`0 <= m <= 200000\`; কোনো self-loop নেই।`,
    editorial: `## ধারণা
এটাই bipartite check: প্রতিটি সদস্যকে ০ বা ১ রঙ দিতে হবে যেন প্রতিটি edge ভিন্ন রঙের দুই প্রান্ত জোড়া দেয়। BFS-তে পাশের নোডকে উল্টো রঙ দিলেই হয়; একই রঙের দুই পাশের নোড মিললে সেখানে odd-length সাইকেল আছে বলে উত্তর \`NO\`।

## ধাপে ধাপে
1. adjacency list বানাও, \`color\` অ্যারে \`-1\` (রঙহীন) দিয়ে শুরু করো।
2. প্রতিটি unvisited নোড থেকে BFS চালাও; শুরুর নোডের রঙ \`0\`।
3. \`u\`-এর রঙ \`c\` হলে পাশের \`v\`-এর রঙ \`1 - c\`; \`v\` আগেই রঙ পেয়ে এবং রঙ মেলে না হলে \`NO\` ছাপাও।
4. কোনো পার্থক্য না পেলে \`YES\`।

\`\`\`python
import sys; from collections import deque
d = list(map(int, sys.stdin.read().split()))
n, m = d[0], d[1]; adj = [[] for _ in range(n + 1)]
for i in range(m):
    u, v = d[2+2*i], d[3+2*i]
    adj[u].append(v); adj[v].append(u)
color = [-1]*(n+1)
for s in range(1, n+1):
    if color[s] == -1:
        color[s] = 0; q = deque([s])
        while q:
            u = q.popleft()
            for v in adj[u]:
                if color[v] == -1: color[v] = 1 - color[u]; q.append(v)
                elif color[v] == color[u]: print("NO"); sys.exit()
print("YES")
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n + m)\`, মেমোরি \`O(n + m)\`।

## সাধারণ ভুল
- শুধু নোড ১ থেকে রঙ দিলে আলাদা কম্পোনেন্ট অরঙ্গ থাকে যায় — প্রতিটি unvisited নোড থেকে শুরু করো।
- edge সংখ্যা \`n - 1\` দেখে সিদ্ধান্ত নেওয়া — ভুল; ঘন গ্রাফও bipartite হতে পারে, সাইকেলের দৈর্ঘ্যই মূল কথা।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Bipartite", "BFS"],
    tests: [
      { input: "4 4\n1 2\n2 3\n3 4\n4 1\n", expectedOutput: "YES\n", isSample: true },
      { input: "3 3\n1 2\n2 3\n3 1\n", expectedOutput: "NO\n", isSample: true },
      { input: "1 0\n", expectedOutput: "YES\n", isSample: false },
      { input: "6 4\n1 2\n2 3\n3 1\n5 6\n", expectedOutput: "NO\n", isSample: false },
      { input: "7 4\n1 2\n2 3\n3 4\n5 6\n", expectedOutput: "YES\n", isSample: false },
      { input: `100000 99999\n${Array.from({ length: 99999 }, (_, i) => `${i + 1} ${i + 2}`).join("\n")}\n`, expectedOutput: "YES\n", isSample: false },
    ],
    referencePython: "import sys\nfrom collections import deque\ndata = list(map(int, sys.stdin.read().split()))\nn, m = data[0], data[1]\nadj = [[] for _ in range(n + 1)]\nfor i in range(m):\n    u, v = data[2 + 2 * i], data[3 + 2 * i]\n    adj[u].append(v)\n    adj[v].append(u)\ncolor = [-1] * (n + 1)\nfor start in range(1, n + 1):\n    if color[start] != -1:\n        continue\n    color[start] = 0\n    q = deque([start])\n    while q:\n        u = q.popleft()\n        for v in adj[u]:\n            if color[v] == -1:\n                color[v] = 1 - color[u]\n                q.append(v)\n            elif color[v] == color[u]:\n                print('NO')\n                sys.exit()\nprint('YES')\n",
  },
  {
    slug: "learn-m4-graph-traversal-h1",
    title: "Longest Prerequisite Chain",
    statement: `তানভির সিলেবাস প্ল্যানারে দেখছে কোন কোর্সগুলো একটার পর একটা ধরে নেওয়া যায়। কোর্স \`u\` শেষ না করে \`v\` নেওয়া যায় না — এটা একটা একমুখী নিয়ম। সব নিয়ম মিলিয়ে সবচেয়ে লম্বা এমন কোর্সের ধারা খুঁজো, যেখানে প্রতিটি কোর্স আগেরটির পর নেওয়া যায়।
\`n\`টি কোর্স (১ থেকে \`n\`) আর \`m\`টি নিয়ম দেওয়া আছে; প্রতিটি ধাপে একটা কোর্স ধরা হয়, কোর্স বারবার নেওয়া যায় না। দেওয়া নিয়মগুলো নিশ্চয়ই সাইকেলবিহীন (DAG)।`,
    inputFormat: `প্রথম লাইনে \`n m\`, পরের \`m\` লাইনে প্রতিটিতে \`u v\` — \`u\` শেষ করলেই \`v\` নেওয়া যায়।`,
    outputFormat: `এক লাইনে সবচেয়ে লম্বা ধারার দৈর্ঘ্য (কোর্স সংখ্যা)।`,
    constraints: `\`1 <= n <= 100000\`, \`0 <= m <= 200000\`
নিয়মগুলোতে কোনো সাইকেল নেই (DAG)।`,
    editorial: `## ধারণা
সাইকেল নেই মানে topological order আছে — যে কোর্সের সব শর্ত আগে শেষ, সেটা আগে বসে। ধারার দৈর্ঘ্য বের করা যায় DP দিয়ে: \`dp[v]\` = \`v\` পর্যন্ত সবচেয়ে লম্বা ধারা; \`v\`-এর প্রতিটি শর্ত \`u\` থেকে এসেছে বলে \`dp[v] = max(dp[v], dp[u] + 1)\`। Kahn-এর ধাপে যেকোনো নোডের সব শর্ত বাদ পড়ার পরই সেটা queue-তে যায়, তাই তখন \`dp[u]\` চূড়ান্ত থাকে।

## ধাপে ধাপে
1. adjacency list \`g\` আর in-degree \`deg\` বানাও; \`dp\` সব \`1\` (নিজে দিয়ে একটা কোর্স)।
2. \`deg == 0\` সব নোড দিয়ে queue শুরু করো।
3. \`u\` বের করে প্রতিটি \`v\`-এ \`dp[v] = max(dp[v], dp[u] + 1)\` করো, \`deg[v]\` এক কমাও, শূন্য হলে queue-তে দাও।
4. শেষে \`max(dp)\` ছাপাও।

\`\`\`python
import sys; from collections import deque
d = list(map(int, sys.stdin.read().split()))
n, m = d[0], d[1]; g = [[] for _ in range(n+1)]; deg = [0]*(n+1)
for i in range(m):
    u, v = d[2+2*i], d[3+2*i]
    g[u].append(v); deg[v] += 1
q = deque(i for i in range(1, n+1) if deg[i] == 0); dp = [1]*(n+1)
while q:
    u = q.popleft()
    for v in g[u]:
        if dp[u]+1 > dp[v]: dp[v] = dp[u]+1
        deg[v] -= 1
        if deg[v] == 0: q.append(v)
print(max(dp[1:]))
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n + m)\`, মেমোরি \`O(n + m)\` — প্রতিটি নোড ও edge একবারই দেখা হয়।

## সাধারণ ভুল
- BFS-এর মতো \`dist\` আপডেটের আগে \`dp[u]\` চূড়ান্ত না হলে ভুল হয় — topological order মানেই এটা নিশ্চিত করা।
- \`m = 0\` হলে উত্তর \`1\` (যেকোনো একটা কোর্স), শূন্য নয়।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Topological Sort", "DP"],
    tests: [
      { input: "4 4\n1 2\n2 3\n1 3\n3 4\n", expectedOutput: "4\n", isSample: true },
      { input: "1 0\n", expectedOutput: "1\n", isSample: true },
      { input: "5 0\n", expectedOutput: "1\n", isSample: false },
      { input: "3 2\n1 2\n2 3\n", expectedOutput: "3\n", isSample: false },
      { input: "6 4\n1 2\n1 3\n4 5\n4 6\n", expectedOutput: "2\n", isSample: false },
      { input: `100000 99999\n${Array.from({ length: 99999 }, (_, i) => `${i + 1} ${i + 2}`).join("\n")}\n`, expectedOutput: "100000\n", isSample: false },
    ],
    referencePython: "import sys\nfrom collections import deque\ndata = list(map(int, sys.stdin.read().split()))\nn, m = data[0], data[1]\ng = [[] for _ in range(n + 1)]\ndeg = [0] * (n + 1)\nfor i in range(m):\n    u, v = data[2 + 2 * i], data[3 + 2 * i]\n    g[u].append(v)\n    deg[v] += 1\nq = deque(i for i in range(1, n + 1) if deg[i] == 0)\ndp = [1] * (n + 1)\nwhile q:\n    u = q.popleft()\n    for v in g[u]:\n        if dp[u] + 1 > dp[v]:\n            dp[v] = dp[u] + 1\n        deg[v] -= 1\n        if deg[v] == 0:\n            q.append(v)\nprint(max(dp[1:]))\n",
  },
  {
    slug: "learn-m4-graph-traversal-x1",
    title: "Friend Circle Queries",
    statement: `রফির ছোট্ট অ্যাপে বন্ধুদের একে অপরের সাথে যোগাযোগ আছে কি না জিজ্ঞেস করা হয়; যদি \`a\` আর \`b\` একই বন্ধুচক্রে থাকে (মাঝে যত ধাপই হোক বন্ধুত্বের), তাহলে \`YES\`, না হলে \`NO\`।
প্রথমে \`n\` জন সদস্য আর \`m\` জোড়া বন্ধুত্ব দেওয়া থাকে, তারপর \`q\`টি প্রশ্ন — প্রতিটিতে \`a b\`।`,
    inputFormat: `প্রথম লাইনে \`n m q\`; পরের \`m\` লাইনে বন্ধুত্ব \`u v\`; এরপরের \`q\` লাইনে প্রশ্ন \`a b\`।`,
    outputFormat: `প্রতিটি প্রশ্নের উত্তর এক করে লাইনে — \`YES\` বা \`NO\`।`,
    constraints: `\`1 <= n <= 100000\`, \`0 <= m <= 100000\`, \`1 <= q <= 100000\`
সদস্য নিজে নিজের সাথেও একই চক্রে (উত্তর \`YES\`)।`,
    editorial: `## ধারণা
প্রশ্ন আগে থেকে জানা না হলেও সবচেয়ে সহজ উপায় একবার DFS/BFS করে প্রতিটি নোডের কম্পোনেন্ট আইডি বসিয়ে দেওয়া। তারপর প্রতিটি প্রশ্নে শুধু \`comp[a] == comp[b]\` — \`O(1)\` প্রতি প্রশ্ন। প্রশ্ন সরাসরি জানা হলে DSU-ও একই কাজ করে।

## ধাপে ধাপে
1. \`n\`, \`m\`, \`q\` পড়ে adjacency list বানাও।
2. প্রতিটি unvisited নোড থেকে BFS চালিয়ে সেই কম্পোনেন্টের সব নোডে \`comp\` নম্বর বসাও।
3. edges-এর পর ঠিক \`2 * m\` সংখ্যক মান এড়িয়ে প্রতিটি প্রশ্নে \`comp[a] == comp[b]\` যাচাই করে \`YES\`/\`NO\` সংগ্রহ করো।
4. সব উত্তর এক এক লাইনে ছাপাও।

\`\`\`python
import sys; from collections import deque
d = list(map(int, sys.stdin.read().split()))
n, m, q = d[0], d[1], d[2]; adj = [[] for _ in range(n+1)]
for i in range(m):
    u, v = d[3+2*i], d[4+2*i]
    adj[u].append(v); adj[v].append(u)
comp = [0]*(n+1); cid = 0
for s in range(1, n+1):
    if comp[s] == 0:
        cid += 1; comp[s] = cid; dq = deque([s])
        while dq:
            u = dq.popleft()
            for v in adj[u]:
                if comp[v] == 0: comp[v] = cid; dq.append(v)
out = []; base = 3 + 2*m
for i in range(q):
    out.append("YES" if comp[d[base+2*i]] == comp[d[base+2*i+1]] else "NO")
print("\\n".join(out))
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n + m + q)\`, মেমোরি \`O(n + m)\`।

## সাধারণ ভুল
- প্রতিটি প্রশ্নে আলাদা BFS চালালে \`O(q * (n + m))\` — বড় ইনপুটে TLE; আগেই কম্পোনেন্ট দাগাও।
- প্রশ্নের অফসেট ভুল হলে edges-এর শেষ মান প্রশ্ন হিসেবে ধরা যায় — \`base = 3 + 2 * m\` মনে রেখো।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Connected Components", "Queries"],
    tests: [
      { input: "5 3 3\n1 2\n2 3\n4 5\n1 3\n1 4\n4 5\n", expectedOutput: "YES\nNO\nYES\n", isSample: true },
      { input: "1 0 1\n1 1\n", expectedOutput: "YES\n", isSample: true },
      { input: "7 3 4\n1 2\n3 4\n5 6\n1 3\n2 4\n5 7\n6 6\n", expectedOutput: "NO\nNO\nNO\nYES\n", isSample: false },
      { input: `100000 99999 100000\n${Array.from({ length: 99999 }, (_, i) => `${i + 1} ${i + 2}`).join("\n")}\n${Array.from({ length: 100000 }, (_, i) => `${i + 1} ${100000 - i}`).join("\n")}\n`, expectedOutput: newlineOutput(Array(100000).fill("YES")), isSample: false },
      { input: `100000 0 100000\n${Array.from({ length: 100000 }, (_, i) => `${i + 1} ${(i + 1) % 100000 + 1}`).join("\n")}\n`, expectedOutput: newlineOutput(Array(100000).fill("NO")), isSample: false },
    ],
    referencePython: "import sys\nfrom collections import deque\ndata = list(map(int, sys.stdin.read().split()))\nn, m, q = data[0], data[1], data[2]\nadj = [[] for _ in range(n + 1)]\nfor i in range(m):\n    u, v = data[3 + 2 * i], data[4 + 2 * i]\n    adj[u].append(v)\n    adj[v].append(u)\ncomp = [0] * (n + 1)\ncid = 0\nfor s in range(1, n + 1):\n    if comp[s]:\n        continue\n    cid += 1\n    comp[s] = cid\n    dq = deque([s])\n    while dq:\n        u = dq.popleft()\n        for v in adj[u]:\n            if not comp[v]:\n                comp[v] = cid\n                dq.append(v)\nout = []\nbase = 3 + 2 * m\nfor i in range(q):\n    a, b = data[base + 2 * i], data[base + 2 * i + 1]\n    out.append('YES' if comp[a] == comp[b] else 'NO')\nprint('\\n'.join(out))\n",
  },
  {
    slug: "learn-m4-graph-traversal-x2",
    title: "Library Room Scan",
    statement: `লাইব্রেরির নতুন তলার ম্যাপ সাদিয়া স্ক্যান করছে। ম্যাপে \`h\` লাইন, প্রতি লাইনে \`w\` অক্ষর: \`.\` মানে খোলা ঘর, \`#\` মানে দেয়াল; ঘরগুলো উপর-নিচ-বাম-ডান (৪ দিক) ছুঁয়ে যাওয়া যায়, কর্ণ দিয়ে নয়। সংলগ্ন সব ঘর মিলে একটাই রুম।
বলো মোট কয়টা রুম আছে এবং সবচেয়ে বড় রুমটিতে কয়টা ঘর আছে; কোনো ঘর না থাকলে দুটোই \`0\`।`,
    inputFormat: `প্রথম লাইনে \`h w\`, পরের \`h\` লাইনে প্রতিটিতে \`w\` অক্ষর (\`.\` বা \`#\`)।`,
    outputFormat: `এক লাইনে দুটি সংখ্যা: রুম সংখ্যা আর সবচেয়ে বড় রুমের ঘর সংখ্যা।`,
    constraints: `\`1 <= h, w <= 1000\`, \`h * w <= 10^6\``,
    editorial: `## ধারণা
এটাই grid-এর BFS flood fill: প্রতিটি \`.\` সেল থেকে শুরু করে ৪ দিকে যত \`.\` যাওয়া যায় সব মিলিয়ে একটা রুম। ভিজিট করা সেল আবার না ঘুরে কাজটা \`O(h * w)\` সময়ে শেষ হয়।

## ধাপে ধাপে
1. গ্রিড \`rows\` লিস্টে পড়ে রাখো, \`seen\` অ্যারে \`h x w\` \`False\` দিয়ে শুরু করো।
2. প্রতিটি সেল ঘুরে: \`.\` এবং \`seen\` না হলে \`rooms += 1\`, সেখান থেকে BFS চালাও, সাইজ গোনো।
3. পাশের সেলের শর্ত তিনটা একসাথে: গ্রিডের ভিতরে, \`.\`, আর এখনো \`seen\` নয় — তাহলেই queue-তে দাও।
4. প্রতিটি রুমের সাইজ মেপে \`rooms\` আর \`largest\` ছাপাও।

\`\`\`python
import sys; from collections import deque
it = iter(sys.stdin.read().split())
h, w = int(next(it)), int(next(it))
rows = [next(it) for _ in range(h)]
seen = [[False]*w for _ in range(h)]; rooms = largest = 0
for r in range(h):
    for c in range(w):
        if rows[r][c] == "." and not seen[r][c]:
            rooms += 1; size = 0; seen[r][c] = True; q = deque([(r, c)])
            while q:
                cr, cc = q.popleft(); size += 1
                for nr, nc in ((cr-1, cc), (cr+1, cc), (cr, cc-1), (cr, cc+1)):
                    if 0 <= nr < h and 0 <= nc < w and rows[nr][nc] == "." and not seen[nr][nc]:
                        seen[nr][nc] = True; q.append((nr, nc))
            largest = max(largest, size)
print(rooms, largest)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(h * w)\`, মেমোরি \`O(h * w)\` — প্রতিটি সেল একবারই ভিজিট হয়।

## সাধারণ ভুল
- কর্ণ (তির্যক) দিয়ে যোগ করলে রুম কম মনে হয় — শুধু চার দিক যাচাই করো।
- \`seen\` ঘরের ভিতরে না রেখে ভিজিট করার সময় যোগ করলে একই সেল বারবার queue-তে ঢোকে এবং সময় নষ্ট হয়।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Grid", "BFS"],
    tests: [
      { input: "4 4\n....\n....\n####\n....\n", expectedOutput: "2 8\n", isSample: true },
      { input: "2 2\n..\n##\n", expectedOutput: "1 2\n", isSample: true },
      { input: "1 1\n#\n", expectedOutput: "0 0\n", isSample: false },
      { input: "3 3\n...\n...\n...\n", expectedOutput: "1 9\n", isSample: false },
      { input: "4 4\n.#.#\n#.#.\n.#.#\n#.#.\n", expectedOutput: "8 1\n", isSample: false },
      { input: `1000 1000\n${Array.from({ length: 1000 }, () => ".".repeat(1000)).join("\n")}\n`, expectedOutput: "1 1000000\n", isSample: false },
      { input: `1000 1000\n${Array.from({ length: 1000 }, () => "#".repeat(1000)).join("\n")}\n`, expectedOutput: "0 0\n", isSample: false },
    ],
    referencePython: "import sys\nfrom collections import deque\nit = iter(sys.stdin.read().split())\nh, w = int(next(it)), int(next(it))\nrows = [next(it) for _ in range(h)]\nseen = [[False] * w for _ in range(h)]\nrooms = largest = 0\nfor r in range(h):\n    for c in range(w):\n        if rows[r][c] == '.' and not seen[r][c]:\n            rooms += 1\n            size = 0\n            seen[r][c] = True\n            q = deque([(r, c)])\n            while q:\n                cr, cc = q.popleft()\n                size += 1\n                for nr, nc in ((cr - 1, cc), (cr + 1, cc), (cr, cc - 1), (cr, cc + 1)):\n                    if 0 <= nr < h and 0 <= nc < w and rows[nr][nc] == '.' and not seen[nr][nc]:\n                        seen[nr][nc] = True\n                        q.append((nr, nc))\n            largest = max(largest, size)\nprint(rooms, largest)\n",
  },
];
