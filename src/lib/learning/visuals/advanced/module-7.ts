/** Visual configs for core module 7: advanced algorithms. */

import type { LessonVisualConfig } from "@/lib/learning/visual-types";

export const MODULE_7_VISUALS: Record<string, LessonVisualConfig> = {
  "advanced-algorithms/string-matching": {
    kind: "string",
    title: "KMP প্রিফিক্স টেবিল",
    caption: "মিল ভাঙলেও আগে মেলানো অংশের জানা pi-টেবিলে থাকে, তাই টেক্সট পিছনে না ফিরেই সার্চ সরল পদ্ধতির চেয়ে অনেক দ্রুত শেষ হয়।",
    steps: [
      { label: "naive-তে প্রতি শুরুতে শূন্য থেকে মেলাও", note: "একই অক্ষর বারবার মিলতে হয়" },
      { label: "pi-টেবিল আগে বানাও", note: "pi[i] = অংশের সবচেয়ে লম্বা বর্ডারের দৈর্ঘ্য" },
      { label: "মিল ভাঙলে pi ধরে লাফ দাও", note: "ababab-এ pi = 0 0 1 2 3 4" },
      { label: "টেক্সট কখনো পিছনে যায় না দেখো", note: "প্যাটার্ন সরে সরে মেলে" },
      { label: "Rabin-Karp-এ rolling hash টানো", note: "hash মিললেও কলিশন যাচাই করো" },
    ],
    data: {
      labels: ["ababxababab", "ababab"],
      values: [0, 0, 1, 2, 3, 4],
      variant: "kmp",
    },
  },
  "advanced-algorithms/network-flow": {
    kind: "graph",
    title: "পাইপে সর্বোচ্চ পানি",
    caption: "residual গ্রাফে source থেকে sink পর্যন্ত পথ মেলা মাত্র ফ্লো বাড়ে, আর পথ শেষ হলে যে মান দাঁড়ায় সেটাই min cut।",
    steps: [
      { label: "এজে capacity বসাও", note: "সোর্স ১ থেকে সিঙ্ক ৪ পর্যন্ত" },
      { label: "augmenting path খুঁজো", note: "বাকি জায়গার পথ s থেকে t" },
      { label: "সবচেয়ে সরু এজ পর্যন্ত পাঠাও", note: "প্রতিটি পথে ফ্লো বাড়ে" },
      { label: "পেছনের এজে ভুল সংশোধন করো", note: "residual-এ ওল্টা দিক খোলা থাকে" },
      { label: "পথ না মিললেই max flow", note: "উদাহরণে মোট ৫ ইউনিট" },
    ],
    data: {
      labels: ["সোর্স ১", "নোড ২", "নোড ৩", "সিঙ্ক ৪"],
      edges: [[0, 1], [0, 2], [1, 3], [2, 3], [1, 2]],
      values: [3, 2, 2, 4, 1],
      variant: "flow",
    },
  },
  "advanced-algorithms/advanced-number-theory": {
    kind: "flow",
    title: "বিটে ঘাত ভাঙা",
    caption: "প্রতি ধাপে বর্গ করে বিট ১ হলে ফলে গুণ করলে বিশাল ঘাতও log b ধাপে হয়, আর প্রতি ধাপে মডিউল নিলে সংখ্যা ছোটই থাকে।",
    steps: [
      { label: "ঘাতের সংখ্যাকে বিটে ভাঙো", note: "১৩ বাইনারিতে ১১০১" },
      { label: "প্রতি ধাপে base বর্গ করো", note: "a^1, a^2, a^4, a^8, a^16" },
      { label: "বিট ১ হলে result-এ গুণ করো", note: "৮ + ৪ + ১ = ১৩" },
      { label: "প্রতি গুণে মডিউল নাও", note: "সংখ্যা ছোট, overflow নেই" },
      { label: "ম্যাট্রিক্স ঘাতে ধারা টানো", note: "ফিবোনাচি ২x২ ম্যাট্রিক্সের ঘাতে" },
    ],
    data: {
      labels: ["a^1", "a^2", "a^4", "a^8", "a^16"],
      values: [1, 2, 4, 8, 16],
      variant: "modular",
    },
  },
  "advanced-algorithms/game-theory": {
    kind: "array",
    title: "জেতা-হারার অবস্থা",
    caption: "যে অবস্থা থেকে হারার অবস্থায় যাওয়া যায় সেটাই জেতার অবস্থা, আর Nim-এ সব পাইলের XOR শূন্য হলে প্রথম খেলোয়াড় হারে।",
    steps: [
      { label: "শেষ অবস্থা আগে ঠিক করো", note: "০ পাথর মানে হারার অবস্থা" },
      { label: "হারানোর অবস্থায় যাওয়ার চাল খোঁজো", note: "১ বা ২ পাথরের খেলায় ৩-এর গুণিতক L" },
      { label: "সব পথ জেতার হলে ঘরটা L ধরো", note: "যেকোনো চালেই প্রতিপক্ষ জেতে" },
      { label: "Nim-এ সব পাইলের XOR দেখো", note: "শূন্য হলে দ্বিতীয় খেলোয়াড় জেতে" },
      { label: "ভাঙা খেলায় Grundy বানাও", note: "g(x) = পার হওয়া অবস্থাগুলোর mex" },
    ],
    data: {
      labels: ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮"],
      values: [0, 1, 1, 0, 1, 1, 0, 1, 1],
      variant: "nim",
    },
  },
};
