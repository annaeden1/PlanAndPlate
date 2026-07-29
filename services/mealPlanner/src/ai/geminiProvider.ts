import { GoogleGenAI } from "@google/genai";
import { AiProvider, ExplainProfile } from "./aiProvider";
import {
  NutritionEstimate,
  NutritionRecipeInput,
  buildNutritionPrompt,
} from "./nutritionPrompt";

const EMBED_MODEL = "gemini-embedding-001"; // text-only, Matryoshka (768–3072)
const EMBED_DIM = 768; // < 3072 → returned unnormalized, so we L2-normalize below
const TEXT_MODEL = "gemini-2.0-flash";

function l2normalize(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return norm > 0 ? v.map((x) => x / norm) : v;
}

export class GeminiProvider implements AiProvider {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async embed(texts: string[]): Promise<number[][]> {
    return Promise.all(
      texts.map(async (text) => {
        try {
          const res = await this.ai.models.embedContent({
            model: EMBED_MODEL,
            contents: text,
            config: {
              taskType: "SEMANTIC_SIMILARITY",
              outputDimensionality: EMBED_DIM,
            },
          });
          const values = res.embeddings?.[0]?.values ?? [];
          return values.length ? l2normalize(values) : [];
        } catch (err) {
          console.error("Gemini embed failed for text:", err);
          return [];
        }
      }),
    );
  }

  async explain(
    profile: ExplainProfile,
    candidates: { originRecipeId: string; name: string }[],
  ): Promise<Record<string, string>> {
    const parts: string[] = [];
    parts.push(
      `A user enjoys ${profile.cuisines.join(", ") || "varied"} cuisine.`,
    );
    if (profile.diet) parts.push(`They follow a ${profile.diet} diet.`);
    if (profile.healthGoal)
      parts.push(`Their health goal is: ${profile.healthGoal}.`);
    if (profile.allergies)
      parts.push(`They are allergic to: ${profile.allergies}.`);
    const prompt =
      parts.join(" ") +
      ` For each recipe below, write a short (max 12 words) reason it fits them. ` +
      `Return JSON object mapping id to reason.\n` +
      candidates.map((c) => `${c.originRecipeId}: ${c.name}`).join("\n");
    try {
      const res = await this.ai.models.generateContent({
        model: TEXT_MODEL,
        contents: prompt,
      });
      const text = (res.text ?? "").replace(/```json|```/g, "").trim();
      return JSON.parse(text);
    } catch (err) {
      console.error("Gemini explain failed:", err);
      return {};
    }
  }

  async estimateNutrition(
    recipe: NutritionRecipeInput,
  ): Promise<NutritionEstimate | null> {
    const prompt = buildNutritionPrompt(recipe);
    try {
      const res = await this.ai.models.generateContent({
        model: TEXT_MODEL,
        contents: prompt,
      });
      const text = (res.text ?? "").replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(text);
      if (
        typeof parsed.calories === "number" &&
        typeof parsed.protein === "number" &&
        typeof parsed.fat === "number" &&
        typeof parsed.carbs === "number"
      ) {
        return {
          calories: Math.round(parsed.calories * 10) / 10,
          protein: Math.round(parsed.protein * 10) / 10,
          fat: Math.round(parsed.fat * 10) / 10,
          carbs: Math.round(parsed.carbs * 10) / 10,
        };
      }
      console.warn("Gemini nutrition response has unexpected shape:", parsed);
      return null;
    } catch (err) {
      console.error("Gemini estimateNutrition failed:", err);
      return null;
    }
  }
}
