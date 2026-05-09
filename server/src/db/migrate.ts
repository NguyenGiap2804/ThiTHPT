import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { query, transaction } from "../lib/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Simplified migration for PostgreSQL
 * This script will run schema_pg.sql first if the database is empty,
 * then run any incremental migrations in the migrations folder.
 */

async function ensureMigrationTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS "SchemaMigrations" (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      "appliedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const rows = await query<{ name: string }>(`SELECT name FROM "SchemaMigrations"`);
  return new Set(rows.map(r => r.name));
}

async function runInitialSchema() {
  const schemaPath = path.join(__dirname, "schema_pg.sql");
  if (!fs.existsSync(schemaPath)) return;

  console.log("Running initial PostgreSQL schema...");
  const sql = fs.readFileSync(schemaPath, "utf8");
  
  await transaction(async (client) => {
    await client.query(sql);
    // Mark as applied if it's the first time
    await client.query('INSERT INTO "SchemaMigrations" (name) VALUES ($1) ON CONFLICT DO NOTHING', ["schema_pg.sql"]);
  });
  console.log("✅ Initial schema applied.");
}

async function main() {
  try {
    await ensureMigrationTable();
    
    const applied = await getAppliedMigrations();
    
    // If schema_pg.sql hasn't been applied yet, run it
    if (!applied.has("schema_pg.sql")) {
      await runInitialSchema();
      applied.add("schema_pg.sql");
    }

    const migrationsDir = path.join(__dirname, "migrations");
    if (!fs.existsSync(migrationsDir)) {
      console.log("No migrations folder found.");
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`SKIP ${file}`);
        continue;
      }

      console.log(`APPLY ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      
      await transaction(async (client) => {
        await client.query(sql);
        await client.query('INSERT INTO "SchemaMigrations" (name) VALUES ($1)', [file]);
      });
      console.log(`✅ ${file} applied.`);
    }

    console.log("Database migrations are up to date.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

main();
