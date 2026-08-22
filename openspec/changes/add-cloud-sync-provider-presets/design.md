## Context

WebDAV 与对象存储配置页已经采用和 AI 添加配置一致的纵向表单，但用户仍需自行查找各服务商的连接地址、凭据名称和 S3 请求风格。现有对象存储配置默认使用路径风格，而阿里云 OSS、腾讯云 COS 和 Amazon S3 的推荐配置需要虚拟托管风格。外部链接由主进程统一拦截并通过主机白名单打开。

## Goals / Non-Goals

**Goals:**

- 在两个配置页中提供与 AI 服务商选择相同视觉和交互的下拉控件。
- 将服务商差异集中为类型安全的预设，选择时只更新非敏感连接参数。
- 为已知服务商提供稳定的官方配置指南。
- 保持 Electron 的外部导航安全边界。

**Non-Goals:**

- 不实现服务商 OAuth、账号注册或控制台 API 集成。
- 不自动创建 Bucket、应用密码或访问密钥。
- 不改变同步协议、IPC 结构或已保存凭据格式。
- 不保证任意第三方 WebDAV/S3 服务的完全兼容性。

## Decisions

1. 沿用 AI 服务商控件的内联模板和交互方式，并将触发器、网格菜单与选中态样式提取到设置页共享样式。云同步页不新增额外组件层级。
2. 新增纯数据预设模块，集中保存服务商 ID、i18n 标签、官方指南、默认 Endpoint 和 `forcePathStyle`。预设是配置辅助，不增加持久化字段；重新进入页面时根据 Endpoint 识别已知服务商。
3. 选择预设会更新 Endpoint 和寻址方式，并清空 Region 以要求用户按实际 Bucket 地域填写。Bucket、远程路径、用户名、密码、AccessKey ID 与 Secret Key 均保持不变，避免误删用户数据。
4. 坚果云使用固定 WebDAV URL；Nextcloud、ownCloud、R2 和通用服务因地址包含用户域名或账户 ID，仅使用协议级通用 placeholder，不写入不可用的模板字符串。
5. 阿里云 OSS、腾讯云 COS、Amazon S3 和 Cloudflare R2 使用虚拟托管风格；通用 S3 兼容选项保留当前寻址设置，并允许用户继续使用已有 MinIO 类路径风格配置。
6. 官方指南使用带 `target="_blank"` 的链接，由现有 `setWindowOpenHandler` 校验 HTTPS 和精确主机白名单后交给系统浏览器。

## Risks / Trade-offs

7. Provider presentations include a bundled local logo URL. Both dropdown triggers and options use the existing shared `provider-logo` style, so rendering does not depend on network access.
8. The shared provider trigger uses a fixed control height, explicit line height, and single-line ellipsis to prevent font fallback differences between Chinese and Latin labels from shifting the form.
9. Required indicators mirror `isConfigReady`: WebDAV URL, username, and password; object-storage Endpoint, Region, Bucket, Access Key, and Secret Key. Remote path is excluded because normalization always supplies its non-empty default.

- [服务商修改文档 URL] → 使用官方稳定文档入口，并将 URL 集中在预设模块中便于维护。
- [切换预设覆盖手工 Endpoint] → 仅在选择有明确默认值的服务商时更新连接参数，不触碰凭据、Bucket 和远程路径。
- [自建 Nextcloud/ownCloud 无法从域名识别] → 预设仅作为当前配置辅助；运行时不依赖预设 ID。
- [第三方 S3 兼容差异] → 保留通用选项和测试连接，不宣称未验证服务完全兼容。

## Migration Plan

无需数据迁移。现有设置继续按原结构加载；用户只有主动选择服务商预设时才会应用推荐的非敏感参数。回滚可移除预设 UI 和允许主机，不影响现有同步配置。

## Open Questions

无。
