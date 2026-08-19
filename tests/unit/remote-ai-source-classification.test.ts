import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AI_PROVIDERS } from '../../electron/shared/ai-provider.constants.js';

const mocks = vi.hoisted(() => ({
  builtInFetch: vi.fn(),
  mainProcessFetch: vi.fn(),
  normalizeRequestError: vi.fn((error: unknown) => error),
}));

vi.mock('../../electron/main/services/built-in-ai.service.js', () => ({
  builtInAiService: {
    fetch: mocks.builtInFetch,
    normalizeRequestError: mocks.normalizeRequestError,
  },
}));

vi.mock('../../electron/main/services/network.service.js', () => ({
  isElectronNetworkRequestError: (): boolean => false,
  mainProcessFetch: mocks.mainProcessFetch,
}));

vi.mock('../../electron/main/services/log/logger.service.js', () => ({
  loggerService: {
    createLogger: () => ({
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    }),
  },
}));

import { remoteAiService } from '../../electron/main/services/remote-ai.service.js';

function jsonResponse(): Response {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('remoteAiService source classification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.builtInFetch.mockResolvedValue(jsonResponse());
    mocks.mainProcessFetch.mockResolvedValue(jsonResponse());
  });

  it('keeps a custom provider custom when its URL matches Snaptium AI', async () => {
    await remoteAiService.request(
      'https://newapi.snaptium.com/v1/chat/completions',
      'custom-key',
      { model: 'custom-chat' },
      AI_PROVIDERS.OPENAI_COMPATIBLE,
    );

    expect(mocks.mainProcessFetch).toHaveBeenCalledOnce();
    expect(mocks.builtInFetch).not.toHaveBeenCalled();
  });

  it('uses the built-in request path only for the Snaptium provider', async () => {
    await remoteAiService.request(
      'https://newapi.snaptium.com/v1/chat/completions',
      'runtime-key',
      { model: 'snaptium-chat' },
      AI_PROVIDERS.SNAPTIUM,
    );

    expect(mocks.builtInFetch).toHaveBeenCalledOnce();
    expect(mocks.mainProcessFetch).not.toHaveBeenCalled();
  });
});
