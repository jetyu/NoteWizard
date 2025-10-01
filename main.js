import { app, BrowserWindow, Menu, dialog, ipcMain, Tray, nativeImage, shell } from "electron";
import * as path from "node:path";
import * as fs from "node:fs";
import * as os from "node:os";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== i18n Support ====================
const DEFAULT_LANG = "zh-CN";
let currentLang = DEFAULT_LANG;
let translations = {};

// Load language file
function loadLanguage(lang) {
  try {
    const langFile = path.join(__dirname, "src", "locales", `${lang}.json`);
    if (fs.existsSync(langFile)) {
      const data = fs.readFileSync(langFile, "utf8");
      translations = JSON.parse(data);
      currentLang = lang;
      return true;
    }
  } catch (error) {
    console.error(`Failed to load language ${lang}:`, error);
  }
  return false;
}

// Get translation
function t(key) {
  return translations[key] || key;
}

// Get user's preferred language from preferences
function getUserLanguage() {
  try {
    const prefsPath = path.join(app.getPath("userData"), "preferences.json");
    if (fs.existsSync(prefsPath)) {
      const prefs = JSON.parse(fs.readFileSync(prefsPath, "utf8"));
      return prefs.language || DEFAULT_LANG;
    }
  } catch (error) {
    console.error("Failed to read user language preference:", error);
  }
  return DEFAULT_LANG;
}

// Initialize language
function initLanguage() {
  const userLang = getUserLanguage();
  if (!loadLanguage(userLang)) {
    loadLanguage(DEFAULT_LANG);
  }
}
// ==================== End i18n Support ====================

// 启用详细警告跟踪和日志记录
process.traceProcessWarnings = true;

// 启用Chromium的详细日志
app.commandLine.appendSwitch('enable-logging');
app.commandLine.appendSwitch('log-level', '0'); // 0=INFO, 1=WARNING, 2=ERROR

// 在应用启动前设置应用名称
if (process.platform === "win32") {
  app.setAppUserModelId("com.app.notewizard");
}
app.setName("NoteWizard");

// 主窗口和托盘引用
let win = null;
let tray = null;

// 添加调试日志
//console.log('argv:', process.argv);
//console.log('user data:', app.getPath('userData'));

// 只允许一个实例运行
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  // 当第二个实例启动时，恢复已有窗口
  app.on("second-instance", (event, argv, workingDirectory) => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
  });
}

// 添加获取用户数据路径的IPC处理程序
ipcMain.handle("get-user-data-path", () => {
  return app.getPath("userData");
});

// 添加重启应用的方法
ipcMain.handle("relaunch-app", () => {
  app.relaunch();
  app.exit(0);
  return true;
});

// 处理版本信息请求
ipcMain.on("request-versions", (event) => {
  const packageInfo = require("./package.json");
  event.sender.send("versions", {
    app: packageInfo.version,
    electron: process.versions.electron,
    node: process.versions.node,
    v8: process.versions.v8,
    chrome: process.versions.chrome,
    author: packageInfo.author,
    license: packageInfo.license,
  });
});

// 确保目录存在
ipcMain.handle("ensure-directory-exists", (event, path) => {
  try {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 导出首选项
ipcMain.handle("export-preferences", async (event, preferences) => {
  try {
    const { filePath } = await dialog.showSaveDialog({
      title: "导出首选项",
      defaultPath: `NoteWizard_Pref_Export_${new Date()
        .toISOString()
        .split("T")[0]
        .replace(/-/g, "")}.json`,
      filters: [
        { name: "JSON 文件", extensions: ["json"] },
        { name: "所有文件", extensions: ["*"] },
      ],
    });

    if (filePath) {
      // 转换格式以匹配导入的预期结构
      const exportData = {
        language: preferences.language || "zh-CN",
        theme: preferences.themeMode || "system",
        editor: {
          fontSize: preferences.editorFontSize || "16",
          fontFamily: preferences.editorFontFamily || "'Arial', sans-serif",
        },
        preview: {
          fontSize: preferences.previewFontSize || "16",
          fontFamily: preferences.previewFontFamily || "'Arial', sans-serif",
        },
        ai: {
          model: preferences.aiSettings?.model || "",
          apiKey: preferences.aiSettings?.apiKey || "",
          endpoint: preferences.aiSettings?.endpoint || "",
        },
        noteSavePath: preferences.noteSavePath || "",
        startupOnLogin: !!preferences.startupOnLogin,
      };

      const data = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        settings: exportData,
      };

      await fs.promises.writeFile(
        filePath,
        JSON.stringify(data, null, 2),
        "utf8"
      );
      return { success: true, filePath };
    }
    return { success: false, error: "用户取消导出" };
  } catch (error) {
    return { success: false, error: `导出失败: ${error.message}` };
  }
});

// 导入首选项
ipcMain.handle("import-preferences", async () => {
  try {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: "导入首选项",
      filters: [
        { name: "JSON 文件", extensions: ["json"] },
        { name: "所有文件", extensions: ["*"] },
      ],
      properties: ["openFile"],
    });

    if (canceled || filePaths.length === 0) {
      return { success: false, error: "用户取消导入" };
    }

    const filePath = filePaths[0];
    const data = await fs.promises.readFile(filePath, "utf8");
    const preferences = JSON.parse(data);

    // 验证导入的数据结构
    if (!preferences.settings) {
      throw new Error("无效的首选项文件格式");
    }

    // 创建备份
    const backupPath = path.join(
      app.getPath("userData"),
      "preferences_backup.json"
    );
    const currentSettings = {};

    // 备份当前设置
    try {
      const settingsPath = path.join(
        app.getPath("userData"),
        "preferences.json"
      );
      if (fs.existsSync(settingsPath)) {
        const currentData = await fs.promises.readFile(settingsPath, "utf8");
        currentSettings.settings = JSON.parse(currentData);
        currentSettings.backupDate = new Date().toISOString();
        await fs.promises.writeFile(
          backupPath,
          JSON.stringify(currentSettings, null, 2),
          "utf8"
        );
      }

      // 保存新设置
      await fs.promises.writeFile(
        path.join(app.getPath("userData"), "preferences.json"),
        JSON.stringify(preferences.settings, null, 2),
        "utf8"
      );

      return {
        success: true,
        preferences: preferences.settings,
        backupCreated: true,
        backupPath: backupPath,
      };
    } catch (error) {
      // 如果导入失败，尝试恢复备份
      if (Object.keys(currentSettings).length > 0) {
        try {
          await fs.promises.writeFile(
            path.join(app.getPath("userData"), "preferences.json"),
            JSON.stringify(currentSettings.settings, null, 2),
            "utf8"
          );
        } catch (restoreError) { }
      }
      throw error;
    }
  } catch (error) {
    return { success: false, error: `导入失败: ${error.message}` };
  }
});

function createTray() {
  // 创建托盘图标
  const iconPath = path.join(
    __dirname,
    "src",
    "assets",
    "logo",
    "app-logo.ico"
  );

  // 创建原生图片对象
  let trayIcon = nativeImage.createFromPath(iconPath);

  if (process.platform === "win32") {
    trayIcon = trayIcon.resize({ width: 32, height: 32 });
  }

  // 创建系统托盘
  tray = new Tray(trayIcon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: t("tray.open"),
      click: () => {
        if (win) {
          if (win.isMinimized()) win.restore();
          win.show();
          win.focus();
        }
      },
    },
    { type: "separator" },
    {
      label: t("tray.quit"),
      click: () => {
        // 关闭所有窗口
        const windows = BrowserWindow.getAllWindows();
        windows.forEach((win) => {
          win.removeAllListeners("close");
          win.close();
        });

        // 完全退出应用
        app.exit(0);
      },
    },
  ]);

  // 设置托盘提示
  tray.setToolTip("NoteWizard");
  tray.setContextMenu(contextMenu);

  // 点击托盘图标时切换窗口显示/隐藏
  tray.on("click", () => {
    if (win) {
      if (win.isVisible()) {
        win.hide();
      } else {
        if (win.isMinimized()) win.restore();
        win.show();
        win.focus();
      }
    }
  });
}

// Create application menu
function createMenu(iconPath) {
  const menuTemplate = [
    {
      label: t("menu.file"),
      submenu: [
        {
          label: t("menu.file.open"),
          accelerator: "CmdOrCtrl+O",
          click: async () => {
            const { canceled, filePaths } = await dialog.showOpenDialog(win, {
              filters: [{ name: "Markdown", extensions: ["md"] }],
              properties: ["openFile"],
            });
            if (!canceled && filePaths.length > 0) {
              const content = fs.readFileSync(filePaths[0], "utf-8");
              win.webContents.send("file-opened", {
                content,
                filePath: filePaths[0],
              });
            }
          },
        },
        {
          label: t("menu.file.save"),
          accelerator: "CmdOrCtrl+S",
          click: () => {
            win.webContents.send("save-file");
          },
        },
        { type: "separator" },
        {
          label: t("menu.file.preferences"),
          accelerator: "Ctrl+Shift+P",
          click: () => {
            if (win && !win.isDestroyed()) {
              win.webContents.send("open-preferences");
            }
          },
        },
        {
          label: t("menu.file.quit"),
          click: () => {
            // 关闭所有窗口
            const windows = BrowserWindow.getAllWindows();
            windows.forEach((win) => {
              win.removeAllListeners("close");
              win.close();
            });

            // 完全退出应用
            app.exit(0);
          },
        },
      ],
    },
    {
      label: t("menu.view"),
      submenu: [
        {
          label: t("menu.view.previewPanel"),
          submenu: [
            {
              id: "preview-open",
              label: t("menu.view.previewPanel.open"),
              accelerator: "Ctrl+Alt+P",
              click: () => {
                if (win && !win.isDestroyed()) {
                  win.webContents.send("preview-show");
                }
              },
            },

            {
              id: "preview-close",
              label: t("menu.view.previewPanel.close"),
              accelerator: "Ctrl+Alt+Shift+P",
              click: () => {
                if (win && !win.isDestroyed()) {
                  win.webContents.send("preview-hide");
                }
              },
            },
            {
              id: "preview-toggle",
              label: t("menu.view.previewPanel.toggle"),
              accelerator: "Ctrl+Alt+\\",
              click: () => {
                if (win && !win.isDestroyed()) {
                  win.webContents.send("preview-toggle");
                }
              },
            },
          ],
        },
      ],
    },
    {
      label: t("menu.edit"),
      submenu: [
        {
          label: t("menu.edit.trash"),
          accelerator: "Ctrl+Shift+T",
          click: () => {
            if (win && !win.isDestroyed()) {
              win.webContents.send("open-trash");
            }
          },
        },
        { type: "separator" },
        { role: "undo", label: t("menu.edit.undo") },
        { role: "redo", label: t("menu.edit.redo") },
        { type: "separator" },
        { role: "cut", label: t("menu.edit.cut") },
        { role: "copy", label: t("menu.edit.copy") },
        { role: "paste", label: t("menu.edit.paste") },
      ],
    },

    {
      label: t("menu.help"),
      submenu: [
        {
          label: t("menu.help.tutorial"),
          click: () => {
            shell.openExternal("https://markdown.com.cn/intro.html");
          },
        },
        {
          label: t("menu.help.devTools"),
          click: () => {
            if (win && !win.isDestroyed()) {
              win.webContents.toggleDevTools();
            }
          },
        },
        { type: "separator" },
        {
          label: t("menu.help.website"),
          click: () => {
            shell.openExternal("https://github.com/jetyu/NoteWizard");
          },
        },
        {
          label: t("menu.help.feedback"),
          click: () => {
            shell.openExternal("https://github.com/jetyu/NoteWizard/issues");
          },
        },
        { type: "separator" },
        {
          label: t("menu.help.update"),
          click: () => {
            shell.openExternal("https://github.com/jetyu/NoteWizard/releases");
          },
        },
        {
          label: t("menu.help.changelog"),
          click: () => {
            if (win && !win.isDestroyed()) {
              const aboutWindow = new BrowserWindow({
                width: 500,
                height: 500,
                parent: win,
                modal: true,
                show: false,
                autoHideMenuBar: true,
                minimizable: false,
                maximizable: false,
                resizable: true,
                useContentSize: true,
                icon: iconPath,
                webPreferences: {
                  nodeIntegration: false,
                  contextIsolation: true,
                  sandbox: false,
                  preload: path.join(__dirname, 'preload.js'),
                  webSecurity: true,
                  allowRunningInsecureContent: false,
                  experimentalFeatures: false
                },
              });
              aboutWindow.setMenuBarVisibility(false);

              aboutWindow.loadFile(
                path.join(__dirname, "src", "renderer", "changelog", "changelog.html")
              );
              aboutWindow.once("ready-to-show", () => {
                aboutWindow.show();
                aboutWindow.focus();
              });
            }
          },
        },
        {
          label: t("menu.help.about"),
          click: () => {
            if (win && !win.isDestroyed()) {
              const aboutWindow = new BrowserWindow({
                width: 500,
                height: 500,
                parent: win,
                modal: true,
                show: false,
                autoHideMenuBar: true,
                minimizable: false,
                maximizable: false,
                resizable: true,
                useContentSize: true,
                icon: iconPath,
                webPreferences: {
                  nodeIntegration: false,
                  contextIsolation: true,
                  sandbox: false,
                  preload: path.join(__dirname, 'preload.js'),
                  webSecurity: true,
                  allowRunningInsecureContent: false,
                  experimentalFeatures: false
                },
              });
              aboutWindow.setMenuBarVisibility(false);

              aboutWindow.loadFile(
                path.join(__dirname, "src", "renderer", "about", "about.html")
              );
              aboutWindow.once("ready-to-show", () => {
                aboutWindow.show();
                aboutWindow.focus();
              });
            }
          },
        },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  try {
    const openItem = menu.getMenuItemById("preview-open");
    const closeItem = menu.getMenuItemById("preview-close");
    if (openItem && closeItem) {
      openItem.enabled = false;
      closeItem.enabled = true;
    }
  } catch { }
}

function createWindow() {
  // 设置应用图标
  const iconPath =
    process.platform === "win32"
      ? path.join(__dirname, "src", "assets", "logo", "app-logo.ico")
      : path.join(__dirname, "src", "assets", "logo", "app-logo-512.png");

  // 当所有窗口都关闭时，不退出应用
  app.on("window-all-closed", (e) => {
    if (process.platform !== "darwin") {
      e.preventDefault();
    }
  });

  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    },
  });

  // 开发工具
  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools();
  }

  // Set window title with app name
  win.setTitle("NoteWizard");
  win.loadFile("src/index.html");

  // Create menu
  createMenu(iconPath);

  ipcMain.removeAllListeners("preview-state-changed");
  ipcMain.on("preview-state-changed", (event, payload) => {
    const { visible } = payload || {};
    const currentMenu = Menu.getApplicationMenu();
    if (!currentMenu) return;
    const openItem = currentMenu.getMenuItemById("preview-open");
    const closeItem = currentMenu.getMenuItemById("preview-close");
    if (openItem && closeItem) {
      openItem.enabled = !visible;
      closeItem.enabled = !!visible;
    }
  });

  // 创建系统托盘（在Windows和Linux上）
  if (process.platform !== "darwin") {
    createTray();
  }

  // 拦截窗口关闭事件，改为隐藏窗口
  win.on("close", (e) => {
    if (process.platform !== "darwin") {
      e.preventDefault();
      win.hide();
      return false;
    }
    return true;
  });
}

// 处理保存请求
ipcMain.handle("save-file-content", async (event, { content, filePath }) => {
  try {
    let targetPath = filePath;
    if (!targetPath) {
      const { canceled, filePath: savePath } = await dialog.showSaveDialog(win, {
        filters: [{ name: "Markdown", extensions: ["md"] }],
      });
      if (canceled) return { success: false, error: "用户取消保存" };
      targetPath = savePath;
    }

    // 确保目录存在
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await fs.promises.writeFile(targetPath, content, "utf-8");
    return { success: true, filePath: targetPath };
  } catch (error) {
    console.error('保存文件失败:', error);
    return { success: false, error: error.message };
  }
});

// Handle directory selection dialog
ipcMain.handle("select-directory", async (event, defaultPath) => {
  const result = await dialog.showOpenDialog(win, {
    defaultPath: defaultPath || app.getPath("documents"),
    properties: ["openDirectory", "createDirectory"],
  });
  return result.canceled ? null : result.filePaths[0];
});

// --- Preload bridged FS handlers ---
ipcMain.handle("fs:readFile", async (_event, filePath, encoding) => {
  return fs.promises.readFile(filePath, encoding);
});

ipcMain.handle("fs:writeFile", async (_event, filePath, content, options = {}) => {
  await fs.promises.writeFile(filePath, content, options);
  return true;
});

ipcMain.handle("fs:readdir", async (_event, dirPath, options = {}) => {
  return fs.promises.readdir(dirPath, options);
});

ipcMain.handle("fs:mkdir", async (_event, dirPath, options = {}) => {
  await fs.promises.mkdir(dirPath, options);
  return true;
});

ipcMain.handle("fs:stat", async (_event, targetPath) => {
  const stats = await fs.promises.stat(targetPath);
  return {
    size: stats.size,
    mtimeMs: stats.mtimeMs,
    ctimeMs: stats.ctimeMs,
    birthtimeMs: stats.birthtimeMs,
    isFile: stats.isFile(),
    isDirectory: stats.isDirectory(),
    isSymbolicLink: stats.isSymbolicLink(),
  };
});

ipcMain.handle("fs:unlink", async (_event, targetPath) => {
  await fs.promises.unlink(targetPath);
  return true;
});

ipcMain.handle("fs:rmdir", async (_event, targetPath) => {
  await fs.promises.rm(targetPath, { recursive: true, force: true });
  return true;
});

ipcMain.handle("fs:readFileSync", (_event, targetPath, encoding) => {
  return fs.readFileSync(targetPath, encoding);
});

ipcMain.handle("fs:writeFileSync", (_event, targetPath, data, options) => {
  fs.writeFileSync(targetPath, data, options);
  return true;
});

ipcMain.handle("fs:exists", async (_event, targetPath) => {
  try {
    await fs.promises.access(targetPath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle("fs:existsSync", (_event, targetPath) => {
  return fs.existsSync(targetPath);
});

ipcMain.handle("fs:mkdirSync", (_event, targetPath, options) => {
  fs.mkdirSync(targetPath, options);
  return true;
});

ipcMain.handle("fs:rename", async (_event, oldPath, newPath) => {
  await fs.promises.rename(oldPath, newPath);
  return true;
});

// --- Path handlers ---
ipcMain.handle("path:join", (_event, ...segments) => path.join(...segments));
ipcMain.handle("path:dirname", (_event, targetPath) => path.dirname(targetPath));
ipcMain.handle("path:basename", (_event, targetPath, ext) => path.basename(targetPath, ext));
ipcMain.handle("path:extname", (_event, targetPath) => path.extname(targetPath));
ipcMain.handle("path:resolve", (_event, ...segments) => path.resolve(...segments));

// --- OS handlers ---
ipcMain.handle("os:homedir", () => os.homedir());
ipcMain.handle("os:platform", () => os.platform());
ipcMain.handle("os:arch", () => os.arch());

// --- Dialog handlers ---
ipcMain.handle("dialog:showOpenDialog", async (_event, options) => {
  const result = await dialog.showOpenDialog(win, options);
  return result;
});

ipcMain.handle("dialog:showSaveDialog", async (_event, options) => {
  return dialog.showSaveDialog(win, options);
});

ipcMain.handle("dialog:showMessageBox", async (_event, options) => {
  return dialog.showMessageBox(win, options);
});

// --- App handlers ---
ipcMain.handle("app:getPath", (_event, name) => app.getPath(name));
ipcMain.handle("app:getAppPath", () => app.getAppPath());
ipcMain.handle("app:getVersion", () => app.getVersion());
ipcMain.handle("app:openPath", (_event, targetPath) => shell.openPath(targetPath));
ipcMain.handle("app:showItemInFolder", (_event, targetPath) => shell.showItemInFolder(targetPath));

// Get default note save path
ipcMain.handle("get-default-save-path", () => {
  return path.join(app.getPath("documents"), "NoteWizard");
});

// Query current startup (open at login) setting
ipcMain.handle("get-startup-enabled", () => {
  try {
    const settings = app.getLoginItemSettings();
    return { success: true, enabled: !!settings.openAtLogin };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Set startup (open at login) using Electron API (registry on Windows)
ipcMain.handle("set-startup-enabled", (event, enabled) => {
  try {
    const options = {
      openAtLogin: !!enabled,
      openAsHidden: true,
    };
    // Explicitly set path on Windows to ensure correct exe is used
    if (process.platform === "win32") {
      options.path = process.execPath;
    }
    app.setLoginItemSettings(options);
    return { success: true, enabled: !!enabled };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Listen for language change from renderer process
ipcMain.on("language-changed", (event, lang) => {
  if (loadLanguage(lang)) {
    const iconPath =
      process.platform === "win32"
        ? path.join(__dirname, "src", "assets", "logo", "app-logo.ico")
        : path.join(__dirname, "src", "assets", "logo", "app-logo-512.png");
    
    // Rebuild menu with new language
    createMenu(iconPath);
    
    // Rebuild tray with new language
    if (tray && process.platform !== "darwin") {
      tray.destroy();
      createTray();
    }
  }
});

// 应用就绪
app.whenReady().then(() => {
  // Initialize language before creating window
  initLanguage();
  
  createWindow();

  // macOS应用激活
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (win) {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
  });

  console.log('NoteWizard Started');
});

// 所有窗口关闭时退出应用 (macOS除外)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  dialog.showErrorBox('应用程序错误', '发生未处理的错误: ' + error.message);
});

// 未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  dialog.showErrorBox('Promise错误', '未处理的Promise拒绝: ' + (reason instanceof Error ? reason.message : String(reason)));
});

// 应用即将退出
app.on('will-quit', (event) => {
  console.log('NoteWizard will quit');
  // 可以在这里执行清理操作
});
