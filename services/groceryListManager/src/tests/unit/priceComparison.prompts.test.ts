import {
  getHebrewQueryPrompt,
  getPickProductPrompt,
} from '../../utils/priceComparison.prompts';

describe('priceComparison prompts', () => {
  it('hebrew query prompt embeds the item name and demands JSON', () => {
    const prompt = getHebrewQueryPrompt('whole milk');
    expect(prompt).toContain('whole milk');
    expect(prompt).toContain('"query"');
  });

  it('pick prompt embeds item, quantity/unit and every candidate', () => {
    const prompt = getPickProductPrompt('whole milk', 2, 'liter', [
      { code: '111', barcode: '111', name: 'חלב טרי 3% 1 ליטר', price: 7.2 },
      { code: '222', barcode: null, name: 'חלב עמיד 1%', price: 5.9 },
    ]);
    expect(prompt).toContain('whole milk');
    expect(prompt).toContain('2 liter');
    expect(prompt).toContain('111');
    expect(prompt).toContain('חלב עמיד 1%');
    expect(prompt).toContain('"code"');
    expect(prompt).toContain('"confidence"');
  });
});
