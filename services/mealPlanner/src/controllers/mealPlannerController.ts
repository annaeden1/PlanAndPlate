import { Request, Response } from "express";

class MealPlannerController {
  async createWeeklyPlan(req: Request, res: Response) {
    const { userId } = req.params;
    const { startDate } = req.body;
  };

  async getWeeklyPlan(req: Request, res: Response) {
    const { userId } = req.params;
    const { week } = req.query;
  };

    async getDailyPlan(req: Request, res: Response) {};

    async getRecipeDetails(req: Request, res: Response) {};

    async updateDailyPlan(req: Request, res: Response) {};

    async updateMealInPlan(req: Request, res: Response) {};

    async getWeeklyNutritionSummary(req: Request, res: Response) {};

    async likeRecipe(req: Request, res: Response) {};

    async unlikeRecipe(req: Request, res: Response) {};

    async getLikedRecipes(req: Request, res: Response) {};

    async getMealRecommendations(req: Request, res: Response) {};
} 

export default new MealPlannerController();
