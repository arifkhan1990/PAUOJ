import type { LearningCheckpointDefinition } from "@/lib/learning/types";

export const module3Checkpoint: LearningCheckpointDefinition = {
  title: "Module 3 Checkpoint",
  titleBn: "মডিউল 3 চেকপয়েন্ট",
  description:
    "৪৫ মিনিটে তিনটি মিশ্র সমস্যা সমাধান করুন। তিনটিই Accepted হলে মডিউলের ব্যাজ আনলক হবে।",
  durationMinutes: 45,
  problemSlugs: ["learn-m3-checkpoint-1","learn-m3-checkpoint-2","learn-m3-checkpoint-3"],
  badge: {
    slug: "module-3-badge",
    name: "Module 3 Finisher",
    description: "মডিউল 3-এর চেকপয়েন্টে তিনটি সমস্যা নির্ধারিত সময়ের মধ্যে সমাধান করেছেন।",
  },
};
