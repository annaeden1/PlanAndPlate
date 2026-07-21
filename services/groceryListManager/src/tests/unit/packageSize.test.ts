import { packagesNeeded, parsePackageSize } from '../../utils/packageSize';

describe('parsePackageSize', () => {
  it('reads a Hebrew litre size', () => {
    expect(parsePackageSize('חלב טרי 3% 1 ליטר רמי לוי')).toEqual({
      packageQty: 1,
      packageUnit: 'l',
    });
  });

  it('reads a Hebrew kilogram size (ק״ג)', () => {
    expect(parsePackageSize('קמח לבן 1 ק״ג')).toEqual({ packageQty: 1, packageUnit: 'kg' });
  });

  it('reads a gram size', () => {
    expect(parsePackageSize('גבינה צהובה 200 גרם')).toEqual({
      packageQty: 200,
      packageUnit: 'g',
    });
  });

  it('reads a millilitre size and does not mistake מ״ל for ליטר', () => {
    expect(parsePackageSize('רסק עגבניות 250 מ"ל')).toEqual({
      packageQty: 250,
      packageUnit: 'ml',
    });
  });

  it('reads a decimal size written with a comma', () => {
    expect(parsePackageSize('קולה 1,5 ליטר')).toEqual({ packageQty: 1.5, packageUnit: 'l' });
  });

  it('reads an English kg size', () => {
    expect(parsePackageSize('Rice 2 kg')).toEqual({ packageQty: 2, packageUnit: 'kg' });
  });

  it('reads a pack count written as אריזת N', () => {
    expect(parsePackageSize('ביצים L אריזת 12')).toEqual({
      packageQty: 12,
      packageUnit: 'piece',
    });
  });

  it('reads a pack count written as מארז של N', () => {
    expect(parsePackageSize('מלפפונים מארז של 6')).toEqual({
      packageQty: 6,
      packageUnit: 'piece',
    });
  });

  it('reads a pack count written as N יחידות', () => {
    expect(parsePackageSize('לחמניות 8 יחידות')).toEqual({
      packageQty: 8,
      packageUnit: 'piece',
    });
  });

  it('reads a pack count written as a ×N multiplier', () => {
    expect(parsePackageSize('יוגורט x4')).toEqual({ packageQty: 4, packageUnit: 'piece' });
  });

  it('prefers a stated weight over a stray number (no false count)', () => {
    // "1 ק״ג" must win; the count parser must not fire on "3%".
    expect(parsePackageSize('קמח מלא 1 ק״ג')).toEqual({ packageQty: 1, packageUnit: 'kg' });
    expect(parsePackageSize('חלב 3% טרי')).toBeNull();
  });

  it('does not read an x inside a Latin word as a multiplier', () => {
    expect(parsePackageSize('Max power 6')).toBeNull();
  });

  it('returns null when no size is stated', () => {
    expect(parsePackageSize('מוצר 7290001')).toBeNull();
    expect(parsePackageSize('')).toBeNull();
  });
});

describe('packagesNeeded', () => {
  it('rounds up to a whole number of packages', () => {
    // need 2.5 kg, package is 1 kg -> 3 bags
    expect(packagesNeeded(2.5, 'kg', { packageQty: 1, packageUnit: 'kg' })).toBe(3);
  });

  it('converts across metric prefixes (g needed vs kg package)', () => {
    // need 500 g, package is 1 kg -> 1 bag
    expect(packagesNeeded(500, 'g', { packageQty: 1, packageUnit: 'kg' })).toBe(1);
  });

  it('needs at least one package for any positive amount', () => {
    expect(packagesNeeded(100, 'g', { packageQty: 1, packageUnit: 'kg' })).toBe(1);
  });

  it('converts volume across litre/millilitre', () => {
    // need 3 l, package is 500 ml -> 6 bottles
    expect(packagesNeeded(3, 'l', { packageQty: 500, packageUnit: 'ml' })).toBe(6);
  });

  it('normalizes verbose cart units (grams, kilograms)', () => {
    expect(packagesNeeded(1500, 'grams', { packageQty: 1, packageUnit: 'kg' })).toBe(2);
  });

  it('returns null when dimensions differ (volume needed vs mass package)', () => {
    expect(packagesNeeded(1, 'l', { packageQty: 1, packageUnit: 'kg' })).toBeNull();
  });

  it('counts packs for discrete items (18 eggs, carton of 12 -> 2 cartons)', () => {
    expect(packagesNeeded(18, 'piece', { packageQty: 12, packageUnit: 'piece' })).toBe(2);
  });

  it('needs a single pack when the count fits (12 eggs, carton of 12)', () => {
    expect(packagesNeeded(12, 'piece', { packageQty: 12, packageUnit: 'piece' })).toBe(1);
  });

  it('treats an empty cart unit as a piece', () => {
    expect(packagesNeeded(7, '', { packageQty: 6, packageUnit: 'piece' })).toBe(2);
  });

  it('returns null when a count is needed but the package is by weight', () => {
    // 3 cucumbers vs a 1 kg bag — not comparable without an average unit weight.
    expect(packagesNeeded(3, 'piece', { packageQty: 1, packageUnit: 'kg' })).toBeNull();
  });
});
