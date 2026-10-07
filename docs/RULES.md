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
7. Notes are Pro-only and stored in MySQL (`notes`). Legacy `localStorage.notion_pages` may be imported once, then removed.
8. Calendar is a **view** of tasks with `due_date`; it has no own API.
9. Plan of record lives on `users.plan`. Feature flags are **derived** from `server/src/config/plans.js`, not stored per user.
10. Stripe Checkout + webhooks set `plan` and Stripe IDs. Prefer webhooks over client trust. Keep `ALLOW_MANUAL_UPGRADE=false` in production.

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
- Create-task and create-project check + insert run in one transaction with `SELECT ... FOR UPDATE` on the user row.
- Paid upgrade: `POST /api/subscription/checkout` → Stripe → webhook → `setPlan`. Portal: `POST /api/subscription/portal`.
- Snapshot may include `checkoutEnabled` and `proPriceLabel`; client `applyPlan` must merge them onto `user`.

## 3. Auth and session rules

1. Access token: JWT signed with `JWT_SECRET`, payload `{ id, email }`, expiry `JWT_EXPIRES_IN` or `15m`.
2. Refresh token: 40-byte hex, stored **only as SHA-256 hash**, httpOnly cookie `refreshToken`, 7 days, `sameSite=strict`, `secure` when `NODE_ENV === production`.
3. **Rotation:** each `/api/auth/refresh` issues a new refresh token and invalidates the previous hash.
4. **Single session:** login deletes all refresh rows for that user before insert.
5. Protected HTTP routes require `Authorization: Bearer <access>`, except `/api/auth/*` (public register/login/refresh/logout/password) and `POST /api/subscription/webhook` (Stripe signature).
6. Socket.io handshake must send `{ auth: { token } }`; invalid JWT → connection refused.
7. Client idle timeout: **30 minutes** without activity → logout (clear token + user, hit logout endpoint).
8. Client `fetchWithAuth` on 401: try refresh once (queued); failure → clear storage and redirect `/login`.
9. Password: bcrypt cost **10**; register/reset min **8** characters (Joi). Controller may still mention 6 in older Swagger comments — **Joi wins**.
10. Forgot-password must not reveal whether an email exists (same success path).
11. `GET` / `PATCH /api/auth/me` require Bearer. Update name and/or `notifyOverdue` / `notifyDueToday` / `notifyDueTomorrow`. Email is not changeable yet.

## 4. Ownership and tenancy

For every mutating query:

```
WHERE id = ? AND user_id = ?
```

- Tasks, projects, feedback, notifications, notes, attachments (via parent task) belong to the JWT user.
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
| Note title | max 255 (empty → `Untitled`) |
| Note emoji | max 32 |
| Note content | max 200000 chars |
| Auth me prefs | booleans `notifyOverdue`, `notifyDueToday`, `notifyDueTomorrow` |
| Pagination | page ≥ 1; limit 1–100; default 20 |

## 6. File upload rules

- MIME allowlist: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `application/pdf`.
- Max size **5MB** → 413 `LIMIT_FILE_SIZE`.
- Wrong type → 415 with the filter message.
- Disk path: `server/uploads/`; filename `{timestamp}-{random}{ext}`.
- Files are served only via authenticated `GET /api/upload/file/:id` after verifying the parent task belongs to `req.user.id`.

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
2. After insert, `notificationService.createNotification` emits `new_notification` to `user:{userId}`. Duplicate `dedupe_key` (MySQL 1062) → no emit.
3. Client: single `SocketProvider`; `transports: ["websocket"]`; 5 reconnect attempts.
4. Do not emit other users’ notifications. Rooms are private.
5. Due-date job (`dueDateNotificationJob`) runs on boot and every 15 minutes; respects `users.notify_*` prefs.

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
8. After plan change, merge subscription snapshot into `user` (as `applyPlan` does), including `checkoutEnabled` and `proPriceLabel`.

## 12. Backend engineering rules

1. Express 5 + CommonJS. No TypeScript in this repo unless the team decides otherwise.
2. Routes stay thin; SQL in controllers/services. New domains get a service module.
3. `authMiddleware` on every non-auth router via `router.use(auth)` (except the Stripe webhook route mounted in `index.js`).
4. Feature gates: `requireFeature("ai" | "attachments" | "notes" | …)` — do not hardcode `plan === "pro"` in random routes.
5. `errorHandler` is last middleware. Pass errors with `next(err)`.
6. Parameterized SQL only. No string-concatenated identifiers from user input (AI update uses an allowlist of column names).
7. Node ≥ 20. `npm start` = migrate then `src/index.js`.
8. Secrets only in env (`.env` never committed). Document keys in `.env.example`.
9. Stripe webhook must use `express.raw` **before** `express.json()` so signature verification works.
10. JSON body limit is `512kb` to allow TipTap HTML on notes.

## 13. Data rules

1. Canonical schema: `server/src/config/migration.sql`.
2. Additive columns / tables for existing DBs: `server/scripts/migrate.js` (ignore MySQL errno **1060** duplicate column, **1061** duplicate key).
3. Cascade deletes from `users` must not leave orphan tasks/tokens/notes.
4. `tasks.project` is a **string**, not a foreign key to `projects`. Renaming a project does not rewrite task rows unless product code does it explicitly.
5. Do not commit `.DS_Store`, `.vscode/`, or `.env`.

## 14. Copy rules

- Success: “Task created successfully”, “Signed in successfully”.
- Auth failure: “Incorrect email or password” (same for bad email or password).
- Plan: “Free plan allows up to N … Upgrade to Pro …”
- Feature: “This feature is available on the Pro plan.”
