export const UNIT_OPTIONS: { group: string; unit: string }[] = [
  ...['g', 'kg', 'oz', 'lb'].map((u) => ({ group: 'Weight', unit: u })),
  ...['ml', 'l', 'cup', 'tbsp', 'tsp', 'fl oz', 'pint', 'quart', 'gallon'].map((u) => ({ group: 'Volume', unit: u })),
  ...['pinch', 'dash', 'drop', 'splash', 'spoonful'].map((u) => ({ group: 'Small Measure', unit: u })),
  ...['piece', 'bunch', 'head', 'clove', 'handful', 'sprig', 'stalk', 'stem', 'leaf', 'slice', 'wedge', 'floret', 'ear', 'pod', 'bulb', 'root', 'knob'].map((u) => ({ group: 'Produce', unit: u })),
  ...['can', 'bottle', 'bag', 'box', 'jar', 'package', 'carton', 'packet', 'loaf', 'block', 'stick', 'bar', 'roll', 'pouch', 'tray', 'bundle', 'tube'].map((u) => ({ group: 'Packaging', unit: u })),
  ...['scoop', 'shot', 'serving'].map((u) => ({ group: 'Other', unit: u })),
];
