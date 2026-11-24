import type { LearningTopicDefinition } from "@/lib/learning/types";

export const branchesTopic: LearningTopicDefinition = {
  slug: "branches",
  title: "Branches, merges & conflicts",
  titleBn: "শাখা, মিলন ও সংঘাত",
  summary:
    "শাখা খুলে নিরাপদে কাজ, fast-forward আর merge commit বোঝা, আর conflict marker পড়ে শান্ত মাথায় মিলন ঘটানো।",
  concept: `## কেন দরকার

দ্বিতীয় স্প্রিন্টের স্ট্যান্ডআপে মাহিন নুসরাতকে দায়িত্ব দিল: স্টাডি গ্রুপের রিমাইন্ডার ফিচার। একই সপ্তাহে সাদিয়া ঠিক করছে গ্রুপ কার্ডের একটা timing bug—দুজনের কাজ একই ফাইল ছুঁয়ে যাবে। নুসরাত চিন্তায় পড়ল; মাহিন হাসল: "এজন্যই branch। main থাকবে সবসময় চালু অবস্থায়—ship করা যায় এমন কোডে। তোমার ফিচার \`feature/reminder\` শাখায়, সাদিয়ার fix \`fix/card-timing\`-এ। কাজ শেষ হলে শাখা দুটো main-এ মিলে যাবে।" branch ছাড়া একাধিক মানুষের একসাথে কাজ মানে একজনের লেখার উপর আরেকজনের লেখা বসে যাওয়া; branch-এ প্রতিটা কাজ চলে নিজের নিরাপদ রুমে, আর পরীক্ষামূলক আইডিয়াও ঝুলিয়ে রাখা যায়—কাজ না হলে শাখাটা মুছবে, main নড়বে না। এই টপিকে তুমি শিখবে শাখা বানানো, main-এ merge করা আর দুই শাখা জড়িয়ে গেলে merge conflict শান্ত মাথায় মেটানো।

## মূল ধারণা

branch আসলে ভারী কিছু নয়—এটা একটা commit-এর দিকে তাক করা হালকা পয়েন্টার, আর তোমার এখনকার অবস্থান বোঝায় \`HEAD\`। নতুন শাখায় commit করলে শুধু নিজের শাখার ইতিহাস বাড়ে। শাখা বানাতে ও ঢুকতে এক কমান্ডেই \`git switch -c feature/reminder\`; ঢুকতে \`git switch main\`, আগের শাখায় ফিরতে \`git switch -\`। পুরনো \`git checkout\`ও চলে, তবে \`switch\` আর \`restore\`-ই আধুনিক Git-এর পরিষ্কার রূপ।

দুই শাখা main-এ আনতে হয় merge দিয়ে। main-এ ঢুকে \`git merge feature/reminder\` চালালে main নড়েনি থাকলে পয়েন্টার শুধু সামনে সরে—এটা fast-forward merge, ইতিহাসে বাড়তি লাইন লাগে না। দুই শাখাতেই নতুন commit থাকলে Git একটা merge commit বানায় যার দুটো বাবা—ইতিহাসের গ্রাফে জোড়া লাগে, দুই শাখার কাজ দুজনেরই নাম বহন করে।

আর দুই শাখা একই ফাইলের একই লাইন দুই রকম বদলালে? Git নিজে থেকে সিদ্ধান্ত নেবে না—ফাইলে \`<<<<<<< HEAD\` আর \`>>>>>>> feature/reminder\`-এর মাঝে দুই পক্ষের লেখা, মাঝখানে \`=======\` দিয়ে আলাদা, merge থেমে যায়, সিদ্ধান্তটা তোমার হাতে। নুসরাতের রিমাইন্ডার আর সাদিয়ার fix ঠিক তাই করেছিল \`GroupCard.tsx\`-এ। এই হলো merge conflict—ভয়ের নয়, খেলার। তোমার কাজ: দুই পক্ষের ইচ্ছা পড়ে দুজনের কথাই রক্ষা করে চূড়ান্ত লাইন হাতে লেখা, marker মুছে \`git add\` আর \`git commit\`। মাঝে আটকে গেলে \`git merge --abort\` দিয়ে merge-শুরুর আগের অবস্থায় ফেরা যায়; আর কাজের মাঝে শাখা বদলাতে হলে \`git stash\` দিয়ে অসম্পূর্ণ লেখা তাকে রাখো, ফিরে \`git stash pop\` দিয়ে ফেরাও।

| পরিস্থিতি | কমান্ড | মন্তব্য |
| --- | --- | --- |
| নতুন শাখা বানিয়ে ঢোকা | \`git switch -c feature/reminder\` | এক কমান্ডে তৈরি ও প্রবেশ |
| অন্য শাখায় যাওয়া | \`git switch main\` | বদলানোর আগে commit বা stash |
| main-এ শাখা আনা | \`git merge feature/reminder\` | fast-forward বা merge commit |
| conflict থেকে পিছু হটা | \`git merge --abort\` | merge-পূর্বের অবস্থায় ফেরত |
| শাখা মুছে ফেলা | \`git branch -d feature/reminder\` | merge না হলে -d আটকে দেবে |

## কোডে দেখি

নুসরাতের স্প্রিন্টের কাজটা ধারাবাহিকভাবে:

\`\`\`bash
git switch main
git pull --rebase
git switch -c feature/reminder
# ... কোড লেখা, ছোট ছোট commit
git commit -m "feat: send reminder before group start"
git switch main
git merge feature/reminder
\`\`\`

সাদিয়ার fix আগে main-এ ঢুকে গেলে merge-টা conflict-এ থামবে:

\`\`\`text
Auto-merging src/components/GroupCard.tsx
CONFLICT (content): Merge conflict in src/components/GroupCard.tsx
Automatic merge failed; fix conflicts and then commit the result.
\`\`\`

ফাইল খুললে ভিতরে দুই পক্ষের লেখা:

\`\`\`text
<<<<<<< HEAD
const startsAt = formatTime(card.startsAt, "Asia/Dhaka");
=======
const startsAt = formatTime(card.startsAt, userZone);
>>>>>>> feature/reminder
\`\`\`

নুসরাত দুই লাইনই পড়ল: সাদিয়া চায় সব সময় Dhaka টাইম, রিমাইন্ডার চায় user-এর নিজের জোন—দুজনের কথাই খাটে। চূড়ান্ত লাইন সে লিখল \`const startsAt = formatTime(card.startsAt, userZone ?? "Asia/Dhaka");\`—user-এর জোন থাকলে সেটাই, না থাকলে Dhaka। তারপর:

\`\`\`bash
git add src/components/GroupCard.tsx
git commit -m "fix: honor user time zone with dhaka fallback"
git log --oneline --graph --all
git branch -d feature/reminder
\`\`\`

## ধাপে ধাপে

1. নতুন কাজের আগে \`git switch main\` আর \`git pull --rebase\` দিয়ে সামনের লাইন নাও।
2. কাজের নামে শাখা খোলো: \`git switch -c feature/<নাম>\` বা \`fix/<নাম>\`।
3. শাখায় ছোট ছোট commit-এ কাজ এগোও—প্রতিটা আলাদা, বোঝার মতো।
4. শেষ হলে main-এ ফিরে দেখে নাও অন্য কেউ নতুন কী বসিয়েছে; \`git merge <শাখা>\` চালাও।
5. conflict এলে ফাইল খুলে দুই পক্ষের ইচ্ছা পড়ো, চূড়ান্ত লাইন লেখো, marker মুছো, \`git add\`, তারপর commit।
6. merge-এর পরে শাখাটা \`git branch -d\` দিয়ে মুছে ফেলো; খাতা পরিষ্কার থাকবে।

### ল্যাব: নিজের হাতে conflict মেটাও

নিজের টার্মিনালে, সম্পূর্ণ অফলাইনে একটা conflict বানিয়ে সেটা মেটাবে—PAU OJ-এর জাজ Git চালায় না, তাই এই ল্যাবটা তোমার নিজের মেশিনের:

\`\`\`bash
mkdir git-maze && cd git-maze
git init -b main
printf "line1\\nline2\\n" > notes.txt
git add notes.txt && git commit -m "docs: base note"
git switch -c feature/topline
printf "line1 TOP\\nline2\\n" > notes.txt
git commit -am "feat: mark line1 as top"
git switch main
printf "line1 BASE\\nline2\\n" > notes.txt
git commit -am "fix: mark line1 as base"
git merge feature/topline
# CONFLICT (content): merge conflict in notes.txt
\`\`\`

\`cat notes.txt\` চালালে marker-জুড়া ফাইলটা দেখা যাবে:

\`\`\`text
<<<<<<< HEAD
line1 BASE
=======
line1 TOP
>>>>>>> feature/topline
line2
\`\`\`

এবার তুমি সমাধানকারী: এডিটরে ফাইলটা খুলে marker তিনটে মুছে দুই পক্ষের কথা মেনে চূড়ান্ত লাইন লেখো—যেমন \`line1 BASE+TOP\`। তারপর:

\`\`\`bash
git add notes.txt
git commit -m "fix: combine both line1 marks"
git log --oneline --graph --all
# দুই শাখার জোড়াসহ গ্রাফ দেখা যাবে
git branch -d feature/topline
\`\`\`

একটা জিনিস খেয়াল করো: \`git commit -am\` মানে ট্র্যাকড ফাইলের সব বদল একসাথে commit—খেলার রেপোতে চলে, আসল প্রজেক্টে ফাইল ধরে ধরে \`git add\`-ই শৃঙ্খলা। আরেকটা পরীক্ষা: শাখা বদলানোর আগে \`echo "half done" >> notes.txt\` লিখে \`git stash\` চালাও, \`git switch -c scratch\` দিয়ে ঘুরে \`git switch -\` দিয়ে ফিরে \`git stash pop\` দাও—অসম্পূর্ণ কাজ অক্ষত ফিরে আসবে।

## সাধারণ ভুল

- শাখা না খুলে main-এ সরাসরি কাজ শুরু; protected main থাকলে push-ই আটকে যাবে, না থাকলে ইতিহাস এলোমেলো হবে।
- conflict marker (\`<<<<<<<\`, \`=======\`, \`>>>>>>>\`) ফাইলে রেখেই commit করে ফেলা; আগে পুরো ফাইলটা পড়ে মিলিয়ে নাও।
- \`patch\`, \`final2\` মতো অর্থহীন শাখার নাম; \`feature/...\` আর \`fix/...\` রীতিতে নাম দাও—কাজ এক নজরে পরিষ্কার দেখাবে।
- merge-এর আগে main টেনে না নেওয়া; যত পুরনো শাখা, তত বড় conflict।
- \`git branch -D\` দিয়ে merge-হয়নি এমন শাখায় জোর করে মুছে ফেলা; \`-d\` আটকে দিলে আগে ভেবে দেখো সেই কাজ কোথায় যাবে।
- stash করে ভুলে যাওয়া; \`git stash list\` মাঝে মাঝে চালিয়ে তাকে খালি রাখো।

## চিটশিট

| কমান্ড | কাজ | মন্তব্য |
| --- | --- | --- |
| \`git switch -c <শাখা>\` | নতুন শাখা খোলা | কাজের নামে নাম দাও |
| \`git switch <শাখা>\` | শাখা বদলানো | বদলানোর আগে commit বা stash |
| \`git merge <শাখা>\` | দুই শাখা মেলানো | conflict এলে হাতে মেটাও |
| \`git merge --abort\` | merge বাতিল | শুরুর আগের অবস্থায় ফেরত |
| \`git stash\` / \`git stash pop\` | কাজ তাকে রাখা ও ফেরানো | ছোট ব্রেকের ভরসা |
| \`git branch -d <শাখা>\` | শাখা মুছে ফেলা | merge হয়েছে কিনা দেখে নেয় |
| \`git log --oneline --graph --all\` | পুরো ইতিহাসের গ্রাফ | শাখার জোড়া চোখে পড়ে |

## প্রফেশনাল অভ্যাস

এক শাখা = এক কাজ, আর শাখার নাম = কাজের পরিচয়—এই দুটো মেনে চললেই রিভিউ সহজ হয়। merge-এর আগে সবসময় main টেনে নাও, test চালিয়ে সবুজ দেখে তারপর মিলাও; conflict-এর দিন টিমকে জানিয়ে রাখো—সাদিয়া নুসরাতকে মাঝখানে ডেকে দুজনে মিলেই লাইনটা ঠিক করেছিল, দুই মিনিটের কথা। মাহিনের মন্তব্যটা নোট করে রাখো: "conflict মানে দুইজন একসাথে ভাবছে—সেটা সমস্যা নয়, টিমওয়ার্কের স্বাক্ষর।"

গাইডেড ড্রিল \`learn-git-merge-base\` (কোন commit থেকে শাখা জন্মেছে) আর \`learn-git-conflict-files\` (conflict-এ কোন কোন ফাইল জড়ায়) দিয়ে এগোও; নিজের টার্মিনালের ল্যাব আর প্ল্যাটফর্মের অফলাইন ড্রিল একসাথে মিলিয়ে নাও।`,
  guidedProblemSlugs: ["learn-git-merge-base", "learn-git-conflict-files"],
  practiceProblemSlugs: { easy: [], medium: [], hard: [] },
  extraProblemSlugs: ["learn-git-fast-forward", "learn-git-branch-cleanup"],
};
