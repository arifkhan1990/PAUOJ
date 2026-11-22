import type { SeedProblem } from "../../seed-problems";

export const RECURSION_BACKTRACKING_PRACTICE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m3-recursion-backtracking-e2",
    title: "Reverse the Banner Recursively",
    statement: `উৎসবের ব্যানারে ছোট হাতের ইংরেজি অক্ষরের একটা শব্দ ছাপানো ছিল, কিন্তু সাজানোর সময় উল্টে গিয়েছিল। সাদিয়া ব্যানার থেকে শব্দটা পড়ে নিল, এবার পেছনের দিক থেকে আগের দিকে পড়ে সাজাতে হবে। তুমি লুপ না লিখে রিকার্সন দিয়ে স্ট্রিংটা উল্টে ছাপাও — প্রথম অক্ষরটা শেষে বসিয়ে বাকি অংশের সমাধান ডাকো।

উদাহরণ: \`hello\` হলে উত্তর \`olleh\`।`,
    inputFormat: `এক লাইনে ছোট হাতের ইংরেজি অক্ষরের স্ট্রিং \`s\`।`,
    outputFormat: `উল্টানো স্ট্রিং এক লাইনে।`,
    constraints: `\`1 <= |s| <= 5000\`।`,
    editorial: `## ধারণা
স্ট্রিং উল্টানোর রিকার্সিভ ভাঙা: শব্দটার প্রথম অক্ষরটা সবার শেষে বসবে, আর বাকি অংশটাও একই নিয়মে উল্টে যাবে। অর্থাৎ \`rev(s) = rev(s[1:]) + s[0]\` — বাকি অংশের উত্তরটা রিকার্সন নিজেই এনে দেবে। Base case খালি স্ট্রিং — তখন উল্টানোরও কিছু নেই, ফাঁকা স্ট্রিং ফেরাও। দৈর্ঘ্য ৫০০০ হলে কলের গভীরতাও ৫০০০, তাই Python-এর ডিফল্ট রিকার্সন সীমা বাড়িয়ে নাও।

## ধাপে ধাপে
1. স্ট্রিংটা পড়ে নাও।
2. \`rev(text)\` লেখো: \`text\` খালি হলে ফাঁকা স্ট্রিং ফেরাও।
3. নাহলে \`rev(text[1:]) + text[0]\` ফেরাও — বাকি অংশের উত্তর পেছনে, প্রথম অক্ষর তার পরে।
4. \`sys.setrecursionlimit\` বাড়িয়ে \`rev(s)\` ছাপাও।

\`\`\`python
import sys
sys.setrecursionlimit(10000)
s = sys.stdin.readline().strip()
def rev(text):
    if not text:
        return ""
    return rev(text[1:]) + text[0]
print(rev(s))
\`\`\`

## কমপ্লেক্সিটি
প্রতি কলে \`text[1:]\` কপি হয়, তাই সময় ও মেমোরি প্রায় \`O(n^2)\` — \`n = 5000\`-এ চলে যায়; recursion depth \`O(n)\`।

## সাধারণ ভুল
- Base case না লিখলে খালি স্ট্রিংয়ে \`text[0]\` নিতে \`IndexError\` — রিকার্সন থামবেই না।
- \`rev(text[1:]) + text[0]\`-এর জায়গায় \`text[0] + rev(text[1:])\` লিখলে উল্টানোর বদলে হুবহু শব্দটাই ফিরে আসে।
- \`setrecursionlimit\` না দিলে দৈর্ঘ্য ১০০০ ছাড়লেই ডিফল্ট সীমায় \`RecursionError\`।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Recursion", "Strings"],
    tests: [
      { input: "hello\n", expectedOutput: "olleh\n", isSample: true },
      { input: "a\n", expectedOutput: "a\n", isSample: true },
      { input: "racecar\n", expectedOutput: "racecar\n", isSample: false },
      { input: "abcde\n", expectedOutput: "edcba\n", isSample: false },
      {
        input: `${"ab".repeat(2500)}\n`,
        expectedOutput: `${"ba".repeat(2500)}\n`,
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nsys.setrecursionlimit(10000)\ns = sys.stdin.readline().strip()\ndef rev(text):\n    if not text:\n        return \"\"\n    return rev(text[1:]) + text[0]\nprint(rev(s))\n",
  },
  {
    slug: "learn-m3-recursion-backtracking-e3",
    title: "Badge Digit Product Steps",
    statement: `কোডিং ক্লাবের প্রত্যেক সদস্যের ব্যাজে একটা সংখ্যা লেখা। ক্লাবের পুরনো খেলাটা হলো: সংখ্যার সব অঙ্ক গুণ করে নতুন সংখ্যা বানাও, তারপর সেটারও অঙ্ক গুণ করো — যতক্ষণ না এক অঙ্কের সংখ্যা আসে। রফি জানতে চায় শুরুর সংখ্যা থেকে এক অঙ্কে নামতে মোট কয় ধাপ লাগে — যে সংখ্যাটা শুরুতেই এক অঙ্কের, তার ধাপ শূন্য। তুমি রিকার্সনে ধাপটা গোনো।

উদাহরণ: \`39\` হলে \`3 * 9 = 27\`, \`2 * 7 = 14\`, \`1 * 4 = 4\` — মোট \`3\` ধাপ।`,
    inputFormat: `এক লাইনে একটা ধনাত্মক পূর্ণসংখ্যা \`n\`।`,
    outputFormat: `এক অঙ্কে নামতে লাগা মোট ধাপের সংখ্যা।`,
    constraints: `\`1 <= n <= 10^18\`।`,
    editorial: `## ধারণা
প্রতিটি ধাপ একই কাজ: সংখ্যার অঙ্কগুলোর গুণফল বের করা। রিকার্সনে সেটাকে লুপ না লিখে এক লাইনে ভাঙা যায়: শেষ অঙ্ক \`x % 10\` নাও, বাকি সংখ্যা \`x // 10\`-এর গুণফল রিকার্সন এনে দেবে, দুটো গুণ করো। গোনার অংশটাও সরল: \`steps(x) = 0\` যদি \`x < 10\`, নাহলে \`1 + steps(অঙ্কের গুণফল)\`। অঙ্কে শূন্য থাকলে গুণফল শূন্য হয়ে এক ধাপেই শেষ — সেটাও নিয়ম মেনেই চলে।

## ধাপে ধাপে
1. \`n\` পড়ো।
2. \`digit_prod(x)\` লেখো: \`x < 10\` হলে \`x\`; নাহলে \`(x % 10) * digit_prod(x // 10)\`।
3. \`steps(x)\` লেখো: \`x < 10\` হলে \`0\`; নাহলে \`1 + steps(digit_prod(x))\`।
4. \`steps(n)\` ছাপাও।

\`\`\`python
import sys
n = int(sys.stdin.readline())
def digit_prod(x):
    if x < 10:
        return x
    return (x % 10) * digit_prod(x // 10)
def steps(x):
    if x < 10:
        return 0
    return 1 + steps(digit_prod(x))
print(steps(n))
\`\`\`

## কমপ্লেক্সিটি
প্রতি ধাপে সংখ্যা দ্রুত ছোট হয়, তাই মোট ধাপ খুবই কম (\`10^18\`-এও ১১-এর বেশি নয়); প্রতি ধাপে অঙ্ক গুনতে অঙ্কসংখ্যার সমানুপাতিক কাজ। মোট প্রায় \`O(অঙ্কের সংখ্যা * ধাপ)\`।

## সাধারণ ভুল
- \`x < 10\`-এর আগেই \`x % 10\` ধরে গুণ শুরু করলে এক অঙ্কের সংখ্যারও ধাপ গোনা হয়ে যায় — base case গুরুত্বপূর্ণ।
- অঙ্ক বের করতে স্ট্রিং বানিয়ে করা যায়, কিন্তু \`% 10\` আর \`// 10\` দিয়ে পাটিগণিতেই করা পরিষ্কার — দুই পথেই ফল এক।
- শূন্য অঙ্কের সংখ্যায় (যেমন \`10\`) গুণফল শূন্য — এটাই সঠিক, পরের ধাপে \`0\` এক অঙ্কের বলে থেমে যাওয়াই নিয়ম।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Recursion", "Digits", "Math"],
    tests: [
      { input: "39\n", expectedOutput: "3\n", isSample: true },
      { input: "5\n", expectedOutput: "0\n", isSample: true },
      { input: "10\n", expectedOutput: "1\n", isSample: false },
      { input: "99\n", expectedOutput: "2\n", isSample: false },
      { input: "1\n", expectedOutput: "0\n", isSample: false },
      { input: "277777788888899\n", expectedOutput: "11\n", isSample: false },
    ],
    referencePython:
      "import sys\nn = int(sys.stdin.readline())\ndef digit_prod(x):\n    if x < 10:\n        return x\n    return (x % 10) * digit_prod(x // 10)\ndef steps(x):\n    if x < 10:\n        return 0\n    return 1 + steps(digit_prod(x))\nprint(steps(n))\n",
  },
  {
    slug: "learn-m3-recursion-backtracking-m2",
    title: "K-th Seating Arrangement",
    statement: `ইন্টারভিউ প্রস্তুতি ক্লাবে \`n\` জন পরীক্ষার্থীকে এক সারিতে বসানোর সব বিন্যাস বানানো হচ্ছিল। প্রতিটি পরীক্ষার্থীর একটা নম্বর \`1..n\`, আর বিন্যাসগুলো অভিধানের ক্রমে (lexicographic) সাজানো — ছোট নম্বর আগে। নুসরাত \`k\`-তম বিন্যাসটা জানতে চায়, কিন্তু শুরু থেকে সব বিন্যাস বানানো অসম্ভব — \`n = 12\`-তেই প্রায় ৪.৮ কোটি। তুমি সরাসরি \`k\`-তম বিন্যাসটা বের করো।

উদাহরণ: \`n = 3\`, \`k = 4\` হলে বিন্যাসগুলো \`123, 132, 213, 231, ...\` — চতুর্থটা \`2 3 1\`।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`k\`।`,
    outputFormat: `\`k\`-তম বিন্যাস — \`n\`টি সংখ্যা এক লাইনে, স্পেস দিয়ে আলাদা।`,
    constraints: `\`2 <= n <= 12\`
\`1 <= k <= n!\` — উত্তর অনন্য।`,
    editorial: `## ধারণা
অভিধানের ক্রমে সব বিন্যাস গুনলে প্রথম ঘরে যে সংখ্যাটা বসে, তার আগে ঠিক \`(n-1)!\`-টা বিন্যাস আসে — বাকি \`n-1\`টা সংখ্যা যেভাবেই সাজুক। তাই প্রথম ঘরটা আন্দাজ করা যায়: \`idx = (k-1) // (n-1)!\` দিলে বাকি থাকা সংখ্যাগুলোর \`idx\`-তমটাই এই ঘরে বসবে; বাকি \`k\` সেই দলের ভিতরের অবস্থান। এক ঘর ঠিক করে পরের ঘরে একই যুক্তি চালাও — প্রতি ধাপে \`!\`-এর ঘাত এক কমে, শেষে \`0! = 1\`। ব্যাকট্র্যাকিং-এর বড় শিক্ষা: যে শাখায় উত্তর নেই, সেখানে ঢুকতেই হয় না — গুণিতক দিয়ে পুরো শাখা লাফিয়ে পার হওয়া।

## ধাপে ধাপে
1. বাকি সংখ্যাগুলোর সাজানো লিস্ট \`avail\` নাও; \`k -= 1\` করে ০-ভিত্তিক করো।
2. ঘর \`i = n\` থেকে \`1\` পর্যন্ত ঘুরো: \`f = (i - 1)!\`।
3. \`idx = k // f\` আর \`k %= f\` — \`avail\`-এর \`idx\`-তম সংখ্যাটা এই ঘরে বসে, লিস্ট থেকে বাদ দাও।
4. সব ঘর ভরা হলে লাইনটা ছাপাও।

\`\`\`python
import sys, math
data = list(map(int, sys.stdin.read().split()))
n, k = data[0], data[1]
avail = list(range(1, n + 1))
k -= 1
out = []
for i in range(n, 0, -1):
    f = math.factorial(i - 1)
    idx = k // f
    k %= f
    out.append(avail.pop(idx))
print(" ".join(map(str, out)))
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n^2)\`-এর ভিতরে — প্রতি ঘরে \`avail\` থেকে বসানো \`O(n)\`, ঘর \`n\`টা; মেমোরি \`O(n)\`।

## সাধারণ ভুল
- \`k\`-কে ০-ভিত্তিক না করলে প্রতি ঘরে এক ঘর এগিয়ে যাওয়া বিন্যাস বসে — শুরুতেই \`k -= 1\`।
- প্রতি ঘরে নতুন করে সব বিন্যাস বানিয়ে গুনলে \`n!\` ধাপ — \`n = 12\`-তেই শেষ হবে না; গুণিতক দিয়ে লাফানোই উদ্দেশ্য।
- \`avail\` থেকে সংখ্যা বসানোর পর লিস্ট আপডেট না করলে একই সংখ্যা দুই ঘরে বসে যায়।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Backtracking", "Combinatorics", "Factorials"],
    tests: [
      { input: "3 4\n", expectedOutput: "2 3 1\n", isSample: true },
      { input: "2 1\n", expectedOutput: "1 2\n", isSample: true },
      { input: "3 6\n", expectedOutput: "3 2 1\n", isSample: false },
      { input: "10 1000000\n", expectedOutput: "3 8 9 4 10 2 6 5 7 1\n", isSample: false },
      {
        input: "12 1\n",
        expectedOutput: `${Array.from({ length: 12 }, (_, i) => i + 1).join(" ")}\n`,
        isSample: false,
      },
      {
        input: "12 479001600\n",
        expectedOutput: `${Array.from({ length: 12 }, (_, i) => 12 - i).join(" ")}\n`,
        isSample: false,
      },
    ],
    referencePython:
      "import sys, math\ndata = list(map(int, sys.stdin.read().split()))\nn, k = data[0], data[1]\navail = list(range(1, n + 1))\nk -= 1\nout = []\nfor i in range(n, 0, -1):\n    f = math.factorial(i - 1)\n    idx = k // f\n    k %= f\n    out.append(avail.pop(idx))\nprint(\" \".join(map(str, out)))\n",
  },
  {
    slug: "learn-m3-recursion-backtracking-m3",
    title: "Word Hunt in the Grid",
    statement: `ক্লাবের বুলেটিনে অক্ষরের একটা গ্রিড ছাপা হয়েছিল, আর তানভির লুকানো শব্দ খেলার উত্তর খুঁজছে। শব্দটা গ্রিডে আছে কিনা বলতে হবে: শব্দের অক্ষরগুলো পরপর এমন ঘরে বসতে হবে যেখানে এক ঘর থেকে পরের ঘরে যাওয়া যায় উপরে, নিচে, বাঁয়ে বা ডানে (কোণাকুণি নয়) — আর একটা ঘর এক শব্দে দুইবার ব্যবহার করা যাবে না। শুরুর ঘর যেকোনো ঘর হতে পারে। পাওয়া গেলে \`YES\`, না গেলে \`NO\` ছাপাও।

উদাহরণ: গ্রিডের সারি \`cat\`, \`aoa\`, \`tge\` হলে শব্দ \`cat\` প্রথম সারিতেই আছে — উত্তর \`YES\`।`,
    inputFormat: `প্রথম লাইনে \`R\` আর \`C\`। পরের \`R\` লাইনে প্রতিটিতে \`C\`টি ছোট হাতের অক্ষর। শেষ লাইনে খোঁজার শব্দ।`,
    outputFormat: `শব্দটা পাওয়া গেলে \`YES\`, না গেলে \`NO\`।`,
    constraints: `\`1 <= R, C <= 50\`
\`1 <= |শব্দ| <= 8\` — সব ছোট হাতের অক্ষর।`,
    editorial: `## ধারণা
প্রতিটি ঘর থেকে শুরু করে শব্দটা মেলানোর চেষ্টা করো — এটাই ব্যাকট্র্যাকিং: বর্তমান ঘরের অক্ষর শব্দের \`k\`-তম অক্ষরের সাথে মিললে চার প্রতিবেশী ঘরে যাওয়ার চেষ্টা করো, না মিললে সেই শাখা বাদ। ব্যবহৃত ঘরগুলো \`seen\` সেটে রাখো যেন এক ঘরে দুইবার পা না পড়ে; একটা শাখা ব্যর্থ হলে ঘরটা \`seen\` থেকে সরিয়ে নাও — অবস্থা আগের মতো ফিরিয়ে দেওয়াই (undo) ব্যাকট্র্যাকিংয়ের প্রাণ। প্রথম অক্ষরেই না মিললে গভীরে যাওয়ার দরকারই নেই — এই কাটাই বড় গ্রিডেও সব সম্ভাবনা সামলে ফেলে।

## ধাপে ধাপে
1. গ্রিড আর শব্দ পড়ো; চার দিকের পরিবর্তন \`(0,1), (0,-1), (1,0), (-1,0)\` হিসেবে রাখো।
2. \`dfs(i, j, k, seen)\` লেখো: \`grid[i][j] != word[k]\` হলে মিথ্যা; \`k\` শেষ অক্ষরে পৌঁছালে সত্য।
3. \`(i, j)\`-কে \`seen\`-এ রেখে চার প্রতিবেশীর প্রতিটিতে \`dfs(..., k + 1, ...)\` ডাকো — সীমার ভিতরে এবং \`seen\`-এ না থাকলে।
4. কোনো পথ মিললে ঘরটা \`seen\` থেকে সরিয়ে সত্য ফেরাও; সব ব্যর্থ হলে সরিয়ে মিথ্যা।
5. সব ঘর থেকে চেষ্টা করে ফল ছাপাও।

\`\`\`python
import sys
lines = sys.stdin.read().split()
r, c = int(lines[0]), int(lines[1])
grid = lines[2:2 + r]
word = lines[2 + r]
n = len(word)
def dfs(i, j, k, seen):
    if grid[i][j] != word[k]:
        return False
    if k == n - 1:
        return True
    seen.add((i, j))
    for di, dj in ((0, 1), (0, -1), (1, 0), (-1, 0)):
        ni, nj = i + di, j + dj
        if 0 <= ni < r and 0 <= nj < c and (ni, nj) not in seen:
            if dfs(ni, nj, k + 1, seen):
                seen.discard((i, j))
                return True
    seen.discard((i, j))
    return False
found = False
for i in range(r):
    for j in range(c):
        if dfs(i, j, 0, set()):
            found = True
            break
    if found:
        break
print("YES" if found else "NO")
\`\`\`

## কমপ্লেক্সিটি
সব শুরু ঘর ধরে সর্বোচ্চ \`4^(|শব্দ|-1)\` পথ — শব্দের দৈর্ঘ্য সীমিত (৮) বলে বাস্তবে প্রথম অক্ষরের অমিলেই বেশির ভাগ শাখা কাটা পড়ে; \`R * C\` ঘর মিলিয়েও দ্রুত চলে। মেমোরি \`O(|শব্দ|)\` — \`seen\` আর কলের গভীরতা।

## সাধারণ ভুল
- \`seen\` থেকে ঘর সরানো (undo) ভুলে গেলে পরের শুরু ঘরের চেষ্টা আটকে যায় — অবস্থা ফেরানোই ব্যাকট্র্যাকিংয়ের নিয়ম।
- শব্দ পাওয়ার পরও লুপ থামানো না হলে অকারণ ঘর ঘোরা চলতে থাকে — মিললেই সত্য পৌঁছে দাও।
- কোণাকুণি চলা যোগ করলে প্রতিবেশীর সংখ্যা ৮ হয়, কিন্তু সমস্যায় চার দিক বলা আছে — নিয়মবহির্ভূত পথ উত্তর বদলে দেয়।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Backtracking", "Grid", "DFS"],
    tests: [
      { input: "3 3\ncat\naoa\ntge\ncat\n", expectedOutput: "YES\n", isSample: true },
      { input: "3 3\ncat\naoa\ntge\ndog\n", expectedOutput: "NO\n", isSample: true },
      { input: "3 3\ncat\naoa\ntge\ntac\n", expectedOutput: "YES\n", isSample: false },
      { input: "2 2\naa\naa\naaa\n", expectedOutput: "YES\n", isSample: false },
      { input: "1 5\nhello\nhello\n", expectedOutput: "YES\n", isSample: false },
      {
        input: `50 50\n${Array.from({ length: 50 }, (_, i) => (i === 25 ? "answer" + "x".repeat(44) : "x".repeat(50))).join("\n")}\nanswer\n`,
        expectedOutput: "YES\n",
        isSample: false,
      },
      {
        input: `50 50\n${Array.from({ length: 50 }, () => "x".repeat(50)).join("\n")}\nanswer\n`,
        expectedOutput: "NO\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nlines = sys.stdin.read().split()\nr, c = int(lines[0]), int(lines[1])\ngrid = lines[2:2 + r]\nword = lines[2 + r]\nn = len(word)\ndef dfs(i, j, k, seen):\n    if grid[i][j] != word[k]:\n        return False\n    if k == n - 1:\n        return True\n    seen.add((i, j))\n    for di, dj in ((0, 1), (0, -1), (1, 0), (-1, 0)):\n        ni, nj = i + di, j + dj\n        if 0 <= ni < r and 0 <= nj < c and (ni, nj) not in seen:\n            if dfs(ni, nj, k + 1, seen):\n                seen.discard((i, j))\n                return True\n    seen.discard((i, j))\n    return False\nfound = False\nfor i in range(r):\n    for j in range(c):\n        if dfs(i, j, 0, set()):\n            found = True\n            break\n    if found:\n        break\nprint(\"YES\" if found else \"NO\")\n",
  },
  {
    slug: "learn-m3-recursion-backtracking-h2",
    title: "Solve the Club Sudoku",
    statement: `ক্লাব রুমের কর্নারে একটা ৯x৯ সুডোকু বোর্ড ঝুলছিল — কিছু ঘরে অঙ্ক বসানো, বাকিগুলো খালি (\`0\` লেখা)। সুডোকুর নিয়ম: প্রতিটি সারিতে, প্রতিটি কলামে আর প্রতিটি ৩x৩ বক্সে অঙ্ক \`1\` থেকে \`9\` ঠিক একবারই বসবে। বোর্ডটা এমনভাবে বানানো যে সমাধান অনন্য। তুমি ব্যাকট্র্যাকিং দিয়ে খালি ঘরগুলো পূরণ করে সম্পূর্ণ বোর্ড ছাপাও।

উদাহরণ ঘর: সারি \`530070000\`-এর শেষে \`534678912\` বসবে — সারি, কলাম আর বক্স তিনটাই নিয়ম মানে।`,
    inputFormat: `\`9\` লাইন, প্রতিটিতে \`9\`টি অক্ষর — বসানো অঙ্ক \`1\`-\`9\`, খালি ঘর \`0\`।`,
    outputFormat: `সমাধান করা বোর্ড — \`9\` লাইন, প্রতিটিতে \`9\`টি অঙ্ক, স্পেস ছাড়া।`,
    constraints: `ইনপুট বোর্ডে যে অঙ্ক বসানো আছে সেগুলো নিয়ম ভাঙে না; সমাধান অনন্য।`,
    editorial: `## ধারণা
খালি ঘরগুলোর তালিকা বানিয়ে একটা একটা করে পূরণ করো — এটাই সুডোকুর ব্যাকট্র্যাকিং। প্রতিটি ঘরের জন্য সারি, কলাম আর ৩x৩ বক্স — তিনটা সেটে কোন কোন অঙ্ক ইতিমধ্যে ব্যস্ত তা রাখো; তাহলে একটা অঙ্ক বসানো যাবে কিনা এক ধাপেই যাচাই হয়। একটা অঙ্ক বসিয়ে পরের ঘরে যাও; কোথাও আটকে গেলে অঙ্কটা খুলে আগের অবস্থায় ফিরে এসো — সেট থেকেও সরিয়ে দাও (undo)। সব ঘর ভরা গেলে বোর্ড সম্পূর্ণ। সারি-কলাম-বক্সের ব্যস্ত অঙ্ক হিসাব না রাখলে প্রতি ধাপে পুরো বোর্ড ঘেঁটে যাচাই করতে হতো — সেটগুলোই সেই খরচ বাঁচায়।

## ধাপে ধাপে
1. বোর্ড পড়ে \`rows\`, \`cols\`, \`boxes\` সেটে বসানো অঙ্কগুলো নাও; খালি ঘরগুলো \`empties\` লিস্টে রাখো।
2. \`fill(pos)\` লেখো: \`pos\` সব খালি ঘর পার হলে সত্য — বোর্ড ভরেছে।
3. বর্তমান ঘর \`(i, j)\`-এর জন্য \`1..9\`-এর প্রতিটি অঙ্ক দেখো: তিন সেটের কোনোটাতেই না থাকলে বসাও, সেটে যোগ করো।
4. \`fill(pos + 1)\` সত্য হলে সেই অঙ্কই থাকবে — সত্য ফেরাও।
5. ব্যর্থ হলে অঙ্কটা ঘর আর সেট থেকে সরিয়ে পরের অঙ্ক দেখো; সব ব্যর্থ হলে মিথ্যা — এক ঘর পিছিয়ে অন্য পথ।
6. শেষে বোর্ড এক লাইনে এক সারি করে ছাপাও।

\`\`\`python
import sys
lines = sys.stdin.read().split()
grid = [[int(ch) for ch in lines[i]] for i in range(9)]
rows = [set() for _ in range(9)]
cols = [set() for _ in range(9)]
boxes = [set() for _ in range(9)]
empties = []
for i in range(9):
    for j in range(9):
        v = grid[i][j]
        if v:
            rows[i].add(v)
            cols[j].add(v)
            boxes[i // 3 * 3 + j // 3].add(v)
        else:
            empties.append((i, j))
def fill(pos):
    if pos == len(empties):
        return True
    i, j = empties[pos]
    b = i // 3 * 3 + j // 3
    for v in range(1, 10):
        if v not in rows[i] and v not in cols[j] and v not in boxes[b]:
            grid[i][j] = v
            rows[i].add(v)
            cols[j].add(v)
            boxes[b].add(v)
            if fill(pos + 1):
                return True
            rows[i].discard(v)
            cols[j].discard(v)
            boxes[b].discard(v)
            grid[i][j] = 0
    return False
fill(0)
print("\\n".join("".join(str(v) for v in row) for row in grid))
\`\`\`

## কমপ্লেক্সিটি
সবচেয়ে খারাপ অবস্থায় সময় সূচকীয়, কিন্তু সারি-কলাম-বক্সের সেট যাচাইয়ে প্রতিটি ঘরে বসতে পারে এমন অঙ্ক খুব কম থাকে — বাস্তব বোর্ডে মুহূর্তেই সমাধান হয়। মেমোরি \`O(1)\` ধ্রুব (৮১ ঘর)।

## সাধারণ ভুল
- undo অসম্পূর্ণ রাখা — অঙ্ক ঘর থেকে মুছলেও সেট থেকে না সরালে পরের শাখা ভুল বাধা পায়।
- বক্সের ইনডেক্স \`i // 3 * 3 + j // 3\` ভুল হলে (যেমন \`i + j\`) ভিন্ন বক্সের অঙ্ক একই বক্সে ধরা হয় — ফল নিয়মভাঙা বোর্ড।
- বসানো অঙ্কের যাচাই বাদ দিলে ইনপুটের ভুল ধরা পড়ে না, কিন্তু বৈধ ইনপুটে সমস্যা নেই — তবু খালি ঘরে শুধু \`0\` থাকা নিশ্চিত করো।
- সমাধান পাওয়ার পর \`fill\` থামাতে ভুলে গেলে সব শাখা ঘোরে — সত্য পেলেই সোজা ফেরত দাও।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Backtracking", "Constraint Satisfaction", "Grid"],
    tests: [
      {
        input: "530600902\n000195308\n008000507\n800001020\n020003090\n010920800\n960500204\n287400000\n305200070\n",
        expectedOutput: "534678912\n672195348\n198342567\n859761423\n426853791\n713924856\n961537284\n287419635\n345286179\n",
        isSample: true,
      },
      {
        input: "030070010\n072005300\n008342500\n809001423\n000800000\n013004056\n061030080\n087000035\n340000170\n",
        expectedOutput: "534678912\n672195348\n198342567\n859761423\n426853791\n713924856\n961537284\n287419635\n345286179\n",
        isSample: true,
      },
      {
        input: "530070002\n670000040\n090000500\n009701400\n020050700\n003924000\n060007200\n000019635\n005280170\n",
        expectedOutput: "534678912\n672195348\n198342567\n859761423\n426853791\n713924856\n961537284\n287419635\n345286179\n",
        isSample: false,
      },
      {
        input: "034000912\n002090048\n190040000\n050700003\n026003000\n010004856\n060000280\n007400035\n000000100\n",
        expectedOutput: "534678912\n672195348\n198342567\n859761423\n426853791\n713924856\n961537284\n287419635\n345286179\n",
        isSample: false,
      },
      {
        input: "030670902\n072095008\n008000507\n850061000\n000800000\n703924800\n060037200\n000419030\n005006070\n",
        expectedOutput: "534678912\n672195348\n198342567\n859761423\n426853791\n713924856\n961537284\n287419635\n345286179\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nlines = sys.stdin.read().split()\ngrid = [[int(ch) for ch in lines[i]] for i in range(9)]\nrows = [set() for _ in range(9)]\ncols = [set() for _ in range(9)]\nboxes = [set() for _ in range(9)]\nempties = []\nfor i in range(9):\n    for j in range(9):\n        v = grid[i][j]\n        if v:\n            rows[i].add(v)\n            cols[j].add(v)\n            boxes[i // 3 * 3 + j // 3].add(v)\n        else:\n            empties.append((i, j))\ndef fill(pos):\n    if pos == len(empties):\n        return True\n    i, j = empties[pos]\n    b = i // 3 * 3 + j // 3\n    for v in range(1, 10):\n        if v not in rows[i] and v not in cols[j] and v not in boxes[b]:\n            grid[i][j] = v\n            rows[i].add(v)\n            cols[j].add(v)\n            boxes[b].add(v)\n            if fill(pos + 1):\n                return True\n            rows[i].discard(v)\n            cols[j].discard(v)\n            boxes[b].discard(v)\n            grid[i][j] = 0\n    return False\nfill(0)\nprint(\"\\n\".join(\"\".join(str(v) for v in row) for row in grid))\n",
  },
];
