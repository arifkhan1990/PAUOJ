import type { LearningCheckpointDefinition } from "@/lib/learning/types";

export const module7Checkpoint: LearningCheckpointDefinition = {
  title: "Module 7 Checkpoint",
  titleBn: "মডিউল 7 চেকপয়েন্ট",
  description:
    "৪৫ মিনিটে তিনটি মিশ্র সমস্যা সমাধান করো। তিনটিই Accepted হলে মডিউলের ব্যাজ আনলক হবে।",
  durationMinutes: 45,
  problemSlugs: ["learn-m7-checkpoint-1","learn-m7-checkpoint-2","learn-m7-checkpoint-3"],
  badge: {
    slug: "module-7-badge",
    name: "Module 7 Finisher",
    description: "মডিউল 7-এর চেকপয়েন্টে তিনটি সমস্যা নির্ধারিত সময়ের মধ্যে সমাধান করেছ।",
  },
};
