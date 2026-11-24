import type { LearningCheckpointDefinition } from "@/lib/learning/types";

export const dockerCheckpoint: LearningCheckpointDefinition = {
  title: "Docker & CI/CD checkpoint",
  titleBn: "ডকার ও সিআই/সিডি চেকপয়েন্ট",
  description:
    "৪৫ মিনিটে তিনটি মিশন: একটা পাইপলাইন সাজানো, একটা ইমেজের সমস্যা ধরা, আর একটা ইনসিডেন্ট থেকে রোলব্যাক। তিনটিই Accepted হলে Pipeline Pilot ব্যাজ তোমার।",
  durationMinutes: 45,
  problemSlugs: [
    "learn-docker-check-pipeline",
    "learn-docker-check-image",
    "learn-docker-check-incident",
  ],
  badge: {
    slug: "docker-cicd-badge",
    name: "Pipeline Pilot",
    description:
      "ইমেজ বিল্ড, পাইপলাইন আর ইনসিডেন্ট রিকভারির তিনটি মিশন সম্পন্ন করেছ।",
  },
};
