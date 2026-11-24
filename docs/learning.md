# Learning tracks

PAU OJ ships a curated seven-track curriculum that turns the judge into a study
path, not only a problem archive. The tracks follow one sequence:

1. Basic Programming & Math
2. Basic Data Structures
3. Basic & Intermediate Algorithms
4. Trees & Graphs
5. Dynamic Programming
6. Advanced Data Structures
7. Advanced Algorithms

## How a module works

Every live module follows the same four-step loop:

| Step | What the learner gets | Purpose |
| --- | --- | --- |
| 1. Concept note | A short Bangla article with diagrams and code templates | Understand the idea before solving |
| 2. Guided problems | Two warm-up problems with a clear story | Apply the idea with confidence |
| 3. Tiered practice | Easy, medium and hard problems | Build real control of the topic |
| 4. Checkpoint | A timed three-problem set and a badge | Prove readiness and unlock the reward |

Each topic also carries two or three extra "try it yourself" problems after the practice
set. Progress is derived from accepted, non-assessment submissions, so nothing
extra is stored per learner.

## Current release

**All seven tracks ship in this release.** The curriculum contains 34 topics,
**430 original problems** and **2,750 tests**. Every topic has the full practice
tier: three easy, three medium and two hard problems, plus two or three extra
problems. Every track ends with a mixed three-problem checkpoint and a module badge.

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
  previous track's checkpoint badge is earned. The API enforces the same rule,
  not only the UI, and locked module/topic pages show the previous checkpoint
  requirement.
- Earned and locked learning badges are listed in the profile's learning badge
  cabinet and link back to the track.

## Where the content lives

| Layer | Path |
| --- | --- |
| Track/topic metadata and concept notes | `src/lib/learning/modules.ts`, `src/lib/learning/module-1/` |
| Problem definitions | `src/server/db/learning/module-1/` |
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
3. Register the arrays in `src/server/db/learning/index.ts`.
4. Write tests, a reference Python solution and an editorial for every problem.
5. Run `pnpm learning:check --module=<module-slug>`.
6. Run `pnpm db:seed` locally, open `/learn/<module-slug>` and walk the topic
   pages and the checkpoint once.
7. Update this file, `README.md`, `docs/architecture.md`, `CHANGELOG.md` and the
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

## SQL Labs (ShopSphere project)

`/learn/sql` is the ShopSphere hub; the actual curriculum lives in two formal
learning modules (23 topics, 46 guided problems, 42 practice problems,
2 checkpoints, 94 judge problems / 470 tests total) so progress, checkpoints and badges behave like the other
tracks. Every task is a **normal judge problem** with points, time and memory
limits, visible in the problem list.

- **Basic SQL** (`basic-sql`, track 08, free, 32h): vendor directory, low stock,
  revenue/receipts, dead stock, stock buckets, above-category-average prices,
  customers without orders, set operations/data quality, case-insensitive
  search + date ranges, and the order lifecycle (payments, shipments, returns).
  Covers `SELECT/WHERE/ORDER BY`, joins, aggregates, `HAVING`, `LEFT JOIN`/`NOT
  EXISTS`, `CASE`, correlated subqueries, `UNION`/`EXCEPT`, text/date functions
  and lifecycle reconciliation, plus the 45-minute *ShopSphere Analyst*
  checkpoint.
- **Advanced SQL** (`advanced-sql`, track 09, ৳500, separate from the ৳700 code
  bundle, 44h): ranking, running totals and 7-row moving averages, recursive
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
- Every topic has 2 guided + 2 practice problems (one easy, one medium); four
  advanced lab topics add writable DDL/DML/transaction practice. Every SQL
  problem ships with five judge tests (two visible samples, at least three
  distinct expected outputs); the lab track uses the `sql-script` runner,
  which executes multiple statements in a disposable in-memory database and
  compares the final SELECT. ATTACH/DETACH/PRAGMA are denied.
- The judge runs SQL in a read-only SQLite copy of the fixture for normal
  problems; `sql-script` labs use the same fixture with an allowlisted writable
  authorizer (ATTACH/PRAGMA/file access denied). Test setup
  statements run before the read-only authorizer; they come from seeded hidden
  tests, while custom-run input can execute arbitrary SQL only inside the
  disposable sandbox. The SQL, MySQL and PostgreSQL options share that engine
  through a compatibility layer: backticks, `ILIKE`, MySQL `LIMIT
  offset,count`, `FETCH FIRST`, PostgreSQL `::` casts and `EXTRACT`, plus
  common `CONCAT`, `IF`, `DATE_FORMAT`, `TO_CHAR`, `DATE_TRUNC`,
  `YEAR`/`MONTH`/`DAY` functions. JSON questions accept SQLite `json_extract`,
  PostgreSQL `attributes::jsonb->>'key'` and MySQL
  `JSON_UNQUOTE(JSON_EXTRACT(...))` through the same compatibility layer.
  Engine-specific features outside this subset are not available; portable
  standard SQL is the safest choice.
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
3. Rebuild the judge image after a harness **or fixture** change (`pnpm judge:build`), then
   deploy the web and worker images.
4. Smoke `/learn`, a live module, a live topic and a checkpoint start with a
   non-admin account. Confirm an unknown track returns a real `404`.
5. Keep `SEED_DEMO_DATA=false` in production; the seed still creates the admin
   account and curriculum content.
6. Confirm no checkpoint attempts or QA submissions were left behind on the
   staging database.
