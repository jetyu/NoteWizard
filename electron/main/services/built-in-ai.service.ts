import { z } from 'zod';
import {
  AI_PROVIDERS,
  type AiCapability,
} from '../../shared/ai-provider.constants.js';
import {
  BUILT_IN_AI_BASE_URL,
  BUILT_IN_AI_CAPABILITIES,
  BUILT_IN_AI_HEALTH_STATUS,
  BUILT_IN_AI_MODELS,
  BUILT_IN_AI_PERF_METRICS_URL,
  BUILT_IN_AI_SOURCE_ID,
  BUILT_IN_AI_SOURCE_NAME,
  type BuiltInAiHealthSnapshot,
  type BuiltInAiModelHealth,
  type BuiltInAiSourceMetadata,
} from '../../shared/built-in-ai.constants.js';
import { $t } from '../utils/i18n.js';
import { isElectronNetworkRequestError, mainProcessFetch } from './network.service.js';

const BUILT_IN_AI_KEY_URL = 'https://snaptium.com/key.txt';
const BUILT_IN_AI_AUTH_FAILURE_STATUSES = new Set([401, 403]);
const BUILT_IN_AI_HEALTH_CACHE_MS = 60_000;
const BUILT_IN_AI_HEALTH_WINDOW_HOURS = 1;
const BUILT_IN_AI_HEALTH_STALE_MS = 15 * 60 * 1_000;
const BUILT_IN_AI_HEALTH_TIMEOUT_MS = 5_000;
const BUILT_IN_AI_HEALTHY_SUCCESS_RATE = 95;
const BUILT_IN_AI_UNAVAILABLE_SUCCESS_RATE = 50;
const BUILT_IN_AI_HEALTHY_LATENCY_MS = {
  chat: 3_000,
  embedding: 2_000,
  reranker: 3_000,
} as const satisfies Record<AiCapability, number>;

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

const builtInAiPerfMetricsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    model_name: z.string(),
    groups: z.array(z.object({
      series: z.array(z.object({
        ts: z.number().int().nonnegative(),
        avg_ttft_ms: z.number().nonnegative(),
        avg_latency_ms: z.number().nonnegative(),
        success_rate: z.number().min(0).max(100),
      })),
    })),
  }),
});

export type BuiltInAiConfig = z.infer<typeof builtInAiConfigSchema>;

export interface ResolvedBuiltInAiRequestConfig {
  provider: typeof AI_PROVIDERS.SNAPTIUM;
  baseUrl: string;
  endpoint: string;
  apiKey: string;
  model: string;
}

type BuiltInAiFailureReason = 'http' | 'network' | 'timeout' | 'unknown';

let cachedBuiltInAiKey: string | null = null;
let builtInAiKeyPromise: Promise<string> | null = null;
let cachedBuiltInAiHealth: BuiltInAiHealthSnapshot | null = null;
let builtInAiHealthPromise: Promise<BuiltInAiHealthSnapshot> | null = null;

export function normalizeBuiltInAiConfig(value: unknown): BuiltInAiConfig {
  return builtInAiConfigSchema.parse(value);
}

export class BuiltInAiRequestError extends Error {
  readonly capability?: AiCapability;
  readonly status?: number;

  constructor(cause: unknown, capability?: AiCapability) {
    const status = getHttpStatus(cause);
    super(formatBuiltInAiError(capability, getFailureReason(cause, status), status), { cause });
    this.name = 'BuiltInAiRequestError';
    this.capability = capability;
    this.status = status;
  }
}

function interpolate(template: string, replacements: Record<string, string>): string {
  return Object.entries(replacements).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, value),
    template,
  );
}

function getHttpStatus(error: unknown): number | undefined {
  if (!(error instanceof Error)) return undefined;
  const match = /^HTTP (\d{3})(?:\D|$)/.exec(error.message);
  return match ? Number(match[1]) : undefined;
}

function getFailureReason(error: unknown, status: number | undefined): BuiltInAiFailureReason {
  if (status !== undefined) return 'http';
  if (isAbortError(error)) return 'timeout';
  if (isElectronNetworkRequestError(error)) return 'network';
  return 'unknown';
}

function getCapabilityLabel(capability: AiCapability): string {
  if (capability === 'chat') return $t('builtInAi.capability.chat', 'Chat');
  if (capability === 'embedding') return $t('builtInAi.capability.embedding', 'Embedding');
  return $t('builtInAi.capability.reranker', 'Reranker');
}

function getFailureReasonLabel(reason: BuiltInAiFailureReason, status: number | undefined): string {
  if (reason === 'http' && status !== undefined) {
    return interpolate(
      $t('builtInAi.error.reason.http', 'the service returned HTTP {status}'),
      { status: String(status) },
    );
  }
  if (reason === 'network') return $t('builtInAi.error.reason.network', 'network connection failed');
  if (reason === 'timeout') return $t('builtInAi.error.reason.timeout', 'the request timed out');
  return $t('builtInAi.error.reason.unknown', 'the request failed');
}

function formatBuiltInAiError(
  capability: AiCapability | undefined,
  reason: BuiltInAiFailureReason,
  status: number | undefined,
): string {
  if (!capability) return $t('builtInAi.error.unavailable');
  return interpolate(
    $t(
      'builtInAi.error.requestFailed',
      'Snaptium AI {capability} request failed: {reason}. Choose a custom AI source or try again later.',
    ),
    {
      capability: getCapabilityLabel(capability),
      reason: getFailureReasonLabel(reason, status),
    },
  );
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
  })().finally(() => {
    builtInAiKeyPromise = null;
  });

  return builtInAiKeyPromise;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function resolveCapabilityFromUrl(url: string): AiCapability | undefined {
  try {
    const pathname = new URL(url).pathname.replace(/\/+$/, '');
    if (pathname.endsWith('/chat/completions')) return 'chat';
    if (pathname.endsWith('/embeddings')) return 'embedding';
    if (pathname.endsWith('/rerank')) return 'reranker';
  } catch {
    return undefined;
  }
  return undefined;
}

function createUnknownModelHealth(): BuiltInAiModelHealth {
  return {
    status: BUILT_IN_AI_HEALTH_STATUS.UNKNOWN,
    latencyMs: null,
    successRate: null,
    observedAt: null,
  };
}

function classifyBuiltInAiModelHealth(
  capability: AiCapability,
  latencyMs: number,
  successRate: number,
  observedAt: number,
): BuiltInAiModelHealth {
  let status: BuiltInAiModelHealth['status'] = BUILT_IN_AI_HEALTH_STATUS.DEGRADED;
  if (successRate < BUILT_IN_AI_UNAVAILABLE_SUCCESS_RATE) {
    status = BUILT_IN_AI_HEALTH_STATUS.UNAVAILABLE;
  } else if (successRate >= BUILT_IN_AI_HEALTHY_SUCCESS_RATE
    && latencyMs <= BUILT_IN_AI_HEALTHY_LATENCY_MS[capability]) {
    status = BUILT_IN_AI_HEALTH_STATUS.HEALTHY;
  }

  return { status, latencyMs, successRate, observedAt };
}

function parseBuiltInAiModelHealth(
  capability: AiCapability,
  model: string,
  value: unknown,
  checkedAt: number,
): BuiltInAiModelHealth {
  const response = builtInAiPerfMetricsResponseSchema.parse(value);
  if (response.data.model_name !== model) {
    return createUnknownModelHealth();
  }

  const cutoff = checkedAt - BUILT_IN_AI_HEALTH_STALE_MS;
  const latestPoints = response.data.groups.flatMap((group) => {
    const latestPoint = group.series.reduce<(typeof group.series)[number] | null>(
      (latest, point) => {
        if (capability === 'chat' && point.avg_ttft_ms <= 0) return latest;
        return !latest || point.ts > latest.ts ? point : latest;
      },
      null,
    );
    return latestPoint && latestPoint.ts * 1_000 >= cutoff ? [latestPoint] : [];
  });
  if (latestPoints.length === 0) {
    return createUnknownModelHealth();
  }

  const latencyMs = Math.round(
    latestPoints.reduce(
      (total, point) => total + (capability === 'chat' ? point.avg_ttft_ms : point.avg_latency_ms),
      0,
    ) / latestPoints.length,
  );
  const successRate = latestPoints.reduce(
    (total, point) => total + point.success_rate,
    0,
  ) / latestPoints.length;
  const observedAt = Math.max(...latestPoints.map(point => point.ts * 1_000));
  return classifyBuiltInAiModelHealth(capability, latencyMs, successRate, observedAt);
}

async function requestBuiltInAiModelHealth(
  capability: AiCapability,
  model: string,
  checkedAt: number,
  signal: AbortSignal,
): Promise<BuiltInAiModelHealth> {
  const url = new URL(BUILT_IN_AI_PERF_METRICS_URL);
  url.searchParams.set('model', model);
  url.searchParams.set('hours', String(BUILT_IN_AI_HEALTH_WINDOW_HOURS));

  try {
    const response = await mainProcessFetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal,
    });
    if (!response.ok) {
      return createUnknownModelHealth();
    }
    return parseBuiltInAiModelHealth(capability, model, await response.json(), checkedAt);
  } catch {
    return createUnknownModelHealth();
  }
}

async function requestBuiltInAiHealth(): Promise<BuiltInAiHealthSnapshot> {
  const checkedAt = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BUILT_IN_AI_HEALTH_TIMEOUT_MS);

  try {
    const [chat, embedding, reranker] = await Promise.all([
      requestBuiltInAiModelHealth('chat', BUILT_IN_AI_MODELS.chat, checkedAt, controller.signal),
      requestBuiltInAiModelHealth('embedding', BUILT_IN_AI_MODELS.embedding, checkedAt, controller.signal),
      requestBuiltInAiModelHealth('reranker', BUILT_IN_AI_MODELS.reranker, checkedAt, controller.signal),
    ]);
    return {
      checkedAt,
      models: { chat, embedding, reranker },
    };
  } finally {
    clearTimeout(timeoutId);
  }
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
    try {
      const apiKey = await loadBuiltInAiKey();
      return resolveBuiltInAiRequest(normalizeBuiltInAiConfig({
        baseUrl: BUILT_IN_AI_BASE_URL,
        apiKey,
        models: BUILT_IN_AI_MODELS,
      }), capability);
    } catch (error) {
      throw this.normalizeRequestError(error, capability);
    }
  },

  async getHealth(): Promise<BuiltInAiHealthSnapshot> {
    if (cachedBuiltInAiHealth
      && Date.now() - cachedBuiltInAiHealth.checkedAt < BUILT_IN_AI_HEALTH_CACHE_MS) {
      return cachedBuiltInAiHealth;
    }

    if (builtInAiHealthPromise) {
      return builtInAiHealthPromise;
    }

    builtInAiHealthPromise = requestBuiltInAiHealth()
      .then((result) => {
        cachedBuiltInAiHealth = result;
        return result;
      })
      .finally(() => {
        builtInAiHealthPromise = null;
      });

    return builtInAiHealthPromise;
  },

  invalidateCredential(expectedValue?: string): void {
    if (expectedValue === undefined || cachedBuiltInAiKey === expectedValue) {
      cachedBuiltInAiKey = null;
    }
  },

  normalizeRequestError(error: unknown, capability?: AiCapability): BuiltInAiRequestError {
    if (error instanceof BuiltInAiRequestError && (error.capability || !capability)) {
      return error;
    }
    return new BuiltInAiRequestError(
      error instanceof BuiltInAiRequestError ? error.cause : error,
      capability,
    );
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
    const capability = resolveCapabilityFromUrl(url);

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
      throw this.normalizeRequestError(error, capability);
    }
  },
};
