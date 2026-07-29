<p align="center">
  <img src="https://raw.githubusercontent.com/jetyu/Snaptium/main/electron/assets/logo/app-logo-128.png" alt="Snaptium App-Symbol" width="88">
</p>
<h1 align="center">Snaptium</h1>

<p align="center">
  <a href="README.md">English</a> · <a href="README_zh-CN.md">简体中文</a> · <a href="README_zh-TW.md">繁體中文</a> ·
  <a href="README_ja-JP.md">日本語</a> · <a href="README_ko-KR.md">한국어</a> · <a href="README_id-ID.md">Bahasa Indonesia</a> ·
  <a href="README_es-ES.md">Español</a> · <a href="README_de-DE.md">Deutsch</a> · <a href="README_fr-FR.md">Français</a> ·
  <a href="README_it-IT.md">Italiano</a> · <a href="README_pt-BR.md">Português (Brasil)</a> · <a href="README_tr-TR.md">Türkçe</a>
</p>



<p align="center"><strong>Markdown-Notizen mit agentenbasierter KI</strong></p>

<p align="center">
  <a href="https://github.com/jetyu/Snaptium"><img src="https://img.shields.io/badge/Snaptium_auf_GitHub_unterstützen-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Star"></a>
</p>

<p align="center">
  <a href="https://snaptium.com">Website</a> ·
  <a href="https://snaptium.com/docs">Dokumentation</a> ·
  <a href="https://snaptium.com/#download">Snaptium herunterladen</a>
</p>

<p align="center">
  <a href="https://github.com/jetyu/Snaptium/actions/workflows/build.yml"><img src="https://github.com/jetyu/Snaptium/actions/workflows/build.yml/badge.svg?event=push" alt="Build"></a>
  <a href="https://github.com/jetyu/Snaptium/releases/latest"><img src="https://img.shields.io/github/v/release/jetyu/Snaptium?style=flat&amp;logo=github" alt="Neueste Version"></a>
  <a href="https://github.com/jetyu/Snaptium/releases"><img src="https://img.shields.io/github/downloads/jetyu/Snaptium/total?style=flat&amp;logo=github" alt="Downloads"></a>
  <img src="https://img.shields.io/github/stars/jetyu/Snaptium?style=flat" alt="GitHub Stars">
  <img src="https://img.shields.io/github/forks/jetyu/Snaptium?style=flat" alt="GitHub Forks">
  <a href="https://github.com/jetyu/Snaptium/blob/main/LICENSE"><img src="https://img.shields.io/github/license/jetyu/Snaptium?style=flat" alt="Lizenz"></a>
</p>

Snaptium ist eine plattformübergreifende Anwendung für KI-gestützte Markdown-Notizen und Wissensmanagement. Sie vereint einen CodeMirror-6-Editor, KI-Schreibunterstützung, einen lokalen Vektorindex, RAG-Fragen und -Antworten, Schnellerfassung sowie Ende-zu-Ende-verschlüsselte WebDAV/S3-Synchronisierung.

Notizen werden standardmäßig lokal gespeichert; der Speicherort ist frei wählbar. Snaptium unterstützt Markdown-Import und -Export, läuft unter Windows, macOS und Linux und kann sowohl Cloud-KI als auch lokale Ollama-Modelle verwenden.

> Wenn Snaptium hilfreich ist, freuen wir uns über einen GitHub Star.

> **Für NoteWizard-Nutzer:** NoteWizard wurde zu Snaptium weiterentwickelt. Die ältere Version steht auf der [Release-Seite von NoteWizard v1.2.1](https://github.com/jetyu/Snaptium/releases/tag/v1.2.1) bereit.

## Inhalt

- [Warum Snaptium](#warum-snaptium)
- [Kernfunktionen](#kernfunktionen)
- [Screenshots und Demos](#screenshots-und-demos)
- [Technologien](#technologien)
- [Unterstützte Plattformen](#unterstützte-plattformen)
- [Download](#download)
- [Lokale Entwicklung](#lokale-entwicklung)
- [Häufig gestellte Fragen](#häufig-gestellte-fragen)

## Warum Snaptium

Snaptium ist mehr als ein Markdown-Notizprogramm. Es ist ein intelligenter Schreibraum für langfristiges Schreiben, nachhaltigen Wissensaufbau und lokale KI-Workflows.

- Local-First-Architektur
- Datensouveränität
- Nachhaltige Langzeitspeicherung
- KI-Unterstützung ohne Anbieterbindung
- Offline-Nutzung
- Einheitliche plattformübergreifende Bedienung

---

## Kernfunktionen

| Funktion | Beschreibung |
|----------|--------------|
| ✍️ Fokussiertes Markdown-Schreiben | Leistungsfähiger CodeMirror-6-Editor mit Live-Vorschau, synchronem Scrollen, Aufgabenlisten, Tabellen, erweiterten Codeblöcken und anpassbaren Tastenkürzeln |
| 📐 Mathematische Formeln | Schnelles KaTeX-Rendering für Inline- und Blockformeln, darunter Brüche, Wurzeln, Hoch- und Tiefstellung, Summen, Integrale, Matrizen und weitere LaTeX-Ausdrücke |
| 💻 Professionelle Codedarstellung | Syntaxhervorhebung für mehr als 24 Sprachen und automatische Erkennung von über 40 Aliasnamen, darunter JavaScript, TypeScript, Python, Java, Go, Rust, C/C++, SQL und Shell |
| 📊 Diagramme und Visualisierung | Integriertes Mermaid für Fluss-, Sequenz-, Klassen-, Zustands- und Gantt-Diagramme sowie weitere technische Visualisierungen |
| 🤖 KI-Schreibassistent | Drei Unterstützungsstärken, fünf Schreibstile und sieben Szenarien für technische Dokumente, Konzepte, Besprechungszusammenfassungen, Inhalte und Wissensorganisation |
| 🌐 Multi-Modell-Ökosystem | Kostenloses Kontingent des offiziellen KI-Dienstes sowie BYOK für über 12 Anbieter: OpenAI, Gemini, DeepSeek, OpenRouter, SiliconFlow, Qwen, Doubao, Kimi, Zhipu AI, Grok, Ollama und kompatible APIs |
| 🧠 Lokale Wissensbasis und KI-Agent | LangChain-basiertes System mit lokaler Indexierung, Vektor- und semantischer Suche, optionalem Reranking sowie Ask- und Agent-Modus |
| 🔍 Hybride intelligente Suche | Kombiniert Volltext- und semantische KI-Suche, um exakte Begriffe, gemeinte Inhalte und verwandtes Wissen zu finden |
| 🔐 Local-First-Datenschutz | Kein Konto erforderlich; lokale Speicherung, AES-256-GCM, Arbeitsbereichspasswort und Wiederherstellungsschlüssel |
| ☁️ Ende-zu-Ende-verschlüsselte Synchronisierung | Geräteübergreifende E2EE-Synchronisierung über WebDAV, Amazon S3, Cloudflare R2, MinIO, NAS oder selbst gehosteten Speicher |
| 🗂️ Flexible Wissensorganisation | Notizbücher, Tags, Favoriten und sechs Vorlagen: leer, Tagebuch, Besprechung, Lektüre, Projektplan und Aufgabenliste |
| ⚡ Schnellerfassung | Über Taskleiste oder globales Tastenkürzel sofort eine Notiz für Ideen und Besprechungen erstellen |
| 🕒 Versionsverlauf und Wiederherstellung | Frühere Bearbeitungsstände ansehen und Inhalte über Versionsverlauf oder Papierkorb wiederherstellen |
| 🔄 Offene Datenportabilität | Markdown- und Snaptium-Pakete importieren und exportieren, Evernote ENEX importieren und einzelne Notizen als PDF ausgeben |
| 🎨 Umfangreiche Anpassung | System-, helles und dunkles Design, fünf Akzentfarben, 14 Schriftarten und getrennte Schrifteinstellungen für Editor, Vorschau und Oberfläche |
| 🌍 Plattformübergreifend und mehrsprachig | Windows, macOS und Linux mit 13 Sprachen und Regionseinstellungen |
| 🛠️ Diagnose | Diagnosebericht mit Protokollen, Systemdaten, App-Version und Lizenzstatus für eine schnellere Fehleranalyse |

> KI-Funktionen sind standardmäßig deaktiviert. Modelle und API-Zugänge werden ausdrücklich vom Nutzer eingerichtet.

---

## Screenshots und Demos

### Markdown-Editor

![Snaptium Markdown-Editor](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/EditorDemo.png)

### Markdown-Vorschau

![Snaptium Markdown-Vorschau](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/PreviewOnly.png)

### Intelligentes Schreiben mit KI

[![KI-Schreibdemo](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/SmartWriting.png)](https://github.com/jetyu/Snaptium/blob/main/docs/Screenshots/v2/en-US/SmartWriting.mp4)

### Wissensbasis

[![Lokale Wissensbasis](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/KnowledgeBase.png)](https://github.com/jetyu/Snaptium/blob/main/docs/Screenshots/v2/en-US/KnowledgeBase.mp4)

---

## Technologien

- **Frontend:** Vue 3.5.38, TypeScript 6.0.3, Vite 8.0.16, Pinia 3.0.4, Vue I18n 11.4.5, CodeMirror 6
- **Desktop:** Electron 43.2.0, Electron Builder 26.15.3, Electron Updater 6.8.9
- **Markdown:** markdown-it, KaTeX, highlight.js
- **KI und Daten:** LanceDB, Apache Arrow, AWS SDK S3, WebDAV, LangChain, Ollama

---

## Unterstützte Plattformen

| Betriebssystem | Version | Architektur | Pakete |
|----------------|---------|--------------|--------|
| Windows | Windows 10 oder neuer | x64 | `.exe` |
| macOS | macOS 11 oder neuer | arm64 | `.dmg` |
| Linux | Ubuntu, Debian, Fedora und weitere gängige Distributionen | x64 | `.deb` `.rpm` `.AppImage` |

---

## Download

[![Windows](https://img.shields.io/badge/Windows-x64-0078D4?style=flat-square&logo=windows&logoColor=white)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Windows-x64.exe)
[![macOS](https://img.shields.io/badge/macOS-Apple_Silicon-000000?style=flat-square&logo=apple&logoColor=white)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-macOS-arm64.dmg)
[![AppImage](https://img.shields.io/badge/Linux-AppImage-FCC624?style=flat-square&logo=linux&logoColor=black)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x86_64.AppImage)

Linux ist außerdem als [DEB](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x64.deb) und [RPM](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x64.rpm) verfügbar. [Alle Releases anzeigen](https://github.com/jetyu/Snaptium/releases).

---

## Lokale Entwicklung

```bash
npm install
npm run dev
```

```bash
npm run dist
npm run dist:win
npm run dist:mac
npm run dist:linux
```

```bash
npm run typecheck
npm run lint
npm run test:unit
```

## Dokumentation

- https://snaptium.com/docs

---

## Häufig gestellte Fragen

### Ist Snaptium eine Local-First-App für Markdown-Notizen?

Ja. Notizen liegen standardmäßig lokal, der Speicherort ist konfigurierbar und die grundlegende Bearbeitung erfordert kein Konto.

### Kann Snaptium lokale KI-Modelle verwenden?

Ja. Snaptium unterstützt Ollama sowie OpenAI, Gemini, DeepSeek, OpenRouter, SiliconFlow und kompatible APIs. KI bleibt deaktiviert, bis sie eingerichtet wird.

### Welche Formate lassen sich importieren und exportieren?

Markdown und `.sppx`-Pakete können importiert und exportiert werden. Evernote `.enex` lässt sich importieren, einzelne Notizen können als PDF exportiert werden.

### Wird verschlüsselte Synchronisierung unterstützt?

Ja. E2EE-Synchronisierung ist über WebDAV und S3-kompatiblen Speicher einschließlich Cloudflare R2, MinIO und privaten NAS möglich.

### Ist Snaptium Open Source?

Ja. Snaptium steht unter der Apache License 2.0.

## Roadmap

- Gemeinsame Bearbeitung
- Plugin-System
- Mobile Apps
- Umfassendere Offline-Wissensbasis

## Lizenz und Danksagung

Snaptium verwendet die Apache License 2.0. Einzelheiten stehen in `LICENSE`.

Vielen Dank an Electron, Vue, CodeMirror, markdown-it, KaTeX, LanceDB, Apache Arrow und alle Mitwirkenden.

<img width="120" src="https://raw.githubusercontent.com/jetyu/Snaptium/main/electron/assets/images/siliconflow.png" alt="SiliconFlow Logo" />

Besonderer Dank gilt [SiliconFlow](https://siliconFlow.com) für die Unterstützung mit KI-Modelldiensten.
