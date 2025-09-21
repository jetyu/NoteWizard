### [0.1.0] - 2025-09-20
#### Fixed
- Fixed an issue with the scrollbar in the notes list.
- Fixed a bug in the recycle bin deletion logic.
- Fixed residual registry entries after disabling startup launch.

#### Improved
- Improved the recycle bin interface and interactions.



### [0.0.9] - 2025-09-15
#### Improved
- Improved high-resolution display adaptation.



### [0.0.8] - 2025-09-13
#### Fixed
- Fixed inaccuracies in some translations.
- Fixed untranslated text on certain pages.
- Fixed misaligned layouts on some pages after switching to other languages.
- Fixed the issue introduced in v0.0.7 where switching languages caused the import/export settings feature to stop working.



### [0.0.7] - 2025-09-11
#### Added
- Added support for 18 languages and regions: English, French, Russian, German, Italian, and more.
- Added system tray icon and startup on boot feature.

#### Fixed
- Fixed incorrect file size display in the note properties dialog.
- Fixed rare cases where icons or changelog content failed to load at startup.
- Fixed rare issue where new note paths were displayed incorrectly in the workspace.
- Fixed rare issue where canceling a rename operation was not recognized correctly.

#### Improved
- Upgraded Electron framework to version 37.4.0.
- Reduced installer package size.
- Improved notebook expand/collapse state behavior.
- Improved resource loading logic.
- Refactored multi-language switching logic.

#### Removed
- Dropped support for Windows 32-bit (x86) systems. The app now supports **Windows 10 and later, 64-bit systems only**.



### [0.0.6] - 2025-08-30
#### Added
- Added user tutorial module.



### [0.0.5] - 2025-08-29
#### Added
- Added “Open file location” option in the context menu.
- Added import/export for user preferences configuration.
- Added option to customize note file save path.
- Added preferences shortcut key.
- Added support for the latest AI models.

#### Fixed
- Fixed incorrect version number displayed on the About page.
- Fixed occasional failure to load AI provider list.
- Fixed content security policy issue introduced in v0.0.4.

#### Improved
- Improved interaction and experience for custom note file save path configuration.



### [0.0.4] - 2025-08-03
#### Added
- Added developer debugging tools module.



### [0.0.3] - 2025-07-29
#### Added
- Added text size and font customization features.
- Added About panel, changelog page, and check-for-updates module.

#### Fixed
- Fixed layout misalignment in certain cases.
- Fixed reset operations not taking effect after switching to English UI.
- Fixed occasional note save failures.
- Fixed window size memory feature not working.
- Fixed incorrect path issue when creating new notes via context menu in certain cases.
- Fixed AI configuration panel language not updating in real time when switching app language.

#### Improved
- Adjusted default window size to fit more display devices.
- Improved animation effects for page transitions and operations.
- Improved multiple UI interaction experiences.
- Improved application startup speed.



### [0.0.2] - 2025-05-27
#### Added
- Added dark mode support.
- Added configuration support for AI providers such as OpenAI ChatGPT, xAI Grok, DeepSeek, Qwen, and more.



### [0.0.1] - 2025-05-22
#### Added
- Initial application release.
- Implemented core Markdown editor with real-time preview.
- Added support for Windows 7 and later operating systems.
