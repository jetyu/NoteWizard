import { describe, expect, it, vi } from 'vitest';

vi.mock('../../electron/main/utils/i18n.js', () => ({
  $t: (_key: string, fallback = ''): string => fallback,
}));

vi.mock('../../electron/main/services/network.service.js', () => ({
  isElectronNetworkRequestError: (): boolean => false,
  mainProcessFetch: vi.fn(),
}));

import {
  BuiltInAiRequestError,
  builtInAiService,
} from '../../electron/main/services/built-in-ai.service.js';

describe('builtInAiService request errors', () => {
  it('reports the failed capability and HTTP status', () => {
    const error = builtInAiService.normalizeRequestError(new Error('HTTP 429'), 'embedding');

    expect(error).toBeInstanceOf(BuiltInAiRequestError);
    expect(error.capability).toBe('embedding');
    expect(error.status).toBe(429);
    expect(error.message).toContain('Embedding');
    expect(error.message).toContain('HTTP 429');
  });

  it('does not relabel a custom provider timeout as Snaptium AI', () => {
    const customError = new Error('AI service network request failed.');

    expect(builtInAiService.toUserFacingError(customError)).toBe(customError);
  });
});
