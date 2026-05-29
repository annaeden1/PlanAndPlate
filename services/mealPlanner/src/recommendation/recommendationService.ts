// services/mealPlanner/src/recommendation/recommendationService.ts
import axios from "axios";
import { Recipe } from "../models/recipeModel";
import { UserFavorites } from "../models/userFavoritesModel";
import { getAiProvider } from "../ai/aiProvider";
import { searchRecipes, SpoonacularSearchResult } from "../services/spoonacularService.service";
import mealPlannerService from "../services/mealPlannerService";
import { buildTasteProfile, TasteRecipe } from "./tasteProfile";
import { buildEmbeddingText } from "./embeddingText";
import { rankCandidates, RankCandidate, RankedSuggestion } from "./ranker";

function mealTypeToSpoonacular(mealType?: string): string | undefined {
  switch ((mealType || "").toLowerCase()) {
    case "breakfast":
      return "breakfast";
    case "lunch":
    case "dinner":
      return "main course";
    default:
      return undefined;
  }
}

function caloriesOf(result: SpoonacularSearchResult): number {
  return result.nutrition?.nutrients?.find((n) => n.name === "Calories")?.amount ?? 0;
}

async function loadTasteRecipe(recipeId: string): Promise<TasteRecipe | null> {
  const doc = await Recipe.findOne({ originRecipeId: recipeId });
  if (!doc) return null;
  return {
    name: doc.name,
    cuisines: doc.cuisines,
    dishTypes: doc.dishTypes,
    diets: doc.diets,
    ingredients: doc.instructions?.ingredients?.map((i) => ({ name: i.name })) ?? [],
    embedding: doc.embedding,
  };
}

class RecommendationService {
  async getSuggestions(
    userId: string,
    recipeId: string,
    mealType: string | undefined,
    limit: number,
    token?: string,
  ): Promise<RankedSuggestion[]> {
    const provider = getAiProvider();

    // 1. Liked recipes (from cache; ones we have details for).
    const favs = await UserFavorites.findOne({ userId });
    const likedIds = favs?.likedRecipeIds ?? [];
    const likedRecipes = (
      await Promise.all(likedIds.map((id) => loadTasteRecipe(id)))
    ).filter((r): r is TasteRecipe => r !== null);

    // 2. Current recipe (ensure it is cached so we know its cuisines).
    await mealPlannerService.getRecipeDetails(recipeId, userId);
    const currentRecipe = (await loadTasteRecipe(recipeId)) ?? { name: "" };

    // 3. User preferences.
    let prefs: { diet?: string; healthGoal?: string } = {};
    try {
      const res = await axios.get(
        `${process.env.USER_MANAGMENT_URL}/userManagement/${userId}/preferences`,
        { headers: { Authorization: token } },
      );
      const p = res.data.userPreferences ?? {};
      prefs = {
        diet: Array.isArray(p.diet) ? p.diet[0] : p.diet,
        healthGoal: p.healthGoal,
      };
    } catch (err) {
      console.error("Failed to load user preferences for suggestions:", err);
    }

    const allergies = await this.loadAllergies(userId, token);

    // 4. Taste profile.
    const profile = await buildTasteProfile({
      likedRecipes,
      currentRecipe,
      prefs,
      provider,
    });

    // 5. Candidate search.
    const results = await searchRecipes({
      cuisines: profile.cuisines,
      diet: profile.diet,
      intolerances: allergies,
      type: mealTypeToSpoonacular(mealType),
      number: 12,
    });

    // 6. Embed candidates (cache to Recipe) and rank.
    const candidates = await this.embedCandidates(results, provider);
    const ranked = rankCandidates({
      candidates,
      centroid: profile.centroid,
      excludeIds: [recipeId, ...likedIds],
      limit,
    });

    // 7. Optional LLM "why this fits you" line on the top shortlist.
    if (provider.explain && ranked.length) {
      const top = ranked.slice(0, 5);
      const reasons = await provider.explain(
        profile.cuisines,
        top.map((r) => ({ originRecipeId: r.originRecipeId, name: r.name })),
      );
      for (const r of ranked) {
        (r as any).why = reasons[r.originRecipeId];
      }
    }

    return ranked;
  }

  private async loadAllergies(userId: string, token?: string): Promise<string> {
    try {
      const res = await axios.get(
        `${process.env.USER_MANAGMENT_URL}/userManagement/${userId}/preferences`,
        { headers: { Authorization: token } },
      );
      const a = res.data.userPreferences?.allergies;
      return Array.isArray(a) ? a.join(",") : a || "";
    } catch {
      return "";
    }
  }

  private async embedCandidates(
    results: SpoonacularSearchResult[],
    provider: ReturnType<typeof getAiProvider>,
  ): Promise<RankCandidate[]> {
    const texts = results.map((r) =>
      buildEmbeddingText({
        name: r.title,
        cuisines: r.cuisines,
        dishTypes: r.dishTypes,
        diets: r.diets,
      }),
    );
    const vectors = await provider.embed(texts);

    return Promise.all(
      results.map(async (r, i) => {
        const embedding = vectors[i] ?? [];
        // Cache lightweight fields + embedding so future calls are cheaper.
        await Recipe.updateOne(
          { originRecipeId: String(r.id) },
          {
            $set: {
              name: r.title,
              image: r.image,
              readyInMinutes: r.readyInMinutes,
              cuisines: r.cuisines,
              dishTypes: r.dishTypes,
              diets: r.diets,
              calories: caloriesOf(r),
              ...(embedding.length ? { embedding } : {}),
            },
          },
          { upsert: true },
        );
        return {
          originRecipeId: String(r.id),
          name: r.title,
          image: r.image,
          calories: caloriesOf(r),
          readyInMinutes: r.readyInMinutes,
          embedding,
        };
      }),
    );
  }
}

export default new RecommendationService();
