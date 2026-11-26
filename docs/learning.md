# Learning tracks

PAU OJ ships a curated curriculum that turns the judge into a study
path, not only a problem archive. It has three kinds of track:

1. Seven core algorithm tracks, in one sequence:
   1. Basic Programming & Math
   2. Basic Data Structures
   3. Basic & Intermediate Algorithms
   4. Trees & Graphs
   5. Dynamic Programming
   6. Advanced Data Structures
   7. Advanced Algorithms
2. Two project-driven SQL labs (Basic and Advanced SQL on ShopSphere).
3. Two free career-toolkit tracks (Git & GitHub, Docker & CI/CD) that every
   learner can open at any time.

## How a module works

Core and SQL modules follow the same four-step loop:

| Step | What the learner gets | Purpose |
| --- | --- | --- |
| 1. Concept note | A short Bangla article with diagrams and code templates | Understand the idea before solving |
| 2. Guided problems | Two warm-up problems with a clear story | Apply the idea with confidence |
| 3. Tiered practice | Easy, medium and hard problems | Build real control of the topic |
| 4. Checkpoint | A timed three-problem set and a badge | Prove readiness and unlock the reward |

Each topic also carries two or three extra "try it yourself" problems after the practice
set. Progress is derived from accepted, non-assessment submissions, so nothing
extra is stored per learner.

Free career-toolkit (`tools`) tracks use the workshop variant: the concept note is
a longer story with a hands-on lab, and the topic has two guided drills plus two
solo drills instead of a tiered easy/medium/hard set. The topic page hides empty
tiered and extra groups rather than showing "in production" placeholders.

## Sequence and navigation

Topic position is the 1-based index in the module's `topics` array; module
position is the `order` field. There is no separate sequence column to drift.
Every unlocked lesson ends with a previous/next pager:

- the first topic's previous card opens the track overview;
- the last topic's next card opens the module checkpoint
  (`/learn/<module>#checkpoint`), or the track overview when a module has no
  checkpoint;
- middle topics link to their immediate neighbours;
- every card shows the target title, Bangla subtitle and `Topic NN of NN`.

Module pages add a previous/next **track** pager after the checkpoint, following
`LEARNING_MODULES` order (core 1-7, SQL 8-9, career toolkit 10-11). The
`HashScroll` client component retries the `#checkpoint` scroll while streamed
module content settles, so checkpoint links land on the card rather than the top
of the page. The SQL industry-project ticket board sorts its 23 tickets by the
same curriculum sequence, not by ticket id.

`src/lib/learning/sequence.ts` owns `getLessonPagerData`,
`getTrackPagerData`, `getCurriculumTopicSequence` and
`getCurriculumTopicPosition`; `sequence.test.ts` checks every module boundary,
the track order and the SQL ticket positions.

## Visual explainers

Every live topic opens with one **visual explainer** between the concept note and
guided practice. The visual is a small animated SVG/CSS diagram that makes the
mental model visible before the learner reads the full text. The module page also
shows a compact preview of the first topic's visual.

- **16 reusable primitives:** `flow`, `complexity`, `bits`, `array`, `stack`,
  `linked`, `hash`, `sort`, `tree`, `graph`, `dp`, `string`, `sql`, `git`,
  `docker` and `pipeline`.
- **Data-driven:** each topic maps to a config with a Bangla title, caption,
  three to five steps and small teaching data (array values, node edges, SQL
  tables, commit lanes, pipeline jobs). There is no per-topic JSX.
- **Accessible:** the animated stage is decorative, the same sequence is exposed
  as a visible ordered step list, and `prefers-reduced-motion` freezes every
  animation in a readable final state.
- **Dependency-free:** SVG + CSS only; no chart or animation library and no
  client-side JavaScript. Labels use a 10px floor, SVG nodes 12px, and the
  Bengali fallback stack; essential text never animates opacity. Line-draw and
  blink effects run once, then the diagram rests in its complete state.
- **Guided reading:** the step rail is visible below the stage (three steps on
  the compact module preview, all steps in the lesson), so sighted and
  screen-reader learners get the same sequence.
- **Theme-safe and responsive:** semantic tokens drive light/dark colours; the
  stage fits 390/768/1440 without page overflow.

| Layer | Path |
| --- | --- |
| Visual config types | `src/lib/learning/visual-types.ts` |
| Per-topic configs | `src/lib/learning/visuals/` |
| Accessible frame and primitives | `src/components/learning/visuals/` |
| Motion utilities / reduced-motion guard | `src/app/globals.css` |

## Current release

**Seven core tracks ship, alongside two SQL labs and two free career-toolkit
tracks.** The core curriculum contains 34 topics, **430 original problems** and
**2,750 tests**. Every core topic has the full practice tier: three easy, three
medium and two hard problems, plus two or three extra problems. Every core track
ends with a mixed three-problem checkpoint and a module badge. The SQL labs add
23 topics and 136 project problems, including the DDL/DML script labs. The two
free toolkit tracks add six workshop
topics and 30 judge-backed drills; each track ends with its own 45-minute
checkpoint and badge. The toolkit labs are run on the learner's machine, not in
the judge.

Module 1 contains five topics:

- Input, Loops & Conditionals
- Time & Space Complexity
- Basic Math & Number Theory
- Bit Manipulation Basics
- Strings & 1D/2D Arrays

Every topic has one Bangla concept note, guided problems, a tiered practice set,
two or three extra problems and a mixed three-problem checkpoint. Every problem has
hidden tests, a reference Python solution and a Bangla editorial.

Difficulty is calibrated within the track's prerequisite. In an advanced track,
a direct application of the newly taught structure is Easy, one additional
combined invariant is Medium, and multiple structures or phases is Hard. This is
why a direct segment-tree query or a small direct HLD path can be Easy/Medium in
Module 6 while remaining advanced material overall.

## Checkpoint rules and progression

- A checkpoint lasts 45 minutes from the moment the learner starts it.
- All three checkpoint problems must have an accepted, non-assessment
  submission inside the attempt window.
- The attempt is stored in `learning_checkpoint_attempts`, one row per
  `(user, module)`.
- Completion is evaluated lazily when the module page is read; a conditional
  update makes it idempotent.
- An expired attempt can be restarted. A completed checkpoint cannot be
  restarted, and the badge stays earned.
- Starting a checkpoint is authenticated and same-origin protected.
- **Tracks unlock in order.** Track 1 is open. Track N unlocks only after the
  previous track's checkpoint badge is earned. SQL labs and career-toolkit
  tracks are exempt from this rule. The API enforces the same rule, not only the
  UI, and locked module/topic pages show the previous checkpoint requirement.
- Earned and locked learning badges are listed in the profile's learning badge
  cabinet and link back to the track.

## Where the content lives

| Layer | Path |
| --- | --- |
| Track/topic metadata and concept notes | `src/lib/learning/modules.ts`, `src/lib/learning/module-1/`, `src/lib/learning/tools/` |
| Visual explainer configs | `src/lib/learning/visuals/` |
| Visual primitives | `src/components/learning/visuals/` |
| Topic/track order and pager data | `src/lib/learning/sequence.ts` |
| Previous/next pagers | `src/components/learning/lesson-pager.tsx` |
| Problem definitions | `src/server/db/learning/module-1/`, `src/server/db/learning/tools/` |
| Seed aggregation | `src/server/db/learning/index.ts` |
| Progress and checkpoint service | `src/server/services/learning.ts` |
| Checkpoint API | `src/app/api/v1/learning/checkpoints/route.ts` |
| Validator | `scripts/validate-learning.ts` |
| UI | `src/app/(app)/learn/`, `src/components/learning/`, `src/features/learning/` |

The curriculum metadata is static TypeScript. Problems are seeded into the
normal `problems`, `test_cases`, `tags` and `problem_tags` tables with
`category = "Learning track"` and a module/topic `subcategory`, so they also
work with the existing filters, ratings, discussions and editorial tabs.

## Authoring a new module

1. Add the module and topic definitions in `src/lib/learning/`.
2. Add one problem file per topic under `src/server/db/learning/module-N/`.
3. Add one visual config per topic in `src/lib/learning/visuals/`.
4. Register the arrays in `src/server/db/learning/index.ts`.
5. Write tests, a reference Python solution and an editorial for every problem.
6. Run `pnpm learning:check --module=<module-slug>`.
7. Run `pnpm db:seed` locally, open `/learn/<module-slug>` and walk the topic
   pages and the checkpoint once.
8. Update this file, `README.md`, `docs/architecture.md`, `CHANGELOG.md` and the
   task log.

The validator executes every reference solution against every test, checks the
problem counts per tier, verifies that every curriculum slug resolves, and
requires Bangla statements plus a fenced solution in the editorial. CI runs it
after the unit tests.

`pnpm learning:audit` is the stricter content gate. It checks every concept
note's required sections, table and diagram; every problem's editorial sections
and fenced Python block; the tier/difficulty/points mapping; names, person and
honorific forms; and it runs the editorial's full Python solution against every
test. The release checklist runs both `learning:check` and `learning:audit`.

## Lesson reactions and discussion

Every live lesson has a like/dislike reaction and a content-based discussion:

- `lesson_reactions` stores one reaction per user and lesson (`1` like,
  `-1` dislike); clicking the active reaction clears it.
- `lesson_comments` is a one-level thread per lesson. Soft deletes hide a
  top-level comment together with its replies; `lesson_comment_votes` stores
  one vote per user and comment, and authors cannot vote on their own comment.
- The lesson page server-renders the reaction summary and the first page of
  comments. The client then uses
  `/api/v1/learning/topics/<module>/<topic>/reaction` and
  `/api/v1/learning/topics/<module>/<topic>/comments` for updates. Posting
  requires a signed-in session (`401` otherwise); deleting another user's
  comment is `403`; an unknown track or topic is `404`.
- Signed-in learners can report another user's comment (one report per user
  and comment). Reports are audit-logged and admins get an in-app `SYSTEM`
  notification (and an email when their address is verified) pointing at the
  lesson discussion.
- Admins resolve reports from `/admin/lesson-reports` (filters: open, resolved,
  all; resolve is one-way and stamped with the admin and time).
- If the social tables are missing (a deploy skipped migrations), the API
  answers `503` with a clear message and the lesson page renders a neutral
  "Discussion is being set up" panel instead of failing.
- Reaction counts are cached in Redis for 30 seconds and invalidated on every
  reaction write; a cache miss falls back to one aggregate query.
- Reads are bounded: the reaction summary is one aggregate query, the first
  comment page fetches top-level rows with a window count and replies in a
  second indexed query.
- The lesson header shows solved progress as a donut instead of a linear bar.

## Premium modules and manual payments

Modules 1–2 are free. Modules 3–7 are premium and gated server-side:

- Pricing: ৳200 per module or ৳700 for all five (server-side amounts; the UI
  never sends a price).
- Flow: the learner sends money with bKash Send Money or a City Bank
  transfer, submits the TrxID + sender number at `/learn/pricing`, and an
  admin approves it from `/admin/payments`. TrxIDs are normalized (upper case, no spaces) and unique
  across the whole system; the same ID cannot be submitted twice.
- Approval writes one `lesson_entitlements` row per module (a bundle writes
  all five). Entitled modules skip the sequential badge unlock so a purchase
  is usable immediately; checkpoint starts require the entitlement.
- A learner without money can request free access with a reason. The same
  admin queue approves it and grants a `SCHOLARSHIP` entitlement. Admins can
  also grant access manually by username from the queue page.
- New payments and free-access requests notify every active admin in-app and
  point at `/admin/payments`. The admin sidebar shows **Payments & access**
  with a pending-count badge, and `/admin` shows a review callout while
  anything is waiting.
- Paywalled module/topic pages never render the concept note or problem sets;
  the public problem archive is unchanged.
- Manual payment details come from `PAYMENT_BKASH_*`, `PAYMENT_CITYBANK_*`
  and `PAYMENT_INSTRUCTIONS`. QR images live **outside the repository** in
  `PAYMENT_QR_DIR` (`bkash.png`, `citybank.png`) and are served only to
  signed-in users by `/api/learning/payment-qr/<method>` with
  `X-Robots-Tag: noindex`; the pricing page is `noindex` as well. New QR files
  are re-encoded (metadata stripped) before upload and never committed.
- Admin verification: match the TrxID in the bKash/City Bank app, the amount,
  the time and the sender number before approving. Reject with a note if
  anything does not match; approvals, rejections, revokes and grants are
  audit-logged. Decisions notify the learner in-app and by email (verified
  addresses only).
- Approved access can be revoked from the same queue with a reason; the
  entitlement rows for that order are removed and the paywall returns. Only
  approved orders can be revoked (one-way).
- Existing learners can be grandfathered before the paywall goes live:
  `pnpm learning:grant-legacy` is a dry run that lists every learner with an
  accepted practice submission or completed checkpoint in a premium module;
  add `--apply` to grant those modules as scholarships.

## Career toolkit (free)

Two free `tools` tracks turn the same learning shell into job-ready workflow
training. They are always open: no purchase, no previous checkpoint and no
sequential lock. Their topics use the `WORKSHOP` practice tier, so the lesson is
the main event and the judge drills check understanding.

- **Git & GitHub** (`git-github`, track 10, 10h): snapshots, staging and history;
  branches, merges and conflicts; GitHub flow, pull-request gates, release tags
  and safe recovery. The story follows নুসরাত from her first commit to her first
  production hotfix.
- **Docker & CI/CD** (`docker-cicd`, track 11, 12h): images, containers and
  Dockerfile layers; Compose, healthchecks, secrets and multi-stage production
  images; GitHub Actions pipelines, matrix/cache, deploy gates and rollback
  drills. The story follows the same team from "works on my machine" to a
  Friday release and its incident review.

Each topic is a long-form Bangla story (roughly 6,000–8,000 characters) with
the standard five sections (`কেন দরকার`, `মূল ধারণা`, `কোডে দেখি`, `ধাপে ধাপে`,
`সাধারণ ভুল`), a hands-on terminal lab, a cheat sheet and a "professional habit"
note. The
labs run on the learner's own machine; they are not executed by the judge.
Each topic has two guided drills and two solo drills, and the module ends with
a normal 45-minute three-problem checkpoint and badge.

Content paths:

| Layer | Path |
| --- | --- |
| Track/topic metadata and concept notes | `src/lib/learning/tools/git/`, `src/lib/learning/tools/docker/` |
| Problem definitions | `src/server/db/learning/tools/git/`, `src/server/db/learning/tools/docker/` |
| Module map SVGs | `public/learning/git-github.svg`, `public/learning/docker-cicd.svg` |

The `WORKSHOP` tier requires two guided and two solo problems per topic; the
validator holds it to the same test, editorial and reference-solution rules as
the other tracks. Because these tracks are free, `requiresPurchase` stays false
and `moduleUnlock` bypasses the sequential badge gate for `track === "tools"`.

## SQL Labs (ShopSphere project)

`/learn/sql` is the ShopSphere hub; the actual curriculum lives in two formal
learning modules (23 topics, 46 guided problems, 84 practice problems,
2 checkpoints, 136 judge problems / 680 tests total) so progress, checkpoints and badges behave like the other
tracks. Every task is a **normal judge problem** with points, time and memory
limits, visible in the problem list.

- **Basic SQL** (`basic-sql`, track 08, free, 40h): vendor directory, low stock,
  revenue/receipts, dead stock, stock buckets, above-category-average prices,
  customers without orders, set operations/data quality, case-insensitive
  search + date ranges, and the order lifecycle (payments, shipments, returns).
  Covers `SELECT/WHERE/ORDER BY`, joins, aggregates, `HAVING`, `LEFT JOIN`/`NOT
  EXISTS`, `CASE`, correlated subqueries, `UNION`/`EXCEPT`, text/date functions
  and lifecycle reconciliation, plus the 45-minute *ShopSphere Analyst*
  checkpoint.
- **Advanced SQL** (`advanced-sql`, track 09, ৳500, separate from the ৳700 code
  bundle, 56h): ranking, running totals and 7-row moving averages, recursive
  category/referral trees, category share and month-over-month growth, cart
  funnels, coupon attribution, JSON product attributes, inventory-ledger
  reconciliation, vendor payout reconciliation, refund impact and a
  vendor/cohort capstone. Covers `RANK`, `LAG`/`LEAD`, `NTILE`, named windows,
  frames/partitions, recursive CTEs, pivot/conditional aggregation, JSON1,
  multi-step CTEs, keyset pagination, sargable date filters and finance
  reconciliation, plus the *ShopSphere Architect* checkpoint. Access uses the
  `advanced-sql` entitlement and is enforced on the module and problem pages,
  the problem list and submission creation.
- The fixture is a 19-table marketplace: core commerce plus payments,
  shipments, returns, coupons/redemptions, carts/items, product variants,
  inventory movements, JSON attributes and vendor payouts. All expected rows
  are generated from `judge/shopsphere.sql`.
- `/learn/sql/project` is the shared industry-project dossier behind both SQL
  tracks: seven feature squads, 23 work tickets (one per SQL topic), a 19-table
  data dictionary with primary/foreign keys and seeded row counts, ten metric
  definitions, a twelve-item handover checklist with judge-problem proofs,
  staff-engineer defense questions and a six-step ticket workflow. Every SQL
  topic renders its ticket from the same data, and the SQL hub plus both track
  overviews link to the dossier. `public/learning/shopsphere.sql` is a
  byte-identical download of `judge/shopsphere.sql`; `sql-project.test.ts`
  parses the fixture and fails if a table, column, ticket, epic, metric or
  problem reference drifts.
- Every topic has 2 guided + 4 practice problems (two easy/medium warm-ups and two hard/challenge sets); four
  advanced lab topics add writable DDL/DML/transaction practice. Every SQL
  problem ships with five judge tests (two visible samples, at least three
  distinct expected outputs); the lab track uses the `sql-script` runner,
  which executes multiple statements in a disposable in-memory database and
  compares the final SELECT. ATTACH/DETACH/PRAGMA are denied.
- The judge runs each SQL family on its own engine inside the sandbox:
  `sql`/`sqlite` use SQLite 3, `mysql` boots a real MariaDB 10.11 server on a
  private unix socket with no networking, and `postgresql` boots a real
  PostgreSQL 15 server the same way. MySQL and PostgreSQL submissions run as a
  SELECT-only role against a fresh fixture; SQLite submissions use the
  read-only in-memory fixture. MySQL/PostgreSQL accept one read-only statement
  per submission. `sql-script` labs stay SQLite-only: the allowlisted writable
  authorizer executes DDL/DML/transactions in a disposable in-memory database
  and compares the final SELECT. ATTACH/DETACH/PRAGMA are denied.
- Engine compatibility is intentionally small and visible in the fixtures:
  each fixture supplies SQLite-shaped scalar helpers (`julianday`, `json_extract`,
  `strftime`, `round` and text/integer comparison) plus the standard
  `CONCAT`/`IF`/`DATE_FORMAT`/`TO_CHAR`/`DATE_TRUNC`/`YEAR`/`MONTH`/`DAY`
  functions, so the portable curriculum queries produce the same rows on every
  engine. MySQL normalizes `GLOB` to `LIKE` and JSON extraction; PostgreSQL
  rewrites SQLite casts and `LIMIT offset,count`, and adds the missing SELECT
  columns to `GROUP BY` when a query groups by another table's key (SQLite and
  MySQL allow this relaxed grouping; PostgreSQL normally rejects it). The
  `sql` option is the portable default: it uses the same SQLite engine but also
  accepts the MySQL/PostgreSQL syntax shims above, while `sqlite` runs native
  SQLite only. So there are four SQL choices backed by three real engines
  (SQLite, MariaDB and PostgreSQL). Engine-specific features outside this
  subset are not available; portable standard SQL is still the safest choice.

- `/sql-handbook` covers the production layer a read-only SELECT judge cannot
  grade: schema design/constraints/normalization/migrations, DDL/DML safety,
  ACID/transactions/isolation/locks, views/materialized views, roles/RLS/SQL
  injection, index/EXPLAIN/statistics, partitioning/full-text/arrays/ranges,
  stored procedures/triggers and MySQL/PostgreSQL/SQLite differences. The
  curriculum was audited against roadmap.sh SQL, PostgreSQL 19's SQL Language
  docs, Use The Index Luke and SQLBolt.
- Problems are seeded with `judge_language = 'sql'` and an optional
  `premium_module_slug`; the submit panel only shows supported languages.
  `learning:check` / `learning:audit` skip SQL tracks because their reference
  solutions are SQL rather than the Python editorial pipeline; the SQL judge
  fixture and expected rows are the source of truth.

## Release checklist

1. `pnpm db:migrate && pnpm db:check` — applies every additive migration and
   verifies the database matches the shipped drizzle journal.
2. `pnpm learning:check && pnpm learning:audit` — validates every solution,
   editorial and difficulty label.
3. `pnpm db:seed` — upserts the live curriculum problems and test cases. The
   seed is idempotent; run it twice on staging before a release.
4. Rebuild the judge image after a harness **or fixture** change
   (`pnpm judge:build`), then deploy the web and worker images.
5. `pnpm sql:check` — runs every SQL reference solution against SQLite, MariaDB
   and PostgreSQL; all submissions must be `ACCEPTED`.
6. Smoke `/learn`, a live module, a live topic and a checkpoint start with a
   non-admin account; click a lesson's previous/next pager, the last topic's
   checkpoint card and a module's next-track pager. On the SQL tracks also check
   `/learn/sql/project` and the `/learning/shopsphere.sql` download. Confirm an
   unknown track returns a real `404`.
7. Keep `SEED_DEMO_DATA=false` in production; the seed still creates the admin
   account and curriculum content.
8. Confirm no checkpoint attempts or QA submissions were left behind on the
   staging database.
