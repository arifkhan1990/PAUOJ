import type { LessonVisualConfig } from "@/lib/learning/visual-types";

/**
 * Visual configs for the two free career-toolkit tracks
 * (slugs: git-github, docker-cicd).
 * Keys follow the merged `${moduleSlug}/${topicSlug}` convention.
 */
export const toolsVisuals: Record<string, LessonVisualConfig> = {
  "git-github/snapshots": {
    kind: "git",
    title: "ছোট ছবি, পরিষ্কার ইতিহাস",
    caption:
      "প্রতিটা commit পুরো প্রজেক্টের একটা ছবি, আর ছোট ছোট ছবি জুড়েই পড়ার-যোগ্য ইতিহাস দাঁড়ায়।",
    steps: [
      { label: "একটা ছোট কাজ শেষ করো", note: "এক commit-এ একটাই ধারণা" },
      { label: "git add দিয়ে বাছো", note: "staging-এ ঢোকাবে ঠিক যেটা দরকার" },
      { label: "commit দিয়ে ছবি তুলো", note: "কে, কখন, কেন — সব এক এন্ট্রিতে" },
      { label: "message-এ কাজের পরিচয় লেখো", note: "fix: বা docs: — টিমের রীতি" },
      { label: "ইতিহাস এক লাইনে পড়ো", note: "প্রতিটা লাইন এক একটা snapshot" },
    ],
    data: {
      labels: [
        "chore: lint সেটআপ",
        "feat: রিমাইন্ডার ব্যানার",
        "fix: লগইন রিডাইরেক্ট",
        "docs: setup নোট",
      ],
      variant: "history",
    },
  },

  "git-github/branches": {
    kind: "git",
    title: "শাখায় কাজ, মিলনে জোড়া",
    caption:
      "শাখা নিজের কাজ আলাদা রাখে, আর merge দুই ইতিহাসকে এক বিন্দুতে জুড়ে দেয়।",
    steps: [
      { label: "নতুন শাখায় ঢুকো", note: "git switch -c feature/reminder — main অটুট" },
      { label: "শাখায় ছোট ছোট commit", note: "নিজের ইতিহাস নিজের দিকে বাড়ে" },
      { label: "main-এ আরেকটা কাজ ঢুকলো", note: "সাদিয়ার টাইমিং ফিক্স আগে মিলল" },
      { label: "merge দুই পথ জোড়ে", note: "merge commit-এর দুটো বাবা" },
      { label: "conflict এলে দুই পক্ষই পড়ো", note: "দুজনের কথা রেখে marker মুছে commit করো" },
    ],
    data: {
      labels: [
        "main: বেস",
        "feature: কাজ ১",
        "feature: কাজ ২",
        "main: টাইমিং ফিক্স",
        "merge commit",
      ],
      variant: "merge",
    },
  },

  "git-github/collaboration": {
    kind: "git",
    title: "PR হয়ে নিরাপদ মিলন",
    caption:
      "protected main-এ রিভিউ আর সবুজ checks ছাড়া কিছু ঢোকে না — নিয়মটা সিস্টেম জোর করে মানায়।",
    steps: [
      { label: "শাখায় কাজ শেষ করো", note: "main-এ সরাসরি push কেউ করবে না" },
      { label: "push করে PR খোলো", note: "git push -u origin fix/login-redirect" },
      { label: "রিভিউ comment মেটাও", note: "checks সবুজ না হলে থামো" },
      { label: "squash-merge, শাখা মুছো", note: "এক PR একটা পরিষ্কার এন্ট্রি" },
      { label: "ভুল গেলে revert", note: "উল্টো কাজের নতুন commit — ইতিহাস সৎ থাকে" },
    ],
    data: {
      labels: ["শাখা", "push", "pull request", "রিভিউ ও checks", "squash-merge"],
      variant: "pr",
    },
  },

  "docker-cicd/containers": {
    kind: "docker",
    title: "layer ক্যাশে দ্রুত বিল্ড",
    caption:
      "Dockerfile-এর প্রতিটা ধাপ এক layer, আর বদলায়নি layer আর চলে না — ক্রমটাই গতি দেয়।",
    steps: [
      { label: "প্রতিটা instruction এক layer", note: "Docker ধাপগুলো আলাদা করে রাখে" },
      { label: "lock ফাইল আগে COPY করো", note: "package.json আর lock — তারপর npm ci" },
      { label: "npm ci ক্যাশে জমে", note: "নির্ভরতা না বদলালে এই layer আর চলে না" },
      { label: "কোড পরে COPY করো", note: "এডিটে শুধু শেষের layer নতুন হয়" },
      { label: "image ছাঁচ, container instance", note: "এক ছাঁচ থেকে যত খুশি কপি চলে" },
    ],
    data: {
      labels: [
        "FROM node:24.11-alpine",
        "COPY package.json",
        "RUN npm ci",
        "COPY . .",
        "CMD node server.js",
      ],
      variant: "cache",
    },
  },

  "docker-cicd/compose-production": {
    kind: "docker",
    title: "দুই স্টেজে হালকা ইমেজ",
    caption:
      "builder স্টেজে সব যন্ত্র দিয়ে বিল্ড করে শুধু ফল কপি করলে ইমেজ অনেক হালকা হয়।",
    steps: [
      { label: "builder-এ সব যন্ত্র থাকে", note: "devDependencies, কম্পাইলার, সোর্সম্যাপ" },
      { label: "বিল্ডের ফল আলাদা হয়", note: "দরকার শুধু dist ফোল্ডারটা" },
      { label: "শেষ স্টেজে ফল কপি করো", note: "COPY --from=builder — যন্ত্র বাদ" },
      { label: "রানটাইম নির্ভরতা মাত্র", note: "npm ci --omit=dev" },
      { label: "৯০০MB থেকে দুই শ মেগার নিচে", note: "পুল দ্রুত, আক্রমণের দরজাও কম" },
    ],
    data: {
      labels: [
        "builder: npm ci (dev সহ)",
        "builder: npm run build",
        "final: npm ci --omit=dev",
        "final: COPY dist",
        "final: USER node + CMD",
      ],
      variant: "multistage",
    },
  },

  "docker-cicd/pipelines": {
    kind: "pipeline",
    title: "সবুজ না হলে দরজা বন্ধ",
    caption:
      "needs-চেইন এক job-এর সবুজের পরেই পরের job ছাড়ে, তাই ভাঙা কোড main-এ ঢুকতে পারে না।",
    steps: [
      { label: "push হলেই test চলে", note: "matrix: Node 22 আর 24 দুই সেটআপে" },
      { label: "সবুজ না হলে সিঁডি বন্ধ", note: "build ছাড় পায় না — needs চেইন" },
      { label: "একবার বিল্ড, সেই ইমেজই deploy", note: "ট্যাগ git SHA দিয়ে বাঁধা থাকে" },
      { label: "migration আগে, ইমেজ পরে", note: "deploy-এর আগে নিজের ধাপে চলে" },
      { label: "healthcheck ফেল হলে রোলব্যাক", note: "আগের SHA-এর ইমেজে ফেরা — নিরাপত্তার নিঃশ্বাস" },
    ],
    data: {
      labels: ["test", "build", "migrate", "deploy", "healthcheck"],
      variant: "gate",
    },
  },
};
