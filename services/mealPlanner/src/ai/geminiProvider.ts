// services/mealPlanner/src/ai/geminiProvider.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AiProvider } from "./aiProvider";

export class GeminiProvider implements AiProvider {
  private model;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: "text-embedding-004" });
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
}
