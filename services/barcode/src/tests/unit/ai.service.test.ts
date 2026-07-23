import { AIService } from '../../services/ai.service';
import { GeminiProvider } from '../../ai/geminiProvider';
import { CohereProvider } from '../../ai/cohereProvider';
import type { AlternativeAiProvider } from '../../ai/aiProvider';
import type { AlternativePromptInput } from '../../utils/types/prompts';

jest.mock('../../ai/geminiProvider');
jest.mock('../../ai/cohereProvider');

const validJson = JSON.stringify({
  alternatives: [{ productName: 'Oat Drink', brand: 'Oatly', reason: 'dairy-free' }],
});

const promptInput = {} as AlternativePromptInput;

const makeProvider = (
  name: string,
  generate: AlternativeAiProvider['generate'],
): AlternativeAiProvider => ({ name, generate });

describe('AIService.generateAlternativeProducts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    delete process.env.AI_PROVIDER_TIMEOUT_MS;
  });

  afterEach(() => jest.restoreAllMocks());

  it('returns parsed alternatives from the first successful provider', async () => {
    const provider = makeProvider('gemini', jest.fn().mockResolvedValue(validJson));
    const service = new AIService([provider]);

    const result = await service.generateAlternativeProducts(promptInput);

    expect(result).toEqual([
      { productName: 'Oat Drink', brand: 'Oatly', reason: 'dairy-free' },
    ]);
  });

  it('caps the result at 5 alternatives', async () => {
    const many = JSON.stringify({
      alternatives: Array.from({ length: 6 }, (_, i) => ({
        productName: `p${i}`,
        brand: `BrandCo${i}`,
        reason: 'r',
      })),
    });
    const service = new AIService([
      makeProvider('gemini', jest.fn().mockResolvedValue(many)),
    ]);

    const result = await service.generateAlternativeProducts(promptInput);
    expect(result).toHaveLength(5);
  });

  it('falls back to the next provider when the first returns an empty response', async () => {
    const service = new AIService([
      makeProvider('gemini', jest.fn().mockResolvedValue(null)),
      makeProvider('cohere', jest.fn().mockResolvedValue(validJson)),
    ]);

    const result = await service.generateAlternativeProducts(promptInput);
    expect(result).toHaveLength(1);
  });

  it('falls back to the next provider when the first returns invalid alternatives', async () => {
    const service = new AIService([
      makeProvider('gemini', jest.fn().mockResolvedValue('no json here')),
      makeProvider('cohere', jest.fn().mockResolvedValue(validJson)),
    ]);

    const result = await service.generateAlternativeProducts(promptInput);
    expect(result).toHaveLength(1);
  });

  it('falls back to the next provider on timeout', async () => {
    process.env.AI_PROVIDER_TIMEOUT_MS = '20';
    const slow = makeProvider(
      'gemini',
      jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(validJson), 100)),
      ),
    );
    const fast = makeProvider('cohere', jest.fn().mockResolvedValue(validJson));
    const service = new AIService([slow, fast]);

    const result = await service.generateAlternativeProducts(promptInput);
    expect(result).toHaveLength(1);
    expect(fast.generate).toHaveBeenCalled();
  });

  it('returns [] when every provider fails', async () => {
    const service = new AIService([
      makeProvider('gemini', jest.fn().mockResolvedValue(null)),
      makeProvider('cohere', jest.fn().mockResolvedValue('garbage')),
    ]);

    const result = await service.generateAlternativeProducts(promptInput);
    expect(result).toEqual([]);
  });

  it('warns when no real provider is configured (only the null provider)', async () => {
    const warnSpy = jest.spyOn(console, 'warn');
    const service = new AIService([
      makeProvider('none', jest.fn().mockResolvedValue(null)),
    ]);

    const result = await service.generateAlternativeProducts(promptInput);
    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('No AI provider configured'),
    );
  });

  describe('parseAlternatives edge cases', () => {
    const run = async (raw: string) => {
      const service = new AIService([
        makeProvider('gemini', jest.fn().mockResolvedValue(raw)),
      ]);
      return service.generateAlternativeProducts(promptInput);
    };

    it('returns [] when the response has no JSON object', async () => {
      expect(await run('just text, no braces')).toEqual([]);
    });

    it('returns [] when the JSON cannot be parsed', async () => {
      expect(await run('{ not: valid json }')).toEqual([]);
    });

    it('returns [] when all alternatives are filtered by validation', async () => {
      const raw = JSON.stringify({
        alternatives: [
          { productName: '', brand: 'X', reason: 'r' },
          { productName: 'P', brand: 'generic', reason: 'r' },
          { productName: 'P', brand: '', reason: 'r' },
          { productName: 'P', brand: 'Real', reason: '' },
        ],
      });
      expect(await run(raw)).toEqual([]);
    });

    it('handles a JSON object without an alternatives field', async () => {
      expect(await run('{"foo":"bar"}')).toEqual([]);
    });
  });

  describe('buildProviders (no injected providers)', () => {
    const OLD_ENV = process.env;
    beforeEach(() => {
      process.env = { ...OLD_ENV };
      delete process.env.GEMINI_API_KEY;
      delete process.env.COHERE_API_KEY;
    });
    afterEach(() => {
      process.env = OLD_ENV;
    });

    it('builds Gemini and Cohere providers when both keys are present', async () => {
      process.env.GEMINI_API_KEY = 'g-key';
      process.env.COHERE_API_KEY = 'c-key';
      (GeminiProvider as jest.Mock).mockImplementation(() => ({
        name: 'gemini',
        generate: jest.fn().mockResolvedValue(validJson),
      }));
      (CohereProvider as jest.Mock).mockImplementation(() => ({
        name: 'cohere',
        generate: jest.fn().mockResolvedValue(null),
      }));

      const service = new AIService();
      const result = await service.generateAlternativeProducts(promptInput);

      expect(GeminiProvider).toHaveBeenCalledWith('g-key');
      expect(CohereProvider).toHaveBeenCalledWith('c-key');
      expect(result).toHaveLength(1);
    });

    it('falls back to the null provider when no keys are configured', async () => {
      const service = new AIService();
      const result = await service.generateAlternativeProducts(promptInput);
      expect(result).toEqual([]);
      expect(GeminiProvider).not.toHaveBeenCalled();
      expect(CohereProvider).not.toHaveBeenCalled();
    });
  });
});
