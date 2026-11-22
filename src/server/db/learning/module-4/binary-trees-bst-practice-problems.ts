import type { SeedProblem } from "../../seed-problems";
import { lineInput } from "../generated-tests";
import {
  completeTokens,
  rangeValues,
  rightChainTokens,
} from "./binary-trees-bst-problems";

// BST বানিয়ে level order টোকেন তৈরি করে — m2/m3 টেস্টের জন্য।
function bstTokens(inserts: number[]): string[] {
  type Node = { value: number; left: Node | null; right: Node | null };
  const node = (value: number): Node => ({ value, left: null, right: null });
  const root = node(inserts[0] as number);
  for (const value of inserts.slice(1)) {
    let cur = root;
    for (;;) {
      if (value < cur.value) {
        if (!cur.left) {
          cur.left = node(value);
          break;
        }
        cur = cur.left;
      } else {
        if (!cur.right) {
          cur.right = node(value);
          break;
        }
        cur = cur.right;
      }
    }
  }
  const tokens: string[] = [];
  const queue: Node[] = [root];
  while (queue.length > 0) {
    const cur = queue.shift() as Node;
    for (const child of [cur.left, cur.right]) {
      if (child) {
        tokens.push(String(child.value));
        queue.push(child);
      } else {
        tokens.push("null");
      }
    }
  }
  return [String(root.value), ...tokens];
}

import { BINARY_TREES_BST_PRACTICE_PROBLEMS_PART2 } from "./binary-trees-bst-practice-problems-part2";

const BINARY_TREES_BST_PRACTICE_PROBLEMS_PART1: SeedProblem[] = [
  {
    slug: "learn-m4-binary-trees-bst-e2",
    title: "Tree Value Sum",
    statement: `ক্লাবের মেন্টরিং গাছে প্রতিটি নোডে সদস্যের অর্জিত পয়েন্ট লেখা আছে। সপ্তাহ শেষে তানভির পুরো ক্লাবের মোট পয়েন্ট বের করবে — অর্থাৎ গাছের সব নন-\`null\` নোডের মানের যোগফল।

গাছটা level order টোকেন হিসেবে দেওয়া থাকবে (\`null\` মানে খালি ঘর), নিয়ম \`learn-m4-binary-trees-bst-g1\`-এর মতোই। সব নোডের মানের যোগফল বের করে ছাপো।

উদাহরণ: টোকেন \`1\`, \`2\`, \`3\` হলে গাছে মান \`1\`, \`2\`, \`3\` — যোগফল \`6\`।`,
    inputFormat: `প্রথম লাইনে টোকেন সংখ্যা \`n\`।
পরবর্তী \`n\` লাইনে একটি করে টোকেন: পূর্ণসংখ্যা অথবা \`null\`।`,
    outputFormat: "এক লাইনে সব নন-`null` নোডের মানের যোগফল।",
    constraints: "`1 <= n <= 100001`\nপ্রতিটি নোডের মান `1 <= v <= 10^5`।",
    editorial: `## ধারণা

যোগফলের জন্য প্রতিটি নোডে ঠিক একবার গিয়ে মানটা জমাতে হয়। কোন ক্রমে ঘোরা হচ্ছে সেটা এখানে গুরুত্বপূর্ণ নয় — শুধু কোনো নোড বাদ না পড়া বা দুইবার যোগ না হওয়া দরকার। stack নিয়ে iterative DFS চালালে সোজা গাছেও recursion-এর ভয় নেই, খরচ \`O(n)\`।

## ধাপে ধাপে

1. টোকেন থেকে queue দিয়ে গাছটা বানাও।
2. stack-এ রুট বসিয়ে শুরু করো।
3. প্রতিটি নোড তুলে \`total\`-এ তার মান যোগ করো, তারপর non-null সন্তানদের stack-এ দাও।
4. stack খালি হলে \`total\` ছাপাও।

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
    total = 0
    stack = [root]
    while stack:
        node = stack.pop()
        total += node.value
        if node.left:
            stack.append(node.left)
        if node.right:
            stack.append(node.right)
    print(total)

main()
\`\`\`

## কমপ্লেক্সিটি

সময় \`O(n)\` — প্রতিটি নোড একবারই তোলা হয়। স্পেস \`O(n)\` (গাছ + stack)।

## সাধারণ ভুল

- \`null\` টোকেনকে মান ধরে যোগ করা — \`null\` কোনো নোড নয়।
- একটা সন্তান এড়িয়ে গেলে বাকি টোকেনগুলো ভুল নোডে বসে যায়, যোগফল এলোমেলো হয়।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Binary Trees", "DFS", "Sum"],
    tests: [
      { input: "3\n1\n2\n3\n", expectedOutput: "6\n", isSample: true },
      {
        input:
          "15\n1\n2\n3\n4\n5\n6\n7\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\n",
        expectedOutput: "28\n",
        isSample: true,
      },
      { input: "5\n10\n5\nnull\nnull\n7\n", expectedOutput: "22\n", isSample: false },
      { input: "1\n100\n", expectedOutput: "100\n", isSample: false },
      {
        input: lineInput(rightChainTokens(rangeValues(50000))),
        expectedOutput: "1250025000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    tokens = data[1:1 + n]\n    root = Node(int(tokens[0]))\n    queue = deque([root])\n    i = 1\n    while queue and i < n:\n        node = queue.popleft()\n        if i < n:\n            if tokens[i] != 'null':\n                node.left = Node(int(tokens[i]))\n                queue.append(node.left)\n            i += 1\n        if i < n:\n            if tokens[i] != 'null':\n                node.right = Node(int(tokens[i]))\n                queue.append(node.right)\n            i += 1\n    total = 0\n    stack = [root]\n    while stack:\n        node = stack.pop()\n        total += node.value\n        if node.left:\n            stack.append(node.left)\n        if node.right:\n            stack.append(node.right)\n    print(total)\n\nmain()\n",
  },
  {
    slug: "learn-m4-binary-trees-bst-e3",
    title: "Nodes at Level K",
    statement: `নুসরাত মেন্টরিং গাছের নির্দিষ্ট একটা স্তর পরীক্ষা করছে: রুট থেকে ঠিক \`k\` ধাপ নিচে কয়জন সদস্য বসে আছে। রুটের স্তর \`0\`, তার সন্তানদের স্তর \`1\`, এভাবে স্তর নামে।

গাছটা level order টোকেন হিসেবে দেওয়া থাকবে (\`null\` মানে খালি ঘর)। স্তর \`k\`-তে মোট কয়টি নন-\`null\` নোড আছে সেটি ছাপো। স্তরটা গাছের ভেতরেই থাকবে এমন কোনো শর্ত নেই — না থাকলে উত্তর \`0\`।

উদাহরণ: রুট \`1\`, বামে \`2\`, ডানে \`3\` — এই গাছে স্তর \`1\`-এ \`2\`টি নোড।`,
    inputFormat: `প্রথম লাইনে \`n k\` — টোকেন সংখ্যা আর কোন স্তর গোনা হবে।
পরবর্তী \`n\` লাইনে একটি করে টোকেন: পূর্ণসংখ্যা অথবা \`null\`।`,
    outputFormat: "এক লাইনে স্তর `k`-তে নোডের সংখ্যা।",
    constraints:
      "`1 <= n <= 100001`\n`0 <= k <= 10^9`\nপ্রতিটি নোডের মান `1 <= v <= 10^5`।",
    editorial: `## ধারণা

স্তর ধরে নামা মানে BFS। একটা লিস্টে বর্তমান স্তরের নোডগুলো রাখো, তাদের সন্তানদের দিয়ে পরের স্তর বানাও। প্রতি ধাপে স্তর নম্বর এক বাড়ে; যে ধাপে স্তর নম্বর \`k\` হয়, সেই লিস্টের দৈর্ঘ্যই উত্তর। লিস্ট আগেই খালি হয়ে গেলে গাছ শেষ — উত্তর \`0\`। এভাবে \`k\` যত বড়ই হোক, লুপটা গাছের উচ্চতার চেয়ে বেশি ঘোরে না।

## ধাপে ধাপে

1. টোকেন থেকে গাছটা বানাও।
2. \`level = [root]\` আর \`depth = 0\` দিয়ে শুরু করো।
3. \`depth == k\` হলে লিস্টের দৈর্ঘ্য ছেপে থামো।
4. না হলে সব নোডের non-null সন্তানদের নিয়ে পরের স্তর বানাও, \`depth\` এক বাড়াও।
5. লিস্ট খালি হয়ে গেলে \`0\` ছাপাও।

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
    level, depth, count = [root], 0, 0
    while level:
        if depth == k:
            count = len(level)
            break
        nxt = []
        for node in level:
            if node.left:
                nxt.append(node.left)
            if node.right:
                nxt.append(node.right)
        level = nxt
        depth += 1
    print(count)

main()
\`\`\`

## কমপ্লেক্সিটি

সময় \`O(n)\` — প্রতিটি নোড একবারই স্তরে বসে; \`k\` বড় হলে লুপ আগেই থেমে যায়। স্পেস \`O(n)\`।

## সাধারণ ভুল

- রুটের স্তর \`1\` ধরে নেওয়া — এখানে রুটের স্তর \`0\`, তাই \`k = 0\` হলে উত্তর অন্তত \`1\`।
- \`k\` উচ্চতার চেয়ে বড় হলে লুপ চিরকাল ঘোরানো — লিস্ট খালি হলেই থামো, উত্তর \`0\`।`,
    difficulty: "EASY",
    points: 100,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Binary Trees", "BFS", "Levels"],
    tests: [
      { input: "3 0\n1\n2\n3\n", expectedOutput: "1\n", isSample: true },
      {
        input:
          "15 1\n1\n2\n3\n4\n5\n6\n7\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\n",
        expectedOutput: "2\n",
        isSample: true,
      },
      {
        input:
          "15 2\n1\n2\n3\n4\n5\n6\n7\nnull\nnull\nnull\nnull\nnull\nnull\nnull\nnull\n",
        expectedOutput: "4\n",
        isSample: false,
      },
      { input: "1 5\n5\n", expectedOutput: "0\n", isSample: false },
      { input: "5 1\n10\n5\nnull\nnull\n7\n", expectedOutput: "1\n", isSample: false },
      {
        input: `100001 15\n${completeTokens(rangeValues(50000)).join("\n")}\n`,
        expectedOutput: `${Math.min(2 ** 15, 50000 - (2 ** 15 - 1))}\n`,
        isSample: false,
      },
      {
        input: `100001 25000\n${rightChainTokens(rangeValues(50000)).join("\n")}\n`,
        expectedOutput: "1\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n, k = int(data[0]), int(data[1])\n    tokens = data[2:2 + n]\n    root = Node(int(tokens[0]))\n    queue = deque([root])\n    i = 1\n    while queue and i < n:\n        node = queue.popleft()\n        if i < n:\n            if tokens[i] != 'null':\n                node.left = Node(int(tokens[i]))\n                queue.append(node.left)\n            i += 1\n        if i < n:\n            if tokens[i] != 'null':\n                node.right = Node(int(tokens[i]))\n                queue.append(node.right)\n            i += 1\n    level, depth, count = [root], 0, 0\n    while level:\n        if depth == k:\n            count = len(level)\n            break\n        nxt = []\n        for node in level:\n            if node.left:\n                nxt.append(node.left)\n            if node.right:\n                nxt.append(node.right)\n        level = nxt\n        depth += 1\n    print(count)\n\nmain()\n",
  },
  {
    slug: "learn-m4-binary-trees-bst-m2",
    title: "BST Range Sum",
    statement: `সাদিয়া ক্লাবের স্কোরবোর্ড একটা BST-তে রেখেছে — ছোট মান বামে, বড় মান ডানে। এখন সে জানতে চায় \`L\` থেকে \`R\`-এর মধ্যে (দুটোই ধরা হবে) স্কোরগুলোর মোট যোগফল কত। পুরো গাছ না ঘুরে শুধু দরকারি শাখাগুলোতে নেমেই উত্তর বের করা যায় — BST-এর নিয়ম বলে দেয় কোন শাখায় ওই রেঞ্জের মান থাকতেই পারে।

ইনপুটে একটা বৈধ BST দেওয়া থাকবে (সব মান স্বতন্ত্র)। মান \`L <= v <= R\` হলে সেই সব নোডের মানের যোগফল ছাপো; রেঞ্জে কোনো মান না পড়লে যোগফল \`0\`।

উদাহরণ: BST-এর inorder মান \`1 3 4 5 7 8 9\`, \`L = 3\`, \`R = 7\` হলে যোগফল \`3 + 4 + 5 + 7 = 19\`।`,
    inputFormat: `প্রথম লাইনে \`n L R\` — টোকেন সংখ্যা আর রেঞ্জ।
পরবর্তী \`n\` লাইনে একটি করে টোকেন: পূর্ণসংখ্যা অথবা \`null\` (গাছটা বৈধ BST)।`,
    outputFormat: "এক লাইনে রেঞ্জের ভেতরের মানের যোগফল।",
    constraints:
      "`1 <= n <= 100001`\nসব মান স্বতন্ত্র এবং `1 <= v <= 10^9`।\n`1 <= L <= R <= 10^9`।",
    editorial: `## ধারণা

BST-এর নিয়ম দুই দিক থেকে কাজে লাগে। নোডের মান \`L\`-এর চেয়ে ছোট বা সমান হলে তার বাম সাবট্রির সব মান রেঞ্জের নিচে — সেই শাখা ঘুরার দরকার নেই। মান \`R\`-এর চেয়ে বড় বা সমান হলে ডান সাবট্রির সব মান রেঞ্জের উপরে — সেটাও বাদ। এভাবে প্রতিটি নোডে সর্বোচ্চ একটা শাখাই রেঞ্জের মান ধরে রাখতে পারে, তাই প্রশ্নের পথ গাছ ঘুরে বের হওয়ার পথের সাথে মিলে যায় — ঝোকা গাছেও খরচ \`O(height)\`-এর বেশি নয়।

## ধাপে ধাপে

1. টোকেন থেকে BST-টা বানাও।
2. stack-এ রুট বসাও; প্রতিটি নোড তুলে মান \`L <= v <= R\` হলে \`total\`-এ যোগ করো।
3. \`v > L\` হলে বাম শাখায় রেঞ্জের মান থাকতে পারে — বাম সন্তান থাকলে stack-এ দাও।
4. \`v < R\` হলে ডান শাখাও দেখো।
5. stack খালি হলে \`total\` ছাপাও।

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
    n, low, high = int(data[0]), int(data[1]), int(data[2])
    tokens = data[3:3 + n]
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
    total = 0
    stack = [root]
    while stack:
        node = stack.pop()
        v = node.value
        if low <= v <= high:
            total += v
        if v > low and node.left:
            stack.append(node.left)
        if v < high and node.right:
            stack.append(node.right)
    print(total)

main()
\`\`\`

## কমপ্লেক্সিটি

ভারসাম্য থাকলে সময় \`O(log n)\`-ও হতে পারে, তবে সর্বোচ্চ \`O(n)\`। স্পেস \`O(n)\`।

## সাধারণ ভুল

- শর্ত উল্টে লেখা: বাম শাখায় নামার শর্ত \`v > L\`, ডানের শর্ত \`v < R\` — সমান বসালে সীমানার মান বাদ পড়ে।
- পুরো গাছ ঘুরেও উত্তর আসে, কিন্তু সেটা pruning-এর সুবিধা নেয় না; বড় গাছে অপ্রয়োজনীয় কাজ বাড়ে।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Binary Search Tree", "Pruning", "Sum"],
    tests: [
      {
        input: `15 3 7\n${bstTokens([5, 3, 8, 1, 4, 7, 9]).join("\n")}\n`,
        expectedOutput: "19\n",
        isSample: true,
      },
      { input: "1 5 10\n7\n", expectedOutput: "7\n", isSample: true },
      {
        input: `15 1 100\n${bstTokens([5, 3, 8, 1, 4, 7, 9]).join("\n")}\n`,
        expectedOutput: "37\n",
        isSample: false,
      },
      { input: "1 8 9\n5\n", expectedOutput: "0\n", isSample: false },
      {
        input: `15 5 5\n${bstTokens([5, 3, 8, 1, 4, 7, 9]).join("\n")}\n`,
        expectedOutput: "5\n",
        isSample: false,
      },
      {
        input: `100001 100 200\n${rightChainTokens(rangeValues(50000)).join("\n")}\n`,
        expectedOutput: "15150\n",
        isSample: false,
      },
      {
        input: `100001 1 50000\n${rightChainTokens(rangeValues(50000)).join("\n")}\n`,
        expectedOutput: "1250025000\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n, low, high = int(data[0]), int(data[1]), int(data[2])\n    tokens = data[3:3 + n]\n    root = Node(int(tokens[0]))\n    queue = deque([root])\n    i = 1\n    while queue and i < n:\n        node = queue.popleft()\n        if i < n:\n            if tokens[i] != 'null':\n                node.left = Node(int(tokens[i]))\n                queue.append(node.left)\n            i += 1\n        if i < n:\n            if tokens[i] != 'null':\n                node.right = Node(int(tokens[i]))\n                queue.append(node.right)\n            i += 1\n    total = 0\n    stack = [root]\n    while stack:\n        node = stack.pop()\n        v = node.value\n        if low <= v <= high:\n            total += v\n        if v > low and node.left:\n            stack.append(node.left)\n        if v < high and node.right:\n            stack.append(node.right)\n    print(total)\n\nmain()\n",
  },
];

export const BINARY_TREES_BST_PRACTICE_PROBLEMS: SeedProblem[] = [
  ...BINARY_TREES_BST_PRACTICE_PROBLEMS_PART1,
  ...BINARY_TREES_BST_PRACTICE_PROBLEMS_PART2,
];
