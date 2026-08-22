import path from 'node:path';
import { isScheduledBackupFileName } from '../../shared/scheduled-backup.constants.js';

export interface ScheduledBackupFileEntry {
  name: string;
  modifiedAt: number;
}

export function isPathEqualToOrInside(rootPath: string, candidatePath: string): boolean {
  const relativePath = path.relative(path.resolve(rootPath), path.resolve(candidatePath));
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

export function selectScheduledBackupFilesToDelete(
  entries: readonly ScheduledBackupFileEntry[],
  retentionCount: number,
): string[] {
  const matchingEntries = entries
    .filter(entry => isScheduledBackupFileName(entry.name))
    .sort((left, right) => left.modifiedAt - right.modifiedAt || left.name.localeCompare(right.name, 'en'));

  return matchingEntries
    .slice(0, Math.max(0, matchingEntries.length - retentionCount))
    .map(entry => entry.name);
}
