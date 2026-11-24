import type { LearningTopicDefinition } from "@/lib/learning/types";

export const mstDsuTopic: LearningTopicDefinition = {
  slug: "mst-dsu",
  title: "MST & Disjoint Set Union",
  titleBn: "MST ও DSU",
  summary: "Prim, Kruskal, path compression আর union by rank।",
  concept: `## কেন দরকার

তানভির প্রাইমএশিয়া ক্যাম্পাসে নতুন তিনটা ল্যাব যোগ হলে ইলেকট্রিক লাইন টানতে হবে; খরচ কম রাখতে হলে সব ল্যাব যুক্ত থাকবে, আর কোনো বাড়তি লুপ থাকবে না — যেকোনো দুই ল্যাবের মাঝে থাকবে একটামাত্র পথ। এই "সবচেয়ে সস্তা যুক্ত করা" সমস্যাটাই **Minimum Spanning Tree (MST)**। আর প্রতিবার নতুন করে সব জোড়া যাচাই করলে সময় নষ্ট হয় — সেখানে কাজে লাগে **DSU (Disjoint Set Union)**, যেটা "কোন কোন নোড একই দলে" সেকেন্ডের মধ্যে জানায়। রোড নেটওয়ার্ক, ফাইবার অপটিক, ক্লাস্টারিং, এমনকি গেমের ম্যাপ — সবখানেই MST আর DSU লাগে। এই নোটে আমরা Kruskal, Prim, DSU-এর path compression আর union by rank একসাথে দেখব।

## মূল ধারণা

স্প্যানিং ট্রি হলো সব নোড জুড়ে একটামাত্র ট্রি — কোনো সাইকেল নেই, \`n\` নোডে ঠিক \`n - 1\`টা edge। মোট edge-এর ওজনের যোগফল যে ট্রির সবচেয়ে ছোট, সেটাই MST। Kruskal অ্যালগরিদম সব edge ওজন অনুযায়ী সাজিয়ে এক এক করে নেয়: দুই প্রান্ত আলাদা দলে থাকলে জোড়া দেয় (সাইকেল তৈরি হয় না), একই দলে থাকলে বাদ দেয়। কেন? ছোট ওজনের edge না নিলে পরে বড় ওজন দিয়ে বাঁধতে হবে, তাই লোভ করে ছোটটাই নেওয়া সবসময় নিরাপদ — এটাই cut/cycle প্রপার্টির সহজ ভাষা।

Prim একটা ভিন্ন পন্থা ধরে: যেকোনো নোড থেকে শুরু করে সবসময় ইতিমধ্যে যুক্ত অংশ থেকে সবচেয়ে সস্তা edge বেছে নেয়। min-heap দিয়ে চালালে সময় \`O((n + m) log n)\`। Kruskal \`O(m log m)\` এবং edge সাজানো লাগে; Prim ঘন গ্রাফে বা ইনপুট ম্যাট্রিক্স হলে ভালো। দুটোর উত্তর এক — ওজন আলাদা হলে MST একটাই।

DSU দুটো কাজ করে: \`find(x)\` — \`x\` কোন দলের নেতা কে (দলের রুট), আর \`union(a, b)\` — দুই দল মেলানো। শুরুতে প্রতিটি নোড নিজেই নেতা। দুটো কাজই দ্রুত রাখতে দুইটা ট্রিক লাগে:

- **Path compression**: \`find\` করার সময় পথের সব নোড সরাসরি নেতার সাথে জোড়া দিয়ে দেওয়া।
- **Union by rank**: ছোট গাছটাকে বড় গাছের নিচে জুড়ে দেওয়া।

এ দুটো একসাথে থাকলে প্রতিটি অপারেশন প্রায় \`O(1)\` (তত্ত্ব বলে খরচ উল্টো অ্যাকম্যান ফাংশন \`alpha(n)\`-এর সমান, যেটি বাস্তবে \`4\`-এর কম)।

\`\`\`
 find(4) চালানোর আগে:   পরে (path compression):

   [1]                 [1]
   |                  / | \\
   [2]              [2] [3] [4]
   |
  [3]-[4]
\`\`\`

চিত্র: \`find\` চালানোর আগে ও পরে DSU গাছ — path compression পুরো চেইনকে সরাসরি নেতার সাথে জুড়ে দেয়।

| বিষয় | Kruskal | Prim |
| --- | --- | --- |
| ভাবনা | ছোট edge আগে, সাইকেল এড়ায় | যুক্ত অংশ থেকে সস্তা edge |
| ডাটা স্ট্রাকচার | sort + DSU | min-heap |
| সময় | \`O(m log m)\` | \`O((n + m) log n)\` |
| কোথায় ভালো | বিরল গ্রাফে | ঘন গ্রাফেও |

## কোডে দেখি

Python-এ Kruskal (DSU সহ):

\`\`\`python
import sys
data = list(map(int, sys.stdin.read().split()))
n, m = data[0], data[1]
edges = []
for i in range(m):
    u, v, w = data[2 + 3 * i], data[3 + 3 * i], data[4 + 3 * i]
    edges.append((w, u, v))
parent = list(range(n + 1))
def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]
        x = parent[x]
    return x
total = 0
for w, u, v in sorted(edges):
    ru, rv = find(u), find(v)
    if ru != rv:
        parent[ru] = rv
        total += w
print(total)
\`\`\`

DSU-এর union by rank:

\`\`\`python
rank = [0] * (n + 1)
def union(a, b):
    ra, rb = find(a), find(b)
    if ra == rb:
        return False
    if rank[ra] < rank[rb]:
        ra, rb = rb, ra
    parent[rb] = ra
    if rank[ra] == rank[rb]:
        rank[ra] += 1
    return True
\`\`\`

## ধাপে ধাপে

1. ইনপুট থেকে edge তালিকা বানাও; Kruskal হলে ওজন অনুযায়ী \`sort\` করো।
2. \`parent[i] = i\` দিয়ে DSU শুরু করো (rank/size চাইলে ০ দিয়ে)।
3. প্রতিটি edge-এর জন্য দুই প্রান্তের \`find\` করো; আলাদা হলে \`union\` করে ওজন যোগ করো, একই হলে বাদ দাও।
4. \`n - 1\`টা edge নিয়ে গেলে বা edge শেষ হলে উত্তর ছাপাও; সব নোড যুক্ত না হলে প্রশ্ন অনুযায়ী \`-1\` দাও।
5. প্রশ্ন "এখন যুক্ত কি না" হলে প্রতিটি edge-এর পর \`find(u) == find(v)\` যাচাই করে উত্তর দাও।

## সাধারণ ভুল

- \`find\` ছাড়া সরাসরি \`parent[u] == parent[v]\` যাচাই করা — দুই নোড একই দলে থাকলেও তাদের সরাসরি প্যারেন্ট আলাদা হতে পারে, তাই ভুল \`NO\`/সাইকেল রিপোর্ট হয়। সবসময় রুট মিলিয়ে দেখো।
- ডিসকানেক্টেড গ্রাফে \`n - 1\` edge জোড়া লাগে না — শেষে সব নোডের রুট এক কিনা দেখে না \`-1\` দিলে ভুল উত্তর আসে।
- path compression ছাড়া শুধু union করলে লাইন বা লম্বা চেইন হয়ে \`find\` \`O(n)\` হয়ে যায়, বড় ইনপুটে TLE।
- ওজন সমান হলে MST একাধিক হতে পারে — তবে মোট ওজন সবসময় এক; "কোন edge বেছে নেবে" নয়, "মোট কত" হিসেব করো।

## চেকলিস্ট

- [ ] edge ওজন অনুযায়ী সাজানো হয়েছে (Kruskal হলে)?
- [ ] \`find\` পথ কমিয়ে রুট ফিরিয়ে দিচ্ছে?
- [ ] union-এ rank বা size ব্যবহার করা হয়েছে?
- [ ] সব নোড যুক্ত কিনা যাচাই করে \`-1\` বা সঠিক উত্তর দিয়েছি?
- [ ] বড় ইনপুটে \`O(n^2)\` লুপ তো লেখা নেই?
- [ ] উত্তরের ফরম্যাট নমুনার সাথে মিলেছে?

## এবার হাতে-কলমে দেখি

গাইডেড সমস্যা \`learn-m4-mst-dsu-g1\` (DSU দিয়ে দল মেলানো) আর \`learn-m4-mst-dsu-g2\` (Kruskal দিয়ে MST-এর মোট ওজন) দিয়ে শুরু করো, এরপর practice আর extra সমস্যাগুলো নিজে চেষ্টা করো।`,
  guidedProblemSlugs: ["learn-m4-mst-dsu-g1","learn-m4-mst-dsu-g2"],
  practiceProblemSlugs: {
    easy: ["learn-m4-mst-dsu-e1","learn-m4-mst-dsu-e2","learn-m4-mst-dsu-e3"],
    medium: ["learn-m4-mst-dsu-m1","learn-m4-mst-dsu-m2","learn-m4-mst-dsu-m3"],
    hard: ["learn-m4-mst-dsu-h1","learn-m4-mst-dsu-h2"],
  },
  extraProblemSlugs: ["learn-m4-mst-dsu-x1","learn-m4-mst-dsu-x2"],
};
