import { env } from "cloudflare:workers";

export type CheckinRecord = {
  id: number;
  date: string;
  content: string;
  category: string;
  rating: number | null;
  reward: number | null;
  createdAt: string;
};

async function prepareCheckins() {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    date TEXT NOT NULL,
    activity TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '其他',
    rating INTEGER,
    reward INTEGER,
    created_at TEXT NOT NULL
  )`).run();
  const columns = await env.DB.prepare("PRAGMA table_info(checkins)").all<{ name: string }>();
  if (!columns.results.some((column) => column.name === "category")) await env.DB.prepare("ALTER TABLE checkins ADD category TEXT NOT NULL DEFAULT '其他'").run();
  if (!columns.results.some((column) => column.name === "rating")) await env.DB.prepare("ALTER TABLE checkins ADD rating INTEGER").run();
  if (!columns.results.some((column) => column.name === "reward")) await env.DB.prepare("ALTER TABLE checkins ADD reward INTEGER").run();
  await env.DB.prepare("DROP INDEX IF EXISTS idx_checkins_device_date").run();
}

export async function listCheckins(deviceId: string) {
  await prepareCheckins();
  const result = await env.DB.prepare(
    "SELECT id, date, activity AS content, category, rating, reward, created_at AS createdAt FROM checkins WHERE device_id = ? ORDER BY date DESC, created_at DESC LIMIT 100",
  ).bind(deviceId).all<CheckinRecord>();
  return result.results;
}

export async function countCheckinsForDate(deviceId: string, date: string) {
  await prepareCheckins();
  const result = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM checkins WHERE device_id = ? AND date = ?",
  ).bind(deviceId, date).first<{ count: number }>();
  return result?.count ?? 0;
}

export async function saveCheckin(deviceId: string, date: string, content: string, category: string, rating: number | null, reward: number | null) {
  await prepareCheckins();
  const createdAt = new Date().toISOString();
  const result = await env.DB.prepare(`INSERT INTO checkins (device_id, date, activity, category, rating, reward, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(deviceId, date, content, category, rating, reward, createdAt).run();
  return env.DB.prepare(
    "SELECT id, date, activity AS content, category, rating, reward, created_at AS createdAt FROM checkins WHERE id = ? AND device_id = ?",
  ).bind(result.meta.last_row_id, deviceId).first<CheckinRecord>();
}
