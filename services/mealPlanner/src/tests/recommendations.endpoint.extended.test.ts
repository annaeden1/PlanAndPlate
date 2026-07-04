import express from "express";
import request from "supertest";

jest.mock("../middlewares/auth.middleware", () => ({
  __esModule: true,
  default: (req: any, _res: any, next: any) => {
    req.user = { _id: "user-1" };
    next();
  },
}));

jest.mock("../recommendation/recommendationService", () => ({
  __esModule: true,
  default: {
    getSuggestions: jest.fn(),
  },
}));

import { mealPlannerRouter } from "../routes/mealPlannerRouter";
import recommendationService from "../recommendation/recommendationService";

const app = express();
app.use(express.json());
app.use("/mealPlanner", mealPlannerRouter);

describe("RecommendationController - extended coverage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 200 with suggestions", async () => {
    (recommendationService.getSuggestions as jest.Mock).mockResolvedValue([
      { originRecipeId: "111", name: "Salad" },
    ]);
    const res = await request(app)
      .get("/mealPlanner/users/user-1/recipes/999/suggestions")
      .query({ mealType: "lunch", limit: "3" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("returns 400 when recipeId is blank", async () => {
    const res = await request(app)
      .get("/mealPlanner/users/user-1/recipes/%20/suggestions");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid recipe ID");
  });

  it("returns 500 when service throws", async () => {
    (recommendationService.getSuggestions as jest.Mock).mockRejectedValue(
      new Error("Service down")
    );
    const res = await request(app)
      .get("/mealPlanner/users/user-1/recipes/999/suggestions");
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to get suggestions");
  });

  it("caps limit at 12 when limit exceeds 12", async () => {
    (recommendationService.getSuggestions as jest.Mock).mockResolvedValue([]);
    await request(app)
      .get("/mealPlanner/users/user-1/recipes/999/suggestions")
      .query({ limit: "50" });
    expect(recommendationService.getSuggestions).toHaveBeenCalledWith(
      "user-1", "999", undefined, 12, undefined
    );
  });
});
