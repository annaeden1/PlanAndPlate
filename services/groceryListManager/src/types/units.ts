// Maps Spoonacular unit strings to canonical forms
const UNIT_ALIASES: Record<string, string> = {
  // Weight
  g: 'g', gram: 'g', grams: 'g',
  kg: 'kg', kilogram: 'kg', kilograms: 'kg',
  oz: 'oz', ounce: 'oz', ounces: 'oz',
  lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb',

  // Volume
  ml: 'ml', milliliter: 'ml', milliliters: 'ml',
  l: 'l', liter: 'l', liters: 'l',
  cup: 'cup', cups: 'cup',
  tablespoon: 'tbsp', tablespoons: 'tbsp', tbsp: 'tbsp', Tbsp: 'tbsp',
  teaspoon: 'tsp', teaspoons: 'tsp', tsp: 'tsp',
  'fluid ounce': 'fl oz', 'fl oz': 'fl oz',
  quart: 'quart', quarts: 'quart',
  gallon: 'gallon', gallons: 'gallon',
  pint: 'pint', pints: 'pint',

  // Small measures
  pinch: 'pinch', dash: 'dash', drop: 'drop',
  splash: 'splash', spoonful: 'spoonful', glug: 'glug',

  // Discrete
  piece: 'piece', pieces: 'piece', unit: 'piece', whole: 'piece',
  head: 'head', bunch: 'bunch', bunches: 'bunch',
  clove: 'clove', cloves: 'clove',
  stalk: 'stalk', sprig: 'sprig', stem: 'stem',
  leaf: 'leaf', leave: 'leaf',
  slice: 'slice', slices: 'slice',
  strip: 'strip', wedge: 'wedge', floret: 'floret',
  ear: 'ear', cob: 'cob', pod: 'pod',
  bulb: 'bulb', root: 'root', knob: 'knob',
  shoot: 'shoot', handful: 'handful',

  // Protein cuts
  breast: 'breast', fillet: 'fillet', filet: 'fillet',
  thigh: 'thigh', wing: 'wing', leg: 'leg',
  steak: 'steak', chop: 'chop', rack: 'rack',
  rib: 'rib', roast: 'roast',
  patty: 'patty', pattie: 'patty',
  link: 'link', serving: 'serving',

  // Packaging
  can: 'can', tin: 'can',
  package: 'package', pack: 'package',
  bag: 'bag', box: 'box', bottle: 'bottle',
  jar: 'jar', container: 'container', tub: 'container',
  carton: 'carton', envelope: 'envelope',
  packet: 'packet', sachet: 'packet',
  tube: 'tube', roll: 'roll', pouch: 'pouch',
  scoop: 'scoop', shot: 'shot',
  loaf: 'loaf', block: 'block', stick: 'stick',
  bar: 'bar', sheet: 'sheet', ball: 'ball',
  cube: 'cube', square: 'square', round: 'round',
  bundle: 'bundle', tray: 'tray',

  // Default
  '': 'piece',
};

export const normalizeUnit = (unit: string): string =>
  UNIT_ALIASES[unit.trim()] ?? unit.toLowerCase().trim();
