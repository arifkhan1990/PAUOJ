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
{ "displayName": "Tanvir A.", "bio": "C++ and graphs.", "country": "Bangladesh", "institution": "PrimeAsia University" }
```

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

Returns public problems visible to the caller. Problems in a running contest are
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

### Study plans

Public pages: `GET /lists` and `GET /lists/:slug` (HTML). Progress is derived
from accepted submissions, so no extra progress table is needed. The problem
list accepts `category`, `subcategory` and `company` filters in addition to
search, difficulty and tag.

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

### GET `/submissions/:id`

Returns verdict, test results, compile output and source when permitted.

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

Standings rows include `rank`, `user`, `solved`, `penalty` and a map of problem
labels to `{ solved, attempts, solveTimeMinutes }`. When a freeze window is
active, public responses set `frozen: true` and include `freezeAt`; admins get
the live board.

### POST `/contests/:slug/virtual`

Starts (or restarts) a personal virtual replay of an ended public contest.
Returns `{ id }`. Virtual submissions carry `virtualContestId`, are excluded
from official standings/ratings, and run against the virtual start time.

### POST `/contests/:slug/virtual/finish`

Ends the current user's virtual replay early.

### Contest integrity

Admins can open `/admin/contests/:id/plagiarism` for token-shingle Jaccard
similarity signals between different users' contest submissions.

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

When a contest ends, the first page view of the contest or its standings
finalises the ratings exactly once. The update uses Elo with `K=32`, zero-sum
normalisation and a rating floor of 100. Only participants with at least one
contest submission are rated. History is stored in `contest_rating_changes` and
exposed on profile pages.

## Coding assessments

### POST `/assessments/:slug/join`

```json
{ "code": "PAU-TEST-2026" }
```

Starts (or resumes) the authenticated candidate's session and returns
`{ startedAt, expiresAt }`. Requires a published, running assessment and a valid
code. Rate limited per user and assessment.

### POST `/assessments/:slug/finish`

Ends the candidate session early. No further submissions are accepted.

Assessment problem links return `ASSESSMENT_LOCKED` when the caller has not
joined or the session has expired. Private assessment problems return `404` to
users without access.

## Ranking

`GET /rank?page=1&pageSize=20`

Rows: `rank`, `username`, `displayName`, `points`, `solvedCount`,
`submissionCount`, `acceptanceRate`, `lastAcceptedAt`.

## Admin and teacher content

Requires an admin session, or a teacher session for the content endpoints below.
Teachers can only read and update their own problems, contests and assessments;
other records return `404`.

- `POST /admin/problems`
- `PUT /admin/problems/:id`
  - Problem payloads accept `checkerType` (`EXACT`, `TOKEN`, `FLOAT`, `CUSTOM`),
    `checkerSource` (Python source for `CUSTOM`) and `floatTolerance`.
- `POST /admin/lists`
- `PUT /admin/lists/:id`
- `POST /admin/contests`
- `PUT /admin/contests/:id`
- `POST /admin/submissions/:id/rejudge`
- `PATCH /admin/users/:id` with `{ "role": "USER|TEACHER|ADMIN" }` or
  `{ "banned": true|false }` (admin only)
- `POST /admin/assessments`
- `PUT /admin/assessments/:id`

## Notifications

All endpoints require a session except unsubscribe.

- `GET /notifications?page=1` returns the current user's notifications, newest
  first, with `type`, `title`, `body`, `href`, `readAt` and `createdAt`.
- `PATCH /notifications/read` marks every unread notification as read.
- `PATCH /users/me/notifications` updates email preferences:
  `{ "emailVerdicts": true, "emailContests": true, "emailClarifications": false, "emailReviews": true, "reviewEmailFrequency": "INSTANT" }`.
  `reviewEmailFrequency` is `INSTANT`, `HOURLY` or `DAILY`.
- `POST /notifications/unsubscribe` with `{ "token": "...", "scope": "all" }`
  disables email categories from a one-click email link. Scopes: `all`,
  `verdicts`, `contests`, `clarifications`, `reviews`.

In-app notifications are created for finished verdicts, contest starts,
clarification activity, problem contribution proposals/reviews and contest
problem approval requests/decisions. Email copies follow the user's preferences
and require a verified email address. Review emails cover contribution and
contest-approval events, have their own `emailReviews` toggle, and follow the
`reviewEmailFrequency` setting: `INSTANT` sends each event immediately, while
`HOURLY` and `DAILY` group them into one digest per user. Admins with review
emails enabled also receive one weekly backlog report (pending proposals,
overdue items, oldest age and pending contest requests) as an in-app SYSTEM
notification and an email; the ISO week key prevents duplicates.

## Health

`GET /health` returns `200` when PostgreSQL and Redis are reachable, otherwise
`503`, along with component booleans and the app version.
