import type { SeedProblem } from "../../../seed-problems";

const LAYER_CACHE_PY = `import sys

def normalize(path):
    while path.startswith("./"):
        path = path[2:]
    return path

def matches(source, changed):
    source = normalize(source)
    if source in (".", ""):
        return True
    return changed == source or changed.startswith(source + "/")

raw = sys.stdin.read().splitlines()
position = 0
n = int(raw[position].strip())
position += 1
lines = raw[position:position + n]
position += n
m = int(raw[position].strip())
position += 1
changed = [normalize(raw[position + k].strip()) for k in range(m)]

rebuild = []
parent_cached = True
for index in range(1, n):
    tokens = lines[index].split()
    command = tokens[0].upper() if tokens else ""
    invalid = not parent_cached
    if not invalid and command in ("COPY", "ADD"):
        args = [token for token in tokens[1:] if not token.startswith("--")]
        for source in args[:-1]:
            if any(matches(source, path) for path in changed):
                invalid = True
                break
    if invalid:
        rebuild.append(index + 1)
        parent_cached = False

print("REBUILD: " + (" ".join(str(index) for index in rebuild) if rebuild else "none"))
print("HITS: " + str(n - len(rebuild)))
`;

const IMAGE_SIZE_PY = `import sys

raw = sys.stdin.read().splitlines()
position = 0
count = int(raw[position].strip())
position += 1
stages = []
for _ in range(count):
    name = raw[position].split(maxsplit=1)[1].strip()
    position += 1
    total = 0
    layers = []
    while position < len(raw) and not raw[position].startswith("STAGE "):
        parts = raw[position].split()
        position += 1
        if parts[0] == "LAYER":
            size = int(parts[2])
            layers.append((parts[1], size))
            total += size
        else:
            total += int(parts[2])
    stages.append((name, total, layers))

final_name, final_total, _final_layers = stages[-1]
best = None
for _name, _total, layers in stages[:-1]:
    for layer_name, size in layers:
        if best is None or size > best[1]:
            best = (layer_name, size)

print("FINAL: " + final_name)
print("SIZE: " + str(final_total))
if best is None:
    print("DISCARDED: none")
else:
    print("DISCARDED: " + best[0] + " " + str(best[1]))
`;

export const CONTAINERS_GUIDED_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-docker-layer-cache",
    title: "Rebuild Only What Changed",
    statement: `নুসরাতের টিম প্রতিদিন সকালে \`api\` ইমেজ বিল্ড করে, কিন্তু এক লাইন সোর্স বদলালেও ছয় মিনিট লাগে, কারণ প্রতিবার \`pnpm install\` আবার চলে। মেন্টর মাহিন বলল সমস্যাটা লেয়ার ক্রমে — কপি করা দরকার শুধু সেটুকু, যেটুকু সত্যিই বদলেছে। এখন Dockerfile-এর প্রতিটি নির্দেশ, আগের বিল্ডের ক্যাশ আর বদলানো ফাইলের তালিকা দেখে বের করো কোন লেয়ারগুলো আবার তৈরি হবে।

নিয়ম: প্রথম লাইন সবসময় \`FROM\`, সেটা ক্যাশ থেকেই আসে। এরপরের প্রতিটি লাইন একটা লেয়ার। আউটপুটে Dockerfile-এর ১-ভিত্তিক লাইন নম্বর দাও: \`FROM\` হলো লাইন ১, তাই তার পরের প্রথম লেয়ার লাইন ২। আগের সব লেয়ার ক্যাশে থাকলে এবং \`COPY\`/\`ADD\`-এর কোনো সোর্সের নিচে বদলানো ফাইল না থাকলে লেয়ারটা ক্যাশে থাকে। \`RUN\`, \`ENV\`, \`CMD\`-এর নিজের কোনো ফাইল-নির্ভরতা নেই, ওরা শুধু আগের লেয়ারের ওপর নির্ভর করে। একটা লেয়ার তৈরি হলে তার পরের সব লেয়ারও তৈরি হয়।`,
    inputFormat: `প্রথম লাইনে \`N\` — Dockerfile-এর লাইন সংখ্যা। পরের \`N\` লাইনে একটা একটা নির্দেশ, যেমন \`FROM node:24-alpine\`, \`COPY src ./src\`, \`RUN pnpm build\`। এরপর \`M\` — বদলানো ফাইলের সংখ্যা, পরের \`M\` লাইনে একটা একটা পাথ। \`M\` শূন্যও হতে পারে।`,
    outputFormat: `প্রথম লাইনে \`REBUILD:\` এরপর একটা স্পেস দিয়ে আবার তৈরি হওয়া লেয়ারগুলোর ১-ভিত্তিক Dockerfile লাইন নম্বর, স্পেস দিয়ে আলাদা; কিছু না হলে শুধু \`REBUILD: none\`। দ্বিতীয় লাইনে \`HITS:\` এরপর একটা স্পেস দিয়ে ক্যাশ থেকে আসা লাইনের সংখ্যা (\`FROM\` সহ)।`,
    constraints: `\`1 <= N <= 20\`, \`0 <= M <= 10\`
প্রতিটি পাথ ছোট হাতের অক্ষর, সংখ্যা আর \`/\` দিয়ে গঠিত; প্রথম লাইন সবসময় \`FROM\`।`,
    editorial: `## ধারণা
Docker ইমেজ লেয়ারের স্তূপ, আর প্রতিটি নির্দেশের একটা ক্যাশ-চাবি থাকে: নির্দেশের টেক্সট, আর্গুমেন্ট আর প্যারেন্ট লেয়ারের digest। \`COPY\`/\`ADD\`-এ চাবিতে কপি করা ফাইলের checksum-ও ঢোকে। তাই আগের কোনো লেয়ার বদলালে পরের লেয়ারের চাবিও বদলে যায় — নির্দেশটা হুবহু একই থাকলেও ক্যাশ মিস হয়। এই কারণেই dependency ফাইল আগে কপি করে \`RUN install\` চালানো আর সোর্স শেষে কপি করা: তাতে সোর্স বদলালে install লেয়ার ক্যাশেই থাকে। আসল Docker ফাইলের checksum মেলায়; এখানে সরল মডেলে বদলানো পাথ সোর্সের ভেতরে পড়লেই লেয়ার ভাঙা ধরা হয়েছে।

## ধাপে ধাপে
1. \`FROM\` লাইনটা (লাইন ১) ক্যাশে ধরে নাও।
2. বাকি প্রতিটি লাইন ধরে দেখো তার প্যারেন্ট লেয়ার ক্যাশে আছে কি না।
3. লেয়ারটা \`COPY\`/\`ADD\` হলে শেষ টোকেন গন্তব্য, তার আগের সব টোকেন সোর্স। \`--\` দিয়ে শুরু হওয়া ফ্ল্যাগ বাদ দাও।
4. সোর্স \`.\` হলে যেকোনো বদলানো ফাইল মেলে; নাহলে বদলানো পাথটা সোর্সের সমান বা \`সোর্স/\` দিয়ে শুরু হলে মেলে। মিললে লেয়ার ভাঙো, আর তার পরের সব লেয়ারও ভাঙবে।
5. শেষে ভাঙা লেয়ারগুলোর ১-ভিত্তিক Dockerfile লাইন নম্বর ছাপো, আর \`N\` থেকে ভাঙা লেয়ারের সংখ্যা বাদ দিয়ে (\`FROM\` সহ) ক্যাশ-হিট ছাপো।

\`\`\`python
${LAYER_CACHE_PY}\`\`\`

## কমপ্লেক্সিটি
সময় \`O(N * M)\` — প্রতিটি লেয়ারের জন্য সব বদলানো পাথ দেখতে হয়। মেমোরি \`O(N + M)\`।

## সাধারণ ভুল
- \`FROM\`-কে লেয়ার হিসেবে ভুলে ১ থেকে গোনা — \`FROM\` লাইন ১, তাই প্রথম আসল লেয়ার লাইন ২।
- একটা \`COPY\` ভাঙলে শুধু সেটাই ভাঙবে ভাবা — প্যারেন্ট বদলালে পরের প্রতিটি লেয়ারও আবার তৈরি হয়।
- \`COPY . .\` শুরুতে রাখা — সোর্সের যেকোনো পরিবর্তনে install-এর লেয়ারও ভাঙে, বিল্ড ধীর হয়।
- \`COPY package.json pnpm-lock.yaml ./\`-এ শুধু শেষ টোকেনকে সোর্স ভাবা — শেষটা গন্তব্য, তার আগের সবগুলো সোর্স।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Docker", "Containers", "Build Cache"],
    tests: [
      {
        input: `6
FROM node:24-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY src ./src
RUN pnpm build
1
src/api/health.ts
`,
        expectedOutput: "REBUILD: 5 6\nHITS: 4\n",
        isSample: true,
      },
      {
        input: `6
FROM node:24-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY src ./src
RUN pnpm build
1
pnpm-lock.yaml
`,
        expectedOutput: "REBUILD: 3 4 5 6\nHITS: 2\n",
        isSample: true,
      },
      {
        input: `6
FROM node:24-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY src ./src
RUN pnpm build
1
README.md
`,
        expectedOutput: "REBUILD: none\nHITS: 6\n",
        isSample: false,
      },
      {
        input: `5
FROM node:24-alpine
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
CMD ["node", "server.js"]
1
src/app.ts
`,
        expectedOutput: "REBUILD: 3 4 5\nHITS: 2\n",
        isSample: false,
      },
      {
        input: `7
FROM python:3.12-slim
WORKDIR /srv
COPY requirements.txt ./
RUN pip install -r requirements.txt
COPY app ./app
COPY tests ./tests
CMD ["python", "-m", "app"]
2
app/main.py
tests/test_api.py
`,
        expectedOutput: "REBUILD: 5 6 7\nHITS: 4\n",
        isSample: false,
      },
      {
        input: `5
FROM golang:1.23 AS build
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o /out/api ./cmd/api
1
go.sum
`,
        expectedOutput: "REBUILD: 2 3 4 5\nHITS: 1\n",
        isSample: false,
      },
      {
        input: `4
FROM alpine:3.20
WORKDIR /app
RUN apk add --no-cache curl
CMD ["sh"]
0
`,
        expectedOutput: "REBUILD: none\nHITS: 4\n",
        isSample: false,
      },
    ],
    referencePython: LAYER_CACHE_PY,
  },
  {
    slug: "learn-docker-image-size",
    title: "Shrink the Final Image",
    statement: `নুসরাতের ফাইনাল ইমেজ ১.২ GB, অথচ অ্যাপের দরকার মাত্র কয়েক MB। মাহিন দেখাল বিল্ড স্টেজের কম্পাইলার, \`node_modules\` আর সোর্স — সব ফাইনাল ইমেজে ঢুকে পড়েছে, কারণ মাল্টি-স্টেজ বিল্ডে \`COPY --from\` ঠিকমতো ব্যবহার হয়নি। এখন স্টেজগুলোর সাইজ আর কোন স্টেজ থেকে কী কপি হচ্ছে দেখে ফাইনাল ইমেজের মোট সাইজ আর বাদ পড়া সবচেয়ে বড় লেয়ার বের করো।

প্রতিটি ব্লক \`STAGE <নাম>\` দিয়ে শুরু। এরপর \`LAYER <নাম> <সাইজ>\` মানে এই স্টেজ নিজে তৈরি করে এমন একটা লেয়ার, আর \`COPY <সোর্স-স্টেজ> <সাইজ>\` মানে আগের কোনো স্টেজ থেকে ওই সাইজের আর্টিফ্যাক্ট কপি হচ্ছে। শেষ স্টেজটাই ফাইনাল ইমেজ; সাইজ = শেষ স্টেজের সব \`LAYER\` ও \`COPY\` সাইজের যোগফল। বাদ পড়া লেয়ার মানে শেষ স্টেজ ছাড়া বাকি স্টেজের \`LAYER\`; সাইজ সমান হলে আগে আসাটা ধরা হয়।`,
    inputFormat: `প্রথম লাইনে \`S\` — স্টেজ সংখ্যা। এরপর প্রতি স্টেজের জন্য একটা \`STAGE <নাম>\` লাইন, তারপর শূন্য বা তার বেশি \`LAYER\` আর \`COPY\` লাইন। প্রতিটি \`COPY\` আগের কোনো স্টেজের নাম নেয়।`,
    outputFormat: `তিন লাইন: \`FINAL:\` এরপর শেষ স্টেজের নাম, \`SIZE:\` এরপর ফাইনাল ইমেজের মোট সাইজ, আর \`DISCARDED: <লেয়ার-নাম> <সাইজ>\`। বাদ পড়া লেয়ার না থাকলে \`DISCARDED: none\`।`,
    constraints: `\`1 <= S <= 6\`, প্রতিটি সাইজ \`0 <= size <= 2000\`
প্রতিটি \`COPY\` আগের কোনো স্টেজকেই দেখায়।`,
    editorial: `## ধারণা
মাল্টি-স্টেজ বিল্ডে প্রতিটি \`FROM\` একটা আলাদা স্টেজ, আর ফাইনাল ইমেজে কেবল শেষ স্টেজটাই থাকে। মাঝের স্টেজ থেকে যা দরকার, সেটুকুই \`COPY --from\` দিয়ে আনা হয়। ফলে বিল্ডার স্টেজের কম্পাইলার, প্যাকেজ ক্যাশ আর টেস্ট ডিপেন্ডেন্সি ইমেজের বাইরে থেকে যায় — ইমেজ ছোট হয়, pull দ্রুত হয়, আক্রমণের পৃষ্ঠও কমে। এখানে প্রতিটি স্টেজের খরচ যোগ করে দেখা হচ্ছে কোন স্টেজ কত ব্যয়বহুল, আর শেষ স্টেজ বাদে সবচেয়ে বড় লেয়ারটাই অপচয়ের সবচেয়ে বড় উৎস।

## ধাপে ধাপে
1. \`S\` পড়ে প্রতিটি ব্লক আলাদা করো।
2. প্রতি স্টেজের একটা মোট সাইজ আর লেয়ার-তালিকা রাখো। \`LAYER\` দুটোই বাড়ায়, \`COPY\` শুধু মোট সাইজ বাড়ায়।
3. শেষ স্টেজের নাম আর মোট সাইজ ছাপো।
4. শেষ স্টেজ বাদে বাকি স্টেজগুলোর \`LAYER\`-এর মধ্যে সবচেয়ে বড়টা খোঁজো; সাইজ সমান হলে আগেরটা রাখো।
5. কোনো বাদ পড়া লেয়ার না পেলে \`none\` ছাপো।

\`\`\`python
${IMAGE_SIZE_PY}\`\`\`

## কমপ্লেক্সিটি
সময় \`O(L)\`, যেখানে \`L\` মোট লেয়ারের সংখ্যা; মেমোরি \`O(L)\`।

## সাধারণ ভুল
- \`COPY\`-এর সাইজ ভুলে যাওয়া — ফাইনাল ইমেজে কপি করা আর্টিফ্যাক্টের বাইটও যোগ হয়।
- বাদ পড়া লেয়ারের হিসাবে মাঝের স্টেজের \`COPY\` সাইজ ধরা — ওটা ওই স্টেজের খরচ, ফাইনাল ইমেজের নয়।
- \`SIZE\` আর "কত সাইজ বাঁচল" গুলিয়ে ফেলা — প্রশ্ন শেষ ইমেজের মোট সাইজ চায়।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Docker", "Multi-stage Build", "DevOps"],
    tests: [
      {
        input: `3
STAGE builder
LAYER node-modules 420
LAYER source 12
LAYER toolchain 600
STAGE test
LAYER test-deps 90
COPY builder 8
STAGE runtime
LAYER base 40
COPY builder 8
`,
        expectedOutput: "FINAL: runtime\nSIZE: 48\nDISCARDED: toolchain 600\n",
        isSample: true,
      },
      {
        input: `1
STAGE app
LAYER base 40
LAYER app 12
`,
        expectedOutput: "FINAL: app\nSIZE: 52\nDISCARDED: none\n",
        isSample: true,
      },
      {
        input: `2
STAGE builder
LAYER deps 100
LAYER source 100
STAGE runtime
LAYER base 40
COPY builder 3
`,
        expectedOutput: "FINAL: runtime\nSIZE: 43\nDISCARDED: deps 100\n",
        isSample: false,
      },
      {
        input: `2
STAGE builder
LAYER deps 500
STAGE scratch
`,
        expectedOutput: "FINAL: scratch\nSIZE: 0\nDISCARDED: deps 500\n",
        isSample: false,
      },
      {
        input: `3
STAGE base
LAYER os 30
STAGE build
COPY base 30
LAYER node 90
LAYER dist 5
STAGE runtime
LAYER slim 20
COPY build 5
COPY build 2
`,
        expectedOutput: "FINAL: runtime\nSIZE: 27\nDISCARDED: node 90\n",
        isSample: false,
      },
      {
        input: `2
STAGE build
LAYER dist 12
STAGE runtime
LAYER base 40
COPY build 12
`,
        expectedOutput: "FINAL: runtime\nSIZE: 52\nDISCARDED: dist 12\n",
        isSample: false,
      },
    ],
    referencePython: IMAGE_SIZE_PY,
  },
];
