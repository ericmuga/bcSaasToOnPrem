import dotenv from 'dotenv';
import sql from 'mssql';
dotenv.config();

// Validate required environment variables
const requiredVars = [
  'SRC_DB_USER', 'SRC_DB_PASSWORD', 'SRC_DB_SERVER', 'SRC_DB_NAME',
  'TGT_DB_USER', 'TGT_DB_PASSWORD', 'TGT_DB_SERVER', 'TGT_DB_NAME'
];

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
}

export const companies = ['FCL1','RMK','FLM1']; // Add more as needed
export const appGuid = '437dbf0e-84ff-417a-965d-ed2bb9650972';
export const tableNames = ['Item', 'Vendor', 'Customer'];

// Database configurations
export const dbConfigs = {
  src: {
    user: process.env.SRC_DB_USER,
    password: process.env.SRC_DB_PASSWORD,
    server: process.env.SRC_DB_SERVER,
    database: process.env.SRC_DB_NAME,
    options: {
      port: parseInt(process.env.SRC_DB_PORT || '1433'),
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true
    }
  },
  tgt: {
    user: process.env.TGT_DB_USER,
    password: process.env.TGT_DB_PASSWORD,
    server: process.env.TGT_DB_SERVER,
    database: process.env.TGT_DB_NAME,
    options: {
      port: parseInt(process.env.TGT_DB_PORT || '1433'),
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true
    }
  }
};

const pools = {};

export const getPool = async (dbName) => {
  if (!dbConfigs[dbName]) {
    throw new Error(`Database configuration for '${dbName}' not found`);
  }

  if (!pools[dbName]) {
    try {
      // Create a properly formatted config object
      const config = {
        user: dbConfigs[dbName].user,
        password: dbConfigs[dbName].password,
        server: dbConfigs[dbName].server,
        database: dbConfigs[dbName].database,
        options: {
          ...dbConfigs[dbName].options,
           requestTimeout: 0 // unlimited timeout
        }
      };

      // Validate server is provided
      if (!config.server || typeof config.server !== 'string') {
        throw new Error(`Invalid server configuration for ${dbName}`);
      }

      const pool = new sql.ConnectionPool(config);
      await pool.connect();
      pools[dbName] = pool;
      console.log(`Successfully connected to SQL Server: ${dbName}`);
      return pool;
    } catch (err) {
      console.error(`Database connection failed for '${dbName}':`, err.message);
      throw err;
    }
  }

  return pools[dbName];
};