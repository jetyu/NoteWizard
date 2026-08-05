## 1. 模块目录重组

- [x] 1.1 创建 `electron/main/services/knowledge-copilot/`，将七个 Knowledge Copilot 专属实现原样移动到该目录
- [x] 1.2 更新移动文件内部因目录层级变化而受影响的共享服务、constants、prompts、utils 和 shared import

## 2. 调用方更新

- [x] 2.1 更新 `ipc/modules/knowledge-copilot.ts` 对 Knowledge Copilot 服务的 import 路径
- [x] 2.2 更新 `import-export/sppx-import.service.ts` 对索引服务的 import 路径
- [x] 2.3 全局搜索并确认不存在移动前的旧路径引用或根目录兼容转发文件

## 3. 验证

- [x] 3.1 运行 `npm run build:main`，确认 Main 进程在纯目录重组后构建成功
- [x] 3.2 检查最终 diff，确认除文件移动和必要 import 更新外没有业务逻辑或格式变化
