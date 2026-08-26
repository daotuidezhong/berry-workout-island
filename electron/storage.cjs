const fs = require("node:fs");
const path = require("node:path");

const BACKUP_FORMAT = "oh-user-data";
const BACKUP_VERSION = 1;

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return null; }
}

function validateStoredData(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("备份中没有可用数据");
  const entries = Object.entries(data);
  if (!entries.length || entries.some(([key, value]) => !key.startsWith("berry-") || typeof value !== "string")) {
    throw new Error("备份数据格式不正确");
  }
  return Object.fromEntries(entries);
}

function createStorage(dataFile) {
  const backupFile = path.join(path.dirname(dataFile), "user-data.backup.json");
  const temporaryFile = `${dataFile}.tmp`;
  const read = () => readJson(dataFile) ?? readJson(backupFile) ?? {};
  const write = (data) => {
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    fs.writeFileSync(temporaryFile, JSON.stringify(data), "utf8");
    fs.copyFileSync(temporaryFile, dataFile);
    fs.unlinkSync(temporaryFile);
  };

  return {
    load(key) {
      return read()[key] ?? null;
    },
    save(key, value) {
      const current = readJson(dataFile);
      const data = { ...read(), [key]: value };
      if (current) fs.copyFileSync(dataFile, backupFile);
      write(data);
    },
    exportPayload(metadata = {}) {
      return {
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        ...metadata,
        data: validateStoredData(read()),
      };
    },
    importPayload(payload) {
      if (!payload || payload.format !== BACKUP_FORMAT || payload.version !== BACKUP_VERSION) {
        throw new Error("这不是可识别的 OH 备份文件");
      }
      const data = validateStoredData(payload.data);
      fs.mkdirSync(path.dirname(dataFile), { recursive: true });
      if (fs.existsSync(dataFile)) {
        const timestamp = new Date().toISOString().replaceAll(":", "-");
        fs.copyFileSync(dataFile, path.join(path.dirname(dataFile), `user-data.pre-import-${timestamp}.json`));
      }
      write(data);
      fs.copyFileSync(dataFile, backupFile);
      return Object.keys(data);
    },
  };
}

module.exports = { createStorage };
