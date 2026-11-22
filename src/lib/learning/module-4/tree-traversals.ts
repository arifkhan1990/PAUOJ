import type { LearningTopicDefinition } from "@/lib/learning/types";

export const treeTraversalsTopic: LearningTopicDefinition = {
  slug: "tree-traversals",
  title: "Tree Traversals",
  titleBn: "ট্রি ট্রাভার্সাল",
  summary: "Preorder, inorder, postorder, level order আর DFS/BFS।",
  concept: `## কেন দরকার

লাইব্রেরির ডিজিটাল ক্যাটালগে প্রতিটা বইয়ের বিষয় একটা গাছে সাজানো। নুসরাত প্রতিদিন একই ধরনের কাজ করে: প্রথমে বিভাগটা দেখা, তারপর তার ভেতরে নেমে সব বইয়ের নাম তুলে আনা। কোন ক্রমে ঘোরা হবে — রুট আগে, নাকি সবার আগে সবচেয়ে নিচের পাতা, নাকি স্তর ধরে ধরে? গাছ নিয়ে কাজ করার সময় এই প্রশ্নটা বারবার আসে, আর উত্তর মিলিয়ে না দিলে সমাধান একেবারেই ভুল হয়। তাই ট্রির কাজ শুরু করার আগেই ট্রাভার্সাল বা "গাছের সব নোড এক এক করে ঘোরা" — এই অধ্যায়টা পরিষ্কার করে নিতে হবে।

এই টপিকে আমরা শিখব চারটা ক্লাসিক ক্রম — preorder, inorder, postorder ও level order — তারপর দেখবে একই কাজ কীভাবে DFS (stack/recursion) আর BFS (queue) দিয়ে করা যায়, এবং শেষে দুটো কঠিন ধরনের প্রশ্ন: গাছ নতুন করে তৈরি করা এবং কলাম অনুযায়ী সাজানো।

## মূল ধারণা

ধরো গাছটা এভাবে — প্রতিটা নোডের সংখ্যা তার মান:

\`\`\`
            1
          /   \\
         2       3
        / \\     / \\
       4   5   6   7
\`\`\`

চিত্র: উদাহরণ গাছ — নিচের চারটা ক্রম এই গাছ দিয়েই দেখানো হবে।

**Preorder (পূর্ববর্তী):** আগে রুট, তারপর বাম সাবট্রি, শেষে ডান সাবট্রি → \`1 2 4 5 3 6 7\`। গাছের কাঠামো একটা লাইনে লিখতে চাইলে এটিই ব্যবহার হয়।

**Inorder (মধ্যবর্তী):** আগে বাম, তারপর রুট, শেষে ডান → \`4 2 5 1 6 3 7\`। BST-এ এটি সবসময় ক্রমানুসারে আসে — এটাই সবচেয়ে বেশি কাজে লাগে।

**Postorder (পরবর্তী):** আগে বাম, তারপর ডান, শেষে রুট → \`4 5 2 6 7 3 1\`। সন্তানরা বাপের আগে শেষ হয় — তাই ফোল্ডার মুছে ফেলা বা সাবট্রির যোগফল বের করা এখান থেকেই হয়।

**Level order (স্তর অনুযায়ী):** উপর থেকে নিচে স্তরে স্তরে — আগে রুটের স্তর, তারপর পরের স্তর → \`1\`, \`2 3\`, \`4 5 6 7\`। এটি BFS দিয়ে হয়, একটা queue লাগে।

| ক্রম | কোথা আগে | কাজে লাগে | কীভাবে মনে রাখো |
| --- | --- | --- | --- |
| preorder | রুট আগে | কাঠামো লেখা, copy করা | নিজে → বাম → ডান |
| inorder | রুট মাঝে | BST-এ sorted তালিকা | বাম → নিজে → ডান |
| postorder | রুট শেষে | মুছে ফেলা, নিচের হিসাব করা | বাম → ডান → নিজে |
| level order | স্তর ধরে | সবচেয়ে কাছের খোঁজ, width | queue দিয়ে BFS |

দুটো পরিবার মনে রাখো: **DFS** একটা পথ গভীরে গিয়ে আটকালে ফিরে আসে — preorder, inorder, postorder তিনটাই DFS। কোন ক্রম হবে সেটা ঠিক করে "নিজের কাজটা" (মান লেখা) কোথায় বসালে: শুরুতে বসালে preorder, বাম-ডানের মাঝে বসালে inorder, শেষে বসালে postorder। আর **BFS** স্তর ধরে এগোয় — একটা queue-তে আগে যার ঢোকা হয়েছে আগে তাই বের হয়। দুটোতেই প্রতিটি নোড ঠিক একবার ঘোরা হয়, তাই সময় সবসময় \`O(n)\`। পার্থক্য শুধু ক্রম আর কোন ডেটা স্ট্রাকচার লাগছে: DFS-এ stack (recursion-এর নিজের stack) আর BFS-এ queue।

DFS-এর recursion depth সরাসরি গাছের উচ্চতার সমান। তাই সোজা (skewed) গাছে \`O(n)\` গভীর recursion ভেঙে যেতে পারে — এমন ক্ষেত্রে নিজের হাতে stack বা queue ব্যবহার করা নিরাপদ। জায়গার হিসাব: DFS-এর stack বা recursion জায়গা নেয় \`O(height)\`; BFS-এর queue-তে থাকে সবচেয়ে চওড়া স্তরটা, যা খারাপ ক্ষেত্রে \`O(n)\`।

## কোডে দেখি

একই গাছের চার রকম ক্রম — recursion দিয়ে সবচেয়ে সহজ:

\`\`\`python
def preorder(node, out):
    if node is None:
        return
    out.append(node.value)
    preorder(node.left, out)
    preorder(node.right, out)

def inorder(node, out):
    if node is None:
        return
    inorder(node.left, out)
    out.append(node.value)
    inorder(node.right, out)

def postorder(node, out):
    if node is None:
        return
    postorder(node.left, out)
    postorder(node.right, out)
    out.append(node.value)
\`\`\`

Level order বা BFS — এখানে recursion লাগে না, শুধু একটা queue:

\`\`\`python
from collections import deque

def level_order(root):
    levels = []
    queue = deque([root])
    while queue:
        size = len(queue)          # এই স্তরে কয়টা নোড আছে
        level = []
        for _ in range(size):
            node = queue.popleft()
            level.append(node.value)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        levels.append(level)
    return levels
\`\`\`

C++-তে BFS একইভাবে \`queue<Node*>\` দিয়ে, আর preorder iterative করতে চাইলে একটা stack:

\`\`\`cpp
vector<int> preorderIterative(Node *root) {
    vector<int> order;
    if (!root) return order;
    stack<Node *> st;
    st.push(root);
    while (!st.empty()) {
        Node *node = st.top(); st.pop();
        order.push_back(node->value);
        if (node->right) st.push(node->right);   // ডান আগে ঢোকালে বাম আগে বের হবে
        if (node->left) st.push(node.left);
    }
    return order;
}
\`\`\`

মনে রাখো: iterative DFS-এ **ডান সন্তান আগে stack-এ ঢোকাতে হয়**, নাহলে ক্রম উল্টে যায়। আর level order-এ প্রতি ধাপে \`len(queue)\` নিয়ে নিতে হয় — সেটাই এক স্তরকে আলাদা করে।

## ধাপে ধাপে

1. প্রশ্ন কোন ক্রম চাছে তা আগে ঠিক করো, তারপর ইনপুটের ফরম্যাট মিলিয়ে গাছটা বানাও (queue দিয়ে level order থেকে)।
2. DFS চাইলে একটা \`visit(node)\` ফাংশন লিখো — রুটের কাজটা ঠিক কোন জায়গায় (আগে, মাঝে, নাকি শেষে) বসবে সেটাই বদলে preorder/inorder/postorder হবে।
3. BFS চাইলে queue নাও, প্রতি ধাপে বর্তমান স্তরের সংখ্যা ধরে রাখো এবং সন্তানদের queue-তে যোগ করো।
4. ফলাফল এক লাইনে স্পেস দিয়ে ছাড়তে চাইলে সব মান একটা লিস্টে জমা করে \`' '.join()\` করো; স্তর ধরে ছাড়তে চাইলে প্রতি স্তর আলাদা লাইন।
5. গাছ নতুন করে তৈরি করতে হলে (inorder+preorder থেকে) প্রতিটা মানের জন্য inorder-এর ইনডেক্স একটা ডিকশনারিতে রাখো, নাহলে প্রতিবার খোঁজায় \`O(n^2)\` হয়ে যায়।
6. শেষে কমপ্লেক্সিটি বলো: সব ট্রাভার্সাল \`O(n)\` সময়, স্পেস সাধারণত \`O(height)\` (queue-তে এক স্তরের নোডও থাকতে পারে, তবে তা \`O(n)\` ছাড়ে না)।

## সাধারণ ভুল

- **ক্রম গুলিয়ে ফেলা:** preorder-এ রুট আগে, postorder-এ শেষে। ছোট গাছে হাতে কলমে চালিয়ে দেখো, মুখস্থ করে বসো না।
- **BFS-এ স্তর আলাদা না করা:** \`len(queue)\` না নিলে সব মান এক লাইনে মিলে যায় বা স্তরের সীমা ভুল হয়।
- **iterative DFS-এ সন্তানের ক্রম উল্টানো:** stack LIFO, তাই বাম আগে বের করতে চাইলে ডানটা আগে ঢোকাতে হয়।
- **সোজা গাছে recursion:** depth \`n\` হলে \`RecursionError\` আসে। \`sys.setrecursionlimit()\` বাড়াও বা stack দিয়ে iterative করো।
- **নতুন গাছ তৈরিতে প্রতিবার inorder খোঁজা:** \`O(n^2)\` হয়ে বড় ইনপুটে টাইম লিমিট পার হয় না।

## চেকলিস্ট

- [ ] কোন ক্রম চাওয়া হয়েছে — preorder, inorder, postorder না level order?
- [ ] গাছ ইনপুট থেকে সঠিকভাবে তৈরি হয়েছে, \`null\` ঘরগুলো কি বাদ পড়েনি?
- [ ] এক লাইনে না স্তর ধরে — আউটপুটের ফরম্যাট ঠিক মিলিয়েছি?
- [ ] সোজা গাছে recursion ভাঙবে কিনা ভেবেছি?
- [ ] কমপ্লেক্সিটি বলেছি: \`O(n)\` সময়, \`O(height)\` স্পেস।

## এবার হাতে-কলমে দেখি

কনসেপ্ট নোট পড়া শেষ হলে দুটো guided সমস্যা দিয়ে শুরু করো: \`learn-m4-tree-traversals-g1\` (preorder বের করা) আর \`learn-m4-tree-traversals-g2\` (inorder বের করা)। তারপর easy, medium, hard আর extra সমস্যাগুলো নিজে চেষ্টা করো।`,
  guidedProblemSlugs: ["learn-m4-tree-traversals-g1","learn-m4-tree-traversals-g2"],
  practiceProblemSlugs: {
    easy: ["learn-m4-tree-traversals-e1","learn-m4-tree-traversals-e2","learn-m4-tree-traversals-e3"],
    medium: ["learn-m4-tree-traversals-m1","learn-m4-tree-traversals-m2","learn-m4-tree-traversals-m3"],
    hard: ["learn-m4-tree-traversals-h1","learn-m4-tree-traversals-h2"],
  },
  extraProblemSlugs: ["learn-m4-tree-traversals-x1","learn-m4-tree-traversals-x2"],
};
