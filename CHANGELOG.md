# Changelog

All notable changes to PAU OJ are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/) and the project uses SemVer.

## [Unreleased]

### Added
- Study plans now support ordered sections, beginner/intermediate/advanced levels, an optional
  admin duration estimate (with a difficulty-based fallback), featured plans, topics, a
  difficulty mix, learner enrollment and per-section progress.
- `study_list_sections` and `study_list_enrollments`; `study_lists` gains `level`,
  `estimated_minutes` and `is_featured`, and `study_list_items` gains a nullable `section_id`.
  Existing flat plans keep working under a leading "General" section.
- A "My plans" shelf, search/level/sort filters, a start/leave enrollment action and a
  continue-with-the-next-unsolved-problem CTA on `/lists` and `/lists/:slug`.
- Private learner-created plans with a quota of 10, owner-only edit/delete, sections and
  published public problems, plus private per-problem notes stored in
  `study_list_item_notes`.
- Four curated seed plans with sections: Getting started, Dynamic programming starter,
  Array foundations and Graph and DP sprint.

### Changed
- The admin study-list editor now manages sections, per-section problem pickers, ordering,
  duplicate detection, live difficulty counts and an estimated duration.
- The admin study-list table shows level, sections, duration, featured state and visibility.
- The curated seed now preserves admin edits to plans that already have sections, while
  upgrading legacy flat plans once.
- Signed-in learners can create, edit and delete their own private sectioned plans and see
  them in "My plans"; private plans are owner-only and capped at 10.

### Fixed
- Study plans accept only published public problems; draft/private problems are rejected by
  the admin API and hidden from public plans if a problem is withdrawn later.
- Unknown and private study-plan routes return a real `404` instead of a streamed not-found
  page with a `200` status. The `/lists/new` create page is reserved from the slug lookup.
- Private notes are scoped to `(user, plan, problem)` and never leak to another viewer.

## [0.8.0] - 2026-11-22

### Added
- A complete seven-track learning curriculum at `/learn`: 34 topics, **430 original problems**
  with **2,750 tests**, Bangla concept notes, guided problems, tiered practice, extra
  self-try problems, reference Python solutions and Bangla editorials. Every topic has the full
  3-easy / 3-medium / 2-hard practice tier plus two or three extra problems.
- Seven 45-minute checkpoints and module badges, including Foundation Coder, Data Structures
  Builder and the advanced-track badges. `learning_checkpoint_attempts` stores one timed
  attempt per `(user, module)`; completion is derived from accepted, non-assessment
  submissions inside the window and persisted with an idempotent conditional update.
- Sequential track unlocks: track 1 is open, and track N requires the previous track's
  checkpoint badge. The API enforces the same rule as the UI, and locked module/topic pages
  show the requirement.
- A learning-badge cabinet on every profile, showing each live track badge as earned or
  locked with the earned date and a link back to the track.
- `pnpm learning:check` executes every reference solution against every test, validates tier
  counts, slugs, Bangla statements and editorial code blocks, and runs in `verify.sh` and CI.
  `pnpm learning:audit` adds the stricter content gate: concept/editorial sections, tables and
  diagrams, tier/difficulty/points mapping, names/person/honorific consistency, and every
  editorial's full Python block against every test. Large fixed tests are generated from
  expressions, so declared maximum bounds are exercised without 100 KB literals.
- Every module page now has a professional SVG concept-map diagram with accessible title,
  description and alt text, plus a review pass across all 34 concept notes and 430 problems
  covering Bangla grammar, tense/person, difficulty calibration, diagrams and editorial
  accuracy.
- A learning release checklist in `docs/learning.md` and `deploy/README.md` covering the
  additive checkpoint migration, idempotent curriculum seed, judge rebuild and smoke checks.

## [0.7.1] - 2026-11-22

### Fixed
- Unknown problem slugs now return a real `404` instead of a `200` not-found shell. The
  route's `notFound()` runs after the `(app)/loading.tsx` skeleton starts streaming, so a
  lightweight existence check in `src/proxy.ts` rejects missing slugs before rendering while
  existing private, contest-locked and assessment-locked problems still reach the page's own
  access rules. Anonymous `/contribute` links keep the sign-in gate; a signed-in request for an
  unknown problem's contribute page also returns `404`.
- `srv deploy` now builds with a checked status before starting the stack, retries a network
  failure once, and aborts without touching the running containers or marking the deploy `ok`
  when the image build fails. The runbook documents the host-network/off-host image fallback.

## [0.7.0] - 2026-11-22

### Added
- A two-setter problem publication review: a new problem enters review and reaches the public
  practice list only after two other setters approve it, each approval recording the reference
  solution used to verify the problem. Publishing also requires an editorial and at least one test
  case added by a reviewer.
- Reviewer holds with a respond/resolve cycle: a hold moves the problem to `CHANGES_REQUESTED`,
  supersedes the approvals collected so far and blocks every further approval until the author
  responds and the hold raiser (or an admin) resolves it; resolving the last hold reopens the
  review with a fresh cycle. Reviewers get contribution credit on publication.
- Review workspaces at `/teacher/reviews`, `/admin/reviews` and `/dashboard/reviews`, with an inbox
  of review queues, held problems and published review credits, plus `GET`/`POST`
  `/api/v1/problem-reviews/:problemId` for the actions (`submit`, `approve`, `hold`, `respond`,
  `resolve`, `reopen`, `publish`, `reopen_publication`) and a publication gate checklist.
- Approving reviewers notify the author of each approval's progress. A published problem can be
  withdrawn into a re-review (`reopen_publication`); it leaves the public list, its approvals reset,
  and it must pass two fresh approvals before returning. The workspace warns when fewer than two
  other eligible setters exist.

### Changed
- `problems` gained `publication_status` (`DRAFT`, `IN_REVIEW`, `CHANGES_REQUESTED`, `PUBLISHED`),
  `published_at` and `review_cycle`; `is_public` now defaults to false and is pinned to
  `publication_status = 'PUBLISHED'` by a database check, so the public list shows published
  problems only. Existing rows were backfilled: public problems became `PUBLISHED` (with
  `published_at = created_at`), everything else `DRAFT`.
- `POST`/`PUT /admin/problems` no longer accept an `isPublic` publish flag. A saved problem starts
  in review and is published only through the review workflow; contest-only problems and private
  drafts remain possible, and reviews are staff-only (teachers and administrators).
- Problem content is locked in `IN_REVIEW` and `PUBLISHED`; the editor and `PUT /admin/problems/:id`
  reject rewrites (409) so approvals and reviewer-added tests cannot be invalidated after the fact.
  Statement/test contribution proposals are rejected in those states (published problems accept
  editorial proposals only). The author asks for a hold when a fix is needed. Problem and review
  test payloads also carry combined size caps, and problem creation is rate-limited.
- Choice fields across the app now use one custom searchable select. Search appears above five
  options, the menu is keyboard accessible and portal-positioned, long labels wrap, and named GET
  filters submit through a hidden input.

## [0.6.5] - 2026-11-21

### Added
- Added a public contribution reviewer leaderboard at `/reviewers`. Reviewers
  are ranked by approved + rejected contribution decisions, with
  all-time/7-day/30-day filters, approval rate, average review turnaround, a
  top-three podium, last activity and a mobile-safe table. Reviewers link from
  `/rank` and the footer.

### Changed
- Markdown authoring for problems, editorials, contests and assessments now uses
  a toolbar editor: headings, bold/italic, inline and fenced code with a language
  picker, links, images by public URL, lists, quotes, tables and dividers, plus
  Write/Split/Preview modes, keyboard shortcuts and a character count. Editorial
  fields add an "Insert outline" scaffold (approach, complexity, reference
  solution, edge cases).
- Rendered Markdown now scales images to the editorial width, wraps long links,
  and keeps wide code blocks and tables inside their own scroll area.

### Fixed
- Community editorial submissions now return solvers to
  `/dashboard/contributions`; they previously landed on the teacher-only inbox.

## [0.6.4] - 2026-11-21

### Changed
- Transactional emails now show the real PAU OJ mark in the header instead of a `PAU` text
  monogram, placed on a light tile so the teal/green artwork stays visible on the dark brand
  header.
- The footer now carries Facebook, X, LinkedIn and GitHub icon links. They are placeholders
  (`href="#"`) until the official accounts exist, and load from same-origin `/brand` assets with
  absolute app URLs; there are no third-party image or tracking requests, and blocked images
  fall back to the text wordmark.

## [0.6.3] - 2026-11-21

### Fixed
- Transactional email subjects are sanitized centrally before both logging and SMTP, folding
  CR/LF into a space so a notification title cannot inject a header.
- The responsive breakpoint is now 599px: a 600px desktop preview keeps the inline CTA while
  mobile keeps the full-width CTA.

### Changed
- The transactional email shell has a deliberate dark-mode palette (`prefers-color-scheme: dark`)
  across the header, card, badge, body text, fallback box, CTA and footer, with light mode as the
  default. Outlook keeps its documented square CTA/light palette; Gmail mobile may apply its own
  inversion instead of the tuned dark theme.

## [0.6.2] - 2026-11-21

### Changed
- Transactional emails (verification, password reset, assessment invite, review digest and
  notifications) now use a shared 600px table-based shell with a dark brand header, badge,
  stronger CTA, styled fallback-link box, security/expiry notes, hidden preheader, responsive
  mobile layout and a refined footer. The shell uses no images or external assets, so it survives
  image blocking; existing copy, links, plain-text alternatives and SMTP behavior are unchanged.

## [0.6.1] - 2026-11-21

### Added
- The assessment results CSV now appends `<label>_solved` and `<label>_attempts` for
  every problem in the assessment's position order, after the roster columns. Absent
  candidates and participant-only rows export zeros; detached problems stay excluded.
  The base columns and their order are unchanged.

## [0.6.0] - 2026-11-21

### Added
- Assessments gained join modes: `OPEN_CODE` (default) keeps the shared access code, while
  `INVITE` disables it and admits candidates only through a personal link at
  `/assessments/:slug/invite/:token`. `POST /assessments/:slug/join` now takes either the code or
  an invite token, records how the claim was bound (`VERIFIED_EMAIL`, `EMAIL_MATCH`, `REF_MATCH`)
  and refuses a mismatched account or candidate reference; each invite allows five failed claims
  per 15 minutes. Resolving an invite is read-only, so a mail scanner or link prefetcher cannot
  consume an attempt.
- Roster import for assessments: paste a CSV on the results page to create one invite per
  candidate — `candidate_ref` is required, `email`, `candidate_name` and `group_label` are
  optional, and rows without an email are delivered by link only. RFC-4180 parsing with a 64 KB /
  500-row cap, header detection plus manual column mapping, and a per-row
  `created`/`updated`/`unchanged`/`duplicate`/`invalid` report with a reason and a fix; owner and
  admin only.
- Roster-complete results export at `GET /api/v1/admin/assessments/:id/results.csv`: one row per
  roster entry, including candidates who never started, with group label, claim assurance, failed
  claim count, timings, solved, points and submissions. Owner/admin only, formula-escaped cells,
  audit logged as `assessment.export`.
- The admin and teacher assessment results page now has a roster panel: paste import with column
  mapping and report, an invite table with per-candidate link copy (copying rotates the token and
  invalidates the previous link) and a results CSV button. The assessment editor gained the
  join-mode select, and invite-only assessments replace the access-code card with an invite-only
  notice.
- Invite email can be sent from the roster panel, one candidate at a time: `POST
  /admin/assessments/:id/invites/:inviteId/send` mails the stored address (resend uses the same
  endpoint) and `.../revoke` invalidates one link, both owner/admin only and audit logged. Every
  send rotates the personal link so the previous one stops working, a 120-second per-invite lock
  and a three-per-hour send window stop double sends, a failed delivery returns a "copy the link
  instead" error without losing the link, and revoking keeps a claimed attempt. Candidates without
  an email stay copy-link only; verified end to end against the Compose Mailpit inbox.
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
- Global `/rank` (its totals and the per-user submission count) and the problem verdict/language
  statistics now exclude assessment and virtual-contest submissions, so an exam attempt can no
  longer raise public rank or problem statistics. Site counts, the 14-day activity chart, the
  daily challenge and the denormalized problem counters exclude assessment submissions too. Rank
  points are derived on read, so some existing public totals drop immediately and need no
  backfill.
- Profile points, solved counts, language/verdict charts, difficulty and tag stats and the
  activity heatmap now use the same practice-only guard, excluding assessment and virtual-contest
  submissions; the recent submissions list still shows them subject to the existing source
  visibility rules.
- CSV exports are safe to open in a spreadsheet: `toCsv` prefixes a `'` to string cells starting
  with `=`, `+`, `-`, `@`, tab or CR (OWASP CSV-injection guard). This also hardens the existing
  contribution export.
- Dashboard sidebars highlight only the current section instead of also
  highlighting Overview on every subpage.
- The admin review queue excludes the reviewer's own proposals, so unactionable
  items no longer appear in the waiting list.
- Contest creators can open their own private draft contest page instead of
  getting a 404 from the View action.

### Changed
- Assessment joining is one endpoint with a union body: send either `code` or `token`. A code on
  an invite-mode assessment returns `INVITE_ONLY` instead of a generic invalid-code error, and
  invite refusals have their own codes (`INVITE_EMAIL_MISMATCH`, `INVITE_REF_MISMATCH`,
  `INVITE_CLAIMED`, `INVITE_REVOKED`, `INVITE_EXPIRED`, `INVITE_RATE_LIMITED`), so the candidate
  always sees why an attempt was refused.
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

### Security
- Invite links carry a bearer token in the path: only its SHA-256 hash is stored, and the raw
  token leaves the server in exactly two places — the rotate/copy response (sent with
  `Cache-Control: no-store`) and the body of the invite email; the send response returns
  `email: null` with no URL, and the development mail fallback logs `body: "[omitted]"` so
  token-bearing message bodies never reach the logs. The resolve route returns no email and only
  a three-character reference hint, wrong-account and wrong-reference claims are refused instead
  of being accepted, and each invite throttles after five failed claims per 15 minutes. The
  invite page and API send `Referrer-Policy: no-referrer`, `Cache-Control: no-store` and
  `X-Robots-Tag: noindex, nofollow`. Residual risk: reverse proxies commonly log request paths,
  so an invite URL can still reach an access log — strip path logging for invite URLs at the
  proxy or rotate the link.
- Invite email delivery depends on the deployment sender record: a dedicated `notify.<app-domain>`
  subdomain, Amazon SES SMTP in `ap-southeast-1` with Easy DKIM, a custom MAIL FROM and a phased
  DMARC rollout — see `docs/deployment.md` (Transactional email). With SMTP unconfigured the app
  logs the fact instead of the message, and link-only invites keep working.
- Assessment roster and export data stays owner/admin scoped, every roster import and results
  export writes an audit row (`assessment.invites.import`, `assessment.export`), and exported
  cells are formula-escaped.

### Not included
- Per-problem solved/attempt columns in the results export (CSV is roster-level).

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
