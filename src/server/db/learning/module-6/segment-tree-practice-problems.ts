import type { SeedProblem } from "../../seed-problems";
import { newlineOutput } from "../generated-tests";
import { makeSeg } from "./segment-tree-problems";

function segE2Large(): { input: string; expectedOutput: string } {
  const n = 100000, q = 50000;
  const values: number[] = [];
  for (let i = 0; i < n; i += 1) values.push(((i * 7919) % 2000001) - 1000000);
  const frozen = [...values];
  const seg = makeSeg(values, -Infinity, Math.max);
  const ops: string[] = [];
  const answers: number[] = [];
  for (let k = 0; k < q; k += 1) {
    if (k % 20 === 0) {
      const l = ((k * 37) % n) + 1;
      const r = Math.min(n, l + ((k * 13) % 10000));
      ops.push(`2 ${l} ${r}`);
      answers.push(seg.range(l, r));
    } else {
      const i = ((k * 7919) % n) + 1;
      const x = ((k * 104729) % 2000001) - 1000000;
      ops.push(`1 ${i} ${x}`);
      seg.set(i - 1, x);
    }
  }
  const input = `${n} ${q}\n${frozen.join(" ")}\n${ops.join("\n")}\n`;
  return { input, expectedOutput: newlineOutput(answers) };
}

function segE3Large(): { input: string; expectedOutput: string } {
  const MOD = 1000000007n;
  const n = 100000, q = 3000;
  const values: number[] = [];
  for (let i = 0; i < n; i += 1) values.push((i * 7919) % 1000000007);
  const frozen = [...values];
  const arr = values.map((value) => BigInt(value));
  const ops: string[] = [];
  const answers: number[] = [];
  for (let k = 0; k < q; k += 1) {
    if (k % 3 === 0) {
      const l = ((k * 37) % n) + 1;
      const r = Math.min(n, l + ((k * 13) % 400));
      ops.push(`2 ${l} ${r}`);
      let product = 1n;
      for (let i = l - 1; i < r; i += 1) product = (product * arr[i]) % MOD;
      answers.push(Number(product));
    } else {
      const i = ((k * 7919) % n) + 1;
      const x = (k * 104729) % 1000000007;
      ops.push(`1 ${i} ${x}`);
      arr[i - 1] = BigInt(x);
    }
  }
  const input = `${n} ${q}\n${frozen.join(" ")}\n${ops.join("\n")}\n`;
  return { input, expectedOutput: newlineOutput(answers) };
}

function segM2Large(n: number, q: number, every: number): { input: string; expectedOutput: string } {
  const values: number[] = [];
  for (let i = 0; i < n; i += 1) values.push(((i * 7919) % 2001) - 1000);
  const frozen = [...values];
  const block = 300;
  const blocks = Math.ceil(n / block);
  const blockAdd = new Array<number>(blocks).fill(0);
  const blockMax = new Array<number>(blocks).fill(-Infinity);
  for (let i = 0; i < n; i += 1) {
    const b = Math.floor(i / block);
    blockMax[b] = Math.max(blockMax[b], values[i]);
  }
  const ops: string[] = [];
  const answers: number[] = [];
  for (let k = 0; k < q; k += 1) {
    const l = ((k * 37) % n) + 1;
    const r = Math.min(n, l + ((k * 13) % Math.max(1, Math.floor(n / 4))));
    if (k % every === 0) {
      ops.push(`2 ${l} ${r}`);
      let best = -Infinity;
      let p = l - 1;
      while (p < r) {
        const b = Math.floor(p / block);
        const end = Math.min(r, (b + 1) * block);
        if (p === b * block && end === (b + 1) * block) {
          best = Math.max(best, blockMax[b] + blockAdd[b]);
        } else {
          for (let i = p; i < end; i += 1) best = Math.max(best, values[i] + blockAdd[b]);
        }
        p = end;
      }
      answers.push(best);
    } else {
      const x = ((k * 104729) % 2001) - 1000;
      ops.push(`1 ${l} ${r} ${x}`);
      let p = l - 1;
      while (p < r) {
        const b = Math.floor(p / block);
        const end = Math.min(r, (b + 1) * block);
        if (p === b * block && end === (b + 1) * block) {
          blockAdd[b] += x;
        } else {
          for (let i = p; i < end; i += 1) values[i] += x;
          let localMax = -Infinity;
          for (let i = b * block; i < Math.min(n, (b + 1) * block); i += 1) {
            localMax = Math.max(localMax, values[i]);
          }
          blockMax[b] = localMax;
        }
        p = end;
      }
    }
  }
  const input = `${n} ${q}\n${frozen.join(" ")}\n${ops.join("\n")}\n`;
  return { input, expectedOutput: newlineOutput(answers) };
}

function segM3Large(): { input: string; expectedOutput: string } {
  const n = 100000, q = 1000;
  const values: number[] = [];
  for (let i = 0; i < n; i += 1) values.push(((i * 7919) % 2001) - 1000);
  const frozen = [...values];
  const current = [...values];
  const ops: string[] = [];
  const answers: number[] = [];
  for (let k = 0; k < q; k += 1) {
    if (k % 5 === 0) {
      const l = ((k * 37) % n) + 1;
      const r = Math.min(n, l + (k % 10 === 0 ? 100000 : 300));
      const t = ((k * 104729) % 2001) - 1000;
      ops.push(`2 ${l} ${r} ${t}`);
      let found = -1;
      for (let i = l - 1; i < r; i += 1) {
        if (current[i] >= t) {
          found = i + 1;
          break;
        }
      }
      answers.push(found);
    } else {
      const i = ((k * 7919) % n) + 1;
      const x = ((k * 104729) % 2001) - 1000;
      ops.push(`1 ${i} ${x}`);
      current[i - 1] = x;
    }
  }
  const input = `${n} ${q}\n${frozen.join(" ")}\n${ops.join("\n")}\n`;
  return { input, expectedOutput: newlineOutput(answers) };
}

function segH2Sorted(): { input: string; expectedOutput: string } {
  const n = 30000, q = 20000;
  const values: number[] = [];
  for (let i = 1; i <= n; i += 1) values.push(i);
  const queries: string[] = [];
  const answers: number[] = [];
  for (let k = 0; k < q; k += 1) {
    const l = ((k * 37) % n) + 1;
    const r = Math.min(n, l + ((k * 13) % 10000));
    const x = ((k * 104729) % 40001) - 10000;
    queries.push(`${l} ${r} ${x}`);
    const cap = Math.max(0, Math.min(n, Math.floor(x)));
    answers.push(Math.max(0, Math.min(r, cap) - l + 1));
  }
  const input = `${n} ${q}\n${values.join(" ")}\n${queries.join("\n")}\n`;
  return { input, expectedOutput: newlineOutput(answers) };
}

function segH2Shuffled(): { input: string; expectedOutput: string } {
  const n = 2000, q = 20000;
  const values: number[] = [];
  let seed = 123456789;
  for (let i = 0; i < n; i += 1) {
    seed = (seed * 48271) % 2147483647;
    values.push((seed % 2000001) - 1000000);
  }
  const queries: string[] = [];
  const answers: number[] = [];
  for (let k = 0; k < q; k += 1) {
    const l = ((k * 37) % n) + 1;
    const r = Math.min(n, l + ((k * 13) % 1000));
    const x = ((k * 104729) % 2000001) - 1000000;
    queries.push(`${l} ${r} ${x}`);
    let count = 0;
    for (let i = l - 1; i < r; i += 1) if (values[i] <= x) count += 1;
    answers.push(count);
  }
  const input = `${n} ${q}\n${values.join(" ")}\n${queries.join("\n")}\n`;
  return { input, expectedOutput: newlineOutput(answers) };
}

export const SEGMENT_TREE_PRACTICE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m6-segment-tree-e2",
    title: "Range Maximum with Updates",
    statement:
      "রফির আবহাওয়া স্টেশন প্রতিদিনের সর্বোচ্চ তাপমাত্রা একটা লম্বা লিস্টে রাখে। শিক্ষার্থীরা বারবার জানতে চায় নির্দিষ্ট রেঞ্জের মধ্যে সবচেয়ে গরম দিনটা কত ছিল, আর মাঝে মাঝে একটা দিনের রিডিং সংশোধন করতে হয়।\n\nদুই ধরনের অপারেশন:\n\n- `1 i x` — `i` নম্বর দিনের মান বদলে `x` করো (প্রতিস্থাপন)।\n- `2 l r` — `l` থেকে `r` দিন পর্যন্ত (দুই প্রান্তসহ) সর্বোচ্চ মান প্রিন্ট করো।\n\nশুধু `2` অপারেশনের উত্তর দাও।\n\nউদাহরণ: তালিকা `3 1 4 1 5` — `2 1 5` → `5`; এরপর `1 3 10` দিলে `2 1 5` → `10`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা। পরের `q` লাইনে অপারেশন — `1 i x` অথবা `2 l r`।",
    outputFormat: "প্রতিটি `2` অপারেশনের জন্য একটি করে লাইনে সর্বোচ্চ মান।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 100000`\n`1 <= i, l <= r <= n`\n`-10^9 <= a_i, x <= 10^9`",
    editorial:
      "## ধারণা\n\nএটা ট্রাই নয়, সেগমেন্ট ট্রির সবচেয়ে সরাসরি ব্যবহার — নোডে রেঞ্জের সর্বোচ্চ মান রাখো। কোয়েরিতে দুই পাশ থেকে নোড তুলে `max` করলেই উত্তর; আপডেটে পত্র নোড বদলে উপরের বাবাদের `max` আবার বসিয়ে দাও। যোগফলের সমস্যায় দেখেছিলে একই কাঠামো — শুধু কম্বাইন ফাংশনটা `max`। নিরপেক্ষ মান এখানে খুব ছোট সংখ্যা (`-10^18`), কারণ `0` বসালে ঋণাত্মক অ্যারেতে উত্তর সবসময় `0` হয়ে যেত।\n\n## ধাপে ধাপে\n\n1. `size` বের করে পত্রে অ্যারের মান বসাও, উপরের নোডে `max(বাম, ডান)` বসাও।\n2. অপারেশন `1 i x`: পত্র `size + i - 1` বদলে উপরে উঠতে উঠতে প্রতিটি বাবায় দুই সন্তানের `max` বসাও।\n3. অপারেশন `2 l r`: অর্ধেক-খোলা লুপে বাম-ডান দুই পাশ থেকে নোড তুলে `max` নাও।\n4. সব উত্তর এক এক লাইনে প্রিন্ট করো।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) for _ in range(n)]\nsize = 1\nwhile size < n:\n    size *= 2\ntree = [-(10**18)] * (2 * size)\nfor i, value in enumerate(arr):\n    tree[size + i] = value\nfor i in range(size - 1, 0, -1):\n    tree[i] = max(tree[2 * i], tree[2 * i + 1])\n\ndef point_set(index, value):\n    node = size + index\n    tree[node] = value\n    node //= 2\n    while node:\n        tree[node] = max(tree[2 * node], tree[2 * node + 1])\n        node //= 2\n\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        point_set(int(next(it)) - 1, int(next(it)))\n    else:\n        left = int(next(it)) - 1 + size\n        right = int(next(it)) + size\n        result = -(10**18)\n        while left < right:\n            if left & 1:\n                result = max(result, tree[left]); left += 1\n            if right & 1:\n                right -= 1; result = max(result, tree[right])\n            left >>= 1; right >>= 1\n        out.append(str(result))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n## কমপ্লেক্সিটি\n\nনির্মাণ `O(n)`, প্রতি আপডেট `O(log n)`, প্রতি প্রশ্ন `O(log n)`, স্পেস `O(n)`। প্রতি প্রশ্নে পুরো রেঞ্জ ঘুরলে `O(n)` — লাখ প্রশ্নে অসম্ভব।\n\n## সাধারণ ভুল\n\n- নিরপেক্ষ মান `0` বসানো — সব মান ঋণাত্মক হলে উত্তর ভুল হবে; ম্যাক্সের নিরপেক্ষ খুব ছোট সংখ্যা।\n- আপডেটের পর উপরের নোডগুলো হালনাগাদ না করে চলে যাওয়া — পুরোনো সর্বোচ্চ থেকে যায়।\n- ইনডেক্স বদলে `tree[node] += value` লেখা — প্রশ্ন প্রতিস্থাপন চায়, যোগ নয়।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Segment Tree", "Range Query", "Maximum"],
    tests: [
      { input: "5 6\n3 1 4 1 5\n2 1 5\n2 2 4\n1 3 10\n2 1 5\n2 1 2\n2 3 3\n", expectedOutput: "5\n4\n10\n3\n10\n", isSample: true },
      { input: "1 4\n7\n2 1 1\n1 1 -9\n2 1 1\n2 1 1\n", expectedOutput: "7\n-9\n-9\n", isSample: true },
      { input: "4 2\n-5 -1 -9 -3\n2 1 4\n2 2 3\n", expectedOutput: "-1\n-1\n", isSample: false },
      { input: "6 2\n2 2 2 2 2 2\n2 1 6\n2 3 4\n", expectedOutput: "2\n2\n", isSample: false },
      { input: "5 2\n1 2 3 4 5\n1 5 100\n2 5 5\n", expectedOutput: "100\n", isSample: false },
      { ...segE2Large(), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) for _ in range(n)]\nsize = 1\nwhile size < n:\n    size *= 2\ntree = [-(10**18)] * (2 * size)\nfor i, value in enumerate(arr):\n    tree[size + i] = value\nfor i in range(size - 1, 0, -1):\n    tree[i] = max(tree[2 * i], tree[2 * i + 1])\n\ndef point_set(index, value):\n    node = size + index\n    tree[node] = value\n    node //= 2\n    while node:\n        tree[node] = max(tree[2 * node], tree[2 * node + 1])\n        node //= 2\n\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        point_set(int(next(it)) - 1, int(next(it)))\n    else:\n        left = int(next(it)) - 1 + size\n        right = int(next(it)) + size\n        result = -(10**18)\n        while left < right:\n            if left & 1:\n                result = max(result, tree[left]); left += 1\n            if right & 1:\n                right -= 1; result = max(result, tree[right])\n            left >>= 1; right >>= 1\n        out.append(str(result))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-segment-tree-e3",
    title: "Range Product Modulo",
    statement:
      "নুসরাতের কেমিস্ট্রি পরীক্ষায় প্রতিটি ধাপে একটা করে গুণণীয়ক (factor) থাকে। কয়েকটা ধাপের গুণফল জানতে হয় মাঝে মাঝে, আবার একটা ধাপের ফ্যাক্টর বদলে গেলে হিসাবও বদলায়।\n\nদুই ধরনের অপারেশন:\n\n- `1 i x` — `i` নম্বর ধাপের ফ্যাক্টর বদলে `x` করো (প্রতিস্থাপন)।\n- `2 l r` — `l` থেকে `r` ধাপ পর্যন্ত (দুই প্রান্তসহ) ফ্যাক্টরগুলোর গুণফল modulo `10^9 + 7` প্রিন্ট করো।\n\nউদাহরণ: তালিকা `2 3 4` — `2 1 3` → `24`; এরপর `1 2 5` দিলে তালিকা `2 5 4`, আর `2 1 3` → `40`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা। পরের `q` লাইনে অপারেশন — `1 i x` অথবা `2 l r`।",
    outputFormat: "প্রতিটি `2` অপারেশনের জন্য একটি করে লাইনে গুণফল (mod `10^9 + 7`)।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 100000`\n`1 <= i, l <= r <= n`\n`0 <= a_i, x < 10^9 + 7`",
    editorial:
      "## ধারণা\n\nগুণফলও associative — `(a * b) * c = a * (b * c)` — তাই যোগফলের মতোই সেগমেন্ট ট্রি বানানো যায়, শুধু কম্বাইন ফাংশনটা গুণ। নিরপেক্ষ মান `1` (কোনো ঘর না থাকলে গুণফল ১)। পার্থক্য একটাই: মান অনেক দ্রুত বিশাল হয়ে যায়, তাই প্রতিটি গুণের পরেই mod করতে হয়। আর মনে রাখো — গুণফল উল্টানো যায় না (ভাগ নেই), তাই ফেনউইক ট্রি দিয়ে রেঞ্জ প্রশ্ন করা যায় না; সেগমেন্ট ট্রিই এখানে দরকার।\n\n## ধাপে ধাপে\n\n1. পত্রে অ্যারের মান বসাও; উপরের নোডে `বাম * ডান mod M` বসাও, `M = 10^9 + 7`।\n2. `1 i x`: পত্র বদলে উপরে উঠতে উঠতে প্রতিটি নোডে আবার গুণফল বসাও।\n3. `2 l r`: অর্ধেক-খোলা লুপে নোড তুলে ফলের সাথে গুণ করো — প্রতিটি ধাপে mod।\n4. উত্তরগুলো এক এক লাইনে প্রিন্ট করো।\n\n```python\nimport sys\n\nMOD = 10**9 + 7\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) % MOD for _ in range(n)]\nsize = 1\nwhile size < n:\n    size *= 2\ntree = [1] * (2 * size)\nfor i, value in enumerate(arr):\n    tree[size + i] = value\nfor i in range(size - 1, 0, -1):\n    tree[i] = tree[2 * i] * tree[2 * i + 1] % MOD\n\ndef point_set(index, value):\n    node = size + index\n    tree[node] = value % MOD\n    node //= 2\n    while node:\n        tree[node] = tree[2 * node] * tree[2 * node + 1] % MOD\n        node //= 2\n\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        point_set(int(next(it)) - 1, int(next(it)) % MOD)\n    else:\n        left = int(next(it)) - 1 + size\n        right = int(next(it)) + size\n        result = 1\n        while left < right:\n            if left & 1:\n                result = result * tree[left] % MOD; left += 1\n            if right & 1:\n                right -= 1; result = result * tree[right] % MOD\n            left >>= 1; right >>= 1\n        out.append(str(result))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n## কমপ্লেক্সিটি\n\nনির্মাণ `O(n)`, প্রতি অপারেশন `O(log n)`, স্পেস `O(n)`। Python-এর বড় সংখ্যা থাকলেও প্রতিটি ধাপে mod না করলে সংখ্যা লাখ অঙ্কে গিয়ে গুণ অত্যন্ত ধীর হয়ে যায়।\n\n## সাধারণ ভুল\n\n- mod না করে পুরো গুণফল রাখা — C++-এ overflow, Python-এ হয়তো চলবে কিন্তু ধীরগতিতে।\n- নিরপেক্ষ মান `0` বসানো — শূন্য দিয়ে গুণ করলে সব উত্তর `0` হয়ে যায়; গুণের নিরপেক্ষ `1`।\n- প্রতিস্থাপনের সময় পুরোনো মান দিয়ে ভাগ করে বাদ দেওয়ার চেষ্টা — গুণের কোনো উল্টো কাজ নেই mod জগতে; উপরের নোডগুলো নতুন করে বসাও।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Segment Tree", "Range Query", "Modular Arithmetic"],
    tests: [
      { input: "4 3\n2 3 4 5\n2 1 3\n1 2 10\n2 1 4\n", expectedOutput: "24\n400\n", isSample: true },
      { input: "3 4\n1 1 1\n2 1 3\n1 2 0\n2 1 3\n2 3 3\n", expectedOutput: "1\n0\n1\n", isSample: true },
      { input: "2 1\n1000000006 2\n2 1 2\n", expectedOutput: "1000000005\n", isSample: false },
      { input: "2 3\n0 5\n2 1 2\n1 1 3\n2 1 2\n", expectedOutput: "0\n15\n", isSample: false },
      { input: "1 3\n7\n2 1 1\n1 1 1000000006\n2 1 1\n", expectedOutput: "7\n1000000006\n", isSample: false },
      { input: "2 1\n999999999 999999998\n2 1 2\n", expectedOutput: "72\n", isSample: false },
      { ...segE3Large(), isSample: false },
    ],
    referencePython:
      "import sys\n\nMOD = 10**9 + 7\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) % MOD for _ in range(n)]\nsize = 1\nwhile size < n:\n    size *= 2\ntree = [1] * (2 * size)\nfor i, value in enumerate(arr):\n    tree[size + i] = value\nfor i in range(size - 1, 0, -1):\n    tree[i] = tree[2 * i] * tree[2 * i + 1] % MOD\n\ndef point_set(index, value):\n    node = size + index\n    tree[node] = value % MOD\n    node //= 2\n    while node:\n        tree[node] = tree[2 * node] * tree[2 * node + 1] % MOD\n        node //= 2\n\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        point_set(int(next(it)) - 1, int(next(it)) % MOD)\n    else:\n        left = int(next(it)) - 1 + size\n        right = int(next(it)) + size\n        result = 1\n        while left < right:\n            if left & 1:\n                result = result * tree[left] % MOD; left += 1\n            if right & 1:\n                right -= 1; result = result * tree[right] % MOD\n            left >>= 1; right >>= 1\n        out.append(str(result))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-segment-tree-m2",
    title: "Range Add, Range Maximum",
    statement:
      "সমুদ্র থেকে আসা উষ্ণ বাতাস পরপর কয়েকদিনের তাপমাত্রা একসাথে বাড়িয়ে দেয়। স্টেশনের লিস্টে দুই ধরনের কাজ:\n\n- `1 l r x` — `l` থেকে `r` দিন পর্যন্ত (দুই প্রান্তসহ) **প্রতিটি** দিনের মানে `x` যোগ করো।\n- `2 l r` — ওই রেঞ্জের সর্বোচ্চ তাপমাত্রা প্রিন্ট করো।\n\nযোগের পরে আসা প্রশ্নের উত্তর নতুন মান ধরেই দিতে হবে।\n\nউদাহরণ: তালিকা `1 5 2 4 3` — `1 2 4 10` দিলে তালিকা হয় `1 15 12 14 3`; এখন `2 1 5` → `15`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা। পরের `q` লাইনে অপারেশন — `1 l r x` অথবা `2 l r`।",
    outputFormat: "প্রতিটি `2` অপারেশনের জন্য একটি করে লাইনে সর্বোচ্চ মান।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 30000`\n`1 <= l <= r <= n`\n`-10^9 <= a_i, x <= 10^9`",
    editorial:
      "## ধারণা\n\nআগের lazy propagation-ই, শুধু নোডের মান এখন সর্বোচ্চ। মজার পার্থক্যটা খেয়াল করো — যোগফলের সমস্যায় পুরো নোড ঢাকা রেঞ্জে যোগ করতে দৈর্ঘ্য দিয়ে গুণ করতে হতো (`x * নোডের দৈর্ঘ্য`)। ম্যাক্সে সেটা লাগে না: রেঞ্জের সব মান `x` বাড়লে সর্বোচ্চটাও ঠিক `x` বাড়ে, তাই `tree[node] += x` লিখলেই হয়। `lazy` ট্যাগ আগের মতোই — পুরো ম্যাচ নোডে ট্যাগ বসিয়ে নিচে নামার আগে `push` করো।\n\n## ধাপে ধাপে\n\n1. ট্রি বানাও (প্রতিটি নোডে রেঞ্জের সর্বোচ্চ), `lazy` শূন্য দিয়ে শুরু।\n2. `apply(node, x)`: `tree[node] += x`, `lazy[node] += x`।\n3. `push(node)`: ট্যাগ থাকলে দুই সন্তানে `apply` করে নিজের ট্যাগ মুছো।\n4. আপডেট `1 l r x`: রেঞ্জের বাইরে হলে ফিরে এসো; পুরো ম্যাচ হলে `apply`; নাহলে `push` করে দুই অর্ধে নামো, ফিরে এসে `max` আবার বসাও।\n5. কোয়েরি `2 l r`: একইভাবে নেমে ম্যাচ নোডের মান জোগাও।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) for _ in range(n)]\nsize = 1\nwhile size < n:\n    size *= 2\ntree = [0] * (2 * size)\nlazy = [0] * (2 * size)\nfor i, value in enumerate(arr):\n    tree[size + i] = value\nfor i in range(size - 1, 0, -1):\n    tree[i] = max(tree[2 * i], tree[2 * i + 1])\n\ndef apply(node, value):\n    tree[node] += value\n    lazy[node] += value\n\ndef push(node):\n    if lazy[node]:\n        apply(node * 2, lazy[node])\n        apply(node * 2 + 1, lazy[node])\n        lazy[node] = 0\n\ndef update(node, nl, nr, l, r, value):\n    if r <= nl or nr <= l:\n        return\n    if l <= nl and nr <= r:\n        apply(node, value)\n        return\n    push(node)\n    mid = (nl + nr) // 2\n    update(node * 2, nl, mid, l, r, value)\n    update(node * 2 + 1, mid, nr, l, r, value)\n    tree[node] = max(tree[node * 2], tree[node * 2 + 1])\n\ndef query(node, nl, nr, l, r):\n    if r <= nl or nr <= l:\n        return -(10**18)\n    if l <= nl and nr <= r:\n        return tree[node]\n    push(node)\n    mid = (nl + nr) // 2\n    return max(query(node * 2, nl, mid, l, r), query(node * 2 + 1, mid, nr, l, r))\n\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        l = int(next(it)) - 1; r = int(next(it)); x = int(next(it))\n        update(1, 0, size, l, r, x)\n    else:\n        l = int(next(it)) - 1; r = int(next(it))\n        out.append(str(query(1, 0, size, l, r)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n## কমপ্লেক্সিটি\n\nনির্মাণ `O(n)`, প্রতি অপারেশন `O(log n)`, স্পেস `O(n)`। প্রতিটি রেঞ্জ যোগ ঘরে ঘরে করলে `O(n)` — `q` বড় হলে অসম্ভব।\n\n## সাধারণ ভুল\n\n- `x * দৈর্ঘ্য` গুণ করে ফেলা — সেটা যোগফলের নিয়ম; ম্যাক্সে দৈর্ঘ্য জোগানোর কিছু নেই।\n- নিচে নামার আগে `push` না করা — বাবার ট্যাগ সন্তানে পৌঁছায় না, মান পুরোনো থাকে।\n- আপডেটের শেষে `tree[node] = max(দুই সন্তান)` আবার না বসানো — সন্তানের ম্যাক্স বদলে গেছে, বাবাকেও বদলাতে হবে।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 4000,
    memoryLimitMb: 256,
    tags: ["Segment Tree", "Lazy Propagation", "Range Update"],
    tests: [
      { input: "5 6\n1 5 2 4 3\n1 2 4 10\n2 1 5\n2 2 2\n1 1 1 -100\n2 1 5\n2 1 1\n", expectedOutput: "15\n15\n15\n-99\n", isSample: true },
      { input: "3 3\n0 0 0\n2 1 3\n1 1 3 5\n2 1 3\n", expectedOutput: "0\n5\n", isSample: true },
      { input: "4 3\n-1 -1 -1 -1\n1 1 4 -1\n2 1 4\n2 3 4\n", expectedOutput: "-2\n-2\n", isSample: false },
      { input: "1 3\n10\n2 1 1\n1 1 1 5\n2 1 1\n", expectedOutput: "10\n15\n", isSample: false },
      { input: "6 4\n0 0 0 0 0 0\n1 1 6 3\n1 3 6 4\n2 4 6\n2 1 2\n", expectedOutput: "7\n3\n", isSample: false },
      { ...segM2Large(100000, 30000, 4), isSample: false },
      { ...segM2Large(2000, 30000, 2), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) for _ in range(n)]\nsize = 1\nwhile size < n:\n    size *= 2\ntree = [0] * (2 * size)\nlazy = [0] * (2 * size)\nfor i, value in enumerate(arr):\n    tree[size + i] = value\nfor i in range(size - 1, 0, -1):\n    tree[i] = max(tree[2 * i], tree[2 * i + 1])\n\ndef apply(node, value):\n    tree[node] += value\n    lazy[node] += value\n\ndef push(node):\n    if lazy[node]:\n        apply(node * 2, lazy[node])\n        apply(node * 2 + 1, lazy[node])\n        lazy[node] = 0\n\ndef update(node, nl, nr, l, r, value):\n    if r <= nl or nr <= l:\n        return\n    if l <= nl and nr <= r:\n        apply(node, value)\n        return\n    push(node)\n    mid = (nl + nr) // 2\n    update(node * 2, nl, mid, l, r, value)\n    update(node * 2 + 1, mid, nr, l, r, value)\n    tree[node] = max(tree[node * 2], tree[node * 2 + 1])\n\ndef query(node, nl, nr, l, r):\n    if r <= nl or nr <= l:\n        return -(10**18)\n    if l <= nl and nr <= r:\n        return tree[node]\n    push(node)\n    mid = (nl + nr) // 2\n    return max(query(node * 2, nl, mid, l, r), query(node * 2 + 1, mid, nr, l, r))\n\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        l = int(next(it)) - 1; r = int(next(it)); x = int(next(it))\n        update(1, 0, size, l, r, x)\n    else:\n        l = int(next(it)) - 1; r = int(next(it))\n        out.append(str(query(1, 0, size, l, r)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-segment-tree-m3",
    title: "First Day Above Threshold",
    statement:
      "তানভির শীতের ছুটির প্ল্যান সাজাচ্ছিলেন — যাত্রা শুরুর আগে জানা দরকার `l` থেকে `r` দিনের মধ্যে প্রথম কোন দিনে তাপমাত্রা `t` বা তার বেশি হবে। কোনো দিনের রিডিং মাঝে মাঝে সংশোধনও হয়।\n\nদুই ধরনের অপারেশন:\n\n- `1 i x` — `i` নম্বর দিনের মান বদলে `x` করো (প্রতিস্থাপন)।\n- `2 l r t` — `l` থেকে `r` দিনের মধ্যে প্রথম যে দিনের মান `t` বা বেশি, তার নম্বর প্রিন্ট করো; এমন দিন না থাকলে `-1`।\n\nউদাহরণ: তালিকা `3 1 4 1 5` — `2 1 5 4` → দিন `3` (প্রথম মান `4` বা তার বেশি); `2 1 5 6` → `-1`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা। পরের `q` লাইনে অপারেশন — `1 i x` অথবা `2 l r t`।",
    outputFormat: "প্রতিটি `2` অপারেশনের জন্য একটি করে লাইনে দিনের নম্বর, না থাকলে `-1`।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 100000`\n`1 <= i, l <= r <= n`\n`-10^9 <= a_i, x, t <= 10^9`",
    editorial:
      "## ধারণা\n\nম্যাক্সের সেগমেন্ট ট্রি আগেই আছে; নতুন কৌশল হলো কোয়েরির সময় গাছের ভেতরে **নেমে** যাওয়া। রেঞ্জ `[l, r]` ভেঙে যে নোডগুলো পড়ে, প্রতিটি নোডে দেখো — এই নোডের সর্বোচ্চ `t`-এর কম হলে এই নোডে উত্তর নেই, পুরো শাখা বাদ। নাহলে বাম সন্তানে আগে ঢুকো (বামের ম্যাক্স `t`-এর কম হলে ডানে), পত্রে পৌঁছালে সেই ইনডেক্সই প্রথম মিল। বাম-আগে নেমে যাওয়ার কারণে যে ইনডেক্স আগে পাওয়া যায় সেটাই সবচেয়ে ছোট ইনডেক্স।\n\n## ধাপে ধাপে\n\n1. ম্যাক্স সেগমেন্ট ট্রি বানাও আর পয়েন্ট আপডেট আগের মতোই রাখো।\n2. `first_above(node, nl, nr, l, r, t)` লিখো — রেঞ্জের বাইরে হলে `-1`।\n3. নোডের `tree[node] < t` হলে `-1` — এই প্রুনিংই বাড়তি ঘোরা কাটে।\n4. পত্রে পৌঁছালে `nl + 1` (১-ভিত্তিক) ফেরত দাও; নাহলে বাম সন্তান দেখো, মিল পেলে সেটাই উত্তর, নাহলে ডান সন্তান।\n\n```python\nimport sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) for _ in range(n)]\nsize = 1\nwhile size < n:\n    size *= 2\ntree = [-(10**18)] * (2 * size)\nfor i, value in enumerate(arr):\n    tree[size + i] = value\nfor i in range(size - 1, 0, -1):\n    tree[i] = max(tree[2 * i], tree[2 * i + 1])\n\ndef point_set(index, value):\n    node = size + index\n    tree[node] = value\n    node //= 2\n    while node:\n        tree[node] = max(tree[2 * node], tree[2 * node + 1])\n        node //= 2\n\ndef first_above(node, nl, nr, l, r, t):\n    if r <= nl or nr <= l or tree[node] < t:\n        return -1\n    if nl + 1 == nr:\n        return nl + 1\n    mid = (nl + nr) // 2\n    left = first_above(node * 2, nl, mid, l, r, t)\n    if left != -1:\n        return left\n    return first_above(node * 2 + 1, mid, nr, l, r, t)\n\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        point_set(int(next(it)) - 1, int(next(it)))\n    else:\n        l = int(next(it)) - 1; r = int(next(it)); t = int(next(it))\n        out.append(str(first_above(1, 0, size, l, r, t)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n## কমপ্লেক্সিটি\n\nআপডেট `O(log n)`। কোয়েরিতে প্রতিটি স্তরে দুই-একটা নোডে ঢুকতে হয় (বাকিগুলো ম্যাক্স-প্রুনিংয়ে বাদ), তাই `O(log n)`। প্রতি প্রশ্নে পুরো রেঞ্জ স্ক্যান করলে `O(n)` — বড় `q`-তে চলবে না।\n\n## সাধারণ ভুল\n\n- ডান সন্তান আগে দেখা — তখন প্রথম নয়, শেষ মিল পাওয়া যায়; বাম আগে।\n- `tree[node] < t` প্রুনিং না করে সব নোডে নামা — তখন কোয়েরি রৈখিক হয়ে যায়।\n- প্রশ্নের রেঞ্জ `[l, r]` যাচাই না করে শুধু মান দেখে পত্র ফেরত দেওয়া — রেঞ্জের বাইরের দিন উত্তরে চলে আসবে।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Segment Tree", "Range Query", "Binary Search"],
    tests: [
      { input: "5 5\n3 1 4 1 5\n2 1 5 4\n2 1 5 6\n2 1 5 3\n2 2 4 5\n2 4 5 5\n", expectedOutput: "3\n-1\n1\n-1\n5\n", isSample: true },
      { input: "1 5\n7\n2 1 1 7\n2 1 1 8\n1 1 9\n2 1 1 8\n2 1 1 10\n", expectedOutput: "1\n-1\n1\n-1\n", isSample: true },
      { input: "4 3\n4 4 4 4\n2 1 4 4\n2 3 4 4\n2 1 4 5\n", expectedOutput: "1\n3\n-1\n", isSample: false },
      { input: "5 4\n1 2 5 3 4\n1 3 0\n2 1 5 3\n2 3 5 4\n2 2 3 0\n", expectedOutput: "4\n5\n2\n", isSample: false },
      { input: "3 1\n-5 -2 -9\n2 1 3 -5\n", expectedOutput: "1\n", isSample: false },
      { ...segM3Large(), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.buffer.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\narr = [int(next(it)) for _ in range(n)]\nsize = 1\nwhile size < n:\n    size *= 2\ntree = [-(10**18)] * (2 * size)\nfor i, value in enumerate(arr):\n    tree[size + i] = value\nfor i in range(size - 1, 0, -1):\n    tree[i] = max(tree[2 * i], tree[2 * i + 1])\n\ndef point_set(index, value):\n    node = size + index\n    tree[node] = value\n    node //= 2\n    while node:\n        tree[node] = max(tree[2 * node], tree[2 * node + 1])\n        node //= 2\n\ndef first_above(node, nl, nr, l, r, t):\n    if r <= nl or nr <= l or tree[node] < t:\n        return -1\n    if nl + 1 == nr:\n        return nl + 1\n    mid = (nl + nr) // 2\n    left = first_above(node * 2, nl, mid, l, r, t)\n    if left != -1:\n        return left\n    return first_above(node * 2 + 1, mid, nr, l, r, t)\n\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == b'1':\n        point_set(int(next(it)) - 1, int(next(it)))\n    else:\n        l = int(next(it)) - 1; r = int(next(it)); t = int(next(it))\n        out.append(str(first_above(1, 0, size, l, r, t)))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-segment-tree-h2",
    title: "Count Ratings At Most X",
    statement:
      "টুর্নামেন্টে খেলোয়াড়দের রেটিং রোল নম্বর অনুযায়ী সাজানো থাকে। কোচ বারবার জানতে চান — `l` থেকে `r` রোলের মধ্যে কয়জন খেলোয়াড়ের রেটিং `x` বা তার কম। রেটিং কোনো দিন বদলায় না।\n\n`n`টি রেটিং দেওয়া থাকবে, তারপর `q`টি প্রশ্ন `l r x` — ওই রেঞ্জে (দুই প্রান্তসহ) `x`-এর সমান বা ছোট মানের সংখ্যা প্রিন্ট করো।\n\nউদাহরণ: রেটিং `3 1 4 1 5` — প্রশ্ন `1 5 3` → `3` (মান `3, 1, 1` তিনটাই `3`-এর সমান বা ছোট)।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা। পরের `q` লাইনে প্রশ্ন `l r x`।",
    outputFormat: "`q` লাইনে উত্তর — প্রতিটি রেঞ্জে `x`-এর সমান বা ছোট মানের সংখ্যা।",
    constraints:
      "`1 <= n <= 30000`\n`1 <= q <= 20000`\n`1 <= l <= r <= n`\n`-10^9 <= a_i, x <= 10^9`",
    editorial:
      "## ধারণা\n\nসাধারণ সেগমেন্ট ট্রিতে নোডে একটা মান থাকে; এখানে নোডে থাকবে **পুরো রেঞ্জের সাজানো তালিকা** — এটাই merge sort tree। বাম সন্তানের সাজানো লিস্ট আর ডান সন্তানের সাজানো লিস্ট জোড়া দিলে (দুটোই এলোমেলো না হলে মার্জ সহজ) বাবার সাজানো লিস্ট পাওয়া যায়। কোয়েরিতে `[l, r]` ভাঙে কয়েকটা নোডে — এবং এই নোডগুলো একে অপরকে ঢেকে ফেলে না, তাই কোনো ঘর দুইবার গোনা হয় না। প্রতিটি নোডের সাজানো লিস্টে binary search চালিয়ে `x`-এর সমান বা ছোট কতগুলো আছে বের করো; সব নোডের সংখ্যা যোগ করলেই উত্তর।\n\n## ধাপে ধাপে\n\n1. পত্র নোডে একক মানের লিস্ট; নিচ থেকে উপরে প্রতিটি নোডে দুই সন্তানের লিস্ট মিলিয়ে সাজানো লিস্ট বসাও।\n2. কোয়েরি `l r x`: গাছের রুট থেকে নেমে যেসব নোড পুরোপুরি `[l, r]`-এর ভেতরে, সেগুলো সংগ্রহ করো।\n3. প্রতিটি নোডের লিস্টে `bisect_right(list, x)` চালাও — এটাই `x`-এর সমান বা ছোট মানের সংখ্যা।\n4. সব নোডের ফল যোগ করে প্রিন্ট করো।\n\n```python\nimport sys, bisect\n\ndef main():\n    data = sys.stdin.buffer.read().split()\n    it = iter(data)\n    n = int(next(it)); q = int(next(it))\n    arr = [int(next(it)) for _ in range(n)]\n    size = 1\n    while size < n:\n        size *= 2\n    tree = [[] for _ in range(2 * size)]\n    for i, value in enumerate(arr):\n        tree[size + i] = [value]\n    for node in range(size - 1, 0, -1):\n        tree[node] = sorted(tree[2 * node] + tree[2 * node + 1])\n\n    def count(node, nl, nr, l, r, x):\n        if r <= nl or nr <= l:\n            return 0\n        if l <= nl and nr <= r:\n            return bisect.bisect_right(tree[node], x)\n        mid = (nl + nr) // 2\n        return count(node * 2, nl, mid, l, r, x) + count(node * 2 + 1, mid, nr, l, r, x)\n\n    out = []\n    for _ in range(q):\n        l = int(next(it)) - 1; r = int(next(it)); x = int(next(it))\n        out.append(str(count(1, 0, size, l, r, x)))\n    sys.stdout.write('\\n'.join(out) + '\\n')\n\nmain()\n```\n\n## কমপ্লেক্সিটি\n\nনির্মাণ `O(n log n)` সময় ও স্পেস — প্রতিটি স্তরে মোট `n`টা মান, স্তর `log n`টা। প্রতি কোয়েরিতে `O(log n)`টা নোড, প্রতিটিতে `O(log n)` binary search — মোট `O(log^2 n)`।\n\n## সাধারণ ভুল\n\n- স্পার্স টেবিলের মতো ওভারল্যাপ করা দুই ব্লক নেওয়া — গোনার সমস্যায় আচ্ছাদিত অংশ দুইবার গোনা হবে; নোডগুলো অবশ্যই ঢাকাবিহীন হতে হবে।\n- `bisect_left` ব্যবহার করা — তাতে `x`-এর সমান মানগুলো গোনা হয় না; `bisect_right` দিলে সমানগুলোও পড়ে।\n- নোডের লিস্ট সাজানো না রেখে binary search চালানো — ফল অর্থহীন হয়ে যায়।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 4000,
    memoryLimitMb: 256,
    tags: ["Merge Sort Tree", "Segment Tree", "Binary Search", "Counting"],
    tests: [
      { input: "5 4\n3 1 4 1 5\n1 5 3\n2 4 2\n1 1 3\n3 5 5\n", expectedOutput: "3\n2\n1\n3\n", isSample: true },
      { input: "1 2\n7\n1 1 7\n1 1 6\n", expectedOutput: "1\n0\n", isSample: true },
      { input: "3 3\n-1 -2 -3\n1 3 -2\n1 3 -3\n1 1 -1\n", expectedOutput: "2\n1\n1\n", isSample: false },
      { input: "4 2\n5 5 5 5\n1 4 5\n1 4 4\n", expectedOutput: "4\n0\n", isSample: false },
      { ...segH2Sorted(), isSample: false },
      { ...segH2Shuffled(), isSample: false },
    ],
    referencePython:
      "import sys, bisect\n\ndef main():\n    data = sys.stdin.buffer.read().split()\n    it = iter(data)\n    n = int(next(it)); q = int(next(it))\n    arr = [int(next(it)) for _ in range(n)]\n    size = 1\n    while size < n:\n        size *= 2\n    tree = [[] for _ in range(2 * size)]\n    for i, value in enumerate(arr):\n        tree[size + i] = [value]\n    for node in range(size - 1, 0, -1):\n        tree[node] = sorted(tree[2 * node] + tree[2 * node + 1])\n\n    def count(node, nl, nr, l, r, x):\n        if r <= nl or nr <= l:\n            return 0\n        if l <= nl and nr <= r:\n            return bisect.bisect_right(tree[node], x)\n        mid = (nl + nr) // 2\n        return count(node * 2, nl, mid, l, r, x) + count(node * 2 + 1, mid, nr, l, r, x)\n\n    out = []\n    for _ in range(q):\n        l = int(next(it)) - 1; r = int(next(it)); x = int(next(it))\n        out.append(str(count(1, 0, size, l, r, x)))\n    sys.stdout.write('\\n'.join(out) + '\\n')\n\nmain()\n",
  },
];
