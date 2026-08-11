export type CropId = "strawberry" | "carrot" | "tomato" | "catnip" | "sunflower" | "pumpkin";
export type CropStage = "seed" | "seedling" | "growing" | "mature";
export type CropPlotState = { cropId: CropId; plantedAt: number; wateredAt: number | null } | null;
export type SeedInventory = Record<CropId, number>;
export type ProduceInventory = Record<CropId, number>;

export const cropItems = [
  { id: "strawberry" as CropId, name: "草莓", seedPrice: 2, growMs: 30 * 60_000 },
  { id: "carrot" as CropId, name: "胡萝卜", seedPrice: 3, growMs: 45 * 60_000 },
  { id: "tomato" as CropId, name: "小番茄", seedPrice: 4, growMs: 90 * 60_000 },
  { id: "catnip" as CropId, name: "猫薄荷", seedPrice: 5, growMs: 2 * 60 * 60_000 },
  { id: "sunflower" as CropId, name: "向日葵", seedPrice: 7, growMs: 3 * 60 * 60_000 },
  { id: "pumpkin" as CropId, name: "南瓜", seedPrice: 10, growMs: 6 * 60 * 60_000 },
];

export const INITIAL_SEEDS: SeedInventory = Object.fromEntries(cropItems.map((crop) => [crop.id, 1])) as SeedInventory;
export const INITIAL_PRODUCE: ProduceInventory = Object.fromEntries(cropItems.map((crop) => [crop.id, 0])) as ProduceInventory;
export const EMPTY_FARM: CropPlotState[] = Array.from({ length: 12 }, () => null);

export function getCropProgress(plot: CropPlotState, now = Date.now()) {
  if (!plot?.wateredAt) return 0;
  const crop = cropItems.find((item) => item.id === plot.cropId)!;
  return Math.min(1, Math.max(0, now - plot.wateredAt) / crop.growMs);
}

export function getCropStage(plot: CropPlotState, now = Date.now()): CropStage {
  const progress = getCropProgress(plot, now);
  if (progress >= 1) return "mature";
  if (progress >= .6) return "growing";
  if (progress >= .25) return "seedling";
  return "seed";
}

export function waterUnwateredPlots(plots: CropPlotState[], now = Date.now()) {
  return plots.map((plot) => plot && plot.wateredAt === null ? { ...plot, wateredAt: now } : plot);
}

export function formatGrowTime(growMs: number) {
  const minutes = growMs / 60_000;
  return minutes < 60 ? `${minutes} 分钟` : `${minutes / 60} 小时`;
}

export function getCookingProgress(startedAt: number, endsAt: number, now = Date.now()) {
  return Math.min(1, Math.max(0, (now - startedAt) / (endsAt - startedAt)));
}

export function formatCookingTime(endsAt: number, now = Date.now()) {
  const seconds = Math.max(0, Math.ceil((endsAt - now) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
