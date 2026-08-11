const devicePattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const categories = new Set(["运动", "学习", "工作", "饮食", "心情", "睡眠", "娱乐", "其他"]);
const moods = new Set(["很差", "低落", "平静", "开心", "超棒"]);
function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

export async function GET(request: Request) {
  const deviceId = new URL(request.url).searchParams.get("device") ?? "";
  if (!devicePattern.test(deviceId)) return json({ error: "无效设备" }, 400);
  const { listCheckins } = await import("@/db/checkins");
  return json({ records: await listCheckins(deviceId) });
}

export async function POST(request: Request) {
  let body: { deviceId?: string; date?: string; content?: string; category?: string; minutes?: number | null; mood?: string | null };
  try {
    body = await request.json();
  } catch {
    return json({ error: "记录内容无效" }, 400);
  }
  const deviceId = body.deviceId ?? "";
  const date = body.date ?? "";
  const content = body.content?.trim() ?? "";
  const category = body.category ?? "其他";
  const mood = body.mood ?? null;
  const minutes = body.minutes == null ? null : Math.round(body.minutes);
  if (!devicePattern.test(deviceId) || !datePattern.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00`)) || !content || content.length > 300 || !categories.has(category) || (mood !== null && !moods.has(mood)) || (minutes !== null && (minutes < 1 || minutes > 600))) {
    return json({ error: "记录内容无效" }, 400);
  }
  const { saveCheckin } = await import("@/db/checkins");
  const record = await saveCheckin(deviceId, date, content, category, minutes, mood);
  return record ? json({ record }) : json({ error: "保存失败" }, 500);
}
