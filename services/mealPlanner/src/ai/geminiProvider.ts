// services/mealPlanner/src/ai/geminiProvider.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AiProvider } from "./aiProvider";

export class GeminiProvider implements AiProvider {
  private model;
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
  }

  async embed(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      try {
        const res = await this.model.embedContent(text);
        results.push(res.embedding.values);
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
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt =
      `A user enjoys ${profileCuisines.join(", ") || "varied"} food. ` +
      `For each recipe below, write a short (max 12 words) reason it fits them. ` +
      `Return JSON object mapping id to reason.\n` +
      candidates.map((c) => `${c.originRecipeId}: ${c.name}`).join("\n");
    try {
      const res = await model.generateContent(prompt);
      const text = res.response.text().replace(/```json|```/g, "").trim();
      return JSON.parse(text);
    } catch (err) {
      console.error("Gemini explain failed:", err);
      return {};
    }
  }
}
