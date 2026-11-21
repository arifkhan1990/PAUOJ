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
study_lists 1─* study_list_items *─1 problems
contests 1─* contest_problems *─1 problems
contests 1─* contest_registrations *─1 users
contests 1─* contest_clarifications *─1 users
contests 1─* contest_rating_changes *─1 users
contests 1─* virtual_contests *─1 users
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
```

Key constraints:

- usernames and emails are stored lowercase with unique indexes;
- problem and contest slugs are unique;
- test positions and contest labels/positions are unique per parent;
- `submission_results` is unique per `(submission_id, position)`;
- deleting a problem cascades to its tests and submissions;
- deleting a contest sets `submissions.contest_id` to null so historical
  submissions survive.

Problem counters (`accepted_count`, `submission_count`) are denormalized for the
problem list and recomputed transactionally after every judged submission or
rejudge.

## Problem insights

The problem page aggregates verdict and language counts directly from
`submissions` and computes the rankboard from each solver's first accepted
submission. Assessment submissions are excluded from both the counts and the
rankboard, and the rankboard also excludes virtual contests, so private test
activity never appears there; the whole insights block is hidden while a
contest or assessment context is active.

## Problem discussions

Comments are stored in `problem_comments` with an optional `parent_id`; the API
enforces one reply level. Votes live in `problem_comment_votes` with one row per
`(comment, user)` and values `-1`/`1`. Scores are summed on read, comments are
soft-deleted, and deleting a top-level comment also hides its replies. Admin
deletions write an `audit_logs` entry.

Discussion is hidden and the API returns `DISCUSSION_LOCKED` whenever the
problem belongs to a running contest or assessment, including the caller's own
registered round, so statements and solutions cannot leak during a competition.

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

## Problem extras, study plans and daily challenge

Community ratings store half-star values as integers `1..10` in
`problem_ratings`, one row per `(problem, user)`, with the summary averaged on
read. Verified resources live in `problem_resources` and are editable by admins
and the problem author. Related problems are computed from shared tags with the
same restriction rules as the problem list, so contest problems never leak.

Study plans are ordered `study_lists`/`study_list_items`; progress is derived
from accepted submissions rather than stored separately. The daily challenge is
deterministic per UTC date (an MD5 ordering over eligible public problems), and
the streak reuses the accepted-submission activity heatmap. Category,
subcategory and company tags live on `problems`; companies use a GIN index.

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
  and returns `CONTEST_LOCKED` unless the user is registered or an admin.
- Submissions made from a running registered contest are auto-tagged with
  `contest_id`, so they count toward the scoreboard.
- Practice submissions after the contest do not affect the final standings.

## Contest clarifications and ratings

Contest clarifications live in `contest_clarifications`. Registered
participants (and admins) can read and ask while a contest is upcoming or
running; public ended contests are read-only for everyone, while private
contests stay limited to participants and admins. Answers are allowed for
admins, the contest creator and the problem author, and each answer writes an
audit entry.

When a contest ends, the first contest/standings page view calls the rating
finaliser. It locks the contest row, re-checks `rated_at`, computes the ICPC
scoreboard, keeps only participants with at least one contest submission,
compacts tied ranks, and applies Elo with `K=32`, zero-sum normalisation and a
floor of 100. Changes are written to `contest_rating_changes` and `users.rating`
in one transaction; `rated_at` makes the operation idempotent. Rating history
rows use the contest end date as `created_at`, so profile charts keep the
contest timeline even when finalisation happens on a later page view.

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
on). The page marks the package version as the current release, treats the
`Unreleased` block as the next release, and shows every section with an icon,
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

Candidate-level delivery on top of the shared code (unreleased, 0.6.0 — see `CHANGELOG.md`).
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
`last_submission_at`, `solved`, `points`, `submissions`. Rows sort by group label (nulls first),
then roster rows before participant-only rows, points descending, then `candidate_ref`.
Owner/admin only, audit `assessment.export`, `Cache-Control: no-store`, cells formula-escaped by
`toCsv`.

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
- ranking: solved descending, penalty ascending, last acceptance ascending,
  username as the final tie-break.

## Ranking

Overall ranking sums the point value of distinct accepted problems per user.
Each problem counts once, regardless of how many accepted submissions exist.
Contest submissions count toward overall ranking as well; assessment and
virtual-contest submissions never do (see
[Assessment invites and join modes](#assessment-invites-and-join-modes)).

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
- output checkers: exact (whitespace-normalized), token, floating-point with
  per-problem tolerance, and custom Python scripts. Custom checkers run after the
  submission with the input/expected/output paths and exit 0 to accept.

## Failure and recovery

- Judge jobs have one attempt; worker errors mark the submission `SYSTEM_ERROR`.
- On startup the worker requeues submissions stuck in `QUEUED`/`JUDGING` for more
  than 15 minutes.
- The web app marks a submission `SYSTEM_ERROR` if enqueueing fails.
- The health endpoint checks PostgreSQL and Redis; the Compose stack uses it for
  the app healthcheck.
