import {
  S3_SERVICE_PRESETS,
  S3_SERVICE_PROVIDERS,
  WEBDAV_SERVICE_PRESETS,
  WEBDAV_SERVICE_PROVIDERS,
  applyS3ServicePreset,
  applyWebDavServicePreset,
  detectS3ServiceProvider,
  detectWebDavServiceProvider,
} from '@renderer/features/settings/config/sync-provider';

describe('cloud sync provider presets', () => {
  it('provides a bundled logo for every service provider option', () => {
    const presets = [...WEBDAV_SERVICE_PRESETS, ...S3_SERVICE_PRESETS];

    expect(presets.every((preset) => preset.logoUrl.length > 0)).toBe(true);
    expect(presets.every((preset) => !preset.logoUrl.startsWith('http'))).toBe(true);
  });

  it('detects known WebDAV and S3 endpoints', () => {
    expect(detectWebDavServiceProvider('https://dav.jianguoyun.com/dav/'))
      .toBe(WEBDAV_SERVICE_PROVIDERS.JIANGUOYUN);
    expect(detectWebDavServiceProvider('https://nextcloud.example.com/remote.php/dav'))
      .toBe(WEBDAV_SERVICE_PROVIDERS.NEXTCLOUD);
    expect(detectWebDavServiceProvider('https://owncloud.example.com/remote.php/dav'))
      .toBe(WEBDAV_SERVICE_PROVIDERS.OWNCLOUD);
    expect(detectS3ServiceProvider('https://oss-cn-hangzhou.aliyuncs.com'))
      .toBe(S3_SERVICE_PROVIDERS.ALIBABA_OSS);
    expect(detectS3ServiceProvider('https://cos.ap-guangzhou.myqcloud.com'))
      .toBe(S3_SERVICE_PROVIDERS.TENCENT_COS);
    expect(detectS3ServiceProvider('https://s3.us-east-1.amazonaws.com'))
      .toBe(S3_SERVICE_PROVIDERS.AMAZON_S3);
    expect(detectS3ServiceProvider('https://account.r2.cloudflarestorage.com'))
      .toBe(S3_SERVICE_PROVIDERS.CLOUDFLARE_R2);
  });

  it.each(['', 'not-a-url'])('treats an invalid endpoint as custom: %s', (endpoint) => {
    expect(detectWebDavServiceProvider(endpoint)).toBe(WEBDAV_SERVICE_PROVIDERS.CUSTOM);
    expect(detectS3ServiceProvider(endpoint)).toBe(S3_SERVICE_PROVIDERS.CUSTOM);
  });

  it('applies Jianguoyun without replacing credentials', () => {
    const nextConfig = applyWebDavServicePreset({
      url: 'https://example.com/dav',
      username: 'user@example.com',
      password: 'app-password',
    }, WEBDAV_SERVICE_PROVIDERS.JIANGUOYUN);

    expect(nextConfig).toEqual({
      url: 'https://dav.jianguoyun.com/dav/',
      username: 'user@example.com',
      password: 'app-password',
    });
  });

  it.each([
    [
      S3_SERVICE_PROVIDERS.ALIBABA_OSS,
      'https://oss-cn-hangzhou.aliyuncs.com',
    ],
    [
      S3_SERVICE_PROVIDERS.TENCENT_COS,
      'https://cos.ap-guangzhou.myqcloud.com',
    ],
    [
      S3_SERVICE_PROVIDERS.AMAZON_S3,
      'https://s3.us-east-1.amazonaws.com',
    ],
  ])('applies virtual-hosted defaults and clears Region for %s', (provider, endpoint) => {
    const nextConfig = applyS3ServicePreset({
      endpoint: 'https://storage.example.com',
      region: 'custom-region',
      bucket: 'private-bucket',
      accessKeyId: 'access-key',
      secretAccessKey: 'secret-key',
      forcePathStyle: true,
    }, provider);

    expect(nextConfig).toEqual({
      endpoint,
      region: '',
      bucket: 'private-bucket',
      accessKeyId: 'access-key',
      secretAccessKey: 'secret-key',
      forcePathStyle: false,
    });
  });

  it('clears Region for R2 while preserving sensitive values', () => {
    const nextConfig = applyS3ServicePreset({
      endpoint: 'https://oss-cn-hangzhou.aliyuncs.com',
      region: 'oss-cn-hangzhou',
      bucket: 'private-bucket',
      accessKeyId: 'access-key',
      secretAccessKey: 'secret-key',
      forcePathStyle: true,
    }, S3_SERVICE_PROVIDERS.CLOUDFLARE_R2);

    expect(nextConfig).toEqual({
      endpoint: '',
      region: '',
      bucket: 'private-bucket',
      accessKeyId: 'access-key',
      secretAccessKey: 'secret-key',
      forcePathStyle: false,
    });
  });

  it('preserves custom S3 values and addressing style while clearing Region', () => {
    const currentConfig = {
      endpoint: 'https://minio.example.com',
      region: 'local',
      bucket: 'private-bucket',
      accessKeyId: 'access-key',
      secretAccessKey: 'secret-key',
      forcePathStyle: true,
    };

    expect(applyS3ServicePreset(currentConfig, S3_SERVICE_PROVIDERS.CUSTOM)).toEqual({
      ...currentConfig,
      region: '',
    });
  });
});
