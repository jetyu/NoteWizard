import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { autoUpdater } = require("electron-updater");

function createAutoUpdaterManager({ app, dialog, shell, t, getWindow, releasePageUrl }) {
  let isCheckingForUpdates = false;
  let isDownloadingUpdate = false;
  let autoUpdaterInitialized = false;

  function getActiveWindow() {
    if (typeof getWindow !== "function") {
      return null;
    }
    const win = getWindow();
    if (!win || win.isDestroyed()) {
      return null;
    }
    return win;
  }

  function setProgress(value) {
    const win = getActiveWindow();
    if (win) {
      win.setProgressBar(value);
    }
  }

  function setIndeterminateProgress() {
    setProgress(2);
  }

  function resetProgress() {
    setProgress(-1);
  }

  function formatReleaseNotes(info) {
    if (!info) {
      return null;
    }

    const releaseNotes = (() => {
      if (Array.isArray(info.releaseNotes)) {
        return info.releaseNotes
          .map((note) => {
            if (typeof note === "string") {
              return note;
            }
            if (note && typeof note.note === "string") {
              return note.note;
            }
            return null;
          })
          .filter(Boolean)
          .join("\n\n");
      }
      if (typeof info.releaseNotes === "string") {
        return info.releaseNotes;
      }
      return t("update.detail.releaseNotesFallback");
    })();

    const pieces = [];
    if (info.version) {
      pieces.push(`${t("update.detail.newVersion")}: ${info.version}`);
    }
    if (releaseNotes) {
      pieces.push(`${t("update.detail.releaseNotes")}: ${releaseNotes}`);
    }
    return pieces.length > 0 ? pieces.join("\n\n") : null;
  }

  function initialize() {
    if (autoUpdaterInitialized || !app.isPackaged) {
      return;
    }

    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on("checking-for-update", () => {
      isCheckingForUpdates = true;
      setIndeterminateProgress();
    });

    autoUpdater.on("update-available", async (info) => {
      isCheckingForUpdates = false;
      resetProgress();

      const detail = formatReleaseNotes(info);
      const { response } = await dialog.showMessageBox(getActiveWindow() ?? undefined, {
        type: "info",
        buttons: [t("update.button.downloadNow"), t("update.button.later")],
        defaultId: 0,
        cancelId: 1,
        title: t("appName"),
        message: t("update.message.available"),
        detail: detail ?? undefined,
        noLink: true,
      });

      if (response === 0) {
        isDownloadingUpdate = true;
        setProgress(0);
        try {
          await autoUpdater.downloadUpdate();
        } catch (error) {
          isDownloadingUpdate = false;
          resetProgress();
          dialog.showErrorBox(
            t("update.error.downloadFailed"),
            error instanceof Error ? error.message : String(error)
          );
        }
      }
    });

    autoUpdater.on("update-not-available", async () => {
      isCheckingForUpdates = false;
      resetProgress();
      await dialog.showMessageBox(getActiveWindow() ?? undefined, {
        type: "info",
        buttons: [t("update.button.confirm")],
        defaultId: 0,
        title: t("appName"),
        message: t("update.message.latest"),
        noLink: true,
      });
    });

    autoUpdater.on("error", (error) => {
      isCheckingForUpdates = false;
      isDownloadingUpdate = false;
      resetProgress();
      dialog.showErrorBox(
        t("update.error.generic"),
        error instanceof Error ? error.message : String(error)
      );
    });

    autoUpdater.on("download-progress", (progress) => {
      if (!progress || typeof progress.percent !== "number") {
        return;
      }
      const value = Math.max(0, Math.min(progress.percent / 100, 1));
      setProgress(value);
    });

    autoUpdater.on("update-downloaded", async () => {
      isDownloadingUpdate = false;
      resetProgress();
      const { response } = await dialog.showMessageBox(getActiveWindow() ?? undefined, {
        type: "question",
        buttons: [t("update.button.restartNow"), t("update.button.remindLater")],
        defaultId: 0,
        cancelId: 1,
        title: t("appName"),
        message: t("update.message.downloaded"),
        noLink: true,
      });

      if (response === 0) {
        autoUpdater.quitAndInstall();
      }
    });

    autoUpdaterInitialized = true;
  }

  async function checkForUpdates() {
    if (!app.isPackaged) {
      const { response } = await dialog.showMessageBox(getActiveWindow() ?? undefined, {
        type: "info",
        buttons: [t("update.button.openReleasePage"), t("update.button.cancel")],
        defaultId: 0,
        cancelId: 1,
        title: t("appName"),
        message: t("update.devMode.message"),
        detail: t("update.devMode.detail"),
        noLink: true,
      });
      if (response === 0 && releasePageUrl) {
        shell.openExternal(releasePageUrl);
      }
      return;
    }

    initialize();

    if (isCheckingForUpdates) {
      await dialog.showMessageBox(getActiveWindow() ?? undefined, {
        type: "info",
        buttons: [t("update.button.confirm")],
        defaultId: 0,
        title: t("appName"),
        message: t("update.message.inProgress"),
        noLink: true,
      });
      return;
    }

    if (isDownloadingUpdate) {
      await dialog.showMessageBox(getActiveWindow() ?? undefined, {
        type: "info",
        buttons: [t("update.button.confirm")],
        defaultId: 0,
        title: t("appName"),
        message: t("update.message.downloading"),
        noLink: true,
      });
      return;
    }

    try {
      isCheckingForUpdates = true;
      setIndeterminateProgress();
      await autoUpdater.checkForUpdates();
    } catch (error) {
      isCheckingForUpdates = false;
      resetProgress();
      dialog.showErrorBox(
        t("update.error.checkFailed"),
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  return {
    initialize,
    checkForUpdates,
  };
}

export { createAutoUpdaterManager };
