import type { SeedProblem } from "../../seed-problems";

export const GAME_THEORY_PRACTICE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m7-game-theory-e2",
    title: "One to K Stones",
    statement:
      "কমন রুমে নতুন খেলা: সামনে এক পাইল পাথর, মোট `n`টা। প্রতি চালে খেলোয়াড় **`1` থেকে `k`-এর মধ্যে** যেকোনো সংখ্যা পাথর তুলে নিতে পারবে (অন্তত একটা)। যে শেষ পাথরটা নেবে সে জিতবে। সাদিয়া প্রথমে শুরু করবে, দুজনেই নিখুঁতভাবে খেলবে।\n\nকে জিতবে বলো — সাদিয়া হলে `Alice`, প্রতিপক্ষ হলে `Bob`।\n\nউদাহরণ: `n = 5`, `k = 3` → সাদিয়া `1`টা নিয়ে বাকি `4` রাখবে; এরপর প্রতিপক্ষ যা-ই নিক (`1` থেকে `3`), সাদিয়া বাকিটা নিয়ে জিতবে → `Alice`। আর `n = 8`, `k = 3` হলে `8` ঠিক `k+1 = 4`-এর গুণিতক — সাদিয়া যা-ই নিক, প্রতিপক্ষ গুণিতকে ফিরিয়ে দিতে পারবে → `Bob`।",
    inputFormat: "এক লাইনে `n` ও `k`।",
    outputFormat: "বিজয়ীর নাম `Alice` বা `Bob` এক লাইনে প্রিন্ট করো।",
    constraints: "`1 <= n <= 10^18`\n`1 <= k <= 10^18`",
    editorial:
      "## ধারণা\n\nএক চালে সর্বোচ্চ `k`টা নেওয়া যায়, তাই হারার অবস্থাগুলো ঠিক `k+1`-এর গুণিতক। যে খেলোয়াড় গুণিতক পাইলে পায়, সে যা নিক প্রতিপক্ষ বাকি নিয়ে আবার গুণিতকে ফেরত দিতে পারে — শেষে সে-ই শূন্যে পৌঁছায়, অর্থাৎ শেষ পাথরটা নেয়। `n` গুণিতক না হলে প্রথম খেলোয়াড় `n mod (k+1)`টা নিয়ে বাকিটা গুণিতক করে দেয়। এটা Nim-এর এক পাইলের সহজ রূপ — সেখানে সব পাইলের XOR, এখানে মডিউল নিয়মটা কাজ করে।\n\n## ধাপে ধাপে\n\n1. `n` ও `k` পড়ে নাও।\n2. `r = n mod (k + 1)` বের করো।\n3. `r` শূন্য হলে `Bob`, নাহলে `Alice` প্রিন্ট করো।\n\n```python\nimport sys\nn, k = map(int, sys.stdin.read().split())\nprint('Alice' if n % (k + 1) != 0 else 'Bob')\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(1)`, স্পেস `O(1)` — `10^18`-ও এক ধাপে ভাগ যায়।\n\n## সাধারণ ভুল\n\n- **লুপ চালিয়ে খেলা সিমুলেট করা:** `n = 10^18`-এ অসম্ভব; প্যাটার্নটা `(k+1)`-এর গুণিতক।\n- **`k >= n` হলে বিভ্রান্ত হওয়া:** প্রথম খেলোয়াড় সবগুলো এক চালে নিতে পারে → `Alice`; সূত্রও তাই বলে (`n mod (k+1) = n`, অশূন্য)।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Game Theory", "Math", "Modular Arithmetic"],
    tests: [
      { input: "5 3\n", expectedOutput: "Alice\n", isSample: true },
      { input: "8 3\n", expectedOutput: "Bob\n", isSample: true },
      { input: "1 1\n", expectedOutput: "Alice\n", isSample: false },
      { input: "2 2\n", expectedOutput: "Alice\n", isSample: false },
      {
        input: "1000000000000000000 1000000000000000000\n",
        expectedOutput: "Alice\n",
        isSample: false,
      },
      { input: "7 2\n", expectedOutput: "Alice\n", isSample: false },
      { input: "6 2\n", expectedOutput: "Bob\n", isSample: false },
      {
        input: "10 1000000000000000000\n",
        expectedOutput: "Alice\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nn, k = map(int, sys.stdin.read().split())\nprint('Alice' if n % (k + 1) != 0 else 'Bob')\n",
  },
  {
    slug: "learn-m7-game-theory-e3",
    title: "Add One More Pile",
    statement:
      "খেলার টেবিলে পাইলগুলো সাজানোর পর মাঝখানে একটা খালি জায়গা রইল। তানভির ভাবলেন — ওখানে আরেকটা পাইল বসালে সাদিয়া (প্রথম খেলোয়াড়) নিশ্চিত হারবে কি? নতুন পাইলে ঠিক `x`টা পাথর থাকবে (`x >= 1`)। নিয়ম সাধারণ Nim-এর মতোই: প্রতি চালে একটা পাইল থেকে যেকোনো সংখ্যা পাথর, শেষ পাথর নেওয়াই জয়।\n\nবর্তমান পাইলগুলো দেওয়া থাকবে; এমন `x` প্রিন্ট করো যাতে নতুন পাইলসহ সব পাইলের XOR শূন্য হয়ে যায়। এমন কোনো `x` না থাকলে (সাদিয়া ইতিমধ্যেই হারার অবস্থায়) `-1` প্রিন্ট করো।\n\nউদাহরণ: পাইল `1 2 3` → XOR `0`, যেকোনো নতুন পাইল সাদিয়াকে জেতাবেই → `-1`; পাইল `3 4` → XOR `7`, তাই `x = 7`।",
    inputFormat:
      "প্রথম লাইনে `n`, দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা — পাইলগুলোর পাথর সংখ্যা।",
    outputFormat: "কাঙ্ক্ষিত `x`, নাহলে `-1` এক লাইনে প্রিন্ট করো।",
    constraints: "`1 <= n <= 100`\n`0 <= a_i <= 10^9`",
    editorial:
      "## ধারণা\n\nNim-এ প্রথম খেলোয়াড় হারে যদি সব পাইলের XOR শূন্য হয়। নতুন পাইল `x` যোগ করলে নতুন XOR হয় `X ^ x`, যেখানে `X` পুরনো XOR। শূন্য করতে হলে `x = X`-ই একমাত্র সমাধান — XOR-এ `X ^ x = 0` মানেই `x = X`। `X > 0` হলে সেই `x` বৈধ (অন্তত একটা পাথর)। `X = 0` হলে `x = 0` লাগত, কিন্তু খালি পাইল বসানো যায় না — আর যেকোনো অশূন্য `x` নতুন XOR অশূন্যই রাখবে, মানে সাদিয়া জিতবেই; তাই উত্তর `-1`।\n\n## ধাপে ধাপে\n\n1. সব পাইলের XOR `X` বের করো।\n2. `X > 0` হলে `X` প্রিন্ট করো।\n3. `X = 0` হলে `-1` প্রিন্ট করো।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nx = 0\nfor v in data[1:]:\n    x ^= v\nprint(x if x != 0 else -1)\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(1)` ইনপুট ছাড়া।\n\n## সাধারণ ভুল\n\n- **`X = 0` হলে `0` প্রিন্ট করা:** খালি পাইল খেলাই বদলায় না, কিন্তু শর্ত অন্তত একটা পাথর — তাই তখন উত্তর `-1`।\n- **একাধিক সমাধান আছে ভেবে ছোটটা খোঁজা:** `x`-এর একটাই সম্ভব মান (`X`), আলাদা খোঁজা লাগে না।\n- **খালি পাইল (`0`) XOR-এ ভুল দেখা:** শূন্য কিছুই বদলায় না, তবু ইনপুটে থাকতে পারে — যেমন আছে তেমনই XOR করো।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Game Theory", "Nim", "XOR"],
    tests: [
      { input: "3\n1 2 3\n", expectedOutput: "-1\n", isSample: true },
      { input: "2\n3 4\n", expectedOutput: "7\n", isSample: true },
      { input: "1\n5\n", expectedOutput: "5\n", isSample: false },
      { input: "4\n0 0 0 0\n", expectedOutput: "-1\n", isSample: false },
      { input: "2\n0 0\n", expectedOutput: "-1\n", isSample: false },
      { input: "5\n1 2 4 8 16\n", expectedOutput: "31\n", isSample: false },
      { input: "3\n7 7 7\n", expectedOutput: "7\n", isSample: false },
      { input: "1\n1\n", expectedOutput: "1\n", isSample: false },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nx = 0\nfor v in data[1:]:\n    x ^= v\nprint(x if x != 0 else -1)\n",
  },
  {
    slug: "learn-m7-game-theory-m2",
    title: "Subtract a Square",
    statement:
      "চেস ক্লাবের নতুন খেলায় একটাই পাইল পাথর, মোট `n`টা। প্রতি চালে খেলোয়াড় পাইল থেকে একটা **পূর্ণবর্গ সংখ্যা** পাথর তুলে নিতে পারবে — `1, 4, 9, 16, ...` এর মধ্যে যেগুলো পাইলে আছে। যে শেষ পাথরটা নেবে সে জিতবে। রফি প্রথমে শুরু করবে, দুজনেই নিখুঁতভাবে খেলবে।\n\nকে জিতবে বলো — রফি হলে `Alice`, প্রতিপক্ষ হলে `Bob`।\n\nউদাহরণ: `n = 1` → রফি `1`টা নিয়েই জেতে → `Alice`; `n = 2` → `1` নিলে `1` থাকে (প্রতিপক্ষ জেতে), আর `4` নেওয়ার মতো পাথরই নেই → `Bob`।",
    inputFormat: "এক লাইনে একটা পূর্ণসংখ্যা `n` — পাথরের সংখ্যা।",
    outputFormat: "বিজয়ীর নাম `Alice` বা `Bob` এক লাইনে প্রিন্ট করো।",
    constraints: "`1 <= n <= 10000`",
    editorial:
      "## ধারণা\n\nচালের তালিকা পাথরের সংখ্যার উপর নির্ভর করে (`x`-এর চেয়ে বড় বর্গ নেওয়া যায় না), তাই সরাসরি Nim-এর XOR নিয়ম খাটে না — Grundy number লাগবে। `g(0) = 0`, আর `g(x) = mex{ g(x-1), g(x-4), g(x-9), ... }` (যত বর্গ `x`-এর সমান বা ছোট)। হারার অবস্থাগুলো (যেখানে `g = 0`) অনিয়মিতভাবে ছড়ানো — `2, 5, 7, 10, 12`-এর মতো মানগুলো হারে, কোনো সহজ সূত্র নেই। তাই `n` পর্যন্ত একবার DP চালিয়ে `g(n)` বের করেই দেখো। খেলাটা এক পাইলের, তাই Sprague-Grundy-এর XOR-ও লাগবে না — শুধু `g(n)` শূন্য কিনা।\n\n## ধাপে ধাপে\n\n1. `sqrt(n)` পর্যন্ত পূর্ণবর্গগুলোর তালিকা বানাও।\n2. `g[0] = 0` ধরে `x = 1` থেকে `n` পর্যন্ত DP চালাও: `x`-এর সমান বা ছোট প্রতিটি বর্গ `sq`-এর জন্য `g[x - sq]` একটা সেটে রাখো।\n3. সেটে না-থাকা ছোট মানটাই (mex) `g[x]`।\n4. `g[n] != 0` হলে `Alice`, নাহলে `Bob`।\n\n```python\nimport sys\nn = int(sys.stdin.readline())\nsquares = []\ni = 1\nwhile i * i <= n:\n    squares.append(i * i)\n    i += 1\ng = [0] * (n + 1)\nfor x in range(1, n + 1):\n    seen = set()\n    for sq in squares:\n        if sq > x:\n            break\n        seen.add(g[x - sq])\n    m = 0\n    while m in seen:\n        m += 1\n    g[x] = m\nprint('Alice' if g[n] != 0 else 'Bob')\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n * sqrt(n))`, স্পেস `O(n)`। `n = 10000`-এ প্রায় `6 * 10^5` ধাপ — সহজেই চলে।\n\n## সাধারণ ভুল\n\n- **`n mod k`-জাতীয় প্যাটার্ন খোঁজা:** বর্গ সংখ্যার ব্যবধান ক্রমশ বাড়ে, তাই হারার অবস্থা অনিয়মিত — প্রথম কয়েকটা দেখে সূত্র বানালে ভুল হবে।\n- **`x`-এর চেয়ে বড় বর্গও সেটে রাখা:** `x - sq` নেগেটিভ হয়ে ইনডেক্স এলোমেলো হয়; `sq > x` হলে লুপ থামাও।\n- **mex ভুল বোঝা:** mex সেটে **না-থাকা** ছোট মান, সেটের সর্বনিম্ন নয়।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Game Theory", "Grundy Number", "DP"],
    tests: [
      { input: "1\n", expectedOutput: "Alice\n", isSample: true },
      { input: "2\n", expectedOutput: "Bob\n", isSample: true },
      { input: "3\n", expectedOutput: "Alice\n", isSample: false },
      { input: "4\n", expectedOutput: "Alice\n", isSample: false },
      { input: "5\n", expectedOutput: "Bob\n", isSample: false },
      { input: "6\n", expectedOutput: "Alice\n", isSample: false },
      { input: "7\n", expectedOutput: "Bob\n", isSample: false },
      { input: "10000\n", expectedOutput: "Alice\n", isSample: false },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\nsquares = []\ni = 1\nwhile i * i <= n:\n    squares.append(i * i)\n    i += 1\ng = [0] * (n + 1)\nfor x in range(1, n + 1):\n    seen = set()\n    for sq in squares:\n        if sq > x:\n            break\n        seen.add(g[x - sq])\n    m = 0\n    while m in seen:\n        m += 1\n    g[x] = m\nprint('Alice' if g[n] != 0 else 'Bob')\n",
  },
  {
    slug: "learn-m7-game-theory-m3",
    title: "Staircase Stones",
    statement:
      "সিঁড়ির ধাপ `1` থেকে `n` (নিচের দিকে `1` নং ধাপ)। ধাপ `i`-তে `a_i`টা পাথর। প্রতি চালে খেলোয়াড় একটা ধাপ বেছে সেখান থেকে যেকোনো সংখ্যা পাথর তুলে এক ধাপ **নিচে** নামিয়ে রাখবে। ধাপ `1` থেকে নামানো পাথর মাটিতে পড়ে খেলা থেকে বাদ। যে খেলোয়াড়ের সামনে আর কোনো ধাপেই পাথর থাকে না, সে চাল দিতে পারবে না — আর হারবে। নুসরাত প্রথমে শুরু করবে।\n\nকে জিতবে বলো — নুসরাত হলে `Alice`, প্রতিপক্ষ হলে `Bob`।\n\nউদাহরণ: ধাপ `1`-এ `4`টা পাথর, বাকি সব ধাপে শূন্য → নুসরাত সবগুলো এক চালে মাটিতে নামিয়ে দিলে প্রতিপক্ষের সামনে খালি টেবিল → `Alice`। আর ধাপ `2`-তে পাথর, ধাপ `1` খালি → নুসরাত যতটা নামাক, প্রতিপক্ষ হুবহু সেই সংখ্যাই এক ধাপ নিচে নামিয়ে উত্তর দিতে পারবে → `Bob`।",
    inputFormat:
      "প্রথম লাইনে `n`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা — ধাপ `1` থেকে `n` পর্যন্ত প্রতিটির পাথর সংখ্যা।",
    outputFormat: "বিজয়ীর নাম `Alice` বা `Bob` এক লাইনে প্রিন্ট করো।",
    constraints:
      "`1 <= n <= 100000`\n`0 <= a_i <= 10^9`",
    editorial:
      "## ধারণা\n\nমূল পর্যবেক্ষণ: জোড় নম্বর ধাপের পাথর খেলার ভাগ্য বদলায় না। ধরো সব বিজোড় ধাপের পাথরের XOR শূন্য। প্রতিপক্ষ বিজোড় ধাপ `2k+1` থেকে পাথর নামালে খেলোয়াড় সেই পাইলটা XOR-শূন্য করে দেয় — ঠিক Nim-এর মতো। প্রতিপক্ষ জোড় ধাপ `2k` থেকে `y`টা পাথর `2k-1`-এ (বিজোড় ধাপে) নামালে খেলোয়াড় সেই `y`টাই `2k-1` থেকে `2k-2`-তে নামিয়ে দেয় — বিজোড় ধাপের হিসাব আবার আগের মতো, নকল চালে ভারসাম্য ফিরে আসে। এভাবে শেষ পাথরও খেলোয়াড়ের চালেই মাটিতে নামে। কাজেই বিজোড় ধাপগুলোকে Nim-এর পাইল ধরে XOR করলেই ফল: শূন্য না হলে প্রথম খেলোয়াড় জেতে।\n\n## ধাপে ধাপে\n\n1. ধাপগুলো পড়ে নাও।\n2. বিজোড় নম্বর ধাপের (ধাপ `1, 3, 5, ...`) পাথরগুলোর XOR বের করো।\n3. XOR শূন্য না হলে `Alice`, শূন্য হলে `Bob`।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nx = 0\nfor i in range(1, n + 1):\n    if i % 2 == 1:\n        x ^= data[i]\nprint('Alice' if x != 0 else 'Bob')\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(1)` ইনপুট ছাড়া।\n\n## সাধারণ ভুল\n\n- **সব ধাপের পাথর XOR করা:** জোড় ধাপের পাথর নকল চালে নিরপেক্ষ হয়ে যায় — শুধু বিজোড় ধাপ গুনো।\n- **মাটিকে (ধাপ `0`) ধাপ ভেবে হিসাবে আনা:** মাটিতে নামানো পাথর খেলায় আর নেই।\n- **চালের দিক উল্টিয়ে ভাবা:** পাথর সবসময় নিচে নামে, উপরে ওঠে না — এই একমুখী নিয়মই নকল-চাল কৌশলটা সম্ভব করে।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Game Theory", "Nim", "XOR"],
    tests: [
      { input: "1\n4\n", expectedOutput: "Alice\n", isSample: true },
      { input: "2\n0 7\n", expectedOutput: "Bob\n", isSample: true },
      { input: "3\n2 9 2\n", expectedOutput: "Bob\n", isSample: false },
      { input: "4\n1 0 1 0\n", expectedOutput: "Bob\n", isSample: false },
      { input: "4\n1 0 2 0\n", expectedOutput: "Alice\n", isSample: false },
      {
        input: "5\n0 0 0 0 0\n",
        expectedOutput: "Bob\n",
        isSample: false,
      },
      { input: "3\n3 4 5\n", expectedOutput: "Alice\n", isSample: false },
      {
        input: `100000\n${Array.from({ length: 100000 }, (_, i) => (i % 2 === 0 ? 123456789 : 0)).join(" ")}\n`,
        expectedOutput: "Bob\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nx = 0\nfor i in range(1, n + 1):\n    if i % 2 == 1:\n        x ^= data[i]\nprint('Alice' if x != 0 else 'Bob')\n",
  },
  {
    slug: "learn-m7-game-theory-h2",
    title: "Split Unequal Piles",
    statement:
      "চেস ক্লাবে রাত জাগানো খেলা: টেবিলে `t`-টা পাইল পাথর। প্রতি চালে খেলোয়াড় **একটা** পাইল বেছে সেটাকে দুইটা পাইলে ভাঙবে — এমন ভাঙন যে দুই অংশের পাথর সংখ্যা আলাদা হয় আর দুই অংশেই অন্তত একটা পাথর থাকে। মানে `4 → 1 + 3` বৈধ, কিন্তু `4 → 2 + 2` বা `2 → 1 + 1` অবৈধ (দুই অংশ সমান); `1` বা `2` পাইল একেবারেই ভাঙা যায় না। যে খেলোয়াড়ের সামনে আর কোনো ভাঙন সম্ভব না, সে হারবে। সাদিয়া প্রথমে শুরু করবে।\n\nকে জিতবে বলো — সাদিয়া হলে `Alice`, প্রতিপক্ষ হলে `Bob`।\n\nউদাহরণ: পাইল `3` → সাদিয়া `1 + 2`-এ ভাঙবে; দুই পাইলই আর ভাঙা যায় না → `Alice`। পাইল `2` → কোনো ভাঙনই নেই → `Bob`।",
    inputFormat:
      "প্রথম লাইনে `t`। দ্বিতীয় লাইনে `t`টি পূর্ণসংখ্যা — পাইলগুলোর পাথর সংখ্যা।",
    outputFormat: "বিজয়ীর নাম `Alice` বা `Bob` এক লাইনে প্রিন্ট করো।",
    constraints: "`1 <= t <= 100`\n`1 <= a_i <= 500`",
    editorial:
      "## ধারণা\n\nভাঙন খেলা Sprague-Grundy-এর চূড়ান্ত পরীক্ষা: একটা পাইল ভাঙলে **দুইটা স্বাধীন খেলা** জন্মায়, আর স্বাধীন খেলার সমষ্টির Grundy হয় তাদের Grundy-এর XOR। তাই `g(x) = mex{ g(i) ^ g(x - i) : 1 <= i, x - i, i != x - i }` — প্রতিটি বৈধ ভাঙনের ফলে পাওয়া অবস্থার Grundy হলো দুই অংশের Grundy-এর XOR, আর সেগুলোর সেট থেকে mex নিলেই `g(x)`। ভিত্তি: `g(0) = g(1) = g(2) = 0` — `1`, `2` আর ভাঙা যায় না। শেষে `t`-টা পাইলের `g(a_i)`-গুলো XOR করে দেখো — Sprague-Grundy উপপাদ্য বলে ফল শূন্য হলে দ্বিতীয় খেলোয়াড় জেতে।\n\n## ধাপে ধাপে\n\n1. সব পাইলের সর্বোচ্চ মান `P` পর্যন্ত `g` অ্যারে বানাও, `g[0] = 0`।\n2. প্রতিটি `x`-এর জন্য সব `i` ঘুরো যেখানে `i < x - i` (অসম জোড়া), আর `g[i] ^ g[x - i]` সেটে রাখো।\n3. সেটের mex-ই `g[x]`।\n4. সব পাইলের `g[a_i]` XOR করো; শূন্য হলে `Bob`, নাহলে `Alice`।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nt = data[0]\npiles = data[1:]\nmax_p = max(piles)\ng = [0] * (max_p + 1)\nfor x in range(1, max_p + 1):\n    seen = set()\n    for i in range(1, x):\n        if 2 * i >= x:\n            break\n        seen.add(g[i] ^ g[x - i])\n    m = 0\n    while m in seen:\n        m += 1\n    g[x] = m\nx = 0\nfor v in piles:\n    x ^= g[v]\nprint('Alice' if x != 0 else 'Bob')\n```\n\n## কমপ্লেক্সিটি\n\nপ্রতি `x`-এ প্রায় `x/2`টা জোড়া — মোট `O(P^2)` (`P = 500`-এ প্রায় `6 * 10^4` জোড়া) আর `O(t)` বাকি কাজ। স্পেস `O(P)`।\n\n## সাধারণ ভুল\n\n- **পাথরের সংখ্যা XOR করা:** ভাঙন খেলার Grundy পাথরের সংখ্যার সাথে মেলে না — `g(4) = 0` অথচ পাইলে পাথর `4`।\n- **সম ভাঙনও ঢুকিয়ে ফেলা:** `4 → 2 + 2` নিয়মে নেই; `2 * i >= x` শর্ত বাদ দিলে পুরো টেবিল বদলে যায়।\n- **`g(2)`-কে জিতের অবস্থা ভাবা:** `2 → 1 + 1` অবৈধ, তাই `g(2) = 0` — ছোট মান হাতে যাচাই করে নাও।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Game Theory", "Grundy Number", "Sprague-Grundy", "DP"],
    tests: [
      { input: "1\n3\n", expectedOutput: "Alice\n", isSample: true },
      { input: "1\n2\n", expectedOutput: "Bob\n", isSample: true },
      { input: "2\n2 2\n", expectedOutput: "Bob\n", isSample: false },
      { input: "2\n4 4\n", expectedOutput: "Bob\n", isSample: false },
      { input: "1\n5\n", expectedOutput: "Alice\n", isSample: false },
      { input: "3\n2 3 4\n", expectedOutput: "Alice\n", isSample: false },
      { input: "1\n500\n", expectedOutput: "Alice\n", isSample: false },
      {
        input: `100\n${Array.from({ length: 51 }, () => "5").join(" ")} ${Array.from({ length: 49 }, () => "2").join(" ")}\n`,
        expectedOutput: "Alice\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nt = data[0]\npiles = data[1:]\nmax_p = max(piles)\ng = [0] * (max_p + 1)\nfor x in range(1, max_p + 1):\n    seen = set()\n    for i in range(1, x):\n        if 2 * i >= x:\n            break\n        seen.add(g[i] ^ g[x - i])\n    m = 0\n    while m in seen:\n        m += 1\n    g[x] = m\nx = 0\nfor v in piles:\n    x ^= g[v]\nprint('Alice' if x != 0 else 'Bob')\n",
  },
];
