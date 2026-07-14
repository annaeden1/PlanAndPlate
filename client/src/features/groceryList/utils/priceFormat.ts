/** Formats a number as an ILS price, e.g. 7.2 -> "₪7.20". */
export const shekel = (n: number): string => `₪${n.toFixed(2)}`;
