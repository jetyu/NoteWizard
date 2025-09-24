const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

contextBridge.exposeInMainWorld('electronAPI', {
    fs: {
        readFile: (filePath, encoding) => ipcRenderer.invoke('fs:readFile', filePath, encoding),
        writeFile: (filePath, content, options = {}) => ipcRenderer.invoke('fs:writeFile', filePath, content, options),
        readdir: (dirPath, options = {}) => ipcRenderer.invoke('fs:readdir', dirPath, options),
        mkdir: (dirPath, options = {}) => ipcRenderer.invoke('fs:mkdir', dirPath, options),
        stat: (path) => ipcRenderer.invoke('fs:stat', path),
        unlink: (path) => ipcRenderer.invoke('fs:unlink', path),
        rmdir: (path) => ipcRenderer.invoke('fs:rmdir', path),
        readFileSync: (path, encoding) => ipcRenderer.invoke('fs:readFileSync', path, encoding),
        writeFileSync: (path, data, options) => ipcRenderer.invoke('fs:writeFileSync', path, data, options),
        exists: (path) => ipcRenderer.invoke('fs:exists', path),
        existsSync: (path) => ipcRenderer.invoke('fs:existsSync', path),
        mkdirSync: (path, options) => ipcRenderer.invoke('fs:mkdirSync', path, options),
        rename: (oldPath, newPath) => ipcRenderer.invoke('fs:rename', oldPath, newPath)
    },

    path: {
        join: (...args) => ipcRenderer.invoke('path:join', ...args),
        dirname: (p) => ipcRenderer.invoke('path:dirname', p),
        basename: (p, ext) => ipcRenderer.invoke('path:basename', p, ext),
        extname: (p) => ipcRenderer.invoke('path:extname', p),
        resolve: (...args) => ipcRenderer.invoke('path:resolve', ...args),
        sep: path.sep
    },

    os: {
        homedir: () => ipcRenderer.invoke('os:homedir'),
        platform: () => ipcRenderer.invoke('os:platform'),
        arch: () => ipcRenderer.invoke('os:arch')
    },

    ipcRenderer: {
        send: (channel, ...args) => ipcRenderer.send(channel, ...args),
        on: (channel, listener) => {
            const subscription = (event, ...args) => listener(...args);
            ipcRenderer.on(channel, subscription);
            return () => ipcRenderer.removeListener(channel, subscription);
        },
        once: (channel, listener) => ipcRenderer.once(channel, (event, ...args) => listener(...args)),
        removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
        invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args)
    },

    dialog: {
        showOpenDialog: (options) => ipcRenderer.invoke('dialog:showOpenDialog', options),
        showSaveDialog: (options) => ipcRenderer.invoke('dialog:showSaveDialog', options),
        showMessageBox: (options) => ipcRenderer.invoke('dialog:showMessageBox', options)
    },

    app: {
        getPath: (name) => ipcRenderer.invoke('app:getPath', name),
        getAppPath: () => ipcRenderer.invoke('app:getAppPath'),
        getVersion: () => ipcRenderer.invoke('app:getVersion'),
        openPath: (filePath) => ipcRenderer.invoke('app:openPath', filePath),
        showItemInFolder: (filePath) => ipcRenderer.invoke('app:showItemInFolder', filePath)
    }
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('Preload script loaded successfully');
});
