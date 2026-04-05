const crypto = require('crypto');

/**
 * Generates a stable SHA-256 hash for a dataset.
 * Uses consistent sorting to ensure same data results in same hash.
 * @param {Object} dataset - The mapped dataset (allMappedData).
 * @returns {string} - HEX SHA-256 hash.
 */
function generateDatasetHash(dataset) {
  if (!dataset) return '';

  // Stable stringify: sort keys of modules and sort rows by their stringified content if necessary
  // For most SGC cases, sorting modules is enough as they are often processed in order
  const sortedModules = Object.keys(dataset).sort();
  const normalizedData = {};

  sortedModules.forEach(mod => {
    // Sort rows by a stable unique field if exists, otherwise by string representation
    // We want to avoid hash changes just because row order changed in Excel but data is identical
    normalizedData[mod] = dataset[mod].map(row => {
        const sortedRow = {};
        Object.keys(row).sort().forEach(k => {
            sortedRow[k] = row[k];
        });
        return sortedRow;
    });
  });

  const stableStr = JSON.stringify(normalizedData);
  return crypto.createHash('sha256').update(stableStr).digest('hex');
}

module.exports = {
  generateDatasetHash
};
