import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BUILT_IN_AI_HEALTH_STATUS,
  BUILT_IN_AI_MODELS,
} from '../../electron/shared/built-in-ai.constants.js';

const mocks = vi.hoisted(() => ({
  isElectronNetworkRequestError: vi.fn(),
  mainProcessFetch: vi.fn(),
}));

vi.mock('../../electron/main/utils/i18n.js', () => ({
  $t: (_key: string, fallback = ''): string => fallback,
}));

vi.mock('../../electron/main/services/network.service.js', () => ({
  isElectronNetworkRequestError: mocks.isElectronNetworkRequestError,
  mainProcessFetch: mocks.mainProcessFetch,
}));

interface PerfMetricPoint {
  ts: number;
  avg_ttft_ms: number;
  avg_latency_ms: number;
  success_rate: number;
}

function createMetricsResponse(model: string, series: PerfMetricPoint[] = []): Response {
  return {
    ok: true,
    json: async () => ({
      success: true,
      data: {
        model_name: model,
        groups: series.length > 0 ? [{ series }] : [],
      },
    }),
  } as Response;
}

function getRequestedModel(input: RequestInfo | URL): string {
  const url = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;
  return new URL(url).searchParams.get('model') ?? '';
}

describe('builtInAiService health metrics', () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.isElectronNetworkRequestError.mockReset();
    mocks.mainProcessFetch.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('reports no data when the metrics endpoint succeeds without samples', async () => {
    mocks.mainProcessFetch.mockImplementation(async (input: RequestInfo | URL) =>
      createMetricsResponse(getRequestedModel(input)));
    const { builtInAiService } = await import('../../electron/main/services/built-in-ai.service.js');

    const snapshot = await builtInAiService.getHealth();

    expect(snapshot.models.chat.status).toBe(BUILT_IN_AI_HEALTH_STATUS.NO_DATA);
    expect(snapshot.models.embedding.status).toBe(BUILT_IN_AI_HEALTH_STATUS.NO_DATA);
    expect(snapshot.models.reranker.status).toBe(BUILT_IN_AI_HEALTH_STATUS.NO_DATA);
  });

  it('reports no data when the endpoint has no usable recent sample', async () => {
    const checkedAt = Date.UTC(2026, 7, 21, 14, 0, 0);
    vi.spyOn(Date, 'now').mockReturnValue(checkedAt);
    mocks.mainProcessFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const model = getRequestedModel(input);
      if (model === BUILT_IN_AI_MODELS.chat) {
        return createMetricsResponse(model, [{
          ts: checkedAt / 1_000,
          avg_ttft_ms: 0,
          avg_latency_ms: 1_000,
          success_rate: 100,
        }]);
      }
      if (model === BUILT_IN_AI_MODELS.embedding) {
        return createMetricsResponse(model, [{
          ts: (checkedAt - 16 * 60 * 1_000) / 1_000,
          avg_ttft_ms: 0,
          avg_latency_ms: 1_000,
          success_rate: 100,
        }]);
      }
      return createMetricsResponse(model);
    });
    const { builtInAiService } = await import('../../electron/main/services/built-in-ai.service.js');

    const snapshot = await builtInAiService.getHealth();

    expect(snapshot.models.chat.status).toBe(BUILT_IN_AI_HEALTH_STATUS.NO_DATA);
    expect(snapshot.models.embedding.status).toBe(BUILT_IN_AI_HEALTH_STATUS.NO_DATA);
    expect(snapshot.models.reranker.status).toBe(BUILT_IN_AI_HEALTH_STATUS.NO_DATA);
  });

  it('reports an unknown status when metric requests or responses fail', async () => {
    mocks.mainProcessFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const model = getRequestedModel(input);
      if (model === BUILT_IN_AI_MODELS.chat) {
        return { ok: false } as Response;
      }
      if (model === BUILT_IN_AI_MODELS.embedding) {
        throw new Error('network failed');
      }
      return {
        ok: true,
        json: async () => ({ success: true, data: { model_name: model } }),
      } as Response;
    });
    const { builtInAiService } = await import('../../electron/main/services/built-in-ai.service.js');

    const snapshot = await builtInAiService.getHealth();

    expect(snapshot.models.chat.status).toBe(BUILT_IN_AI_HEALTH_STATUS.UNKNOWN);
    expect(snapshot.models.embedding.status).toBe(BUILT_IN_AI_HEALTH_STATUS.UNKNOWN);
    expect(snapshot.models.reranker.status).toBe(BUILT_IN_AI_HEALTH_STATUS.UNKNOWN);
  });

  it('reports an unknown status when metric requests time out', async () => {
    vi.useFakeTimers();
    mocks.mainProcessFetch.mockImplementation((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
      }));
    const { builtInAiService } = await import('../../electron/main/services/built-in-ai.service.js');

    const healthPromise = builtInAiService.getHealth();
    await vi.advanceTimersByTimeAsync(5_000);
    const snapshot = await healthPromise;

    expect(snapshot.models.chat.status).toBe(BUILT_IN_AI_HEALTH_STATUS.UNKNOWN);
    expect(snapshot.models.embedding.status).toBe(BUILT_IN_AI_HEALTH_STATUS.UNKNOWN);
    expect(snapshot.models.reranker.status).toBe(BUILT_IN_AI_HEALTH_STATUS.UNKNOWN);
  });

  it('preserves healthy, degraded, and unavailable classifications for valid samples', async () => {
    const checkedAt = Date.UTC(2026, 7, 21, 14, 0, 0);
    vi.spyOn(Date, 'now').mockReturnValue(checkedAt);
    mocks.mainProcessFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const model = getRequestedModel(input);
      const basePoint = {
        ts: checkedAt / 1_000,
        avg_ttft_ms: 1_000,
        avg_latency_ms: 1_000,
        success_rate: 99,
      };
      if (model === BUILT_IN_AI_MODELS.embedding) {
        return createMetricsResponse(model, [{ ...basePoint, avg_latency_ms: 2_500 }]);
      }
      if (model === BUILT_IN_AI_MODELS.reranker) {
        return createMetricsResponse(model, [{ ...basePoint, success_rate: 40 }]);
      }
      return createMetricsResponse(model, [basePoint]);
    });
    const { builtInAiService } = await import('../../electron/main/services/built-in-ai.service.js');

    const snapshot = await builtInAiService.getHealth();

    expect(snapshot.models.chat.status).toBe(BUILT_IN_AI_HEALTH_STATUS.HEALTHY);
    expect(snapshot.models.embedding.status).toBe(BUILT_IN_AI_HEALTH_STATUS.DEGRADED);
    expect(snapshot.models.reranker.status).toBe(BUILT_IN_AI_HEALTH_STATUS.UNAVAILABLE);
  });
});
