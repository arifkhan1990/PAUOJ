import type { SeedProblem } from "../../../seed-problems";

const releaseGatePython = `import sys

lines = sys.stdin.read().splitlines()
index = 0
commits = int(lines[index].split()[1])
index += 1
count = int(lines[index].split()[1])
index += 1
checks = []
for _ in range(count):
    name, status = lines[index].split()
    index += 1
    checks.append((name, status))
approvals = int(lines[index].split()[1])
index += 1
required = int(lines[index].split()[1])
index += 1
changelog = lines[index].split()[1] == 'yes'
index += 1
tag_exists = lines[index].split()[1] == 'yes'
index += 1
version = lines[index].split()[1]
blockers = []
if commits == 0:
    blockers.append('NO_COMMITS')
if any(status != 'pass' for _, status in checks):
    blockers.append('CHECKS_FAILING')
if approvals < required:
    blockers.append('NEEDS_APPROVAL')
if not changelog:
    blockers.append('MISSING_CHANGELOG')
if tag_exists:
    blockers.append('TAG_EXISTS')
if blockers:
    print('NO-GO')
    for blocker in blockers:
        print(blocker)
else:
    print('GO ' + version)
`;

export const GIT_CHECKPOINT_RELEASE_PROBLEM: SeedProblem = {
  slug: "learn-git-check-release",
  title: "Release Readiness",
  statement: `নুসরাত রিলিজের আগে চেকলিস্ট মিলাচ্ছে: কমিট আছে কি না, সব check pass কি না, দরকারি approval আছে কি না, changelog লেখা কি না, আর tag আগেই তৈরি হয়ে গেছে কি না। একটাও সমস্যা না থাকলে রিলিজ যাবে, নাহলে আটকাবে।

ইনপুট লাইনগুলো: \`commits <n>\`; \`checks <m>\` আর পরের \`m\` লাইনে \`<name> pass|fail\`; \`approvals <a>\`; \`required-approvals <k>\`; \`changelog yes|no\`; \`tag-exists yes|no\`; \`version <vX.Y.Z>\`।

কোনো বাধা না থাকলে এক লাইনে \`GO <version>\` ছাপাও। নাহলে প্রথম লাইনে \`NO-GO\`, তারপর এই নির্দিষ্ট ক্রমে বাধাগুলো এক লাইনে একটি করে: \`NO_COMMITS\`, \`CHECKS_FAILING\`, \`NEEDS_APPROVAL\`, \`MISSING_CHANGELOG\`, \`TAG_EXISTS\`।`,
  inputFormat: `উপরের ক্রমে সাতটি অংশ; \`checks\`-এর সংখ্যার পরে ঠিক ততগুলো লাইন।`,
  outputFormat: `\`GO <version>\`, অথবা \`NO-GO\` আর তারপর নির্দিষ্ট ক্রমে বাধার নাম।`,
  constraints: `\`0 <= n, m, a, k <= 500\`
চেকের নামে স্পেস নেই। একই চেক একবারই আসে।`,
  editorial: `## ধারণা
রিলিজ একটি গেট, একটি অনুমান নয়। প্রতিটি শর্ত আলাদা করে যাচাই করতে হয়, আর একটাও ব্যর্থ হলে রিলিজ আটকাতে হয়। এখানে পাঁচটি বাধা নির্দিষ্ট ক্রমে আছে: কোনো কমিট না থাকা, কোনো check fail, approval সংখ্যা কম, changelog অনুপস্থিত, আর একই tag আগেই তৈরি হয়ে যাওয়া। শেষটা বিশেষভাবে বিপজ্জনক, কারণ একই tag আবার দেওয়ার চেষ্টা করলে git তা প্রত্যাখ্যান করে, আর জোর করে সরালে অন্যরা ভুল commit-এ tag পেতে পারে। তাই tag-exists হলে রিলিজ থামিয়ে নতুন ভার্সন ঠিক করতে হয়।

## ধাপে ধাপে
1. \`commits\` সংখ্যা আর check তালিকা পড়ো।
2. approval সংখ্যা, required approval, changelog আর tag-exists পড়ো।
3. কমিট শূন্য হলে \`NO_COMMITS\` যোগ করো।
4. কোনো check pass না হলে \`CHECKS_FAILING\`, approval কম হলে \`NEEDS_APPROVAL\`।
5. changelog না থাকলে \`MISSING_CHANGELOG\`, tag আগেই থাকলে \`TAG_EXISTS\`।
6. বাধা থাকলে \`NO-GO\` আর বাধাগুলো, নাহলে \`GO <version>\` ছাপো।

\`\`\`python
${releaseGatePython}\`\`\`

## কমপ্লেক্সিটি
প্রতিটি লাইন একবার পড়া হয়, তাই সময় \`O(m)\`, মেমোরি \`O(m)\`।

## সাধারণ ভুল
- tag আগেই আছে কি না না দেখে একই tag আবার দেওয়া — git ব্যর্থ হবে।
- বাধার ক্রম এলোমেলো করা — আউটপুটে নির্দিষ্ট ক্রম দরকার।
- \`GO\`-র সাথে ভার্সন না ছাপানো — রিলিজের target স্পষ্ট থাকতে হবে।`,
  difficulty: "MEDIUM",
  points: 200,
  timeLimitMs: 1000,
  memoryLimitMb: 256,
  tags: ["DevOps", "Release"],
  tests: [
    {
      input:
        "commits 7\nchecks 2\nlint pass\nunit pass\napprovals 2\nrequired-approvals 2\nchangelog yes\ntag-exists no\nversion v1.5.0\n",
      expectedOutput: "GO v1.5.0\n",
      isSample: true,
    },
    {
      input:
        "commits 3\nchecks 2\nlint pass\ne2e fail\napprovals 1\nrequired-approvals 2\nchangelog no\ntag-exists yes\nversion v1.2.0\n",
      expectedOutput:
        "NO-GO\nCHECKS_FAILING\nNEEDS_APPROVAL\nMISSING_CHANGELOG\nTAG_EXISTS\n",
      isSample: true,
    },
    {
      input:
        "commits 0\nchecks 0\napprovals 0\nrequired-approvals 1\nchangelog yes\ntag-exists no\nversion v2.0.0\n",
      expectedOutput: "NO-GO\nNO_COMMITS\nNEEDS_APPROVAL\n",
      isSample: false,
    },
    {
      input:
        "commits 5\nchecks 1\nbuild pass\napprovals 3\nrequired-approvals 1\nchangelog yes\ntag-exists yes\nversion v1.0.0\n",
      expectedOutput: "NO-GO\nTAG_EXISTS\n",
      isSample: false,
    },
    {
      input:
        "commits 2\nchecks 1\nbuild pass\napprovals 1\nrequired-approvals 1\nchangelog no\ntag-exists no\nversion v0.2.0\n",
      expectedOutput: "NO-GO\nMISSING_CHANGELOG\n",
      isSample: false,
    },
    {
      input:
        "commits 4\nchecks 0\napprovals 0\nrequired-approvals 0\nchangelog yes\ntag-exists no\nversion v3.1.4\n",
      expectedOutput: "GO v3.1.4\n",
      isSample: false,
    },
  ],
  referencePython: releaseGatePython,
};
