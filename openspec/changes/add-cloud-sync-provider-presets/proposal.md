## Why

云同步配置目前要求用户自行理解 WebDAV 和 S3 兼容存储的 Endpoint、Region、凭据命名与寻址方式，主流服务商也没有直接的配置入口，导致连接门槛高且容易因参数填写错误而失败。

## What Changes

- Bundle local service-provider logos for the WebDAV and object-storage dropdown triggers and options.
- Keep the shared provider trigger at a stable height across Chinese and Latin labels.
- Mark every field required by the existing connection-readiness checks with the shared red required indicator.

- 在 WebDAV 和对象存储配置页新增与 AI 服务配置一致的服务商下拉选择。
- 提供坚果云、Nextcloud、ownCloud、阿里云 OSS、腾讯云 COS、Amazon S3、Cloudflare R2 及通用协议选项。
- 根据服务商设置安全的推荐 Endpoint 与 S3 寻址方式，Region 保持空白并要求用户填写，同时保留用户的 Bucket、远程路径和凭据。
- 为已知服务商提供官方配置指南入口，并通过 Electron 的外部链接安全白名单打开。
- 增加服务商预设识别和应用逻辑测试，覆盖不覆盖敏感信息与寻址方式差异。

## Capabilities

### New Capabilities

- `cloud-sync-provider-setup`: 定义云同步服务商选择、推荐参数、官方指南和 S3 兼容行为。

### Modified Capabilities

无。

## Impact

- 渲染层云同步配置组件、共享设置样式与简体中文 i18n。
- Electron 外部链接允许列表。
- 云同步服务商预设配置和相关单元测试。
- 不新增依赖，不改变现有同步 IPC 数据结构，也不覆盖用户已保存的凭据。
