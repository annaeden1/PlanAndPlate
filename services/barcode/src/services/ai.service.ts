import { type AlternativePromptInput } from '../utils/types/prompts';
import { type SuggestedAlternative } from '../utils/types/alternatives';
import {
  NullAlternativeAiProvider,
  type AlternativeAiProvider,
} from '../ai/aiProvider';
import { GeminiProvider } from '../ai/geminiProvider';
import { CohereProvider } from '../ai/cohereProvider';

const INVALID_BRAND_PATTERNS = [
  /generic/i,
  /store brand/i,
  /house brand/i,
  /private label/i,
  /supermarket brand/i,
  /grocery brand/i,
];

const hasValidBrand = (brand: string): boolean => {
  const normalizedBrand = brand.trim();

  if (!normalizedBrand) {
    return false;
  }

  return !INVALID_BRAND_PATTERNS.some((pattern) =>
    pattern.test(normalizedBrand),
  );
};

export class AIService {
  private readonly injectedProviders?: AlternativeAiProvider[];

  constructor(providers?: AlternativeAiProvider[]) {
    this.injectedProviders = providers;
  }

  private getProviderTimeoutMs(): number {
    const parsedProviderTimeout = Number(process.env.AI_PROVIDER_TIMEOUT_MS);
    return parsedProviderTimeout > 0 ? parsedProviderTimeout : 2500;
  }

  private async generateWithTimeout(
    provider: AlternativeAiProvider,
    promptInput: AlternativePromptInput,
  ): Promise<{ text: string | null; timedOut: boolean }> {
    type TimeoutResult = { text: string | null; timedOut: boolean };
    const providerTimeoutMs = this.getProviderTimeoutMs();

    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise: Promise<TimeoutResult> = new Promise((resolve) => {
      timeoutHandle = setTimeout(() => {
        resolve({ text: null, timedOut: true });
      }, providerTimeoutMs);
    });

    const generatePromise: Promise<TimeoutResult> = provider
      .generate(promptInput)
      .then((text) => ({ text, timedOut: false }));

    const result = await Promise.race<TimeoutResult>([
      generatePromise,
      timeoutPromise,
    ]);

    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }

    return result;
  }

  private buildProviders(): AlternativeAiProvider[] {
    const orderedProviders: AlternativeAiProvider[] = [];
    const geminiKey = process.env.GEMINI_API_KEY;
    const cohereKey = process.env.COHERE_API_KEY;

    console.log(
      `AI provider keys detected: gemini=${Boolean(geminiKey)}, cohere=${Boolean(cohereKey)}`,
    );

    if (geminiKey) {
      orderedProviders.push(new GeminiProvider(geminiKey));
    }

    if (cohereKey) {
      orderedProviders.push(new CohereProvider(cohereKey));
    }

    if (!orderedProviders.length) {
      orderedProviders.push(new NullAlternativeAiProvider());
    }

    console.log(
      `AI provider order for alternatives: ${orderedProviders.map((provider) => provider.name).join(' -> ')}`,
    );

    return orderedProviders;
  }

  async generateAlternativeProducts(
    promptInput: AlternativePromptInput,
  ): Promise<SuggestedAlternative[]> {
    const providers = this.injectedProviders || this.buildProviders();
    const configuredProviderNames = providers
      .map((provider) => provider.name)
      .filter((name) => name !== 'none');

    if (!configuredProviderNames.length) {
      console.warn(
        'No AI provider configured for barcode alternatives. Set GEMINI_API_KEY and/or COHERE_API_KEY.',
      );
    }

    const failureReasons: string[] = [];

    for (let i = 0; i < providers.length; i += 1) {
      const provider = providers[i];
      const nextProvider = providers[i + 1];

      console.log(
        `Trying AI provider: ${provider.name}${i === 0 ? ' (primary)' : ' (fallback)'}`,
      );

      const { text, timedOut } = await this.generateWithTimeout(
        provider,
        promptInput,
      );

      if (timedOut) {
        console.warn(
          `AI provider ${provider.name} timed out after ${this.getProviderTimeoutMs()}ms.${nextProvider ? ` Trying ${nextProvider.name} next.` : ''}`,
        );
        failureReasons.push(`${provider.name}: timeout`);
        continue;
      }

      if (!text) {
        console.warn(
          `AI provider ${provider.name} returned empty response.${nextProvider ? ` Trying ${nextProvider.name} next.` : ''}`,
        );
        failureReasons.push(`${provider.name}: empty response`);
        continue;
      }

      console.log(`${provider.name} raw alternatives response:`, text);

      const { alternatives: parsed, reason } = this.parseAlternatives(text);
      console.log(`${provider.name} parsed alternatives:`, parsed);

      if (parsed.length > 0) {
        console.log(
          `AI provider ${provider.name} succeeded with valid alternatives.`,
        );
        return parsed.slice(0, 5);
      }

      console.warn(
        `AI provider ${provider.name} returned invalid alternatives (${reason}).${nextProvider ? ` Trying ${nextProvider.name} next.` : ''}`,
      );
      failureReasons.push(`${provider.name}: ${reason}`);
    }

    const providerChain = configuredProviderNames.length
      ? configuredProviderNames.join(' -> ')
      : 'none';

    console.warn(
      `All AI providers failed or returned invalid alternatives (${providerChain}). Reasons: ${failureReasons.join(' | ') || 'unknown'}`,
    );
    return [];
  }

  private parseAlternatives(raw: string): {
    alternatives: SuggestedAlternative[];
    reason: string;
  } {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        alternatives: [],
        reason: 'response did not contain a JSON object',
      };
    }

    try {
      const data = JSON.parse(jsonMatch[0]) as {
        alternatives?: Array<Partial<SuggestedAlternative>>;
      };

      const alternatives = data.alternatives || [];

      const parsedAlternatives = alternatives
        .map((item) => ({
          productName: String(item.productName || '').trim(),
          brand: String(item.brand || '').trim(),
          reason: String(item.reason || '').trim(),
        }))
        .filter(
          (item) =>
            item.productName.length > 0 &&
            hasValidBrand(item.brand) &&
            item.reason.length > 0,
        );

      if (!parsedAlternatives.length) {
        return {
          alternatives: [],
          reason:
            'parsed JSON but all alternatives were filtered by validation (missing fields and/or invalid brand)',
        };
      }

      return {
        alternatives: parsedAlternatives,
        reason: 'ok',
      };
    } catch (error) {
      return {
        alternatives: [],
        reason: `failed to parse AI alternatives JSON: ${String(error)}`,
      };
    }
  }
}
