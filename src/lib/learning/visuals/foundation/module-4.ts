import type { LessonVisualConfig } from "@/lib/learning/visual-types";

/**
 * Visual configs for module 4 (slug: trees-graphs).
 * Keys follow the merged `${moduleSlug}/${topicSlug}` convention.
 * For weighted graphs (dijkstra, mst) `data.values[k]` is the weight of
 * `data.edges[k]`, so weights stay aligned with the edge list.
 */
export const module4Visuals: Record<string, LessonVisualConfig> = {
  "trees-graphs/binary-trees-bst": {
    kind: "tree",
    title: "BST-তে প্রতি ধাপে অর্ধেক বাদ",
    caption:
      "BST-এর নিয়মে প্রতি ধাপে একটা সাবট্রি পুরো বাদ যায়, তাই খোঁজা উচ্চতার সমান ধাপে শেষ হয়।",
    steps: [
      { label: "রুট ৮ থেকে শুরু করো", note: "১০ > ৮ — বাম সাবট্রি পুরো বাদ" },
      { label: "১২-এ নামলে আবার অর্ধেক", note: "১০ < ১২ — ডান সাবট্রি বাদ" },
      { label: "১০ পাওয়া গেল", note: "৩ ধাপেই — খরচ O(height)" },
      { label: "বামে সব ছোট, ডানে সব বড়", note: "নিয়মটা পুরো সাবট্রিতে খাটে" },
      { label: "inorder সবসময় সাজানো", note: "2 4 6 8 10 12 14 — BST-র জন্মগত গুণ" },
    ],
    data: {
      labels: ["8", "4", "12", "2", "6", "10", "14"],
      edges: [
        [0, 1],
        [0, 2],
        [1, 3],
        [1, 4],
        [2, 5],
        [2, 6],
      ],
    },
  },

  "trees-graphs/tree-traversals": {
    kind: "tree",
    title: "একই গাছ, চার ক্রম",
    caption:
      "ঘোরার ক্রম বদলালে উত্তর বদলায়, কাজ বদলায় — নোডের সংখ্যা একই থাকে।",
    steps: [
      { label: "preorder: নিজে, বাম, ডান", note: "1 2 4 5 3 6 7 — কাঠামো লেখার ক্রম" },
      { label: "inorder: বাম, নিজে, ডান", note: "4 2 5 1 6 3 7 — BST-তে সাজানো তালিকা" },
      { label: "postorder: বাম, ডান, নিজে", note: "4 5 2 6 7 3 1 — নিচ থেকে হিসাবে" },
      { label: "level order: স্তর ধরে", note: "queue দিয়ে BFS — 1, 2 3, 4 5 6 7" },
    ],
    data: {
      labels: ["1", "2", "3", "4", "5", "6", "7"],
      edges: [
        [0, 1],
        [0, 2],
        [1, 3],
        [1, 4],
        [2, 5],
        [2, 6],
      ],
      variant: "traversal",
    },
  },

  "trees-graphs/heaps-priority-queues": {
    kind: "tree",
    title: "সবচেয়ে ছোটটা রুটে থাকে",
    caption:
      "হিপ পুরো তালিকা সাজিয়ে রাখে না, শুধু রুটের মান নিশ্চিত রাখে — তাই ছোট-বড় খোঁজা সস্তা।",
    steps: [
      { label: "বাবা সন্তানের চেয়ে ছোট", note: "min-heap — রুটে সবচেয়ে ছোট ২" },
      { label: "pop: রুট তুলে শেষের ৭ বসাও", note: "sift-down করে ৫ রুটে ওঠে" },
      { label: "push: শেষে বসিয়ে উপরে তোলো", note: "sift-up — খরচ O(log n)" },
      { label: "peek সবসময় O(1)", note: "রুট দেখলেই সবচেয়ে ছোটটা পাও" },
      { label: "সাজানো তালিকা নয়", note: "পুরো ক্রম চাইলে সবটা এক এক করে তুলতে হয়" },
    ],
    data: {
      labels: ["2", "5", "6", "9", "8", "7"],
      edges: [
        [0, 1],
        [0, 2],
        [1, 3],
        [1, 4],
        [2, 5],
      ],
      variant: "heap",
    },
  },

  "trees-graphs/graph-traversal": {
    kind: "graph",
    title: "স্তরে স্তরে BFS",
    caption:
      "BFS দূরত্ব অনুযায়ী ঢেউয়ের মতো ছড়ায়, তাই নোড প্রথমবার ভিজিট হওয়ার সময়ই তার দূরত্ব ঠিক হয়ে যায়।",
    steps: [
      { label: "সোর্স ১ কিউতে ঢোকাও", note: "দূরত্ব ০ — ভিজিট চিহ্নিত" },
      { label: "স্তর ১: পাশের ২, ৩", note: "কিউ থেকে বেরিয়ে পাশেরা ঢোকে" },
      { label: "স্তর ২: ৪, ৫, ৬", note: "এক স্তর শেষ হলে পরেরটা শুরু" },
      { label: "দূরত্ব প্রথমবারেই ঠিক", note: "ভিজিট হলে কিউতে আর ঢোকে না" },
      { label: "কম্পোনেন্ট গোনো", note: "না-ঘোরা নোড থাকলে বাইরে থেকে আবার চালাও" },
    ],
    data: {
      labels: ["1", "2", "3", "4", "5", "6"],
      edges: [
        [0, 1],
        [0, 2],
        [1, 3],
        [1, 4],
        [2, 5],
      ],
      variant: "bfs",
    },
  },

  "trees-graphs/shortest-paths": {
    kind: "graph",
    title: "সবচেয়ে সস্তা পথ Dijkstra",
    caption:
      "সবচেয়ে কাছের নোড আগে বের করে পাশেদের দূরত্ব আপডেট করলে সবচেয়ে সস্তা পথ নিজে থেকেই সাজে।",
    steps: [
      { label: "S-এ দূরত্ব ০ রাখো", note: "বাকি সবাই অসীম" },
      { label: "সবচেয়ে কাছের A বের করো", note: "S → A = ১ — ছোট দূরত্ব আগে" },
      { label: "A দিয়ে B টেনে নাও", note: "১ + ২ = ৩, আগের ৪-এর চেয়ে কম" },
      { label: "B দিয়ে T পৌঁছাও", note: "৩ + ৩ = ৬ — A সোজা দিলে ৭ হতো" },
      { label: "নেগেটিভ edge এলে নয়", note: "Dijkstra ভুল দেয় — তখন Bellman-Ford" },
    ],
    data: {
      labels: ["S", "A", "B", "T"],
      edges: [
        [0, 1],
        [0, 2],
        [1, 2],
        [1, 3],
        [2, 3],
      ],
      values: [1, 4, 2, 6, 3],
      variant: "dijkstra",
    },
  },

  "trees-graphs/mst-dsu": {
    kind: "graph",
    title: "ছোট edge আগে, সাইকেল বাদ",
    caption:
      "Kruskal ছোট ওজনের edge আগে নেয়, আর DSU ধরে দেয় কোন জোড়া সাইকেল বানাতো।",
    steps: [
      { label: "ওজন ধরে edge সাজাও", note: "২, ৩, ৪, ৫, ৬ — ছোটটা আগে" },
      { label: "ল্যাব ১-২ নাও (২)", note: "দুই দল আলাদা — DSU জোড়া দেয়" },
      { label: "ল্যাব ২-৩ নাও (৩)", note: "সাইকেল নেই — নিশ্চিন্তে নাও" },
      { label: "ল্যাব ৩-৪ নাও (৪)", note: "৩টা edge = n - ১, মোট খরচ ৯" },
      { label: "বাকি edge বাদ", note: "৫ আর ৬ সাইকেল বানাতো — DSU ধরে ফেলে" },
    ],
    data: {
      labels: ["ল্যাব ১", "ল্যাব ২", "ল্যাব ৩", "ল্যাব ৪"],
      edges: [
        [0, 1],
        [1, 2],
        [0, 2],
        [2, 3],
        [1, 3],
      ],
      values: [2, 3, 6, 4, 5],
      variant: "mst",
    },
  },
};
