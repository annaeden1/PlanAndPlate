import { ProductMatch } from '../../models/productMatch.model';

describe('ProductMatch model', () => {
  it('lowercases and trims itemName', () => {
    const doc = new ProductMatch({
      itemName: '  Onion ',
      chainId: 'rami-levy',
      hebrewQuery: 'בצל',
      code: '7290000000001',
      matchedName: 'בצל יבש',
      confidence: 0.9,
    });
    expect(doc.itemName).toBe('onion');
  });

  it('requires chainId', () => {
    const doc = new ProductMatch({
      itemName: 'onion',
      hebrewQuery: 'בצל',
      code: '7290000000001',
      matchedName: 'בצל',
      confidence: 1,
    });
    const err = doc.validateSync();
    expect(err?.errors.chainId).toBeDefined();
  });

  it('allows null code (negative cache)', () => {
    const doc = new ProductMatch({
      itemName: 'unicorn dust',
      chainId: 'shufersal',
      hebrewQuery: 'אבקת חד קרן',
      code: null,
      matchedName: null,
      confidence: 0,
    });
    const err = doc.validateSync();
    expect(err).toBeUndefined();
  });

  it('defaults resolvedAt to now', () => {
    const doc = new ProductMatch({
      itemName: 'onion',
      chainId: 'rami-levy',
      hebrewQuery: 'בצל',
      code: '7290000000001',
      matchedName: 'בצל',
      confidence: 1,
    });
    expect(doc.resolvedAt).toBeInstanceOf(Date);
  });
});
