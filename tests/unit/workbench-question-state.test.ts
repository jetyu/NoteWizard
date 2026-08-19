import { describe, expect, it } from 'vitest';
import {
  sanitizeWorkbenchSettings,
  type WorkbenchQuestionEntry,
} from '../../src/renderer/features/workbench/constants/workbench.constants';

function createQuestion(overrides: Partial<WorkbenchQuestionEntry> = {}): WorkbenchQuestionEntry {
  return {
    id: 'question-1',
    threadId: 'thread-1',
    mode: 'ask',
    query: 'Original question',
    askedAt: 100,
    answer: '',
    sourceNoteIds: [],
    ...overrides,
  };
}

describe('workbench question generation state', () => {
  it('preserves failed state and a bounded error message', () => {
    const question = createQuestion({
      generationStatus: 'failed',
      error: `  ${'x'.repeat(900)}  `,
    });
    const settings = sanitizeWorkbenchSettings({
      recentQuestions: [question],
      conversationThreads: [{
        id: question.threadId,
        questions: [question],
        updatedAt: question.askedAt,
      }],
    });

    expect(settings.recentQuestions[0]?.generationStatus).toBe('failed');
    expect(settings.recentQuestions[0]?.error).toHaveLength(800);
    expect(settings.conversationThreads[0]?.questions[0]?.generationStatus).toBe('failed');
  });

  it('preserves a partial answer when generation was stopped', () => {
    const question = createQuestion({
      generationStatus: 'stopped',
      answer: 'Partial answer',
      fullAnswer: 'Partial answer',
    });
    const settings = sanitizeWorkbenchSettings({ recentQuestions: [question] });

    expect(settings.recentQuestions[0]).toMatchObject({
      generationStatus: 'stopped',
      answer: 'Partial answer',
      fullAnswer: 'Partial answer',
    });
  });
});
