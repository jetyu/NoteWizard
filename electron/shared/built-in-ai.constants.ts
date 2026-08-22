import type { AiCapability, AiCapabilityModelMap } from './ai-provider.constants.js';

export const BUILT_IN_AI_SOURCE_ID = 'snaptium-built-in' as const;
export const BUILT_IN_AI_SOURCE_NAME = 'Snaptium AI' as const;
export const BUILT_IN_AI_BASE_URL = 'https://newapi.snaptium.com/v1' as const;
export const BUILT_IN_AI_PERF_METRICS_URL = 'https://newapi.snaptium.com/api/perf-metrics' as const;
export const BUILT_IN_AI_HEALTH_STATUS = {
  UNKNOWN: 'unknown',
  NO_DATA: 'no-data',
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  UNAVAILABLE: 'unavailable',
} as const;
export type BuiltInAiHealthStatus =
  typeof BUILT_IN_AI_HEALTH_STATUS[keyof typeof BUILT_IN_AI_HEALTH_STATUS];

export interface BuiltInAiModelHealth {
  status: BuiltInAiHealthStatus;
  latencyMs: number | null;
  successRate: number | null;
  observedAt: number | null;
}

export interface BuiltInAiHealthSnapshot {
  checkedAt: number;
  models: Record<AiCapability, BuiltInAiModelHealth>;
}

export const BUILT_IN_AI_MODELS = {
  chat: 'snaptium-chat',
  embedding: 'snaptium-embedding',
  reranker: 'snaptium-reranker',
} as const satisfies Record<AiCapability, string>;
export const BUILT_IN_AI_CAPABILITIES = ['chat', 'embedding', 'reranker'] as const;

export interface BuiltInAiSourceMetadata {
  id: typeof BUILT_IN_AI_SOURCE_ID;
  name: typeof BUILT_IN_AI_SOURCE_NAME;
  baseUrl: string;
  apiKey: string;
  aiModel: string;
  capabilityModels: AiCapabilityModelMap;
  capabilities: string[];
  provider: 'snaptium';
}

export function isBuiltInAiSourceId(value: unknown): value is typeof BUILT_IN_AI_SOURCE_ID {
  return value === BUILT_IN_AI_SOURCE_ID;
}
