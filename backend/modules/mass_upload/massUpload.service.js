const MassUploadParser = require('./massUpload.parser');
const MassUploadValidator = require('./massUpload.validator');
const MassUploadGlobalValidator = require('./massUpload.globalValidator');
const MassUploadAI = require('./massUpload.ai');
const registry = require('../../core/mapping/registry');
const mappingEngine = require('../../core/mapping/engine');
const { generateDatasetHash } = require('../../utils/hashDataset');
const { normalizeString } = require('../../utils/stringSimilarity');
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MAX_ROWS_LIMIT = parseInt(process.env.MASS_UPLOAD_MAX_ROWS) || 1000;

const { MASTER_MODULES } = require('../../config/masterModules');

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
    let autoFixedCount = 0;

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
                autoFixedCount++;
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

    // AI-Ready Analytics (Optional/Future pre-cursor)
    const analytics = this.calculateAnalytics([...rowErrors, ...globalErrors]);

    const blockingRowErrors = rowErrors.filter(e => !e.autoFixed);
    const blockingGlobalErrors = globalErrors.filter(e => !e.autoFixed);
    
    const hash = generateDatasetHash(allMappedData);

    return {
      summary: {
        total_rows: totalRowsCount,
        error_rows_count: blockingRowErrors.length + blockingGlobalErrors.length,
        auto_fixed_count: autoFixedCount,
        dataset_hash: hash
      },
      ready_to_execute: blockingRowErrors.length === 0 && blockingGlobalErrors.length === 0,
      errors: rowErrors,
      global_errors: globalErrors,
      allMappedData: allMappedData,
      analytics_summary: analytics,
      download_error_report: rowErrors.length > 0 || globalErrors.length > 0
    };
  }

  /**
   * Executes transactional persistence from an Excel file.
   */
  async execute(fileBuffer, options = { strictMode: false, skipDryRun: false, userId: null, autoFix: false }) {
    let validationResult = await this.dryRun(fileBuffer, options);
    
    if (!validationResult.ready_to_execute && !options.skipDryRun) {
      throw new Error(`[EXECUTION_BLOCKED] Datos inválidos para persistencia.`);
    }

    // Deduplication check
    const existingLog = await prisma.massUploadLog.findFirst({
        where: { datasetHash: validationResult.summary.dataset_hash, status: 'success' }
    });
    if (existingLog && !options.forceDuplicate) {
        throw new Error(`[DUPLICATE_DATASET] Este dataset ya ha sido cargado exitosamente previamente (Hash: ${validationResult.summary.dataset_hash}).`);
    }

    return await this._persist(validationResult.allMappedData, { 
        ...options, 
        executionFrom: 'file', 
        originalErrors: validationResult.errors,
        hash: validationResult.summary.dataset_hash,
        analytics: validationResult.analytics_summary,
        autoFixedCount: validationResult.summary.auto_fixed_count
    });
  }

  /**
   * Executes transactional persistence from a UI-controlled JSON dataset.
   */
  async executeData(allMappedData, options = { userId: null, strictMode: false }) {
      const hash = generateDatasetHash(allMappedData);

      // Deduplication check
      const existingLog = await prisma.massUploadLog.findFirst({
          where: { datasetHash: hash, status: 'success' }
      });
      if (existingLog && !options.forceDuplicate) {
          throw new Error(`[DUPLICATE_DATASET] El dataset enviado ya fue persistido (Hash: ${hash}).`);
      }

      const globalErrors = await MassUploadGlobalValidator.validateGlobal(allMappedData, { autoFix: false });
      const rowErrors = [];
      let autoFixedInDataset = 0;

      for (const [moduleKey, rows] of Object.entries(allMappedData)) {
          rows.forEach((row, idx) => {
              const errs = MassUploadValidator.validateRow(moduleKey, row, idx + 2);
              if (errs.length > 0) rowErrors.push(...errs);
              // Counting what was already "autoFixed" if the flag exists
              if (row.autoFixed) autoFixedInDataset++;
          });
      }

      if (rowErrors.length > 0 || globalErrors.length > 0) {
          throw new Error(`[DATA_INTEGRITY] El dataset modificado contiene errores.`);
      }

      const analytics = this.calculateAnalytics([...rowErrors, ...globalErrors]);

      return await this._persist(allMappedData, { 
          ...options, 
          executionFrom: 'ui_json', 
          originalErrors: [], 
          hash,
          analytics,
          autoFixedCount: autoFixedInDataset
      });
  }

  /**
   * Analytics engine for dataset errors (Phase Analytics)
   */
  calculateAnalytics(errors) {
      if (!errors || errors.length === 0) return {};
      
      const moduleStats = {};
      const fieldStats = {};

      errors.forEach(e => {
          moduleStats[e.module] = (moduleStats[e.module] || 0) + 1;
          fieldStats[e.field] = (fieldStats[e.field] || 0) + 1;
      });

      return {
          total_conflicts: errors.length,
          by_module: moduleStats,
          by_field: fieldStats,
          critical_field: Object.keys(fieldStats).reduce((a, b) => fieldStats[a] > fieldStats[b] ? a : b, '')
      };
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
                const existing = await tx[config.model].findUnique({ where: { [uniqueField]: String(row[uniqueField]) } });
                if (existing) throw new Error(`[STRICT] Registro '${row[uniqueField]}' existe.`);
            }

            if (moduleKey === 'unidades') {
              await tx.department.upsert({
                where: { number_towerId: { number: String(row.number), towerId: row.towerId || row.departmentTowerId } },
                update: row, create: row
              });
            } else if (uniqueField && row[uniqueField]) {
              await tx[config.model].upsert({
                where: { [uniqueField]: String(row[uniqueField]) },
                update: row, create: row
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
            metrics: {
                total_inserted: insertedTotal,
                total_auto_fixed: options.autoFixedCount || 0,
                total_manual_edits: options.executionFrom === 'ui_json' ? 'determined_by_ui' : 0,
                total_rows: insertedTotal
            },
            analytics: options.analytics,
            execution_from: options.executionFrom,
            execution_time_ms: executionTimeMs
          }),
          errorsJson: JSON.stringify({ original_errors: options.originalErrors }),
          executedDataJson: JSON.stringify(allMappedData), // [SNAPSHOT CRÍTICO]
          datasetHash: options.hash,
          executionTimeMs,
          modulesProcessed: modulesProcessed.join(','),
          isDryRun: false
        }
      });

      return {
        status: "success",
        inserted_rows: insertedTotal,
        dataset_hash: options.hash,
        analytics_summary: options.analytics,
        execution_time_ms: executionTimeMs
      };

    } catch (error) {
      console.error('[DATABASE_TRANSACTION_ERROR]', error);
      throw new Error(`Carga masiva abortada: ${error.message}.`);
    }
  }

  /**
   * Exports a single module to an Excel buffer.
   * Uses registry to map field names to human-readable columns.
   */
  async exportModule(moduleKey) {
    if (!MASTER_MODULES.includes(moduleKey)) {
        throw new Error(`[SECURITY] El módulo '${moduleKey}' no es un maestro exportable o está restringido.`);
    }

    const config = registry[moduleKey];
    if (!config) throw new Error(`[EXPORT_ERROR] Módulo '${moduleKey}' no registrado.`);

    const data = await prisma[config.model].findMany({
        where: { isArchived: false }
    });

    const transformed = data.map(row => {
        const excelRow = {};
        config.fields.forEach(f => {
            if (row[f.bd] !== undefined) {
                excelRow[f.excel] = row[f.bd];
            }
        });
        return excelRow;
    });

    const ws = XLSX.utils.json_to_sheet(transformed);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, moduleKey.toUpperCase());

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Exports all master/relevant modules into a single multi-sheet Excel.
   */
  async exportAll() {
    const wb = XLSX.utils.book_new();

    // Export in logical order (Infrastructure -> People -> Base)
    // We sort according to common dependency logic
    const sortedMasters = [...MASTER_MODULES].sort((a, b) => {
        const order = {
            'torres': 1, 'tipos_unidad': 2, 'unidades': 3, 'estacionamientos': 4, 'espacios': 5,
            'propietarios': 6, 'residentes': 7, 'personal': 8,
            'afps': 9, 'previsiones': 10, 'bancos': 11, 'articulos_personal': 12, 'maestro_categorias_articulos': 13, 'emergencias': 14
        };
        return (order[a] || 99) - (order[b] || 99);
    });

    for (const moduleKey of sortedMasters) {
        const config = registry[moduleKey];
        if (!config) continue;

        const data = await prisma[config.model].findMany({ where: { isArchived: false } });
        const transformed = data.map(row => {
            const excelRow = {};
            config.fields.forEach(f => {
                if (row[f.bd] !== undefined) excelRow[f.excel] = row[f.bd];
            });
            return excelRow;
        });

        const ws = XLSX.utils.json_to_sheet(transformed);
        XLSX.utils.book_append_sheet(wb, ws, moduleKey.toUpperCase());
    }

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
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
