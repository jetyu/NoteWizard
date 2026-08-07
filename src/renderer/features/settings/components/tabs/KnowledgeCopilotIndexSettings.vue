<template>
  <div class="settings-grid">
    <section class="setting-card">
      <div class="setting-copy">
        <p class="setting-label">{{ t('label.knowledgeCopilotAutoIndex') }}</p>
        <p class="setting-description">{{ t('text.knowledgeCopilotAutoIndex') }}</p>
      </div>

      <button type="button" class="startup-switch"
        :class="{ enabled: settingsStore.config.knowledgeCopilot.autoIndex }"
        :aria-pressed="settingsStore.config.knowledgeCopilot.autoIndex" @click="emit('toggle', 'autoIndex')"
        :disabled="!settingsStore.config.knowledgeCopilot.enabled">
        <span class="startup-switch-track">
          <span class="startup-switch-thumb" />
        </span>
        <span class="startup-switch-text">
          {{ settingsStore.config.knowledgeCopilot.autoIndex ? t('checkbox.status.enabled') :
            t('checkbox.status.disabled') }}
        </span>
      </button>
    </section>

    <section class="setting-card">
      <div class="setting-copy">
        <p class="setting-label">{{ t('label.knowledgeCopilotIndexOnSave') }}</p>
        <p class="setting-description">{{ t('text.knowledgeCopilotIndexOnSave') }}</p>
      </div>

      <button type="button" class="startup-switch"
        :class="{ enabled: settingsStore.config.knowledgeCopilot.indexOnSave }"
        :aria-pressed="settingsStore.config.knowledgeCopilot.indexOnSave" @click="emit('toggle', 'indexOnSave')"
        :disabled="!settingsStore.config.knowledgeCopilot.enabled">
        <span class="startup-switch-track">
          <span class="startup-switch-thumb" />
        </span>
        <span class="startup-switch-text">
          {{ settingsStore.config.knowledgeCopilot.indexOnSave ? t('checkbox.status.enabled') :
            t('checkbox.status.disabled') }}
        </span>
      </button>
    </section>

    <section class="setting-card">
      <div class="setting-copy">
        <p class="setting-label">{{ t('label.knowledgeCopilotRebuildConcurrency') }}</p>
        <p class="setting-description">
          {{ t('text.knowledgeCopilotRebuildConcurrency') }}
        </p>
      </div>
      <label class="select-shell" :class="{ disabled: !settingsStore.config.knowledgeCopilot.enabled }">
        <select class="settings-select" :value="settingsStore.config.knowledgeCopilot.rebuildConcurrency"
          @change="emit('number-update', 'rebuildConcurrency', $event)"
          :disabled="!settingsStore.config.knowledgeCopilot.enabled">
          <option v-for="value in rebuildConcurrencyOptions" :key="value" :value="value">
            {{ value }}
          </option>
        </select>
      </label>
    </section>

    <section class="setting-card">
      <div class="setting-copy">
        <p class="setting-label">{{ t('label.knowledgeCopilotChunkSize') }}</p>
        <p class="setting-description">{{ t('text.knowledgeCopilotChunkSize') }}</p>
      </div>
      <div class="number-input-container">
        <input type="number" class="settings-input number-input"
          :value="settingsStore.config.knowledgeCopilot.chunkSize"
          @change="emit('number-update', 'chunkSize', $event)" step="100" min="500" max="800"
          :disabled="!settingsStore.config.knowledgeCopilot.enabled" />
      </div>
    </section>

    <section class="setting-card">
      <div class="setting-copy">
        <p class="setting-label">{{ t('label.knowledgeCopilotChunkOverlap') }}</p>
        <p class="setting-description">{{ t('text.knowledgeCopilotChunkOverlap') }}</p>
      </div>
      <div class="number-input-container">
        <input type="number" class="settings-input number-input"
          :value="settingsStore.config.knowledgeCopilot.chunkOverlap"
          @change="emit('number-update', 'chunkOverlap', $event)" step="10" min="50" max="100"
          :disabled="!settingsStore.config.knowledgeCopilot.enabled" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  getKnowledgeCopilotRebuildConcurrencyMax,
  KNOWLEDGE_COPILOT_REBUILD_CONCURRENCY_LIMITS,
} from '@shared/knowledge-copilot.constants';
import { useSettingsStore } from '../../store/settings.store';

type IndexToggleKey = 'autoIndex' | 'indexOnSave';
type IndexNumberKey = 'chunkSize' | 'chunkOverlap' | 'rebuildConcurrency';

const emit = defineEmits<{
  toggle: [key: IndexToggleKey];
  'number-update': [key: IndexNumberKey, event: Event];
}>();

const { t } = useI18n();
const settingsStore = useSettingsStore();

const embeddingSource = computed(() => settingsStore.config.aiSources.sources.find(
  source => source.id === settingsStore.config.knowledgeCopilot.embeddingSourceId,
));
const rebuildConcurrencyOptions = computed(() => {
  const maximum = getKnowledgeCopilotRebuildConcurrencyMax(embeddingSource.value?.provider);
  return Array.from(
    { length: maximum - KNOWLEDGE_COPILOT_REBUILD_CONCURRENCY_LIMITS.MIN + 1 },
    (_, index) => KNOWLEDGE_COPILOT_REBUILD_CONCURRENCY_LIMITS.MIN + index,
  );
});
</script>
