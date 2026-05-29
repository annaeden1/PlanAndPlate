import { cosineSimilarity } from "./vectorMath";

export interface RankCandidate {
  originRecipeId: string;
  name: string;
  image?: string;
  calories?: number;
  readyInMinutes?: number;
  embedding: number[];
}

export interface RankedSuggestion {
  originRecipeId: string;
  name: string;
  image?: string;
  calories?: number;
  readyInMinutes?: number;
  score: number;
}

interface RankArgs {
  candidates: RankCandidate[];
  centroid: number[];
  excludeIds: string[];
  limit: number;
}

export function rankCandidates(args: RankArgs): RankedSuggestion[] {
  const { candidates, centroid, excludeIds, limit } = args;
  const exclude = new Set(excludeIds);
  const filtered = candidates.filter((c) => !exclude.has(c.originRecipeId));

  const scored = filtered.map((c) => ({
    originRecipeId: c.originRecipeId,
    name: c.name,
    image: c.image,
    calories: c.calories,
    readyInMinutes: c.readyInMinutes,
    score: centroid.length ? cosineSimilarity(c.embedding, centroid) : 0,
  }));

  if (centroid.length) scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
