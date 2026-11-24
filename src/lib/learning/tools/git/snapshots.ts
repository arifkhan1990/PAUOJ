import type { LearningTopicDefinition } from "@/lib/learning/types";

export const snapshotsTopic: LearningTopicDefinition = {
  slug: "snapshots",
  title: "Snapshots, staging & history",
  titleBn: "ছবি তুলে ইতিহাস",
  summary:
    "working directory, staging আর commit—তিন অবস্থার নাচ শিখে ছোট ছোট snapshot দিয়ে পড়ার-যোগ্য ইতিহাস গোছানো।",
  concept: `## কেন দরকার

নুসরাত পড়াঘর অ্যাপের ছোট প্রোডাক্ট টিমে জুনিয়র ডেভেলপার হিসেবে যোগ দিয়েছে—প্রথম দিনেই মেন্টর মাহিন তাকে টিমের Git repository-র access দিল আর প্রথম কাজ দিল: README-তে লোকাল setup-এর নোট যোগ করা। নুসরাত ফাইলটা বদলে জিজ্ঞেস করল, "কাজটা টিমকে কীভাবে দেখাব?" মাহিন বলল, "Git-ই তোমার কাজের খাতা—প্রতিটা পরিবর্তন এক এক করে সেখানে লেখো। কে কখন কী বদলাল আর কেন, সব থাকবে।" এটাই প্রফেশনাল টিমের প্রথম চাহিদা: কোডের বিশ্বাসযোগ্য ইতিহাস। ল্যাপটপ ক্র্যাশ করলে বা ভুল বদলে দিলে এই ইতিহাসই তোমাকে আগের অবস্থায় ফেরাবে; নতুন সদস্য commit পড়ে প্রজেক্ট বোঝে; রিভিউয়ার message দেখেই ধরে কী ঘটেছে। এই টপিকে তুমি শিখবে কাজের প্রতিটা অবস্থার ছবি তুলে একটা পরিষ্কার, পড়ার-যোগ্য ইতিহাস দাঁড় করানো।

## মূল ধারণা

Git তোমার প্রজেক্টকে তিনটা জায়গায় ভাগ করে রাখে। working directory হলো যে ফোল্ডারে তুমি এখন কোড লিখছ, staging area হলো পরের commit-এর জন্য বাছাই করা তালিকা, আর repository হলো সেই খাতা যেখানে snapshot গুলো স্থায়ীভাবে থাকে। commit মানে পুরো প্রজেক্টের একটা পরিপূর্ণ ছবি: কে তুলেছে, কখন তুলেছে, কেন তুলেছে—সব একসাথে। এই ছবির চেইনটাই ইতিহাস, আর \`git status\` হলো তার দিনলিপি: কোন ফাইল বদলেছে, কোনটা বাছাই হয়েছে—এক নজরে।

কেন আগে stage করতে হয়? কারণ এক commit-এ ঠিক সেই কাজটাই ঢোকে যেটা তুমি বেছে নিয়েছ; মাঝরাস্তার খসড়া বাদ থাকে। ফাইল বাছতে \`git add <file>\`, সব একসাথে বাছতে \`git add -A\`, আর ফাইলের অংশবিশেষ বাছতে \`git add -p\`—সেটা প্রতিটা অংশ দেখিয়ে হ্যাঁ/না জিজ্ঞেস করে। শেষে \`git commit -m "<message>"\` দিলে ছবিটা খাতায় বসে যায়। commit-এর পরেই ভুল ধরা পড়লে \`git commit --amend\` দিয়ে শেষ commit ঠিক করা যায়—তবে ওই commit যদি আগেই remote-এ push হয়ে থাকে, amend-এর পরে আবার push করতে গেলে ইতিহাস দুই রকম হয়ে দাঁড়ায়; নিয়ম: push-এর আগে amend নিরাপদ, পরে এড়িয়ে চলো।

message-এর রীতি টিমে আগেই ঠিক থাকে; পড়াঘর টিম conventional commits মেনে চলে: ছোট prefix-এ কাজের ধরন, তারপর এক লাইনে পরিচয়। \`fix: correct reminder time zone\` পড়লেই সমাধানটা ধরা যায়; শুধু "update" লেখা message কারোরই কাজে লাগবে না। আর কিছু ফাইল কখনোই খাতায় ঢোকানোর যোগ্য নয়: \`.env\`-এর মতো secret, \`node_modules\`, build আউটপুট, editor-এর টেম্প ফাইল। নামগুলো \`.gitignore\`-এ লিখলে Git সেগুলো আর ট্র্যাক করে না; একবার ট্র্যাক হয়ে গেলে \`git rm --cached <file>\` দিয়ে ট্র্যাকিং ছাড়িয়ে দাও। নুসরাতের প্রথম সপ্তাহেই একবার \`.env\` বাছাই হয়ে গিয়েছিল—\`git restore --staged .env\` দিয়ে সে ওটা নামিয়ে \`.gitignore\`-এ নাম যোগ করেছিল; খাতায় আগে কিছু ঢোকেনি, তাই বিপদও হয়নি।

নিচের টেবিলে তিন অবস্থার যাত্রাপথ:

| অবস্থা | মানে | পরের ধাপে যাওয়ার কমান্ড |
| --- | --- | --- |
| working directory | তুমি এখন যার নিয়ে কাজ করছ | \`git add <file>\` |
| staging area | পরের commit-এর বাছাই তালিকা | \`git commit -m "..."\` |
| repository | স্থায়ী snapshot-এর খাতা | \`git push\` (পরের টপিকে) |

## কোডে দেখি

নুসরাতের প্রথম দিনের কাজটা কমান্ডে দাঁড়ায় এমন:

\`\`\`bash
git status
# modified: README.md (not staged)
git diff
# ঠিক কোন লাইনে কী বদলাল, সেটা দেখা যাবে
git add README.md
git commit -m "docs: add local setup notes to readme"
git log --oneline --graph -5
\`\`\`

ইতিহাস পড়লে চেইনটা দেখবে এমন:

\`\`\`text
* a1b2c3d (HEAD -> main) docs: add local setup notes to readme
* 9f8e7d6 fix: correct login redirect after signup
* 4c5b6a7 feat: add study-group reminder banner
* 2d3e4f5 chore: set up lint and format tooling
\`\`\`

প্রতিটা লাইন এক একটা snapshot—বাঁয়ে সংক্ষিপ্ত hash, ডানে কাজের পরিচয়। বদলানো আর বাছাই করা পরিবর্তন আলাদা দেখতে \`git diff\` আর \`git diff --staged\`। বাছাই থেকে সরাতে \`git restore --staged <file>\`—নিরাপদ, লেখা কোড জায়গায় থাকবে। কিন্তু \`git restore <file>\` নতুন লেখা মুছে শেষ commit-এ ফেরত নেয়—undo নেই; চালানোর আগে ভেবে দেখো।

## ধাপে ধাপে

1. কাজের শুরুতে \`git status\` দিয়ে দেখে নাও তালিকা পরিষ্কার, অবাঞ্ছিত পরিবর্তন নেই।
2. একটা ছোট কাজ শেষ করো—একটা bug বা একটা docs আপডেট; একসাথে দশটা নয়।
3. \`git diff\` দিয়ে নিজের লেখা পড়ে ফেলো—নিজেই নিজের প্রথম রিভিউয়ার।
4. যা ঢোকাবে ঠিক তাই বাছাই করো: ফাইল ধরে ধরে \`git add\`, দরকার হলে \`git add -p\`।
5. টিমের রীতি মেনে ছোট, অর্থবহ message লিখে commit করো।
6. \`git log --oneline --graph -5\` দিয়ে নতুন এন্ট্রি মিলিয়ে নাও।

### ল্যাব: নিজের প্রথম নোটবুক repository

ল্যাবটা নিজের কম্পিউটারের টার্মিনালে চালাও—PAU OJ-এর জাজ Git চালায় না, তাই ইন্টারনেট বা GitHub কিছুই লাগবে না। মন্তব্যে প্রতিটা ধাপের প্রত্যাশিত ফল লেখা আছে (git 2.28-এর আগের ভার্সনে \`-b main\` না চললে \`git init\`-এর পরে \`git branch -m main\` চালিয়ে নাও):

\`\`\`bash
mkdir git-notebook && cd git-notebook
git init -b main
echo "# My Git notebook" > README.md
git status
# untracked files: README.md
git add README.md
git status
# changes to be committed: new file README.md
git commit -m "docs: first note in my git notebook"
# 1 file changed, 1 insertion(+)
echo "## Day 1" >> README.md
git diff
# + "## Day 1" লাইনটা দেখা যাবে, এখনো বাছাই হয়নি
git add README.md
git commit -m "docs: add day 1 section"
git log --oneline --graph
\`\`\`

শেষে ইতিহাসটা দেখবে এমন:

\`\`\`text
* b2f4e91 (HEAD -> main) docs: add day 1 section
* 7c1a0d3 docs: first note in my git notebook
\`\`\`

খেয়াল করো—প্রতিটা ধাপে \`git status\`-এর ভাষা বদলেছে: untracked, তারপর staged, তারপর "nothing to commit, working tree clean"। এই তিন অবস্থার নাচটাই Git-এর দৈনন্দিন জীবন। এরপর একটা ভুল ঘটিয়ে দেখো: \`echo "draft" >> README.md\` লিখে \`git restore README.md\` চালালে draft লাইনটা মুছে যাবে—ফেরানোর উপায় নেই।

## সাধারণ ভুল

- এক commit-এ দশটা আলাদা কাজ গুঁজে দেওয়া; পরে কোনটা কখন ভাঙল খুঁজে বের করা দুঃসাধ্য হয়।
- "update", "fix" মতো message; এক মাস পরে ইতিহাস পড়ার মানুষটা—হয়তো তুমিই—কিছুই বুঝবে না।
- \`.env\` বা API key আটকে যাওয়া ফাইল commit করে ফেলা; \`.gitignore\` আগেই লিখে রাখো, \`git status\`-এ অচেনা ফাইল দেখলে থামো।
- \`git add -A\` অন্ধের মতো চালিয়ে বাছাই তালিকায় কী ঢুকল দেখা ছাড়াই commit করা।
- \`git restore\` চালিয়ে অসংরক্ষিত কাজ মুছে ফেলা; এটা recycle bin নয়।
- push হওয়া commit amend করে আবার push করার চেষ্টা; ইতিহাস দুই রকম হয়ে দাঁড়ায়।

## চিটশিট

| কমান্ড | কাজ | ঝুঁকির মাত্রা |
| --- | --- | --- |
| \`git status\` | এখনকার অবস্থা | নিরাপদ, যতবার খুশি |
| \`git add <file>\` | বাছাই তালিকায় তোলা | নিরাপদ |
| \`git commit -m "..."\` | snapshot খাতায় বসানো | আগে দেখে নাও |
| \`git commit --amend\` | শেষ commit ঠিক করা | push-এর পরে বিপজ্জনক |
| \`git restore --staged <file>\` | বাছাই থেকে নামানো | নিরাপদ, কোড অক্ষত |
| \`git restore <file>\` | শেষ commit-এ ফেরানো | নতুন লেখা মুছে যায় |
| \`git diff\` / \`git diff --staged\` | পরিবর্তন পড়া | নিরাপদ |
| \`git log --oneline --graph\` | ইতিহাস এক নজরে | নিরাপদ |

## প্রফেশনাল অভ্যাস

টিমে টিকে থাকা Git-অভ্যাস সহজ, তবে প্রতিদিনের: ছোট কাজ, ছোট commit; প্রতিটা message-এ কাজের পরিচয়; commit-এর আগে \`git status\` আর \`git diff --staged\`—আর secret কখনোই খাতায় ঢোকাবে না। মাহিন নুসরাতকে প্রথম দিনেই বলেছিল: "commit message হলো ভবিষ্যতের সতীর্থের কাছে তোমার চিঠি—সে হয়তো তোমাকে দেখবে না, তবু তার কাজ সহজ করে দাও।" এই এক লাইন মনে রাখলে তোমার message আর কখনো অলস হবে না।

গাইডেড সমস্যা \`learn-git-stage-plan\` (কোন ফাইল কোন কমান্ডে কোথায় গোছাবে) আর \`learn-git-log-order\` (ইতিহাসের লাইন সাজানো) দিয়ে ড্রিল শুরু করো। এই প্ল্যাটফর্মের প্র্যাকটিস অফলাইন জ্ঞান-ড্রিল—নিজের টার্মিনালে ল্যাবটা চালিয়ে তারপর উত্তর মিলিয়ে নাও।`,
  guidedProblemSlugs: ["learn-git-stage-plan", "learn-git-log-order"],
  practiceProblemSlugs: { easy: [], medium: [], hard: [] },
  extraProblemSlugs: ["learn-git-ignore-rules", "learn-git-commit-fix"],
};
