# Changelog

All notable changes to PAU OJ are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/) and the project uses SemVer.

## [Unreleased]

### Fixed
- The admin **Payments & access** badge now refreshes with the existing 45s
  dashboard counts poll; `/api/v1/social/counts` returns `access` for admins and
  `0` for everyone else, and the sidebar updates without a navigation.
- Admin premium-order notifications are capped at 10 per admin per rolling hour;
  additional orders send one hourly digest while the queue badge and `/admin`
  callout keep showing the true pending count.
- The Study plan E2E Chrome launch now captures stderr, waits up to 30s for
  DevTools (with the stderr WebSocket fallback) and retries once with a fresh
  profile, so the CI "no DevTools port" flake is diagnosable and self-healing.
- `srv deploy` now runs a `deploy/srv/deploy.sh` hook: the pre-hook rebuilds the
  judge sandbox image when `judge/` changes or the image is missing, and the
  post-hook seeds the curriculum. This prevents the judge worker from
  crash-looping after an app-only deploy.
- Admins are now notified in-app when a premium payment or free-access request
  arrives; the admin sidebar links to **Payments & access** with a
  pending-count badge and `/admin` shows a review callout, so free-access
  requests no longer sit unseen.
- Custom-test runs no longer report a green “AC”. A clean run is now
  `EXECUTED`, the result card shows “Ran” (or a sample comparison when the
  input matches an official sample) and never presents an unjudged run as
  correct. Empty output on a sample now shows “Your output” with a
  `(no output)` placeholder, the expected sample output and “Differs from
  sample” instead of a misleading AC. Run results cached before this change are
  normalized to `EXECUTED` on read, and `EXECUTED` renders with neutral “Ran”
  metadata instead of a judge-error fallback.

### Changed
- `/health` reports the deployed `APP_COMMIT`; the srv deploy hook records it,
  the server compose passes it to web/worker, and CI/CD only accepts a deploy
  when the live commit matches the queued short SHA. The first judge image build
  is documented as a one-time ~10 minute, ~3.2 GB step that is cached.
- CI/CD now deploys `main` automatically after a green **CI** run (and on manual
  dispatch) through the srv deploy hook. The job waits for the server queue and
  verifies `/health`, the production smoke suite and the 5 MiB upload probe.
  Requires the one-time `DEPLOY_TOKEN` Actions secret; without it the deploy is
  skipped with a warning.
- Conversation info now uses three tabs (Media, Documents, Links), shows
  each detail as a label/value row, binds the profile link to
  “Name (@username)”, and removes the duplicate Actions block (mute/report stay
  in the thread header).
- The thread header shows a single presence indicator; the duplicate avatar
  overlay dot is removed so “Online now” is not shown twice.

### Added
- Notification bell and drawer in the public navbar: signed-in users get an
  unread-count badge that refreshes while the tab is visible, an accessible
  right-side drawer with All / Unread / Notices tabs, per-item and mark-all
  read, load-more pagination, loading/empty/error states and links to the full
  notification center and preferences. Notices, announcements, new-contest and
  contest-update rows carry visible category chips. Guests can open the same
  bell to read public announcements and live/upcoming contests. Adds
  `PATCH /api/v1/notifications/:id/read`, a `filter` on the notification list,
  and the public `GET /api/v1/announcements` endpoint (completed fan-out only,
  baseline rows excluded, same-origin hrefs, rate limited and cacheable).
- Custom-test expected output: for a practice problem with a stored reference
  solution, a non-sample custom run now also runs the reference on the same
  stdin and shows **Your output** beside **Expected output (reference)**.
  “Matches expected” / “Differs from expected” uses the problem's `EXACT`,
  `TOKEN` or `FLOAT` checker (`CUSTOM` shows the reference output without a
  pass/fail claim). Official samples skip the extra run and keep the existing
  sample comparison; contest/assessment runs and problems without a reference
  show an explicit unavailable note. Reference sources are never returned to
  the client. Adds migration 0053 (`problem_reference_solutions`) and seeds 471
  non-SQL references.
- SQL and author-created reference coverage: migration 0054 adds the
  `problem_reference_solutions.script` flag, the seed stores all 136 SQL
  reference queries (132 normal + 4 script labs), and reviewer approvals now
  inherit their solution as the problem reference. SQL expected output is
  generated with the SQLite fixture; MySQL/PostgreSQL runs show it without a
  pass/fail claim and with a dialect note. Successful reference output is
  cached for one hour per reference source + stdin.
- Message document sharing and live conversation info: PDF/TXT/CSV/ZIP/DOCX/
  XLSX/PPTX files up to 5 MiB now upload from the composer (magic-byte
  validated, opaque participant-only downloads), render as document bubbles and
  appear under Documents in the sender panel alongside document links. The panel
  refetches on reopen and polls every 20s while open, older active conversations
  are pinned into the rail, and the panel is an in-flow column at 1024px
  (rail hidden while open) with the phone drawer unchanged. Adds migration 0052
  (`message_attachments.kind/file_name/size_bytes`) and keeps one shared
  50-file/24h + 250 MiB sender quota for images and documents.
- Messages workspace: `/dashboard/messages` and `/dashboard/messages/[id]` now
  share a three-pane, WhatsApp-style layout with a searchable All/Unread
  conversation rail, grouped day dividers, a pinned sender header and a contact
  panel that stays closed until the sender's name is clicked. The panel shows
  public profile/about/details, a name-linked profile URL, Media/Documents/Links
  tabs, and lazily loaded shared media, document links and external links
  (participant-only, no-store, with blocked/banned gates). Existing text/image
  sending, emoji and entity suggestions, read receipts, deletion, muting,
  reporting, pagination and rate-limit states are unchanged. No migration.
- Notification and email expansion: welcome, contest registration/30-minute
  reminder/final result+rating, study-plan and module enrollment, payment
  submitted/approved/rejected/revoked, 7/21-day course inactivity, badges and
  solved milestones (1/100/250/500/700/1000), announcements, new contest/module
  marketing, direct messages and problem/lesson discussion replies now create
  in-app notices and opt-out email copies. Adds 8 preference switches, 12
  notification types, 12 unsubscribe scopes, exact-threshold achievement rules,
  a `broadcasts` ledger with automatic contest/module marketing and pending
  retries, and an admin announcement composer at `/admin/announcements`
  (migrations 0047-0049).
- Notification email reliability: notification mail now goes through a durable
  `email_outbox` queue with `FOR UPDATE SKIP LOCKED` claiming, five-attempt
  backoff, terminal `FAILED` rows for operators and 30/90-day retention. Announcements and marketing
  are queued and fanned out by the worker instead of blocking the admin
  request; in-app and email marketing are independent, so in-app-off users can
  still receive email-only marketing. Follow notices gained an `emailFollows`
  switch, and contest results now reach every registered non-banned participant
  with a fallback final-standings notice for GROUP/unrated contests.
- Browser push and notification grouping: users can enable standards-based
  VAPID Web Push per device from Settings (service worker, same-origin clicks,
  privacy-redacted message/reply bodies, 404/410 pruning, DB-backed
  subscription storage in `push_subscriptions`). The notification center groups rows by type and UTC
  day with expandable counts. Notification emails now start an immediate outbox
  flush after enqueue, so normal messages deliver in under a second while the
  worker retry sweep remains the safety net. Broadcast publishing also starts
  an immediate fan-out; the 30-second sweep retries anything left.
- Profile avatars: every account can upload a PNG/JPG/WebP photo or pick one
  of twelve preset avatars (cat, dog, bird, fish, rabbit, squirrel, turtle,
  panda, ghost, rocket, bot, gamepad) from Settings → Profile picture. The
  browser crops to a square and resizes to 512×512 before upload; the server
  validates the bytes and dimensions and stores the image in
  `user_avatar_images`. The chosen avatar appears on profiles, the header,
  rank/rating boards, comments, messages, contest rosters and scoreboards, and
  admin pages. Choosing a preset replaces an uploaded photo; removing a photo
  falls back to the selected preset or the existing initials avatar. Avatars
  are served from a versioned, immutable `/api/v1/users/:username/avatar` URL.
- Social graph v2: follows are now approval-based (`PENDING`/`ACCEPTED`, with
  `acceptedAt`) instead of instant. A profile shows Follow → Requested →
  Following, incoming requests can be accepted or declined from
  `/connections/requests`, mutual requests auto-accept, and request/acceptance
  produce deduped in-app notices. Existing accepted follows are preserved by
  migration 0043.
- Direct messages: two-person conversations unlocked by an accepted follow in
  either direction, with an inbox, paged threads, header unread badge, read
  receipts, soft delete (notification previews are cleared), in-app notices for
  the first unread message of a burst, and participant-only `404` semantics.
  Rate limits: open 20/h, send 30/min, read 120/min, delete 60/min.
- Blocking: one transaction inserts `user_blocks`, severs both follow edges
  (pending or accepted) and hides presence; blocked users cannot follow,
  re-request, open a conversation or send. The conversation disappears from
  both inboxes and direct links return 404 until unblock; block checks are
  serialized per user pair to close check-then-write races.
- Ranking board: `/rank` now supports text search over name, username and
  institution, exact institution/country filters, solved brackets, sorting by
  points/solved/name and 10/20/50 page sizes. Global ranks are computed before
  filtering, so a filtered row keeps its real rank. The page adds a top-3
  podium, active-filter chips, mobile cards, range/first/last pagination and a
  "your standing" card; `GET /api/v1/rank` accepts the same filters.
- Dual leaderboards on `/rank`: a Points board and a Contest rating board
  (`?board=rating`). The rating board only admits non-banned coders with
  finalized rated solo contests, and shows current rating, peak, contest count,
  last delta and last contest; global ranks use rating → peak → contests →
  username and are computed before filters. It adds rating-tier filters,
  rating/peak/contests/name sorting, tab switching that preserves shared filters,
  and Codeforces-style tier-coloured names and handles. Profile rating rank uses
  the same board order. `GET /api/v1/ratings` mirrors the board with the same
  validation, and the points board now excludes banned users too.
- Learning content navigation: every lesson ends with a previous/next pager
  (first lesson → track overview, last → module checkpoint); module pages offer
  previous/next track navigation, and the SQL industry-project delivery board lists all 23
  tickets in curriculum order. Topic/track order comes from the existing
  module/topic arrays; `#checkpoint` links now scroll correctly after the
  streamed module card lands. The sequence helper and pagers are covered by
  unit/render tests.
- ShopSphere industry-project dossier at `/learn/sql/project`: seven feature
  squads, 23 work tickets mapped one-to-one to the SQL lesson topics, a 19-table
  data dictionary with keys and seeded row counts, ten metric definitions, a
  twelve-item handover checklist with judge-problem proofs, staff-engineer
  defense questions, and a downloadable SQLite fixture. Every SQL topic renders
  its work ticket; the SQL hub and both track overviews link to the dossier.
  `sql-project.test.ts` keeps the dictionary, epics, tickets and fixture aligned.
- Submission analysis on `/submissions/:id`: runtime and memory percentile
  ("beats") against accepted runs on the same problem (same language, widening
  to all languages for small samples), a runtime-distribution histogram with the
  submitting run marked, fastest/median/sample stats, a collapsible source panel
  (`View more`), related-practice pills and a private per-submission note.
  Analysis is hidden for assessment submissions and live contests. Migration
  `0042_submission_notes`; `GET /submissions/:id/analysis` and
  `PUT/DELETE /submissions/:id/notes`.

- Presence is now explicit on every social surface: profiles, follower/following
  and request lists, message inbox/threads and both rank boards show "Online
  now" or `Last active 7m/3h/2d/3w/4mo/1y ago` ("No recent activity" when
  cleared), subject to Everyone/Followers/Nobody visibility. Migration 0044
  backfills existing users from account/session/submission history.
- Conversation mute and in-app notice preferences: muted conversations keep
  their history but contribute zero unread and send no notices; `notifyMessages`
  and `notifyFollows` can be switched off in settings without affecting security
  or account notices. Blocking now hides the conversation from both inboxes,
  excludes it from unread counts, returns 404 on direct links and marks the
  blocker's related notices read.
- Social reports: messages, conversations, follow requests and profiles can be
  reported with a reason and optional details, with a 24-hour duplicate guard
  and 10/hour limit. Message evidence must be authored by the reported user.
  Admins triage open/resolved/dismissed reports at `/admin/social-reports` and
  closing a report is atomic with its audit entry and notifies the reporter.
  Duplicate submissions are serialized, admins get one grouped digest per hour
  while reports are open, and retention runs daily in the worker (365/730/365,
  opt out with `SOCIAL_RETENTION_AUTO_APPLY=false`); `pnpm social:retention`
  remains the manual dry-run/apply entry point.

### Fixed
- The dashboard sidebar navigation no longer shows a native scrollbar. It
  keeps `overflow-y-auto` for short viewports but hides the bar
  (`scrollbar-width: none` + WebKit rule), so the workspace menu stays clean at
  every height.
- Learning badges no longer render locked placeholders. The profile section is
  hidden until at least one module checkpoint is completed, then shows only the
  earned badges with their completion dates.
- Tied players with equal ratings keep equal rounded Elo deltas (the rounding
  remainder no longer splits a tie group when another group can absorb it).
- Rate-limit buckets now set their TTL in one atomic Redis script, so a
  connection drop cannot leave a permanent 429 key; a bounded per-process
  fallback covers Redis outages.
- A block that races a follow/open/send transaction is serialized with a
  per-pair advisory lock, so a concurrent block cannot be bypassed.
- Banned counterparts are hidden from message inboxes, unread counts and
  threads (direct links 404); the header badge uses a 15-second invalidated
  cache; `/messages` SSR pages are rate limited; and JSON bodies over 1 MiB are
  rejected with 413.

### Changed
- Profile hero refresh: the identity card now has an ambient glow, a larger
  avatar, compact metadata chips and a tighter two-line work/skills block. The
  follow, message, share, block and report actions are 36px on desktop (44px on
  mobile), share/block/report collapse to an icon toolbar, and blocking uses a
  focused confirmation dialog instead of an inline form. Stat tiles moved to a
  light four-tile strip with icon accents; light and dark themes both use the
  same token palette.
- Contest ratings finalize one hour after a contest ends instead of on the first
  contest page view. The hour is a review/rejudge window; the Redis-locked worker
  sweep waits for pending verdicts, finalizes in `(end_at, id)` order, and defers
  while an earlier contest is unfinalized. A throttled ordered page fallback and
  `pnpm ratings:finalize` keep ratings moving without the worker. Finalization
  uses competition ranks, exact zero-sum integer deltas (floor-aware), locks
  participant rows, excludes banned/virtual participants, and locks contest
  submissions/problems/schedule after `rated_at`. Profile/standings show the
  review/finalized state. A dry-run-first `pnpm ratings:recompute` replays stored
  history with the current engine; the local history was repaired (two old −1
  sums → 0, sadia 1570→1572) and a second apply is idempotent. `pnpm
  ratings:audit` now passes with `warnings: 0`. The shared footer/empty-state
  heading order and GROUP format-badge contrast were also fixed.

## [0.9.0] - 2026-11-24

### Added
- Solo and team contests: `SINGLE`/`GROUP` formats, 2–6 coder teams, invite codes,
  captain transfer, team registration and a team-aggregated ICPC scoreboard.
- A monthly official series created by the worker on the third Sunday at 10:00
  Asia/Dhaka for 90 minutes, with a `(series, start)` idempotency index.
- Contest crew roles (director, setter, editorial writer, tester, observer), an
  internal crew notes thread and a problem candidate shortlist. Crew cannot
  register, join a team or submit; non-director crew cannot open running statements.
- Fresh-problem policy: never used in another contest, never debuted, and private
  until the round; debut rows are reserved atomically and reused/public problems
  return `422`.
- Sponsorship requests with tiers and public highlighting, plus community host
  requests with a ৳3,000–৳5,000 fee and payment TrxID review/conversion.
- Contest integrity shield: per-view watermark, copy/paste/print/context-menu and
  tab-fullscreen guards, integrity event storage and an admin operations summary.
- Contest pages now have an editor-authored banner with a branded fallback, a
  full About section, format/eligibility cards, organiser rules plus the standard
  platform policy, and a dedicated prizes/recognition section.
- Contest hub at `/contests` with a live/upcoming spotlight, status/format/division
  filters and compact, scannable rows with Dhaka-local times and direct links.
- Team invitations by username with in-app notifications, accept/decline,
  pending-invite cancellation and a shareable invite-code fallback.
- `contests.banner_url` and `contest_host_requests.banner_url`; admin/host banner
  URL fields with live 16:5 previews, and banner media on contest cards and hero.
- Standard contest policy/prize fallbacks plus richer seeded descriptions, rules,
  eligibility and prize details for the demo rounds.
- `contest_team_invites` with captain-only invitations and one pending request per
  team/member.
- Admin contest editor fields for format, team size, official rounds, fresh-policy,
  fee, eligibility, rules and prizes; admin host-request queue and monthly-series panel.
- Crew workspace at `/dashboard/contests/:id/operations`.
- Profile social module: optional website, GitHub and LinkedIn links with
  handle-or-URL normalization, a public follow/unfollow graph with follower and
  following counts, follower/following lists, an in-app "New follower"
  notification, profile sharing, and canonical/Open Graph profile metadata.
- Two free career-toolkit learning tracks: **Git & GitHub** (snapshots, branches,
  GitHub flow, release tags, safe recovery) and **Docker & CI/CD** (images,
  Dockerfile layers, Compose, production images, pipelines, deploy gates and
  rollback). Both use story-driven Bangla concept notes, hands-on terminal labs,
  guided/solo judge drills, a timed checkpoint and a badge; they are always open
  and never require a purchase or a previous track's badge.
- **Visual explainers on every learning topic:** 16 data-driven animated
  SVG/CSS primitives cover arrays, stacks, linked lists, hashing, sorting,
  complexity, bits, trees, graphs, DP, strings, SQL, Git, Docker and CI/CD.
  Every topic gets a Bangla mini-lesson before guided practice, with a compact
  module-page preview, a visible step list and a reduced-motion fallback;
  no new dependency and no client-side JavaScript.
- Profile detail fields: current status, company and job title, up to 12 skills,
  plus private phone, address and T-shirt size. Work and skills are public;
  contact and swag details are visible only to the owner and admins. Admins get
  a `/admin/users/:id` detail page with the private data and an explicit
  privacy notice.
- `pnpm sql:check` runs every SQL reference solution against the three real
  judge engines (SQLite, MariaDB, PostgreSQL) and fails on any mismatch.

### Changed
- The `/contests` hub is rebuilt for scannability: a compact hero with live,
  upcoming and past-round counts, a countdown-led next-up spotlight, segmented
  status tabs with scoped counts, compact format/division segmented controls,
  date-led rows grouped into Live now, Upcoming
  and Past contests, per-row countdowns and lightweight text actions instead of
  repeated buttons, and a fair-play band. Repeated banner thumbnails and the
  duplicated action column are gone.
- Group contest team formation now lives in the hero **Create or join a team**
  button: it opens one accessible native-dialog modal with Create/Join tabs when
  both are available, inline validation, a pending lock, Escape/backdrop close
  and focus return to the trigger. The duplicate inline team forms and action
  card are gone, so the page has a single team entry point.
- Contest detail is split into **About** and **Problems** tabs: About (the
  default landing tab) holds the description, format/eligibility, scoring,
  rules and prizes; Problems holds the problem set at `?tab=problems`. The
  desktop right sidebar is sticky below the tab bar and no longer scrolls away
  with the About content; its scoring card moved into About so the sidebar fits
  without an inner scrollbar.
- Contest pages now lead with a real banner/hero, feature a full description,
  format/eligibility, rules and prizes, and keep the team/invite flow near the
  top of the page. Cards show banner media and preserve equal heights; standings
  show team identity and rosters.
- Contest detail now has a state-aware hero CTA (register / team / virtual replay /
  standings), sticky section tabs, Dhaka-local times with UTC tooltips,
  registration status/deadline, and a share + add-to-calendar toolkit with ICS
  downloads.
- Contest editorials are sealed for everyone while a round runs, including admins.
- Group contests are unrated; virtual replay remains solo-only.
- Contest-only problems remain reachable from an ended public contest page even when
  they are still private in the practice list.
- The SQL judge now uses real engines: SQLite 3 for `sql`/`sqlite`, a MariaDB
  10.11 server for `mysql`, and a PostgreSQL 15 server for `postgresql`. The
  MySQL/PostgreSQL options no longer run through the SQLite compatibility layer;
  each boots its own read-only server in the sandbox. SQLite submissions are
  stored as `sqlite` instead of being folded into `sql` (migration 0041).

### Fixed
- Public submission feeds (landing page, `/submissions`, profiles and the public
  API) now show only published problems, skip assessments, and hide contest
  submissions until a public contest has ended, so private rounds and draft
  problems cannot leak titles or verdicts.
- The landing verdict feed reads the worker heartbeat instead of always showing
  a green "Judge active"; it now switches to "Judge offline" when no worker has
  checked in.
- The 14-day judge chart labels include the month (`23 Nov`) so a range that
  crosses a month boundary is no longer ambiguous, and the feed copy now matches
  the pass-count shown in the list.
- The admin contest detail now round-trips `feeReference` so editing a hosted contest
  does not clear its payment reference.
- Hosting approval marks the arrangement fee paid and enables conversion in one step.
- Malformed UUID path parameters return `404` instead of `500`.
- Ended team contests stamp `rated_at` without applying individual Elo changes.
- Host-form mobile controls and contest filter chips meet the 44px touch target.
- The host form shows the configured bKash/City Bank accounts instead of a missing
  "official number".

## [0.8.2] - 2026-11-24

### Changed
- Study plan catalog cards are redesigned for readability: the progress donut is
  removed, the footer uses a compact segmented progress meter with solved/total
  text, status badges are quieter, and cards get a consistent footer, hover and
  focus treatment.

## [0.8.1] - 2026-11-23

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
- The study-plan detail page now uses circular progress rings, a sticky section rail,
  compact per-problem note actions and a single completion state instead of linear
  progress bars and repeated "Add note" rows. Mobile header/footer controls meet the
  44px touch-target rule.

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
