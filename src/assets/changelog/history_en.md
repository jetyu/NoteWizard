### [0.2.2] - 2025-10-02
#### Fixes
- Fixed an internationalization hard-coding issue.
- Fixed an issue where the menu bar language was not updated after switching languages ​​and restarting.
#### Optimizations
- Optimized the import, export, and reset logic for preference configurations.

### [0.2.1] - 2025-10-01
#### Added
- Automatically build installation packages for Windows, macOS, and Linux.
- Customizable system prompts for AI services.

### [0.2.0] - 2025-10-01
#### Fixes
- Fixed the connectivity test feature for the AI ​​service interface.
#### Optimizations
- Optimized the interactive experience of the preferences interface.

### [0.1.9] - 2025-10-01
#### Fixes
- Fixed known issues.

### [0.1.8] - 2025-10-01
#### Fixes
- Fixed a right-click menu issue.

### [0.1.7] - 2025-10-01
#### Fixes
- Fixed some known translation issues.

### [0.1.6] - 2025-09-30
#### Fixes
- Fixed some known UI issues.

### [0.1.5] - 2025-09-30
#### Additions
- Added a view switching function.
- Added AI service input delay, minimum input length, system prompts, and AI service interface connectivity testing.
#### Fixes
- Fixed an issue introduced in 0.1.0 that caused outline display errors.
#### Optimizations
- Refactored the AI ​​service interface to be compatible with all AI services that support the OpenAI interface.

### [0.1.4] - 2025-09-28
#### Fixes
- Fixed an issue with AI-suggested cursor position.

### [0.1.1] - 2025-09-21
#### Fixes
- Fixed some link errors.

### [0.1.0] - 2025-09-20
#### Fixes
- Fixed an issue with the note list scroll bar.
- Fixed an issue with Recycle Bin deletion logic.
- Fixed an issue with registry entries remaining after canceling a startup.
#### Optimizations
- Optimized the Recycle Bin interface and interaction.

### [0.0.9] - 2025-09-15
#### Improvements
- Optimized high-resolution display compatibility.

### [0.0.8] - 2025-09-13
#### Fixes
- Fixed an issue with inaccurate translations in some languages.
- Fixed an issue with some pages not being translated.
- Fixed an issue with some pages displaying incorrectly when switching to a different language interface.
- Fixed an issue with the import and export settings function failing to work when switching between languages ​​in version v0.0.7.

### [0.0.7] - 2025-09-11
#### Additions
- Added support for 18 new languages ​​and regions: English, French, Russian, German, Italian, etc.
- Added system tray icon and startup functionality.
#### Fixes
- Fixed an issue with incorrect file size display in the note properties dialog.
- Fixed an issue with icons and changelog content not loading on startup in rare cases.
- Fixed an issue with incorrect file path display when creating a new note in the workspace. - Fixed an issue where the cancel operation was not correctly recognized in rare cases during a rename operation.
#### Improvements
- Upgraded the Electron framework to version 37.4.0.
- Optimized the software installation package size.
- Optimized the notebook expansion and collapse states.
- Optimized resource loading logic.
- Refactored the multi-language switching code logic.
#### Removals
- Removed support for Windows 32-bit (x86) operating systems. Currently, only **Windows 10 and later 64-bit operating systems** are supported.

### [0.0.6] - 2025-08-30
#### New
- Added a tutorial module.

### [0.0.5] - 2025-08-29
#### New
- Added support for opening the file location in the right-click menu.
- Added import and export functions for user preferences.
- Added a custom save path configuration option for note files.
- Added preference shortcuts.
- Added support for the latest AI models.
#### Fixes
- Fixed an issue with incorrect version number display on the About page.
- Fixed an issue where the AI ​​provider list failed to load in certain circumstances.
- Fixed a Content Security Policy issue introduced in version 0.0.4.
#### Improvements
- Optimized the interaction logic and user experience for customizing the save path for note files.

### [0.0.4] - 2025-08-03
#### Added
- Added a developer debugging tool module.

### [0.0.3] - 2025-07-29
#### Added
- Added the ability to set text size and font.
- Added the About panel, Changelog page, and Check for Updates function modules.
#### Fixes
- Fixed an issue where page elements were misaligned in some cases.
- Fixed an issue where some reset operations did not take effect after switching to the English interface.
- Fixed an issue where note saving failed in certain circumstances.
- Fixed an issue where the application window size memory function failed to work.
- Fixed an issue where the path was incorrect when creating a new note via the right-click menu in certain circumstances.
- Fixed an issue where the AI ​​configuration panel language was not updated in real time when switching the application language.
#### Improvements
- Optimized the default window size to accommodate more display devices.
- Optimized the animation effects of some page transitions and operations.
- Optimized the interactive experience of various user interface elements.
- Optimized the application startup speed.

### [0.0.2] - 2025-05-27
#### New
- Added support for dark mode.
- Added configuration support for AI service providers such as OpenAI ChatGPT, xAI Grok, DeepSeek, and Qwen.

### [0.0.1] - 2025-05-22
#### New
- Initial version of the application released.
- Implemented the core Markdown editor and live preview features.
- Added support for Windows 7 and later operating systems.