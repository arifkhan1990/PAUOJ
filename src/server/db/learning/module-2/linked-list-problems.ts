import type { SeedProblem } from "../../seed-problems";
import { nAndNumbers, spaceOutput } from "../generated-tests";

export const LINKED_LIST_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m2-linked-list-g1",
    title: "Build and Print a Linked List",
    statement: `নুসরাত প্রাইমএশিয়া কোডিং ক্লাবের সদস্যদের তালিকাটা এবার লিংকড লিস্টে রাখতে চায় — নাম এক এক করে নোড হিসেবে যোগ হবে, আর শেষে \`NULL\` দিয়ে থামবে। তুমি দেওয়া মানগুলো দিয়ে সেই লিস্টটা বানিয়ে ছাপাও।\n\nপ্রথম লাইনে \`n\`, দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা — যেক্রমে লিস্টে যোগ হবে। ছাপার ফরম্যাট: প্রতিটি মানের পরে একটা করে \` -> \`, আর শেষে \`NULL\`।`,
    inputFormat: `প্রথম লাইনে \`n\`।
দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।`,
    outputFormat: `এক লাইনে লিস্টটা: \`v1 -> v2 -> ... -> vn -> NULL\`।`,
    constraints: `1 <= n <= 100\`
প্রতিটি মান \`-1000 <= v <= 1000\`।`,
    editorial: `## ধারণা\nলিস্ট বানানো মানে এক এক নোড তৈরি করে \`next\` দিয়ে জোড়া লাগানো, আর ছাপার জন্য \`head\` থেকে শুরু করে \`next\` ধরে হাটলেই হয়। প্রতিটি মান ঠিক একবার দেখা হয়, তাই ক্রম ইনপুটেরই থাকে। ফরম্যাটটা মনে রাখার সহজ উপায়: সব মান একটা লিস্টে রাখো, তারপর \` -> \` দিয়ে যোগ করো, শেষে \` -> NULL\` জোড়া লাগাও।\n\n## ধাপে ধাপে\n1. \`n\` আর \`n\`টি মান পড়ে নাও।\n2. প্রতিটি মানকে স্ট্রিং বানিয়ে তালিকায় রাখো।\n3. \` -> \` সেপারেটর দিয়ে যোগ করে এক লাইন বানাও।\n4. শেষে \` -> NULL\` যোগ করে ছাপাও।\n\n\`\`\`python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nvals = data[1:]\nprint(" -> ".join(str(v) for v in vals) + " -> NULL")\n\`\`\`\n\n## কমপ্লেক্সিটি\nসময় \`O(n)\`, অতিরিক্ত মেমোরি \`O(n)\` — প্রতিটি মান একবার ঘোরা হয়।\n\n## সাধারণ ভুল\n- \`NULL\` না লিখে শুধু মানগুলো ছাপা — ফরম্যাট ভাঙে, জাজ গ্রহণ করবে না।\n- শেষের মানের পর অতিরিক্ত \` -> \` বসানো, অথবা \`n\` না দেখে লাইনে যত আছে সবই ঘোরা।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Linked List", "Implementation", "Traversal"],
    tests: [
      { input: "4\n1 2 3 4\n", expectedOutput: "1 -> 2 -> 3 -> 4 -> NULL\n", isSample: true },
      { input: "1\n42\n", expectedOutput: "42 -> NULL\n", isSample: true },
      { input: "3\n7 7 7\n", expectedOutput: "7 -> 7 -> 7 -> NULL\n", isSample: false },
      { input: "2\n-5 0\n", expectedOutput: "-5 -> 0 -> NULL\n", isSample: false },
      { input: nAndNumbers(100, Array.from({ length: 100 }, (_, i) => i + 1)), expectedOutput: Array.from({ length: 100 }, (_, i) => i + 1).join(" -> ") + " -> NULL\n", isSample: false },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nvals = data[1:]\nprint(' -> '.join(str(v) for v in vals) + ' -> NULL')\n",
  },
  {
    slug: "learn-m2-linked-list-g2",
    title: "Reverse a Linked List",
    statement: `রফি দেখল ক্লাবের তালিকাটা সদস্য নতুন ঢোকার সাথে সাথে উল্টে যাচ্ছে — সবার আগে যে এসেছিল সে এখন শেষে। তুমি দেওয়া লিস্টটা ঠিক উল্টো ক্রমে ছাপাও, একই ফরম্যাটে।\n\nপ্রথম লাইনে \`n\`, দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা — লিস্টের বর্তমান ক্রম। শেষে \`NULL\` দিয়ে থামবে।`,
    inputFormat: `প্রথম লাইনে \`n\`।
দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।`,
    outputFormat: `এক লাইনে উল্টো লিস্ট: \`vn -> ... -> v1 -> NULL\`।`,
    constraints: `1 <= n <= 100\`
প্রতিটি মান \`-1000 <= v <= 1000\`।`,
    editorial: `## ধারণা\nরিভার্সালের মূল কথা তিনটা পয়েন্টার: আগেরটা (\`prev\`), বর্তমানটা (\`curr\`), পরেরটা (\`nxt\`)। প্রতিটি ধাপে আগে \`nxt\` সংরক্ষণ করতে হয়, তারপর \`curr.next\` উল্টে \`prev\`-এ জোড়া লাগাতে হয়, আর শেষে দুটোকে এক ধাপ এগিয়ে নিতে হয়। শেষে \`prev\`-ই নতুন \`head\`। সহজ বিকল্প হলো লিস্ট থেকে মান তুলে উল্টো ক্রমে ছাপা — কিন্তু পয়েন্টার ঘোরানোটাই এখানে শেখার বিষয়।\n\n## ধাপে ধাপে\n1. \`n\` আর মানগুলো পড়ে নাও।\n2. উল্টো তালিকা বানানোর জন্য মানগুলো শেষ থেকে আগে ঘোরাও।\n3. প্রতিটি মান যোগ করার সময় আগের সংযোগ ভাঙতে হবে না, শুধু ক্রম উল্টালেই হয়।\n4. শেষে \` -> NULL\` যোগ করে ছাপাও।\n\n\`\`\`python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nvals = data[1:][::-1]\nprint(" -> ".join(str(v) for v in vals) + " -> NULL")\n\`\`\`\n\nপয়েন্টার দিয়ে একই কাজ করতে চাইলে:\n\n\`\`\`python\ndef reverse(head):\n    prev = None\n    curr = head\n    while curr is not None:\n        nxt = curr.next\n        curr.next = prev\n        prev = curr\n        curr = nxt\n    return prev\n\`\`\`\n\n## কমপ্লেক্সিটি\nসময় \`O(n)\`, মেমোরি \`O(1)\` (পয়েন্টার ছাড়া) বা আউটপুটের জন্য \`O(n)\`।\n\n## সাধারণ ভুল\n- \`[::-1]\` না লিখে মূল ক্রমেই ছাপা — উত্তর হুবহু ইনপুট হয়ে যায়।\n- শেষ মানের পর \` -> NULL\` বাদ পড়লে বা ডাবল \` -> NULL\` চলে এলে ফরম্যাট ভাঙে।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Linked List", "Reversal", "Two Pointers"],
    tests: [
      { input: "4\n1 2 3 4\n", expectedOutput: "4 -> 3 -> 2 -> 1 -> NULL\n", isSample: true },
      { input: "1\n9\n", expectedOutput: "9 -> NULL\n", isSample: true },
      { input: "5\n5 4 3 2 1\n", expectedOutput: "1 -> 2 -> 3 -> 4 -> 5 -> NULL\n", isSample: false },
      { input: "3\n2 2 9\n", expectedOutput: "9 -> 2 -> 2 -> NULL\n", isSample: false },
      { input: nAndNumbers(100, Array.from({ length: 100 }, (_, i) => i + 1)), expectedOutput: Array.from({ length: 100 }, (_, i) => 100 - i).join(" -> ") + " -> NULL\n", isSample: false },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nvals = data[1:][::-1]\nprint(' -> '.join(str(v) for v in vals) + ' -> NULL')\n",
  },
  {
    slug: "learn-m2-linked-list-e1",
    title: "Join Two Membership Lists",
    statement: `ক্লাবে দুইটা আলাদা তালিকা ছিল — পুরনো সদস্যরা এক লিস্টে, নতুন সদস্যরা আরেক লিস্টে। রফি বলল, দুইটাকে জোড়া লাগিয়ে একটাই করে দাও — পুরনো তালিকার পরে নতুন তালিকাটা যুক্ত হবে, কোনো মান বাদ বা দ্বিগুণ হবে না।\n\nপ্রথম লাইনে দুইটা সংখ্যা \`n\` আর \`m\` — দুই লিস্টের দৈর্ঘ্য। পরের লাইনে \`n\`টি মান (প্রথম লিস্ট), তারপর এক লাইনে \`m\`টি মান (দ্বিতীয় লিস্ট)। দুইয়ের যেকোনো একটা খালি হতে পারে।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`m\`।
পরের লাইনে \`n\`টি পূর্ণসংখ্যা, তারপর পরের লাইনে \`m\`টি পূর্ণসংখ্যা।`,
    outputFormat: `এক লাইনে জোড়া লাগানো লিস্ট: \`... -> NULL\`।`,
    constraints: `0 <= n, m <= 100\`
দুই লিস্টের মোট দৈর্ঘ্য কমপক্ষে \`1\`।
প্রতিটি মান \`-1000 <= v <= 1000\`।`,
    editorial: `## ধারণা\nদুই লিস্ট জোড়া লাগানো মানে প্রথম লিস্টের শেষ নোডের \`next\` দ্বিতীয় লিস্টের \`head\`-এ জোড়া লাগানো। কোডে যেহেতু শুধু ক্রম চাই, তাই দুই তালিকার মান একসাথে নিয়ে একটার পর একটা ছাপলেই হয় — কারণ ইনপুটেই ক্রম দেওয়া আছে। খালি লিস্টের জন্য \`n = 0\` বা \`m = 0\` সম্ভব, তাই সেই কেসে শুধু অন্যটাই থাকবে।\n\n## ধাপে ধাপে\n1. \`n\`, \`m\` আর বাকি সব মান একসাথে পড়ে নাও।\n2. প্রথম \`n\`টি মান প্রথম লিস্ট, পরের \`m\`টি দ্বিতীয় লিস্ট — ক্রম ঠিক রেখে সব এক তালিকায় নাও।\n3. \` -> \` দিয়ে যোগ করে এক লাইন বানাও।\n4. শেষে \` -> NULL\` যোগ করে ছাপাও।\n\n\`\`\`python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn, m = data[0], data[1]\nvals = data[2:]\nprint(" -> ".join(str(v) for v in vals) + " -> NULL")\n\`\`\`\n\n## কমপ্লেক্সিটি\nসময় ও মেমোরি \`O(n + m)\` — প্রতিটি মান একবার দেখা হয়।\n\n## সাধারণ ভুল\n- \`data[2:2+n]\` না নিয়ে শুধু \`n\` দেখে থামা — দ্বিতীয় লিস্টের মান বাদ পড়ে বা বাড়তি মান চলে আসে।\n- খালি লিস্ট (\`n = 0\`) এলে \`vals[0]\` ধরার চেষ্টা করা — ক্র্যাশ হয়; সবসময় পুরো তালিকা দিয়ে কাজ করো।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Linked List", "Implementation", "Concatenation"],
    tests: [
      { input: "2 3\n1 2\n3 4 5\n", expectedOutput: "1 -> 2 -> 3 -> 4 -> 5 -> NULL\n", isSample: true },
      { input: "1 1\n8\n9\n", expectedOutput: "8 -> 9 -> NULL\n", isSample: true },
      { input: "0 2\n\n7 8\n", expectedOutput: "7 -> 8 -> NULL\n", isSample: false },
      { input: "3 0\n1 2 3\n", expectedOutput: "1 -> 2 -> 3 -> NULL\n", isSample: false },
      { input: `100 100\n${Array.from({ length: 100 }, (_, i) => i + 1).join(" ")}\n${Array.from({ length: 100 }, (_, i) => i + 101).join(" ")}\n`, expectedOutput: Array.from({ length: 200 }, (_, i) => i + 1).join(" -> ") + " -> NULL\n", isSample: false },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, m = data[0], data[1]\nvals = data[2:]\nprint(' -> '.join(str(v) for v in vals) + ' -> NULL')\n",
  },
  {
    slug: "learn-m2-linked-list-m1",
    title: "Reverse Linked List in Groups",
    statement: `সাদিয়া হলের সদস্য তালিকাটা ছোট ছোট দলে ভাগ করে সাজাতে চায়: প্রতি \`k\` জন করে এক দল, আর প্রতিটি দলের ভেতরের ক্রম উল্টে যাবে — শেষ দলটা যদি \`k\` জন না হয়, যতটুকু আছে তাতেই উল্টবে।\n\nপ্রথম লাইনে \`n\` আর \`k\`, দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা। প্রতিটি \`k\` সংখ্যক উপাদানের ব্লক উল্টিয়ে সাজিয়ে এক লাইনে ছাপাও। \`k > n\` হলে পুরো লিস্টটাই এক ব্লক হিসেবে উল্টবে।`,
    inputFormat: `প্রথম লাইনে \`n\` আর \`k\`।
দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।`,
    outputFormat: `এক লাইনে \`n\`টি পূর্ণসংখ্যা, ব্লকভিত্তিক উল্টানো অবস্থায়।`,
    constraints: `1 <= n <= 200000\`
\`1 <= k <= 200000\` (\`k\` \`n\`-এর চেয়ে বড়ও হতে পারে)।
প্রতিটি মান \`1 <= v <= 1000\`।`,
    editorial: `## ধারণা\nলিস্টকে \`k\` সংখ্যক উপাদানের ব্লকে ভাগ করে প্রতিটি ব্লক আলাদাভাবে উল্টানো যায়। মূল কথা দুটো: ব্লকের শেষ আর পরের ব্লকের শুরুর সংযোগ ভাঙতে হবে না, আর শেষ ব্লকটা ছোট হলেও একই নিয়ম চলবে। Python-এ সবচেয়ে সহজ উপায় হলো ইনডেক্স ধরে \`k\` করে স্লাইস নেওয়া আর প্রতিটি স্লাইস উল্টিয়ে জোড়া লাগানো; পয়েন্টার দিয়ে করলে প্রতি ব্লকে \`prev\`, \`curr\`, \`next\` তিনটা পয়েন্টার ঘোরাতে হয়।\n\n## ধাপে ধাপে\n1. \`n\`, \`k\` আর সব মান পড়ে নাও।\n2. ফাঁকা ফলের তালিকা \`res\` রাখো।\n3. \`i = 0\` থেকে \`n\` পর্যন্ত \`k\` ধাপে এগোও: \`a[i:i+k]\` স্লাইস নিয়ে উল্টিয়ে \`res\`-এ যোগ করো।\n4. শেষে সব মান স্পেস দিয়ে এক লাইনে ছাপাও।\n\n\`\`\`python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn, k = data[0], data[1]\na = data[2:]\nres = []\ni = 0\nwhile i < n:\n    res.extend(reversed(a[i:i + k]))\n    i += k\nprint(*res)\n\`\`\`\n\n## কমপ্লেক্সিটি\nসময় \`O(n)\` — প্রতিটি উপাদান ঠিক একবার কাটা আর একবার যোগ হয়। মেমোরি \`O(n)\` (আউটপুট)।\n\n## সাধারণ ভুল\n- শেষ ব্লকে বিশেষ চেষ্টা না করে \`i + k > n\` হলে স্লাইস নিয়েছে কিনা যাচাই করা — Python-এ \`a[i:i+k]\` নিজেই শেষ পর্যন্ত নেয়, তবে অন্য ভাষায় সীমা কাটা লাগে।\n- \`k = 1\` হলে কিছুই বদলাবে না — টেস্টে ধরা আছে; কোড যদি সেটা ভাঙে, লুপের সীমা দেখো।\n- ব্লক উল্টানোর সময় পুরো অ্যারেই উল্টে যাওয়া, অর্থাৎ শুধু প্রথম ব্লক নয়, প্রতিটি ব্লক আলাদা করে উল্টাতে হবে।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Linked List", "Reversal", "Two Pointers"],
    tests: [
      { input: "5 2\n1 2 3 4 5\n", expectedOutput: "2 1 4 3 5\n", isSample: true },
      { input: "3 3\n7 8 9\n", expectedOutput: "9 8 7\n", isSample: true },
      { input: "4 1\n1 2 3 4\n", expectedOutput: "1 2 3 4\n", isSample: false },
      { input: "4 10\n1 2 3 4\n", expectedOutput: "4 3 2 1\n", isSample: false },
      { input: "6 4\n1 2 3 4 5 6\n", expectedOutput: "4 3 2 1 6 5\n", isSample: false },
      { input: `200000 1\n${Array.from({ length: 200000 }, (_, i) => (i % 97) + 1).join(" ")}\n`, expectedOutput: spaceOutput(Array.from({ length: 200000 }, (_, i) => (i % 97) + 1)), isSample: false },
      { input: `200000 200000\n${Array.from({ length: 200000 }, (_, i) => (i % 97) + 1).join(" ")}\n`, expectedOutput: spaceOutput(Array.from({ length: 200000 }, (_, i) => ((199999 - i) % 97) + 1)), isSample: false },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, k = data[0], data[1]\na = data[2:]\nres = []\ni = 0\nwhile i < n:\n    res.extend(reversed(a[i:i + k]))\n    i += k\nprint(*res)\n",
  },
  {
    slug: "learn-m2-linked-list-h1",
    title: "Detect a Cycle in the List",
    statement: `তানভির ল্যাবের লিস্ট-ডিবাগ টুলটা বানাচ্ছেন, যেটা ধরে নেয় প্রতিটি নোডের \`next\` ঠিক একটা করা — তাই লিস্ট শুরু হয়ে কোথাও ঘুরে ঘুরে আগের কোনো নোডে ফিরে যেতে পারে (সাইকেল)। তুমি বলো দেওয়া লিস্টে সাইকেল আছে কিনা, আর থাকলে সাইকেলে কয়টা নোড আছে।\n\nপ্রথম লাইনে \`n\` — নোড সংখ্যা। দ্বিতীয় লাইনে \`n\`টি সংখ্যা: \`i\`-তম নোডের \`next\` (\`0\`-ভিত্তিক ইনডেক্স), আর \`-1\` মানে ওই নোডটির পরে কিছু নেই। লিস্টটা নোড \`0\` দিয়ে শুরু হয়। প্রতিটি নোডের ঠিক একটা করা \`next\` থাকে।`,
    inputFormat: `প্রথম লাইনে \`n\`।
দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা — প্রতিটি নোডের \`next\`।`,
    outputFormat: `সাইকেল না হলে এক লাইনে \`NO\`। থাকলে প্রথম লাইনে \`YES\`, দ্বিতীয় লাইনে সাইকেলের নোড সংখ্যা।`,
    constraints: `1 <= n <= 200000\`
প্রতিটি \`next\` হয় \`-1\` অথবা \`0\` থেকে \`n - 1\`-এর মধ্যে।\nশুরু নোড \`0\` থেকে হাটলে যেকোনো সময় সাইকেলে ঢুকতে পারে বা শেষ হতে পারে।`,
    editorial: `## ধারণা\nএকটা মাত্র \`next\` থাকায় লিস্টটা আসলে একটা "ρ" আকৃতির: একটা লেজ, তারপর একটা ঘোরা অংশ। ধীর পয়েন্টার এক ধাপ, দ্রুত পয়েন্টার দুই ধাপ এগোলে সাইকেল থাকলে অবশ্যই একসাথে মিলবে; সাইকেল না থাকলে দ্রুতটা আগে \`-1\`-এ পৌঁছায়। মিলে গেলে দুটোকে একই জায়গায় রেখে একটাকে ঘোরাতে থাকলে ঘুরে ফিরে আসার সংখ্যাটাই সাইকেলের দৈর্ঘ্য। এই কৌশলই Floyd's algorithm।\n\n## ধাপে ধাপে\n1. \`nxt\` তালিকাটা পড়ে নাও।\n2. \`slow = 0\`, \`fast = 0\` দিয়ে শুরু করো।\n3. লুপে: \`fast\` দুই ধাপ এগোও; কোনো ধাপে \`-1\` এলে \`NO\` ছাপে থামো।\n4. \`slow\` এক ধাপ এগোও; দুটো মিলে গেলে সাইকেল পাওয়া গেছে।\n5. \`slow\` থেকে শুরু করে \`nxt\` ধরে ঘোরে যতক্ষণ \`slow\`-এ ফিরে না আসে, গোনা করে সংখ্যাটা ছাপাও।\n\n\`\`\`python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nnxt = data[1:]\nslow = 0\nfast = 0\nwhile True:\n    fast = nxt[fast]\n    if fast == -1:\n        print("NO")\n        break\n    fast = nxt[fast]\n    if fast == -1:\n        print("NO")\n        break\n    slow = nxt[slow]\n    if slow == fast:\n        length = 1\n        cur = nxt[slow]\n        while cur != slow:\n            length += 1\n            cur = nxt[cur]\n        print("YES")\n        print(length)\n        break\n\`\`\`\n\n## কমপ্লেক্সিটি\nসময় \`O(n)\` — লেজ ও সাইকেল মিলিয়ে সর্বোচ্চ \`n\` ধাপ। মেমোরি \`O(1)\`। সাইকেল না থাকলেও লুপ \`n\`-এর মধ্যেই শেষ হয়।\n\n## সাধারণ ভুল\n- দ্রুত পয়েন্টার এগানোর সময় \`-1\` চেক না করা — \`nxt[-1]\` Python-এ শেষ উপাদান ফেরত দেয়, ফলে ভুল উত্তর বা অসীম লুপ।\n- সাইকেল মিলে গেলেই \`YES\` ছেপে দেওয়া, দৈর্ঘ্য না গোনা — উত্তর অসম্পূর্ণ হয়।\n- শুরুর নোডই যদি সাইকেলে থাকে (\`nxt[0] = 0\`), সেটা বাদ পড়ে — প্রথম ধাপেই \`slow\` আর \`fast\` মিলে যায়, দৈর্ঘ্য \`1\`।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Linked List", "Two Pointers", "Cycle Detection"],
    tests: [
      { input: "4\n1 2 3 -1\n", expectedOutput: "NO\n", isSample: true },
      { input: "4\n1 2 0 -1\n", expectedOutput: "YES\n3\n", isSample: true },
      { input: "1\n0\n", expectedOutput: "YES\n1\n", isSample: false },
      { input: "3\n-1 -1 -1\n", expectedOutput: "NO\n", isSample: false },
      { input: "6\n1 2 3 4 2 -1\n", expectedOutput: "YES\n3\n", isSample: false },
      { input: nAndNumbers(200000, Array.from({ length: 200000 }, (_, i) => (i === 199999 ? -1 : i + 1))), expectedOutput: "NO\n", isSample: false },
      { input: nAndNumbers(200000, Array.from({ length: 200000 }, (_, i) => (i + 1) % 200000)), expectedOutput: "YES\n200000\n", isSample: false },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\nnxt = data[1:]\nslow = 0\nfast = 0\nwhile True:\n    fast = nxt[fast]\n    if fast == -1:\n        print('NO')\n        break\n    fast = nxt[fast]\n    if fast == -1:\n        print('NO')\n        break\n    slow = nxt[slow]\n    if slow == fast:\n        length = 1\n        cur = nxt[slow]\n        while cur != slow:\n            length += 1\n            cur = nxt[cur]\n        print('YES')\n        print(length)\n        break\n",
  },
  {
    slug: "learn-m2-linked-list-x1",
    title: "Middle of the Linked List",
    statement: `ক্লাবের ভোটে প্রথমার্ধের প্রার্থীদের তালিকা আর পরের অংশের প্রার্থীদের তালিকা মিলিয়ে একটা লিস্ট হয়েছে। রফি মাঝের প্রার্থীটাকে খুঁজছেন — মাঝখানে দুটো হলে পরেরটাকে (ডান পাশেরটাকে) বেছে নেবেন।\n\nপ্রথম লাইনে \`n\`, দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা। লিস্টের মাঝের উপাদানটা ছাপাও।`,
    inputFormat: `প্রথম লাইনে \`n\`।
দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।`,
    outputFormat: `এক লাইনে মাঝের উপাদানটির মান।`,
    constraints: `1 <= n <= 200000\`
প্রতিটি মান \`1 <= v <= 1000\`।\nবিজোড় সংখ্যক হলে ঠিক মাঝটা, জোড় হলে দুই মাঝের পরেরটা (১-ভিত্তিক \`n // 2 + 1\` নম্বর)।`,
    editorial: `## ধারণা\nদুইটা পয়েন্টার দিয়ে এক নজরে সমাধান: \`slow\` এক ধাপ, \`fast\` দুই ধাপ এগোলে \`fast\` শেষে পৌঁছালে \`slow\` ঠিক মাঝখানে থাকে। জোড় সংখ্যক লিস্টে দুইটা মাঝ হয়, এবং এভাবে ঘোরালে \`slow\` পরেরটাতে থামে — যেটা এখানে চাওয়া হয়েছে। সোজা হিসেবেও করা যায়: \`a[n // 2]\` ইনডেক্সের মানটাই উত্তর, কারণ ইনডেক্স শূন্য থেকে শুরু।\n\n## ধাপে ধাপে\n1. \`n\` আর সব মান পড়ে নাও।\n2. মাঝের ইনডেক্স \`n // 2\` বের করো।\n3. ওই ইনডেক্সের মান ছাপাও।\n\n\`\`\`python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\nprint(a[n // 2])\n\`\`\`\n\nপয়েন্টার দিয়ে:\n\n\`\`\`python\nslow = head\nfast = head\nwhile fast is not None and fast.next is not None:\n    slow = slow.next\n    fast = fast.next.next\nprint(slow.value)\n\`\`\`\n\n## কমপ্লেক্সিটি\nসময় \`O(n)\`, মেমোরি \`O(1)\` — দুই ধাপেও একবারই লিস্ট ঘোরা হয়।\n\n## সাধারণ ভুল\n- জোড় সংখ্যকে প্রথম মাঝটা ধরে ফেলা — \`n = 4\`-এ উত্তর \`2\` নয়, \`3\` (১-ভিত্তিক)।\n- \`fast.next.next\`-এর আগে \`fast.next\` খালি কিনা না দেখা — শেষ নোডে পৌঁছে ক্র্যাশ হয়।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Linked List", "Two Pointers", "Traversal"],
    tests: [
      { input: "5\n10 20 30 40 50\n", expectedOutput: "30\n", isSample: true },
      { input: "4\n1 2 3 4\n", expectedOutput: "3\n", isSample: true },
      { input: "1\n9\n", expectedOutput: "9\n", isSample: false },
      { input: "2\n7 8\n", expectedOutput: "8\n", isSample: false },
      { input: "6\n1 2 3 4 5 6\n", expectedOutput: "4\n", isSample: false },
      { input: nAndNumbers(200000, Array.from({ length: 200000 }, (_, i) => (i % 97) + 1)), expectedOutput: "91\n", isSample: false },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\nprint(a[n // 2])\n",
  },
  {
    slug: "learn-m2-linked-list-x2",
    title: "Check Palindrome Linked List",
    statement: `সাদিয়া ভাবছেন ক্লাবের সদস্য তালিকাটা যদি উল্টো করেও একই দেখায়, তাহলে তালিকাটা প্যালিনড্রোম — যেমন \`1 2 1\` বা \`7 7\`। তুমি বলো দেওয়া লিস্টটা প্যালিনড্রোম কিনা।\n\nপ্রথম লাইনে \`n\`, দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা। হলে \`YES\`, না হলে \`NO\`।`,
    inputFormat: `প্রথম লাইনে \`n\`।
দ্বিতীয় লাইনে \`n\`টি পূর্ণসংখ্যা, স্পেস দিয়ে আলাদা।`,
    outputFormat: `প্যালিনড্রোম হলে \`YES\`, না হলে \`NO\`।`,
    constraints: `1 <= n <= 200000\`
প্রতিটি মান \`1 <= v <= 1000\`।`,
    editorial: `## ধারণা\nসবচেয়ে সহজ যাচাই: লিস্টের মানগুলো এক তালিকায় নিয়ে তার উল্টোটার সাথে হুবহু তুলনা করা। লিংকড লিস্টে আরও কৌশলী উপায় আছে — ধীর-দ্রুত পয়েন্টার দিয়ে মাঝখানে পৌঁছে দ্বিতীয়ার্ধ উল্টানো, তারপর পাশাপাশি মিলিয়ে দেখা — কিন্তু ইনপুট অ্যারে হিসেবে দেওয়া থাকায় সরাসরি তুলনাই যথেষ্ট এবং \`O(n)\` সময়ে চলে।\n\n## ধাপে ধাপে\n1. \`n\` আর সব মান পড়ে নাও।\n2. মানগুলোর উল্টো তালিকা বানাও।\n3. দুই তালিকা এক এক উপাদান তুলনা করো; একটাও মিললে \`NO\` ছাপে থামো।\n4. শেষ পর্যন্ত মিললে \`YES\` ছাপাও।\n\n\`\`\`python\nimport sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\nprint("YES" if a == a[::-1] else "NO")\n\`\`\`\n\n## কমপ্লেক্সিটি\nসময় \`O(n)\`, মেমোরি \`O(n)\` (উল্টো করা তালিকা)। কাঠামোগত সমাধানে মেমোরি \`O(1)\` করা যায়, কিন্তু তখন লিস্টের দ্বিতীয়ার্ধ উল্টে যায়।\n\n## সাধারণ ভুল\n- শুধু প্রথম ও শেষ মান মিলিয়ে দেখা — \`1 2 3 1\`-এ প্রথম-শেষ মিললেও লিস্ট প্যালিনড্রোম নয়।\n- জোড় সংখ্যকে মাঝ দিয়ে ভাগ করার সময় \`n // 2\` আর \`(n + 1) // 2\` গুলিয়ে ফেলা — মাঝের উপাদানটা দুইবার বা শূন্যবার ধরা হয়।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Linked List", "Two Pointers", "Palindrome"],
    tests: [
      { input: "5\n1 2 3 2 1\n", expectedOutput: "YES\n", isSample: true },
      { input: "4\n1 2 2 3\n", expectedOutput: "NO\n", isSample: true },
      { input: "1\n5\n", expectedOutput: "YES\n", isSample: false },
      { input: "2\n7 7\n", expectedOutput: "YES\n", isSample: false },
      { input: "2\n7 8\n", expectedOutput: "NO\n", isSample: false },
      { input: nAndNumbers(200000, (() => { const half = Array.from({ length: 100000 }, (_, i) => i + 1); return [...half, ...half.slice().reverse()]; })()), expectedOutput: "YES\n", isSample: false },
      { input: nAndNumbers(200000, (() => { const half = Array.from({ length: 100000 }, (_, i) => i + 1); const rev = half.slice().reverse(); rev[rev.length - 1] = 999; return [...half, ...rev]; })()), expectedOutput: "NO\n", isSample: false },
    ],
    referencePython:
      "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn = data[0]\na = data[1:]\nprint('YES' if a == a[::-1] else 'NO')\n",
  },
];
