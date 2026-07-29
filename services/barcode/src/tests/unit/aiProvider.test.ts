import { describe, expect, it } from '@jest/globals';
import { NullAlternativeAiProvider } from '../../ai/aiProvider';

describe('NullAlternativeAiProvider', () => {
  it('generate returns null', async () => {
    const provider = new NullAlternativeAiProvider();

    const result = await provider.generate();

    expect(result).toBeNull();
  });
});
