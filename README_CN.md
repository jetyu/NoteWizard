<p align="center">
  <img src="https://raw.githubusercontent.com/jetyu/Snaptium/main/electron/assets/logo/app-logo-128.png" alt="Snaptium 软件图标" width="88">
</p>
<h1 align="center">Snaptium</h1>

<p align="center">
  <strong>Language / 语言：</strong>
  <a href="README.md">English</a> |
  <a href="README_CN.md">简体中文</a>
</p>

<p align="center"><strong>支持 Windows、macOS 和 Linux 的开源 AI Markdown 笔记软件</strong></p>

<p align="center">
  <a href="https://github.com/jetyu/Snaptium">
    <img src="https://img.shields.io/badge/在_GitHub_上支持_Snaptium-181717?style=for-the-badge&logo=github&logoColor=white" alt="添加 Star">
  </a>
</p>

<p align="center">
  <a href="https://snaptium.com">官方网站</a> ·
  <a href="https://snaptium.com/docs">使用文档</a> ·
  <a href="https://snaptium.com/#download">下载 Snaptium</a>
</p>


[![Snaptium Release](https://github.com/jetyu/Snaptium/actions/workflows/build.yml/badge.svg?event=push)](https://github.com/jetyu/Snaptium/actions/workflows/build.yml)
[![Latest Release](https://img.shields.io/github/v/release/jetyu/Snaptium?style=flat&logo=github)](https://github.com/jetyu/Snaptium/releases/latest)
![GitHub Pre-release](https://img.shields.io/github/v/release/jetyu/Snaptium?include_prereleases&label=pre-release&logo=github)
[![Downloads](https://img.shields.io/github/downloads/jetyu/Snaptium/total?style=flat&logo=github)](https://github.com/jetyu/Snaptium/releases)
![GitHub Repo stars](https://img.shields.io/github/stars/jetyu/Snaptium?style=flat)
![GitHub forks](https://img.shields.io/github/forks/jetyu/Snaptium?style=flat)

![Electron](https://img.shields.io/badge/Electron-43.2.0-47848F?style=flat&logo=electron&logoColor=white)
![Vue](https://img.shields.io/badge/Vue-3.5.38-42b883?style=flat&logo=vuedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-3178C6?style=flat&logo=typescript&logoColor=white)

[![Open Issues](https://img.shields.io/github/issues/jetyu/Snaptium?style=flat&color=orange)](https://github.com/jetyu/Snaptium/issues)
[![Closed Issues](https://img.shields.io/github/issues-closed/jetyu/Snaptium?style=flat&color=brightgreen)](https://github.com/jetyu/Snaptium/issues?q=is%3Aissue%20state%3Aclosed)
[![License](https://img.shields.io/github/license/jetyu/Snaptium?style=flat)](https://github.com/jetyu/Snaptium/blob/main/LICENSE)

Snaptium 是一款开源、本地优先的 AI智能体驱动的 Markdown 笔记与知识管理软件，集成 CodeMirror 6 编辑器、AI 辅助写作、本地向量知识索引、RAG 知识库问答、快速记录，以及基于 WebDAV/S3 的端到端加密同步。

笔记默认保存在本地，可自定义存储路径，并支持 Markdown 导入导出。Snaptium 可运行于 Windows、macOS 和 Linux 主流桌面操作系统平台，同时支持云端 AI 服务与 Ollama 本地模型。

> 如果 Snaptium 对你有帮助，欢迎为项目添加 Star，让更多人发现这个项目。

> **NoteWizard 用户：** NoteWizard 已升级为 Snaptium，旧版本仍可从 [NoteWizard v1.2.1 发布页](https://github.com/jetyu/Snaptium/releases/tag/v1.2.1)下载。

## 目录

- [为什么选择 Snaptium](#为什么选择-snaptium)
- [功能特性](#功能特性)
- [界面与演示](#界面与演示)
- [技术栈](#技术栈)
- [支持平台](#支持平台)
- [下载](#下载)
- [本地开发](#本地开发)
- [常见问题](#常见问题)

## 为什么选择 Snaptium

Snaptium 并不仅仅是一款 Markdown 笔记工具。  
它更像是一个围绕「长期写作、知识沉淀与本地 AI 工作流」构建的智能写作空间。

项目强调：

- 本地优先（Local First）
- 数据自主可控
- 长期可持续存储
- AI 辅助而非 AI 绑定
- 可离线使用
- 多平台一致体验

---

## 功能特性

### Markdown 编辑与实时预览

- 基于 CodeMirror 的现代化编辑器
- 实时 Markdown 渲染预览
- 编辑器 / 预览同步滚动
- 数学公式（KaTeX）支持
- 代码高亮支持
- 任务列表 / 表格 / 脚注 / 标记语法支持
- 深色模式与沉浸式写作体验

---

### 快速记录、笔记组织与数据迁移

- 通过系统托盘或可配置的全局快捷键快速记录
- 自动创建带时间的笔记，并将光标直接定位到编辑器
- 支持笔记本、标签、收藏、全文搜索、回收站和版本历史
- 内置日记、会议、阅读、项目计划和任务清单模板
- 支持 Markdown 与 Snaptium 数据包导入导出、Evernote ENEX 导入以及单篇笔记 PDF 导出

---

### 个性化与诊断

- 支持跟随系统、浅色和深色主题，以及多种主题色
- 软件界面、编辑器和 Markdown 预览可分别设置字体
- 精选中文、日文和英文字体，包含 Meiryo UI
- 支持自定义应用快捷键和全局快捷键
- 可导出诊断 ZIP，包含当前日志以及应用、运行环境、操作系统、语言、笔记路径和授权状态等基本信息

---

### AI 辅助写作与模型服务

支持接入多种 AI 服务，用于：

- AI 辅助写作
- 内容润色
- 智能问答
- 文档总结
- 知识库问答（RAG）
- 语义检索

支持自定义模型与 API：

- OpenAI
- SiliconFlow
- OpenRouter
- DeepSeek
- Gemini
- Ollama（本地模型）
- 通义千问
- 豆包
- Kimi
- 智谱 AI
- Grok
- 兼容 OpenAI API 的第三方服务

> 默认情况下 AI 功能为关闭状态，所有 AI 能力由用户主动配置。

---

### 本地优先与隐私安全

Snaptium 采用 Local First 架构设计：

- 默认本地存储
- 不强制登录
- 不依赖中心化服务器
- 用户完全掌控数据

支持：

- AES-256-GCM 本地加密
- Workspace Password 工作区密码
- Recovery Key 恢复密钥
- 端到端加密同步（E2EE）
即使使用对象存储同步，云端也仅保存加密后的数据。

---

### WebDAV/S3 端到端加密同步

支持多种同步方式：

- S3 Compatible Object Storage
- Cloudflare R2
- WebDAV
- MinIO
- NAS 私有存储

支持完全自托管与私有化同步。

---

### 本地知识索引、RAG 与知识助手

内置向量知识库能力：

- 文档切片（Chunk）
- 向量嵌入
- 语义检索
- 本地知识索引
- Ask 模式：基于证据进行知识库问答
- Agent 模式：通过工具调用完成知识任务
- 可选重排模型，提高检索结果相关性

项目已集成：

- LanceDB
- Apache Arrow

---

### 多语言支持

支持 13 种语言与地区设置。

目前已支持：

- 简体中文
- English
- 日本語
- 한국어
- Deutsch
- Français
- Español
- Bahasa Indonesia
- Italiano
- Português (Brasil)
- Türkçe
- 繁體中文
- 更多语言持续增加中...

---

## 界面与演示

### Markdown 编辑模式

![Snaptium Markdown 编辑模式](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/EditorDemo.png)

### Markdown 阅读预览

![Snaptium Markdown 阅读预览](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/PreviewOnly.png)

### AI 智能写作演示

[![Snaptium AI 智能写作演示](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/SmartWriting.png)](https://github.com/jetyu/Snaptium/blob/main/docs/Screenshots/v2/en-US/SmartWriting.mp4)

### 知识库演示

[![Snaptium 本地知识库演示](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/KnowledgeBase.png)](https://github.com/jetyu/Snaptium/blob/main/docs/Screenshots/v2/en-US/KnowledgeBase.mp4)

---

## 技术栈

### 前端

- Vue 3.5.38
- TypeScript 6.0.3
- Vite 8.0.16
- Pinia 3.0.4
- Vue I18n 11.4.5
- CodeMirror 6

### 桌面端

- Electron 43.2.0
- Electron Builder 26.15.3
- Electron Updater 6.8.9

### Markdown 生态

- markdown-it
- KaTeX
- highlight.js

### AI 与数据能力

- LanceDB
- Apache Arrow
- AWS SDK S3
- WebDAV

---

## 支持平台

| 操作系统 | 支持版本 | 架构 | 安装包格式 |
|------|------|------|------|
| Windows | Windows 10 及以上 | x64 | `.exe` |
| macOS | macOS 11+ | arm64 | `.dmg` |
| Linux | Ubuntu / Debian / Fedora 等主流发行版 | x64 | `.deb` `.rpm` `.AppImage` |

> 请根据对应平台下载适合的安装包。

---

## 下载

### Windows

[![Snaptium-Windows-x64.exe](https://img.shields.io/badge/Snaptium--Windows--x64.exe-0078D4?style=flat-square&logo=windows&logoColor=white)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Windows-x64.exe)

---

### macOS

#### Apple Silicon

[![Snaptium-macOS-arm64.dmg](https://img.shields.io/badge/Snaptium--macOS--arm64.dmg-000000?style=flat-square&logo=apple&logoColor=white)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-macOS-arm64.dmg)

---

### Linux

#### Debian / Ubuntu

[![Snaptium-Linux-x64.deb](https://img.shields.io/badge/Snaptium--Linux--x64.deb-FCC624?style=flat-square&logo=debian&logoColor=black)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x64.deb)

#### Fedora / RHEL

[![Snaptium-Linux-x64.rpm](https://img.shields.io/badge/Snaptium--Linux--x64.rpm-FCC624?style=flat-square&logo=redhat&logoColor=black)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x64.rpm)

#### AppImage

[![Snaptium-Linux-x64.AppImage](https://img.shields.io/badge/Snaptium--Linux--x64.AppImage-FCC624?style=flat-square&logo=linux&logoColor=black)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x64.AppImage)

---

> [查看全部版本](https://github.com/jetyu/Snaptium/releases)

---

## 本地开发

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run dev
```

### 构建应用

```bash
npm run dist
```

按平台构建：

```bash
npm run dist:win
npm run dist:mac
npm run dist:linux
```

### 验证修改

```bash
npm run typecheck
npm run lint
npm run test:unit
```

---

## 文档与 Wiki

- Docs：https://snaptium.com/docs

---

## 常见问题

### Snaptium 是本地优先的 Markdown 笔记软件吗？

是。笔记默认保存在本地，存储路径可以自定义，核心编辑功能不要求用户必须登录。

### Snaptium 支持本地 AI 模型吗？

支持。Snaptium 可接入 Ollama 本地模型，也支持 OpenAI、Gemini、DeepSeek、OpenRouter、SiliconFlow 以及其他兼容 API。AI 功能默认关闭，需要由用户主动配置。

### Snaptium 支持哪些笔记导入导出格式？

支持 Markdown 和原生 `.sppx` 数据包导入导出、Evernote `.enex` 导入，以及单篇笔记 PDF 导出。

### Snaptium 支持加密同步吗？

支持。Snaptium 可通过 WebDAV 和 S3 兼容对象存储进行端到端加密同步，包括 Cloudflare R2、MinIO 和私有 NAS 存储。

### Snaptium 是开源软件吗？

是。Snaptium 使用 Apache License 2.0 开源协议。

## 项目路线

未来计划包括：

- 协作编辑
- 插件系统
- 移动端支持
- 更完整的离线知识库能力

---

## 开源协议

本项目采用 Apache License 2.0 开源协议。

详情请参阅：

```text
LICENSE
```

---

## 致谢

感谢以下优秀开源项目：

- Electron
- Vue
- CodeMirror
- markdown-it
- KaTeX
- LanceDB
- Apache Arrow

以及所有为 Snaptium 提交 Issue、PR 与建议的开发者与用户。

<img width="120" src="https://raw.githubusercontent.com/jetyu/Snaptium/main/electron/assets/images/siliconflow.png" alt="SiliconFlow 硅基流动标志" />

特别感谢 [硅基流动 SiliconFlow](https://siliconFlow.com) 对 Snaptium 的支持，为产品提供 AI 模型服务能力。

