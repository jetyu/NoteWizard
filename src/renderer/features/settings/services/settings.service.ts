import {
  electronApi,
  type JsonObject,
  type MarkdownExportResult,
  type MarkdownImportResult,
  type MessageDialogOptions,
  type KnowledgeCopilotRebuildMode,
  type DiagnosticLogExportResult,
  type SppxExportResult,
  type SppxImportResult,
} from '@renderer/core/bridge/electronApi';
import { switchLanguage } from '@renderer/features/i18n';
import {
  inferAiProvider,
  type AiProvider,
} from '@shared/ai-provider.constants';
import type { AppSettings } from '../store/settings.store';

type SettingsChangeReason = 'save' | 'language' | 'import' | 'reset';

export interface AiConnectionPayload {
  provider: AiProvider;
  aiBaseUrl: string;
  aiApiKey: string;
  aiModel: string;
  capabilities: string[];
}

function cloneConfig(config: AppSettings): JsonObject {
  return JSON.parse(JSON.stringify(config)) as JsonObject;
}

function dispatchSettingsChanged(reason: SettingsChangeReason) {
  window.dispatchEvent(new CustomEvent('settings-changed', { detail: { reason } }));
}

function buildAiConnectionPayload(config: AppSettings, override?: AiConnectionPayload): AiConnectionPayload {
  if (override) {
    return override;
  }

  const selectedSource = config.aiSources.sources.find((source) => source.id === config.aiAssistant.sourceId);
  return {
    provider: selectedSource?.provider ?? inferAiProvider(selectedSource?.baseUrl ?? ''),
    aiBaseUrl: selectedSource?.baseUrl ?? '',
    aiApiKey: selectedSource?.apiKey ?? '',
    aiModel: config.aiAssistant.model,
    capabilities: selectedSource?.capabilities ?? ['chat'],
  };
}

function normalizeDirectory(path: string | null): string | null {
  const normalized = path?.trim();
  return normalized ? normalized : null;
}

async function loadConfigFromMain(): Promise<AppSettings> {
  const config = await electronApi.settings.getConfig() as unknown as AppSettings;
  config.general.language = await switchLanguage(config.general.language);
  return config;
}

export const settingsService = {
  onOpenPreferences(callback: () => void): () => void {
    return electronApi.menu.onOpenPreferences(() => {
      callback();
    });
  },

  async loadConfig(): Promise<AppSettings> {
    return await loadConfigFromMain();
  },

  async saveConfig(config: AppSettings): Promise<AppSettings> {
    const savedConfig = await electronApi.settings.saveConfig(cloneConfig(config)) as unknown as AppSettings;
    dispatchSettingsChanged('save');
    return savedConfig;
  },

  async changeLanguage(language: string): Promise<string> {
    const nextLanguage = await switchLanguage(language);
    await electronApi.settings.switchLanguage(nextLanguage);
    dispatchSettingsChanged('language');
    return nextLanguage;
  },

  async setStartup(enabled: boolean): Promise<{ enabled: boolean; supported: boolean }> {
    const result = await electronApi.settings.setStartup(enabled);
    return {
      enabled: Boolean(result.enabled),
      supported: Boolean(result.supported),
    };
  },

  async testConnection(config: AppSettings, override?: AiConnectionPayload): Promise<{ success: boolean; message?: string }> {
    return await electronApi.aiSource.testConnection(buildAiConnectionPayload(config, override));
  },

  async openLogDir(): Promise<boolean | undefined> {
    return await electronApi.logger.openDir();
  },

  async exportDiagnosticLogs(): Promise<DiagnosticLogExportResult> {
    return await electronApi.logger.exportDiagnostics();
  },

  async pickDirectory(): Promise<string | null> {
    return normalizeDirectory(await electronApi.settings.pickDirectory());
  },

  async confirmEmbeddingSourceChange(currentSourceId: string, nextSourceId: string): Promise<boolean> {
    if (!nextSourceId || currentSourceId === nextSourceId) {
      return true;
    }

    return await electronApi.settings.confirmEmbeddingSourceChange();
  },

  async confirmKnowledgeCopilotRebuildMode(): Promise<KnowledgeCopilotRebuildMode> {
    return await electronApi.settings.confirmKnowledgeCopilotRebuildMode();
  },

  async confirmKnowledgeCopilotChunkRebuild(): Promise<boolean> {
    return await electronApi.settings.confirmKnowledgeCopilotChunkRebuild();
  },

  async confirmDeleteAiSource(name: string): Promise<boolean> {
    return await electronApi.settings.confirmDeleteAiSource(name);
  },

  async confirmResetSyncProvider(name: string): Promise<boolean> {
    return await electronApi.settings.confirmResetSyncProvider(name);
  },

  async exportConfig(): Promise<boolean> {
    return await electronApi.settings.exportConfig();
  },

  async importConfig(): Promise<AppSettings | null> {
    const imported = await electronApi.settings.importConfig();
    if (!imported) {
      return null;
    }

    const config = await loadConfigFromMain();
    dispatchSettingsChanged('import');
    return config;
  },

  async resetConfig(): Promise<AppSettings | null> {
    const reset = await electronApi.settings.resetConfig();
    if (!reset) {
      return null;
    }

    const config = await loadConfigFromMain();
    dispatchSettingsChanged('reset');
    return config;
  },

  async showMessageDialog(options: MessageDialogOptions): Promise<boolean> {
    return await electronApi.settings.showMessage(options);
  },

  async exportSppxPackage(): Promise<SppxExportResult> {
    return await electronApi.dataTransfer.exportSppx();
  },

  async importSppxPackage(): Promise<SppxImportResult> {
    return await electronApi.dataTransfer.importSppx();
  },

  async exportMarkdownBatch(): Promise<MarkdownExportResult> {
    return await electronApi.dataTransfer.exportMarkdown();
  },

  async importMarkdownBatch(): Promise<MarkdownImportResult> {
    return await electronApi.dataTransfer.importMarkdown();
  },
};
