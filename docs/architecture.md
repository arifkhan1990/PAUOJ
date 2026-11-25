# Architecture

## Runtime components

| Component | Responsibility |
| --- | --- |
| `app` | Next.js pages, server components and `/api/v1` handlers |
| `worker` | BullMQ consumer that compiles/runs submissions and custom runs |
| `db` | PostgreSQL system of record |
| `redis` | BullMQ queue, rate limits, ephemeral run results |
| `judge-image` | Universal sandbox image with compilers and the harness |

The web app never executes submitted code. It writes submissions and enqueues
jobs. The worker is the only process with Docker access; the app image includes
the Docker CLI and the judge image contains the harness.

## Request flow: submission

1. The browser posts source, language and problem id to `POST /api/v1/submissions`.
2. The route validates the session, origin, body and rate limits.
3. `createSubmission` checks problem access (contest lock), contest registration,
   test count and source size, inserts a `QUEUED` row and enqueues a BullMQ job.
4. The API returns `{ id, status: "QUEUED" }`.
5. The worker atomically claims the row (`QUEUED -> JUDGING`) so duplicate jobs
   cannot judge the same submission twice.
6. The worker creates a temp workspace, writes the source and tests, compiles in a
   sandboxed container, then runs the harness in a second container.
7. The harness writes per-test results to a root-only results directory.
8. The worker updates the submission and per-test rows in one transaction,
   recomputes problem counters and marks the job complete.
9. The browser's EventSource receives `update` events and a final `done` event.

## Database model

```text
users 1─* sessions
users 1─* submissions *─1 problems
problems 1─* test_cases
problems *─* tags (problem_tags)
problems 1─* problem_resources *─0..1 users
problems 1─* problem_ratings *─1 users
problems 1─* problem_review_approvals *─1 users
problems 1─* problem_review_holds *─1 users
study_lists 1─* study_list_items *─1 problems
users 1─* learning_checkpoint_attempts (module_slug is static curriculum data)
contests 1─* contest_problems *─1 problems
contests 1─* contest_registrations *─1 users
contests 1─* contest_teams 1─* contest_team_members *─1 users
contests 1─* contest_team_invites *─1 users (invited + inviter)
contests 1─* contest_staff *─1 users
contests 1─* contest_staff_notes *─1 users
contests 1─* contest_problem_candidates *─1 problems
contests 1─* contest_problem_debuts *─1 problems
contests 1─* contest_sponsors *─0..1 users
contests 1─* contest_integrity_events *─1 users
contest_series 1─* contests
contests 1─* contest_clarifications *─1 users
contests 1─* contest_rating_changes *─1 users
contests 1─* virtual_contests *─1 users
contest_host_requests *─0..1 contests
assessments 1─* assessment_problems *─1 problems
assessments 1─* assessment_participants *─1 users
assessments 1─* assessment_invites (optional invite_id on the participant)
contests 1─* submissions (optional contest_id)
assessments 1─* submissions (optional assessment_id)
submissions 1─* submission_results *─0..1 test_cases
problems 1─* problem_comments *─1 users
problem_comments 1─* problem_comments (replies, one level)
problem_comments 1─* problem_comment_votes *─1 users
users 1─* notifications
users 1─* audit_logs
users *─* users (user_follows: directed, PENDING/ACCEPTED)
users *─* users (user_blocks: directed, severs follow edges)
conversations 1─* messages *─1 users
```

Key constraints:

- usernames and emails are stored lowercase with unique indexes;
- problem and contest slugs are unique;
- test positions and contest labels/positions are unique per parent;
- `submission_results` is unique per `(submission_id, position)`;
- deleting a problem cascades to its tests and submissions;
- deleting a contest sets `submissions.contest_id` to null so historical
  submissions survive;
- `is_public` mirrors `publication_status = 'PUBLISHED'` through the
  `problems_publication_public_check` constraint, and one approval per
  `(problem, reviewer, cycle)` plus at most one active hold per
  `(problem, reviewer)` (partial unique index) are enforced in the database.
- contest team names are unique per contest (case-insensitively in the
  service), invite codes are globally unique, and a user has one registration
  per contest;
- one pending/completed invite per `(team, invited user)`; later re-invites
  reuse the row and status transitions are guarded by team → invite locks;
- one contest crew row per `(contest, user)`; contest labels, positions and
  team sizes are constrained;
- a monthly series occurrence is unique per `(series_id, start_at)`;
- `contest_problem_debuts.problem_id` is the primary key, so a fresh contest
  problem can debut exactly once even under concurrent saves;
- hosting fees are constrained to 3,000–5,000 BDT and the request window must
  end after it starts.

Problem counters (`accepted_count`, `submission_count`) are denormalized for the
problem list and recomputed transactionally after every judged submission or
rejudge.

## Problem detail 404s

Unknown problem slugs are rejected in `src/proxy.ts` with a lightweight existence
query before the route renders. The page's own `notFound()` runs after the
`(app)/loading.tsx` boundary has started streaming, so it can render the not-found
UI but cannot change the response status; the proxy keeps that UI and sets a real
`404`. Existing slugs, including private, contest-locked and assessment-locked
problems, pass through to the page's own access and lock rules. Anonymous
`/contribute` requests also pass through to the sign-in gate; a signed-in request
for an unknown problem's contribute page gets the same `404`.

## Problem insights

The problem page aggregates verdict and language counts directly from
`submissions` and computes the rankboard from each solver's first accepted
submission. Assessment submissions are excluded from both the counts and the
rankboard, and the rankboard also excludes virtual contests, so private test
activity never appears there; the whole insights block is hidden while a
contest or assessment context is active.

## Submission analysis

`/submissions/:id` adds a LeetCode-style analysis block for accepted, settled
runs: runtime and memory percentiles plus a runtime histogram with the run
marked. The comparison sample is every accepted submission on the same problem
with the same language, excluding assessment and virtual-contest rows. When a
metric has fewer than five same-language rows, the scope widens to all languages
and the payload reports `scope: "all"` so the UI can label it. `beats` is the
share of the sample strictly slower (runtime) or larger (memory) than this run,
so ties do not inflate the percentile, and it is `null` below five samples.
Buckets start at zero with a `1/2/5 × 10^n` width capped at 24 buckets; the last
bucket is open ended. Neither sample query is cached: the aggregate is cheap at
current scale and the freshness matters more.

Analysis is suppressed for assessment submissions and for submissions whose
contest is still running, matching the problem-insights lock, so a live round
never reveals how many accepted runs exist or how fast they are. Contest runs
become visible once the round ends.

Each submission also has at most one private note owned by its author
(`submission_notes`, primary key `submission_id`). Notes are owner-only in the
detail service and the API, never serialized for public/assessment viewers, and
cascade away with the submission or the user.

## Problem discussions

Comments are stored in `problem_comments` with an optional `parent_id`; the API
enforces one reply level. Votes live in `problem_comment_votes` with one row per
`(comment, user)` and values `-1`/`1`. Scores are summed on read, comments are
soft-deleted, and deleting a top-level comment also hides its replies. Admin
deletions write an `audit_logs` entry.

Discussion is hidden and the API returns `DISCUSSION_LOCKED` whenever the
problem belongs to a running contest or assessment, including the caller's own
registered round, so statements and solutions cannot leak during a competition.

## Problem publication review

New problems are gated by a two-setter publication review (v0.7.0).
`problems.publication_status` (`problem_publication_status`: `DRAFT`,
`IN_REVIEW`, `CHANGES_REQUESTED`, `PUBLISHED`) drives the workflow, and
`is_public` is no longer a free-form flag: the check constraint
`is_public = (publication_status = 'PUBLISHED')` keeps the two in step, so the
public problem list — which filters on `is_public` — only ever shows published
problems. `published_at` records the publish time and `review_cycle` counts the
review rounds.

### State machine

| Action | Actor | From | To |
| --- | --- | --- | --- |
| `submit` | author/admin | `DRAFT` | `IN_REVIEW` (`review_cycle + 1`) |
| `approve` | eligible reviewer | `IN_REVIEW` | `IN_REVIEW`, or `PUBLISHED` when every gate passes |
| `hold` | eligible reviewer | `IN_REVIEW` | `CHANGES_REQUESTED`; active approvals become `SUPERSEDED` |
| `respond` | author/admin | `CHANGES_REQUESTED` | `CHANGES_REQUESTED` (hold becomes `ADDRESSED`) |
| `resolve` | hold raiser/admin | `CHANGES_REQUESTED` | `IN_REVIEW` when no `OPEN`/`ADDRESSED` hold remains (`review_cycle + 1`) |
| `reopen` | hold raiser/admin | `CHANGES_REQUESTED` | `CHANGES_REQUESTED` (hold back to `OPEN`) |
| `publish` | author/admin | `IN_REVIEW` | `PUBLISHED` when every gate passes |
| `reopen_publication` | author/admin | `PUBLISHED` | `DRAFT`; hidden from the public list, active approvals superseded; edit and submit again |

`PUBLISHED` is terminal until someone starts a re-review. Approvals are counted
per `review_cycle`, so every cycle change (submit or resolve) starts a fresh
round, and a hold supersedes the approvals collected so far in the current
cycle. Problem content is editable only in `DRAFT` and `CHANGES_REQUESTED`;
while `IN_REVIEW` or `PUBLISHED`, `PUT /admin/problems/:id` returns `409`, so an
author cannot replace the statement or test set after approvals have been
recorded. The same guard applies to the contribution pipeline: statement and
test proposals are rejected while `IN_REVIEW`/`CHANGES_REQUESTED`, and a
`PUBLISHED` problem accepts only `EDITORIAL` proposals. A reviewer raises a hold
when a fix is needed.

Starting a re-review withdraws a published problem: it becomes `DRAFT`, leaves
the public list, and its active approvals are superseded. The author edits it,
submits it for review, and two fresh approvals are required before it returns to
`PUBLISHED`. The previous `published_at` is kept as the last publication date
until the next publish overwrites it.

### Gates

Publishing (and an `approve` that publishes) requires all of:

- two `ACTIVE` approvals in the current cycle (`REQUIRED_PUBLICATION_APPROVALS = 2`);
- a non-empty editorial;
- at least one test case added by a reviewer (recorded as `tests_added`);
- at least one approval carrying a reference solution (`solution_source`);
- no hold in `OPEN` or `ADDRESSED`.

`evaluatePublicationGates` in `src/server/services/problem-review-policy.ts`
computes this checklist and returns it as `gates` with a `missing` list, so the
review workspace can show exactly what is still required.

### Authorization

| Action | Who |
| --- | --- |
| Review: `approve`, `hold` | `TEACHER`/`ADMIN`, and not the problem author |
| `submit`, `respond`, `publish` | the problem author, or an `ADMIN` acting for them |
| `reopen_publication` | the problem author, or an `ADMIN` acting for them |
| `resolve`, `reopen` | the reviewer who raised the hold, or an `ADMIN` |
| Read the workspace (`GET /problem-reviews/:problemId`) | the author, admins, the current cycle's approvers after publish, and other staff while it is in review; unrelated users never see drafts |
| Edit content (`PUT /admin/problems/:id`) | the author or an admin, only while `DRAFT` or `CHANGES_REQUESTED`; `IN_REVIEW` and `PUBLISHED` return `409` |

A reviewer cannot approve their own problem: the unique
`(problem_id, reviewer_id, cycle)` index plus a service check turn a second
approval into a conflict. Nobody can approve while an `OPEN` or `ADDRESSED`
hold exists.

### Data model

- `problem_review_approvals` — one row per approval: `problem_id` and
  `reviewer_id` (both cascade), `cycle`, `status` (`ACTIVE`/`SUPERSEDED`),
  optional `note`, `solution_language` and `solution_source` (the reference
  solution), `tests_added`, `editorial_provided`, timestamps. Unique per
  `(problem, reviewer, cycle)`; indexed by `(problem, cycle, status)` for the
  gate count and `(reviewer, created_at)` for the credit query.
- `problem_review_holds` — one row per hold: `problem_id`, `reviewer_id`,
  `cycle`, `status` (`OPEN` → `ADDRESSED` → `RESOLVED`), the required `note`,
  `author_response`/`responded_at`, `resolution_note`/`resolved_by_id`/
  `resolved_at`, `reopen_note`/`reopened_at`, timestamps. A partial unique
  index allows at most one `OPEN`/`ADDRESSED` hold per `(problem, reviewer)`.

### Consistency and concurrency

Every action is written as one unit over the problem, approval and hold rows:
the status change, the approval/hold row and `review_cycle` move together, and
the `problems_publication_public_check` constraint guarantees `is_public` can
never disagree with `publication_status` inside that write. The unique and
partial unique indexes are the hard backstop against races — a duplicate
approval in the same cycle or a second active hold by the same reviewer fails
at the database and surfaces as a conflict, and gate re-checks always read the
current cycle's `ACTIVE` rows before writing.

### Notifications, audit and credit

Review events reuse the `CONTRIBUTION` notification type and the existing
review email preferences (`emailReviews`, `reviewEmailFrequency`): submit
notifies every eligible reviewer except the author; each approval notifies the
author with progress; hold notifies the author and every other eligible
reviewer; respond notifies the hold raiser and the reviewers; resolve notifies
the author (and, when the review reopens, every eligible reviewer); reopen
notifies the author; publish notifies the author and every approver;
`reopen_publication` notifies the author and every other eligible setter.
Dedupe keys follow
`problem-review:<problemId>:<cycle>:<event>[:<holdId>]` on the
`(user_id, dedupe_key)` unique index, so retries cannot double-send.

The approval and hold rows are the audit trail for the workflow — actor, cycle,
notes, response, resolution and reopen fields with timestamps — which backs the
review workspace, the inbox and the publication status shown in the admin
problem list. On publication every approving reviewer earns contribution credit,
surfaced as the "published review credits" section of the review inbox
(`listProblemReviewCredits`).

### Backfill

Migration `0025` added the columns and backfilled existing rows: problems that
were `is_public = true` became `PUBLISHED` with `published_at = created_at`,
everything else became `DRAFT`. Existing public problems therefore stay public
without a new review, and the check constraint holds for every row.

## Notifications and email

`notifications` stores in-app messages with an optional `dedupe_key`; the unique
`(user_id, dedupe_key)` index makes contest starts and submission verdicts
idempotent across worker retries. Verdicts are created by the judge worker when a
submission finishes, contest-start notices are swept by the worker every minute,
and clarification notices are created by the clarification service.

Email copies are only sent for verified addresses and enabled categories
(`email_verdicts`, `email_contests`, `email_clarifications`). Each message links
to `/unsubscribe?token=…`; the token is a per-user random value stored on the
user row, and the unsubscribe endpoint disables the requested category without
requiring a session.

Transactional mail uses the shared 600px table-based shell in
`src/server/mail-template.ts` — dark brand header, badge, CTA, fallback-link
box, hidden preheader, mobile media query and a refined footer. Verification,
password reset, assessment invite, review digest and notification builders all
use it, with plain-text alternatives. The shell deliberately loads only two
same-origin brand asset families — the PAU OJ logo mark
(`/brand/pauoj-mark.png`) and four footer social icons
(`/brand/social/{facebook,x,linkedin,github}.png`) — referenced with absolute
app-origin URLs and alt text beside a text wordmark fallback. It uses no web
fonts, external CSS or remote/tracking images, so it stays readable when a
client blocks images. Social links are placeholders (`href="#"`) until real
accounts exist.

## Problem extras, study plans and daily challenge

Community ratings store half-star values as integers `1..10` in
`problem_ratings`, one row per `(problem, user)`, with the summary averaged on
read. Verified resources live in `problem_resources` and are editable by admins
and the problem author. Related problems are computed from shared tags with the
same restriction rules as the problem list, so contest problems never leak.

Study plans are ordered `study_lists` → `study_list_sections` → `study_list_items`. Each
plan carries a level, an optional admin time estimate and a featured flag; the effective
duration falls back to a difficulty-based estimate when the admin leaves it blank.
`study_list_enrollments` stores one row per `(user, plan)` for the "My plans" shelf. Solved
and attempted state, section progress, difficulty mix, topics and the next unsolved problem
are all derived from non-assessment submissions rather than stored per item. Items created
before sections existed have a null `section_id` and render as a leading "General" section.
Public plans only load published public problems, so withdrawing a problem removes it from
the plan instead of leaking it.

Signed-in learners can create up to ten private plans (`created_by`); the proxy verifies the
session hash and allows only the owner to open a private `/lists/:slug`, while everyone else
gets a real 404. `study_list_item_notes` stores one private note per `(user, plan, problem)`
and is never exposed to another viewer. A note for a problem removed from a
plan is not rendered, but is preserved so it reappears if the problem is
re-added. The catalog and detail use a fixed set of aggregate queries (no N+1);
cache the public plan structure or paginate when the number of public plans
grows beyond roughly 50. Do not cache the item list without also invalidating on
problem publication changes: the public loader must keep hiding withdrawn
problems. The daily challenge is deterministic per UTC date (an MD5 ordering
over eligible public problems), and the streak reuses the accepted-submission
activity heatmap. Category, subcategory and company tags live on `problems`;
companies use a GIN index.

## Learning tracks

The learning curriculum is static TypeScript metadata in `src/lib/learning/`
(tracks, topics, concept notes and ordered problem slugs) layered on the normal
problem tables. Seeded learning problems use `category = "Learning track"` and a
module/topic `subcategory`, so they participate in the existing filters, ratings,
discussions and editorial tabs. Progress is derived on read from accepted,
non-assessment submissions; assessment attempts never count.

The curriculum has three track kinds. `core` tracks unlock sequentially,
`sql` labs are project tracks with their own entitlement rules, and `tools`
tracks are the free, always-open career toolkit (Git & GitHub, Docker & CI/CD).
A `tools` track has no purchase and is never blocked by the preceding track's
checkpoint. Its topics use the `WORKSHOP` practice tier: a story-driven concept
note with a hands-on lab, two guided drills, two solo drills, and a normal
three-problem timed checkpoint. The judge still derives progress and badges from
accepted submissions, so the toolkit behaves like every other learning module.

Every live topic also has a data-driven visual explainer. The curriculum stores
only a small config (`kind`, Bangla title/caption, three to five steps and a few
labels/values/edges); reusable server-rendered SVG/CSS components turn it into an
animated diagram. The animated stage is decorative, the same sequence is exposed
as a visible ordered step list, and `prefers-reduced-motion` freezes the motion in a
readable final state. There is no client-side JavaScript or chart library, and
the module page reuses the first topic's visual as a compact preview.

A timed checkpoint stores one `learning_checkpoint_attempts` row per
`(user, module)`. Starting is authenticated and same-origin protected. The
service checks accepted submissions whose `created_at` falls inside the attempt
window and marks `completed_at` with a conditional update, so completion is
idempotent and safe to evaluate on page read. An expired attempt can be
restarted; a completed one cannot. The badge is derived from `completed_at` and
is not a separate achievements table.

Tracks unlock sequentially: track 1 is open, and track N requires the previous
track's completed checkpoint. The module summary carries `locked` and
`unlockHint`; the checkpoint start service enforces the same rule so the API
cannot bypass the UI. Locked module/topic pages render a gate, and profiles
show every live track badge as earned or locked.

## Authentication and authorization

- Passwords are hashed with Argon2id (`m=19456, t=2, p=1`).
- Sessions are opaque 32-byte tokens in an HttpOnly, SameSite=Lax cookie.
- Only the SHA-256 hash of a token is stored in `sessions`.
- Every mutation checks same-origin requests in addition to SameSite cookies.
- Roles: `USER` (coder), `TEACHER` and `ADMIN`. Admin routes enforce the
  role server-side. Teacher routes allow `TEACHER` and `ADMIN`, and content
  endpoints scope teacher writes to problems they authored, contests they
  created and assessments they created. Attaching problems to a teacher contest
  or assessment is limited to public problems plus the teacher's own problems.
- Suspended users fail session lookup immediately; suspending a user deletes
  their sessions.
- Password changes delete all sessions, then issue a fresh one.
- Email verification and password-reset links are random 32-byte tokens; only a
  SHA-256 hash is stored in `auth_tokens`, with a 24h/1h expiry and single use.
- Verification emails are non-blocking at registration; unverified users see a
  banner and can resend. Password reset revokes all sessions and marks the email
  verified.
- Contest source code is visible to the owner and admins while the contest is
  active, and to everyone after it ends.
- Assessment submissions stay private to the candidate and administrators; they
  are not listed on public profiles or the public submission feed.

## Auth pages

Login, registration, password recovery and email verification share a split
modal-style card: a dark brand panel with a sample profile preview, and a
theme-aware form panel. Sign-in and registration expose tabs that preserve the
`next` redirect. Fields use the shared `AuthField` component, errors use
`AuthError`, and the password-strength meter is client-side only. These are
full pages styled as a modal card, not a route-level overlay.

## Contest access rules

- Upcoming contests hide the problem set from non-admins.
- A problem in a running public contest is hidden from the public problem list
  and returns `CONTEST_LOCKED` unless the user is registered, belongs to a
  registered team, or is an admin.
- Submissions made from a running registered contest are auto-tagged with
  `contest_id`, so they count toward the scoreboard.
- Practice submissions after the contest do not affect the final standings.
- After a public round ends, its problem statements stay reachable from the
  contest page even when the problem is still private in the practice list.
  Publishing the problem to the public archive stays a separate review step.
- Contest crew (`contest_staff` status `INVITED` or `ACCEPTED`) cannot
  register, join a team or submit. While a round is running, non-director crew
  (`SETTER`, `EDITORIAL`, `TESTER`, `OBSERVER`) also get `CONTEST_CREW_LOCKED`
  on the problem page; only `DIRECTOR` may preview statements.
- Editorials are sealed for everyone, including admins and authors, while the
  problem has a running contest context.
- Contest problems display a per-view watermark (`display name`,
  `@username`, contest slug, start date) and the statement area logs
  copy/paste/print/context-menu/tab-hidden/fullscreen-exit signals. This is a
  deterrent and traceability layer, not a screenshot prevention claim.

## Contest formats and teams

`contests.format` is `SINGLE` or `GROUP`; `team_size` is constrained to 2–6.
Solo contests keep one registration per coder. Team contests form through
`contest_teams`, `contest_team_members` and `contest_team_invites` before the
start. The captain can invite an exact username directly; the invited coder sees
the invite on the contest page and accepts/declines it. Accepting re-checks the
pre-start window, crew exclusion, one-team-per-coder and capacity under a
per-coder advisory lock, then inserts the member and contest registration. A
shareable 8-character code remains as a fallback path. Team names are unique per
contest case-insensitively, the roster is capped by `team_size`, and leaving
before the start transfers captaincy or disbands an empty team. Submission
penalties and first blood are aggregated per team on the scoreboard. Team rounds
are unrated because individual Elo cannot represent a team result; virtual
replay is solo-only.

Contest pages use an optional `contests.banner_url` (admin or host request);
without it the UI renders a branded gradient/pattern banner. The page always
shows a full description, format/eligibility, organiser rules, the standard
platform policy and a prizes/recognition block. Missing prize details render an
explicit “not announced” state instead of an empty section.

## Contest crew and fresh problems

`contest_staff` stores the crew roles (`DIRECTOR`, `SETTER`, `EDITORIAL`,
`TESTER`, `OBSERVER`). The creator is inserted as an accepted director;
admins/directors manage the roster; crew members get in-app notices and cannot
compete. A contest problem's author and any pending/approved editorial or
test-case contributor are treated as implicit crew too, so they cannot compete
even without a staff row. `contest_staff_notes` is the internal crew thread and
`contest_problem_candidates` is the proposal/shortlist slate; only directors
and setters can propose, and only directors/admins decide.

A contest with `requires_fresh_problems = true` accepts only problems that
(a) never appeared in another contest, (b) have no `contest_problem_debuts` row,
and (c) are not public yet. The save transaction reserves one debut row per
problem; a concurrent save gets a 409. Debut history stays until the contest is
deleted — turning the policy off does not release a problem for reuse. Existing
contests were backfilled with the policy off. Contest-only problems are
published to the practice archive through the normal problem publication review
after the round.

## Monthly series and hosting

The worker ensures the next `contest_series` occurrence every hour. The single
`monthly-third-sunday` row creates an official, public, 90-minute contest on the
third Sunday at 10:00 Asia/Dhaka. Idempotence comes from the
`(series_id, start_at)` unique index; the contest starts with a sealed problem
set until the director attaches fresh problems.

Any signed-in user can submit `contest_host_requests` with a complete data pack,
a fee of 3,000–5,000 BDT and a payment TrxID. The host form shows the
platform payment methods from `PAYMENT_*` (the same bKash/City Bank accounts as
premium modules). Admins review the request; approval confirms the payment
reference and marks it paid. Conversion creates a private draft contest with
the requester as director and the fresh-problem policy on. The contest team then
attaches the problems and publishes it.

## Sponsors and integrity events

`contest_sponsors` requests are always `PENDING`; only `APPROVED` sponsors are
public, sorted title → gold → silver → community. Logos and links must be
http(s). Admins approve or reject (rejection needs a note) and the requester is
notified.

Registered participants can post `contest_integrity_events` while a round runs:
copy, paste, context menu, print, tab hidden, fullscreen exit and rapid submit.
The server verifies the contest is running, the actor is registered (solo or
team), the actor is not crew and the problem belongs to the contest. Events
store only the type, problem and a short detail string; the admin operations
page aggregates totals and the most active users. They are review signals, not
automatic penalties.

## Contest clarifications and ratings

Contest clarifications live in `contest_clarifications`. Registered
participants (and admins) can read and ask while a contest is upcoming or
running; public ended contests are read-only for everyone, while private
contests stay limited to participants and admins. Answers are allowed for
admins, the contest creator and the problem author, and each answer writes an
audit entry.

Ratings finalise one hour after a contest ends. The hour is a review and
rejudge window: contest submissions can still be rejudged, and the finaliser
defers while any contest submission is queued or judging (virtual replays are
ignored). A Redis-locked worker sweep runs every minute and finalises due
contests in `(end_at, id)` order; contest/standings page views also run a
throttled, ordered fallback that finalises only the earliest due contest, and
`pnpm ratings:finalize` can drain the queue manually. The finaliser locks the
contest row, re-checks `rated_at` and that no earlier contest is unfinalised,
computes the ICPC scoreboard, keeps only non-banned participants with at least
one contest submission, uses competition ranks (ties share a rank, the last
place scores zero), and applies Elo with `K=32`, zero-sum integer
normalisation and a floor of 100. Participant user rows are locked in ascending
id order so two contests finalising at once cannot lose a rating update. Group
contests are marked processed without rating changes, but also wait for pending
verdicts before their review closes.

Changes are written to `contest_rating_changes` and `users.rating` in one
transaction; `rated_at` makes the operation idempotent. Once `rated_at` is set,
contest submissions cannot be rejudged and the contest problem set/schedule is
locked; descriptive metadata stays editable. Rating history rows use the
contest end date as `created_at`, so profile charts keep the contest timeline
even though finalisation happens one hour later. `pnpm ratings:audit` checks
history sums, old→new chains, `users.rating` drift, floor violations,
finalised/unfinalised consistency and overdue contests; the baseline exits
clean. `pnpm ratings:recompute` is a dry-run-by-default repair that replays
stored rating changes chronologically with the current engine; `--apply` fixes
historical rounding/rank drift after a backup.

## Dashboards and roles

Every signed-in account has a coder dashboard at `/dashboard`: an identity card
with the current rating tier, next-tier runway and next badge; rating and
global-rank metrics; the rating trajectory; daily challenge; upcoming contests
with countdowns; topic mastery derived from problem tags; a difficulty coverage
ring; recent contest results with rating deltas; continue-practice list; a
consistency heatmap and recent submissions. It is composed from the existing
profile, contest, daily-challenge and submission services, so it never stores a
second copy of analytics. Topic mastery joins a user's public submissions with
problem tags and the public tag totals, then keeps the ten strongest topics.

`TEACHER` accounts get `/teacher`, a separate workspace for problems, contests
and assessments they own. The teacher overview aggregates only their content and
enrollments; list, results, create and edit pages reuse the admin forms with the
teacher routes as their base path. Admins can open the teacher workspace as a
preview; its lists stay scoped to the previewing account, while the admin panel
remains the place for platform-wide content.

`ADMIN` accounts keep `/admin` for the whole platform. All three panels share
`DashboardFrame`, a responsive sidebar/topbar shell with role-specific
navigation, active states, breadcrumbs, theme and account controls and a mobile
drawer. Dashboard routes live in their own route group, so they render without
the public site header and footer while keeping a link back to the public site.

## Changelog

`/changelog` is generated from `CHANGELOG.md` at request time. The parser in
`src/lib/changelog.ts` turns `##` release headings into release cards and `###`
headings into grouped change sections (Added, Changed, Fixed, Security and so
on). The page marks the package version as the current release with a `Current`
marker, labels older releases as previous, and shows every section with an icon,
count and inline code formatting. The dashboard footer links here, and the
production image copies `CHANGELOG.md` so the page works in the standalone
container.

`/docs` uses the same dark reference layout as the changelog. Its content lives
in `src/lib/docs-content.ts` as category-tagged sections; `DocsView` renders the
hero, grouped navigation, category headings, topic cards, checklist and support
card, so the guide can be reordered without touching the layout. The reference
layout is a viewport-height shell: the left navigation stays fixed and only the
right column scrolls, with a compact reference footer at the end. A shared
`useActiveSection` scrollspy watches the right column and highlights the active
guide section or release in the left menu.

## Profile dashboard

Profiles are derived on read from `users`, `submissions`, `problems` and
`contest_rating_changes`; there is no extra profile analytics table. The
dashboard adds:

- a rating trajectory with the current tier, global rank among rated users,
  top-percent slice, peak, a tier runway and a 100-point rating-distribution
  histogram;
- a compact solved-problem coverage ring that leaves the unsolved share grey,
  with a 2x2 grid of difficulty tiles showing solved/public totals;
- a 4x2 stat board with submission/solve counts, hardest attempted and solved
  problem points, contest attendance/rating and problem-setting/contest-create
  counts;
- a milestone cabinet of hexagonal medals: earned badges keep their gradient
  art and glow, locked badges stay monochrome with their progress row, and a
  footer surfaces the closest unlock;
- a submission-verdict pie and a multi-language donut rendered as static SVG on
  the server, so they do not depend on chart hydration;
- a green consistency heatmap with Mon/Wed/Fri/Sun labels, one block per
  calendar month separated by a column gap, active days, current streak and
  longest streak.

The streak milestone uses the longest accepted-day run in the rolling year, so
a badge stays earned after a streak ends. Rating rank counts users with at least
one `contest_rating_changes` row; unrated users see the rating process empty
state instead of a fabricated rank.

### Profile identity and social graph

`users.avatar_preset` stores one of the twelve preset ids (`cat`, `dog`, `bird`,
`fish`, `rabbit`, `squirrel`, `turtle`, `panda`, `ghost`, `rocket`, `bot`,
`gamepad`) or `null`. Uploaded photos live in `user_avatar_images` as `bytea`
with the detected MIME, parsed dimensions and SHA-256; keeping bytes out of
`users` means session and list queries stay small. `users.avatar_image_updated_at`
is both the "has an upload" flag and the cache-busting version in
`/api/v1/users/:username/avatar?v=<epoch>`, so the route can answer with a
one-year immutable cache. The browser crops/resizes to 512×512 and strips EXIF
before upload; the server re-validates magic bytes and dimensions, caps the
file at 1 MB/2048px, and rate limits uploads. Choosing a preset deletes the
uploaded row and clears the version in one transaction. `UserAvatar` renders the
upload first, then a preset, then the deterministic initials/colour fallback;
every shared user projection carries the two avatar fields so pages never issue
an N+1 avatar query.

`users.website`, `users.github` and `users.linkedin` are optional display links.
They are normalized at the API boundary by `src/lib/profile-links.ts` (website
host/path, GitHub handle, LinkedIn `in/slug`), stored as `http(s)` URLs and
rendered only as external links with `rel="me ugc nofollow noopener noreferrer"`. The app
never fetches these URLs, so they add no SSRF surface.

`user_follows` stores one directed edge per `(follower_id, following_id)` with a
composite primary key, a `follower_id <> following_id` check, cascading user
foreign keys and `(follower_id|following_id, status, created_at)` indexes for
the accepted and pending lists. Since migration 0043 an edge carries
`status = PENDING | ACCEPTED` and `accepted_at`; existing rows were backfilled
as accepted. `POST /users/:username/follow` creates a request, `DELETE`
cancels/unfollows, and accept/decline mutate the pending row atomically with
`UPDATE/DELETE ... RETURNING`. A mutual request auto-accepts both edges. Only
accepted edges count toward follower/following totals and the two connection
lists (20 per page); banned and blocked members are excluded. The first request
inserts one in-app `FOLLOW_REQUEST` notice per follower pair and acceptance one
`FOLLOW_ACCEPTED` notice; the unique `dedupe_key` prevents repeats, and
cancel/decline clears the notice so a later request can notify again. The
profile hero and `/users/:username/connections` read the same service, so
counts and rows stay consistent. The proxy validates the username (and that the
account is not banned) before the streaming boundary, so unknown profiles and
connections pages return a real `404` instead of a soft-404, and mixed-case
usernames redirect `301` to the lowercase canonical. Profiles also expose
lowercase canonical and Open Graph/Twitter metadata with the brand image, and a
client share button copies or shares the canonical profile URL.

### Presence, blocking and direct messages

`users.last_active_at` records activity at most once a minute: `getCurrentUser`
and `createSession` call a Redis `SET NX EX 60` throttle and then update the
row, while a signed-in `PresenceHeartbeat` posts `/presence/heartbeat` every 90
seconds so an open tab stays online. A Redis outage falls back to a per-process
`Map` with the same 60-second window. Failures are logged and never block auth.
A profile is "Online now" inside a five-minute window; otherwise the server
computes a floor-based relative label (`Last active 7m/3h/2d/3w/4mo/1y ago`)
and a cleared timestamp reads `No recent activity`. Exact timestamps are never
serialized. Profiles, connection/request lists, message lists/threads and both
rank boards show the same label (rank uses one batched users query plus the
shared presence map, never an N+1). Migration 0044 backfills existing users from
their account/session/submission history. `presence_visibility` (`EVERYONE`, `FOLLOWERS`, `NOBODY`, default
`EVERYONE`) is enforced in `presenceForTarget`; `FOLLOWERS` requires an accepted
follower edge, blocking forces `HIDDEN`, and the owner always sees their own.

`user_blocks` is a directed pair with a self-check and cascading FKs. Blocking
runs one transaction that inserts the block and deletes every follow edge in
both directions, then refuses re-follow/re-request and hides presence. Block
checks are repeated inside follow/open/send transactions to close
check-then-write races. `canMessage` is true only when an accepted edge exists
in either direction and neither side blocked the other.

`conversations` stores exactly one row per unordered pair (`user_a_id <
user_b_id` check plus a unique pair index) and `messages` stores plain-text
bodies constrained to 1–2000 characters. Sending requires participation and no
block in either direction; a new conversation additionally needs an accepted
follow edge, while an existing conversation remains replyable after an unfollow.
`conversation_mutes` is a per-user toggle that keeps the conversation listed but
zeroes its unread count and suppresses its MESSAGE notices. When either side
blocks — or the counterpart is banned — the conversation disappears from the
inbox, unread totals exclude it and the thread returns `404`. Block also marks
the blocker's pending request and message notices read. The header badge reads a
15-second Redis cache (`messages:unread:<id>`) that every write path invalidates;
a Redis outage falls back to the indexed DB count. `/messages` and thread SSR
requests are rate limited (120/240 per minute per user) and the JSON API rejects
bodies over 1 MiB with `413`. Block, follow, open and send take a
transaction-scoped advisory lock on the user pair so a concurrent block cannot
slip a follow or message through.
Threads are 30 messages per page counted from the newest; lists are 20 per page
and unread counts come from the partial unread index. Read receipts are
`messages.read_at`, deletion is `messages.deleted_at` (bodies are masked on every
read), and the first unread message of a burst inserts one `MESSAGE` notice
unless the recipient muted the conversation or disabled `notify_messages`;
deleting a message replaces the notice preview with "This message was deleted.".
All message mutations are same-origin, rate limited and participant-scoped
(foreign ids return `404`).

### Moderation reports and retention

`social_reports` stores one row per report with reporter/target, kind, reason,
optional details, a snapshot excerpt, optional conversation/message references
(`ON DELETE SET NULL` so removing a message or conversation keeps the report),
status, resolver and resolution time. A message report must reference a message
sent by the target; a follow-request report must reference a pending request
from the target to the reporter. Duplicate reporter/kind/target/message reports
inside 24 hours return `409` thanks to an advisory lock around the re-check and
insert, submissions are limited to 10 per hour, and resolving/dismissing is
open-only, atomic with its audit entry, and notifies the reporter.
`/admin/social-reports` is the admin queue; while reports are open, a worker
sweep sends admins one grouped in-app + email digest per UTC hour (deduped), so
individual reports never flood the inbox.

Retention runs in the worker every 24 hours and applies by default: messages
older than `SOCIAL_MESSAGE_RETENTION_DAYS` (365), closed reports older than
`SOCIAL_REPORT_RETENTION_DAYS` (730) and `last_active_at` older than
`SOCIAL_PRESENCE_RETENTION_DAYS` (365) are removed/cleared in bounded
transactions after their empty conversations are swept. Set
`SOCIAL_RETENTION_AUTO_APPLY=false` for a dry-run/log-only window. The
`pnpm social:retention [--apply]` CLI uses the same service for manual runs and
prints counts only, never row contents.
Rate limits use Redis Lua (`INCR` + TTL in one atomic call) and fall back to a
bounded per-process counter when Redis is unavailable.

### Profile details and private contact data

`users` also carries the profile-detail fields: `current_status` (STUDENT,
EMPLOYED, FREELANCER, JOB_SEEKER, OTHER), `company_name`, `job_title`, `skills`
(a PostgreSQL `text[]`), and the private `address`, `phone` and `tshirt_size`.
Skills are trimmed, control characters are stripped, duplicates are removed
case-insensitively, and the list is capped at 12. Phones accept Bangladeshi
`01…`/`8801…` numbers or international `+` numbers and are stored normalized.

The visibility split is enforced in code and in types:

- **Public:** `currentStatus`, `companyName`, `jobTitle`, `skills`. `getProfile`
  selects only these fields, `ProfileStats.user` has no private members, and the
  public profile renders them as a status pill, company line and skill chips.
- **Private:** `address`, `phone`, `tshirtSize`. They are part of `SafeUser` for
  the owner's settings page and of `AdminUserDetail`, which is loaded by
  `/admin/users/:id` behind `requireAdmin`. The admin page uses an explicit
  column whitelist and is `noindex`. No public endpoint selects a private field,
  so public profile HTML and RSC payloads cannot contain them.

`skills` is an array on `users` rather than a join table because the profile only
displays the list. Add a normalized skill table plus a GIN index if skill-based
search, matching or analytics becomes a requirement.

## Virtual contests and integrity

Virtual replays live in `virtual_contests`, one row per `(contest, user)`.
Submissions are tagged with `virtual_contest_id` and excluded from official
standings, contest submission feeds and rating finalisation. The virtual timer
starts at the user's start time and uses the original contest duration.

Contest standings can hide activity after `end_at - freeze_minutes` while the
round is still running; admins always see live data. The admin integrity page
compares submissions with a token-shingle Jaccard score and lists pairs of
different users above the 75% threshold. It is a review signal, not an automatic
penalty.

## Coding assessment rules

- An assessment is private until an admin publishes it.
- A candidate joins either with the shared access code (`OPEN_CODE` mode) or through a personal
  invite link (`INVITE` mode, which refuses a bare code). The participant row stores their
  personal `started_at` and `expires_at` (session length or assessment end, whichever is
  sooner).
- Assessment problems are hidden from public lists and return `ASSESSMENT_LOCKED`
  unless the caller is an active participant or an admin.
- Submissions from an assessment are tagged with `assessment_id`; source code is
  hidden from other users while the assessment is running.
- Candidates can finish early. Submissions stop at `finished_at` or `expires_at`.
- Admin results aggregate first-accepted points, solved count, attempts and
  participant status.

## Assessment invites and join modes

Candidate-level delivery on top of the shared code (v0.6.0 — see `CHANGELOG.md`).
Invite email is manual and one candidate at a time: there is no send-all, no worker sweep and no
scheduled retry or reminder.

**Data model.**

- `assessments.join_mode` — `OPEN_CODE` (default) or `INVITE`. `INVITE` refuses a bare access
  code with `INVITE_ONLY`.
- `assessment_invites` — one row per roster entry: required opaque `candidate_ref` (student,
  roll or applicant ID; case- and space-insensitive uniqueness per assessment), optional `email`
  (a delivery channel, never the identity key), optional `candidate_name` and free-text
  `group_label`, `token_hash`, `status` (`UNSENT | SENT | OPENED | CLAIMED | REVOKED | EXPIRED`),
  send-window and failed-claim counters, and `claimed_by_user_id`, `claimed_at`,
  `claimed_assurance`. One email may appear only once per assessment.
- `assessment_participants` gains `invite_id` (unique when set) and an `assurance` snapshot.
  Presence of `invite_id` is the identity source; existing rows are untouched and no backfill
  runs.

**Tokens.** 32 CSPRNG bytes in base64url; only the SHA-256 hash is stored. The raw token leaves
the server in exactly two places: the rotate response the roster panel copies into a URL, and the
body of an invite email. The invite page and the resolve API send `Referrer-Policy: no-referrer`,
`Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow` (a `next.config.ts` header rule
plus route headers) so the token cannot leak through a `Referer` header, a cache or a crawler.

**Manual send and revoke.** `sendInviteEmail` (`POST .../invites/:inviteId/send`, one invite at a
time) loads the owned assessment and invite, refuses a missing email (`INVITE_NO_EMAIL`), an
unpublished or ended assessment, and a claimed/revoked/expired invite (`INVITE_NOT_SENDABLE`),
then acquires a per-invite send lock (120 s, so a concurrent request gets `INVITE_SEND_LOCKED`)
and consumes one slot of a three-per-hour DB window on that invite
(`INVITE_SEND_RATE_LIMITED`) in a single conditional statement. It rotates the token — the
previous link stops working — sends through `sendMail` with the URL in the message body only, and
records `SENT` (`sent_at`, `last_sent_at`, `send_count`, lock released). A failed send releases
the lock but keeps the consumed window slot and returns `INVITE_SEND_FAILED` (502) so the
organiser copies the link instead; the API response carries `email: null` and no URL. Nothing in
this path runs in the worker: there is no sweep, no retry and no reminder. With SMTP unconfigured
the mail layer returns false, and its development fallback logs the recipient and subject with
`body: "[omitted]"` — invite, verification and reset bodies carry tokens and are never written to
logs. `revokeInvite` (`POST .../invites/:inviteId/revoke`) sets `REVOKED` idempotently and clears
the send lock; a claimed attempt keeps its participant row and its results-export row, while the
link stops being claimable.

**Claim matrix.** `POST /assessments/:slug/join` with `{ token, candidateRef? }`; `GET` on the
invite route is read-only and never starts a timer or creates a participant.

| Invite email | Signed-in account | Recorded assurance |
| --- | --- | --- |
| set | matches, email verified | `VERIFIED_EMAIL` |
| set | matches, unverified | `EMAIL_MATCH` |
| set | missing or different email | refused, `INVITE_EMAIL_MISMATCH` (403) |
| none | submitted `candidateRef` matches | `REF_MATCH` |
| none | ref absent or different | refused, `INVITE_REF_MISMATCH` (403) |

`TOKEN_ONLY` deliberately does not exist: holding a forwarded link is never enough to bind an
attempt. A claim refused by the matrix (wrong account or wrong reference) increments
`failed_claim_count`; five failures are recorded per 15 minutes and the next attempt returns
`INVITE_RATE_LIMITED` (429), while state refusals (already claimed, revoked, expired) do not
consume a slot. An invite claimed by another account is 409, revoked/expired invites are 410,
and an account already bound to a different invite is refused `PARTICIPANT_ALREADY_BOUND`. A
candidate who joined earlier with the code is bound to the invite on a successful claim, keeping
their original timer — never a fresh one, and never a merge of two accounts.

**Roster import.** `POST /admin/assessments/:id/invites` takes pasted CSV text parsed by
`fromCsv` (RFC-4180: BOM, quoted cells, embedded newlines, CRLF/LF). Caps are 64 KB and 500 data
rows, checked before any write. Header detection maps `candidate_ref` (required), `email`,
`candidate_name` and `group_label` (all optional) with manual column indexes as an override; a
row without an email is valid and delivered by link only. Every row returns
`created | updated | unchanged | duplicate | invalid` with a reason and a fix, so a bad row never
aborts its neighbours. Owner (`created_by`) and admins only; audit `assessment.invites.import`.

**Results export.** `GET /admin/assessments/:id/results.csv` writes one row per roster entry —
including `NOT_STARTED` candidates, which is the point of the file — plus participants with no
surviving invite (open-code joins). Columns: `candidate_ref`, `candidate_name`, `group_label`,
`email`, `status`, `assurance`, `failed_claims`, `started_at`, `finished_at`,
`last_submission_at`, `solved`, `points`, `submissions`, then `<label>_solved`/`<label>_attempts`
for every assessment problem in position order (zeros for absent and participant-only rows).
Rows sort by group label (nulls first), then roster rows before participant-only rows, points
descending, then `candidate_ref`. Owner/admin only, audit `assessment.export`,
`Cache-Control: no-store`, cells formula-escaped by `toCsv`.

**E6 attribution fixes.** Public aggregates now exclude assessment submissions through the shared
`countedSubmission()` helper (`submissions.assessment_id IS NULL`): the `/rank` totals and its
per-user submission aggregate, the problem verdict/language statistics, site stats and the
14-day activity chart, and the daily challenge. The rankboard and problem insights already
excluded virtual contests, and `/rank` excludes `virtual_contest_id` as well. The denormalized
`problems.accepted_count` / `submission_count` counters are recomputed in the judge with both
filters. Profile points, solved counts, language/verdict charts, difficulty and tag stats and the
activity heatmap use the same `practiceSubmissionCondition()` (assessment + virtual excluded);
the recent submissions list is deliberately unfiltered. `toCsv` prefixes a `'` to string cells
that start with `=`, `+`, `-`, `@`, tab or CR, which also hardens the contribution export. Rank
points are derived on read, so excluding assessment acceptances lowers some public totals
immediately and needs no backfill.

**Deferred.** Per-problem solved/attempt export columns for the results CSV.

## ICPC scoring

`src/server/contests/scoring.ts` is a pure function:

- only the first accepted submission per problem counts;
- penalty = solve minute + 20 × failed attempts before acceptance;
- failed statuses for penalty: WA, TLE, MLE, RE, OLE;
- CE and system errors do not add penalty;
- ranking: solved descending, penalty ascending, last acceptance ascending;
  fully equal rows share a rank and are ordered by username for display.

## Ranking

Overall ranking sums the point value of distinct accepted problems per user.
Each problem counts once, regardless of how many accepted submissions exist.
Contest submissions count toward overall ranking as well; assessment and
virtual-contest submissions never do (see
[Assessment invites and join modes](#assessment-invites-and-join-modes)).
Board filters and sorting never renumber ranks: the global position is computed
before filtering, so a filtered row keeps its real rank.

The contest rating board uses a separate, rated-only population: a non-banned
user with at least one row in `contest_rating_changes` (a finalized rated solo
contest). It shows the current rating, the peak rating (`max` of the current
rating and the best change) and the contest count, ranked by rating, peak,
contest count, then username. `GROUP` contests never create rating changes, and
finalization stays lazy, so the board is as fresh as the last contest page view.

## Judge sandbox

Compile container:

- workdir writable, mounted at `/work`;
- unprivileged user 65534;
- no network, read-only root, 1 CPU, 1024 MB memory, 30s compile timeout.

Run container:

- source/workdir mounted read-only; the harness is baked into the image;
- test inputs are opened by the trusted harness and passed to the child on stdin;
- expected outputs and results live in a root-only directory mounted at `/results`;
- root runs the trusted harness; each submitted process is dropped to `nobody`
  with its own session and `RLIMIT_FSIZE`, `RLIMIT_NPROC`, `RLIMIT_NOFILE`,
  `RLIMIT_STACK` and `RLIMIT_CORE`;
- capabilities are dropped, then only `DAC_OVERRIDE`, `SETUID`, `SETGID` and
  `KILL` are added to the trusted harness. Submitted processes cannot use them;
- no network, 1 CPU, process limit, memory limit and per-test timeout;
- stdout/stderr and hidden tests are not writable by submitted code;
- languages: C, C++, Python, Java, JavaScript, C#, Go, PHP and Kotlin in the main
  image; Swift uses the separate `JUDGE_SWIFT_IMAGE` (same harness and limits);
- SQL runs on real engines: SQLite 3 in-process, a private MariaDB server for
  `mysql`, and a private PostgreSQL 15 server for `postgresql`. Both servers run
  on unix sockets with `listen_addresses=''`/`--skip-networking`, use a fresh
  fixture copy per test, and execute the submission as a read-only role. SQL
  script labs stay SQLite-only (allowlisted writable authorizer);
- output checkers: exact (whitespace-normalized), token, floating-point with
  per-problem tolerance, and custom Python scripts. Custom checkers run after the
  submission with the input/expected/output paths and exit 0 to accept.

## Shared form controls

Choice fields use one client-side `SearchableSelect` (`src/components/ui/searchable-select.tsx`)
instead of a native `<select>`. The trigger keeps the existing input styling and
the menu renders in a portal with fixed positioning, so it is not clipped by
tables or cards. Search appears automatically when a field has more than five
options (`src/lib/select-options.ts`), matches labels, descriptions and values,
and supports arrow keys, Home/End, Enter and Escape. Long option labels wrap to
two lines; the closed trigger truncates with a tooltip. When a `name` is supplied
the component also renders a hidden input so server-rendered GET filters submit
the selected value. Like the rest of the interactive UI, these controls require
JavaScript: route content is streamed into a hidden segment that only the React
runtime reveals, so a `<noscript>` native fallback cannot become visible.

## Failure and recovery

- Judge jobs have one attempt; worker errors mark the submission `SYSTEM_ERROR`.
- On startup the worker requeues submissions stuck in `QUEUED`/`JUDGING` for more
  than 15 minutes.
- The web app marks a submission `SYSTEM_ERROR` if enqueueing fails.
- The health endpoint checks PostgreSQL and Redis; the Compose stack uses it for
  the app healthcheck.
