<template>
  <div class="settings-subview">
    <h3 class="panel-title">{{ pageTitle }}</h3>

    <div class="settings-subview-content scrollable" :class="{ 'settings-grid': activeView === 'dashboard' }">
      <section v-if="activeView === 'dashboard'" class="subtitle-settings-section settings-grid">
        <p class="subtitle-settings-label">{{ t('label.knowledgeCopilotSectionBasic') }}</p>

        <section class="setting-card">
          <div class="setting-copy">
            <p class="setting-label">{{ t('label.knowledgeCopilot') }}</p>
            <p class="setting-description">{{ t('text.knowledgeCopilot') }}</p>
          </div>

          <button type="button" class="startup-switch" :class="{ enabled: settingsStore.config.knowledgeCopilot.enabled }"
            :aria-pressed="settingsStore.config.knowledgeCopilot.enabled" @click="handleToggle('enabled')">
            <span class="startup-switch-track">
              <span class="startup-switch-thumb" />
            </span>
            <span class="startup-switch-text">
              {{ settingsStore.config.knowledgeCopilot.enabled ? t('checkbox.status.enabled') : t('checkbox.status.disabled') }}
            </span>
          </button>
        </section>

        <section class="setting-card">
          <div class="setting-copy">
            <p class="setting-label">{{ t('label.knowledgeCopilotEmbeddingModel') }}</p>
            <p class="setting-description">{{ embeddingSources.length === 0
              ? t('text.aiModelUnavailable')
              : t('text.knowledgeCopilotEmbeddingModel') }}</p>
          </div>
          <label class="select-shell" :class="{ disabled: embeddingSources.length === 0 }">
            <select class="settings-select" :value="settingsStore.config.knowledgeCopilot.embeddingSourceId"
              @change="handleKnowledgeCopilotUpdate('embeddingSourceId', ($event.target as HTMLSelectElement).value, $event)"
              :disabled="embeddingSources.length === 0">
              <option v-if="embeddingSources.length === 0" value="">{{
                t('option.default.selectOption') }}</option>
              <option v-for="source in embeddingSources" :key="source.id" :value="source.id">
                {{ source.name }}
              </option>
            </select>
          </label>
        </section>
      </section>

      <section v-if="activeView === 'dashboard'" class="subtitle-settings-section settings-grid">
        <p class="subtitle-settings-label">{{ t('label.knowledgeCopilotSectionAnswering') }}</p>

        <section class="setting-card">
          <div class="setting-copy">
            <p class="setting-label">{{ t('label.knowledgeCopilotChatModel') }}</p>
            <p class="setting-description">{{ chatSources.length === 0
              ? t('text.aiModelUnavailable')
              : t('text.knowledgeCopilotChatModel') }}</p>
          </div>
          <label class="select-shell"
            :class="{ disabled: chatSources.length === 0 }">
            <select class="settings-select" :value="settingsStore.config.knowledgeCopilot.askChatSourceId"
              @change="handleKnowledgeCopilotUpdate('askChatSourceId', ($event.target as HTMLSelectElement).value)"
              :disabled="chatSources.length === 0">
              <option value="">{{
                t('option.knowledgeCopilot.disabled') }}</option>
              <option v-for="source in chatSources" :key="source.id" :value="source.id">
                {{ source.name }}
              </option>

            </select>
          </label>
        </section>

        <section class="setting-card">
          <div class="setting-copy">
            <p class="setting-label">{{ t('label.knowledgeCopilotAgentChatModel') }}</p>
            <p class="setting-description">{{ chatSources.length === 0
              ? t('text.aiModelUnavailable')
              : t('text.knowledgeCopilotAgentChatModel') }}</p>
          </div>
          <label class="select-shell" :class="{ disabled: chatSources.length === 0 }">
              <select class="settings-select" :value="settingsStore.config.knowledgeCopilot.agentChatSourceId"
                @change="handleKnowledgeCopilotUpdate('agentChatSourceId', ($event.target as HTMLSelectElement).value)"
                :disabled="chatSources.length === 0">
                <option value="">{{ t('option.knowledgeCopilot.disabled') }}</option>
                <option v-for="source in chatSources" :key="source.id" :value="source.id">{{ source.name }}</option>
              </select>
          </label>
        </section>

        <section class="setting-card">
          <div class="setting-copy">
            <p class="setting-label">{{ t('label.knowledgeCopilotRerankerSource') }}</p>
            <p class="setting-description">{{ rerankerSources.length === 0
              ? t('text.aiModelUnavailable')
              : t('text.knowledgeCopilotRerankerSource') }}</p>
          </div>
          <label class="select-shell"
            :class="{ disabled: rerankerSources.length === 0 }">
            <select class="settings-select" :value="settingsStore.config.knowledgeCopilot.rerankerSourceId"
              @change="handleKnowledgeCopilotUpdate('rerankerSourceId', ($event.target as HTMLSelectElement).value)"
              :disabled="rerankerSources.length === 0">
              <option value="">{{
                t('option.knowledgeCopilot.disabled') }}</option>
              <option v-for="source in rerankerSources" :key="source.id" :value="source.id">
                {{ source.name }}
              </option>

            </select>
          </label>
        </section>
      </section>

      <section v-if="activeView === 'dashboard'" class="subtitle-settings-section settings-grid">
        <p class="subtitle-settings-label">{{ t('label.knowledgeCopilotSectionRetrieval') }}</p>
        <div class="settings-row-grid">
          <section class="setting-card">
            <div class="setting-copy">
              <p class="setting-label">{{ t('label.knowledgeCopilotTopK') }}</p>
              <p class="setting-description">{{ t('text.knowledgeCopilotTopK') }}</p>
            </div>
            <div class="number-input-container">
              <input type="number" class="settings-input number-input" :value="settingsStore.config.knowledgeCopilot.topK"
                @change="handleKnowledgeCopilotNumberUpdate('topK', $event)" step="1" min="1" max="10"
                :disabled="!settingsStore.config.knowledgeCopilot.enabled" />
            </div>
          </section>

          <section class="setting-card">
            <div class="setting-copy">
              <p class="setting-label">{{ t('label.knowledgeCopilotSimilarityThreshold') }}</p>
              <p class="setting-description">{{ t('text.knowledgeCopilotSimilarityThreshold') }}</p>
            </div>
            <div class="number-input-container">
              <input type="number" class="settings-input number-input"
                :value="settingsStore.config.knowledgeCopilot.similarityThreshold"
                @change="handleKnowledgeCopilotNumberUpdate('similarityThreshold', $event)" step="0.05" min="0" max="1"
                :disabled="!settingsStore.config.knowledgeCopilot.enabled" />
            </div>
          </section>
        </div>
      </section>

      <section v-if="activeView === 'dashboard'" class="subtitle-settings-section settings-grid">
        <p class="subtitle-settings-label">{{ t('label.knowledgeCopilotSectionIndex') }}</p>

        <section class="setting-card"
          :aria-label="`${t('label.knowledgeCopilotIndexStatus')}: ${t('text.knowledgeCopilotIndexStatus')}`">
          <div class="index-status-container">
            <div class="status-info">
              <div class="status-item">
                <span class="status-label">{{ t('label.knowledgeCopilotIndexCurrentState') }}</span>
                <span class="status-value status-pill" :class="indexStateToneClass">{{ indexStateText }}</span>
              </div>
              <div class="status-item">
                <span class="status-label">{{ t('label.knowledgeCopilotTotalChunks') }}</span>
                <span class="status-value">{{ indexStatus.totalChunks || 0 }}</span>
              </div>
              <div class="status-item">
                <span class="status-label">{{ t('label.knowledgeCopilotLastIndexed') }}</span>
                <span class="status-value">{{ lastIndexedText }}</span>
              </div>
            </div>

            <div class="settings-card-actions">
              <button type="button" class="action-button"
                :disabled="!settingsStore.config.knowledgeCopilot.enabled || isIndexing || !isConfigured"
                @click="handleRebuildIndex">
                <span v-if="isIndexing" class="spinner"></span>
                <span>{{ rebuildButtonText }}</span>
              </button>
              <button type="button" class="action-button secondary" @click="openKnowledgeCopilotIndexSettings">
                {{ t('label.knowledgeCopilotIndexSettings') }}
              </button>
            </div>
          </div>
        </section>
      </section>

      <KnowledgeCopilotIndexSettings v-else @toggle="handleToggle" @number-update="handleKnowledgeCopilotNumberUpdate" />
    </div>

    <div v-if="activeView === 'knowledgeCopilot-index-settings'" class="settings-subview-footer with-divider">
      <div class="settings-subview-footer-buttons">
        <button type="button" class="action-button secondary" @click="handleBack">
          {{ t('button.back') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore, type KnowledgeCopilotSettings } from '../../store/settings.store';
import { settingsService } from '../../services/settings.service';
import { useKnowledgeCopilotIndex, useKnowledgeCopilotConfig } from '@renderer/features/knowledge-copilot';
import { useWorkspaceStore } from '@renderer/features/workspace/store/workspace.store';
import { createLogger } from '@renderer/features/logger';
import { getErrorMessage } from '@shared/utils/error.utils';
import { knowledgeCopilotService } from '@renderer/features/knowledge-copilot/services/knowledge-copilot.service';
import KnowledgeCopilotIndexSettings from './KnowledgeCopilotIndexSettings.vue';


const { t } = useI18n();
const settingsStore = useSettingsStore();
const workspaceStore = useWorkspaceStore();
const { indexStatus, isIndexing, rebuildIndex, refreshStatus, clearIndex } = useKnowledgeCopilotIndex();
const { isConfigured } = useKnowledgeCopilotConfig();
const KnowledgeCopilotSettingsLogger = createLogger('KnowledgeCopilotSettings');

type KnowledgeCopilotSettingsView = 'dashboard' | 'knowledgeCopilot-index-settings';

const activeView = ref<KnowledgeCopilotSettingsView>('dashboard');

const pageTitle = computed(() => activeView.value === 'knowledgeCopilot-index-settings'
  ? t('label.knowledgeCopilotIndexSettings')
  : t('pref.pane.knowledgeCopilot'));

const sourceSupportsCapability = (capabilities: string[], capability: string): boolean => {
  return capabilities.length === 0 || capabilities.includes(capability);
};

const embeddingSources = computed(() => {
  return settingsStore.config.aiSources.sources.filter((source) => sourceSupportsCapability(source.capabilities, 'embedding'));
});

const chatSources = computed(() => {
  return settingsStore.config.aiSources.sources.filter((source) => sourceSupportsCapability(source.capabilities, 'chat'));
});

const rerankerSources = computed(() => {
  return settingsStore.config.aiSources.sources.filter((source) => sourceSupportsCapability(source.capabilities, 'reranker'));
});

onMounted(() => {
  if (settingsStore.config.knowledgeCopilot.enabled) {
    refreshStatus();
  }
});

const openKnowledgeCopilotIndexSettings = (): void => {
  activeView.value = 'knowledgeCopilot-index-settings';
};

const handleBack = (): void => {
  activeView.value = 'dashboard';
  if (settingsStore.config.knowledgeCopilot.enabled) {
    void refreshStatus();
  }
};

const handleToggle = async (key: keyof KnowledgeCopilotSettings) => {
  await settingsStore.knowledgeCopilot.update(key, !settingsStore.config.knowledgeCopilot[key]);
};

const revertSelectValue = (key: keyof KnowledgeCopilotSettings, event?: Event) => {
  if (event?.target) {
    (event.target as HTMLSelectElement).value = String(settingsStore.config.knowledgeCopilot[key] ?? '');
  }
};

const getNotesForIndexing = () => workspaceStore.notes.map((node) => ({
  id: node.id,
  title: node.title,
  content: node.content,
}));

const handleKnowledgeCopilotUpdate = async <K extends keyof KnowledgeCopilotSettings>(key: K, value: KnowledgeCopilotSettings[K], event?: Event) => {
  if (key === 'embeddingSourceId') {
    if (value === settingsStore.config.knowledgeCopilot[key]) return;

    const isEnabled = settingsStore.config.knowledgeCopilot.enabled;
    const confirmed = !isEnabled || await settingsService.confirmEmbeddingSourceChange(
      settingsStore.config.knowledgeCopilot.embeddingSourceId,
      String(value)
    );
    if (!confirmed) {
      revertSelectValue(key, event);
      return;
    }

    await settingsStore.knowledgeCopilot.update(key, value);

    if (!isEnabled) {
      return;
    }

    try {
      await knowledgeCopilotService.initialize();

      const notes = getNotesForIndexing();
      if (notes.length === 0) {
        await clearIndex();
      } else {
        await rebuildIndex(notes, 'manual', true);
      }

      await refreshStatus();
    } catch (e) {
      KnowledgeCopilotSettingsLogger.error(`Failed to handle clear index after model change: ${getErrorMessage(e)}`);
      revertSelectValue(key, event);
    }
    return;
  }

  await settingsStore.knowledgeCopilot.update(key, value);
};

const handleKnowledgeCopilotNumberUpdate = async (key: keyof KnowledgeCopilotSettings, event: Event) => {
  const previousValue = settingsStore.config.knowledgeCopilot[key];
  const target = event.target as HTMLInputElement | HTMLSelectElement;
  const value = key === 'similarityThreshold' ? parseFloat(target.value) : parseInt(target.value);
  await settingsStore.knowledgeCopilot.update(key, value || 0);

  if ((key !== 'chunkSize' && key !== 'chunkOverlap') || previousValue === settingsStore.config.knowledgeCopilot[key]) {
    return;
  }

  try {
    const shouldRebuild = await settingsService.confirmKnowledgeCopilotChunkRebuild();
    if (!shouldRebuild) {
      return;
    }

    const notes = getNotesForIndexing();
    if (notes.length === 0) {
      await clearIndex();
    } else {
      await rebuildIndex(notes, 'manual', true);
    }
    await refreshStatus();
  } catch (error) {
    KnowledgeCopilotSettingsLogger.error(`Failed to rebuild index after chunk setting change: ${getErrorMessage(error)}`);
  }
};

const handleRebuildIndex = async () => {
  if (!isConfigured.value) {
    KnowledgeCopilotSettingsLogger.error(t('message.error.knowledgeCopilotNotConfigured'));
    return;
  }

  try {
    const rebuildMode = await settingsService.confirmKnowledgeCopilotRebuildMode();
    if (rebuildMode === 'cancel') {
      return;
    }

    const notes = getNotesForIndexing();

    if (notes.length === 0) {
      KnowledgeCopilotSettingsLogger.error(t('message.error.indexNotesNotFound'));
      return;
    }

    await rebuildIndex(notes, 'manual', rebuildMode === 'full');
    await refreshStatus();
  } catch (error) {
    KnowledgeCopilotSettingsLogger.error(`Failed to rebuild index: ${getErrorMessage(error)}`);
  }
};

const rebuildButtonText = computed(() => {
  if (!isIndexing.value) {
    return t('button.rebuildIndex');
  }

  return `${indexStatus.value.progress} %`;
});

const indexStateText = computed(() => {
  if (isIndexing.value) {
    return t('label.knowledgeCopilotIndexStateIndexing');
  }

  if (!settingsStore.config.knowledgeCopilot.enabled) {
    return t('label.knowledgeCopilotIndexStateDisabled');
  }

  if (!isConfigured.value) {
    return t('label.knowledgeCopilotIndexStateNeedsConfig');
  }

  if (indexStatus.value.lastRebuildResult === 'failure') {
    return t('label.knowledgeCopilotIndexStateFailed');
  }

  if (indexStatus.value.lastRebuildResult === 'partial-failure') {
    return t('label.knowledgeCopilotIndexStatePartialFailure');
  }

  if (indexStatus.value.lastRebuildResult === 'success') {
    return t('label.knowledgeCopilotIndexStateSucceeded');
  }

  if (!settingsStore.config.knowledgeCopilot.lastIndexedAt || Number(indexStatus.value.totalChunks || 0) === 0) {
    return t('label.knowledgeCopilotIndexStateEmpty');
  }

  return t('label.knowledgeCopilotIndexStateIdle');
});

const indexStateToneClass = computed(() => {
  if (isIndexing.value) {
    return 'active';
  }

  if (!settingsStore.config.knowledgeCopilot.enabled || !isConfigured.value) {
    return '';
  }

  switch (indexStatus.value.lastRebuildResult) {
    case 'success':
      return 'success';
    case 'partial-failure':
      return 'warning';
    case 'failure':
      return 'error';
    default:
      return '';
  }
});

const lastIndexedText = computed(() => {
  const timestamp = settingsStore.config.knowledgeCopilot.lastIndexedAt;
  return timestamp ? formatDate(timestamp) : t('label.knowledgeCopilotNeverIndexed');
});

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};


</script>

<style scoped>
.index-status-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
  width: 100%;
  min-width: 0;
}

.status-info {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-size: 13px;
  gap: 5px;
  min-width: 0;
}

.status-label {
  color: var(--text-muted);
  font-weight: 400;
  white-space: nowrap;
}

.status-value {
  color: var(--text);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 2px 8px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: var(--surface-soft);
  color: var(--text-muted);
}

.status-pill.active {
  color: var(--accent);
}

.status-pill.success {
  border-color: var(--status-success-border);
  background: var(--status-success-bg);
  color: var(--status-success-text);
}

.status-pill.warning {
  border-color: var(--status-warning-border);
  background: var(--status-warning-bg);
  color: var(--status-warning-text);
}

.status-pill.error {
  border-color: var(--status-danger-border);
  background: var(--status-danger-bg);
  color: var(--status-danger-text);
}

@media (max-width: 760px) {
  .index-status-container {
    align-items: stretch;
    flex-direction: column;
  }

  .status-info {
    grid-template-columns: 1fr;
  }
}
</style>


