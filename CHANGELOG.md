# Changelog

All notable changes to PAU OJ are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/) and the project uses SemVer.

## [Unreleased]

### Added
- Profiles now show approved community-editorial credits with the problem list
  and approval dates, linking back to each editorial tab.
- Admins now receive one weekly review backlog report (pending proposals,
  overdue items, oldest age and pending contest requests) as an in-app SYSTEM
  notification and an email, deduplicated by ISO week.
- Approved community editorials now show a contributor credit card on the
  problem's editorial tab, linking to the contributor's profile.
- Contribution review data can be exported as a UTF-8 CSV from the review
  dashboards or the contributions inbox. Teachers/authors get their own problems
  and admins get the whole judge; status and 7/30/all-time filters are supported,
  with quoted notes, timestamps and review hours in the file.
- Review analytics now flags proposals that have waited more than 48 hours and
  shows the oldest pending age. The worker sends one deduplicated reminder to
  the author for each overdue proposal or contest-use request.
- Teacher and admin dashboards now include a review-activity panel: pending,
  approved and rejected proposals, average review turnaround, a per-kind
  breakdown, top approved contributors and pending contest problem requests.
  The panel filters to the last 7 days, 30 days or all time.
- Added a problem setter workflow with author-owned reviews. Problems keep a
  single setter; teachers can propose statement, extra test-case and editorial
  changes on problems they do not own, and the setter (or an admin) approves or
  rejects them from `/teacher/contributions`, `/admin/contributions` or
  `/dashboard/contributions` (any signed-in problem author). Pending
  proposals are invisible on the public problem, approval applies in one
  transaction with an audit entry and notification, test proposals append
  without revealing hidden tests, and the problem editor and problem list show
  pending counts. Reviewers cannot approve their own proposal. Problems inside
  a running contest or assessment pause new proposals and approvals.
- Added community editorial proposals: a signed-in solver with an accepted
  submission can propose an editorial from the problem page, while a
  `?kind=EDITORIAL`-only form keeps statements and test cases setter-only.
  Assessment-only acceptances do not unlock the form. Authors review community
  editorials from the same queue, contributors see their proposals under "My
  proposals" in `/dashboard/contributions`, and decision notifications link back
  to the right workspace.
- Added contest problem author approval. A teacher adding another setter's
  problem to a contest creates an author request; the contest can be saved as a
  private draft but cannot be public until every problem is approved. Authors
  approve or decline from their contributions page, decisions are audit logged
  and notify the creator, and admins can override or publish immediately.
- Review events now support optional email delivery. Contribution proposals,
  decisions and contest problem approval requests/decisions respect the new
  `emailReviews` preference, join the settings form and unsubscribe page, and use
  the same verified-address and best-effort delivery rules as other emails.
- Approving a test-case contribution now offers an opt-in rejudge of up to 500
  standalone practice submissions. Contest, virtual-contest and assessment
  submissions are excluded, the queue uses bulk enqueue, and the action is
  audit logged as a batch.
- Review emails are now grouped into a short digest per user. In-app review
  notifications appear immediately; the worker batches un-emailed contribution
  and contest-approval items and sends one email with the pending list and a
  single review-queue link. Existing review notifications are backfilled as
  already emailed.
- Review email preferences now include a frequency: instant (each event), hourly
  digest or daily digest. Hourly/daily notifications wait in the worker sweep
  until the interval has elapsed, then send one combined email.
- Added a shared professional dashboard shell and three role workspaces: a coder
  dashboard at `/dashboard`, a `TEACHER` workspace at `/teacher` and a redesigned
  admin control room at `/admin`, with standalone full-height layouts (no public
  header/footer), responsive sidebars, breadcrumbs, theme/account controls,
  metric cards and panel layouts.
- The public user guide at `/docs` now uses the same dark reference layout as
  the changelog: hero, grouped navigation, category sections, per-topic cards
  and a quick submit checklist. Both reference pages keep the left navigation
  fixed while only the right content column scrolls, and the menu highlights the
  section or release currently in view.
- Teachers can author problems, schedule contests and run private assessments;
  teacher lists, results and edits are scoped to the content they created, while
  admins keep platform-wide access.
- Admins can assign the new `TEACHER` role from the user management table. The
  demo seed includes `teacher` / `Demo@12345` with a demo assessment, contest and
  problem.
- The 365-day submission heatmap now scales its cells to fit the card at every
  width, so the profile and dashboard never show a horizontal scrollbar.
- Dashboard panels end with a compact footer showing the app version and links
  to the changelog, user guide, system health and public site. The public
  `/changelog` page now parses `CHANGELOG.md` into release cards with a
  current-release badge, sticky release navigation, grouped change sections,
  per-section icons and inline code formatting.
- Contests now have divisions and ended public contests can be replayed as
  personal virtual contests with their own timer, tagged submissions and
  scoreboard.
- Admins can set a standings freeze window and review code-similarity signals
  for contest submissions from the new integrity page. Virtual submissions never
  affect official standings or ratings.
- The judge now supports C# (Mono), Go, PHP, Kotlin and Swift in addition to C,
  C++, Python, Java and JavaScript. Swift runs in a separate
  `pauoj/judge-swift` image with the same harness and limits.
- Problems can choose an output checker: exact, token comparison,
  floating-point tolerance or a custom Python checker. Admins configure it in the
  problem editor.
- Problem pages now support community half-star ratings, verified resources
  (admins/problem authors), related problems by shared tags, and a Resources tab
  that follows the design. All extras are locked during live contests and
  assessments.
- Added curated study plans with ordered problems and per-user progress, a
  deterministic daily challenge with a solving streak, and category,
  subcategory and company filters on the problem list.
- Profiles now show institution/country, language and verdict analytics, the
  latest solved and unsolved problems, and milestone achievements derived from
  real activity. Institution/country also appear on the ranking.
- The profile is now a modern coder dashboard: an animated rating trajectory
  drawn from the starting rating with a tier runway, global rating rank,
  top-percent slice and a rating-distribution histogram; a compact coverage ring
  with a 2x2 solved/total difficulty grid; a milestone cabinet of layered
  hexagonal medals where earned badges keep their color and locked ones show
  progress and the closest unlock; and a green consistency heatmap with active
  days and longest streak. Empty states use a visual rating preview instead of a
  text-only explainer.
- Profiles now include a 4x2 stat board (submissions, solved, hardest tried and
  solved, contest attend/rating, problem setting and contest create), a
  submission-verdict pie, a multi-language donut and a GitHub-style activity
  heatmap with Mon/Wed/Fri/Sun labels, one block per month separated by a
  column gap and a Less/More legend. Demo seeds use varied languages and
  populated setter/creator counts.
- Auth pages now use a modern split modal-style card: a dark brand panel with a
  sample rating profile, Sign in / Create account tabs, icon fields, inline
  errors and a live password-strength meter. The old floating algorithm cards
  were removed for a calmer, more organized layout.
- Demo seeds now create three rated past contests for the demo users, so
  profiles have a real wavy rating history and populated dashboard out of the
  box.
- Added an in-app notification center for verdicts, contest starts and
  clarification answers, with per-category email preferences and token-based
  unsubscribe links in notification emails.
- Problem pages now include a Discussion tab: Markdown comments, one-level
  replies, upvotes/downvotes, author deletion and admin moderation. Threads are
  paginated and automatically locked while the problem is used in a running
  contest or assessment.
- Contest pages now share Problems, RankBoard, Submissions and Clarifications
  tabs. The contest submission feed supports verdict/language filters and
  All/My views; clarifications collect public questions with official answers
  from admins, the contest creator or the problem author.
- Finished contests now update Elo ratings once (K=32, zero-sum, floor 100) and
  store the full history. Profiles show a contest rating graph with rank,
  rating change and peak rating.
- Problem pages now show community insights: submissions grouped by verdict,
  language shares, submission/accepted/success-rate basics and a rankboard of
  the fastest solvers. The block is hidden for active contest and assessment
  problems.
- The coder dashboard now leads with a coder identity card (tier badge,
  next-tier runway and next badge), then adds topic mastery with per-tag
  solved/attempted bars, recent contest results with rating deltas, upcoming
  contest countdowns and the shared difficulty coverage, heatmap and submission
  table.

### Fixed
- Dashboard sidebars highlight only the current section instead of also
  highlighting Overview on every subpage.
- The admin review queue excludes the reviewer's own proposals, so unactionable
  items no longer appear in the waiting list.
- Contest creators can open their own private draft contest page instead of
  getting a 404 from the View action.

### Changed
- Contest problem requests now support bulk selection with one-click approve or
  decline, including a shared decline reason. Individual actions remain.
- Problem review queues now compare the live and proposed statement/editorial
  side by side, so setters can judge a change without leaving the approval page.
- Profiles now open with a compact coder card: orange avatar, tier badge,
  joined date, edit-profile action and a four-metric strip for points, rank,
  solved and acceptance. The detailed 4x2 stat board moves below the contest
  trajectory.
- Rating history is timestamped with the contest end date instead of the
  finalisation page view, so profile trajectories keep the real contest
  timeline. The streak milestone uses the longest run rather than the current
  run, so earned badges do not disappear after a break.
- Problem pages are split into Description, RankBoard, Submissions, Discussion
  and Editorial tabs instead of one long page; the active tab is deep-linkable
  via `?tab=`. RankBoard combines the verdict/language charts and basic info
  with the fastest-solver table.
- Problem tabs got a cleaner, modern layout: icon underline navigation,
  card-based statement/input/output/constraints sections, RankBoard overview
  tiles and medal-styled solver ranks, a structured submissions table and a
  dedicated editorial unlock state. Data-heavy tabs use the full content width.

## [0.5.0] - 2026-11-17

### Added
- Contest standings mark the first accepted solve of each problem.

### Changed
- The 14-day judge activity chart now uses Recharts with stacked accepted/other
  bars, an acceptance-rate line, interactive tooltips, responsive layout,
  reduced-motion support and themed light/dark rendering on the home page and
  admin dashboard.
- The problems list shows all of a problem's topics (including on mobile) and
  the topic filter lists every tag that has problems you can open, so no
  categories are truncated and filtering never lands on an empty list unless
  the filters truly match nothing.

### Fixed
- Submission source viewer keeps its dark Shiki background so code stays readable.
- Footer and `/health` version now come from `package.json`; the build no longer reports a stale hardcoded version.

## [0.4.0] - 2026-11-17

### Added
- Email verification for new accounts, with a non-blocking verification banner and resend action.
- Password reset by email with hashed, single-use, expiring tokens.
- Dev Mailpit inbox in Compose, SMTP configuration for production, and email templates.
- Auth-token schema/migration, rate limits, session revocation on password reset and security tests.
- User-guide, API, architecture and deployment documentation for account recovery.

## [0.3.0] - 2026-11-17

### Added
- Worker heartbeat tracking and a `/health` response that reports live judge workers.
- Production Compose stack with Caddy automatic HTTPS, no public DB/Redis ports and app bound to localhost.
- One-command deploy script with image tagging, health wait and automatic rollback.
- PostgreSQL + Redis backup script, destructive restore script and backup integrity check.
- Host health-check script with optional webhook alerts and cron setup.
- Server setup/bootstrap script and a manual self-hosted-runner deploy workflow.
- Deployment runbook and hardening checklist.

### Changed
- Landing page refreshed: richer problem, contest, leaderboard, verdict, assessment and feature sections, with a live contest countdown and soft entrance/scroll motion that respects reduced motion.
- Added a reusable 14-day judge activity chart to the home page and admin dashboard, with total/accepted bars, tooltips, an accessible summary and an empty state.
- Updated the home page screenshot in the README.

## [0.2.0] - 2026-11-17

### Added
- Private coding assessments: access codes, per-candidate timers, session expiry, early finish and admin results.
- Assessment-only private problems that disappear from public lists and lock direct access.
- Combined contest/assessment problem locking so a participant can open the problem via either access path.
- Assessment-aware submission tagging, source hiding and score reporting.
- Admin assessment editor, candidate results page, seed assessment and assessment tests.
- User guide and API/architecture documentation for assessments.
- PAU OJ logo across the header, footer and auth pages, plus a matching favicon, Apple touch icon and Open Graph image.

## [0.1.0] - 2026-11-17

### Added
- Real online judge with a Docker-sandboxed worker, BullMQ queue and live SSE verdicts.
- Languages: C17, C++20, Python 3.11, Java 17 and JavaScript (Node.js 24).
- Verdicts: AC, WA, TLE, MLE, RE, CE, OLE and system errors, with per-test results.
- Problem browser with search, difficulty and tag filters, pagination and solved status.
- Problem detail pages with Markdown statements, samples, limits, locked editorials and an in-browser Monaco editor.
- Custom test runs with ephemeral results.
- Registration, login, opaque database sessions, profile settings and password changes.
- Public profiles with points, rank, acceptance, difficulty breakdown, 365-day heatmap and recent submissions.
- Contests with registration, contest-only problem access, ICPC standings and admin contest editor.
- Admin dashboard, problem/test editor, user roles, suspension and rejudge.
- PostgreSQL schema and migrations with Drizzle ORM, plus idempotent seed data.
- Docker Compose stack (Postgres, Redis, app, worker) and universal judge image.
- CI workflow, Vitest tests, health endpoint and security headers.
- User guide at `/docs` and developer documentation in `docs/`.
