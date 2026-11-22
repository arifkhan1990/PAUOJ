import type { SeedProblem } from "../../seed-problems";
import { newlineOutput } from "../generated-tests";
import { makeFenwick } from "./fenwick-tree-problems";
import { buildTree, lcaNaive } from "./sparse-table-lca-problems";

type HldOracle = { parent: number[]; depth: number[]; weight: number[] };

function hldTree(n: number, kind: "chain" | "binary") {
  const { edges, oracle } = buildTree(n, kind);
  const children: number[][] = Array.from({ length: n + 1 }, () => [] as number[]);
  for (let i = 2; i <= n; i += 1) children[oracle.parent[i]].push(i);
  return { edges, tree: oracle, children };
}

function nodeValues(n: number): number[] {
  const values = new Array<number>(n + 1).fill(0);
  for (let i = 1; i <= n; i += 1) values[i] = ((i * 7919) % 2001) - 1000;
  return values;
}

export function pathSumNaive(t: HldOracle, values: number[], u: number, v: number): number {
  const w = lcaNaive(t, u, v);
  let total = 0;
  for (let a = u; a !== w; a = t.parent[a]) total += values[a];
  for (let a = v; a !== w; a = t.parent[a]) total += values[a];
  return total + values[w];
}

function pathMaxNaive(t: HldOracle, values: number[], u: number, v: number): number {
  const w = lcaNaive(t, u, v);
  let best = -Infinity;
  for (let a = u; a !== w; a = t.parent[a]) best = Math.max(best, values[a]);
  for (let a = v; a !== w; a = t.parent[a]) best = Math.max(best, values[a]);
  return Math.max(best, values[w]);
}

function pathArgmaxNaive(t: HldOracle, values: number[], u: number, v: number): number {
  const w = lcaNaive(t, u, v);
  let bestId = -1, bestVal = -Infinity;
  const consider = (x: number): void => {
    if (values[x] > bestVal || (values[x] === bestVal && x < bestId)) {
      bestVal = values[x];
      bestId = x;
    }
  };
  for (let a = u; a !== w; a = t.parent[a]) consider(a);
  for (let a = v; a !== w; a = t.parent[a]) consider(a);
  consider(w);
  return bestId;
}

function edgesText(edges: number[][]): string {
  return `${edges.map((edge) => edge.join(" ")).join("\n")}\n`;
}

function rowsText(rows: number[][]): string {
  return `${rows.map((row) => row.join(" ")).join("\n")}\n`;
}

function pointQueryRows(n: number, q: number): number[][] {
  const rows: number[][] = [];
  for (let k = 0; k < q; k += 1) rows.push([((k * 7919) % n) + 1, ((k * 104729) % n) + 1]);
  return rows;
}

function hldStaticLarge(kind: "chain" | "binary", mode: "sum" | "argmax"): {
  input: string;
  expectedOutput: string;
} {
  const n = 2000, q = 2000;
  const { edges, tree } = hldTree(n, kind);
  const values = nodeValues(n);
  const queries = pointQueryRows(n, q);
  const answers = queries.map(([u, v]) =>
    String(mode === "sum" ? pathSumNaive(tree, values, u, v) : pathArgmaxNaive(tree, values, u, v)),
  );
  const input = `${n} ${q}\n${edgesText(edges)}${values.slice(1).join(" ")}\n${rowsText(queries)}`;
  return { input, expectedOutput: newlineOutput(answers) };
}

function hldMaxLarge(): { input: string; expectedOutput: string } {
  const n = 2000, q = 2000;
  const { edges, tree } = hldTree(n, "binary");
  const values = nodeValues(n);
  const frozen = values.slice(1);
  const ops: number[][] = [];
  const answers: string[] = [];
  for (let k = 0; k < q; k += 1) {
    if (k % 4 === 0) {
      const u = ((k * 7919) % n) + 1, v = ((k * 104729) % n) + 1;
      ops.push([2, u, v]);
      answers.push(String(pathMaxNaive(tree, values, u, v)));
    } else {
      const x = ((k * 7919) % n) + 1, value = ((k * 104729) % 2001) - 1000;
      ops.push([1, x, value]);
      values[x] = value;
    }
  }
  const input = `${n} ${q}\n${edgesText(edges)}${frozen.join(" ")}\n${rowsText(ops)}`;
  return { input, expectedOutput: newlineOutput(answers) };
}

function hldSumLarge(kind: "chain" | "binary", n: number, q: number, every: number): {
  input: string;
  expectedOutput: string;
} {
  const { edges, tree } = hldTree(n, kind);
  const values = nodeValues(n);
  const frozen = values.slice(1);
  const ops: number[][] = [];
  const answers: string[] = [];
  for (let k = 0; k < q; k += 1) {
    if (k % every === 0) {
      const u = ((k * 7919) % n) + 1, v = ((k * 104729) % n) + 1;
      ops.push([2, u, v]);
      answers.push(String(pathSumNaive(tree, values, u, v)));
    } else {
      const x = ((k * 7919) % n) + 1, value = ((k * 104729) % 2001) - 1000;
      ops.push([1, x, value]);
      values[x] = value;
    }
  }
  const input = `${n} ${q}\n${edgesText(edges)}${frozen.join(" ")}\n${rowsText(ops)}`;
  return { input, expectedOutput: newlineOutput(answers) };
}

function hldSubtreeLarge(kind: "chain" | "binary", n: number, q: number, every: number): {
  input: string;
  expectedOutput: string;
} {
  const { edges, tree, children } = hldTree(n, kind);
  const values = nodeValues(n);
  const frozen = values.slice(1);
  const tin = new Array<number>(n + 1).fill(0);
  const tout = new Array<number>(n + 1).fill(0);
  let time = 0;
  const stack = [1], cursor = [0];
  while (stack.length > 0) {
    const u = stack[stack.length - 1];
    const i = cursor[cursor.length - 1];
    if (i === 0) { time += 1; tin[u] = time; }
    if (i < children[u].length) {
      cursor[cursor.length - 1] = i + 1;
      stack.push(children[u][i]);
      cursor.push(0);
    } else {
      tout[u] = time;
      stack.pop();
      cursor.pop();
    }
  }
  const subBit = makeFenwick(n);
  for (let v = 1; v <= n; v += 1) subBit.add(tin[v], values[v]);
  const ops: number[][] = [];
  const answers: string[] = [];
  for (let k = 0; k < q; k += 1) {
    if (k % every === 0) {
      if (Math.floor(k / every) % 2 === 0) {
        const u = ((k * 7919) % n) + 1, v = ((k * 104729) % n) + 1;
        ops.push([2, u, v]);
        answers.push(String(pathSumNaive(tree, values, u, v)));
      } else {
        const u = ((k * 37) % n) + 1;
        ops.push([3, u]);
        answers.push(String(subBit.range(tin[u], tout[u])));
      }
    } else {
      const x = ((k * 7919) % n) + 1, value = ((k * 104729) % 2001) - 1000;
      ops.push([1, x, value]);
      subBit.add(tin[x], value - values[x]);
      values[x] = value;
    }
  }
  const input = `${n} ${q}\n${edgesText(edges)}${frozen.join(" ")}\n${rowsText(ops)}`;
  return { input, expectedOutput: newlineOutput(answers) };
}

function hldCountLarge(kind: "chain" | "binary", n: number, q: number): {
  input: string;
  expectedOutput: string;
} {
  const { edges, tree } = hldTree(n, kind);
  const queries = pointQueryRows(n, q);
  const answers = queries.map(([u, v]) => {
    const w = lcaNaive(tree, u, v);
    return String(tree.depth[u] + tree.depth[v] - 2 * tree.depth[w] + 1);
  });
  const input = `${n} ${q}\n${edgesText(edges)}${rowsText(queries)}`;
  return { input, expectedOutput: newlineOutput(answers) };
}

function hldPathAddLarge(kind: "chain" | "binary", n: number, q: number, every: number): {
  input: string;
  expectedOutput: string;
} {
  const { edges, tree } = hldTree(n, kind);
  const values = new Array<number>(n + 1).fill(0);
  const ops: number[][] = [];
  const answers: string[] = [];
  for (let k = 0; k < q; k += 1) {
    if (k % every === 0) {
      const i = ((k * 7919) % n) + 1;
      ops.push([2, i]);
      answers.push(String(values[i]));
    } else {
      const u = ((k * 7919) % n) + 1, v = ((k * 104729) % n) + 1;
      const x = ((k * 37) % 2001) - 1000;
      ops.push([1, u, v, x]);
      const w = lcaNaive(tree, u, v);
      for (let a = u; a !== w; a = tree.parent[a]) values[a] += x;
      for (let a = v; a !== w; a = tree.parent[a]) values[a] += x;
      values[w] += x;
    }
  }
  const input = `${n} ${q}\n${edgesText(edges)}${rowsText(ops)}`;
  return { input, expectedOutput: newlineOutput(answers) };
}

export const HLD_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m6-hld-g1",
    title: "Static Path Sum",
    statement:
      "ক্যাম্পাস নেটওয়ার্কের গাছে প্রতিটি নোডে আজকের ট্রফিকের পরিমাণ বসানো আছে। প্রতিটি প্রশ্নে `u v` দেওয়া থাকে — `u` থেকে `v` যাওয়ার পথে (দুই প্রান্তসহ) থাকা সব নোডের পরিমাণের যোগফল প্রিন্ট করো। পথের কোনো নোড দুইবার ধরা হবে না।\n\nছোট গাছ, তাই পথ ধরে উপরে-নিচে ঘুরেই উত্তর পাওয়া যায়; বড় গাছের জন্য HLD-এর পরের সমস্যা দেখো।\n\nউদাহরণ: গাছ `1-2, 1-3`, মান `5 10 20` — `2` থেকে `3`: `5 + 10 + 20 = 35`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। পরের `n - 1` লাইনে পথ `u v`। পরের লাইনে `n`টি নোডের মান। তারপর `q` লাইনে প্রশ্ন `u v`।",
    outputFormat: "`q` লাইনে উত্তর — প্রতিটি পথের যোগফল।",
    constraints:
      "`1 <= n <= 2000`\n`1 <= q <= 2000`\n`-1000 <= node value <= 1000`\nউত্তর ৬৪-বিট সাইনড সংখ্যার মধ্যে",
    editorial:
      "## ধারণা\n\nপথ `u-v` হলো `u` থেকে LCA ওঠা অংশ এবং `v` থেকে LCA ওঠা অংশ — দুই অংশের সমন্বয়। ছোট গাছে সবচেয়ে সহজ উপায়: আগে LCA বের করা (গভীর নোড উপরে তুলে এক গভীরতায় এনে দুটোকে একসাথে উপরে), তারপর `u` থেকে LCA পর্যন্ত এবং `v` থেকে LCA পর্যন্ত মান যোগ করা; শেষে LCA-র মানটাও যোগ হবে।\n\n## ধাপে ধাপে\n\n1. রুট ১ থেকে `parent` ও `depth` বানাও।\n2. `lca(u, v)` বের করো — আগে গভীরতা মেলাও, তারপর দুটোকে একসাথে উপরে তুলো।\n3. `u` থেকে LCA পর্যন্ত ঘুরে মান যোগ করো, `v` থেকেও তেমনই (LCA-র মান একবারই যোগ হবে)।\n4. প্রতিটি প্রশ্নের উত্তর এক এক লাইনে প্রিন্ট করো।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nadj = [[] for _ in range(n + 1)]\nfor _ in range(n - 1):\n    u = int(next(it)); v = int(next(it))\n    adj[u].append(v); adj[v].append(u)\nvalue = [0] + [int(next(it)) for _ in range(n)]\nparent = [0] * (n + 1); depth = [0] * (n + 1)\nparent[1] = 1\norder = [1]\nfor u in order:\n    for v in adj[u]:\n        if v != parent[u]:\n            parent[v] = u; depth[v] = depth[u] + 1\n            order.append(v)\n\ndef lca(u, v):\n    if depth[u] < depth[v]: u, v = v, u\n    while depth[u] > depth[v]: u = parent[u]\n    while u != v: u = parent[u]; v = parent[v]\n    return u\n\nout = []\nfor _ in range(q):\n    u = int(next(it)); v = int(next(it))\n    w = lca(u, v)\n    total = 0\n    x = u\n    while x != w:\n        total += value[x]; x = parent[x]\n    x = v\n    while x != w:\n        total += value[x]; x = parent[x]\n    out.append(str(total + value[w]))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n## কমপ্লেক্সিটি\n\nপ্রতি প্রশ্ন `O(depth)` — এখানে `n <= 2000` বলে `q = 2000`-এও ৪০ লাখ ধাপ, চলে। শিকল গাছে এটা `O(n)` প্রতি প্রশ্নে হয়ে যায়, তাই বড় গাছে এই কৌশল কাজের নয়।\n\n## সাধারণ ভুল\n\n- LCA-র মান দুইবার যোগ বা একবারও না যোগ করা — `while x != w` লুপে LCA ধরা হয় না, শেষে আলাদা যোগ করতে হবে।\n- উপরে ওঠার সময় মান নিননি, বরং পুরো নোড লিস্ট বানিয়ে দুই লিস্ট উল্টিয়ে মেলানো — ভুল নয়, কিন্তু সময় দ্বিগুণ এবং ভুল করার সুযোগও বেশি।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Trees", "Path Query", "LCA"],
    tests: [
      { input: "3 3\n1 2\n1 3\n5 10 20\n2 3\n1 1\n3 2\n", expectedOutput: "35\n5\n35\n", isSample: true },
      { input: "1 2\n5\n1 1\n1 1\n", expectedOutput: "5\n5\n", isSample: true },
      { input: "4 2\n1 2\n2 3\n2 4\n1 1 1 1\n3 4\n1 4\n", expectedOutput: "3\n3\n", isSample: false },
      { input: "2 2\n1 2\n-4 7\n1 2\n2 1\n", expectedOutput: "3\n3\n", isSample: false },
      { ...hldStaticLarge("chain", "sum"), isSample: false },
      { ...hldStaticLarge("binary", "sum"), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nadj = [[] for _ in range(n + 1)]\nfor _ in range(n - 1):\n    u = int(next(it)); v = int(next(it))\n    adj[u].append(v); adj[v].append(u)\nvalue = [0] + [int(next(it)) for _ in range(n)]\nparent = [0] * (n + 1); depth = [0] * (n + 1)\nparent[1] = 1\norder = [1]\nfor u in order:\n    for v in adj[u]:\n        if v != parent[u]:\n            parent[v] = u; depth[v] = depth[u] + 1\n            order.append(v)\n\ndef lca(u, v):\n    if depth[u] < depth[v]: u, v = v, u\n    while depth[u] > depth[v]: u = parent[u]\n    while u != v:\n        u = parent[u]; v = parent[v]\n    return u\n\nout = []\nfor _ in range(q):\n    u = int(next(it)); v = int(next(it))\n    w = lca(u, v)\n    total = 0\n    x = u\n    while x != w:\n        total += value[x]; x = parent[x]\n    x = v\n    while x != w:\n        total += value[x]; x = parent[x]\n    out.append(str(total + value[w]))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-hld-g2",
    title: "Path Max with Updates",
    statement:
      "নেটওয়ার্কের কয়েকটি নোডের লোড বদলায়। দুই ধরনের অপারেশন:\n\n- `1 x v` — নোড `x`-এর মান বদলে `v` করো।\n- `2 u v` — `u` থেকে `v` পথে সব নোডের মধ্যে সর্বাধিক মান প্রিন্ট করো।\n\nশুধু `2` অপারেশনের উত্তর দাও।\n\nউদাহরণ: গাছ `1-2, 1-3`, মান `5 10 20`; `2 2 3` → `20`; `1 2 100` এরপর `2 2 3` → `100`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। পরের `n - 1` লাইনে পথ `u v`। পরের লাইনে `n`টি নোডের মান। তারপর `q` লাইনে অপারেশন — `1 x v` অথবা `2 u v`।",
    outputFormat: "প্রতিটি `2` অপারেশনের জন্য একটি করে লাইনে পথের সর্বাধিক মান।",
    constraints:
      "`1 <= n <= 2000`\n`1 <= q <= 2000`\n`-1000 <= value, v <= 1000`",
    editorial:
      "## ধারণা\n\nআগের সমস্যার মতোই — পথকে LCA দিয়ে দুই ভাগ করে প্রতিটি ভাগ ঘুরে সর্বাধিক মান বের করা। শুধু যোগের বদলে এখানে সর্বাধিক সংগ্রহ হবে এবং আপডেট এলে নোডের মান সরাসরি বদলানো যায় — পথের কাঠামো বদলায় না, তাই বাবা-সন্তান সম্পর্কে কিছু হালনাগাদ করার দরকার নেই।\n\n## ধাপে ধাপে\n\n1. `parent`, `depth` বানিয়ে মানগুলো একটা ১-ভিত্তিক অ্যারেতে রাখো।\n2. অপারেশন `1 x v` এলে `value[x] = v` — সঙ্গে সঙ্গে।\n3. অপারেশন `2 u v` এলে LCA বের করে `u` থেকে LCA এবং `v` থেকে LCA পর্যন্ত ঘুরে `max` নাও; LCA-র মানও তুলো।\n4. উল্টো হওয়ার আশঙ্কা এড়াতে `max`-এর প্রারম্ভিক মান বড় ঋণাত্মক সংখ্যা নয়, বরং প্রথম নোড দিয়ে শুরু করো বা `-10^9` ধরো।\n\n```python\n# একই কাঠামো: parent, depth, lca আগের মতো\nout = []\nfor _ in range(q):\n    parts = next(it)\n    if parts == b'1':\n        x = int(next(it)); v = int(next(it))\n        value[x] = v\n    else:\n        u = int(next(it)); v = int(next(it))\n        w = lca(u, v)\n        best = -10**9\n        x = u\n        while x != w:\n            best = max(best, value[x]); x = parent[x]\n        x = v\n        while x != w:\n            best = max(best, value[x]); x = parent[x]\n        out.append(str(max(best, value[w])))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n## কমপ্লেক্সিটি\n\nআপডেট `O(1)`, কোয়েরি `O(depth)` — `n <= 2000`-এ সহনীয়। বড় গাছে আপডেটসহ পথের সর্বাধিক চাইলে HLD + সেগমেন্ট ট্রি লাগবে।\n\n## সাধারণ ভুল\n\n- আপডেটের সময় `value[x] += v` লেখা — প্রশ্ন প্রতিস্থাপন চায়।\n- সব ঋণাত্মক মানের ক্ষেত্রে `best = 0` দিয়ে শুরু করা — উত্তর ভুল হবে; যথাযথ ছোট সংখ্যা নাও।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Trees", "Path Query", "Point Update"],
    tests: [
      { input: "3 3\n1 2\n1 3\n5 10 20\n2 2 3\n1 2 100\n2 2 3\n", expectedOutput: "20\n100\n", isSample: true },
      { input: "1 3\n-5\n1 1 7\n2 1 1\n2 1 1\n", expectedOutput: "7\n7\n", isSample: true },
      { input: "4 3\n1 2\n2 3\n2 4\n3 1 1 3\n2 3 4\n1 3 -9\n2 3 4\n", expectedOutput: "3\n3\n", isSample: false },
      { input: "2 2\n1 2\n0 0\n1 2 -4\n2 1 2\n", expectedOutput: "0\n", isSample: false },
      { ...hldMaxLarge(), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nadj = [[] for _ in range(n + 1)]\nfor _ in range(n - 1):\n    u = int(next(it)); v = int(next(it))\n    adj[u].append(v); adj[v].append(u)\nvalue = [0] + [int(next(it)) for _ in range(n)]\nparent = [0] * (n + 1); depth = [0] * (n + 1)\nparent[1] = 1\norder = [1]\nfor u in order:\n    for v in adj[u]:\n        if v != parent[u]:\n            parent[v] = u; depth[v] = depth[u] + 1\n            order.append(v)\n\ndef lca(u, v):\n    if depth[u] < depth[v]: u, v = v, u\n    while depth[u] > depth[v]: u = parent[u]\n    while u != v:\n        u = parent[u]; v = parent[v]\n    return u\n\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        x = int(next(it)); v = int(next(it))\n        value[x] = v\n    else:\n        u = int(next(it)); v = int(next(it))\n        w = lca(u, v)\n        best = -10**9\n        x = u\n        while x != w:\n            best = max(best, value[x]); x = parent[x]\n        x = v\n        while x != w:\n            best = max(best, value[x]); x = parent[x]\n        out.append(str(max(best, value[w])))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-hld-e1",
    title: "Busiest Node on Path",
    statement:
      "দুইটা ল্যাবের মধ্যে পথে কোন নোডটা সবচেয়ে বেশি চাপে আছে? প্রতিটি প্রশ্নে `u v` দেওয়া থাকে; `u` থেকে `v` পথের মধ্যে সর্বাধিক মান যে নোডে, তার **নম্বর** প্রিন্ট করো। মান একাধিক নোডে সমান হলে ছোট নম্বরটাই ধরতে হবে।\n\nনোডের মান কোনো পরিবর্তন ঘটবে না।\n\nউদাহরণ: গাছ `1-2, 1-3`, মান `5 10 20` — `2 3` পথের সর্বাধিক `20`, নোড `3`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। পরের `n - 1` লাইনে পথ `u v`। পরের লাইনে `n`টি নোডের মান। তারপর `q` লাইনে প্রশ্ন `u v`।",
    outputFormat: "`q` লাইনে উত্তর — সর্বাধিক মানের নোডের নম্বর (ছোট নম্বর প্রাধান্য)।",
    constraints:
      "`1 <= n <= 2000`\n`1 <= q <= 2000`\n`-1000 <= node value <= 1000`",
    editorial:
      "## ধারণা\n\nপথের সর্বাধিক মান খুঁজতে গিয়ে সঙ্গে সঙ্গে সেই নোডের নম্বরও ধরে রাখতে হবে। জোড়া হিসেবে ভাবো: `(মান, নোড নম্বর)` — তুলনায় মান বড় হলে সে জিতবে, মান সমান হলে নোড নম্বর ছোটটা জিতবে। এই নিয়মে LCA পর্যন্ত ঘুরলেই প্রশ্নের উত্তর — শর্তটাই আসলে টাই-ব্রেক, কারণ পথের ক্রম যেকোনো হতে পারে।\n\n## ধাপে ধাপে\n\n1. `parent`, `depth` এবং ১-ভিত্তিক `value` অ্যারে বানাও।\n2. প্রতিটি প্রশ্নে `w = lca(u, v)` বের করো।\n3. `u` থেকে `w` এবং `v` থেকে `w` পর্যন্ত ঘুরুন; প্রতিটি নোড দিয়ে `best` হালনাগাদ করো — মান বড়, সমান হলে নম্বর ছোট।\n4. শেষে `w` নোডটাও একই নিয়মে যাচাই করো এবং `bestId` প্রিন্ট করো।\n\n```python\nout = []\nfor _ in range(q):\n    u = int(next(it)); v = int(next(it))\n    w = lca(u, v)\n    best_id, best_val = -1, -10**9\n    def touch(x):\n        global best_id, best_val\n        if value[x] > best_val or (value[x] == best_val and x < best_id):\n            best_val, best_id = value[x], x\n    x = u\n    while x != w:\n        touch(x); x = parent[x]\n    x = v\n    while x != w:\n        touch(x); x = parent[x]\n    touch(w)\n    out.append(str(best_id))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n## কমপ্লেক্সিটি\n\nপ্রতি প্রশ্ন `O(depth)` — `n <= 2000`-এ সহজে চলে। স্পেস `O(n)`।\n\n## সাধারণ ভুল\n\n- টাই-ব্রেক না করা — সমান মানে কোন নোড দেবে সেটা অনির্দিষ্ট থাকবে; প্রশ্ন ছোট নম্বর চায়।\n- LCA বাদ দিয়ে শুধু দুই পাশের অংশ ঘোরা — LCA নোডটাও পথের অংশ, সে বাদ পড়লে সেটাই সর্বাধিক হলে উত্তর ভুল হয়।\n- ঘুরার সময় মান আর নোড গুলিয়ে ফেলা (`best`-এ মান, আলাদা জায়গায় নোড) — দুটো একসাথে রাখো।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Trees", "Path Query", "Argmax"],
    tests: [
      { input: "3 2\n1 2\n1 3\n5 10 20\n2 3\n1 2\n", expectedOutput: "3\n2\n", isSample: true },
      { input: "1 2\n4\n1 1\n1 1\n", expectedOutput: "1\n1\n", isSample: true },
      { input: "4 2\n1 2\n2 3\n2 4\n7 7 7 7\n3 4\n4 1\n", expectedOutput: "2\n1\n", isSample: false },
      { input: "3 2\n1 2\n2 3\n1 9 2\n1 3\n2 3\n", expectedOutput: "2\n2\n", isSample: false },
      { ...hldStaticLarge("chain", "argmax"), isSample: false },
      { ...hldStaticLarge("binary", "argmax"), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nadj = [[] for _ in range(n + 1)]\nfor _ in range(n - 1):\n    u = int(next(it)); v = int(next(it))\n    adj[u].append(v); adj[v].append(u)\nvalue = [0] + [int(next(it)) for _ in range(n)]\nparent = [0] * (n + 1); depth = [0] * (n + 1)\nparent[1] = 1\norder = [1]\nfor u in order:\n    for v in adj[u]:\n        if v != parent[u]:\n            parent[v] = u; depth[v] = depth[u] + 1\n            order.append(v)\n\ndef lca(u, v):\n    if depth[u] < depth[v]: u, v = v, u\n    while depth[u] > depth[v]: u = parent[u]\n    while u != v:\n        u = parent[u]; v = parent[v]\n    return u\n\nout = []\nfor _ in range(q):\n    u = int(next(it)); v = int(next(it))\n    w = lca(u, v)\n    best_id, best_val = -1, -10**9\n    x = u\n    while x != w:\n        if value[x] > best_val or (value[x] == best_val and x < best_id):\n            best_val, best_id = value[x], x\n        x = parent[x]\n    x = v\n    while x != w:\n        if value[x] > best_val or (value[x] == best_val and x < best_id):\n            best_val, best_id = value[x], x\n        x = parent[x]\n    if value[w] > best_val or (value[w] == best_val and w < best_id):\n        best_id = w\n    out.append(str(best_id))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-hld-m1",
    title: "Path Sum with Updates",
    statement:
      "এবার গাছটা বড় এবং মান বদলায় — ছোট গাছের ঘোরানো কৌশল কাজের নয়। `n` নোডের গাছ, রুট ১। দুই ধরনের অপারেশন:\n\n- `1 x v` — নোড `x`-এর মান বদলে `v` করো।\n- `2 u v` — `u` থেকে `v` পথের (দুই প্রান্তসহ) সব নোডের মানের যোগফল প্রিন্ট করো।\n\nশুধু `2` অপারেশনের উত্তর দাও। এখানেই **heavy-light decomposition** কাজে লাগবে।\n\nউদাহরণ: গাছ `1-2, 2-3`, মান `1 2 3`; `2 1 3` → `6`; `1 2 10` এরপর `2 1 3` → `14`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। পরের `n - 1` লাইনে পথ `u v`। পরের লাইনে `n`টি নোডের মান। তারপর `q` লাইনে অপারেশন — `1 x v` অথবা `2 u v`।",
    outputFormat: "প্রতিটি `2` অপারেশনের জন্য একটি করে লাইনে যোগফল।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 30000`\n`-1000 <= value, v <= 1000`\nউত্তর ৬৪-বিট সাইনড সংখ্যার মধ্যে",
    editorial:
      "## ধারণা\n\nHLD-এর মূল কৌশল: গাছকে ভারী সন্তান ধরে দীর্ঘ চেইনে ভাগ করা, প্রতিটি চেইনকে একটা অ্যারে মনে করা এবং সেই অ্যারেতে সেগমেন্ট ট্রি বসানো। ভারী-সন্তানের শর্ত নিশ্চিত করে যে যেকোনো রুট-থেকে-নোড পথে light এজ সর্বোচ্চ `log n` টা, তাই কোনো দুই নোডের পথ `O(log n)` চেইনে ভাঙে। প্রতিটি চেইনের অংশ কোয়েরি `O(log n)`, তাই মোট `O(log^2 n)` প্রতি প্রশ্নে, আর নোড আপডেট একটাই পজিশন — `O(log n)`।\n\n## ধাপে ধাপে\n\n1. রুট ১ থেকে `parent`, `depth`, ঘুরার `order` বানাও।\n2. `order` উল্টো করে প্রতিটি নোডের `size` যোগ করে হিসাব করো।\n3. প্রতিটি নোডের সবচেয়ে বড় `size`-ওয়া সন্তানকে heavy ধরো।\n4. `head` ও `pos`: নতুন চেইনের শুরু থেকে heavy ধরে নিচে নেমে পরপর পজিশন দিন।\n5. `pos`-ভিত্তিক base অ্যারে নিয়ে সেগমেন্ট ট্রি বানাও (যোগ ও পয়েন্ট সেট)।\n6. পথের কোয়েরি: `head` না মিলা পর্যন্ত গভীর চেইনের খণ্ড জোগান, তারপর `parent[head]`-এ উঠুন; মিলে গেলে একই চেইনের খণ্ড নাও।\n7. আপডেট `1 x v` → `seg_update(pos[x], v)`।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nadj = [[] for _ in range(n + 1)]\nfor _ in range(n - 1):\n    u = int(next(it)); v = int(next(it))\n    adj[u].append(v); adj[v].append(u)\nvalue = [0] + [int(next(it)) for _ in range(n)]\nparent = [0] * (n + 1); depth = [0] * (n + 1); size = [0] * (n + 1)\nparent[1] = 1\norder = [1]\nfor u in order:\n    for v in adj[u]:\n        if v != parent[u]:\n            parent[v] = u; depth[v] = depth[u] + 1\n            order.append(v)\nfor u in reversed(order):\n    size[u] = 1\n    for v in adj[u]:\n        if v != parent[u]: size[u] += size[v]\nheavy = [0] * (n + 1)\nfor u in order:\n    best = 0\n    for v in adj[u]:\n        if v != parent[u] and (best == 0 or size[v] > size[best]):\n            best = v\n    heavy[u] = best\nhead = [0] * (n + 1); pos = [0] * (n + 1); cur = 1\nfor u in order:\n    if head[u] == 0:\n        x = u\n        while x:\n            head[x] = u; pos[x] = cur; cur += 1\n            x = heavy[x]\nbase = [0] * (n + 1)\nfor v in range(1, n + 1): base[pos[v]] = value[v]\nsize_st = 1\nwhile size_st < n: size_st *= 2\ntree = [0] * (2 * size_st)\nfor i in range(1, n + 1): tree[size_st + i - 1] = base[i]\nfor i in range(size_st - 1, 0, -1): tree[i] = tree[2 * i] + tree[2 * i + 1]\n\ndef seg_update(index, v):\n    node = size_st + index - 1\n    tree[node] = v\n    node //= 2\n    while node:\n        tree[node] = tree[2 * node] + tree[2 * node + 1]\n        node //= 2\n\ndef seg_query(l, r):\n    res = 0\n    left, right = size_st + l - 1, size_st + r\n    while left < right:\n        if left & 1:\n            res += tree[left]; left += 1\n        if right & 1:\n            right -= 1; res += tree[right]\n        left //= 2; right //= 2\n    return res\n\ndef path_sum(u, v):\n    total = 0\n    while head[u] != head[v]:\n        if depth[head[u]] > depth[head[v]]: u, v = v, u\n        total += seg_query(pos[head[v]], pos[v])\n        v = parent[head[v]]\n    if depth[u] > depth[v]: u, v = v, u\n    return total + seg_query(pos[u], pos[v])\n\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        x = int(next(it)); v = int(next(it))\n        seg_update(pos[x], v)\n    else:\n        u = int(next(it)); v = int(next(it))\n        out.append(str(path_sum(u, v)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n## কমপ্লেক্সিটি\n\nপ্রস্তুতি `O(n)`, আপডেট `O(log n)`, কোয়েরি `O(log^2 n)`, স্পেস `O(n)`। `n = 100000`-এ চেইন সংখ্যা সর্বোচ্চ `log n` — তাই লক্ষ অপারেশনেও সময় মাঝারি থাকে।\n\n## সাধারণ ভুল\n\n- চেইন বদলানোর সময় `depth[head[v]]` বনাম `depth[head[u]]` তুলনা না করে `depth[v]` দিয়ে মেলানো — ভুল খণ্ড কোয়েরি হয়।\n- `size` উপর থেকে হিসাব করা — heavy নির্ধারণের আগে সন্তানের `size` দরকার, তাই অবশ্যই রিভার্স অর্ডারে।\n- একই চেইনে এসে ছোট পজিশন আগে ধরা ভুলে যাওয়া — `if depth[u] > depth[v]: u, v = v, u` শর্তটা লাগবেই।\n- পয়েন্ট আপডেটে পুরো সেগমেন্ট আপডেট করার চেষ্টা — শুধু `pos[x]` লিফট ধরে উপরে উঠলেই হয়।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 4000,
    memoryLimitMb: 256,
    tags: ["HLD", "Segment Tree", "Path Query"],
    tests: [
      { input: "3 3\n1 2\n2 3\n1 2 3\n2 1 3\n1 2 10\n2 1 3\n", expectedOutput: "6\n14\n", isSample: true },
      { input: "1 3\n5\n1 1 9\n2 1 1\n2 1 1\n", expectedOutput: "9\n9\n", isSample: true },
      { input: "4 3\n1 2\n1 3\n1 4\n1 1 1 1\n2 3 4\n1 4 -2\n2 3 4\n", expectedOutput: "3\n0\n", isSample: false },
      { input: "5 2\n1 2\n2 3\n3 4\n4 5\n-1 -2 -3 -4 -5\n2 1 5\n2 2 2\n", expectedOutput: "-15\n-2\n", isSample: false },
      { ...hldSumLarge("binary", 100000, 30000, 10), isSample: false },
      { ...hldSumLarge("chain", 100000, 500, 10), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nadj = [[] for _ in range(n + 1)]\nfor _ in range(n - 1):\n    u = int(next(it)); v = int(next(it))\n    adj[u].append(v); adj[v].append(u)\nvalue = [0] + [int(next(it)) for _ in range(n)]\nparent = [0] * (n + 1); depth = [0] * (n + 1); size = [0] * (n + 1)\nparent[1] = 1\norder = [1]\nfor u in order:\n    for v in adj[u]:\n        if v != parent[u]:\n            parent[v] = u; depth[v] = depth[u] + 1\n            order.append(v)\nfor u in reversed(order):\n    size[u] = 1\n    for v in adj[u]:\n        if v != parent[u]: size[u] += size[v]\nheavy = [0] * (n + 1)\nfor u in order:\n    best = 0\n    for v in adj[u]:\n        if v != parent[u] and (best == 0 or size[v] > size[best]):\n            best = v\n    heavy[u] = best\nhead = [0] * (n + 1); pos = [0] * (n + 1); cur = 1\nfor u in order:\n    if head[u] == 0:\n        x = u\n        while x:\n            head[x] = u; pos[x] = cur; cur += 1\n            x = heavy[x]\nbase = [0] * (n + 1)\nfor v in range(1, n + 1): base[pos[v]] = value[v]\nsize_st = 1\nwhile size_st < n: size_st *= 2\ntree = [0] * (2 * size_st)\nfor i in range(1, n + 1): tree[size_st + i - 1] = base[i]\nfor i in range(size_st - 1, 0, -1): tree[i] = tree[2 * i] + tree[2 * i + 1]\n\ndef seg_update(index, v):\n    node = size_st + index - 1\n    tree[node] = v\n    node //= 2\n    while node:\n        tree[node] = tree[2 * node] + tree[2 * node + 1]\n        node //= 2\n\ndef seg_query(l, r):\n    res = 0\n    left, right = size_st + l - 1, size_st + r\n    while left < right:\n        if left & 1:\n            res += tree[left]; left += 1\n        if right & 1:\n            right -= 1; res += tree[right]\n        left //= 2; right //= 2\n    return res\n\ndef path_sum(u, v):\n    total = 0\n    while head[u] != head[v]:\n        if depth[head[u]] > depth[head[v]]: u, v = v, u\n        total += seg_query(pos[head[v]], pos[v])\n        v = parent[head[v]]\n    if depth[u] > depth[v]: u, v = v, u\n    return total + seg_query(pos[u], pos[v])\n\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        x = int(next(it)); v = int(next(it))\n        seg_update(pos[x], v)\n    else:\n        u = int(next(it)); v = int(next(it))\n        out.append(str(path_sum(u, v)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-hld-h1",
    title: "Path Sum and Subtree Sum",
    statement:
      "গাছের প্রতিটি নোড একটা করে শাখা (সাব-ট্রি) শাসন করে। তিন ধরনের অপারেশন:\n\n- `1 x v` — নোড `x`-এর মান বদলে `v` করো।\n- `2 u v` — `u` থেকে `v` পথের সব নোডের মানের যোগফল প্রিন্ট করো।\n- `3 u` — `u`-এর পুরো শাখার (নিজেসহ সব বংশধর) মানের যোগফল প্রিন্ট করো।\n\nশুধু `2` ও `3` অপারেশনের উত্তর দাও।\n\nউদাহরণ: গাছ `1-2, 1-3`, মান `5 10 20`; `3 2` → `10`, `2 2 3` → `35`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। পরের `n - 1` লাইনে পথ `u v`। পরের লাইনে `n`টি নোডের মান। তারপর `q` লাইনে অপারেশন — `1 x v`, `2 u v` বা `3 u`।",
    outputFormat: "প্রতিটি `2` ও `3` অপারেশনের জন্য একটি করে লাইনে যোগফল।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 30000`\n`-1000 <= value, v <= 1000`\nউত্তর ৬৪-বিট সাইনড সংখ্যার মধ্যে",
    editorial:
      "## ধারণা\n\nদুই ধরনের প্রশ্ন — পথ আর শাখা — দুটোই একসাথে চাইলে দুটো কাঠামো লাগে। পথের জন্য আগের মতোই HLD + সেগমেন্ট ট্রি। শাখার জন্য HLD লাগে না — গাছে একবার DFS করে প্রতিটি নোডের প্রবেশ সময় `in[u]` এবং প্রস্থান সময় `out[u]` লিখো; তখন `u`-এর শাখা হুবহু ক্রমানুসার খণ্ড `[in[u], out[u]]` — এই অর্ডারে একটা BIT বসিয়ে নোডের মান বদলালে `add(delta)` আর শাখার যোগফল দুই প্রিফিক্সের পার্থক্য। প্রতি অপারেশন `O(log n)`।\n\n## ধাপে ধাপে\n\n1. `parent`, `depth`, `size`, `heavy`, `head`, `pos` বানিয়ে HLD সেগমেন্ট ট্রি তৈরি করো (আগের সমস্যার মতো)।\n2. স্ট্যাক-ভিত্তিক DFS দিয়ে `in`/`out` সময় লিখো — রিকার্শনের বদলে স্ট্যাক গভীর গাছেও নিরাপদ।\n3. `in`-ক্রমে আরেকটা BIT বানাও; প্রতিটি নোডের মান `add(in[x], value)` দিয়ে বসাও।\n4. `1 x v`: `delta = v - value[x]`; HLD সেগমেন্টে `seg_update(pos[x], v)` এবং BIT-তে `add(in[x], delta)`; তারপর `value[x] = v`।\n5. `2 u v`: HLD পথের কোয়েরি। `3 u`: `prefix(out[u]) - prefix(in[u] - 1)`।\n\n```python\n# পূর্ণ কোডে HLD অংশ = আগের সমস্যার মতো; নিচে শাখার অংশটুকু\ntin = [0] * (n + 1); tout = [0] * (n + 1)\ntimer = 0\nstack = [(1, 0)]\nwhile stack:\n    u, index = stack[-1]\n    if index == 0:\n        timer += 1; tin[u] = timer\n    if index < len(adj[u]):\n        v = adj[u][index]\n        stack[-1] = (u, index + 1)\n        if v != parent[u]:\n            stack.append((v, 0))\n    else:\n        tout[u] = timer\n        stack.pop()\n\ndef bit_add(i, x):\n    while i <= n:\n        bit[i] += x; i += i & -i\n\ndef bit_prefix(i):\n    s = 0\n    while i > 0:\n        s += bit[i]; i -= i & -i\n    return s\n\nfor v in range(1, n + 1):\n    bit_add(tin[v], value[v])\n\n# অপারেশন হ্যান্ডলিং\nif op == b'1':\n    x = int(next(it)); v = int(next(it))\n    seg_update(pos[x], v)\n    bit_add(tin[x], v - value[x])\n    value[x] = v\nelif op == b'2':\n    u = int(next(it)); v = int(next(it))\n    out.append(str(path_sum(u, v)))\nelse:\n    u = int(next(it))\n    out.append(str(bit_prefix(tout[u]) - bit_prefix(tin[u] - 1)))\n```\n\n## কমপ্লেক্সিটি\n\nপ্রস্তুতি `O(n)`, প্রতি অপারেশন `O(log^2 n)` (পথ) বা `O(log n)` (শাখা), স্পেস `O(n)`। শাখার জন্য প্রতিটি বার পুরো সাব-ট্রি ঘুরলে `O(n)` হতো — `n = 100000`-এ অসম্ভব।\n\n## সাধারণ ভুল\n\n- `tout`-এ প্রস্থানের সময় না লিখে টাইমার ডাবল করা — শাখার খণ্ড ভুল হলে উত্তর গোলমেলে হয়। এখানে `tin` একবারই বাড়ে, `tout` = শাখার শেষ `tin`।\n- আপডেটে `value[x]` আপডেট করার আগেই `delta` বের করা — `delta = v - value[x]` আগে নিতে হবে, নইলে ডেল্টা `0` হয়ে যায়।\n- HLD সেগমেন্ট ট্রি আর BIT-কে এক অ্যারে ভাবা — দুটোর ইনডেক্স ভিন্ন: `pos[x]` (চেইন ক্রম) বনাম `in[x]` (DFS ক্রম)।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 4000,
    memoryLimitMb: 256,
    tags: ["HLD", "Euler Tour", "Subtree Query"],
    tests: [
      { input: "3 4\n1 2\n1 3\n5 10 20\n3 2\n2 2 3\n1 2 100\n3 1\n", expectedOutput: "10\n35\n125\n", isSample: true },
      { input: "1 3\n5\n3 1\n1 1 7\n3 1\n", expectedOutput: "5\n7\n", isSample: true },
      { input: "4 4\n1 2\n2 3\n2 4\n1 2 3 4\n3 2\n2 3 4\n1 4 40\n3 2\n", expectedOutput: "9\n9\n45\n", isSample: false },
      { input: "2 3\n1 2\n-5 5\n2 1 2\n1 1 5\n2 1 2\n", expectedOutput: "0\n10\n", isSample: false },
      { ...hldSubtreeLarge("binary", 100000, 30000, 10), isSample: false },
      { ...hldSubtreeLarge("chain", 100000, 500, 10), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nadj = [[] for _ in range(n + 1)]\nfor _ in range(n - 1):\n    u = int(next(it)); v = int(next(it))\n    adj[u].append(v); adj[v].append(u)\nvalue = [0] + [int(next(it)) for _ in range(n)]\nparent = [0] * (n + 1); depth = [0] * (n + 1); size = [0] * (n + 1)\nparent[1] = 1\norder = [1]\nfor u in order:\n    for v in adj[u]:\n        if v != parent[u]:\n            parent[v] = u; depth[v] = depth[u] + 1\n            order.append(v)\nfor u in reversed(order):\n    size[u] = 1\n    for v in adj[u]:\n        if v != parent[u]: size[u] += size[v]\nheavy = [0] * (n + 1)\nfor u in order:\n    best = 0\n    for v in adj[u]:\n        if v != parent[u] and (best == 0 or size[v] > size[best]):\n            best = v\n    heavy[u] = best\nhead = [0] * (n + 1); pos = [0] * (n + 1); cur = 1\nfor u in order:\n    if head[u] == 0:\n        x = u\n        while x:\n            head[x] = u; pos[x] = cur; cur += 1\n            x = heavy[x]\nbase = [0] * (n + 1)\nfor v in range(1, n + 1): base[pos[v]] = value[v]\nsize_st = 1\nwhile size_st < n: size_st *= 2\ntree = [0] * (2 * size_st)\nfor i in range(1, n + 1): tree[size_st + i - 1] = base[i]\nfor i in range(size_st - 1, 0, -1): tree[i] = tree[2 * i] + tree[2 * i + 1]\n\ndef seg_update(index, v):\n    node = size_st + index - 1\n    tree[node] = v\n    node //= 2\n    while node:\n        tree[node] = tree[2 * node] + tree[2 * node + 1]\n        node //= 2\n\ndef seg_query(l, r):\n    res = 0\n    left, right = size_st + l - 1, size_st + r\n    while left < right:\n        if left & 1:\n            res += tree[left]; left += 1\n        if right & 1:\n            right -= 1; res += tree[right]\n        left //= 2; right //= 2\n    return res\n\ndef path_sum(u, v):\n    total = 0\n    while head[u] != head[v]:\n        if depth[head[u]] > depth[head[v]]: u, v = v, u\n        total += seg_query(pos[head[v]], pos[v])\n        v = parent[head[v]]\n    if depth[u] > depth[v]: u, v = v, u\n    return total + seg_query(pos[u], pos[v])\n\ntin = [0] * (n + 1); tout = [0] * (n + 1); timer = 0\nstack = [(1, 0)]\nwhile stack:\n    u, index = stack[-1]\n    if index == 0:\n        timer += 1; tin[u] = timer\n    if index < len(adj[u]):\n        v = adj[u][index]\n        stack[-1] = (u, index + 1)\n        if v != parent[u]:\n            stack.append((v, 0))\n    else:\n        tout[u] = timer\n        stack.pop()\nbit = [0] * (n + 2)\n\ndef bit_add(i, x):\n    while i <= n:\n        bit[i] += x; i += i & -i\n\ndef bit_prefix(i):\n    s = 0\n    while i > 0:\n        s += bit[i]; i -= i & -i\n    return s\n\nfor v in range(1, n + 1):\n    bit_add(tin[v], value[v])\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        x = int(next(it)); v = int(next(it))\n        seg_update(pos[x], v)\n        bit_add(tin[x], v - value[x])\n        value[x] = v\n    elif op == b'2':\n        u = int(next(it)); v = int(next(it))\n        out.append(str(path_sum(u, v)))\n    else:\n        u = int(next(it))\n        out.append(str(bit_prefix(tout[u]) - bit_prefix(tin[u] - 1)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-hld-x1",
    title: "Nodes on the Path",
    statement:
      "ক্যাম্পাস ম্যাপে দুই ল্যাবের মধ্যে পথে মোট **কয়টা নোড** পড়ে (দুই প্রান্তসহ)? নোডের কোনো মান নেই, শুধু গাছের কাঠামো দেওয়া থাকবে।\n\n`q`টি প্রশ্নে `u v` — পথের নোড সংখ্যা প্রিন্ট করো।\n\nউদাহরণ: গাছ `1-2, 1-3` — `2` থেকে `3`: `2 → 1 → 3`, উত্তর `3`; `2` থেকে `2`: `1`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। পরের `n - 1` লাইনে পথ `u v`। তারপর `q` লাইনে প্রশ্ন `u v`।",
    outputFormat: "`q` লাইনে উত্তর — পথের নোড সংখ্যা।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 100000`\n`1 <= u, v <= n`\nরুট ১ নম্বর",
    editorial:
      "## ধারণা\n\nপথের নোড সংখ্যা = পথের ধাপ সংখ্যা + ১। ধাপ সংখ্যা বের করা যায় দূরত্ব দিয়ে: `dist(u, v) = depth[u] + depth[v] - 2 * depth[LCA(u, v)]`। তাই LCA বের করে এই সূত্রে ১ যোগ করলেই উত্তর — এটাই HLD ছাড়াই চলে, কারণ এখানে কোনো মান জড়িত নয়। Binary lifting দিয়ে প্রতি প্রশ্নে `O(log n)` খরচ হয়।\n\n## ধাপে ধাপে\n\n1. রুট ১ থেকে `parent`, `depth` বানাও।\n2. `up[k][v]` টেবিল তৈরি করো (`2^k` ধাপ উপরে)।\n3. প্রতিটি প্রশ্নে গভীরতা মেলিয়ে দুটোকে একসাথে উপরে তুলে LCA বের করো।\n4. `depth[u] + depth[v] - 2 * depth[w] + 1` প্রিন্ট করো।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nadj = [[] for _ in range(n + 1)]\nfor _ in range(n - 1):\n    u = int(next(it)); v = int(next(it))\n    adj[u].append(v); adj[v].append(u)\nparent = [0] * (n + 1); depth = [0] * (n + 1)\nparent[1] = 1\norder = [1]\nfor u in order:\n    for v in adj[u]:\n        if v != parent[u]:\n            parent[v] = u; depth[v] = depth[u] + 1\n            order.append(v)\nLOG = (n).bit_length()\nup = [parent[:]]\nfor k in range(1, LOG):\n    prev = up[-1]\n    up.append([prev[prev[v]] for v in range(n + 1)])\n\ndef lca(u, v):\n    if depth[u] < depth[v]: u, v = v, u\n    diff = depth[u] - depth[v]\n    bit = 0\n    while diff:\n        if diff & 1: u = up[bit][u]\n        diff >>= 1; bit += 1\n    if u == v: return u\n    for k in range(LOG - 1, -1, -1):\n        if up[k][u] != up[k][v]:\n            u = up[k][u]; v = up[k][v]\n    return parent[u]\n\nout = []\nfor _ in range(q):\n    u = int(next(it)); v = int(next(it))\n    w = lca(u, v)\n    out.append(str(depth[u] + depth[v] - 2 * depth[w] + 1))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n## কমপ্লেক্সিটি\n\nপ্রস্তুতি `O(n log n)`, প্রতি প্রশ্ন `O(log n)`, স্পেস `O(n log n)`। পথ সরাসরি ঘুরলে শিকল গাছে `O(n)` প্রতি প্রশ্নে — `q = 100000`-এ চলবে না।\n\n## সাধারণ ভুল\n\n- `+ 1` ভুলে ফেলা — দূরত্ব মানে ধাপ সংখ্যা, নোড সংখ্যা নয়।\n- `u == v`-এ আলাদা কিছু করার দরকার নেই — সূত্র নিজেই `1` দেয়।\n- পুরো পথের নোড সংগ্রহ করে `len()` করা — অপ্রয়োজনীয় `O(depth)` এবং মেমরি।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Trees", "LCA", "Distance"],
    tests: [
      { input: "3 3\n1 2\n1 3\n2 3\n2 2\n1 1\n", expectedOutput: "3\n1\n1\n", isSample: true },
      { input: "1 2\n1 1\n1 1\n", expectedOutput: "1\n1\n", isSample: true },
      { input: "5 2\n1 2\n2 3\n3 4\n4 5\n1 5\n3 5\n", expectedOutput: "5\n3\n", isSample: false },
      { input: "4 2\n1 2\n1 3\n1 4\n3 4\n4 2\n", expectedOutput: "3\n3\n", isSample: false },
      { ...hldCountLarge("binary", 100000, 20000), isSample: false },
      { ...hldCountLarge("chain", 100000, 500), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nadj = [[] for _ in range(n + 1)]\nfor _ in range(n - 1):\n    u = int(next(it)); v = int(next(it))\n    adj[u].append(v); adj[v].append(u)\nparent = [0] * (n + 1); depth = [0] * (n + 1)\nparent[1] = 1\norder = [1]\nfor u in order:\n    for v in adj[u]:\n        if v != parent[u]:\n            parent[v] = u; depth[v] = depth[u] + 1\n            order.append(v)\nLOG = (n).bit_length()\nup = [parent[:]]\nfor k in range(1, LOG):\n    prev = up[-1]\n    up.append([prev[prev[v]] for v in range(n + 1)])\n\ndef lca(u, v):\n    if depth[u] < depth[v]: u, v = v, u\n    diff = depth[u] - depth[v]\n    bit = 0\n    while diff:\n        if diff & 1: u = up[bit][u]\n        diff >>= 1; bit += 1\n    if u == v:\n        return u\n    for k in range(LOG - 1, -1, -1):\n        if up[k][u] != up[k][v]:\n            u = up[k][u]; v = up[k][v]\n    return parent[u]\n\nout = []\nfor _ in range(q):\n    u = int(next(it)); v = int(next(it))\n    w = lca(u, v)\n    out.append(str(depth[u] + depth[v] - 2 * depth[w] + 1))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-hld-x2",
    title: "Path Add, Point Query",
    statement:
      "বিদ্যুৎ বিভাগ দুইটা নোডের মধ্যে পথ ধরে ভোল্টেজ সমন্বয় করে, আর শেষে দেখতে চায় নির্দিষ্ট একটা নোডে মোট কত জমেছে। শুরুতে সব নোডের মান `0`। দুই ধরনের অপারেশন:\n\n- `1 u v x` — `u` থেকে `v` পথের (দুই প্রান্তসহ) প্রতিটি নোডে `x` যোগ করো।\n- `2 i` — নোড `i`-এর বর্তমান মান প্রিন্ট করো।\n\nশুধু `2` অপারেশনের উত্তর দাও।\n\nউদাহরণ: গাছ `1-2, 2-3`; `1 1 3 5` এরপর `2 2` → `5`। এরপর `1 1 2 1` দিলেও `2 3` → `5`, কারণ `3` ওই পথে নেই।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। পরের `n - 1` লাইনে পথ `u v`। তারপর `q` লাইনে অপারেশন — `1 u v x` অথবা `2 i`।",
    outputFormat: "প্রতিটি `2` অপারেশনের জন্য একটি করে লাইনে নোডের মান।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 100000`\n`-1000 <= x <= 1000`\nশুরুতে সব নোডের মান `0`; মান ৬৪-বিট সংখ্যার মধ্যে",
    editorial:
      "## ধারণা\n\nপথে যোগ + পয়েন্ট প্রশ্নের জন্য চতুর কৌশল — 'পূর্বসূরিতে যোগ' আর 'শাখার যোগফল' একই জিনিসের দুই পিঠ। ধরো `addAncestors(x, c)` নামে একটা কল আছে, যা `x` থেকে রুট পর্যন্ত পথের প্রতিটি ঘরে `c` যোগ করে। এটা সরাসরি Euler ক্রমে রেঞ্জ যোগ করে হয় না — বরং উল্টো করো: `in[x]` ঘরে একটা বিন্দু-যোগ বসাও, আর নোড `z`-এর মান পড়ার সময় তার **শাখার যোগফল** নাও। কারণ `z` যদি এবং শুধুমাত্র তখনই `x`-এর পূর্বসূরি হয় যখন `x` পড়ে `z`-এর শাখায় — অর্থাৎ বিন্দু-যোগ (পয়েন্ট প্রশ্ন) + শাখার যোগফল = পূর্বসূরিতে যোগ। এবার পথ `u-v` সাজানো যায়: `addAncestors(u, x)`, `addAncestors(v, x)`, `addAncestors(lca, -x)` এবং এবং LCA-র বাবা থাকলে `addAncestors(parent[lca], -x)` — LCA-র উপরের অংশ দুইবার ধরা পড়ছিল, বিয়োগে সেটা কাটা যায়; পথের প্রতিটি ঘরে ঠিক একবার `x` থাকে। প্রতিটি অপারেশন `O(log n)`।\n\n## ধাপে ধাপে\n\n1. রুট ১ থেকে `parent`, `depth` এবং `up` টেবিল বানাও (LCA-এর জন্য)।\n2. স্ট্যাক-DFS দিয়ে `in`/`out` সময় বের করো; একটা BIT রাখো — পয়েন্ট যোগ ও প্রিফিক্স সাম দুটোই করবে।\n3. অপারেশন `1 u v x`: `w = lca(u, v)`; চারটি পয়েন্ট যোগ করো — `BIT.add(in[u], x)`, `BIT.add(in[v], x)`, `BIT.add(in[w], -x)` এবং বাবা থাকলে `BIT.add(in[parent[w]], -x)`।\n4. অপারেশন `2 i`: শাখার যোগফল `BIT.prefix(out[i]) - BIT.prefix(in[i] - 1)` প্রিন্ট করো — এখানেই পূর্বসূরি হওয়া সব বিন্দু জড়িয়ে আসে।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nadj = [[] for _ in range(n + 1)]\nfor _ in range(n - 1):\n    u = int(next(it)); v = int(next(it))\n    adj[u].append(v); adj[v].append(u)\nparent = [0] * (n + 1); depth = [0] * (n + 1)\nparent[1] = 1\norder = [1]\nfor u in order:\n    for v in adj[u]:\n        if v != parent[u]:\n            parent[v] = u; depth[v] = depth[u] + 1\n            order.append(v)\nLOG = (n).bit_length()\nup = [parent[:]]\nfor k in range(1, LOG):\n    prev = up[-1]\n    up.append([prev[prev[v]] for v in range(n + 1)])\n\ndef lca(u, v):\n    if depth[u] < depth[v]: u, v = v, u\n    diff = depth[u] - depth[v]\n    bit = 0\n    while diff:\n        if diff & 1: u = up[bit][u]\n        diff >>= 1; bit += 1\n    if u == v: return u\n    for k in range(LOG - 1, -1, -1):\n        if up[k][u] != up[k][v]:\n            u = up[k][u]; v = up[k][v]\n    return parent[u]\n\ntin = [0] * (n + 1); tout = [0] * (n + 1); timer = 0\nstack = [(1, 0)]\nwhile stack:\n    u, index = stack[-1]\n    if index == 0:\n        timer += 1; tin[u] = timer\n    if index < len(adj[u]):\n        v = adj[u][index]\n        stack[-1] = (u, index + 1)\n        if v != parent[u]:\n            stack.append((v, 0))\n    else:\n        tout[u] = timer\n        stack.pop()\n\ntree = [0] * (n + 2)\n\ndef bit_add(i, x):\n    while i <= n:\n        tree[i] += x; i += i & -i\n\ndef bit_prefix(i):\n    s = 0\n    while i > 0:\n        s += tree[i]; i -= i & -i\n    return s\n\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        u = int(next(it)); v = int(next(it)); x = int(next(it))\n        w = lca(u, v)\n        bit_add(tin[u], x); bit_add(tin[v], x); bit_add(tin[w], -x)\n        if parent[w] != w:\n            bit_add(tin[parent[w]], -x)\n    else:\n        i = int(next(it))\n        out.append(str(bit_prefix(tout[i]) - bit_prefix(tin[i] - 1)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n## কমপ্লেক্সিটি\n\nপ্রতি অপারেশন `O(log n)` (LCA + কয়েকটা BIT ধাপ), স্পেস `O(n)`। HLD + lazy সেগমেন্ট ট্রি দিয়েও একই সময়ে হয় — এখানকার কৌশলে আলাদা চেইন-ডিকম্পোজিশন লাগে না, তবে সূত্রটা মনে রাখা একটু অভ্যাস চায়।\n\n## সাধারণ ভুল\n\n- প্রশ্নে সরাসরি `bit_prefix(tin[i])` পড়ে ফেলা — ভুল; এখানে প্রশ্নটাই শাখার যোগফল `bit_prefix(tout[i]) - bit_prefix(tin[i] - 1)`।\n- দিক গুলিয়ে ফেলা: যোগটা বিন্দু (`in`-এ), প্রশ্নটা রেঞ্জ (শাখা); উল্টো করলে ছোট ছোট ভুল কপি হতে থাকে।\n- `bit_add(tin[parent[w]], -x)` বাদ পড়লে LCA-র উপরের অংশ দুইবার যোগ হয়, আর পথের বাইরেও কিছু ঘরে ভুল মান জমে।\n- রুটের বাবা নিজেই (`parent[1] = 1`) — সেই কল বাদ দিতে হয়; নাহলে পুরো গাছের ঘরে ভুল বিয়োগ হয়।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Trees", "Path Update", "Euler Tour", "BIT"],
    tests: [
      { input: "3 4\n1 2\n2 3\n1 1 3 5\n2 2\n1 1 2 1\n2 3\n", expectedOutput: "5\n5\n", isSample: true },
      { input: "1 3\n2 1\n1 1 1 7\n2 1\n", expectedOutput: "0\n7\n", isSample: true },
      { input: "4 6\n1 2\n1 3\n1 4\n1 2 3 10\n2 3\n2 4\n1 3 4 -4\n2 3\n2 4\n", expectedOutput: "10\n0\n6\n-4\n", isSample: false },
      { input: "5 5\n1 2\n2 3\n3 4\n4 5\n1 1 5 3\n2 1\n2 5\n1 5 5 2\n2 5\n", expectedOutput: "3\n3\n5\n", isSample: false },
      { ...hldPathAddLarge("binary", 100000, 100000, 50), isSample: false },
      { ...hldPathAddLarge("chain", 100000, 500, 5), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nadj = [[] for _ in range(n + 1)]\nfor _ in range(n - 1):\n    u = int(next(it)); v = int(next(it))\n    adj[u].append(v); adj[v].append(u)\nparent = [0] * (n + 1); depth = [0] * (n + 1)\nparent[1] = 1\norder = [1]\nfor u in order:\n    for v in adj[u]:\n        if v != parent[u]:\n            parent[v] = u; depth[v] = depth[u] + 1\n            order.append(v)\nLOG = (n).bit_length()\nup = [parent[:]]\nfor k in range(1, LOG):\n    prev = up[-1]\n    up.append([prev[prev[v]] for v in range(n + 1)])\n\ndef lca(u, v):\n    if depth[u] < depth[v]: u, v = v, u\n    diff = depth[u] - depth[v]\n    bit = 0\n    while diff:\n        if diff & 1: u = up[bit][u]\n        diff >>= 1; bit += 1\n    if u == v:\n        return u\n    for k in range(LOG - 1, -1, -1):\n        if up[k][u] != up[k][v]:\n            u = up[k][u]; v = up[k][v]\n    return parent[u]\n\ntin = [0] * (n + 1); tout = [0] * (n + 1); timer = 0\nstack = [(1, 0)]\nwhile stack:\n    u, index = stack[-1]\n    if index == 0:\n        timer += 1; tin[u] = timer\n    if index < len(adj[u]):\n        v = adj[u][index]\n        stack[-1] = (u, index + 1)\n        if v != parent[u]:\n            stack.append((v, 0))\n    else:\n        tout[u] = timer\n        stack.pop()\n\ntree = [0] * (n + 2)\n\ndef bit_add(i, x):\n    while i <= n:\n        tree[i] += x; i += i & -i\n\ndef bit_prefix(i):\n    s = 0\n    while i > 0:\n        s += tree[i]; i -= i & -i\n    return s\n\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        u = int(next(it)); v = int(next(it)); x = int(next(it))\n        w = lca(u, v)\n        bit_add(tin[u], x); bit_add(tin[v], x); bit_add(tin[w], -x)\n        if parent[w] != w:\n            bit_add(tin[parent[w]], -x)\n    else:\n        i = int(next(it))\n        out.append(str(bit_prefix(tout[i]) - bit_prefix(tin[i] - 1)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
];
