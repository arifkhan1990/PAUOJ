import type { SeedProblem } from "../../seed-problems";
import { newlineOutput, numbersInput } from "../generated-tests";

function trieE2Large(): { input: string; expectedOutput: string } {
  const words: string[] = [];
  for (let i = 0; i < 50000; i += 1) words.push(`code${i}`);
  const prefixSet = new Set<string>();
  for (const word of words) {
    for (let j = 1; j <= word.length; j += 1) prefixSet.add(word.slice(0, j));
  }
  const queries: string[] = [];
  const answers: string[] = [];
  for (let k = 0; k < 50000; k += 1) {
    const mode = k % 5;
    let query: string;
    if (mode === 0) query = `code${(k * 7919) % 50000}`;
    else if (mode === 1) query = "code";
    else if (mode === 2) query = `code${(k * 104729) % 50000}`.slice(0, 4 + (k % 4));
    else if (mode === 3) query = k % 2 === 0 ? "cod" : "c";
    else query = k % 4 === 1 ? "codez" : "z";
    queries.push(query);
    answers.push(prefixSet.has(query) ? "YES" : "NO");
  }
  const input = `${words.length} ${queries.length}\n${words.join("\n")}\n${queries.join("\n")}\n`;
  return { input, expectedOutput: newlineOutput(answers) };
}

function trieE3Large(): { input: string; expectedOutput: string } {
  const words: string[] = [];
  for (let i = 0; i < 30000; i += 1) words.push(`cmd${i}`);
  const wordSet = new Set(words);
  const prefixSet = new Set<string>();
  for (const word of words) {
    for (let j = 1; j <= word.length; j += 1) prefixSet.add(word.slice(0, j));
  }
  const queries: string[] = [];
  const answers: string[] = [];
  for (let k = 0; k < 30000; k += 1) {
    const mode = k % 4;
    if (mode === 0) {
      const word = words[(k * 7919) % words.length];
      queries.push(word);
      answers.push("word");
    } else if (mode === 1) {
      queries.push("cmd");
      answers.push("prefix");
    } else if (mode === 2) {
      const word = words[(k * 104729) % words.length];
      const cut = word.slice(0, 4 + (k % 4));
      queries.push(cut);
      answers.push(wordSet.has(cut) ? "word" : "prefix");
    } else {
      queries.push(k % 2 === 0 ? `cmd${30000 + (k % 100)}` : `xmd${k}`);
      answers.push("none");
    }
  }
  const input = `${words.length} ${queries.length}\n${words.join("\n")}\n${queries.join("\n")}\n`;
  return { input, expectedOutput: newlineOutput(answers) };
}

function trieM2Large(): { input: string; expectedOutput: string } {
  const words: string[] = [];
  for (let i = 0; i < 20000; i += 1) words.push(`w${String(i).padStart(5, "0")}`);
  const sorted = [...words].sort();
  const lowerBound = (target: string): number => {
    let lo = 0, hi = sorted.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (sorted[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  const countWithPrefix = (prefix: string): number => lowerBound(`${prefix}~`) - lowerBound(prefix);
  const queries: string[] = [];
  const answers: string[] = [];
  for (let k = 0; k < 10000; k += 1) {
    if (k % 4 === 3) {
      queries.push(`x${k} 1`);
      answers.push("-1");
      continue;
    }
    const base = words[(k * 7919) % words.length];
    const prefix = base.slice(0, 1 + (k % 6));
    const count = countWithPrefix(prefix);
    const rank = k % 7 === 0 ? count + 1 : 1 + (k % count);
    queries.push(`${prefix} ${rank}`);
    answers.push(rank <= count ? sorted[lowerBound(prefix) + rank - 1] : "-1");
  }
  const input = `${words.length} ${queries.length}\n${words.join("\n")}\n${queries.join("\n")}\n`;
  return { input, expectedOutput: newlineOutput(answers) };
}

function trieM3Large(): { input: string; expectedOutput: string } {
  const words: string[] = [];
  for (let i = 0; i < 20000; i += 1) words.push(`a${String(i).padStart(6, "0")}`);
  for (let i = 0; i < 5000; i += 1) words.push(`b${String(i).padStart(6, "0")}tail${i % 10}`);
  const best = new Map<string, number>();
  for (const word of words) {
    for (let j = 1; j <= word.length; j += 1) {
      const prefix = word.slice(0, j);
      const current = best.get(prefix);
      if (current === undefined || word.length > current) best.set(prefix, word.length);
    }
  }
  const queries: string[] = [];
  const answers: string[] = [];
  for (let k = 0; k < 50000; k += 1) {
    const mode = k % 4;
    let query: string;
    if (mode === 0) query = "a";
    else if (mode === 1) {
      const word = words[(k * 7919) % 25000];
      query = word.slice(0, 1 + (k % word.length));
    } else if (mode === 2) query = k % 2 === 0 ? "b" : `b${String((k * 37) % 5000).padStart(6, "0")}`;
    else query = `z${k}`;
    queries.push(query);
    answers.push(String(best.get(query) ?? -1));
  }
  const input = `${words.length} ${queries.length}\n${words.join("\n")}\n${queries.join("\n")}\n`;
  return { input, expectedOutput: newlineOutput(answers) };
}

function maxSubarrayXor(values: number[]): number {
  const children: number[][] = [[-1, -1]];
  const insert = (x: number): void => {
    let node = 0;
    for (let bit = 29; bit >= 0; bit -= 1) {
      const b = (x >>> bit) & 1;
      let next = children[node][b];
      if (next === -1) {
        children.push([-1, -1]);
        next = children.length - 1;
        children[node][b] = next;
      }
      node = next;
    }
  };
  const best = (x: number): number => {
    let node = 0, value = 0;
    for (let bit = 29; bit >= 0; bit -= 1) {
      const b = (x >>> bit) & 1;
      const want = b ^ 1;
      if (children[node][want] !== -1) {
        value |= 1 << bit;
        node = children[node][want];
      } else {
        node = children[node][b];
      }
    }
    return value;
  };
  insert(0);
  let prefix = 0, answer = 0;
  for (const value of values) {
    prefix ^= value;
    answer = Math.max(answer, best(prefix));
    insert(prefix);
  }
  return answer;
}

function trieH2Brute(n: number): { input: string; expectedOutput: string } {
  const values: number[] = [];
  for (let i = 0; i < n; i += 1) values.push((i * 2654435761) % 1073741824);
  let answer = 0;
  for (let l = 0; l < n; l += 1) {
    let acc = 0;
    for (let r = l; r < n; r += 1) {
      acc ^= values[r];
      if (acc > answer) answer = acc;
    }
  }
  return { input: numbersInput(values), expectedOutput: newlineOutput([answer]) };
}

function trieH2Large(): { input: string; expectedOutput: string } {
  const values: number[] = [];
  for (let i = 0; i < 100000; i += 1) values.push((i * 2654435761) % 1073741824);
  return { input: numbersInput(values), expectedOutput: newlineOutput([maxSubarrayXor(values)]) };
}

export const TRIE_PRACTICE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m6-trie-e2",
    title: "Prefix Match Check",
    statement:
      "প্রাইমএশিয়ার পোর্টালে সার্চ বক্সে অক্ষর লেখা শুরু হলেই সার্ভার আন্দাজ করতে হয় — এই অংশটা দিয়ে শুরু হওয়া কোনো শব্দ ক্যাটালগে আছে কি না। মিল থাকলে সাজেশন দেখানো যায়, না থাকলে সার্চ অ্যাভয়েড হয়।\n\n`n`টি শব্দের তালিকা দেওয়া থাকবে, তারপর `q`টি প্রিফিক্স। প্রতিটি প্রিফিক্সের জন্য ছাপাও — তালিকায় অন্তত একটি শব্দ আছে কি না যেটা ওই প্রিফিক্স দিয়ে শুরু হয়েছে। থাকলে `YES`, না থাকলে `NO`।\n\nউদাহরণ: তালিকা `cat, car, dog, dot` এবং প্রিফিক্স `ca` হলে উত্তর `YES` — কারণ `cat` আর `car` দুটোই `ca` দিয়ে শুরু হয়েছে।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। পরের `n` লাইনে এক একটি শব্দ। তারপর `q` লাইনে এক একটি প্রিফিক্স।",
    outputFormat: "`q` লাইনে উত্তর — প্রতিটি প্রিফিক্সের জন্য `YES` অথবা `NO`।",
    constraints:
      "`1 <= n <= 50000`\n`1 <= q <= 50000`\nশব্দ ও প্রিফিক্সের দৈর্ঘ্য `1 <= L <= 20`\nশব্দ একাধিকবার থাকতে পারে, শুধুমাত্র ছোট ইংরেজি হরফ (`a-z`)",
    editorial:
      "## ধারণা\n\nগাছে প্রতিটি শব্দ ঢোকানোর পর প্রিফিক্সের রুট থেকে নামার পথটাই সব তথ্য। পথের কোনো ধাপে প্রয়োজনীয় অক্ষরের নোড না পেলে বুঝে যাও — ওই প্রিফিক্সের কোনো শব্দই নেই, উত্তর `NO`। পুরো প্রিফিক্স পেরোনো গেলে ওই পথ দিয়ে অন্তত একটা শব্দ গিয়েছিল, তাই উত্তর `YES`। খেয়াল করো — এখানে কোনো সংখ্যা গোনার দরকার নেই, শুধু পথ মিলছে কি না সেটাই যথেষ্ট।\n\n## ধাপে ধাপে\n\n1. প্রতিটি নোডকে একটা dict ধরে ট্রাই বানাও — কী অক্ষর, মান পরের নোড।\n2. সব শব্দ ঢোকাও; না থাকা অক্ষরে নতুন নোড বানাও।\n3. প্রতিটি প্রিফিক্স ধরে রুট থেকে নামো; কোনো ধাপে নোড না পেলে সঙ্গে সঙ্গে থেমে `NO` লিখো।\n4. পুরো পথ শেষ হলে `YES` লিখো।\n\n```python\nimport sys\n\ndata = sys.stdin.read().split()\nn = int(data[0]); q = int(data[1])\nwords = data[2:2 + n]\nqueries = data[2 + n:2 + n + q]\nroot = {}\nfor word in words:\n    node = root\n    for ch in word:\n        if ch not in node:\n            node[ch] = {}\n        node = node[ch]\nout = []\nfor prefix in queries:\n    node, ok = root, True\n    for ch in prefix:\n        if ch not in node:\n            ok = False\n            break\n        node = node[ch]\n    out.append('YES' if ok else 'NO')\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n## কমপ্লেক্সিটি\n\nনির্মাণ `O(মোট অক্ষর)`, প্রতি প্রশ্ন `O(প্রিফিক্সের দৈর্ঘ্য)`, স্পেস `O(মোট অক্ষর)`। তালিকায় লাখ শব্দ থাকলেও প্রতিটি প্রশ্নের কাজ প্রিফিক্সের দৈর্ঘ্যের সমান।\n\n## সাধারণ ভুল\n\n- শেষ নোডে শব্দ-শেষ চিহ্ন (`end`) মিলিয়ে দেখা — অথচ প্রশ্নে পুরো শব্দ চাওয়া হয়নি, শুধু মিল আছে কি না।\n- মাঝপথে নোড না পেয়েও লুপ চালিয়ে যাওয়া — তখন ভুল নোডে ঘুরে ফল নষ্ট হয়; না মিললে সঙ্গে সঙ্গে থেমে `NO` লিখো।\n- প্রতি প্রশ্নে পুরো তালিকা ঘুরে `startswith` মেলানো — `O(n * q)` হয়ে সীমার বাইরে চলে যায়।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Trie", "Strings", "Prefix"],
    tests: [
      { input: "4 4\ncat\ncar\ndog\ndot\nca\ndo\nz\ncat\n", expectedOutput: "YES\nYES\nNO\nYES\n", isSample: true },
      { input: "2 3\nab\nba\na\nba\nabc\n", expectedOutput: "YES\nYES\nNO\n", isSample: true },
      { input: "1 3\nhello\nh\nhello\nhelloo\n", expectedOutput: "YES\nYES\nNO\n", isSample: false },
      { input: "3 3\ncat\ndog\nfish\nx\ncatx\ndo\n", expectedOutput: "NO\nNO\nYES\n", isSample: false },
      { input: "3 3\nban\nban\nband\nban\nband\nbanx\n", expectedOutput: "YES\nYES\nNO\n", isSample: false },
      { ...trieE2Large(), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.read().split()\nn = int(data[0]); q = int(data[1])\nwords = data[2:2 + n]\nqueries = data[2 + n:2 + n + q]\nroot = {}\nfor word in words:\n    node = root\n    for ch in word:\n        if ch not in node:\n            node[ch] = {}\n        node = node[ch]\nout = []\nfor prefix in queries:\n    node, ok = root, True\n    for ch in prefix:\n        if ch not in node:\n            ok = False\n            break\n        node = node[ch]\n    out.append('YES' if ok else 'NO')\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-trie-e3",
    title: "Word Or Prefix",
    statement:
      "নুসরাতের চ্যাট অ্যাসিস্ট্যান্টে `n`টি ভিন্ন কমান্ড জমা আছে। ইউজার যা লেখে, তার তিনটা অবস্থার একটা হয়: লেখাটা ঠিক একটা কমান্ড হলে `word`, কমান্ড না হলেও কোনো কমান্ডের শুরুর অংশ হলে `prefix`, আর দুটোই না হলে `none`।\n\n`q`টি প্রশ্নে এক একটা লেখা দেওয়া থাকবে; প্রতিটির অবস্থা ছাপাও।\n\nউদাহরণ: কমান্ড `help, hello, hi` হলে `hi` → `word`, `hel` → `prefix`, `helpx` → `none`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। পরের `n` লাইনে এক একটি ভিন্ন কমান্ড। তারপর `q` লাইনে এক একটি লেখা।",
    outputFormat: "`q` লাইনে উত্তর — প্রতিটি লেখার জন্য `word`, `prefix` বা `none`।",
    constraints:
      "`1 <= n <= 30000`\n`1 <= q <= 30000`\nকমান্ডগুলো পরস্পর ভিন্ন, দৈর্ঘ্য `1 <= L <= 20`\nশুধুমাত্র ছোট ইংরেজি হরফ (`a-z`)",
    editorial:
      "## ধারণা\n\nআগের সমস্যায় শুধু পথ মিলছে কি না দেখেছি; এবার পথের শেষ নোডে আরেকটা তথ্য দরকার — ওই নোডে কোনো কমান্ড শেষ হয়েছে কি না। তাই প্রতিটি নোডে সন্তানদের পাশাপাশি একটা `end` ফ্ল্যাগ রাখো। প্রশ্নের লেখা গাছে না মিললে `none`; মিললে শেষ নোডের ফ্ল্যাগ দেখো — ফ্ল্যাগ বসানো থাকলে `word`, নাহলে নিচে কমান্ড থাকলেও লেখাটা নিজে কমান্ড নয়, তাই `prefix`।\n\n## ধাপে ধাপে\n\n1. ট্রাই বানাও — প্রতিটি নোডে `children` (dict) আর `end` (শুরুতে `False`)।\n2. প্রতিটি কমান্ড ঢোকিয়ে শেষ নোডে `end = True` দাও।\n3. প্রতিটি লেখা গাছ ধরে নামো; কোথাও না মিললে `none` লিখো।\n4. পুরো লেখা মিললে `end` ফ্ল্যাগ দেখে `word` বা `prefix` লিখো।\n\n```python\nimport sys\n\ndata = sys.stdin.read().split()\nn = int(data[0]); q = int(data[1])\nwords = data[2:2 + n]\nqueries = data[2 + n:2 + n + q]\nchildren = [{}]\nends = [False]\nfor word in words:\n    node = 0\n    for ch in word:\n        if ch not in children[node]:\n            children[node][ch] = len(children)\n            children.append({})\n            ends.append(False)\n        node = children[node][ch]\n    ends[node] = True\nout = []\nfor query in queries:\n    node, ok = 0, True\n    for ch in query:\n        if ch not in children[node]:\n            ok = False\n            break\n        node = children[node][ch]\n    if not ok:\n        out.append('none')\n    elif ends[node]:\n        out.append('word')\n    else:\n        out.append('prefix')\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n## কমপ্লেক্সিটি\n\nনির্মাণ `O(মোট অক্ষর)`, প্রতি প্রশ্ন `O(লেখার দৈর্ঘ্য)`, স্পেস `O(মোট অক্ষর)`।\n\n## সাধারণ ভুল\n\n- পথ মিললেই `word` ছাপানো — অথচ নিচে আরও অক্ষর থাকলে লেখাটা শুধু শুরুর অংশ।\n- `end` ফ্ল্যাগের জায়গায় সাব-ট্রির সংখ্যা গিয়ে শব্দ আছে কি না বলা — দুই তথ্য আলাদা; নোডে শব্দ শেষ হয়েছে কি না সেটাই এখানে লাগবে।\n- না মেলা লেখাকে `prefix` ধরে নেওয়া — পথ ভাঙলে অবস্থা `none`।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Trie", "Strings", "Search"],
    tests: [
      { input: "3 6\nhelp\nhello\nhi\nhi\nh\nhel\nhelpx\nhello\nxyz\n", expectedOutput: "word\nprefix\nprefix\nnone\nword\nnone\n", isSample: true },
      { input: "1 4\ngo\ngo\ng\ngoing\no\n", expectedOutput: "word\nprefix\nnone\nnone\n", isSample: true },
      { input: "1 3\na\na\naa\nb\n", expectedOutput: "word\nnone\nnone\n", isSample: false },
      { input: "3 5\na\nab\nabc\nabc\nab\na\nabcd\nac\n", expectedOutput: "word\nword\nword\nnone\nnone\n", isSample: false },
      { input: "4 4\nx\nxy\nxyz\nxx\nx\nxx\nxz\nxyzx\n", expectedOutput: "word\nword\nnone\nnone\n", isSample: false },
      { ...trieE3Large(), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.read().split()\nn = int(data[0]); q = int(data[1])\nwords = data[2:2 + n]\nqueries = data[2 + n:2 + n + q]\nchildren = [{}]\nends = [False]\nfor word in words:\n    node = 0\n    for ch in word:\n        if ch not in children[node]:\n            children[node][ch] = len(children)\n            children.append({})\n            ends.append(False)\n        node = children[node][ch]\n    ends[node] = True\nout = []\nfor query in queries:\n    node, ok = 0, True\n    for ch in query:\n        if ch not in children[node]:\n            ok = False\n            break\n        node = children[node][ch]\n    if not ok:\n        out.append('none')\n    elif ends[node]:\n        out.append('word')\n    else:\n        out.append('prefix')\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-trie-m2",
    title: "Kth Autocomplete",
    statement:
      "তানভির অটোকমপ্লিট বানাচ্ছিলেন — প্রিফিক্স লিখলে মিল পাওয়া শব্দগুলো ছোট থেকে বড় সাজিয়ে দেখান। স্ক্রল বাঁচাতে দরকার শুধু `k` নম্বর সাজেশনটা।\n\n`n`টি ভিন্ন শব্দের ডিকশনারি দেওয়া থাকবে, তারপর `q`টি প্রশ্ন `p k` — প্রিফিক্স `p` দিয়ে শুরু হওয়া শব্দগুলোর মধ্যে অভিধান-ক্রমে (lexicographic) `k`-তম ছোট শব্দটি প্রিন্ট করো। ওই প্রিফিক্সের মিল `k`টার কম হলে `-1`।\n\nউদাহরণ: ডিকশনারি `app, apple, banana` এবং প্রশ্ন `ap 2` হলে উত্তর `apple` — `app` ছোট, `apple` তার ঠিক পরেরটা।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। পরের `n` লাইনে এক একটি ভিন্ন শব্দ। তারপর `q` লাইনে প্রশ্ন `p k`।",
    outputFormat: "`q` লাইনে উত্তর — `k`-তম ছোট মিল শব্দ, না থাকলে `-1`।",
    constraints:
      "`1 <= n <= 20000`\n`1 <= q <= 10000`\nশব্দের দৈর্ঘ্য `1 <= L <= 20`, `1 <= k <= n`\nশুধুমাত্র ছোট ইংরেজি হরফ (`a-z`)",
    editorial:
      "## ধারণা\n\nট্রাইতে দুইটা কাউন্টার রাখলে `k`-তম শব্দ গাছ ধরে নামা-নামা খুঁজে নেওয়া যায়। প্রতিটি নোডে `cnt` = ওই নোডের সাব-ট্রিতে মোট শব্দ সংখ্যা আর `end` = ঠিক ওই নোডে শেষ হওয়া শব্দের সংখ্যা। প্রিফিক্সের নোডে পৌঁছে প্রথমে `k` থেকে `end` বিয়োগ করো — কারণ প্রিফিক্সের সমান শব্দটাই (থাকলে) সাব-ট্রির সবচেয়ে ছোট। বাকি `k` যদি এখনো বাকি থাকে, সন্তানদের অক্ষর-ক্রমে দেখো — যে সন্তানের `cnt`-এর মধ্যে `k` পড়ে, উত্তর ওই সাব-ট্রিতে; `cnt` বাদ দিয়ে নামো। প্রতিটি ধাপে উত্তরের একটা অক্ষর বসে যায়।\n\n## ধাপে ধাপে\n\n1. ট্রাই বানাও; ঢোকানোর সময় পথের প্রতিটি নোডে `cnt += 1`, শেষ নোডে `end += 1`।\n2. প্রশ্নে প্রিফিক্স ধরে নোডে নামো; না মিললে বা `k > cnt` হলে `-1`।\n3. `k -= end`; `k <= 0` হলে প্রিফিক্সটাই উত্তর।\n4. সন্তানদের sorted ক্রমে স্ক্যান করো — `k <= cnt[সন্তান]` হলে সেদিকে নেমে অক্ষরটা উত্তরে জোড়ো আর নতুন নোডে একই নিয়ম চালাও; না পড়লে `cnt` বাদ দিয়ে পরের সন্তান দেখো।\n\n```python\nimport sys\n\ndata = sys.stdin.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nchildren = [{}]\nends = [0]\ncnt = [0]\nfor _ in range(n):\n    word = next(it)\n    node = 0\n    cnt[0] += 1\n    for ch in word:\n        if ch not in children[node]:\n            children[node][ch] = len(children)\n            children.append({})\n            ends.append(0)\n            cnt.append(0)\n        node = children[node][ch]\n        cnt[node] += 1\n    ends[node] += 1\n\ndef kth_word(node, k, prefix):\n    while True:\n        k -= ends[node]\n        if k <= 0:\n            return prefix\n        for ch in sorted(children[node]):\n            child = children[node][ch]\n            if k <= cnt[child]:\n                node = child\n                prefix += ch\n                break\n            k -= cnt[child]\n        else:\n            return '-1'\n\nout = []\nfor _ in range(q):\n    prefix = next(it)\n    k = int(next(it))\n    node, ok = 0, True\n    for ch in prefix:\n        if ch not in children[node]:\n            ok = False\n            break\n        node = children[node][ch]\n    if not ok or k > cnt[node]:\n        out.append('-1')\n    else:\n        out.append(kth_word(node, k, prefix))\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n## কমপ্লেক্সিটি\n\nনির্মাণ `O(মোট অক্ষর)`। প্রতি প্রশ্নে প্রিফিক্সের পথ `O(L)`, তারপর প্রতি স্তরে সর্বোচ্চ ২৬টা সন্তান দেখা লাগে — মোট `O(26 * L)`। সব মিলিয়ে `q * L * 26`, এখানে খুব ছোট।\n\n## সাধারণ ভুল\n\n- প্রিফিক্সের সমান শব্দটাকে সাব-ট্রির শেষে ধরা — অথচ `app` আর `apple`-এর মধ্যে `app` ছোট, কারণ ছোট শব্দ আগে শেষ হয়।\n- সন্তানদের dict-এর ভেতরের ক্রম ধরে স্ক্যান করা — অক্ষর-ক্রম নিশ্চিত করতে `sorted` লাগবে।\n- সন্তান স্কিপ করার সময় `cnt[child]` বাদ না দিলে `k` কখনো কমে না, খোঁজা একই জায়গায় আটকে থেকে যায়।\n- `k` বাড়ানোর সময় নোডে শেষ হওয়া শব্দ বাদ না দিলে `end`-ওয়ালা শব্দ দুইবার গোনা হয়ে যায়।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Trie", "Strings", "Order Statistics"],
    tests: [
      { input: "3 5\napp\napple\nbanana\nap 1\nap 2\nap 3\nb 1\na 1\n", expectedOutput: "app\napple\n-1\nbanana\napp\n", isSample: true },
      { input: "3 4\na\nab\nabc\na 1\na 2\na 3\na 4\n", expectedOutput: "a\nab\nabc\n-1\n", isSample: true },
      { input: "3 5\ncat\ncar\ncap\nca 1\nca 2\nca 3\nca 4\nc 3\n", expectedOutput: "cap\ncar\ncat\n-1\ncat\n", isSample: false },
      { input: "2 4\nab\nabc\nab 1\nab 2\nabc 1\nabc 2\n", expectedOutput: "ab\nabc\nabc\n-1\n", isSample: false },
      { input: "2 3\nset\nsettings\nse 1\nzz 1\nsettings 1\n", expectedOutput: "set\n-1\nsettings\n", isSample: false },
      { ...trieM2Large(), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.read().split()\nit = iter(data)\nn = int(next(it)); q = int(next(it))\nchildren = [{}]\nends = [0]\ncnt = [0]\nfor _ in range(n):\n    word = next(it)\n    node = 0\n    cnt[0] += 1\n    for ch in word:\n        if ch not in children[node]:\n            children[node][ch] = len(children)\n            children.append({})\n            ends.append(0)\n            cnt.append(0)\n        node = children[node][ch]\n        cnt[node] += 1\n    ends[node] += 1\n\ndef kth_word(node, k, prefix):\n    while True:\n        k -= ends[node]\n        if k <= 0:\n            return prefix\n        for ch in sorted(children[node]):\n            child = children[node][ch]\n            if k <= cnt[child]:\n                node = child\n                prefix += ch\n                break\n            k -= cnt[child]\n        else:\n            return '-1'\n\nout = []\nfor _ in range(q):\n    prefix = next(it)\n    k = int(next(it))\n    node, ok = 0, True\n    for ch in prefix:\n        if ch not in children[node]:\n            ok = False\n            break\n        node = children[node][ch]\n    if not ok or k > cnt[node]:\n        out.append('-1')\n    else:\n        out.append(kth_word(node, k, prefix))\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-trie-m3",
    title: "Longest Suggestion",
    statement:
      "সাদিয়ার সার্চ ইঞ্জিনে প্রিফিক্স টাইপ করলে দরকার হয় সবচেয়ে লম্বা মিলটা — ইউজার কতদূর এগোলে একটা সম্পূর্ণ শব্দ পাওয়া যাবে, সেই সীমা।\n\n`n`টি ভিন্ন শব্দের ডিকশনারি দেওয়া থাকবে, তারপর `q`টি প্রিফিক্স। প্রতিটি প্রিফিক্সের জন্য ছাপাও — ওই প্রিফিক্স দিয়ে শুরু হওয়া শব্দগুলোর মধ্যে সবচেয়ে লম্বা শব্দের দৈর্ঘ্য কত। কোনো মিল না থাকলে `-1`।\n\nউদাহরণ: ডিকশনারি `a, ab, abc, xb` এবং প্রিফিক্স `a` হলে উত্তর `3` — `abc` সবচেয়ে লম্বা মিল।",
    inputFormat:
      "প্রথম লাইনে `n` ও `q`। পরের `n` লাইনে এক একটি ভিন্ন শব্দ। তারপর `q` লাইনে এক একটি প্রিফিক্স।",
    outputFormat: "`q` লাইনে উত্তর — সবচেয়ে লম্বা মিল শব্দের দৈর্ঘ্য, না থাকলে `-1`।",
    constraints:
      "`1 <= n <= 25000`\n`1 <= q <= 50000`\nশব্দ ও প্রিফিক্সের দৈর্ঘ্য `1 <= L <= 20`\nমোট অক্ষর সংখ্যা `<= 300000`\nশুধুমাত্র ছোট ইংরেজি হরফ (`a-z`)",
    editorial:
      "## ধারণা\n\nসরাসরি ভাবলে প্রিফিক্সের নোডে পৌঁছে পুরো সাব-ট্রি ঘুরে সবচেয়ে গভীর শব্দ-শেষ নোড খুঁজতে হয় — কিন্তু একই প্রিফিক্সে হাজারবার প্রশ্ন এলে সেটা বারবার ঘোরা মানেই ধীরগতি। বিদ্যা হলো নোডে ক্যাশ করা রাখা: প্রতিটি নোডে `best` = ওই নোডের নিচে (নিজে সহ) সবচেয়ে লম্বা শব্দের দৈর্ঘ্য। বিল্ডের শেষে নোডগুলো উল্টো ক্রমে (সন্তান আগে, বাবা পরে) ঘুরে প্রতিটি নোডের `best` সন্তানদের `best` থেকে বসাও — তখন প্রশ্নে শুধু প্রিফিক্সের নোডে নেমে `best` পড়লেই উত্তর, `O(L)`।\n\n## ধাপে ধাপে\n\n1. ট্রাই বানাও; প্রতিটি নোডে গভীরতা (`depth`) রাখো, শব্দ-শেষ নোডে চিহ্ন দাও।\n2. নোড উল্টো ক্রমে ঘুরো (ট্রাইতে সন্তান সবসময় বাবার পরে তৈরি হয়, তাই উল্টো ক্রম নিচ-থেকে-উপরে)।\n3. প্রতিটি নোডে `best` = নিজে শব্দ-শেষ হলে `depth`, নাহলে 0; তারপর প্রতিটি সন্তানের `best` থেকে সর্বোচ্চটা নাও।\n4. প্রশ্নে প্রিফিক্স ধরে নোডে নামো; না মিললে `-1`, মিললে `best` ছাপাও।\n\n```python\nimport sys\n\ndata = sys.stdin.read().split()\nn = int(data[0]); q = int(data[1])\nwords = data[2:2 + n]\nqueries = data[2 + n:2 + n + q]\nchildren = [{}]\nends = [False]\ndepth = [0]\nfor word in words:\n    node = 0\n    for ch in word:\n        if ch not in children[node]:\n            children[node][ch] = len(children)\n            children.append({})\n            ends.append(False)\n            depth.append(depth[node] + 1)\n        node = children[node][ch]\n    ends[node] = True\nbest = [0] * len(children)\nfor node in range(len(children) - 1, -1, -1):\n    if ends[node]:\n        best[node] = depth[node]\n    for child in children[node].values():\n        if best[child] > best[node]:\n            best[node] = best[child]\nout = []\nfor prefix in queries:\n    node, ok = 0, True\n    for ch in prefix:\n        if ch not in children[node]:\n            ok = False\n            break\n        node = children[node][ch]\n    out.append(str(best[node]) if ok else '-1')\nsys.stdout.write('\\n'.join(out) + '\\n')\n```\n\n## কমপ্লেক্সিটি\n\nনির্মাণ `O(মোট অক্ষর)`, `best` হিসাব `O(মোট নোড)` — নোড সংখ্যা মোট অক্ষরের মধ্যেই। প্রতি প্রশ্ন `O(প্রিফিক্সের দৈর্ঘ্য)`। সাব-ট্রি ঘোরা কৌশল হলে প্রতি প্রশ্নে `O(সাব-ট্রির আকার)` লাগত, একই প্রিফিক্স বারবার এলে সেটা অসহনীয়।\n\n## সাধারণ ভুল\n\n- `best` হিসাবে নিচ থেকে উপরে না গিয়ে উপর থেকে নিচে চালানো — তখন সন্তানের `best` এখনো বসেনি, বাবা ভুল মান ধরে।\n- শব্দ-শেষ নোড ছাড়া গভীরতম নোড ধরা — শব্দ না শেষ হলে ওই গভীরতা কোনো শব্দের দৈর্ঘ্য নয়।\n- প্রিফিক্স নিজে শব্দ হলে শুধু নিচের দিকে দেখা — প্রিফিক্সের নিজের দৈর্ঘ্যও প্রতিযোগী, `best` সেটা ধরেই রাখে।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Trie", "Strings", "Prefix"],
    tests: [
      { input: "4 6\na\nab\nabc\nxb\na\nab\nxb\nx\nax\nabc\n", expectedOutput: "3\n3\n2\n2\n-1\n3\n", isSample: true },
      { input: "1 3\nhi\nhi\nh\nhix\n", expectedOutput: "2\n2\n-1\n", isSample: true },
      { input: "3 5\nband\nbanana\nbandit\nban\nband\nbandit\nb\nbx\n", expectedOutput: "6\n6\n6\n6\n-1\n", isSample: false },
      { input: "1 3\nz\nz\nzz\ny\n", expectedOutput: "1\n-1\n-1\n", isSample: false },
      { input: "3 3\nab\nabandoned\nable\nab\naban\naband\n", expectedOutput: "9\n9\n9\n", isSample: false },
      { ...trieM3Large(), isSample: false },
    ],
    referencePython:
      "import sys\n\ndata = sys.stdin.read().split()\nn = int(data[0]); q = int(data[1])\nwords = data[2:2 + n]\nqueries = data[2 + n:2 + n + q]\nchildren = [{}]\nends = [False]\ndepth = [0]\nfor word in words:\n    node = 0\n    for ch in word:\n        if ch not in children[node]:\n            children[node][ch] = len(children)\n            children.append({})\n            ends.append(False)\n            depth.append(depth[node] + 1)\n        node = children[node][ch]\n    ends[node] = True\nbest = [0] * len(children)\nfor node in range(len(children) - 1, -1, -1):\n    if ends[node]:\n        best[node] = depth[node]\n    for child in children[node].values():\n        if best[child] > best[node]:\n            best[node] = best[child]\nout = []\nfor prefix in queries:\n    node, ok = 0, True\n    for ch in prefix:\n        if ch not in children[node]:\n            ok = False\n            break\n        node = children[node][ch]\n    out.append(str(best[node]) if ok else '-1')\nsys.stdout.write('\\n'.join(out) + '\\n')\n",
  },
  {
    slug: "learn-m6-trie-h2",
    title: "Maximum XOR Subarray",
    statement:
      "রফির সেন্সর নেটওয়ার্ক থেকে প্রতিদিনের রিডিং একটার পর একটা জমা হয়। বিশ্লেষণের জন্য রিডিংয়ের একটা **পরপর অংশ** (subarray) নিতে হবে — শুরু আর শেষ ইনডেক্সের মধ্যে পড়া সবগুলো ঘর, অন্তত একটা ঘর।\n\nযেকোনো একটা খালি-নয় subarray-এর সব সংখ্যার bitwise XOR সর্বাধিক কত হতে পারে, সেটি নির্ণয় করো।\n\nউদাহরণ: `1 2 3` — subarray `1 2`-এর XOR `3`, আবার শেষের ঘরটা একা হলেও `3`; সর্বাধিক `3`।",
    inputFormat: "প্রথম লাইনে `n`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।",
    outputFormat: "সর্বাধিক XOR মান এক লাইনে প্রিন্ট করো।",
    constraints:
      "`1 <= n <= 100000`\n`0 <= a_i < 2^30`\nপ্রতিটি সংখ্যা একাধিকবার থাকতে পারে",
    editorial:
      "## ধারণা\n\nsubarray-এর XOR-কে জোড়ার XOR-এ নামিয়ে আনা যায়। prefix XOR বানাও: `P[0] = 0`, `P[i] = a[1] XOR ... XOR a[i]`। তাহলে subarray `(j+1 ... i)`-এর XOR হয় `P[j] XOR P[i]` — কারণ ব্যবধানের মাঝের অংশ দুইবার এসে কাটাকাটি হয়ে যায়। তাই প্রশ্নটা দাঁড়ায়: `P`-এর দুটি ভিন্ন সূচক বেছে XOR যত বড় করা যায় — ঠিক যেটা h1-এ জোড়ার উপরে করেছিলে। পার্থক্য শুধু একটা: জোড়ার সূচকগুলো এখন `P`-এর, আর ক্রমটা রক্ষা করতে হয় — `j < i` ধরে `P[i]`-এর উত্তর বের করার সময় `P[0 ... i-1]`-রা গাছে ঢুকে থাকবে। এজন্য `P[0]` আগে ঢোকাও, তারপর প্রতিটি `P[i]`-এর উত্তর আগে বের করো, পরে ঢোকাও।\n\n## ধাপে ধাপে\n\n1. `P[0] = 0` বাইনারি ট্রাইতে ঢোকাও।\n2. রিডিং পড়ার সময় `prefix ^= a[i]` ধরে চলমান prefix XOR রাখো — পুরো `P` অ্যারে আলাদা রাখার দরকার নেই।\n3. প্রতিটি `prefix`-এর জন্য গাছ ধরে সর্বাধিক XOR বের করো (বড় বিট থেকে উল্টো বিটের দিকে যাও)।\n4. ফল জমা রেখে সেই `prefix` ঢোকাও; শেষে সর্বাধিকটা ছাপাও।\n\n```python\nimport sys\n\ndef main():\n    data = sys.stdin.buffer.read().split()\n    n = int(data[0])\n    values = list(map(int, data[1:1 + n]))\n    children = [[-1, -1]]\n\n    def insert(x):\n        node = 0\n        for bit in range(29, -1, -1):\n            b = (x >> bit) & 1\n            nxt = children[node][b]\n            if nxt == -1:\n                children.append([-1, -1])\n                nxt = len(children) - 1\n                children[node][b] = nxt\n            node = nxt\n\n    def best(x):\n        node, value = 0, 0\n        for bit in range(29, -1, -1):\n            b = (x >> bit) & 1\n            want = b ^ 1\n            if children[node][want] != -1:\n                value |= (1 << bit)\n                node = children[node][want]\n            else:\n                node = children[node][b]\n        return value\n\n    insert(0)\n    prefix = 0\n    answer = 0\n    for value in values:\n        prefix ^= value\n        answer = max(answer, best(prefix))\n        insert(prefix)\n    print(answer)\n\nmain()\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n * B)`, `B = 30` বিট; স্পেস `O(n * B)`। সরাসরি সব subarray ঘুরলে `O(n^2)` — `n = 100000`-এ অসম্ভব।\n\n## সাধারণ ভুল\n\n- `P[0] = 0` ঢোকাতে ভুলে যাওয়া — তখন শুরুতে থাকা subarrayগুলো (যেমন `P[1]` একা, মানে প্রথম ঘরটা) হিসাবেই আসে না।\n- সব `P` আগে ঢুকিয়ে পরে হিসাব করা — তখন `P[i]` নিজের সাথে জোড়া বসিয়ে খালি subarray-এর মতো `0` বা ভুল মান আনতে পারে; ক্রমটা মানাই উত্তর শুধু খালি-নয় subarray থেকে আসে।\n- প্রতিটি ঘরের মান XOR করার বদলে যোগ করা — prefix XOR ধর্ম `P[j] XOR P[i]`-এ কাজ করে, যোগফলে নয়।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 4000,
    memoryLimitMb: 256,
    tags: ["Trie", "Bit Manipulation", "Binary Trie", "Prefix XOR"],
    tests: [
      { input: "3\n1 2 3\n", expectedOutput: "3\n", isSample: true },
      { input: "2\n5 5\n", expectedOutput: "5\n", isSample: true },
      { input: "1\n1\n", expectedOutput: "1\n", isSample: false },
      { input: "3\n0 0 0\n", expectedOutput: "0\n", isSample: false },
      { input: "4\n1073741823 0 1073741822 1\n", expectedOutput: "1073741823\n", isSample: false },
      { input: "5\n8 1 2 12 7\n", expectedOutput: "15\n", isSample: false },
      { ...trieH2Brute(2000), isSample: false },
      { ...trieH2Large(), isSample: false },
    ],
    referencePython:
      "import sys\n\ndef main():\n    data = sys.stdin.buffer.read().split()\n    n = int(data[0])\n    values = list(map(int, data[1:1 + n]))\n    children = [[-1, -1]]\n\n    def insert(x):\n        node = 0\n        for bit in range(29, -1, -1):\n            b = (x >> bit) & 1\n            nxt = children[node][b]\n            if nxt == -1:\n                children.append([-1, -1])\n                nxt = len(children) - 1\n                children[node][b] = nxt\n            node = nxt\n\n    def best(x):\n        node, value = 0, 0\n        for bit in range(29, -1, -1):\n            b = (x >> bit) & 1\n            want = b ^ 1\n            if children[node][want] != -1:\n                value |= (1 << bit)\n                node = children[node][want]\n            else:\n                node = children[node][b]\n        return value\n\n    insert(0)\n    prefix = 0\n    answer = 0\n    for value in values:\n        prefix ^= value\n        answer = max(answer, best(prefix))\n        insert(prefix)\n    print(answer)\n\nmain()\n",
  },
];
