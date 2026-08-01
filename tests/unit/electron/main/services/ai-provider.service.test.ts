import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../../../electron/main/services/log/logger.service.js', () => ({
  loggerService: {
    createLogger: () => ({
      debug: () => undefined,
      error: () => undefined,
      info: () => undefined,
      warn: () => undefined,
    }),
  },
}));
import {
  createProviderChatModel,
  createProviderEmbeddings,
  createProviderReranker,
  type AiProviderModelConfig,
} from '../../../../../electron/main/services/ai-provider.service';
import {
  AI_PROVIDER_DEFAULT_BASE_URLS,
  AI_PROVIDERS,
  type AiProvider,
} from '@shared/ai-provider.constants';

function createConfig(provider: AiProvider, baseUrl: string): AiProviderModelConfig {
  return {
    provider,
    baseUrl,
    apiKey: 'test-api-key',
    model: 'test-model',
  };
}

describe('AI provider model construction', () => {
  it('constructs Azure OpenAI chat and embedding adapters', () => {
    const config = createConfig(
      AI_PROVIDERS.AZURE_OPENAI,
      'https://notes.openai.azure.com/openai/v1',
    );

    expect(createProviderChatModel(config)).toBeDefined();
    expect(createProviderEmbeddings(config)).toBeDefined();
    expect(() => createProviderReranker(config)).toThrow(
      'Provider azure-openai does not support reranking',
    );
  });

  it('constructs Fireworks chat, embedding, and reranking adapters', () => {
    const config = createConfig(
      AI_PROVIDERS.FIREWORKS,
      AI_PROVIDER_DEFAULT_BASE_URLS[AI_PROVIDERS.FIREWORKS],
    );

    expect(createProviderChatModel(config)).toBeDefined();
    expect(createProviderEmbeddings(config)).toBeDefined();
    expect(createProviderReranker(config)).toBeDefined();
  });
});
