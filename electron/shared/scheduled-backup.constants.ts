export const SCHEDULED_BACKUP_INTERVAL_HOURS = [1, 2, 6, 12, 24] as const;
export const SCHEDULED_BACKUP_RETENTION_COUNTS = [5, 10, 20, 30, 100] as const;

export type ScheduledBackupIntervalHours = typeof SCHEDULED_BACKUP_INTERVAL_HOURS[number];
export type ScheduledBackupRetentionCount = typeof SCHEDULED_BACKUP_RETENTION_COUNTS[number];

export interface ScheduledBackupConfig {
  enabled: boolean;
  directoryPath: string;
  intervalHours: ScheduledBackupIntervalHours;
  retentionCount: ScheduledBackupRetentionCount;
  lastBackupAt: number | null;
}

export interface ScheduledBackupRunPayload {
  directoryPath: string;
  retentionCount: ScheduledBackupRetentionCount;
}

export interface ScheduledBackupRunResult {
  success: boolean;
  filePath: string;
  backedUpAt: number;
}

export const DEFAULT_SCHEDULED_BACKUP_CONFIG: ScheduledBackupConfig = Object.freeze({
  enabled: false,
  directoryPath: '',
  intervalHours: 2,
  retentionCount: 10,
  lastBackupAt: null,
});

function toConfigRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function normalizeScheduledBackupConfig(value: unknown): ScheduledBackupConfig {
  const config = toConfigRecord(value);
  const intervalHours = Number(config.intervalHours);
  const retentionCount = Number(config.retentionCount);
  const lastBackupAt = Number(config.lastBackupAt);

  return {
    enabled: typeof config.enabled === 'boolean'
      ? config.enabled
      : DEFAULT_SCHEDULED_BACKUP_CONFIG.enabled,
    directoryPath: typeof config.directoryPath === 'string'
      ? config.directoryPath.trim()
      : DEFAULT_SCHEDULED_BACKUP_CONFIG.directoryPath,
    intervalHours: SCHEDULED_BACKUP_INTERVAL_HOURS.includes(
      intervalHours as ScheduledBackupIntervalHours,
    )
      ? intervalHours as ScheduledBackupIntervalHours
      : DEFAULT_SCHEDULED_BACKUP_CONFIG.intervalHours,
    retentionCount: SCHEDULED_BACKUP_RETENTION_COUNTS.includes(
      retentionCount as ScheduledBackupRetentionCount,
    )
      ? retentionCount as ScheduledBackupRetentionCount
      : DEFAULT_SCHEDULED_BACKUP_CONFIG.retentionCount,
    lastBackupAt: Number.isFinite(lastBackupAt) && lastBackupAt > 0
      ? lastBackupAt
      : null,
  };
}

const MANUAL_BACKUP_PREFIX = 'SnaptiumBackup';
const SCHEDULED_BACKUP_PREFIX = 'SnaptiumScheduledBackup';
const SPPX_FILE_EXTENSION = '.sppx';
const SCHEDULED_BACKUP_FILE_PATTERN = /^SnaptiumScheduledBackup-\d{8}-\d{6}\.sppx$/;

function formatDatePart(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

function buildTimestampPart(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = formatDatePart(date.getMonth() + 1);
  const day = formatDatePart(date.getDate());
  const hour = formatDatePart(date.getHours());
  const minute = formatDatePart(date.getMinutes());
  const second = formatDatePart(date.getSeconds());
  return `${year}${month}${day}-${hour}${minute}${second}`;
}

export function buildSppxBackupFileName(timestamp = Date.now()): string {
  return `${MANUAL_BACKUP_PREFIX}-${buildTimestampPart(timestamp)}${SPPX_FILE_EXTENSION}`;
}

export function buildScheduledSppxBackupFileName(timestamp = Date.now()): string {
  return `${SCHEDULED_BACKUP_PREFIX}-${buildTimestampPart(timestamp)}${SPPX_FILE_EXTENSION}`;
}

export function isScheduledBackupFileName(fileName: string): boolean {
  return SCHEDULED_BACKUP_FILE_PATTERN.test(fileName);
}

export function isScheduledBackupDue(
  config: Pick<ScheduledBackupConfig, 'enabled' | 'directoryPath' | 'intervalHours' | 'lastBackupAt'>,
  now = Date.now(),
): boolean {
  if (!config.enabled || !config.directoryPath.trim()) {
    return false;
  }

  if (config.lastBackupAt === null) {
    return true;
  }

  return now - config.lastBackupAt >= config.intervalHours * 60 * 60 * 1000;
}
