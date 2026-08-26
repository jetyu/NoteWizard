import { storeToRefs } from 'pinia';
import { useUpdaterStore } from '../store/updater.store';

export function useUpdater() {
  const updaterStore = useUpdaterStore();
  const state = storeToRefs(updaterStore);

  return {
    ...state,
    checkForUpdates: updaterStore.checkForUpdates,
    checkForUpdatesWithDialog: updaterStore.checkForUpdatesWithDialog,
    closeUpdateDialog: updaterStore.closeUpdateDialog,
    downloadUpdate: updaterStore.downloadUpdate,
    cancelDownload: updaterStore.cancelDownload,
    installUpdate: updaterStore.installUpdate,
    getCurrentVersion: updaterStore.getCurrentVersion,
    updateConfig: updaterStore.updateConfig,
    clearDiscoveredUpdate: updaterStore.clearDiscoveredUpdate,
    initialize: updaterStore.initialize,
    dispose: updaterStore.dispose,
  };
}
