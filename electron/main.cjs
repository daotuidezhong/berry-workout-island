const { app, BrowserWindow, ipcMain, net, protocol } = require("electron");
const { autoUpdater } = require("electron-updater");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

app.setName("OH");

protocol.registerSchemesAsPrivileged([{
  scheme: "berry",
  privileges: { standard: true, secure: true, supportFetchAPI: true },
}]);

app.whenReady().then(() => {
  const root = app.isPackaged
    ? path.join(process.resourcesPath, "desktop-dist")
    : path.join(__dirname, "../desktop-dist");

  protocol.handle("berry", (request) => {
    const pathname = decodeURIComponent(new URL(request.url).pathname);
    const file = path.resolve(root, pathname === "/" ? "index.html" : `.${pathname}`);
    if (!file.startsWith(root)) return new Response("Not found", { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });

  const window = new BrowserWindow({
    title: "OH",
    icon: app.isPackaged ? path.join(process.resourcesPath, "build/icon.png") : path.join(__dirname, "../build/icon.png"),
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#f7ead7",
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, "preload.cjs") },
  });
  const sendUpdate = (status) => window.webContents.send("update:status", status);
  const dataFile = path.join(app.getPath("userData"), "user-data.json");
  const readData = () => {
    try { return JSON.parse(fs.readFileSync(dataFile, "utf8")); } catch { return {}; }
  };
  ipcMain.on("storage:load", (event, key) => { event.returnValue = readData()[key] ?? null; });
  ipcMain.on("storage:save", (_event, key, value) => {
    const data = { ...readData(), [key]: value };
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(data), "utf8");
  });
  autoUpdater.autoDownload = false;
  autoUpdater.on("update-available", (info) => sendUpdate({
    phase: "available",
    name: info.releaseName || `草莓打卡屋 v${info.version}`,
    notes: Array.isArray(info.releaseNotes) ? info.releaseNotes.map((item) => item.note).join("\n") : info.releaseNotes,
  }));
  autoUpdater.on("download-progress", (progress) => sendUpdate({ phase: "downloading", percent: progress.percent }));
  autoUpdater.on("update-downloaded", (info) => sendUpdate({ phase: "downloaded", name: `v${info.version} 已下载`, message: "点击按钮安装，新版本会自动重新打开。" }));
  autoUpdater.on("error", () => sendUpdate({ phase: "error", message: "暂时无法获取更新，请稍后再试。" }));
  ipcMain.handle("update:download", () => autoUpdater.downloadUpdate());
  ipcMain.handle("app:version", () => app.getVersion());
  ipcMain.on("update:install", () => autoUpdater.quitAndInstall());
  window.webContents.setUserAgent(`${window.webContents.getUserAgent()} BerryWorkoutDesktop`);
  window.webContents.once("did-finish-load", () => { if (app.isPackaged) autoUpdater.checkForUpdates().catch(() => {}); });
  window.loadURL("berry://game/");
});

app.on("window-all-closed", () => app.quit());
