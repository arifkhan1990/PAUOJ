import type { LearningTopicDefinition } from "@/lib/learning/types";

export const networkFlowTopic: LearningTopicDefinition = {
  slug: "network-flow",
  title: "Network Flow & Bipartite Matching",
  titleBn: "নেটওয়ার্ক ফ্লো ও ম্যাচিং",
  summary: "Max flow, min cut আর bipartite matching।",
  concept: `## কেন দরকার

প্রাইমএশিয়া ক্যাম্পাসের ওয়াটার ল্যাবে রাফিকে বলা হয়েছে — একটা রিসার্ভোয়ার থেকে ক্যান্টিন পর্যন্ত পাইপ নেটওয়ার্কে সবচেয়ে বেশি কত পানি পাঠানো যায়? প্রতিটা পাইপের একটা সর্বোচ্চ ধারণক্ষমতা আছে, আর পানি যেকোনো রাস্তা দিয়ে যেতে পারে। সাথে সাথেই সাদিয়া বলেন — ভলান্টিয়ার আর কাজের স্লট জোড়া দিতেও তো একই সমস্যা, শুধু সেখানে প্রতিটা পাইপের ক্ষমতা এক।

এই দুটো সমস্যাই মিলে নেটওয়ার্ক ফ্লো তৈরি করে। বড় বড় অ্যাসাইনমেন্ট, সাপ্লাই-চেইন, সিডিউলিং সবই এক সময় এখানে এসে পড়ে। আর "কাকে কোন কাজ দেওয়া যায়" — bipartite matching — flow-এর একটা বিশেষ রূপ, তাই একসাথে শেখা যায়।

## মূল ধারণা

**ফ্লো নেটওয়ার্ক:** একটা দিকনির্দেশ গ্রাফ যেখানে প্রতিটা এজের capacity আছে, একটা source (\`s\`) আর একটা sink (\`t\`)। ফ্লো মানে প্রতিটা এজে পাঠানো পরিমাণ, যেন:

1. কোনো এজে ফ্লো capacity ছাড়া বেড়ে না যায়।
2. কোনো intermediate নোডে ঢোকার পরিমাণ = বের হওয়ার পরিমাণ (conservation)।
3. source থেকে যত বের হয়, sink-এ ততই ঢোকে — সেটাই মোট flow-এর মান।

\`\`\`
        3        2
   1 ------> 2 ------> 4        <- 1 = source, 4 = sink
   |         |
  (2)       (1)
   |         v
   3 ------> 4
      (4)
\`\`\`

উপরের নেটওয়ার্কে সবচেয়ে বেশি পানি যাবে ৫ ইউনিট। **Max-flow min-cut উপপাদ্য** বলে: যেকোনো এমন কাট (নোড দুই ভাগে ভাগ, source এক পাশে, sink অন্য পাশে) যার বাইরের এজগুলোর capacity সবচেয়ে কম, ঠিক সেটুকুই সর্বোচ্চ flow যায়। উপরের চিত্রে \`{1, 2, 3}\` সেট থেকে \`4\`-এ যাওয়া এজদুটোর capacity \`2 + 4 = 6\`, আর \`{1}\` থেকে বের হওয়ার \`3 + 2 = 5\` — সবচেয়ে কমটা ৫, তাই উত্তর ৫।

**Residual graph:** এজে যত বাকি আছে তাকে forward residual edge, আর যত পাঠানো হয়েছে তাকে ওল্টোদিকে backward edge ধরুন। এভাবে কোনো রাস্তায় আগে যে ভুল পাঠানো হয়েছে সেটা পেছনে টেনে সংশোধন করা যায়। প্রতিটি ধাপে residual graph-এ \`s\` থেকে \`t\` পর্যন্ত একটা পথ (augmenting path) খুঁজে সেই পথে যত সম্ভব পাঠানো — আর পথ না থাকলে flow সর্বোচ্চ।

| অ্যালগরিদম | পথ খোঁজার ধরন | সময় |
| --- | --- | --- |
| Ford-Fulkerson | DFS | খারাপ ক্ষেত্রে অসীম |
| Edmonds-Karp | BFS (সবচেয়ে ছোট পথ) | \`O(V * E^2)\` |
| Dinic | BFS লেভেল + DFS | অনেক ক্ষেত্রে খুব দ্রুত |
| Kuhn (matching) | DFS augmenting path | \`O(V * E)\` |

**Bipartite matching:** বাঁ পাশে \`n\` জন, ডান পাশে \`m\` জন, মাঝে কিছু এজ। একজনকে একজনের সাথে জোড়া দিতে হবে যেন কেউ দুইবার না ব্যবহৃত হয় — সর্বোচ্চ কয়টা জোড়া পাওয়া যায় সেটাই সর্বোচ্চ matching। এটাকে flow-এ রূপান্তর করা যায়: source থেকে বাঁ পাশে সবাইকে capacity ১, বাঁ থেকে ডানে শুধু থাকা এজগুলোতে capacity ১, ডান থেকে sink-এ সবাইকে capacity ১। তখন সর্বোচ্চ flow = সর্বোচ্চ matching।

## কোডে দেখি

Python-এ Edmonds-Karp (BFS দিয়ে পথ খোঁজা):

\`\`\`python
from collections import deque

def max_flow(graph, s, t):
    total = 0
    while True:
        parent = [-1] * len(graph)
        parent[s] = s
        q = deque([s])
        while q and parent[t] == -1:
            u = q.popleft()
            for v, cap, rev in graph[u]:
                if cap > 0 and parent[v] == -1:
                    parent[v] = u
                    q.append(v)
        if parent[t] == -1:
            break
        push = 10**18
        v = t
        while v != s:
            u = parent[v]
            for i, (w, cap, rev) in enumerate(graph[u]):
                if w == v:
                    push = min(push, cap)
                    break
            v = u
        v = t
        while v != s:
            u = parent[v]
            for i, (w, cap, rev) in enumerate(graph[u]):
                if w == v:
                    graph[u][i][1] -= push
                    graph[v][rev][1] += push
                    break
            v = u
        total += push
    return total
\`\`\`

C++-তে ছোট bipartite matching (Kuhn):

\`\`\`cpp
vector<int> adj[MAXN];
int matchR[MAXN];
bool seen[MAXN];

bool try_kun(int u) {
    for (int v : adj[u]) {
        if (seen[v]) continue;
        seen[v] = true;
        if (matchR[v] == -1 || try_kun(matchR[v])) {
            matchR[v] = u;
            return true;
        }
    }
    return false;
}

int main() {
    memset(matchR, -1, sizeof matchR);
    int result = 0;
    for (int u = 1; u <= n; u++) {
        memset(seen, 0, sizeof seen);
        if (try_kun(u)) result++;
    }
    cout << result << "\\n";
}
\`\`\`

## ধাপে ধাপে

1. ইনপুট থেকে নোড, এজ আর capacity ধরে গ্রাফ বানান; প্রতিটি এজের সাথে একটা backward residual edge রাখুন।
2. প্রতিটি ধাপে BFS দিয়ে \`s\` থেকে \`t\` পর্যন্ত পথ খুঁজুন (Edmonds-Karp) বা লেভেল বানিয়ে DFS চালান (Dinic)।
3. পাওয়া পথে যত সম্ভব ফ্লো পাঠান — পথের সবচেয়ে কম capacity মাপ।
4. residual গ্রাফ হালনাগাদ করুন (forward কমুন, backward বাড়ুন)।
5. \`s\` থেকে \`t\` আর কোনো পথ না থাকলে এখনকার ফ্লোই সর্বোচ্চ।

## সাধারণ ভুল

- **Capacity-কে flow বলে ফেলা:** একটা এজে একবারে capacity নয়, একাধিকবারও ফ্লো যেতে পারে; তাই প্রতিটি ধাপে বাকি residual capacity মাপা জরুরি।
- **Backward edge রাখা ভুলে যাওয়া:** না রাখলে আগের ভুল ফ্লো ফিরিয়ে আনা যায় না এবং উত্তর ছোট আসে।
- **Undirected ভাবা:** প্রতিটি দিকে capacity আলাদা — দুই দিকে একই capacity দিলে মূল সমস্যার সমাধান নয়।
- **Matching-এ গ্রিডি ধরা:** প্রথমজনকে প্রথম খালি জোড়া দিলে পরেরজন অকেজো হয়ে যেতে পারে; augmenting path না খুঁজলে সর্বোচ্চ ম্যাচিং পাওয়া যায় না।

## চেকলিস্ট

- [ ] Source আর sink ঠিক কোনটা সেটা নিশ্চিত করেছি?
- [ ] প্রতিটি এজের সাথে backward residual edge যোগ করেছি?
- [ ] Flow বা matching-এর ফল ধনাত্মক কিনা, শূন্য পথে শূন্য কিনা পরীক্ষা করেছি?
- [ ] একাধিক এজ বা পাশাপাশি এজ থাকলেও কোড ঠিক কাজ করছে কিনা দেখেছি?
- [ ] সময় সীমা মেনেছে (Python-এ \`O(V * E^2)\` নয়, ছোট গ্রাফে Dinic/ইনপুট-সীমা মিলিয়ে)?

## এবার হাতে-কলমে দেখি

কনসেপ্ট নোট পড়া শেষ হলে দুটো guided সমস্যা দিয়ে শুরু করুন: \`learn-m7-network-flow-g1\` (ছোট গ্রাফে সর্বোচ্চ ফ্লো) আর \`learn-m7-network-flow-g2\` (mentor-শিক্ষার্থী ম্যাচিং)। এরপর practice আর extra সমস্যাগুলো নিজে চেষ্টা করুন।`,
  guidedProblemSlugs: ["learn-m7-network-flow-g1", "learn-m7-network-flow-g2"],
  practiceProblemSlugs: {
    easy: ["learn-m7-network-flow-e1"],
    medium: ["learn-m7-network-flow-m1"],
    hard: ["learn-m7-network-flow-h1"],
  },
  extraProblemSlugs: ["learn-m7-network-flow-x1", "learn-m7-network-flow-x2"],
};
