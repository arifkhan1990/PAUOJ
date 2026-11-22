import type { SeedProblem } from "../../seed-problems";
import { newlineOutput } from "../generated-tests";

export const MST_DSU_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m4-mst-dsu-g1",
    title: "Club Team Queries",
    statement: `সাদিয়া কোডিং ক্লাবে নতুন সদস্যদের দলে ভাগ করছে। \`n\` জন সদস্য (১ থেকে \`n\`) আর \`q\`টি অপারেশন দেওয়া থাকে:
\`1 a b\` — \`a\` আর \`b\` এখন থেকে একই দলে; \`2 a b\` — \`a\` আর \`b\` একই দলে কি না জিজ্ঞেস করা হয়। প্রতিটি \`2\` অপারেশনের উত্তর \`YES\` বা \`NO\` এক করে লাইনে ছাপাও।`,
    inputFormat: `প্রথম লাইনে \`n q\`; পরের \`q\` লাইনে অপারেশন \`1 a b\` বা \`2 a b\`।`,
    outputFormat: `শুধু \`2\` অপারেশনের উত্তরগুলো এক করে লাইনে — \`YES\` বা \`NO\`।`,
    constraints: `\`1 <= n <= 100000\`, \`1 <= q <= 100000\``,
    editorial: `## ধারণা
এটাই DSU-র কাজ: প্রতিটি সদস্য নিজেই নিজের দলের নেতা; \`1 a b\` মানে দুই দলের নেতাকে জোড়া দেওয়া, \`2 a b\` মানে দুজনের নেতা এক কিনা যাচাই। \`find\`-এ path compression থাকলে প্রতিটি অপারেশন প্রায় \`O(1)\`।

## ধাপে ধাপে
1. \`parent[i] = i\` দিয়ে DSU শুরু করো; \`out\` লিস্ট খালি রাখো।
2. প্রতিটি অপারেশন: \`1 a b\` হলে \`parent[find(a)] = find(b)\`।
3. \`2 a b\` হলে \`find(a) == find(b)\` যাচাই করে \`YES\`/\`NO\` সংগ্রহ করো।
4. সব উত্তর এক এক লাইনে ছাপাও।

\`\`\`python
import sys
d = list(map(int, sys.stdin.read().split()))
n, q = d[0], d[1]
p = list(range(n+1))
def find(x):
    while p[x] != x:
        p[x] = p[p[x]]; x = p[x]
    return x
out = []
for i in range(q):
    c, a, b = d[2+3*i], d[3+3*i], d[4+3*i]
    if c == 1:
        p[find(a)] = find(b)
    else:
        out.append("YES" if find(a) == find(b) else "NO")
print("\\n".join(out))
\`\`\`

## কমপ্লেক্সিটি
সময় প্রতি অপারেশন প্রায় \`O(alpha(n))\`, মোট \`O(q)\`-এর কাছে; মেমোরি \`O(n)\`।

## সাধারণ ভুল
- \`p[a] == p[b]\` সরাসরি যাচাই — মাঝের পথ এখনো যুক্ত না, ভুল \`NO\`; সবসময় \`find\` দিয়ে রুট মিলাও।
- path compression ছাড়া লাম্বা চেইন হলে \`find\` \`O(n)\` হয়, বড় \`q\`-এ TLE।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "DSU", "Union Find"],
    tests: [
      { input: "5 6\n1 1 2\n2 1 2\n2 1 3\n1 2 3\n2 1 3\n2 4 5\n", expectedOutput: "YES\nNO\nYES\nNO\n", isSample: true },
      { input: "1 1\n2 1 1\n", expectedOutput: "YES\n", isSample: true },
      { input: "4 4\n2 1 4\n1 1 4\n2 1 4\n2 2 3\n", expectedOutput: "NO\nYES\nNO\n", isSample: false },
      { input: "3 4\n1 1 2\n2 1 3\n1 2 3\n2 1 3\n", expectedOutput: "NO\nYES\n", isSample: false },
      { input: `100000 100000\n${Array.from({ length: 50000 }, (_, i) => `1 ${i + 1} ${i + 2}`).join("\n")}\n${Array.from({ length: 50000 }, (_, i) => `2 1 ${i + 1}`).join("\n")}\n`, expectedOutput: newlineOutput(Array(50000).fill("YES")), isSample: false },
      { input: `100000 100000\n${Array.from({ length: 50000 }, (_, i) => `1 ${i + 1} ${i + 2}`).join("\n")}\n${Array.from({ length: 50000 }, (_, i) => `2 ${i + 1} ${i + 50001}`).join("\n")}\n`, expectedOutput: newlineOutput(["YES", ...Array(49999).fill("NO")]), isSample: false },
    ],
    referencePython: "import sys\nd = list(map(int, sys.stdin.read().split()))\nn, q = d[0], d[1]\np = list(range(n+1))\ndef find(x):\n    while p[x] != x:\n        p[x] = p[p[x]]\n        x = p[x]\n    return x\nout = []\nfor i in range(q):\n    c, a, b = d[2+3*i], d[3+3*i], d[4+3*i]\n    if c == 1:\n        p[find(a)] = find(b)\n    else:\n        out.append('YES' if find(a) == find(b) else 'NO')\nprint('\\n'.join(out))\n",
  },
  {
    slug: "learn-m4-mst-dsu-g2",
    title: "Campus Network Cables",
    statement: `তানভির ক্যাম্পাসের \`n\`টি ল্যাব যোগ করার জন্য কেবল পাতাচ্ছে; \`m\`টি সম্ভাব্য কেবলের খরচ দেওয়া আছে। সব ল্যাব যুক্ত রেখে মোট খরচ সবচেয়ে কম করতে হবে, আর কোনো লুপ থাকবে না (প্রতিটি ল্যাব ঠিক একটামাত্র কেবল দিয়ে নেটওয়ার্কে)।
ধরে নাও প্রদত্ত কেবল দিয়েই সব ল্যাব যুক্ত করা যায়। মোট ন্যূনতম খরচ কত বের করে ছাপাও।`,
    inputFormat: `প্রথম লাইনে \`n m\`, পরের \`m\` লাইনে প্রতিটিতে \`u v w\` — \`u\` আর \`v\` যুক্ত করলে খরচ \`w\`।`,
    outputFormat: `এক লাইনে একটা সংখ্যা — ন্যূনতম মোট খরচ।`,
    constraints: `\`1 <= n <= 100000\`, \`0 <= m <= 200000\`, \`1 <= w <= 10^9\`
সব ল্যাব যুক্ত করা সম্ভব।`,
    editorial: `## ধারণা
Kruskal: সব edge ওজন অনুযায়ী সাজিয়ে এক এক করে নাও। দুই প্রান্ত আলাদা দলে থাকলে জোড়া দিলে সাইকেল হয় না খরচ যোগ করো, একই দলে থাকলে বাদ দাও। DSU ছাড়া প্রতিটি edge-এ সাইকেল যাচাই করা যায় না।

## ধাপে ধাপে
1. edge তালিকা \`(w, u, v)\` আকারে নিয়ে ওজন অনুযায়ী \`sort\` করো।
2. \`parent[i] = i\` দিয়ে DSU শুরু করো, \`total = 0\`।
3. প্রতিটি \`(w, u, v)\`: \`find(u) != find(v)\` হলে \`union\` করে \`total += w\`।
4. \`total\` ছাপাও — \`n - 1\`টা edge নিয়েই শেষ হবে।

\`\`\`python
import sys
d = list(map(int, sys.stdin.read().split()))
n, m = d[0], d[1]
e = sorted((d[4+3*i], d[2+3*i], d[3+3*i]) for i in range(m))
p = list(range(n+1))
def find(x):
    while p[x] != x:
        p[x] = p[p[x]]; x = p[x]
    return x
total = 0
for w, u, v in e:
    ru, rv = find(u), find(v)
    if ru != rv:
        p[ru] = rv; total += w
print(total)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(m log m)\` (sort ই প্রধান), মেমোরি \`O(n + m)\`।

## সাধারণ ভুল
- tuple-এ ওজন আগে না রাখলে sort প্রান্ত অনুযায়ী হয়ে যায় — \`(w, u, v)\` আকারটাই মনে রেখো।
- একই দলের edge যোগ করলে সাইকেল তৈরি হয় এবং খরচ বাড়ে — \`find\` মিলিয়ে দেখেই বাদ দাও।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "MST", "Kruskal"],
    tests: [
      { input: "4 5\n1 2 1\n2 3 2\n3 4 3\n1 4 10\n1 3 4\n", expectedOutput: "6\n", isSample: true },
      { input: "2 1\n1 2 5\n", expectedOutput: "5\n", isSample: true },
      { input: "3 3\n1 2 7\n2 3 7\n1 3 7\n", expectedOutput: "14\n", isSample: false },
      { input: "1 0\n", expectedOutput: "0\n", isSample: false },
      { input: "4 3\n1 2 1\n2 3 1\n3 4 1\n", expectedOutput: "3\n", isSample: false },
      { input: `100000 99999\n${Array.from({ length: 99999 }, (_, i) => `1 ${i + 2} ${i + 2}`).join("\n")}\n`, expectedOutput: "5000049999\n", isSample: false },
    ],
    referencePython: "import sys\nd = list(map(int, sys.stdin.read().split()))\nn, m = d[0], d[1]\ne = sorted((d[4+3*i], d[2+3*i], d[3+3*i]) for i in range(m))\np = list(range(n+1))\ndef find(x):\n    while p[x] != x:\n        p[x] = p[p[x]]\n        x = p[x]\n    return x\ntotal = 0\nfor w, u, v in e:\n    ru, rv = find(u), find(v)\n    if ru != rv:\n        p[ru] = rv\n        total += w\nprint(total)\n",
  },
  {
    slug: "learn-m4-mst-dsu-e1",
    title: "Extra Bridges Needed",
    statement: `রফি দ্বীপের ম্যাপে দেখছে \`n\`টি গ্রাম আর \`m\`টি বিদ্যমান সেতু; অনেক গ্রাম এখনো একে অপরের কাছে যাওয়া যায় না। নতুন সেতু একটা যোগ করলে দুই গ্রাম সরাসরি যুক্ত হয়।
সব গ্রাম একসাথে যুক্ত করতে কমিয়েও কতটা নতুন সেতু লাগবে? ধরো বিদ্যমান সেতুগুলো কাজে লাগানোই যাবে।`,
    inputFormat: `প্রথম লাইনে \`n m\`, পরের \`m\` লাইনে প্রতিটিতে \`u v\` — বিদ্যমান সেতু।`,
    outputFormat: `এক লাইনে একটা পূর্ণসংখ্যা — নতুন সেতুর ন্যূনতম সংখ্যা।`,
    constraints: `\`1 <= n <= 100000\`, \`0 <= m <= 200000\``,
    editorial: `## ধারণা
বিদ্যমান সেতুগুলো যে \`k\` আলাদা অংশে গ্রামগুলো ভাগ করে, সেগুলো যুক্ত করতে ঠিক \`k - 1\`টা নতুন সেতু লাগবে — একটা সেতু দুই অংশ মেলায়, ধারাবাহিকভাবে সব মিলে। \`k\` পেতে DSU দিয়ে সব edge union করে আলাদা রুট গোনা যায়।

## ধাপে ধাপে
1. \`parent[i] = i\` দিয়ে DSU শুরু করো।
2. প্রতিটি \`u v\`-এ \`parent[find(u)] = find(v)\` করো।
3. \`i = 1..n\`-এর \`find(i)\` একটা set-এ রেখে আলাদা অংশ সংখ্যা \`k\` বের করো।
4. \`k - 1\` ছাপাও (একা গ্রামে \`k = 1\` → \`0\`)।

\`\`\`python
import sys
d = list(map(int, sys.stdin.read().split()))
n, m = d[0], d[1]
p = list(range(n+1))
def find(x):
    while p[x] != x:
        p[x] = p[p[x]]; x = p[x]
    return x
for i in range(m):
    u, v = d[2+2*i], d[3+2*i]
    p[find(u)] = find(v)
print(len({find(i) for i in range(1, n+1)}) - 1)
\`\`\`

## কমপ্লেক্সিটি
সময় প্রায় \`O(n + m)\`, মেমোরি \`O(n)\`।

## সাধারণ ভুল
- \`m = 0\` হলে প্রতিটি গ্রাম আলাদা, উত্তর \`n - 1\` — শূন্য নয়।
- সেতুর সংখ্যা গোনার জায়গায় union-এর সংখ্যা গুনা — ডুপ্লিকেট/একই দলের edge গোনা হয় না, ভুল হয়।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "DSU", "Connected Components"],
    tests: [
      { input: "5 3\n1 2\n2 3\n4 5\n", expectedOutput: "1\n", isSample: true },
      { input: "1 0\n", expectedOutput: "0\n", isSample: true },
      { input: "6 0\n", expectedOutput: "5\n", isSample: false },
      { input: "3 1\n1 2\n", expectedOutput: "1\n", isSample: false },
      { input: "100000 0\n", expectedOutput: "99999\n", isSample: false },
      { input: `100000 99999\n${Array.from({ length: 99999 }, (_, i) => `${i + 1} ${i + 2}`).join("\n")}\n`, expectedOutput: "0\n", isSample: false },
    ],
    referencePython: "import sys\nd = list(map(int, sys.stdin.read().split()))\nn, m = d[0], d[1]\np = list(range(n+1))\ndef find(x):\n    while p[x] != x:\n        p[x] = p[p[x]]\n        x = p[x]\n    return x\nfor i in range(m):\n    u, v = d[2+2*i], d[3+2*i]\n    p[find(u)] = find(v)\nprint(len({find(i) for i in range(1, n+1)}) - 1)\n",
  },
  {
    slug: "learn-m4-mst-dsu-m1",
    title: "Power Grid with Old Lines",
    statement: `নুসরাতের শহরে \`m\`টি পুরনো বিদ্যুৎ লাইন আগে থেকেই আছে (খরচ শূন্য), আর \`k\`টি নতুন লাইন তৈরি করা যায় — প্রতিটির খরচ \`w\`। \`n\`টি শহর সব যুক্ত করতে হবে।
ন্যূনতম মোট খরচ কত? যেকোনোভাবে সব শহর যুক্ত করা সম্ভব না হলে \`-1\` ছাপাও।`,
    inputFormat: `প্রথম লাইনে \`n m k\`; পরের \`m\` লাইনে পুরনো লাইন \`u v\`; এরপরের \`k\` লাইনে নতুন লাইন \`u v w\`।`,
    outputFormat: `ন্যূনতম মোট খরচ, অসম্ভব হলে \`-1\`।`,
    constraints: `\`1 <= n <= 100000\`, \`0 <= m <= 100000\`, \`0 <= k <= 200000\`, \`1 <= w <= 10^9\``,
    editorial: `## ধারণা
পুরনো লাইনগুলো আগে union করে ফেলো — সেগুলো বিনামূল্যে দল মেলায়। তারপর নতুন লাইনগুলো Kruskal-এর মতো ওজন অনুযায়ী সাজিয়ে যোগ করো। শেষে সব শহর এক রুটে না থাকলে অসম্ভব — \`-1\`।

## ধাপে ধাপে
1. \`parent\` দিয়ে DSU শুরু করে \`m\`টি পুরনো লাইন union করো (খরচ যোগ নয়)।
2. \`k\`টি নতুন লাইন \`(w, u, v)\` করে ওজন অনুযায়ী \`sort\` করো।
3. আলাদা দলের edge দেখলে union করে \`total += w\`।
4. শেষে আলাদা রুট সংখ্যা ১ হলে \`total\`, না হলে \`-1\`।

\`\`\`python
import sys
d = list(map(int, sys.stdin.read().split()))
n, m, k = d[0], d[1], d[2]
p = list(range(n+1))
def find(x):
    while p[x] != x:
        p[x] = p[p[x]]; x = p[x]
    return x
for i in range(m):
    u, v = d[3+2*i], d[4+2*i]
    p[find(u)] = find(v)
base = 3 + 2*m
e = sorted((d[base+3*i+2], d[base+3*i], d[base+3*i+1]) for i in range(k))
total = 0
for w, u, v in e:
    ru, rv = find(u), find(v)
    if ru != rv:
        p[ru] = rv; total += w
print(total if len({find(i) for i in range(1, n+1)}) == 1 else -1)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O((m + k) log k)\`, মেমোরি \`O(n + k)\`।

## সাধারণ ভুল
- পুরনো লাইনও খরচসহ ধরলে উত্তর বাড়ে — সেগুলো আগে union, খরচ শূন্য।
- শেষে শুধু \`total\` দেখে দিলে অসম্ভব কেসে \`0\` ছাপায়; রুট সংখ্যা যাচাই করতে হবে।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "MST", "Kruskal", "DSU"],
    tests: [
      { input: "4 1 3\n1 2\n2 3 5\n3 4 6\n1 4 100\n", expectedOutput: "11\n", isSample: true },
      { input: "3 0 0\n", expectedOutput: "-1\n", isSample: true },
      { input: "2 1 0\n1 2\n", expectedOutput: "0\n", isSample: false },
      { input: "4 1 2\n1 2\n1 3 5\n1 3 6\n", expectedOutput: "-1\n", isSample: false },
      { input: `100000 99999 0\n${Array.from({ length: 99999 }, (_, i) => `${i + 1} ${i + 2}`).join("\n")}\n`, expectedOutput: "0\n", isSample: false },
      { input: `100000 0 99999\n${Array.from({ length: 99999 }, (_, i) => `${i + 1} ${i + 2} 1`).join("\n")}\n`, expectedOutput: "99999\n", isSample: false },
    ],
    referencePython: "import sys\nd = list(map(int, sys.stdin.read().split()))\nn, m, k = d[0], d[1], d[2]\np = list(range(n+1))\ndef find(x):\n    while p[x] != x:\n        p[x] = p[p[x]]\n        x = p[x]\n    return x\nfor i in range(m):\n    u, v = d[3+2*i], d[4+2*i]\n    p[find(u)] = find(v)\nbase = 3 + 2*m\ne = sorted((d[base+3*i+2], d[base+3*i], d[base+3*i+1]) for i in range(k))\ntotal = 0\nfor w, u, v in e:\n    ru, rv = find(u), find(v)\n    if ru != rv:\n        p[ru] = rv\n        total += w\nprint(total if len({find(i) for i in range(1, n+1)}) == 1 else -1)\n",
  },
  {
    slug: "learn-m4-mst-dsu-h1",
    title: "Mountain Toll Path",
    statement: `সাদিয়া পাহাড়ের ম্যাপে যাচ্ছে উপর-বাম কোণ (\`1, 1\`) থেকে নিচ-ডান কোণ (\`h, w\`)। প্রতিটি ঘরে একটা টোল লেখা আছে, আর পথের খরচ হলো পথে পড়া সর্বোচ্চ টোল (শুরু ও শেষ ঘরসহ)। চলা যায় উপর-নিচ-বাম-ডান — চতুর্দিকে।
এমন পথের মধ্যে সবচেয়ে কম খরচ কত বের করে ছাপাও।`,
    inputFormat: `প্রথম লাইনে \`h w\`, পরের \`h\` লাইনে প্রতিটিতে \`w\` টি পূর্ণসংখ্যা — ঘরের টোল।`,
    outputFormat: `এক লাইনে একটা সংখ্যা — ন্যূনতম সর্বোচ্চ টোল।`,
    constraints: `\`1 <= h, w <= 300\`, \`h * w <= 90000\`, \`1 <= toll <= 10^9\``,
    editorial: `## ধারণা
"সর্বোচ্চ টোল কম করা" মানে টোল বাড়ার ধারায় ঘর যোগ করা — ঠিক Kruskal-এর মতো। ঘরগুলো টোল অনুযায়ী সাজিয়ে ছোট থেকে বড় "সক্রিয়" করো; পাশাপাশি সক্রিয় ঘরগুলো DSU দিয়ে যোগ করো। যে মুহূর্তে শুরু ও শেষ ঘর এক দলে আসে, তার টোলই উত্তর — কারণ তার ছোট কোনো ঘর দিয়ে পথ নেই।

## ধাপে ধাপে
1. সব ঘর \`(toll, index)\` আকারে নিয়ে টোল অনুযায়ী \`sort\` করো, \`seen\` অ্যারে খালি।
2. ক্রমানুসারে ঘর \`idx\` সক্রিয় করে ৪ পাশের সক্রিয় ঘরের সাথে \`union\` করো।
3. প্রতিটি ধাপের পর \`find(শুরু) == find(শেষ)\` যাচাই করো; মিললে বর্তমান টোল ছাপিয়ে থামো।
4. একাধিক ঘর থাকলেও উত্তর নিশ্চিত — প্রতিটি ঘর একবারই সক্রিয় হয়।

\`\`\`python
import sys
d = list(map(int, sys.stdin.read().split()))
h, w = d[0], d[1]
v = d[2:2+h*w]
p = list(range(h*w))
def find(x):
    while p[x] != x:
        p[x] = p[p[x]]; x = p[x]
    return x
seen = [False]*(h*w)
for idx in sorted(range(h*w), key=v.__getitem__):
    r, c = divmod(idx, w)
    seen[idx] = True
    for nr, nc in ((r-1, c), (r+1, c), (r, c-1), (r, c+1)):
        if 0 <= nr < h and 0 <= nc < w and seen[nr*w+nc]:
            p[find(nr*w+nc)] = find(idx)
    if find(0) == find(h*w-1):
        print(v[idx]); break
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(h*w*log(h*w))\` (sort + union), মেমোরি \`O(h*w)\` — ৯০ হাজার ঘরে সহজে চলে।

## সাধারণ ভুল
- প্রতিটি ঘর থেকে BFS চালিয়ে সর্বোচ্চ মাপা (minimax BFS) করলেও চলবে, কিন্তু ঘর সাজানো না করলে সময় বেশি লাগে।
- শুরু/শেষ ঘর ডায়াগনালে সংযোগ ধরে নেওয়া — শুধু ৪ দিক ছুঁয়ে যাওয়া যায়।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Graphs", "DSU", "Grid", "Bottleneck"],
    tests: [
      { input: "2 2\n1 5\n9 2\n", expectedOutput: "5\n", isSample: true },
      { input: "1 1\n7\n", expectedOutput: "7\n", isSample: true },
      { input: "1 4\n3 1 4 1\n", expectedOutput: "4\n", isSample: false },
      { input: "3 3\n1 100 1\n1 100 1\n1 100 1\n", expectedOutput: "100\n", isSample: false },
      { input: `300 300\n${Array.from({ length: 300 }, () => Array(300).fill(42).join(" ")).join("\n")}\n`, expectedOutput: "42\n", isSample: false },
      { input: `300 300\n${Array.from({ length: 300 }, () => Array.from({ length: 300 }, (_, c) => c + 1).join(" ")).join("\n")}\n`, expectedOutput: "300\n", isSample: false },
    ],
    referencePython: "import sys\nd = list(map(int, sys.stdin.read().split()))\nh, w = d[0], d[1]\nv = d[2:2+h*w]\np = list(range(h*w))\ndef find(x):\n    while p[x] != x:\n        p[x] = p[p[x]]\n        x = p[x]\n    return x\nseen = [False]*(h*w)\nfor idx in sorted(range(h*w), key=v.__getitem__):\n    r, c = divmod(idx, w)\n    seen[idx] = True\n    for nr, nc in ((r-1, c), (r+1, c), (r, c-1), (r, c+1)):\n        if 0 <= nr < h and 0 <= nc < w and seen[nr*w+nc]:\n            p[find(nr*w+nc)] = find(idx)\n    if find(0) == find(h*w-1):\n        print(v[idx])\n        break\n",
  },
  {
    slug: "learn-m4-mst-dsu-x1",
    title: "Roads Over Time",
    statement: `রফি দেশের নতুন সড়ক নির্মাণ দেখছে এক এক করে। \`n\`টি শহর আর \`m\`টি সড়ক ক্রমানুসারে তৈরি হবে — প্রতিটি পরের লাইনে একটা করে সড়ক (\`u v\`)।
প্রতিটি সড়ক তৈরির পরই বলো সব শহর এখন একে অপরের কাছে যাওয়া যায় কি না — প্রতিটি ধাপে \`YES\` বা \`NO\` এক করে লাইনে ছাপাও।`,
    inputFormat: `প্রথম লাইনে \`n m\`, পরের \`m\` লাইনে প্রতিটিতে \`u v\` — সড়ক যোগ হবে সেই ক্রমে।`,
    outputFormat: `প্রতিটি সড়কের পর \`m\` লাইন — \`YES\` বা \`NO\`।`,
    constraints: `\`1 <= n <= 100000\`, \`1 <= m <= 100000\``,
    editorial: `## ধারণা
সড়ক যোগ হলে দুই শহর আলাদা দলে থাকলে union করো, একই দলে থাকলে কিছু হয় না (সাইকেল)। প্রতিটি ধাপে \`components\` এক হলেই সব শহর যুক্ত — পুরো গ্রাফ আবার ঘোরার দরকার নেই।

## ধাপে ধাপে
1. \`parent\` দিয়ে DSU শুরু করো, \`components = n\`, \`out\` খালি।
2. প্রতিটি \`u v\`: \`find\` করে আলাদা হলে union করে \`components -= 1\`।
3. প্রতিটি ধাপের পর \`components == 1\` হলে \`YES\`, না হলে \`NO\` সংগ্রহ করো।
4. সব উত্তর এক এক লাইনে ছাপাও।

\`\`\`python
import sys
d = list(map(int, sys.stdin.read().split()))
n, m = d[0], d[1]
p = list(range(n+1))
def find(x):
    while p[x] != x:
        p[x] = p[p[x]]; x = p[x]
    return x
out = []
comp = n
for i in range(m):
    u, v = d[2+2*i], d[3+2*i]
    ru, rv = find(u), find(v)
    if ru != rv:
        p[ru] = rv; comp -= 1
    out.append("YES" if comp == 1 else "NO")
print("\\n".join(out))
\`\`\`

## কমপ্লেক্সিটি
সময় প্রায় \`O(n + m)\`, মেমোরি \`O(n)\`।

## সাধারণ ভুল
- প্রতিটি ধাপে \`find\` সব শহরের জন্য চালালে \`O(n*m)\` — শুধু counter ধরো।
- ডুপ্লিকেট সড়ক (\`1 2\` বারবার) components কমায় না — আলাদা দল যাচাই না করলে ভুল \`YES\` দেয়।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "DSU", "Online Connectivity"],
    tests: [
      { input: "4 4\n1 2\n2 3\n3 4\n1 4\n", expectedOutput: "NO\nNO\nYES\nYES\n", isSample: true },
      { input: "2 1\n1 2\n", expectedOutput: "YES\n", isSample: true },
      { input: "3 2\n1 2\n2 3\n", expectedOutput: "NO\nYES\n", isSample: false },
      { input: "3 1\n1 2\n", expectedOutput: "NO\n", isSample: false },
      { input: `100000 99999\n${Array.from({ length: 99999 }, (_, i) => `${i + 1} ${i + 2}`).join("\n")}\n`, expectedOutput: newlineOutput([...Array(99998).fill("NO"), "YES"]), isSample: false },
      { input: `100000 100000\n${Array.from({ length: 100000 }, () => "1 2").join("\n")}\n`, expectedOutput: newlineOutput(Array(100000).fill("NO")), isSample: false },
    ],
    referencePython: "import sys\nd = list(map(int, sys.stdin.read().split()))\nn, m = d[0], d[1]\np = list(range(n+1))\ndef find(x):\n    while p[x] != x:\n        p[x] = p[p[x]]\n        x = p[x]\n    return x\nout = []\ncomp = n\nfor i in range(m):\n    u, v = d[2+2*i], d[3+2*i]\n    ru, rv = find(u), find(v)\n    if ru != rv:\n        p[ru] = rv\n        comp -= 1\n    out.append('YES' if comp == 1 else 'NO')\nprint('\\n'.join(out))\n",
  },
  {
    slug: "learn-m4-mst-dsu-x2",
    title: "Network Threshold",
    statement: `তানভির নেটওয়ার্ক আপডেটে সীমা ঠিক করতে চায়: কোনো সবচেয়ে ছোট ওজন \`W\` ধরে শুধু \`w <= W\` ওয়ালা সব রাস্তা নিলেই সব \`n\`টি শহর যুক্ত হয়ে যায়? ওজন \`W\` ওয়ালা রাস্তাও ধরা হবে।
এমন \`W\`-এর ন্যূনতম মান বের করো। শহর একটাই হলে ইতিমধ্যেই যুক্ত, উত্তর \`0\`; সব রাস্তা দিয়েও যুক্ত করা না গেলে \`-1\`।`,
    inputFormat: `প্রথম লাইনে \`n m\`, পরের \`m\` লাইনে প্রতিটিতে \`u v w\` — আনডিরেক্টেড রাস্তা।`,
    outputFormat: `এক লাইনে একটা সংখ্যা — ন্যূনতম \`W\`।`,
    constraints: `\`1 <= n <= 100000\`, \`0 <= m <= 200000\`, \`1 <= w <= 10^9\``,
    editorial: `## ধারণা
Kruskal ওজন ছোট থেকে বড় edge নেয়; যে মুহূর্তে শেষ দুই দল মিলে এক হয়, সেই edge-এর ওজনটাই সবচেয়ে ছোট \`W\` — এর ছোট ওজন দিলে যুক্ত হয় না, সেটা নিলেই হয়। এটাই MST-এর সর্বোচ্চ edge (bottleneck)।

## ধাপে ধাপে
1. edge ওজন অনুযায়ী \`sort\` করে DSU শুরু করো; \`n == 1\` হলে \`0\` ছাপিয়ে থামো।
2. প্রতিটি \`(w, u, v)\`: আলাদা দল হলে union করে যুক্ত দল সংখ্যা এক বাড়াও।
3. যুক্ত দল সংখ্যা \`n\` হলে \`w\` ছাপিয়ে থামো — এটাই উত্তর।
4. edge শেষ হয়েও এক না হলে \`-1\`।

\`\`\`python
import sys
d = list(map(int, sys.stdin.read().split()))
n, m = d[0], d[1]
e = sorted((d[4+3*i], d[2+3*i], d[3+3*i]) for i in range(m))
p = list(range(n+1))
def find(x):
    while p[x] != x:
        p[x] = p[p[x]]; x = p[x]
    return x
if n == 1:
    print(0)
else:
    groups = n
    for w, u, v in e:
        ru, rv = find(u), find(v)
        if ru != rv:
            p[ru] = rv; groups -= 1
            if groups == 1:
                print(w); break
    else:
        print(-1)
\`\`\`

## কমপ্লেক্সিটি
সময় \`O(m log m)\` — শুধু sort আর প্রায় \`O(m)\` union; মেমোরি \`O(n + m)\`।

## সাধারণ ভুল
- রুট গোনার জন্য প্রতিবার \`O(n)\` লুপ চালালে বড় ইনপুটে ধীর হয় — যুক্ত দলের কাউন্টার রাখো বা প্রতি ধাপে \`O(1)\` হিসেব করো।
- \`w < W\` না করে \`w <= W\` ভুল হলে সীমার ঠিক মানটা বাদ পড়ে — বর্তমান edge-এর ওজনই উত্তর, তার এক ধাপ আগে নয়।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "MST", "Kruskal", "Bottleneck"],
    tests: [
      { input: "4 4\n1 2 1\n2 3 5\n3 4 4\n1 4 10\n", expectedOutput: "5\n", isSample: true },
      { input: "2 1\n1 2 7\n", expectedOutput: "7\n", isSample: true },
      { input: "1 0\n", expectedOutput: "0\n", isSample: false },
      { input: "3 1\n1 2 3\n", expectedOutput: "-1\n", isSample: false },
      { input: "3 3\n1 2 2\n2 3 3\n1 3 100\n", expectedOutput: "3\n", isSample: false },
      { input: `100000 99999\n${Array.from({ length: 99999 }, (_, i) => `1 ${i + 2} ${i + 2}`).join("\n")}\n`, expectedOutput: "100000\n", isSample: false },
    ],
    referencePython: "import sys\nd = list(map(int, sys.stdin.read().split()))\nn, m = d[0], d[1]\ne = sorted((d[4+3*i], d[2+3*i], d[3+3*i]) for i in range(m))\np = list(range(n+1))\ndef find(x):\n    while p[x] != x:\n        p[x] = p[p[x]]\n        x = p[x]\n    return x\nif n == 1:\n    print(0)\nelse:\n    groups = n\n    for w, u, v in e:\n        ru, rv = find(u), find(v)\n        if ru != rv:\n            p[ru] = rv\n            groups -= 1\n            if groups == 1:\n                print(w)\n                break\n    else:\n        print(-1)\n",
  },
];
