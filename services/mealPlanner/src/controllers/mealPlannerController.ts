import { Request, Response } from "express";
import mealPlannerService from "../services/mealPlannerService";

class MealPlannerController {
  async createWeeklyPlan(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const date = (req.query.date as string | undefined) || undefined;

      if (!userId || typeof userId !== "string" || userId.trim() === "") {
        return res.status(400).json({ error: "Invalid input data: userId is required" });
      }

      const authHeader = req.headers.authorization;
      const mealPlan = await mealPlannerService.createWeeklyPlan(userId, date, authHeader);
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
        return res.status(400).json({ error: "Invalid input data: userId and date are required" });
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
        return res.status(400).json({ error: "Invalid input data: userId and date are required" });
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

      const recipeDetails = await mealPlannerService.getRecipeDetails(recipeId);

      if (!recipeDetails) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      res.json(recipeDetails);
    } catch (error) {
      console.error("Error fetching recipe details:", error);
      res.status(500).json({ error: "Failed to fetch recipe details" });
    }
  }
}

export default new MealPlannerController();
