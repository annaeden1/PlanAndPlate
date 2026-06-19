

export const fonts = {
  display: "'Bricolage Grotesque', 'Inter', sans-serif",
  body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

export const colors = {

  canvas: '#e9e6dc',
  surface: '#f3f1e8',
  card: '#ffffff',

  greenDeepest: '#0b3f2e',
  greenDeep: '#0f5a40',
  greenForest: '#0c4733',
  green: '#15674c',
  greenMid: '#1c7a59',
  greenBright: '#2fbf87',
  greenLeaf: '#2c9d72',
  mint: '#3fe39b',
  mintSoft: '#7fe6b4',
  mintPale: '#bff5cf',
  mintTint: '#e7f7ef',

  ink: '#16211c',
  inkMuted: '#6c7a70',
  textMuted: '#8a978e',
  textFaint: '#a7b1a9',
  textGhost: '#9aa69e',

  orange: '#ff7a59',
  orangeWarm: '#ff8f5a',
  orangeBurnt: '#e8693c',
  amber: '#e08524',
  amberBright: '#f0a043',
  orangeTint: '#fff1e9',
  orangeTintWarm: '#fff4ec',
  orangeTintDeep: '#ffe8dc',

  danger: '#ef4444',

  cardBorder: 'rgba(20,40,30,0.05)',
  divider: 'rgba(20,40,30,0.08)',
  hairline: 'rgba(20,40,30,0.06)',
} as const;

export const gradients = {
  sidebar: 'linear-gradient(185deg,#0f5a40 0%,#0b3f2e 100%)',
  hero: 'linear-gradient(135deg,#1c7a59 0%,#0f5a40 55%,#0c4733 100%)',
  greenPanel: 'linear-gradient(135deg,#1c7a59,#0f5a40)',
  cta: 'linear-gradient(135deg,#2fbf87,#15674c)',
  ctaSoft: 'linear-gradient(135deg,#3fe39b,#1c7a59)',
  progress: 'linear-gradient(90deg,#2fbf87,#15674c)',
  progressLight: 'linear-gradient(90deg,#bff5cf,#3fe39b)',
  ring: 'linear-gradient(180deg,#bff5cf,#3fe39b)',
  streak: 'linear-gradient(135deg,#fff4ec,#ffe8dc)',

  protein: 'linear-gradient(90deg,#bff5cf,#3fe39b)',
  carbs: 'linear-gradient(90deg,#ffe9b8,#ffcf6b)',
  fat: 'linear-gradient(90deg,#ffd2c2,#ff9b80)',
} as const;

export const foodGradients = [
  'linear-gradient(135deg,#d7f5e3,#a9e8c4)',
  'linear-gradient(135deg,#fdeccd,#f7d59b)',
  'linear-gradient(135deg,#ffe0d6,#ffc0ad)',
  'linear-gradient(135deg,#e7e0fb,#c9bdf2)',
  'linear-gradient(135deg,#d6ecfb,#aed6f2)',
] as const;

export const foodGradientFor = (seed: string | number): string => {
  const s = String(seed);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return foodGradients[h % foodGradients.length];
};

export const shadows = {
  card: '0 0.5rem 1.5rem -1rem rgba(20,40,30,0.4)',
  cardHover: '0 1.25rem 2rem -1.125rem rgba(20,40,30,0.4)',
  soft: '0 0.5rem 1.375rem -1rem rgba(20,40,30,0.45)',
  hero: '0 1.625rem 3.125rem -1.5rem rgba(15,90,64,0.65)',
  greenPanel: '0 1.125rem 2.375rem -1.25rem rgba(15,90,64,0.7)',
  cta: '0 1rem 2rem -0.875rem rgba(21,103,76,0.6)',
  orange: '0 0.5rem 1rem -0.5rem rgba(255,122,89,0.6)',
  sidebarLogo: '0 0.5rem 1.125rem -0.375rem rgba(63,227,155,0.5)',
} as const;

export const radii = {
  chip: 9,
  button: 14,
  field: 13,
  card: 24,
  cardLg: 26,
  nav: 14,
} as const;
