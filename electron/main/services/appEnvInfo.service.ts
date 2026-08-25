import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { app, shell } from 'electron';
import { getAppDistribution, type AppDistribution } from '../../shared/updater.constants.js';
import { loggerService } from './log/logger.service.js';

const logger = loggerService.createLogger('Electron:AppEnvInfo Service');
const MICROSOFT_STORE_URL = 'https://apps.microsoft.com/detail/9p4hw1mddgnn';
const WINDOWS_CURRENT_VERSION_REGISTRY_KEY = 'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion';
const WINDOWS_UPDATE_BUILD_REVISION_VALUE = 'UBR';

function getWindowsRegistryExecutablePath(): string {
  const systemRoot = process.env.SystemRoot?.trim();
  return systemRoot && path.win32.isAbsolute(systemRoot)
    ? path.win32.join(systemRoot, 'System32', 'reg.exe')
    : 'reg.exe';
}

function getWindowsUpdateBuildRevision(): Promise<string | null> {
  return new Promise((resolve) => {
    execFile(
      getWindowsRegistryExecutablePath(),
      ['query', WINDOWS_CURRENT_VERSION_REGISTRY_KEY, '/v', WINDOWS_UPDATE_BUILD_REVISION_VALUE],
      { encoding: 'utf8', timeout: 2000, windowsHide: true },
      (error, stdout) => {
        if (error) {
          resolve(null);
          return;
        }

        const match = stdout.match(/\bUBR\s+REG_DWORD\s+0x([0-9a-f]+)\b/i);
        if (!match) {
          resolve(null);
          return;
        }

        const revision = Number.parseInt(match[1], 16);
        resolve(Number.isNaN(revision) ? null : String(revision));
      },
    );
  });
}

async function getOperatingSystemName(systemVersion: string): Promise<string> {
  switch (process.platform) {
    case 'win32': {
      const productName = os.version().trim() || 'Windows';
      const buildNumber = systemVersion.match(/(\d+)$/)?.[1];
      const revision = await getWindowsUpdateBuildRevision();
      return buildNumber && revision
        ? `${productName}(${buildNumber}.${revision})`
        : productName;
    }
    case 'darwin':
      return systemVersion ? `macOS ${systemVersion}` : 'macOS';
    case 'linux':
      return systemVersion ? `Linux ${systemVersion}` : 'Linux';
    default:
      return systemVersion ? `${process.platform} ${systemVersion}` : process.platform;
  }
}

export const appEnvInfoService = {
  getAppVersion(): string {
    logger.debug('Getting app version');
    return app.getVersion();
  },

  getEnvVersion(): { electron: string; chrome: string; node: string; v8: string } {
    logger.debug('Getting env version');
    return {
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node,
      v8: process.versions.v8,
    };
  },

  async getSystemInfo(): Promise<{ operatingSystem: string; architecture: string }> {
    logger.debug('Getting system info');
    const systemVersion = process.getSystemVersion().trim();
    return {
      operatingSystem: await getOperatingSystemName(systemVersion),
      architecture: process.arch,
    };
  },

  getDistribution(): AppDistribution {
    logger.debug('Getting app distribution');
    return getAppDistribution();
  },

  getAppName(): string {
    logger.debug('Getting app name');
    return app.getName();
  },

  async openStorePage(): Promise<void> {
    logger.debug('Opening Microsoft Store product page');
    await shell.openExternal(MICROSOFT_STORE_URL);
  },
};
