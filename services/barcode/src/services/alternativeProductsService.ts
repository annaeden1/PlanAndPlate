import { AIService } from './ai.service';
import { searchProducts } from './openFoodFactsService';
import { type ProductNutrition } from '../utils/types/product';
import {
  type PreferenceMatch,
  type UserPreferences,
} from '../utils/types/preferences';
import {
  type ProductAlternative,
  type SuggestedAlternative,
} from '../utils/types/alternatives';
import {
  normalizeText,
  tokenSimilarity,
  getBrandSimilarity,
} from '../utils/productMatching';

const aiService = new AIService();

const formatCountryName = (value: string): string => {
  const countryValue = value.includes(':') ? value.split(':')[1] : value;
  const normalizedCountry = countryValue.replace(/[-_]/g, ' ').trim();

  if (!normalizedCountry) {
    return '';
  }

  return normalizedCountry
    .split(' ')
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
};

const getProductCountries = (product: ProductNutrition): string[] => {
  const countriesFromTags = (product.countries_tags || [])
    .map((country) => formatCountryName(country))
    .filter((country) => country.length > 0);

  const countriesFromText = String(product.countries || '')
    .split(',')
    .map((country) => formatCountryName(country))
    .filter((country) => country.length > 0);

  return Array.from(new Set([...countriesFromTags, ...countriesFromText]));
};

const buildSearchQuery = (suggestion: SuggestedAlternative): string => {
  const brand = suggestion.brand.trim();
  const productName = suggestion.productName.trim();

  if (!brand) {
    return productName;
  }

  const normalizedBrand = normalizeText(brand);
  const normalizedProductName = normalizeText(productName);

  if (normalizedBrand && normalizedProductName.startsWith(normalizedBrand)) {
    return productName;
  }

  return `${brand} ${productName}`.trim();
};

const generateSearchQueries = (suggestion: SuggestedAlternative): string[] => {
  const baseQuery = buildSearchQuery(suggestion);
  const productName = suggestion.productName.trim();

  const queries = [baseQuery, productName];

  return Array.from(new Set(queries.filter((query) => query.length > 0)));
};

const removeDuplicateProducts = (
  candidates: ProductNutrition[],
): ProductNutrition[] => {
  const seenProductKeys = new Set<string>();

  return candidates.filter((candidate) => {
    const productKey = `${normalizeText(candidate.product_name)}|${normalizeText(candidate.brands)}`;
    if (!productKey || seenProductKeys.has(productKey)) {
      return false;
    }

    seenProductKeys.add(productKey);
    return true;
  });
};

const getBestOpenFoodFactsMatch = (
  candidates: ProductNutrition[],
  suggestion: SuggestedAlternative,
): { candidate: ProductNutrition | null; score: number } => {
  if (!candidates.length) {
    return { candidate: null, score: 0 };
  }

  const targetBrand = normalizeText(suggestion.brand);
  const targetName = normalizeText(suggestion.productName);

  let bestCandidate: ProductNutrition | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const candidateName = normalizeText(candidate.product_name);
    const nameScore = tokenSimilarity(candidateName, targetName);
    const brandScore = getBrandSimilarity(candidate.brands, targetBrand);
    const exactNameBoost = candidateName === targetName ? 0.1 : 0;
    const score = nameScore * 0.7 + brandScore * 0.3 + exactNameBoost;

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  }

  return {
    candidate: bestScore >= 0.35 ? bestCandidate : null,
    score: bestScore,
  };
};

const findVerifiedAlternative = async (
  suggestion: SuggestedAlternative,
): Promise<ProductNutrition | null> => {
  const queries = generateSearchQueries(suggestion);
  let mergedCandidates: ProductNutrition[] = [];
  let bestMatch: ProductNutrition | null = null;
  let bestScore = 0;

  for (const query of queries) {
    const queryCandidates = await searchProducts(query);
    mergedCandidates = removeDuplicateProducts([
      ...mergedCandidates,
      ...queryCandidates,
    ]);

    const scored = getBestOpenFoodFactsMatch(mergedCandidates, suggestion);
    if (scored.score > bestScore) {
      bestScore = scored.score;
      bestMatch = scored.candidate;
    }

    // High confidence match: stop early to avoid extra requests.
    if (bestScore >= 0.85 && bestMatch) {
      break;
    }
  }

  return bestMatch;
};

const getFailedPreferences = (matches: PreferenceMatch[]): string[] =>
  matches
    .filter((match) => match.status === 'mismatch')
    .map((match) => `${match.label} failed`);

export const generateAlternativeSuggestions = async (
  product: ProductNutrition,
  userPreferences: UserPreferences,
  preferenceMatches: PreferenceMatch[],
): Promise<ProductAlternative[]> => {
  const validationIssues = getFailedPreferences(preferenceMatches);

  if (!validationIssues.length) {
    return [];
  }

  const dietPreferences = userPreferences.diet || [];
  const allergies = userPreferences.allergies || [];
  const healthGoals = userPreferences.healthGoal
    ? [userPreferences.healthGoal]
    : [];

  const aiSuggestions = await aiService.generateAlternativeProducts({
    productName: product.product_name || '',
    brand: product.brands || '',
    originalProductCountries: getProductCountries(product),
    userPreferences: dietPreferences,
    userAllergies: allergies,
    userHealthGoals: healthGoals,
    validationIssues,
  });

  if (!aiSuggestions.length) {
    return [];
  }

  const verificationResults = await Promise.all(
    aiSuggestions.map(async (suggestion) => {
      const bestMatch = await findVerifiedAlternative(suggestion);

      if (bestMatch) {
        return {
          productName: bestMatch.product_name || suggestion.productName,
          brand: bestMatch.brands || suggestion.brand,
          reason: suggestion.reason,
          source: 'openfoodfacts' as const,
          verified: true,
          productData: bestMatch,
        };
      }

      console.log('Using AI alternative without OpenFoodFacts verification:', {
        productName: suggestion.productName,
        brand: suggestion.brand,
      });

      return {
        productName: suggestion.productName,
        brand: suggestion.brand,
        reason: suggestion.reason,
        source: 'ai' as const,
        verified: false,
      };
    }),
  );

  return verificationResults.sort(
    (a, b) => Number(b.verified) - Number(a.verified),
  );
};
