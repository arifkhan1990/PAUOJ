import type { LessonVisualConfig } from "@/lib/learning/visual-types";

/**
 * Visual configs for module 2 (slug: basic-data-structures).
 * Keys follow the merged `${moduleSlug}/${topicSlug}` convention.
 */
export const module2Visuals: Record<string, LessonVisualConfig> = {
  "basic-data-structures/stack-queue": {
    kind: "stack",
    title: "প্লেটের স্তূপ, ক্যান্টিনের লাইন",
    caption:
      "স্ট্যাকে শেষে ঢোকাটা আগে বেরোয়, আর কিউতে আগে ঢোকাটাই আগে বেরোয়।",
    steps: [
      { label: "push(3)", note: "৩ স্তূপের উপরে বসলো" },
      { label: "push(7)", note: "৭ এখন সবার উপরে" },
      { label: "top() = 7", note: "না তুলে শুধু দেখো" },
      { label: "pop() = 7", note: "শেষে ঢোকাটা আগে বেরোয়, নিচে ৩ রয়ে গেল" },
      { label: "কিউ হলে উল্টো নিয়ম", note: "FIFO — deque-তে দুই পাশেই O(1)" },
    ],
    data: { values: [3, 7], labels: ["3", "7", "5"], variant: "both" },
  },

  "basic-data-structures/linked-list": {
    kind: "linked",
    title: "পয়েন্টারে বাঁধা শৃঙ্খল",
    caption:
      "লিংকড লিস্টে মাঝখানে ঢোকাতে শুধু পয়েন্টার বদলালেই হয়, বাকি সব নড়ে না।",
    steps: [
      { label: "প্রতিটি নোডে দুই জিনিস", note: "নিজের মান আর পরের নোডের ঠিকানা" },
      { label: "head থেকে হাঁটা শুরু", note: "10 → 20 → 30 → NULL" },
      { label: "মাঝে ঢোকাতে একটাই কাজ", note: "আগের নোডের next বদলাও — O(1)" },
      { label: "ক্রমিক অ্যাক্সেস নেই", note: "পঞ্চম নোডে যেতে শুরু থেকে হাঁটো" },
      { label: "আগের নোডটা হাতে রাখো", note: "সংযোগ বদলানোর আগেই নইলে লিস্ট হারায়" },
    ],
    data: { values: [10, 20, 30] },
  },

  "basic-data-structures/hashing": {
    kind: "hash",
    title: "মান থেকে ঘরের ঠিকানা",
    caption:
      "হ্যাশ ফাংশন মানকে সরাসরি ঘরে বসিয়ে দেয়, তাই খোঁজা গড়ে এক ধাপেই শেষ হয়।",
    steps: [
      { label: "hash(x) = x % 5", note: "মান থেকে সরাসরি ঘর নম্বর" },
      { label: "12 বসলো ঘর ২-এ", note: "রাখা এক ধাপে, খোঁজাও এক ধাপে" },
      { label: "25 বসলো ঘর ০-এ", note: "প্রতিটি মান একবারই হিসাব হয়" },
      { label: "37 আবার ঘর ২-এ", note: "১২ আর ৩৭ মিলে গেল — collision" },
      { label: "ঘরে ছোট তালিকা রাখো", note: "chaining — গড় খরচ তবু O(1)" },
    ],
    data: {
      values: [12, 25, 37],
      labels: ["ঘর ০", "ঘর ১", "ঘর ২", "ঘর ৩", "ঘর ৪"],
    },
  },

  "basic-data-structures/stl-collections": {
    kind: "array",
    title: "কাজ বুঝে কনটেইনার বাছো",
    caption:
      "তৈরি কালেকশন কাজ এক লাইনে শেষ করে দেয়, শুধু জানতে হয় কোন সমস্যায় কোনটা।",
    steps: [
      { label: "vector ডাইনামিক অ্যারে", note: "push_back শেষে জায়গা নেয়" },
      { label: "সাজাতে sort", note: "5 2 9 1 7 সেজে 1 2 5 7 9 — O(n log n)" },
      { label: "কাউন্টে Counter বা unordered_map", note: "গড়ে O(1) খোঁজা" },
      { label: "দুই পাশ লাগলে deque", note: "শুরু আর শেষ দুই দিকেই O(1)" },
      { label: "প্রতি ধাপে ছোটটা চাইলে heap", note: "priority_queue — push আর pop O(log n)" },
    ],
    data: { values: [5, 2, 9, 1, 7], variant: "vector" },
  },
};
