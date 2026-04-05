const MassUploadParser = require('./massUpload.parser');
const MassUploadValidator = require('./massUpload.validator');
const MassUploadGlobalValidator = require('./massUpload.globalValidator');
const mappingEngine = require('../../core/mapping/engine');

class MassUploadService {
  /**
   * Processes an Excel file for a dry run.
   * Performs mapping, per-row validation, and global consistency checks across all sheets.
   * @param {Buffer} fileBuffer - The Excel file buffer.
   * @returns {Object} - Processing summary, row-level errors, global errors, and final execution readiness.
   */
  async dryRun(fileBuffer) {
    const rawData = MassUploadParser.parseExcel(fileBuffer);
    
    let totalRowsCount = 0;
    let validRowsTotal = 0;
    let errorRowsTotal = 0;
    const rowErrors = [];
    const allMappedData = {};

    // 1. Phase: Map and Per-Row Validate
    Object.keys(rawData).forEach(module => {
      const rows = rawData[module];
      allMappedData[module] = [];
      let moduleValidRows = 0;
      let moduleErrorRows = 0;

      rows.forEach((row, index) => {
        const rowIndex = index + 2; // Excel row reference (1-indexed + header)
        totalRowsCount++;

        try {
          // A. Mapping mandatory (excel -> camelCase)
          const mappedRow = mappingEngine.toCamelCase(module, row, 'excel');
          allMappedData[module].push(mappedRow);
          
          // B. Validate data per row
          const errors = MassUploadValidator.validateRow(module, mappedRow, rowIndex);
          
          if (errors.length > 0) {
            moduleErrorRows++;
            rowErrors.push(...errors);
          } else {
            moduleValidRows++;
          }
        } catch (error) {
          moduleErrorRows++;
          rowErrors.push({
            module,
            row: rowIndex,
            field: 'mapping',
            error: error.message
          });
        }
      });

      validRowsTotal += moduleValidRows;
      errorRowsTotal += moduleErrorRows;
    });

    // 2. Phase: Global Consistency Check (Relations, Orphans, Multi-sheet check)
    const globalErrors = await MassUploadGlobalValidator.validateGlobal(allMappedData);

    // 3. Status and Readiness
    // Any error (row-level or global) blocks the final execution
    const readyToExecute = rowErrors.length === 0 && globalErrors.length === 0;

    return {
      summary: {
        total_rows: totalRowsCount,
        valid_rows: validRowsTotal,
        error_rows: errorRowsTotal,
        global_errors_count: globalErrors.length
      },
      ready_to_execute: readyToExecute,
      errors: rowErrors,       // Mantiene el formato esperado para errores por fila
      global_errors: globalErrors
    };
  }
}

module.exports = new MassUploadService();
