import type { SeedProblem } from "../../../seed-problems";

const stagePlanPython = `import sys


def ignore_match(path, pattern):
    if pattern.startswith('*.'):
        return path.endswith(pattern[1:])
    if pattern.endswith('/'):
        name = pattern[:-1]
        return path.startswith(name + '/') or ('/' + name + '/') in path
    return path == pattern


data = sys.stdin.read().splitlines()
index = 0
n = int(data[index])
index += 1
files = data[index:index + n]
index += n
m = int(data[index])
index += 1
patterns = data[index:index + m]
staged = []
ignored = 0
for path in files:
    if any(ignore_match(path, pattern) for pattern in patterns):
        ignored += 1
    else:
        staged.append(path)
staged.sort()
print(' '.join(staged) if staged else '-')
print('ignored=' + str(ignored))
`;

const logOrderPython = `import sys

lines = sys.stdin.read().splitlines()
n = int(lines[0])
parents = {}
position = {}
for i in range(n):
    parts = lines[i + 1].split()
    parents[parts[0]] = [p for p in parts[1:] if p != '-']
    position[parts[0]] = i
head = lines[n + 1].split()[0]
seen = set()
stack = [head]
while stack:
    current = stack.pop()
    if current in seen:
        continue
    seen.add(current)
    stack.extend(parents.get(current, []))
order = sorted(seen, key=lambda h: position[h], reverse=True)
for h in order:
    print(h)
`;

export const GIT_SNAPSHOTS_GUIDED_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-git-stage-plan",
    title: "Stage Plan",
    statement: `নুসরাত প্রথম দিন অফিসে ঢুকে মাহিনের সাথে git শিখছে। প্রজেক্ট ফোল্ডারে সে অনেক ফাইল বদলেছে — কিছু আসল সোর্স কোড, কিছু লগ আর বিল্ড আউটপুট। মাহিন বলল, \`git add .\` দিলে \`.gitignore\`-এ লেখা ফাইলগুলো বাদে বাকি সব স্টেজ হবে। নুসরাত জানতে চায় ঠিক কোন ফাইলগুলো স্টেজ হবে আর কতগুলো বাদ পড়বে।

\`n\`টি ফাইলের পাথ আর \`m\`টি সরল প্যাটার্ন দেওয়া থাকে। প্যাটার্ন তিন রকম: \`*.ext\` শেষে \`.ext\` থাকা পাথ মেলে, \`name/\` ডিরেক্টরি \`name\`-এর ভিতরের পাথ মেলে, আর বাকি প্যাটার্ন ঠিক পাথ হিসেবে মেলে। এই সমস্যায় negation নেই।

স্টেজ হওয়া পাথগুলো বাইট-অনুক্রমে (সাধারণ lexicographic) সাজিয়ে এক লাইনে স্পেস দিয়ে ছাপাও; কিছু না থাকলে শুধু \`-\`। দ্বিতীয় লাইনে \`ignored=<সংখ্যা>\` ছাপাও।`,
    inputFormat: `প্রথম লাইনে \`n\`। পরের \`n\` লাইনে ফাইলের পাথ। তারপর \`m\`, আর পরের \`m\` লাইনে প্যাটার্ন। পাথে স্পেস নেই।`,
    outputFormat: `প্রথম লাইনে স্টেজ হওয়া পাথগুলো সাজিয়ে, অথবা \`-\`। দ্বিতীয় লাইনে \`ignored=<সংখ্যা>\`।`,
    constraints: `\`0 <= n <= 2000\`
\`0 <= m <= 50\`
প্রতিটি পাথ 200 অক্ষরের কম, ছোট হাতের বা বড় হাতের ইংরেজি অক্ষর, সংখ্যা, \`.\`, \`_\`, \`-\` আর \`/\` দিয়ে গঠিত।`,
    editorial: `## ধারণা
\`git add .\` মানে সব ফাইল স্টেজ করা নয়; \`.gitignore\`-এ মেলা ফাইল বাদ পড়ে। এই সমস্যায় তিন ধরনের সরল প্যাটার্ন আছে। \`*.ext\` একই এক্সটেনশনের সব ফাইল ধরে, \`name/\` ডিরেক্টরির ভিতরের যেকোনো পাথ ধরে (শুধু শুরুতে নয়, মাঝেও), আর বাকি প্যাটার্ন ঠিক পাথ হিসেবে মেলে। কোনো প্যাটার্ন মিললেই ফাইল ignore হয়, তাই স্টেজ তালিকায় ওঠে না।

## ধাপে ধাপে
1. \`n\` আর \`n\`টি পাথ পড়ো।
2. \`m\` আর \`m\`টি প্যাটার্ন পড়ো।
3. প্রতিটি পাথের জন্য প্যাটার্নগুলো একে একে মিলিয়ে দেখো।
4. একটাও না মিললে স্টেজ তালিকায় রাখো, অন্যথায় ignored গণনা এক বাড়াও।
5. তালিকা সাজিয়ে এক লাইনে ছাপো, তারপর ignored সংখ্যা।

\`\`\`python
${stagePlanPython}\`\`\`

## কমপ্লেক্সিটি
প্রতি পাথের জন্য সর্বোচ্চ \`m\` প্যাটার্ন দেখা হয়, তাই মেলানো \`O(n * m)\`; সাজানো \`O(n log n)\`। মেমোরি \`O(n)\`।

## সাধারণ ভুল
- \`name/\` কেবল পাথের শুরুতে মেলানো — \`src/build/x\`-এর মতো ভিতরের ডিরেক্টরিও ignore হয়, সেটা মিস হয়।
- স্টেজ তালিকা না সাজিয়ে ইনপুট ক্রমে ছাপানো।
- সব ফাইল ignore হলে প্রথম লাইনে খালি লাইন ছাপানো; এখানে নির্দিষ্ট \`-\` দরকার।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Git", "Version Control"],
    tests: [
      {
        input: "4\nsrc/app.ts\napp.log\nbuild/out.bin\nREADME.md\n2\n*.log\nbuild/\n",
        expectedOutput: "README.md src/app.ts\nignored=2\n",
        isSample: true,
      },
      {
        input: "3\nlogs/app.log\nsrc/main.ts\npackage.json\n0\n",
        expectedOutput: "logs/app.log package.json src/main.ts\nignored=0\n",
        isSample: true,
      },
      { input: "0\n1\n*.log\n", expectedOutput: "-\nignored=0\n", isSample: false },
      {
        input: "3\na.log\nb.log\ntmp/c.log\n1\n*.log\n",
        expectedOutput: "-\nignored=3\n",
        isSample: false,
      },
      {
        input: "4\nbuild/x.o\nsrc/build/y.ts\nnotes.txt\ndocs/notes.txt\n2\nbuild/\nnotes.txt\n",
        expectedOutput: "docs/notes.txt\nignored=3\n",
        isSample: false,
      },
      {
        input: "3\nZebra.txt\napple.txt\nMain.java\n1\n*.log\n",
        expectedOutput: "Main.java Zebra.txt apple.txt\nignored=0\n",
        isSample: false,
      },
    ],
    referencePython: stagePlanPython,
  },
  {
    slug: "learn-git-log-order",
    title: "Log Order",
    statement: `মাহিন নুসরাতকে দেখাল, \`git log --oneline\` সব কমিট দেখায় না — শুধু বর্তমান \`HEAD\` থেকে যেসব কমিটে পৌঁছানো যায় সেগুলোই দেখায়, নতুন থেকে পুরনো ক্রমে। নুসরাত নিজের রিপোর কমিট গ্রাফ দেখে তালিকাটা মিলিয়ে দেখতে চায়।

\`n\`টি কমিট ক্রমবর্ধমান নির্মাণ-ক্রমে (পুরনো থেকে নতুন) দেওয়া থাকে। প্রতিটি লাইনে \`hash parent1 [parent2]\` থাকে; শিকড় কমিটের parent হলো \`-\`। এরপরের লাইনে \`head\` দেওয়া থাকে; ধরা হচ্ছে প্রতিটি নতুন কমিটের commit date আগেরটার চেয়ে বড়।

\`head\` থেকে পৌঁছানো যায় এমন সব কমিটের hash নির্মাণ-ক্রমের উল্টো ক্রমে (নতুন আগে) এক লাইনে একটি করে ছাপাও।`,
    inputFormat: `প্রথম লাইনে \`n\`। পরের \`n\` লাইনে \`hash parent1 [parent2]\`। শেষ লাইনে \`head\`।`,
    outputFormat: `\`head\`-এর পূর্বপুরুষ কমিটগুলোর hash নতুন থেকে পুরনো ক্রমে, প্রতি লাইনে একটি।`,
    constraints: `\`1 <= n <= 200000\`
প্রতিটি কমিটের সর্বোচ্চ দুটি parent। ইনপুট বৈধ: parent সবসময় আগের কোনো কমিট বা \`-\`।`,
    editorial: `## ধারণা
\`git log\` বর্তমান ব্রাঞ্চের ডগা থেকে শুরু করে parent লিংক ধরে পিছনে হাঁটে। যে কমিটে পৌঁছানো যায় না — যেমন অন্য ব্রাঞ্চের আলাদা কাজ — সেটা তালিকায় আসে না। ফলে কাজটা দুভাগ: আগে \`head\` থেকে গ্রাফ ঘুরে reachable কমিটের সেট বানাও, তারপর সেটটাকে নির্মাণ-ক্রমের উল্টোতে সাজাও। merge কমিটের দুই parent থাকলেও এই নিয়মই খাটে, কারণ দুটো পথই ঘুরে দেখা হয়।

## ধাপে ধাপে
1. \`n\` আর প্রতিটি কমিটের hash, parent তালিকা পড়ো; প্রতিটি hash-এর নির্মাণ-ক্রমের অবস্থান মনে রাখো।
2. \`head\` পড়ো, একটা স্ট্যাক বা কিউতে রাখো।
3. স্ট্যাক থেকে একটা কমিট নাও; নতুন হলে সেটা reachable সেটে যোগ করো এবং তার parent-গুলো স্ট্যাকে দাও।
4. স্ট্যাক খালি হলে reachable hash-গুলো অবস্থান অনুযায়ী উল্টো সাজাও।
5. প্রতিটি hash এক লাইনে ছাপো।

\`\`\`python
${logOrderPython}\`\`\`

## কমপ্লেক্সিটি
প্রতিটি কমিট ও parent লিংক একবার দেখা হয়, তাই গ্রাফ পরিভ্রমণ \`O(n)\`; সাজানো \`O(n log n)\`। মেমোরি \`O(n)\`।

## সাধারণ ভুল
- সব কমিট ছাপিয়ে ফেলা — অন্য ব্রাঞ্চের reachable নয় এমন কমিট বাদ পড়তে হবে।
- পুরনো থেকে নতুন ক্রমে ছাপা — \`git log\` নতুন আগে দেখায়।
- merge কমিটের শুধু প্রথম parent ধরা — দ্বিতীয় parent-এর পথের কমিটও reachable।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Git", "Version Control"],
    tests: [
      {
        input: "4\nc1 -\nc2 c1\nc3 c2\nc4 c1\nc3\n",
        expectedOutput: "c3\nc2\nc1\n",
        isSample: true,
      },
      {
        input: "5\nc1 -\nc2 c1\nc3 c1\nc4 c2\nm1 c3 c4\nm1\n",
        expectedOutput: "m1\nc4\nc3\nc2\nc1\n",
        isSample: true,
      },
      { input: "1\nroot -\nroot\n", expectedOutput: "root\n", isSample: false },
      {
        input: "6\na -\nb a\nc b\nd a\ne d\nf e\nc\n",
        expectedOutput: "c\nb\na\n",
        isSample: false,
      },
      {
        input: "6\nx -\ny x\nz y\np x\nq p\nm q z\nm\n",
        expectedOutput: "m\nq\np\nz\ny\nx\n",
        isSample: false,
      },
      {
        input: "8\na -\nb a\nc b\nd c\ne a\nf e\ng f\nh d\nh\n",
        expectedOutput: "h\nd\nc\nb\na\n",
        isSample: false,
      },
    ],
    referencePython: logOrderPython,
  },
];
