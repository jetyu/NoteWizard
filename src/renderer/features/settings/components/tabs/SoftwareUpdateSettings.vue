<template>
  <div class="software-update-settings">
    <h3 class="panel-title">{{ t('label.softwareAutoUpdate') }}</h3>

    <div class="settings-grid">
      <section class="setting-card">
        <div class="setting-copy">
          <p class="setting-label">{{ t('label.softwareAutoUpdate') }}</p>
          <p class="setting-description">{{ t('text.softwareAutoUpdate') }}</p>
        </div>
        <button type="button" class="startup-switch" :class="{ enabled: settingsStore.config.softwareUpdate.autoCheck }"
          :aria-pressed="settingsStore.config.softwareUpdate.autoCheck" @click="handleAutoUpdateToggle">
          <span class="startup-switch-track">
            <span class="startup-switch-thumb" />
          </span>
          <span class="startup-switch-text">
            {{ settingsStore.config.softwareUpdate.autoCheck ? t('checkbox.status.enabled') : t('checkbox.status.disabled') }}
          </span>
        </button>
      </section>

      <div class="settings-row-grid">
        <section class="setting-card">
          <div class="setting-copy">
            <p class="setting-label">{{ t('label.updateCheckInterval') }}</p>
            <p class="setting-description">{{ t('text.updateCheckInterval') }}</p>
          </div>
          <div class="number-input-container">
            <input type="number" class="settings-input number-input" :value="updateIntervalHours" min="1" max="168"
              :disabled="!settingsStore.config.softwareUpdate.autoCheck" @change="handleIntervalChange" />
          </div>
        </section>

        <section class="setting-card">
          <div class="setting-copy">
            <p class="setting-label">{{ t('label.updateChannel') }}</p>
            <p class="setting-description">{{ t('text.updateChannel') }}</p>
          </div>
          <label class="select-shell">
            <select class="settings-select" :value="settingsStore.config.softwareUpdate.channel" @change="handleChannelChange">
              <option v-for="option in channelOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
        </section>
      </div>

      <section class="setting-card">
        <div class="setting-copy">
          <p class="setting-label">{{ t('label.currentVersion') }}</p>
          <div class="update-version-stack">
            <span class="update-version-value">v{{ currentVersion }}</span>
          </div>
        </div>
        <button type="button" class="action-button secondary" :disabled="isChecking || isDownloading || isDownloadRequestPending"
          @click="handleCheckForUpdates">
          {{ isChecking ? t('button.checkingForUpdates') : t('menu.help.update') }}
        </button>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { normalizeUpdateChannel, type UpdateChannel } from '@shared/updater.constants';
import { useUpdaterStore } from '@renderer/features/updater';
import { useSettingsStore } from '../../store/settings.store';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const updaterStore = useUpdaterStore();
const {
  currentVersion,
  isChecking,
  isDownloading,
  isDownloadRequestPending,
} = storeToRefs(updaterStore);

const channelOptions = computed(() => [
  { value: 'stable' as UpdateChannel, label: t('option.updateChannel.stable') },
  { value: 'beta' as UpdateChannel, label: t('option.updateChannel.beta') },
  { value: 'dev' as UpdateChannel, label: t('option.updateChannel.dev') },
]);

const updateIntervalHours = computed(() => Math.round(settingsStore.config.softwareUpdate.checkInterval / (60 * 60 * 1000)));
async function syncUpdaterConfig(): Promise<void> {
  await updaterStore.updateConfig({
    autoCheckUpdates: settingsStore.config.softwareUpdate.autoCheck,
    updateCheckInterval: settingsStore.config.softwareUpdate.checkInterval,
    updateChannel: settingsStore.config.softwareUpdate.channel,
  });
}

const handleCheckForUpdates = async () => {
  await updaterStore.checkForUpdatesWithDialog();
};

const handleAutoUpdateToggle = async () => {
  const nextValue = !settingsStore.config.softwareUpdate.autoCheck;
  await settingsStore.softwareUpdate.update('autoCheck', nextValue);
  await syncUpdaterConfig();
};

const handleIntervalChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const nextHours = Number.parseInt(target.value, 10);
  if (Number.isNaN(nextHours) || nextHours <= 0) {
    return;
  }

  await settingsStore.softwareUpdate.update('checkInterval', nextHours * 60 * 60 * 1000);
  await syncUpdaterConfig();
};

const handleChannelChange = async (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const nextChannel = normalizeUpdateChannel(target.value);
  if (nextChannel === settingsStore.config.softwareUpdate.channel) {
    return;
  }

  await settingsStore.softwareUpdate.update('channel', nextChannel);
  updaterStore.clearDiscoveredUpdate();
  await syncUpdaterConfig();
};
</script>

<style scoped>
.update-version-stack {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.update-version-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

</style>
