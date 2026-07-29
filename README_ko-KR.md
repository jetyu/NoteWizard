<p align="center">
  <img src="https://raw.githubusercontent.com/jetyu/Snaptium/main/electron/assets/logo/app-logo-128.png" alt="Snaptium 앱 아이콘" width="88">
</p>
<h1 align="center">Snaptium</h1>

<p align="center">
  <a href="README.md">English</a> · <a href="README_zh-CN.md">简体中文</a> · <a href="README_zh-TW.md">繁體中文</a> ·
  <a href="README_ja-JP.md">日本語</a> · <a href="README_ko-KR.md">한국어</a> · <a href="README_es-ES.md">Español</a> ·
  <a href="README_de-DE.md">Deutsch</a> · <a href="README_fr-FR.md">Français</a> · <a href="README_it-IT.md">Italiano</a> ·
  <a href="README_pt-BR.md">Português (Brasil)</a> · <a href="README_tr-TR.md">Türkçe</a>
</p>

<p align="center"><strong>에이전틱 AI 기반 Markdown 노트 앱</strong></p>

<p align="center">
  <a href="https://github.com/jetyu/Snaptium">
    <img src="https://img.shields.io/badge/GitHub에서_Snaptium_응원하기-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Star">
  </a>
</p>

<p align="center">
  <a href="https://snaptium.com">공식 웹사이트</a> ·
  <a href="https://snaptium.com/docs">문서</a> ·
  <a href="https://snaptium.com/#download">Snaptium 다운로드</a>
</p>

<p align="center">
  <a href="https://github.com/jetyu/Snaptium/actions/workflows/build.yml"><img src="https://github.com/jetyu/Snaptium/actions/workflows/build.yml/badge.svg?event=push" alt="Snaptium Release"></a>
  <a href="https://github.com/jetyu/Snaptium/releases/latest"><img src="https://img.shields.io/github/v/release/jetyu/Snaptium?style=flat&amp;logo=github" alt="최신 릴리스"></a>
  <img src="https://img.shields.io/github/v/release/jetyu/Snaptium?include_prereleases&amp;label=pre-release&amp;logo=github" alt="프리릴리스">
  <a href="https://github.com/jetyu/Snaptium/releases"><img src="https://img.shields.io/github/downloads/jetyu/Snaptium/total?style=flat&amp;logo=github" alt="다운로드"></a>
  <img src="https://img.shields.io/github/stars/jetyu/Snaptium?style=flat" alt="GitHub Stars">
  <img src="https://img.shields.io/github/forks/jetyu/Snaptium?style=flat" alt="GitHub Forks">
</p>

<p align="center">
  <a href="https://github.com/jetyu/Snaptium/issues"><img src="https://img.shields.io/github/issues/jetyu/Snaptium?style=flat&amp;color=orange" alt="열린 Issue"></a>
  <a href="https://github.com/jetyu/Snaptium/issues?q=is%3Aissue%20state%3Aclosed"><img src="https://img.shields.io/github/issues-closed/jetyu/Snaptium?style=flat&amp;color=brightgreen" alt="닫힌 Issue"></a>
  <a href="https://github.com/jetyu/Snaptium/blob/main/LICENSE"><img src="https://img.shields.io/github/license/jetyu/Snaptium?style=flat" alt="라이선스"></a>
</p>

Snaptium은 크로스 플랫폼 AI Markdown 노트 및 지식 관리 앱입니다. CodeMirror 6 편집기, AI 글쓰기 지원, 로컬 벡터 지식 인덱스, RAG 지식 베이스 Q&A, 빠른 기록, WebDAV/S3 종단 간 암호화 동기화를 하나의 작업 공간에 통합합니다.

노트는 기본적으로 로컬에 저장되며 저장 경로를 직접 지정할 수 있습니다. Markdown 가져오기와 내보내기를 지원하고 Windows, macOS, Linux에서 클라우드 AI와 Ollama 로컬 모델을 함께 사용할 수 있습니다.

> Snaptium이 유용하다면 더 많은 사용자가 발견할 수 있도록 GitHub Star를 눌러 주세요.

> **NoteWizard 사용자:** NoteWizard는 Snaptium으로 발전했습니다. 이전 버전은 [NoteWizard v1.2.1 릴리스 페이지](https://github.com/jetyu/Snaptium/releases/tag/v1.2.1)에서 받을 수 있습니다.

## 목차

- [Snaptium을 선택하는 이유](#snaptium을-선택하는-이유)
- [핵심 기능](#핵심-기능)
- [화면 및 데모](#화면-및-데모)
- [기술 스택](#기술-스택)
- [지원 플랫폼](#지원-플랫폼)
- [다운로드](#다운로드)
- [로컬 개발](#로컬-개발)
- [자주 묻는 질문](#자주-묻는-질문)

## Snaptium을 선택하는 이유

Snaptium은 단순한 Markdown 노트 도구가 아닙니다. 장기적인 글쓰기, 지식 축적, 로컬 AI 워크플로를 중심으로 설계한 지능형 글쓰기 공간입니다.

핵심 원칙:

- 로컬 우선
- 데이터 주권
- 지속 가능한 장기 보관
- 특정 AI에 종속되지 않는 지원
- 오프라인 사용
- 일관된 크로스 플랫폼 경험

---

## 핵심 기능

| 기능 | 설명 |
|------|------|
| ✍️ 몰입형 Markdown 편집 | CodeMirror 6 기반 고성능 편집기, 실시간 미리보기, 동기 스크롤, 작업 목록, 표, 향상된 코드 블록, 사용자 지정 단축키 지원 |
| 📐 강력한 수식 지원 | KaTeX로 인라인 및 블록 수식을 빠르게 렌더링하며 분수, 근호, 위·아래 첨자, 합, 적분, 행렬 등 일반적인 LaTeX 표현 지원 |
| 💻 전문적인 코드 표현 | 24개 이상의 언어 구문 강조와 40개 이상의 일반 별칭 자동 인식. JavaScript, TypeScript, Python, Java, Go, Rust, C/C++, SQL, Shell 등 지원 |
| 📊 다이어그램과 시각화 | Mermaid를 내장하여 순서도, 시퀀스 다이어그램, 클래스 다이어그램, 상태 다이어그램, 간트 차트 등을 Markdown에서 렌더링 |
| 🤖 AI 글쓰기 도우미 | 3단계 지원 강도, 5가지 문체, 7가지 시나리오로 기술 문서, 제품 제안서, 회의 요약, 콘텐츠 제작, 지식 정리 지원 |
| 🌐 멀티 모델 AI 생태계 | 공식 AI 무료 할당량과 12개 이상의 BYOK 제공자 지원: OpenAI, Gemini, DeepSeek, OpenRouter, SiliconFlow, Qwen, Doubao, Kimi, Zhipu AI, Grok, Ollama, OpenAI 호환 API |
| 🧠 로컬 지식 베이스와 AI 에이전트 | LangChain 기반 로컬 노트 인덱싱, 벡터 검색, 의미 검색, 선택적 재정렬, Ask / Agent 모드로 개인 지식 Q&A와 작업 처리 |
| 🔍 하이브리드 지능형 검색 | 전문 검색과 AI 의미 검색을 결합해 정확한 키워드뿐 아니라 의도와 관련된 지식도 발견 |
| 🔐 로컬 우선 데이터 보안 | 계정 없이 노트를 기기에 기본 저장하며 AES-256-GCM 암호화, 작업 공간 비밀번호, 복구 키 지원 |
| ☁️ 종단 간 암호화 동기화 | WebDAV, Amazon S3, Cloudflare R2, MinIO, NAS, 자체 호스팅 저장소를 통한 기기 간 E2EE 동기화 |
| 🗂️ 유연한 지식 구성 | 노트북, 태그, 즐겨찾기와 빈 노트, 일지, 회의, 독서, 프로젝트 계획, 작업 목록의 6개 템플릿 |
| ⚡ 빠른 기록 | 시스템 트레이와 전역 단축키로 즉시 노트를 만들어 아이디어와 회의 메모를 빠르게 기록 |
| 🕒 버전 기록과 복구 | 노트의 이전 수정본을 확인하고 버전 기록이나 휴지통에서 내용을 복구 |
| 🔄 개방형 데이터 이동성 | Markdown 및 Snaptium 패키지 가져오기/내보내기, Evernote ENEX 가져오기, 개별 노트 PDF 내보내기 |
| 🎨 세밀한 개인화 | 시스템·라이트·다크 모드, 5개 강조색, 14개 글꼴과 편집기·미리보기·앱 UI별 독립 글꼴 설정 |
| 🌍 크로스 플랫폼 및 다국어 | Windows, macOS, Linux와 13개 언어 및 지역 설정 지원 |
| 🛠️ 진단과 유지 관리 | 실행 로그, 시스템 정보, 앱 버전, 라이선스 상태가 포함된 진단 보고서로 문제 해결 시간 단축 |

> AI 기능은 기본적으로 꺼져 있습니다. 모델과 API는 사용자가 직접 설정합니다.

---

## 화면 및 데모

### Markdown 편집 모드

![Snaptium Markdown 편집기](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/EditorDemo.png)

### Markdown 미리보기

![Snaptium Markdown 미리보기](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/PreviewOnly.png)

### AI 스마트 글쓰기

[![Snaptium AI 스마트 글쓰기](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/SmartWriting.png)](https://github.com/jetyu/Snaptium/blob/main/docs/Screenshots/v2/en-US/SmartWriting.mp4)

### 지식 베이스

[![Snaptium 로컬 지식 베이스](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/KnowledgeBase.png)](https://github.com/jetyu/Snaptium/blob/main/docs/Screenshots/v2/en-US/KnowledgeBase.mp4)

---

## 기술 스택

### 프런트엔드

- Vue 3.5.38
- TypeScript 6.0.3
- Vite 8.0.16
- Pinia 3.0.4
- Vue I18n 11.4.5
- CodeMirror 6

### 데스크톱

- Electron 43.2.0
- Electron Builder 26.15.3
- Electron Updater 6.8.9

### Markdown

- markdown-it
- KaTeX
- highlight.js

### AI 및 데이터

- LanceDB
- Apache Arrow
- AWS SDK S3
- WebDAV
- LangChain
- Ollama

---

## 지원 플랫폼

| 운영 체제 | 지원 버전 | 아키텍처 | 패키지 |
|-----------|-----------|----------|--------|
| Windows | Windows 10 이상 | x64 | `.exe` |
| macOS | macOS 11 이상 | arm64 | `.dmg` |
| Linux | Ubuntu / Debian / Fedora 등 | x64 | `.deb` `.rpm` `.AppImage` |

---

## 다운로드

### Windows

[![Windows](https://img.shields.io/badge/Windows-x64-0078D4?style=flat-square&logo=windows&logoColor=white)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Windows-x64.exe)

### macOS

[![macOS](https://img.shields.io/badge/macOS-Apple_Silicon-000000?style=flat-square&logo=apple&logoColor=white)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-macOS-arm64.dmg)

### Linux

[![DEB](https://img.shields.io/badge/Linux-DEB-FCC624?style=flat-square&logo=debian&logoColor=black)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x64.deb)
[![RPM](https://img.shields.io/badge/Linux-RPM-FCC624?style=flat-square&logo=redhat&logoColor=black)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x64.rpm)
[![AppImage](https://img.shields.io/badge/Linux-AppImage-FCC624?style=flat-square&logo=linux&logoColor=black)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x86_64.AppImage)

> [모든 릴리스 보기](https://github.com/jetyu/Snaptium/releases)

---

## 로컬 개발

```bash
npm install
npm run dev
```

빌드:

```bash
npm run dist
npm run dist:win
npm run dist:mac
npm run dist:linux
```

검증:

```bash
npm run typecheck
npm run lint
npm run test:unit
```

---

## 문서

- https://snaptium.com/docs

---

## 자주 묻는 질문

### Snaptium은 로컬 우선 Markdown 노트 앱인가요?

네. 노트는 기본적으로 로컬에 저장되며 저장 경로를 변경할 수 있습니다. 핵심 편집 기능에 계정이 필요하지 않습니다.

### 로컬 AI 모델을 사용할 수 있나요?

네. Ollama 로컬 모델과 OpenAI, Gemini, DeepSeek, OpenRouter, SiliconFlow 및 호환 API를 지원합니다. AI 기능은 사용자가 설정할 때까지 비활성화됩니다.

### 어떤 가져오기 및 내보내기 형식을 지원하나요?

Markdown과 `.sppx` 패키지 가져오기/내보내기, Evernote `.enex` 가져오기, 개별 노트 PDF 내보내기를 지원합니다.

### 암호화 동기화를 지원하나요?

네. WebDAV와 S3 호환 스토리지를 통한 종단 간 암호화 동기화를 지원하며 Cloudflare R2, MinIO, 개인 NAS도 사용할 수 있습니다.

### 오픈 소스인가요?

네. Apache License 2.0으로 공개됩니다.

## 로드맵

- 공동 편집
- 플러그인 시스템
- 모바일 지원
- 더욱 완전한 오프라인 지식 베이스

---

## 라이선스

Apache License 2.0. 자세한 내용은 `LICENSE`를 참조하세요.

---

## 감사의 말

Electron, Vue, CodeMirror, markdown-it, KaTeX, LanceDB, Apache Arrow 및 Issue, PR, 제안을 보내 주신 모든 분께 감사드립니다.

<img width="120" src="https://raw.githubusercontent.com/jetyu/Snaptium/main/electron/assets/images/siliconflow.png" alt="SiliconFlow 로고" />

AI 모델 서비스로 Snaptium을 지원하는 [SiliconFlow](https://siliconFlow.com)에 특별히 감사드립니다.
