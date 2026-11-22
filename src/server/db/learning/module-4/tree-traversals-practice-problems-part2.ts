import type { SeedProblem } from "../../seed-problems";
import { completeTokens, rangeValues, rightChainTokens } from "./binary-trees-bst-problems";

const FULL_7_TOKENS = completeTokens(rangeValues(7));
const FULL_7_INPUT = `7\n${FULL_7_TOKENS.join("\n")}\n`;

export const TREE_TRAVERSALS_PRACTICE_PROBLEMS_PART2: SeedProblem[] = [
  {
    slug: "learn-m4-tree-traversals-m3",
    title: "Tree Diameter in Edges",
    statement: `ক্লাবের দুই সদস্যের মধ্যে সবচেয়ে দূরের ব্যবধান মাপতে হবে — গাছের যেকোনো দুই নোডের মধ্যে সবচেয়ে লম্বা পথে কয়টি এজ আছে, সেটাই গাছের diameter। তানভির সাজসজ্জার জন্য এই মাপটা আগে নিতে চায়।

গাছটা level order টোকেন হিসেবে দেওয়া থাকবে (\`null\` মানে খালি ঘর)। Diameter-টা এজ সংখ্যায় ছাপো; একা নোডের উত্তর \`0\`।

উদাহরণ: রুট \`1\`, সন্তান \`2 3\`, নাতি \`4 5 6 7\` — সবচেয়ে লম্বা পথ \`4\` থেকে \`5\` (বা \`6\` থেকে \`7\`) রুট ঘুরে — \`4\`টি এজ।`,
    inputFormat: `প্রথম লাইনে টোকেন সংখ্যা \`n\`।
পরবর্তী \`n\` লাইনে একটি করে টোকেন: পূর্ণসংখ্যা অথবা \`null\`।`,
    outputFormat: "এক লাইনে গাছের diameter (এজ সংখ্যা)।",
    constraints: "`1 <= n <= 100001`\nপ্রতিটি নোডের মান `1 <= v <= 10^5`।",
    editorial: `## ধারণা

লম্বা পথটা যেকোনো নোডকে ঘুরে যেতে পারে — তাই প্রতিটি নোডকে "মোড়" ধরে হিসাব করো। কোনো নোড ঘুরে যাওয়া পথটা আসে বাম সাবট্রির সবচেয়ে গভীর পাতা থেকে নেমে ওই নোড দিয়ে ডান সাবট্রির গভীর পাতায়। প্রতিটি নোডে তাই দুইটা জিনিস দরকার: নিজের সাবট্রির উচ্চতা, আর এই নোড ঘুরে যাওয়া পথের দৈর্ঘ্য = বাম উচ্চতা + ডান উচ্চতা + 2। নিচ থেকে উপরে postorder-এ উচ্চতা বানিয়ে যেতে যেতে সর্বোচ্চ মোড়-পথটা রাখলেই উত্তর। একবারের ঘোরাতেই দুই কাজ শেষ — \`O(n)\`।

## ধাপে ধাপে

1. টোকেন থেকে গাছটা বানাও।
2. একটা stack-ে \`(নোড, done)\` জোড়া রেখে postorder চালাও — \`done\` মানে নিচের দুই সাবট্রির হিসাব শেষ, এবার নোডটি নিজের হিসাব করবে।
3. নোডের বাম ও ডান সন্তানের উচ্চতা তুলে নিজের উচ্চতা = সর্বোচ্চ + 1।
4. এই নোড ঘুরে পথ = বাম + ডান + 2 (সন্তান না থাকলে ওই ঘরে \`-1\` ধরো) — \`best\`-এর সাথে মেলাও।
5. ঘোরা শেষে \`best\` ছাপাও।

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
    best = 0
    height = {}
    stack = [(root, False)]
    while stack:
        node, done = stack.pop()
        if done:
            lh = height[id(node.left)] if node.left else -1
            rh = height[id(node.right)] if node.right else -1
            height[id(node)] = max(lh, rh) + 1
            best = max(best, lh + rh + 2)
            continue
        stack.append((node, True))
        if node.right:
            stack.append((node.right, False))
        if node.left:
            stack.append((node.left, False))
    print(best)

main()
\`\`\`

## কমপ্লেক্সিটি

সময় \`O(n)\` — প্রতিটি নোড একবার তোলা হয়, উচ্চতা আর মোড়-পথ একসাথেই হিসাব হয়। স্পেস \`O(n)\`।

## সাধারণ ভুল

- এজ গোনায় off-by-one: একা নোডের উচ্চতা \`0\`, তাই না-থাকা সন্তানের ঘরে \`-1\` ধরলে জোড়ায় \`+2\` ঠিক বসে।
- শুধু রুট ঘুরে যাওয়া পথ মেপে থেমে যাওয়া — সবচেয়ে লম্বা পথ কোনো এক সাবট্রির ভেতরেও পুরোপুরি থাকতে পারে।
- সোজা গাছে recursion — \`n\` depth-এ ভেঙে যায়; এখানে stack দিয়ে iterative postorder-ই নিরাপদ।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Binary Trees", "DFS", "Diameter"],
    tests: [
      { input: FULL_7_INPUT, expectedOutput: "4\n", isSample: true },
      { input: "1\n5\n", expectedOutput: "0\n", isSample: true },
      { input: "5\n10\n5\nnull\nnull\n7\n", expectedOutput: "2\n", isSample: false },
      {
        input:
          "13\n1\n2\n5\n3\nnull\n6\nnull\n4\nnull\nnull\nnull\nnull\nnull\n",
        expectedOutput: "5\n",
        isSample: false,
      },
      {
        input: `100001\n${rightChainTokens(rangeValues(50000)).join("\n")}\n`,
        expectedOutput: "49999\n",
        isSample: false,
      },
      {
        input: `100001\n${completeTokens(rangeValues(50000)).join("\n")}\n`,
        expectedOutput: "30\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    tokens = data[1:1 + n]\n    root = Node(int(tokens[0]))\n    queue = deque([root])\n    i = 1\n    while queue and i < n:\n        node = queue.popleft()\n        if i < n:\n            if tokens[i] != 'null':\n                node.left = Node(int(tokens[i]))\n                queue.append(node.left)\n            i += 1\n        if i < n:\n            if tokens[i] != 'null':\n                node.right = Node(int(tokens[i]))\n                queue.append(node.right)\n            i += 1\n    best = 0\n    height = {}\n    stack = [(root, False)]\n    while stack:\n        node, done = stack.pop()\n        if done:\n            lh = height[id(node.left)] if node.left else -1\n            rh = height[id(node.right)] if node.right else -1\n            height[id(node)] = max(lh, rh) + 1\n            best = max(best, lh + rh + 2)\n            continue\n        stack.append((node, True))\n        if node.right:\n            stack.append((node.right, False))\n        if node.left:\n            stack.append((node.left, False))\n    print(best)\n\nmain()\n",
  },
  {
    slug: "learn-m4-tree-traversals-h2",
    title: "Count Paths with Sum K",
    statement: `ক্লাবের পয়েন্ট গাছে একটা পথ মানে উপর থেকে নিচে যাওয়া ধারা: কোনো নোড থেকে শুরু করে তার বংশধরদের একটার ভেতর একটা নেমে যেকোনো গভীরতায় শেষ হওয়া (শুরুর নোড নিজেও একটা পথ)। সাদিয়া জানতে চায় এমন কয়টা পথের মানের যোগফল ঠিক \`K\`।

গাছটা level order টোকেন হিসেবে দেওয়া থাকবে (\`null\` মানে খালি ঘর), নোডের মান ঋণাত্মকও হতে পারে। যোগফল \`K\` হওয়া পথের সংখ্যা ছাপো — একই নোড-জোড়ার পথ একবারই গোনা হবে, ক্রম উল্টে গোনা যাবে না (পথ সবসময় উপর থেকে নিচে)।

উদাহরণ: রুট \`1\`, বামে \`2\`, ডানে \`3\` আর \`K = 3\` হলে পথ দুটি — একা নোড \`3\`, আর \`1 → 2\`।`,
    inputFormat: `প্রথম লাইনে \`n K\` — টোকেন সংখ্যা আর লক্ষ্য যোগফল।
পরবর্তী \`n\` লাইনে একটি করে টোকেন: পূর্ণসংখ্যা অথবা \`null\`।`,
    outputFormat: "এক লাইনে যোগফল `K` হওয়া পথের সংখ্যা।",
    constraints:
      "`1 <= n <= 100001`\n`-10^9 <= v <= 10^9`\n`|K| <= 10^14`।",
    editorial: `## ধারণা

প্রতিটি পথ রুট থেকে নেমে আসা একটা ধারার টুকরো। তাই প্রতিটি নোডে বর্তমান পথের চলছুল যোগফল (prefix sum \`cur\`) ধরে রাখো। কোনো নোড \`v\`-তে শেষ হওয়া পথগুলোর মধ্যে যোগফল \`K\` হয় যেগুলোর শুরু \`u\`-এর prefix ঠিক \`cur − K\` — কারণ \`u\` থেকে \`v\` পর্যন্ত যোগফল \`cur(v) − cur(u)\`। তাই একটা ডিকশনারিতে পূর্বপুরুষদের prefix গুনে রাখো, প্রতিটি নোডে \`count[cur − K]\` যোগ করো। সাবট্রি শেষে নিজের prefix গুনা এক কমাও — নইলে পাশের শাখার নোড এই নোডকে ভুল পূর্বপুরুষ ধরে। রুটের আগে খালি পথের prefix \`0\` একবার বসানো।

## ধাপে ধাপে

1. গাছটা বানিয়ে একটা ডিকশনারি \`count = {0: 1}\` নাও — রুটের উপরের খালি পথ।
2. Iterative DFS-এ প্রতিটি নোডে ঢুকে \`cur\`-এ মান যোগ করো, \`count[cur]\` বাড়াও, উত্তরে \`count[cur − K]\` যোগ করো।
3. সেই নোডের exit-এ ফিরে এসে \`count[cur]\` কমাও আর \`cur\` থেকে মানটা বাদ দাও — এখন নিচের শাখায় এই নোড পথের ভেতর নেই।
4. পুরো গাছ ঘুরে জমা মোট সংখ্যা ছাপাও।

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
    n, k = int(data[0]), int(data[1])
    tokens = data[2:2 + n]
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
    count = {0: 1}
    total, cur = 0, 0
    stack = [(root, False)]
    while stack:
        node, done = stack.pop()
        if done:
            count[cur] -= 1
            cur -= node.value
            continue
        cur += node.value
        count[cur] = count.get(cur, 0) + 1
        total += count.get(cur - k, 0)
        stack.append((node, True))
        if node.right:
            stack.append((node.right, False))
        if node.left:
            stack.append((node.left, False))
    print(total)

main()
\`\`\`

## কমপ্লেক্সিটি

প্রতিটি নোড একবার ঢোকে একবার বের হয়, ডিকশনারি কাজ \`O(1)\` — সময় \`O(n)\`, স্পেস \`O(n)\`। সব জোড়া আলাদা করে গোনা হলে \`O(n^2)\` — সেটা এই সীমায় অসম্ভব।

## সাধারণ ভুল

- Exit-এ prefix কমাতে ভুলে যাওয়া — তখন ডান শাখার নোড বাম শাখাকেও পূর্বপুরুষ ধরে বসে, উত্তর বেশি আসে।
- রুটের খালি পথের \`0\` বসানো ভুলে যাওয়া — রুট থেকে শুরু হওয়া পথগুলো গোনা পড়ে না।
- মান ঋণাত্মক হতে পারে, তাই ছোট থেকে বড় গিয়ে থামা জাতীয় কোনো shortcut চলে না; সব পথই দেখতে হবে।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Binary Trees", "Prefix Sums", "DFS"],
    tests: [
      { input: "3 3\n1\n2\n3\n", expectedOutput: "2\n", isSample: true },
      { input: "1 5\n5\n", expectedOutput: "1\n", isSample: true },
      { input: "3 2\n5\n-3\n2\n", expectedOutput: "2\n", isSample: false },
      { input: "3 4\n5\n-3\n2\n", expectedOutput: "0\n", isSample: false },
      {
        input: `100001 1\n${rightChainTokens(Array(50000).fill(1)).join("\n")}\n`,
        expectedOutput: "50000\n",
        isSample: false,
      },
      {
        input: `100001 25000\n${rightChainTokens(Array(50000).fill(1)).join("\n")}\n`,
        expectedOutput: "25001\n",
        isSample: false,
      },
      {
        input: `31 3\n${completeTokens(Array(15).fill(1)).join("\n")}\n`,
        expectedOutput: "12\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n, k = int(data[0]), int(data[1])\n    tokens = data[2:2 + n]\n    root = Node(int(tokens[0]))\n    queue = deque([root])\n    i = 1\n    while queue and i < n:\n        node = queue.popleft()\n        if i < n:\n            if tokens[i] != 'null':\n                node.left = Node(int(tokens[i]))\n                queue.append(node.left)\n            i += 1\n        if i < n:\n            if tokens[i] != 'null':\n                node.right = Node(int(tokens[i]))\n                queue.append(node.right)\n            i += 1\n    count = {0: 1}\n    total, cur = 0, 0\n    stack = [(root, False)]\n    while stack:\n        node, done = stack.pop()\n        if done:\n            count[cur] -= 1\n            cur -= node.value\n            continue\n        cur += node.value\n        count[cur] = count.get(cur, 0) + 1\n        total += count.get(cur - k, 0)\n        stack.append((node, True))\n        if node.right:\n            stack.append((node.right, False))\n        if node.left:\n            stack.append((node.left, False))\n    print(total)\n\nmain()\n",
  },
];
