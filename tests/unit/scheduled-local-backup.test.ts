import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildScheduledSppxBackupFileName,
  buildSppxBackupFileName,
  isScheduledBackupDue,
  normalizeScheduledBackupConfig,
} from '../../electron/shared/scheduled-backup.constants.js';
import {
  isPathEqualToOrInside,
  selectScheduledBackupFilesToDelete,
} from '../../electron/main/utils/scheduled-backup.utils.js';

describe('scheduled local backup', () => {
  it('normalizes missing and unsupported configuration to safe defaults', () => {
    expect(normalizeScheduledBackupConfig(undefined)).toEqual({
      enabled: false,
      directoryPath: '',
      intervalHours: 2,
      retentionCount: 10,
      lastBackupAt: null,
    });

    expect(normalizeScheduledBackupConfig({
      enabled: true,
      directoryPath: '  D:\\Backups  ',
      intervalHours: 3,
      retentionCount: 12,
      lastBackupAt: -1,
    })).toEqual({
      enabled: true,
      directoryPath: 'D:\\Backups',
      intervalHours: 2,
      retentionCount: 10,
      lastBackupAt: null,
    });
  });

  it('accepts all supported backup intervals', () => {
    for (const intervalHours of [1, 2, 6, 12, 24]) {
      expect(normalizeScheduledBackupConfig({ intervalHours }).intervalHours).toBe(intervalHours);
    }
  });

  it('detects first and elapsed backups without running while disabled or unconfigured', () => {
    const now = 10 * 60 * 60 * 1000;
    expect(isScheduledBackupDue({
      enabled: false,
      directoryPath: 'backup',
      intervalHours: 1,
      lastBackupAt: null,
    }, now)).toBe(false);
    expect(isScheduledBackupDue({
      enabled: true,
      directoryPath: '',
      intervalHours: 1,
      lastBackupAt: null,
    }, now)).toBe(false);
    expect(isScheduledBackupDue({
      enabled: true,
      directoryPath: 'backup',
      intervalHours: 1,
      lastBackupAt: null,
    }, now)).toBe(true);
    expect(isScheduledBackupDue({
      enabled: true,
      directoryPath: 'backup',
      intervalHours: 1,
      lastBackupAt: now - 60 * 60 * 1000,
    }, now)).toBe(true);
    expect(isScheduledBackupDue({
      enabled: true,
      directoryPath: 'backup',
      intervalHours: 1,
      lastBackupAt: now - 30 * 60 * 1000,
    }, now)).toBe(false);
  });

  it('generates distinct manual and scheduled SPPX names with the same timestamp format', () => {
    const timestamp = new Date(2026, 7, 21, 8, 30, 5).getTime();

    expect(buildSppxBackupFileName(timestamp)).toBe('SnaptiumBackup-20260821-083005.sppx');
    expect(buildScheduledSppxBackupFileName(timestamp)).toBe('SnaptiumScheduledBackup-20260821-083005.sppx');
  });

  it('rejects the workspace and its descendants as backup destinations', () => {
    const workspacePath = path.resolve('workspace');

    expect(isPathEqualToOrInside(workspacePath, workspacePath)).toBe(true);
    expect(isPathEqualToOrInside(workspacePath, path.join(workspacePath, 'backups'))).toBe(true);
    expect(isPathEqualToOrInside(workspacePath, path.resolve('backups'))).toBe(false);
  });

  it('prunes only the oldest scheduled files and leaves manual or unrelated files untouched', () => {
    const entries = [
      { name: 'SnaptiumScheduledBackup-20260821-010000.sppx', modifiedAt: 1 },
      { name: 'SnaptiumScheduledBackup-20260821-020000.sppx', modifiedAt: 2 },
      { name: 'SnaptiumScheduledBackup-20260821-030000.sppx', modifiedAt: 3 },
      { name: 'SnaptiumScheduledBackup-20260821-040000.sppx', modifiedAt: 4 },
      { name: 'SnaptiumScheduledBackup-20260821-050000.sppx', modifiedAt: 5 },
      { name: 'SnaptiumScheduledBackup-20260821-060000.sppx', modifiedAt: 6 },
      { name: 'SnaptiumScheduledBackup-20260821-070000.sppx', modifiedAt: 7 },
      { name: 'SnaptiumBackup-20260821-000000.sppx', modifiedAt: 0 },
      { name: 'notes.txt', modifiedAt: 0 },
    ];

    expect(selectScheduledBackupFilesToDelete(entries, 5)).toEqual([
      'SnaptiumScheduledBackup-20260821-010000.sppx',
      'SnaptiumScheduledBackup-20260821-020000.sppx',
    ]);
  });
});
