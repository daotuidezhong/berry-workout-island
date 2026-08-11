const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("gameUpdater", {
  onStatus(callback) {
    const listener = (_event, status) => callback(status);
    ipcRenderer.on("update:status", listener);
    return () => ipcRenderer.removeListener("update:status", listener);
  },
  download: () => ipcRenderer.invoke("update:download"),
  install: () => ipcRenderer.send("update:install"),
  version: () => ipcRenderer.invoke("app:version"),
  storage: {
    load: (key) => ipcRenderer.sendSync("storage:load", key),
    save: (key, value) => ipcRenderer.send("storage:save", key, value),
  },
});
