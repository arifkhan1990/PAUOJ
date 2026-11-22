import type { LearningTopicDefinition } from "@/lib/learning/types";

export const graphTraversalTopic: LearningTopicDefinition = {
  slug: "graph-traversal",
  title: "Graph Representation & Traversal",
  titleBn: "গ্রাফ রিপ্রেজেন্টেশন ও ট্রাভার্সাল",
  summary: "Adjacency list/matrix, BFS, DFS আর connected components।",
  concept: `## কেন দরকার

প্রাইমএশিয়া ক্যাম্পাসের ওয়াই-ফাই পয়েন্ট, হোস্টেলের রুম, সোশ্যাল মিডিয়ার ফ্রেন্ডশিপ — সব কিছু আসলে একটা গ্রাফ। নোড মানে যেকোনো আলাদা জিনিস (বিল্ডিং, অ্যাকাউন্ট, রুম), আর এজ মানে তাদের মাঝের সম্পর্ক। রাফি যখন বুঝতে চায় প্রশাসন ভবন থেকে হোস্টেল পর্যন্ত কত মিনিট লাগবে, সে আসলে গ্রাফে সবচেয়ে কম ধাপ খুঁজছে; নুসরাত যখন হোস্টেলের কতগুলো ব্লক আলাদা করে গুনছে, সে connected component মাপছে। বইয়ে তত্ত্ব পড়েও প্রথমবার কোডে লিখলে অনেকে আটকে যান — লুপটা কোথায় বসাবে, visited কবে মার্ক হবে, queue আর stack কোনটা কোন কাজে। এই নোটে আমরা গ্রাফ লেখার দুইভাব (adjacency matrix আর adjacency list), তারপর BFS, DFS, connected component, bipartite check আর SCC — সব এক ধারায় দেখব। পরের টপিকগুলো (শর্টেস্ট পাথ, MST, DSU) এই ভিত্তির উপরেই তৈরি হবে, তাই এখানে বুঝে বুঝে হাত নাড়া বন্ধ করে দেওয়া ভালো।

## মূল ধারণা

গ্রাফ দুইভাবে রাখা যায়। **Adjacency matrix** হলো \`n x n\` সাইজের 2D অ্যারে — \`mat[u][v]\` শূন্য না হলে edge আছে। মেমোরি \`O(n^2)\` লাগে তাই \`n\` বড় হলে কাজে আসে না; শুধু ছোট ঘন গ্রাফে (যেমন \`n <= 1000\` এবং প্রায় প্রতিটি জোড়ায় edge) এটা সুবিধাজনক। **Adjacency list** হলো প্রতিটি নোডের জন্য একটা করে তালিকা — \`adj[u]\`-এ \`u\`-এর পাশের সব নোড থাকে। \`n\` বড় হলে এটাই প্রায় সবসময় সঠিক পছন্দ, কারণ মেমোরি ও সময় দুটোই \`O(n + m)\`। নিচের টেবিলে পার্থক্যটা এক নজরে:

| বিষয় | Adjacency matrix | Adjacency list |
| --- | --- | --- |
| মেমোরি | \`O(n^2)\` | \`O(n + m)\` |
| edge খোঁজা | \`O(1)\` | তালিকায় অনুসন্ধান |
| পাশের সব ঘর ঘোরা | \`O(n)\` | \`O(degree)\` |
| কোথায় কাজে | ছোট, ঘন গ্রাফ | বড়, বিরল গ্রাফ |

**BFS (Breadth-First Search)** একটা ঘর থেকে শুরু করে আগে সব সরাসরি পাশের ঘর, তারপর তাদের পাশ — অর্থাৎ দূরত্ব অনুযায়ী ধাপে ধাপে এগোয়। এর জন্য লাগে queue। সব edge ওজন ১ হলে দূরত্ব বের করতে চাইলে BFS-ই একমাত্র সঠিক পন্থা — যে নোড প্রথমবার visited হয়, ঠিক তখনই সবচেয়ে ছোট দূরত্বে পৌঁছানো হয়। **DFS (Depth-First Search)** একটা পথ যতটা সম্ভব গভীরে গিয়ে আসে, তারপর পেছনে ফিরে অন্য পথ ধরে যায়; এর জন্য লাগে stack বা recursion। দূরত্ব ও shortest path চাইলে BFS, কম্পোনেন্ট ও গভীরতা-ভিত্তিক অ্যালগরিদম চাইলে DFS বেশি কাজে লাগে।

BFS-এর ধাপ ASCII চিত্রে (সোর্স \`1\`):

\`\`\`
        [ 1 ]            স্তর 0
       /     \\
    [ 2 ]   [ 3 ]        স্তর 1
    /   \\     |
 [ 4 ]  [ 5 ] [ 6 ]     স্তর 2
\`\`\`

queue-তে আগে \`1\`, তারপর \`2, 3\`, তারপর \`4, 5, 6\` ঢোকে — এক স্তর শেষ না হওয়া পর্যন্ত পরের স্তরে যাওয়া যায় না, তাই দূরত্ব স্বয়ংক্রিয়ভাবে সঠিক থাকে।

**Connected component** হলো এমন সব নোডের সমাহার যারা একে অপরের কাছে যাওয়া যায়। BFS/DFS একবার চালালে একটা কম্পোনেন্ট পাওয়া যায়; \`visited\` না হওয়া কোনো নোড থাকা পর্যন্ত বাইরে থেকে আবার চালালে কম্পোনেন্ট সংখ্যা মেলে। **Bipartite** গ্রাফ হলো যেখানে সব নোড দুই রঙে এমন রাখা যায় যে প্রতিটি edge দুই রঙের নোড জোড়া দেয় — BFS করার সময় প্রতিটি নোডকে তার পাশের নোডের উল্টো রঙ দিলেই হয়, আর একই রঙের দুই পাশের নোড মিললে সাইকেল তৈরি হয় বলে উত্তর \`NO\`। ডিরেক্টেড গ্রাফে আরেকটা ধারণা **SCC** — যেখানে দুই নোড একে অপরের কাছে (দিক মিলিয়ে) যাওয়া যায়; Kosaraju বা Tarjan অ্যালগরিদম দিয়ে গোনা হয়।

## কোডে দেখি

Python-এ BFS (দূরত্ব বের করা):

\`\`\`python
from collections import deque
import sys
data = list(map(int, sys.stdin.read().split()))
n, m = data[0], data[1]
adj = [[] for _ in range(n + 1)]
for i in range(m):
    u, v = data[2 + 2 * i], data[3 + 2 * i]
    adj[u].append(v)
    adj[v].append(u)
dist = [-1] * (n + 1)
dist[1] = 0
queue = deque([1])
while queue:
    u = queue.popleft()
    for v in adj[u]:
        if dist[v] == -1:
            dist[v] = dist[u] + 1
            queue.append(v)
print(*dist[1:])
\`\`\`

C++-তে DFS দিয়ে কম্পোনেন্ট গোনা:

\`\`\`cpp
vector<int> adj[N];
bool vis[N];
void dfs(int u) {
    vis[u] = true;
    for (int v : adj[u]) if (!vis[v]) dfs(v);
}
// int components = 0;
// for (int i = 1; i <= n; i++) if (!vis[i]) { components++; dfs(i); }
\`\`\`

## ধাপে ধাপে

1. ইনপুট পড়ে \`n\` আর \`m\` আলাদা করো, তারপর \`adj\` তালিকা বানাও — undirected হলে প্রতিটি edge দুই দিকেই যোগ করো।
2. \`dist\` বা \`visited\` অ্যারে \`n + 1\` সাইজের করে \`-1\` / \`false\` দিয়ে শুরু করো।
3. সোর্স নোড queue-তে দিয়ে দূরত্ব ০ বসাও, তারপর queue খালি না হওয়া পর্যন্ত সামনের নোডটা বের করো।
4. পাশের নোড visited না হলে দূরত্ব/রঙ আপডেট করে queue-তে ঢোকাও।
5. BFS শেষ হলে উত্তর ছাপাও; কম্পোনেন্ট চাইলে সব নোডের উপরে বাইরে থেকে আবার BFS/DFS চালাও।

## সাধারণ ভুল

- queue-তে ঢোকার আগে visited মার্ক না করলে একই নোড বারবার যায়, বিশেষত একাধিক বা ডুপ্লিকেট edge থাকলে লুপ চিরকাল চলতে পারে।
- বড় ইনপুটে DFS recursion দিলে Python-এ RecursionError, C++-তে stack overflow হয় — \`n = 100000\`-এ নিজের stack বা iterative DFS ব্যবহার করো।
- Undirected edge শুধু এক দিকে যোগ করলে ঘোরা অসম্পূর্ণ হয় এবং ভুল উত্তর আসে।
- ১-ইনডেক্সড ইনপুটে array-র সাইজ \`n\` না করে \`n + 1\` না করলে \`dist[n]\` পড়তে গিয়েই রানটাইম এরর।

## চেকলিস্ট

- [ ] adjacency list-এ edge দুই দিকে যোগ করেছি?
- [ ] visited/dist অ্যারের সাইজ \`n + 1\` এবং সঠিকভাবে শুরু করা?
- [ ] BFS-এ নোড queue-তে ঢোকার আগেই visited মার্ক করা আছে?
- [ ] কম্পোনেন্ট গোনার সময় প্রতিটি unvisited নোড থেকে ঘোরা শুরু হয়েছে?
- [ ] সর্বোচ্চ ইনপুটে recursion বা টাইমলিমিট ভাঙছে কিনা পরীক্ষা করেছি?
- [ ] উত্তরের ফরম্যাট (\`-1\`, space, newline) নমুনার সাথে হুবহু মিলিয়েছি?

## এবার হাতে-কলমে দেখি

গাইডেড সমস্যা \`learn-m4-graph-traversal-g1\` (BFS দিয়ে দূরত্ব) আর \`learn-m4-graph-traversal-g2\` (কম্পোনেন্ট গোনা) দিয়ে শুরু করো, এরপর practice আর extra সমস্যাগুলো নিজে চেষ্টা করো।`,
  guidedProblemSlugs: ["learn-m4-graph-traversal-g1","learn-m4-graph-traversal-g2"],
  practiceProblemSlugs: {
    easy: ["learn-m4-graph-traversal-e1"],
    medium: ["learn-m4-graph-traversal-m1"],
    hard: ["learn-m4-graph-traversal-h1"],
  },
  extraProblemSlugs: ["learn-m4-graph-traversal-x1","learn-m4-graph-traversal-x2"],
};
