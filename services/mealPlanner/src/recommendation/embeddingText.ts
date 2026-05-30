export interface EmbeddingInput {
  name: string;
  cuisines?: string[];
  dishTypes?: string[];
  diets?: string[];
  ingredients?: { name: string }[];
}

export function buildEmbeddingText(input: EmbeddingInput): string {
  const parts: string[] = [input.name];
  if (input.cuisines?.length) parts.push(input.cuisines.join(" "));
  if (input.dishTypes?.length) parts.push(input.dishTypes.join(" "));
  if (input.diets?.length) parts.push(input.diets.join(" "));
  if (input.ingredients?.length) {
    parts.push(input.ingredients.slice(0, 8).map((i) => i.name).join(" "));
  }
  return parts.join(" ").trim();
}
