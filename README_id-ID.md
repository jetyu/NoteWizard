<p align="center"><img src="https://raw.githubusercontent.com/jetyu/Snaptium/main/electron/assets/logo/app-logo-128.png" alt="Ikon Snaptium" width="88"></p>
<h1 align="center">Snaptium</h1>

<p align="center">
  <a href="README.md">English</a> · <a href="README_zh-CN.md">简体中文</a> · <a href="README_zh-TW.md">繁體中文</a> ·
  <a href="README_ja-JP.md">日本語</a> · <a href="README_ko-KR.md">한국어</a> · <a href="README_id-ID.md">Bahasa Indonesia</a> ·
  <a href="README_es-ES.md">Español</a> · <a href="README_de-DE.md">Deutsch</a> · <a href="README_fr-FR.md">Français</a> ·
  <a href="README_it-IT.md">Italiano</a> · <a href="README_pt-BR.md">Português (Brasil)</a> · <a href="README_tr-TR.md">Türkçe</a>
</p>


<p align="center"><strong>Catatan Markdown yang didukung agen AI</strong></p>
<p align="center"><a href="https://snaptium.com">Situs resmi</a> · <a href="https://snaptium.com/docs">Dokumentasi</a> · <a href="https://snaptium.com/#download">Unduh</a> · <a href="https://github.com/jetyu/Snaptium">GitHub Star</a></p>

Snaptium adalah aplikasi catatan Markdown dan manajemen pengetahuan berbasis AI yang berjalan di berbagai platform. Snaptium menggabungkan editor CodeMirror 6, bantuan menulis AI, indeks vektor lokal, tanya jawab RAG, pencatatan cepat, serta sinkronisasi WebDAV/S3 dengan enkripsi ujung ke ujung.

Catatan disimpan di perangkat secara default tanpa wajib mendaftar. Snaptium tersedia untuk Windows, macOS, dan Linux serta mendukung layanan AI cloud maupun model lokal melalui Ollama.

## Fitur utama

| Fitur | Penjelasan |
|-------|------------|
| ✍️ Markdown dan rumus | Pratinjau langsung dan gulir tersinkron; KaTeX untuk rumus inline/blok, pecahan, akar, penjumlahan, integral, dan matriks |
| 💻 Kode dan diagram | Penyorotan untuk 24+ bahasa, pengenalan 40+ alias, serta rendering diagram Mermaid |
| 🤖 Penulisan dengan AI | 3 tingkat bantuan, 5 gaya, dan 7 skenario untuk dokumentasi, proposal, rangkuman, dan pembuatan konten |
| 🌐 Banyak model AI | Kuota gratis layanan resmi dan BYOK untuk 12+ layanan, termasuk OpenAI, Gemini, DeepSeek, OpenRouter, SiliconFlow, Qwen, Kimi, Ollama, dan API kompatibel |
| 🧠 Basis pengetahuan dan agen | Indeks lokal, pencarian vektor dan semantik, RAG, reranking opsional, serta mode Ask / Agent berbasis LangChain |
| 🔐 Keamanan local-first | AES-256-GCM, kata sandi ruang kerja, kunci pemulihan, dan sinkronisasi E2EE melalui WebDAV, S3, R2, MinIO, atau NAS |
| 🗂️ Organisasi dan pemulihan | Buku catatan, tag, favorit, 6 templat, pencarian teks lengkap, riwayat versi, dan tempat sampah |
| 🔄 Portabilitas data | Impor/ekspor Markdown dan `.sppx`, impor Evernote `.enex`, serta ekspor PDF |
| 🎨 Personalisasi | 3 tampilan, 5 warna aksen, 14 font, dan pengaturan terpisah untuk editor, pratinjau, serta antarmuka |
| 🌍 Lintas platform | Windows, macOS, Linux, serta 13 bahasa dan pengaturan wilayah |

> Fitur AI dinonaktifkan secara default dan dikonfigurasi langsung oleh pengguna.

## Tampilan

![Editor Markdown Snaptium](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/EditorDemo.png)

[![Penulisan AI](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/SmartWriting.png)](https://github.com/jetyu/Snaptium/blob/main/docs/Screenshots/v2/en-US/SmartWriting.mp4)

## Unduh

[![Windows](https://img.shields.io/badge/Windows-x64-0078D4?style=flat-square&logo=windows&logoColor=white)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Windows-x64.exe)
[![macOS](https://img.shields.io/badge/macOS-Apple_Silicon-000000?style=flat-square&logo=apple&logoColor=white)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-macOS-arm64.dmg)
[![Linux](https://img.shields.io/badge/Linux-AppImage-FCC624?style=flat-square&logo=linux&logoColor=black)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x86_64.AppImage)

Linux: [DEB](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x64.deb) · [RPM](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x64.rpm) · [Semua rilis](https://github.com/jetyu/Snaptium/releases)

## Pengembangan

```bash
npm install
npm run dev
npm run typecheck
```

## Pertanyaan umum

**Apakah data disimpan secara lokal?** Ya. Catatan bersifat lokal secara default dan lokasinya dapat diubah.

**Apakah AI lokal didukung?** Ya, melalui Ollama, serta OpenAI, Gemini, DeepSeek, OpenRouter, SiliconFlow, dan API kompatibel.

**Apakah sinkronisasi dienkripsi?** Ya. WebDAV dan penyimpanan kompatibel S3 mendukung enkripsi ujung ke ujung.

**Apakah Snaptium bersifat open source?** Ya, dengan Apache License 2.0. Lihat `LICENSE`.

Rencana berikutnya mencakup penyuntingan kolaboratif, sistem plugin, dukungan perangkat seluler, dan basis pengetahuan offline yang lebih lengkap.

Terima kasih kepada Electron, Vue, CodeMirror, markdown-it, KaTeX, LanceDB, Apache Arrow, dan semua kontributor. Terima kasih khusus kepada [SiliconFlow](https://siliconFlow.com).
