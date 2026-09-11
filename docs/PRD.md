# TaskFlow — Product Requirements Document

**Product:** TaskFlow  
**Type:** Full-stack personal task management app  
**Status:** Live (Railway) with Free/Pro feature gates; Stripe checkout not yet wired  
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
4. Monetize advanced features with a Free vs Pro gate **before** Stripe billing.
5. Keep the API secure enough for production (JWT rotation, rate limits, validation, Helmet).

## 3. Non-goals (current release)

- Team collaboration, invites, roles, or shared workspaces (removed from product; leftover DB tables must not be exposed).
- Stripe Checkout / recurring billing (columns exist as placeholders).
- Server-persisted notes (notes live in `localStorage` only).
- Mobile native apps.
- Multi-language UI (copy is English only).
- Public task sharing or unauthenticated task APIs.

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
| Price | RM 0 | Coming soon (Stripe later) |
| Tasks | Max **20** | Unlimited |
| Projects | Max **3** | Unlimited |
| List / Kanban / Table / Completed | Yes | Yes |
| AI chatbot | Locked | Included |
| File attachments | Locked | Included |
| Analytics tab | Locked | Included |
| Calendar | Locked | Included |
| Notes | Locked | Included |
| Upgrade path | `/pricing` | Demo activate in non-production (`ALLOW_MANUAL_UPGRADE`) |

Demo unlock: `POST /api/subscription/activate` is allowed when `ALLOW_MANUAL_UPGRADE=true`, or when the env var is unset **and** `NODE_ENV !== production`. Production defaults to off.

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
| NTE-1 | Notion-style pages with TipTap + slash commands | Pro only (route gated) |
| NTE-2 | Persist pages | `localStorage` key `notion_pages` (not in MySQL) |

### 6.6 Attachments

| ID | Requirement | Acceptance |
|----|-------------|------------|
| ATT-1 | Upload image (JPEG/PNG/GIF/WEBP) or PDF | Max 5MB; Pro only |
| ATT-2 | Files stored on disk under `server/uploads/` | Unique timestamp filename |
| ATT-3 | List / delete attachments for a task the user owns | Auth required |

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

### 6.9 AI chatbot

| ID | Requirement | Acceptance |
|----|-------------|------------|
| AI-1 | Natural-language task ops via Gemini function calling | Pro only; 15 req / min |
| AI-2 | Tools | get_tasks, create_task, update_task, delete_task, get_projects |
| AI-3 | Scope | Task/project/productivity only; refuse off-topic |
| AI-4 | Language | Always reply in English |

### 6.10 Subscription UX

| ID | Requirement | Acceptance |
|----|-------------|------------|
| SUB-1 | `GET /api/subscription` returns plan, limits, usage, features | Used on app load |
| SUB-2 | Pricing page `/pricing` | Compare Free vs Pro |
| SUB-3 | Locked surfaces show UpgradeGate | Chat, analytics, calendar, notes, attachments |
| SUB-4 | Sidebar lock icons | Notes and Calendar when not Pro |

## 7. User journeys

### 7.1 First session (Free)

1. Register → Login → land on `/dashboard`.
2. Create tasks (up to 20) and projects (up to 3).
3. Use Kanban / Table / Completed freely.
4. Opening Calendar, Notes, Analytics, AI, or upload shows an upgrade prompt → `/pricing`.

### 7.2 Upgrade (dev / demo)

1. Open Plans.
2. Click **Activate Pro (demo)** if manual upgrade is enabled.
3. Client merges subscription snapshot into `user` in `localStorage`.
4. Locked routes and widgets unlock without re-login.

### 7.3 Daily use (Pro)

1. Add/edit tasks from Dashboard or AI.
2. Attach files to a task.
3. Review due dates on Calendar; write notes; check analytics.

## 8. Success metrics (product)

- Time-to-first-task after register < 2 minutes.
- Free users never create a 21st task (API 403 `PLAN_LIMIT`).
- Pro-gated routes never render content for Free (UpgradeGate).
- Access token expiry is recovered via refresh without forcing login, unless refresh cookie is missing/idle timeout.

## 9. Constraints

- Backend: Node.js ≥ 20, Express 5, MySQL (`mysql2`), CommonJS.
- Frontend: React 19, Vite 8, Tailwind CSS 4, React Router.
- Deploy: Railway (`npm start` runs migrate then server).
- All user-facing API/UI strings: English.

## 10. Open items / next

1. Stripe Checkout + webhooks using `stripe_customer_id` / `stripe_subscription_id`.
2. Persist notes server-side if they must sync across devices.
3. Drop or hide unused `workspaces` / `workspace_members` tables when safe.
