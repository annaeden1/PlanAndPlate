import { Request, Response } from "express";
import { MealPlan } from "../models/mealPlanModel";

class MealPlannerController {
  async createWeeklyPlan(req: Request, res: Response) {
    const { userId } = req.params;
    const { startDate } = req.body;


  };

  async getWeeklyPlan(req: Request, res: Response) {
    const { userId } = req.params;
    const { week } = req.query;
    
    const weeklyPlan = await MealPlan.findOne({ userId, "days.date": week });

    if (!weeklyPlan) {
      return res.status(404).json({ error: "Weekly meal plan not found" });
    }
    res.json(weeklyPlan);
  };

  async getDailyPlan(req: Request, res: Response) {
    const { userId } = req.params;
    const { date } = req.query;

    const dailyPlan = await MealPlan.findOne({ userId, "days.date": date }, { "days.$": 1 });

    if (!dailyPlan || !dailyPlan.days || dailyPlan.days.length === 0) {
      return res.status(404).json({ error: "Daily meal plan not found" });
    }
    res.json(dailyPlan.days[0]);
  };

  async getRecipeDetails(req: Request, res: Response) {};
} 

export default new MealPlannerController();
