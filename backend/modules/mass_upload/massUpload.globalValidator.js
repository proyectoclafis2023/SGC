const registry = require('../../core/mapping/registry');
const MassUploadAI = require('./massUpload.ai');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class MassUploadGlobalValidator {
  /**
   * Performs global consistency checks across all sheets and against the database.
   * @param {Object} allMappedData - Object with mapped rows.
   * @param {Object} options - { autoFix: boolean }.
   * @returns {Promise<Array>} - Array of global error objects.
   */
  async validateGlobal(allMappedData, options = { autoFix: false }) {
    const globalErrors = [];
    
    // Create a map of IDs present in the current upload for quick lookup
    const localIds = {};
    Object.keys(allMappedData).forEach(module => {
      localIds[module] = new Set(allMappedData[module].map(row => row.id).filter(Boolean));
    });

    for (const [module, rows] of Object.entries(allMappedData)) {
      const config = registry[module];
      if (!config || !config.relations) continue;

      for (const [rowIndex, row] of rows.entries()) {
        const displayRowIndex = rowIndex + 2;

        // Check each relation defined in the registry
        for (const [relName, targetModule] of Object.entries(config.relations)) {
          const bdField = `${relName}Id`;
          const fieldConfig = config.fields.find(f => f.bd === bdField);
          
          if (!fieldConfig) continue;

          const targetId = row[bdField];
          if (!targetId) continue; 

          // 1. Check if ID exists in the current upload
          const existsLocally = localIds[targetModule] && localIds[targetModule].has(targetId);
          if (existsLocally) continue;

          // 2. Check if ID exists in the database
          const targetConfig = registry[targetModule];
          if (!targetConfig) continue;

          try {
            const existsInDb = await prisma[targetConfig.model].findUnique({
              where: { id: targetId }
            });

            if (!existsInDb) {
              // IA Autocorrect Phase (Phase 3)
              const suggestField = ['name', 'nombre', 'names', 'dni', 'folio'].find(f => 
                  targetConfig.fields.some(cf => cf.bd === f)
              ) || 'id';

              if (options.autoFix) {
                  const fix = await MassUploadAI.attemptAutoFix('fk', {
                      value: targetId,
                      model: targetConfig.model,
                      field: suggestField,
                      prisma: prisma
                  });

                  if (fix.autoFixed) {
                      row[bdField] = fix.corrected;
                      globalErrors.push({
                        module,
                        row: displayRowIndex,
                        field: fieldConfig.excel,
                        error: `Autocorrección aplicada: '${fix.original}' -> '${fix.corrected}'.`,
                        type: "relation",
                        autoFixed: true,
                        original: fix.original,
                        corrected: fix.corrected,
                        confidence: fix.confidence
                      });
                      continue;
                  }
              }

              const suggestion = await MassUploadAI.getSuggestion('fk', {
                  value: targetId,
                  model: targetConfig.model,
                  field: suggestField,
                  prisma: prisma
              });

              globalErrors.push({
                module,
                row: displayRowIndex,
                field: fieldConfig.excel,
                error: `Referencia inexistente: '${targetId}' no encontrado en '${targetModule}' (Local o DB).`,
                type: "relation",
                suggestion: suggestion
              });
            }
          } catch (error) {
            // If the model or ID is not queryable this way, we log it
            console.error(`Error checking DB for ${targetModule}:${targetId}`, error);
          }
        }
      }
    }

    return globalErrors;
  }
}

module.exports = new MassUploadGlobalValidator();
