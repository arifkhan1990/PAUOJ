import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  Code2,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UserRound,
  Award,
  type LucideIcon,
} from "lucide-react";
import { LANGUAGES } from "@/lib/languages";

export type DocCategoryId = "start" | "solve" | "practice" | "compete" | "account";

export type DocCategory = {
  id: DocCategoryId;
  label: string;
  icon: LucideIcon;
};

export type DocSection = {
  id: string;
  title: string;
  category: DocCategoryId;
  icon: LucideIcon;
  body: string[];
};

export const DOC_CATEGORIES: DocCategory[] = [
  { id: "start", label: "Start here", icon: Sparkles },
  { id: "solve", label: "Solving problems", icon: Code2 },
  { id: "practice", label: "Practice & community", icon: BookOpen },
  { id: "compete", label: "Compete", icon: Trophy },
  { id: "account", label: "Account & teaching", icon: UserRound },
];

export const DOC_SECTIONS: DocSection[] = [
  {
    id: "getting-started",
    title: "Getting started",
    category: "start",
    icon: UserRound,
    body: [
      "Create a free account with a unique username. Your username is permanent because it appears in contest standings and submission records.",
      "Open Problems, pick a difficulty, and read the statement. Use the Custom test button to run your code against your own input before submitting.",
    ],
  },
  {
    id: "dashboards",
    title: "Dashboards and roles",
    category: "start",
    icon: LayoutDashboard,
    body: [
      "Signed-in coders get a dashboard from the Dashboard link in the header. It brings together your rating tier and next badge, rank, solved count, streak, rating graph, daily challenge, upcoming contests, topic mastery, recent contest results and recent submissions.",
      "Teachers also get a teaching workspace for the problems, contests and assessments they create. Admins get the full control room with users, content and judge activity.",
      "Roles are assigned by an administrator. A teacher account can still use the coder dashboard, and an administrator can open the teacher workspace to review it.",
    ],
  },
  {
    id: "languages",
    title: "Languages and compilers",
    category: "solve",
    icon: Code2,
    body: [
      `The judge currently supports ${LANGUAGES.map((language) => language.label).join(", ")}. The language selector is above the editor.`,
      "Java submissions must declare a public class named Main. Kotlin compiles to a self-contained JAR. Swift runs in its own sandbox image. C# uses Mono, Go builds a static binary, and PHP runs on the CLI.",
      "Problems can use exact matching, token comparison, floating-point tolerance or a custom checker. The problem page tells you when a special comparison applies.",
    ],
  },
  {
    id: "judging",
    title: "How judging works",
    category: "solve",
    icon: ShieldCheck,
    body: [
      "When you submit, the code is queued and a worker compiles it once. Each test then runs in a fresh, locked-down container with no network access, strict CPU and memory limits, and a per-test timeout.",
      "The judge compares your standard output with the expected output using the problem's checker. It stops at the first failing test.",
      "Your source code is private from other users while a contest is running. It becomes visible after the contest ends.",
    ],
  },
  {
    id: "verdicts",
    title: "Verdicts",
    category: "solve",
    icon: Gauge,
    body: [
      "Accepted (AC): every test passed. Wrong answer (WA): output did not match. Time limit exceeded (TLE): your program ran too long. Memory limit exceeded (MLE): it used too much memory.",
      "Runtime error (RE): the program crashed or exited with a non-zero status. Compilation error (CE): the compiler could not build it. Output limit exceeded (OLE): it printed too much.",
      "If a verdict is System error (IE), use the rejudge option or contact an administrator. It is a judge problem, not necessarily a problem with your code.",
    ],
  },
  {
    id: "insights",
    title: "Problem insights and rankboard",
    category: "solve",
    icon: BarChart3,
    body: [
      "Open the RankBoard tab on any practice problem to see submissions grouped by verdict, the share of each language, the total submissions, accepted answers and success rate, plus the fastest solvers ordered by their first accepted submission.",
      "The Submissions tab keeps every judged attempt on the problem, and the Discussion tab holds community questions and approaches.",
      "RankBoard and Discussion are hidden while a contest or assessment is active so the official scoreboard stays authoritative.",
    ],
  },
  {
    id: "study-daily",
    title: "Study plans and the daily challenge",
    category: "practice",
    icon: CalendarClock,
    body: [
      "Study plans are ordered lists of problems with a progress bar based on your accepted solutions. Open Study plans from the main navigation or the problems page.",
      "The home page shows today's deterministic daily challenge and your current solving streak. Solve it to keep the streak alive.",
      "Use category, subcategory and company filters on the problem list to narrow practice by topic or interview source.",
    ],
  },
  {
    id: "learning-tracks",
    title: "Learning tracks and checkpoints",
    category: "practice",
    icon: Award,
    body: [
      "Learn in the main navigation opens a seven-track roadmap from basic programming and math to advanced algorithms. Track 1 is open; each later track unlocks after you earn the previous track's checkpoint badge.",
      "Each topic starts with a short Bangla concept note, then guided problems, a tiered practice set and extra problems to try without hints. Every problem has hidden tests, a reference solution and a Bangla editorial.",
      "Finish a topic and start the 45-minute module checkpoint. All three checkpoint problems must be accepted inside the attempt window. Completing them awards the module badge and unlocks the next track; an expired attempt can be restarted, a completed one cannot.",
      "Your profile keeps a learning badge cabinet with every live track badge, earned or locked, linked back to the track.",
    ],
  },
  {
    id: "ratings-resources",
    title: "Ratings, resources and related problems",
    category: "practice",
    icon: Star,
    body: [
      "Rate a practice problem from half a star to five stars. The community average appears in the sidebar and updates as people vote.",
      "The Resources tab lists tutorials and references verified by the problem setter. Problem authors and admins can add or remove links.",
      "Practice more like this suggests problems that share tags with the current problem. Ratings and resources are hidden while a contest or assessment is running.",
    ],
  },
  {
    id: "discussions",
    title: "Problem discussions",
    category: "practice",
    icon: MessageSquare,
    body: [
      "The Discussion tab is a shared space for hints, approaches and edge cases. Sign in to post a Markdown comment, reply once under a thread, or vote on other answers.",
      "You can delete your own comments. Administrators can remove any comment, and every admin removal is recorded in the audit log.",
      "Discussion is hidden while the problem belongs to a running contest or assessment, so nobody can leak statements or solutions during a round.",
    ],
  },
  {
    id: "contests",
    title: "Contests",
    category: "compete",
    icon: Trophy,
    body: [
      "Register before submitting to a contest. Contest problems are locked to registered participants while the round is running.",
      "Each contest has Problems, RankBoard, Submissions and Clarifications tabs. The submission feed can be filtered by verdict and language, and clarifications collect public questions with official answers from the organiser or problem author.",
      "Standings use ICPC scoring: more solved problems ranks higher, and each rejected attempt before acceptance adds 20 penalty minutes. Compilation errors do not add a penalty.",
      "The first accepted solve of each problem is highlighted with a lightning icon in the standings.",
      "Contests carry a division label. Ended public contests can be replayed as a personal virtual contest from the contest page; virtual submissions never change official standings or ratings.",
      "Some contests freeze the public standings near the end. The full board is revealed when the contest ends; admins always see live data.",
      "When the contest ends, ratings update once from your final rank and the ratings of the other participants. Your profile shows the full rating graph.",
      "Contest submissions and practice submissions both count toward your overall ranking once, using the first accepted solution for each problem.",
    ],
  },
  {
    id: "assessments",
    title: "Coding assessments",
    category: "compete",
    icon: ClipboardCheck,
    body: [
      "Your instructor shares an assessment link and an access code. Sign in, enter the code and the timer starts immediately. It cannot be paused.",
      "You only see the assessment problems while your session is active. Submit in any supported language. You may finish early; after finishing or when the timer ends, submissions are locked.",
      "Your verdicts and source code are private to you and the administrators, including after the test. Do not share the code or your account.",
    ],
  },
  {
    id: "teaching",
    title: "Creating problems and assessments",
    category: "account",
    icon: GraduationCap,
    body: [
      "Teachers create problems from the teacher workspace. Public problems appear in the practice list; hidden problems stay out of the public list and can still be used in your own contests or assessments.",
      "A contest bundles problems with a start and end time and an ICPC scoreboard. An assessment is a private timed test: share its link and access code, and candidates join with their own timer.",
      "You can only edit content you created. Administrators can edit everything. Attaching problems to your contest or assessment is limited to public problems and problems you authored.",
    ],
  },
  {
    id: "problem-publication-review",
    title: "Problem publication review",
    category: "account",
    icon: ShieldCheck,
    body: [
      "Saving a new problem sends it to review. It stays out of the public practice list until the review passes, so a work-in-progress problem never reaches other solvers.",
      "Two other setters must approve it. Each approval records the reference solution the reviewer used to check the problem, and the problem also needs an editorial and at least one test case added by a reviewer.",
      "A reviewer can put your problem on hold with comments. Approvals are reset and nobody can approve it again until you reply to the hold and the reviewer resolves it. While the problem is in review or published, its content is locked, so ask for a hold before fixing a statement or test.",
      "When every check passes, you or an administrator publish the problem and it joins the practice list. Each approving reviewer then earns contribution credit. If a published problem needs a change, start a re-review from its review workspace; it leaves the public list until it passes two fresh approvals again.",
      "Only teachers and administrators review problems. Follow the status of your own problem from the Reviews page on your dashboard.",
    ],
  },
  {
    id: "profile",
    title: "Profile and achievements",
    category: "account",
    icon: Award,
    body: [
      "Your profile shows points, rank, acceptance, streak and submissions, plus a 365-day activity heatmap and a contest rating graph.",
      "Language analytics, verdict mix, solved problems and unsolved attempts are computed from your real submissions. Set your institution and country in Settings so the ranking can show them.",
      "Achievements unlock from milestones such as solved count, submissions, contest participation, rating and language variety.",
    ],
  },
  {
    id: "notifications",
    title: "Notifications",
    category: "account",
    icon: Bell,
    body: [
      "The bell in the header opens your notification center. Verdicts, contest starts and clarification answers appear there.",
      "Email copies are optional. Open Settings → Email notifications to enable or disable verdict, contest and clarification emails. Emails require a verified address.",
      "Every notification email includes an unsubscribe link that disables email delivery without signing in. In-app notifications stay available.",
    ],
  },
  {
    id: "account",
    title: "Account and fairness",
    category: "account",
    icon: BookOpen,
    body: [
      "Change your display name, bio and password from Settings. Changing your password signs out all other sessions.",
      "New accounts receive a verification email. If you lose your password, use Forgot password on the sign-in page to receive a one-time reset link.",
      "One account per person. Do not share code, use another person's account or attempt to attack the judge. Administrators can suspend accounts that break these rules.",
    ],
  },
];

export const DOC_CHECKLIST = [
  "Read from standard input and write to standard output.",
  "Do not print prompts, labels or debug information.",
  "Check the time and memory limits on the problem page.",
  "Use fast input/output for large inputs.",
  "For Java, the public class must be Main.",
];
