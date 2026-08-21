<template>
  <div class="ai-source-settings">
    <div class="header-actions">
      <h3 class="panel-title">{{ t('pref.pane.aiSources') }}</h3>
      <div v-if="!showAddForm" class="official-ai-sponsor">
        <img :src="siliconFlowLogoUrl" alt="" aria-hidden="true" class="official-ai-sponsor-logo" />
        <span>{{ t('text.officialInnerAiSource') }}</span>
      </div>
    </div>

    <div class="source-list">
      <template v-if="!showAddForm">
        <div v-for="source in aiSources" :key="source.id" class="source-card setting-card vertical-layout">
          <div class="source-info">
            <div class="source-header">
              <div class="source-identity">
                <img v-if="getAiProviderPresentation(source.provider).logoUrl"
                  :src="getAiProviderPresentation(source.provider).logoUrl" alt="" aria-hidden="true"
                  class="provider-logo source-provider-logo" />
                <div class="source-heading-copy">
                  <h4 class="source-title">{{ source.name }}</h4>
                  <span class="source-provider">
                    {{ isBuiltInAiSource(source)
                      ? t('aiProvider.snaptium')
                      : getAiProviderLabel(source.provider) }}
                  </span>
                </div>
              </div>
              <div v-if="isBuiltInAiSource(source)" class="source-header-badges">
                <span class="source-rate-limit-badge" :title="t('builtInAi.rateLimit.tooltip')"
                  :aria-label="t('builtInAi.rateLimit.tooltip')">
                  {{ t('builtInAi.rateLimit.badge') }}
                </span>
              </div>
              <div v-if="!isBuiltInAiSource(source)" class="settings-card-actions">
                <button class="action-btn icon-action-button" @click="handleEditSource(source)" :title="t('common.editor')">
                  <IconPencil :size="14" />
                </button>
                <button class="action-btn icon-action-button delete" @click="removeSource(source)" :title="t('title.clearConfiguration')">
                  <IconTrash :size="14" />
                </button>
              </div>
            </div>
            <div class="source-details">
              <div v-if="!isBuiltInAiSource(source)" class="detail-item">
                <span class="label">{{ t('label.aiBaseUrl') }}</span>
                <span class="value" :title="source.baseUrl">{{ source.baseUrl }}</span>
              </div>
              <template v-if="isBuiltInAiSource(source)">
                <div v-for="modelRow in builtInModelRows" :key="modelRow.capability" class="detail-item">
                  <span class="label">{{ t(modelRow.labelKey) }}</span>
                  <span class="value" :title="resolveAiSourceModel(source, modelRow.capability)">
                    {{ resolveAiSourceModel(source, modelRow.capability) }}
                  </span>
                  <span class="model-health-icon"
                    :class="[getBuiltInHealthStatus(modelRow.capability), { checking: isCheckingBuiltInHealth }]"
                    :title="getBuiltInHealthTooltip(modelRow.capability)"
                    :aria-label="getBuiltInHealthTooltip(modelRow.capability)" aria-live="polite"
                    role="img">
                    <IconBrandSpeedtest :size="14" stroke="1.8" aria-hidden="true" />
                  </span>
                </div>
              </template>
              <div v-else class="detail-item">
                <span class="label">{{ t('label.aiModel') }}</span>
                <span class="value" :title="source.aiModel">{{ source.aiModel }}</span>
              </div>
              <div v-if="!isBuiltInAiSource(source)" class="detail-item">
                <span class="label">{{ t('label.aiCapabilities') }}</span>
                <span class="value" :title="formatCapabilities(source.capabilities)">{{
                  formatCapabilities(source.capabilities) }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Add Source Form (Inside Grid) -->
      <template v-if="showAddForm">
        <div class="add-form-card">
          <div class="source-form-group">
            <label class="setting-label">
              {{ t('label.sourceName') }} <span class="required-mark">{{ t('label.starSign') }}</span>
              <span class="char-counter">{{ newSource.name.length }}/20</span>
            </label>
            <input v-model="newSource.name" type="text" class="settings-input" maxlength="20"
              :placeholder="t('placeholder.sourceName')" />
          </div>
          <div class="source-form-group">
            <label class="setting-label">{{ t('label.aiProvider') }}</label>
            <div ref="providerSelectRef" class="provider-select-row">
              <button ref="providerSelectButtonRef" type="button" class="provider-select-trigger"
                :aria-expanded="isProviderMenuOpen"
                :aria-label="`${t('label.aiProvider')}: ${getAiProviderLabel(newSource.provider)}`"
                @click="toggleProviderMenu" @keydown.esc.prevent="closeProviderMenu(true)">
                <img v-if="getAiProviderPresentation(newSource.provider).logoUrl"
                  :src="getAiProviderPresentation(newSource.provider).logoUrl" alt="" aria-hidden="true"
                  class="provider-logo" />
                <span>{{ getAiProviderLabel(newSource.provider) }}</span>
                <IconChevronDown :size="16" class="provider-select-chevron" />
              </button>
              <div v-if="isProviderMenuOpen" class="provider-select-menu" @keydown.esc.prevent="closeProviderMenu(true)">
                <button v-for="provider in selectableProviders" :key="provider" type="button" class="provider-select-option"
                  :class="{ active: newSource.provider === provider }" :aria-pressed="newSource.provider === provider"
                  @click="handleProviderMenuSelect(provider)">
                  <img v-if="getAiProviderPresentation(provider).logoUrl"
                    :src="getAiProviderPresentation(provider).logoUrl" alt="" aria-hidden="true" class="provider-logo" />
                  <span :title="getAiProviderLabel(provider)">{{ getAiProviderLabel(provider) }}</span>
                  <IconCheck v-if="newSource.provider === provider" :size="15" class="provider-select-check" />
                </button>
              </div>
            </div>
          </div>

          <div class="source-form-group">
            <label class="setting-label">{{ t('label.aiBaseUrl') }} <span class="required-mark">{{ t('label.starSign')
                }}</span></label>
            <input v-model="newSource.baseUrl" type="text" class="settings-input"
              :placeholder="aiEndpointPlaceholder" />
          </div>
          <div class="source-form-group">
            <label class="setting-label">{{ t('label.aiModel') }} <span class="required-mark">{{ t('label.starSign')
            }}</span></label>
            <input v-model="newSource.aiModel" type="text" class="settings-input"
              :placeholder="aiModelPlaceholder" />
          </div>
          <div class="source-form-group">
            <label class="setting-label">{{ t('label.aiApiKey') }} <span v-if="requiresApiKey" class="required-mark">{{ t('label.starSign')
            }}</span></label>
            <PasswordInput v-model="newSource.apiKey" :placeholder="t('placeholder.aiAPIKey')" autocomplete="off"
            />
          </div>
          <div class="source-form-group">
            <label class="setting-label">{{ t('label.aiCapabilities') }}</label>
            <div class="capability-list">
              <label v-for="option in capabilityOptions" :key="option.value" class="capability-option">
                <input :checked="newSource.capabilities.includes(option.value)" type="checkbox"
                  @change="toggleCapability(option.value, ($event.target as HTMLInputElement).checked)" />
                <span>{{ t(option.labelKey) }}</span>
              </label>
            </div>
          </div>
          <div class="form-actions-row">
            <a class="partner-docs-link" :href="AI_CONFIG_DOCS_URL" target="_blank" rel="noopener noreferrer nofollow">
              {{ t('text.aiSourcePartnerDocsLink') }}
            </a>
            <div class="buttons">
              <button class="action-button secondary" @click="handleTestNewSource"
                :disabled="!canTest || isTesting">
                <span v-if="isTesting" class="spinner small"></span>
                {{ isTesting ? t('button.testing') : t('button.testConnection') }}
              </button>
              <button class="action-button secondary" @click="handleCancelAdd">
                {{ t('button.cancel') }}
              </button>
              <button class="action-button primary" @click="handleAddSource"
                :disabled="!isFormValid || isAdding">
                <template v-if="isAdding">
                  <span class="spinner small"></span>
                </template>
                <template v-else>
                  {{ t('button.confirm') }}
                </template>
              </button>
            </div>
          </div>
        </div>
        <div class="partner-footer">
          <div class="partner-footer-brand">
            <img :src="siliconFlowLogoUrl" alt="SiliconFlow" class="partner-footer-logo" />
            <div class="partner-footer-copy">
              <span class="partner-footer-eyebrow">{{ t('text.aiSourcePartnerEyebrow') }}</span>
              <span class="partner-footer-text">
                {{ t('text.aiSourcePartnerDescription') }}
                <a class="partner-entry-link" :href="SILICONFLOW_URL" target="_blank"
                  rel="noopener noreferrer nofollow">
                  {{ t('text.aiSourcePartnerEntryLink') }}
                </a>
              </span>
            </div>
          </div>
        </div>
      </template>

      <!-- Add Source Card (Placeholder) -->
      <div v-else-if="aiSources.length > 0" class="add-source-card" @click="handleAddSourceCardClick">
        <div class="add-icon">
          <IconPlus :size="24" />
        </div>
        <span>{{ t('button.addAISource') }}</span>
      </div>

      <div v-if="aiSources.length === 0 && !showAddForm" class="add-source-card empty-trigger-card"
        @click="handleAddSourceCardClick">
        <div class="empty-icon">
          <IconBulb :size="48" />
        </div>
        <p class="empty-text">{{ t('text.noAISourcesFound') }}</p>
        <span class="empty-action-text">{{ t('button.addAISource') }}</span>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, computed, reactive, onBeforeUnmount, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '../../store/settings.store';
import type { AISource } from '../../store/settings.store';
import {
  AI_PROVIDER_DEFAULT_BASE_URLS,
  AI_PROVIDERS,
  getAiProviderCapabilities,
  resolveAiSourceModel,
  type AiCapability,
  type AiProvider,
} from '@shared/ai-provider.constants';
import {
  BUILT_IN_AI_HEALTH_STATUS,
  isBuiltInAiSourceId,
  type BuiltInAiHealthSnapshot,
  type BuiltInAiModelHealth,
} from '@shared/built-in-ai.constants';
import { getAiProviderPresentation, SELECTABLE_AI_PROVIDERS } from '../../config/ai-providers';
import { settingsService } from '../../services/settings.service';
import { systemDialog } from '../../services/system-dialog.service';
import { createLogger } from '../../../logger';
import { getErrorMessage } from '@shared/utils/error.utils';
import {
  IconBrandSpeedtest,
  IconBulb,
  IconCheck,
  IconChevronDown,
  IconPencil,
  IconPlus,
  IconTrash,
} from '@tabler/icons-vue';
import siliconFlowLogoUrl from '@assets/images/ai-partner/siliconflow.png';
import PasswordInput from '../PasswordInput.vue';

const { t } = useI18n();
const getAiProviderLabel = (provider: AiProvider): string => t(getAiProviderPresentation(provider).labelKey);
const settingsStore = useSettingsStore();
const aisLogger = createLogger('AISettings');
const SILICONFLOW_URL = 'https://cloud.siliconflow.cn/i/9OJVYJiY';
const AI_CONFIG_DOCS_URL = 'https://snaptium.com/docs/ai-config';

const showAddForm = ref(false);
const isAdding = ref(false);
const isTesting = ref(false);
const isCheckingBuiltInHealth = ref(false);
const builtInHealthSnapshot = ref<BuiltInAiHealthSnapshot | null>(null);
const editingSourceId = ref<string | null>(null);
const isProviderMenuOpen = ref(false);
const providerSelectRef = ref<HTMLElement | null>(null);
const providerSelectButtonRef = ref<HTMLButtonElement | null>(null);
const isEditMode = computed(() => !!editingSourceId.value);
const aiSources = computed<AISource[]>(() => settingsStore.config.aiSources.sources);

const newSource = reactive<{
  provider: AiProvider;
  name: string;
  baseUrl: string;
  apiKey: string;
  aiModel: string;
  capabilities: string[];
}>({
  provider: AI_PROVIDERS.SILICONFLOW,
  name: '',
  baseUrl: AI_PROVIDER_DEFAULT_BASE_URLS[AI_PROVIDERS.SILICONFLOW],
  apiKey: '',
  aiModel: '',
  capabilities: ['embedding', 'chat', 'reranker'],
});
const selectableProviders = SELECTABLE_AI_PROVIDERS;
const requiresApiKey = computed(() => newSource.provider !== AI_PROVIDERS.OLLAMA);
const aiEndpointPlaceholder = computed(() => newSource.provider === AI_PROVIDERS.AZURE_OPENAI
  ? t('placeholder.azureOpenAIEndpoint')
  : t('placeholder.aiAPIEndpoint'));
const aiModelPlaceholder = computed(() => newSource.provider === AI_PROVIDERS.AZURE_OPENAI
  ? t('placeholder.azureOpenAIDeploymentName')
  : t('placeholder.aiModel'));

const capabilityOptions = [
  { value: 'embedding', labelKey: 'label.aiCapabilityEmbedding' },
  { value: 'chat', labelKey: 'label.aiCapabilityChat' },
  { value: 'reranker', labelKey: 'label.aiCapabilityReranker' },
] as const;

const builtInModelRows: ReadonlyArray<{ capability: AiCapability; labelKey: string }> = [
  { capability: 'chat', labelKey: 'label.aiCapabilityChat' },
  { capability: 'embedding', labelKey: 'label.aiCapabilityEmbedding' },
  { capability: 'reranker', labelKey: 'label.aiCapabilityReranker' },
];

const builtInModelLabelKeys = {
  chat: 'builtInAi.capability.chat',
  embedding: 'builtInAi.capability.embedding',
  reranker: 'builtInAi.capability.reranker',
} as const satisfies Record<AiCapability, string>;

const isBuiltInAiSource = (source: AISource): boolean => isBuiltInAiSourceId(source.id);

const getBuiltInModelHealth = (capability: AiCapability): BuiltInAiModelHealth | null =>
  builtInHealthSnapshot.value?.models[capability] ?? null;

const getBuiltInHealthStatus = (capability: AiCapability): BuiltInAiModelHealth['status'] =>
  getBuiltInModelHealth(capability)?.status ?? BUILT_IN_AI_HEALTH_STATUS.UNKNOWN;

const getBuiltInHealthTooltip = (capability: AiCapability): string => {
  const model = t(builtInModelLabelKeys[capability]);
  if (isCheckingBuiltInHealth.value) {
    return t('builtInAi.health.tooltip.checking', { model });
  }

  const result = getBuiltInModelHealth(capability);
  if (!result || result.status === BUILT_IN_AI_HEALTH_STATUS.UNKNOWN) {
    return t('builtInAi.health.tooltip.checkFailed', { model });
  }
  if (result.status === BUILT_IN_AI_HEALTH_STATUS.NO_DATA) {
    return t('builtInAi.health.tooltip.noData', { model });
  }
  if (result.observedAt === null) {
    return t('builtInAi.health.tooltip.checkFailed', { model });
  }

  const observedAt = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(result.observedAt));

  if (result.status === BUILT_IN_AI_HEALTH_STATUS.UNAVAILABLE) {
    return t('builtInAi.health.tooltip.unavailable', {
      model,
      time: observedAt,
      reason: t('builtInAi.health.reason.server'),
    });
  }
  return result.status === BUILT_IN_AI_HEALTH_STATUS.DEGRADED
    ? t('builtInAi.health.tooltip.degraded', { model, time: observedAt })
    : t('builtInAi.health.tooltip.healthy', { model, time: observedAt });
};

const refreshBuiltInAiHealth = async (): Promise<void> => {
  if (isCheckingBuiltInHealth.value) return;

  isCheckingBuiltInHealth.value = true;
  try {
    builtInHealthSnapshot.value = await settingsService.getBuiltInAiHealth();
  } catch (error) {
    aisLogger.warn(`Failed to load built-in AI performance metrics: ${getErrorMessage(error)}`);
    builtInHealthSnapshot.value = null;
  } finally {
    isCheckingBuiltInHealth.value = false;
  }
};

// Basic validation for testing (All 4 marked fields are now mandatory)
const canTest = computed(() => {
  return !!(
    newSource.name.trim() &&
    newSource.baseUrl.trim() &&
    newSource.aiModel.trim() &&
    (!requiresApiKey.value || newSource.apiKey.trim())
  );
});

// Validation for adding (Name, Endpoint, Key are mandatory. Model is optional but recommended)
const isFormValid = computed(() => canTest.value);

const handleAddSourceTrigger = (): void => {
  showAddForm.value = true;
};

const handleAddSourceCardClick = (): void => {
  handleAddSourceTrigger();
};

const handleAddSource = async () => {
  if (!isFormValid.value || isAdding.value) return;

  isAdding.value = true;

  try {
    const payload = {
      provider: newSource.provider,
      name: newSource.name,
      baseUrl: newSource.baseUrl,
      apiKey: newSource.apiKey,
      aiModel: newSource.aiModel,
      capabilities: [...newSource.capabilities],
    };

    if (isEditMode.value && editingSourceId.value) {
      aisLogger.info(`Updating AI source: ${newSource.name} (ID: ${editingSourceId.value})`);
      await settingsStore.aiSources.update(editingSourceId.value, payload);
    } else {
      aisLogger.info(`Adding AI source after successful test: ${newSource.name}`);
      const result = await settingsStore.aiSources.add(payload);
      aisLogger.info(`AI Source added: ${result.name} (ID: ${result.id})`);
    }

    // Success: Reset and Hide
    resetForm();
    showAddForm.value = false;
  } catch (error) {
    aisLogger.error(`Failed to handle AI source: ${error}`);
    await systemDialog.error({
      title: t('pref.pane.aiSources'),
      message: getErrorMessage(error, t('common.unknown')),
    });
  } finally {
    isAdding.value = false;
  }
};

const handleEditSource = (source: AISource) => {
  if (isBuiltInAiSource(source)) return;

  editingSourceId.value = source.id;
  newSource.provider = source.provider;
  newSource.name = source.name;
  newSource.baseUrl = source.baseUrl;
  newSource.apiKey = source.apiKey;
  newSource.aiModel = source.aiModel;
  newSource.capabilities = [...source.capabilities];
  showAddForm.value = true;
};

const resetForm = () => {
  newSource.provider = AI_PROVIDERS.SILICONFLOW;
  newSource.name = '';
  newSource.baseUrl = AI_PROVIDER_DEFAULT_BASE_URLS[AI_PROVIDERS.SILICONFLOW];
  newSource.apiKey = '';
  newSource.aiModel = '';
  newSource.capabilities = ['embedding', 'chat', 'reranker'];
  editingSourceId.value = null;
};

const handleProviderSelect = (provider: AiProvider): void => {
  newSource.provider = provider;
  newSource.baseUrl = AI_PROVIDER_DEFAULT_BASE_URLS[provider];
  newSource.capabilities = getAiProviderCapabilities(provider);
  if (!newSource.name.trim()) {
    newSource.name = getAiProviderLabel(provider);
  }
  newSource.aiModel = '';
};

const closeProviderMenu = (restoreFocus = false): void => {
  isProviderMenuOpen.value = false;
  if (restoreFocus) {
    providerSelectButtonRef.value?.focus();
  }
};

const toggleProviderMenu = (): void => {
  isProviderMenuOpen.value = !isProviderMenuOpen.value;
};

const handleProviderMenuSelect = (provider: AiProvider): void => {
  handleProviderSelect(provider);
  closeProviderMenu();
};

const handleDocumentClick = (event: MouseEvent): void => {
  const target = event.target;
  if (target instanceof Node && !providerSelectRef.value?.contains(target)) {
    closeProviderMenu();
  }
};

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
  void refreshBuiltInAiHealth();
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
});

const handleCancelAdd = () => {
  closeProviderMenu();
  resetForm();
  showAddForm.value = false;
};

const handleTestNewSource = async () => {
  if (!canTest.value || isTesting.value) return;

  aisLogger.info(`Testing connectivity for new source: ${newSource.baseUrl}`);
  isTesting.value = true;

  try {
    const result = await settingsStore.aiSources.testConnection({
      provider: newSource.provider,
      aiBaseUrl: newSource.baseUrl,
      aiApiKey: newSource.apiKey,
      aiModel: newSource.aiModel,
      capabilities: [...newSource.capabilities],
    });

    if (result?.success) {
      aisLogger.info('Connection test successful');
      await systemDialog.info({
        title: t('pref.pane.aiSources'),
        message: t('text.testConnectionSuccess'),
      });
    } else {
      const message = result?.message || t('message.failed.testConnectionFailed');
      aisLogger.warn(`Connection test failed: ${message}`);
      await systemDialog.error({
        title: t('pref.pane.aiSources'),
        message,
      });
    }
  } catch (err) {
    const message = getErrorMessage(err, t('message.failed.testConnectionFailed'));
    aisLogger.error('Connection test error');
    await systemDialog.error({
      title: t('pref.pane.aiSources'),
      message,
    });
  } finally {
    isTesting.value = false;
  }
};

const removeSource = async (source: AISource) => {
  if (isBuiltInAiSource(source)) return;

  const confirmed = await settingsService.confirmDeleteAiSource(source.name);
  if (confirmed) {
    await settingsStore.aiSources.remove(source.id);
    aisLogger.info(`AI Source removed: ${source.id}`);
  }
};

const toggleCapability = (capability: string, checked: boolean) => {
  if (checked) {
    if (!newSource.capabilities.includes(capability)) {
      newSource.capabilities.push(capability);
    }
    return;
  }

  newSource.capabilities = newSource.capabilities.filter((item) => item !== capability);
};

const formatCapabilities = (capabilities: string[]): string => {
  const activeCapabilities = capabilities.length === 0
    ? capabilityOptions.map((option) => option.value)
    : capabilities;

  return activeCapabilities
    .map((capability) => {
      const option = capabilityOptions.find((item) => item.value === capability);
      return option ? t(option.labelKey) : capability;
    })
    .join(' / ');
};
</script>

<style scoped>
.provider-select-row {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.provider-select-trigger {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: var(--settings-control-height, 32px);
  gap: 10px;
  padding: 0.35rem 0.7rem;
  border: 1px solid var(--input-border);
  border-radius: var(--radius-sm);
  background: var(--input-bg);
  color: var(--text-primary);
  font: inherit;
  font-size: 0.86rem;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
}

.provider-select-trigger:hover:not(:disabled),
.provider-select-trigger:focus-visible {
  border-color: var(--input-border-focus);
  box-shadow: 0 0 0 3px var(--focus-ring);
  outline: none;
}

.provider-select-trigger:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.provider-select-chevron {
  margin-left: auto;
  color: var(--text-secondary);
}

.provider-select-menu {
  position: absolute;
  z-index: 12;
  top: calc(100% + 6px);
  left: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  width: max(100%, 340px);
  max-height: 320px;
  overflow-y: auto;
  gap: 4px;
  padding: 6px;
  border: 1px solid var(--settings-card-border, var(--border-muted));
  border-radius: 10px;
  background: var(--panel, #ffffff);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.16);
}

.provider-select-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 36px;
  padding: 5px 7px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: var(--text-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.provider-select-option span {
  min-width: 0;
  overflow: hidden;
  font-size: 0.76rem;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.provider-select-check {
  flex: 0 0 auto;
  margin-left: auto;
  color: var(--accent);
}

.provider-select-option:hover,
.provider-select-option:focus-visible,
.provider-select-option.active {
  border-color: color-mix(in srgb, var(--accent) 26%, transparent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
  outline: none;
}

.provider-logo {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
}

.provider-logo {
  box-sizing: border-box;
  padding: 2px;
  border-radius: 5px;
  background: #fff;
  object-fit: contain;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0;
  margin-bottom: 14px;
}

.header-actions .panel-title {
  margin-bottom: 0;
}

.official-ai-sponsor {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  color: var(--text-secondary);
  font-size: 0.78rem;
  line-height: 1.3;
  text-align: right;
}

.official-ai-sponsor-logo {
  display: block;
  flex: 0 0 auto;
  width: auto;
  height: 20px;
}

.add-form-card {
  grid-column: 1 / -1;
  background: var(--surface-raised);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--border-color, #e0e0e0);
  display: flex;
  flex-direction: column;
  gap: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.partner-footer {
  grid-column: 1 / -1;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 2px 0 0;
}

.partner-footer-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.partner-footer-logo {
  display: block;
  flex: 0 0 auto;
  height: 36px;
  width: auto;
  object-fit: contain;
}

.partner-footer-copy {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.partner-footer-eyebrow {
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--accent);
}

.partner-footer-text {
  font-size: 0.8rem;
  line-height: 1.35;
  color: var(--text-secondary);
}

.partner-entry-link {
  margin-left: 6px;
  color: var(--accent);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.partner-entry-link:hover {
  color: var(--accent-hover);
}

.partner-docs-link {
  flex: 0 0 auto;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.partner-docs-link:hover {
  color: var(--accent-hover);
}

.add-source-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  background: transparent;
  border: 1px dashed #c9d1dc;
  border-radius: 12px;
  cursor: pointer;
  color: #5f6b7a;
  transition: all 0.2s ease;
  min-height: 156px;
}

.add-source-card:hover {
  background: var(--status-info-bg);
  border-color: var(--accent);
  color: var(--accent);
  transform: translateY(-2px);
}

.add-source-card.is-disabled,
.add-source-card.is-disabled:hover {
  cursor: not-allowed;
  color: var(--text-tertiary);
  border-color: var(--settings-card-border, var(--border-muted));
  background: var(--surface-subtle);
  opacity: 0.62;
  transform: none;
}

.add-icon {
  color: inherit;
  opacity: 0.6;
}

.add-source-card.is-disabled .add-icon,
.add-source-card.is-disabled .empty-icon,
.add-source-card.is-disabled .empty-action-text {
  color: var(--text-tertiary);
}

.source-form-group {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.required-mark {
  color: #ef4444;
  font-weight: bold;
  margin-left: 2px;
}

.char-counter {
  float: right;
  font-size: 0.7rem;
  font-weight: normal;
  color: #999;
  margin-top: 2px;
}

.form-actions-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.buttons {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

.source-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.source-title {
  font-weight: 600;
  font-size: 1.05rem;
  margin: 0;
  color: var(--text-primary);
}

.source-card {
  box-sizing: border-box;
  min-height: 156px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.source-info {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.source-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 8px;
}

.source-identity {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.source-provider-logo {
  width: 24px;
  height: 24px;
}

.source-heading-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.source-header-badges {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 6px;
  margin-left: auto;
}

.source-rate-limit-badge {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  min-height: 22px;
  padding: 2px 9px;
  border: 1px solid var(--status-info-border);
  border-radius: var(--radius-sm);
  background: var(--status-info-bg);
  color: var(--status-info-text);
  font-size: 0.72rem;
  font-weight: 650;
  line-height: 1;
  cursor: help;
}

.source-provider {
  color: var(--text-secondary);
  font-size: 0.72rem;
}

.provider-picker {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(148px, 1fr));
  gap: 8px;
}

.provider-option {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 48px;
  padding: 7px 10px;
  color: var(--text-primary);
  text-align: left;
  border: 1px solid var(--settings-card-border, var(--border-muted));
  border-radius: 10px;
  background: var(--surface-subtle, var(--bg-secondary));
  cursor: pointer;
}

.provider-option:hover:not(:disabled),
.provider-option.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 35%, transparent);
}

.action-btn {
  font-size: 1.2rem;
  line-height: 1;
  padding: 4px;
}

.action-btn.delete:hover {
  border-color: var(--status-danger-border);
  color: var(--status-danger-text);
  background: var(--status-danger-bg);
}

.source-details {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-top: 2px;
}

.source-details .detail-item {
  padding: 7px 0;
  border-top: 1px solid var(--border-color);
}

.source-details .detail-item:first-child {
  border-top: 0;
}

.source-details .detail-item .label {
  min-width: 72px;
  justify-content: flex-start;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-secondary);
}

.source-details .detail-item .value {
  color: var(--text-primary);
  font-weight: 600;
}

.model-health-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  margin-left: auto;
  line-height: 0;
  color: var(--text-tertiary);
  cursor: help;
  transition: color 0.15s ease;
}

.model-health-icon.healthy {
  color: var(--status-success-text);
}

.model-health-icon.unknown {
  color: var(--status-danger-text);
}

.model-health-icon.no-data {
  color: var(--text-tertiary);
}

.model-health-icon.degraded {
  color: var(--status-warning-text);
}

.model-health-icon.unavailable {
  color: var(--status-danger-text);
}

.model-health-icon.checking {
  color: var(--text-tertiary);
  animation: model-health-pulse 1.2s ease-in-out infinite;
}

@keyframes model-health-pulse {
  0%,
  100% {
    opacity: 0.35;
  }

  50% {
    opacity: 1;
  }
}

.model-description-item {
  align-items: flex-start;
}

.model-description-item .value {
  display: -webkit-box;
  max-width: 100%;
  overflow: hidden;
  line-height: 1.4;
  white-space: normal;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.capability-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
}

.capability-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.detail-item {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 0.8rem;
}

.detail-item .label {
  padding: 1px 6px;
  background: var(--status-info-bg);
  color: var(--accent);
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  min-width: 64px;
  display: inline-flex;
  justify-content: center;
  border: 1px solid var(--status-info-border);
}

.detail-item .value {
  color: var(--text-primary);
  font-weight: 400;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 220px;
}

.empty-trigger-card {
  width: 100%;
}

.empty-icon {
  color: #c9d1dc;
  margin-bottom: 0.5rem;
}

.empty-text {
  margin: 0 0 0.5rem 0;
  color: #5f6b7a;
  font-size: 0.9rem;
  font-weight: 500;
}

.empty-action-text {
  font-size: 0.85rem;
  color: var(--accent);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}

@media (max-width: 720px) {
  .partner-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
