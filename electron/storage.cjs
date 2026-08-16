const fs = require("node:fs");
const path = require("node:path");

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return null; }
}

function createStorage(dataFile) {
  const backupFile = path.join(path.dirname(dataFile), "user-data.backup.json");
  const temporaryFile = `${dataFile}.tmp`;
  const read = () => readJson(dataFile) ?? readJson(backupFile) ?? {};

  return {
    load(key) {
      return read()[key] ?? null;
    },
    save(key, value) {
      const current = readJson(dataFile);
      const data = { ...read(), [key]: value };
      fs.mkdirSync(path.dirname(dataFile), { recursive: true });
      fs.writeFileSync(temporaryFile, JSON.stringify(data), "utf8");
      if (current) fs.copyFileSync(dataFile, backupFile);
      fs.copyFileSync(temporaryFile, dataFile);
      fs.unlinkSync(temporaryFile);
    },
  };
}

module.exports = { createStorage };
