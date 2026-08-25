import {
  electronApi,
  type AppDistribution,
  type AppEnvVersion,
  type AppSystemInfo,
} from '@renderer/core/bridge/electronApi';

export interface AboutInfo {
  appName: string;
  appVersion: string;
  envVersion: AppEnvVersion;
  systemInfo: AppSystemInfo;
  distribution: AppDistribution;
}

function normalizeText(value: string | undefined | null, fallback: string): string {
  const normalized = value?.trim();
  return normalized ? normalized : fallback;
}

function normalizeEnvVersion(envVersion: AppEnvVersion): AppEnvVersion {
  return {
    electron: normalizeText(envVersion.electron, 'unknown'),
    node: normalizeText(envVersion.node, 'unknown'),
    chrome: normalizeText(envVersion.chrome, 'unknown'),
    v8: normalizeText(envVersion.v8, 'unknown'),
  };
}

function normalizeSystemInfo(systemInfo: AppSystemInfo): AppSystemInfo {
  return {
    operatingSystem: normalizeText(systemInfo.operatingSystem, 'unknown'),
    architecture: normalizeText(systemInfo.architecture, 'unknown'),
  };
}

class AboutService {
  onOpenAbout(callback: () => void): () => void {
    return electronApi.menu.onOpenAbout(() => {
      callback();
    });
  }

  async loadAboutInfo(): Promise<AboutInfo> {
    const [appVersion, appName, envVersion, systemInfo, distribution] = await Promise.all([
      electronApi.app.getVersion(),
      electronApi.app.getName(),
      electronApi.app.getEnvVersion(),
      electronApi.app.getSystemInfo(),
      electronApi.app.getDistribution(),
    ]);

    return {
      appName: normalizeText(appName, 'Unknown App'),
      appVersion: normalizeText(appVersion, '0.0.0'),
      envVersion: normalizeEnvVersion(envVersion),
      systemInfo: normalizeSystemInfo(systemInfo),
      distribution,
    };
  }

  async copyDiagnosticInfo(info: AboutInfo): Promise<void> {
    const diagnosticInfo = [
      `${info.appName} ${info.appVersion}`,
      `Distribution: ${info.distribution}`,
      `Operating system: ${info.systemInfo.operatingSystem}`,
      `CPU architecture: ${info.systemInfo.architecture}`,
      `Electron: ${info.envVersion.electron}`,
      `Node.js: ${info.envVersion.node}`,
      `Chromium: ${info.envVersion.chrome}`,
      `V8: ${info.envVersion.v8}`,
    ].join('\n');

    await electronApi.editor.writeClipboard(diagnosticInfo);
  }
}

export const aboutService = new AboutService();
