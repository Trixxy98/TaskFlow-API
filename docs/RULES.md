# TaskFlow — Rules

Product, security, API, and engineering rules. If a change conflicts with this file, update the file in the same PR.

Related: [PRD.md](./PRD.md) · [DESIGN.md](./DESIGN.md) · [SCHEMA.md](./SCHEMA.md) · [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 1. Product rules

1. TaskFlow is **single-user**. A user only reads and writes their own rows (`user_id` = JWT `id`).
2. Do not re-expose team/workspace APIs. `workspaces` and `workspace_members` tables are leftover schema, not product features.
3. All UI and API messages are **English**.
4. Free users may use: Dashboard/Tasks list, Projects (capped), Kanban, Table, Completed, Feedback, Notifications, Help, Settings, Profile.
5. Pro-only: AI chat, file **upload**, analytics, calendar page, notes page.
6. Listing existing attachments for a task is not a substitute for upload: `POST /api/upload/:taskId` is the gated write.
7. Notes are client-only (`localStorage`). Do not document them as synced across devices.
8. Calendar is a **view** of tasks with `due_date`; it has no own API.
9. Plan of record lives on `users.plan`. Feature flags are **derived** from `server/src/config/plans.js`, not stored per user.
10. Stripe fields on `users` are placeholders. Do not charge cards until Checkout is implemented.

## 2. Plan and limit rules

Source of truth: `server/src/config/plans.js`.

| Plan | maxTasks | maxProjects | ai | attachments | analytics | calendar | notes |
|------|----------|-------------|----|-------------|-----------|----------|-------|
| free | 20 | 3 | false | false | false | false | false |
| pro | `null` (unlimited) | `null` | true | true | true | true | true |

- Enforce task cap on `POST /api/tasks` via `assertCanCreateTask`.
- Enforce project cap on `POST /api/projects` via `assertCanCreateProject`.
- Exceeding a cap → HTTP **403**, `code: "PLAN_LIMIT"`, `feature: "tasks" | "projects"`.
- Missing Pro feature on API → HTTP **403**, `code: "UPGRADE_REQUIRED"`, plus `feature` key.
- `null` limit means no numeric cap.
- Manual Pro activate: `POST /api/subscription/activate`.
  - Allowed if `ALLOW_MANUAL_UPGRADE=true`.
  - Denied if `ALLOW_MANUAL_UPGRADE=false`.
  - If unset: allowed when `NODE_ENV !== "production"`.
  - Denied response: `403`, `code: "STRIPE_PENDING"`.
- Frontend may treat `user.plan === "pro"` **or** `user.features[feature]` as unlocked (`hasProFeature`).

**Known gap:** AI tool `create_task` inserts SQL directly and does not call `assertCanCreateTask`. Do not rely on AI as a limit enforcer until that is fixed.

## 3. Auth and session rules

1. Access token: JWT signed with `JWT_SECRET`, payload `{ id, email }`, expiry `JWT_EXPIRES_IN` or `15m`.
2. Refresh token: 40-byte hex, stored **only as SHA-256 hash**, httpOnly cookie `refreshToken`, 7 days, `sameSite=strict`, `secure` when `NODE_ENV === production`.
3. **Rotation:** each `/api/auth/refresh` issues a new refresh token and invalidates the previous hash.
4. **Single session:** login deletes all refresh rows for that user before insert.
5. Protected HTTP routes (everything under `/api` except `/api/auth/*`) require `Authorization: Bearer <access>`.
6. Socket.io handshake must send `{ auth: { token } }`; invalid JWT → connection refused.
7. Client idle timeout: **30 minutes** without activity → logout (clear token + user, hit logout endpoint).
8. Client `fetchWithAuth` on 401: try refresh once (queued); failure → clear storage and redirect `/login`.
9. Password: bcrypt cost **10**; register/reset min **8** characters (Joi). Controller may still mention 6 in older Swagger comments — **Joi wins**.
10. Forgot-password must not reveal whether an email exists (same success path).

## 4. Ownership and tenancy

For every mutating query:

```
WHERE id = ? AND user_id = ?
```

- Tasks, projects, feedback, notifications, attachments (via parent task) belong to the JWT user.
- Never accept `user_id` from the request body for ownership.
- Uploads: verify the `taskId` belongs to `req.user.id` before insert/delete.

## 5. Validation rules

Joi on POST/PUT/PATCH. Reject unknown misuse via schema; return 400 with English `message`.

| Resource | Constraints |
|----------|-------------|
| Register name | 2–100 chars, trimmed |
| Email | Valid, lowercased, trimmed, unique |
| Password | 8–128 on register/reset |
| Task title | 1–255, required on create |
| Task status | `pending` \| `completed` |
| Priority | `low` \| `medium` \| `high` (default medium) |
| Kanban | `todo` \| `inprogress` \| `done` (default todo) |
| Due date | ISO date, nullable |
| Project name | 1–100 |
| Project color | `#RGB` or `#RRGGBB`, default `#6366f1` |
| Feedback message | 1–2000 |
| Pagination | page ≥ 1; limit 1–100; default 20 |

## 6. File upload rules

- MIME allowlist: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `application/pdf`.
- Max size **5MB** → 413 `LIMIT_FILE_SIZE`.
- Wrong type → 415 with the filter message.
- Disk path: `server/uploads/`; filename `{timestamp}-{random}{ext}`.
- Static files served at `/uploads` with CORS header for the first allowed origin.

## 7. Rate limits

| Surface | Window | Max |
|---------|--------|-----|
| `/api/auth/register`, login, forgot-password | 15 min | 10 / IP |
| All `/api/*` | 1 min | 100 / IP |
| `POST /api/ai/chat` | 1 min | 15 |

Do not disable these in production to “fix” tests; use a test env or higher limits explicitly.

## 8. API contract rules

Envelope:

```json
{ "success": true, "data": {}, "message": "optional" }
```

Errors:

```json
{ "success": false, "message": "Human-readable English." }
```

Plan errors add `code` and `feature`.

| HTTP | When |
|------|------|
| 400 | Validation / missing fields |
| 401 | No/invalid/expired token, bad credentials, missing refresh |
| 403 | Plan limit, upgrade required, manual upgrade disabled |
| 404 | Resource not found **or not owned** (do not leak existence across users) |
| 409 | Duplicate (MySQL `ER_DUP_ENTRY`) |
| 413 | File too large |
| 415 | File type |
| 429 | Rate limit |
| 500 | Unexpected; production message is generic |

Interactive API docs: `/api/docs` (Swagger). Keep JSDoc on routes in sync when adding endpoints.

CORS: only origins in `ALLOWED_ORIGIN` (comma-separated). Credentials enabled.

## 9. Realtime rules

1. One Socket.io server on the same HTTP server as Express.
2. After insert, `notificationService.createNotification` emits `new_notification` to `user:{userId}`.
3. Client: single `SocketProvider`; `transports: ["websocket"]`; 5 reconnect attempts.
4. Do not emit other users’ notifications. Rooms are private.

## 10. AI rules

1. Model: `gemini-3.5-flash` with function calling.
2. Allowed tools only: list/create/update/delete tasks, list projects.
3. Refuse coding, trivia, news, recipes, and anything outside TaskFlow.
4. Replies always English, even if the user writes Malay or another language.
5. Execute tools immediately (no extra confirmation round-trip in the model prompt).
6. Endpoint is Pro-gated **and** rate-limited.

## 11. Frontend engineering rules

1. React function components; pages under `client-server/src/pages`, shared UI under `components`.
2. All authenticated API calls go through `fetchWithAuth` in `services/api.js`.
3. Do not store the refresh token in `localStorage`. Access token + user JSON only.
4. Route protection: `ProtectedRoute` + `useAuthGuard` (token shape + JWT `exp`).
5. Theme via `useTheme` only.
6. Match existing Tailwind patterns (see DESIGN.md). No new CSS framework.
7. Gate Pro routes with `ProFeature`; do not duplicate a second lock UI unless the control is inline (chat, attachments, analytics tab).
8. After plan change, merge subscription snapshot into `user` (as `applyPlan` does).

## 12. Backend engineering rules

1. Express 5 + CommonJS. No TypeScript in this repo unless the team decides otherwise.
2. Routes stay thin; SQL in controllers/services. New domains get a service module.
3. `authMiddleware` on every non-auth router via `router.use(auth)`.
4. Feature gates: `requireFeature("ai" | "attachments" | …)` — do not hardcode `plan === "pro"` in random routes.
5. `errorHandler` is last middleware. Pass errors with `next(err)`.
6. Parameterized SQL only. No string-concatenated identifiers from user input (AI update uses an allowlist of column names).
7. Node ≥ 20. `npm start` = migrate then `src/index.js`.
8. Secrets only in env (`.env` never committed). Document keys in `.env.example`.

## 13. Data rules

1. Canonical schema: `server/src/config/migration.sql`.
2. Additive columns for existing DBs: `server/scripts/migrate.js` (ignore MySQL errno **1060** duplicate column).
3. Cascade deletes from `users` must not leave orphan tasks/tokens.
4. `tasks.project` is a **string**, not a foreign key to `projects`. Renaming a project does not rewrite task rows unless product code does it explicitly.
5. Do not commit `.DS_Store`, `.vscode/`, or `.env`.

## 14. Copy rules

- Success: “Task created successfully”, “Signed in successfully”.
- Auth failure: “Incorrect email or password” (same for bad email or password).
- Plan: “Free plan allows up to N … Upgrade to Pro …”
- Feature: “This feature is available on the Pro plan.”
