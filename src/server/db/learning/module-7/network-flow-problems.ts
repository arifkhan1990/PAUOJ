import type { SeedProblem } from "../../seed-problems";

const MENTOR_MAX_LINES = Array.from(
  { length: 400 },
  (_, i) =>
    Array.from({ length: 10 }, (_, j) => `${i + 1} ${(i + j) % 400 + 1}`).join(
      "\n",
    ),
).join("\n");

const PIPE_CAPS = Array.from({ length: 99999 }, (_, i) => 500 + (i % 3)).join(
  " ",
);

const FLOW_MAX_EDGES: string[] = [];
for (let i = 2; i <= 99; i++) {
  FLOW_MAX_EDGES.push(`1 ${i} 1000`);
  FLOW_MAX_EDGES.push(`${i} 100 1000`);
}
for (let i = 2; i <= 98; i++) {
  for (let j = i + 2; j <= 99; j++) {
    if ((i + j) % 5 === 0) FLOW_MAX_EDGES.push(`${i} ${j} 500`);
  }
}
const FLOW_MAX_INPUT = `100 ${FLOW_MAX_EDGES.length} 1 100\n${FLOW_MAX_EDGES.join("\n")}\n`;

const DECISION_EDGES: string[] = [];
for (let i = 2; i <= 59; i++) {
  DECISION_EDGES.push(`1 ${i} 500`);
  DECISION_EDGES.push(`${i} 60 500`);
}
const DECISION_GRAPH = `60 ${DECISION_EDGES.length} 1 60 29000\n${DECISION_EDGES.join("\n")}\n`;

export const NETWORK_FLOW_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m7-network-flow-g1",
    title: "Tiny Max Flow",
    statement:
      "রাফি ক্যাম্পাসের পানির পাইপ নেটওয়ার্কের ছোট একটা মডেল দিয়ে দেখছেন — কয়টা নোড, কোন নোড থেকে কোন নোডে পাইপ আছে এবং প্রতিটি পাইপে সর্বোচ্চ কত পানি যেতে পারে।\n\nনোড `1` হলো উৎস (source), নোড `n` হলো গন্তব্য (sink)। সবচেয়ে বেশি কত পানি একসাথে উৎস থেকে গন্তব্যে পৌঁছাতে পারবে সেটা প্রিন্ট করুন।\n\nউদাহরণ: তিন নোডের সরলরেখা `1 -> 2` (ক্ষমতা 5) আর `2 -> 3` (ক্ষমতা 4) হলে উত্তর `4` — সবচেয়ে কম ক্ষমতাটাই বাধা।",
    inputFormat:
      "প্রথম লাইনে `n` ও `m`। পরের `m` লাইনে প্রতিটিতে `u v c` — নোড `u` থেকে `n`-এ যাওয়া একটা দিকনির্দেশ পাইপ, ক্ষমতা `c`।",
    outputFormat: "সর্বোচ্চ ফ্লোএর মান এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`2 <= n <= 10`\n`0 <= m <= 20`\n`1 <= c <= 10^6`\nনোড নম্বর `1` থেকে `n`।",
    editorial:
      "### ধারণা\n\nএখানে গ্রাফ খুব ছোট, তাই সবচেয়ে সহজ ধারণাটাই কাজে লাগে: প্রতিধাপে `1` থেকে `n` পর্যন্ত এমন একটা পথ খুঁজুন যেখানে প্রতিটি এজে এখনো জায়গা আছে (residual capacity > 0)। পাওয়া পথে যত সম্ভব পাঠান — পথের সবচেয়ে কম ক্ষমতাটাই সেই ধাপের ফল। পথের সব এজে সেটুকু কমিয়ে দিন এবং ওল্টো দিকে উত্তর ধরে রাখুন (backward edge), যাতে ভুলভাবে পাঠানো ফ্লো ফিরিয়ে আনা যায়। আর কোনো পথ না পাওয়া গেলে এখনকার মোট ফ্লোই সর্বোচ্চ।\n\nছোট ইনপুটে প্রতিটি ধাপে BFS দিয়ে পথ খোঁজা যায়; উত্তর একই থাকে যেকোনো সঠিক max-flow অ্যালগরিদম দিয়ে।\n\n### ধাপে ধাপে\n\n1. প্রতিটি এজ `u -> v` যোগ করুন, সাথে সাথে `v -> u` ক্ষমতা ০ সহ একটা residual edge রাখুন।\n2. BFS দিয়ে `1` থেকে `n` পর্যন্ত পথ খুঁজুন (প্রতিটি এজে residual capacity শূন্যের বেশি হতে হবে)।\n3. পথ পেলে পথের সবচেয়ে কম capacity বের করে সেটুকু ফ্লো পাঠান।\n4. residual গ্রাফ হালনাগাদ করুন, মোটে যোগ করুন।\n5. পথ না পেলে মোট ফ্লো প্রিন্ট করে থামুন।\n\n```python\nimport sys\nfrom collections import deque\ndata = list(map(int, sys.stdin.read().split()))\nn, m = data[0], data[1]\nidx = 2\ng = [[] for _ in range(n + 1)]\nfor _ in range(m):\n    u, v, c = data[idx], data[idx + 1], data[idx + 2]\n    idx += 3\n    g[u].append([v, c, len(g[v])])\n    g[v].append([u, 0, len(g[u]) - 1])\nflow = 0\nwhile True:\n    parent = [-1] * (n + 1)\n    edge_id = [-1] * (n + 1)\n    parent[1] = 1\n    q = deque([1])\n    while q and parent[n] == -1:\n        u = q.popleft()\n        for i, (v, cap, rev) in enumerate(g[u]):\n            if cap > 0 and parent[v] == -1:\n                parent[v] = u\n                edge_id[v] = i\n                q.append(v)\n    if parent[n] == -1:\n        break\n    push = 10**18\n    v = n\n    while v != 1:\n        u = parent[v]\n        push = min(push, g[u][edge_id[v]][1])\n        v = u\n    v = n\n    while v != 1:\n        u = parent[v]\n        i = edge_id[v]\n        g[u][i][1] -= push\n        g[v][g[u][i][2]][1] += push\n        v = u\n    flow += push\nprint(flow)\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(V * E^2)` (Edmonds-Karp), এখানে `V <= 10`, `E <= 20` তাই তাৎক্ষণিক। স্পেস `O(V + E)`।\n\n### সাধারণ ভুল\n\n- প্রতিটি ধাপে সবচেয়ে বড় capacity-ই পাঠানো — ভুল; পথের সবচেয়ে কম capacity মাপা জরুরি।\n- Backward edge না রাখা — কিছু গ্রাফে উত্তর ছোট এসে যায় (যেমন দুইটা পাশাপাশি পথ যা একটা কমন এজ ভাগ করে)।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Network Flow", "Max Flow"],
    tests: [
      {
        input: "4 5\n1 2 3\n1 3 2\n2 3 1\n2 4 2\n3 4 4\n",
        expectedOutput: "5\n",
        isSample: true,
      },
      { input: "3 2\n1 2 5\n2 3 4\n", expectedOutput: "4\n", isSample: true },
      { input: "2 0\n", expectedOutput: "0\n", isSample: false },
      { input: "2 1\n1 2 7\n", expectedOutput: "7\n", isSample: false },
      {
        input: "2 3\n1 2 2\n1 2 3\n1 2 4\n",
        expectedOutput: "9\n",
        isSample: false,
      },
      {
        input: "4 4\n1 2 1\n1 3 1\n2 4 1\n3 4 1\n",
        expectedOutput: "2\n",
        isSample: false,
      },
      {
        input: "4 5\n1 2 10\n1 3 10\n2 3 1\n2 4 10\n3 4 10\n",
        expectedOutput: "20\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\ndata = list(map(int, sys.stdin.read().split()))\nn, m = data[0], data[1]\nidx = 2\ng = [[] for _ in range(n + 1)]\nfor _ in range(m):\n    u, v, c = data[idx], data[idx + 1], data[idx + 2]\n    idx += 3\n    g[u].append([v, c, len(g[v])])\n    g[v].append([u, 0, len(g[u]) - 1])\nflow = 0\nwhile True:\n    parent = [-1] * (n + 1)\n    edge_id = [-1] * (n + 1)\n    parent[1] = 1\n    q = deque([1])\n    while q and parent[n] == -1:\n        u = q.popleft()\n        for i, (v, cap, rev) in enumerate(g[u]):\n            if cap > 0 and parent[v] == -1:\n                parent[v] = u\n                edge_id[v] = i\n                q.append(v)\n    if parent[n] == -1:\n        break\n    push = 10**18\n    v = n\n    while v != 1:\n        u = parent[v]\n        push = min(push, g[u][edge_id[v]][1])\n        v = u\n    v = n\n    while v != 1:\n        u = parent[v]\n        i = edge_id[v]\n        g[u][i][1] -= push\n        g[v][g[u][i][2]][1] += push\n        v = u\n    flow += push\nprint(flow)\n",
  },
  {
    slug: "learn-m7-network-flow-g2",
    title: "Match the Mentors",
    statement:
      "নুসরাত মেন্টর আর শিক্ষার্থীদের জোড়া দিচ্ছেন। কোন মেন্টর কোন শিক্ষার্থীকে গাইড করতে পারবেন সেই তালিকা দেওয়া থাকবে। একজন মেন্টর সর্বোচ্চ একজন শিক্ষার্থীকে এবং একজন শিক্ষার্থী সর্বোচ্চ একজন মেন্টরের সাথে জোড়া পাবেন।\n\nসবচেয়ে বেশি কয়টা জোড়া তৈরি করা যায় সেটা প্রিন্ট করুন।\n\nউদাহরণ: দুই মেন্টর `1`, `2` এবং শিক্ষার্থী `1`, `2`; শুধু জোড়া হলো `1-1` আর `1-2` — মেন্টর `2` কারো সাথে মেলে না, তাই উত্তর `1`।",
    inputFormat:
      "প্রথম লাইনে `n`, `m` ও `k` — মেন্টর সংখ্যা, শিক্ষার্থী সংখ্যা এবং বৈধ জোড়ার সংখ্যা। পরের `k` লাইনে প্রতিটিতে `a b` — মেন্টর `a` শিক্ষার্থী `b`-কে গাইড করতে পারেন।",
    outputFormat: "সর্বোচ্চ ম্যাচিংয়ের আকার এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= n <= 10`\n`1 <= m <= 10`\n`0 <= k <= 50`\nমেন্টর নম্বর `1..n`, শিক্ষার্থী নম্বর `1..m`।",
    editorial:
      "### ধারণা\n\nএটা একটা ছোট bipartite matching সমস্যা। বাঁ পাশে মেন্টর, ডান পাশে শিক্ষার্থী। একজন মেন্টরকে একজন শিক্ষার্থীর সাথে দেওয়া যায় যদি সেই জোড়া তালিকায় থাকে এবং সেই শিক্ষার্থী এখন খালি থাকে। গ্রিডি ভাবে প্রথমজনকে প্রথম খালি শিক্ষার্থী দিলে ভুল হতে পারে — পরেরজনের জন্য সেই শিক্ষার্থীটাই একমাত্র হতে পারে। তাই প্রতিটি মেন্টরের জন্য augmenting path খুঁজা হয়: বর্তমান জোড়া ভাঙা যায় কিনা দেখে নতুন জোড়া বানানো।\n\n### ধাপে ধাপে\n\n1. প্রতিটি মেন্টরের জন্য পছন্দের শিক্ষার্থীদের তালিকা রাখুন।\n2. `matchR[v]` = শিক্ষার্থী `v`-এর সাথে এখন যে মেন্টর জোড়া (শূন্য = খালি)।\n3. মেন্টর `u`-এর জন্য DFS: কোনো শিক্ষার্থী `v` খালি হলে জোড়া দিন; ব্যস্ত হলে `v`-এর বর্তমান মেন্টরকে অন্য জায়গায় সরিয়ে চেষ্টা করুন।\n4. সফল হলে কাউন্টার `1` বাড়ান।\n5. সব মেন্টরের পর কাউন্টার প্রিন্ট করুন।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn, m, k = data[0], data[1], data[2]\nedges = [[] for _ in range(n + 1)]\nidx = 3\nfor _ in range(k):\n    edges[data[idx]].append(data[idx + 1])\n    idx += 2\nmatch_r = [0] * (m + 1)\ndef dfs(u, seen):\n    for v in edges[u]:\n        if seen[v]:\n            continue\n        seen[v] = True\n        if match_r[v] == 0 or dfs(match_r[v], seen):\n            match_r[v] = u\n            return True\n    return False\nresult = 0\nfor u in range(1, n + 1):\n    if dfs(u, [False] * (m + 1)):\n        result += 1\nprint(result)\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n * k)` (প্রতিটি মেন্টরের জন্য একটা DFS, প্রতি DFS সর্বোচ্চ `k` এজ)। স্পেস `O(n + m + k)`। এখানে `n, m <= 10` তাই তাৎক্ষণিক।\n\n### সাধারণ ভুল\n\n- গ্রিডি ম্যাচিং: `1 1`, `1 2`, `2 1` ইনপুটে মেন্টর `1`-কে শিক্ষার্থী `1` দিলে উত্তর `1` আসবে, কিন্তু সঠিক উত্তর `2` (`1-2`, `2-1`)।\n- প্রতিটি DFS-এ `seen` অ্যারে নতুন করে না বানালে একই শিক্ষার্থী বারবার ঘুরে অসীম লুপ বা ভুল ফল আসে।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Bipartite Matching"],
    tests: [
      {
        input: "3 3 3\n1 1\n2 2\n3 3\n",
        expectedOutput: "3\n",
        isSample: true,
      },
      { input: "2 2 2\n1 1\n1 2\n", expectedOutput: "1\n", isSample: true },
      { input: "1 1 0\n", expectedOutput: "0\n", isSample: false },
      {
        input: "3 1 3\n1 1\n2 1\n3 1\n",
        expectedOutput: "1\n",
        isSample: false,
      },
      {
        input: "2 2 4\n1 1\n1 2\n2 1\n2 2\n",
        expectedOutput: "2\n",
        isSample: false,
      },
      {
        input: "3 3 5\n1 1\n1 2\n2 2\n2 3\n3 3\n",
        expectedOutput: "3\n",
        isSample: false,
      },
      {
        input: "2 2 3\n1 1\n1 2\n2 1\n",
        expectedOutput: "2\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, m, k = data[0], data[1], data[2]\nedges = [[] for _ in range(n + 1)]\nidx = 3\nfor _ in range(k):\n    edges[data[idx]].append(data[idx + 1])\n    idx += 2\nmatch_r = [0] * (m + 1)\ndef dfs(u, seen):\n    for v in edges[u]:\n        if seen[v]:\n            continue\n        seen[v] = True\n        if match_r[v] == 0 or dfs(match_r[v], seen):\n            match_r[v] = u\n            return True\n    return False\nresult = 0\nfor u in range(1, n + 1):\n    if dfs(u, [False] * (m + 1)):\n        result += 1\nprint(result)\n",
  },
  {
    slug: "learn-m7-network-flow-e1",
    title: "Pipeline Bottleneck",
    statement:
      "ল্যাব ঘর থেকে সার্ভার রুম পর্যন্ত পানির পাইপগুলো সরলরেখায় সাজানো: ঘর `1` থেকে `2`, `2` থেকে `3` — এভাবে ক্রমানুসারে একটার পর একটা। প্রতিটি সংযোগে সর্বোচ্চ কত পানি যেতে পারে তা দেওয়া থাকবে।\n\nসমগ্র রাস্তা দিয়ে একসাথে কত পানি চলতে পারবে — সেটাই প্রিন্ট করুন। যে সংযোগটাই সবচেয়ে কম পানি দিতে পারে, ঠিক সেটুকুই পুরো রাস্তার সীমা।\n\nউদাহরণ: ক্ষমতা `5 3 8` হলে উত্তর `3`।",
    inputFormat:
      "প্রথম লাইনে `n`। দ্বিতীয় লাইনে `n - 1`টি পূর্ণসংখ্যা — `1 -> 2`, `2 -> 3`, ..., `(n-1) -> n` সংযোগগুলোর ক্ষমতা।",
    outputFormat: "পুরো রাস্তার সর্বোচ্চ প্রবাহ মান এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`2 <= n <= 100000`\n`1 <= capacity <= 10^9`",
    editorial:
      "### ধারণা\n\nসারল্যাইন পাইপে পানি যেকোনো সংযোগ দিয়ে যেতে পারে, কিন্তু পুরো রাস্তায় একসাথে যাওয়ার পরিমাণ সবচেয়ে কম ক্ষমতাটাকে ছাড়তে পারে না — নাহলে সেই সংযোগটি ভেঙে যায়। তাই উত্তর হলো সব ক্ষমতার সর্বনিম্ন, অর্থাৎ `min`। এটাই এখানে সর্বোচ্চ ফ্লোও — কারণ source থেকে বের হওয়া একমাত্র রাস্তাটাই ফাঁকি দিচ্ছে সবচেয়ে সংকীর্ণ জায়গাটা।\n\n### ধাপে ধাপে\n\n1. `n` আর পরের লাইনের `n - 1` ক্ষমতা পড়ে নিন।\n2. ক্ষমতাগুলোর মধ্যে সবচেয়ে ছোটটা বের করুন।\n3. সেটা প্রিন্ট করুন।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nprint(min(data[1:]))\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n)` এক বার ঘুরে, স্পেস `O(n)` ইনপুট ধরে (একসাথে পড়লে)। `n = 100000`-এ সহজে চলে।\n\n### সাধারণ ভুল\n\n- শুধু প্রথম ক্ষমতাটাই ধরে নেওয়া — সীমাটা যেকোনো সংযোগে হতে পারে, তাই পুরো তালিকার `min` লাগবে।\n- যোগফল বা গড় বের করা — সমস্যাটা পাইপের ধারা, বাঁধাগুলো একসাথে কাজ করে না।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Greedy", "Implementation", "Network Flow"],
    tests: [
      { input: "4\n5 3 8\n", expectedOutput: "3\n", isSample: true },
      { input: "2\n10\n", expectedOutput: "10\n", isSample: true },
      { input: "3\n1 1\n", expectedOutput: "1\n", isSample: false },
      { input: "5\n9 7 5 3\n", expectedOutput: "3\n", isSample: false },
      { input: "4\n7 2 9\n", expectedOutput: "2\n", isSample: false },
      {
        input: `6\n${"1000000000 ".repeat(5).trim()}\n`,
        expectedOutput: "1000000000\n",
        isSample: false,
      },
      {
        input: `100000\n${PIPE_CAPS}\n`,
        expectedOutput: "500\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nprint(min(data[1:]))\n",
  },
  {
    slug: "learn-m7-network-flow-m1",
    title: "Lab Slot Assignment",
    statement:
      "সাদিয়া ল্যাব সেশনের সময়সূচি বানাচ্ছেন। কয়জন শিক্ষার্থী কোন কোন সময়স্লটে বসতে পারবেন সেই তালিকা দেওয়া থাকবে। একটা স্লটে একজনের বেশি বসতে পারবে না, আর একজন শিক্ষার্থী একটার বেশি স্লট পাবে না।\n\nসবচেয়ে বেশি কয়জন শিক্ষার্থীকে স্লট দেওয়া যায় সেটা প্রিন্ট করুন।\n\nউদাহরণ: তিনজন শিক্ষার্থী, দুইটা স্লট; জোড়া হলো `1-1`, `1-2`, `2-1`, `3-2` — সেরা পরিকল্পনায় `2` জন বসবে (`1-1` আর `3-2`, অথবা `1-2` আর `2-1`)।",
    inputFormat:
      "প্রথম লাইনে `n`, `m` ও `k` — শিক্ষার্থী সংখ্যা, স্লট সংখ্যা এবং বৈধ জোড়ার সংখ্যা। পরের `k` লাইনে প্রতিটিতে `a b` — শিক্ষার্থী `a` স্লট `b`-তে বসতে পারবেন।",
    outputFormat: "সর্বোচ্চ ম্যাচিংয়ের আকার এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= n <= 400`\n`1 <= m <= 400`\n`0 <= k <= 20000`\nএকই জোড়া একাধিকবার আসতে পারে।",
    editorial:
      "### ধারণা\n\nএটা bipartite matching-এর মূল সমস্যা। বাঁ পাশে শিক্ষার্থী, ডান পাশে স্লট। Kuhn's algorithm প্রতিটি শিক্ষার্থীর জন্য একটা augmenting path খোঁজে: পছন্দের স্লট খালি থাকলে সরাসরি জোড়া দেওয়া যায়, ব্যস্ত থাকলে সেই স্লটের বর্তমান শিক্ষার্থীকে অন্য স্লটে সরিয়ে দেওয়া যায় কিনা দেখা হয়। এভাবে প্রতিটি শিক্ষার্থী যতটুকু সম্ভব জুড়ে যায়, আর ফলটাই সর্বোচ্চ ম্যাচিং।\n\n### ধাপে ধাপে\n\n1. প্রতিটি শিক্ষার্থীর জন্য পছন্দের স্লটের তালিকা বানান (একাধিক এজ থাকলেও চলবে)।\n2. `matchR[v]` = স্লট `v`-তে বর্তমানে যে শিক্ষার্থী (০ = খালি)।\n3. প্রতিটি শিক্ষার্থী `u`-এর জন্য নতুন `seen` দিয়ে DFS চালান; সফল হলে কাউন্টার বাড়ান।\n4. কাউন্টার প্রিন্ট করুন।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn, m, k = data[0], data[1], data[2]\nedges = [[] for _ in range(n + 1)]\nidx = 3\nfor _ in range(k):\n    edges[data[idx]].append(data[idx + 1])\n    idx += 2\nmatch_r = [0] * (m + 1)\ndef dfs(u, seen):\n    for v in edges[u]:\n        if seen[v]:\n            continue\n        seen[v] = True\n        if match_r[v] == 0 or dfs(match_r[v], seen):\n            match_r[v] = u\n            return True\n    return False\nresult = 0\nfor u in range(1, n + 1):\n    if dfs(u, [False] * (m + 1)):\n        result += 1\nprint(result)\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n * k)`, স্পেস `O(n + m + k)`। এখানে সর্বোচ্চ `400 * 20000 = 8 * 10^6` ধাপ — Python-এও এক সেকেন্ডের কাছাকাছি বা কম সময়ে চলে।\n\n### সাধারণ ভুল\n\n- গ্রিডি জোড়া: প্রতিটি শিক্ষার্থীকে প্রথম খালি স্লট দিলে উত্তর ছোট এসে যেতে পারে। উদাহরণ: শিক্ষার্থী `1`-এর পছন্দ `1, 2`, শিক্ষার্থী `2`-এর পছন্দ শুধু `1` — গ্রিডি `1-1` দিলে `2` বাদ পড়ে, অথচ সঠিক উত্তর `2`।\n- প্রতিটি DFS-এ `seen` শেয়ার করে ফেলা — তখন একটা ব্যর্থ প্রচেষ্টার পর পরবর্তী শিক্ষার্থী ঠিক করা স্লটগুলো ঘুরতেই পারে না।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Bipartite Matching", "Greedy"],
    tests: [
      {
        input: "3 2 4\n1 1\n1 2\n2 1\n3 2\n",
        expectedOutput: "2\n",
        isSample: true,
      },
      { input: "1 1 1\n1 1\n", expectedOutput: "1\n", isSample: true },
      { input: "4 4 0\n", expectedOutput: "0\n", isSample: false },
      {
        input: "2 3 6\n1 1\n1 2\n1 3\n2 1\n2 2\n2 3\n",
        expectedOutput: "2\n",
        isSample: false,
      },
      {
        input: "3 3 5\n1 1\n1 2\n2 1\n2 3\n3 3\n",
        expectedOutput: "3\n",
        isSample: false,
      },
      {
        input: "3 2 3\n1 1\n2 1\n3 2\n",
        expectedOutput: "2\n",
        isSample: false,
      },
      {
        input: `400 400 4000\n${MENTOR_MAX_LINES}\n`,
        expectedOutput: "400\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, m, k = data[0], data[1], data[2]\nedges = [[] for _ in range(n + 1)]\nidx = 3\nfor _ in range(k):\n    edges[data[idx]].append(data[idx + 1])\n    idx += 2\nmatch_r = [0] * (m + 1)\ndef dfs(u, seen):\n    for v in edges[u]:\n        if seen[v]:\n            continue\n        seen[v] = True\n        if match_r[v] == 0 or dfs(match_r[v], seen):\n            match_r[v] = u\n            return True\n    return False\nresult = 0\nfor u in range(1, n + 1):\n    if dfs(u, [False] * (m + 1)):\n        result += 1\nprint(result)\n",
  },
  {
    slug: "learn-m7-network-flow-h1",
    title: "Campus Water Network",
    statement:
      "ক্যাম্পাসের পানির নেটওয়ার্ক এবার বড়: অনেকগুলো ট্যাংক, অনেকগুলো পাইপ, আর প্রতিটি পাইপে নিজস্ব ক্ষমতা। নোড `s` থেকে নোড `t`-এ একসাথে সর্বোচ্চ কত পানি পৌঁছাতে পারবে সেটা বের করুন।\n\nপানি যেকোনো পথ দিয়ে যেতে পারে, একাধিকবার একই পাইপও ব্যবহার করা যায় (যতক্ষণ ক্ষমতা বাকি), আর আগে পাঠানো অংশ পেছনেও ফেরানো যায় — তবেই সঠিক উত্তর পাওয়া যায়।\n\nউদাহরণ: উপরের টপিক নোটের ছোট গ্রাফটিতে উত্তর `5`।",
    inputFormat:
      "প্রথম লাইনে `n`, `m`, `s`, `t`। পরের `m` লাইনে প্রতিটিতে `u v c` — নোড `u` থেকে `v`-তে দিকনির্দেশ পাইপ, ক্ষমতা `c`।",
    outputFormat: "সর্বোচ্চ ফ্লোএর মান এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= n <= 100`\n`0 <= m <= 2000`\n`1 <= s, t <= n`, `s != t`\n`1 <= c <= 10^9`\nএকই দিকে একাধিক পাইপ থাকতে পারে।",
    editorial:
      "### ধারণা\n\nMax-flow সমস্যাটা ধাপে ধাপে augmenting path দিয়ে সমাধান হয়, কিন্তু বড় গ্রাফে প্রতিবার BFS করে একটা করে ফ্লো পাঠালে ধীর হয়। Dinic's algorithm এখানে দুই ধাপে কাজ করে: প্রথমে BFS দিয়ে level graph বানায় (সবচেয়ে ছোট দূরত্বের পথগুলো), তারপর সেই level মেনে DFS দিয়ে একাধিক পথ একসাথে পাঠায়। প্রতিটি এজের সাথে residual backward edge থাকে, তাই ভুল ফ্লো ফিরিয়ে আনা যায়। শেষ পর্যন্ত যখন `t` level graph-এ আসে না, তখন আর কোনো পথ নেই — ফ্লো সর্বোচ্চ।\n\n### ধাপে ধাপে\n\n1. প্রতিটি `u v c` যোগ করুন: `u`-এর তালিকায় `[v, c, rev]`, `v`-এর তালিকায় `[u, 0, rev]`।\n2. BFS দিয়ে `s` থেকে সব নোডের level বানান (শুধু `cap > 0` এজ ধরে)।\n3. `t`-এর level না থাকলে লুপ শেষ, মোট ফ্লো প্রিন্ট করুন।\n4. প্রতিটি নোডের জন্য pointer রেখে DFS চালান: `level[v] == level[u] + 1` এবং `cap > 0` হলে যত সম্ভব পাঠান।\n5. এক ধাপে একটিও না পাঠালে নতুন level graph বানিয়ে আবার শুরু করুন।\n\n```python\nimport sys\nfrom collections import deque\ndata = sys.stdin.read().split()\nit = iter(data)\nn = int(next(it)); m = int(next(it))\ns = int(next(it)); t = int(next(it))\ng = [[] for _ in range(n + 1)]\nfor _ in range(m):\n    u = int(next(it)); v = int(next(it)); c = int(next(it))\n    g[u].append([v, c, len(g[v])])\n    g[v].append([u, 0, len(g[u]) - 1])\ntotal = 0\nINF = 10**18\nwhile True:\n    level = [-1] * (n + 1)\n    level[s] = 0\n    q = deque([s])\n    while q:\n        u = q.popleft()\n        for v, cap, rev in g[u]:\n            if cap > 0 and level[v] == -1:\n                level[v] = level[u] + 1\n                q.append(v)\n    if level[t] == -1:\n        break\n    ptr = [0] * (n + 1)\n    def dfs(u, f):\n        if u == t:\n            return f\n        while ptr[u] < len(g[u]):\n            v, cap, rev = g[u][ptr[u]]\n            if cap > 0 and level[v] == level[u] + 1:\n                pushed = dfs(v, min(f, cap))\n                if pushed:\n                    g[u][ptr[u]][1] -= pushed\n                    g[v][rev][1] += pushed\n                    return pushed\n            ptr[u] += 1\n        return 0\n    while True:\n        pushed = dfs(s, INF)\n        if not pushed:\n            break\n        total += pushed\nprint(total)\n```\n\n### কমপ্লেক্সিটি\n\nসময় সাধারণত `O(E * sqrt(V))` থেকে `O(V^2 * E)`-এর মধ্যে; এখানে `V <= 100`, `E <= 2000` তাই সহজে চলে। স্পেস `O(V + E)`।\n\n### সাধারণ ভুল\n\n- পাশাপাশি পাইপ একসাথে যোগ করে ফেলা: প্রতিটি পাইপ আলাদা residual edge হিসেবে রাখতে হবে, নাহলে উত্তর ছোট আসে।\n- level check ছাড়া DFS: যেকোনো residual path ধরে নিলে ফল ভুল হতে পারে এবং লুপেও যেতে পারে।\n- `ptr[u]` বাড়ানো ভুলে গেলে একই এজ বারবার ঘুরে অনন্ত লুপ, বা কাজ শেষ না হয়।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Network Flow", "Max Flow", "Dinic"],
    tests: [
      {
        input: "4 5 1 4\n1 2 3\n1 3 2\n2 3 1\n2 4 2\n3 4 4\n",
        expectedOutput: "5\n",
        isSample: true,
      },
      { input: "3 1 1 3\n1 2 10\n", expectedOutput: "0\n", isSample: true },
      { input: "2 1 1 2\n1 2 5\n", expectedOutput: "5\n", isSample: false },
      {
        input: "2 2 1 2\n1 2 3\n1 2 4\n",
        expectedOutput: "7\n",
        isSample: false,
      },
      {
        input: "4 5 1 4\n1 2 10\n1 3 10\n2 3 1\n2 4 10\n3 4 10\n",
        expectedOutput: "20\n",
        isSample: false,
      },
      {
        input: "4 2 1 4\n1 2 5\n3 2 5\n",
        expectedOutput: "0\n",
        isSample: false,
      },
      { input: FLOW_MAX_INPUT, expectedOutput: "98000\n", isSample: false },
    ],
    referencePython:
      "import sys\nfrom collections import deque\ndata = sys.stdin.read().split()\nit = iter(data)\nn = int(next(it)); m = int(next(it))\ns = int(next(it)); t = int(next(it))\ng = [[] for _ in range(n + 1)]\nfor _ in range(m):\n    u = int(next(it)); v = int(next(it)); c = int(next(it))\n    g[u].append([v, c, len(g[v])])\n    g[v].append([u, 0, len(g[u]) - 1])\ntotal = 0\nINF = 10**18\nwhile True:\n    level = [-1] * (n + 1)\n    level[s] = 0\n    q = deque([s])\n    while q:\n        u = q.popleft()\n        for v, cap, rev in g[u]:\n            if cap > 0 and level[v] == -1:\n                level[v] = level[u] + 1\n                q.append(v)\n    if level[t] == -1:\n        break\n    ptr = [0] * (n + 1)\n    def dfs(u, f):\n        if u == t:\n            return f\n        while ptr[u] < len(g[u]):\n            v, cap, rev = g[u][ptr[u]]\n            if cap > 0 and level[v] == level[u] + 1:\n                pushed = dfs(v, min(f, cap))\n                if pushed:\n                    g[u][ptr[u]][1] -= pushed\n                    g[v][rev][1] += pushed\n                    return pushed\n            ptr[u] += 1\n        return 0\n    while True:\n        pushed = dfs(s, INF)\n        if not pushed:\n            break\n        total += pushed\nprint(total)\n",
  },
  {
    slug: "learn-m7-network-flow-x1",
    title: "Perfect Assignment?",
    statement:
      "ভলান্টিয়ার সমন্বয়কারী নাফিসা জানতে চান — কি প্রতিটি মেন্টরকে একটা করে শিক্ষার্থী দেওয়া সম্ভব? অর্থাৎ কোনো মেন্টর ফাঁকা না রেখে সবাইকে জোড়া দেওয়া যায় কিনা।\n\nমেন্টরের সংখ্যা শিক্ষার্থীর সংখ্যার সমান বা কম ধরা হবে। সম্ভব হলে `YES`, নাহলে `NO` প্রিন্ট করুন।\n\nউদাহরণ: মেন্টর `1`, `2` এবং শিক্ষার্থী `1`, `2`; জোড়া শুধু `1-1`, `1-2` হলে মেন্টর `2` ফাঁকা থাকবে → `NO`।",
    inputFormat:
      "প্রথম লাইনে `n`, `m` ও `k`। পরের `k` লাইনে প্রতিটিতে `a b` — মেন্টর `a` শিক্ষার্থী `b`-কে গাইড করতে পারেন।",
    outputFormat: "সম্ভব হলে `YES`, নাহলে `NO` এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= n <= 400`\n`n <= m <= 400`\n`0 <= k <= 20000`",
    editorial:
      "### ধারণা\n\nসম্পূর্ণ ম্যাচিং পাওয়া যায় কিনা — সাধারণ bipartite matching চালিয়ে ম্যাচিংয়ের মান `n` কিনা দেখলেই হয়। মান `n` মানে প্রতিটি মেন্টর একটা করে শিক্ষার্থী পেয়েছেন, কারণ বাঁ পাশের সবাই জুড়ে গেছে। গ্রিডি ভাবে প্রতিটি মেন্টরকে প্রথম খালি শিক্ষার্থী দিলে উত্তর ভুল হতে পারে, তাই augmenting path-ই চালতে হবে।\n\n### ধাপে ধাপে\n\n1. প্রতিটি মেন্টরের পছন্দের শিক্ষার্থীদের তালিকা বানান।\n2. Kuhn's algorithm দিয়ে সর্বোচ্চ ম্যাচিং বের করুন।\n3. মান `== n` হলে `YES`, নাহলে `NO`।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn, m, k = data[0], data[1], data[2]\nedges = [[] for _ in range(n + 1)]\nidx = 3\nfor _ in range(k):\n    edges[data[idx]].append(data[idx + 1])\n    idx += 2\nmatch_r = [0] * (m + 1)\ndef dfs(u, seen):\n    for v in edges[u]:\n        if seen[v]:\n            continue\n        seen[v] = True\n        if match_r[v] == 0 or dfs(match_r[v], seen):\n            match_r[v] = u\n            return True\n    return False\nresult = 0\nfor u in range(1, n + 1):\n    if dfs(u, [False] * (m + 1)):\n        result += 1\nprint('YES' if result == n else 'NO')\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n * k)`, স্পেস `O(n + m + k)`। `n = 400`, `k = 20000`-এও সহজে চলে।\n\n### সাধারণ ভুল\n\n- ম্যাচিংয়ের মান `m`-এর সাথে তুলনা করা — চাওয়া হয়েছে সব মেন্টর (`n`) জুড়ানো, শিক্ষার্থী নয়।\n- কোনো মেন্টরের খালি পছন্দ তালিকা থাকলে (`k = 0` বা কোনো এজ নেই) সঙ্গে সঙ্গে `NO` বলা যায় — নাহলে DFS অকার্যকর প্রচেষ্টায় সময় নষ্ট হয়।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Bipartite Matching"],
    tests: [
      { input: "2 2 2\n1 1\n2 2\n", expectedOutput: "YES\n", isSample: true },
      { input: "2 2 2\n1 1\n1 2\n", expectedOutput: "NO\n", isSample: true },
      { input: "1 1 0\n", expectedOutput: "NO\n", isSample: false },
      {
        input: "3 3 3\n1 1\n2 2\n3 3\n",
        expectedOutput: "YES\n",
        isSample: false,
      },
      {
        input: "2 2 3\n1 1\n1 2\n2 1\n",
        expectedOutput: "YES\n",
        isSample: false,
      },
      {
        input: "3 4 2\n1 1\n2 2\n",
        expectedOutput: "NO\n",
        isSample: false,
      },
      {
        input: `400 400 4000\n${MENTOR_MAX_LINES}\n`,
        expectedOutput: "YES\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, m, k = data[0], data[1], data[2]\nedges = [[] for _ in range(n + 1)]\nidx = 3\nfor _ in range(k):\n    edges[data[idx]].append(data[idx + 1])\n    idx += 2\nmatch_r = [0] * (m + 1)\ndef dfs(u, seen):\n    for v in edges[u]:\n        if seen[v]:\n            continue\n        seen[v] = True\n        if match_r[v] == 0 or dfs(match_r[v], seen):\n            match_r[v] = u\n            return True\n    return False\nresult = 0\nfor u in range(1, n + 1):\n    if dfs(u, [False] * (m + 1)):\n        result += 1\nprint('YES' if result == n else 'NO')\n",
  },
  {
    slug: "learn-m7-network-flow-x2",
    title: "Can We Send K Units?",
    statement:
      "ইন্টারনেট ব্যাকআপ লিংকে অ্যাডমিন জানতে চান — উৎস থেকে গন্তব্যে অন্তত `K` ইউনিট ডেটা একসাথে পাঠানো সম্ভব কিনা। প্রতিটা লিংকের ক্ষমতা দেওয়া থাকবে।\n\nসর্বোচ্চ ফ্লো যদি `K` বা তার বেশি হয়, তাহলে `YES`, অন্যথায় `NO`।\n\nউদাহরণ: ক্ষমতা `4`, `3`, `2`-এর তিনটা লিংক দিয়ে সর্বোচ্চ `5` যায়; `K = 5` হলে `YES`, `K = 6` হলে `NO`।",
    inputFormat:
      "প্রথম লাইনে `n`, `m`, `s`, `t`, `K`। পরের `m` লাইনে প্রতিটিতে `u v c`।",
    outputFormat: "সম্ভব হলে `YES`, নাহলে `NO` এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= n <= 60`\n`0 <= m <= 800`\n`1 <= s, t <= n`, `s != t`\n`1 <= c <= 10^6`\n`1 <= K <= 10^9`",
    editorial:
      "### ধারণা\n\nএটা সরাসরি max-flow সমস্যার decision রূপ: প্রথমে সর্বোচ্চ ফ্লো বের করুন, তারপর শুধু `flow >= K` কিনা যাচাই করুন। সম্ভব হলেও কারণ বানানো লাগে না, শুধু মানটা কাজে লাগে। Dinic বা Edmonds-Karp যেকোনোটা চলবে; ছোট গ্রাফে BFS-ভিত্তিক পথ খোঁজাই যথেষ্ট।\n\n### ধাপে ধাপে\n\n1. গ্রাফ residual edge সহ বানান।\n2. `s` থেকে `t` পর্যন্ত augmenting path না থাকা পর্যন্ত ফ্লো পাঠিয়ে মোট ফ্লো সংগ্রহ করুন।\n3. মোট `>= K` হলে `YES`, নাহলে `NO`।\n\n```python\nimport sys\nfrom collections import deque\ndata = sys.stdin.read().split()\nit = iter(data)\nn = int(next(it)); m = int(next(it))\ns = int(next(it)); t = int(next(it)); K = int(next(it))\ng = [[] for _ in range(n + 1)]\nfor _ in range(m):\n    u = int(next(it)); v = int(next(it)); c = int(next(it))\n    g[u].append([v, c, len(g[v])])\n    g[v].append([u, 0, len(g[u]) - 1])\ntotal = 0\nwhile True:\n    parent = [-1] * (n + 1)\n    edge_id = [-1] * (n + 1)\n    parent[s] = s\n    q = deque([s])\n    while q and parent[t] == -1:\n        u = q.popleft()\n        for i, (v, cap, rev) in enumerate(g[u]):\n            if cap > 0 and parent[v] == -1:\n                parent[v] = u\n                edge_id[v] = i\n                q.append(v)\n    if parent[t] == -1:\n        break\n    push = 10**18\n    v = t\n    while v != s:\n        u = parent[v]\n        push = min(push, g[u][edge_id[v]][1])\n        v = u\n    v = t\n    while v != s:\n        u = parent[v]\n        i = edge_id[v]\n        g[u][i][1] -= push\n        g[v][g[u][i][2]][1] += push\n        v = u\n    total += push\nprint('YES' if total >= K else 'NO')\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(V * E^2)` (Edmonds-Karp), এখানে `V <= 60`, `E <= 800`। স্পেস `O(V + E)`। ফ্লো যদি ছোট হয়, কাজ আরও দ্রুত শেষ হয়।\n\n### সাধারণ ভুল\n\n- `K = flow` হলেও `NO` দেওয়া — শর্ত `>=`, সমান হলেও সম্ভব।\n- Sink পৌঁছানো না গেলে লুপ অব্যাহত রাখা — পথ না পেলে সঙ্গে সঙ্গে থামতে হবে, নাহলে অনন্ত লুপ।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Network Flow", "Max Flow"],
    tests: [
      {
        input: "3 3 1 3 5\n1 2 4\n2 3 3\n1 3 2\n",
        expectedOutput: "YES\n",
        isSample: true,
      },
      {
        input: "3 3 1 3 6\n1 2 4\n2 3 3\n1 3 2\n",
        expectedOutput: "NO\n",
        isSample: true,
      },
      {
        input: "2 1 1 2 10\n1 2 4\n",
        expectedOutput: "NO\n",
        isSample: false,
      },
      {
        input: "2 1 1 2 4\n1 2 4\n",
        expectedOutput: "YES\n",
        isSample: false,
      },
      { input: "3 0 1 3 1\n", expectedOutput: "NO\n", isSample: false },
      {
        input: `${DECISION_GRAPH}`,
        expectedOutput: "YES\n",
        isSample: false,
      },
      {
        input: `60 ${DECISION_EDGES.length} 1 60 29001\n${DECISION_EDGES.join("\n")}\n`,
        expectedOutput: "NO\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\ndata = sys.stdin.read().split()\nit = iter(data)\nn = int(next(it)); m = int(next(it))\ns = int(next(it)); t = int(next(it)); K = int(next(it))\ng = [[] for _ in range(n + 1)]\nfor _ in range(m):\n    u = int(next(it)); v = int(next(it)); c = int(next(it))\n    g[u].append([v, c, len(g[v])])\n    g[v].append([u, 0, len(g[u]) - 1])\ntotal = 0\nwhile True:\n    parent = [-1] * (n + 1)\n    edge_id = [-1] * (n + 1)\n    parent[s] = s\n    q = deque([s])\n    while q and parent[t] == -1:\n        u = q.popleft()\n        for i, (v, cap, rev) in enumerate(g[u]):\n            if cap > 0 and parent[v] == -1:\n                parent[v] = u\n                edge_id[v] = i\n                q.append(v)\n    if parent[t] == -1:\n        break\n    push = 10**18\n    v = t\n    while v != s:\n        u = parent[v]\n        push = min(push, g[u][edge_id[v]][1])\n        v = u\n    v = t\n    while v != s:\n        u = parent[v]\n        i = edge_id[v]\n        g[u][i][1] -= push\n        g[v][g[u][i][2]][1] += push\n        v = u\n    total += push\nprint('YES' if total >= K else 'NO')\n",
  },
];
