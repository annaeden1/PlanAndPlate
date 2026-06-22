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
import { calcTargets } from "../utils/calorieCalculator";
import { buildWeek } from "../utils/dayPlanBuilder";

const nutrientAmount = (recipe: ComplexSearchRecipe, name: string): number =>
  recipe.nutrition?.nutrients?.find((n) => n.name === name)?.amount ?? 0;

const slotToMeal = (slot?: SlotResult) =>
  slot
    ? {
        recipeId: String(slot.recipe.id),
        name: slot.recipe.title,
        calories: Math.round(slot.calories),
      }
    : { recipeId: "0", name: "", calories: 0 };

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

    const userPreferences = await axios.get(
      `${process.env.USER_MANAGMENT_URL}/userManagement/${userId}/preferences`,
      { headers: { Authorization: token } },
    );

    const allergyExcludeString = Array.isArray(
      userPreferences.data.userPreferences.allergies,
    )
      ? userPreferences.data.userPreferences.allergies.join(',')
      : userPreferences.data.userPreferences.allergies || '';

    const diet = Array.isArray(userPreferences.data.userPreferences.diet)
      ? userPreferences.data.userPreferences.diet[0] || ''
      : userPreferences.data.userPreferences.diet || '';

    const targets = calcTargets(
      userPreferences.data.userPreferences.bodyStats,
      userPreferences.data.userPreferences.healthGoal,
    );

    const week = await buildWeek(
      {
        proteinGramsPerDay: targets?.proteinGramsPerDay ?? 0,
        targetCalories: targets?.targetCalories ?? 0,
        diet: diet || undefined,
        excludeIngredients: allergyExcludeString || undefined,
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
      const dateStr = dateObj.toISOString().split('T')[0];

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
      'days.date': { $gte: weekStart, $lt: weekEnd },
    });
    return weeklyPlan;
  }

  async getDailyPlan(userId: string, date: any): Promise<any> {
    const dailyPlan = await MealPlan.findOne(
      { userId, 'days.date': date },
      { 'days.$': 1 },
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
    };

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

    const isComplete = existingRecipe &&
      (existingRecipe.instructions?.steps?.length ?? 0) > 0;

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
            (n: any) => n.name === 'Calories',
          )?.amount || 0,
        protein:
          recipeDetails.nutrition.nutrients.find(
            (n: any) => n.name === 'Protein',
          )?.amount || 0,
        fat:
          recipeDetails.nutrition.nutrients.find((n: any) => n.name === 'Fat')
            ?.amount || 0,
        carbs:
          recipeDetails.nutrition.nutrients.find(
            (n: any) => n.name === 'Carbohydrates',
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

  async createManualRecipe(
    recipePayload: Partial<IRecipe>,
    userId: string,
  ): Promise<IRecipe> {
    const manualRecipe = new Recipe({
      source: 'manual',
      userId,
      originRecipeId: userId + '-' + new mongoose.Types.ObjectId().toString(),
      name: recipePayload.name,
      image: recipePayload.image,
      servings: recipePayload.servings,
      readyInMinutes: recipePayload.readyInMinutes,
      diets: recipePayload.diets ?? [],
      instructions: recipePayload.instructions,
      calories: recipePayload.calories ?? 300,
      protein: recipePayload.protein ?? 15,
      fat: recipePayload.fat ?? 10,
      carbs: recipePayload.carbs ?? 35,
    });

    await manualRecipe.save();
    return manualRecipe.toObject();
  }

  async getManualRecipes(userId: string): Promise<(IRecipe & any)[]> {
    const manualRecipes = await Recipe.find({
      source: 'manual',
      userId,
    }).lean();
    return manualRecipes;
  }
}

export default new MealPlannerService();
