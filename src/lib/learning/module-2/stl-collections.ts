import type { LearningTopicDefinition } from "@/lib/learning/types";

export const stlCollectionsTopic: LearningTopicDefinition = {
  slug: "stl-collections",
  title: "STL / Collections Framework",
  titleBn: "STL ও কালেকশন",
  summary: "C++ STL, Python collections আর Java Collections-এর দরকারি অংশ।",
  concept: `রফি প্রথমদিকে প্রতিটা সমস্যায় নিজের হাতে তালিকা বানাত, সাজাত, খোঁজার জন্য লুপ লিখত। এক সপ্তাহে সে বুঝল প্রায় প্রতিটি ভাষায় সেই কাজগুলোর জন্য আগে থেকেই তৈরি কালেকশন আছে — C++-এ STL, Python-এ \`collections\` মডিউল, Java-এ Collections Framework। তাই মূল দক্ষতা হলো নতুন কালেকশন আবিষ্কার করা নয়, বরং কোন সমস্যায় কোনটা বেছে নেওয়া। সাজানো চাইলে \`set\` বা \`sort\`, কাউন্ট চাইলে \`map\`/\`Counter\`, দুই পাশ থেকে কাজ চাইলে \`deque\`, ছোট থেকে বড় বের করতে \`priority_queue\` — এই নোটে এই চারটা পরিবারের দরকারি অংশ দেখা যাবে।

## কেন দরকার

নিজের হাতে লেখা তালিকায় সাজানোর জন্য তুমি নিজেই bubble sort লিখবে, খোঁজার জন্য লুপ, কাউন্ট করার জন্য আরেক লুপ — একটা সমস্যায় তিনচার ধাপ বাড়িয়ে, আর প্রতিটাতে ভুলের সুযোগ। তৈরি কালেকশন ব্যবহার করলে কাজটা এক লাইনে হয়, সময় গ্যারান্টি পায় (উদাহরণ \`sort\` সবসময় \`O(n \log n)\`), আর বড় ইনপুটেও টিকে থাকে। প্রতিযোগিতামূলক প্রোগ্রামিংয়ে সময় শুধু অ্যালগরিদম থেকে আসে না — ভুল ডাটা স্ট্রাকচার বাছাই করলে একই অ্যালগরিদম ধীর হয়ে যায়। তাই ভাষার কালেকশনগুলো চেনা টপিকেরই অংশ।

## মূল ধারণা

সব কালেকশনকে তিন ধরনে ভাগ করা যায়: ধারাবাহিক (sequence) — যেমন Python-এর \`list\`, C++-এর \`vector\` ও \`deque\`, Java-এর \`ArrayList\`; অনুসন্ধানযোগ্য (associative) — \`set\`, \`map\` (কী-মান ম্যাপ), যেখানে key দিয়ে সরাসরি খোঁজা যায়; আর অ্যাডাপ্টার — যেমন \`stack\`, \`queue\`, \`priority_queue\`, যারা নিচের কালেকশন ঘুরিয়ে নিজের নিয়ম বানায়। কাজের হিসাব এক নজরে:

| কাজ | Python | C++ | Java | সময় |
| --- | --- | --- | --- | --- |
| সাজানো | \`sorted(a)\` | \`sort(v.begin(), v.end())\` | \`Collections.sort(list)\` | \`O(n \log n)\` |
| আলাদা মান রাখা | \`set(a)\` | \`unordered_set\` | \`HashSet\` | গড় \`O(n)\` |
| key-value হিসাব | \`Counter\` / \`dict\` | \`unordered_map\` | \`HashMap\` | গড় \`O(1)\` |
| ক্রমযুক্ত key | \`sorted(d)\` | \`map\` (\`O(\log n)\`) | \`TreeMap\` | \`O(\log n)\` |
| দুই পাশে কাজ | \`deque\` | \`deque\` | \`ArrayDeque\` | \`O(1)\` |
| সবচেয়ে ছোট/বড় | \`heapq\` | \`priority_queue\` | \`PriorityQueue\` | push/pop \`O(\log n)\` |
| স্ট্যাক/কিউ | \`list\` / \`deque\` | \`stack\` / \`queue\` | \`Deque\` | \`O(1)\` |

মনে রাখার নিয়ম সহজ: সাজাতে হলে সরাসরি \`sort\`; দ্রুত খুঁজতে হলে hash-ভিত্তিক \`set\`/\`map\`; key-র ক্রমও লাগবে হলে tree-ভিত্তিক \`map\`; প্রতিটি ধাপে সবচেয়ে ছোটটা দরকার হলে হিপ। ভাষা বদলালেও ধারণাটা এক — শুধু নাম বদলায়:

\`\`\`
  Python            C++                 Java
  ----------------  ------------------  ------------------
  list              vector / list       ArrayList
  deque             deque               ArrayDeque
  set               unordered_set       HashSet
  dict / Counter    unordered_map       HashMap
  heapq             priority_queue      PriorityQueue
\`\`\`

চিত্র: একই কালেকশন তিন ভাষায় — নাম বদলায়, ধারণা থাকে এক।

## কোডে দেখি

শব্দ সাজানো সমস্যা — কাউন্ট করে, তারপর বিপরীত ক্রমে, সমান হলে বর্ণানুক্রমে:

\`\`\`python
import sys
from collections import Counter

data = sys.stdin.read().split()
n = int(data[0])
words = data[1:]
freq = Counter(words)
ordered = sorted(freq, key=lambda w: (-freq[w], w))
for word in ordered:
    print(word)
\`\`\`

একই ধারণা C++ STL-এ — \`map\` key সাজিয়ে রাখে, আর কাউন্টার \`++\` দিয়ে এক ধাপে বাড়ে:

\`\`\`cpp
#include <iostream>
#include <map>
#include <string>
using namespace std;

int main() {
    int n;
    cin >> n;
    map<string, int> freq;
    for (int i = 0; i < n; i++) {
        string word;
        cin >> word;
        freq[word]++;
    }
    for (auto &entry : freq) {
        cout << entry.first << " " << entry.second << "\\n";
    }
    return 0;
}
\`\`\`

দুই পাশ থেকে কাজের \`deque\` আর হিপের মূল কথা:

\`\`\`python
from collections import deque
from heapq import heappush, heappop

line = deque()          # বাঁয়েও pop, ডানেও pop
line.appendleft(5)      # সামনে যোগ
line.append(7)          # শেষে যোগ

heap = []
heappush(heap, 12)      # ছোট থেকে বড় বের হয়
print(heappop(heap))    # -> 12
\`\`\`

## ধাপে ধাপে

1. সমস্যাটা পড়ে ঠিক করো — ক্রম লাগবে, শুধু খোঁজা লাগবে, নাকি প্রতিটি ধাপে সবচেয়ে ছোটটা বা বড়টা লাগবে?
2. সঠিক কালেকশন বেছে নাও এবং তার নাম মুখস্থ রাখো (Python-এ \`Counter\`, \`deque\`, \`heapq\`; C++-এ \`unordered_map\`, \`priority_queue\`)।
3. ইনপুট একবারে ঢোকাও — এক লুপে কালেকশন ভরা।
4. প্রয়োজন হলে ফল \`sorted()\`/\`sort()\` দিয়ে সাজাও; ক্রম নির্দিষ্ট করাটাই সবচেয়ে বেশি মনে রাখার মতো বিষয়।
5. সময় হিসাব করো: প্রতিটি উপাদান কয়বার কাজ করছে, আর শেষে সাজানো কত খরচ দিল?
6. সীমার সর্বোচ্চ ইনপুট দিয়ে চেষ্টা করো — কালেকশন বেছে নেওয়ার দ্রুততাই সেখানে প্রমাণিত হয়।

## সাধারণ ভুল

- \`d[key]\` দিয়ে নতুন key খোঁজা — Python-এ \`KeyError\`, C++ \`unordered_map\`-এ চুপচাপ নতুন ঘর তৈরি হয়। \`get(key, 0)\` বা \`count(key)\` নাও।
- \`for x in dict\`-এ ক্রম ধরে নেওয়া — ম্যাপ ক্রম দেয় না; উত্তর ছাপার আগে \`sorted\` করা বাধ্যতামূলক।
- \`a.sort()\` করেও ফল বসানো হয়নি — \`sort()\` তালিকাটার নিজের জায়গায় সাজায়, কিন্তু যে তালিকা ঘুরাচ্ছিল সেটা এখনো আগের ক্রমেই থাকে; সাজানো তালিকাটাই ঘোরাও।
- ভুল কালেকশন বেছে নেওয়া: ক্রম লাগলেও \`set\` নিলে পরে আবার সাজাতে \`O(n \log n)\` লাগবে — একবারেই ঠিকটা বেছে নাও।
- লুপের ভিতরে কালেকশন পরিবর্তন করা (মুছে দেওয়া বা নতুন যোগ) — Python-এ রান্টাইম এরর; আগে key তালিকায় নিয়ে পরে কাজ করো।

## চেকলিস্ট

- [ ] কালেকশনটা সমস্যার সাথে মেলে — ক্রম, খোঁজা, নাকি সেরা/সবচেয়ে ছোট দরকার?
- [ ] উত্তরের ক্রম নির্দিষ্ট করেছ (\`sorted\`, key বা তুলনা ফাংশন)?
- [ ] নতুন key-তে ধরার জন্য \`get\`/\`count\` ব্যবহার করছ?
- [ ] সময় হিসাব করেছ — \`O(n^2)\` লুপ তো বাকি নেই?
- [ ] সীমার সর্বোচ্চ \`n = 200000\` দিয়ে একবার চেষ্টা করেছ?
- [ ] একই কাজ আরেক জায়গায় লিখছিলে কি আগে থেকেই থাকা কালেকশন বা ইউটিল দেখেছ?

## এবার হাতে-কলমে দেখি

গাইডেড সমস্যা দুটো \`learn-m2-stl-collections-g1\` (সাজিয়ে আলাদা করা) আর \`learn-m2-stl-collections-g2\` (সেট দিয়ে সদস্যতা যাচাই) দিয়ে শুরু করো। এরপর easy, medium আর extra সমস্যাগুলো নিজে চেষ্টা করো।`,
  guidedProblemSlugs: ["learn-m2-stl-collections-g1","learn-m2-stl-collections-g2"],
  practiceProblemSlugs: {
    easy: ["learn-m2-stl-collections-e1", "learn-m2-stl-collections-e2", "learn-m2-stl-collections-e3"],
    medium: ["learn-m2-stl-collections-m1", "learn-m2-stl-collections-m2", "learn-m2-stl-collections-m3"],
    hard: ["learn-m2-stl-collections-h1", "learn-m2-stl-collections-h2"],
  },
  extraProblemSlugs: ["learn-m2-stl-collections-x1","learn-m2-stl-collections-x2"],
};
