const MassUploadParser = require('./massUpload.parser');
const MassUploadValidator = require('./massUpload.validator');
const MassUploadGlobalValidator = require('./massUpload.globalValidator');
const MassUploadAI = require('./massUpload.ai');
const registry = require('../../core/mapping/registry');
const mappingEngine = require('../../core/mapping/engine');
const { normalizeString } = require('../../utils/stringSimilarity');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MAX_ROWS_LIMIT = parseInt(process.env.MASS_UPLOAD_MAX_ROWS) || 1000;

class MassUploadService {
  /**
   * Processes an Excel file for a dry run.
   */
  async dryRun(fileBuffer, options = { autoFix: false }) {
    const rawData = MassUploadParser.parseExcel(fileBuffer);
    
    let totalRowsCount = 0;
    Object.values(rawData).forEach(sheetRows => { totalRowsCount += sheetRows.length; });
    
    if (totalRowsCount > MAX_ROWS_LIMIT) {
      throw new Error(`[LIMIT_EXCEEDED] El archivo excede el límite de ${MAX_ROWS_LIMIT} filas permitidas.`);
    }

    const rowErrors = [];
    const allMappedData = {};

    for (const moduleKey of Object.keys(rawData)) {
      const rows = rawData[moduleKey];
      allMappedData[moduleKey] = [];
      const seenIdentifiers = new Set();
      const uniqueField = this.getUniqueKey(moduleKey);
      const config = registry[moduleKey];

      for (const [index, row] of rows.entries()) {
        const rowIndex = index + 2;

        try {
          const mappedRow = mappingEngine.toCamelCase(moduleKey, row, 'excel');

          if (options.autoFix && mappedRow.email) {
            const fix = await MassUploadAI.attemptAutoFix('email', { value: mappedRow.email });
            if (fix.autoFixed) {
                const excelField = config.fields.find(f => f.bd === 'email')?.excel || 'email';
                mappedRow.email = fix.corrected;
                rowErrors.push({
                   module: moduleKey,
                   row: rowIndex,
                   field: excelField,
                   error: `Autocorrección aplicada: '${fix.original}' -> '${fix.corrected}'.`,
                   suggestion: "Confianza: 100% (Regla heurística)",
                   autoFixed: true,
                   original: fix.original,
                   corrected: fix.corrected
                });
            }
          }

          allMappedData[moduleKey].push(mappedRow);

          if (uniqueField && mappedRow[uniqueField]) {
            const normalized = normalizeString(mappedRow[uniqueField]);
            if (seenIdentifiers.has(normalized)) {
                rowErrors.push({
                   module: moduleKey,
                   row: rowIndex,
                   field: uniqueField,
                   error: `Dupicado inteligente detectado: '${mappedRow[uniqueField]}'.`,
                   suggestion: "Este registro ya existe en el archivo actual."
                });
            }
            seenIdentifiers.add(normalized);
          }
          
          const errors = MassUploadValidator.validateRow(moduleKey, mappedRow, rowIndex);
          if (errors.length > 0) rowErrors.push(...errors);
        } catch (error) {
          rowErrors.push({ module: moduleKey, row: rowIndex, field: 'mapping', error: error.message });
        }
      }
    }

    const globalErrors = await MassUploadGlobalValidator.validateGlobal(allMappedData, options);
    const blockingRowErrors = rowErrors.filter(e => !e.autoFixed);
    const blockingGlobalErrors = globalErrors.filter(e => !e.autoFixed);
    
    return {
      summary: {
        total_rows: totalRowsCount,
        error_rows_count: blockingRowErrors.length + blockingGlobalErrors.length
      },
      ready_to_execute: blockingRowErrors.length === 0 && blockingGlobalErrors.length === 0,
      errors: rowErrors,
      global_errors: globalErrors,
      allMappedData: allMappedData,
      download_error_report: rowErrors.length > 0 || globalErrors.length > 0
    };
  }

  /**
   * Executes transactional persistence from an Excel file.
   */
  async execute(fileBuffer, options = { strictMode: false, skipDryRun: false, userId: null, autoFix: false }) {
    let validationResult = null;

    if (options.skipDryRun) {
      const data = MassUploadParser.parseExcel(fileBuffer);
      const mappedData = {};
      Object.keys(data).forEach(m => {
          mappedData[m] = data[m].map(r => mappingEngine.toCamelCase(m, r, 'excel'));
      });
      validationResult = { ready_to_execute: true, allMappedData: mappedData, errors: [], global_errors: [] };
    } else {
      validationResult = await this.dryRun(fileBuffer, options);
    }
    
    if (!validationResult.ready_to_execute) {
      throw new Error(`[EXECUTION_BLOCKED] No se pueden persistir los datos. Archivo inválido.`);
    }

    return await this._persist(validationResult.allMappedData, { ...options, executionFrom: 'file', originalErrors: validationResult.errors });
  }

  /**
   * NEW: Executes transactional persistence from a UI-controlled JSON dataset.
   * Respects manual edits and auto-fix decisions made in the frontend.
   */
  async executeData(allMappedData, options = { userId: null, strictMode: false }) {
      // 1. Structural Sanity Check
      if (!allMappedData || typeof allMappedData !== 'object') {
          throw new Error("[SECURITY_VIOLATION] Dataset inválido.");
      }

      // 2. Deep Validation (Last line of defense)
      const globalErrors = await MassUploadGlobalValidator.validateGlobal(allMappedData, { autoFix: false });
      const rowErrors = [];
      for (const [moduleKey, rows] of Object.entries(allMappedData)) {
          rows.forEach((row, idx) => {
              const errs = MassUploadValidator.validateRow(moduleKey, row, idx + 2);
              if (errs.length > 0) rowErrors.push(...errs);
          });
      }

      if (rowErrors.length > 0 || globalErrors.length > 0) {
          throw new Error(`[DATA_INTEGRITY] El dataset contiene errores que impiden la persistencia segura.`);
      }

      return await this._persist(allMappedData, { ...options, executionFrom: 'ui_json', originalErrors: [] });
  }

  /**
   * Internal common persistence logic.
   */
  async _persist(allMappedData, options) {
    const startTime = Date.now();
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
            
            if (options.strictMode && uniqueField && row[uniqueField]) {
                const existing = await tx[config.model].findUnique({
                    where: { [uniqueField]: String(row[uniqueField]) }
                });
                if (existing) throw new Error(`[STRICT] El registro '${row[uniqueField]}' ya existe.`);
            }

            if (moduleKey === 'unidades') {
              await tx.department.upsert({
                where: { number_towerId: { number: String(row.number), towerId: row.towerId || row.departmentTowerId } },
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

      await prisma.massUploadLog.create({
        data: {
          userId: options.userId,
          status: 'success',
          summaryJson: JSON.stringify({
            inserted_rows: insertedTotal,
            modules_processed: modulesProcessed,
            execution_time_ms: executionTimeMs,
            execution_from: options.executionFrom,
            strict_mode: options.strictMode
          }),
          errorsJson: JSON.stringify({ original_errors: options.originalErrors }),
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
        executed_from_ui: options.executionFrom === 'ui_json'
      };

    } catch (error) {
      console.error('[DATABASE_TRANSACTION_ERROR]', error);
      throw new Error(`Carga masiva abortada: ${error.message}.`);
    }
  }

  getUniqueKey(moduleKey) {
    const keyMap = {
      'personal': 'dni', 'residentes': 'dni', 'propietarios': 'dni',
      'torres': 'name', 'tipos_unidad': 'nombre', 'bancos': 'nombre',
      'afps': 'name', 'previsiones': 'name', 'correspondencia': 'folio',
      'visitas': 'folio', 'solicitud_insumos': 'folio'
    };
    return keyMap[moduleKey];
  }
}

module.exports = new MassUploadService();
