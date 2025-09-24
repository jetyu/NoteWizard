const {
  app,
  BrowserWindow,
  Menu,
  dialog,
  ipcMain,
  Tray,
  nativeImage,
} = require("electron");
const path = require("path");
const fs = require("fs");

// 在应用启动前设置应用名称
if (process.platform === "win32") {
  app.setAppUserModelId("com.app.notewizard");
}
app.setName("NoteWizard");

let win;
let tray = null;

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
      label: "打开 NoteWizard",
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
      label: "退出",
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
   
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Set window title with app name
  win.setTitle("NoteWizard");
  win.loadFile("src/index.html");

  const menuTemplate = [
    {
      label: "文件",
      submenu: [
        {
          label: "打开",
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
          label: "保存",
          accelerator: "CmdOrCtrl+S",
          click: () => {
            win.webContents.send("save-file");
          },
        },
        { type: "separator" },
        {
          label: "首选项",
          accelerator: "Ctrl+Shift+P",
          click: () => {
            if (win && !win.isDestroyed()) {
              win.webContents.send("open-preferences");
            }
          },
        },
        {
          label: "退出",
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
      label: "视图",
      submenu: [
        {
          label: "预览面板",
          submenu: [
            {
              id: "preview-open",
              label: "打开",
              accelerator: "Ctrl+Alt+P",
              click: () => {
                if (win && !win.isDestroyed()) {
                  win.webContents.send("preview-show");
                }
              },
            },

            {
              id: "preview-close",
              label: "关闭",
              accelerator: "Ctrl+Alt+Shift+P",
              click: () => {
                if (win && !win.isDestroyed()) {
                  win.webContents.send("preview-hide");
                }
              },
            },
            {
              id: "preview-toggle",
              label: "切换",
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
      label: "编辑",
      submenu: [
        {
          label: "回收站",
          accelerator: "Ctrl+Shift+T",
          click: () => {
            if (win && !win.isDestroyed()) {
              win.webContents.send("open-trash");
            }
          },
        },
        { type: "separator" },
        { role: "undo", label: "撤销" },
        { role: "redo", label: "重做" },
        { type: "separator" },
        { role: "cut", label: "剪切" },
        { role: "copy", label: "复制" },
        { role: "paste", label: "粘贴" },
      ],
    },

    {
      label: "帮助",
      submenu: [
        {
          label: "使用教程",
          click: () => {
            require("electron").shell.openExternal(
              "https://markdown.com.cn/intro.html"
            );
          },
        },
        {
          label: "调试工具",
          click: () => {
            if (win && !win.isDestroyed()) {
              win.webContents.toggleDevTools();
            }
          },
        },
        { type: "separator" },
        {
          label: "官方网站",
          click: () => {
            require("electron").shell.openExternal(
              "https://github.com/jetyu/NoteWizard"
            );
          },
        },
        {
          label: "发送反馈",
          click: () => {
            require("electron").shell.openExternal(
              "https://github.com/jetyu/NoteWizard/issues"
            );
          },
        },
        { type: "separator" },
        {
          label: "软件更新",
          click: () => {
            require("electron").shell.openExternal(
              "https://github.com/jetyu/NoteWizard/releases"
            );
          },
        },
        {
          label: "更新日志",
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
                  nodeIntegration: true,
                  contextIsolation: false,
                },
              });
              aboutWindow.setMenuBarVisibility(false);

              aboutWindow.loadFile(
                path.join(__dirname, "src", "templates", "changelog.html")
              );
              aboutWindow.once("ready-to-show", () => {
                aboutWindow.show();
                aboutWindow.focus();
              });
            }
          },
        },
        {
          label: "关于 NoteWizard",
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
                  nodeIntegration: true,
                  contextIsolation: false,
                },
              });
              aboutWindow.setMenuBarVisibility(false);

              aboutWindow.loadFile(
                path.join(__dirname, "src", "templates", "about.html")
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
ipcMain.on("save-file-content", async (event, { content, filePath }) => {
  let targetPath = filePath;
  if (!targetPath) {
    const { canceled, filePath: savePath } = await dialog.showSaveDialog(win, {
      filters: [{ name: "Markdown", extensions: ["md"] }],
    });
    if (canceled) return;
    targetPath = savePath;
  }
  fs.writeFileSync(targetPath, content, "utf-8");
  win.webContents.send("file-saved", targetPath);
});

// Handle directory selection dialog
ipcMain.handle("select-directory", async (event, defaultPath) => {
  const result = await dialog.showOpenDialog(win, {
    defaultPath: defaultPath || app.getPath("documents"),
    properties: ["openDirectory", "createDirectory"],
  });
  return result.canceled ? null : result.filePaths[0];
});

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

// 仅在获得单实例锁时启动应用
if (gotTheLock) {
  app.whenReady().then(() => {
    createWindow();
    //若无窗口则新建，否则聚焦
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      } else if (win) {
        if (win.isMinimized()) win.restore();
        win.show();
        win.focus();
      }
    });
  });
}
