import type { SeedProblem } from "../../../seed-problems";

const JOB_ORDER_PY = `import sys
import heapq

raw = sys.stdin.read().splitlines()
count = int(raw[0].strip())
needs = {}
names = []
position = 1
for _ in range(count):
    parts = raw[position].split()
    position += 1
    name = parts[0]
    names.append(name)
    needs[name] = [] if parts[1] == "-" else parts[1:]

indegree = {name: len(needs[name]) for name in names}
children = {name: [] for name in names}
for name in names:
    for dep in needs[name]:
        children[dep].append(name)

heap = [name for name in names if indegree[name] == 0]
heapq.heapify(heap)
order = []
longest = {}
while heap:
    name = heapq.heappop(heap)
    order.append(name)
    longest[name] = 1 + max((longest[dep] for dep in needs[name]), default=0)
    for child in children[name]:
        indegree[child] -= 1
        if indegree[child] == 0:
            heapq.heappush(heap, child)

if len(order) < len(names):
    placed = set(order)
    blocked = sorted(name for name in names if name not in placed)
    print("BLOCKED: " + " ".join(blocked))
    print("PATH: -1")
else:
    print("ORDER: " + " ".join(order))
    print("PATH: " + str(max(longest.values())))
`;

export const PIPELINES_GUIDED_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-ci-job-order",
    title: "Order the Pipeline Jobs",
    statement: `তাসনিমের অভিযোগ, ডিপ্লয় পাইপলাইন চলতে ৪০ মিনিট লাগে, অথচ অর্ধেক জব একসাথে চালানো যায়। মাহিন বলল, প্রতিটি জবের \`needs\` দেখে একটা DAG আঁকলে বোঝা যায় কোনটা সমান্তরালে চলতে পারে আর কোন শৃঙ্খল সবচেয়ে দীর্ঘ। নুসরাত এখন জব আর তাদের নির্ভরতা দেখে একটা বৈধ রান-অর্ডার আর critical path-এর দৈর্ঘ্য বের করছে।

নিয়ম: প্রতিটি জব ১ একক সময় নেয়। \`needs\` মানে আগের জব সফল না হলে এই জব শুরু হয় না। বৈধ রান-অর্ডার মানে প্রতিটি নির্ভরতা তার চেয়ে আগে থাকে। একাধিক বৈধ ক্রম থাকলে lexicographically সবচেয়ে ছোটটা ছাপো (নামের তুলনায় Python-এর সাধারণ স্ট্রিং তুলনা)। Critical path = সবচেয়ে দীর্ঘ নির্ভরতা-শৃঙ্খলে জবের সংখ্যা।`,
    inputFormat: `প্রথম লাইনে \`J\` — জব সংখ্যা। পরের \`J\` লাইনে \`<নাম> <নির্ভরতা...>\`; নির্ভরতা না থাকলে শুধু \`-\`। প্রতিটি জবের নাম একক শব্দ।`,
    outputFormat: `বৈধ ক্রম থাকলে প্রথম লাইনে \`ORDER:\` এরপর ক্রম, দ্বিতীয় লাইনে \`PATH:\` এরপর critical path-এর জব সংখ্যা। সাইকেল থাকলে প্রথম লাইনে \`BLOCKED:\` এরপর আটকে থাকা জবগুলো lexicographic ক্রমে, দ্বিতীয় লাইনে \`PATH: -1\`।`,
    constraints: `\`1 <= J <= 10\`
নির্ভরতার তালিকায় ডুপ্লিকেট নেই, আর \`needs\` সাইকেল ছাড়া একটা DAG হতে পারে।`,
    editorial: `## ধারণা
CI-তে জবের নির্ভরতা একটা DAG, আর সেটার টপোলজিক্যাল সর্টই সঠিক রান-অর্ডার দেয়। একই সাথে দুইটা কাজ করা যায়: ক্রম বের করা আর critical path মাপা। Critical path মানে সবচেয়ে দীর্ঘ শৃঙ্খল — পাইপলাইনের মোট সময় তার চেয়ে কম হতে পারে না, কারণ শৃঙ্খলের প্রতিটি ধাপ আগেরটার পরে চলে। অন্য জবগুলো সমান্তরালে চালিয়ে সেই সময় ভরা যায়। Lexicographically ছোট ক্রম পেতে প্রস্তুত জবগুলো একটা মিন-হিপে রাখা হয়, তাই টাই ব্রেকে ছোট নাম আগে বেরোয়।

## ধাপে ধাপে
1. প্রতিটি জবের নির্ভরতা পড়ে indegree গোনো।
2. indegree শূন্য জবগুলো মিন-হিপে ঢোকাও।
3. হিপ থেকে নাম তোলো, ক্রমে যোগ করো, আর \`longest[name] = 1 + max(longest[dep])\` হিসাব করো।
4. তার সন্তানদের indegree কমাও; শূন্য হলে হিপে ঢোকাও।
5. সব জব বেরোলে \`max(longest)\` ছাপো; কম বেরোলে বাকিগুলো সাইকেলে, \`BLOCKED\` ছাপো।

\`\`\`python
${JOB_ORDER_PY}\`\`\`

## কমপ্লেক্সিটি
সময় \`O((J + E) log J)\`, মেমোরি \`O(J + E)\`; \`E\` নির্ভরতার সংখ্যা।

## সাধারণ ভুল
- হিপের বদলে সাধারণ লিস্ট ব্যবহার — ক্রম বৈধ হলেও lexicographically ছোটটা আসে না, উত্তর মেলে না।
- শুধু topological order বের করে critical path আলাদা করে না মাপা — দুটো একই পাসে হয়।
- \`max\`-এ খালি তালিকা দিয়ে ক্র্যাশ — নির্ভরতা নেই এমন জবের জন্য \`default=0\` দরকার।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["CI/CD", "GitHub Actions", "Topological Sort"],
    tests: [
      {
        input: `5
lint -
build lint
test build
e2e build
deploy test e2e
`,
        expectedOutput: "ORDER: lint build e2e test deploy\nPATH: 4\n",
        isSample: true,
      },
      {
        input: `1
lint -
`,
        expectedOutput: "ORDER: lint\nPATH: 1\n",
        isSample: true,
      },
      {
        input: `3
a c
b a
c b
`,
        expectedOutput: "BLOCKED: a b c\nPATH: -1\n",
        isSample: false,
      },
      {
        input: `5
checkout -
deps checkout
frontend deps
backend deps
deploy frontend backend
`,
        expectedOutput: "ORDER: checkout deps backend frontend deploy\nPATH: 4\n",
        isSample: false,
      },
      {
        input: `4
build -
lint -
test build lint
deploy test
`,
        expectedOutput: "ORDER: build lint test deploy\nPATH: 3\n",
        isSample: false,
      },
      {
        input: `4
a -
b a
c b
d c
`,
        expectedOutput: "ORDER: a b c d\nPATH: 4\n",
        isSample: false,
      },
      {
        input: `6
a -
b -
c a
d a
e c d
f b e
`,
        expectedOutput: "ORDER: a b c d e f\nPATH: 4\n",
        isSample: false,
      },
    ],
    referencePython: JOB_ORDER_PY,
  },
];
