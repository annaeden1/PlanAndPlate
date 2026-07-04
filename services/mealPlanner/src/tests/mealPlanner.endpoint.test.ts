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
    createWeeklyPlan: jest.fn(),
    getWeeklyPlan: jest.fn(),
    getDailyPlan: jest.fn(),
    getRecipeDetails: jest.fn(),
    getManualRecipes: jest.fn(),
    createManualRecipe: jest.fn(),
    toggleRecipeLike: jest.fn(),
    getLikedRecipes: jest.fn(),
  },
}));

import { mealPlannerRouter } from "../routes/mealPlannerRouter";
import mealPlannerService from "../services/mealPlannerService";

const app = express();
app.use(express.json());
app.use("/mealPlanner", mealPlannerRouter);

describe("MealPlannerController Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /users/:userId/meal-plans/weekly", () => {
    it("returns 201 with created plan", async () => {
      (mealPlannerService.createWeeklyPlan as jest.Mock).mockResolvedValue({ id: "plan-1" });
      const res = await request(app).post("/mealPlanner/users/user-1/meal-plans/weekly").query({ date: "2023-01-01" });
      expect(res.status).toBe(201);
      expect(res.body).toEqual({ id: "plan-1" });
    });

    it("returns 400 if userId is missing", async () => {
      const res = await request(app).post("/mealPlanner/users/%20/meal-plans/weekly");
      expect(res.status).toBe(400);
    });

    it("returns 500 on error", async () => {
      (mealPlannerService.createWeeklyPlan as jest.Mock).mockRejectedValue(new Error("err"));
      const res = await request(app).post("/mealPlanner/users/user-1/meal-plans/weekly");
      expect(res.status).toBe(500);
    });
  });

  describe("GET /users/:userId/meal-plans", () => {
    it("returns 200 with plan", async () => {
      (mealPlannerService.getWeeklyPlan as jest.Mock).mockResolvedValue({ id: "plan-1" });
      const res = await request(app).get("/mealPlanner/users/user-1/meal-plans").query({ date: "2023-01-01" });
      expect(res.status).toBe(200);
    });

    it("returns 400 if date is missing", async () => {
      const res = await request(app).get("/mealPlanner/users/user-1/meal-plans");
      expect(res.status).toBe(400);
    });

    it("returns 404 if not found", async () => {
      (mealPlannerService.getWeeklyPlan as jest.Mock).mockResolvedValue(null);
      const res = await request(app).get("/mealPlanner/users/user-1/meal-plans").query({ date: "2023-01-01" });
      expect(res.status).toBe(404);
    });

    it("returns 500 on error", async () => {
      (mealPlannerService.getWeeklyPlan as jest.Mock).mockRejectedValue(new Error("err"));
      const res = await request(app).get("/mealPlanner/users/user-1/meal-plans").query({ date: "2023-01-01" });
      expect(res.status).toBe(500);
    });
  });

  describe("GET /users/:userId/meal-plans/day", () => {
    it("returns 200 with day plan", async () => {
      (mealPlannerService.getDailyPlan as jest.Mock).mockResolvedValue({ meals: [] });
      const res = await request(app).get("/mealPlanner/users/user-1/meal-plans/day").query({ date: "2023-01-01" });
      expect(res.status).toBe(200);
    });

    it("returns 400 if date missing", async () => {
      const res = await request(app).get("/mealPlanner/users/user-1/meal-plans/day");
      expect(res.status).toBe(400);
    });

    it("returns 404 if not found", async () => {
      (mealPlannerService.getDailyPlan as jest.Mock).mockResolvedValue(null);
      const res = await request(app).get("/mealPlanner/users/user-1/meal-plans/day").query({ date: "2023-01-01" });
      expect(res.status).toBe(404);
    });

    it("returns 500 on error", async () => {
      (mealPlannerService.getDailyPlan as jest.Mock).mockRejectedValue(new Error("err"));
      const res = await request(app).get("/mealPlanner/users/user-1/meal-plans/day").query({ date: "2023-01-01" });
      expect(res.status).toBe(500);
    });
  });

  describe("GET /recipes/:recipeId", () => {
    it("returns 200 with details", async () => {
      (mealPlannerService.getRecipeDetails as jest.Mock).mockResolvedValue({ id: "recipe-1" });
      const res = await request(app).get("/mealPlanner/recipes/recipe-1");
      expect(res.status).toBe(200);
    });

    it("returns 400 if id invalid", async () => {
      const res = await request(app).get("/mealPlanner/recipes/%20");
      expect(res.status).toBe(400);
    });

    it("returns 404 if not found", async () => {
      (mealPlannerService.getRecipeDetails as jest.Mock).mockResolvedValue(null);
      const res = await request(app).get("/mealPlanner/recipes/recipe-1");
      expect(res.status).toBe(404);
    });

    it("returns 500 on error", async () => {
      (mealPlannerService.getRecipeDetails as jest.Mock).mockRejectedValue(new Error("err"));
      const res = await request(app).get("/mealPlanner/recipes/recipe-1");
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
      (mealPlannerService.getManualRecipes as jest.Mock).mockRejectedValue(new Error("err"));
      const res = await request(app).get("/mealPlanner/recipes/manual");
      expect(res.status).toBe(500);
    });
  });

  describe("POST /recipes", () => {
    it("returns 201 with created recipe", async () => {
      (mealPlannerService.createManualRecipe as jest.Mock).mockResolvedValue({ id: "recipe-1" });
      const res = await request(app).post("/mealPlanner/recipes").send({ name: "Cake" });
      expect(res.status).toBe(201);
    });

    it("returns 400 if payload invalid", async () => {
      const res = await request(app).post("/mealPlanner/recipes").send("");
      expect(res.status).toBe(400);
    });

    it("returns 400 if name missing", async () => {
      const res = await request(app).post("/mealPlanner/recipes").send({ });
      expect(res.status).toBe(400);
    });

    it("returns 500 on error", async () => {
      (mealPlannerService.createManualRecipe as jest.Mock).mockRejectedValue(new Error("err"));
      const res = await request(app).post("/mealPlanner/recipes").send({ name: "Cake" });
      expect(res.status).toBe(500);
    });
  });

  describe("PATCH /recipes/:recipeId/like", () => {
    it("returns 200 with result", async () => {
      (mealPlannerService.toggleRecipeLike as jest.Mock).mockResolvedValue({ liked: true });
      const res = await request(app).patch("/mealPlanner/recipes/recipe-1/like");
      expect(res.status).toBe(200);
    });

    it("returns 400 if invalid id", async () => {
      const res = await request(app).patch("/mealPlanner/recipes/%20/like");
      expect(res.status).toBe(400);
    });

    it("returns 500 on error", async () => {
      (mealPlannerService.toggleRecipeLike as jest.Mock).mockRejectedValue(new Error("err"));
      const res = await request(app).patch("/mealPlanner/recipes/recipe-1/like");
      expect(res.status).toBe(500);
    });
  });

  describe("GET /users/:userId/favorites", () => {
    it("returns 200 with favorites", async () => {
      (mealPlannerService.getLikedRecipes as jest.Mock).mockResolvedValue([]);
      const res = await request(app).get("/mealPlanner/users/user-1/favorites");
      expect(res.status).toBe(200);
    });

    it("returns 400 if userId missing", async () => {
      const res = await request(app).get("/mealPlanner/users/%20/favorites");
      expect(res.status).toBe(400);
    });

    it("returns 500 on error", async () => {
      (mealPlannerService.getLikedRecipes as jest.Mock).mockRejectedValue(new Error("err"));
      const res = await request(app).get("/mealPlanner/users/user-1/favorites");
      expect(res.status).toBe(500);
    });
  });
});
