const fs = require("node:fs");
const path = require("node:path");

const BACKUP_FORMAT = "oh-user-data";
const BACKUP_VERSION = 2;
const JOURNAL_PHOTO_PATTERN = /^journal-[0-9a-f-]+\.jpg$/;

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

function readJournalPhotos(directory) {
  if (!directory || !fs.existsSync(directory)) return {};
  return Object.fromEntries(fs.readdirSync(directory)
    .filter((name) => JOURNAL_PHOTO_PATTERN.test(name))
    .map((name) => [name, fs.readFileSync(path.join(directory, name)).toString("base64")]));
}

function validateJournalPhotos(photos) {
  if (photos == null) return {};
  if (typeof photos !== "object" || Array.isArray(photos)) throw new Error("备份中的日记照片格式不正确");
  const entries = Object.entries(photos);
  const totalSize = entries.reduce((sum, [, value]) => sum + (typeof value === "string" ? value.length : 0), 0);
  if (entries.length > 500 || totalSize > 500_000_000 || entries.some(([name, value]) => !JOURNAL_PHOTO_PATTERN.test(name) || typeof value !== "string" || value.length > 10_000_000)) {
    throw new Error("备份中的日记照片格式不正确");
  }
  return Object.fromEntries(entries);
}

function restoreJournalPhotos(directory, photos, timestamp) {
  if (!directory) return;
  const temporaryDirectory = `${directory}.importing`;
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  fs.mkdirSync(temporaryDirectory, { recursive: true });
  for (const [name, value] of Object.entries(photos)) {
    fs.writeFileSync(path.join(temporaryDirectory, name), Buffer.from(value, "base64"));
  }
  if (fs.existsSync(directory)) fs.cpSync(directory, `${directory}.pre-import-${timestamp}`, { recursive: true });
  fs.rmSync(directory, { recursive: true, force: true });
  fs.renameSync(temporaryDirectory, directory);
}

function createStorage(dataFile, options = {}) {
  const journalPhotosDirectory = options.journalPhotosDirectory;
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
        assets: { journalPhotos: readJournalPhotos(journalPhotosDirectory) },
      };
    },
    importPayload(payload) {
      if (!payload || payload.format !== BACKUP_FORMAT || ![1, BACKUP_VERSION].includes(payload.version)) {
        throw new Error("这不是可识别的 OH 备份文件");
      }
      const data = validateStoredData(payload.data);
      const journalPhotos = validateJournalPhotos(payload.assets?.journalPhotos);
      fs.mkdirSync(path.dirname(dataFile), { recursive: true });
      const timestamp = new Date().toISOString().replaceAll(":", "-");
      if (fs.existsSync(dataFile)) {
        fs.copyFileSync(dataFile, path.join(path.dirname(dataFile), `user-data.pre-import-${timestamp}.json`));
      }
      restoreJournalPhotos(journalPhotosDirectory, journalPhotos, timestamp);
      write(data);
      fs.copyFileSync(dataFile, backupFile);
      return Object.keys(data);
    },
  };
}

module.exports = { createStorage };
