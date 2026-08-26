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
    exportBackup: () => ipcRenderer.invoke("storage:export"),
    importBackup: () => ipcRenderer.invoke("storage:import"),
  },
  journalPhotos: {
    select: () => ipcRenderer.invoke("journal-photo:select"),
    remove: (fileName) => ipcRenderer.invoke("journal-photo:remove", fileName),
  },
  pomodoro: {
    schedule: (endsAt, phase) => ipcRenderer.send("pomodoro:schedule", endsAt, phase),
    cancel: () => ipcRenderer.send("pomodoro:cancel"),
    onFinished(callback) {
      const listener = (_event, phase) => callback(phase);
      ipcRenderer.on("pomodoro:finished", listener);
      return () => ipcRenderer.removeListener("pomodoro:finished", listener);
    },
  },
});
