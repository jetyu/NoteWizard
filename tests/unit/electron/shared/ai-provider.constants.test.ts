import { describe, expect, it } from 'vitest';
import {
  AI_PROVIDER_DEFAULT_BASE_URLS,
  AI_PROVIDERS,
  getAiProviderCapabilities,
  inferAiProvider,
  isAiProvider,
} from '@shared/ai-provider.constants';

describe('AI provider constants', () => {
  it('defines Azure OpenAI and Fireworks AI provider defaults and capabilities', () => {
    expect(isAiProvider(AI_PROVIDERS.AZURE_OPENAI)).toBe(true);
    expect(isAiProvider(AI_PROVIDERS.FIREWORKS)).toBe(true);
    expect(AI_PROVIDER_DEFAULT_BASE_URLS[AI_PROVIDERS.AZURE_OPENAI]).toBe('');
    expect(AI_PROVIDER_DEFAULT_BASE_URLS[AI_PROVIDERS.FIREWORKS])
      .toBe('https://api.fireworks.ai/inference/v1');
    expect(getAiProviderCapabilities(AI_PROVIDERS.AZURE_OPENAI)).toEqual(['chat', 'embedding']);
    expect(getAiProviderCapabilities(AI_PROVIDERS.FIREWORKS))
      .toEqual(['chat', 'embedding', 'reranker']);
  });

  it('infers Fireworks AI from its public API hostname', () => {
    expect(inferAiProvider('https://api.fireworks.ai/inference/v1'))
      .toBe(AI_PROVIDERS.FIREWORKS);
  });

  it.each([
    'https://notes.openai.azure.com/openai/v1',
    'https://notes.openai.azure.com/openai/v1/',
    'https://notes.services.ai.azure.com/openai/v1',
  ])('infers Azure OpenAI from a supported v1 endpoint: %s', (baseUrl) => {
    expect(inferAiProvider(baseUrl)).toBe(AI_PROVIDERS.AZURE_OPENAI);
  });

  it('does not infer Azure OpenAI for a non-OpenAI Foundry endpoint', () => {
    expect(inferAiProvider('https://notes.services.ai.azure.com/anthropic'))
      .toBe(AI_PROVIDERS.OPENAI_COMPATIBLE);
  });
});
