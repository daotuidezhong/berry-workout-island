export type PhotoBoardPhoto = {
  id: string;
  createdAt: string;
  slot: number;
  rotation: number;
  width: number;
  height: number;
  caption?: string;
  fileName?: string;
  key?: string;
};

export const PHOTO_BOARD_STORAGE_KEY = "berry-photo-board";

export function stablePhotoRotation(id: string) {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) hash = ((hash << 5) - hash + id.charCodeAt(index)) | 0;
  return [-1.5, -.8, -.35, .45, .85, 1.25][Math.abs(hash) % 6];
}

export function normalizePhotoBoard(value: unknown): PhotoBoardPhoto[] {
  if (!Array.isArray(value)) return [];
  const slots = new Set<number>();
  return value.flatMap((item): PhotoBoardPhoto[] => {
    if (!item || typeof item !== "object") return [];
    const photo = item as Partial<PhotoBoardPhoto>;
    if (typeof photo.id !== "string" || typeof photo.createdAt !== "string" || !Number.isInteger(photo.width) || !Number.isInteger(photo.height) || (!photo.fileName && !photo.key)) return [];
    let slot = Number.isInteger(photo.slot) && Number(photo.slot) >= 0 ? Number(photo.slot) : 0;
    while (slots.has(slot)) slot += 1;
    slots.add(slot);
    return [{ ...photo, caption: typeof photo.caption === "string" ? photo.caption : "", slot, width: Number(photo.width), height: Number(photo.height), rotation: Number.isFinite(photo.rotation) ? Number(photo.rotation) : stablePhotoRotation(photo.id) } as PhotoBoardPhoto];
  }).sort((left, right) => left.slot - right.slot);
}
