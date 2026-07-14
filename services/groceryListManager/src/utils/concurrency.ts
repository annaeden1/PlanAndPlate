/**
 * Like Promise.all(items.map(fn)) but runs at most `limit` tasks at once.
 * Keeps result order aligned with the input. Used to cap the burst of external
 * catalog + LLM calls when pricing a large grocery list.
 */
export const mapLimit = async <T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> => {
  const results = new Array<R>(items.length);
  let next = 0;

  const worker = async (): Promise<void> => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index], index);
    }
  };

  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
};
