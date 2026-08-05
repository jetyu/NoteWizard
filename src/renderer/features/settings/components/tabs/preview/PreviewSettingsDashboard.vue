<template>
  <div class="settings-fade-in">
    <div class="settings-grid">
      <div class="settings-row-grid">
        <section class="setting-card">
          <div class="setting-copy">
            <p class="setting-label">{{ t('label.previewFontSize') }}</p>
            <p class="setting-description">{{ t('text.previewFontSize') }}</p>
          </div>
          <div class="number-input-container">
            <input type="number" class="settings-input number-input"
              :value="settingsStore.config.preview.fontSize" @change="handleFontSizeChange" min="10" max="32"
              step="1" />
          </div>
        </section>

        <section class="setting-card">
          <div class="setting-copy">
            <p class="setting-label">{{ t('label.previewFont') }}</p>
            <p class="setting-description">{{ t('text.previewFont') }}</p>
          </div>
          <label class="select-shell">
            <select class="settings-select" :value="settingsStore.config.preview.fontFamily"
              @change="handleFontChange">
              <option v-for="font in fontOptions" :key="font.id" :value="font.value">
                {{ font.label }}
              </option>
            </select>
          </label>
        </section>
      </div>
      <section class="setting-card">
        <div class="setting-copy">
          <p class="setting-label">{{ t('label.previewAllowHtml') }}</p>
          <p class="setting-description">{{ t('text.previewAllowHtml') }}</p>
        </div>
        <button type="button" class="startup-switch"
          :class="{ enabled: settingsStore.config.preview.allowHtml }"
          :aria-pressed="settingsStore.config.preview.allowHtml" @click="togglePreviewSetting('allowHtml')">
          <span class="startup-switch-track">
            <span class="startup-switch-thumb" />
          </span>
          <span class="startup-switch-text">
            {{ settingsStore.config.preview.allowHtml ? t('checkbox.status.enabled') :
              t('checkbox.status.disabled') }}
          </span>
        </button>
      </section>

      <!-- SVG 渲染开关 -->
      <section class="setting-card">
        <div class="setting-copy">
          <p class="setting-label">{{ t('label.previewAllowInlineSvg') }}</p>
          <p class="setting-description">{{ t('text.previewAllowInlineSvg') }}</p>
        </div>
        <button type="button" class="startup-switch"
          :class="{ enabled: settingsStore.config.preview.allowInlineSvg }"
          :aria-pressed="settingsStore.config.preview.allowInlineSvg"
          :disabled="!settingsStore.config.preview.allowHtml" @click="togglePreviewSetting('allowInlineSvg')">
          <span class="startup-switch-track">
            <span class="startup-switch-thumb" />
          </span>
          <span class="startup-switch-text">
            {{ settingsStore.config.preview.allowInlineSvg ? t('checkbox.status.enabled') :
              t('checkbox.status.disabled') }}
          </span>
        </button>
      </section>

      <!-- 远程图片配置 -->
      <section class="setting-card entry-card">
        <div class="setting-copy">
          <p class="setting-label">{{ t('label.previewRemoteImages') }}</p>
          <p class="setting-description">
            {{ dynamicDescription }}
          </p>
        </div>

        <div class="settings-mode-control">
          <label class="select-shell">
            <select class="settings-select" :value="settingsStore.config.preview.remoteImageMode"
              @change="handleRemoteImageModeChange">
              <option value="blocked">{{ t('option.previewRemoteImages.blocked') }}</option>
              <option value="trusted">{{ t('option.previewRemoteImages.trusted') }}</option>
              <option value="all">{{ t('option.previewRemoteImages.all') }}</option>
            </select>
          </label>

          <button class="settings-nav-btn" :disabled="settingsStore.config.preview.remoteImageMode !== 'trusted'"
            @click="emit('edit-trusted-hosts')" :title="t('label.previewTrustedSources')">
            <IconPencil :size="16" />
          </button>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { IconPencil } from '@tabler/icons-vue';
import { useSettingsStore, type PreviewConfig } from '../../../store/settings.store';
import fontProvider from '@renderer/config/font-provider.json';

const { t } = useI18n();
const settingsStore = useSettingsStore();

const fontOptions = fontProvider;

const emit = defineEmits(['edit-trusted-hosts']);

const dynamicDescription = computed(() => {
  const mode = settingsStore.config.preview.remoteImageMode;
  return t(`text.previewRemoteImages.${mode}`);
});

const togglePreviewSetting = async (key: 'allowHtml' | 'allowInlineSvg') => {
  await settingsStore.preview.update(
    key,
    !settingsStore.config.preview[key] as PreviewConfig[typeof key],
  );
};

const handleRemoteImageModeChange = async (event: Event) => {
  const target = event.target as HTMLSelectElement;
  await settingsStore.preview.update(
    'remoteImageMode',
    target.value as PreviewConfig['remoteImageMode'],
  );
};

const handleFontSizeChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const val = parseInt(target.value, 10);
  if (!isNaN(val) && val >= 10 && val <= 32) {
    await settingsStore.preview.update('fontSize', val);
  }
};

const handleFontChange = async (event: Event) => {
  const target = event.target as HTMLSelectElement;
  await settingsStore.preview.update('fontFamily', target.value);
};
</script>
