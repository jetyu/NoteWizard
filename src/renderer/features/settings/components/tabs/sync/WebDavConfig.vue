<template>
  <div class="settings-form-layout settings-fade-in">
    <section class="settings-form-card">
      <div class="settings-form-group">
        <label class="setting-label">{{ t('label.webdavUrl') }}</label>
        <input class="settings-input" :value="settingsStore.config.sync.webdav.url"
          @change="handleFieldChange('url', $event)" placeholder="https://example.com/dav" />
      </div>

      <div class="settings-form-group">
        <label class="setting-label">{{ t('label.remotePath') }}</label>
        <input class="settings-input" :value="settingsStore.config.sync.remotePath" @change="handleRemotePathChange"
          placeholder="/Snaptium" />
      </div>

      <div class="settings-form-group">
        <label class="setting-label">{{ t('label.webdavUsername') }}</label>
        <input class="settings-input" :value="settingsStore.config.sync.webdav.username"
          @change="handleFieldChange('username', $event)" />
      </div>

      <div class="settings-form-group">
        <label class="setting-label">{{ t('label.webdavPassword') }}</label>
        <PasswordInput :value="settingsStore.config.sync.webdav.password" autocomplete="off"
          @change="handleFieldChange('password', $event)" />
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

const handleFieldChange = (field: 'url' | 'username' | 'password', event: Event) => {
  const target = event.target as HTMLInputElement;
  settingsStore.sync.updateProvider('webdav', field, target.value);
};

const handleRemotePathChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  settingsStore.sync.update('remotePath', target.value);
};
</script>
