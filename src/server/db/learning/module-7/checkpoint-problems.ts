import type { SeedProblem } from "../../seed-problems";
import { newlineOutput } from "../generated-tests";

const NIM_TOURNAMENT_LINES = `100 ${Array.from(
  { length: 100 },
  (_, i) => i,
).join(" ")}`;

const NIM_TOURNAMENT_INPUT = `1000\n${Array.from(
  { length: 1000 },
  () => NIM_TOURNAMENT_LINES,
).join("\n")}\n`;

const STALL_MAX_LINES = Array.from(
  { length: 400 },
  (_, i) =>
    Array.from({ length: 10 }, (_, j) => `${i + 1} ${(i + j) % 400 + 1}`).join(
      "\n",
    ),
).join("\n");

export const MODULE7_CHECKPOINT_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m7-checkpoint-1",
    title: "Keyword Hits in Answer Scripts",
    statement:
      "পরীক্ষার উত্তরপত্র যাচাইয়ের সময় নুসরাত দেখছিলেন কোন নিষিদ্ধ শব্দটা কয়বার এসেছে। প্রতিটি উত্তরপত্র মানে একটা দীর্ঘ টেক্সট, আর খোঁজার জন্য একটা প্যাটার্ন শব্দ দেওয়া থাকবে।\n\nপ্যাটার্নটি টেক্সটের ভেতরে কয়বার এসেছে সেটা গুনো — মিলগুলো একে অপরের উপর পড়তে পারে এবং প্রতিটিই গণনা করতে হবে।\n\nউদাহরণ: `aaaa`-এ `aa` তিনবার পাওয়া যায় → `3`।",
    inputFormat:
      "প্রথম লাইনে টেক্সট `T`, দ্বিতীয় লাইনে প্যাটার্ন `P`। দুটোই শুধু ছোট হাতের ইংরেজি অক্ষর।",
    outputFormat: "মিলগুলোর সংখ্যা এক লাইনে প্রিন্ট করো।",
    constraints:
      "`1 <= |P| <= |T| <= 200000`\nশুধু ছোট হাতের ইংরেজি অক্ষর।",
    editorial:
      "## ধারণা\n\nদুই লুপে প্রতিটি শুরু থেকে মেলালে সময় `O(|T| * |P|)` — `200000 * 200000` তুলনা হিসেব করা যায় না। KMP-এ প্যাটার্নের prefix function আগে থেকে বানিয়ে টেক্সট একবার ঘোরলেই হয়; মিল ভাঙলে `j` সরাসরি শূন্য না করে `pi[j - 1]`-এ নিয়ে গেলে আগের কাজ কাজে লাগে। মিল পাওয়ার পর `j = pi[j - 1]` করলে টানা মিলও ধরা পড়ে।\n\n## ধাপে ধাপে\n\n1. `|P| > |T|` হলে সঙ্গে সঙ্গে `0` প্রিন্ট করো।\n2. `P`-এর prefix function নাও (`O(|P|)`)।\n3. `T`-এর প্রতিটি অক্ষর দিয়ে `j` এগিয়ে নাও; `j == |P|` হলে কাউন্টার বাড়িয়ে `j = pi[j - 1]` করো।\n4. কাউন্টার প্রিন্ট করো।\n\n```python\nimport sys\nlines = sys.stdin.read().splitlines()\nT, P = lines[0], lines[1]\nn, m = len(T), len(P)\nif m > n:\n    print(0)\nelse:\n    pi = [0] * m\n    for i in range(1, m):\n        j = pi[i - 1]\n        while j > 0 and P[i] != P[j]:\n            j = pi[j - 1]\n        if P[i] == P[j]:\n            j += 1\n        pi[i] = j\n    j = 0\n    count = 0\n    for ch in T:\n        while j > 0 and ch != P[j]:\n            j = pi[j - 1]\n        if ch == P[j]:\n            j += 1\n        if j == m:\n            count += 1\n            j = pi[j - 1]\n    print(count)\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(|T| + |P|)`, স্পেস `O(|P|)`।\n\n## সাধারণ ভুল\n\n- ওভারল্যাপ মিল বাদ দেওয়া: `aaaa`-এ `aa` তখন `2` আসবে, কিন্তু সঠিক `3`।\n- `j` মিলের পর `0` করে দেওয়া — সময় বেড়ে যায় এবং কখনো কখনো কাউন্ট ভুল হয়।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Strings", "String Matching", "KMP"],
    tests: [
      { input: "aaaa\naa\n", expectedOutput: "3\n", isSample: true },
      { input: "abcde\nzz\n", expectedOutput: "0\n", isSample: true },
      { input: "ababa\naba\n", expectedOutput: "2\n", isSample: false },
      { input: "a\na\n", expectedOutput: "1\n", isSample: false },
      { input: "xyzxyzxyz\nxyz\n", expectedOutput: "3\n", isSample: false },
      {
        input: `${"a".repeat(200000)}\n${"a".repeat(99999)}\n`,
        expectedOutput: "100002\n",
        isSample: false,
      },
      {
        input: `${"ab".repeat(100000)}\nab\n`,
        expectedOutput: "100000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nlines = sys.stdin.read().splitlines()\nT, P = lines[0], lines[1]\nn, m = len(T), len(P)\nif m > n:\n    print(0)\nelse:\n    pi = [0] * m\n    for i in range(1, m):\n        j = pi[i - 1]\n        while j > 0 and P[i] != P[j]:\n            j = pi[j - 1]\n        if P[i] == P[j]:\n            j += 1\n        pi[i] = j\n    j = 0\n    count = 0\n    for ch in T:\n        while j > 0 and ch != P[j]:\n            j = pi[j - 1]\n        if ch == P[j]:\n            j += 1\n        if j == m:\n            count += 1\n            j = pi[j - 1]\n    print(count)\n",
  },
  {
    slug: "learn-m7-checkpoint-2",
    title: "Volunteer Stall Matching",
    statement:
      "ফেস্টিভালের স্টলগুলোতে ভলান্টিয়ার বসাতে হবে। কোন ভলান্টিয়ার কোন স্টলে কাজ করতে পারবেন সেই তালিকা দেওয়া থাকবে। একটা স্টলে একজনের বেশি বসবে না, আর একজন একটার বেশি স্টলে যেতে পারবেন না।\n\nসবচেয়ে বেশি কয়জন ভলান্টিয়ারকে স্টল দেওয়া যায় সেটা প্রিন্ট করো।\n\nউদাহরণ: দুইজন ভলান্টিয়ার, দুইটা স্টল; তালিকা `1-1`, `1-2` হলে উত্তর `1` — দ্বিতীয়জনের কোনো পছন্দ নেই।",
    inputFormat:
      "প্রথম লাইনে `n`, `m` ও `k` — ভলান্টিয়ার সংখ্যা, স্টল সংখ্যা, বৈধ জোড়ার সংখ্যা। পরের `k` লাইনে প্রতিটিতে `a b`।",
    outputFormat: "সর্বোচ্চ ম্যাচিংয়ের আকার এক লাইনে প্রিন্ট করো।",
    constraints:
      "`1 <= n <= 400`\n`1 <= m <= 400`\n`0 <= k <= 20000`\nএকই জোড়া একাধিকবার আসতে পারে।",
    editorial:
      "## ধারণা\n\nএটা bipartite matching। Kuhn's algorithm প্রতিটি ভলান্টিয়ারের জন্য augmenting path খোঁজে: পছন্দের স্টল খালি হলে সরাসরি জোড়া, ব্যস্ত হলে সেই স্টলের বর্তমান ভলান্টিয়ারকে অন্য স্টলে সরিয়ে দেওয়া সম্ভব কিনা দেখা হয়। গ্রিডি ভাবে প্রথম পাওয়া স্টলই দিলে উত্তর ছোট এসে যেতে পারে — augmenting path-ই সঠিক উপায়।\n\n## ধাপে ধাপে\n\n1. প্রতিটি ভলান্টিয়ারের পছন্দের স্টলের তালিকা বানাও।\n2. `matchR[v]` = স্টল `v`-তে বর্তমান ভলান্টিয়ার (০ = খালি)।\n3. প্রতিটি ভলান্টিয়ারের জন্য নতুন `seen` দিয়ে DFS; সফল হলে কাউন্টার বাড়াও।\n4. কাউন্টার প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn, m, k = data[0], data[1], data[2]\nedges = [[] for _ in range(n + 1)]\nidx = 3\nfor _ in range(k):\n    edges[data[idx]].append(data[idx + 1])\n    idx += 2\nmatch_r = [0] * (m + 1)\ndef dfs(u, seen):\n    for v in edges[u]:\n        if seen[v]:\n            continue\n        seen[v] = True\n        if match_r[v] == 0 or dfs(match_r[v], seen):\n            match_r[v] = u\n            return True\n    return False\nresult = 0\nfor u in range(1, n + 1):\n    if dfs(u, [False] * (m + 1)):\n        result += 1\nprint(result)\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n * k)`, স্পেস `O(n + m + k)`; সর্বোচ্চ `400 * 20000 = 8 * 10^6` ধাপ।\n\n## সাধারণ ভুল\n\n- গ্রিডি ম্যাচিং: `1 1`, `1 2`, `2 1`-এ ভলান্টিয়ার `1`-কে স্টল `1` দিলে উত্তর `1`, অথচ সঠিক `2`।\n- DFS-এ `seen` শেয়ার করা — পরের প্রচেষ্টায় ঠিক করা স্টলগুলো ঘুরতেই পারে না।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Bipartite Matching"],
    tests: [
      {
        input: "3 3 4\n1 1\n1 2\n2 2\n3 3\n",
        expectedOutput: "3\n",
        isSample: true,
      },
      { input: "2 2 1\n1 1\n", expectedOutput: "1\n", isSample: true },
      { input: "4 4 0\n", expectedOutput: "0\n", isSample: false },
      {
        input: "2 2 3\n1 1\n1 2\n2 1\n",
        expectedOutput: "2\n",
        isSample: false,
      },
      {
        input: "3 2 3\n1 1\n2 1\n3 2\n",
        expectedOutput: "2\n",
        isSample: false,
      },
      {
        input: "5 5 5\n1 1\n2 2\n3 3\n4 4\n5 5\n",
        expectedOutput: "5\n",
        isSample: false,
      },
      {
        input: `400 400 4000\n${STALL_MAX_LINES}\n`,
        expectedOutput: "400\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, m, k = data[0], data[1], data[2]\nedges = [[] for _ in range(n + 1)]\nidx = 3\nfor _ in range(k):\n    edges[data[idx]].append(data[idx + 1])\n    idx += 2\nmatch_r = [0] * (m + 1)\ndef dfs(u, seen):\n    for v in edges[u]:\n        if seen[v]:\n            continue\n        seen[v] = True\n        if match_r[v] == 0 or dfs(match_r[v], seen):\n            match_r[v] = u\n            return True\n    return False\nresult = 0\nfor u in range(1, n + 1):\n    if dfs(u, [False] * (m + 1)):\n        result += 1\nprint(result)\n",
  },
  {
    slug: "learn-m7-checkpoint-3",
    title: "Nim Tournament",
    statement:
      "ক্যাম্পাস নিম টুর্নামেন্টে একসাথে অনেকগুলো খেলা চলছিল। প্রতিটি খেলায় কয়েকটা পাইল পাথর আছে, পালাক্রমে খেলোয়াড়রা একটা পাইল থেকে যেকোনো সংখ্যা পাথর তুলে নেবে, যে শেষ পাথরটা নেবে সে জিতবে। প্রথম খেলোয়াড় সবসময় একই।\n\nপ্রতিটি খেলার জন্য বিজয়ীর নাম আলাদা লাইনে প্রিন্ট করো।\n\nউদাহরণ: পাইল `7` → `Alice`, পাইল `1 2 3` → `Bob`, পাইল `5 5` → `Bob`।",
    inputFormat:
      "প্রথম লাইনে খেলার সংখ্যা `t`। পরের `t` লাইনে প্রতিটিতে: প্রথমে `n`, তারপর `n`টি পূর্ণসংখ্যা — সেই খেলার পাইলগুলো।",
    outputFormat: "`t` লাইন, প্রতিটিতে `Alice` বা `Bob`।",
    constraints:
      "`1 <= t <= 1000`\n`1 <= n <= 100`\n`0 <= a_i <= 10^6`\nসব খেলার মোট পাইল `100000` পর্যন্ত।",
    editorial:
      "## ধারণা\n\nপ্রতিটি খেলা আলাদা Nim — খেলাগুলো একে অপরের উপর নির্ভর করে না। প্রতিটি খেলার সব পাইলের XOR করলেই হয়: শূন্য না হলে প্রথম খেলোয়াড় জেতে, শূন্য হলে দ্বিতীয় খেলোয়াড় জেতে। একটা খেলায় উপায় খুঁজে বের করা লাগে না — শুধু ফল দরকার, তাই প্রতি খেলা `O(n)`।\n\n## ধাপে ধাপে\n\n1. খেলার সংখ্যা `t` পড়ো।\n2. প্রতিটি লাইন ভেঙে `n` আর পাইলগুলো নাও।\n3. পাইলগুলোর XOR `x` বের করো।\n4. `x != 0` হলে `Alice`, নাহলে `Bob`; ফল তালিকায় রাখো।\n5. সব ফল এক এক লাইনে প্রিন্ট করো।\n\n```python\nimport sys\nlines = sys.stdin.read().splitlines()\nt = int(lines[0])\nout = []\nfor i in range(1, t + 1):\n    values = list(map(int, lines[i].split()))\n    x = 0\n    for v in values[1:]:\n        x ^= v\n    out.append('Alice' if x != 0 else 'Bob')\nprint('\\n'.join(out))\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(মোট পাইল)`, স্পেস `O(t)` উত্তর ধরে। `t = 1000`, মোট পাইল `100000` — তাৎক্ষণিক।\n\n## সাধারণ ভুল\n\n- পুরো ইনপুটের সব সংখ্যা একসাথে XOR করা — খেলাগুলো আলাদা; প্রতি লাইনের আলাদা ফল লাগবে।\n- পাইলের সংখ্যা `n` বাদ দেওয়া ভুল — লাইনের প্রথম সংখ্যাটা `n`, XOR করার আগে সরিয়ে নিতে হবে (নাহলে `n`-ও যোগ হয়ে যায়)।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Game Theory", "Nim", "XOR"],
    tests: [
      {
        input: "3\n1 7\n3 1 2 3\n2 5 5\n",
        expectedOutput: "Alice\nBob\nBob\n",
        isSample: true,
      },
      {
        input: "2\n2 4 4\n1 3\n",
        expectedOutput: "Bob\nAlice\n",
        isSample: true,
      },
      {
        input: "4\n1 0\n1 1\n2 0 0\n2 1 0\n",
        expectedOutput: "Bob\nAlice\nBob\nAlice\n",
        isSample: false,
      },
      {
        input: "1\n5 1 4 5 6 7\n",
        expectedOutput: "Alice\n",
        isSample: false,
      },
      {
        input: "1\n4 3 3 3 3\n",
        expectedOutput: "Bob\n",
        isSample: false,
      },
      {
        input: "6\n1 1000000\n1 0\n4 1 1 1 1\n2 8 8\n3 1 2 4\n2 3 5\n",
        expectedOutput: "Alice\nBob\nBob\nBob\nAlice\nAlice\n",
        isSample: false,
      },
      {
        input: NIM_TOURNAMENT_INPUT,
        expectedOutput: newlineOutput(Array(1000).fill("Bob")),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nlines = sys.stdin.read().splitlines()\nt = int(lines[0])\nout = []\nfor i in range(1, t + 1):\n    values = list(map(int, lines[i].split()))\n    x = 0\n    for v in values[1:]:\n        x ^= v\n    out.append('Alice' if x != 0 else 'Bob')\nprint('\\n'.join(out))\n",
  },
];
