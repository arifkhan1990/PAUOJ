import type { SeedProblem } from "../../seed-problems";
import { newlineOutput, numbersInput } from "../generated-tests";
import { makeFenwick } from "./fenwick-tree-problems";

function fenE2Large(): { input: string; expectedOutput: string } {
  const n = 100000, q = 50000;
  const values: number[] = [];
  for (let i = 0; i < n; i += 1) values.push(((i * 7919) % 2000001) - 1000000);
  const frozen = [...values];
  const bit = makeFenwick(n);
  values.forEach((value, index) => bit.add(index + 1, value));
  const ops: string[] = [];
  const answers: number[] = [];
  for (let k = 0; k < q; k += 1) {
    if (k % 20 === 0) {
      const l = ((k * 37) % n) + 1;
      const r = Math.min(n, l + ((k * 13) % 10000));
      ops.push(`2 ${l} ${r}`);
      answers.push(bit.range(l, r));
    } else {
      const i = ((k * 7919) % n) + 1;
      const x = ((k * 104729) % 2000001) - 1000000;
      ops.push(`1 ${i} ${x}`);
      bit.add(i, x);
    }
  }
  const input = `${n} ${q}\n${frozen.join(" ")}\n${ops.join("\n")}\n`;
  return { input, expectedOutput: newlineOutput(answers) };
}

function fenE3Large(): { input: string; expectedOutput: string } {
  const m = 100000;
  const bit = makeFenwick(100000);
  const ops: string[] = [];
  const answers: number[] = [];
  for (let k = 0; k < 85000; k += 1) {
    const x = ((k * 104729) % 100000) + 1;
    ops.push(`1 ${x}`);
    bit.add(x, 1);
  }
  for (let k = 0; k < 15000; k += 1) {
    const x = ((k * 7919) % 100000) + 1;
    ops.push(`2 ${x}`);
    answers.push(bit.prefix(x));
  }
  const input = `${m}\n${ops.join("\n")}\n`;
  return { input, expectedOutput: newlineOutput(answers) };
}

function lisLength(values: number[]): number {
  const tails: number[] = [];
  for (const value of values) {
    let lo = 0, hi = tails.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (tails[mid] < value) lo = mid + 1;
      else hi = mid;
    }
    if (lo === tails.length) tails.push(value);
    else tails[lo] = value;
  }
  return tails.length;
}

function fenM2Large(): { input: string; expectedOutput: string } {
  const n = 100000;
  const values: number[] = [];
  for (let i = 0; i < n; i += 1) values.push(((i * 48271) % 2000001) - 1000000);
  return { input: numbersInput(values), expectedOutput: newlineOutput([lisLength(values)]) };
}

function fenM3Large(): { input: string; expectedOutput: string } {
  const m = 100000;
  const bit = makeFenwick(100000);
  const counts = new Array<number>(100001).fill(0);
  const inside: number[] = [];
  const ops: string[] = [];
  const answers: number[] = [];
  for (let k = 0; k < 70000; k += 1) {
    const x = ((k * 104729) % 100000) + 1;
    ops.push(`1 ${x}`);
    counts[x] += 1;
    inside.push(x);
    bit.add(x, 1);
  }
  for (let k = 0; k < 15000; k += 1) {
    const x = inside[(k * 7919) % inside.length];
    if (counts[x] > 0) {
      ops.push(`2 ${x}`);
      counts[x] -= 1;
      bit.add(x, -1);
    } else {
      ops.push(`1 ${x}`);
      counts[x] = 1;
      inside.push(x);
      bit.add(x, 1);
    }
  }
  for (let k = 0; k < 15000; k += 1) {
    const a = ((k * 37) % 100000) + 1;
    const b = Math.min(100000, a + ((k * 13) % 5000));
    ops.push(`3 ${a} ${b}`);
    answers.push(bit.range(a, b));
  }
  const input = `${m}\n${ops.join("\n")}\n`;
  return { input, expectedOutput: newlineOutput(answers) };
}

function countLisWays(values: number[]): number {
  const MOD = 1000000007;
  const n = values.length;
  const len = new Array<number>(n).fill(1);
  const ways = new Array<number>(n).fill(1);
  let bestLen = 0;
  let total = 0;
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < i; j += 1) {
      if (values[j] < values[i]) {
        if (len[j] + 1 > len[i]) {
          len[i] = len[j] + 1;
          ways[i] = ways[j];
        } else if (len[j] + 1 === len[i]) {
          ways[i] = (ways[i] + ways[j]) % MOD;
        }
      }
    }
    if (len[i] > bestLen) {
      bestLen = len[i];
      total = ways[i];
    } else if (len[i] === bestLen) {
      total = (total + ways[i]) % MOD;
    }
  }
  return total;
}

function fenH2Brute(): { input: string; expectedOutput: string } {
  const n = 2000;
  const values: number[] = [];
  let seed = 123456789;
  for (let i = 0; i < n; i += 1) {
    seed = (seed * 48271) % 2147483647;
    values.push((seed % 2000001) - 1000000);
  }
  return { input: numbersInput(values), expectedOutput: newlineOutput([countLisWays(values)]) };
}

export const FENWICK_TREE_PRACTICE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m6-fenwick-tree-e2",
    title: "Add on a Loaded Board",
    statement:
      "ক্যান্টিনের বিক্রির বোর্ড শুরু থেকেই লেখা থাকে — গত মাসের প্রতিটি দিনের হিসাব আগেই জমা আছে। বর্তমান মাসে কিছু দিনের হিসাব আরও বাড়ছে, আর নুসরাত বারবার রেঞ্জের মোট জানতে চান।\n\nদুই ধরনের অপারেশন:\n\n- `1 i x` — `i` নম্বর দিনের বিক্রিতে `x` টাকা **যোগ** হলো (ঘরটা এতটাই বাড়বে)।\n- `2 l r` — `l` থেকে `r` দিন পর্যন্ত (দুই প্রান্তসহ) মোট বিক্রি প্রিন্ট করো।\n\nশুধু `2` অপারেশনের উত্তর দাও।\n\nউদাহরণ: বোর্ড `1 2 3 4 5` — `2 1 5` → `15`; এরপর `1 3 10` দিলে তৃতীয় দিনের ঘর `13`, আর `2 1 5` → `25`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা (শুরুর বোর্ড)। পরের `q` লাইনে অপারেশন — `1 i x` অথবা `2 l r`।",
    outputFormat: "প্রতিটি `2` অপারেশনের জন্য একটি করে লাইনে যোগফল।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 100000`\n`1 <= i, l <= r <= n`\n`-10^9 <= a_i, x <= 10^9`\nউত্তর ৬৪-বিট সাইনড সংখ্যার মধ্যে",
    editorial:
      "## ধারণা\n\nBIT আগে শূন্য অ্যারে ধরে বানানো হয়েছিল; এখানে শুরুতেই `n`টা মান বসানো আছে। সবচেয়ে সরাসরি উপায় — প্রতিটি ঘরে `add(i, a[i])` চালানো, খরচ `O(n log n)`। তবে একটা সুন্দর কৌশলে পুরো বিল্ড `O(n)` হয়: প্রথমে `tree[i] = a[i]` বসাও, তারপর ছোট থেকে বড় ইনডেক্সে ঘুরে প্রতিটি `tree[i]` তার কভারেজ-বাবাকে ঠেলে দাও — `tree[i + lowbit(i)] += tree[i]`। যোগফলের কাঠামো এমনিতেই পাশাপাশি কভারেজে ভাঙে, তাই নিচ থেকে এক পাসেই সব কভারেজ তৈরি হয়ে যায়।\n\n## ধাপে ধাপে\n\n1. `tree` অ্যারেতে সরাসরি বোর্ডের মান বসাও (`tree[i] = a[i]`)।\n2. `i = 1` থেকে `n` পর্যন্ত ঘুরে `j = i + (i & -i)` হলে `tree[j] += tree[i]` করো (`j > n` হলে থাকো)।\n3. `1 i x` এলে আগের মতোই `add(i, x)` — যোগ, প্রতিস্থাপন নয়।\n4. `2 l r` এলে `prefix(r) - prefix(l - 1)` প্রিন্ট করো।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) for _ in range(n)]\ntree = [0] * (n + 1)\nfor i, value in enumerate(arr, start=1):\n    tree[i] += value\nfor i in range(1, n + 1):\n    j = i + (i & -i)\n    if j <= n:\n        tree[j] += tree[i]\n\ndef add(index, value):\n    while index <= n:\n        tree[index] += value\n        index += index & -index\n\ndef prefix(index):\n    total = 0\n    while index > 0:\n        total += tree[index]\n        index -= index & -index\n    return total\n\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        add(int(next(it)), int(next(it)))\n    else:\n        l = int(next(it)); r = int(next(it))\n        out.append(str(prefix(r) - prefix(l - 1)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n## কমপ্লেক্সিটি\n\nবিল্ড `O(n)` (প্রতিটি ঘর থেকে একবারই ঠেলে দেওয়া), প্রতি অপারেশন `O(log n)`, স্পেস `O(n)`। `n` বার `add` চালিয়ে বানালেও চলত, তবে `O(n log n)`।\n\n## সাধারণ ভুল\n\n- `tree[i] = a[i]` বসিয়ে ঠেলে দেওয়ার ধাপ (`tree[j] += tree[i]`) বাদ দেওয়া — তখন কভারেজের অর্ধেকই খালি থাকে, প্রিফিক্স ভুল আসে।\n- ঠেলে দেওয়ার লুপ বড় থেকে ছোট ইনডেক্সে চালানো — বাবার মান তখনো পুরো হয়নি, নাতি-নাতনির যোগফল হারিয়ে যায়; ছোট থেকে বড়।\n- `1 i x`-কে প্রতিস্থাপন ভেবে পুরোনো মান বিয়োগ করা — এখানে `x` যোগই হবে।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Fenwick Tree", "Binary Indexed Tree", "Prefix Sum"],
    tests: [
      { input: "5 4\n1 2 3 4 5\n2 1 5\n1 3 10\n2 1 5\n2 2 3\n", expectedOutput: "15\n25\n15\n", isSample: true },
      { input: "1 3\n7\n2 1 1\n1 1 -12\n2 1 1\n", expectedOutput: "7\n-5\n", isSample: true },
      { input: "3 3\n-1 -2 -3\n2 1 3\n1 2 5\n2 1 3\n", expectedOutput: "-6\n-1\n", isSample: false },
      { input: "1 1\n1000000000\n2 1 1\n", expectedOutput: "1000000000\n", isSample: false },
      { input: "4 3\n0 0 0 0\n1 2 -5\n1 2 -5\n2 1 4\n", expectedOutput: "-10\n", isSample: false },
      { ...fenE2Large(), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) for _ in range(n)]\ntree = [0] * (n + 1)\nfor i, value in enumerate(arr, start=1):\n    tree[i] += value\nfor i in range(1, n + 1):\n    j = i + (i & -i)\n    if j <= n:\n        tree[j] += tree[i]\n\ndef add(index, value):\n    while index <= n:\n        tree[index] += value\n        index += index & -index\n\ndef prefix(index):\n    total = 0\n    while index > 0:\n        total += tree[index]\n        index -= index & -index\n    return total\n\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        add(int(next(it)), int(next(it)))\n    else:\n        l = int(next(it)); r = int(next(it))\n        out.append(str(prefix(r) - prefix(l - 1)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-fenwick-tree-e3",
    title: "Cutoff Count",
    statement:
      "সাদিয়া মাসিক কুইজের নম্বর একে একে জমা করছেন — স্কোর `1` থেকে `100000`-এর মধ্যে। কাটঅফ ঠিক করার সময় তার দরকার — এখন পর্যন্ত কয়জন `x` বা তার কম নম্বর পেয়েছে।\n\nদুই ধরনের অপারেশন:\n\n- `1 x` — আরেকজন শিক্ষার্থী নম্বর পেল `x`।\n- `2 x` — এখন পর্যন্ত জমা হওয়া স্কোরগুলোর মধ্যে `x` বা কম পেয়েছে কয়জন, সেটি প্রিন্ট করো।\n\nশুধু `2` অপারেশনের উত্তর দাও।\n\nউদাহরণ: `1 500`, `1 750`, `1 500` এরপর `2 500` → `2`; `2 400` → `0`।",
    inputFormat:
      "প্রথম লাইনে অপারেশনের সংখ্যা `m`। পরের `m` লাইনে এক একটি অপারেশন — `1 x` অথবা `2 x`।",
    outputFormat: "প্রতিটি `2` অপারেশনের জন্য একটি করে লাইনে শিক্ষার্থী সংখ্যা।",
    constraints:
      "`1 <= m <= 100000`\n`1 <= x <= 100000`\nপ্রতিটি স্কোর পূর্ণসংখ্যা, একই স্কোর একাধিকজন পেতে পারে",
    editorial:
      "## ধারণা\n\nস্কোরের মানটাই BIT-এর সূচক, আর ঘরের মান হলো ওই স্কোর কতজন পেয়েছে — অর্থাৎ ফ্রিকোয়েন্সি অ্যারে। `1 x` এলে `add(x, 1)`; `2 x` এলে `prefix(x)` — কারণ `[1..x]` পর্যন্ত সব ঘরের যোগফলই `x` বা কম স্কোরের শিক্ষার্থী। গুরুত্বপূর্ণ ব্যাপার — প্রশ্ন আসছে স্কোর জমা হওয়ার **মাঝখানে**, তাই একবার পুরো তালিকা পড়ে হিসাব করা চলবে না; BIT অনলাইনেই উত্তর দেয়।\n\n## ধাপে ধাপে\n\n1. `SIZE = 100000` ধরে BIT বানাও (সব ঘর শূন্য)।\n2. `1 x` এলে `add(x, 1)` — ওই স্কোরের কাউন্টার এক বাড়ল।\n3. `2 x` এলে `prefix(x)` প্রিন্ট করো — দুই প্রিফিক্সের বিয়োগ লাগবে না, কারণ রেঞ্জ শুরু হচ্ছে ১ থেকেই।\n4. একই স্কোর বারবার এলে একই ঘরে কাউন্টার জমা হবে — কোনো বাড়তি কাজ নেই।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nm = int(next(it))\nSIZE = 100000\ntree = [0] * (SIZE + 1)\n\ndef add(index, value):\n    while index <= SIZE:\n        tree[index] += value\n        index += index & -index\n\ndef prefix(index):\n    total = 0\n    while index > 0:\n        total += tree[index]\n        index -= index & -index\n    return total\n\nout = []\nfor _ in range(m):\n    op = next(it)\n    if op == b'1':\n        add(int(next(it)), 1)\n    else:\n        out.append(str(prefix(int(next(it)))))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n## কমপ্লেক্সিটি\n\nপ্রতি অপারেশন `O(log V)`, `V = 100000` — প্রায় `17` ধাপ; স্পেস `O(V)`। প্রতি প্রশ্নে পুরো তালিকা ঘুরে গোনলে `O(m^2)` হয়ে যেত।\n\n## সাধারণ ভুল\n\n- `prefix(x - 1)` লেখা — তখন `x` পাওয়া শিক্ষার্থীরা বাদ পড়ে; প্রশ্ন `x` **বা কম** চায়, তাই `prefix(x)`।\n- সব স্কোর আগে পড়ে রাখা — অনলাইন প্রশ্নে তখন ভুয়া উত্তর আসবে, কারণ পরের স্কোরগুলো তখনো জমা হয়নি।\n- স্কোর `100000`-এর বাইরে ধরে কোড লেখা — `add` লুপ তখন সীমা ছাড়িয়ে অ্যারের বাইরে চলে যাবে; সীমা মেনে চলো।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Fenwick Tree", "Frequency", "Online Queries"],
    tests: [
      { input: "6\n1 500\n1 750\n1 500\n2 400\n2 500\n2 100000\n", expectedOutput: "0\n2\n3\n", isSample: true },
      { input: "4\n2 5\n1 5\n2 4\n2 5\n", expectedOutput: "0\n0\n1\n", isSample: true },
      { input: "5\n1 10\n1 10\n1 10\n2 9\n2 10\n", expectedOutput: "0\n3\n", isSample: false },
      { input: "5\n1 1\n1 100000\n2 1\n2 100000\n2 2\n", expectedOutput: "1\n2\n1\n", isSample: false },
      { input: "1\n2 1\n", expectedOutput: "0\n", isSample: false },
      { ...fenE3Large(), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nm = int(next(it))\nSIZE = 100000\ntree = [0] * (SIZE + 1)\n\ndef add(index, value):\n    while index <= SIZE:\n        tree[index] += value\n        index += index & -index\n\ndef prefix(index):\n    total = 0\n    while index > 0:\n        total += tree[index]\n        index -= index & -index\n    return total\n\nout = []\nfor _ in range(m):\n    op = next(it)\n    if op == b'1':\n        add(int(next(it)), 1)\n    else:\n        out.append(str(prefix(int(next(it)))))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-fenwick-tree-m2",
    title: "Longest Increasing Picks",
    statement:
      "শেয়ারবাজারের দামের ধারা দেখে সাদিয়া কয়েকটা দিন বেছে নিতে চান — দিনগুলো পরপর না হলেও চলবে, কিন্তু বাছাইয়ের ক্রম ক্যালেন্ডারের ক্রমেই থাকতে হবে আর প্রতিবারের দাম আগের বাছাই করা দিনের চেয়ে **বেশি** হতে হবে।\n\nদেওয়া থাকবে `n` দিনের দাম; সবচেয়ে দীর্ঘ strictly increasing subsequence-এর দৈর্ঘ্য প্রিন্ট করো।\n\nউদাহরণ: `3 1 4 1 5` → দাম `1, 4, 5` (দিন ২, ৩, ৫) নিয়ে দৈর্ঘ্য `3`।",
    inputFormat: "প্রথম লাইনে `n`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।",
    outputFormat: "সবচেয়ে দীর্ঘ strictly increasing subsequence-এর দৈর্ঘ্য এক লাইনে।",
    constraints:
      "`1 <= n <= 100000`\n`-10^9 <= a_i <= 10^9`\nএকই দাম একাধিকবার থাকতে পারে",
    editorial:
      "## ধারণা\n\nপুরোনো বন্ধু DP: `dp[i]` = `i` নম্বর দিনে শেষ হওয়া সবচেয়ে দীর্ঘ বাছাই = `1 + max(dp[j])` যেখানে `j < i` এবং `a[j] < a[i]`। সরাসরি খুঁজলে `O(n^2)`। কৌশলটা হলো — `max(dp[j])` প্রশ্নটা BIT দিয়েই বসানো যায়: সূচক হলো দামের rank (সংকুচিত মান), আর ঘরে জমা থাকে ওই rank-এ শেষ হওয়া dp-গুলোর সর্বোচ্চ। তখন `dp[i] = 1 + prefix_max(rank(a_i) - 1)` — শুধু ছোট দামের ঘরগুলোই জোগা হয়, সমান দাম বাদ পড়ে (strictly increasing)। BIT-এ max রাখা যায় কারণ আমরা প্রতিটি rank-এ যা বসাই তার সর্বোচ্চটাই দরকার — বিয়োগের মতো উল্টো কাজ লাগে না।\n\n## ধাপে ধাপে\n\n1. সব দাম sort করে ভিন্ন মানগুলোকে `1, 2, ...` rank দাও (coordinate compression)।\n2. `bit` অ্যারেতে রাখবে সর্বোচ্চ dp: `add(index, value)` হলে পথের প্রতিটি ঘরে `max` বসাও; `prefix_max(index)` হলে পথের ঘরগুলোর সর্বোচ্চ নাও।\n3. প্রতিটি দিনের জন্য `dp = 1 + prefix_max(rank - 1)`, তারপর `add(rank, dp)`।\n4. সব dp-র সর্বোচ্চটাই উত্তর।\n\n```python\nimport sys\n\ndef main():\n    data = sys.stdin.buffer.read().split()\n    n = int(data[0])\n    values = list(map(int, data[1:1 + n]))\n    uniq = sorted(set(values))\n    rank = {v: i + 1 for i, v in enumerate(uniq)}\n    size = len(uniq)\n    bit = [0] * (size + 1)\n\n    def add(index, value):\n        while index <= size:\n            if value > bit[index]:\n                bit[index] = value\n            index += index & -index\n\n    def prefix_max(index):\n        best = 0\n        while index > 0:\n            if bit[index] > best:\n                best = bit[index]\n            index -= index & -index\n        return best\n\n    answer = 0\n    for value in values:\n        r = rank[value]\n        length = 1 + prefix_max(r - 1)\n        add(r, length)\n        if length > answer:\n            answer = length\n    print(answer)\n\nmain()\n```\n\n## কমপ্লেক্সিটি\n\nসাজানো `O(n log n)`, মূল লুপ `O(n log n)`, স্পেস `O(n)`। সরাসরি DP হলে `O(n^2)` — `n = 100000`-এ বহু গুণ ধীর।\n\n## সাধারণ ভুল\n\n- `prefix_max(rank)` দিয়ে হিসাব করা — তখন সমান দামও ধরা পড়ে, ফলে strictly increasing না হয়ে non-decreasing হয়ে যায়; ঠিক `rank - 1`।\n- compression ছাড়া দামকে সরাসরি সূচক ধরা — দাম ঋণাত্মক বা `10^9` পর্যন্ত, অ্যারে বানানোই অসম্ভব।\n- BIT-এর ঘরে যোগফল রাখা (`bit[index] += value`) — এখানে দরকার সর্বোচ্চ; যোগফল রাখলে প্রশ্নের মানেই হারিয়ে যায়।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Fenwick Tree", "Dynamic Programming", "LIS"],
    tests: [
      { input: "5\n3 1 4 1 5\n", expectedOutput: "3\n", isSample: true },
      { input: "5\n5 4 3 2 1\n", expectedOutput: "1\n", isSample: true },
      { input: "6\n10 9 2 5 3 7\n", expectedOutput: "3\n", isSample: false },
      { input: "3\n2 2 2\n", expectedOutput: "1\n", isSample: false },
      { input: "4\n1 2 3 4\n", expectedOutput: "4\n", isSample: false },
      { input: "1\n42\n", expectedOutput: "1\n", isSample: false },
      { ...fenM2Large(), isSample: false },
    ],
    referencePython:
      "import sys\n\ndef main():\n    data = sys.stdin.buffer.read().split()\n    n = int(data[0])\n    values = list(map(int, data[1:1 + n]))\n    uniq = sorted(set(values))\n    rank = {v: i + 1 for i, v in enumerate(uniq)}\n    size = len(uniq)\n    bit = [0] * (size + 1)\n\n    def add(index, value):\n        while index <= size:\n            if value > bit[index]:\n                bit[index] = value\n            index += index & -index\n\n    def prefix_max(index):\n        best = 0\n        while index > 0:\n            if bit[index] > best:\n                best = bit[index]\n            index -= index & -index\n        return best\n\n    answer = 0\n    for value in values:\n        r = rank[value]\n        length = 1 + prefix_max(r - 1)\n        add(r, length)\n        if length > answer:\n            answer = length\n    print(answer)\n\nmain()\n",
  },
  {
    slug: "learn-m6-fenwick-tree-m3",
    title: "Who Is Inside",
    statement:
      "ইভেন্ট হলে অতিথিরা ঢোকে-বেরোয়, প্রতিজনের হাতে একটা করে কোড (`1` থেকে `100000`)। গেটে তিন ধরনের এন্ট্রি লেখা হয়:\n\n- `1 x` — কোড `x`-এর একজন অতিথি ঢুকল।\n- `2 x` — কোড `x`-এর একজন অতিথি বেরিয়ে গেল (এই সময়ে ভেতরে অন্তত একজন `x` কোডের অতিথি আছে)।\n- `3 a b` — এখন ভেতরে কতজনের কোড `a` থেকে `b`-এর মধ্যে (দুই প্রান্তসহ), সেটি প্রিন্ট করো।\n\nশুধু `3` অপারেশনের উত্তর দাও। একই কোডের একাধিক অতিথি ভেতরে থাকতে পারে।\n\nউদাহরণ: `1 500`, `1 750`, `1 500` এরপর `3 400 600` → `2`; `2 500` দিয়ে একজন বেরোলে `3 400 600` → `1`।",
    inputFormat:
      "প্রথম লাইনে এন্ট্রির সংখ্যা `m`। পরের `m` লাইনে এক একটি এন্ট্রি — `1 x`, `2 x` বা `3 a b`।",
    outputFormat: "প্রতিটি `3` এন্ট্রির জন্য একটি করে লাইনে অতিথি সংখ্যা।",
    constraints:
      "`1 <= m <= 100000`\n`1 <= x, a <= b <= 100000`\n`2 x` এন্ট্রির সময় ভেতরে কোড `x`-এর অন্তত একজন অতিথি থাকবেই",
    editorial:
      "## ধারণা\n\nফ্রিকোয়েন্সি BIT-এর ধারণা আগের সমস্যায় ছিল; এবার কাউন্টার নিচেও নামে — বেরোনো মানে `add(x, -1)`। কাউন্টার ঋণাত্মক হবে না, কারণ `2 x` আসে শুধুই ভেতরে থাকা কারো পরে — এই শর্তটাই কাঠামোটাকে সহজ রাখে। রেঞ্জ প্রশ্নে আগের মতোই দুই প্রিফিক্সের পার্থক্য: `prefix(b) - prefix(a - 1)`। ঢোকা-বেরোনো আর গোনা সব `O(log V)` — হাজার এন্ট্রিতেও হিসাব হাতের নাগালে।\n\n## ধাপে ধাপে\n\n1. `SIZE = 100000` ধরে BIT বানাও; প্রতিটি কোডের কাউন্টার শুরুতে শূন্য।\n2. `1 x` → `add(x, 1)`; `2 x` → `add(x, -1)`।\n3. `3 a b` → `prefix(b) - prefix(a - 1)` প্রিন্ট করো।\n4. বারবার ঢোকা-বেরোনোতে একই ঘরের কাউন্টার ওঠানামা করবে — BIT-এর কিছুই বদলাতে হয় না।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nm = int(next(it))\nSIZE = 100000\ntree = [0] * (SIZE + 1)\n\ndef add(index, value):\n    while index <= SIZE:\n        tree[index] += value\n        index += index & -index\n\ndef prefix(index):\n    total = 0\n    while index > 0:\n        total += tree[index]\n        index -= index & -index\n    return total\n\nout = []\nfor _ in range(m):\n    op = next(it)\n    if op == b'1':\n        add(int(next(it)), 1)\n    elif op == b'2':\n        add(int(next(it)), -1)\n    else:\n        a = int(next(it)); b = int(next(it))\n        out.append(str(prefix(b) - prefix(a - 1)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n## কমপ্লেক্সিটি\n\nপ্রতি এন্ট্রি `O(log V)`, `V = 100000`; স্পেস `O(V)`। প্রতি প্রশ্নে ভেতরের সব কোডের তালিকা ঘুরলে `O(m * অতিথি)` — ভিড় হলেই শেষ।\n\n## সাধারণ ভুল\n\n- বেরোনো এন্ট্রিতে `add(x, -1)` না লিখে কাউন্টার আলাদা অ্যারেতে রেখে প্রশ্নের সময় মেলানো — কাজ করলেও প্রতি প্রশ্নে পুরো স্ক্যান লাগবে।\n- `prefix(b) - prefix(a)` — বাম প্রান্ত এক ঘর সরে যায়; সঠিক `prefix(a - 1)`।\n- কাউন্টার শূন্যের নিচে নামার শর্ত ভেঙে ইনপুট দেওয়া — সমস্যার শর্তেই বেরোনো আসে ঢোকার পরে; নিজের টেস্টেও শর্তটা রক্ষা করো।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Fenwick Tree", "Multiset", "Counting"],
    tests: [
      { input: "7\n1 500\n1 750\n1 500\n3 400 600\n2 500\n3 400 600\n3 700 800\n", expectedOutput: "2\n1\n1\n", isSample: true },
      { input: "5\n3 1 10\n1 10\n2 10\n1 20\n3 1 10\n", expectedOutput: "0\n0\n", isSample: true },
      { input: "5\n1 5\n2 5\n3 1 10\n1 5\n3 1 10\n", expectedOutput: "0\n1\n", isSample: false },
      { input: "5\n1 7\n1 7\n1 7\n2 7\n3 7 7\n", expectedOutput: "2\n", isSample: false },
      { input: "5\n1 1\n1 100000\n3 1 1\n3 100000 100000\n3 2 99999\n", expectedOutput: "1\n1\n0\n", isSample: false },
      { ...fenM3Large(), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nm = int(next(it))\nSIZE = 100000\ntree = [0] * (SIZE + 1)\n\ndef add(index, value):\n    while index <= SIZE:\n        tree[index] += value\n        index += index & -index\n\ndef prefix(index):\n    total = 0\n    while index > 0:\n        total += tree[index]\n        index -= index & -index\n    return total\n\nout = []\nfor _ in range(m):\n    op = next(it)\n    if op == b'1':\n        add(int(next(it)), 1)\n    elif op == b'2':\n        add(int(next(it)), -1)\n    else:\n        a = int(next(it)); b = int(next(it))\n        out.append(str(prefix(b) - prefix(a - 1)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-fenwick-tree-h2",
    title: "Count the Longest Picks",
    statement:
      "রফি শেয়ারবাজারের দানের দামের ধারা নিয়ে ভাবছিলেন — সবচেয়ে দীর্ঘ ক্রমবর্ধমান (strictly increasing) বাছাই কতভাবে করা যায়? দৈর্ঘ্য যত সর্বাধিক, ঠিক সেই দৈর্ঘ্যের বাছাই কতগুলো উপায়ে হয়, সেই সংখ্যা modulo `10^9 + 7` প্রিন্ট করো।\n\nদুইটি বাছাই আলাদা গণনা হবে যদি অন্তত একটা দিনের সূচক আলাদা হয়।\n\nউদাহরণ: `1 3 2 4` → সবচেয়ে দীর্ঘ বাছাইয়ের দৈর্ঘ্য `3`, আর উপায় দুটো — `(1,3,4)` আর `(1,2,4)`; উত্তর `2`।",
    inputFormat: "প্রথম লাইনে `n`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।",
    outputFormat: "সর্বাধিক দৈর্ঘ্যের বাছাইয়ের সংখ্যা mod `10^9 + 7` এক লাইনে।",
    constraints:
      "`1 <= n <= 100000`\n`-10^9 <= a_i <= 10^9`\nউত্তর modulo `10^9 + 7` দিতে হবে",
    editorial:
      "## ধারণা\n\nm2-এ প্রতিটি rank-এর ঘরে জমা ছিল সর্বোচ্চ দৈর্ঘ্য; এবার সেটার সাথে জমা রাখতে হবে **কতভাবে** — মানে প্রতিটি ঘরে একটা জোড়া `(দৈর্ঘ্য, উপায়)`। দুই জোড়া মেলানোর নিয়ম: বড় দৈর্ঘ্য জিতবে; দৈর্ঘ্য সমান হলে উপায় **যোগ** হবে (mod নিয়ে)। এই নিয়মে BIT-এর প্রিফিক্স প্রশ্নের অর্থ দাঁড়ায় — `rank`-এর নিচের সব ঘরের মধ্যে সর্বোচ্চ দৈর্ঘ্য কত আর ওই দৈর্ঘ্যে মোট কত উপায়, দুটোই একসাথে। তাহলে `dp[i] = (prev_len + 1, prev_ways)` (আগের কিছু ছোট দাম না থাকলে `(1, 1)`)। শেষে যেসব দিনে সর্বোচ্চ দৈর্ঘ্য এসেছে তাদের উপায় যোগ করলেই মোট উত্তর।\n\n## ধাপে ধাপে\n\n1. দামগুলো compress করে rank দাও।\n2. BIT-এর প্রতিটি ঘরে জোড়া `(0, 0)` থেকে শুরু; `add`-এ জোড়া মেলানোর নিয়মে হালনাগাদ।\n3. প্রতিটি দিনে `prev = query(rank - 1)` নাও; `prev_len == 0` হলে বর্তমান `(1, 1)`, নাহলে `(prev_len + 1, prev_ways)`।\n4. `add(rank, বর্তমান)` চালিয়ে সর্বোচ্চ জোড়াটা আলাদা রাখো — সমান দৈর্ঘ্য এলে উপায় যোগ, বড় দৈর্ঘ্য এলে বদলে দাও।\n5. শেষে সর্বোচ্চ জোড়ার উপায়টা প্রিন্ট করো।\n\n```python\nimport sys\n\ndef main():\n    MOD = 10**9 + 7\n    data = sys.stdin.buffer.read().split()\n    n = int(data[0])\n    values = list(map(int, data[1:1 + n]))\n    uniq = sorted(set(values))\n    rank = {v: i + 1 for i, v in enumerate(uniq)}\n    size = len(uniq)\n    bit = [(0, 0)] * (size + 1)\n\n    def better(x, y):\n        if x[0] > y[0]:\n            return x\n        if y[0] > x[0]:\n            return y\n        return (x[0], (x[1] + y[1]) % MOD)\n\n    def add(index, pair):\n        while index <= size:\n            bit[index] = better(bit[index], pair)\n            index += index & -index\n\n    def query(index):\n        best = (0, 0)\n        while index > 0:\n            best = better(best, bit[index])\n            index -= index & -index\n        return best\n\n    best_overall = (0, 0)\n    for value in values:\n        r = rank[value]\n        prev_len, prev_ways = query(r - 1)\n        if prev_len == 0:\n            current = (1, 1)\n        else:\n            current = (prev_len + 1, prev_ways)\n        add(r, current)\n        if current[0] > best_overall[0]:\n            best_overall = current\n        elif current[0] == best_overall[0]:\n            best_overall = (best_overall[0], (best_overall[1] + current[1]) % MOD)\n    print(best_overall[1])\n\nmain()\n```\n\n## কমপ্লেক্সিটি\n\nসাজানো ও মূল লুপ দুটোই `O(n log n)`, স্পেস `O(n)`। উপায়ের সংখ্যা সূচকীয় হারে বাড়তে পারে, তাই প্রতিটি যোগেই mod — নাহলে সংখ্যা হাজার অঙ্ক ছাড়িয়ে যায়।\n\n## সাধারণ ভুল\n\n- দৈর্ঘ্য সমান হলে উপায় যোগ না করে একটাকে ফেলে রাখা — তখন মোট উপায়ের অর্ধেকের বেশি হারিয়ে যায়।\n- প্রতিটি rank-এ শেষ হওয়া সব dp-ই BIT-এ জমা রাখা — না, দরকার শুধু প্রতিটি rank-এর সেরা জোড়া; জোড়া-মার্জ নিয়মটাই সেটা ঠিক রাখে।\n- mod ছাড়া পুরো সংখ্যা রাখা — Python-এ চলবে কিন্তু বিশাল সংখ্যার যোগ অত্যন্ত ধীর, আর উত্তরের সীমাও ভেঙে যায়।\n- মোট উত্তর বের করার সময় শুধু শেষ দিনের উপায় নেওয়া — সর্বোচ্চ দৈর্ঘ্য অনেক দিনে আসতে পারে, সবগুলোর যোগফল লাগবে।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 4000,
    memoryLimitMb: 256,
    tags: ["Fenwick Tree", "Dynamic Programming", "Counting"],
    tests: [
      { input: "3\n1 2 3\n", expectedOutput: "1\n", isSample: true },
      { input: "4\n1 3 2 4\n", expectedOutput: "2\n", isSample: true },
      { input: "3\n2 2 2\n", expectedOutput: "3\n", isSample: false },
      { input: "4\n4 3 2 1\n", expectedOutput: "4\n", isSample: false },
      { input: "4\n1 2 2 3\n", expectedOutput: "2\n", isSample: false },
      { ...fenH2Brute(), isSample: false },
      {
        input: numbersInput(Array.from({ length: 100000 }, (_, i) => i + 1)),
        expectedOutput: "1\n",
        isSample: false,
      },
      {
        input: numbersInput(new Array<number>(100000).fill(7)),
        expectedOutput: "100000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\n\ndef main():\n    MOD = 10**9 + 7\n    data = sys.stdin.buffer.read().split()\n    n = int(data[0])\n    values = list(map(int, data[1:1 + n]))\n    uniq = sorted(set(values))\n    rank = {v: i + 1 for i, v in enumerate(uniq)}\n    size = len(uniq)\n    bit = [(0, 0)] * (size + 1)\n\n    def better(x, y):\n        if x[0] > y[0]:\n            return x\n        if y[0] > x[0]:\n            return y\n        return (x[0], (x[1] + y[1]) % MOD)\n\n    def add(index, pair):\n        while index <= size:\n            bit[index] = better(bit[index], pair)\n            index += index & -index\n\n    def query(index):\n        best = (0, 0)\n        while index > 0:\n            best = better(best, bit[index])\n            index -= index & -index\n        return best\n\n    best_overall = (0, 0)\n    for value in values:\n        r = rank[value]\n        prev_len, prev_ways = query(r - 1)\n        if prev_len == 0:\n            current = (1, 1)\n        else:\n            current = (prev_len + 1, prev_ways)\n        add(r, current)\n        if current[0] > best_overall[0]:\n            best_overall = current\n        elif current[0] == best_overall[0]:\n            best_overall = (best_overall[0], (best_overall[1] + current[1]) % MOD)\n    print(best_overall[1])\n\nmain()\n",
  },
];
