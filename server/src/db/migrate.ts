import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sql from "mssql";
import { getPool, closePool } from "../lib/database";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, "migrations");

const splitSqlBatches = (sqlText: string): string[] =>
  sqlText
    .split(/^\s*GO\s*;?\s*$/gim)
    .map((batch) => batch.trim())
    .filter(Boolean);

const ensureMigrationTable = async (pool: sql.ConnectionPool) => {
  await pool.request().query(`
    IF OBJECT_ID('dbo.SchemaMigrations', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.SchemaMigrations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL UNIQUE,
        appliedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
      );
    END
  `);
};

const getAppliedMigrations = async (pool: sql.ConnectionPool): Promise<Set<string>> => {
  const result = await pool.request().query("SELECT name FROM dbo.SchemaMigrations");
  return new Set(result.recordset.map((row: { name: string }) => row.name));
};

const applyMigration = async (pool: sql.ConnectionPool, fileName: string) => {
  const migrationPath = path.join(migrationsDir, fileName);
  const sqlText = fs.readFileSync(migrationPath, "utf8");
  const batches = splitSqlBatches(sqlText);
  const transaction = new sql.Transaction(pool);

  await transaction.begin();
  try {
    for (const batch of batches) {
      await new sql.Request(transaction).query(batch);
    }

    await new sql.Request(transaction)
      .input("name", sql.NVarChar(255), fileName)
      .query("INSERT INTO dbo.SchemaMigrations (name) VALUES (@name)");

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const main = async () => {
  const pool = await getPool();
  await ensureMigrationTable(pool);

  const applied = await getAppliedMigrations(pool);
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const fileName of migrationFiles) {
    if (applied.has(fileName)) {
      console.log(`SKIP ${fileName}`);
      continue;
    }

    console.log(`APPLY ${fileName}`);
    await applyMigration(pool, fileName);
  }

  console.log("Database migrations are up to date.");
};

main()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
