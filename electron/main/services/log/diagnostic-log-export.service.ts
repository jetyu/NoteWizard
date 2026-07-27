import path from 'node:path';
import os from 'node:os';
import { promises as fs } from 'node:fs';
import {
  app,
  BrowserWindow,
  dialog,
  type SaveDialogOptions,
  type SaveDialogReturnValue,
} from 'electron';
import {
  DIAGNOSTIC_EXPORT_STATUS,
  type DiagnosticLogExportResult,
} from '../../../shared/diagnostic-log.constants.js';
import { $t } from '../../utils/i18n.js';
import { getErrorMessage } from '../error.service.js';
import { createZipArchiveFromDirectory } from '../../utils/zip.utils.js';
import { appEnvInfoService } from '../appEnvInfo.service.js';
import { licenseService } from '../license.service.js';
import { settingsService } from '../settings.service.js';
import { loggerService } from './logger.service.js';

const logger = loggerService.createLogger('Main:Diagnostic Log Export Service');
const ARCHIVE_EXTENSION = '.zip';
const ARCHIVE_ROOT_NAME = 'Snaptium-diagnostic-logs';
const STAGING_DIRECTORY_PREFIX = 'snaptium-diagnostic-logs-';
const DIAGNOSTIC_INFO_FILE_NAME = 'diagnostic-info.json';

export interface DiagnosticInfo {
  schemaVersion: 1;
  generatedAt: string;
  application: {
    name: string;
    version: string;
    distribution: string;
    packaged: boolean;
  };
  operatingSystem: {
    platform: NodeJS.Platform;
    type: string;
    release: string;
    version: string;
    architecture: string;
  };
  runtime: {
    electron: string;
    chromium: string;
    node: string;
    v8: string;
  };
  locale: {
    application: string;
    system: string;
  };
  storage: {
    notePath: string;
  };
  license: {
    plan: string;
    activated: boolean;
    valid: boolean;
    status: string;
    source: string;
    expiresAt: string | null;
    graceExpiresAt: string | null;
    maxDevices: number | null;
    activatedDevices: number;
    lastValidatedAt: number | null;
    lastServerSyncAt: number | null;
    lastErrorCode: string | null;
  };
}

export interface DiagnosticLogExportDependencies {
  now: () => Date;
  getPath: (name: 'desktop' | 'temp') => string;
  getLogDirectory: () => string;
  getDiagnosticInfo: (generatedAt: Date) => Promise<DiagnosticInfo>;
  showSaveDialog: (options: SaveDialogOptions) => Promise<SaveDialogReturnValue>;
  createArchive: typeof createZipArchiveFromDirectory;
}

export interface DiagnosticLogExportService {
  exportDiagnostics: () => Promise<DiagnosticLogExportResult>;
}

function getFocusedWindow(): BrowserWindow | null {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null;
}

function formatDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

export function buildDiagnosticArchiveName(date: Date): string {
  const datePart = [
    date.getFullYear(),
    formatDatePart(date.getMonth() + 1),
    formatDatePart(date.getDate()),
  ].join('');
  const timePart = [
    formatDatePart(date.getHours()),
    formatDatePart(date.getMinutes()),
    formatDatePart(date.getSeconds()),
  ].join('');
  return `Snaptium-diagnostic-logs-${datePart}-${timePart}${ARCHIVE_EXTENSION}`;
}

function normalizeArchivePath(filePath: string): string {
  const normalizedPath = filePath.trim();
  return path.extname(normalizedPath).toLowerCase() === ARCHIVE_EXTENSION
    ? normalizedPath
    : `${normalizedPath}${ARCHIVE_EXTENSION}`;
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function stageCurrentLogFiles({
  logDirectoryPath,
  stagingDirectoryPath,
}: {
  logDirectoryPath: string;
  stagingDirectoryPath: string;
}): Promise<string[]> {
  const entries = await fs.readdir(logDirectoryPath, { withFileTypes: true })
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    });
  const logFileNames = entries
    .filter(entry => entry.isFile() && path.extname(entry.name).toLowerCase() === '.log')
    .map(entry => entry.name)
    .sort((left, right) => left.localeCompare(right, 'en'));

  await fs.mkdir(stagingDirectoryPath, { recursive: true });
  for (const fileName of logFileNames) {
    await fs.copyFile(
      path.join(logDirectoryPath, fileName),
      path.join(stagingDirectoryPath, fileName),
    );
  }

  return logFileNames;
}

export async function stageDiagnosticInfo({
  stagingDirectoryPath,
  diagnosticInfo,
}: {
  stagingDirectoryPath: string;
  diagnosticInfo: DiagnosticInfo;
}): Promise<void> {
  await fs.mkdir(stagingDirectoryPath, { recursive: true });
  await fs.writeFile(
    path.join(stagingDirectoryPath, DIAGNOSTIC_INFO_FILE_NAME),
    `${JSON.stringify(diagnosticInfo, null, 2)}\n`,
    'utf8',
  );
}

export async function collectDiagnosticInfo(generatedAt: Date): Promise<DiagnosticInfo> {
  const envVersion = appEnvInfoService.getEnvVersion();
  const settings = await settingsService.loadConfig();
  const license = licenseService.getState();
  return {
    schemaVersion: 1,
    generatedAt: generatedAt.toISOString(),
    application: {
      name: appEnvInfoService.getAppName(),
      version: appEnvInfoService.getAppVersion(),
      distribution: appEnvInfoService.getDistribution(),
      packaged: app.isPackaged,
    },
    operatingSystem: {
      platform: process.platform,
      type: os.type(),
      release: os.release(),
      version: os.version(),
      architecture: process.arch,
    },
    runtime: {
      electron: envVersion.electron,
      chromium: envVersion.chrome,
      node: envVersion.node,
      v8: envVersion.v8,
    },
    locale: {
      application: app.getLocale(),
      system: app.getSystemLocale(),
    },
    storage: {
      notePath: settings.noteSavePath,
    },
    license: {
      plan: license.plan,
      activated: license.activated,
      valid: license.valid,
      status: license.status,
      source: license.source,
      expiresAt: license.expiresAt,
      graceExpiresAt: license.graceExpiresAt,
      maxDevices: license.maxDevices,
      activatedDevices: license.activatedDevices,
      lastValidatedAt: license.lastValidatedAt,
      lastServerSyncAt: license.lastServerSyncAt,
      lastErrorCode: license.lastErrorCode,
    },
  };
}

function createDefaultDependencies(): DiagnosticLogExportDependencies {
  return {
    now: () => new Date(),
    getPath: name => app.getPath(name),
    getLogDirectory: () => loggerService.getLogDirectory(),
    getDiagnosticInfo: collectDiagnosticInfo,
    showSaveDialog: async (options) => {
      const focusedWindow = getFocusedWindow();
      return focusedWindow
        ? dialog.showSaveDialog(focusedWindow, options)
        : dialog.showSaveDialog(options);
    },
    createArchive: createZipArchiveFromDirectory,
  };
}

export function createDiagnosticLogExportService(
  dependencies: DiagnosticLogExportDependencies = createDefaultDependencies(),
): DiagnosticLogExportService {
  return {
    async exportDiagnostics(): Promise<DiagnosticLogExportResult> {
      const now = dependencies.now();
      const defaultPath = path.join(
        dependencies.getPath('desktop'),
        buildDiagnosticArchiveName(now),
      );
      let stagingRootPath: string | null = null;
      let archivePath: string | null = null;
      let archiveCreationStarted = false;

      try {
        const dialogResult = await dependencies.showSaveDialog({
          title: $t('diagnosticLog.exportDialogTitle'),
          defaultPath,
          filters: [{
            name: $t('diagnosticLog.archiveType'),
            extensions: ['zip'],
          }],
        });

        if (dialogResult.canceled || !dialogResult.filePath) {
          return { status: DIAGNOSTIC_EXPORT_STATUS.CANCELLED };
        }

        archivePath = normalizeArchivePath(dialogResult.filePath);
        stagingRootPath = await fs.mkdtemp(path.join(
          dependencies.getPath('temp'),
          STAGING_DIRECTORY_PREFIX,
        ));
        const stagedLogsPath = path.join(stagingRootPath, ARCHIVE_ROOT_NAME);
        const logFileNames = await stageCurrentLogFiles({
          logDirectoryPath: dependencies.getLogDirectory(),
          stagingDirectoryPath: stagedLogsPath,
        });
        await stageDiagnosticInfo({
          stagingDirectoryPath: stagedLogsPath,
          diagnosticInfo: await dependencies.getDiagnosticInfo(now),
        });

        archiveCreationStarted = true;
        await dependencies.createArchive({
          sourceDirectoryPath: stagedLogsPath,
          targetArchivePath: archivePath,
          rootDirectoryName: ARCHIVE_ROOT_NAME,
        });

        return {
          status: DIAGNOSTIC_EXPORT_STATUS.EXPORTED,
          archivePath,
          includedLogFiles: logFileNames.length,
        };
      } catch (error: unknown) {
        if (archiveCreationStarted && archivePath && await pathExists(archivePath)) {
          await fs.unlink(archivePath).catch(() => undefined);
        }
        const message = getErrorMessage(error);
        logger.error('Diagnostic log export failed', { error: message });
        return {
          status: DIAGNOSTIC_EXPORT_STATUS.FAILED,
          error: message,
        };
      } finally {
        if (stagingRootPath) {
          await fs.rm(stagingRootPath, { recursive: true, force: true }).catch((error: unknown) => {
            logger.warn('Failed to remove diagnostic log staging directory', {
              error: getErrorMessage(error),
            });
          });
        }
      }
    },
  };
}

export const diagnosticLogExportService = createDiagnosticLogExportService();
