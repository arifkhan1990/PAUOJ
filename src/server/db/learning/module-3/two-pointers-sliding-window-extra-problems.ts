import type { SeedProblem } from "../../seed-problems";
import { numbersInput, spaceOutput } from "../generated-tests";

export const TWO_POINTERS_SLIDING_WINDOW_EXTRA_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m3-two-pointers-sliding-window-x1",
    title: "Pair Sum Closest to Target",
    statement: `ক্লাবের দোকানে সাদিয়া চায় দুটো আইটেমের মোট দাম \`T\`-এর যত সম্ভব কাছে হোক। সব জোড়ার মধ্যে \`|মোট - T|\` সবচেয়ে কম কত — সেই পার্থক্যটা বের করো। সব দাম আলাদা।

উদাহরণ: \`2 4\` আর \`T = 5\` হলে জোড়ার মোট \`6\`, পার্থক্য \`1\`।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`T\`; দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা (আলাদা মান)।`,
    outputFormat: `সব জোড়ার মধ্যে \`|sum - T|\` এর ন্যূনতম মান।`,
    constraints: `\`2 <= n <= 200000\`, \`-10^9 <= value, T <= 10^9\`
সব মান আলাদা, উত্তর 64-বিটে ফিট করে।`,
    editorial: `## ধারণা
যোগফল \`T\` হুবহু না হলেও দুই পয়েন্টারকে টেনে \`T\`-এর কাছে নেওয়া যায়। সর্ট করে \`l\`, \`r\` রেখে প্রতিবার \`s = a[l] + a[r]\` মেপে \`best = min(best, abs(s - T))\` রাখি। \`s < T\` হলে যোগফল বাড়াতে \`l\` এগানোই উচিত, আর \`s > T\` হলে \`r\` কমানো — দুই দিকেই পয়েন্টার কখনো পেছনে যায় না, তাই সেরা জোড়াটা চোখে পড়ার আগেই পাশ কাটে। মান আলাদা হলেও যোগফল হুবহু \`T\` হতে পারে — তখন \`best\` শূন্য হয়ে যায়, আর তার চেয়ে ভালো উত্তর নেই।

## ধাপে ধাপে
1. অ্যারে \`sort\` করে \`l = 0\`, \`r = n - 1\` বসাও, \`best\` একটা বড় মান দিয়ে শুরু করো।
2. \`l < r\` পর্যন্ত: \`s = a[l] + a[r]\`, তারপর \`best\` আপডেট করো।
3. \`s < T\` হলে \`l += 1\`, নাহলে \`r -= 1\` (\`s == T\` হলেও থামার দরকার নেই, কিন্তু থামালেও হয়)।
4. লুপ শেষে \`best\` ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, t = data[0], data[1]
a = sorted(data[2:])
l, r = 0, n - 1
best = 10**18
while l < r:
    s = a[l] + a[r]
    diff = s - t
    if diff < 0:
        diff = -diff
    if diff < best:
        best = diff
    if s < t:
        l += 1
    else:
        r -= 1
print(best)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n log n)\` (সর্ট), লুপ \`O(n)\`; মেমোরি \`O(n)\`।

## সাধারণ ভুল
- \`best\` শুরুতে \`0\` রাখলে উত্তর সবসময় শূন্য ছাপে — বড় মান দিয়ে শুরু করো বা \`10**18\`।
- \`s < T\` হলে \`r\` সরানো (বা উল্টো) — দিক ভুল হলে সেরা জোড়া পাশ কাটিয়ে যায়।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Two Pointers", "Sorting"],
    tests: [
      { input: "5 10\n1 4 6 9 3\n", expectedOutput: "0\n", isSample: true },
      { input: "3 100\n1 2 3\n", expectedOutput: "95\n", isSample: true },
      { input: "4 0\n1 2 3 4\n", expectedOutput: "3\n", isSample: false },
      { input: "2 5\n2 4\n", expectedOutput: "1\n", isSample: false },
      { input: "4 0\n-5 5 -2 2\n", expectedOutput: "0\n", isSample: false },
      {
        input: `200000 2\n${Array.from({ length: 200000 }, (_, i) => i + 1).join(" ")}\n`,
        expectedOutput: "1\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, t = data[0], data[1]\na = sorted(data[2:])\nl, r = 0, n - 1\nbest = 10**18\nwhile l < r:\n    s = a[l] + a[r]\n    diff = s - t\n    if diff < 0:\n        diff = -diff\n    if diff < best:\n        best = diff\n    if s < t:\n        l += 1\n    else:\n        r -= 1\nprint(best)\n",
  },
  {
    slug: "learn-m3-two-pointers-sliding-window-x2",
    title: "Widest Stall Pair",
    statement: `উৎসবের মঞ্চে সাদিয়া দুটো পিলারের মাঝে জলের ট্যাঙ্ক বসাচ্ছে। পিলার \`i\` আর \`j\` (\`i < j\`) নিলে ট্যাঙ্কের চওড়া হবে \`j - i\`, উচ্চতা হবে ছোট পিলারটার উচ্চতা — ধারণক্ষমতা হিসেব হয় \`min(h[i], h[j]) * (j - i)\`। কোন দুটো পিলার বাছলে ধারণক্ষমতা সবচেয়ে বেশি হবে?

উদাহরণ: \`1 8 6 2\` হলে দ্বিতীয় আর তৃতীয় পিলার: \`min(8, 6) * 1 = 6\` — উত্তর \`6\`।`,
    inputFormat: `প্রথম লাইনে \`n\`; দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা — পিলারের উচ্চতা।`,
    outputFormat: `সর্বোচ্চ ধারণক্ষমতা এক লাইনে।`,
    constraints: `\`2 <= n <= 200000\`, \`1 <= height <= 10^9\`
ফল 64-বিটে ফিট করে।`,
    editorial: `## ধারণা
সব জোড়া ধরলে \`O(n^2)\` — কিন্তু দুই পয়েন্টার দিয়ে \`O(n)\`-এ চলে। ভাবো: বাঁয়ের পিলারটা ছোট উচ্চতার হলে অন্য পিলার যতই ডানে থাকুক, ট্যাঙ্কের উচ্চতা সেই ছোটটাই থাকবে — আর বাঁয়ের পয়েন্টার না সরালে চওড়া আর বাড়বে না। তাই ছোট পিলারটার পয়েন্টারই সামনে সরাও। চওড়া বাড়ানোর সুযোগ যখন শেষ হয়ে যায় (দুটোই মাঝখানে), তখন লুপ থামে।

## ধাপে ধাপে
1. \`n\` আর উচ্চতা পড়ে \`l = 0\`, \`r = n - 1\` বসাও, \`best = 0\`।
2. \`l < r\` পর্যন্ত \`area = min(h[l], h[r]) * (r - l)\` বের করে \`best\` আপডেট করো।
3. \`h[l] < h[r]\` হলে \`l += 1\`, নাহলে \`r -= 1\` — ছোট পাশটাই সামনে সরাও।
4. শেষে \`best\` ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
h = data[1:]
l, r = 0, n - 1
best = 0
while l < r:
    area = h[l] if h[l] < h[r] else h[r]
    area *= r - l
    if area > best:
        best = area
    if h[l] < h[r]:
        l += 1
    else:
        r -= 1
print(best)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\` — একটা পয়েন্টার প্রতি ধাপে এক ধাপ সরে; মেমোরি \`O(1)\`। উচ্চতা \`1\` থেকে \`n\` ক্রমে থাকলে উত্তর \`n^2 / 4\` আকারে আসে।

## সাধারণ ভুল
- ছোট পয়েন্টার না সরিয়ে বড়টা সরানো — চওড়া কমে যায়, ভালো সমাধান পাশ কাটে।
- \`min\` এর বদলে যেকোনো একটা উচ্চতা ধরে হিসাব করলে নিচু পিলারের ক্ষেত্রে ধারণক্ষমতা বেশি দেখায় — ছোটটাই সীমাবদ্ধ করে।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Two Pointers", "Greedy"],
    tests: [
      { input: "4\n1 8 6 2\n", expectedOutput: "6\n", isSample: true },
      { input: "2\n5 5\n", expectedOutput: "5\n", isSample: true },
      { input: "3\n1 2 3\n", expectedOutput: "2\n", isSample: false },
      { input: "3\n3 2 1\n", expectedOutput: "2\n", isSample: false },
      { input: "5\n5 5 5 5 5\n", expectedOutput: "20\n", isSample: false },
      {
        input: numbersInput(Array.from({ length: 200000 }, (_, i) => i + 1)),
        expectedOutput: spaceOutput([10000000000]),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nh = data[1:]\nl, r = 0, n - 1\nbest = 0\nwhile l < r:\n    area = h[l] if h[l] < h[r] else h[r]\n    area *= r - l\n    if area > best:\n        best = area\n    if h[l] < h[r]:\n        l += 1\n    else:\n        r -= 1\nprint(best)\n",
  }
];
