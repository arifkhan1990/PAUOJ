import type { SeedProblem } from "../../seed-problems";
import { newlineOutput } from "../generated-tests";

type SegOracle = {
  range: (left: number, right: number) => number;
  set: (index: number, value: number) => void;
};

export function makeSeg(values: number[], neutral: number, combine: (a: number, b: number) => number): SegOracle {
  let size = 1;
  while (size < values.length) size *= 2;
  const tree = new Array<number>(2 * size).fill(neutral);
  values.forEach((value, index) => { tree[size + index] = value; });
  for (let i = size - 1; i > 0; i -= 1) tree[i] = combine(tree[2 * i], tree[2 * i + 1]);
  const refresh = (node: number) => {
    while (node > 1) {
      node = Math.floor(node / 2);
      tree[node] = combine(tree[2 * node], tree[2 * node + 1]);
    }
  };
  return {
    set: (index, value) => { tree[size + index] = value; refresh(size + index); },
    range: (left, right) => {
      let l = size + left - 1;
      let r = size + right;
      let result = neutral;
      while (l < r) {
        if (l % 2 === 1) { result = combine(result, tree[l]); l += 1; }
        if (r % 2 === 1) { r -= 1; result = combine(result, tree[r]); }
        l = Math.floor(l / 2); r = Math.floor(r / 2);
      }
      return result;
    },
  };
}

function makeValues(n: number, modulus: number, span: number): number[] {
  const values: number[] = [];
  for (let i = 0; i < n; i += 1) values.push((i * 7919) % modulus - span);
  return values;
}

function segG1Large(): { input: string; expectedOutput: string } {
  const n = 100000;
  const values = makeValues(n, 2000001, 1000000);
  const queries: number[][] = [[1, n], [1, 1], [n, n], [50001, n], [1, 50000]];
  for (let k = 0; k < 4995; k += 1) {
    const l = ((k * 37) % n) + 1;
    queries.push([l, Math.min(n, l + ((k * 13) % 5000))]);
  }
  const seg = makeSeg(values, Infinity, Math.min);
  const answers = queries.map(([l, r]) => seg.range(l, r));
  const tail = `${queries.map(([l, r]) => `${l} ${r}`).join("\n")}\n`;
  const input = `${n} ${queries.length}\n${values.join(" ")}\n${tail}`;
  return { input, expectedOutput: newlineOutput(answers) };
}

function segG2Large(): { input: string; expectedOutput: string } {
  const n = 100000, q = 5000;
  const values = makeValues(n, 20001, 10000);
  const seg = makeSeg(values, 0, (a, b) => a + b);
  const ops: string[] = [], answers: number[] = [];
  for (let k = 0; k < q; k += 1) {
    if (k % 5 === 0) {
      const l = ((k * 37) % n) + 1, r = Math.min(n, l + ((k * 13) % 90000));
      ops.push(`2 ${l} ${r}`);
      answers.push(seg.range(l, r));
    } else {
      const index = ((k * 7919) % n) + 1;
      const value = ((k * 104729) % 2000001) - 1000000;
      ops.push(`1 ${index} ${value}`);
      seg.set(index - 1, value);
    }
  }
  const input = `${n} ${q}\n${values.join(" ")}\n${ops.join("\n")}\n`;
  return { input, expectedOutput: newlineOutput(answers) };
}

function segE1Large(): { input: string; expectedOutput: string } {
  const n = 5000;
  const values: number[] = [];
  for (let i = 0; i < n; i += 1) values.push((i * 97) % 1000);
  const queries: number[][] = [];
  for (let k = 0; k < 5000; k += 1) {
    const l = ((k * 37) % n) + 1;
    queries.push([l, Math.min(n, l + ((k * 13) % 4000))]);
  }
  const answers = queries.map(([l, r]) => {
    let best = l;
    for (let i = l + 1; i <= r; i += 1) {
      if (values[i - 1] > values[best - 1]) best = i;
    }
    return best;
  });
  const tail = `${queries.map(([l, r]) => `${l} ${r}`).join("\n")}\n`;
  const input = `${n} ${queries.length}\n${values.join(" ")}\n${tail}`;
  return { input, expectedOutput: newlineOutput(answers) };
}

function segRangeLarge(n: number, q: number, every: number, mode: "add" | "assign", maxLen = 1): {
  input: string;
  expectedOutput: string;
} {
  const values = makeValues(n, 2001, 1000);
  const frozen = [...values];
  const diff = new Array<number>(n + 2).fill(0);
  const prefix = new Array<number>(n + 1).fill(0);
  const ops: string[] = [], answers: number[] = [];
  const querySpan = Math.max(1, Math.floor(n / 4));
  const updateSpan = mode === "add" ? querySpan : Math.max(1, Math.min(maxLen, n));
  for (let k = 0; k < q; k += 1) {
    const l = ((k * 37) % n) + 1;
    const span = k % every === 0 ? querySpan : updateSpan;
    const r = Math.min(n, l + ((k * 13) % span));
    if (k % every === 0) {
      ops.push(`2 ${l} ${r}`);
      let running = 0;
      prefix[0] = 0;
      for (let i = 1; i <= n; i += 1) {
        running += mode === "add" ? diff[i] : 0;
        prefix[i] = prefix[i - 1] + running + values[i - 1];
      }
      answers.push(prefix[r] - prefix[l - 1]);
    } else {
      const x = ((k * 104729) % 2001) - 1000;
      ops.push(`1 ${l} ${r} ${x}`);
      if (mode === "add") { diff[l] += x; diff[r + 1] -= x; }
      else for (let i = l; i <= r; i += 1) values[i - 1] = x;
    }
  }
  const input = `${n} ${q}\n${frozen.join(" ")}\n${ops.join("\n")}\n`;
  return { input, expectedOutput: newlineOutput(answers) };
}

function kadane(values: number[]): number {
  let best = values[0], running = values[0];
  for (let i = 1; i < values.length; i += 1) {
    running = Math.max(values[i], running + values[i]);
    best = Math.max(best, running);
  }
  return best;
}

function segX1Large(n: number, q: number, every: number): { input: string; expectedOutput: string } {
  const values = makeValues(n, 2001, 1000);
  const initial = [...values];
  const ops: string[] = [], answers: number[] = [];
  for (let k = 0; k < q; k += 1) {
    if (k % every === 0) {
      ops.push("2");
      answers.push(kadane(values));
    } else {
      const index = ((k * 7919) % n) + 1;
      const value = ((k * 104729) % 2001) - 1000;
      ops.push(`1 ${index} ${value}`);
      values[index - 1] = value;
    }
  }
  const input = `${n} ${q}\n${initial.join(" ")}\n${ops.join("\n")}\n`;
  return { input, expectedOutput: newlineOutput(answers) };
}

function segX2Large(n: number, q: number): { input: string; expectedOutput: string } {
  const values = makeValues(n, 2000001, 1000000);
  const positions = new Map<number, number[]>();
  values.forEach((value, index) => {
    const list = positions.get(value);
    if (list) list.push(index);
    else positions.set(value, [index]);
  });
  const seg = makeSeg(values, Infinity, Math.min);
  const queries: number[][] = [];
  const answers: string[] = [];
  for (let k = 0; k < q; k += 1) {
    const l = ((k * 37) % n) + 1;
    const r = Math.min(n, l + ((k * 13) % Math.max(1, n)));
    queries.push([l, r]);
    const min = seg.range(l, r);
    const list = positions.get(min) ?? [];
    const lower = (bound: number): number => {
      let lo = 0, hi = list.length;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (list[mid] < bound) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    };
    answers.push(`${min} ${lower(r) - lower(l - 1)}`);
  }
  const tail = `${queries.map(([l, r]) => `${l} ${r}`).join("\n")}\n`;
  const input = `${n} ${q}\n${values.join(" ")}\n${tail}`;
  return { input, expectedOutput: newlineOutput(answers) };
}

export const SEGMENT_TREE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m6-segment-tree-g1",
    title: "Range Minimum Query",
    statement:
      "সাদিয়ার ক্লাসের নম্বরের লম্বা তালিকা থেকে বারবার জিজ্ঞেস করা হয় — `l` থেকে `r` নম্বর পর্যন্ত (দুই প্রান্তসহ) সবচেয়ে **কম** নম্বর কত। মাঝে মাঝে একটা নম্বর বদলেও যায়।\n\n`n`টি পূর্ণসংখ্যার তালিকা এবং `q`টি প্রশ্ন দেওয়া থাকবে; প্রতিটি প্রশ্নে `l r` দেওয়া থাকে। প্রতিটি প্রশ্নের উত্তর আলাদা লাইনে প্রিন্ট করুন।\n\nউদাহরণ: তালিকা `3 1 4 1 5`, প্রশ্ন `2 4` → উত্তর `1` (নম্বর `1 4 1`-এর মধ্যে সবচেয়ে কম `1`)।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা। পরের `q` লাইনে প্রতিটিতে `l r`।",
    outputFormat: "`q` লাইনে উত্তর — প্রতিটি প্রশ্নের রেঞ্জের সর্বনিম্ন মান।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 100000`\n`1 <= l <= r <= n`\n`-10^9 <= a_i <= 10^9`",
    editorial:
      "### ধারণা\n\nপ্রতিটি সাব-অ্যারের সর্বনিম্ন মান আগে জমা রাখলে প্রশ্নের উত্তর মাত্র কয়েকটা জমা-রাখা অংশ মিলিয়েই পাওয়া যায়। সেগমেন্ট ট্রিতে প্রতিটি নোড একটা রেঞ্জের সর্বনিম্ন মান ধরে রাখে; রেঞ্জ কোয়েরিতে গাছ ধরে চললে সর্বোচ্চ `O(log n)` নোড মিলিয়ে `min` করলেই হয়। ইটারেটিভ লুপে বাম প্রান্ত থেকে ডান প্রান্ত পর্যন্ত দুই পাশ থেকে নোড তুলে নেওয়া হয়।\n\n### ধাপে ধাপে\n\n1. `n`-এর চেয়ে বড় প্রথম ২-এর ঘাত `size` বের করুন।\n2. পত্র নোডে অ্যারের মান বসান, নিরপেক্ষ মান `10**18` দিন।\n3. নিচ থেকে উপরে প্রতিটি নোডে `min(বাম, ডান)` বসান।\n4. প্রতিটি প্রশ্নে `l-1` থেকে `r` (অর্ধেক-খোলা) ধরে লুপ চালিয়ে ফল সংগ্রহ করুন।\n5. প্রতিটি উত্তর আলাদা লাইনে প্রিন্ট করুন।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) for _ in range(n)]\nsize = 1\nwhile size < n:\n    size *= 2\ntree = [10**18] * (2 * size)\nfor i, value in enumerate(arr):\n    tree[size + i] = value\nfor i in range(size - 1, 0, -1):\n    tree[i] = min(tree[2 * i], tree[2 * i + 1])\nout = []\nfor _ in range(q):\n    left = int(next(it)) - 1 + size\n    right = int(next(it)) + size\n    result = 10**18\n    while left < right:\n        if left & 1:\n            result = min(result, tree[left]); left += 1\n        if right & 1:\n            right -= 1; result = min(result, tree[right])\n        left >>= 1; right >>= 1\n    out.append(str(result))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n### কমপ্লেক্সিটি\n\nনির্মাণ `O(n)`, প্রতি প্রশ্ন `O(log n)`, স্পেস `O(n)` (নোড সংখ্যা `2 * size`)। সব প্রশ্ন মিলিয়ে `O((n + q) * log n)` — সরাসরি লুপের `O(n * q)` এর পরিবর্তে।\n\n### সাধারণ ভুল\n\n- ইনপুট ১-ভিত্তিক, কিন্তু লুপে যোগ-বিয়োগ ভুল হলে এক ধাপ সরে যায় (`right = r + size` সঠিক, কারণ ০-ভিত্তিক শেষ সূচক `r-1`, অর্ধেক-খোলা প্রান্ত `r`)।\n- নিরপেক্ষ মান `0` বসানো — তখন ঋণাত্মক অ্যারেতে উত্তর সবসময় `0` আসে।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Segment Tree", "Range Query", "Minimum"],
    tests: [
      { input: "5 3\n3 1 4 1 5\n1 5\n2 4\n3 3\n", expectedOutput: "1\n1\n4\n", isSample: true },
      { input: "1 2\n7\n1 1\n1 1\n", expectedOutput: "7\n7\n", isSample: true },
      { input: "4 2\n-5 -1 -9 -3\n1 4\n2 3\n", expectedOutput: "-9\n-9\n", isSample: false },
      { input: "5 1\n5 4 3 2 1\n2 5\n", expectedOutput: "1\n", isSample: false },
      { input: "6 2\n2 2 2 2 2 2\n1 6\n3 4\n", expectedOutput: "2\n2\n", isSample: false },
      { ...segG1Large(), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) for _ in range(n)]\nsize = 1\nwhile size < n:\n    size *= 2\ntree = [10**18] * (2 * size)\nfor i, value in enumerate(arr):\n    tree[size + i] = value\nfor i in range(size - 1, 0, -1):\n    tree[i] = min(tree[2 * i], tree[2 * i + 1])\nout = []\nfor _ in range(q):\n    left = int(next(it)) - 1 + size\n    right = int(next(it)) + size\n    result = 10**18\n    while left < right:\n        if left & 1:\n            result = min(result, tree[left]); left += 1\n        if right & 1:\n            right -= 1; result = min(result, tree[right])\n        left >>= 1; right >>= 1\n    out.append(str(result))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-segment-tree-g2",
    title: "Range Sum with Point Updates",
    statement:
      "তানভীর ল্যাবের সেন্সরের রিডিং একটা লিস্টে আছে। দুই ধরনের কাজ করতে হবে:\n\n- `1 i x` — `i` নম্বর ঘরের মান বদলে `x` করুন (সম্পূর্ণ প্রতিস্থাপন)।\n- `2 l r` — `l` থেকে `r` নম্বর পর্যন্ত (দুই প্রান্তসহ) মানগুলোর যোগফল প্রিন্ট করুন।\n\nশুধু `2` অপারেশনের উত্তর দিন।\n\nউদাহরণ: তালিকা `1 2 3 4 5`, প্রথম `2 1 5` → `15`; এরপর `1 3 10` (তৃতীয় ঘরে ১০) → আবার `2 1 5` → `22`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা। পরের `q` লাইনে অপারেশন — `1 i x` অথবা `2 l r`।",
    outputFormat: "প্রতিটি `2` অপারেশনের জন্য একটি করে লাইনে যোগফল।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 100000`\n`1 <= i, l <= r <= n`\n`-10^9 <= a_i, x <= 10^9`\nউত্তর ৬৪-বিট সাইনড সংখ্যার মধ্যে",
    editorial:
      "### ধারণা\n\nপ্রতিটি নোডে সেই রেঞ্জের যোগফল জমা থাকলে প্রশ্ন `O(log n)`-এ আসে, আর পয়েন্ট আপডেটে পত্র নোড বদলে উপরের প্রতিটি বাবা নোড তার দুই সন্তানের যোগফল দিয়ে হালনাগাদ হয় — মাত্র `O(log n)` নোড। prefix sum-এর মতো নয়, এখানে মাঝে মাঝে মান বদলালেও কোনো পুনর্গণনা লাগে না।\n\n### ধাপে ধাপে\n\n1. `size` বের করে ট্রি বানান; পত্রে অ্যারের মান, তারপর উপরে যোগফল বসান।\n2. অপারেশনের ধরন পড়ুন — `1` হলে সেট, `2` হলে কোয়েরি।\n3. সেটে পত্র নোডে মান বসিয়ে `node //= 2` করে উপরে উঠুন এবং প্রতিটি ধাপে যোগফল হালনাগাদ করুন।\n4. কোয়েরিতে অর্ধেক-খোলা লুপ চালিয়ে যোগফল সংগ্রহ করুন এবং প্রিন্ট করুন।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) for _ in range(n)]\nsize = 1\nwhile size < n:\n    size *= 2\ntree = [0] * (2 * size)\nfor i, value in enumerate(arr):\n    tree[size + i] = value\nfor i in range(size - 1, 0, -1):\n    tree[i] = tree[2 * i] + tree[2 * i + 1]\n\ndef point_set(index, value):\n    node = size + index\n    tree[node] = value\n    node //= 2\n    while node:\n        tree[node] = tree[2 * node] + tree[2 * node + 1]\n        node //= 2\n\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        point_set(int(next(it)) - 1, int(next(it)))\n    else:\n        left = int(next(it)) - 1 + size\n        right = int(next(it)) + size\n        result = 0\n        while left < right:\n            if left & 1:\n                result += tree[left]; left += 1\n            if right & 1:\n                right -= 1; result += tree[right]\n            left >>= 1; right >>= 1\n        out.append(str(result))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n### কমপ্লেক্সিটি\n\nনির্মাণ `O(n)`, সেট `O(log n)`, কোয়েরি `O(log n)`, স্পেস `O(n)`। `q = 100000`-এও কাজ মুহূর্তে শেষ হয়।\n\n### সাধারণ ভুল\n\n- সেটের জায়গায় যোগ (`tree[node] += value`) করে দেওয়া — প্রশ্ন প্রতিস্থাপন চায়, যোগ নয়।\n- পত্র থেকে উপরে উঠার সময় সন্তানের মান না পড়ে পুরোনো বাবার মান রেখে দেওয়া — প্রতিটি ধাপে পুনরায় যোগ করতে হবে।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Segment Tree", "Range Query", "Point Update"],
    tests: [
      { input: "5 4\n1 2 3 4 5\n2 1 5\n1 3 10\n2 1 5\n2 2 2\n", expectedOutput: "15\n22\n2\n", isSample: true },
      { input: "1 3\n5\n2 1 1\n1 1 0\n2 1 1\n", expectedOutput: "5\n0\n", isSample: true },
      { input: "4 2\n-1 -2 -3 -4\n2 1 4\n2 2 3\n", expectedOutput: "-10\n-5\n", isSample: false },
      { input: "3 3\n10 0 10\n1 2 99\n2 1 3\n2 1 3\n", expectedOutput: "119\n119\n", isSample: false },
      { input: "5 5\n0 0 0 0 0\n1 5 7\n2 5 5\n1 3 -2\n2 1 5\n2 3 4\n", expectedOutput: "7\n5\n-2\n", isSample: false },
      { ...segG2Large(), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) for _ in range(n)]\nsize = 1\nwhile size < n:\n    size *= 2\ntree = [0] * (2 * size)\nfor i, value in enumerate(arr):\n    tree[size + i] = value\nfor i in range(size - 1, 0, -1):\n    tree[i] = tree[2 * i] + tree[2 * i + 1]\n\ndef point_set(index, value):\n    node = size + index\n    tree[node] = value\n    node //= 2\n    while node:\n        tree[node] = tree[2 * node] + tree[2 * node + 1]\n        node //= 2\n\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        point_set(int(next(it)) - 1, int(next(it)))\n    else:\n        left = int(next(it)) - 1 + size\n        right = int(next(it)) + size\n        result = 0\n        while left < right:\n            if left & 1:\n                result += tree[left]; left += 1\n            if right & 1:\n                right -= 1; result += tree[right]\n            left >>= 1; right >>= 1\n        out.append(str(result))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-segment-tree-e1",
    title: "Index of the Maximum",
    statement:
      "রাফি জানতে চান ক্লাসের কোন নম্বরের ছাত্র নির্দিষ্ট রেঞ্জে সবচেয়ে ভালো করেছে। প্রতিটি প্রশ্নে `l r` দেওয়া থাকে; `l` থেকে `r` নম্বর পর্যন্ত (দুই প্রান্তসহ) সবচেয়ে বেশি মান যে ঘরে আছে, তার **সবচেয়ে ছোট ইনডেক্স** প্রিন্ট করুন (১-ভিত্তিক)।\n\nমান একাধিক ঘরে সমান থাকলে বামেরটাই ধরতে হবে।\n\nউদাহরণ: তালিকা `3 1 4 1 5`, প্রশ্ন `1 5` → সর্বাধিক `5`, ইনডেক্স `5`; প্রশ্ন `2 4` → সর্বাধিক `4`, ইনডেক্স `3`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা। পরের `q` লাইনে `l r`।",
    outputFormat: "`q` লাইনে উত্তর — সর্বাধিক মানের সবচেয়ে ছোট ইনডেক্স (১-ভিত্তিক)।",
    constraints: "`1 <= n <= 5000`\n`1 <= q <= 5000`\n`1 <= l <= r <= n`\n`-10^9 <= a_i <= 10^9`",
    editorial:
      "### ধারণা\n\nসেগমেন্ট ট্রির প্রতিটি নোডে এখানে একটা **জোড়া** রাখতে হবে: `(সর্বাধিক মান, সেই মানের প্রথম ইনডেক্স)`। দুই সন্তান মেলানোর নিয়ম — যার মান বড় সে জেতবে; মান সমান হলে ইনডেক্স ছোটটাই জেতবে। এই নিয়ম associative, তাই যেকোনো ক্রমে মিলিয়ে ফেললেও ফল একই থাকে — রেঞ্জের সত্যিকারের প্রথম সর্বাধিক ইনডেক্সই আসে।\n\n### ধাপে ধাপে\n\n1. ট্রি বানান; পত্রে `(মান, নিজ ইনডেক্স)` বসান।\n2. বিল্ডে প্রতিটি বাবা নোডে উপরের নিয়ম অনুযায়ী জোড়া বাছাই করুন।\n3. প্রতিটি প্রশ্নে একই অর্ধেক-খোলা লুপ, শুধু কম্বাইন ফাংশনটা জোড়ার নিয়ম অনুসারে।\n4. ফলের ইনডেক্সটা প্রিন্ট করুন।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) for _ in range(n)]\nsize = 1\nwhile size < n:\n    size *= 2\ntree = [(-10**18, 0)] * (2 * size)\nfor i, value in enumerate(arr):\n    tree[size + i] = (value, i + 1)\nfor i in range(size - 1, 0, -1):\n    a, b = tree[2 * i], tree[2 * i + 1]\n    tree[i] = a if (a[0] > b[0] or (a[0] == b[0] and a[1] < b[1])) else b\n\ndef better(x, y):\n    if x[0] > y[0] or (x[0] == y[0] and x[1] < y[1]):\n        return x\n    return y\n\nout = []\nfor _ in range(q):\n    left = int(next(it)) - 1 + size\n    right = int(next(it)) + size\n    best = (-10**18, 0)\n    while left < right:\n        if left & 1:\n            best = better(best, tree[left]); left += 1\n        if right & 1:\n            right -= 1; best = better(best, tree[right])\n        left >>= 1; right >>= 1\n    out.append(str(best[1]))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n### কমপ্লেক্সিটি\n\nনির্মাণ `O(n)`, প্রতি প্রশ্ন `O(log n)`, স্পেস `O(n)`। সরাসরি লুপে `O(n * q)` হয় — এখানে `n = q = 5000` হলেও ট্রি অনেক নিরাপদ।\n\n### সাধারণ ভুল\n\n- শুধু মান রেখে ইনডেক্স ভুলে যাওয়া — তখন সমান মানের ক্ষেত্রে ফল অনির্দিষ্ট হয়।\n- টাই-ব্রেকে ডানের ইনডেক্স ধরে নেওয়া — প্রশ্ন সবচেয়ে ছোট ইনডেক্স চায়।\n- নিরপেক্ষ জোড়া `(-10**18, 0)` না রেখে খালি তালিকা ধরে নেওয়া।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Segment Tree", "Range Query", "Argmax"],
    tests: [
      { input: "5 2\n3 1 4 1 5\n1 5\n2 4\n", expectedOutput: "5\n3\n", isSample: true },
      { input: "3 1\n7 7 7\n1 3\n", expectedOutput: "1\n", isSample: true },
      { input: "4 1\n9 1 2 3\n1 4\n", expectedOutput: "1\n", isSample: false },
      { input: "3 2\n-5 -2 -2\n1 3\n2 3\n", expectedOutput: "2\n2\n", isSample: false },
      { input: "5 3\n1 9 3 9 2\n1 3\n3 5\n1 5\n", expectedOutput: "2\n4\n2\n", isSample: false },
      { ...segE1Large(), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) for _ in range(n)]\nsize = 1\nwhile size < n:\n    size *= 2\ntree = [(-10**18, 0)] * (2 * size)\nfor i, value in enumerate(arr):\n    tree[size + i] = (value, i + 1)\nfor i in range(size - 1, 0, -1):\n    a, b = tree[2 * i], tree[2 * i + 1]\n    tree[i] = a if (a[0] > b[0] or (a[0] == b[0] and a[1] < b[1])) else b\n\ndef better(x, y):\n    if x[0] > y[0] or (x[0] == y[0] and x[1] < y[1]):\n        return x\n    return y\n\nout = []\nfor _ in range(q):\n    left = int(next(it)) - 1 + size\n    right = int(next(it)) + size\n    best = (-10**18, 0)\n    while left < right:\n        if left & 1:\n            best = better(best, tree[left]); left += 1\n        if right & 1:\n            right -= 1; best = better(best, tree[right])\n        left >>= 1; right >>= 1\n    out.append(str(best[1]))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-segment-tree-m1",
    title: "Range Add, Range Sum",
    statement:
      "নুসরাত মাসিক খরচের হিসাব রাখছেন — কয়েকটা সময়ের পুরো একটা রেঞ্জে টাকা যোগ হয়, আবার কখনো জানতে চান রেঞ্জটার মোট কত। দুই ধরনের অপারেশন দেওয়া থাকবে:\n\n- `1 l r x` — সব ঘরে (`l` থেকে `r`, দুই প্রান্তসহ) `x` যোগ করুন।\n- `2 l r` — `l` থেকে `r` পর্যন্ত যোগফল প্রিন্ট করুন।\n\nপ্রতিটি যোগের পরেই ঘরগুলোর মান বদলে যায়, তাই পুরোনো প্রশ্নের উত্তরও নতুন অবস্থার হিসেবে আসতে হবে।\n\nউদাহরণ: তালিকা `1 2 3 4 5`; `1 2 4 10` → `1 12 13 14 5`; `2 1 5` → `45`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা। পরের `q` লাইনে অপারেশন — `1 l r x` অথবা `2 l r`।",
    outputFormat: "প্রতিটি `2` অপারেশনের জন্য একটি করে লাইনে যোগফল।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 50000`\n`1 <= l <= r <= n`\n`-10^9 <= x <= 10^9`\nউত্তর ৬৪-বিট সাইনড সংখ্যার মধ্যে",
    editorial:
      "### ধারণা\n\nরেঞ্জ যোগ + রেঞ্জ যোগফল হলো **lazy propagation**-এর ক্লাসিক ব্যবহার। পুরোপুরি রেঞ্জে মিলে যাওয়া নোডে সঙ্গে সঙ্গে `tree[node] += x * নোডের দৈর্ঘ্য` লেখে আমরা, আর সেই যোগটাকে `lazy[node]`-এ টাল করে রাখি — সন্তানদের এখনো জানার দরকার নেই। নিচে যাওয়ার আগে `push` করে ট্যাগ দুই সন্তানে ছড়িয়ে দিই। এতে রেঞ্জ আপডেটও `O(log n)`-এ থাকে।\n\n### ধাপে ধাপে\n\n1. পত্র নোডে মান, প্রতিটি নোডে দৈর্ঘ্য (`length`) এবং `lazy` ট্যাগ রাখুন (শুরুতে ০)।\n2. `apply(node, x)`: `tree[node] += x * length[node]` এবং `lazy[node] += x`।\n3. `push(node)`: ট্যাগ থাকলে দুই সন্তানে `apply` করে `lazy[node] = 0` করুন।\n4. আপডেট: পুরো ম্যাচ হলে `apply`, নাহলে `push` করে দুই অর্ধেকে নামুন, ফিরে এসে যোগফল হালনাগাদ করুন।\n5. কোয়েরি: একইভাবে নামুন, পুরো ম্যাচ নোডের মান যোগ করুন।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) for _ in range(n)]\nsize = 1\nwhile size < n:\n    size *= 2\nlength = [0] * (2 * size)\nfor i in range(size):\n    length[size + i] = 1\nfor i in range(size - 1, 0, -1):\n    length[i] = length[2 * i] + length[2 * i + 1]\ntree = [0] * (2 * size)\nlazy = [0] * (2 * size)\nfor i, value in enumerate(arr):\n    tree[size + i] = value\nfor i in range(size - 1, 0, -1):\n    tree[i] = tree[2 * i] + tree[2 * i + 1]\n\ndef apply(node, value):\n    tree[node] += value * length[node]\n    lazy[node] += value\n\ndef push(node):\n    if lazy[node]:\n        apply(node * 2, lazy[node])\n        apply(node * 2 + 1, lazy[node])\n        lazy[node] = 0\n\ndef update(node, nl, nr, l, r, value):\n    if r <= nl or nr <= l:\n        return\n    if l <= nl and nr <= r:\n        apply(node, value)\n        return\n    push(node)\n    mid = (nl + nr) // 2\n    update(node * 2, nl, mid, l, r, value)\n    update(node * 2 + 1, mid, nr, l, r, value)\n    tree[node] = tree[node * 2] + tree[node * 2 + 1]\n\ndef query(node, nl, nr, l, r):\n    if r <= nl or nr <= l:\n        return 0\n    if l <= nl and nr <= r:\n        return tree[node]\n    push(node)\n    mid = (nl + nr) // 2\n    return query(node * 2, nl, mid, l, r) + query(node * 2 + 1, mid, nr, l, r)\n\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        l = int(next(it)) - 1; r = int(next(it)); x = int(next(it))\n        update(1, 0, size, l, r, x)\n    else:\n        l = int(next(it)) - 1; r = int(next(it))\n        out.append(str(query(1, 0, size, l, r)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n### কমপ্লেক্সিটি\n\nপ্রতি অপারেশন `O(log n)`, মোট `O((n + q) * log n)`, স্পেস `O(n)` (লেজি অ্যারেসহ)। রেঞ্জ আপডেট না করে প্রতিটি ঘরে গিয়ে যোগ করলে `O(n)` প্রতি অপারেশন — এখানকার পুরো মূল কথা সেটা এড়ানো।\n\n### সাধারণ ভুল\n\n- `push` না করে কোয়েরি/আপডেট নিচে নামানো — বাবার ট্যাগ ছড়ায় না, সন্তানের মান পুরোনো থাকে।\n- `apply`-এ `length[node]` বাদ দিয়ে শুধু `tree[node] += x` — তখন পুরো রেঞ্জের যোগফল ভুল হয়।\n- রেঞ্জের প্রান্ত ভুল: রিকার্সিভ কোডে উপরের বাঁধা হলো অর্ধেক-খোলা `[l, r)`, তাই ইনপুটের `r` সরাসরি বসাতে হবে (`r` ১-ভিত্তিক ইনক্লুসিভ → ০-ভিত্তিক এক্সক্লুসিভ `r`)।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 4000,
    memoryLimitMb: 256,
    tags: ["Segment Tree", "Lazy Propagation", "Range Update"],
    tests: [
      { input: "5 4\n1 2 3 4 5\n1 2 4 10\n2 1 5\n1 1 1 -1\n2 1 5\n", expectedOutput: "45\n44\n", isSample: true },
      { input: "3 2\n0 0 0\n2 1 3\n1 1 3 5\n", expectedOutput: "0\n", isSample: true },
      { input: "4 3\n1 1 1 1\n1 1 4 -1\n2 1 4\n2 2 2\n", expectedOutput: "0\n0\n", isSample: false },
      { input: "1 2\n10\n1 1 1 5\n2 1 1\n", expectedOutput: "15\n", isSample: false },
      { input: "6 5\n0 5 0 5 0 5\n1 2 6 5\n2 1 6\n1 1 3 -5\n2 1 6\n2 4 4\n", expectedOutput: "40\n25\n10\n", isSample: false },
      { ...segRangeLarge(100000, 50000, 100, "add"), isSample: false },
      { ...segRangeLarge(2000, 30000, 2, "add"), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) for _ in range(n)]\nsize = 1\nwhile size < n:\n    size *= 2\nlength = [0] * (2 * size)\nfor i in range(size):\n    length[size + i] = 1\nfor i in range(size - 1, 0, -1):\n    length[i] = length[2 * i] + length[2 * i + 1]\ntree = [0] * (2 * size)\nlazy = [0] * (2 * size)\nfor i, value in enumerate(arr):\n    tree[size + i] = value\nfor i in range(size - 1, 0, -1):\n    tree[i] = tree[2 * i] + tree[2 * i + 1]\n\ndef apply(node, value):\n    tree[node] += value * length[node]\n    lazy[node] += value\n\ndef push(node):\n    if lazy[node]:\n        apply(node * 2, lazy[node])\n        apply(node * 2 + 1, lazy[node])\n        lazy[node] = 0\n\ndef update(node, nl, nr, l, r, value):\n    if r <= nl or nr <= l:\n        return\n    if l <= nl and nr <= r:\n        apply(node, value)\n        return\n    push(node)\n    mid = (nl + nr) // 2\n    update(node * 2, nl, mid, l, r, value)\n    update(node * 2 + 1, mid, nr, l, r, value)\n    tree[node] = tree[node * 2] + tree[node * 2 + 1]\n\ndef query(node, nl, nr, l, r):\n    if r <= nl or nr <= l:\n        return 0\n    if l <= nl and nr <= r:\n        return tree[node]\n    push(node)\n    mid = (nl + nr) // 2\n    return query(node * 2, nl, mid, l, r) + query(node * 2 + 1, mid, nr, l, r)\n\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        l = int(next(it)) - 1; r = int(next(it)); x = int(next(it))\n        update(1, 0, size, l, r, x)\n    else:\n        l = int(next(it)) - 1; r = int(next(it))\n        out.append(str(query(1, 0, size, l, r)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-segment-tree-h1",
    title: "Range Assign, Range Sum",
    statement:
      "ল্যাবের তাপমাত্রা সেন্সরের নির্দিষ্ট রেঞ্জের সব রিডিং একসাথে নতুন মানে সেট করতে হয়, তারপর মোট যোগফল জানতে দরকার পড়ে। দুই ধরনের অপারেশন:\n\n- `1 l r x` — `l` থেকে `r` পর্যন্ত (দুই প্রান্তসহ) **প্রতিটি** ঘরের মান `x` বানিয়ে দিন।\n- `2 l r` — `l` থেকে `r` পর্যন্ত যোগফল প্রিন্ট করুন।\n\nমনে রাখবেন এটা যোগ নয়, পুরো প্রতিস্থাপন — পরের অপারেশনের আগের মান বদলে যায়।\n\nউদাহরণ: তালিকা `1 2 3 4 5`; `1 2 4 0` → `1 0 0 0 5`; `2 1 5` → `6`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা। পরের `q` লাইনে অপারেশন — `1 l r x` অথবা `2 l r`।",
    outputFormat: "প্রতিটি `2` অপারেশনের জন্য একটি করে লাইনে যোগফল।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 50000`\n`1 <= l <= r <= n`\n`-10^9 <= x <= 10^9`\nউত্তর ৬৪-বিট সাইনড সংখ্যার মধ্যে",
    editorial:
      "### ধারণা\n\nAssign (প্রতিস্থাপন) ট্যাগ lazy-এর আরেকটা রূপ, কিন্তু একটা পার্থক্য আছে: যোগের ট্যাগ একত্রিত হয় (`+=`), আর assign-এর ট্যাগ **নতুন ট্যাগ পুরোনোটাকে ঠেকায়ে দেয়**। তাই `apply(node, x)` লিখলে `tree[node] = x * length[node]` এবং `lazy[node] = x` (বিয়োগ নয়, সমান)। নোডের মান তখন নির্ভর করে শুধু দৈর্ঘ্যের উপর, কারণ পুরো রেঞ্জের মান একই `x`।\n\n### ধাপে ধাপে\n\n1. `tree`, `lazy` (শুরুতে `None` মানে কোনো ট্যাগ নেই) এবং প্রতিটি নোডের `length` রাখুন।\n2. `apply(node, x)`: `tree[node] = x * length[node]`, `lazy[node] = x`।\n3. `push(node)`: ট্যাগ থাকলে দুই সন্তানে `apply` করে `lazy[node] = None` করুন — সন্তানের নিজের পুরোনো ট্যাগ নতুনটা দ্বারা মুছে যায়।\n4. আপডেট ও কোয়েরি আগের লেজি কোডের মতোই — শুধু `apply`-এর অর্থ বদলেছে।\n5. সব উত্তর এক এক লাইনে প্রিন্ট করুন।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) for _ in range(n)]\nsize = 1\nwhile size < n:\n    size *= 2\nlength = [0] * (2 * size)\nfor i in range(size):\n    length[size + i] = 1\nfor i in range(size - 1, 0, -1):\n    length[i] = length[2 * i] + length[2 * i + 1]\ntree = [0] * (2 * size)\nlazy = [None] * (2 * size)\nfor i, value in enumerate(arr):\n    tree[size + i] = value\nfor i in range(size - 1, 0, -1):\n    tree[i] = tree[2 * i] + tree[2 * i + 1]\n\ndef apply(node, value):\n    tree[node] = value * length[node]\n    lazy[node] = value\n\ndef push(node):\n    if lazy[node] is not None:\n        apply(node * 2, lazy[node])\n        apply(node * 2 + 1, lazy[node])\n        lazy[node] = None\n\ndef update(node, nl, nr, l, r, value):\n    if r <= nl or nr <= l:\n        return\n    if l <= nl and nr <= r:\n        apply(node, value)\n        return\n    push(node)\n    mid = (nl + nr) // 2\n    update(node * 2, nl, mid, l, r, value)\n    update(node * 2 + 1, mid, nr, l, r, value)\n    tree[node] = tree[node * 2] + tree[node * 2 + 1]\n\ndef query(node, nl, nr, l, r):\n    if r <= nl or nr <= l:\n        return 0\n    if l <= nl and nr <= r:\n        return tree[node]\n    push(node)\n    mid = (nl + nr) // 2\n    return query(node * 2, nl, mid, l, r) + query(node * 2 + 1, mid, nr, l, r)\n\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        l = int(next(it)) - 1; r = int(next(it)); x = int(next(it))\n        update(1, 0, size, l, r, x)\n    else:\n        l = int(next(it)) - 1; r = int(next(it))\n        out.append(str(query(1, 0, size, l, r)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n### কমপ্লেক্সিটি\n\nপ্রতি অপারেশন `O(log n)`, মোট `O((n + q) * log n)`, স্পেস `O(n)`। assign-এর পরে পুরো রেঞ্জের মান এক হয়ে যায় বলে কখনো কখনো সম্পূর্ণ নোড একসাথে বাদ দেওয়াও যায় — তবে সাধারণ লেজি-ই যথেষ্ট।\n\n### সাধারণ ভুল\n\n- `apply`-এ `lazy[node] += value` লিখে ফেলা — assign-এ `=` লাগে, যোগ নয়।\n- `lazy` শূন্য ধরে `None`-এর বদলে অন্য সেন্টিনেল ব্যবহার করা — তখন সত্যিকারের `0` অ্যাসাইনমেন্টটাও ট্যাগ হিসেবে বাদ পড়ে।\n- পুরোনো লেজি যোগের কোড থেকে কপি করে `+=` রেখে দেওয়া — ফল ধীরে ধীরে সব জায়গায় ভুল হয়।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 4000,
    memoryLimitMb: 256,
    tags: ["Segment Tree", "Lazy Propagation", "Range Assign"],
    tests: [
      { input: "5 4\n1 2 3 4 5\n1 2 4 0\n2 1 5\n1 1 5 7\n2 1 5\n", expectedOutput: "6\n35\n", isSample: true },
      { input: "3 2\n5 5 5\n1 2 2 9\n2 1 3\n", expectedOutput: "19\n", isSample: true },
      { input: "4 3\n1 2 3 4\n1 1 3 -1\n1 3 4 -2\n2 1 4\n", expectedOutput: "-6\n", isSample: false },
      { input: "3 3\n1 2 3\n1 1 3 0\n1 1 3 10\n2 1 3\n", expectedOutput: "30\n", isSample: false },
      { input: "2 4\n7 -3\n1 1 1 4\n2 1 2\n1 2 2 1\n2 1 2\n", expectedOutput: "1\n5\n", isSample: false },
      { ...segRangeLarge(100000, 50000, 100, "assign", 200), isSample: false },
      { ...segRangeLarge(1000, 30000, 2, "assign", 1000), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) for _ in range(n)]\nsize = 1\nwhile size < n:\n    size *= 2\nlength = [0] * (2 * size)\nfor i in range(size):\n    length[size + i] = 1\nfor i in range(size - 1, 0, -1):\n    length[i] = length[2 * i] + length[2 * i + 1]\ntree = [0] * (2 * size)\nlazy = [None] * (2 * size)\nfor i, value in enumerate(arr):\n    tree[size + i] = value\nfor i in range(size - 1, 0, -1):\n    tree[i] = tree[2 * i] + tree[2 * i + 1]\n\ndef apply(node, value):\n    tree[node] = value * length[node]\n    lazy[node] = value\n\ndef push(node):\n    if lazy[node] is not None:\n        apply(node * 2, lazy[node])\n        apply(node * 2 + 1, lazy[node])\n        lazy[node] = None\n\ndef update(node, nl, nr, l, r, value):\n    if r <= nl or nr <= l:\n        return\n    if l <= nl and nr <= r:\n        apply(node, value)\n        return\n    push(node)\n    mid = (nl + nr) // 2\n    update(node * 2, nl, mid, l, r, value)\n    update(node * 2 + 1, mid, nr, l, r, value)\n    tree[node] = tree[node * 2] + tree[node * 2 + 1]\n\ndef query(node, nl, nr, l, r):\n    if r <= nl or nr <= l:\n        return 0\n    if l <= nl and nr <= r:\n        return tree[node]\n    push(node)\n    mid = (nl + nr) // 2\n    return query(node * 2, nl, mid, l, r) + query(node * 2 + 1, mid, nr, l, r)\n\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        l = int(next(it)) - 1; r = int(next(it)); x = int(next(it))\n        update(1, 0, size, l, r, x)\n    else:\n        l = int(next(it)) - 1; r = int(next(it))\n        out.append(str(query(1, 0, size, l, r)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-segment-tree-x1",
    title: "Maximum Subarray Sum",
    statement:
      "রাফি সেন্সরের রিডিংয়ের ধারা দেখছেন — কোনো **পরপর** একগুচ্ছ ঘর ধরে তাদের যোগফল সবচেয়ে বড় কত? ঘরগুলো থামতে হবে না, কিন্তু পরপর থাকতে হবে এবং অন্তত একটা ঘর নিতে হবে।\n\nদুই ধরনের অপারেশন:\n\n- `1 i x` — `i` নম্বর ঘরের মান `x` করে দিন।\n- `2` — পুরো লিস্টের সর্বাধিক সাবঅ্যারে যোগফল প্রিন্ট করুন।\n\nসব মান ঋণাত্মক হলে অন্তত সবচেয়ে বড় (কম ঋণাত্মক) একটা ঘরটা ধরতে হবে।\n\nউদাহরণ: `1 2 -3 4 5` → উত্তর `9` (`4 + 5`)।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা। পরের `q` লাইনে অপারেশন — `1 i x` অথবা `2`।",
    outputFormat: "প্রতিটি `2` অপারেশনের জন্য একটি করে লাইনে সর্বাধিক সাবঅ্যারে যোগফল।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 100000`\n`1 <= i <= n`\n`-10^9 <= a_i, x <= 10^9`\nউত্তর ৬৪-বিট সাইনড সংখ্যার মধ্যে",
    editorial:
      "### ধারণা\n\nএটা ক্লাসিক Kadane-এর সেগমেন্ট ট্রি সংস্করণ। প্রতিটি নোডে চারটা মান রাখতে হবে: `total` (পুরো রেঞ্জের যোগ), `prefix` (প্রথম থেকে শুরু করে সর্বাধিক যোগ), `suffix` (শেষ পর্যন্ত গিয়ে সর্বাধিক যোগ) আর `best` (রেঞ্জের ভেতরের সর্বাধিক সাবঅ্যারে যোগ)। দুই সন্তান মিলালে `total = বাম + ডান`, `prefix = max(বাম.prefix, বাম.total + ডান.prefix)`, `suffix = max(ডান.suffix, ডান.total + বাম.suffix)`, `best = max(বাম.best, ডান.best, বাম.suffix + ডান.prefix)`। উত্তর হলো রুটের `best`।\n\n### ধাপে ধাপে\n\n1. নিরপেক্ষ জোড়া `(0, -10**18, -10**18, -10**18)` দিয়ে শুরু করুন; পত্রে প্রত্যেকটাকে `(মান, মান, মান, মান)` করুন।\n2. বিল্ডে উপরের চারটা সূত্র প্রয়োগ করুন।\n3. `1 i x`: পত্র বদলে উপরে উঠতে উঠতে এই চারটা মান পুনরায় হিসাব করুন।\n4. `2`: রুটের `best` প্রিন্ট করুন — পুরো অ্যারেই রুট কভার করে।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) for _ in range(n)]\nsize = 1\nwhile size < n:\n    size *= 2\nNEG = -10**18\ntree = [(0, NEG, NEG, NEG)] * (2 * size)\nfor i, value in enumerate(arr):\n    tree[size + i] = (value, value, value, value)\nfor i in range(size - 1, 0, -1):\n    a, b = tree[2 * i], tree[2 * i + 1]\n    tree[i] = (a[0] + b[0], max(a[1], a[0] + b[1]),\n               max(b[2], b[0] + a[2]), max(a[3], b[3], a[2] + b[1]))\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        node = size + int(next(it)) - 1\n        value = int(next(it))\n        tree[node] = (value, value, value, value)\n        node //= 2\n        while node:\n            a, b = tree[2 * node], tree[2 * node + 1]\n            tree[node] = (a[0] + b[0], max(a[1], a[0] + b[1]),\n                          max(b[2], b[0] + a[2]), max(a[3], b[3], a[2] + b[1]))\n            node //= 2\n    else:\n        out.append(str(tree[1][3]))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n### কমপ্লেক্সিটি\n\nনির্মাণ `O(n)`, পয়েন্ট আপডেট `O(log n)`, কোয়েরি `O(1)` (শুধু রুট), স্পেস `O(n)`। কোয়েরি প্রতিবার পুরো অ্যারেতে Kadane চালালে `O(n)` — এখানে সেটা প্রতি অপারেশন `O(log n)`-এ নেমে এসেছে।\n\n### সাধারণ ভুল\n\n- সাবঅ্যারে **খালি** রাখার অনুমতি দিলে উত্তর সবসময় `0` হয়ে যায় — প্রশ্ন অন্তত একটা ঘর চায়, তাই সব ঋণাত্মক হলেও একটা ঘর বেছে নিতে হবে।\n- নিরপেক্ষ `prefix`/`suffix`-এ `0` বসানো — তখন ঋণাত্মক সাবঅ্যারের বদলে শূন্য বেছে নেওয়া হয়, ফল ভুল হয়।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Segment Tree", "Dynamic Programming", "Subarray"],
    tests: [
      { input: "5 5\n1 2 -3 4 5\n2\n1 3 10\n2\n1 5 -1\n2\n", expectedOutput: "9\n22\n17\n", isSample: true },
      { input: "3 2\n-5 -2 -7\n2\n2\n", expectedOutput: "-2\n-2\n", isSample: true },
      { input: "1 1\n42\n2\n", expectedOutput: "42\n", isSample: false },
      { input: "4 3\n1 2 3 4\n2\n1 2 -10\n2\n", expectedOutput: "10\n7\n", isSample: false },
      { input: "6 5\n5 -5 5 -5 5 -5\n2\n1 4 10\n2\n1 3 -100\n2\n", expectedOutput: "5\n20\n15\n", isSample: false },
      { ...segX1Large(100000, 50000, 100), isSample: false },
      { ...segX1Large(1000, 30000, 2), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) for _ in range(n)]\nsize = 1\nwhile size < n:\n    size *= 2\nNEG = -10**18\ntree = [(0, NEG, NEG, NEG)] * (2 * size)\nfor i, value in enumerate(arr):\n    tree[size + i] = (value, value, value, value)\nfor i in range(size - 1, 0, -1):\n    a, b = tree[2 * i], tree[2 * i + 1]\n    tree[i] = (a[0] + b[0], max(a[1], a[0] + b[1]),\n               max(b[2], b[0] + a[2]), max(a[3], b[3], a[2] + b[1]))\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        node = size + int(next(it)) - 1\n        value = int(next(it))\n        tree[node] = (value, value, value, value)\n        node //= 2\n        while node:\n            a, b = tree[2 * node], tree[2 * node + 1]\n            tree[node] = (a[0] + b[0], max(a[1], a[0] + b[1]),\n                          max(b[2], b[0] + a[2]), max(a[3], b[3], a[2] + b[1]))\n            node //= 2\n    else:\n        out.append(str(tree[1][3]))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-segment-tree-x2",
    title: "Minimum and Its Count",
    statement:
      "পরীক্ষার নম্বরের তালিকায় শিক্ষক জানতে চান নির্দিষ্ট রেঞ্জে সর্বনিম্ন নম্বরটি কত এবং সেই নম্বরটি কয়বার এসেছে।\n\nপ্রতিটি প্রশ্নে `l r` দেওয়া থাকে; দুটি সংখ্যা প্রিন্ট করুন — রেঞ্জের সর্বনিম্ন মান এবং সেই মান কতবার আছে (স্পেস দিয়ে আলাদা)।\n\nউদাহরণ: তালিকা `3 1 4 1 5`, প্রশ্ন `1 5` → `1 2` (সর্বনিম্ন `1`, দুইবার)।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা। পরের `q` লাইনে `l r`।",
    outputFormat: "`q` লাইনে উত্তর — `মান সংখ্যা`, স্পেস দিয়ে আলাদা।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 100000`\n`1 <= l <= r <= n`\n`-10^9 <= a_i <= 10^9`",
    editorial:
      "### ধারণা\n\nএকই সেগমেন্ট ট্রি, শুধু নোডের মান একটু বদলে জোড়া করা: `(সর্বনিম্ন মান, সেই মানের সংখ্যা)`। দুই সন্তান মিলানোর নিয়ম — যার মান ছোট সে জেতবে; মান সমান হলে সংখ্যাগুলো **যোগ** হবে। এই নিয়ম associative, তাই রেঞ্জের সত্যিকারের মিনিমাম আর তার ঘটনাসংখ্যা ঠিক আসে।\n\n### ধাপে ধাপে\n\n1. পত্রে প্রতিটি ঘরকে `(মান, 1)` ধরে বসান; নিরপেক্ষ `(10**18, 0)`।\n2. বিল্ডে মান বাছাই, সমান হলে সংখ্যা যোগ।\n3. কোয়েরি লুপে একই নিয়মে সংগ্রহ করুন — মান ছোট হলে বসান, সমান হলে যোগ করুন।\n4. দুটি মান স্পেস দিয়ে প্রিন্ট করুন।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) for _ in range(n)]\nsize = 1\nwhile size < n:\n    size *= 2\ntree = [(10**18, 0)] * (2 * size)\nfor i, value in enumerate(arr):\n    tree[size + i] = (value, 1)\nfor i in range(size - 1, 0, -1):\n    a, b = tree[2 * i], tree[2 * i + 1]\n    tree[i] = a if a[0] < b[0] else (b if b[0] < a[0] else (a[0], a[1] + b[1]))\n\ndef merge(x, y):\n    if x[0] < y[0]:\n        return x\n    if y[0] < x[0]:\n        return y\n    return (x[0], x[1] + y[1])\n\nout = []\nfor _ in range(q):\n    left = int(next(it)) - 1 + size\n    right = int(next(it)) + size\n    best = (10**18, 0)\n    while left < right:\n        if left & 1:\n            best = merge(best, tree[left]); left += 1\n        if right & 1:\n            right -= 1; best = merge(best, tree[right])\n        left >>= 1; right >>= 1\n    out.append(str(best[0]) + ' ' + str(best[1]))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n### কমপ্লেক্সিটি\n\nনির্মাণ `O(n)`, প্রতি প্রশ্ন `O(log n)`, স্পেস `O(n)`। আলাদা করে পুরো রেঞ্জে ঘুরে গোনালে `O(n * q)` — এখানে `n = q = 100000` চলে যেতে পারে না।\n\n### সাধারণ ভুল\n\n- মান সমান হলে সংখ্যা যোগ না করে একটা কপি রেখে দেওয়া — তখন কাউন্ট `1` থেকে বাড়ে না।\n- নিরপেক্ষ মান হিসেবে `(0, 0)` বসানো — তখন ঋণাত্মক অ্যারেতে `0` সর্বনিম্ন ধরা হয়ে যায়। মানের জন্য বড় সংখ্যা, সংখ্যার জন্য `0` ঠিক।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Segment Tree", "Range Query", "Counting"],
    tests: [
      { input: "5 3\n3 1 4 1 5\n1 5\n2 4\n1 3\n", expectedOutput: "1 2\n1 2\n1 1\n", isSample: true },
      { input: "1 1\n7\n1 1\n", expectedOutput: "7 1\n", isSample: true },
      { input: "4 2\n9 9 9 9\n1 4\n2 3\n", expectedOutput: "9 4\n9 2\n", isSample: false },
      { input: "3 2\n-4 -4 -7\n1 3\n1 2\n", expectedOutput: "-7 1\n-4 2\n", isSample: false },
      { input: "6 2\n5 3 5 3 5 3\n1 6\n2 4\n", expectedOutput: "3 3\n3 2\n", isSample: false },
      { ...segX2Large(100000, 5000), isSample: false },
      { ...segX2Large(5000, 5000), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) for _ in range(n)]\nsize = 1\nwhile size < n:\n    size *= 2\ntree = [(10**18, 0)] * (2 * size)\nfor i, value in enumerate(arr):\n    tree[size + i] = (value, 1)\nfor i in range(size - 1, 0, -1):\n    a, b = tree[2 * i], tree[2 * i + 1]\n    tree[i] = a if a[0] < b[0] else (b if b[0] < a[0] else (a[0], a[1] + b[1]))\n\ndef merge(x, y):\n    if x[0] < y[0]:\n        return x\n    if y[0] < x[0]:\n        return y\n    return (x[0], x[1] + y[1])\n\nout = []\nfor _ in range(q):\n    left = int(next(it)) - 1 + size\n    right = int(next(it)) + size\n    best = (10**18, 0)\n    while left < right:\n        if left & 1:\n            best = merge(best, tree[left]); left += 1\n        if right & 1:\n            right -= 1; best = merge(best, tree[right])\n        left >>= 1; right >>= 1\n    out.append(str(best[0]) + ' ' + str(best[1]))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
];
