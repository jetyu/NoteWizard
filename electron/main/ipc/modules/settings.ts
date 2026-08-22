import { ipcMain, app } from 'electron';
import { z } from 'zod';
import { settingsService } from '../../services/settings.service.js';
import { loggerService } from '../../services/log/logger.service.js';
import { IPC_CHANNELS } from '../../constants/ipc.constants.js';

const logger = loggerService.createLogger('Electron:Settings IPC');
const SettingsSaveSchema = z.record(z.string(), z.unknown());

export function parseSettingsSavePayload(value: unknown): Record<string, unknown> {
  return SettingsSaveSchema.parse(value);
}

export function registerSettingsIpcHandlers() {
  /**
   * Handle loading the configuration
   */
  ipcMain.handle(IPC_CHANNELS.SETTINGS_LOAD, async () => {
    const config = await settingsService.loadConfig();
    loggerService.updateConfig(config.privacyLog);
    logger.debug('Settings loaded');
    return config;
  });

  /**
   * Handle saving the configuration
   */
  ipcMain.handle(IPC_CHANNELS.SETTINGS_SAVE, async (_event, config) => {
    const settings = await settingsService.saveConfig(parseSettingsSavePayload(config));
    loggerService.updateConfig(settings.privacyLog);
    logger.debug('Settings saved and updated');
    return settings;
  });

  /**
   * Handle setting the auto-launch state
   */
  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET_STARTUP, async (_event, enabled) => {
    logger.debug('Settings set startup');
    return await settingsService.setAutoLaunch(enabled);
  });

  /**
   * Handle picking a directory
   */
  ipcMain.handle(IPC_CHANNELS.SETTINGS_PICK_DIRECTORY, async () => {
    logger.debug('Settings pick directory');
    return await settingsService.pickDirectory();
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_PICK_BACKUP_DIRECTORY, async () => {
    logger.debug('Settings pick scheduled backup directory');
    return await settingsService.pickBackupDirectory();
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_OPEN_BACKUP_DIRECTORY, async () => {
    logger.debug('Settings open scheduled backup directory');
    return await settingsService.openBackupDirectory();
  });

  /**
   * Confirm embedding source change using the native Electron dialog
   */
  ipcMain.handle(IPC_CHANNELS.SETTINGS_CONFIRM_EMBEDDING_SOURCE_CHANGE, async () => {
    logger.debug('Settings confirm embedding source change');
    return await settingsService.confirmEmbeddingSourceChange();
  });

  /**
   * Confirm knowledge-copilot rebuild mode using the native Electron dialog
   */
  ipcMain.handle(IPC_CHANNELS.SETTINGS_CONFIRM_KNOWLEDGE_COPILOT_REBUILD_MODE, async () => {
    logger.debug('Settings confirm knowledge-copilot rebuild mode');
    return await settingsService.confirmKnowledgeCopilotRebuildMode();
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_CONFIRM_KNOWLEDGE_COPILOT_CHUNK_REBUILD, async () => {
    logger.debug('Settings confirm knowledge-copilot chunk rebuild');
    return await settingsService.confirmKnowledgeCopilotChunkRebuild();
  });

  /**
   * Confirm AI source deletion using the native Electron dialog
   */
  ipcMain.handle(IPC_CHANNELS.SETTINGS_CONFIRM_DELETE_AI_SOURCE, async (_event, name) => {
    logger.debug('Settings confirm AI source deletion');
    return await settingsService.confirmDeleteAiSource(name);
  });

  /**
   * Confirm sync provider reset using the native Electron dialog
   */
  ipcMain.handle(IPC_CHANNELS.SETTINGS_CONFIRM_RESET_SYNC_PROVIDER, async (_event, name) => {
    logger.debug('Settings confirm sync provider reset');
    return await settingsService.confirmResetSyncProvider(name);
  });

  /**
   * Show a native Electron message dialog
   */
  ipcMain.handle(IPC_CHANNELS.SETTINGS_SHOW_MESSAGE, async (_event, options) => {
    logger.debug('Settings show message dialog');
    return await settingsService.showMessage(options);
  });

  /**
   * Handle exporting settings
   */
  ipcMain.handle(IPC_CHANNELS.SETTINGS_EXPORT, async () => {
    logger.debug('Settings export');
    return await settingsService.exportConfig();
  });

  /**
   * Handle importing settings
   */
  ipcMain.handle(IPC_CHANNELS.SETTINGS_IMPORT, async () => {
    logger.debug('Settings import');
    const result = await settingsService.importConfig();
    if (result) {
      app.relaunch();
      app.exit(0);
    }
    return result;
  });

  /**
   * Handle resetting settings to defaults
   */
  ipcMain.handle(IPC_CHANNELS.SETTINGS_RESET, async () => {
    logger.debug('Settings reset');
    const result = await settingsService.resetConfig();
    if (result) {
      app.relaunch();
      app.exit(0);
    }
    return result;
  });
}
