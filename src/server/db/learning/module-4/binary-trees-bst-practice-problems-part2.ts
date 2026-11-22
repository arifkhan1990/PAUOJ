import type { SeedProblem } from "../../seed-problems";
import { newlineOutput } from "../generated-tests";
import { rangeValues, rightChainTokens } from "./binary-trees-bst-problems";

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

export const BINARY_TREES_BST_PRACTICE_PROBLEMS_PART2: SeedProblem[] = [
  {
    slug: "learn-m4-binary-trees-bst-m3",
    title: "Pair with Given Sum in BST",
    statement: `রফি ক্লাবের দুই সদস্যকে একসাথে জুটি বানাতে চায়, শর্ত হলো দুজনের পয়েন্টের যোগফল ঠিক \`K\` হতে হবে। সদস্যদের পয়েন্ট একটা BST-তে সাজানো আছে, সব মান স্বতন্ত্র।

বলো BST-এ এমন দুটো ভিন্ন মান আছে কি না যাদের যোগফল ঠিক \`K\`। থাকলে \`YES\`, না থাকলে \`NO\`।

উদাহরণ: মান \`2 3 4 5 8\` হলে \`K = 7\`-এ জুটি \`3 + 4\` — উত্তর \`YES\`; \`K = 20\`-এ কোনো জুড়ি মেলে না — উত্তর \`NO\`।`,
    inputFormat: `প্রথম লাইনে \`n K\` — টোকেন সংখ্যা আর লক্ষ্য যোগফল।
পরবর্তী \`n\` লাইনে একটি করে টোকেন: পূর্ণসংখ্যা অথবা \`null\` (গাছটা বৈধ BST)।`,
    outputFormat: "যোগফল `K` হওয়া জুড়ি থাকলে `YES`, না হলে `NO`।",
    constraints:
      "`1 <= n <= 100001`\nসব মান স্বতন্ত্র এবং `1 <= v <= 10^9`।\n`2 <= K <= 2 * 10^9`।",
    editorial: `## ধারণা

BST-এর inorder ক্রমানুসারে মানগুলো সাজানো থাকে — এই সুবিধাটাই কাজে লাগাও। সাজানো লিস্টে ছোট সংখ্যা আগে আর বড়টা শেষে রেখে দুই পয়েন্টার চালাও: যোগফল ছোট হলে বাম পয়েন্টার ডানে সরাও, বড় হলে ডান পয়েন্টার বামে সরাও। প্রতিটি ধাপে একটা পয়েন্টার এক ঘর করে এগোয়, তাই মোট খরচ \`O(n)\`। আর প্রতিটি মান স্বতন্ত্র হওয়ায় একই নোড দুইবার নেওয়ার ভয় নেই — পয়েন্টার দুটো কখনো মিলবে না।

## ধাপে ধাপে

1. টোকেন থেকে BST বানিয়ে iterative inorder চালিয়ে মানগুলো একটা লিস্টে নাও।
2. \`i = 0\`, \`j = শেষ ইনডেক্স\` ধরো।
3. \`values[i] + values[j] == K\` হলে \`YES\` ছেপে থামো।
4. যোগফল \`K\`-এর কম হলে \`i\` বাড়াও, বেশি হলে \`j\` কমাও; \`i >= j\` হলে \`NO\`।

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
    values = []
    stack = []
    node = root
    while stack or node:
        while node:
            stack.append(node)
            node = node.left
        node = stack.pop()
        values.append(node.value)
        node = node.right
    i, j = 0, len(values) - 1
    while i < j:
        s = values[i] + values[j]
        if s == k:
            print('YES')
            return
        if s < k:
            i += 1
        else:
            j -= 1
    print('NO')

main()
\`\`\`

## কমপ্লেক্সিটি

সময় inorder \`O(n)\` + দুই পয়েন্টার \`O(n)\` = মোট \`O(n)\`। স্পেস \`O(n)\`।

## সাধারণ ভুল

- সোজা গাছে inorder করতে গিয়ে recursion ব্যবহার করা — depth \`n\` হলে ভেঙে যায়; এখানে stack দিয়ে iterative নোটই নিরাপদ।
- একই নোড দুইবার ব্যবহার করা (\`i == j\` চেক না করা): একটা মান নিজের সাথে জুড়ে যাওয়া উচিত নয়।
- যোগফল বড় হলে int overflow — Python-এ সেই ভয় নেই, তবে অন্য ভাষায় 64-bit লাগবে।`,
    difficulty: "MEDIUM",
    points: 200,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    tags: ["Binary Search Tree", "Inorder", "Two Pointers"],
    tests: [
      {
        input: `11 7\n${bstTokens([5, 3, 8, 2, 4]).join("\n")}\n`,
        expectedOutput: "YES\n",
        isSample: true,
      },
      {
        input: `11 20\n${bstTokens([5, 3, 8, 2, 4]).join("\n")}\n`,
        expectedOutput: "NO\n",
        isSample: true,
      },
      { input: "1 2\n5\n", expectedOutput: "NO\n", isSample: false },
      {
        input: "5 13\n5\nnull\n8\nnull\nnull\n",
        expectedOutput: "YES\n",
        isSample: false,
      },
      {
        input: "5 14\n5\nnull\n8\nnull\nnull\n",
        expectedOutput: "NO\n",
        isSample: false,
      },
      {
        input: `100001 99999\n${rightChainTokens(rangeValues(50000)).join("\n")}\n`,
        expectedOutput: "YES\n",
        isSample: false,
      },
      {
        input: `100001 3\n${rightChainTokens(rangeValues(50000)).join("\n")}\n`,
        expectedOutput: "YES\n",
        isSample: false,
      },
    ],
    referencePython:
      "import sys\nfrom collections import deque\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\ndef main():\n    data = sys.stdin.read().split()\n    n, k = int(data[0]), int(data[1])\n    tokens = data[2:2 + n]\n    root = Node(int(tokens[0]))\n    queue = deque([root])\n    i = 1\n    while queue and i < n:\n        node = queue.popleft()\n        if i < n:\n            if tokens[i] != 'null':\n                node.left = Node(int(tokens[i]))\n                queue.append(node.left)\n            i += 1\n        if i < n:\n            if tokens[i] != 'null':\n                node.right = Node(int(tokens[i]))\n                queue.append(node.right)\n            i += 1\n    values = []\n    stack = []\n    node = root\n    while stack or node:\n        while node:\n            stack.append(node)\n            node = node.left\n        node = stack.pop()\n        values.append(node.value)\n        node = node.right\n    i, j = 0, len(values) - 1\n    while i < j:\n        s = values[i] + values[j]\n        if s == k:\n            print('YES')\n            return\n        if s < k:\n            i += 1\n        else:\n            j -= 1\n    print('NO')\n\nmain()\n",
  },
  {
    slug: "learn-m4-binary-trees-bst-h2",
    title: "Dynamic K-th Smallest",
    statement: `ক্লাবের লিডারবোর্ড প্রতিদিন বদলায়: নতুন স্কোর ঢোকে, আর নুসরাত যেকোনো সময় জিজ্ঞেস করে ছোট থেকে গোনা k-তম স্কোরটা এখন কত। প্রতিবার পুরো বোর্ড নতুন করে সাজানো ধীর — এমন ব্যবস্থা দরকার যেন প্রতিটি ঢোকানো আর প্রতিটি প্রশ্ন দ্রুত শেষ হয়।

শুরুতে \`n\`টি স্বতন্ত্র স্কোর দেওয়া থাকে। এরপর \`q\`টি অপারেশন: \`I x\` — নতুন স্কোর \`x\` বোর্ডে ঢোকায় (\`x\` আগে বোর্ডে নেই), \`K k\` — ছোট থেকে গোনা k-তম স্কোর ছাপায় (\`k\` সবসময় বোর্ডের বর্তমান আকারের মধ্যে)।

উদাহরণ: শুরুর স্কোর \`5 3 8 1 9\`। \`K 1\` → \`1\`। এরপর \`I 4\` ঢোকালে বোর্ড সাজানো অবস্থায় \`1 3 4 5 8 9\` — তাই \`K 3\` → \`4\`।`,
    inputFormat: `প্রথম লাইনে \`n q\`।
দ্বিতীয় লাইনে \`n\`টি স্বতন্ত্র পূর্ণসংখ্যা — শুরুর স্কোর।
পরের \`q\` লাইনে প্রতিটিতে একটি অপারেশন: \`I x\` বা \`K k\`।`,
    outputFormat: "প্রতিটি `K` অপারেশনের উত্তর এক করে লাইনে।",
    constraints:
      "`1 <= n, q <= 100000`\nসব স্কোর স্বতন্ত্র এবং `1 <= x <= 10^9`।\n`k` প্রতিবার বৈধ — বোর্ডের বর্তমান আকারের মধ্যে।",
    editorial: `## ধারণা

BST-এর প্রতিটি নোডে "নিচে কয়টি মান আছে" (subtree size) গোনা থাকলে k-তম ছোট মান রুট থেকে নেমেই পাওয়া যায়: বাম সাবট্রির আকার \`>= k\` হলে বামে নামো, ঠিক \`k = বাম + 1\` হলে বর্তমান নোডই উত্তর, নয়তো ডানে \`k - বাম - 1\` নিয়ে নামো। কিন্তু সাধারণ BST-তে ঢোকানোর সময় পথের সব size বদলাতে হয়, আর ঝোকা গাছে সেটা ধীর। তাই এখানে মানগুলো ছোট ক্রম সংখ্যায় (coordinate compression) সাজিয়ে একটা Fenwick tree-তে রাখি — প্রতিটি স্কোরের ঘরে \`1\` বসে, আর k-তম বের হয় বড় ঘর থেকে ধাপে ধাপে নেমে। এটা আসলে ওই size-বাড়ানো BST-এরই সরল, ভারসাম্য-নিরাপদ রূপ।

## ধাপে ধাপে

1. পুরো ইনপুট একবারে পড়ে শুরুর স্কোর আর সব \`I\` মান জোগাড় করো।
2. সব মান মিলিয়ে সাজিয়ে প্রতিটি মানের ক্রম সংখ্যা (1-ভিত্তিক) বসাও — এই ঘরগুলোই Fenwick-এর ঘর।
3. শুরুর স্কোরগুলোর ঘরে \`1\` করে যোগ করো।
4. \`I x\` হলে \`x\`-এর ঘরে \`1\` যোগ করো।
5. \`K k\` হলে বড়তম 2-এর ঘাত থেকে নেমে এমন প্রথম অবস্থান বের করো যেখানে জমা সংখ্যা \`k\`-এ পৌঁছায় — সেই ঘরের মানই k-তম স্কোর।

\`\`\`python
import sys

def main():
    data = sys.stdin.read().split()
    n, q = int(data[0]), int(data[1])
    initial = [int(x) for x in data[2:2 + n]]
    ops = data[2 + n:]
    inserted = [int(ops[2 * i + 1]) for i in range(q) if ops[2 * i] == 'I']
    coords = sorted(set(initial) | set(inserted))
    index = {v: i + 1 for i, v in enumerate(coords)}
    size = len(coords)
    tree = [0] * (size + 1)

    def add(i, delta):
        while i <= size:
            tree[i] += delta
            i += i & (-i)

    def kth(k):
        step = 1
        while (step << 1) <= size:
            step <<= 1
        pos, remaining = 0, k
        while step:
            nxt = pos + step
            if nxt <= size and tree[nxt] < remaining:
                pos = nxt
                remaining -= tree[nxt]
            step >>= 1
        return coords[pos]

    for v in initial:
        add(index[v], 1)
    out = []
    for i in range(q):
        if ops[2 * i] == 'I':
            add(index[int(ops[2 * i + 1])], 1)
        else:
            out.append(str(kth(int(ops[2 * i + 1]))))
    print('\\n'.join(out))

main()
\`\`\`

## কমপ্লেক্সিটি

প্রতিটি ঢোকানো ও প্রশ্ন \`O(log n)\` — মোট \`O((n + q) log n)\`। স্পেস \`O(n + q)\`।

## সাধারণ ভুল

- ঢোকানো মানগুলো প্রথমেই না পড়ে compression করা — পরে আসা মানের কোনো ঘর থাকে না, প্রোগ্রাম ভুল ঘরে লেখে।
- k-তম খোঁজায় ছোট ঘাত থেকে উঠা — Fenwick-এর বাইনারি লিফটিং বড় ঘাত থেকে নামে, উল্টো দিকে সংখ্যা মেলে না।
- প্রতি প্রশ্নে বোর্ড নতুন করে সাজানো — সঠিক উত্তর দিলেও \`O(nq)\` খরচে বড় ইনপুটে ধরা খায়।`,
    difficulty: "HARD",
    points: 300,
    timeLimitMs: 3000,
    memoryLimitMb: 256,
    tags: ["Order Statistics", "Fenwick Tree", "Coordinate Compression"],
    tests: [
      {
        input: "5 3\n5 3 8 1 9\nK 1\nI 4\nK 3\n",
        expectedOutput: "1\n4\n",
        isSample: true,
      },
      {
        input: "1 3\n7\nK 1\nI 3\nK 2\n",
        expectedOutput: "7\n7\n",
        isSample: true,
      },
      {
        input: "4 4\n9 7 5 3\nK 4\nI 4\nK 2\nK 5\n",
        expectedOutput: "9\n4\n9\n",
        isSample: false,
      },
      {
        input: "3 2\n10 20 30\nK 1\nK 3\n",
        expectedOutput: "10\n30\n",
        isSample: false,
      },
      {
        input: `50000 50000\n${rangeValues(50000).join(" ")}\n${Array.from(
          { length: 50000 },
          (_, i) => (i % 2 === 0 ? `I ${50001 + i}` : `K ${i + 1}`),
        ).join("\n")}\n`,
        expectedOutput: newlineOutput(
          Array.from({ length: 25000 }, (_, i) => 2 * (i + 1)),
        ),
        isSample: false,
      },
    ],
    referencePython:
      "import sys\n\ndef main():\n    data = sys.stdin.read().split()\n    n, q = int(data[0]), int(data[1])\n    initial = [int(x) for x in data[2:2 + n]]\n    ops = data[2 + n:]\n    inserted = [int(ops[2 * i + 1]) for i in range(q) if ops[2 * i] == 'I']\n    coords = sorted(set(initial) | set(inserted))\n    index = {v: i + 1 for i, v in enumerate(coords)}\n    size = len(coords)\n    tree = [0] * (size + 1)\n\n    def add(i, delta):\n        while i <= size:\n            tree[i] += delta\n            i += i & (-i)\n\n    def kth(k):\n        step = 1\n        while (step << 1) <= size:\n            step <<= 1\n        pos, remaining = 0, k\n        while step:\n            nxt = pos + step\n            if nxt <= size and tree[nxt] < remaining:\n                pos = nxt\n                remaining -= tree[nxt]\n            step >>= 1\n        return coords[pos]\n\n    for v in initial:\n        add(index[v], 1)\n    out = []\n    for i in range(q):\n        if ops[2 * i] == 'I':\n            add(index[int(ops[2 * i + 1])], 1)\n        else:\n            out.append(str(kth(int(ops[2 * i + 1]))))\n    print('\\n'.join(out))\n\nmain()\n",
  },
];
