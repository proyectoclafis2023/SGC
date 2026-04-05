const registry = require('../../core/mapping/registry');
const MassUploadAI = require('./massUpload.ai');

class MassUploadValidator {
  /**
   * Validates a mapped row against the registry rules and basic types.
   * Enhanced with Phase 2 IA Heuristics for suggestions.
   * @param {string} module - The entity key in registry.
   * @param {Object} row - The mapped row (camelCase).
   * @param {number} rowIndex - The row index for logging.
   * @returns {Array} - Array of error objects with intelligent suggestions.
   */
  static validateRow(module, row, rowIndex) {
    const config = registry[module];
    const errors = [];

    if (!config) {
      errors.push({
        module,
        row: rowIndex,
        field: 'system',
        error: `Módulo '${module}' no encontrado en el registro.`
      });
      return errors;
    }

    // Generic validation based on registry fields
    config.fields.forEach(field => {
      const value = row[field.bd];
      
      // 1. Valores vacíos en campos que no sean opcionales (id, createdAt, etc suelen ser automáticos pero en carga masiva podemos chequear coherencia)
      // For now, let's assume any field in registry that isn't 'isArchived' or 'id' might be relevant
      // We can also check specific naming conventions if needed.
      
      // Placeholder for specific non-nullable fields if we had them in registry.
      // Since they are not explicitly marked in registry, we'll check common ones.
      const criticalFields = ['names', 'lastNames', 'dni', 'email', 'phone', 'number', 'name', 'folio'];
      
      if (criticalFields.includes(field.bd) && (value === null || value === undefined || value === '')) {
        errors.push({
          module,
          row: rowIndex,
          field: field.excel,
          error: `El campo '${field.excel}' no puede estar vacío.`,
          suggestion: `Completar dato obligatorio para '${module}'.`
        });
      }

      // Email Fix Heuristic
      if (field.bd === 'email' && value) {
        const emailFix = MassUploadAI.fixEmail(value);
        if (emailFix) {
          errors.push({
            module,
            row: rowIndex,
            field: field.excel,
            error: `Formato de correo sospechoso: '${value}'.`,
            suggestion: `Quizás quiso decir: ${emailFix}`
          });
        }
      }

      // 2. Tipos básicos (Placeholder)
      if (value !== null && value !== undefined) {
        if (field.bd.toLowerCase().includes('count') || field.bd.toLowerCase().includes('amount')) {
          if (isNaN(value)) {
            errors.push({
              module,
              row: rowIndex,
              field: field.excel,
              error: `El campo '${field.excel}' debe ser un número.`,
              suggestion: "Verificar decimales (usar punto para evitar ambigüedades)."
            });
          }
        }
      }
    });

    return errors;
  }
}

module.exports = MassUploadValidator;
