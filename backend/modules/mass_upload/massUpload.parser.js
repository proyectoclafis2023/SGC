const xlsx = require('xlsx');

class MassUploadParser {
  /**
   * Parses an Excel file buffer and returns all sheets as a JSON object.
   * @param {Buffer} buffer - The file buffer.
   * @returns {Object} - An object where keys are sheet names and values are arrays of rows.
   */
  static parseExcel(buffer) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const result = {};

    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      // Convert sheet to JSON, including header
      const rows = xlsx.utils.sheet_to_json(sheet, {
        defval: null, // Fill empty cells with null
        raw: false    // Return values as strings or numbers as appropriate but without excel-specific garbage
      });
      result[sheetName] = rows;
    });

    return result;
  }
}

module.exports = MassUploadParser;
