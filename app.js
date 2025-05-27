import { companies, appGuid, getPool, getTableNames, dbConfigs } from './config.js';
import logger from './logger.js';
import fs from 'fs';
import path from 'path';

let sqlScriptCounter = 1;

export const copyTables = async (startFromTable = null) => {
  const pool = await getPool('src');
  const tgtPool = await getPool('tgt');
  const srcDbName = dbConfigs.src.database;

  for (const company of companies) {
    logger.info(`🔁 Processing company: ${company}`);
    const tableNames = await getTableNames(pool, company, appGuid);

    let shouldCopy = !startFromTable;
    for (const table of tableNames) {
      if (!shouldCopy) {
        if (table === startFromTable) {
          logger.info(`▶️ Resuming from table: ${table}`);
          shouldCopy = true;
        } else {
          logger.info(`⏭️ Skipping table: ${table}`);
          continue;
        }
      }

      try {
        await copyTable(table, pool, tgtPool, srcDbName);
        if (global.gc) global.gc();
      } catch (err) {
        logger.warn(`⚠️ Skipping table ${table}: ${err.message}`);
      }
    }
  }

  await pool.close();
  await tgtPool.close();
};

const isValidSqlIdentifier = name => /^[\w\s\-\$()]+$/.test(name);

async function copyTable(tableNameOnly, pool, tgtPool, srcDbName) {
  const startTime = Date.now();
  let totalRowsCopied = 0;

  try {
    logger.info(`Starting copy process for table: ${tableNameOnly}`);

    const tgtColsResult = await tgtPool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${tableNameOnly.replace(/'/g, "''")}'
    `);
    const tgtCols = tgtColsResult.recordset.map(r => r.COLUMN_NAME);
    const tgtColTypes = Object.fromEntries(tgtColsResult.recordset.map(r => [r.COLUMN_NAME, r.DATA_TYPE]));

    const srcColsResult = await pool.request().query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${tableNameOnly.replace(/'/g, "''")}'
    `);
    const srcCols = srcColsResult.recordset.map(r => r.COLUMN_NAME);

    const validCols = tgtCols
      .filter(col => col.toLowerCase() !== 'timestamp' && srcCols.includes(col) && isValidSqlIdentifier(col));
    const quotedCols = validCols.map(c => `[${c}]`).join(', ');

    const identityCheck = await tgtPool.request().query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dbo'
        AND TABLE_NAME = '${tableNameOnly.replace(/'/g, "''")}'
        AND COLUMNPROPERTY(
          OBJECT_ID(QUOTENAME(TABLE_SCHEMA) + '.' + QUOTENAME(TABLE_NAME)),
          COLUMN_NAME,
          'IsIdentity'
        ) = 1
    `);
    const hasIdentity = identityCheck.recordset.length > 0;

    const countResult = await pool.request().query(`SELECT COUNT(*) AS total FROM [${tableNameOnly}]`);
    const totalRows = countResult.recordset[0].total;

    if (totalRows > 100000) {
      logger.warn(`⚠️ Table ${tableNameOnly} has ${totalRows} rows. Generating SQL script instead of copying.`);
      await generateFallbackSqlScript(tableNameOnly, validCols, quotedCols, tgtPool, srcDbName);
      return 0;
    }

    await disableNonClusteredIndexes(tgtPool, tableNameOnly);
    await tgtPool.request().query(`DELETE FROM [${tableNameOnly}]`);
    if (hasIdentity) {
      await tgtPool.request().query(`SET IDENTITY_INSERT [${tableNameOnly}] ON`);
    }

    const request = pool.request();
    request.stream = true;

    const batchSize = 1000;
    let batch = [];

    return new Promise((resolve, reject) => {
      request.query(`SELECT ${quotedCols} FROM [${tableNameOnly}]`);

      request.on('row', async row => {
        batch.push(row);
        if (batch.length >= batchSize) {
          request.pause();
          try {
            await insertBatch(batch, tgtPool, tableNameOnly, validCols, tgtColTypes, hasIdentity);
            totalRowsCopied += batch.length;
          } catch (err) {
            logger.warn(`⚠️ Insert failed for ${tableNameOnly}: ${err.message}`);
            request.cancel();
            return reject(err);
          }
          batch = [];
          request.resume();
        }
      });

      request.on('done', async () => {
        if (batch.length > 0) {
          try {
            await insertBatch(batch, tgtPool, tableNameOnly, validCols, tgtColTypes, hasIdentity);
            totalRowsCopied += batch.length;
          } catch (err) {
            return reject(err);
          }
        }

        if (hasIdentity) {
          await tgtPool.request().query(`SET IDENTITY_INSERT [${tableNameOnly}] OFF`);
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        logger.info(`✅ Copied ${totalRowsCopied} rows to ${tableNameOnly} in ${duration}s`);
        resolve(totalRowsCopied);
      });

      request.on('error', err => {
        reject(err);
      });
    });

  } catch (error) {
    logger.error(`❌ Error processing [dbo].[${tableNameOnly}]: ${error.message}`);
    throw error;
  }
}

async function insertBatch(rows, pool, tableName, cols, colTypes, hasIdentity) {
  const quotedCols = cols.map(c => `[${c}]`).join(', ');
  const insertValues = rows.map(row =>
    `(${cols.map(col => formatValue(row[col], colTypes[col] || 'nvarchar')).join(', ')})`
  ).join(', ');

  try {
    if (hasIdentity) {
      await pool.request().query(`SET IDENTITY_INSERT [${tableName}] ON`);
    }

    await pool.request().query(`
      INSERT INTO [${tableName}] (${quotedCols})
      VALUES ${insertValues}
    `);

    if (hasIdentity) {
      await pool.request().query(`SET IDENTITY_INSERT [${tableName}] OFF`);
    }
  } catch (err) {
    throw new Error('INSERT_FAILED');
  }
}

function formatValue(value, dataType) {
  if (value === null || value === undefined) return 'NULL';

  switch ((dataType || '').toLowerCase()) {
    case 'varchar':
    case 'nvarchar':
    case 'char':
    case 'nchar':
    case 'text':
      return `'${value.toString().replace(/'/g, "''")}'`;
    case 'date':
    case 'datetime':
    case 'datetime2':
    case 'smalldatetime':
      return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
    case 'uniqueidentifier':
      return /^[0-9a-fA-F\-]{36}$/.test(value) ? `'${value}'` : 'NULL';
    case 'bit':
      return value ? '1' : '0';
    case 'varbinary':
    case 'binary':
    case 'image':
      if (Buffer.isBuffer(value)) {
        return `0x${value.toString('hex')}`;
      }
      return 'NULL';
    default:
      return isNaN(value) ? `'${value.toString().replace(/'/g, "''")}'` : value;
  }
}

async function generateFallbackSqlScript(tableName, validCols, quotedCols, tgtPool, srcDbName) {
  const normalizedName = tableName
    .replace(/.*\$/, '')
    .replace(/\$.*$/, '')
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();

  const paddedIndex = sqlScriptCounter.toString().padStart(4, '0');
  const filename = `SQL${paddedIndex}_${normalizedName}.sql`;
  sqlScriptCounter++;

  const script = `
-- Fallback script for table ${tableName}
BEGIN TRANSACTION;

DELETE FROM [${tableName}];

INSERT INTO [${tableName}] (${quotedCols})
SELECT ${quotedCols}
FROM [${srcDbName}].[dbo].[${tableName}];

COMMIT;
`;

  const outputPath = path.join('./generated-scripts', filename);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, script.trim(), 'utf8');
  logger.info(`📝 SQL fallback script written to: ${outputPath}`);
}

async function disableNonClusteredIndexes(pool, tableName) {
  const result = await pool.request().query(`
    SELECT i.name
    FROM sys.indexes i
    JOIN sys.objects o ON i.object_id = o.object_id
    WHERE o.name = '${tableName.replace(/'/g, "''")}'
      AND i.is_primary_key = 0
      AND i.type_desc = 'NONCLUSTERED'
  `);

  for (const row of result.recordset) {
    logger.info(`🛑 Disabling index ${row.name} on ${tableName}`);
    await pool.request().query(`ALTER INDEX [${row.name}] ON [${tableName}] DISABLE`);
  }
}

async function rebuildDisabledIndexes(pool, tableName) {
  const result = await pool.request().query(`
    SELECT i.name
    FROM sys.indexes i
    JOIN sys.objects o ON i.object_id = o.object_id
    WHERE o.name = '${tableName.replace(/'/g, "''")}'
      AND i.is_disabled = 1
  `);

  for (const row of result.recordset) {
    logger.info(`🔧 Rebuilding index ${row.name} on ${tableName}`);
    await pool.request().query(`ALTER INDEX [${row.name}] ON [${tableName}] REBUILD`);
  }
}

const startFrom = process.argv[2] || null;

copyTables(startFrom)
  .then(() => logger.info('✅ All tables processed'))
  .catch(err => logger.error(`❌ Copy process failed: ${err.message}`));