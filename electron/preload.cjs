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
  pomodoroMini: {
    open: () => ipcRenderer.send("pomodoro-mini:open"),
    sync: (snapshot) => ipcRenderer.send("pomodoro-mini:sync", snapshot),
    onState(callback) {
      const listener = (_event, snapshot) => callback(snapshot);
      ipcRenderer.on("pomodoro-mini:state", listener);
      return () => ipcRenderer.removeListener("pomodoro-mini:state", listener);
    },
    onAction(callback) {
      const listener = (_event, action) => callback(action);
      ipcRenderer.on("pomodoro-mini:action", listener);
      return () => ipcRenderer.removeListener("pomodoro-mini:action", listener);
    },
    action: (action) => ipcRenderer.send("pomodoro-mini:action", action),
    startDrag: (point) => ipcRenderer.send("pomodoro-mini:drag-start", point),
    moveDrag: (point) => ipcRenderer.send("pomodoro-mini:drag-move", point),
    endDrag: () => ipcRenderer.send("pomodoro-mini:drag-end"),
    startResize: (point) => ipcRenderer.send("pomodoro-mini:resize-start", point),
    moveResize: (point) => ipcRenderer.send("pomodoro-mini:resize-move", point),
    endResize: () => ipcRenderer.send("pomodoro-mini:resize-end"),
  },
});
