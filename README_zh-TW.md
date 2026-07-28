<p align="center"><img src="https://raw.githubusercontent.com/jetyu/Snaptium/main/electron/assets/logo/app-logo-128.png" alt="Snaptium 應用程式圖示" width="88"></p>
<h1 align="center">Snaptium</h1>

<p align="center">
  <a href="README.md">English</a> · <a href="README_zh-CN.md">简体中文</a> · <a href="README_zh-TW.md">繁體中文</a> ·
  <a href="README_ja-JP.md">日本語</a> · <a href="README_ko-KR.md">한국어</a> · <a href="README_id-ID.md">Bahasa Indonesia</a> ·
  <a href="README_es-ES.md">Español</a> · <a href="README_de-DE.md">Deutsch</a> · <a href="README_fr-FR.md">Français</a> ·
  <a href="README_it-IT.md">Italiano</a> · <a href="README_pt-BR.md">Português (Brasil)</a> · <a href="README_tr-TR.md">Türkçe</a>
</p>

<p align="center"><strong>AI 智慧代理驅動的 Markdown 筆記軟體</strong></p>
<p align="center"><a href="https://snaptium.com">官方網站</a> · <a href="https://snaptium.com/docs">使用文件</a> · <a href="https://snaptium.com/#download">下載</a> · <a href="https://github.com/jetyu/Snaptium">GitHub Star</a></p>

Snaptium 是跨平台 AI Markdown 筆記與知識管理軟體，整合 CodeMirror 6 編輯器、AI 輔助寫作、本機向量知識索引、RAG 知識庫問答、快速記錄，以及 WebDAV/S3 端對端加密同步。

筆記預設儲存在本機，不強制註冊，且可自訂儲存路徑。支援 Windows、macOS、Linux、雲端 AI 服務與 Ollama 本機模型。

## 核心功能

| 功能 | 說明 |
|------|------|
| ✍️ Markdown 與數學公式 | 即時預覽與同步捲動；KaTeX 支援行內、區塊公式、分數、根式、求和、積分與矩陣 |
| 💻 程式碼與圖表 | 24+ 種語法高亮、40+ 常用語言別名自動辨識，以及 Mermaid 圖表渲染 |
| 🤖 AI 智慧寫作 | 3 種寫作強度、5 種文風與 7 類場景，涵蓋技術文件、產品方案、摘要與內容創作 |
| 🌐 多模型生態 | 官方免費額度及 12+ BYOK 服務，包括 OpenAI、Gemini、DeepSeek、OpenRouter、SiliconFlow、Qwen、Kimi、Ollama 與相容 API |
| 🧠 知識庫與 AI 代理 | 以 LangChain 建立本機索引、向量與語意搜尋、RAG、可選重排及 Ask / Agent 模式 |
| 🔐 本機優先安全 | AES-256-GCM、工作區密碼、恢復金鑰，以及透過 WebDAV、S3、R2、MinIO 或 NAS 的端對端加密同步 |
| 🗂️ 組織與恢復 | 筆記本、標籤、收藏、6 種範本、全文搜尋、版本歷史與資源回收筒 |
| 🔄 資料可攜性 | Markdown 與 `.sppx` 匯入匯出、Evernote `.enex` 匯入及 PDF 匯出 |
| 🎨 個人化 | 3 種外觀、5 種主題色、14 套字型，編輯器、預覽與應用程式介面可分別設定 |
| 🌍 跨平台與多語言 | Windows、macOS、Linux，以及 13 種語言與地區設定 |

> AI 功能預設關閉，模型與 API 均由使用者主動設定。

## 介面

![Snaptium Markdown 編輯器](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/EditorDemo.png)

[![AI 智慧寫作](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/SmartWriting.png)](https://github.com/jetyu/Snaptium/blob/main/docs/Screenshots/v2/en-US/SmartWriting.mp4)

## 下載

[![Windows](https://img.shields.io/badge/Windows-x64-0078D4?style=flat-square&logo=windows&logoColor=white)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Windows-x64.exe)
[![macOS](https://img.shields.io/badge/macOS-Apple_Silicon-000000?style=flat-square&logo=apple&logoColor=white)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-macOS-arm64.dmg)
[![Linux](https://img.shields.io/badge/Linux-AppImage-FCC624?style=flat-square&logo=linux&logoColor=black)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x86_64.AppImage)

Linux：[DEB](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x64.deb) · [RPM](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x64.rpm) · [所有版本](https://github.com/jetyu/Snaptium/releases)

## 本機開發

```bash
npm install
npm run dev
npm run typecheck
```

## 常見問題

**資料是否儲存在本機？** 是。筆記預設儲存在本機，路徑可自訂。

**是否支援本機 AI？** 是。支援 Ollama、OpenAI、Gemini、DeepSeek、OpenRouter、SiliconFlow 與相容 API。

**同步是否加密？** 是。WebDAV 與 S3 相容儲存支援端對端加密。

**是否開放原始碼？** 是，採用 Apache License 2.0，詳見 `LICENSE`。

規劃功能：協作編輯、外掛系統、行動裝置支援，以及更完整的離線知識庫。

感謝 Electron、Vue、CodeMirror、markdown-it、KaTeX、LanceDB、Apache Arrow 與所有貢獻者，並特別感謝 [SiliconFlow](https://siliconFlow.com)。
