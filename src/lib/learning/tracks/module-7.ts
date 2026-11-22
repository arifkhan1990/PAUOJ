import type { LearningModuleDefinition } from "@/lib/learning/types";
import { module7Checkpoint, module7Topics } from "../module-7";

export const module7: LearningModuleDefinition = {
  slug: "advanced-algorithms",
  order: 7,
  title: "Advanced Algorithms",
  subtitle: "কম্পিটিটিভ ট্র্যাকের অ্যাডভান্সড টুল",
  goal: "Handle string matching, flows, advanced number theory and game theory.",
  description: "KMP, Z-algorithm, Rabin-Karp, network flow, bipartite matching, Euler's totient, matrix exponentiation আর Nim/Grundy।",
  estimatedHours: 26,
  status: "LIVE",
  practiceTier: "FULL",
  diagram: {
    src: "/learning/module-7.svg",
    alt: "মডিউল ৭-এর শেখার ধারা: স্ট্রিং ম্যাচিং, নেটওয়ার্ক ফ্লো ও ম্যাচিং, নাম্বার থিওরি এবং গেম থিওরি (Nim/Grundy)।",
  },
  topics: module7Topics,
  checkpoint: module7Checkpoint,
};
