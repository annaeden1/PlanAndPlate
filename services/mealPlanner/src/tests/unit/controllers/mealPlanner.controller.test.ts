import express from "express";
import request from "supertest";

const USER_ID = "user-1";
const ANOTHER_USER_ID = "user-1-abc";
const UNKNOWN_USER_ID = "unknown-id";

jest.mock("../../../middlewares/auth.middleware", () => ({
  __esModule: true,
  default: (req: any, _res: any, next: any) => {
    req.user = { _id: USER_ID };
    next();
  },
}));

const mockUpdatedRecipe = {
  originRecipeId: ANOTHER_USER_ID,
  name: "Updated",
  source: "manual",
};

jest.mock("../../../services/mealPlannerService", () => ({
  __esModule: true,
  default: {
    createWeeklyPlan: jest.fn(),
    getWeeklyPlan: jest.fn(),
    getDailyPlan: jest.fn(),
    getRecipeDetails: jest.fn(),
    getManualRecipes: jest.fn(),
    createManualRecipe: jest.fn(),
    toggleRecipeLike: jest.fn(),
    getLikedRecipes: jest.fn(),
    updateManualRecipe: jest.fn(),
    deleteManualRecipe: jest.fn(),
    getUserStats: jest.fn(async (userId: string) => {
      if (userId === "user-1") {
        return { weeksActive: 4, mealsLogged: 32 };
      }
      return null;
    }),
    replaceMeal: jest.fn(async (_u: string, _d: string, mealType: string) =>
      mealType === "dinner"
        ? {
            date: "2026-05-31",
            dinner: {
              recipeId: "222",
              name: "Gyoza",
              calories: 400,
              image: "gyoza.jpg",
            },
          }
        : null,
    ),
  },
}));

import { mealPlannerRouter } from "../../../routes/mealPlannerRouter";
import mealPlannerService from "../../../services/mealPlannerService";

const app = express();
app.use(express.json());
app.use("/mealPlanner", mealPlannerRouter);

const MEAL_PLANNER_USERS_URL = "/mealPlanner/users";
const MEAL_PLANNER_USER_URL = `${MEAL_PLANNER_USERS_URL}/${USER_ID}`;
const MEAL_PLANS_URL = `${MEAL_PLANNER_USER_URL}/meal-plans`;
const WEEKLY_MEAL_PLAN_URL = `${MEAL_PLANS_URL}/weekly`;
const DAILY_MEAL_PLAN_URL = `${MEAL_PLANS_URL}/day`;
const REPLACE_DAILY_MEAL_PLAN_URL = `${DAILY_MEAL_PLAN_URL}/meal`;
const FAVORITES_URL = `${MEAL_PLANNER_USER_URL}/favorites`;
const RECIPES_URL = "/mealPlanner/recipes";
const RECIPE_URL = `${RECIPES_URL}/recipe-1`;
const RECIPE_URL_ANOTHER_USER = `${RECIPES_URL}/${ANOTHER_USER_ID}`;
const RECIPE_URL_UNKNOWN_USER = `${RECIPES_URL}/${UNKNOWN_USER_ID}`;
const STATS_URL = `${MEAL_PLANNER_USER_URL}/stats`;

describe("MealPlannerController Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(() => jest.restoreAllMocks());

  describe("POST /users/:userId/meal-plans/weekly", () => {
    it("returns 201 with created plan", async () => {
      (mealPlannerService.createWeeklyPlan as jest.Mock).mockResolvedValue({
        id: "plan-1",
      });
      const res = await request(app)
        .post(WEEKLY_MEAL_PLAN_URL)
        .query({ date: "2023-01-01" });
      expect(res.status).toBe(201);
      expect(res.body).toEqual({ id: "plan-1" });
    });

    it("returns 400 if userId is missing", async () => {
      const res = await request(app).post(
        `${MEAL_PLANNER_USERS_URL}/%20/meal-plans/weekly`,
      );
      expect(res.status).toBe(400);
    });

    it("returns 500 on error", async () => {
      (mealPlannerService.createWeeklyPlan as jest.Mock).mockRejectedValue(
        new Error("err"),
      );
      const res = await request(app).post(WEEKLY_MEAL_PLAN_URL);
      expect(res.status).toBe(500);
    });
  });

  describe("GET /users/:userId/meal-plans", () => {
    it("returns 200 with plan", async () => {
      (mealPlannerService.getWeeklyPlan as jest.Mock).mockResolvedValue({
        id: "plan-1",
      });
      const res = await request(app)
        .get(MEAL_PLANS_URL)
        .query({ date: "2023-01-01" });
      expect(res.status).toBe(200);
    });

    it("returns 400 if date is missing", async () => {
      const res = await request(app).get(MEAL_PLANS_URL);
      expect(res.status).toBe(400);
    });

    it("returns 404 if not found", async () => {
      (mealPlannerService.getWeeklyPlan as jest.Mock).mockResolvedValue(null);
      const res = await request(app)
        .get(MEAL_PLANS_URL)
        .query({ date: "2023-01-01" });
      expect(res.status).toBe(404);
    });

    it("returns 500 on error", async () => {
      (mealPlannerService.getWeeklyPlan as jest.Mock).mockRejectedValue(
        new Error("err"),
      );
      const res = await request(app)
        .get(MEAL_PLANS_URL)
        .query({ date: "2023-01-01" });
      expect(res.status).toBe(500);
    });
  });

  describe("GET /users/:userId/meal-plans/day", () => {
    it("returns 200 with day plan", async () => {
      (mealPlannerService.getDailyPlan as jest.Mock).mockResolvedValue({
        meals: [],
      });
      const res = await request(app)
        .get(DAILY_MEAL_PLAN_URL)
        .query({ date: "2023-01-01" });
      expect(res.status).toBe(200);
    });

    it("returns 400 if date missing", async () => {
      const res = await request(app).get(DAILY_MEAL_PLAN_URL);
      expect(res.status).toBe(400);
    });

    it("returns 404 if not found", async () => {
      (mealPlannerService.getDailyPlan as jest.Mock).mockResolvedValue(null);
      const res = await request(app)
        .get(DAILY_MEAL_PLAN_URL)
        .query({ date: "2023-01-01" });
      expect(res.status).toBe(404);
    });

    it("returns 500 on error", async () => {
      (mealPlannerService.getDailyPlan as jest.Mock).mockRejectedValue(
        new Error("err"),
      );
      const res = await request(app)
        .get(DAILY_MEAL_PLAN_URL)
        .query({ date: "2023-01-01" });
      expect(res.status).toBe(500);
    });
  });

  describe("GET /recipes/:recipeId", () => {
    it("returns 200 with details", async () => {
      (mealPlannerService.getRecipeDetails as jest.Mock).mockResolvedValue({
        id: "recipe-1",
      });
      const res = await request(app).get(RECIPE_URL);
      expect(res.status).toBe(200);
    });

    it("returns 400 if id invalid", async () => {
      const res = await request(app).get(`${RECIPES_URL}/%20`);
      expect(res.status).toBe(400);
    });

    it("returns 404 if not found", async () => {
      (mealPlannerService.getRecipeDetails as jest.Mock).mockResolvedValue(
        null,
      );
      const res = await request(app).get(RECIPE_URL);
      expect(res.status).toBe(404);
    });

    it("returns 500 on error", async () => {
      (mealPlannerService.getRecipeDetails as jest.Mock).mockRejectedValue(
        new Error("err"),
      );
      const res = await request(app).get(RECIPE_URL);
      expect(res.status).toBe(500);
    });
  });

  describe("GET /recipes/manual", () => {
    it("returns 200 with manual recipes", async () => {
      (mealPlannerService.getManualRecipes as jest.Mock).mockResolvedValue([]);
      const res = await request(app).get("/mealPlanner/recipes/manual");
      expect(res.status).toBe(200);
    });

    it("returns 500 on error", async () => {
      (mealPlannerService.getManualRecipes as jest.Mock).mockRejectedValue(
        new Error("err"),
      );
      const res = await request(app).get(`${RECIPES_URL}/manual`);
      expect(res.status).toBe(500);
    });
  });

  describe("POST /recipes", () => {
    it("returns 201 with created recipe", async () => {
      (mealPlannerService.createManualRecipe as jest.Mock).mockResolvedValue({
        id: "recipe-1",
      });
      const res = await request(app).post(RECIPES_URL).send({ name: "Cake" });
      expect(res.status).toBe(201);
    });

    it("returns 400 if payload invalid", async () => {
      const res = await request(app).post(RECIPES_URL).send("");
      expect(res.status).toBe(400);
    });

    it("returns 400 if name missing", async () => {
      const res = await request(app).post(RECIPES_URL).send({});
      expect(res.status).toBe(400);
    });

    it("returns 500 on error", async () => {
      (mealPlannerService.createManualRecipe as jest.Mock).mockRejectedValue(
        new Error("err"),
      );
      const res = await request(app).post(RECIPES_URL).send({ name: "Cake" });
      expect(res.status).toBe(500);
    });
  });

  describe("PATCH /recipes/:recipeId/like", () => {
    it("returns 200 with result", async () => {
      (mealPlannerService.toggleRecipeLike as jest.Mock).mockResolvedValue({
        liked: true,
      });
      const res = await request(app).patch(`${RECIPE_URL}/like`);
      expect(res.status).toBe(200);
    });

    it("returns 400 if invalid id", async () => {
      const res = await request(app).patch(`${RECIPES_URL}/%20/like`);
      expect(res.status).toBe(400);
    });

    it("returns 500 on error", async () => {
      (mealPlannerService.toggleRecipeLike as jest.Mock).mockRejectedValue(
        new Error("err"),
      );
      const res = await request(app).patch(`${RECIPE_URL}/like`);
      expect(res.status).toBe(500);
    });
  });

  describe("GET /users/:userId/favorites", () => {
    it("returns 200 with favorites", async () => {
      (mealPlannerService.getLikedRecipes as jest.Mock).mockResolvedValue([]);
      const res = await request(app).get(FAVORITES_URL);
      expect(res.status).toBe(200);
    });

    it("returns 400 if userId missing", async () => {
      const res = await request(app).get(
        `${MEAL_PLANNER_USERS_URL}/%20/favorites`,
      );
      expect(res.status).toBe(400);
    });

    it("returns 500 on error", async () => {
      (mealPlannerService.getLikedRecipes as jest.Mock).mockRejectedValue(
        new Error("err"),
      );
      const res = await request(app).get(FAVORITES_URL);
      expect(res.status).toBe(500);
    });
  });

  describe("PATCH /mealPlanner/users/:userId/meal-plans/day/meal", () => {
    it("replaces the slot and returns the updated day", async () => {
      const res = await request(app)
        .patch(REPLACE_DAILY_MEAL_PLAN_URL)
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
        .patch(REPLACE_DAILY_MEAL_PLAN_URL)
        .send({ mealType: "dinner" }); // missing date and newRecipeId
      expect(res.status).toBe(400);
    });

    it("returns 400 for an invalid mealType", async () => {
      const res = await request(app)
        .patch(REPLACE_DAILY_MEAL_PLAN_URL)
        .send({ date: "2026-05-31", mealType: "brunch", newRecipeId: "222" });
      expect(res.status).toBe(400);
    });

    it("returns 400 for an invalid date", async () => {
      const res = await request(app)
        .patch(REPLACE_DAILY_MEAL_PLAN_URL)
        .send({ date: "not-a-date", mealType: "dinner", newRecipeId: "222" });
      expect(res.status).toBe(400);
    });

    it("returns 403 when userId does not match the authenticated user", async () => {
      const res = await request(app)
        .patch(`${MEAL_PLANNER_USERS_URL}/other-user/meal-plans/day/meal`)
        .send({ date: "2026-05-31", mealType: "dinner", newRecipeId: "222" });
      expect(res.status).toBe(403);
    });

    it("returns 404 when the plan/day is missing", async () => {
      const res = await request(app)
        .patch(REPLACE_DAILY_MEAL_PLAN_URL)
        .send({ date: "2026-05-31", mealType: "lunch", newRecipeId: "222" });
      expect(res.status).toBe(404);
    });

    it("returns 500 when the service throws", async () => {
      (mealPlannerService.replaceMeal as jest.Mock).mockRejectedValueOnce(
        new Error("DB error"),
      );
      const res = await request(app)
        .patch(REPLACE_DAILY_MEAL_PLAN_URL)
        .send({ date: "2026-05-31", mealType: "dinner", newRecipeId: "222" });
      expect(res.status).toBe(500);
    });
  });

  describe("PUT /mealPlanner/recipes/:recipeId", () => {
    it("returns 200 with updated recipe when owner updates", async () => {
      (mealPlannerService.updateManualRecipe as jest.Mock).mockResolvedValue(
        mockUpdatedRecipe,
      );

      const res = await request(app)
        .put(RECIPE_URL_ANOTHER_USER)
        .send({ name: "Updated" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Updated");
      expect(mealPlannerService.updateManualRecipe).toHaveBeenCalledWith(
        "user-1-abc",
        { name: "Updated" },
        "user-1",
      );
    });

    it("returns 404 when recipe is not found", async () => {
      (mealPlannerService.updateManualRecipe as jest.Mock).mockResolvedValue(
        null,
      );

      const res = await request(app)
        .put(RECIPE_URL_UNKNOWN_USER)
        .send({ name: "X" });

      expect(res.status).toBe(404);
    });

    it("returns 403 when user is not the owner", async () => {
      (mealPlannerService.updateManualRecipe as jest.Mock).mockRejectedValue(
        new Error("FORBIDDEN"),
      );

      const res = await request(app)
        .put(RECIPE_URL_ANOTHER_USER)
        .send({ name: "Hack" });

      expect(res.status).toBe(403);
    });

    it("returns 500 when service throws an unexpected error", async () => {
      (mealPlannerService.updateManualRecipe as jest.Mock).mockRejectedValue(
        new Error("DB error"),
      );

      const res = await request(app)
        .put(RECIPE_URL_ANOTHER_USER)
        .send({ name: "X" });

      expect(res.status).toBe(500);
    });
  });

  describe("DELETE /mealPlanner/recipes/:recipeId", () => {
    it("returns 204 when recipe is successfully deleted", async () => {
      (mealPlannerService.deleteManualRecipe as jest.Mock).mockResolvedValue(
        true,
      );

      const res = await request(app).delete(RECIPE_URL_ANOTHER_USER);

      expect(res.status).toBe(204);
      expect(mealPlannerService.deleteManualRecipe).toHaveBeenCalledWith(
        ANOTHER_USER_ID,
        USER_ID,
      );
    });

    it("returns 404 when recipe is not found", async () => {
      (mealPlannerService.deleteManualRecipe as jest.Mock).mockResolvedValue(
        false,
      );

      const res = await request(app).delete(RECIPE_URL_UNKNOWN_USER);

      expect(res.status).toBe(404);
    });

    it("returns 403 when user is not the owner", async () => {
      (mealPlannerService.deleteManualRecipe as jest.Mock).mockRejectedValue(
        new Error("FORBIDDEN"),
      );

      const res = await request(app).delete(RECIPE_URL_ANOTHER_USER);

      expect(res.status).toBe(403);
    });

    it("returns 500 when service throws an unexpected error", async () => {
      (mealPlannerService.deleteManualRecipe as jest.Mock).mockRejectedValue(
        new Error("DB error"),
      );

      const res = await request(app).delete(RECIPE_URL_ANOTHER_USER);

      expect(res.status).toBe(500);
    });
  });

  describe("GET /mealPlanner/users/:userId/stats", () => {
    it("returns user stats for the authenticated user", async () => {
      const res = await request(app).get(STATS_URL);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ weeksActive: 4, mealsLogged: 32 });
      expect(mealPlannerService.getUserStats).toHaveBeenCalledWith(USER_ID);
    });

    it("returns 403 when requesting stats for a different user", async () => {
      const res = await request(app).get(
        `${MEAL_PLANNER_USERS_URL}/other-user/stats`,
      );

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Forbidden");
      expect(mealPlannerService.getUserStats).not.toHaveBeenCalled();
    });

    it("returns 500 when the service throws an error", async () => {
      (mealPlannerService.getUserStats as jest.Mock).mockRejectedValueOnce(
        new Error("DB Connection Error"),
      );

      const res = await request(app).get(STATS_URL);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Failed to fetch user stats");
    });
  });
});
