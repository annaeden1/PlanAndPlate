export const formatQty = (n: number): string =>
  Number.isInteger(n) ? String(n) : n.toFixed(1);
