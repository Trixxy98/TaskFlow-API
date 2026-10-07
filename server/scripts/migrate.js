const fs = require("fs");
const path = require("path");
const { db } = require("../src/config/database");

const ignoreDup = async (statement) => {
  try {
    await db.query(statement);
  } catch (err) {
    if (err.errno !== 1060 && err.errno !== 1061) throw err;
  }
};

const dropLeftoverWorkspaces = async () => {
  const [fks] = await db.query(
    `SELECT CONSTRAINT_NAME AS name
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'tasks'
       AND COLUMN_NAME = 'workspace_id'
       AND REFERENCED_TABLE_NAME IS NOT NULL`
  );
  for (const row of fks) {
    try {
      await db.query(`ALTER TABLE tasks DROP FOREIGN KEY \`${row.name}\``);
    } catch (err) {
      if (err.errno !== 1091) throw err;
    }
  }

  try {
    await db.query("ALTER TABLE tasks DROP COLUMN workspace_id");
  } catch (err) {
    if (err.errno !== 1091) throw err;
  }

  await db.query("DROP TABLE IF EXISTS workspace_members");
  await db.query("DROP TABLE IF EXISTS workspaces");
};

const runMigration = async () => {
  try {
    const sqlPath = path.join(__dirname, "../src/config/migration.sql");
    let sql = fs.readFileSync(sqlPath, "utf8");

    sql = sql
      .replace(/CREATE DATABASE.*?;/gis, "")
      .replace(/USE\s+\w+\s*;/gi, "")
      .trim();

    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      await db.query(statement);
    }

    const extraColumns = [
      "ALTER TABLE users ADD COLUMN plan ENUM('free', 'pro') NOT NULL DEFAULT 'free'",
      "ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255) DEFAULT NULL",
      "ALTER TABLE users ADD COLUMN stripe_subscription_id VARCHAR(255) DEFAULT NULL",
      "ALTER TABLE users ADD COLUMN notify_overdue TINYINT(1) NOT NULL DEFAULT 1",
      "ALTER TABLE users ADD COLUMN notify_due_today TINYINT(1) NOT NULL DEFAULT 1",
      "ALTER TABLE users ADD COLUMN notify_due_tomorrow TINYINT(1) NOT NULL DEFAULT 0",
      "ALTER TABLE notifications ADD COLUMN dedupe_key VARCHAR(191) DEFAULT NULL",
      "ALTER TABLE notifications ADD UNIQUE KEY unique_user_dedupe (user_id, dedupe_key)",
      `CREATE TABLE IF NOT EXISTS notes (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        user_id    INT           NOT NULL,
        title      VARCHAR(255)  NOT NULL DEFAULT 'Untitled',
        emoji      VARCHAR(32)   NOT NULL DEFAULT '📄',
        content    MEDIUMTEXT,
        created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_notes_user_id (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      "ALTER TABLE tasks ADD COLUMN recurrence ENUM('none', 'daily', 'weekly', 'monthly') NOT NULL DEFAULT 'none'",
    ];

    for (const statement of extraColumns) {
      await ignoreDup(statement);
    }

    await dropLeftoverWorkspaces();

    console.log(`Migration completed — ${statements.length} statements executed`);
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  }
};

runMigration();
