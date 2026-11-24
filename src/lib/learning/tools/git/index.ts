import type { LearningModuleDefinition } from "@/lib/learning/types";

import { branchesTopic } from "./branches";
import { collaborationTopic } from "./collaboration";
import { gitCheckpoint } from "./checkpoint";
import { snapshotsTopic } from "./snapshots";

export const gitGithubModule: LearningModuleDefinition = {
  slug: "git-github",
  order: 10,
  title: "Git & GitHub",
  subtitle: "কোডের ইতিহাস, টিমওয়ার্ক আর রিলিজের প্রথম হাতেখড়ি",
  goal: "Ship code on a real product team from day one: clean history, reviewed pull requests, safe recovery from mistakes and tagged releases.",
  description:
    "জুনিয়র ডেভেলপার নুসরাত পড়াঘর অ্যাপের ছোট টিমে যোগ দিয়েছে—মেন্টর মাহিনের রিভিউ আর দৈনিক স্ট্যান্ডআপের ভিতর দিয়ে তার প্রতিদিন গড়ে ওঠে। প্রথম commit আর পরিষ্কার ইতিহাস থেকে শুরু করে branch, pull request, merge conflict—শেষে প্রোডাকশন hotfix, reflog-এ হিস্ট্রি উদ্ধার আর v1.4.0 রিলিজ ট্যাগ, গল্পটা এগোয় আসল অফিসের মতোই। শেষে ৪৫ মিনিটের চেকপয়েন্টে অপেক্ষা করছে Release Captain ব্যাজ।",
  estimatedHours: 10,
  status: "LIVE",
  track: "tools",
  practiceTier: "WORKSHOP",
  diagram: {
    src: "/learning/git-github.svg",
    alt: "তিন ধাপের ম্যাপ: প্রথমে snapshot আর commit ইতিহাস, দ্বিতীয়তে branch আর pull request, তৃতীয়তে টিম কোলাবোরেশন, নিরাপদ উদ্ধার আর রিলিজ।",
  },
  topics: [snapshotsTopic, branchesTopic, collaborationTopic],
  checkpoint: gitCheckpoint,
};
