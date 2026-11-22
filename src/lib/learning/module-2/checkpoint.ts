import type { LearningCheckpointDefinition } from "@/lib/learning/types";

export const module2Checkpoint: LearningCheckpointDefinition = {
  title: "Module 2 Checkpoint",
  titleBn: "মডিউল ২ চেকপয়েন্ট",
  description:
    "৪৫ মিনিটে তিনটি মিশ্র সমস্যা সমাধান করুন। তিনটিই Accepted হলে মডিউলের ব্যাজ আনলক হবে।",
  durationMinutes: 45,
  problemSlugs: ["learn-m2-checkpoint-1","learn-m2-checkpoint-2","learn-m2-checkpoint-3"],
  badge: {
    slug: "module-2-badge",
    name: "Data Structures Builder",
    description: "মডিউল ২-এর চেকপয়েন্টে তিনটি মিশ্র সমস্যা নির্ধারিত ৪৫ মিনিটের মধ্যে সমাধান করেছেন।",
  },
};
