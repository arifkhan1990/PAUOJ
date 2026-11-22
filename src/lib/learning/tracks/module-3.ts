import type { LearningModuleDefinition } from "@/lib/learning/types";
import { module3Checkpoint, module3Topics } from "../module-3";

export const module3: LearningModuleDefinition = {
  slug: "basic-intermediate-algorithms",
  order: 3,
  title: "Basic & Intermediate Algorithms",
  subtitle: "প্রবলেম সলভিংয়ের কোর টেকনিক",
  goal: "Apply sorting, searching, two pointers, prefix sums, recursion and greedy ideas.",
  description: "বাইনারি সার্চ, স্লাইডিং উইন্ডো, প্রিফিক্স সাম, রিকার্সন-ব্যাকট্র্যাকিং আর গ্রিডি—প্রতিযোগিতামূলক প্রোগ্রামিংয়ের সবচেয়ে বেশি ব্যবহৃত টুলগুলো।",
  estimatedHours: 22,
  status: "LIVE",
  diagram: {
    src: "/learning/module-3.svg",
    alt: "মডিউল ৩-এর শেখার ধারা: সর্টিং ও বাইনারি সার্চ থেকে টু পয়েন্টার ও স্লাইডিং উইন্ডো, প্রিফিক্স সাম, রিকার্সন-ব্যাকট্র্যাকিং এবং গ্রিডি।",
  },
  topics: module3Topics,
  checkpoint: module3Checkpoint,
};
