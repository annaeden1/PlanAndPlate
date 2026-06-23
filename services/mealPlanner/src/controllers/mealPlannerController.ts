import { Request, Response } from "express";
import { AuthRequest } from "../utils/types/auth";
import mealPlannerService from "../services/mealPlannerService";

class MealPlannerController {
  async createWeeklyPlan(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const date = (req.query.date as string | undefined) || undefined;

      if (!userId || typeof userId !== "string" || userId.trim() === "") {
        return res
          .status(400)
          .json({ error: "Invalid input data: userId is required" });
      }

      const authHeader = req.headers.authorization;
      const mealPlan = await mealPlannerService.createWeeklyPlan(
        userId,
        date,
        authHeader,
      );
      res.status(201).json(mealPlan);
    } catch (error) {
      console.error("Error creating weekly plan:", error);
      res.status(500).json({ error: "Failed to create weekly meal plan" });
    }
  }

  async getWeeklyPlan(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const date = req.query.date as string | undefined;

      if (!userId || !date) {
        return res
          .status(400)
          .json({ error: "Invalid input data: userId and date are required" });
      }

      const weeklyPlan = await mealPlannerService.getWeeklyPlan(userId, date);

      if (!weeklyPlan) {
        return res.status(404).json({ error: "Weekly meal plan not found" });
      }
      res.json(weeklyPlan);
    } catch (error) {
      console.error("Error retrieving weekly plan:", error);
      res.status(500).json({ error: "Failed to retrieve weekly meal plan" });
    }
  }

  async getDailyPlan(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { date } = req.query;

      if (!userId || !date) {
        return res
          .status(400)
          .json({ error: "Invalid input data: userId and date are required" });
      }

      const dailyPlan = await mealPlannerService.getDailyPlan(userId, date);

      if (!dailyPlan) {
        return res.status(404).json({ error: "Daily meal plan not found" });
      }
      res.json(dailyPlan);
    } catch (error) {
      console.error("Error retrieving daily plan:", error);
      res.status(500).json({ error: "Failed to retrieve daily meal plan" });
    }
  }

  async getRecipeDetails(req: Request, res: Response) {
    try {
      const { recipeId } = req.params;

      if (!recipeId || typeof recipeId !== "string" || recipeId.trim() === "") {
        return res.status(400).json({ error: "Invalid recipe ID" });
      }

      const userId = (req as any).user?._id;
      const recipeDetails = await mealPlannerService.getRecipeDetails(
        recipeId,
        userId,
      );

      if (!recipeDetails) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      res.json(recipeDetails);
    } catch (error) {
      console.error("Error fetching recipe details:", error);
      res.status(500).json({ error: "Failed to fetch recipe details" });
    }
  }

  async getManualRecipes(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const manualRecipes = await mealPlannerService.getManualRecipes(userId);
      res.status(200).json(manualRecipes);
    } catch (error) {
      console.error("Error fetching manual recipes:", error);
      res.status(500).json({ error: "Failed to fetch manual recipes" });
    }
  }

  async createManualRecipe(req: Request, res: Response) {
    try {
      const recipePayload = req.body;
      const userId = (req as any).user?._id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!recipePayload || typeof recipePayload !== "object") {
        return res.status(400).json({ error: "Invalid recipe payload" });
      }

      if (!recipePayload.name || typeof recipePayload.name !== "string") {
        return res.status(400).json({ error: "Recipe name is required" });
      }

      const recipe = await mealPlannerService.createManualRecipe(
        recipePayload,
        userId,
      );
      res.status(201).json(recipe);
    } catch (error) {
      console.error("Error creating manual recipe:", error);
      res.status(500).json({ error: "Failed to create manual recipe" });
    }
  }

  async toggleRecipeLike(req: Request, res: Response) {
    try {
      const { recipeId } = req.params;
      const userId = (req as any).user?._id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!recipeId || typeof recipeId !== "string" || recipeId.trim() === "") {
        return res.status(400).json({ error: "Invalid recipe ID" });
      }

      const result = await mealPlannerService.toggleRecipeLike(
        userId,
        recipeId,
      );
      res.json(result);
    } catch (error) {
      console.error("Error toggling recipe like:", error);
      res.status(500).json({ error: "Failed to toggle recipe like" });
    }
  }

  async replaceMeal(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const { date, mealType, newRecipeId } = req.body;

      if (!userId || !date || !mealType || !newRecipeId) {
        return res
          .status(400)
          .json({
            error: "userId, date, mealType and newRecipeId are required",
          });
      }
      if (req.user?._id !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      if (!["breakfast", "lunch", "dinner"].includes(mealType)) {
        return res.status(400).json({ error: "Invalid mealType" });
      }
      if (Number.isNaN(new Date(date).getTime())) {
        return res.status(400).json({ error: "Invalid date" });
      }

      const updatedDay = await mealPlannerService.replaceMeal(
        userId,
        date,
        mealType,
        String(newRecipeId),
      );
      if (!updatedDay) {
        return res.status(404).json({ error: "Meal plan or day not found" });
      }
      res.json(updatedDay);
    } catch (error) {
      console.error("Error replacing meal:", error);
      res.status(500).json({ error: "Failed to replace meal" });
    }
  }

  async getLikedRecipes(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      if (!userId || typeof userId !== "string" || userId.trim() === "") {
        return res
          .status(400)
          .json({ error: "Invalid input data: userId is required" });
      }

      const recipes = await mealPlannerService.getLikedRecipes(userId);
      res.json(recipes);
    } catch (error) {
      console.error("Error fetching liked recipes:", error);
      res.status(500).json({ error: "Failed to fetch liked recipes" });
    }
  }

  async getUserStats(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      if (!userId || typeof userId !== "string" || userId.trim() === "") {
        return res
          .status(400)
          .json({ error: "Invalid input data: userId is required" });
      }

      if ((req as any).user?._id !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const stats = await mealPlannerService.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Failed to fetch user stats" });
    }
  }

  async updateManualRecipe(req: Request, res: Response) {
    try {
      const { recipeId } = req.params;
      const userId = (req as any).user?._id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      if (!recipeId || typeof recipeId !== "string" || recipeId.trim() === "") {
        return res.status(400).json({ error: "Invalid recipe ID" });
      }

      const updated = await mealPlannerService.updateManualRecipe(
        recipeId,
        req.body,
        userId,
      );

      if (updated === null) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      res.json(updated);
    } catch (error: any) {
      if (error?.message === "FORBIDDEN") {
        return res
          .status(403)
          .json({ error: "Forbidden: not your recipe or not manual" });
      }
      console.error("Error updating manual recipe:", error);
      res.status(500).json({ error: "Failed to update manual recipe" });
    }
  }

  async deleteManualRecipe(req: Request, res: Response) {
    try {
      const { recipeId } = req.params;
      const userId = (req as any).user?._id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      if (!recipeId || typeof recipeId !== "string" || recipeId.trim() === "") {
        return res.status(400).json({ error: "Invalid recipe ID" });
      }

      const deleted = await mealPlannerService.deleteManualRecipe(
        recipeId,
        userId,
      );

      if (!deleted) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      res.status(204).send();
    } catch (error: any) {
      if (error?.message === "FORBIDDEN") {
        return res
          .status(403)
          .json({ error: "Forbidden: not your recipe or not manual" });
      }
      console.error("Error deleting manual recipe:", error);
      res.status(500).json({ error: "Failed to delete manual recipe" });
    }
  }
}

export default new MealPlannerController();
