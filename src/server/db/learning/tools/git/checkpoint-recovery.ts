import type { SeedProblem } from "../../../seed-problems";

const recoveryPython = `import sys

lines = sys.stdin.read().splitlines()
n = int(lines[0].split()[1])
history = lines[1].split()
merge = lines[2].split()[1]
first_parent = lines[3].split()[1]
pushed = lines[4].split()[1] == 'yes'
reverted = lines[5].split()[1] == 'yes'
if reverted:
    command = 'none'
    result = history
elif pushed:
    command = 'git revert -m 1 ' + merge
    result = history + [merge + '-revert']
else:
    command = 'git reset --hard ' + first_parent
    result = history[:-1]
print('cmd=' + command)
print('commits=' + str(len(result)))
print('history=' + (' '.join(result) if result else '-'))
print('note=reflog-keeps-old-head')
`;

export const GIT_CHECKPOINT_RECOVERY_PROBLEM: SeedProblem = {
  slug: "learn-git-check-recovery",
  title: "Bad Merge Recovery",
  statement: `সোমবার সকালে দেখা গেল, একটা ভুল merge ইতিমধ্যে main-এ push হয়ে গেছে। নুসরাত আতঙ্কে \`git reset\` চালাতে যাচ্ছিল; মাহিন থামিয়ে বলল, shared ইতিহাস reset করলে সবার লোকাল কপি ভেঙে যাবে। নিরাপদ পথ হলো merge commit-টা \`git revert -m 1\` দিয়ে উল্টে দেওয়া, যাতে পুরনো ইতিহাস অটুট থাকে। পুরনো head হারায় না, কারণ reflog ডিফল্ট মেয়াদে সেটা ধরে রাখে।

প্রথম লাইনে \`history <n>\`; পরের লাইনে \`n\`টি hash স্পেস দিয়ে আলাদা, শেষটা merge commit। তারপর \`merge <hash>\`, \`first-parent <hash>\`, \`pushed yes|no\`, \`already-reverted yes|no\`।

আউটপুট চার লাইন: \`cmd=<কমান্ড>\` (আগেই revert হয়ে থাকলে \`none\`; pushed হলে \`git revert -m 1 <hash>\`; না হলে \`git reset --hard <first-parent>\`), \`commits=<ফলাফলের commit সংখ্যা>\`, \`history=<ফলাফলের hash গুলো, খালি হলে ->\`, আর \`note=reflog-keeps-old-head\`।`,
  inputFormat: `ছয় লাইন: \`history <n>\`, তারপর \`n\`টি hash এক লাইনে, তারপর \`merge\`, \`first-parent\`, \`pushed\`, \`already-reverted\`।`,
  outputFormat: `চার লাইন: \`cmd=...\`, \`commits=...\`, \`history=...\`, \`note=reflog-keeps-old-head\`।`,
  constraints: `\`2 <= n <= 5000\`
merge commit ইতিহাসের শেষ। hash-এ স্পেস নেই। আউটপুটের লাইন-ক্রম ঠিক রাখতে হবে।`,
  editorial: `## ধারণা
ইতিমধ্যে শেয়ার হওয়া ইতিহাসে \`reset\` মানে branch pointer পিছনে সরানো; যাদের কাছে পুরনো commit আছে, তাদের পরের push আর merge ভেঙে যায়। নিরাপদ সমাধান হলো সমস্যা তৈরি করা পরিবর্তনটাকে উল্টে দেওয়া — merge commit-এর ক্ষেত্রে \`git revert -m 1 <merge>\`, যেখানে \`-m 1\` বলে প্রথম parent-এর দিকটা (অর্থাৎ main-এর নিজের ইতিহাস) ধরে রাখতে। ফলে নতুন একটা revert commit যোগ হয়, পুরনো merge আর তার আগের সব commit অটুট থাকে। revert করার সময় git সাধারণত জানিয়ে দেয় মূল merge-টা ভবিষ্যতে আবার merge করলে আগের পরিবর্তনগুলো ফিরবে না; তখন সমস্যা ঠিক করে আবার merge করতে হয়। আর যদি merge commit এখনো push না হয়ে থাকে, কেবল তখনই \`git reset --hard <first-parent>\` নিরাপদ, কারণ অন্য কারও কাছে সেটা যায়নি। যাই হোক, পুরনো head reflog-এ থেকে যায়, তাই ভুল হলে \`git reflog\` দেখে ফেরা যায়।

## ধাপে ধাপে
1. \`n\` আর ইতিহাস পড়ো; শেষ hash-টাই merge commit।
2. merge, first-parent, pushed আর already-reverted পড়ো।
3. already-reverted yes হলে কিছু করার নেই — \`none\`।
4. নাহলে pushed yes হলে \`git revert -m 1 <merge>\` এবং ইতিহাসের শেষে \`<merge>-revert\` যোগ করো।
5. pushed no হলে \`git reset --hard <first-parent>\` এবং শেষ merge commit বাদ দাও।
6. cmd, commits, history আর note ছাপো।

\`\`\`python
${recoveryPython}\`\`\`

## কমপ্লেক্সিটি
তালিকা একবার কপি হয়, তাই সময় \`O(n)\`, মেমোরি \`O(n)\`।

## সাধারণ ভুল
- pushed merge-এ \`git reset --hard\` চালানো — দলের ইতিহাস ভেঙে যায়।
- \`-m 1\` না দেওয়া — merge commit-এর দুই parent থাকায় git বুঝতে পারে না কোন দিক ধরে রাখবে।
- already-reverted yes হওয়া সত্ত্বেও আবার revert করা — একই পরিবর্তন দুবার উল্টে গিয়ে বিপরীত ফল আসে।
- reflog আছে বলে reset-কে নিরাপদ ভাবা — reflog নিজের মেশিনে থাকে, অন্যদের ইতিহাস ফেরায় না।`,
  difficulty: "HARD",
  points: 300,
  timeLimitMs: 1000,
  memoryLimitMb: 256,
  tags: ["Git", "Recovery"],
  tests: [
    {
      input: "history 5\nc1 c2 c3 c4 m1\nmerge m1\nfirst-parent c4\npushed yes\nalready-reverted no\n",
      expectedOutput:
        "cmd=git revert -m 1 m1\ncommits=6\nhistory=c1 c2 c3 c4 m1 m1-revert\nnote=reflog-keeps-old-head\n",
      isSample: true,
    },
    {
      input: "history 4\na1 a2 a3 a4\nmerge a4\nfirst-parent a3\npushed no\nalready-reverted no\n",
      expectedOutput:
        "cmd=git reset --hard a3\ncommits=3\nhistory=a1 a2 a3\nnote=reflog-keeps-old-head\n",
      isSample: true,
    },
    {
      input:
        "history 6\nb1 b2 b3 b4 m2 r1\nmerge m2\nfirst-parent b4\npushed yes\nalready-reverted yes\n",
      expectedOutput:
        "cmd=none\ncommits=6\nhistory=b1 b2 b3 b4 m2 r1\nnote=reflog-keeps-old-head\n",
      isSample: false,
    },
    {
      input: "history 2\nx1 m3\nmerge m3\nfirst-parent x1\npushed yes\nalready-reverted no\n",
      expectedOutput:
        "cmd=git revert -m 1 m3\ncommits=3\nhistory=x1 m3 m3-revert\nnote=reflog-keeps-old-head\n",
      isSample: false,
    },
    {
      input:
        "history 6\nd1 d2 d3 d4 d5 m4\nmerge m4\nfirst-parent d5\npushed no\nalready-reverted no\n",
      expectedOutput:
        "cmd=git reset --hard d5\ncommits=5\nhistory=d1 d2 d3 d4 d5\nnote=reflog-keeps-old-head\n",
      isSample: false,
    },
    {
      input: "history 3\ne1 e2 m5\nmerge m5\nfirst-parent e2\npushed no\nalready-reverted yes\n",
      expectedOutput:
        "cmd=none\ncommits=3\nhistory=e1 e2 m5\nnote=reflog-keeps-old-head\n",
      isSample: false,
    },
  ],
  referencePython: recoveryPython,
};
