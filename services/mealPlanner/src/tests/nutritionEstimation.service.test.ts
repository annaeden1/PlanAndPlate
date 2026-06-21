import { buildNutritionPrompt, NutritionEstimate, NutritionRecipeInput, AiProvider } from '../ai/aiProvider';

// ────────────────────────────────────────────────────────
// 1.  buildNutritionPrompt — content checks
// ────────────────────────────────────────────────────────
describe('buildNutritionPrompt', () => {
  const base: NutritionRecipeInput = {
    name: 'Omelette',
    ingredients: [
      { name: 'eggs', amount: 2, unit: 'large' },
      { name: 'butter', amount: 10, unit: 'g' },
    ],
    servings: 1,
  };

  it('includes recipe name and servings', () => {
    const prompt = buildNutritionPrompt(base);
    expect(prompt).toContain('Omelette');
    expect(prompt).toContain('1'); // servings
  });

  it('includes each ingredient line', () => {
    const prompt = buildNutritionPrompt(base);
    expect(prompt).toContain('2 large eggs');
    expect(prompt).toContain('10 g butter');
  });

  it('includes preparation steps when provided', () => {
    const prompt = buildNutritionPrompt({
      ...base,
      steps: ['Beat eggs', 'Melt butter in pan', 'Pour and cook'],
    });
    expect(prompt).toContain('Preparation steps');
    expect(prompt).toContain('Beat eggs');
    expect(prompt).toContain('Melt butter in pan');
  });

  it('omits steps section when steps are absent', () => {
    const prompt = buildNutritionPrompt(base);
    expect(prompt).not.toContain('Preparation steps');
  });

  it('includes user context when provided', () => {
    const prompt = buildNutritionPrompt({
      ...base,
      userContext: { diet: 'vegetarian', healthGoal: 'weight loss', allergies: 'nuts' },
    });
    expect(prompt).toContain('User context');
    expect(prompt).toContain('vegetarian');
    expect(prompt).toContain('weight loss');
    expect(prompt).toContain('nuts');
  });

  it('omits user context section when not provided', () => {
    const prompt = buildNutritionPrompt(base);
    expect(prompt).not.toContain('User context');
  });

  it('handles missing unit gracefully', () => {
    const prompt = buildNutritionPrompt({
      ...base,
      ingredients: [{ name: 'salt', amount: 1 }], // no unit
    });
    expect(prompt).toContain('salt');
    // Should not produce "undefined" in the output
    expect(prompt).not.toContain('undefined');
  });

  it('demands JSON-only response', () => {
    const prompt = buildNutritionPrompt(base);
    expect(prompt).toContain('"calories"');
    expect(prompt).toContain('"protein"');
    expect(prompt).toContain('"fat"');
    expect(prompt).toContain('"carbs"');
    expect(prompt).toContain('no explanation');
    expect(prompt).toContain('no markdown');
  });
});

// ────────────────────────────────────────────────────────
// 2.  Mock AI provider — happy path + error paths
// ────────────────────────────────────────────────────────
const MOCK_ESTIMATE: NutritionEstimate = {
  calories: 320.5,
  protein: 18.2,
  fat: 22.0,
  carbs: 8.3,
};

function makeMockProvider(
  override?: Partial<{ estimateNutrition: (r: NutritionRecipeInput) => Promise<NutritionEstimate | null> }>,
): AiProvider {
  return {
    embed: async () => [],
    estimateNutrition: override?.estimateNutrition ?? (async () => MOCK_ESTIMATE),
  };
}

describe('estimateNutrition — provider behaviour', () => {
  const recipe: NutritionRecipeInput = {
    name: 'Pasta Carbonara',
    ingredients: [
      { name: 'spaghetti', amount: 200, unit: 'g' },
      { name: 'bacon', amount: 100, unit: 'g' },
      { name: 'eggs', amount: 2, unit: 'large' },
      { name: 'parmesan', amount: 50, unit: 'g' },
    ],
    steps: ['Boil pasta', 'Fry bacon', 'Mix eggs and cheese', 'Combine'],
    servings: 2,
  };

  it('returns a NutritionEstimate on success', async () => {
    const provider = makeMockProvider();
    const result = await provider.estimateNutrition!(recipe);
    expect(result).not.toBeNull();
    expect(result?.calories).toBe(320.5);
    expect(result?.protein).toBe(18.2);
    expect(result?.fat).toBe(22.0);
    expect(result?.carbs).toBe(8.3);
  });

  it('returns null when the AI cannot estimate', async () => {
    const provider = makeMockProvider({ estimateNutrition: async () => null });
    const result = await provider.estimateNutrition!(recipe);
    expect(result).toBeNull();
  });

  it('NullAiProvider does NOT expose estimateNutrition', async () => {
    // NullAiProvider should not have the method (it is optional on the interface)
    const { NullAiProvider } = await import('../ai/aiProvider');
    const nullProvider = new NullAiProvider() as AiProvider;
    expect(nullProvider.estimateNutrition).toBeUndefined();
  });
});

// ────────────────────────────────────────────────────────
// 3.  Fallback logic — simulated service behaviour
// ────────────────────────────────────────────────────────
async function runEstimation(
  provider: AiProvider,
  recipe: NutritionRecipeInput,
  fallback: NutritionEstimate,
): Promise<NutritionEstimate> {
  if (provider.estimateNutrition && recipe.ingredients.length > 0) {
    try {
      const result = await provider.estimateNutrition(recipe);
      if (result) return result;
    } catch (err) {
      console.warn('AI nutrition estimation failed, using fallback:', err);
    }
  }
  return fallback;
}

const FALLBACK: NutritionEstimate = { calories: 400, protein: 20, fat: 15, carbs: 45 };

describe('Fallback strategy', () => {
  const recipe: NutritionRecipeInput = {
    name: 'Test',
    ingredients: [{ name: 'rice', amount: 100, unit: 'g' }],
  };

  it('uses AI estimate when available', async () => {
    const provider = makeMockProvider();
    const result = await runEstimation(provider, recipe, FALLBACK);
    expect(result.calories).toBe(MOCK_ESTIMATE.calories);
  });

  it('uses fallback when AI returns null', async () => {
    const provider = makeMockProvider({ estimateNutrition: async () => null });
    const result = await runEstimation(provider, recipe, FALLBACK);
    expect(result).toEqual(FALLBACK);
  });

  it('uses fallback when AI throws', async () => {
    const provider = makeMockProvider({
      estimateNutrition: async () => { throw new Error('AI error'); },
    });
    const result = await runEstimation(provider, recipe, FALLBACK);
    expect(result).toEqual(FALLBACK);
  });

  it('uses fallback when there are no ingredients', async () => {
    const provider = makeMockProvider();
    const emptyRecipe: NutritionRecipeInput = { name: 'Empty', ingredients: [] };
    const result = await runEstimation(provider, emptyRecipe, FALLBACK);
    expect(result).toEqual(FALLBACK);
  });

  it('uses fallback when provider has no estimateNutrition method', async () => {
    const minimalProvider: AiProvider = { embed: async () => [] };
    const result = await runEstimation(minimalProvider, recipe, FALLBACK);
    expect(result).toEqual(FALLBACK);
  });
});
