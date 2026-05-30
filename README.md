# ✦ TaskFlow

TaskFlow is a full-stack task management app with clean minimal UI, dark mode support, and collaboration-focused modules.

## Highlights

- JWT auth (`register` / `login`)
- Strong register password rules (min 8, uppercase, number, special char + confirm password)
- Task CRUD with inline edit, due date, overdue state, priority, and completion toggle
- Kanban board (drag & drop), calendar view, table view, search view
- Notes editor (TipTap + slash commands)
- Projects, Team, Feedback, Notifications
- Attachments upload (image/pdf)
- Analytics charts (Recharts)
- Light / Dark / System theme toggle

## Tech Stack

### Frontend (`client-server`)

- React 19
- Vite 8
- Tailwind CSS 4
- TipTap
- Recharts
- dnd-kit
- TanStack Table

### Backend (`server`)

- Node.js
- Express
- MySQL (`mysql2`)
- JWT (`jsonwebtoken`)
- `bcryptjs`
- `multer`

## Project Structure

```bash
TaskFlow API/
├── client-server/          # React app (UI)
│   ├── src/components/
│   ├── src/pages/
│   ├── src/services/api.js
│   └── package.json
└── server/                 # Express API
    ├── src/config/
    ├── src/routes/
    ├── src/controllers/
    └── package.json
```

## Setup

## 1) Clone

```bash
git clone <your-repo-url>
cd "TaskFlow API"
```

## 2) Database

Create DB and run migration file:

```bash
mysql -u root -p < server/src/config/migration.sql
```

## 3) Backend

```bash
cd server
npm install
```

Create `.env` in `server/`:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=taskflow_db
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
```

Run backend:

```bash
npm run dev
```

## 4) Frontend

```bash
cd client-server
npm install
npm run dev
```

Frontend default URL: `http://localhost:5173`  
Backend default URL: `http://localhost:3001`

## API Routes (Summary)

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET/POST/PUT/DELETE /api/tasks`
- `GET/POST/DELETE /api/projects`
- `GET/POST/DELETE /api/feedback`
- `GET/POST/PUT/DELETE /api/team`
- `GET/PUT/DELETE /api/notifications`
- `POST/DELETE /api/upload`

## Notes

- If Vite throws missing dependency error for `recharts` + `react-is`, run:

```bash
cd client-server
npm install
```

- App supports dark mode globally. Theme preference is stored in localStorage via `useTheme`.
