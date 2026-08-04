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
      { pose: "walk", frame: 0, duration: 700 },
      { pose: "walk", frame: 1, duration: 380, x: 1, y: 1 },
      { pose: "walk", frame: 2, duration: 360, x: 3 },
      { pose: "walk", frame: 3, duration: 400, x: 6, y: -2 },
      { pose: "walk", frame: 2, duration: 440, x: 9, y: -4 },
      { pose: "walk", frame: 1, duration: 440, x: 11, y: -2 },
      { pose: "walk", frame: 0, duration: 720, x: 11 },
      { pose: "walk", frame: 1, duration: 440, x: 9 },
      { pose: "walk", frame: 2, duration: 420, x: 6 },
      { pose: "walk", frame: 3, duration: 420, x: 3 },
      { pose: "walk", frame: 2, duration: 420, x: 1 },
      { pose: "walk", frame: 1, duration: 460 },
      { pose: "walk", frame: 0, duration: 900 },
    ],
  },
  "high-medium": {
    name: "玩闹后哈欠",
    frames: [
      { pose: "yawn", frame: 0, duration: 1000 },
      { pose: "yawn", frame: 1, duration: 520, x: -1 },
      { pose: "yawn", frame: 0, duration: 720, x: -2 },
      { pose: "yawn", frame: 1, duration: 520, x: 1 },
      { pose: "yawn", frame: 0, duration: 760, x: 2 },
      { pose: "yawn", frame: 1, duration: 620, x: 1 },
      { pose: "yawn", frame: 2, duration: 680 },
      { pose: "yawn", frame: 3, duration: 1200 },
      { pose: "yawn", frame: 2, duration: 680 },
      { pose: "yawn", frame: 1, duration: 620 },
      { pose: "yawn", frame: 0, duration: 1100 },
    ],
  },
  "high-high": {
    name: "困过头追尾",
    frames: [
      { pose: "walk", frame: 0, duration: 620 },
      { pose: "walk", frame: 1, duration: 340, x: -2 },
      { pose: "walk", frame: 2, duration: 340, x: 1 },
      { pose: "walk", frame: 3, duration: 360, x: 3 },
      { pose: "walk", frame: 0, duration: 380 },
      { pose: "walk", frame: 1, duration: 380, x: -2 },
      { pose: "walk", frame: 2, duration: 420, x: 1 },
      { pose: "walk", frame: 3, duration: 460, x: 2 },
      { pose: "walk", frame: 2, duration: 520, x: 1, y: 1 },
      { pose: "walk", frame: 1, duration: 620, x: -1, y: 2 },
      { pose: "walk", frame: 0, duration: 900, y: 1 },
      { pose: "walk", frame: 1, duration: 620, x: 1 },
      { pose: "walk", frame: 0, duration: 1100 },
    ],
  },
  "medium-low": {
    name: "抬爪巡视",
    frames: [
      { pose: "groom", frame: 0, duration: 1200 },
      { pose: "groom", frame: 1, duration: 760, x: 1 },
      { pose: "groom", frame: 0, duration: 1000, x: 2 },
      { pose: "groom", frame: 1, duration: 760, x: 1 },
      { pose: "groom", frame: 2, duration: 820 },
      { pose: "groom", frame: 1, duration: 760 },
      { pose: "groom", frame: 0, duration: 1400 },
    ],
  },
  "medium-medium": {
    name: "洗脸伸懒腰",
    frames: [
      { pose: "groom", frame: 0, duration: 1100 },
      { pose: "groom", frame: 1, duration: 620 },
      { pose: "groom", frame: 2, duration: 760 },
      { pose: "groom", frame: 3, duration: 900 },
      { pose: "groom", frame: 2, duration: 760 },
      { pose: "groom", frame: 1, duration: 620 },
      { pose: "groom", frame: 0, duration: 900 },
      { pose: "groom", frame: 1, duration: 620 },
      { pose: "groom", frame: 0, duration: 1400 },
    ],
  },
  "medium-high": {
    name: "点头惊醒",
    frames: [
      { pose: "yawn", frame: 0, duration: 1400 },
      { pose: "yawn", frame: 1, duration: 900, y: 1 },
      { pose: "yawn", frame: 2, duration: 720, y: 2 },
      { pose: "yawn", frame: 1, duration: 820, y: 3 },
      { pose: "yawn", frame: 0, duration: 1200, y: 2 },
      { pose: "yawn", frame: 1, duration: 760, x: -1, y: 1 },
      { pose: "yawn", frame: 0, duration: 900, x: 1 },
      { pose: "yawn", frame: 1, duration: 760 },
      { pose: "yawn", frame: 0, duration: 1600 },
    ],
  },
  "low-low": {
    name: "安静观察",
    frames: [
      { pose: "idle", duration: 1800 },
      { pose: "idle", duration: 1400, x: 1 },
      { pose: "idle", duration: 1400, x: 2, y: 1 },
      { pose: "idle", duration: 1600, x: 1 },
      { pose: "idle", duration: 1400, x: -1 },
      { pose: "idle", duration: 1400, y: 1 },
      { pose: "idle", duration: 2000 },
    ],
  },
  "low-medium": {
    name: "香箱犯困",
    frames: [
      { pose: "yawn", frame: 0, duration: 1800 },
      { pose: "yawn", frame: 1, duration: 1200, y: 1 },
      { pose: "yawn", frame: 0, duration: 1600, y: 2 },
      { pose: "yawn", frame: 1, duration: 1200, y: 2 },
      { pose: "yawn", frame: 0, duration: 1700, y: 1 },
      { pose: "yawn", frame: 1, duration: 1100 },
      { pose: "yawn", frame: 0, duration: 2100 },
    ],
  },
  "low-high": {
    name: "蜷睡呼吸",
    frames: [
      { pose: "sleep", duration: 1400 },
      { pose: "sleep", duration: 1300, y: -1 },
      { pose: "sleep", duration: 1300, y: -1 },
      { pose: "sleep", duration: 1400 },
      { pose: "sleep", duration: 1300, y: 1 },
      { pose: "sleep", duration: 1300, y: 1 },
      { pose: "sleep", duration: 1500 },
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
  const start = { ...CAT_STATUS_ANIMATIONS[from].frames.at(-1)!, duration: 900, x: 0, y: 0 };
  const finish = { ...CAT_STATUS_ANIMATIONS[to].frames[0], duration: 1100, x: 0, y: 0 };

  if (to === "low-high") {
    return [
      start,
      { pose: "idle", duration: 1000 },
      { pose: "yawn", frame: 0, duration: 700 },
      { pose: "yawn", frame: 1, duration: 680 },
      { pose: "yawn", frame: 2, duration: 720 },
      { pose: "yawn", frame: 3, duration: 1200 },
      { pose: "yawn", frame: 2, duration: 720 },
      { pose: "yawn", frame: 1, duration: 680 },
      { pose: "wake", duration: 1200 },
      finish,
    ];
  }

  if (from === "low-high") {
    return [
      start,
      { pose: "wake", duration: 1200 },
      { pose: "yawn", frame: 0, duration: 700 },
      { pose: "yawn", frame: 1, duration: 680 },
      { pose: "yawn", frame: 2, duration: 720 },
      { pose: "yawn", frame: 3, duration: 1200 },
      { pose: "yawn", frame: 2, duration: 720 },
      { pose: "yawn", frame: 1, duration: 680 },
      { pose: "yawn", frame: 0, duration: 800 },
      { pose: "idle", duration: 1000 },
      finish,
    ];
  }

  const current = STATUS_LEVELS[from];
  const next = STATUS_LEVELS[to];
  if (current.energy === "high" && next.energy === "low" && start.pose === "walk") {
    return [
      start,
      { pose: "walk", frame: 1, duration: 480, x: 2 },
      { pose: "walk", frame: 2, duration: 540, x: 3 },
      { pose: "walk", frame: 1, duration: 620, x: 1 },
      { pose: "walk", frame: 0, duration: 900 },
      finish,
    ];
  }

  const sittingPoses: CatPose[] = ["idle", "groom", "yawn"];
  if (sittingPoses.includes(start.pose) && sittingPoses.includes(finish.pose) && start.pose !== finish.pose) {
    return [start, { pose: "idle", duration: 1100 }, finish];
  }
  return [start, finish];
}
