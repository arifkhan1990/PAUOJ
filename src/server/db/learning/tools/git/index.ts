import type { SeedProblem } from "../../../seed-problems";
import { GIT_BRANCHES_EXTRA_PROBLEMS } from "./topic-branches-extra";
import { GIT_BRANCHES_GUIDED_PROBLEMS } from "./topic-branches-guided";
import { GIT_CHECKPOINT_HOTFIX_PROBLEM } from "./checkpoint-hotfix";
import { GIT_CHECKPOINT_RECOVERY_PROBLEM } from "./checkpoint-recovery";
import { GIT_CHECKPOINT_RELEASE_PROBLEM } from "./checkpoint-release";
import { GIT_COLLABORATION_EXTRA_PROBLEMS } from "./topic-collaboration-extra";
import { GIT_COLLABORATION_GUIDED_PROBLEMS } from "./topic-collaboration-guided";
import { GIT_SNAPSHOTS_EXTRA_PROBLEMS } from "./topic-snapshots-extra";
import { GIT_SNAPSHOTS_GUIDED_PROBLEMS } from "./topic-snapshots-guided";

export const GIT_GITHUB_PROBLEMS: SeedProblem[] = [
  ...GIT_SNAPSHOTS_GUIDED_PROBLEMS,
  ...GIT_SNAPSHOTS_EXTRA_PROBLEMS,
  ...GIT_BRANCHES_GUIDED_PROBLEMS,
  ...GIT_BRANCHES_EXTRA_PROBLEMS,
  ...GIT_COLLABORATION_GUIDED_PROBLEMS,
  ...GIT_COLLABORATION_EXTRA_PROBLEMS,
  GIT_CHECKPOINT_HOTFIX_PROBLEM,
  GIT_CHECKPOINT_RELEASE_PROBLEM,
  GIT_CHECKPOINT_RECOVERY_PROBLEM,
];
