import type { SeedProblem } from "../../seed-problems";
import { newlineOutput } from "../generated-tests";

function chainEdges(n: number): string {
  return (
    n +
    "\n" +
    Array.from({ length: n - 1 }, (_, i) => `${i + 1} ${i + 2}`).join("\n") +
    "\n"
  );
}

function starEdges(n: number): string {
  return (
    n +
    "\n" +
    Array.from({ length: n - 1 }, (_, i) => `1 ${i + 2}`).join("\n") +
    "\n"
  );
}

export const TREE_BITMASK_DP_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m5-tree-bitmask-dp-g1",
    title: "Tree Diameter",
    statement:
      "রফি প্রাইমএশিয়া ক্যাম্পাসের ক্লাব-কেন্দ্রগুলোর সংযোগ-মানচিত্র বানিয়েছেন। সাদিয়া জানতে চান, কোনো কেন্দ্র থেকে শুরু করে দূরতম কেন্দ্র পর্যন্ত রাস্তাটা কত ধাপের।\n\n`n`টি নোডের একটা ট্রি (কোনো লুপ নেই, সব নোড সংযুক্ত) দেওয়া থাকবে। দুই নোডের মধ্যের দূরত্ব হলো তাদের মধ্যে রাস্তার এজ সংখ্যা। সব জোড়ার মধ্যে সর্বোচ্চ দূরত্বটাই diameter।\n\nউদাহরণ: সোজা লাইনের ট্রি `1-2-3-4-5`-এ diameter `4`।",
    inputFormat:
      "প্রথম লাইনে নোডের সংখ্যা `n`। পরের `n - 1` লাইনে প্রতিটিতে একটা এজ `u v`।",
    outputFormat: "diameter (এজ সংখ্যা) এক লাইনে প্রিন্ট করো।",
    constraints:
      "`1 <= n <= 200000`\nনোড নম্বর `1` থেকে `n`।",
    editorial:
      "## ধারণা\n\nট্রির diameter বের করার দুই-বার BFS কৌশল: যেকোনো নোড থেকে সবচেয়ে দূর নোডটা হলো diameter-এর এক প্রান্ত, আর সেই প্রান্ত থেকে আবার সবচেয়ে দূর নোডের দূরত্বই diameter। প্রথম BFS থেকে এক প্রান্ত `a` পাই, দ্বিতীয় BFS `a` থেকে চালিয়ে উত্তর পাই। BFS-এ queue লাগে, কারণ DFS recursion `n = 200000`-এ Python-এর limit ভেঙে ফেলবে।\n\n## ধাপে ধাপে\n\n1. ইনপুট পড়ে adjacency list `g` বানাও (প্রতিটি এজ দুই পাশে)।\n2. `bfs(start)` ফাংশি লিখো: distance অ্যারে নিয়ে ঘুরে শেষ নোড ও তার দূরত্ব ফেরত দিন।\n3. `a, _ = bfs(1)` — এক প্রান্ত পান।\n4. `_, d = bfs(a)` — `d` ই উত্তর, প্রিন্ট করো।\n\n```python\nimport sys\nfrom collections import deque\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ng = [[] for _ in range(n + 1)]\nfor i in range(n - 1):\n    u = data[1 + 2 * i]\n    v = data[2 + 2 * i]\n    g[u].append(v)\n    g[v].append(u)\ndef bfs(start):\n    dist = [-1] * (n + 1)\n    dist[start] = 0\n    queue = deque([start])\n    last = start\n    while queue:\n        u = queue.popleft()\n        last = u\n        for v in g[u]:\n            if dist[v] < 0:\n                dist[v] = dist[u] + 1\n                queue.append(v)\n    return last, dist[last]\na, _ = bfs(1)\n_, d = bfs(a)\nprint(d)\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(n)` — দুইবার BFS, প্রতিবার প্রতিটি এজ দুইবার ঘোরা হয়।\n\n## সাধারণ ভুল\n\n- Recursive DFS: `n = 200000` লম্বা সরুর ট্রিতে recursion limit ভাঙে। iterative queue/stack ব্যবহার করো।\n- এজকে দিকনির্ভর ভাবা: ট্রি অদিকনির্ভর, তাই `g[u]` আর `g[v]` দুইপাশেই যোগ করতে হবে।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Tree", "BFS"],
    tests: [
      { input: "5\n1 2\n2 3\n3 4\n4 5\n", expectedOutput: "4\n", isSample: true },
      { input: "4\n1 2\n1 3\n1 4\n", expectedOutput: "2\n", isSample: true },
      { input: "1\n", expectedOutput: "0\n", isSample: false },
      { input: "2\n1 2\n", expectedOutput: "1\n", isSample: false },
      { input: chainEdges(200000), expectedOutput: "199999\n", isSample: false },
      { input: starEdges(200000), expectedOutput: "2\n", isSample: false },
    ],
    referencePython:
      "import sys\nfrom collections import deque\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ng = [[] for _ in range(n + 1)]\nfor i in range(n - 1):\n    u = data[1 + 2 * i]\n    v = data[2 + 2 * i]\n    g[u].append(v)\n    g[v].append(u)\ndef bfs(start):\n    dist = [-1] * (n + 1)\n    dist[start] = 0\n    queue = deque([start])\n    last = start\n    while queue:\n        u = queue.popleft()\n        last = u\n        for v in g[u]:\n            if dist[v] < 0:\n                dist[v] = dist[u] + 1\n                queue.append(v)\n    return last, dist[last]\na, _ = bfs(1)\n_, d = bfs(a)\nprint(d)\n",
  },
  {
    slug: "learn-m5-tree-bitmask-dp-g2",
    title: "Subtree Sum",
    statement:
      "নুসরাত ক্লাবের ট্রি-আকার পরিবারে প্রতিটি সদস্যের টাকা জমা দেখছেন। কোনো সদস্যকে কেন্দ্র করে তার নিচে থাকা সবাই (নিজেসহ) মিলে কয় টাকা — প্রতিটি সদস্যের জন্য সেটা বের করে এক এক লাইনে লিখো।\n\n`u`-এর নিচে থাকে তার পুরো উপ-ট্রির সবাই: বাবা, চাচা-মামা বা ভাই নয় — শুধু নিচের দিকের বংশধারার সদস্যরা।\n\nউদাহরণ: `1` এর নিচে `2, 3, 4, 5` থাকলে `1`-এর ফল সব মোট, `4`-এর ফল শুধু নিজের মান।",
    inputFormat:
      "প্রথম লাইনে নোডের সংখ্যা `n`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা — প্রতিটি নোডের মান। পরের `n - 1` লাইনে এজ `u v`।",
    outputFormat:
      "`n` লাইনে যথাক্রমে নোড `1` থেকে `n`-এর subtree sum।",
    constraints:
      "`1 <= n <= 200000`\n`-1000 <= value_i <= 1000`",
    editorial:
      "## ধারণা\n\nনোড `u`-এর subtree sum = নিজের মান + সব সন্তানের subtree sum। এটা হলোই Tree DP: ছোট সমস্যা (সন্তানদের subtree) আগে সমাধান, তারপর বড়টা। ক্রমটা গুরুত্বপূর্ণ — নিচের দিক থেকে উপরে। BFS দিয়ে parent ও ঘোরার ক্রম বানিয়ে উল্টো করে ঘোরলেই প্রতিটি নোডের সন্তানদের ফল আগে থেকেই প্রস্তুত থাকে।\n\n## ধাপে ধাপে\n\n1. মান ও এজ পড়ে adjacency list বানাও।\n2. `1` কে root ধরে BFS দিয়ে `parent` আর ঘোরার `order` তৈরি করো।\n3. `order` উল্টো করে ঘুরে প্রতিটি `u`-এর জন্য: নিজের মান নিয়ে শুরু করে সন্তানদের `sums[v]` যোগ করো (parent বাদ)।\n4. নোড `1..n`-এর `sums` এক এক লাইনে প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nvals = data[1:n + 1]\nbase = n + 1\ng = [[] for _ in range(n + 1)]\nfor i in range(n - 1):\n    u = data[base + 2 * i]\n    v = data[base + 2 * i + 1]\n    g[u].append(v)\n    g[v].append(u)\nparent = [0] * (n + 1)\norder = [1]\nparent[1] = -1\nfor u in order:\n    for v in g[u]:\n        if parent[v] == 0:\n            parent[v] = u\n            order.append(v)\nsums = [0] * (n + 1)\nfor u in reversed(order):\n    total = vals[u - 1]\n    for v in g[u]:\n        if v != parent[u]:\n            total += sums[v]\n    sums[u] = total\nprint('\\n'.join(str(sums[i]) for i in range(1, n + 1)))\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(n)` — প্রতিটি এজ দুইবার দেখা হয় (একবার order বানাতে, একবার যোগ করতে)।\n\n## সাধারণ ভুল\n\n- parent বাদ না করে সন্তান লুপ: বাবার মান আবার যোগ হয়, ফলে মান বাড়ে যায়।\n- ঘোরার ক্রম ভুল: সামনে থেকে ঘোরলে সন্তানের ফল এখনো ভরা থাকা না থাকতে পারে — উল্টো ক্রমে নিশ্চিত হয়।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Tree", "Subtree"],
    tests: [
      {
        input: "5\n1 2 3 4 5\n1 2\n1 3\n2 4\n2 5\n",
        expectedOutput: "15\n11\n3\n4\n5\n",
        isSample: true,
      },
      {
        input: "4\n10 1 2 3\n1 2\n1 3\n1 4\n",
        expectedOutput: "16\n1\n2\n3\n",
        isSample: true,
      },
      {
        input: "5\n5 -2 3 -1 -4\n1 2\n1 3\n2 4\n2 5\n",
        expectedOutput: "1\n-7\n3\n-1\n-4\n",
        isSample: false,
      },
      { input: "1\n42\n", expectedOutput: "42\n", isSample: false },
      {
        input: "3\n1 2 3\n2 1\n2 3\n",
        expectedOutput: "6\n5\n3\n",
        isSample: false,
      },
      {
        input:
          "200000\n" +
          Array.from({ length: 200000 }, () => 5).join(" ") +
          "\n" +
          Array.from({ length: 199999 }, (_, i) => `${i + 1} ${i + 2}`).join("\n") +
          "\n",
        expectedOutput: newlineOutput(
          Array.from({ length: 200000 }, (_, i) => 5 * (200000 - i)),
        ),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nvals = data[1:n + 1]\nbase = n + 1\ng = [[] for _ in range(n + 1)]\nfor i in range(n - 1):\n    u = data[base + 2 * i]\n    v = data[base + 2 * i + 1]\n    g[u].append(v)\n    g[v].append(u)\nparent = [0] * (n + 1)\norder = [1]\nparent[1] = -1\nfor u in order:\n    for v in g[u]:\n        if parent[v] == 0:\n            parent[v] = u\n            order.append(v)\nsums = [0] * (n + 1)\nfor u in reversed(order):\n    total = vals[u - 1]\n    for v in g[u]:\n        if v != parent[u]:\n            total += sums[v]\n    sums[u] = total\nprint('\\n'.join(str(sums[i]) for i in range(1, n + 1)))\n",
  },
  {
    slug: "learn-m5-tree-bitmask-dp-e1",
    title: "Total Distance from Root",
    statement:
      "ক্যাম্পাসের সব ক্লাব-কেন্দ্র একটা ট্রিতে সংযুক্ত, আর মূল দরজাটা নোড `1`। প্রতিটি কেন্দ্র থেকে মূল দরজা পর্যন্ত কত ধাপ লাগে — সেই সব দূরত্ব মিলিয়ে কত, তানভির জানা দরকার।\n\nএক নোডের জন্য দূরত্ব `0` (নিজেই দরজা)।\n\nউদাহরণ: সোজা লাইনের ট্রি `1-2-3-4-5`-এ দূরত্ব `0, 1, 2, 3, 4` — যোগফল `10`।",
    inputFormat:
      "প্রথম লাইনে নোডের সংখ্যা `n`। পরের `n - 1` লাইনে এজ `u v`।",
    outputFormat: "সব দূরত্বের যোগফল এক লাইনে প্রিন্ট করো।",
    constraints:
      "`1 <= n <= 200000`\nনোড নম্বর `1` থেকে `n`; নোড `1` থেকে সব নোডে পৌঁছানো যায়।",
    editorial:
      "## ধারণা\n\n`1` থেকে শুরু করে BFS/DFS চালালে প্রতিটি নোডের দূরত্ব পাওয়া যায়: প্রথমবার কোনো নোড আসলে তার বাবার দূরত্ব + ১। ট্রিতে প্রতিটি নোডে পৌঁছানোর ঠিক একটা পথ আছে, তাই প্রথম আগমনই সঠিক দূরত্ব দেয়। যোগ করতে করতে চূড়ান্ত যোগফল পাওয়া যায়।\n\n## ধাপে ধাপে\n\n1. এজ পড়ে adjacency list বানাও।\n2. `dist = [-1] * (n + 1)`, `dist[1] = 0`, stack `=[1]`, `total = 0`।\n3. stack থেকে নোড তুলে প্রতিটি পুত্র `v`-এর জন্য: `dist[v] = dist[u] + 1`, `total += dist[v]`, তারপর `v` stack-এ।\n4. `total` প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ng = [[] for _ in range(n + 1)]\nfor i in range(n - 1):\n    u = data[1 + 2 * i]\n    v = data[2 + 2 * i]\n    g[u].append(v)\n    g[v].append(u)\ndist = [-1] * (n + 1)\ndist[1] = 0\nstack = [1]\ntotal = 0\nwhile stack:\n    u = stack.pop()\n    for v in g[u]:\n        if dist[v] < 0:\n            dist[v] = dist[u] + 1\n            total += dist[v]\n            stack.append(v)\nprint(total)\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(n)`। লম্বা সরুর ট্রিতে stack সাইজ `n` পর্যন্ত যায়, তাই recursion নয়, iterative ব্যবহার করো।\n\n## সাধারণ ভুল\n\n- BFS-এ পুরনো `dist` আপডেট: `if dist[v] < 0` শর্ত না থাকলে একই নোড বারবার ঢোকে এবং দূরত্ব ভুল হয়।\n- `total`-এ নিজের দূরত্বও যোগ: নোড `1`-এর দূরত্ব `0`, তাই যোগ হলেও ক্ষতি নেই — কিন্তু ভাবনাটা পরিষ্কার রাখো।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Tree", "DFS"],
    tests: [
      { input: "5\n1 2\n2 3\n3 4\n4 5\n", expectedOutput: "10\n", isSample: true },
      { input: "4\n1 2\n1 3\n1 4\n", expectedOutput: "3\n", isSample: true },
      { input: "1\n", expectedOutput: "0\n", isSample: false },
      { input: "2\n1 2\n", expectedOutput: "1\n", isSample: false },
      { input: chainEdges(200000), expectedOutput: "19999900000\n", isSample: false },
      { input: starEdges(200000), expectedOutput: "199999\n", isSample: false },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ng = [[] for _ in range(n + 1)]\nfor i in range(n - 1):\n    u = data[1 + 2 * i]\n    v = data[2 + 2 * i]\n    g[u].append(v)\n    g[v].append(u)\ndist = [-1] * (n + 1)\ndist[1] = 0\nstack = [1]\ntotal = 0\nwhile stack:\n    u = stack.pop()\n    for v in g[u]:\n        if dist[v] < 0:\n            dist[v] = dist[u] + 1\n            total += dist[v]\n            stack.append(v)\nprint(total)\n",
  },
  {
    slug: "learn-m5-tree-bitmask-dp-m1",
    title: "Maximum Weight Independent Set on a Tree",
    statement:
      "ক্লাবের ট্রি-পরিবারে প্রতিটি সদস্যের জনপ্রিয়তার পয়েন্ট দেওয়া আছে (কিছু সদস্যের পয়েন্ট ঋণাত্মকও হতে পারে)। একটা কমিটি বাছাই করতে হবে যেন:\n\n- কমিটির সদস্যদের মধ্যে কেউ ঠিক পাশাপাশি না হয় (একজনের বাবা বা সন্তান একসাথে থাকতে পারবে না),\n- কমিটির মোট পয়েন্ট সর্বোচ্চ হয়।\n\nকোনো সদস্যই না রাখলে পয়েন্ট `0` — সেটাও বৈধ।\n\nউদাহরণ: `1(10) - 2(5) - 4(3)`, `2 - 5(7)`, `1 - 3(12)` — `1` ও `3` নিলে `10 + 12 = 22`।",
    inputFormat:
      "প্রথম লাইনে নোডের সংখ্যা `n`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা — প্রতিটি নোডের পয়েন্ট। পরের `n - 1` লাইনে এজ `u v`।",
    outputFormat: "সর্বোচ্চ মোট পয়েন্ট এক লাইনে প্রিন্ট করো।",
    constraints:
      "`1 <= n <= 200000`\n`-1000 <= value_i <= 10^9`\nউত্তর 64-বিটের মধ্যে থাকবে।",
    editorial:
      "## ধারণা\n\nপ্রতিটি নোডে দুইটা অবস্থা রাখো: `dp1[u]` = `u` কমিটিতে থাকলে তার সবচেয়ে ভালো ফল, `dp0[u]` = `u` না থাকলে। তাহলে:\n\n- `u` থাকলে: সন্তানরা থাকতেই পারবে না → `dp1[u] = value[u] + sum(dp0[v])`\n- `u` না থাকলে: সন্তান থাক বা না থাকে — সন্তানদের সেরাটা → `dp0[u] = sum(max(dp0[v], dp1[v]))`\n\nউত্তর `max(dp0[1], dp1[1])`। ঋণাত্মক মানেও কাজ করে, কারণ না-থাকার ঘর সবসময় শূন্য বা তার বেশি থাকে — খালি কমিটি নেওয়া যায়।\n\n## ধাপে ধাপে\n\n1. মান ও এজ পড়ে adjacency list বানাও।\n2. `1` কে root ধরে parent/order টেবিল বানাও (BFS, iterative)।\n3. `order` উল্টো করে ঘুরে `dp0`, `dp1` ভরুন — সন্তান লুপে parent বাদ।\n4. `max(dp0[1], dp1[1])` প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nvals = data[1:n + 1]\nbase = n + 1\ng = [[] for _ in range(n + 1)]\nfor i in range(n - 1):\n    u = data[base + 2 * i]\n    v = data[base + 2 * i + 1]\n    g[u].append(v)\n    g[v].append(u)\nparent = [0] * (n + 1)\norder = [1]\nparent[1] = -1\nfor u in order:\n    for v in g[u]:\n        if parent[v] == 0:\n            parent[v] = u\n            order.append(v)\ndp0 = [0] * (n + 1)\ndp1 = [0] * (n + 1)\nfor u in reversed(order):\n    dp1[u] = vals[u - 1]\n    for v in g[u]:\n        if v != parent[u]:\n            dp0[u] += max(dp0[v], dp1[v])\n            dp1[u] += dp0[v]\nprint(max(dp0[1], dp1[1]))\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(n)` — প্রতিটি নোড একবার ঘোরা হয়।\n\n## সাধারণ ভুল\n\n- একটা ঘর রেখে যাওয়া: শুধু `dp1` বা শুধু `dp0` রাখলে পাশাপাশি সংঘাত বা সুযোগ হারায় — দুটোই লাগবে।\n- ঋণাত্মক মানে `dp1`-এ সন্তান `dp1` নেওয়া: সন্তান যদি বাবাসহ থাকে, সন্তান অবশ্যই বাদ — তাই `dp0[v]`।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Tree", "Independent Set"],
    tests: [
      {
        input: "5\n10 5 12 3 7\n1 2\n1 3\n2 4\n2 5\n",
        expectedOutput: "22\n",
        isSample: true,
      },
      {
        input: "5\n1 1 1 1 1\n1 2\n2 3\n3 4\n4 5\n",
        expectedOutput: "3\n",
        isSample: true,
      },
      { input: "3\n0 0 0\n1 2\n2 3\n", expectedOutput: "0\n", isSample: false },
      {
        input: "4\n8 1 2 3\n1 2\n1 3\n1 4\n",
        expectedOutput: "8\n",
        isSample: false,
      },
      { input: "3\n10 -5 10\n1 2\n2 3\n", expectedOutput: "20\n", isSample: false },
      {
        input:
          "200000\n" +
          Array.from({ length: 200000 }, () => 1000000000).join(" ") +
          "\n" +
          Array.from({ length: 199999 }, (_, i) => `${i + 1} ${i + 2}`).join("\n") +
          "\n",
        expectedOutput: "100000000000000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nvals = data[1:n + 1]\nbase = n + 1\ng = [[] for _ in range(n + 1)]\nfor i in range(n - 1):\n    u = data[base + 2 * i]\n    v = data[base + 2 * i + 1]\n    g[u].append(v)\n    g[v].append(u)\nparent = [0] * (n + 1)\norder = [1]\nparent[1] = -1\nfor u in order:\n    for v in g[u]:\n        if parent[v] == 0:\n            parent[v] = u\n            order.append(v)\ndp0 = [0] * (n + 1)\ndp1 = [0] * (n + 1)\nfor u in reversed(order):\n    dp1[u] = vals[u - 1]\n    for v in g[u]:\n        if v != parent[u]:\n            dp0[u] += max(dp0[v], dp1[v])\n            dp1[u] += dp0[v]\nprint(max(dp0[1], dp1[1]))\n",
  },
  {
    slug: "learn-m5-tree-bitmask-dp-h1",
    title: "Assignment Problem",
    statement:
      "প্রাইমএশিয়ার `n` জন শিক্ষার্থীকে `n` টা প্রজেক্টে বসাতে হবে — একজন একটা প্রজেক্ট, একটা প্রজেক্ট একজন। শিক্ষার্থী `i` প্রজেক্ট `j` করলে খরচ `cost[i][j]` (সময়/ঝামেলা)। মোট খরচ সর্বনিম্ন করার বিন্যাসটা কত, সেটা বের করো।\n\nউদাহরণ: `cost = [[9,2,7,8],[6,4,3,7],[5,8,1,8],[8,1,5,6]]` — সেরা বিন্যাসে খরচ `15`।",
    inputFormat:
      "প্রথম লাইনে `n`। পরের `n` লাইনে প্রতিটিতে `n`টি পূর্ণসংখ্যা — খরচ ম্যাট্রিক্স।",
    outputFormat: "সর্বনিম্ন মোট খরচ এক লাইনে প্রিন্ট করো।",
    constraints:
      "`1 <= n <= 16`\n`0 <= cost[i][j] <= 1000`",
    editorial:
      "## ধারণা\n\nবিটমাস্ক DP-এর ক্লাসিক উদাহরণ। `dp[mask]` হোক `mask`-এর বিটগুলোতে (বা প্রথম `popcount(mask)` জনের) কাজ বণ্টনের সর্বনিম্ন খরচ। যেকোনো mask থেকে এখনো না-বাদ দেওয়া যেকোনো কাজ `j` যোগ করে নতুন mask বানানো যায়: `dp[mask | (1 << j)] = min(মান, dp[mask] + cost[i][j])`, যেখানে `i = popcount(mask)` — কারণ প্রথম `i` জন শিক্ষার্থী ইতিমধ্যে বসানো হয়েছে। `mask = 0` থেকে শুরু, চূড়ান্ত উত্তর `dp[(1 << n) - 1]`।\n\n## ধাপে ধাপে\n\n1. `n` আর খরচ ম্যাট্রিক্স পড়ো।\n2. `dp` অ্যারে `2^n` আকারে, সব বিশাল মান, `dp[0] = 0`।\n3. `mask = 0` থেকে `2^n - 1` পর্যন্ত ঘুরুন: `i = popcount(mask)`; `j` বিট না থাকলে `dp[mask | (1 << j)]` আপডেট করো।\n4. `dp[(1 << n) - 1]` প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ncost = [data[1 + i * n:1 + (i + 1) * n] for i in range(n)]\nINF = 10 ** 18\ndp = [INF] * (1 << n)\ndp[0] = 0\nfor mask in range(1 << n):\n    if dp[mask] >= INF:\n        continue\n    i = bin(mask).count('1')\n    if i >= n:\n        continue\n    for j in range(n):\n        if (mask >> j) & 1:\n            continue\n        nm = mask | (1 << j)\n        nd = dp[mask] + cost[i][j]\n        if nd < dp[nm]:\n            dp[nm] = nd\nprint(dp[(1 << n) - 1])\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n * 2^n)`, স্পেস `O(2^n)`। `n = 16`-এ প্রায় ১০ লক্ষ ধাপ — Python-এও এক সেকেন্ডের মধ্যে চলে। `n = 20` হলে `2 * 10^7` ছাড়িয়ে যায়, তাই সীমা দেখে চলো।\n\n## সাধারণ ভুল\n\n- `dp[mask]`-এ কোন শিক্ষার্থী বসানো হয়েছে সেটা মনে না রাখা: `popcount` দিয়ে ঠিক করতে হয়, নাহলে transition মেলবে না।\n- শুরু `dp[0] = 0` না রাখা বা বিশাল মানের জায়গায় `0` রাখা: `0` থেকে সবসময় সেরা মান মনে হয়, ফলে অসম্ভব বিন্যাসও উত্তর দেয়।\n- mask ক্রম উল্টো: ছোট mask থেকে বড় mask-এ গেলে মান আগে থেকেই প্রস্তুত থাকে।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Bitmask", "Assignment"],
    tests: [
      {
        input: "4\n9 2 7 8\n6 4 3 7\n5 8 1 8\n8 1 5 6\n",
        expectedOutput: "15\n",
        isSample: true,
      },
      {
        input: "3\n0 1 1\n1 0 1\n1 1 0\n",
        expectedOutput: "0\n",
        isSample: true,
      },
      { input: "1\n5\n", expectedOutput: "5\n", isSample: false },
      {
        input: "3\n2 2 2\n2 2 2\n2 2 2\n",
        expectedOutput: "6\n",
        isSample: false,
      },
      {
        input:
          "16\n" +
          Array.from({ length: 16 }, (_, i) =>
            Array.from({ length: 16 }, (_, j) => Math.abs(i - j)).join(" "),
          ).join("\n") +
          "\n",
        expectedOutput: "0\n",
        isSample: false,
      },
      {
        input:
          "16\n" +
          Array.from({ length: 16 }, (_, i) =>
            Array.from({ length: 16 }, (_, j) => i * 16 + j).join(" "),
          ).join("\n") +
          "\n",
        expectedOutput: "2040\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ncost = [data[1 + i * n:1 + (i + 1) * n] for i in range(n)]\nINF = 10 ** 18\ndp = [INF] * (1 << n)\ndp[0] = 0\nfor mask in range(1 << n):\n    if dp[mask] >= INF:\n        continue\n    i = bin(mask).count('1')\n    if i >= n:\n        continue\n    for j in range(n):\n        if (mask >> j) & 1:\n            continue\n        nm = mask | (1 << j)\n        nd = dp[mask] + cost[i][j]\n        if nd < dp[nm]:\n            dp[nm] = nd\nprint(dp[(1 << n) - 1])\n",
  },
  {
    slug: "learn-m5-tree-bitmask-dp-x1",
    title: "Travelling Salesman (Bitmask DP)",
    statement:
      "সাদিয়া ক্যাম্পাসের `n`টি স্থান ঘুরে ফিরবেন — শুরু স্থান `1` থেকে, সবগুলো এক একবার ঘুরে, আবার `1`-এ ফিরে এসে। দুই স্থানের মধ্যে দূরত্ব দেওয়া থাকবে (সামনে থেকে পিছনে দূরত্ব ভিন্ন হতে পারে)। মোট দূরত্ব সর্বনিম্ন কত, সেটা বের করো।\n\n`n = 1` হলে কোনো ঘোরা লাগে না, উত্তর `0`।",
    inputFormat:
      "প্রথম লাইনে `n`। পরের `n` লাইনে প্রতিটিতে `n`টি পূর্ণসংখ্যা — দূরত্ব ম্যাট্রিক্স।",
    outputFormat: "সর্বনিম্ন মোট দূরত্ব এক লাইনে প্রিন্ট করো।",
    constraints:
      "`1 <= n <= 10`\n`0 <= dist[i][j] <= 1000`\n`dist[i][i] = 0`",
    editorial:
      "## ধারণা\n\n`dp[mask][last]` = যেসব স্থান `mask`-এর বিট দিয়ে ঘোরা হয়েছে, এখন সবশেষে `last`-এ দাঁড়ানো অবস্থায় সর্বনিম্ন দূরত্ব। শুরু `dp[1 << 0][0] = 0` (প্রথম স্থানে আছি, দূরত্ব শূন্য)। প্রতিটি অবস্থা থেকে ঘোরা না-হওয়া যেকোনো স্থান `nxt`-এ যাওয়া যায়: `dp[mask | (1 << nxt)][nxt] = min(মান, dp[mask][last] + dist[last][nxt])`। সব স্থান ঘুরে (`mask = (1 << n) - 1`) শেষে ফিরে `0`-এ যাওয়া যোগ করে বড়টা নাও।\n\n## ধাপে ধাপে\n\n1. `n` আর দূরত্ব ম্যাট্রিক্স পড়ো।\n2. `dp` বানাও `2^n x n`, সব বিশাল মান; `dp[1][0] = 0`।\n3. `mask = 0` থেকে `2^n - 1`, প্রতিটি `last`-এর জন্য (বিট থাকা আবং মান বৈধ) ঘোরা না-স্থানে যান।\n4. `min(dp[(1<<n)-1][i] + dist[i][0])` প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ndist = [data[1 + i * n:1 + (i + 1) * n] for i in range(n)]\nINF = 10 ** 18\ndp = [[INF] * n for _ in range(1 << n)]\ndp[1][0] = 0\nfor mask in range(1 << n):\n    for last in range(n):\n        if dp[mask][last] >= INF:\n            continue\n        if not (mask >> last) & 1:\n            continue\n        for nxt in range(n):\n            if (mask >> nxt) & 1:\n                continue\n            nm = mask | (1 << nxt)\n            nd = dp[mask][last] + dist[last][nxt]\n            if nd < dp[nm][nxt]:\n                dp[nm][nxt] = nd\nfull = (1 << n) - 1\nprint(min(dp[full][i] + dist[i][0] for i in range(n)))\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n^2 * 2^n)`, স্পেস `O(n * 2^n)`। `n = 10`-এ প্রায় এক লক্ষ ধাপ, সহজে চলে। সীমা ছোট রাখা হয়েছে কারণ বড় `n`-এ এই প্যাটার্ন আর কাজ করে না।\n\n## সাধারণ ভুল\n\n- ফিরে আসার ধাপ বাদ: প্রশ্নে বলা আছে শেষে `1`-এ ফিরতে হবে; না দিলে উত্তর কমে যায়।\n- `mask`-এর বিট `last` আছে কিনা যাচাই না করা: অন্য `last`-এর মান এলেও transition চলতে পারে, ফলে ভুল হয়।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Bitmask", "TSP"],
    tests: [
      {
        input:
          "4\n0 10 15 20\n10 0 35 25\n15 35 0 30\n20 25 30 0\n",
        expectedOutput: "80\n",
        isSample: true,
      },
      { input: "2\n0 5\n5 0\n", expectedOutput: "10\n", isSample: true },
      { input: "1\n0\n", expectedOutput: "0\n", isSample: false },
      { input: "3\n0 1 2\n2 0 1\n1 2 0\n", expectedOutput: "3\n", isSample: false },
      {
        input:
          "10\n" +
          Array.from({ length: 10 }, (_, i) =>
            Array.from({ length: 10 }, (_, j) => (i === j ? 0 : 1)).join(" "),
          ).join("\n") +
          "\n",
        expectedOutput: "10\n",
        isSample: false,
      },
      {
        input:
          "10\n" +
          Array.from({ length: 10 }, (_, i) =>
            Array.from(
              { length: 10 },
              (_, j) =>
                i === j ? 0 : Math.min(Math.abs(i - j), 10 - Math.abs(i - j)),
            ).join(" "),
          ).join("\n") +
          "\n",
        expectedOutput: "10\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ndist = [data[1 + i * n:1 + (i + 1) * n] for i in range(n)]\nINF = 10 ** 18\ndp = [[INF] * n for _ in range(1 << n)]\ndp[1][0] = 0\nfor mask in range(1 << n):\n    for last in range(n):\n        if dp[mask][last] >= INF:\n            continue\n        if not (mask >> last) & 1:\n            continue\n        for nxt in range(n):\n            if (mask >> nxt) & 1:\n                continue\n            nm = mask | (1 << nxt)\n            nd = dp[mask][last] + dist[last][nxt]\n            if nd < dp[nm][nxt]:\n                dp[nm][nxt] = nd\nfull = (1 << n) - 1\nprint(min(dp[full][i] + dist[i][0] for i in range(n)))\n",
  },
  {
    slug: "learn-m5-tree-bitmask-dp-x2",
    title: "Count Independent Sets on a Tree",
    statement:
      "এবার সাদিয়া জানতে চান ক্লাবের ট্রি-পরিবার থেকে কয়টা ভিন্ন কমিটি সম্ভব — যেখানে কেউ ঠিক পাশাপাশি না হয়। খালি কমিটিও একটা হিসেবে ধরা হবে, একজনের কমিটিও।\n\nসংখ্যাটা বড় হয়ে যেতে পারে, তাই `1000000007` দিয়ে ভাগের ভাগশেষ দিন।\n\nউদাহরণ: সোজা লাইনের তিন নোড (`1-2-3`) — `{}`, `{1}`, `{2}`, `{3}`, `{1,3}`: উত্তর `5`।",
    inputFormat:
      "প্রথম লাইনে নোডের সংখ্যা `n`। পরের `n - 1` লাইনে এজ `u v`।",
    outputFormat:
      "কমিটি সংখ্যার `1000000007` ভাগশেষ এক লাইনে প্রিন্ট করো।",
    constraints:
      "`1 <= n <= 200000`",
    editorial:
      "## ধারণা\n\nআগের independent set DP-এর একই দুই-ঘর, শুধু যোগ বদলে গুণ। `dp0[u]` = `u` না নিলে তার subtree-এর কমিটি সংখ্যা, `dp1[u]` = `u` নিলে।\n\n- `u` নিলে সন্তান কেউ নেতা হতে পারবে না: `dp1[u] = product(dp0[v])`\n- `u` না নিলে সন্তান নিতে বা না নিতে পারবে: `dp0[u] = product(dp0[v] + dp1[v])`\n\nপ্রতিটি গুণের পরে মডুলাস নাও। উত্তর `(dp0[1] + dp1[1]) % M`। খালি কমিটির হিসাবটা লিভ নোডে `dp0 = 1` (কিছু না নেওয়ার একটামাত্র উপায়) দিয়েই নিজে থেকে আসে।\n\n## ধাপে ধাপে\n\n1. এজ পড়ে adjacency list বানাও।\n2. `1` কে root ধরে parent/order টেবিল বানাও।\n3. `order` উল্টো করে: `dp0[u] = 1`, `dp1[u] = 1` দিয়ে শুরু করে সন্তানদের গুণ করো, প্রতিটি ধাপে `% 1000000007`।\n4. `(dp0[1] + dp1[1]) % 1000000007` প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ng = [[] for _ in range(n + 1)]\nfor i in range(n - 1):\n    u = data[1 + 2 * i]\n    v = data[2 + 2 * i]\n    g[u].append(v)\n    g[v].append(u)\nM = 1000000007\nparent = [0] * (n + 1)\norder = [1]\nparent[1] = -1\nfor u in order:\n    for v in g[u]:\n        if parent[v] == 0:\n            parent[v] = u\n            order.append(v)\ndp0 = [1] * (n + 1)\ndp1 = [1] * (n + 1)\nfor u in reversed(order):\n    p0 = 1\n    p1 = 1\n    for v in g[u]:\n        if v != parent[u]:\n            p0 = p0 * ((dp0[v] + dp1[v]) % M) % M\n            p1 = p1 * dp0[v] % M\n    dp0[u] = p0\n    dp1[u] = p1\nprint((dp0[1] + dp1[1]) % M)\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(n)` — গুণও প্রতি এজে একবার হয়।\n\n## সাধারণ ভুল\n\n- মডুলাস শেষে একবার: মাঝের গুণগুলো দ্রুত `10^18` ছাড়িয়ে যায়, তাই প্রতিটি যোগ/গুণের পরেই নাও।\n- `dp0`/`dp1` শূন্য দিয়ে শুরু: গুণের identity `1`, শূন্য নয় — শূন্য দিলে সব ফল শূন্য হয়ে যায়।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Tree", "Counting"],
    tests: [
      { input: "1\n", expectedOutput: "2\n", isSample: true },
      { input: "4\n1 2\n1 3\n1 4\n", expectedOutput: "9\n", isSample: true },
      { input: "2\n1 2\n", expectedOutput: "3\n", isSample: false },
      { input: "3\n1 2\n2 3\n", expectedOutput: "5\n", isSample: false },
      { input: chainEdges(200000), expectedOutput: "52453058\n", isSample: false },
      { input: starEdges(200000), expectedOutput: "87947642\n", isSample: false },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ng = [[] for _ in range(n + 1)]\nfor i in range(n - 1):\n    u = data[1 + 2 * i]\n    v = data[2 + 2 * i]\n    g[u].append(v)\n    g[v].append(u)\nM = 1000000007\nparent = [0] * (n + 1)\norder = [1]\nparent[1] = -1\nfor u in order:\n    for v in g[u]:\n        if parent[v] == 0:\n            parent[v] = u\n            order.append(v)\ndp0 = [1] * (n + 1)\ndp1 = [1] * (n + 1)\nfor u in reversed(order):\n    p0 = 1\n    p1 = 1\n    for v in g[u]:\n        if v != parent[u]:\n            p0 = p0 * ((dp0[v] + dp1[v]) % M) % M\n            p1 = p1 * dp0[v] % M\n    dp0[u] = p0\n    dp1[u] = p1\nprint((dp0[1] + dp1[1]) % M)\n",
  },
];
