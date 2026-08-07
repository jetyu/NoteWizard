<template>
  <section
    class="editor-ai-operation-card"
    :class="`is-${operation.status}`"
    role="dialog"
    :aria-label="title"
    :aria-busy="operation.status === 'pending'"
  >
    <header class="operation-header" role="status" aria-live="polite">
      <span
        v-if="operation.status === 'pending'"
        class="operation-spinner"
        aria-hidden="true"
      />
      <span v-else class="operation-status-dot" aria-hidden="true" />
      <span class="operation-title">{{ title }}</span>
    </header>

    <div
      v-if="operation.status === 'preview'"
      class="operation-preview"
      tabindex="0"
    >
      {{ operation.result }}
    </div>

    <p
      v-else-if="operation.status === 'error'"
      class="operation-error"
      role="alert"
    >
      {{ operation.error }}
    </p>

    <footer v-if="operation.status === 'preview'" class="operation-actions">
      <button type="button" class="operation-button" @click="$emit('discard')">
        {{ t('editor.aiOperation.discard') }}
      </button>
      <button type="button" class="operation-button is-primary" @click="$emit('apply')">
        {{ t('editor.aiOperation.apply') }}
      </button>
    </footer>

    <footer v-else-if="operation.status === 'error'" class="operation-actions">
      <button type="button" class="operation-button" @click="$emit('close')">
        {{ t('button.close') }}
      </button>
      <button
        v-if="operation.canRetry"
        type="button"
        class="operation-button is-primary"
        @click="$emit('retry')"
      >
        {{ t('editor.aiOperation.retry') }}
      </button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { EditorAiOperationState } from '../composables/useEditorContextMenu';

const props = defineProps<{
  operation: EditorAiOperationState;
}>();

defineEmits<{
  apply: [];
  discard: [];
  retry: [];
  close: [];
}>();

const { t } = useI18n();

const title = computed(() => {
  const action = t(props.operation.actionLabelKey);
  if (props.operation.status === 'pending') {
    return t('editor.aiOperation.processing', { action });
  }
  if (props.operation.status === 'preview') {
    return t('editor.aiOperation.resultReady', { action });
  }
  return t('editor.aiOperation.failed', { action });
});
</script>

<style scoped>
.editor-ai-operation-card {
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--surface-raised);
  color: var(--text-primary);
  box-shadow: var(--shadow-lg);
}

.operation-header {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 9px 12px;
}

.operation-title {
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.operation-spinner {
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
  border: 2px solid color-mix(in srgb, var(--accent) 24%, transparent);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: editor-ai-operation-spin 0.8s linear infinite;
}

.operation-status-dot {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 14%, transparent);
}

.is-error .operation-status-dot {
  background: var(--status-danger-text);
  box-shadow: 0 0 0 3px var(--status-danger-bg);
}

.operation-preview {
  max-height: 260px;
  margin: 0 12px;
  overflow: auto;
  padding: 10px 11px;
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-sm);
  background: var(--surface-subtle);
  color: var(--text-primary);
  font-size: 13px;
  line-height: 1.6;
  outline: none;
  scrollbar-width: thin;
  user-select: text;
  white-space: pre-wrap;
  word-break: break-word;
}

.operation-preview:focus-visible {
  border-color: var(--input-border-focus);
  box-shadow: 0 0 0 2px var(--focus-ring);
}

.operation-error {
  margin: 0;
  padding: 0 12px 10px 34px;
  color: var(--status-danger-text);
  font-size: 12px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.operation-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 12px 12px;
}

.operation-button {
  min-width: 58px;
  height: 30px;
  padding: 0 12px;
  border: 1px solid var(--input-border);
  border-radius: var(--radius-sm);
  background: var(--button-bg);
  color: var(--text-primary);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  transition: background-color 0.12s ease, border-color 0.12s ease;
}

.operation-button:hover {
  border-color: color-mix(in srgb, var(--accent) 34%, var(--input-border));
  background: var(--button-bg-hover);
}

.operation-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--focus-ring);
}

.operation-button.is-primary {
  border-color: var(--accent-solid);
  background: var(--accent-solid);
  color: var(--accent-solid-text);
}

.operation-button.is-primary:hover {
  border-color: var(--accent-hover);
  background: var(--accent-hover);
}

@keyframes editor-ai-operation-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .operation-spinner {
    animation-duration: 1.8s;
  }
}
</style>
