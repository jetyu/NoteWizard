<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isUpdateDialogOpen"
        ref="overlayRef"
        class="update-dialog-overlay"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="0"
        @click.self="closeUpdateDialog"
        @keydown.esc="closeUpdateDialog"
      >
        <section class="update-dialog" @click.stop>
          <header class="update-dialog__header">
            <div>
              <h2 :id="titleId">{{ t('menu.help.update') }}</h2>
              <p>{{ t('label.currentVersion') }} v{{ currentVersion }}</p>
            </div>
            <button
              type="button"
              class="update-dialog__close dialog-close-button"
              :aria-label="t('button.close')"
              @click="closeUpdateDialog"
            >
              <IconX :size="18" />
            </button>
          </header>

          <div class="update-dialog__body">
            <div class="update-dialog__status-icon" :class="statusToneClass" aria-hidden="true">
              <IconLoader2 v-if="isBusyState" :size="28" class="update-dialog__spinner" />
              <IconCircleCheck v-else-if="updatePanelState === 'up-to-date'" :size="28" />
              <IconAlertCircle v-else-if="updatePanelState === 'error'" :size="28" />
              <IconDownload v-else-if="updatePanelState === 'available'" :size="28" />
              <IconPackage v-else-if="updatePanelState === 'ready-to-install'" :size="28" />
              <IconRefresh v-else :size="28" />
            </div>

            <div class="update-dialog__copy">
              <h3>{{ updateStateTitle }}</h3>
              <p>{{ updateStateMessage }}</p>
            </div>

            <div v-if="isDownloadingState" class="update-dialog__progress" aria-hidden="true">
              <span :style="{ width: `${progressPercent}%` }" />
            </div>
          </div>

          <footer class="update-dialog__footer">
            <template v-if="showAvailableUpdateActions">
              <button type="button" class="action-button primary" @click="handleDownloadUpdate">
                {{ manualDownloadButtonLabel }}
              </button>
              <button type="button" class="action-button secondary" @click="handleDismissAvailableUpdate">
                {{ t('updater.later') }}
              </button>
            </template>

            <button
              v-else-if="isDownloadingState"
              type="button"
              class="action-button secondary"
              @click="handleCancelDownload"
            >
              {{ t('updater.cancel') }}
            </button>

            <template v-else-if="showInstallActions">
              <button type="button" class="action-button primary" @click="handleInstallUpdate">
                {{ t('updater.installNow') }}
              </button>
              <button type="button" class="action-button secondary" @click="handleDismissInstall">
                {{ t('updater.installLater') }}
              </button>
            </template>

            <template v-else-if="showRetryAction">
              <button type="button" class="action-button primary" @click="handleRetryUpdate">
                {{ t('updater.retry') }}
              </button>
              <button type="button" class="action-button secondary" @click="closeUpdateDialog">
                {{ t('button.close') }}
              </button>
            </template>

            <button
              v-else-if="!isBusyState"
              type="button"
              class="action-button secondary"
              @click="closeUpdateDialog"
            >
              {{ t('button.close') }}
            </button>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import {
  IconAlertCircle,
  IconCircleCheck,
  IconDownload,
  IconLoader2,
  IconPackage,
  IconRefresh,
  IconX,
} from '@tabler/icons-vue';
import { useUpdaterStore } from '../store/updater.store';

const titleId = 'update-dialog-title';
const overlayRef = ref<HTMLElement | null>(null);
const { t, te } = useI18n();
const updaterStore = useUpdaterStore();
const {
  currentVersion,
  isChecking,
  isDownloading,
  isDownloadRequestPending,
  isUpdateDialogOpen,
  updateAvailable,
  updateInfo,
  downloadProgress,
  error,
  updatePanelState,
  showAvailableUpdateActions,
  showInstallActions,
  isManualInstallUpdate,
} = storeToRefs(updaterStore);

const progressPercent = computed(() => Math.min(100, Math.max(0, Math.round(downloadProgress.value.percent || 0))));
const isDownloadingState = computed(() => updatePanelState.value === 'downloading');
const isBusyState = computed(() => updatePanelState.value === 'checking' || isDownloadingState.value);
const showRetryAction = computed(() =>
  Boolean(error.value) && !isChecking.value && !isDownloading.value && !isDownloadRequestPending.value
);

function formatFileSize(sizeInBytes: number): string {
  const safeSize = Number.isFinite(sizeInBytes) && sizeInBytes > 0 ? sizeInBytes : 0;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];

  if (safeSize === 0) {
    return `0 ${units[0]}`;
  }

  let value = safeSize;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const digits = unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(digits)} ${units[unitIndex]}`;
}

const downloadProgressSummary = computed(() =>
  `${formatFileSize(downloadProgress.value.transferred)} / ${formatFileSize(downloadProgress.value.total)} ${progressPercent.value}%`
);
const manualDownloadButtonLabel = computed(() =>
  isManualInstallUpdate.value && te('updater.downloadMacDmg')
    ? t('updater.downloadMacDmg')
    : t('updater.download')
);

const updateStateTitle = computed(() => {
  switch (updatePanelState.value) {
    case 'checking':
      return t('button.checkingForUpdates');
    case 'available':
      return t('updater.newVersionAvailable');
    case 'downloading':
      return t('updater.downloadingUpdate');
    case 'ready-to-install':
      return t('updater.readyToInstall');
    case 'error':
      return t('updater.updateError');
    case 'up-to-date':
      return t('updater.upToDate');
    case 'idle':
    default:
      return t('updater.waitingToCheck');
  }
});

const updateStateMessage = computed(() => {
  switch (updatePanelState.value) {
    case 'checking':
      return t('updater.checkingMessage');
    case 'available':
      if (isManualInstallUpdate.value && updateInfo.value && te('updater.macManualInstallMessage')) {
        return t('updater.macManualInstallMessage', { version: updateInfo.value.version });
      }

      return updateInfo.value
        ? t('updater.newVersionMessage', { version: updateInfo.value.version })
        : t('updater.newVersionAvailable');
    case 'downloading':
      return downloadProgressSummary.value;
    case 'ready-to-install':
      return updateInfo.value
        ? t('updater.installMessage', { version: updateInfo.value.version })
        : t('updater.readyToInstall');
    case 'error':
      return error.value?.message ?? t('updater.unknownError');
    case 'up-to-date':
      return t('updater.upToDateMessage');
    case 'idle':
    default:
      return t('updater.waitingToCheckMessage');
  }
});

const statusToneClass = computed(() => ({
  'is-success': updatePanelState.value === 'up-to-date',
  'is-error': updatePanelState.value === 'error',
  'is-info': updatePanelState.value === 'available' || updatePanelState.value === 'ready-to-install',
}));

async function handleDownloadUpdate(): Promise<void> {
  await updaterStore.downloadUpdate();
}

async function handleCancelDownload(): Promise<void> {
  await updaterStore.cancelDownload();
}

function handleDismissAvailableUpdate(): void {
  updaterStore.dismissAvailableUpdateActions();
  updaterStore.closeUpdateDialog();
}

async function handleInstallUpdate(): Promise<void> {
  await updaterStore.installUpdate();
}

function handleDismissInstall(): void {
  updaterStore.dismissInstallActions();
  updaterStore.closeUpdateDialog();
}

async function handleRetryUpdate(): Promise<void> {
  if (error.value?.code === 'DOWNLOAD_FAILED' && updateAvailable.value) {
    await updaterStore.downloadUpdate();
    return;
  }

  await updaterStore.checkForUpdates(false);
}

function closeUpdateDialog(): void {
  updaterStore.closeUpdateDialog();
}

watch(isUpdateDialogOpen, async (open) => {
  if (!open) {
    return;
  }

  await nextTick();
  overlayRef.value?.focus();
});
</script>

<style scoped>
.update-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: var(--dialog-overlay-bg);
  backdrop-filter: var(--dialog-overlay-backdrop-filter);
  outline: none;
}

.update-dialog {
  width: min(440px, calc(100vw - 32px));
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  background: var(--surface-raised);
  box-shadow: var(--shadow-lg);
  color: var(--text-primary);
}

.update-dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 22px 16px;
  border-bottom: 1px solid var(--border-muted);
}

.update-dialog__header h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 650;
}

.update-dialog__header p {
  margin: 5px 0 0;
  color: var(--text-tertiary);
  font-size: 0.75rem;
}

.update-dialog__close {
  flex-shrink: 0;
  color: var(--text-secondary);
}

.update-dialog__body {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 14px;
  padding: 24px 22px;
}

.update-dialog__status-icon {
  width: 48px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-muted);
  border-radius: 14px;
  background: var(--surface-subtle);
  color: var(--text-secondary);
}

.update-dialog__status-icon.is-info {
  border-color: var(--status-info-border);
  background: var(--status-info-bg);
  color: var(--status-info-text);
}

.update-dialog__status-icon.is-success {
  border-color: var(--status-success-border);
  background: var(--status-success-bg);
  color: var(--status-success-text);
}

.update-dialog__status-icon.is-error {
  border-color: var(--status-danger-border);
  background: var(--status-danger-bg);
  color: var(--status-danger-text);
}

.update-dialog__spinner {
  animation: update-dialog-spin 0.9s linear infinite;
}

.update-dialog__copy {
  align-self: center;
  min-width: 0;
}

.update-dialog__copy h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 650;
}

.update-dialog__copy p {
  margin: 7px 0 0;
  color: var(--text-secondary);
  font-size: 0.82rem;
  line-height: 1.5;
  word-break: break-word;
}

.update-dialog__progress {
  grid-column: 1 / -1;
  height: 5px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--surface-subtle);
}

.update-dialog__progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--accent);
  transition: width 0.2s ease;
}

.update-dialog__footer {
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 22px;
  border-top: 1px solid var(--border-muted);
  background: var(--surface-subtle);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes update-dialog-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 520px) {
  .update-dialog__footer {
    flex-wrap: wrap;
  }
}
</style>
