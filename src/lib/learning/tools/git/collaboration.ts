import type { LearningTopicDefinition } from "@/lib/learning/types";

export const collaborationTopic: LearningTopicDefinition = {
  slug: "collaboration",
  title: "GitHub flow & safe recovery",
  titleBn: "টিমওয়ার্ক ও উদ্ধার",
  summary:
    "fetch-rebase-push চক্র, PR রিভিউ আর protected main—শুক্রবারের hotfix-এ revert, reflog-এ হিস্ট্রি উদ্ধার আর রিলিজে ট্যাগ।",
  concept: `## কেন দরকার

মাস শেষে নুসরাতের প্রথম ফিচার রেডি—এবার কাজটা যাবে টিমের shared home-এ: GitHub। সে শাখাটা push করে pull request (PR) খুলল, আর প্রথম review comment এল মাহিনের কাছ থেকে: "এই condition-এ খালি তালিকাও ঢুকবে—একটা edge case যোগ করো।" নুসরাত ঠিক করে আবার push করল, automated checks সবুজ হলো, মাহিন approve করলে টিম lead squash-merge করে শাখাটা মুছে দিল। main-এ সরাসরি push কেউ করতে পারে না—protected branch নিয়মে রিভিউ আর সবুজ checks দুটোই বাধ্যতামূলক। এরপর এল সেই শুক্রবার: রাহাতের deploy-এর পর লগইন রিডাইরেক্ট ভেঙে গেল। স্ট্যান্ডআপে মাহিন শান্ত গলায় বলল, "আতঙ্ক নয়—revert।" সেই সপ্তাহেই নুসরাত শিখল \`git reflog\`-এ হারানো কাজ খোঁজা আর \`git tag\` দিয়ে v1.4.0 রিলিজ চিহ্নিত করা। এই টপিক সেই পূর্ণ টিম-জীবনের গল্প: PR, review, hotfix, উদ্ধার আর রিলিজ।

## মূল ধারণা

GitHub-এ টিমের repository-র একটা কপি থাকে—Git-এর ভাষায় remote, আর ডিফল্ট নাম \`origin\`। \`git push -u origin feature/reminder\` শাখাটা ওদিকে তোলে, \`-u\` পর থেকে শুধু \`git push\`-ই যথেষ্ট। টিমের main এগিয়ে দিলে জানবে \`git fetch\` দিয়ে—সে শুধু নতুন তথ্য নামায়, তোমার কোডে আঙুল দেয় না, তাই যতবার খুশি নিরাপদ। \`git pull --rebase\` এক কমান্ডে fetch করে আর তোমার লোকাল কাজকে টিমের নতুন commit-গুলোর উপরে বসিয়ে দেয়—ইতিহাস সোজা থাকে, "Merge branch X into main" ধাঁচের সর্পিল লাইন জমে না।

GitHub flow এক নিঃশ্বাসে: main থেকে শাখা → ছোট commit → push → PR → রিভিউ আর automated checks → squash-merge → শাখা মুছে দাও। PR শুধু merge-এর বোতাম নয়—কাজের আলোচনার জায়গা; মাহিনের সেই প্রথম comment-ই নুসরাতের সবচেয়ে বড় শেখা হয়েছিল। protected branch পুরো প্রবাহকে বাধ্য করে: main-এ সরাসরি push বন্ধ, approve আর সবুজ checks ছাড়া merge বন্ধ।

ভুল সারানোর দুই রাস্তা, আর নিয়মটা কঠিন। শেয়ারড ইতিহাসে ভুল সারায় \`git revert <hash>\`—সে পুরোনো কাজের ঠিক উল্টোটা করে একটা নতুন commit বানায়; ইতিহাস সৎ থাকে, কারো লোকাল কপি ভাঙে না—নিরাপদ। আর \`git reset --hard\` ইতিহাস পেছনে ফেলে দেয়—নিজের কম্পিউটারে শেষ অস্ত্র হিসেবে চলে, কিন্তু push হয়ে যাওয়া ইতিহাসে চালালে force-push লাগবে, আর শেয়ারড শাখায় force-push মানে টিমের কাজ উধাও—কখনোই না; নিজের একার শাখায় বাধ্য হলে \`git push --force-with-lease\` ব্যবহার করো, সেটা অন্য কারো নতুন push থাকলে থামিয়ে দেয়। ভুলে reset-এ কাজ হারালে \`git reflog\` মনে রাখো—Git তোমার প্রতিটা অবস্থান-বদল লিখে রাখে; হারানো commit-এর hash সেখান থেকে চিনে \`git reset --hard <hash>\` দিয়ে ফেরত নাও।

রিলিজের দিনে সততার আরেকটা পরীক্ষা আসে: secret লিক। ধরো কনফিগে একটা API key ঢুকে push হয়ে গেল। প্রথম কাজ ইতিহাস লুকানো নয়—key-টা rotate করা, কারণ একবার push হওয়া secret ইতিহাস থেকে মুছলেও কপি বহু জায়গায় থেকে গেছে। rotate-এর পরে revert বা cleanup নিয়ে টিম মিলে সিদ্ধান্ত নিতে পারবে। আর রিলিজের শেষ কাজটা সবচেয়ে আনন্দের—\`git tag -a v1.4.0 -m "Reminder feature"\` দিয়ে চিহ্ন, \`git push origin v1.4.0\` দিয়ে ওঠানো, GitHub-এ release notes লিখে ঘোষণা। tag ঠিক কোন commit-এ রিলিজ বেরোল সেটা চিরদিনের জন্য বেঁধে রাখে।

| কাজ | কমান্ড | নিরাপদ? |
| --- | --- | --- |
| টিমের নতুন তথ্য নামানো | \`git fetch\` | হ্যাঁ, কিছু বদলায় না |
| নিজের কাজ ওপরে বসানো | \`git pull --rebase\` | হ্যাঁ, conflict এলে জানাবে |
| শাখা ওঠানো | \`git push -u origin <শাখা>\` | হ্যাঁ, শাখা নিজের |
| ভুল commit সারানো | \`git revert <hash>\` | হ্যাঁ, ইতিহাস সৎ থাকে |
| ইতিহাস পেছনানো | \`git reset --hard\` | শুধু লোকালে, সাবধানে |
| হারানো কাজ খোঁজা | \`git reflog\` | হ্যাঁ, শুধু পড়ে |
| রিলিজ চিহ্ন | \`git tag -a v1.4.0 -m "..."\` | হ্যাঁ |

## কোডে দেখি

নুসরাতের প্রথম PR-দিন:

\`\`\`bash
git switch -c fix/login-redirect
git commit -m "fix: keep redirect target after session refresh"
git push -u origin fix/login-redirect
# GitHub-এ PR খোলো; review আর checks সবুজ হলে merge
\`\`\`

শুক্রবারের দুঃসংবাদ আর সেই শান্ত সমাধান:

\`\`\`bash
git switch main
git pull --rebase
git log --oneline -3
# 2f7a1c3 feat: speed up login with cached redirect
git revert 2f7a1c3
# নতুন commit: "Revert ..." — এটাই প্রোডাকশনে deploy হলো
git push
\`\`\`

আর নুসরাতের নিজের ভয়ের দিনটা—ভুলে \`git reset --hard\` চালিয়ে কাজ উধাও:

\`\`\`bash
git reflog
# 5b1e9a0 HEAD@{0}: reset: moving to HEAD~1
# 8c3f2d1 HEAD@{1}: commit: feat: reminder digest for quiet groups
git reset --hard 8c3f2d1
# হারানো commit আবার স্থানে
\`\`\`

রিলিজের সন্ধ্যা:

\`\`\`bash
git tag -a v1.4.0 -m "Reminder feature and login hotfix"
git push origin v1.4.0
git tag -n1
# v1.4.0 সহ ট্যাগ-তালিকা আর message
\`\`\`

## ধাপে ধাপে

1. দিন শুরুতে \`git fetch\` দিয়ে দেখে নাও টিমের main কোথায়; sync করতে সবসময় \`git pull --rebase\`।
2. কাজ শাখায় করো, ছোট ছোট commit-এ; main কে স্পর্শ করো না।
3. শাখা push করে PR খোলো—বর্ণনায় "কী বদলাল, কেন" দুই লাইনে লেখো।
4. review comment এলে শাখাতেই ঠিক করে আবার push করো; PR নিজেই নতুন commit দেখাবে।
5. checks সবুজ আর approve এলে merge করো, শাখা মুছে দাও, লোকালেও \`git pull --rebase\` চালিয়ে নাও।
6. ভুল deploy-এর দিন: main-এ ঢুকে \`git revert <ভুল-commit>\` আর push—নতুন কিছু লেখার দরকার নেই।
7. রিলিজে ট্যাগ দাও আর tag-টা আলাদা করে push করো—না চালালে ট্যাগ শুধু তোমার কম্পিউটারেই পড়ে থাকবে।

### ল্যাব: নিজের ডিস্কে একটা মিনি-GitHub

টিমের পুরো নাচটা নিজের কম্পিউটারে, সম্পূর্ণ অফলাইনে চালাবে—একটা bare repository হবে GitHub, দুটো clone হবে তুমি আর সতীর্থ। PAU OJ-এর জাজ Git বা GitHub কিছুই চালায় না, তাই এই ল্যাব তোমার নিজের মেশিনের:

\`\`\`bash
mkdir git-team && cd git-team
git init --bare -b main origin.git
git clone origin.git nusrat
cd nusrat
echo "# podaghor app" > README.md
git add README.md && git commit -m "docs: project readme"
git push -u origin main
cd ..
git clone origin.git teammate
cd teammate
git pull --rebase
# Already up to date.
echo "queue module" > queue.txt
git add queue.txt && git commit -m "feat: teammate queue note"
git push
cd ../nusrat
echo "reminder module" > reminder.txt
git add reminder.txt && git commit -m "feat: reminder note"
git push
# ! [rejected] main -> main (fetch first)
git pull --rebase
# টিমের commit নিচে, তোমারটা ওপরে—সোজা লাইন
git log --oneline --graph
git push
\`\`\`

এই পর্যায়ে দুই কপির ইতিহাস এক। এবার দুর্ঘটনা, উদ্ধার আর রিলিজ:

\`\`\`bash
cd ../teammate
echo "risky config" > config.txt
git add config.txt && git commit -m "feat: risky config note"
git push
cd ../nusrat
git pull --rebase
git log --oneline -2
# সবার ওপরের commit-টাই risky config
git revert --no-edit HEAD
# উল্টো-কাজের নতুন commit: Revert "feat: risky config note"
git push
git reflog
# সব চলাফেরার লগ—কোনো commit হারালে এখান থেকেই খুঁজবে
git tag -a v0.1.0 -m "first offline team release"
git push origin v0.1.0
\`\`\`

শেষে ট্যাগ যাচাই করো: teammate ফোল্ডারে \`git fetch\` আর \`git tag -n1\` চালালে v0.1.0-এর নাম আর message পড়া যাবে। ল্যাবটা একা করলেও মনে রাখো—আসল টিমে কোথায় দাঁড়িয়ে আছ সেটা বলার সহজ উপায় \`git status\`, আর সবার কাছে এক ইতিহাস রাখার উপায় fetch-rebase-push চক্র।

## সাধারণ ভুল

- protected main জেনে তবু সরাসরি push চেষ্টা; reject হবে—এটাই নিয়ম কাজ করার শব্দ, রাগ করার নয়।
- \`git pull\` rebase ছাড়া; প্রতিদিন একটা করে সর্পিল merge commit জমে ইতিহাস দুর্বোধ্য হয়।
- শেয়ারড শাখায় \`git push --force\`; টিমের কাজ উধাও করা—যেকোনো টিমে সবচেয়ে বড় অপরাধ।
- reset দিয়ে push হওয়া ইতিহাস সরানো; শেয়ারড শাখায় ভুল সারায় revert।
- secret লিক হলে ইতিহাস মোছার পেছনে দৌড়ানো; আগে rotate, পরে টিম মিলে cleanup।
- ট্যাগ দিয়ে push না করা; GitHub তখন রিলিজটা কোনোদিনও দেখবে না।
- PR-এ "কেন" না লিখে শুধু "কী" লেখা; রিভিউয়ারের সময় তোমার বর্ণনার উপরেই দাঁড়িয়ে।

## চিটশিট

| কমান্ড | কাজ | মন্তব্য |
| --- | --- | --- |
| \`git fetch\` | remote-এর তথ্য নামানো | তোমার কোড বদলায় না |
| \`git pull --rebase\` | নামিয়ে নিজের কাজ ওপরে বসানো | conflict এলে হাতে মেটাও |
| \`git push -u origin <শাখা>\` | শাখা ওঠানো | PR-এর প্রথম ধাপ |
| \`git revert <hash>\` | ভুল সারানোর নিরাপদ রাস্তা | ইতিহাস সৎ থাকে |
| \`git reflog\` | হারানো অবস্থানের লগ | উদ্ধারের প্রথম ডাক |
| \`git tag -a v1.4.0 -m "..."\` | রিলিজ চিহ্ন | push আলাদা করে করো |
| \`git push --force-with-lease\` | জোর করে ওঠানোর নিয়ন্ত্রিত রূপ | শুধু নিজের একার শাখায় |

## প্রফেশনাল অভ্যাস

টিমে রিপুটেশন বড় কোনো একক প্রতিভায় নয়—রোজকার ছোট সততায়। শাখা খোলো, PR-তে "কেন" লেখো, review-কে শেখা মনে করো, শেয়ারড ইতিহাসে revert-ই একমাত্র পথ মেনে নাও, secret লিক হলে আগে rotate, আর প্রতিটা রিলিজে ট্যাগ দাও। শুক্রবারের ঘটনার পর মাহিন টিম-চ্যানেলে লিখেছিল: "main সবসময় চালু থাকবে, ভুল হলে revert দিয়ে সৎভাবে সারাব—আর প্রতিটা রিলিজের নাম ট্যাগে বাঁধা থাকবে।" এই তিন বাক্যই Release Captain হওয়ার ম্যানুয়াল।

গাইডেড ড্রিল \`learn-git-pr-gate\` (PR মিলানোর শর্ত) আর \`learn-git-revert-plan\` (কোন পরিস্থিতিতে কোন রাস্তা) দিয়ে যাচাই করে নাও নিজেকে। প্ল্যাটফর্মের ড্রিলগুলো অফলাইন জ্ঞানের মহড়া—আসল মহড়া নিজের টার্মিনালের ল্যাবটা।`,
  guidedProblemSlugs: ["learn-git-pr-gate", "learn-git-revert-plan"],
  practiceProblemSlugs: { easy: [], medium: [], hard: [] },
  extraProblemSlugs: ["learn-git-remote-sync", "learn-git-tag-release"],
};
