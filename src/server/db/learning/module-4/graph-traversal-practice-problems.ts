import type { SeedProblem } from "../../seed-problems";

// খোলা গ্রিড: উপরে-বামে S, নিচে-ডানে E — m2/h2-এর বড় টেস্টে।
function openGrid(size: number, wallColumn?: number): string {
  const rows = Array.from({ length: size }, (_, r) => {
    const cells: string[] = Array(size).fill(".");
    if (wallColumn !== undefined) cells[wallColumn] = "#";
    if (r === 0) cells[0] = "S";
    if (r === size - 1) cells[size - 1] = "E";
    return cells.join("");
  });
  return `${size} ${size}\n${rows.join("\n")}\n`;
}

export const GRAPH_TRAVERSAL_PRACTICE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m4-graph-traversal-e2",
    title: "Farthest Reachable Node",
    statement: `নুসরাত শাটল রুট সাজাচ্ছে: \`n\`টি বিল্ডিং, \`m\`টি দ্বিমুখী করিডোর, প্রতিটি পার হতে ঠিক ১ মিনিট। শুরুর বিল্ডিং \`s\`।

রুট কভার করার আগে সে জানতে চায় \`s\` থেকে পৌঁছানো যায় এমন বিল্ডিংগুলোর মধ্যে সবচেয়ে দূরেরটা কত মিনিটে পাওয়া যায় — অর্থাৎ সর্বোচ্চ দূরত্ব কত। \`s\` নিজেও গণনায় আছে, তাই উত্তর কখনো \`0\`-এর কম নয়।

উদাহরণ: \`4\`টি বিল্ডিং, করিডোর \`1-2\`, \`2-3\`, \`3-4\`, শুরু \`1\` — সবচেয়ে দূরের বিল্ডিং \`4\`, দূরত্ব \`3\`।`,
    inputFormat: `প্রথম লাইনে \`n m s\`।
পরের \`m\` লাইনে প্রতিটিতে \`u v\` — আনডিরেক্টেড করিডোর।`,
    outputFormat: "এক লাইনে `s` থেকে সর্বোচ্চ দূরত্ব (মিনিটে)।",
    constraints:
      "`1 <= n <= 100000`, `0 <= m <= 200000`\nএকই জোড়ার করিডোর একাধিকবার থাকতে পারে।",
    editorial: `## ধারণা

দূরত্ব মাপার একটাই হাতিয়ার এখানে — ওজনহীন গ্রাফে BFS। প্রতিটি নোড প্রথমবার ঢোকার সময় তার দূরত্ব চূড়ান্ত হয়ে যায়, কারণ প্রতিটি ধাপে সব প্রান্তের ওজন সমান। BFS শেষ হলে পৌঁছানো নোডগুলোর দূরত্বের মধ্যে সর্বোচ্চটাই উত্তর — আলাদা কোনো সর্বোচ্চ-খোঁজার দরকার নেই।

## ধাপে ধাপে

1. Adjacency list বানাও; \`dist\` সব \`-1\`, \`dist[s] = 0\`।
2. Queue-তে \`s\` বসিয়ে BFS চালাও — প্রতিটি নতুন নোডে দূরত্ব বাপের চেয়ে এক বেশি।
3. ঘোরা শেষে \`dist\`-এর সর্বোচ্চ মান ছাপাও (পৌঁছানো নোডগুলোর মধ্যে; \`s\` নিজে \`0\`)।

\`\`\`python
import sys
from collections import deque

def main():
    data = sys.stdin.read().split()
    n, m, s = int(data[0]), int(data[1]), int(data[2])
    adj = [[] for _ in range(n + 1)]
    for i in range(m):
        u, v = int(data[3 + 2 * i]), int(data[4 + 2 * i])
        adj[u].append(v)
        adj[v].append(u)
    dist = [-1] * (n + 1)
    dist[s] = 0
    q = deque([s])
    while q:
        u = q.popleft()
        for v in adj[u]:
            if dist[v] == -1:
                dist[v] = dist[u] + 1
                q.append(v)
    print(max(dist[s:n + 1]))

main()
\`\`\`

## কমপ্লেক্সিটি

সময় \`O(n + m)\` — প্রতিটি নোড আর প্রতিটি করিডোর একবারই দেখা হয়। স্পেস \`O(n + m)\`।

## সাধারণ ভুল

- \`s\`-এর সাথে যুক্ত কেউ না থাকলে উত্তর \`0\` — \`s\` নিজেও গণনায়; না ধরলে খালি লিস্টে সর্বোচ্চ খুঁজে ভেঙে পড়ে।
- DFS দিয়ে দূরত্ব মাপা — ওজনহীন গ্রাফে DFS-এর পথ সবসময় সবচেয়ে ছোট নয়।
- একই জোড়ার ডুপ্লিকেট করিডোরে নোড দুইবার ঢোকা — \`dist == -1\` চেকই আটকায়।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "BFS", "Shortest Path"],
    tests: [
      { input: "4 3 1\n1 2\n2 3\n3 4\n", expectedOutput: "3\n", isSample: true },
      { input: "1 0 1\n", expectedOutput: "0\n", isSample: true },
      { input: "5 3 4\n1 2\n4 5\n5 4\n", expectedOutput: "1\n", isSample: false },
      {
        input: `100000 99999 7\n${Array.from({ length: 99999 }, (_, i) => `1 ${i + 2}`).join("\n")}\n`,
        expectedOutput: "2\n",
        isSample: false,
      },
      {
        input: `100000 99999 1\n${Array.from({ length: 99999 }, (_, i) => `${i + 1} ${i + 2}`).join("\n")}\n`,
        expectedOutput: "99999\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\n\ndef main():\n    data = sys.stdin.read().split()\n    n, m, s = int(data[0]), int(data[1]), int(data[2])\n    adj = [[] for _ in range(n + 1)]\n    for i in range(m):\n        u, v = int(data[3 + 2 * i]), int(data[4 + 2 * i])\n        adj[u].append(v)\n        adj[v].append(u)\n    dist = [-1] * (n + 1)\n    dist[s] = 0\n    q = deque([s])\n    while q:\n        u = q.popleft()\n        for v in adj[u]:\n            if dist[v] == -1:\n                dist[v] = dist[u] + 1\n                q.append(v)\n    print(max(dist[s:n + 1]))\n\nmain()\n",
  },
  {
    slug: "learn-m4-graph-traversal-e3",
    title: "BFS Visit Order",
    statement: `ক্লাবের মেমো পৌঁছানোর নিয়ম একরকম: কেউ মেমো পাওয়ামাত্র তার প্রতিবেশীদের পাঠায়, আর যারা আগে পেয়েছে তারা আগে পাঠায় — এটাই BFS-এর ঢেউ। তানভির দেখতে চায় মেমোটা ঠিক কোন ক্রমে কাদের কাছে পৌঁছাল।

\`n\`টি নোড আর \`m\`টি দ্বিমুখী সংযোগ দেওয়া থাকবে। নোড \`1\` থেকে BFS চালিয়ে ভিজিট ক্রমটা ছাপো — একটা নোডের প্রতিবেশীরা ছোট নম্বর থেকে বড় নম্বরের ক্রমে ঘোরা হবে, আর \`1\` থেকে যাদের কাছে পৌঁছানো যায় না তারা তালিকায় আসবেই না।

উদাহরণ: সংযোগ \`1-2\`, \`1-3\`, \`3-4\` হলে ক্রম \`1 2 3 4\`।`,
    inputFormat: `প্রথম লাইনে \`n m\`।
পরের \`m\` লাইনে প্রতিটিতে \`u v\` — আনডিরেক্টেড সংযোগ।`,
    outputFormat:
      "এক লাইনে ভিজিট ক্রম, স্পেস দিয়ে আলাদা (শুধু `1` থেকে পৌঁছানো নোডগুলো)।",
    constraints:
      "`1 <= n <= 100000`, `0 <= m <= 200000`\nএকই জোড়ার সংযোগ একাধিকবার থাকতে পারে।",
    editorial: `## ধারণা

BFS-এ queue থেকে যে ক্রমে নোড বের হয়, সেটাই ভিজিট ক্রম — প্রথম ঢেউ আগে, পরের ঢেউ পরে। প্রশ্নে ক্রম অনন্য করতে একটা নিয়ম বাঁধা: প্রতিটি নোডের প্রতিবেশী ছোট থেকে বড় ক্রমে দেখা হবে। তাই প্রতিটি নোডের adjacency list আগে সাজিয়ে নাও, তারপর সাধারণ BFS-ই চালাও। পৌঁছানো যায় না এমন নোড queue-তে কখনো ঢোকে না — সেগুলো আউটপুটেও আসবে না।

## ধাপে ধাপে

1. সংযোগগুলো adjacency list-এ রাখো, তারপর প্রতিটি লিস্ট sort করো।
2. \`visited[1] = True\` দিয়ে queue-তে \`1\` বসাও।
3. প্রতিটি নোড queue থেকে তুলে ক্রমের লিস্টে নাও; তার প্রতিবেশীদের মধ্যে যে এখনো যায়নি সেই সবাইকে visited করে queue-র শেষে দাও।
4. লিস্টটা এক লাইনে ছাপাও।

\`\`\`python
import sys
from collections import deque

def main():
    data = sys.stdin.read().split()
    n, m = int(data[0]), int(data[1])
    adj = [[] for _ in range(n + 1)]
    for i in range(m):
        u, v = int(data[2 + 2 * i]), int(data[3 + 2 * i])
        adj[u].append(v)
        adj[v].append(u)
    for u in range(1, n + 1):
        adj[u].sort()
    visited = [False] * (n + 1)
    visited[1] = True
    order = []
    q = deque([1])
    while q:
        u = q.popleft()
        order.append(u)
        for v in adj[u]:
            if not visited[v]:
                visited[v] = True
                q.append(v)
    print(' '.join(map(str, order)))

main()
\`\`\`

## কমপ্লেক্সিটি

সাজানো \`O(m log m)\`, BFS \`O(n + m)\` — মোট সেটার মধ্যেই। স্পেস \`O(n + m)\`।

## সাধারণ ভুল

- প্রতিবেশী sort না করে ইনপুটের ক্রমে ঘোরা — একই গ্রাফে ভিন্ন ইনপুট ক্রমে ভিন্ন উত্তর আসে।
- ঢোকানোর সময় নয়, তোলার সময় visited চিহ্নিত করা — একই নোড queue-তে দুইবার ঢুকে ক্রম নষ্ট করে।
- সব \`n\` নোড ছাপা — যারা \`1\` থেকে পৌঁছায়নি তাদের জায়গা নেই।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "BFS", "Ordering"],
    tests: [
      { input: "4 3\n1 2\n1 3\n3 4\n", expectedOutput: "1 2 3 4\n", isSample: true },
      { input: "3 1\n2 3\n", expectedOutput: "1\n", isSample: true },
      { input: "4 2\n1 4\n1 2\n", expectedOutput: "1 2 4\n", isSample: false },
      { input: "5 4\n3 1\n3 2\n1 5\n2 5\n", expectedOutput: "1 3 5 2\n", isSample: false },
      { input: "5 2\n1 3\n4 5\n", expectedOutput: "1 3\n", isSample: false },
      { input: "3 3\n1 2\n2 1\n1 3\n", expectedOutput: "1 2 3\n", isSample: false },
      {
        input: `100000 99999\n${Array.from({ length: 99999 }, (_, i) => `${i + 1} ${i + 2}`).join("\n")}\n`,
        expectedOutput: `${Array.from({ length: 100000 }, (_, i) => i + 1).join(" ")}\n`,
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\n\ndef main():\n    data = sys.stdin.read().split()\n    n, m = int(data[0]), int(data[1])\n    adj = [[] for _ in range(n + 1)]\n    for i in range(m):\n        u, v = int(data[2 + 2 * i]), int(data[3 + 2 * i])\n        adj[u].append(v)\n        adj[v].append(u)\n    for u in range(1, n + 1):\n        adj[u].sort()\n    visited = [False] * (n + 1)\n    visited[1] = True\n    order = []\n    q = deque([1])\n    while q:\n        u = q.popleft()\n        order.append(u)\n        for v in adj[u]:\n            if not visited[v]:\n                visited[v] = True\n                q.append(v)\n    print(' '.join(map(str, order)))\n\nmain()\n",
  },
  {
    slug: "learn-m4-graph-traversal-m2",
    title: "Maze Exit Distance",
    statement: `লাইব্রেরির পুরনো সেকশনে নুসরাত ঢুকে পড়েছে — মেজের ম্যাপে \`.\` মানে খোলা ঘর, \`#\` মানে তাকে আটকানো দেয়াল, \`S\` তার দাঁড়ানোর জায়গা আর \`E\` বেরোনোর দরজা। চলা যায় উপর, নিচ, বাম, ডান — কর্ণ দিয়ে নয়, আর প্রতিটি ঘর পার হতে ১ ধাপ।

দরজায় পৌঁছাতে সবচেয়ে কম কয়টি ধাপ লাগবে সেটি ছাপো; কোনো পথ না থাকলে \`-1\`।

উদাহরণ: ৩x৩ মেজ, প্রথম লাইন \`S.E\`, মাঝের সারিতে দেয়াল — সবচেয়ে ছোট পথ নিচ ঘুরে, মোট \`2\` ধাপ।`,
    inputFormat: `প্রথম লাইনে \`h w\` — সারি আর কলামের সংখ্যা।
পরের \`h\` লাইনে প্রতিটিতে \`w\`টি অক্ষর — \`. # S E\` থেকে গঠিত ম্যাপ।`,
    outputFormat: "এক লাইনে `S` থেকে `E`-এর ন্যূনতম ধাপ, বা `-1`।",
    constraints:
      "`1 <= h, w <= 300`\nম্যাপে ঠিক একটি `S` আর একটি `E` আছে।",
    editorial: `## ধারণা

প্রতিটি ধাপের খরচ সমান (১), তাই এটাই ওজনহীন গ্রাফের সবচেয়ে ছোট পথ — ঘরগুলো নোড, পাশাপাশি খোলা ঘরগুলোর জুড়াই edge, আর হাতিয়ার BFS। প্রতিটি ঘরে প্রথমবার পৌঁছানোর ধাপই তার ন্যূনতম দূরত্ব; প্রথম ঢেউয়ে কাছের ঘর, পরের ঢেউয়ে এক ধাপ দূরের ঘর — দরজায় প্রথম পৌঁছানো ধাপটাই উত্তর।

## ধাপে ধাপে

1. ম্যাপ পড়ে \`S\` আর \`E\`-এর অবস্থান চিনে রাখো।
2. \`dist\` গ্রিড সব \`-1\`; \`dist[S] = 0\` দিয়ে queue-তে বসাও।
3. প্রতিটি ঘর তুলে চার প্রতিবেশী দেখো — ম্যাপের ভেতরে, দেয়াল নয়, আর আগে যায়নি এমন হলে দূরত্ব বসিয়ে queue-তে দাও।
4. BFS শেষে \`dist[E]\` ছাপাও; \`-1\` থাকলে পথ নেই।

\`\`\`python
import sys
from collections import deque

def main():
    lines = sys.stdin.read().split('\\n')
    h, w = map(int, lines[0].split())
    grid = [lines[1 + r] for r in range(h)]
    sr = sc = er = ec = -1
    for r in range(h):
        for c in range(w):
            if grid[r][c] == 'S':
                sr, sc = r, c
            elif grid[r][c] == 'E':
                er, ec = r, c
    dist = [[-1] * w for _ in range(h)]
    dist[sr][sc] = 0
    q = deque([(sr, sc)])
    while q:
        r, c = q.popleft()
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < h and 0 <= nc < w and grid[nr][nc] != '#' and dist[nr][nc] == -1:
                dist[nr][nc] = dist[r][c] + 1
                q.append((nr, nc))
    print(dist[er][ec])

main()
\`\`\`

## কমপ্লেক্সিটি

প্রতিটি ঘর একবারই ঢোকে, প্রতিটি ঘরে চারটি প্রতিবেশী দেখা হয় — সময় \`O(h * w)\`, স্পেস \`O(h * w)\`।

## সাধারণ ভুল

- দেয়ালের ঘরে ঢুকে ফেলা — \`#\` চেক বাদ গেলে উত্তর কম আসে।
- সীমার বাইরে \`(r, c)\` দেখা — ম্যাপের কিনারায় ক্র্যাশ করে।
- কর্ণ দিয়ে চলা ঢোকানো — এখানে শুধু ৪ দিক বৈধ।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "BFS", "Grid"],
    tests: [
      { input: "3 3\nS.E\n.#.\n...\n", expectedOutput: "2\n", isSample: true },
      { input: "2 2\nS#\n#E\n", expectedOutput: "-1\n", isSample: true },
      { input: "1 5\nS..#E\n", expectedOutput: "-1\n", isSample: false },
      { input: "3 1\nS\n.\nE\n", expectedOutput: "2\n", isSample: false },
      { input: "3 4\nS.#.\n....\n..#E\n", expectedOutput: "5\n", isSample: false },
      {
        input: openGrid(300),
        expectedOutput: "598\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\n\ndef main():\n    lines = sys.stdin.read().split('\\n')\n    h, w = map(int, lines[0].split())\n    grid = [lines[1 + r] for r in range(h)]\n    sr = sc = er = ec = -1\n    for r in range(h):\n        for c in range(w):\n            if grid[r][c] == 'S':\n                sr, sc = r, c\n            elif grid[r][c] == 'E':\n                er, ec = r, c\n    dist = [[-1] * w for _ in range(h)]\n    dist[sr][sc] = 0\n    q = deque([(sr, sc)])\n    while q:\n        r, c = q.popleft()\n        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):\n            nr, nc = r + dr, c + dc\n            if 0 <= nr < h and 0 <= nc < w and grid[nr][nc] != '#' and dist[nr][nc] == -1:\n                dist[nr][nc] = dist[r][c] + 1\n                q.append((nr, nc))\n    print(dist[er][ec])\n\nmain()\n",
  },
  {
    slug: "learn-m4-graph-traversal-m3",
    title: "Prerequisite Cycle Check",
    statement: `কোর্স নিবন্ধন শুরুর আগে তানভির সিলেবাস যাচাই করছে: কোর্স \`u\` শেষ না করলে কোর্স \`v\` নেওয়া যায় না — এমন \`m\`টি একমুখী নিয়ম দেওয়া আছে। নিয়মগুলোতে যদি এমন চক্র থাকে যেখানে একটা কোর্স ঘুরে ঘুরে নিজেরই আগে হয়ে যায়, তাহলে কোনো কোর্সই শেষ করা যাবে না।

বলো নিয়মগুলোতে চক্র আছে কি না — থাকলে \`YES\`, না থাকলে \`NO\`।

উদাহরণ: নিয়ম \`1 → 2\`, \`2 → 3\`, \`3 → 1\` — চক্র আছে, উত্তর \`YES\`; নিয়ম \`1 → 2\`, \`2 → 3\` — চক্র নেই, উত্তর \`NO\`।`,
    inputFormat: `প্রথম লাইনে \`n m\`।
পরের \`m\` লাইনে প্রতিটিতে \`u v\` — \`u\` শেষ করলেই \`v\` নেওয়া যায় (একমুখী)।`,
    outputFormat: "চক্র থাকলে `YES`, না হলে `NO`।",
    constraints:
      "`1 <= n <= 100000`, `0 <= m <= 200000`\nএকমুখী নিয়ম; সেলফ-লুপ থাকতে পারে (`u = v`)।",
    editorial: `## ধারণা

চক্রবিহীন গ্রাফে (DAG) সবসময় এমন কোর্স থাকে যার কোনো আগের শর্ত নেই — তাকে নিলে তার পরের কোর্সের শর্ত-সংখ্যা এক কমে। Kahn-এর নিয়মে এভাবে একে একে সব কোর্স নামা যায়। কিন্তু চক্র থাকলে চক্রের কোনো কোর্সের শর্ত-সংখ্যা কখনোই শূন্য হয় না — একে অপরকেই অপেক্ষা করতে থাকে। তাই যতগুলো কোর্স নামানো গেল গুনো: সব \`n\`টি নামলে \`NO\`, কম নামলে \`YES\`।

## ধাপে ধাপে

1. প্রতিটি কোর্সের ভেতরে-ঢোকা শর্ত-সংখ্যা (indegree) গোনো।
2. যাদের শর্ত-সংখ্যা \`0\`, তাদের queue-তে বসাও।
3. প্রতিটি কোর্স তুলে গোনা বাড়াও; তার পরের কোর্সগুলোর শর্ত-সংখ্যা এক কমাও — শূন্য হলে queue-তে দাও।
4. গোনা সংখ্যা \`n\` হলে \`NO\`, না হলে \`YES\` ছাপাও।

\`\`\`python
import sys
from collections import deque

def main():
    data = sys.stdin.read().split()
    n, m = int(data[0]), int(data[1])
    adj = [[] for _ in range(n + 1)]
    indeg = [0] * (n + 1)
    for i in range(m):
        u, v = int(data[2 + 2 * i]), int(data[3 + 2 * i])
        adj[u].append(v)
        indeg[v] += 1
    q = deque(u for u in range(1, n + 1) if indeg[u] == 0)
    done = 0
    while q:
        u = q.popleft()
        done += 1
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    print('NO' if done == n else 'YES')

main()
\`\`\`

## কমপ্লেক্সিটি

প্রতিটি নোড একবার, প্রতিটি নিয়ম একবার — সময় \`O(n + m)\`, স্পেস \`O(n + m)\`।

## সাধারণ ভুল

- আনডিরেক্টেড ভেবে দুই দিকে edge যোগ করা — তাহলে প্রতিটি জোড়াই চক্র দেখায়।
- সেলফ-লুপ \`u = u\` বাদ দেওয়া — সেটাও চক্র; শর্ত-সংখ্যা কখনো শূন্য হয় না, ঠিকই ধরা পড়ে।
- শুধু নোড \`1\` থেকে ঘুরে চক্র খোঁজা — অন্য অংশে পড়ে থাকা চক্র মিস হয়; Kahn পুরো গ্রাফ দেখে।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Cycle Detection", "Topological Sort"],
    tests: [
      { input: "3 3\n1 2\n2 3\n3 1\n", expectedOutput: "YES\n", isSample: true },
      { input: "3 2\n1 2\n2 3\n", expectedOutput: "NO\n", isSample: true },
      { input: "1 1\n1 1\n", expectedOutput: "YES\n", isSample: false },
      { input: "4 2\n1 2\n3 4\n", expectedOutput: "NO\n", isSample: false },
      { input: "4 3\n1 2\n4 2\n2 1\n", expectedOutput: "YES\n", isSample: false },
      {
        input: `100000 99999\n${Array.from({ length: 99999 }, (_, i) => `${i + 1} ${i + 2}`).join("\n")}\n`,
        expectedOutput: "NO\n",
        isSample: false,
      },
      {
        input: `100000 100000\n${Array.from({ length: 99999 }, (_, i) => `${i + 1} ${i + 2}`).join("\n")}\n100000 1\n`,
        expectedOutput: "YES\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\n\ndef main():\n    data = sys.stdin.read().split()\n    n, m = int(data[0]), int(data[1])\n    adj = [[] for _ in range(n + 1)]\n    indeg = [0] * (n + 1)\n    for i in range(m):\n        u, v = int(data[2 + 2 * i]), int(data[3 + 2 * i])\n        adj[u].append(v)\n        indeg[v] += 1\n    q = deque(u for u in range(1, n + 1) if indeg[u] == 0)\n    done = 0\n    while q:\n        u = q.popleft()\n        done += 1\n        for v in adj[u]:\n            indeg[v] -= 1\n            if indeg[v] == 0:\n                q.append(v)\n    print('NO' if done == n else 'YES')\n\nmain()\n",
  },
  {
    slug: "learn-m4-graph-traversal-h2",
    title: "Maze with One Wall Break",
    statement: `নিরাপত্তা ড্রিলে সাদিয়া একটা মেজ পার হচ্ছে — \`.\` খোলা ঘর, \`#\` দেয়াল, \`S\` শুরু, \`E\` বেরোনোর দরজা; চলা যায় উপর, নিচ, বাম, ডান। হাতে একটাই হাতুড়ি: যাত্রার মধ্যে ঠিক একটা দেয়াল ভাঙা যাবে — একটার বেশি নয়, একটাও না ভাঙলেও চলবে।

দরজায় পৌঁছাতে সবচেয়ে কম কয়টি ধাপ লাগবে সেটি ছাপো; একটা দেয়াল ভেঙেও যদি পৌঁছানো না যায়, \`-1\`।

উদাহরণ: প্রথম সারি \`S#E\`, নিচের দুই সারি খোলা — দেয়াল না ভেঙে ঘুরে গেলে \`4\` ধাপ, কিন্তু মাঝের দেয়ালটা ভেঙে সোজা গেলে \`2\` ধাপ। উত্তর \`2\`।`,
    inputFormat: `প্রথম লাইনে \`h w\`।
পরের \`h\` লাইনে প্রতিটিতে \`w\`টি অক্ষর — \`. # S E\` থেকে গঠিত ম্যাপ।`,
    outputFormat: "এক লাইনে ন্যূনতম ধাপ, বা `-1`।",
    constraints:
      "`1 <= h, w <= 300`, `h * w <= 90000`\nম্যাপে ঠিক একটি `S` আর একটি `E` আছে, দুটো আলাদা ঘরে।",
    editorial: `## ধারণা

"দেয়াল ভেঙেছি কি না" — এই একটা অতিরিক্ত তথ্য প্রতিটি ঘরের সাথে জুড়ে দিলেই মেজটা একটা বড় গ্রাফ হয়ে যায়: অবস্থা \`(ঘর, ভাঙা হয়েছে কি)\`। অবস্থা ০ থেকে খোলা ঘরে গেলে অবস্থা ০-ই থাকে, আর দেয়ালে ঢুকতে চাইলে হাতুড়ি খরচ হয়ে অবস্থা ১-এ যেতে হয়; অবস্থা ১-এ দেয়ালে আর ঢোকা যায় না। এই দ্বিগুণ গ্রাফে BFS চালালে প্রতিটি অবস্থায় প্রথম পৌঁছানো ধাপই তার ন্যূনতম দূরত্ব — কারণ সব চলার খরচ এখনো সমান ১ ধাপ (ভাঙা মাত্র অবস্থা বদলায়, ধাপ বাড়ে একই রকম)।

## ধাপে ধাপে

1. \`dist[r][c][0/1]\` দুই স্তরের দূরত্ব গ্রিড \`-1\` দিয়ে নাও; \`dist[S][0] = 0\`।
2. Queue-তে \`(S, 0)\` বসাও।
3. প্রতিটি অবস্থা তুলে চার প্রতিবেশী দেখো: খোলা ঘরে একই অবস্থায় ঢোকো; দেয়ালে ঢুকতে চাইলে অবস্থা \`0\`-এ থাকতে হবে — তখন অবস্থা \`1\`-এ ঢুকো; অবস্থা \`1\`-এ দেয়াল বাদ।
4. প্রতিটি নতুন অবস্থায় দূরত্ব বসিয়ে queue-তে দাও।
5. শেষে \`E\`-এর দুই অবস্থার মধ্যে যেটা পাওয়া গেছে তার ছোটটা ছাপাও; দুটোই \`-1\` হলে \`-1\`।

\`\`\`python
import sys
from collections import deque

def main():
    lines = sys.stdin.read().split('\\n')
    h, w = map(int, lines[0].split())
    grid = [lines[1 + r] for r in range(h)]
    sr = sc = er = ec = -1
    for r in range(h):
        for c in range(w):
            if grid[r][c] == 'S':
                sr, sc = r, c
            elif grid[r][c] == 'E':
                er, ec = r, c
    dist = [[[-1, -1] for _ in range(w)] for _ in range(h)]
    dist[sr][sc][0] = 0
    q = deque([(sr, sc, 0)])
    while q:
        r, c, used = q.popleft()
        d = dist[r][c][used]
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if not (0 <= nr < h and 0 <= nc < w):
                continue
            if grid[nr][nc] == '#':
                if used == 0 and dist[nr][nc][1] == -1:
                    dist[nr][nc][1] = d + 1
                    q.append((nr, nc, 1))
            elif dist[nr][nc][used] == -1:
                dist[nr][nc][used] = d + 1
                q.append((nr, nc, used))
    a, b = dist[er][ec][0], dist[er][ec][1]
    if a == -1 and b == -1:
        print(-1)
    else:
        print(min(x for x in (a, b) if x != -1))

main()
\`\`\`

## কমপ্লেক্সিটি

অবস্থা দ্বিগুণ, তাই সময় ও স্পেস \`O(2 * h * w)\` — একই \`O(h * w)\` শ্রেণিতে।

## সাধারণ ভুল

- দেয়াল ভাঙা অবস্থাকে আলাদা গণনা না করা — দুই দেয়াল পাশ করা পথও ঢুকে পড়ে।
- ভাঙা দেয়ালের ঘরে আবার ঢুকতে চাওয়া — অবস্থা \`1\`-এ হাতুড়ি নেই, সেই চেক বাদ দিলে ভুল উত্তর আসে।
- ভাঙাটা "ফ্রি ধাপ" ভেবে ধাপ না বাড়ানো — ভাঙা ঘরে ঢোকাটাও এক ধাপ, সাধারণ চলার মতোই।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Graphs", "BFS", "State Expansion"],
    tests: [
      { input: "3 3\nS#E\n...\n...\n", expectedOutput: "2\n", isSample: true },
      { input: "2 2\nS.\n.E\n", expectedOutput: "2\n", isSample: true },
      { input: "1 4\nS##E\n", expectedOutput: "-1\n", isSample: false },
      { input: "1 3\nS#E\n", expectedOutput: "2\n", isSample: false },
      { input: "3 3\nS.E\n...\n...\n", expectedOutput: "2\n", isSample: false },
      {
        input: openGrid(300, 150),
        expectedOutput: "598\n",
        isSample: false,
      },
      {
        input: openGrid(300),
        expectedOutput: "598\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\n\ndef main():\n    lines = sys.stdin.read().split('\\n')\n    h, w = map(int, lines[0].split())\n    grid = [lines[1 + r] for r in range(h)]\n    sr = sc = er = ec = -1\n    for r in range(h):\n        for c in range(w):\n            if grid[r][c] == 'S':\n                sr, sc = r, c\n            elif grid[r][c] == 'E':\n                er, ec = r, c\n    dist = [[[-1, -1] for _ in range(w)] for _ in range(h)]\n    dist[sr][sc][0] = 0\n    q = deque([(sr, sc, 0)])\n    while q:\n        r, c, used = q.popleft()\n        d = dist[r][c][used]\n        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):\n            nr, nc = r + dr, c + dc\n            if not (0 <= nr < h and 0 <= nc < w):\n                continue\n            if grid[nr][nc] == '#':\n                if used == 0 and dist[nr][nc][1] == -1:\n                    dist[nr][nc][1] = d + 1\n                    q.append((nr, nc, 1))\n            elif dist[nr][nc][used] == -1:\n                dist[nr][nc][used] = d + 1\n                q.append((nr, nc, used))\n    a, b = dist[er][ec][0], dist[er][ec][1]\n    if a == -1 and b == -1:\n        print(-1)\n    else:\n        print(min(x for x in (a, b) if x != -1))\n\nmain()\n",
  },
];
