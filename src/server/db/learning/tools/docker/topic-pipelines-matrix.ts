import type { SeedProblem } from "../../../seed-problems";

const MATRIX_CACHE_PY = `import sys

def matches(pattern, path):
    if pattern == "**":
        return True
    if pattern.endswith("/**"):
        prefix = pattern[:-3]
        return path == prefix or path.startswith(prefix + "/")
    return pattern == path

raw = sys.stdin.read().splitlines()
position = 0
oses = []
langs = []
excludes = set()
patterns = []
changed = []
template = ""
fail_fast = False
fail_os = "none"
fail_lang = "none"

while position < len(raw):
    line = raw[position].strip()
    if not line:
        position += 1
        continue
    parts = line.split()
    key = parts[0]
    if key == "OS":
        count = int(parts[1])
        position += 1
        oses = [raw[position + k].strip() for k in range(count)]
        position += count
    elif key == "LANG":
        count = int(parts[1])
        position += 1
        langs = [raw[position + k].strip() for k in range(count)]
        position += count
    elif key == "EXCLUDE":
        count = int(parts[1])
        position += 1
        for k in range(count):
            first, second = raw[position + k].split()
            excludes.add((first, second))
        position += count
    elif key == "FILTER":
        count = int(parts[1])
        position += 1
        patterns = [raw[position + k].strip() for k in range(count)]
        position += count
    elif key == "CHANGED":
        count = int(parts[1])
        position += 1
        changed = [raw[position + k].strip() for k in range(count)]
        position += count
    elif key == "CACHE_KEY":
        template = line.split(maxsplit=1)[1]
        position += 1
    elif key == "FAIL_FAST":
        fail_fast = parts[1] == "yes"
        position += 1
    elif key == "FAIL":
        fail_os = parts[1]
        fail_lang = parts[2]
        position += 1
    else:
        position += 1

runs = []
if any(matches(pattern, path) for pattern in patterns for path in changed):
    runs = [
        (os_name, lang)
        for os_name in oses
        for lang in langs
        if (os_name, lang) not in excludes
    ]

seen = set()
hits = 0
executed = 0
stopped = "no"
for index, (os_name, lang) in enumerate(runs):
    executed += 1
    resolved = template.replace("{os}", os_name).replace("{lang}", lang)
    if resolved in seen:
        hits += 1
    else:
        seen.add(resolved)
    if (os_name, lang) == (fail_os, fail_lang) and fail_fast:
        if index + 1 < len(runs):
            stopped = "yes"
        break

print("JOBS: " + str(executed))
print("CACHE_HITS: " + str(hits))
print("STOPPED: " + stopped)
`;

export const PIPELINES_MATRIX_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-ci-matrix-cache",
    title: "Count Matrix Jobs and Cache Hits",
    statement: `তাসনিম হিসাব করল, প্রতিদিন ৯০টা matrix জব চলছে, অথচ অনেকগুলো একই cache key নিয়ে আবার ডিপেন্ডেন্সি নামাচ্ছে। মাহিন বলল, key-তে \`{os}\` আর \`{lang}\` বসালে প্রতি combo আলাদা cache পায়, না বসালে সব জব একই key-তে ধাক্কা খায়; আর path filter না মিললে পুরো workflow-ই চলে না। নুসরাত এখন matrix, exclude, filter, cache key আর fail-fast দেখে বলবে কতগুলো জব চলবে, কতগুলো cache পাবে, আর fail-fastে মাঝপথে থামবে কি না।

মডেল: combo-গুলো OS-এর ক্রমে, প্রতি OS-এ LANG-এর ক্রমে সাজানো; exclude করা combo বাদ যায়। cache key-তে \`{os}\` আর \`{lang}\` বসিয়ে চূড়ান্ত key হয়; আগে দেখা কোনো key আবার এলে সেটা cache hit। fail-fast চালু থাকলে ফেল করা combo-র পরের combo আর চলে না, বন্ধ থাকলে সব চলে। ফেল করা combo-ই শেষ combo হলে কিছু বাতিল হয় না।`,
    inputFormat: `ক্রমে \`OS <n>\` ও \`n\`টা OS নাম, \`LANG <n>\` ও \`n\`টা ভাষা, \`EXCLUDE <n>\` ও \`n\`টা \`<os> <lang>\`, \`FILTER <n>\` ও \`n\`টা গ্লোব, \`CHANGED <n>\` ও \`n\`টা বদলানো পাথ, \`CACHE_KEY <টেমপ্লেট>\`, \`FAIL_FAST <yes|no>\`, \`FAIL <os> <lang>\` (ফেল না করলে \`FAIL none none\`)।`,
    outputFormat: `তিন লাইন: \`JOBS:\` (আসলে চলা জব), \`CACHE_HITS:\` (cache পেয়ে থাকা জব), \`STOPPED: yes|no\` (fail-fastে পরের জব বাতিল হয়েছে কি না)।`,
    constraints: `প্রতি তালিকায় ০ থেকে ১০ আইটেম
ফিল্টার গ্লোব হয় \`**\`, \`prefix/**\`, নাহলে হুবহু পাথ।`,
    editorial: `## ধারণা
Matrix মানে এক জব-সংজ্ঞা থেকে অনেক জব — OS আর ভাষার গুণফল, exclude বাদ দিয়ে। প্রতিটি combo আলাদা রানার পায়, তাই সময় বাঁচে, কিন্তু মিনিটও খরচ হয়। Cache key যদি combo-ভেদে না বদলায়, তবে ভিন্ন OS বা ভিন্ন ভাষার জবও একই key-তে ধাক্কা খায় — হয় ভুল cache restored হয়, নাহয় অকারণে miss হয়। তাই key-তে \`os\` আর ভাষার ভার্সন রাখা নিয়ম। Path filter workflow-কেই সীমিত করে: শুধু ডকুমেন্ট বদলালে টেস্ট ম্যাট্রিক্স চালানোর দরকার নেই। Fail-fast চালু থাকলে একটা combo ফেল করলে বাকি চলমান আর অপেক্ষমাণ জব বাতিল হয় — দ্রুত ফিডব্যাক, কিন্তু কম তথ্য।

## ধাপে ধাপে
1. OS, LANG, EXCLUDE পড়ে combo তালিকা বানাও।
2. FILTER আর CHANGED মিলিয়ে দেখো workflow আদৌ চলবে কি না; না মিললে তিনটাই শূন্য বা \`no\`।
3. প্রতিটি combo-র জন্য key-তে \`{os}\`, \`{lang}\` বসাও। আগে দেখা key হলে hit বাড়াও।
4. FAIL combo এলে fail-fast চালু থাকলে থামো, আর পরে জব বাকি থাকলে \`STOPPED: yes\`।
5. চলা জব, hit আর stopped ছাপো।

\`\`\`python
${MATRIX_CACHE_PY}\`\`\`

## কমপ্লেক্সিটি
সময় \`O(C)\`, combo সংখ্যা \`C\`; মেমোরি \`O(C)\`।

## সাধারণ ভুল
- Cache key-তে OS বা ভাষা না রাখা — ভিন্ন প্ল্যাটফর্মের বাইনারি একই key-তে মিশে যায়।
- Path filter-কে প্রতি জবের ওপর প্রয়োগ করা — এখানে পুরো workflow একসাথে সীমিত হয়।
- exclude করার আগে combo গোনা — exclude করা combo কোনোদিন চলে না, cache hit-ও দেয় না।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["CI/CD", "GitHub Actions", "Matrix Build"],
    tests: [
      {
        input: `OS 2
ubuntu-latest
windows-latest
LANG 2
node
python
EXCLUDE 1
windows-latest python
FILTER 1
src/**
CHANGED 2
src/api.ts
docs/readme.md
CACHE_KEY deps-{os}-{lang}
FAIL_FAST yes
FAIL ubuntu-latest python
`,
        expectedOutput: "JOBS: 2\nCACHE_HITS: 0\nSTOPPED: yes\n",
        isSample: true,
      },
      {
        input: `OS 2
ubuntu-latest
windows-latest
LANG 1
node
EXCLUDE 0
FILTER 1
src/**
CHANGED 1
src/app.ts
CACHE_KEY deps-node
FAIL_FAST yes
FAIL none none
`,
        expectedOutput: "JOBS: 2\nCACHE_HITS: 1\nSTOPPED: no\n",
        isSample: true,
      },
      {
        input: `OS 2
ubuntu-latest
windows-latest
LANG 1
node
EXCLUDE 0
FILTER 1
src/**
CHANGED 1
docs/readme.md
CACHE_KEY deps-{os}
FAIL_FAST yes
FAIL none none
`,
        expectedOutput: "JOBS: 0\nCACHE_HITS: 0\nSTOPPED: no\n",
        isSample: false,
      },
      {
        input: `OS 2
ubuntu-latest
windows-latest
LANG 1
node
EXCLUDE 0
FILTER 1
**
CHANGED 1
infra/main.tf
CACHE_KEY deps-{os}-{lang}
FAIL_FAST no
FAIL ubuntu-latest node
`,
        expectedOutput: "JOBS: 2\nCACHE_HITS: 0\nSTOPPED: no\n",
        isSample: false,
      },
      {
        input: `OS 2
ubuntu-latest
windows-latest
LANG 1
node
EXCLUDE 1
windows-latest node
FILTER 1
src/**
CHANGED 1
src/a.ts
CACHE_KEY deps-{os}
FAIL_FAST yes
FAIL windows-latest node
`,
        expectedOutput: "JOBS: 1\nCACHE_HITS: 0\nSTOPPED: no\n",
        isSample: false,
      },
      {
        input: `OS 1
ubuntu-latest
LANG 1
node
EXCLUDE 0
FILTER 1
src/**
CHANGED 1
src/a.ts
CACHE_KEY deps
FAIL_FAST yes
FAIL ubuntu-latest node
`,
        expectedOutput: "JOBS: 1\nCACHE_HITS: 0\nSTOPPED: no\n",
        isSample: false,
      },
      {
        input: `OS 1
ubuntu-latest
LANG 3
node
python
go
EXCLUDE 0
FILTER 1
**
CHANGED 1
src/a.ts
CACHE_KEY build-{lang}
FAIL_FAST yes
FAIL ubuntu-latest python
`,
        expectedOutput: "JOBS: 2\nCACHE_HITS: 0\nSTOPPED: yes\n",
        isSample: false,
      },
    ],
    referencePython: MATRIX_CACHE_PY,
  },
];
