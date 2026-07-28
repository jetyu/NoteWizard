<p align="center"><img src="https://raw.githubusercontent.com/jetyu/Snaptium/main/electron/assets/logo/app-logo-128.png" alt="Icona Snaptium" width="88"></p>
<h1 align="center">Snaptium</h1>

<p align="center">
  <a href="README.md">English</a> · <a href="README_zh-CN.md">简体中文</a> · <a href="README_zh-TW.md">繁體中文</a> ·
  <a href="README_ja-JP.md">日本語</a> · <a href="README_ko-KR.md">한국어</a> · <a href="README_id-ID.md">Bahasa Indonesia</a> ·
  <a href="README_es-ES.md">Español</a> · <a href="README_de-DE.md">Deutsch</a> · <a href="README_fr-FR.md">Français</a> ·
  <a href="README_it-IT.md">Italiano</a> · <a href="README_pt-BR.md">Português (Brasil)</a> · <a href="README_tr-TR.md">Türkçe</a>
</p>


<p align="center"><strong>Note Markdown basate su agenti IA</strong></p>
<p align="center"><a href="https://snaptium.com">Sito web</a> · <a href="https://snaptium.com/docs">Documentazione</a> · <a href="https://snaptium.com/#download">Download</a> · <a href="https://github.com/jetyu/Snaptium">GitHub Star</a></p>

Snaptium è un'app multipiattaforma per note Markdown e gestione della conoscenza con IA. Riunisce editor CodeMirror 6, assistenza alla scrittura, indice vettoriale locale, Q&A RAG, acquisizione rapida e sincronizzazione WebDAV/S3 con crittografia end-to-end.

Le note restano sul dispositivo per impostazione predefinita, senza obbligo di registrazione. Snaptium funziona su Windows, macOS e Linux con servizi IA cloud o modelli locali Ollama.

## Funzioni principali

| Funzione | Descrizione |
|----------|-------------|
| ✍️ Markdown e formule | Anteprima live e scorrimento sincronizzato; KaTeX per formule inline e a blocco, frazioni, radici, somme, integrali e matrici |
| 💻 Codice e diagrammi | Evidenziazione per oltre 24 linguaggi, riconoscimento di oltre 40 alias e rendering Mermaid |
| 🤖 Scrittura con IA | 3 intensità, 5 stili e 7 scenari per documenti tecnici, proposte, riepiloghi e creazione di contenuti |
| 🌐 Ecosistema multimodello | Quota gratuita ufficiale e BYOK per oltre 12 servizi: OpenAI, Gemini, DeepSeek, OpenRouter, SiliconFlow, Qwen, Kimi, Ollama e API compatibili |
| 🧠 Conoscenza e agente IA | Indicizzazione locale, ricerca vettoriale e semantica, RAG, reranking opzionale e modalità Ask / Agent basate su LangChain |
| 🔐 Sicurezza local-first | AES-256-GCM, password dell'area di lavoro, chiave di recupero e sincronizzazione E2EE via WebDAV, S3, R2, MinIO o NAS |
| 🗂️ Organizzazione e recupero | Quaderni, tag, preferiti, 6 modelli, ricerca full-text, cronologia versioni e cestino |
| 🔄 Portabilità | Import/export Markdown e `.sppx`, import Evernote `.enex` ed export PDF |
| 🎨 Personalizzazione | 3 modalità grafiche, 5 colori, 14 font e impostazioni separate per editor, anteprima e interfaccia |
| 🌍 Multipiattaforma | Windows, macOS, Linux e 13 lingue e impostazioni regionali |

> Le funzioni IA sono disattivate per impostazione predefinita e vengono configurate dall'utente.

## Schermate

![Editor Markdown Snaptium](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/EditorDemo.png)

[![Scrittura IA](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/SmartWriting.png)](https://github.com/jetyu/Snaptium/blob/main/docs/Screenshots/v2/en-US/SmartWriting.mp4)

[![Knowledge base](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/KnowledgeBase.png)](https://github.com/jetyu/Snaptium/blob/main/docs/Screenshots/v2/en-US/KnowledgeBase.mp4)

## Download

[![Windows](https://img.shields.io/badge/Windows-x64-0078D4?style=flat-square&logo=windows&logoColor=white)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Windows-x64.exe)
[![macOS](https://img.shields.io/badge/macOS-Apple_Silicon-000000?style=flat-square&logo=apple&logoColor=white)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-macOS-arm64.dmg)
[![Linux](https://img.shields.io/badge/Linux-AppImage-FCC624?style=flat-square&logo=linux&logoColor=black)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x86_64.AppImage)

Linux: [DEB](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x64.deb) · [RPM](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x64.rpm) · [Tutte le versioni](https://github.com/jetyu/Snaptium/releases)

## Sviluppo locale

```bash
npm install
npm run dev
npm run typecheck
```

## Domande frequenti

**I dati sono locali?** Sì. Le note sono locali per impostazione predefinita e il percorso è configurabile.

**Sono supportati modelli IA locali?** Sì, tramite Ollama. Sono disponibili anche OpenAI, Gemini, DeepSeek, OpenRouter, SiliconFlow e API compatibili.

**La sincronizzazione è cifrata?** Sì, WebDAV e storage compatibile S3 supportano la crittografia end-to-end.

**È open source?** Sì, con licenza Apache 2.0. Consulta `LICENSE`.

## Roadmap

Modifica collaborativa, sistema di plugin, supporto mobile e knowledge base offline più completa.

Grazie a Electron, Vue, CodeMirror, markdown-it, KaTeX, LanceDB, Apache Arrow e a tutti i collaboratori. Un ringraziamento speciale a [SiliconFlow](https://siliconFlow.com).
