import type { SeedProblem } from "../../seed-problems";
import { newlineOutput } from "../generated-tests";
import { buildTree } from "./sparse-table-lca-problems";
import { pathSumNaive } from "./hld-problems";

function cp1Large(n: number, q: number, every: number): { input: string; expectedOutput: string } {
  const diff = new Array<number>(n + 2).fill(0);
  const values = new Array<number>(n + 1).fill(0);
  const prefix = new Array<number>(n + 1).fill(0);
  const ops: string[] = [], answers: string[] = [];
  for (let k = 0; k < q; k += 1) {
    const kind = k % every === 0 ? (Math.floor(k / every) % 2 === 0 ? 3 : 2) : 1;
    if (kind === 1) {
      const l = ((k * 37) % n) + 1;
      const r = Math.min(n, l + ((k * 13) % Math.max(1, Math.floor(n / 4))));
      const x = ((k * 104729) % 2001) - 1000;
      ops.push(`1 ${l} ${r} ${x}`);
      diff[l] += x;
      diff[r + 1] -= x;
    } else if (kind === 2) {
      const i = ((k * 7919) % n) + 1;
      ops.push(`2 ${i}`);
      let running = 0;
      for (let j = 1; j <= n; j += 1) {
        running += diff[j];
        values[j] = running;
      }
      answers.push(String(values[i]));
    } else {
      const l = ((k * 37) % n) + 1;
      const r = Math.min(n, l + ((k * 13) % Math.max(1, Math.floor(n / 4))));
      ops.push(`3 ${l} ${r}`);
      let running = 0;
      prefix[0] = 0;
      for (let j = 1; j <= n; j += 1) {
        running += diff[j];
        prefix[j] = prefix[j - 1] + running;
      }
      answers.push(String(prefix[r] - prefix[l - 1]));
    }
  }
  return { input: `${n} ${q}\n${ops.join("\n")}\n`, expectedOutput: newlineOutput(answers) };
}

function cp2Large(n: number, q: number): { input: string; expectedOutput: string } {
  const names: string[] = [];
  for (let i = 0; i < n; i += 1) names.push(`w${i % 400}`);
  const queries: string[] = [];
  for (let k = 0; k < q; k += 1) {
    const mode = k % 4;
    if (mode === 0) queries.push(`w${k % 400}`);
    else if (mode === 1) queries.push("w");
    else if (mode === 2) queries.push(`w${(k * 7) % 400}`);
    else queries.push("z");
  }
  const answers = queries.map((typed) => {
    let exact = 0, prefix = 0;
    for (const name of names) {
      if (name === typed) exact += 1;
      if (name.startsWith(typed)) prefix += 1;
    }
    return `${exact} ${prefix}`;
  });
  const input = `${n} ${q}\n${names.join("\n")}\n${queries.join("\n")}\n`;
  return { input, expectedOutput: newlineOutput(answers) };
}

function cp3Large(kind: "chain" | "binary", n: number, q: number): {
  input: string;
  expectedOutput: string;
} {
  const { edges, oracle } = buildTree(n, kind);
  const values = new Array<number>(n + 1).fill(0);
  for (let i = 1; i <= n; i += 1) values[i] = ((i * 7919) % 2001) - 1000;
  const queries: number[][] = [];
  for (let k = 0; k < q; k += 1) queries.push([((k * 7919) % n) + 1, ((k * 104729) % n) + 1]);
  const answers = queries.map(([u, v]) => String(pathSumNaive(oracle, values, u, v)));
  const edgeLines = edges.map((edge) => edge.join(" ")).join("\n");
  const queryLines = queries.map((query) => query.join(" ")).join("\n");
  const input = `${n} ${q}\n${edgeLines}\n${values.slice(1).join(" ")}\n${queryLines}\n`;
  return { input, expectedOutput: newlineOutput(answers) };
}

export const MODULE6_CHECKPOINT_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m6-checkpoint-1",
    title: "Library Reading Ledger",
    statement:
      "প্রাইমএশিয়া লাইব্রেরির পড়ার হিসাব শুরুতে সম্পূর্ণ শূন্য। তিন ধরনের অপারেশন দেওয়া থাকবে:\n\n- `1 l r x` — `l` থেকে `r` নম্বর ঘরের (দুই প্রান্তসহ) সবার পড়ার সময়ে `x` মিনিট যোগ করো।\n- `2 i` — `i` নম্বর ঘরের বর্তমান মান প্রিন্ট করো।\n- `3 l r` — `l` থেকে `r` ঘরের মোট যোগফল প্রিন্ট করো।\n\nশুধু `2` ও `3` অপারেশনের উত্তর দাও।\n\nউদাহরণ: `1 1 3 10` এরপর `2 2` → `10`; `1 2 5 5` এরপর `3 1 5` → `50`।",
    inputFormat: "প্রথম লাইনে `n` ও `q`। পরের `q` লাইনে অপারেশন — `1 l r x`, `2 i` বা `3 l r`।",
    outputFormat: "প্রতিটি `2` ও `3` অপারেশনের জন্য একটি করে লাইনে উত্তর।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 20000`\n`1 <= l <= r <= n`, `1 <= i <= n`\n`-1000 <= x <= 1000`\nশুরুতে সব ঘরে মান `0`; উত্তর ৬৪-বিট সংখ্যার মধ্যে",
    editorial:
      "## ধারণা\n\nএটা মডিউলের দুটো কৌশলের মিশ্রণ। রেঞ্জ যোগের জন্য difference array: `d[l] += x`, `d[r + 1] -= x` — এতে আপডেট হয় `O(1)`। কিন্তু প্রশ্ন দুই ধরনের: পয়েন্ট প্রশ্নে `i` পর্যন্ত `d`-এর প্রিফিক্স সাম চাই (ঘরের মান), আর রেঞ্জ সামে প্রিফিক্স সামের প্রিফিক্স চাই। দুটোই ফেনউইক ট্রি দিয়ে `O(log n)`-এ আসে: একটা BIT-তে `d` রাখলে পয়েন্ট প্রশ্ন হয়ে যায়, আর সূত্র `pref(i) = i * prefixBit1(i) - prefixBit2(i)` দিয়ে দ্বিতীয় প্রিফিক্স-প্রিফিক্সও পাওয়া যায় — `bit2`-তে `d[j] * j` বসিয়ে।\n\n## ধাপে ধাপে\n\n1. `size = n + 1` ধরে দুইটা BIT বানাও (`r + 1` লাগতে পারে)।\n2. `1 l r x`: `add(bit1, l, x)`, `add(bit1, r + 1, -x)`, `add(bit2, l, x * (l - 1))`, `add(bit2, r + 1, -x * r)`।\n3. প্রিফিক্স যোগফল `pref(i) = prefix(bit1, i) * i - prefix(bit2, i)`।\n4. `2 i` → `value(i) = pref(i) - pref(i - 1)`; `3 l r` → `pref(r) - pref(l - 1)`।\n5. প্রতিটি উত্তর আলাদা লাইনে প্রিন্ট করো।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nsize = n + 1\nbit1 = [0] * (size + 1)\nbit2 = [0] * (size + 1)\n\ndef add(bit, index, value):\n    while index <= size:\n        bit[index] += value\n        index += index & -index\n\ndef prefix(bit, index):\n    total = 0\n    while index > 0:\n        total += bit[index]\n        index -= index & -index\n    return total\n\ndef pref(i):\n    return prefix(bit1, i) * i - prefix(bit2, i)\n\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        l = int(next(it)); r = int(next(it)); x = int(next(it))\n        add(bit1, l, x); add(bit1, r + 1, -x)\n        add(bit2, l, x * (l - 1)); add(bit2, r + 1, -x * r)\n    elif op == b'2':\n        i = int(next(it))\n        out.append(str(pref(i) - pref(i - 1)))\n    else:\n        l = int(next(it)); r = int(next(it))\n        out.append(str(pref(r) - pref(l - 1)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n## কমপ্লেক্সিটি\n\nপ্রতি অপারেশন `O(log n)` (সর্বোচ্চ ৪টা BIT ধাপ), স্পেস `O(n)`। পুরো অ্যারে প্রতিবার ঘুরলে `O(n * q)` — বড় ইনপুটে অচল।\n\n## সাধারণ ভুল\n\n- `bit2`-এর সূত্র ভুল হলে (`x * (l - 1)` এবং `-x * r`) সব রেঞ্জ-যোগফলে ভুল জমা হয়।\n- পয়েন্ট প্রশ্নে `pref(i)` একা নিয়ে ফেলা — সেটা প্রিফিক্স যোগফল, ঘরের মান নয়; ঘরের মান `pref(i) - pref(i - 1)`।\n- `l = 1` হলে `pref(l - 1) = pref(0) = 0` — `prefix(0)` লুপে ঢোকেই না, তাই কোণার কেস নিজে থেকেই ঠিক থাকে।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Fenwick Tree", "Range Update", "Prefix Sum"],
    tests: [
      { input: "5 5\n1 1 3 10\n2 2\n1 2 5 5\n3 1 5\n2 5\n", expectedOutput: "10\n50\n5\n", isSample: true },
      { input: "3 3\n2 2\n1 1 3 4\n3 1 3\n", expectedOutput: "0\n12\n", isSample: true },
      { input: "4 4\n1 1 4 3\n2 1\n3 2 3\n1 2 2 -3\n", expectedOutput: "3\n6\n", isSample: false },
      { input: "2 3\n1 1 1 7\n3 1 2\n1 2 2 -7\n", expectedOutput: "7\n", isSample: false },
      { ...cp1Large(100000, 20000, 40), isSample: false },
      { ...cp1Large(2000, 20000, 4), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nsize = n + 1\nbit1 = [0] * (size + 1)\nbit2 = [0] * (size + 1)\n\ndef add(bit, index, value):\n    while index <= size:\n        bit[index] += value\n        index += index & -index\n\ndef prefix(bit, index):\n    total = 0\n    while index > 0:\n        total += bit[index]\n        index -= index & -index\n    return total\n\ndef pref(i):\n    return prefix(bit1, i) * i - prefix(bit2, i)\n\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        l = int(next(it)); r = int(next(it)); x = int(next(it))\n        add(bit1, l, x); add(bit1, r + 1, -x)\n        add(bit2, l, x * (l - 1)); add(bit2, r + 1, -x * r)\n    elif op == b'2':\n        i = int(next(it))\n        out.append(str(pref(i) - pref(i - 1)))\n    else:\n        l = int(next(it)); r = int(next(it))\n        out.append(str(pref(r) - pref(l - 1)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-checkpoint-2",
    title: "Exact and Prefix Matches",
    statement:
      "ক্যাম্পাস পোর্টালে নাম লেখার সময় দুই ধরনের হিসাব দরকার: টাইপ করা শব্দটা **ঠিকমতো** তালিকায় আছে কতবার, আর তাতে শুরু হওয়া নাম কতগুলো।\n\nপ্রথমে `n`টি নাম, তারপর `q`টি টাইপ করা স্ট্রিং দেওয়া থাকবে। প্রতিটি স্ট্রিংয়ের জন্য একটাই লাইনে দুটি সংখ্যা প্রিন্ট করো — `ঠিক মিল সংখ্যা প্রিফিক্স মিল সংখ্যা` (স্পেস দিয়ে আলাদা)। স্ট্রিংটি নিজে নাম-তালিকায় থাকলে সেটাও প্রিফিক্স হিসেবে গণনা করতে হবে।\n\nউদাহরণ: নাম `cat, car, cap, car` এবং টাইপ `ca` → ঠিক মিল `0`, প্রিফিক্স মিল `4` — উত্তর `0 4`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। পরের `n` লাইনে এক একটি নাম। তারপর `q` লাইনে এক একটি টাইপ করা স্ট্রিং।",
    outputFormat:
      "`q` লাইনে উত্তর — প্রতিটিতে `ঠিক মিল প্রিফিক্স মিল`, স্পেস দিয়ে আলাদা।",
    constraints:
      "`1 <= n, q <= 5000`\nনাম ও স্ট্রিংয়ের দৈর্ঘ্য `1 <= L <= 20`\nশুধুমাত্র ছোট ইংরেজি হরফ (`a-z`)",
    editorial:
      "## ধারণা\n\nএটা ট্রাই-ধারণার সরাসরি প্রয়োগ, দুইটা কাউন্টার নিয়ে। নামগুলো একবার পড়ে: প্রতিটি নামের জন্য তার **প্রতিটি prefix**-এর কাউন্টার এক বাড়াও (এটাই গাছের পথের কাউন্টার), আর আলাদা করে পুরো নামের এক্সাক্ট কাউন্টার বাড়াও। প্রশ্নের স্ট্রিং প্রিফিক্স হিসেবে ম্যাপে খুঁজে প্রথম সংখ্যাটা, আর এক্সাক্ট ম্যাপে দ্বিতীয়টা নাও — না থাকলে `0`।\n\n## ধাপে ধাপে\n\n1. দুইটা কাউন্টার ম্যাপ নাও: `exact` (পুরো নাম) আর `prefix` (প্রতিটি শুরুর অংশ)।\n2. প্রতিটি নামের জন্য `j = 1..len` ধরে `prefix[name[:j]] += 1` এবং `exact[name] += 1`।\n3. প্রতিটি প্রশ্নে `exact.get(s, 0)` আর `prefix.get(s, 0)` — দুটো স্পেস দিয়ে এক লাইনে।\n4. নাম না থাকলে দুটোই `0` — ম্যাপ থেকে সরাসরি ডিফল্ট নাও।\n\n```python\nimport sys\nfrom collections import defaultdict\n\ndata = sys.stdin.read().split()\nn = int(data[0]); q = int(data[1])\nnames = data[2:2 + n]\nqueries = data[2 + n:2 + n + q]\nexact = defaultdict(int)\nprefix = defaultdict(int)\nfor name in names:\n    exact[name] += 1\n    for j in range(1, len(name) + 1):\n        prefix[name[:j]] += 1\nout = []\nfor typed in queries:\n    out.append(str(exact.get(typed, 0)) + ' ' + str(prefix.get(typed, 0)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n## কমপ্লেক্সিটি\n\nপ্রস্তুতি `O(মোট অক্ষর)`, প্রতি প্রশ্ন `O(লম্বাই)`, স্পেসও `O(মোট অক্ষর)`। সরাসরি প্রতিটি নাম ঘুরে তুলনা করলে `O(n * q)` — `n = q = 5000`-এ ২ কোটি তুলনা, ধীর ও অপ্রয়োজনীয়।\n\n## সাধারণ ভুল\n\n- দুই সংখ্যার ক্রম উল্টে দেওয়া — প্রশ্ন প্রথমে ঠিক মিল, পরে প্রিফিক্স মিল চায়।\n- শুধু পুরো নামের কাউন্টার রেখে prefix কাউন্টার বাদ দেওয়া — অথচ গুরুত্বপূর্ণ অংশটাই প্রিফিক্স (শব্দের নিচের সব অংশ, নিজেসহ)।\n- প্রতিটি প্রশ্নে পুরো তালিকা ঘুরে `startswith` মেলানো — কাজ করলেও মোট সময় অহেতুক বেড়ে যায়।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Trie", "Strings", "Hash Map"],
    tests: [
      { input: "4 3\ncat\ncar\ncap\ncar\ncar\nca\nxyz\n", expectedOutput: "2 2\n0 4\n0 0\n", isSample: true },
      { input: "1 2\ncode\ncode\ncod\n", expectedOutput: "1 1\n0 1\n", isSample: true },
      { input: "3 2\na\nab\nabc\nab\na\n", expectedOutput: "1 2\n1 3\n", isSample: false },
      { input: "2 1\nx\ny\nx\n", expectedOutput: "1 1\n", isSample: false },
      { ...cp2Large(5000, 5000), isSample: false },
      { ...cp2Large(1000, 5000), isSample: false },
    ],
    referencePython:
      "import sys\nfrom collections import defaultdict\n\ndata = sys.stdin.read().split()\nn = int(data[0]); q = int(data[1])\nnames = data[2:2 + n]\nqueries = data[2 + n:2 + n + q]\nexact = defaultdict(int)\nprefix = defaultdict(int)\nfor name in names:\n    exact[name] += 1\n    for j in range(1, len(name) + 1):\n        prefix[name[:j]] += 1\nout = []\nfor typed in queries:\n    out.append(str(exact.get(typed, 0)) + ' ' + str(prefix.get(typed, 0)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-checkpoint-3",
    title: "Campus Path Total",
    statement:
      "ক্যাম্পাসের রাস্তার গাছে প্রতিটি নোডে আজকের খরচ বসানো আছে; গাছ কোনো পরিবর্তন ঘটবে না। `q`টি প্রশ্নে `u v` — `u` থেকে `v` পথের (দুই প্রান্তসহ) সব নোডের খরচের যোগফল প্রিন্ট করো।\n\nবড় গাছ বলে HLD বা binary lifting-এর মতো দ্রুত কৌশল লাগবে — প্রতিটি প্রশ্নে পুরো পথ ঘুরে গেলে সময় শেষ।\n\nউদাহরণ: গাছ `1-2, 1-3, 2-4, 2-5`, খরচ `10 20 30 40 50` — `4` থেকে `5`: `40 + 20 + 50 = 110`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। পরের `n - 1` লাইনে পথ `u v`। পরের লাইনে `n`টি নোডের খরচ। তারপর `q` লাইনে প্রশ্ন `u v`।",
    outputFormat: "`q` লাইনে উত্তর — প্রতিটি পথের যোগফল।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 100000`\n`-1000 <= cost <= 1000`\nরুট ১ নম্বর; উত্তর ৬৪-বিট সংখ্যার মধ্যে",
    editorial:
      "## ধারণা\n\nস্ট্যাটিক গাছে পথের যোগফলের সুন্দর সূত্র: প্রতিটি নোডের জন্য রুট থেকে সেই নোড পর্যন্ত যোগফল `toRoot[v]` আগেই গণনা করে রাখো। তখন পথ `u-v`-এর যোগফল হয় `toRoot[u] + toRoot[v] - 2 * toRoot[LCA(u, v)] + cost[LCA(u, v)]` — কারণ LCA পর্যন্ত অংশটা দুইবার যোগ হয়েছে, বিয়োগে সেটা পুরোপুরি কাটা যায় — তাই LCA-র নিজের মানটা শেষে একবার ফিরিয়ে দিতে হয়। LCA binary lifting দিয়ে `O(log n)`-এ আসে, তাই প্রতি প্রশ্ন `O(log n)`।\n\n## ধাপে ধাপে\n\n1. রুট ১ থেকে BFS/DFS করে `parent`, `depth` এবং `toRoot` বানাও — `toRoot[child] = toRoot[parent] + cost[child]`।\n2. `up[k][v]` টেবিল তৈরি করো (`2^k` ধাপ উপরে)।\n3. প্রতিটি প্রশ্নে গভীরতা মেলিয়ে দুটোকে একসাথে উপরে তুলে LCA বের করো।\n4. সূত্র অনুযায়ী `toRoot[u] + toRoot[v] - 2 * toRoot[w] + cost[w]` প্রিন্ট করো।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nadj = [[] for _ in range(n + 1)]\nfor _ in range(n - 1):\n    u = int(next(it)); v = int(next(it))\n    adj[u].append(v); adj[v].append(u)\ncost = [0] + [int(next(it)) for _ in range(n)]\nparent = [0] * (n + 1); depth = [0] * (n + 1); to_root = [0] * (n + 1)\nparent[1] = 1\nto_root[1] = cost[1]\norder = [1]\nfor u in order:\n    for v in adj[u]:\n        if v != parent[u]:\n            parent[v] = u; depth[v] = depth[u] + 1\n            to_root[v] = to_root[u] + cost[v]\n            order.append(v)\nLOG = (n).bit_length()\nup = [parent[:]]\nfor k in range(1, LOG):\n    prev = up[-1]\n    up.append([prev[prev[v]] for v in range(n + 1)])\n\ndef lca(u, v):\n    if depth[u] < depth[v]: u, v = v, u\n    diff = depth[u] - depth[v]\n    bit = 0\n    while diff:\n        if diff & 1: u = up[bit][u]\n        diff >>= 1; bit += 1\n    if u == v:\n        return u\n    for k in range(LOG - 1, -1, -1):\n        if up[k][u] != up[k][v]:\n            u = up[k][u]; v = up[k][v]\n    return parent[u]\n\nout = []\nfor _ in range(q):\n    u = int(next(it)); v = int(next(it))\n    w = lca(u, v)\n    out.append(str(to_root[u] + to_root[v] - 2 * to_root[w] + cost[w]))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n## কমপ্লেক্সিটি\n\nপ্রস্তুতি `O(n log n)`, প্রতি প্রশ্ন `O(log n)`, স্পেস `O(n log n)`। প্রতিটি প্রশ্নে LCA ছাড়া সরাসরি পথ ঘুরলে শিকল গাছে `O(n * q)` — ১০ কোটি ধাপেরও বেশি, সময় শেষ।\n\n## সাধারণ ভুল\n\n- `+ cost[w]` বাদ পড়ে গেলে LCA-র মান হারিয়ে যায় — `toRoot` সূত্রে দুইবার বিয়োগের সময় LCA-র মান পুরোপুরি কাটা পড়ে, তাই একবার যোগ ফিরিয়ে দিতে হয়।\n- `toRoot[1]` শূন্য ধরে ফেলা — রুটের নিজের খরচও যোগ করতে হবে (`to_root[1] = cost[1]`)।\n- গভীরতা মানা না করে সরাসরি একসাথে উপরে ওঠা — ভুল LCA, ফলে পুরো সূত্র ভেঙে যায়।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Trees", "LCA", "Path Query", "Prefix Sum"],
    tests: [
      { input: "5 3\n1 2\n1 3\n2 4\n2 5\n10 20 30 40 50\n4 5\n1 1\n4 3\n", expectedOutput: "110\n10\n100\n", isSample: true },
      { input: "1 2\n5\n1 1\n1 1\n", expectedOutput: "5\n5\n", isSample: true },
      { input: "3 2\n1 2\n2 3\n1 2 3\n1 3\n2 3\n", expectedOutput: "6\n5\n", isSample: false },
      { input: "4 2\n1 2\n1 3\n1 4\n-1 -2 -3 -4\n2 4\n1 4\n", expectedOutput: "-7\n-5\n", isSample: false },
      { ...cp3Large("binary", 100000, 5000), isSample: false },
      { ...cp3Large("chain", 100000, 300), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nadj = [[] for _ in range(n + 1)]\nfor _ in range(n - 1):\n    u = int(next(it)); v = int(next(it))\n    adj[u].append(v); adj[v].append(u)\ncost = [0] + [int(next(it)) for _ in range(n)]\nparent = [0] * (n + 1); depth = [0] * (n + 1); to_root = [0] * (n + 1)\nparent[1] = 1\nto_root[1] = cost[1]\norder = [1]\nfor u in order:\n    for v in adj[u]:\n        if v != parent[u]:\n            parent[v] = u; depth[v] = depth[u] + 1\n            to_root[v] = to_root[u] + cost[v]\n            order.append(v)\nLOG = (n).bit_length()\nup = [parent[:]]\nfor k in range(1, LOG):\n    prev = up[-1]\n    up.append([prev[prev[v]] for v in range(n + 1)])\n\ndef lca(u, v):\n    if depth[u] < depth[v]: u, v = v, u\n    diff = depth[u] - depth[v]\n    bit = 0\n    while diff:\n        if diff & 1: u = up[bit][u]\n        diff >>= 1; bit += 1\n    if u == v:\n        return u\n    for k in range(LOG - 1, -1, -1):\n        if up[k][u] != up[k][v]:\n            u = up[k][u]; v = up[k][v]\n    return parent[u]\n\nout = []\nfor _ in range(q):\n    u = int(next(it)); v = int(next(it))\n    w = lca(u, v)\n    out.append(str(to_root[u] + to_root[v] - 2 * to_root[w] + cost[w]))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
];
