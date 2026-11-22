import type { SeedProblem } from "../../seed-problems";

export const HLD_PRACTICE_BASIC: SeedProblem[] = [
  {
    slug: "learn-m6-hld-e2",
    title: "Subtree Size Queries",
    statement: `ক্যাম্পাসের ক্লাব-কেন্দ্রগুলো একটা ট্রি-নেটওয়ার্কে যুক্ত, মূল কেন্দ্র নোড \`1\`। রফি প্রতিবার জানতে চায় কোনো একটা কেন্দ্রের নিচে (সেই কেন্দ্রসহ) মোট কতগুলো কেন্দ্র আছে।

\`q\`টি প্রশ্নের উত্তর দাও।`,
    inputFormat: `প্রথম লাইনে \`n\`। পরের \`n - 1\` লাইনে এজ \`u v\`। তারপর \`q\`; পরের \`q\` লাইনে একটি করে নোড \`u\`।`,
    outputFormat: `প্রতিটি প্রশ্নের উত্তর আলাদা লাইনে।`,
    constraints: `\`1 <= n <= 200000\`
\`1 <= q <= 200000\`
নোড \`1\` থেকে সব নোডে পৌঁছানো যায়।`,
    editorial: `## ধারণা
সাবট্রি সাইজ নিচ থেকে উপরে ভরে। নোড \`1\` থেকে একটা ক্রম বানাও যেখানে প্রতিটি নোড তার সন্তানদের আগে আসে (BFS বা DFS যেকোনোটা), তারপর ক্রমটা উল্টো করে ঘুরে প্রতিটি সন্তানের সাইজ বাবায় যোগ করো। শুরুতে প্রতিটি নোডের সাইজ \`1\`। সব প্রশ্নের উত্তর তখন \`O(1)\`-এ পাওয়া যায়।

## ধাপে ধাপে
1. এজ পড়ে adjacency list বানাও; \`parent[1] = -1\` রেখে ক্রম \`order\` তৈরি করো।
2. \`size = [1] * (n + 1)\`।
3. \`reversed(order[1:])\` ঘুরে \`size[parent[u]] += size[u]\`।
4. প্রতিটি প্রশ্নে \`size[u]\` ছাপো।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
g = [[] for _ in range(n + 1)]
idx = 1
for _ in range(n - 1):
    u, v = data[idx], data[idx + 1]
    idx += 2
    g[u].append(v)
    g[v].append(u)
parent = [0] * (n + 1)
parent[1] = -1
order = [1]
for u in order:
    for v in g[u]:
        if parent[v] == 0:
            parent[v] = u
            order.append(v)
size = [1] * (n + 1)
for u in reversed(order[1:]):
    size[parent[u]] += size[u]
q = data[idx]
idx += 1
out = []
for _ in range(q):
    out.append(str(size[data[idx]]))
    idx += 1
print('\\n'.join(out))
\`\`\`

## কমপ্লেক্সিটি
প্রস্তুতি \`O(n)\`, প্রতিটি প্রশ্ন \`O(1)\`; মোট সময় \`O(n + q)\`, স্পেস \`O(n)\`।

## সাধারণ ভুল
- সন্তানের সাইজ ভরার আগে বাবার সাইজ গোনা: উল্টো ক্রমে ঘুরতে হবে।
- বাবাকে সন্তান ভেবে আবার গোনা: \`parent[v] == 0\` শর্তে নতুন নোডেই ঢোকো।
- \`n = 1\`-এ এজ লুপ শূন্যবার চলা — সাইজ \`1\`, উত্তর ঠিকই।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Trees", "DFS", "Subtree"],
    tests: [
      {
        input: "5\n1 2\n2 3\n3 4\n4 5\n3\n1\n3\n5\n",
        expectedOutput: "5\n3\n1\n",
        isSample: true,
      },
      {
        input: "4\n1 2\n1 3\n1 4\n2\n1\n2\n",
        expectedOutput: "4\n1\n",
        isSample: true,
      },
      { input: "1\n1\n1\n", expectedOutput: "1\n", isSample: false },
      {
        input: "7\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7\n3\n2\n3\n4\n",
        expectedOutput: "3\n3\n1\n",
        isSample: false,
      },
      {
        input:
          "200000\n" +
          Array.from({ length: 199999 }, (_, i) => `${i + 1} ${i + 2}`).join("\n") +
          "\n3\n1\n100000\n200000\n",
        expectedOutput: "200000\n100001\n1\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ng = [[] for _ in range(n + 1)]\nidx = 1\nfor _ in range(n - 1):\n    u, v = data[idx], data[idx + 1]\n    idx += 2\n    g[u].append(v)\n    g[v].append(u)\nparent = [0] * (n + 1)\nparent[1] = -1\norder = [1]\nfor u in order:\n    for v in g[u]:\n        if parent[v] == 0:\n            parent[v] = u\n            order.append(v)\nsize = [1] * (n + 1)\nfor u in reversed(order[1:]):\n    size[parent[u]] += size[u]\nq = data[idx]\nidx += 1\nout = []\nfor _ in range(q):\n    out.append(str(size[data[idx]]))\n    idx += 1\nprint('\\n'.join(out))\n",
  },
  {
    slug: "learn-m6-hld-e3",
    title: "Ancestor Check Queries",
    statement: `একই ট্রি-নেটওয়ার্কে রফি প্রায়ই যাচাই করে: নোড \`u\` কি নোড \`v\`-এর পূর্বপুরুষ? নিজেকে নিজের পূর্বপুরুষ ধরা হবে।

\`q\`টি জোড়ার জন্য \`YES\` বা \`NO\` ছাপো।`,
    inputFormat: `প্রথম লাইনে \`n\`। পরের \`n - 1\` লাইনে এজ। তারপর \`q\`; পরের \`q\` লাইনে \`u v\`।`,
    outputFormat: `প্রতিটি জোড়ার জন্য \`YES\` বা \`NO\`, প্রতি লাইনে একটি।`,
    constraints: `\`1 <= n, q <= 200000\`
নোড \`1\` মূল এবং সব নোডে পৌঁছানো যায়।`,
    editorial: `## ধারণা
DFS-এ ঢোকার সময় \`tin[u]\`, বের হওয়ার সময় \`tout[u]\` লিখে রাখলে প্রতিটি সাবট্রি একটা পরপর ব্যবধান হয়। তখন \`u\`, \`v\`-এর পূর্বপুরুষ যদি এবং কেবল যদি \`tin[u] <= tin[v] <= tout[u]\`। এটাই Euler tour-এর মূল ধারণা, যা HLD-র সাবট্রি অংশেও কাজে লাগে।

## ধাপে ধাপে
1. এজ পড়ে adjacency list বানাও।
2. স্ট্যাক দিয়ে DFS চালাও; ঢোকার সময় \`tin\`, বের হওয়ার সময় \`tout\` বসাও।
3. প্রতিটি প্রশ্নে ব্যবধানের শর্ত পরীক্ষা করো।
4. সত্য হলে \`YES\`, নাহলে \`NO\`।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
g = [[] for _ in range(n + 1)]
idx = 1
for _ in range(n - 1):
    u, v = data[idx], data[idx + 1]
    idx += 2
    g[u].append(v)
    g[v].append(u)
tin = [0] * (n + 1)
tout = [0] * (n + 1)
timer = 0
stack = [(1, 0, 0)]
while stack:
    u, p, state = stack.pop()
    if state == 0:
        timer += 1
        tin[u] = timer
        stack.append((u, p, 1))
        for v in reversed(g[u]):
            if v != p:
                stack.append((v, u, 0))
    else:
        tout[u] = timer
q = data[idx]
idx += 1
out = []
for _ in range(q):
    u, v = data[idx], data[idx + 1]
    idx += 2
    out.append('YES' if tin[u] <= tin[v] <= tout[u] else 'NO')
print('\\n'.join(out))
\`\`\`

## কমপ্লেক্সিটি
DFS \`O(n)\`, প্রতিটি প্রশ্ন \`O(1)\`; মোট \`O(n + q)\`, স্পেস \`O(n)\`।

## সাধারণ ভুল
- শুধু \`tin\` মিলিয়ে দেখা: সাবট্রির বাইরের নোডেরও বড় \`tin\` হতে পারে, \`tout\` সীমাও লাগবে।
- রিকার্সিভ DFS: \`n = 200000\` লম্বা চেইনে recursion limit ভাঙে।
- নিজেকে পূর্বপুরুষ না ধরা: \`tin[u] <= tin[u] <= tout[u]\` সর্বদা সত্য, তাই \`YES\`।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Trees", "DFS", "Euler Tour"],
    tests: [
      {
        input: "5\n1 2\n1 3\n2 4\n2 5\n4\n1 5\n2 3\n2 5\n4 2\n",
        expectedOutput: "YES\nNO\nYES\nNO\n",
        isSample: true,
      },
      {
        input: "6\n1 2\n2 3\n3 4\n4 5\n5 6\n3\n3 6\n6 3\n1 1\n",
        expectedOutput: "YES\nNO\nYES\n",
        isSample: true,
      },
      { input: "1\n1\n1 1\n", expectedOutput: "YES\n", isSample: false },
      {
        input: "4\n1 2\n1 3\n1 4\n2\n1 4\n4 1\n",
        expectedOutput: "YES\nNO\n",
        isSample: false,
      },
      {
        input:
          "200000\n" +
          Array.from({ length: 199999 }, (_, i) => `${i + 1} ${i + 2}`).join("\n") +
          "\n3\n1 200000\n200000 1\n100000 100001\n",
        expectedOutput: "YES\nNO\nYES\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ng = [[] for _ in range(n + 1)]\nidx = 1\nfor _ in range(n - 1):\n    u, v = data[idx], data[idx + 1]\n    idx += 2\n    g[u].append(v)\n    g[v].append(u)\ntin = [0] * (n + 1)\ntout = [0] * (n + 1)\ntimer = 0\nstack = [(1, 0, 0)]\nwhile stack:\n    u, p, state = stack.pop()\n    if state == 0:\n        timer += 1\n        tin[u] = timer\n        stack.append((u, p, 1))\n        for v in reversed(g[u]):\n            if v != p:\n                stack.append((v, u, 0))\n    else:\n        tout[u] = timer\nq = data[idx]\nidx += 1\nout = []\nfor _ in range(q):\n    u, v = data[idx], data[idx + 1]\n    idx += 2\n    out.append('YES' if tin[u] <= tin[v] <= tout[u] else 'NO')\nprint('\\n'.join(out))\n",
  },
];
