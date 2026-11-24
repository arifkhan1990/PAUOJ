import type { SeedProblem } from "../../../seed-problems";

const fastForwardPython = `import sys

lines = sys.stdin.read().splitlines()
n = int(lines[0])
parents = {}
for i in range(n):
    parts = lines[i + 1].split()
    parents[parts[0]] = [p for p in parts[1:] if p != '-']
q = int(lines[n + 1])
queries = lines[n + 2:n + 2 + q]


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


for query in queries:
    x, y = query.split()
    if y in ancestors(x):
        print('UP-TO-DATE')
    elif x in ancestors(y):
        print('FAST-FORWARD')
    else:
        print('THREE-WAY')
`;

const branchCleanupPython = `import sys

lines = sys.stdin.read().splitlines()
current = lines[0].split()[1]
local = lines[1].split()[2:]
merged = lines[2].split()[2:]
safe = []
for branch in local:
    if branch in merged and branch != current and branch not in ('main', 'master'):
        safe.append(branch)
safe.sort()
print(' '.join(safe) if safe else '-')
`;

export const GIT_BRANCHES_EXTRA_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-git-fast-forward",
    title: "Fast Forward?",
    statement: `মাহিন নুসরাতকে তিন ধরনের merge ফল চিনিয়ে দিচ্ছে। feature-কে main-এ merge করার সময় যদি main-এর ডগা feature-এর পূর্বপুরুষ হয়, merge টা fast-forward; উল্টোটা হলে কিছুই করার নেই, already up-to-date; আর দুজনেরই আলাদা নতুন কমিট থাকলে তিন-উপায় merge commit লাগে।

\`n\`টি কমিট নির্মাণ-ক্রমে দেওয়া থাকে; প্রতিটি লাইনে \`hash parent1 [parent2]\`, শিকড়ের parent \`-\`। এরপর \`q\`টি প্রশ্ন, প্রতিটি লাইনে \`x y\` — \`y\`-কে \`x\`-এ merge করা হবে।

প্রতিটি প্রশ্নের জন্য এক লাইনে \`UP-TO-DATE\`, \`FAST-FORWARD\` বা \`THREE-WAY\` ছাপাও।`,
    inputFormat: `প্রথম লাইনে \`n\`, পরের \`n\` লাইনে কমিট। তারপর \`q\`, পরের \`q\` লাইনে \`x y\`।`,
    outputFormat: `প্রতিটি প্রশ্নের জন্য এক লাইনে একটি শ্রেণি, ইনপুট ক্রমে।`,
    constraints: `\`1 <= n <= 200000\`
\`1 <= q <= 2000\`
ইনপুট বৈধ DAG, প্রতিটি কমিটের সর্বোচ্চ দুটি parent।`,
    editorial: `## ধারণা
Merge করার সময় আসল প্রশ্নটা হলো কোন ইতিহাস আরেকটার ভিতরে আছে কি না। \`y\`-কে \`x\`-এ merge করছি ধরে নিলে: \`y\` যদি \`x\`-এর পূর্বপুরুষ হয়, তাহলে \`x\`-এর কাছে ইতিমধ্যে \`y\`-এর সব কাজ আছে — কিছু করার নেই, up-to-date। উল্টোদিকে \`x\` যদি \`y\`-এর পূর্বপুরুষ হয়, তাহলে \`x\`-কে শুধু \`y\`-এর ডগা পর্যন্ত সরালেই হয় — fast-forward। দুটোই না হলে দুই পাশে আলাদা কমিট, তাই তিন-উপায় merge commit দরকার। একই কমিট হলে সেটাও up-to-date-এর মধ্যে পড়ে।

## ধাপে ধাপে
1. কমিটগুলোর parent তালিকা বানাও।
2. প্রতিটি প্রশ্নের \`x\` আর \`y\` নাও।
3. \`y\` কি \`x\`-এর reachable ancestors-এ আছে দেখো; থাকলে \`UP-TO-DATE\`।
4. নাহলে \`x\` কি \`y\`-এর ancestors-এ আছে দেখো; থাকলে \`FAST-FORWARD\`।
5. দুটোই না হলে \`THREE-WAY\`।

\`\`\`python
${fastForwardPython}\`\`\`

## কমপ্লেক্সিটি
প্রতি প্রশ্নে ancestors বের করা \`O(n)\` পর্যন্ত হতে পারে, তাই মোট \`O(q * n)\`; ছোট সীমায় ঠিক আছে। মেমোরি \`O(n)\`।

## সাধারণ ভুল
- "আলাদা ব্রাঞ্চ মানেই তিন-উপায় merge" ধরে নেওয়া — এক পাশ যদি অন্য পাশের পূর্বপুরুষ হয়, merge commit লাগে না।
- \`x\` আর \`y\`-এর ভূমিকা উল্টে ফেলা — fast-forward শর্ত শুধু এক দিকেই সত্য।
- সমান \`x\` আর \`y\`-কে fast-forward বলা — কিছুই সরানোর দরকার নেই, সেটা up-to-date।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Git", "Branching"],
    tests: [
      {
        input: "6\na -\nb a\nc b\nd c\ne b\nf e\n3\nc d\nd c\nd f\n",
        expectedOutput: "FAST-FORWARD\nUP-TO-DATE\nTHREE-WAY\n",
        isSample: true,
      },
      {
        input: "3\na -\nb a\nc a\n2\na b\na c\n",
        expectedOutput: "FAST-FORWARD\nFAST-FORWARD\n",
        isSample: true,
      },
      {
        input: "2\na -\nb a\n2\nb b\na b\n",
        expectedOutput: "UP-TO-DATE\nFAST-FORWARD\n",
        isSample: false,
      },
      {
        input: "5\na -\nb a\nc b\nd c\nm d c\n2\nm d\nm c\n",
        expectedOutput: "UP-TO-DATE\nUP-TO-DATE\n",
        isSample: false,
      },
      {
        input: "4\na -\nb a\nc a\nd c\n2\nb d\nd b\n",
        expectedOutput: "THREE-WAY\nTHREE-WAY\n",
        isSample: false,
      },
      {
        input: "5\na -\nb a\nc b\nd b\ne d\n3\nc e\ne c\nb e\n",
        expectedOutput: "THREE-WAY\nTHREE-WAY\nFAST-FORWARD\n",
        isSample: false,
      },
    ],
    referencePython: fastForwardPython,
  },
  {
    slug: "learn-git-branch-cleanup",
    title: "Branch Cleanup",
    statement: `স্প্রিন্ট শেষে নুসরাত মৃত ব্রাঞ্চগুলো পরিষ্কার করতে চায়। মাহিন বলল, শুধু যে লোকাল ব্রাঞ্চগুলো ইতিমধ্যে merge হয়েছে সেগুলোই \`git branch -d\` দিয়ে মুছবে; current ব্রাঞ্চ, unmerged ব্রাঞ্চ, আর \`main\`/\`master\` কখনো নয়। রিমোটে থাকা ব্রাঞ্চ শুধু তথ্য — লোকাল তালিকায় না থাকলে সেগুলো ছোঁয়া যাবে না।

প্রথম লাইনে \`current <name>\`। দ্বিতীয় লাইনে \`local <l> <নাম...>\`, তৃতীয় লাইনে \`merged <m> <নাম...>\`, চতুর্থ লাইনে \`remote <r> <নাম...>\`। নামের সংখ্যা শূন্য হলে শুধু সংখ্যাটাই থাকে।

যে লোকাল ব্রাঞ্চগুলো merged, current নয়, আর \`main\`/\`master\` নয় — সেগুলো বাইট-অনুক্রমে সাজিয়ে এক লাইনে স্পেস দিয়ে ছাপাও; কিছু না থাকলে \`-\`।`,
    inputFormat: `চারটি লাইন: \`current <name>\`, \`local <l> <নাম...>\`, \`merged <m> <নাম...>\`, \`remote <r> <নাম...>\`।`,
    outputFormat: `মুছে ফেলা নিরাপদ লোকাল ব্রাঞ্চের নাম সাজিয়ে, অথবা \`-\`।`,
    constraints: `\`1 <= l, m, r <= 500\`
নামে স্পেস নেই। \`merged\` তালিকা \`local\`-এর একটি উপসেট ধরে নেওয়া যায় না — যাচাই করে নাও।`,
    editorial: `## ধারণা
\`git branch -d\` শুধু তখনই কাজ করে যখন ব্রাঞ্চের সব commit অন্য কোথাও আছে; merged ব্রাঞ্চে সেটা নিরাপদ। তবে current ব্রাঞ্চ মুছলে নিজের পায়ে কুড়াল পড়ে, \`main\` বা \`master\` মুছলে পুরো দল আটকে যায়, আর unmerged ব্রাঞ্চ মুছলে কাজ হারায়। তাই নিরাপদ তালিকা মানে লোকাল ব্রাঞ্চের সঙ্গে merged তালিকার ছেদ, তারপর current আর protected নাম বাদ। রিমোট তালিকা এখানে শুধু বিভ্রান্তি — রিমোট-অনলি নাম লোকাল ব্রাঞ্চ নয়, তাই ছোঁয়ার প্রশ্নই নেই।

## ধাপে ধাপে
1. চার লাইন পড়ে current, local, merged, remote তালিকা বের করো।
2. প্রতিটি লোকাল ব্রাঞ্চের জন্য দেখো সেটা merged তালিকায় আছে কি না।
3. current হলে বা \`main\`/\`master\` হলে বাদ দাও।
4. বাকিগুলো সাজিয়ে এক লাইনে ছাপো; কিছু না থাকলে \`-\`।
5. রিমোট তালিকা ব্যবহার করো না — সেটা শুধু প্রসঙ্গ।

\`\`\`python
${branchCleanupPython}\`\`\`

## কমপ্লেক্সিটি
প্রতিটি লোকাল ব্রাঞ্চ একবার দেখা হয়, তাই সময় \`O(l * m)\` সবচেয়ে খারাপ ক্ষেত্রে, সাজানো \`O(l log l)\`, মেমোরি \`O(l)\`।

## সাধারণ ভুল
- current ব্রাঞ্চও merged তালিকায় থাকায় মুছে ফেলা — পরে নিজের কাজেই ফিরতে পারবে না।
- রিমোট-অনলি ব্রাঞ্চের নাম ফলাফলে রাখা — লোকাল ব্রাঞ্চ না থাকলে \`git branch -d\` কিছুই মোছে না।
- unmerged ব্রাঞ্চে \`-d\` চালানো — git আটকে দেবে, জোর করে \`-D\` দিলে কাজ হারাবে।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Git", "Branching"],
    tests: [
      {
        input:
          "current main\nlocal 5 main feature/a feature/b release/1.0 experiment\nmerged 3 main feature/a feature/b\nremote 3 feature/b release/1.0 old/topic\n",
        expectedOutput: "feature/a feature/b\n",
        isSample: true,
      },
      {
        input: "current main\nlocal 2 main old/feature\nmerged 1 main\nremote 1 old/feature\n",
        expectedOutput: "-\n",
        isSample: true,
      },
      {
        input:
          "current develop\nlocal 4 main develop feature/x feature/y\nmerged 3 main feature/x feature/y\nremote 1 feature/x\n",
        expectedOutput: "feature/x feature/y\n",
        isSample: false,
      },
      {
        input:
          "current feature/x\nlocal 3 main feature/x release/2\nmerged 3 main feature/x release/2\nremote 2 main release/2\n",
        expectedOutput: "release/2\n",
        isSample: false,
      },
      {
        input:
          "current release/3\nlocal 5 main master feature/old release/3 hotfix/1\nmerged 5 main master feature/old release/3 hotfix/1\nremote 2 release/3 hotfix/1\n",
        expectedOutput: "feature/old hotfix/1\n",
        isSample: false,
      },
      {
        input:
          "current main\nlocal 4 main feature/done feature/wip experiment\nmerged 2 main feature/done\nremote 2 feature/wip experiment\n",
        expectedOutput: "feature/done\n",
        isSample: false,
      },
    ],
    referencePython: branchCleanupPython,
  },
];
