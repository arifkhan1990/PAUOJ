import type { SeedProblem } from "../../seed-problems";
import { newlineOutput } from "../generated-tests";

export const MST_DSU_PRACTICE_PROBLEMS_PART2: SeedProblem[] = [
  {
    slug: "learn-m4-mst-dsu-m3",
    title: "Link Removals",
    statement: `নেটওয়ার্কে \`n\`টি নোড আর \`m\`টি কেবল আছে; কেবলগুলো ইনপুটের লাইন অনুযায়ী \`1\` থেকে \`m\` নম্বর পাওয়া। ঝড়ে \`q\`টি কেবল একে একে খসে পড়বে — প্রতিটি লাইনে বলা থাকবে কোন নম্বরের কেবল। প্রতিটি কেবল খসে পড়ার পরই জানতে হবে: নোড \`1\` আর নোড \`n\` কি এখনো কোনো কেবল ধরে যুক্ত আছে?

প্রতিটি খসে পড়ার পর \`YES\` বা \`NO\` এক করে লাইনে ছাপো। খসে যাওয়া কেবল আর ফেরে না।

উদাহরণ: কেবল \`1-2\`, \`2-3\`; খসে পড়ে কেবল \`2\` (\`2-3\`) — নোড \`1\` আর \`3\` তখন আলাদা: উত্তর \`NO\`।`,
    inputFormat: `প্রথম লাইনে \`n m q\`।
পরের \`m\` লাইনে প্রতিটিতে \`u v\` — কেবল \`i\` নোড \`u\` আর \`v\`-কে জোড়ে।
শেষ \`q\` লাইনে প্রতিটিতে একটি কেবল নম্বর — সেই ক্রমে খসে পড়বে।`,
    outputFormat: "প্রতিটি খসে পড়ার পর এক করে লাইনে `YES` বা `NO`।",
    constraints:
      "`2 <= n <= 100000`, `1 <= m <= 200000`, `1 <= q <= m`\nএকই জোড়ার কেবল একাধিক থাকতে পারে; প্রতিটি নম্বর একবারই খসে পড়বে।",
    editorial: `## ধারণা

কেবল খসে পড়া মানে দল ভাঙা — কিন্তু DSU জোড়া দিতে জানে, ভাঙতে জানে না। বুদ্ধিটা সময় উল্টে দেওয়া: শেষ অবস্থা থেকে শুরু করো — যে \`q\`টি কেবল খসে পড়বে সেগুলো বাদে বাকি সব কেবল দিয়ে DSU বানাও। এবার সময়ের উল্টো দিকে হাঁটো: \`t\` নম্বর খসে পড়ার পরের অবস্থা মানে "প্রথম \`t\`টি বাদে বাকি সব কেবল" — উল্টো হাঁটায় ঠিক সেই অবস্থাতেই থাকবে যখন তুমি \`t\`-তম উত্তর লিখবে। উত্তর লিখে সেই কেবলটা ফিরিয়ে আটকাও (union), তাতে এক ধাপ পেছনের (অর্থাৎ এক ধাপ আগের খসে পড়ার আগের) অবস্থায় চলে যাও। শুরুতে বাদ দেওয়া কেবলগুলো চিনতে একটা সেট লাগবে।

## ধাপে ধাপে

1. খসে পড়ার নম্বরগুলো সেটে রাখো।
2. যে কেবলগুলো কখনো খসে না সেগুলো দিয়ে DSU union করো।
3. \`t = q\` থেকে \`1\` পর্যন্ত উল্টো হাঁটো: এখনকার DSU-তে নোড \`1\` আর \`n\` একই রুটে কি না দেখে \`t\` নম্বর উত্তর বসাও।
4. তারপর \`t\`-তম কেবলটা union করে দাও — এখন অবস্থা \`t-1\` নম্বর খসে পড়ার পরের।
5. সব উত্তর সাজিয়ে ছাপাও।

\`\`\`python
import sys

def main():
    data = sys.stdin.read().split()
    n, m, q = int(data[0]), int(data[1]), int(data[2])
    edges = [(int(data[3 + 2 * i]), int(data[4 + 2 * i])) for i in range(m)]
    removed = [int(data[3 + 2 * m + i]) - 1 for i in range(q)]
    removed_set = set(removed)
    parent = list(range(n + 1))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for i, (u, v) in enumerate(edges):
        if i not in removed_set:
            ru, rv = find(u), find(v)
            if ru != rv:
                parent[ru] = rv
    answers = [''] * q
    for t in range(q - 1, -1, -1):
        answers[t] = 'YES' if find(1) == find(n) else 'NO'
        u, v = edges[removed[t]]
        ru, rv = find(u), find(v)
        if ru != rv:
            parent[ru] = rv
    print('\\n'.join(answers))

main()
\`\`\`

## কমপ্লেক্সিটি

প্রতিটি কেবল একবার union, প্রতিটি প্রশ্নে দুইটি \`find\` — মোট প্রায় \`O((n + m + q) alpha(n))\`, স্পেস \`O(n + m)\`। প্রতি ধাপে নেটওয়ার্ক নতুন করে BFS করলে \`O(q * (n + m))\` — বড় ইনপুটে চলে যাবে না।

## সাধারণ ভুল

- সামনের দিক থেকে প্রতিটি খসে পড়ার পর DSU নতুন বানানো — প্রতিটি ধাপে \`O(n + m)\`, মোটে অসম্ভব ধীর।
- উল্টো হাঁটায় উত্তর বসানোর ক্রম এলোমেলো করা — উত্তরগুলো সামনের সময়ের ক্রমেই ছাপতে হবে।
- ডুপ্লিকেট কেবলে ভুল করা — নম্বর ধরে খসে পড়ে, একই জোড়ার অন্য কপিটা থেকে যায়।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "DSU", "Offline Queries"],
    tests: [
      { input: "3 2 1\n1 2\n2 3\n2\n", expectedOutput: "NO\n", isSample: true },
      {
        input: "4 4 2\n1 2\n2 3\n3 4\n1 4\n3\n4\n",
        expectedOutput: "YES\nNO\n",
        isSample: true,
      },
      { input: "3 2 2\n1 2\n2 3\n1\n2\n", expectedOutput: "NO\nNO\n", isSample: false },
      { input: "2 1 1\n1 2\n1\n", expectedOutput: "NO\n", isSample: false },
      {
        input: `100000 99999 100\n${Array.from({ length: 99999 }, (_, i) => `${i + 1} ${i + 2}`).join("\n")}\n${Array.from({ length: 100 }, (_, i) => 49501 + i).join("\n")}\n`,
        expectedOutput: newlineOutput(Array(100).fill("NO")),
        isSample: false,
      },
      {
        input: `100000 100000 100\n${[
          ...Array.from({ length: 99999 }, (_, i) => `${i + 1} ${i + 2}`),
          "1 100000",
        ].join("\n")}\n${Array.from({ length: 100 }, (_, i) => 49501 + i).join("\n")}\n`,
        expectedOutput: newlineOutput(Array(100).fill("YES")),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\n\ndef main():\n    data = sys.stdin.read().split()\n    n, m, q = int(data[0]), int(data[1]), int(data[2])\n    edges = [(int(data[3 + 2 * i]), int(data[4 + 2 * i])) for i in range(m)]\n    removed = [int(data[3 + 2 * m + i]) - 1 for i in range(q)]\n    removed_set = set(removed)\n    parent = list(range(n + 1))\n\n    def find(x):\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n\n    for i, (u, v) in enumerate(edges):\n        if i not in removed_set:\n            ru, rv = find(u), find(v)\n            if ru != rv:\n                parent[ru] = rv\n    answers = [''] * q\n    for t in range(q - 1, -1, -1):\n        answers[t] = 'YES' if find(1) == find(n) else 'NO'\n        u, v = edges[removed[t]]\n        ru, rv = find(u), find(v)\n        if ru != rv:\n            parent[ru] = rv\n    print('\\n'.join(answers))\n\nmain()\n",
  },
  {
    slug: "learn-m4-mst-dsu-h2",
    title: "Second Best Spanning Tree",
    statement: `বিদ্যুৎ বোর্ডের প্রধান পরিকল্পনায় খরচ বাঁচাতে সবচেয়ে সস্তা কেবল-নেটওয়ার্ক (MST) বেছেছে। হঠাৎ জরুরি সময়ের জন্য একটা ব্যাকআপ পরিকল্পনাও দরকার — এমন আরেকটা স্প্যানিং নেটওয়ার্ক যার মোট খরচ MST-এর চেয়ে কড়া অর্থেই বড়, কিন্তু বাকি সব বিকল্পের মধ্যে সবচেয়ে ছোট।

\`n\`টি শহর, \`m\`টি সম্ভাব্য কেবল (খরচ \`w\`), সব খরচ স্বতন্ত্র আর নেটওয়ার্ক যুক্ত রাখা সম্ভব। দ্বিতীয় সেরা স্প্যানিং ট্রি-র মোট খরচ ছাপো; আর কোনো বিকল্প না থাকলে \`-1\`।

উদাহরণ: কেবল \`1-2\` (১), \`2-3\` (২), \`1-3\` (১০০) — MST খরচ \`3\`; দ্বিতীয় সেরা হলো \`1-3\` কেবলটা নিয়ে \`1 + 100\`, মোট \`101\`।`,
    inputFormat: `প্রথম লাইনে \`n m\`।
পরের \`m\` লাইনে প্রতিটিতে \`u v w\` — আনডিরেক্টেড কেবল, খরচ \`w\`।`,
    outputFormat: "এক লাইনে দ্বিতীয় সেরা স্প্যানিং ট্রি-র মোট খরচ, বা `-1`।",
    constraints:
      "`2 <= n <= 500`, `n - 1 <= m <= 2000`\n`1 <= w <= 10^9`, সব খরচ স্বতন্ত্র।\nদেওয়া কেবলগুলো দিয়ে সব শহর যুক্ত করা যায়।",
    editorial: `## ধারণা

সব খরচ স্বতন্ত্র, তাই MST অনন্য। দ্বিতীয় সেরা স্প্যানিং ট্রি সেই MST-এর থেকে ঠিক একটা কেবলে আলাদা — কারণ যেকোনো স্প্যানিং ট্রিকে MST-তে এক-এক কেবল বদলে বদলে আনা যায়, আর দ্বিতীয় সেরা হওয়ার পথে প্রথম বদলটাই খরচ বাড়ায় সবচেয়ে কম। তাই উত্তর হলো MST থেকে এক কেবল বদলের মধ্যে সবচেয়ে কম খরচেরটা: MST-এ না-ঢুকা প্রতিটি কেবল \`(u, v, w)\` নাও — ট্রিতে \`u\` থেকে \`v\`-এর পথে যে কেবলটা সবচেয়ে দামি, সেটা বাদ দিয়ে এই কেবলটা বসাও। Kruskal নিশ্চিত করে ওই পথের সব কেবল \`w\`-এর চেয়ে সস্তা, তাই বদলের খরচ \`w − পথের সর্বোচ্চ\` ধনাত্মকই। সব বদলের মধ্যে সর্বনিম্ন মোটই দ্বিতীয় সেরা।

## ধাপে ধাপে

1. Kruskal চালিয়ে MST বানাও; নেওয়া কেবলগুলো দিয়ে ট্রির adjacency list সাজাও, আর বাদ-পড়া কেবলগুলো আলাদা রাখো।
2. প্রতিটি বাদ-পড়া \`(u, v, w)\`-এর জন্য ট্রিতে \`u\` থেকে BFS চালিয়ে \`v\`-এর পথ ধরো — পথের সবচেয়ে দামি কেবলটা \`(path_max)\` বের করো।
3. বদলের মোট = MST-এর মোট + \`w\` − \`path_max\`।
4. সব বদলের মধ্যে সর্বনিম্নটাই উত্তর; বাদ-পড়া কেবল না থাকলে \`-1\`।

\`\`\`python
import sys
from collections import deque

def main():
    data = sys.stdin.read().split()
    n, m = int(data[0]), int(data[1])
    edges = []
    for i in range(m):
        u, v, w = int(data[2 + 3 * i]), int(data[3 + 3 * i]), int(data[4 + 3 * i])
        edges.append((w, u, v))
    edges.sort()
    parent = list(range(n + 1))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    tree_adj = [[] for _ in range(n + 1)]
    mst_total = 0
    non_tree = []
    for w, u, v in edges:
        ru, rv = find(u), find(v)
        if ru != rv:
            parent[ru] = rv
            tree_adj[u].append((v, w))
            tree_adj[v].append((u, w))
            mst_total += w
        else:
            non_tree.append((u, v, w))
    best = None
    for u, v, w in non_tree:
        prev = [0] * (n + 1)
        pweight = [0] * (n + 1)
        seen = [False] * (n + 1)
        dq = deque([u])
        seen[u] = True
        while dq:
            x = dq.popleft()
            if x == v:
                break
            for y, ew in tree_adj[x]:
                if not seen[y]:
                    seen[y] = True
                    prev[y] = x
                    pweight[y] = ew
                    dq.append(y)
        path_max, x = 0, v
        while x != u:
            if pweight[x] > path_max:
                path_max = pweight[x]
            x = prev[x]
        cand = mst_total - path_max + w
        if best is None or cand < best:
            best = cand
    print(-1 if best is None else best)

main()
\`\`\`

## কমপ্লেক্সিটি

Kruskal \`O(m log m)\`; প্রতিটি বাদ-পড়া কেবলে ট্রি-BFS \`O(n)\` — মোট \`O(m log m + m * n)\`; এই সীমায় সর্বোচ্চ প্রায় \`10^6\` ধাপ। স্পেস \`O(n + m)\`।

## সাধারণ ভুল

- \`path_max\`-এর জায়গায় পথের প্রথম বা শেষ কেবল বাদ দেওয়া — বদলের লাভ সবচেয়ে দামি কেবল সরালেই সবচেয়ে বেশি।
- MST-এর সমান খরচের আরেক ট্রি গণনায় ঢুকিয়ে ফেলা — প্রশ্ন চায় কড়া অর্থে বড় খরচ; স্বতন্ত্র ওজনে সেই বিভ্রান্তি নেই।
- পথ BFS-এ \`v\`-এ পৌঁছেই সব ঘর আঁছড়ে যাওয়া — পথ ধরে উল্টে \`u\` অবধি ফিরে গেলে মানগুলো পাওয়া যায়।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Graphs", "MST", "Kruskal"],
    tests: [
      { input: "3 3\n1 2 1\n2 3 2\n1 3 100\n", expectedOutput: "101\n", isSample: true },
      { input: "3 3\n1 2 1\n2 3 2\n1 3 4\n", expectedOutput: "5\n", isSample: true },
      {
        input: "4 5\n1 2 1\n2 3 2\n3 4 3\n4 1 5\n1 3 10\n",
        expectedOutput: "8\n",
        isSample: false,
      },
      { input: "2 1\n1 2 7\n", expectedOutput: "-1\n", isSample: false },
      {
        input: `500 500\n${[
          ...Array.from({ length: 499 }, (_, i) => `${i + 1} ${i + 2} ${i + 1}`),
          "500 1 500",
        ].join("\n")}\n`,
        expectedOutput: `${(499 * 500) / 2 - 499 + 500}\n`,
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\n\ndef main():\n    data = sys.stdin.read().split()\n    n, m = int(data[0]), int(data[1])\n    edges = []\n    for i in range(m):\n        u, v, w = int(data[2 + 3 * i]), int(data[3 + 3 * i]), int(data[4 + 3 * i])\n        edges.append((w, u, v))\n    edges.sort()\n    parent = list(range(n + 1))\n\n    def find(x):\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n\n    tree_adj = [[] for _ in range(n + 1)]\n    mst_total = 0\n    non_tree = []\n    for w, u, v in edges:\n        ru, rv = find(u), find(v)\n        if ru != rv:\n            parent[ru] = rv\n            tree_adj[u].append((v, w))\n            tree_adj[v].append((u, w))\n            mst_total += w\n        else:\n            non_tree.append((u, v, w))\n    best = None\n    for u, v, w in non_tree:\n        prev = [0] * (n + 1)\n        pweight = [0] * (n + 1)\n        seen = [False] * (n + 1)\n        dq = deque([u])\n        seen[u] = True\n        while dq:\n            x = dq.popleft()\n            if x == v:\n                break\n            for y, ew in tree_adj[x]:\n                if not seen[y]:\n                    seen[y] = True\n                    prev[y] = x\n                    pweight[y] = ew\n                    dq.append(y)\n        path_max, x = 0, v\n        while x != u:\n            if pweight[x] > path_max:\n                path_max = pweight[x]\n            x = prev[x]\n        cand = mst_total - path_max + w\n        if best is None or cand < best:\n            best = cand\n    print(-1 if best is None else best)\n\nmain()\n",
  },
];
