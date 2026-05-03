import { GoogleGenerativeAI } from "@google/generative-ai";

const ISRAEL_MARKET_PROMPT = `You are a shopping assistant for Israeli supermarkets (Rami Levy, Shufersal, Victory).
Convert recipe ingredient quantities to real purchasable units sold in Israel.

Packaging rules for Israel:
- Chicken breast, chicken thighs, beef, lamb, turkey → packs (500g, 1kg). Round up to nearest pack.
- Fish fillets, shrimp → packs (300g, 400g, 500g)
- Ground meat → packs (500g, 1kg)
- Tomatoes, cucumbers, peppers, zucchini → sold loose by kg or in 500g/1kg bags
- Onions, potatoes, carrots → 1kg bags
- Garlic → bulbs (1 bulb ≈ 50g, has 10-12 cloves) or 250g bags
- Lemons, limes → pieces (each ≈ 100g)
- Leafy greens (lettuce, spinach, kale) → bags (150g-200g)
- Fresh herbs (parsley, cilantro, dill, basil) → bunches (30g-40g)
- Eggs → packs of 12 by default (also available: 6, 18, 30). Use 12 unless quantity clearly exceeds.
- Milk → cartons (1L, 1.5L)
- Yogurt → cups (150g, 200g) or tubs (500g)
- Hard cheese (gouda, yellow cheese) → blocks (200g, 500g)
- Soft cheese, cottage cheese → tubs (200g, 300g, 500g)
- Butter → blocks (100g, 200g)
- Olive oil, vegetable oil, canola oil → bottles (750ml, 1L)
- Soy sauce, Worcestershire sauce, hot sauce → bottles (200ml, 500ml)
- Ketchup → bottles (500ml, 700ml)
- Mustard, mayonnaise → jars (200g, 300g, 450g)
- Tomato paste → tubes (70g) or cans (140g, 400g)
- Canned tomatoes → cans (400g, 800g)
- Canned chickpeas, beans, lentils → cans (400g, 800g)
- Pasta (spaghetti, penne, fusilli, etc.) → bags (500g)
- Rice → bags (1kg, 2kg)
- Flour → bags (1kg, 2kg)
- Sugar → bags (1kg)
- Salt → bags (1kg). One bag covers any recipe quantity.
- Dry spices (cumin, paprika, turmeric, cinnamon, oregano, etc.) → jars (50g-100g). One jar covers any recipe quantity.
- Bread → loaves (400g-500g, approximately 20 slices)
- Pita → packs of 6 or 8
- Lemon juice → bottles (200ml, 500ml)
- Vinegar → bottles (500ml, 750ml)
- Honey → jars (250g, 500g)
- Tahini (sesame paste) → tubs (300g, 500g)
- Hummus → tubs (250g, 400g)
- Vegetable broth, chicken broth, beef broth, stock (any liquid broth) → cartons (1L). 1 carton = 1000ml.
- Broth powder, bouillon cubes → packs (25g, 50g). One pack covers any recipe quantity.
- Dried lentils (red, green, brown) → bags (500g). 1 bag ≈ 500g.
- Dried beans (black beans, kidney beans, white beans, navy beans) → bags (500g, 1kg).
- Dried chickpeas → bags (500g, 1kg).
- Dried peas → bags (500g).

Instructions:
1. For each ingredient, determine the minimum number of packages to cover the total quantity needed.
2. For spices and salt: always return marketQuantity: 1 regardless of recipe quantity.
3. For eggs: count individual eggs (slices/pieces/units all count as eggs). Buy packs of 12.
4. marketSizeInRecipeUnits must be in the SAME unit as the recipe input unit (e.g. if unit is "g", return grams; if unit is "ml", return ml; if unit is "piece", return count).
   - For "cup" unit: 1 cup ≈ 240ml for liquids; for dry goods 1 cup ≈ 200g (flour), 190g (rice/lentils), 240g (sugar).
   - For "medium" unit on produce: 1 medium onion ≈ 150g, 1 medium carrot ≈ 100g, 1 medium potato ≈ 170g, 1 medium tomato ≈ 120g, 1 medium zucchini ≈ 200g, 1 medium pepper ≈ 120g.
   - For "large" unit on produce: multiply medium weight by 1.4. For "small": multiply by 0.7.
5. If the ingredient is truly unrecognizable, return null for all market fields. Do NOT return null for common food items — always make a best-effort match.

Return ONLY a valid JSON array (no markdown, no extra text) with exactly one object per ingredient in the same input order. Each object:
{
  "name": string (same as input),
  "marketUnit": string|null (pack/bottle/can/jar/bag/bunch/bulb/loaf/carton/tube/tub/piece),
  "marketQuantity": number|null (integer, minimum 1),
  "marketSize": string|null (e.g. "1kg", "500ml", "12 eggs", "6 pieces"),
  "marketSizeInRecipeUnits": number|null (size of ONE unit in the recipe's original unit)
}`;

export interface GeminiIngredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface GeminiMarketResult {
  name: string;
  marketUnit: string | null;
  marketQuantity: number | null;
  marketSize: string | null;
  marketSizeInRecipeUnits: number | null;
}

export const convertToMarketUnits = async (
  ingredients: GeminiIngredient[],
): Promise<GeminiMarketResult[]> => {
  if (ingredients.length === 0) return [];

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const inputJson = JSON.stringify(
    ingredients.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unit: i.unit,
    })),
  );

  const prompt = `${ISRAEL_MARKET_PROMPT}

Input (JSON array, ${ingredients.length} items):
${inputJson}

Return a JSON array with exactly ${ingredients.length} objects.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array in Gemini response");
    const parsed = JSON.parse(jsonMatch[0]) as GeminiMarketResult[];
    if (!Array.isArray(parsed) || parsed.length !== ingredients.length) {
      throw new Error(
        `Response length mismatch: expected ${ingredients.length}, got ${parsed.length}`,
      );
    }
    return parsed;
  } catch (err) {
    console.error("[Gemini] convertToMarketUnits failed:", err);
    return ingredients.map((i) => ({
      name: i.name,
      marketUnit: null,
      marketQuantity: null,
      marketSize: null,
      marketSizeInRecipeUnits: null,
    }));
  }
};
