/**
 * Console runner for the demo seeding — the same logic the admin HTTP endpoint
 * uses, runnable directly on the server without the service being up.
 *
 * Usage (from services/mealPlanner):
 *   npm run seed:mock              # seeds both profiles
 *   npm run seed:mock -- man       # only the man
 *   npm run seed:mock -- woman     # only the woman
 *
 * It connects to MONGODB_URI from this service's .env and resolves the users by
 * email (creating them if missing), so it is fully self-contained.
 */
import dotenv from "dotenv";
import path from "path";

// Load env before anything reads it (models / AI provider).
dotenv.config({ path: path.join(__dirname, "../../.env") });

import mongoose from "mongoose";
import { seedTargets } from "./seedService";

async function main() {
  const arg = (process.argv[2] ?? "both").toLowerCase();
  const target =
    arg === "man" || arg === "woman" || arg === "both" ? arg : "both";

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  console.log(`Connecting to ${uri} ...`);
  await mongoose.connect(uri);
  console.log(`Connected. Seeding target: ${target}`);

  const results = await seedTargets(target as "man" | "woman" | "both");
  console.table(
    results.map((r) => ({
      profile: r.profile,
      email: r.email,
      userId: r.userId,
      created: r.created,
      recipes: r.recipesUpserted,
      embeddings: r.embeddingsComputed,
      weeklyPlans: r.weeklyPlans,
      liked: r.likedRecipes,
      dailyCalTarget: r.dailyCalorieTarget,
    })),
  );

  await mongoose.disconnect();
  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
