import type { SeedProblem } from "../../seed-problems";

export const HLD_PRACTICE_ADVANCED: SeedProblem[] = [
  {
    slug: "learn-m6-hld-m2",
    title: "Subtree Sum with Updates",
    statement: `ট্রি-নেটওয়ার্কের প্রতিটি কেন্দ্রে কিছু সদস্য আছে। রফি দুই ধরনের কাজ করে: কোনো কেন্দ্রের সদস্য সংখ্যা বদলায়, আর কোনো কেন্দ্রের পুরো সাবট্রির (সেই কেন্দ্রসহ) মোট সদস্য জানতে চায়।

\`q\`টি কাজের মধ্যে প্রতিটি জিজ্ঞাসার উত্তর দাও।`,
    inputFormat: `প্রথম লাইনে \`n\`; দ্বিতীয় লাইনে \`n\`টি মান। পরের \`n - 1\` লাইনে এজ। তারপর \`q\`।
প্রতিটি কাজ: \`1 u x\` (নোড \`u\`-এর মান \`x\` করো) অথবা \`2 u\` (নোড \`u\`-এর সাবট্রি যোগফল)।`,
    outputFormat: `প্রতিটি \`2 u\` কাজের উত্তর আলাদা লাইনে।`,
    constraints: `\`1 <= n, q <= 200000\`
\`-10^9 <= value_i, x <= 10^9\``,
    editorial: `## ধারণা
Euler tour-এ প্রতিটি সাবট্রি একটানা ব্যবধান \`[tin[u], tout[u]]\` হয়। তাই সাবট্রি যোগফল হলো একটা রেঞ্জ যোগফল, আর মান বদলানো হলো একটা পয়েন্ট আপডেট। Fenwick tree দুটোই \`O(log n)\`-এ করে। HLD-তে ভারী চেইন আলাদা করে না ভাগিয়েও সাবট্রি অংশটা এই Euler tour দিয়েই সামলানো যায়।

## ধাপে ধাপে
1. এজ পড়ে \`tin\`, \`tout\` বানাও (DFS স্ট্যাক দিয়ে)।
2. \`tin[u]\` অবস্থানে \`value[u]\` রেখে Fenwick গড়ো।
3. \`1 u x\`: পুরনো মানের সঙ্গে পার্থক্য \`x - old\` নিয়ে পয়েন্ট আপডেট।
4. \`2 u\`: \`sum(tout[u]) - sum(tin[u] - 1)\` ছাপো।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
values = [0] + data[1:n + 1]
idx = n + 1
g = [[] for _ in range(n + 1)]
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
bit = [0] * (n + 2)
def add(i, delta):
    while i <= n:
        bit[i] += delta
        i += i & -i
def pref(i):
    total = 0
    while i > 0:
        total += bit[i]
        i -= i & -i
    return total
for u in range(1, n + 1):
    add(tin[u], values[u])
q = data[idx]
idx += 1
out = []
for _ in range(q):
    kind = data[idx]
    idx += 1
    if kind == 1:
        u, x = data[idx], data[idx + 1]
        idx += 2
        add(tin[u], x - values[u])
        values[u] = x
    else:
        u = data[idx]
        idx += 1
        out.append(str(pref(tout[u]) - pref(tin[u] - 1)))
print('\\n'.join(out))
\`\`\`

## কমপ্লেক্সিটি
প্রতিটি আপডেট বা জিজ্ঞাসা \`O(log n)\`; মোট \`O((n + q) log n)\`, স্পেস \`O(n)\`।

## সাধারণ ভুল
- সাবট্রি সীমা \`tin\`-\`tout\` না মিলিয়ে শুধু \`tin\` দেখা।
- আপডেটে পুরনো মান না রাখা: পার্থক্য \`x - old\` দরকার, শুধু \`x\` যোগ করলে আগের মান থেকে যায়।
- \`tout[u] < tin[u]\` ভেবে ভয় পাওয়া: DFS-এ \`tout\` সবসময় \`tin\`-এর সমান বা বড়।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["HLD", "Euler Tour", "Fenwick Tree"],
    tests: [
      {
        input:
          "5\n1 2 3 4 5\n1 2\n2 3\n3 4\n4 5\n5\n2 2\n1 3 10\n2 2\n2 4\n2 1\n",
        expectedOutput: "14\n21\n9\n22\n",
        isSample: true,
      },
      {
        input: "1\n7\n3\n2 1\n1 1 5\n2 1\n",
        expectedOutput: "7\n5\n",
        isSample: true,
      },
      {
        input:
          "4\n1 2 3 4\n1 2\n1 3\n1 4\n4\n2 1\n1 2 10\n2 1\n2 2\n",
        expectedOutput: "10\n18\n10\n",
        isSample: false,
      },
      {
        input: "2\n5 -3\n1 2\n3\n2 2\n1 2 4\n2 1\n",
        expectedOutput: "-3\n9\n",
        isSample: false,
      },
      {
        input:
          "200000\n" +
          Array.from({ length: 200000 }, () => 1).join(" ") +
          "\n" +
          Array.from({ length: 199999 }, (_, i) => `${i + 1} ${i + 2}`).join("\n") +
          "\n3\n2 1\n1 100000 5\n2 100000\n",
        expectedOutput: "200000\n100005\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nvalues = [0] + data[1:n + 1]\nidx = n + 1\ng = [[] for _ in range(n + 1)]\nfor _ in range(n - 1):\n    u, v = data[idx], data[idx + 1]\n    idx += 2\n    g[u].append(v)\n    g[v].append(u)\ntin = [0] * (n + 1)\ntout = [0] * (n + 1)\ntimer = 0\nstack = [(1, 0, 0)]\nwhile stack:\n    u, p, state = stack.pop()\n    if state == 0:\n        timer += 1\n        tin[u] = timer\n        stack.append((u, p, 1))\n        for v in reversed(g[u]):\n            if v != p:\n                stack.append((v, u, 0))\n    else:\n        tout[u] = timer\nbit = [0] * (n + 2)\ndef add(i, delta):\n    while i <= n:\n        bit[i] += delta\n        i += i & -i\ndef pref(i):\n    total = 0\n    while i > 0:\n        total += bit[i]\n        i -= i & -i\n    return total\nfor u in range(1, n + 1):\n    add(tin[u], values[u])\nq = data[idx]\nidx += 1\nout = []\nfor _ in range(q):\n    kind = data[idx]\n    idx += 1\n    if kind == 1:\n        u, x = data[idx], data[idx + 1]\n        idx += 2\n        add(tin[u], x - values[u])\n        values[u] = x\n    else:\n        u = data[idx]\n        idx += 1\n        out.append(str(pref(tout[u]) - pref(tin[u] - 1)))\nprint('\\n'.join(out))\n",
  },
  {
    slug: "learn-m6-hld-m3",
    title: "Path XOR with Updates",
    statement: `ট্রি-নেটওয়ার্কের প্রতিটি কেন্দ্রে একটা ট্যাগ-নম্বর আছে। রফি দুই ধরনের কাজ করে: একটা কেন্দ্রের ট্যাগ বদলায়, আর দুই কেন্দ্রের মধ্যের পথে থাকা সব ট্যাগের বিটওয়াইজ XOR জানতে চায় — দুই প্রান্তসহ।

\`q\`টি কাজের প্রতিটি জিজ্ঞাসার উত্তর দাও।`,
    inputFormat: `প্রথম লাইনে \`n\`; দ্বিতীয় লাইনে \`n\`টি মান। পরের \`n - 1\` লাইনে এজ। তারপর \`q\`।
প্রতিটি কাজ: \`1 u x\` (ট্যাগ বদলাও) অথবা \`2 u v\` (পথের XOR)।`,
    outputFormat: `প্রতিটি \`2 u v\` কাজের উত্তর আলাদা লাইনে।`,
    constraints: `\`1 <= n, q <= 200000\`
\`0 <= value_i, x < 2^30\``,
    editorial: `## ধারণা
পথ-জিজ্ঞাসার জন্য ট্রিকে ভারী সন্তান (\`heavy\`) ধরে চেইনে ভাগ করো — এটাই Heavy-Light Decomposition। প্রতিটি চেইনের নোডগুলো Euler অবস্থানে পরপর বসে, তাই চেইনের একটা অংশের XOR Fenwick tree দিয়ে \`O(log n)\`-এ পাওয়া যায়। \`u\` থেকে \`v\`-এর পথে উঠতে উঠতে চেইন-ব্লকগুলোর XOR জোড়ো; দুই নোড একই চেইনে এলে শেষ ব্লকটাও নাও।

XOR-এর সুবিধা: পয়েন্ট আপডেটে \`old ^ new\` যোগ করলেই পুরনো মান বাতিল হয়ে নতুনটা বসে।

## ধাপে ধাপে
1. \`parent\`, \`depth\`, \`size\`, \`heavy\` বের করো (BFS ক্রম + উল্টো লুপ)।
2. প্রতিটি চেইনের শুরু থেকে \`head\`, \`pos\` বসাও।
3. \`pos\` অবস্থানে মান রেখে XOR-Fenwick গড়ো।
4. \`1 u x\`: \`delta = old ^ x\`; Fenwick-এ \`delta\` XOR করো।
5. \`2 u v\`: ভিন্ন চেইনে থাকা পর্যন্ত গভীর চেইনের মাথা পর্যন্ত XOR নিয়ে উপরে ওঠো; একই চেইনে এলে মাঝের অংশ নাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
values = [0] + data[1:n + 1]
idx = n + 1
g = [[] for _ in range(n + 1)]
for _ in range(n - 1):
    u, v = data[idx], data[idx + 1]
    idx += 2
    g[u].append(v)
    g[v].append(u)
parent = [0] * (n + 1)
depth = [0] * (n + 1)
parent[1] = -1
order = [1]
for u in order:
    for v in g[u]:
        if v != parent[u]:
            parent[v] = u
            depth[v] = depth[u] + 1
            order.append(v)
size = [1] * (n + 1)
heavy = [0] * (n + 1)
for u in reversed(order):
    best = 0
    for v in g[u]:
        if v != parent[u]:
            size[u] += size[v]
            if size[v] > best:
                best = size[v]
                heavy[u] = v
head = [0] * (n + 1)
pos = [0] * (n + 1)
cur = 0
stack = [(1, 1)]
while stack:
    u, h = stack.pop()
    while u:
        head[u] = h
        cur += 1
        pos[u] = cur
        for v in g[u]:
            if v != parent[u] and v != heavy[u]:
                stack.append((v, v))
        u = heavy[u]
bit = [0] * (n + 2)
def add(i, x):
    while i <= n:
        bit[i] ^= x
        i += i & -i
def pref(i):
    r = 0
    while i > 0:
        r ^= bit[i]
        i -= i & -i
    return r
def range_xor(l, r):
    return pref(r) ^ pref(l - 1)
for u in range(1, n + 1):
    add(pos[u], values[u])
def path_xor(u, v):
    r = 0
    while head[u] != head[v]:
        if depth[head[u]] < depth[head[v]]:
            u, v = v, u
        r ^= range_xor(pos[head[u]], pos[u])
        u = parent[head[u]]
    if depth[u] > depth[v]:
        u, v = v, u
    return r ^ range_xor(pos[u], pos[v])
q = data[idx]
idx += 1
out = []
for _ in range(q):
    kind = data[idx]
    idx += 1
    if kind == 1:
        u, x = data[idx], data[idx + 1]
        idx += 2
        add(pos[u], values[u] ^ x)
        values[u] = x
    else:
        u, v = data[idx], data[idx + 1]
        idx += 2
        out.append(str(path_xor(u, v)))
print('\\n'.join(out))
\`\`\`

## কমপ্লেক্সিটি
প্রতিটি কাজ \`O(log^2 n)\` (কয়েকটি চেইন, প্রতিটিতে Fenwick), স্পেস \`O(n)\`।

## সাধারণ ভুল
- চেইন-ব্লকে দুই প্রান্তের ক্রম উল্টে যাওয়া: \`pos\` ছোট-বড় সাজিয়ে নাও।
- আপডেটে \`x\` সরাসরি XOR করা: পুরনো মান বাতিল করতে \`old ^ x\` লাগে।
- \`head\`-এর গভীরতা না দেখে এলোমেলোভাবে উপরে ওঠা: উঁচু চেইনের মাথা আগে তুললে পথ বাদ পড়ে।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 4000,
    memoryLimitMb: 256,
    tags: ["HLD", "Fenwick Tree", "Trees"],
    tests: [
      {
        input:
          "4\n1 2 3 4\n1 2\n2 3\n3 4\n4\n2 1 4\n1 2 7\n2 1 4\n2 2 3\n",
        expectedOutput: "4\n1\n4\n",
        isSample: true,
      },
      {
        input:
          "4\n5 1 2 3\n1 2\n1 3\n1 4\n4\n2 2 3\n2 1 1\n1 1 0\n2 4 2\n",
        expectedOutput: "6\n5\n2\n",
        isSample: true,
      },
      {
        input: "1\n9\n3\n2 1 1\n1 1 4\n2 1 1\n",
        expectedOutput: "9\n4\n",
        isSample: false,
      },
      {
        input: "2\n6 10\n1 2\n3\n2 1 2\n1 1 1\n2 2 2\n",
        expectedOutput: "12\n10\n",
        isSample: false,
      },
      {
        input:
          "200000\n" +
          Array.from({ length: 200000 }, () => 1).join(" ") +
          "\n" +
          Array.from({ length: 199999 }, (_, i) => `${i + 1} ${i + 2}`).join("\n") +
          "\n3\n2 1 200000\n1 100000 7\n2 1 200000\n",
        expectedOutput: "0\n6\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nvalues = [0] + data[1:n + 1]\nidx = n + 1\ng = [[] for _ in range(n + 1)]\nfor _ in range(n - 1):\n    u, v = data[idx], data[idx + 1]\n    idx += 2\n    g[u].append(v)\n    g[v].append(u)\nparent = [0] * (n + 1)\ndepth = [0] * (n + 1)\nparent[1] = -1\norder = [1]\nfor u in order:\n    for v in g[u]:\n        if v != parent[u]:\n            parent[v] = u\n            depth[v] = depth[u] + 1\n            order.append(v)\nsize = [1] * (n + 1)\nheavy = [0] * (n + 1)\nfor u in reversed(order):\n    best = 0\n    for v in g[u]:\n        if v != parent[u]:\n            size[u] += size[v]\n            if size[v] > best:\n                best = size[v]\n                heavy[u] = v\nhead = [0] * (n + 1)\npos = [0] * (n + 1)\ncur = 0\nstack = [(1, 1)]\nwhile stack:\n    u, h = stack.pop()\n    while u:\n        head[u] = h\n        cur += 1\n        pos[u] = cur\n        for v in g[u]:\n            if v != parent[u] and v != heavy[u]:\n                stack.append((v, v))\n        u = heavy[u]\nbit = [0] * (n + 2)\ndef add(i, x):\n    while i <= n:\n        bit[i] ^= x\n        i += i & -i\ndef pref(i):\n    r = 0\n    while i > 0:\n        r ^= bit[i]\n        i -= i & -i\n    return r\ndef range_xor(l, r):\n    return pref(r) ^ pref(l - 1)\nfor u in range(1, n + 1):\n    add(pos[u], values[u])\ndef path_xor(u, v):\n    r = 0\n    while head[u] != head[v]:\n        if depth[head[u]] < depth[head[v]]:\n            u, v = v, u\n        r ^= range_xor(pos[head[u]], pos[u])\n        u = parent[head[u]]\n    if depth[u] > depth[v]:\n        u, v = v, u\n    return r ^ range_xor(pos[u], pos[v])\nq = data[idx]\nidx += 1\nout = []\nfor _ in range(q):\n    kind = data[idx]\n    idx += 1\n    if kind == 1:\n        u, x = data[idx], data[idx + 1]\n        idx += 2\n        add(pos[u], values[u] ^ x)\n        values[u] = x\n    else:\n        u, v = data[idx], data[idx + 1]\n        idx += 2\n        out.append(str(path_xor(u, v)))\nprint('\\n'.join(out))\n",
  },
  {
    slug: "learn-m6-hld-h2",
    title: "K-th Node on the Path",
    statement: `ট্রি-নেটওয়ার্কে রফি দুই কেন্দ্রের মধ্যের পথে \`k\`-তম কেন্দ্রটা খুঁজতে চায়। পথটা \`u\` থেকে শুরু, \`v\`-তে শেষ; \`k\` গোনা হয় \`u\`-কে ১ ধরে।

\`q\`টি জিজ্ঞাসার উত্তর দাও।`,
    inputFormat: `প্রথম লাইনে \`n\`; পরের \`n - 1\` লাইনে এজ। তারপর \`q\`; প্রতিটি লাইনে \`u v k\`।`,
    outputFormat: `প্রতিটি জিজ্ঞাসার \`k\`-তম নোড আলাদা লাইনে।`,
    constraints: `\`1 <= n, q <= 200000\`
\`1 <= k <= দূরত্ব(u, v) + 1\``,
    editorial: `## ধারণা
আগে \`w = LCA(u, v)\` বের করো। \`u\` থেকে \`w\` পর্যন্ত নোড সংখ্যা \`d1 = depth[u] - depth[w] + 1\`। \`k <= d1\` হলে উত্তর \`u\` থেকে \`k - 1\` ধাপ উপরে। নাহলে \`w\`-এর পরে \`v\`-এর দিকে যেতে হবে: বাকি \`k2 = k - d1\`-তম নোড মানে \`v\` থেকে \`depth[v] - depth[w] - k2\` ধাপ উপরে। যেকোনো নোডের \`x\`-তম পূর্বপুরুষ \`O(log n)\`-এ পেতে binary lifting টেবিল রাখো।

## ধাপে ধাপে
1. \`parent\`, \`depth\` বের করো।
2. \`up[k][u]\` টেবিল ভরো: \`up[0][u] = parent[u]\`, \`up[k][u] = up[k-1][up[k-1][u]]\`।
3. \`lca\` আর \`lift(u, steps)\` লেখো।
4. প্রতিটি প্রশ্নে \`w\` বের করে \`d1\` হিসাব করো; দিক বুঝে \`lift\` চালাও।

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
depth = [0] * (n + 1)
order = [1]
for u in order:
    for v in g[u]:
        if v != parent[u]:
            parent[v] = u
            depth[v] = depth[u] + 1
            order.append(v)
LOG = max(1, n.bit_length())
up = [[0] * (n + 1) for _ in range(LOG)]
for u in range(1, n + 1):
    up[0][u] = parent[u]
for k in range(1, LOG):
    prev = up[k - 1]
    row = up[k]
    for u in range(1, n + 1):
        row[u] = prev[prev[u]]
def lift(u, steps):
    k = 0
    while steps:
        if steps & 1:
            u = up[k][u]
        steps >>= 1
        k += 1
    return u
def lca(a, b):
    if depth[a] < depth[b]:
        a, b = b, a
    a = lift(a, depth[a] - depth[b])
    if a == b:
        return a
    for k in range(LOG - 1, -1, -1):
        if up[k][a] != up[k][b]:
            a = up[k][a]
            b = up[k][b]
    return parent[a]
q = data[idx]
idx += 1
out = []
for _ in range(q):
    u, v, k = data[idx], data[idx + 1], data[idx + 2]
    idx += 3
    w = lca(u, v)
    d1 = depth[u] - depth[w] + 1
    if k <= d1:
        out.append(str(lift(u, k - 1)))
    else:
        k2 = k - d1
        out.append(str(lift(v, depth[v] - depth[w] - k2)))
print('\\n'.join(out))
\`\`\`

## কমপ্লেক্সিটি
প্রস্তুতি \`O(n log n)\`, প্রতিটি জিজ্ঞাসা \`O(log n)\`; মোট \`O((n + q) log n)\`, স্পেস \`O(n log n)\`।

## সাধারণ ভুল
- \`d1\`-এ \`w\` দুইবার গোনা: \`u\` থেকে \`w\` পর্যন্ত নোড সংখ্যা \`depth[u] - depth[w] + 1\`।
- দ্বিতীয় অংশে \`v\` থেকে ভুল সংখ্যক ধাপ ওঠা: \`depth[v] - depth[w] - k2\` হিসাব করো।
- \`n = 1\`-এ \`LOG\` শূন্য ধরা: \`max(1, ...)\` রাখো।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["HLD", "Binary Lifting", "LCA"],
    tests: [
      { input: "5\n1 2\n2 3\n3 4\n4 5\n4\n1 5 3\n5 1 3\n1 5 1\n1 5 5\n", expectedOutput: "3\n3\n1\n5\n", isSample: true },
      { input: "7\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7\n3\n4 5 3\n6 7 2\n4 7 4\n", expectedOutput: "5\n3\n3\n", isSample: true },
      { input: "1\n1\n1 1 1\n", expectedOutput: "1\n", isSample: false },
      {
        input: "4\n1 2\n1 3\n1 4\n3\n2 3 2\n2 3 3\n4 2 1\n",
        expectedOutput: "1\n3\n4\n",
        isSample: false,
      },
      {
        input:
          "200000\n" +
          Array.from({ length: 199999 }, (_, i) => `${i + 1} ${i + 2}`).join("\n") +
          "\n2\n1 200000 100000\n200000 1 199999\n",
        expectedOutput: "100000\n2\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ng = [[] for _ in range(n + 1)]\nidx = 1\nfor _ in range(n - 1):\n    u, v = data[idx], data[idx + 1]\n    idx += 2\n    g[u].append(v)\n    g[v].append(u)\nparent = [0] * (n + 1)\ndepth = [0] * (n + 1)\norder = [1]\nfor u in order:\n    for v in g[u]:\n        if v != parent[u]:\n            parent[v] = u\n            depth[v] = depth[u] + 1\n            order.append(v)\nLOG = max(1, n.bit_length())\nup = [[0] * (n + 1) for _ in range(LOG)]\nfor u in range(1, n + 1):\n    up[0][u] = parent[u]\nfor k in range(1, LOG):\n    prev = up[k - 1]\n    row = up[k]\n    for u in range(1, n + 1):\n        row[u] = prev[prev[u]]\ndef lift(u, steps):\n    k = 0\n    while steps:\n        if steps & 1:\n            u = up[k][u]\n        steps >>= 1\n        k += 1\n    return u\ndef lca(a, b):\n    if depth[a] < depth[b]:\n        a, b = b, a\n    a = lift(a, depth[a] - depth[b])\n    if a == b:\n        return a\n    for k in range(LOG - 1, -1, -1):\n        if up[k][a] != up[k][b]:\n            a = up[k][a]\n            b = up[k][b]\n    return parent[a]\nq = data[idx]\nidx += 1\nout = []\nfor _ in range(q):\n    u, v, k = data[idx], data[idx + 1], data[idx + 2]\n    idx += 3\n    w = lca(u, v)\n    d1 = depth[u] - depth[w] + 1\n    if k <= d1:\n        out.append(str(lift(u, k - 1)))\n    else:\n        k2 = k - d1\n        out.append(str(lift(v, depth[v] - depth[w] - k2)))\nprint('\\n'.join(out))\n",
  },
];
