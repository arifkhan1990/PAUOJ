import type { SeedProblem } from "../../../seed-problems";

const mergeBasePython = `import sys

lines = sys.stdin.read().splitlines()
n = int(lines[0])
parents = {}
position = {}
for i in range(n):
    parts = lines[i + 1].split()
    parents[parts[0]] = [p for p in parts[1:] if p != '-']
    position[parts[0]] = i
a, b = lines[n + 1].split()


def ancestors(node):
    seen = set()
    stack = [node]
    while stack:
        current = stack.pop()
        if current in seen:
            continue
        seen.add(current)
        stack.extend(parents.get(current, []))
    return seen


ancestors_a = ancestors(a)
ancestors_b = ancestors(b)
common = ancestors_a & ancestors_b
if common:
    print('base=' + max(common, key=lambda h: position[h]))
else:
    print('base=none')
print('ff=yes' if a in ancestors_b else 'ff=no')
`;

const conflictFilesPython = `import sys

lines = sys.stdin.read().splitlines()
index = 0
n = int(lines[index])
index += 1
conflicting = []
total = 0
for _ in range(n):
    parts = lines[index].split()
    index += 1
    name = parts[0]
    count_a = int(parts[1])
    ranges_a = []
    for _ in range(count_a):
        start, end = map(int, lines[index].split())
        index += 1
        ranges_a.append((start, end))
    count_b = int(lines[index])
    index += 1
    ranges_b = []
    for _ in range(count_b):
        start, end = map(int, lines[index].split())
        index += 1
        ranges_b.append((start, end))
    hunks = 0
    for start_a, end_a in ranges_a:
        for start_b, end_b in ranges_b:
            if max(start_a, start_b) <= min(end_a, end_b):
                hunks += 1
    if hunks > 0:
        conflicting.append(name)
        total += hunks
conflicting.sort()
print(' '.join(conflicting) if conflicting else '-')
print('hunks=' + str(total))
`;

export const GIT_BRANCHES_GUIDED_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-git-merge-base",
    title: "Merge Base",
    statement: `মাহিন আর নুসরাত দুজন আলাদা ব্রাঞ্চে কাজ করছে। মাহিন বলল, merge করার আগে জানতে হবে দুজনের ইতিহাস কোথায় আবার মিলেছে — সেটাই merge base। মিলের জায়গাটা যদি প্রথম ব্রাঞ্চের ডগা হয়, তাহলে merge টা শুধু এগিয়ে যাবে (fast-forward), নতুন merge commit লাগবে না।

\`n\`টি কমিট নির্মাণ-ক্রমে দেওয়া থাকে; প্রতিটি লাইনে \`hash parent1 [parent2]\`, শিকড়ের parent \`-\`। শেষ লাইনে দুই ব্রাঞ্চের ডগা \`a b\` দেওয়া থাকে; ধরা হচ্ছে \`b\`-কে \`a\`-তে merge করা হবে।

প্রথম লাইনে \`base=<hash>\` ছাপাও, সাধারণ পূর্বপুরুষ না থাকলে \`base=none\`। দ্বিতীয় লাইনে \`ff=yes\` যদি \`a\`, \`b\`-এর পূর্বপুরুষ হয় (অর্থাৎ fast-forward সম্ভব), নাহলে \`ff=no\`। একাধিক সাধারণ পূর্বপুরুষ থাকলে নির্মাণ-ক্রমে নতুনটা নাও।`,
    inputFormat: `প্রথম লাইনে \`n\`। পরের \`n\` লাইনে \`hash parent1 [parent2]\`। শেষ লাইনে \`a b\`।`,
    outputFormat: `প্রথম লাইনে \`base=<hash>\` বা \`base=none\`, দ্বিতীয় লাইনে \`ff=yes\` বা \`ff=no\`।`,
    constraints: `\`1 <= n <= 200000\`
প্রতিটি কমিটের সর্বোচ্চ দুটি parent। ইনপুট বৈধ DAG; একই কমিট দুই ব্রাঞ্চে থাকতে পারে।`,
    editorial: `## ধারণা
Merge base হলো দুই ডগার সবচেয়ে কাছের সাধারণ পূর্বপুরুষ — অর্থাৎ যে কমিট থেকে দুজনের পথ আবার আলাদা হয়েছে। দুটো ডগা থেকে parent লিংক ধরে পিছনে হেঁটে ancestors সেট বানালে, দুটো সেটের ছেদই সাধারণ পূর্বপুরুষ। ছেদে একাধিক কমিট থাকতে পারে; নির্মাণ-ক্রমে যেটা নতুন, সেটাই নিকটতম। এরপর fast-forward-এর শর্ত একটাই: merge করার সময় যদি প্রথম ডগা দ্বিতীয় ডগার পূর্বপুরুষ হয়, নতুন commit ছাড়াই প্রথম ব্রাঞ্চ এগিয়ে যেতে পারে।

## ধাপে ধাপে
1. প্রতিটি কমিটের parent তালিকা আর নির্মাণ-ক্রমের অবস্থান সংরক্ষণ করো।
2. \`a\` আর \`b\` থেকে আলাদা করে reachable ancestors বের করো।
3. ছেদ বের করো; খালি হলে \`base=none\`।
4. নাহলে ছেদের মধ্যে সবচেয়ে বড় অবস্থানের hash ছাপো।
5. \`a\` যদি \`b\`-এর ancestors-এ থাকে তাহলে \`ff=yes\`, নাহলে \`ff=no\`।

\`\`\`python
${mergeBasePython}\`\`\`

## কমপ্লেক্সিটি
প্রতিটি কমিট একবার পরিভ্রমণ হয়, তাই সময় \`O(n)\`, মেমোরি \`O(n)\`। parents সংরক্ষণেও \`O(n)\`।

## সাধারণ ভুল
- শুধু ডগা দুটো সমান কি না দেখে fast-forward ঠিক করা — আসল শর্ত পূর্বপুরুষ হওয়া।
- সব সাধারণ পূর্বপুরুষের মধ্যে পুরনোটা ধরা — merge base নিকটতম, অর্থাৎ নতুনটা।
- merge commit-এর কেবল প্রথম parent ধরা — দ্বিতীয় parent-এর পথ বাদ পড়ে ভুল base আসে।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Git", "Branching"],
    tests: [
      {
        input: "4\na -\nb a\nc a\nd b c\nc d\n",
        expectedOutput: "base=c\nff=yes\n",
        isSample: true,
      },
      {
        input: "3\na -\nb a\nc a\nb c\n",
        expectedOutput: "base=a\nff=no\n",
        isSample: true,
      },
      { input: "2\nr1 -\nr2 -\nr1 r2\n", expectedOutput: "base=none\nff=no\n", isSample: false },
      {
        input: "4\na -\nb a\nc b\nd c\nd d\n",
        expectedOutput: "base=d\nff=yes\n",
        isSample: false,
      },
      {
        input: "4\na -\nb a\nc b\nd c\nd b\n",
        expectedOutput: "base=b\nff=no\n",
        isSample: false,
      },
      {
        input: "6\na -\nb a\nc b\nd c\ne b\nf d e\nb f\n",
        expectedOutput: "base=b\nff=yes\n",
        isSample: false,
      },
    ],
    referencePython: mergeBasePython,
  },
  {
    slug: "learn-git-conflict-files",
    title: "Conflict Files",
    statement: `একই ফাইলের একই লাইনে দুই ব্রাঞ্চ বদলালে git নিজে সিদ্ধান্ত নিতে পারে না — conflict হয়। নুসরাত বুঝতে চায় কোন ফাইলগুলোতে ঝামেলা হবে আর মোট কত জায়গায়।

\`n\`টি ফাইলের তথ্য দেওয়া থাকে। প্রতিটির প্রথম লাইনে \`<file> <ka>\`, পরের \`ka\` লাইনে main ব্রাঞ্চের বদলানো লাইন-রেঞ্জ \`start end\`। তারপর একটি লাইনে \`kb\`, পরের \`kb\` লাইনে feature ব্রাঞ্চের রেঞ্জ। দুই ব্রাঞ্চের একটি রেঞ্জ আরেকটির সাথে ছুঁলে (অন্তর্ভুক্ত ব্যবধানে মিললে) conflict হয়; প্রতিটি মিলে যাওয়া জোড়া একেকটা conflict hunk।

প্রথম লাইনে conflict হওয়া ফাইলের নাম বাইট-অনুক্রমে সাজিয়ে স্পেস দিয়ে ছাপাও, কিছু না থাকলে \`-\`। দ্বিতীয় লাইনে \`hunks=<মোট conflict জোড়ার সংখ্যা>\`।`,
    inputFormat: `প্রথম লাইনে \`n\`। এরপর প্রতিটি ফাইলের জন্য \`<file> <ka>\`, \`ka\`টি রেঞ্জ, \`kb\`, \`kb\`টি রেঞ্জ।`,
    outputFormat: `প্রথম লাইনে conflict হওয়া ফাইলের নাম সাজিয়ে বা \`-\`; দ্বিতীয় লাইনে \`hunks=<সংখ্যা>\`।`,
    constraints: `\`0 <= n <= 2000\`
প্রতি ফাইলে \`0 <= ka, kb <= 200\`
\`1 <= start <= end <= 10^9\`
একই ব্রাঞ্চের রেঞ্জগুলো পরস্পর আলাদা।`,
    editorial: `## ধারণা
দুই ব্রাঞ্চ যদি একই ফাইলের এমন লাইনে হাত দেয় যেগুলো ছুঁয়েছে বা ওভারল্যাপ করেছে, git নিজে ঠিক করতে পারে না কোনটা রাখবে — তখন conflict hunk তৈরি হয়। দুই রেঞ্জ \`[s1, e1]\` আর \`[s2, e2]\` মেলে যখন \`max(s1, s2) <= min(e1, e2)\`। ফাইলের জন্য সব জোড়া দেখে যেগুলো মেলে সেগুলো গুনলেই hunk সংখ্যা; একটাও না মিললে ফাইলটা পরিষ্কার।

## ধাপে ধাপে
1. \`n\` পড়ো, তারপর প্রতি ফাইলে নাম, দুই ব্রাঞ্চের রেঞ্জ-সংখ্যা আর রেঞ্জগুলো পড়ো।
2. প্রতিটি \`main\` রেঞ্জের সাথে প্রতিটি \`feature\` রেঞ্জের ছেদ আছে কি না যাচাই করো।
3. মিললে hunk গণনা বাড়াও।
4. ফাইলের hunk শূন্যের বেশি হলে নাম তালিকায় রাখো এবং মোট গণনায় যোগ করো।
5. তালিকা সাজিয়ে ছাপো, তারপর মোট hunk।

\`\`\`python
${conflictFilesPython}\`\`\`

## কমপ্লেক্সিটি
প্রতি ফাইলে \`O(ka * kb)\` তুলনা, সব মিলিয়ে \`O(sum(ka * kb))\`, নাম সাজানো \`O(n log n)\`। মেমোরি \`O(n)\`।

## সাধারণ ভুল
- রেঞ্জের শেষ আর পরের রেঞ্জের শুরু সমান হলে ছেদ না ধরা — একই লাইন দুজনে বদলালে সেটাও conflict।
- শুধু ফাইলের নাম দেখে ধরে নেওয়া conflict হবে — লাইন রেঞ্জ না মিললে ফাইল পরিষ্কার।
- প্রতি ফাইলে একটাই hunk ধরা — একাধিক আলাদা জায়গায় ছেদ থাকলে প্রতিটা আলাদা hunk।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Git", "Merge Conflict"],
    tests: [
      {
        input: "2\napp.js 1\n10 20\n1\n15 25\nstyle.css 1\n1 5\n1\n10 12\n",
        expectedOutput: "app.js\nhunks=1\n",
        isSample: true,
      },
      {
        input: "3\na.ts 1\n1 5\n1\n3 8\nb.ts 2\n1 4\n10 20\n2\n4 4\n18 30\nc.ts 1\n100 110\n1\n111 120\n",
        expectedOutput: "a.ts b.ts\nhunks=3\n",
        isSample: true,
      },
      {
        input: "1\nx.py 1\n1 5\n1\n6 10\n",
        expectedOutput: "-\nhunks=0\n",
        isSample: false,
      },
      {
        input: "1\nedge.ts 2\n1 5\n10 15\n2\n6 9\n15 20\n",
        expectedOutput: "edge.ts\nhunks=1\n",
        isSample: false,
      },
      {
        input: "2\napi.ts 2\n10 12\n40 45\n3\n11 13\n44 50\n100 110\nweb.ts 1\n7 9\n1\n2 6\n",
        expectedOutput: "api.ts\nhunks=2\n",
        isSample: false,
      },
      {
        input: "2\nzeta.ts 1\n1 10\n1\n5 6\nalpha.ts 1\n1 10\n1\n5 6\n",
        expectedOutput: "alpha.ts zeta.ts\nhunks=2\n",
        isSample: false,
      },
    ],
    referencePython: conflictFilesPython,
  },
];
