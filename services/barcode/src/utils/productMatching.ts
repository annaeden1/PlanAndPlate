export const normalizeText = (value: string | undefined): string =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const splitBrands = (brands: string | undefined): string[] =>
  String(brands || '')
    .split(/[,;|]/)
    .map((brand) => normalizeText(brand))
    .filter((brand) => brand.length > 0);

export const tokenSimilarity = (
  sourceText: string,
  targetText: string,
): number => {
  if (!sourceText || !targetText) {
    return 0;
  }

  if (sourceText === targetText) {
    return 1;
  }

  if (sourceText.includes(targetText) || targetText.includes(sourceText)) {
    return 0.95;
  }

  const sourceTokens = new Set(sourceText.split(' ').filter(Boolean));
  const targetTokens = new Set(targetText.split(' ').filter(Boolean));

  if (!sourceTokens.size || !targetTokens.size) {
    return 0;
  }

  let intersection = 0;
  sourceTokens.forEach((token) => {
    if (targetTokens.has(token)) {
      intersection += 1;
    }
  });

  const union = new Set([...sourceTokens, ...targetTokens]).size;
  return union ? intersection / union : 0;
};

export const getBrandSimilarity = (
  candidateBrands: string | undefined,
  targetBrand: string,
): number => {
  if (!targetBrand) {
    return 0;
  }

  const normalizedCandidateBrands = splitBrands(candidateBrands);
  if (!normalizedCandidateBrands.length) {
    return 0;
  }

  if (normalizedCandidateBrands.includes(targetBrand)) {
    return 1;
  }

  let bestScore = 0;
  for (const candidateBrand of normalizedCandidateBrands) {
    const score = tokenSimilarity(candidateBrand, targetBrand);
    if (score > bestScore) {
      bestScore = score;
    }
  }

  return bestScore;
};
