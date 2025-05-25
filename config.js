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

export const companies = ['FCL1'];
export const appGuid = '437dbf0e-84ff-417a-965d-ed2bb9650972';

export const excludedTables = [
  'User',
  'Access Control',
  'Object Metadata',
  'Object',
  'Permission Set',
  'User Permission Set',
  'User Setup',
  'Page Data Personalization',
  'Report Inbox',
  'Change Log Entry',
  'Record Link',
  'Notes',
  // 👇 Explicit Config_* exclusions
  'Config_ Field Map',
  'Config_ Field Mapping',
  'Config_ Line',
  'Config_ Media Buffer',
  'Config_ Package Data',
  'Config_ Package Error',

  // 💡 Added pattern-based exclusions
  /^Config_ /i,
  /^Config_ Field/i,
  /^Config_ Media/i,
  /^Config_ Package/i
];

export async function getTableNames(pool, company, appGuid) {
  const prefix = `${company}$`;
  const suffix = `$${appGuid}`;

  const result = await pool.request().query(`
    SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE = 'BASE TABLE'
      AND TABLE_NAME LIKE '${prefix}%${suffix}'
  `);

  const allTables = result.recordset.map(r => r.TABLE_NAME);
  const filtered = [];

  for (const fullName of allTables) {
    const baseMatch = fullName.match(new RegExp(`^${company}\\$(.*?)\\$${appGuid}$`));
    if (!baseMatch) continue;

    const baseName = baseMatch[1];

    // 🔴 Skip any base table that starts with "Config"
    if (baseName.startsWith("Config")) continue;

    // Your original skip list check
    if (excludedTables.includes(baseName)) continue;

    // ✅ Include base table
    filtered.push(fullName);

    // ✅ Include its extension if it exists
    const extName = `${company}$${baseName}$${appGuid}$ext`;
    if (allTables.includes(extName)) {
      filtered.push(extName);
    }
  }

  return filtered;
}



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
      const config = {
        user: dbConfigs[dbName].user,
        password: dbConfigs[dbName].password,
        server: dbConfigs[dbName].server,
        database: dbConfigs[dbName].database,
        options: {
          ...dbConfigs[dbName].options,
          requestTimeout: 0
        }
      };

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
