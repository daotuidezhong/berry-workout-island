export type Point = { x: number; y: number };

export function getFurnitureTarget(position: Point, standHeight: number | null) {
  const onTop = standHeight !== null;
  return {
    x: Math.min(93, Math.max(7, position.x + (onTop ? 0 : 6))),
    y: Math.min(88, Math.max(36, position.y - (standHeight ?? 0))),
    jumping: onTop && standHeight > 0,
    onTop,
  };
}
