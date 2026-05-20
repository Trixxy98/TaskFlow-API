<div align="center">

<img src="https://img.shields.io/badge/TaskFlow-v1.0.0-6366f1?style=for-the-badge&logo=checkmarx&logoColor=white" />

# ✦ TaskFlow

**A clean, minimal full-stack task management app**
**Aplikasi pengurusan tugas full-stack yang bersih dan minimalis**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://mysql.com)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

[Features](#-features) • [Tech Stack](#️-tech-stack) • [Getting Started](#-getting-started) • [API Docs](#-api-endpoints) • [Screenshots](#-screenshots)

---

</div>

## 📌 About / Tentang

**EN:** TaskFlow is a full-stack productivity app that helps you manage tasks efficiently. Built with a clean white minimalist UI, it supports task priorities, due dates, team collaboration, and analytics.

**BM:** TaskFlow adalah aplikasi produktiviti full-stack yang membantu anda mengurus tugas dengan cekap. Dibina dengan UI putih minimalis yang bersih, ia menyokong keutamaan tugas, tarikh akhir, kerjasama pasukan, dan analitik.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **Auth** | Register & Login dengan JWT authentication |
| ✅ **Tasks** | Tambah, edit inline, padam, dan toggle task |
| 🎯 **Priority** | High / Medium / Low dengan colour coding |
| 📅 **Due Date** | Set tarikh akhir dengan overdue indicator |
| 📊 **Analytics** | Area chart, bar chart, pie chart — real data |
| 📁 **Projects** | Groupkan tasks mengikut project |
| 👥 **Team** | Invite dan urus ahli pasukan |
| 💬 **Feedback** | Nota dan komen untuk setiap task |
| 🔔 **Notifications** | Alert untuk overdue dan upcoming tasks |
| 🔍 **Search** | Cari task dengan real-time search |
| 📱 **Responsive** | Mobile-friendly UI |

---

## 🛠️ Tech Stack

### Frontend
```
React 18          — UI framework
Vite              — Build tool
Tailwind CSS v4   — Styling
Recharts          — Data visualization
```

### Backend
```
Node.js           — Runtime
Express.js        — Web framework
MySQL2            — Database driver
JWT               — Authentication
bcryptjs          — Password hashing
nodemon           — Development server
```

### Database
```
MySQL 8.0         — Relational database
```

---

## 📁 Project Structure

```
taskflow/
├── client-server/          # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── Sidebar.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── CalendarView.jsx
│   │   │   ├── Completed.jsx
│   │   │   ├── Feedback.jsx
│   │   │   ├── Team.jsx
│   │   │   ├── Notifications.jsx
│   │   │   ├── Search.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── Help.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   └── App.jsx
│   └── package.json
│
└── server/                 # Node.js Backend
    ├── src/
    │   ├── config/
    │   │   ├── database.js
    │   │   └── migration.sql
    │   ├── controllers/
    │   │   ├── authController.js
    │   │   └── taskController.js
    │   ├── middleware/
    │   │   └── authMiddleware.js
    │   └── routes/
    │       ├── authRoutes.js
    │       └── taskRoutes.js
    ├── .env
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MySQL 8.0+
- npm

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/taskflow.git
cd taskflow
```

### 2. Setup Database
```bash
mysql -u root -p < server/src/config/migration.sql
```

### 3. Setup Backend
```bash
cd server
npm install

# Create .env file
cp .env.example .env
```

Edit `.env`:
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

```bash
npm run dev
# Server running at http://localhost:3001
```

### 4. Setup Frontend
```bash
cd client-server
npm install
npm run dev
# App running at http://localhost:5173
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Daftar akaun baru |
| `POST` | `/api/auth/login` | Log masuk |

### Tasks *(requires Bearer token)*
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | Get semua tasks |
| `GET` | `/api/tasks?status=pending` | Filter by status |
| `POST` | `/api/tasks` | Cipta task baru |
| `PUT` | `/api/tasks/:id` | Kemaskini task |
| `DELETE` | `/api/tasks/:id` | Padam task |

### Request Body — Create Task
```json
{
  "title": "Nama task",
  "description": "Penerangan (optional)",
  "due_date": "2026-12-31",
  "priority": "high | medium | low"
}
```

---

## 🗄️ Database Schema

```sql
-- Users
CREATE TABLE users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks
CREATE TABLE tasks (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  status      ENUM('pending', 'completed') DEFAULT 'pending',
  priority    ENUM('low', 'medium', 'high') DEFAULT 'medium',
  due_date    DATE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 📅 Development Journey

| Day | Feature |
|-----|---------|
| 1 | Project setup & folder structure |
| 2 | Express server + MySQL connection |
| 3 | Auth endpoints (register/login) |
| 4 | Task CRUD endpoints |
| 5 | React + Tailwind setup |
| 6 | Login & Register UI |
| 7 | Dashboard + Task list UI |
| 8 | Inline task editing |
| 9 | Due date + overdue indicator |
| 10 | Priority system |
| 11 | White minimalist UI redesign |
| 12 | Sidebar with grouped navigation |
| 13 | All pages (Projects, Team, Feedback, etc.) |
| 14 | Analytics dashboard with Recharts |

---

## 👨‍💻 Author

**Built by** — Learning full-stack development one commit at a time 💪

[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=flat-square&logo=github)](https://github.com/YOUR_USERNAME)

---

<div align="center">

Made with ❤️ using React + Node.js + MySQL

⭐ **Star this repo if you find it useful!**

<<<<<<< HEAD
</div>
=======
</div>
>>>>>>> fad6e13 (feat: complete all pages with database integration (projects, team, feedback, calendar))
