import type { SeedProblem } from "../../seed-problems";

export const RECURSION_BACKTRACKING_EXTRA_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m3-recursion-backtracking-x1",
    title: "Ways to Climb the Stairs",
    statement: `হোস্টেলের সিঁড়িতে তানভির প্রতি ধাপে এক বা দুই ধাপ এগোতে পারে। \`n\` ধাপে উপরে পৌঁছানোর কতভাবে সম্ভব সেটা গোনো — ধাপের ক্রম আলাদা হলে ভিন্ন পদ্ধতি।

উদাহরণ: \`n = 3\` হলে \`1+1+1\`, \`1+2\`, \`2+1\` — উত্তর \`3\`।`,
    inputFormat: `এক লাইনে একটা পূর্ণসংখ্যা \`n\`।`,
    outputFormat: `উপরে ওঠার পদ্ধতির সংখ্যা।`,
    constraints: `\`1 <= n <= 90\`; উত্তর 64-বিট পূর্ণসংখ্যায় ফিট করে।`,
    editorial: `## ধারণা
শেষের ধাপটা কোনভাবেই হোক, সে আগে এক ধাপ এসেছে বা দুই ধাপ। তাই \`ways(n) = ways(n - 1) + ways(n - 2)\` — এটাই ফিবোনাচি সূত্রের রিকার্সন রূপ। Base case: \`k <= 1\` হলে \`1\` — এক ধাপে একভাবেই; বাকি সব \`ways(k) = ways(k - 1) + ways(k - 2)\` (\`ways(2) = 2\`, কারণ \`1+1\` বা \`2\`)। শুধু রিকার্সন দিলে \`n = 90\`-এ একই অবস্থা বারবার হিসাব হবে — memo থাকলে প্রতিটি \`k\` একবারই হিসাব হয়, \`O(n)\` সময়ে শেষ।

## ধাপে ধাপে
1. \`n\` পড়ো।
2. \`ways(k)\` লেখো, memo সহ: \`k <= 1\` হলে \`1\` ফেরাও।
3. নাহলে \`ways(k - 1) + ways(k - 2)\` ফেরাও।
4. \`ways(n)\` ছাপাও — \`n = 90\`-এ সংখ্যাটা ১৯ অঙ্কের, Python নিজেই ৬৪-বিটের বাইরেও ঠিক রাখে।

\`\`\`python
import sys
from functools import lru_cache
sys.setrecursionlimit(10000)
n = int(sys.stdin.readline())
@lru_cache(maxsize=None)
def ways(k):
    if k <= 1:
        return 1
    return ways(k - 1) + ways(k - 2)
print(ways(n))
\`\`\`

## কমপ্লেক্সিটি
সময় ও মেমোরি \`O(n)\` (memo-তে সর্বোচ্চ \`n + 1\`টা অবস্থা); memo ছাড়া সময় \`O(2^n)\` — \`n = 90\`-এ চলবেই না।

## সাধারণ ভুল
- \`ways(0) = 0\` ধরলে শেষ ধাপ দুই-ধাপ থেকে এলে পথ বাদ পড়ে; কোডে \`k <= 1\` হলে \`1\` ফেরানো হয়েছে — \`n >= 1\` তাই এটাই নিরাপদ।
- Memo না দিয়ে শুধু রিকার্সন — \`n = 40\`-এও অনেক দেরি লাগে, \`n = 90\` অসম্ভব।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Recursion", "Memoization", "Math"],
    tests: [
      { input: "3\n", expectedOutput: "3\n", isSample: true },
      { input: "1\n", expectedOutput: "1\n", isSample: true },
      { input: "2\n", expectedOutput: "2\n", isSample: false },
      { input: "10\n", expectedOutput: "89\n", isSample: false },
      { input: "40\n", expectedOutput: "165580141\n", isSample: false },
      { input: "90\n", expectedOutput: "4660046610375530309\n", isSample: false },
    ],
    referencePython:
      "import sys\nfrom functools import lru_cache\nsys.setrecursionlimit(10000)\nn = int(sys.stdin.readline())\n@lru_cache(maxsize=None)\ndef ways(k):\n    if k <= 1:\n        return 1\n    return ways(k - 1) + ways(k - 2)\nprint(ways(n))\n",
  },
  {
    slug: "learn-m3-recursion-backtracking-x2",
    title: "Split Donation into Two Equal Halves",
    statement: `ক্লাবের মোট অনুদান \`n\` পত্রে এসেছে। সদস্যরা চায় সব পত্র দুই দলে এমনভাবে ভাগ হবে যেন দুই দলের যোগফল হুবহু সমান হয় — কোনো পত্র ভাঙা যাবে না, সবকটাই কোনো না কোনো দলে যাবে। সম্ভব হলে \`YES\`, নাহলে \`NO\`।

উদাহরণ: \`1 5 11 5\` হলে \`1+5+5 = 11\` আর \`11\` — \`YES\`।`,
    inputFormat: `প্রথম লাইনে \`n\`; দ্বিতীয় লাইনে \`n\`টি অ-ঋণাত্মক পূর্ণসংখ্যা।`,
    outputFormat: `সম্ভব হলে \`YES\`, নাহলে \`NO\`।`,
    constraints: `\`1 <= n <= 40\`, \`0 <= value <= 1000\`; মোট যোগফল 64-বিটে ফিট করে।`,
    editorial: `## ধারণা
দুই দলের যোগফল সমান মানে প্রতিটির যোগফল মোটের অর্ধেক — তাই সমস্যাটা দাঁড়ায় "কোন সাবসেটের যোগফল \`total / 2\` হয়?" \`total\` বিজোড় হলে সঙ্গে সঙ্গে \`NO\`। এরপর \`possible(i, rem)\` রিকার্সন: \`i\` পর্যন্ত ঠিক হয়ে গেছে, \`rem\` টাকা আর দরকার। প্রতি পত্র নেওয়া বা না নেওয়া — \`rem == 0\` হলে \`True\`, শেষ পরেও না হলে \`False\`। অবস্থা \`(i, rem)\` মেমো করলে একই ভাগ বারবার ঘুরতে হয় না; সর্বোচ্চ \`n * (total/2)\` অবস্থা, এখানে \`40 * 20000\` — সহজে চলে।

## ধাপে ধাপে
1. \`n\` আর সব মান পড়ে \`total = sum(values)\` বের করো।
2. \`total % 2 == 1\` হলে সঙ্গে সঙ্গে \`NO\` ছাপে থামো।
3. \`target = total // 2\` ধরে \`possible(i, rem)\` লেখো: \`rem == 0\` → \`True\`; \`i == n\` বা \`rem < 0\` → \`False\`; নাহলে নেওয়া বা না নেওয়ার যেকোনো একটাই \`True\`।
4. \`possible(0, target)\` দেখে \`YES\`/\`NO\` ছাপাও।

\`\`\`python
import sys
from functools import lru_cache
data = list(map(int, sys.stdin.read().split()))
n = data[0]
a = data[1:]
total = sum(a)
if total % 2 == 1:
    print("NO")
else:
    target = total // 2
    @lru_cache(maxsize=None)
    def possible(i, rem):
        if rem == 0:
            return True
        if i == n or rem < 0:
            return False
        return possible(i + 1, rem) or possible(i + 1, rem - a[i])
    print("YES" if possible(0, target) else "NO")
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n * total/2)\` (memo), মেমোরি একই পরিমাণ অবস্থা; বিজোড় মোট হলে \`O(n)\`-এই শেষ।

## সাধারণ ভুল
- মোট যোগফল বিজোড় না যাচাই করে সরাসরি রিকার্সনে গেলে অকারণে ঘুরে বেড়ায়; আর ভাগ \`// 2\` দিয়ে নিলে ভুলটা চোখে পড়ে না।
- \`rem == 0\`-এ সঙ্গে সঙ্গে \`True\` না ফেরিয়ে \`i == n\` পর্যন্ত গেলেও হয়, কিন্তু আগে ফেরালে অকারণে শাখা কমে — memo-ও ছোট থাকে।
- একটা পত্র দুই দলে দুইবার ধরে নেওয়া (ভাগ না করে সব দল এ-তে দিয়ে বাকিটা খালি) — রিকার্সনের "নেওয়া/না নেওয়া" ঠিক লিখলে এই ভুল হয় না।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Recursion", "Backtracking", "Subset Sum"],
    tests: [
      { input: "4\n1 5 11 5\n", expectedOutput: "YES\n", isSample: true },
      { input: "3\n1 2 4\n", expectedOutput: "NO\n", isSample: true },
      { input: "1\n7\n", expectedOutput: "NO\n", isSample: false },
      { input: "2\n5 5\n", expectedOutput: "YES\n", isSample: false },
      { input: "6\n2 2 2 2 2 2\n", expectedOutput: "YES\n", isSample: false },
      {
        input: `20\n${Array.from({ length: 20 }, (_, i) => i + 1).join(" ")}\n`,
        expectedOutput: "YES\n",
        isSample: false,
      },
      {
        input: `40\n${Array(40).fill(1000).join(" ")}\n`,
        expectedOutput: "YES\n",
        isSample: false,
      },
      {
        input: `40\n${Array(39).fill(1000).join(" ")} 999\n`,
        expectedOutput: "NO\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom functools import lru_cache\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\ntotal = sum(a)\nif total % 2 == 1:\n    print(\"NO\")\nelse:\n    target = total // 2\n    @lru_cache(maxsize=None)\n    def possible(i, rem):\n        if rem == 0:\n            return True\n        if i == n or rem < 0:\n            return False\n        return possible(i + 1, rem) or possible(i + 1, rem - a[i])\n    print(\"YES\" if possible(0, target) else \"NO\")\n",
  },
];
