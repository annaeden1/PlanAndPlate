import { rankCandidates, RankCandidate } from "../recommendation/ranker";

const cand = (id: string, embedding: number[]): RankCandidate => ({
  originRecipeId: id,
  name: `recipe ${id}`,
  embedding,
});

describe("rankCandidates", () => {
  it("orders by cosine similarity to the centroid, descending", () => {
    const result = rankCandidates({
      candidates: [cand("a", [0, 1]), cand("b", [1, 0]), cand("c", [0.9, 0.1])],
      centroid: [1, 0],
      excludeIds: [],
      limit: 3,
    });
    expect(result.map((r) => r.originRecipeId)).toEqual(["b", "c", "a"]);
    expect(result[0].score).toBeCloseTo(1);
  });

  it("excludes given ids and respects the limit", () => {
    const result = rankCandidates({
      candidates: [cand("a", [1, 0]), cand("b", [1, 0]), cand("c", [1, 0])],
      centroid: [1, 0],
      excludeIds: ["a"],
      limit: 1,
    });
    expect(result).toHaveLength(1);
    expect(result[0].originRecipeId).not.toBe("a");
  });

  it("preserves order with score 0 when the centroid is empty", () => {
    const result = rankCandidates({
      candidates: [cand("a", []), cand("b", [])],
      centroid: [],
      excludeIds: [],
      limit: 2,
    });
    expect(result.map((r) => r.originRecipeId)).toEqual(["a", "b"]);
    expect(result[0].score).toBe(0);
  });
});
