import type { LearningCheckpointDefinition } from "@/lib/learning/types";

export const gitCheckpoint: LearningCheckpointDefinition = {
  title: "Git & GitHub checkpoint",
  titleBn: "গিট ও গিটহাব চেকপয়েন্ট",
  description:
    "নুসরাতের আসনে বসে তিনটি মিশন সামলাও—শুক্রবারের হটফিক্স, রিলিজ ট্যাগ আর হারানো হিস্ট্রির উদ্ধার। ৪৫ মিনিটে তিনটি ড্রিল সমাধান করে প্রমাণ করো: staging থেকে revert, reflog আর রিলিজ—সবই তোমার আয়ত্তে।",
  durationMinutes: 45,
  problemSlugs: [
    "learn-git-check-hotfix",
    "learn-git-check-release",
    "learn-git-check-recovery",
  ],
  badge: {
    slug: "git-github-badge",
    name: "Release Captain",
    description: "হটফিক্স, রিলিজ আর হিস্ট্রি উদ্ধারের তিনটি মিশন সম্পন্ন করেছ।",
  },
};
