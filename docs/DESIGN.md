# TaskFlow — Design

Visual and interaction design for the React client (`client-server`). Complements [PRD.md](./PRD.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 1. Design principles

1. **Calm and dense, not noisy.** Gray canvas, white cards, small type, few colors.
2. **One primary action per surface.** Dark button (`bg-gray-900`) or indigo/blue in dark mode.
3. **Lock, don’t hide.** Free users still see Calendar, Notes, AI, and Analytics in nav; they get a gate, not a missing item.
4. **English-only copy.** Short sentences. No marketing fluff on product pages except Plans.
5. **Dark mode is first-class.** Every card, border, and text color has a `dark:` pair.

## 2. Layout

```
┌────────────┬──────────────────────────────────────┐
│            │                                      │
│  Sidebar   │              Main                    │
│  (sticky)  │         overflow-y-auto              │
│            │                                      │
│            │                                      │
│  theme +   │                                      │
│  logout    │                                      │
└────────────┴──────────────────────────────────────┘
                         ChatBot FAB (fixed)
```

- Shell: `flex min-h-screen bg-gray-50 dark:bg-gray-950`.
- Sidebar: white / `gray-950`, right border `gray-100` / `gray-800`, sticky on `md+`.
- Main: `flex-1 overflow-y-auto`.
- Page body: typically `p-4 md:p-8 max-w-4xl mx-auto` (calendar, pricing, settings). Notes is full-bleed with an inner page list.
- Mobile: top bar + hamburger; overlay `bg-black/40`; sidebar slides as `fixed` drawer.

ChatBot is **outside** the sidebar/main flex so it floats over every authenticated route.

## 3. Color

| Token | Light | Dark | Use |
|-------|--------|------|-----|
| Canvas | `gray-50` | `gray-950` | App background |
| Surface | `white` | `gray-900` | Cards |
| Border | `gray-100` | `gray-800` | Card/sidebar edges |
| Title | `gray-900` | `gray-100` | Headings |
| Body muted | `gray-400`–`500` | `gray-400`–`500` | Subtitles, empty states |
| Primary button | `gray-900` hover `gray-700` | `blue-600` hover `blue-500` | Submit, upgrade |
| Accent | `indigo-600` | `indigo-300` / `indigo-900/30` | Logo tile, badges |
| Danger | `red-500` | `red-300` | Errors, overdue |
| Pro panel | `gray-900` text white | `blue-600` text white | Pricing Pro card |

### Priority chips (Dashboard)

| Priority | Text | Background / border |
|----------|------|---------------------|
| High | `text-red-500` | `bg-red-50` / `border-red-200` |
| Medium | `text-amber-500` | `bg-amber-50` / `border-amber-200` |
| Low | `text-emerald-500` | `bg-emerald-50` / `border-emerald-200` |

Calendar dots: emerald = all done, amber = open, red = overdue in upcoming list.

## 4. Typography and shape

- Headings: `text-2xl md:text-3xl font-bold`.
- Section labels: `text-xs font-semibold uppercase tracking-wider text-gray-400`.
- Body: `text-sm`.
- Cards: `rounded-2xl` (most) or `rounded-3xl` (pricing).
- Buttons: `rounded-xl`, `text-sm font-medium`.
- Inputs: match card radius; transparent in notes title editor.
- Shadows: `shadow-sm` in light; `dark:shadow-none`.

No custom font files; system / Tailwind defaults.

## 5. Navigation

Sidebar sections:

| Section | Items |
|---------|--------|
| OVERVIEW | Dashboard, Projects, Kanban, Table View |
| MY PAGES | Notes, Calendar, Completion, Tasks, Feedback |
| SUPPORT | Notifications, Help Centre, Settings |

- Active item: `bg-gray-100 dark:bg-gray-800` + dark text.
- Inactive: muted gray, hover wash.
- Badges: indigo pill for project count, feedback count, unread notifications.
- Free plan: 🔒 next to Notes and Calendar.
- Footer: avatar initial, name, email, Light/Dark/System cycle, Upgrade to Pro (if Free), Logout.
- Collapsible on desktop; hamburger on mobile.

`/pricing` and `/profile` exist as routes; Plans is reached from sidebar footer and Settings, not from the main nav list.

## 6. Component patterns

### 6.1 Card

White/`gray-900` surface, `border`, `rounded-2xl`, `p-5` or `p-8`. Used for task rows, empty states, settings blocks, upgrade gate.

### 6.2 UpgradeGate

Centered lock marketing block:

- Lucide `Sparkles` mark
- Title + one-line description
- **Upgrade to Pro** → `/pricing`

`ProFeature` wraps a full page and vertically centers the gate (`min-h-[60vh]`).

### 6.3 Empty state

Muted `text-sm` plus a Lucide icon (`w-10 h-10`, `text-gray-300`). Notes page covers may still use emoji as content, not chrome.

Icons: **Lucide** (`strokeWidth` 1.75, typically `w-4 h-4`) for navigation, actions, and empty states.

### 6.4 ChatBot

- FAB bottom-right.
- Panel: messages left/right bubbles; Pro-only composer.
- Free: centered lock + upgrade button instead of thread/input.

### 6.5 Attachments

Dashed drop zone. Locked state is a dashed button that navigates to pricing: “File attachments are available on Pro”.

### 6.6 Forms

Auth pages are public, centered, same card language. Task create is a compact bar on Dashboard (title + date + priority + Add).

## 7. Screens

| Route | Layout notes |
|-------|----------------|
| `/login`, `/register`, `/forgot-password`, `/reset-password` | No sidebar. Auth card. |
| `/dashboard`, `/tasks` | Tabs: Tasks / Analytics. Analytics tab is gated. |
| `/projects` | Project cards + unassigned tasks. |
| `/kanban` | Three columns, drag handles. |
| `/table` | Sortable table. |
| `/notes` | Left page list (`w-56`) + TipTap canvas. Gated. |
| `/calendar` | Month grid + selected-day / upcoming lists. Gated. |
| `/completed` | Completed tasks only. |
| `/feedback` | Feedback list. |
| `/notifications` | Paginated list, mark read. |
| `/help` | Accordion FAQs. |
| `/pricing` | Two-column Free vs Pro. Pro card inverted. |
| `/settings` | Profile + plan usage + notifications. |
| `/profile` | User summary. |

## 8. Theme

`useTheme` stores `light` | `dark` | `system` in `localStorage.theme`.

- `dark` → `document.documentElement` class `dark`.
- `system` follows `prefers-color-scheme` and listens for changes.

Tailwind v4 via `@tailwindcss/vite`. Dark variants are explicit in class names (`dark:`), not a custom theme file.

## 9. Motion and feedback

- Color/background `transition` and `transition-colors duration-200` on the shell.
- Sidebar width `transition-all duration-300`.
- No page-load spinners as a global pattern; buttons show local loading text (e.g. “Activating…”).
- Plan errors: red banner (`bg-red-50` / `dark:bg-red-500/10`).

## 10. Responsive

| Breakpoint | Behavior |
|------------|----------|
| `< md` | Hidden sidebar, sticky top bar, overlay drawer |
| `md+` | Persistent sidebar, optional collapse |
| Pricing | `grid md:grid-cols-2` |
| Notes title | `text-3xl md:text-4xl` |

Do not introduce a second nav pattern (tabs in the header, etc.) unless the screen already has them (Dashboard Tasks/Analytics).

## 11. Content tone

- Buttons: verbs (“Upgrade to Pro”, “Activate Pro (demo)”, “+ Add”).
- Gates: “X is a Pro feature” + one benefit sentence.
- Errors: full sentence, English, no stack traces in the UI.
- Empty: “No upcoming tasks”, “No pages yet”.

## 12. Do / don’t

**Do**

- Reuse card radius, border, and gray scale.
- Gate Pro pages with `ProFeature` / `UpgradeGate`.
- Pair every light color with `dark:`.

**Don’t**

- Add a third brand color beyond gray + indigo/blue + semantic red/amber/emerald.
- Hide Pro nav items from Free users.
- Persist notes in a new visual style that breaks the page-list + editor split.
