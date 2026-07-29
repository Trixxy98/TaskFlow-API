const fs = require("fs");
const path = require("path");
const { db } = require("../src/config/database");

const runMigration = async () => {
  try {
    const sqlPath = path.join(__dirname, "../src/config/migration.sql");
    let sql = fs.readFileSync(sqlPath, "utf8");

    // Strip CREATE DATABASE and USE statements — Railway manages the DB itself
    sql = sql
      .replace(/CREATE DATABASE.*?;/gis, "")
      .replace(/USE\s+\w+\s*;/gi, "")
      .trim();

    // Split by semicolon, filter empty statements
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      await db.query(statement);
    }

    console.log(`✅ Migration completed — ${statements.length} statements executed`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  }
};

runMigration();
