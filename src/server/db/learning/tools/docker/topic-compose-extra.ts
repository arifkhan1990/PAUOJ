import type { SeedProblem } from "../../../seed-problems";

const HEALTHCHECK_PY = `import sys

interval, retries, start_period, ready_at = map(int, sys.stdin.read().split())
failed = 0
counted = 0
moment = 0
while True:
    moment += interval
    if moment >= ready_at:
        print("HEALTHY: " + str(moment))
        print("FAILED: " + str(failed))
        break
    failed += 1
    if moment >= start_period:
        counted += 1
        if counted >= retries:
            print("UNHEALTHY: " + str(moment))
            print("FAILED: " + str(failed))
            break
`;

const SECRET_LEAK_PY = `import re
import sys

SECRET_WORDS = ("PASSWORD", "TOKEN", "SECRET", "KEY", "PRIVATE")

def is_secret_name(name):
    upper = name.upper()
    for word in SECRET_WORDS:
        if word in upper:
            return True
    return False

def is_secret_file(path):
    base = path.rsplit("/", 1)[-1]
    if base == ".env" or base.startswith(".env."):
        return True
    if base.endswith(".pem") or base.endswith(".key") or base.endswith(".p12"):
        return True
    return base == "id_rsa"

def ignored(path, patterns):
    for pattern in patterns:
        if path == pattern or pattern in (".", "*"):
            return True
        if path.startswith(pattern.rstrip("/") + "/"):
            return True
    return False

lines = [line.strip() for line in sys.stdin.read().splitlines() if line.strip()]
ignores = []
entries = []
for line in lines:
    parts = line.split(maxsplit=1)
    if parts[0] == "IGNORE":
        ignores.append(parts[1].strip())
    else:
        entries.append((parts[0], parts[1].strip() if len(parts) > 1 else ""))

flags = set()
for kind, text in entries:
    if kind == "COPY":
        path = text.split()[0]
        if is_secret_file(path) and not ignored(path, ignores):
            flags.add("COPY_SECRET")
    elif kind == "ENV":
        if is_secret_name(text.split("=", 1)[0]):
            flags.add("ENV_SECRET")
    elif kind == "ARG":
        if "=" in text and is_secret_name(text.split("=", 1)[0]):
            flags.add("BUILD_ARG")
    elif kind == "RUN":
        for variable in re.findall(r"\\$\\{?([A-Za-z_][A-Za-z0-9_]*)", text):
            if is_secret_name(variable):
                flags.add("RUN_ECHO")
    elif kind == "SECRET":
        flags.add("SECRET_MOUNT")
    elif kind == "ENV_FROM_HOST":
        flags.add("RUNTIME_ENV")

for code in ("COPY_SECRET", "ENV_SECRET", "BUILD_ARG", "RUN_ECHO"):
    if code in flags:
        print("VERDICT: LEAK")
        print("REASON: " + code)
        sys.exit()

if "SECRET_MOUNT" in flags:
    reason = "SECRET_MOUNT"
elif "RUNTIME_ENV" in flags:
    reason = "RUNTIME_ENV"
else:
    reason = "NO_SECRET"
print("VERDICT: SAFE")
print("REASON: " + reason)
`;

export const COMPOSE_EXTRA_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-docker-healthcheck",
    title: "When Does It Turn Healthy",
    statement: `তাসনিমের নতুন সার্ভিসের healthcheck টিউন করতে হবে। মাহিন বলল, \`start_period\`-এর ভেতরের ব্যর্থতা \`retries\`-এ গোনা হয় না, কিন্তু তারপরও সার্ভিস দেরিতে উঠলে কনটেইনার \`unhealthy\` হয়ে যায়। নুসরাত এখন interval, retries, start_period আর সার্ভিস আসলে কখন প্রস্তুত হয় — এই চারটা দেখে প্রথম কবে healthy বা unhealthy হবে আর কতগুলো প্রোব ফেল করবে সেটা বের করছে।

মডেল: কনটেইনার \`t = 0\`-এ শুরু। প্রোব চলে \`interval\`, \`2 * interval\`, \`3 * interval\` — এই সময়গুলোতে। প্রোব সফল হয় যদি সময়টা \`T\`-এর সমান বা বেশি হয়; আগের সব প্রোব ফেল। \`start_period\`-এর আগের ব্যর্থতা গোনা হয় না, সমান বা পরের ব্যর্থতা গোনা হয়। গোনা ব্যর্থতা \`retries\`-এ পৌঁছালে সার্ভিস \`unhealthy\`, নাহলে প্রথম সফল প্রোবেই \`healthy\`।`,
    inputFormat: `এক লাইনে চারটা পূর্ণসংখ্যা: \`interval\`, \`retries\`, \`start_period\`, \`T\`।`,
    outputFormat: `সফল হলে প্রথম লাইনে \`HEALTHY: <সময়>\`, নাহলে \`UNHEALTHY: <সময়>\`। দ্বিতীয় লাইনে \`FAILED: <ফেল করা প্রোবের সংখ্যা>\`।`,
    constraints: `\`1 <= interval <= 60\`, \`1 <= retries <= 10\`, \`0 <= start_period <= 300\`, \`0 <= T <= 3600\``,
    editorial: `## ধারণা
Healthcheck-এর তিনটা নব আলাদা কাজ করে। \`interval\` ঠিক করে কত সময় পর পর প্রোব হবে, \`retries\` ঠিক করে টানা কত ব্যর্থতা মানে কনটেইনার \`unhealthy\`, আর \`start_period\` শুরুর সহনশীলতা — এর ভেতরের ব্যর্থতা \`retries\`-এ গোনা হয় না, যাতে ধীরে ওঠা অ্যাপ সময় পায়। \`start_period\` শেষ হলে পরপর \`retries\` ব্যর্থতাই কনটেইনারকে unhealthy করে। মনে রাখো, unhealthy মানে Docker নিজে থেকে রিস্টার্ট করে না; কনটেইনার unhealthy মার্ক হয়, তারপর orchestrator-এর নীতি অনুযায়ী নতুন অনুরোধ বন্ধ বা টাস্ক রিপ্লেস হয়।

## ধাপে ধাপে
1. চারটা মান পড়ো।
2. \`moment = 0\`, \`failed = 0\`, \`counted = 0\` রাখো।
3. প্রতিবার \`moment += interval\` করো।
4. \`moment >= T\` হলে প্রোব সফল — \`HEALTHY\` আর এখন পর্যন্ত ব্যর্থ প্রোবের সংখ্যা ছাপো।
5. নাহলে \`failed += 1\`; \`moment >= start_period\` হলে \`counted += 1\`; \`counted\` যদি \`retries\`-এ পৌঁছায়, \`UNHEALTHY\` ছাপো।

\`\`\`python
${HEALTHCHECK_PY}\`\`\`

## কমপ্লেক্সিটি
সময় \`O(retries + start_period / interval)\`, মেমোরি \`O(1)\`।

## সাধারণ ভুল
- \`start_period\`-এর ব্যর্থতাও গোনা — দেরিতে ওঠা সার্ভিস অকারণে unhealthy হয়ে যায়।
- প্রথম প্রোব \`t = 0\`-তে ধরা — এখানে প্রথম প্রোব \`interval\` পরে চলে।
- \`t == T\`-কে ব্যর্থ ধরা — সমান হলে প্রোব সফল; শর্ত \`>=\`, \`>\` নয়।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Docker", "Healthcheck", "DevOps"],
    tests: [
      { input: "5 1 0 3\n", expectedOutput: "HEALTHY: 5\nFAILED: 0\n", isSample: true },
      { input: "5 3 10 12\n", expectedOutput: "HEALTHY: 15\nFAILED: 2\n", isSample: true },
      { input: "10 3 30 55\n", expectedOutput: "UNHEALTHY: 50\nFAILED: 5\n", isSample: false },
      { input: "15 2 0 1\n", expectedOutput: "HEALTHY: 15\nFAILED: 0\n", isSample: false },
      { input: "2 5 0 100\n", expectedOutput: "UNHEALTHY: 10\nFAILED: 5\n", isSample: false },
      { input: "5 2 10 10\n", expectedOutput: "HEALTHY: 10\nFAILED: 1\n", isSample: false },
      { input: "1 1 0 1\n", expectedOutput: "HEALTHY: 1\nFAILED: 0\n", isSample: false },
    ],
    referencePython: HEALTHCHECK_PY,
  },
  {
    slug: "learn-docker-secret-leak",
    title: "Did the Secret Leak",
    statement: `শুক্রবার রাতে তাসনিমের সিকিউরিটি রিভিউয়ে ধরা পড়ল, একটা বিল্ডে ডেটাবেস পাসওয়ার্ড ইমেজের ভেতরে ঢুকে গেছে। মাহিন বলল, \`ARG\`, \`ENV\`, \`COPY\`, \`RUN\` — প্রত্যেকটার নিজের ফাঁদ আছে, আর BuildKit secret mount বা রানটাইম env ঠিকভাবে ব্যবহার করলে সিক্রেট ইমেজে ঢোকে না। নুসরাত এখন একটা ছোট বিল্ড-স্নিপেট পড়ে বলবে সিক্রেট লিক হচ্ছে কি না, আর কোন কারণে।

নিয়ম, এই ক্রমে প্রথমে যেটা মেলে সেটাই উত্তর: \`COPY\` দিয়ে \`.env\`, \`.env.*\`, \`*.pem\`, \`*.key\`, \`*.p12\` বা \`id_rsa\` কপি হলে \`COPY_SECRET\`, তবে \`IGNORE\` দিয়ে ওই ফাইল বাদ থাকলে নয়। \`ENV\`-এর নামে \`PASSWORD\`, \`TOKEN\`, \`SECRET\`, \`KEY\` বা \`PRIVATE\` থাকলে \`ENV_SECRET\`। সিক্রেট-নামের \`ARG\`-এ ডিফল্ট মান থাকলে \`BUILD_ARG\`। \`RUN\`-এর ভেতরে \`$\` দিয়ে এমন নামের ভেরিয়েবল থাকলে \`RUN_ECHO\`। লিক না থাকলে \`SECRET\` (BuildKit secret mount) থাকলে \`SECRET_MOUNT\`, নাহলে \`ENV_FROM_HOST\` থাকলে \`RUNTIME_ENV\`, নাহলে \`NO_SECRET\`।`,
    inputFormat: `প্রথমে শূন্য বা তার বেশি \`IGNORE <প্যাটার্ন>\` লাইন, তারপর বাকি লাইন — প্রতিটি \`ARG\`, \`ENV\`, \`ENV_FROM_HOST\`, \`COPY\`, \`RUN\` বা \`SECRET\`-এর একটা। ফাঁকা লাইন বাদ পড়ে। \`COPY\`-এর পরে একটা পাথ, \`RUN\`-এর পরে শেল কমান্ড।`,
    outputFormat: `দুই লাইন: \`VERDICT: LEAK\` বা \`VERDICT: SAFE\`, তারপর \`REASON: <কোড>\`।`,
    constraints: `মোট ১ থেকে ১২ লাইন
\`COPY\` এক লাইনে একটাই পাথ নেয়; \`COPY .\` একা লিক হিসেবে ধরা হয় না, কারণ context-এ কী আছে তা ইনপুটে নেই।`,
    editorial: `## ধারণা
সিক্রেট ইমেজে ঢোকার চারটা পথ আছে। \`ARG\` বিল্ড হিস্টোরিতে থেকে যায় — \`RUN\`-এ ব্যবহার করলে \`docker history\`-তে মান দেখা যায়। \`ENV\` ইমেজ কনফিগে স্থায়ী হয়, \`docker inspect\`-এ পড়া যায়। \`COPY\` ফাইলটা সরাসরি একটা লেয়ারে বসিয়ে দেয়, তাই \`.dockerignore\` ছাড়া \`.env\` কপি করা মানে সেটা ইমেজেই আছে। আর \`RUN echo "$TOKEN"\` — কমান্ডটাই হিস্টোরিতে লেখা থাকে। এর বিপরীতে \`RUN --mount=type=secret\` সিক্রেটটা কেবল ওই এক ধাপে মাউন্ট করে, লেয়ারে রাখে না; কম্পোজের \`environment:\` হোস্ট থেকে রানটাইমে মান দেয়, ইমেজে লেখে না।

## ধাপে ধাপে
1. \`IGNORE\` লাইনগুলো আলাদা করে বাকি লাইনগুলো ধরন আর টেক্সটে ভাগ করো।
2. \`COPY\`-এর পাথ সিক্রেট ফাইল কি না আর ignore-এ বাদ আছে কি না দেখো।
3. \`ENV\`, সিক্রেট-নামের \`ARG\` আর \`RUN\`-এর \`$ভেরিয়েবল\` পরীক্ষা করো।
4. লিকের চিহ্ন মিললে ঠিক ক্রমে প্রথম কোডটাই ছাপো।
5. লিক না থাকলে \`SECRET\`, তারপর \`ENV_FROM_HOST\`, নাহলে \`NO_SECRET\`।

\`\`\`python
${SECRET_LEAK_PY}\`\`\`

## কমপ্লেক্সিটি
সময় \`O(L)\`, লাইন সংখ্যা \`L\`; মেমোরি \`O(L)\`।

## সাধারণ ভুল
- \`ARG\`-এ পাসওয়ার্ড দিলে ইমেজে থাকে না ভাবা — \`RUN\`-এ ব্যবহার করলেই হিস্টোরিতে দেখা যায়।
- \`.dockerignore\`-এ \`.env\` রাখলেই সব ঠিক ভাবা — \`ENV\` বা \`ARG\` দিয়ে বসানো সিক্রেট তখনও লিক করে।
- বিল্ড-টাইম \`ARG\` আর রানটাইম \`-e\` গুলিয়ে ফেলা — প্রথমটা ইমেজ-বিল্ডের, দ্বিতীয়টা কনটেইনার চালুর।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Docker", "Security", "Secrets"],
    tests: [
      {
        input: `ARG DB_PASSWORD=hunter2
ENV APP_MODE=production
RUN npm ci
`,
        expectedOutput: "VERDICT: LEAK\nREASON: BUILD_ARG\n",
        isSample: true,
      },
      {
        input: `ARG DB_PASSWORD
ENV APP_MODE=production
RUN echo "$DB_PASSWORD" > /tmp/leak.txt
`,
        expectedOutput: "VERDICT: LEAK\nREASON: RUN_ECHO\n",
        isSample: true,
      },
      {
        input: `IGNORE .env
COPY .env
RUN npm ci
`,
        expectedOutput: "VERDICT: SAFE\nREASON: NO_SECRET\n",
        isSample: false,
      },
      {
        input: `FROM alpine:3.20
COPY id_rsa /root/.ssh/id_rsa
RUN chmod 600 /root/.ssh/id_rsa
`,
        expectedOutput: "VERDICT: LEAK\nREASON: COPY_SECRET\n",
        isSample: false,
      },
      {
        input: `SECRET npm_token
RUN npm ci
`,
        expectedOutput: "VERDICT: SAFE\nREASON: SECRET_MOUNT\n",
        isSample: false,
      },
      {
        input: `ENV_FROM_HOST DB_PASSWORD
RUN npm ci
`,
        expectedOutput: "VERDICT: SAFE\nREASON: RUNTIME_ENV\n",
        isSample: false,
      },
      {
        input: `ENV API_KEY=sk_live_123
RUN npm run build
`,
        expectedOutput: "VERDICT: LEAK\nREASON: ENV_SECRET\n",
        isSample: false,
      },
      {
        input: `COPY .env ./
ENV DB_PASSWORD=hunter2
RUN echo $DB_PASSWORD
`,
        expectedOutput: "VERDICT: LEAK\nREASON: COPY_SECRET\n",
        isSample: false,
      },
      {
        input: `ARG GITHUB_TOKEN
RUN echo "building"
`,
        expectedOutput: "VERDICT: SAFE\nREASON: NO_SECRET\n",
        isSample: false,
      },
      {
        input: `IGNORE secrets/
COPY secrets/db.pem
`,
        expectedOutput: "VERDICT: SAFE\nREASON: NO_SECRET\n",
        isSample: false,
      },
    ],
    referencePython: SECRET_LEAK_PY,
  },
];
