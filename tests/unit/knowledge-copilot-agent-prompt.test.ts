vi.mock('../../electron/main/services/log/logger.service', () => ({
  loggerService: {
    createLogger: () => ({
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    }),
  },
}));

import { buildAgentSystemPrompt } from '../../electron/main/prompts/index';

describe('Knowledge Agent prompt tool contract', () => {
  it.each([
    ['zh-CN', '请整理这份笔记'],
    ['en-US', 'Please organize this note'],
  ])('uses registered write tools in confirm mode for %s', (uiLanguage, task) => {
    const prompt = buildAgentSystemPrompt('confirm', uiLanguage, task);

    expect(prompt).toContain('createNote');
    expect(prompt).toContain('updateNote');
    expect(prompt).not.toContain('proposeCreateNote');
    expect(prompt).not.toContain('proposeUpdateNote');
  });
});
