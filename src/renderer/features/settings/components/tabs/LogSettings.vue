<template>
  <div class="log-settings">
    <h3 class="panel-title">{{ t('pref.pane.privacyLog') }}</h3>

    <div class="settings-grid">
      <!-- Enable Logging Toggle -->
      <section class="setting-card">
        <div class="setting-copy">
          <p class="setting-label">{{ t('label.localLogs') }}</p>
          <p class="setting-description">{{ t('text.loggingEnabled') }}</p>
        </div>

        <button type="button" class="startup-switch" :class="{ enabled: settingsStore.config.privacyLog.enabled }"
          :aria-pressed="settingsStore.config.privacyLog.enabled" @click="handleLoggingToggle">
          <span class="startup-switch-track">
            <span class="startup-switch-thumb" />
          </span>
          <span class="startup-switch-text">
            {{ settingsStore.config.privacyLog.enabled ? t('checkbox.status.enabled') : t('checkbox.status.disabled') }}
          </span>
        </button>
      </section>

      <!-- Log Level Select -->
      <section class="setting-card">
        <div class="setting-copy">
          <p class="setting-label">{{ t('label.logLevel') }}</p>
          <p class="setting-description">{{ t('text.logLevelDesc') }}</p>
        </div>

        <label class="select-shell" :class="{ disabled: !settingsStore.config.privacyLog.enabled }">
          <select class="settings-select" :value="selectedLogLevel" @change="handleLogLevelChange"
            :disabled="!settingsStore.config.privacyLog.enabled">
            <option v-for="option in logLevelOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
      </section>

      <section class="setting-card">
        <div class="setting-copy">
          <p class="setting-label">{{ t('label.logAutoClear') }}</p>
          <p class="setting-description">{{ t('text.logAutoClear') }}</p>
        </div>
        <label class="select-shell" :class="{ disabled: !settingsStore.config.privacyLog.enabled }">
          <select class="settings-select" :value="settingsStore.config.privacyLog.autoClearDays ?? 10"
            @change="handleLogAutoClearChange" :disabled="!settingsStore.config.privacyLog.enabled">
            <option :value="0">{{ t('option.logAutoClear.never') }}</option>
            <option :value="10">{{ t('option.logAutoClear.days10') }}</option>
            <option :value="20">{{ t('option.logAutoClear.days20') }}</option>
          </select>
        </label>
      </section>
      <!-- Open Log Directory -->
      <section class="setting-card">
        <div class="setting-copy">
          <p class="setting-label">{{ t('label.logFilePath') }}</p>
          <p class="setting-description">{{ t('label.logFilePathDescription') }}</p>
        </div>
        <button class="action-button" @click="handleOpenLogDir">
          {{ t('button.openLogFolder') }}
        </button>
      </section>
      <section class="setting-card">
        <div class="setting-copy">
          <p class="setting-label">{{ t('label.diagnosticLog') }}</p>
          <p class="setting-description">{{ t('diagnosticLog.exportDescription') }}</p>
        </div>

        <button type="button" class="action-button" :disabled="settingsStore.privacyLog.isExportingDiagnostics"
          @click="handleExportDiagnosticLogs">
          {{ settingsStore.privacyLog.isExportingDiagnostics
            ? t('diagnosticLog.exporting')
            : t('diagnosticLog.exportAction') }}
        </button>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { isDev } from '@renderer/config/env';
import { useI18n } from 'vue-i18n';
import { DIAGNOSTIC_EXPORT_STATUS } from '@shared/diagnostic-log.constants';
import { useSettingsStore } from '../../store/settings.store';
import { systemDialog } from '../../services/system-dialog.service';

const LOG_AUTO_CLEAR_DAY_OPTIONS = [0, 10, 20];

const { t } = useI18n();
const settingsStore = useSettingsStore();

const forceDebugOption = computed(() => !isDev && settingsStore.config.privacyLog.level === 'debug');

const logLevelOptions = computed(() => [
  ...((isDev || forceDebugOption.value) ? [{ value: 'debug', label: t('option.logLevel.Debug') }] : []),
  { value: 'info', label: t('option.logLevel.Info') },
  { value: 'warn', label: t('option.logLevel.Warn') },
  { value: 'error', label: t('option.logLevel.Error') },
]);

const selectedLogLevel = computed(() => settingsStore.config.privacyLog.level);

const handleLoggingToggle = async () => {
  await settingsStore.privacyLog.update('enabled', !settingsStore.config.privacyLog.enabled);
};

const handleLogLevelChange = async (event: Event) => {
  const target = event.target as HTMLSelectElement;
  if (!logLevelOptions.value.some((option) => option.value === target.value)) {
    return;
  }

  await settingsStore.privacyLog.update('level', target.value as 'debug' | 'info' | 'warn' | 'error');
};

const handleLogAutoClearChange = async (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const value = Number.parseInt(target.value, 10);

  if (!LOG_AUTO_CLEAR_DAY_OPTIONS.includes(value)) {
    return;
  }

  await settingsStore.privacyLog.update('autoClearDays', value);
};

const handleOpenLogDir = () => {
  settingsStore.privacyLog.openDirectory();
};

const handleExportDiagnosticLogs = async () => {
  const result = await settingsStore.privacyLog.exportDiagnostics();
  if (!result || result.status === DIAGNOSTIC_EXPORT_STATUS.CANCELLED) {
    return;
  }

  if (result.status === DIAGNOSTIC_EXPORT_STATUS.EXPORTED) {
    await systemDialog.info({
      title: t('pref.pane.privacyLog'),
      message: t('diagnosticLog.exportSuccess', { count: result.includedLogFiles }),
      detail: result.archivePath,
    });
    return;
  }

  await systemDialog.error({
    title: t('pref.pane.privacyLog'),
    message: t('diagnosticLog.exportFailed'),
    detail: result.error,
  });
};
</script>
