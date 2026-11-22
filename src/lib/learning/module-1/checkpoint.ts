import type { LearningCheckpointDefinition } from "@/lib/learning/types";

export const module1Checkpoint: LearningCheckpointDefinition = {
  title: "Module 1 Checkpoint",
  titleBn: "মডিউল ১ চেকপয়েন্ট",
  description:
    "৪৫ মিনিটে তিনটি মিশ্র সমস্যা সমাধান করুন। তিনটিই Accepted হলে Foundation Badge আনলক হবে।",
  durationMinutes: 45,
  problemSlugs: [
    "learn-m1-checkpoint-campus-queue",
    "learn-m1-checkpoint-prime-gap",
    "learn-m1-checkpoint-bit-parity",
  ],
  badge: {
    slug: "foundation-coder",
    name: "Foundation Coder",
    description:
      "মডিউল ১-এর চেকপয়েন্টে তিনটি সমস্যা নির্ধারিত সময়ের মধ্যে সমাধান করেছেন।",
  },
};
