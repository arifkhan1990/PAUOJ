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
clarification activity, problem contribution proposals/reviews, contest
problem approval requests/decisions and problem publication review events
(submit, hold, respond, resolve, reopen and publish). Email copies follow the user's preferences
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
