import type { SeedProblem } from "../../../seed-problems";

const hotfixPython = `import sys

fields = {}
for line in sys.stdin.read().splitlines():
    key, value = line.split(' ', 1)
    fields[key] = value
tag = fields['release-tag']
fix_file = fields['fix-file']
message = fields['commit-message']
dirty = fields['dirty'] == 'yes'
on_main = fields['already-on-main'] == 'yes'
major, minor, patch = map(int, tag.lstrip('v').split('.'))
next_tag = 'v' + str(major) + '.' + str(minor) + '.' + str(patch + 1)
plan = []
if dirty:
    plan.append('git stash push -u -m wip')
if on_main:
    plan.append('git switch main')
else:
    plan.append('git switch -c hotfix/' + tag + ' ' + tag)
    plan.append('git add ' + fix_file)
    plan.append('git commit -m "' + message + '"')
    plan.append('git switch main')
    plan.append('git merge --no-ff hotfix/' + tag)
plan.append('git tag -a ' + next_tag + ' -m "hotfix ' + next_tag + '"')
plan.append('git push origin main --tags')
if dirty:
    plan.append('git stash pop')
for step in plan:
    print(step)
`;

export const GIT_CHECKPOINT_HOTFIX_PROBLEM: SeedProblem = {
  slug: "learn-git-check-hotfix",
  title: "Production Hotfix",
  statement: `শুক্রবার রাতে প্রোডাকশনে পেমেন্ট ফেল করছে। নুসরাত আর মাহিন ঠিক করল, শেষ রিলিজ tag থেকে একটা hotfix ব্রাঞ্চ কেটে শুধু ছোট ফিক্সটা দেবে, তারপর main-এ ফিরে merge করে নতুন patch tag দেবে। main-এ ইতিমধ্যে কিছু unreleased কাজ আছে, তাই main থেকে ব্রাঞ্চ কাটলে সেই অর্ধেক কাজও রিলিজে ঢুকে যাবে — এটা এড়াতে হবে।

ইনপুটের প্রতিটি লাইনে \`key value\`: \`release-tag\`, \`fix-file\`, \`commit-message\`, \`dirty yes|no\`, \`already-on-main yes|no\`।

ফিক্সটা যদি ইতিমধ্যে main-এ থাকে (\`already-on-main yes\`), ব্রাঞ্চ বা commit লাগবে না — শুধু main-এ গিয়ে tag দাও; এই ক্ষেত্রে ধরা হচ্ছে main-এ রিলিজের বাইরে অন্য কোনো কাজ নেই। নাহলে tag থেকে \`hotfix/<tag>\` ব্রাঞ্চ কেটে ফিক্স commit করো, main-এ \`--no-ff\` merge করো, তারপর patch tag দাও। dirty হলে শুরুতে stash আর শেষে stash pop। tag bump সবসময় patch।

আউটপুটে ঠিক ক্রমে এক লাইনে একটি করে কমান্ড ছাপাও, যেমন \`git switch -c hotfix/v1.4.2 v1.4.2\`।`,
  inputFormat: `পাঁচ লাইন: \`release-tag <vX.Y.Z>\`, \`fix-file <path>\`, \`commit-message <word>\`, \`dirty yes|no\`, \`already-on-main yes|no\`।`,
  outputFormat: `ক্রম অনুযায়ী প্রতি লাইনে একটি git কমান্ড।`,
  constraints: `tag \`vX.Y.Z\` আকারে, \`0 <= X, Y, Z <= 10^9\`
ফাইলের পাথে স্পেস নেই। message এক শব্দের। কমান্ডের নাম আর ক্রম ঠিক রাখতে হবে।`,
  editorial: `## ধারণা
Hotfix-এর মূল নীতি হলো বিস্ফোরণের আকার ছোট রাখা। main-এ যখন unreleased কাজ জমে আছে, main থেকে ব্রাঞ্চ কাটলে সেই অসম্পূর্ণ কাজও রিলিজে চলে আসে। তাই রিলিজ tag-টাই একমাত্র নির্ভরযোগ্য ভিত্তি — \`git switch -c hotfix/<tag> <tag>\` দিয়ে ঠিক রিলিজ করা অবস্থা থেকে শুরু করো, সেখানে শুধু ফিক্স commit করো, তারপর main-এ \`--no-ff\` merge করো যাতে merge history-তে স্পষ্ট থাকে এই ফিক্স আলাদা পথে এসেছিল। শেষে patch বাড়িয়ে annotated tag দাও এবং main আর tag push করো। already-on-main হলে ওই ধাপগুলো বাদ যায়। dirty working tree থাকলে আগে stash করে শেষে ফিরিয়ে নাও, নাহলে ব্রাঞ্চ বদলাতে git বাধা দেবে।

## ধাপে ধাপে
1. পাঁচটি ফিল্ড পড়ো, tag থেকে major, minor, patch বের করো।
2. dirty হলে প্রথমে \`git stash push -u -m wip\` যোগ করো।
3. already-on-main yes হলে main-এ গিয়ে সরাসরি tag; নাহলে tag থেকে hotfix ব্রাঞ্চ, add, commit, main-এ switch, \`--no-ff\` merge।
4. patch এক বাড়িয়ে annotated tag বানাও, তারপর main ও tag push করো।
5. dirty হলে শেষে stash pop। প্রতিটি ধাপ এক লাইনে ছাপো।

\`\`\`python
${hotfixPython}\`\`\`

## কমপ্লেক্সিটি
ধ্রুবক সংখ্যক ফিল্ড আর কমান্ড, তাই সময় ও মেমোরি \`O(1)\`।

## সাধারণ ভুল
- main থেকে hotfix ব্রাঞ্চ কাটা — unreleased কাজও রিলিজে ঢুকে যায়।
- tag-এ patch না বাড়িয়ে minor বা major বাড়ানো — hotfix সবসময় patch।
- merge-এ \`--no-ff\` না দেওয়া — fast-forward হলে বোঝা যায় না ফিক্সটা আলাদা পথে এসেছে।
- dirty tree stash না করে ব্রাঞ্চ বদলানো — git বাধা দেয় বা পরিবর্তন হারায়।`,
  difficulty: "HARD",
  points: 300,
  timeLimitMs: 1000,
  memoryLimitMb: 256,
  tags: ["DevOps", "Release"],
  tests: [
    {
      input:
        "release-tag v1.4.2\nfix-file src/payments/retry.ts\ncommit-message fix_payment_retry\ndirty no\nalready-on-main no\n",
      expectedOutput:
        'git switch -c hotfix/v1.4.2 v1.4.2\ngit add src/payments/retry.ts\ngit commit -m "fix_payment_retry"\ngit switch main\ngit merge --no-ff hotfix/v1.4.2\ngit tag -a v1.4.3 -m "hotfix v1.4.3"\ngit push origin main --tags\n',
      isSample: true,
    },
    {
      input:
        "release-tag v2.0.0\nfix-file app/api/login.ts\ncommit-message fix_login\ndirty yes\nalready-on-main no\n",
      expectedOutput:
        'git stash push -u -m wip\ngit switch -c hotfix/v2.0.0 v2.0.0\ngit add app/api/login.ts\ngit commit -m "fix_login"\ngit switch main\ngit merge --no-ff hotfix/v2.0.0\ngit tag -a v2.0.1 -m "hotfix v2.0.1"\ngit push origin main --tags\ngit stash pop\n',
      isSample: true,
    },
    {
      input:
        "release-tag v3.7.9\nfix-file src/cart.ts\ncommit-message fix_cart\ndirty no\nalready-on-main yes\n",
      expectedOutput:
        'git switch main\ngit tag -a v3.7.10 -m "hotfix v3.7.10"\ngit push origin main --tags\n',
      isSample: false,
    },
    {
      input:
        "release-tag v1.0.0\nfix-file lib/db.ts\ncommit-message fix_db\ndirty yes\nalready-on-main yes\n",
      expectedOutput:
        'git stash push -u -m wip\ngit switch main\ngit tag -a v1.0.1 -m "hotfix v1.0.1"\ngit push origin main --tags\ngit stash pop\n',
      isSample: false,
    },
    {
      input:
        "release-tag v12.34.99\nfix-file src/x.ts\ncommit-message fix_x\ndirty no\nalready-on-main no\n",
      expectedOutput:
        'git switch -c hotfix/v12.34.99 v12.34.99\ngit add src/x.ts\ngit commit -m "fix_x"\ngit switch main\ngit merge --no-ff hotfix/v12.34.99\ngit tag -a v12.34.100 -m "hotfix v12.34.100"\ngit push origin main --tags\n',
      isSample: false,
    },
    {
      input:
        "release-tag v0.9.0\nfix-file docs/config.md\ncommit-message fix_config\ndirty no\nalready-on-main yes\n",
      expectedOutput:
        'git switch main\ngit tag -a v0.9.1 -m "hotfix v0.9.1"\ngit push origin main --tags\n',
      isSample: false,
    },
  ],
  referencePython: hotfixPython,
};
