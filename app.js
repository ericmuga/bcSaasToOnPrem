import { tableNames, companies, appGuid, getPool } from "./config.js";
import logger from "./logger.js";
import sql from 'mssql';

export const copyTables = async () => {
  const pool = await getPool('src');
  const tgtPool = await getPool('tgt');

  for (const company of companies) {
    for (const name of tableNames) {
      const baseTable = `${company}$${name}$${appGuid}`;
      const extTable = `${baseTable}$ext`;

      const copiedRows = await copyTable(baseTable, pool, tgtPool);

      if (copiedRows > 0) {
        const extExists = await tgtPool.request().query(`
          SELECT 1 FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_NAME = '${extTable.replace(/'/g, "''")}'
        `);

        if (extExists.recordset.length > 0) {
          await copyTable(extTable, pool, tgtPool);
        } else {
          logger.warn(`Skipping ${extTable}: extension table does not exist in target`);
        }
      } else {
        logger.info(`Skipping extension for ${baseTable}: base table has no data`);
      }
    }
  }

  await pool.close();
  await tgtPool.close();
};

const isValidSqlIdentifier = name => /^[\w\s\-\$()]+$/.test(name);

async function copyTable(tableNameOnly, pool, tgtPool) {
  const startTime = Date.now();
  let totalRowsCopied = 0;

  try {
    logger.info(`Starting copy process for table: ${tableNameOnly}`);

    const tgtColsResult = await tgtPool.request()
      .query(`SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${tableNameOnly.replace(/'/g, "''")}'`);
    const tgtCols = tgtColsResult.recordset.map(r => r.COLUMN_NAME);
    const tgtColTypes = Object.fromEntries(tgtColsResult.recordset.map(r => [r.COLUMN_NAME, r.DATA_TYPE]));

    const srcColsResult = await pool.request().query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = '${tableNameOnly.replace(/'/g, "''")}'
    `);
    const srcCols = srcColsResult.recordset.map(r => r.COLUMN_NAME);

    const validCols = tgtCols
      .filter(col => col.toLowerCase() !== 'timestamp' && srcCols.includes(col) && isValidSqlIdentifier(col));
    const quotedCols = validCols.map(c => `[${c}]`).join(', ');

    const srcRows = await pool.request().query(`SELECT ${quotedCols} FROM [${tableNameOnly}]`);

    if (srcRows.recordset.length === 0) {
      logger.info(`No rows to copy for ${tableNameOnly}`);
      return 0;
    }

    await tgtPool.request().query(`TRUNCATE TABLE [${tableNameOnly}]`);

    const chunks = [];
    for (let i = 0; i < srcRows.recordset.length; i += 1000) {
      chunks.push(srcRows.recordset.slice(i, i + 1000));
    }

    for (const chunk of chunks) {
      const insertValues = chunk.map(row => {
        return `(${validCols.map(col => formatValue(row[col], tgtColTypes[col] || 'nvarchar')).join(', ')})`;
      }).join(', ');

      await tgtPool.request().query(`
        INSERT INTO [${tableNameOnly}] (${quotedCols})
        VALUES ${insertValues}
      `);
      totalRowsCopied += chunk.length;
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(`Copied ${totalRowsCopied} rows to ${tableNameOnly} in ${duration}s`);
    return totalRowsCopied;
  } catch (error) {
    logger.error(`Error processing [dbo].[${tableNameOnly}]: ${error.message}`);
    throw error;
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

    default:
      return isNaN(value) ? `'${value.toString().replace(/'/g, "''")}'` : value;
  }
}

copyTables()
  .then(() => logger.info('All tables copied successfully'))
  .catch(err => logger.error(`Copy process failed: ${err.message}`));
