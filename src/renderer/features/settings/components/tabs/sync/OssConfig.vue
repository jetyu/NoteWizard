<template>
  <div class="settings-form-layout settings-fade-in">
    <section class="settings-form-card">
      <div class="settings-form-group">
        <label class="setting-label">{{ t('label.syncServiceProvider') }}</label>
        <div ref="providerSelectRef" class="provider-select-row">
          <button ref="providerSelectButtonRef" type="button" class="provider-select-trigger"
            :aria-expanded="isProviderMenuOpen"
            :aria-label="`${t('label.syncServiceProvider')}: ${t(selectedServicePreset.labelKey)}`"
            @click="toggleProviderMenu" @keydown.esc.prevent="closeProviderMenu(true)">
            <img :src="selectedServicePreset.logoUrl" alt="" aria-hidden="true" class="provider-logo" />
            <span>{{ t(selectedServicePreset.labelKey) }}</span>
            <IconChevronDown :size="16" class="provider-select-chevron" aria-hidden="true" />
          </button>
          <div v-if="isProviderMenuOpen" class="provider-select-menu"
            @keydown.esc.prevent="closeProviderMenu(true)">
            <button v-for="preset in S3_SERVICE_PRESETS" :key="preset.id" type="button"
              class="provider-select-option" :class="{ active: selectedServiceProvider === preset.id }"
              :aria-pressed="selectedServiceProvider === preset.id" @click="handleServiceProviderSelect(preset.id)">
              <img :src="preset.logoUrl" alt="" aria-hidden="true" class="provider-logo" />
              <span :title="t(preset.labelKey)">{{ t(preset.labelKey) }}</span>
              <IconCheck v-if="selectedServiceProvider === preset.id" :size="15" class="provider-select-check"
                aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div class="settings-form-group">
        <label class="setting-label">
          {{ t('label.ossEndpoint') }} <span class="required-mark">{{ t('label.starSign') }}</span>
        </label>
        <input class="settings-input" :value="settingsStore.config.sync.ossS3.endpoint"
          @change="handleFieldChange('endpoint', $event)" :placeholder="t('placeholder.syncOssEndpoint')" />
      </div>

      <div class="settings-form-group">
        <label class="setting-label">{{ t('label.remotePath') }}</label>
        <input class="settings-input" :value="settingsStore.config.sync.remotePath" @change="handleRemotePathChange"
          :placeholder="t('placeholder.syncRemotePath')" />
      </div>

      <div class="settings-form-group">
        <label class="setting-label">
          {{ t('label.ossBucket') }} <span class="required-mark">{{ t('label.starSign') }}</span>
        </label>
        <input class="settings-input" :value="settingsStore.config.sync.ossS3.bucket"
          @change="handleFieldChange('bucket', $event)" :placeholder="t('placeholder.syncOssBucket')" />
      </div>

      <div class="settings-form-group">
        <label class="setting-label">
          {{ t('label.ossRegion') }} <span class="required-mark">{{ t('label.starSign') }}</span>
        </label>
        <input class="settings-input" :value="settingsStore.config.sync.ossS3.region"
          @change="handleFieldChange('region', $event)" :placeholder="t('placeholder.syncOssRegion')" />
      </div>

      <div class="settings-form-group">
        <label class="setting-label">
          {{ t('label.ossAccessKey') }} <span class="required-mark">{{ t('label.starSign') }}</span>
        </label>
        <input class="settings-input" :value="settingsStore.config.sync.ossS3.accessKeyId"
          @change="handleFieldChange('accessKeyId', $event)" :placeholder="t('placeholder.syncOssAccessKey')" />
      </div>

      <div class="settings-form-group">
        <label class="setting-label">
          {{ t('label.ossSecretKey') }} <span class="required-mark">{{ t('label.starSign') }}</span>
        </label>
        <PasswordInput :value="settingsStore.config.sync.ossS3.secretAccessKey" autocomplete="off"
          :placeholder="t('placeholder.syncOssSecretKey')" @change="handleFieldChange('secretAccessKey', $event)" />
      </div>

      <div class="settings-form-actions-row">
        <a v-if="selectedServicePreset.guideUrl" class="sync-provider-guide-link"
          :href="selectedServicePreset.guideUrl" target="_blank" rel="noopener noreferrer nofollow">
          {{ t('text.syncProviderOfficialGuide') }}
          <IconExternalLink :size="14" aria-hidden="true" />
        </a>
        <slot name="actions" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { IconCheck, IconChevronDown, IconExternalLink } from '@tabler/icons-vue';
import { useSettingsStore } from '../../../store/settings.store';
import PasswordInput from '../../PasswordInput.vue';
import {
  S3_SERVICE_PRESETS,
  applyS3ServicePreset,
  detectS3ServiceProvider,
  getS3ServicePreset,
  isS3ServiceProvider,
} from '../../../config/sync-provider';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const selectedServiceProvider = ref(detectS3ServiceProvider(settingsStore.config.sync.ossS3.endpoint));
const selectedServicePreset = computed(() => getS3ServicePreset(selectedServiceProvider.value));
const isProviderMenuOpen = ref(false);
const providerSelectRef = ref<HTMLElement | null>(null);
const providerSelectButtonRef = ref<HTMLButtonElement | null>(null);

function closeProviderMenu(restoreFocus = false): void {
  isProviderMenuOpen.value = false;
  if (restoreFocus) {
    providerSelectButtonRef.value?.focus();
  }
}

function toggleProviderMenu(): void {
  isProviderMenuOpen.value = !isProviderMenuOpen.value;
}

async function handleServiceProviderSelect(value: string): Promise<void> {
  if (!isS3ServiceProvider(value)) {
    return;
  }

  closeProviderMenu();
  const currentConfig = settingsStore.config.sync.ossS3;
  const nextConfig = applyS3ServicePreset(currentConfig, value);
  selectedServiceProvider.value = value;

  if (nextConfig.endpoint !== currentConfig.endpoint) {
    await settingsStore.sync.updateProvider('ossS3', 'endpoint', nextConfig.endpoint);
  }
  if (nextConfig.region !== currentConfig.region) {
    await settingsStore.sync.updateProvider('ossS3', 'region', nextConfig.region);
  }
  if (nextConfig.forcePathStyle !== currentConfig.forcePathStyle) {
    await settingsStore.sync.updateProvider('ossS3', 'forcePathStyle', nextConfig.forcePathStyle);
  }
}

function handleDocumentClick(event: MouseEvent): void {
  const target = event.target;
  if (target instanceof Node && !providerSelectRef.value?.contains(target)) {
    closeProviderMenu();
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
});

const handleFieldChange = (
  field: 'endpoint' | 'region' | 'bucket' | 'accessKeyId' | 'secretAccessKey',
  event: Event
) => {
  const target = event.target as HTMLInputElement;
  settingsStore.sync.updateProvider('ossS3', field, target.value);
};

const handleRemotePathChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  settingsStore.sync.update('remotePath', target.value);
};
</script>
