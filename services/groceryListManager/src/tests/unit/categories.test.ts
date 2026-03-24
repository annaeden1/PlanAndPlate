import { normalizeAisle } from '../../config/categories';

describe('Categories Config - normalizeAisle', () => {
  it('maps known primary aisles correctly', () => {
    expect(normalizeAisle('produce')).toBe('Produce');
    expect(normalizeAisle('meat counter')).toBe('Meat');
    expect(normalizeAisle('frozen meals')).toBe('Frozen');
  });

  it('handles multi-aisle strings by taking the first one', () => {
    expect(normalizeAisle('Produce;Dairy')).toBe('Produce');
    expect(normalizeAisle('cheese; milk, eggs, other dairy')).toBe('Dairy');
  });

  it('defaults to "Other" for unknown aisles', () => {
    expect(normalizeAisle('unknown futuristic aisle')).toBe('Other');
    expect(normalizeAisle('random stuff')).toBe('Other');
  });

  it('handles empty strings gracefully', () => {
    expect(normalizeAisle('')).toBe('Other');
    expect(normalizeAisle('   ;   ')).toBe('Other');
  });

  it('is case insensitive', () => {
    expect(normalizeAisle('PRODUCE')).toBe('Produce');
    expect(normalizeAisle('MeAt')).toBe('Meat');
  });

  it('maps all dairy-related aisles to Dairy', () => {
    expect(normalizeAisle('dairy')).toBe('Dairy');
    expect(normalizeAisle('cheese')).toBe('Dairy');
    expect(normalizeAisle('milk, eggs, other dairy')).toBe('Dairy');
    expect(normalizeAisle('eggs')).toBe('Dairy');
  });

  it('maps seafood-related aisles to Seafood', () => {
    expect(normalizeAisle('seafood')).toBe('Seafood');
    expect(normalizeAisle('fish counter')).toBe('Seafood');
  });

  it('maps poultry-related aisles to Poultry', () => {
    expect(normalizeAisle('poultry')).toBe('Poultry');
    expect(normalizeAisle('poultry counter')).toBe('Poultry');
  });

  it('maps beverage-related aisles to Beverages', () => {
    expect(normalizeAisle('beverages')).toBe('Beverages');
    expect(normalizeAisle('beer, wine & spirits')).toBe('Beverages');
    expect(normalizeAisle('drinks')).toBe('Beverages');
  });

  it('maps baking-related aisles to Baking', () => {
    expect(normalizeAisle('baking')).toBe('Baking');
    expect(normalizeAisle('baking ingredients')).toBe('Baking');
    expect(normalizeAisle('gluten free baking')).toBe('Baking');
  });

  it('maps condiment-related aisles to Condiments', () => {
    expect(normalizeAisle('condiments')).toBe('Condiments');
    expect(normalizeAisle('sauce')).toBe('Condiments');
    expect(normalizeAisle('ketchup, mustard, sauces/oils')).toBe('Condiments');
  });

  it('maps snack-related aisles to Snacks', () => {
    expect(normalizeAisle('snacks')).toBe('Snacks');
    expect(normalizeAisle('chips, pretzels, snacks')).toBe('Snacks');
    expect(normalizeAisle('nuts')).toBe('Snacks');
  });

  it('maps ethnic/international aisles to Other', () => {
    expect(normalizeAisle('ethnic foods')).toBe('Other');
    expect(normalizeAisle('asian foods')).toBe('Other');
    expect(normalizeAisle('international cuisine')).toBe('Other');
  });

  it('trims leading/trailing whitespace around the primary aisle', () => {
    expect(normalizeAisle('  produce  ')).toBe('Produce');
    expect(normalizeAisle('  dairy  ')).toBe('Dairy');
  });
});
