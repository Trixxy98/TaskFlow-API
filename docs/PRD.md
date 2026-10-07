# TaskFlow — Product Requirements Document

**Product:** TaskFlow  
**Type:** Full-stack personal task management app  
**Status:** Live (Railway) with Free/Pro gates, Stripe Checkout (test/live), and server-synced notes  
**Primary language:** English (UI, API, AI replies)

Related docs: [DESIGN.md](./DESIGN.md) · [RULES.md](./RULES.md) · [SCHEMA.md](./SCHEMA.md) · [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 1. Problem

People juggle tasks across lists, boards, calendars, and notes. Spreadsheets and generic to-do apps either lack structure (priority, due date, project, attachments) or bury simple actions behind team/workspace complexity.

TaskFlow is a **single-user** workspace: sign in, manage your own tasks, and optionally upgrade to unlock AI, files, analytics, calendar, and notes.

## 2. Goals

1. Let a signed-in user create, edit, complete, and delete tasks quickly.
2. Offer multiple views of the same task set (list, Kanban, table, calendar).
3. Keep the product personal: no teams, invites, or shared workspaces in the product surface.
4. Monetize advanced features with Free vs Pro, billed via **Stripe Checkout**.
5. Keep the API secure enough for production (JWT rotation, rate limits, validation, Helmet).

## 3. Non-goals (current release)

- Team collaboration, invites, roles, or shared workspaces (removed from product; leftover DB tables must not be exposed).
- Mobile native apps.
- Multi-language UI (copy is English only).
- Public task sharing or unauthenticated task APIs.
- Recurring tasks (not implemented yet).

## 4. Users

| Persona | Need |
|---------|------|
| Free user | Track a small personal backlog (tasks + projects) without paying. |
| Pro user | Unlimited volume plus AI, attachments, analytics, calendar, notes. |
| Developer / operator | REST API, Swagger, env-based deploy on Railway. |

There is one role: **account owner**. Every resource is scoped to `user_id` of the authenticated user.

## 5. Plans

| | Free | Pro |
|---|------|-----|
| Price | RM 0 | Stripe subscription (label from `STRIPE_PRO_PRICE_LABEL`) |
| Tasks | Max **20** | Unlimited |
| Projects | Max **3** | Unlimited |
| List / Kanban / Table / Completed | Yes | Yes |
| AI chatbot | Locked | Included |
| File attachments | Locked | Included |
| Analytics tab | Locked | Included |
| Calendar | Locked | Included |
| Notes | Locked | Included (MySQL) |
| Upgrade path | `/pricing` | Stripe Checkout; demo activate only if `ALLOW_MANUAL_UPGRADE` |

Demo unlock: `POST /api/subscription/activate` is allowed when `ALLOW_MANUAL_UPGRADE=true`, or when the env var is unset **and** `NODE_ENV !== production`. Production should keep it `false`.

## 6. Functional requirements

### 6.1 Authentication

| ID | Requirement | Acceptance |
|----|-------------|------------|
| AUTH-1 | Register with name, email, password | 201; email unique; password hashed (bcrypt, cost 10) |
| AUTH-2 | Login returns access JWT and sets httpOnly refresh cookie | Cookie `refreshToken`, `sameSite=strict`, `secure` in production |
| AUTH-3 | Refresh rotates the refresh token | Old hash deleted; new cookie issued |
| AUTH-4 | Logout invalidates refresh token and clears cookie | Subsequent refresh returns 401 |
| AUTH-5 | Forgot / reset password | Token stored as SHA-256 hash; expired tokens rejected |
| AUTH-6 | One active refresh session per user | New login deletes previous refresh rows |
| AUTH-7 | Frontend idle logout | 30 minutes without mouse/keyboard/scroll/touch |
| AUTH-8 | `GET` / `PATCH /api/auth/me` | Name + notification prefs; email locked |

### 6.2 Tasks

| ID | Requirement | Acceptance |
|----|-------------|------------|
| TSK-1 | Create task with title (required), optional description, due date, priority, project, kanban status | 201; Free users blocked at 20 with `PLAN_LIMIT` |
| TSK-2 | List own tasks, paginated | Default page 1, limit 20, max 100; optional `status` filter |
| TSK-3 | Update any owned task | Title, description, status, priority, due date, project, kanban_status |
| TSK-4 | Delete owned task | 200; 404 if not owned / missing |
| TSK-5 | Dual status model | `status`: pending/completed; `kanban_status`: todo/inprogress/done |
| TSK-6 | Inline edit on Dashboard | Click title to edit; toggle complete; delete |

### 6.3 Projects

| ID | Requirement | Acceptance |
|----|-------------|------------|
| PRJ-1 | Create named project with hex color | Default `#6366f1`; Free cap 3 |
| PRJ-2 | List own projects | Ordered by creation |
| PRJ-3 | Delete own project | Cascades only the project row; task `project` is a string, not an FK |

### 6.4 Views

| ID | Requirement | Plan |
|----|-------------|------|
| VIEW-1 | Dashboard list + add form | Free |
| VIEW-2 | Kanban drag-and-drop (`dnd-kit`) | Free |
| VIEW-3 | Table view (TanStack Table) | Free |
| VIEW-4 | Completed / completion list | Free |
| VIEW-5 | Calendar by due date | **Pro** |
| VIEW-6 | Analytics charts (Recharts) on Dashboard | **Pro** |

### 6.5 Notes

| ID | Requirement | Acceptance |
|----|-------------|------------|
| NTE-1 | Notion-style pages with TipTap + slash commands | Pro only (route + API gated) |
| NTE-2 | Persist pages in MySQL `notes` | CRUD via `/api/notes`; max 100 notes/user; content ≤ 200k chars |
| NTE-3 | Migrate legacy cache | If DB empty, import `localStorage.notion_pages` once then remove key |

### 6.6 Attachments

| ID | Requirement | Acceptance |
|----|-------------|------------|
| ATT-1 | Upload image (JPEG/PNG/GIF/WEBP) or PDF | Max 5MB; Pro only |
| ATT-2 | Files stored on disk under `server/uploads/` | Unique timestamp filename |
| ATT-3 | List / delete / download for a task the user owns | Auth required; no public static `/uploads` |

### 6.7 Feedback

| ID | Requirement | Acceptance |
|----|-------------|------------|
| FB-1 | Add a comment on a task | Message 1–2000 chars; owned task |
| FB-2 | List / delete own feedback | Scoped to `user_id` |

### 6.8 Notifications

| ID | Requirement | Acceptance |
|----|-------------|------------|
| NTF-1 | Persist notifications per user | Paginated GET |
| NTF-2 | Mark one / all as read; delete one | Ownership enforced |
| NTF-3 | Real-time push | Socket.io event `new_notification` to room `user:{id}` |
| NTF-4 | Due-date job | Pending tasks: overdue / due today / due tomorrow → one row each, unique `(user_id, dedupe_key)` |
| NTF-5 | Honor prefs | `notify_overdue`, `notify_due_today`, `notify_due_tomorrow` on `users` |

### 6.9 AI chatbot

| ID | Requirement | Acceptance |
|----|-------------|------------|
| AI-1 | Natural-language task ops via Gemini function calling | Pro only; 15 req / min |
| AI-2 | Tools | get_tasks, create_task, update_task, delete_task, get_projects |
| AI-3 | Scope | Task/project/productivity only; refuse off-topic |
| AI-4 | Language | Always reply in English |
| AI-5 | Plan limits | `create_task` uses `assertCanCreateTask` (same Free cap as REST) |

### 6.10 Subscription / billing

| ID | Requirement | Acceptance |
|----|-------------|------------|
| SUB-1 | `GET /api/subscription` | Plan, limits, usage, features, `checkoutEnabled`, `proPriceLabel` |
| SUB-2 | Pricing page `/pricing` | Free vs Pro; Upgrade → Stripe Checkout when configured |
| SUB-3 | Locked surfaces show UpgradeGate | Chat, analytics, calendar, notes, attachments |
| SUB-4 | Sidebar lock icons | Notes and Calendar when not Pro |
| SUB-5 | `POST /api/subscription/checkout` | Creates Stripe Checkout session (`mode: subscription`) |
| SUB-6 | Webhooks | `checkout.session.completed` → Pro; subscription updated/deleted sync plan |
| SUB-7 | Customer Portal | `POST /api/subscription/portal` for manage / cancel |
| SUB-8 | Demo activate | Env-gated only; not the production upgrade path |

### 6.11 Settings

| ID | Requirement | Acceptance |
|----|-------------|------------|
| SET-1 | Save profile name | `PATCH /api/auth/me`; real persist |
| SET-2 | Notification toggles | Persist immediately; job respects prefs |
| SET-3 | Email | Displayed; cannot change yet |

## 7. User journeys

### 7.1 First session (Free)

1. Register → Login → land on `/dashboard`.
2. Create tasks (up to 20) and projects (up to 3).
3. Use Kanban / Table / Completed freely.
4. Opening Calendar, Notes, Analytics, AI, or upload shows an upgrade prompt → `/pricing`.

### 7.2 Upgrade (Stripe)

1. Open Plans (requires `STRIPE_SECRET_KEY` + `STRIPE_PRICE_ID`).
2. Click **Upgrade to Pro** → redirect to Stripe Checkout.
3. Pay (test card `4242…` in test mode).
4. Webhook sets `users.plan = pro` and Stripe IDs; return URL refreshes snapshot.
5. Locked routes and widgets unlock without re-login.

### 7.3 Upgrade (dev / demo)

1. Open Plans when Checkout is not configured and `ALLOW_MANUAL_UPGRADE` allows it.
2. Click **Activate Pro (demo)**.
3. Client merges subscription snapshot into `user` in `localStorage`.

### 7.4 Daily use (Pro)

1. Add/edit tasks from Dashboard or AI.
2. Attach files to a task.
3. Review due dates on Calendar; write notes (synced); check analytics.
4. Manage or cancel billing from Plans → **Manage billing**.

## 8. Success metrics (product)

- Time-to-first-task after register < 2 minutes.
- Free users never create a 21st task (API 403 `PLAN_LIMIT`), including via AI.
- Pro-gated routes never render content for Free (UpgradeGate).
- Access token expiry is recovered via refresh without forcing login, unless refresh cookie is missing/idle timeout.
- Paid upgrade only changes plan via verified Stripe webhooks (or env-gated demo activate).

## 9. Constraints

- Backend: Node.js ≥ 20, Express 5, MySQL (`mysql2`), CommonJS.
- Frontend: React 19, Vite 8, Tailwind CSS 4, React Router.
- Deploy: Railway (`npm start` runs migrate then server).
- All user-facing API/UI strings: English.

## 10. Open items / next

1. Drop or hide unused `workspaces` / `workspace_members` tables when safe.
2. Recurring tasks (optional product feature).
3. Production email delivery for forgot-password (today: dev token in non-production).
4. Stripe **live** mode webhook endpoint on the deployed API (not only CLI `stripe listen`).
