<p align="center"><img src="https://raw.githubusercontent.com/jetyu/Snaptium/main/electron/assets/logo/app-logo-128.png" alt="Snaptium simgesi" width="88"></p>
<h1 align="center">Snaptium</h1>

<p align="center">
  <a href="README.md">English</a> · <a href="README_zh-CN.md">简体中文</a> · <a href="README_zh-TW.md">繁體中文</a> ·
  <a href="README_ja-JP.md">日本語</a> · <a href="README_ko-KR.md">한국어</a> · <a href="README_id-ID.md">Bahasa Indonesia</a> ·
  <a href="README_es-ES.md">Español</a> · <a href="README_de-DE.md">Deutsch</a> · <a href="README_fr-FR.md">Français</a> ·
  <a href="README_it-IT.md">Italiano</a> · <a href="README_pt-BR.md">Português (Brasil)</a> · <a href="README_tr-TR.md">Türkçe</a>
</p>

<p align="center"><strong>Yapay zekâ ajanlarıyla güçlendirilmiş Markdown notları</strong></p>
<p align="center"><a href="https://snaptium.com">Web sitesi</a> · <a href="https://snaptium.com/docs">Belgeler</a> · <a href="https://snaptium.com/#download">İndir</a> · <a href="https://github.com/jetyu/Snaptium">GitHub Star</a></p>

Snaptium, yapay zekâ destekli, platformlar arası bir Markdown not ve bilgi yönetimi uygulamasıdır. CodeMirror 6 editörünü, yerel vektör indeksini, RAG soru-cevap özelliğini, hızlı yakalamayı ve uçtan uca şifreli WebDAV/S3 eşitlemesini tek çalışma alanında birleştirir.

Notlar varsayılan olarak cihazınızda kalır ve hesap zorunlu değildir. Windows, macOS ve Linux'ta bulut hizmetleriyle veya yerel Ollama modelleriyle çalışır.

## Temel özellikler

| Özellik | Açıklama |
|---------|----------|
| ✍️ Markdown ve formüller | Canlı önizleme; satır içi ve blok formüller, kesirler, kökler, toplamlar, integraller ve matrisler için KaTeX |
| 💻 Kod ve diyagramlar | 24'ten fazla dilde sözdizimi vurgulama, 40'tan fazla takma ad tanıma ve Mermaid çizimi |
| 🤖 Yapay zekâ ile yazma | Teknik belge, öneri, özet ve içerik üretimi için 3 yoğunluk, 5 üslup ve 7 senaryo |
| 🌐 Çoklu model | Resmî ücretsiz kota ve OpenAI, Gemini, DeepSeek, OpenRouter, SiliconFlow, Qwen, Kimi, Ollama ve uyumlu API'ler dahil 12'den fazla BYOK hizmeti |
| 🧠 Bilgi tabanı ve ajan | LangChain tabanlı yerel indeks, vektör ve anlamsal arama, RAG, isteğe bağlı yeniden sıralama, Ask / Agent kipleri |
| 🔐 Yerel öncelikli güvenlik | AES-256-GCM, çalışma alanı parolası, kurtarma anahtarı ve WebDAV, S3, R2, MinIO veya NAS üzerinden E2EE |
| 🗂️ Düzenleme ve kurtarma | Defterler, etiketler, favoriler, 6 şablon, tam metin arama, sürüm geçmişi ve çöp kutusu |
| 🔄 Veri taşınabilirliği | Markdown ve `.sppx` içe/dışa aktarma, Evernote `.enex` içe aktarma ve PDF dışa aktarma |
| 🎨 Kişiselleştirme | 3 görünüm, 5 renk, 14 yazı tipi ve editör, önizleme, arayüz için ayrı ayarlar |
| 🌍 Çoklu platform | Windows, macOS, Linux ve 13 dil ve bölge ayarı |

> Yapay zekâ özellikleri varsayılan olarak kapalıdır ve kullanıcı tarafından yapılandırılır.

## Arayüz

![Snaptium Markdown editörü](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/EditorDemo.png)

[![Yapay zekâ ile yazma](https://raw.githubusercontent.com/jetyu/Snaptium/main/docs/Screenshots/v2/en-US/SmartWriting.png)](https://github.com/jetyu/Snaptium/blob/main/docs/Screenshots/v2/en-US/SmartWriting.mp4)

## İndir

[![Windows](https://img.shields.io/badge/Windows-x64-0078D4?style=flat-square&logo=windows&logoColor=white)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Windows-x64.exe)
[![macOS](https://img.shields.io/badge/macOS-Apple_Silicon-000000?style=flat-square&logo=apple&logoColor=white)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-macOS-arm64.dmg)
[![Linux](https://img.shields.io/badge/Linux-AppImage-FCC624?style=flat-square&logo=linux&logoColor=black)](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x86_64.AppImage)

Linux: [DEB](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x64.deb) · [RPM](https://github.com/jetyu/Snaptium/releases/latest/download/Snaptium-Linux-x64.rpm) · [Tüm sürümler](https://github.com/jetyu/Snaptium/releases)

## Geliştirme

```bash
npm install
npm run dev
npm run typecheck
```

## Sık sorulan sorular

**Veriler yerel mi?** Evet. Notlar varsayılan olarak yereldir ve konumları yapılandırılabilir.

**Yerel yapay zekâ destekleniyor mu?** Evet; Ollama, OpenAI, Gemini, DeepSeek, OpenRouter, SiliconFlow ve uyumlu API'ler desteklenir.

**Eşitleme şifreli mi?** Evet. WebDAV ve S3 uyumlu depolama uçtan uca şifrelemeyi destekler.

**Açık kaynak mı?** Evet, Apache License 2.0 ile sunulur. `LICENSE` dosyasına bakın.

Planlananlar: ortak düzenleme, eklenti sistemi, mobil destek ve daha kapsamlı çevrimdışı bilgi tabanı.

Electron, Vue, CodeMirror, markdown-it, KaTeX, LanceDB, Apache Arrow ve tüm katkıda bulunanlara teşekkürler. [SiliconFlow](https://siliconFlow.com)'a özel teşekkürler.
