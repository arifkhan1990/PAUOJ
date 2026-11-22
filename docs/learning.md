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

Each topic also carries two extra "try it yourself" problems after the practice
set. Progress is derived from accepted, non-assessment submissions, so nothing
extra is stored per learner.

## Current release

**All seven tracks ship in this release.** The curriculum contains 34 topics,
**284 original problems** and **1,815 tests**. Module 1 has the full practice
tier: three easy, three medium and two hard problems per topic, plus two extra
problems. Tracks 2–7 use a compact starter tier: one easy, one medium and one
hard practice problem per topic, plus two extra problems. Every track ends with
a mixed three-problem checkpoint and a module badge.

Module 1 contains five topics:

- Input, Loops & Conditionals
- Time & Space Complexity
- Basic Math & Number Theory
- Bit Manipulation Basics
- Strings & 1D/2D Arrays

Every topic has one Bangla concept note, guided problems, a tiered practice set,
two extra problems and a mixed three-problem checkpoint. Every problem has
hidden tests, a reference Python solution and a Bangla editorial.

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

## Release checklist

1. `pnpm db:migrate` — applies the additive checkpoint migration.
2. `pnpm db:seed` — upserts the live curriculum problems and test cases. The
   seed is idempotent; run it twice on staging before a release.
3. Rebuild the judge image after a harness change (`pnpm judge:build`), then
   deploy the web and worker images.
4. Smoke `/learn`, a live module, a live topic and a checkpoint start with a
   non-admin account. Confirm an unknown track returns a real `404`.
5. Keep `SEED_DEMO_DATA=false` in production; the seed still creates the admin
   account and curriculum content.
6. Confirm no checkpoint attempts or QA submissions were left behind on the
   staging database.
