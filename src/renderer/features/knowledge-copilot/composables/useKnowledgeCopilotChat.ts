import { computed, ref } from 'vue';
import { createLogger } from '@renderer/features/logger';
import type { KnowledgeAnswerResult, KnowledgeAnswerStreamEvent } from '@renderer/core/bridge/electronApi';
import { getErrorMessage } from '@shared/utils/error.utils';
import { knowledgeCopilotService } from '../services/knowledge-copilot.service';
import type { KnowledgeCopilotConversationContext } from '@shared/knowledge-copilot.constants';

const knowledgeCopilotChatLogger = createLogger('KnowledgeCopilotChat');

export function useKnowledgeCopilotChat() {
  const activeRequestIds = ref<string[]>([]);
  const answer = ref('');
  const error = ref<string | null>(null);
  const usedSearchFallback = ref(false);
  const hasActiveRequest = (requestId: string): boolean => activeRequestIds.value.includes(requestId);
  const addActiveRequest = (requestId: string): void => {
    if (!hasActiveRequest(requestId)) {
      activeRequestIds.value = [...activeRequestIds.value, requestId];
    }
  };
  const removeActiveRequest = (requestId: string): void => {
    activeRequestIds.value = activeRequestIds.value.filter((id) => id !== requestId);
  };

  const askQuestionStream = async (
    question: string,
    conversationId: string | undefined,
    context: KnowledgeCopilotConversationContext,
    callbacks: {
      onEvent?: (event: KnowledgeAnswerStreamEvent) => void;
      onDelta?: (text: string) => void;
    } = {},
    requestId: string = `${Date.now()}:${Math.random().toString(36).slice(2)}`,
  ): Promise<KnowledgeAnswerResult> => {
    if (!question.trim()) {
      throw new Error('Question cannot be empty');
    }

    knowledgeCopilotChatLogger.debug(`Starting streaming question flow (length=${question.length})`);
    addActiveRequest(requestId);
    error.value = null;
    answer.value = '';
    usedSearchFallback.value = false;

    try {
      const result = await knowledgeCopilotService.answerQuestionStream(requestId, question, conversationId, context, {
        onEvent: (event) => {
          if (hasActiveRequest(requestId)) {
            callbacks.onEvent?.(event);
          }
        },
        onDelta: (text) => {
          if (!hasActiveRequest(requestId)) {
            return;
          }
          answer.value += text;
          callbacks.onDelta?.(text);
        },
      });

      if (result.cancelled) {
        const partialAnswer = result.answer || answer.value;
        answer.value = partialAnswer;
        return {
          ...result,
          answer: partialAnswer || undefined,
        };
      }

      if (result.success) {
        const generatedAnswer = result.answer || answer.value || 'No answer generated';
        answer.value = generatedAnswer;
        usedSearchFallback.value = result.usedSearchFallback;
        return {
          ...result,
          answer: generatedAnswer,
        };
      }

      throw new Error(result.error || 'Failed to generate answer');
    } catch (err) {
      const message = getErrorMessage(err);
      knowledgeCopilotChatLogger.error(`Error generating streaming answer: ${message}`);
      error.value = message;
      throw err;
    } finally {
      removeActiveRequest(requestId);
      knowledgeCopilotChatLogger.debug('Streaming question flow finished');
    }
  };

  const stopGenerating = async (requestId?: string): Promise<boolean> => {
    const normalizedRequestId = requestId?.trim() || activeRequestIds.value.at(-1);
    if (!normalizedRequestId) {
      return false;
    }

    removeActiveRequest(normalizedRequestId);
    error.value = null;
    try {
      return await knowledgeCopilotService.cancelAnswerQuestion(normalizedRequestId);
    } catch (err) {
      const message = getErrorMessage(err);
      knowledgeCopilotChatLogger.error(`Failed to cancel streaming answer: ${message}`);
      return false;
    }
  };

  return {
    askQuestionStream,
    stopGenerating,
    isGenerating: computed(() => activeRequestIds.value.length > 0),
    answer,
    error,
    usedSearchFallback,
  };
}

