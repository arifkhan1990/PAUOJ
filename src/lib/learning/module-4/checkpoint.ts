import type { LearningCheckpointDefinition } from "@/lib/learning/types";

export const module4Checkpoint: LearningCheckpointDefinition = {
  title: "Module 4 Checkpoint",
  titleBn: "মডিউল 4 চেকপয়েন্ট",
  description:
    "৪৫ মিনিটে তিনটি মিশ্র সমস্যা সমাধান করো। তিনটিই Accepted হলে মডিউলের ব্যাজ আনলক হবে।",
  durationMinutes: 45,
  problemSlugs: ["learn-m4-checkpoint-1","learn-m4-checkpoint-2","learn-m4-checkpoint-3"],
  badge: {
    slug: "module-4-badge",
    name: "Module 4 Finisher",
    description: "মডিউল 4-এর চেকপয়েন্টে তিনটি সমস্যা নির্ধারিত সময়ের মধ্যে সমাধান করেছ।",
  },
};
