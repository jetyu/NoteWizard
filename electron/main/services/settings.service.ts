import { app, dialog, BrowserWindow } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { $t } from '../utils/i18n.js';
import {
  AI_WRITING_DEFAULTS,
  isValidAiWritingMode,
  isValidAiWritingScenario,
  isValidAiWritingStyle,
  type AiWritingMode,
  type AiWritingScenario,
  type AiWritingStyle,
} from '../../shared/ai.constants.js';
import {
  getAiProviderCapabilities,
  inferAiProvider,
  isAiProvider,
  resolveAiSourceModel,
  type AiCapability,
  type AiCapabilityModelMap,
  type AiProvider,
} from '../../shared/ai-provider.constants.js';
import { isBuiltInAiSourceId } from '../../shared/built-in-ai.constants.js';
import { normalizeKnowledgeCopilotRebuildConcurrency } from '../../shared/knowledge-copilot.constants.js';
import { normalizeTrustedRemoteImageHosts } from '../../shared/preview-security.constants.js';
import { DEFAULT_SYNC_SETTINGS, SYNC_INTERVALS, SYNC_PROVIDERS } from '../../shared/sync.constants.js';
import { normalizeUpdateChannel, type UpdateChannel } from '../../shared/updater.constants.js';
import { getErrorCode, getErrorMessage } from '../../shared/utils/error.utils.js';
import {
  ACCESS_CONTROL_TIMEOUT_OPTIONS,
  type AccessControlTimeout,
} from '../../shared/e2ee.constants.js';
import { VFS_CONSTANTS } from '../constants/vfs.constants.js';
import { UPDATER_CONSTANTS } from '../constants/updater.constants.js';
import { loggerService } from './log/logger.service.js';
import { previewPolicyService } from './preview-policy.service.js';
import { keyManagerService } from './key-manager.service.js';
import { builtInAiService } from './built-in-ai.service.js';
import type { KeySlots } from './crypto.service.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type RemoteImageMode = 'blocked' | 'trusted' | 'all';
type WindowCloseAction = 'minimize' | 'exit';
type AccentMode = 'black' | 'azureBlue' | 'indigo' | 'cyan' | 'teal';

export interface GeneralConfig {
  language: string;
  autoStartup: boolean;
  windowCloseAction: WindowCloseAction;
  themeMode: 'system' | 'light' | 'dark';
  accentMode: AccentMode;
  appUIFont: string;
}

export interface PreviewConfig {
  allowHtml: boolean;
  allowInlineSvg: boolean;
  remoteImageMode: RemoteImageMode;
  trustedRemoteImageHosts: string[];
  fontSize: number;
  fontFamily: string;
}

export interface EditorConfig {
  fontSize: number;
  fontFamily: string;
  showLineNumbers: boolean;
  wordWrap: boolean;
  codeFolding: boolean;
  highlightActiveLine: boolean;
  bracketMatching: boolean;
  autoCloseBrackets: boolean;
  autoIndent: boolean;
  showStatusBar: boolean;
}

export interface AiSourceConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  aiModel: string;
  capabilityModels?: AiCapabilityModelMap;
  capabilities: string[];
  provider: AiProvider;
}

export interface AiSourcesConfig {
  sources: AiSourceConfig[];
}

export interface AiAssistantConfig {
  enabled: boolean;
  sourceId: string;
  model: string;
  triggerMode: AiWritingMode;
  autoContinue: boolean;
  writingStyle: AiWritingStyle;
  writingScenario: AiWritingScenario;
  systemPrompt: string;
}

export interface KnowledgeCopilotConfig {
  enabled: boolean;
  embeddingSourceId: string;
  embeddingModel: string;
  askChatSourceId: string;
  askChatModel: string;
  agentChatSourceId: string;
  agentChatModel: string;
  rerankerSourceId: string;
  rerankerModel: string;
  defaultMode: 'ask' | 'agent';
  agentExecutionMode: 'confirm' | 'auto';
  chunkSize: number;
  chunkOverlap: number;
  rebuildConcurrency: number;
  topK: number;
  similarityThreshold: number;
  autoIndex: boolean;
  indexOnSave: boolean;
  lastIndexedAt: number | null;
  lastRebuildDurationMs: number | null;
  indexSignatures: Record<string, string>;
  indexChunkCounts: Record<string, number>;
  cachedTotalChunks: number;
}

interface SyncWebDavConfig {
  url: string;
  username: string;
  password: string;
}

interface SyncOssS3Config {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
}

export interface SyncConfig {
  enabled: boolean;
  provider: (typeof SYNC_PROVIDERS)[keyof typeof SYNC_PROVIDERS];
  intervalMinutes: number;
  autoSyncOnSave: boolean;
  remotePath: string;
  webdav: SyncWebDavConfig;
  ossS3: SyncOssS3Config;
  lastSyncedAt: number | null;
}

export interface NoteStorageConfig {
  path: string;
  maxHistoryVersions: number;
  trashAutoClearDays: number;
  snapshotInterval: number;
}

export interface PrivacyLogConfig {
  enabled: boolean;
  level: LogLevel;
  autoClearDays: number;
}

export interface SoftwareUpdateConfig {
  autoCheck: boolean;
  checkInterval: number;
  channel: UpdateChannel;
}

export interface AppShellConfig {
  activeMainView: string;
  customSidebarModules: string[];
  maxCustomSidebarModules: number;
}

export interface WorkbenchConfig {
  recentQuestions: unknown[];
  conversationThreads: unknown[];
  recommendationFeedback: unknown[];
  onboardingGuideActivated: boolean;
  onboardingGuideDismissed: boolean;
  agentWriteMode: 'confirm' | 'auto';
}

export interface AccessControlConfig {
  enabled: boolean;
  lockOnStartup: boolean;
  autoLockTimeoutMinutes: AccessControlTimeout;
}

export interface AppSettings {
  general: GeneralConfig;
  preview: PreviewConfig;
  editor: EditorConfig;
  aiSources: AiSourcesConfig;
  aiAssistant: AiAssistantConfig;
  knowledgeCopilot: KnowledgeCopilotConfig;
  sync: SyncConfig;
  noteStorage: NoteStorageConfig;
  privacyLog: PrivacyLogConfig;
  softwareUpdate: SoftwareUpdateConfig;
  appShell: AppShellConfig;
  workbench: WorkbenchConfig;
  accessControl: AccessControlConfig;
}

const LOG_AUTO_CLEAR_DAY_OPTIONS: ReadonlySet<number> = new Set<number>([0, 10, 20]);
const DEFAULT_WINDOW_CLOSE_ACTION: WindowCloseAction = 'minimize';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOwnSetting(config: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(config, key);
}

export function toSettingsRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeString(value: unknown, fallback: string = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  const numericValue = Number(value);
  const finiteValue = Number.isFinite(numericValue) ? numericValue : fallback;
  return Math.min(max, Math.max(min, finiteValue));
}

function clampInteger(value: unknown, fallback: number, min: number, max: number): number {
  return Math.trunc(clampNumber(value, fallback, min, max));
}

function normalizeAllowedInteger(value: unknown, values: readonly number[], fallback: number): number {
  const normalizedValue = Math.trunc(Number(value));
  return Number.isFinite(normalizedValue) && values.includes(normalizedValue)
    ? normalizedValue
    : fallback;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim());
}

function normalizeStringRecord(value: unknown): Record<string, string> {
  return Object.fromEntries(
    Object.entries(toSettingsRecord(value))
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  );
}

function normalizeNumberRecord(value: unknown): Record<string, number> {
  return Object.fromEntries(
    Object.entries(toSettingsRecord(value))
      .filter((entry): entry is [string, number] => {
        return typeof entry[1] === 'number' && Number.isFinite(entry[1]);
      }),
  );
}

export function normalizeGeneralConfig(value: unknown, defaultLanguage: string): GeneralConfig {
  const config = toSettingsRecord(value);

  return {
    language: normalizeString(config.language, defaultLanguage).trim() || defaultLanguage,
    autoStartup: normalizeBoolean(config.autoStartup, false),
    windowCloseAction: config.windowCloseAction === 'exit' ? 'exit' : DEFAULT_WINDOW_CLOSE_ACTION,
    themeMode: config.themeMode === 'light' || config.themeMode === 'dark' ? config.themeMode : 'system',
    accentMode: config.accentMode === 'black'
      || config.accentMode === 'azureBlue'
      || config.accentMode === 'indigo'
      || config.accentMode === 'cyan'
      || config.accentMode === 'teal'
      ? config.accentMode
      : 'azureBlue',
    appUIFont: normalizeString(config.appUIFont),
  };
}

export function normalizePreviewConfig(value: unknown): PreviewConfig {
  const config = toSettingsRecord(value);
  const remoteImageMode = config.remoteImageMode === 'blocked' ? 'blocked'
    : config.remoteImageMode === 'all' ? 'all' : 'trusted';

  return {
    allowHtml: normalizeBoolean(config.allowHtml, true),
    allowInlineSvg: normalizeBoolean(config.allowInlineSvg, true),
    remoteImageMode,
    trustedRemoteImageHosts: normalizeTrustedRemoteImageHosts(config.trustedRemoteImageHosts),
    fontSize: clampInteger(config.fontSize, 16, 10, 32),
    fontFamily: normalizeString(config.fontFamily),
  };
}

export function normalizeEditorConfig(value: unknown): EditorConfig {
  const config = toSettingsRecord(value);

  return {
    fontSize: clampInteger(config.fontSize, 14, 10, 32),
    fontFamily: normalizeString(config.fontFamily),
    showLineNumbers: normalizeBoolean(config.showLineNumbers, true),
    wordWrap: normalizeBoolean(config.wordWrap, true),
    codeFolding: normalizeBoolean(config.codeFolding, false),
    highlightActiveLine: normalizeBoolean(config.highlightActiveLine, true),
    bracketMatching: normalizeBoolean(config.bracketMatching, true),
    autoCloseBrackets: normalizeBoolean(config.autoCloseBrackets, true),
    autoIndent: normalizeBoolean(config.autoIndent, true),
    showStatusBar: normalizeBoolean(config.showStatusBar, true),
  };
}

function normalizeAiSource(value: unknown): AiSourceConfig | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = normalizeString(value.id).trim();
  if (!id || isBuiltInAiSourceId(id)) {
    return null;
  }

  const baseUrl = normalizeString(value.baseUrl).trim();
  const provider = isAiProvider(value.provider) ? value.provider : inferAiProvider(baseUrl);
  const capabilities = normalizeStringArray(value.capabilities);

  return {
    id,
    name: normalizeString(value.name).trim(),
    baseUrl,
    apiKey: normalizeString(value.apiKey),
    aiModel: normalizeString(value.aiModel).trim(),
    capabilities: capabilities.length > 0 ? capabilities : getAiProviderCapabilities(provider),
    provider,
  };
}

export function normalizeAiSourcesConfig(value: unknown): AiSourcesConfig {
  const config = toSettingsRecord(value);
  const sources = Array.isArray(config.sources)
    ? config.sources
      .map((source) => normalizeAiSource(source))
      .filter((source): source is AiSourceConfig => source !== null)
    : [];

  return { sources };
}

function normalizeAiSourceSelection(
  sourceId: string,
  model: string,
  aiSources: AiSourceConfig[],
  capability: AiCapability,
  fallbackToFirstAvailable = false,
): { sourceId: string; model: string } {
  const source = aiSources.find(item => item.id === sourceId);
  const isUsable = source && (source.capabilities.length === 0 || source.capabilities.includes(capability));
  if (isUsable) {
    return { sourceId, model: model || resolveAiSourceModel(source, capability) };
  }

  if (fallbackToFirstAvailable) {
    const fallbackSource = aiSources.find(item => (
      item.capabilities.length === 0 || item.capabilities.includes(capability)
    ));
    if (fallbackSource) {
      return {
        sourceId: fallbackSource.id,
        model: resolveAiSourceModel(fallbackSource, capability),
      };
    }
  }

  return { sourceId: '', model: '' };
}

export function normalizeAiAssistantConfig(
  value: unknown,
  aiSources: AiSourceConfig[],
): AiAssistantConfig {
  const config = toSettingsRecord(value);
  const sourceSelection = normalizeAiSourceSelection(
    normalizeString(config.sourceId).trim(),
    normalizeString(config.model).trim(),
    aiSources,
    'chat',
    !hasOwnSetting(config, 'sourceId'),
  );

  return {
    enabled: normalizeBoolean(config.enabled, false),
    ...sourceSelection,
    triggerMode: isValidAiWritingMode(config.triggerMode)
      ? config.triggerMode
      : AI_WRITING_DEFAULTS.MODE,
    autoContinue: normalizeBoolean(config.autoContinue, AI_WRITING_DEFAULTS.AUTO_CONTINUE),
    writingStyle: isValidAiWritingStyle(config.writingStyle)
      ? config.writingStyle
      : AI_WRITING_DEFAULTS.STYLE,
    writingScenario: isValidAiWritingScenario(config.writingScenario)
      ? config.writingScenario
      : AI_WRITING_DEFAULTS.SCENARIO,
    systemPrompt: normalizeString(config.systemPrompt),
  };
}

export function normalizeKnowledgeCopilotConfig(
  value: unknown,
  aiSources: AiSourceConfig[],
): KnowledgeCopilotConfig {
  const config = toSettingsRecord(value);
  const embeddingSelection = normalizeAiSourceSelection(
    normalizeString(config.embeddingSourceId).trim(),
    normalizeString(config.embeddingModel).trim(),
    aiSources,
    'embedding',
    !hasOwnSetting(config, 'embeddingSourceId'),
  );
  const askChatSelection = normalizeAiSourceSelection(
    normalizeString(config.askChatSourceId).trim(),
    normalizeString(config.askChatModel).trim(),
    aiSources,
    'chat',
    !hasOwnSetting(config, 'askChatSourceId'),
  );
  const agentChatSelection = normalizeAiSourceSelection(
    normalizeString(config.agentChatSourceId).trim(),
    normalizeString(config.agentChatModel).trim(),
    aiSources,
    'chat',
    !hasOwnSetting(config, 'agentChatSourceId'),
  );
  const rerankerSelection = normalizeAiSourceSelection(
    normalizeString(config.rerankerSourceId).trim(),
    normalizeString(config.rerankerModel).trim(),
    aiSources,
    'reranker',
    !hasOwnSetting(config, 'rerankerSourceId'),
  );
  const embeddingSource = aiSources.find(source => source.id === embeddingSelection.sourceId);

  return {
    enabled: normalizeBoolean(config.enabled, false),
    embeddingSourceId: embeddingSelection.sourceId,
    embeddingModel: embeddingSelection.model,
    askChatSourceId: askChatSelection.sourceId,
    askChatModel: askChatSelection.model,
    agentChatSourceId: agentChatSelection.sourceId,
    agentChatModel: agentChatSelection.model,
    rerankerSourceId: rerankerSelection.sourceId,
    rerankerModel: rerankerSelection.model,
    defaultMode: config.defaultMode === 'agent' ? 'agent' : 'ask',
    agentExecutionMode: config.agentExecutionMode === 'auto' ? 'auto' : 'confirm',
    chunkSize: clampInteger(config.chunkSize, 500, 500, 800),
    chunkOverlap: clampInteger(config.chunkOverlap, 50, 50, 100),
    rebuildConcurrency: normalizeKnowledgeCopilotRebuildConcurrency(
      config.rebuildConcurrency,
      embeddingSource?.provider,
    ),
    topK: clampInteger(config.topK, 5, 1, 10),
    similarityThreshold: clampNumber(config.similarityThreshold, 0.45, 0, 1),
    autoIndex: normalizeBoolean(config.autoIndex, true),
    indexOnSave: normalizeBoolean(config.indexOnSave, true),
    lastIndexedAt: typeof config.lastIndexedAt === 'number' && Number.isFinite(config.lastIndexedAt)
      ? config.lastIndexedAt
      : null,
    lastRebuildDurationMs: typeof config.lastRebuildDurationMs === 'number'
      && Number.isFinite(config.lastRebuildDurationMs)
      ? Math.max(0, Math.trunc(config.lastRebuildDurationMs))
      : null,
    indexSignatures: normalizeStringRecord(config.indexSignatures),
    indexChunkCounts: normalizeNumberRecord(config.indexChunkCounts),
    cachedTotalChunks: Math.max(0, clampInteger(config.cachedTotalChunks, 0, 0, Number.MAX_SAFE_INTEGER)),
  };
}

export function normalizeSyncConfig(value: unknown): SyncConfig {
  const config = toSettingsRecord(value);
  const webdav = toSettingsRecord(config.webdav);
  const ossS3 = toSettingsRecord(config.ossS3);
  const supportedIntervals: ReadonlySet<number> = new Set<number>(Object.values(SYNC_INTERVALS));
  const intervalMinutes = Number(config.intervalMinutes);

  return {
    enabled: normalizeBoolean(config.enabled, DEFAULT_SYNC_SETTINGS.enabled),
    provider: config.provider === SYNC_PROVIDERS.OSS_S3 ? SYNC_PROVIDERS.OSS_S3 : SYNC_PROVIDERS.WEBDAV,
    intervalMinutes: supportedIntervals.has(intervalMinutes) ? intervalMinutes : SYNC_INTERVALS.MANUAL,
    autoSyncOnSave: normalizeBoolean(config.autoSyncOnSave, DEFAULT_SYNC_SETTINGS.autoSyncOnSave),
    remotePath: normalizeString(config.remotePath, DEFAULT_SYNC_SETTINGS.remotePath).trim()
      || DEFAULT_SYNC_SETTINGS.remotePath,
    webdav: {
      url: normalizeString(webdav.url).trim(),
      username: normalizeString(webdav.username).trim(),
      password: normalizeString(webdav.password),
    },
    ossS3: {
      endpoint: normalizeString(ossS3.endpoint).trim(),
      region: normalizeString(ossS3.region).trim(),
      bucket: normalizeString(ossS3.bucket).trim(),
      accessKeyId: normalizeString(ossS3.accessKeyId).trim(),
      secretAccessKey: normalizeString(ossS3.secretAccessKey),
      forcePathStyle: normalizeBoolean(ossS3.forcePathStyle, DEFAULT_SYNC_SETTINGS.ossS3.forcePathStyle),
    },
    lastSyncedAt: typeof config.lastSyncedAt === 'number' && Number.isFinite(config.lastSyncedAt)
      ? config.lastSyncedAt
      : null,
  };
}

export function normalizeNoteStorageConfig(
  value: unknown,
  defaultPath: string,
): NoteStorageConfig {
  const config = toSettingsRecord(value);

  return {
    path: normalizeString(config.path, defaultPath).trim() || defaultPath,
    maxHistoryVersions: normalizeAllowedInteger(config.maxHistoryVersions, [0, 10, 20, 50, 100], 50),
    trashAutoClearDays: normalizeAllowedInteger(config.trashAutoClearDays, [0, 7, 30], 30),
    snapshotInterval: normalizeAllowedInteger(config.snapshotInterval, [15, 30, 60], 15),
  };
}

export function normalizePrivacyLogConfig(value: unknown): PrivacyLogConfig {
  const config = toSettingsRecord(value);
  const normalizedLevel = normalizeString(config.level).toLowerCase();
  const level: LogLevel = normalizedLevel === 'debug'
    || normalizedLevel === 'info'
    || normalizedLevel === 'warn'
    || normalizedLevel === 'error'
    ? normalizedLevel
    : 'error';
  const autoClearDays = Number(config.autoClearDays);

  return {
    enabled: normalizeBoolean(config.enabled, false),
    level,
    autoClearDays: Number.isFinite(autoClearDays) && LOG_AUTO_CLEAR_DAY_OPTIONS.has(autoClearDays)
      ? autoClearDays
      : 10,
  };
}

export function normalizeSoftwareUpdateConfig(value: unknown): SoftwareUpdateConfig {
  const config = toSettingsRecord(value);
  const checkInterval = Math.trunc(Number(config.checkInterval));

  return {
    autoCheck: normalizeBoolean(config.autoCheck, true),
    checkInterval: Number.isFinite(checkInterval) && checkInterval >= 60 * 60 * 1000
      ? checkInterval
      : UPDATER_CONSTANTS.DEFAULT_CHECK_INTERVAL,
    channel: normalizeUpdateChannel(config.channel),
  };
}

export function normalizeAppShellConfig(value: unknown): AppShellConfig {
  const config = toSettingsRecord(value);
  const customSidebarModules = Array.isArray(config.customSidebarModules)
    ? normalizeStringArray(config.customSidebarModules)
    : ['search', 'settings', 'trash'];

  return {
    activeMainView: normalizeString(config.activeMainView, 'workbench').trim() || 'workbench',
    customSidebarModules,
    maxCustomSidebarModules: clampInteger(config.maxCustomSidebarModules, 4, 1, 10),
  };
}

export function normalizeWorkbenchConfig(value: unknown): WorkbenchConfig {
  const config = toSettingsRecord(value);

  return {
    recentQuestions: Array.isArray(config.recentQuestions) ? config.recentQuestions : [],
    conversationThreads: Array.isArray(config.conversationThreads) ? config.conversationThreads : [],
    recommendationFeedback: Array.isArray(config.recommendationFeedback) ? config.recommendationFeedback : [],
    onboardingGuideActivated: normalizeBoolean(config.onboardingGuideActivated, false),
    onboardingGuideDismissed: normalizeBoolean(config.onboardingGuideDismissed, false),
    agentWriteMode: config.agentWriteMode === 'auto' ? 'auto' : 'confirm',
  };
}

export function normalizeAccessControlConfig(value: unknown): AccessControlConfig {
  const config = toSettingsRecord(value);
  const supportedTimeouts: readonly number[] = Object.values(ACCESS_CONTROL_TIMEOUT_OPTIONS);
  const timeout = normalizeAllowedInteger(
    config.autoLockTimeoutMinutes,
    supportedTimeouts,
    ACCESS_CONTROL_TIMEOUT_OPTIONS.DISABLED,
  ) as AccessControlTimeout;

  return {
    enabled: normalizeBoolean(config.enabled, false),
    lockOnStartup: normalizeBoolean(config.lockOnStartup, false),
    autoLockTimeoutMinutes: timeout,
  };
}

interface SettingsMessageOptions {
  type?: 'none' | 'info' | 'error' | 'question' | 'warning';
  title?: string;
  message: string;
  detail?: string;
}

type KnowledgeCopilotRebuildMode = 'incremental' | 'full' | 'cancel';

interface SnaptiumConfigPackage {
  type: 'sppcfg';
  version: number;
  exportedAt: number;
  app: string;
  settings: unknown;
  e2ee?: {
    keySlots?: KeySlots;
  };
}

const logger = loggerService.createLogger('Electron:Settings Service');
const SNAPTIUM_CONFIG_PACKAGE_TYPE = 'sppcfg' as const;
const SNAPTIUM_CONFIG_PACKAGE_VERSION = 1;
const SNAPTIUM_CONFIG_EXTENSION = 'sppcfg' as const;

function interpolateMessage(template: string, replacements: Record<string, string> = {}): string {
  return Object.entries(replacements).reduce((message, [key, value]) => {
    return message.replaceAll(`{${key}}`, String(value));
  }, template);
}

export function normalizeSettings(raw: unknown = {}): AppSettings {
  const config = toSettingsRecord(raw);
  const userAiSources = normalizeAiSourcesConfig(config.aiSources);
  const builtInSource = builtInAiService.getPublicSource();
  const aiSources: AiSourcesConfig = {
    sources: [builtInSource, ...userAiSources.sources],
  };
  const selectionSources = [...userAiSources.sources, builtInSource];
  const defaultLanguage = app.getLocale().toLowerCase().startsWith('en') ? 'en-US' : 'zh-CN';
  const defaultStoragePath = path.join(
    app.getPath(VFS_CONSTANTS.DOCUMENTS_FOLDER),
    VFS_CONSTANTS.CURRENT_WORKSPACE_NAME,
  );

  return {
    general: normalizeGeneralConfig(config.general, defaultLanguage),
    preview: normalizePreviewConfig(config.preview),
    editor: normalizeEditorConfig(config.editor),
    aiSources,
    aiAssistant: normalizeAiAssistantConfig(config.aiAssistant, selectionSources),
    knowledgeCopilot: normalizeKnowledgeCopilotConfig(config.knowledgeCopilot, selectionSources),
    sync: normalizeSyncConfig(config.sync),
    noteStorage: normalizeNoteStorageConfig(config.noteStorage, defaultStoragePath),
    privacyLog: normalizePrivacyLogConfig(config.privacyLog),
    softwareUpdate: normalizeSoftwareUpdateConfig(config.softwareUpdate),
    appShell: normalizeAppShellConfig(config.appShell),
    workbench: normalizeWorkbenchConfig(config.workbench),
    accessControl: normalizeAccessControlConfig(config.accessControl),
  };
}

export function stripBuiltInAiRuntimeSource(settings: AppSettings): AppSettings {
  return {
    ...settings,
    aiSources: {
      sources: settings.aiSources.sources.filter(source => !isBuiltInAiSourceId(source.id)),
    },
  };
}

function isSnaptiumConfigPackage(value: unknown): value is SnaptiumConfigPackage {
  if (!isRecord(value)) {
    return false;
  }

  return value.type === SNAPTIUM_CONFIG_PACKAGE_TYPE && isRecord(value.settings);
}

export const settingsService = {
  getSettingsPath(): string {
    return path.join(app.getPath(VFS_CONSTANTS.USER_DATA), VFS_CONSTANTS.PREFERENCES_FILE);
  },

  /**
   * Load settings from file
   */
  async loadConfig(): Promise<AppSettings> {
    const filePath = this.getSettingsPath();
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed: unknown = JSON.parse(content);
      const settings = normalizeSettings(parsed);
      previewPolicyService.updateConfig(settings.preview);
      return settings;
    } catch (error) {
      if (getErrorCode(error) !== 'ENOENT') {
        logger.error('Failed to load settings', { error: getErrorMessage(error) });
      }
      const settings = normalizeSettings();
      previewPolicyService.updateConfig(settings.preview);
      return settings;
    }
  },

  /**
   * Save settings to file
   */
  async saveConfig(config: unknown): Promise<AppSettings> {
    const filePath = this.getSettingsPath();
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      const settings = normalizeSettings(config);
      await fs.writeFile(filePath, JSON.stringify(stripBuiltInAiRuntimeSource(settings), null, 2), 'utf-8');
      previewPolicyService.updateConfig(settings.preview);
      return settings;
    } catch (error) {
      logger.error('Failed to save settings', { error: getErrorMessage(error) });
      throw error;
    }
  },

  /**
   * Set the application to launch on startup
   */
  async setAutoLaunch(enabled: boolean): Promise<{ enabled: boolean; supported: boolean }> {
    try {
      app.setLoginItemSettings({
        openAtLogin: enabled,
        path: app.getPath(VFS_CONSTANTS.NOTE_TYPE_EXE),
      });

      const loginItemSettings = app.getLoginItemSettings();
      return {
        enabled: loginItemSettings.openAtLogin,
        supported: true,
      };
    } catch (error) {
      logger.error('Failed to set auto launch', { error: getErrorMessage(error) });
      return {
        enabled,
        supported: false,
      };
    }
  },

  /**
   * Open a directory picker dialog and return the selected path
   */
  async pickDirectory(): Promise<string | null> {
    const focusedWindow = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null;

    const result = await dialog.showOpenDialog(focusedWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: $t('dialog.changeNoteStoragePath'),
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  },

  async showMessage(options: Partial<SettingsMessageOptions> = {}): Promise<boolean> {
    const focusedWindow = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null;
    const message = String(options.message ?? '').trim();

    if (!message) {
      return false;
    }

    const detail = typeof options.detail === 'string' ? options.detail.trim() : '';
    const type = ['none', 'info', 'error', 'question', 'warning'].includes(options.type ?? '')
      ? options.type
      : 'info';

    await dialog.showMessageBox(focusedWindow, {
      type,
      noLink: true,
      message,
      detail,
      title: String(options.title ?? '').trim() || app.getName(),
    });

    return true;
  },

  async confirmEmbeddingSourceChange(): Promise<boolean> {
    const focusedWindow = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null;

    const dialogResult = await dialog.showMessageBox(focusedWindow, {
      type: 'warning',
      buttons: [$t('button.cancel'), $t('button.changeAndRebuildIndex')],
      defaultId: 0,
      cancelId: 0,
      noLink: true,
      message: $t('message.confirm.changeEmbeddingModel'),
    });
    // selectedButtonIndex is zero-based and follows the order of buttons[]
    const selectedButtonIndex = dialogResult.response;

    return selectedButtonIndex === 1;
  },

  async confirmKnowledgeCopilotRebuildMode(): Promise<KnowledgeCopilotRebuildMode> {
    const focusedWindow = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null;

    const dialogResult = await dialog.showMessageBox(focusedWindow, {
      type: 'question',
      buttons: [$t('button.cancel'), $t('button.IncrementalRebuildIndex'), $t('button.fullRebuildIndex')],
      defaultId: 1,
      cancelId: 0,
      noLink: true,
      title: $t('label.knowledgeCopilotIndexStatus'),
      message: $t('message.confirm.knowledgeCopilotRebuildMode'),
    });
    // selectedButtonIndex is zero-based and follows the order of buttons[]
    const selectedButtonIndex = dialogResult.response;

    if (selectedButtonIndex === 1) {
      return 'incremental';
    }

    if (selectedButtonIndex === 2) {
      return 'full';
    }

    return 'cancel';
  },

  async confirmKnowledgeCopilotChunkRebuild(): Promise<boolean> {
    const focusedWindow = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null;

    const dialogResult = await dialog.showMessageBox(focusedWindow, {
      type: 'question',
      buttons: [$t('button.cancel'), $t('button.fullRebuildIndex')],
      defaultId: 1,
      cancelId: 0,
      noLink: true,
      title: $t('label.knowledgeCopilotIndexStatus'),
      message: $t(
        'message.confirm.knowledgeCopilotChunkRebuild',
        'Changing chunk size or overlap only affects newly built indexes. Rebuild the knowledge base index now?',
      ),
    });

    return dialogResult.response === 1;
  },

  async confirmDeleteAiSource(name: string): Promise<boolean> {
    const focusedWindow = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null;

    const dialogResult = await dialog.showMessageBox(focusedWindow, {
      type: 'warning',
      buttons: [$t('button.cancel'), $t('button.clear')],
      defaultId: 0,
      cancelId: 0,
      noLink: true,
      title: $t('title.clearConfiguration'),
      message: interpolateMessage($t('workspace.dialog.confirm'), { name: String(name) }),
    });
    // selectedButtonIndex is zero-based and follows the order of buttons[]
    const selectedButtonIndex = dialogResult.response;

    return selectedButtonIndex === 1;
  },

  async confirmResetSyncProvider(name: string): Promise<boolean> {
    const focusedWindow = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null;

    const dialogResult = await dialog.showMessageBox(focusedWindow, {
      type: 'warning',
      buttons: [$t('button.cancel'), $t('button.clearConfig')],
      defaultId: 0,
      cancelId: 0,
      noLink: true,
      title: $t('title.resetConfiguration'),
      message: interpolateMessage($t('dialog.confirmResetSyncProvider'), { name: String(name) }),
    });
    // selectedButtonIndex is zero-based and follows the order of buttons[]
    const selectedButtonIndex = dialogResult.response;

    return selectedButtonIndex === 1;
  },

  /**
   * Export settings and E2EE key slots to a Snaptium recovery package.
   */
  async exportConfig(): Promise<boolean> {
    const focusedWindow = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null;

    const result = await dialog.showSaveDialog(focusedWindow, {
      title: $t('pref.setting.backupFileName'),
      defaultPath: path.join(app.getPath('desktop'), `${$t('pref.setting.backupFileName')}.${SNAPTIUM_CONFIG_EXTENSION}`),
      filters: [
        { name: 'Snaptium Config', extensions: [SNAPTIUM_CONFIG_EXTENSION] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return false;
    }

    try {
      const settings = await this.loadConfig();
      const keySlots = await keyManagerService.loadKeySlots();
      const configPackage: SnaptiumConfigPackage = {
        type: SNAPTIUM_CONFIG_PACKAGE_TYPE,
        version: SNAPTIUM_CONFIG_PACKAGE_VERSION,
        exportedAt: Date.now(),
        app: app.getName(),
        settings: stripBuiltInAiRuntimeSource(settings),
        e2ee: keySlots ? { keySlots } : undefined,
      };

      await fs.writeFile(result.filePath, JSON.stringify(configPackage, null, 2), 'utf-8');
      return true;
    } catch (error) {
      logger.error('Failed to export settings', { error: getErrorMessage(error) });
      throw error;
    }
  },

  /**
   * Reset settings to defaults and restart the application
   */
  async resetConfig(): Promise<boolean> {
    const focusedWindow = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null;

    const dialogResult = await dialog.showMessageBox(focusedWindow, {
      type: 'warning',
      buttons: [$t('button.confirm'), $t('button.cancel')],
      defaultId: 1,
      cancelId: 1,
      message: $t('dialog.resetConfirmNotify'),
    });
    // selectedButtonIndex is zero-based and follows the order of buttons[]
    const selectedButtonIndex = dialogResult.response;

    if (selectedButtonIndex !== 0) {
      return false;
    }

    try {
      const targetFilePath = this.getSettingsPath();
      const settings = normalizeSettings();
      await fs.writeFile(
        targetFilePath,
        JSON.stringify(stripBuiltInAiRuntimeSource(settings), null, 2),
        'utf-8',
      );
      return true;
    } catch (error) {
      logger.error('Failed to reset settings', { error: getErrorMessage(error) });
      throw error;
    }
  },

  /**
   * Import settings from a Snaptium recovery package.
   */
  async importConfig(): Promise<boolean> {
    const focusedWindow = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null;

    const result = await dialog.showOpenDialog(focusedWindow, {
      title: $t('pref.setting.backupFileName'),
      properties: ['openFile'],
      filters: [
        { name: 'Snaptium Config', extensions: [SNAPTIUM_CONFIG_EXTENSION] },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return false;
    }

    try {
      const importPath = result.filePaths[0];
      const content = await fs.readFile(importPath, 'utf-8');
      const parsed: unknown = JSON.parse(content);
      if (!isSnaptiumConfigPackage(parsed)) {
        throw new Error('Invalid Snaptium config package');
      }

      const settings = normalizeSettings(parsed.settings);

      const targetFilePath = this.getSettingsPath();
      await fs.mkdir(path.dirname(targetFilePath), { recursive: true });
      await fs.writeFile(
        targetFilePath,
        JSON.stringify(stripBuiltInAiRuntimeSource(settings), null, 2),
        'utf-8',
      );

      if (parsed.e2ee?.keySlots) {
        await keyManagerService.restoreKeySlots(parsed.e2ee.keySlots);
      }

      previewPolicyService.updateConfig(settings.preview);

      return true;
    } catch (error) {
      logger.error('Failed to import settings', { error: getErrorMessage(error) });
      throw error;
    }
  }
};

