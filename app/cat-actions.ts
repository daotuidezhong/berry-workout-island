export type CatStatLevel = "low" | "medium" | "high";
export type CatStatusId =
  | "high-low"
  | "high-medium"
  | "high-high"
  | "medium-low"
  | "medium-medium"
  | "medium-high"
  | "low-low"
  | "low-medium"
  | "low-high";
export type CatPose = "idle" | "walk" | "groom" | "yawn" | "sleep" | "wake";
export type CatAnimationFrame = {
  pose: CatPose;
  frame?: 0 | 1 | 2 | 3;
  duration: number;
  x?: number;
  y?: number;
};

export const CAT_STATUS_ANIMATIONS: Record<CatStatusId, { name: string; frames: CatAnimationFrame[] }> = {
  "high-low": {
    name: "蓄力轻扑",
    frames: [
      { pose: "idle", duration: 260 },
      { pose: "walk", frame: 0, duration: 150, y: 1 },
      { pose: "walk", frame: 1, duration: 120, x: 2, y: 1 },
      { pose: "walk", frame: 2, duration: 110, x: 6, y: -3 },
      { pose: "walk", frame: 3, duration: 130, x: 12, y: -10 },
      { pose: "walk", frame: 2, duration: 140, x: 16, y: -3 },
      { pose: "walk", frame: 1, duration: 160, x: 11 },
      { pose: "walk", frame: 0, duration: 180, x: 5 },
      { pose: "idle", duration: 360 },
    ],
  },
  "high-medium": {
    name: "玩闹后哈欠",
    frames: [
      { pose: "idle", duration: 220 },
      { pose: "walk", frame: 0, duration: 140, x: -2 },
      { pose: "walk", frame: 1, duration: 120, x: 2 },
      { pose: "walk", frame: 2, duration: 120, x: 6 },
      { pose: "walk", frame: 3, duration: 150, x: 2 },
      { pose: "idle", duration: 220 },
      { pose: "yawn", frame: 0, duration: 220 },
      { pose: "yawn", frame: 1, duration: 220 },
      { pose: "yawn", frame: 2, duration: 260 },
      { pose: "yawn", frame: 3, duration: 420 },
      { pose: "yawn", frame: 2, duration: 260 },
      { pose: "yawn", frame: 1, duration: 220 },
      { pose: "yawn", frame: 0, duration: 220 },
      { pose: "idle", duration: 280 },
      { pose: "walk", frame: 1, duration: 140, x: 2 },
      { pose: "walk", frame: 2, duration: 130, x: 5 },
      { pose: "walk", frame: 1, duration: 150, x: 2 },
      { pose: "idle", duration: 340 },
    ],
  },
  "high-high": {
    name: "困过头追尾",
    frames: [
      { pose: "idle", duration: 180 },
      { pose: "walk", frame: 0, duration: 100, x: -4 },
      { pose: "walk", frame: 1, duration: 90 },
      { pose: "walk", frame: 2, duration: 90, x: 4 },
      { pose: "walk", frame: 3, duration: 100 },
      { pose: "walk", frame: 0, duration: 110, x: -4 },
      { pose: "walk", frame: 1, duration: 100 },
      { pose: "walk", frame: 2, duration: 110, x: 4 },
      { pose: "walk", frame: 3, duration: 150, x: 1 },
      { pose: "yawn", frame: 0, duration: 220, x: 1 },
      { pose: "yawn", frame: 1, duration: 250, x: -1 },
      { pose: "yawn", frame: 0, duration: 230, x: 1 },
      { pose: "yawn", frame: 0, duration: 280 },
      { pose: "yawn", frame: 0, duration: 240 },
      { pose: "idle", duration: 420 },
    ],
  },
  "medium-low": {
    name: "抬爪巡视",
    frames: [
      { pose: "idle", duration: 420 },
      { pose: "walk", frame: 0, duration: 260 },
      { pose: "walk", frame: 1, duration: 280, x: 2 },
      { pose: "walk", frame: 2, duration: 280, x: 4 },
      { pose: "walk", frame: 3, duration: 280, x: 6 },
      { pose: "groom", frame: 0, duration: 360, x: 4 },
      { pose: "groom", frame: 1, duration: 340, x: 3 },
      { pose: "groom", frame: 0, duration: 360, x: 2 },
      { pose: "idle", duration: 520 },
    ],
  },
  "medium-medium": {
    name: "洗脸伸懒腰",
    frames: [
      { pose: "idle", duration: 320 },
      { pose: "groom", frame: 0, duration: 260 },
      { pose: "groom", frame: 1, duration: 240 },
      { pose: "groom", frame: 2, duration: 230 },
      { pose: "groom", frame: 3, duration: 260 },
      { pose: "groom", frame: 2, duration: 230 },
      { pose: "groom", frame: 1, duration: 240 },
      { pose: "groom", frame: 0, duration: 260 },
      { pose: "idle", duration: 280 },
      { pose: "yawn", frame: 0, duration: 260 },
      { pose: "yawn", frame: 1, duration: 260 },
      { pose: "yawn", frame: 2, duration: 280 },
      { pose: "yawn", frame: 3, duration: 360 },
      { pose: "yawn", frame: 2, duration: 280 },
      { pose: "yawn", frame: 1, duration: 260 },
      { pose: "yawn", frame: 0, duration: 260 },
      { pose: "idle", duration: 440 },
    ],
  },
  "medium-high": {
    name: "点头惊醒",
    frames: [
      { pose: "idle", duration: 460 },
      { pose: "yawn", frame: 0, duration: 360, y: 1 },
      { pose: "yawn", frame: 1, duration: 420, y: 2 },
      { pose: "yawn", frame: 0, duration: 360, y: 3 },
      { pose: "yawn", frame: 0, duration: 420, x: -2, y: 1 },
      { pose: "idle", duration: 170, x: 2 },
      { pose: "idle", duration: 360 },
      { pose: "yawn", frame: 0, duration: 400, y: 1 },
      { pose: "yawn", frame: 0, duration: 440, x: 1, y: 2 },
      { pose: "idle", duration: 500 },
    ],
  },
  "low-low": {
    name: "安静观察",
    frames: [
      { pose: "idle", duration: 1200 },
      { pose: "groom", frame: 0, duration: 440, x: 1 },
      { pose: "idle", duration: 900 },
      { pose: "groom", frame: 1, duration: 360, x: 1 },
      { pose: "groom", frame: 0, duration: 440 },
      { pose: "idle", duration: 1400 },
    ],
  },
  "low-medium": {
    name: "香箱犯困",
    frames: [
      { pose: "idle", duration: 820 },
      { pose: "yawn", frame: 0, duration: 520, y: 1 },
      { pose: "yawn", frame: 1, duration: 560, y: 2 },
      { pose: "yawn", frame: 0, duration: 520, y: 1 },
      { pose: "idle", duration: 920 },
      { pose: "yawn", frame: 0, duration: 520, y: 1 },
      { pose: "idle", duration: 920 },
    ],
  },
  "low-high": {
    name: "蜷睡呼吸",
    frames: [
      { pose: "sleep", duration: 800 },
      { pose: "sleep", duration: 800, y: -1 },
      { pose: "sleep", duration: 800 },
      { pose: "sleep", duration: 800, y: 1 },
      { pose: "sleep", duration: 800 },
    ],
  },
};

const STATUS_LEVELS: Record<CatStatusId, { energy: CatStatLevel; sleepiness: CatStatLevel }> = {
  "high-low": { energy: "high", sleepiness: "low" },
  "high-medium": { energy: "high", sleepiness: "medium" },
  "high-high": { energy: "high", sleepiness: "high" },
  "medium-low": { energy: "medium", sleepiness: "low" },
  "medium-medium": { energy: "medium", sleepiness: "medium" },
  "medium-high": { energy: "medium", sleepiness: "high" },
  "low-low": { energy: "low", sleepiness: "low" },
  "low-medium": { energy: "low", sleepiness: "medium" },
  "low-high": { energy: "low", sleepiness: "high" },
};

export function getCatStatLevel(value: number): CatStatLevel {
  if (value <= 30) return "low";
  if (value <= 70) return "medium";
  return "high";
}

export function getCatStatus(energy: number, sleepiness: number): CatStatusId {
  return `${getCatStatLevel(energy)}-${getCatStatLevel(sleepiness)}` as CatStatusId;
}

export function getCatStatusTransition(from: CatStatusId, to: CatStatusId): CatAnimationFrame[] {
  if (to === "low-high") {
    return [
      { pose: "idle", duration: 240 },
      { pose: "yawn", frame: 0, duration: 260 },
      { pose: "yawn", frame: 1, duration: 280 },
      { pose: "yawn", frame: 2, duration: 300 },
      { pose: "yawn", frame: 3, duration: 420 },
      { pose: "yawn", frame: 2, duration: 260 },
      { pose: "yawn", frame: 1, duration: 240 },
      { pose: "wake", duration: 420 },
      { pose: "sleep", duration: 600 },
    ];
  }

  if (from === "low-high") {
    return [
      { pose: "sleep", duration: 360 },
      { pose: "wake", duration: 360 },
      { pose: "yawn", frame: 0, duration: 240 },
      { pose: "yawn", frame: 1, duration: 240 },
      { pose: "yawn", frame: 0, duration: 220 },
      { pose: "idle", duration: 360 },
    ];
  }

  const current = STATUS_LEVELS[from];
  const next = STATUS_LEVELS[to];
  if (current.energy === "high" && next.energy === "low") {
    return [
      { pose: "walk", frame: 3, duration: 220, x: 4 },
      { pose: "walk", frame: 2, duration: 260, x: 3 },
      { pose: "walk", frame: 1, duration: 300, x: 1 },
      { pose: "idle", duration: 420 },
    ];
  }
  if (current.energy === "low" && next.energy === "high") {
    return [
      { pose: "idle", duration: 280 },
      { pose: "walk", frame: 0, duration: 220 },
      { pose: "walk", frame: 1, duration: 180, x: 2 },
      { pose: "idle", duration: 280 },
    ];
  }
  if (current.sleepiness === "low" && next.sleepiness === "high") {
    return [
      { pose: "idle", duration: 260 },
      { pose: "yawn", frame: 0, duration: 260 },
      { pose: "yawn", frame: 1, duration: 300 },
      { pose: "yawn", frame: 0, duration: 260 },
      { pose: "idle", duration: 320 },
    ];
  }
  if (current.sleepiness === "high" && next.sleepiness === "low") {
    return [
      { pose: "wake", duration: 360 },
      { pose: "yawn", frame: 0, duration: 240 },
      { pose: "idle", duration: 360 },
    ];
  }
  return [{ pose: "idle", duration: 360 }];
}
