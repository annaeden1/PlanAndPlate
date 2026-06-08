import axios from "axios";
import { Recipe } from "../models/recipeModel";
import { UserFavorites } from "../models/userFavoritesModel";
import { getAiProvider } from "../ai/aiProvider";
import {
  searchRecipes,
  SpoonacularSearchParams,
  SpoonacularSearchResult,
} from "../services/spoonacularService.service";
import mealPlannerService from "../services/mealPlannerService";
import { buildTasteProfile, TasteRecipe, MIN_LIKES } from "./tasteProfile";
import { buildEmbeddingText } from "./embeddingText";
import { rankCandidates, RankCandidate, RankedSuggestion } from "./ranker";
import { nutritionTargets, NutritionTargets } from "./nutritionTargets";

function matchesMealSlot(recipe: TasteRecipe, mealType?: string): boolean {
  const types = (recipe.dishTypes ?? []).map((t) => t.toLowerCase());
  if (!types.length) return true;
  const slot = (mealType || "").toLowerCase();
  if (slot === "breakfast") {
    return types.some((t) => t.includes("breakfast") || t.includes("morning"));
  }
  return !types.some(
    (t) => t.includes("breakfast") || t.includes("dessert") || t.includes("sweet"),
  );
}

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
  if (doc) {
    return {
      name: doc.name,
      cuisines: doc.cuisines,
      dishTypes: doc.dishTypes,
      diets: doc.diets,
      ingredients: doc.instructions?.ingredients?.map((i) => ({ name: i.name })) ?? [],
      embedding: doc.embedding,
      calories: doc.calories,
    };
  }

  // Fallback: fetch from Spoonacular and cache locally so future lookups hit the DB.
  try {
    const fetched = await mealPlannerService.getRecipeDetails(recipeId);
    if (!fetched) return null;
    return {
      name: fetched.name,
      cuisines: fetched.cuisines,
      dishTypes: fetched.dishTypes,
      diets: fetched.diets,
      ingredients: fetched.instructions?.ingredients?.map((i: { name: string }) => ({ name: i.name })) ?? [],
      embedding: fetched.embedding,
      calories: fetched.calories,
    };
  } catch {
    return null;
  }
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

    const favs = await UserFavorites.findOne({ userId });
    const likedIds = favs?.likedRecipeIds ?? [];
    const likedRecipes = (
      await Promise.all(likedIds.map((id) => loadTasteRecipe(id)))
    ).filter((r): r is TasteRecipe => r !== null);

    await mealPlannerService.getRecipeDetails(recipeId, userId);
    const currentRecipe = (await loadTasteRecipe(recipeId)) ?? { name: "" };

    const { prefs, allergies } = await this.loadPreferences(userId, token);

    const slotLikes = likedRecipes.filter((r) => matchesMealSlot(r, mealType));
    const profileLikes = slotLikes.length >= MIN_LIKES ? slotLikes : likedRecipes;
    const profile = await buildTasteProfile({
      likedRecipes: profileLikes,
      currentRecipe,
      prefs,
      provider,
    });

    const targets = nutritionTargets(profile.healthGoal, currentRecipe.calories);
    const results = await this.searchWithFallback({
      cuisines: profile.cuisines,
      diet: profile.diet,
      intolerances: allergies,
      type: mealTypeToSpoonacular(mealType),
      targets,
    });

    const candidates = await this.embedCandidates(results, provider);
    const ranked = rankCandidates({
      candidates,
      centroid: profile.centroid,
      excludeIds: [recipeId, ...likedIds],
      limit,
    });

    if (provider.explain && ranked.length) {
      const top = ranked.slice(0, 5);
      const reasons = await provider.explain(
        {
          cuisines: profile.cuisines,
          diet: profile.diet,
          healthGoal: profile.healthGoal,
          allergies,
        },
        top.map((r) => ({ originRecipeId: r.originRecipeId, name: r.name })),
      );
      for (const r of ranked) {
        r.why = reasons[r.originRecipeId];
      }
    }

    return ranked;
  }

  private async loadPreferences(
    userId: string,
    token?: string,
  ): Promise<{ prefs: { diet?: string; healthGoal?: string }; allergies: string }> {
    try {
      const res = await axios.get(
        `${process.env.USER_MANAGMENT_URL}/userManagement/${userId}/preferences`,
        { headers: { Authorization: token } },
      );
      const p = res.data.userPreferences ?? {};
      const a = p.allergies;
      return {
        prefs: {
          diet: Array.isArray(p.diet) ? p.diet[0] : p.diet,
          healthGoal: p.healthGoal,
        },
        allergies: Array.isArray(a) ? a.join(",") : a || "",
      };
    } catch (err) {
      console.error("Failed to load user preferences for suggestions:", err);
      return { prefs: {}, allergies: "" };
    }
  }

  private async searchWithFallback(args: {
    cuisines: string[];
    diet?: string;
    intolerances: string;
    type?: string;
    targets: NutritionTargets;
  }): Promise<SpoonacularSearchResult[]> {
    const { cuisines, diet, intolerances, type, targets } = args;
    const base = { intolerances, number: 12 };

    const attempts: SpoonacularSearchParams[] = [
      { ...base, cuisines, diet, type, ...targets },
      { ...base, cuisines, diet, type },
      { ...base, diet, type },
      { ...base, diet },
    ];

    for (const params of attempts) {
      const results = await searchRecipes(params);
      if (results.length) return results;
    }
    return [];
  }

  private async embedCandidates(
    results: SpoonacularSearchResult[],
    provider: ReturnType<typeof getAiProvider>,
  ): Promise<RankCandidate[]> {
    const cached = await Promise.all(
      results.map((r) => Recipe.findOne({ originRecipeId: String(r.id) }, { embedding: 1 })),
    );

    const needEmbed = results.filter((_, i) => !cached[i]?.embedding?.length);
    const fresh = needEmbed.length
      ? await provider.embed(
          needEmbed.map((r) =>
            buildEmbeddingText({ name: r.title, cuisines: r.cuisines, dishTypes: r.dishTypes, diets: r.diets }),
          ),
        )
      : [];

    let freshIdx = 0;
    const vectors = results.map((_, i) =>
      cached[i]?.embedding?.length ? cached[i]!.embedding! : (fresh[freshIdx++] ?? []),
    );

    return Promise.all(
      results.map(async (r, i) => {
        const embedding = vectors[i];
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
