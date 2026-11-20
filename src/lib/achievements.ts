import type { Achievement } from "./profile-types";

export type AchievementInput = {
  solvedCount: number;
  submissionCount: number;
  contestCount: number;
  rating: number;
  longestStreak: number;
  acceptedLanguages: number;
};

export function buildAchievements(input: AchievementInput): Achievement[] {
  const ratedValue = input.contestCount > 0 ? input.rating : 0;
  const definitions: Omit<Achievement, "earned">[] = [
    {
      id: "first-accepted",
      label: "First Accepted",
      description: "Get your first accepted solution.",
      value: input.solvedCount,
      target: 1,
      icon: "check",
      tone: "emerald",
    },
    {
      id: "ten-solved",
      label: "Getting Started",
      description: "Solve 10 problems.",
      value: input.solvedCount,
      target: 10,
      icon: "target",
      tone: "teal",
    },
    {
      id: "fifty-solved",
      label: "Problem Hunter",
      description: "Solve 50 problems.",
      value: input.solvedCount,
      target: 50,
      icon: "crosshair",
      tone: "sky",
    },
    {
      id: "century",
      label: "Century",
      description: "Solve 100 problems.",
      value: input.solvedCount,
      target: 100,
      icon: "crown",
      tone: "amber",
    },
    {
      id: "prolific",
      label: "Prolific",
      description: "Send 500 submissions to the judge.",
      value: input.submissionCount,
      target: 500,
      icon: "send",
      tone: "orange",
    },
    {
      id: "contest-debut",
      label: "Contest Debut",
      description: "Finish a rated contest.",
      value: input.contestCount,
      target: 1,
      icon: "flag",
      tone: "sky",
    },
    {
      id: "rated-1600",
      label: "Specialist",
      description: "Reach a contest rating of 1600.",
      value: ratedValue,
      target: 1600,
      icon: "gauge",
      tone: "teal",
    },
    {
      id: "rated-1800",
      label: "Expert",
      description: "Reach a contest rating of 1800.",
      value: ratedValue,
      target: 1800,
      icon: "trending",
      tone: "amber",
    },
    {
      id: "rated-2000",
      label: "Master",
      description: "Reach a contest rating of 2000.",
      value: ratedValue,
      target: 2000,
      icon: "trophy",
      tone: "rose",
    },
    {
      id: "streak-7",
      label: "Consistent",
      description: "Keep a 7-day solving streak.",
      value: input.longestStreak,
      target: 7,
      icon: "flame",
      tone: "orange",
    },
    {
      id: "polyglot",
      label: "Polyglot",
      description: "Get accepted in 3 different languages.",
      value: input.acceptedLanguages,
      target: 3,
      icon: "languages",
      tone: "emerald",
    },
  ];

  return definitions
    .map((definition) => ({
      ...definition,
      earned: definition.value >= definition.target,
    }))
    .sort((left, right) => {
      if (left.earned !== right.earned) return left.earned ? -1 : 1;
      return left.target - right.target;
    });
}
