# API reference

Base path: `/api/v1`. All requests and responses are JSON unless noted. Session
cookies are HttpOnly; browser clients must use `credentials: same-origin`.

## Response shape

Success:

```json
{
  "data": {},
  "meta": { "page": 1, "pageSize": 20, "total": 42, "totalPages": 3 }
}
```

Error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some fields are invalid.",
    "details": [{ "path": "source", "message": "Too long" }]
  }
}
```

Common codes: `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404),
`CONFLICT` (409), `VALIDATION_ERROR` (422), `RATE_LIMITED` (429),
`CONTEST_LOCKED` (403), `DISCUSSION_LOCKED` (403), `SERVICE_UNAVAILABLE` (503).

## Auth

### POST `/auth/register`

```json
{
  "username": "tanvir",
  "displayName": "Tanvir Ahmed",
  "email": "tanvir@example.com",
  "password": "Secret123"
}
```

Creates the account and a session. Returns the safe user object.

### POST `/auth/login`

```json
{ "identifier": "tanvir", "password": "Secret123" }
```

### POST `/auth/logout`

Destroys the current session.

### GET `/auth/me`

Returns the current safe user or `null`.

### POST `/auth/verify-email`

```json
{ "token": "..." }
```

Marks the account email as verified. Tokens are single-use and expire after 24
hours.

### POST `/auth/resend-verification`

Authenticated; rate limited. Sends a fresh verification link.

### POST `/auth/forgot-password`

```json
{ "email": "tanvir@example.com" }
```

Always returns `{ "ok": true }` to avoid account enumeration. Sends a reset link
if the account exists. Reset tokens expire after one hour.

### POST `/auth/reset-password`

```json
{
  "token": "...",
  "newPassword": "NewSecret456",
  "confirmPassword": "NewSecret456"
}
```

Consumes the reset token, updates the password, marks the email verified and
revokes every session.

## Users

### PATCH `/users/me`

```json
{
  "displayName": "Tanvir A.",
  "bio": "C++ and graphs.",
  "country": "Bangladesh",
  "institution": "PrimeAsia University",
  "website": "tanvir.dev",
  "github": "@tanvir",
  "linkedin": "tanvir-ahmed",
  "currentStatus": "EMPLOYED",
  "companyName": "Acme",
  "jobTitle": "Backend Engineer",
  "skills": ["TypeScript", "PostgreSQL"],
  "phone": "01712-345678",
  "address": "House 42, Road 7, Dhaka 1200",
  "tshirtSize": "L",
  "presenceVisibility": "FOLLOWERS"
}
```

`website`, `github` and `linkedin` are optional. A bare domain, `@handle`,
`github.com/handle`, `linkedin.com/in/slug` or a full profile URL is normalized
to a public `https` URL. Only `http(s)` targets are accepted; credentials,
other schemes, foreign hosts and invalid paths return `422`. Send an empty
string to clear any optional profile field; omitting a field keeps the stored value.

`currentStatus` is one of `STUDENT`, `EMPLOYED`, `FREELANCER`, `JOB_SEEKER` or
`OTHER`; `skills` accepts up to 12 items of 1–30 characters (deduplicated
case-insensitively); `tshirtSize` is `XS`–`XXXL`; `presenceVisibility` is `EVERYONE`, `FOLLOWERS`
or `NOBODY`. `phone` accepts a Bangladeshi
`01XXXXXXXXX` / `8801XXXXXXXXX` number or an international `+` number and is
stored normalized (for example `+8801712345678`).

Public profile fields are `currentStatus`, `companyName`, `jobTitle` and
`skills`. `address`, `phone` and `tshirtSize` are **private**: they are returned
only to the account owner and to admins on `/admin/users/:id`; they are never
included in the public profile or another user's response.

### Profile avatars

`PATCH /users/me/avatar` selects a preset or clears it:

```json
{ "preset": "cat" }
```

`preset` is one of `cat`, `dog`, `bird`, `fish`, `rabbit`, `squirrel`,
`turtle`, `panda`, `ghost`, `rocket`, `bot`, `gamepad`, or `null` for the
initials avatar. Selecting a preset removes any uploaded photo. The response is
`{ "avatarPreset": "cat", "avatarImageUpdatedAt": null }`.

`POST /users/me/avatar` accepts multipart form data with a `file` field. PNG,
JPEG and WebP are detected from the bytes (never the filename), at most 1 MB
and 2048×2048 pixels. The response carries the new
`avatarImageUpdatedAt` version. `DELETE /users/me/avatar` removes the uploaded
photo and keeps the preset (or initials) as the fallback. All three endpoints
require a session, same-origin requests and rate limits (10 uploads/hour, 30
preset/delete changes/minute).

`GET /users/:username/avatar?v=<version>` returns the uploaded image with
`Content-Type`, `nosniff`, a same-origin resource policy and a one-year
immutable cache because the URL changes on every upload. Unknown users, banned
users and users without an upload return `404`. Preset avatars render inline in
the UI and do not call this endpoint.

### POST/DELETE `/users/:username/follow`

`POST` creates a **follow request**; the target must accept it before a follow
edge exists. `DELETE` cancels a pending request or unfollows an accepted edge.
Both are idempotent and return the caller-visible state:

```json
{
  "data": {
    "following": false,
    "requested": true,
    "incomingRequest": false,
    "followerCount": 12,
    "followingCount": 8,
    "blocked": false,
    "canMessage": false
  }
}
```

Only accepted edges count in `followerCount`/`followingCount` and in the
paginated lists at `/users/:username/connections`. Rules: `401` anonymous, `404`
unknown or banned user, `422` self-follow, `403` when either side blocked the
other, `429` after 40 follows or 40 unfollows per hour. A request creates one
in-app `FOLLOW_REQUEST` notification for the target (`dedupeKey` per follower);
acceptance creates one `FOLLOW_ACCEPTED` notification for the requester. No
follow email is sent. A mutual request is auto-accepted: following someone who
already has a pending request to you completes both edges. Profiles expose the
coarse presence label on a five-minute online window: `Online now` or
`Last active 7m/3h/2d/3w/4mo/1y ago` (a cleared timestamp reads
`No recent activity`), subject to the target's visibility setting; exact
timestamps are never returned. Presence also appears on the points and contest
rating boards, where the viewer's own accepted-follow relation decides
`FOLLOWERS` visibility.

### GET `/follow-requests?page=1`

Returns the caller's incoming pending requests (`data` array, `meta` with
`page`, `pageSize`, `total`, `totalPages`; 20 per page), newest first, with the
requester's username, display name, institution, rating, requested time and
presence. Banned and blocked accounts are excluded.

### POST `/users/:username/follow/accept` and `/follow/decline`

Accept or decline the incoming pending request from `:username`. Accept turns
it into an accepted edge (`acceptedAt`, `FOLLOW_ACCEPTED` notice for the
requester) and marks the caller's request notice read; decline removes the
pending row and its notice. Both return the caller-visible follow state. `404`
when there is no pending request from that user, `429` after 60 responses per
hour.

### POST/DELETE `/users/:username/block`

`POST` blocks the user and `DELETE` unblocks them. Blocking removes every follow
edge in both directions (pending or accepted) in the same transaction, stops
new follows/requests and messages, and hides presence. Blocked profiles show an
"Unavailable" state to the other side; the blocker sees an Unblock action.
`401` anonymous, `404` unknown/banned user, `422` self-block, `429` after 20
blocks per hour. `GET /blocks` lists up to 200 of the caller's blocked users (username,
display name, blocked time), newest first.

### POST `/presence/heartbeat`

Records activity for the signed-in caller at most once a minute (Redis
throttle) and returns `{ "online": true }`. Session reads already touch presence
with the same throttle, so the heartbeat only keeps open tabs active. Presence
writes are best-effort and never fail authentication or rendering.
### POST `/users/me/password`

```json
{
  "currentPassword": "Secret123",
  "newPassword": "NewSecret456",
  "confirmPassword": "NewSecret456"
}
```

Revokes all sessions and issues a new one.

## Problems

### GET `/problems?page=1&pageSize=20&q=array&difficulty=EASY&tag=arrays`

Returns public problems visible to the caller — only `PUBLISHED` problems appear in this list.
Problems in a running contest are
hidden unless the caller is registered or an admin. Each item includes
`acceptedCount`, `submissionCount`, tags and `solvedByMe`/`attemptedByMe`.

### GET `/problems/:slug`

Returns statement, samples, limits, tags, editorial visibility and the active
contest context. Returns `CONTEST_LOCKED` when the problem belongs to a running
contest the caller has not registered for.

### PUT `/problems/:slug/rating`

Authenticated. Body `{ "rating": 4.5 }` accepts half-star values from `0.5` to
`5`. Returns `{ average, count, myRating }`; ratings are rejected with
`RATING_LOCKED` while the problem is in a running contest or assessment.

### GET `/problems/:slug/resources`

Returns verified resources (`title`, `url`, `description`, `author`). Locked with
`RESOURCES_LOCKED` during a running contest or assessment.

### POST `/problems/:slug/resources`

Problem author or admin. Body
`{ "title": "...", "url": "https://...", "description": "..." }`. Only http(s)
links are accepted.

### DELETE `/problems/:slug/resources/:id`

Problem author, resource author or admin.

### Problem contributions (author review)

Every problem has one owner: `problems.author_id` is the setter and the only
person (besides an admin) who can publish changes. Teachers can propose
statements, test cases and editorials; solvers can propose a community
editorial after an accepted submission. Proposals stay private until the owner
approves.

- `POST /problems/:slug/contributions` (not the owner)

Staff (teacher/admin) can propose `STATEMENT`, `TESTS` or `EDITORIAL`. A signed-in
solver can propose `EDITORIAL` after an accepted submission on the problem;
assessment-only acceptances do not count. Community contributors cannot send
statement or test proposals.

```json
{
  "kind": "EDITORIAL",
  "note": "Adds complexity analysis",
  "payload": { "editorial": "..." }
}
```

`kind` is `STATEMENT`, `TESTS` or `EDITORIAL`. Statement proposals replace the
statement and input/output/constraint blocks, editorial proposals replace the
editorial, and test proposals append tests after the existing suite (hidden tests
are never revealed or replaced). One pending proposal per contributor, problem
and kind is allowed. Proposals are rejected with `CONTRIBUTIONS_LOCKED` while the
problem is in a running contest or assessment.

- `PATCH /contributions/:id` with
  `{ "action": "approve" | "reject" | "withdraw", "reviewNote": "...", "rejudge": false }`
  - `approve`/`reject` require the problem author (any role) or an admin, and a
    reviewer cannot approve their own proposal. `reject` requires a review note.
    `withdraw` is allowed only for the contributor.
  - For a `TESTS` approval, `rejudge: true` requeues up to 500 standalone
    practice submissions (no contest, virtual-contest or assessment submissions)
    after the new tests are applied. The response adds `rejudged` and
    `rejudgeFailed`; rejudging is opt-in and audit logged as a batch.
  - Approval applies the payload, marks the proposal `APPROVED`, writes an audit
    log entry and notifies the contributor. Rejection keeps the live problem
    untouched and notifies the contributor with the note.

The problem editor lists pending counts, the review queues live at
`/teacher/contributions` and `/admin/contributions` (staff) or
`/dashboard/contributions` (any signed-in problem author), and the public
problem page shows a Contribute, Propose editorial or Review proposals action to
the right people.

- `GET /contributions/export?status=all&range=all` downloads a UTF-8 CSV of the
  caller's review data. Teachers and problem authors get their own problems;
  admins get the whole judge. `status` is `all`, `PENDING`, `APPROVED`,
  `REJECTED` or `WITHDRAWN`; `range` is `7`, `30` or `all`. Columns include the
  problem, kind, status, contributor/reviewer, notes, timestamps and review
  hours. Responses use `Content-Disposition: attachment`.

### Problem publication review

New problems go through a two-setter review before they can appear in the public list; a problem
saved through `POST /admin/problems` starts in review and cannot be published directly (see
[Admin and teacher content](#admin-and-teacher-content)).

- `GET /problem-reviews/:problemId` returns `{ data: review }` — the full review workspace: the
  statement/tests snapshot, `publicationStatus`, `reviewCycle`, `publishedAt`, `approvals`, `holds`,
  the `gates` checklist (`approvalCount`, `requiredApprovals`, `editorialReady`,
  `reviewerTestsReady`, `solutionReady`, `holdsClear`, `ready`, `missing`) and the caller's
  `viewer` capability flags. Allowed for the problem author and staff reviewers (`TEACHER`,
  `ADMIN`); a `USER` who is not the author gets 403/404, unrelated callers never see drafts, and an
  unknown problem id is 404. No session → 401.

- `POST /problem-reviews/:problemId` runs one action. The body is a discriminated union on
  `action`:

| Action | Payload | Who | Effect |
| --- | --- | --- | --- |
| `submit` | `{}` | author or admin | `DRAFT` → `IN_REVIEW`, `reviewCycle + 1` |
| `approve` | `note?`, `solutionLanguage`, `solutionSource`, `editorial?`, `tests?` | teacher/admin who is not the author, problem `IN_REVIEW`, no active hold, not yet approved this cycle | adds an `ACTIVE` approval; publishes when every gate passes |
| `hold` | `note` (required) | same reviewers as `approve`, one active hold each | `IN_REVIEW` → `CHANGES_REQUESTED`, active approvals become `SUPERSEDED` |
| `respond` | `holdId`, `response` (required) | author or admin | the hold becomes `ADDRESSED` |
| `resolve` | `holdId`, `note?` | the reviewer who raised the hold, or an admin | hold `RESOLVED`; when no `OPEN`/`ADDRESSED` hold remains → `IN_REVIEW`, `reviewCycle + 1` |
| `reopen` | `holdId`, `note` (required) | the reviewer who raised the hold, or an admin | the hold returns to `OPEN` |
| `publish` | `{}` | author or admin, problem `IN_REVIEW` with every gate | `IN_REVIEW` → `PUBLISHED` |
| `reopen_publication` | `note` (required) | author or admin, problem `PUBLISHED` | `PUBLISHED` → `DRAFT`; hidden from the public list, active approvals superseded; edit and submit again |

Field rules: `note` is optional and capped at 2,000 characters; `hold.note`, `reopen.note`,
`reopen_publication.note` and `respond.response` are required, 10–2,000 characters;
`solutionLanguage` must be a supported judge language and `solutionSource` is required
(1–65,536 characters); `editorial` is optional but needs at least 40 characters when present;
`tests` is an optional array (max 20) of `{ "input", "expectedOutput", "isSample" }` where empty
rows are rejected.

Response: `{ data: { review, published, reopened } }` — `published` reports that this action moved
the problem to `PUBLISHED`; `reopened` reports that the review round was reopened (the last hold was
resolved, or a published problem was withdrawn for re-review).

Errors:

| Status | When |
| --- | --- |
| 401 | no session |
| 403 | wrong role, not the author, a reviewer approving their own problem, or a caller who is not the hold raiser resolving/reopening a hold |
| 404 | unknown problem id, or a problem the caller may not see |
| 409 | already approved this cycle, an active hold already raised by this reviewer, or the problem is already reviewed/published |
| 422 | schema failure (short note, missing solution, empty tests) or a gate not met (missing editorial, second approval, reviewer test, open hold) |

Every action returns the refreshed `review`, so the workspace can re-render without a second GET.

The contribution pipeline follows the same content lock: `POST /problems/:slug/contributions` and
`PATCH /contributions/:id` reject statement/test proposals while the problem is `IN_REVIEW` or
`CHANGES_REQUESTED`, and a `PUBLISHED` problem accepts only `EDITORIAL` proposals.

### Study plans

Public pages: `GET /lists` and `GET /lists/:slug` (HTML). Plans are ordered
`sections` of problems with a level, an optional admin duration estimate and a
featured flag. Progress, attempts, section counts, difficulty mix and the next
unsolved problem are derived from non-assessment submissions, so there is no
per-item progress table. `study_list_enrollments` only records that a signed-in
learner started a plan.

- `POST /lists/:slug/enroll` and `DELETE /lists/:slug/enroll` require a session
  and the same-origin check. Both are idempotent and return `{ "enrolled": true }`
  or `{ "enrolled": false }`. Unknown or private plans return `404`; anonymous
  callers get `401`; repeated calls are rate limited.
- The problem list accepts `category`, `subcategory` and `company` filters in
  addition to search, difficulty and tag.

Admin payloads for `POST /admin/lists` and `PUT /admin/lists/:id` now use:

```json
{
  "title": "Array foundations",
  "slug": "array-foundations",
  "description": "Traversal, counting and two-pointer patterns.",
  "level": "BEGINNER",
  "estimatedMinutes": 75,
  "isFeatured": true,
  "isPublic": true,
  "sections": [
    { "title": "Traversal", "description": "Scan every element once.", "problemIds": ["uuid"] }
  ]
}
```

`sections` is required (1–20), every section needs at least one problem, a
problem may appear only once in a plan, a section holds at most 100 problems and
a plan at most 300. `level` is `BEGINNER`, `INTERMEDIATE` or `ADVANCED`;
`estimatedMinutes` is nullable. Only published public problems are accepted; a
draft, private or withdrawn problem returns `422`. Invalid payloads return `422`;
a duplicate slug returns `409`.

Signed-in learners can create their own private plans (maximum
`STUDY_PLAN_QUOTA = 10`), with the same section payload. The server forces
`isPublic: false` and `isFeatured: false`; the owner is `created_by`.

- `POST /lists` creates a private plan (`201 { id, slug }`).
- `PUT /lists/:slug` updates an owned plan; `DELETE /lists/:slug` deletes it and
  cascades its sections, items, enrollments and notes.
- `PUT /lists/:slug/notes/:problemSlug` with `{ "body": "..." }` upserts a
  private note (1–2000 characters); `DELETE` removes it. Notes are visible only
  to the viewer.
- Owners can open their private plan at `/lists/:slug`; other users get `404`.
  Admins manage admin-owned plans through `/admin/lists`. Notes are allowed on
  public plans and owned private plans.

## Submissions

### POST `/submissions`

```json
{
  "problemId": "uuid",
  "contestId": "uuid or null",
  "language": "cpp",
  "source": "#include <bits/stdc++.h>..."
}
```

Rate limited (5 per 30s, 100/hour per user). Returns `{ id, status: "QUEUED" }`.

### GET `/submissions`

Query: `page`, `pageSize`, `mine=true|false`, `status`, `language`,
`problem=<slug>`, `user=<username>`.

Anonymous and non-admin callers only receive public rows: published problems
and contest submissions from public contests that have ended. Admins can see the
full feed, and `mine=true` keeps the caller's own submissions visible.

### GET `/submissions/:id`

Returns verdict, test results, compile output and source when permitted. The
payload includes `problemId`, `isOwner` (the caller authored the submission) and,
for the owner only, `note` (the private note text or `null`).

### GET `/submissions/:id/analysis`

Returns `{ "data": analysis }` for an accepted, settled submission, or
`{ "data": null }` when the run is not accepted, has no metrics, belongs to an
assessment, or its contest is still running. Unknown ids return `404`.

`runtime` and `memory` each contain:

- `value`: the run's metric (ms or KB).
- `beats`: percentage of comparable runs this run is faster/smaller than
  (`0-100`, `null` under five samples). Ties do not count as beaten.
- `sampleSize` and `scope`: `"language"` for same-language samples, `"all"` when
  a metric had fewer than five same-language rows and widened to every language.
- `buckets`: `min`, `max` (exclusive; `null` on the last bucket), `count`,
  `share` (`0-100`) and `current` (the run's bucket).
- `median` and `best` for the sample.

Samples are accepted rows on the same problem, excluding assessment and
virtual-contest submissions. Contest runs become comparable once the contest has
ended.

### PUT `/submissions/:id/notes`

Owner only; unknown ids and other users' submissions return `404`. Same-origin
and rate limited to 60 requests per minute. Body `{ "body": "..." }` trimmed to
1–2000 characters, returns `{ "note": "..." }` and upserts the one private note
attached to that submission. `DELETE` removes it and returns `{ "note": null }`.

### GET `/submissions/:id/events`

Server-Sent Events stream:

```
event: update
data: { ...submission detail... }

event: done
data: { "id": "uuid" }
```

## Custom runs

### POST `/runs`

```json
{
  "problemId": "uuid or null",
  "language": "python",
  "source": "print(sum(map(int, input().split())))",
  "stdin": "2 3\n"
}
```

Returns `{ runId }`. Runs are private to the authenticated user and expire after
15 minutes.

### GET `/runs/:id`

```json
{
  "id": "uuid",
  "status": "ACCEPTED",
  "stdout": "5\n",
  "stderr": "",
  "compileOutput": "",
  "runtimeMs": 31,
  "memoryKb": 9200,
  "finished": true
}
```

## Problem discussions

### GET `/problems/:slug/comments?page=1&sort=top`

Returns top-level comments with their replies. `sort` is `top` or `new`.
Comments are only available while the problem is not part of a running contest
or assessment; otherwise the API returns `DISCUSSION_LOCKED` (403).

Each comment includes `id`, `body`, `score`, `myVote` (`-1`, `0` or `1`),
`canDelete`, `createdAt`, `updatedAt`, `author` and `replies`.

### POST `/problems/:slug/comments`

Authenticated. Rate limited to 5 comments per minute.

```json
{ "body": "Try sorting the queries first.", "parentId": null }
```

`parentId` creates a reply; replies can only be one level deep.

### POST `/problems/:slug/comments/:id/vote`

Authenticated. Body `{ "value": 1 }`, `{ "value": -1 }` or `{ "value": 0 }` to
remove a vote. Returns `{ score, myVote }`. Authors cannot vote on their own
comments.

### DELETE `/problems/:slug/comments/:id`

Deletes the author's own comment (and its replies), or any comment when called
by an admin. Deletion is soft and admin deletions are written to the audit log.

## Contests

- `GET /contests?filter=ALL|UPCOMING|RUNNING|ENDED`
- `GET /contests/:slug`
- `POST /contests/:slug/register`
- `GET /contests/:slug/standings`

Standings rows include `rank`, `user`, `team`, `solved`, `penalty` and a map of
problem labels to `{ solved, attempts, solveTimeMinutes, firstBlood }`. In a
`GROUP` contest the `team` object carries the team name, member count and roster,
and the row identity is the captain. When a freeze window is active, public
responses set `frozen: true` and include `freezeAt`; admins get the live board.

### Team contests

A `GROUP` contest rejects individual registration (`409`); use teams:

- `POST /contests/:slug/teams` body `{ "name": "Team name" }` — creates the
  team, registers the captain and returns the invite code.
- `POST /contests/:slug/teams/join` body `{ "inviteCode": "ABCD2345" }` —
  joins a forming team before the start and registers the member.
- `DELETE /contests/:slug/teams/leave` — leaves before the start; captaincy
  transfers to the earliest remaining member or the team is disbanded.

Captain invitations are the primary flow:

- `POST /contests/:slug/teams/invites` body `{ "username": "nafisa" }` —
  captain only, before the start; the target gets an in-app notification.
- `PATCH /contests/:slug/teams/invites/:inviteId` body
  `{ "action": "ACCEPT" | "DECLINE" }` — invited coder only; accept registers
  them, decline closes the request.
- `DELETE /contests/:slug/teams/invites/:inviteId` — captain cancels a pending
  invitation.

Invite responses contain `{ invite }` (or `{ status: "CANCELLED" }`).
`GET /contests/:slug` includes `viewerTeam.pendingInvites` for the captain and
`incomingTeamInvite` for an unteamed invited coder. Crew members get `403`, a
full team gets `409`, and a duplicate team name is case-insensitively `409`.

### Sponsorships

- `POST /contests/:slug/sponsors` body
  `{ name, tier: TITLE|GOLD|SILVER|COMMUNITY, websiteUrl?, logoUrl?, message?, amountBdt? }`
  — any signed-in user; rate limited to 5 per hour; always `PENDING`.
- `GET /admin/contests/:id/sponsors` — admin/crew list with status and amount.
- `PATCH /admin/contests/:id/sponsors/:sponsorId` body
  `{ decision: APPROVED|REJECTED, note? }` — admin only; rejection needs a note.
  Approved sponsors appear on the public contest page and list card.

### Community hosting

- `POST /contests/host-requests` — any signed-in user; full data pack,
  `feeBdt` 3000–5000, `paymentReference` and `agreement: true`.
  The form shows the platform `PAYMENT_*` accounts. Rate limited to 5 per hour;
  duplicate open titles and reused TrxIDs are `409`.
- `GET /contests/host-requests` — the caller's own requests.
- `GET /admin/host-requests?status=…&page=…` — admin queue.
- `PATCH /admin/host-requests/:id` body
  `{ decision: UNDER_REVIEW|APPROVED|REJECTED|CONVERTED, note? }`.
  `APPROVED` marks the fee `PAID`; `CONVERTED` creates a private draft contest,
  makes the requester `DIRECTOR`, returns `{ status, contestId, slug }`.

### Monthly series

- `GET /admin/contest-series` — the monthly series row with cadence,
  Asia/Dhaka hour, duration and next/last generation time.
- `PUT /admin/contest-series` body `{ isActive, hour?, minute?, durationMinutes? }`
  — admin only; 10–300 minutes in the service, 30–300 in the route schema.
- `POST /admin/contest-series/ensure` — idempotently ensures the next
  third-Sunday 10:00 Asia/Dhaka 90-minute official contest and returns
  `{ created, contestId, startAt }`. The worker calls the same service hourly.

### Contest crew and operations

Contest crew endpoints are under `/admin/contests/:id` but authorize an admin,
the contest creator or an invited/accepted crew member. A problem author and a
pending/approved editorial or test contributor are implicit crew for
participation checks.

- `GET /admin/contests/:id/operations` — aggregate overview, crew, notes,
  candidates, sponsors and integrity summary.
- `GET|POST /admin/contests/:id/staff`; `DELETE /admin/contests/:id/staff/:staffId`
  — add/remove crew by `{ username, role }`; only admin/director.
- `GET|POST /admin/contests/:id/notes` — internal crew thread.
- `GET|POST /admin/contests/:id/candidates`; `PATCH /admin/contests/:id/candidates/:candidateId`
  body `{ status: SHORTLISTED|REJECTED }` — directors/setters propose,
  directors/admins decide.
- `GET /admin/contests/:id/integrity` — event totals, recent events and flagged
  users.

The crew workspace UI is at `/dashboard/contests/:id/operations` for directors
and crew; admins also use `/admin/contests/:id/operations`.

### Integrity events

`POST /contests/:slug/integrity-events` body
`{ type: TAB_HIDDEN|PASTE|COPY|CONTEXT_MENU|PRINT|FULLSCREEN_EXIT|RAPID_SUBMIT, problemId?, detail? }`.
Requires a running contest, a registered solo/team participant, a non-crew
actor and a problem that belongs to the contest; rate limited to 60/minute.
Events never contain code, keystrokes or PII and are review signals only.

### Contest editor fields

`POST/PUT /admin/contests` now also accept `bannerUrl`, `format`, `teamSize`
(2–6), `isOfficial`, `requiresFreshProblems`, `feeBdt` (3000–5000),
`feeReference`, `eligibility`, `rules` and `prizes`. `GET /contests/:slug` and
the list cards return `bannerUrl`; `POST /contests/host-requests` accepts an
optional `bannerUrl` that is copied into the converted contest. A fresh contest
accepts only unpublished problems that never appeared in another contest;
violations return `422` with `details.problems`. Debut rows are permanent until
the contest is deleted. Public contests still require every problem author's
approval.

### POST `/contests/:slug/virtual`

Starts (or restarts) a personal virtual replay of an ended public contest.
Returns `{ id }`. Virtual submissions carry `virtualContestId`, are excluded
from official standings/ratings, and run against the virtual start time.

### POST `/contests/:slug/virtual/finish`

Ends the current user's virtual replay early.

### Contest integrity

Admins can open `/admin/contests/:id/plagiarism` for token-shingle Jaccard
similarity signals between different users' contest submissions. The contest
operations Integrity tab adds live copy/paste/print/tab-hidden/fullscreen
signals from `contest_integrity_events`; both are review aids, not automatic
penalties.

### GET `/contests/:slug/submissions?mine=true&status=ACCEPTED&language=cpp`

Contest-scoped submission feed with the same verdict/language filters as the
global feed. Registered participants and admins can read it while the contest
runs; public ended contests open it to everyone. Private contests stay limited
to participants and admins.

### GET `/contests/:slug/clarifications?page=1`

Returns public questions and official answers. Registered participants and
admins can read while the contest runs; public ended contests are readable by
everyone. Each item includes `problem`, `asker`, `answerer`, `answer`,
`answeredAt` and `canAnswer`.

### POST `/contests/:slug/clarifications`

Authenticated participant. Rate limited to 10 questions per minute.

```json
{ "problemId": "uuid or null", "question": "Does problem A allow negative input?" }
```

`problemId` must belong to the contest; `null` creates a general question.

### PATCH `/contests/:slug/clarifications/:id`

Answers or updates a clarification. Allowed for admins, the contest creator and
the problem author. Body `{ "answer": "..." }`.

### Contest problem approvals

Every `contest_problems` row has an author-consent record. A setter's own
problems and all problems in an admin-created contest are approved
automatically. A teacher adding another setter's public problem creates a
`PENDING` request.

- A contest can be saved as a **private draft** with pending or declined
  problems, but `POST/PUT /admin/contests` rejects `isPublic: true` until every
  problem is approved (`VALIDATION_ERROR`, details list the problem titles).
  Remove a declined problem or ask the author to reconsider, then publish.
- `GET /teacher/contributions`, `/admin/contributions` and
  `/dashboard/contributions` show the pending requests for problem authors.
- `PATCH /contest-problem-approvals/:id` with
  `{ "action": "approve" | "reject", "reviewNote": "..." }` decides a request.
  The problem author or an admin can decide; rejection requires a note. Admins
  can also override an existing decline by updating the contest.
- Decisions are audit logged and notify the contest creator. Once all approvals
  are complete the creator gets a "ready to publish" notification.

### Contest ratings

Ratings finalise one hour after a contest ends, after a review and rejudge
window. A worker sweep finalises due contests every minute; contest/standings
page views call the same idempotent finaliser as a fallback. Finalisation waits
while any contest submission is queued or judging. The update uses Elo with
`K=32`, zero-sum normalisation and a rating floor of 100. Only non-banned
participants with at least one contest submission are rated. Team contests are
marked processed without individual rating changes. Once finalized, contest
submissions cannot be rejudged and the contest problem set/schedule is locked.
History is stored in `contest_rating_changes` and exposed on profile pages.

## Coding assessments

Assessments have a join mode set in the admin editor: `OPEN_CODE` (default — one shared access
code) or `INVITE` (personal links only; a bare code is refused with `INVITE_ONLY`).

### POST `/assessments/:slug/join`

Send exactly one of an access code or an invite token.

```json
{ "code": "PAU-TEST-2026" }
```

```json
{ "token": "…", "candidateRef": "2210145" }
```

Authenticated, same-origin, rate limited to 10 attempts per 15 minutes per user and assessment.
Both paths start (or resume) the candidate session and return `{ startedAt, expiresAt }`; a token
claim also returns `assurance` and `resumed`.

- `code` follows the `OPEN_CODE` path: `INVALID_ACCESS_CODE` (403) for a wrong code, `INVITE_ONLY`
  (403) when the assessment is invite-mode.
- `token` claims the personal link for the signed-in account. `candidateRef` is only read by
  invites that have no email, and it must match that invite's reference (case- and
  space-insensitive).

The token path reports phase and session problems with the specific codes below; the shared-code
path answers the same conditions with `NOT_FOUND` (404) and `CONFLICT` (409).

Claim outcome — the `assurance` recorded on the invite and participant:

| Invite email | Signed-in account | Result |
| --- | --- | --- |
| set | matches, email verified | `VERIFIED_EMAIL` |
| set | matches, unverified email | `EMAIL_MATCH` |
| set | missing or different email | `INVITE_EMAIL_MISMATCH` (403) |
| none | `candidateRef` matches | `REF_MATCH` |
| none | ref absent or different | `INVITE_REF_MISMATCH` (403) |

Error codes:

| Code | Status | Meaning |
| --- | --- | --- |
| `INVITE_ONLY` | 403 | Access code sent to an invite-mode assessment |
| `INVALID_ACCESS_CODE` | 403 | Wrong access code |
| `INVITE_NOT_FOUND` | 404 | Unknown token, wrong slug or unpublished assessment |
| `INVITE_EMAIL_MISMATCH` | 403 | Email invite opened by another account |
| `INVITE_REF_MISMATCH` | 403 | Candidate reference missing or wrong |
| `INVITE_CLAIMED` | 409 | Already claimed by another account |
| `INVITE_REVOKED` | 410 | Invite revoked; ask the organiser for a new link |
| `INVITE_EXPIRED` | 410 | Invite expired (assessment end) |
| `INVITE_RATE_LIMITED` | 429 | Sixth failed claim within 15 minutes |
| `INVITE_CLAIM_FAILED` | 409 | Lost a claim race; retry |
| `ASSESSMENT_NOT_STARTED` | 409 | The window has not opened |
| `ASSESSMENT_ENDED` | 410 | The window has closed |
| `ASSESSMENT_ALREADY_FINISHED` | 409 | This account already finished |
| `ASSESSMENT_SESSION_EXPIRED` | 410 | This account's session expired |
| `PARTICIPANT_ALREADY_BOUND` | 409 | This account is linked to a different candidate |
| `PARTICIPANT_START_FAILED` | 409 | Could not create the session; retry |
| `RATE_LIMITED` | 429 | More than 10 join attempts in 15 minutes |

A claim refused by the matrix (wrong account or wrong reference) increments the invite's
failed-claim counter; five failures are recorded per 15-minute window and the next attempt
returns `INVITE_RATE_LIMITED`. State refusals — already claimed, revoked, expired — do not
consume a slot. A participant who joined earlier with the code is bound to the invite on a
successful claim and keeps their original timer; a session that already finished or expired is
refused before any claim is consumed.

### POST `/assessments/:slug/finish`

Ends the candidate session early. No further submissions are accepted.

Assessment problem links return `ASSESSMENT_LOCKED` when the caller has not
joined or the session has expired. Private assessment problems return `404` to
users without access.

### GET `/assessments/:slug/invites/:token`

Read-only resolve used by the invite page. It never creates a participant, never starts a timer
and never moves the invite status, so mail scanners, prefetchers and chat unfurlers cannot consume
an attempt. It returns the assessment window and limited invite metadata — never the invited email
and never the full candidate reference:

```json
{
  "data": {
    "assessment": {
      "slug": "pau-coding-assessment-2026",
      "title": "PAU Coding Assessment",
      "startAt": "2026-11-21T09:00:00.000Z",
      "endAt": "2026-11-21T12:00:00.000Z",
      "durationMinutes": 60,
      "phase": "RUNNING"
    },
    "invite": {
      "status": "SENT",
      "candidateName": "Md. Rakib Hasan",
      "requiresRef": false,
      "refHint": "145",
      "hasEmail": true
    }
  }
}
```

`status` is `UNSENT`, `SENT`, `OPENED`, `CLAIMED`, `REVOKED` or `EXPIRED` (an invite past the
assessment end reads `EXPIRED`); `refHint` is only the last three characters of a reference longer
than eight characters, and `requiresRef` is true only for invites without an email. Unknown tokens
return `INVITE_NOT_FOUND` (404). Responses send `Referrer-Policy: no-referrer`,
`Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow`.

### GET `/admin/assessments/:id/invites`

Staff session required; teachers are scoped to assessments they created, admins to any (other
records return `404`). Returns `{ data: { invites: [...] } }`, ordered by group label (nulls
first) then `candidate_ref`. Each item has `candidateRef`, `candidateName`, `groupLabel`, `email`,
effective `status`, send counters, `failedClaimCount`, `claimedAt` and `claimedAssurance`. Tokens
are never listed.

### POST `/admin/assessments/:id/invites`

Same staff scoping. Imports a pasted roster:

```json
{
  "csv": "candidate_ref,email,candidate_name,group_label\n2210145,rakib@example.edu,Md. Rakib Hasan,CSE-3B",
  "mapping": { "candidate_ref": 0, "email": 1 },
  "groupLabel": "CSE-3B"
}
```

`csv` is RFC-4180 CSV text (UTF-8 BOM, quoted fields, embedded newlines and CRLF accepted).
`mapping` holds optional 0-based column indexes; header detection runs first and manual values
override it. `groupLabel` is a fallback for rows with a blank group. `candidate_ref` is required;
`email`, `candidate_name` and `group_label` are optional — a row without an email imports as
link-only and is never an error.

Limits: 64 KB of CSV and 500 data rows (`ROSTER_TOO_LARGE` 413; `VALIDATION_ERROR` 422 for the
row cap, an empty paste or a paste with no resolvable `candidate_ref` column), checked before any
database write. A duplicate email inside the same assessment fails that row with
`INVITE_EMAIL_TAKEN` (409, "leave the email blank and deliver by link").

Response: `{ data: { rows, counts, mapping, header } }`. Every input row reports `created`,
`updated`, `unchanged`, `duplicate` or `invalid` with `reason`/`fix`, and `counts` totals them;
one bad row never aborts the rest. Re-importing the same paste is an `unchanged` no-op. Audit:
`assessment.invites.import`.

### POST `/admin/assessments/:id/invites/:inviteId/rotate`

Same staff scoping. Issues a fresh token, invalidates the previous link and resets the invite to
`UNSENT`. Returns `{ data: { invite, token } }` with `Cache-Control: no-store` and
`Pragma: no-cache` — this response is the only place the API returns a raw token. A send also
rotates the token, but puts it only in the email body; roster import never returns tokens, and
the database stores only the SHA-256 hash. Refused with `INVITE_CLAIMED` or `INVITE_REVOKED`
(409), `INVITE_NOT_ROTATABLE` (409), or `404` when the invite belongs to another assessment.
Audit: `assessment.invite.rotate`.

### POST `/admin/assessments/:id/invites/:inviteId/send`

Same staff scoping; no request body. Sends one invite email to the address stored on the invite,
one candidate at a time — there is no send-all, sweep or scheduled retry. Requires a published
assessment that has not ended, an invite with an email, and a non-terminal invite state.

Each send acquires a per-invite lock (120 s, so a concurrent second request gets
`INVITE_SEND_LOCKED`) and consumes one slot of a three-per-hour window on that invite
(`INVITE_SEND_RATE_LIMITED`), then rotates the token — the previous link stops working — and puts
the new URL in the email body only. On success the invite is recorded as `SENT` (`sent_at`,
`last_sent_at`, `send_count`) and the lock is released:

```json
{ "data": { "invite": { "id": "…", "email": null, "status": "SENT" }, "sent": true } }
```

Responses use `Cache-Control: no-store` and `Pragma: no-cache`, never contain the token or the
URL, and return `email: null` so a stored response cannot leak the recipient.

| Code | Status | Meaning |
| --- | --- | --- |
| `INVITE_NO_EMAIL` | 409 | No address on file; copy the personal link instead |
| `INVITE_NOT_SENDABLE` | 409 | Invite is claimed, revoked or expired |
| `INVITE_SEND_LOCKED` | 409 | Another send for this invite is in progress (120 s) |
| `INVITE_SEND_RATE_LIMITED` | 429 | Three sends already used on this invite in the last hour |
| `INVITE_SEND_FAILED` | 502 | SMTP rejected the message or is not configured; copy the link instead |
| `ASSESSMENT_NOT_PUBLISHED` | 409 | Publish the assessment before sending invites |
| `ASSESSMENT_ENDED` | 410 | The assessment window has closed |
| `NOT_FOUND` | 404 | Unknown invite or another teacher's assessment |

A failed send releases the lock but keeps the consumed window slot, so a retry storm cannot hammer
SMTP. Audit: `assessment.invite.send`.

### POST `/admin/assessments/:id/invites/:inviteId/revoke`

Same staff scoping; no request body. Sets the invite to `REVOKED` and clears its send lock.
Idempotent: revoking an already-revoked invite returns the same row. Read-only resolve then
reports `status: "REVOKED"` and a claim fails with `INVITE_REVOKED` (410), so the personal link
stops working while a claimed attempt keeps its participant row — the participant status wins in
the results export instead of the invite's. Returns `{ data: { invite } }`. Audit:
`assessment.invite.revoke`.

### GET `/admin/assessments/:id/results.csv`

Staff session; the export itself is owner/admin only (another teacher's assessment is `404`).
Response headers: `text/csv; charset=utf-8`,
`Content-Disposition: attachment; filename="<slug>-results.csv"`, `Cache-Control: no-store` and
`X-Robots-Tag: noindex, nofollow`. One row per roster entry — invited candidates who never
started appear as `NOT_STARTED` — plus participants without a surviving invite (open-code joins).
Columns:

`candidate_ref, candidate_name, group_label, email, status, assurance, failed_claims,
started_at, finished_at, last_submission_at, solved, points, submissions`, then two columns per
assessment problem in position order: `<label>_solved` (1/0) and `<label>_attempts` (number).
Absent and participant-only rows carry zeros; problems detached from the assessment are excluded.

`status` is `NOT_STARTED`, `ACTIVE`, `FINISHED`, `EXPIRED` or `REVOKED`; `assurance` is blank
until the candidate claims. Rows sort by group label (nulls first), then roster rows before
participant-only rows, points descending, then `candidate_ref`. Cells are formula-escaped. Audit:
`assessment.export` with the row count.

## Learning checkpoints

### POST `/learning/checkpoints`

Start or resume the timed checkpoint for a learning module. The user is taken
from the session; `userId` is never accepted in the body.

```json
{ "moduleSlug": "basic-programming-math" }
```

- `200` — `{ "data": { "moduleSlug", "startedAt", "endsAt", "status" } }`.
  `status` is `ACTIVE` for a fresh or resumed attempt.
- `401` — anonymous.
- `403` — cross-origin request.
- `404` — unknown module.
- `409` — the module is not live, has no checkpoint, or the checkpoint is
  already completed.
- `422` — missing or invalid `moduleSlug`.

A second POST while an attempt is active returns the same window instead of
resetting the timer. Completion is derived from accepted, non-assessment
submissions whose `created_at` falls between `startedAt` and `endsAt`; the
module page evaluates it on read and awards the badge once all checkpoint
problems are accepted.

## Ranking

`GET /rank`

Query parameters:

| Name | Default | Notes |
| --- | --- | --- |
| `page` | `1` | 1-based page number. |
| `pageSize` | `20` | Between 1 and 50. |
| `q` | none | Case-insensitive substring over `username`, `displayName` and `institution`, trimmed and capped at 100 chars; `%` and `_` match literally. |
| `institution` | none | Exact match after trimming, capped at 120 chars. |
| `country` | none | Exact match after trimming, capped at 80 chars. |
| `minSolved` / `maxSolved` | none | Inclusive accepted-problem count, integer `0`–`100000`. |
| `sort` | `points` | `points` (points, then solved count, then username), `solved` (solved count, then points, then username) or `name` (username). |

Rows: `rank`, `username`, `displayName`, `institution`, `country`, `points`,
`solvedCount`, `submissionCount`, `acceptanceRate`, `lastAcceptedAt`.

`rank` is the global position over the whole ranked set, ordered by points, solved count and
username. Filters, sorting and paging never renumber it: a row narrowed down to one institution
can still be `rank: 47`. `meta.total` counts the rows after filters and before pagination.

Only accepted practice and contest solves count; assessment and virtual-contest submissions never
do. Blank values (`?page=`, `?sort=`) are treated as unset and fall back to the defaults. A parameter
that fails validation — including `minSolved` greater than `maxSolved`, an unknown `sort`, or a
solved bound outside `0`–`100000` — returns `422` with the standard error shape.

## Contest rating

`GET /ratings`

The same board data that powers the rating view of `/rank`, as a paged list.

Query parameters:

| Name | Default | Notes |
| --- | --- | --- |
| `page` | `1` | 1-based page number. |
| `pageSize` | `20` | Between 1 and 50. |
| `q` | none | Case-insensitive substring over `username`, `displayName` and `institution`, trimmed and capped at 100 chars; `%` and `_` match literally. |
| `institution` | none | Exact match after trimming, capped at 120 chars. |
| `country` | none | Exact match after trimming, capped at 80 chars. |
| `minRating` / `maxRating` | none | Inclusive current-rating bounds, integer `0`–`10000`. |
| `sort` | `rating` | `rating` (rating, then peak, then contests, then username), `peak` (peak, then rating, then contests, then username), `contests` (contests, then rating, then peak, then username) or `name` (username). |

Rows: `rank`, `username`, `displayName`, `institution`, `country`, `rating`, `maxRating`,
`contestCount`, `lastDelta`, `lastContestAt`, `lastContestSlug`, `lastContestTitle`.

Only rated coders appear: a non-banned user with at least one row in `contest_rating_changes`, i.e.
at least one finalized rated solo contest. A user who never competed keeps the default `1500` rating
but is not on this board. `rating` is the current rating, `maxRating` is the higher of the current
rating and the best `new_rating` in the history, and `contestCount` counts rating changes;
`lastDelta` and the last-contest fields come from the most recent change ordered by contest end
(`created_at`) and then contest id.

`rank` is the global position over the whole rated set, ordered by rating, peak rating, contest
count and username. Filters, sorting and paging never renumber it. `meta.total` counts rows after
filters and before pagination. Banned users are excluded from the board, its facets and its ranks.

`GROUP`-format contests produce no individual rating changes, so they never add rows here.
Finalization is lazy: ratings update on the first page view of an ended contest (or its standings),
so this endpoint does not write and may trail a just-ended contest until that view happens. Blank
values fall back to defaults; an unknown `sort`, a rating bound outside `0`–`10000`, or
`minRating` greater than `maxRating` returns `422` with the standard error shape.

## Admin and teacher content

Requires an admin session, or a teacher session for the content endpoints below.
Teachers can only read and update their own problems, contests and assessments;
other records return `404`.

- `POST /admin/problems`
- `PUT /admin/problems/:id`
  - Problem payloads accept `checkerType` (`EXACT`, `TOKEN`, `FLOAT`, `CUSTOM`),
    `checkerSource` (Python source for `CUSTOM`) and `floatTolerance`.
  - Problem payloads no longer accept an `isPublic` publish flag: `POST /admin/problems` creates the
    problem in review (`IN_REVIEW`) and nothing here can publish it directly. Publication status
    changes only through `POST /problem-reviews/:problemId` (see
    [Problem publication review](#problem-publication-review)) once the gates pass.
  - Content edits are accepted only while the problem is `DRAFT` or `CHANGES_REQUESTED`
    (the author fixing a hold). `PUT /admin/problems/:id` returns `409` for `IN_REVIEW` and
    `PUBLISHED`, so approvals and reviewer-added tests cannot be invalidated by a rewrite.
- `POST /admin/lists`
- `PUT /admin/lists/:id`
- `POST /admin/contests`
- `PUT /admin/contests/:id`
- `POST /admin/submissions/:id/rejudge`
- `PATCH /admin/users/:id` with `{ "role": "USER|TEACHER|ADMIN" }` or
  `{ "banned": true|false }` (admin only)
- `POST /admin/assessments`
- `PUT /admin/assessments/:id`
- Assessment roster invites, link rotation and the results CSV export are documented under
  [Coding assessments](#coding-assessments).

## Messages

Direct messages are two-person conversations. Opening a new conversation
requires an accepted follow edge in either direction; blocked users cannot open
or send, and non-participants receive `404` so conversation ids do not leak.
Existing conversations stay readable and replyable after an unfollow. When
either side blocks the other, the conversation disappears from both inboxes,
stops contributing to unread counts and direct links return `404` until the
block is lifted. Message bodies are plain
text, escaped on render: a text send is trimmed to 1–2000 characters, while the
stored body check is 0–2000 so an image-only message may carry an empty caption.

- `GET /messages/conversations?page=1` — 20 per page, newest activity first, with
  the other participant, presence, `muted`, unread count, last-message preview
  (`body`, `mine`, `createdAt`, `deleted`, `hasAttachment`, `attachmentKind`,
  `attachmentName`) and `unreadTotal`. A body-less image previews as "📷 Photo",
  a body-less document as "📎 <fileName>", and deleted messages as "Message
  deleted". Muted conversations stay listed but contribute zero unread and send
  no notices.
- `POST /messages/conversations` with `{ "username": "nusrat" }` — opens (or
  returns) the pair conversation; `201 { "id": "..." }`. `403` without an
  accepted follow or when blocked, `422` self, `404` unknown/banned user, `429`
  after 20 opens per hour.
- `GET /messages/conversations/:id?page=1` — 30 messages per page counted from
  the newest; items are oldest-first within the page. Returns the participant,
  presence, `blocked` and `items` (`id`, `body`, `mine`, `createdAt`, `readAt`,
  `deleted`, `attachment`). `participant.profile` carries the public profile
  fields used by the info panel (`bio`, institution, country, current status,
  company, job title, skills, rating, role, member-since, website/GitHub/
  LinkedIn); private contact, swag and account fields are never selected.
  `attachment` is always present and is either an image
  `{ "kind": "IMAGE", "id", "mime", "width", "height", "url" }` or a document
  `{ "kind": "DOCUMENT", "id", "mime", "fileName", "sizeBytes", "url" }`;
  `url` is the participant-only attachment route below. Deleted messages expose
  neither body nor attachment (blank body, `attachment: null`); malformed or
  foreign ids are `404`.
- `GET /messages/conversations/:id/info` — lazy conversation-info payload for
  the sender panel. Participant-only, `private, no-store`, `120` per minute;
  `404` for malformed ids, non-participants, blocked pairs and banned
  counterparts. Returns `{ "media": [...], "documents": [...], "links": [...] }`:
  the newest 24 non-deleted images (id, attachment URL, MIME, dimensions,
  createdAt), the newest 24 non-deleted uploaded documents (id, download URL,
  fileName, MIME, sizeBytes, createdAt, mine) and up to 40 deduped http(s) URLs
  from the newest 200 non-deleted message bodies. Links ending in a common
  document extension (`.pdf`, `.doc[x]`, `.xls[x]`, `.ppt[x]`, `.txt`, `.csv`,
  `.zip`, `.rar`, `.7z`) are tagged `DOCUMENT` and appear alongside uploaded
  files in the panel's Documents section; every other URL is `LINK`. Only
  http/https is accepted, fragments and display labels are normalised, and
  `mine`/`createdAt` come from the newest mention.
- `POST /messages/conversations/:id/messages` with `{ "body": "..." }` — sends a
  message (`201`). `403` blocked, `404` non-participant, `422` empty/overlong,
  `429` after 30 per minute. The first unread message of a burst creates one
  in-app `MESSAGE` notification; deleting it replaces the notification preview
  with "This message was deleted.".
- `POST /messages/conversations/:id/images` — multipart form with `file` and an
  optional `caption` (empty allowed, trimmed, max 2000 characters); returns
  `201` with the usual `MessageItem` (`body` is the caption, `attachment` is
  set). One image per message; PNG, JPEG or WebP detected from the magic bytes,
  never from the client MIME or filename; max 5 MiB and 4096×4096. The request's
  `Content-Length` is preflighted before multipart parsing: anything above 6 MiB
  (5 MiB file + 1 MiB multipart allowance) is rejected without buffering the
  body, and the 5 MiB file check still applies after parsing. Per-sender image
  quotas bound growth on top of the 10-per-minute limit: at most 50 images per
  rolling 24 hours (`429` with a retry message) and 250 MiB of stored images
  (`422` when exceeded). `422` for an empty file, an unsupported or oversized
  image, or an overlong caption; `403` blocked, `404` non-participant/banned.
  Same-origin, session-cookie auth like the other message writes.
- `POST /messages/conversations/:id/documents` — multipart form with `file` and
  an optional `caption` (empty allowed, trimmed, max 2000 characters); returns
  `201` with the usual `MessageItem` whose attachment is `kind: "DOCUMENT"`.
  One document per message; allow-listed PDF/TXT/CSV/ZIP/DOCX/XLSX/PPTX up to
  5 MiB. The MIME type comes from the extension, then the bytes are checked
  (PDF `%PDF-`, ZIP family `PK\x03\x04`, text strict UTF-8 with no NUL); file
  names reject path separators/`..`/NUL, strip controls and cap at 120
  characters. Uploads are 10 per minute and share the 50-attachment/24h and
  250 MiB per-sender caps with images. `422` for an empty, unsupported,
  mismatched or oversized file; `403` blocked; `404` non-participant/banned.
  The same 6 MiB pre-parse `Content-Length` guard applies. Documents can never
  execute in the app origin: they are served as opaque downloads.
- `GET /messages/attachments/:id` — streams the stored bytes so a browser `<img>`
  works with the session cookie. Images keep their image MIME and
  `Content-Disposition: inline`; documents use `application/octet-stream` and
  `Content-Disposition: attachment; filename*=UTF-8''<encoded>`. Participant-only:
  `404` for a malformed id, a foreign conversation, a deleted message, or a
  blocked/banned pair, so the bytes never leak. `200` with
  `Cache-Control: private, no-store` (so a delete, block or ban takes effect on
  the next reload instead of a year-long immutable cache) and
  `X-Content-Type-Options: nosniff`; 240 per minute.
- `GET /messages/suggestions?kind=contest|problem|learn&q=…` — authenticated,
  `q` trimmed and max 80 characters, at most 8 rows, 120 per minute; returns
  `{ "items": [...] }` with `kind`, `id`, `label`, `meta` and `href` (always an
  internal path). Contests are public and live/upcoming first, problems reuse
  the normal problem visibility and entitlement rules, learn reads the static
  LIVE curriculum modules and topics. Selecting a row inserts a plain-text
  reference token into the body: `@[Label](/contests/slug)`,
  `@[Label](/problems/slug)` or `@[Label](/learn/module[/topic])`. Rendering is
  allow-listed to those three internal prefixes, so a token can never become an
  off-site link; anything else stays literal text. Inbox previews and
  notification bodies show tokens as `@Label`, and an image-only message
  reads as "📷 Photo" in both the inbox and the notification body.
- `POST`/`DELETE /messages/conversations/:id/mute` — toggles the caller's mute
  (`{ "muted": true|false }`), participant-only, idempotent, 60 per minute.
- `POST /messages/conversations/:id/read` — marks the other participant's
  messages and the conversation's notifications read; returns `{ "marked": n }`
  and is limited to 120 per minute.
- `DELETE /messages/:id` — soft-deletes the caller's own message and
  hard-deletes its `message_attachments` row in the same operation, so an
  image message leaves no stored bytes behind; repeating the delete is
  idempotent (`404` for anyone else, 60 per minute).
- `GET /messages/unread` — `{ "count": n }`, `private, no-store`; returns the
  cached unread total. List, thread, info and unread GETs are rate limited
  (120/240/120/120 per minute) to bound polling cost.

### Social counts

`GET /social/counts` — authenticated, rate limited to 120 per minute, sent with
`Cache-Control: private, no-store`. Returns the three dashboard social badges in
one round trip:

```json
{ "data": { "messages": 3, "notifications": 12, "requests": 0 } }
```

`messages` is the unread message total, `notifications` the unread
notification total and `requests` the pending follow-request count. The
dashboard sidebar polls this endpoint every 45 seconds while the tab is visible
to refresh its Social badges; a server render already supplies the first
counts.

## Social reports

Any signed-in user can report another user's message, conversation, follow
request or profile. Reports are rate limited to 10 per hour and duplicates of
the same kind/target/message within 24 hours return `409`. A message report must
be a message the **other** participant sent; reporting your own message is
`422`. The stored excerpt is captured at report time and shown only to admins.

`POST /api/v1/social-reports`

```json
{
  "kind": "MESSAGE",
  "username": "nusrat",
  "messageId": "…",
  "conversationId": "…",
  "reason": "HARASSMENT",
  "details": "optional, up to 500 characters"
}
```

Reports are inserted under an advisory lock, so two concurrent identical
submissions produce one `201` and one `409`. While any report is open, admins
receive one grouped in-app + email digest per UTC hour instead of one email per
report.

`kind` is `MESSAGE`, `CONVERSATION`, `FOLLOW_REQUEST` or `PROFILE`; `reason` is
`SPAM`, `HARASSMENT`, `HATE`, `SCAM`, `IMPERSONATION` or `OTHER`. `MESSAGE`
requires `messageId` (and must belong to the pair), `CONVERSATION` requires
`conversationId`, `FOLLOW_REQUEST` requires a pending request **from the target
to the reporter**, and `PROFILE` needs only the username. Success is
`201 { "reported": true, "id": "…" }`; missing/foreign ids are `404`, wrong
direction/self is `422`. Filing a report writes an audit entry and one in-app
`SYSTEM` notice per admin (no report email); notification failures are
best-effort.

- `GET /api/v1/admin/social-reports?status=open|resolved|dismissed|all&page=1`
  is admin-only and returns 20 reports per page with reporter/target identities,
  excerpt, details and timestamps.
- `PATCH /api/v1/admin/social-reports/:id` with
  `{ "status": "RESOLVED"|"DISMISSED", "note": "optional" }` closes an open
  report atomically with its audit entry, notifies the reporter and returns
  `409` if it was already closed. Admins triage from `/admin/social-reports`.

## Notifications

All endpoints require a session except unsubscribe. JSON request bodies are
capped at 1 MiB (`413 PAYLOAD_TOO_LARGE`).

- `GET /notifications?page=1` returns the current user's notifications, newest
  first, with `type`, `title`, `body`, `href`, `readAt` and `createdAt`.
- `PATCH /notifications/read` marks every unread notification as read.
- `PATCH /users/me/notifications` replaces the full preference object:
  `{ "emailVerdicts": true, "emailContests": true, "emailClarifications": true, "emailReviews": true, "emailAccount": true, "emailLearning": true, "emailAchievements": true, "emailAnnouncements": true, "emailMarketing": true, "emailDiscussions": true, "emailMessages": true, "emailFollows": true, "notifyMessages": true, "notifyFollows": true, "notifyMarketing": true, "reviewEmailFrequency": "INSTANT" }`.
  `notifyMessages`/`notifyFollows` control in-app MESSAGE and FOLLOW_* notices;
  `notifyMarketing` controls in-app new-contest/new-module notices, while the
  `email*` switches (including `emailFollows`) control inbox copies.
  In-app and email marketing are independent: in-app off with email on sends
  the mail without a notification row. Unread badges and security/account
  notices are unaffected. `reviewEmailFrequency` is `INSTANT`, `HOURLY` or
  `DAILY`.
- `POST /notifications/unsubscribe` with `{ "token": "...", "scope": "all" }`
  disables email categories from a one-click email link. Scopes: `all`,
  `account`, `verdicts`, `contests`, `clarifications`, `reviews`, `learning`,
  `achievements`, `announcements`, `marketing`, `discussions`, `messages`,
  `follows`.
- `POST /admin/announcements` (ADMIN) queues a manual announcement. Body:
  `{ "title": "...", "body": "...", "href": "/problems" }` where title is
  4–120 characters, body 10–2000 and `href` is an optional in-app path. Returns
  `{ "created": true, "queued": true }`; the 30-second worker sweep fans it out
  to every non-banned user, and verified users get an email subject to
  `emailAnnouncements`. Recent broadcasts (manual and automatic marketing) are
  listed at `/admin/announcements` with in-app delivery counts and baseline
  markers.

In-app notifications are created for finished verdicts, contest
registration/start/30-minute reminder/final result, clarification activity,
follow requests/acceptance, first unread direct messages, problem and lesson
discussion replies, learning enrollment/payment/reminders, exact milestones and
badges, announcements, new-contest/new-module marketing, problem contribution
proposals/reviews, contest problem approval requests/decisions and problem
publication review events (submit, hold, respond, resolve, reopen and publish).
Email copies follow the user's preferences, require a verified email address
(except the welcome mail sent to the just-registered address) and are queued in
`email_outbox` with worker retries. Contest results reach every registered,
non-banned participant; participants without a rating change get a generic
final-standings notice. Review emails
cover contribution and contest-approval events, have their own `emailReviews`
toggle, and follow the `reviewEmailFrequency` setting: `INSTANT` sends each
event immediately, while `HOURLY` and `DAILY` group them into one digest per
user. Admins with review emails enabled also receive one weekly backlog report
(pending proposals, overdue items, oldest age and pending contest requests) as
an in-app SYSTEM notification and an email; the ISO week key prevents
duplicates.

## Web Push

- `GET /push/public-key` returns `{ "publicKey": "…" }` or `{ "publicKey": null }`
  when VAPID is not configured. The private key is never returned.
- `POST /push/subscribe` (session, same-origin, 20/min per user) stores a
  browser subscription: `{ "endpoint": "https://…", "keys": { "p256dh": "…", "auth": "…" } }`.
  Endpoints must be HTTPS (max 2048); keys are base64/base64url (20–200 and
  8–100 characters). Returns `201 { "ok": true }`.
- `DELETE /push/subscribe` (session, same-origin, 20/min) removes the current
  user's subscription by `{ "endpoint": "…" }` and is idempotent (200).
  Push is per device; there is no account-wide push preference because the
  browser permission and Settings toggle control it. Push only covers
  high-signal events (messages, follow requests/acceptance, contest
  registration/reminder/result, achievements, milestones, announcements,
  learning reminders/payments and discussion replies). Message/reply bodies are
  privacy-redacted in the push payload.

## Health

`GET /health` returns `200` when PostgreSQL and Redis are reachable, otherwise
`503`, along with component booleans and the app version.
