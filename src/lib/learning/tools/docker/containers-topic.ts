import type { LearningTopicDefinition } from "@/lib/learning/types";

const containersConcept = `## কেন দরকার

শুক্রবার দুপুর, রিলিজের দিন। তাসনিম চায় নতুন ফিচারটা আজই প্রোডাকশনে উঠবে, কারণ সোমবার ক্লায়েন্ট ডেমো। নুসরাত নিজের ল্যাপটপে অ্যাপ চালিয়ে সব ঠিক দেখল, তারপর কোড সার্ভারে তুলল—আর অ্যাপ উঠতেই পড়ে গেল। লগে শুধু এক লাইন: "Cannot find module"। এক ঘণ্টা খোঁজার পর আসল কারণ বেরোলো—নুসরাতের ল্যাপটপে Node 24, সার্ভারে Node 18, দুই মেশিনে সিস্টেম লাইব্রেরিও আলাদা। মাহিন হেসে এক লাইনে ধরিয়ে দিল: কোড কখনো একা চলে না; তার সাথে থাকে runtime, dependency আর OS-এর নিয়ম। এগুলো না মিললে "আমার মেশিনে তো চলছিল" জ্বরের মতো প্রতি রিলিজে ফিরে আসবে।

Docker এই অসুখের ওষুধ। কোড, runtime, dependency আর কনফিগ একসাথে একটা image-এ প্যাক হয়; সেই image যেখানেই চলুক—ল্যাপটপ, ল্যাবের পিসি, ক্লাউড সার্ভার—আচরণ এক থাকে। ইউনিভার্সিটির গ্রুপ প্রজেক্ট থেকে ইন্টার্নশিপের প্রথম deploy পর্যন্ত এই গ্যারান্টিই আসল রেলাইফ। এই টপিকে তুমি শিখবে image আর container-এর পার্থক্য, Dockerfile-এর layer আর cache, build context আর নিরাপদ বিল্ডের অভ্যাস—সব হাতে-কলমে।

## মূল ধারণা

**image আর container আলাদা জিনিস।** image হলো read-only ছাঁচ—layer-এর একটা স্তূপ, অনেকটা ক্লাসের মতো। container হলো সেই ছাঁচ থেকে চালানো instance—object-এর মতো। একটাই image থেকে যত খুশি container চালানো যায়; প্রত্যেকটার নিজের filesystem, নিজের process আর নিজের নেটওয়ার্ক থাকে।

**প্রতিটা instruction একটা layer।** Dockerfile-এর প্রতিটা নির্দেশ একটা layer বানায়, আর Docker প্রতিটা layer ক্যাশে রাখে: যে layer বদলায়নি সেটা আবার চলবে না। তাই ক্রমই আসল খেলা—\`package.json\` আগে \`COPY\` করে \`npm ci\` চালাও, কোড পরে; তাহলে কোড এডিট করলেও ভারী ইনস্টল ধাপটা ক্যাশ থেকেই আসবে।

**build context মানে যা ডেমনে যায়।** \`docker build .\` চালালে পুরো ফোল্ডারটা Docker ডেমনে পাঠানো হয়। \`.dockerignore\` না থাকলে \`node_modules\`, \`.git\` আর সবচেয়ে ভয়ংকর জিনিস \`.env\`—সব চলে যাবে; ইমেজ মোটা হবে, সিক্রেট লিক হবে।

**base image pin করো।** \`node:latest\` মানে "আজ যা পাই"; কাল সেটা বদলে গেলে বিল্ড রহস্যময়ভাবে ভাঙবে। \`node:24.11-alpine\`-এর মতো নির্দিষ্ট ট্যাগ লিখলে সবার মেশিনে একই base আসে, আর alpine সাইজে অনেক হালকা।

**পোর্টের সত্য কথা।** Dockerfile-এর \`EXPOSE 3000\` শুধু পাঠকের জন্য তথ্য—এটা কোনো দরজা খোলে না। হোস্ট মেশিন থেকে ঢুকতে চাইলে run-এর সময় \`-p 3000:3000\` দিতে হয়: বাঁয়ে হোস্টের পোর্ট, ডানে কনটেইনারের।

**ARG আর ENV দুই সময়ের মানুষ।** \`ARG\` শুধু বিল্ডের সময় বাঁচে, \`ENV\` চালানোর সময়ও থাকে। সিক্রেট কোনোটাতেই লিখবে না—\`docker history\` দিয়ে ENV-এর মান যে কেউ পড়তে পারে।

**root ছেড়ে দাও।** ডিফল্টে container root হিসেবে চলে; official node ইমেজে একটা \`node\` user আছে। \`USER node\` লিখে অ্যাপকে তার নিচে চালাও—ভিতরে কেউ ঢুকলেও root-এর ক্ষমতা পাবে না।

| প্রশ্ন | এক নজরে |
| --- | --- |
| image কী? | read-only layer-এর স্তূপ, চালানোর ছাঁচ |
| container কী? | image-এর চলমান instance |
| layer cache কী দেয়? | বদলায়নি ধাপ আবার চালায় না |
| build context কী? | বিল্ডের সময় ডেমনে পাঠানো ফোল্ডার |
| \`-p 8000:3000\` কী করে? | হোস্টের 8000 পোর্ট কনটেইনারের 3000-এ জুড়ে দেয় |

## কোডে দেখি

ছোট একটা Express অ্যাপের জন্য প্রথম Dockerfile:

\`\`\`dockerfile
# syntax=docker/dockerfile:1
FROM node:24.11-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["node", "server.js"]
\`\`\`

পড়ার ক্রম লক্ষ করো: lock ফাইল আগে, তাই \`npm ci\` ঠিক ভার্সনে চলে; কোড পরে, তাই এডিটে ক্যাশ বাঁচে; শেষে production মোড—root ছাড়া। বিল্ড আর চালানো:

\`\`\`bash
docker build -t campus-app:0.1 .
docker images campus-app
docker run --rm -d -p 3000:3000 --name campus campus-app:0.1
curl -s localhost:3000/health
docker logs campus
docker stop campus
\`\`\`

\`docker images\`-এ সাইজ দেখে ঘাবড়ে যেও না—মোটা base নিলে ৯০০MB-ও আসে; পরের টপিকে multi-stage দিয়ে এই মোটা হিসাব মেলাব।

## ধাপে ধাপে

১. প্রজেক্ট রুটে আগে \`.dockerignore\` লিখে ফেলো: \`node_modules\`, \`.git\`, \`.env\`।
২. base image ট্যাগসহ pin করো।
৩. lock ফাইল আগে, \`npm ci\`; কোড পরে—এই ক্রমটাই cache-এর প্রাণ।
৪. \`USER node\` দিয়ে root ছাড়ো।
৫. বিল্ড করো, \`-p\` দিয়ে চালাও, \`curl\` আর \`docker logs\` দিয়ে মিলিয়ে নাও।

### ল্যাব: প্রথম বিল্ড, তারপর ক্যাশের জাদু

ল্যাবটা তোমার নিজের মেশিনের টার্মিনালে—PAU OJ-এর জাজ Docker চালায় না। Docker ইনস্টল থাকলে শুরু করো:

\`\`\`bash
mkdir campus-app && cd campus-app
cat > package.json <<'EOF'
{ "name": "campus-app", "scripts": { "build": "mkdir -p dist && cp server.js dist/server.js" }, "dependencies": { "express": "^4.21.2" } }
EOF
cat > server.js <<'EOF'
const app = require("express")();
app.get("/health", (_req, res) => res.send("ok"));
app.listen(3000);
EOF
npm install
printf "node_modules\\n.git\\n.env\\n" > .dockerignore
\`\`\`

\`npm install\` থেকে \`package-lock.json\` তৈরি হবে—এটাই \`npm ci\`-এর ভিত্তি; \`node_modules\` থাকবে \`.dockerignore\`-এর কারণে বিল্ডের বাইরে।

উপরের Dockerfile সেভ করে বিল্ড করো পর পর দুবার:

\`\`\`bash
docker build -t campus-app:0.1 .
docker build -t campus-app:0.1b .
\`\`\`

প্রত্যাশা: প্রথম বিল্ড প্রতিটা ধাপ নতুন করে চালাবে; দ্বিতীয়টা প্রতিটা ধাপের পাশে \`CACHED\` লেখা দেখিয়ে সেকেন্ড দুয়েকেই শেষ। এবার \`server.js\`-এ একটা লাইন বদলে আবার বিল্ড করো: \`npm ci\` এখনো \`CACHED\`, শুধু \`COPY . .\`-এর পরের ধাপগুলো নতুন করে চলবে—এটাই layer cache-এর শক্তি। এরপর চালাও:

\`\`\`bash
docker run --rm -d -p 3000:3000 --name campus campus-app:0.1
curl -s localhost:3000/health
docker ps --filter name=campus
docker stop campus
\`\`\`

প্রত্যাশা: \`curl\` উত্তর দেবে \`ok\`; \`docker ps\`-এ দেখাবে \`0.0.0.0:3000->3000/tcp\`। একটা পরীক্ষা করে দেখো—\`-p\` ছাড়া চালালে \`localhost:3000\` একদমই পাওয়া যাবে না: \`EXPOSE\` দরজা খোলে না, \`-p\` খোলে।

## সাধারণ ভুল

- \`.dockerignore\` ছাড়া \`COPY . .\` লেখা: context-এ \`node_modules\` আর \`.env\` ঢুকে যায়—মোটা ইমেজ, লিক করা সিক্রেট।
- \`node:latest\` ব্যবহার: আজ যা চলছে কাল ভাঙবে।
- কোড আগে \`COPY\` করা: প্রতি এডিটে \`npm ci\` আবার চলে, বিল্ড ধীর হয়ে মরে।
- \`EXPOSE\`-কে দরজা ভাবা: \`-p\` ছাড়া হোস্ট থেকে পোর্ট পাওয়া যায় না।
- root হিসেবে চালানো: অ্যাপের একটা বাগ পুরো মেশিনের ঝুঁকি হয়ে ওঠে।
- \`ENV\`-এ API key রাখা: \`docker history\` সবাই পড়তে পারে, আর image যেখানে যায় সিক্রেটও সেখানে যায়।

### চিট শিট

\`\`\`bash
docker build -t name:tag .           # ইমেজ বানাও
docker run -d -p 3000:3000 name:tag  # চালাও
docker ps                            # কোনগুলো চলছে
docker logs -f name                  # লগ লেগে থাকো
docker exec -it name sh              # ভিতরে ঢুকে দেখো
docker history name:tag              # layer পড়ে সিক্রেট মেলাও
\`\`\`

### প্রোডাকশন নিরাপত্তা নোট

রেজিস্ট্রিতে পাঠানোর আগে \`docker history\` দিয়ে একবার পড়ে নাও—কোনো layer-এ সিক্রেট বসে আছে কি না। \`.dockerignore\`-এ \`.env\` থাকা বাধ্যতামূলক, আর সিক্রেট রাখো রান টাইমের জন্য বাইরে—পরের টপিকে সেই পথ দেখব। আর ট্যাগ ছাড়া কোনো \`FROM\` নয়—pinned না হলে তোমার দোষ ছাড়াই বিল্ড ভেঙে পুরো টিমের দুপুর নষ্ট করবে।`;

export const containersTopic: LearningTopicDefinition = {
  slug: "containers",
  title: "Containers, images & Dockerfile",
  titleBn: "কনটেইনার ও ইমেজ",
  summary:
    "image আর container-এর পার্থক্য ধরে Dockerfile-এর layer cache, \`.dockerignore\` আর pinned base দিয়ে প্রথম নিরাপদ বিল্ড।",
  concept: containersConcept,
  guidedProblemSlugs: ["learn-docker-layer-cache", "learn-docker-image-size"],
  practiceProblemSlugs: { easy: [], medium: [], hard: [] },
  extraProblemSlugs: [
    "learn-docker-build-context",
    "learn-docker-runtime-config",
  ],
};
