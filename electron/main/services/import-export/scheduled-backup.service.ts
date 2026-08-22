import path from 'node:path';
import { promises as fs } from 'node:fs';
import { $t } from '../../utils/i18n.js';
import {
  buildScheduledSppxBackupFileName,
  isScheduledBackupFileName,
  type ScheduledBackupRunPayload,
  type ScheduledBackupRunResult,
} from '../../../shared/scheduled-backup.constants.js';
import { getErrorMessage } from '../error.service.js';
import { loggerService } from '../log/logger.service.js';
import { vfsService } from '../vfs.service.js';
import { sppxExportService } from './sppx-export.service.js';
import {
  isPathEqualToOrInside,
  selectScheduledBackupFilesToDelete,
  type ScheduledBackupFileEntry,
} from '../../utils/scheduled-backup.utils.js';

const logger = loggerService.createLogger('Main:Scheduled Backup Service');

async function collectScheduledBackupFiles(directoryPath: string): Promise<ScheduledBackupFileEntry[]> {
  const directoryEntries = await fs.readdir(directoryPath, { withFileTypes: true });
  const files: ScheduledBackupFileEntry[] = [];

  for (const entry of directoryEntries) {
    if (!entry.isFile() || !isScheduledBackupFileName(entry.name)) {
      continue;
    }

    const filePath = path.join(directoryPath, entry.name);
    const stat = await fs.stat(filePath);
    files.push({ name: entry.name, modifiedAt: stat.mtimeMs });
  }

  return files;
}

async function pruneScheduledBackups(directoryPath: string, retentionCount: number): Promise<void> {
  const entries = await collectScheduledBackupFiles(directoryPath);
  const filesToDelete = selectScheduledBackupFilesToDelete(entries, retentionCount);

  for (const fileName of filesToDelete) {
    await fs.unlink(path.join(directoryPath, fileName));
  }
}

async function performScheduledBackup(
  payload: ScheduledBackupRunPayload,
): Promise<ScheduledBackupRunResult> {
  const workspaceRoot = await vfsService.ensureInitialized();
  const requestedDirectory = path.resolve(payload.directoryPath.trim());
  if (isPathEqualToOrInside(workspaceRoot, requestedDirectory)) {
    throw new Error($t('scheduledBackup.error.directoryInsideWorkspace'));
  }

  await fs.mkdir(requestedDirectory, { recursive: true });

  const [resolvedWorkspaceRoot, resolvedDirectory] = await Promise.all([
    fs.realpath(workspaceRoot),
    fs.realpath(requestedDirectory),
  ]);
  if (isPathEqualToOrInside(resolvedWorkspaceRoot, resolvedDirectory)) {
    throw new Error($t('scheduledBackup.error.directoryInsideWorkspace'));
  }

  const startedAt = Date.now();
  const targetPackagePath = path.join(
    resolvedDirectory,
    buildScheduledSppxBackupFileName(startedAt),
  );

  await sppxExportService.createPackageAtPath(targetPackagePath, workspaceRoot);
  await pruneScheduledBackups(resolvedDirectory, payload.retentionCount);

  const backedUpAt = Date.now();
  logger.info(`Scheduled backup created at ${targetPackagePath}`);
  return {
    success: true,
    filePath: targetPackagePath,
    backedUpAt,
  };
}

let activeBackup: Promise<ScheduledBackupRunResult> | null = null;

export const scheduledBackupService = {
  async createBackup(payload: ScheduledBackupRunPayload): Promise<ScheduledBackupRunResult> {
    if (activeBackup) {
      return await activeBackup;
    }

    activeBackup = performScheduledBackup(payload).catch((error: unknown) => {
      logger.error(`Scheduled backup failed: ${getErrorMessage(error)}`);
      throw error;
    });

    try {
      return await activeBackup;
    } finally {
      activeBackup = null;
    }
  },
};
