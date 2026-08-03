import { env } from "cloudflare:workers";

export type CheckinRecord = {
  id: number;
  date: string;
  activity: string;
  minutes: number | null;
  calories: number | null;
};

async function prepareCheckins() {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    date TEXT NOT NULL,
    activity TEXT NOT NULL,
    minutes INTEGER,
    calories INTEGER,
    created_at TEXT NOT NULL
  )`).run();
  await env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_checkins_device_date ON checkins(device_id, date)").run();
}

export async function listCheckins(deviceId: string) {
  await prepareCheckins();
  const result = await env.DB.prepare(
    "SELECT id, date, activity, minutes, calories FROM checkins WHERE device_id = ? ORDER BY date DESC LIMIT 100",
  ).bind(deviceId).all<CheckinRecord>();
  return result.results;
}

export async function saveCheckin(deviceId: string, date: string, activity: string, minutes: number | null, calories: number | null) {
  await prepareCheckins();
  await env.DB.prepare(`INSERT INTO checkins (device_id, date, activity, minutes, calories, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(device_id, date) DO UPDATE SET activity = excluded.activity, minutes = excluded.minutes, calories = excluded.calories`)
    .bind(deviceId, date, activity, minutes, calories, new Date().toISOString()).run();
  return env.DB.prepare(
    "SELECT id, date, activity, minutes, calories FROM checkins WHERE device_id = ? AND date = ?",
  ).bind(deviceId, date).first<CheckinRecord>();
}
