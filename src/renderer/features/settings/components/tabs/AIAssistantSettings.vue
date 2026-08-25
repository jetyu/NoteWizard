<template>
  <div class="ai-assistant-settings">
    <h3 class="panel-title">{{ t('pref.pane.aiAssistant') }}</h3>
    <div class="ai-settings-section">
      <h4 class="ai-settings-section-title">{{ t('settings.aiAssistant.section.basic') }}</h4>
      <div class="settings-grid">
        <section class="setting-card">
          <div class="setting-copy">
            <p class="setting-label">{{ t('label.aiAssistant') }}</p>
            <p class="setting-description">{{ t('text.aiAssistant') }}</p>
          </div>
          <button type="button" class="startup-switch" :class="{ enabled: settingsStore.config.aiAssistant.enabled }"
            :aria-pressed="settingsStore.config.aiAssistant.enabled" @click="handleToggle('enabled')">
            <span class="startup-switch-track">
              <span class="startup-switch-thumb" />
            </span>
            <span class="startup-switch-text">
              {{ settingsStore.config.aiAssistant.enabled ? t('checkbox.status.enabled') : t('checkbox.status.disabled')
              }}
            </span>
          </button>
        </section>
        <section class="setting-card">
          <div class="setting-copy">
            <p class="setting-label">{{ t('label.selectAIAssistantSourceName') }}</p>
            <p class="setting-description">{{ chatSources.length === 0
              ? t('text.aiModelUnavailable')
              : t('text.selectAIAssistantSourceName') }}</p>
          </div>
          <label class="select-shell"
            :class="{ disabled: chatSources.length === 0 || !settingsStore.config.aiAssistant.enabled }">
            <select class="settings-select" :value="settingsStore.config.aiAssistant.sourceId"
              :disabled="chatSources.length === 0 || !settingsStore.config.aiAssistant.enabled"
              @change="handleSourceIdChange">
              <option v-if="chatSources.length === 0" value="" disabled>{{
                t('option.default.selectOption') }}</option>
              <option v-for="source in chatSources" :key="source.id" :value="source.id">
                {{ source.name }}
              </option>
            </select>
          </label>
        </section>
      </div>
    </div>

    <div class="ai-settings-section">
      <h4 class="ai-settings-section-title">{{ t('settings.aiAssistant.section.writingPreferences') }}</h4>
      <div class="settings-grid">
        <section class="setting-card">
          <div class="setting-copy">
            <p class="setting-label">{{ t('label.aiWritingStyle') }}</p>
            <p class="setting-description">{{ t('text.aiWritingStyle') }}</p>
          </div>
          <label class="select-shell" :class="{ disabled: !settingsStore.config.aiAssistant.enabled }">
            <select class="settings-select" :value="settingsStore.config.aiAssistant.writingStyle"
              :disabled="!settingsStore.config.aiAssistant.enabled" @change="handleWritingStyleChange">
              <option v-for="option in writingStyleOptions" :key="option.value" :value="option.value">
                {{ t(option.labelKey) }}
              </option>
            </select>
          </label>
        </section>
        <section class="setting-card">
          <div class="setting-copy">
            <p class="setting-label">{{ t('label.aiWritingScenario') }}</p>
            <p class="setting-description">{{ t('text.aiWritingScenario') }}</p>
          </div>
          <label class="select-shell" :class="{ disabled: !settingsStore.config.aiAssistant.enabled }">
            <select class="settings-select" :value="settingsStore.config.aiAssistant.writingScenario"
              :disabled="!settingsStore.config.aiAssistant.enabled" @change="handleWritingScenarioChange">
              <option v-for="option in writingScenarioOptions" :key="option.value" :value="option.value">
                {{ t(option.labelKey) }}
              </option>
            </select>
          </label>
        </section>
      </div>
    </div>

    <div class="ai-settings-section">
      <h4 class="ai-settings-section-title">{{ t('settings.aiAssistant.section.autoContinue') }}</h4>
      <div class="settings-grid">
        <section class="setting-card">
          <div class="setting-copy">
            <p class="setting-label">{{ t('label.aiAutoContinue') }}</p>
            <p class="setting-description">{{ t('text.aiAutoContinue') }}</p>
          </div>
          <button type="button" class="startup-switch"
            :class="{ enabled: settingsStore.config.aiAssistant.autoContinue }"
            :aria-pressed="settingsStore.config.aiAssistant.autoContinue"
            :disabled="!settingsStore.config.aiAssistant.enabled" @click="handleToggle('autoContinue')">
            <span class="startup-switch-track">
              <span class="startup-switch-thumb" />
            </span>
          </button>
        </section>
        <section class="setting-card">
          <div class="setting-copy">
            <p class="setting-label">{{ t('label.aiWritingMode') }}</p>
            <p class="setting-description">{{ t(`text.aiWritingMode.${settingsStore.config.aiAssistant.triggerMode}`) }}
            </p>
          </div>
          <label class="select-shell" :class="{ disabled: !isAutoContinueSettingsEnabled }">
            <select class="settings-select" :value="settingsStore.config.aiAssistant.triggerMode"
              :disabled="!isAutoContinueSettingsEnabled" @change="handleTriggerModeChange">
              <option v-for="option in writingModeOptions" :key="option.value" :value="option.value">
                {{ t(option.labelKey) }}
              </option>
            </select>
          </label>
        </section>
      </div>
    </div>

    <div class="ai-settings-section">
      <h4 class="ai-settings-section-title">{{ t('settings.aiAssistant.section.quickActions') }}</h4>
      <div class="settings-grid">
        <section class="setting-card">
          <div class="setting-copy">
            <p class="setting-label">{{ t('label.aiQuickTranslation') }}</p>
            <p class="setting-description">{{ t('text.aiQuickTranslation') }}</p>
          </div>
          <label class="select-shell" :class="{ disabled: !settingsStore.config.aiAssistant.enabled }">
            <select class="settings-select" :value="settingsStore.config.aiAssistant.quickTranslationTarget"
              :disabled="!settingsStore.config.aiAssistant.enabled" @change="handleQuickTranslationTargetChange">
              <option v-for="option in translationTargetOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  AI_WRITING_SCENARIO_OPTIONS,
  AI_WRITING_STYLE_OPTIONS,
  AI_WRITING_MODE_OPTIONS,
} from '@renderer/features/ai/constants/ai.constants';
import {
  AI_TRANSLATION_TARGET_ORDER,
  AI_TRANSLATION_TARGETS,
  isValidAiTranslationTargetLanguage,
  isValidAiWritingMode,
  isValidAiWritingScenario,
  isValidAiWritingStyle,
} from '@shared/ai.constants';
import { useSettingsStore, type AIAssistantSettings } from '../../store/settings.store';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const writingStyleOptions = AI_WRITING_STYLE_OPTIONS;
const writingScenarioOptions = AI_WRITING_SCENARIO_OPTIONS;
const writingModeOptions = AI_WRITING_MODE_OPTIONS;
const translationTargetOptions = AI_TRANSLATION_TARGET_ORDER.map((value) => ({
  value,
  label: AI_TRANSLATION_TARGETS[value].nativeLabel,
}));
const chatSources = computed(() => {
  return settingsStore.config.aiSources.sources.filter((source) => (
    source.capabilities.length === 0 || source.capabilities.includes('chat')
  ));
});
const isAutoContinueSettingsEnabled = computed(() => (
  settingsStore.config.aiAssistant.enabled
  && settingsStore.config.aiAssistant.autoContinue
));

const handleToggle = async (key: keyof AIAssistantSettings) => {
  await settingsStore.aiAssistant.update(key, !settingsStore.config.aiAssistant[key]);
};

const handleAssistantUpdate = async <K extends keyof AIAssistantSettings>(key: K, value: AIAssistantSettings[K]) => {
  await settingsStore.aiAssistant.update(key, value);
};

const getSelectValue = (event: Event): string => {
  return (event.target as HTMLSelectElement).value;
};

const handleSourceIdChange = async (event: Event) => {
  await handleAssistantUpdate('sourceId', getSelectValue(event));
};

const handleTriggerModeChange = async (event: Event) => {
  const value = getSelectValue(event);
  if (!isValidAiWritingMode(value)) {
    return;
  }

  await handleAssistantUpdate('triggerMode', value);
};

const handleWritingStyleChange = async (event: Event) => {
  const value = getSelectValue(event);
  if (!isValidAiWritingStyle(value)) {
    return;
  }

  await handleAssistantUpdate('writingStyle', value);
};

const handleWritingScenarioChange = async (event: Event) => {
  const value = getSelectValue(event);
  if (!isValidAiWritingScenario(value)) {
    return;
  }

  await handleAssistantUpdate('writingScenario', value);
};

const handleQuickTranslationTargetChange = async (event: Event) => {
  const value = getSelectValue(event);
  if (!isValidAiTranslationTargetLanguage(value)) {
    return;
  }

  await handleAssistantUpdate('quickTranslationTarget', value);
};

</script>

<style scoped>
.ai-settings-section + .ai-settings-section {
  margin-top: 18px;
}

.ai-settings-section-title {
  margin: 0 2px 8px;
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
}
</style>

