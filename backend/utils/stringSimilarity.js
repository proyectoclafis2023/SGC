/**
 * Normalizes a string by:
 * - Eliminating accents and diacritics.
 * - Converting to lowercase.
 * - Removing extra spaces from edges.
 * @param {string} value - The input text to normalize.
 * @returns {string} - The cleaned text.
 */
function normalizeString(value) {
  if (!value) return '';
  return String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD') // Decompose into base char + accent
    .replace(/[\u0300-\u036f]/g, ''); // Remove accent marks
}

/**
 * Calculates the Levenshtein distance between two strings using a matrix approach.
 * Used for heuristic fuzzy matching within the mass upload engine.
 * @param {string} a - Target string.
 * @param {string} b - Candidate string.
 * @returns {number} - The distance (number of edits required).
 */
function levenshtein(a, b) {
  const matrix = [];
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // Deletion
        matrix[i][j - 1] + 1, // Insertion
        matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1) // Substitution
      );
    }
  }
  return matrix[a.length][b.length];
}

/**
 * Finds the closest matching string from a list of candidates based on edit distance.
 * Implements a dynamic threshold based on string length to avoid false positives.
 * @param {string} value - The input text.
 * @param {string[]} candidates - Array of possible strings to compare against.
 * @returns {string|null} - The best match or null if no reasonable match found.
 */
function findClosestMatch(value, candidates) {
  if (!value || !candidates || candidates.length === 0) return null;
  const normalizedValue = normalizeString(value);
  
  let bestMatch = null;
  let minDistance = Infinity;
  
  for (const candidate of candidates) {
    const normalizedCandidate = normalizeString(candidate);
    const distance = levenshtein(normalizedValue, normalizedCandidate);
    
    if (distance < minDistance) {
      minDistance = distance;
      bestMatch = candidate;
    }
  }
  
  // Heuristic Threshold: at most 1/3 of the length can be different
  const threshold = Math.max(1, Math.floor(value.length / 3));
  return minDistance <= threshold ? bestMatch : null;
}

/**
 * Calculates a similarity ratio between 0 and 1.
 * 1 = identical, 0 = completely different.
 * @param {string} a - First string.
 * @param {string} b - Second string.
 * @returns {number} - Confidence level.
 */
function calculateSimilarityScore(a, b) {
  const normalizedA = normalizeString(a);
  const normalizedB = normalizeString(b);
  if (normalizedA === normalizedB) return 1.0;
  
  const distance = levenshtein(normalizedA, normalizedB);
  const maxLen = Math.max(normalizedA.length, normalizedB.length);
  return (maxLen - distance) / maxLen;
}

module.exports = {
  normalizeString,
  levenshtein,
  findClosestMatch,
  calculateSimilarityScore
};
