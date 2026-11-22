import type { LearningModuleDefinition } from "@/lib/learning/types";
import { module1Checkpoint, module1Topics } from "../module-1";

export const module1: LearningModuleDefinition = {
  slug: "basic-programming-math",
  order: 1,
  title: "Basic Programming & Math",
  subtitle: "শুরুর ধাপ: কোডিং, লজিক আর গণিত",
  goal: "Build coding syntax, logical thinking and a first mental model of complexity.",
  description:
    "ইনপুট-আউটপুট, লুপ, শর্ত, Big-O, মৌলিক গণিত, বিট আর অ্যারে—প্রথম মডিউলে তোমার কোডিংয়ের ভিত তৈরি হবে। প্রতিটি টপিকে ছোট গল্প, কনসেপ্ট নোট, হাতে-কলমে সমস্যা আর নিজে চেষ্টা করার জন্য বাড়তি সমস্যা আছে।",
  estimatedHours: 18,
  status: "LIVE",
  diagram: {
    src: "/learning/module-1.svg",
    alt: "মডিউল ১-এর শেখার ধারা: ইনপুট ও লুপ থেকে কমপ্লেক্সিটি, তারপর মৌলিক গণিত, বিট ম্যানিপুলেশন এবং স্ট্রিং ও ১ডি/২ডি অ্যারে।",
  },
  practiceTier: "FULL",
  topics: module1Topics,
  checkpoint: module1Checkpoint,
};
