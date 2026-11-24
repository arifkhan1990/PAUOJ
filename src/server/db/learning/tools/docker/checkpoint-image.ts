import type { SeedProblem } from "../../../seed-problems";

const CHECK_IMAGE_PY = `import re
import sys

SECRET_WORDS = ("PASSWORD", "TOKEN", "SECRET", "KEY", "PRIVATE")

def normalize(path):
    while path.startswith("./"):
        path = path[2:]
    return path

def is_secret_name(name):
    upper = name.upper()
    return any(word in upper for word in SECRET_WORDS)

def is_secret_file(path):
    base = path.rsplit("/", 1)[-1]
    if base == ".env" or base.startswith(".env."):
        return True
    if base.endswith(".pem") or base.endswith(".key") or base.endswith(".p12"):
        return True
    return base == "id_rsa"

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

def covers(source, path):
    source = normalize(source)
    if source in (".", ""):
        return True
    return path == source or path.startswith(source + "/")

def sources_of(line):
    args = [token for token in line.split()[1:] if not token.startswith("--")]
    return args[:-1]

raw = [line.strip() for line in sys.stdin.read().splitlines() if line.strip()]
position = 0
base = 0
files = []
patterns = []
lines = []
changed = []
while position < len(raw):
    parts = raw[position].split()
    key = parts[0]
    if key == "BASE":
        base = int(parts[1])
        position += 1
    elif key == "FILES":
        count = int(parts[1])
        position += 1
        for k in range(count):
            name, size = raw[position + k].rsplit(" ", 1)
            files.append((name, int(size)))
        position += count
    elif key == "IGNORE":
        count = int(parts[1])
        position += 1
        patterns = [raw[position + k] for k in range(count)]
        position += count
    elif key == "DOCKERFILE":
        count = int(parts[1])
        position += 1
        lines = [raw[position + k] for k in range(count)]
        position += count
    elif key == "CHANGED":
        count = int(parts[1])
        position += 1
        changed = [normalize(raw[position + k]) for k in range(count)]
        position += count
    else:
        position += 1

visible = [(name, size) for name, size in files if not ignored(name, patterns)]

copied = set()
for line in lines:
    if line.split()[0].upper() in ("COPY", "ADD"):
        for source in sources_of(line):
            for name, _size in visible:
                if covers(source, name):
                    copied.add(name)

size = base + sum(item for name, item in files if name in copied)

rebuild = []
parent_cached = True
for index in range(1, len(lines)):
    tokens = lines[index].split()
    command = tokens[0].upper() if tokens else ""
    invalid = not parent_cached
    if not invalid and command in ("COPY", "ADD"):
        for source in sources_of(lines[index]):
            if any(covers(source, path) for path in changed if not ignored(path, patterns)):
                invalid = True
                break
    if invalid:
        rebuild.append(index + 1)
        parent_cached = False

root = True
flags = set()
for line in lines:
    parts = line.split()
    kind = parts[0].upper()
    text = line.split(maxsplit=1)[1] if len(parts) > 1 else ""
    if kind == "USER":
        user = text.strip()
        root = user in ("0", "0:0", "root") or user.startswith("0:")
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

if any(is_secret_file(name) for name in copied):
    leak = "COPY_SECRET"
elif "ENV_SECRET" in flags:
    leak = "ENV_SECRET"
elif "BUILD_ARG" in flags:
    leak = "BUILD_ARG"
elif "RUN_ECHO" in flags:
    leak = "RUN_ECHO"
else:
    leak = "SAFE"

if leak != "SAFE" or root:
    verdict = "BLOCKED"
elif len(lines) > 1 and len(rebuild) == len(lines) - 1:
    verdict = "WARN"
else:
    verdict = "SHIP"

print("REBUILD: " + (" ".join(str(index) for index in rebuild) if rebuild else "none"))
print("HITS: " + str(len(lines) - len(rebuild)))
print("SIZE: " + str(size))
print("FILES: " + (" ".join(sorted(copied)) if copied else "none"))
print("LEAK: " + leak)
print("ROOT: " + ("yes" if root else "no"))
print("VERDICT: " + verdict)
`;

export const CHECKPOINT_IMAGE_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-docker-check-image",
    title: "Checkpoint: Review the Image",
    statement: `রিলিজের আগে তাসনিমের production review — একটা Dockerfile আর build context দেখে বলতে হবে ইমেজটা ছাড়ার যোগ্য কি না। নুসরাতকে তিনটা জিনিস দেখতে হবে: বদলানো ফাইলে কোন লেয়ার আবার তৈরি হবে, ফাইনাল ইমেজে কী কী ফাইল ঢুকছে আর তার সাইজ, আর কোনো সিক্রেট লিক হচ্ছে কি না। মাহিন বলল, রায় নির্ভর করে লিক, root ব্যবহার আর ক্যাশের অবস্থার ওপর।

নিয়ম: context-এর যে ফাইল \`.dockerignore\` বাদ দেয় না, সেটাই বিল্ডে যায়; \`COPY <সোর্স>\` সোর্সের নিচের সব দৃশ্যমান ফাইল ইমেজে নেয়, আর \`.\` মানে সব। ইমেজের সাইজ = \`BASE\` + কপি হওয়া ফাইলের সাইজের যোগফল। লেয়ার-ক্যাশ: \`FROM\` সবসময় ক্যাশে; কোনো লেয়ার তৈরি হলে পরের সবও তৈরি, আর \`COPY\`/\`ADD\`-এর সোর্সে ignore না করা কোনো বদলানো পাথ পড়লে সেটা ভাঙে। লিকের ক্রম: কপি হওয়া কোনো ফাইল \`.env\`, \`.env.*\`, \`*.pem\`, \`*.key\`, \`*.p12\` বা \`id_rsa\` হলে \`COPY_SECRET\`, \`ENV\`-এ সিক্রেট-নাম হলে \`ENV_SECRET\`, সিক্রেট-নামের \`ARG\`-এ ডিফল্ট থাকলে \`BUILD_ARG\`, \`RUN\`-এ \`$\` দিয়ে সিক্রেট-নাম থাকলে \`RUN_ECHO\`, নাহলে \`SAFE\`। \`USER\` না থাকলে বা \`root\`/\`0\`/\`0:\` হলে root। রায়: লিক বা root থাকলে \`BLOCKED\`; নাহলে \`FROM\`-এর পরের সব লেয়ার তৈরি হলে \`WARN\`; নাহলে \`SHIP\`।`,
    inputFormat: `ক্রমে \`BASE <mb>\`, \`FILES <f>\` ও \`f\`টা \`<পাথ> <mb>\`, \`IGNORE <i>\` ও \`i\`টা প্যাটার্ন, \`DOCKERFILE <n>\` ও \`n\`টা লাইন, \`CHANGED <c>\` ও \`c\`টা পাথ।`,
    outputFormat: `সাত লাইন: \`REBUILD:\` (আবার তৈরি হওয়া লেয়ারগুলোর ১-ভিত্তিক Dockerfile লাইন নম্বর, কিছু না হলে \`none\`), \`HITS:\` (ক্যাশ থেকে আসা লাইনের সংখ্যা, \`FROM\` সহ), \`SIZE:\`, \`FILES:\` (সাজানো, কিছু না থাকলে \`none\`), \`LEAK:\`, \`ROOT: yes|no\`, \`VERDICT: SHIP|WARN|BLOCKED\`।`,
    constraints: `\`1 <= n <= 10\`, \`1 <= f <= 10\`, \`0 <= i <= 5\`
প্রথম লাইন \`FROM\`; কোনো \`COPY --from\` নেই; সাইজ পূর্ণ MB-তে।`,
    editorial: `## ধারণা
একটা প্রোডাকশন ইমেজ রিভিউ চারটা প্রশ্নের উত্তর চায়। ক্যাশ: সোর্স আগে কপি করলে প্রতিটি কোড পরিবর্তনে install লেয়ার ভাঙে, তাই dependency ফাইল আগে, সোর্স পরে। বিষয়বস্তু: ফাইনাল ইমেজে কেবল সেই ফাইলগুলোই থাকা উচিত যেগুলো রানটাইমে দরকার; \`COPY . .\` আর দুর্বল \`.dockerignore\` মিলে টেস্ট, লোগ, লোকাল সিক্রেট সব ইমেজে ঢুকিয়ে দেয়। সিক্রেট: \`.env\` কপি, \`ENV\`-এ টোকেন, \`ARG\`-এ ডিফল্ট পাসওয়ার্ড, \`RUN echo $TOKEN\` — চারটাই ইমেজ বা হিস্টোরিতে থেকে যায়। ইউজার: \`USER\` না দিলে প্রসেস root-এ চলে, আর কনটেইনার থেকে হোস্টে প্রভাব ফেলার ঝুঁকি বাড়ে। এই চারটার সমন্বয়েই রায় ঠিক হয়।

## ধাপে ধাপে
1. \`BASE\`, ফাইল-তালিকা, ignore, Dockerfile আর changed পাথ পড়ো।
2. দৃশ্যমান ফাইল ঠিক করো; প্রতিটি \`COPY\`/\`ADD\`-এর সোর্সের নিচের দৃশ্যমান ফাইল ইমেজে যোগ করো।
3. সাইজ = \`BASE\` + কপি হওয়া ফাইলের যোগফল।
4. \`FROM\`-এর পরে লেয়ার ধরে ক্যাশ দেখো; ignore না করা বদলানো পাথ সোর্সে পড়লে ভাঙো।
5. লিকের চারটা নিয়ম ক্রমে দেখো, \`USER\` থেকে root ঠিক করো, শেষে রায় ছাপো।

\`\`\`python
${CHECK_IMAGE_PY}\`\`\`

## কমপ্লেক্সিটি
সময় \`O(N * F + N * C)\`, মেমোরি \`O(F + N)\`; \`F\` context ফাইল, \`N\` Dockerfile লাইন, \`C\` changed পাথ।

## সাধারণ ভুল
- \`.dockerignore\`-এ \`.env\` থাকলেই সিক্রেট নিরাপদ ভাবা — \`ENV\` বা \`ARG\` দিয়ে বসানো টোকেন তখনও লিক করে।
- \`USER\` লাইন না থাকা অবস্থায় ইমেজ SHIP করা — ডিফল্টে প্রসেস root হিসেবে চলে।
- সব লেয়ার ভাঙলে \`WARN\`-এর বদলে \`BLOCKED\` দেওয়া — ধীর বিল্ড রিলিজ আটকায় না, কিন্তু সতর্কতা দরকার।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Docker", "DevOps", "Production Review"],
    tests: [
      {
        input: `BASE 40
FILES 4
package.json 1
pnpm-lock.yaml 4
src/app.ts 2
.env 1
IGNORE 1
.env
DOCKERFILE 6
FROM node:24-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY src ./src
USER node
CHANGED 1
src/app.ts
`,
        expectedOutput: `REBUILD: 5 6
HITS: 4
SIZE: 47
FILES: package.json pnpm-lock.yaml src/app.ts
LEAK: SAFE
ROOT: no
VERDICT: SHIP
`,
        isSample: true,
      },
      {
        input: `BASE 50
FILES 3
package.json 2
dist/app.js 3
.env 1
IGNORE 0
DOCKERFILE 5
FROM node:24-alpine
COPY . .
RUN npm ci
ENV API_TOKEN=sk_live_123
CMD ["node", "dist/app.js"]
CHANGED 0
`,
        expectedOutput: `REBUILD: none
HITS: 5
SIZE: 56
FILES: .env dist/app.js package.json
LEAK: COPY_SECRET
ROOT: yes
VERDICT: BLOCKED
`,
        isSample: true,
      },
      {
        input: `BASE 30
FILES 2
package.json 1
src/app.ts 2
IGNORE 0
DOCKERFILE 4
FROM node:24-alpine
COPY . .
RUN npm ci
USER node
CHANGED 1
src/app.ts
`,
        expectedOutput: `REBUILD: 2 3 4
HITS: 1
SIZE: 33
FILES: package.json src/app.ts
LEAK: SAFE
ROOT: no
VERDICT: WARN
`,
        isSample: false,
      },
      {
        input: `BASE 10
FILES 2
app.js 5
.env 1
IGNORE 1
.env
DOCKERFILE 4
FROM node:24-alpine
COPY . .
RUN npm ci
USER node
CHANGED 0
`,
        expectedOutput: `REBUILD: none
HITS: 4
SIZE: 15
FILES: app.js
LEAK: SAFE
ROOT: no
VERDICT: SHIP
`,
        isSample: false,
      },
      {
        input: `BASE 20
FILES 1
app.js 5
IGNORE 0
DOCKERFILE 4
FROM node:24-alpine
ARG DB_PASSWORD=hunter2
COPY app.js ./
USER node
CHANGED 0
`,
        expectedOutput: `REBUILD: none
HITS: 4
SIZE: 25
FILES: app.js
LEAK: BUILD_ARG
ROOT: no
VERDICT: BLOCKED
`,
        isSample: false,
      },
      {
        input: `BASE 20
FILES 2
app.js 5
secret.txt 1
IGNORE 0
DOCKERFILE 5
FROM node:24-alpine
ARG TOKEN
COPY app.js ./
RUN echo "$TOKEN" > /tmp/t
CMD ["node", "app.js"]
CHANGED 0
`,
        expectedOutput: `REBUILD: none
HITS: 5
SIZE: 25
FILES: app.js
LEAK: RUN_ECHO
ROOT: yes
VERDICT: BLOCKED
`,
        isSample: false,
      },
      {
        input: `BASE 40
FILES 4
src/app.js 3
src/app.js.map 2
node_modules/x/index.js 9
package.json 1
IGNORE 2
node_modules/
*.map
DOCKERFILE 4
FROM node:24-alpine
COPY package.json ./
COPY src ./src
USER node
CHANGED 1
src/app.js
`,
        expectedOutput: `REBUILD: 3 4
HITS: 2
SIZE: 44
FILES: package.json src/app.js
LEAK: SAFE
ROOT: no
VERDICT: SHIP
`,
        isSample: false,
      },
      {
        input:
          'BASE 30\nFILES 2\napp.js 2\n.env 1\nIGNORE 0\nDOCKERFILE 5\nFROM node:24-alpine\nCOPY .env ./\nCOPY app.js ./\nUSER node\nCMD ["node", "app.js"]\nCHANGED 0\n',
        expectedOutput:
          "REBUILD: none\nHITS: 5\nSIZE: 33\nFILES: .env app.js\nLEAK: COPY_SECRET\nROOT: no\nVERDICT: BLOCKED\n",
        isSample: false,
      },
    ],
    referencePython: CHECK_IMAGE_PY,
  },
];
