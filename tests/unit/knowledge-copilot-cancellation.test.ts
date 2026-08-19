import { describe, expect, it, vi } from 'vitest';
import type {
  KnowledgeAnswerResult,
  KnowledgeCopilotTaskResult,
} from '../../src/renderer/core/bridge/electronApi';

const mocks = vi.hoisted(() => ({
  answerQuestionStream: vi.fn(),
  cancelAnswerQuestion: vi.fn(),
  runTask: vi.fn(),
  cancelTask: vi.fn(),
}));

vi.mock('@renderer/features/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('@renderer/features/knowledge-copilot/services/knowledge-copilot.service', () => ({
  knowledgeCopilotService: mocks,
}));

import { useKnowledgeCopilotChat } from '../../src/renderer/features/knowledge-copilot/composables/useKnowledgeCopilotChat';
import { useKnowledgeCopilotTask } from '../../src/renderer/features/knowledge-copilot/composables/useKnowledgeCopilotTask';

describe('Knowledge Copilot cancellation composables', () => {
  it('stops an active streamed answer without surfacing an error', async () => {
    let resolveAnswer: ((result: KnowledgeAnswerResult) => void) | undefined;
    mocks.answerQuestionStream.mockImplementation(() => new Promise<KnowledgeAnswerResult>((resolve) => {
      resolveAnswer = resolve;
    }));
    mocks.cancelAnswerQuestion.mockResolvedValue(true);
    const chat = useKnowledgeCopilotChat();

    const pendingAnswer = chat.askQuestionStream('Question', undefined, { turns: [] });
    await Promise.resolve();
    expect(chat.isGenerating.value).toBe(true);

    await chat.stopGenerating();
    expect(chat.isGenerating.value).toBe(false);
    expect(mocks.cancelAnswerQuestion).toHaveBeenCalledWith(expect.any(String));

    resolveAnswer?.({
      success: false,
      cancelled: true,
      answer: 'Partial',
      sources: [],
      usedSearchFallback: false,
    });
    await expect(pendingAnswer).resolves.toMatchObject({ cancelled: true, answer: 'Partial' });
    expect(chat.error.value).toBeNull();
  });

  it('cancels only the selected request when answers run concurrently', async () => {
    const resolvers = new Map<string, (result: KnowledgeAnswerResult) => void>();
    mocks.answerQuestionStream.mockImplementation((requestId: string) => new Promise<KnowledgeAnswerResult>((resolve) => {
      resolvers.set(requestId, resolve);
    }));
    mocks.cancelAnswerQuestion.mockResolvedValue(true);
    const chat = useKnowledgeCopilotChat();

    const first = chat.askQuestionStream('First', undefined, { turns: [] }, {}, 'ask-1');
    const second = chat.askQuestionStream('Second', undefined, { turns: [] }, {}, 'ask-2');
    await Promise.resolve();
    expect(chat.isGenerating.value).toBe(true);

    await chat.stopGenerating('ask-1');
    expect(mocks.cancelAnswerQuestion).toHaveBeenLastCalledWith('ask-1');
    expect(chat.isGenerating.value).toBe(true);

    resolvers.get('ask-2')?.({
      success: true,
      answer: 'Second answer',
      sources: [],
      usedSearchFallback: false,
    });
    resolvers.get('ask-1')?.({
      success: false,
      cancelled: true,
      answer: 'Partial first',
      sources: [],
      usedSearchFallback: false,
    });
    await Promise.all([first, second]);
    expect(chat.isGenerating.value).toBe(false);
  });

  it('keeps a successful concurrent answer independent from another failure', async () => {
    const resolvers = new Map<string, (result: KnowledgeAnswerResult) => void>();
    mocks.answerQuestionStream.mockImplementation((requestId: string) => new Promise<KnowledgeAnswerResult>((resolve) => {
      resolvers.set(requestId, resolve);
    }));
    const chat = useKnowledgeCopilotChat();
    const failed = chat.askQuestionStream('Failed', undefined, { turns: [] }, {}, 'ask-failed');
    const succeeded = chat.askQuestionStream('Succeeded', undefined, { turns: [] }, {}, 'ask-succeeded');
    await Promise.resolve();

    resolvers.get('ask-succeeded')?.({
      success: true,
      answer: 'Independent answer',
      sources: [],
      usedSearchFallback: false,
    });
    resolvers.get('ask-failed')?.({
      success: false,
      error: 'Provider failed',
      sources: [],
      usedSearchFallback: false,
    });

    await expect(succeeded).resolves.toMatchObject({ answer: 'Independent answer' });
    await expect(failed).rejects.toThrow('Provider failed');
    expect(chat.isGenerating.value).toBe(false);
  });

  it('stops an active agent task and accepts a cancelled result', async () => {
    let resolveTask: ((result: KnowledgeCopilotTaskResult) => void) | undefined;
    mocks.runTask.mockImplementation(() => new Promise<KnowledgeCopilotTaskResult>((resolve) => {
      resolveTask = resolve;
    }));
    mocks.cancelTask.mockResolvedValue(true);
    const task = useKnowledgeCopilotTask();

    const pendingTask = task.runTask('Organize notes');
    await Promise.resolve();
    expect(task.isRunning.value).toBe(true);

    await task.stopTask();
    expect(task.isRunning.value).toBe(false);
    expect(mocks.cancelTask).toHaveBeenCalledWith(expect.any(String));

    resolveTask?.({
      success: false,
      cancelled: true,
      steps: [],
      traceEvents: [],
      sources: [],
      writeMode: 'confirm',
      pendingWrites: [],
      executedWrites: [],
      stopReason: 'cancelled',
      conversationId: '',
      pendingActions: [],
    });
    await expect(pendingTask).resolves.toMatchObject({ cancelled: true, stopReason: 'cancelled' });
    expect(task.error.value).toBeNull();
  });

  it('cancels only the selected concurrent agent task', async () => {
    const resolvers = new Map<string, (result: KnowledgeCopilotTaskResult) => void>();
    mocks.runTask.mockImplementation((requestId: string) => new Promise<KnowledgeCopilotTaskResult>((resolve) => {
      resolvers.set(requestId, resolve);
    }));
    mocks.cancelTask.mockResolvedValue(true);
    const task = useKnowledgeCopilotTask();

    const first = task.runTask('First task', 'confirm', 'thread-1', { turns: [] }, 'task-1');
    const second = task.runTask('Second task', 'confirm', 'thread-2', { turns: [] }, 'task-2');
    await Promise.resolve();
    expect(task.isRunning.value).toBe(true);

    await task.stopTask('task-1');
    expect(mocks.cancelTask).toHaveBeenLastCalledWith('task-1');
    expect(task.isRunning.value).toBe(true);

    const result = {
      success: true,
      steps: [],
      traceEvents: [],
      sources: [],
      writeMode: 'confirm' as const,
      pendingWrites: [],
      executedWrites: [],
      conversationId: '',
      pendingActions: [],
    };
    resolvers.get('task-1')?.({ ...result, success: false, cancelled: true, stopReason: 'cancelled' });
    resolvers.get('task-2')?.(result);
    await Promise.all([first, second]);
    expect(task.isRunning.value).toBe(false);
  });
});
