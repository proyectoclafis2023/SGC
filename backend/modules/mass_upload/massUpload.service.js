const MassUploadParser = require('./massUpload.parser');

class MassUploadService {
  /**
   * Processes a file for a dry run.
   * @param {Buffer} fileBuffer - The file buffer.
   * @returns {Object} - A summary of the sheets and total rows.
   */
  async dryRun(fileBuffer) {
    const data = MassUploadParser.parseExcel(fileBuffer);
    
    const sheetNames = Object.keys(data);
    let totalRows = 0;
    
    sheetNames.forEach(name => {
      totalRows += data[name].length;
    });

    return {
      sheets_detected: sheetNames,
      total_rows: totalRows,
      // Note: Full data is not returned yet to avoid large payloads,
      // only the summary is requested for this phase.
    };
  }
}

module.exports = new MassUploadService();
