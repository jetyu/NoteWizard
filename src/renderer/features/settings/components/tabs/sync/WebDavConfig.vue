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
            <button v-for="preset in WEBDAV_SERVICE_PRESETS" :key="preset.id" type="button"
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
          {{ t('label.webdavUrl') }} <span class="required-mark">{{ t('label.starSign') }}</span>
        </label>
        <input class="settings-input" :value="settingsStore.config.sync.webdav.url"
          @change="handleFieldChange('url', $event)" :placeholder="t('placeholder.syncWebDavUrl')" />
      </div>

      <div class="settings-form-group">
        <label class="setting-label">{{ t('label.remotePath') }}</label>
        <input class="settings-input" :value="settingsStore.config.sync.remotePath" @change="handleRemotePathChange"
          :placeholder="t('placeholder.syncRemotePath')" />
      </div>

      <div class="settings-form-group">
        <label class="setting-label">
          {{ t('label.webdavUsername') }} <span class="required-mark">{{ t('label.starSign') }}</span>
        </label>
        <input class="settings-input" :value="settingsStore.config.sync.webdav.username"
          @change="handleFieldChange('username', $event)" :placeholder="t('placeholder.syncWebDavUsername')" />
      </div>

      <div class="settings-form-group">
        <label class="setting-label">
          {{ t('label.webdavPassword') }} <span class="required-mark">{{ t('label.starSign') }}</span>
        </label>
        <PasswordInput :value="settingsStore.config.sync.webdav.password" autocomplete="off"
          :placeholder="t('placeholder.syncWebDavPassword')" @change="handleFieldChange('password', $event)" />
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
  WEBDAV_SERVICE_PRESETS,
  applyWebDavServicePreset,
  detectWebDavServiceProvider,
  getWebDavServicePreset,
  isWebDavServiceProvider,
} from '../../../config/sync-provider';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const selectedServiceProvider = ref(detectWebDavServiceProvider(settingsStore.config.sync.webdav.url));
const selectedServicePreset = computed(() => getWebDavServicePreset(selectedServiceProvider.value));
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
  if (!isWebDavServiceProvider(value)) {
    return;
  }

  closeProviderMenu();
  const currentConfig = settingsStore.config.sync.webdav;
  const nextConfig = applyWebDavServicePreset(currentConfig, value);
  selectedServiceProvider.value = value;

  if (nextConfig.url !== currentConfig.url) {
    await settingsStore.sync.updateProvider('webdav', 'url', nextConfig.url);
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

const handleFieldChange = (field: 'url' | 'username' | 'password', event: Event) => {
  const target = event.target as HTMLInputElement;
  settingsStore.sync.updateProvider('webdav', field, target.value);
};

const handleRemotePathChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  settingsStore.sync.update('remotePath', target.value);
};
</script>
