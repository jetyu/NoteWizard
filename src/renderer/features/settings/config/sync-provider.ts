import jianguoyunLogoUrl from '@assets/images/sync-providers/jianguoyun.svg';
import nextcloudLogoUrl from '@assets/images/sync-providers/nextcloud.svg';
import owncloudLogoUrl from '@assets/images/sync-providers/owncloud.svg';
import webDavLogoUrl from '@assets/images/sync-providers/webdav.svg';
import alibabaCloudLogoUrl from '@assets/images/ai-providers/alibaba-cloud.svg';
import tencentCloudLogoUrl from '@assets/images/sync-providers/tencent-cloud.svg';
import awsLogoUrl from '@assets/images/sync-providers/aws.svg';
import cloudflareLogoUrl from '@assets/images/sync-providers/cloudflare.svg';
import s3CompatibleLogoUrl from '@assets/images/sync-providers/s3-compatible.svg';

export const WEBDAV_SERVICE_PROVIDERS = Object.freeze({
  JIANGUOYUN: 'jianguoyun',
  NEXTCLOUD: 'nextcloud',
  OWNCLOUD: 'owncloud',
  CUSTOM: 'custom-webdav',
} as const);

export type WebDavServiceProvider =
  (typeof WEBDAV_SERVICE_PROVIDERS)[keyof typeof WEBDAV_SERVICE_PROVIDERS];

export const S3_SERVICE_PROVIDERS = Object.freeze({
  ALIBABA_OSS: 'alibaba-oss',
  TENCENT_COS: 'tencent-cos',
  AMAZON_S3: 'amazon-s3',
  CLOUDFLARE_R2: 'cloudflare-r2',
  CUSTOM: 'custom-s3',
} as const);

export type S3ServiceProvider =
  (typeof S3_SERVICE_PROVIDERS)[keyof typeof S3_SERVICE_PROVIDERS];

export interface WebDavServicePreset {
  id: WebDavServiceProvider;
  labelKey: string;
  logoUrl: string;
  guideUrl?: string;
  endpoint?: string;
}

export interface S3ServicePreset {
  id: S3ServiceProvider;
  labelKey: string;
  logoUrl: string;
  guideUrl?: string;
  endpoint?: string;
  forcePathStyle?: boolean;
}

interface WebDavPresetTarget {
  url: string;
  username: string;
  password: string;
}

interface S3PresetTarget {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
}

export const WEBDAV_SERVICE_PRESETS: readonly WebDavServicePreset[] = Object.freeze([
  {
    id: WEBDAV_SERVICE_PROVIDERS.JIANGUOYUN,
    labelKey: 'syncProvider.webdav.jianguoyun',
    logoUrl: jianguoyunLogoUrl,
    guideUrl: 'https://help.jianguoyun.com/?tag=webdav',
    endpoint: 'https://dav.jianguoyun.com/dav/',
  },
  {
    id: WEBDAV_SERVICE_PROVIDERS.NEXTCLOUD,
    labelKey: 'syncProvider.webdav.nextcloud',
    logoUrl: nextcloudLogoUrl,
    guideUrl: 'https://docs.nextcloud.com/server/latest/user_manual/en/files/access_webdav.html',
  },
  {
    id: WEBDAV_SERVICE_PROVIDERS.OWNCLOUD,
    labelKey: 'syncProvider.webdav.owncloud',
    logoUrl: owncloudLogoUrl,
    guideUrl: 'https://doc.owncloud.com/server/next/user_manual/en/files/access_webdav.html',
  },
  {
    id: WEBDAV_SERVICE_PROVIDERS.CUSTOM,
    labelKey: 'syncProvider.webdav.custom',
    logoUrl: webDavLogoUrl,
  },
]);

export const S3_SERVICE_PRESETS: readonly S3ServicePreset[] = Object.freeze([
  {
    id: S3_SERVICE_PROVIDERS.ALIBABA_OSS,
    labelKey: 'syncProvider.s3.alibabaOss',
    logoUrl: alibabaCloudLogoUrl,
    guideUrl: 'https://help.aliyun.com/zh/oss/developer-reference/compatibility-with-amazon-s3',
    endpoint: 'https://oss-cn-hangzhou.aliyuncs.com',
    forcePathStyle: false,
  },
  {
    id: S3_SERVICE_PROVIDERS.TENCENT_COS,
    labelKey: 'syncProvider.s3.tencentCos',
    logoUrl: tencentCloudLogoUrl,
    guideUrl: 'https://cloud.tencent.com/document/product/436/34688',
    endpoint: 'https://cos.ap-guangzhou.myqcloud.com',
    forcePathStyle: false,
  },
  {
    id: S3_SERVICE_PROVIDERS.AMAZON_S3,
    labelKey: 'syncProvider.s3.amazonS3',
    logoUrl: awsLogoUrl,
    guideUrl: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/RESTAPI.html',
    endpoint: 'https://s3.us-east-1.amazonaws.com',
    forcePathStyle: false,
  },
  {
    id: S3_SERVICE_PROVIDERS.CLOUDFLARE_R2,
    labelKey: 'syncProvider.s3.cloudflareR2',
    logoUrl: cloudflareLogoUrl,
    guideUrl: 'https://developers.cloudflare.com/r2/get-started/s3/',
    forcePathStyle: false,
  },
  {
    id: S3_SERVICE_PROVIDERS.CUSTOM,
    labelKey: 'syncProvider.s3.custom',
    logoUrl: s3CompatibleLogoUrl,
  },
]);

export function getWebDavServicePreset(provider: WebDavServiceProvider): WebDavServicePreset {
  return WEBDAV_SERVICE_PRESETS.find((preset) => preset.id === provider)
    ?? WEBDAV_SERVICE_PRESETS[WEBDAV_SERVICE_PRESETS.length - 1];
}

export function getS3ServicePreset(provider: S3ServiceProvider): S3ServicePreset {
  return S3_SERVICE_PRESETS.find((preset) => preset.id === provider)
    ?? S3_SERVICE_PRESETS[S3_SERVICE_PRESETS.length - 1];
}

export function isWebDavServiceProvider(value: string): value is WebDavServiceProvider {
  return WEBDAV_SERVICE_PRESETS.some((preset) => preset.id === value);
}

export function isS3ServiceProvider(value: string): value is S3ServiceProvider {
  return S3_SERVICE_PRESETS.some((preset) => preset.id === value);
}

export function detectWebDavServiceProvider(endpoint: string): WebDavServiceProvider {
  const normalized = endpoint.trim().toLowerCase();
  if (normalized.includes('dav.jianguoyun.com')) {
    return WEBDAV_SERVICE_PROVIDERS.JIANGUOYUN;
  }
  if (normalized.includes('nextcloud')) {
    return WEBDAV_SERVICE_PROVIDERS.NEXTCLOUD;
  }
  if (normalized.includes('owncloud')) {
    return WEBDAV_SERVICE_PROVIDERS.OWNCLOUD;
  }
  return WEBDAV_SERVICE_PROVIDERS.CUSTOM;
}

export function detectS3ServiceProvider(endpoint: string): S3ServiceProvider {
  const normalized = endpoint.trim().toLowerCase();
  if (normalized.includes('.aliyuncs.com')) {
    return S3_SERVICE_PROVIDERS.ALIBABA_OSS;
  }
  if (normalized.includes('.myqcloud.com')) {
    return S3_SERVICE_PROVIDERS.TENCENT_COS;
  }
  if (normalized.includes('.amazonaws.com')) {
    return S3_SERVICE_PROVIDERS.AMAZON_S3;
  }
  if (normalized.includes('.r2.cloudflarestorage.com')) {
    return S3_SERVICE_PROVIDERS.CLOUDFLARE_R2;
  }
  return S3_SERVICE_PROVIDERS.CUSTOM;
}

export function applyWebDavServicePreset(
  config: WebDavPresetTarget,
  provider: WebDavServiceProvider
): WebDavPresetTarget {
  const preset = getWebDavServicePreset(provider);
  return {
    ...config,
    url: preset.endpoint ?? clearKnownWebDavEndpoint(config.url),
  };
}

export function applyS3ServicePreset(
  config: S3PresetTarget,
  provider: S3ServiceProvider
): S3PresetTarget {
  const preset = getS3ServicePreset(provider);
  return {
    ...config,
    endpoint: preset.endpoint ?? clearKnownS3Endpoint(config.endpoint),
    region: '',
    forcePathStyle: preset.forcePathStyle ?? config.forcePathStyle,
  };
}

function clearKnownWebDavEndpoint(endpoint: string): string {
  return detectWebDavServiceProvider(endpoint) === WEBDAV_SERVICE_PROVIDERS.JIANGUOYUN ? '' : endpoint;
}

function clearKnownS3Endpoint(endpoint: string): string {
  return detectS3ServiceProvider(endpoint) === S3_SERVICE_PROVIDERS.CUSTOM ? endpoint : '';
}
