import type { LearningTopicDefinition } from "@/lib/learning/types";

const pipelinesConcept = `## কেন দরকার

সকাল ৯টা, স্ট্যান্ডআপের দশ মিনিট আগে। নুসরাত GitHub খুলে দেখে main ব্রাঞ্চের পাশে লাল X—কাল রাতে একজন টেস্ট না চালিয়েই পুশ করেছিল, আর এখন পুরো দল দাঁড়িয়ে। তাসনিম রেগে না গিয়ে একটাই প্রশ্ন করল: "মানুষের মনে রাখা নির্ভর করব, নাকি সিস্টেম জোর করে থামাবে?" সেদিনই নুসরাত লিখে ফেলে দলের প্রথম CI পাইপলাইন: পুশ হলেই টেস্ট চলবে, লাল থাকলে মার্জও হবে না। তারপর ধারাবাহিক অধ্যায়: যে ইমেজ টেস্ট পাস করেছে সেটাই deploy হবে, নতুন করে বানানো নয়; মাইগ্রেশন চলবে নিজের ধাপে, deployের আগে; আর যেদিন রিলিজ গিয়ে সাইট নামাল, মাহিন শান্ত গলায় বলল: "আগে রোলব্যাক, ব্যাখ্যা পরে।" এই টপিক শেষ করলে তুমি একটা পাইপলাইন শুধু চালাতে পারবে না—পাহারা দিতে আর ভাঙা জিনিস ফেরাতেও পারবে। এটাই প্রফেশনাল টিমের আসল লাইন।

## মূল ধারণা

**ওয়ার্কফ্লো মানে ধাপে ধাপে সাজানো job।** GitHub Actions-এ \`on:\` ঠিক করে কখন চলবে (push, pull_request), \`jobs:\` বলে কী কী কাজ হবে, আর এক job-এর \`needs:\` বলে সে কোন job-এর সবুজের পরে ছাড়া পাবে। \`needs\`-চেইন মানেই সিঁডি: টেস্ট সবুজ না হলে deploy job চলবেই না।

**একবার বিল্ড, সব জায়গায় সেই ইমেজ।** যে ইমেজ টেস্ট পাস করেছে সেটাই deploy হবে—deployের সময় আবার বিল্ড নয়। ইমেজের ট্যাগ git SHA দিয়ে বাঁধো (\`campus-app:sha-3f2c1d\`); তাহলে "কোন ইমেজ টেস্ট হলো" আর "কোনটা চলছে"—দুই প্রশ্নের একই উত্তর।

**matrix আর cache: দ্রুত, তবু বিস্তৃত।** \`strategy.matrix\` দিয়ে একই টেস্ট Node 22 আর 24 দুই সেটআপে চালাও; ডিফল্ট fail-fast চালু—একটা পড়লে বাকিগুলো বাতিল, লাল সংকেত দ্রুত আসে। \`cache\` দিয়ে dependency নামানোর সময় কমাও; বিল্ডের ফল \`upload-artifact\` দিয়ে পরের job-এ পাঠাও—দ্বিতীয়বার বানানোর দরকার নেই।

**লাল হলে দরজা বন্ধ।** branch protection-এ required checks চালু করলে পাইপলাইন সবুজ না হলে GitHub মার্জ বাটনই দেখাবে না। মানুষের মনে রাখার দায় সেখানে শেষ—সিস্টেম জোর করে থামায়।

**deployের সিঁডি: মাইগ্রেশন গেট → হেলথ চেক → রোলব্যাক।** নতুন ইমেজের আগে migration আলাদা ধাপে চালাও; ইমেজ উঠে গেলে \`/health\` কিছুক্ষণ পরখ করো; না পাস করলে আগের SHA-এর ইমেজে ফিরে এসো। রোলব্যাক ব্যর্থতা নয়—নিরাপত্তার নিঃশ্বাস।

**চোখ থাকবে: observability।** deployের পর error rate, latency আর লগের দিকে তাকিয়ে থাকো; alert সাজাও যেন ইউজার জানার আগেই তুমি জানো।

| চাবিকাঠি | কাজ |
| --- | --- |
| \`on\` | কখন চলবে: push, pull_request |
| \`jobs\` | কী কী কাজ হবে |
| \`needs\` | কোন job-এর সবুজের পরে এটা চলবে |
| \`strategy.matrix\` | একই কাজ একাধিক সেটআপে |
| \`cache\` | dependency আবার নামানো বন্ধ |
| \`upload-artifact\` | বিল্ডের ফল পরের job-এ |
| \`environment\` + \`secrets\` | deployের অনুমতি আর সিক্রেটের ঘর |

## কোডে দেখি

\`.github/workflows/ci.yml\`—টেস্ট, বিল্ড, deployের পূর্ণ কাঠামো:

\`\`\`yaml
name: ci
on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [22, 24]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node }}
          cache: npm
      - run: npm ci
      - run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t ghcr.io/team/campus-app:sha-\${{ github.sha }} .

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - run: ./scripts/migrate.sh
      - run: ./scripts/deploy.sh sha-\${{ github.sha }}
      - run: ./scripts/wait-healthy.sh --timeout 120
      - name: Rollback on failed health
        if: failure()
        run: ./scripts/rollback.sh --to-previous
\`\`\`

পড়ার ক্রম ঠিক রাখো: \`test\` (matrix-এ দুই ভার্সন) → \`build\` (SHA ট্যাগ) → \`deploy\` (migration গেট, চালু, হেলথ, রোলব্যাক)। \`environment: production\` দিলে Settings-এ সেই environment-এ reviewer approval আর সিক্রেট বসানো যায়—YAML-এ সিক্রেট কখনো হার্ডকোড নয়, \`\${{ secrets.DEPLOY_TOKEN }}\`-এর মতো expression দিয়ে বসাও।

## ধাপে ধাপে

১. রিপোতে \`.github/workflows/ci.yml\` লিখে পুশ করো—Actions ট্যাবে \`test (22)\` আর \`test (24)\` জব দুটো সবুজ হবে।
২. ইচ্ছে করেই একটা টেস্ট ভেঙে পুশ করো—লাল X আর বাকি matrix জব cancel হওয়া দেখো; ঠিক করে আবার সবুজ।
৩. branch protection-এ required check হিসেবে \`test\` চালু করো; লাল PR-এ মার্জ বাটন আটকে যাওয়া দেখো।
৪. \`build\` job-এ ইমেজ SHA ট্যাগে; \`deploy\` job-এ \`needs\`, \`environment\` আর secrets।
৫. migrate → deploy → health check → rollback—এই সিঁডির ক্রম কখনো বদলিও না।

### ল্যাব: প্রথম পাইপলাইন—লাল-সবুজ দুটোই দেখো

কাজটা তোমার GitHub রিপোতে (PAU OJ-এর জাজ এটা চালায় না)। আগের টপিকের \`campus-app\` প্রজেক্টটাই নাও—Dockerfile তো আছেই; না থাকলে যেকোনো ছোট npm প্রজেক্ট চলবে। \`.github/workflows/ci.yml\` বসিয়ে পুশ করো:

\`\`\`bash
git add .github/workflows/ci.yml
git commit -m "ci: first pipeline"
git push
\`\`\`

প্রত্যাশা: Actions ট্যাবে \`test (22)\` আর \`test (24)\` দুটোই সবুজ টিক নেবে। campus-app ব্যবহার করলে \`build\`-ও সবুজ হবে; \`deploy\` ধাপটা এই ল্যাবে শেষ হবে না—production environment আর \`scripts/\` ফোল্ডারের স্ক্রিপ্টগুলো রিপোতে নেই, তাই job অপেক্ষায় বা লালে থামবে (Settings → Environments-এ \`production\` বানিয়ে দিলে অপেক্ষাটা স্পষ্ট দেখা যায়)। এবার একটা টেস্ট ভেঙে পুশ করো: লাল X-এর পাশে fail-fast দেখবে—বাকি matrix জব cancel। ঠিক করে পুশ। শেষ ধাপ হিসেবে required check চালু করে একটা ভাঙা PR খুলে দেখো—GitHub নিজেই মার্জ আটকে দেবে। এখন "টেস্ট চালাতে ভুলে গিয়েছিলাম" কথাটা আর কাউকে বলতে হবে না—সিস্টেম নিজেই ধরবে।

## সাধারণ ভুল

- টেস্ট-পাস করা ইমেজ ফেলে deployের সময় নতুন ইমেজ বানানো—যেটা টেস্ট হয়নি সেটাই চলবে।
- required check ছাড়া branch protection: লাল মার্জ থামায় না।
- হেলথ চেক ছাড়া deploy শেষ ভাবা—কিছুক্ষণ পরে ইউজারের টিকিট আসে।
- রোলব্যাক প্ল্যান শুধু মুখে—স্ক্রিপ্টে না থাকলে চাপের মুহূর্তে লেখা যায় না।
- fail-fast বন্ধ করে সব সেটআপ শেষ পর্যন্ত চালানো—সময় নষ্ট, সংকেত দেরিতে।
- সিক্রেট YAML-এ সরাসরি লেখা—রিপোর ইতিহাসে চিরদিনের জন্য।

### চিট শিট

\`\`\`yaml
on: [push]              # কখন চলবে
needs: [test]            # নির্ভরতা: আগে test সবুজ
if: failure()           # আগের ধাপ পড়লেই এই ধাপ
environment: production # অনুমতি আর সিক্রেটের ঘর
concurrency: deploy     # একসাথে একটাই deploy
\`\`\`

### প্রোডাকশন নিরাপত্তা নোট

deployের সিঁডি বদলানোর সুযোগ নেই: migration গেট আগে, হেলথ চেক পরে, রোলব্যাক হাতের নাগালে। ইনসিডেন্টের প্রথম প্রশ্ন "কার দোষ" নয়—"কীভাবে দ্রুত ফিরি"; ফেরার পর পোস্টমর্টেম লিখো দোষ খুঁজতে নয়—সিঁডিতে কী যোগ করলে এই পড়া আটকাত, সেটা ঠিক করতে। আর deployের রাতে চোখ রাখো error rate আর alert-এর দিকে—যত আগে ধরা, তত ছোট বিস্ফোরণ।`;

export const pipelinesTopic: LearningTopicDefinition = {
  slug: "pipelines",
  title: "CI/CD pipelines & incidents",
  titleBn: "পাইপলাইন ও ইনসিডেন্ট",
  summary:
    "GitHub Actions-এ matrix, cache আর needs-চেইন দিয়ে পাইপলাইন, তারপর migration গেট, হেলথ চেক আর রোলব্যাক।",
  concept: pipelinesConcept,
  guidedProblemSlugs: ["learn-ci-job-order", "learn-ci-matrix-cache"],
  practiceProblemSlugs: { easy: [], medium: [], hard: [] },
  extraProblemSlugs: ["learn-ci-deploy-gate", "learn-ci-rollback-plan"],
};
