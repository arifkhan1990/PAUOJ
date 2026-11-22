import type { SeedProblem } from "../../seed-problems";
import { newlineOutput } from "../generated-tests";

export const STL_COLLECTIONS_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m2-stl-collections-g1",
    title: "Sort and Remove Duplicates",
    statement: `রফি ক্লাবের সদস্যদের আইডি তালিকাটা এক পাতায় সাজিয়ে রাখতে চায় — একটা আইডি একবারই থাকবে, আর ছোট থেকে বড় ক্রমে সাজানো। কাগজে হাতে সাজানো সহজ, কিন্তু তুমি তো কালেকশন দিয়ে এক লাইনেই করে দেখাও।\n\nপ্রথম লাইনে \`n\`, দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা — একই মান একাধিকবার আসতে পারে।`,
    inputFormat: `প্রথম লাইনে \`n\`।
দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।`,
    outputFormat: `এক লাইনে আলাদা মানগুলো, বর্ণানুক্রমে (ছোট থেকে বড়), স্পেস দিয়ে আলাদা।`,
    constraints: `\`1 <= n <= 200000\`
\`1 <= a_i <= 10^9\`।`,
    editorial: `## ধারণা\nসাজানো আর আলাদা করা দুটো আলাদা কাজ — দুটোই কালেকশনে তৈরি আছে। \`set(a)\` সব মান একবার করে রাখে (hash-এর কারণে দ্রুত), আর \`sorted()\` ফলকে ক্রম দেয়। মিলিয়ে দেখা যায় মোট সময় \`O(n)\` আলাদা করা + \`O(u \log u)\` সাজানো, যেখানে \`u\` আলাদা মান সংখ্যা। শুধু \`sorted(set(a))\` লিখলেই হয়, কিন্তু বুঝে লিখলে ভুল কম হয়।\n\n## ধাপে ধাপে\n1. \`n\` আর সব মান পড়ে নাও।\n2. \`set(a)\` দিয়ে আলাদা মানগুলো বের করো।\n3. \`sorted()\` দিয়ে ক্রম দাও।\n4. স্পেস দিয়ে এক লাইনে ছাপাও।\n\n\`\`\`python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\nprint(*sorted(set(a)))\n\`\`\`\n\nC++-তে \`sort\` + \`unique\` প্যাটার্ন:\n\n\`\`\`cpp\nsort(v.begin(), v.end());\nv.erase(unique(v.begin(), v.end()), v.end());\n\`\`\`\n\n## কমপ্লেক্সিটি\nসময় \`O(n + u \log u)\`, মেমোরি \`O(u)\`। সব মান আলাদা হলে \`u = n\`, তাই মোট \`O(n \log n)\`।\n\n## সাধারণ ভুল\n- \`set\` দিয়ে সরাসরি ছাপা — Python-এ \`set\` অর্ডার দেয় না, তাই দুটো রানে ভিন্ন উত্তর আসবে। সবসময় \`sorted\` করো।
- \`a.sort()\` করেও আলাদা করা হয়নি — ডুপ্লিকেট থেকে যায়; \`sorted(set(a))\` বা \`dict.fromkeys(a)\` দিয়ে সমাধান।
- খালি ইনপুট বা \`n\` না দেখে পুরো লাইন ঘোরা — \`n\` অনুযায়ী ঠিক \`n\` মান নাও।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Sorting", "Set", "STL"],
    tests: [
      { input: "5\n3 1 3 2 1\n", expectedOutput: "1 2 3\n", isSample: true },
      { input: "1\n42\n", expectedOutput: "42\n", isSample: true },
      { input: "4\n5 5 5 5\n", expectedOutput: "5\n", isSample: false },
      { input: "6\n9 8 7 6 5 4\n", expectedOutput: "4 5 6 7 8 9\n", isSample: false },
      { input: `200000\n${Array.from({ length: 200000 }, (_, i) => (i % 1000) + 1).join(" ")}\n`, expectedOutput: `${Array.from({ length: 1000 }, (_, i) => i + 1).join(" ")}\n`, isSample: false },
      { input: `200000\n${Array(200000).fill(7).join(" ")}\n`, expectedOutput: "7\n", isSample: false },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\nprint(*sorted(set(a)))\n",
  },
  {
    slug: "learn-m2-stl-collections-g2",
    title: "Membership Lookup Queries",
    statement: `লাইব্রেরির তাকে যে যে বই আছে সেগুলোর তালিকা তানভির কম্পিউটারে আছে, আর পাঠকরা বারবার জিজ্ঞেস করে — "এই বইটা কী আছে?" তুমি প্রতিটি প্রশ্নের উত্তর \`YES\` বা \`NO\` করে দাও।\n\nপ্রথম লাইনে দুইটা সংখ্যা \`n\` আর \`m\` — তাকে বই সংখ্যা আর প্রশ্ন সংখ্যা। পরের লাইনে \`n\`টি বইয়ের নম্বর (আলাদা), তারপর এক লাইনে \`m\`টি প্রশ্নের নম্বর।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`m\`।
পরের লাইনে \`n\`টি পূর্ণসংখ্যা (তাকের বই), তারপর পরের লাইনে \`m\`টি পূর্ণসংখ্যা (প্রশ্ন)।`,
    outputFormat: `প্রতিটি প্রশ্নের জন্য এক লাইনে \`YES\` বা \`NO\`, প্রশ্নের ক্রম অনুযায়ী।`,
    constraints: `\`1 <= n, m <= 200000\`
\`1 <= value <= 10^9\`
তাকের সব নম্বর আলাদা।`,
    editorial: `## ধারণা\nপ্রতিটি প্রশ্নে তালিকা ঘুরলে \`O(nm)\` — \`n = m = 200000\` হলে কোটি কোটি ধাপ, অচল। \`set\` (C++-\`unordered_set\`, Java-\`HashSet\`) বানালে প্রতিটি খোঁজা গড়ে \`O(1)\`, তাই মোট \`O(n + m)\`। এটাই হ্যাশিংয়ের সবচেয়ে সরাসরি ব্যবহার — একবার সেট বানিয়ে অসংখ্য প্রশ্নের উত্তর দেওয়া।\n\n## ধাপে ধাপে\n1. \`n\`, \`m\`, তাকের বই আর প্রশ্নগুলো একসাথে পড়ে নাও।\n2. তাকের বইগুলো \`set\`-এ ঢোকাও।\n3. প্রতিটি প্রশ্নের জন্য \`value in shelf\` যাচাই করে \`YES\`/\`NO\` সংগ্রহ করো।\n4. সব ফল এক এক লাইনে ছাপাও।\n\n\`\`\`python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn, m = data[0], data[1]\nshelf = set(data[2:2 + n])\nqueries = data[2 + n:2 + n + m]\nfor value in queries:\n    print("YES" if value in shelf else "NO")\n\`\`\`\n\n## কমপ্লেক্সিটি\nসময় \`O(n + m)\` — একবার সেট বানানো, তারপর প্রতিটি প্রশ্ন \`O(1)\`। মেমোরি \`O(n)\`।\n\n## সাধারণ ভুল\n- প্রতিটি প্রশ্নে \`if value in list:\` — সেটা আবার \`O(n)\` প্রতি প্রশ্নে, মোট \`O(nm)\`। সবসময় \`set\`/\`unordered_set\` নাও।
- \`shelf = data[2:2+n]\` না করে পুরো তালিকা দিয়ে খোঁজা — প্রশ্নের মানও তাকে ধরা পড়তে পারে, ভুল \`YES\` আসে।
- ফল লুপের ভিতরে ছাপাতে গিয়ে ক্রম বদলে যাওয়া — এখানে ক্রম ঠিক থাকলেও, সাধারণত ফল সংগ্রহ করে শেষে ছাপানোই নিরাপদ।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Set", "Hashing", "Queries"],
    tests: [
      { input: "3 2\n1 2 3\n2 4\n", expectedOutput: "YES\nNO\n", isSample: true },
      { input: "1 3\n5\n5 6 5\n", expectedOutput: "YES\nNO\nYES\n", isSample: true },
      { input: "2 1\n10 20\n30\n", expectedOutput: "NO\n", isSample: false },
      { input: "4 4\n1 2 3 4\n4 3 2 1\n", expectedOutput: "YES\nYES\nYES\nYES\n", isSample: false },
      { input: `200000 200000\n${Array.from({ length: 200000 }, (_, i) => i + 1).join(" ")}\n${Array.from({ length: 200000 }, (_, i) => 200000 - i).join(" ")}\n`, expectedOutput: newlineOutput(Array(200000).fill("YES")), isSample: false },
      { input: `100000 100000\n${Array.from({ length: 100000 }, (_, i) => i + 1).join(" ")}\n${Array.from({ length: 100000 }, (_, i) => i + 100001).join(" ")}\n`, expectedOutput: newlineOutput(Array(100000).fill("NO")), isSample: false },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, m = data[0], data[1]\nshelf = set(data[2:2 + n])\nqueries = data[2 + n:2 + n + m]\nfor value in queries:\n    print('YES' if value in shelf else 'NO')\n",
  },
  {
    slug: "learn-m2-stl-collections-e1",
    title: "Palindrome Check with Deque",
    statement: `সাদিয়া ক্যাম্পাস ইভেন্টের গোপন কোডটা এমনভাবে লিখেছেন যেন সামনে থেকে পড়লেও, উল্টো থেকে পড়লেও একই হয়। তুমি বলো দেওয়া কোডটা (একটা শব্দ) সেই শর্ত পূরণ করে কিনা।\n\nএক লাইনে একটা শব্দ আসে — ছোট হাতের ইংরেজি অক্ষর। প্যালিনড্রোম হলে \`YES\`, না হলে \`NO\`।`,
    inputFormat: `এক লাইনে একটা শব্দ \`word\`।`,
    outputFormat: `প্যালিনড্রোম হলে \`YES\`, না হলে \`NO\`।`,
    constraints: `\`1 <= len(word) <= 200000\`
শব্দে শুধু ছোট হাতের ইংরেজি অক্ষর থাকে।`,
    editorial: `## ধারণা\nদুই পয়েন্টার চালানো যায়: একটা শুরু থেকে, অন্যটা শেষ থেকে, দুটো মিললে ভেতরের দিকে এগোও। Python-এ \`deque\`-এর \`popleft()\` আর \`pop()\` দুটোই \`O(1)\`, তাই দুই পাশ থেকে একসাথে মেলানো খুব স্বাভাবিক। সবচেয়ে সহজ কোড হলো শব্দটার উল্টোটার সাথে হুবহু তুলনা — কারণ Python-এ স্ট্রিং কাটা \`O(n)\` সময়েই হয়। দুটোই ধারণাগতভাবে \`O(n)\`।\n\n## ধাপে ধাপে\n1. লাইনটা পড়ে \`word\`-এ রাখো (শেষের নিউলাইন বাদ দিয়ে)।\n2. শব্দের উল্টো করো — \`word[::-1]\` বা ডাবল-এন্ডেড \`deque\` থেকে দুই পাশ থেকে তোলা।\n3. মূল ও উল্টো তুলনা করো; মিললে \`YES\`, নাহলে \`NO\`।\n\n\`\`\`python\nimport sys\nword = sys.stdin.readline().strip()\nprint("YES" if word == word[::-1] else "NO")\n\`\`\`\n\nডাবল-এন্ডেডভাবে:\n\n\`\`\`text\nfrom collections import deque\ndq = deque(word)\nok = True\nwhile len(dq) > 1:\n    if dq.popleft() != dq.pop():\n        ok = False\n        break\nprint("YES" if ok else "NO")\n\`\`\`\n\n## কমপ্লেক্সিটি\nসময় \`O(n)\` — প্রতিটি অক্ষর সর্বোচ্চ একবার দেখা হয়। মেমোরি \`O(1)\` (তুলনা ছাড়া) বা উল্টো করলে \`O(n)\`।\n\n## সাধারণ ভুল\n- শুধু প্রথম ও শেষ অক্ষর মিলিয়ে দেওয়া — \`abca\`-তে প্রথম-শেষ \`a\` মিললেও উত্তর \`NO\`।
- শব্দের মাঝে বড় হাতের অক্ষর বা বিশেষ চিহ্ন ধরা — এখানে শুধু ছোট হাতের অক্ষর, তাই \`strip()\` দিয়ে নিউলাইন বাদ দিলেই হয়।
- খালি শব্দ ধরে নেওয়া — সীমায় \`len(word) >= 1\`, তাই \`word[0]\` নিরাপদ, তবু \`while len > 1\` লুপই সব কেসে চলে।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Deque", "Two Pointers", "Strings"],
    tests: [
      { input: "racecar\n", expectedOutput: "YES\n", isSample: true },
      { input: "prime\n", expectedOutput: "NO\n", isSample: true },
      { input: "a\n", expectedOutput: "YES\n", isSample: false },
      { input: "abca\n", expectedOutput: "NO\n", isSample: false },
      { input: "abba\n", expectedOutput: "YES\n", isSample: false },
      { input: (() => { const half = "ab".repeat(50000); return half + half.split("").reverse().join("") + "\n"; })(), expectedOutput: "YES\n", isSample: false },
      { input: "a".repeat(100000) + "b".repeat(100000) + "\n", expectedOutput: "NO\n", isSample: false },
    ],
    referencePython:
      "import sys\nword = sys.stdin.readline().strip()\nprint('YES' if word == word[::-1] else 'NO')\n",
  },
  {
    slug: "learn-m2-stl-collections-m1",
    title: "Rank Songs by Play Count",
    statement: `ক্লাবের সংগীত সন্ধ্যায় গানগুলো ক্রমানুযায়ী বাজাবে: যে গান সবচেয়ে বেশিবার পছন্দ হয়েছে সে আগে, সমান হলে নামের বর্ণানুক্রমে (ছোট আগে)। প্রতিটি গান এক লাইনে ছাপাতে হবে।\n\nপ্রথম লাইনে \`n\` — মোট পছন্দ সংখ্যা। দ্বিতীয় লাইনে \`n\`টি গানের নাম (ছোট হাতের ইংরেজি); একই নাম একাধিকবার আসতে পারে।`,
    inputFormat: `প্রথম লাইনে \`n\`।
দ্বিতীয় লাইনে \`n\`টি শব্দ, স্পেস দিয়ে আলাদা।`,
    outputFormat: `প্রতিটি আলাদা গান এক লাইনে; ক্রম: কাউন্ট বড় আগে, সমান হলে নাম ছোট আগে।`,
    constraints: `\`1 <= n <= 100000\`
প্রতিটি নামের দৈর্ঘ্য \`1 <= len(word) <= 20\`।`,
    editorial: `## ধারণা\nদুইটা ধাপ: প্রথমে \`Counter\` দিয়ে প্রতিটি গানের হিসাব, তারপর কাস্টম কী দিয়ে সাজানো। Python-এ \`sorted(freq, key=lambda w: (-freq[w], w))\` লিখলে প্রথমে কাউন্ট বড়, সমান হলে নাম ছোট — নেগেটিভ করলে কাউন্ট বিপরীত ক্রমে হয়, আর দ্বিতীয় উপাদান টাই-ব্রেক দেয়। কাস্টম কম্পারেটর বা \`sort_by\` সব ভাষাতেই একই জায়গায় লাগে।\n\n## ধাপে ধাপে\n1. \`n\` আর সব নাম পড়ে নাও।\n2. \`Counter(words)\` দিয়ে হিসাব নাও।\n3. \`(-count, name)\` কী দিয়ে সাজাও।\n4. প্রতিটি নাম আলাদা লাইনে ছাপাও।\n\n\`\`\`python\nimport sys\nfrom collections import Counter\ndata = sys.stdin.read().split()\nn = int(data[0])\nwords = data[1:]\nfreq = Counter(words)\nfor word in sorted(freq, key=lambda w: (-freq[w], w)):\n    print(word)\n\`\`\`\n\n## কমপ্লেক্সিটি\nসময় \`O(n + u \log u)\` (\`u\` আলাদা গান), মেমোরি \`O(u)\`।\n\n## সাধারণ ভুল\n- শুধু \`sorted(freq)\` করা — বর্ণানুক্রমে হয়, কিন্তু কাউন্ট অনুযায়ী ক্রম থাকে না; উদাহরণে \`cat dog bird fish\` পাওয়া যেত।
- \`key=freq.get\` দিলে টাই-ব্রেক হয় না — সমান কাউন্টে ম্যাপের যে ক্রমে ধরে ফল আসে, দুটো রানে ভিন্ন হতে পারে।
- কাউন্ট বড় হলে ছোট নাম আগে আসবে — দুইটা শর্ত একসাথে মিলিয়ে কী বানাতে ভুলে যাওয়া।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Sorting", "Hash Map", "Custom Comparator"],
    tests: [
      { input: "5\nb a b c a\n", expectedOutput: "a\nb\nc\n", isSample: true },
      { input: "4\nx y x y\n", expectedOutput: "x\ny\n", isSample: true },
      { input: "3\nz z z\n", expectedOutput: "z\n", isSample: false },
      { input: "6\ncat dog cat bird dog fish\n", expectedOutput: "cat\ndog\nbird\nfish\n", isSample: false },
      { input: "5\napple apple banana banana cherry\n", expectedOutput: "apple\nbanana\ncherry\n", isSample: false },
      { input: `100000\n${Array(100000).fill("solo").join(" ")}\n`, expectedOutput: "solo\n", isSample: false },
      { input: `100000\n${Array.from({ length: 100000 }, (_, i) => (i % 2 ? "bb" : "aa")).join(" ")}\n`, expectedOutput: "aa\nbb\n", isSample: false },
    ],
    referencePython:
      "import sys\nfrom collections import Counter\ndata = sys.stdin.read().split()\nn = int(data[0])\nwords = data[1:]\nfreq = Counter(words)\nfor word in sorted(freq, key=lambda w: (-freq[w], w)):\n    print(word)\n",
  },
  {
    slug: "learn-m2-stl-collections-h1",
    title: "LRU Cache Simulation",
    statement: `ল্যাবের কম্পিউটারে সর্বশেষ ফাইলগুলো সামনে থাকে, আর মেমোরি সীমিত — বেশি হলে সবচেয়ে কম ব্যবহৃত ফাইলটাই সরে যায়। এটাই LRU (Least Recently Used) নীতি: নতুন ফাইল এলে সে সামনে, আর যেটা সবচেয়ে দীর্ঘক্ষণ দেখা হয়নি সেটা বাদ পড়ে। তুমি এই ক্যাশের আচরণ সিমুলেট করো।\n\nপ্রথম লাইনে দুইটা সংখ্যা \`C\` (ক্যাশের ধারণক্ষমতা) আর \`q\` (অপারেশন সংখ্যা)। পরের \`q\` লাইনে একটা করে অপারেশন: \`GET k\` — \`k\` ফাইলটা খুঁজে মান দেখাও, না থাকলে \`-1\`; পাওয়া গেলেও ওই ফাইলটা সাম্প্রতিক হিসেবে সামনে চলে আসবে; \`PUT k v\` — \`k\` ফাইলের মান \`v\` বসাও। নতুন হলেও সে সামনে আসবে, আর ধারণক্ষমতা ছাড়ালে সবচেয়ে পুরনোটা বাদ যাবে।`,
    inputFormat: `প্রথম লাইনে \`C\` আর \`q\`।
পরের \`q\` লাইনে \`GET k\` বা \`PUT k v\`।`,
    outputFormat: `প্রতিটি \`GET\` অপারেশনের জন্য এক লাইনে মান, না থাকলে \`-1\`।`,
    constraints: `\`1 <= C <= 1000\`
\`1 <= q <= 200000\`
\`0 <= k, v <= 10^9\`।`,
    editorial: `## ধারণা\nLRU চালাতে দুইটা জিনিস লাগে: key -> value ম্যাপ (দ্রুত খোঁজা) আর ব্যবহারের ক্রম ধরে রাখার কাঠামো (সামনে-পেছন থেকে সরানো \`O(1)\`)। Python-এ \`OrderedDict\` দুইটাই একসাথে দেয়: \`move_to_end(key)\` দিলে ওই key সবচেয়ে সাম্প্রতিক হয়ে যায়, আর \`popitem(last=False)\` সবচেয়ে পুরনোটা বাদ দেয়। C++-এ \`list\` + \`unordered_map<iterator>\` বা Java-এ \`LinkedHashMap\` একই কাজ করে।\n\n## ধাপে ধাপে\n1. \`C\` আর \`q\` পড়ে নাও।\n2. খালি \`OrderedDict()\` আর উত্তরের তালিকা নাও।\n3. প্রতিটি অপারেশন যাচাই করো:
   - \`GET k\`: থাকলে \`move_to_end(k)\` করে মান রাখো, না থাকলে \`-1\`।
   - \`PUT k v\`: \`cache[k] = v\` করে \`move_to_end(k)\`; তারপর \`len(cache) > C\` হলে প্রথমটা \`popitem(last=False)\`।
4. সংগ্রহ করা উত্তরগুলো এক এক লাইনে ছাপাও।\n\n\`\`\`python\nimport sys\nfrom collections import OrderedDict\ndata = sys.stdin.read().split()\nit = iter(data)\nC = int(next(it))\nq = int(next(it))\ncache = OrderedDict()\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == "GET":\n        key = int(next(it))\n        if key in cache:\n            cache.move_to_end(key)\n            out.append(str(cache[key]))\n        else:\n            out.append("-1")\n    else:\n        key = int(next(it))\n        value = int(next(it))\n        cache[key] = value\n        cache.move_to_end(key)\n        if len(cache) > C:\n            cache.popitem(last=False)\nsys.stdout.write("\\n".join(out))\n\`\`\`\n\n## কমপ্লেক্সিটি\nসময় গড়ে \`O(1)\` প্রতি অপারেশন, মোট \`O(q)\`; মেমোরি \`O(C + q)\` (উত্তর ধরে)। ক্যাশে সর্বোচ্চ \`C\`টা key থাকে, তাই ভেতরের কাজ সীমিত।\n\n## সাধারণ ভুল\n- \`PUT\` করার পর \`move_to_end\` না করা — আপডেট হলেও সেটা পুরনো ক্রমে থেকে যায়, ফলে ভুল ফাইল বাদ পড়ে। নমুনা ৪-এ ধরা পড়ে।
- ধারণক্ষমতা পূর্ণ হওয়ার আগেই \`popitem\` ডাকা, অথবা \`>\` না লিখে \`>=\` লেখা — তখন ঠিক \`C\`টার বদলে \`C - 1\`টা থাকে।
- খালি ক্যাশে \`GET\`-এ \`-1\` না দিয়ে ক্র্যাশ করা — ইনপুটে ধরা আছে, তবু চেকটা বাধ্যতামূলক।
- উত্তর লুপের ভিতরে ছাপাতে গিয়ে ফাইল হারানো — এখানে ক্রম ঠিক থাকে, কিন্তু সংগ্রহ করে শেষে ছাপাই নিরাপদ।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Linked Hash Map", "Ordered Dict", "Simulation"],
    tests: [
      { input: "2 5\nPUT 1 10\nPUT 2 20\nGET 1\nPUT 3 30\nGET 2\n", expectedOutput: "10\n-1\n", isSample: true },
      { input: "1 4\nPUT 5 50\nGET 5\nPUT 6 60\nGET 5\n", expectedOutput: "50\n-1\n", isSample: true },
      { input: "2 4\nPUT 1 1\nPUT 2 2\nGET 1\nGET 2\n", expectedOutput: "1\n2\n", isSample: false },
      { input: "2 5\nPUT 1 1\nPUT 2 2\nPUT 1 9\nGET 1\nGET 2\n", expectedOutput: "9\n2\n", isSample: false },
      { input: "1 1\nGET 7\n", expectedOutput: "-1\n", isSample: false },
      { input: `1 200000\n${Array.from({ length: 200000 }, (_, i) => `GET ${i + 1}`).join("\n")}\n`, expectedOutput: newlineOutput(Array(200000).fill("-1")), isSample: false },
      { input: `1000 200000\n${Array.from({ length: 100000 }, (_, i) => `PUT ${i + 1} ${i + 1}`).join("\n")}\n${Array.from({ length: 100000 }, (_, i) => `GET ${i + 1}`).join("\n")}\n`, expectedOutput: newlineOutput(Array.from({ length: 100000 }, (_, i) => String(i + 1 >= 99001 ? i + 1 : -1))), isSample: false },
    ],
    referencePython:
      "import sys\nfrom collections import OrderedDict\ndata = sys.stdin.read().split()\nit = iter(data)\nC = int(next(it))\nq = int(next(it))\ncache = OrderedDict()\nout = []\nfor _ in range(q):\n    op = next(it)\n    if op == 'GET':\n        key = int(next(it))\n        if key in cache:\n            cache.move_to_end(key)\n            out.append(str(cache[key]))\n        else:\n            out.append('-1')\n    else:\n        key = int(next(it))\n        value = int(next(it))\n        cache[key] = value\n        cache.move_to_end(key)\n        if len(cache) > C:\n            cache.popitem(last=False)\nsys.stdout.write('\\n'.join(out))\n",
  },
  {
    slug: "learn-m2-stl-collections-x1",
    title: "K-th Largest Value",
    statement: `কোডিং কনটেস্টের স্কোরবোর্ডে তানভির জানতে চান তৃতীয় সেরা স্কোরটা কত — অর্থাৎ বড় থেকে ছোট ক্রমে গেলে \`k\` নম্বর মান। একই স্কোর একাধিক থাকলে তাও আলাদা আলাদা অবস্থান হিসেবে ধরা হবে।\n\nপ্রথম লাইনে \`n\` আর \`k\`, দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা — স্কোর।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`k\`।
দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।`,
    outputFormat: `এক লাইনে বড় থেকে ছোট ক্রমে \`k\` নম্বর মান।`,
    constraints: `\`1 <= k <= n <= 200000\`
\`1 <= a_i <= 10^9\`।`,
    editorial: `## ধারণা\nসবচেয়ে সহজ উপায় পুরো তালিকা উল্টো ক্রমে সাজিয়ে \`k - 1\` নম্বর ইনডেক্সে তাকানো — সময় \`O(n \log n)\`, মেমোরি \`O(n)\`। আরেক কৌশল হলো ছোট থেকে বড় হিপ রাখা: প্রতিটি মান ঢোকানোর সময় হিপের আকার \`k\` ছাড়ালে সবচেয়ে ছোটটা বাদ দিলে শেষে হিপে থাকে বড় \`k\`টা, আর তার গোড়াটাই \`k\` নম্বর বড়। সময় \`O(n \log k)\`। ছোট \`k\`-এ হিপ কাজের, বড় \`k\`-এ সরাসরি সাজানোই সহজ।\n\n## ধাপে ধাপে\n1. \`n\`, \`k\` আর সব স্কোর পড়ে নাও।\n2. তালিকাটা বড় থেকে ছোট ক্রমে সাজাও।\n3. \`k - 1\` ইনডেক্সের মান ছাপাও (০-ভিত্তিক)।\n\n\`\`\`python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn, k = data[0], data[1]\na = sorted(data[2:], reverse=True)\nprint(a[k - 1])\n\`\`\`\n\nহিপ দিয়ে:\n\n\`\`\`text\nimport heapq\nheap = []\nfor value in scores:\n    heapq.heappush(heap, value)\n    if len(heap) > k:\n        heapq.heappop(heap)\nprint(heap[0])\n\`\`\`\n\n## কমপ্লেক্সিটি\nসরাসরি: সময় \`O(n \log n)\`, মেমোরি \`O(n)\`। হিপ: সময় \`O(n \log k)\`, মেমোরি \`O(k)\`।\n\n## সাধারণ ভুল\n- \`a[k]\` লেখা — ইনডেক্স শূন্য থেকে শুরু, তাই \`k\` নম্বর মান \`a[k-1]\`। নমুনা ১-এ ধরা পড়ে।
- ছোট থেকে বড় সাজিয়েও \`k\` তে তাকানো — তখন পাওয়া যায় \`k\` নম্বর ছোট মান, উল্টো প্রশ্ন।
- \`reverse=True\` না দিয়ে পরে থেকে পড়া — উত্তর ভুল, বা উল্টো ইনডেক্স হিসাব করতে হয়।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Sorting", "Heap", "Priority Queue"],
    tests: [
      { input: "6 2\n5 2 9 1 9 2\n", expectedOutput: "9\n", isSample: true },
      { input: "3 3\n4 4 4\n", expectedOutput: "4\n", isSample: true },
      { input: "5 1\n3 7 2 8 4\n", expectedOutput: "8\n", isSample: false },
      { input: "5 5\n3 7 2 8 4\n", expectedOutput: "2\n", isSample: false },
      { input: "4 2\n10 10 10 10\n", expectedOutput: "10\n", isSample: false },
      { input: `200000 200000\n${Array.from({ length: 200000 }, (_, i) => i + 1).join(" ")}\n`, expectedOutput: "1\n", isSample: false },
      { input: `200000 1\n${Array.from({ length: 200000 }, (_, i) => i + 1).join(" ")}\n`, expectedOutput: "200000\n", isSample: false },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, k = data[0], data[1]\na = sorted(data[2:], reverse=True)\nprint(a[k - 1])\n",
  },
  {
    slug: "learn-m2-stl-collections-x2",
    title: "Merge Booking Intervals",
    statement: `লাইব্রেরির পড়ার হল বুকিং কাগজে লেখা: কোন দল কোন সময় থেকে কোন সময় পর্যন্ত হল নিয়েছে। দুটো বুকিং যদি ছুঁয়ে যায় বা মিলে যায় (একটার শেষ আরেকটার শুরু সমান হলেও), তাহলে সেগুলো একসাথে একটাই বুকিং হিসেবে ধরা হবে। সব মিলানো বুকিং সাজিয়ে ছাপাও।\n\nপ্রথম লাইনে \`n\`, পরের \`n\` লাইনে প্রতিটিতে \`l r\` — শুরু আর শেষ সময়।`,
    inputFormat: `প্রথম লাইনে \`n\`।
পরের \`n\` লাইনে প্রতিটিতে দুইটা পূর্ণসংখ্যা \`l r\`।`,
    outputFormat: `প্রতিটি মিলানো অংশ এক লাইনে \`l r\`; লাইনগুলো শুরুর সময় অনুযায়ী ক্রমানুযায়ী।`,
    constraints: `\`1 <= n <= 200000\`
\`0 <= l <= r <= 10^9\`।`,
    editorial: `## ধারণা\nঅন্তর্বর্তী মান মানে শুরু দিয়ে সাজানো। সাজানোর পর এক লুপে বাঁ থেকে ডানে ঘুরে দেখো: পরের অংশের শুরু আগেরটার শেষের সমান বা কম হলে দুটো একসাথে — শেষ সময়টা দুটোর মধ্যে যেটা বড় তাই রাখো। না হলে নতুন অংশ শুরু হয়। শুরু সাজানো \`O(n \log n)\` আর ঘোরা \`O(n)\`, তাই মোট সময় সাজানোর দিকটাই নিয়ন্ত্রণ করে।\n\n## ধাপে ধাপে\n1. \`n\` আর সব \`l r\` জোড়া পড়ে নাও।\n2. জোড়াগুলো শুরুর সময় অনুযায়ী সাজাও।\n3. ফাঁকা ফলের তালিকা \`merged\` নাও।\n4. প্রতিটি জোড়ার জন্য: \`merged\` খালি না এবং \`l <= merged[-1][1]\` হলে শেষ সময় বড় মানে হালনাগাদ, নাহলে নতুন জোড়া যোগ করো।\n5. প্রতিটি \`l r\` আলাদা লাইনে ছাপাও।\n\n\`\`\`python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\npairs = [(data[1 + 2 * i], data[2 + 2 * i]) for i in range(n)]\npairs.sort()\nmerged = []\nfor left, right in pairs:\n    if merged and left <= merged[-1][1]:\n        if right > merged[-1][1]:\n            merged[-1][1] = right\n    else:\n        merged.append([left, right])\nfor left, right in merged:\n    print(left, right)\n\`\`\`\n\n## কমপ্লেক্সিটি\nসময় \`O(n \log n)\` (সাজানো), মেমোরি \`O(n)\`। লুপটা নিজে \`O(n)\`।\n\n## সাধারণ ভুল\n- \`<\` দিয়ে মিলানো: ছুঁয়ে যাওয়া অংশ (\`l == previous r\`) মিলবে না, ফলে \`1 4\` আর \`4 5\` দুটো থেকে যায় — নমুনা ২-এ ধরা পড়ে। সঠিক শর্ত \`l <= merged[-1][1]\`।
- সাজানোর আগেই মিলানো শুরু — \`10 20\` আগে এলে পরের \`1 2\` আলাদা থাকে, ভুল ফল দেয়। আগে \`sort\` বাধ্যতামূলক।
- ভেতরের অংশ মিলিয়ে ফেলা: \`1 10\`-এর ভেতরে \`2 3\` থাকলে শেষ সময় \`10\`-এর চেয়ে বড় নয়, তাই কিছু বদলাবে না — \`if right > merged[-1][1]\` চেক না করলে ভুল হয়।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Sorting", "Intervals", "Greedy"],
    tests: [
      { input: "3\n1 3\n2 6\n8 10\n", expectedOutput: "1 6\n8 10\n", isSample: true },
      { input: "2\n1 4\n4 5\n", expectedOutput: "1 5\n", isSample: true },
      { input: "1\n5 5\n", expectedOutput: "5 5\n", isSample: false },
      { input: "4\n10 20\n1 2\n5 6\n2 3\n", expectedOutput: "1 3\n5 6\n10 20\n", isSample: false },
      { input: "3\n1 10\n2 3\n4 5\n", expectedOutput: "1 10\n", isSample: false },
      { input: `200000\n${Array(200000).fill("1 1000000").join("\n")}\n`, expectedOutput: "1 1000000\n", isSample: false },
      { input: `200000\n${Array.from({ length: 200000 }, (_, i) => `${2 * i} ${2 * i + 1}`).join("\n")}\n`, expectedOutput: newlineOutput(Array.from({ length: 200000 }, (_, i) => `${2 * i} ${2 * i + 1}`)), isSample: false },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\npairs = [(data[1 + 2 * i], data[2 + 2 * i]) for i in range(n)]\npairs.sort()\nmerged = []\nfor left, right in pairs:\n    if merged and left <= merged[-1][1]:\n        if right > merged[-1][1]:\n            merged[-1][1] = right\n    else:\n        merged.append([left, right])\nfor left, right in merged:\n    print(left, right)\n",
  },
];
