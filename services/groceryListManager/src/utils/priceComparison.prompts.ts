import { ChainProduct } from '../types/priceComparison.types';

export const getHebrewQueryPrompt = (itemName: string): string => `
You translate grocery items into Hebrew supermarket search queries.

Grocery item (English): "${itemName}"

Return the shortest Hebrew search term an Israeli shopper would type to find
this product in an online supermarket. Prefer the generic product name, no
brand, no quantity.

Respond with JSON only, exactly: {"query": "<hebrew search term>"}
`;

export const getPickProductPrompt = (
  itemName: string,
  quantity: number,
  unit: string,
  candidates: ChainProduct[],
): string => `
You match a recipe ingredient to the correct supermarket product.

Ingredient: "${itemName}", needed amount: ${quantity} ${unit}.

Candidate products (JSON array):
${JSON.stringify(
  candidates.map((c) => ({ code: c.code, name: c.name, price: c.price })),
  null,
  2,
)}

Pick the single candidate that best matches the ingredient: right product
type first, then the most standard package size for the needed amount.
If NO candidate is actually this ingredient, return null.

Respond with JSON only, exactly:
{"code": "<code of best candidate or null>", "confidence": <number 0 to 1>}
`;
