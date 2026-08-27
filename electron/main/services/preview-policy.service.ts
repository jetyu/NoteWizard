import {
  DEFAULT_TRUSTED_REMOTE_IMAGE_HOSTS,
  isTrustedRemoteImageUrl,
  normalizeTrustedRemoteImageHosts,
} from '../../shared/preview-security.constants.js';
import packageJson from '../../../package.json' with { type: 'json' };

const DEV_SERVER_IMAGE_ORIGIN = new URL(packageJson.devServer.url).origin;

type RemoteImageMode = 'blocked' | 'trusted' | 'all';

interface PreviewAppearanceConfig {
  allowHtml: boolean;
  allowInlineSvg: boolean;
  remoteImageMode: RemoteImageMode;
  trustedRemoteImageHosts: string[];
}

const currentPreviewAppearance: PreviewAppearanceConfig = {
  allowHtml: true,
  allowInlineSvg: true,
  remoteImageMode: 'trusted',
  trustedRemoteImageHosts: [...DEFAULT_TRUSTED_REMOTE_IMAGE_HOSTS],
};

function clonePreviewAppearance(): PreviewAppearanceConfig {
  return {
    ...currentPreviewAppearance,
    trustedRemoteImageHosts: [...currentPreviewAppearance.trustedRemoteImageHosts],
  };
}

function normalizePreviewAppearance(
  config: Partial<PreviewAppearanceConfig> = {},
): PreviewAppearanceConfig {
  const remoteImageMode: RemoteImageMode = config.remoteImageMode === 'blocked'
    ? 'blocked'
    : config.remoteImageMode === 'all'
      ? 'all'
      : 'trusted';

  return {
    allowHtml: config.allowHtml !== false,
    allowInlineSvg: config.allowInlineSvg !== false,
    remoteImageMode,
    trustedRemoteImageHosts: normalizeTrustedRemoteImageHosts(config.trustedRemoteImageHosts),
  };
}

export const previewPolicyService = {
  updateConfig(config: Partial<PreviewAppearanceConfig> = {}): PreviewAppearanceConfig {
    const preview = normalizePreviewAppearance(config);
    currentPreviewAppearance.allowHtml = preview.allowHtml;
    currentPreviewAppearance.allowInlineSvg = preview.allowInlineSvg;
    currentPreviewAppearance.remoteImageMode = preview.remoteImageMode;
    currentPreviewAppearance.trustedRemoteImageHosts = [
      ...preview.trustedRemoteImageHosts,
    ];
    return clonePreviewAppearance();
  },

  getPreviewAppearance(): PreviewAppearanceConfig {
    return clonePreviewAppearance();
  },

  buildContentSecurityPolicy({ isDev = false }: { isDev?: boolean } = {}): string {
    const imageSources = ["'self'", 'data:', 'blob:', 'note-resource:', 'https:'];

    // Allow full remote image loading mode to include http origins by CSP as well,
    // otherwise runtime policy and CSP would conflict.
    if (currentPreviewAppearance.remoteImageMode === 'all') {
      imageSources.push('http:');
    }

    if (isDev) {
      imageSources.push(DEV_SERVER_IMAGE_ORIGIN);
    }

    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      `img-src ${imageSources.join(' ')}`,
      "font-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'none'",
      "frame-src 'none'",
      "frame-ancestors 'none'",
    ];

    if (currentPreviewAppearance.remoteImageMode !== 'all') {
      cspDirectives.push('upgrade-insecure-requests', 'block-all-mixed-content');
    }

    return cspDirectives.join('; ');
  },

  isAllowedRemoteImageRequest(url: unknown, { isDev = false }: { isDev?: boolean } = {}): boolean {
    try {
      const parsedUrl = new URL(String(url ?? ''));
      if (isDev && parsedUrl.origin === DEV_SERVER_IMAGE_ORIGIN) {
        return true;
      }

      if (currentPreviewAppearance.remoteImageMode === 'all') {
        return true;
      }

      if (currentPreviewAppearance.remoteImageMode !== 'trusted') {
        return false;
      }

      return isTrustedRemoteImageUrl(
        parsedUrl.toString(),
        currentPreviewAppearance.trustedRemoteImageHosts,
      );
    } catch {
      return false;
    }
  },
};
