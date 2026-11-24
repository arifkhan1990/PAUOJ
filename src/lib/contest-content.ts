/**
 * Shared contest page copy. Organisers can override eligibility/rules/prizes
 * with their own Markdown; the public page always keeps a standard policy and
 * an explicit prize state instead of rendering empty sections.
 */

export const STANDARD_CONTEST_POLICY = [
  "One account per coder. Sharing an account, statement, test data or solution is not allowed.",
  "Submissions are judged only during the contest window; source code stays hidden from other participants while the round runs.",
  "ICPC scoring: most problems solved wins, then lower penalty, then the earlier last accepted submission.",
  "Wrong Answer, TLE, MLE, Runtime Error and Output Limit add a 20-minute penalty before an accepted solve. Compilation errors do not.",
  "Statements are watermarked; copying and pasting are logged. Confirmed plagiarism can lead to disqualification and rating removal.",
  "Contest crew, setters and editorial/test contributors cannot compete in a round they work on.",
  "The organisers may clarify statements, rejudge affected submissions or change a test that is demonstrably wrong.",
] as const;

export const STANDARD_ELIGIBILITY =
  "Open to every registered PAU OJ coder. Team rounds require a complete team within the published team size.";

export const NO_PRIZE_ANNOUNCEMENT =
  "Prize details have not been announced for this round yet. Registered participants will see them here once the organiser publishes them.";

export const MONTHLY_ELIGIBILITY =
  "Open to all registered PAU OJ coders. The monthly official round is solo-only.";

export const MONTHLY_RULES = [
  "The problem set stays sealed until 10:00 Asia/Dhaka on the third Sunday.",
  "Editorials and public discussions stay closed for the full 90-minute round.",
  "Every problem is a fresh contest debut and cannot appear in another contest.",
  "Contest crew, problem setters, editorial writers and test-case setters cannot compete.",
  ...STANDARD_CONTEST_POLICY,
].join("\n\n");

export const MONTHLY_PRIZES = [
  "### Monthly honours",
  "- **Champion** — featured monthly champion badge on the profile and contest page.",
  "- **Top 3** — profile medal + a public top-three finish on the round page.",
  "- **Every accepted solver** — points, rating movement when eligible, and a permanent contest archive entry.",
].join("\n");
