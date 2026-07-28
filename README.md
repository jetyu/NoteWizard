<p align="center">
  <img src="https://raw.githubusercontent.com/jetyu/Snaptium/main/electron/assets/logo/app-logo-128.png" alt="Snaptium 软件图标" width="88">
</p>
<h1 align="center">Snaptium</h1>

<p align="center">
  <strong>Language / 语言：</strong>
  <a href="README.md">English</a> |
  <a href="README_CN.md">简体中文</a>
</p>

<p align="center"><strong>Open-source Markdown note-taking app for Windows, macOS, and Linux</strong></p>

<p align="center">
  <a href="https://snaptium.com">Official Website</a> ·
  <a href="https://snaptium.com/docs">Documentation</a> ·
  <a href="https://snaptium.com/#download">Download Snaptium</a>
</p>

<p align="center">
  <a href="https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Windows-x64.exe">
    <img src="https://img.shields.io/badge/Download_for_Windows_x64-0078D4?style=for-the-badge&logo=windows&logoColor=white" alt=" Windows x64">
  </a>
  <a href="https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-macOS-arm64.dmg">
    <img src="https://img.shields.io/badge/Download_for_macOS_Apple_Silicon-000000?style=for-the-badge&logo=apple&logoColor=white" alt="macOS Apple Silicon">
  </a>
  <a href="https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x86_64.AppImage">
    <img src="https://img.shields.io/badge/Download_for_Linux_x86__64-FCC624?style=for-the-badge&logo=linux&logoColor=black" alt="Linux x86_64">
  </a>
  <a href="https://github.com/jetyu/Snaptium">
    <img src="https://img.shields.io/badge/Star_Snaptium_on_GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="Star Snaptium on GitHub">
  </a>
</p>

[![Snaptium Release](https://github.com/jetyu/Snaptium/actions/workflows/build.yml/badge.svg?event=push)](https://github.com/jetyu/Snaptium/actions/workflows/build.yml)
[![Latest Release](https://img.shields.io/github/v/release/jetyu/Snaptium?style=flat&logo=github)](https://github.com/jetyu/Snaptium/releases/latest)
![GitHub Pre-release](https://img.shields.io/github/v/release/jetyu/Snaptium?include_prereleases&label=pre-release&logo=github)
[![Downloads](https://img.shields.io/github/downloads/jetyu/Snaptium/total?style=flat&logo=github)](https://github.com/jetyu/Snaptium/releases)
![GitHub Repo stars](https://img.shields.io/github/stars/jetyu/Snaptium?style=flat)
![GitHub forks](https://img.shields.io/github/forks/jetyu/Snaptium?style=flat)

![Platform](https://img.shields.io/badge/Platform-Windows%20|%20macOS%20|%20Linux-blue?style=flat)
![Electron](https://img.shields.io/badge/Electron-43.2.0-47848F?style=flat&logo=electron&logoColor=white)
![Vue](https://img.shields.io/badge/Vue-3.5.38-42b883?style=flat&logo=vuedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-3178C6?style=flat&logo=typescript&logoColor=white)

[![Open Issues](https://img.shields.io/github/issues/jetyu/Snaptium?style=flat&color=orange)](https://github.com/jetyu/Snaptium/issues)
[![Closed Issues](https://img.shields.io/github/issues-closed/jetyu/Snaptium?style=flat&color=brightgreen)](https://github.com/jetyu/Snaptium/issues?q=is%3Aissue%20state%3Aclosed)
[![License](https://img.shields.io/github/license/jetyu/Snaptium?style=flat)](https://github.com/jetyu/Snaptium/blob/main/LICENSE)

Snaptium is an open-source, local-first Markdown note-taking and knowledge management app. It combines a CodeMirror 6 Markdown editor, AI writing assistance, a local vector knowledge index, RAG-based knowledge Q&A, quick capture, and end-to-end encrypted WebDAV/S3 sync in one desktop workspace.

Your notes stay as durable local data by default, with configurable storage paths and Markdown import/export. Snaptium runs on Windows, macOS, and Linux and supports both cloud AI providers and local Ollama models.

> If Snaptium is useful to you, consider giving the project a Star. It helps more people discover the project.

> **NoteWizard users:** NoteWizard has been upgraded to Snaptium. The previous version remains available from the [NoteWizard v1.2.1 release](https://github.com/jetyu/Snaptium/releases/tag/v1.2.1).

## Contents

- [Why Snaptium](#why-snaptium)
- [Features](#features)
- [Screenshots and demos](#screenshots-and-demos)
- [Technology stack](#technology-stack)
- [Supported platforms](#supported-platforms)
- [Download](#download)
- [Local development](#local-development)
- [Frequently asked questions](#frequently-asked-questions)

## Why Snaptium

Snaptium is not just another Markdown note-taking tool.  
It is an intelligent writing space built around "long-term writing, knowledge accumulation, and local AI workflows."

The project emphasizes:

- **Local First**
- **Data Sovereignty**
- **Long-term Sustainable Storage**
- **AI-Assisted, Not AI-Locked**
- **Offline Usability**
- **Consistent Multi-platform Experience**

---

## Features

### Markdown editor and live preview

- Modern editor based on CodeMirror
- Real-time Markdown rendering preview
- Synchronized scrolling between editor and preview
- Math formula (KaTeX) support
- Code highlighting support
- Task lists / Tables / Footnotes / Markup syntax support
- Dark mode and immersive writing experience

---

### Quick capture, note organization, and data portability

- Quick Capture from the system tray or a configurable global shortcut
- Automatic creation of a timestamped note with the cursor focused in the editor
- Notebooks, tags, favorites, full-text search, trash, and version history
- Built-in daily note, meeting, reading, project plan, and task list templates
- Markdown and Snaptium package import/export, Evernote ENEX import, and single-note PDF export

---

### Personalization and diagnostics

- System, light, and dark themes with selectable accent colors
- Independent font preferences for the application UI, editor, and Markdown preview
- Curated Chinese, Japanese, and Latin fonts, including Meiryo UI
- Customizable application and global keyboard shortcuts
- Diagnostic ZIP export containing current logs and basic app, runtime, operating system, locale, note path, and license status information

---

### AI writing assistant and model providers

Supports integration with multiple AI services for:

- AI-assisted writing
- Content polishing
- Intelligent Q&A
- Document summarization
- Ask Knowledge Copilot (RAG)
- Semantic search

Supports custom models and APIs:

- OpenAI
- SiliconFlow
- OpenRouter
- DeepSeek
- Gemini
- Ollama (Local models)
- Qwen
- Doubao
- Kimi
- Zhipu AI
- Grok
- Third-party services compatible with OpenAI API

> By default, AI features are disabled. All AI capabilities are manually configured by the user.

---

### Local-first privacy and security

Snaptium is designed with a Local First architecture:

- Local storage by default
- No mandatory login
- No dependence on centralized servers
- Full user control over data

Supports:

- AES-256-GCM local encryption
- Workspace Password
- Recovery Key
- End-to-End Encrypted Sync (E2EE)
Even when using object storage for sync, only encrypted data is stored in the cloud.

---

### End-to-end encrypted WebDAV and S3 sync

Supports multiple synchronization methods:

- S3 Compatible Object Storage
- Cloudflare R2
- WebDAV
- MinIO
- NAS Private Storage

Supports full self-hosting and private synchronization.

---

### Local knowledge index, RAG, and Knowledge Copilot

Built-in vector knowledge base capabilities:

- Document Chunking
- Vector Embedding
- Semantic Search
- Local Knowledge Indexing
- Ask mode for evidence-based knowledge Q&A
- Agent mode for tool-assisted knowledge tasks
- Optional reranking for more relevant retrieval results

Integrated with:

- LanceDB
- Apache Arrow

Future support for local Embedding models and offline AI workflows.

---

### Internationalization

Supports 13 languages and regional settings.

Currently supported:

- Simplified Chinese
- English
- Japanese
- Korean
- German
- French
- Spanish
- Indonesian
- Italian
- Portuguese (Brazil)
- Turkish
- Traditional Chinese
- More languages are being added...

---

## Screenshots and demos

### Markdown edit mode

![Snaptium Markdown editor in edit mode](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/EditorDemo.png)

### Markdown preview

![Snaptium Markdown rendered preview](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/PreviewOnly.png)

### AI smart writing demo
[![Snaptium AI smart writing demo](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/SmartWriting.png)](https://github.com/jetyu/Snaptium/blob/main/docs/Screenshots/v2/en-US/SmartWriting.mp4)

### Knowledge base demo
[![Snaptium local knowledge base demo](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/KnowledgeBase.png)](https://github.com/jetyu/Snaptium/blob/main/docs/Screenshots/v2/en-US/KnowledgeBase.mp4)


## Technology stack

### Frontend

- Vue 3.5.38
- TypeScript 6.0.3
- Vite 8.0.16
- Pinia 3.0.4
- Vue I18n 11.4.5
- CodeMirror 6

### Desktop

- Electron 43.2.0
- Electron Builder 26.15.3
- Electron Updater 6.8.9

### Markdown ecosystem

- markdown-it
- KaTeX
- highlight.js

### AI and data capabilities

- LanceDB
- Apache Arrow
- AWS SDK S3
- WebDAV

---

## Supported platforms

| OS | Supported Version | Architecture | Installation Format |
|------|------|------|------|
| Windows | Windows 10 and above | x64 | `.exe` |
| macOS | macOS 11+ | arm64 | `.dmg` |
| Linux | Ubuntu / Debian / Fedora, etc. | x64 | `.deb` `.rpm` `.AppImage` |

> Please download the appropriate installer for your platform.

---

## Download

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

> [View All Releases](https://github.com/jetyu/Snaptium/releases)

---

## Local development

### Install dependencies

```bash
npm install
```

### Start development environment

```bash
npm run dev
```

### Build application

```bash
npm run dist
```

Platform-specific builds:

```bash
npm run dist:win
npm run dist:mac
npm run dist:linux
```

### Verify changes

```bash
npm run typecheck
npm run lint
npm run test:unit
```

---

## Documentation and Wiki

- Wiki: https://github.com/jetyu/Snaptium/wiki
- Docs: https://github.com/jetyu/Snaptium/tree/main/docs

---

## Frequently asked questions

### Is Snaptium a local-first Markdown note-taking app?

Yes. Notes are stored locally by default, the storage path is configurable, and core editing remains available without a mandatory account.

### Can Snaptium use local AI models?

Yes. Snaptium supports Ollama for local models, as well as OpenAI, Gemini, DeepSeek, OpenRouter, SiliconFlow, and other compatible AI APIs. AI features are disabled until the user configures them.

### Which note formats can Snaptium import or export?

Snaptium supports Markdown and native `.sppx` package import/export, Evernote `.enex` import, and single-note PDF export.

### Does Snaptium support encrypted sync?

Yes. Snaptium supports end-to-end encrypted synchronization through WebDAV and S3-compatible object storage, including Cloudflare R2, MinIO, and private NAS storage.

### Is Snaptium open source?

Yes. Snaptium is released under the Apache License 2.0.

## Roadmap

Future plans include:

- Integration of local AI models
- Extractable Windows portable package
- Multi-workspace management
- Collaborative editing
- Plugin system
- Mobile support
- More complete offline knowledge base capabilities

---

## License

This project is licensed under the Apache License 2.0.

For details, please refer to:

```text
LICENSE
```

---

## Acknowledgments

Thanks to the following excellent open-source projects:

- Electron
- Vue
- CodeMirror
- markdown-it
- KaTeX
- LanceDB
- Apache Arrow

And to all developers and users who have submitted Issues, PRs, and suggestions for Snaptium.

<img width="120" src="https://raw.githubusercontent.com/jetyu/Snaptium/main/electron/assets/images/siliconflow.png" alt="SiliconFlow logo" />

Special thanks to [SiliconFlow](https://siliconFlow.com) for providing AI model service support for Snaptium.

---

## Star history

[![Star History Chart](https://api.star-history.com/svg?repos=jetyu/Snaptium&type=Date)](https://star-history.com/#jetyu/Snaptium&Date)

