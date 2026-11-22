import type { SeedProblem } from "../../seed-problems";
import { spaceOutput } from "../generated-tests";
import { completeTokens, rangeValues, rightChainTokens } from "./binary-trees-bst-problems";

const FULL_7_TOKENS = completeTokens(rangeValues(7));
const FULL_7_INPUT = `7\n${FULL_7_TOKENS.join("\n")}\n`;

// নিখুঁত (perfect) বাইনারি গাছের preorder আর postorder — m2-এর টেস্টে।
function perfectPre(size: number): number[] {
  const out: number[] = [];
  const go = (i: number): void => {
    if (i > size) return;
    out.push(i);
    go(2 * i);
    go(2 * i + 1);
  };
  go(1);
  return out;
}

function perfectPost(size: number): number[] {
  const out: number[] = [];
  const go = (i: number): void => {
    if (i > size) return;
    go(2 * i);
    go(2 * i + 1);
    out.push(i);
  };
  go(1);
  return out;
}

import { TREE_TRAVERSALS_PRACTICE_PROBLEMS_PART2 } from "./tree-traversals-practice-problems-part2";

const TREE_TRAVERSALS_PRACTICE_PROBLEMS_PART1: SeedProblem[] = [
  {
    slug: "learn-m4-tree-traversals-e2",
    title: "Widest Tree Level",
    statement: `কমিউনিটি উইকে ক্লাবের মেন্টরিং গাছের প্রতিটা স্তরে দাঁড়িয়ে ছবি তোলা হবে। সাদিয়া আগেই জানতে চায় সবচেয়ে বেশি সদস্য কোন স্তরে পড়ছে — যে স্তরে নোড সংখ্যা সর্বোচ্চ, সেটাই সবচেয়ে চওড়া স্তর।

গাছটা level order টোকেন হিসেবে দেওয়া থাকবে (\`null\` মানে খালি ঘর)। একটা স্তরে সর্বোচ্চ কয়টি নোড বসে আছে সেটি ছাপো — কোন স্তরটা সেটা বলতে হবে না, শুধু সংখ্যাটা।

উদাহরণ: রুট \`1\`, সন্তান \`2 3\`, নাতি \`4 5 6 7\` — সবচেয়ে চওড়া স্তরে \`4\`টি নোড।`,
    inputFormat: `প্রথম লাইনে টোকেন সংখ্যা \`n\`।
পরবর্তী \`n\` লাইনে একটি করে টোকেন: পূর্ণসংখ্যা অথবা \`null\`।`,
    outputFormat: "এক লাইনে সবচেয়ে চওড়া স্তরের নোড সংখ্যা।",
    constraints: "`1 <= n <= 100001`\nপ্রতিটি নোডের মান `1 <= v <= 10^5`।",
    editorial: `## ধারণা

স্তরের আকার জানতে হলে স্তর ধরে ঘুরলেই হয় — মানে BFS। একটা লিস্টে বর্তমান স্তরের নোড রেখে তাদের সন্তানদের দিয়ে পরের স্তর বানাও; প্রতিটি স্তরের দৈর্ঘ্য মিলিয়ে সর্বোচ্চটা রাখো। প্রতিটি নোড ঠিক একবার ঘোরে, তাই সময় \`O(n)\` — পুরো গাছ অন্য কোনো ক্রমে ঘুরে গোনার দরকার নেই।

## ধাপে ধাপে

1. টোকেন থেকে queue দিয়ে গাছটা বানাও।
2. \`level = [root]\` আর \`best = 0\` নাও।
3. \`level\` খালি না হওয়া পর্যন্ত: \`best\`-এর সাথে লিস্টের দৈর্ঘ্য মেলাও, তারপর সন্তানদের নিয়ে পরের স্তর বানাও।
4. শেষে \`best\` ছাপাও।

\`\`\`python
import sys
from collections import deque

class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None

def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    tokens = data[1:1 + n]
    root = Node(int(tokens[0]))
    queue = deque([root])
    i = 1
    while queue and i < n:
        node = queue.popleft()
        if i < n:
            if tokens[i] != 'null':
                node.left = Node(int(tokens[i]))
                queue.append(node.left)
            i += 1
        if i < n:
            if tokens[i] != 'null':
                node.right = Node(int(tokens[i]))
                queue.append(node.right)
            i += 1
    level, best = [root], 0
    while level:
        best = max(best, len(level))
        nxt = []
        for node in level:
            if node.left:
                nxt.append(node.left)
            if node.right:
                nxt.append(node.right)
        level = nxt
    print(best)

main()
\`\`\`

## কমপ্লেক্সিটি

সময় \`O(n)\`, স্পেস \`O(n)\` — সবচেয়ে চওড়া স্তরটাই একসাথে লিস্টে থাকে।

## সাধারণ ভুল

- সন্তান যোগ করার সময় \`null\` চেক না করা — খালি ঘর লিস্টে ঢুকে দৈর্ঘ্য বাড়িয়ে দেয়।
- এক স্তরের নোড আংশিক তুলে পরের স্তরে মেশানো — স্তরের সীমা ভেঙে গেলে গোনা ভুল হয়।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Binary Trees", "BFS", "Levels"],
    tests: [
      { input: FULL_7_INPUT, expectedOutput: "4\n", isSample: true },
      { input: "1\n5\n", expectedOutput: "1\n", isSample: true },
      { input: "5\n10\n5\nnull\nnull\n7\n", expectedOutput: "1\n", isSample: false },
      {
        input: `100001\n${rightChainTokens(rangeValues(50000)).join("\n")}\n`,
        expectedOutput: "1\n",
        isSample: false,
      },
      {
        input: `100001\n${completeTokens(rangeValues(50000)).join("\n")}\n`,
        expectedOutput: `${Math.max(
          ...Array.from({ length: 16 }, (_, d) => Math.min(2 ** d, 50000 - (2 ** d - 1))),
        )}\n`,
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    tokens = data[1:1 + n]\n    root = Node(int(tokens[0]))\n    queue = deque([root])\n    i = 1\n    while queue and i < n:\n        node = queue.popleft()\n        if i < n:\n            if tokens[i] != 'null':\n                node.left = Node(int(tokens[i]))\n                queue.append(node.left)\n            i += 1\n        if i < n:\n            if tokens[i] != 'null':\n                node.right = Node(int(tokens[i]))\n                queue.append(node.right)\n            i += 1\n    level, best = [root], 0\n    while level:\n        best = max(best, len(level))\n        nxt = []\n        for node in level:\n            if node.left:\n                nxt.append(node.left)\n            if node.right:\n                nxt.append(node.right)\n        level = nxt\n    print(best)\n\nmain()\n",
  },
  {
    slug: "learn-m4-tree-traversals-e3",
    title: "Leaf Values Left to Right",
    statement: `মেন্টরিং গাছের যে সদস্যরা কাউকে পড়ায় না — অর্থাৎ যাদের কোনো সন্তান নেই — তারাই পাতা। ফেস্টের শেষ দিনে নুসরাত পাতা সদস্যদের মঞ্চে ডাকবে, যে ক্রমে একটা বাম-থেকে-ডান DFS (preorder) ঘোরায় সামনে পড়ে সেই ক্রমে — বাম সাবট্রির সব পাতা আগে, তারপর ডান সাবট্রির।

গাছটা level order টোকেন হিসেবে দেওয়া থাকবে (\`null\` মানে খালি ঘর)। পাতা নোডগুলোর মান এই ক্রমে এক লাইনে স্পেস দিয়ে ছাপো।

উদাহরণ: রুট \`1\`, সন্তান \`2 3\`, নাতি \`4 5 6 7\` — পাতা \`4 5 6 7\`।`,
    inputFormat: `প্রথম লাইনে টোকেন সংখ্যা \`n\`।
পরবর্তী \`n\` লাইনে একটি করে টোকেন: পূর্ণসংখ্যা অথবা \`null\`।`,
    outputFormat: "পাতার মানগুলো এক লাইনে, স্পেস দিয়ে আলাদা।",
    constraints: "`1 <= n <= 100001`\nপ্রতিটি নোডের মান `1 <= v <= 10^5`।",
    editorial: `## ধারণা

পাতা চেনা সহজ: বাম আর ডান — দুই ঘরেই কেউ নেই। ক্রমটা আসে preorder ঘোরা থেকে: নোড দেখার সময় সে পাতা হলে লিস্টে বসে, না হলে আগে বাম সাবট্রি শেষ হয়, পরে ডান। stack দিয়ে iterative preorder চালালে ডান সন্তান আগে ঢুকিয়ে বামটা উপরে রাখতে হয় — stack LIFO।

## ধাপে ধাপে

1. টোকেন থেকে গাছটা বানাও।
2. stack-এ রুট বসাও।
3. প্রতিটি নোড তুলে দেখো: দুই সন্তানই খালি হলে মানটা \`leaves\` লিস্টে যোগ করো।
4. না হলে আগে ডান সন্তান (থাকলে), পরে বাম সন্তান stack-এ দাও — যাতে বামটা আগে বের হয়।
5. শেষে \`leaves\` স্পেস দিয়ে ছাপাও।

\`\`\`python
import sys
from collections import deque

class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None

def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    tokens = data[1:1 + n]
    root = Node(int(tokens[0]))
    queue = deque([root])
    i = 1
    while queue and i < n:
        node = queue.popleft()
        if i < n:
            if tokens[i] != 'null':
                node.left = Node(int(tokens[i]))
                queue.append(node.left)
            i += 1
        if i < n:
            if tokens[i] != 'null':
                node.right = Node(int(tokens[i]))
                queue.append(node.right)
            i += 1
    leaves = []
    stack = [root]
    while stack:
        node = stack.pop()
        if node.left is None and node.right is None:
            leaves.append(node.value)
            continue
        if node.right:
            stack.append(node.right)
        if node.left:
            stack.append(node.left)
    print(' '.join(map(str, leaves)))

main()
\`\`\`

## কমপ্লেক্সিটি

সময় \`O(n)\` — প্রতিটি নোড একবারই তোলা হয়। স্পেস \`O(n)\`।

## সাধারণ ভুল

- স্তর ধরে (BFS) পাতা তুললে ক্রম আর preorder-এর মতো না-হতে পারে — যেখানে গভীরতা আলাদা, সেখানে দুই ক্রম আলাদা। বলা ক্রমটাই মেনে চলো।
- stack-এ বাম সন্তান আগে ঢুকিয়ে দিলে সে শেষে বের হয় — ডান আগে ঢোকাও, বাম পরে।
- এক সন্তানওয়ালা নোডকে পাতা ধরা — একটা ঘর ভরা থাকলেই সে পাতা নয়।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Binary Trees", "DFS", "Leaves"],
    tests: [
      { input: FULL_7_INPUT, expectedOutput: "4 5 6 7\n", isSample: true },
      { input: "1\n5\n", expectedOutput: "5\n", isSample: true },
      { input: "5\n10\n5\nnull\nnull\n7\n", expectedOutput: "7\n", isSample: false },
      {
        input: "11\n1\n2\nnull\n3\nnull\n4\nnull\n5\nnull\nnull\nnull\n",
        expectedOutput: "5\n",
        isSample: false,
      },
      {
        input: `100001\n${rightChainTokens(rangeValues(50000)).join("\n")}\n`,
        expectedOutput: "50000\n",
        isSample: false,
      },
      {
        input: `65535\n${completeTokens(rangeValues(32767)).join("\n")}\n`,
        expectedOutput: spaceOutput(rangeValues(32767).slice(16383)),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    tokens = data[1:1 + n]\n    root = Node(int(tokens[0]))\n    queue = deque([root])\n    i = 1\n    while queue and i < n:\n        node = queue.popleft()\n        if i < n:\n            if tokens[i] != 'null':\n                node.left = Node(int(tokens[i]))\n                queue.append(node.left)\n            i += 1\n        if i < n:\n            if tokens[i] != 'null':\n                node.right = Node(int(tokens[i]))\n                queue.append(node.right)\n            i += 1\n    leaves = []\n    stack = [root]\n    while stack:\n        node = stack.pop()\n        if node.left is None and node.right is None:\n            leaves.append(node.value)\n            continue\n        if node.right:\n            stack.append(node.right)\n        if node.left:\n            stack.append(node.left)\n    print(' '.join(map(str, leaves)))\n\nmain()\n",
  },
  {
    slug: "learn-m4-tree-traversals-m2",
    title: "Rebuild Tree from Preorder and Postorder",
    statement: `রফির হাতে গাছটা আর নেই — পুরনো নোটবুকে শুধু দুটো তালিকা পাওয়া গেছে: গাছের preorder আর postorder। ভাগ্য ভালো, গাছটা ছিল full binary tree — প্রতিটি নোডের হয় ঠিক দুইটি সন্তান, নয়তে একটিও নেই; এই শর্তে দুই তালিকা থেকে গাছটা একটাই হয়।

দুই তালিকা থেকে গাছটা নতুন করে বানিয়ে তার level order ক্রমে মানগুলো এক লাইনে ছাপো।

উদাহরণ: preorder \`1 2 4 5 3 6 7\` আর postorder \`4 5 2 6 7 3 1\` হলে গাছটা রুট \`1\`, বামে \`2\`, ডানে \`3\`, আর তাদের সন্তান \`4 5\` ও \`6 7\` — level order \`1 2 3 4 5 6 7\`।`,
    inputFormat: `প্রথম লাইনে নোড সংখ্যা \`n\`।
দ্বিতীয় লাইনে \`n\`টি স্বতন্ত্র পূর্ণসংখ্যা — preorder ক্রম।
তৃতীয় লাইনে \`n\`টি স্বতন্ত্র পূর্ণসংখ্যা — postorder ক্রম।`,
    outputFormat: "গাছটির level order ক্রমে মানগুলো এক লাইনে, স্পেস দিয়ে আলাদা।",
    constraints:
      "`1 <= n <= 10000`\nসব মান স্বতন্ত্র, `1 <= v <= 10^9`।\nগাছটা full binary tree — প্রতিটি নোডের সন্তান ০টি বা ২টি।",
    editorial: `## ধারণা

Preorder-এর প্রথম মান রুট। রুটের পরের মানটা বাম সাবট্রির রুট — সেই মানটা postorder-এ যেখানে বসে, তার থেকে বাম সাবট্রির আকার বের হয়: postorder-এ বাম সাবট্রির রুট তার সাবট্রির শেষ মান, তাই সেই ইনডেক্স পর্যন্ত গোনা মানই বাম সাবট্রির সব নোড। এই আকার জানলে preorder আর postorder দুই ভাগে কেটে বাম-ডান recursion চালালেই গাছ তৈরি। Full binary tree শর্তটা জরুরি — এক সন্তানওয়ালা নোড থাকলে সে বাম না ডান, দুই তালিকা থেকে বলা যায় না।

## ধাপে ধাপে

1. Postorder-এর প্রতিটি মানের ইনডেক্স একটা ডিকশনারিতে রাখো — প্রতি ধাপে খোঁজা বাদ দিতে।
2. রুট বানাও preorder-এর প্রথম মান দিয়ে; এক নোড হলে সে পাতা, থামো।
3. বাম রুট = preorder-এর পরের মান; postorder-এ তার ইনডেক্স থেকে বাম সাবট্রির আকার = ইনডেক্স − শুরু + 1।
4. সেই আকার অনুযায়ী দুই তালিকা ভেঙে বাম আর ডান সাবট্রি recursion-এ বানাও।
5. শেষে BFS দিয়ে level order এক লাইনে ছাড়ো।

\`\`\`python
import sys
sys.setrecursionlimit(20000)
from collections import deque

class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None

def build(pre, post, pos, pre_lo, pre_hi, post_lo):
    node = Node(pre[pre_lo])
    if pre_lo == pre_hi:
        return node
    left_size = pos[pre[pre_lo + 1]] - post_lo + 1
    node.left = build(pre, post, pos, pre_lo + 1, pre_lo + left_size, post_lo)
    node.right = build(pre, post, pos, pre_lo + left_size + 1, pre_hi, post_lo + left_size)
    return node

def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    pre = list(map(int, data[1:1 + n]))
    post = list(map(int, data[1 + n:1 + 2 * n]))
    pos = {v: i for i, v in enumerate(post)}
    root = build(pre, post, pos, 0, n - 1, 0)
    out = []
    queue = deque([root])
    while queue:
        node = queue.popleft()
        out.append(node.value)
        if node.left:
            queue.append(node.left)
        if node.right:
            queue.append(node.right)
    print(' '.join(map(str, out)))

main()
\`\`\`

## কমপ্লেক্সিটি

প্রতিটি নোড একবারই বানানো হয়, ইনডেক্স খোঁজা ডিকশনারিতে \`O(1)\` — মোট সময় \`O(n)\`। স্পেস \`O(n)\`।

## সাধারণ ভুল

- বাম সাবট্রির আকার পোস্টঅর্ডার ইনডেক্স থেকে না বের করে preorder-এ খোঁজা — সেখানে বাম রুটের অবস্থান আকার বলে দেয় না।
- এক সন্তানওয়ালা গাছে এই নিয়ম কাজ করে না — সে কেসে দুই ভবনই সম্ভব; শর্তটা প্রশ্নেই বাঁধা।
- গভীর গাছে recursion limit বাড়াতে ভুলে যাওয়া — ঝোকা full tree-তে গভীরতা \`n / 2\` পর্যন্ত যেতে পারে।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Binary Trees", "Reconstruction", "Traversal"],
    tests: [
      {
        input: "7\n1 2 4 5 3 6 7\n4 5 2 6 7 3 1\n",
        expectedOutput: "1 2 3 4 5 6 7\n",
        isSample: true,
      },
      { input: "1\n9\n9\n", expectedOutput: "9\n", isSample: true },
      { input: "3\n1 2 3\n2 3 1\n", expectedOutput: "1 2 3\n", isSample: false },
      { input: "5\n1 2 4 5 3\n4 5 2 3 1\n", expectedOutput: "1 2 3 4 5\n", isSample: false },
      {
        input: `1999\n${[
          ...rangeValues(1000),
          ...Array.from({ length: 999 }, (_, i) => 1999 - i),
        ].join(" ")}\n${[
          1000,
          1999,
          ...Array.from({ length: 998 }, (_, i) => {
            const k = 999 - i;
            return [k, 999 + k];
          }).flat(),
          1,
        ].join(" ")}\n`,
        expectedOutput: spaceOutput([
          1,
          ...Array.from({ length: 999 }, (_, i) => [i + 2, 1001 + i]).flat(),
        ]),
        isSample: false,
      },
      {
        input: `8191\n${perfectPre(8191).join(" ")}\n${perfectPost(8191).join(" ")}\n`,
        expectedOutput: spaceOutput(rangeValues(8191)),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nsys.setrecursionlimit(20000)\nfrom collections import deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef build(pre, post, pos, pre_lo, pre_hi, post_lo):\n    node = Node(pre[pre_lo])\n    if pre_lo == pre_hi:\n        return node\n    left_size = pos[pre[pre_lo + 1]] - post_lo + 1\n    node.left = build(pre, post, pos, pre_lo + 1, pre_lo + left_size, post_lo)\n    node.right = build(pre, post, pos, pre_lo + left_size + 1, pre_hi, post_lo + left_size)\n    return node\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    pre = list(map(int, data[1:1 + n]))\n    post = list(map(int, data[1 + n:1 + 2 * n]))\n    pos = {v: i for i, v in enumerate(post)}\n    root = build(pre, post, pos, 0, n - 1, 0)\n    out = []\n    queue = deque([root])\n    while queue:\n        node = queue.popleft()\n        out.append(node.value)\n        if node.left:\n            queue.append(node.left)\n        if node.right:\n            queue.append(node.right)\n    print(' '.join(map(str, out)))\n\nmain()\n",
  },
];

export const TREE_TRAVERSALS_PRACTICE_PROBLEMS: SeedProblem[] = [
  ...TREE_TRAVERSALS_PRACTICE_PROBLEMS_PART1,
  ...TREE_TRAVERSALS_PRACTICE_PROBLEMS_PART2,
];
