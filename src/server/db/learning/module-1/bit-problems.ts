import type { SeedProblem } from "../../seed-problems";
import { nAndNumbers, spaceOutput } from "../generated-tests";

const BITMASK_MAX_VALUES = Array.from({ length: 16 }, (_, index) => index + 1);

function bitmaskSums(values: number[]): number[] {
  const sums: number[] = [];
  for (let mask = 0; mask < 1 << values.length; mask += 1) {
    let total = 0;
    for (let index = 0; index < values.length; index += 1) {
      if (mask & (1 << index)) total += values[index] ?? 0;
    }
    sums.push(total);
  }
  return sums;
}

const SINGLE_NUMBER_MAX_VALUES = [
  ...Array.from({ length: 50_000 }, (_, index) => index).flatMap((value) => [value, value]),
  1_000_000_000,
];

export const BIT_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m1-count-set-bits",
    title: "Count Set Bits",
    statement:
      "রাফি প্রাইমএশিয়া ল্যাবের চেয়ার-ইন্ডিকেটরের অবস্থা একটা সংখ্যায় সেভ করেন: যে চেয়ারে লাইট জ্বলেছে তার বিট `1`, বাকি সবগুলো `0`। সাদিয়া জানতে চান সেই সংখ্যাটির বাইনারি রূপে কতগুলো বিট `1` আছে — অর্থাৎ কতগুলো চেয়ারে লাইট জ্বলেছে।\n\nউদাহরণ: `13`-এর বাইনারি `1101`, তাই উত্তর `3`।",
    inputFormat: "একটি লাইনে একটি পূর্ণসংখ্যা `n`।",
    outputFormat: "`n`-এর বাইনারি রূপে `1` বিটের সংখ্যা এক লাইনে প্রিন্ট করুন।",
    constraints: "`0 <= n <= 2^31 - 1`",
    editorial:
      "### ধারণা\n\nবাইনারি রূপে প্রতিটি `1` হলো একটা চালু বিট। সবচেয়ে সহজ উপায় হলো `bin(n)` দিয়ে বাইনারি স্ট্রিং বানানো এবং তাতে `'1'` কতবার আছে গোনা। C++-তে লুপ চালিয়ে `n & 1` করে শেষ বিট কেটে ফেলেও হয়।\n\n### ধাপে ধাপে\n\n1. ইনপুট থেকে `n` নিন।\n2. `n`-কে বাইনারি স্ট্রিংয়ে রূপান্তর করুন।\n3. সেই স্ট্রিংয়ে `'1'` অক্ষরগুলো গুনে প্রিন্ট করুন।\n\n```python\nimport sys\nn = int(sys.stdin.readline())\nprint(bin(n).count('1'))\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(log n)` (বাইনারি রূপের দৈর্ঘ্য), স্পেস `O(log n)`। Python 3.10+ এ `n.bit_count()` ব্যবহার করলেও একই ফল পাওয়া যায়।\n\n### সাধারণ ভুল\n\n- দশমিক সংখ্যার অঙ্ক গোনা ভুল: `1000`-এ দশমিকে ১টা `1` থাকলেও বাইনারিতে `1111101000`, অর্থাৎ ৬টা 1 বিট আছে।\n- ঋণাত্মক সংখ্যায় `bin()` আলাদা করে ঋণাঙ্ক দেখায়, তাই ইনপুটের সীমা আগে পড়ে নিন।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Bit Manipulation", "Binary"],
    tests: [
      { input: "13\n", expectedOutput: "3\n", isSample: true },
      { input: "0\n", expectedOutput: "0\n", isSample: true },
      { input: "1\n", expectedOutput: "1\n", isSample: false },
      { input: "1000\n", expectedOutput: "6\n", isSample: false },
      { input: "1024\n", expectedOutput: "1\n", isSample: false },
      { input: "1000000000\n", expectedOutput: "13\n", isSample: false },
      { input: "2147483647\n", expectedOutput: "31\n", isSample: false },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\nprint(bin(n).count('1'))\n",
  },
  {
    slug: "learn-m1-odd-even-bit",
    title: "Odd or Even with Bitwise AND",
    statement:
      "নুসরাত ল্যাবের গেটে দাঁড়িয়ে দেখলেন ছাত্রছাত্রী সংখ্যা অনুযায়ী দুই লাইনে সাজছে — জোড় সংখ্যা হলে এক লাইন, বিজোড় হলে অন্য লাইন। তিনি একটা ছোট প্রোগ্রাম চান যেটা বলবে দেওয়া সংখ্যাটি জোড় না বিজোড়।\n\nশর্ত হলো অবশ্যই bitwise AND (`&`) ব্যবহার করতে হবে, modulo (`%`) নয়।\n\nউদাহরণ: `7` → `ODD`, `12` → `EVEN`।",
    inputFormat: "একটি লাইনে একটি পূর্ণসংখ্যা `n`।",
    outputFormat: "`ODD` অথবা `EVEN` এক লাইনে প্রিন্ট করুন।",
    constraints: "`-2^31 <= n <= 2^31 - 1`",
    editorial:
      "### ধারণা\n\nসব জোড় পূর্ণসংখ্যার শেষ বিট `0`, আর সব বিজোড় সংখ্যার শেষ বিট `1`। `n & 1` শুধু সেই শেষ বিটটাই রেখে দেয়, তাই ফল জোড় হলে `0`, বিজোড় হলে `1`। এটা `O(1)` সময়ে কাজ করে।\n\n### ধাপে ধাপে\n\n1. ইনপুট থেকে `n` নিন।\n2. `n & 1` করুন; ফল `0` হলে সংখ্যাটি জোড়, নাহলে বিজোড়।\n3. যথাযথ `EVEN` বা `ODD` প্রিন্ট করুন।\n\n```python\nimport sys\nn = int(sys.stdin.readline())\nprint('ODD' if (n & 1) else 'EVEN')\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(1)`, অতিরিক্ত স্পেস `O(1)`।\n\n### সাধারণ ভুল\n\n- C++-এ `==`-এর precedence `&`-এর চেয়ে বেশি, তাই `n & 1 == 0` লিখলে আসলে `n & (1 == 0)` হয়। Python-এ `&` আগে চলে, তবে দুই ভাষাতেই স্পষ্টভাবে `(n & 1) == 0` লিখুন।\n- ঋণাত্মক সংখ্যাও ঠিক একইভাবে কাজ করে: Python-এ `-3 & 1` হয় `1`, কারণ ভেতরে ঋণাত্মক সংখ্যা two's complement হিসেবে সংরক্ষিত থাকে।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Bit Manipulation", "Bitwise AND"],
    tests: [
      { input: "7\n", expectedOutput: "ODD\n", isSample: true },
      { input: "12\n", expectedOutput: "EVEN\n", isSample: true },
      { input: "0\n", expectedOutput: "EVEN\n", isSample: false },
      { input: "-3\n", expectedOutput: "ODD\n", isSample: false },
      { input: "-10\n", expectedOutput: "EVEN\n", isSample: false },
      { input: "1000000001\n", expectedOutput: "ODD\n", isSample: false },
      { input: "2147483647\n", expectedOutput: "ODD\n", isSample: false },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\nprint('ODD' if (n & 1) else 'EVEN')\n",
  },
  {
    slug: "learn-m1-power-of-two",
    title: "Power of Two",
    statement:
      "ক্যান্টিনের নতুন কম্বো প্যাক সবসময় 2-এর ঘাত সংখ্যক আইটেম দেয় — 1, 2, 4, 8, 16 ... তানভীর বিল চেক করছেন: প্যাকে মোট কয়টা আইটেম আছে সেটা দেওয়া হলে বলুন সেটি কি 2-এর ঘাত সংখ্যা।\n\nউদাহরণ: `8` → `YES` (কারণ `8 = 2^3`), `6` → `NO`।",
    inputFormat: "একটি লাইনে একটি পূর্ণসংখ্যা `n`।",
    outputFormat: "2-এর ঘাত হলে `YES`, নাহলে `NO` এক লাইনে প্রিন্ট করুন।",
    constraints: "`0 <= n <= 10^18`",
    editorial:
      "### ধারণা\n\n2-এর ঘাত সংখ্যার বাইনারি রূপে ঠিক একটা 1 বিট থাকে: `1 = 1`, `2 = 10`, `4 = 100`, `8 = 1000`। `n & (n - 1)` সবচেয়ে ডানে অবস্থিত 1 বিটটা মুছে দেয়, তাই ফল শূন্য হলে বুঝা যায় শুরুতে একটার বেশি 1 ছিল না। শূন্য আলাদা কেস: `0 & -1`-ও শূন্য, তাই `n > 0` শর্তটা যোগ করতে হবে।\n\n### ধাপে ধাপে\n\n1. ইনপুট থেকে `n` নিন।\n2. `n > 0` এবং `n & (n - 1)` শূন্য কিনা যাচাই করুন।\n3. শর্ত মিললে `YES`, নাহলে `NO` প্রিন্ট করুন।\n\n```python\nimport sys\nn = int(sys.stdin.readline())\nprint('YES' if n > 0 and (n & (n - 1)) == 0 else 'NO')\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(1)`, স্পেস `O(1)` — কোনো লুপ লাগে না।\n\n### সাধারণ ভুল\n\n- `n = 0` ভুলে গেলে `YES` দেয়, কিন্তু শূন্য কোনো ঘাত নয়।\n- `n & (n - 1) == 0`-এ C++-এ `==` আগে চলায় ফল ভুল হতে পারে; Python-এ `&` আগে চলে। দুই ভাষাতেই `(n & (n - 1)) == 0` লিখুন।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Bit Manipulation", "Math"],
    tests: [
      { input: "8\n", expectedOutput: "YES\n", isSample: true },
      { input: "6\n", expectedOutput: "NO\n", isSample: true },
      { input: "1\n", expectedOutput: "YES\n", isSample: false },
      { input: "0\n", expectedOutput: "NO\n", isSample: false },
      { input: "1048576\n", expectedOutput: "YES\n", isSample: false },
      { input: "1073741824\n", expectedOutput: "YES\n", isSample: false },
      { input: "999999999999999999\n", expectedOutput: "NO\n", isSample: false },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\nprint('YES' if n > 0 and (n & (n - 1)) == 0 else 'NO')\n",
  },
  {
    slug: "learn-m1-single-number",
    title: "The Single Number",
    statement:
      "তানভীর দুটো ল্যাব শিফটের ফলাফল একসাথে মিলিয়ে একটা তালিকা বানিয়েছেন, কিন্তু ভুল করে একটা সংখ্যা একবারই এসেছে — বাকি প্রতিটি সংখ্যা ঠিক দুইবার আছে (প্রতিটি শিফটে একবার)। তালিকাটিতে ঠিক একটাই এমন সংখ্যা আছে যা একবার এসেছে, সেটিই বের করতে হবে।\n\nসময় `O(n)` আর অতিরিক্ত স্পেস `O(1)` রাখার চেষ্টা করুন।\n\nউদাহরণ: `2 3 2 3 7` তালিকায় একক সংখ্যাটি `7`।",
    inputFormat:
      "প্রথম লাইনে সংখ্যার সংখ্যা `n`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।",
    outputFormat: "যে সংখ্যাটি ঠিক একবার এসেছে সেটি প্রিন্ট করুন।",
    constraints: "`1 <= n <= 100001` (সবসময় বিজোড়)\n`-10^9 <= a_i <= 10^9`",
    editorial:
      "### ধারণা\n\nXOR-এর দুটো বৈশিষ্ট্য এখানে কাজে লাগে: `a ^ a = 0` এবং `a ^ 0 = a`। তালিকার সব সংখ্যা পরপর XOR করলে যে সংখ্যাগুলো দুইবার আছে তারা নিজেদের সাথে মিলে শূন্য হয়ে যায়, আর থাকে শুধু একবার আসা সংখ্যাটা।\n\n### ধাপে ধাপে\n\n1. পুরো ইনপুট পড়ে একটা লিস্টে রাখুন।\n2. `result = 0` দিয়ে শুরু করুন।\n3. প্রতিটি সংখ্যার সাথে `result ^= value` চালান।\n4. শেষে `result` প্রিন্ট করুন — সেটাই একক সংখ্যা।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nresult = 0\nfor value in data[1:]:\n    result ^= value\nprint(result)\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n)` (এক বার ঘোরাই যথেষ্ট), অতিরিক্ত স্পেস `O(1)` — কোনো অতিরিক্ত ডেটা স্ট্রাকচার লাগে না।\n\n### সাধারণ ভুল\n\n- যোগফল বা গড় দিয়ে বের করা যায় না: জোড় সংখ্যাগুলোও যোগ হয়, তাই ফল আসে একক সংখ্যা + জোড় সংখ্যার যোগফল।\n- সাজিয়ে পাশাপাশি মিলিয়ে দেখলে `O(n log n)` সময় ও `O(n)` স্পেস লাগে — শর্ত পূরণ হয় না।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Bit Manipulation", "XOR", "Arrays"],
    tests: [
      { input: "5\n2 3 2 3 7\n", expectedOutput: "7\n", isSample: true },
      { input: "3\n-1 -1 5\n", expectedOutput: "5\n", isSample: true },
      { input: "1\n42\n", expectedOutput: "42\n", isSample: false },
      { input: "3\n5 1 5\n", expectedOutput: "1\n", isSample: false },
      { input: "5\n8 3 5 8 3\n", expectedOutput: "5\n", isSample: false },
      {
        input: "3\n1000000000 1000000000 -1000000000\n",
        expectedOutput: "-1000000000\n",
        isSample: false,
      },
      {
        input: nAndNumbers(
          SINGLE_NUMBER_MAX_VALUES.length,
          SINGLE_NUMBER_MAX_VALUES,
        ),
        expectedOutput: "1000000000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nresult = 0\nfor value in data[1:]:\n    result ^= value\nprint(result)\n",
  },
  {
    slug: "learn-m1-bitmask-subsets",
    title: "Bitmask Subset Sums",
    statement:
      "রাফি ও তানভীর ল্যাবের ছোট ছোট উপাদান নিয়ে কাজ করছে। তাদের জানা দরকার প্রতিটি সাবসেটের যোগফল কত, কিন্তু ক্রমটা ঠিক করা আছে।\n\n`n` সংখ্যক উপাদান দেওয়া থাকবে: `a[0], a[1], ..., a[n-1]`। এখন `mask = 0` থেকে `2^n - 1` পর্যন্ত প্রতিটি সংখ্যার জন্য ধরুন: `mask`-এর `i`-তম বিট 1 হলে `a[i]` সাবসেটে নেওয়া হয়েছে, 0 হলে নেওয়া হয়নি। প্রতিটি mask-এর subset sum বের করে, mask বাড়তিক্রমে (0, 1, 2, ..., 2^n - 1) সব ফল এক লাইনে স্পেস দিয়ে প্রিন্ট করুন। খালি সাবসেটও গুনতে হবে — তার যোগফল `0`।\n\nউদাহরণ: `n = 2`, `a = [5, 1]` হলে mask 0, 1, 2, 3-এর ফল যথাক্রমে `0`, `5`, `1`, `6` — উত্তর `0 5 1 6`।",
    inputFormat:
      "প্রথম লাইনে `n`। দ্বিতীয় লাইনে `n`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।",
    outputFormat:
      "`2^n`টি পূর্ণসংখ্যা এক লাইনে স্পেস দিয়ে, mask বাড়তিক্রমে। শেষে নতুন লাইন থাকলেও চলবে।",
    constraints: "`1 <= n <= 16`\n`-1000 <= a_i <= 1000`",
    editorial:
      "### ধারণা\n\n`n` টি উপাদান নিয়ে মোট `2^n`টা সাবসেট থাকে। একটা `n` বিটের mask দিয়ে সাবসেট লেখা যায়: `i`-তম বিট 1 হলে `a[i]` সাবসেটে আছে, 0 হলে নেই। `mask = 0` মানে খালি সাবসেট, `mask = 2^n - 1` মানে পুরো অ্যারে। mask ক্রমে ঘোরলেই চাওয়া ক্রম পাওয়া যায়।\n\n### ধাপে ধাপে\n\n1. `n` আর `a` পড়ে নিন।\n2. `mask = 0` থেকে `2^n - 1` পর্যন্ত লুপ চালান।\n3. প্রতিটি mask-এর জন্য `i = 0` থেকে `n - 1` পর্যন্ত যাচাই করুন: `mask & (1 << i)` শূন্য নয় হলে `a[i]` যোগ করুন।\n4. প্রতিটি ফল স্ট্রিং বানিয়ে স্পেস দিয়ে যোগ করুন, শেষে এক লাইনে প্রিন্ট করুন।\n\n```python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\nsums = []\nfor mask in range(1 << n):\n    total = 0\n    for i in range(n):\n        if mask & (1 << i):\n            total += a[i]\n    sums.append(str(total))\nprint(' '.join(sums))\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n * 2^n)`, স্পেস `O(2^n)` (আউটপুট ধরে)। `n = 16` হলে 65536 × 16 ≈ 10^6 কাজ, যা Python-এও সহজে চলে।\n\n### সাধারণ ভুল\n\n- ফলগুলো সাজিয়ে (sorted) দেওয়া — প্রশ্নে mask ক্রম চাওয়া হয়েছে, সাজানো ক্রম ভিন্ন ফল দেয়।\n- খালি সাবসেট বাদ দেওয়া বা `1 << i`-এর জায়গায় শুধু `i` বসিয়ে দেওয়া।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Bit Manipulation", "Bitmask", "Subsets"],
    tests: [
      { input: "2\n5 1\n", expectedOutput: "0 5 1 6\n", isSample: true },
      {
        input: "3\n1 2 3\n",
        expectedOutput: "0 1 2 3 3 4 5 6\n",
        isSample: true,
      },
      { input: "1\n42\n", expectedOutput: "0 42\n", isSample: false },
      { input: "2\n0 0\n", expectedOutput: "0 0 0 0\n", isSample: false },
      {
        input: "4\n-1 -2 3 4\n",
        expectedOutput: "0 -1 -2 -3 3 2 1 0 4 3 2 1 7 6 5 4\n",
        isSample: false,
      },
      {
        input: "4\n1 1 1 1\n",
        expectedOutput: "0 1 1 2 1 2 2 3 1 2 2 3 2 3 3 4\n",
        isSample: false,
      },
      {
        input: nAndNumbers(BITMASK_MAX_VALUES.length, BITMASK_MAX_VALUES),
        expectedOutput: spaceOutput(bitmaskSums(BITMASK_MAX_VALUES)),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\nsums = []\nfor mask in range(1 << n):\n    total = 0\n    for i in range(n):\n        if mask & (1 << i):\n            total += a[i]\n    sums.append(str(total))\nprint(' '.join(sums))\n",
  },
  {
    slug: "learn-m1-swap-xor",
    title: "Swap Two Numbers",
    statement:
      "সাদিয়া দুইটা ভ্যারিয়েবলের মান অদলবদল করার অনুশীলন করছেন — কোনো temporary variable ছাড়া। আপনাকে দুইটা পূর্ণসংখ্যা দেওয়া হবে; অদলবদল করে প্রথমটার জায়গায় দ্বিতীয়টা আর দ্বিতীয়টার জায়গায় প্রথমটা বসিয়ে দিন।\n\nউদাহরণ: `5 9` দিলে উত্তর `9 5`।",
    inputFormat: "এক লাইনে দুইটা পূর্ণসংখ্যা `a` ও `b`।",
    outputFormat: "এক লাইনে `b a` স্পেস দিয়ে প্রিন্ট করুন।",
    constraints: "`-10^9 <= a, b <= 10^9`",
    editorial:
      "### ধারণা\n\nXOR দিয়ে অদলবদলের কৌশল: `a ^= b`, তারপর `b ^= a`, শেষে `a ^= b`। প্রথম ধাপে `a` হয় `a ^ b`, দ্বিতীয় ধাপে `b = b ^ (a ^ b) = a`, আর শেষ ধাপে `a = (a ^ b) ^ a = b` — মান অদলবদল হয়ে যায়। Python-এ সহজভাবে `b, a = a, b` লিখলেই হয়, কিন্তু XOR-এর কাজ বোঝা দরকার।\n\n### ধাপে ধাপে\n\n1. `a` ও `b` পড়ে নিন।\n2. ক্রম উল্টিয়ে প্রিন্ট করুন: আগে `b`, পরে `a`।\n3. বিশেষ করে দেখুন `a == b` হলেও উত্তর ঠিক আছে কিনা।\n\n```python\nimport sys\na, b = map(int, sys.stdin.read().split())\nprint(b, a)\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(1)`, স্পেস `O(1)`।\n\n### সাধারণ ভুল\n\n- `a == b` হলে XOR swap আসলে ঠিকই কাজ করে; তবে পরপর তিন ধাপ না লিখে শুধু প্রথম ধাপ (`a ^= b`) লিখে থামলে মান হারিয়ে যায়।\n- প্রিন্ট করার ক্রম উল্টিয়ে ফেলা (`a b` লিখে দেওয়া) সবচেয়ে সাধারণ ভুল।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Bit Manipulation", "XOR"],
    tests: [
      { input: "5 9\n", expectedOutput: "9 5\n", isSample: true },
      { input: "0 7\n", expectedOutput: "7 0\n", isSample: true },
      { input: "-3 4\n", expectedOutput: "4 -3\n", isSample: false },
      { input: "6 6\n", expectedOutput: "6 6\n", isSample: false },
      { input: "1 0\n", expectedOutput: "0 1\n", isSample: false },
      {
        input: "1000000000 -1000000000\n",
        expectedOutput: "-1000000000 1000000000\n",
        isSample: false,
      },
      {
        input: "-1000000000 -1000000000\n",
        expectedOutput: "-1000000000 -1000000000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\na, b = map(int, sys.stdin.read().split())\nprint(b, a)\n",
  },
  {
    slug: "learn-m1-lowest-set-bit",
    title: "Lowest Set Bit Value",
    statement:
      "ক্যান্টিনের টোকেন মেশিন প্রতিটি সংখ্যাকে বাইনারি ফ্ল্যাগ হিসেবে দেখে। একটা পূর্ণসংখ্যা `n` দিলে তার সবচেয়ে ডানে (সবচেয়ে নিচু পজিশনে) অবস্থিত সক্রিয় বিটের মান বের করুন — ইনডেক্স নয়; সেই বিটটি যদি একা থাকত তাহলে সংখ্যাটা কত হতো।\n\nউদাহরণ: `12 = 1100` — নিচু দিকের প্রথম 1 বিট চতুর্থ পজিশনে (মান 4), তাই উত্তর `4`।",
    inputFormat: "একটি লাইনে একটি পূর্ণসংখ্যা `n`।",
    outputFormat: "সবচেয়ে নিচু সক্রিয় বিটের মান এক লাইনে প্রিন্ট করুন।",
    constraints: "`0 <= n <= 10^18`",
    editorial:
      "### ধারণা\n\nPython ও C++-তে ঋণাত্মক সংখ্যা two's complement হিসেবে রাখা হয়, তাই `-n = ~n + 1` হয়। এই সূত্র মেলে `n & -n` শুধু সবচেয়ে নিচু 1 বিটটা রেখে বাকি সব 0 করে দেয়। `12 = 01100` এবং `-12 = 10100` হলে AND ফল `00100 = 4`।\n\n### ধাপে ধাপে\n\n1. ইনপুট থেকে `n` নিন।\n2. `n & -n` করুন।\n3. ফলটি প্রিন্ট করুন — সেটিই নিচু বিটের মান।\n\n```python\nimport sys\nn = int(sys.stdin.readline())\nprint(n & -n)\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(1)`, স্পেস `O(1)` — একটি অপারেশনেই উত্তর আসে।\n\n### সাধারণ ভুল\n\n- মান নয় ইনডেক্স প্রিন্ট করা: `12`-এর সঠিক উত্তর `4`, `2` নয়।\n- `n & (n - 1)` দিয়ে নিচু বিট বের করা যায় না — সেটা উল্টোটা করে, অর্থাৎ নিচু বিট মুছে দেয়। `n = 0` হলে ফল `0`, যা প্রশ্নের সীমা অনুযায়ী সঠিক।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Bit Manipulation", "Two's Complement"],
    tests: [
      { input: "12\n", expectedOutput: "4\n", isSample: true },
      { input: "10\n", expectedOutput: "2\n", isSample: true },
      { input: "1\n", expectedOutput: "1\n", isSample: false },
      { input: "0\n", expectedOutput: "0\n", isSample: false },
      { input: "1024\n", expectedOutput: "1024\n", isSample: false },
      { input: "999999999999999999\n", expectedOutput: "1\n", isSample: false },
      {
        input: "576460752303423488\n",
        expectedOutput: "576460752303423488\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\nprint(n & -n)\n",
  },
];
