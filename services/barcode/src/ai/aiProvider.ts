import { type AlternativePromptInput } from '../utils/types/prompts';

export interface AlternativeAiProvider {
  name: string;
  generate(promptInput: AlternativePromptInput): Promise<string | null>;
}

export class NullAlternativeAiProvider implements AlternativeAiProvider {
  name = 'none';

  async generate(): Promise<string | null> {
    return null;
  }
}
