import { lineInput, newlineOutput, spaceOutput } from "../generated-tests";
import type { SeedProblem } from "../../seed-problems";
import { descendingValues, leftChainTokens, rangeValues, rightChainTokens } from "./binary-trees-bst-problems";

const FULL_7 = "15\n1\n2\n3\n4\n5\n6\n7\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\n";
const FULL_15 =
  "31\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12\n13\n14\n15\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\n";
const LEFT_3 = "7\n1\n2\nnull\n3\nnull\nnull\nnull\n";
const SPLIT_3 = "5\n10\n5\nnull\nnull\n7\n";

export const TREE_TRAVERSALS_PROBLEMS: SeedProblem[] = [
  {
    slug: "learn-m4-tree-traversals-g1",
    title: "Preorder Traversal",
    statement:
      "লাইব্রেরির বিষয়ভিত্তিক গাছের কাঠামো নুসরাত এক লাইনে কপি করতে চায়: আগে নিজের নাম, তারপর বাম শাখা পুরোটা, শেষে ডান শাখা পুরোটা — এভাবে ক্রম ধরে সব নোডের মান লিখতে হবে। এই ক্রমটাই হলো preorder ট্রাভার্সাল।\n\nউদাহরণ: রুট `1`, বামে `2` (সন্তান `4`, `5`), ডানে `3` (সন্তান `6`, `7`) হলে preorder হয় `1 2 4 5 3 6 7`।",
    inputFormat:
      "প্রথম লাইনে টোকেন সংখ্যা `n`।\nপরবর্তী `n` লাইনে একটি করে টোকেন: পূর্ণসংখ্যা অথবা `null`।\n\nটোকেন ক্রম ও সন্তান নেওয়ার নিয়ম `learn-m4-binary-trees-bst-g1`-এর মতোই: level order, প্রতিটি non-null নোডের জন্য আগে বাম পরে ডান।",
    outputFormat:
      "preorder ক্রমে পাওয়া মানগুলো এক লাইনে স্পেস দিয়ে প্রিন্ট করো (রুট, বাম, ডান)।",
    constraints: "`1 <= n <= 20001`\nপ্রতিটি নোডের মান `1 <= v <= 10^5`।",
    editorial:
      "## ধারণা\n\nPreorder মানে নিজে আগে, তারপর বাম সাবট্রি, শেষে ডান সাবট্রি। রুট সবার আগে আসায় এই ক্রম দিয়ে গাছের কাঠামো একটা লাইনে লেখা যায়, আর গাছ কপি করতে গেলে এটাই ব্যবহার হয়। প্রতিটি নোড ঠিক একবার আসে, তাই সময় অবশ্যই `O(n)`।\n\n## ধাপে ধাপে\n\n1. টোকেন থেকে গাছটা বানাও (queue দিয়ে level order)।\n2. একটা stack নিয়ে রুট বসাও।\n3. Stack থেকে একটা নোড তুলে মান লিখো, তারপর **ডান সন্তান আগে**, পরে **বাম সন্তান** stack-এ ঢোকাও — LIFO হওয়ায় বামটাই আগে বের হবে।\n4. Stack খালি না হওয়া পর্যন্ত চালাও, তারপর লিস্টটি এক লাইনে ছাড়ো।\n\n```python\nimport sys\nfrom collections import deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef build(tokens):\n    root = Node(int(tokens[0]))\n    queue = deque([root])\n    i = 1\n    while queue and i < len(tokens):\n        node = queue.popleft()\n        if i < len(tokens):\n            if tokens[i] != 'null':\n                node.left = Node(int(tokens[i]))\n                queue.append(node.left)\n            i += 1\n        if i < len(tokens):\n            if tokens[i] != 'null':\n                node.right = Node(int(tokens[i]))\n                queue.append(node.right)\n            i += 1\n    return root\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    root = build(data[1:1 + n])\n    order = []\n    stack = [root]\n    while stack:\n        node = stack.pop()\n        order.append(node.value)\n        if node.right:\n            stack.append(node.right)\n        if node.left:\n            stack.append(node.left)\n    print(' '.join(map(str, order)))\n\nmain()\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n)` — প্রতিটি নোড একবার ঢোকে। স্পেস `O(n)`: গাছ তৈরি থাকে, আর stack-এ সবচেয়ে বেশিতে `O(height)` নোড থাকে। recursion দিয়েও হয়, তবে সোজা গাছে depth `n` হলে `RecursionError` আসে — তাই লুপ নিরাপদ।\n\n## সাধারণ ভুল\n\n- ডান সন্তান আগে না ঢোকানো: stack LIFO, তাই বাম আগে বের করতে চাইলে ডানটা আগে ঢোকাতে হয়।\n- রুট আগে না লেখা: প্রথম ধাপেই নোডের মান যোগ করতে হবে, তারপর সন্তান।\n- `null` টোকেনকে নোড ধরা: `null` কোনো মান নয়, সেটি স্কিপ করতে হবে।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Binary Trees", "DFS", "Preorder"],
    tests: [
      { input: FULL_7, expectedOutput: "1 2 4 5 3 6 7\n", isSample: true },
      { input: "1\n5\n", expectedOutput: "5\n", isSample: true },
      { input: LEFT_3, expectedOutput: "1 2 3\n", isSample: false },
      { input: SPLIT_3, expectedOutput: "10 5 7\n", isSample: false },
      { input: FULL_15, expectedOutput: "1 2 4 8 9 5 10 11 3 6 12 13 7 14 15\n", isSample: false },
      {
        input: lineInput(rightChainTokens(rangeValues(10000))),
        expectedOutput: spaceOutput(rangeValues(10000)),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    tokens = data[1:1 + n]\n    root = Node(int(tokens[0]))\n    queue = deque([root])\n    i = 1\n    while queue and i < n:\n        node = queue.popleft()\n        if i < n:\n            if tokens[i] != 'null':\n                node.left = Node(int(tokens[i]))\n                queue.append(node.left)\n            i += 1\n        if i < n:\n            if tokens[i] != 'null':\n                node.right = Node(int(tokens[i]))\n                queue.append(node.right)\n            i += 1\n\n    order = []\n    stack = [root]\n    while stack:\n        node = stack.pop()\n        order.append(node.value)\n        if node.right:\n            stack.append(node.right)\n        if node.left:\n            stack.append(node.left)\n    print(' '.join(map(str, order)))\n\nmain()\n",
  },
  {
    slug: "learn-m4-tree-traversals-g2",
    title: "Inorder Traversal",
    statement:
      "তানভির চায় গাছের মানগুলো ঠিক সেই ক্রমে দেখতে যে ক্রমে বাম শাখা শেষ হয়ে নিজে, তারপর ডান শাখা শুরু হয় — অর্থাৎ বাম, নিজে, ডান। এই ক্রমটাই inorder ট্রাভার্সাল, আর BST-এ এটি সবসময় ছোট থেকে বড় মান দেয়।\n\nউদাহরণ: রুট `1`, বামে `2` (সন্তান `4`, `5`), ডানে `3` (সন্তান `6`, `7`) হলে inorder হয় `4 2 5 1 6 3 7`।",
    inputFormat:
      "প্রথম লাইনে টোকেন সংখ্যা `n`।\nপরবর্তী `n` লাইনে একটি করে টোকেন: পূর্ণসংখ্যা অথবা `null`।\n\nটোকেন ক্রম ও সন্তান নেওয়ার নিয়ম `learn-m4-binary-trees-bst-g1`-এর মতোই।",
    outputFormat:
      "inorder ক্রমে পাওয়া মানগুলো এক লাইনে স্পেস দিয়ে প্রিন্ট করো (বাম, নিজে, ডান)।",
    constraints: "`1 <= n <= 20001`\nপ্রতিটি নোডের মান `1 <= v <= 10^5`।",
    editorial:
      "## ধারণা\n\nInorder মানে আগে পুরো বাম সাবট্রি, তারপর নিজের মান, শেষে পুরো ডান সাবট্রি। BST-এ বাম সবসময় ছোট আর ডান বড় হওয়ায় এই ক্রম মানেই মানগুলো ক্রমানুসারে সাজে — এটাই inorder-এর সবচেয়ে বড় বৈশিষ্ট্য। সোজা গাছে এটি উল্টো ক্রমে আসে, আর একা নোডে শুধু সেটিই থাকে।\n\n## ধাপে ধাপে\n\n1. টোকেন থেকে গাছটা বানাও।\n2. `current = root` দিয়ে শুরু করো এবং একটা stack রাখো।\n3. `current` না থাকা পর্যন্ত বাম দিকে নামে নামে stack-এ বসাও (যেগুলো এখনো শেষ হয়নি)।\n4. Stack থেকে একটা নোড তুলে তার মান লিখো, তারপর `current = ওই নোডের ডান সন্তান` করে আবার ৩ নম্বর ধাপে ফিরে যাও।\n5. Stack খালি ও `current` না হলে শেষ; লিস্টটি এক লাইনে ছাড়ো।\n\n```python\nimport sys\nfrom collections import deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    tokens = data[1:1 + n]\n    root = Node(int(tokens[0]))\n    queue = deque([root])\n    i = 1\n    while queue and i < n:\n        node = queue.popleft()\n        if i < n:\n            if tokens[i] != 'null':\n                node.left = Node(int(tokens[i]))\n                queue.append(node.left)\n            i += 1\n        if i < n:\n            if tokens[i] != 'null':\n                node.right = Node(int(tokens[i]))\n                queue.append(node.right)\n            i += 1\n\n    order = []\n    stack = []\n    current = root\n    while current or stack:\n        while current:\n            stack.append(current)\n            current = current.left\n        current = stack.pop()\n        order.append(current.value)\n        current = current.right\n    print(' '.join(map(str, order)))\n\nmain()\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(height)` stack-এ (গাছ তৈরি থাকা মিলিয়ে `O(n)`)।\n\n## সাধারণ ভুল\n\n- ক্রম উল্টানো: ডান আগে হলে প্রিনোর্ড হয়, ইনঅর্ডার নয়।\n- বাম সন্তান শেষ না করেই মান লেখা: আগে বাম পুরো শেষ হতে হবে।\n- `null` নোড stack-এ তোলা: খালি ঘরে কোনো মান নেই।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Binary Trees", "DFS", "Inorder"],
    tests: [
      { input: FULL_7, expectedOutput: "4 2 5 1 6 3 7\n", isSample: true },
      { input: "1\n5\n", expectedOutput: "5\n", isSample: true },
      { input: LEFT_3, expectedOutput: "3 2 1\n", isSample: false },
      { input: SPLIT_3, expectedOutput: "5 7 10\n", isSample: false },
      { input: FULL_15, expectedOutput: "8 4 9 2 10 5 11 1 12 6 13 3 14 7 15\n", isSample: false },
      {
        input: lineInput(leftChainTokens(rangeValues(10000))),
        expectedOutput: spaceOutput(descendingValues(10000)),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    tokens = data[1:1 + n]\n    root = Node(int(tokens[0]))\n    queue = deque([root])\n    i = 1\n    while queue and i < n:\n        node = queue.popleft()\n        if i < n:\n            if tokens[i] != 'null':\n                node.left = Node(int(tokens[i]))\n                queue.append(node.left)\n            i += 1\n        if i < n:\n            if tokens[i] != 'null':\n                node.right = Node(int(tokens[i]))\n                queue.append(node.right)\n            i += 1\n\n    order = []\n    stack = []\n    current = root\n    while current or stack:\n        while current:\n            stack.append(current)\n            current = current.left\n        current = stack.pop()\n        order.append(current.value)\n        current = current.right\n    print(' '.join(map(str, order)))\n\nmain()\n",
  },
  {
    slug: "learn-m4-tree-traversals-e1",
    title: "Postorder Traversal",
    statement:
      "সাদিয়া গাছের ফোল্ডার মুছে ফেলার ক্রম জানতে চায়: সন্তানগুলো আগে শেষ হতে হবে, বাপ সবার শেষে — বাম, ডান, তারপর নিজে। এই ক্রমটাই postorder ট্রাভার্সাল, আর এটিই সাবট্রির যোগফল বা মোছার কাজে ব্যবহৃত হয়।\n\nউদাহরণ: রুট `1`, বামে `2` (সন্তান `4`, `5`), ডানে `3` (সন্তান `6`, `7`) হলে postorder হয় `4 5 2 6 7 3 1`।",
    inputFormat:
      "প্রথম লাইনে টোকেন সংখ্যা `n`।\nপরবর্তী `n` লাইনে একটি করে টোকেন: পূর্ণসংখ্যা অথবা `null`।\n\nটোকেন ক্রম ও সন্তান নেওয়ার নিয়ম `learn-m4-binary-trees-bst-g1`-এর মতোই।",
    outputFormat:
      "postorder ক্রমে পাওয়া মানগুলো এক লাইনে স্পেস দিয়ে প্রিন্ট করো (বাম, ডান, নিজে)।",
    constraints: "`1 <= n <= 20001`\nপ্রতিটি নোডের মান `1 <= v <= 10^5`।",
    editorial:
      "## ধারণা\n\nPostorder মানে আগে বাম সাবট্রি, তারপর ডান সাবট্রি, শেষে নিজের মান। রুট সবার শেষে আসায় নিশ্চিত হওয়া যায় বাপের কাজ করার আগে সন্তানদের কাজ শেষ হয়েছে। উল্টো ক্রম (ডান, বাম, নিজে)-ও একটা বৈধ traversal, কিন্তু প্রশ্ন বলেছে বাম-ডান-নিজে — ঠিক সেটাই ছাপো।\n\n## ধাপে ধাপে\n\n1. টোকেন থেকে গাছটা বানাও।\n2. Stack-এ `(নোড, কি শেষ হয়েছে)` জোড়া হিসেবে রুট বসাও `visited = False` সহ।\n3. জোড়া তুলে: `visited = True` হলে মান লিখো; নয়তে আগে নিজেকে `visited = True` সহ ফিরিয়ে বসাও, তারপর **ডান** তারপর **বাম** সন্তান আলাদা জোড়া হিসেবে ঢোকাও।\n4. Stack খালি হলে লিস্টটি এক লাইনে ছাড়ো।\n\n```python\nimport sys\nfrom collections import deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    tokens = data[1:1 + n]\n    root = Node(int(tokens[0]))\n    queue = deque([root])\n    i = 1\n    while queue and i < n:\n        node = queue.popleft()\n        if i < n:\n            if tokens[i] != 'null':\n                node.left = Node(int(tokens[i]))\n                queue.append(node.left)\n            i += 1\n        if i < n:\n            if tokens[i] != 'null':\n                node.right = Node(int(tokens[i]))\n                queue.append(node.right)\n            i += 1\n\n    order = []\n    stack = [(root, False)]\n    while stack:\n        node, visited = stack.pop()\n        if visited:\n            order.append(node.value)\n            continue\n        stack.append((node, True))\n        if node.right:\n            stack.append((node.right, False))\n        if node.left:\n            stack.append((node.left, False))\n    print(' '.join(map(str, order)))\n\nmain()\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n)`, স্পেস `O(height)` stack-এ (গাছ তৈরি থাকা মিলিয়ে `O(n)`)।\n\n## সাধারণ ভুল\n\n- রুট আগে লেখা: postorder-এ রুট সবার শেষে আসে।\n- ডান সন্তান আগে ঢোকানো: বাম আগে শেষ হতে হবে, তাই stack-এ ডান আগে ঢোকালে বামই আগে বের হয়।\n- ঘুরে ঘুরে অসীম লুপ: `visited` ফ্ল্যাগ ছাড়া একই নোড দুইবার ঢোকলে লুপ থামে না।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Binary Trees", "DFS", "Postorder"],
    tests: [
      { input: FULL_7, expectedOutput: "4 5 2 6 7 3 1\n", isSample: true },
      { input: "1\n5\n", expectedOutput: "5\n", isSample: true },
      { input: LEFT_3, expectedOutput: "3 2 1\n", isSample: false },
      { input: SPLIT_3, expectedOutput: "7 5 10\n", isSample: false },
      { input: FULL_15, expectedOutput: "8 9 4 10 11 5 2 12 13 6 14 15 7 3 1\n", isSample: false },
      {
        input: lineInput(rightChainTokens(rangeValues(10000))),
        expectedOutput: spaceOutput(descendingValues(10000)),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    tokens = data[1:1 + n]\n    root = Node(int(tokens[0]))\n    queue = deque([root])\n    i = 1\n    while queue and i < n:\n        node = queue.popleft()\n        if i < n:\n            if tokens[i] != 'null':\n                node.left = Node(int(tokens[i]))\n                queue.append(node.left)\n            i += 1\n        if i < n:\n            if tokens[i] != 'null':\n                node.right = Node(int(tokens[i]))\n                queue.append(node.right)\n            i += 1\n\n    order = []\n    stack = [(root, False)]\n    while stack:\n        node, visited = stack.pop()\n        if visited:\n            order.append(node.value)\n            continue\n        stack.append((node, True))\n        if node.right:\n            stack.append((node.right, False))\n        if node.left:\n            stack.append((node.left, False))\n    print(' '.join(map(str, order)))\n\nmain()\n",
  },
  {
    slug: "learn-m4-tree-traversals-m1",
    title: "Rebuild Tree from Inorder and Preorder",
    statement:
      "রফি একটা গাছ নিয়ে দুটো তালিকা পেয়েছে — ইনঅর্ডার আর প্রিনোর্ড — কিন্তু নিজে গাছটা আর দেখতে পাচ্ছে না। দুই তালিকাই দেওয়া থাকবে (সব মান স্বতন্ত্র); গাছটা নতুন করে তৈরি করে তার postorder প্রিন্ট করো, যাতে জানা যায় গাছটা ঠিক কেমন ছিল।\n\nউদাহরণ: ইনঅর্ডার `4 2 5 1 6 3 7` আর প্রিনোর্ড `1 2 4 5 3 6 7` হলে postorder হয় `4 5 2 6 7 3 1`।",
    inputFormat:
      "প্রথম লাইনে নোড সংখ্যা `n`।\nদ্বিতীয় লাইনে `n` টি পূর্ণসংখ্যা — ইনঅর্ডার ক্রম।\nতৃতীয় লাইনে `n` টি পূর্ণসংখ্যা — প্রিনোর্ড ক্রম।\n\nদুই তালিকাতে একই সেটের স্বতন্ত্র মান থাকবে।",
    outputFormat: "গাছটির postorder ক্রমে মানগুলো এক লাইনে স্পেস দিয়ে প্রিন্ট করো।",
    constraints:
      "`1 <= n <= 10000`\nপ্রতিটি মান `1 <= v <= 10^9`, সব মান স্বতন্ত্র।",
    editorial:
      "## ধারণা\n\nপ্রিনোর্ডের প্রথম মানটাই রুট। রুট ইনঅর্ডারে খুঁজে পেলে তার বাঁদিকের সব মান বাম সাবট্রি, ডানদিকের সব মান ডান সাবট্রি — আর প্রিনোর্ডে রুটের পরের অংশও ঠিক এভাবেই ভাগ হয়। এই ভাগ ধরে ধরে ছোট সাবট্রিতে নামলেই গাছ তৈরি হয়। ইনঅর্ডারে খুঁজতে গিয়ে প্রতিবার পুরো লিস্ট ঘুরলে খরচ `O(n^2)` — তাই হয় প্রতিটি মানের ইনডেক্স আগেই ডিকশনারিতে রেখে recursion চালাও, নয়তো নিচের মতো এক পাসের stack কৌশল নাও — দুটোতেই সময় `O(n)`।\n\n## ধাপে ধাপে\n\n1. প্রিনোর্ডের প্রথম মান দিয়ে রুট বানিয়ে stack-এ রাখো; `i` প্রিনোর্ডের পরের মান আর `j` ইনঅর্ডারের শুরু নির্দেশ করে।\n2. প্রতিটি নতুন মানের আগে দেখো: stack-এর শীর্ষ কি ইনঅর্ডারের `j`-তম মান? যতক্ষণ মেলে, ততটা pop করে শেষ pop-টাকে `parent` ধরে রাখো — মানে ওই নোডের বাম সাবট্রি শেষ, এবার তার ডান সন্তান বসবে।\n3. `parent` পেলে নতুন নোডটি `parent`-এর ডান সন্তান, না পেলে stack-এর শীর্ষের বাম সন্তান।\n4. নতুন নোড stack-এ ঢুকিয়ে `i` এক বাড়াও; পুরো প্রিনোর্ড শেষ হলে গাছ তৈরি — postorder ঘুরে মানগুলো এক লাইনে ছাড়ো।\n\n```python\nimport sys\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    inorder = list(map(int, data[1:1 + n]))\n    preorder = list(map(int, data[1 + n:1 + 2 * n]))\n    root = Node(preorder[0])\n    stack = [root]\n    i, j = 1, 0\n    while i < n:\n        parent = None\n        while stack and stack[-1].value == inorder[j]:\n            parent = stack.pop()\n            j += 1\n        node = Node(preorder[i])\n        if parent is not None:\n            parent.right = node\n        else:\n            stack[-1].left = node\n        stack.append(node)\n        i += 1\n\n    order = []\n    work = [(root, False)]\n    while work:\n        node, visited = work.pop()\n        if visited:\n            order.append(node.value)\n            continue\n        work.append((node, True))\n        if node.right:\n            work.append((node.right, False))\n        if node.left:\n            work.append((node.left, False))\n    print(' '.join(map(str, order)))\n\nmain()\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n)` — প্রতিটি মান ঠিক একবার stack-এ ঢোকে ও বের হয়, আর ইনঅর্ডারের ইনডেক্স `j` কখনো পিছায় না। লিনিয়ার সার্চ করলে হতো `O(n^2)`। স্পেস `O(n)` (stack + গাছ)।\n\n## সাধারণ ভুল\n\n- প্রতিবার ইনঅর্ডারে লিনিয়ার সার্চ: ছোট ইনপুটে চলে, কিন্তু `n = 10000`-এ `O(n^2)` হয়ে যায়।\n- প্রিনোর্ডের দ্বিতীয় মানকে সবসময় বাম সন্তান ধরা: রুটের বাম সাবট্রি খালি হলে সেটি ডান সন্তান হয়।\n- সোজা গাছে recursion depth `n`: লিমিট বাড়ানো না থাকলে `RecursionError` আসে।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Binary Trees", "Reconstruction", "Traversal"],
    tests: [
      {
        input: "7\n4 2 5 1 6 3 7\n1 2 4 5 3 6 7\n",
        expectedOutput: "4 5 2 6 7 3 1\n",
        isSample: true,
      },
      { input: "1\n9\n9\n", expectedOutput: "9\n", isSample: true },
      { input: "3\n1 2 3\n1 2 3\n", expectedOutput: "3 2 1\n", isSample: false },
      { input: "3\n3 2 1\n1 2 3\n", expectedOutput: "3 2 1\n", isSample: false },
      {
        input:
          "15\n8 4 9 2 10 5 11 1 12 6 13 3 14 7 15\n1 2 4 8 9 5 10 11 3 6 12 13 7 14 15\n",
        expectedOutput: "8 9 4 10 11 5 2 12 13 6 14 15 7 3 1\n",
        isSample: false,
      },
      {
        input: `10000\n${rangeValues(10000).join(" ")}\n${rangeValues(10000).join(" ")}\n`,
        expectedOutput: spaceOutput(descendingValues(10000)),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    inorder = list(map(int, data[1:1 + n]))\n    preorder = list(map(int, data[1 + n:1 + 2 * n]))\n    root = Node(preorder[0])\n    stack = [root]\n    i, j = 1, 0\n    while i < n:\n        parent = None\n        while stack and stack[-1].value == inorder[j]:\n            parent = stack.pop()\n            j += 1\n        node = Node(preorder[i])\n        if parent is not None:\n            parent.right = node\n        else:\n            stack[-1].left = node\n        stack.append(node)\n        i += 1\n\n    order = []\n    work = [(root, False)]\n    while work:\n        node, visited = work.pop()\n        if visited:\n            order.append(node.value)\n            continue\n        work.append((node, True))\n        if node.right:\n            work.append((node.right, False))\n        if node.left:\n            work.append((node.left, False))\n    print(' '.join(map(str, order)))\n\nmain()\n",
  },
  {
    slug: "learn-m4-tree-traversals-h1",
    title: "Vertical Order Traversal",
    statement:
      "ফেস্টের স্টল সাজানো হচ্ছে গাছের মতো কাঠামোতে, আর সাদিয়া চায় একটা কলাম অনুযায়ী তালিকা: যেকোনো নোড যে কলামে (বাম-ডান অবস্থানে) পড়ে সেটাই একসাথে থাকবে। কলামগুলো বাম থেকে ডানে আলাদা লাইনে আসবে, এক কলামের ভেতরে উপরের স্তর আগে, আর একই স্তরে দুটো নোড পড়লে ছোট মান আগে।\n\nউদাহরণ: রুট `1`, বামে `2` (বামে `4`), ডানে `3` (ডানে `5`) — কলাম অনুযায়ী উত্তর পাঁচ লাইনে `4`, `2`, `1`, `3`, `5`।",
    inputFormat:
      "প্রথম লাইনে টোকেন সংখ্যা `n`।\nপরবর্তী `n` লাইনে একটি করে টোকেন: পূর্ণসংখ্যা অথবা `null`।\n\nটোকেন ক্রম ও সন্তান নেওয়ার নিয়ম `learn-m4-binary-trees-bst-g1`-এর মতোই। রুটের কলাম `0`, বাম সন্তান কলাম `parent - 1`, ডান সন্তান কলাম `parent + 1`, আর স্তর হলো রুট থেকে দূরত্ব।",
    outputFormat:
      "প্রতিটি কলাম আলাদা লাইনে, বাম কলাম থেকে শুরু করে। লাইনে মানগুলো স্তর অনুযায়ী, সমান স্তরে ছোট মান আগে, স্পেস দিয়ে আলাদা।",
    constraints:
      "`1 <= n <= 20001`\nপ্রতিটি নোডের মান স্বতন্ত্র এবং `1 <= v <= 10^5`।",
    editorial:
      "## ধারণা\n\nপ্রতিটি নোডের সাথে দুটো তথ্য ধরে চলতে হবে: কত কলামে আছে (x) আর কত স্তরে আছে (y)। রুট `(0, 0)`; বাম সন্তান `(x - 1, y + 1)`, ডান সন্তান `(x + 1, y + 1)`। BFS দিয়ে ঘুরে প্রতিটি নোড তার কলামের তালিকায় বসালেই হয়। শেষে কলামগুলো ক্রম করে লাইন বানাতে হবে, আর এক কলামে একই স্তরে দুটো নোড থাকলে (বামের ডান সন্তান আর ডানের বাম সন্তান একই কলামে পড়ে) মান অনুযায়ী ক্রম করতে হবে।\n\n## ধাপে ধাপে\n\n1. গাছ বানিয়ে রুটকে `(0, 0)` সহ queue-তে বসাও।\n2. প্রতিটি নোড তুলে তার `(কলাম, স্তর)` নিয়ে ওই কলামের তালিকায় `(স্তর, মান)` জোড়া হিসেবে রাখো, তারপর সন্তানদের নতুন কলাম-স্তর দিয়ে queue-তে যোগ করো।\n3. সব কলামের কী ক্রম করে তুলো (ছোট থেকে বড়)।\n4. প্রতিটি কলামের তালিকা আগে স্তর, পরে মান অনুযায়ী সাজিয়ে এক লাইন করে ছাড়ো।\n\n```python\nimport sys\nfrom collections import defaultdict, deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    tokens = data[1:1 + n]\n    root = Node(int(tokens[0]))\n    queue = deque([root])\n    i = 1\n    while queue and i < n:\n        node = queue.popleft()\n        if i < n:\n            if tokens[i] != 'null':\n                node.left = Node(int(tokens[i]))\n                queue.append(node.left)\n            i += 1\n        if i < n:\n            if tokens[i] != 'null':\n                node.right = Node(int(tokens[i]))\n                queue.append(node.right)\n            i += 1\n\n    columns = defaultdict(list)\n    work = deque([(root, 0, 0)])\n    while work:\n        node, col, row = work.popleft()\n        columns[col].append((row, node.value))\n        if node.left:\n            work.append((node.left, col - 1, row + 1))\n        if node.right:\n            work.append((node.right, col + 1, row + 1))\n\n    lines = []\n    for col in sorted(columns):\n        items = sorted(columns[col])\n        lines.append(' '.join(str(value) for _, value in items))\n    sys.stdout.write('\\n'.join(lines) + '\\n')\n\nmain()\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n log n)` — প্রতিটি কলামের তালিকা সাজানো হয়; সব মিলিয়ে মোট সংখ্যা `n`, তাই মোট সাজানো `O(n log n)`। স্পেস `O(n)`।\n\n## সাধারণ ভুল\n\n- কলাম গোনায় off-by-one: বাম সন্তানের কলাম `x - 1`, ডানের `x + 1`; স্তর প্রতিটি ধাপে এক বাড়ে।\n- একই কলামে একই স্তরের দুই মানের ক্রম না করা: ইনপুটের আসা ক্রম নয়, প্রশ্ন বলেছে ছোট মান আগে।\n- শুধু মান দিয়ে সাজানো (স্তর বাদ দিয়ে): উপরের স্তর আগে আসতে হবে, নাহলে ভুল লাইন হয়।",
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Binary Trees", "BFS", "Sorting"],
    tests: [
      { input: "7\n1\n2\n3\n4\nnull\nnull\n5\n", expectedOutput: "4\n2\n1\n3\n5\n", isSample: true },
      {
        input: "11\n1\n2\n3\nnull\n4\n5\nnull\nnull\nnull\nnull\nnull\n",
        expectedOutput: "2\n1 4 5\n3\n",
        isSample: true,
      },
      { input: "1\n5\n", expectedOutput: "5\n", isSample: false },
      { input: FULL_15, expectedOutput: "8\n4\n2 9 10 12\n1 5 6\n3 11 13 14\n7\n15\n", isSample: false },
      {
        input: lineInput(rightChainTokens(rangeValues(10000))),
        expectedOutput: newlineOutput(rangeValues(10000)),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import defaultdict, deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    tokens = data[1:1 + n]\n    root = Node(int(tokens[0]))\n    queue = deque([root])\n    i = 1\n    while queue and i < n:\n        node = queue.popleft()\n        if i < n:\n            if tokens[i] != 'null':\n                node.left = Node(int(tokens[i]))\n                queue.append(node.left)\n            i += 1\n        if i < n:\n            if tokens[i] != 'null':\n                node.right = Node(int(tokens[i]))\n                queue.append(node.right)\n            i += 1\n\n    columns = defaultdict(list)\n    work = deque([(root, 0, 0)])\n    while work:\n        node, col, row = work.popleft()\n        columns[col].append((row, node.value))\n        if node.left:\n            work.append((node.left, col - 1, row + 1))\n        if node.right:\n            work.append((node.right, col + 1, row + 1))\n\n    lines = []\n    for col in sorted(columns):\n        items = sorted(columns[col])\n        lines.append(' '.join(str(value) for _, value in items))\n    sys.stdout.write('\\n'.join(lines) + '\\n')\n\nmain()\n",
  },
  {
    slug: "learn-m4-tree-traversals-x1",
    title: "Level Order Line by Line",
    statement:
      "ক্লাবের সদস্য তালিকাটা একটা গাছে সাজানো; তানভির সেটা স্তর ধরে দেখতে চায়: প্রথম লাইনে রুট, পরের লাইনে তার সন্তানরা, তারপর তাদের সন্তানরা — এভাবে প্রতিটি স্তর আলাদা লাইনে। এটাই level order ট্রাভার্সাল, যেটা BFS দিয়ে হয়।\n\nউদাহরণ: রুট `1`, বামে `2` (সন্তান `4`, `5`), ডানে `3` (সন্তান `6`, `7`) হলে তিন লাইন: `1`, `2 3`, `4 5 6 7`।",
    inputFormat:
      "প্রথম লাইনে টোকেন সংখ্যা `n`।\nপরবর্তী `n` লাইনে একটি করে টোকেন: পূর্ণসংখ্যা অথবা `null`।\n\nটোকেন ক্রম ও সন্তান নেওয়ার নিয়ম `learn-m4-binary-trees-bst-g1`-এর মতোই।",
    outputFormat:
      "প্রতিটি স্তর আলাদা লাইনে, স্তরের ভেতরে বাম থেকে ডানে, মানগুলো স্পেস দিয়ে আলাদা।",
    constraints: "`1 <= n <= 20001`\nপ্রতিটি নোডের মান `1 <= v <= 10^5`।",
    editorial:
      "## ধারণা\n\nBFS-এ একটা queue থাকে; প্রতিটি ধাপে queue-তে যতগুলো নোড আছে সেগুলোই একটা স্তর। সেই সংখ্যাটা ধরে রেখে ঠিক ওই সংখ্যাটুকু নোড তুলে মান লিখলে প্রতিটি স্তর আলাদা লাইন হয়ে যায়। প্রতিটি নোড একবারই ঢোকে, তাই সময় `O(n)`।\n\n## ধাপে ধাপে\n\n1. গাছ বানিয়ে রুট queue-তে বসাও।\n2. Queue খালি না হওয়া পর্যন্ত: `size = len(queue)` নাও (এই স্তরের নোড সংখ্যা)।\n3. `size` বার নোড তুলে মান একটা লিস্টে নাও এবং তাদের non-null সন্তানগুলো queue-তে যোগ করো।\n4. সেই লিস্টটি এক লাইন করে ছাড়ো — এক স্তর এক লাইন।\n\n```python\nimport sys\nfrom collections import deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    tokens = data[1:1 + n]\n    root = Node(int(tokens[0]))\n    queue = deque([root])\n    i = 1\n    while queue and i < n:\n        node = queue.popleft()\n        if i < n:\n            if tokens[i] != 'null':\n                node.left = Node(int(tokens[i]))\n                queue.append(node.left)\n            i += 1\n        if i < n:\n            if tokens[i] != 'null':\n                node.right = Node(int(tokens[i]))\n                queue.append(node.right)\n            i += 1\n\n    lines = []\n    level = [root]\n    while level:\n        lines.append(' '.join(str(node.value) for node in level))\n        nxt = []\n        for node in level:\n            if node.left:\n                nxt.append(node.left)\n            if node.right:\n                nxt.append(node.right)\n        level = nxt\n    sys.stdout.write('\\n'.join(lines) + '\\n')\n\nmain()\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n)`; স্পেস `O(n)` — সবচেয়ে চওড়া স্তরের নোডগুলো একসাথে queue-তে থাকে, যা সর্বোচ্চ `O(n)` ছাড়ে না।\n\n## সাধারণ ভুল\n\n- `len(queue)` না নেওয়া: স্তরের সীমা ভুল হলে পুরো গাছ এক লাইনে মিলে যায় বা ভাগ ভুল হয়।\n- শুধু রুট থেকে শুরু করে সন্তান না যোগ করা: পরের স্তর তৈরিই হবে না।\n- খালি সন্তান `None`-ও queue-তে তোলা: তাহলে পরের স্তরে `None` ঘোরা হয় আর ভুল লাইন আসে।",
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Binary Trees", "BFS", "Level Order"],
    tests: [
      { input: FULL_7, expectedOutput: "1\n2 3\n4 5 6 7\n", isSample: true },
      { input: "1\n5\n", expectedOutput: "5\n", isSample: true },
      { input: LEFT_3, expectedOutput: "1\n2\n3\n", isSample: false },
      { input: SPLIT_3, expectedOutput: "10\n5\n7\n", isSample: false },
      {
        input: lineInput(rightChainTokens(rangeValues(10000))),
        expectedOutput: newlineOutput(rangeValues(10000)),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    tokens = data[1:1 + n]\n    root = Node(int(tokens[0]))\n    queue = deque([root])\n    i = 1\n    while queue and i < n:\n        node = queue.popleft()\n        if i < n:\n            if tokens[i] != 'null':\n                node.left = Node(int(tokens[i]))\n                queue.append(node.left)\n            i += 1\n        if i < n:\n            if tokens[i] != 'null':\n                node.right = Node(int(tokens[i]))\n                queue.append(node.right)\n            i += 1\n\n    lines = []\n    level = [root]\n    while level:\n        lines.append(' '.join(str(node.value) for node in level))\n        nxt = []\n        for node in level:\n            if node.left:\n                nxt.append(node.left)\n            if node.right:\n                nxt.append(node.right)\n        level = nxt\n    sys.stdout.write('\\n'.join(lines) + '\\n')\n\nmain()\n",
  },
  {
    slug: "learn-m4-tree-traversals-x2",
    title: "Zigzag Level Order",
    statement:
      "ফেস্টের ডেকোরেশন সাজানো হচ্ছে সাপের মতো কাটাকাটি পথে: প্রথম স্তর বাম থেকে ডানে, পরের স্তর ডান থেকে বামে, তারপর আবার বাম থেকে ডানে — এভাবে বিকল্প ক্রমে প্রতিটি স্তর লেখা হবে। এটাই zigzag বা spiral level order।\n\nউদাহরণ: রুট `1`, বামে `2` (সন্তান `4`, `5`), ডানে `3` (সন্তান `6`, `7`) হলে তিন লাইন: `1`, `3 2`, `4 5 6 7`।",
    inputFormat:
      "প্রথম লাইনে টোকেন সংখ্যা `n`।\nপরবর্তী `n` লাইনে একটি করে টোকেন: পূর্ণসংখ্যা অথবা `null`।\n\nটোকেন ক্রম ও সন্তান নেওয়ার নিয়ম `learn-m4-binary-trees-bst-g1`-এর মতোই। রুটের স্তরটি ০ ধরা হবে (বাম থেকে ডানে)।",
    outputFormat:
      "প্রতিটি স্তর আলাদা লাইনে; জোড় স্তর (০, ২, ৪...) বাম থেকে ডানে, বিজোড় স্তর (১, ৩, ৫...) ডান থেকে বামে, মান স্পেস দিয়ে আলাদা।",
    constraints: "`1 <= n <= 20001`\nপ্রতিটি নোডের মান `1 <= v <= 10^5`।",
    editorial:
      "## ধারণা\n\nএটাই level order, শুধু বিজোড় স্তরের মানগুলো উল্টো করতে হয়। স্তর শেষ হওয়ার পরে উল্টানো নয় — স্তরটা যখন তৈরি হয়, তখনই স্তরের নম্বর দেখে ঠিক করো ক্রম কোনটা। প্রতিটি নোড একবারই আসে, তাই সময় `O(n)`।\n\n## ধাপে ধাপে\n\n1. গাছ বানিয়ে রুট queue-তে বসাও এবং `level_number = 0` রাখো।\n2. প্রতিটি স্তরের জন্য `size = len(queue)` নিয়ে ওই সংখ্যাটুকু নোড তুলে একটা লিস্ট বানাও।\n3. `level_number` বিজোড় হলে লিস্টটা উল্টিয়ে নাও, জোড় হলে যেমন আছে তেমনই রাখো।\n4. লিস্টটি এক লাইন করে ছাড়ো, তারপর সন্তানগুলো queue-তে যোগ করে `level_number` এক বাড়াও।\n\n```python\nimport sys\nfrom collections import deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    tokens = data[1:1 + n]\n    root = Node(int(tokens[0]))\n    queue = deque([root])\n    i = 1\n    while queue and i < n:\n        node = queue.popleft()\n        if i < n:\n            if tokens[i] != 'null':\n                node.left = Node(int(tokens[i]))\n                queue.append(node.left)\n            i += 1\n        if i < n:\n            if tokens[i] != 'null':\n                node.right = Node(int(tokens[i]))\n                queue.append(node.right)\n            i += 1\n\n    lines = []\n    level = [root]\n    depth = 0\n    while level:\n        values = [node.value for node in level]\n        if depth % 2 == 1:\n            values.reverse()\n        lines.append(' '.join(map(str, values)))\n        nxt = []\n        for node in level:\n            if node.left:\n                nxt.append(node.left)\n            if node.right:\n                nxt.append(node.right)\n        level = nxt\n        depth += 1\n    sys.stdout.write('\\n'.join(lines) + '\\n')\n\nmain()\n```\n\n## কমপ্লেক্সিটি\n\nসময় `O(n)` — প্রতিটি স্তর একবার ঘোরা হয়, উল্টানোও সেই স্তরের জন্যই `O(স্তরের আকার)`। স্পেস `O(n)`।\n\n## সাধারণ ভুল\n\n- পুরো লিস্ট উল্টিয়ে দেওয়া: শুধু বিজোড় স্তর উল্টবে, জোড় স্তর যেমন আছে তেমনই থাকবে।\n- স্তরের ভেতরের ক্রম উল্টানোর সময় ভুল সূচি ব্যবহার: একটা লিস্ট সম্পূর্ণ রিভার্স করলেই হয়, আলাদা করে সোয়াপ করতে হবে না।\n- স্তর নম্বর শুরু ১ ধরা: প্রশ্ন বলেছে রুটের স্তর ০, তাই প্রথম স্তর উল্টবে না।",
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Binary Trees", "BFS", "Zigzag"],
    tests: [
      { input: FULL_7, expectedOutput: "1\n3 2\n4 5 6 7\n", isSample: true },
      { input: "1\n5\n", expectedOutput: "5\n", isSample: true },
      { input: FULL_15, expectedOutput: "1\n3 2\n4 5 6 7\n15 14 13 12 11 10 9 8\n", isSample: false },
      { input: LEFT_3, expectedOutput: "1\n2\n3\n", isSample: false },
      {
        input: lineInput(rightChainTokens(rangeValues(10000))),
        expectedOutput: newlineOutput(rangeValues(10000)),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    tokens = data[1:1 + n]\n    root = Node(int(tokens[0]))\n    queue = deque([root])\n    i = 1\n    while queue and i < n:\n        node = queue.popleft()\n        if i < n:\n            if tokens[i] != 'null':\n                node.left = Node(int(tokens[i]))\n                queue.append(node.left)\n            i += 1\n        if i < n:\n            if tokens[i] != 'null':\n                node.right = Node(int(tokens[i]))\n                queue.append(node.right)\n            i += 1\n\n    lines = []\n    level = [root]\n    depth = 0\n    while level:\n        values = [node.value for node in level]\n        if depth % 2 == 1:\n            values.reverse()\n        lines.append(' '.join(map(str, values)))\n        nxt = []\n        for node in level:\n            if node.left:\n                nxt.append(node.left)\n            if node.right:\n                nxt.append(node.right)\n        level = nxt\n        depth += 1\n    sys.stdout.write('\\n'.join(lines) + '\\n')\n\nmain()\n",
  },
];
