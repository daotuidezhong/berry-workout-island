export type Point = { x: number; y: number };

export const CAT_BOUNDS = { minX: 7, maxX: 93, minY: 43, maxY: 88 };

export function clampCatPosition(position: Point): Point {
  return {
    x: Math.min(CAT_BOUNDS.maxX, Math.max(CAT_BOUNDS.minX, position.x)),
    y: Math.min(CAT_BOUNDS.maxY, Math.max(CAT_BOUNDS.minY, position.y)),
  };
}

export function getFurnitureTarget(position: Point, standHeight: number | null) {
  const onTop = standHeight !== null;
  const target = clampCatPosition({
    x: position.x + (onTop ? 0 : 6),
    y: position.y - (standHeight ?? 0),
  });
  return {
    ...target,
    jumping: onTop && standHeight > 0,
    onTop,
  };
}
