import type { SeedProblem } from "../../../seed-problems";

const ignoreRulesPython = `import sys


def matches(path, body):
    if body.startswith('*.'):
        return path.endswith(body[1:])
    if body.startswith('**/'):
        name = body[3:]
        return (
            path == name
            or path.startswith(name + '/')
            or ('/' + name + '/') in path
            or path.endswith('/' + name)
        )
    if body.endswith('/'):
        name = body[:-1]
        return path.startswith(name + '/') or ('/' + name + '/') in path
    return path.rsplit('/', 1)[-1] == body


lines = sys.stdin.read().splitlines()
index = 0
n = int(lines[index])
index += 1
paths = lines[index:index + n]
index += n
m = int(lines[index])
index += 1
patterns = lines[index:index + m]
for path in paths:
    ignored = False
    for pattern in patterns:
        negated = pattern.startswith('!')
        body = pattern[1:] if negated else pattern
        if matches(path, body):
            ignored = not negated
    print('IGNORED' if ignored else 'TRACKED')
`;

const commitFixPython = `import sys

lines = sys.stdin.read().splitlines()
q = int(lines[0])
for i in range(q):
    parts = lines[i + 1].split()
    kind = parts[0]
    if kind == 'unwanted':
        print('git restore --staged ' + parts[1])
    elif kind == 'modified':
        print('git add ' + parts[1])
    elif kind == 'message':
        print('git commit --amend -m "' + parts[1] + '"')
    else:
        print('git restore --staged .')
`;

export const GIT_SNAPSHOTS_EXTRA_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-git-ignore-rules",
    title: "Ignore Rules",
    statement: `মাহিন \`.gitignore\`-এর আসল নিয়মটা দেখাচ্ছে: একই পাথে একাধিক প্যাটার্ন মিললে শেষ যে প্যাটার্ন মেলে সেটাই জেতে। তাই \`*.log\` দিয়ে সব লগ বাদ দেওয়ার পর \`!keep.log\` লিখে একটা ফাইল আবার ফেরানো যায়। নুসরাত কয়েকটা পাথ নিয়ে নিয়মটা হাতে-কলমে যাচাই করতে চায়।

\`n\`টি পাথ আর \`m\`টি প্যাটার্ন দেওয়া থাকে। প্যাটার্নের সামনে \`!\` থাকলে সেটা negation। প্রতিটি প্যাটার্ন এই নিয়মে মেলে: \`*.ext\` শেষে \`.ext\` থাকলে; \`name/\` পাথের কোনো ডিরেক্টরি \`name\` হলে; \`**/name\` পাথের যেকোনো জায়গায় \`name\` কম্পোনেন্ট থাকলে; আর সাধারণ \`name\` পাথের শেষ কম্পোনেন্ট ঠিক \`name\` হলে।

প্রতিটি পাথের জন্য ইনপুট ক্রমে এক লাইনে \`IGNORED\` বা \`TRACKED\` ছাপাও। প্যাটার্নগুলো ক্রমে দেখো, শেষ মেলা প্যাটার্নই চূড়ান্ত সিদ্ধান্ত দেয়।`,
    inputFormat: `প্রথম লাইনে \`n\`, পরের \`n\` লাইনে পাথ। তারপর \`m\`, পরের \`m\` লাইনে প্যাটার্ন।`,
    outputFormat: `প্রতিটি পাথের জন্য এক লাইনে \`IGNORED\` অথবা \`TRACKED\`, ইনপুট ক্রমে।`,
    constraints: `\`0 <= n <= 5000\`
\`0 <= m <= 50\`
পাথে স্পেস নেই। প্যাটার্ন কেবল \`!name\`, \`*.ext\`, \`name/\`, \`**/name\` আকারে আসে।`,
    editorial: `## ধারণা
Git-এর ignore নিয়মটা "প্রথমে যা মিলল" নয়, "শেষে যা মিলল" — অর্থাৎ প্রতিটি প্যাটার্ন ক্রমে দেখে \`ignored\` পতাকা সেট বা রিসেট করতে হয়। \`!\` দিয়ে শুরু হওয়া প্যাটার্ন মানে আগের সিদ্ধান্ত উল্টে দেওয়া, তাই \`*.log\`-এর পরে \`!keep.log\` এলে \`keep.log\` আবার track হয়। এখানে প্যাটার্নের চার রূপ: extension, ডিরেক্টরি, যেকোনো গভীরতার কম্পোনেন্ট, আর ঠিক শেষ কম্পোনেন্ট।

## ধাপে ধাপে
1. \`n\` আর পাথগুলো পড়ো, তারপর \`m\` আর প্যাটার্নগুলো।
2. প্রতিটি পাথের জন্য \`ignored = False\` দিয়ে শুরু করো।
3. প্রতিটি প্যাটার্নে \`!\` আছে কি না দেখে \`negated\` ঠিক করো, বাকি অংশটা দিয়ে মিল খোঁজো।
4. মিললে \`ignored\` কে \`not negated\` করো; না মিললে আগের মানই থাকে।
5. শেষে \`IGNORED\` বা \`TRACKED\` ছাপো।

\`\`\`python
${ignoreRulesPython}\`\`\`

## কমপ্লেক্সিটি
প্রতি পাথে \`m\` প্যাটার্ন মেলানো হয়, তাই সময় \`O(n * m)\`; প্রতিটি মিল পরীক্ষা পাথের দৈর্ঘ্যের সমান। মেমোরি \`O(n)\`।

## সাধারণ ভুল
- প্যাটার্নের ক্রম উপেক্ষা করা — \`!keep.log\` আগে আর \`*.log\` পরে থাকলে ফল উল্টে যায়।
- \`**/name\` কে কেবল শুরুতে মেলানো — \`a/b/name/c\`-এর মতো গভীর পাথও মেলে।
- negation-এ \`!\` অংশটা প্যাটার্নের ভেতরে রেখে দেওয়া — মেলানোর আগে সেটা সরাতে হয়।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Git", "Version Control"],
    tests: [
      {
        input: "4\napp.log\nlogs/keep.log\nbuild/out.bin\nsrc/app.ts\n3\n*.log\nbuild/\n!keep.log\n",
        expectedOutput: "IGNORED\nTRACKED\nIGNORED\nTRACKED\n",
        isSample: true,
      },
      {
        input: "2\nkeep.log\ndebug.log\n2\n!keep.log\n*.log\n",
        expectedOutput: "IGNORED\nIGNORED\n",
        isSample: true,
      },
      {
        input: "3\ntmp/x.txt\na/tmp/y.txt\na/tmpfile.txt\n1\n**/tmp\n",
        expectedOutput: "IGNORED\nIGNORED\nTRACKED\n",
        isSample: false,
      },
      {
        input: "4\nbuild/a.o\nbuildx/c.ts\nsrc/build/b.o\nsrc/builder/d.ts\n1\nbuild/\n",
        expectedOutput: "IGNORED\nTRACKED\nIGNORED\nTRACKED\n",
        isSample: false,
      },
      {
        input: "3\na.log\nb.txt\ntmp/x\n0\n",
        expectedOutput: "TRACKED\nTRACKED\nTRACKED\n",
        isSample: false,
      },
      {
        input: "4\ntmp/keep.txt\ncache/tmp/keep.txt\ncache/tmp/drop.txt\ncache/tmps/x\n3\n**/tmp\n!keep.txt\n",
        expectedOutput: "TRACKED\nTRACKED\nIGNORED\nTRACKED\n",
        isSample: false,
      },
    ],
    referencePython: ignoreRulesPython,
  },
  {
    slug: "learn-git-commit-fix",
    title: "Commit Fix",
    statement: `মাহিন নুসরাতকে তিনটা সাধারণ ভুল দেখাল: ভুলে একটা ফাইল স্টেজ হয়ে গেছে, স্টেজ করার পরে ফাইলটা আবার বদলেছে, আর শেষ commit-এর message ভুল হয়েছে। প্রতিটার জন্য সবচেয়ে ছোট নিরাপদ কমান্ড আলাদা, আর ভুল কমান্ড দিলে কাজ হারিয়ে যেতে পারে।

প্রথম লাইনে \`q\`টি পরিস্থিতি থাকে। প্রতিটি লাইনে \`kind\` আর দরকার হলে একটি argument থাকে:

- \`unwanted <file>\` — ফাইলটা ভুলে স্টেজ হয়েছে।
- \`modified <file>\` — স্টেজ করার পরে ফাইলে নতুন পরিবর্তন এসেছে।
- \`message <word>\` — শেষ commit-এর message ভুল, commit এখনো push হয়নি।
- \`unstage-all\` — সব স্টেজিং বাতিল করতে হবে।

প্রতিটি পরিস্থিতির জন্য এক লাইনে ঠিক কমান্ডটি ছাপাও: \`git restore --staged <file>\`, \`git add <file>\`, \`git commit --amend -m "<word>"\`, অথবা \`git restore --staged .\`।`,
    inputFormat: `প্রথম লাইনে \`q\`। পরের \`q\` লাইনে \`unwanted <file>\`, \`modified <file>\`, \`message <word>\` বা \`unstage-all\`।`,
    outputFormat: `প্রতিটি পরিস্থিতির জন্য এক লাইনে সংশ্লিষ্ট কমান্ড, ইনপুট ক্রমে।`,
    constraints: `\`0 <= q <= 2000\`
ফাইলের পাথে স্পেস নেই। \`word\` এক শব্দের, সাধারণত underscore দিয়ে লেখা।`,
    editorial: `## ধারণা
স্টেজিং ভুল ঠিক করার নিয়ম হলো সবচেয়ে ছোট কাজটা করা, যাতে অন্য কিছু না বদলায়। ফাইল ভুলে স্টেজ হলে শুধু সেটাকে unstage করলেই হয় — \`git restore --staged <file>\`। স্টেজ করার পরে ফাইল বদলালে working tree-তে নতুন পরিবর্তন জমা থাকে, তাই আবার \`git add\` দরকার। message ভুল হলে (এবং commit push না হলে) \`git commit --amend\` দিয়ে শেষ commit-টাই ঠিক করা যায়। আর সব স্টেজিং একসাথে বাতিল করতে \`git restore --staged .\`।

## ধাপে ধাপে
1. \`q\` আর পরিস্থিতিগুলো পড়ো।
2. প্রতিটি লাইনের প্রথম শব্দ \`kind\` দেখো।
3. \`unwanted\` হলে ফাইলের নাম নিয়ে \`git restore --staged\` বানাও।
4. \`modified\` হলে \`git add\`, \`message\` হলে amend, আর \`unstage-all\` হলে ডট দিয়ে unstage।
5. প্রতিটি কমান্ড এক লাইনে ছাপো।

\`\`\`python
${commitFixPython}\`\`\`

## কমপ্লেক্সিটি
প্রতিটি পরিস্থিতি একবার দেখা হয়, তাই সময় \`O(q)\`; মেমোরি \`O(1)\` অতিরিক্ত।

## সাধারণ ভুল
- ভুলে স্টেজ হওয়া ফাইলে \`git reset --hard\` চালানো — তাতে অন্য কাজও হারায়; শুধু unstage-ই যথেষ্ট।
- amend করা push হয়ে যাওয়া commit-এ — সেটা shared ইতিহাস বদলে দেয়, তাই এই সমস্যায় এমন পরিস্থিতি নেই।
- ফাইল বদলানোর পরেও পুরনো স্টেজ ধরে commit করা — শেষ মুহূর্তের পরিবর্তন commit-এ ঢোকে না।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Git", "Version Control"],
    tests: [
      {
        input: "3\nunwanted notes.txt\nmodified src/app.ts\nmessage fix_login_bug\n",
        expectedOutput:
          'git restore --staged notes.txt\ngit add src/app.ts\ngit commit --amend -m "fix_login_bug"\n',
        isSample: true,
      },
      {
        input: "2\nunstage-all\nunwanted .env\n",
        expectedOutput: "git restore --staged .\ngit restore --staged .env\n",
        isSample: true,
      },
      {
        input: "1\nmessage update_readme\n",
        expectedOutput: 'git commit --amend -m "update_readme"\n',
        isSample: false,
      },
      {
        input: "1\nunwanted build/out.bin\n",
        expectedOutput: "git restore --staged build/out.bin\n",
        isSample: false,
      },
      { input: "0\n", expectedOutput: "", isSample: false },
      {
        input: "4\nmodified package.json\nunwanted debug.log\nmessage add_tests\nmodified src/db/schema.ts\n",
        expectedOutput:
          'git add package.json\ngit restore --staged debug.log\ngit commit --amend -m "add_tests"\ngit add src/db/schema.ts\n',
        isSample: false,
      },
    ],
    referencePython: commitFixPython,
  },
];
