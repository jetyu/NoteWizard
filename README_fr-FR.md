<p align="center"><img src="https://raw.githubusercontent.com/jetyu/Snaptium/main/electron/assets/logo/app-logo-128.png" alt="Icône Snaptium" width="88"></p>
<h1 align="center">Snaptium</h1>

<p align="center">
  <a href="README.md">English</a> · <a href="README_zh-CN.md">简体中文</a> · <a href="README_zh-TW.md">繁體中文</a> ·
  <a href="README_ja-JP.md">日本語</a> · <a href="README_ko-KR.md">한국어</a> · <a href="README_id-ID.md">Bahasa Indonesia</a> ·
  <a href="README_es-ES.md">Español</a> · <a href="README_de-DE.md">Deutsch</a> · <a href="README_fr-FR.md">Français</a> ·
  <a href="README_it-IT.md">Italiano</a> · <a href="README_pt-BR.md">Português (Brasil)</a> · <a href="README_tr-TR.md">Türkçe</a>
</p>


<p align="center"><strong>Prise de notes Markdown propulsée par des agents IA</strong></p>
<p align="center"><a href="https://snaptium.com">Site officiel</a> · <a href="https://snaptium.com/docs">Documentation</a> · <a href="https://snaptium.com/#download">Télécharger</a> · <a href="https://github.com/jetyu/Snaptium">GitHub Star</a></p>

Snaptium est une application multiplateforme de notes Markdown et de gestion des connaissances avec IA. Elle réunit un éditeur CodeMirror 6, l'aide à la rédaction, un index vectoriel local, les questions-réponses RAG, la capture rapide et la synchronisation WebDAV/S3 chiffrée de bout en bout.

Les notes restent sur votre appareil par défaut, sans inscription obligatoire. Snaptium fonctionne sous Windows, macOS et Linux avec des services IA cloud ou des modèles Ollama locaux.

## Fonctionnalités principales

| Fonction | Description |
|----------|-------------|
| ✍️ Markdown et formules | Aperçu en direct et défilement synchronisé ; KaTeX pour les formules en ligne et en bloc, fractions, racines, sommes, intégrales et matrices |
| 💻 Code et diagrammes | Coloration de plus de 24 langages, reconnaissance de plus de 40 alias et rendu Mermaid |
| 🤖 Rédaction assistée par IA | 3 intensités, 5 styles et 7 scénarios pour la documentation, les propositions, les résumés et la création de contenu |
| 🌐 Écosystème multi-modèle | Quota gratuit officiel et BYOK pour plus de 12 services : OpenAI, Gemini, DeepSeek, OpenRouter, SiliconFlow, Qwen, Kimi, Ollama et API compatibles |
| 🧠 Base de connaissances et agent | Index local, recherche vectorielle et sémantique, RAG, reranking facultatif et modes Ask / Agent basés sur LangChain |
| 🔐 Sécurité local-first | AES-256-GCM, mot de passe d'espace de travail, clé de récupération et synchronisation E2EE via WebDAV, S3, R2, MinIO ou NAS |
| 🗂️ Organisation et récupération | Carnets, étiquettes, favoris, 6 modèles, recherche plein texte, historique des versions et corbeille |
| 🔄 Portabilité | Import/export Markdown et `.sppx`, import Evernote `.enex` et export PDF |
| 🎨 Personnalisation | 3 apparences, 5 couleurs, 14 polices et réglages séparés pour l'éditeur, l'aperçu et l'interface |
| 🌍 Multiplateforme | Windows, macOS, Linux et 13 langues et paramètres régionaux |

> Les fonctions IA sont désactivées par défaut et configurées explicitement par l'utilisateur.

## Captures d'écran

![Éditeur Markdown Snaptium](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/EditorDemo.png)

[![Rédaction IA](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/SmartWriting.png)](https://github.com/jetyu/Snaptium/blob/main/docs/Screenshots/v2/en-US/SmartWriting.mp4)

[![Base de connaissances](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/KnowledgeBase.png)](https://github.com/jetyu/Snaptium/blob/main/docs/Screenshots/v2/en-US/KnowledgeBase.mp4)

## Télécharger

[![Windows](https://img.shields.io/badge/Windows-x64-0078D4?style=flat-square&logo=windows&logoColor=white)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Windows-x64.exe)
[![macOS](https://img.shields.io/badge/macOS-Apple_Silicon-000000?style=flat-square&logo=apple&logoColor=white)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-macOS-arm64.dmg)
[![Linux](https://img.shields.io/badge/Linux-AppImage-FCC624?style=flat-square&logo=linux&logoColor=black)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x86_64.AppImage)

Linux : [DEB](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x64.deb) · [RPM](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x64.rpm) · [Toutes les versions](https://github.com/jetyu/Snaptium/releases)

## Développement local

```bash
npm install
npm run dev
npm run typecheck
```

## Questions fréquentes

**Les données sont-elles locales ?** Oui. Les notes sont locales par défaut et leur emplacement est configurable.

**Les modèles IA locaux sont-ils pris en charge ?** Oui, via Ollama, ainsi qu'OpenAI, Gemini, DeepSeek, OpenRouter, SiliconFlow et les API compatibles.

**La synchronisation est-elle chiffrée ?** Oui, WebDAV et les stockages compatibles S3 prennent en charge le chiffrement de bout en bout.

**Snaptium est-il open source ?** Oui, sous licence Apache 2.0. Consultez `LICENSE`.

## Feuille de route

Édition collaborative, système d'extensions, support mobile et base de connaissances hors ligne plus complète.

Merci à Electron, Vue, CodeMirror, markdown-it, KaTeX, LanceDB, Apache Arrow et à toutes les personnes contributrices. Remerciements particuliers à [SiliconFlow](https://siliconFlow.com).
