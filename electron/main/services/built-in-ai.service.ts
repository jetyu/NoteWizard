import { z } from 'zod';
import {
  AI_PROVIDERS,
  type AiCapability,
} from '../../shared/ai-provider.constants.js';
import {
  BUILT_IN_AI_BASE_URL,
  BUILT_IN_AI_CAPABILITIES,
  BUILT_IN_AI_MODELS,
  BUILT_IN_AI_SOURCE_ID,
  BUILT_IN_AI_SOURCE_NAME,
  type BuiltInAiSourceMetadata,
} from '../../shared/built-in-ai.constants.js';
import { $t } from '../utils/i18n.js';
import { mainProcessFetch } from './network.service.js';

const BUILT_IN_AI_KEY_URL = 'https://snaptium.com/key.txt';
const BUILT_IN_AI_AUTH_FAILURE_STATUSES = new Set([401, 403]);

const builtInAiConfigSchema = z.object({
  baseUrl: z.string().url().transform(value => value.replace(/\/+$/, '')),
  apiKey: z.string().trim().min(1).max(512).refine(value => !/\s/.test(value)),
  models: z.object({
    chat: z.string().trim().min(1),
    embedding: z.string().trim().min(1),
    reranker: z.string().trim().min(1),
  }),
});

const builtInAiKeySchema = z.string()
  .trim()
  .min(1)
  .max(512)
  .refine(value => !/\s/.test(value));

export type BuiltInAiConfig = z.infer<typeof builtInAiConfigSchema>;

export interface ResolvedBuiltInAiRequestConfig {
  provider: typeof AI_PROVIDERS.SNAPTIUM;
  baseUrl: string;
  endpoint: string;
  apiKey: string;
  model: string;
}

let cachedBuiltInAiKey: string | null = null;
let builtInAiKeyPromise: Promise<string> | null = null;

export function normalizeBuiltInAiConfig(value: unknown): BuiltInAiConfig {
  return builtInAiConfigSchema.parse(value);
}

export class BuiltInAiRequestError extends Error {
  constructor(cause: unknown) {
    super($t('builtInAi.error.unavailable'), { cause });
    this.name = 'BuiltInAiRequestError';
  }
}

function resolveEndpoint(baseUrl: string, capability: AiCapability): string {
  if (capability === 'chat') {
    return `${baseUrl}/chat/completions`;
  }

  if (capability === 'embedding') {
    return `${baseUrl}/embeddings`;
  }

  return `${baseUrl}/rerank`;
}

async function loadBuiltInAiKey(): Promise<string> {
  if (cachedBuiltInAiKey) {
    return cachedBuiltInAiKey;
  }

  if (builtInAiKeyPromise) {
    return builtInAiKeyPromise;
  }

  builtInAiKeyPromise = (async () => {
    try {
      const response = await mainProcessFetch(BUILT_IN_AI_KEY_URL, {
        method: 'GET',
        headers: { Accept: 'text/plain' },
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const value = builtInAiKeySchema.parse(await response.text());
      cachedBuiltInAiKey = value;
      return value;
    } catch (error) {
      throw error instanceof BuiltInAiRequestError ? error : new BuiltInAiRequestError(error);
    }
  })().finally(() => {
    builtInAiKeyPromise = null;
  });

  return builtInAiKeyPromise;
}

function withBuiltInAiAuthorization(init: RequestInit | undefined, apiKey: string): RequestInit {
  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${apiKey}`);
  return { ...init, headers };
}

export function resolveBuiltInAiRequest(
  config: BuiltInAiConfig,
  capability: AiCapability,
): ResolvedBuiltInAiRequestConfig {
  return {
    provider: AI_PROVIDERS.SNAPTIUM,
    baseUrl: config.baseUrl,
    endpoint: resolveEndpoint(config.baseUrl, capability),
    apiKey: config.apiKey,
    model: config.models[capability],
  };
}

export const builtInAiService = {
  getPublicSource(): BuiltInAiSourceMetadata {
    return {
      id: BUILT_IN_AI_SOURCE_ID,
      name: BUILT_IN_AI_SOURCE_NAME,
      baseUrl: BUILT_IN_AI_BASE_URL,
      apiKey: '',
      aiModel: BUILT_IN_AI_MODELS.chat,
      capabilityModels: { ...BUILT_IN_AI_MODELS },
      capabilities: [...BUILT_IN_AI_CAPABILITIES],
      provider: AI_PROVIDERS.SNAPTIUM,
    };
  },

  async resolveRequest(capability: AiCapability): Promise<ResolvedBuiltInAiRequestConfig> {
    const apiKey = await loadBuiltInAiKey();
    return resolveBuiltInAiRequest(normalizeBuiltInAiConfig({
      baseUrl: BUILT_IN_AI_BASE_URL,
      apiKey,
      models: BUILT_IN_AI_MODELS,
    }), capability);
  },

  invalidateCredential(expectedValue?: string): void {
    if (expectedValue === undefined || cachedBuiltInAiKey === expectedValue) {
      cachedBuiltInAiKey = null;
    }
  },

  isEndpoint(endpoint: string): boolean {
    try {
      const endpointUrl = new URL(endpoint);
      const baseUrl = new URL(BUILT_IN_AI_BASE_URL);
      return endpointUrl.origin === baseUrl.origin
        && endpointUrl.pathname.startsWith(`${baseUrl.pathname.replace(/\/+$/, '')}/`);
    } catch {
      return false;
    }
  },

  normalizeRequestError(error: unknown): BuiltInAiRequestError {
    return error instanceof BuiltInAiRequestError ? error : new BuiltInAiRequestError(error);
  },

  findRequestError(error: unknown): BuiltInAiRequestError | null {
    let current = error;
    const visited = new Set<object>();

    while (current instanceof Error && !visited.has(current)) {
      if (current instanceof BuiltInAiRequestError) {
        return current;
      }
      visited.add(current);
      current = current.cause;
    }

    return null;
  },

  toUserFacingError(error: unknown): unknown {
    return this.findRequestError(error) ?? error;
  },

  async fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

    try {
      const apiKey = await loadBuiltInAiKey();
      let response = await mainProcessFetch(url, withBuiltInAiAuthorization(init, apiKey));

      if (BUILT_IN_AI_AUTH_FAILURE_STATUSES.has(response.status)) {
        this.invalidateCredential(apiKey);
        const refreshedApiKey = await loadBuiltInAiKey();
        response = await mainProcessFetch(url, withBuiltInAiAuthorization(init, refreshedApiKey));
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response;
    } catch (error) {
      throw this.normalizeRequestError(error);
    }
  },
};
