import type { SeedProblem } from "../../seed-problems";
import { spaceOutput } from "../generated-tests";

const GRUNDY_PATTERN = [0, 1, 0, 1, 2, 3, 2];

const MISERE_MAX_INPUT = `100\n${Array.from(
  { length: 100 },
  (_, i) => i + 1,
).join(" ")}\n`;

const H1_MAX_PILES = [
  ...Array.from({ length: 50 }, () => "100000"),
  ...Array.from({ length: 49 }, () => "99999"),
].join(" ");

const X2_MAX_INPUT = `100000\n${Array.from(
  { length: 100000 },
  (_, i) => i + 1,
).join(" ")}\n`;

export const GAME_THEORY_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m7-game-theory-g1",
    title: "Nim Game",
    statement:
      "কমন রুমে রাফি আর তানভীর Nim খেলছেন। সামনে কয়েকটা পাইল পাথর, পালাক্রমে প্রত্যেকে একটা পাইল থেকে যেকোনো সংখ্যা পাথর (অন্তত একটা) তুলে নেয়। যে শেষ পাথরটা নেবে সেই জিতবে। দুজনেই চমৎকার খেলবে, আর রাফি প্রথমে শুরু করবে।\n\nকে জিতবে বলুন — রাফি হলে `Alice`, তানভীর হলে `Bob`।\n\nউদাহরণ: পাইল `1 2 3` হলে উত্তর `Bob`।",
    inputFormat:
      "প্রথম লাইনে পাইলের সংখ্যা `n`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা — প্রতিটি পাইলের পাথর সংখ্যা।",
    outputFormat: "বিজয়ীর নাম `Alice` বা `Bob` এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= n <= 100`\n`0 <= a_i <= 1000` (শূন্য মানে পাইল ইতিমধ্যেই খালি)",
    editorial:
      "### ধারণা\n\nNim-এর মূল উপপাদ্য: সব পাইলের সাংখ্যিক XOR শূন্য না হলে প্রথম খেলোয়াড় জেতে, শূন্য হলে দ্বিতীয় খেলোয়াড় জেতে। কারণ যেকোনো অবস্থায় XOR `0` না হলে এমন একটা পাইল থেকে কিছু পাথর কেড়ে XOR `0` করা যায়, আর প্রতিপক্ষ যখন `0` রেখে দেয়, তখন সে আবার অশূন্যই রাখতে বাধ্য — শেষ পর্যন্ত আমরাই শেষ পাথরটা নেব। খালি পাইল (`0`) XOR-এ কিছু বদলায় না।\n\n### ধাপে ধাপে\n\n1. `n` আর সব পাইলের মান পড়ে নিন।\n2. `x = 0` দিয়ে শুরু করে প্রতিটি মানের সাথে XOR করুন।\n3. `x != 0` হলে `Alice`, শূন্য হলে `Bob` প্রিন্ট করুন।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\npiles = data[1:]\nx = 0\nfor v in piles:\n    x ^= v\nprint('Alice' if x != 0 else 'Bob')\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(1)` ইনপুট ছাড়া।\n\n### সাধারণ ভুল\n\n- সব পাইল যোগ করা: `[5, 5]`-এ যোগ `10` কিন্তু XOR `0` — সঠিক উত্তর `Bob`, যোগ দিয়ে ভাবলে `Alice` ভুল আসবে।\n- শূন্য পাইল বাদ দিয়ে ফেলা বা শুধু `n=1` হিসেবে ধরে নেওয়া — অ্যালগরিদম একই, শুধু XOR চালাতে হবে।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Game Theory", "Nim", "XOR"],
    tests: [
      { input: "3\n1 2 3\n", expectedOutput: "Bob\n", isSample: true },
      { input: "1\n7\n", expectedOutput: "Alice\n", isSample: true },
      { input: "2\n5 5\n", expectedOutput: "Bob\n", isSample: false },
      { input: "2\n1 2\n", expectedOutput: "Alice\n", isSample: false },
      { input: "5\n0 0 0 0 0\n", expectedOutput: "Bob\n", isSample: false },
      { input: "3\n1 4 5\n", expectedOutput: "Bob\n", isSample: false },
      {
        input: `100\n${Array.from({ length: 100 }, (_, i) => i).join(" ")}\n`,
        expectedOutput: "Bob\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\npiles = data[1:]\nx = 0\nfor v in piles:\n    x ^= v\nprint('Alice' if x != 0 else 'Bob')\n",
  },
  {
    slug: "learn-m7-game-theory-g2",
    title: "Grundy Numbers",
    statement:
      "নুসরাত একটা ছোট খেলা নিয়ে টেবিল করছেন: সামনে একটা পাইল পাথর, এক চালে খেলোয়াড় `1`, `3` বা `4` সংখ্যক পাথর তুলে নিতে পারবে। খেলার প্রতিটি অবস্থার Grundy number বের করতে হবে।\n\nGrundy number হলো এরকম: `g(0) = 0`, আর `x > 0`-এর জন্য `g(x)` হলো সেই সবচেয়ে ছোট অ-ঋণাত্মক ইন্টিজার যেটা `x` থেকে যাওয়া যায় এমন অবস্থাগুলোর Grundy-তে নেই (একে mex বলে)।\n\n`g(0)` থেকে `g(n)` পর্যন্ত সব মান স্পেস দিয়ে এক লাইনে প্রিন্ট করুন।",
    inputFormat: "একটা পূর্ণসংখ্যা `n`।",
    outputFormat:
      "`g(0)`, `g(1)`, ..., `g(n)` স্পেস দিয়ে এক লাইনে প্রিন্ট করুন।",
    constraints: "`0 <= n <= 1000`",
    editorial:
      "### ধারণা\n\nMex (minimum excluded value) হলো সেটে না থাকা সবচেয়ে ছোট অ-ঋণাত্মক সংখ্যা। `x` থেকে যেসব অবস্থায় যাওয়া যায় সেগুলোর Grundy-গুলো একটা সেট বানান, তারপর সেট থেকে শূন্য থেকে শুরু করে যেটা পাওয়া যায় না সেটাই `g(x)`. `x = 0`-এ কোনো চাল নেই, তাই সেট খালি এবং mex `0`। এখানে চাল `1`, `3`, `4` — তাই `g(x)` বের করতে `g(x-1)`, `g(x-3)`, `g(x-4)` দেখতে হবে (যা আগেই হিসাব হয়ে গেছে)।\n\n### ধাপে ধাপে\n\n1. `g = [0] * (n + 1)` দিয়ে শুরু করুন।\n2. `x = 1` থেকে `n`: প্রতিটি চাল `mv`-এর জন্য `x >= mv` হলে `g[x - mv]` একটা set-এ যোগ করুন।\n3. `0` থেকে শুরু করে যে সংখ্যাটা set-এ নেই সেটাই `g[x]`।\n4. সব `x`-এর পর পুরো তালিকা স্পেস দিয়ে প্রিন্ট করুন।\n\n```python\nimport sys\nn = int(sys.stdin.readline())\nmoves = (1, 3, 4)\ng = [0] * (n + 1)\nfor x in range(1, n + 1):\n    reachable = set()\n    for mv in moves:\n        if x >= mv:\n            reachable.add(g[x - mv])\n    m = 0\n    while m in reachable:\n        m += 1\n    g[x] = m\nprint(' '.join(map(str, g)))\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n * |moves|)`, স্পেস `O(n)`। এখানে `n = 1000`, `|moves| = 3` তাই তাৎক্ষণিক।\n\n### সাধারণ ভুল\n\n- mex বোঝা ভুল: `{0, 1, 3}`-এর mex `2` (সেটে **না** থাকা সবচেয়ে ছোট), `{0, 1, 2}`-এর mex `3`।\n- চালের শর্ত ভুলে যাওয়া: `x = 2`-এ `3` বা `4` পাথর নেওয়া যায় না, শুধু `g(1)` দেখলেই হয় — নাহলে ইনডেক্স নেগেটিভ হয়ে যায়।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Game Theory", "Grundy Number", "DP"],
    tests: [
      { input: "7\n", expectedOutput: "0 1 0 1 2 3 2 0\n", isSample: true },
      { input: "0\n", expectedOutput: "0\n", isSample: true },
      { input: "1\n", expectedOutput: "0 1\n", isSample: false },
      { input: "4\n", expectedOutput: "0 1 0 1 2\n", isSample: false },
      {
        input: "12\n",
        expectedOutput: "0 1 0 1 2 3 2 0 1 0 1 2 3\n",
        isSample: false,
      },
      {
        input: "1000\n",
        expectedOutput: spaceOutput(
          Array.from({ length: 1001 }, (_, i) => GRUNDY_PATTERN[i % 7]),
        ),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\nmoves = (1, 3, 4)\ng = [0] * (n + 1)\nfor x in range(1, n + 1):\n    reachable = set()\n    for mv in moves:\n        if x >= mv:\n            reachable.add(g[x - mv])\n    m = 0\n    while m in reachable:\n        m += 1\n    g[x] = m\nprint(' '.join(map(str, g)))\n",
  },
  {
    slug: "learn-m7-game-theory-e1",
    title: "One Stone at a Time",
    statement:
      "সাদিয়া আর রাফি একটা পাথরের পাইল নিয়ে খেলছেন। নিয়ম খুব সহজ — পালাক্রমে প্রত্যেকে ঠিক একটা করে পাথর তুলে নেবে, আর যে শেষ পাথরটা নেবে সেই জিতবে। সাদিয়া প্রথমে শুরু করবেন।\n\nকে জিতবে বলুন।\n\nউদাহরণ: পাথর `1` থাকলে সাদিয়াই শেষটা নেন → `Alice`; পাথর `2` হলে রাফি শেষটা নেন → `Bob`।",
    inputFormat: "একটা পূর্ণসংখ্যা `n` — পাথরের সংখ্যা।",
    outputFormat: "বিজয়ীর নাম `Alice` বা `Bob` এক লাইনে প্রিন্ট করুন।",
    constraints: "`1 <= n <= 10^9`",
    editorial:
      "### ধারণা\n\nএক চালে একটা করে পাথর নেওয়া হয়, তাই মোট `n` চালই খেলা হবে। চাল যদি জোড় সংখ্যায় শেষ হয়, শেষ চালটা রাফির — অর্থাৎ `n` জোড় হলে `Bob`, বিজোড় হলে `Alice`। Grundy number দিয়ে ভাবলেও একই: `g(x) = x % 2`, কারণ এক ধাপ এগোনো ছাড়া আর কিছু করা যায় না।\n\n### ধাপে ধাপে\n\n1. `n` পড়ে নিন।\n2. `n % 2` যাচাই করুন।\n3. বিজোড় হলে `Alice`, জোড় হলে `Bob` প্রিন্ট করুন।\n\n```python\nimport sys\nn = int(sys.stdin.readline())\nprint('Alice' if n % 2 == 1 else 'Bob')\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(1)`, স্পেস `O(1)`। সীমা `10^9` হলেও সমস্যা নেই — কোনো লুপ লাগে না।\n\n### সাধারণ ভুল\n\n- ছোট `n`-এর জন্য লুপ চালিয়ে খেলা সিমুলেট করা — `n = 10^9`-এ TLE; প্যাটার্ন (প্যারিটি) ধরতে হবে।\n- `n % 2 == 0` হলেও `Alice` লিখে দেওয়া — শর্ত উল্টে গেলে সব বড় কেস উল্টে যায়।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Game Theory", "Math", "Parity"],
    tests: [
      { input: "1\n", expectedOutput: "Alice\n", isSample: true },
      { input: "2\n", expectedOutput: "Bob\n", isSample: true },
      { input: "3\n", expectedOutput: "Alice\n", isSample: false },
      { input: "4\n", expectedOutput: "Bob\n", isSample: false },
      { input: "5\n", expectedOutput: "Alice\n", isSample: false },
      { input: "1000000000\n", expectedOutput: "Bob\n", isSample: false },
      { input: "1000000001\n", expectedOutput: "Alice\n", isSample: false },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\nprint('Alice' if n % 2 == 1 else 'Bob')\n",
  },
  {
    slug: "learn-m7-game-theory-m1",
    title: "Misere Nim",
    statement:
      "এবার খেলার নিয়ে একটা পাল্টা শর্ত: যে খেলোয়াড় শেষ পাথরটা নেবে সে হারবে (একে misère বলে)। বাকি সব নিয়ম আগের মতো — একাধিক পাইল, পালাক্রমে একটা পাইল থেকে যেকোনো সংখ্যা পাথর নেওয়া যায়, রাফি প্রথমে শুরু করবেন।\n\nকে জিতবে বলুন। মনে রাখবেন: শূন্য পাথর থাকলে (শুরুতেই সব পাইল খালি) কেউ চাল দিতে পারবে না — এক্ষেত্রে প্রথম খেলোয়াড় হারবে।\n\nউদাহরণ: পাইল `1 1` হলে `Alice` (রাফি একটা নেন, তানভীরকে শেষটা নিতে হয়)।",
    inputFormat:
      "প্রথম লাইনে `n`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা — পাইলগুলোর পাথর সংখ্যা।",
    outputFormat: "বিজয়ীর নাম `Alice` বা `Bob` এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= n <= 100`\n`0 <= a_i <= 1000`",
    editorial:
      "### ধারণা\n\nMisère Nim-এর নিয়ম দুই ভাগে:\n\n1. **সব পাইল `0` বা `1`** (মোট পাথরও যদি `0` হয়): তখন প্রতিটি চালে একটা করে পাইল শেষ হয়, আর শেষ পাথর নেওয়াকারী হারে। মোট `k` টা অ-খালি পাইল থাকলে চালগুলো ঠিক `k` বার হবে; `k` বিজোড় হলে প্রথম খেলোয়াড়ই শেষটা নেয় → সে হারে। তাই প্রথম খেলোয়াড় জেতে `k` জোড় হলে। `k = 0` হলে কোনো চাল নেই → প্রথম খেলোয়াড় হারে।\n2. **অন্তত একটা পাইল `2` বা তার বেশি**: তখন ফল সাধারণ Nim-এর মতোই — XOR শূন্য না হলে প্রথম খেলোয়াড় জেতে। বড় পাইল থাকলে খেলোয়াড়রা চেষ্টা করে অবস্থাটাকে সব পাইল `1`-এর নিচে নামাতে, কিন্তু যেকোনো সময় সাধারণ কৌশলই কাজ করে।\n\n### ধাপে ধাপে\n\n1. `n` আর সব পাইল পড়ে নিন।\n2. XOR `x` বের করুন।\n3. সব পাইল `<= 1` কিনা দেখুন।\n4. হ্যাঁ হলে: অ-খালি পাইল সংখ্যা `k`; `k = 0` বা `k` বিজোড় হলে `Bob`, জোড় হলে `Alice`।\n5. না হলে: `x != 0` হলে `Alice`, নাহলে `Bob`।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\npiles = data[1:]\nx = 0\nfor v in piles:\n    x ^= v\nif all(v <= 1 for v in piles):\n    k = sum(1 for v in piles if v == 1)\n    if k == 0 or k % 2 == 1:\n        winner = 'Bob'\n    else:\n        winner = 'Alice'\nelse:\n    winner = 'Alice' if x != 0 else 'Bob'\nprint(winner)\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(1)`।\n\n### সাধারণ ভুল\n\n- সব জায়গায় সাধারণ Nim নিয়ম প্রয়োগ করা: `[1, 1]`-এ XOR `0` → সাধারণ নিয়মে `Bob`, কিন্তু misère-এ সঠিক উত্তর `Alice`।\n- শূন্য পাথরের কেসটা ভুলে যাওয়া: সব পাইল খালি হলে কেউ চাল দিতে পারে না, তাই প্রথম খেলোয়াড় হারে — সূত্রে `k = 0` আলাদা করে ধরা জরুরি।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Game Theory", "Nim", "XOR"],
    tests: [
      { input: "2\n1 1\n", expectedOutput: "Alice\n", isSample: true },
      { input: "3\n1 2 3\n", expectedOutput: "Bob\n", isSample: true },
      { input: "1\n1\n", expectedOutput: "Bob\n", isSample: false },
      { input: "1\n2\n", expectedOutput: "Alice\n", isSample: false },
      { input: "3\n1 1 1\n", expectedOutput: "Bob\n", isSample: false },
      { input: "4\n0 0 1 1\n", expectedOutput: "Alice\n", isSample: false },
      { input: "3\n0 0 0\n", expectedOutput: "Bob\n", isSample: false },
      { input: MISERE_MAX_INPUT, expectedOutput: "Alice\n", isSample: false },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\npiles = data[1:]\nx = 0\nfor v in piles:\n    x ^= v\nif all(v <= 1 for v in piles):\n    k = sum(1 for v in piles if v == 1)\n    if k == 0 or k % 2 == 1:\n        winner = 'Bob'\n    else:\n        winner = 'Alice'\nelse:\n    winner = 'Alice' if x != 0 else 'Bob'\nprint(winner)\n",
  },
  {
    slug: "learn-m7-game-theory-h1",
    title: "Grundy Nim",
    statement:
      "ক্যাম্পাস চেস ক্লাবের নতুন খেলাটা একটু আলাদা: একাধিক পাইল পাথর, কিন্তু প্রতিটি চালে পাইল থেকে যে সংখ্যাগুলো পাথর তোলা যায় সেগুলো আগে থেকেই তালিকাবদ্ধ। খেলোয়াড় একটা পাইল থেকে তালিকার যেকোনো সংখ্যা (যদি পাইলে যথেষ্ট পাথর থাকে) তুলে নেবে। যে শেষ পাথরটা নেবে সে জিতবে, রাফি প্রথমে শুরু করবেন।\n\nএখানে সাধারণ XOR কাজ করবে না — প্রতিটি পাইলের জন্য Grundy number বের করে সেগুলো XOR করতে হবে।\n\nকে জিতবে বলুন।\n\nউদাহরণ: চাল `1`, `2` এবং পাইল `4 5` হলে `g(4) = 1`, `g(5) = 2`, XOR `3` → `Alice`।",
    inputFormat:
      "প্রথম লাইনে `t` ও `s` — পাইলের সংখ্যা আর চালের তালিকার দৈর্ঘ্য। দ্বিতীয় লাইনে `s`টি পূর্ণসংখ্যা — অনুমোদিত চালগুলো। তৃতীয় লাইনে `t`টি পূর্ণসংখ্যা — পাইলগুলোর পাথর সংখ্যা।",
    outputFormat: "বিজয়ীর নাম `Alice` বা `Bob` এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= t <= 100`\n`1 <= s <= 10`\n`1 <= move <= 100`\n`0 <= a_i <= 100000`",
    editorial:
      "### ধারণা\n\nযখন চালগুলো পাশাপাশি অনেক পাইলে খেলা হয়, তখন Sprague-Grundy উপপাদ্য বলে: প্রতিটি পাইলকে আলাদা খেলা ধরে তার Grundy number বের করে XOR করলেই পুরো খেলাটার ফল পাওয়া যায়। XOR শূন্য না হলে প্রথম খেলোয়াড় জেতে।\n\nএকক পাইলের Grundy: `g(0) = 0`; `g(x)` = `x` থেকে যেসব `x - move` (move তালিকায়, এবং `x >= move`) অবস্থায় যাওয়া যায়, সেগুলোর Grundy সেটের mex। সবচেয়ে বড় পাইল পর্যন্ত একবার DP চালালেই হয় — পাইলগুলো যত ইচ্ছে হোক, পুনরাবৃত্ত হয় না।\n\n### ধাপে ধাপে\n\n1. `t`, `s`, চালের তালিকা আর সব পাইল পড়ে নিন।\n2. `max_pile = max(piles)` ধরে `g = [0] * (max_pile + 1)` বানান।\n3. `x = 1` থেকে `max_pile`: প্রতিটি চালের জন্য `g[x - mv]` সেটে রেখে mex বের করে `g[x]` সংরক্ষণ করুন।\n4. সব পাইলের `g[a_i]` XOR করুন।\n5. ফল শূন্য না হলে `Alice`, শূন্য হলে `Bob`।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nt, s = data[0], data[1]\nmoves = data[2:2 + s]\npiles = data[2 + s:2 + s + t]\nmax_pile = max(piles)\ng = [0] * (max_pile + 1)\nfor x in range(1, max_pile + 1):\n    reachable = set()\n    for mv in moves:\n        if x >= mv:\n            reachable.add(g[x - mv])\n    m = 0\n    while m in reachable:\n        m += 1\n    g[x] = m\nx = 0\nfor v in piles:\n    x ^= g[v]\nprint('Alice' if x != 0 else 'Bob')\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(max_pile * s + t)`, স্পেস `O(max_pile)`। এখানে `max_pile <= 100000`, `s <= 10` তাই প্রায় `10^6` ধাপ — সহজে চলে।\n\n### সাধারণ ভুল\n\n- সরাসরি পাথর সংখ্যা XOR করে ফেলা: চাল `1`, `3`, `4`-এর ক্ষেত্রে পাইল `2`-এর Grundy `0` (যেতে পারবে শুধু `1` ধাপে, তারপর অবস্থা `1`-এ যার Grundy `1`, তাই mex `{1}` = `0`), অর্থাৎ পাইলের আকার আর Grundy এক নয়।\n- প্রতিটি পাইলের জন্য আলাদা করে DP চালানো — একবার `max_pile` পর্যন্ত চালালেই হয়, বারবার নয়।\n- `x >= mv` শর্ত না রাখা — নেগেটিভ ইনডেক্স Python-এ সাইলেন্টভাবে ভুল মান দেয়।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Game Theory", "Grundy Number", "Nim", "DP"],
    tests: [
      {
        input: "2 2\n1 2\n4 5\n",
        expectedOutput: "Alice\n",
        isSample: true,
      },
      {
        input: "2 2\n1 2\n3 3\n",
        expectedOutput: "Bob\n",
        isSample: true,
      },
      { input: "1 2\n1 2\n7\n", expectedOutput: "Alice\n", isSample: false },
      { input: "2 1\n1\n5\n", expectedOutput: "Alice\n", isSample: false },
      {
        input: "3 2\n1 2\n3 6 9\n",
        expectedOutput: "Bob\n",
        isSample: false,
      },
      {
        input: "1 3\n1 3 4\n7\n",
        expectedOutput: "Bob\n",
        isSample: false,
      },
      { input: "1 1\n2\n2\n", expectedOutput: "Alice\n", isSample: false },
      {
        input: `99 3\n1 3 4\n${H1_MAX_PILES}\n`,
        expectedOutput: "Alice\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nt, s = data[0], data[1]\nmoves = data[2:2 + s]\npiles = data[2 + s:2 + s + t]\nmax_pile = max(piles)\ng = [0] * (max_pile + 1)\nfor x in range(1, max_pile + 1):\n    reachable = set()\n    for mv in moves:\n        if x >= mv:\n            reachable.add(g[x - mv])\n    m = 0\n    while m in reachable:\n        m += 1\n    g[x] = m\nx = 0\nfor v in piles:\n    x ^= g[v]\nprint('Alice' if x != 0 else 'Bob')\n",
  },
  {
    slug: "learn-m7-game-theory-x1",
    title: "Count the Losing Positions",
    statement:
      "তানভীর ছোট খেলাটার জন্য কোন কোন পাথর সংখ্যা দিয়ে প্রথম খেলোয়াড় হারে সেটার তালিকা বানাতে চান। চাল হিসেবে তিনি দিলেন একটা তালিকা — প্রতিচালে পাইল থেকে যে সংখ্যাগুলো পাথর তোলা যায়।\n\n`0` থেকে `n` পর্যন্ত কয়টা সংখ্যার জন্য প্রথম খেলোয়াড় হারবে (অর্থাৎ Grundy number শূন্য), সেটা গুনে প্রিন্ট করুন।\n\nউদাহরণ: চাল `1`, `2` এবং `n = 5` হলে হারার অবস্থা `0` ও `3` → উত্তর `2`।",
    inputFormat:
      "প্রথম লাইনে `n` ও `s`। দ্বিতীয় লাইনে `s`টি পূর্ণসংখ্যা — অনুমোদিত চালগুলো।",
    outputFormat:
      "`0` থেকে `n` পর্যন্ত যেসব সংখ্যায় প্রথম খেলোয়াড় হারে, তাদের সংখ্যা এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`0 <= n <= 100000`\n`1 <= s <= 10`\n`1 <= move <= 100`",
    editorial:
      "### ধারণা\n\nহারার অবস্থা মানে Grundy number শূন্য হওয়া অবস্থা। আগের সমস্যার মতোই `0` থেকে `n` পর্যন্ত DP চালিয়ে সব `g(x)` বানান, তারপর শুধু কয়টা `0` সেটা গুনে দিন। পাল্টা ভাবে গুনতে গেলেও হয়, কিন্তু DP ছাড়া প্যাটার্ন ধরা যায় না — বিশেষ করে যখন চালের তালিকা যেকোনো হতে পারে।\n\n### ধাপে ধাপে\n\n1. `n`, `s` আর চালের তালিকা পড়ে নিন।\n2. `g = [0] * (n + 1)` এবং `losing = 1` (কারণ `g(0) = 0` সবসময় হারার অবস্থা); `x = 1` থেকে `n`: প্রতিটি চালের জন্য যোগ্য অবস্থার Grundy সেটে রেখে mex বের করুন।\n3. `g[x] == 0` হলে কাউন্টার বাড়ান।\n4. কাউন্টার প্রিন্ট করুন।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn, s = data[0], data[1]\nmoves = data[2:2 + s]\ng = [0] * (n + 1)\nlosing = 1\nfor x in range(1, n + 1):\n    reachable = set()\n    for mv in moves:\n        if x >= mv:\n            reachable.add(g[x - mv])\n    m = 0\n    while m in reachable:\n        m += 1\n    g[x] = m\n    if m == 0:\n        losing += 1\nprint(losing)\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n * s)`, স্পেস `O(n)`। `n = 100000`, `s = 10`-এ প্রায় `10^6` ধাপ।\n\n### সাধারণ ভুল\n\n- `g(0) = 0` কাউন্টে ধরা: শর্ত `0` থেকে `n` পর্যন্ত, তাই `0`-ও যোগ হবে — শুধু `x >= 1` ঘুরলে `n = 0`-এ উত্তর `0` আসবে, অথচ সঠিক `1` (শূন্যটাই হারার অবস্থা)।\n- শুধু প্রথম কয়টা প্যাটার্ন দেখে সূত্র বানানো — চালের তালিকা বদলালে সূত্র ভেঙে যায়; DP-ই নিরাপদ।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Game Theory", "Grundy Number", "DP"],
    tests: [
      { input: "5 2\n1 2\n", expectedOutput: "2\n", isSample: true },
      { input: "0 2\n1 2\n", expectedOutput: "1\n", isSample: true },
      { input: "10 1\n1\n", expectedOutput: "6\n", isSample: false },
      { input: "10 1\n2\n", expectedOutput: "6\n", isSample: false },
      { input: "10 3\n1 3 4\n", expectedOutput: "4\n", isSample: false },
      { input: "100000 2\n1 2\n", expectedOutput: "33334\n", isSample: false },
      {
        input: "100000 3\n1 3 4\n",
        expectedOutput: "28572\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, s = data[0], data[1]\nmoves = data[2:2 + s]\ng = [0] * (n + 1)\nlosing = 1\nfor x in range(1, n + 1):\n    reachable = set()\n    for mv in moves:\n        if x >= mv:\n            reachable.add(g[x - mv])\n    m = 0\n    while m in reachable:\n        m += 1\n    g[x] = m\n    if m == 0:\n        losing += 1\nprint(losing)\n",
  },
  {
    slug: "learn-m7-game-theory-x2",
    title: "Find a Winning Move",
    statement:
      "রাফি Nim খেলছেন কিন্তু এবার শুধু জেতা নয় — জেতার চালটাও খুঁজে বের করতে চান। পাইলগুলো দেওয়া থাকবে; বর্তমান অবস্থায় যদি প্রথম খেলোয়াড় ইতিমধ্যেই হারা অবস্থায় থাকে তাহলে কোনো চালই সাহায্য করবে না — `-1` প্রিন্ট করুন।\n\nনাহলে এমন একটা চাল বের করুন: কোন পাইল থেকে (১-ভিত্তিক নম্বর) কয়টা পাথর তুলে নিলে পরের খেলোয়াড় হারা অবস্থায় পড়বে। একাধিক সম্ভব চাল থাকলে **সবচেয়ে ছোট পাইল নম্বরটাই** বের করুন (সেই পাইলের জন্য উত্তর অদ্বিতীয়)।\n\nউদাহরণ: পাইল `3 4 5` — XOR `2`; পাইল `1` থেকে `2`টা তুললে `[1, 4, 5]`, XOR `0` → উত্তর `1 2`।",
    inputFormat:
      "প্রথম লাইনে `n`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা — পাইলগুলো।",
    outputFormat:
      "হারা অবস্থায় `-1`, নাহলে `i k` — পাইল নম্বর আর তোলা পাথর সংখ্যা।",
    constraints:
      "`1 <= n <= 100000`\n`0 <= a_i <= 10^9`",
    editorial:
      "### ধারণা\n\nসব পাইলের XOR `x` বের করুন। `x == 0` হলে এটা ইতিমধ্যেই হারা অবস্থা, তাই `-1`। `x != 0` হলে এমন একটা পাইল খুঁজতে হবে যার মান `a_i`-কে ছোট করে `a_i ^ x` করা যায় — কারণ নতুন XOR হবে `x ^ a_i ^ (a_i ^ x) = 0`। শর্ত হলো `(a_i ^ x) < a_i` (পাথর কমাতেই হবে, বাড়ানো যায় না)। যেকোনো একটা পাইলে এটা সম্ভবই — কারণ `x`-এর সবচেয়ে উঁচু সেট বিটে `a_i`-ও সেট থাকা পাইলটাই কাজ করে। প্রথমটাই বের করলে প্রশ্নের নিয়ম মেলে।\n\n### ধাপে ধাপে\n\n1. `n` আর সব পাইল পড়ে XOR `x` বের করুন।\n2. `x == 0` হলে `-1` প্রিন্ট করে থামুন।\n3. পাইলগুলো ক্রমানুসারে ঘুরুন; প্রথম `i`-এর জন্য যেখানে `(a_i ^ x) < a_i`, সেখানে `i` আর `a_i - (a_i ^ x)` প্রিন্ট করুন।\n4. লুপ শেষ হলেও না পাওয়া গেলে এটা অসম্ভব, তবে তাৎক্ষণিকভাবে `x != 0` হলে সবসময় পাওয়া যায়।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\npiles = data[1:]\nx = 0\nfor v in piles:\n    x ^= v\nif x == 0:\n    print(-1)\nelse:\n    for i, v in enumerate(piles, start=1):\n        if (v ^ x) < v:\n            print(i, v - (v ^ x))\n            break\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(1)` ইনপুট ছাড়া। `n = 100000`-এ সহজে চলে।\n\n### সাধারণ ভুল\n\n- `(v ^ x) < v` শর্ত ছাড়া শুধু প্রথম পাইল ধরে নেওয়া: `[4, 5]`-এ XOR `1`; পাইল `1`-এ `4 ^ 1 = 5 > 4` অর্থাৎ পাথর বাড়াতে হবে — সেটা সম্ভব নয়; সঠিক উত্তর `2 1`।\n- পাইল নম্বর ০ দিয়ে শুরু করা — চাওয়া হয়েছে ১-ভিত্তিক, তাই `enumerate(..., start=1)`।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Game Theory", "Nim", "XOR"],
    tests: [
      { input: "3\n3 4 5\n", expectedOutput: "1 2\n", isSample: true },
      { input: "2\n1 1\n", expectedOutput: "-1\n", isSample: true },
      { input: "1\n7\n", expectedOutput: "1 7\n", isSample: false },
      { input: "3\n2 2 3\n", expectedOutput: "1 1\n", isSample: false },
      { input: "2\n4 5\n", expectedOutput: "2 1\n", isSample: false },
      { input: "3\n0 0 5\n", expectedOutput: "3 5\n", isSample: false },
      { input: "4\n5 5 5 5\n", expectedOutput: "-1\n", isSample: false },
      { input: X2_MAX_INPUT, expectedOutput: "65536 31072\n", isSample: false },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\npiles = data[1:]\nx = 0\nfor v in piles:\n    x ^= v\nif x == 0:\n    print(-1)\nelse:\n    for i, v in enumerate(piles, start=1):\n        if (v ^ x) < v:\n            print(i, v - (v ^ x))\n            break\n",
  },
];
