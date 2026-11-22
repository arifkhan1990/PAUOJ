import type { SeedProblem } from "../../seed-problems";
import { RECURSION_BACKTRACKING_EXTRA_PROBLEMS } from "./recursion-backtracking-extra-problems";

export const RECURSION_BACKTRACKING_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m3-recursion-backtracking-g1",
    title: "Digit Sum with Recursion",
    statement: `রফি লাইব্রেরির সদস্য কার্ডের নম্বর দেখে সেটার সব ডিজিট যোগ করে একটা ছোট চেক কোড বের করছে — কার্ড নম্বর যত বড় হোক, ডিজিটগুলোর যোগফলই চাই। এটা রিকার্সন দিয়ে করো: প্রথম ডিজিট ধরে বাকি অংশের সমাধান ডাকো, খালি হলে শূন্য ফেরান।

উদাহরণ: \`12345\` হলে \`1 + 2 + 3 + 4 + 5 = 15\`; \`0\` হলে \`0\`।`,
    inputFormat: `এক লাইনে একটা অ-ঋণাত্মক পূর্ণসংখ্যা (শূন্য বা তার বেশি), শুরুতে শূন্য নেই।`,
    outputFormat: `সব ডিজিটের যোগফল এক লাইনে।`,
    constraints: `সংখ্যাটির দৈর্ঘ্য \`1\` থেকে \`1000\` ডিজিট; প্রতিটি ডিজিট \`0-9\`।`,
    editorial: `## ধারণা
রিকার্সনের ছোট প্রশ্ন হলো "এই স্ট্রিংটার ডিজিট যোগ কত?" এবং base case হলো স্ট্রিং খালি — তখন যোগফল \`0\`। পুরোটা এক লাইনে: প্রথম অক্ষরের মান + বাকি অংশের উত্তর। লুপ না লিখেও সমস্যাটা এভাবেই ভাঙা যায় — আর এটাই পরবর্তী সব রিকার্সন সমস্যার ছাঁচ।

## ধাপে ধাপে
1. এক লাইনে পুরো ইনপুট পড়ে নতুনলাইন বাদ দাও (\`strip()\`)।
2. ফাংশন লেখো \`digit_sum(text)\`: \`text\` খালি হলে \`0\` ফেরাও (base case)।
3. নাহলে \`int(text[0]) + digit_sum(text[1:])\` ফেরাও — প্রথম ডিজিট + বাকির উত্তর।
4. দৈর্ঘ্য ১০০০ পর্যন্ত হওয়ায় recursion সীমা বাড়িয়ে দাও।
5. ফল ছাপাও।

\`\`\`python
import sys
sys.setrecursionlimit(10000)
s = sys.stdin.readline().strip()
def digit_sum(text):
    if not text:
        return 0
    return int(text[0]) + digit_sum(text[1:])
print(digit_sum(s))
\`\`\`

## কমপ্লেক্সিটি
সময় ও মেমোরি দৈর্ঘ্যের সমানুপাতিক — প্রতি ধাপে এক অক্ষর কমে (\`O(len^2)\` কপি, দৈর্ঘ্য ১০০০-এ তুচ্ছ), recursion depth \`O(len)\`।

## সাধারণ ভুল
- Base case না লিখলে খালি স্ট্রিং-এ \`text[0]\` নিয়ে \`IndexError\`; রিকার্সন কখনো থামে না।
- \`int(text)\` দিয়ে পুরো অংশ ধরে নিলে দৈর্ঘ্য ১০০০-এ Python বিরাট সংখ্যা বানাতে পারে কিন্তু কাজের অর্থই বদলে যায় — ডিজিট আলাদা করতে হবে।
- \`sys.setrecursionlimit\` না দিলে দৈর্ঘ্য ১০০০-এ ডিফল্ট সীমা ১০০০ পেরোতে পারে, \`RecursionError\` আসে।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Recursion", "Implementation"],
    tests: [
      { input: "12345\n", expectedOutput: "15\n", isSample: true },
      { input: "0\n", expectedOutput: "0\n", isSample: true },
      { input: "9999999999\n", expectedOutput: "90\n", isSample: false },
      { input: "1000000000000\n", expectedOutput: "1\n", isSample: false },
      { input: `${"9".repeat(1000)}\n`, expectedOutput: "9000\n", isSample: false },
    ],
    referencePython:
      "import sys\nsys.setrecursionlimit(10000)\ns = sys.stdin.readline().strip()\ndef digit_sum(text):\n    if not text:\n        return 0\n    return int(text[0]) + digit_sum(text[1:])\nprint(digit_sum(s))\n",
  },
  {
    slug: "learn-m3-recursion-backtracking-g2",
    title: "Count Subsets with Sum K",
    statement: `ক্লাবের কাস্টমার ফেস্টে \`n\` প্যাকেটে টাকা আছে, তানভির চায় একটা টেবিলে ঠিক \`K\` টাকা বসবে এমন প্যাকেটের সেট কতভাবে হতে পারে সেটা গোনুন। প্রতিটি প্যাকেট নেওয়া যাবে বা বাদ যাবে; কোনো প্যাকেট অর্ধেক নেওয়া যাবে না। একটাও না নিলে যোগফল শূন্য — তাই শূন্যও একটা সেট।

উদাহরণ: \`1 2 3 4 5\` আর \`K = 5\` হলে \`{5}\`, \`{1,4}\`, \`{2,3}\` — উত্তর \`3\`।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`K\`; দ্বিতীয় লাইনে \`n\`টি অ-ঋণাত্মক পূর্ণসংখ্যা।`,
    outputFormat: `যোগফল হুবহু \`K\` এমন সাবসেটের সংখ্যা।`,
    constraints: `\`1 <= n <= 20\`, \`0 <= value <= 1000\`, \`0 <= K <= 20000\`।`,
    editorial: `## ধারণা
প্রতিটি প্যাকেটের জন্য দুটোই সিদ্ধান্ত সম্ভব — নেওয়া বা না নেওয়া। রিকার্সনের প্রতিটি লেভেলে একটা করে প্যাকেট ঠিক হয়ে যায়, তাই পুরো ট্রির উচ্চতা \`n\` আর পাতা সর্বোচ্চ \`2^n\` — \`n <= 20\` হওয়ায় চলে। \`remaining\` (বাকি কত দরকার) কে হাতে পাঠানোই অবস্থা; এটা ঋণাত্মক হলে সেই শাখা আর ঘুরার দরকার নেই — এটাই প্রথম pruning।

## ধাপে ধাপে
1. \`n\`, \`K\` আর সব মান পড়ো।
2. \`count(i, remaining)\` লেখো: \`i\` পর্যন্ত ঠিক হয়ে গেছে, আর \`remaining\` টাকা দরকার।
3. \`remaining < 0\` হলে \`0\` ফেরাও; \`i == n\` হলে \`remaining == 0\` হলে \`1\`, নাহলে \`0\`।
4. নাহলে "প্রথম প্যাকেট নেওয়া" + "না নেওয়া" — দুই কলের যোগফল ফেরাও।
5. \`count(0, K)\` ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, k = data[0], data[1]
a = data[2:]
def count(i, remaining):
    if remaining < 0:
        return 0
    if i == n:
        return 1 if remaining == 0 else 0
    take = count(i + 1, remaining - a[i])
    skip = count(i + 1, remaining)
    return take + skip
print(count(0, k))
\`\`\`

## কমপ্লেক্সিটি
সময় সর্বোচ্চ \`O(2^n)\` (\`n = 20\`-এ প্রায় দশ লাখ কল), মেমোরি \`O(n)\` — recursion depth মাত্র \`n\`। চাইলে memo দিলে \`O(n * K)\`-এ নামে।

## সাধারণ ভুল
- \`remaining\` না ধরে শুধু ইনডেক্স ঘুরালে জোড়া মিলিয়ে দেখার কোনো উপায় থাকে না — লক্ষ্যের টাকা বাকি কত সেটা হাতে পাঠাতে হবে।
- নেওয়ার আগেই কাউন্ট বাড়িয়ে দিলে শাখা ধরার আগেই উত্তর চলে যায় — উত্তর মিলিয়ে নিতে \`i == n\`-এ গিয়ে গোনুন।
- ঋণাত্মক মান ধরে নিলে "শূন্য হলেই ঠিক" ভাঙে; এখানে মান অ-ঋণাত্মক বলে \`remaining < 0\` কাটা নিরাপদ।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Recursion", "Backtracking", "Subsets"],
    tests: [
      { input: "5 5\n1 2 3 4 5\n", expectedOutput: "3\n", isSample: true },
      { input: "3 10\n1 2 3\n", expectedOutput: "0\n", isSample: true },
      { input: "4 0\n0 1 2 3\n", expectedOutput: "2\n", isSample: false },
      { input: "1 1\n1\n", expectedOutput: "1\n", isSample: false },
      { input: "6 3\n1 1 1 1 1 1\n", expectedOutput: "20\n", isSample: false },
      {
        input: `20 0\n${Array(20).fill(0).join(" ")}\n`,
        expectedOutput: "1048576\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, k = data[0], data[1]\na = data[2:]\ndef count(i, remaining):\n    if remaining < 0:\n        return 0\n    if i == n:\n        return 1 if remaining == 0 else 0\n    take = count(i + 1, remaining - a[i])\n    skip = count(i + 1, remaining)\n    return take + skip\nprint(count(0, k))\n",
  },
  {
    slug: "learn-m3-recursion-backtracking-e1",
    title: "Tower of Hanoi Moves",
    statement: `পদার্থবিজ্ঞান ল্যাবের ডেমোতে তিনটা ছাঁকুনি আর বিভিন্ন আকারের \`n\`টা চাকা আছে — সবগুলো প্রথম ছাঁকুনি থেকে তৃতীয়ে নিতে হবে, নিয়ম: একবারে একটা চাকা নেওয়া যাবে, আর বড় চাকার উপরে ছোট চাকা বসানো যাবে না। ন্যূনতম কতবার সরাতে হবে সেটা বের করো।

উদাহরণ: \`n = 3\` হলে উত্তর \`7\`।`,
    inputFormat: `এক লাইনে একটা পূর্ণসংখ্যা \`n\`।`,
    outputFormat: `ন্যূনতম চাকা সরানোর সংখ্যা।`,
    constraints: `\`1 <= n <= 60\`; উত্তর 64-বিট পূর্ণসংখ্যায় ফিট করে।`,
    editorial: `## ধারণা
ক্লাসিক রিকার্সন: \`n\` চাকা সরাতে আগে \`n - 1\` চাকা আরেক ছাঁকুনিতে নিতে হয় (১ ধাপ), তারপর সবচেয়ে বড়টা তৃতীয় ছাঁকুনিতে নিতে হয় (১ ধাপ), তারপর সেই \`n - 1\` চাকা আবার উপরে বসাতে হয় (আরেক ধাপ)। সূত্র: \`moves(n) = 2 * moves(n - 1) + 1\`, \`moves(1) = 1\` — ফলে \`moves(n) = 2^n - 1\`। রিকার্সন লিখলে সূত্র মুখস্থ না করেও উত্তর আসে, আর \`n = 60\`-এ সংখ্যাটা বিশাল (≈ ১১ কোটি কোটি), তাই ৬০-এর বেশি যাবে না।

## ধাপে ধাপে
1. \`n\` পড়ো।
2. \`moves(k)\` লেখো: \`k == 0\` হলে \`0\` ফেরাও, নাহলে \`2 * moves(k - 1) + 1\`।
3. Depth মাত্র \`n\` (≤ ৬০), তাই বিশেষ কিছু লাগবে না; ফল ছাপাও।

\`\`\`python
import sys
sys.setrecursionlimit(10000)
n = int(sys.stdin.readline())
def moves(k):
    if k == 0:
        return 0
    return 2 * moves(k - 1) + 1
print(moves(n))
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\` — প্রতি ধাপে একটা করে কল; মেমোরি \`O(n)\` recursion depth। আসল চাকা সরানোর ধাপ \`2^n - 1\`, তাই বড় \`n\`-এ সেটা সম্ভব নয় — আমরা শুধু সংখ্যাটাই গুনছি।

## সাধারণ ভুল
- \`2 ** n - 1\` লিখে দিলেও উত্তর ঠিক, কিন্তু শিক্ষার উদ্দেশ্য রিকার্সনের সূত্র বোঝা — এবং \`n\` যদি আরও জটিল হতো, তখন সূত্র কাজে লাগত না।
- \`moves(1) = 0\` ধরলে সব উত্তর এক কমে যায় — একটা চাকাও তো একবার সরাতেই হয়।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Recursion", "Math"],
    tests: [
      { input: "3\n", expectedOutput: "7\n", isSample: true },
      { input: "1\n", expectedOutput: "1\n", isSample: true },
      { input: "2\n", expectedOutput: "3\n", isSample: false },
      { input: "10\n", expectedOutput: "1023\n", isSample: false },
      { input: "40\n", expectedOutput: "1099511627775\n", isSample: false },
      { input: "60\n", expectedOutput: "1152921504606846975\n", isSample: false },
    ],
    referencePython:
      "import sys\nsys.setrecursionlimit(10000)\nn = int(sys.stdin.readline())\ndef moves(k):\n    if k == 0:\n        return 0\n    return 2 * moves(k - 1) + 1\nprint(moves(n))\n",
  },
  {
    slug: "learn-m3-recursion-backtracking-m1",
    title: "N-Queens Arrangements",
    statement: `কোডিং ক্লাবের দেয়ালে \`n x n\` চেস বোর্ডের ছবি — সাদিয়া চায় \`n\`টা রানী বসাবে যাতে কোনো রানী অন্য কোনো রানীকে আক্রমণ না করে। রানী একই সারি, কলাম বা ডায়াগোনালে থাকলে আক্রমণ করে (দূরত্ব যাই হোক)। কতভাবে বসানো যায় সেই সংখ্যাটা বের করো।

উদাহরণ: \`n = 4\` হলে ঠিক \`2\` ভাবে বসানো যায়।`,
    inputFormat: `এক লাইনে একটা পূর্ণসংখ্যা \`n\`।`,
    outputFormat: `বৈধ বিন্যাসের সংখ্যা।`,
    constraints: `\`1 <= n <= 13\`।`,
    editorial: `## ধারণা
এক রো করে রানী বসাই — প্রতি রো-তে ঠিক একটা, তাই রো সমস্যা থেকেই মুক্ত। প্রতিটি কলাম একবারই ব্যবহার হতে পারে, আর দুই ধরনের ডায়াগোনালেও বাধা। সবগুলো একসাথে ধরার সবচেয়ে সাশ্রয়ী উপায় বিটমাস্ক: \`cols\` বিট দেখায় কোন কলাম ব্যস্ত, \`d1\`, \`d2\` দুই ডায়াগোনালের ব্যস্ত ঘর। নতুন রানী বসানোর জায়গা \`~(cols | d1 | d2)\`-এর ফাঁকা বিট থেকে এক এক করে বের করা যায়, আর বসানোর পর ডায়াগোনালগুলো সরে যায় (\`<< 1\`, \`>> 1\`) — ফিরে এসে বিট বাদ দিলেই অবস্থা আগের মতো ফিরে আসে, আলাদা undo লাগে না। এই pruning ছাড়া \`n = 13\` অসম্ভব দ্রুত হতো না।

## ধাপে ধাপে
1. \`n\` পড়ে গণনার জন্য গ্লোবাল \`count\` রাখো।
2. \`place(row, cols, d1, d2)\` লেখো: \`row == n\` হলে একটা সম্পূর্ণ বিন্যাস পাওয়া গেছে, \`count\` বাড়াও।
3. ফাঁকা ঘরগুলোর মাস্ক বানাও: \`~(cols | d1 | d2) & ((1 << n) - 1)\`।
4. প্রতিটি ফাঁকা বিটের জন্য: বিটটা বসাও, কলাম ও ডায়াগোনাল আপডেট করে পরের রো-তে যাও।
5. লুপ শেষ হলেই সেই রো-র সব পছন্দ ঘুরে ফেলা হয়ে গেল — বিট আগের মতোই থাকে।
6. শেষে \`count\` ছাপাও।

\`\`\`python
import sys
n = int(sys.stdin.readline())
count = 0
def place(row, cols, d1, d2):
    global count
    if row == n:
        count += 1
        return
    available = ~(cols | d1 | d2) & ((1 << n) - 1)
    while available:
        bit = available & -available
        available ^= bit
        place(row + 1, cols | bit, (d1 | bit) << 1, (d2 | bit) >> 1)
place(0, 0, 0, 0)
print(count)
\`\`\`

## কমপ্লেক্সিটি
সময় আদর্শ অবস্থায় অনেক কম \`n!\`-এর চেয়ে; \`n = 13\`-এ Python-এ কয়েক সেকেন্ড। মেমোরি \`O(n)\` recursion depth। উত্তরগুলো (নমুনা): \`n = 8\` হলে \`92\`, \`n = 13\` হলে \`73712\`।

## সাধারণ ভুল
- শুধু কলাম আর সারি যাচাই করে ডায়াগোনাল বাদ দেওয়া — ফলে বেশি উত্তর আসে।
- \`row\` না বাড়িয়ে একই রো-তে আবার চেষ্টা করা, বা base case-এ \`count\` না বাড়িয়ে \`return\` দেওয়া — উত্তর শূন্য হয়।
- ডায়াগোনাল শিফটের সময় মাস্ক করা না হলে বিট বাইরে চলে গিয়ে ভুল ঘর ব্যস্ত দেখায় — তাই \`& ((1 << n) - 1)\` জরুরি।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 4000,
    memoryLimitMb: 256,
    tags: ["Backtracking", "Bitmask", "Recursion"],
    tests: [
      { input: "4\n", expectedOutput: "2\n", isSample: true },
      { input: "1\n", expectedOutput: "1\n", isSample: true },
      { input: "2\n", expectedOutput: "0\n", isSample: false },
      { input: "8\n", expectedOutput: "92\n", isSample: false },
      { input: "12\n", expectedOutput: "14200\n", isSample: false },
      { input: "13\n", expectedOutput: "73712\n", isSample: false },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\ncount = 0\ndef place(row, cols, d1, d2):\n    global count\n    if row == n:\n        count += 1\n        return\n    available = ~(cols | d1 | d2) & ((1 << n) - 1)\n    while available:\n        bit = available & -available\n        available ^= bit\n        place(row + 1, cols | bit, (d1 | bit) << 1, (d2 | bit) >> 1)\nplace(0, 0, 0, 0)\nprint(count)\n",
  },
  {
    slug: "learn-m3-recursion-backtracking-h1",
    title: "Palindrome Cut Count",
    statement: `উৎসবের মঞ্চে ব্যানারে একটা শব্দ ছাপা আছে। সাদিয়া চায় শব্দটাকে টুকরো করে প্রতিটি টুকরো একটা প্যালিনড্রোম হবে — এগুলো আলাদা স্টিকারে লেগে যাবে। কয়েকভাবে কাটা যায় সেই সংখ্যাটা বের করো। কাট না করে পুরো শব্দটাও একটা ভাগ হতে পারে।

উদাহরণ: \`aab\` হলে \`aa|b\` আর \`a|a|b\` — উত্তর \`2\` (\`a|ab\` বা \`aab\` নয়, কারণ \`ab\`/ \`aab\` প্যালিনড্রোম নয়)।`,
    inputFormat: `এক লাইনে একটা স্ট্রিং \`s\` (ছোট হাতের ইংরেজি অক্ষর)।`,
    outputFormat: `প্যালিনড্রোম টুকরোতে ভাগের মোট পদ্ধতির সংখ্যা।`,
    constraints: `\`1 <= |s| <= 40\`; উত্তর 64-বিট পূর্ণসংখ্যায় ফিট করে।`,
    editorial: `## ধারণা
বাঁ থেকে প্রথম কাটটা কোথায় দেবে সেটাই রিকার্সনের প্রতিটি সিদ্ধান্ত: \`s[i:j]\` যদি প্যালিনড্রোম হয়, তাহলে সেই অংশটা এক টুকরো ধরে \`j\` থেকে বাকি অংশ ঘুরে দেখো। উত্তর হবে সব সম্ভব \`j\`-এর জন্য বাকি অংশের উত্তরের যোগফল; বাকি অংশ খালি হলে এটা একটাই বৈধ ভাগ — সেটাই base case \`1\`। স্ট্রিংয়ের প্রতিটি অবস্থান ও দৈর্ঘ্য সীমিত হওয়ায় memo (কোন অবস্থা থেকে কত উত্তর) দিলে একই অবস্থা বারবার হিসাব করতে হয় না — \`|s| = 40\`-এও মুহূর্তে চলে।

## ধাপে ধাপে
1. \`s\` পড়ে \`n\` ধরো।
2. \`ways(i)\` লেখো: \`i\` থেকে শেষ পর্যন্ত কাটার পদ্ধতি সংখ্যা।
3. \`i == n\` হলে \`1\` ফেরাও — খালি অংশের জন্য ঠিক একটাই ভাগ।
4. \`j = i + 1 .. n\` লুপ: \`s[i:j]\` প্যালিনড্রোম হলে \`ways(j)\` যোগ করো।
5. \`ways(0)\` ছাপাও; ফল বড় হবে (৪০ অক্ষরে সর্বোচ্চ \`2^39\`)।

\`\`\`python
import sys
from functools import lru_cache
s = sys.stdin.readline().strip()
n = len(s)
@lru_cache(maxsize=None)
def ways(i):
    if i == n:
        return 1
    total = 0
    for j in range(i + 1, n + 1):
        piece = s[i:j]
        if piece == piece[::-1]:
            total += ways(j)
    return total
print(ways(0))
\`\`\`

## কমপ্লেক্সিটি
সময় সর্বোচ্চ \`O(n^2)\` অবস্থা × প্রতি অবস্থায় \`O(n)\` প্যালিনড্রোম যাচাই \`O(n)\` → প্রায় \`O(n^3)\`; মেমোরি \`O(n)\`। সব অক্ষর এক হলে উত্তর \`2^(n-1)\` — প্রতিটি অক্ষরের পরে কাট বা না কাটা যায়।

## সাধারণ ভুল
- Base case \`1\` না দিয়ে \`0\` দিলে শেষ পর্যন্ত পৌঁছানো ভাগগুলোই বাদ পড়ে, উত্তর শূন্য হয়।
- কাট না করে পুরো স্ট্রিং প্যালিনড্রোম কিনা একবার যাচাই করে থামে দেওয়া — ভুল, মাঝখানে কাটাও তো সম্ভব।
- \`piece == piece[::-1]\` এর জায়গায় শুধু প্রথম-শেষ অক্ষর মিলিয়ে দেখা — মাঝের অক্ষর বাদ পড়ে।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Backtracking", "Recursion", "Palindromes", "Memoization"],
    tests: [
      { input: "aab\n", expectedOutput: "2\n", isSample: true },
      { input: "abc\n", expectedOutput: "1\n", isSample: true },
      { input: "aaa\n", expectedOutput: "4\n", isSample: false },
      { input: "a\n", expectedOutput: "1\n", isSample: false },
      { input: "abba\n", expectedOutput: "3\n", isSample: false },
      { input: `${"a".repeat(40)}\n`, expectedOutput: "549755813888\n", isSample: false },
    ],
    referencePython:
      "import sys\nfrom functools import lru_cache\ns = sys.stdin.readline().strip()\nn = len(s)\n@lru_cache(maxsize=None)\ndef ways(i):\n    if i == n:\n        return 1\n    total = 0\n    for j in range(i + 1, n + 1):\n        piece = s[i:j]\n        if piece == piece[::-1]:\n            total += ways(j)\n    return total\nprint(ways(0))\n",
  },
  ...RECURSION_BACKTRACKING_EXTRA_PROBLEMS,
];
