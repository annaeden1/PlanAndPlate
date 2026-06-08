import express from "express";
import request from "supertest";

jest.mock("../middlewares/auth.middleware", () => ({
  __esModule: true,
  default: (req: any, _res: any, next: any) => {
    req.user = { _id: "user-1" };
    next();
  },
}));

jest.mock("../services/mealPlannerService", () => ({
  __esModule: true,
  default: {
    replaceMeal: jest.fn(async (_u: string, _d: string, mealType: string) =>
      mealType === "dinner"
        ? { date: "2026-05-31", dinner: { recipeId: "222", name: "Gyoza", calories: 400 } }
        : null,
    ),
  },
}));

import { mealPlannerRouter } from "../routes/mealPlannerRouter";
import mealPlannerService from "../services/mealPlannerService";

const app = express();
app.use(express.json());
app.use("/mealPlanner", mealPlannerRouter);

describe("PATCH /mealPlanner/users/:userId/meal-plans/day/meal", () => {
  it("replaces the slot and returns the updated day", async () => {
    const res = await request(app)
      .patch("/mealPlanner/users/user-1/meal-plans/day/meal")
      .send({ date: "2026-05-31", mealType: "dinner", newRecipeId: "222" });

    expect(res.status).toBe(200);
    expect(res.body.dinner.recipeId).toBe("222");
    expect(mealPlannerService.replaceMeal).toHaveBeenCalledWith(
      "user-1",
      "2026-05-31",
      "dinner",
      "222",
    );
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await request(app)
      .patch("/mealPlanner/users/user-1/meal-plans/day/meal")
      .send({ mealType: "dinner" }); // missing date and newRecipeId
    expect(res.status).toBe(400);
  });

  it("returns 400 for an invalid mealType", async () => {
    const res = await request(app)
      .patch("/mealPlanner/users/user-1/meal-plans/day/meal")
      .send({ date: "2026-05-31", mealType: "brunch", newRecipeId: "222" });
    expect(res.status).toBe(400);
  });

  it("returns 400 for an invalid date", async () => {
    const res = await request(app)
      .patch("/mealPlanner/users/user-1/meal-plans/day/meal")
      .send({ date: "not-a-date", mealType: "dinner", newRecipeId: "222" });
    expect(res.status).toBe(400);
  });

  it("returns 403 when userId does not match the authenticated user", async () => {
    const res = await request(app)
      .patch("/mealPlanner/users/other-user/meal-plans/day/meal")
      .send({ date: "2026-05-31", mealType: "dinner", newRecipeId: "222" });
    expect(res.status).toBe(403);
  });

  it("returns 404 when the plan/day is missing", async () => {
    const res = await request(app)
      .patch("/mealPlanner/users/user-1/meal-plans/day/meal")
      .send({ date: "2026-05-31", mealType: "lunch", newRecipeId: "222" });
    expect(res.status).toBe(404);
  });

  it("returns 500 when the service throws", async () => {
    (mealPlannerService.replaceMeal as jest.Mock).mockRejectedValueOnce(new Error("DB error"));
    const res = await request(app)
      .patch("/mealPlanner/users/user-1/meal-plans/day/meal")
      .send({ date: "2026-05-31", mealType: "dinner", newRecipeId: "222" });
    expect(res.status).toBe(500);
  });
});
