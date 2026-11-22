# Documentation index

PAU OJ has one short front door and three deep guides. This page says which file
owns what, who reads it, and where a change belongs.

## Start here

**New developer**
1. [README.md](../README.md) — pitch, features, stack, quick start and local setup.
2. [architecture.md](architecture.md) — how the app, worker, database and judge fit together.
3. [api.md](api.md) — endpoints, payloads and auth rules when you touch the API.
4. [AGENTS.md](../AGENTS.md) — coding rules and the Definition of Done (local-only).

**Operator / deployer**
1. [deploy/README.md](../deploy/README.md) — hardened single-server runbook.
2. [deployment.md](deployment.md) — topology, TLS, backups, monitoring, troubleshooting.
3. [README.md](../README.md#environment-variables) — the environment variables you must set.

**API consumer**
1. [api.md](api.md) — full `/api/v1` reference, response shape and errors.
2. [architecture.md](architecture.md#authentication-and-authorization) — sessions, roles and scoping.

**Contributor / AI agent**
1. [AGENTS.md](../AGENTS.md) — stack, session start, core rules, hygiene, DoD.
2. [`.opencode/rules/`](../.opencode/rules/) — frontend, backend, workflow, docs and autonomy rules.
3. [`.ai/PROGRESS.md`](../.ai/PROGRESS.md) and [`.ai/TASKS.md`](../.ai/TASKS.md) — current task state.
4. This file — the map you must keep current.

## Document map

| File | What it covers | Audience | Update when |
| --- | --- | --- | --- |
| [README.md](../README.md) | Product pitch, features (assessment join modes, invites, results CSV, problem publication review), stack, quick start, local dev, judge summary, languages, env vars, API overview, structure, testing, limitations | Everyone | A user-visible feature, command, env var or limitation changes |
| [architecture.md](architecture.md) | Runtime components, submission flow, DB model, problem publication review, auth, contests, assessment invites and join modes, dashboards, profile, judge sandbox, recovery | Engineers | Behavior, data model or design decisions change |
| [learning.md](learning.md) | Seven-track learning curriculum, four-step module flow, checkpoint rules, content paths and authoring/validation workflow | Engineers, content authors | A track, module format, checkpoint rule or content path changes |
| [api.md](api.md) | Full `/api/v1` reference: auth, problems, problem publication review, submissions, runs, contests, assessments (join, invite claim, roster import, results CSV), ranking, admin, notifications, health | API consumers, frontend/backend | Any endpoint, payload, auth rule or error code changes |
| [deployment.md](deployment.md) | Target topology, server setup, reverse proxy/TLS, transactional email sender, backups, monitoring, security checklist, updates, troubleshooting | Operators | Infrastructure, ports, backup, email or recovery steps change |
| [deploy/README.md](../deploy/README.md) | Production runbook: server requirements, first deploy, backups, monitoring, updates/rollback, CI/CD, security checklist | Operators | Deploy scripts, Compose prod files or CI/CD change |
| [CHANGELOG.md](../CHANGELOG.md) | Release history (Keep a Changelog, SemVer); also rendered at `/changelog` | Everyone | Every release, in the same change that ships it |
| [assets/](assets/) | README screenshots: home, problem workspace, assessment session, assessment join | Docs authors | The UI changes enough to make a screenshot misleading |

## Find a topic fast

| Question | Read |
| --- | --- |
| How does a submission reach a verdict? | [architecture.md](architecture.md#request-flow-submission) |
| How is the sandbox locked down? | [architecture.md](architecture.md#judge-sandbox) |
| How does login, email verification or a role check work? | [architecture.md](architecture.md#authentication-and-authorization) |
| How are ICPC standings and ratings calculated? | [architecture.md](architecture.md#icpc-scoring) |
| What are the contest and assessment access rules? | [architecture.md](architecture.md#contest-access-rules) |
| How do assessment invite links, join modes and claim assurance work? | [architecture.md](architecture.md#assessment-invites-and-join-modes) |
| How does a new problem get approved and published? | [architecture.md](architecture.md#problem-publication-review) |
| How do learning tracks, concept notes and checkpoints work? | [learning.md](learning.md) |
| What does `POST /problem-reviews/:problemId` accept? | [api.md](api.md#problem-publication-review) |
| What does `POST /assessments/:slug/join` accept and which errors can it return? | [api.md](api.md#coding-assessments) |
| Which env var do I set for SMTP, judge or ports? | [README.md](../README.md#environment-variables) |
| What does `POST /submissions` accept? | [api.md](api.md#post-submissions) |
| Where are the production scripts? | [deploy/README.md](../deploy/README.md) |

## Local-only, never published

These files are excluded from the product docs, the Docker image and the repo
history:

- [AGENTS.md](../AGENTS.md) — AI/contributor working rules.
- [`.opencode/rules/`](../.opencode/rules/) — `frontend.md`, `backend.md`, `workflow.md`,
  `docs.md`, `autonomy.md`.
- `.ai/` — [`PROGRESS.md`](../.ai/PROGRESS.md), [`TASKS.md`](../.ai/TASKS.md),
  [`ANSWERS.md`](../.ai/ANSWERS.md), [`QUESTIONS.md`](../.ai/QUESTIONS.md) and `logs/` when present.

Also excluded from this map: `PAU-OJ-Design/` is the original static design
reference (not built), and `rules-kit/` is a separate reusable rules kit, not part
of the application.

## Where to write what

- **Behavior, data model or design decision** → `docs/architecture.md`.
- **Endpoint, payload, auth rule or error code** → `docs/api.md`.
- **Infrastructure, Compose, TLS, backups, monitoring** → `docs/deployment.md`
  for the guide and `deploy/README.md` for the runbook.
- **Release notes and version** → `CHANGELOG.md` (and the `/changelog` page reads it).
- **Task state, progress, open questions** → `.ai/`.
- **Agent and contributor rules** → `AGENTS.md`.
- **User-facing capability, command, env var or limitation** → `README.md`.

If you add, rename or remove a document, update this file in the same change.
