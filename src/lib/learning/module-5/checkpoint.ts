import type { LearningCheckpointDefinition } from "@/lib/learning/types";

export const module5Checkpoint: LearningCheckpointDefinition = {
  title: "Module 5 Checkpoint",
  titleBn: "মডিউল 5 চেকপয়েন্ট",
  description:
    "৪৫ মিনিটে তিনটি মিশ্র সমস্যা সমাধান করো। তিনটিই Accepted হলে মডিউলের ব্যাজ আনলক হবে।",
  durationMinutes: 45,
  problemSlugs: ["learn-m5-checkpoint-1","learn-m5-checkpoint-2","learn-m5-checkpoint-3"],
  badge: {
    slug: "module-5-badge",
    name: "Module 5 Finisher",
    description: "মডিউল 5-এর চেকপয়েন্টে তিনটি সমস্যা নির্ধারিত সময়ের মধ্যে সমাধান করেছ।",
  },
};
