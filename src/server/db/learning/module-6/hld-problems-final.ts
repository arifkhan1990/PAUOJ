import type { SeedProblem } from "../../seed-problems";
import { HLD_PROBLEMS as HLD_BASE } from "./hld-problems";

/**
 * HLD editorials keep short, focused HLD snippets. Append the complete,
 * validated reference solution so readers can always see the full program.
 */
export const HLD_PROBLEMS: SeedProblem[] = HLD_BASE.map((problem) => ({
  ...problem,
  editorial: `${problem.editorial}\n\n## পূর্ণ সমাধান\n\n\`\`\`python\n${problem.referencePython}\n\`\`\``,
}));
