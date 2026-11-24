import type { LearningModuleDefinition } from "@/lib/learning/types";
import { module5Checkpoint, module5Topics } from "../module-5";

export const module5: LearningModuleDefinition = {
  slug: "dynamic-programming",
  order: 5,
  title: "Dynamic Programming",
  subtitle: "বড় সমস্যাকে ছোট অংশে ভাগ করা",
  goal: "Recognise overlapping subproblems and implement memoisation and tabulation.",
  description: "ফিবোনাচি থেকে knapsack, LCS, LIS, tree DP আর bitmask DP—DP-এর প্যাটার্নগুলো ধাপে ধাপে।",
  estimatedHours: 26,
  status: "LIVE",
  practiceTier: "FULL",
  diagram: {
    src: "/learning/module-5.svg",
    alt: "মডিউল ৫-এর শেখার ধারা: স্টেট ও ট্রানজিশন, মেমোইজেশন ও ট্যাবুলেশন, তারপর knapsack, LCS/LIS এবং ট্রি/বিটমাস্ক DP।",
  },
  topics: module5Topics,
  checkpoint: module5Checkpoint,
};
