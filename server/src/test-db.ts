import sql from "mssql";
import dotenv from "dotenv";
import os from "os";

dotenv.config();

const config: sql.config = {
  server: process.env.MSSQL_SERVER || "localhost",
  database: process.env.MSSQL_DATABASE || "ThiptExamDB",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  authentication: {
    type: "ntlm",
    options: {
      userName: "",
      password: "",
      domain: os.hostname(),
    }
  },
};

// Handle named instances
if (config.server.includes("\\")) {
  const [host, instance] = config.server.split("\\");
  config.server = host;
  config.options = {
    ...config.options,
    instanceName: instance,
  };
}

async function test() {
  console.log("Config trying:", JSON.stringify(config, null, 2));
  try {
    const pool = await sql.connect(config);
    console.log("SUCCESS: Connected to SQL Server");
    const result = await pool.request().query("SELECT 1 as result");
    console.log("QUERY SUCCESS:", result.recordset);
    await pool.close();
  } catch (err) {
    console.error("FAILURE: Error connecting to SQL Server");
    console.error(err);
  }
}

test();
