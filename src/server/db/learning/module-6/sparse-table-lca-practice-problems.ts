import type { SeedProblem } from "../../seed-problems";
import { newlineOutput } from "../generated-tests";
import { makeSeg } from "./segment-tree-problems";
import { buildTree, lcaNaive } from "./sparse-table-lca-problems";

function treeText(n: number, q: number, edges: number[][], queries: number[][]): string {
  const edgeLines = edges.map((edge) => edge.join(" ")).join("\n");
  const queryLines = queries.map((query) => query.join(" ")).join("\n");
  const edgeBlock = edgeLines.length > 0 ? `${edgeLines}\n` : "";
  return `${n} ${q}\n${edgeBlock}${queryLines}\n`;
}

function sparseE2Large(): { input: string; expectedOutput: string } {
  const n = 100000, q = 5000;
  const values: number[] = [];
  for (let i = 0; i < n; i += 1) values.push((i * 7919) % 1073741824);
  const seg = makeSeg(values, -1, (a, b) => a & b);
  const queries: number[][] = [];
  const answers: number[] = [];
  for (let k = 0; k < q; k += 1) {
    const a = ((k * 7919) % n) + 1;
    const b = Math.min(n, a + ((k * 13) % 5000));
    queries.push([a, b]);
    answers.push(seg.range(a, b));
  }
  const tail = `${queries.map(([l, r]) => `${l} ${r}`).join("\n")}\n`;
  const input = `${n} ${q}\n${values.join(" ")}\n${tail}`;
  return { input, expectedOutput: newlineOutput(answers) };
}

function tripleLarge(kind: "chain" | "binary", n: number, q: number): {
  input: string;
  expectedOutput: string;
} {
  const { edges, oracle } = buildTree(n, kind);
  const queries: number[][] = [];
  const answers: string[] = [];
  for (let k = 0; k < q; k += 1) {
    const a = ((k * 7919) % n) + 1;
    const b = ((k * 104729) % n) + 1;
    const c = ((k * 48271) % n) + 1;
    queries.push([a, b, c]);
    const x = lcaNaive(oracle, a, b);
    const y = lcaNaive(oracle, b, c);
    const z = lcaNaive(oracle, c, a);
    const upper = (p: number, other: number): number =>
      oracle.depth[p] <= oracle.depth[other] ? p : other;
    const distAB = oracle.depth[a] + oracle.depth[b] - 2 * oracle.depth[x];
    const distBC = oracle.depth[b] + oracle.depth[c] - 2 * oracle.depth[y];
    const distCA = oracle.depth[c] + oracle.depth[a] - 2 * oracle.depth[z];
    const totalX = distAB + oracle.depth[c] + oracle.depth[x] - 2 * oracle.depth[upper(z, y)];
    const totalY = distBC + oracle.depth[a] + oracle.depth[y] - 2 * oracle.depth[upper(x, z)];
    const totalZ = distCA + oracle.depth[b] + oracle.depth[z] - 2 * oracle.depth[upper(x, y)];
    let best = x, bestTotal = totalX;
    if (totalY < bestTotal) {
      best = y;
      bestTotal = totalY;
    }
    if (totalZ < bestTotal) {
      best = z;
      bestTotal = totalZ;
    }
    answers.push(String(best));
  }
  return { input: treeText(n, queries.length, edges, queries), expectedOutput: newlineOutput(answers) };
}

function weightedDistLarge(kind: "chain" | "binary", n: number, q: number): {
  input: string;
  expectedOutput: string;
} {
  const { edges, oracle } = buildTree(n, kind);
  const weighted = edges.map(([p, c]) => [p, c, oracle.weight[c]] as number[]);
  const queries: number[][] = [];
  const answers: string[] = [];
  for (let k = 0; k < q; k += 1) {
    const u = ((k * 7919) % n) + 1;
    const v = ((k * 104729) % n) + 1;
    queries.push([u, v]);
    const w = lcaNaive(oracle, u, v);
    let total = 0;
    for (let a = u; a !== w; a = oracle.parent[a]) total += oracle.weight[a];
    for (let b = v; b !== w; b = oracle.parent[b]) total += oracle.weight[b];
    answers.push(String(total));
  }
  const edgeLines = weighted.map((edge) => edge.join(" ")).join("\n");
  const queryLines = queries.map((query) => query.join(" ")).join("\n");
  const input = `${n} ${q}\n${edgeLines}\n${queryLines}\n`;
  return { input, expectedOutput: newlineOutput(answers) };
}

function kthNodeLarge(kind: "chain" | "binary", n: number, q: number): {
  input: string;
  expectedOutput: string;
} {
  const { edges, oracle } = buildTree(n, kind);
  const queries: number[][] = [];
  const answers: string[] = [];
  for (let k = 0; k < q; k += 1) {
    const u = ((k * 7919) % n) + 1;
    const v = ((k * 104729) % n) + 1;
    const w = lcaNaive(oracle, u, v);
    const firstPart: number[] = [];
    for (let a = u; a !== w; a = oracle.parent[a]) firstPart.push(a);
    firstPart.push(w);
    const secondPart: number[] = [];
    for (let b = v; b !== w; b = oracle.parent[b]) secondPart.push(b);
    secondPart.reverse();
    const total = firstPart.length + secondPart.length;
    const steps = ((k * 37) % (total + 1)) + 1;
    queries.push([u, v, steps]);
    const path = firstPart.concat(secondPart);
    answers.push(steps <= total ? String(path[steps - 1]) : "-1");
  }
  return { input: treeText(n, queries.length, edges, queries), expectedOutput: newlineOutput(answers) };
}

function eulerLcaLarge(kind: "chain" | "binary", n: number, q: number): {
  input: string;
  expectedOutput: string;
} {
  const { edges, oracle } = buildTree(n, kind);
  const queries: number[][] = [];
  const answers: string[] = [];
  for (let k = 0; k < q; k += 1) {
    const u = ((k * 7919) % n) + 1;
    const v = ((k * 104729) % n) + 1;
    queries.push([u, v]);
    answers.push(String(lcaNaive(oracle, u, v)));
  }
  return { input: treeText(n, queries.length, edges, queries), expectedOutput: newlineOutput(answers) };
}

export const SPARSE_TABLE_LCA_PRACTICE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m6-sparse-table-lca-e2",
    title: "Range AND Query",
    statement:
      "সার্ভার ফার্মে প্রতিটি মেশিনে অনুমতির (permission) একটা বিট-মাস্ক বসানো থাকে — কোন কাজগুলো সে করতে পারে। নিরাপত্তা টিম জানতে চায় `l` থেকে `r` নম্বর মেশিনগুলো **সবাই** কী কী অনুমতি পায় — অর্থাৎ যে বিটগুলো রেঞ্জের প্রতিটি মাস্কেই চালু।\n\n`n`টি মেশিনের মাস্ক দেওয়া থাকবে, তারপর `q`টি প্রশ্ন `l r` — রেঞ্জের (দুই প্রান্তসহ) সব মাস্কের bitwise AND প্রিন্ট করো।\n\nউদাহরণ: মাস্ক `12, 10, 14` — এদের AND `8`, কারণ শুধু `8`-এর বিটটা তিনটাতেই চালু।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা। পরের `q` লাইনে প্রশ্ন `l r`।",
    outputFormat: "`q` লাইনে উত্তর — প্রতিটি রেঞ্জের AND।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 100000`\n`1 <= l <= r <= n`\n`0 <= a_i < 2^30`",
    editorial:
      "## ধারণা\n\nAND idempotent — `x AND x = x` — তাই স্পার্স টেবিলের ওভারল্যাপিং দুই-ব্লক কৌশল এখানেও নিরাপদ। টেবিলের প্রতিটি ঘরে জমা থাকে দৈর্ঘ্য জোড়ার পাওয়া রেঞ্জের AND; প্রশ্নে `k = floor(log2(len))` নিয়ে দুটো ব্লক মিলিয়েই উত্তর। যোগফলের মতো invertible অপারেশন নয়, তাই প্রিফিক্স ট্রিক চলবে না — কিন্তু স্পার্স টেবিল ব্লক-ভিত্তিক, প্রিফিক্সের দরকারই পড়ে না।\n\n## ধাপে ধাপে\n\n1. `log` অ্যারে বসাও: `log[i] = log[i // 2] + 1`।\n2. `st[0]` = মূল অ্যারে; প্রতি স্তরে `st[k][i] = st[k-1][i] & st[k-1][i + 2^(k-1)]`।\n3. প্রতিটি প্রশ্নে `l` ০-ভিত্তিক করে `len = r - l`, `k = log[len]` নাও।\n4. উত্তর `st[k][l] & st[k][r - 2^k]` — দুই ব্লক আচ্ছাদিত হলেও AND-এ ক্ষতি নেই।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) for _ in range(n)]\nlog = [0] * (n + 1)\nfor i in range(2, n + 1):\n    log[i] = log[i // 2] + 1\nst = [arr[:]]\nlevel = 1\nwhile (1 << level) <= n:\n    prev = st[-1]\n    step = 1 << (level - 1)\n    size = n - (1 << level) + 1\n    st.append([prev[i] & prev[i + step] for i in range(size)])\n    level += 1\nout = []\nfor _ in range(q):\n    l = int(next(it)) - 1\n    r = int(next(it))\n    length = r - l\n    k = log[length]\n    out.append(str(st[k][l] & st[k][r - (1 << k)]))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n## কমপ্লেক্সিটি\n\nনির্মাণ `O(n log n)` সময় ও স্পেস, প্রতি প্রশ্ন `O(1)` — স্পার্স টেবিলের চিরকাঠামোই।\n\n## সাধারণ ভুল\n\n- XOR বা যোগফলের জন্য এই দুই-ব্লক কৌশল ব্যবহার করা — সেগুলো idempotent নয়, আচ্ছাদিত অংশ দুইবার গোনা হবে; AND/min/max/gcd নিরাপদ।\n- `len` হিসাবে `r - l + 1` লেখা অথচ `l` ০-ভিত্তিক করে নেওয়া — এক অফ-বাই-ওয়ানে টেবিলের বাইরের ইনডেক্স পড়ে ফেলবে; এই কোডে `l` ০-ভিত্তিক, `r` অর্ধেক-খোলা।\n- `2^k` দ্বিতীয় ব্লকের শুরু `r - 2^k` না ধরে `r - 2^k + 1` লেখা — শেষ ঘর বাদ পড়ে যায়।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Sparse Table", "Bit Manipulation", "Range Query"],
    tests: [
      { input: "4 3\n12 10 14 6\n1 4\n1 3\n2 4\n", expectedOutput: "0\n8\n2\n", isSample: true },
      { input: "1 2\n7\n1 1\n1 1\n", expectedOutput: "7\n7\n", isSample: true },
      { input: "3 2\n5 5 5\n1 3\n2 3\n", expectedOutput: "5\n5\n", isSample: false },
      { input: "2 2\n0 1023\n1 2\n1 1\n", expectedOutput: "0\n0\n", isSample: false },
      { input: "5 2\n1023 1023 512 1023 1023\n1 5\n3 5\n", expectedOutput: "512\n512\n", isSample: false },
      { ...sparseE2Large(), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) for _ in range(n)]\nlog = [0] * (n + 1)\nfor i in range(2, n + 1):\n    log[i] = log[i // 2] + 1\nst = [arr[:]]\nlevel = 1\nwhile (1 << level) <= n:\n    prev = st[-1]\n    step = 1 << (level - 1)\n    size = n - (1 << level) + 1\n    st.append([prev[i] & prev[i + step] for i in range(size)])\n    level += 1\nout = []\nfor _ in range(q):\n    l = int(next(it)) - 1\n    r = int(next(it))\n    length = r - l\n    k = log[length]\n    out.append(str(st[k][l] & st[k][r - (1 << k)]))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-sparse-table-lca-e3",
    title: "Meeting Point of Three",
    statement:
      "ক্যাম্পাসের রাস্তার গাছে তিন বন্ধু `a`, `b`, `c` একটা জংশনে মিলতে চায় — এমন একটা নোড যেখানে গেলে তিনজনের মোট হাঁটার ধাপ সবচেয়ে কম হয়। গাছে সেই নোড একটাই: তিনজনের পথ যেখানে মিলে যায়।\n\n`q`টি প্রশ্নে `a b c` দেওয়া থাকবে; মিলনের নোড নম্বর প্রিন্ট করো।\n\nউদাহরণ: গাছ `1-2, 1-3` — প্রশ্ন `2 3 1` → নোড `1`, কারণ তিনজনের পথই ১ নম্বর ভবনে মিলে।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। পরের `n - 1` লাইনে এক একটি পথ `u v`। তারপর `q` লাইনে প্রশ্ন `a b c`।",
    outputFormat: "`q` লাইনে উত্তর — প্রতিটি প্রশ্নের মিলন-নোড।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 100000`\n`1 <= a, b, c <= n`\nরুট ১ নম্বর, গাছে কোনো চক্র নেই",
    editorial:
      "## ধারণা\n\nদুইজনের মিলনবিন্দু LCA — তিনজনের জন্য এক ধাপ বাড়াও। তিন জোড়ার LCA বের করো: `x = lca(a, b)`, `y = lca(b, c)`, `z = lca(c, a)`। এদের মধ্যে **সবচেয়ে গভীরটাই** তিন বন্ধুর মিলন-নোড। কারণটা ভাবো: মিলন-নোড থেকে তিন বন্ধু তিন দিকে (বা কেউ নিজেই ওখানে) নেমে থাকে; যে জোড়া দুই পৃথক দিকে, তাদের পথ ঠিক মিলন-নোডেই মিলবে — মানে ওই জোড়ার LCA হলো মিলন-নোড নিজে। বাকি জোড়াগুলোর LCA মিলন-নোড থেকে উপরের কোনো পূর্বসূরি — তাই গভীর থেকে গভীরতমটা বেছে নিলেই উত্তর পাওয়া যায়।\n\n## ধাপে ধাপে\n\n1. রুট ১ থেকে `parent`, `depth` আর `up` টেবিল বানাও (আগের LCA সমস্যার মতোই)।\n2. প্রতিটি প্রশ্নে তিনটা LCA বের করো — `lca(a,b)`, `lca(b,c)`, `lca(c,a)`।\n3. তিনটার মধ্যে `depth` সবচেয়ে বড়টা বেছে নাও।\n4. সেটাই মিলন-নোড — প্রিন্ট করো।\n\n```python\nimport sys\n\ndef main():\n    data = sys.stdin.buffer.read().split()\n    it = iter(data)\n    n = int(next(it)); q = int(next(it))\n    adj = [[] for _ in range(n + 1)]\n    for _ in range(n - 1):\n        u = int(next(it)); v = int(next(it))\n        adj[u].append(v); adj[v].append(u)\n    parent = [0] * (n + 1)\n    depth = [0] * (n + 1)\n    parent[1] = 1\n    order = [1]\n    for u in order:\n        for v in adj[u]:\n            if v != parent[u]:\n                parent[v] = u\n                depth[v] = depth[u] + 1\n                order.append(v)\n    LOG = (n).bit_length()\n    up = [parent[:]]\n    for k in range(1, LOG):\n        prev = up[-1]\n        up.append([prev[prev[v]] for v in range(n + 1)])\n\n    def lca(u, v):\n        if depth[u] < depth[v]:\n            u, v = v, u\n        diff = depth[u] - depth[v]\n        bit = 0\n        while diff:\n            if diff & 1:\n                u = up[bit][u]\n            diff >>= 1\n            bit += 1\n        if u == v:\n            return u\n        for k in range(LOG - 1, -1, -1):\n            if up[k][u] != up[k][v]:\n                u = up[k][u]\n                v = up[k][v]\n        return parent[u]\n\n    out = []\n    for _ in range(q):\n        a = int(next(it)); b = int(next(it)); c = int(next(it))\n        x = lca(a, b)\n        y = lca(b, c)\n        z = lca(c, a)\n        best = x\n        if depth[y] > depth[best]:\n            best = y\n        if depth[z] > depth[best]:\n            best = z\n        out.append(str(best))\n    sys.stdout.write('\\n'.join(out) + '\\n')\n\nmain()\n```\n\n## কমপ্লেক্সিটি\n\nনির্মাণ `O(n log n)`; প্রতিটি প্রশ্নে তিনটা LCA, প্রতিটি `O(log n)` — মোট `O(log n)`। সরাসরি তিনের সব জোড়া-পথ ঘুরে মিলন-নোড খুঁজলে প্রতি প্রশ্নে `O(n)`।\n\n## সাধারণ ভুল\n\n- তিন LCA-র মধ্যে `lca(a, b)`-কেই ধরে নেওয়া — শিকল গাছে `1 2 3` প্রশ্নে `lca(1,2)` মিলন-নোড নয়, উত্তর `2`।\n- ছোট `depth`-এরটা বেছে নেওয়া — ঊর্ধ্বমুখী নিয়মে উত্তর রুটের দিকে সরে যায়, হাঁটা বেড়ে যায়।\n- দুই বন্ধু একই নোডে থাকলে আলাদা কেস ভাবা — LCA নিজেই সব সামলায়, যেমন `4 4 2` প্রশ্নে উত্তর `4`।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["LCA", "Binary Lifting", "Trees"],
    tests: [
      { input: "3 3\n1 2\n1 3\n2 3 1\n3 2 1\n1 2 3\n", expectedOutput: "1\n1\n1\n", isSample: true },
      { input: "4 4\n1 2\n2 3\n3 4\n1 2 3\n2 3 4\n4 4 2\n2 2 2\n", expectedOutput: "2\n3\n4\n2\n", isSample: true },
      { input: "5 2\n1 2\n1 3\n1 4\n1 5\n2 3 4\n5 1 3\n", expectedOutput: "1\n1\n", isSample: false },
      { input: "5 2\n1 2\n2 3\n3 4\n4 5\n1 5 3\n2 4 5\n", expectedOutput: "3\n4\n", isSample: false },
      { input: "1 2\n1 1 1\n1 1 1\n", expectedOutput: "1\n1\n", isSample: false },
      { ...tripleLarge("binary", 100000, 5000), isSample: false },
      { ...tripleLarge("chain", 100000, 200), isSample: false },
    ],
    referencePython:
      "import sys\n\ndef main():\n    data = sys.stdin.buffer.read().split()\n    it = iter(data)\n    n = int(next(it)); q = int(next(it))\n    adj = [[] for _ in range(n + 1)]\n    for _ in range(n - 1):\n        u = int(next(it)); v = int(next(it))\n        adj[u].append(v); adj[v].append(u)\n    parent = [0] * (n + 1)\n    depth = [0] * (n + 1)\n    parent[1] = 1\n    order = [1]\n    for u in order:\n        for v in adj[u]:\n            if v != parent[u]:\n                parent[v] = u\n                depth[v] = depth[u] + 1\n                order.append(v)\n    LOG = (n).bit_length()\n    up = [parent[:]]\n    for k in range(1, LOG):\n        prev = up[-1]\n        up.append([prev[prev[v]] for v in range(n + 1)])\n\n    def lca(u, v):\n        if depth[u] < depth[v]:\n            u, v = v, u\n        diff = depth[u] - depth[v]\n        bit = 0\n        while diff:\n            if diff & 1:\n                u = up[bit][u]\n            diff >>= 1\n            bit += 1\n        if u == v:\n            return u\n        for k in range(LOG - 1, -1, -1):\n            if up[k][u] != up[k][v]:\n                u = up[k][u]\n                v = up[k][v]\n        return parent[u]\n\n    out = []\n    for _ in range(q):\n        a = int(next(it)); b = int(next(it)); c = int(next(it))\n        x = lca(a, b)\n        y = lca(b, c)\n        z = lca(c, a)\n        best = x\n        if depth[y] > depth[best]:\n            best = y\n        if depth[z] > depth[best]:\n            best = z\n        out.append(str(best))\n    sys.stdout.write('\\n'.join(out) + '\\n')\n\nmain()\n",
  },
  {
    slug: "learn-m6-sparse-table-lca-m2",
    title: "Cable Length Between Labs",
    statement:
      "ক্যাম্পাসের ফাইবার নেটওয়ার্ক একটা গাছের মতো — প্রতিটি ক্যাবলের নিজস্ব দৈর্ঘ্য (মিটার) আছে। রক্ষণাবেক্ষণ টিম বারবার জানতে চায় দুই ভবনের মধ্যে তারের মোট দৈর্ঘ্য কত।\n\n`n - 1`টি পথ `u v w` দেওয়া থাকবে (`u` আর `v`-এর মধ্যে দৈর্ঘ্য `w`); তারপর `q`টি প্রশ্ন `u v` — `u` থেকে `v` পথের (দুই প্রান্তসহ) মোট দৈর্ঘ্য প্রিন্ট করো।\n\nউদাহরণ: পথ `1-2 (5)`, `2-3 (2)` — `1` থেকে `3`: `5 + 2 = 7`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। পরের `n - 1` লাইনে প্রতিটিতে `u v w`। তারপর `q` লাইনে প্রশ্ন `u v`।",
    outputFormat: "`q` লাইনে উত্তর — প্রতিটি পথের মোট দৈর্ঘ্য।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 100000`\n`1 <= u, v <= n`, `0 <= w <= 10^9`\nউত্তর ৬৪-বিট সাইনড সংখ্যার মধ্যে",
    editorial:
      "## ধারণা\n\nধাপ গোনার সূত্রটা মনে আছে — `dist(u, v) = depth[u] + depth[v] - 2 * depth[lca]`। ওজনের সংস্করণ হুবহু একই, শুধু `depth`-এর জায়গায় `wdist` — রুট থেকে ওই নোড পর্যন্ত পথের ওজনের যোগফল। একবার গাছ ভিত্তি করে প্রতিটি নোডের `wdist` বের করে রাখলে প্রতিটি প্রশ্নে শুধু LCA বের করে সূত্রে বসিয়ে দিতে হয় — পথে ঘরে ঘরে ওজন যোগ করার দরকার নেই।\n\n## ধাপে ধাপে\n\n1. রুট ১ থেকে BFS-ক্রমে `parent`, `depth` আর `wdist` বের করো — সন্তানের `wdist = বাবার wdist + পথের w`।\n2. `up` টেবিল বানিয়ে LCA প্রস্তুত করো।\n3. প্রতিটি প্রশ্নে `w = lca(u, v)` নাও।\n4. উত্তর `wdist[u] + wdist[v] - 2 * wdist[w]` প্রিন্ট করো।\n\n```python\nimport sys\n\ndef main():\n    data = sys.stdin.buffer.read().split()\n    it = iter(data)\n    n = int(next(it)); q = int(next(it))\n    adj = [[] for _ in range(n + 1)]\n    for _ in range(n - 1):\n        u = int(next(it)); v = int(next(it)); w = int(next(it))\n        adj[u].append((v, w)); adj[v].append((u, w))\n    parent = [0] * (n + 1)\n    depth = [0] * (n + 1)\n    wdist = [0] * (n + 1)\n    parent[1] = 1\n    order = [1]\n    for u in order:\n        for v, w in adj[u]:\n            if v != parent[u]:\n                parent[v] = u\n                depth[v] = depth[u] + 1\n                wdist[v] = wdist[u] + w\n                order.append(v)\n    LOG = (n).bit_length()\n    up = [parent[:]]\n    for k in range(1, LOG):\n        prev = up[-1]\n        up.append([prev[prev[v]] for v in range(n + 1)])\n\n    def lca(u, v):\n        if depth[u] < depth[v]:\n            u, v = v, u\n        diff = depth[u] - depth[v]\n        bit = 0\n        while diff:\n            if diff & 1:\n                u = up[bit][u]\n            diff >>= 1\n            bit += 1\n        if u == v:\n            return u\n        for k in range(LOG - 1, -1, -1):\n            if up[k][u] != up[k][v]:\n                u = up[k][u]\n                v = up[k][v]\n        return parent[u]\n\n    out = []\n    for _ in range(q):\n        u = int(next(it)); v = int(next(it))\n        w = lca(u, v)\n        out.append(str(wdist[u] + wdist[v] - 2 * wdist[w]))\n    sys.stdout.write('\\n'.join(out) + '\\n')\n\nmain()\n```\n\n## কমপ্লেক্সিটি\n\nনির্মাণ `O(n log n)`, প্রতি প্রশ্ন `O(log n)`, স্পেস `O(n log n)`। প্রতি প্রশ্নে পথ ধরে ওজন যোগ করলে শিকল গাছে `O(n)` — হাজার প্রশ্নেই শেষ।\n\n## সাধারণ ভুল\n\n- `depth` আর `wdist` গুলিয়ে ফেলা — দূরত্বের সূত্রে `wdist` বসাতে হবে, `depth` শুধু LCA-র কাজে।\n- `wdist[lca]` **দুইবার** বিয়োগ না করা — দুই পাশের যোগফলে LCA পর্যন্ত অংশটা দুবার এসেছে।\n- পথের ওজন বাবার দিকে না সন্তানের দিকে জমিয়ে রাখা — সন্তানের `wdist` বসাও, তখনই সূত্রটা খায়।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["LCA", "Trees", "Weighted Distance"],
    tests: [
      { input: "3 3\n1 2 5\n2 3 2\n3 1\n1 3\n3 3\n", expectedOutput: "7\n7\n0\n", isSample: true },
      { input: "2 2\n1 2 9\n1 2\n2 1\n", expectedOutput: "9\n9\n", isSample: true },
      { input: "3 2\n1 2 0\n2 3 0\n1 3\n2 2\n", expectedOutput: "0\n0\n", isSample: false },
      { input: "4 2\n1 2 3\n2 3 4\n3 4 5\n1 4\n2 4\n", expectedOutput: "12\n9\n", isSample: false },
      { ...weightedDistLarge("binary", 100000, 5000), isSample: false },
      { ...weightedDistLarge("chain", 100000, 200), isSample: false },
    ],
    referencePython:
      "import sys\n\ndef main():\n    data = sys.stdin.buffer.read().split()\n    it = iter(data)\n    n = int(next(it)); q = int(next(it))\n    adj = [[] for _ in range(n + 1)]\n    for _ in range(n - 1):\n        u = int(next(it)); v = int(next(it)); w = int(next(it))\n        adj[u].append((v, w)); adj[v].append((u, w))\n    parent = [0] * (n + 1)\n    depth = [0] * (n + 1)\n    wdist = [0] * (n + 1)\n    parent[1] = 1\n    order = [1]\n    for u in order:\n        for v, w in adj[u]:\n            if v != parent[u]:\n                parent[v] = u\n                depth[v] = depth[u] + 1\n                wdist[v] = wdist[u] + w\n                order.append(v)\n    LOG = (n).bit_length()\n    up = [parent[:]]\n    for k in range(1, LOG):\n        prev = up[-1]\n        up.append([prev[prev[v]] for v in range(n + 1)])\n\n    def lca(u, v):\n        if depth[u] < depth[v]:\n            u, v = v, u\n        diff = depth[u] - depth[v]\n        bit = 0\n        while diff:\n            if diff & 1:\n                u = up[bit][u]\n            diff >>= 1\n            bit += 1\n        if u == v:\n            return u\n        for k in range(LOG - 1, -1, -1):\n            if up[k][u] != up[k][v]:\n                u = up[k][u]\n                v = up[k][v]\n        return parent[u]\n\n    out = []\n    for _ in range(q):\n        u = int(next(it)); v = int(next(it))\n        w = lca(u, v)\n        out.append(str(wdist[u] + wdist[v] - 2 * wdist[w]))\n    sys.stdout.write('\\n'.join(out) + '\\n')\n\nmain()\n",
  },
  {
    slug: "learn-m6-sparse-table-lca-m3",
    title: "Kth Node on the Path",
    statement:
      "ম্যারাথন আয়োজকরা গাছের পথ ধরে রিলে দৌড় সাজাচ্ছিলেন — স্টার্ট `u`, ফিনিশ `v`, আর পথের নির্দিষ্ট ধাপে পানির স্টল বসাতে হবে।\n\nপ্রতিটি প্রশ্নে `u v k` দেওয়া থাকবে — `u` থেকে `v` পথের (দুই প্রান্তসহ) `k`-তম নোড প্রিন্ট করো। `k` পথের নোড সংখ্যার বেশি হলে `-1`। `k = 1` মানে `u` নিজে।\n\nউদাহরণ: শিকল গাছ `1-2-3-4` — `4` থেকে `1` পথের `2`-তম নোড `3`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। পরের `n - 1` লাইনে এক একটি পথ `u v`। তারপর `q` লাইনে প্রশ্ন `u v k`।",
    outputFormat: "`q` লাইনে উত্তর — `k`-তম নোড, না থাকলে `-1`।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 100000`\n`1 <= u, v <= n`\n`1 <= k <= 200000`\nরুট ১ নম্বর",
    editorial:
      "## ধারণা\n\nপথটা দুই ভাগে ভাঙো — `u` থেকে LCA পর্যন্ত আর `v` থেকে LCA পর্যন্ত। `w = lca(u, v)` হলে `du = depth[u] - depth[w]` ধাপে `u` পাশ, `dv` ধাপে `v` পাশ, মোট নোড `du + dv + 1`। এখন `k` যদি প্রথম ভাগে পড়ে (`k <= du + 1`), উত্তর হলো `u` থেকে `k - 1` ধাপ উপরের পূর্বসূরি — m1-এর kth ancestor লিফটিং। নাহলে উত্তর `v` থেকে `total - k` ধাপ উপরে। দুই পুরোনো হাতিয়ার — LCA আর kth ancestor — জোড়া দিলেই নতুন প্রশ্নটা মেটে।\n\n## ধাপে ধাপে\n\n1. `parent`, `depth` আর `up` টেবিল বানাও।\n2. প্রতিটি প্রশ্নে `w = lca(u, v)`; `du`, `dv` আর `total = du + dv + 1` হিসাব করো।\n3. `k > total` হলে `-1`।\n4. `k <= du + 1` হলে `kth_ancestor(u, k - 1)`; নাহলে `kth_ancestor(v, total - k)`।\n\n```python\nimport sys\n\ndef main():\n    data = sys.stdin.buffer.read().split()\n    it = iter(data)\n    n = int(next(it)); q = int(next(it))\n    adj = [[] for _ in range(n + 1)]\n    for _ in range(n - 1):\n        u = int(next(it)); v = int(next(it))\n        adj[u].append(v); adj[v].append(u)\n    parent = [0] * (n + 1)\n    depth = [0] * (n + 1)\n    parent[1] = 1\n    order = [1]\n    for u in order:\n        for v in adj[u]:\n            if v != parent[u]:\n                parent[v] = u\n                depth[v] = depth[u] + 1\n                order.append(v)\n    LOG = (n).bit_length()\n    up = [parent[:]]\n    for k in range(1, LOG):\n        prev = up[-1]\n        up.append([prev[prev[v]] for v in range(n + 1)])\n\n    def kth_ancestor(u, k):\n        bit = 0\n        while k:\n            if k & 1:\n                u = up[bit][u]\n            k >>= 1\n            bit += 1\n        return u\n\n    def lca(u, v):\n        if depth[u] < depth[v]:\n            u, v = v, u\n        diff = depth[u] - depth[v]\n        bit = 0\n        while diff:\n            if diff & 1:\n                u = up[bit][u]\n            diff >>= 1\n            bit += 1\n        if u == v:\n            return u\n        for k in range(LOG - 1, -1, -1):\n            if up[k][u] != up[k][v]:\n                u = up[k][u]\n                v = up[k][v]\n        return parent[u]\n\n    out = []\n    for _ in range(q):\n        u = int(next(it)); v = int(next(it)); k = int(next(it))\n        w = lca(u, v)\n        du = depth[u] - depth[w]\n        dv = depth[v] - depth[w]\n        total = du + dv + 1\n        if k > total:\n            out.append('-1')\n        elif k <= du + 1:\n            out.append(str(kth_ancestor(u, k - 1)))\n        else:\n            out.append(str(kth_ancestor(v, total - k)))\n    sys.stdout.write('\\n'.join(out) + '\\n')\n\nmain()\n```\n\n## কমপ্লেক্সিটি\n\nনির্মাণ `O(n log n)`, প্রতি প্রশ্ন `O(log n)` — LCA একবার আর একবার লিফটিং। পথ সরাসরি ঘুরে `k`-তম নোড গুনলে শিকল গাছে প্রতি প্রশ্নে `O(n)`।\n\n## সাধারণ ভুল\n\n- দ্বিতীয় ভাগে `v` থেকে `k - du - 1` ধাপ না নিয়ে `total - k` গুলিয়ে ফেলা — দুইটাই একই জিনিস, কিন্তু একটা লিখে সাবধানে যাচাই করো; `k = total` হলে ধাপ `0`, উত্তর `v` নিজে।\n- প্রথম ভাগে `k` ধাপ উঠে `w`-কে দুইবার গোনা — প্রথম ভাগে নোড `du + 1`টা, তাই `k - 1` ধাপ উঠতে হয়।\n- `u == v` প্রশ্নে `total = 1` ভুলে `k = 1`-এর বাইরে উত্তর দেওয়া — এখানে `k = 1` হলে `u`, বাকি সব `-1`।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["LCA", "Binary Lifting", "Path Query"],
    tests: [
      { input: "4 6\n1 2\n2 3\n3 4\n4 1 2\n4 2 1\n2 4 3\n4 1 5\n2 2 1\n2 2 2\n", expectedOutput: "3\n4\n4\n-1\n2\n-1\n", isSample: true },
      { input: "1 2\n1 1 1\n1 1 1\n", expectedOutput: "1\n1\n", isSample: true },
      { input: "3 4\n1 2\n2 3\n3 1 1\n3 1 2\n3 1 3\n3 1 4\n", expectedOutput: "3\n2\n1\n-1\n", isSample: false },
      { input: "5 4\n1 2\n1 3\n3 4\n3 5\n2 4 2\n2 5 3\n2 4 3\n4 5 1\n", expectedOutput: "1\n3\n3\n4\n", isSample: false },
      { ...kthNodeLarge("binary", 100000, 5000), isSample: false },
      { ...kthNodeLarge("chain", 100000, 200), isSample: false },
    ],
    referencePython:
      "import sys\n\ndef main():\n    data = sys.stdin.buffer.read().split()\n    it = iter(data)\n    n = int(next(it)); q = int(next(it))\n    adj = [[] for _ in range(n + 1)]\n    for _ in range(n - 1):\n        u = int(next(it)); v = int(next(it))\n        adj[u].append(v); adj[v].append(u)\n    parent = [0] * (n + 1)\n    depth = [0] * (n + 1)\n    parent[1] = 1\n    order = [1]\n    for u in order:\n        for v in adj[u]:\n            if v != parent[u]:\n                parent[v] = u\n                depth[v] = depth[u] + 1\n                order.append(v)\n    LOG = (n).bit_length()\n    up = [parent[:]]\n    for k in range(1, LOG):\n        prev = up[-1]\n        up.append([prev[prev[v]] for v in range(n + 1)])\n\n    def kth_ancestor(u, k):\n        bit = 0\n        while k:\n            if k & 1:\n                u = up[bit][u]\n            k >>= 1\n            bit += 1\n        return u\n\n    def lca(u, v):\n        if depth[u] < depth[v]:\n            u, v = v, u\n        diff = depth[u] - depth[v]\n        bit = 0\n        while diff:\n            if diff & 1:\n                u = up[bit][u]\n            diff >>= 1\n            bit += 1\n        if u == v:\n            return u\n        for k in range(LOG - 1, -1, -1):\n            if up[k][u] != up[k][v]:\n                u = up[k][u]\n                v = up[k][v]\n        return parent[u]\n\n    out = []\n    for _ in range(q):\n        u = int(next(it)); v = int(next(it)); k = int(next(it))\n        w = lca(u, v)\n        du = depth[u] - depth[w]\n        dv = depth[v] - depth[w]\n        total = du + dv + 1\n        if k > total:\n            out.append('-1')\n        elif k <= du + 1:\n            out.append(str(kth_ancestor(u, k - 1)))\n        else:\n            out.append(str(kth_ancestor(v, total - k)))\n    sys.stdout.write('\\n'.join(out) + '\\n')\n\nmain()\n",
  },
  {
    slug: "learn-m6-sparse-table-lca-h2",
    title: "LCA in O(1)",
    statement:
      "রফির রুট-ম্যাপ সার্ভারে প্রতি সেকেন্ডে হাজারখানেক LCA প্রশ্ন আসে। Binary lifting-এ প্রতি প্রশ্নে `O(log n)` ধাপ — চলে, কিন্তু সার্ভার আরও চায়: একবার টেবিল বানিয়ে প্রতিটি প্রশ্ন **`O(1)`**-এ উত্তর!\n\nগাছটাকে Euler tour করলে প্রশ্নটা রূপান্তরিত হয় একটা অ্যারের রেঞ্জ-সর্বনিম্ন (RMQ) হিসেবে — আর স্ট্যাটিক RMQ-র জন্য স্পার্স টেবিল তো তোমার হাতেই আছে।\n\n`n - 1`টি পথ দেওয়া থাকবে; `q`টি প্রশ্ন `u v` — LCA প্রিন্ট করো।\n\nউদাহরণ: গাছ `1-2, 1-3, 2-4` — LCA(4, 3) = `1`, LCA(4, 2) = `2`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। পরের `n - 1` লাইনে এক একটি পথ `u v`। তারপর `q` লাইনে প্রশ্ন `u v`।",
    outputFormat: "`q` লাইনে উত্তর — প্রতিটি প্রশ্নের LCA (১-ভিত্তিক নোড নম্বর)।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 100000`\n`1 <= u, v <= n`\nরুট ১ নম্বর",
    editorial:
      "## ধারণা\n\nগাছে DFS চালাও — কোনো নোডে ঢুকলে লিখে রাখো, আর প্রতিটি সন্তানের সাব-ট্রি শেষ হয়ে ফিরে এলে বাবাকে **আবার** লিখো। এই Euler tour-এর দৈর্ঘ্য `2n - 1`। এবার ম্যাজিকটা: `u` আর `v`-এর **প্রথম আবির্ভাবের** মাঝের অংশে সবচেয়ে কম গভীরতার নোডটাই তাদের LCA। কারণ ট্যুরের ওই মাঝের অংশটা ঠিক `u` থেকে সর্বোচ্চ বিন্দু হয়ে `v`-তে যাওয়ার পথটাই ঘোরে — আর পথের সর্বোচ্চ বিন্দু LCA। গভীরতা আর নোড একসাথে রাখতে `depth * (n + 1) + node` এনকোড করো — `min` নিলেই আগে গভীরতা তুলনা হয়, সমান গভীরতায় নোড নম্বর। প্রশ্নে দুটো ওভারল্যাপিত পাওয়ার-ব্লক নিলে হয় — `min` idempotent।\n\n## ধাপে ধাপে\n\n1. স্ট্যাক দিয়ে Euler tour বানাও; প্রতিটি নোডের প্রথম আবির্ভাব `first[u]` আর গভীরতা `depth_of[u]` লিখে রাখো।\n2. ট্যুরের প্রতিটি ঘরে `depth * K + node` বসাও, `K = n + 1`।\n3. এই অ্যারের উপর স্পার্স টেবিল (min) বানাও।\n4. প্রশ্নে `a = first[u]`, `b = first[v]` (ছোট-বড় সাজিয়ে), দুই ব্লকের min নিয়ে `mod K` করলেই নোড নম্বর।\n\n```python\nimport sys\n\ndef main():\n    data = sys.stdin.buffer.read().split()\n    it = iter(data)\n    n = int(next(it)); q = int(next(it))\n    adj = [[] for _ in range(n + 1)]\n    for _ in range(n - 1):\n        u = int(next(it)); v = int(next(it))\n        adj[u].append(v); adj[v].append(u)\n    parent = [0] * (n + 1)\n    parent[1] = 1\n    K = n + 1\n    tour = []\n    first = [0] * (n + 1)\n    depth_of = [0] * (n + 1)\n    stack = [(1, 0)]\n    while stack:\n        u, index = stack[-1]\n        if index == 0:\n            first[u] = len(tour)\n            tour.append(depth_of[u] * K + u)\n        if index < len(adj[u]):\n            v = adj[u][index]\n            stack[-1] = (u, index + 1)\n            if v != parent[u]:\n                parent[v] = u\n                depth_of[v] = depth_of[u] + 1\n                stack.append((v, 0))\n        else:\n            if u != 1:\n                tour.append(depth_of[parent[u]] * K + parent[u])\n            stack.pop()\n    m = len(tour)\n    log = [0] * (m + 1)\n    for i in range(2, m + 1):\n        log[i] = log[i // 2] + 1\n    st = [tour[:]]\n    level = 1\n    while (1 << level) <= m:\n        prev = st[-1]\n        step = 1 << (level - 1)\n        st.append(list(map(min, prev, prev[step:])))\n        level += 1\n\n    def lca(u, v):\n        a, b = first[u], first[v]\n        if a > b:\n            a, b = b, a\n        length = b - a + 1\n        k = log[length]\n        return min(st[k][a], st[k][b - (1 << k) + 1]) % K\n\n    out = []\n    for _ in range(q):\n        u = int(next(it)); v = int(next(it))\n        out.append(str(lca(u, v)))\n    sys.stdout.write('\\n'.join(out) + '\\n')\n\nmain()\n```\n\n## কমপ্লেক্সিটি\n\nট্যুর `O(n)`, স্পার্স টেবিল `O(n)` দৈর্ঘ্যের অ্যারেতে `O(n log n)` — প্রতি প্রশ্ন `O(1)`। Binary lifting-এর চেয়ে টেবিল দ্বিগুণ লম্বা (`2n - 1`) হলেও প্রশ্ন-সংখ্যা যত বড়, তত লাভ।\n\n## সাধারণ ভুল\n\n- `first[v] < first[u]` হলে ইনডেক্স উল্টাতে ভুলে যাওয়া — প্রশ্নের দুই নোড যে কোনো ক্রমেই আসতে পারে।\n- সন্তান শেষে বাবাকে আবার লেখা ভুলে গেলে ট্যুরে পথের মাঝের অংশ ছিঁড়ে যায় — LCA ভুল নোডে পড়ে।\n- এনকোডিং ছাড়া `(depth, node)` টুপল রেখে মেমরি দ্বিগুণ করা — `depth * K + node` একটাই সংখ্যায় কাজ চুকিয়ে দেয়।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 4000,
    memoryLimitMb: 256,
    tags: ["LCA", "Euler Tour", "Sparse Table"],
    tests: [
      { input: "4 3\n1 2\n1 3\n2 4\n4 3\n4 2\n3 1\n", expectedOutput: "1\n2\n1\n", isSample: true },
      { input: "1 2\n1 1\n1 1\n", expectedOutput: "1\n1\n", isSample: true },
      { input: "5 3\n1 2\n2 3\n3 4\n4 5\n5 1\n4 5\n2 4\n", expectedOutput: "1\n4\n2\n", isSample: false },
      { input: "5 3\n1 2\n1 3\n1 4\n1 5\n2 3\n4 5\n5 5\n", expectedOutput: "1\n1\n5\n", isSample: false },
      { ...eulerLcaLarge("binary", 100000, 5000), isSample: false },
      { ...eulerLcaLarge("chain", 100000, 2000), isSample: false },
    ],
    referencePython:
      "import sys\n\ndef main():\n    data = sys.stdin.buffer.read().split()\n    it = iter(data)\n    n = int(next(it)); q = int(next(it))\n    adj = [[] for _ in range(n + 1)]\n    for _ in range(n - 1):\n        u = int(next(it)); v = int(next(it))\n        adj[u].append(v); adj[v].append(u)\n    parent = [0] * (n + 1)\n    parent[1] = 1\n    K = n + 1\n    tour = []\n    first = [0] * (n + 1)\n    depth_of = [0] * (n + 1)\n    stack = [(1, 0)]\n    while stack:\n        u, index = stack[-1]\n        if index == 0:\n            first[u] = len(tour)\n            tour.append(depth_of[u] * K + u)\n        if index < len(adj[u]):\n            v = adj[u][index]\n            stack[-1] = (u, index + 1)\n            if v != parent[u]:\n                parent[v] = u\n                depth_of[v] = depth_of[u] + 1\n                stack.append((v, 0))\n        else:\n            if u != 1:\n                tour.append(depth_of[parent[u]] * K + parent[u])\n            stack.pop()\n    m = len(tour)\n    log = [0] * (m + 1)\n    for i in range(2, m + 1):\n        log[i] = log[i // 2] + 1\n    st = [tour[:]]\n    level = 1\n    while (1 << level) <= m:\n        prev = st[-1]\n        step = 1 << (level - 1)\n        st.append(list(map(min, prev, prev[step:])))\n        level += 1\n\n    def lca(u, v):\n        a, b = first[u], first[v]\n        if a > b:\n            a, b = b, a\n        length = b - a + 1\n        k = log[length]\n        return min(st[k][a], st[k][b - (1 << k) + 1]) % K\n\n    out = []\n    for _ in range(q):\n        u = int(next(it)); v = int(next(it))\n        out.append(str(lca(u, v)))\n    sys.stdout.write('\\n'.join(out) + '\\n')\n\nmain()\n",
  },
];
