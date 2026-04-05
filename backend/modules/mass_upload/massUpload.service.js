const MassUploadParser = require('./massUpload.parser');
const MassUploadValidator = require('./massUpload.validator');
const MassUploadGlobalValidator = require('./massUpload.globalValidator');
const mappingEngine = require('../../core/mapping/engine');
const registry = require('../../core/mapping/registry');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
        totalRowsCount++;

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
   * Executes transactional persistence after a successful dry run.
   * @param {Buffer} fileBuffer - The Excel file buffer.
   * @returns {Promise<Object>} - Summary of the execution.
   */
  async execute(fileBuffer) {
    // 1. Re-validate to ensure nothing changed or bypassed
    const validation = await this.dryRun(fileBuffer);
    
    if (!validation.ready_to_execute) {
      throw new Error(`[EXECUTION_BLOCKED] No se pueden persistir los datos. Se encontraron ${validation.errors.length + validation.global_errors.length} errores.`);
    }

    const allMappedData = validation.allMappedData;
    const modulesProcessed = [];
    let insertedTotal = 0;

    // Ordered sequence to handle foreign key constraints correctly
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
            
            // Logic to handle unique constraints and avoid duplicates
            if (moduleKey === 'unidades') {
              // Unidades have a composite unique key in Prisma (number, towerId)
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
              // Fallback to simple create
              await tx[config.model].create({ data: row });
            }
            insertedTotal++;
          }
        }
      }, { timeout: 60000 });

      return {
        status: "success",
        inserted_rows: insertedTotal,
        modules_processed: modulesProcessed
      };

    } catch (error) {
      console.error('[DATABASE_TRANSACTION_ERROR]', error);
      throw new Error(`Error en persistencia: ${error.message}. Se realizó rollback total de la operación.`);
    }
  }

  /**
   * Helper to identify the unique key for each module to avoid duplicates.
   */
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
