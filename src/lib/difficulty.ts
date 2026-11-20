export type Difficulty = "EASY" | "MEDIUM" | "HARD" | "EXPERT";

type DifficultyMeta = {
  label: string;
  className: string;
  order: number;
};

export const DIFFICULTY_META: Record<Difficulty, DifficultyMeta> = {
  EASY: {
    label: "Easy",
    className: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    order: 1,
  },
  MEDIUM: {
    label: "Medium",
    className: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
    order: 2,
  },
  HARD: {
    label: "Hard",
    className: "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200",
    order: 3,
  },
  EXPERT: {
    label: "Expert",
    className: "border-foreground bg-foreground text-background",
    order: 4,
  },
};

export function difficultyMeta(value: string): DifficultyMeta {
  return DIFFICULTY_META[value as Difficulty] ?? DIFFICULTY_META.EASY;
}

export const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD", "EXPERT"];
