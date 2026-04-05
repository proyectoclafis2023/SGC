const MassUploadParser = require('./massUpload.parser');
const MassUploadValidator = require('./massUpload.validator');
const mappingEngine = require('../../core/mapping/engine');

class MassUploadService {
  /**
   * Processes an Excel file for a dry run.
   * Performs mapping, validation, and logs all errors found.
   * @param {Buffer} fileBuffer - The Excel file buffer.
   * @returns {Object} - A summary of the processing and the detailed errors log.
   */
  async dryRun(fileBuffer) {
    const data = MassUploadParser.parseExcel(fileBuffer);
    
    let totalRows = 0;
    let validRowsTotal = 0;
    let errorRowsTotal = 0;
    const allErrors = [];

    Object.keys(data).forEach(module => {
      const rows = data[module];
      let moduleValidRows = 0;
      let moduleErrorRows = 0;

      rows.forEach((row, index) => {
        const rowIndex = index + 2; // Excel-like index (1-indexed + header)
        totalRows++;

        try {
          // 1. Mapping mandatory (excel -> camelCase)
          const mappedRow = mappingEngine.toCamelCase(module, row, 'excel');
          
          // 2. Validate data
          const errors = MassUploadValidator.validateRow(module, mappedRow, rowIndex);
          
          if (errors.length > 0) {
            moduleErrorRows++;
            allErrors.push(...errors);
          } else {
            moduleValidRows++;
          }
        } catch (error) {
          // If mapping fails (e.g. format error in engine), capture it as error row
          moduleErrorRows++;
          allErrors.push({
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

    return {
      summary: {
        total_rows: totalRows,
        valid_rows: validRowsTotal,
        error_rows: errorRowsTotal
      },
      errors: allErrors
    };
  }
}

module.exports = new MassUploadService();
