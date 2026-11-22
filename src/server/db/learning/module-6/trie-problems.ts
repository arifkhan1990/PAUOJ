import type { SeedProblem } from "../../seed-problems";
import { newlineOutput, numbersInput } from "../generated-tests";

function trieG1Large(): { input: string; expectedOutput: string } {
  const words: string[] = [];
  for (let group = 0; group < 50; group += 1) {
    const base = `s${String(group).padStart(2, "0")}`;
    for (let i = 0; i < 400; i += 1) {
      words.push(`${base}${String(i).padStart(5, "0")}`);
    }
  }
  const queries: string[] = ["s", "s0", "s00", "s49", "s50", "x", "s0000"];
  for (let k = queries.length; k < 1000; k += 1) {
    const word = words[(k * 7919) % words.length];
    queries.push(word.slice(0, 1 + (k % 8)));
  }
  const counts = queries.map((prefix) =>
    words.filter((word) => word.startsWith(prefix)).length,
  );
  const input = `${words.length} ${queries.length}\n${words.join("\n")}\n${queries.join("\n")}\n`;
  return { input, expectedOutput: newlineOutput(counts) };
}

function trieG2Large(): { input: string; expectedOutput: string } {
  const words: string[] = [];
  for (let i = 0; i < 5000; i += 1) {
    words.push(`code${String(i).padStart(4, "0")}`);
  }
  const queries: string[] = [];
  for (let k = 0; k < 2000; k += 1) {
    const pick = String((k * 37) % 5000).padStart(4, "0");
    if (k % 4 === 0) queries.push(`code${pick}`);
    else if (k % 4 === 1) queries.push("code");
    else if (k % 4 === 2) queries.push(`code${pick.slice(0, 2)}`);
    else queries.push(k % 8 === 3 ? "z" : "c");
  }
  const sorted = [...words].sort();
  const answers = queries.map((prefix) => {
    for (const word of sorted) {
      if (word.startsWith(prefix)) return word;
    }
    return "-1";
  });
  const input = `${words.length} ${queries.length}\n${words.join("\n")}\n${queries.join("\n")}\n`;
  return { input, expectedOutput: newlineOutput(answers) };
}

function trieE1Large(): { input: string; expectedOutput: string } {
  const words: string[] = [];
  for (let i = 0; i < 100000; i += 1) words.push(`w${i % 7}`);
  const queries: string[] = [];
  for (let k = 0; k < 5000; k += 1) queries.push(`w${k % 9}`);
  const counts = new Map<string, number>();
  for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);
  const answers = queries.map((query) => counts.get(query) ?? 0);
  const input = `${words.length} ${queries.length}\n${words.join("\n")}\n${queries.join("\n")}\n`;
  return { input, expectedOutput: newlineOutput(answers) };
}

function trieM1Large(): { input: string; expectedOutput: string } {
  const pool: string[] = [];
  for (let i = 0; i < 500; i += 1) pool.push(`p${String(i).padStart(3, "0")}`);
  const ops: string[] = [];
  const counts = new Map<string, number>();
  for (let k = 0; k < 35000; k += 1) {
    const word = pool[(k * 37) % pool.length];
    ops.push(`1 ${word}`);
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  for (let k = 0; k < 5000; k += 1) {
    const word = pool[(k * 104729) % pool.length];
    const current = counts.get(word) ?? 0;
    if (current > 0) {
      ops.push(`2 ${word}`);
      counts.set(word, current - 1);
    } else {
      ops.push(`1 ${word}`);
      counts.set(word, 1);
    }
  }
  const prefixes = [
    "p",
    "p0",
    "p1",
    "p2",
    "p3",
    "p4",
    "p5",
    "p6",
    "p7",
    "p8",
    "p9",
    ...pool,
  ];
  const answers: number[] = [];
  for (let k = 0; k < 10000; k += 1) {
    const prefix = prefixes[k % prefixes.length];
    ops.push(`3 ${prefix}`);
    let found = 0;
    for (const [word, count] of counts) {
      if (word.startsWith(prefix)) found += count;
    }
    answers.push(found);
  }
  const input = `${ops.length}\n${ops.join("\n")}\n`;
  return { input, expectedOutput: newlineOutput(answers) };
}

function trieX1Large(): { input: string; expectedOutput: string } {
  const words: string[] = [];
  for (let i = 0; i < 2500; i += 1) {
    words.push(String(i));
    words.push(`${i}z`);
  }
  let pairs = 0;
  for (let i = 0; i < words.length; i += 1) {
    for (let j = 0; j < words.length; j += 1) {
      if (i !== j && words[j].startsWith(words[i])) pairs += 1;
    }
  }
  const input = `${words.length}\n${words.join("\n")}\n`;
  return { input, expectedOutput: newlineOutput([pairs]) };
}

function trieX2Large(): { input: string; expectedOutput: string } {
  const words: string[] = [];
  for (let i = 0; i < 2000; i += 1) words.push(`c${i}`);
  const queries: string[] = [];
  for (let k = 0; k < 2000; k += 1) {
    const mode = k % 4;
    if (mode === 0) queries.push(words[(k * 13) % words.length]);
    else if (mode === 1) queries.push(`${words[(k * 17) % words.length]}tail`);
    else if (mode === 2) queries.push("c");
    else queries.push("z");
  }
  const answers = queries.map((query) => {
    let found = 0;
    for (const word of words) {
      if (query.startsWith(word)) found += 1;
    }
    return found;
  });
  const input = `${words.length} ${queries.length}\n${words.join("\n")}\n${queries.join("\n")}\n`;
  return { input, expectedOutput: newlineOutput(answers) };
}

function trieH1Large(): { input: string; expectedOutput: string } {
  const values: number[] = [0, 1073741823];
  for (let i = 0; i < 99998; i += 1) {
    values.push((i * 2654435761) % 1073741824);
  }
  return { input: numbersInput(values), expectedOutput: "1073741823\n" };
}

export const TRIE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m6-trie-g1",
    title: "Prefix Counter",
    statement:
      "প্রাইমএশিয়া ইউনিভার্সিটির লাইব্রেরির ডিজিটাল ক্যাটালগে `n`টি শব্দ জমা আছে। লাইব্রেরিয়ান নুসরাত বারবার একটা অংশ (prefix) লিখে জানতে চান — ডিকশনারির কতগুলো শব্দ ঠিক সেই অংশ দিয়ে শুরু হয়েছে। একই শব্দ তালিকায় একাধিকবার থাকলে প্রতিটি কপিও আলাদা করে গুনতে হবে।\n\nউদাহরণ: শব্দ `cat, car, cap, dog` আর প্রিফিক্স `ca` দিলে উত্তর `3` — কারণ `cat`, `car`, `cap` তিনটিই `ca` দিয়ে শুরু হয়েছে।",
    inputFormat:
      "প্রথম লাইনে দুইটি পূর্ণসংখ্যা `n` ও `q`। পরের `n` লাইনে এক একটি করে শব্দ। তারপর `q` লাইনে এক একটি করে প্রিফিক্স।",
    outputFormat:
      "`q` লাইনে উত্তর — প্রতিটি প্রিফিক্সের জন্য ডিকশনারিতে সেই প্রিফিক্স দিয়ে শুরু হওয়া শব্দের সংখ্যা।",
    constraints:
      "`1 <= n <= 20000`\n`1 <= q <= 2000`\nশব্দ ও প্রিফিক্সের দৈর্ঘ্য `1 <= L <= 20`\nশুধুমাত্র ছোট ইংরেজি হরফ (`a-z`)",
    editorial:
      "### ধারণা\n\nএকটা শব্দ যদি অনেক শব্দের শুরুতে থাকে, তাহলে প্রতিবার পুরো তালিকা ঘোরার দরকার নেই — শব্দগুলো ট্রাইতে বসিয়ে প্রতিটি নোডে সাব-ট্রির শব্দসংখ্যা রাখলেই হয়। প্রিফিক্সের শেষ নোডে পৌঁছে সেই নোডের `count` পড়ে নেওয়াই উত্তর। প্রিফিক্সটা গাছে না মিললে উত্তর `0`।\n\n### ধাপে ধাপে\n\n1. রুট নোড বানান — তাতে `children` (dict) আর `count` থাকবে।\n2. প্রতিটি শব্দ ঢোকান: রুটের `count` বাড়ান, তারপর এক এক অক্ষর ধরে নিচে নামুন; পথের প্রতিটি নোডের `count` এক একবার বাড়ান।\n3. প্রতিটি প্রিফিক্স ধরে নিচে যান; কোনো অক্ষরে না মিললে থামুন এবং `0` লিখুন।\n4. পুরো প্রিফিক্স পেরোলে সেই নোডের `count` প্রিন্ট করুন।\n\n```python\nimport sys\n\ndata = sys.stdin.read().split()\nn = int(data[0]); q = int(data[1])\nwords = data[2:2 + n]\nprefixes = data[2 + n:2 + n + q]\nroot = [{}, 0]                      # [children, subtree word count]\nfor word in words:\n    node = root\n    node[1] += 1\n    for ch in word:\n        if ch not in node[0]:\n            node[0][ch] = [{}, 0]\n        node = node[0][ch]\n        node[1] += 1                # পথের প্রতিটি নোডের কাউন্টার বাড়াও\nout = []\nfor prefix in prefixes:\n    node, ok = root, True\n    for ch in prefix:\n        if ch not in node[0]:\n            ok = False\n            break\n        node = node[0][ch]\n    out.append(str(node[1]) if ok else '0')\nsys.stdout.write('\\n'.join(out))\n```\n\n### কমপ্লেক্সিটি\n\nনির্মাণ `O(মোট অক্ষর সংখ্যা)`, প্রতি প্রশ্ন `O(প্রিফিক্সের দৈর্ঘ্য)`। ডিকশনারির আকার `n` বাড়লেও প্রশ্নের সময় বাড়ে না। স্পেসও `O(মোট অক্ষর সংখ্যা)`।\n\n### সাধারণ ভুল\n\n- রুটের `count` বাড়ানো ভুলে গেলে খালি প্রিফিক্স বা সবচেয়ে ছোট প্রিফিক্সের সংখ্যা ভুল আসে।\n- প্রিফিক্স গাছের বাইরে গেলেও আগের নোডের `count` প্রিন্ট করে দেওয়া — অথচ উত্তর তখন `0`। অথচ ভাঙা পয়েন্টে থামতে হবে।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Trie", "Strings", "Prefix"],
    tests: [
      { input: "5 3\ncat\ncar\ncap\ndog\ndot\nca\ndo\nc\n", expectedOutput: "3\n2\n3\n", isSample: true },
      { input: "2 3\nab\nba\na\nb\nabc\n", expectedOutput: "1\n1\n0\n", isSample: true },
      { input: "4 2\nban\nban\nband\ncar\nban\ncar\n", expectedOutput: "3\n1\n", isSample: false },
      { input: "1 3\nhello\nh\nhello\nhelloo\n", expectedOutput: "1\n1\n0\n", isSample: false },
      { input: "3 2\ncat\ndog\nfish\nz\ncatx\n", expectedOutput: "0\n0\n", isSample: false },
      { ...trieG1Large(), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.read().split()\nn = int(data[0]); q = int(data[1])\nwords = data[2:2 + n]\nprefixes = data[2 + n:2 + n + q]\nroot = [{}, 0]\nfor word in words:\n    node = root\n    node[1] += 1\n    for ch in word:\n        if ch not in node[0]:\n            node[0][ch] = [{}, 0]\n        node = node[0][ch]\n        node[1] += 1\nout = []\nfor prefix in prefixes:\n    node, ok = root, True\n    for ch in prefix:\n        if ch not in node[0]:\n            ok = False\n            break\n        node = node[0][ch]\n    out.append(str(node[1]) if ok else '0')\nsys.stdout.write('\\n'.join(out))\n",
  },
  {
    slug: "learn-m6-trie-g2",
    title: "Autocomplete Suggestion",
    statement:
      "প্রাইমএশিয়া পোর্টালে নাম লেখার সময় সামনেই পরামর্শ দেখানো হয়। তানভীর সেই ফিচারটা বানাচ্ছেন: `n`টি ভিন্ন শব্দের ডিকশনারি দেওয়া থাকবে, তারপর `q`টি প্রিফিক্স। প্রতিটি প্রিফিক্সের জন্য ডিকশনারির ওই প্রিফিক্স দিয়ে শুরু হওয়া **সবচেয়ে ছোট** (lexicographically) শব্দটি দেখান; এমন কোনো শব্দ না থাকলে `-1` লিখুন।\n\nউদাহরণ: ডিকশনারি `app, apple, banana` এবং প্রিফিক্স `ap` হলে উত্তর `app`, কারণ `app` আর `apple`-এর মধ্যে `app` ছোট।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। পরের `n` লাইনে এক একটি ভিন্ন শব্দ। তারপর `q` লাইনে এক একটি প্রিফিক্স।",
    outputFormat:
      "`q` লাইনে উত্তর — প্রতিটি প্রিফিক্সের জন্য সবচেয়ে ছোট মিল শব্দ, না থাকলে `-1`।",
    constraints:
      "`1 <= n <= 5000`\n`1 <= q <= 2000`\nশব্দগুলো পরস্পর ভিন্ন, দৈর্ঘ্য `1 <= L <= 20`\nশুধুমাত্র ছোট ইংরেজি হরফ (`a-z`)",
    editorial:
      "### ধারণা\n\nশব্দগুলো একবার sort করে রাখলে যে শব্দগুলো একই প্রিফিক্স দিয়ে শুরু হয়, তারা তালিকায় পাশাপাশি থাকে এবং তাদের মধ্যে প্রথমটাই সবচেয়ে ছোট। তাই প্রতিটি প্রিফিক্সের জন্য binary search করে প্রথম শব্দটা বের করলেই হয় — কেবল সেটি সত্যিই প্রিফিক্স দিয়ে শুরু হয় কিনা যাচাই করতে হবে।\n\n### ধাপে ধাপে\n\n1. ডিকশনারির সব শব্দ আলফাবেটিক্যালভাবে সাজিয়ে নিন।\n2. প্রতিটি প্রিফিক্সের জন্য `bisect_left` দিয়ে প্রথম শব্দ খুঁজুন, যেটি প্রিফিক্সের সমান বা তার পরে।\n3. সেই শব্দটি যদি প্রিফিক্স দিয়ে শুরু হয় — তাহলে সেটাই উত্তর, নাহলে কোনো মিল নেই মানে `-1`।\n4. প্রিফিক্সের সমান কোনো শব্দ না থাকলে `bisect_left` পরের শব্দ ফেরত দেয়, তাই তাকেও যাচাই করতে হবে।\n\n```python\nimport sys, bisect\n\ndata = sys.stdin.read().split()\nn = int(data[0]); q = int(data[1])\nwords = sorted(data[2:2 + n])\nprefixes = data[2 + n:2 + n + q]\nout = []\nfor prefix in prefixes:\n    i = bisect.bisect_left(words, prefix)\n    if i < len(words) and words[i].startswith(prefix):\n        out.append(words[i])\n    else:\n        out.append('-1')\nsys.stdout.write('\\n'.join(out))\n```\n\n### কমপ্লেক্সিটি\n\nসাজানো `O(n log n)`, প্রতি প্রশ্ন `O(L + log n)` (প্রিফিক্স মিল যাচাই `O(L)`)। স্পেস `O(n)`।\n\n### সাধারণ ভুল\n\n- শুধু `words[i].startswith(prefix)` পরীক্ষা না করে প্রথম শব্দটাকেই ধরে নেওয়া — `ca`-র জন্য `cat` না থাকলে পরের শব্দ `cow` বা অন্য কিছু হতে পারে, এবং কোনোটাই মিল না থাকলে উত্তর `-1`।\n- sort না করে প্রতিটি প্রিফিক্সে পুরো তালিকা ঘোরালে `O(n * q)` হয়ে যায় — সীমার বাইরে।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Trie", "Strings", "Binary Search"],
    tests: [
      { input: "4 4\nbanana\napple\napp\nmango\nap\nban\nma\nzz\n", expectedOutput: "app\nbanana\nmango\n-1\n", isSample: true },
      { input: "1 2\ndog\nd\ndogx\n", expectedOutput: "dog\n-1\n", isSample: true },
      { input: "3 2\ncode\ncoding\ncol\nco\nx\n", expectedOutput: "code\n-1\n", isSample: false },
      { input: "3 2\ncar\ncat\ncow\ncau\ncz\n", expectedOutput: "-1\n-1\n", isSample: false },
      { input: "2 3\nba\nb\nb\nba\nbq\n", expectedOutput: "b\nba\n-1\n", isSample: false },
      { ...trieG2Large(), isSample: false },
    ],
    referencePython:
      "import sys, bisect\n\ndata = sys.stdin.read().split()\nn = int(data[0]); q = int(data[1])\nwords = sorted(data[2:2 + n])\nprefixes = data[2 + n:2 + n + q]\nout = []\nfor prefix in prefixes:\n    i = bisect.bisect_left(words, prefix)\n    if i < len(words) and words[i].startswith(prefix):\n        out.append(words[i])\n    else:\n        out.append('-1')\nsys.stdout.write('\\n'.join(out))\n",
  },
  {
    slug: "learn-m6-trie-e1",
    title: "Exact Word Count",
    statement:
      "প্রজেক্ট ফেয়ারে নাম জমা দেওয়ার ফর্মে একই নাম কয়েকবার এসেছে। সাদিয়া জানতে চান দেওয়া তালিকায় প্রতিটি নাম ঠিক কতবার এসেছে। `n`টি নামের তালিকা দেওয়া থাকবে, তারপর `q`টি প্রশ্ন — প্রতিটি প্রশ্নে একটা নাম থাকবে।\n\nপ্রতিটি প্রশ্নের জন্য সেই নামটির মোট আবির্ভাব সংখ্যা প্রিন্ট করুন। নামটি তালিকায় না থাকলে উত্তর `0`।\n\nউদাহরণ: তালিকা `pen, pen, cup` এবং প্রশ্ন `cup` হলে উত্তর `1`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। পরের `n` লাইনে এক একটি নাম। তারপর `q` লাইনে এক একটি প্রশ্নের নাম।",
    outputFormat:
      "`q` লাইনে উত্তর — প্রতিটি প্রশ্নের নাম তালিকায় কতবার এসেছে।",
    constraints:
      "`1 <= n <= 100000`\n`1 <= q <= 100000`\nনামের দৈর্ঘ্য `1 <= L <= 10`\nশুধুমাত্র ছোট ইংরেজি হরফ (`a-z`)",
    editorial:
      "### ধারণা\n\nএটা ট্রাইর সবচেয়ে মৌলিক কাজ: শব্দের শেষ নোডে `end` কাউন্টার রাখা। শব্দ ঢোকানোর সময় শেষ নোডের কাউন্টার এক বাড়ে, খোঁজার সময় সেখানেই থামে এবং কাউন্টারটা পড়ে নেয়। prefix-এর সাব-ট্রি কাউন্টার এখানে লাগে না — শুধু ঠিক মিলটাই চাওয়া হয়েছে। শব্দের দৈর্ঘ্য ছোট (সর্বোচ্চ ১০) বলে ট্রাইর গভীরতাও ছোট।\n\n### ধাপে ধাপে\n\n1. খালি ট্রাই বানান; প্রতিটি নোডে `children` আর শেষ-কাউন্টার রাখুন।\n2. তালিকার প্রতিটি নাম ঢোকান, শেষ নোডের কাউন্টার এক করে বাড়ান।\n3. প্রতিটি প্রশ্নের নাম গাছে ধরে চলুন; পুরো নাম মিলে গেলে শেষ নোডের কাউন্টার উত্তর, মাঝপথে না মিললে `0`।\n4. সব উত্তর এক এক লাইনে প্রিন্ট করুন।\n\n```python\nimport sys\n\ndata = sys.stdin.read().split()\nn = int(data[0]); q = int(data[1])\nnames = data[2:2 + n]\nqueries = data[2 + n:2 + n + q]\nchildren = [{}]\nends = [0]\nfor name in names:\n    node = 0\n    for ch in name:\n        if ch not in children[node]:\n            children[node][ch] = len(children)\n            children.append({})\n            ends.append(0)\n        node = children[node][ch]\n    ends[node] += 1\nout = []\nfor query in queries:\n    node, ok = 0, True\n    for ch in query:\n        if ch not in children[node]:\n            ok = False\n            break\n        node = children[node][ch]\n    out.append(str(ends[node]) if ok else '0')\nsys.stdout.write('\\n'.join(out))\n```\n\n### কমপ্লেক্সিটি\n\nনির্মাণ `O(মোট অক্ষর)`, প্রতি প্রশ্ন `O(নামের দৈর্ঘ্য)`। স্পেস `O(মোট অক্ষর)`।\n\n### সাধারণ ভুল\n\n- এখানে prefix সংখ্যা নয়, ঠিক পুরো নামের সংখ্যা চাওয়া হয়েছে — প্রশ্ন `in` হলে উত্তর `input` নামের হবে না।\n- প্রশ্নের নাম মাঝপথে না মিললে আগের নোডের কাউন্টার বসিয়ে দেওয়া — উত্তর তখন অবশ্যই `0`।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Trie", "Strings", "Counting"],
    tests: [
      { input: "5 3\npen\npen\ncup\ntable\ncup\npen\ncup\ntable\n", expectedOutput: "2\n2\n1\n", isSample: true },
      { input: "1 2\nkey\nkey\nmissing\n", expectedOutput: "1\n0\n", isSample: true },
      { input: "3 1\na\nb\nc\nd\n", expectedOutput: "0\n", isSample: false },
      { input: "4 4\nset\nset\nsettings\nnet\nset\nsettings\nsetx\nsettings\n", expectedOutput: "2\n1\n0\n1\n", isSample: false },
      { input: "6 2\nab\nab\nab\nabc\nabc\nbc\nab\nabc\n", expectedOutput: "3\n2\n", isSample: false },
      { ...trieE1Large(), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.read().split()\nn = int(data[0]); q = int(data[1])\nnames = data[2:2 + n]\nqueries = data[2 + n:2 + n + q]\nchildren = [{}]\nends = [0]\nfor name in names:\n    node = 0\n    for ch in name:\n        if ch not in children[node]:\n            children[node][ch] = len(children)\n            children.append({})\n            ends.append(0)\n        node = children[node][ch]\n    ends[node] += 1\nout = []\nfor query in queries:\n    node, ok = 0, True\n    for ch in query:\n        if ch not in children[node]:\n            ok = False\n            break\n        node = children[node][ch]\n    out.append(str(ends[node]) if ok else '0')\nsys.stdout.write('\\n'.join(out))\n",
  },
  {
    slug: "learn-m6-trie-m1",
    title: "Dynamic Dictionary",
    statement:
      "ল্যাবের সার্ভারে শব্দ যোগ হচ্ছে আর মুছেও যাচ্ছে, তাই স্ট্যাটিক ডিকশনারি কাজের নয়। `m`টি অপারেশন দেওয়া থাকবে:\n\n- `1 w` — শব্দ `w` ডিকশনারিতে একবার যোগ করুন।\n- `2 w` — শব্দ `w`-এর একটি কপি মুছে ফেলুন (এই অপারেশনের সময় `w` অবশ্যই ডিকশনারিতে থাকবে)।\n- `3 p` — ডিকশনারিতে কতগুলো শব্দ `p` দিয়ে শুরু হয়েছে তা প্রিন্ট করুন।\n\nশুধু `3` অপারেশনের উত্তর দিন। একই শব্দ একাধিকবার থাকলে প্রতিটি কপিও গুনা হবে।\n\nউদাহরণ: `1 cat`, `1 car`, `3 ca` দিলে উত্তর `2`; এরপর `2 cat`, `3 ca` দিলে উত্তর `1`।",
    inputFormat:
      "প্রথম লাইনে `m`। পরের `m` লাইনে এক একটি অপারেশন — `1 w`, `2 w` বা `3 p`।",
    outputFormat:
      "প্রতিটি `3` অপারেশনের জন্য একটি করে লাইনে শব্দ-সংখ্যা। অন্য অপারেশনে কিছু প্রিন্ট হবে না।",
    constraints:
      "`1 <= m <= 50000`\nশব্দ ও প্রিফিক্সের দৈর্ঘ্য `1 <= L <= 20`\nশুধুমাত্র ছোট ইংরেজি হরফ (`a-z`)",
    editorial:
      "### ধারণা\n\nডাইনামিক ডিকশনারিতে প্রতিটি শব্দের **প্রতিটি prefix**-এর কাউন্টার রাখলে প্রশ্নের উত্তর এক ধাপেই আসে। শব্দ ঢোকালে তার ১ থেকে `L` পর্যন্ত সব prefix-এর কাউন্টার এক বাড়ে, মুছে ফেললে এক কমে, আর `3 p` অপারেশনে শুধু `count[p]` পড়তে হয়। এটাই আসলে ট্রাই — শুধু নোডটাকে সেই নোড পর্যন্ত পাথের স্ট্রিং দিয়ে চিহ্নিত করা হয়েছে, তাই dict-এ বসে আছে।\n\n### ধাপে ধাপে\n\n1. খালি ম্যাপ নিন: `count[prefix]` = প্রিফিক্স `p` দিয়ে শুরু হওয়া শব্দের সংখ্যা।\n2. `1 w`: `j = 1..len(w)` লুপ চালিয়ে `count[w[:j]] += 1`।\n3. `2 w`: একই লুপে `count[w[:j]] -= 1`; কাউন্টার শূন্য হলে ম্যাপ থেকে মুছে ফেলুন (মেমরি বাঁচে)।\n4. `3 p`: `count.get(p, 0)` প্রিন্ট করুন।\n\n```python\nimport sys\nfrom collections import defaultdict\n\nlines = sys.stdin.read().splitlines()\nm = int(lines[0])\npref_count = defaultdict(int)\nout = []\nfor i in range(1, m + 1):\n    parts = lines[i].split()\n    op, word = parts[0], parts[1]\n    if op == '1':\n        for j in range(1, len(word) + 1):\n            pref_count[word[:j]] += 1\n    elif op == '2':\n        for j in range(1, len(word) + 1):\n            pref_count[word[:j]] -= 1\n            if pref_count[word[:j]] == 0:\n                del pref_count[word[:j]]\n    else:\n        out.append(str(pref_count.get(word, 0)))\nsys.stdout.write('\\n'.join(out) + '\\n' if out else '')\n```\n\n### কমপ্লেক্সিটি\n\nপ্রতি ইনসার্ট/ডিলিট `O(L)`, প্রতি প্রশ্ন `O(1)`। মোট সময় `O(m * L)`, স্পেসও `O(m * L)` পর্যন্ত (সাঝা prefix ভাগ হওয়ায় বাস্তবে অনেক কম)।\n\n### সাধারণ ভুল\n\n- ডিলিটের পরে শূন্য হয়ে যাওয়া prefix না মুছলে ম্যাপ ক্রমবর্ধমান থাকে এবং সংখ্যাও ঠিক থাকলেও মেমরি বাড়ে।\n- ডিলিটে মাইনাস করে ঋণাত্মক কাউন্টার রেখে দেওয়া (শব্দ না থাকা অবস্থায়) — প্রশ্নের শর্ত অনুযায়ী ডিলিট সবসময় বিদ্যমান শব্দের উপর, তবু কাউন্টার `0`-এ চলে আসা মানেই শব্দ নেই।\n- পুরো শব্দ ধরে খোঁজা (exact match) — অথচ প্রশ্নটা prefix-সংক্রান্ত।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Trie", "Strings", "Hash Map"],
    tests: [
      { input: "6\n1 cat\n1 car\n3 ca\n2 cat\n3 ca\n3 cat\n", expectedOutput: "2\n1\n0\n", isSample: true },
      { input: "4\n3 a\n1 a\n3 a\n2 a\n", expectedOutput: "0\n1\n", isSample: true },
      { input: "7\n1 a\n1 ab\n1 abc\n3 a\n3 ab\n3 abc\n3 abcd\n", expectedOutput: "3\n2\n1\n0\n", isSample: false },
      { input: "5\n1 xy\n1 xy\n2 xy\n3 x\n3 xy\n", expectedOutput: "1\n1\n", isSample: false },
      { input: "3\n2 gone\n1 only\n3 on\n", expectedOutput: "1\n", isSample: false },
      { ...trieM1Large(), isSample: false },
    ],
    referencePython:
      "import sys\nfrom collections import defaultdict\n\nlines = sys.stdin.read().splitlines()\nm = int(lines[0])\npref_count = defaultdict(int)\nout = []\nfor i in range(1, m + 1):\n    parts = lines[i].split()\n    op, word = parts[0], parts[1]\n    if op == '1':\n        for j in range(1, len(word) + 1):\n            pref_count[word[:j]] += 1\n    elif op == '2':\n        for j in range(1, len(word) + 1):\n            pref_count[word[:j]] -= 1\n            if pref_count[word[:j]] == 0:\n                del pref_count[word[:j]]\n    else:\n        out.append(str(pref_count.get(word, 0)))\nsys.stdout.write('\\n'.join(out) + '\\n' if out else '')\n",
  },
  {
    slug: "learn-m6-trie-h1",
    title: "Maximum XOR Pair",
    statement:
      "রাফির ওয়্যারলেস সেন্সর নেটওয়ার্কে `n`টি আইডি আছে, প্রতিটি `30` বিটের মধ্যে (`0` থেকে `2^30 - 1`)। নেটওয়ার্ক সেই দুটি আইডি বেছে নিতে চায় যাদের bitwise XOR সবচেয়ে বড় — কারণ XOR বড় হলে দুটি কোডের পার্থক্য সবচেয়ে বেশি থাকে।\n\nকোনো দুটি ভিন্ন সূচকের (`i != j`) জন্য `a[i] XOR a[j]` সর্বাধিক মান কত নির্ণয় করুন।\n\nউদাহরণ: `1, 2, 3` — জোড়াগুলোর XOR `3, 2, 1`; সর্বাধিক `3`।",
    inputFormat:
      "প্রথম লাইনে `n`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।",
    outputFormat: "সর্বাধিক XOR মান এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`2 <= n <= 100000`\n`0 <= a_i < 2^30`\nপ্রতিটি সংখ্যা একাধিকবার থাকতে পারে",
    editorial:
      "### ধারণা\n\nপ্রতিটি সংখ্যাকে বাইনারি হিসেবে একটা ট্রাইতে বসানো যায় — শব্দের বদলে ৩০ বিট, অক্ষরের বদলে `0`/`1`। নতুন সংখ্যা `x` ঢোকানোর আগে গাছ ধরে সবচেয়ে উল্টো বিট (`1 - bit`) দিয়ে যেতে চাইলেই হয় — কারণ উল্টো বিট মিললে সেই পজিশনে XOR-এ `1` পাওয়া যায়, যা সবচেয়ে বড় করে। উল্টো না থাকলে একই বিটে চলতে হয়। বড় বিট থেকে ছোট বিটে গেলে প্রতিটি ধাপে আমরা সবচেয়ে বেশি অঙ্ক নিশ্চিত করি।\n\n### ধাপে ধাপে\n\n1. প্রথম সংখ্যাটা গাছে ঢোকান।\n2. বাকি সংখ্যাগুলো এক এক করে নিন: আগে গাছ ধরে সর্বাধিক XOR মান বের করুন, তারপর সেই সংখ্যাটা গাছে ঢোকান।\n3. প্রতিটি ধাপের ফলের মধ্যে সবচেয়ে বড়টা জমা রাখুন।\n4. শেষে সেই সর্বাধিক মান প্রিন্ট করুন।\n\n```python\nimport sys\n\ndata = sys.stdin.read().split()\nn = int(data[0])\nnumbers = list(map(int, data[1:1 + n]))\nchildren = [[-1, -1]]\n\ndef insert(x):\n    node = 0\n    for bit in range(29, -1, -1):\n        b = (x >> bit) & 1\n        nxt = children[node][b]\n        if nxt == -1:\n            children.append([-1, -1])\n            nxt = len(children) - 1\n            children[node][b] = nxt\n        node = nxt\n\ndef best(x):\n    node, value = 0, 0\n    for bit in range(29, -1, -1):\n        b = (x >> bit) & 1\n        want = b ^ 1\n        if children[node][want] != -1:\n            value |= (1 << bit)\n            node = children[node][want]\n        else:\n            node = children[node][b]\n    return value\n\ninsert(numbers[0])\nanswer = 0\nfor x in numbers[1:]:\n    answer = max(answer, best(x))\n    insert(x)\nprint(answer)\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n * B)` যেখানে `B = 30` (বিটের সংখ্যা), স্পেস `O(n * B)`। `n = 100000` হলে মাত্র ৩০ লাখ ধাপ — Python-এও সহজে চলে।\n\n### সাধারণ ভুল\n\n- সবচেয়ে ছোট বিট থেকে শুরু করা — অথচ সর্বাধিক মান নির্ধারণ করে বড় বিট; বড় বিট থেকে শুরু করতে হয় (`29` থেকে `0`)।\n- একই সংখ্যা নিজের সাথে জোড়া ধরে ফেলা (`x XOR x = 0`) — প্রশ্নে `i != j` শর্ত আছে, তবে `n >= 2` বলে উত্তর তখনও শূন্য হয় না; এখানে সমস্যা হয় একটাই সংখ্যা থাকলে।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 4000,
    memoryLimitMb: 256,
    tags: ["Trie", "Bit Manipulation", "Binary Trie"],
    tests: [
      { input: "3\n1 2 3\n", expectedOutput: "3\n", isSample: true },
      { input: "2\n5 5\n", expectedOutput: "0\n", isSample: true },
      { input: "5\n0 0 0 0 0\n", expectedOutput: "0\n", isSample: false },
      { input: "6\n0 1 2 4 8 16\n", expectedOutput: "24\n", isSample: false },
      { input: "4\n1073741823 0 1073741822 1\n", expectedOutput: "1073741823\n", isSample: false },
      { ...trieH1Large(), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.read().split()\nn = int(data[0])\nnumbers = list(map(int, data[1:1 + n]))\nchildren = [[-1, -1]]\n\ndef insert(x):\n    node = 0\n    for bit in range(29, -1, -1):\n        b = (x >> bit) & 1\n        nxt = children[node][b]\n        if nxt == -1:\n            children.append([-1, -1])\n            nxt = len(children) - 1\n            children[node][b] = nxt\n        node = nxt\n\ndef best(x):\n    node, value = 0, 0\n    for bit in range(29, -1, -1):\n        b = (x >> bit) & 1\n        want = b ^ 1\n        if children[node][want] != -1:\n            value |= (1 << bit)\n            node = children[node][want]\n        else:\n            node = children[node][b]\n    return value\n\ninsert(numbers[0])\nanswer = 0\nfor x in numbers[1:]:\n    answer = max(answer, best(x))\n    insert(x)\nprint(answer)\n",
  },
  {
    slug: "learn-m6-trie-x1",
    title: "Words That Are Prefixes",
    statement:
      "ফেয়ারের প্রজেক্ট নামগুলো পরীক্ষার কমিটি যাচাই করছে — কোন নাম অন্য কোনো নামের শুরুর অংশ? দেওয়া থাকবে `n`টি **পরস্পর ভিন্ন** শব্দ। কয়েকটা জোড়া `(i, j)` আছে যেখানে `i != j` এবং `i`-তম শব্দটি ঠিক `j`-তম শব্দের prefix। এমন সব জোড়ার সংখ্যা নির্ণয় করুন।\n\nক্রম গুরুত্বপূর্ণ: `a` যদি `ab`-এর prefix হয়, তাহলে `(a, ab)` একটি জোড়া; উল্টোটা আলাদা জোড়া নয়।\n\nউদাহরণ: `a, ab, abc` — জোড়া হলো `(a, ab), (a, abc), (ab, abc)`, মোট `3`।",
    inputFormat:
      "প্রথম লাইনে `n`। পরের `n` লাইনে এক একটি ভিন্ন শব্দ।",
    outputFormat: "প্রয়োজনীয় জোড়ার মোট সংখ্যা এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= n <= 5000`\nশব্দগুলো পরস্পর ভিন্ন, দৈর্ঘ্য `1 <= L <= 30`\nমোট অক্ষর সংখ্যা `<= 100000`\nশুধুমাত্র ছোট ইংরেজি হরফ (`a-z`)",
    editorial:
      "### ধারণা\n\nশব্দ A যদি B-এর prefix হয়, তাহলে A ট্রাইতে B-এর পাথের একটা অংশ। তাই সব শব্দ গাছে বসিয়ে প্রতিটি নোডে `ends` (এই নোডে শেষ হওয়া শব্দ কতটা) রাখলে, প্রতিটি শব্দ নিজের পাথ ধরে চলার সময় পথের প্রতিটি নোডের `ends` যোগ করলেই পাওয়া যায় — কতগুলো শব্দ এই শব্দটাকে prefix ধরে আছে (নিজেসহ)। নিজের সংখ্যা এক বাদ দিলে `i != j` শর্ত পূরণ হয়।\n\n### ধাপে ধাপে\n\n1. সব শব্দ ট্রাইতে ঢোকান; শব্দের শেষ নোডে `ends += 1` করুন।\n2. প্রতিটি শব্দ আবার গাছ ধরে চলুন; প্রতিটি ধাপে সেই নোডের `ends` উত্তরে যোগ করুন।\n3. প্রতিটি শব্দের জন্য মোট থেকে `1` বিয়োগ করুন (নিজের সাথে নিজের জোড়া)।\n4. সব শব্দের ফল যোগ করলেই চাওয়া জোড়ার সংখ্যা।\n\n```python\nimport sys\n\ndata = sys.stdin.read().split()\nn = int(data[0])\nwords = data[1:1 + n]\nchildren = [{}]\nends = [0]\nfor word in words:\n    node = 0\n    for ch in word:\n        if ch not in children[node]:\n            children[node][ch] = len(children)\n            children.append({})\n            ends.append(0)\n        node = children[node][ch]\n    ends[node] += 1\nanswer = 0\nfor word in words:\n    node = 0\n    for ch in word:\n        node = children[node][ch]\n        answer += ends[node]\n    answer -= 1\nprint(answer)\n```\n\n### কমপ্লেক্সিটি\n\nনির্মাণ ও হিসাব দুটোই `O(মোট অক্ষর সংখ্যা)`, স্পেসও একই। সরাসরি `O(n^2)` লুপ দিলে `n = 5000`-এ ২ কোটি তুলনা — Python-এ ঝুঁকিপূর্ণ।\n\n### সাধারণ ভুল\n\n- নিজের নিজের সাথে জোড়া গুনে ফেলা — প্রতি শব্দে একটা করে `1` বাদ দিতে হবে।\n- `ends` না রেখে শুধু শেষ নোডের বিট রাখলে পথের মাঝের শব্দগুলো (যেমন `a`) ধরা পড়বে না।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Trie", "Strings", "Counting"],
    tests: [
      { input: "3\na\nab\nabc\n", expectedOutput: "3\n", isSample: true },
      { input: "1\ncode\n", expectedOutput: "0\n", isSample: true },
      { input: "3\ncat\ndog\nfish\n", expectedOutput: "0\n", isSample: false },
      { input: "4\nx\nxx\nxxx\nxxxx\n", expectedOutput: "6\n", isSample: false },
      { input: "4\nab\na\nb\nba\n", expectedOutput: "2\n", isSample: false },
      { ...trieX1Large(), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.read().split()\nn = int(data[0])\nwords = data[1:1 + n]\nchildren = [{}]\nends = [0]\nfor word in words:\n    node = 0\n    for ch in word:\n        if ch not in children[node]:\n            children[node][ch] = len(children)\n            children.append({})\n            ends.append(0)\n        node = children[node][ch]\n    ends[node] += 1\nanswer = 0\nfor word in words:\n    node = 0\n    for ch in word:\n        node = children[node][ch]\n        answer += ends[node]\n    answer -= 1\nprint(answer)\n",
  },
  {
    slug: "learn-m6-trie-x2",
    title: "Secret Code Lookup",
    statement:
      "সিক্রেট কোডের তালিকায় প্রতিটি কোড অন্য কোডের শুরুর অংশ হতে পারে। সাদিয়া দুটো তালিকা দেখছেন: আগে `n`টি গোপন কোড, তারপর `q`টি পরীক্ষামূলক স্ট্রিং।\n\nপ্রতিটি পরীক্ষামূলক স্ট্রিংয়ের জন্য বলুন — তালিকার কয়টি কোড ওই স্ট্রিংয়ের **prefix**। নিজেই যদি তালিকায় থাকে, তাও গুনতে হবে।\n\nউদাহরণ: কোড `in, input, out`, স্ট্রিং `input` — উত্তর `2` (`in` এবং `input`; `out` নয়)।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। পরের `n` লাইনে এক একটি কোড। তারপর `q` লাইনে এক একটি পরীক্ষামূলক স্ট্রিং।",
    outputFormat:
      "`q` লাইনে উত্তর — প্রতিটি স্ট্রিংয়ের জন্য তার prefix হিসেব থাকা কোডের সংখ্যা।",
    constraints:
      "`1 <= n <= 2000`\n`1 <= q <= 2000`\nস্ট্রিংয়ের দৈর্ঘ্য `1 <= L <= 50`\nশুধুমাত্র ছোট ইংরেজি হরফ (`a-z`)",
    editorial:
      "### ধারণা\n\nদিকটা উল্টে গেছে: এখানে ডিকশনারির শব্দ প্রশ্নের স্ট্রিংয়ের prefix কিনা দেখতে হবে। তাই ডিকশনারিকে set-এ রেখে প্রশ্নের স্ট্রিংয়ের **প্রতিটি শুরুর অংশ** (`query[:1]`, `query[:2]`, ... ) যাচাই করলেই হয় — প্রতিটি অংশ set-এ থাকলে সেটি একটি কোড। সরাসরি প্রতিটি কোড দিয়ে পরীক্ষা করলে `O(n * q * L)` হয়, এখানে `O(q * L)`-এই কাজ শেষ।\n\n### ধাপে ধাপে\n\n1. `n`টি কোড পড়ে set-এ রাখুন।\n2. প্রতিটি পরীক্ষামূলক স্ট্রিংয়ের জন্য `j = 1..len(query)` লুপ চালান।\n3. `query[:j]` যদি set-এ থাকে, কাউন্টার এক বাড়ান।\n4. প্রতিটি উত্তর আলাদা লাইনে প্রিন্ট করুন।\n\n```python\nimport sys\n\ndata = sys.stdin.read().split()\nn = int(data[0]); q = int(data[1])\ncodes = data[2:2 + n]\nqueries = data[2 + n:2 + n + q]\ncode_set = set(codes)\nout = []\nfor query in queries:\n    found = 0\n    for j in range(1, len(query) + 1):\n        if query[:j] in code_set:\n            found += 1\n    out.append(str(found))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n### কমপ্লেক্সিটি\n\nনির্মাণ `O(মোট কোডের দৈর্ঘ্য)`, প্রতি প্রশ্ন `O(স্ট্রিংয়ের দৈর্ঘ্য)`, স্পেস `O(মোট কোডের দৈর্ঘ্য)`।\n\n### সাধারণ ভুল\n\n- শুধু পুরো স্ট্রিংটা set-এ আছে কিনা দেখা — অথচ প্রতিটি ছোট অংশ যাচাই করতে হয়।\n- `query[:j]`-এর জায়গায় `query[j:]` (শেষের অংশ) বসিয়ে দেওয়া, অথবা `j` শূন্য থেকে শুরু করা — শূন্য দৈর্ঘ্যের prefix নয়, ১ থেকে শুরু।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Trie", "Strings", "Hash Set"],
    tests: [
      { input: "3 2\nin\ninput\nout\ninput\ni\n", expectedOutput: "2\n0\n", isSample: true },
      { input: "1 1\nx\nxyz\n", expectedOutput: "1\n", isSample: true },
      { input: "2 2\ncat\ndog\nfish\nbirds\n", expectedOutput: "0\n0\n", isSample: false },
      { input: "2 2\nab\ncd\nab\ncd\n", expectedOutput: "1\n1\n", isSample: false },
      { input: "4 1\na\nab\nabc\nbc\nabcdxyz\n", expectedOutput: "3\n", isSample: false },
      { ...trieX2Large(), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.read().split()\nn = int(data[0]); q = int(data[1])\ncodes = data[2:2 + n]\nqueries = data[2 + n:2 + n + q]\ncode_set = set(codes)\nout = []\nfor query in queries:\n    found = 0\n    for j in range(1, len(query) + 1):\n        if query[:j] in code_set:\n            found += 1\n    out.append(str(found))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
];
