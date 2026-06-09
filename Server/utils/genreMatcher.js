/**
 * Context-aware genre matcher algorithm.
 * @param {string|string[]} bookMetadata - Raw text or array of categories.
 * @param {string|null} browsingContext - The current genre page, or null.
 * @param {string[]} allowedGenres - Master list of supported genres.
 * @returns {string} - The determined genre.
 */
export const matchGenre = (bookMetadata, browsingContext, allowedGenres) => {
  // Step 1: Normalization
  const normalizedMetadata = Array.isArray(bookMetadata)
    ? bookMetadata.join(' ').toLowerCase()
    : bookMetadata.toLowerCase();
  
  const normalizedContext = browsingContext ? browsingContext.toLowerCase() : null;

  // Step 2: The Contextual Short-Circuit (Priority 1)
  if (normalizedContext && normalizedMetadata.includes(normalizedContext)) {
    return browsingContext; // Return original casing for consistency
  }

  // Step 3: Best Match Evaluation (Priority 2)
  let bestMatch = null;
  let longestLength = -1;

  for (const genre of allowedGenres) {
    if (normalizedMetadata.includes(genre.toLowerCase())) {
      if (genre.length > longestLength) {
        longestLength = genre.length;
        bestMatch = genre;
      }
    }
  }

  // Step 4: The Final Fallback (Priority 3)
  return bestMatch || 'General';
};
