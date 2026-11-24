import type { LearningTopicDefinition } from "@/lib/learning/types";

export const binaryTreesBstTopic: LearningTopicDefinition = {
  slug: "binary-trees-bst",
  title: "Binary Trees & BST",
  titleBn: "বাইনারি ট্রি ও BST",
  summary: "Tree structure, BST property, insert/search/delete।",
  concept: `## কেন দরকার

প্রাইমএশিয়া ইউনিভার্সিটির কম্পিউটার ক্লাবে নতুন ভর্তি শুরু হয়েছে, আর প্রতিটি নতুন সদস্যের জন্য একজন সিনিয়র মেন্টর ঠিক করা হয়েছে। মেন্টরদের নিজেদেরও মেন্টর আছে, তাই সম্পর্কগুলো মিলিয়ে দাঁড়ায় একটা বড় গাছ — সবার উপরে ক্লাব প্রেসিডেন্ট, তার নিচে কয়েকজন সিনিয়র, আর সবার নিচে নতুনরা। রফি প্রথমবার বুঝল শুধু লিস্ট কেন যথেষ্ট নয়: কোনো একজনের নিচে কারা আছে জানতে চাইলে পুরো তালিকাটা ঘুরে বের করতে হয়, কিন্তু গাছে কেবল তার নিজের ছোট শাখাটা দেখলেই উত্তর পাওয়া যায়।

ফাইল ফোল্ডার, অর্গানাইজাশান চার্ট, HTML ডকুমেন্টের DOM, ডাটাবেসের ইনডেক্স, এমনকি কম্পাইলারের সিনট্যাক্স ট্রি — সবই একই কাঠামোর উপর দাঁড়ানো। এই টপিকে আমরা শিখব বাইনারি ট্রি কী, তার উচ্চতা আর পাতা কীভাবে গোনা যায়, এবং BST (Binary Search Tree) কীভাবে খোঁজা, যোগ করা আর মুছে ফেলার কাজটা একই নিয়মে সেরে দেয়।

## মূল ধারণা

একটা ট্রি হলো নোড নিয়ে গঠিত একটা কাঠামো, যেখানে একটা বিশেষ নোড হলো **রুট (root)**, আর বাকি সব নোড রুট থেকে শুরু করে একটার পর একটা পথে পৌঁছানো যায়। সংযোগকারী রেখাকে **এজ (edge)**, আর কোনো নোডের সরাসরি নিচের নোডকে **সন্তান** বলে। সন্তান না থাকলে সেটি **পাতা (leaf)**। **বাইনারি ট্রি** মানে প্রতিটি নোডের সন্তান সর্বোচ্চ দুইটি — বাম আর ডান।

\`\`\`
            8            <- রুট (depth 0)
          /   \\
         4      12       <- depth 1
        / \\    / \\
       2   6  10  14     <- depth 2
      / \\ / \\ / \\ / \\
     1  3 5 7 9 11 13 15  <- পাতা (leaf), depth 3
\`\`\`

চিত্র: একটা পূর্ণ বাইনারি ট্রি — রুট সবার উপরে, পাতাগুলো সবার নিচের স্তরে।

উপরের চিত্রে কয়েকটা পরিভাষা এক নজরে:

| পরিভাষা | কী মানে | উদাহরণ |
| --- | --- | --- |
| depth | রুট থেকে কয়টা এজ দিয়ে এসেছি | 10-এর depth 2 |
| height | কোনো নোড থেকে নিচে সবচেয়ে লম্বা পথের এজ সংখ্যা | পুরো গাছের height 3 |
| subtree | কোনো নোড আর তার নিচের সবকিছু | 4-এর সাবট্রি 2, 6, 1, 3, 5, 7 |
| degree | নোডের সন্তান সংখ্যা | পাতার degree 0 |

**উচ্চতা কেন গুরুত্বপূর্ণ:** গাছের সব কাজ (খোঁজা, ঘোরা) রুট থেকে শুরু হয়, তাই কাজের খরচ সাধারণত \`O(height)\`। যদি গাছটা পুরোটাই একপাশে ঝুলে থাকে (skewed), তাহলে height হয় \`n\` এবং খরচ হয় \`O(n)\` — অর্থাৎ লিস্ট ঘোরার মতোই। আর যদি প্রায় সমানভাবে ভাগ থাকে (balanced), তাহলে height হয় \`O(log n)\` এবং প্রতিটি কাজ \`O(log n)\` সময়ে শেষ।

**BST বা Binary Search Tree** হলো বাইনারি ট্রির একটা বিশেষ রূপ, যেখানে প্রতিটি নোডের জন্য একটা নিয়ম মানতে হয়:

- বাম সাবট্রির **সব** মান নোডের চেয়ে **ছোট**;
- ডান সাবট্রির **সব** মান নোডের চেয়ে **বড়**;
- সব মান স্বতন্ত্র (distinct)।

এই নিয়মের সবচেয়ে মজার ফল: BST-এর **inorder ট্রাভার্সাল সবসময় ছোট থেকে বড় ক্রমে** আসে। উপরের গাছের inorder হয় \`1 2 3 4 5 6 7 8 9 10 11 12 13 14 15\`। খোঁজার সময় প্রতি ধাপে ঠিক করো ডানে নামবে নাকি বামে — তাই প্রতি ধাপে অর্ধেকটা গাছ বাদ পড়ে, আর খরচ হয় \`O(height)\`। ভারসাম্য থাকলে সেটি \`O(log n)\`।

| কাজ | Balanced BST | একপাশে ঝোকা BST |
| --- | --- | --- |
| খোঁজা (search) | \`O(log n)\` | \`O(n)\` |
| যোগ (insert) | \`O(log n)\` | \`O(n)\` |
| মুছে ফেলা (delete) | \`O(log n)\` | \`O(n)\` |
| পুরো ঘোরা (traversal) | \`O(n)\` | \`O(n)\` |

## কোডে দেখি

প্রথমে দেখি ইনপুট থেকে গাছ বানানো। এখানে ইনপুট আসে level order অনুযায়ী: রুট আগে, তারপর পরপর স্তর। \`null\` মানে ওই ঘরটা খালি, আর খালি নোডের সন্তান কোনো টোকেন পায় না:

\`\`\`python
from collections import deque

class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None

def build(tokens):
    root = Node(int(tokens[0]))
    queue = deque([root])
    i = 1
    while queue and i < len(tokens):
        node = queue.popleft()
        if i < len(tokens):                     # বাম সন্তান
            if tokens[i] != 'null':
                node.left = Node(int(tokens[i]))
                queue.append(node.left)
            i += 1
        if i < len(tokens):                     # ডান সন্তান
            if tokens[i] != 'null':
                node.right = Node(int(tokens[i]))
                queue.append(node.right)
            i += 1
    return root
\`\`\`

এবার BST-এ খোঁজা আর যোগ করা — দুটোই একই পথ ধরে নামা:

\`\`\`python
def search(root, target):
    node = root
    while node:
        if target == node.value:
            return True
        node = node.left if target < node.value else node.right
    return False

def insert(root, value):
    if root is None:
        return Node(value)
    node, parent, go_left = root, None, False
    while node:
        parent, go_left = node, value < node.value
        node = node.left if go_left else node.right
    if go_left:
        parent.left = Node(value)
    else:
        parent.right = Node(value)
    return root
\`\`\`

C++-তে একই ধারণা — Python-এর \`None\`-এর জায়গায় \`nullptr\`:

\`\`\`cpp
struct Node {
    long long value;
    Node *left, *right;
    Node(long long v) : value(v), left(nullptr), right(nullptr) {}
};

bool search(Node *root, long long target) {
    while (root) {
        if (target == root->value) return true;
        root = target < root->value ? root->left : root->right;
    }
    return false;
}
\`\`\`

মনে রাখো — নিচে নামার পথটা কখনো ঘুরে একই নোডে ফিরে আসে না, কারণ প্রতি ধাপে ঠিক একটা দিকেই যাওয়া হয়। তাই খোঁজা আর যোগ দুটোতেই সময় \`O(height)\`, আর ভারসাম্য থাকলে \`O(log n)\`।

## ধাপে ধাপে

1. ইনপুট পড়ে আগে ট্রিটা বানাও — একটা queue নিয়ে প্রতিটি non-null নোডের জন্য পরবর্তী দুইটি টোকেন বাম ও ডান সন্তান হিসেবে বসাও।
2. প্রশ্নটা চেনা: নোড গোনা হলে ঘোরা যথেষ্ট; উচ্চতা হলে প্রতি স্তরে একবার যেতে হবে; খোঁজা হলে রুট থেকে নিচে নামতে হবে।
3. BST-এর নিয়ম মনে রাখো: মান ছোট হলে বামে, বড় হলে ডানে — সব সময়, শুধু বাবার সাথে নয়, পুরো সাবট্রির সাথে।
4. Insert-এ কোথায় থামল সেটা খুঁজে পেয়ে সেখানে নতুন নোড জোড়া দাও; delete-এ তিনটা কেস আলাদা করে দেখো — পাতা, এক সন্তান, দুই সন্তান।
5. দুই সন্তানওয়ালা নোড মুছতে চাইলে তার জায়গায় বসবে **ইনঅর্ডার সাকসেসর** (ডান সাবট্রির সবচেয়ে ছোট মান), আর সেই সাকসেসরটাকে তার নিজের জায়গা থেকেও সরিয়ে দিতে হবে।
6. শেষে কমপ্লেক্সিটি মিলিয়ে দেখো: ভারসাম্য থাকলে \`O(log n)\`, নয়তো \`O(n)\`; ট্রাভার্সাল সবসময় \`O(n)\`।

## সাধারণ ভুল

- **উচ্চতায় off-by-one:** নোড গোনা আর এজ গোনা এক নয়। একা নোডের height \`0\` (এজ হিসেবে), নোড সংখ্যা নয়। প্রশ্নে কোনটা চাওয়া হয়েছে আগে পড়ো।
- **শুধু বাবা-সন্তান মিলিয়ে BST ধরা:** নোড \`10\`-এর বামে \`5\` আর \`5\`-এর ডানে \`12\` — বাবা-সন্তান দুই জোড়াতেই নিয়ম মিললেও \`12 > 10\` হওয়ায় গাছটা BST নয়। প্রতিটি নোডের সাথে উপরের সীমা (lower/upper bound) মিলিয়ে দেখতে হবে।
- **ঝোকা গাছে recursion ভেঙে যাওয়া:** সোজা গাছে depth \`n\` হয়ে গেলে Python-এর ডিফল্ট recursion limit অতিক্রম করে \`RecursionError\` আসে। \`sys.setrecursionlimit()\` বাড়াও বা iterative (queue/stack) করে চলো।
- **দুই সন্তানওয়ালা delete-এ সাকসেসর সরানো ভুলে যাওয়া:** মান বসিয়ে দিলেই হয় না, সাকসেসর নোডটাকেও তার আসল জায়গা থেকে সরাতে হবে, নাহলে গাছে একই নোড দুইবার আটকে যায়।

## চেকলিস্ট

- [ ] ইনপুটের ফরম্যাট বুঝেছি — \`null\` কীভাবে আসছে, কোন নোডের সন্তান কোন টোকেন নিচ্ছে?
- [ ] উচ্চতা এজ হিসেবে না নোড হিসেবে — ঠিক কোনটা চাওয়া হয়েছে?
- [ ] BST যাচাইয়ে শুধু বাবা-সন্তান নয়, পুরো সীমা (bound) মিলিয়েছি?
- [ ] সোজা/ঝোকা গাছের জন্য recursion ভাঙবে কিনা ভেবেছি?
- [ ] কমপ্লেক্সিটি বলেছি: \`O(height)\` কাজ, \`O(n)\` ট্রাভার্সাল, \`O(n)\` স্পেস (স্টোর করা গাছ)।

## এবার হাতে-কলমে দেখি

কনসেপ্ট নোট পড়া শেষ হলে দুটো guided সমস্যা দিয়ে শুরু করো: \`learn-m4-binary-trees-bst-g1\` (ট্রি থেকে নোড গোনা) আর \`learn-m4-binary-trees-bst-g2\` (BST-এ খোঁজা)। তারপর easy, medium, hard আর extra সমস্যাগুলো নিজে চেষ্টা করো।`,
  guidedProblemSlugs: ["learn-m4-binary-trees-bst-g1","learn-m4-binary-trees-bst-g2"],
  practiceProblemSlugs: {
    easy: ["learn-m4-binary-trees-bst-e1","learn-m4-binary-trees-bst-e2","learn-m4-binary-trees-bst-e3"],
    medium: ["learn-m4-binary-trees-bst-m1","learn-m4-binary-trees-bst-m2","learn-m4-binary-trees-bst-m3"],
    hard: ["learn-m4-binary-trees-bst-h1","learn-m4-binary-trees-bst-h2"],
  },
  extraProblemSlugs: ["learn-m4-binary-trees-bst-x1","learn-m4-binary-trees-bst-x2"],
};
