import type { SeedProblem } from "../../seed-problems";
import { newlineOutput } from "../generated-tests";

export function makeFenwick(size: number) {
  const tree = new Array<number>(size + 1).fill(0);
  const add = (index: number, value: number): void => {
    for (let i = index; i <= size; i += i & -i) tree[i] += value;
  };
  const prefix = (index: number): number => {
    let total = 0;
    for (let i = index; i > 0; i -= i & -i) total += tree[i];
    return total;
  };
  return {
    add,
    prefix,
    range: (l: number, r: number) => prefix(r) - prefix(l - 1),
    kth: (k: number): number => {
      let index = 0, step = 1;
      while (step * 2 <= size) step *= 2;
      for (; step > 0; step = Math.floor(step / 2)) {
        const next = index + step;
        if (next <= size && tree[next] < k) { index = next; k -= tree[next]; }
      }
      return index + 1;
    },
  };
}

function fenG1Large(): { input: string; expectedOutput: string } {
  const n = 100000, q = 50000;
  const bit = makeFenwick(n);
  const ops: string[] = [], answers: number[] = [];
  for (let k = 0; k < q; k += 1) {
    if (k % 20 === 0) {
      const l = ((k * 37) % n) + 1, r = Math.min(n, l + ((k * 13) % 10000));
      ops.push(`2 ${l} ${r}`);
      answers.push(bit.range(l, r));
    } else {
      const i = ((k * 7919) % n) + 1, x = ((k * 104729) % 2000001) - 1000000;
      ops.push(`1 ${i} ${x}`);
      bit.add(i, x);
    }
  }
  return { input: `${n} ${q}\n${ops.join("\n")}\n`, expectedOutput: newlineOutput(answers) };
}

function fenG2Large(): { input: string; expectedOutput: string } {
  const m = 100000;
  const bit = makeFenwick(1000);
  const ops: string[] = [], answers: number[] = [];
  for (let k = 0; k < m; k += 1) {
    if (k % 20 === 0) {
      const a = ((k * 37) % 1000) + 1, b = Math.min(1000, a + ((k * 13) % 500));
      ops.push(`2 ${a} ${b}`);
      answers.push(bit.range(a, b));
    } else {
      const x = ((k * 104729) % 1000) + 1;
      ops.push(`1 ${x}`);
      bit.add(x, 1);
    }
  }
  return { input: `${m}\n${ops.join("\n")}\n`, expectedOutput: newlineOutput(answers) };
}

function fenE1Large(): { input: string; expectedOutput: string } {
  const n = 100000, q = 50000;
  const bit = makeFenwick(n + 1);
  const ops: string[] = [], answers: number[] = [];
  for (let k = 0; k < q; k += 1) {
    if (k % 20 === 0) {
      const i = ((k * 7919) % n) + 1;
      ops.push(`2 ${i}`);
      answers.push(bit.prefix(i));
    } else {
      const l = ((k * 37) % n) + 1, r = Math.min(n, l + ((k * 13) % 10000));
      const x = ((k * 104729) % 2000001) - 1000000;
      ops.push(`1 ${l} ${r} ${x}`);
      bit.add(l, x);
      bit.add(r + 1, -x);
    }
  }
  return { input: `${n} ${q}\n${ops.join("\n")}\n`, expectedOutput: newlineOutput(answers) };
}

function fenM1Large(): { input: string; expectedOutput: string } {
  const n = 100000, q = 50000;
  const values: number[] = [];
  for (let i = 0; i < n; i += 1) values.push(((i * 7919) % 2000001) - 1000000);
  const frozen = [...values];
  const bit = makeFenwick(n);
  values.forEach((value, index) => bit.add(index + 1, value));
  const ops: string[] = [], answers: number[] = [];
  for (let k = 0; k < q; k += 1) {
    if (k % 20 === 0) {
      const l = ((k * 37) % n) + 1, r = Math.min(n, l + ((k * 13) % 10000));
      ops.push(`2 ${l} ${r}`);
      answers.push(bit.range(l, r));
    } else {
      const i = ((k * 7919) % n) + 1, x = ((k * 104729) % 2000001) - 1000000;
      ops.push(`1 ${i} ${x}`);
      bit.add(i, x - values[i - 1]);
      values[i - 1] = x;
    }
  }
  const input = `${n} ${q}\n${frozen.join(" ")}\n${ops.join("\n")}\n`;
  return { input, expectedOutput: newlineOutput(answers) };
}

function fenH1Large(): { input: string; expectedOutput: string } {
  const n = 100000;
  const values: number[] = [];
  for (let i = 0; i < n; i += 1) values.push(((i * 2654435761) % 2000001) - 1000000);
  const input = `${n}\n${values.join(" ")}\n`;
  return { input, expectedOutput: newlineOutput([countInversions([...values])]) };
}

function countInversions(source: number[]): number {
  const scratch = [...source];
  const merge = (lo: number, hi: number): number => {
    if (hi - lo <= 1) return 0;
    const mid = Math.floor((lo + hi) / 2);
    let total = merge(lo, mid) + merge(mid, hi);
    let i = lo, j = mid, k = lo;
    while (i < mid && j < hi) {
      if (source[i] <= scratch[j]) { scratch[k] = source[i]; i += 1; }
      else { scratch[k] = scratch[j]; j += 1; total += mid - i; }
      k += 1;
    }
    while (i < mid) { scratch[k] = source[i]; i += 1; k += 1; }
    while (j < hi) { scratch[k] = scratch[j]; j += 1; k += 1; }
    for (let t = lo; t < hi; t += 1) source[t] = scratch[t];
    return total;
  };
  return merge(0, source.length);
}

function fenX1Large(): { input: string; expectedOutput: string } {
  const m = 100000, domain = 100000;
  const bit = makeFenwick(domain);
  const counts = new Array<number>(domain + 1).fill(0);
  const inserted: number[] = [];
  const ops: string[] = [], answers: number[] = [];
  let total = 0;
  for (let k = 0; k < 85000; k += 1) {
    const x = ((k * 104729) % domain) + 1;
    ops.push(`1 ${x}`);
    counts[x] += 1;
    inserted.push(x);
    bit.add(x, 1);
    total += 1;
  }
  for (let k = 0; k < 5000; k += 1) {
    const x = inserted[(k * 7919) % inserted.length];
    if (counts[x] > 0) {
      ops.push(`2 ${x}`);
      counts[x] -= 1;
      bit.add(x, -1);
      total -= 1;
    } else {
      ops.push(`1 ${x}`);
      counts[x] = 1;
      inserted.push(x);
      bit.add(x, 1);
      total += 1;
    }
  }
  for (let k = 0; k < 10000; k += 1) {
    const rank = ((k * 37) % total) + 1;
    ops.push(`3 ${rank}`);
    answers.push(bit.kth(rank));
  }
  return { input: `${m}\n${ops.join("\n")}\n`, expectedOutput: newlineOutput(answers) };
}

function fenX2Large(n: number, q: number, every: number): { input: string; expectedOutput: string } {
  const diff = new Array<number>(n + 2).fill(0);
  const prefix = new Array<number>(n + 1).fill(0);
  const ops: string[] = [], answers: number[] = [];
  for (let k = 0; k < q; k += 1) {
    const l = ((k * 37) % n) + 1;
    const r = Math.min(n, l + ((k * 13) % Math.max(1, Math.floor(n / 4))));
    if (k % every === 0) {
      ops.push(`2 ${l} ${r}`);
      let running = 0;
      prefix[0] = 0;
      for (let i = 1; i <= n; i += 1) {
        running += diff[i];
        prefix[i] = prefix[i - 1] + running;
      }
      answers.push(prefix[r] - prefix[l - 1]);
    } else {
      const x = ((k * 104729) % 2000001) - 1000000;
      ops.push(`1 ${l} ${r} ${x}`);
      diff[l] += x;
      diff[r + 1] -= x;
    }
  }
  return { input: `${n} ${q}\n${ops.join("\n")}\n`, expectedOutput: newlineOutput(answers) };
}

export const FENWICK_TREE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m6-fenwick-tree-g1",
    title: "Add and Range Sum",
    statement:
      "ক্যান্টিনের বিক্রির লিস্ট শুরুতে সম্পূর্ণ শূন্য — প্রতিটি ঘরে আজ পর্যন্ত কত টাকা বিক্রি হয়েছে সেটা খালি। নুসরাত দুই ধরনের কাজ চান:\n\n- `1 i x` — `i` নম্বর ঘরে `x` টাকা **যোগ** করুন (ঘরটা এতটাই বাড়বে)।\n- `2 l r` — `l` থেকে `r` ঘর পর্যন্ত (দুই প্রান্তসহ) মোট টাকা প্রিন্ট করুন।\n\nশুধু `2` অপারেশনের উত্তর দিন।\n\nউদাহরণ: `1 1 5` তারপর `1 3 2` — ঘরে `[5, 0, 2]`; `2 1 5` দিলে উত্তর `7`।",
    inputFormat: "প্রথম লাইনে `n` ও `q`। পরের `q` লাইনে অপারেশন — `1 i x` অথবা `2 l r`।",
    outputFormat: "প্রতিটি `2` অপারেশনের জন্য একটি করে লাইনে যোগফল।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 100000`\n`1 <= i, l <= r <= n`\n`-10^9 <= x <= 10^9`\nউত্তর ৬৪-বিট সাইনড সংখ্যার মধ্যে",
    editorial:
      "### ধারণা\n\nফেনউইক ট্রির প্রতিটি ঘর `tree[i]` জমা রাখে `[i - lowbit(i) + 1 .. i]` রেঞ্জের যোগফল। প্রিফিক্স `prefix(i)` বের করতে `i -= i & -i` করে সর্বোচ্চ `log n` ঘর যোগ করলেই হয়, কারণ যেকোনো `[1..i]` এমন কয়েকটা কভারেজে ভাঙে। পয়েন্ট যোগে `i += i & -i` ধরে সেই সব কভারেজ হালনাগাদ হয়। রেঞ্জ যোগফল তারপর দুই প্রিফিক্সের পার্থক্য।\n\n### ধাপে ধাপে\n\n1. `n + 1` আকারের খালি `tree` বানান (০ নম্বর ঘর অব্যবহৃত)।\n2. `add(index, value)` লিখুন: `index <= n` পর্যন্ত `tree[index] += value`, তারপর `index += index & -index`।\n3. `prefix(index)` লিখুন: `index > 0` পর্যন্ত যোগ, তারপর `index -= index & -index`।\n4. প্রতি অপারেশন পড়ুন: `1` হলে `add(i, x)`, `2` হলে `prefix(r) - prefix(l - 1)` প্রিন্ট।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\ntree = [0] * (n + 1)\n\ndef add(index, value):\n    while index <= n:\n        tree[index] += value\n        index += index & -index\n\ndef prefix(index):\n    total = 0\n    while index > 0:\n        total += tree[index]\n        index -= index & -index\n    return total\n\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        add(int(next(it)), int(next(it)))\n    else:\n        l = int(next(it)); r = int(next(it))\n        out.append(str(prefix(r) - prefix(l - 1)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n### কমপ্লেক্সিটি\n\nপ্রতি অপারেশন `O(log n)`, স্পেস `O(n)` — একটাই অ্যারে। সরাসরি লুপ দিলে প্রতি কাজ `O(n)`, `q = 100000`-এ অকল্পনীয়।\n\n### সাধারণ ভুল\n\n- ইনপুট ১-ভিত্তিক, BIT ১-ভিত্তিক — `add(i, x)`-এ সরাসরি ইনপুট ইনডেক্সটাই দিন।\n- লুপের দিক উল্টানো: আপডেটে `index += index & -index`, প্রিফিক্সে বিয়োগ।\n- `x` ঋণাত্মক হতে পারে — তাও একইভাবে চলে, কোডে কোনো পরিবর্তন লাগবে না।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Fenwick Tree", "Binary Indexed Tree", "Range Query"],
    tests: [
      { input: "5 4\n1 1 5\n1 3 2\n2 1 5\n2 2 3\n", expectedOutput: "7\n2\n", isSample: true },
      { input: "1 3\n1 1 10\n2 1 1\n1 1 -4\n", expectedOutput: "10\n", isSample: true },
      { input: "4 3\n2 1 4\n1 2 -10\n2 1 4\n", expectedOutput: "0\n-10\n", isSample: false },
      { input: "3 3\n1 2 5\n1 2 7\n2 1 3\n", expectedOutput: "12\n", isSample: false },
      { input: "6 2\n1 1 1000000000\n2 1 6\n", expectedOutput: "1000000000\n", isSample: false },
      { ...fenG1Large(), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\ntree = [0] * (n + 1)\n\ndef add(index, value):\n    while index <= n:\n        tree[index] += value\n        index += index & -index\n\ndef prefix(index):\n    total = 0\n    while index > 0:\n        total += tree[index]\n        index -= index & -index\n    return total\n\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        add(int(next(it)), int(next(it)))\n    else:\n        l = int(next(it)); r = int(next(it))\n        out.append(str(prefix(r) - prefix(l - 1)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-fenwick-tree-g2",
    title: "Score Range Counter",
    statement:
      "প্রাইমএশিয়ার মাসিক কুইজের নম্বর ১ থেকে ১০০০-এর মধ্যে আসে। শিক্ষক রাফি জানতে চান কয়জন ছাত্র নির্দিষ্ট রেঞ্জে পেয়েছে। কয়েকটা অপারেশন দেওয়া থাকবে:\n\n- `1 x` — আরেকজন ছাত্র নম্বর পেল `x`।\n- `2 a b` — নম্বর `a` থেকে `b` (দুই প্রান্তসহ) পাওয়া ছাত্র সংখ্যা প্রিন্ট করুন।\n\nশুধু `2` অপারেশনের উত্তর দিন।\n\nউদাহরণ: `1 500`, `1 750`, `1 500` এরপর `2 400 600` → `2`, `2 700 800` → `1`।",
    inputFormat: "প্রথম লাইনে অপারেশনের সংখ্যা `m`। পরের `m` লাইনে এক একটি অপারেশন — `1 x` অথবা `2 a b`।",
    outputFormat: "প্রতিটি `2` অপারেশনের জন্য একটি করে লাইনে ছাত্র সংখ্যা।",
    constraints:
      "`1 <= m <= 100000`\n`1 <= x, a <= b <= 1000`\nপ্রতিটি নম্বর পূর্ণসংখ্যা, প্রতিটি ছাত্র একবার যোগ হবে",
    editorial:
      "### ধারণা\n\nএখানে সূচক হলো নম্বর নিজে (১ থেকে ১০০০), আর ঘরের মান হলো ওই নম্বরে কতজন পেয়েছে — অর্থাৎ ফ্রিকোয়েন্সি অ্যারে। প্রিফিক্স যোগফল বললেই `[1..b]` পর্যন্ত কতজন সেটা, আর `[a-1]` বিয়োগ করলেই `[a..b]`। আপডেট ও প্রশ্ন দুটোই BIT-তে `O(log 1000)` — সূচকের সীমা ছোট বলে কাজ প্রায় ক্ষণিকেই শেষ।\n\n### ধাপে ধাপে\n\n1. `SIZE = 1000` ধরে `tree[1..1000]` বানান।\n2. `1 x` এলে `add(x, 1)` — ওই স্কোরের কাউন্টার এক বাড়ল।\n3. `2 a b` এলে `prefix(b) - prefix(a - 1)` প্রিন্ট করুন।\n4. রেঞ্জের প্রান্ত যাচাই করুন: `a = 1` হলে `prefix(0)` শূন্য ফেরত দেবে, ভুল নয়।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nm = int(next(it))\nSIZE = 1000\ntree = [0] * (SIZE + 1)\n\ndef add(index, value):\n    while index <= SIZE:\n        tree[index] += value\n        index += index & -index\n\ndef prefix(index):\n    total = 0\n    while index > 0:\n        total += tree[index]\n        index -= index & -index\n    return total\n\nout = []\nfor _ in range(m):\n    op = next(it)\n    if op == b'1':\n        add(int(next(it)), 1)\n    else:\n        a = int(next(it)); b = int(next(it))\n        out.append(str(prefix(b) - prefix(a - 1)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n### কমপ্লেক্সিটি\n\nপ্রতি অপারেশন `O(log V)` যেখানে `V = 1000`, তাই প্রায় `O(1)`; স্পেস `O(V)`। ভ্যালু বড় (১ কোটি পর্যন্ত) হলে প্রথমে coordinate compression করে একই কোড চালাতে হয়।\n\n### সাধারণ ভুল\n\n- `prefix(b) - prefix(a)` — সীমানা এক ধাপ সরে যায়; সঠিক `prefix(a - 1)`।\n- রেঞ্জের প্রান্ত `SIZE`-এর বাইরে চলে গেলে লুপ অসীম হয় — ইনপুট সীমা আগে পড়ুন।\n- প্রতিটি স্কোরের জন্য পুরো ঘর ঘুরে গোনা — `O(m * V)`, এখানে সম্ভব নয়।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Fenwick Tree", "Frequency", "Counting"],
    tests: [
      { input: "6\n1 500\n1 750\n1 500\n2 400 600\n2 700 800\n2 1 1000\n", expectedOutput: "2\n1\n3\n", isSample: true },
      { input: "3\n2 1 1000\n1 1\n2 1 1\n", expectedOutput: "0\n1\n", isSample: true },
      { input: "4\n1 1\n1 1000\n2 1 1\n2 1000 1000\n", expectedOutput: "1\n1\n", isSample: false },
      { input: "1\n2 500 600\n", expectedOutput: "0\n", isSample: false },
      { input: "5\n2 1000 1000\n1 1000\n2 1000 1000\n1 999\n2 999 1000\n", expectedOutput: "0\n1\n2\n", isSample: false },
      { ...fenG2Large(), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nm = int(next(it))\nSIZE = 1000\ntree = [0] * (SIZE + 1)\n\ndef add(index, value):\n    while index <= SIZE:\n        tree[index] += value\n        index += index & -index\n\ndef prefix(index):\n    total = 0\n    while index > 0:\n        total += tree[index]\n        index -= index & -index\n    return total\n\nout = []\nfor _ in range(m):\n    op = next(it)\n    if op == b'1':\n        add(int(next(it)), 1)\n    else:\n        a = int(next(it)); b = int(next(it))\n        out.append(str(prefix(b) - prefix(a - 1)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-fenwick-tree-e1",
    title: "Range Add, Point Query",
    statement:
      "তানভীর গ্রিনহাউসের সেন্সর একটার পর একটা রেঞ্জে তাপ যোগ করে, আর সে জানতে চান নির্দিষ্ট একটা ঘরে মোট কত তাপ জমেছে। শুরুতে `n`টি ঘরেই মান `0`। দুই ধরনের অপারেশন:\n\n- `1 l r x` — `l` থেকে `r` পর্যন্ত (দুই প্রান্তসহ) প্রতিটি ঘরে `x` যোগ করুন।\n- `2 i` — `i` নম্বর ঘরের বর্তমান মান প্রিন্ট করুন।\n\nশুধু `2` অপারেশনের উত্তর দিন।\n\nউদাহরণ: `1 1 3 10` এরপর `1 2 5 5` — ঘর হয় `[10, 15, 15, 5, 5]`; `2 3` দিলে `15`।",
    inputFormat: "প্রথম লাইনে `n` ও `q`। পরের `q` লাইনে অপারেশন — `1 l r x` অথবা `2 i`।",
    outputFormat: "প্রতিটি `2` অপারেশনের জন্য একটি করে লাইনে ঘরের মান।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 100000`\n`1 <= l <= r <= n`, `1 <= i <= n`\n`-10^9 <= x <= 10^9`\nশুরুতে সব ঘরের মান `0`",
    editorial:
      "### ধারণা\n\nএটা difference array-এর ধারণাটা BIT-তে বসানো। ঘরের মান বদলার বদলে আমরা পার্থক্য সংরক্ষণ করি: `d[l] += x` এবং `d[r + 1] -= x`। তখন `i` নম্বর ঘরের মান হয় `d[1] + ... + d[i]` — অর্থাৎ প্রিফিক্স সাম! রেঞ্জ আপডেট দুটি পয়েন্ট আপডেটে নেমে এসেছে (`O(log n)`), আর পয়েন্ট প্রশ্ন একটা প্রিফিক্স সাম (`O(log n)`)।\n\n### ধাপে ধাপে\n\n1. `n + 1` আকারের BIT বানান (কারণ `d[r + 1]` লাগতে পারে)।\n2. `1 l r x` এলে `add(l, x)` এবং `add(r + 1, -x)` — দুটোই পয়েন্ট আপডেট।\n3. `2 i` এলে `prefix(i)` প্রিন্ট করুন — এটাই ওই ঘরের মান।\n4. ভাবুন কেন `add(r + 1, -x)` না দিলে রেঞ্জের পরের ঘরগুলোতেও যোগ থেকে যেত।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nsize = n + 1\ntree = [0] * (size + 1)\n\ndef add(index, value):\n    while index <= size:\n        tree[index] += value\n        index += index & -index\n\ndef prefix(index):\n    total = 0\n    while index > 0:\n        total += tree[index]\n        index -= index & -index\n    return total\n\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        l = int(next(it)); r = int(next(it)); x = int(next(it))\n        add(l, x)\n        add(r + 1, -x)\n    else:\n        out.append(str(prefix(int(next(it)))))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n### কমপ্লেক্সিটি\n\nপ্রতি অপারেশন `O(log n)`, স্পেস `O(n)`। difference array দিয়ে সরাসরি লিখলে আপডেট `O(1)` হলেও প্রতিটি পয়েন্ট প্রশ্নে `d[1..i]` গুনতে `O(n)` লাগত — BIT সেটাও `O(log n)` করে দিল।\n\n### সাধারণ ভুল\n\n- `add(r + 1, -x)` ভুলে যাওয়া — তখন রেঞ্জের বাইরেও মান বেড়ে যায়।\n- BIT-তে `r + 1 > n` হলে লুপ বাইরে গেলেই থেমে যায়, তাই ভেতরের অ্যারের সাইজ `size = n + 1` এবং শর্ত `index <= size` ঠিক রাখতে হবে।\n- প্রশ্ন `2 i`-তে রেঞ্জ ধরে `l = i, r = i` করে যোগফল বের করা — কাজ করলেও অপ্রয়োজনীয় `O(log n)` বাড়ায়।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Fenwick Tree", "Difference Array", "Lazy"],
    tests: [
      { input: "5 5\n1 1 3 10\n1 2 5 5\n2 1\n2 3\n2 5\n", expectedOutput: "10\n15\n5\n", isSample: true },
      { input: "3 2\n2 2\n1 1 3 1\n", expectedOutput: "0\n", isSample: true },
      { input: "4 2\n2 1\n2 4\n", expectedOutput: "0\n0\n", isSample: false },
      { input: "4 3\n1 1 4 3\n1 3 4 -3\n2 3\n", expectedOutput: "0\n", isSample: false },
      { input: "2 3\n1 1 1 7\n1 2 2 -2\n2 2\n", expectedOutput: "-2\n", isSample: false },
      { ...fenE1Large(), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nsize = n + 1\ntree = [0] * (size + 1)\n\ndef add(index, value):\n    while index <= size:\n        tree[index] += value\n        index += index & -index\n\ndef prefix(index):\n    total = 0\n    while index > 0:\n        total += tree[index]\n        index -= index & -index\n    return total\n\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        l = int(next(it)); r = int(next(it)); x = int(next(it))\n        add(l, x)\n        add(r + 1, -x)\n    else:\n        out.append(str(prefix(int(next(it)))))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-fenwick-tree-m1",
    title: "Point Assign, Range Sum",
    statement:
      "রাফির ল্যাব রিডিং-এর তালিকায় শুরুতেই কিছু মান আছে। দুই ধরনের অপারেশন:\n\n- `1 i x` — `i` নম্বর ঘরের মান বদলে **ঠিক `x`** করে দিন (যোগ নয়, প্রতিস্থাপন)।\n- `2 l r` — `l` থেকে `r` পর্যন্ত যোগফল প্রিন্ট করুন।\n\nপ্রতিটি ঘরের পুরোনো মান জেনে নতুন মানের পার্থক্য যোগ করলেই BIT বদলায় — এটাই এই অভ্যাসের মূল কথা।\n\nউদাহরণ: তালিকা `1 2 3 4 5`; `1 3 10` → তৃতীয় ঘরে ১০; `2 1 5` → `22`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা। পরের `q` লাইনে অপারেশন — `1 i x` অথবা `2 l r`।",
    outputFormat: "প্রতিটি `2` অপারেশনের জন্য একটি করে লাইনে যোগফল।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 100000`\n`1 <= i, l <= r <= n`\n`-10^9 <= a_i, x <= 10^9`\nউত্তর ৬৪-বিট সাইনড সংখ্যার মধ্যে",
    editorial:
      "### ধারণা\n\nBIT যোগ ও বিয়োগ দিয়ে কাজ করে, তাই প্রতিস্থাপনকে যোগে রূপান্তর করতে হয়: `add(i, x - old)` — নতুন মান থেকে পুরোনো মান বিয়োগ করে যতটুকু পার্থক্য, সেটুকুই যোগ। পুরোনো মান জানার জন্য অ্যারের একটা কপি রাখতে হয়। নইলে `1 i x`-কে `O(n)` করে পুরো রেঞ্জ ঘুরে যোগফল বদলাতে হবে।\n\n### ধাপে ধাপে\n\n1. ইনপুটের অ্যারে `arr` রাখুন এবং প্রতিটি `i`-তে `add(i, arr[i])` চালিয়ে BIT বিল্ড করুন।\n2. `1 i x` এলে `add(i, x - arr[i - 1])`, তারপর `arr[i - 1] = x`।\n3. `2 l r` এলে `prefix(r) - prefix(l - 1)` প্রিন্ট করুন।\n4. প্রতিটি ধাপে মনে করুন বিট সবসময় বর্তমান অবস্থার যোগফল ধরে রাখছে।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) for _ in range(n)]\ntree = [0] * (n + 1)\n\ndef add(index, value):\n    while index <= n:\n        tree[index] += value\n        index += index & -index\n\ndef prefix(index):\n    total = 0\n    while index > 0:\n        total += tree[index]\n        index -= index & -index\n    return total\n\nfor i, value in enumerate(arr, start=1):\n    add(i, value)\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        i = int(next(it)); x = int(next(it))\n        add(i, x - arr[i - 1])\n        arr[i - 1] = x\n    else:\n        l = int(next(it)); r = int(next(it))\n        out.append(str(prefix(r) - prefix(l - 1)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n### কমপ্লেক্সিটি\n\nবিল্ড `O(n log n)` (চাইলে `O(n)`-এও), প্রতি অপারেশন `O(log n)`, স্পেস `O(n)`। অতিরিক্ত `arr` কপিটা মাত্র `O(n)`।\n\n### সাধারণ ভুল\n\n- `add(i, x)` লেখা — এতে পুরোনো মানও থেকে যায়, ফলে দ্বিতীয় বার একই ঘরে একই মান বসালেও ফল বদলায়।\n- `arr` কপি রাখতে ভুলে যাওয়া, অথবা প্রতিস্থাপনের আগে `arr` আপডেট করে ফেলা — তখন পার্থক্য হয় `0`। আগে `add`, তারপর `arr` বদলান।\n- ইনডেক্স ১-ভিত্তিক; `arr[i - 1]`-এ মান রাখুন আর `add`-এ `i` দিন।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Fenwick Tree", "Point Update", "Range Query"],
    tests: [
      { input: "5 4\n1 2 3 4 5\n1 3 10\n2 1 5\n1 1 -5\n2 1 5\n", expectedOutput: "22\n16\n", isSample: true },
      { input: "1 3\n7\n2 1 1\n1 1 0\n2 1 1\n", expectedOutput: "7\n0\n", isSample: true },
      { input: "3 2\n-1 -2 -3\n2 1 3\n2 2 3\n", expectedOutput: "-6\n-5\n", isSample: false },
      { input: "4 4\n0 0 0 0\n1 4 5\n2 1 4\n1 4 5\n2 1 4\n", expectedOutput: "5\n5\n", isSample: false },
      { input: "5 3\n10 20 30 40 50\n1 2 100\n2 1 2\n2 3 5\n", expectedOutput: "110\n120\n", isSample: false },
      { ...fenM1Large(), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) for _ in range(n)]\ntree = [0] * (n + 1)\n\ndef add(index, value):\n    while index <= n:\n        tree[index] += value\n        index += index & -index\n\ndef prefix(index):\n    total = 0\n    while index > 0:\n        total += tree[index]\n        index -= index & -index\n    return total\n\nfor i, value in enumerate(arr, start=1):\n    add(i, value)\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        i = int(next(it)); x = int(next(it))\n        add(i, x - arr[i - 1])\n        arr[i - 1] = x\n    else:\n        l = int(next(it)); r = int(next(it))\n        out.append(str(prefix(r) - prefix(l - 1)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-fenwick-tree-h1",
    title: "Inversion Count",
    statement:
      "সাদিয়া ছাত্রছাত্রীর সারি দেখছেন — কয়েকটা জায়গায় সামনের চেয়ে পিছনের ছাত্র বেশি উঁচু। এমন জোড়া গোনা হবে যেখানে `i < j` কিন্তু `a[i] > a[j]` — এদের **inversion** বলে। দেওয়া থাকবে `n`টি পূর্ণসংখ্যা; মোট কয়টা inversion আছে সেটি নির্ণয় করুন।\n\nসমান মানের জোড়া inversion নয়।\n\nউদাহরণ: `3 1 4 1 5` — সূচকের জোড়াগুলো হলো `(3,1), (3,1), (4,1)`, অর্থাৎ উত্তর `3`।",
    inputFormat: "প্রথম লাইনে `n`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা।",
    outputFormat: "মোট inversion সংখ্যা এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= n <= 100000`\n`-10^9 <= a_i <= 10^9`\nউত্তর ৬৪-বিট সাইনড সংখ্যার মধ্যে",
    editorial:
      "### ধারণা\n\nডান দিক থেকে বামে ঘুরে প্রতিটি সংখ্যার জন্য জিজ্ঞেস করলে — আমার ডানে যতগুলো সংখ্যা আগে দেখা হয়েছে, তাদের মধ্যে কয়টা আমার চেয়ে ছোট? উত্তরগুলোর যোগফলই উত্তর। 'কয়টা ছোট' প্রশ্নটা ফেনউইক ট্রি খুব সুন্দর করে: ঘর হলো সংকুচিত মান (rank), মান হলো সংখ্যাটার ঘটনাসংখ্যা; `prefix(r - 1)` দিলে ছোট মানের সংখ্যা। মান `10^9` পর্যন্ত বলে আগে coordinate compression লাগবে — শুধু ক্রমটা বাঁচিয়ে নিলেই হয়।\n\n### ধাপে ধাপে\n\n1. সব মান sort করে প্রতিটিকে `1, 2, 3, ...` rank দিন।\n2. খালি BIT বানান (সাইজ ভিন্ন মানের সংখ্যা)।\n3. তালিকা ডান থেকে ঘোরুন: প্রতিটি মানের জন্য `answer += prefix(rank - 1)`, তারপর `add(rank, 1)`।\n4. শেষে `answer` প্রিন্ট করুন।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nn = int(data[0])\nvalues = list(map(int, data[1:1 + n]))\nuniq = sorted(set(values))\nrank = {v: i + 1 for i, v in enumerate(uniq)}\nsize = len(uniq)\ntree = [0] * (size + 1)\n\ndef add(index, value):\n    while index <= size:\n        tree[index] += value\n        index += index & -index\n\ndef prefix(index):\n    total = 0\n    while index > 0:\n        total += tree[index]\n        index -= index & -index\n    return total\n\nanswer = 0\nfor value in reversed(values):\n    r = rank[value]\n    answer += prefix(r - 1)\n    add(r, 1)\nprint(answer)\n```\n\n### কমপ্লেক্সিটি\n\nসাজানো `O(n log n)`, মূল লুপ `O(n log n)`, স্পেস `O(n)`। দ্বিতীয় লুপ `O(n^2)` — `n = 100000`-এ ১০ অর্ডার ধীর, শর্ত পূরণ হবে না। উত্তর `n(n-1)/2` পর্যন্ত বড় হতে পারে, তাই ৬৪-বিট ভ্যারিয়েবল ব্যবহার করুন।\n\n### সাধারণ ভুল\n\n- `prefix(r)` দিয়ে গোনা — তাতে নিজের কপিও ধরা পড়ে; সঠিক `prefix(r - 1)`।\n- সমান মান গুনে ফেলা: ভিন্ন র‍্যাঙ্ক দিলে সমান মান আলাদা হয়ে যায়, তাই একই মানের জন্য একটাই rank — এবং `r - 1` শর্তে সমান মান আসবেই না।\n- compression ছাড়া সরাসরি মানকে BIT সূচক ধরা — মেমরি প্রায় অসীম লাগবে।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Fenwick Tree", "Inversions", "Coordinate Compression"],
    tests: [
      { input: "5\n3 1 4 1 5\n", expectedOutput: "3\n", isSample: true },
      { input: "2\n1 1\n", expectedOutput: "0\n", isSample: true },
      { input: "4\n1 2 3 4\n", expectedOutput: "0\n", isSample: false },
      { input: "4\n4 3 2 1\n", expectedOutput: "6\n", isSample: false },
      { input: "3\n-1 -2 -3\n", expectedOutput: "3\n", isSample: false },
      { input: "1\n42\n", expectedOutput: "0\n", isSample: false },
      { ...fenH1Large(), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nn = int(data[0])\nvalues = list(map(int, data[1:1 + n]))\nuniq = sorted(set(values))\nrank = {v: i + 1 for i, v in enumerate(uniq)}\nsize = len(uniq)\ntree = [0] * (size + 1)\n\ndef add(index, value):\n    while index <= size:\n        tree[index] += value\n        index += index & -index\n\ndef prefix(index):\n    total = 0\n    while index > 0:\n        total += tree[index]\n        index -= index & -index\n    return total\n\nanswer = 0\nfor value in reversed(values):\n    r = rank[value]\n    answer += prefix(r - 1)\n    add(r, 1)\nprint(answer)\n",
  },
  {
    slug: "learn-m6-fenwick-tree-x1",
    title: "Kth Smallest Online",
    statement:
      "ল্যাবের সার্ভারে সংখ্যা একে একে যোগ হচ্ছে আর মুছেও যাচ্ছে। তিন ধরনের অপারেশন:\n\n- `1 x` — সংখ্যা `x` যোগ করুন।\n- `2 x` — `x`-এর একটি কপি মুছে ফেলুন (এই অপারেশনে `x` অবশ্যই থাকবে)।\n- `3 k` — বর্তমান সব সংখ্যার মধ্যে ক্রমানুসারে `k` নম্বরটি প্রিন্ট করুন।\n\nশুধু `3` অপারেশনের উত্তর দিন।\n\nউদাহরণ: যোগ `5, 3, 5` — তালিকা `[3, 5, 5]`; `3 1` → `3`, `3 3` → `5`।",
    inputFormat: "প্রথম লাইনে অপারেশনের সংখ্যা `m`। পরের `m` লাইনে এক একটি অপারেশন।",
    outputFormat: "প্রতিটি `3` অপারেশনের জন্য একটি করে লাইনে সংখ্যাটি।",
    constraints:
      "`1 <= m <= 100000`\n`1 <= x <= 100000`\n`k` সবসময় বর্তমান সংখ্যার সংখ্যার ব্যবধানে",
    editorial:
      "### ধারণা\n\nBIT-এর ঘরগুলো জোড়ার পাওয়ার ২-এর ঘাতের দৈর্ঘ্যে জমা থাকে — এই বৈশিষ্ট্যটা দিয়ে বিটের ভেতরেই 'বাইনারি লিফটিং' করা যায়। `tree[next]` যদি `k`-এর চেয়ে ছোট হয়, তাহলে ওই পুরো অংশের সব সংখ্যা আমাদের `k` থেকে বাদ দিলেই হবে; নাহলে ওই অংশ পার করে যাওয়া যায়। প্রতিটি ধাপে অর্ধেক সূচক কমে, তাই `O(log V)`। শর্ত — সব ঘরের মান অ-ঋণাত্মক (কাউন্টার তাই)।\n\n### ধাপে ধাপে\n\n1. `x <= 100000` ধরে সাইজ নির্ধারণ করুন, `tree` শূন্য দিয়ে শুরু করুন।\n2. `1 x` → `add(x, 1)`; `2 x` → `add(x, -1)`।\n3. `3 k`: `index = 0`, সবচেয়ে বড় জোড়ার পাওয়া `step` দিয়ে শুরু করুন; `step` অর্ধেক অর্ধেক কমান।\n4. প্রতি ধাপে `next = index + step` যদি সীমার মধ্যে এবং `tree[next] < k` হয়, তাহলে `index = next`, `k -= tree[next]`। শেষে উত্তর `index + 1`।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nm = int(next(it))\nSIZE = 100000\ntree = [0] * (SIZE + 1)\n\ndef add(index, value):\n    while index <= SIZE:\n        tree[index] += value\n        index += index & -index\n\ndef kth(k):\n    index, step = 0, 1\n    while step * 2 <= SIZE:\n        step *= 2\n    while step > 0:\n        nxt = index + step\n        if nxt <= SIZE and tree[nxt] < k:\n            index = nxt\n            k -= tree[nxt]\n        step //= 2\n    return index + 1\n\nout = []\nfor _ in range(m):\n    op = next(it)\n    if op == b'1':\n        add(int(next(it)), 1)\n    elif op == b'2':\n        add(int(next(it)), -1)\n    else:\n        out.append(str(kth(int(next(it)))))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n### কমপ্লেক্সিটি\n\nপ্রতি অপারেশন `O(log V)` যেখানে `V = 100000`, স্পেস `O(V)`। প্রতিটি `kth`-এ প্রিফিক্স বাইনারি সার্চ দিয়ে `O(log^2 V)`-ও চলবে, তবে লিফটিং `O(log V)`।\n\n### সাধারণ ভুল\n\n- ঋণাত্মক কাউন্টার থাকলে লিফটিং ভেঙে পড়ে — এখানে `add(x, -1)`-এর পরেও কাউন্টার কখনো ঋণাত্মক হয় না, তাই নিরাপদ।\n- লুপে `step` কমানো ভুলে অসীম লুপ, অথবা `index + step`-এর সীমা যাচাই না করা।\n- শেষে `index` প্রিন্ট — সঠিক উত্তর `index + 1` (কাউন্টার ১ ভিত্তিক)।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Fenwick Tree", "Order Statistics", "Binary Lifting"],
    tests: [
      { input: "7\n1 5\n1 3\n1 5\n3 1\n3 3\n2 5\n3 2\n", expectedOutput: "3\n5\n5\n", isSample: true },
      { input: "3\n1 10\n3 1\n2 10\n", expectedOutput: "10\n", isSample: true },
      { input: "5\n1 7\n1 7\n1 7\n3 2\n2 7\n", expectedOutput: "7\n", isSample: false },
      { input: "6\n1 1\n1 100000\n3 1\n3 2\n2 1\n3 1\n", expectedOutput: "1\n100000\n100000\n", isSample: false },
      { input: "4\n1 2\n1 4\n3 2\n1 3\n", expectedOutput: "4\n", isSample: false },
      { ...fenX1Large(), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nm = int(next(it))\nSIZE = 100000\ntree = [0] * (SIZE + 1)\n\ndef add(index, value):\n    while index <= SIZE:\n        tree[index] += value\n        index += index & -index\n\ndef kth(k):\n    index, step = 0, 1\n    while step * 2 <= SIZE:\n        step *= 2\n    while step > 0:\n        nxt = index + step\n        if nxt <= SIZE and tree[nxt] < k:\n            index = nxt\n            k -= tree[nxt]\n        step //= 2\n    return index + 1\n\nout = []\nfor _ in range(m):\n    op = next(it)\n    if op == b'1':\n        add(int(next(it)), 1)\n    elif op == b'2':\n        add(int(next(it)), -1)\n    else:\n        out.append(str(kth(int(next(it)))))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-fenwick-tree-x2",
    title: "Range Add, Range Sum",
    statement:
      "বৃষ্টির পানি জমার হিসাবে সারি ধরে কয়েকটা পাত্র আছে। দুই ধরনের অপারেশন:\n\n- `1 l r x` — `l` থেকে `r` পর্যন্ত (দুই প্রান্তসহ) প্রতিটি পাত্রে `x` মিলিলিটার যোগ করুন।\n- `2 l r` — ওই রেঞ্জের মোট পানি প্রিন্ট করুন।\n\nএবার শুধু পয়েন্ট প্রশ্ন নয়, রেঞ্জ প্রশ্নও আছে — difference array-এর প্রিফিক্স প্রিফিক্স গোনতে হবে।\n\nউদাহরণ: `1 1 3 10` এরপর `1 2 5 5` — পাত্র `[10, 15, 15, 5, 5]`; `2 1 5` → `50`।",
    inputFormat: "প্রথম লাইনে `n` ও `q`। পরের `q` লাইনে অপারেশন — `1 l r x` অথবা `2 l r`।",
    outputFormat: "প্রতিটি `2` অপারেশনের জন্য একটি করে লাইনে যোগফল।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 100000`\n`1 <= l <= r <= n`\n`-10^9 <= x <= 10^9`\nশুরুতে সব ঘরের মান `0`; উত্তর ৬৪-বিট সাইনড সংখ্যার মধ্যে",
    editorial:
      "### ধারণা\n\nএকটা BIT দিয়ে পয়েন্ট আপডেট + রেঞ্জ কোয়েরি হয়, কিন্তু রেঞ্জ আপডেট + রেঞ্জ কোয়েরির জন্য **দুইটি** BIT লাগে। ভাবুন `p[i]` = প্রথম থেকে `i` পর্যন্ত মানের যোগফল চাই। difference array `d` রাখলে `p[i] = i * (d[1] + ... + d[i]) - (1*(d[1]) + 2*(d[2]) + ... + i*(d[i]))` — প্রথম অংশটা একটা BIT-তে `d` রেখে, দ্বিতীয় অংশের জন্য আরেকটায় `d[j] * j` রাখা যায়। রেঞ্জ আপডেট তাহলে প্রতিটি BIT-তে দুটি করে পয়েন্ট আপডেট (`add(l, ...)` ও `add(r + 1, ...)`), আর রেঞ্জ যোগফল দুই প্রিফিক্সের পার্থক্য।\n\n### ধাপে ধাপে\n\n1. `bit1` ও `bit2` বানান (`size = n + 1`, কারণ `r + 1` লাগে)।\n2. রেঞ্জ যোগ `x`: `add(bit1, l, x)`, `add(bit1, r + 1, -x)`, `add(bit2, l, x * (l - 1))`, `add(bit2, r + 1, -x * r)`।\n3. প্রিফিক্স `pref(i) = prefix(bit1, i) * i - prefix(bit2, i)`।\n4. রেঞ্জ যোগফল `pref(r) - pref(l - 1)`।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nsize = n + 1\nbit1 = [0] * (size + 1)\nbit2 = [0] * (size + 1)\n\ndef add(bit, index, value):\n    while index <= size:\n        bit[index] += value\n        index += index & -index\n\ndef prefix(bit, index):\n    total = 0\n    while index > 0:\n        total += bit[index]\n        index -= index & -index\n    return total\n\ndef range_add(l, r, value):\n    add(bit1, l, value)\n    add(bit1, r + 1, -value)\n    add(bit2, l, value * (l - 1))\n    add(bit2, r + 1, -value * r)\n\ndef pref(i):\n    return prefix(bit1, i) * i - prefix(bit2, i)\n\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        l = int(next(it)); r = int(next(it)); x = int(next(it))\n        range_add(l, r, x)\n    else:\n        l = int(next(it)); r = int(next(it))\n        out.append(str(pref(r) - pref(l - 1)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n### কমপ্লেক্সিটি\n\nপ্রতি অপারেশন `O(log n)` (কনস্ট্যান্ট ফ্যাক্টর ৪ বড়), স্পেস `O(n)`। শুধু difference array রাখলে প্রতি কোয়েরিতে `O(n)` লাগত। সেগমেন্ট ট্রির lazy-ও একই কাজ `O(log n)`-এ করে — দুটোই বৈধ।\n\n### সাধারণ ভুল\n\n- `add(bit2, l, value * l)` — সূত্রে `(l - 1)`, `l` নয়; আর `r + 1` অংশে `-value * r`। একটা ভুল হলে সব উত্তরে সমতলভাবে ভুল যোগ হয়।\n- `pref(l - 1)`-এ `l = 1` হলে `pref(0) = 0` হওয়া নিশ্চিত করা — BIT শূন্যে শূন্য ফেরত দেয়, কিন্তু গুণের অংশে `i * ...` লিখতে গিয়ে ০ × কিছু ভুল হতে পারে না।\n- একটাই BIT দিয়ে কাজ চালানোর চেষ্টা — প্রিফিক্সের প্রিফিক্স একক প্রিফিক্সে ভেঙে যায় না।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Fenwick Tree", "Range Update", "Range Query"],
    tests: [
      { input: "5 4\n1 1 3 10\n1 2 5 5\n2 1 5\n2 2 4\n", expectedOutput: "50\n35\n", isSample: true },
      { input: "3 2\n1 1 3 1\n2 1 3\n", expectedOutput: "3\n", isSample: true },
      { input: "4 2\n2 1 4\n1 2 3 -2\n", expectedOutput: "0\n", isSample: false },
      { input: "2 3\n1 1 1 5\n1 2 2 5\n2 1 2\n", expectedOutput: "10\n", isSample: false },
      { input: "6 4\n1 1 6 3\n1 3 6 -1\n2 1 6\n2 3 4\n", expectedOutput: "14\n4\n", isSample: false },
      { ...fenX2Large(100000, 50000, 100), isSample: false },
      { ...fenX2Large(2000, 30000, 4), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nsize = n + 1\nbit1 = [0] * (size + 1)\nbit2 = [0] * (size + 1)\n\ndef add(bit, index, value):\n    while index <= size:\n        bit[index] += value\n        index += index & -index\n\ndef prefix(bit, index):\n    total = 0\n    while index > 0:\n        total += bit[index]\n        index -= index & -index\n    return total\n\ndef range_add(l, r, value):\n    add(bit1, l, value)\n    add(bit1, r + 1, -value)\n    add(bit2, l, value * (l - 1))\n    add(bit2, r + 1, -value * r)\n\ndef pref(i):\n    return prefix(bit1, i) * i - prefix(bit2, i)\n\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        l = int(next(it)); r = int(next(it)); x = int(next(it))\n        range_add(l, r, x)\n    else:\n        l = int(next(it)); r = int(next(it))\n        out.append(str(pref(r) - pref(l - 1)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
];
