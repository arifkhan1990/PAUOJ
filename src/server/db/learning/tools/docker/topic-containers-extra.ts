import type { SeedProblem } from "../../../seed-problems";

const BUILD_CONTEXT_PY = `import sys

def ignored(path, patterns):
    base = path.rsplit("/", 1)[-1]
    for pattern in patterns:
        if pattern.endswith("/"):
            directory = pattern[:-1]
            if path == directory or path.startswith(directory + "/"):
                return True
        elif pattern.startswith("*"):
            if base.endswith(pattern[1:]):
                return True
        elif path == pattern:
            return True
    return False

raw = sys.stdin.read().splitlines()
position = 0
count = int(raw[position].strip())
position += 1
files = []
for _ in range(count):
    name, size = raw[position].rsplit(" ", 1)
    files.append((name, int(size)))
    position += 1
pattern_count = int(raw[position].strip())
position += 1
patterns = [raw[position + k].strip() for k in range(pattern_count)]

sent = [(name, size) for name, size in files if not ignored(name, patterns)]
total = sum(size for _name, size in sent)
print("SENT " + str(len(sent)) + " " + str(total))
print("FILES: " + (" ".join(sorted(name for name, _size in sent)) if sent else "none"))
`;

const RUNTIME_CONFIG_PY = `import sys

tokens = sys.stdin.read().split()
host_port = None
container_port = None
env = []
volume = "none"
user = None
read_only = False
index = 0
while index < len(tokens):
    token = tokens[index]
    if token in ("-p", "--publish"):
        spec = tokens[index + 1]
        pair = spec.split(":")
        host_port = pair[0]
        container_port = pair[1]
        index += 2
    elif token in ("-e", "--env"):
        env.append(tokens[index + 1])
        index += 2
    elif token in ("-v", "--volume"):
        volume = tokens[index + 1]
        index += 2
    elif token == "--user":
        user = tokens[index + 1]
        index += 2
    elif token == "--read-only":
        read_only = True
        index += 1
    else:
        index += 1

env.sort(key=lambda item: item.split("=", 1)[0])
root = user is None or user in ("0", "0:0", "root") or user.startswith("0:")

print("HOST_PORT: " + str(host_port))
print("CONTAINER_PORT: " + str(container_port))
print("ENV: " + (" ".join(env) if env else "none"))
print("VOLUME: " + volume)
print("USER: " + (user if user is not None else "image-default"))
print("ROOT: " + ("yes" if root else "no"))
print("READ_ONLY: " + ("yes" if read_only else "no"))
`;

export const CONTAINERS_EXTRA_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-docker-build-context",
    title: "Trim the Build Context",
    statement: `তাসনিমের অভিযোগ, CI-তে প্রতিটি বিল্ডে প্রায় দুই GB build context আপলোড হয়, অথচ অ্যাপের দরকার কয়েকশো কিলোবাইট। নুসরাত দেখল \`node_modules\`, লোগ আর লোকাল \`.env\` — সব context-এ ঢুকে পড়ছে। \`.dockerignore\` ঠিকমতো লিখলে কী কী ফাইল বাদ পড়ে, সেটাই এখন বের করতে হবে।

নিয়ম: প্যাটার্ন context root থেকে হিসাব হয়। \`dir/\` প্যাটার্ন ওই ডিরেক্টরি আর তার ভেতরের সব পাথ বাদ দেয়। \`*.ext\` প্যাটার্ন ফাইলের নাম ওই এক্সটেনশনে শেষ হলে বাদ দেয়। অন্য প্যাটার্ন শুধু হুবহু ওই পাথটাই বাদ দেয়, অন্য ডিরেক্টরির একই নামের ফাইল নয়। প্যাটার্নগুলো একসাথে প্রয়োগ হয়; কোনোটা মিললেই ফাইল বাদ পড়ে।`,
    inputFormat: `প্রথম লাইনে \`F\` — context-এর ফাইল সংখ্যা। পরের \`F\` লাইনে \`<পাথ> <সাইজ>\`, সাইজ বাইটে। এরপর \`D\` — প্যাটার্ন সংখ্যা, পরের \`D\` লাইনে একটা একটা প্যাটার্ন; \`D\` শূন্যও হতে পারে।`,
    outputFormat: `প্রথম লাইনে \`SENT <ফাইল-সংখ্যা> <মোট-সাইজ>\`। দ্বিতীয় লাইনে \`FILES:\` এরপর বাদ না পড়া পাথ lexicographic ক্রমে, স্পেস দিয়ে আলাদা; কিছু না থাকলে \`FILES: none\`।`,
    constraints: `\`1 <= F <= 50\`, \`0 <= D <= 10\`, প্রতিটি সাইজ \`0 <= size <= 1000000\`
পাথে স্পেস নেই, প্যাটার্নে \`*\` কেবল শুরুতে থাকতে পারে।`,
    editorial: `## ধারণা
Build context মানে ক্লায়েন্ট থেকে Docker ডেমনে পাঠানো ফাইলের সেট। \`.dockerignore\` সেই সেট ছাঁটে, আর প্যাটার্নগুলো context root-এর সাপেক্ষে মেলে। তাই \`node_modules/\` শুধু root-এর \`node_modules\` বাদ দেয়; \`apps/web/node_modules\` বাদ পড়ে না। Context ছোট হলে আপলোড দ্রুত হয়, \`COPY . .\` কম ফাইল নেয়, আর ভুলে \`.env\` বা \`.git\` ইমেজে ঢোকার ঝুঁকিও কমে। তবে সিক্রেট সুরক্ষার আসল নিয়ম একটাই — সিক্রেট কখনো context-এ রাখা যায় না, \`.dockerignore\` শুধু দুর্ঘটনা আটকায়।

## ধাপে ধাপে
1. ফাইল তালিকা আর প্যাটার্ন তালিকা পড়ো।
2. প্রতিটি ফাইলের জন্য প্যাটার্নগুলো একে একে দেখো।
3. প্যাটার্ন \`dir/\` হলে পাথ \`dir\` বা \`dir/...\` মিললেই বাদ। \`*\` দিয়ে শুরু হলে ফাইলের নাম শেষ মিললেই বাদ। নাহলে হুবহু পাথ মিললেই বাদ।
4. বাদ না পড়া ফাইলগুলোর সংখ্যা ও সাইজের যোগফল ছাপো।
5. পাথগুলো সাজিয়ে \`FILES:\` লাইনে ছাপো, কিছু না থাকলে \`none\`।

\`\`\`python
${BUILD_CONTEXT_PY}\`\`\`

## কমপ্লেক্সিটি
সময় \`O(F * D)\`, মেমোরি \`O(F)\`।

## সাধারণ ভুল
- স্ল্যাশ ছাড়া \`node_modules\` লিখে সব ডিরেক্টরির ওটা বাদ যাবে ভাবা — root-relative মিললে শুধু root-এরটা বাদ পড়ে।
- \`*.log\` আর \`logs/\` গুলিয়ে ফেলা — একটা নামের শেষ দেখে, অন্যটা ডিরেক্টরি-প্রিফিক্স দেখে।
- ফাইলের নামের বদলে পাথের শেষে \`*\` বসিয়ে দেওয়া — এখানে \`*\` কেবল শুরুতে বৈধ।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Docker", "Containers", "Build Context"],
    tests: [
      {
        input: `5
src/app.ts 1200
src/app.ts.map 800
node_modules/react/index.js 30000
README.md 300
logs/app.log 500
3
node_modules/
*.map
*.log
`,
        expectedOutput: "SENT 2 1500\nFILES: README.md src/app.ts\n",
        isSample: true,
      },
      {
        input: `3
src/index.ts 900
pnpm-lock.yaml 5000
dist/bundle.js 12000
0
`,
        expectedOutput: "SENT 3 17900\nFILES: dist/bundle.js pnpm-lock.yaml src/index.ts\n",
        isSample: true,
      },
      {
        input: `2
logs/app.log 500
logs/old/app.log 400
1
logs/
`,
        expectedOutput: "SENT 0 0\nFILES: none\n",
        isSample: false,
      },
      {
        input: `4
src/index.ts 900
pnpm-lock.yaml 5000
dist/bundle.js 12000
dist/assets/logo.png 3000
2
dist/
*.yaml
`,
        expectedOutput: "SENT 1 900\nFILES: src/index.ts\n",
        isSample: false,
      },
      {
        input: `2
node_modules/react/index.js 4000
apps/web/node_modules/vue.js 3000
1
node_modules/
`,
        expectedOutput: "SENT 1 3000\nFILES: apps/web/node_modules/vue.js\n",
        isSample: false,
      },
      {
        input: `2
secret.txt 10
src/secret.txt 20
1
secret.txt
`,
        expectedOutput: "SENT 1 20\nFILES: src/secret.txt\n",
        isSample: false,
      },
    ],
    referencePython: BUILD_CONTEXT_PY,
  },
  {
    slug: "learn-docker-runtime-config",
    title: "Read the Run Command",
    statement: `শুক্রবার রাতে স্টেজিংয়ে \`api\` কনটেইনার খুলছে না। নুসরাত দেখল \`docker run\`-এর পোর্ট ম্যাপিং আর ভলিউম পাথ ভুল, কনটেইনারটা root হিসেবেই চলছে, আর \`--read-only\`-ও দেওয়া নেই। তাসনিম বলল, ডিপ্লয় স্ক্রিপ্ট রিভিউ করার আগে কমান্ড লাইনটা ঠিকমতো পড়তে শেখা দরকার। এখন একটা \`docker run\` কমান্ড পড়ে পোর্ট, env, ভলিউম, ইউজার আর read-only অবস্থা বের করো।

পোর্ট থাকে \`-p host:container\` আকারে, env \`-e KEY=VALUE\`, ভলিউম \`-v host:container\`। \`--user\` না থাকলে ইমেজের ডিফল্ট ইউজার ধরা হয়, আর মান \`root\`, \`0\`, \`0:0\` বা \`0:\` দিয়ে শুরু হলে কনটেইনার root হিসেবে চলে। \`--read-only\` থাকলে রুট ফাইলসিস্টেম read-only।`,
    inputFormat: `এক লাইনে পুরো \`docker run\` কমান্ড, স্পেস দিয়ে আলাদা করা টোকেনে। ঠিক একটা \`-p\` থাকে; \`-e\`, \`-v\`, \`--user\`, \`--read-only\` শূন্য বা তার বেশি বার থাকতে পারে।`,
    outputFormat: `সাত লাইন, ক্রমে: \`HOST_PORT:\`, \`CONTAINER_PORT:\`, \`ENV:\` (কী অনুযায়ী সাজানো, স্পেস দিয়ে আলাদা; কিছু না থাকলে \`none\`), \`VOLUME:\` (না থাকলে \`none\`), \`USER:\` (না থাকলে \`image-default\`), \`ROOT: yes|no\`, \`READ_ONLY: yes|no\`।`,
    constraints: `কমান্ডের দৈর্ঘ্য ১ থেকে ৪০ টোকেন
পোর্ট সবসময় \`host:container\` আকারে, ভলিউম \`host:container\` আকারে; কোনো মোড-সাফিক্স নেই।`,
    editorial: `## ধারণা
\`docker run\`-এর ফ্ল্যাগ আর ইমেজের \`EXPOSE\` — দুটো আলাদা জিনিস। \`EXPOSE 80\` শুধু মেটাডেটা, হোস্টে পোর্ট খোলে না; বাইরে থেকে ঢুকতে \`-p host:container\` লাগে। \`-e\` প্রসেসের পরিবেশে মান বসায়, কিন্তু ইমেজের \`ENV\`-এর মতো সেটা ইমেজের ভেতরে লেখা থাকে না। \`--user\` দিলে প্রসেস ওই UID/GID-তে চলে; না দিলে ইমেজের ডিফল্ট, আর বেশিরভাগ বেস ইমেজে সেটা root — তখন অ্যাপ থেকে কনটেইনার ফাইলসিস্টেমে লেখার সুযোগ বেড়ে যায়। \`--read-only\` রুট ফাইলসিস্টেম লেখা বন্ধ করে, তবে \`-v\` দিয়ে মাউন্ট করা পাথ আলাদা এবং লেখার যোগ্য থাকে।

## ধাপে ধাপে
1. লাইনটা শব্দে ভাগ করো।
2. টোকেন ধরে ধরে দেখো: \`-p\` হলে পরের টোকেন \`host:container\`, \`-e\` হলে পরেরটা env, \`-v\` হলে পরেরটা ভলিউম।
3. \`--user\` হলে পরের টোকেন ইউজার; \`--read-only\` দেখলেই read-only হ্যাঁ।
4. env-গুলো কী দিয়ে সাজিয়ে এক লাইনে ছাপো।
5. ইউজার না থাকলে বা root-নির্দেশক হলে \`ROOT: yes\`, নাহলে \`no\`।

\`\`\`python
${RUNTIME_CONFIG_PY}\`\`\`

## কমপ্লেক্সিটি
সময় \`O(t)\`, টোকেন সংখ্যা \`t\`; মেমোরি \`O(e)\`, env সংখ্যা \`e\`।

## সাধারণ ভুল
- \`EXPOSE 80\` দেখে ধরে নেওয়া হোস্টে পোর্ট খুলে গেছে — খোলে না, \`-p\` লাগে।
- \`-p 8080:80\`-এ পোর্ট উল্টে ফেলা — বাঁ দিকটা হোস্ট, ডান দিকটা কনটেইনার।
- \`--user 1001:1001\` আর \`--user\` না থাকা — এক নয়; দ্বিতীয়টায় root চলতে পারে।
- \`--read-only\` দিলেই সব লেখা বন্ধ ভাবা — \`-v\` ভলিউম তখনও লেখার যোগ্য।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Docker", "Containers", "Runtime"],
    tests: [
      {
        input: `docker run -d --name api -p 8080:80 -e NODE_ENV=production -e LOG_LEVEL=info -v /srv/data:/app/data --user 1001:1001 --read-only registry.local/api:1.4
`,
        expectedOutput: `HOST_PORT: 8080
CONTAINER_PORT: 80
ENV: LOG_LEVEL=info NODE_ENV=production
VOLUME: /srv/data:/app/data
USER: 1001:1001
ROOT: no
READ_ONLY: yes
`,
        isSample: true,
      },
      {
        input: `docker run -p 3000:3000 -e TZ=Asia/Dhaka app:2
`,
        expectedOutput: `HOST_PORT: 3000
CONTAINER_PORT: 3000
ENV: TZ=Asia/Dhaka
VOLUME: none
USER: image-default
ROOT: yes
READ_ONLY: no
`,
        isSample: true,
      },
      {
        input: `docker run -p 5432:5432 -v /var/lib/pg:/var/lib/postgresql/data postgres:17
`,
        expectedOutput: `HOST_PORT: 5432
CONTAINER_PORT: 5432
ENV: none
VOLUME: /var/lib/pg:/var/lib/postgresql/data
USER: image-default
ROOT: yes
READ_ONLY: no
`,
        isSample: false,
      },
      {
        input: `docker run --rm -p 9000:9000 -e B=2 -e A=1 --user node --read-only app:3
`,
        expectedOutput: `HOST_PORT: 9000
CONTAINER_PORT: 9000
ENV: A=1 B=2
VOLUME: none
USER: node
ROOT: no
READ_ONLY: yes
`,
        isSample: false,
      },
      {
        input: `docker run -p 4000:4000 --user 0:0 app:4
`,
        expectedOutput: `HOST_PORT: 4000
CONTAINER_PORT: 4000
ENV: none
VOLUME: none
USER: 0:0
ROOT: yes
READ_ONLY: no
`,
        isSample: false,
      },
      {
        input: `docker run -p 5000:5000 --user root app:5
`,
        expectedOutput: `HOST_PORT: 5000
CONTAINER_PORT: 5000
ENV: none
VOLUME: none
USER: root
ROOT: yes
READ_ONLY: no
`,
        isSample: false,
      },
    ],
    referencePython: RUNTIME_CONFIG_PY,
  },
];
