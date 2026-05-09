import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

/**
 * SQL Server connection pool configuration
 */
// Handle named instances in MSSQL_SERVER (e.g. host\instance)
const serverRaw = process.env.MSSQL_SERVER || "localhost";
let serverHost = serverRaw;
let instanceName: string | undefined;

if (serverRaw.includes("\\")) {
  const [host, instance] = serverRaw.split("\\");
  serverHost = host;
  instanceName = instance;
}

const config: sql.config = {
  server: serverHost,
  database: process.env.MSSQL_DATABASE || "ThiptExamDB",
  options: {
    encrypt: process.env.MSSQL_ENCRYPT === "true",
    trustServerCertificate: process.env.MSSQL_TRUST_SERVER_CERTIFICATE !== "false",
    connectTimeout: 30000,
    instanceName: instanceName,
  },
};

const port = Number(process.env.MSSQL_PORT);
if (Number.isInteger(port) && port > 0 && !instanceName) {
  config.port = port;
}

// Authentication handling
const dbUsername = process.env.MSSQL_USERNAME || process.env.MSSQL_USER;
const dbPassword = process.env.MSSQL_PASSWORD;

if (dbUsername && dbPassword) {
  config.authentication = {
    type: "default",
    options: {
      userName: dbUsername,
      password: dbPassword,
    },
  };
} else {
  console.warn("MSSQL_USERNAME/MSSQL_PASSWORD are not set; attempting driver default authentication.");
}

let pool: sql.ConnectionPool | null = null;

/**
 * Initialize connection pool
 */
export const initializePool = async (): Promise<sql.ConnectionPool> => {
  if (pool && pool.connected) {
    return pool;
  } else if (pool) {
    // If it exists but not connected, close and try again
    try {
      await pool.close();
    } catch (e) {}
    pool = null;
  }

  try {
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log("✅ Database connection pool initialized");
    return pool;
  } catch (error) {
    pool = null; // Important: Clear on fail so next request can retry
    console.error("❌ Failed to initialize database connection pool:", error);
    throw error;
  }
};

/**
 * Get connection pool (lazy initialize)
 */
export const getPool = async (): Promise<sql.ConnectionPool> => {
  if (!pool) {
    return initializePool();
  }
  return pool;
};

/**
 * Execute query with parameters
 */
export const executeQuery = async (
  query: string,
  params?: Record<string, any>
): Promise<any[]> => {
  try {
    const p = await getPool();
    const request = p.request();

    // Add parameters if provided
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        request.input(key, value);
      }
    }

    const result = await request.query(query);
    return result.recordset || [];
  } catch (error) {
    console.error("Query execution error:", error);
    throw error;
  }
};

/**
 * Execute query and return single row
 */
export const executeQuerySingle = async (
  query: string,
  params?: Record<string, any>
): Promise<Record<string, any> | null> => {
  const result = await executeQuery(query, params);
  return result.length > 0 ? result[0] : null;
};

/**
 * Execute non-query (INSERT, UPDATE, DELETE)
 */
export const executeNonQuery = async (
  query: string,
  params?: Record<string, any>
): Promise<number> => {
  try {
    const p = await getPool();
    const request = p.request();

    // Add parameters if provided
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        request.input(key, value);
      }
    }

    const result = await request.query(query);
    return result.rowsAffected[0] || 0;
  } catch (error) {
    console.error("Non-query execution error:", error);
    throw error;
  }
};

/**
 * Close connection pool
 */
export const closePool = async (): Promise<void> => {
  if (pool) {
    try {
      await pool.close();
      console.log("✅ Database connection pool closed");
      pool = null;
    } catch (error) {
      console.error("Error closing pool:", error);
    }
  }
};

// Graceful shutdown
process.on("exit", () => {
  closePool();
});

process.on("SIGINT", () => {
  closePool();
  process.exit(0);
});

export default {
  initializePool,
  getPool,
  executeQuery,
  executeQuerySingle,
  executeNonQuery,
  closePool,
};
