import type { Point } from "./furniture";

export const WALK_DIRECTIONS = ["left", "up-left", "up", "up-right", "right", "down-right", "down", "down-left"] as const;

export type WalkDirection = (typeof WALK_DIRECTIONS)[number];

export const WALK_DIRECTION_ROW = Object.fromEntries(WALK_DIRECTIONS.map((direction, row) => [direction, row])) as Record<WalkDirection, number>;

const ANGLE_DIRECTIONS: WalkDirection[] = ["right", "down-right", "down", "down-left", "left", "up-left", "up", "up-right"];

export function getWalkDirection(from: Point, to: Point, fallback: WalkDirection = "right") {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (!dx && !dy) return fallback;
  const octant = (Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8;
  return ANGLE_DIRECTIONS[octant];
}
