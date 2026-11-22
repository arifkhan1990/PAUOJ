import type { SeedProblem } from "../../seed-problems";
import { spaceOutput } from "../generated-tests";

export const TWO_POINTERS_SLIDING_WINDOW_PRACTICE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m3-two-pointers-sliding-window-e2",
    title: "Merge Two Sorted Attendance Lists",
    statement: `সাদিয়া ক্লাবের দুই শিফটের হাজিরা নোট পাশাপাশি রাখছিল — দুটো তালিকাই রোল নম্বর অনুযায়ী ছোট থেকে বড় সাজানো, কিন্তু একসাথে মেলানো দরকার। শিফট আবার খুলবে না, তাই সে নিজেই দুটো তালিকা মিশিয়ে একটা সাজানো তালিকা বানাল — কোনো নম্বর দুইবার লেখা লাগল না। তুমিও দুটো সাজানো তালিকা পেয়ে মিশিয়ে এক লাইনে ছোট থেকে বড় ক্রমে ছাপাও।

উদাহরণ: \`1 4 9\` আর \`2 5 6\` হলে মিলিয়ে \`1 2 4 5 6 9\`।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`m\`। দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা — প্রথম তালিকা (সাজানো)। তৃতীয় লাইনে \`m\`টি পূর্ণসংখ্যা — দ্বিতীয় তালিকা (সাজানো)।`,
    outputFormat: `\`n + m\`টি সংখ্যা এক লাইনে, ছোট থেকে বড় ক্রমে, স্পেস দিয়ে আলাদা।`,
    constraints: `\`1 <= n, m <= 200000\`
\`-10^9 <= মান <= 10^9\`
দুটো তালিকাই আগে থেকেই ছোট থেকে বড় সাজানো।`,
    editorial: `## ধারণা
দুটো তালিকাই সাজানো — এই গুণটাই কাজে লাগাও। দুই পয়েন্টারের ছোট রূপ: প্রতি ধাপে দুই তালিকার বর্তমান মানের মধ্যে ছোটটা নাও, সেই তালিকার পয়েন্টার এক এগোও। যেহেতু দুটোই ক্রমানুসারে, ছোটটা নেওয়ার পর বাকি মানগুলোর ক্রম কখনো ভাঙে না — ফল নিজে থেকেই সাজানো আসে, কোনো সর্ট ছাড়াই। প্রতিটি মান ঠিক একবার দেখা হয়, তাই কাজ \`O(n + m)\`।

## ধাপে ধাপে
1. \`n\`, \`m\` আর দুটো তালিকা পড়ো।
2. \`i = 0\`, \`j = 0\` রেখে লুপ চালাও — যতক্ষণ দুটোই শেষ না হয়।
3. \`a[i] <= b[j]\` হলে \`a[i]\` নাও আর \`i += 1\`; নাহলে \`b[j]\` নাও আর \`j += 1\`।
4. এক তালিকা শেষ হলে বাকিটা সরাসরি ফলের শেষে যোগ করো।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, m = data[0], data[1]
a = data[2:2 + n]
b = data[2 + n:2 + n + m]
i = j = 0
out = []
while i < n and j < m:
    if a[i] <= b[j]:
        out.append(a[i])
        i += 1
    else:
        out.append(b[j])
        j += 1
out.extend(a[i:])
out.extend(b[j:])
print(" ".join(map(str, out)))
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n + m)\` — প্রতিটি মান একবারই পাশ কাটে; মেমোরি \`O(n + m)\` (আউটপুট)।

## সাধারণ ভুল
- পুরো জিনিস একসাথে করে আবার সর্ট করলেও হয়, কিন্তু \`O((n + m) log(n + m))\` — সাজানো ইনপুটের সুযোগ নষ্ট।
- লুপ শেষে বাকি তালিকার মানগুলো যোগ করতে ভুলে গেলে শেষের সংখ্যাগুলো হারিয়ে যায়।
- \`<=\` না লিখে \`<\` লিখলে সমান মানের ক্রম এলোমেলো না হলেও ভাবনাটা গড়িয়ে যায় — সমান হলে প্রথম তালিকারটা আগে নেওয়াই সহজ ও নিরাপদ।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Two Pointers", "Merge"],
    tests: [
      { input: "3 3\n1 4 9\n2 5 6\n", expectedOutput: "1 2 4 5 6 9\n", isSample: true },
      { input: "1 1\n5\n5\n", expectedOutput: "5 5\n", isSample: true },
      { input: "1 3\n5\n1 2 3\n", expectedOutput: "1 2 3 5\n", isSample: false },
      { input: "3 1\n-9 -5 0\n-100\n", expectedOutput: "-100 -9 -5 0\n", isSample: false },
      {
        input: `200000 200000\n${Array.from({ length: 200000 }, (_, i) => 2 * (i + 1)).join(" ")}\n${Array.from({ length: 200000 }, (_, i) => 2 * i + 1).join(" ")}\n`,
        expectedOutput: spaceOutput(Array.from({ length: 400000 }, (_, i) => i + 1)),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, m = data[0], data[1]\na = data[2:2 + n]\nb = data[2 + n:2 + n + m]\ni = j = 0\nout = []\nwhile i < n and j < m:\n    if a[i] <= b[j]:\n        out.append(a[i])\n        i += 1\n    else:\n        out.append(b[j])\n        j += 1\nout.extend(a[i:])\nout.extend(b[j:])\nprint(\" \".join(map(str, out)))\n",
  },
  {
    slug: "learn-m3-two-pointers-sliding-window-e3",
    title: "Push Zero Records to the End",
    statement: `জিম টিচার তানভিরকে ওজনের রেকর্ড ফাইল দিল — কিছু ঘরে ভুলে শূন্য (\`0\`) বসে গেছে, যেগুলো আসল রেকর্ড নয়। বাকি রেকর্ডগুলোর আপেক্ষিক ক্রম একদম ঠিক রেখে সব শূন্যকে লাইনের শেষে সরাও, তারপর পুরো লাইন ছাপাও।

উদাহরণ: \`0 1 0 3 12 0\` হলে আসল রেকর্ড \`1 3 12\` একই ক্রমে থাকবে, শূন্যগুলো পিছনে — উত্তর \`1 3 12 0 0 0\`।`,
    inputFormat: `প্রথম লাইনে \`n\`। দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা।`,
    outputFormat: `এক লাইনে \`n\`টি সংখ্যা — শূন্য ছাড়া মানগুলো আগের ক্রমে, তারপর সব শূন্য।`,
    constraints: `\`1 <= n <= 200000\`
\`-10^9 <= মান <= 10^9\`।`,
    editorial: `## ধারণা
শূন্য নয় এমন মানগুলো যে ক্রমে আছে, সেই ক্রমেই বাঁ দিকে গুঁজে দিতে হবে। একটা লেখার পয়েন্টার \`l\` রাখো — সে বোঝাবে পরের শূন্য-নয় মানটা কোথায় বসবে। পড়ার পয়েন্টার \`i\` পুরো অ্যারে ঘোরে; \`a[i] != 0\` হলে সেই মানটা \`a[l]\`-এ বসে যাবে আর \`l\` এগোবে। শেষে \`l\` থেকে শেষ পর্যন্ত সব ঘরে শূন্য বসিয়ে দাও। দুই পয়েন্টারই শুধু সামনে চলে — কাজ \`O(n)\`, বাড়তি অ্যারে লাগে না।

## ধাপে ধাপে
1. \`n\` আর সব মান পড়ো।
2. \`l = 0\` ধরে \`i = 0..n-1\` লুপ চালাও: \`a[i] != 0\` হলে \`a[l] = a[i]\` করে \`l += 1\`।
3. লুপ শেষে \`l\` থেকে শেষ পর্যন্ত সব ঘরে \`0\` বসাও।
4. পুরো অ্যারে এক লাইনে ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
a = data[1:]
l = 0
for i in range(n):
    if a[i] != 0:
        a[l] = a[i]
        l += 1
for i in range(l, n):
    a[i] = 0
print(" ".join(map(str, a)))
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\` — এক পাস বসানো, শেষের ঘরগুলো শূন্য করা; মেমোরি \`O(1)\` অতিরিক্ত।

## সাধারণ ভুল
- শূন্যগুলো সরানোর সময় বাকি মানের ক্রম বদলে গেলে রেকর্ড নষ্ট — ক্রম বজায় রাখাই মূল শর্ত।
- শূন্য বসানোর ধাপ ভুলে গিয়ে \`l\`-এর আগের ঘরগুলোতে পুরনো মান রেখে দিলে শেষের সংখ্যাগুলো দুইবার আসে।
- নতুন লিস্ট বানিয়ে করলেও হয়, কিন্তু জায়গায় (in-place) করা কৌশলটা মেমোরি বাঁচায় — দুই পয়েন্টারের এটাই চিরচেনা ব্যবহার।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Two Pointers", "Arrays", "In-Place"],
    tests: [
      { input: "6\n0 1 0 3 12 0\n", expectedOutput: "1 3 12 0 0 0\n", isSample: true },
      { input: "3\n0 0 0\n", expectedOutput: "0 0 0\n", isSample: true },
      { input: "3\n1 2 3\n", expectedOutput: "1 2 3\n", isSample: false },
      { input: "4\n-1 0 -3 0\n", expectedOutput: "-1 -3 0 0\n", isSample: false },
      {
        input: `200000\n${Array.from({ length: 200000 }, (_, i) => (i % 2 === 0 ? 5 : 0)).join(" ")}\n`,
        expectedOutput: `${Array(100000).fill(5).join(" ")} ${Array(100000).fill(0).join(" ")}\n`,
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\nl = 0\nfor i in range(n):\n    if a[i] != 0:\n        a[l] = a[i]\n        l += 1\nfor i in range(l, n):\n    a[i] = 0\nprint(\" \".join(map(str, a)))\n",
  },
  {
    slug: "learn-m3-two-pointers-sliding-window-m2",
    title: "Longest Stretch of Distinct Letters",
    statement: `ক্লাবের উৎসবের ব্যানারে ছোট হাতের ইংরেজি অক্ষরের একটা লম্বা সারি ছাপানো আছে। নুসরাত এমন সবচেয়ে লম্বা টানা অংশ খুঁজছে যেখানে কোনো অক্ষর দুইবার আসে না — সেই অংশটাই ব্যানারের সবচেয়ে "পরিষ্কার" অংশ ধরা হবে। তুমি সেই সবচেয়ে লম্বা অংশের দৈর্ঘ্য বের করো।

উদাহরণ: \`abcabcbb\` হলে সবচেয়ে লম্বা পরিষ্কার অংশ \`abc\` — উত্তর \`3\`।`,
    inputFormat: `এক লাইনে ছোট হাতের ইংরেজি অক্ষরের স্ট্রিং \`s\`।`,
    outputFormat: `এমন সবচেয়ে লম্বা টানা অংশের দৈর্ঘ্য যেখানে সব অক্ষর আলাদা।`,
    constraints: `\`1 <= |s| <= 200000\`
\`s\`-তে শুধু \`a\`-\`z\` আছে।`,
    editorial: `## ধারণা
টানা অংশ মানেই উইন্ডো। জানা থাকলে প্রতিটি অক্ষর শেষ কোথায় দেখা গেছে, উইন্ডোর বাঁ সীমা (\`left\`) কোথায় থাকা উচিত তা এক ধাপেই বলা যায়: বর্তমান অক্ষর \`ch\` আগে উইন্ডোর ভিতরে দেখা গেথে থাকলে \`left\`-কে তার পরের ঘরে টেনে আনতে হবে — নাহলে পুরনোটা রেখে দিলেই \`ch\` দুইবার পড়ে। এই লাফ ছাড়া এক এক করে বাড়ালে \`O(n^2)\` হতো; লাফ দিলে \`left\` কখনো পেছনে যায় না, তাই মোট \`O(n)\`।

## ধাপে ধাপে
1. \`last\` নামে একটা ডিকশনারি নাও — অক্ষর ধরে শেষ পজিশন।
2. \`left = 0\`, \`best = 0\` ধরে \`right = 0..n-1\` লুপ চালাও।
3. \`s[right]\` আগে \`left\` বা তার পরে দেখা থাকলে \`left = last[s[right]] + 1\` করো।
4. \`last[s[right]] = right\` আপডেট করে \`best = max(best, right - left + 1)\` নাও।
5. শেষে \`best\` ছাপাও।

\`\`\`python
import sys
s = sys.stdin.readline().strip()
last = {}
left = 0
best = 0
for right, ch in enumerate(s):
    if ch in last and last[ch] >= left:
        left = last[ch] + 1
    last[ch] = right
    if right - left + 1 > best:
        best = right - left + 1
print(best)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\` — দুই পয়েন্টারই শুধু সামনে চলে; মেমোরি \`O(26)\` — অক্ষর সংখ্যা সীমিত।

## সাধারণ ভুল
- \`left\` আপডেটের শর্তে \`last[ch] >= left\` না যাচাই করলে উইন্ডোর বাইরের পুরনো পজিশনে চলে যায় — \`left\` পেছনে সরে গিয়ে ভুল বড় উত্তর দেয়।
- \`abba\`-র মতো কেসে দ্বিতীয় \`a\` এলে \`left\` কোথায় যাবে সেটা হাতে মিলিয়ে দেখো — টেস্টের এই ধাঁচই ভুল ধরায়।
- প্রতি ধাপে সেট বানিয়ে সব অক্ষর গুনলে \`O(n^2)\`-এ চলে যায় — শেষ পজিশন মনে রাখাই যথেষ্ট।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Sliding Window", "Hash Map", "Strings"],
    tests: [
      { input: "abcabcbb\n", expectedOutput: "3\n", isSample: true },
      { input: "bbbbb\n", expectedOutput: "1\n", isSample: true },
      { input: "pwwkew\n", expectedOutput: "3\n", isSample: false },
      { input: "abba\n", expectedOutput: "2\n", isSample: false },
      { input: "a\n", expectedOutput: "1\n", isSample: false },
      {
        input: `${"abcdefghijklmnopqrstuvwxyz".repeat(7692)}\n`,
        expectedOutput: "26\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ns = sys.stdin.readline().strip()\nlast = {}\nleft = 0\nbest = 0\nfor right, ch in enumerate(s):\n    if ch in last and last[ch] >= left:\n        left = last[ch] + 1\n    last[ch] = right\n    if right - left + 1 > best:\n        best = right - left + 1\nprint(best)\n",
  },
  {
    slug: "learn-m3-two-pointers-sliding-window-m3",
    title: "Count Safe Risk Segments",
    statement: `ক্লাবের ট্রেকিং প্ল্যানে প্রতিদিনের একটা করে ঝুঁকি ফ্যাক্টর লেখা আছে — প্রতিটি ফ্যাক্টর \`1\` বা তার বেশি। টানা কিছু দিনের মিলিত ঝুঁকি হলো সেই দিনগুলোর ফ্যাক্টরের গুণফল। গুণফল \`K\`-এর কম হলে সেই অংশটা নিরাপদ ধরা হয়। মোট কতটা টানা অংশ নিরাপদ, সেটা গোনো।

উদাহরণ: ফ্যাক্টর \`1 2 3 4\` আর \`K = 10\` হলে \`[1]\`, \`[2]\`, \`[3]\`, \`[4]\`, \`[1,2]\`, \`[2,3]\`, \`[1,2,3]\` — মোট \`7\`টা অংশ নিরাপদ।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`K\`; দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা।`,
    outputFormat: `গুণফল \`K\`-এর কম এমন টানা অংশের সংখ্যা।`,
    constraints: `\`1 <= n <= 200000\`
\`1 <= ফ্যাক্টর <= 10^5\`, \`1 <= K <= 10^9\`।`,
    editorial: `## ধারণা
ফ্যাক্টর সব \`1\` বা বড়, তাই উইন্ডোতে নতুন মান যোগ করলে গুণফল কখনো কমে না — এই একদিকমুখী গুণই sliding window চালানোর অনুমতি দেয়। \`right\` বাড়াতে থাকো; গুণফল \`K\` ছাড়ালে \`left\` থেকে ভাগ করে কমাও। উইন্ডো ঠিক হওয়ার পর লক্ষ করো — ডান প্রান্ত \`right\`-এ শেষ হওয়া প্রতিটি নিরাপদ অংশ হলো \`right - left + 1\`টা (শুরু left, left+1, ..., right)। এই গণনাটাই মূল কৌশল: প্রতি ধাপে সব নতুন অংশ এক সূত্রে যোগ হয়।

## ধাপে ধাপে
1. \`n\`, \`K\` আর সব মান পড়ো; \`left = 0\`, \`prod = 1\`, \`cnt = 0\`।
2. \`right = 0..n-1\`: \`prod *= a[right]\`।
3. \`prod >= K\` হলে \`prod //= a[left]\` করে \`left += 1\` — যতক্ষণ শর্ত না ভাঙে (অবশ্যই \`left <= right\` সীমায়)।
4. \`cnt += right - left + 1\` করো; শেষে \`cnt\` ছাপাও।

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, k = data[0], data[1]
a = data[2:]
left = 0
prod = 1
cnt = 0
for right in range(n):
    prod *= a[right]
    while prod >= k and left <= right:
        prod //= a[left]
        left += 1
    cnt += right - left + 1
print(cnt)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(n)\` — দুই পয়েন্টারই সর্বোচ্চ \`n\` বার চলে; মেমোরি \`O(1)\` অতিরিক্ত। গুণফল \`K\` ছাড়ানোর পর থেকেই বড় হয়, তাই বড় হয়ে যাওয়ার সীমা ছোট।

## সাধারণ ভুল
- \`K = 1\` হলে এক ঘরের উইন্ডোও অনিরাপদ (গুণফল সর্বনিম্ন \`1\`) — উত্তর \`0\`; \`while\`-এর \`left <= right\` শর্তটা না দিলে সীমা পেরিয়ে যায়।
- প্রতিটি অংশ আলাদা করে গুণ করে গুনলে \`O(n^2)\` — নতুন প্রান্তে শেষ হওয়া অংশগুলোর সংখ্যাই যোগ করো।
- ফ্যাক্টর শূন্য বা একের কম হলে "ভাগ করে কমাও" কৌশলটা ভাঙে — সে কারণেই শর্তে প্রতিটি মান \`1\` বা বেশি।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Sliding Window", "Counting"],
    tests: [
      { input: "4 10\n1 2 3 4\n", expectedOutput: "7\n", isSample: true },
      { input: "3 5\n1 2 3\n", expectedOutput: "4\n", isSample: true },
      { input: "3 1\n1 1 1\n", expectedOutput: "0\n", isSample: false },
      { input: "3 3\n2 2 2\n", expectedOutput: "3\n", isSample: false },
      { input: "1 2\n1\n", expectedOutput: "1\n", isSample: false },
      {
        input: `200000 1000000000\n${Array(200000).fill(1).join(" ")}\n`,
        expectedOutput: "20000100000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, k = data[0], data[1]\na = data[2:]\nleft = 0\nprod = 1\ncnt = 0\nfor right in range(n):\n    prod *= a[right]\n    while prod >= k and left <= right:\n        prod //= a[left]\n        left += 1\n    cnt += right - left + 1\nprint(cnt)\n",
  },
  {
    slug: "learn-m3-two-pointers-sliding-window-h2",
    title: "Smallest Banner Cover",
    statement: `উৎসবের মূল ব্যানারে ছোট হাতের ইংরেজি অক্ষরের একটা লম্বা সারি \`s\` ছাপানো আছে। প্রচারণা দলের ছোট স্লোগান \`t\`-ও হাতে আছে — ব্যানার থেকে একটা টানা অংশ কেটে সেই অংশে অন্তত \`t\`-এর সব অক্ষর থাকতে হবে (প্রতিটি অক্ষর যে সংখ্যকবার \`t\`-তে আছে, কাটা অংশে তার চেয়ে কম নয়)। এমন সবচেয়ে ছোট টানা অংশটা কেটে নাও; একাধিক সবচেয়ে ছোট অংশ থাকলে যেটা সবচেয়ে বাঁ দিকে শুরু হয় সেটাই ছাপাও। কোনো অংশই না মেলে না হলে \`-1\` ছাপাও।

উদাহরণ: \`s = adobecodebanc\`, \`t = abc\` হলে সবচেয়ে ছোট অংশ \`banc\`।`,
    inputFormat: `প্রথম লাইনে স্ট্রিং \`s\`, দ্বিতীয় লাইনে স্ট্রিং \`t\` — দুটোতেই ছোট হাতের ইংরেজি অক্ষর।`,
    outputFormat: `শর্ত পূরণ করা সবচেয়ে ছোট (বাঁ দিকের) টানা অংশ, না পেলে \`-1\`।`,
    constraints: `\`1 <= |t| <= |s| <= 200000\`।`,
    editorial: `## ধারণা
যেকোনো সম্ভাব্য উত্তর একটা উইন্ডো, তাই সব উইন্ডো ধরে দেখার চেয়ে দক্ষ উপায়: \`right\` বাড়িয়ে প্রয়োজনীয় অক্ষর জোগাড় করো, জোগাড় শেষ হলে \`left\` টেনে উইন্ডো যত পারা যায় ছোট করো। \`need\` ডিকশনারিতে রাখো \`t\`-এর প্রতিটি অক্ষর কতটা বাকি দরকার — ঋণাত্মক মান মানে ওই অক্ষর বাড়তি আছে; আর \`missing\` হলো মোট কতটা অক্ষর এখনো লাগবে। উইন্ডো সম্পূর্ণ হলে \`left\`-এর দিকের বাড়তি অক্ষরগুলো ফেলে দাও — \`need[s[left]] < 0\` মানে ফেলে দেওয়া নিরাপদ। প্রতি পয়েন্টার কেবল সামনে চলে, তাই \`O(|s|)\`। কঠোর ছোট (\`<\`) শর্তে সেরা আপডেট করলে সমান দৈর্ঘ্যে বাঁ দিকেরটাই থেকে যায়।

## ধাপে ধাপে
1. \`need = t\`-এর কাউন্টার, \`missing = |t|\`; \`left = 0\`, সেরা উইন্ডো খালি।
2. প্রতি \`right\`-এ \`need[s[right]] -= 1\` করো; মান এখনো অ-ঋণাত্মক ছিল মানে একটা দরকারি অক্ষর পাওয়া গেছে — তখন \`missing -= 1\`।
3. \`missing == 0\` হলে \`need[s[left]] < 0\` থাকা পর্যন্ত \`left\` বাড়াও (বাড়তি অক্ষর ফেলে দাও)।
4. টানা উইন্ডো \`s[left..right]\` এখন সবচেয়ে ছোট যেটা \`right\`-এ শেষ হয় — আগের সেরার চেয়ে ছোট হলে সেটাই নতুন সেরা।
5. শেষে সেরা অংশ ছাপাও, না পেলে \`-1\`।

\`\`\`python
import sys
from collections import Counter
lines = sys.stdin.read().split()
s, t = lines[0], lines[1]
need = Counter(t)
missing = len(t)
best = None
left = 0
for right, ch in enumerate(s):
    if need[ch] > 0:
        missing -= 1
    need[ch] -= 1
    if missing == 0:
        while need[s[left]] < 0:
            need[s[left]] += 1
            left += 1
        if best is None or right - left + 1 < len(best):
            best = s[left:right + 1]
print(best if best is not None else -1)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(|s| + |t|)\` — দুই পয়েন্টারই শুধু সামনে চলে, ডিকশনারি কাজ \`O(1)\`; মেমোরি \`O(26)\`।

## সাধারণ ভুল
- \`need[ch] > 0\` যাচাই না করে প্রতিবার \`missing -= 1\` করলে বাড়তি অক্ষরও মেটানো ধরা হয় — উইন্ডো আগেই "সম্পূর্ণ" দেখায়।
- \`missing == 0\`-এর পরেও সব সেরা উইন্ডো আপডেট করতে ভুলে গেলে প্রথম মেলা বড় অংশটাই থেকে যায়।
- টাই-এ বাঁ দিকের অংশ রাখতে কঠোর \`<\` দিয়ে আপডেট করো — \`<=\` দিলে শেষেরটা বসে যায়, নমুনার ফল এলোমেলো হয়।
- \`t\`-এ যে অক্ষর নেই সেগুলোর \`need\` কাউন্টার শূন্যই থাকে — ওগুলো কাটা অংশে থাকলেও ক্ষতি নেই, কিন্তু যাচাইয়ে ধরা যাবে না, তাই শর্তটা হুবহু মিলিয়ে লেখো।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Sliding Window", "Hash Map", "Strings"],
    tests: [
      { input: "adobecodebanc\nabc\n", expectedOutput: "banc\n", isSample: true },
      { input: "a\naa\n", expectedOutput: "-1\n", isSample: true },
      { input: "abc\nabc\n", expectedOutput: "abc\n", isSample: false },
      { input: "baab\nab\n", expectedOutput: "ba\n", isSample: false },
      { input: "xyz\nq\n", expectedOutput: "-1\n", isSample: false },
      {
        input: `${"x".repeat(199998)}ab\nab\n`,
        expectedOutput: "ab\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import Counter\nlines = sys.stdin.read().split()\ns, t = lines[0], lines[1]\nneed = Counter(t)\nmissing = len(t)\nbest = None\nleft = 0\nfor right, ch in enumerate(s):\n    if need[ch] > 0:\n        missing -= 1\n    need[ch] -= 1\n    if missing == 0:\n        while need[s[left]] < 0:\n            need[s[left]] += 1\n            left += 1\n        if best is None or right - left + 1 < len(best):\n            best = s[left:right + 1]\nprint(best if best is not None else -1)\n",
  },
];
