export type CanonicalUnit = 'g' | 'kg' | 'ml' | 'l' | 'piece';

export interface PackageSize {
  packageQty: number;
  packageUnit: CanonicalUnit;
}

type Dimension = 'mass' | 'volume' | 'count';

const TO_BASE: Record<string, { base: number; dim: Dimension }> = {
  mg: { base: 0.001, dim: 'mass' },
  g: { base: 1, dim: 'mass' },
  kg: { base: 1000, dim: 'mass' },
  oz: { base: 28.3495, dim: 'mass' },
  lb: { base: 453.592, dim: 'mass' },
  ml: { base: 1, dim: 'volume' },
  cl: { base: 10, dim: 'volume' },
  l: { base: 1000, dim: 'volume' },
  cup: { base: 236.588, dim: 'volume' },
  tbsp: { base: 14.7868, dim: 'volume' },
  tsp: { base: 4.92892, dim: 'volume' },
  'fl oz': { base: 29.5735, dim: 'volume' },
  piece: { base: 1, dim: 'count' },
};

const CART_UNIT_ALIASES: Record<string, string> = {
  milligram: 'mg', milligrams: 'mg', mg: 'mg',
  g: 'g', gram: 'g', grams: 'g',
  kg: 'kg', kilogram: 'kg', kilograms: 'kg',
  oz: 'oz', ounce: 'oz', ounces: 'oz',
  lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb',
  ml: 'ml', milliliter: 'ml', milliliters: 'ml', millilitre: 'ml', millilitres: 'ml',
  cl: 'cl', centiliter: 'cl', centiliters: 'cl',
  l: 'l', liter: 'l', liters: 'l', litre: 'l', litres: 'l',
  cup: 'cup', cups: 'cup',
  tbsp: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
  tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
  'fl oz': 'fl oz', 'fluid ounce': 'fl oz', 'fluid ounces': 'fl oz',
  // Discrete counts — eggs, produce sold by the unit, etc.
  '': 'piece', piece: 'piece', pieces: 'piece', pc: 'piece', pcs: 'piece',
  unit: 'piece', units: 'piece', whole: 'piece', each: 'piece', ea: 'piece',
  count: 'piece', ct: 'piece',
};

const normalizeCartUnit = (unit: string): string => {
  const key = unit.toLowerCase().trim();
  return CART_UNIT_ALIASES[key] ?? key;
};

const NUMBER = String.raw`(\d+(?:[.,]\d+)?)`;

const NAME_PATTERNS: { unit: CanonicalUnit; re: RegExp }[] = [
  { unit: 'kg', re: new RegExp(`${NUMBER}\\s*(?:ק["״׳']?ג|קילו(?:גרם)?|kg\\b)`, 'i') },
  { unit: 'ml', re: new RegExp(`${NUMBER}\\s*(?:מ["״׳']?ל|ml\\b)`, 'i') },
  { unit: 'l', re: new RegExp(`${NUMBER}\\s*(?:ליטר|ליט['׳]|ל["״׳']|liter|l\\b)`, 'i') },
  { unit: 'g', re: new RegExp(`${NUMBER}\\s*(?:גרם|גר['׳]?|ג['׳]|gr?\\b)`, 'i') },
  { unit: 'piece', re: /(?:אריז(?:ת|ה)|מארז)\s*(?:של\s*)?(\d+)/ },
  { unit: 'piece', re: /(\d+)\s*(?:יחידות|יחידה|יח['׳]?|pcs?\b|units?\b)/i },
  { unit: 'piece', re: /(?<![a-z֐-׿])[x×]\s*(\d+)/i },
];

export const parsePackageSize = (name: string): PackageSize | null => {
  if (!name) return null;
  for (const { unit, re } of NAME_PATTERNS) {
    const match = name.match(re);
    if (!match) continue;
    const qty = Number(match[1].replace(',', '.'));
    if (Number.isFinite(qty) && qty > 0) return { packageQty: qty, packageUnit: unit };
  }
  return null;
};

export const packagesNeeded = (
  needQty: number,
  needUnit: string,
  pkg: PackageSize,
): number | null => {
  const need = TO_BASE[normalizeCartUnit(needUnit)];
  const size = TO_BASE[pkg.packageUnit];
  if (!need || !size || need.dim !== size.dim) return null;

  const neededBase = needQty * need.base;
  const packageBase = pkg.packageQty * size.base;
  if (!(neededBase > 0) || !(packageBase > 0)) return null;

  return Math.max(1, Math.ceil(neededBase / packageBase));
};
