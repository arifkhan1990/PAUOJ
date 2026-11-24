import type { LessonVisualConfig } from "@/lib/learning/visual-types";

/**
 * Visual configs for module 1 (slug: basic-programming-math).
 * Keys follow the merged `${moduleSlug}/${topicSlug}` convention.
 */
export const module1Visuals: Record<string, LessonVisualConfig> = {
  "basic-programming-math/io-loops-conditionals": {
    kind: "flow",
    title: "ইনপুট, লুপ আর সিদ্ধান্তের পথ",
    caption:
      "প্রোগ্রাম ইনপুট নিয়ে লুপে ঘুরে শর্ত দেখে সিদ্ধান্ত নেয়, শেষে ফল লুপের বাইরে ছাপায়।",
    steps: [
      { label: "ইনপুট নাও", note: "সংখ্যাগুলো int-এ বদলে নাও" },
      { label: "লুপ চালাও n বার", note: "প্রতিটা দাম এক এক করে ঘোরে" },
      { label: "যোগ করো total-এ", note: "লুপের ভিতরে হিসাব জমতে থাকে" },
      { label: "শর্ত দেখো: জোড় কিনা", note: "দাম % 2 == 0 হলে even_count++" },
      { label: "ফল বাইরে ছাপাও", note: "দামগুলো 5 8 3 6 2 — মোট ২৪, জোড় ৩টা" },
    ],
    data: {
      labels: ["ইনপুট", "লুপ", "যোগ করো", "জোড়?", "ছাপাও"],
      values: [5, 8, 3, 6, 2],
    },
  },

  "basic-programming-math/complexity": {
    kind: "complexity",
    title: "কাজ বাড়ে যে হারে",
    caption:
      "ইনপুট n বাড়লে ধাপ কত দ্রুত বাড়ে, সেই হারই কোডের আসল খরচ ঠিক করে।",
    steps: [
      { label: "n = ৮ ধরে ধাপ গোনো", note: "O(1) তে মাত্র ১ ধাপ, O(log n) এ ৩ ধাপ" },
      { label: "একটা লুপ মানে O(n)", note: "৮টা ঘর, ৮টা ধাপ" },
      { label: "সাজানো মানে O(n log n)", note: "৮ × ৩ = ২৪টা ধাপ" },
      { label: "দুই নেস্টেড লুপ O(n^2)", note: "৮ × ৮ = ৬৪টা ধাপ" },
      { label: "n বাড়লে ফারাক বিশাল", note: "n = ১০^৫ হলে n^2 মানে ১০০০ কোটি ধাপ" },
    ],
    data: {
      labels: ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n^2)"],
      values: [1, 3, 8, 24, 64],
    },
  },

  "basic-programming-math/basic-math": {
    kind: "flow",
    title: "ভাগশেষে GCD খোঁজো",
    caption:
      "Euclid-এর নিয়মে প্রতি ধাপে সংখ্যা ছোট হয়, তাই GCD বের হয় মাত্র কয়েকটা ভাগে।",
    steps: [
      { label: "দুই সংখ্যা নাও", note: "৪৮ আর ১৮" },
      { label: "ভাগশেষ নিয়ে ছোট করো", note: "gcd(48, 18) এর পরে gcd(18, 12)" },
      { label: "আবার ভাগশেষ", note: "gcd(18, 12) এর পরে gcd(12, 6)" },
      { label: "শূন্য হলে থামো", note: "gcd(6, 0) — উত্তর ৬" },
      { label: "LCM এক ফর্মুলায়", note: "48 / 6 × 18 = 144" },
    ],
    data: {
      labels: ["gcd(48, 18)", "gcd(18, 12)", "gcd(12, 6)", "gcd(6, 0) = 6"],
      values: [48, 18],
      variant: "gcd",
    },
  },

  "basic-programming-math/bit-manipulation": {
    kind: "bits",
    title: "সংখ্যার ভেতরের বিট",
    caption:
      "প্রতিটি সংখ্যা বিটের একটা সারি, আর AND, OR, XOR ওই সারির ঘরে ঘরে কাজ করে।",
    steps: [
      { label: "১৩ মানে ১১০১", note: "৮ + ৪ + ১ — পজিশন ৩ থেকে ০" },
      { label: "৭ মানে ০১১১", note: "৪ + ২ + ১" },
      { label: "AND: দুই পাশেই 1 হলে", note: "1101 & 0111 = 0101" },
      { label: "OR: অন্তত এক পাশে 1", note: "1101 | 0111 = 1111" },
      { label: "XOR: দুই পাশ ভিন্ন হলে", note: "1101 ^ 0111 = 1010 — দশমিকে ১০" },
    ],
    data: {
      labels: ["1101", "0111"],
      values: [13, 7],
    },
  },

  "basic-programming-math/strings-arrays": {
    kind: "array",
    title: "ঘর ধরে ডাটা সাজাও",
    caption:
      "ইনডেক্স ০ থেকে গোনা শুরু হয়, আর সারি-কলাম ধরে ভাগ করলে যেকোনো গ্রিড সহজ হয়।",
    steps: [
      { label: "গোনা শুরু শূন্য থেকে", note: "দৈর্ঘ্য ৫ হলে শেষ ইনডেক্স ৪" },
      { label: "প্রতিটি ঘর একবার ঘোরো", note: "যোগফল বা সর্বোচ্চ বের করা O(n)-এ" },
      { label: "স্লাইসিং s[1:4]", note: "ইনডেক্স ১, ২, ৩ — শেষের ৪ ধরা হয় না" },
      { label: "২ডি অ্যারেতে সারি আগে", note: "grid[i][j] — i সারি, j কলাম" },
      { label: "অংশের যোগফল বারবার লাগলে", note: "প্রিফিক্স সাম বানালে প্রতি প্রশ্ন O(1)" },
    ],
    data: { values: [3, 8, 1, 6, 4] },
  },
};
