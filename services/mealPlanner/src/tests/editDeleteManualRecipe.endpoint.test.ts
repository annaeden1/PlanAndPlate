import express from "express";
import request from "supertest";

jest.mock("../middlewares/auth.middleware", () => ({
  __esModule: true,
  default: (req: any, _res: any, next: any) => {
    req.user = { _id: "user-1" };
    next();
  },
}));

const mockUpdatedRecipe = { originRecipeId: "user-1-abc", name: "Updated", source: "manual" };

jest.mock("../services/mealPlannerService", () => ({
  __esModule: true,
  default: {
    updateManualRecipe: jest.fn(),
    deleteManualRecipe: jest.fn(),
    getUserStats: jest.fn(),
    getLikedRecipes: jest.fn(),
    getManualRecipes: jest.fn(),
    createManualRecipe: jest.fn(),
    getRecipeDetails: jest.fn(),
    toggleRecipeLike: jest.fn(),
  },
}));

import { mealPlannerRouter } from "../routes/mealPlannerRouter";
import mealPlannerService from "../services/mealPlannerService";

const app = express();
app.use(express.json());
app.use("/mealPlanner", mealPlannerRouter);

describe("PUT /mealPlanner/recipes/:recipeId", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 200 with updated recipe when owner updates", async () => {
    (mealPlannerService.updateManualRecipe as jest.Mock).mockResolvedValue(mockUpdatedRecipe);

    const res = await request(app)
      .put("/mealPlanner/recipes/user-1-abc")
      .send({ name: "Updated" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated");
    expect(mealPlannerService.updateManualRecipe).toHaveBeenCalledWith(
      "user-1-abc", { name: "Updated" }, "user-1",
    );
  });

  it("returns 404 when recipe is not found", async () => {
    (mealPlannerService.updateManualRecipe as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .put("/mealPlanner/recipes/unknown-id")
      .send({ name: "X" });

    expect(res.status).toBe(404);
  });

  it("returns 403 when user is not the owner", async () => {
    (mealPlannerService.updateManualRecipe as jest.Mock).mockRejectedValue(new Error("FORBIDDEN"));

    const res = await request(app)
      .put("/mealPlanner/recipes/user-1-abc")
      .send({ name: "Hack" });

    expect(res.status).toBe(403);
  });

  it("returns 500 when service throws an unexpected error", async () => {
    (mealPlannerService.updateManualRecipe as jest.Mock).mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .put("/mealPlanner/recipes/user-1-abc")
      .send({ name: "X" });

    expect(res.status).toBe(500);
  });
});

describe("DELETE /mealPlanner/recipes/:recipeId", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 204 when recipe is successfully deleted", async () => {
    (mealPlannerService.deleteManualRecipe as jest.Mock).mockResolvedValue(true);

    const res = await request(app).delete("/mealPlanner/recipes/user-1-abc");

    expect(res.status).toBe(204);
    expect(mealPlannerService.deleteManualRecipe).toHaveBeenCalledWith("user-1-abc", "user-1");
  });

  it("returns 404 when recipe is not found", async () => {
    (mealPlannerService.deleteManualRecipe as jest.Mock).mockResolvedValue(false);

    const res = await request(app).delete("/mealPlanner/recipes/unknown-id");

    expect(res.status).toBe(404);
  });

  it("returns 403 when user is not the owner", async () => {
    (mealPlannerService.deleteManualRecipe as jest.Mock).mockRejectedValue(new Error("FORBIDDEN"));

    const res = await request(app).delete("/mealPlanner/recipes/user-1-abc");

    expect(res.status).toBe(403);
  });

  it("returns 500 when service throws an unexpected error", async () => {
    (mealPlannerService.deleteManualRecipe as jest.Mock).mockRejectedValue(new Error("DB error"));

    const res = await request(app).delete("/mealPlanner/recipes/user-1-abc");

    expect(res.status).toBe(500);
  });
});
