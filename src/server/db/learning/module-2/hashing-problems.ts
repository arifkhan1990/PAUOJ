import type { SeedProblem } from "../../seed-problems";

export const HASHING_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m2-hashing-g1",
    title: "Word Frequency Counter",
    statement: `ক্যাম্পাস ক্যান্টিনের টোকেন কাউন্টারে নুসরাত সারা দিনের অর্ডারের শব্দগুলো খাতায় লিখছিলেন, কিন্তু সন্ধেবেলা মিলিয়ে দেখতে গেলে প্রতিটি শব্দ বারবার খুঁজতে হয়। তুমি একটা ছোট প্রোগ্রাম লেখো যেটা প্রতিটি শব্দ কতবার এসেছে গোনে এবং ফলাফল নির্দিষ্ট ক্রমে ছাপে।\n\nপ্রথম লাইনে \`n\` — মোট শব্দ সংখ্যা। দ্বিতীয় লাইনে \`n\`টি শব্দ (ছোট হাতের ইংরেজি, স্পেস দিয়ে আলাদা)। শব্দগুলো পুনরাবৃত্তিও হতে পারে।`,
    inputFormat: `প্রথম লাইনে \`n\`।
দ্বিতীয় লাইনে \`n\`টি শব্দ, স্পেস দিয়ে আলাদা।`,
    outputFormat: `প্রতিটি আলাদা শব্দ এক লাইনে: \`word count\`। লাইনগুলো শব্দের বর্ণানুক্রমে (ascending)।`,
    constraints: `\`1 <= n <= 200000\`
প্রতিটি শব্দের দৈর্ঘ্য \`1 <= len(word) <= 20\`।
শব্দ শুধু ছোট হাতের ইংরেজি অক্ষর দিয়ে তৈরি।`,
    editorial: `## ধারণা\nপ্রতিটি শব্দ কতবার এসেছে জানতে হলে একটা কাউন্টার ম্যাপ ধরতে হবে: শব্দটা key, সংখ্যাটা value। প্রতিটি শব্দ একবার দেখা হলেই ম্যাপের ঘরটা এক ধাক্কা বাড়ে, তাই মোট সময় \`O(n)\`। শেষে key-গুলো সাজিয়ে ছাপলে ফল নির্দিষ্ট হয় — কারণ হ্যাশ ম্যাপ নিজে ক্রম ধরে রাখে না, আর এক রানে যে ক্রম আসে অন্য রানে ভিন্ন হলে জাজ ফেল দেয়।\n\n## ধাপে ধাপে\n1. \`n\` আর শব্দগুলো একসাথে পড়ে নাও।\n2. \`Counter()\` দিয়ে সব শব্দের হিসাব এক ধাপে নাও।\n3. \`sorted(freq)\` করে বর্ণানুক্রমে ঘোরো।\n4. প্রতিটি শব্দের জন্য \`word count\` এক লাইনে ছাপাও。\n\n\`\`\`python\nimport sys\nfrom collections import Counter\ndata = sys.stdin.read().split()\nn = int(data[0])\nwords = data[1:]\nfreq = Counter(words)\nfor word in sorted(freq):\n    print(word, freq[word])\n\`\`\`\n\n## কমপ্লেক্সিটি\nসময় \`O(n)\` গোনা + \`O(u \log u)\` সাজানো, যেখানে \`u\` আলাদা শব্দ সংখ্যা (\`u <= n\`)। মেমোরি \`O(u)\`।\n\n## সাধারণ ভুল\n- ফল যে ক্রমে ছাপা — ক্রম নির্ভর করছে ম্যাপের অভ্যন্তরীণ বিন্যাসে, তাই প্রতিবার ভিন্ন হতে পারে। সবসময় \`sorted\` দিয়ে সাজাও।
- \`for word in set(words):\` দিয়েও কাজ চলে, কিন্তু তখন আলাদা করে কাউন্ট করতে হয় — একাধিক লুপ, আর ভুল হওয়ার সুযোগ বেশি।
- খালি ইনপুট বা \`n\` না দেখে পুরো লাইন ঘোরা — \`n\` অনুযায়ী ঠিক \`n\` টি শব্দ নাও।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Hashing", "Hash Map", "Counting"],
    tests: [
      { input: "5\napple banana apple mango banana\n", expectedOutput: "apple 2\nbanana 2\nmango 1\n", isSample: true },
      { input: "3\ntea tea tea\n", expectedOutput: "tea 3\n", isSample: true },
      { input: "1\nhello\n", expectedOutput: "hello 1\n", isSample: false },
      { input: "4\nzebra apple zebra apple\n", expectedOutput: "apple 2\nzebra 2\n", isSample: false },
      { input: `200000\n${Array(200000).fill("x").join(" ")}\n`, expectedOutput: "x 200000\n", isSample: false },
      { input: `200000\n${Array.from({ length: 200000 }, (_, i) => (i % 2 ? "bb" : "aa")).join(" ")}\n`, expectedOutput: "aa 100000\nbb 100000\n", isSample: false },
    ],
    referencePython:
      "import sys\nfrom collections import Counter\ndata = sys.stdin.read().split()\nn = int(data[0])\nwords = data[1:]\nfreq = Counter(words)\nfor word in sorted(freq):\n    print(word, freq[word])\n",
  },
  {
    slug: "learn-m2-hashing-g2",
    title: "Find the First Two-Sum Pair",
    statement: `রফি ক্লাবের ফান্ডে দুইটা অনুদান মিলিয়ে ঠিক \`target\` টাকা করতে চায়। তার কাছে অনুদানের সারি আছে, আর সে বলল — বাঁ পাশ থেকে প্রথম যে জোড়াটা মিলিয়ে \`target\` হয়, সেটাই দেখাও; প্রথমে ছোট \`i\` চাই, সমান হলে ছোট \`j\`। কোনো জোড়া না মিললে \`NOT FOUND\`।\n\nপ্রথম লাইনে দুইটা সংখ্যা \`n\` আর \`target\`, দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা। জোড়ায় \`i < j\` থাকবে এবং \`a_i + a_j = target\`।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`target\`।
দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।`,
    outputFormat: `পাওয়া গেলে এক লাইনে \`i j\` (১-ভিত্তিক ইনডেক্স); না পাওয়া গেলে \`NOT FOUND\`।`,
    constraints: `\`2 <= n <= 200000\`
\`-10^9 <= a_i, target <= 10^9\`।`,
    editorial: `## ধারণা\nসব জোড়া মিলিয়ে দেখলে \`O(n^2)\` — অচল। বদলে ডান পাশ থেকে একবার ঘুরে প্রতিটি মানের জন্য জানে রাখো ডানে কোথায় প্রথম মিল পাওয়া যায়। একটা ম্যাপ রাখা যায় \`value -> সবচেয়ে বামের ইনডেক্স\` (ডান থেকে বাঁয়ে ঘোরার সময় সবসময় ছোট ইনডেক্সটাই বসে)। তারপর বাঁ থেকে ডানে এক লুপে \`target - a_i\` খুঁজে প্রথম মিলটাই উত্তর — এতে \`i\` সর্বনিম্ন, আর \`j\`-ও সেই \`i\`-এর জন্য সর্বনিম্ন।\n\n## ধাপে ধাপে\n1. \`n\`, \`target\` আর সব মান পড়ে নাও।\n2. ডান থেকে বাঁয়ে ঘুরে একটা ম্যাপ বানাও: প্রতিটি ইনডেক্সে আগে \`target - a_i\` খোঁজো (ম্যাপে যা আছে তা সব \`i\`-এর ডানে), তারপর \`a_i\`-কে ম্যাপে বসাও (ছোট ইনডেক্স দিয়ে)।\n3. পাওয়া ইনডেক্সগুলো এক তালিকায় রাখো।\n4. বাঁ থেকে ডানে প্রথম যে \`i\`-তে জোড়া পাওয়া গেছে, সেটা ছাপাও; না থাকলে \`NOT FOUND\`।\n\n\`\`\`python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn, target = data[0], data[1]\na = data[2:]\nnxt = [None] * n\nbest = {}\nfor i in range(n - 1, -1, -1):\n    comp = target - a[i]\n    if comp in best:\n        nxt[i] = best[comp]\n    best[a[i]] = i\nfor i in range(n):\n    if nxt[i] is not None:\n        print(i + 1, nxt[i] + 1)\n        break\nelse:\n    print("NOT FOUND")\n\`\`\`\n\n## কমপ্লেক্সিটি\nসময় \`O(n)\` — দুইটাই এক লুপ। মেমোরি \`O(n)\` (\`nxt\` তালিকা আর ম্যাপ)।\n\n## সাধারণ ভুল\n- ম্যাপে ঢোকানো আর খোঁজার ক্রম উল্টানো — তাহলে নিজের সাথে নিজের জোড়া ধরা পড়ে (\`i = j\`), বা বাঁ পাশের মিল চলে আসে।
- \`i < j\` না মেনে ১-ভিত্তিক ইনডেক্সে ভুল যোগ — উত্তরে \`+1\` ভুলে গেলে জাজ মানবে না।
- প্রথম পাওয়া জোড়াটাই ছাপা না করে যেকোনো জোড়া ছাপা — নমুনায় \`i\` সর্বনিম্ন চাওয়া হয়েছে।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Hashing", "Hash Set", "Two Sum"],
    tests: [
      { input: "5 9\n2 7 11 15 1\n", expectedOutput: "1 2\n", isSample: true },
      { input: "3 10\n1 2 3\n", expectedOutput: "NOT FOUND\n", isSample: true },
      { input: "4 10\n5 5 3 7\n", expectedOutput: "1 2\n", isSample: false },
      { input: "5 6\n3 3 3 3 3\n", expectedOutput: "1 2\n", isSample: false },
      { input: "4 4\n2 3 1 3\n", expectedOutput: "2 3\n", isSample: false },
      { input: `200000 0\n${Array(200000).fill(0).join(" ")}\n`, expectedOutput: "1 2\n", isSample: false },
      { input: `200000 1000000000\n${Array.from({ length: 200000 }, (_, i) => i + 1).join(" ")}\n`, expectedOutput: "NOT FOUND\n", isSample: false },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, target = data[0], data[1]\na = data[2:]\nnxt = [None] * n\nbest = {}\nfor i in range(n - 1, -1, -1):\n    comp = target - a[i]\n    if comp in best:\n        nxt[i] = best[comp]\n    best[a[i]] = i\nfor i in range(n):\n    if nxt[i] is not None:\n        print(i + 1, nxt[i] + 1)\n        break\nelse:\n    print('NOT FOUND')\n",
  },
  {
    slug: "learn-m2-hashing-e1",
    title: "First Repeated Value",
    statement: `তানভির হলের লটারি টিকিটের সিরিয়াল নম্বর মিলাচ্ছিলেন। কোনো নম্বর যদি আগে থেকেই আবার এসে থাকে, সেটা প্রথমে যেখানে দুবার হয়েছে সেটাই ধরতে চান — সেটাই সম্ভাব্য ভুল টিকিটের ইঙ্গিত।\n\nপ্রথম লাইনে \`n\`, দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা। বাঁ থেকে ডানে যে মানটা ইতিমধ্যে এসে ফেলেছে সেটা ছাপাও; কোনোটাই দ্বিতীয়বার না এলে \`NONE\`।`,
    inputFormat: `প্রথম লাইনে \`n\`।
দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।`,
    outputFormat: `প্রথম পুনরাবৃত্ত মান, অথবা \`NONE\`।`,
    constraints: `\`1 <= n <= 200000\`
\`0 <= a_i <= 10^9\`।`,
    editorial: `## ধারণা\nএকটা সেট বা ম্যাপ ধরে রাখবে যে যে মান ইতিমধ্যে দেখা হয়েছে। প্রতিটি মান পড়ার সময় আগে সেটে আছে কিনা দেখো — থাকলে সেটাই উত্তর, না থাকলে সেটে যোগ করে এগোও। খোঁজা আর যোগ দুটোই গড়ে \`O(1)\`, তাই পুরো ইনপুট \`O(n)\` সময়ে পার হয়।\n\n## ধাপে ধাপে\n1. \`n\` আর সব মান পড়ে নাও।\n2. খালি \`seen = set()\` নাও।\n3. প্রতিটি মানের জন্য: \`value in seen\` হলে সেটা ছাপে থামো, নাহলে \`seen.add(value)\` করো।\n4. শেষ পর্যন্ত কেউ না মিললে \`NONE\` ছাপাও।\n\n\`\`\`python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\nseen = set()\nfor value in a:\n    if value in seen:\n        print(value)\n        break\n    seen.add(value)\nelse:\n    print("NONE")\n\`\`\`\n\n## কমপ্লেক্সিটি\nসময় \`O(n)\`, মেমোরি \`O(n)\` (সবচেয়ে খারাপ ক্ষেত্রে সব আলাদা মান জমা হয়)।\n\n## সাধারণ ভুল\n- \`if value in seen: seen.add(value)\` — ভুল ক্রমে যোগ করলে প্রথম মানটাই দ্বিতীয়বার ধরা পড়ে।
- লুপ শেষ হওয়ার পরেও উত্তর ছাপা না করা: Python-এ \`for...else\` বা আলাদা \`flag\` দিয়ে \`NONE\` কেসটা সামলাও।
- পুরো তালিকা দুইবার ঘোরে \`value.count()\` বা \`index()\` দিয়ে — সেটা আবার \`O(n^2)\`।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Hashing", "Hash Set", "Arrays"],
    tests: [
      { input: "5\n1 2 3 2 4\n", expectedOutput: "2\n", isSample: true },
      { input: "3\n7 8 9\n", expectedOutput: "NONE\n", isSample: true },
      { input: "1\n5\n", expectedOutput: "NONE\n", isSample: false },
      { input: "4\n0 0 0 0\n", expectedOutput: "0\n", isSample: false },
      { input: "6\n4 5 6 4 5 6\n", expectedOutput: "4\n", isSample: false },
      { input: `200000\n${Array.from({ length: 200000 }, (_, i) => (i === 199999 ? 1 : i + 1)).join(" ")}\n`, expectedOutput: "1\n", isSample: false },
      { input: `200000\n${Array.from({ length: 200000 }, (_, i) => i + 1).join(" ")}\n`, expectedOutput: "NONE\n", isSample: false },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\nseen = set()\nfor value in a:\n    if value in seen:\n        print(value)\n        break\n    seen.add(value)\nelse:\n    print('NONE')\n",
  },
  {
    slug: "learn-m2-hashing-m1",
    title: "Count Pairs With Given Sum",
    statement: `ক্লাবের ফান্ডে ঠিক \`target\` টাকা হওয়ার জন্য কয়টা জোড়া অনুদান মেলে সেটা রফি জানতে চায়। এক জোড়া হলো দুটি আলাদা অবস্থানের মান যাদের যোগ \`target\`; একই মান দুইবার থাকলে সেটা দুইটা আলাদা জোড়া হিসেবে ধরা হবে।\n\nপ্রথম লাইনে \`n\` আর \`target\`, দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা (ঋণাত্মকও হতে পারে)। মোট কয়টা জোড়া (\`i < j\`) পাওয়া যায় সেটা ছাপাও।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`target\`।
দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।`,
    outputFormat: `এক লাইনে জোড়ার সংখ্যা (০ হতে পারে)।`,
    constraints: `\`2 <= n <= 200000\`
\`-10^9 <= a_i, target <= 10^9\`।`,
    editorial: `## ধারণা\nজোড়া গোনার সবচেয়ে ভালো কৌশল: বাঁ থেকে ডানে একবার ঘুরে প্রতিটি মানের আগে কয়টা তার পূরক (\`target - value\`) এসেছে সেটা ম্যাপ থেকে পড়ে নাও। \`i\` থেকে আগের যে ঘরে \`target - a_i\` আছে, প্রতিটির সাথে \`a_i\` মিলিয়ে একটা করে জোড়া হয় — তাই ঘরের সংখ্যাটাই যোগ হয়ে যায়। এভাবে কখনো \`i = j\` হয় না, আর কোনো জোড়া দুইবার গোনা হয় না।\n\n## ধাপে ধাপে\n1. \`n\`, \`target\` আর সব মান পড়ে নাও।\n2. খালি \`freq = Counter()\` আর \`ans = 0\` নাও।\n3. প্রতিটি \`value\`-এর জন্য: \`ans += freq[target - value]\`, তারপর \`freq[value] += 1\`।\n4. শেষে \`ans\` ছাপাও।\n\n\`\`\`python\nimport sys\nfrom collections import Counter\ndata = list(map(int, sys.stdin.read().split()))\nn, target = data[0], data[1]\na = data[2:]\nfreq = Counter()\nans = 0\nfor value in a:\n    ans += freq[target - value]\n    freq[value] += 1\nprint(ans)\n\`\`\`\n\n## কমপ্লেক্সিটি\nসময় \`O(n)\` — এক লুপ, প্রতিটি ধাপে ম্যাপে গড়ে \`O(1)\`। মেমোরি \`O(u)\` (আলাদা মান)। উত্তর \`n(n-1)/2\` পর্যন্ত যেতে পারে, তাই Python-এর বড় সংখ্যা স্বয়ংক্রিয়ভাবে সামলায়।\n\n## সাধারণ ভুল\n- আগে \`freq[value] += 1\` করে তারপর খোঁজা — নিজের সাথে নিজের জোড়া ধরা পড়ে, উদাহরণে \`5 5 5 5\`-এ উত্তর বেড়ে যায়।
- \`target - value\` হিসেব করার সময় ঋণাত্মক মান এড়িয়ে যাওয়া — ম্যাপে ঋণাত্মক keyও স্বাভাবিকভাবে থাকে।
- জোড়া গোনার বদলে মান সাজিয়ে দুই পয়েন্টার চালানো — সম্ভব, কিন্তু এখানে হ্যাশিং দিয়ে \`O(n)\` পাওয়া যায়, তাই সেটাই কাজের।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Hashing", "Hash Map", "Counting"],
    tests: [
      { input: "5 9\n2 7 11 15 1\n", expectedOutput: "1\n", isSample: true },
      { input: "4 10\n5 5 5 5\n", expectedOutput: "6\n", isSample: true },
      { input: "3 0\n-1 1 0\n", expectedOutput: "1\n", isSample: false },
      { input: "6 4\n2 2 2 2 2 2\n", expectedOutput: "15\n", isSample: false },
      { input: "5 7\n1 2 3 4 5\n", expectedOutput: "2\n", isSample: false },
      { input: `200000 0\n${Array(200000).fill(0).join(" ")}\n`, expectedOutput: "19999900000\n", isSample: false },
      { input: `200000 1000000000\n${Array.from({ length: 200000 }, (_, i) => i + 1).join(" ")}\n`, expectedOutput: "0\n", isSample: false },
    ],
    referencePython:
      "import sys\nfrom collections import Counter\ndata = list(map(int, sys.stdin.read().split()))\nn, target = data[0], data[1]\na = data[2:]\nfreq = Counter()\nans = 0\nfor value in a:\n    ans += freq[target - value]\n    freq[value] += 1\nprint(ans)\n",
  },
  {
    slug: "learn-m2-hashing-h1",
    title: "Subarrays With Exactly K Distinct",
    statement: `প্রাইমএশিয়ার ক্লাব ফেয়ারে স্টলগুলো সারি সারি সাজানো ছিল — প্রতিটি স্টল এক ধরনের আইটেমই বিক্রি করছিল। তানভির একটা নিয়ম বানিয়েছেন: সারির যেকোনো ধারাবাহিক অংশ (পাশাপাশি একাধিক স্টল) যদি ঠিক \`k\` রকম আলাদা আইটেম ধরে, তাহলে সেটা একটা "মিক্সড অফার"। তুমি বলো পুরো সারিতে মোট কয়টা মিক্সড অফার পাওয়া যায়।\n\nপ্রথম লাইনে \`n\` আর \`k\`, দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা — সারা ধরে প্রতিটি স্টলের আইটেম (একই মান একাধিক স্টলে আসতে পারে)। \`i\` থেকে \`j\` পর্যন্ত অংশে (\`i <= j\`) যত আলাদা মান থাকে, ওই অংশে তত রকম আইটেম — ঠিক \`k\` রকমের আইটেম ধরা অংশটাই মিক্সড অফার।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`k\`।
দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।`,
    outputFormat: `এক লাইনে মিক্সড অফার সংখ্যা (০ হতে পারে)।`,
    constraints: `\`1 <= n <= 200000\`
\`1 <= k <= n\`
\`1 <= a_i <= 10^9\`।`,
    editorial: `## ধারণা\nপ্রতিটি \`i\` থেকে ঘুরে সেট ধরে গেলে \`O(n^2)\` — \`n = 200000\`-এ অচল। সোজা স্লাইডিং উইন্ডো দিয়েও "ঠিক \`k\`" ধরা যায় না: ডান প্রান্ত এগালে আলাদা মানের সংখ্যা কখনো বাড়ে, কখনো আগের মতোই থাকে — শর্তটা একদিকে (monotonic) নয়। এখানে কাজে লাগে পরিচিত কৌশল: \`exactly(k) = atMost(k) - atMost(k - 1)\`। "সর্বোচ্চ \`k\` রকম" শর্তটা monotonic, তাই ফ্রিকোয়েন্সি ম্যাপ আর দুই পয়েন্টার দিয়ে তা \`O(n)\`-এ গোনা যায়। যেসব অংশে সর্বোচ্চ \`k\` রকম আছে, তাদের মধ্যে \`k\`-এর কম রকম বাদ দিলেই শুধু ঠিক \`k\` রকমের অংশ থাকে — দুটো পাসের ফলের ব্যবধানই উত্তর।\n\n## ধাপে ধাপে\n1. \`n\`, \`k\` আর সব মান পড়ে নাও।\n2. \`at_most(limit)\` ফাংশন লেখো — খালি ফ্রিকোয়েন্সি ম্যাপ, \`left = 0\`, \`distinct = 0\`, \`total = 0\`।\n3. ডান প্রান্ত \`right\` এগিয়ে নাও: মানটা আগে না থাকলে \`distinct += 1\`, তারপর \`freq[value] += 1\`।\n4. \`distinct > limit\` হলে বাম প্রান্ত সরানো বন্ধ না হওয়া পর্যন্ত: \`freq[a[left]]\` কমাও, শূন্য হলে \`distinct -= 1\`, তারপর \`left += 1\`।\n5. \`total += right - left + 1\` — এই ডান প্রান্তে শেষ হওয়া সব উপযুক্ত অংশ এক ধাক্কায় গোনা।\n6. শেষে \`at_most(k) - at_most(k - 1)\` ছাপাও; \`k = 1\` হলে দ্বিতীয়টা শূন্য।\n\n\`\`\`python\nimport sys\nfrom collections import Counter\n\ndata = list(map(int, sys.stdin.read().split()))\nn, k = data[0], data[1]\na = data[2:]\n\ndef at_most(limit):\n    if limit < 1:\n        return 0\n    freq = Counter()\n    left = 0\n    distinct = 0\n    total = 0\n    for right, value in enumerate(a):\n        if freq[value] == 0:\n            distinct += 1\n        freq[value] += 1\n        while distinct > limit:\n            freq[a[left]] -= 1\n            if freq[a[left]] == 0:\n                distinct -= 1\n            left += 1\n        total += right - left + 1\n    return total\n\nprint(at_most(k) - at_most(k - 1))\n\`\`\`\n\n## কমপ্লেক্সিটি\nসময় \`O(n)\` — প্রতিটি প্রান্ত সর্বোচ্চ একবার ডানে যায়, একবার বামে আসে; দুটো পাস মিলেও একই হিসাব। মেমোরি \`O(d)\` — ফ্রিকোয়েন্সি ম্যাপে সর্বোচ্চ \`d\` আলাদা মান (\`d <= n\`)। উত্তর \`n(n+1)/2\` পর্যন্ত যেতে পারে (\`n = 200000\`-এ প্রায় \`2 * 10^10\`) — Python-এর বড় সংখ্যা নিজেই সামলায়।\n\n## সাধারণ ভুল\n- সোজা উইন্ডোতে \`distinct == k\` ধরার চেষ্টা — শর্তটা monotonic না হওয়ায় ডানে এগোনো যায়, কিন্তু ফল ঠিক থাকে না। \`exactly(k) = atMost(k) - atMost(k - 1)\`-ই নিরাপদ পথ।\n- \`at_most(k - 1)\` বাদ দিয়ে শুধু \`at_most(k)\` ছাপা — তাতে "সর্বোচ্চ \`k\`" গোনা হয়, "ঠিক \`k\`" নয়; নমুনা ১-এ উত্তর \`7\`-এর বদলে \`12\` আসবে।\n- ম্যাপে যোগ করা আর বাম প্রান্ত সরানোর ক্রম বদলানো, বা কাউন্ট শূন্য হলেও \`distinct\` না কমানো — উইন্ডো ভেঙে যায়, ফলে হিসাব আর \`O(n)\` দুটোই যায়।\n- আলাদা মান কম হলে উত্তর \`0\` — বিশেষ চেষ্টা লাগে না, দুটো ফল একই হলেই ব্যবধান শূন্য।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Hashing", "Sliding Window", "Two Pointers", "Subarray"],
    tests: [
      { input: "5 2\n1 2 1 2 3\n", expectedOutput: "7\n", isSample: true },
      { input: "4 1\n7 7 7 7\n", expectedOutput: "10\n", isSample: true },
      { input: "1 1\n5\n", expectedOutput: "1\n", isSample: false },
      { input: "3 2\n1 1 2\n", expectedOutput: "2\n", isSample: false },
      { input: "6 2\n1 1 1 2 2 2\n", expectedOutput: "9\n", isSample: false },
      { input: "4 3\n1 1 1 1\n", expectedOutput: "0\n", isSample: false },
      { input: `200000 1\n${Array(200000).fill(42).join(" ")}\n`, expectedOutput: "20000100000\n", isSample: false },
      { input: `200000 2\n${Array.from({ length: 200000 }, (_, i) => i + 1).join(" ")}\n`, expectedOutput: "199999\n", isSample: false },
    ],
    referencePython:
      "import sys\nfrom collections import Counter\n\ndata = list(map(int, sys.stdin.read().split()))\nn, k = data[0], data[1]\na = data[2:]\n\ndef at_most(limit):\n    if limit < 1:\n        return 0\n    freq = Counter()\n    left = 0\n    distinct = 0\n    total = 0\n    for right, value in enumerate(a):\n        if freq[value] == 0:\n            distinct += 1\n        freq[value] += 1\n        while distinct > limit:\n            freq[a[left]] -= 1\n            if freq[a[left]] == 0:\n                distinct -= 1\n            left += 1\n        total += right - left + 1\n    return total\n\nprint(at_most(k) - at_most(k - 1))\n",
  },
  {
    slug: "learn-m2-hashing-x1",
    title: "Most Frequent Value",
    statement: `ক্লাবের ভোটে প্রতিটি প্রার্থীর নম্বর সারি দিয়ে ভোট গোনাহচ্ছিল। সারা দিনের সবচেয়ে বেশি ভোট পাওয়া প্রার্থী কে, আর কতটা ভোট পেয়েছে সেটা বলো। একই সংখ্যা সবচেয়ে বেশি থাকলে ছোট সংখ্যাটাকে বেছে নিতে হবে।\n\nপ্রথম লাইনে \`n\`, দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা — ভোটের ক্রম।`,
    inputFormat: `প্রথম লাইনে \`n\`।
দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।`,
    outputFormat: `এক লাইনে \`value count\` — সবচেয়ে বেশিবার আসা মান আর তার সংখ্যা।`,
    constraints: `\`1 <= n <= 200000\`
\`1 <= a_i <= 10^9\`।`,
    editorial: `## ধারণা\nএক লুপে সব মানের হিসাব জমা করে তারপর সবচেয়ে বড়টা বের করা যায়। মূল কথা দুটো: হিসাব রাখা হবে \`Counter\`-এ, আর শেষে জয়ী নির্বাচনে টাই-ব্রেক নিশ্চিত করা। Python-এ \`min\`/\`max\`-এ \`key\` দিলে টাই হলে যেটা আগে আসে সেটাই থাকে, তাই কী হিসেবে \`(-count, value)\` দিলে প্রথমে বেশি কাউন্ট, সমান হলে ছোট মান জিতে যায়।\n\n## ধাপে ধাপে\n1. \`n\` আর সব মান পড়ে নাও।\n2. \`Counter(a)\` দিয়ে সব হিসাব নাও।\n3. \`min(freq, key=lambda v: (-freq[v], v))\` দিয়ে জয়ী বের করো।\n4. \`value count\` এক লাইনে ছাপাও।\n\n\`\`\`python\nimport sys\nfrom collections import Counter\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\nfreq = Counter(a)\nbest = min(freq, key=lambda v: (-freq[v], v))\nprint(best, freq[best])\n\`\`\`\n\n## কমপ্লেক্সিটি\nসময় \`O(n + u)\` গোনা আর শেষে \`O(u)\` খোঁজা (\`u\` আলাদা মান)। মেমোরি \`O(u)\`।\n\n## সাধারণ ভুল
- টাই-ব্রেক না দেওয়া: \`max(freq, key=freq.get)\`-এ সমান কাউন্ট হলে যেটা ম্যাপে আগে আসে সেটা চলে আসে, ফলে দুটো রানে ভিন্ন উত্তর।
- প্রথমেই সব মান সাজিয়ে \`Counter\` না করে ভেতরে আরেক লুপ চালানো — কাজ ঠিকই হয়, কিন্তু অপ্রয়োজনীয় \`O(n \log n)\`।
- \`count\` আর \`value\` উল্টে ছাপা — নমুনায় ধরা পড়ে।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Hashing", "Hash Map", "Counting"],
    tests: [
      { input: "6\n1 2 2 3 3 3\n", expectedOutput: "3 3\n", isSample: true },
      { input: "4\n5 5 1 1\n", expectedOutput: "1 2\n", isSample: true },
      { input: "1\n42\n", expectedOutput: "42 1\n", isSample: false },
      { input: "5\n7 7 7 7 7\n", expectedOutput: "7 5\n", isSample: false },
      { input: "3\n9 8 9\n", expectedOutput: "9 2\n", isSample: false },
      { input: `200000\n${Array(200000).fill(42).join(" ")}\n`, expectedOutput: "42 200000\n", isSample: false },
      { input: `200000\n${Array.from({ length: 200000 }, (_, i) => (i % 2 ? 2 : 1)).join(" ")}\n`, expectedOutput: "1 100000\n", isSample: false },
    ],
    referencePython:
      "import sys\nfrom collections import Counter\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\nfreq = Counter(a)\nbest = min(freq, key=lambda v: (-freq[v], v))\nprint(best, freq[best])\n",
  },
  {
    slug: "learn-m2-hashing-x2",
    title: "Group Anagram Words",
    statement: `ক্লাবের সংগীত দল সাজানোর সময় সাদিয়া দেখলেন কিছু শব্দ একই অক্ষরগুলো দিয়ে তৈরি — যেমন \`eat\` আর \`tea\`। একই অক্ষরে তৈরি সব শব্দকে একসাথে রাখতে হবে, দলগুলো সাজাবে দলের সবচেয়ে ছোট শব্দ অনুযায়ী, আর দলের ভেতরে শব্দগুলো বর্ণানুক্রমে।\n\nপ্রথম লাইনে \`n\`, দ্বিতীয় লাইনে \`n\`টি শব্দ (ছোট হাতের ইংরেজি)। প্রতিটি দল এক লাইনে, শব্দগুলো স্পেস দিয়ে আলাদা।`,
    inputFormat: `প্রথম লাইনে \`n\`।
দ্বিতীয় লাইনে \`n\`টি শব্দ, স্পেস দিয়ে আলাদা।`,
    outputFormat: `প্রতিটি দল এক লাইনে; লাইনগুলো দলের প্রথম শব্দ অনুযায়ী ক্রমানুযায়ী।`,
    constraints: `\`1 <= n <= 100000\`
প্রতিটি শব্দের দৈর্ঘ্য \`1 <= len(word) <= 20\`।
শব্দ শুধু ছোট হাতের ইংরেজি অক্ষর দিয়ে তৈরি।`,
    editorial: `## ধারণা\nদুটো শব্দ অ্যানাগ্রাম হলে তাদের বর্ণানুক্রমিকভাবে সাজালে হুবহু এক হয়। তাই প্রতিটি শব্দের সাজানো অক্ষরগুলোকে key ধরে ম্যাপে বসালেই সব একই দলের শব্দ একই ঘরে জমা হয়ে যায় — এটাই হ্যাশিং দিয়ে গ্রুপিংয়ের ক্লাসিক কৌশল। এরপর ঘরগুলো থেকে তালিকা বানিয়ে, প্রতিটি তালিকা সাজিয়ে, আর তালিকাগুলো তাদের প্রথম শব্দ অনুযায়ী সাজিয়ে ছাপালে উত্তর নির্দিষ্ট হয়।\n\n## ধাপে ধাপে\n1. \`n\` আর সব শব্দ পড়ে নাও।\n2. \`defaultdict(list)\` নাও; প্রতিটি শব্দের \`"".join(sorted(word))\` key বানিয়ে ওই ঘরে শব্দটা যোগ করো।\n3. প্রতিটি ঘরের তালিকা বর্ণানুক্রমে সাজাও।\n4. সব তালিকা তাদের প্রথম শব্দ অনুযায়ী সাজাও।\n5. প্রতিটি তালিকা এক লাইনে স্পেস দিয়ে ছাপাও।\n\n\`\`\`python\nimport sys\nfrom collections import defaultdict\ndata = sys.stdin.read().split()\nn = int(data[0])\nwords = data[1:]\ngroups = defaultdict(list)\nfor word in words:\n    groups["".join(sorted(word))].append(word)\nlines = [sorted(members) for members in groups.values()]\nlines.sort(key=lambda members: members[0])\nfor members in lines:\n    print(" ".join(members))\n\`\`\`\n\n## কমপ্লেক্সিটি\nসময় \`O(n \cdot L \log L)\` — \`L\` শব্দের দৈর্ঘ্য (প্রতিটি শব্দ সাজানো), তারপর গ্রুপ সাজানো। মেমোরি \`O(n \cdot L)\`।\n\n## সাধারণ ভুল\n- key হিসেবে মূল শব্দটা বসানো — তাহলে \`eat\` আর \`tea\` আলাদা ঘরে চলে যায়, দল ভেঙে যায়।
- দলগুলো ম্যাপের যে ক্রমে ছেড়ে দেওয়া — ক্রম অনিশ্চিত, তাই টেস্ট দুটো রানে ভিন্ন হয়। সবসময় আগে সাজাও।
- দলের ভেতরে শব্দ না সাজিয়ে ইনপুটের ক্রমে রাখা — নমুনায় \`eat tea\` চাওয়া হয়েছে, \`tea eat\` নয়।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Hashing", "Hash Map", "Strings", "Sorting"],
    tests: [
      { input: "3\neat tea tan\n", expectedOutput: "eat tea\ntan\n", isSample: true },
      { input: "2\nabc bca\n", expectedOutput: "abc bca\n", isSample: true },
      { input: "4\nx xy yx xx\n", expectedOutput: "x\nxx\nxy yx\n", isSample: false },
      { input: "1\nhello\n", expectedOutput: "hello\n", isSample: false },
      { input: "3\nab ba abc\n", expectedOutput: "ab ba\nabc\n", isSample: false },
      { input: `100000\n${Array(100000).fill("ab").join(" ")}\n`, expectedOutput: `${Array(100000).fill("ab").join(" ")}\n`, isSample: false },
      { input: `100000\n${Array.from({ length: 100000 }, (_, i) => ["ab", "ba", "cd", "dc"][i % 4]).join(" ")}\n`, expectedOutput: `${Array(25000).fill("ab").concat(Array(25000).fill("ba")).join(" ")}\n${Array(25000).fill("cd").concat(Array(25000).fill("dc")).join(" ")}\n`, isSample: false },
    ],
    referencePython:
      "import sys\nfrom collections import defaultdict\ndata = sys.stdin.read().split()\nn = int(data[0])\nwords = data[1:]\ngroups = defaultdict(list)\nfor word in words:\n    groups[''.join(sorted(word))].append(word)\nlines = [sorted(members) for members in groups.values()]\nlines.sort(key=lambda members: members[0])\nfor members in lines:\n    print(' '.join(members))\n",
  },
];
