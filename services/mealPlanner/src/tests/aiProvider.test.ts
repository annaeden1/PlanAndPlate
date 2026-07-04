import { getAiProvider, NullAiProvider, __setAiProvider } from "../ai/aiProvider";

describe("aiProvider - getAiProvider()", () => {
  beforeEach(() => {
    // Reset the cached provider between tests
    __setAiProvider(null);
    delete process.env.AI_PROVIDER;
    delete process.env.GEMINI_API_KEY;
    delete process.env.COHERE_API_KEY;
  });

  afterEach(() => {
    __setAiProvider(null);
  });

  it("returns NullAiProvider when no env vars are set", () => {
    const provider = getAiProvider();
    expect(provider).toBeInstanceOf(NullAiProvider);
  });

  it("returns cached provider on second call", () => {
    const first = getAiProvider();
    const second = getAiProvider();
    expect(first).toBe(second);
  });

  it("returns a provider with AI_PROVIDER=gemini and GEMINI_API_KEY set", () => {
    process.env.AI_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "test-gemini-key";
    // Just verify it doesn't throw and returns an object with embed()
    const provider = getAiProvider();
    expect(provider).toHaveProperty("embed");
  });

  it("returns a provider with AI_PROVIDER=cohere and COHERE_API_KEY set", () => {
    process.env.AI_PROVIDER = "cohere";
    process.env.COHERE_API_KEY = "test-cohere-key";
    const provider = getAiProvider();
    expect(provider).toHaveProperty("embed");
  });

  it("falls back to NullAiProvider when AI_PROVIDER=gemini but no GEMINI_API_KEY", () => {
    process.env.AI_PROVIDER = "gemini";
    // GEMINI_API_KEY intentionally not set
    const provider = getAiProvider();
    expect(provider).toBeInstanceOf(NullAiProvider);
  });

  it("falls back to NullAiProvider when AI_PROVIDER=cohere but no COHERE_API_KEY", () => {
    process.env.AI_PROVIDER = "cohere";
    // COHERE_API_KEY intentionally not set
    const provider = getAiProvider();
    expect(provider).toBeInstanceOf(NullAiProvider);
  });
});

describe("NullAiProvider", () => {
  it("embed() returns empty arrays matching input length", async () => {
    const provider = new NullAiProvider();
    const result = await provider.embed(["text1", "text2", "text3"]);
    expect(result).toEqual([[], [], []]);
  });

  it("embed() with empty input returns empty array", async () => {
    const provider = new NullAiProvider();
    const result = await provider.embed([]);
    expect(result).toEqual([]);
  });
});
