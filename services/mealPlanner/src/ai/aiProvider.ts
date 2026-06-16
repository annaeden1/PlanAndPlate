export interface ExplainProfile {
  cuisines: string[];
  diet?: string;
  healthGoal?: string;
  allergies?: string;
}

export interface AiProvider {
  embed(texts: string[]): Promise<number[][]>;
  explain?(
    profile: ExplainProfile,
    candidates: { originRecipeId: string; name: string }[],
  ): Promise<Record<string, string>>;
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
  } else if (process.env.AI_PROVIDER === "cohere" && process.env.COHERE_API_KEY) {
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
