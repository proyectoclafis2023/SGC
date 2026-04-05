const { normalizeString, findClosestMatch, calculateSimilarityScore } = require('../../utils/stringSimilarity');

class MassUploadAI {
  /**
   * Threshold for safe autonomous corrections.
   * If similarity score is above this, we can auto-fix the field.
   */
  AUTOCORRECT_THRESHOLD = 0.85;

  /**
   * Main entry point for intelligent suggestions.
   */
  async getSuggestion(type, context = {}) {
    const { value, model, field, prisma } = context;

    switch (type) {
      case 'email':
        const fixedEmail = this.fixEmail(value);
        return fixedEmail ? `Quizás quiso decir: ${fixedEmail}` : "Revisar formato (ej: usuario@dominio.com)";

      case 'fk':
        if (!value || !model || !field || !prisma) return "Verificar referencia.";
        return await this.suggestFK(value, model, field, prisma);

      default:
        return "Verificar coherencia de datos.";
    }
  }

  /**
   * NEW Phase 3 IA: Autonomous error correction.
   * Logic for deciding if a value should be corrected without user intervention.
   * @param {string} type - Error type ('email', 'fk').
   * @param {Object} context - Data required for the correction logic.
   * @returns {Promise<Object>} - { autoFixed: boolean, corrected: string, confidence: number }
   */
  async attemptAutoFix(type, context = {}) {
    const { value, model, field, prisma } = context;
    if (!value) return { autoFixed: false };

    if (type === 'email') {
        const fixed = this.fixEmail(value);
        if (fixed) {
            return { autoFixed: true, original: value, corrected: fixed, confidence: 1.0 };
        }
    }

    if (type === 'fk' && model && field && prisma) {
        try {
            const records = await prisma[model].findMany({
                select: { [field]: true },
                take: 200
            });
            const names = [...new Set(records.map(r => r[field]).filter(Boolean))];
            
            let bestMatch = null;
            let highestConfidence = 0;

            for (const name of names) {
                const conf = calculateSimilarityScore(value, name);
                if (conf > highestConfidence) {
                    highestConfidence = conf;
                    bestMatch = name;
                }
            }

            if (highestConfidence > this.AUTOCORRECT_THRESHOLD) {
                return { autoFixed: true, original: value, corrected: bestMatch, confidence: highestConfidence };
            }
        } catch (e) {
            return { autoFixed: false };
        }
    }

    return { autoFixed: false };
  }

  /**
   * Fixes common email typos.
   */
  fixEmail(email) {
    if (!email) return null;
    let fixed = String(email).trim().toLowerCase();
    
    // TYPOS: Rule-based (100% confidence)
    fixed = fixed.replace(/gmail\.con$/i, 'gmail.com');
    fixed = fixed.replace(/hotmail\.con$/i, 'hotmail.com');
    fixed = fixed.replace(/hotnail/i, 'hotmail');
    fixed = fixed.replace(/gamil/i, 'gmail');
    fixed = fixed.replace(/outlook\.es\.com/i, 'outlook.com');
    
    return fixed !== email.trim().toLowerCase() ? fixed : null;
  }

  /**
   * Generates a fuzzy suggestion for an invalid foreign key lookup.
   */
  async suggestFK(value, model, field, prisma) {
    try {
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
