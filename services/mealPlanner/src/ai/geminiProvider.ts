import { GoogleGenAI } from "@google/genai";
import { AiProvider, ExplainProfile } from "./aiProvider";

const EMBED_MODEL = "gemini-embedding-001"; // text-only, 3072-dim
const TEXT_MODEL = "gemini-2.0-flash";

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
            config: { taskType: "SEMANTIC_SIMILARITY" },
          });
          return res.embeddings?.[0]?.values ?? [];
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
    parts.push(`A user enjoys ${profile.cuisines.join(", ") || "varied"} cuisine.`);
    if (profile.diet) parts.push(`They follow a ${profile.diet} diet.`);
    if (profile.healthGoal) parts.push(`Their health goal is: ${profile.healthGoal}.`);
    if (profile.allergies) parts.push(`They are allergic to: ${profile.allergies}.`);
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
}
