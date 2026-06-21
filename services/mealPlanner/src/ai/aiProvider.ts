export interface ExplainProfile {
  cuisines: string[];
  diet?: string;
  healthGoal?: string;
  allergies?: string;
}

export interface NutritionIngredient {
  name: string;
  amount: number;
  unit?: string;
}

export interface NutritionRecipeInput {
  name: string;
  ingredients: NutritionIngredient[];
  steps?: string[];
  servings?: number;
  userContext?: {
    diet?: string;
    healthGoal?: string;
    allergies?: string;
  };
}

export interface NutritionEstimate {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export function buildNutritionPrompt(recipe: NutritionRecipeInput): string {
  const ingredientLines = recipe.ingredients
    .map((i) => `- ${i.amount} ${i.unit ?? ""} ${i.name}`.trim())
    .join("\n");

  const stepsSection =
    recipe.steps && recipe.steps.length > 0
      ? `\nPreparation steps:\n${recipe.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`
      : "";

  const userSection = recipe.userContext
    ? `\nUser context (use only to resolve ambiguity in quantities or serving sizes):
- Diet: ${recipe.userContext.diet ?? "none specified"}
- Health goal: ${recipe.userContext.healthGoal ?? "none specified"}
- Allergies: ${recipe.userContext.allergies ?? "none"}`
    : "";

  return `You are a professional nutritionist and dietitian.
  
Estimate the total nutritional values for the following recipe.
Base your estimates on established nutritional databases (USDA, etc.).

Recipe name: ${recipe.name}
Servings: ${recipe.servings ?? "unknown"}

Ingredients:
${ingredientLines}
${stepsSection}
${userSection}

Instructions:
- Calculate nutrition for the ENTIRE recipe (all servings combined), not per serving.
- Use the ingredients list as the primary source. Use preparation steps only to understand cooking method (e.g. frying adds fat).
- If an amount is missing or unclear, use a reasonable typical portion.
- Return ONLY a valid JSON object with no explanation, no markdown, no extra text:

{"calories": <number>, "protein": <number>, "fat": <number>, "carbs": <number>}

All values should be rounded to 1 decimal place.`;
}

export interface AiProvider {
  embed(texts: string[]): Promise<number[][]>;
  explain?(
    profile: ExplainProfile,
    candidates: { originRecipeId: string; name: string }[],
  ): Promise<Record<string, string>>;
  estimateNutrition?(
    recipe: NutritionRecipeInput,
  ): Promise<NutritionEstimate | null>;
}

export class NullAiProvider implements AiProvider {
  async embed(texts: string[]): Promise<number[][]> {
    return texts.map(() => []);
  }
}

let cached: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (cached) return cached;
  let provider: AiProvider;
  if (process.env.AI_PROVIDER === "gemini" && process.env.GEMINI_API_KEY) {
    const { GeminiProvider } = require("./geminiProvider");
    provider = new GeminiProvider(process.env.GEMINI_API_KEY);
  } else if (
    process.env.AI_PROVIDER === "cohere" &&
    process.env.COHERE_API_KEY
  ) {
    const { CohereProvider } = require("./cohereProvider");
    provider = new CohereProvider(process.env.COHERE_API_KEY);
  } else {
    provider = new NullAiProvider();
  }
  cached = provider;
  return provider;
}

export function __setAiProvider(provider: AiProvider | null): void {
  cached = provider;
}
