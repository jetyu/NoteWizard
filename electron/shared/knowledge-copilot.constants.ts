import { AI_PROVIDERS, type AiProvider } from './ai-provider.constants.js';

export const KNOWLEDGE_COPILOT_REBUILD_CONCURRENCY_LIMITS = {
  MIN: 1,
  DEFAULT: 3,
  MAX: 8,
  SNAPTIUM_MAX: 3,
} as const;

export function getKnowledgeCopilotRebuildConcurrencyMax(provider?: AiProvider | null): number {
  return provider === AI_PROVIDERS.SNAPTIUM
    ? KNOWLEDGE_COPILOT_REBUILD_CONCURRENCY_LIMITS.SNAPTIUM_MAX
    : KNOWLEDGE_COPILOT_REBUILD_CONCURRENCY_LIMITS.MAX;
}

export function normalizeKnowledgeCopilotRebuildConcurrency(
  value: unknown,
  provider?: AiProvider | null,
): number {
  const numericValue = Number(value);
  const finiteValue = Number.isFinite(numericValue)
    ? Math.trunc(numericValue)
    : KNOWLEDGE_COPILOT_REBUILD_CONCURRENCY_LIMITS.DEFAULT;
  return Math.min(
    getKnowledgeCopilotRebuildConcurrencyMax(provider),
    Math.max(KNOWLEDGE_COPILOT_REBUILD_CONCURRENCY_LIMITS.MIN, finiteValue),
  );
}

export const KNOWLEDGE_COPILOT_CONVERSATION_LIMITS = {
  VISIBLE_TURNS: 12,
  CONTEXT_TURNS: 6,
  THREADS: 30,
  QUESTION_LENGTH: 1200,
  ANSWER_LENGTH: 1200,
  SUMMARY_LENGTH: 2400,
} as const;

export type KnowledgeCopilotConversationMode = 'ask' | 'agent-task';

export interface KnowledgeCopilotConversationTurn {
  id: string;
  mode: KnowledgeCopilotConversationMode;
  query: string;
  answer: string;
}

export interface KnowledgeCopilotConversationContext {
  summary?: string;
  summaryUpToQuestionId?: string;
  turns: KnowledgeCopilotConversationTurn[];
}
