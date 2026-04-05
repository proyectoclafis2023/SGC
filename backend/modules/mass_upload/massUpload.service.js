const MassUploadParser = require('./massUpload.parser');
const MassUploadValidator = require('./massUpload.validator');
const MassUploadGlobalValidator = require('./massUpload.globalValidator');
const mappingEngine = require('../../core/mapping/engine');
const registry = require('../../core/mapping/registry');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MAX_ROWS_LIMIT = 1000;

class MassUploadService {
  /**
   * Processes an Excel file for a dry run.
   * Performs mapping, per-row validation, and global consistency checks.
   * @param {Buffer} fileBuffer - The Excel file buffer.
   * @returns {Object} - Processing summary and execution readiness.
   */
  async dryRun(fileBuffer) {
    const rawData = MassUploadParser.parseExcel(fileBuffer);
    
    let totalRowsCount = 0;
    
    // 3. Charge Limit: Ensure the file is not too massive
    Object.values(rawData).forEach(sheetRows => { totalRowsCount += sheetRows.length; });
    if (totalRowsCount > MAX_ROWS_LIMIT) {
      throw new Error(`[LIMIT_EXCEEDED] El archivo excede el límite de ${MAX_ROWS_LIMIT} filas permitidas para una carga.`);
    }

    let validRowsTotal = 0;
    let errorRowsTotal = 0;
    const rowErrors = [];
    const allMappedData = {};

    Object.keys(rawData).forEach(moduleKey => {
      const rows = rawData[moduleKey];
      allMappedData[moduleKey] = [];
      let moduleValidRows = 0;
      let moduleErrorRows = 0;

      rows.forEach((row, index) => {
        const rowIndex = index + 2;

        try {
          // 1. Mapping mandatory (excel -> camelCase)
          const mappedRow = mappingEngine.toCamelCase(moduleKey, row, 'excel');
          allMappedData[moduleKey].push(mappedRow);
          
          // 2. Validate data per row
          const errors = MassUploadValidator.validateRow(moduleKey, mappedRow, rowIndex);
          
          if (errors.length > 0) {
            moduleErrorRows++;
            rowErrors.push(...errors);
          } else {
            moduleValidRows++;
          }
        } catch (error) {
          moduleErrorRows++;
          rowErrors.push({
            module: moduleKey,
            row: rowIndex,
            field: 'mapping',
            error: error.message
          });
        }
      });

      validRowsTotal += moduleValidRows;
      errorRowsTotal += moduleErrorRows;
    });

    const globalErrors = await MassUploadGlobalValidator.validateGlobal(allMappedData);
    const readyToExecute = rowErrors.length === 0 && globalErrors.length === 0;

    return {
      summary: {
        total_rows: totalRowsCount,
        valid_rows: validRowsTotal,
        error_rows: errorRowsTotal,
        global_errors_count: globalErrors.length
      },
      ready_to_execute: readyToExecute,
      errors: rowErrors,
      global_errors: globalErrors,
      allMappedData: allMappedData 
    };
  }

  /**
   * Executes transactional persistence with strict mode, limits, and optimized dry-run.
   * @param {Buffer} fileBuffer - The Excel file buffer.
   * @param {Object} options - Configuration: { strictMode, skipDryRun, userId }.
   * @returns {Promise<Object>} - Execution summary with time and processed modules.
   */
  async execute(fileBuffer, options = { strictMode: false, skipDryRun: false, userId: null }) {
    const startTime = Date.now();
    let validationResult = null;

    // 4. Optimize Dry Run: bypass internal check if requested
    if (options.skipDryRun) {
      const data = MassUploadParser.parseExcel(fileBuffer);
      const mappedData = {};
      Object.keys(data).forEach(m => {
          mappedData[m] = data[m].map(r => mappingEngine.toCamelCase(m, r, 'excel'));
      });
      validationResult = { 
        ready_to_execute: true, 
        allMappedData: mappedData,
        summary: { total_rows: Object.values(data).reduce((acc, s) => acc + s.length, 0) } 
      };
    } else {
      validationResult = await this.dryRun(fileBuffer);
    }
    
    if (!validationResult.ready_to_execute) {
      throw new Error(`[EXECUTION_BLOCKED] No se pueden persistir los datos. Se encontraron errores en la validación.`);
    }

    const allMappedData = validationResult.allMappedData;
    const modulesProcessed = [];
    let insertedTotal = 0;

    const executionOrder = [
      'torres', 'tipos_unidad', 'unidades', 'estacionamientos',
      'bancos', 'afps', 'previsiones', 'personal',
      'propietarios', 'residentes',
      'correspondencia', 'visitas', 'solicitud_insumos'
    ];

    try {
      await prisma.$transaction(async (tx) => {
        for (const moduleKey of executionOrder) {
          const rows = allMappedData[moduleKey];
          if (!rows || rows.length === 0) continue;

          modulesProcessed.push(moduleKey);
          const config = registry[moduleKey];

          for (const row of rows) {
            const uniqueField = this.getUniqueKey(moduleKey);
            
            // 1. STRICT_MODE Check: If active, we fail if any record already exists
            if (options.strictMode && uniqueField && row[uniqueField]) {
                const existing = await tx[config.model].findUnique({
                    where: { [uniqueField]: String(row[uniqueField]) }
                });
                if (existing) {
                    throw new Error(`[STRICT_MODE] El registro '${row[uniqueField]}' ya existe en el módulo '${moduleKey}'.`);
                }
            }

            // Normal Flow (Upsert or Create)
            if (moduleKey === 'unidades') {
              await tx.department.upsert({
                where: { number_towerId: { number: String(row.number), towerId: row.towerId } },
                update: row,
                create: row
              });
            } else if (uniqueField && row[uniqueField]) {
              await tx[config.model].upsert({
                where: { [uniqueField]: String(row[uniqueField]) },
                update: row,
                create: row
              });
            } else {
              await tx[config.model].create({ data: row });
            }
            insertedTotal++;
          }
        }
      }, { timeout: 60000 });

      const executionTimeMs = Date.now() - startTime;

      // 2. EXECUTION LOG: Record the session in the DB
      const resultSummary = {
        inserted_rows: insertedTotal,
        modules_processed: modulesProcessed,
        execution_time_ms: executionTimeMs,
        strict_mode: options.strictMode,
        skip_dry_run: options.skipDryRun
      };

      await prisma.massUploadLog.create({
        data: {
          userId: options.userId,
          status: 'success',
          summaryJson: JSON.stringify(resultSummary),
          executionTimeMs: executionTimeMs,
          modulesProcessed: modulesProcessed.join(','),
          isDryRun: false
        }
      });

      // 5. Improved Response
      return {
        status: "success",
        inserted_rows: insertedTotal,
        modules_processed: modulesProcessed,
        execution_time_ms: executionTimeMs
      };

    } catch (error) {
      console.error('[MASS_UPLOAD_EXECUTE_ERROR]', error);
      
      // Log failure for audit
      await prisma.massUploadLog.create({
        data: {
          userId: options.userId,
          status: 'failed',
          summaryJson: JSON.stringify({ error: error.message }),
          executionTimeMs: Date.now() - startTime,
          modulesProcessed: modulesProcessed.join(','),
          isDryRun: false
        }
      }).catch(() => {}); // Avoid secondary crash

      throw new Error(`Carga masiva abortada: ${error.message}. Se realizó rollback total.`);
    }
  }

  getUniqueKey(moduleKey) {
    const keyMap = {
      'personal': 'dni',
      'residentes': 'dni',
      'propietarios': 'dni',
      'torres': 'name',
      'tipos_unidad': 'nombre',
      'bancos': 'nombre',
      'afps': 'name',
      'previsiones': 'name',
      'correspondencia': 'folio',
      'visitas': 'folio',
      'solicitud_insumos': 'folio'
    };
    return keyMap[moduleKey];
  }
}

module.exports = new MassUploadService();
