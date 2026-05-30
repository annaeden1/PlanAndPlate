import { cosineSimilarity, meanVector } from "../recommendation/vectorMath";

describe("cosineSimilarity", () => {
  it("returns 1 for identical direction", () => {
    expect(cosineSimilarity([1, 0], [2, 0])).toBeCloseTo(1);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it("returns 0 when either vector is empty or zero-length", () => {
    expect(cosineSimilarity([], [1, 2])).toBe(0);
    expect(cosineSimilarity([0, 0], [1, 2])).toBe(0);
  });

  it("returns 0 when lengths differ", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2])).toBe(0);
  });
});

describe("meanVector", () => {
  it("averages component-wise", () => {
    expect(meanVector([[2, 4], [4, 8]])).toEqual([3, 6]);
  });

  it("returns [] for empty input", () => {
    expect(meanVector([])).toEqual([]);
  });
});
