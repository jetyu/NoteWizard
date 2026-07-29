<p align="center">
  <img src="https://raw.githubusercontent.com/jetyu/Snaptium/main/electron/assets/logo/app-logo-128.png" alt="Snaptium アプリアイコン" width="88">
</p>
<h1 align="center">Snaptium</h1>

<p align="center">
  <a href="README.md">English</a> · <a href="README_zh-CN.md">简体中文</a> · <a href="README_zh-TW.md">繁體中文</a> ·
  <a href="README_ja-JP.md">日本語</a> · <a href="README_ko-KR.md">한국어</a> · <a href="README_id-ID.md">Bahasa Indonesia</a> ·
  <a href="README_es-ES.md">Español</a> · <a href="README_de-DE.md">Deutsch</a> · <a href="README_fr-FR.md">Français</a> ·
  <a href="README_it-IT.md">Italiano</a> · <a href="README_pt-BR.md">Português (Brasil)</a> · <a href="README_tr-TR.md">Türkçe</a>
</p>


<p align="center"><strong>エージェント型 AI を搭載した Markdown ノートアプリ</strong></p>

<p align="center">
  <a href="https://github.com/jetyu/Snaptium">
    <img src="https://img.shields.io/badge/GitHubで_Snaptiumを応援-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub で Star">
  </a>
</p>

<p align="center">
  <a href="https://snaptium.com">公式サイト</a> ·
  <a href="https://snaptium.com/docs">ドキュメント</a> ·
  <a href="https://snaptium.com/#download">Snaptium をダウンロード</a>
</p>

<p align="center">
  <a href="https://github.com/jetyu/Snaptium/actions/workflows/build.yml"><img src="https://github.com/jetyu/Snaptium/actions/workflows/build.yml/badge.svg?event=push" alt="Snaptium Release"></a>
  <a href="https://github.com/jetyu/Snaptium/releases/latest"><img src="https://img.shields.io/github/v/release/jetyu/Snaptium?style=flat&amp;logo=github" alt="最新リリース"></a>
  <img src="https://img.shields.io/github/v/release/jetyu/Snaptium?include_prereleases&amp;label=pre-release&amp;logo=github" alt="プレリリース">
  <a href="https://github.com/jetyu/Snaptium/releases"><img src="https://img.shields.io/github/downloads/jetyu/Snaptium/total?style=flat&amp;logo=github" alt="ダウンロード数"></a>
  <img src="https://img.shields.io/github/stars/jetyu/Snaptium?style=flat" alt="GitHub Stars">
  <img src="https://img.shields.io/github/forks/jetyu/Snaptium?style=flat" alt="GitHub Forks">
</p>

<p align="center">
  <a href="https://github.com/jetyu/Snaptium/issues"><img src="https://img.shields.io/github/issues/jetyu/Snaptium?style=flat&amp;color=orange" alt="未解決の Issue"></a>
  <a href="https://github.com/jetyu/Snaptium/issues?q=is%3Aissue%20state%3Aclosed"><img src="https://img.shields.io/github/issues-closed/jetyu/Snaptium?style=flat&amp;color=brightgreen" alt="解決済みの Issue"></a>
  <a href="https://github.com/jetyu/Snaptium/blob/main/LICENSE"><img src="https://img.shields.io/github/license/jetyu/Snaptium?style=flat" alt="ライセンス"></a>
</p>

Snaptium は、クロスプラットフォーム対応の AI Markdown ノート・ナレッジ管理アプリです。CodeMirror 6 エディター、AI ライティング支援、ローカルベクトルインデックス、RAG によるナレッジベース Q&A、クイックキャプチャ、WebDAV/S3 のエンドツーエンド暗号化同期をひとつのワークスペースに統合しています。

ノートは既定でローカルに保存され、保存先を自由に変更できます。Markdown のインポートとエクスポートにも対応し、Windows、macOS、Linux 上でクラウド AI と Ollama のローカルモデルを利用できます。

> Snaptium が役に立ったら、より多くの方に届くよう GitHub で Star をお願いします。

> **NoteWizard ユーザーの方へ：** NoteWizard は Snaptium に進化しました。旧版は [NoteWizard v1.2.1 リリースページ](https://github.com/jetyu/Snaptium/releases/tag/v1.2.1)から入手できます。

## 目次

- [Snaptium を選ぶ理由](#snaptium-を選ぶ理由)
- [主な機能](#主な機能)
- [画面とデモ](#画面とデモ)
- [技術スタック](#技術スタック)
- [対応プラットフォーム](#対応プラットフォーム)
- [ダウンロード](#ダウンロード)
- [ローカル開発](#ローカル開発)
- [よくある質問](#よくある質問)

## Snaptium を選ぶ理由

Snaptium は単なる Markdown ノートツールではありません。「長期的な執筆、知識の蓄積、ローカル AI ワークフロー」を中心に設計された、インテリジェントな執筆空間です。

重視していること：

- ローカルファースト
- データの自己管理
- 長期的に持続可能な保存
- 特定 AI に縛られない支援
- オフライン利用
- 一貫したクロスプラットフォーム体験

---

## 主な機能

| 機能 | 概要 |
|------|------|
| ✍️ 快適な Markdown 編集 | CodeMirror 6 を採用した高性能エディター。ライブプレビュー、同期スクロール、タスクリスト、表、強化されたコードブロック、カスタムショートカットに対応 |
| 📐 高品質な数式表示 | KaTeX による高速なインライン・ブロック数式。分数、平方根、上下付き文字、総和、積分、行列など一般的な LaTeX 表現をサポート |
| 💻 本格的なコード表示 | 24 種類以上の言語をシンタックスハイライトし、40 種類以上の一般的な別名を自動認識。JavaScript、TypeScript、Python、Java、Go、Rust、C/C++、SQL、Shell などに対応 |
| 📊 図表と可視化 | Mermaid を内蔵し、フローチャート、シーケンス図、クラス図、状態遷移図、ガントチャートなどを Markdown 内で描画 |
| 🤖 AI ライティングアシスタント | 3 段階の支援強度、5 種類の文体、7 種類の用途を用意。技術文書、企画書、会議要約、コンテンツ制作、知識整理を支援 |
| 🌐 マルチモデル AI | 公式 AI の無料枠に加え、OpenAI、Gemini、DeepSeek、OpenRouter、SiliconFlow、Qwen、Doubao、Kimi、Zhipu AI、Grok、Ollama、OpenAI 互換 API など 12 種類以上を BYOK で利用可能 |
| 🧠 ローカルナレッジベースと AI エージェント | LangChain を基盤に、ローカルノートのインデックス、ベクトル検索、セマンティック検索、任意のリランキング、Ask / Agent モードを提供 |
| 🔍 ハイブリッド検索 | 全文検索と AI セマンティック検索を組み合わせ、キーワードだけでなく意図に近い関連知識も発見 |
| 🔐 ローカルファーストの安全設計 | アカウント不要でノートを端末内に保存。AES-256-GCM、ワークスペースパスワード、リカバリーキーに対応 |
| ☁️ エンドツーエンド暗号化同期 | WebDAV、Amazon S3、Cloudflare R2、MinIO、NAS、セルフホスト環境を利用したクロスデバイス E2EE 同期 |
| 🗂️ 柔軟な知識整理 | ノートブック、タグ、お気に入りに加え、空白、日記、会議、読書、プロジェクト計画、タスクリストの 6 テンプレートを搭載 |
| ⚡ クイックキャプチャ | システムトレイとグローバルショートカットからノートを即座に作成し、ひらめきや会議メモを逃さず記録 |
| 🕒 履歴と復元 | ノートの変更履歴を確認し、過去の版やゴミ箱に移動した内容を復元 |
| 🔄 データポータビリティ | Markdown と Snaptium パッケージの入出力、Evernote ENEX の取り込み、単一ノートの PDF 出力に対応 |
| 🎨 きめ細かなカスタマイズ | システム連動・ライト・ダーク、5 色のアクセント、14 種類のフォント、エディター・プレビュー・UI ごとの個別フォント設定 |
| 🌍 マルチプラットフォーム・多言語 | Windows、macOS、Linux と 13 の言語・地域設定に対応 |
| 🛠️ 診断とメンテナンス | ログ、システム情報、アプリバージョン、ライセンス状態を含む診断レポートを出力し、問題解決を効率化 |

> AI 機能は既定で無効です。モデルと API はユーザーが明示的に設定します。

---

## 画面とデモ

### Markdown 編集モード

![Snaptium Markdown 編集画面](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/EditorDemo.png)

### Markdown プレビュー

![Snaptium Markdown プレビュー](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/PreviewOnly.png)

### AI スマートライティング

[![Snaptium AI スマートライティング](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/SmartWriting.png)](https://github.com/jetyu/Snaptium/blob/main/docs/Screenshots/v2/en-US/SmartWriting.mp4)

### ナレッジベース

[![Snaptium ローカルナレッジベース](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/KnowledgeBase.png)](https://github.com/jetyu/Snaptium/blob/main/docs/Screenshots/v2/en-US/KnowledgeBase.mp4)

---

## 技術スタック

### フロントエンド

- Vue 3.5.38
- TypeScript 6.0.3
- Vite 8.0.16
- Pinia 3.0.4
- Vue I18n 11.4.5
- CodeMirror 6

### デスクトップ

- Electron 43.2.0
- Electron Builder 26.15.3
- Electron Updater 6.8.9

### Markdown

- markdown-it
- KaTeX
- highlight.js

### AI・データ

- LanceDB
- Apache Arrow
- AWS SDK S3
- WebDAV
- LangChain
- Ollama

---

## 対応プラットフォーム

| OS | 対応バージョン | アーキテクチャ | パッケージ |
|----|----------------|----------------|------------|
| Windows | Windows 10 以降 | x64 | `.exe` |
| macOS | macOS 11 以降 | arm64 | `.dmg` |
| Linux | Ubuntu / Debian / Fedora など | x64 | `.deb` `.rpm` `.AppImage` |

---

## ダウンロード

### Windows

[![Snaptium-Windows-x64.exe](https://img.shields.io/badge/Snaptium--Windows--x64.exe-0078D4?style=flat-square&logo=windows&logoColor=white)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Windows-x64.exe)

### macOS

[![Snaptium-macOS-arm64.dmg](https://img.shields.io/badge/Snaptium--macOS--arm64.dmg-000000?style=flat-square&logo=apple&logoColor=white)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-macOS-arm64.dmg)

### Linux

[![DEB](https://img.shields.io/badge/Linux-DEB-FCC624?style=flat-square&logo=debian&logoColor=black)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x64.deb)
[![RPM](https://img.shields.io/badge/Linux-RPM-FCC624?style=flat-square&logo=redhat&logoColor=black)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x64.rpm)
[![AppImage](https://img.shields.io/badge/Linux-AppImage-FCC624?style=flat-square&logo=linux&logoColor=black)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x86_64.AppImage)

> [すべてのリリースを見る](https://github.com/jetyu/Snaptium/releases)

---

## ローカル開発

```bash
npm install
npm run dev
```

ビルド：

```bash
npm run dist
npm run dist:win
npm run dist:mac
npm run dist:linux
```

検証：

```bash
npm run typecheck
npm run lint
npm run test:unit
```

---

## ドキュメント

- https://snaptium.com/docs

---

## よくある質問

### Snaptium はローカルファーストの Markdown ノートアプリですか？

はい。ノートは既定でローカルに保存され、保存先を変更できます。基本的な編集機能にアカウントは必要ありません。

### ローカル AI モデルを利用できますか？

はい。Ollama のローカルモデルに加え、OpenAI、Gemini、DeepSeek、OpenRouter、SiliconFlow、互換 API を利用できます。AI 機能はユーザーが設定するまで無効です。

### 対応するインポート・エクスポート形式は？

Markdown と `.sppx` パッケージの入出力、Evernote `.enex` の取り込み、単一ノートの PDF 出力に対応します。

### 暗号化同期に対応していますか？

はい。WebDAV と S3 互換ストレージを使ったエンドツーエンド暗号化同期に対応し、Cloudflare R2、MinIO、プライベート NAS も利用できます。

### オープンソースですか？

はい。Apache License 2.0 で公開しています。

## ロードマップ

- 共同編集
- プラグインシステム
- モバイル対応
- より完全なオフラインナレッジベース

---

## ライセンス

Apache License 2.0。詳細は `LICENSE` を参照してください。

---

## 謝辞

Electron、Vue、CodeMirror、markdown-it、KaTeX、LanceDB、Apache Arrow、および Issue、PR、提案を寄せてくださるすべての方に感謝します。

<img width="120" src="https://raw.githubusercontent.com/jetyu/Snaptium/main/electron/assets/images/siliconflow.png" alt="SiliconFlow ロゴ" />

AI モデルサービスを通じて Snaptium を支援してくださる [SiliconFlow](https://siliconFlow.com) に特別な感謝を申し上げます。
