import { AiProvider } from "../ai/aiProvider";
import { buildEmbeddingText } from "./embeddingText";
import { meanVector } from "./vectorMath";

export const MIN_LIKES = 3;

export interface TasteRecipe {
  name: string;
  cuisines?: string[];
  dishTypes?: string[];
  diets?: string[];
  ingredients?: { name: string }[];
  embedding?: number[];
  calories?: number;
}

export interface TasteProfile {
  centroid: number[];
  cuisines: string[];
  diet?: string;
  healthGoal?: string;
}

interface BuildArgs {
  likedRecipes: TasteRecipe[];
  currentRecipe: TasteRecipe;
  prefs: { diet?: string; healthGoal?: string };
  provider: AiProvider;
}

function topCuisines(recipes: TasteRecipe[], limit = 3): string[] {
  const counts = new Map<string, number>();
  for (const r of recipes) {
    for (const c of r.cuisines ?? []) counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([c]) => c);
}

export async function buildTasteProfile(args: BuildArgs): Promise<TasteProfile> {
  const { likedRecipes, currentRecipe, prefs, provider } = args;

  if (likedRecipes.length >= MIN_LIKES) {
    // Reuse stored embeddings; only call the AI for recipes that don't have one yet.
    const needEmbed = likedRecipes.filter((r) => !r.embedding?.length);
    const fresh = needEmbed.length
      ? await provider.embed(needEmbed.map(buildEmbeddingText))
      : [];
    let freshIdx = 0;
    const vectors = likedRecipes
      .map((r) => (r.embedding?.length ? r.embedding : (fresh[freshIdx++] ?? [])))
      .filter((v) => v.length > 0);
    return {
      centroid: meanVector(vectors),
      cuisines: topCuisines(likedRecipes),
      diet: prefs.diet,
      healthGoal: prefs.healthGoal,
    };
  }

  const prefsText = [prefs.diet, prefs.healthGoal].filter(Boolean).join(" ");
  const seedText = `${buildEmbeddingText(currentRecipe)} ${prefsText}`.trim();
  const [seedVec] = await provider.embed([seedText]);
  return {
    centroid: seedVec ?? [],
    cuisines: currentRecipe.cuisines ?? [],
    diet: prefs.diet,
    healthGoal: prefs.healthGoal,
  };
}
