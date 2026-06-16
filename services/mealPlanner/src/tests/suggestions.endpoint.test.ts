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
    getSuggestions: jest.fn(async () => [
      { originRecipeId: "111", name: "Ramen", calories: 500, score: 0.9 },
    ]),
  },
}));

import { mealPlannerRouter } from "../routes/mealPlannerRouter";
import recommendationService from "../recommendation/recommendationService";

const app = express();
app.use(express.json());
app.use("/mealPlanner", mealPlannerRouter);

describe("GET /mealPlanner/users/:userId/recipes/:recipeId/suggestions", () => {
  it("returns ranked suggestions and forwards params", async () => {
    const res = await request(app)
      .get("/mealPlanner/users/user-1/recipes/999/suggestions")
      .query({ mealType: "dinner", limit: "6" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { originRecipeId: "111", name: "Ramen", calories: 500, score: 0.9 },
    ]);
    expect(recommendationService.getSuggestions).toHaveBeenCalledWith(
      "user-1",
      "999",
      "dinner",
      6,
      undefined,
    );
  });
});
