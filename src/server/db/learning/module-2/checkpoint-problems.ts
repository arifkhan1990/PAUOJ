import type { SeedProblem } from "../../seed-problems";
import { newlineOutput } from "../generated-tests";

export const MODULE2_CHECKPOINT_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m2-checkpoint-1",
    title: "Double-Ended Help Desk",
    statement: `প্রাইমএশিয়ার হেল্প ডেস্কে ছাত্ররা দুই পাশ থেকে টোকেন দেয় — সামনের পাশেও যোগ হয়, পেছনের পাশেও। কাউকে ফিরে যেতে হলে সামনে থেকেও বের করা যায়, পেছন থেকেও। তুমি এই ডাবল-এন্ডেড লাইনটা সিমুলেট করো।\n\nপ্রথম লাইনে \`n\` — অপারেশন সংখ্যা। পরের \`n\` লাইনে একটা করে অপারেশন:\n\n- \`1 x\` — সামনে \`x\` যোগ করো।\n- \`2 x\` — পেছনে \`x\` যোগ করো।\n- \`3\` — সামনে থেকে সরাও এবং মান ছাপাও।\n- \`4\` — পেছন থেকে সরাও এবং মান ছাপাও।\n- \`5\` — সামনের মান শুধু দেখাও (সরাবেন না)।\n- \`6\` — পেছনের মান শুধু দেখাও (সরাবেন না)।\n\nলাইন খালি হলে \`3\`, \`4\`, \`5\`, \`6\`-এ \`-1\` প্রিন্ট করুন।`,
    inputFormat: `প্রথম লাইনে \`n\`।
পরের \`n\` লাইনে অপারেশন — \`1 x\`, \`2 x\`, \`3\`, \`4\`, \`5\` বা \`6\`।`,
    outputFormat: `শুধু \`3\`, \`4\`, \`5\`, \`6\` অপারেশনের জন্য একটা করে লাইন; কোনো উত্তর না থাকলে কোনো লাইন ছাপবেন না।`,
    constraints: `\`1 <= n <= 200000\`
\`1 <= x <= 10^9\`।`,
    editorial: `## ধারণা\nএটা ঠিক \`deque\`-এর কাজ: দুই পাশেই \`O(1)\` সময়ে যোগ আর বাদ। Python-এ সাধারণ \`list\`-এর \`appendleft()\` আর \`pop()\`/\`append()\` হিসেবে নেওয়া যায়, কিন্তু \`pop(0)\` করলে পুরো তালিকা সরতে হয় — \`n = 200000\`-এ টাইম আউট। তাই কাজের কিউ/ডেকের জন্য \`deque\` বাধ্যতামূলক। উত্তরগুলো সংগ্রহ করে শেষে ছাপালে ফরম্যাট নিরাপদ থাকে।\n\n## ধাপে ধাপে\n1. \`n\` আর সব লাইন পড়ে নাও।\n2. খালি \`deque()\` আর ফাঁকা উত্তরের তালিকা নাও।\n3. প্রতিটি অপারেশনের প্রথম টোকেন দেখে বাছো:
   - \`1\` → \`appendleft(x)\`, \`2\` → \`append(x)\`।
   - \`3\` → খালি না হলে \`popleft()\`, খালি হলে \`-1\`।
   - \`4\` → খালি না হলে \`pop()\`, খালি হলে \`-1\`।
   - \`5\`/\`6\` → \`dq[0]\`/\`dq[-1]\`, খালি হলে \`-1\` (কিছু সরাবেন না)।
4. পাওয়া মান তালিকায় যোগ করো এবং শেষে এক এক লাইনে ছাপাও।\n\n\`\`\`python\nimport sys\nfrom collections import deque\nlines = sys.stdin.read().splitlines()\nn = int(lines[0])\ndq = deque()\nout = []\nfor i in range(1, n + 1):\n    parts = lines[i].split()\n    op = parts[0]\n    if op == "1":\n        dq.appendleft(int(parts[1]))\n    elif op == "2":\n        dq.append(int(parts[1]))\n    elif op == "3":\n        out.append(str(dq.popleft()) if dq else "-1")\n    elif op == "4":\n        out.append(str(dq.pop()) if dq else "-1")\n    elif op == "5":\n        out.append(str(dq[0]) if dq else "-1")\n    else:\n        out.append(str(dq[-1]) if dq else "-1")\nsys.stdout.write("\\n".join(out))\n\`\`\`\n\n## কমপ্লেক্সিটি\nসময় \`O(n)\` — প্রতিটি অপারেশন \`O(1)\`, প্রিন্ট মিলিয়ে \`O(n)\`। মেমোরি \`O(n)\` (লাইন ও উত্তর)।\n\n## সাধারণ ভুল
- \`list.pop(0)\` ব্যবহার — প্রতিটি কল \`O(n)\`, বড় ইনপুটে টাইম আউট। সবসময় \`deque\`।
- খালি লাইনে \`dq[0]\` ধরে নেওয়া — প্রথম অপারেশনেই ক্র্যাশ; প্রতিটি পড়ার আগে \`if dq\` চেক বাধ্যতামূলক।
- \`5\`/\`6\`-তেও \`popleft()\`/\`pop()\` করে ফেলা — উপাদান সরে যায়, পরের অপারেশনের উত্তর ভুল হয়।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Deque", "Queue", "Simulation"],
    tests: [
      { input: "6\n2 10\n2 20\n1 5\n3\n4\n5\n", expectedOutput: "5\n20\n10\n", isSample: true },
      { input: "4\n3\n4\n5\n6\n", expectedOutput: "-1\n-1\n-1\n-1\n", isSample: true },
      { input: "3\n1 7\n6\n4\n", expectedOutput: "7\n7\n", isSample: false },
      { input: "5\n2 1\n2 2\n2 3\n3\n3\n", expectedOutput: "1\n2\n", isSample: false },
      { input: "7\n1 1\n1 2\n2 3\n4\n3\n5\n6\n", expectedOutput: "3\n2\n1\n1\n", isSample: false },
      { input: `200000\n${Array(200000).fill("3").join("\n")}\n`, expectedOutput: newlineOutput(Array(200000).fill("-1")), isSample: false },
      { input: `200000\n${Array.from({ length: 100000 }, (_, i) => `2 ${i + 1}`).join("\n")}\n${Array(100000).fill("3").join("\n")}\n`, expectedOutput: newlineOutput(Array.from({ length: 100000 }, (_, i) => i + 1)), isSample: false },
    ],
    referencePython:
      "import sys\nfrom collections import deque\nlines = sys.stdin.read().splitlines()\nn = int(lines[0])\ndq = deque()\nout = []\nfor i in range(1, n + 1):\n    parts = lines[i].split()\n    op = parts[0]\n    if op == '1':\n        dq.appendleft(int(parts[1]))\n    elif op == '2':\n        dq.append(int(parts[1]))\n    elif op == '3':\n        out.append(str(dq.popleft()) if dq else '-1')\n    elif op == '4':\n        out.append(str(dq.pop()) if dq else '-1')\n    elif op == '5':\n        out.append(str(dq[0]) if dq else '-1')\n    else:\n        out.append(str(dq[-1]) if dq else '-1')\nsys.stdout.write('\\n'.join(out))\n",
  },
  {
    slug: "learn-m2-checkpoint-2",
    title: "Simplify the Campus Path",
    statement: `ক্যাম্পাসের ফাইল সার্ভারে পথগুলো অদ্ভুতভাবে লেখা: মাঝখানে \`.\` (এখানই), \`..\` (এক ধাপ উপরে) আর পাশাপাশি দুইটা \`/\` পর্যন্ত থাকে। তানভির বলেছেন পথটা যেন সহজ করা হয় — কোনো \`.\` বা \`..\` থাকবে না, শুরু একটাই \`/\`, আর শেষের অতিরিক্ত \`/\`ও থাকবে না। উদাহরণ: \`/a/./b/../../c/\` হবে \`/c\`।\n\nএক লাইনে একটা পথ আসে। সরলীকৃত পথটা ছাপাও; কিছুই না থাকলে শুধু \`/\`।`,
    inputFormat: `এক লাইনে একটা পথ \`path\` (অবশ্যই \`/\` দিয়ে শুরু)।`,
    outputFormat: `এক লাইনে সরলীকৃত পথ; কোনো সেগমেন্ট না থাকলে শুধু \`/\`।`,
    constraints: `\`1 <= len(path) <= 200000\`
পথে থাকতে পারে ছোট হাতের অক্ষর, সংখ্যা, \`-\`, \`_\`, \`.\` আর \`/\`।\nশুরু সবসময় \`/\`, এবং কোনো \`..\` মাটির নিচে যেতে পারে না — সেক্ষেত্রেও \`/\`-এই থাকবে।`,
    editorial: `## ধারণা\nএটা স্ট্যাকের ক্লাসিক ব্যবহার: সেগমেন্ট সামনে এলে ঢোকাও, \`.\` হলে উপেক্ষা করো, \`..\` হলে একটা তোলা (আগে থাকলে)। শেষে স্ট্যাকে যা আছে তাই পথের ভেতরের অংশ, সামনে \`/\` বসিয়ে দিলেই হয়। স্ট্যাক খালি থাকা অবস্থায় \`..\` এলে কিছু করতে হয় না — কারণ পথ ইতিমধ্যেই রুটে (\`/\`) পৌঁছে গেছে।\n\n## ধাপে ধাপে\n1. লাইনটা পড়ে শেষের নিউলাইন বাদ দাও।\n2. \`/\` দিয়ে ভাগ করে সেগমেন্ট তালিকা বানাও।\n3. প্রতিটি সেগমেন্টের জন্য: খালি বা \`.\` → বাদ; \`..\` → স্ট্যাক খালি না হলে \`pop()\`; অন্যথায় → \`append()\`।\n4. \`"/" + "/".join(stack)\` ছাপাও — স্ট্যাক খালি হলে শুধু \`/\` বের হয়।\n\n\`\`\`python\nimport sys\npath = sys.stdin.readline().strip()\nstack = []\nfor segment in path.split("/"):\n    if segment == "" or segment == ".":\n        continue\n    if segment == "..":\n        if stack:\n            stack.pop()\n    else:\n        stack.append(segment)\nprint("/" + "/".join(stack))\n\`\`\`\n\n## কমপ্লেক্সিটি\nসময় \`O(len(path))\` — প্রতিটি সেগমেন্ট একবার দেখা হয় এবং সর্বোচ্চ একবার ঢোকে-বের হয়। মেমোরি \`O(len(path))\` (স্ট্যাক)।\n\n## সাধারণ ভুল
- স্ট্যাক খালি হলেও \`pop()\` ডাকা — \`/../\`-এ ক্র্যাশ হয়; আগে \`if stack:\` চেক।
- শেষের ট্রেলিং \`/\` না কাটা বা উল্টোভাবে সবসময় \`/\` বসিয়ে দেওয়া — \`/a\`-এ \`/a/\` হয়ে যায়। \`join\` নিজে থেকে বাড়তি \`/\` দেয় না।
- কেবল \`.\` বাদ দিয়ে \`..\`-ও অগ্রাহ্য করা — তাহলে \`/a/../../b\` হবে \`/a/b\`, অথিক ভুল। উদাহরণে ধরা আছে।
- খালি সেগমেন্ট বাদ না দেওয়া (\`split\`-এ পাশাপাশি \`//\` থেকে যায়) — ভেতরে দুইটা \`/\` চলে আসে।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Stack", "String", "Parsing"],
    tests: [
      { input: "/a/./b/../../c/\n", expectedOutput: "/c\n", isSample: true },
      { input: "/home//foo/\n", expectedOutput: "/home/foo\n", isSample: true },
      { input: "/\n", expectedOutput: "/\n", isSample: false },
      { input: "/../\n", expectedOutput: "/\n", isSample: false },
      { input: "/a/../../b/c\n", expectedOutput: "/b/c\n", isSample: false },
      { input: "/x/y/../z/./\n", expectedOutput: "/x/z\n", isSample: false },
      { input: `/${Array.from({ length: 50000 }, (_, i) => `s${i}`).join("/")}/${"../".repeat(50000)}\n`, expectedOutput: "/\n", isSample: false },
    ],
    referencePython:
      "import sys\npath = sys.stdin.readline().strip()\nstack = []\nfor segment in path.split('/'):\n    if segment == '' or segment == '.':\n        continue\n    if segment == '..':\n        if stack:\n            stack.pop()\n    else:\n        stack.append(segment)\nprint('/' + '/'.join(stack))\n",
  },
  {
    slug: "learn-m2-checkpoint-3",
    title: "Longest Consecutive Number Run",
    statement: `সাদিয়া হলের লটারি নম্বর দেখছেন — কোনো একটা ধারাবাহিক অংশে যদি পরপর সংখ্যা (যেমন \`5, 6, 7, 8\`) এসে থাকে, সেটা সবচেয়ে বড় জয়ের ইঙ্গিত। তুমি বলো দেওয়া সংখ্যাগুলোর মধ্যে দীর্ঘতম ধারাবাহিক পূর্ণসংখ্যা ধারার দৈর্ঘ্য কত।\n\nপ্রথম লাইনে \`n\`, দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা (ঋণাত্মকও, একই মান একাধিকবারও)। ধারার প্রতিটি মান ইনপুটে অবশ্যই থাকতে হবে, কিন্তু ক্রম বা অবস্থান গুরুত্বপূর্ণ নয়; একই মান দুইবার থাকলেও ধারায় একবারই ধরা হবে। উদাহরণ: \`100 4 200 1 3 2\` → \`1 2 3 4\` → দৈর্ঘ্য \`4\`।`,
    inputFormat: `প্রথম লাইনে \`n\`।
দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।`,
    outputFormat: `এক লাইনে দীর্ঘতম ধারাবাহিক ধারার দৈর্ঘ্য।`,
    constraints: `\`1 <= n <= 200000\`
\`-10^9 <= a_i <= 10^9\`।`,
    editorial: `## ধারণা\nসবগুলো মান একটা \`set\`-এ রাখলে "মানটা আছে কিনা" গড়ে \`O(1)\`-এ জানা যায়। মূল কৌশল: যে মানটির আগেরটি (\`value - 1\`) সেটে নেই, সেটাই কোনো ধারার শুরু — সেখান থেকে শুরু করে ভেতরের দিকে যতক্ষণ \`value + 1\` মিলছে ততক্ষণ গোনা করলেই হয়। শুরু না হওয়া মানগুলোতে বারবার গোনা করলেও প্রতিটি ধারা শুধু একবার ঘোরা হয়, তাই মোট সময় গড়ে \`O(n)\`।\n\n## ধাপে ধাপে\n1. \`n\` আর সব মান পড়ে \`values = set(...)\` বানাও (ডুপ্লিকেট নিজে থেকেই মুছে যায়)।\n2. \`best = 0\` রাখো।\n3. প্রতিটি মানের জন্য দেখো \`value - 1\` কি সেটে নেই — নেই হলেই একটা নতুন ধারা শুরু।\n4. \`cur = value\` থেকে \`cur + 1\` সেটে থাকতে থাকে \`cur += 1\`, \`length += 1\`।\n5. \`best = max(best, length)\`, শেষে \`best\` ছাপাও।\n\n\`\`\`python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nvalues = set(data[1:])\nbest = 0\nfor value in values:\n    if value - 1 in values:\n        continue\n    length = 1\n    current = value\n    while current + 1 in values:\n        current += 1\n        length += 1\n    if length > best:\n        best = length\nprint(best)\n\`\`\`\n\n## কমপ্লেক্সিটি\nসময় গড়ে \`O(n)\` — প্রতিটি মান শুধু তখনই ভেতরের লুপে আসে যখন সে কোনো ধারার শুরু থেকে ঘোরা হয়, আর প্রতিটি ধারা একবারই ঘোরা হয়। মেমোরি \`O(n)\` (সেট)।\n\n## সাধারণ ভুল
- ইনপুট ক্রমেই ধারা ভাবা — \`100 4 200 1 3 2\`-এ ক্রম ভাঙা, তবু উত্তর \`4\`; সাজিয়ে দেখতে হলে \`O(n \log n)\` লাগবে।
- ডুপ্লিকেট গুনে ফেলা — \`1 1 1\`-এ দৈর্ঘ্য \`3\` না হয়ে \`1\` হবে; \`set\` নিলেই সমস্যাটা থাকে না।
- প্রতিটি মান থেকে ভেতরের লুপ চালানো (শুরু না দেখে) — তখন \`O(n^2)\`, যেমন সব মান পরপর হলে প্রতিটি থেকে পুরো ধারা ঘুরে।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Hashing", "Hash Set", "Arrays"],
    tests: [
      { input: "6\n100 4 200 1 3 2\n", expectedOutput: "4\n", isSample: true },
      { input: "5\n5 4 3 2 1\n", expectedOutput: "5\n", isSample: true },
      { input: "1\n7\n", expectedOutput: "1\n", isSample: false },
      { input: "4\n1 1 1 1\n", expectedOutput: "1\n", isSample: false },
      { input: "6\n10 11 1 2 3 4\n", expectedOutput: "4\n", isSample: false },
      { input: `200000\n${Array.from({ length: 200000 }, (_, i) => i + 1).join(" ")}\n`, expectedOutput: "200000\n", isSample: false },
      { input: `200000\n${Array.from({ length: 200000 }, (_, i) => 2 * (i + 1)).join(" ")}\n`, expectedOutput: "1\n", isSample: false },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nvalues = set(data[1:])\nbest = 0\nfor value in values:\n    if value - 1 in values:\n        continue\n    length = 1\n    current = value\n    while current + 1 in values:\n        current += 1\n        length += 1\n    if length > best:\n        best = length\nprint(best)\n",
  },
];
