import type { LearningTopicDefinition } from "@/lib/learning/types";

const composeConcept = `## কেন দরকার

প্রথম রিলিজ বেঁচে গেল, কিন্তু নুসরাতের অ্যাপ এখন আর একা নয়—ডেটা রাখার জন্য Postgres, ক্যাশের জন্য Redis। ল্যাপটপে হাতে ইনস্টল করা Postgres-এর ভার্সন একটা, ল্যাবের মেশিনে আরেকটা, সার্ভারে তৃতীয়টা—প্রতি বিকেলেই কনফিগ মেলাতে দুই ঘণ্টা হারায়। মাহিন বলল: "পুরো স্ট্যাক একটা ফাইলে লিখে ফেলো, এক কমান্ডে উঠবে আর এক কমান্ডে নামবে। এর নাম Compose।" সেই সপ্তাহেই আবার দুটো ঘটনা ঘটে। রিলিজের আগের রাতে \`docker images\` দেখায় অ্যাপের ইমেজ ৯০০MB—স্টোরেজ আর পুল-টাইম দুইই জ্বলে যায়। আর এক পুল রিকোয়েস্টে রিভিউয়ার ধরে ফেলে, নুসরাত ভুলে \`.env\` ফাইল কমিট করেছিল—ভিতরে ডেটাবেসের পাসওয়ার্ড। এই টপিকে স্ট্যাক চালানো শেখার পাশাপাশি শিখবে ইমেজ ছোট করা (multi-stage), সিক্রেট আসলে কোথায় থাকে, আর রিলিজ রাতের সবচেয়ে ফ্লেকি খলনায়ক—ডেটাবেস রেডি হওয়ার আগেই ছুটে যাওয়া অ্যাপ, যে তারপর বারবার পড়ে পড়ে উঠে।

## মূল ধারণা

**এক ফাইলে পুরো স্ট্যাক।** \`compose.yaml\`-এ প্রতিটা সার্ভিস (app, db, redis) ঘোষণা করো; \`docker compose up\` এক কমান্ডে সব তোলে, \`docker compose down\` নামায়। সার্ভিসের নামই network-এ DNS নাম—অ্যাপ ডেটাবেস \`localhost\`-এ খোঁজে না, হোস্টনেম \`db\`-তে খোঁজে।

**depends_on-এর দুই রূপ।** শর্ট ফর্ম শুধু বলে "db আগে স্টার্ট করো"—স্টার্ট হওয়া আর রেডি হওয়া এক কথা নয়। db রেডি নিশ্চিত করতে চাইলে db-তে \`healthcheck\` দাও আর app-এর \`depends_on\`-এ \`condition: service_healthy\` বসাও। নাহলে app আগে ছুটে গিয়ে \`ECONNREFUSED\` খেয়ে crash-loop করবে—কিছুক্ষণ পরে নিজেই ঠিক হয়ে যায়, তাই টেস্টে ধরা পড়ে না, শুধু রিলিজ রাতে ফ্লেক করে।

**volume: ডেটা কনটেইনারের বাইরে।** named volume ডেটাবেসের ডেটা হোস্টের জায়গায় রাখে—container মুছে ফেললেও ডেটা থাকে। dev-এ bind mount দিয়ে কোডের ফোল্ডার সরাসরি জুড়ে হট-রিলোড পাও; কিন্তু production ইমেজে কোড baked থাকে—dev-এর mount আর prod-এর ইমেজ এক জিনিস নয়।

**সিক্রেটের ঠিকানা রান টাইম।** compose ফাইলে \`\${DB_PASSWORD}\`-এর মতো ভেরিয়েবল লোকাল \`.env\` থেকে আসে—সেই \`.env\` কখনো কমিট হবে না আর ইমেজের layer-এও থাকবে না। টিমে দরকারি মান জানাতে \`.env.example\` কমিট করো, মান নয়। লিক হয়ে গেলে প্রথম কাজ পাসওয়ার্ড রোটেট করা—ইতিহাস মোছা তার পরের ধাপ, কারণ কেউ ইতিহাস পড়ে ফেললে রোটেশনই একমাত্র বিশ্বাস।

**multi-stage: বানানোর যন্ত্র আর চালানোর যন্ত্র আলাদা।** বিল্ড করতে devDependencies, কম্পাইলার, সোর্সম্যাপ লাগে; চালাতে লাগে না। builder স্টেজে সব বানিয়ে শেষ স্টেজে শুধু ফল কপি করো (\`COPY --from=builder\`)—৯০০MB নেমে আসে দুই শ মেগার নিচে, পুল-টাইমও ছোট, আক্রমণের দরজাও কম।

| দিক | dev সেটআপ | production ইমেজ |
| --- | --- | --- |
| কোড | bind mount, সেভ করলেই রিলোড | ইমেজের ভিতরে baked |
| dependency | devDependencies সহ | শুধু runtime দরকারটুকু |
| সিক্রেট | লোকাল \`.env\` ফাইল | রান টাইমে সিক্রেট ম্যানেজার |
| ডেটা | named volume | named volume + নিয়মিত ব্যাকআপ |

## কোডে দেখি

multi-stage Dockerfile—builder-এ সব যন্ত্র, শেষ স্টেজে শুধু চালানোর জিনিস:

\`\`\`dockerfile
# syntax=docker/dockerfile:1
FROM node:24.11-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24.11-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
\`\`\`

আর \`compose.yaml\`—healthcheck আর condition-সহ স্ট্যাক:

\`\`\`yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://app:\${DB_PASSWORD}@db:5432/campus
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
  db:
    image: postgres:17.2-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: \${DB_PASSWORD}
      POSTGRES_DB: campus
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d campus"]
      interval: 5s
      timeout: 3s
      retries: 10
  redis:
    image: redis:7.4-alpine
volumes:
  db-data:
\`\`\`

লক্ষ করো: \`postgres\`-ও pinned, আর app db-এর হেলথের প্রতীক্ষা করছে—সিক্রেট বাইরে থেকে আসছে।

## ধাপে ধাপে

১. স্ট্যাকের সার্ভিস আলাদা করো (app, db, cache) আর প্রতিটার ইমেজ pinned করো।
২. db-তে healthcheck দাও; app-এর depends_on-এ \`condition: service_healthy\` বসাও।
৩. লোকাল \`.env\` বানাও; \`.gitignore\`-এ \`.env\` আছে কি না মিলিয়ে নাও, রেপোতে \`.env.example\` রাখো।
৪. multi-stage লিখে ইমেজ ছোট করো; আগের-পরের সাইজ \`docker images\` দিয়ে মেপে রাখো।
৫. \`docker compose up -d --build\` চালিয়ে \`docker compose ps\`-এ db \`healthy\` আর app \`Up\` না হওয়া পর্যন্ত দেখো।

### ল্যাব: স্টার্টআপ অর্ডার ঠিক করা

এই ল্যাবটাও তোমার নিজের মেশিনে—PAU OJ-এর জাজ Docker Compose চালায় না। আগের টপিকের \`campus-app\` ফোল্ডারেই থাকো (না থাকলে সেই ল্যাবের ধাপগুলো আগে চালাও), উপরের Dockerfile আর \`compose.yaml\` প্রজেক্টে সেভ করো, তারপর \`.env\` আর \`.dockerignore\` বানাও:

\`\`\`bash
printf 'DB_PASSWORD=dev-only-password\\n' > .env
printf "node_modules\\n.git\\n.env\\n" > .dockerignore
docker compose up -d --build
docker compose ps
docker compose logs -f app
\`\`\`

প্রত্যাশা: \`docker compose ps\`-এ db \`(health: starting)\` থেকে \`(healthy)\` হবে, তার পরেই app \`Up\` দেখাবে। এবার এক্সপেরিমেন্ট: app-এর \`depends_on\` থেকে \`condition: service_healthy\` লাইনটা মুছে আবার \`up\` করো—app আর db-এর প্রস্তুতির অপেক্ষা করবে না, \`docker compose ps\`-এ app আগেই \`Up\` দেখাবে। DB-নির্ভর কোনো কোড থাকলে ঠিক এখানেই প্রথম রিকোয়েস্টগুলো ব্যর্থ হয়; টেস্টে ধরা পড়ে না, রিলিজ রাতেই ফুটে ওঠে। condition ফিরিয়ে আনো। এরপর:

\`\`\`bash
docker images
docker compose down
\`\`\`

প্রত্যাশা: multi-stage বিল্ডের নতুন app ইমেজ আগের এক-স্টেজ \`campus-app:0.1\`-এর চেয়ে ছোট হবে—এই খেলনা অ্যাপে devDependencies নেই বলে পার্থক্য হালকা, কিন্তু আসল প্রজেক্টে (TypeScript, devDependencies, source map) এই কৌশলেই ৯০০MB দুই শ মেগার নিচে নামে। দুই ইমেজের সাইজ \`docker images\`-এ পাশাপাশি মিলিয়ে দেখো। \`compose down\` volume রেখে দেয়; \`down -v\` দিলে ডেটাও যাবে—ডেভেলপমেন্টে সুবিধা, প্রোডাকশন ডেটায় এই কমান্ড কখনো না।

## সাধারণ ভুল

- শর্ট \`depends_on\`-কে "db রেডি" ভাবা: স্টার্ট হওয়া আর রেডি হওয়া এক নয়।
- \`.env\` কমিট করা বা ইমেজের layer-এ রাখা: রোটেশন ছাড়া শুধু ইতিহাস মোছা কাজের নয়।
- dev-এর bind mount প্রোডাকশনে নিয়ে যাওয়া: সার্ভারে সেই ফোল্ডার নেই।
- healthcheck ছাড়া db: app প্রতি deploy-তে জুয়া খেলছে।
- \`latest\` ট্যাগে স্ট্যাক তোলা: এক সপ্তাহ পরেই অন্য আচরণ।
- builder-এর ভারী যন্ত্রপাতি শেষ ইমেজে রেখে দেওয়া: সাইজ আর ঝুঁকি দুইই বাড়ে।

### চিট শিট

\`\`\`bash
docker compose up -d --build  # স্ট্যাক তোলো
docker compose ps              # স্টেটাস আর হেলথ
docker compose logs -f app     # এক সার্ভিসের লগ
docker compose exec app sh     # ভিতরে ঢুকে দেখো
docker compose down            # নামাও, volume থাকে
docker compose down -v         # ডেটাসহ মুছে ফেলো (সাবধান!)
\`\`\`

### প্রোডাকশন নিরাপত্তা নোট

সিক্রেট থাকবে কেবল রান টাইমে: \`.env\` কখনো কমিট নয়, ইমেজের layer-এ নয়; লিক হলে আগে রোটেট, পরে ইতিহাস গোছাও। প্রোডাকশন ইমেজ হবে pinned, non-root আর multi-stage; ডেটাবেসের volume-এর নিয়মিত ব্যাকআপ থাকবে—কনটেইনার আসে যায়, ডেটা থাকতে হবে। আর \`down -v\` প্রোডাকশন ডেটার কাছে কখনোই অস্ত্র নয়।`;

export const composeProductionTopic: LearningTopicDefinition = {
  slug: "compose-production",
  title: "Compose, config & production images",
  titleBn: "কম্পোজ ও প্রোডাকশন",
  summary:
    "healthcheck-সহ Compose স্ট্যাক, সিক্রেট রান টাইমে রাখা আর multi-stage দিয়ে ৯০০MB ইমেজ ছোট করা।",
  concept: composeConcept,
  guidedProblemSlugs: ["learn-docker-compose-start", "learn-docker-multistage"],
  practiceProblemSlugs: { easy: [], medium: [], hard: [] },
  extraProblemSlugs: ["learn-docker-healthcheck", "learn-docker-secret-leak"],
};
