<template>
  <div class="general-settings">
    <h3 class="panel-title">{{ t('pref.pane.general') }}</h3>

    <div class="settings-grid">
      <section class="setting-card">
        <div class="setting-copy">
          <p class="setting-label">{{ t('label.autoStartUp') }}</p>
          <p class="setting-description">{{ t('text.autoStartup') }}</p>
        </div>
        <button type="button" class="startup-switch" :class="{ enabled: settingsStore.config.general.autoStartup }"
          :aria-pressed="settingsStore.config.general.autoStartup" @click="handleStartupToggle">
          <span class="startup-switch-track">
            <span class="startup-switch-thumb" />
          </span>
          <span class="startup-switch-text">
            {{ settingsStore.config.general.autoStartup ? t('checkbox.status.enabled') : t('checkbox.status.disabled') }}
          </span>
        </button>
      </section>
      <section class="setting-card">
        <div class="setting-copy">
          <p class="setting-label">{{ t('label.language') }}</p>
          <p class="setting-description">{{ t('text.UIDisplayLanguage') }}</p>
        </div>
        <label class="select-shell">
          <select class="settings-select" :value="settingsStore.config.general.language" @change="handleLanguageChange">
            <option v-for="option in languageOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
      </section>
      <section class="setting-card">
        <div class="setting-copy">
          <p class="setting-label">{{ t('label.startupDefaultView') }}</p>
          <p class="setting-description">{{ t('text.startupDefaultView') }}</p>
        </div>
        <label class="select-shell">
          <select class="settings-select" :value="startupViewValue" @change="handleStartupViewChange">
            <option value="workbench">{{ t('option.startup.workbench') }}</option>
            <option value="workspace">{{ t('option.startup.workspace') }}</option>
          </select>
        </label>
      </section>

      <section class="setting-card">
        <div class="setting-copy">
          <p class="setting-label">{{ t('label.themeMode') }}</p>
          <p class="setting-description">{{ t('text.themeMode') }}</p>
        </div>
        <label class="select-shell">
          <select class="settings-select" :value="settingsStore.config.general.themeMode" @change="handleThemeChange">
            <option value="system">{{ t('option.theme.system') }}</option>
            <option value="light">{{ t('option.theme.light') }}</option>
            <option value="dark">{{ t('option.theme.dark') }}</option>
          </select>
        </label>
      </section>

      <section class="setting-card">
        <div class="setting-copy">
          <p class="setting-label">{{ t('label.themeAccent') }}</p>
          <p class="setting-description">{{ t('text.themeAccent') }}</p>
        </div>
        <label class="select-shell">
          <select class="settings-select" :value="themeAccentValue" @change="handleAccentChange">
            <option value="azureBlue">{{ t('option.themeAccent.azureBlue') }}</option>
            <option value="black">{{ t('option.themeAccent.black') }}</option>
            <option value="indigo">{{ t('option.themeAccent.indigo') }}</option>
            <option value="cyan">{{ t('option.themeAccent.cyan') }}</option>
            <option value="teal">{{ t('option.themeAccent.teal') }}</option>
          </select>
        </label>
      </section>
      <section class="setting-card">
        <div class="setting-copy">
          <p class="setting-label">{{ t('label.appUIFont') }}</p>
          <p class="setting-description">{{ t('text.appUIFont') }}</p>
        </div>
        <label class="select-shell">
          <select class="settings-select" :value="settingsStore.config.general.appUIFont" @change="handleappUIFontChange">
            <option v-for="font in fontOptions" :key="font.id" :value="font.value">
              {{ font.label }}
            </option>
          </select>
        </label>
      </section>

      <section class="setting-card">
        <div class="setting-copy">
          <p class="setting-label">{{ t('label.windowCloseAction') }}</p>
          <p class="setting-description">{{ windowCloseActionDescription }}</p>
        </div>
        <label class="select-shell">
          <select class="settings-select" :value="settingsStore.config.general.windowCloseAction"
            @change="handleWindowCloseActionChange">
            <option value="minimize">{{ t('option.windowCloseAction.minimize') }}</option>
            <option value="exit">{{ t('option.windowCloseAction.exit') }}</option>
          </select>
        </label>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { languageOptions } from '@renderer/features/i18n';
import { type AppShellMainViewId } from '@renderer/app/constants/appShell.constants';
import fontProvider from '@renderer/config/font-provider.json';
import { useSettingsStore, type AppSettings, type WindowCloseAction } from '../../store/settings.store';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const fontOptions = fontProvider;

const startupViewValue = computed<AppShellMainViewId>(() => {
  return settingsStore.config.appShell.activeMainView === 'workspace' ? 'workspace' : 'workbench';
});

const themeAccentValue = computed<AppSettings['general']['accentMode']>(() => {
  return settingsStore.config.general.accentMode;
});

const windowCloseActionDescription = computed<string>(() => {
  return settingsStore.config.general.windowCloseAction === 'exit'
    ? t('text.windowCloseAction.exit')
    : t('text.windowCloseAction.minimize');
});

const handleLanguageChange = async (event: Event) => {
  const target = event.target as HTMLSelectElement;
  await settingsStore.general.setLanguage(target.value);
};

const handleStartupToggle = async () => {
  await settingsStore.general.setAutoStartup(!settingsStore.config.general.autoStartup);
};

const handleStartupViewChange = async (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const value = target.value as AppShellMainViewId;
  await settingsStore.appShell.update({
    ...settingsStore.config.appShell,
    activeMainView: value,
  });
};

const handleThemeChange = async (event: Event) => {
  const target = event.target as HTMLSelectElement;
  await settingsStore.general.update('themeMode', target.value as 'system' | 'light' | 'dark');
};

const handleAccentChange = async (event: Event) => {
  const target = event.target as HTMLSelectElement;
  await settingsStore.general.update('accentMode', target.value as AppSettings['general']['accentMode']);
};

const handleappUIFontChange = async (event: Event) => {
  const target = event.target as HTMLSelectElement;
  await settingsStore.general.update('appUIFont', target.value);
};

const handleWindowCloseActionChange = async (event: Event) => {
  const target = event.target as HTMLSelectElement;
  await settingsStore.general.update('windowCloseAction', target.value as WindowCloseAction);
};
</script>
