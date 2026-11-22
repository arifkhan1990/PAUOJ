import { lineInput, nAndNumbers, newlineOutput, spaceOutput } from "../generated-tests";
import type { SeedProblem } from "../../seed-problems";

// জেনারেটেড টেস্টের জন্য ছোট সাহায্য ফাংশন। tree-traversals-problems.ts থেকেও এগুলো ব্যবহার হয়।
function rangeValues(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index + 1);
}

function descendingValues(count: number): number[] {
  return Array.from({ length: count }, (_, index) => count - index);
}

function rightChainTokens(values: number[]): string[] {
  const tokens: string[] = [String(values[0])];
  for (let index = 1; index < values.length; index += 1) {
    tokens.push("null", String(values[index]));
  }
  tokens.push("null", "null");
  return tokens;
}

function leftChainTokens(values: number[]): string[] {
  const tokens: string[] = [String(values[0])];
  for (let index = 1; index < values.length; index += 1) {
    tokens.push(String(values[index]), "null");
  }
  tokens.push("null", "null");
  return tokens;
}

function completeTokens(values: number[]): string[] {
  const tokens: string[] = [String(values[0])];
  for (let index = 0; index < values.length; index += 1) {
    tokens.push(2 * index + 1 < values.length ? String(values[2 * index + 1]) : "null");
    tokens.push(2 * index + 2 < values.length ? String(values[2 * index + 2]) : "null");
  }
  return tokens;
}

function mirrorChainTokens(depth: number): string[] {
  const tokens: string[] = ["1", "2", "2"];
  for (let level = 2; level <= depth; level += 1) {
    tokens.push(String(level + 1), "null", "null", String(level + 1));
  }
  tokens.push("null", "null", "null", "null");
  return tokens;
}

export { completeTokens, descendingValues, leftChainTokens, rangeValues, rightChainTokens };

export const BINARY_TREES_BST_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m4-binary-trees-bst-g1",
    title: "Count Tree Nodes",
    statement:
      "প্রাইমএশিয়া ক্লাবের মেন্টরিং সিস্টেম একটা বাইনারি ট্রিতে সংরক্ষিত — প্রতিটি সদস্যের সরাসরি সর্বোচ্চ দুইজন ছাত্র আছে, বাম ও ডান। তানভীর জানতে চান এই গাছে মোট কয়জন সদস্য আছে, রুটসহ সবাই। ইনপুটে গাছটা level order অনুযায়ী টোকেন হিসেবে দেওয়া থাকে, যেখানে `null` মানে ওই ঘরটা খালি।\n\nউদাহরণ: টোকেন `1`, `2`, `3` হলে রুট `1`-এর বামে `2` আর ডানে `3` — মোট সদস্য `3` জন।",
    inputFormat:
      "প্রথম লাইনে টোকেন সংখ্যা `n`।\nপরবর্তী `n` লাইনে একটি করে টোকেন: একটি পূর্ণসংখ্যা অথবা `null`।\n\nটোকেনগুলো রুট থেকে শুরু করে level order অনুযায়ী সাজানো। প্রতিটি non-null নোডের সন্তান হিসেবে পরবর্তী দুইটি টোকেন নেওয়া হয় — আগে বাম, পরে ডান। টোকেন শেষ হলে সেই সন্তান `null` ধরা হয়, আর `null` নোডের সন্তান কোনো টোকেন পায় না। প্রথম টোকেন সবসময় একটি পূর্ণসংখ্যা (গাছ কখনো খালি নয়)।",
    outputFormat: "এক লাইনে গাছের নন-`null` নোডের সংখ্যা প্রিন্ট করুন।",
    constraints: "`1 <= n <= 100001`\nপ্রতিটি নোডের মান `1 <= v <= 10^5`।",
    editorial:
      "### ধারণা\n\nগাছের প্রতিটি নোড ঠিক একবার ঘোরাই যথেষ্ট — ঘোরার সময় গোনা করে ফেললে উত্তর পাওয়া যায়। level order (BFS) দিয়ে ঘোরলে একটা queue-তে প্রতিটি non-null নোড একবার ঢোকে আর একবার বের হয়, তাই খরচ হয় `O(n)`। `null` টোকেন কোনো নোড নয়, তাই সেটা গুনতে হবে না।\n\n### ধাপে ধাপে\n\n1. প্রথম লাইন থেকে `n` নিন, পরের `n` টোকেন একটা লিস্টে রাখুন।\n2. প্রথম টোকেন দিয়ে রুট বানিয়ে queue-তে বসান, `count = 1` দিয়ে শুরু করুন।\n3. queue থেকে একটা নোড তুলে পরবর্তী দুইটি টোকেন বাম ও ডান সন্তান হিসেবে দেখুন; `null` না হলে নতুন নোড বানিয়ে queue-তে যোগ করুন এবং `count` বাড়ান।\n4. টোকেন শেষ হলে বা queue খালি হলে থামুন এবং `count` প্রিন্ট করুন।\n\n```python\nimport sys\nfrom collections import deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    tokens = data[1:1 + n]\n    root = Node(int(tokens[0]))\n    count = 1\n    queue = deque([root])\n    i = 1\n    while queue and i < n:\n        node = queue.popleft()\n        if i < n:\n            if tokens[i] != 'null':\n                node.left = Node(int(tokens[i]))\n                queue.append(node.left)\n                count += 1\n            i += 1\n        if i < n:\n            if tokens[i] != 'null':\n                node.right = Node(int(tokens[i]))\n                queue.append(node.right)\n                count += 1\n            i += 1\n    print(count)\n\nmain()\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n)` — প্রতিটি টোকেন ঠিক একবার পড়া হয়। স্পেস `O(n)`: গাছটা তৈরি থাকে, আর খালি নোড না থাকায় queue-তে সবসময় অল্প নোডই থাকে।\n\n### সাধারণ ভুল\n\n- `null` টোকেনকেও নোড ধরে গোনা: `null` মানে খালি ঘর, সেটি সদস্য নয়।\n- এক সন্তান পড়ে থামে যাওয়া: প্রতিটি non-null নোডের জন্য দুই সন্তানের জন্য দুইটি করে টোকেন নিতে হয়, একটা এড়ালে বাকি গাছটা এলোমেলো হয়ে যায়।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Binary Trees", "BFS", "Counting"],
    tests: [
      { input: "3\n1\n2\n3\n", expectedOutput: "3\n", isSample: true },
      {
        input: "15\n1\n2\n3\n4\n5\n6\n7\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\n",
        expectedOutput: "7\n",
        isSample: true,
      },
      { input: "5\n10\n5\nnull\nnull\n7\n", expectedOutput: "3\n", isSample: false },
      {
        input: "7\n1\n2\nnull\n3\nnull\nnull\nnull\n",
        expectedOutput: "3\n",
        isSample: false,
      },
      {
        input: lineInput(rightChainTokens(rangeValues(50000))),
        expectedOutput: "50000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    tokens = data[1:1 + n]\n    root = Node(int(tokens[0]))\n    count = 1\n    queue = deque([root])\n    i = 1\n    while queue and i < n:\n        node = queue.popleft()\n        if i < n:\n            if tokens[i] != 'null':\n                node.left = Node(int(tokens[i]))\n                queue.append(node.left)\n                count += 1\n            i += 1\n        if i < n:\n            if tokens[i] != 'null':\n                node.right = Node(int(tokens[i]))\n                queue.append(node.right)\n                count += 1\n            i += 1\n    print(count)\n\nmain()\n",
  },
  {
    slug: "learn-m4-binary-trees-bst-g2",
    title: "BST Search Queries",
    statement:
      "রাফি BST বানানোর অনুশীলন করছেন: একটা লিস্টের মান একটার পর একটা গাছে ঢোকাচ্ছেন, যেখানে ছোট মান সবসময় বামে যায় আর বড় মান ডানে। কাজ শেষে নুসরাত কয়েকটা মান দিয়ে জিজ্ঞেস করলেন — এই মানটা গাছে আছে কি না? প্রতিটি প্রশ্নের উত্তর এক এক লাইনে দিন।\n\nউদাহরণ: ঢোকানো মান `5 3 8`, প্রশ্ন `3` → `YES`, প্রশ্ন `9` → `NO`।",
    inputFormat:
      "প্রথম লাইনে `n` — যতগুলো মান একটার পর একটা BST-এ ঢোকানো হয়েছে।\nদ্বিতীয় লাইনে `n` টি স্বতন্ত্র পূর্ণসংখ্যা, ঢোকানোর ক্রম অনুযায়ী।\nতৃতীয় লাইনে `q` — প্রশ্ন সংখ্যা।\nচতুর্থ লাইনে `q` টি পূর্ণসংখ্যা, প্রতিটি খোঁজা মান।",
    outputFormat: "প্রতিটি প্রশ্নের উত্তর আলাদা লাইনে: মানটি গাছে থাকলে `YES`, না থাকলে `NO`।",
    constraints:
      "`1 <= n <= 2000`\n`1 <= q <= 2000`\n`-10^9 <= value <= 10^9`\nঢোকানো মানগুলো স্বতন্ত্র; খোঁজা মান যেকোনো হতে পারে।",
    editorial:
      "### ধারণা\n\nBST-এ খোঁজা চলে রুট থেকে নিচে: খোঁজা মান বর্তমান নোডের চেয়ে ছোট হলে বামে, বড় হলে ডানে, সমান হলে পাওয়া গেছে। প্রতিপাশে অর্ধেকটা গাছ বাদ পড়ায় প্রতি ধাপে কাজ অর্ধেক হয়ে যায় — তাই খরচ `O(height)`, ভারসাম্য থাকলে `O(log n)`।\n\n### ধাপে ধাপে\n\n1. `n` টি মান একটার পর একটা ঢোকিয়ে BST বানান: রুট খালি থাকলে নতুন নোড, নয়তো ছোট হলে বামে, বড় হলে ডানে এগোন।\n2. প্রতিটি প্রশ্নের জন্য `node = root` দিয়ে শুরু করুন।\n3. `node` খালি না হওয়া পর্যন্ত: মিলে গেলে `YES`, নয়তে উপরের নিয়ম মেনে এক ধাপ নামুন।\n4. `node` খালি হলে মানটা নেই — `NO` প্রিন্ট করুন।\n\n```python\nimport sys\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef insert(root, value):\n    if root is None:\n        return Node(value)\n    node = root\n    while True:\n        if value < node.value:\n            if node.left is None:\n                node.left = Node(value)\n                break\n            node = node.left\n        else:\n            if node.right is None:\n                node.right = Node(value)\n                break\n            node = node.right\n    return root\n\ndef main():\n    data = sys.stdin.read().split()\n    it = iter(data)\n    n = int(next(it))\n    inserts = [int(next(it)) for _ in range(n)]\n    q = int(next(it))\n    queries = [int(next(it)) for _ in range(q)]\n\n    root = None\n    for value in inserts:\n        root = insert(root, value)\n\n    out = []\n    for target in queries:\n        node, found = root, False\n        while node is not None:\n            if target == node.value:\n                found = True\n                break\n            node = node.left if target < node.value else node.right\n        out.append('YES' if found else 'NO')\n    sys.stdout.write('\\n'.join(out) + '\\n')\n\nmain()\n```\n\n### কমপ্লেক্সিটি\n\nপ্রতিটি insert ও search `O(height)`; মোট `O((n + q) * height)`। ভারসাম্য থাকলে `O((n + q) * log n)`, একপাশে ঝোকা গাছে `O((n + q) * n)` — তাই `n`-এর সীমা ছোট রাখা হয়েছে। স্পেস `O(n)`।\n\n### সাধারণ ভুল\n\n- শুধু রুটের সাথে তুলনা করে থামে যাওয়া: এক ধাপে না পেলে বাম/ডান সাবট্রিতে নামতে হবে।\n- সমান মান এলে লুপ ঘুরে যাওয়া: মান স্বতন্ত্র বলে সমান হলেই থামুন, আর insert-এ সমান মান কোন পাশে যাবে সেটা একরকম রাখুন।\n- `n` বড় হলে সোজা গাছে recursion depth `n` হয়ে যায় — `RecursionError` এড়াতে লুপ ব্যবহার করা নিরাপদ।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    tags: ["Binary Search Tree", "Search"],
    tests: [
      { input: "3\n5 3 8\n2\n3 9\n", expectedOutput: "YES\nNO\n", isSample: true },
      { input: "1\n4\n2\n4 5\n", expectedOutput: "YES\nNO\n", isSample: true },
      { input: "3\n9 8 7\n3\n7 9 10\n", expectedOutput: "YES\nYES\nNO\n", isSample: false },
      { input: "3\n-5 -1 3\n2\n-1 0\n", expectedOutput: "YES\nNO\n", isSample: false },
      {
        input:
          nAndNumbers(2000, rangeValues(2000)) + nAndNumbers(2000, rangeValues(2000)),
        expectedOutput: newlineOutput(Array(2000).fill("YES")),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef insert(root, value):\n    if root is None:\n        return Node(value)\n    node = root\n    while True:\n        if value < node.value:\n            if node.left is None:\n                node.left = Node(value)\n                break\n            node = node.left\n        else:\n            if node.right is None:\n                node.right = Node(value)\n                break\n            node = node.right\n    return root\n\ndef main():\n    data = sys.stdin.read().split()\n    it = iter(data)\n    n = int(next(it))\n    inserts = [int(next(it)) for _ in range(n)]\n    q = int(next(it))\n    queries = [int(next(it)) for _ in range(q)]\n\n    root = None\n    for value in inserts:\n        root = insert(root, value)\n\n    out = []\n    for target in queries:\n        node, found = root, False\n        while node is not None:\n            if target == node.value:\n                found = True\n                break\n            node = node.left if target < node.value else node.right\n        out.append('YES' if found else 'NO')\n    sys.stdout.write('\\n'.join(out) + '\\n')\n\nmain()\n",
  },
  {
    slug: "learn-m4-binary-trees-bst-e1",
    title: "Tree Height in Edges",
    statement:
      "ক্লাবের মেন্টরিং গাছে সবচেয়ে নিচে পৌঁছাতে কয়টা ধাপ লাগে — সেটাই গাছের উচ্চতা। সাদিয়া জানতে চান সবচেয়ে লম্বা পথটা কত দূর, যাতে বোঝা যায় মেন্টরিং কত স্তরে গেছে। উচ্চতা মাপা হয় এজ দিয়ে: রুট থেকে কোনো পাতা পর্যন্ত সবচেয়ে লম্বা পথের এজ সংখ্যাটাই উত্তর, আর একা নোডের উচ্চতা `0`।\n\nউদাহরণ: `1`-এর বামে `2`, `2`-এর বামে `3` — এই সোজা গাছের উচ্চতা `2`।",
    inputFormat:
      "প্রথম লাইনে টোকেন সংখ্যা `n`।\nপরবর্তী `n` লাইনে একটি করে টোকেন: পূর্ণসংখ্যা অথবা `null`।\n\nটোকেন ক্রম ও সন্তান নেওয়ার নিয়ম ঠিক যেমন `learn-m4-binary-trees-bst-g1`-এ: level order, প্রতিটি non-null নোডের জন্য আগে বাম পরে ডান।",
    outputFormat: "এক লাইনে গাছের উচ্চতা (এজ সংখ্যা) প্রিন্ট করুন।",
    constraints: "`1 <= n <= 100001`\nপ্রতিটি নোডের মান `1 <= v <= 10^5`।",
    editorial:
      "### ধারণা\n\nউচ্চতা হলো রুট থেকে পাতা পর্যন্ত সবচেয়ে লম্বা পথের এজ সংখ্যা। সবচেয়ে সহজ ভাবে বলা যায়: গাছের স্তর ধরে ধরে নিচে নামুন, কয়টা স্তর পেয়েছেন সেটাই উচ্চতা। রুট একটাই স্তর (স্তর ০), তাই একা নোডের উচ্চতা `0` — নোড গোনা নয়, এজ গোনা।\n\n### ধাপে ধাপে\n\n1. টোকেন থেকে গাছটা বানান (queue দিয়ে level order)।\n2. একটা `level` লিস্টে রুট বসিয়ে `height = -1` দিয়ে শুরু করুন।\n3. `level` খালি না থাকা পর্যন্ত: `height` এক বাড়ান, তারপর সব নোডের বাম ও ডান সন্তান নিয়ে পরের স্তর বানান।\n4. লুপ শেষে `height` প্রিন্ট করুন।\n\n```python\nimport sys\nfrom collections import deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    tokens = data[1:1 + n]\n    root = Node(int(tokens[0]))\n    queue = deque([root])\n    i = 1\n    while queue and i < n:\n        node = queue.popleft()\n        if i < n:\n            if tokens[i] != 'null':\n                node.left = Node(int(tokens[i]))\n                queue.append(node.left)\n            i += 1\n        if i < n:\n            if tokens[i] != 'null':\n                node.right = Node(int(tokens[i]))\n                queue.append(node.right)\n            i += 1\n\n    height = -1\n    level = [root]\n    while level:\n        height += 1\n        next_level = []\n        for node in level:\n            if node.left:\n                next_level.append(node.left)\n            if node.right:\n                next_level.append(node.right)\n        level = next_level\n    print(height)\n\nmain()\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n)` (গাছ বানানো + স্তর ধরে ঘোরা), স্পেস `O(n)`। ভাঙা recursion ছাড়াও করা যায়: DFS-এ প্রতিটি নোডের সাথে তার depth রেখে সর্বোচ্চ বের করুন, তবে সোজা গাছে recursion ভেঙে যেতে পারে তাই লুপ/queue নিরাপদ।\n\n### সাধারণ ভুল\n\n- নোড গোনে ফেলা: একা নোডের উচ্চতা `1` নয়, `0` (এজ হিসেবে মাপা হচ্ছে)।\n- সোজা গাছে recursion: depth `50000` হলে Python-এর ডিফল্ট limit `1000` ছাড়িয়ে `RecursionError` আসে।\n- প্রতিটি নোডের জন্য আলাদা করে উচ্চতা হিসাব করে বারবার ঘোরা: এক বারের BFS-ই `O(n)`, তার চেয়ে দ্রুত কিছু নেই।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Binary Trees", "BFS", "Height"],
    tests: [
      { input: "1\n5\n", expectedOutput: "0\n", isSample: true },
      {
        input: "15\n1\n2\n3\n4\n5\n6\n7\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\n",
        expectedOutput: "2\n",
        isSample: true,
      },
      {
        input: "11\n1\n2\nnull\n3\nnull\n4\nnull\n5\nnull\nnull\nnull\n",
        expectedOutput: "4\n",
        isSample: false,
      },
      { input: "5\n10\n5\nnull\nnull\n7\n", expectedOutput: "2\n", isSample: false },
      {
        input: lineInput(rightChainTokens(rangeValues(50000))),
        expectedOutput: "49999\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    tokens = data[1:1 + n]\n    root = Node(int(tokens[0]))\n    queue = deque([root])\n    i = 1\n    while queue and i < n:\n        node = queue.popleft()\n        if i < n:\n            if tokens[i] != 'null':\n                node.left = Node(int(tokens[i]))\n                queue.append(node.left)\n            i += 1\n        if i < n:\n            if tokens[i] != 'null':\n                node.right = Node(int(tokens[i]))\n                queue.append(node.right)\n            i += 1\n\n    height = -1\n    level = [root]\n    while level:\n        height += 1\n        next_level = []\n        for node in level:\n            if node.left:\n                next_level.append(node.left)\n            if node.right:\n                next_level.append(node.right)\n        level = next_level\n    print(height)\n\nmain()\n",
  },
  {
    slug: "learn-m4-binary-trees-bst-m1",
    title: "Validate Binary Search Tree",
    statement:
      "তানভীর নিজের হাতে কয়েকটা গাছ বানিয়ে দাবি করছেন প্রতিটি সত্যিকারের BST। সাদিয়া যাচাই করবেন একটামাত্র নিয়ম দিয়ে: প্রতিটি নোডের বাম সাবট্রির সব মান তার চেয়ে ছোট আর ডান সাবট্রির সব মান বড় হতে হবে — শুধু বাপ আর ছেলের মান মিললেই যথেষ্ট নয়, পুরো সীমা মিলতে হবে।\n\nউদাহরণ: রুট `10`, তার বামে `5`, আর `5`-এর ডানে `12` — বাপ-ছেলে দুই জায়গাতেই নিয়ম মিললেও `12 > 10` হওয়ায় গাছটি BST নয় → `NO`।",
    inputFormat:
      "প্রথম লাইনে টোকেন সংখ্যা `n`।\nপরবর্তী `n` লাইনে একটি করে টোকেন: পূর্ণসংখ্যা অথবা `null`।\n\nটোকেন ক্রম ও সন্তান নেওয়ার নিয়ম `learn-m4-binary-trees-bst-g1`-এর মতোই।",
    outputFormat: "গাছটি BST হলে `YES`, নয়তে `NO` এক লাইনে প্রিন্ট করুন।",
    constraints:
      "`1 <= n <= 100001`\nসব নোডের মান স্বতন্ত্র এবং `1 <= v <= 10^9`।",
    editorial:
      "### ধারণা\n\nBST-এর নিয়ম শুধু বাপ-ছেলে নয় — কোনো নোডের মান তার পুরো বাম সাবট্রির চেয়ে বড় আর পুরো ডান সাবট্রির চেয়ে ছোট হতে হবে। এটা একসাথে যাচাই করার সবচেয়ে সহজ উপায় হলো প্রতিটি নোডের সাথে একটা করে সীমা (bound) ঘোরা: রুটের জন্য সীমা `(-∞, +∞)`, বামে যাওয়ার সময় উপরের সীমা হয় বাপের মান, ডানে যাওয়ার সময় নিচের সীমা হয় বাপের মান। কোনো নোড যদি তার সীমার বাইরে হয়, গাছটি BST নয়।\n\n### ধাপে ধাপে\n\n1. টোকেন থেকে গাছটা বানান।\n2. একটা stack-এ `(নোড, নিচের সীমা, উপরের সীমা)` বসিয়ে শুরু করুন; রুটের জন্য সীমা অসীম।\n3. নোড তুলে দেখুন: `low < value < high` না হলে সঙ্গে সঙ্গে `NO` প্রিন্ট করে ফিরে আসুন।\n4. শর্ত মিললে বাম সন্তানকে `(low, value)`, ডান সন্তানকে `(value, high)` সীমা দিয়ে stack-এ বসান।\n5. stack খালি হলে সব নোড মিলেছে — `YES` প্রিন্ট করুন।\n\n```python\nimport sys\nfrom collections import deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    tokens = data[1:1 + n]\n    root = Node(int(tokens[0]))\n    queue = deque([root])\n    i = 1\n    while queue and i < n:\n        node = queue.popleft()\n        if i < n:\n            if tokens[i] != 'null':\n                node.left = Node(int(tokens[i]))\n                queue.append(node.left)\n            i += 1\n        if i < n:\n            if tokens[i] != 'null':\n                node.right = Node(int(tokens[i]))\n                queue.append(node.right)\n            i += 1\n\n    stack = [(root, float('-inf'), float('inf'))]\n    while stack:\n        node, low, high = stack.pop()\n        if not (low < node.value < high):\n            print('NO')\n            return\n        if node.left:\n            stack.append((node.left, low, node.value))\n        if node.right:\n            stack.append((node.right, node.value, high))\n    print('YES')\n\nmain()\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n)` — প্রতিটি নোড ঠিক একবার যাচাই হয়। স্পেস `O(n)` (stack-এ একসাথে সবচেয়ে বেশি নোড থাকতে পারে, সাধারণত `O(height)`)।\n\n### সাধারণ ভুল\n\n- শুধু বাপ-ছেলে মিলিয়ে দেওয়া: `10 → 5 → 12` ধরনের ভুল গাছ তাতে ধরা পড়ে না।\n- সমান মান হলেও `YES` দেওয়া: প্রশ্নে মান স্বতন্ত্র, তবু সীমা হলো কঠোর (`<` ও `>`), `<=` নয়।\n- সোজা গাছে recursion: ঝোকা গাছে depth `n` হয়ে গেলে `RecursionError` আসে।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Binary Search Tree", "Validation", "Stack"],
    tests: [
      {
        input: "15\n4\n2\n6\n1\n3\n5\n7\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\n",
        expectedOutput: "YES\n",
        isSample: true,
      },
      { input: "5\n10\n5\n15\nnull\n12\n", expectedOutput: "NO\n", isSample: true },
      { input: "1\n7\n", expectedOutput: "YES\n", isSample: false },
      {
        input:
          "31\n8\n4\n12\n2\n6\n10\n14\n1\n3\n5\n7\n9\n11\n13\n15\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\n",
        expectedOutput: "YES\n",
        isSample: false,
      },
      {
        input: lineInput(rightChainTokens([...rangeValues(500).map((value) => value + 9), 5])),
        expectedOutput: "NO\n",
        isSample: false,
      },
      {
        input: lineInput(rightChainTokens(rangeValues(50000))),
        expectedOutput: "YES\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    tokens = data[1:1 + n]\n    root = Node(int(tokens[0]))\n    queue = deque([root])\n    i = 1\n    while queue and i < n:\n        node = queue.popleft()\n        if i < n:\n            if tokens[i] != 'null':\n                node.left = Node(int(tokens[i]))\n                queue.append(node.left)\n            i += 1\n        if i < n:\n            if tokens[i] != 'null':\n                node.right = Node(int(tokens[i]))\n                queue.append(node.right)\n            i += 1\n\n    stack = [(root, float('-inf'), float('inf'))]\n    while stack:\n        node, low, high = stack.pop()\n        if not (low < node.value < high):\n            print('NO')\n            return\n        if node.left:\n            stack.append((node.left, low, node.value))\n        if node.right:\n            stack.append((node.right, node.value, high))\n    print('YES')\n\nmain()\n",
  },
  {
    slug: "learn-m4-binary-trees-bst-h1",
    title: "BST Insert and Delete",
    statement:
      "ক্লাবের সদস্য তালিকা BST-এ সাজানো, যাতে নতুন নাম যোগ করা আর বাদ দেওয়া দ্রুত হয়। আজ কয়েকজন সদস্য যোগ হলেন, পরে কয়েকজনের নাম কাটা হলো; শেষে তানভীর জানতে চান গাছটা এখন কেমন দাঁড়িয়ে আছে — তাই পুরো ট্রির preorder ট্রাভার্সাল প্রিন্ট করুন।\n\nমুছে ফেলার নিয়ম: পাতা বা এক সন্তানওয়ালা নোড সরাসরি সরিয়ে ফেলা যায়। কিন্তু দুই সন্তানওয়ালা নোড মুছার সময় তার জায়গায় ডান সাবট্রির সবচেয়ে ছোট মান (inorder successor) বসবে, আর ওই সাকসেসর নোডটিকে তার নিজের জায়গা থেকেও সরানো হবে।\n\nউদাহরণ: ঢোকানো `5 3 8 2 4`, মুছবে `5` — শেষে preorder `8 3 2 4`।",
    inputFormat:
      "প্রথম লাইনে `n` — যতগুলো মান একটার পর একটা BST-এ ঢোকানো হবে।\nদ্বিতীয় লাইনে `n` টি স্বতন্ত্র পূর্ণসংখ্যা, ঢোকানোর ক্রম অনুযায়ী।\nতৃতীয় লাইনে `m` — যতগুলো মান মুছতে হবে।\nচতুর্থ লাইনে `m` টি পূর্ণসংখ্যা; যেগুলো এখনো গাছে নেই সেগুলো উপেক্ষা করতে হবে।",
    outputFormat:
      "সব কাজের পর ট্রিটির preorder ক্রমে (রুট, বাম, ডান) মানগুলো এক লাইনে স্পেস দিয়ে প্রিন্ট করুন। ট্রিটা খালি হলে কিছু প্রিন্ট করবেন না (খালি লাইনও চলবে)।",
    constraints:
      "`1 <= n <= 3000`\n`0 <= m <= 3000`\nঢোকানো মান স্বতন্ত্র এবং `1 <= v <= 10^9`; মুছার মান যেকোনো হতে পারে।",
    editorial:
      "### ধারণা\n\nBST insert সহজ: রুট থেকে ছোট হলে বামে, বড় হলে ডানে এগিয়ে শেষ খালি ঘরে নতুন নোড বসে। Delete-এ তিনটা কেস আলাদা — (১) পাতা: সরাসরি ফেলুন, (২) এক সন্তান: সন্তানটাকে সরিয়ে বাপের ঘরে বসান, (৩) দুই সন্তান: ডান সাবট্রির সবচেয়ে ছোট মান বা inorder successor বের করে তা মুছে যাওয়া নোডের মান বসান, তারপর ওই successor নোডটিকে তার নিজের জায়গা থেকে মুছে দিন (সে সবসময় বাম সন্তানহীন, তাই কেস ১ বা ২ হয়)। এই তিন কেস মিলিয়েই delete `O(height)` সময়ে শেষ হয়।\n\n### ধাপে ধাপে\n\n1. `n` টি মান একটার পর একটা insert করে গাছ বানান।\n2. প্রতিটি মুছার মানের জন্য রুট থেকে নিচে নেমে ওই নোডটি খুঁজুন; না পেলে কিছু করবেন না।\n3. উপরের তিন কেস অনুযায়ী নোডটি সরান — দুই সন্তান হলে successor বসিয়ে successor নোডটিও মুছুন।\n4. সব কাজ শেষে রুট থেকে preorder (রুট, বাম, ডান) ঘুরে মানগুলো একটা লিস্টে নিন।\n5. লিস্ট খালি হলে কিছু না লিখুন, নয়তে স্পেস দিয়ে যোগ করে এক লাইনে ছাড়ুন।\n\n```python\nimport sys\nsys.setrecursionlimit(20000)\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef insert(node, value):\n    if node is None:\n        return Node(value)\n    if value < node.value:\n        node.left = insert(node.left, value)\n    else:\n        node.right = insert(node.right, value)\n    return node\n\ndef delete(node, target):\n    if node is None:\n        return None\n    if target < node.value:\n        node.left = delete(node.left, target)\n    elif target > node.value:\n        node.right = delete(node.right, target)\n    else:\n        if node.left is None:\n            return node.right\n        if node.right is None:\n            return node.left\n        successor = node.right\n        while successor.left:\n            successor = successor.left\n        node.value = successor.value\n        node.right = delete(node.right, successor.value)\n    return node\n\ndef preorder(node, order):\n    if node is None:\n        return\n    order.append(node.value)\n    preorder(node.left, order)\n    preorder(node.right, order)\n\ndef main():\n    data = sys.stdin.read().split()\n    it = iter(data)\n    n = int(next(it))\n    inserts = [int(next(it)) for _ in range(n)]\n    m = int(next(it))\n    deletes = [int(next(it)) for _ in range(m)]\n\n    root = None\n    for value in inserts:\n        root = insert(root, value)\n    for value in deletes:\n        root = delete(root, value)\n\n    order = []\n    preorder(root, order)\n    print(' '.join(map(str, order)))\n\nmain()\n```\n\n### কমপ্লেক্সিটি\n\nপ্রতিটি insert ও delete `O(height)`; মোট `O((n + m) * height)`। ভারসাম্য থাকলে `O((n + m) * log n)`, একপাশে ঝোকা গাছে `O((n + m) * n)` — তাই `n`-এর সীমা `3000` রাখা হয়েছে। Preorder ঘোরা `O(n)`। স্পেস `O(n)`।\n\n### সাধারণ ভুল\n\n- দুই সন্তানওয়ালা কেসে শুধু মান বদলে দিয়ে থামা: successor নোডটিকে তার নিজের জায়গা থেকেও সরাতে হবে, নাহলে একই মান দুইবার থেকে যায়।\n- Successor ভুল করে ডান সন্তান ধরে নেওয়া: successor হলো ডান সাবট্রির **সবচেয়ে ছোট** মান, ডান সন্তান নয় (ডান সন্তান বড় হতে পারে)।\n- মুছার পর মানটা না পেলেও গাছে রাখা: প্রশ্ন বলেছে অনুপস্থিত মান উপেক্ষা করতে।\n- Python-এ গভীর recursion: `sys.setrecursionlimit()` না দিলে সোজা গাছে `RecursionError` আসে।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Binary Search Tree", "Delete", "Recursion"],
    tests: [
      { input: "5\n5 3 8 2 4\n1\n5\n", expectedOutput: "8 3 2 4\n", isSample: true },
      { input: "3\n4 2 6\n0\n", expectedOutput: "4 2 6\n", isSample: true },
      { input: "5\n6 4 8 2 5\n2\n3 9\n", expectedOutput: "6 4 2 5 8\n", isSample: false },
      { input: "7\n5 3 8 2 4 7 9\n1\n5\n", expectedOutput: "7 3 2 4 8 9\n", isSample: false },
      { input: "4\n4 2 6 5\n4\n4 2 6 5\n", expectedOutput: "", isSample: false },
      {
        input:
          nAndNumbers(3000, rangeValues(3000)) +
          nAndNumbers(1500, rangeValues(1500).map((value) => 2 * value)),
        expectedOutput: spaceOutput(rangeValues(1500).map((value) => 2 * value - 1)),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nsys.setrecursionlimit(20000)\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef insert(node, value):\n    if node is None:\n        return Node(value)\n    if value < node.value:\n        node.left = insert(node.left, value)\n    else:\n        node.right = insert(node.right, value)\n    return node\n\ndef delete(node, target):\n    if node is None:\n        return None\n    if target < node.value:\n        node.left = delete(node.left, target)\n    elif target > node.value:\n        node.right = delete(node.right, target)\n    else:\n        if node.left is None:\n            return node.right\n        if node.right is None:\n            return node.left\n        successor = node.right\n        while successor.left:\n            successor = successor.left\n        node.value = successor.value\n        node.right = delete(node.right, successor.value)\n    return node\n\ndef preorder(node, order):\n    if node is None:\n        return\n    order.append(node.value)\n    preorder(node.left, order)\n    preorder(node.right, order)\n\ndef main():\n    data = sys.stdin.read().split()\n    it = iter(data)\n    n = int(next(it))\n    inserts = [int(next(it)) for _ in range(n)]\n    m = int(next(it))\n    deletes = [int(next(it)) for _ in range(m)]\n\n    root = None\n    for value in inserts:\n        root = insert(root, value)\n    for value in deletes:\n        root = delete(root, value)\n\n    order = []\n    preorder(root, order)\n    print(' '.join(map(str, order)))\n\nmain()\n",
  },
  {
    slug: "learn-m4-binary-trees-bst-x1",
    title: "Count Leaf Nodes",
    statement:
      "ক্লাব অডিটর চান জানতে যাদের নিজে কোনো ছাত্র নেই — অর্থাৎ গাছের যে নোডগুলোর কোনো সন্তান নেই, তারাই পাতা নোড। পুরো মেন্টরিং গাছ দেওয়া থাকবে; কয়টা পাতা আছে সেটি গুনে বলুন।\n\nউদাহরণ: রুট `1`, তার বামে `2` আর ডানে `3` — তিনটাই পাতা নয় যদি `2` ও `3`-এর সন্তান না থাকে; এই গাছে পাতা `2` আর `3`, মোট `2`টি।",
    inputFormat:
      "প্রথম লাইনে টোকেন সংখ্যা `n`।\nপরবর্তী `n` লাইনে একটি করে টোকেন: পূর্ণসংখ্যা অথবা `null`।\n\nটোকেন ক্রম ও সন্তান নেওয়ার নিয়ম `learn-m4-binary-trees-bst-g1`-এর মতোই।",
    outputFormat: "এক লাইনে পাতা নোডের সংখ্যা প্রিন্ট করুন।",
    constraints: "`1 <= n <= 100001`\nপ্রতিটি নোডের মান `1 <= v <= 10^5`।",
    editorial:
      "### ধারণা\n\nপাতা মানে যে নোডের বাম ও ডান — দুই ঘরেই কেউ নেই। তাই গাছ ঘোরার সময় প্রতিটি নোড দিয়ে যেতে হবে, আর দুই সন্তানই খালি হলে কাউন্টার এক বাড়াবে। একটা পাতাওয়ালা গাছে (একা রুট) উত্তর `1`, আর সোজা গাছে পাতা মাত্র একটি — যেকোনো শাখার শেষ নোড।\n\n### ধাপে ধাপে\n\n1. টোকেন থেকে গাছটা বানান (queue দিয়ে level order)।\n2. একটা stack বা queue নিয়ে রুট দিয়ে শুরু করুন।\n3. প্রতিটি নোডে দেখুন: বাম ও ডান দুটোই `None` হলে `leaves += 1`, নয়তে যেটা আছে সেগুলো queue/stack-এ যোগ করুন।\n4. ঘোরা শেষে `leaves` প্রিন্ট করুন।\n\n```python\nimport sys\nfrom collections import deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    tokens = data[1:1 + n]\n    root = Node(int(tokens[0]))\n    queue = deque([root])\n    i = 1\n    while queue and i < n:\n        node = queue.popleft()\n        if i < n:\n            if tokens[i] != 'null':\n                node.left = Node(int(tokens[i]))\n                queue.append(node.left)\n            i += 1\n        if i < n:\n            if tokens[i] != 'null':\n                node.right = Node(int(tokens[i]))\n                queue.append(node.right)\n            i += 1\n\n    leaves = 0\n    stack = [root]\n    while stack:\n        node = stack.pop()\n        if node.left is None and node.right is None:\n            leaves += 1\n        else:\n            if node.left:\n                stack.append(node.left)\n            if node.right:\n                stack.append(node.right)\n    print(leaves)\n\nmain()\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(n)` — প্রতিটি নোড একবার ঘোরা হয়।\n\n### সাধারণ ভুল\n\n- এক সন্তানওয়ালা নোডকেও পাতা ধরা: পাতা মানে **দুই** সন্তানহীন।\n- `null` টোকেনকে পাতা ধরে গোনা: `null` কোনো নোডই নয়।\n- রুট যদি একা হয়, তাহলে উত্তর `0` নয় — রুটটাও তখন পাতা, উত্তর `1`।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Binary Trees", "DFS", "Leaf"],
    tests: [
      { input: "1\n5\n", expectedOutput: "1\n", isSample: true },
      {
        input: "15\n1\n2\n3\n4\n5\n6\n7\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\n",
        expectedOutput: "4\n",
        isSample: true,
      },
      {
        input: "9\n1\n2\n3\n4\n5\nnull\nnull\nnull\nnull\n",
        expectedOutput: "3\n",
        isSample: false,
      },
      {
        input: lineInput(rightChainTokens(rangeValues(1000))),
        expectedOutput: "1\n",
        isSample: false,
      },
      {
        input: lineInput(completeTokens(rangeValues(50000))),
        expectedOutput: "25000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    tokens = data[1:1 + n]\n    root = Node(int(tokens[0]))\n    queue = deque([root])\n    i = 1\n    while queue and i < n:\n        node = queue.popleft()\n        if i < n:\n            if tokens[i] != 'null':\n                node.left = Node(int(tokens[i]))\n                queue.append(node.left)\n            i += 1\n        if i < n:\n            if tokens[i] != 'null':\n                node.right = Node(int(tokens[i]))\n                queue.append(node.right)\n            i += 1\n\n    leaves = 0\n    stack = [root]\n    while stack:\n        node = stack.pop()\n        if node.left is None and node.right is None:\n            leaves += 1\n        else:\n            if node.left:\n                stack.append(node.left)\n            if node.right:\n                stack.append(node.right)\n    print(leaves)\n\nmain()\n",
  },
  {
    slug: "learn-m4-binary-trees-bst-x2",
    title: "Check Symmetric Tree",
    statement:
      "নুসরাত ক্যাম্পাস ফেস্টের সাজসজ্জার ডিজাইন দুই পাশে একরকম চান — বাম পাশ যদি ডান পাশের প্রতিবিম্ব হয়, তাহলে মঞ্চটা পারফেক্ট। একই কথা গাছের ক্ষেত্রেও প্রযোজ্য: রুটের বাম সাবট্রি যদি ডান সাবট্রির ঠিক প্রতিবিম্ব হয় — একই মান, উল্টো অবস্থানে, একই কাঠামো — তাহলে গাছটি symmetric।\n\nউদাহরণ: রুট `1`, বামে `2` (সন্তান `3`, `4`), ডানে `2` (সন্তান `4`, `3`) — symmetric → `YES`। ডানের `2`-এর সন্তান যদি `3`, `4` হয়, তাহলে প্রতিবিম্ব নয় → `NO`।",
    inputFormat:
      "প্রথম লাইনে টোকেন সংখ্যা `n`।\nপরবর্তী `n` লাইনে একটি করে টোকেন: পূর্ণসংখ্যা অথবা `null`।\n\nটোকেন ক্রম ও সন্তান নেওয়ার নিয়ম `learn-m4-binary-trees-bst-g1`-এর মতোই। এখানে মানগুলো স্বতন্ত্র নয় — প্রতিবিম্বের দুই পাশে একই মান থাকতে পারে।",
    outputFormat: "গাছটি symmetric হলে `YES`, নয়তে `NO` এক লাইনে প্রিন্ট করুন।",
    constraints: "`1 <= n <= 100001`\nপ্রতিটি নোডের মান `1 <= v <= 10^5`।",
    editorial:
      "### ধারণা\n\nSymmetric হওয়ার শর্ত: রুটের বাম সন্তানের মান ডান সন্তানের মানের সমান, এবং **বাম সন্তানের বাম সাবট্রি ডান সন্তানের ডান সাবট্রির প্রতিবিম্ব**, আর বাম সন্তানের ডান সাবট্রি ডান সন্তানের বাম সাবট্রির প্রতিবিম্ব। অর্থাৎ প্রতি ধাপে দুটো নোড জোড়ায় মিলিয়ে চলতে হয়, কিন্তু সন্তানগুলো **উল্টো পাশে** জোড়া হয়: বাম-বাম ডান-ডানের সাথে নয়, বাম-ডান আর ডান-বামের সাথে।\n\n### ধাপে ধাপে\n\n1. টোকেন থেকে গাছটা বানান।\n2. একটা stack/queue নিয়ে জোড়া `(বাম নোড, ডান নোড)` দিয়ে শুরু করুন — রুটের বাম ও ডান সন্তান।\n3. জোড়া তুলে তিনটা অবস্থা দেখুন: দুটোই `None` → চলছে; একটা `None` বা মান মিলছে না → `NO`; নয়তে `(বামের বাম, ডানের ডান)` আর `(বামের ডান, ডানের বাম)` জোড়া যোগ করুন।\n4. তালিকা খালি হলে সব মিলেছে — `YES` প্রিন্ট করুন।\n\n```python\nimport sys\nfrom collections import deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    tokens = data[1:1 + n]\n    root = Node(int(tokens[0]))\n    queue = deque([root])\n    i = 1\n    while queue and i < n:\n        node = queue.popleft()\n        if i < n:\n            if tokens[i] != 'null':\n                node.left = Node(int(tokens[i]))\n                queue.append(node.left)\n            i += 1\n        if i < n:\n            if tokens[i] != 'null':\n                node.right = Node(int(tokens[i]))\n                queue.append(node.right)\n            i += 1\n\n    pairs = [(root.left, root.right)]\n    while pairs:\n        left, right = pairs.pop()\n        if left is None and right is None:\n            continue\n        if left is None or right is None or left.value != right.value:\n            print('NO')\n            return\n        pairs.append((left.left, right.right))\n        pairs.append((left.right, right.left))\n    print('YES')\n\nmain()\n```\n\n### কমপ্লেক্সিটি\n\nসময় `O(n)` — প্রতিটি নোড সবসময় একটা করে জোড়ায় আসে। স্পেস `O(n)` (stack/queue)। recursion দিয়েও হয়, তবে সোজা গাছে depth `n` হলে `RecursionError` আসার আশঙ্কা — তাই লুপ নিরাপদ।\n\n### সাধারণ ভুল\n\n- সন্তান উল্টো জোড়া না করা: বামের বামকে ডানের বামের সাথে মিলালে ভুল উত্তর আসে। ঠিক হলো বামের **বাম ↔ ডানের ডান** এবং বামের **ডান ↔ ডানের বাম**।\n- শুধু মান মিলিয়ে কাঠামো না দেখা: মান মিললেও গভীরে সন্তান না থাকলে symmetric নয়।\n- একা রুটকে `NO` ধরা: দুই পাশই খালি, তাই একা রুট symmetric — উত্তর `YES`।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Binary Trees", "DFS", "Symmetry"],
    tests: [
      {
        input: "15\n1\n2\n2\n3\n4\n4\n3\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\n",
        expectedOutput: "YES\n",
        isSample: true,
      },
      {
        input: "15\n1\n2\n5\n3\n4\n4\n3\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\n",
        expectedOutput: "NO\n",
        isSample: true,
      },
      { input: "1\n7\n", expectedOutput: "YES\n", isSample: false },
      {
        input: "8\n1\nnull\n2\nnull\n3\nnull\nnull\nnull\n",
        expectedOutput: "NO\n",
        isSample: false,
      },
      {
        input:
          "31\n1\n2\n2\n3\n4\n4\n3\n5\n6\n7\n8\n8\n7\n6\n5\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\n",
        expectedOutput: "YES\n",
        isSample: false,
      },
      {
        input: lineInput(mirrorChainTokens(24999)),
        expectedOutput: "YES\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    tokens = data[1:1 + n]\n    root = Node(int(tokens[0]))\n    queue = deque([root])\n    i = 1\n    while queue and i < n:\n        node = queue.popleft()\n        if i < n:\n            if tokens[i] != 'null':\n                node.left = Node(int(tokens[i]))\n                queue.append(node.left)\n            i += 1\n        if i < n:\n            if tokens[i] != 'null':\n                node.right = Node(int(tokens[i]))\n                queue.append(node.right)\n            i += 1\n\n    pairs = [(root.left, root.right)]\n    while pairs:\n        left, right = pairs.pop()\n        if left is None and right is None:\n            continue\n        if left is None or right is None or left.value != right.value:\n            print('NO')\n            return\n        pairs.append((left.left, right.right))\n        pairs.append((left.right, right.left))\n    print('YES')\n\nmain()\n",
  },
];
