import type { SeedProblem } from "../../seed-problems";

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

export const TREE_BITMASK_DP_PRACTICE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m5-tree-bitmask-dp-e2",
    title: "Tree Height",
    statement:
      "রফি ক্যাম্পাসের ক্লাব-কেন্দ্রগুলোর সংযোগ-মানচিত্র দেয়ালে টাঙাল — `n`টি কেন্দ্র, `n - 1`টি রাস্তা, পুরোটা একটা ট্রি। মূল অফিস হলো নোড `1`; মানচিত্রের ওপর থেকে নিচে নোড সাজালে মূল অফিস সবার উপরে।\n\nমূল অফিস থেকে হেঁটে সবচেয়ে দূরের কেন্দ্র কত ধাপ (এজ সংখ্যা) দূরে বসে, সেটা বের করো — এটাই ট্রির উচ্চতা।\n\nউদাহরণ: সোজা লাইনের ট্রি `1-2-3-4-5`-এ সবচেয়ে দূরের কেন্দ্র `5`, উচ্চতা `4`।",
    inputFormat:
      "প্রথম লাইনে নোডের সংখ্যা `n`। পরের `n - 1` লাইনে প্রতিটিতে একটা এজ `u v`।",
    outputFormat: "ট্রির উচ্চতা (এজ সংখ্যা) এক লাইনে প্রিন্ট করো।",
    constraints:
      "`1 <= n <= 200000`\nনোড নম্বর `1` থেকে `n`; নোড `1` থেকে সব নোডে পৌঁছানো যায়।",
    editorial:
      "## ধারণা\n\nনোড `u`-এর উচ্চতা হলো তার সন্তানদের উচ্চতার সর্বোচ্চটা + `1` — পাতা নোডের উচ্চতা `0`। এটা subtree sum-এর মতোই নিচ থেকে উপরে ভরার কাজ: BFS দিয়ে বাবা আর ঘোরার ক্রম বানিয়ে উল্টো ক্রমে ঘুরলে প্রতিটি নোডের সন্তানদের উত্তর আগেই তৈরি। সন্তান লুপে বাবাকে বাদ দিতে হবে, নাহলে বাবা-ছেলে একে অপরকে আবার গোনে।\n\nরিকার্শন দিয়েও লেখা যায়, কিন্তু `n = 200000`-এর লম্বা সরু ট্রিতে Python-এর recursion limit ভেঙে যায় — তাই iterative ক্রমই নিরাপদ।\n\n## ধাপে ধাপে\n\n1. এজ পড়ে adjacency list বানাও।\n2. নোড `1` থেকে BFS চালিয়ে `parent` আর `order` তৈরি করো।\n3. `order` উল্টো করে ঘুরে প্রতিটি `u`-এর জন্য: সন্তানদের মধ্যে সর্বোচ্চ `height + 1` নিজের উচ্চতা বসাও।\n4. `height[1]` প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ng = [[] for _ in range(n + 1)]\nfor i in range(n - 1):\n    u = data[1 + 2 * i]\n    v = data[2 + 2 * i]\n    g[u].append(v)\n    g[v].append(u)\nparent = [0] * (n + 1)\nparent[1] = -1\norder = [1]\nfor u in order:\n    for v in g[u]:\n        if parent[v] == 0:\n            parent[v] = u\n            order.append(v)\nheight = [0] * (n + 1)\nfor u in reversed(order):\n    for v in g[u]:\n        if v != parent[u] and height[v] + 1 > height[u]:\n            height[u] = height[v] + 1\nprint(height[1])\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(n)` — প্রতিটি এজ দুইবার দেখা হয় (order বানাতে একবার, উচ্চতা জোড়াতে একবার)।\n\n## সাধারণ ভুল\n\n- বাবাকে সন্তান ভেবে ঘোরানো: `v != parent[u]` শর্ত বাদ দিলে উচ্চতা দ্বিগুণ হয়ে যায়।\n- রিকার্সিভ DFS: লম্বা ট্রিতে recursion limit ভাঙে; BFS ক্রম + উল্টো লুপ ব্যবহার করো।\n- পাতার উচ্চতা `1` ধরা: পাতা থেকে আর নামা নেই, তার উচ্চতা `0` — শুরু মান ঠিক রাখলে সব ঘর ঠিক থাকে।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Tree", "DFS"],
    tests: [
      {
        input: "5\n1 2\n2 3\n3 4\n4 5\n",
        expectedOutput: "4\n",
        isSample: true,
      },
      {
        input: "4\n1 2\n1 3\n1 4\n",
        expectedOutput: "1\n",
        isSample: true,
      },
      { input: "1\n", expectedOutput: "0\n", isSample: false },
      { input: "2\n1 2\n", expectedOutput: "1\n", isSample: false },
      {
        input: "6\n1 2\n2 3\n2 4\n3 5\n3 6\n",
        expectedOutput: "3\n",
        isSample: false,
      },
      { input: chainEdges(200000), expectedOutput: "199999\n", isSample: false },
      { input: starEdges(200000), expectedOutput: "1\n", isSample: false },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ng = [[] for _ in range(n + 1)]\nfor i in range(n - 1):\n    u = data[1 + 2 * i]\n    v = data[2 + 2 * i]\n    g[u].append(v)\n    g[v].append(u)\nparent = [0] * (n + 1)\nparent[1] = -1\norder = [1]\nfor u in order:\n    for v in g[u]:\n        if parent[v] == 0:\n            parent[v] = u\n            order.append(v)\nheight = [0] * (n + 1)\nfor u in reversed(order):\n    for v in g[u]:\n        if v != parent[u] and height[v] + 1 > height[u]:\n            height[u] = height[v] + 1\nprint(height[1])\n",
  },
  {
    slug: "learn-m5-tree-bitmask-dp-e3",
    title: "Best Root-to-Leaf Path",
    statement:
      "ক্লাব-ট্রির প্রতিটি নোডে নুসরাত পুরস্কার রেখেছে — কিছু নোডে জরিমানাও (ঋণাত্মক মান)। মূল দরজা নোড `1`; সেখান থেকে হেঁটে কোনো একটা **পাতা নোডে** (যার কোনো সন্তান নেই) পৌঁছে যাত্রা শেষ করতে হবে। পথে পা রাখা প্রতিটি নোডের মান তোলা যায় — শুরুর নোডের মানসহ।\n\nপথ বেছে নিয়ে সর্বোচ্চ কত মান তোলা যায়, সেটা বের করো। ট্রিতে একটামাত্র নোড থাকলে সেটাই শুরু ও শেষ — তার মানই উত্তর।\n\nউদাহরণ: নোড `1`-এর মান `3`, `1-2` আর `1-3` এজ, `2-4`, `2-5` এজ; মান `[-, -2, 7, 10, 1]` হলে পথ `1 → 2 → 4` নিলে `3 + (-2) + 10 = 11` — এটাই সর্বোচ্চ।",
    inputFormat:
      "প্রথম লাইনে নোডের সংখ্যা `n`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা — প্রতিটি নোডের মান। পরের `n - 1` লাইনে এজ `u v`।",
    outputFormat: "সর্বোচ্চ পথের মোট মান এক লাইনে প্রিন্ট করো।",
    constraints:
      "`1 <= n <= 200000`\n`-10^9 <= value_i <= 10^9`\nনোড `1` থেকে সব নোডে পৌঁছানো যায়।",
    editorial:
      "## ধারণা\n\n`dp[u]` ধরো `u` থেকে শুরু করে তার নিচের কোনো পাতায় পৌঁছানো পথের সর্বোচ্চ মান (নিজের মানসহ)। পাতা নোডের জন্য পথ একঘরের — `dp = নিজের মান`। ভেতরের নোডের জন্য সন্তানদের সেরাটা বেছে নিজের মান যোগ করো: `dp[u] = value[u] + max(dp[v])`। উত্তর `dp[1]`।\n\nনিচ থেকে উপরে ভরার ক্রম আগের মতোই: BFS ক্রম উল্টো করে ঘুরলে সন্তানদের `dp` আগেই তৈরি। সন্তান নেই কি না আলাদা করে দেখতে হবে — সন্তান না থাকলে `max` খালি, তখন নিজের মানই `dp`। মান ঋণাত্মক হতে পারে, তাই খালি সন্তান-লুপের আলামত হিসেবে শূন্য নয় — বিশাল ঋণাত্মক মান ব্যবহার করো।\n\n## ধাপে ধাপে\n\n1. মান ও এজ পড়ে adjacency list বানাও; নোড `1` থেকে `parent` আর `order` তৈরি করো।\n2. `dp` অ্যারে বিশাল ঋণাত্মক দিয়ে শুরু করো।\n3. `order` উল্টো করে ঘুরে: সন্তানদের মধ্যে সর্বোচ্চ `dp` খোঁজো — কেউ না থাকলে সেরা ধরো `0`-নয়, নিজের মানই বসাও।\n4. `dp[1]` প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nvals = data[1:n + 1]\nbase = n + 1\ng = [[] for _ in range(n + 1)]\nfor i in range(n - 1):\n    u = data[base + 2 * i]\n    v = data[base + 2 * i + 1]\n    g[u].append(v)\n    g[v].append(u)\nparent = [0] * (n + 1)\nparent[1] = -1\norder = [1]\nfor u in order:\n    for v in g[u]:\n        if parent[v] == 0:\n            parent[v] = u\n            order.append(v)\nNEG = -(1 << 62)\ndp = [NEG] * (n + 1)\nfor u in reversed(order):\n    best = NEG\n    for v in g[u]:\n        if v != parent[u] and dp[v] > best:\n            best = dp[v]\n    dp[u] = vals[u - 1] if best == NEG else vals[u - 1] + best\nprint(dp[1])\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(n)` — প্রতিটি নোড ও এজ একবারই প্রক্রিয়া হয়।\n\n## সাধারণ ভুল\n\n- পাতার কেস ভুলে যাওয়া: সন্তান না থাকলে `max` খালি — `dp`-তে `0` বা পুরনো মান বসে গেলে সব পথের হিসাব নষ্ট।\n- খালি সন্তানের আলামত শূন্য রাখা: মান ঋণাত্মক হলে `0` আসল সন্তানের মান ভেবে বসে যায় — বিশাল ঋণাত্মক আলামত ব্যবহার করো।\n- যেকোনো নোডে থামা অনুমতি ধরা: প্রশ্নে যাত্রা পাতায় শেষ হতেই হবে — মাঝপথের সেরা মান গোনা যাবে না।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Tree", "Path"],
    tests: [
      {
        input: "5\n3 -2 7 10 1\n1 2\n1 3\n2 4\n2 5\n",
        expectedOutput: "11\n",
        isSample: true,
      },
      {
        input: "4\n2 5 7 -3\n1 2\n1 3\n1 4\n",
        expectedOutput: "9\n",
        isSample: true,
      },
      { input: "1\n42\n", expectedOutput: "42\n", isSample: false },
      {
        input:
          "5\n-1000000000 1000000000 1000000000 1000000000 1000000000\n1 2\n1 3\n1 4\n1 5\n",
        expectedOutput: "0\n",
        isSample: false,
      },
      {
        input:
          "200000\n" +
          Array.from({ length: 200000 }, () => -1000000000).join(" ") +
          "\n" +
          Array.from({ length: 199999 }, (_, i) => `${i + 1} ${i + 2}`).join("\n") +
          "\n",
        expectedOutput: "-200000000000000\n",
        isSample: false,
      },
      {
        input:
          "200000\n" +
          Array.from({ length: 200000 }, (_, i) => i + 1).join(" ") +
          "\n" +
          Array.from({ length: 199999 }, (_, i) => `${i + 1} ${i + 2}`).join("\n") +
          "\n",
        expectedOutput: "20000100000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nvals = data[1:n + 1]\nbase = n + 1\ng = [[] for _ in range(n + 1)]\nfor i in range(n - 1):\n    u = data[base + 2 * i]\n    v = data[base + 2 * i + 1]\n    g[u].append(v)\n    g[v].append(u)\nparent = [0] * (n + 1)\nparent[1] = -1\norder = [1]\nfor u in order:\n    for v in g[u]:\n        if parent[v] == 0:\n            parent[v] = u\n            order.append(v)\nNEG = -(1 << 62)\ndp = [NEG] * (n + 1)\nfor u in reversed(order):\n    best = NEG\n    for v in g[u]:\n        if v != parent[u] and dp[v] > best:\n            best = dp[v]\n    dp[u] = vals[u - 1] if best == NEG else vals[u - 1] + best\nprint(dp[1])\n",
  },
  {
    slug: "learn-m5-tree-bitmask-dp-m2",
    title: "Sum of All Pairwise Distances",
    statement:
      "ক্লাব-কেন্দ্রগুলোর ট্রি-মানচিত্রে প্রতি মাসে সব জোড়া কেন্দ্রের মধ্যে দূরত্ব মিলিয়ে মোট সংযোগ-ব্যয়ের হিসাব রাখতে হয়। দুই নোডের দূরত্ব হলো তাদের মধ্যের এজগুলোর সংখ্যা।\n\nসব `i < j` জোড়ার দূরত্ব মিলিয়ে মোট কত, সেটা বের করো।\n\nউদাহরণ: সোজা লাইনের ট্রি `1-2-3-4-5`-এ জোড়াগুলোর দূরত্ব `1+2+3+4+1+2+3+1+2+1 = 20`।",
    inputFormat:
      "প্রথম লাইনে নোডের সংখ্যা `n`। পরের `n - 1` লাইনে এজ `u v`।",
    outputFormat: "সব জোড়ার দূরত্বের যোগফল এক লাইনে প্রিন্ট করো।",
    constraints:
      "`1 <= n <= 200000`\nনোড `1` থেকে সব নোডে পৌঁছানো যায়।",
    editorial:
      "## ধারণা\n\nপ্রতিটি এজ আলাদা করে ভাবো। ট্রি থেকে এজ `(u, v)` কাটলে দুই টুকরো হয়: এক দিকে `size`টা নোড, অন্য দিকে `n - size`টা। যেসব জোড়ার পথ এই এজ দিয়ে যায়, তারা ঠিক দুই টুকরোর দুই পাশ থেকে আসে — তাদের সংখ্যা `size * (n - size)`। কাজেই মোট দূরত্ব = প্রতিটি এজের জন্য `size * (n - size)` যোগফল, যেখানে `size` হলো এজের নিচের দিকের সাবট্রির নোড সংখ্যা।\n\nসাবট্রি সাইজ বের করাই subtree DP: BFS ক্রম উল্টো করে ঘুরে প্রতিটি নোডে সন্তানদের সাইজ যোগ করো। এতে প্রতিটি জোড়ার দূরত্ব আলাদা করে BFS চালানোর দরকারই পড়ে না — `O(n^2)` থেকে নেমে আসে `O(n)`-এ।\n\n## ধাপে ধাপে\n\n1. এজ পড়ে adjacency list বানাও; নোড `1` থেকে `parent` ও `order` তৈরি করো।\n2. `size = [1] * (n + 1)` দিয়ে শুরু করে `order` উল্টো ক্রমে প্রতিটি `u`-এর সাইজ বাবার সাইজে যোগ করো।\n3. প্রতিটি `u != 1`-এর জন্য `size[u] * (n - size[u])` যোগ করে মোট হিসাব করো — `u` তার বাবার সাথে যুক্ত এজের নিচের পাশের সাইজ।\n4. যোগফল প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ng = [[] for _ in range(n + 1)]\nfor i in range(n - 1):\n    u = data[1 + 2 * i]\n    v = data[2 + 2 * i]\n    g[u].append(v)\n    g[v].append(u)\nparent = [0] * (n + 1)\nparent[1] = -1\norder = [1]\nfor u in order:\n    for v in g[u]:\n        if parent[v] == 0:\n            parent[v] = u\n            order.append(v)\nsize = [1] * (n + 1)\nfor u in reversed(order[1:]):\n    size[parent[u]] += size[u]\ntotal = 0\nfor u in order[1:]:\n    total += size[u] * (n - size[u])\nprint(total)\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(n)`। `n = 2 * 10^5`-এও নিমেষে চলে; উত্তর 64-বিটের মধ্যেই থাকে (`~4.4 * 10^15`)।\n\n## সাধারণ ভুল\n\n- প্রতিটি জোড়ায় BFS চালানো: `O(n^2)` হয়ে `n = 200000`-এ সময় শেষ; এজ-প্রতি হিসাবই কম।\n- `u = 1` (মূল) ধরে এজ হিসাব করা: মূলের ওপরে আর এজ নেই — `order[1:]` ঘুরো, নাহলে একটা এজ বাড়তি গোনা হয়।\n- সাইজ আপডেটের ক্রম: সামনে থেকে ঘুরলে সন্তানের সাইজ এখনো ভরাই হয়নি — উল্টো ক্রমে ঘুরো।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Tree", "Rerooting"],
    tests: [
      {
        input: "5\n1 2\n2 3\n3 4\n4 5\n",
        expectedOutput: "20\n",
        isSample: true,
      },
      {
        input: "4\n1 2\n1 3\n1 4\n",
        expectedOutput: "9\n",
        isSample: true,
      },
      { input: "1\n", expectedOutput: "0\n", isSample: false },
      {
        input: "4\n1 2\n2 3\n2 4\n",
        expectedOutput: "9\n",
        isSample: false,
      },
      { input: chainEdges(200000), expectedOutput: "1333333333300000\n", isSample: false },
      { input: starEdges(200000), expectedOutput: "39999600001\n", isSample: false },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ng = [[] for _ in range(n + 1)]\nfor i in range(n - 1):\n    u = data[1 + 2 * i]\n    v = data[2 + 2 * i]\n    g[u].append(v)\n    g[v].append(u)\nparent = [0] * (n + 1)\nparent[1] = -1\norder = [1]\nfor u in order:\n    for v in g[u]:\n        if parent[v] == 0:\n            parent[v] = u\n            order.append(v)\nsize = [1] * (n + 1)\nfor u in reversed(order[1:]):\n    size[parent[u]] += size[u]\ntotal = 0\nfor u in order[1:]:\n    total += size[u] * (n - size[u])\nprint(total)\n",
  },
  {
    slug: "learn-m5-tree-bitmask-dp-m3",
    title: "Dorm Room Pairs",
    statement:
      "ক্লাবের `n` জন সদস্য একটা ট্রি-কাঠামোয় যুক্ত (প্রতিটি জোড় ঠিক একটা রাস্তায়)। ফেস্টিভাল রাতে হোস্টেলে জোড়া বাঁধতে হবে: একটা জোড়া মানে ট্রির **একটা এজ** বেছে তার দুই প্রান্তের দুই সদস্য এক কক্ষে — কিন্তু এক সদস্য একটার বেশি জোড়ায় থাকতে পারবে না।\n\nএমন সর্বোচ্চ কয়টা জোড়া বাঁধা যায় (অর্থাৎ সর্বোচ্চ matching), সেটা বের করো।\n\nউদাহরণ: সোজা লাইন `1-2-3-4`-এ জোড়া `(1,2)` আর `(3,4)` — উত্তর `2`; তারাকৃতি ট্রিতে (`1` কেন্দ্রে বাকি সব পাতা) কেন্দ্র একবারই ব্যবহার হয়, উত্তর `1`।",
    inputFormat:
      "প্রথম লাইনে নোডের সংখ্যা `n`। পরের `n - 1` লাইনে এজ `u v`।",
    outputFormat: "সর্বোচ্চ জোড়ার সংখ্যা এক লাইনে প্রিন্ট করো।",
    constraints:
      "`1 <= n <= 200000`\nনোড `1` থেকে সব নোডে পৌঁছানো যায়।",
    editorial:
      "## ধারণা\n\nপ্রতিটি নোডে দুইটা অবস্থা: `dp0[u]` = `u`-এর সাবট্রিতে `u` **জোড়ায় না থাকলে** সর্বোচ্চ জোড়া, `dp1[u]` = `u` তার কোনো এক সন্তানের সাথে জোড়ায় থাকলে সর্বোচ্চ জোড়া। সন্তানদের সবাইকে ঘুরে:\n\n- `dp0[u] = sum(max(dp0[v], dp1[v]))` — `u` মুক্ত, প্রতিটি সন্তান নিজের ইচ্ছেমতো জোড়ায় থাকতে পারে।\n- `dp1[u] = dp0[u] + সেরা লাভ` — ঠিক একটা সন্তান `v`-কে বেছে তার সাথে জোড়া: তখন `v` অবশ্যই মুক্ত থাকতে হবে (`dp0[v]`), আর `v`-এর অবস্থা বদলে যাওয়ায় `dp0[u]` থেকে `v`-এর পুরনো চাপ বাদ দিয়ে নতুন চাপ বসাতে হয়। লাভ = `1 + dp0[v] - max(dp0[v], dp1[v])`; সব সন্তানের মধ্যে সর্বোচ্চ লাভটা নাও।\n\nসন্তান না থাকলে `dp1` ব্যবহারযোগ্য নয়। উত্তর `max(dp0[1], dp1[1])`। নিচ থেকে উপরে ভরার ক্রম আগের মতোই।\n\n## ধাপে ধাপে\n\n1. এজ পড়ে adjacency list, `parent`, `order` তৈরি করো।\n2. `order` উল্টো করে প্রতিটি `u`-এ: সন্তানদের `max(dp0, dp1)` যোগ করো (`base`), আর প্রতিটি সন্তানের `1 + dp0[v] - max(...)` লাভের সর্বোচ্চটা রাখো।\n3. `dp0[u] = base`; সন্তান থাকলে `dp1[u] = base + সেরা লাভ`, নাহলে `0`।\n4. `max(dp0[1], dp1[1])` প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ng = [[] for _ in range(n + 1)]\nfor i in range(n - 1):\n    u = data[1 + 2 * i]\n    v = data[2 + 2 * i]\n    g[u].append(v)\n    g[v].append(u)\nparent = [0] * (n + 1)\nparent[1] = -1\norder = [1]\nfor u in order:\n    for v in g[u]:\n        if parent[v] == 0:\n            parent[v] = u\n            order.append(v)\ndp0 = [0] * (n + 1)\ndp1 = [0] * (n + 1)\nfor u in reversed(order):\n    base = 0\n    best_gain = 0\n    has_child = False\n    for v in g[u]:\n        if v == parent[u]:\n            continue\n        has_child = True\n        m = dp0[v] if dp0[v] > dp1[v] else dp1[v]\n        base += m\n        gain = 1 + dp0[v] - m\n        if gain > best_gain:\n            best_gain = gain\n    dp0[u] = base\n    dp1[u] = base + best_gain if has_child else 0\nprint(dp0[1] if dp0[1] > dp1[1] else dp1[1])\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(n)` — প্রতিটি নোডে সন্তান লুপ মোট মিলিয়ে `n` ধাপ।\n\n## সাধারণ ভুল\n\n- `dp1`-এ সন্তানের `dp1` ব্যবহার করা: বাবা-সন্তান জোড়া হলে সন্তান আর নিজের কারো সাথে জোড়ায় থাকতে পারবে না — `dp0[v]` ব্যবহার করো।\n- পাতার `dp1` শূন্য না রাখা: সন্তান নেই, জোড়া বাঁধার সুযোগও নেই — `0` বসালে `max` ভুল করে বাড়তি জোড়া গোনে।\n- লোভী জোড়া (যেকোনো পাতা-বাবা বেছে নেওয়া): ছোট ট্রিতে ঠেকে যায়, কিন্তু এজ-বাছাইয়ের ক্রম ভুল হলে সর্বোচ্চ থেকে পিছিয়ে যায় — দুই অবস্থার `dp`-ই রাখো।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Tree", "Matching"],
    tests: [
      {
        input: "4\n1 2\n2 3\n3 4\n",
        expectedOutput: "2\n",
        isSample: true,
      },
      {
        input: "4\n1 2\n1 3\n1 4\n",
        expectedOutput: "1\n",
        isSample: true,
      },
      { input: "1\n", expectedOutput: "0\n", isSample: false },
      { input: "2\n1 2\n", expectedOutput: "1\n", isSample: false },
      {
        input: "5\n1 2\n2 3\n3 4\n2 5\n",
        expectedOutput: "2\n",
        isSample: false,
      },
      { input: chainEdges(200000), expectedOutput: "100000\n", isSample: false },
      { input: starEdges(200000), expectedOutput: "1\n", isSample: false },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ng = [[] for _ in range(n + 1)]\nfor i in range(n - 1):\n    u = data[1 + 2 * i]\n    v = data[2 + 2 * i]\n    g[u].append(v)\n    g[v].append(u)\nparent = [0] * (n + 1)\nparent[1] = -1\norder = [1]\nfor u in order:\n    for v in g[u]:\n        if parent[v] == 0:\n            parent[v] = u\n            order.append(v)\ndp0 = [0] * (n + 1)\ndp1 = [0] * (n + 1)\nfor u in reversed(order):\n    base = 0\n    best_gain = 0\n    has_child = False\n    for v in g[u]:\n        if v == parent[u]:\n            continue\n        has_child = True\n        m = dp0[v] if dp0[v] > dp1[v] else dp1[v]\n        base += m\n        gain = 1 + dp0[v] - m\n        if gain > best_gain:\n            best_gain = gain\n    dp0[u] = base\n    dp1[u] = base + best_gain if has_child else 0\nprint(dp0[1] if dp0[1] > dp1[1] else dp1[1])\n",
  },
  {
    slug: "learn-m5-tree-bitmask-dp-h2",
    title: "Skill Tree Budget",
    statement:
      "অনলাইন কোর্স প্ল্যাটফর্মে সাদিয়ার সামনে একটা স্কিল-ট্রি: `n`টা স্কিল, নোড `1` মূল স্কিল। স্কিল `i` কিনতে খরচ `cost_i` আর শেখার মান `val_i`। নিয়ম কড়া: **কোনো স্কিল কিনতে হলে তার বাবার স্কিলও অবশ্যই আগে কেনা থাকতে হবে** — যে সেট কিনবে সেটা বংশধারায় বন্ধ হতে হবে।\n\nমোট বাজেট `W` টাকা; যেসব স্কিল কিনবে তাদের খরচের যোগফল `W` ছাড়াতে পারবে না। বাজেটের মধ্যে সর্বোচ্চ কত মোট মান অর্জন করা যায়, সেটা বের করো। কিছুই না কেনাও বৈধ — তখন মান `0`।\n\nউদাহরণ: চেইন `1-2-3-4`, খরচ `1 1 2 3`, মান `5 10 20 40`, বাজেট `2` — স্কিল `1` আর `2` কিনলে খরচ `2`, মান `15`; বাজেট `4` হলে `1, 2, 3` কিনে মান `35`।",
    inputFormat:
      "প্রথম লাইনে স্কিলের সংখ্যা `n` আর বাজেট `W`। দ্বিতীয় লাইনে `n`টি খরচ। তৃতীয় লাইনে `n`টি মান। পরের `n - 1` লাইনে এজ `u v`।",
    outputFormat: "সর্বোচ্চ মোট মান এক লাইনে প্রিন্ট করো।",
    constraints:
      "`1 <= n <= 1000`\n`1 <= W <= 1000`\n`1 <= cost_i <= 1000`\n`1 <= val_i <= 10^9`",
    editorial:
      "## ধারণা\n\nএটা ট্রি DP আর ন্যাপস্যাকের জোড়া। ট্রিকে DFS **প্রি-অর্ডার** ক্রমে সাজালে (বাবা তার পুরো সাবট্রির আগে, আর প্রতিটি সাবট্রি পাশাপাশি একটা ব্লকে) একটা সুন্দর গুণ পাওয়া যায়: `dp[i][j]` ধরো প্রি-অর্ডারের `i` নম্বর অবস্থান থেকে শেষ পর্যন্ত স্কিলগুলোর মধ্যে বাজেট `j`-তে সর্বোচ্চ মান। তাহলে অবস্থান `i`-এ যে স্কিল `u` বসে আছে, তার দুইটা সিদ্ধান্ত:\n\n- **না কিনলে** `u`-এর পুরো সাবট্রি বাদ — লাফ দাও `i + size[u]` অবস্থানে: `dp[i][j] = dp[i + size[u]][j]`\n- **কিনলে** খরচ `w` কাটো, মান যোগ করো, আর পরের অবস্থান থেকে চালিয়ে যাও: `dp[i][j] = dp[i + 1][j - w] + val`\n\nপ্রতিটি সাবট্রি পাশাপাশি ব্লক হওয়াই এই সূত্রের প্রাণ — `i + 1` অবস্থানে `u`-এর সন্তানেরা আছে, আর `i + size[u]`-এ সাবট্রির বাইরের স্কিলগুলো। BFS ক্রমে এই গুণটা থাকে না (সাবট্রি ছড়িয়ে পড়ে), তাই অবশ্যই DFS প্রি-অর্ডার লাগবে। ভরা হয় পিছন থেকে সামনে: `i = n-1 ... 0`।\n\n## ধাপে ধাপে\n\n1. ইনপুট পড়ে adjacency list বানাও; stack DFS দিয়ে প্রি-অর্ডার `order` আর `parent` তৈরি করো (রিকার্শন নয় — `n = 1000` লম্বা ট্রিতেও নিরাপদ)।\n2. `order` উল্টো করে প্রতিটি `u`-এর সাবট্রি সাইজ `sz[u]` বসাও।\n3. `dp` টেবিল `(n + 1) x (W + 1)`, শেষ সারি সব শূন্য (কোনো স্কিল নেই)। `i = n - 1` থেকে `0`: `dp[i]` শুরুতে `dp[i + sz[u]]`-এর কপি, তারপর কেনার সিদ্ধান্তে `j = W ... w` লুপে `dp[i][j] = max(dp[i][j], dp[i+1][j-w] + val)`।\n4. `dp[0][W]` প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn, W = data[0], data[1]\ncosts = data[2:2 + n]\nvals = data[2 + n:2 + 2 * n]\nbase = 2 + 2 * n\ng = [[] for _ in range(n + 1)]\nfor i in range(n - 1):\n    u = data[base + 2 * i]\n    v = data[base + 2 * i + 1]\n    g[u].append(v)\n    g[v].append(u)\nparent = [0] * (n + 1)\nparent[1] = -1\norder = []\nstack = [1]\nwhile stack:\n    u = stack.pop()\n    order.append(u)\n    for v in g[u]:\n        if parent[v] == 0:\n            parent[v] = u\n            stack.append(v)\nsz = [1] * (n + 1)\nfor u in reversed(order[1:]):\n    sz[parent[u]] += sz[u]\ndp = [[0] * (W + 1) for _ in range(n + 1)]\nfor i in range(n - 1, -1, -1):\n    u = order[i]\n    w = costs[u - 1]\n    v = vals[u - 1]\n    dp[i] = list(dp[i + sz[u]])\n    for j in range(W, w - 1, -1):\n        cand = dp[i + 1][j - w] + v\n        if cand > dp[i][j]:\n            dp[i][j] = cand\nprint(dp[0][W])\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n * W)` — প্রতিটি অবস্থানে বাজেটের সারি একবার কপি একবার আপডেট। স্পেস `O(n * W)`। `n = W = 1000`-এ দশ লক্ষ ঘর, Python-এও কয়েক সেকেন্ডের মধ্যে।\n\n## সাধারণ ভুল\n\n- BFS ক্রম ব্যবহার করা: BFS-এ এক নোডের সাবট্রি পাশাপাশি থাকে না, লাফের অবস্থান `i + sz[u]` ভুল জায়গায় পড়ে — প্রি-অর্ডারই লাগবে।\n- সাধারণ 0/1 ন্যাপস্যাকের মতো পিছনের লুপ সাজানো: এখানে কপি নিয়ে কাজ হয়ে যায়, কিন্তু `dp[i]`-কে `dp[i + sz[u]]` দিয়ে শুরু করতেই হবে — নাহলে সাবট্রি বাদ দেওয়ার সিদ্ধান্তটাই হারায়।\n- বংশধারা শর্ত ভুলে সব স্কিল স্বাধীন ভাবা: কেনার সিদ্ধান্ত যেহেতু সাবট্রি-ব্লক ধরে চলে, বাবা না কিনে নিচের স্কিল কেনার রাস্তাই খোলা যায় না।\n- `sz` ভরার ক্রম সামনে থেকে চালানো: সাইজ তখনো ভরা হয়নি — উল্টো ক্রমে ভরো।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Dynamic Programming", "Tree", "Knapsack"],
    tests: [
      {
        input: "4 2\n1 1 2 3\n5 10 20 40\n1 2\n2 3\n3 4\n",
        expectedOutput: "15\n",
        isSample: true,
      },
      {
        input: "4 4\n1 1 2 3\n5 10 20 40\n1 2\n2 3\n3 4\n",
        expectedOutput: "35\n",
        isSample: true,
      },
      {
        input: "1 4\n5\n100\n",
        expectedOutput: "0\n",
        isSample: false,
      },
      {
        input: "1 5\n5\n100\n",
        expectedOutput: "100\n",
        isSample: false,
      },
      {
        input: "4 21\n1 10 10 10\n1 100 100 100\n1 2\n1 3\n1 4\n",
        expectedOutput: "201\n",
        isSample: false,
      },
      {
        input: "4 20\n1 10 10 10\n1 100 100 100\n1 2\n1 3\n1 4\n",
        expectedOutput: "101\n",
        isSample: false,
      },
      {
        input:
          "1000 1000\n" +
          Array.from({ length: 1000 }, (_, i) => (i === 0 ? 1 : 2)).join(" ") +
          "\n" +
          Array.from({ length: 1000 }, (_, i) => (i === 0 ? 1 : 5)).join(" ") +
          "\n" +
          Array.from({ length: 999 }, (_, i) => `1 ${i + 2}`).join("\n") +
          "\n",
        expectedOutput: "2496\n",
        isSample: false,
      },
      {
        input:
          "1000 500\n" +
          Array.from({ length: 1000 }, () => 1).join(" ") +
          "\n" +
          Array.from({ length: 1000 }, () => 2).join(" ") +
          "\n" +
          Array.from({ length: 999 }, (_, i) => `${i + 1} ${i + 2}`).join("\n") +
          "\n",
        expectedOutput: "1000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, W = data[0], data[1]\ncosts = data[2:2 + n]\nvals = data[2 + n:2 + 2 * n]\nbase = 2 + 2 * n\ng = [[] for _ in range(n + 1)]\nfor i in range(n - 1):\n    u = data[base + 2 * i]\n    v = data[base + 2 * i + 1]\n    g[u].append(v)\n    g[v].append(u)\nparent = [0] * (n + 1)\nparent[1] = -1\norder = []\nstack = [1]\nwhile stack:\n    u = stack.pop()\n    order.append(u)\n    for v in g[u]:\n        if parent[v] == 0:\n            parent[v] = u\n            stack.append(v)\nsz = [1] * (n + 1)\nfor u in reversed(order[1:]):\n    sz[parent[u]] += sz[u]\ndp = [[0] * (W + 1) for _ in range(n + 1)]\nfor i in range(n - 1, -1, -1):\n    u = order[i]\n    w = costs[u - 1]\n    v = vals[u - 1]\n    dp[i] = list(dp[i + sz[u]])\n    for j in range(W, w - 1, -1):\n        cand = dp[i + 1][j - w] + v\n        if cand > dp[i][j]:\n            dp[i][j] = cand\nprint(dp[0][W])\n",
  },
];
