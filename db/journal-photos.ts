async function photoStore() {
  const { env } = await import("cloudflare:workers");
  return (env as unknown as { JOURNAL_PHOTOS: R2Bucket }).JOURNAL_PHOTOS;
}

export async function getJournalPhoto(key: string) {
  return (await photoStore()).get(key);
}

export async function journalPhotoExists(key: string) {
  return Boolean(await (await photoStore()).head(key));
}

export async function saveJournalPhoto(key: string, photo: File) {
  await (await photoStore()).put(key, photo.stream(), { httpMetadata: { contentType: "image/jpeg" } });
}

export async function deleteJournalPhoto(key: string) {
  await (await photoStore()).delete(key);
}
