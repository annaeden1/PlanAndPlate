import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { Recipe } from "../models/recipeModel";
import { MealPlan } from "../models/mealPlanModel";
import { UserFavorites } from "../models/userFavoritesModel";
import { getAiProvider } from "../ai/aiProvider";
import { buildEmbeddingText } from "../recommendation/embeddingText";
import { calcTargets } from "../utils/calorieCalculator";
import {
  DEMO_PROFILES,
  DemoProfile,
  ProfileKey,
  SEED_RECIPES,
  SeedRecipe,
  SeedRecipeDoc,
  Slot,
} from "./seedData";

const WEEKS = 8; // >= 6 required
const WEEKS_IN_PAST = 6; // history behind "today", remainder in the near future

export interface SeedResult {
  profile: ProfileKey;
  email: string;
  userId: string;
  created: boolean;
  recipesUpserted: number;
  embeddingsComputed: number;
  weeklyPlans: number;
  likedRecipes: number;
  dailyCalorieTarget: number | null;
}

// ---------------------------------------------------------------------------
// User resolution.
//
// The `users` collection is owned by the userManagement service (a separate
// package with its own mongoose instance), so we do NOT import/redefine its
// model here — that would register a schema on a second, unconnected mongoose.
// Instead we touch the collection through the raw driver on this connection:
// link by email, create if missing, no password/service dependency.
// ---------------------------------------------------------------------------

const usersCollection = () => mongoose.connection.collection("users");

/** Find the real account by email; create it if missing. Returns id + whether created. */
async function resolveUser(
  profile: DemoProfile,
): Promise<{ userId: string; created: boolean }> {
  const users = usersCollection();
  const existing = await users.findOne({ email: profile.email });
  if (existing) {
    return { userId: existing._id.toString(), created: false };
  }

  const passwordHash = await bcrypt.hash(profile.password, 10);
  const res = await users.insertOne({
    name: profile.name,
    email: profile.email,
    passwordHash,
    tokens: [],
  });
  return { userId: res.insertedId.toString(), created: true };
}

/** Write the demo preferences straight onto the user document. */
async function applyPreferences(
  userId: string,
  profile: DemoProfile,
): Promise<void> {
  await usersCollection().updateOne(
    { _id: new mongoose.Types.ObjectId(userId) },
    { $set: { preferences: profile.preferences } },
  );
}

// ---------------------------------------------------------------------------
// Recipe materialization (concrete docs, per profile)
// ---------------------------------------------------------------------------

interface ConcreteRecipe {
  doc: SeedRecipeDoc;
  meta: SeedRecipe["meta"];
}

/** Resolve the shared + this-profile-owned recipes into concrete docs, rewriting
 *  manual recipe ids/ownership to the target user. */
function materializeRecipes(
  userId: string,
  profileKey: ProfileKey,
): ConcreteRecipe[] {
  const out: ConcreteRecipe[] = [];
  for (const { doc, meta } of SEED_RECIPES) {
    if (doc.source === "manual") {
      if (meta.owner !== profileKey) continue;
      out.push({
        meta,
        doc: {
          ...doc,
          originRecipeId: `${userId}-${doc.originRecipeId}`,
        },
      });
    } else {
      out.push({ meta, doc });
    }
  }
  return out;
}

/** Rewrite a profile's liked ids to concrete ids (manual -> per-user). */
function likedConcreteIds(userId: string, profile: DemoProfile): string[] {
  return profile.likedRecipeIds.map((id) =>
    id.startsWith("manual-") ? `${userId}-${id}` : id,
  );
}

/** Upsert recipes, always recomputing embeddings from the current doc content.
 *  (Ids are reused across seed runs, so a stale embedding from an older catalog
 *  entry with the same id must NOT survive — the taste vector depends on it.) */
async function upsertRecipes(
  recipes: ConcreteRecipe[],
  userId: string,
): Promise<{ upserted: number; embedded: number }> {
  const provider = getAiProvider();

  const vectors = await provider.embed(
    recipes.map((r) =>
      buildEmbeddingText({
        name: r.doc.name,
        cuisines: r.doc.cuisines,
        dishTypes: r.doc.dishTypes,
        diets: r.doc.diets,
        ingredients: r.doc.instructions.ingredients.map((i) => ({
          name: i.name,
        })),
      }),
    ),
  );

  let embedded = 0;
  for (let i = 0; i < recipes.length; i++) {
    const { doc } = recipes[i];
    const embedding = vectors[i] ?? [];
    const set: Record<string, unknown> = { ...doc };
    // Manual recipes are owned; spoonacular ones are shared (no userId).
    if (doc.source === "manual") set.userId = userId;
    if (embedding.length) {
      set.embedding = embedding;
      embedded++;
    }
    await Recipe.updateOne(
      { originRecipeId: doc.originRecipeId },
      { $set: set },
      { upsert: true },
    );
  }
  return { upserted: recipes.length, embedded };
}

// ---------------------------------------------------------------------------
// Plan generation (matches the user's calorie / protein targets)
// ---------------------------------------------------------------------------

function isEligible(r: ConcreteRecipe, profile: DemoProfile): boolean {
  const diet = profile.preferences.diet.map((d) => d.toLowerCase());
  const allergies = profile.preferences.allergies.map((a) => a.toLowerCase());

  if (allergies.includes("nuts") && !r.meta.nutFree) return false;
  if (diet.includes("vegan") && !r.doc.diets.includes("vegan")) return false;
  if (diet.includes("vegetarian") && !r.meta.vegetarian) return false;
  if (diet.includes("pescatarian") && !r.meta.pescatarian) return false;
  return true;
}

const hasSlot = (r: ConcreteRecipe, slot: Slot): boolean =>
  r.meta.slots.includes(slot);

const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

interface DayPick {
  breakfast: ConcreteRecipe;
  lunch: ConcreteRecipe;
  dinner: ConcreteRecipe;
  calories: number;
  protein: number;
}

/** Pick 3 distinct meals for a day, biased toward the calorie/protein targets. */
function pickDay(
  breakfasts: ConcreteRecipe[],
  mains: ConcreteRecipe[],
  targetCalories: number,
  proteinFloor: number,
): DayPick {
  let best: DayPick | null = null;
  for (let attempt = 0; attempt < 25; attempt++) {
    const breakfast = rand(breakfasts);
    let lunch = rand(mains);
    let dinner = rand(mains);
    let guard = 0;
    while (dinner.doc.originRecipeId === lunch.doc.originRecipeId && guard++ < 10) {
      dinner = rand(mains);
    }
    const calories =
      breakfast.doc.calories + lunch.doc.calories + dinner.doc.calories;
    const protein =
      breakfast.doc.protein + lunch.doc.protein + dinner.doc.protein;

    // Score: closeness to calorie target, penalise missing the protein floor.
    const calScore = Math.abs(calories - targetCalories);
    const proteinPenalty = protein >= proteinFloor ? 0 : (proteinFloor - protein) * 15;
    const score = calScore + proteinPenalty;

    if (!best || score < (best as DayPick & { _score?: number })._score!) {
      best = Object.assign({ breakfast, lunch, dinner, calories, protein }, {
        _score: score,
      });
    }
  }
  return best!;
}

const mealSlot = (r: ConcreteRecipe) => ({
  recipeId: r.doc.originRecipeId,
  name: r.doc.name,
  calories: r.doc.calories,
  image: r.doc.image,
});

/** Sunday (UTC) of the week containing `d`, at 00:00:00 UTC. */
function utcSunday(d: Date): Date {
  const s = new Date(d);
  s.setUTCHours(0, 0, 0, 0);
  s.setUTCDate(s.getUTCDate() - s.getUTCDay());
  return s;
}

async function generatePlans(
  userId: string,
  profile: DemoProfile,
  recipes: ConcreteRecipe[],
): Promise<{ weeklyPlans: number; dailyCalorieTarget: number | null }> {
  const targets = calcTargets(
    profile.preferences.bodyStats,
    profile.preferences.healthGoal,
  );
  const targetCalories = targets?.targetCalories ?? 2000;
  const proteinFloor = targets?.proteinGramsPerDay ?? 0;

  const eligible = recipes.filter((r) => isEligible(r, profile));
  const breakfasts = eligible.filter((r) => hasSlot(r, "breakfast"));
  const mains = eligible.filter(
    (r) => hasSlot(r, "lunch") || hasSlot(r, "dinner"),
  );
  if (!breakfasts.length || mains.length < 2) {
    throw new Error(
      `Not enough eligible recipes for ${profile.email} (breakfasts=${breakfasts.length}, mains=${mains.length}). Adjust the catalog or preferences.`,
    );
  }

  const firstWeekStart = utcSunday(new Date());
  firstWeekStart.setUTCDate(firstWeekStart.getUTCDate() - WEEKS_IN_PAST * 7);

  let count = 0;
  for (let w = 0; w < WEEKS; w++) {
    const weekStart = new Date(firstWeekStart);
    weekStart.setUTCDate(firstWeekStart.getUTCDate() + w * 7);

    const days = [];
    let cal = 0,
      protein = 0,
      fat = 0,
      carbs = 0;

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setUTCDate(weekStart.getUTCDate() + i);

      const pick = pickDay(breakfasts, mains, targetCalories, proteinFloor);
      days.push({
        date,
        breakfast: mealSlot(pick.breakfast),
        lunch: mealSlot(pick.lunch),
        dinner: mealSlot(pick.dinner),
        proteinTargetMet: pick.protein >= proteinFloor,
      });

      for (const r of [pick.breakfast, pick.lunch, pick.dinner]) {
        cal += r.doc.calories;
        protein += r.doc.protein;
        fat += r.doc.fat;
        carbs += r.doc.carbs;
      }
    }

    await MealPlan.create({
      userId,
      days,
      nutritionSummary: {
        calories: Math.round(cal),
        protein: Math.round(protein),
        fat: Math.round(fat),
        carbs: Math.round(carbs),
      },
    });
    count++;
  }

  return { weeklyPlans: count, dailyCalorieTarget: targets?.targetCalories ?? null };
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export async function seedProfile(profileKey: ProfileKey): Promise<SeedResult> {
  const profile = DEMO_PROFILES[profileKey];

  const { userId, created } = await resolveUser(profile);
  await applyPreferences(userId, profile);

  const recipes = materializeRecipes(userId, profileKey);
  const { upserted, embedded } = await upsertRecipes(recipes, userId);

  // Scoped reset — only this user's plans + favorites. Never touches other users
  // or the shared recipe collection.
  await MealPlan.deleteMany({ userId });
  await UserFavorites.deleteMany({ userId });

  const { weeklyPlans, dailyCalorieTarget } = await generatePlans(
    userId,
    profile,
    recipes,
  );

  const likedIds = likedConcreteIds(userId, profile);
  await UserFavorites.create({ userId, likedRecipeIds: likedIds });

  return {
    profile: profileKey,
    email: profile.email,
    userId,
    created,
    recipesUpserted: upserted,
    embeddingsComputed: embedded,
    weeklyPlans,
    likedRecipes: likedIds.length,
    dailyCalorieTarget,
  };
}

export async function seedTargets(
  target: "man" | "woman" | "both",
): Promise<SeedResult[]> {
  const keys: ProfileKey[] =
    target === "both" ? ["man", "woman"] : [target];
  const results: SeedResult[] = [];
  for (const key of keys) {
    results.push(await seedProfile(key));
  }
  return results;
}
