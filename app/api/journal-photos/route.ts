import { deleteJournalPhoto, getJournalPhoto, saveJournalPhoto } from "@/db/journal-photos";

const devicePattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const photoKeyPattern = /^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/journal-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.jpg$/i;

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key") ?? "";
  if (!photoKeyPattern.test(key)) return new Response("Not found", { status: 404 });
  const object = await getJournalPhoto(key);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "content-type": object.httpMetadata?.contentType ?? "image/jpeg",
      "cache-control": "private, max-age=31536000, immutable",
    },
  });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const deviceId = String(form.get("deviceId") ?? "");
  const width = Number(form.get("width"));
  const height = Number(form.get("height"));
  const photo = form.get("photo");
  if (!devicePattern.test(deviceId) || !(photo instanceof File) || photo.type !== "image/jpeg" || photo.size === 0 || photo.size > 5_000_000 || !Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 1600 || height > 1600) {
    return Response.json({ error: "照片内容无效" }, { status: 400 });
  }
  const key = `${deviceId}/journal-${crypto.randomUUID()}.jpg`;
  await saveJournalPhoto(key, photo);
  return Response.json({ photo: { key, width, height } });
}

export async function DELETE(request: Request) {
  let body: { deviceId?: string; key?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "请求无效" }, { status: 400 });
  }
  const match = body.key?.match(photoKeyPattern);
  if (!devicePattern.test(body.deviceId ?? "") || !match || match[1] !== body.deviceId) return Response.json({ error: "请求无效" }, { status: 400 });
  await deleteJournalPhoto(body.key!);
  return Response.json({ status: "deleted" });
}
