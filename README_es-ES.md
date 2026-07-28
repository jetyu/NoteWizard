<p align="center">
  <img src="https://raw.githubusercontent.com/jetyu/Snaptium/main/electron/assets/logo/app-logo-128.png" alt="Icono de Snaptium" width="88">
</p>
<h1 align="center">Snaptium</h1>

<p align="center">
  <a href="README.md">English</a> · <a href="README_zh-CN.md">简体中文</a> · <a href="README_zh-TW.md">繁體中文</a> ·
  <a href="README_ja-JP.md">日本語</a> · <a href="README_ko-KR.md">한국어</a> · <a href="README_id-ID.md">Bahasa Indonesia</a> ·
  <a href="README_es-ES.md">Español</a> · <a href="README_de-DE.md">Deutsch</a> · <a href="README_fr-FR.md">Français</a> ·
  <a href="README_it-IT.md">Italiano</a> · <a href="README_pt-BR.md">Português (Brasil)</a> · <a href="README_tr-TR.md">Türkçe</a>
</p>


<p align="center"><strong>Notas Markdown impulsadas por agentes de IA</strong></p>

<p align="center">
  <a href="https://github.com/jetyu/Snaptium"><img src="https://img.shields.io/badge/Apoya_Snaptium_en_GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="Añadir una estrella en GitHub"></a>
</p>

<p align="center">
  <a href="https://snaptium.com">Sitio web</a> ·
  <a href="https://snaptium.com/docs">Documentación</a> ·
  <a href="https://snaptium.com/#download">Descargar Snaptium</a>
</p>

<p align="center">
  <a href="https://github.com/jetyu/Snaptium/actions/workflows/build.yml"><img src="https://github.com/jetyu/Snaptium/actions/workflows/build.yml/badge.svg?event=push" alt="Compilación"></a>
  <a href="https://github.com/jetyu/Snaptium/releases/latest"><img src="https://img.shields.io/github/v/release/jetyu/Snaptium?style=flat&amp;logo=github" alt="Última versión"></a>
  <a href="https://github.com/jetyu/Snaptium/releases"><img src="https://img.shields.io/github/downloads/jetyu/Snaptium/total?style=flat&amp;logo=github" alt="Descargas"></a>
  <img src="https://img.shields.io/github/stars/jetyu/Snaptium?style=flat" alt="Estrellas">
  <img src="https://img.shields.io/github/forks/jetyu/Snaptium?style=flat" alt="Forks">
  <a href="https://github.com/jetyu/Snaptium/blob/main/LICENSE"><img src="https://img.shields.io/github/license/jetyu/Snaptium?style=flat" alt="Licencia"></a>
</p>

Snaptium es una aplicación multiplataforma de notas Markdown y gestión del conocimiento con IA. Reúne un editor CodeMirror 6, escritura asistida por IA, un índice vectorial local, preguntas y respuestas RAG, captura rápida y sincronización WebDAV/S3 con cifrado de extremo a extremo.

Las notas se guardan localmente de forma predeterminada y puedes elegir su ubicación. Snaptium permite importar y exportar Markdown, funciona en Windows, macOS y Linux, y admite tanto servicios de IA en la nube como modelos locales mediante Ollama.

> Si Snaptium te resulta útil, añade una estrella al proyecto para ayudar a que más personas lo descubran.

> **Usuarios de NoteWizard:** NoteWizard ha evolucionado a Snaptium. La versión anterior sigue disponible en la [página de NoteWizard v1.2.1](https://github.com/jetyu/Snaptium/releases/tag/v1.2.1).

## Contenido

- [Por qué Snaptium](#por-qué-snaptium)
- [Funciones principales](#funciones-principales)
- [Capturas y demostraciones](#capturas-y-demostraciones)
- [Tecnologías](#tecnologías)
- [Plataformas compatibles](#plataformas-compatibles)
- [Descarga](#descarga)
- [Desarrollo local](#desarrollo-local)
- [Preguntas frecuentes](#preguntas-frecuentes)

## Por qué Snaptium

Snaptium no es solo otra herramienta de notas Markdown. Es un espacio de escritura inteligente pensado para escribir a largo plazo, consolidar conocimiento y trabajar con IA local.

- Enfoque local-first
- Control y soberanía de los datos
- Almacenamiento sostenible a largo plazo
- Asistencia por IA sin dependencia de un proveedor
- Uso sin conexión
- Experiencia coherente entre plataformas

---

## Funciones principales

| Función | Descripción |
|---------|-------------|
| ✍️ Edición Markdown inmersiva | Editor CodeMirror 6 de alto rendimiento con vista previa en tiempo real, desplazamiento sincronizado, tareas, tablas, bloques de código mejorados y atajos configurables |
| 📐 Fórmulas matemáticas | KaTeX para fórmulas en línea y en bloque: fracciones, raíces, superíndices, subíndices, sumatorios, integrales, matrices y otras expresiones LaTeX |
| 💻 Código profesional | Resaltado para más de 24 lenguajes y reconocimiento automático de más de 40 alias, incluidos JavaScript, TypeScript, Python, Java, Go, Rust, C/C++, SQL y Shell |
| 📊 Diagramas y visualización | Mermaid integrado para diagramas de flujo, secuencia, clases, estados, Gantt y otras visualizaciones técnicas |
| 🤖 Asistente de escritura con IA | Tres intensidades, cinco estilos y siete escenarios para documentación técnica, propuestas, resúmenes, creación de contenido y organización del conocimiento |
| 🌐 Ecosistema multimodelo | Cuota gratuita del servicio oficial y BYOK para más de 12 proveedores: OpenAI, Gemini, DeepSeek, OpenRouter, SiliconFlow, Qwen, Doubao, Kimi, Zhipu AI, Grok, Ollama y API compatibles |
| 🧠 Base de conocimiento y agente local | Sistema basado en LangChain con indexación local, búsqueda vectorial y semántica, reranking opcional y modos Ask / Agent |
| 🔍 Búsqueda híbrida | Combina búsqueda de texto completo y búsqueda semántica para encontrar palabras exactas, comprender la intención y descubrir conocimiento relacionado |
| 🔐 Seguridad local-first | Sin registro obligatorio; notas locales por defecto, cifrado AES-256-GCM, contraseña del espacio de trabajo y clave de recuperación |
| ☁️ Sincronización E2EE | Sincronización cifrada entre dispositivos mediante WebDAV, Amazon S3, Cloudflare R2, MinIO, NAS o almacenamiento privado autogestionado |
| 🗂️ Organización flexible | Cuadernos, etiquetas, favoritos y seis plantillas: nota vacía, diario, reunión, lectura, plan de proyecto y lista de tareas |
| ⚡ Captura rápida | Crea una nota al instante desde la bandeja del sistema o con un atajo global |
| 🕒 Historial y recuperación | Consulta revisiones anteriores y recupera notas mediante el historial de versiones y la papelera |
| 🔄 Portabilidad abierta | Importación y exportación de Markdown y paquetes Snaptium, importación de Evernote ENEX y exportación de notas a PDF |
| 🎨 Personalización | Modo del sistema, claro y oscuro; cinco colores de acento; 14 fuentes; ajustes independientes para editor, vista previa e interfaz |
| 🌍 Multiplataforma y multilingüe | Windows, macOS y Linux con 13 idiomas y configuraciones regionales |
| 🛠️ Diagnóstico | Exporta registros, información del sistema, versión de la aplicación y estado de licencia para facilitar la resolución de problemas |

> Las funciones de IA están desactivadas de forma predeterminada. El usuario configura explícitamente los modelos y las API.

---

## Capturas y demostraciones

### Editor Markdown

![Editor Markdown de Snaptium](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/EditorDemo.png)

### Vista previa Markdown

![Vista previa de Snaptium](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/PreviewOnly.png)

### Escritura inteligente con IA

[![Escritura con IA](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/SmartWriting.png)](https://github.com/jetyu/Snaptium/blob/main/docs/Screenshots/v2/en-US/SmartWriting.mp4)

### Base de conocimiento

[![Base de conocimiento local](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/KnowledgeBase.png)](https://github.com/jetyu/Snaptium/blob/main/docs/Screenshots/v2/en-US/KnowledgeBase.mp4)

---

## Tecnologías

- **Interfaz:** Vue 3.5.38, TypeScript 6.0.3, Vite 8.0.16, Pinia 3.0.4, Vue I18n 11.4.5, CodeMirror 6
- **Escritorio:** Electron 43.2.0, Electron Builder 26.15.3, Electron Updater 6.8.9
- **Markdown:** markdown-it, KaTeX, highlight.js
- **IA y datos:** LanceDB, Apache Arrow, AWS SDK S3, WebDAV, LangChain, Ollama

---

## Plataformas compatibles

| Sistema | Versión | Arquitectura | Paquetes |
|---------|---------|--------------|----------|
| Windows | Windows 10 o posterior | x64 | `.exe` |
| macOS | macOS 11 o posterior | arm64 | `.dmg` |
| Linux | Ubuntu, Debian, Fedora y otras distribuciones principales | x64 | `.deb` `.rpm` `.AppImage` |

---

## Descarga

[![Windows](https://img.shields.io/badge/Windows-x64-0078D4?style=flat-square&logo=windows&logoColor=white)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Windows-x64.exe)
[![macOS](https://img.shields.io/badge/macOS-Apple_Silicon-000000?style=flat-square&logo=apple&logoColor=white)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-macOS-arm64.dmg)
[![AppImage](https://img.shields.io/badge/Linux-AppImage-FCC624?style=flat-square&logo=linux&logoColor=black)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x86_64.AppImage)

Linux también está disponible en formatos [DEB](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x64.deb) y [RPM](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x64.rpm). [Ver todas las versiones](https://github.com/jetyu/Snaptium/releases).

---

## Desarrollo local

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

## Documentación

- https://snaptium.com/docs

---

## Preguntas frecuentes

### ¿Snaptium es una aplicación de notas Markdown local-first?

Sí. Las notas se guardan localmente por defecto, puedes cambiar la ruta y la edición básica no requiere una cuenta.

### ¿Puede utilizar modelos de IA locales?

Sí. Admite Ollama, OpenAI, Gemini, DeepSeek, OpenRouter, SiliconFlow y API compatibles. La IA permanece desactivada hasta que el usuario la configura.

### ¿Qué formatos puede importar y exportar?

Markdown y paquetes `.sppx` se pueden importar y exportar; también admite importación de Evernote `.enex` y exportación de notas individuales a PDF.

### ¿Admite sincronización cifrada?

Sí. Ofrece sincronización E2EE mediante WebDAV y almacenamiento compatible con S3, incluidos Cloudflare R2, MinIO y NAS privados.

### ¿Es software de código abierto?

Sí. Snaptium se publica bajo la licencia Apache 2.0.

## Hoja de ruta

- Edición colaborativa
- Sistema de complementos
- Aplicaciones móviles
- Base de conocimiento sin conexión más completa

## Licencia y agradecimientos

Snaptium utiliza la licencia Apache 2.0. Consulta `LICENSE`.

Gracias a Electron, Vue, CodeMirror, markdown-it, KaTeX, LanceDB, Apache Arrow y a todas las personas que contribuyen.

<img width="120" src="https://raw.githubusercontent.com/jetyu/Snaptium/main/electron/assets/images/siliconflow.png" alt="Logotipo de SiliconFlow" />

Un agradecimiento especial a [SiliconFlow](https://siliconFlow.com) por apoyar Snaptium con servicios de modelos de IA.
