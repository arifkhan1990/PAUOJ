import type { LearningModuleDefinition } from "@/lib/learning/types";

import { dockerCheckpoint } from "./checkpoint";
import { containersTopic } from "./containers-topic";
import { composeProductionTopic } from "./compose-topic";
import { pipelinesTopic } from "./pipelines-topic";

/**
 * Free career-toolkit module (track "tools"): the নুসরাত story continues as
 * she owns her team's deploy path — from "works on my machine" to containers,
 * Compose, production images, CI pipelines and a pressure-cooker rollback.
 */
export const dockerCicdModule: LearningModuleDefinition = {
  slug: "docker-cicd",
  order: 11,
  title: "Docker & CI/CD",
  subtitle: "কনটেইনারে প্যাক করো, পাইপলাইনে যাচাই করো, নিরাপদে শিপ করো",
  goal: "Build software once into a portable image, ship it through an automated pipeline, and operate it in production with healthchecks and fast rollbacks.",
  description:
    "নুসরাত এখন টিমের রিলিজ-পথের মালিক, মাহিন তার মেন্টর, তাসনিম চায় দ্রুত রিলিজ। 'আমার মেশিনে তো চলছিল' ব্যথা থেকে শুরু করে প্রথম Dockerfile, ৯০০MB ইমেজ ছোট করা, leaked .env-এর রাত, flaky healthcheck আর প্রথম CI পাইপলাইন—শেষ দৃশ্যে চাপের মধ্যে একটা ব্যর্থ deploy রোলব্যাক করা। প্রতিটা টপিক বাস্তব কমান্ড, YAML আর নিরাপত্তা-অভ্যাস দিয়ে সাজানো।",
  estimatedHours: 12,
  status: "LIVE",
  track: "tools",
  practiceTier: "WORKSHOP",
  diagram: {
    src: "/learning/docker-cicd.svg",
    alt: "ডকার ও সিআই/সিডি মডিউলের তিন ধাপের মানচিত্র: কনটেইনার ও ইমেজ, এরপর কম্পোজ ও প্রোডাকশন ইমেজ, শেষে সিআই/সিডি পাইপলাইন ও ইনসিডেন্ট।",
  },
  topics: [containersTopic, composeProductionTopic, pipelinesTopic],
  checkpoint: dockerCheckpoint,
};
