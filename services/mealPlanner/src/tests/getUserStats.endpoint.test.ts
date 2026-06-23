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
    getUserStats: jest.fn(async (userId: string) => {
      if (userId === "user-1") {
        return { weeksActive: 4, mealsLogged: 32 };
      }
      return null;
    }),
  },
}));

import { mealPlannerRouter } from "../routes/mealPlannerRouter";
import mealPlannerService from "../services/mealPlannerService";

const app = express();
app.use(express.json());
app.use("/mealPlanner", mealPlannerRouter);

describe("GET /mealPlanner/users/:userId/stats", () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => jest.restoreAllMocks());

  it("returns user stats for the authenticated user", async () => {
    const res = await request(app)
      .get("/mealPlanner/users/user-1/stats");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ weeksActive: 4, mealsLogged: 32 });
    expect(mealPlannerService.getUserStats).toHaveBeenCalledWith("user-1");
  });

  it("returns 403 when requesting stats for a different user", async () => {
    const res = await request(app)
      .get("/mealPlanner/users/other-user/stats");

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
    expect(mealPlannerService.getUserStats).not.toHaveBeenCalled();
  });

  it("returns 500 when the service throws an error", async () => {
    (mealPlannerService.getUserStats as jest.Mock).mockRejectedValueOnce(new Error("DB Connection Error"));

    const res = await request(app)
      .get("/mealPlanner/users/user-1/stats");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to fetch user stats");
  });
});
