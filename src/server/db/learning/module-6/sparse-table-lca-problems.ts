import type { SeedProblem } from "../../seed-problems";
import { newlineOutput } from "../generated-tests";
import { makeSeg } from "./segment-tree-problems";

type TreeOracle = { parent: number[]; depth: number[]; weight: number[] };

export function buildTree(n: number, kind: "chain" | "binary"): { edges: number[][]; oracle: TreeOracle } {
  const parent = new Array<number>(n + 1).fill(0);
  const depth = new Array<number>(n + 1).fill(0);
  const weight = new Array<number>(n + 1).fill(0);
  const edges: number[][] = [];
  parent[1] = 1;
  for (let i = 2; i <= n; i += 1) {
    const p = kind === "chain" ? i - 1 : Math.floor(i / 2);
    parent[i] = p;
    depth[i] = depth[p] + 1;
    weight[i] = (i * 48271) % 1000000001;
    edges.push([p, i]);
  }
  return { edges, oracle: { parent, depth, weight } };
}

export function lcaNaive(o: TreeOracle, u: number, v: number): number {
  let a = u, b = v;
  while (o.depth[a] > o.depth[b]) a = o.parent[a];
  while (o.depth[b] > o.depth[a]) b = o.parent[b];
  while (a !== b) { a = o.parent[a]; b = o.parent[b]; }
  return a;
}

function isAncestor(o: TreeOracle, u: number, v: number): boolean {
  let x = v;
  for (;;) {
    if (x === u) return true;
    if (x === o.parent[x]) return false;
    x = o.parent[x];
  }
}

function treeText(n: number, edges: number[][], queries: number[][]): string {
  const edgeLines = edges.map((edge) => edge.join(" ")).join("\n");
  const queryLines = queries.map((query) => query.join(" ")).join("\n");
  const edgeBlock = edgeLines.length > 0 ? `${edgeLines}\n` : "";
  return `${n} ${queries.length}\n${edgeBlock}${queryLines}\n`;
}

function queryPairs(n: number, q: number): number[][] {
  const queries: number[][] = [];
  for (let k = 0; k < q; k += 1) queries.push([((k * 7919) % n) + 1, ((k * 104729) % n) + 1]);
  return queries;
}

function rangeQueries(n: number, q: number): number[][] {
  const queries: number[][] = [];
  for (let k = 0; k < q; k += 1) {
    const a = ((k * 7919) % n) + 1, b = ((k * 104729) % n) + 1;
    queries.push([Math.min(a, b), Math.max(a, b)]);
  }
  return queries;
}

function treeLarge(kind: "chain" | "binary", n: number, q: number, mode: "lca" | "dist" | "anc"): {
  input: string;
  expectedOutput: string;
} {
  const { edges, oracle } = buildTree(n, kind);
  const queries = queryPairs(n, q);
  const answers = queries.map(([u, v]) => {
    if (mode === "lca") return String(lcaNaive(oracle, u, v));
    if (mode === "dist") {
      const w = lcaNaive(oracle, u, v);
      return String(oracle.depth[u] + oracle.depth[v] - 2 * oracle.depth[w]);
    }
    return isAncestor(oracle, u, v) ? "YES" : "NO";
  });
  return { input: treeText(n, edges, queries), expectedOutput: newlineOutput(answers) };
}

function kthLarge(kind: "chain" | "binary", n: number, q: number): {
  input: string;
  expectedOutput: string;
} {
  const { edges, oracle } = buildTree(n, kind);
  const queries: number[][] = [];
  const answers: string[] = [];
  for (let k = 0; k < q; k += 1) {
    const u = ((k * 7919) % n) + 1;
    const steps = ((k * 37) % n) + 1;
    queries.push([u, steps]);
    let x = u, remaining = steps;
    while (remaining > 0 && x !== oracle.parent[x]) { x = oracle.parent[x]; remaining -= 1; }
    answers.push(remaining === 0 ? String(x) : "-1");
  }
  return { input: treeText(n, edges, queries), expectedOutput: newlineOutput(answers) };
}

function pathMaxLarge(kind: "chain" | "binary", n: number, q: number): {
  input: string;
  expectedOutput: string;
} {
  const { edges, oracle } = buildTree(n, kind);
  const queries = queryPairs(n, q).map(([u, v]) => [u, u === v ? (v % n) + 1 : v]);
  const answers = queries.map(([u, v]) => {
    let a = u, b = v, best = -1;
    while (oracle.depth[a] > oracle.depth[b]) { best = Math.max(best, oracle.weight[a]); a = oracle.parent[a]; }
    while (oracle.depth[b] > oracle.depth[a]) { best = Math.max(best, oracle.weight[b]); b = oracle.parent[b]; }
    while (a !== b) {
      best = Math.max(best, oracle.weight[a], oracle.weight[b]);
      a = oracle.parent[a];
      b = oracle.parent[b];
    }
    return String(best);
  });
  const edgeLines = edges.map((edge) => `${edge[0]} ${edge[1]} ${oracle.weight[edge[1]]}`).join("\n");
  const queryLines = queries.map((query) => query.join(" ")).join("\n");
  return { input: `${n} ${q}\n${edgeLines}\n${queryLines}\n`, expectedOutput: newlineOutput(answers) };
}

function sparseG1Large(): { input: string; expectedOutput: string } {
  const n = 100000, q = 5000;
  const values: number[] = [];
  for (let i = 0; i < n; i += 1) values.push(((i * 7919) % 1000000000) + 1);
  const gcd = (a: number, b: number): number => {
    while (b !== 0) { const t = a % b; a = b; b = t; }
    return Math.abs(a);
  };
  const seg = makeSeg(values, 0, gcd);
  const queries = rangeQueries(n, q);
  const answers = queries.map(([l, r]) => seg.range(l, r));
  const tail = `${queries.map(([l, r]) => `${l} ${r}`).join("\n")}\n`;
  return { input: `${n} ${q}\n${values.join(" ")}\n${tail}`, expectedOutput: newlineOutput(answers) };
}

function sparseX1Large(n: number, q: number): { input: string; expectedOutput: string } {
  const values: number[] = [];
  for (let i = 0; i < n; i += 1) values.push(((i * 2654435761) % 1000000000) + 1);
  const positions = new Map<number, number[]>();
  values.forEach((value, index) => {
    const list = positions.get(value);
    if (list) list.push(index);
    else positions.set(value, [index]);
  });
  const seg = makeSeg(values, Infinity, Math.min);
  const queries = rangeQueries(n, q);
  const answers = queries.map(([l, r]) => {
    const min = seg.range(l, r);
    const list = positions.get(min) ?? [];
    let lo = 0, hi = list.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (list[mid] < l - 1) lo = mid + 1;
      else hi = mid;
    }
    return `${min} ${list[lo] + 1}`;
  });
  const tail = `${queries.map(([l, r]) => `${l} ${r}`).join("\n")}\n`;
  return { input: `${n} ${q}\n${values.join(" ")}\n${tail}`, expectedOutput: newlineOutput(answers) };
}

export const SPARSE_TABLE_LCA_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m6-sparse-table-lca-g1",
    title: "Range GCD Query",
    statement:
      "রাফির অ্যান্টেনা সারি ধরে লাগানো — প্রতিটি অ্যান্টেনা নির্দিষ্ট সময় পর পর বিপ দেয়: `i` নম্বরটির বিরতি `a[i]` সেকেন্ড। একটা রেঞ্জের সব অ্যান্টেনা একসাথে যখন বিপ দেবে, তার বিরতি হয় ওই সংখ্যাগুলোর সাধারণ ভাগকারী (GCD)।\n\n`q`টি প্রশ্ন দেওয়া থাকবে, প্রতিটিতে `l r` — `l` থেকে `r` অ্যান্টেনা (দুই প্রান্তসহ) ধরে GCD কত প্রিন্ট করুন।\n\nউদাহরণ: `6 9 12` → `gcd(6, 9, 12) = 3`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা। পরের `q` লাইনে `l r`।",
    outputFormat: "`q` লাইনে উত্তর — প্রতিটি রেঞ্জের GCD।",
    constraints: "`1 <= n <= 100000`\n`1 <= q <= 100000`\n`1 <= l <= r <= n`\n`0 <= a_i <= 10^9`",
    editorial:
      "### ধারণা\n\nস্পার্স টেবিলে প্রতিটি ঘরে জমা থাকে দৈর্ঘ্য জোড়ার পাওয়া পাওয়ার ২-এর ঘাত রেঞ্জের উত্তর: `st[k][i]` = `i` থেকে `2^k` ঘর পর্যন্ত GCD। বানানো যায় আগের স্তর দিয়ে — `st[k][i] = gcd(st[k-1][i], st[k-1][i + 2^(k-1)])`। প্রশ্ন `[l, r]`-এ দৈর্ঘ্য `len` নিয়ে `k = floor(log2(len))` ধরুন; তখন দুটো দৈর্ঘ্য `2^k` ব্লক — একটা `l` থেকে, আরেকটা `r - 2^k + 1` থেকে — পুরো রেঞ্জ ঢেকে ফেলে। ব্লক দুটো একসা কিছু ওভারল্যাপ করলেও GCD idempotent (`gcd(x, x) = x`), তাই উত্তর নির্ভুল থাকে।\n\n### ধাপে ধাপে\n\n1. `log2` অ্যারে বসান: `log[i] = log[i // 2] + 1` (`log[1] = 0`)।\n2. `st[0] = arr` ধরে প্রতি স্তরে অর্ধেক দৈর্ঘ্যের ব্লক বানান।\n3. প্রতিটি প্রশ্নে `l = l - 1` (০-ভিত্তিক) করুন, `r` ১-ভিত্তিক রাখুন — তাহলে দৈর্ঘ্য হয় `r - l`।\n4. `k = log[length]`; উত্তর `gcd(st[k][l], st[k][r - 2^k])`।\n5. সব উত্তর এক এক লাইনে প্রিন্ট করুন।\n\n```python\nimport sys, math\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) for _ in range(n)]\nlog = [0] * (n + 1)\nfor i in range(2, n + 1):\n    log[i] = log[i // 2] + 1\nst = [arr[:]]\nlevel = 1\nwhile (1 << level) <= n:\n    prev = st[-1]\n    step = 1 << (level - 1)\n    size = n - (1 << level) + 1\n    st.append([math.gcd(prev[i], prev[i + step]) for i in range(size)])\n    level += 1\nout = []\nfor _ in range(q):\n    l = int(next(it)) - 1\n    r = int(next(it))\n    length = r - l\n    k = log[length]\n    out.append(str(math.gcd(st[k][l], st[k][r - (1 << k)])))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n### কমপ্লেক্সিটি\n\nনির্মাণ `O(n log n)` সময় ও স্পেস, প্রতি প্রশ্ন `O(1)`। `n = 100000`-এ টেবিলে প্রায় `17 * n` ঘর — সহনীয়।\n\n### সাধারণ ভুল\n\n- দৈর্ঘ্য ও ব্লক-শুরু গুলিয়ে ফেলা: `length = r - l` (`l` ইতিমধ্যে ০-ভিত্তিক) এবং দ্বিতীয় ব্লক `r - 2^k`-এ শুরু হয়।\n- **যোগ**-এর জন্য এই কৌশল ব্যবহার করা — ওভারল্যাপ অংশ দুইবার যোগ হয়ে যাবে; GCD/min/max-এ সমস্যা নেই।\n- `log` অ্যারে না বানিয়ে প্রতিবার `log2` বের করা — floating point ভুল দিতে পারে।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Sparse Table", "GCD", "Range Query"],
    tests: [
      { input: "5 3\n6 9 12 18 24\n1 5\n2 4\n3 3\n", expectedOutput: "3\n3\n12\n", isSample: true },
      { input: "1 2\n7\n1 1\n1 1\n", expectedOutput: "7\n7\n", isSample: true },
      { input: "4 2\n2 3 5 7\n1 4\n2 3\n", expectedOutput: "1\n1\n", isSample: false },
      { input: "3 2\n0 0 5\n1 3\n1 2\n", expectedOutput: "5\n0\n", isSample: false },
      { input: "6 2\n4 8 16 32 64 128\n1 6\n3 5\n", expectedOutput: "4\n16\n", isSample: false },
      { ...sparseG1Large(), isSample: false },
    ],
    referencePython:
      "import sys, math\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) for _ in range(n)]\nlog = [0] * (n + 1)\nfor i in range(2, n + 1):\n    log[i] = log[i // 2] + 1\nst = [arr[:]]\nlevel = 1\nwhile (1 << level) <= n:\n    prev = st[-1]\n    step = 1 << (level - 1)\n    size = n - (1 << level) + 1\n    st.append([math.gcd(prev[i], prev[i + step]) for i in range(size)])\n    level += 1\nout = []\nfor _ in range(q):\n    l = int(next(it)) - 1\n    r = int(next(it))\n    length = r - l\n    k = log[length]\n    out.append(str(math.gcd(st[k][l], st[k][r - (1 << k)])))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-sparse-table-lca-g2",
    title: "Lowest Common Ancestor",
    statement:
      "প্রাইমএশিয়া ক্যাম্পাসের রাস্তার ম্যাপ একটা গাছ — রুট ১ নম্বর ভবন। দুইজন শিক্ষার্থী যখন তাদের পথে হাঁটে, পথ দুটো মিলে যে সংযোগস্থলে আসে তাকে তাদের **lowest common ancestor (LCA)** বলে।\n\n`n - 1`টি পথ দেওয়া থাকবে; তারপর `q`টি প্রশ্ন `u v` — `u` আর `v`-এর LCA কে প্রিন্ট করুন।\n\nউদাহরণ: গাছ `1-2, 1-3, 2-4` — LCA(4, 3) = `1`, LCA(4, 2) = `2`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। পরের `n - 1` লাইনে এক একটি পথ `u v`। তারপর `q` লাইনে প্রশ্ন `u v`।",
    outputFormat: "`q` লাইনে উত্তর — প্রতিটি প্রশ্নের LCA (১-ভিত্তিক নোড নম্বর)।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 100000`\nগাছের সব নোড ১ থেকে `n`, রুট ১\n`1 <= u, v <= n`",
    editorial:
      "### ধারণা\n\nBinary lifting-এ `up[k][v]` হলো `v` থেকে `2^k` ধাপ উপরে উঠলে যে নোড পাওয়া যায়। `k = 0` মানে বাবা/মা; এরপর `up[k][v] = up[k-1][up[k-1][v]]` — অর্থাৎ দুইবার অর্ধেক ধাপ। গভীরতা আলাদা দুই নোডের আগে গভীরটাকে তুলে এক গভীরতায় আনতে হয়, তারপর বড় থেকে ছোট `k` ধরে দেখা — `up[k][u] != up[k][v]` হলে দুটো একসাথে উপরে; শেষে তাদের ঠিক উপরেরটাই LCA। পুরোটা `O(log n)` প্রতি প্রশ্নে।\n\n### ধাপে ধাপে\n\n1. BFS/DFS করে প্রতিটি নোডের বাবা ও গভীরতা বের করুন (রুটের বাবা = নিজেই, যাতে lifting কখনো শূন্যে না যায়)।\n2. `LOG = bit_length(n)` ধরে `up` টেবিল বানান — প্রতি স্তরে আগের স্তর দুইবার অ্যাপ্লাই।\n3. প্রশ্নে গভীর নোডটাকে বিট ধরে তুলে দুটোকে এক গভীরতায় আনুন।\n4. একই হলে ওটাই উত্তর; নাহলে উল্টো ক্রমে `LOG-1` থেকে `0` পর্যন্ত দুটোকে একসাথে তুলুন।\n5. শেষে এক ধাপ উপরে (`parent[u]`) প্রিন্ট করুন।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nadj = [[] for _ in range(n + 1)]\nfor _ in range(n - 1):\n    u = int(next(it)); v = int(next(it))\n    adj[u].append(v); adj[v].append(u)\nparent = [0] * (n + 1)\ndepth = [0] * (n + 1)\nparent[1] = 1\norder = [1]\nfor u in order:\n    for v in adj[u]:\n        if v != parent[u]:\n            parent[v] = u\n            depth[v] = depth[u] + 1\n            order.append(v)\nLOG = (n).bit_length()\nup = [parent[:]]\nfor k in range(1, LOG):\n    prev = up[-1]\n    up.append([prev[prev[v]] for v in range(n + 1)])\n\ndef lca(u, v):\n    if depth[u] < depth[v]:\n        u, v = v, u\n    diff = depth[u] - depth[v]\n    bit = 0\n    while diff:\n        if diff & 1:\n            u = up[bit][u]\n        diff >>= 1\n        bit += 1\n    if u == v:\n        return u\n    for k in range(LOG - 1, -1, -1):\n        if up[k][u] != up[k][v]:\n            u = up[k][u]\n            v = up[k][v]\n    return parent[u]\n\nout = []\nfor _ in range(q):\n    u = int(next(it)); v = int(next(it))\n    out.append(str(lca(u, v)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n### কমপ্লেক্সিটি\n\nনির্মাণ `O(n log n)`, প্রতি প্রশ্ন `O(log n)`, স্পেস `O(n log n)`। প্রতিটি ধাপে উপরে ওঠার বদলে পুরো পথ ঘুরলে `O(n)` হতো — লক্ষ প্রশ্নে অচল।\n\n### সাধারণ ভুল\n\n- গভীরতা মানা না করে সরাসরি দুটোকে তোলা — LCA পাওয়া যায় না।\n- `up[0][root] = 0` রাখা — তখন রুটের উপরে ওঠায় ০-এ চলে যায়; নিজেকে বাবা ধরলেই সমস্যা নেই।\n- `u == v` হলেও শেষ লুপ চালানো — উত্তর ভুল বা লুপে পড়ে। আগেই `if u == v: return u` দিন।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["LCA", "Binary Lifting", "Trees"],
    tests: [
      { input: "4 3\n1 2\n1 3\n2 4\n4 3\n4 2\n3 1\n", expectedOutput: "1\n2\n1\n", isSample: true },
      { input: "1 2\n1 1\n1 1\n", expectedOutput: "1\n1\n", isSample: true },
      { input: "5 2\n1 2\n2 3\n3 4\n4 5\n5 1\n3 5\n", expectedOutput: "1\n3\n", isSample: false },
      { input: "4 2\n1 2\n1 3\n1 4\n2 3\n4 3\n", expectedOutput: "1\n1\n", isSample: false },
      { ...treeLarge("binary", 100000, 5000, "lca"), isSample: false },
      { ...treeLarge("chain", 100000, 200, "lca"), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nadj = [[] for _ in range(n + 1)]\nfor _ in range(n - 1):\n    u = int(next(it)); v = int(next(it))\n    adj[u].append(v); adj[v].append(u)\nparent = [0] * (n + 1)\ndepth = [0] * (n + 1)\nparent[1] = 1\norder = [1]\nfor u in order:\n    for v in adj[u]:\n        if v != parent[u]:\n            parent[v] = u\n            depth[v] = depth[u] + 1\n            order.append(v)\nLOG = (n).bit_length()\nup = [parent[:]]\nfor k in range(1, LOG):\n    prev = up[-1]\n    up.append([prev[prev[v]] for v in range(n + 1)])\n\ndef lca(u, v):\n    if depth[u] < depth[v]:\n        u, v = v, u\n    diff = depth[u] - depth[v]\n    bit = 0\n    while diff:\n        if diff & 1:\n            u = up[bit][u]\n        diff >>= 1\n        bit += 1\n    if u == v:\n        return u\n    for k in range(LOG - 1, -1, -1):\n        if up[k][u] != up[k][v]:\n            u = up[k][u]\n            v = up[k][v]\n    return parent[u]\n\nout = []\nfor _ in range(q):\n    u = int(next(it)); v = int(next(it))\n    out.append(str(lca(u, v)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-sparse-table-lca-e1",
    title: "Distance Between Nodes",
    statement:
      "ক্যাম্পাসের রাস্তার গাছে দুইটা ল্যাবের মধ্যে কয়েকটা পথ (edge) পড়ে — সেটাই হলো তাদের দূরত্ব। `n - 1`টি পথ দেওয়া থাকবে (প্রতিটির দৈর্ঘ্য ১), রুট ১ নম্বর।\n\n`q`টি প্রশ্নে `u v` দেওয়া থাকে; `u` থেকে `v` যেতে কয়েকটা পথ লাগে প্রিন্ট করুন। একই নোড হলে উত্তর `0`।\n\nউদাহরণ: গাছ `1-2, 1-3, 2-4` — ৪ থেকে ৩: `4 → 2 → 1 → 3`, উত্তর `3`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। পরের `n - 1` লাইনে এক একটি পথ `u v`। তারপর `q` লাইনে প্রশ্ন `u v`।",
    outputFormat: "`q` লাইনে উত্তর — প্রতিটি প্রশ্নে পথের ধাপ সংখ্যা।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 100000`\n`1 <= u, v <= n`\nরুট ১ নম্বর, গাছে কোনো চক্র নেই",
    editorial:
      "### ধারণা\n\nগাছে দুই নোডের দূরত্ব বের করার সুন্দর সূত্র: `dist(u, v) = depth[u] + depth[v] - 2 * depth[LCA(u, v)]`। কারণ `u` থেকে LCA পর্যন্ত উঠতে `depth[u] - depth[lca]` ধাপ, আর `v` থেকেও একইভাবে — দুই অংশ যোগ হলেই পুরো পথ। তাই একবার LCA বের করলেই দূরত্ব `O(1)`-এ আসে; গাছ ভিত্তি করার কাজ `O(n log n)` একবারই হয়।\n\n### ধাপে ধাপে\n\n1. রুট ১ থেকে ঘুরে প্রতিটি নোডের `parent` ও `depth` বের করুন।\n2. `up` টেবিল বানান (`up[k][v]` = `2^k` ধাপ উপরে)।\n3. প্রতিটি প্রশ্নে `lca(u, v)` বের করুন — গভীরতা মেলানো + একসাথে উপরে ওঠা।\n4. সূত্র অনুযায়ী `depth[u] + depth[v] - 2 * depth[lca]` প্রিন্ট করুন।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nadj = [[] for _ in range(n + 1)]\nfor _ in range(n - 1):\n    u = int(next(it)); v = int(next(it))\n    adj[u].append(v); adj[v].append(u)\nparent = [0] * (n + 1)\ndepth = [0] * (n + 1)\nparent[1] = 1\norder = [1]\nfor u in order:\n    for v in adj[u]:\n        if v != parent[u]:\n            parent[v] = u\n            depth[v] = depth[u] + 1\n            order.append(v)\nLOG = (n).bit_length()\nup = [parent[:]]\nfor k in range(1, LOG):\n    prev = up[-1]\n    up.append([prev[prev[v]] for v in range(n + 1)])\n\ndef lca(u, v):\n    if depth[u] < depth[v]:\n        u, v = v, u\n    diff = depth[u] - depth[v]\n    bit = 0\n    while diff:\n        if diff & 1:\n            u = up[bit][u]\n        diff >>= 1\n        bit += 1\n    if u == v:\n        return u\n    for k in range(LOG - 1, -1, -1):\n        if up[k][u] != up[k][v]:\n            u = up[k][u]\n            v = up[k][v]\n    return parent[u]\n\nout = []\nfor _ in range(q):\n    u = int(next(it)); v = int(next(it))\n    w = lca(u, v)\n    out.append(str(depth[u] + depth[v] - 2 * depth[w]))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n### কমপ্লেক্সিটি\n\nনির্মাণ `O(n log n)`, প্রতি প্রশ্ন `O(log n)` (LCA), স্পেস `O(n log n)`। BFS দিয়ে প্রতিটি প্রশ্নে ঘুরে গেলে `O(n)` — বড় গাছে ধীর পড়বে।\n\n### সাধারণ ভুল\n\n- সূত্রে `2 * depth[lca]` বাদ পড়ে গেলে দূরত্ব দ্বিগুণ বা ভুল আসে।\n- `u == v`-এ ভিন্ন কিছু করা — সূত্র নিজে থেকে `0` দেয়, আলাদা শর্ত লাগে না।\n- গভীরতা BFS-এ না বের করে DFS-এ ভুল করে দিলে (`depth` ঠিক না থাকলে) পুরো সূত্র ভেঙে যায়।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["LCA", "Trees", "Distance"],
    tests: [
      { input: "4 3\n1 2\n1 3\n2 4\n4 3\n4 2\n3 3\n", expectedOutput: "3\n1\n0\n", isSample: true },
      { input: "1 1\n1 1\n", expectedOutput: "0\n", isSample: true },
      { input: "5 2\n1 2\n2 3\n3 4\n4 5\n1 5\n2 4\n", expectedOutput: "4\n2\n", isSample: false },
      { input: "3 2\n1 2\n2 3\n1 3\n2 1\n", expectedOutput: "2\n1\n", isSample: false },
      { ...treeLarge("binary", 100000, 5000, "dist"), isSample: false },
      { ...treeLarge("chain", 100000, 200, "dist"), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nadj = [[] for _ in range(n + 1)]\nfor _ in range(n - 1):\n    u = int(next(it)); v = int(next(it))\n    adj[u].append(v); adj[v].append(u)\nparent = [0] * (n + 1)\ndepth = [0] * (n + 1)\nparent[1] = 1\norder = [1]\nfor u in order:\n    for v in adj[u]:\n        if v != parent[u]:\n            parent[v] = u\n            depth[v] = depth[u] + 1\n            order.append(v)\nLOG = (n).bit_length()\nup = [parent[:]]\nfor k in range(1, LOG):\n    prev = up[-1]\n    up.append([prev[prev[v]] for v in range(n + 1)])\n\ndef lca(u, v):\n    if depth[u] < depth[v]:\n        u, v = v, u\n    diff = depth[u] - depth[v]\n    bit = 0\n    while diff:\n        if diff & 1:\n            u = up[bit][u]\n        diff >>= 1\n        bit += 1\n    if u == v:\n        return u\n    for k in range(LOG - 1, -1, -1):\n        if up[k][u] != up[k][v]:\n            u = up[k][u]\n            v = up[k][v]\n    return parent[u]\n\nout = []\nfor _ in range(q):\n    u = int(next(it)); v = int(next(it))\n    w = lca(u, v)\n    out.append(str(depth[u] + depth[v] - 2 * depth[w]))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-sparse-table-lca-m1",
    title: "Kth Ancestor",
    statement:
      "প্রাইমএশিয়ার প্রশাসনিক গাছে প্রতিটি কর্মীর একজন করে উপরের কর্তৃপক্ষ আছে (রুট হলো ১ নম্বর উপ-কুলপতি)। প্রতিটি প্রশ্নে `u k` দেওয়া থাকে — `u` নোড থেকে শুরু করে `k` ধাপ উপরে গেলে কে পাওয়া যাবে? এতে কেউ না থাকলে (রুটের আরও উপরে গেলে) `-1` প্রিন্ট করুন।\n\n`k = 1` মানে সরাসরি উপরের কর্তৃপক্ষ।\n\nউদাহরণ: শিকাল `1-2-3-4` (৪ সবচেয়ে নিচে) — `4 2` হলে উত্তর `2`; `4 4` হলে `-1`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। পরের `n - 1` লাইনে এক একটি পথ `u v`। তারপর `q` লাইনে প্রশ্ন `u k`।",
    outputFormat: "`q` লাইনে উত্তর — কর্তৃপক্ষের নোড নম্বর অথবা `-1`।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 100000`\n`1 <= u <= n`\n`1 <= k <= 10^9`\nরুট ১ নম্বর",
    editorial:
      "### ধারণা\n\n`k` যত বড় হোক, `k` বাইনারিতে লেখা যায় — অর্থাৎ `k` কয়েকটা জোড়ার পাওয়ায় ভাঙে। `up[0][v]` = এক ধাপ উপরে, `up[1][v]` = দুই ধাপ, `up[2][v]` = চার ধাপ... তাই `k`-এর যেসব বিট ১, সেই সব স্তর ধরে উপরে উঠলেই `k` ধাপ হয়ে যায় — মাত্র `log k` ধাপে। আগে যাচাই করতে হবে `k <= depth[u]` কিনা; নাহলে উত্তর `-1`। `k` `10^9` পর্যন্ত বড় হতে পারে বলে আগের মতো লুপ চালিয়ে গেলে অসম্ভব — লিফটিংই এখানে মূল কথা।\n\n### ধাপে ধাপে\n\n1. রুট ১ থেকে `parent` ও `depth` বের করুন, রুটের বাবা নিজেকে ধরুন।\n2. `up[k][v]` টেবিল বানান — `up[k][v] = up[k-1][up[k-1][v]]`।\n3. প্রতিটি প্রশ্নে `k > depth[u]` হলে সঙ্গে সঙ্গে `-1` দিন।\n4. `k`-এর বিট কম থেকে বড় ধরে: বিট সেট থাকলে `u = up[bit][u]`।\n5. শেষে `u` প্রিন্ট করুন।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nadj = [[] for _ in range(n + 1)]\nfor _ in range(n - 1):\n    u = int(next(it)); v = int(next(it))\n    adj[u].append(v); adj[v].append(u)\nparent = [0] * (n + 1)\ndepth = [0] * (n + 1)\nparent[1] = 1\norder = [1]\nfor u in order:\n    for v in adj[u]:\n        if v != parent[u]:\n            parent[v] = u\n            depth[v] = depth[u] + 1\n            order.append(v)\nLOG = (n).bit_length()\nup = [parent[:]]\nfor k in range(1, LOG):\n    prev = up[-1]\n    up.append([prev[prev[v]] for v in range(n + 1)])\n\nout = []\nfor _ in range(q):\n    u = int(next(it)); k = int(next(it))\n    if k > depth[u]:\n        out.append('-1')\n        continue\n    bit = 0\n    while k:\n        if k & 1:\n            u = up[bit][u]\n        k >>= 1\n        bit += 1\n    out.append(str(u))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n### কমপ্লেক্সিটি\n\nনির্মাণ `O(n log n)`, প্রতি প্রশ্ন `O(log k)` বা `O(log n)`; স্পেস `O(n log n)`। `k = 10^9` হলেও মাত্র ৩০ ধাপ।\n\n### সাধারণ ভুল\n\n- `k > depth[u]` যাচাই না করে শুরু করা — তখন রুটের উপরে উঠে `up[bit][root]` নিজেই হয়ে যায় এবং ফল ভুল হয় (সম্পূর্ণ প্রশ্নের শর্ত `-1`)।\n- বিট বড় থেকে ছোট করে উঠানো — উল্টো ক্রমে ফল বদলায় না, তবে `up` সূচক `bit` ভুল হলে crash হয়।\n- গভীরতা বা বাবা ভুল হালনাগাদ করা (BFS-এ একবার দেখা নোড আবার ঢোকানো) — গাছ হলেও উত্তর বদলে যায়।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["LCA", "Binary Lifting", "Ancestor"],
    tests: [
      { input: "4 5\n1 2\n2 3\n3 4\n4 1\n4 2\n4 3\n4 4\n1 1\n1 1\n", expectedOutput: "3\n2\n1\n-1\n-1\n", isSample: true },
      { input: "1 2\n1 1\n1 1\n", expectedOutput: "-1\n-1\n", isSample: true },
      { input: "3 3\n1 2\n2 3\n2 1\n3 1\n1 1000000000\n", expectedOutput: "1\n2\n-1\n", isSample: false },
      { input: "2 2\n1 2\n2 1\n2 2\n", expectedOutput: "1\n-1\n", isSample: false },
      { ...kthLarge("binary", 100000, 5000), isSample: false },
      { ...kthLarge("chain", 100000, 200), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nadj = [[] for _ in range(n + 1)]\nfor _ in range(n - 1):\n    u = int(next(it)); v = int(next(it))\n    adj[u].append(v); adj[v].append(u)\nparent = [0] * (n + 1)\ndepth = [0] * (n + 1)\nparent[1] = 1\norder = [1]\nfor u in order:\n    for v in adj[u]:\n        if v != parent[u]:\n            parent[v] = u\n            depth[v] = depth[u] + 1\n            order.append(v)\nLOG = (n).bit_length()\nup = [parent[:]]\nfor k in range(1, LOG):\n    prev = up[-1]\n    up.append([prev[prev[v]] for v in range(n + 1)])\n\nout = []\nfor _ in range(q):\n    u = int(next(it)); k = int(next(it))\n    if k > depth[u]:\n        out.append('-1')\n        continue\n    bit = 0\n    while k:\n        if k & 1:\n            u = up[bit][u]\n        k >>= 1\n        bit += 1\n    out.append(str(u))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-sparse-table-lca-h1",
    title: "Max Edge on Path",
    statement:
      "নুসরাত ক্যাম্পাস থেকে হোস্টেলে যাওয়ার পথে সবচেয়ে বেশি ভাড়া লাগা বাস স্টপ খুঁজছেন। গাছের প্রতিটি পথের ভাড়া (`w`) দেওয়া থাকবে; প্রতিটি প্রশ্নে `u v` — `u` থেকে `v` যাওয়ার পথে থাকা পথগুলোর সর্বাধিক ভাড়া কত প্রিন্ট করুন।\n\nপ্রশ্নে সবসময় `u != v` (দুই ভিন্ন নোড)।\n\nউদাহরণ: পথ `1-2 (5), 2-3 (2), 1-4 (7)` — `3` থেকে `4`: পথে ভাড়া `2, 5, 7`, উত্তর `7`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। পরের `n - 1` লাইনে প্রতিটিতে `u v w` — নোড `u` ও `v`-এর মধ্যে ভাড়া `w` পথ। তারপর `q` লাইনে প্রশ্ন `u v`।",
    outputFormat: "`q` লাইনে উত্তর — পথের সর্বাধিক ভাড়া।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 100000`\n`0 <= w <= 10^9`\nপ্রতিটি প্রশ্নে `u != v`",
    editorial:
      "### ধারণা\n\nLCA-এর টেবিলের সাথে আরেকটা টেবিল যোগ করলেই হয়: `mx[k][v]` = `v` থেকে `2^k` ধাপ উপরে ওঠার পথের সর্বাধিক ভাড়া। বানানোর সূত্র `mx[k][v] = max(mx[k-1][v], mx[k-1][up[k-1][v]])` — নিচের অর্ধেক আর উপরের অর্ধেকের ম্যাক্সিমাম। কোয়েরিতে আগে গভীর নোড উঁচুতে তোলার সময় যত অংশ পার করছি তার ম্যাক্সিমাম জমা রাখুন; এক গভীরতায় এলে দুটোকে একসাথে উল্টো ক্রমে তুলুন (`up[k][u] != up[k][v]` পর্যন্ত), শেষে দুই পাশের শেষ এক একটি পথের ভাড়াও মিলিয়ে নিন।\n\n### ধাপে ধাপে\n\n1. রুট ১ থেকে `parent`, `depth`, `weight` (বাবার সাথে পথের ভাড়া) বের করুন।\n2. `up` আর `mx` — দুটো টেবিলই একই সূত্রে এক এক স্তরে বানান।\n3. প্রশ্নে গভীর নোডটাকে বিট ধরে তোলুন; প্রতিটি ধাপে `mx`-এর মান `best`-এ তুলুন।\n4. এক গভীরতায় এলে `u == v` পর্যন্ত দুটোকে একসাথে তুলুন, নাহলে আরও তুলুন।\n5. লুপ শেষে `best`, `weight[u]`, `weight[v]` — তিনটার ম্যাক্সিমাম উত্তর।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nadj = [[] for _ in range(n + 1)]\nfor _ in range(n - 1):\n    u = int(next(it)); v = int(next(it)); w = int(next(it))\n    adj[u].append((v, w)); adj[v].append((u, w))\nparent = [0] * (n + 1)\ndepth = [0] * (n + 1)\nweight = [0] * (n + 1)\nparent[1] = 1\norder = [1]\nfor u in order:\n    for v, w in adj[u]:\n        if v != parent[u]:\n            parent[v] = u\n            depth[v] = depth[u] + 1\n            weight[v] = w\n            order.append(v)\nLOG = (n).bit_length()\nup = [parent[:]]\nmx = [weight[:]]\nfor k in range(1, LOG):\n    up.append([up[-1][up[-1][v]] for v in range(n + 1)])\n    mx.append([max(mx[-1][v], mx[-1][up[-2][v]]) for v in range(n + 1)])\n\ndef path_max(u, v):\n    best = -1\n    if depth[u] < depth[v]:\n        u, v = v, u\n    diff = depth[u] - depth[v]\n    bit = 0\n    while diff:\n        if diff & 1:\n            best = max(best, mx[bit][u])\n            u = up[bit][u]\n        diff >>= 1\n        bit += 1\n    if u == v:\n        return best\n    for k in range(LOG - 1, -1, -1):\n        if up[k][u] != up[k][v]:\n            best = max(best, mx[k][u], mx[k][v])\n            u = up[k][u]\n            v = up[k][v]\n    return max(best, weight[u], weight[v])\n\nout = []\nfor _ in range(q):\n    u = int(next(it)); v = int(next(it))\n    out.append(str(path_max(u, v)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n### কমপ্লেক্সিটি\n\nনির্মাণ `O(n log n)`, প্রতি প্রশ্ন `O(log n)`, স্পেস `O(n log n)` (দুই টেবিল)। পথ সরাসরি ঘুরে গেলে শিকল গাছে `O(n)` প্রতি প্রশ্নে — এখানে কয়েকশো গুণ পার্থক্য।\n\n### সাধারণ ভুল\n\n- `mx` বানানোর সময় ভুল লেয়ার ব্যবহার: `mx[k]` তৈরির সময় `up[k-1]` লাগে, `up[k]` নয় — কোডে লুপের ক্রম সাবধানে মিলিয়ে নিন।\n- লুপ শেষে শেষ পাশের দুটো পথের ভাড়া যোগ না করা — তখন সর্বনিম্ন এক ধাপ পথ বাদ পড়ে যায়।\n- `weight` ভুল করে নোডের মান মনে করা — এখানে ভাড়া পথের (edge) সম্পত্তি, নোডের নয়; শুধু ধরে নেওয়া হয়েছে নোড থেকে বাবার পথের ভাড়া।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["LCA", "Binary Lifting", "Path Query"],
    tests: [
      { input: "4 3\n1 2 5\n2 3 2\n1 4 7\n3 2\n3 4\n4 1\n", expectedOutput: "2\n7\n7\n", isSample: true },
      { input: "2 2\n1 2 9\n1 2\n2 1\n", expectedOutput: "9\n9\n", isSample: true },
      { input: "4 3\n1 2 1\n2 3 2\n3 4 3\n1 4\n4 1\n1 2\n", expectedOutput: "3\n3\n1\n", isSample: false },
      { input: "3 2\n1 2 4\n2 3 4\n1 3\n2 1\n", expectedOutput: "4\n4\n", isSample: false },
      { ...pathMaxLarge("binary", 100000, 5000), isSample: false },
      { ...pathMaxLarge("chain", 100000, 200), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nadj = [[] for _ in range(n + 1)]\nfor _ in range(n - 1):\n    u = int(next(it)); v = int(next(it)); w = int(next(it))\n    adj[u].append((v, w)); adj[v].append((u, w))\nparent = [0] * (n + 1)\ndepth = [0] * (n + 1)\nweight = [0] * (n + 1)\nparent[1] = 1\norder = [1]\nfor u in order:\n    for v, w in adj[u]:\n        if v != parent[u]:\n            parent[v] = u\n            depth[v] = depth[u] + 1\n            weight[v] = w\n            order.append(v)\nLOG = (n).bit_length()\nup = [parent[:]]\nmx = [weight[:]]\nfor k in range(1, LOG):\n    up.append([up[-1][up[-1][v]] for v in range(n + 1)])\n    mx.append([max(mx[-1][v], mx[-1][up[-2][v]]) for v in range(n + 1)])\n\ndef path_max(u, v):\n    best = -1\n    if depth[u] < depth[v]:\n        u, v = v, u\n    diff = depth[u] - depth[v]\n    bit = 0\n    while diff:\n        if diff & 1:\n            best = max(best, mx[bit][u])\n            u = up[bit][u]\n        diff >>= 1\n        bit += 1\n    if u == v:\n        return best\n    for k in range(LOG - 1, -1, -1):\n        if up[k][u] != up[k][v]:\n            best = max(best, mx[k][u], mx[k][v])\n            u = up[k][u]\n            v = up[k][v]\n    return max(best, weight[u], weight[v])\n\nout = []\nfor _ in range(q):\n    u = int(next(it)); v = int(next(it))\n    out.append(str(path_max(u, v)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-sparse-table-lca-x1",
    title: "Minimum and First Position",
    statement:
      "ক্লাসের পরীক্ষার নম্বর একটা সারিতে আছে। প্রতিটি প্রশ্নে `l r` দেওয়া থাকে — `l` থেকে `r` পর্যন্ত (দুই প্রান্তসহ) সবচেয়ে কম নম্বর কত, আর সেই নম্বরটি সবচেয়ে **আগে** কোন রোলে এসেছে, সেটুকুও প্রিন্ট করুন।\n\nসমান মান একাধিকবার থাকলে ছোট রোল-নম্বরটাই ধরতে হবে।\n\nউদাহরণ: `3 1 4 1 5`, প্রশ্ন `1 5` → সর্বনিম্ন `1`, প্রথম আবির্ভাব রোল `2` — উত্তর `1 2`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা। পরের `q` লাইনে `l r`।",
    outputFormat: "`q` লাইনে উত্তর — `মান রোল`, স্পেস দিয়ে আলাদা (রোল ১-ভিত্তিক)।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 100000`\n`1 <= l <= r <= n`\n`1 <= a_i <= 10^9`",
    editorial:
      "### ধারণা\n\nস্পার্স টেবিল দিয়ে সর্বনিম্ন মান পাওয়া `O(1)`; কিন্তু প্রথম অবস্থান খুঁজতে সেটাই যথেষ্ট নয়। কারণ টেবিলের দুই ব্লক আচ্ছাদিত — মান মিলে গেলে কোন ব্লকের সূচক ছোট সেটা বোঝা যায় না। সহজ কৌশল: মানগুলোর জন্য আলাদা তালিকা রাখুন — প্রতিটি স্ট্যান্ডআউট মানের সব অবস্থান (বাড়তিক্রমে) একটা লিস্টে। প্রশ্নে আগে `O(1)`-এ সর্বনিম্ন মান বের করুন, তারপর ওই মানের লিস্টে binary search করে প্রথম যে অবস্থান `l`-এর বা তার পরে — সেটাই উত্তর।\n\n### ধাপে ধাপে\n\n1. `positions` ম্যাপ বানান: মান → তার সব ইনডেক্সের সাজানো লিস্ট (অ্যারে ঘুরে একবারেই হয়)।\n2. সর্বনিম্ন মানের জন্য স্পার্স টেবিল (বা যেকোনো `O(1)`/`O(log n)` কাঠামো) বানান।\n3. প্রতিটি প্রশ্নে সর্বনিম্ন মান `min` বের করুন।\n4. `positions[min]` লিস্টে প্রথম যে ইনডেক্স `>= l - 1` (০-ভিত্তিক) — binary search দিয়ে খুঁজুন।\n5. `মান রোল` প্রিন্ট করুন।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) for _ in range(n)]\npositions = {}\nfor index, value in enumerate(arr):\n    positions.setdefault(value, []).append(index)\nlog = [0] * (n + 1)\nfor i in range(2, n + 1):\n    log[i] = log[i // 2] + 1\nst = [arr[:]]\nlevel = 1\nwhile (1 << level) <= n:\n    prev = st[-1]\n    step = 1 << (level - 1)\n    size = n - (1 << level) + 1\n    st.append([min(prev[i], prev[i + step]) for i in range(size)])\n    level += 1\n\ndef lower_bound(lst, target):\n    lo, hi = 0, len(lst)\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if lst[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid\n    return lo\n\nout = []\nfor _ in range(q):\n    l = int(next(it)) - 1\n    r = int(next(it))\n    length = r - l\n    k = log[length]\n    value = min(st[k][l], st[k][r - (1 << k)])\n    positions_of_value = positions[value]\n    spot = lower_bound(positions_of_value, l)\n    out.append(str(value) + ' ' + str(positions_of_value[spot] + 1))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n### কমপ্লেক্সিটি\n\nপ্রস্তুতি `O(n log n)` (টেবিল) + `O(n)` (পজিশন লিস্ট), প্রতি প্রশ্ন `O(1 + log f)` যেখানে `f` ওই মানের ঘটনাসংখ্যা। স্পেস `O(n log n)`।\n\n### সাধারণ ভুল\n\n- শুধু মান প্রিন্ট করে থেমে যাওয়া — প্রশ্ন রোল-নম্বরও চায়।\n- রোল ০-ভিত্তিক রেখে দেওয়া — শেষে `+1` লাগে।\n- `positions` লিস্ট বাড়তিক্রমে আছে ভুলে গিয়ে unsorted ধরে binary search — তখন ভুল সূচক আসতে পারে (এখানে লিস্ট বানানোর সময়ই ক্রম ঠিক থাকে)।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Sparse Table", "Range Query", "Binary Search"],
    tests: [
      { input: "5 3\n3 1 4 1 5\n1 5\n2 4\n3 5\n", expectedOutput: "1 2\n1 2\n1 4\n", isSample: true },
      { input: "1 2\n7\n1 1\n1 1\n", expectedOutput: "7 1\n7 1\n", isSample: true },
      { input: "4 2\n9 9 9 9\n1 4\n2 3\n", expectedOutput: "9 1\n9 2\n", isSample: false },
      { input: "3 2\n5 3 5\n1 3\n2 3\n", expectedOutput: "3 2\n3 2\n", isSample: false },
      { ...sparseX1Large(100000, 5000), isSample: false },
      { ...sparseX1Large(5000, 5000), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) for _ in range(n)]\npositions = {}\nfor index, value in enumerate(arr):\n    positions.setdefault(value, []).append(index)\nlog = [0] * (n + 1)\nfor i in range(2, n + 1):\n    log[i] = log[i // 2] + 1\nst = [arr[:]]\nlevel = 1\nwhile (1 << level) <= n:\n    prev = st[-1]\n    step = 1 << (level - 1)\n    size = n - (1 << level) + 1\n    st.append([min(prev[i], prev[i + step]) for i in range(size)])\n    level += 1\n\ndef lower_bound(lst, target):\n    lo, hi = 0, len(lst)\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if lst[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid\n    return lo\n\nout = []\nfor _ in range(q):\n    l = int(next(it)) - 1\n    r = int(next(it))\n    length = r - l\n    k = log[length]\n    value = min(st[k][l], st[k][r - (1 << k)])\n    positions_of_value = positions[value]\n    spot = lower_bound(positions_of_value, l)\n    out.append(str(value) + ' ' + str(positions_of_value[spot] + 1))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-sparse-table-lca-x2",
    title: "Ancestor Check",
    statement:
      "ক্যাম্পাসের প্রশাসনিক গাছে কে কার উপরে আছে তা দেখতে হবে। প্রতিটি প্রশ্নে `u v` দেওয়া থাকে — `u` কি `v`-এর **পূর্বসূরি**? অর্থাৎ `v` থেকে উপরে ওঠলে কি `u`-এর দিকে আসা যায় (নিজেকে নিজের পূর্বসূরি ধরা হয়)?\n\nহ্যাঁ হলে `YES`, না হলে `NO` প্রিন্ট করুন।\n\nউদাহরণ: গাছ `1-2, 1-3, 2-4` — `(1, 4)` → `YES`; `(4, 2)` → `NO`; `(3, 3)` → `YES`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। পরের `n - 1` লাইনে এক একটি পথ `u v`। তারপর `q` লাইনে প্রশ্ন `u v`।",
    outputFormat: "`q` লাইনে উত্তর — `YES` অথবা `NO`।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 100000`\n`1 <= u, v <= n`\nরুট ১ নম্বর",
    editorial:
      "### ধারণা\n\nগাছে DFS করার সময় প্রতিটি নোডের 'প্রবেশ সময়' (in-time) আর 'প্রস্থান সময়' (out-time) লিখে রাখা যায় — ঠিক যেন কোনো বৃক্ষের ডাল ধরে হাঁটলে সেই ডালের সব কিছু একটার পর একটার ভেতরেই পড়ে। তখন `u` যদি `v`-এর পূর্বসূরি হয়, তাহলে `in[u] <= in[v]` এবং `out[v] <= out[u]` — অর্থাৎ `v`-এর পুরো সাব-ট্রি হুবহু `u`-এর সাব-ট্রির ভেতরে আছে। এই দুটি তুলনাই `O(1)`-এ প্রশ্নের উত্তর দেয়। Binary lifting দিয়েও হয়, তবে Euler tour এক বার ঘুরেই সব সাজিয়ে ফেলে।\n\n### ধাপে ধাপে\n\n1. স্ট্যাক দিয়ে DFS চালান (রিকার্শন গভীর গাছে ভেঙে পড়ে, তাই স্ট্যাক নিরাপদ)।\n2. নোডে ঢোকার সময় `in[u]` লিখুন, সব সন্তান ঘুরে বের হওয়ার সময় `out[u]` লিখুন।\n3. প্রতিটি প্রশ্নে `in[u] <= in[v] and out[v] <= out[u]` যাচাই করুন।\n4. শর্ত মিললে `YES`, নাহলে `NO` প্রিন্ট করুন।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nadj = [[] for _ in range(n + 1)]\nfor _ in range(n - 1):\n    u = int(next(it)); v = int(next(it))\n    adj[u].append(v); adj[v].append(u)\nenter = [0] * (n + 1)\nexit_at = [0] * (n + 1)\nparent = [0] * (n + 1)\nparent[1] = 1\ntime = 0\nstack = [(1, 0)]\nwhile stack:\n    u, index = stack[-1]\n    if index == 0:\n        time += 1\n        enter[u] = time\n    if index < len(adj[u]):\n        v = adj[u][index]\n        stack[-1] = (u, index + 1)\n        if v != parent[u]:\n            parent[v] = u\n            stack.append((v, 0))\n    else:\n        time += 1\n        exit_at[u] = time\n        stack.pop()\nout = []\nfor _ in range(q):\n    u = int(next(it)); v = int(next(it))\n    ok = enter[u] <= enter[v] and exit_at[v] <= exit_at[u]\n    out.append('YES' if ok else 'NO')\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n### কমপ্লেক্সিটি\n\nপ্রস্তুতি `O(n)` (একটাই DFS), প্রতি প্রশ্ন `O(1)`, স্পেস `O(n)`। Binary lifting বানানো যেত `O(n log n)` স্পেস — এই প্রশ্নে তার দরকার নেই।\n\n### সাধারণ ভুল\n\n- শুধু `in[u] <= in[v]` দেখে বলে দেওয়া — এটা যথেষ্ট নয়; উদাহরণে `(1, 3)`-এ `1` পূর্বসূরি, কিন্তু `(4, 1)`-এ `in[4] > in[1]` হলেও সরলরেখায় ভাবলে ভুল ধারণা হতে পারে — দুটি শর্ত একসাথে লাগে।\n- রিকার্সিভ DFS-এ `sys.setrecursionlimit` না দিলে `n = 100000`-এ শিকল গাছে RecursionError।\n- ভিজিটেড অ্যারে ভুলে যাওয়া — গাছে প্যারেন্ট চেক না করলে ফিরে যাওয়ার সময় সময় দ্বিগুণ হয়ে যায়।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Trees", "Euler Tour", "Ancestor"],
    tests: [
      { input: "4 4\n1 2\n1 3\n2 4\n1 4\n4 2\n2 4\n3 3\n", expectedOutput: "YES\nNO\nYES\nYES\n", isSample: true },
      { input: "1 1\n1 1\n", expectedOutput: "YES\n", isSample: true },
      { input: "5 2\n1 2\n2 3\n3 4\n4 5\n4 1\n1 5\n", expectedOutput: "NO\nYES\n", isSample: false },
      { input: "3 2\n1 2\n1 3\n2 3\n3 2\n", expectedOutput: "NO\nNO\n", isSample: false },
      { ...treeLarge("binary", 100000, 5000, "anc"), isSample: false },
      { ...treeLarge("chain", 100000, 200, "anc"), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nadj = [[] for _ in range(n + 1)]\nfor _ in range(n - 1):\n    u = int(next(it)); v = int(next(it))\n    adj[u].append(v); adj[v].append(u)\nenter = [0] * (n + 1)\nexit_at = [0] * (n + 1)\nparent = [0] * (n + 1)\nparent[1] = 1\ntime = 0\nstack = [(1, 0)]\nwhile stack:\n    u, index = stack[-1]\n    if index == 0:\n        time += 1\n        enter[u] = time\n    if index < len(adj[u]):\n        v = adj[u][index]\n        stack[-1] = (u, index + 1)\n        if v != parent[u]:\n            parent[v] = u\n            stack.append((v, 0))\n    else:\n        time += 1\n        exit_at[u] = time\n        stack.pop()\nout = []\nfor _ in range(q):\n    u = int(next(it)); v = int(next(it))\n    ok = enter[u] <= enter[v] and exit_at[v] <= exit_at[u]\n    out.append('YES' if ok else 'NO')\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
];
