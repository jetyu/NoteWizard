import { computed, ref } from 'vue';
import { createLogger } from '@renderer/features/logger';
import type { KnowledgeCopilotDecision, KnowledgeCopilotTaskResult, KnowledgeCopilotWriteMode } from '@renderer/core/bridge/electronApi';
import { getErrorMessage } from '@shared/utils/error.utils';
import { knowledgeCopilotService } from '../services/knowledge-copilot.service';
import type { KnowledgeCopilotConversationContext } from '@shared/knowledge-copilot.constants';

const knowledgeCopilotTaskLogger = createLogger('KnowledgeCopilotTask');

export function useKnowledgeCopilotTask() {
  const activeRequestIds = ref<string[]>([]);
  const result = ref<KnowledgeCopilotTaskResult | null>(null);
  const error = ref<string | null>(null);

  const addActiveRequest = (requestId: string): void => {
    if (!activeRequestIds.value.includes(requestId)) {
      activeRequestIds.value = [...activeRequestIds.value, requestId];
    }
  };
  const removeActiveRequest = (requestId: string): void => {
    activeRequestIds.value = activeRequestIds.value.filter((id) => id !== requestId);
  };

  const runTask = async (
    task: string,
    writeMode: KnowledgeCopilotWriteMode = 'confirm',
    conversationId?: string,
    context: KnowledgeCopilotConversationContext = { turns: [] },
    requestId: string = `${Date.now()}:${Math.random().toString(36).slice(2)}`,
  ): Promise<KnowledgeCopilotTaskResult> => {
    if (!task.trim()) {
      throw new Error('Task cannot be empty');
    }

    knowledgeCopilotTaskLogger.debug(`Starting agent task (length=${task.length})`);
    addActiveRequest(requestId);
    error.value = null;
    result.value = null;

    try {
      const taskResult = await knowledgeCopilotService.runTask(requestId, task, writeMode, conversationId, context);
      if (!taskResult.success && !taskResult.cancelled) {
        throw new Error(taskResult.error || 'Failed to run agent task');
      }

      result.value = taskResult;
      return taskResult;
    } catch (err) {
      const message = getErrorMessage(err);
      knowledgeCopilotTaskLogger.error(`Error running agent task: ${message}`);
      error.value = message;
      throw err;
    } finally {
      removeActiveRequest(requestId);
      knowledgeCopilotTaskLogger.debug('Agent task flow finished');
    }
  };

  const resumeTask = async (
    conversationId: string,
    decisions: KnowledgeCopilotDecision[],
    writeMode: KnowledgeCopilotWriteMode = 'confirm',
    requestId: string = `${Date.now()}:${Math.random().toString(36).slice(2)}`,
  ): Promise<KnowledgeCopilotTaskResult> => {
    addActiveRequest(requestId);
    error.value = null;
    try {
      const taskResult = await knowledgeCopilotService.runTask(requestId, '', writeMode, conversationId, { turns: [] }, decisions);
      if (!taskResult.success && !taskResult.cancelled) {
        throw new Error(taskResult.error || 'Failed to resume agent task');
      }
      result.value = taskResult;
      return taskResult;
    } finally {
      removeActiveRequest(requestId);
    }
  };

  const stopTask = async (requestId?: string): Promise<boolean> => {
    const normalizedRequestId = requestId?.trim() || activeRequestIds.value.at(-1);
    if (!normalizedRequestId) {
      return false;
    }

    removeActiveRequest(normalizedRequestId);
    error.value = null;
    try {
      return await knowledgeCopilotService.cancelTask(normalizedRequestId);
    } catch (err) {
      const message = getErrorMessage(err);
      knowledgeCopilotTaskLogger.error(`Failed to cancel agent task: ${message}`);
      return false;
    }
  };

  return {
    runTask,
    resumeTask,
    stopTask,
    isRunning: computed(() => activeRequestIds.value.length > 0),
    result,
    error,
  };
}
