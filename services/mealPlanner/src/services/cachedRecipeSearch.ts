import { Recipe, IRecipe } from "../models/recipeModel";
import { searchRecipesByNutrition } from "./spoonacularService.service";
import {
  ComplexSearchParams,
  ComplexSearchRecipe,
  SearchRecipesFn,
} from "../utils/types/spoonacularTypes";

const MAX_RANDOM_OFFSET = 30;

const DEFAULT_POOL_SIZE = 7;

export const normalizeAllergyList = (allergies?: string): string[] =>
  (allergies ?? "")
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean)
    .sort();

const toComplexSearchRecipe = (doc: IRecipe): ComplexSearchRecipe => ({
  id: Number(doc.originRecipeId),
  title: doc.name,
  image: doc.image,
  diets: doc.diets,
  nutrition: {
    nutrients: [
      { name: "Calories", amount: doc.calories ?? 0, unit: "kcal", percentOfDailyNeeds: 0 },
      { name: "Protein", amount: doc.protein ?? 0, unit: "g", percentOfDailyNeeds: 0 },
      { name: "Fat", amount: doc.fat ?? 0, unit: "g", percentOfDailyNeeds: 0 },
      { name: "Carbohydrates", amount: doc.carbs ?? 0, unit: "g", percentOfDailyNeeds: 0 },
    ],
  },
});

export interface CachedSearchOptions {
  recentRecipeIds: string[];
  allergies?: string;
  searchApi?: SearchRecipesFn;
}

export const makeCachedSearch = ({
  recentRecipeIds,
  allergies,
  searchApi = searchRecipesByNutrition,
}: CachedSearchOptions): SearchRecipesFn => {
  const allergyList = normalizeAllergyList(allergies);
  const recentSet = new Set(recentRecipeIds);

  return async (params: ComplexSearchParams): Promise<ComplexSearchRecipe[]> => {
    const size = params.number ?? DEFAULT_POOL_SIZE;

    let local: IRecipe[] = [];
    try {
      const match: Record<string, unknown> = { source: "spoonacular" };
      if (params.minCalories !== undefined || params.maxCalories !== undefined) {
        match.calories = {
          ...(params.minCalories !== undefined && { $gte: params.minCalories }),
          ...(params.maxCalories !== undefined && { $lte: params.maxCalories }),
        };
      }
      if (params.minProtein !== undefined) {
        match.protein = { $gte: params.minProtein };
      }
      if (params.diet) match.diets = params.diet;
      if (allergyList.length > 0) {
        match.fetchedWithExclusions = { $all: allergyList };
      }
      if (recentRecipeIds.length > 0) {
        match.originRecipeId = { $nin: recentRecipeIds };
      }

      local =
        (await Recipe.aggregate([
          { $match: match },
          { $sample: { size } },
        ])) ?? [];
    } catch (err) {
      console.warn("Recipe cache query failed, falling back to API:", err);
      local = [];
    }

    if (local.length >= size) {
      return local.map(toComplexSearchRecipe);
    }

    const offset = Math.floor(Math.random() * (MAX_RANDOM_OFFSET + 1));
    const apiResults = await searchApi({ ...params, offset });
    return apiResults.filter((r) => !recentSet.has(String(r.id)));
  };
};
