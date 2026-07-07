import axios from "axios";
import mongoose from "mongoose";
import { MealPlan, IMealPlan, IMealPlanDay } from "../models/mealPlanModel";
import { Recipe, IRecipe } from "../models/recipeModel";
import { UserFavorites } from "../models/userFavoritesModel";
import {
  getRecipeDetails as getSpoonacularRecipe,
  searchRecipesByNutrition,
} from "./spoonacularService.service";
import { normalizeUnit } from "../utils/types/units";
import {
  nutrients,
  ComplexSearchRecipe,
  SlotResult,
} from "../utils/types/spoonacularTypes";
import { calcTargets, BodyStats } from "../utils/calorieCalculator";
import { buildWeek } from "../utils/dayPlanBuilder";
import { getAiProvider } from "../ai/aiProvider";

const NUTRITION_FALLBACK = { calories: 400, protein: 20, fat: 15, carbs: 45 };

const nutrientAmount = (recipe: ComplexSearchRecipe, name: string): number =>
  recipe.nutrition?.nutrients?.find((n) => n.name === name)?.amount ?? 0;

const slotToMeal = (slot?: SlotResult) =>
  slot
    ? {
        recipeId: String(slot.recipe.id),
        name: slot.recipe.title,
        calories: Math.round(slot.calories),
        image: slot.recipe.image ?? "",
      }
    : { recipeId: "0", name: "", calories: 0, image: "" };

interface ParsedUserPreferences {
  /** First diet value — used when an API accepts only one (e.g. Spoonacular). */
  primaryDiet: string;
  /** All diets joined with ", " — used for free-text contexts like AI prompts. */
  dietString: string;
  allergies: string;
  healthGoal?: string;
  weeklyBudget?: number;
  bodyStats?: Partial<BodyStats>;
}

class MealPlannerService {
  async createWeeklyPlan(
    userId: string,
    date?: string,
    token?: string,
  ): Promise<IMealPlan & any> {
    const refDate = date ? new Date(date) : new Date();
    if (isNaN(refDate.getTime())) {
      throw new Error(`Invalid date: ${date}`);
    }
    const weekStart = new Date(refDate);
    weekStart.setDate(refDate.getDate() - refDate.getDay());

    const userPreferences = await this.getUserPreferences(userId, token);

    const targets = calcTargets(
      userPreferences.bodyStats,
      userPreferences.healthGoal ?? "",
    );

    const week = await buildWeek(
      {
        proteinGramsPerDay: targets?.proteinGramsPerDay ?? 0,
        targetCalories: targets?.targetCalories ?? 0,
        diet: userPreferences.primaryDiet || undefined,
        excludeIngredients: userPreferences.allergies || undefined,
      },
      searchRecipesByNutrition,
    );

    const allSlots: SlotResult[] = week.flatMap((day) => day.slots);
    const existing = await Recipe.find({
      originRecipeId: { $in: allSlots.map((s) => String(s.recipe.id)) },
    });
    const existingIds = new Set(existing.map((r) => r.originRecipeId));
    const toInsert = new Map<string, ComplexSearchRecipe>();
    for (const slot of allSlots) {
      const id = String(slot.recipe.id);
      if (!existingIds.has(id) && !toInsert.has(id)) {
        toInsert.set(id, slot.recipe);
      }
    }
    if (toInsert.size > 0) {
      await Recipe.insertMany(
        Array.from(toInsert.values()).map((r) => ({
          originRecipeId: String(r.id),
          name: r.title,
          image: r.image,
          calories: nutrientAmount(r, "Calories"),
          protein: nutrientAmount(r, "Protein"),
          fat: nutrientAmount(r, "Fat"),
          carbs: nutrientAmount(r, "Carbohydrates"),
        })),
        { ordered: false },
      );
    }

    const missedDays = week.filter((d) => !d.proteinTargetMet).length;
    if (missedDays > 0 && (targets?.proteinGramsPerDay ?? 0) > 0) {
      console.warn(
        `Protein target not met for ${missedDays}/7 days (user ${userId}, floor ${targets?.proteinGramsPerDay}g/day).`,
      );
    }

    const days = week.map((day, index) => {
      const dateObj = new Date(weekStart);
      dateObj.setDate(weekStart.getDate() + index);
      const dateStr = dateObj.toISOString().split("T")[0];

      const bySlot = (name: string) =>
        day.slots.find((s) => s.slot === name);

      return {
        date: dateStr,
        breakfast: slotToMeal(bySlot("breakfast")),
        lunch: slotToMeal(bySlot("lunch")),
        dinner: slotToMeal(bySlot("dinner")),
        proteinTargetMet: day.proteinTargetMet,
      };
    });

    const summary: nutrients = week.reduce(
      (acc, day) => {
        day.slots.forEach((s) => {
          acc.calories += s.calories;
          acc.protein += s.protein;
          acc.fat += nutrientAmount(s.recipe, "Fat");
          acc.carbohydrates += nutrientAmount(s.recipe, "Carbohydrates");
        });
        return acc;
      },
      { calories: 0, protein: 0, fat: 0, carbohydrates: 0 } as nutrients,
    );

    const mealPlan = new MealPlan({
      userId,
      days,
      nutritionSummary: {
        calories: Math.round(summary.calories),
        protein: Math.round(summary.protein),
        fat: Math.round(summary.fat),
        carbs: Math.round(summary.carbohydrates),
      },
    });

    await mealPlan.save();
    return mealPlan;
  }

  async getWeeklyPlan(userId: string, date: string): Promise<IMealPlan | null> {
    const refDate = new Date(date);
    const weekStart = new Date(refDate);
    weekStart.setUTCDate(refDate.getUTCDate() - refDate.getUTCDay());
    weekStart.setUTCHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 1);

    const weeklyPlan = await MealPlan.findOne({
      userId,
      "days.date": { $gte: weekStart, $lt: weekEnd },
    });
    return weeklyPlan;
  }

  async getDailyPlan(userId: string, date: any): Promise<any> {
    const dailyPlan = await MealPlan.findOne(
      { userId, "days.date": date },
      { "days.$": 1 },
    );

    if (!dailyPlan || !dailyPlan.days || dailyPlan.days.length === 0) {
      return null;
    }
    return dailyPlan.days[0];
  }

  async replaceMeal(
    userId: string,
    date: string,
    mealType: "breakfast" | "lunch" | "dinner",
    newRecipeId: string,
  ): Promise<IMealPlanDay | null> {
    const recipe = await this.getRecipeDetails(newRecipeId, userId);
    if (!recipe) return null;

    const day = new Date(date);
    const dayStart = new Date(day);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayStart.getUTCDate() + 1);

    const plan = await MealPlan.findOne({
      userId,
      "days.date": { $gte: dayStart, $lt: dayEnd },
    });
    if (!plan) return null;

    const targetDay = plan.days.find((d) => {
      const dd = new Date(d.date);
      return dd >= dayStart && dd < dayEnd;
    });
    if (!targetDay) return null;

    targetDay[mealType] = {
      recipeId: String(newRecipeId),
      name: recipe.name,
      calories: recipe.calories ?? 0,
      image: recipe.image ?? "",
    };

    plan.markModified("days");

    plan.nutritionSummary.calories = plan.days.reduce(
      (sum, d) =>
        sum +
        (d.breakfast?.calories || 0) +
        (d.lunch?.calories || 0) +
        (d.dinner?.calories || 0),
      0,
    );

    await plan.save();
    return targetDay;
  }

  async getRecipeDetails(
    recipeId: string,
    userId?: string,
  ): Promise<IRecipe & any> {
    const existingRecipe = await Recipe.findOne({ originRecipeId: recipeId });
    let recipeData;

    const isComplete =
      existingRecipe && (existingRecipe.instructions?.steps?.length ?? 0) > 0;

    if (isComplete) {
      recipeData = existingRecipe;
    } else {
      const recipeDetails = await getSpoonacularRecipe(recipeId);

      const fullFields = {
        source: "spoonacular",
        originRecipeId: recipeDetails.id || recipeId,
        name: recipeDetails.title,
        image: recipeDetails.image,
        calories:
          recipeDetails.nutrition.nutrients.find(
            (n: any) => n.name === "Calories",
          )?.amount || 0,
        protein:
          recipeDetails.nutrition.nutrients.find(
            (n: any) => n.name === "Protein",
          )?.amount || 0,
        fat:
          recipeDetails.nutrition.nutrients.find((n: any) => n.name === "Fat")
            ?.amount || 0,
        carbs:
          recipeDetails.nutrition.nutrients.find(
            (n: any) => n.name === "Carbohydrates",
          )?.amount || 0,
        servings: recipeDetails.servings,
        readyInMinutes: recipeDetails.readyInMinutes,
        diets: recipeDetails.diets,
        cuisines: recipeDetails.cuisines,
        dishTypes: recipeDetails.dishTypes,
        instructions: {
          steps:
            recipeDetails.analyzedInstructions[0]?.steps.map(
              (s: any) => s.step,
            ) || [],
          ingredients: recipeDetails.extendedIngredients.map((ing: any) => ({
            id: ing.id,
            name: ing.name,
            image: ing.image,
            amount: ing.amount,
            unit: normalizeUnit(ing.unit),
            aisle: ing.aisle,
          })),
        },
      };

      if (existingRecipe) {
        existingRecipe.set(fullFields);
        await existingRecipe.save();
        recipeData = existingRecipe;
      } else {
        recipeData = new Recipe(fullFields);
        await recipeData.save();
      }
    }

    let isLiked = false;
    if (userId) {
      const userFavs = await UserFavorites.findOne({ userId });
      if (userFavs && userFavs.likedRecipeIds.includes(recipeId)) {
        isLiked = true;
      }
    }

    return { ...recipeData.toObject(), isLiked };
  }

  async toggleRecipeLike(
    userId: string,
    recipeId: string,
  ): Promise<{ isLiked: boolean }> {
    const userFavs = await UserFavorites.findOne({ userId });

    if (!userFavs) {
      await UserFavorites.create({ userId, likedRecipeIds: [recipeId] });
      return { isLiked: true };
    }

    const isCurrentlyLiked = userFavs.likedRecipeIds.includes(recipeId);

    if (isCurrentlyLiked) {
      await UserFavorites.updateOne(
        { userId },
        { $pull: { likedRecipeIds: recipeId } },
      );
    } else {
      await UserFavorites.updateOne(
        { userId },
        { $addToSet: { likedRecipeIds: recipeId } },
      );
    }

    return { isLiked: !isCurrentlyLiked };
  }

  async getLikedRecipes(userId: string): Promise<any[]> {
    const userFavs = await UserFavorites.findOne({ userId });
    if (
      !userFavs ||
      !userFavs.likedRecipeIds ||
      userFavs.likedRecipeIds.length === 0
    ) {
      return [];
    }

    const recipes = await Recipe.find({
      originRecipeId: { $in: userFavs.likedRecipeIds },
    });

    return recipes.map((r) => ({ ...r.toObject(), isLiked: true }));
  }

  private async getUserPreferences(
    userId: string,
    authHeader?: string,
  ): Promise<ParsedUserPreferences> {
    const res = await axios.get(
      `${process.env.USER_MANAGMENT_URL}/userManagement/${userId}/preferences`,
      authHeader ? { headers: { Authorization: authHeader } } : {},
    );
    const raw = res.data?.userPreferences ?? res.data?.preferences ?? {};

    const dietList: string[] = Array.isArray(raw.diet)
      ? raw.diet
      : raw.diet
        ? [raw.diet]
        : [];

    const allergiesList: string[] = Array.isArray(raw.allergies)
      ? raw.allergies
      : raw.allergies
        ? [raw.allergies]
        : [];

    return {
      primaryDiet: dietList[0] ?? "",
      dietString: dietList.join(", "),
      allergies: allergiesList.join(", "),
      healthGoal: raw.healthGoal ?? undefined,
      weeklyBudget: raw.weeklyBudget ?? undefined,
      bodyStats: raw.bodyStats ?? undefined,
    };
  }

  async createManualRecipe(
    recipePayload: Partial<IRecipe>,
    userId: string,
    authHeader?: string,
  ): Promise<IRecipe> {
    let nutrition = { ...NUTRITION_FALLBACK };

    const isValidNumber = (value: unknown): value is number =>
      typeof value === "number" && !Number.isNaN(value);

    const missingNutrition =
      !isValidNumber(recipePayload.calories) &&
      !isValidNumber(recipePayload.protein) &&
      !isValidNumber(recipePayload.fat) &&
      !isValidNumber(recipePayload.carbs);

    if (missingNutrition) {
      const ingredients = recipePayload.instructions?.ingredients ?? [];
      const steps = recipePayload.instructions?.steps ?? [];

      const provider = getAiProvider();
      if (provider.estimateNutrition && ingredients.length > 0) {
        let userContext:
          | { diet?: string; healthGoal?: string; allergies?: string }
          | undefined;
        try {
          const prefs = await this.getUserPreferences(userId, authHeader);
          userContext = {
            diet: prefs.dietString || undefined,
            healthGoal: prefs.healthGoal,
            allergies: prefs.allergies || undefined,
          };
        } catch (err) {
          console.warn(
            "Could not fetch user preferences for nutrition estimation:",
            err,
          );
        }

        try {
          const estimate = await provider.estimateNutrition({
            name: recipePayload.name ?? "Recipe",
            ingredients: ingredients.map((ing) => ({
              name: ing.name,
              amount: ing.amount,
              unit: ing.unit,
            })),
            steps,
            servings: recipePayload.servings,
            userContext,
          });

          if (estimate) {
            nutrition = estimate;
            console.log(
              `AI nutrition estimated for "${recipePayload.name}":`,
              nutrition,
            );
          } else {
            console.warn(
              `AI returned null for "${recipePayload.name}", using fallback nutrition.`,
            );
          }
        } catch (err) {
          console.warn("AI nutrition estimation failed, using fallback:", err);
        }
      } else if (ingredients.length === 0) {
        console.info(
          "No ingredients provided; using fallback nutrition values.",
        );
      }
    }

    const manualRecipe = new Recipe({
      source: "manual",
      userId,
      originRecipeId: userId + "-" + new mongoose.Types.ObjectId().toString(),
      name: recipePayload.name,
      image: recipePayload.image,
      servings: recipePayload.servings,
      readyInMinutes: recipePayload.readyInMinutes,
      diets: recipePayload.diets ?? [],
      instructions: recipePayload.instructions,
      calories: recipePayload.calories ?? nutrition.calories,
      protein: recipePayload.protein ?? nutrition.protein,
      fat: recipePayload.fat ?? nutrition.fat,
      carbs: recipePayload.carbs ?? nutrition.carbs,
    });

    await manualRecipe.save();
    return manualRecipe.toObject();
  }

  async getManualRecipes(userId: string): Promise<(IRecipe & any)[]> {
    const manualRecipes = await Recipe.find({
      source: "manual",
      userId,
    }).lean();
    return manualRecipes;
  }

  async getUserStats(
    userId: string,
  ): Promise<{ weeksActive: number; mealsLogged: number }> {
    const weeksActive = await MealPlan.countDocuments({ userId });

    const mealPlans = await MealPlan.find({ userId });
    const mealsInPlans = mealPlans.reduce((total, plan) => {
      const dailyMeals = (plan.days || []).flatMap((day) => [
        day.breakfast,
        day.lunch,
        day.dinner,
      ]);
      const validMeals = dailyMeals.filter((meal) => {
        if (!meal || !meal.recipeId) return false;
        const recipeIdStr = String(meal.recipeId).trim();
        return recipeIdStr !== "0" && recipeIdStr !== "";
      });
      return total + validMeals.length;
    }, 0);

    const manualRecipesCount = await Recipe.countDocuments({
      userId,
      source: "manual",
    });

    return {
      weeksActive,
      mealsLogged: mealsInPlans + manualRecipesCount,
    };
  }

  async updateManualRecipe(
    recipeId: string,
    payload: Partial<IRecipe>,
    userId: string,
  ): Promise<IRecipe | null> {
    const recipe = await Recipe.findOne({ originRecipeId: recipeId });

    if (!recipe) return null;
    if (recipe.source !== "manual" || recipe.userId !== userId) {
      throw new Error("FORBIDDEN");
    }

    const allowedFields: (keyof IRecipe)[] = [
      "name",
      "image",
      "servings",
      "readyInMinutes",
      "diets",
      "instructions",
    ];
    for (const field of allowedFields) {
      if (payload[field] !== undefined) {
        (recipe as any)[field] = payload[field];
      }
    }

    await recipe.save();
    return recipe.toObject();
  }

  async deleteManualRecipe(recipeId: string, userId: string): Promise<boolean> {
    const recipe = await Recipe.findOne({ originRecipeId: recipeId });

    if (!recipe) return false;
    if (recipe.source !== "manual" || recipe.userId !== userId) {
      throw new Error("FORBIDDEN");
    }

    await Recipe.deleteOne({ originRecipeId: recipeId });
    await UserFavorites.updateMany(
      { likedRecipeIds: recipeId },
      { $pull: { likedRecipeIds: recipeId } },
    );

    return true;
  }
}

export default new MealPlannerService();
