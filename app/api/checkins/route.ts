import { estimateCalories } from "@/app/calories";

const devicePattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const deviceId = new URL(request.url).searchParams.get("device") ?? "";
  if (!devicePattern.test(deviceId)) return Response.json({ error: "无效设备" }, { status: 400 });
  const { listCheckins } = await import("@/db/checkins");
  return Response.json({ records: await listCheckins(deviceId) });
}

export async function POST(request: Request) {
  let body: { deviceId?: string; date?: string; activity?: string; minutes?: number | null };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "打卡内容无效" }, { status: 400 });
  }
  const deviceId = body.deviceId ?? "";
  const date = body.date ?? "";
  const activity = body.activity?.trim() ?? "";
  const minutes = body.minutes == null ? null : Math.round(body.minutes);
  if (!devicePattern.test(deviceId) || !datePattern.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00`)) || !activity || activity.length > 40 || (minutes !== null && (minutes < 1 || minutes > 600))) {
    return Response.json({ error: "打卡内容无效" }, { status: 400 });
  }
  const calories = minutes === null ? null : estimateCalories(activity, minutes);
  const { saveCheckin } = await import("@/db/checkins");
  const record = await saveCheckin(deviceId, date, activity, minutes, calories);
  return record ? Response.json({ record }) : Response.json({ error: "保存失败" }, { status: 500 });
}

export async function PATCH(request: Request) {
  let body: { deviceId?: string; id?: number; mood?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "心情内容无效" }, { status: 400 });
  }
  const deviceId = body.deviceId ?? "";
  const id = body.id;
  const mood = body.mood ?? "";
  if (!devicePattern.test(deviceId) || typeof id !== "number" || !Number.isInteger(id) || id < 1 || typeof body.mood !== "string" || mood.length > 200) {
    return Response.json({ error: "心情内容无效" }, { status: 400 });
  }
  const { saveCheckinMood } = await import("@/db/checkins");
  const record = await saveCheckinMood(deviceId, id, mood);
  return record ? Response.json({ record }) : Response.json({ error: "记录不存在" }, { status: 404 });
}
