const { normalizeString, findClosestMatch } = require('../../utils/stringSimilarity');

class MassUploadAI {
  /**
   * Main entry point for generating intelligent suggestions based on error context.
   * Implements Phase 2 Heuristics: Normalization, Similarity and Contextual rules.
   * @param {string} type - Error type ('email', 'fk', 'duplicate').
   * @param {Object} context - Data required for the heuristic (value, model, field, prisma, candidates).
   * @returns {Promise<string|null>} - Formatted suggestion.
   */
  async getSuggestion(type, context = {}) {
    const { value, model, field, prisma, candidates } = context;

    switch (type) {
      case 'email':
        const fixedEmail = this.fixEmail(value);
        return fixedEmail ? `Quizás quiso decir: ${fixedEmail}` : "Revisar formato (ej: usuario@dominio.com)";

      case 'fk':
        if (!value || !model || !field || !prisma) return "Verificar referencia en el maestro correspondiente.";
        return await this.suggestFK(value, model, field, prisma);

      case 'duplicate':
        return "Este registro parece duplicado. Considera unificarlo con el existente.";

      default:
        return "Verificar coherencia de datos con el manual de carga.";
    }
  }

  /**
   * Fixes common email typos using heuristic rules.
   * @param {string} email - The input email.
   * @returns {string|null} - Fixed email or null.
   */
  fixEmail(email) {
    if (!email) return null;
    let fixed = String(email).trim().toLowerCase();
    
    // Phase 2 Email Heuristics
    fixed = fixed.replace(/gmail\.con$/i, 'gmail.com');
    fixed = fixed.replace(/hotmail\.con$/i, 'hotmail.com');
    fixed = fixed.replace(/hotnail/i, 'hotmail');
    fixed = fixed.replace(/gamil/i, 'gmail');
    fixed = fixed.replace(/outlook\.es\.com/i, 'outlook.com');
    
    return fixed !== email.trim().toLowerCase() ? fixed : null;
  }

  /**
   * Generates a fuzzy suggestion for an invalid foreign key lookup.
   * @param {string} value - Misspelled value.
   * @param {string} model - Prisma model name.
   * @param {string} field - Field name to compare against.
   * @param {object} prisma - PrismaClient instance.
   * @returns {Promise<string|null>} - Formatted suggestion or null.
   */
  async suggestFK(value, model, field, prisma) {
    try {
      // Find potential candidates (names or common identifiers)
      const records = await prisma[model].findMany({
        select: { [field]: true },
        take: 200 
      });
      
      const names = [...new Set(records.map(r => r[field]).filter(Boolean))];
      const match = findClosestMatch(value, names);
      
      return match ? `Quizás quiso decir: ${match}` : "Verifica si el registro existe en el módulo maestro.";
    } catch (e) {
      return null;
    }
  }

  /**
   * Intelligent duplicate detection via normalization.
   */
  isDuplicateHeuristic(a, b) {
      if (!a || !b) return false;
      return normalizeString(a) === normalizeString(b);
  }
}

module.exports = new MassUploadAI();
