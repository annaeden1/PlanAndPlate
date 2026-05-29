// services/mealPlanner/src/recommendation/recommendationController.ts
import { Response } from "express";
import { AuthRequest } from "../utils/types/auth";
import recommendationService from "./recommendationService";

class RecommendationController {
  async getSuggestions(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id;
      const { recipeId } = req.params;
      const mealType = req.query.mealType as string | undefined;
      const limit = Math.min(Number(req.query.limit) || 6, 12);

      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      if (!recipeId || recipeId.trim() === "") {
        return res.status(400).json({ error: "Invalid recipe ID" });
      }

      const token = req.headers.authorization;
      const suggestions = await recommendationService.getSuggestions(
        userId,
        recipeId,
        mealType,
        limit,
        token,
      );
      res.json(suggestions);
    } catch (error) {
      console.error("Error getting suggestions:", error);
      res.status(500).json({ error: "Failed to get suggestions" });
    }
  }
}

export default new RecommendationController();
