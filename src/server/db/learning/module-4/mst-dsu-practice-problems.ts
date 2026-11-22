import type { SeedProblem } from "../../seed-problems";
import { newlineOutput } from "../generated-tests";

import { MST_DSU_PRACTICE_PROBLEMS_PART2 } from "./mst-dsu-practice-problems-part2";

const MST_DSU_PRACTICE_PROBLEMS_PART1: SeedProblem[] = [
  {
    slug: "learn-m4-mst-dsu-e2",
    title: "Component Sizes",
    statement: `ক্লাবের \`n\` জন সদস্য এখন দলে দলে ভাগ হয়ে গেছে — বন্ধুত্বের জোড়াগুলো মিলিয়ে যারা যুক্ত তারা এক দল। সাদিয়া জানতে চায় প্রতিটি সদস্যের দলে এখন মোট কয়জন আছে।

\`n\` জন সদস্য (১ থেকে \`n\`) আর \`m\`টি দ্বিমুখী বন্ধুত্ব দেওয়া থাকবে। প্রতিটি সদস্যের জন্য তার দলের মোট সদস্য সংখ্যা ছাপো।

উদাহরণ: \`4\` জন, বন্ধুত্ব \`1-2\`, \`2-3\`, \`1-4\` — সবাই এক দলে, প্রতিটি উত্তর \`4\`।`,
    inputFormat: `প্রথম লাইনে \`n m\`।
পরের \`m\` লাইনে প্রতিটিতে \`u v\` — দ্বিমুখী বন্ধুত্ব।`,
    outputFormat: "এক লাইনে `n`টি সংখ্যা: সদস্য `1` থেকে `n`-এর দলের আকার।",
    constraints: "`1 <= n <= 100000`, `0 <= m <= 200000`",
    editorial: `## ধারণা

গাইডেড সমস্যায় DSU শুধু "একই দলে কি না" বলত — এবার দলের আকারও দরকার। ট্রিকটা সহজ: প্রতিটি দলের নেতার (রুটের) ঘরে দলের মোট সংখ্যা জমা রাখো। দুই দল মেশানোর সময় ছোট দলের নেতাকে বড় দলের নেতার নিচে বসিয়ে দাও, তাহলে বড় দলের গোনায় ছোটটার সংখ্যাটা যোগ হয়েই সঠিক থাকে — আর path compression মিলিয়ে প্রতিটি খোঁজা প্রায় \`O(1)\`। শেষে প্রতিটি সদস্যের রুট বের করে সেই ঘরের জমা সংখ্যাই তার দলের আকার।

## ধাপে ধাপে

1. \`parent[i] = i\` আর \`size[i] = 1\` দিয়ে DSU শুরু করো।
2. প্রতিটি বন্ধুত্বে দুই পক্ষের রুট বের করো; একই রুট হলে কিছু কোরো না।
3. আলাদা হলে ছোট দলের রুটকে বড় দলের রুটের নিচে বসিয়ে বড় দলের \`size\`-এ ছোটটার সংখ্যা যোগ করো।
4. শেষে প্রতিটি সদস্যের জন্য \`size[find(u)]\` ছাপাও।

\`\`\`python
import sys

def main():
    data = sys.stdin.read().split()
    n, m = int(data[0]), int(data[1])
    parent = list(range(n + 1))
    size = [1] * (n + 1)

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for i in range(m):
        a, b = int(data[2 + 2 * i]), int(data[3 + 2 * i])
        ra, rb = find(a), find(b)
        if ra != rb:
            if size[ra] < size[rb]:
                ra, rb = rb, ra
            parent[rb] = ra
            size[ra] += size[rb]
    print(' '.join(str(size[find(u)]) for u in range(1, n + 1)))

main()
\`\`\`

## কমপ্লেক্সিটি

প্রতিটি অপারেশন প্রায় \`O(alpha(n))\` — মোট কাছাকাছি \`O(n + m)\`। স্পেস \`O(n)\`।

## সাধারণ ভুল

- রুটের ঘরে না রেখে প্রতিটি নোডের ঘরে আকার রাখা — মেশানোর পর পুরনো ঘরগুলোর মান পুরনো হয়ে থাকে।
- ছোট-বড় মিলিয়ে মেশানো না হলে গভীর চেইন তৈরি হয়, খোঁজা ধীর হয়ে যায়।
- মেশানোর পরেই \`size\` আপডেট না করা — পরের প্রশ্নে ভুল আকার আসে।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "DSU", "Union Find"],
    tests: [
      { input: "4 3\n1 2\n2 3\n1 4\n", expectedOutput: "4 4 4 4\n", isSample: true },
      { input: "4 2\n1 2\n3 4\n", expectedOutput: "2 2 2 2\n", isSample: true },
      { input: "3 0\n", expectedOutput: "1 1 1\n", isSample: false },
      {
        input: `100000 99999\n${Array.from({ length: 99999 }, (_, i) => `${i + 1} ${i + 2}`).join("\n")}\n`,
        expectedOutput: `${Array(100000).fill("100000").join(" ")}\n`,
        isSample: false,
      },
      {
        input: `100000 99998\n${[
          ...Array.from({ length: 49999 }, (_, i) => `${i + 1} ${i + 2}`),
          ...Array.from({ length: 49999 }, (_, i) => `${50001 + i} ${50002 + i}`),
        ].join("\n")}\n`,
        expectedOutput: `${Array(100000).fill("50000").join(" ")}\n`,
        isSample: false,
      },
    ],
    referencePython:
      "import sys\n\ndef main():\n    data = sys.stdin.read().split()\n    n, m = int(data[0]), int(data[1])\n    parent = list(range(n + 1))\n    size = [1] * (n + 1)\n\n    def find(x):\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n\n    for i in range(m):\n        a, b = int(data[2 + 2 * i]), int(data[3 + 2 * i])\n        ra, rb = find(a), find(b)\n        if ra != rb:\n            if size[ra] < size[rb]:\n                ra, rb = rb, ra\n            parent[rb] = ra\n            size[ra] += size[rb]\n    print(' '.join(str(size[find(u)]) for u in range(1, n + 1)))\n\nmain()\n",
  },
  {
    slug: "learn-m4-mst-dsu-e3",
    title: "Cable Log",
    statement: `নেটওয়ার্ক সাজানোর দিন রফি কেবল একে একে বসাচ্ছে — প্রতিটি কেবল বসানোর পর লগবইতে একটা লাইন লেখে: কেবলটা দুই আলাদা নেটওয়ার্ককে জুড়েছে হলে \`MERGED\`, আর দুই মাথা আগে থেকেই একই নেটওয়ার্কে ছিল হলে \`IGNORED\`।

\`n\`টি রাউটার আর কেবলগুলোর তালিকা (ইনপুটের ক্রমে) দেওয়া থাকবে। প্রতিটি কেবলের জন্য লগবই-এর লাইনটা ছাপো।

উদাহরণ: রাউটার \`3\`টি, কেবল \`1-2\`, \`2-3\`, \`1-3\` — প্রথম দুইটা জোড়া দেয়, তৃতীয়টা ঢুকতে দেখে দুই মাথা একই নেটওয়ার্কে: \`MERGED MERGED IGNORED\`।`,
    inputFormat: `প্রথম লাইনে \`n m\`।
পরের \`m\` লাইনে প্রতিটিতে \`u v\` — কেবলটা রাউটার \`u\` আর \`v\`-কে জোড়ে।`,
    outputFormat: "`m`টি লাইন — প্রতিটি কেবলের জন্য `MERGED` বা `IGNORED`।",
    constraints: "`1 <= n <= 100000`, `1 <= m <= 200000`\nএকই জোড়ার কেবল একাধিকবার থাকতে পারে।",
    editorial: `## ধারণা

এটা Kruskal-এর ভেতরের সেই চেকটাই, ওজন ছাড়া। প্রতিটি কেবল বসানোর সময় দুই মাথার দল (DSU রুট) মেলাও: আলাদা হলে জোড়া দিয়ে \`MERGED\`, একই হলে \`IGNORED\`। কেবলের ক্রম ইনপুটের দেওয়া ক্রমেই — কোনো সাজানোর দরকার নেই। প্রতিটি ধাপ প্রায় \`O(1)\`, তাই লগবই বড় হলেও জলদি শেষ।

## ধাপে ধাপে

1. DSU নাও — প্রতিটি রাউটার নিজের নেতা।
2. প্রতিটি কেবলে দুই মাথার রুট বের করো।
3. আলাদা হলে union করে \`MERGED\` লিখে রাখো; একই হলে \`IGNORED\`।
4. সব লাইন জুড়ে ছাপাও।

\`\`\`python
import sys

def main():
    data = sys.stdin.read().split()
    n, m = int(data[0]), int(data[1])
    parent = list(range(n + 1))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    out = []
    for i in range(m):
        ra, rb = find(int(data[2 + 2 * i])), find(int(data[3 + 2 * i]))
        if ra == rb:
            out.append('IGNORED')
        else:
            parent[ra] = rb
            out.append('MERGED')
    print('\\n'.join(out))

main()
\`\`\`

## কমপ্লেক্সিটি

প্রতিটি কেবলে দুইটি \`find\` আর সর্বোচ্চ একটি union — মোট প্রায় \`O(m alpha(n))\`, স্পেস \`O(n)\`।

## সাধারণ ভুল

- শুধু বাপ-সন্তান মিলিয়ে দেখা — মাঝের চেইন থাকলে একই দলকে আলাদা ভেবে \`MERGED\` লেখে ফেলে।
- ডুপ্লিকেট কেবলকে ভুল শনাক্ত করা — সেটাও একটা বৈধ ইনপুট, সাধারণ \`IGNORED\`-ই হবে।
- রাউটার একটাই হলে (\`n = 1\`) সব কেবলই সেলফ-জোড়া ধরনের হয়ে \`IGNORED\` — সেটাও ঠিক।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "DSU", "Union Find"],
    tests: [
      {
        input: "3 3\n1 2\n2 3\n1 3\n",
        expectedOutput: "MERGED\nMERGED\nIGNORED\n",
        isSample: true,
      },
      {
        input: "2 2\n1 2\n1 2\n",
        expectedOutput: "MERGED\nIGNORED\n",
        isSample: true,
      },
      { input: "1 1\n1 1\n", expectedOutput: "IGNORED\n", isSample: false },
      {
        input: "4 3\n1 2\n3 4\n2 3\n",
        expectedOutput: "MERGED\nMERGED\nMERGED\n",
        isSample: false,
      },
      {
        input: `100000 100000\n${[
          ...Array.from({ length: 99999 }, (_, i) => `${i + 1} ${i + 2}`),
          "1 2",
        ].join("\n")}\n`,
        expectedOutput: newlineOutput([
          ...Array(99999).fill("MERGED"),
          "IGNORED",
        ]),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\n\ndef main():\n    data = sys.stdin.read().split()\n    n, m = int(data[0]), int(data[1])\n    parent = list(range(n + 1))\n\n    def find(x):\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n\n    out = []\n    for i in range(m):\n        ra, rb = find(int(data[2 + 2 * i])), find(int(data[3 + 2 * i]))\n        if ra == rb:\n            out.append('IGNORED')\n        else:\n            parent[ra] = rb\n            out.append('MERGED')\n    print('\\n'.join(out))\n\nmain()\n",
  },
  {
    slug: "learn-m4-mst-dsu-m2",
    title: "Exactly K Clusters",
    statement: `শহরের \`n\`টি ভবন প্রতিটি নিজেই একেকটা দল। \`m\`টি সম্ভাব্য কেবল দিয়ে যেকোনো দুই দল জোড়া দেওয়া যায়, প্রতিটির খরচ \`w\`। প্রশাসন চায় খরচ সবচেয়ে কম রেখে ঠিক \`k\`টি দলেই থাকতে — কমও না, বেশিও না।

প্রয়োজনীয় জোড়াগুলোর ন্যূনতম মোট খরচ বের করো। \`k\`টি দলে পৌঁছানোই সম্ভব না হলে \`-1\`।

উদাহরণ: \`4\`টি ভবন, কেবল \`1-2\` (১), \`2-3\` (২), \`3-4\` (৩), \`1-4\` (১০) আর \`k = 1\` — সব এক দলে করতে সস্তা তিনটা কেবল, মোট \`6\`।`,
    inputFormat: `প্রথম লাইনে \`n m k\`।
পরের \`m\` লাইনে প্রতিটিতে \`u v w\` — দুই দল জোড়া দেওয়ার কেবল, খরচ \`w\`।`,
    outputFormat: "এক লাইনে ন্যূনতম মোট খরচ, অসম্ভব হলে `-1`।",
    constraints:
      "`1 <= n <= 100000`, `0 <= m <= 200000`, `1 <= k <= n`\n`1 <= w <= 10^9`; একই জোড়ার কেবল একাধিক হতে পারে।",
    editorial: `## ধারণা

Kruskal সস্তা কেবল থেকে ব্যয়বহুলের দিকে এগিয়ে দল মেশায় — আর প্রতিটি মেশানো দলের সংখ্যা ঠিক এক কমায়। শুরুতে দল \`n\`টি; লক্ষ্য \`k\`টি হলে মাত্র \`n - k\`টা জোড়াই যথেষ্ট, আর সস্তাগুলো আগে নিলেই মোট খরচ সবচেয়ে কম। তাই সাজানো তালিকায় ধরে ধরে জোড়া দাও, দলের সংখ্যা \`k\`-এ নামামাত্র থেমে যাও। \`k\` শুরুর দলসংখ্যার চেয়ে বড় হলে (\`n\`-এর বেশি) পৌঁছানোই অসম্ভব; আর কেবল কম পড়ে দল নামানো গেল না হলেও \`-1\`।

## ধাপে ধাপে

1. কেবলগুলো খরচ অনুযায়ী সাজাও; DSU নাও, \`clusters = n\` ধরো।
2. \`clusters < k\` হলে (\`k > n\`) সরাসরি \`-1\`।
3. প্রতিটি সস্তা কেবলে: \`clusters == k\` হয়ে গেলে থামো; দুই মাথা আলাদা হলে জোড়া দিয়ে খরচ যোগ করো আর \`clusters\` এক কমাও।
4. শেষে \`clusters == k\` হলে মোট খরচ, না হলে \`-1\`।

\`\`\`python
import sys

def main():
    data = sys.stdin.read().split()
    n, m, k = int(data[0]), int(data[1]), int(data[2])
    edges = sorted(
        (int(data[3 + 3 * i + 2]), int(data[3 + 3 * i]), int(data[3 + 3 * i + 1]))
        for i in range(m)
    )
    parent = list(range(n + 1))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    clusters = n
    if clusters < k:
        print(-1)
        return
    total = 0
    for w, u, v in edges:
        if clusters == k:
            break
        ru, rv = find(u), find(v)
        if ru != rv:
            parent[ru] = rv
            clusters -= 1
            total += w
    print(total if clusters == k else -1)

main()
\`\`\`

## কমপ্লেক্সিটি

সাজানো \`O(m log m)\` বাদে প্রতিটি কেবল একবারই দেখা হয় — মোট সেটার মধ্যেই। স্পেস \`O(n + m)\`।

## সাধারণ ভুল

- ঠিক \`k\` দলে থামতে না পেরে পুরো MST বানিয়ে ফেলা — দল \`k\`-এ নামলেই খরচ জমা বন্ধ।
- \`k = n\` হলে উত্তর \`0\` — কোনো কেবলই লাগে না; ভুলে \`-1\` ছাপা যাবে না।
- বাকি কেবলগুলোর মধ্যে সস্তা কিন্তু অপ্রয়োজনীয় (একই দলের) কেবল গোনা — দল নামালেই জোড়া দেওয়া বন্ধ।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Graphs", "Kruskal", "DSU"],
    tests: [
      {
        input: "4 4 1\n1 2 1\n2 3 2\n3 4 3\n1 4 10\n",
        expectedOutput: "6\n",
        isSample: true,
      },
      { input: "4 2 2\n1 2 1\n3 4 1\n", expectedOutput: "2\n", isSample: true },
      { input: "3 2 3\n1 2 1\n2 3 1\n", expectedOutput: "0\n", isSample: false },
      { input: "3 2 4\n1 2 1\n2 3 1\n", expectedOutput: "-1\n", isSample: false },
      { input: "4 0 2\n", expectedOutput: "-1\n", isSample: false },
      { input: "3 3 2\n1 2 1\n2 3 2\n1 3 100\n", expectedOutput: "1\n", isSample: false },
      {
        input: `100000 99999 50000\n${Array.from({ length: 99999 }, (_, i) => `${i + 1} ${i + 2} ${i + 1}`).join("\n")}\n`,
        expectedOutput: "1250025000\n",
        isSample: false,
      },
      {
        input: `100000 99999 1\n${Array.from({ length: 99999 }, (_, i) => `${i + 1} ${i + 2} ${i + 1}`).join("\n")}\n`,
        expectedOutput: "4999950000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\n\ndef main():\n    data = sys.stdin.read().split()\n    n, m, k = int(data[0]), int(data[1]), int(data[2])\n    edges = sorted(\n        (int(data[3 + 3 * i + 2]), int(data[3 + 3 * i]), int(data[3 + 3 * i + 1]))\n        for i in range(m)\n    )\n    parent = list(range(n + 1))\n\n    def find(x):\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n\n    clusters = n\n    if clusters < k:\n        print(-1)\n        return\n    total = 0\n    for w, u, v in edges:\n        if clusters == k:\n            break\n        ru, rv = find(u), find(v)\n        if ru != rv:\n            parent[ru] = rv\n            clusters -= 1\n            total += w\n    print(total if clusters == k else -1)\n\nmain()\n",
  },
];

export const MST_DSU_PRACTICE_PROBLEMS: SeedProblem[] = [
  ...MST_DSU_PRACTICE_PROBLEMS_PART1,
  ...MST_DSU_PRACTICE_PROBLEMS_PART2,
];
