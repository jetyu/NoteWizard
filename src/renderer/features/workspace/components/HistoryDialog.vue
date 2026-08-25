<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="workspaceStore.isHistoryDialogOpen" class="history-overlay" @keydown.esc="closeDialog" tabindex="0"
        ref="overlayRef">
        <div class="history-modal" @click.stop>
          <div class="history-header">
            <h2>{{ $t('history.title') }}</h2>
            <button @click="closeDialog" class="btn-close dialog-close-button">
              <IconX :size="18" />
            </button>
          </div>

          <div class="history-content">
            <div class="history-sidebar">
              <div v-if="workspaceStore.historyLoading" class="loading-state">
                <div class="spinner"></div>
              </div>
              <div v-else-if="workspaceStore.historyVersions.length === 0" class="empty-state">
                <p>{{ $t('history.emptyState') }}</p>
              </div>
              <ul v-else class="version-list">
                <li v-for="version in sortedVersions" :key="version.filename" class="version-item"
                  :class="{ active: selectedVersion === version.filename }" @click="selectVersion(version.filename)">
                  <div class="version-info">
                    <span class="version-time">{{ formatTime(version.timestamp) }}</span>
                  </div>
                </li>
              </ul>
            </div>

            <div class="history-preview">
              <div v-if="isLoadingContent" class="loading-state">
                <div class="spinner"></div>
              </div>
              <div v-else-if="selectedVersion" class="history-diff">
                <div class="diff-toolbar">
                  <span class="diff-target">
                    {{ formatSelectedVersionTime() }}
                    <span aria-hidden="true">→</span>
                    {{ $t('label.currentVersion') }}
                  </span>
                  <div class="diff-stats">
                    <span class="diff-stat diff-stat--added">
                      {{ $t('history.diffAdded') }} {{ historyDiff.stats.added }}
                    </span>
                    <span class="diff-stat diff-stat--deleted">
                      {{ $t('history.diffDeleted') }} {{ historyDiff.stats.deleted }}
                    </span>
                    <span class="diff-stat diff-stat--modified">
                      {{ $t('history.diffModified') }} {{ historyDiff.stats.modified }}
                    </span>
                  </div>
                </div>

                <div v-if="!historyDiff.hasChanges" class="empty-diff">
                  {{ $t('sync.summary.noChanges') }}
                </div>
                <div v-else class="diff-lines" role="table">
                  <div v-for="(line, index) in historyDiff.lines" :key="`${index}-${line.type}`"
                    class="diff-line" :class="`diff-line--${line.type}`" role="row">
                    <span class="diff-line-number" role="cell">{{ line.oldLineNumber ?? '' }}</span>
                    <span class="diff-line-number" role="cell">{{ line.newLineNumber ?? '' }}</span>
                    <span class="diff-line-marker" role="cell" aria-hidden="true">{{ diffMarker(line.type) }}</span>
                    <code class="diff-line-content" role="cell">{{ line.content || '\u00A0' }}</code>
                  </div>
                </div>
              </div>
              <div v-else class="empty-preview">
                <IconTextRecognition :size="72" class="empty-preview__icon" aria-hidden="true" />
                <p>{{ $t('history.previewPlaceholder') }}</p>
              </div>
            </div>
          </div>

          <div class="history-footer">
            <button class="action-button secondary btn-cancel" @click="closeDialog">{{ $t('button.cancel') }}</button>
            <button class="action-button primary btn-restore" :disabled="!selectedVersion || isRestoring" @click="handleRestore">
              {{ isRestoring ? $t('history.restoring') : $t('history.restore') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWorkspaceStore } from '../store/workspace.store';
import { IconTextRecognition, IconX } from '@tabler/icons-vue';
import {
  createHistoryDiff,
  type HistoryDiffLineType,
} from '../utils/historyDiff.utils';

const workspaceStore = useWorkspaceStore();
const { t } = useI18n();
const overlayRef = ref<HTMLElement | null>(null);
const selectedVersion = ref<string | null>(null);
const selectedContentMarkdown = ref<string>('');
const isLoadingContent = ref(false);
const isRestoring = ref(false);
const sortedVersions = computed(() => {
  return [...workspaceStore.historyVersions].sort((a, b) => b.timestamp - a.timestamp);
});

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString();
};

const historyDiff = computed(() => createHistoryDiff(
  selectedContentMarkdown.value,
  workspaceStore.activeNote?.content ?? '',
));

const formatSelectedVersionTime = () => {
  const version = sortedVersions.value.find(item => item.filename === selectedVersion.value);
  return version ? formatTime(version.timestamp) : '';
};

const diffMarker = (type: HistoryDiffLineType) => {
  if (type === 'added') return t('history.diffAdded');
  if (type === 'deleted') return t('history.diffDeleted');
  if (type === 'modified-before') return t('history.diffModifiedBefore');
  if (type === 'modified-after') return t('history.diffModifiedAfter');
  return '';
};

const closeDialog = () => {
  workspaceStore.closeHistoryDialog();
};

const selectVersion = async (filename: string) => {
  selectedVersion.value = filename;
  isLoadingContent.value = true;
  selectedContentMarkdown.value = '';
  try {
    selectedContentMarkdown.value = await workspaceStore.getHistoryContent(filename);
  } finally {
    isLoadingContent.value = false;
  }
};

const handleRestore = async () => {
  if (!selectedVersion.value) return;

  isRestoring.value = true;
  try {
    await workspaceStore.confirmRecoverVersion(selectedVersion.value);
  } finally {
    isRestoring.value = false;
  }
};

watch(() => workspaceStore.isHistoryDialogOpen, async (newVal) => {
  if (newVal) {
    selectedVersion.value = null;
    selectedContentMarkdown.value = '';
    isRestoring.value = false;
    await nextTick();
    overlayRef.value?.focus();

    if (workspaceStore.historyVersions.length > 0) {
      const latestVersion = workspaceStore.historyVersions.reduce((prev, current) =>
        (prev.timestamp > current.timestamp) ? prev : current
      );
      await selectVersion(latestVersion.filename);
    }
  }
});
</script>

<style scoped>
.history-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: var(--dialog-overlay-bg);
  backdrop-filter: var(--dialog-overlay-backdrop-filter);
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
}

.history-modal {
  width: 1040px;
  max-width: 95vw;
  height: 680px;
  max-height: 90vh;
  background: var(--panel, #ffffff);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--panel-border, #e5e7eb);
}

.history-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--panel-border, #e5e7eb);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--panel-header, #f9fafb);
}

.history-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text, #111827);
}

.btn-close {
  color: var(--text, #111827);
}

.history-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.history-sidebar {
  width: 230px;
  border-right: 1px solid var(--panel-border, #e5e7eb);
  background: var(--panel-header, #f9fafb);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.version-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.version-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--panel-border, #e5e7eb);
  transition: background 0.2s;
}

.version-item:hover {
  background: var(--panel-hover, #f3f4f6);
}

.version-item.active {
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  border-left: 3px solid var(--accent);
}

.version-info {
  display: flex;
  flex-direction: column;
}

.version-time {
  font-size: 0.9rem;
  color: var(--text, #374151);
  font-weight: 500;
}

.history-preview {
  flex: 1;
  display: flex;
  min-width: 0;
  overflow: hidden;
  background: var(--panel, #ffffff);
}

.history-diff {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.diff-toolbar {
  min-height: 44px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--panel-border, #e5e7eb);
  background: var(--surface-subtle, #f8fafc);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.diff-target {
  min-width: 0;
  color: var(--text-secondary, #5f6b7a);
  font-size: 0.82rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.diff-stats {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.diff-stat {
  min-width: 64px;
  padding: 3px 8px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-family: ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace;
  font-size: 0.76rem;
  font-weight: 700;
  text-align: center;
}

.diff-stat--added {
  color: var(--status-success-text);
  background: var(--status-success-bg);
  border-color: var(--status-success-border);
}

.diff-stat--deleted {
  color: var(--status-danger-text);
  background: var(--status-danger-bg);
  border-color: var(--status-danger-border);
}

.diff-stat--modified {
  color: var(--status-warning-text);
  background: var(--status-warning-bg);
  border-color: var(--status-warning-border);
}

.diff-lines {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: var(--panel, #ffffff);
  font-family: ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace;
  font-size: 0.8rem;
  line-height: 1.55;
}

.diff-line {
  width: max-content;
  min-width: 100%;
  display: grid;
  grid-template-columns: 52px 52px 64px minmax(0, 1fr);
  border-bottom: 1px solid color-mix(in srgb, var(--panel-border) 42%, transparent);
}

.diff-line--added {
  background: var(--status-success-bg);
}

.diff-line--deleted {
  background: var(--status-danger-bg);
}

.diff-line--modified-before,
.diff-line--modified-after {
  background: var(--status-warning-bg);
}

.diff-line-number {
  padding: 2px 8px;
  border-right: 1px solid color-mix(in srgb, var(--panel-border) 68%, transparent);
  color: var(--text-muted, #9ca3af);
  background: color-mix(in srgb, var(--surface-subtle) 82%, transparent);
  text-align: right;
  user-select: none;
}

.diff-line-marker {
  padding: 2px 6px;
  color: var(--text-muted, #9ca3af);
  font-weight: 700;
  text-align: center;
  user-select: none;
}

.diff-line--added .diff-line-marker,
.diff-line--modified-after .diff-line-marker {
  color: var(--status-success-text);
}

.diff-line--deleted .diff-line-marker,
.diff-line--modified-before .diff-line-marker {
  color: var(--status-danger-text);
}

.diff-line-content {
  min-width: max-content;
  padding: 2px 12px;
  color: var(--text, #111827);
  font: inherit;
  white-space: pre;
}

.empty-diff {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted, #9ca3af);
  font-size: 0.9rem;
}

.empty-preview,
.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted, #9ca3af);
}

.empty-preview {
  flex: 1;
  min-height: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 28px;
  text-align: center;
}

.empty-preview__icon {
  color: color-mix(in srgb, var(--accent) 35%, var(--text-muted, #9ca3af));
  margin-bottom: 4px;
}

.empty-preview p {
  margin: 0;
  max-width: 320px;
  color: var(--text-muted, #9ca3af);
  font-size: 0.86rem;
  line-height: 1.5;
}

.loading-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid var(--panel-border, #e5e7eb);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.history-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--panel-border, #e5e7eb);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: var(--panel-header, #f9fafb);
}

.btn-cancel,
.btn-restore {
  padding: 6px 16px;
  font-size: 0.9rem;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
