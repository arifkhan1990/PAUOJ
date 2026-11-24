import type { LessonVisualConfig } from "@/lib/learning/visual-types";

/**
 * Visual configs for module 3 (slug: basic-intermediate-algorithms).
 * Keys follow the merged `${moduleSlug}/${topicSlug}` convention.
 */
export const module3Visuals: Record<string, LessonVisualConfig> = {
  "basic-intermediate-algorithms/sorting-searching": {
    kind: "sort",
    title: "সাজাও, তারপর অর্ধেক বাদ",
    caption:
      "একবার সাজানো অ্যারেতে বাইনারি সার্চ প্রতি ধাপে অর্ধেক বাদ দিয়ে উত্তরে পৌঁছায়।",
    steps: [
      { label: "আগে সাজাও", note: "9 2 7 1 5 সেজে 1 2 5 7 9 — O(n log n)" },
      { label: "মাঝের মানটা দেখো", note: "৫ ছোট, তাই ৭ বাঁয়ের অংশে নেই" },
      { label: "ডান অর্ধে নামো", note: "৭ ৯ — আবার মাঝেরটা দেখো" },
      { label: "৭ পাওয়া গেল", note: "প্রতি ধাপে অর্ধেক বাদ — O(log n)" },
      { label: "x না থাকলেও একই ছাঁচ", note: "lower_bound দেয় প্রথম >= x এর ঘর" },
    ],
    data: { values: [9, 2, 7, 1, 5] },
  },

  "basic-intermediate-algorithms/two-pointers-sliding-window": {
    kind: "array",
    title: "স্লাইডিং উইন্ডোর হিসাব",
    caption:
      "উইন্ডো এক ঘর সরাতে শুধু একটা মান বাদ, একটা মান যোগ — তাই পুরো অ্যারে O(n)-এ শেষ।",
    steps: [
      { label: "k = ৩ ঘরের উইন্ডো বসাও", note: "প্রথম যোগফল ৩ + ৮ + ১ = ১২" },
      { label: "ডানে এক ঘর সরাও", note: "৩ বাদ, ৬ যোগ — নতুন যোগফল ১৫" },
      { label: "আবার এক ঘর", note: "৮ বাদ, ৪ যোগ — ১১" },
      { label: "প্রতি সরাতেই O(1)", note: "নতুন যোগফল আগেরটা থেকেই আসে" },
      { label: "সর্বোচ্চ উইন্ডো ১৫", note: "দুই পয়েন্টার কখনো পেছনে ফেরে না" },
    ],
    data: { values: [3, 8, 1, 6, 4], variant: "window" },
  },

  "basic-intermediate-algorithms/prefix-sum-difference": {
    kind: "array",
    title: "জমা খাতায় রেঞ্জের যোগফল",
    caption:
      "একবার চলমান যোগফল জমা রাখলে যেকোনো রেঞ্জের উত্তর দুই ঘরের বিয়োগেই বেরোয়।",
    steps: [
      { label: "বাঁ থেকে যোগফল জমা করো", note: "3, 11, 12, 18, 22" },
      { label: "রেঞ্জ ২ থেকে ৪ চাই", note: "৮ + ১ + ৬ = ১৫" },
      { label: "দুই ঘরের বিয়োগেই উত্তর", note: "pref[4] - pref[1] = 18 - 3 = 15" },
      { label: "প্রতি প্রশ্নে O(1)", note: "প্রস্তুতি একবার O(n), তারপর সব প্রশ্ন মুহূর্তে" },
      { label: "রেঞ্জে যোগ দিতে হলে উল্টো ট্রিক", note: "difference array: d[l] += x, d[r+1] -= x" },
    ],
    data: { values: [3, 8, 1, 6, 4], variant: "prefix" },
  },

  "basic-intermediate-algorithms/recursion-backtracking": {
    kind: "tree",
    title: "ছোট প্রশ্নে নেমে উত্তরে ওঠো",
    caption:
      "রিকার্সন প্রতি কলে প্রশ্নটা ছোট করে base case পর্যন্ত নামে, তারপর উত্তর জুড়ে জুড়ে উপরে ওঠে।",
    steps: [
      { label: "বড় প্রশ্নকে ছোট করো", note: "1234 → 234 → 34 → 4" },
      { label: "প্রতি কলে কাজ কমে", note: "এক অঙ্ক কমে যায়" },
      { label: "base case-এ থামো", note: "খালি স্ট্রিং — উত্তর ০" },
      { label: "ফিরতে ফিরতে জোড়া লাগাও", note: "4 + 3 + 2 + 1 = 10" },
      { label: "backtracking একই ছাঁচে", note: "বসাও, যাও, undo করে ফেরাও" },
    ],
    data: {
      labels: [
        "digitSum(1234)",
        "digitSum(234)",
        "digitSum(34)",
        "digitSum(4)",
        "digitSum(খালি) = 0",
      ],
      edges: [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
      ],
      variant: "recursion",
    },
  },

  "basic-intermediate-algorithms/greedy": {
    kind: "flow",
    title: "আগে শেষ হয়, আগে বাছো",
    caption:
      "সবচেয়ে তাড়াতাড়ি শেষ হওয়া কাজ আগে বাছলে বাকি সবাই সবচেয়ে বেশি জায়গা পায়।",
    steps: [
      { label: "শেষ সময় ধরে সাজাও", note: "A(৪), C(৬), D(৯), B(৯)" },
      { label: "A বাছো", note: "সবচেয়ে আগে শেষ — বাকিদের জায়গা খোলা" },
      { label: "C শুরু ৫ > ৪", note: "আগের শেষের পরে — বসে গেল" },
      { label: "D শুরু ৭ > ৬", note: "আবার বসলো — মোট ৩টা কাজ" },
      { label: "B বাদ", note: "A-র সাথে জড়ানো — শেষ ৯ হওয়া যথেষ্ট নয়" },
    ],
    data: {
      labels: ["A: ১-৪", "B: ৩-৯", "C: ৫-৬", "D: ৭-৯"],
      values: [4, 9, 6, 9],
      variant: "intervals",
    },
  },
};
