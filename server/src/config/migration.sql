CREATE DATABASE IF NOT EXISTS taskflow_db;
USE taskflow_db;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100)  NOT NULL,
  email      VARCHAR(150)  NOT NULL UNIQUE,
  password   VARCHAR(255)  NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT          NOT NULL,
  name       VARCHAR(100) NOT NULL,
  color      VARCHAR(20)  DEFAULT '#6366f1',
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT          NOT NULL,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  status        ENUM('pending', 'completed') DEFAULT 'pending',
  priority      ENUM('low', 'medium', 'high') DEFAULT 'medium',
  kanban_status ENUM('todo', 'inprogress', 'done') DEFAULT 'todo',
  project       VARCHAR(100) DEFAULT NULL,
  due_date      DATE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- WORKSPACES
-- ============================================================
CREATE TABLE IF NOT EXISTS workspaces (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  owner_id   INT          NOT NULL,
  name       VARCHAR(100) NOT NULL DEFAULT 'My Workspace',
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- WORKSPACE MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS workspace_members (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT         NOT NULL,
  user_id      INT         NOT NULL,
  role         ENUM('owner', 'admin', 'member') DEFAULT 'member',
  joined_at    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_member (workspace_id, user_id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)      REFERENCES users(id)      ON DELETE CASCADE
);

-- ============================================================
-- FEEDBACK
-- ============================================================
CREATE TABLE IF NOT EXISTS feedback (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  task_id    INT  NOT NULL,
  user_id    INT  NOT NULL,
  message    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT          NOT NULL,
  type       VARCHAR(50)  NOT NULL,
  title      VARCHAR(255) NOT NULL,
  message    TEXT,
  data       JSON,
  is_read    TINYINT(1)   DEFAULT 0,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- PASSWORD RESETS
-- token_hash: SHA-256 hash of the raw token sent to the user
-- ============================================================
CREATE TABLE IF NOT EXISTS password_resets (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT         NOT NULL,
  token_hash VARCHAR(64) NOT NULL,
  expires_at DATETIME    NOT NULL,
  created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_token (token_hash),
  INDEX idx_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- REFRESH TOKENS
-- token_hash: SHA-256 hash of the raw refresh token (raw token stored in httpOnly cookie)
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT         NOT NULL,
  token_hash VARCHAR(64) NOT NULL,
  expires_at DATETIME    NOT NULL,
  created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_token (token_hash),
  INDEX idx_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- TASK ATTACHMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS task_attachments (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  task_id      INT          NOT NULL,
  filename     VARCHAR(255) NOT NULL,
  originalname VARCHAR(255) NOT NULL,
  mimetype     VARCHAR(100) NOT NULL,
  size         INT          NOT NULL,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);
