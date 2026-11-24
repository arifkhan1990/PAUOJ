import type { SeedProblem } from "../../../seed-problems";

const CHECK_PIPELINE_PY = `import sys
import heapq

raw = [line.strip() for line in sys.stdin.read().splitlines() if line.strip()]
position = 0
jobs = []
needs = {}
matrix_job = ""
matrix = []
patterns = []
changed = []
template = ""
fail_job = "none"
fail_fast = False
branch = tag = branch_rule = tag_rule = ""
approvals = required_approvals = 0
deploy_job = ""

while position < len(raw):
    parts = raw[position].split()
    key = parts[0]
    if key == "JOBS":
        count = int(parts[1])
        position += 1
        for k in range(count):
            items = raw[position + k].split()
            name = items[0]
            jobs.append(name)
            needs[name] = [] if items[1] == "-" else items[1:]
        position += count
    elif key == "MATRIX_JOB":
        matrix_job = parts[1]
        position += 1
    elif key == "MATRIX":
        count = int(parts[1])
        position += 1
        for k in range(count):
            os_name, lang = raw[position + k].split()
            matrix.append((os_name, lang))
        position += count
    elif key == "FILTER":
        count = int(parts[1])
        position += 1
        patterns = [raw[position + k] for k in range(count)]
        position += count
    elif key == "CHANGED":
        count = int(parts[1])
        position += 1
        changed = [raw[position + k] for k in range(count)]
        position += count
    elif key == "CACHE_KEY":
        template = parts[1]
        position += 1
    elif key == "FAIL":
        fail_job = parts[1]
        position += 1
    elif key == "FAIL_FAST":
        fail_fast = parts[1] == "yes"
        position += 1
    elif key == "BRANCH":
        branch = parts[1]
        position += 1
    elif key == "TAG":
        tag = parts[1]
        position += 1
    elif key == "BRANCH_RULE":
        branch_rule = parts[1]
        position += 1
    elif key == "TAG_RULE":
        tag_rule = parts[1]
        position += 1
    elif key == "APPROVALS":
        approvals = int(parts[1])
        position += 1
    elif key == "APPROVALS_REQUIRED":
        required_approvals = int(parts[1])
        position += 1
    elif key == "DEPLOY_JOB":
        deploy_job = parts[1]
        position += 1
    else:
        position += 1

indegree = {name: len(needs[name]) for name in jobs}
children = {name: [] for name in jobs}
for name in jobs:
    for dep in needs[name]:
        children[dep].append(name)

heap = [name for name in jobs if indegree[name] == 0]
heapq.heapify(heap)
order = []
while heap:
    name = heapq.heappop(heap)
    order.append(name)
    for child in children[name]:
        indegree[child] -= 1
        if indegree[child] == 0:
            heapq.heappush(heap, child)

def covers(pattern, path):
    if pattern == "**":
        return True
    if pattern.endswith("/**"):
        prefix = pattern[:-3]
        return path == prefix or path.startswith(prefix + "/")
    return pattern == path

run_workflow = any(covers(pattern, path) for pattern in patterns for path in changed)

executed = order
if fail_job != "none" and fail_fast:
    executed = order[:order.index(fail_job) + 1]

runs = 0
cache_hits = 0
seen = set()
if run_workflow:
    for name in executed:
        if name == matrix_job:
            runs += len(matrix)
            for os_name, lang in matrix:
                resolved = template.replace("{os}", os_name).replace("{lang}", lang)
                if resolved in seen:
                    cache_hits += 1
                else:
                    seen.add(resolved)
        else:
            runs += 1

gate = True
if branch_rule not in ("none", "*") and branch != branch_rule:
    gate = False
if tag_rule != "none":
    if tag == "none":
        gate = False
    elif tag_rule.endswith("*"):
        if not tag.startswith(tag_rule[:-1]):
            gate = False
    elif tag != tag_rule:
        gate = False
if approvals < required_approvals:
    gate = False

deploy = (
    run_workflow
    and fail_job == "none"
    and deploy_job in executed
    and gate
)

print("ORDER: " + " ".join(order))
print("RUNS: " + str(runs))
print("CACHE_HITS: " + str(cache_hits))
print("DEPLOY: " + ("yes" if deploy else "no"))
`;

export const CHECKPOINT_PIPELINE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-docker-check-pipeline",
    title: "Checkpoint: Ship the Pipeline",
    statement: `রবিবার রাত ১১টায় তাসনিমের টিমের রিলিজ পাইপলাইন সর্বশেষ অবস্থায় চলবে কি না সেটা যাচাই করতে হবে। pipeline-এ জব আর \`needs\`, একটা matrix জব, path filter, cache key আর protected environment-এর গেট — সব আছে। নুসরাত এখন পুরো কনফিগ পড়ে বলবে জবগুলো কোন ক্রমে চলবে, আসলে কতগুলো জব-রান হবে, কতগুলো matrix জব cache পাবে, আর শেষে ডিপ্লয় হবে কি না।

মডেল: \`needs\` থেকে lexicographically সবচেয়ে ছোট টপোলজিক্যাল ক্রম। path filter না মিললে কিছুই চলে না। matrix জবের প্রতিটি combo আলাদা রান; cache key-তে \`{os}\`/\`{lang}\` বসিয়ে আগে দেখা key আবার এলে সেটা hit। \`FAIL\`-এ নাম থাকা জব ফেল করে; fail-fast চালু থাকলে ক্রমে তার পরের জবগুলো বাতিল হয়। \`ORDER\` সবসময় পুরো বৈধ টপোলজিক্যাল ক্রম দেখায়; fail-fast শুধু \`RUNS\` কমায়। ডিপ্লয় তখনই হয় যখন workflow চলে, কোনো জব ফেল করে না, deploy জব বাতিল হয়নি, আর ব্রাঞ্চ/ট্যাগ নিয়ম ও অনুমোদন সব মেলে।`,
    inputFormat: `ক্রমে \`JOBS <n>\` ও \`n\`টা \`<নাম> <নির্ভরতা...|->\`, \`MATRIX_JOB <নাম>\`, \`MATRIX <m>\` ও \`m\`টা \`<os> <lang>\`, \`FILTER <f>\` ও \`f\`টা গ্লোব, \`CHANGED <c>\` ও \`c\`টা পাথ, \`CACHE_KEY <টেমপ্লেট>\`, \`FAIL <জব|none>\`, \`FAIL_FAST <yes|no>\`, \`BRANCH\`, \`TAG\`, \`BRANCH_RULE\`, \`TAG_RULE\`, \`APPROVALS <n>\`, \`APPROVALS_REQUIRED <n>\`, \`DEPLOY_JOB <নাম>\`।`,
    outputFormat: `চার লাইন: \`ORDER:\`, \`RUNS:\` (আসলে চলা জব-রান, matrix ভেঙে), \`CACHE_HITS:\` (cache পাওয়া matrix রান), \`DEPLOY: yes|no\`।`,
    constraints: `\`1 <= n <= 8\`, \`1 <= m <= 6\`, \`0 <= c <= 6\`
\`FAIL\` নামে matrix জব বা deploy জব আসে না; \`needs\` সাইকেলমুক্ত।`,
    editorial: `## ধারণা
একটা রিলিজ পাইপলাইন তিনটা আলাদা প্রশ্নের উত্তর দেয়। প্রথমে ক্রম: \`needs\` একটা DAG, তার টপোলজিক্যাল সর্টই বলে কোন জব কখন চলতে পারে; lexicographically ছোট ক্রম পেতে মিন-হিপ দরকার। দ্বিতীয়ে খরচ: matrix জবের প্রতিটি combo আলাদা রান, আর cache key combo-ভেদে আলাদা না হলে একই key বারবার ফিরে আসে — তখন hit বাড়ে, কিন্তু ভিন্ন প্ল্যাটফর্মের আর্টিফ্যাক্ট মিশে যাওয়ার ঝুঁকিও থাকে। তৃতীয়ে গেট: required check, ব্রাঞ্চ, ট্যাগ আর অনুমোদন — সব একসাথে সত্য না হলে প্রোডাকশনে কিছু যায় না। fail-fast এই ছবিটা বদলে দেয়: একটা জব ফেল করলে পরের জবগুলো আর চলে না, ফলে রান-সংখ্যাও কমে।

## ধাপে ধাপে
1. জব আর \`needs\` পড়ে indegree বানাও, মিন-হিপে শূন্য-নির্ভরতা জব ঢোকাও।
2. হিপ খালি না হওয়া পর্যন্ত নাম তুলে ক্রমে যোগ করো, সন্তানদের indegree কমাও।
3. path filter আর changed পাথ মিলিয়ে দেখো workflow চলবে কি না।
4. fail-fast চালু আর ফেল থাকলে ক্রমটাকে ফেল করা জব পর্যন্ত কেটে নাও; তারপর প্রতিটি জবের রান গোনো (matrix হলে combo-সংখ্যা)।
5. cache key মিলিয়ে hit গোনো, গেটের চারটা শর্ত দেখো, শেষে ডিপ্লয়ের সিদ্ধান্ত ছাপো।

\`\`\`python
${CHECK_PIPELINE_PY}\`\`\`

## কমপ্লেক্সিটি
সময় \`O((J + E) log J + M)\`, মেমোরি \`O(J + E + M)\`; \`M\` matrix combo সংখ্যা।

## সাধারণ ভুল
- matrix জবকে একটাই রান ধরা — combo সংখ্যাই আসল রান-সংখ্যা।
- fail-fast চালু থাকলেও সব জব গোনা — বাতিল হওয়া জব চলে না।
- \`RUNS\`-এ cache hit বাদ দেওয়া — hit হলেও জব তো চলে, শুধু ডিপেন্ডেন্সি নামে না।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["CI/CD", "GitHub Actions", "Release"],
    tests: [
      {
        input: `JOBS 4
lint -
build lint
test build
deploy test
MATRIX_JOB test
MATRIX 2
ubuntu-latest node
ubuntu-latest python
FILTER 1
src/**
CHANGED 1
src/app.ts
CACHE_KEY deps-{os}-{lang}
FAIL none
FAIL_FAST yes
BRANCH main
TAG v3.0.0
BRANCH_RULE main
TAG_RULE v*
APPROVALS 1
APPROVALS_REQUIRED 1
DEPLOY_JOB deploy
`,
        expectedOutput: "ORDER: lint build test deploy\nRUNS: 5\nCACHE_HITS: 0\nDEPLOY: yes\n",
        isSample: true,
      },
      {
        input: `JOBS 4
lint -
build lint
test build
deploy test
MATRIX_JOB test
MATRIX 2
ubuntu-latest node
windows-latest node
FILTER 1
**
CHANGED 1
src/app.ts
CACHE_KEY deps-{os}
FAIL none
FAIL_FAST yes
BRANCH main
TAG v1.0.0
BRANCH_RULE main
TAG_RULE release-*
APPROVALS 2
APPROVALS_REQUIRED 2
DEPLOY_JOB deploy
`,
        expectedOutput: "ORDER: lint build test deploy\nRUNS: 5\nCACHE_HITS: 0\nDEPLOY: no\n",
        isSample: true,
      },
      {
        input: `JOBS 4
lint -
build lint
test build
deploy test
MATRIX_JOB test
MATRIX 2
ubuntu-latest node
windows-latest node
FILTER 1
**
CHANGED 1
src/app.ts
CACHE_KEY deps-{os}
FAIL build
FAIL_FAST yes
BRANCH main
TAG v1.0.0
BRANCH_RULE main
TAG_RULE v*
APPROVALS 1
APPROVALS_REQUIRED 1
DEPLOY_JOB deploy
`,
        expectedOutput: "ORDER: lint build test deploy\nRUNS: 2\nCACHE_HITS: 0\nDEPLOY: no\n",
        isSample: false,
      },
      {
        input: `JOBS 3
lint -
test lint
deploy test
MATRIX_JOB test
MATRIX 2
ubuntu-latest node
ubuntu-latest python
FILTER 1
src/**
CHANGED 1
docs/readme.md
CACHE_KEY deps-{lang}
FAIL none
FAIL_FAST yes
BRANCH main
TAG v1.0.0
BRANCH_RULE main
TAG_RULE v*
APPROVALS 1
APPROVALS_REQUIRED 1
DEPLOY_JOB deploy
`,
        expectedOutput: "ORDER: lint test deploy\nRUNS: 0\nCACHE_HITS: 0\nDEPLOY: no\n",
        isSample: false,
      },
      {
        input: `JOBS 4
lint -
build lint
test build
deploy test
MATRIX_JOB test
MATRIX 2
ubuntu-latest node
windows-latest node
FILTER 1
**
CHANGED 1
src/app.ts
CACHE_KEY deps-{os}
FAIL build
FAIL_FAST no
BRANCH main
TAG v1.0.0
BRANCH_RULE main
TAG_RULE v*
APPROVALS 1
APPROVALS_REQUIRED 1
DEPLOY_JOB deploy
`,
        expectedOutput: "ORDER: lint build test deploy\nRUNS: 5\nCACHE_HITS: 0\nDEPLOY: no\n",
        isSample: false,
      },
      {
        input: `JOBS 4
lint -
build lint
test build
deploy test
MATRIX_JOB test
MATRIX 3
ubuntu-latest node
windows-latest node
ubuntu-latest python
FILTER 1
**
CHANGED 1
src/app.ts
CACHE_KEY deps-node
FAIL none
FAIL_FAST yes
BRANCH main
TAG v5.0.0
BRANCH_RULE main
TAG_RULE v*
APPROVALS 3
APPROVALS_REQUIRED 2
DEPLOY_JOB deploy
`,
        expectedOutput: "ORDER: lint build test deploy\nRUNS: 6\nCACHE_HITS: 2\nDEPLOY: yes\n",
        isSample: false,
      },
      {
        input: `JOBS 3
lint -
build lint
deploy build
MATRIX_JOB build
MATRIX 2
ubuntu-latest node
ubuntu-latest python
FILTER 1
src/**
CHANGED 1
src/main.ts
CACHE_KEY deps-{os}-{lang}
FAIL none
FAIL_FAST yes
BRANCH release/2.0
TAG v2.0.0
BRANCH_RULE release/2.0
TAG_RULE v2.*
APPROVALS 1
APPROVALS_REQUIRED 1
DEPLOY_JOB deploy
`,
        expectedOutput: "ORDER: lint build deploy\nRUNS: 4\nCACHE_HITS: 0\nDEPLOY: yes\n",
        isSample: false,
      },
    ],
    referencePython: CHECK_PIPELINE_PY,
  },
];
