import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../constants/ipc.constants.js';
import { importExportService } from '../../services/import-export/import-export.service.js';
import { loggerService } from '../../services/log/logger.service.js';
import { z } from 'zod';
import {
  SCHEDULED_BACKUP_RETENTION_COUNTS,
  type ScheduledBackupRunPayload,
} from '../../../shared/scheduled-backup.constants.js';

const logger = loggerService.createLogger('Electron:ImportExport IPC');

const singleNotePdfExportPayloadSchema = z.object({
  title: z.string().min(1).max(255),
  html: z.string(),
});

const scheduledBackupPayloadSchema = z.object({
  directoryPath: z.string().trim().min(1).max(4096),
  retentionCount: z.number().int().refine(
    value => SCHEDULED_BACKUP_RETENTION_COUNTS.includes(
      value as typeof SCHEDULED_BACKUP_RETENTION_COUNTS[number],
    ),
  ),
}).strict();

export function registerImportExportIpcHandlers() {
  ipcMain.removeHandler(IPC_CHANNELS.DATA_CREATE_SCHEDULED_BACKUP);
  ipcMain.removeHandler(IPC_CHANNELS.DATA_EXPORT_SPPX);
  ipcMain.removeHandler(IPC_CHANNELS.DATA_IMPORT_SPPX);
  ipcMain.removeHandler(IPC_CHANNELS.DATA_EXPORT_MARKDOWN);
  ipcMain.removeHandler(IPC_CHANNELS.DATA_EXPORT_NOTE_PDF);
  ipcMain.removeHandler(IPC_CHANNELS.DATA_IMPORT_MARKDOWN);
  ipcMain.removeHandler(IPC_CHANNELS.DATA_IMPORT_ENEX);
  ipcMain.removeHandler(IPC_CHANNELS.DATA_IMPORT_NWP);

  ipcMain.handle(IPC_CHANNELS.DATA_EXPORT_SPPX, async () => {
    return await importExportService.exportSppxPackage();
  });

  ipcMain.handle(IPC_CHANNELS.DATA_CREATE_SCHEDULED_BACKUP, async (_event, payload = {}) => {
    const parsedPayload = scheduledBackupPayloadSchema.parse(payload);
    return await importExportService.createScheduledBackup(parsedPayload as ScheduledBackupRunPayload);
  });

  ipcMain.handle(IPC_CHANNELS.DATA_IMPORT_SPPX, async () => {
    return await importExportService.importSppxPackage();
  });

  ipcMain.handle(IPC_CHANNELS.DATA_EXPORT_MARKDOWN, async () => {
    return await importExportService.exportMarkdownBatch();
  });

  ipcMain.handle(IPC_CHANNELS.DATA_EXPORT_NOTE_PDF, async (_event, payload = {}) => {
    return await importExportService.exportNotePdf(singleNotePdfExportPayloadSchema.parse(payload));
  });

  ipcMain.handle(IPC_CHANNELS.DATA_IMPORT_MARKDOWN, async () => {
    return await importExportService.importMarkdownBatch();
  });

  ipcMain.handle(IPC_CHANNELS.DATA_IMPORT_ENEX, async () => {
    return await importExportService.importEnex();
  });

  ipcMain.handle(IPC_CHANNELS.DATA_IMPORT_NWP, async () => {
    return await importExportService.importNwpPackage();
  });

  logger.debug('Import/export IPC handlers registered');
}
