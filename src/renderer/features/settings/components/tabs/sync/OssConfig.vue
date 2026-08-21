<template>
  <div class="settings-form-layout settings-fade-in">
    <section class="settings-form-card">
      <div class="settings-form-group">
        <label class="setting-label">{{ t('label.ossEndpoint') }}</label>
        <input class="settings-input" :value="settingsStore.config.sync.ossS3.endpoint"
          @change="handleFieldChange('endpoint', $event)" :placeholder="t('placeholder.syncOssEndpoint')" />
      </div>

      <div class="settings-form-group">
        <label class="setting-label">{{ t('label.remotePath') }}</label>
        <input class="settings-input" :value="settingsStore.config.sync.remotePath" @change="handleRemotePathChange"
          :placeholder="t('placeholder.syncRemotePath')" />
      </div>

      <div class="settings-form-group">
        <label class="setting-label">{{ t('label.ossBucket') }}</label>
        <input class="settings-input" :value="settingsStore.config.sync.ossS3.bucket"
          @change="handleFieldChange('bucket', $event)" :placeholder="t('placeholder.syncOssBucket')" />
      </div>

      <div class="settings-form-group">
        <label class="setting-label">{{ t('label.ossRegion') }}</label>
        <input class="settings-input" :value="settingsStore.config.sync.ossS3.region"
          @change="handleFieldChange('region', $event)" :placeholder="t('placeholder.syncOssRegion')" />
      </div>

      <div class="settings-form-group">
        <label class="setting-label">{{ t('label.ossAccessKey') }}</label>
        <input class="settings-input" :value="settingsStore.config.sync.ossS3.accessKeyId"
          @change="handleFieldChange('accessKeyId', $event)" :placeholder="t('placeholder.syncOssAccessKey')" />
      </div>

      <div class="settings-form-group">
        <label class="setting-label">{{ t('label.ossSecretKey') }}</label>
        <PasswordInput :value="settingsStore.config.sync.ossS3.secretAccessKey" autocomplete="off"
          :placeholder="t('placeholder.syncOssSecretKey')" @change="handleFieldChange('secretAccessKey', $event)" />
      </div>

      <div class="settings-form-actions-row">
        <slot name="actions" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '../../../store/settings.store';
import PasswordInput from '../../PasswordInput.vue';

const { t } = useI18n();
const settingsStore = useSettingsStore();

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
