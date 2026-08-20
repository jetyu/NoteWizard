import { ipcMain } from 'electron';
import { z } from 'zod';
import { knowledgeCopilotIndexService } from '../../services/knowledge-copilot/knowledge-copilot-index.service.js';
import { runKnowledgeCopilotTask } from '../../services/knowledge-copilot/knowledge-copilot-task.service.js';
import { aiConfigService } from '../../services/ai-config.service.js';
import { answerKnowledgeQuestionStream, type KnowledgeAnswerResult } from '../../services/knowledge-copilot/knowledge-copilot-qa.service.js';
import { IPC_CHANNELS } from '../../constants/ipc.constants.js';
import { loggerService } from '../../services/log/logger.service.js';
import { getErrorMessage } from '../../services/error.service.js';
import { KNOWLEDGE_COPILOT_CONVERSATION_LIMITS } from '../../../shared/knowledge-copilot.constants.js';
import { builtInAiService } from '../../services/built-in-ai.service.js';

const logger = loggerService.createLogger('Main:KnowledgeCopilotIPC');
let knowledgeCopilotInitializationPromise: Promise<void> | null = null;

interface ActiveQuestionRequest {
  controller: AbortController;
  webContentsId: number;
}

const activeQuestionRequests = new Map<string, ActiveQuestionRequest>();
const activeTaskRequests = new Map<string, ActiveQuestionRequest>();

const InitializeSchema = z.object({}).optional();

const IndexNoteSchema = z.object({
  noteId: z.string().min(1),
  noteTitle: z.string().min(1),
  content: z.string(),
  chunkSize: z.number().int().positive().optional().default(500),
  chunkOverlap: z.number().int().nonnegative().optional().default(50),
});

const StreamQuestionSchema = z.object({
  query: z.string().min(1),
  requestId: z.string().min(1),
  conversationId: z.string().min(1).optional(),
  context: z.object({
    summary: z.string().max(KNOWLEDGE_COPILOT_CONVERSATION_LIMITS.SUMMARY_LENGTH).optional(),
    summaryUpToQuestionId: z.string().min(1).optional(),
    turns: z.array(z.object({
      id: z.string().min(1),
    mode: z.enum(['ask', 'agent-task']),
    query: z.string().min(1).max(KNOWLEDGE_COPILOT_CONVERSATION_LIMITS.QUESTION_LENGTH),
    answer: z.string().min(1).max(KNOWLEDGE_COPILOT_CONVERSATION_LIMITS.ANSWER_LENGTH),
    })).max(KNOWLEDGE_COPILOT_CONVERSATION_LIMITS.VISIBLE_TURNS),
  }).optional(),
});

const CancelQuestionSchema = z.object({
  requestId: z.string().min(1),
});

const ConversationContextSchema = z.object({
  summary: z.string().max(KNOWLEDGE_COPILOT_CONVERSATION_LIMITS.SUMMARY_LENGTH).optional(),
  summaryUpToQuestionId: z.string().min(1).optional(),
  turns: z.array(z.object({
  id: z.string().min(1),
  mode: z.enum(['ask', 'agent-task']),
  query: z.string().min(1).max(KNOWLEDGE_COPILOT_CONVERSATION_LIMITS.QUESTION_LENGTH),
  answer: z.string().min(1).max(KNOWLEDGE_COPILOT_CONVERSATION_LIMITS.ANSWER_LENGTH),
  })).max(KNOWLEDGE_COPILOT_CONVERSATION_LIMITS.VISIBLE_TURNS),
});

const RunTaskSchema = z.object({
  requestId: z.string().min(1),
  task: z.string().default(''),
  writeMode: z.enum(['confirm', 'auto']).optional(),
  conversationId: z.string().min(1).optional(),
  context: ConversationContextSchema.optional(),
  decisions: z.array(z.discriminatedUnion('type', [
    z.object({ type: z.literal('approve') }),
    z.object({ type: z.literal('edit'), editedAction: z.object({ name: z.string().min(1), args: z.record(z.string(), z.unknown()) }) }),
    z.object({ type: z.literal('reject'), message: z.string().optional() }),
  ])).optional(),
}).refine((value) => value.task.trim().length > 0 || (value.conversationId && value.decisions), {
  message: 'A task or resumable conversation decision is required',
});

async function initializeKnowledgeCopilotIndex(force = false): Promise<void> {
  if (knowledgeCopilotInitializationPromise) {
    return knowledgeCopilotInitializationPromise;
  }

  if (!force && knowledgeCopilotIndexService.isReady()) {
    return;
  }

  knowledgeCopilotInitializationPromise = (async () => {
    const config = await aiConfigService.resolveKnowledgeCopilotConfig();
    await knowledgeCopilotIndexService.initialize(config.workspaceRoot, config.embeddingConfig);
  })().finally(() => {
    knowledgeCopilotInitializationPromise = null;
  });

  return knowledgeCopilotInitializationPromise;
}

export function registerKnowledgeCopilotHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.KNOWLEDGE_COPILOT_INITIALIZE, async (_event, request) => {
    try {
      InitializeSchema.parse(request);
      await initializeKnowledgeCopilotIndex(true);
      return { success: true };
    } catch (error) {
      const message = getErrorMessage(builtInAiService.toUserFacingError(error));
      logger.error(`KNOWLEDGE_COPILOT_INITIALIZE error: ${message}`);
      return { success: false, error: message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.KNOWLEDGE_COPILOT_INDEX_NOTE, async (_event, request) => {
    try {
      const validated = IndexNoteSchema.parse(request);
      await initializeKnowledgeCopilotIndex();
      return await knowledgeCopilotIndexService.indexNote(validated);
    } catch (error) {
      const message = getErrorMessage(builtInAiService.toUserFacingError(error));
      logger.error(`KNOWLEDGE_COPILOT_INDEX_NOTE error: ${message}`);
      return { success: false, error: message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.KNOWLEDGE_COPILOT_CANCEL_ANSWER_QUESTION, (event, request) => {
    try {
      const validated = CancelQuestionSchema.parse(request);
      const activeRequest = activeQuestionRequests.get(validated.requestId);
      if (!activeRequest) {
        return { success: true, cancelled: false };
      }
      if (activeRequest.webContentsId !== event.sender.id) {
        return { success: false, cancelled: false, error: 'Cannot cancel a request owned by another window' };
      }
      activeRequest.controller.abort();
      return { success: true, cancelled: true };
    } catch (error) {
      return { success: false, cancelled: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.KNOWLEDGE_COPILOT_ANSWER_QUESTION_STREAM, async (event, request) => {
    let requestId = '';
    let controller: AbortController | null = null;
    let partialAnswer = '';
    let latestSources: KnowledgeAnswerResult['sources'] = [];
    let usedSearchFallback = false;
    try {
      const validated = StreamQuestionSchema.parse(request);
      requestId = validated.requestId;
      if (activeQuestionRequests.has(requestId)) {
        throw new Error('A Knowledge Assistant request with this ID is already active');
      }
      controller = new AbortController();
      activeQuestionRequests.set(requestId, { controller, webContentsId: event.sender.id });
      event.sender.send(IPC_CHANNELS.KNOWLEDGE_COPILOT_ANSWER_QUESTION_STREAM_EVENT, {
        requestId,
        type: 'start',
      });

      const result = await answerKnowledgeQuestionStream(validated.query, validated.context ?? { turns: [] }, (streamEvent) => {
        if (streamEvent.type === 'delta') {
          partialAnswer += streamEvent.text;
        } else if (streamEvent.type === 'sources') {
          latestSources = streamEvent.sources;
          usedSearchFallback = streamEvent.usedSearchFallback;
        }
        event.sender.send(IPC_CHANNELS.KNOWLEDGE_COPILOT_ANSWER_QUESTION_STREAM_EVENT, {
          requestId,
          ...streamEvent,
        });
      }, controller.signal);

      if (!result.success) {
        event.sender.send(IPC_CHANNELS.KNOWLEDGE_COPILOT_ANSWER_QUESTION_STREAM_EVENT, {
          requestId,
          type: 'error',
          error: result.error || 'Failed to generate answer',
          sources: result.sources,
          usedSearchFallback: result.usedSearchFallback,
          insufficientEvidence: result.insufficientEvidence,
        });
        return result;
      }

      event.sender.send(IPC_CHANNELS.KNOWLEDGE_COPILOT_ANSWER_QUESTION_STREAM_EVENT, {
        requestId,
        type: 'done',
        answer: result.answer || '',
        sources: result.sources,
        usedSearchFallback: result.usedSearchFallback,
      });
      return result;
    } catch (error) {
      if (controller?.signal.aborted) {
        const cancelledResult = {
          success: false,
          cancelled: true,
          answer: partialAnswer || undefined,
          sources: latestSources,
          usedSearchFallback,
          insufficientEvidence: false,
        };
        event.sender.send(IPC_CHANNELS.KNOWLEDGE_COPILOT_ANSWER_QUESTION_STREAM_EVENT, {
          requestId,
          type: 'cancelled',
          answer: cancelledResult.answer,
          sources: cancelledResult.sources,
          usedSearchFallback: cancelledResult.usedSearchFallback,
        });
        return cancelledResult;
      }
      const message = getErrorMessage(builtInAiService.toUserFacingError(error));
      logger.error(`KNOWLEDGE_COPILOT_ANSWER_QUESTION_STREAM error: ${message}`);

      event.sender.send(IPC_CHANNELS.KNOWLEDGE_COPILOT_ANSWER_QUESTION_STREAM_EVENT, {
        requestId,
        type: 'error',
        error: message,
        sources: [],
        usedSearchFallback: false,
        insufficientEvidence: false,
      });
      return {
        success: false,
        error: message,
        sources: [],
        usedSearchFallback: false,
        insufficientEvidence: false,
      };
    } finally {
      if (requestId && controller && activeQuestionRequests.get(requestId)?.controller === controller) {
        activeQuestionRequests.delete(requestId);
      }
    }
  });

  ipcMain.handle(IPC_CHANNELS.KNOWLEDGE_COPILOT_CANCEL_TASK, (event, request) => {
    try {
      const validated = CancelQuestionSchema.parse(request);
      const activeRequest = activeTaskRequests.get(validated.requestId);
      if (!activeRequest) {
        return { success: true, cancelled: false };
      }
      if (activeRequest.webContentsId !== event.sender.id) {
        return { success: false, cancelled: false, error: 'Cannot cancel a task owned by another window' };
      }
      activeRequest.controller.abort();
      return { success: true, cancelled: true };
    } catch (error) {
      return { success: false, cancelled: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.KNOWLEDGE_COPILOT_RUN_TASK, async (event, request) => {
    let requestId = '';
    let controller: AbortController | null = null;
    try {
      const validated = RunTaskSchema.parse(request);
      requestId = validated.requestId;
      if (activeTaskRequests.has(requestId)) {
        throw new Error('A Knowledge Assistant task with this ID is already active');
      }
      controller = new AbortController();
      activeTaskRequests.set(requestId, { controller, webContentsId: event.sender.id });
      return await runKnowledgeCopilotTask(validated.task, {
        writeMode: validated.writeMode,
        conversationId: validated.conversationId,
        context: validated.context,
        decisions: validated.decisions,
        signal: controller.signal,
      });
    } catch (error) {
      if (controller?.signal.aborted) {
        return {
          success: false,
          cancelled: true,
          finalAnswer: undefined,
          steps: [],
          traceEvents: [],
          sources: [],
          writeMode: 'confirm',
          pendingWrites: [],
          executedWrites: [],
          stopReason: 'cancelled',
          conversationId: '',
          pendingActions: [],
        };
      }
      const message = getErrorMessage(builtInAiService.toUserFacingError(error));
      logger.error(`KNOWLEDGE_COPILOT_RUN_TASK error: ${message}`);
      return {
        success: false,
        error: message,
        finalAnswer: undefined,
        steps: [],
        traceEvents: [],
        sources: [],
        writeMode: 'confirm',
        pendingWrites: [],
        executedWrites: [],
        stopReason: undefined,
        conversationId: '',
        pendingActions: [],
      };
    } finally {
      if (requestId && controller && activeTaskRequests.get(requestId)?.controller === controller) {
        activeTaskRequests.delete(requestId);
      }
    }
  });

  ipcMain.handle(IPC_CHANNELS.KNOWLEDGE_COPILOT_DELETE_NOTE_INDEX, async (_event, noteId) => {
    try {
      const validatedNoteId = z.string().min(1).parse(noteId);
      await initializeKnowledgeCopilotIndex();
      return await knowledgeCopilotIndexService.deleteNoteIndex(validatedNoteId);
    } catch (error) {
      const message = getErrorMessage(error);
      logger.error(`KNOWLEDGE_COPILOT_DELETE_NOTE_INDEX error: ${message}`);
      return { success: false, error: message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.KNOWLEDGE_COPILOT_GET_STATUS, async () => {
    try {
      const status = await knowledgeCopilotIndexService.getStatus();
      return { success: true, ...status };
    } catch (error) {
      const message = getErrorMessage(error);
      logger.error(`KNOWLEDGE_COPILOT_GET_STATUS error: ${message}`);
      return { success: false, error: message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.KNOWLEDGE_COPILOT_REBUILD_INDEX, async () => {
    try {
      await initializeKnowledgeCopilotIndex();
      await knowledgeCopilotIndexService.clear();
      return { success: true };
    } catch (error) {
      const message = getErrorMessage(error);
      logger.error(`KNOWLEDGE_COPILOT_REBUILD_INDEX error: ${message}`);
      return { success: false, error: message };
    }
  });

  logger.info('Knowledge Copilot IPC handlers registered');
}
