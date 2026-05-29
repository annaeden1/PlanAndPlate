// services/mealPlanner/src/ai/geminiProvider.ts
import { GoogleGenAI } from "@google/genai";
import { AiProvider } from "./aiProvider";

const EMBED_MODEL = "gemini-embedding-001"; // text-only, 3072-dim
const TEXT_MODEL = "gemini-2.0-flash";

export class GeminiProvider implements AiProvider {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async embed(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      try {
        const res = await this.ai.models.embedContent({
          model: EMBED_MODEL,
          contents: text,
          config: { taskType: "SEMANTIC_SIMILARITY" },
        });
        results.push(res.embeddings?.[0]?.values ?? []);
      } catch (err) {
        console.error("Gemini embed failed for text:", err);
        results.push([]);
      }
    }
    return results;
  }

  async explain(
    profileCuisines: string[],
    candidates: { originRecipeId: string; name: string }[],
  ): Promise<Record<string, string>> {
    const prompt =
      `A user enjoys ${profileCuisines.join(", ") || "varied"} food. ` +
      `For each recipe below, write a short (max 12 words) reason it fits them. ` +
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
}
