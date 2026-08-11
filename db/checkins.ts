import { env } from "cloudflare:workers";

export type CheckinRecord = {
  id: number;
  date: string;
  content: string;
  category: string;
  minutes: number | null;
  mood: string | null;
  createdAt: string;
};

async function prepareCheckins() {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    date TEXT NOT NULL,
    activity TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '其他',
    minutes INTEGER,
    mood TEXT,
    created_at TEXT NOT NULL
  )`).run();
  const columns = await env.DB.prepare("PRAGMA table_info(checkins)").all<{ name: string }>();
  if (!columns.results.some((column) => column.name === "category")) await env.DB.prepare("ALTER TABLE checkins ADD category TEXT NOT NULL DEFAULT '其他'").run();
  if (!columns.results.some((column) => column.name === "mood")) await env.DB.prepare("ALTER TABLE checkins ADD mood TEXT").run();
  await env.DB.prepare("DROP INDEX IF EXISTS idx_checkins_device_date").run();
}

export async function listCheckins(deviceId: string) {
  await prepareCheckins();
  const result = await env.DB.prepare(
    "SELECT id, date, activity AS content, category, minutes, mood, created_at AS createdAt FROM checkins WHERE device_id = ? ORDER BY date DESC, created_at DESC LIMIT 100",
  ).bind(deviceId).all<CheckinRecord>();
  return result.results;
}

export async function saveCheckin(deviceId: string, date: string, content: string, category: string, minutes: number | null, mood: string | null) {
  await prepareCheckins();
  const createdAt = new Date().toISOString();
  const result = await env.DB.prepare(`INSERT INTO checkins (device_id, date, activity, category, minutes, mood, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(deviceId, date, content, category, minutes, mood, createdAt).run();
  return env.DB.prepare(
    "SELECT id, date, activity AS content, category, minutes, mood, created_at AS createdAt FROM checkins WHERE id = ? AND device_id = ?",
  ).bind(result.meta.last_row_id, deviceId).first<CheckinRecord>();
}
