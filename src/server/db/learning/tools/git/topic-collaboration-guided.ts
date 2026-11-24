import type { SeedProblem } from "../../../seed-problems";

const prGatePython = `import sys

lines = sys.stdin.read().splitlines()
index = 0
required = int(lines[index].split()[1])
index += 1
count = int(lines[index].split()[1])
index += 1
required_checks = lines[index:index + count]
index += count
approvals = int(lines[index].split()[1])
index += 1
approval_names = lines[index:index + approvals]
index += approvals
count = int(lines[index].split()[1])
index += 1
checks = {}
for _ in range(count):
    name, status = lines[index].split()
    index += 1
    checks[name] = status
stale = lines[index].split()[1] == 'yes'
index += 1
conflicts = lines[index].split()[1] == 'yes'
reasons = []
if len(approval_names) < required:
    reasons.append('NEEDS_APPROVAL')
if any(checks.get(name) != 'pass' for name in required_checks):
    reasons.append('CHECKS_FAILING')
if stale:
    reasons.append('STALE_REVIEW')
if conflicts:
    reasons.append('CONFLICTS')
if reasons:
    print('BLOCKED')
    for reason in reasons:
        print(reason)
else:
    print('MERGE')
`;

const revertPlanPython = `import sys

lines = sys.stdin.read().splitlines()
n = int(lines[0])
history = [lines[i + 1] for i in range(n)]
bad = lines[n + 1].split()[1]
shared = lines[n + 2].split()[1] == 'yes'
if not shared and bad == history[-1]:
    command = 'git reset --soft HEAD~1'
    result = history[:-1]
else:
    command = 'git revert ' + bad
    result = history + [bad + '-revert']
print('cmd=' + command)
print('commits=' + str(len(result)))
print('history=' + (' '.join(result) if result else '-'))
`;

export const GIT_COLLABORATION_GUIDED_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-git-pr-gate",
    title: "PR Gate",
    statement: `মাহিন একটা protected branch চালাচ্ছে: merge করার আগে নির্দিষ্ট সংখ্যক approval, সব required check pass, টাটকা review, আর কোনো conflict থাকা যাবে না। নুসরাত একটা PR-এর অবস্থা দেখে সিদ্ধান্ত নিতে চায় এটা merge হবে কি না, আর না হলে কী কী আটকে আছে।

ইনপুটে ক্রমে থাকে: \`required-approvals <k>\`; \`required-checks <m>\` আর পরের \`m\` লাইনে চেকের নাম; \`approvals <a>\` আর পরের \`a\` লাইনে approver নাম; \`checks <c>\` আর পরের \`c\` লাইনে \`<name> pass|fail\`; \`stale yes|no\`; \`conflicts yes|no\`। কোনো required check রিপোর্টে না থাকলে সেটা fail ধরা হয়।

কোনো বাধা না থাকলে এক লাইনে \`MERGE\` ছাপাও। নাহলে প্রথম লাইনে \`BLOCKED\`, তারপর এই নির্দিষ্ট ক্রমে যতগুলো বাধা আছে এক লাইনে একটি করে: \`NEEDS_APPROVAL\`, \`CHECKS_FAILING\`, \`STALE_REVIEW\`, \`CONFLICTS\`।`,
    inputFormat: `উপরের ক্রমে সাতটি অংশ; প্রতিটি সংখ্যার পরে ঠিক ততগুলো লাইন।`,
    outputFormat: `\`MERGE\`, অথবা \`BLOCKED\` আর তারপর নির্দিষ্ট ক্রমে বাধার নাম।`,
    constraints: `\`0 <= k, a, m, c <= 200\`
নামে স্পেস নেই। একই required check একবারই আসে।`,
    editorial: `## ধারণা
Protected branch-এ merge একটি সিদ্ধান্ত-তালিকা: প্রতিটি নিয়ম আলাদা করে যাচাই করতে হয়, আর সবগুলো পাস করলে তবেই merge। এখানে চারটি নিয়ম নির্দিষ্ট ক্রমে আছে। approval সংখ্যা কম হলে \`NEEDS_APPROVAL\`; কোনো required check \`pass\` না হলে (বা রিপোর্টেই না থাকলে) \`CHECKS_FAILING\`; review পুরনো হয়ে গেলে \`STALE_REVIEW\`; আর conflict থাকলে \`CONFLICTS\`। ক্রমটা গুরুত্বপূর্ণ, কারণ আউটপুটে বাধাগুলো এই ক্রমেই থাকতে হবে।

## ধাপে ধাপে
1. required approval সংখ্যা, required check নাম, approval তালিকা, check ফল, stale আর conflict পতাকা পড়ো।
2. approval সংখ্যা কম হলে প্রথম বাধা যোগ করো।
3. প্রতিটি required check \`pass\` কি না দেখো; একটাও না হলে দ্বিতীয় বাধা।
4. stale হলে তৃতীয়, conflict হলে চতুর্থ বাধা যোগ করো।
5. বাধা থাকলে \`BLOCKED\` আর বাধাগুলো, নাহলে \`MERGE\` ছাপো।

\`\`\`python
${prGatePython}\`\`\`

## কমপ্লেক্সিটি
প্রতিটি check ও approval একবার দেখা হয়, তাই সময় \`O(k + m + a + c)\`, মেমোরি \`O(m + c)\`।

## সাধারণ ভুল
- required check রিপোর্টে নেই মানে পাস ধরে নেওয়া — না থাকা মানে যাচাই হয়নি, তাই fail।
- বাধার ক্রম এলোমেলো করা — আউটপুটে নির্দিষ্ট ক্রম দরকার।
- stale review আর কম approval একই বাধা ভাবা — দুটো আলাদা কারণে আলাদা লাইন।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["GitHub", "Code Review"],
    tests: [
      {
        input:
          "required-approvals 2\nrequired-checks 2\nlint\nbuild\napprovals 2\nnusrat\nmahin\nchecks 2\nlint pass\nbuild pass\nstale no\nconflicts no\n",
        expectedOutput: "MERGE\n",
        isSample: true,
      },
      {
        input:
          "required-approvals 1\nrequired-checks 2\nlint\nunit\napprovals 1\nnusrat\nchecks 2\nlint pass\nunit fail\nstale no\nconflicts yes\n",
        expectedOutput: "BLOCKED\nCHECKS_FAILING\nCONFLICTS\n",
        isSample: true,
      },
      {
        input:
          "required-approvals 2\nrequired-checks 1\nbuild\napprovals 1\nnusrat\nchecks 1\nbuild pass\nstale no\nconflicts no\n",
        expectedOutput: "BLOCKED\nNEEDS_APPROVAL\n",
        isSample: false,
      },
      {
        input:
          "required-approvals 3\nrequired-checks 2\nlint\ne2e\napprovals 0\nchecks 1\nlint fail\nstale yes\nconflicts yes\n",
        expectedOutput:
          "BLOCKED\nNEEDS_APPROVAL\nCHECKS_FAILING\nSTALE_REVIEW\nCONFLICTS\n",
        isSample: false,
      },
      {
        input:
          "required-approvals 1\nrequired-checks 2\nlint\ne2e\napprovals 1\nmahin\nchecks 1\nlint pass\nstale no\nconflicts no\n",
        expectedOutput: "BLOCKED\nCHECKS_FAILING\n",
        isSample: false,
      },
      {
        input:
          "required-approvals 0\nrequired-checks 0\napprovals 0\nchecks 0\nstale no\nconflicts no\n",
        expectedOutput: "MERGE\n",
        isSample: false,
      },
    ],
    referencePython: prGatePython,
  },
  {
    slug: "learn-git-revert-plan",
    title: "Revert Plan",
    statement: `একটা ভুল commit ইতিমধ্যে main-এ push হয়ে গেছে, আর নুসরাত জানতে চায় কীভাবে ঠিক করবে। মাহিন শিখিয়েছে: shared ব্রাঞ্চের ইতিহাস reset দিয়ে ভাঙা যায় না, কারণ অন্য সবার কাছে পুরনো ইতিহাস আছে — নিরাপদ উপায় হলো \`git revert\` দিয়ে নতুন commit যোগ করা। শুধু push না করা শেষ commit হলে \`git reset --soft\` দিয়ে সেটা সরানো যায়, কারণ কিছুই শেয়ার হয়নি।

ইনপুটের প্রথম লাইনে \`n\`; পরের \`n\` লাইনে রৈখিক ইতিহাসের hash পুরনো থেকে নতুন। এরপর \`bad <hash>\` আর \`shared yes|no\`।

প্রথম লাইনে সিদ্ধান্তের কমান্ড: shared হলে বা bad commit ডগা না হলে \`git revert <hash>\`; shared না হলে আর bad ডগা হলে \`git reset --soft HEAD~1\`। দ্বিতীয় লাইনে \`commits=<অপারেশনের পর মোট commit>\`। তৃতীয় লাইনে \`history=<স্পেস দিয়ে আলাদা hash, খালি হলে ->\`; revert হলে শেষে \`<hash>-revert\` যোগ হয়।`,
    inputFormat: `প্রথম লাইনে \`n\`। পরের \`n\` লাইনে hash। তারপর \`bad <hash>\` আর \`shared yes|no\`।`,
    outputFormat: `তিন লাইন: \`cmd=...\`, \`commits=...\`, \`history=...\`।`,
    constraints: `\`1 <= n <= 2000\`
bad hash ইতিহাসে থাকে। hash-এ স্পেস নেই।`,
    editorial: `## ধারণা
ইতিহাস ঠিক করার নিয়মটা নির্ভর করে সেটা কতজন দেখেছে তার উপর। shared ব্রাঞ্চে rewrite করা মানে সবার \`origin/main\` আর লোকাল কপির মধ্যে ফাটল তৈরি করা, তাই সেখানে একমাত্র নিরাপদ কাজ হলো উল্টো পরিবর্তন এনে নতুন commit যোগ করা — \`git revert\`। আর যদি commit এখনো push না হয় এবং সেটাই সবার শেষ commit হয়, তাহলে \`git reset --soft HEAD~1\` দিয়ে commit-টা সরিয়ে পরিবর্তনগুলো স্টেজে রেখে দেওয়া যায়; কিছুই শেয়ার হয়নি বলে ঝুঁকি নেই। মাঝখানের কমিট হলে reset দিয়ে আলাদা করা যায় না, তাই সেখানেও revert।

## ধাপে ধাপে
1. \`n\` আর ইতিহাস পড়ো।
2. \`bad\` hash আর \`shared\` পতাকা পড়ো।
3. shared হলে revert বেছে নাও।
4. shared না হলে দেখো bad কি শেষ commit; হলে reset --soft, নাহলে revert।
5. revert হলে ইতিহাসের শেষে \`<bad>-revert\` যোগ করো; reset হলে শেষ commit বাদ দাও। তারপর তিন লাইন ছাপো।

\`\`\`python
${revertPlanPython}\`\`\`

## কমপ্লেক্সিটি
তালিকা কপি করা ছাড়া বাড়তি কাজ নেই, তাই সময় \`O(n)\`, মেমোরি \`O(n)\`।

## সাধারণ ভুল
- shared ব্রাঞ্চে \`reset --hard\` দিয়ে ইতিহাস মুছে ফেলা — দলের সবাইর পরের push ভেঙে যায়।
- reset করার পরও \`<bad>-revert\` যোগ করা — reset-এ নতুন commit তৈরি হয় না।
- revert-এর পর commit সংখ্যা না বাড়ানো — revert নিজেই একটা নতুন commit।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Git", "Collaboration"],
    tests: [
      {
        input: "4\na1\nb2\nc3\nd4\nbad c3\nshared yes\n",
        expectedOutput: "cmd=git revert c3\ncommits=5\nhistory=a1 b2 c3 d4 c3-revert\n",
        isSample: true,
      },
      {
        input: "4\na1\nb2\nc3\nd4\nbad d4\nshared no\n",
        expectedOutput: "cmd=git reset --soft HEAD~1\ncommits=3\nhistory=a1 b2 c3\n",
        isSample: true,
      },
      {
        input: "3\na1\nb2\nc3\nbad a1\nshared no\n",
        expectedOutput: "cmd=git revert a1\ncommits=4\nhistory=a1 b2 c3 a1-revert\n",
        isSample: false,
      },
      {
        input: "3\na1\nb2\nc3\nbad b2\nshared yes\n",
        expectedOutput: "cmd=git revert b2\ncommits=4\nhistory=a1 b2 c3 b2-revert\n",
        isSample: false,
      },
      {
        input: "2\na1\nb2\nbad b2\nshared no\n",
        expectedOutput: "cmd=git reset --soft HEAD~1\ncommits=1\nhistory=a1\n",
        isSample: false,
      },
      {
        input: "1\na1\nbad a1\nshared yes\n",
        expectedOutput: "cmd=git revert a1\ncommits=2\nhistory=a1 a1-revert\n",
        isSample: false,
      },
    ],
    referencePython: revertPlanPython,
  },
];
