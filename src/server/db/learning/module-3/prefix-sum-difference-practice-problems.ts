import type { SeedProblem } from "../../seed-problems";
import { newlineOutput } from "../generated-tests";

export const PREFIX_SUM_DIFFERENCE_PRACTICE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m3-prefix-sum-difference-e2",
    title: "Festival Light Toggles",
    statement: `উৎসবের সাজসজ্জায় \`n\`টা লাইট এক সারিতে ঝুলছিল, শুরুতে সবই বন্ধ। স্বেচ্ছাসেবকরা পরপর কাজ করছিল — \`i\`-তম স্বেচ্ছাসেবক \`l\` থেকে \`r\` নম্বর লাইট (দুটোই ধরে) উল্টে দিল: জ্বলছিল নিভে গেল, নিভে ছিল জ্বলে উঠল। সবার কাজ শেষ হওয়ার পর প্রতিটি লাইটের চূড়ান্ত অবস্থা এক লাইনে ছাপাও — জ্বললে \`1\`, নিভে থাকলে \`0\`।

উদাহরণ: \`5\`টা লাইটে টগল \`1 3\` তারপর \`2 5\` হলে অবস্থা \`10011\`।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`q\`। পরের \`q\` লাইনে প্রতিটিতে \`l r\` (১-ভিত্তিক)।`,
    outputFormat: `এক লাইনে \`n\`টি অক্ষর — প্রতিটি লাইটের চূড়ান্ত অবস্থা (\`1\`/\`0\`), স্পেস ছাড়া।`,
    constraints: `\`1 <= n, q <= 200000\`
\`1 <= l <= r <= n\`।`,
    editorial: `## ধারণা
প্রতিটি টগলে রেঞ্জের প্রতিটি লাইট ঘষামাজা করলে \`O(n * q)\` হয়ে যায়। ডিফারেন্স অ্যারের টগল সংস্করণ নাও: \`d[l]\` আর \`d[r+1]\`-এ চিহ্ন উল্টে দাও — বাঁ থেকে চলমান XOR নিলে যেকোনো লাইটের চূড়ান্ত অবস্থা বেরিয়ে আসে। কারণ লাইট \`i\`-এর অবস্থা উল্টেছে এমন টগলগুলোই শুধু \`d[1..i]\`-এর ভিতরে চিহ্ন রেখেছে; XOR জমা করলে জোড় সংখ্যক উল্টানো কেটে যায়, বিজোড় থেকে যায়। প্রতি টগল তাই \`O(1)\`।

## ধাপে ধাপে
1. \`n\`, \`q\` পড়ে \`n + 1\` আকারের খালি \`diff\` বানাও।
2. প্রতিটি \`l r\`-এ \`diff[l-1] ^= 1\` আর \`diff[r] ^= 1\` করো।
3. \`cur = 0\` ধরে লাইট ১ থেকে \`n\` পর্যন্ত: \`cur ^= diff[i]\`, তারপর \`cur\`-এর মানই ওই লাইটের অবস্থা।
4. সব অবস্থা জোড়া দিয়ে এক লাইনে ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, q = data[0], data[1]
diff = [0] * (n + 1)
idx = 2
for _ in range(q):
    l, r = data[idx], data[idx + 1]
    idx += 2
    diff[l - 1] ^= 1
    diff[r] ^= 1
cur = 0
out = []
for i in range(n):
    cur ^= diff[i]
    out.append("1" if cur else "0")
print("".join(out))
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n + q)\` — প্রতি টগল \`O(1)\`, শেষে এক পাস; মেমোরি \`O(n)\`।

## সাধারণ ভুল
- যোগের ডিফারেন্স (\`+= x\`) আর টগলের ডিফারেন্স (\`^= 1\`) গুলিয়ে ফেলা — টগলে চিহ্নটা জমা হয় XOR দিয়ে, যোগ দিয়ে নয়।
- \`diff[r] ^= 1\` বাদ দিলে রেঞ্জের পরেও সব লাইট উল্টানো হয়ে যায়।
- একই রেঞ্জ দুইবার টগল হলে লাইট আগের অবস্থায় ফিরে যায় — XOR নিজেই এই বাতিল হিসাব সামলে নেয়, আলাদা কিছু লাগে না।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Difference Array", "XOR", "Range Update"],
    tests: [
      { input: "5 2\n1 3\n2 5\n", expectedOutput: "10011\n", isSample: true },
      { input: "3 1\n1 1\n", expectedOutput: "100\n", isSample: true },
      { input: "4 2\n1 4\n1 4\n", expectedOutput: "0000\n", isSample: false },
      { input: "1 1\n1 1\n", expectedOutput: "1\n", isSample: false },
      {
        input: `200000 100000\n${Array(100000).fill("1 200000").join("\n")}\n`,
        expectedOutput: `${"0".repeat(200000)}\n`,
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, q = data[0], data[1]\ndiff = [0] * (n + 1)\nidx = 2\nfor _ in range(q):\n    l, r = data[idx], data[idx + 1]\n    idx += 2\n    diff[l - 1] ^= 1\n    diff[r] ^= 1\ncur = 0\nout = []\nfor i in range(n):\n    cur ^= diff[i]\n    out.append(\"1\" if cur else \"0\")\nprint(\"\".join(out))\n",
  },
  {
    slug: "learn-m3-prefix-sum-difference-e3",
    title: "Highest Reservoir Level",
    statement: `হোস্টেলের জলাধারে প্রতিদিন ভর্তি আর খালি দুই ধরনেরই ঘটনা ঘটছিল — দিনের হিসাব ঋণাত্মক হলে সেদিন খালি হয়েছে। প্রথম দিন শুরুর আগে লেভেল ছিল শূন্য। পুরো সময়ে পানির লেভেল সর্বোচ্চ কত উঠেছিল, আর সেই সর্বোচ্চ মানে প্রথম কোন দিন পৌঁছেছিল — দুটোই বের করো।

উদাহরণ: দৈনিক হিসাব \`3 -1 4 -2 1\` হলে লেভেল যথাক্রমে \`3 2 6 4 5\` — সর্বোচ্চ \`6\`, তৃতীয় দিনে — উত্তর \`6 3\`।`,
    inputFormat: `প্রথম লাইনে \`n\`। দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা — দৈনিক হিসাব।`,
    outputFormat: `এক লাইনে দুটি সংখ্যা: সর্বোচ্চ লেভেল আর সেই মানে প্রথম পৌঁছানোর দিন (১-ভিত্তিক)।`,
    constraints: `\`1 <= n <= 200000\`
\`-10^9 <= হিসাব <= 10^9\`; লেভেল 64-বিটে ফিট করে।`,
    editorial: `## ধারণা
কোনো দিনের লেভেল হলো প্রথম দিন থেকে ওই দিন পর্যন্ত হিসাবের যোগফল — অর্থাৎ প্রিফিক্স সাম। প্রতিটি দিনের লেভেল আলাদা করে বের করতে গেলে বারবার যোগ করতে হতো; বরং চলমান একটাই যোগফল \`cur\` ধরে রাখো — প্রতি দিন নতুন মান যোগ করলেই সেই দিনের লেভেল পেয়ে যাও। সর্বোচ্চটা খোঁজার সময় কড়া \`>\` দিয়ে আপডেট করলে টাই-এর দিন আগেরটাই থেকে যায় — প্রথম দিনটাই উত্তর হয়।

## ধাপে ধাপে
1. \`n\` আর সব হিসাব পড়ো; \`cur = 0\`, \`best\` এখনো অজানা।
2. প্রতি দিনে \`cur += হিসাব\`।
3. \`best\` অজানা হলে বা \`cur > best\` হলে \`best = cur\`, দিন মনে রাখো।
4. শেষে \`best\` আর দিন ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
cur = 0
best = None
best_day = 1
for i, v in enumerate(data[1:]):
    cur += v
    if best is None or cur > best:
        best = cur
        best_day = i + 1
print(best, best_day)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\` — একটাই পাস; মেমোরি \`O(1)\` অতিরিক্ত।

## সাধারণ ভুল
- সব হিসাব ঋণাত্মক হলে সর্বোচ্চটাও ঋণাত্মক — উত্তর শূন্য ধরে নিলে ভুল হয়; প্রথম দিনের লেভেল দিয়েই শুরু করো।
- \`>=\` দিয়ে আপডেট করলে টাই-এ শেষ দিন ছাপা হয়ে যায় — "প্রথম দিন" শর্তে কড়া \`>\` লাগবে।
- প্রতি দিনের জন্য পুরো যোগফল আবার বের করলে \`O(n^2)\` — চলমান \`cur\`-ই যথেষ্ট।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Prefix Sum", "Arrays"],
    tests: [
      { input: "5\n3 -1 4 -2 1\n", expectedOutput: "6 3\n", isSample: true },
      { input: "2\n-5 -3\n", expectedOutput: "-5 1\n", isSample: true },
      { input: "3\n0 0 0\n", expectedOutput: "0 1\n", isSample: false },
      { input: "1\n42\n", expectedOutput: "42 1\n", isSample: false },
      {
        input: `200000\n${Array(200000).fill(1).join(" ")}\n`,
        expectedOutput: "200000 200000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\ncur = 0\nbest = None\nbest_day = 1\nfor i, v in enumerate(data[1:]):\n    cur += v\n    if best is None or cur > best:\n        best = cur\n        best_day = i + 1\nprint(best, best_day)\n",
  },
  {
    slug: "learn-m3-prefix-sum-difference-m2",
    title: "Longest Segment with Sum K",
    statement: `ক্লাবের রোজনামচায় আয়-ব্যয় দুই-ই লেখা আছে — ব্যয়ের ঘর ঋণাত্মক সংখ্যা। নুসরাত এমন সবচেয়ে লম্বা টানা দিনের অংশ খুঁজছে যার হিসাবের যোগফল হুবহু \`K\` (সেটা ঋণাত্মকও হতে পারে)। অংশে অন্তত একটা দিন থাকতে হবে। সবচেয়ে লম্বা অংশের দৈর্ঘ্য ছাপাও; কোনো অংশই না মেলে না হলে \`0\`।

উদাহরণ: হিসাব \`5 1 -2 3\` আর \`K = 4\` হলে অংশ \`5 1 -2\` — উত্তর \`3\`।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`K\`; দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা।`,
    outputFormat: `যোগফল হুবহু \`K\` এমন সবচেয়ে লম্বা টানা অংশের দৈর্ঘ্য, না থাকলে \`0\`।`,
    constraints: `\`1 <= n <= 200000\`
\`-10^9 <= মান, K <= 10^9\`; প্রিফিক্স মান 64-বিটে ফিট করে।`,
    editorial: `## ধারণা
\`a[l..r]\` এর যোগফল \`pref[r] - pref[l-1] = K\` — অর্থাৎ \`pref[l-1] = pref[r] - K\`। তাই ঘর \`r\`-এ দাঁড়িয়ে প্রশ্ন একটাই: আগে কোন সবচেয়ে বাঁ দিকের প্রিফিক্সের মান \`pref[r] - K\` ছিল? সেই অবস্থানটা মনে রাখলে \`r\`-এ শেষ হওয়া সবচেয়ে লম্বা অংশ এক ধাপেই বেরিয়ে আসে। মান ঋণাত্মক হতে পারে বলে উইন্ডো টানার কৌশল এখানে চলে না — হ্যাশ ম্যাপে প্রিফিক্সের প্রথম অবস্থান রাখাই সঠিক অস্ত্র। প্রতিটি প্রিফিক্স প্রথমবারই জমা করো — পরে একই মান আসলে পুরনোটাই রাখো, কারণ বাঁ দিকের অবস্থান লম্বা অংশ দেয়।

## ধাপে ধাপে
1. \`first = {0: -1}\` দিয়ে শুরু করো — শূন্য প্রিফিক্স শুরুর আগেই আছে।
2. \`pref = 0\`, \`best = 0\` ধরে প্রতিটি ঘরে: \`pref += মান\`।
3. \`pref - K\` যদি \`first\`-এ থাকে, সম্ভাব্য দৈর্ঘ্য \`i - first[pref - K]\`; \`best\` আপডেট করো।
4. \`pref\` আগে দেখা না থাকলেই \`first[pref] = i\` বসাও।
5. শেষে \`best\` ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, k = data[0], data[1]
first = {0: -1}
pref = 0
best = 0
for i, v in enumerate(data[2:]):
    pref += v
    need = pref - k
    if need in first and i - first[need] > best:
        best = i - first[need]
    if pref not in first:
        first[pref] = i
print(best)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\` গড় (হ্যাশ লুকআপ), মেমোরি \`O(n)\` — সর্বোচ্চ \`n + 1\`টা ভিন্ন প্রিফিক্স।

## সাধারণ ভুল
- \`first[pref] = i\` প্রতি ধাপে আপডেট করে দিলে সর্বশেষ অবস্থান জমা হয় — তখন সবচেয়ে ছোট অংশ পাওয়া যায়, বড়টা নয়; প্রথমবারই মান বসাও।
- \`first\`-এ \`{0: -1}\` না রাখলে শুরু থেকে শুরু হওয়া অংশগুলো হারায়।
- ঋণাত্মক মানের কারণে দুই পয়েন্টার টানার যুক্তি ভাঙে — এখানে প্রিফিক্স + হ্যাশ ম্যাপই একমাত্র সহজ পথ।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Prefix Sum", "Hash Map", "Subarrays"],
    tests: [
      { input: "4 4\n5 1 -2 3\n", expectedOutput: "3\n", isSample: true },
      { input: "3 10\n1 2 3\n", expectedOutput: "0\n", isSample: true },
      { input: "2 -2\n-1 -1\n", expectedOutput: "2\n", isSample: false },
      { input: "1 5\n5\n", expectedOutput: "1\n", isSample: false },
      {
        input: `200000 5\n${Array.from({ length: 200000 }, (_, i) => (i % 2 === 0 ? 5 : -5)).join(" ")}\n`,
        expectedOutput: "199999\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, k = data[0], data[1]\nfirst = {0: -1}\npref = 0\nbest = 0\nfor i, v in enumerate(data[2:]):\n    pref += v\n    need = pref - k\n    if need in first and i - first[need] > best:\n        best = i - first[need]\n    if pref not in first:\n        first[pref] = i\nprint(best)\n",
  },
  {
    slug: "learn-m3-prefix-sum-difference-m3",
    title: "Count Divisible Money Segments",
    statement: `ক্লাবের সাপ্তাহিক বাজার হিসাবে আয়-ব্যয় মিলিয়ে প্রতিদিনের একটা করে সংখ্যা লেখা আছে — ব্যয় ঋণাত্মক। একটা টানা দিনের অংশ "মসৃণ" ধরা হয় যদি সেই অংশের যোগফল \`K\` দিয়ে নিঃশেষে ভাগ যায়। মোট কতটা টানা অংশ মসৃণ, সেটা গোনো।

উদাহরণ: হিসাব \`1 2 3 4 5\`, \`K = 3\` হলে \`[1,2]\`, \`[3]\`, \`[1,2,3]\`, \`[2,3,4]\`, \`[3,4,5]\`, \`[4,5]\`, \`[1..5]\` — উত্তর \`7\`।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`K\`; দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা।`,
    outputFormat: `যোগফল \`K\` দিয়ে ভাগযোগ্য এমন টানা অংশের সংখ্যা।`,
    constraints: `\`1 <= n <= 200000\`, \`1 <= K <= 10^6\`
\`-10^9 <= মান <= 10^9\`; উত্তর 64-বিটে ফিট করে।`,
    editorial: `## ধারণা
\`a[l..r]\` ভাগযোগ্য হলে \`pref[r]\` আর \`pref[l-1]\`-এর ভাগশেষ \`K\` দিয়ে সমান। তাই প্রতিটি ঘরে প্রিফিক্সের ভাগশেষ রেখে হিসাবটা হয়ে যায়: একই ভাগশেষের প্রিফিক্স-জোড়া যত, মসৃণ অংশ তত। কাউন্টারে \`0\` ভাগশেষের সংখ্যা শুরুতেই \`1\` রাখো (শূন্য প্রিফিক্স) — এরপর প্রতি ধাপে \`cnt[pref % K]\` উত্তরে যোগ করে সেই ভাগশেষের সংখ্যা এক বাড়াও। ঋণাত্মক সংখ্যাতেও Python-এর \`%\` ফল সবসময় \`0..K-1\` — তাই আলাদা সামলানো লাগে না।

## ধাপে ধাপে
1. \`n\`, \`K\` আর সব মান পড়ো; কাউন্টার \`cnt[0] = 1\` দিয়ে শুরু।
2. \`pref = 0\`, উত্তর \`0\` ধরে প্রতিটি মানে: \`pref += মান\`।
3. \`r = pref % K\` নাও; \`answer += cnt[r]\` করে \`cnt[r] += 1\`।
4. শেষে উত্তর ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, k = data[0], data[1]
cnt = {0: 1}
pref = 0
answer = 0
for v in data[2:]:
    pref += v
    r = pref % k
    answer += cnt.get(r, 0)
    cnt[r] = cnt.get(r, 0) + 1
print(answer)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\` গড়, মেমোরি \`O(min(n, K))\` — ভাগশেষের সংখ্যাই সর্বোচ্চ কী।

## সাধারণ ভুল
- \`cnt[0] = 1\` বাদ দিলে শুরু থেকে চলা মসৃণ অংশগুলো গোনা হয় না — যেমন একক \`K\` ঘরের অংশটাই।
- উত্তর যোগ করার আগে না বলে পরে \`cnt[r]\` বাড়ালে একই প্রিফিক্স নিজের সাথে জুড়ে যায় — ক্রমটা বজায় রাখো।
- ভাগশেষ সমান হলেই অংশটা ভাগযোগ্য — এই সূত্রটা না দেখলে প্রতিটি অংশ আলাদা যোগ করে \`O(n^2)\`-এ পড়ে যাওয়াই স্বাভাবিক ভুল।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Prefix Sum", "Modular Arithmetic", "Hash Map"],
    tests: [
      { input: "5 3\n1 2 3 4 5\n", expectedOutput: "7\n", isSample: true },
      { input: "2 7\n7 7\n", expectedOutput: "3\n", isSample: true },
      { input: "2 3\n-3 3\n", expectedOutput: "3\n", isSample: false },
      { input: "3 1\n1 1 1\n", expectedOutput: "6\n", isSample: false },
      {
        input: `200000 7\n${Array(200000).fill(7).join(" ")}\n`,
        expectedOutput: "20000100000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, k = data[0], data[1]\ncnt = {0: 1}\npref = 0\nanswer = 0\nfor v in data[2:]:\n    pref += v\n    r = pref % k\n    answer += cnt.get(r, 0)\n    cnt[r] = cnt.get(r, 0) + 1\nprint(answer)\n",
  },
  {
    slug: "learn-m3-prefix-sum-difference-h2",
    title: "Wall Poster Row Totals",
    statement: `প্রাইমএশিয়ার সাংস্কৃতিক দল প্রচারণার দেয়াল আঁকছিল — \`n x m\` গ্রিডের দেয়ালে প্রতিটি দল একটা আয়তক্ষেত্র বেছে সেখানে প্রতি সেলে \`x\` কোট রঙ যোগ করে (রঙ জমা হয়, মোছে না)। \`q\`টা দলের কাজ শেষে দেয়ালের প্রতিটি সারিতে মোট কত কোট রঙ জমেছে, সেটা সারি অনুযায়ী ছাপাও।

উদাহরণ: \`3 x 4\` দেয়ালে আয়ত \`(1,1)-(2,2)\` রঙ \`5\`, তারপর আয়ত \`(2,1)-(3,4)\` রঙ \`2\` হলে সারির মোট \`10 18 8\`।`,
    inputFormat: `প্রথম লাইনে \`n\`, \`m\`, \`q\`। পরের \`q\` লাইনে প্রতিটিতে \`r1 c1 r2 c2 x\` — আয়তের সীমা (১-ভিত্তিক, দুই প্রান্ত ধরে) আর কোটের মান।`,
    outputFormat: `\`n\` লাইন; প্রতি লাইনে সেই সারির মোট কোট।`,
    constraints: `\`1 <= n, m <= 500\`, \`1 <= q <= 100000\`
\`1 <= r1 <= r2 <= n\`, \`1 <= c1 <= c2 <= m\`
\`-10^9 <= x <= 10^9\`; মোট কোট 64-বিটে ফিট করে।`,
    editorial: `## ধারণা
এক মাত্রার ডিফারেন্স অ্যারের আয়ত-সংস্করণ দুই মাত্রায় চার কোণে চিহ্ন দেয়: আয়তের ভিতরের প্রতিটি সেলে \`x\` যোগের প্রভাব ফেলতে \`d[r1][c1] += x\`, \`d[r1][c2+1] -= x\`, \`d[r2+1][c1] -= x\`, \`d[r2+1][c2+1] += x\` বসাও। এরপর দুই ধাপে প্রিফিক্স নাও — আগে প্রতি সারির ভিতরে বাঁ থেকে ডানে, তারপর কলাম ধরে উপর থেকে নিচে। কেন কাজ করে? সারির পাসে \`+x\` ধরে চলে \`c1\` থেকে \`c2\` পর্যন্ত আর \`c2+1\`-এ \`-x\` তাকে কেড়ে নেয়; কলামের পাসে একই যুক্তি সারির দিকে চলে — ফলে যোগফলটা ঠিক আয়তের ভিতরেই বসে থাকে। প্রতি আপডেট \`O(1)\`, শেষের দুই পাস \`O(n * m)\`।

## ধাপে ধাপে
1. \`(n+2) x (m+2)\` শূন্য পূর্ণ \`diff\` বানাও — সীমার বাইরের ঘরগুলো সহজে ধরতে বাড়তি সারি-কলাম রাখো।
2. প্রতিটি \`r1 c1 r2 c2 x\`-এ চার কোণে চিহ্ন বসাও।
3. প্রথমে প্রতি সারিতে বাঁ থেকে চলমান যোগফল নাও — এটাই সেলভিত্তিক ডিফারেন্স।
4. তারপর প্রতি কলামে উপর থেকে চলমান যোগফল নাও — এটাই চূড়ান্ত গ্রিড।
5. প্রতিটি সারির মোট যোগ করে এক এক লাইনে ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, m, q = data[0], data[1], data[2]
diff = [[0] * (m + 2) for _ in range(n + 2)]
idx = 3
for _ in range(q):
    r1, c1, r2, c2, x = data[idx], data[idx + 1], data[idx + 2], data[idx + 3], data[idx + 4]
    idx += 5
    diff[r1][c1] += x
    diff[r1][c2 + 1] -= x
    diff[r2 + 1][c1] -= x
    diff[r2 + 1][c2 + 1] += x
grid = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    run = 0
    for j in range(1, m + 1):
        run += diff[i][j]
        grid[i][j] = run
for j in range(1, m + 1):
    run = 0
    for i in range(1, n + 1):
        run += grid[i][j]
        grid[i][j] = run
out = []
for i in range(1, n + 1):
    out.append(str(sum(grid[i][1:m + 1])))
print("\\n".join(out))
\`\`\`

## কমপ্লেক্সিটি
আপডেট মোট \`O(q)\`, দুই পাস \`O(n * m)\` — মোট \`O(q + n * m)\`, মেমোরি \`O(n * m)\`।

## সাধারণ ভুল
- চার কোণের কোনো একটা চিহ্ন ভুল ঘরে বসলে প্রভাব আয়তের বাইরেও ছড়িয়ে পড়ে — ছোট আয়তে হাতে মিলিয়ে নাও।
- শুধু সারির পাস করে থেমে গেলে আয়তটা নিচ পর্যন্ত "লিক" করে — কলামের পাসটাই সারির সীমা কেড়ে নেয়।
- প্রতি আয়তে সেল ধরে লুপ চালালে সর্বোচ্চ \`100000 * 250000\` কাজ — ডিফারেন্সের এই সাশ্রয়ই মূল শিক্ষা।
- সীমানা \`r2 + 1\`, \`c2 + 1\` অ্যারের বাইরে যেতে পারে — তাই \`diff\` এক ঘর বড় বানানো হয়েছে।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["2D Difference Array", "Prefix Sum", "Range Update"],
    tests: [
      { input: "3 4 2\n1 1 2 2 5\n2 1 3 4 2\n", expectedOutput: "10\n18\n8\n", isSample: true },
      { input: "1 1 1\n1 1 1 1 7\n", expectedOutput: "7\n", isSample: true },
      { input: "2 2 2\n1 1 1 1 -3\n2 2 2 2 4\n", expectedOutput: "-3\n4\n", isSample: false },
      { input: "2 3 1\n1 2 2 3 10\n", expectedOutput: "20\n20\n", isSample: false },
      {
        input: `500 500 100000\n${Array(100000).fill("1 1 500 500 1").join("\n")}\n`,
        expectedOutput: newlineOutput(Array(500).fill(50000000)),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, m, q = data[0], data[1], data[2]\ndiff = [[0] * (m + 2) for _ in range(n + 2)]\nidx = 3\nfor _ in range(q):\n    r1, c1, r2, c2, x = data[idx], data[idx + 1], data[idx + 2], data[idx + 3], data[idx + 4]\n    idx += 5\n    diff[r1][c1] += x\n    diff[r1][c2 + 1] -= x\n    diff[r2 + 1][c1] -= x\n    diff[r2 + 1][c2 + 1] += x\ngrid = [[0] * (m + 1) for _ in range(n + 1)]\nfor i in range(1, n + 1):\n    run = 0\n    for j in range(1, m + 1):\n        run += diff[i][j]\n        grid[i][j] = run\nfor j in range(1, m + 1):\n    run = 0\n    for i in range(1, n + 1):\n        run += grid[i][j]\n        grid[i][j] = run\nout = []\nfor i in range(1, n + 1):\n    out.append(str(sum(grid[i][1:m + 1])))\nprint(\"\\n\".join(out))\n",
  },
];
