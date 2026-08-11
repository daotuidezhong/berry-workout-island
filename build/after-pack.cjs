const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { spawnSync } = require("node:child_process");

module.exports = async ({ appOutDir, electronPlatformName, packager }) => {
  if (electronPlatformName !== "win32") return;
  const rcedit = path.join(packager.projectDir, "node_modules/electron-winstaller/vendor/rcedit.exe");
  const executable = path.join(appOutDir, `${packager.appInfo.productFilename}.exe`);
  const temporaryExecutable = path.join(os.tmpdir(), `berry-workout-${process.pid}.exe`);
  const temporaryIcon = path.join(os.tmpdir(), `berry-workout-${process.pid}.ico`);
  try {
    fs.copyFileSync(executable, temporaryExecutable);
    fs.copyFileSync(path.join(packager.projectDir, "build/icon.ico"), temporaryIcon);
    const result = spawnSync(rcedit, [temporaryExecutable, "--set-icon", temporaryIcon], { stdio: "inherit" });
    if (result.status !== 0) throw new Error("无法写入 Windows 程序图标");
    fs.copyFileSync(temporaryExecutable, executable);
  } finally {
    if (fs.existsSync(temporaryExecutable)) fs.unlinkSync(temporaryExecutable);
    if (fs.existsSync(temporaryIcon)) fs.unlinkSync(temporaryIcon);
  }
};
