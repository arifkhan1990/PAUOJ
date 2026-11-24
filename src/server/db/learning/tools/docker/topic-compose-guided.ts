import type { SeedProblem } from "../../../seed-problems";

const COMPOSE_START_PY = `import sys
import heapq

raw = sys.stdin.read().splitlines()
position = 0
count = int(raw[position].strip())
position += 1
services = {}
for _ in range(count):
    name = raw[position].split(maxsplit=1)[1].strip()
    position += 1
    deps = []
    while position < len(raw) and not raw[position].startswith("HEALTH "):
        parts = raw[position].split()
        deps.append((parts[1], parts[2]))
        position += 1
    ready = int(raw[position].split()[1])
    position += 1
    services[name] = {"deps": deps, "ready": ready}

indegree = {name: 0 for name in services}
children = {name: [] for name in services}
for name, data in services.items():
    for dep, _mode in data["deps"]:
        indegree[name] += 1
        children[dep].append(name)

heap = [name for name in services if indegree[name] == 0]
heapq.heapify(heap)
order = []
start = {}
while heap:
    name = heapq.heappop(heap)
    order.append(name)
    moment = 0
    for dep, mode in services[name]["deps"]:
        if mode == "healthy":
            moment = max(moment, start[dep] + services[dep]["ready"])
        else:
            moment = max(moment, start[dep])
    start[name] = moment
    for child in children[name]:
        indegree[child] -= 1
        if indegree[child] == 0:
            heapq.heappush(heap, child)

if len(order) < len(services):
    placed = set(order)
    blocked = sorted(name for name in services if name not in placed)
    print("BLOCKED: " + " ".join(blocked))
    print("TIME: -1")
else:
    total = max(start[name] + services[name]["ready"] for name in services)
    print("ORDER: " + " ".join(order))
    print("TIME: " + str(total))
`;

const MULTISTAGE_PY = `import sys

raw = sys.stdin.read().splitlines()
count = int(raw[0].strip())
position = 1
stages = []
for _ in range(count):
    name = raw[position].split(maxsplit=1)[1].strip()
    position += 1
    files = set()
    while position < len(raw) and not raw[position].startswith("STAGE "):
        parts = raw[position].split()
        position += 1
        if parts[0] == "ADD":
            files.add(parts[1])
        else:
            source, item = parts[1], parts[2]
            available = None
            for stage_name, stage_files in stages:
                if stage_name == source:
                    available = stage_files
            if available is None or item not in available:
                print("ERROR: " + source + " has no " + item)
                sys.exit()
            files.add(item)
    stages.append((name, files))

final_name, final_files = stages[-1]
print("FINAL: " + final_name)
print("FILES: " + (" ".join(sorted(final_files)) if final_files else "none"))
`;

export const COMPOSE_GUIDED_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-docker-compose-start",
    title: "Start Services in the Right Order",
    statement: `শুক্রবারের ডেমোতে \`docker compose up\` চালানোর পর \`api\` কনটেইনার বারবার রিস্টার্ট হচ্ছে, কারণ \`db\` তখনও initialization শেষ করেনি। মাহিন বলল, \`depends_on\`-এ শুধু সার্ভিসের নাম লিখলে Compose কনটেইনার "চালু" হওয়ার অপেক্ষা করে, "প্রস্তুত" হওয়ার নয়। নুসরাত এখন প্রতিটি সার্ভিসের নির্ভরতা আর healthcheck-এর সময় দেখে বৈধ স্টার্টআপ ক্রম আর পুরো সিস্টেম প্রস্তুত হতে কত সময় লাগবে বের করছে।

মডেল: সব সার্ভিস \`t = 0\`-এ একসাথে শুরু করার চেষ্টা করে। \`started\` নির্ভরতা মানে নির্ভরশীল সার্ভিসটা চালু হলেই হবে; \`healthy\` নির্ভরতা মানে তার healthcheck পাস করা পর্যন্ত অপেক্ষা। একটা সার্ভিসের শুরুর সময় = তার নির্ভরতাগুলোর দাবির মধ্যে সবচেয়ে দেরিটা: \`started\`-এর জন্য নির্ভরতার শুরুর সময়, \`healthy\`-এর জন্য নির্ভরতার শুরুর সময় + নির্ভরতার \`HEALTH\`। মোট সময় = সব সার্ভিসের (শুরুর সময় + নিজের \`HEALTH\`) এর সর্বোচ্চ।`,
    inputFormat: `প্রথম লাইনে \`S\` — সার্ভিস সংখ্যা। প্রতি সার্ভিসের জন্য একটা \`SERVICE <নাম>\` লাইন, তারপর শূন্য বা তার বেশি \`DEPENDS <সার্ভিস> <healthy|started>\` লাইন, শেষে একটা \`HEALTH <সেকেন্ড>\` লাইন।`,
    outputFormat: `বৈধ ক্রম থাকলে প্রথম লাইনে \`ORDER:\` এরপর lexicographically সবচেয়ে ছোট টপোলজিক্যাল ক্রম, দ্বিতীয় লাইনে \`TIME:\` এরপর মোট সেকেন্ড। সাইকেল থাকলে প্রথম লাইনে \`BLOCKED:\` এরপর আটকে থাকা সার্ভিসগুলোর নাম lexicographic ক্রমে, দ্বিতীয় লাইনে \`TIME: -1\`।`,
    constraints: `\`1 <= S <= 10\`, \`0 <= HEALTH <= 100\`
প্রতিটি \`DEPENDS\` আগে ঘোষিত না হলেও চলবে, শুধু নামটা অবশ্যই কোনো \`SERVICE\` হতে হবে; একই জোড়া দুইবার আসবে না।`,
    editorial: `## ধারণা
Compose-এ \`depends_on\` দুই রকম অর্থ বহন করে। প্লেইন তালিকা মানে "কনটেইনার শুরু হয়েছে" — প্রসেস চালু হয়েছে, কিন্তু ডেটাবেস হয়তো তখনও রিকভারি করছে। \`condition: service_healthy\` মানে healthcheck পাস করা পর্যন্ত অপেক্ষা। এই পার্থক্যটাই সবচেয়ে বড় ফাঁদ: db চালু হওয়ামাত্র api উঠে গেলে প্রথম কয়েকটা রিকোয়েস্ট ব্যর্থ হয়, আর orchestrator api-কে আবার রিস্টার্ট করে। তাই প্রোডাকশনে সত্যিকারের প্রস্তুতির জন্য \`service_healthy\` দরকার, আর তার সাথে db-এর healthcheck নিজেও নির্ভরযোগ্য হতে হবে। ক্রম বের করতে এটা টপোলজিক্যাল সর্ট, আর সময় বের করতে একই ক্রমে একটা ছোট DP।

## ধাপে ধাপে
1. প্রতি সার্ভিসের নির্ভরতা আর \`HEALTH\` পড়ো।
2. indegree গুনে যেগুলো শূন্য সেগুলো একটা মিন-হিপে রাখো — এতে lexicographically ছোট নাম আগে আসে।
3. হিপ থেকে একটা নাম তোলো, তার শুরুর সময় বের করো: প্রতিটি নির্ভরতার জন্য দরকারি সময় নিয়ে সর্বোচ্চ।
4. তার সন্তানদের indegree কমাও; শূন্য হলে হিপে ঢোকাও।
5. হিপ শেষে সব সার্ভিস বেরোলে \`max(start + HEALTH)\` ছাপো; নাহলে বাকিগুলো সাইকেলে, \`BLOCKED\` ছাপো।

\`\`\`python
${COMPOSE_START_PY}\`\`\`

## কমপ্লেক্সিটি
সময় \`O((S + E) log S)\`, মেমোরি \`O(S + E)\`; \`E\` নির্ভরতার সংখ্যা।

## সাধারণ ভুল
- প্লেইন \`depends_on\`-কে "প্রস্তুত" ধরে নেওয়া — শুধু চালু হওয়া বোঝায়।
- \`started\` নির্ভরতাতেও \`HEALTH\` যোগ করা — তখন সময় বেশি দেখায়, অথচ কনটেইনার শুরু হওয়াই যথেষ্ট।
- সাইকেল থাকলে আংশিক ক্রম ছাপানো — সাইকেলে কোনো বৈধ ক্রমই নেই, \`BLOCKED\` দরকার।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Docker Compose", "DevOps", "Topological Sort"],
    tests: [
      {
        input: `3
SERVICE api
DEPENDS db healthy
HEALTH 5
SERVICE db
HEALTH 3
SERVICE worker
DEPENDS db started
HEALTH 2
`,
        expectedOutput: "ORDER: db api worker\nTIME: 8\n",
        isSample: true,
      },
      {
        input: `3
SERVICE api
DEPENDS db started
HEALTH 4
SERVICE db
HEALTH 6
SERVICE cache
HEALTH 1
`,
        expectedOutput: "ORDER: cache db api\nTIME: 6\n",
        isSample: true,
      },
      {
        input: `2
SERVICE a
DEPENDS b healthy
HEALTH 1
SERVICE b
DEPENDS a started
HEALTH 1
`,
        expectedOutput: "BLOCKED: a b\nTIME: -1\n",
        isSample: false,
      },
      {
        input: `3
SERVICE api
DEPENDS db healthy
HEALTH 2
SERVICE db
HEALTH 4
SERVICE worker
DEPENDS api healthy
HEALTH 1
`,
        expectedOutput: "ORDER: db api worker\nTIME: 7\n",
        isSample: false,
      },
      {
        input: `4
SERVICE api
DEPENDS db healthy
DEPENDS cache started
HEALTH 2
SERVICE db
HEALTH 4
SERVICE cache
HEALTH 1
SERVICE worker
DEPENDS api healthy
HEALTH 3
`,
        expectedOutput: "ORDER: cache db api worker\nTIME: 9\n",
        isSample: false,
      },
      {
        input: `2
SERVICE web
HEALTH 3
SERVICE db
HEALTH 1
`,
        expectedOutput: "ORDER: db web\nTIME: 3\n",
        isSample: false,
      },
    ],
    referencePython: COMPOSE_START_PY,
  },
  {
    slug: "learn-docker-multistage",
    title: "What Reaches the Final Stage",
    statement: `তাসনিম কোড রিভিউতে দেখল ফাইনাল ইমেজে টেস্ট কভারেজ রিপোর্ট আর সোর্স ম্যাপও ঢুকে গেছে। নুসরাতের মাল্টি-স্টেজ Dockerfile-এ \`COPY --from\` দিয়ে স্টেজ থেকে স্টেজে ফাইল যাচ্ছে, কিন্তু কোন ফাইল আসলে ফাইনাল ইমেজে পৌঁছায় সেটা কেউ যাচাই করেনি। এখন স্টেজগুলোর \`ADD\` আর \`COPY\` দেখে ফাইনাল ইমেজে থাকা ফাইলের তালিকা বের করো।

নিয়ম: শেষ \`STAGE\`-টাই ফাইনাল। \`ADD <ফাইল>\` মানে ওই স্টেজে ফাইলটা তৈরি হয়। \`COPY <সোর্স-স্টেজ> <ফাইল>\` মানে ওই আগের স্টেজ থেকে ফাইলটা কপি হয়; সোর্স স্টেজে ফাইলটা না থাকলে বিল্ডই ফেল করে। ফাইল নামগুলোর মধ্যেই ফোল্ডার-পাথ থাকতে পারে, যেমন \`dist/app.js\`।`,
    inputFormat: `প্রথম লাইনে \`S\` — স্টেজ সংখ্যা। প্রতি স্টেজে একটা \`STAGE <নাম>\` লাইন, তারপর শূন্য বা তার বেশি \`ADD <ফাইল>\` বা \`COPY <সোর্স-স্টেজ> <ফাইল>\` লাইন।`,
    outputFormat: `সফল হলে প্রথম লাইনে \`FINAL:\` এরপর শেষ স্টেজের নাম, দ্বিতীয় লাইনে \`FILES:\` এরপর ফাইনাল ইমেজের ফাইল lexicographic ক্রমে (কিছু না থাকলে \`none\`)। কোনো \`COPY\` সোর্স স্টেজে ফাইল না পেলে এক লাইনে \`ERROR: <স্টেজ> has no <ফাইল>\`।`,
    constraints: `\`1 <= S <= 6\`, প্রতি স্টেজে ০ থেকে ১০ লাইন
প্রতিটি \`COPY\` আগের কোনো স্টেজকেই দেখায়; ফাইলের নামে স্পেস নেই।`,
    editorial: `## ধারণা
মাল্টি-স্টেজ বিল্ডে প্রতিটি স্টেজ আলাদা ফাইলসিস্টেম, আর \`COPY --from\` দিয়ে কেবল বেছে নেওয়া জিনিসটুকুই এক স্টেজ থেকে আরেকটায় আসে। ফাইনাল ইমেজে থাকে শেষ স্টেজের নিজের \`ADD\` করা ফাইল আর তার \`COPY --from\`-এ আনা ফাইল। তাই বিল্ড স্টেজে \`dist/app.js\` তৈরি করে ফাইনালে \`COPY --from=build dist/app.js\` লিখলে ঠিকই আসে; কিন্তু ভুল পাথ লিখলে বিল্ড ফেলে, কারণ ফাইলটা ওই স্টেজে নেই। এখানে সেটাই যাচাই করা হচ্ছে — কোন ফাইল কোথায় তৈরি হয় আর কোনটা কোথায় পৌঁছায়।

## ধাপে ধাপে
1. স্টেজগুলো ক্রমে পড়ো; প্রতি স্টেজের জন্য একটা ফাইলের সেট রাখো।
2. \`ADD\` দেখলে ফাইলটা সেটে যোগ করো।
3. \`COPY\` দেখলে আগের স্টেজগুলোর মধ্যে সোর্স খোঁজো; ফাইলটা সেখানে না থাকলে \`ERROR\` লাইন ছাপিয়ে থামো।
4. ফাইল থাকলে বর্তমান স্টেজের সেটে যোগ করো — একই ফাইল দুইবার কপি হলেও একবারই থাকে।
5. শেষ স্টেজের নাম আর সাজানো ফাইল-তালিকা ছাপো।

\`\`\`python
${MULTISTAGE_PY}\`\`\`

## কমপ্লেক্সিটি
সময় \`O(L * S)\` (প্রতি \`COPY\`-তে স্টেজ খোঁজা), মেমোরি \`O(L)\`; \`L\` মোট লাইন।

## সাধারণ ভুল
- \`COPY --from\`-এর সোর্স স্টেজে ফাইলটা আদৌ তৈরি হয় কি না না দেখা — বিল্ড তখনই ফেল করে, রানটাইমে নয়।
- টেস্ট স্টেজে তৈরি কভারেজ ফাইল ফাইনাল স্টেজে কপি করে ফেলা — ইমেজ বড় হয়, দরকার নেই।
- ফাইল-তালিকায় ডুপ্লিকেট রাখা — একই ফাইল দুইবার কপি হলেও ফাইনাল ইমেজে একটাই থাকে।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Docker", "Multi-stage Build", "DevOps"],
    tests: [
      {
        input: `4
STAGE deps
ADD package.json
ADD node_modules
STAGE build
COPY deps package.json
ADD dist/app.js
ADD dist/app.js.map
STAGE test
COPY build dist/app.js
ADD coverage
STAGE runtime
COPY build dist/app.js
ADD entrypoint.sh
`,
        expectedOutput: "FINAL: runtime\nFILES: dist/app.js entrypoint.sh\n",
        isSample: true,
      },
      {
        input: `3
STAGE build
ADD dist/app.js
STAGE runtime
COPY build dist/app.js
COPY build dist/app.js.map
`,
        expectedOutput: "ERROR: build has no dist/app.js.map\n",
        isSample: true,
      },
      {
        input: `3
STAGE base
ADD config.json
STAGE build
COPY base config.json
ADD dist/app.js
ADD dist/app.js.map
STAGE runtime
COPY build config.json
COPY build dist/app.js
`,
        expectedOutput: "FINAL: runtime\nFILES: config.json dist/app.js\n",
        isSample: false,
      },
      {
        input: `2
STAGE build
ADD dist/app.js
STAGE runtime
COPY build dist/app.js
COPY build dist/app.js
`,
        expectedOutput: "FINAL: runtime\nFILES: dist/app.js\n",
        isSample: false,
      },
      {
        input: `1
STAGE app
ADD server.py
ADD requirements.txt
`,
        expectedOutput: "FINAL: app\nFILES: requirements.txt server.py\n",
        isSample: false,
      },
      {
        input: `2
STAGE build
ADD dist/app.js
STAGE runtime
`,
        expectedOutput: "FINAL: runtime\nFILES: none\n",
        isSample: false,
      },
    ],
    referencePython: MULTISTAGE_PY,
  },
];
