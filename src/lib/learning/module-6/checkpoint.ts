import type { LearningCheckpointDefinition } from "@/lib/learning/types";

export const module6Checkpoint: LearningCheckpointDefinition = {
  title: "Module 6 Checkpoint",
  titleBn: "মডিউল 6 চেকপয়েন্ট",
  description:
    "৪৫ মিনিটে তিনটি মিশ্র সমস্যা সমাধান করুন। তিনটিই Accepted হলে মডিউলের ব্যাজ আনলক হবে।",
  durationMinutes: 45,
  problemSlugs: ["learn-m6-checkpoint-1","learn-m6-checkpoint-2","learn-m6-checkpoint-3"],
  badge: {
    slug: "module-6-badge",
    name: "Module 6 Finisher",
    description: "মডিউল 6-এর চেকপয়েন্টে তিনটি সমস্যা নির্ধারিত সময়ের মধ্যে সমাধান করেছেন।",
  },
};
