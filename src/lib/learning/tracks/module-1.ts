import type { LearningModuleDefinition } from "@/lib/learning/types";
import { module1Checkpoint, module1Topics } from "../module-1";

export const module1: LearningModuleDefinition = {
  slug: "basic-programming-math",
  order: 1,
  title: "Basic Programming & Math",
  subtitle: "শুরুর ধাপ: কোডিং, লজিক আর গণিত",
  goal: "Build coding syntax, logical thinking and a first mental model of complexity.",
  description:
    "ইনপুট-আউটপুট, লুপ, শর্ত, Big-O, মৌলিক গণিত, বিট আর অ্যারে—প্রথম মডিউলে আপনার কোডিংয়ের ভিত তৈরি হবে। প্রতিটি টপিকে ছোট গল্প, কনসেপ্ট নোট, হাতে-কলমে সমস্যা আর নিজে চেষ্টা করার জন্য বাড়তি সমস্যা আছে।",
  estimatedHours: 18,
  status: "LIVE",
  practiceTier: "FULL",
  topics: module1Topics,
  checkpoint: module1Checkpoint,
};
