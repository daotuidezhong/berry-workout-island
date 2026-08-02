export type Point = { x: number; y: number };

export const CAT_BOUNDS = { minX: 7, maxX: 93, minY: 24, maxY: 88 };

export function getFurnitureTarget(position: Point, standHeight: number | null) {
  const onTop = standHeight !== null;
  return {
    x: Math.min(CAT_BOUNDS.maxX, Math.max(CAT_BOUNDS.minX, position.x + (onTop ? 0 : 6))),
    y: Math.min(CAT_BOUNDS.maxY, Math.max(CAT_BOUNDS.minY, position.y - (standHeight ?? 0))),
    jumping: onTop && standHeight > 0,
    onTop,
  };
}
