<template>
  <div class="editor-settings">
    <h3 class="panel-title">{{ t('pref.pane.editor') }}</h3>

    <!-- Editor Behavior Settings -->
    <div class="settings-grid">
      <div class="settings-row-grid">
      <!-- Editor Font Size -->

      <section class="setting-card">
        <div class="setting-copy">
          <p class="setting-label">{{ t('label.editorFontSize') }}</p>
          <p class="setting-description">{{ t('text.editorFontSize') }}</p>
        </div>
        <div class="number-input-container">
          <input type="number" class="settings-input number-input" :value="settingsStore.config.editor.fontSize"
            @change="handleFontSizeChange" min="10" max="32" step="1" />
        </div>
      </section>

      <!-- Editor Font -->
      <section class="setting-card">
        <div class="setting-copy">
          <p class="setting-label">{{ t('label.editorFont') }}</p>
          <p class="setting-description">{{ t('text.editorFont') }}</p>
        </div>
        <label class="select-shell">
          <select class="settings-select" :value="settingsStore.config.editor.fontFamily" @change="handleFontChange">
            <option v-for="font in fontOptions" :key="font.id" :value="font.value">
              {{ font.label }}
            </option>
          </select>
        </label>
      </section>
      <!-- Line Numbers -->
      <section class="setting-card">
        <div class="setting-copy">
          <p class="setting-label">{{ t('label.showLineNumbers') }}</p>
          <p class="setting-description">{{ t('text.showLineNumbers ') }}</p>
        </div>
        <button type="button" class="startup-switch" :class="{ enabled: settingsStore.config.editor.showLineNumbers }"
          :aria-pressed="settingsStore.config.editor.showLineNumbers"
          @click="() => settingsStore.editor.update('showLineNumbers', !settingsStore.config.editor.showLineNumbers)">
          <span class="startup-switch-track">
            <span class="startup-switch-thumb" />
          </span>
          <span class="startup-switch-text">
            {{ settingsStore.config.editor.showLineNumbers ? t('checkbox.status.enabled') : t('checkbox.status.disabled') }}
          </span>
        </button>
      </section>

      <!-- Word Wrap -->
      <section class="setting-card">
        <div class="setting-copy">
          <p class="setting-label">{{ t('label.wordWrap') }}</p>
          <p class="setting-description">{{ t('text.wordWrap') }}</p>
        </div>
        <button type="button" class="startup-switch" :class="{ enabled: settingsStore.config.editor.wordWrap }"
          :aria-pressed="settingsStore.config.editor.wordWrap"
          @click="() => settingsStore.editor.update('wordWrap', !settingsStore.config.editor.wordWrap)">
          <span class="startup-switch-track">
            <span class="startup-switch-thumb" />
          </span>
          <span class="startup-switch-text">
            {{ settingsStore.config.editor.wordWrap ? t('checkbox.status.enabled') : t('checkbox.status.disabled') }}
          </span>
        </button>
      </section>

      <!-- Code Folding -->
      <section class="setting-card">
        <div class="setting-copy">
          <p class="setting-label">{{ t('label.codeFolding') }}</p>
          <p class="setting-description">{{ t('text.codeFolding') }}</p>
        </div>
        <button type="button" class="startup-switch" :class="{ enabled: settingsStore.config.editor.codeFolding }"
          :aria-pressed="settingsStore.config.editor.codeFolding"
          @click="() => settingsStore.editor.update('codeFolding', !settingsStore.config.editor.codeFolding)">
          <span class="startup-switch-track">
            <span class="startup-switch-thumb" />
          </span>
          <span class="startup-switch-text">
            {{ settingsStore.config.editor.codeFolding ? t('checkbox.status.enabled') : t('checkbox.status.disabled') }}
          </span>
        </button>
      </section>

      <!-- Highlight Active Line -->
      <section class="setting-card">
        <div class="setting-copy">
          <p class="setting-label">{{ t('text.highlightActiveLine') }}</p>
          <p class="setting-description">{{ t('text.highlightActiveLine') }}</p>
        </div>
        <button type="button" class="startup-switch" :class="{ enabled: settingsStore.config.editor.highlightActiveLine }"
          :aria-pressed="settingsStore.config.editor.highlightActiveLine"
          @click="() => settingsStore.editor.update('highlightActiveLine', !settingsStore.config.editor.highlightActiveLine)">
          <span class="startup-switch-track">
            <span class="startup-switch-thumb" />
          </span>
          <span class="startup-switch-text">
            {{ settingsStore.config.editor.highlightActiveLine ? t('checkbox.status.enabled') : t('checkbox.status.disabled')
            }}
          </span>
        </button>
      </section>

      <!-- Bracket Matching -->
      <section class="setting-card">
        <div class="setting-copy">
          <p class="setting-label">{{ t('label.bracketMatching') }}</p>
          <p class="setting-description">{{ t('text.bracketMatching') }}</p>
        </div>
        <button type="button" class="startup-switch" :class="{ enabled: settingsStore.config.editor.bracketMatching }"
          :aria-pressed="settingsStore.config.editor.bracketMatching"
          @click="() => settingsStore.editor.update('bracketMatching', !settingsStore.config.editor.bracketMatching)">
          <span class="startup-switch-track">
            <span class="startup-switch-thumb" />
          </span>
          <span class="startup-switch-text">
            {{ settingsStore.config.editor.bracketMatching ? t('checkbox.status.enabled') : t('checkbox.status.disabled') }}
          </span>
        </button>
      </section>

      <!-- Auto Close Brackets -->
      <section class="setting-card">
        <div class="setting-copy">
          <p class="setting-label">{{ t('label.autoCloseBrackets') }}</p>
          <p class="setting-description">{{ t('text.autoCloseBrackets') }}</p>
        </div>
        <button type="button" class="startup-switch" :class="{ enabled: settingsStore.config.editor.autoCloseBrackets }"
          :aria-pressed="settingsStore.config.editor.autoCloseBrackets"
          @click="() => settingsStore.editor.update('autoCloseBrackets', !settingsStore.config.editor.autoCloseBrackets)">
          <span class="startup-switch-track">
            <span class="startup-switch-thumb" />
          </span>
          <span class="startup-switch-text">
            {{ settingsStore.config.editor.autoCloseBrackets ? t('checkbox.status.enabled') : t('checkbox.status.disabled') }}
          </span>
        </button>
      </section>

      <!-- Auto Indent -->
      <section class="setting-card">
        <div class="setting-copy">
          <p class="setting-label">{{ t('label.autoIndent') }}</p>
          <p class="setting-description">{{ t('text.autoIndent') }}</p>
        </div>
        <button type="button" class="startup-switch" :class="{ enabled: settingsStore.config.editor.autoIndent }"
          :aria-pressed="settingsStore.config.editor.autoIndent"
          @click="() => settingsStore.editor.update('autoIndent', !settingsStore.config.editor.autoIndent)">
          <span class="startup-switch-track">
            <span class="startup-switch-thumb" />
          </span>
          <span class="startup-switch-text">
            {{ settingsStore.config.editor.autoIndent ? t('checkbox.status.enabled') : t('checkbox.status.disabled') }}
          </span>
        </button>
      </section>

      <!-- Show Status Bar -->
      <section class="setting-card">
        <div class="setting-copy">
          <p class="setting-label">{{ t('label.showStatusBar') }}</p>
          <p class="setting-description">{{ t('text.showStatusBar') }}</p>
        </div>
        <button type="button" class="startup-switch" :class="{ enabled: settingsStore.config.editor.showStatusBar }"
          :aria-pressed="settingsStore.config.editor.showStatusBar"
          @click="() => settingsStore.editor.update('showStatusBar', !settingsStore.config.editor.showStatusBar)">
          <span class="startup-switch-track">
            <span class="startup-switch-thumb" />
          </span>
          <span class="startup-switch-text">
            {{ settingsStore.config.editor.showStatusBar ? t('checkbox.status.enabled') : t('checkbox.status.disabled') }}
          </span>
        </button>
      </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '../../store/settings.store';
import fontProvider from '@renderer/config/font-provider.json';

const { t } = useI18n();
const settingsStore = useSettingsStore();

const fontOptions = fontProvider;

const handleFontSizeChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const val = parseInt(target.value, 10);
  if (!isNaN(val) && val >= 10 && val <= 32) {
    await settingsStore.editor.update('fontSize', val);
  }
};

const handleFontChange = async (event: Event) => {
  const target = event.target as HTMLSelectElement;
  await settingsStore.editor.update('fontFamily', target.value);
};
</script>
