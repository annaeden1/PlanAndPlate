import { CohereClient } from "cohere-ai";
import { AiProvider, ExplainProfile } from "./aiProvider";

const EMBED_MODEL = "embed-english-v3.0";
const TEXT_MODEL = "command-r-08-2024";

export class CohereProvider implements AiProvider {
  private cohere: CohereClient;

  constructor(apiKey: string) {
    this.cohere = new CohereClient({ token: apiKey });
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (!texts.length) return [];
    try {
      const res = await this.cohere.embed({
        model: EMBED_MODEL,
        texts,
        inputType: "search_document",
        embeddingTypes: ["float"],
      });
      const embeddings = res.embeddings as { float?: number[][] };
      return embeddings.float ?? [];
    } catch (err) {
      console.error("Cohere embed failed:", err);
      return texts.map(() => []);
    }
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
      const res = await this.cohere.chat({
        model: TEXT_MODEL,
        message: prompt,
      });
      const text = (res.text ?? "").replace(/```json|```/g, "").trim();
      return JSON.parse(text);
    } catch (err) {
      console.error("Cohere explain failed:", err);
      return {};
    }
  }
}
