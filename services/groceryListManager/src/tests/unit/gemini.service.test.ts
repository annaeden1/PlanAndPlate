import { convertToMarketUnits, GeminiIngredient } from '../../services/gemini.service';

const mockGenerateContent = jest.fn();

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  })),
}));

describe('Gemini Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
  });

  describe('convertToMarketUnits', () => {
    it('returns empty array for empty input without calling Gemini', async () => {
      const result = await convertToMarketUnits([]);
      expect(result).toEqual([]);
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('returns market unit data for valid ingredients', async () => {
      const mockResponse = [
        {
          name: 'chicken breast',
          marketUnit: 'pack',
          marketQuantity: 1,
          marketSize: '500g',
          marketSizeInRecipeUnits: 500,
        },
      ];
      mockGenerateContent.mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue(JSON.stringify(mockResponse)),
        },
      });

      const input: GeminiIngredient[] = [
        { name: 'chicken breast', quantity: 300, unit: 'g' },
      ];
      const result = await convertToMarketUnits(input);

      expect(result).toHaveLength(1);
      expect(result[0].marketUnit).toBe('pack');
      expect(result[0].marketQuantity).toBe(1);
      expect(result[0].marketSize).toBe('500g');
      expect(result[0].marketSizeInRecipeUnits).toBe(500);
    });

    it('extracts JSON from markdown code block response', async () => {
      const mockResponse = [
        { name: 'eggs', marketUnit: 'pack', marketQuantity: 1, marketSize: '12 eggs', marketSizeInRecipeUnits: 12 },
      ];
      mockGenerateContent.mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue(
            '```json\n' + JSON.stringify(mockResponse) + '\n```'
          ),
        },
      });

      const result = await convertToMarketUnits([{ name: 'eggs', quantity: 6, unit: 'piece' }]);
      expect(result[0].marketUnit).toBe('pack');
    });

    it('returns null fields when Gemini API call fails', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API error'));

      const result = await convertToMarketUnits([
        { name: 'chicken breast', quantity: 300, unit: 'g' },
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('chicken breast');
      expect(result[0].marketUnit).toBeNull();
      expect(result[0].marketQuantity).toBeNull();
      expect(result[0].marketSize).toBeNull();
      expect(result[0].marketSizeInRecipeUnits).toBeNull();
    });

    it('returns null fields when response contains no JSON array', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue('Sorry, I cannot process this request.'),
        },
      });

      const result = await convertToMarketUnits([
        { name: 'unknown item', quantity: 1, unit: 'piece' },
      ]);

      expect(result[0].marketUnit).toBeNull();
    });

    it('returns null fields when response array length mismatches input', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue('[]'),
        },
      });

      const result = await convertToMarketUnits([
        { name: 'tomato', quantity: 3, unit: 'piece' },
      ]);

      expect(result[0].marketUnit).toBeNull();
    });

    it('sends all ingredients in one batch call', async () => {
      const mockResponse = [
        { name: 'tomato', marketUnit: 'kg', marketQuantity: 1, marketSize: '1kg', marketSizeInRecipeUnits: 1000 },
        { name: 'onion', marketUnit: 'bag', marketQuantity: 1, marketSize: '1kg', marketSizeInRecipeUnits: 1000 },
      ];
      mockGenerateContent.mockResolvedValue({
        response: { text: jest.fn().mockReturnValue(JSON.stringify(mockResponse)) },
      });

      await convertToMarketUnits([
        { name: 'tomato', quantity: 200, unit: 'g' },
        { name: 'onion', quantity: 150, unit: 'g' },
      ]);

      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });
  });
});
