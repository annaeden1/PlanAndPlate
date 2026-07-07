import axios from 'axios';
import type { AxiosResponse } from 'axios';
import { ProductNutrition } from '../utils/types/product';
import { normalizeText } from '../utils/productMatching';

const OPEN_FOOD_FACTS_FIELDS = [
  'product_name',
  'brands',
  'quantity',
  'image_front_url',
  'nutriments.energy-kcal_100g',
  'nutriments.fat_100g',
  'nutriments.saturated-fat_100g',
  'nutriments.carbohydrates_100g',
  'nutriments.sugars_100g',
  'nutriments.proteins_100g',
  'nutriments.salt_100g',
  'ingredients_text',
  'allergens',
  'allergens_tags',
  'ingredients_analysis_tags',
  'traces',
  'traces_tags',
  'categories',
  'labels',
  'labels_tags',
  'nutriscore_grade',
  'countries',
  'countries_tags',
].join(',');

const OPEN_FOOD_FACTS_BASE_URL =
  process.env.OPENFOODFACTS_BASE_URL || 'https://world.openfoodfacts.org';
const OPEN_FOOD_FACTS_USER_AGENT =
  process.env.OPENFOODFACTS_USER_AGENT || 'PlanAndPlate';
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;
const searchCache = new Map<
  string,
  { timestamp: number; products: ProductNutrition[] }
>();

const openFoodFactsHttp = axios.create({
  baseURL: OPEN_FOOD_FACTS_BASE_URL,
  timeout: 5000,
  headers: {
    'User-Agent': OPEN_FOOD_FACTS_USER_AGENT,
  },
});

const delay = async (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetryRequest = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;

  return status === 429 || status === 503 || !status;
};

const fetchWithRetry = async (
  path: string,
  retries = 2,
): Promise<AxiosResponse> => {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await openFoodFactsHttp.get(path);
    } catch (error) {
      const isLastAttempt = attempt >= retries;
      if (!shouldRetryRequest(error) || isLastAttempt) {
        throw error;
      }

      const backoffMs = 250 * 2 ** attempt;
      await delay(backoffMs);
    }
  }

  throw new Error('OpenFoodFacts retry loop exited unexpectedly');
};

const getOpenFoodFactsErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status) {
      return `status ${status}`;
    }

    if (error.code) {
      return error.code;
    }
  }

  return 'unknown error';
};

export const fetchProductByBarcode = async (
  barcode: string,
): Promise<ProductNutrition | null> => {
  const url = `/api/v0/product/${barcode}.json?fields=${OPEN_FOOD_FACTS_FIELDS}`;

  const response = await fetchWithRetry(url);

  return response.data.status === 1 ? response.data.product : null;
};

export const searchProducts = async (
  query: string,
): Promise<ProductNutrition[]> => {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  const cacheKey = normalizeText(trimmedQuery);
  const cached = searchCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.timestamp < SEARCH_CACHE_TTL_MS) {
    return cached.products;
  }

  const url = `/cgi/search.pl?search_terms=${encodeURIComponent(
    trimmedQuery,
  )}&search_simple=1&action=process&json=1&page_size=20&fields=${OPEN_FOOD_FACTS_FIELDS}`;

  try {
    const response = await fetchWithRetry(url);
    const products = response.data?.products;
    const normalizedProducts = Array.isArray(products)
      ? (products as ProductNutrition[])
      : [];

    searchCache.set(trimmedQuery, {
      timestamp: now,
      products: normalizedProducts,
    });

    return normalizedProducts;
  } catch (error) {
    const reason = getOpenFoodFactsErrorMessage(error);
    console.warn(
      `OpenFoodFacts search unavailable for query "${trimmedQuery}" (${reason}); using AI fallback`,
    );
    return [];
  }
};
