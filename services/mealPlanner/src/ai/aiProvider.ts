// services/mealPlanner/src/ai/aiProvider.ts
export interface AiProvider {
  // Returns one embedding vector per input text, in order.
  // Returns [] (per text) when embeddings are unavailable.
  embed(texts: string[]): Promise<number[][]>;
}

// Used when no AI key is configured. Produces no embeddings,
// which makes the engine fall back to Spoonacular's own ordering.
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
    // Lazy require so the SDK is only loaded when actually used.
    const { GeminiProvider } = require("./geminiProvider");
    provider = new GeminiProvider(process.env.GEMINI_API_KEY);
  } else {
    provider = new NullAiProvider();
  }
  cached = provider;
  return provider;
}

// Test seam: allows tests to inject a fake provider.
export function __setAiProvider(provider: AiProvider | null): void {
  cached = provider;
}
