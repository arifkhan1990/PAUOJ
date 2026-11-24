import type { SeedProblem } from "../../../seed-problems";

const remoteSyncPython = `import sys

lines = sys.stdin.read().splitlines()
q = int(lines[0])
for i in range(q):
    local, remote, related = lines[i + 1].split()
    ahead = int(local)
    behind = int(remote)
    if ahead == 0 and behind == 0:
        action = 'up-to-date'
    elif related == 'no':
        action = 'diverged'
    elif behind == 0:
        action = 'push'
    elif ahead == 0:
        action = 'pull --ff-only'
    else:
        action = 'pull --rebase'
    print('ahead=' + str(ahead) + ' behind=' + str(behind) + ' action=' + action)
`;

const tagReleasePython = `import sys

lines = sys.stdin.read().splitlines()
index = 0
n = int(lines[index])
index += 1
versions = []
for _ in range(n):
    major, minor, patch = map(int, lines[index].lstrip('v').split('.'))
    index += 1
    versions.append((major, minor, patch))
m = int(lines[index])
index += 1
kinds = lines[index:index + m]
major, minor, patch = max(versions)
if 'breaking' in kinds:
    major += 1
    minor = 0
    patch = 0
    bump = 'major'
elif 'feat' in kinds:
    minor += 1
    patch = 0
    bump = 'minor'
else:
    patch += 1
    bump = 'patch'
print('tag=v' + str(major) + '.' + str(minor) + '.' + str(patch))
print('bump=' + bump)
`;

export const GIT_COLLABORATION_EXTRA_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-git-remote-sync",
    title: "Remote Sync",
    statement: `নুসরাতের লোকাল ব্রাঞ্চ আর origin/main আলাদা পথে এগিয়েছে কি না সেটা বুঝতে হবে। মাহিন বলল, আগে গুনে দেখো লোকালে কয়টা commit আছে যা রিমোটে নেই (ahead) আর রিমোটে কয়টা আছে যা লোকালে নেই (behind); তারপর পরিস্থিতি অনুযায়ী কাজ ঠিক করো।

প্রথম লাইনে \`q\`টি প্রশ্ন। প্রতিটি লাইনে \`local_only remote_only related\`, যেখানে \`related\` বলে দুদিকের ইতিহাসের সাধারণ পূর্বপুরুষ আছে কি না (\`yes\`/\`no\`)।

প্রতিটি প্রশ্নের জন্য এক লাইনে \`ahead=<l> behind=<r> action=<action>\` ছাপাও। নিয়ম: দুটোই শূন্য হলে \`up-to-date\`; related না হলে \`diverged\`; behind শূন্য হলে \`push\`; ahead শূন্য হলে \`pull --ff-only\`; নাহলে \`pull --rebase\`।`,
    inputFormat: `প্রথম লাইনে \`q\`। পরের \`q\` লাইনে \`local_only remote_only related\`।`,
    outputFormat: `প্রতিটি প্রশ্নের জন্য এক লাইনে \`ahead=<l> behind=<r> action=<action>\`।`,
    constraints: `\`1 <= q <= 2000\`
\`0 <= local_only, remote_only <= 10^9\`
\`related\` হলো \`yes\` বা \`no\`।`,
    editorial: `## ধারণা
লোকাল আর রিমোটের সম্পর্ক চার রকম। দুটোতেই নতুন commit না থাকলে কিছু করার নেই। শুধু লোকালে থাকলে সেগুলো রিমোটে পাঠাতে হবে — \`push\`। শুধু রিমোটে থাকলে লোকাল শাখা পিছিয়ে আছে, তাই \`pull --ff-only\` নিরাপদ: নতুন merge commit ছাড়া এগিয়ে যাবে। আর দুই পাশেই আলাদা commit থাকলে ইতিহাস ভাগ হয়ে গেছে; সাধারণ পূর্বপুরুষ থাকলে লোকাল commit-গুলো রিমোটের উপরে বসিয়ে \`pull --rebase\` করা যায়। পূর্বপুরুষই না থাকলে (unrelated histories) স্বয়ংক্রিয় কিছুই নিরাপদ নয় — সেটা \`diverged\`।

## ধাপে ধাপে
1. \`q\` আর প্রতিটি লাইনের তিন মান পড়ো।
2. দুটোই শূন্য হলে \`up-to-date\`.
3. related \`no\` হলে \`diverged\`.
4. behind শূন্য হলে \`push\`; ahead শূন্য হলে \`pull --ff-only\`.
5. নাহলে \`pull --rebase\`। প্রতিটি লাইনে ahead, behind আর action ছাপো।

\`\`\`python
${remoteSyncPython}\`\`\`

## কমপ্লেক্সিটি
প্রতি প্রশ্নে ধ্রুবক কাজ, তাই সময় \`O(q)\`, মেমোরি \`O(1)\` অতিরিক্ত।

## সাধারণ ভুল
- শুধু behind থাকলেও \`pull --rebase\` বলা — fast-forward সম্ভব হলে সেটাই পরিষ্কার।
- দুটোই শূন্য হলে \`push\` বলা — পাঠানোর কিছু নেই।
- unrelated history-তেও \`pull --rebase\` বলা — সাধারণ পূর্বপুরুষ না থাকলে rebase অর্থহীন।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Git", "Remote"],
    tests: [
      {
        input: "4\n0 0 yes\n3 0 yes\n0 2 yes\n2 3 yes\n",
        expectedOutput:
          "ahead=0 behind=0 action=up-to-date\nahead=3 behind=0 action=push\nahead=0 behind=2 action=pull --ff-only\nahead=2 behind=3 action=pull --rebase\n",
        isSample: true,
      },
      {
        input: "2\n1 1 no\n4 0 no\n",
        expectedOutput:
          "ahead=1 behind=1 action=diverged\nahead=4 behind=0 action=diverged\n",
        isSample: true,
      },
      {
        input: "1\n0 0 yes\n",
        expectedOutput: "ahead=0 behind=0 action=up-to-date\n",
        isSample: false,
      },
      {
        input: "3\n5 0 yes\n0 5 yes\n1 1 yes\n",
        expectedOutput:
          "ahead=5 behind=0 action=push\nahead=0 behind=5 action=pull --ff-only\nahead=1 behind=1 action=pull --rebase\n",
        isSample: false,
      },
      {
        input: "1\n0 1 no\n",
        expectedOutput: "ahead=0 behind=1 action=diverged\n",
        isSample: false,
      },
      {
        input: "2\n10 4 yes\n0 0 yes\n",
        expectedOutput:
          "ahead=10 behind=4 action=pull --rebase\nahead=0 behind=0 action=up-to-date\n",
        isSample: false,
      },
    ],
    referencePython: remoteSyncPython,
  },
  {
    slug: "learn-git-tag-release",
    title: "Next Release Tag",
    statement: `রিলিজের আগে নুসরাত ঠিক করতে চায় পরের tag কী হবে। মাহিন বলল, semver-এ সংখ্যা তুলনা করতে হয় সংখ্যা হিসেবে, তাই \`v1.10.0\` আসলে \`v1.9.9\`-এর চেয়ে বড়। তারপর পরিবর্তনের ধরন দেখে বাড়াতে হয়: breaking change থাকলে major, নাহলে নতুন feature থাকলে minor, নাহলে patch; আর নিচের অংশগুলো শূন্য হয়ে যায়।

প্রথম লাইনে \`n\`টি পুরনো tag, পরের \`n\` লাইনে \`vX.Y.Z\`। তারপর \`m\`টি পরিবর্তনের ধরন, প্রতিটি লাইনে \`breaking\`, \`feat\` বা \`fix\`।

প্রথম লাইনে \`tag=v<নতুন ভার্সন>\`, দ্বিতীয় লাইনে \`bump=major|minor|patch\` ছাপাও।`,
    inputFormat: `প্রথম লাইনে \`n\`, পরের \`n\` লাইনে tag। তারপর \`m\`, পরের \`m\` লাইনে পরিবর্তনের ধরন।`,
    outputFormat: `প্রথম লাইনে \`tag=vX.Y.Z\`, দ্বিতীয় লাইনে \`bump=<major|minor|patch>\`।`,
    constraints: `\`1 <= n <= 2000\`
\`1 <= m <= 2000\`
প্রতিটি tag \`vX.Y.Z\` আকারে, \`0 <= X, Y, Z <= 10^9\`।`,
    editorial: `## ধারণা
Semver-এ ভার্সনের তিন অংশ আলাদা সংখ্যা, তাই তুলনা করতে হয় tuple হিসেবে: আগে major, সমান হলে minor, তারপর patch। স্ট্রিং হিসেবে তুলনা করলে \`v1.10.0\` আর \`v1.9.9\`-এর ক্রম উল্টে যায়। সবচেয়ে বড় পুরনো ভার্সন থেকে শুরু করে পরিবর্তনের ধরন দেখে বাড়াতে হয়। breaking থাকলে major বাড়ে আর minor, patch শূন্য; নতুন feature থাকলে minor বাড়ে আর patch শূন্য; শুধু fix হলে patch এক বাড়ে। নিচের অংশ শূন্য করার নিয়মটা ভুললে \`v2.3.4\` থেকে breaking-এ \`v3.3.4\` আসবে, যা ভুল।

## ধাপে ধাপে
1. সব tag পড়ে \`(major, minor, patch)\` টুপলে ভাঙো।
2. tuple হিসেবে সর্বোচ্চটা বেছে নাও।
3. পরিবর্তনের তালিকায় \`breaking\` আছে কি না দেখো; থাকলে major বাড়াও, বাকি দুটো শূন্য করো।
4. নাহলে \`feat\` দেখো; থাকলে minor বাড়াও, patch শূন্য করো।
5. নাহলে patch এক বাড়াও। তারপর tag আর bump ছাপো।

\`\`\`python
${tagReleasePython}\`\`\`

## কমপ্লেক্সিটি
tag পড়া আর সর্বোচ্চ বের করা \`O(n)\`, পরিবর্তন দেখা \`O(m)\`; মেমোরি \`O(n)\`।

## সাধারণ ভুল
- ভার্সন স্ট্রিং হিসেবে তুলনা করা — \`v1.10.0\` \`v1.9.9\`-এর চেয়ে ছোট হয়ে যায়।
- major বা minor বাড়িয়ে নিচের অংশ শূন্য না করা।
- \`breaking\` আর \`feat\` একসাথে থাকলে minor বেছে নেওয়া — breaking সবসময় জেতে।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Git", "Release"],
    tests: [
      {
        input: "3\nv1.9.0\nv1.10.2\nv1.2.0\n2\nfix\nfeat\n",
        expectedOutput: "tag=v1.11.0\nbump=minor\n",
        isSample: true,
      },
      {
        input: "2\nv2.3.4\nv2.3.9\n2\nfeat\nbreaking\n",
        expectedOutput: "tag=v3.0.0\nbump=major\n",
        isSample: true,
      },
      {
        input: "1\nv0.4.7\n1\nfix\n",
        expectedOutput: "tag=v0.4.8\nbump=patch\n",
        isSample: false,
      },
      {
        input: "3\nv1.2.10\nv1.10.0\nv1.9.9\n1\nfix\n",
        expectedOutput: "tag=v1.10.1\nbump=patch\n",
        isSample: false,
      },
      {
        input: "2\nv3.0.0\nv2.9.9\n3\nfix\nfeat\nfix\n",
        expectedOutput: "tag=v3.1.0\nbump=minor\n",
        isSample: false,
      },
      {
        input: "2\nv10.20.30\nv10.9.99\n2\nfix\nfix\n",
        expectedOutput: "tag=v10.20.31\nbump=patch\n",
        isSample: false,
      },
    ],
    referencePython: tagReleasePython,
  },
];
