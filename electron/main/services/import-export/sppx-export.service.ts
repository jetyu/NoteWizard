import path from 'node:path';
import { promises as fs } from 'node:fs';
import { app, BrowserWindow, dialog } from 'electron';
import { $t } from '../../utils/i18n.js';
import { VFS_CONSTANTS } from '../../constants/vfs.constants.js';
import { loggerService } from '../log/logger.service.js';
import { vfsService } from '../vfs.service.js';
import { createZipArchiveFromDirectory } from '../../utils/zip.utils.js';
import { getErrorMessage } from '../../services/error.service.js';
import { buildSppxBackupFileName } from '../../../shared/scheduled-backup.constants.js';

const logger = loggerService.createLogger('Main:SPPX Export Service');
const PACKAGE_EXTENSIONS = new Set(['.nwp', '.sppx']);
const DEFAULT_EXTENSION = '.sppx';

interface SppxExportResult {
  success: boolean;
  cancelled: boolean;
  filePath?: string;
  exportedAt?: number;
}

function getFocusedWindow(): BrowserWindow | null {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null;
}

function normalizeSavePath(filePath: string): string {
  const normalizedPath = String(filePath ?? '').trim();
  if (!normalizedPath) {
    return '';
  }

  const extension = path.extname(normalizedPath).toLowerCase();
  if (PACKAGE_EXTENSIONS.has(extension)) {
    return normalizedPath;
  }

  return `${normalizedPath}${DEFAULT_EXTENSION}`;
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export const sppxExportService = {
  async createPackageAtPath(targetPackagePath: string, workspaceRoot?: string): Promise<void> {
    const resolvedWorkspaceRoot = workspaceRoot
      ?? await vfsService.ensureInitialized().catch(() => null);
    if (!resolvedWorkspaceRoot) {
      throw new Error($t('dataTransfer.error.workspaceUnavailable'));
    }

    const databasePath = path.join(resolvedWorkspaceRoot, VFS_CONSTANTS.DATABASE_FOLDER);
    const databaseStat = await fs.stat(databasePath).catch(() => null);

    if (!databaseStat?.isDirectory()) {
      throw new Error($t('dataTransfer.error.databaseNotFound'));
    }

    try {
      await createZipArchiveFromDirectory({
        sourceDirectoryPath: databasePath,
        targetArchivePath: targetPackagePath,
        rootDirectoryName: VFS_CONSTANTS.DATABASE_FOLDER,
      });
    } catch (error) {
      if (await pathExists(targetPackagePath)) {
        await fs.unlink(targetPackagePath).catch(() => undefined);
      }
      logger.error(`Failed to create SPPX package: ${getErrorMessage(error)}`);
      throw error;
    }
  },

  async exportPackage(): Promise<SppxExportResult> {
    const workspaceRoot = await vfsService.ensureInitialized().catch(() => null);
    if (!workspaceRoot) {
      throw new Error($t('dataTransfer.error.workspaceUnavailable'));
    }

    const defaultPath = path.join(app.getPath('desktop'), buildSppxBackupFileName());
    const focusedWindow = getFocusedWindow();
    const saveDialogOptions = {
      title: $t('dataTransfer.sppxExport.dialogTitle'),
      defaultPath,
      filters: [
        { name: 'Snaptium Portable Package Exchange', extensions: ['sppx', 'nwp'] },
      ],
    };
    const dialogResult = focusedWindow
      ? await dialog.showSaveDialog(focusedWindow, saveDialogOptions)
      : await dialog.showSaveDialog(saveDialogOptions);

    if (dialogResult.canceled || !dialogResult.filePath) {
      return {
        success: false,
        cancelled: true,
      };
    }

    const targetPackagePath = normalizeSavePath(dialogResult.filePath);
    await this.createPackageAtPath(targetPackagePath, workspaceRoot);

    return {
      success: true,
      cancelled: false,
      filePath: targetPackagePath,
      exportedAt: Date.now(),
    };
  },
};
