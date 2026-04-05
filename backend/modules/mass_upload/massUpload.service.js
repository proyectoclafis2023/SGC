const MassUploadParser = require('./massUpload.parser');
const MassUploadValidator = require('./massUpload.validator');
const MassUploadGlobalValidator = require('./massUpload.globalValidator');
const mappingEngine = require('../../core/mapping/engine');
const registry = require('../../core/mapping/registry');
const { normalizeString } = require('../../utils/stringSimilarity');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 3. Configurable Limit: Use environment variable or default to 1000
const MAX_ROWS_LIMIT = parseInt(process.env.MASS_UPLOAD_MAX_ROWS) || 1000;

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
    
    // Charge Limit: Ensure the file is not too massive
    Object.values(rawData).forEach(sheetRows => { totalRowsCount += sheetRows.length; });
    if (totalRowsCount > MAX_ROWS_LIMIT) {
      throw new Error(`[LIMIT_EXCEEDED] El archivo excede el límite de ${MAX_ROWS_LIMIT} filas permitidas.`);
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
      const seenIdentifiers = new Set();
      const uniqueField = this.getUniqueKey(moduleKey);

      rows.forEach((row, index) => {
        const rowIndex = index + 2;

        try {
          // Mapping mandatory (excel -> camelCase)
          const mappedRow = mappingEngine.toCamelCase(moduleKey, row, 'excel');
          allMappedData[moduleKey].push(mappedRow);

          // Duplicate detection (Phase 2 IA Heuristic)
          if (uniqueField && mappedRow[uniqueField]) {
            const normalized = normalizeString(mappedRow[uniqueKey] || mappedRow[uniqueField]);
            if (seenIdentifiers.has(normalized)) {
                rowErrors.push({
                   module: moduleKey,
                   row: rowIndex,
                   field: uniqueField,
                   error: `Dupicado inteligente detectado: '${mappedRow[uniqueField]}'.`,
                   suggestion: "Este registro ya existe en el archivo actual. Sugerencia: Unificar datos o validar folio."
                });
                moduleErrorRows++;
            }
            seenIdentifiers.add(normalized);
          }
          
          // Validate data per row
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
      allMappedData: allMappedData,
      // 4. UI Support: Signal UI that an error report can be shown/downloaded
      download_error_report: rowErrors.length > 0 || globalErrors.length > 0
    };
  }

  /**
   * Executes transactional persistence with strict mode and session logging.
   * @param {Buffer} fileBuffer - The Excel file buffer.
   * @param {Object} options - Configuration: { strictMode, skipDryRun, userId }.
   */
  async execute(fileBuffer, options = { strictMode: false, skipDryRun: false, userId: null }) {
    const startTime = Date.now();
    let validationResult = null;

    if (options.skipDryRun) {
      const data = MassUploadParser.parseExcel(fileBuffer);
      const mappedData = {};
      Object.keys(data).forEach(m => {
          mappedData[m] = data[m].map(r => mappingEngine.toCamelCase(m, r, 'excel'));
      });
      validationResult = { 
        ready_to_execute: true, 
        allMappedData: mappedData,
        errors: [],
        global_errors: []
      };
    } else {
      validationResult = await this.dryRun(fileBuffer);
    }
    
    if (!validationResult.ready_to_execute) {
      throw new Error(`[EXECUTION_BLOCKED] No se pueden persistir los datos. Archivo inválido.`);
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
            
            // STRICT_MODE logic
            if (options.strictMode && uniqueField && row[uniqueField]) {
                const existing = await tx[config.model].findUnique({
                    where: { [uniqueField]: String(row[uniqueField]) }
                });
                if (existing) {
                    throw new Error(`[STRICT_MODE_VIOLATION] El registro '${row[uniqueField]}' en '${moduleKey}' ya existe en el sistema.`);
                }
            }

            // Persistence
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

      // 1. Session Logging: Store detailed result + errors status
      const resultSummary = {
        inserted_rows: insertedTotal,
        modules_processed: modulesProcessed,
        execution_time_ms: executionTimeMs,
        strict_mode: options.strictMode
      };

      await prisma.massUploadLog.create({
        data: {
          userId: options.userId,
          status: 'success',
          summaryJson: JSON.stringify(resultSummary),
          errorsJson: JSON.stringify({ row_errors: validationResult.errors, global_errors: validationResult.global_errors }),
          executionTimeMs: executionTimeMs,
          modulesProcessed: modulesProcessed.join(','),
          isDryRun: false
        }
      });

      return {
        status: "success",
        inserted_rows: insertedTotal,
        modules_processed: modulesProcessed,
        execution_time_ms: executionTimeMs,
        // UI signaling
        download_error_report: false
      };

    } catch (error) {
      console.error('[DATABASE_TRANSACTION_ERROR]', error);
      
      const sessionErrors = {
        main_error: error.message,
        validation_errors: validationResult ? validationResult.errors : [],
        global_errors: validationResult ? validationResult.global_errors : []
      };

      await prisma.massUploadLog.create({
        data: {
          userId: options.userId,
          status: 'failed',
          summaryJson: JSON.stringify({ error: error.message }),
          errorsJson: JSON.stringify(sessionErrors),
          executionTimeMs: Date.now() - startTime,
          modulesProcessed: modulesProcessed.join(','),
          isDryRun: false
        }
      }).catch(() => {});

      throw new Error(`Carga masiva abortada: ${error.message}.`);
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
