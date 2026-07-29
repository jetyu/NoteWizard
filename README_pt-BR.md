<p align="center"><img src="https://raw.githubusercontent.com/jetyu/Snaptium/main/electron/assets/logo/app-logo-128.png" alt="Ícone do Snaptium" width="88"></p>
<h1 align="center">Snaptium</h1>

<p align="center">
  <a href="README.md">English</a> · <a href="README_zh-CN.md">简体中文</a> · <a href="README_zh-TW.md">繁體中文</a> ·
  <a href="README_ja-JP.md">日本語</a> · <a href="README_ko-KR.md">한국어</a> · <a href="README_es-ES.md">Español</a> ·
  <a href="README_de-DE.md">Deutsch</a> · <a href="README_fr-FR.md">Français</a> · <a href="README_it-IT.md">Italiano</a> ·
  <a href="README_pt-BR.md">Português (Brasil)</a> · <a href="README_tr-TR.md">Türkçe</a>
</p>

<p align="center"><strong>Notas Markdown com agentes de IA</strong></p>
<p align="center"><a href="https://snaptium.com">Site oficial</a> · <a href="https://snaptium.com/docs">Documentação</a> · <a href="https://snaptium.com/#download">Baixar</a> · <a href="https://github.com/jetyu/Snaptium">GitHub Star</a></p>

Snaptium é um aplicativo multiplataforma de notas Markdown e gestão do conhecimento com IA. Reúne editor CodeMirror 6, escrita assistida, índice vetorial local, perguntas e respostas RAG, captura rápida e sincronização WebDAV/S3 com criptografia de ponta a ponta.

As notas ficam no dispositivo por padrão, sem cadastro obrigatório. Funciona no Windows, macOS e Linux com serviços de IA na nuvem ou modelos locais do Ollama.

## Principais recursos

| Recurso | Descrição |
|---------|-----------|
| ✍️ Markdown e fórmulas | Visualização em tempo real; KaTeX para fórmulas inline e em bloco, frações, raízes, somatórios, integrais e matrizes |
| 💻 Código e diagramas | Destaque para mais de 24 linguagens, reconhecimento de mais de 40 aliases e renderização Mermaid |
| 🤖 Escrita com IA | 3 intensidades, 5 estilos e 7 cenários para documentação, propostas, resumos e criação de conteúdo |
| 🌐 Vários modelos | Cota gratuita oficial e BYOK para mais de 12 serviços, incluindo OpenAI, Gemini, DeepSeek, OpenRouter, SiliconFlow, Qwen, Kimi, Ollama e APIs compatíveis |
| 🧠 Conhecimento e agente | Índice local, busca vetorial e semântica, RAG, reranking opcional e modos Ask / Agent com LangChain |
| 🔐 Segurança local-first | AES-256-GCM, senha do espaço de trabalho, chave de recuperação e sincronização E2EE por WebDAV, S3, R2, MinIO ou NAS |
| 🗂️ Organização e recuperação | Cadernos, tags, favoritos, 6 modelos, busca textual, histórico de versões e lixeira |
| 🔄 Portabilidade | Importação/exportação Markdown e `.sppx`, importação Evernote `.enex` e exportação PDF |
| 🎨 Personalização | 3 aparências, 5 cores, 14 fontes e ajustes separados para editor, visualização e interface |
| 🌍 Multiplataforma | Windows, macOS, Linux e 13 idiomas e regiões |

> Os recursos de IA ficam desativados por padrão e são configurados pelo usuário.

## Interface

![Editor Markdown do Snaptium](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/EditorDemo.png)

[![Escrita com IA](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/SmartWriting.png)](https://github.com/jetyu/Snaptium/blob/main/docs/Screenshots/v2/en-US/SmartWriting.mp4)

## Download

[![Windows](https://img.shields.io/badge/Windows-x64-0078D4?style=flat-square&logo=windows&logoColor=white)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Windows-x64.exe)
[![macOS](https://img.shields.io/badge/macOS-Apple_Silicon-000000?style=flat-square&logo=apple&logoColor=white)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-macOS-arm64.dmg)
[![Linux](https://img.shields.io/badge/Linux-AppImage-FCC624?style=flat-square&logo=linux&logoColor=black)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x86_64.AppImage)

Linux: [DEB](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x64.deb) · [RPM](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x64.rpm) · [Todas as versões](https://github.com/jetyu/Snaptium/releases)

## Desenvolvimento

```bash
npm install
npm run dev
npm run typecheck
```

## Perguntas frequentes

**Os dados são locais?** Sim. As notas são locais por padrão e o caminho é configurável.

**Aceita IA local?** Sim, via Ollama, além de OpenAI, Gemini, DeepSeek, OpenRouter, SiliconFlow e APIs compatíveis.

**A sincronização é criptografada?** Sim, WebDAV e armazenamento compatível com S3 oferecem criptografia de ponta a ponta.

**É código aberto?** Sim, sob a licença Apache 2.0. Consulte `LICENSE`.

Planejado: edição colaborativa, plugins, suporte móvel e uma base de conhecimento offline mais completa.

Obrigado a Electron, Vue, CodeMirror, markdown-it, KaTeX, LanceDB, Apache Arrow e a todos os colaboradores. Agradecimento especial à [SiliconFlow](https://siliconFlow.com).
