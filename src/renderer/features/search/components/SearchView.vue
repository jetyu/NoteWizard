<template>
  <div class="search-view panel">
    <header class="search-view__header">
      <div class="search-view__title-wrap">
        <span class="search-view__title-icon">
          <IconSubtitlesAi :size="18" />
        </span>
        <h1 class="search-view__title">{{ $t('search.knowledgeSearch') }}</h1>
      </div>
    </header>

    <main ref="contentRef" class="search-view__content" :class="{ 'is-resizing-pane': isResizingPane }">
      <aside class="search-view__history-pane" :style="historyPaneStyle">
        <header class="search-view__pane-header">
          <h2>{{ $t('search.recentConversations') }}</h2>
          <button type="button" class="search-view__new-thread icon-action-button"
            :title="$t('search.newKnowledgeChat')" @click="startNewThread">
            <IconPlus :size="14" />
            <span>{{ $t('search.newKnowledgeChat') }}</span>
          </button>
        </header>
        <div v-if="questionThreads.length > 0" class="search-view__history-list">
          <div v-for="thread in questionThreads" :key="thread.id" class="search-view__history-item"
            :class="{ 'is-active': activeThreadId === thread.id, 'is-draft': thread.isDraft }">
            <button type="button" class="search-view__history-open" :title="thread.title" @click="selectThread(thread)">
              <span class="search-view__history-query">{{ thread.title }}</span>
              <span class="search-view__history-answer">{{ thread.preview }}</span>
              <span class="search-view__history-meta">{{ formatAskedAt(thread.askedAt) }}</span>
            </button>
            <button v-if="!isGeneratingThread(thread)" type="button" class="search-view__history-delete"
              :title="$t('button.delete')" @click.stop.prevent="deleteQuestionThread(thread)">
              <IconTrash :size="14" />
            </button>
          </div>
        </div>
        <div v-else class="search-view__history-empty">
          {{ $t('search.knowledgeHistoryEmpty') }}
        </div>
      </aside>

      <div class="search-view__pane-divider" @pointerdown="handleDividerPointerDown"></div>

      <section class="search-view__answer-pane">
        <header class="search-view__pane-header">
          <h2>{{ conversationPaneTitle }}</h2>
        </header>

        <div ref="messageListRef" class="search-view__chat-scroll">
          <div v-if="searchError && !hasChatMessages" class="search-view__status">
            <p class="search-view__status-text search-view__status-text--error">{{ searchError }}</p>
          </div>
          <div v-else-if="!canUseKnowledgeSearch && !hasChatMessages" class="search-view__status">
            <IconMessageChatbot :size="72" class="search-view__status-icon" />
            <p class="search-view__status-text">{{ knowledgeUnavailableReason }}</p>
          </div>
          <div v-else-if="isActiveDraftThread" class="search-view__status">
            <IconMessageChatbot :size="72" class="search-view__status-icon" />
            <p class="search-view__status-text">{{ $t('search.newKnowledgeChatPreview') }}</p>
          </div>
          <div v-else-if="!hasChatMessages" class="search-view__status">
            <IconMessageChatbot :size="72" class="search-view__status-icon" />
            <p class="search-view__status-text">{{ $t('search.semanticHint') }}</p>
          </div>
          <div v-else class="search-view__chat-inner">
            <article v-for="question in chatQuestions" :key="question.id" class="search-view__chat-turn"
              :class="{ 'is-active': selectedQuestion?.id === question.id }" :data-question-id="question.id">
              <div class="search-view__message search-view__message--user">
                <div class="search-view__user-message">
                  <div class="search-view__user-bubble">
                    {{ question.query }}
                  </div>
                  <div class="search-view__message-actions search-view__message-actions--user">
                    <button type="button" class="search-view__message-action"
                      :title="$t(copiedActionId === `${question.id}:user` ? 'search.messageCopied' : 'button.copy')"
                      :aria-label="$t(copiedActionId === `${question.id}:user` ? 'search.messageCopied' : 'button.copy')"
                      @click="copyMessageText(question.query, `${question.id}:user`)">
                      <IconCopyCheck v-if="copiedActionId === `${question.id}:user`" :size="14" />
                      <IconCopy v-else :size="14" />
                    </button>
                    <button v-if="isLatestSettledOrdinaryQuestion(question)" type="button"
                      class="search-view__message-action" :disabled="isThreadBusy(question.threadId)" :title="$t('button.edit')"
                      :aria-label="$t('button.edit')"
                      @click="beginEditingQuestion(question)">
                      <IconEdit :size="14" />
                    </button>
                    <span v-if="formatQuestionAskedAt(question)" class="search-view__message-timestamp">
                      {{ formatQuestionAskedAt(question) }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="search-view__message search-view__message--assistant">
                <span class="search-view__assistant-avatar">
                  <IconSubtitlesAi :size="15" />
                </span>
                <div class="search-view__assistant-message-body">
                  <div class="search-view__assistant-card">
                  <div v-if="isGeneratingQuestion(question) && !getQuestionAnswer(question)"
                    class="search-view__thinking" role="status" aria-live="polite">
                    <span class="search-view__thinking-dots" aria-hidden="true">
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                    <span>{{ getQuestionThinkingLabel(question) }}</span>
                  </div>
                  <p v-else-if="getQuestionError(question)"
                    class="search-view__status-text search-view__status-text--error">
                    {{ getQuestionError(question) }}
                  </p>
                  <template v-else>
                    <div v-if="question.generationStatus === 'stopped'" class="search-view__stopped-notice">
                      {{ $t('search.answerStopped') }}
                    </div>
                    <div v-if="shouldDisplayFallbackNotice(question)" class="search-view__fallback-notice">
                      {{ $t('search.retrievalOnlyNotice') }}
                    </div>
                    <div v-if="getQuestionAnswer(question)" class="search-view__answer-content markdown-body"
                      v-html="renderQuestionAnswer(question)"></div>
                    <p v-else-if="question.generationStatus !== 'stopped'" class="search-view__status-text">
                      {{ $t('search.noResultsSemantic') }}
                    </p>
                    <div v-if="canSaveQuestionAsNote(question)" class="search-view__answer-actions">
                      <button type="button" class="search-view__save-note-button icon-action-button"
                        :disabled="Boolean(savingSummaryActionId)" @click="saveQuestionAsNote(question)">
                        <IconPlus :size="14" />
                        <span>{{ savingSummaryActionId === `${question.id}:create` ? $t('search.agentTaskApplying') :
                          $t('search.agentTaskSaveAsNote') }}</span>
                      </button>
                    </div>
                    <div v-if="getQuestionSources(question).length > 0" class="search-view__sources">
                      <h3>{{ $t('search.knowledgeSources') }}</h3>
                      <button v-for="source in getQuestionSources(question)" :key="source.noteId" type="button"
                        class="search-view__source-card" :title="source.noteTitle" @click="openSourceNote(source)">
                        <span class="search-view__source-card-head">
                          <IconFileText :size="15" />
                          <span>{{ source.noteTitle }}</span>
                        </span>
                      </button>
                    </div>
                    <div v-if="getAgentSteps(question).length > 0" class="search-view__agent-steps">
                      <h3>{{ $t('search.agentTaskSteps') }}</h3>
                      <ol>
                        <li v-for="(step, index) in getAgentSteps(question)" :key="`${question.id}:step:${index}`"
                          :class="`is-${step.status}`">
                          <span>{{ formatAgentStepTitle(step) }}</span>
                          <small>{{ formatAgentStepDetail(step) }}</small>
                        </li>
                      </ol>
                    </div>
                    <div v-if="getAgentTraceEvents(question).length > 0" class="search-view__agent-trace">
                      <h3>{{ $t('search.agentTaskTrace') }}</h3>
                      <ol>
                        <li v-for="event in getAgentTraceEvents(question)" :key="event.id"
                          :class="`is-${event.status}`">
                          <span>{{ formatAgentTraceTitle(event) }}</span>
                          <small>{{ formatAgentTraceDetail(event) }}</small>
                        </li>
                      </ol>
                    </div>
                    <div v-if="getPendingActions(question).length > 0" class="search-view__agent-writes">
                      <h3>{{ $t('search.agentTaskApprovalRequired') }}</h3>
                      <article v-for="(action, index) in getPendingActions(question)" :key="`${question.id}:approval:${index}`" class="search-view__agent-write-card">
                        <div class="search-view__agent-write-main">
                          <strong>{{ action.name }}</strong>
                          <p>{{ action.description }}</p>
                          <pre>{{ JSON.stringify(action.args, null, 2) }}</pre>
                        </div>
                        <div class="search-view__agent-write-actions">
                          <button type="button" class="search-view__agent-write-apply action-button primary" :disabled="isThreadBusy(question.threadId)" @click="resumeAgentAction(question, 'approve')">
                            <IconCheck :size="14" />{{ $t('button.approve') }}
                          </button>
                          <button v-if="action.allowedDecisions.includes('edit')" type="button" class="search-view__agent-write-dismiss action-button secondary" :disabled="isThreadBusy(question.threadId)" @click="editAndResumeAgentAction(question, action, index)">
                            {{ $t('button.edit') }}
                          </button>
                          <button type="button" class="search-view__agent-write-dismiss action-button secondary" :disabled="isThreadBusy(question.threadId)" @click="resumeAgentAction(question, 'reject')">
                            {{ $t('button.reject') }}
                          </button>
                        </div>
                      </article>
                    </div>
                    <div v-if="getVisibleWriteProposals(question).length > 0" class="search-view__agent-writes">
                      <h3>{{ $t('search.agentTaskWriteProposal') }}</h3>
                      <article v-for="proposal in getVisibleWriteProposals(question)" :key="proposal.id"
                        class="search-view__agent-write-card">
                        <div class="search-view__agent-write-main">
                          <strong>{{ getWriteProposalTitle(proposal) }}</strong>
                          <p>{{ proposal.reason }}</p>
                          <pre>{{ getWriteProposalPreview(proposal) }}</pre>
                        </div>
                        <div class="search-view__agent-write-actions">
                          <button type="button" class="search-view__agent-write-apply action-button primary"
                            :disabled="Boolean(applyingWriteProposalId)"
                            @click="applyWriteProposal(question, proposal)">
                            <IconCheck :size="14" />
                            <span>{{ applyingWriteProposalId === proposal.id ? $t('search.agentTaskApplying') :
                              getWriteProposalActionLabel(proposal) }}</span>
                          </button>
                          <button type="button" class="search-view__agent-write-dismiss action-button secondary"
                            :disabled="Boolean(applyingWriteProposalId)"
                            @click="dismissWriteProposal(question, proposal.id)">
                            {{ $t('search.agentTaskDismissWrite') }}
                          </button>
                        </div>
                      </article>
                    </div>
                    <div v-if="getExecutedWrites(question).length > 0" class="search-view__agent-writes">
                      <h3>{{ $t('search.agentTaskExecutedWrites') }}</h3>
                      <article v-for="write in getExecutedWrites(question)" :key="write.id"
                        class="search-view__agent-write-card search-view__agent-write-card--executed">
                        <div class="search-view__agent-write-main">
                          <strong>{{ write.noteTitle }}</strong>
                          <p>{{ write.reason }}</p>
                          <pre>{{ getExecutedWritePreview(write) }}</pre>
                        </div>
                        <div class="search-view__agent-write-actions">
                          <button type="button" class="search-view__agent-write-apply action-button primary"
                            @click="openExecutedWrite(write)">
                            <IconFileText :size="14" />
                            <span>{{ $t('search.agentTaskOpenExecutedWrite') }}</span>
                          </button>
                        </div>
                      </article>
                    </div>
                  </template>
                  </div>
                  <div v-if="getQuestionAnswer(question) || isLatestSettledOrdinaryQuestion(question) || formatQuestionAnsweredAt(question) || formatQuestionResponseTime(question)"
                    class="search-view__message-actions search-view__message-actions--assistant">
                    <button v-if="getQuestionAnswer(question)" type="button" class="search-view__message-action"
                      :title="$t(copiedActionId === `${question.id}:assistant` ? 'search.messageCopied' : 'button.copy')"
                      :aria-label="$t(copiedActionId === `${question.id}:assistant` ? 'search.messageCopied' : 'button.copy')"
                      @click="copyMessageText(getQuestionAnswer(question), `${question.id}:assistant`)">
                      <IconCopyCheck v-if="copiedActionId === `${question.id}:assistant`" :size="14" />
                      <IconCopy v-else :size="14" />
                    </button>
                    <button v-if="isLatestSettledOrdinaryQuestion(question)" type="button"
                      class="search-view__message-action" :disabled="isThreadBusy(question.threadId)"
                      :title="$t(question.generationStatus === 'failed' || question.generationStatus === 'stopped' ? 'search.retryAnswer' : 'search.regenerateAnswer')"
                      :aria-label="$t(question.generationStatus === 'failed' || question.generationStatus === 'stopped' ? 'search.retryAnswer' : 'search.regenerateAnswer')"
                      @click="regenerateQuestion(question)">
                      <IconRefresh :size="14" />
                    </button>
                    <span v-if="formatQuestionAnsweredAt(question)" class="search-view__message-timestamp">
                      {{ formatQuestionAnsweredAt(question) }}
                    </span>
                    <span v-if="formatQuestionResponseTime(question)" class="search-view__message-timestamp">
                      {{ $t('search.responseTime', { duration: formatQuestionResponseTime(question) }) }}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>

        <section class="search-view__query">
          <div class="search-view__input-shell" :class="{ 'is-disabled': !canUseKnowledgeSearch }">
            <div v-if="editingQuestionId" class="search-view__editing-indicator">
              <span>{{ $t('search.editingMessage') }}</span>
              <button type="button" :title="$t('button.cancel')" :aria-label="$t('button.cancel')"
                @click="cancelEditingQuestion">
                <IconX :size="13" />
              </button>
            </div>
            <div class="search-view__input-main">
              <textarea ref="searchInput" v-model="searchQuery" class="search-view__input" rows="1"
                :disabled="!canUseKnowledgeSearch" :placeholder="composerPlaceholder" @input="resizeComposer"
                @keydown="handleComposerKeydown" />
              <button v-if="searchQuery" type="button" class="search-view__clear-button" :title="$t('button.clear')"
                @click="clearQuery">
                <IconX :size="14" />
              </button>
            </div>
            <div class="search-view__input-toolbar">
              <div class="search-view__toolbar-left">
                <div class="search-view__mode-selector">
                  <button type="button" class="search-view__mode-button" :disabled="isActiveThreadBusy || !canUseKnowledgeSearch"
                    :aria-label="$t('search.inputModeLabel')" :aria-expanded="isModeMenuOpen"
                    @click.stop="toggleModeMenu">
                    <IconTextScanAi v-if="inputMode === 'agent-task'" :size="14" />
                    <IconMessage2Bolt v-else :size="14" />
                    <span>{{ $t(activeInputMode.labelKey) }}</span>
                    <IconChevronDown :size="13" />
                  </button>
                  <div v-if="isModeMenuOpen" class="search-view__mode-menu">
                    <button v-for="mode in inputModes" :key="mode.id" type="button" class="search-view__mode-option"
                      :class="{ 'is-active': inputMode === mode.id }" @click="selectInputMode(mode.id)">
                      <span>{{ $t(mode.labelKey) }}</span>
                      <small>{{ $t(mode.descriptionKey) }}</small>
                    </button>
                  </div>
                </div>
                <button v-if="inputMode === 'agent-task'" type="button" class="search-view__execution-button action-button secondary"
                  :disabled="isActiveThreadBusy"
                  :title="$t(agentWriteMode === 'auto' ? 'search.agentWriteModeAutoDescription' : 'search.agentWriteModeConfirmDescription')"
                  @click="toggleAgentWriteMode">
                  {{ $t(agentWriteMode === 'auto' ? 'search.agentWriteModeAuto' : 'search.agentWriteModeConfirm') }}
                </button>
              </div>
              <div class="search-view__toolbar-right">
                <div class="search-view__model-selector">
                  <button type="button" class="search-view__mode-button search-view__model-button"
                    :disabled="isModelSelectorDisabled" :aria-label="$t('search.modelServiceLabel')"
                    :aria-expanded="isModelMenuOpen" :title="activeModelServiceTitle"
                    @click.stop="toggleModelMenu">
                    <IconSubtitlesAi :size="14" />
                    <span>{{ activeModelServiceName }}</span>
                    <IconChevronDown :size="13" />
                  </button>
                  <div v-if="isModelMenuOpen" class="search-view__mode-menu search-view__model-menu">
                    <button v-if="inputMode === 'ask'" type="button"
                      class="search-view__mode-option search-view__model-option"
                      :class="{ 'is-active': isRetrievalOnlySelected }"
                      @click="selectModelSource('')">
                      <span class="search-view__model-option-copy">
                        <span>{{ $t('search.modelServiceRetrievalOnly') }}</span>
                        <small>{{ $t('search.modelServiceRetrievalOnlyDescription') }}</small>
                      </span>
                      <IconCheck v-if="isRetrievalOnlySelected" :size="14" />
                    </button>
                    <button v-for="source in chatSources" :key="source.id" type="button"
                      class="search-view__mode-option search-view__model-option"
                      :class="{ 'is-active': activeModelSourceId === source.id }"
                      @click="selectModelSource(source.id)">
                      <span class="search-view__model-option-copy">
                        <span>{{ source.name }}</span>
                        <small>{{ resolveAiSourceModel(source, 'chat') }}</small>
                      </span>
                      <IconCheck v-if="activeModelSourceId === source.id" :size="14" />
                    </button>
                  </div>
                </div>
                <button v-if="canStopCurrentGeneration" type="button"
                  class="search-view__ask-button search-view__ask-button--stop icon-action-button"
                  :title="$t('search.stopGenerating')" :aria-label="$t('search.stopGenerating')"
                  @click="handleStopCurrentGeneration">
                  <IconPlayerStopFilled :size="15" />
                </button>
                <button v-else type="button" class="search-view__ask-button icon-action-button" :disabled="!canAsk"
                  :title="sendButtonTitle" @click="handleAsk">
                  <IconSend :size="15" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { IconX, IconMessage2Bolt, IconSubtitlesAi, IconTrash, IconFileText, IconPlus, IconTextScanAi, IconChevronDown, IconCheck, IconSend, IconMessageChatbot, IconCopy, IconCopyCheck, IconEdit, IconRefresh, IconPlayerStopFilled } from '@tabler/icons-vue';
import { renderMarkdown } from '@renderer/core/markdown/markdownRenderer';
import { renderMarkdownEnhancements } from '@renderer/core/markdown/markdownEnhancements';
import { useKnowledgeCopilotConfig, useKnowledgeCopilotChat, useKnowledgeCopilotTask } from '@renderer/features/knowledge-copilot';
import { createLogger } from '@renderer/features/logger';
import { getErrorMessage } from '@shared/utils/error.utils';
import { useWorkbenchStore } from '@renderer/features/workbench';
import { useWorkspace } from '@renderer/features/workspace';
import { useAppShellStore } from '@renderer/app/store/appShell.store';
import { useSettingsStore } from '@renderer/features/settings';
import { resolveAiSourceModel } from '@shared/ai-provider.constants';
import type {
  KnowledgeCopilotExecutedWrite,
  KnowledgeCopilotPendingAction,
  KnowledgeCopilotTaskResult,
  KnowledgeAnswerStage,
  KnowledgeCopilotStep,
  KnowledgeCopilotTraceEvent,
  KnowledgeCopilotWriteMode,
  KnowledgeCopilotWriteProposal,
  KnowledgeSearchResult,
} from '@renderer/core/bridge/electronApi';
import type { WorkbenchQuestionEntry, WorkbenchQuestionSource } from '@renderer/features/workbench/constants/workbench.constants';
import { KNOWLEDGE_COPILOT_CONVERSATION_LIMITS, type KnowledgeCopilotConversationContext } from '@shared/knowledge-copilot.constants';
import { useSearch } from '../composables/useSearch';

type KnowledgeInputMode = 'ask' | 'agent-task';

interface InputModeOption {
  id: KnowledgeInputMode;
  labelKey: string;
  descriptionKey: string;
}

interface QuestionThread {
  id: string;
  title: string;
  preview: string;
  askedAt: number;
  questions: WorkbenchQuestionEntry[];
  latestQuestion: WorkbenchQuestionEntry | null;
  isDraft: boolean;
}

interface AgentTaskMetadata {
  writeMode: KnowledgeCopilotWriteMode;
  steps: KnowledgeCopilotStep[];
  traceEvents: KnowledgeCopilotTraceEvent[];
  pendingWrites: KnowledgeCopilotWriteProposal[];
  executedWrites: KnowledgeCopilotExecutedWrite[];
  dismissedWriteIds: string[];
  createdWriteIds: string[];
  conversationId: string;
  pendingActions: KnowledgeCopilotPendingAction[];
}

interface KnowledgeGenerationRun {
  requestId: string;
  questionId: string;
  threadId: string;
  mode: KnowledgeInputMode;
  stopRequested: boolean;
  sources: KnowledgeSearchResult[];
  usedSearchFallback: boolean;
}

const searchViewLogger = createLogger('SearchView');
const { t } = useI18n();
const workbenchStore = useWorkbenchStore();
const { conversationThreads } = storeToRefs(workbenchStore);
const appShellStore = useAppShellStore();
const settingsStore = useSettingsStore();
const { config } = storeToRefs(settingsStore);
const { selectNote, createNote, initializeWorkspace, applyNoteContentUpdate } = useWorkspace();
const {
  searchViewRequest,
  lastKnowledgeConversationThreadId,
  activeKnowledgeConversationThreadId,
  knowledgeConversationDraft,
  rememberKnowledgeConversationThread,
  setKnowledgeConversationDraft,
  forgetKnowledgeConversationThread,
} = useSearch();
const { isEnabled: knowledgeCopilotEnabled, isConfigured: knowledgeCopilotConfigured } = useKnowledgeCopilotConfig();
const { askQuestionStream, stopGenerating } = useKnowledgeCopilotChat();
const { runTask, resumeTask, stopTask } = useKnowledgeCopilotTask();

const inputModes: InputModeOption[] = [
  {
    id: 'ask',
    labelKey: 'search.inputModeQa',
    descriptionKey: 'search.inputModeQaDescription',
  },
  {
    id: 'agent-task',
    labelKey: 'search.inputModeAgentTask',
    descriptionKey: 'search.inputModeAgentTaskDescription',
  },
];

const inputMode = ref<KnowledgeInputMode>(config.value.knowledgeCopilot.defaultMode === 'agent' ? 'agent-task' : 'ask');
const isModeMenuOpen = ref(false);
const isModelMenuOpen = ref(false);
const searchQuery = ref('');
const searchError = ref('');
const searchInput = ref<HTMLTextAreaElement | null>(null);
const messageListRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const selectedQuestion = ref<WorkbenchQuestionEntry | null>(null);
const activeThreadId = ref<string | null>(null);
const draftThreadId = ref<string | null>(knowledgeConversationDraft.value?.id ?? null);
const draftThreadCreatedAt = ref(knowledgeConversationDraft.value?.createdAt ?? 0);
const questionModes = ref<Record<string, KnowledgeInputMode>>({});
const agentTaskMetadata = ref<Record<string, AgentTaskMetadata>>({});
const streamingAnswers = ref<Record<string, string>>({});
const questionAnswerStages = ref<Record<string, KnowledgeAnswerStage>>({});
const activeRuns = ref<Record<string, KnowledgeGenerationRun>>({});
const questionSources = ref<Record<string, KnowledgeSearchResult[]>>({});
const activeQuestionErrors = ref<Record<string, string>>({});
const activeFallbackQuestionIds = ref<Record<string, boolean>>({});
const copiedActionId = ref('');
const editingQuestionId = ref('');
const applyingWriteProposalId = ref('');
const savingSummaryActionId = ref('');
let markdownEnhancementRunId = 0;
let copiedActionTimeout: ReturnType<typeof setTimeout> | null = null;
let viewListenersActive = false;

const HISTORY_PANE_DEFAULT_WIDTH = 300;
const HISTORY_PANE_MIN_WIDTH = 220;
const HISTORY_PANE_MAX_WIDTH = 480;
const ANSWER_PANE_MIN_WIDTH = 400;

const historyPaneWidth = ref(HISTORY_PANE_DEFAULT_WIDTH);
const isResizingPane = ref(false);

const historyPaneStyle = computed(() => {
  const w = `${historyPaneWidth.value}px`;
  return { width: w, minWidth: w, maxWidth: w, flex: `0 0 ${w}` };
});

function clampHistoryPaneWidth(): void {
  const container = contentRef.value;
  if (!container) return;
  const maxW = Math.min(HISTORY_PANE_MAX_WIDTH, container.clientWidth - ANSWER_PANE_MIN_WIDTH);
  historyPaneWidth.value = Math.round(
    Math.max(HISTORY_PANE_MIN_WIDTH, Math.min(historyPaneWidth.value, maxW)),
  );
}

function handlePaneResizeMove(event: PointerEvent): void {
  const container = contentRef.value;
  if (!container) return;
  const rect = container.getBoundingClientRect();
  const maxW = Math.min(HISTORY_PANE_MAX_WIDTH, rect.width - ANSWER_PANE_MIN_WIDTH);
  historyPaneWidth.value = Math.round(
    Math.max(HISTORY_PANE_MIN_WIDTH, Math.min(event.clientX - rect.left, maxW)),
  );
}

function handlePaneResizeEnd(): void {
  isResizingPane.value = false;
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  window.removeEventListener('pointermove', handlePaneResizeMove);
  window.removeEventListener('pointerup', handlePaneResizeEnd);
  window.removeEventListener('pointercancel', handlePaneResizeEnd);
}

function handleDividerPointerDown(event: PointerEvent): void {
  if (!event.isPrimary || event.button !== 0) return;
  event.preventDefault();
  isResizingPane.value = true;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  window.addEventListener('pointermove', handlePaneResizeMove);
  window.addEventListener('pointerup', handlePaneResizeEnd);
  window.addEventListener('pointercancel', handlePaneResizeEnd);
}

const canUseKnowledgeSearch = computed(() => knowledgeCopilotEnabled.value && knowledgeCopilotConfigured.value);
const isActiveThreadBusy = computed(() => Boolean(activeThreadId.value && activeRuns.value[activeThreadId.value]));
const isBusy = computed(() => isActiveThreadBusy.value);
const activeInputMode = computed(() => inputModes.find((mode) => mode.id === inputMode.value) ?? inputModes[0]);
const chatSources = computed(() => config.value.aiSources.sources.filter((source) => (
  source.capabilities.length === 0 || source.capabilities.includes('chat')
)));
const activeModelSourceId = computed(() => (
  inputMode.value === 'agent-task'
    ? config.value.knowledgeCopilot.agentChatSourceId
    : config.value.knowledgeCopilot.askChatSourceId
));
const activeModelSource = computed(() => (
  chatSources.value.find((source) => source.id === activeModelSourceId.value) ?? null
));
const isRetrievalOnlySelected = computed(() => (
  inputMode.value === 'ask' && !activeModelSourceId.value
));
const activeModelServiceName = computed(() => {
  if (isRetrievalOnlySelected.value) {
    return t('search.modelServiceRetrievalOnly');
  }
  return activeModelSource.value?.name ?? t('search.modelServiceLabel');
});
const activeModelServiceTitle = computed(() => {
  if (isRetrievalOnlySelected.value) {
    return t('search.modelServiceRetrievalOnlyDescription');
  }
  if (!activeModelSource.value) {
    return t('search.modelServiceLabel');
  }
  return `${activeModelSource.value.name} · ${resolveAiSourceModel(activeModelSource.value, 'chat')}`;
});
const isModelSelectorDisabled = computed(() => (
  isBusy.value
  || !canUseKnowledgeSearch.value
  || (inputMode.value === 'agent-task' && chatSources.value.length === 0)
));
const hasValidModelSelection = computed(() => (
  isRetrievalOnlySelected.value || Boolean(activeModelSource.value)
));
const canAsk = computed(() => (
  canUseKnowledgeSearch.value
  && Boolean(searchQuery.value.trim())
  && !isBusy.value
  && hasValidModelSelection.value
));
const canStopCurrentGeneration = computed(() => isActiveThreadBusy.value);
const agentWriteMode = computed<KnowledgeCopilotWriteMode>(() => config.value.workbench.agentWriteMode ?? 'confirm');
const composerPlaceholder = computed(() => (
  inputMode.value === 'agent-task'
    ? t('search.agentTaskPlaceholder')
    : t('search.semanticPlaceholder')
));
const knowledgeUnavailableReason = computed(() => {
  if (!knowledgeCopilotEnabled.value) {
    return t('search.knowledgeUnavailableDisabled');
  }
  if (!knowledgeCopilotConfigured.value) {
    return t('message.error.knowledgeCopilotNotConfigured');
  }
  return '';
});
const sendButtonTitle = computed(() => {
  if (!canUseKnowledgeSearch.value) {
    return knowledgeUnavailableReason.value;
  }
  return t('search.knowledgeAsk');
});
const questionThreads = computed<QuestionThread[]>(() => {
  const threadMap = new Map<string, WorkbenchQuestionEntry[]>();

  conversationThreads.value.forEach((thread) => threadMap.set(thread.id, thread.questions));

  const threads = Array.from(threadMap.entries())
    .map(([threadId, questions]) => {
      const sortedQuestions = [...questions].sort((left, right) => left.askedAt - right.askedAt);
      const firstQuestion = sortedQuestions[0];
      const latestQuestion = sortedQuestions[sortedQuestions.length - 1];

      return {
        id: threadId,
        title: firstQuestion.query,
        preview: getQuestionPreview(latestQuestion),
        askedAt: latestQuestion.askedAt,
        questions: sortedQuestions,
        latestQuestion,
        isDraft: false,
      };
    })
    .sort((left, right) => right.askedAt - left.askedAt);

  if (draftThreadId.value && !threads.some((thread) => thread.id === draftThreadId.value)) {
    return [
      {
        id: draftThreadId.value,
        title: t('search.newKnowledgeChat'),
        preview: t('search.newKnowledgeChatPreview'),
        askedAt: draftThreadCreatedAt.value,
        questions: [],
        latestQuestion: null,
        isDraft: true,
      },
      ...threads,
    ];
  }

  return threads;
});
const activeThread = computed<QuestionThread | undefined>(() => (
  questionThreads.value.find((thread) => thread.id === activeThreadId.value)
));
const isActiveDraftThread = computed(() => activeThread.value?.isDraft === true);
const conversationPaneTitle = computed(() => (
  activeThread.value?.title ?? t('label.ConversationContent')
));
const chatQuestions = computed<WorkbenchQuestionEntry[]>(() => {
  return activeThread.value?.questions ?? [];
});
const hasChatMessages = computed(() => chatQuestions.value.length > 0);
function getActiveRun(threadId: string | null | undefined): KnowledgeGenerationRun | null {
  if (!threadId) {
    return null;
  }

  return activeRuns.value[threadId] ?? null;
}

function isThreadBusy(threadId: string): boolean {
  return Boolean(activeRuns.value[threadId]);
}

function updateActiveRun(threadId: string, update: Partial<KnowledgeGenerationRun>): void {
  const run = activeRuns.value[threadId];
  if (!run || (update.requestId && update.requestId !== run.requestId)) {
    return;
  }

  activeRuns.value = {
    ...activeRuns.value,
    [threadId]: { ...run, ...update },
  };
}

function removeActiveRun(threadId: string, requestId: string): void {
  const run = activeRuns.value[threadId];
  if (!run || run.requestId !== requestId) {
    return;
  }

  const nextRuns = { ...activeRuns.value };
  delete nextRuns[threadId];
  activeRuns.value = nextRuns;
}

function getRunForQuestion(questionId: string): KnowledgeGenerationRun | null {
  return Object.values(activeRuns.value).find((run) => run.questionId === questionId) ?? null;
}

function clearQuestionTransientState(questionId: string): void {
  const nextErrors = { ...activeQuestionErrors.value };
  delete nextErrors[questionId];
  activeQuestionErrors.value = nextErrors;
  const nextFallbacks = { ...activeFallbackQuestionIds.value };
  delete nextFallbacks[questionId];
  activeFallbackQuestionIds.value = nextFallbacks;
}

function buildQuestionSources(results: KnowledgeSearchResult[]): WorkbenchQuestionSource[] {
  const sourceMap = new Map<string, WorkbenchQuestionSource>();

  results.forEach((result) => {
    const noteId = result.chunk.noteId;
    if (!noteId || sourceMap.has(noteId)) {
      return;
    }

    sourceMap.set(noteId, {
      noteId,
      noteTitle: result.noteTitle || t('common.untitledNote'),
    });
  });

  return Array.from(sourceMap.values());
}

function focusSearchInput(): void {
  void nextTick(() => {
    searchInput.value?.focus();
  });
}

function toggleModeMenu(): void {
  if (isBusy.value || !canUseKnowledgeSearch.value) {
    return;
  }

  isModeMenuOpen.value = !isModeMenuOpen.value;
  if (isModeMenuOpen.value) {
    isModelMenuOpen.value = false;
  }
}

function selectInputMode(mode: KnowledgeInputMode): void {
  inputMode.value = mode;
  isModeMenuOpen.value = false;
  isModelMenuOpen.value = false;
  focusSearchInput();
}

function toggleModelMenu(): void {
  if (isModelSelectorDisabled.value) {
    return;
  }

  isModelMenuOpen.value = !isModelMenuOpen.value;
  if (isModelMenuOpen.value) {
    isModeMenuOpen.value = false;
  }
}

async function selectModelSource(sourceId: string): Promise<void> {
  if (isBusy.value) {
    return;
  }

  try {
    const key = inputMode.value === 'agent-task' ? 'agentChatSourceId' : 'askChatSourceId';
    await settingsStore.knowledgeCopilot.update(key, sourceId);
    isModelMenuOpen.value = false;
    searchError.value = '';
    focusSearchInput();
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    searchError.value = message;
    searchViewLogger.error('Failed to update Knowledge Copilot model service', { error: message });
  }
}

function createThreadId(askedAt: number): string {
  return `${askedAt}:thread`;
}

function getThreadConversationContext(threadId: string, excludedQuestionId = ''): KnowledgeCopilotConversationContext {
  const thread = conversationThreads.value.find((entry) => entry.id === threadId);
  const questions = (thread?.questions ?? []).filter((question) => question.id !== excludedQuestionId);
  const hasSummaryBoundary = !thread?.summaryUpToQuestionId
    || questions.some((question) => question.id === thread.summaryUpToQuestionId);
  return {
    summary: hasSummaryBoundary ? thread?.summary : undefined,
    summaryUpToQuestionId: hasSummaryBoundary ? thread?.summaryUpToQuestionId : undefined,
    turns: questions
    .map((question): KnowledgeCopilotConversationContext['turns'][number] | null => {
      const answer = (question.fullAnswer || question.answer).trim();
      if (!answer) {
        return null;
      }

      return {
        id: question.id,
        mode: question.mode === 'agent-task' ? 'agent-task' : 'ask',
        query: question.query.trim().slice(0, KNOWLEDGE_COPILOT_CONVERSATION_LIMITS.QUESTION_LENGTH),
        answer: answer.slice(0, KNOWLEDGE_COPILOT_CONVERSATION_LIMITS.ANSWER_LENGTH),
      };
    })
    .filter((turn): turn is KnowledgeCopilotConversationContext['turns'][number] => turn !== null)
    .slice(-KNOWLEDGE_COPILOT_CONVERSATION_LIMITS.VISIBLE_TURNS),
  };
}

function resizeComposer(): void {
  const textarea = searchInput.value;
  if (!textarea) {
    return;
  }

  textarea.style.height = 'auto';
  textarea.style.height = `${Math.min(textarea.scrollHeight, 96)}px`;
}

function scrollChatToBottom(): void {
  if (!viewListenersActive) {
    return;
  }

  void nextTick(() => {
    const messageList = messageListRef.value;
    if (!messageList) {
      return;
    }

    messageList.scrollTop = messageList.scrollHeight;
  });
}

async function syncMarkdownEnhancements(): Promise<void> {
  if (!viewListenersActive) {
    return;
  }

  const runId = ++markdownEnhancementRunId;
  await nextTick();
  if (runId !== markdownEnhancementRunId) {
    return;
  }

  await renderMarkdownEnhancements(messageListRef.value);
}

function scrollQuestionIntoView(questionId: string): void {
  if (!viewListenersActive) {
    return;
  }

  void nextTick(() => {
    const messageList = messageListRef.value;
    if (!messageList) {
      return;
    }

    const target = Array.from(messageList.querySelectorAll<HTMLElement>('[data-question-id]'))
      .find((element) => element.dataset.questionId === questionId);
    target?.scrollIntoView({ block: 'center' });
  });
}

function resetAnswer(): void {
  searchError.value = '';
  selectedQuestion.value = null;
  editingQuestionId.value = '';
}

function startNewThread(): void {
  if (!draftThreadId.value) {
    draftThreadCreatedAt.value = Date.now();
    draftThreadId.value = createThreadId(draftThreadCreatedAt.value);
    setKnowledgeConversationDraft({
      id: draftThreadId.value,
      createdAt: draftThreadCreatedAt.value,
    });
  }

  activeThreadId.value = draftThreadId.value;
  rememberKnowledgeConversationThread(draftThreadId.value, true);
  searchQuery.value = '';
  resetAnswer();
  void nextTick(() => {
    resizeComposer();
    if (messageListRef.value) {
      messageListRef.value.scrollTop = 0;
    }
  });
  focusSearchInput();
}

function clearQuery(): void {
  searchQuery.value = '';
  void nextTick(resizeComposer);
  focusSearchInput();
}

function handleComposerKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing) {
    return;
  }

  event.preventDefault();
  handleAsk();
}

function handleAsk(): void {
  isModeMenuOpen.value = false;
  isModelMenuOpen.value = false;

  const query = searchQuery.value.trim();
  if (!query) {
    return;
  }

  if (!canUseKnowledgeSearch.value) {
    searchError.value = knowledgeUnavailableReason.value;
    return;
  }

  if (isBusy.value) {
    return;
  }

  searchQuery.value = '';
  void nextTick(resizeComposer);

  if (inputMode.value === 'agent-task') {
    editingQuestionId.value = '';
    void runAgentTaskQuestion(query);
    return;
  }

  const editedQuestion = editingQuestionId.value
    ? chatQuestions.value.find((question) => question.id === editingQuestionId.value)
    : undefined;
  editingQuestionId.value = '';
  void askKnowledgeQuestion(query, editedQuestion);
}

async function handleStopCurrentGeneration(): Promise<void> {
  const run = getActiveRun(activeThreadId.value);
  if (!run) {
    return;
  }

  updateActiveRun(run.threadId, { stopRequested: true });
  if (run.mode === 'ask') {
    await stopGenerating(run.requestId);
  } else {
    await stopTask(run.requestId);
  }
}

async function copyMessageText(text: string, actionId: string): Promise<void> {
  const normalizedText = text.trim();
  if (!normalizedText) {
    return;
  }

  try {
    const editorApi = window.electronAPI.editor;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(normalizedText);
      } catch {
        if (!editorApi) {
          throw new Error('Clipboard API is unavailable');
        }
        await editorApi.writeClipboard(normalizedText);
      }
    } else {
      if (!editorApi) {
        throw new Error('Clipboard API is unavailable');
      }
      await editorApi.writeClipboard(normalizedText);
    }

    copiedActionId.value = actionId;
    if (copiedActionTimeout) {
      clearTimeout(copiedActionTimeout);
    }
    copiedActionTimeout = setTimeout(() => {
      if (copiedActionId.value === actionId) {
        copiedActionId.value = '';
      }
      copiedActionTimeout = null;
    }, 1600);
  } catch (error) {
    searchViewLogger.error(`Copy Knowledge Assistant message failed: ${getErrorMessage(error)}`);
  }
}

function isLatestSettledOrdinaryQuestion(question: WorkbenchQuestionEntry): boolean {
  const latestQuestion = chatQuestions.value[chatQuestions.value.length - 1];
  return latestQuestion?.id === question.id
    && getQuestionMode(question) === 'ask'
    && !isGeneratingQuestion(question);
}

function beginEditingQuestion(question: WorkbenchQuestionEntry): void {
  if (isBusy.value || !isLatestSettledOrdinaryQuestion(question)) {
    return;
  }

  inputMode.value = 'ask';
  editingQuestionId.value = question.id;
  searchQuery.value = question.query;
  void nextTick(resizeComposer);
  focusSearchInput();
}

function cancelEditingQuestion(): void {
  editingQuestionId.value = '';
  searchQuery.value = '';
  void nextTick(resizeComposer);
  focusSearchInput();
}

function regenerateQuestion(question: WorkbenchQuestionEntry): void {
  if (isBusy.value || !isLatestSettledOrdinaryQuestion(question)) {
    return;
  }

  editingQuestionId.value = '';
  void askKnowledgeQuestion(question.query, question);
}

async function askKnowledgeQuestion(query: string, targetQuestion?: WorkbenchQuestionEntry): Promise<void> {
  if (!canUseKnowledgeSearch.value) {
    searchError.value = knowledgeUnavailableReason.value;
    return;
  }

  const askedAt = targetQuestion?.askedAt ?? Date.now();
  const threadId = targetQuestion?.threadId ?? activeThreadId.value ?? createThreadId(askedAt);
  if (isThreadBusy(threadId)) {
    return;
  }

  const requestId = `${Date.now()}:${Math.random().toString(36).slice(2)}`;
  const responseStartedAt = Date.now();
  activeRuns.value = {
    ...activeRuns.value,
    [threadId]: {
      requestId,
      questionId: targetQuestion?.id ?? '',
      threadId,
      mode: 'ask',
      stopRequested: false,
      sources: [],
      usedSearchFallback: false,
    },
  };
  if (targetQuestion) {
    clearQuestionTransientState(targetQuestion.id);
  }
  let draftQuestion: WorkbenchQuestionEntry | null = null;
  let generatedAnswer = '';
  let generationStatus: WorkbenchQuestionEntry['generationStatus'] = 'completed';
  let generationError = '';
  let runSources: KnowledgeSearchResult[] = [];
  let runFallback = false;

  try {
    const context = getThreadConversationContext(threadId, targetQuestion?.id);
    activeThreadId.value = threadId;
    draftQuestion = targetQuestion
      ? await workbenchStore.replaceQuestion({
          questionId: targetQuestion.id,
          query,
          responseTimeMs: 0,
          answer: '',
          sourceNoteIds: [],
          sources: [],
        })
      : await workbenchStore.recordQuestion({ query, threadId, mode: 'ask', askedAt });
    if (!draftQuestion) {
      throw new Error('Failed to create Knowledge Assistant question');
    }
    const question = draftQuestion;
    updateActiveRun(threadId, { questionId: draftQuestion.id });
    if (draftThreadId.value === threadId) {
      draftThreadId.value = null;
      draftThreadCreatedAt.value = 0;
      setKnowledgeConversationDraft(null);
    }
    rememberKnowledgeConversationThread(threadId);
    questionModes.value = { ...questionModes.value, [draftQuestion.id]: 'ask' };
    questionAnswerStages.value = { ...questionAnswerStages.value, [draftQuestion.id]: 'preparing' };
    if (activeThreadId.value === threadId) {
      selectedQuestion.value = draftQuestion;
      scrollQuestionIntoView(draftQuestion.id);
    }

    if (!activeRuns.value[threadId]?.stopRequested) {
      try {
        const result = await askQuestionStream(query, threadId, context, {
          onEvent: (event) => {
            const currentRun = activeRuns.value[threadId];
            if (!currentRun || currentRun.requestId !== requestId || currentRun.stopRequested) {
              return;
            }
            if (event.type === 'stage') {
              questionAnswerStages.value = { ...questionAnswerStages.value, [question.id]: event.stage };
              return;
            }
            if (event.type === 'sources') {
              runSources = event.sources;
              runFallback = event.usedSearchFallback;
              updateActiveRun(threadId, { sources: event.sources, usedSearchFallback: event.usedSearchFallback });
              questionSources.value = { ...questionSources.value, [question.id]: event.sources };
            }
          },
          onDelta: (text) => {
            const currentRun = activeRuns.value[threadId];
            if (!currentRun || currentRun.requestId !== requestId || currentRun.stopRequested) {
              return;
            }
            streamingAnswers.value = {
              ...streamingAnswers.value,
              [question.id]: `${streamingAnswers.value[question.id] || ''}${text}`,
            };
            if (activeThreadId.value === threadId) {
              scrollChatToBottom();
            }
          },
        }, requestId);
        runSources = result.sources;
        runFallback = result.usedSearchFallback;
        questionSources.value = { ...questionSources.value, [draftQuestion.id]: result.sources };
        const stopped = activeRuns.value[threadId]?.stopRequested === true;
        const visibleStreamingAnswer = streamingAnswers.value[draftQuestion.id] || '';
        generatedAnswer = stopped || result.cancelled ? visibleStreamingAnswer : result.answer || visibleStreamingAnswer;
        if (result.cancelled || stopped) {
          generationStatus = 'stopped';
        } else {
          await workbenchStore.updateConversationSummary(threadId, result.conversationSummary, result.conversationSummaryUpToQuestionId);
        }
      } catch (error) {
        const message = getErrorMessage(error);
        const stopped = activeRuns.value[threadId]?.stopRequested === true;
        generatedAnswer = streamingAnswers.value[draftQuestion.id] || '';
        if (stopped) {
          generationStatus = 'stopped';
        } else {
          generationStatus = 'failed';
          generationError = message;
          activeQuestionErrors.value = { ...activeQuestionErrors.value, [draftQuestion.id]: message };
          searchViewLogger.error(`Knowledge answer generation failed: ${message}`);
        }
      }
    } else {
      generationStatus = 'stopped';
    }

    if (runFallback) {
      activeFallbackQuestionIds.value = { ...activeFallbackQuestionIds.value, [draftQuestion.id]: true };
    }
    const recordedQuestion = await workbenchStore.replaceQuestion({
      questionId: draftQuestion.id,
      query,
      answeredAt: Date.now(),
      responseTimeMs: Date.now() - responseStartedAt,
      answer: generatedAnswer,
      sourceNoteIds: Array.from(new Set(runSources.map((result) => result.chunk.noteId))),
      sources: buildQuestionSources(runSources),
      generationStatus,
      error: generationError,
    });
    if (recordedQuestion && activeThreadId.value === threadId) {
      selectedQuestion.value = recordedQuestion;
      scrollQuestionIntoView(recordedQuestion.id);
    }
    const nextStreamingAnswers = { ...streamingAnswers.value };
    delete nextStreamingAnswers[draftQuestion.id];
    streamingAnswers.value = nextStreamingAnswers;
    const nextQuestionAnswerStages = { ...questionAnswerStages.value };
    delete nextQuestionAnswerStages[draftQuestion.id];
    questionAnswerStages.value = nextQuestionAnswerStages;
    const nextQuestionSources = { ...questionSources.value };
    delete nextQuestionSources[draftQuestion.id];
    questionSources.value = nextQuestionSources;
  } catch (error) {
    const message = getErrorMessage(error);
    searchViewLogger.error(`Knowledge question failed: ${message}`);
    if (draftQuestion) {
      const stopped = activeRuns.value[threadId]?.stopRequested === true;
      await workbenchStore.replaceQuestion({
        questionId: draftQuestion.id,
        query,
        answeredAt: Date.now(),
        responseTimeMs: Date.now() - responseStartedAt,
        answer: generatedAnswer,
        generationStatus: stopped ? 'stopped' : 'failed',
        error: stopped ? undefined : message,
      });
      if (!stopped) {
        activeQuestionErrors.value = { ...activeQuestionErrors.value, [draftQuestion.id]: message };
      }
    } else if (activeThreadId.value === threadId) {
      searchError.value = message;
    }
  } finally {
    removeActiveRun(threadId, requestId);
    if (activeThreadId.value === threadId) {
      focusSearchInput();
    }
  }
}

function setAgentTaskMetadata(questionId: string, metadata: AgentTaskMetadata): void {
  agentTaskMetadata.value = {
    ...agentTaskMetadata.value,
    [questionId]: metadata,
  };
}

async function toggleAgentWriteMode(): Promise<void> {
  const nextMode: KnowledgeCopilotWriteMode = agentWriteMode.value === 'auto' ? 'confirm' : 'auto';
  await settingsStore.persistence.save({
    workbench: {
      ...config.value.workbench,
      agentWriteMode: nextMode,
    },
  });
}

async function runAgentTaskQuestion(query: string): Promise<void> {
  if (!canUseKnowledgeSearch.value) {
    searchError.value = knowledgeUnavailableReason.value;
    return;
  }

  const askedAt = Date.now();
  const threadId = activeThreadId.value ?? createThreadId(askedAt);
  if (isThreadBusy(threadId)) {
    return;
  }
  const requestId = `${Date.now()}:${Math.random().toString(36).slice(2)}`;
  const responseStartedAt = Date.now();
  activeRuns.value = {
    ...activeRuns.value,
    [threadId]: {
      requestId,
      questionId: '',
      threadId,
      mode: 'agent-task',
      stopRequested: false,
      sources: [],
      usedSearchFallback: false,
    },
  };
  let draftQuestion: WorkbenchQuestionEntry | null = null;
  let generationStatus: WorkbenchQuestionEntry['generationStatus'] = 'completed';
  let generationError = '';
  let generatedAnswer = '';
  let runSources: KnowledgeSearchResult[] = [];
  let metadata: AgentTaskMetadata = {
    writeMode: agentWriteMode.value,
    steps: [],
    traceEvents: [],
    pendingWrites: [],
    executedWrites: [],
    dismissedWriteIds: [],
    createdWriteIds: [],
    conversationId: '',
    pendingActions: [],
  };

  try {
    const context = getThreadConversationContext(threadId);
    activeThreadId.value = threadId;
    draftQuestion = await workbenchStore.recordQuestion({
      query,
      threadId,
      mode: 'agent-task',
      agentWriteMode: agentWriteMode.value,
      askedAt,
    });
    if (!draftQuestion) {
      throw new Error('Failed to create Knowledge Assistant task');
    }
    updateActiveRun(threadId, { questionId: draftQuestion.id });
    if (draftThreadId.value === threadId) {
      draftThreadId.value = null;
      draftThreadCreatedAt.value = 0;
      setKnowledgeConversationDraft(null);
    }
    rememberKnowledgeConversationThread(threadId);
    questionModes.value = { ...questionModes.value, [draftQuestion.id]: 'agent-task' };
    if (activeThreadId.value === threadId) {
      selectedQuestion.value = draftQuestion;
      scrollQuestionIntoView(draftQuestion.id);
    }

    if (!activeRuns.value[threadId]?.stopRequested) {
      try {
        const result = await runTask(query, agentWriteMode.value, threadId, context, requestId);
        const stopped = activeRuns.value[threadId]?.stopRequested === true;
        if (result.cancelled || stopped) {
          generationStatus = 'stopped';
        } else {
          await workbenchStore.updateConversationSummary(threadId, result.conversationSummary, result.conversationSummaryUpToQuestionId);
        }
        runSources = result.sources;
        questionSources.value = { ...questionSources.value, [draftQuestion.id]: result.sources };
        updateActiveRun(threadId, { sources: result.sources });
        generatedAnswer = result.finalAnswer || '';
        metadata = {
          writeMode: result.writeMode,
          steps: result.steps,
          traceEvents: result.traceEvents,
          pendingWrites: result.pendingWrites,
          executedWrites: result.executedWrites,
          dismissedWriteIds: [],
          createdWriteIds: [],
          conversationId: result.conversationId,
          pendingActions: result.pendingActions,
        };
        if (result.executedWrites.length > 0) {
          await initializeWorkspace();
        }
        if (draftQuestion) {
          setAgentTaskMetadata(draftQuestion.id, metadata);
        }
      } catch (error) {
        const message = getErrorMessage(error);
        if (activeRuns.value[threadId]?.stopRequested) {
          generationStatus = 'stopped';
        } else {
          generationStatus = 'failed';
          generationError = message;
          activeQuestionErrors.value = { ...activeQuestionErrors.value, [draftQuestion.id]: message };
          searchViewLogger.error(`Agent task failed: ${message}`);
        }
      }
    } else {
      generationStatus = 'stopped';
    }

    const recordedQuestion = await workbenchStore.recordQuestion({
      query,
      threadId,
      askedAt,
      answeredAt: Date.now(),
      responseTimeMs: Date.now() - responseStartedAt,
      generationStatus,
      error: generationError,
      answer: generatedAnswer,
      sourceNoteIds: Array.from(new Set(runSources.map((result) => result.chunk.noteId))),
      sources: buildQuestionSources(runSources),
      mode: 'agent-task',
      agentWriteMode: metadata.writeMode,
      agentSteps: metadata.steps,
      agentTraceEvents: metadata.traceEvents,
      pendingWrites: metadata.pendingWrites,
      executedWrites: metadata.executedWrites,
      dismissedWriteIds: metadata.dismissedWriteIds,
      createdWriteIds: metadata.createdWriteIds,
    });
    if (recordedQuestion) {
      questionModes.value = {
        ...questionModes.value,
        [recordedQuestion.id]: 'agent-task',
      };
      if (activeThreadId.value === threadId) {
        selectedQuestion.value = recordedQuestion;
        scrollQuestionIntoView(recordedQuestion.id);
      }
      const nextQuestionSources = { ...questionSources.value };
      delete nextQuestionSources[recordedQuestion.id];
      questionSources.value = nextQuestionSources;
    }
  } catch (error) {
    const message = getErrorMessage(error);
    searchViewLogger.error(`Agent task record failed: ${message}`);
    if (draftQuestion) {
      activeQuestionErrors.value = { ...activeQuestionErrors.value, [draftQuestion.id]: message };
    } else if (activeThreadId.value === threadId) {
      searchError.value = message;
    }
  } finally {
    removeActiveRun(threadId, requestId);
    if (activeThreadId.value === threadId) {
      focusSearchInput();
    }
  }
}

async function openNoteResult(noteId: string, title?: string): Promise<void> {
  await appShellStore.setActiveMainView('workspace');
  selectNote(noteId);

  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('workspace-search-jump', {
      detail: { noteId, title },
    }));
  }, 100);
}

function openSourceNote(source: WorkbenchQuestionSource): void {
  void openNoteResult(source.noteId, source.noteTitle);
}

function selectThread(thread: QuestionThread): void {
  activeThreadId.value = thread.id;
  rememberKnowledgeConversationThread(thread.id, thread.isDraft);
  selectedQuestion.value = thread.latestQuestion;
  searchError.value = '';
  editingQuestionId.value = '';
  searchQuery.value = '';
  if (thread.latestQuestion) {
    scrollQuestionIntoView(thread.latestQuestion.id);
  } else {
    scrollChatToBottom();
    focusSearchInput();
  }
}

async function deleteQuestionThread(thread: QuestionThread): Promise<void> {
  if (thread.isDraft) {
    draftThreadId.value = null;
    draftThreadCreatedAt.value = 0;
    forgetKnowledgeConversationThread(thread.id);
    if (activeThreadId.value === thread.id) {
      activeThreadId.value = null;
      resetAnswer();
    }
    return;
  }

  const hasDeleted = await workbenchStore.deleteConversationThread(thread.id);

  if (hasDeleted && activeThreadId.value === thread.id) {
    activeThreadId.value = null;
    forgetKnowledgeConversationThread(thread.id);
    resetAnswer();
  } else if (hasDeleted) {
    forgetKnowledgeConversationThread(thread.id);
  }
}

function getQuestionPreview(question: WorkbenchQuestionEntry): string {
  if (isGeneratingQuestion(question)) {
    return getQuestionThinkingLabel(question);
  }

  if (question.generationStatus === 'stopped') {
    return question.answer || t('search.answerStopped');
  }
  if (question.generationStatus === 'failed') {
    return question.error || t('workbench.empty.noAnswer');
  }
  return question.answer || t('workbench.empty.noAnswer');
}

function getQuestionMode(question: WorkbenchQuestionEntry): KnowledgeInputMode {
  return question.mode ?? questionModes.value[question.id] ?? 'ask';
}

function getQuestionThinkingLabel(question: WorkbenchQuestionEntry): string {
  const run = getActiveRun(question.threadId);
  if (run?.questionId === question.id && run.mode === 'agent-task') {
    return t('search.agentTaskThinking');
  }

  const stage = questionAnswerStages.value[question.id] ?? 'preparing';
  return t(`search.knowledgeAnswerStage.${stage}`);
}

function getQuestionAnswer(question: WorkbenchQuestionEntry): string {
  const streamingAnswer = streamingAnswers.value[question.id];
  if (streamingAnswer) {
    return streamingAnswer;
  }

  return question.fullAnswer || question.answer;
}

function canSaveQuestionAsNote(question: WorkbenchQuestionEntry): boolean {
  return getQuestionMode(question) === 'agent-task' && getQuestionAnswer(question).trim().length > 0;
}

function getQuestionSources(question: WorkbenchQuestionEntry): WorkbenchQuestionSource[] {
  const run = getRunForQuestion(question.id);
  if (run && run.sources.length > 0) {
    return buildQuestionSources(run.sources);
  }

  const liveSources = questionSources.value[question.id];
  if (liveSources?.length) {
    return buildQuestionSources(liveSources);
  }

  if (question.sources?.length) {
    return question.sources;
  }

  return [];
}

function getAgentMetadata(question: WorkbenchQuestionEntry): AgentTaskMetadata | null {
  if (getQuestionMode(question) !== 'agent-task') {
    return null;
  }

  const localMetadata = agentTaskMetadata.value[question.id];
  if (localMetadata) {
    return localMetadata;
  }

  return {
    writeMode: (question.agentWriteMode === 'auto' ? 'auto' : 'confirm'),
    steps: question.agentSteps ?? [],
    traceEvents: question.agentTraceEvents ?? [],
    pendingWrites: question.pendingWrites ?? [],
    executedWrites: question.executedWrites ?? [],
    dismissedWriteIds: question.dismissedWriteIds ?? [],
    createdWriteIds: question.createdWriteIds ?? [],
    conversationId: question.threadId,
    pendingActions: [],
  };
}

function getPendingActions(question: WorkbenchQuestionEntry): KnowledgeCopilotPendingAction[] {
  return getAgentMetadata(question)?.pendingActions ?? [];
}

async function applyResumedAgentTaskResult(
  question: WorkbenchQuestionEntry,
  previousMetadata: AgentTaskMetadata,
  result: KnowledgeCopilotTaskResult,
): Promise<void> {
  const previousWriteIds = new Set(previousMetadata.executedWrites.map((write) => write.id));
  const hasNewExecutedWrite = result.executedWrites.some((write) => !previousWriteIds.has(write.id));
  const metadata: AgentTaskMetadata = {
    writeMode: result.writeMode,
    steps: result.steps,
    traceEvents: result.traceEvents,
    pendingWrites: result.pendingWrites,
    executedWrites: result.executedWrites,
    dismissedWriteIds: previousMetadata.dismissedWriteIds,
    createdWriteIds: previousMetadata.createdWriteIds,
    conversationId: result.conversationId,
    pendingActions: result.pendingActions,
  };

  if (
    !result.cancelled
    && (result.conversationSummary !== undefined || result.conversationSummaryUpToQuestionId !== undefined)
  ) {
    await workbenchStore.updateConversationSummary(
      question.threadId,
      result.conversationSummary,
      result.conversationSummaryUpToQuestionId,
    );
  }

  updateActiveRun(question.threadId, { sources: result.sources });
  const sources = buildQuestionSources(result.sources);
  const updatedQuestion = await workbenchStore.recordQuestion({
    query: question.query,
    threadId: question.threadId,
    mode: 'agent-task',
    agentWriteMode: metadata.writeMode,
    askedAt: question.askedAt,
    answeredAt: Date.now(),
    responseTimeMs: question.responseTimeMs,
    generationStatus: result.cancelled ? 'stopped' : result.success ? 'completed' : 'failed',
    error: result.error,
    answer: result.finalAnswer ?? getQuestionAnswer(question),
    sourceNoteIds: sources.map((source) => source.noteId),
    sources,
    agentSteps: metadata.steps,
    agentTraceEvents: metadata.traceEvents,
    pendingWrites: metadata.pendingWrites,
    executedWrites: metadata.executedWrites,
    dismissedWriteIds: metadata.dismissedWriteIds,
    createdWriteIds: metadata.createdWriteIds,
  });

  const questionId = updatedQuestion?.id ?? question.id;
  setAgentTaskMetadata(questionId, metadata);
  if (updatedQuestion && selectedQuestion.value?.id === question.id) {
    selectedQuestion.value = updatedQuestion;
  }
  clearQuestionTransientState(questionId);

  if (hasNewExecutedWrite) {
    await initializeWorkspace();
  }
}

async function editAndResumeAgentAction(question: WorkbenchQuestionEntry, action: KnowledgeCopilotPendingAction, actionIndex: number): Promise<void> {
  const editedJson = window.prompt(t('search.agentTaskEditActionPrompt'), JSON.stringify(action.args, null, 2));
  if (editedJson === null) return;
  try {
    const parsed = JSON.parse(editedJson) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(t('search.agentTaskInvalidActionArgs'));
    const metadata = getAgentMetadata(question);
    if (!metadata) return;
    const decisions = metadata.pendingActions.map((_pendingAction, index) => index === actionIndex
      ? ({ type: 'edit' as const, editedAction: { name: action.name, args: parsed as Record<string, unknown> } })
      : ({ type: 'reject' as const, message: 'Only the explicitly edited action was approved' }));
    if (isThreadBusy(question.threadId)) return;
    const requestId = `${Date.now()}:${Math.random().toString(36).slice(2)}`;
    activeRuns.value = {
      ...activeRuns.value,
      [question.threadId]: {
        requestId,
        questionId: question.id,
        threadId: question.threadId,
        mode: 'agent-task',
        stopRequested: false,
        sources: [],
        usedSearchFallback: false,
      },
    };
    try {
      const result = await resumeTask(metadata.conversationId || question.threadId, decisions, metadata.writeMode, requestId);
      await applyResumedAgentTaskResult(question, metadata, result);
    } finally {
      removeActiveRun(question.threadId, requestId);
    }
  } catch (error) {
    activeQuestionErrors.value = { ...activeQuestionErrors.value, [question.id]: getErrorMessage(error) };
  }
}

async function resumeAgentAction(question: WorkbenchQuestionEntry, decision: 'approve' | 'reject'): Promise<void> {
  const metadata = getAgentMetadata(question);
  if (!metadata || metadata.pendingActions.length === 0) return;
  if (isThreadBusy(question.threadId)) return;
  const requestId = `${Date.now()}:${Math.random().toString(36).slice(2)}`;
  activeRuns.value = {
    ...activeRuns.value,
    [question.threadId]: {
      requestId,
      questionId: question.id,
      threadId: question.threadId,
      mode: 'agent-task',
      stopRequested: false,
      sources: [],
      usedSearchFallback: false,
    },
  };
  const decisions = metadata.pendingActions.map(() => decision === 'approve'
    ? ({ type: 'approve' as const })
    : ({ type: 'reject' as const, message: 'User rejected this action' }));
  try {
    const result = await resumeTask(metadata.conversationId || question.threadId, decisions, metadata.writeMode, requestId);
    await applyResumedAgentTaskResult(question, metadata, result);
  } catch (error) {
    activeQuestionErrors.value = { ...activeQuestionErrors.value, [question.id]: getErrorMessage(error) };
  } finally {
    removeActiveRun(question.threadId, requestId);
  }
}

function getAgentSteps(question: WorkbenchQuestionEntry): KnowledgeCopilotStep[] {
  return getAgentMetadata(question)?.steps ?? [];
}

function getAgentTraceEvents(question: WorkbenchQuestionEntry): KnowledgeCopilotTraceEvent[] {
  return getAgentMetadata(question)?.traceEvents ?? [];
}

function getExecutedWrites(question: WorkbenchQuestionEntry): KnowledgeCopilotExecutedWrite[] {
  return getAgentMetadata(question)?.executedWrites ?? [];
}

function formatAgentStepTitle(step: KnowledgeCopilotStep): string {
  const keyMap: Record<string, string> = {
    searchKnowledgeBase: 'search.agentStep.searchKnowledgeBase',
    listRecentNotes: 'search.agentStep.listRecentNotes',
    readNote: 'search.agentStep.readNote',
    proposeCreateNote: 'search.agentStep.proposeCreateNote',
    proposeUpdateNote: 'search.agentStep.proposeUpdateNote',
    createNote: 'search.agentStep.createNote',
    updateNote: 'search.agentStep.updateNote',
    configureChatModel: 'search.agentStep.configureChatModel',
  };

  const key = keyMap[step.title];
  return key ? t(key) : step.title;
}

function formatAgentStepDetail(step: KnowledgeCopilotStep): string {
  if (step.title === 'searchKnowledgeBase') {
    return t('search.agentStep.searchKnowledgeBaseDetail', { count: step.detail });
  }

  if (step.title === 'configureChatModel') {
    return t('search.agentStep.configureChatModelDetail');
  }

  return step.detail;
}

function formatAgentTraceTitle(event: KnowledgeCopilotTraceEvent): string {
  if (event.type === 'model-response') {
    return t('search.agentTrace.modelResponse');
  }

  if (event.type === 'tool-call') {
    return t('search.agentTrace.toolCall', { tool: event.toolName ?? event.title });
  }

  if (event.type === 'tool-error') {
    return t('search.agentTrace.toolError', { tool: event.toolName ?? event.title });
  }

  return t('search.agentTrace.toolResult', { tool: event.toolName ?? event.title });
}

function formatAgentTraceDetail(event: KnowledgeCopilotTraceEvent): string {
  const duration = typeof event.durationMs === 'number'
    ? t('search.agentTrace.duration', { duration: event.durationMs })
    : '';
  if (event.type === 'model-response') {
    return `${t('search.agentTrace.modelResponseDetail', { count: event.detail })}${duration}`;
  }

  const detail = event.detail.length > 180 ? `${event.detail.slice(0, 180)}...` : event.detail;
  return duration ? `${detail} ${duration}` : detail;
}

function getVisibleWriteProposals(question: WorkbenchQuestionEntry): KnowledgeCopilotWriteProposal[] {
  const metadata = getAgentMetadata(question);
  if (!metadata) {
    return [];
  }

  return metadata.pendingWrites.filter((proposal) => (
    !metadata.dismissedWriteIds.includes(proposal.id)
    && !metadata.createdWriteIds.includes(proposal.id)
  ));
}

function getWriteProposalPreview(proposal: KnowledgeCopilotWriteProposal): string {
  const content = proposal.content.trim();
  return content.length > 240 ? `${content.slice(0, 240)}...` : content;
}

function getWriteProposalTitle(proposal: KnowledgeCopilotWriteProposal): string {
  if (proposal.type === 'create-note') {
    return proposal.title;
  }

  return proposal.noteTitle;
}

function getWriteProposalActionLabel(proposal: KnowledgeCopilotWriteProposal): string {
  return proposal.type === 'create-note'
    ? t('search.agentTaskApplyWrite')
    : t('search.agentTaskApplyUpdate');
}

function buildSummaryNoteTitle(question: WorkbenchQuestionEntry): string {
  const normalizedQuery = question.query.trim().replace(/\s+/g, ' ');
  if (!normalizedQuery) {
    return t('search.agentTaskSavedNoteFallbackTitle');
  }

  const maxLength = 42;
  const baseTitle = normalizedQuery.length > maxLength
    ? `${normalizedQuery.slice(0, maxLength).trim()}...`
    : normalizedQuery;

  return t('search.agentTaskSavedNoteTitle', { query: baseTitle });
}

function buildSummaryNoteContent(question: WorkbenchQuestionEntry): string {
  const title = buildSummaryNoteTitle(question);
  const answer = getQuestionAnswer(question).trim();
  const sources = getQuestionSources(question);
  const sourceBlock = sources.length > 0
    ? [
      '',
      `## ${t('search.knowledgeSources')}`,
      ...sources.map((source) => `- ${source.noteTitle}`),
    ].join('\n')
    : '';

  return [
    `# ${title}`,
    '',
    answer,
    sourceBlock,
  ].join('\n');
}

async function persistFullQuestion(
  question: WorkbenchQuestionEntry,
  metadata: AgentTaskMetadata,
): Promise<WorkbenchQuestionEntry | null> {
  const updatedQuestion = await workbenchStore.recordQuestion({
    query: question.query,
    threadId: question.threadId,
    mode: getQuestionMode(question),
    agentWriteMode: metadata.writeMode,
    askedAt: question.askedAt,
    answeredAt: question.answeredAt,
    answer: getQuestionAnswer(question),
    sourceNoteIds: question.sourceNoteIds,
    sources: getQuestionSources(question),
    agentSteps: metadata.steps,
    agentTraceEvents: metadata.traceEvents,
    pendingWrites: metadata.pendingWrites,
    executedWrites: metadata.executedWrites,
    dismissedWriteIds: metadata.dismissedWriteIds,
    createdWriteIds: metadata.createdWriteIds,
  });

  if (updatedQuestion) {
    setAgentTaskMetadata(updatedQuestion.id, metadata);
    if (selectedQuestion.value?.id === question.id) {
      selectedQuestion.value = updatedQuestion;
    }
  }

  return updatedQuestion;
}

function getExecutedWritePreview(write: KnowledgeCopilotExecutedWrite): string {
  const content = write.content.trim();
  return content.length > 240 ? `${content.slice(0, 240)}...` : content;
}

async function openExecutedWrite(write: KnowledgeCopilotExecutedWrite): Promise<void> {
  await initializeWorkspace();
  await openNoteResult(write.noteId, write.noteTitle);
}

async function saveQuestionAsNote(question: WorkbenchQuestionEntry): Promise<void> {
  const metadata = getAgentMetadata(question);
  if (!metadata || savingSummaryActionId.value) {
    return;
  }

  const proposal: KnowledgeCopilotWriteProposal = {
    id: `agent-write-manual-${Date.now()}`,
    type: 'create-note',
    title: buildSummaryNoteTitle(question),
    content: buildSummaryNoteContent(question),
    reason: t('search.agentTaskSaveAsNoteReason'),
  };

  savingSummaryActionId.value = `${question.id}:create`;
  try {
    if (metadata.writeMode === 'auto') {
      await initializeWorkspace();
      const createdNote = await createNote(null, proposal.title, proposal.content);
      if (!createdNote) {
        return;
      }

      const executedWrite: KnowledgeCopilotExecutedWrite = {
        id: proposal.id,
        type: 'create-note',
        noteId: createdNote.id,
        noteTitle: createdNote.title,
        content: proposal.content,
        reason: proposal.reason,
      };

      const nextMetadata: AgentTaskMetadata = {
        ...metadata,
        executedWrites: [executedWrite, ...metadata.executedWrites].slice(0, 8),
      };

      await persistFullQuestion(question, nextMetadata);
      await appShellStore.setActiveMainView('workspace');
      selectNote(createdNote.id);
      return;
    }

    const nextMetadata: AgentTaskMetadata = {
      ...metadata,
      pendingWrites: [proposal, ...metadata.pendingWrites].slice(0, 8),
      dismissedWriteIds: metadata.dismissedWriteIds.filter((id) => id !== proposal.id),
      createdWriteIds: metadata.createdWriteIds.filter((id) => id !== proposal.id),
    };

    await persistFullQuestion(question, nextMetadata);
  } catch (error) {
    const message = getErrorMessage(error);
    searchViewLogger.error(`Save question as note failed: ${message}`);
    activeQuestionErrors.value = { ...activeQuestionErrors.value, [question.id]: message };
  } finally {
    savingSummaryActionId.value = '';
    focusSearchInput();
  }
}

async function persistAgentWriteState(question: WorkbenchQuestionEntry, metadata: AgentTaskMetadata): Promise<void> {
  setAgentTaskMetadata(question.id, metadata);
  const updatedQuestion = await workbenchStore.updateQuestionAgentWriteState({
    questionId: question.id,
    dismissedWriteIds: metadata.dismissedWriteIds,
    createdWriteIds: metadata.createdWriteIds,
  });

  if (updatedQuestion && selectedQuestion.value?.id === question.id) {
    selectedQuestion.value = updatedQuestion;
  }
}

async function dismissWriteProposal(question: WorkbenchQuestionEntry, proposalId: string): Promise<void> {
  const metadata = getAgentMetadata(question);
  if (!metadata || metadata.dismissedWriteIds.includes(proposalId)) {
    return;
  }

  await persistAgentWriteState(question, {
    ...metadata,
    dismissedWriteIds: [...metadata.dismissedWriteIds, proposalId],
  });
}

async function applyWriteProposal(
  question: WorkbenchQuestionEntry,
  proposal: KnowledgeCopilotWriteProposal,
): Promise<void> {
  const metadata = getAgentMetadata(question);
  if (!metadata || applyingWriteProposalId.value) {
    return;
  }

  applyingWriteProposalId.value = proposal.id;
  try {
    await initializeWorkspace();
    let targetNoteId = '';

    if (proposal.type === 'create-note') {
      const createdNote = await createNote(null, proposal.title, proposal.content);
      if (!createdNote) {
        return;
      }

      targetNoteId = createdNote.id;
    } else {
      const updated = await applyNoteContentUpdate(proposal.noteId, proposal.content);
      if (!updated) {
        throw new Error(t('search.agentTaskApplyUpdateFailed'));
      }

      targetNoteId = proposal.noteId;
    }

    await persistAgentWriteState(question, {
      ...metadata,
      createdWriteIds: [...metadata.createdWriteIds, proposal.id],
    });
    await appShellStore.setActiveMainView('workspace');
    selectNote(targetNoteId);
  } catch (error) {
    const message = getErrorMessage(error);
    searchViewLogger.error(`Create note from agent proposal failed: ${message}`);
    activeQuestionErrors.value = { ...activeQuestionErrors.value, [question.id]: message };
  } finally {
    applyingWriteProposalId.value = '';
    focusSearchInput();
  }
}

function getQuestionError(question: WorkbenchQuestionEntry): string {
  const activeError = activeQuestionErrors.value[question.id];
  if (activeError) {
    return activeError;
  }

  return question.generationStatus === 'failed' ? question.error || '' : '';
}

function shouldDisplayFallbackNotice(question: WorkbenchQuestionEntry): boolean {
  return activeFallbackQuestionIds.value[question.id] === true;
}

function renderQuestionAnswer(question: WorkbenchQuestionEntry): string {
  const answer = getQuestionAnswer(question);
  if (!answer) {
    return '';
  }

  return renderMarkdown(answer, {
    allowHtml: false,
    allowInlineSvg: false,
    remoteImageMode: 'blocked',
    blockedImageLabel: t('preview.remoteImageBlocked'),
    copyCodeButtonLabel: t('preview.copyCode'),
  });
}

function isGeneratingQuestion(question: WorkbenchQuestionEntry): boolean {
  return getRunForQuestion(question.id)?.questionId === question.id;
}

function isGeneratingThread(thread: QuestionThread): boolean {
  return thread.questions.some((question) => isGeneratingQuestion(question));
}

function formatAskedAt(timestamp: number): string {
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return '';
  }

  return new Date(timestamp).toLocaleString();
}

function formatMessageTimestamp(timestamp?: number): string {
  if (!timestamp || !Number.isFinite(timestamp) || timestamp <= 0) {
    return '';
  }

  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatQuestionAskedAt(question: WorkbenchQuestionEntry): string {
  return formatMessageTimestamp(question.askedAt);
}

function formatQuestionAnsweredAt(question: WorkbenchQuestionEntry): string {
  return formatMessageTimestamp(question.answeredAt);
}

function formatQuestionResponseTime(question: WorkbenchQuestionEntry): string {
  const responseTimeMs = Number(question.responseTimeMs ?? 0);
  if (!Number.isFinite(responseTimeMs) || responseTimeMs <= 0) {
    return '';
  }

  const seconds = responseTimeMs / 1000;
  return seconds < 10 ? seconds.toFixed(1) : Math.round(seconds).toString();
}

function applySearchRequest(): void {
  const request = searchViewRequest.value;
  const requestedThread = request.threadId
    ? questionThreads.value.find((thread) => thread.id === request.threadId)
    : undefined;
  if (requestedThread) {
    selectThread(requestedThread);
    return;
  }

  if (!request.query.trim()) {
    draftThreadId.value = knowledgeConversationDraft.value?.id ?? null;
    draftThreadCreatedAt.value = knowledgeConversationDraft.value?.createdAt ?? 0;
    searchQuery.value = '';
    const restoredThread = questionThreads.value.find(
      (thread) => thread.id === activeKnowledgeConversationThreadId.value,
    ) ?? questionThreads.value.find(
      (thread) => !thread.isDraft && thread.id === lastKnowledgeConversationThreadId.value,
    ) ?? questionThreads.value.find((thread) => !thread.isDraft);
    if (restoredThread) {
      selectThread(restoredThread);
      return;
    }
  }

  activeThreadId.value = null;
  if (draftThreadId.value) {
    forgetKnowledgeConversationThread(draftThreadId.value);
  }
  draftThreadId.value = null;
  draftThreadCreatedAt.value = 0;
  searchQuery.value = request.query;
  resetAnswer();
  focusSearchInput();
  void nextTick(resizeComposer);

  if (request.run && request.query.trim()) {
    handleAsk();
  }
}

watch(
  () => searchViewRequest.value.id,
  () => {
    applySearchRequest();
  },
);

watch(canUseKnowledgeSearch, () => {
  resetAnswer();
});

watch(questionThreads, (threads) => {
  if (!activeThreadId.value) {
    return;
  }

  if (!threads.some((thread) => thread.id === activeThreadId.value)) {
    activeThreadId.value = null;
    selectedQuestion.value = null;
  }
});

watch(
  chatQuestions,
  () => {
    void syncMarkdownEnhancements();
  },
  { deep: true, flush: 'post' },
);

function handleDocumentClick(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  if (isModeMenuOpen.value && !target.closest('.search-view__mode-selector')) {
    isModeMenuOpen.value = false;
  }
  if (isModelMenuOpen.value && !target.closest('.search-view__model-selector')) {
    isModelMenuOpen.value = false;
  }
}

function activateViewListeners(): void {
  if (viewListenersActive) {
    return;
  }

  viewListenersActive = true;
  document.addEventListener('click', handleDocumentClick);
  window.addEventListener('resize', clampHistoryPaneWidth);
}

function deactivateViewListeners(): void {
  if (!viewListenersActive) {
    return;
  }

  viewListenersActive = false;
  markdownEnhancementRunId += 1;
  isModeMenuOpen.value = false;
  isModelMenuOpen.value = false;
  document.removeEventListener('click', handleDocumentClick);
  handlePaneResizeEnd();
  window.removeEventListener('resize', clampHistoryPaneWidth);
}

onMounted(() => {
  applySearchRequest();
});

onActivated(() => {
  activateViewListeners();
  focusSearchInput();
  scrollChatToBottom();
  void syncMarkdownEnhancements();
});

onDeactivated(deactivateViewListeners);

onBeforeUnmount(() => {
  if (copiedActionTimeout) {
    clearTimeout(copiedActionTimeout);
    copiedActionTimeout = null;
  }
  deactivateViewListeners();
});
</script>

<style scoped>
.search-view {
  --search-chat-surface: var(--panel);
  --search-chat-border: var(--border-muted);
  --search-chat-accent-border: color-mix(in srgb, var(--accent) 18%, var(--panel-border));
  --search-chat-accent-fill: color-mix(in srgb, var(--accent) 6%, var(--panel));
  flex: 1;
  min-width: 0;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--surface-base);
}

.search-view__header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--panel-border);
  background: var(--panel);
}

.search-view__title-wrap {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-view__title-icon {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
}

.search-view__title {
  margin: 0;
  color: var(--text);
  font-size: 0.95rem;
  font-weight: 700;
}


.search-view__query {
  flex: 0 0 auto;
  padding: 12px 18px 14px;
  border-top: 1px solid var(--panel-border);
  background: var(--surface-base);
}

.search-view__input-shell {
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  border: 1px solid var(--search-chat-border);
  border-radius: var(--radius-md);
  background: var(--panel);
  transition: border-color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
}

.search-view__input-shell:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 10%, transparent);
}

.search-view__input-shell.is-disabled {
  opacity: 0.64;
}

.search-view__input-main {
  position: relative;
  display: flex;
  align-items: flex-start;
  padding: 4px;
}

.search-view__input {
  flex: 1;
  min-width: 0;
  height: auto;
  min-height: 44px;
  max-height: 140px;
  padding: 8px 10px;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: 0.9rem;
  line-height: 1.45;
  overflow-y: auto;
}

.search-view__input:disabled {
  cursor: not-allowed;
}

.search-view__input::placeholder {
  color: var(--text-muted);
}

.search-view__clear-button {
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  margin: 6px 6px 0 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease;
}

.search-view__clear-button:hover {
  background: var(--panel-hover);
  color: var(--text);
}

.search-view__input-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 8px;
  background: var(--surface-subtle);
  border-top: 1px solid color-mix(in srgb, var(--search-chat-border) 60%, transparent);
  border-bottom-left-radius: 7px;
  border-bottom-right-radius: 7px;
}

.search-view__toolbar-left {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 8px;
}

.search-view__toolbar-right {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 8px;
}

.search-view__model-selector {
  position: relative;
  flex: 0 1 180px;
  min-width: 0;
}

.search-view__mode-selector {
  position: relative;
  flex: 0 1 auto;
  min-width: 0;
}

.search-view__mode-button {
  max-width: 100%;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 10px;
  border: 1px solid var(--search-chat-border);
  border-radius: var(--radius-sm);
  background: var(--panel);
  color: var(--text-muted);
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
}

.search-view__mode-button:hover {
  border-color: color-mix(in srgb, var(--accent) 30%, var(--search-chat-border));
  color: var(--text);
  background: var(--panel-hover);
}

.search-view__mode-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.search-view__model-button {
  width: 100%;
  max-width: 180px;
}

.search-view__mode-button > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-view__mode-menu {
  position: absolute;
  left: 0;
  bottom: calc(100% + 6px);
  z-index: 10;
  width: 228px;
  padding: 6px;
  border: 1px solid var(--search-chat-border);
  border-radius: var(--radius-md);
  background: var(--panel);
  box-shadow: 0 10px 25px color-mix(in srgb, #000 12%, transparent);
}

.search-view__model-menu {
  right: 0;
  left: auto;
  width: 260px;
  max-height: 280px;
  overflow-y: auto;
}

.search-view__mode-option {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text);
  text-align: left;
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease;
}

.search-view__mode-option:hover,
.search-view__mode-option.is-active {
  border-color: color-mix(in srgb, var(--accent) 15%, transparent);
  background: color-mix(in srgb, var(--accent) 6%, transparent);
}

.search-view__mode-option span {
  font-size: 0.78rem;
  font-weight: 650;
}

.search-view__mode-option small {
  color: var(--text-muted);
  font-size: 0.7rem;
  line-height: 1.3;
}

.search-view__model-option {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.search-view__model-option-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.search-view__model-option-copy > span,
.search-view__model-option-copy > small {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-view__execution-button {
  flex: 0 0 auto;
  min-width: auto;
  min-height: 28px;
  height: 28px;
  padding: 0 10px;
  font-size: 0.76rem;
  font-weight: 600;
}

.search-view__ask-button {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 0.76rem;
  font-weight: 700;
}

.search-view__ask-button--stop {
  color: var(--danger);
}

.search-view__icon-button:hover {
  background: var(--panel-hover);
  color: var(--text);
}

.search-view__content {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

.search-view__history-pane {
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--surface-subtle);
  border-right: 1px solid var(--panel-border);
}

.search-view__pane-divider {
  flex: 0 0 auto;
  width: 6px;
  margin: 0 -2px;
  position: relative;
  z-index: 2;
  cursor: col-resize;
  background: transparent;
  transition: background-color 0.15s ease;
}

.search-view__pane-divider::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  transform: translateX(-50%);
  background: var(--panel-border);
  transition: width 0.12s ease, background-color 0.12s ease;
}

.search-view__pane-divider:hover::after,
.search-view__content.is-resizing-pane .search-view__pane-divider::after {
  width: 3px;
  background: var(--accent-solid);
}

.search-view__answer-pane {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-view__pane-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 44px;
  padding: 0 18px;
  border-bottom: 1px solid var(--panel-border);
}

.search-view__pane-header h2 {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text);
  font-size: 0.82rem;
  font-weight: 700;
}

.search-view__new-thread {
  flex: 0 0 auto;
  height: 28px;
  padding: 0 9px;
  gap: 5px;
  font-size: 0.76rem;
  font-weight: 650;
}

.search-view__chat-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px;
}

.search-view__chat-inner {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-view__chat-turn {
  display: flex;
  flex-direction: column;
  gap: 8px;
  scroll-margin: 18px;
}

.search-view__chat-turn.is-active .search-view__assistant-card {
  border-color: color-mix(in srgb, var(--accent) 24%, var(--search-chat-border));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 8%, transparent);
}

.search-view__message {
  min-width: 0;
  display: flex;
}

.search-view__message--user {
  justify-content: flex-end;
}

.search-view__message--assistant {
  align-items: flex-start;
  gap: 9px;
}

.search-view__user-message {
  max-width: min(680px, 72%);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.search-view__user-bubble {
  max-width: 100%;
  padding: 8px 11px;
  border: 1px solid color-mix(in srgb, var(--accent) 14%, var(--panel-border));
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--accent) 5%, var(--panel));
  color: var(--text);
  font-size: 0.9rem;
  line-height: 1.52;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.search-view__message-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.search-view__message-actions--user {
  justify-content: flex-end;
}

.search-view__message-action {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  font-size: 0.72rem;
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
}

.search-view__message-action:hover:not(:disabled),
.search-view__message-action:focus-visible {
  border-color: var(--search-chat-border);
  background: var(--panel-hover);
  color: var(--text);
}

.search-view__message-action:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.search-view__message-timestamp {
  display: inline-flex;
  font-size: 0.73rem;
  line-height: 1.2;
  color: var(--text-muted);
}

.search-view__assistant-avatar {
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: var(--accent);
  background: var(--surface-subtle);
  border: 1px solid var(--search-chat-border);
}

.search-view__assistant-message-body {
  flex: 1;
  min-width: 0;
  max-width: 100%;
}

.search-view__assistant-card {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--search-chat-border);
  border-radius: var(--radius-md);
  background: var(--search-chat-surface);
  box-shadow: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.search-view__stopped-notice {
  margin-bottom: 8px;
  color: var(--text-muted);
  font-size: 0.78rem;
}

.search-view__editing-indicator {
  min-height: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 5px 9px;
  border-bottom: 1px solid color-mix(in srgb, var(--search-chat-border) 60%, transparent);
  color: var(--text-muted);
  font-size: 0.75rem;
}

.search-view__editing-indicator button {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 5px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.search-view__editing-indicator button:hover {
  background: var(--panel-hover);
  color: var(--text);
}

.search-view__thinking {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: var(--text-muted);
  font-size: 0.86rem;
}

.search-view__thinking-dots {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 16px;
}

.search-view__thinking-dots>span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0.35;
  animation: search-thinking-pulse 1.2s ease-in-out infinite;
}

.search-view__thinking-dots>span:nth-child(2) {
  animation-delay: 0.16s;
}

.search-view__thinking-dots>span:nth-child(3) {
  animation-delay: 0.32s;
}

.search-view__history-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px;
}

.search-view__history-item {
  position: relative;
  width: 100%;
  height: 88px;
  min-height: 72px;
  display: block;
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text);
  transition: background 0.15s ease, border-color 0.15s ease;
}

.search-view__history-item+.search-view__history-item {
  margin-top: 4px;
}

.search-view__history-item:hover,
.search-view__history-item.is-active {
  border-color: color-mix(in srgb, var(--accent) 18%, var(--panel-border));
  background: color-mix(in srgb, var(--accent) 6%, var(--panel));
}



.search-view__history-item.is-draft .search-view__history-query {
  color: var(--accent);
}

.search-view__history-open {
  width: 100%;
  height: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  padding: 8px 40px 8px 10px;
  border: none;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
}

.search-view__history-delete {
  position: absolute;
  top: 7px;
  right: 7px;
  z-index: 1;
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0.72;
  transition: background 0.15s ease, color 0.15s ease, opacity 0.15s ease;
}

.search-view__history-delete:hover {
  background: color-mix(in srgb, var(--color-danger, #ef4444) 12%, transparent);
  color: var(--color-danger, #ef4444);
  opacity: 1;
}

.search-view__history-query,
.search-view__history-answer,
.search-view__history-meta {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-view__history-query {
  color: var(--text);
  font-size: 0.84rem;
  font-weight: 650;
  white-space: nowrap;
}

.search-view__history-answer {
  display: -webkit-box;
  color: var(--text-muted);
  font-size: 0.76rem;
  line-height: 1.42;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.search-view__history-meta {
  margin-top: auto;
  color: var(--text-muted);
  font-size: 0.68rem;
  opacity: 0.82;
  white-space: nowrap;
}

.search-view__history-empty {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  color: var(--text-muted);
  text-align: center;
  font-size: 0.78rem;
  line-height: 1.5;
}

.search-view__status {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 28px;
  color: var(--text-muted);
  text-align: center;
}

.search-view__status-icon {
  color: color-mix(in srgb, var(--accent) 35%, var(--text-muted));
  margin-bottom: 4px;
}

.search-view__chat-scroll>.search-view__status {
  min-height: 100%;
}

.search-view__status-text {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.86rem;
  line-height: 1.5;
}

.search-view__status-text--error {
  color: var(--color-danger, #ef4444);
}

@keyframes search-thinking-pulse {
  0%,
  60%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }

  30% {
    opacity: 1;
    transform: translateY(-2px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .search-view__thinking-dots>span {
    animation: none;
    opacity: 0.7;
  }
}

.search-view__fallback-notice {
  margin-bottom: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--search-chat-accent-border);
  border-left-width: 3px;
  background: var(--search-chat-surface);
  color: var(--text-muted);
  font-size: 0.82rem;
  line-height: 1.5;
}

.search-view__answer-content {
  color: var(--text);
  font-size: 0.92rem;
  line-height: 1.5;
}

.search-view__sources {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding-top: 14px;
  border-top: 1px solid var(--search-chat-border);
}

.search-view__answer-actions {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-view__save-note-button {
  height: 32px;
  padding: 0 12px;
  gap: 6px;
  font-size: 0.76rem;
  font-weight: 700;
}

.search-view__sources h3 {
  flex: 0 0 auto;
  margin: 0 4px 0 0;
  color: var(--text-muted);
  font-size: 0.76rem;
  font-weight: 700;
}

.search-view__agent-steps,
.search-view__agent-trace,
.search-view__agent-writes {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--search-chat-border);
}

.search-view__agent-steps h3,
.search-view__agent-trace h3,
.search-view__agent-writes h3 {
  margin: 0 0 10px;
  color: var(--text-muted);
  font-size: 0.76rem;
  font-weight: 700;
}

.search-view__agent-steps ol,
.search-view__agent-trace ol {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.search-view__agent-steps li,
.search-view__agent-trace li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: var(--text);
  font-size: 0.8rem;
}

.search-view__agent-steps li::before,
.search-view__agent-trace li::before {
  content: '';
  flex: 0 0 auto;
  width: 7px;
  height: 7px;
  margin-top: 6px;
  border-radius: 999px;
  background: var(--accent-solid);
}

.search-view__agent-steps li.is-failed::before,
.search-view__agent-trace li.is-failed::before {
  background: var(--color-danger, #ef4444);
}

.search-view__agent-steps span,
.search-view__agent-trace span {
  flex: 0 0 auto;
  font-weight: 700;
}

.search-view__agent-steps small,
.search-view__agent-trace small {
  min-width: 0;
  color: var(--text-muted);
  font-size: 0.76rem;
  line-height: 1.45;
}

.search-view__agent-write-card {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 12px;
  padding: 10px;
  border: 1px solid var(--search-chat-accent-border);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--accent) 5%, var(--search-chat-surface));
}

.search-view__agent-write-card--executed {
  border-color: color-mix(in srgb, var(--accent) 28%, var(--search-chat-border));
  background: color-mix(in srgb, var(--accent) 8%, var(--search-chat-surface));
}

.search-view__agent-write-card+.search-view__agent-write-card {
  margin-top: 10px;
}

.search-view__agent-write-main {
  min-width: 0;
  flex: 1;
}

.search-view__agent-write-main strong {
  display: block;
  color: var(--text);
  font-size: 0.84rem;
}

.search-view__agent-write-main p {
  margin: 5px 0 0;
  color: var(--text-muted);
  font-size: 0.76rem;
  line-height: 1.45;
}

.search-view__agent-write-main pre {
  max-height: 112px;
  margin: 9px 0 0;
  overflow: auto;
  white-space: pre-wrap;
  color: var(--text-muted);
  font: inherit;
  font-size: 0.76rem;
  line-height: 1.45;
}

.search-view__agent-write-actions {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 8px;
}

.search-view__agent-write-apply {
  min-width: auto;
  min-height: 30px;
  height: 30px;
  padding: 0 10px;
  gap: 5px;
  font-size: 0.76rem;
  font-weight: 700;
}

.search-view__agent-write-dismiss {
  min-width: auto;
  min-height: 28px;
  height: 28px;
  padding: 0 9px;
  font-size: 0.74rem;
}

.search-view__source-card {
  flex: 0 1 auto;
  max-width: min(300px, 100%);
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  border: 1px solid var(--search-chat-border);
  border-radius: var(--radius-sm);
  background: var(--search-chat-surface);
  color: var(--text);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.search-view__source-card:hover {
  border-color: color-mix(in srgb, var(--accent) 20%, var(--search-chat-border));
  background: color-mix(in srgb, var(--panel-hover) 74%, var(--accent) 4%);
}

.search-view__source-card-head {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  color: var(--text-muted);
  font-size: 0.78rem;
}

.search-view__source-card:hover .search-view__source-card-head {
  color: var(--accent-hover);
}

.search-view__source-card-head span {
  flex: 0 1 auto;
  max-width: 240px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text);
  font-weight: 650;
}

@media (max-width: 980px) {
  .search-view__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .search-view__content {
    flex-direction: column;
  }

  .search-view__history-pane {
    flex: 0 0 190px !important;
    width: auto !important;
    min-width: 0 !important;
    max-width: none !important;
    border-bottom: 1px solid var(--panel-border);
  }

  .search-view__pane-divider {
    display: none;
  }

  .search-view__history-item {
    height: 88px;
    min-height: 88px;
  }

  /* Responsive input-shell is handled automatically by column layout */

  .search-view__agent-write-card {
    flex-direction: column;
  }

  .search-view__agent-write-actions {
    flex-direction: row;
  }
}
</style>


