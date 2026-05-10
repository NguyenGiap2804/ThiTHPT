import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const toInt = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: parseInt(process.env.PGPORT || '5432'),
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  max: toInt(process.env.PGPOOL_MAX || process.env.PG_POOL_MAX, 10),
  idleTimeoutMillis: toInt(process.env.PG_IDLE_TIMEOUT_MS, 30000),
  connectionTimeoutMillis: toInt(process.env.PG_CONNECTION_TIMEOUT_MS, 10000),
  statement_timeout: toInt(process.env.PG_STATEMENT_TIMEOUT_MS, 30000),
});

/**
 * Execute a query with parameters
 */
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res.rows;
  } finally {
    client.release();
  }
}

/**
 * Execute a single row query
 */
export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Transaction helper
 */
export async function transaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export default pool;
