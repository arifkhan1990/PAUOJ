import type { SeedProblem } from "../../seed-problems";
import { nAndNumbers } from "../generated-tests";

const M2_CUT_EDGES = Array.from({ length: 40 }, (_, j) => {
  const a = 2 + j * 3;
  return `1 ${a} 100\n${a} ${a + 1} 7\n${a + 1} ${a + 2} 100\n${a + 2} 122 100`;
}).join("\n");

const M3_PAIRS = Array.from({ length: 200 }, (_, i) =>
  Array.from({ length: 100 }, (_, t) => `${i + 1} ${((i * 100 + t) % 200) + 1}`),
).flat();

const H2_PAIR_PROFIT = Array.from({ length: 75 }, () => `1000 -700`).join(" ");
const H2_PAIR_DEPS = Array.from({ length: 75 }, (_, j) => `${2 * j + 1} ${2 * j + 2}`).join("\n");

export const NETWORK_FLOW_PRACTICE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m7-network-flow-e2",
    title: "Escape Routes",
    statement:
      "নিরাপত্তা দল ক্যাম্পাসের ম্যাপ নিয়ে বসেছিল: কোন করিডোর দিয়ে কোন বিল্ডিংয়ে যাওয়া যায়। জরুরি অবস্থায় একই করিডোর দিয়ে দুইটা ভিন্ন দল পাঠানো যাবে না — প্রতিটি করিডোর মাত্র একবারই ব্যবহার হবে। রফি জানতে চাইলেন, বিল্ডিং `1` (উৎস) থেকে বিল্ডিং `n` (গন্তব্য) একসাথে সর্বোচ্চ কয়টা স্বতন্ত্র পথ বানানো যায় — দুইটা পথ স্বতন্ত্র মানে তারা কোনো করিডোর ভাগ করে না।\n\nকরিডোরগুলো দিকনির্দেশ। সংখ্যাটা প্রিন্ট করো।\n\nউদাহরণ: `1 -> 2`, `1 -> 3`, `2 -> 4`, `3 -> 4` — দুইটা স্বতন্ত্র পথ (`1-2-4` আর `1-3-4`), তাই উত্তর `2`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `m`। পরের `m` লাইনে প্রতিটিতে `u v` — বিল্ডিং `u` থেকে `v`-তে একটা দিকনির্দেশ করিডোর।",
    outputFormat: "সর্বোচ্চ স্বতন্ত্র পথের সংখ্যা এক লাইনে প্রিন্ট করো।",
    constraints:
      "`2 <= n <= 30`\n`0 <= m <= 500`\n`1 <= u, v <= n`, `u != v`।",
    editorial:
      "## ধারণা\n\nপ্রতিটি করিডোর একবারই ব্যবহার হবে — এটা max-flow-এর ভাষায় প্রতিটি এজের capacity `1`। তাহলে সর্বোচ্চ স্বতন্ত্র পথ = প্রতিটি এজে capacity `1` রেখে উৎস থেকে গন্তব্যে max flow। প্রতিটি augmenting path ঠিক একটা নতুন পথ যোগ করে, আর করিডোরের বাকি ক্ষমতা শেষ হলে সেটা আর কোনো পথে ব্যবহার হয় না। ছোট গ্রাফে BFS দিয়ে একটা একটা পথ খুঁজে পাঠালেই ফল সর্বোচ্চ হয় — residual এজ ভুল পাঠানো পথ পেছনে ফেরানোর সুযোগ দেয়।\n\n## ধাপে ধাপে\n\n1. প্রতিটি `u v` এজ যোগ করো — capacity `1`; সাথে `v -> u` capacity `0` residual এজ।\n2. BFS দিয়ে `1` থেকে `n` পর্যন্ত খালি করিডোর দিয়ে একটা পথ খোঁজো।\n3. পথ পেলে সেই পথে ফ্লো `1` পাঠাও — পথের এজগুলোর বাকি ক্ষমতা `1` কমাও, উল্টো এজ `1` বাড়াও।\n4. পথ না পেলে থামো; মোট পাঠানো পথের সংখ্যাই উত্তর।\n\n```python\nimport sys\nfrom collections import deque\ndata = list(map(int, sys.stdin.read().split()))\nn, m = data[0], data[1]\ng = [[] for _ in range(n + 1)]\nidx = 2\nfor _ in range(m):\n    u, v = data[idx], data[idx + 1]\n    idx += 2\n    g[u].append([v, 1, len(g[v])])\n    g[v].append([u, 0, len(g[u]) - 1])\nflow = 0\nwhile True:\n    parent = [-1] * (n + 1)\n    edge_id = [-1] * (n + 1)\n    parent[1] = 1\n    q = deque([1])\n    while q and parent[n] == -1:\n        u = q.popleft()\n        for i, (v, cap, rev) in enumerate(g[u]):\n            if cap > 0 and parent[v] == -1:\n                parent[v] = u\n                edge_id[v] = i\n                q.append(v)\n    if parent[n] == -1:\n        break\n    v = n\n    while v != 1:\n        u = parent[v]\n        g[u][edge_id[v]][1] -= 1\n        g[v][g[u][edge_id[v]][2]][1] += 1\n        v = u\n    flow += 1\nprint(flow)\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(m * (n + m))` — সর্বোচ্চ `m`টা পথ, প্রতিটি খুঁজতে একবার BFS। এই ছোট সীমায় তাৎক্ষণিক।\n\n## সাধারণ ভুল\n\n- **দুই দিকের করিডোর গুলিয়ে ফেলা:** `u -> v` আর `v -> u` দুইটা আলাদা করিডোর; যোগ করার সময় আলাদা রাখো, residual এজের সাথে মেশাবে না।\n- **প্রথম পাওয়া পথগুলোর সেটকেই সর্বোচ্চ ভাবা:** গ্রিডি সেট আটকে যেতে পারে; flow-এর মতো ধাপে ধাপে পাঠালে residual এজ ভুল পথ ফেরতের সুযোগ দেয়, তাই ফল সর্বদা সর্বোচ্চ।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Network Flow", "Max Flow"],
    tests: [
      { input: "2 0\n", expectedOutput: "0\n", isSample: true },
      {
        input: "4 4\n1 2\n1 3\n2 4\n3 4\n",
        expectedOutput: "2\n",
        isSample: true,
      },
      { input: "2 1\n1 2\n", expectedOutput: "1\n", isSample: false },
      {
        input: "4 3\n1 2\n2 3\n3 4\n",
        expectedOutput: "1\n",
        isSample: false,
      },
      {
        input: "3 3\n1 2\n2 1\n2 3\n",
        expectedOutput: "1\n",
        isSample: false,
      },
      {
        input: "5 6\n1 2\n2 3\n3 5\n1 4\n4 5\n2 4\n",
        expectedOutput: "2\n",
        isSample: false,
      },
      {
        input: `30 40\n${Array.from({ length: 20 }, (_, j) => `1 ${j + 2}\n${j + 2} 30`).join("\n")}\n`,
        expectedOutput: "20\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\ndata = list(map(int, sys.stdin.read().split()))\nn, m = data[0], data[1]\ng = [[] for _ in range(n + 1)]\nidx = 2\nfor _ in range(m):\n    u, v = data[idx], data[idx + 1]\n    idx += 2\n    g[u].append([v, 1, len(g[v])])\n    g[v].append([u, 0, len(g[u]) - 1])\nflow = 0\nwhile True:\n    parent = [-1] * (n + 1)\n    edge_id = [-1] * (n + 1)\n    parent[1] = 1\n    q = deque([1])\n    while q and parent[n] == -1:\n        u = q.popleft()\n        for i, (v, cap, rev) in enumerate(g[u]):\n            if cap > 0 and parent[v] == -1:\n                parent[v] = u\n                edge_id[v] = i\n                q.append(v)\n    if parent[n] == -1:\n        break\n    v = n\n    while v != 1:\n        u = parent[v]\n        g[u][edge_id[v]][1] -= 1\n        g[v][g[u][edge_id[v]][2]][1] += 1\n        v = u\n    flow += 1\nprint(flow)\n",
  },
  {
    slug: "learn-m7-network-flow-e3",
    title: "Bound of Two Ends",
    statement:
      "পানির ট্যাংক থেকে ক্যাম্পাসের রিজার্ভার পর্যন্ত নেটওয়ার্ক বসানো হয়েছিল। ট্যাংক থেকে বের হওয়া পাইপগুলোর ক্ষমতা এক তালিকায়, রিজার্ভারে ঢোকার পাইপগুলোর ক্ষমতা আরেক তালিকায়। ভেতরের সব পাইপ যথেষ্ট চওড়া — সেগুলো কখনোই বাধা হয় না। সাদিয়া জানতে চাইলেন সর্বোচ্চ কত পানি একসাথে ট্যাংক থেকে রিজার্ভারে পাঠানো যায়।\n\nভেতরে কোনো বাধা না থাকায় ফ্লো কেবল দুই জায়গায় আটকে পারে: ট্যাংক থেকে মোট যত বের হতে পারে, আর রিজার্ভারে মোট যত ঢুকতে পারে। দুইয়ের ছোটটা প্রিন্ট করো।\n\nউদাহরণ: ট্যাংকের পাইপ `3 5` (মোট `8`), রিজার্ভারের পাইপ `10 4` (মোট `14`) → উত্তর `8`।",
    inputFormat:
      "প্রথম লাইনে `n` — ট্যাংক থেকে বের হওয়া পাইপের সংখ্যা। দ্বিতীয় লাইনে `n`টি ক্ষমতা। তৃতীয় লাইনে `m` — রিজার্ভারে ঢোকার পাইপের সংখ্যা। চতুর্থ লাইনে `m`টি ক্ষমতা।",
    outputFormat: "সর্বোচ্চ ফ্লো এক লাইনে প্রিন্ট করো।",
    constraints: "`1 <= n, m <= 100000`\n`1 <= capacity <= 10^9`",
    editorial:
      "## ধারণা\n\nসর্বোচ্চ ফ্লো কখনোই উৎস থেকে বের হওয়া পাইপগুলোর ক্ষমতার যোগফল ছাড়াতে পারে না — বের হওয়ার রাস্তাই তার ঊর্ধ্বসীমা। একইভাবে গন্তব্যে ঢোকার পাইপগুলোর যোগফলও একটা ঊর্ধ্বসীমা। ভেতরের পাইপের ক্ষমতা সীমাহীন ধরা হলে এই দুই ঊর্ধ্বসীমা ছাড়া আর কোনো বাধা থাকে না, তাই সর্বোচ্চ ফ্লো ঠিক দুই যোগফলের ছোটটা। মনে রাখো — সাধারণ নেটওয়ার্কে এই মান কেবল ঊর্ধ্বসীমা হতে পারে, কিন্তু এখানে ভেতরের অক্ষমতাহীন ধারার শর্তই উত্তরকে ওই মানে আটকে দেয়।\n\n## ধাপে ধাপে\n\n1. চার লাইন পড়ে দুই দল ক্ষমতা নাও।\n2. প্রতিটি দলের যোগফল বের করো।\n3. ছোটটা প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nout_sum = sum(data[1:1 + n])\nm = data[1 + n]\nin_sum = sum(data[2 + n:2 + n + m])\nprint(min(out_sum, in_sum))\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n + m)`, স্পেস `O(n + m)` ইনপুট ধরে।\n\n## সাধারণ ভুল\n\n- **দুই যোগফলের বড়টা ছাপানো** — বাধা সবসময় সরু দিকে।\n- **যেকোনো নেটওয়ার্কে সূত্রটা খাটানো:** ভেতরের পাইপে ক্ষমতা থাকলে উত্তর আরও ছোট হতে পারে; তখন আসল max-flow চালাতে হবে।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Network Flow", "Math"],
    tests: [
      {
        input: "2\n3 5\n2\n10 4\n",
        expectedOutput: "8\n",
        isSample: true,
      },
      { input: "1\n7\n1\n7\n", expectedOutput: "7\n", isSample: true },
      { input: "1\n5\n2\n2 3\n", expectedOutput: "5\n", isSample: false },
      {
        input: "3\n10 10 10\n1\n100\n",
        expectedOutput: "30\n",
        isSample: false,
      },
      {
        input: "2\n1 1\n3\n1 1 1\n",
        expectedOutput: "2\n",
        isSample: false,
      },
      {
        input: "1\n1000000000\n1\n999999999\n",
        expectedOutput: "999999999\n",
        isSample: false,
      },
      {
        input: `${nAndNumbers(100000, Array.from({ length: 100000 }, () => 1000000000))}${nAndNumbers(100000, Array.from({ length: 100000 }, () => 1000000000))}`,
        expectedOutput: "100000000000000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nout_sum = sum(data[1:1 + n])\nm = data[1 + n]\nin_sum = sum(data[2 + n:2 + n + m])\nprint(min(out_sum, in_sum))\n",
  },
  {
    slug: "learn-m7-network-flow-m2",
    title: "Least Pipes to Cut",
    statement:
      "ক্যাম্পাসের পানির নেটওয়ার্কে উৎস `s` থেকে গন্তব্য `t`-তে পানি চলছে, আর রক্ষণাবেক্ষণ দলকে পুরো প্রবাহ বন্ধ করতে হবে। একটা পাইপ বন্ধ করার খরচ ঠিক তার capacity-র সমান। তানভির জানতে চাইলেন — সবচেয়ে কম খরচে কোন পাইপগুলো বন্ধ করলে `s` থেকে `t`-তে আর কোনো পথ থাকবে না।\n\nসেই ন্যূনতম খরচের মান প্রিন্ট করো।\n\nউদাহরণ: source `1`, sink `4` এবং পাইপ `1 -> 2` (ক্ষমতা `3`), `1 -> 3` (ক্ষমতা `2`), `2 -> 3` (ক্ষমতা `1`), `2 -> 4` (ক্ষমতা `2`), `3 -> 4` (ক্ষমতা `4`) — পাইপ `1 -> 2` আর `1 -> 3` বন্ধ করলে খরচ `5`, এর কমে হয় না।",
    inputFormat:
      "প্রথম লাইনে `n`, `m`, `s`, `t`। পরের `m` লাইনে প্রতিটিতে `u v c` — `u` থেকে `v`-তে দিকনির্দেশ পাইপ, ক্ষমতা `c`।",
    outputFormat: "ন্যূনতম মোট খরচ এক লাইনে প্রিন্ট করো।",
    constraints:
      "`1 <= n <= 100`\n`0 <= m <= 2000`\n`1 <= s, t <= n`, `s != t`\n`1 <= c <= 10^9`\nএকই দিকে একাধিক পাইপ থাকতে পারে।",
    editorial:
      "## ধারণা\n\nmax-flow min-cut উপপাদ্যের সরাসরি প্রয়োগ। পাইপ বন্ধ করা মানে source-পাশের নোডগুলো এক ভাগে আর sink-পাশের নোডগুলো আরেক ভাগে রেখে মাঝের পাইপগুলো কেটে ফেলা — এই ভাগ বেছে নেওয়াকেই cut বলে। কাটার পাইপগুলোর ক্ষমতার যোগফলই খরচ, আর উপপাদ্য বলে সবচেয়ে ছোট cut-এর খরচ ঠিক সর্বোচ্চ flow-এর সমান। তাই Dinic দিয়ে max flow বের করলেই ন্যূনতম খরচ পাওয়া যায় — কোন পাইপগুলো কাটবে সেটা আলাদা করে বের করা লাগে না, শুধু মানটা চাওয়া।\n\n## ধাপে ধাপে\n\n1. প্রতিটি `u v c` এজ যোগ করো, সাথে capacity `0` residual এজ।\n2. BFS দিয়ে level graph বানাও; `t` না পাওয়া গেলে থামো।\n3. level মেনে DFS দিয়ে যত সম্ভব ফ্লো পাঠাও, pointer দিয়ে এজ বারবার ঘোরা এড়াও।\n4. মোট ফ্লোই ন্যূনতম খরচ — প্রিন্ট করো।\n\n```python\nimport sys\nfrom collections import deque\ndata = sys.stdin.read().split()\nit = iter(data)\nn = int(next(it)); m = int(next(it))\ns = int(next(it)); t = int(next(it))\ng = [[] for _ in range(n + 1)]\nfor _ in range(m):\n    u = int(next(it)); v = int(next(it)); c = int(next(it))\n    g[u].append([v, c, len(g[v])])\n    g[v].append([u, 0, len(g[u]) - 1])\nINF = 10 ** 18\ntotal = 0\nwhile True:\n    level = [-1] * (n + 1)\n    level[s] = 0\n    q = deque([s])\n    while q:\n        u = q.popleft()\n        for v, cap, rev in g[u]:\n            if cap > 0 and level[v] == -1:\n                level[v] = level[u] + 1\n                q.append(v)\n    if level[t] == -1:\n        break\n    ptr = [0] * (n + 1)\n    def dfs(u, f):\n        if u == t:\n            return f\n        while ptr[u] < len(g[u]):\n            v, cap, rev = g[u][ptr[u]]\n            if cap > 0 and level[v] == level[u] + 1:\n                pushed = dfs(v, min(f, cap))\n                if pushed:\n                    g[u][ptr[u]][1] -= pushed\n                    g[v][rev][1] += pushed\n                    return pushed\n            ptr[u] += 1\n        return 0\n    while True:\n        pushed = dfs(s, INF)\n        if not pushed:\n            break\n        total += pushed\nprint(total)\n```\n\n## কমপ্লেক্সিটি\n\n`O(V^2 * E)` (Dinic); এই সীমায় (`V <= 100`, `E <= 2000`) Python-এও দ্রুত চলে।\n\n## সাধারণ ভুল\n\n- **এক একটা পথের সরু পাইপ কাটা:** একটা পথ আটকালে নতুন পথ বেরিয়ে আসে; সবচেয়ে সস্তা cut পুরো নেটওয়ার্ক একসাথে দেখে বাছতে হয়।\n- **সব পাইপ কেটে ফেলা:** সেটাও একটা cut, কিন্তু প্রায় সবসময়ই তার চেয়ে সস্তা কোনো না কোনো ভাগ আছে।\n- **`s` থেকে `t`-তে কোনো পথ না থাকলে বড় উত্তর দেওয়া:** পথ না থাকলে খরচ `0` — কিছুই কাটতে হয় না।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Network Flow", "Min Cut"],
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
        input: "4 4 1 4\n1 2 1\n1 3 1\n2 4 1\n3 4 1\n",
        expectedOutput: "2\n",
        isSample: false,
      },
      {
        input: "4 5 1 4\n1 2 10\n1 3 10\n2 3 1\n2 4 10\n3 4 10\n",
        expectedOutput: "20\n",
        isSample: false,
      },
      {
        input: `122 160 1 122\n${M2_CUT_EDGES}\n`,
        expectedOutput: "280\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\ndata = sys.stdin.read().split()\nit = iter(data)\nn = int(next(it)); m = int(next(it))\ns = int(next(it)); t = int(next(it))\ng = [[] for _ in range(n + 1)]\nfor _ in range(m):\n    u = int(next(it)); v = int(next(it)); c = int(next(it))\n    g[u].append([v, c, len(g[v])])\n    g[v].append([u, 0, len(g[u]) - 1])\nINF = 10 ** 18\ntotal = 0\nwhile True:\n    level = [-1] * (n + 1)\n    level[s] = 0\n    q = deque([s])\n    while q:\n        u = q.popleft()\n        for v, cap, rev in g[u]:\n            if cap > 0 and level[v] == -1:\n                level[v] = level[u] + 1\n                q.append(v)\n    if level[t] == -1:\n        break\n    ptr = [0] * (n + 1)\n    def dfs(u, f):\n        if u == t:\n            return f\n        while ptr[u] < len(g[u]):\n            v, cap, rev = g[u][ptr[u]]\n            if cap > 0 and level[v] == level[u] + 1:\n                pushed = dfs(v, min(f, cap))\n                if pushed:\n                    g[u][ptr[u]][1] -= pushed\n                    g[v][rev][1] += pushed\n                    return pushed\n            ptr[u] += 1\n        return 0\n    while True:\n        pushed = dfs(s, INF)\n        if not pushed:\n            break\n        total += pushed\nprint(total)\n",
  },
  {
    slug: "learn-m7-network-flow-m3",
    title: "Seating with Capacity",
    statement:
      "ল্যাবে এবার একটা স্লটে একাধিক কম্পিউটার — স্লট `j`-তে সর্বোচ্চ `c_j` জন শিক্ষার্থী বসতে পারবে। কে কোন স্লটে বসতে পারবে সেই জোড়ার তালিকাও দেওয়া আছে। একজন শিক্ষার্থী পাবে ঠিক একটা স্লট (বা কিছুই না)। সাদিয়া জানতে চাইলেন সব মিলিয়ে সর্বোচ্চ কয়জনকে বসানো যায়।\n\nসর্বোচ্চ সংখ্যাটা প্রিন্ট করো।\n\nউদাহরণ: ৩ জন শিক্ষার্থী, ২টা স্লট, ক্ষমতা `2 2`; জোড়া `1-1`, `1-2`, `2-1`, `3-2` — সবাইকে বসানো যায় → উত্তর `3`।",
    inputFormat:
      "প্রথম লাইনে `n`, `m` ও `k`। দ্বিতীয় লাইনে `m`টি পূর্ণসংখ্যা — প্রতিটি স্লটের ক্ষমতা। পরের `k` লাইনে প্রতিটিতে `a b` — শিক্ষার্থী `a` স্লট `b`-তে বসতে পারবে।",
    outputFormat: "সর্বোচ্চ বসানো শিক্ষার্থীর সংখ্যা এক লাইনে প্রিন্ট করো।",
    constraints:
      "`1 <= n, m <= 200`\n`1 <= c_j <= 200`\n`0 <= k <= 20000`\nএকই জোড়া একাধিকবার আসতে পারে।",
    editorial:
      "## ধারণা\n\nএটা bipartite matching-এর capacity-সংস্করণ, আর flow দিয়েই স্বাভাবিক ভাবে মডেল হয়। source থেকে প্রতিটি শিক্ষার্থীতে capacity `1` (একজন পাবে মাত্র একটা স্লট), শিক্ষার্থী থেকে তার বৈধ স্লটে capacity `1`, আর প্রতিটি স্লট থেকে sink-এ capacity `c_j` (একটা স্লটে বসবে সর্বোচ্চ ততজন)। এই নেটওয়ার্কের সর্বোচ্চ flow-ই সর্বোচ্চ বসানো শিক্ষার্থীর সংখ্যা — ফ্লোর প্রতিটি একক পথ একজন শিক্ষার্থীকে একটা স্লটে বসিয়ে দেয়, আর এজের capacity-গুলো ঠিক সেই নিয়মগুলোই জারি করে থাকে। Kuhn-এর মতো একজন-একজন মিলানো সরাসরি খাটে না — একটা স্লটে একাধিক জন বসার সুযোগ থাকায় এখানে Dinic-ই নিরাপদ।\n\n## ধাপে ধাপে\n\n1. নোড সাজাও: source `0`, শিক্ষার্থী `1..n`, স্লট `n+1..n+m`, sink `n+m+1`।\n2. তিন ধরনের এজ যোগ করো: source→শিক্ষার্থী (capacity `1`), জোড়া অনুযায়ী শিক্ষার্থী→স্লট (capacity `1`), স্লট→sink (capacity `c_j`)।\n3. Dinic চালিয়ে max flow বের করো; সেটাই উত্তর।\n\n```python\nimport sys\nfrom collections import deque\ndata = sys.stdin.read().split()\nit = iter(data)\nn = int(next(it)); m = int(next(it)); k = int(next(it))\ncaps = [int(next(it)) for _ in range(m)]\nN = n + m + 2\ng = [[] for _ in range(N)]\ndef add(u, v, c):\n    g[u].append([v, c, len(g[v])])\n    g[v].append([u, 0, len(g[u]) - 1])\nfor i in range(1, n + 1):\n    add(0, i, 1)\nfor _ in range(k):\n    a = int(next(it)); b = int(next(it))\n    add(a, n + b, 1)\nfor j in range(1, m + 1):\n    add(n + j, N - 1, caps[j - 1])\ns, t = 0, N - 1\nINF = 10 ** 18\ntotal = 0\nwhile True:\n    level = [-1] * N\n    level[s] = 0\n    q = deque([s])\n    while q:\n        u = q.popleft()\n        for v, cap, rev in g[u]:\n            if cap > 0 and level[v] == -1:\n                level[v] = level[u] + 1\n                q.append(v)\n    if level[t] == -1:\n        break\n    ptr = [0] * N\n    def dfs(u, f):\n        if u == t:\n            return f\n        while ptr[u] < len(g[u]):\n            v, cap, rev = g[u][ptr[u]]\n            if cap > 0 and level[v] == level[u] + 1:\n                pushed = dfs(v, min(f, cap))\n                if pushed:\n                    g[u][ptr[u]][1] -= pushed\n                    g[v][rev][1] += pushed\n                    return pushed\n            ptr[u] += 1\n        return 0\n    while True:\n        pushed = dfs(s, INF)\n        if not pushed:\n            break\n        total += pushed\nprint(total)\n```\n\n## কমপ্লেক্সিটি\n\n`O(V^2 * E)` (Dinic), এখানে `V <= 402`, `E <= 20400` — ফ্লো ছোট হওয়ায় বাস্তবে আরও দ্রুত।\n\n## সাধারণ ভুল\n\n- **স্লটের ক্ষমতা বাদ দিয়ে সাধারণ matching চালানো:** তখন একটা স্লটে `c_j`-এর বেশি জন বসিয়ে ফেলে।\n- **জোড়া একাধিকবার এলে এজ বাদ দেওয়া:** একই জোড়া দুইবার যোগ করলেও ক্ষতি নেই — capacity যোগ হয় না, ফ্লো একই থাকে; আলাদা যত্ন নিতে হয় না।\n- **`k = 0` কেস:** কোনো জোড়া না থাকলে উত্তর `0` — মাঝের এজ না থাকায় ফ্লোই শূন্য।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Network Flow", "Bipartite Matching"],
    tests: [
      {
        input: "3 2 4\n2 2\n1 1\n1 2\n2 1\n3 2\n",
        expectedOutput: "3\n",
        isSample: true,
      },
      {
        input: "2 1 2\n1\n1 1\n2 1\n",
        expectedOutput: "1\n",
        isSample: true,
      },
      { input: "4 4 0\n1 1 1 1\n", expectedOutput: "0\n", isSample: false },
      {
        input: "10 3 10\n2 2 2\n1 1\n2 1\n3 1\n4 2\n5 2\n6 2\n7 3\n8 3\n9 3\n10 3\n",
        expectedOutput: "6\n",
        isSample: false,
      },
      {
        input: "2 2 3\n1 1\n1 1\n1 1\n2 2\n",
        expectedOutput: "2\n",
        isSample: false,
      },
      {
        input: "1 1 1\n5\n1 1\n",
        expectedOutput: "1\n",
        isSample: false,
      },
      {
        input: `200 50 200\n${Array.from({ length: 50 }, () => "1").join(" ")}\n${Array.from({ length: 200 }, (_, i) => `${i + 1} ${(i % 50) + 1}`).join("\n")}\n`,
        expectedOutput: "50\n",
        isSample: false,
      },
      {
        input: `200 200 20000\n${Array.from({ length: 200 }, () => "2").join(" ")}\n${M3_PAIRS.join("\n")}\n`,
        expectedOutput: "200\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\ndata = sys.stdin.read().split()\nit = iter(data)\nn = int(next(it)); m = int(next(it)); k = int(next(it))\ncaps = [int(next(it)) for _ in range(m)]\nN = n + m + 2\ng = [[] for _ in range(N)]\ndef add(u, v, c):\n    g[u].append([v, c, len(g[v])])\n    g[v].append([u, 0, len(g[u]) - 1])\nfor i in range(1, n + 1):\n    add(0, i, 1)\nfor _ in range(k):\n    a = int(next(it)); b = int(next(it))\n    add(a, n + b, 1)\nfor j in range(1, m + 1):\n    add(n + j, N - 1, caps[j - 1])\ns, t = 0, N - 1\nINF = 10 ** 18\ntotal = 0\nwhile True:\n    level = [-1] * N\n    level[s] = 0\n    q = deque([s])\n    while q:\n        u = q.popleft()\n        for v, cap, rev in g[u]:\n            if cap > 0 and level[v] == -1:\n                level[v] = level[u] + 1\n                q.append(v)\n    if level[t] == -1:\n        break\n    ptr = [0] * N\n    def dfs(u, f):\n        if u == t:\n            return f\n        while ptr[u] < len(g[u]):\n            v, cap, rev = g[u][ptr[u]]\n            if cap > 0 and level[v] == level[u] + 1:\n                pushed = dfs(v, min(f, cap))\n                if pushed:\n                    g[u][ptr[u]][1] -= pushed\n                    g[v][rev][1] += pushed\n                    return pushed\n            ptr[u] += 1\n        return 0\n    while True:\n        pushed = dfs(s, INF)\n        if not pushed:\n            break\n        total += pushed\nprint(total)\n",
  },
  {
    slug: "learn-m7-network-flow-h2",
    title: "Feature Launch Plan",
    statement:
      "নুসরাতের টিম পরের রিলিজের ফিচার তালিকা বাছাই করছিল। প্রতিটি ফিচারের একটা করে হিসাব আছে — কোনোটা লাভ দেবে (ধনাত্মক সংখ্যা), কোনোটার খরচ বেশি (ঋণাত্মক সংখ্যা)। নির্ভরতাও আছে: জোড়া `u v` মানে ফিচার `u` নিলে `v`-ও নিতেই হবে। টিম যেকোনো সাবসেট বাছতে পারবে (খালি সেটও চলবে), শুধু নির্ভরতার শর্ত ভাঙা যাবে না।\n\nনেওয়া ফিচারগুলোর হিসাবের যোগফল সর্বোচ্চ কত হতে পারে সেটা প্রিন্ট করো।\n\nউদাহরণ: ৩টা ফিচার, হিসাব `5 -3 4`, নির্ভরতা `1 2` (ফিচার `1` নিলে `2` লাগবে) — তিনটাই নিলে মোট `6`, এর বেশি হয় না।",
    inputFormat:
      "প্রথম লাইনে `n` ও `d`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা — প্রতিটি ফিচারের হিসাব `p_i`। পরের `d` লাইনে প্রতিটিতে `u v`।",
    outputFormat: "সর্বোচ্চ মোট লাভ এক লাইনে প্রিন্ট করো।",
    constraints:
      "`1 <= n <= 200`\n`0 <= d <= 1000`\n`-10^6 <= p_i <= 10^6`\n`1 <= u, v <= n`, `u != v`\nএকই নির্ভরতা একাধিকবার আসতে পারে।",
    editorial:
      "## ধারণা\n\nএটা max closure সমস্যা, আর এর সমাধান min cut-এ। ধরো source-এর পাশে বাছাই করা ফিচারগুলো। প্রতিটি লাভজনক (`p_i > 0`) ফিচারে source→`i` এজ, ক্ষমতা `p_i` — বাছাই না করলে সেই লাভ কাটতে হয়। প্রতিটি লোকসানের (`p_i < 0`) ফিচারে `i`→sink এজ, ক্ষমতা `-p_i` — বাছাই করলে সেই খরচ কাটতে হয়। নির্ভরতা `u v` দিয়ে `u → v` এজ, ক্ষমতা অসীম — সেটা কাটা কখনোই সস্তা নয়, তাই সর্বোচ্চ লাভের বাছাই নিশ্চিতভাবে নির্ভরতা মানে। এবার হিসাব: কোনো cut-এর খরচ = (বাছাই না করা ফিচারের লাভ) + (বাছাই করা ফিচারের খরচ), আর মোট লাভ = সব লাভের যোগ − কাটের খরচ। তাই উত্তর হলো ধনাত্মক `p_i`-দের যোগফল থেকে min cut (Dinic-এর max flow) বাদ দিয়ে যা থাকে।\n\n## ধাপে ধাপে\n\n1. `p_i > 0` হলে source→`i` ক্ষমতা `p_i`; `p_i < 0` হলে `i`→sink ক্ষমতা `-p_i` যোগ করো।\n2. প্রতিটি নির্ভরতায় `u → v` ক্ষমতা অসীম এজ যোগ করো।\n3. Dinic চালিয়ে max flow (= min cut) বের করো।\n4. উত্তর = ধনাত্মক `p_i`-দের যোগফল − max flow।\n\n```python\nimport sys\nfrom collections import deque\ndata = sys.stdin.read().split()\nit = iter(data)\nn = int(next(it)); d = int(next(it))\np = [int(next(it)) for _ in range(n)]\nN = n + 2\ng = [[] for _ in range(N)]\ndef add(u, v, c):\n    g[u].append([v, c, len(g[v])])\n    g[v].append([u, 0, len(g[u]) - 1])\nINF = 2 * 10 ** 8\nfor i, val in enumerate(p, start=1):\n    if val > 0:\n        add(0, i, val)\n    elif val < 0:\n        add(i, N - 1, -val)\nfor _ in range(d):\n    u = int(next(it)); v = int(next(it))\n    add(u, v, INF)\ns, t = 0, N - 1\ntotal = 0\nwhile True:\n    level = [-1] * N\n    level[s] = 0\n    q = deque([s])\n    while q:\n        u = q.popleft()\n        for v, cap, rev in g[u]:\n            if cap > 0 and level[v] == -1:\n                level[v] = level[u] + 1\n                q.append(v)\n    if level[t] == -1:\n        break\n    ptr = [0] * N\n    def dfs(u, f):\n        if u == t:\n            return f\n        while ptr[u] < len(g[u]):\n            v, cap, rev = g[u][ptr[u]]\n            if cap > 0 and level[v] == level[u] + 1:\n                pushed = dfs(v, min(f, cap))\n                if pushed:\n                    g[u][ptr[u]][1] -= pushed\n                    g[v][rev][1] += pushed\n                    return pushed\n            ptr[u] += 1\n        return 0\n    while True:\n        pushed = dfs(s, 10 ** 18)\n        if not pushed:\n            break\n        total += pushed\nprint(sum(val for val in p if val > 0) - total)\n```\n\n## কমপ্লেক্সিটি\n\n`O(V^2 * E)` (Dinic), এখানে `V <= 202`, `E <= 1200` — দ্রুত।\n\n## সাধারণ ভুল\n\n- **লোকসানের ফিচার কেউই নেবে না ভেবে হিসাব থেকে বাদ দেওয়া:** একটা খরচ নিলে অনেক বড় লাভ আটকে যেতে পারে — এজের ক্ষমতাই ঠিক এই লেনদেন হিসাব করে।\n- **নির্ভরতার এজে ছোট ক্ষমতা দেওয়া:** তাহলে কাট সেটা কেটে নির্ভরতা ভেঙে ফেলতে পারে; অসীম রাখলে সেটা ঘটে না।\n- **সব হিসাব ঋণাত্মক হলে নেগেটিভ উত্তর ছাপানো:** খালি সেটও বৈধ, তাই উত্তর কখনোই `0`-এর নিচে নামে না।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Network Flow", "Min Cut"],
    tests: [
      {
        input: "3 1\n5 -3 4\n1 2\n",
        expectedOutput: "6\n",
        isSample: true,
      },
      { input: "2 0\n-5 -7\n", expectedOutput: "0\n", isSample: true },
      { input: "1 0\n7\n", expectedOutput: "7\n", isSample: false },
      { input: "1 0\n-7\n", expectedOutput: "0\n", isSample: false },
      {
        input: "3 2\n3 -1 10\n3 2\n2 1\n",
        expectedOutput: "12\n",
        isSample: false,
      },
      {
        input: "3 1\n6 -10 2\n3 2\n",
        expectedOutput: "6\n",
        isSample: false,
      },
      {
        input: "4 2\n4 5 -6 3\n1 3\n2 3\n",
        expectedOutput: "6\n",
        isSample: false,
      },
      {
        input: `150 75\n${H2_PAIR_PROFIT}\n${H2_PAIR_DEPS}\n`,
        expectedOutput: "22500\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\ndata = sys.stdin.read().split()\nit = iter(data)\nn = int(next(it)); d = int(next(it))\np = [int(next(it)) for _ in range(n)]\nN = n + 2\ng = [[] for _ in range(N)]\ndef add(u, v, c):\n    g[u].append([v, c, len(g[v])])\n    g[v].append([u, 0, len(g[u]) - 1])\nINF = 2 * 10 ** 8\nfor i, val in enumerate(p, start=1):\n    if val > 0:\n        add(0, i, val)\n    elif val < 0:\n        add(i, N - 1, -val)\nfor _ in range(d):\n    u = int(next(it)); v = int(next(it))\n    add(u, v, INF)\ns, t = 0, N - 1\ntotal = 0\nwhile True:\n    level = [-1] * N\n    level[s] = 0\n    q = deque([s])\n    while q:\n        u = q.popleft()\n        for v, cap, rev in g[u]:\n            if cap > 0 and level[v] == -1:\n                level[v] = level[u] + 1\n                q.append(v)\n    if level[t] == -1:\n        break\n    ptr = [0] * N\n    def dfs(u, f):\n        if u == t:\n            return f\n        while ptr[u] < len(g[u]):\n            v, cap, rev = g[u][ptr[u]]\n            if cap > 0 and level[v] == level[u] + 1:\n                pushed = dfs(v, min(f, cap))\n                if pushed:\n                    g[u][ptr[u]][1] -= pushed\n                    g[v][rev][1] += pushed\n                    return pushed\n            ptr[u] += 1\n        return 0\n    while True:\n        pushed = dfs(s, 10 ** 18)\n        if not pushed:\n            break\n        total += pushed\nprint(sum(val for val in p if val > 0) - total)\n",
  },
];
