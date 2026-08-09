"use client";

import { useEffect, useRef, useState } from "react";
import { clampCatPosition, getFurnitureTarget, type Point } from "./game/furniture";
import { getTimePeriod, type TimePeriod } from "./game/time-period";
import { estimateCalories } from "./game/calories";
import { getRoomAsset, getWeatherKind, type WeatherKind } from "./game/weather";
import {
  CAT_STATUS_ANIMATIONS,
  getCatStatus,
  getCatStatusTransition,
  type CatAnimationFrame,
  type CatPose,
  type CatStatusId,
} from "./game/cat-actions";
import { canPetMove, decayPetStatsByTime, formatSleepRemaining, getSleepRemainingMs, PET_STAT_DECAY_MS, SLEEP_DURATION_MS } from "./game/pet-stats";

type PetId = "mitao" | "doubao" | "xueqiu";
type OverlayId = "quest" | "history" | "bag" | "pets" | "shop" | null;
type ShopCategory = "food" | "furniture";
type CheckinRecord = { id: number; date: string; activity: string; minutes: number | null; calories: number | null; mood: string | null };
type DesktopUpdate = { phase: "available" | "downloading" | "downloaded" | "error"; name?: string; notes?: string; percent?: number; message?: string };
type FoodId = "driedFish" | "chickenCan" | "salmonMousse" | "tunaRice" | "chickenCubes" | "catnipBiscuits";
type GameState = {
  statModelVersion: 2;
  berries: number;
  streak: number;
  lastCheckin: string | null;
  lastActivity: string | null;
  pet: PetId;
  petNames: Record<PetId, string>;
  purchased: string[];
  inventory: Record<FoodId, number>;
  energy: number;
  sleepiness: number;
  statsUpdatedAt: number;
  catPosition: Point;
  catFurniture: string | null;
  sleepEndsAt: number | null;
  sleepRest: number;
  furniturePositions: Record<string, Point>;
};

const BACKUP_ORIGIN = "https://berry-workout-island.light-gnat-9329.chatgpt.site";

async function syncDesktopRecord(deviceId: string, record: CheckinRecord) {
  const response = await fetch(`${BACKUP_ORIGIN}/api/checkins`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ deviceId, date: record.date, activity: record.activity, minutes: record.minutes }),
  });
  if (!response.ok) throw new Error();
  let synced = (await response.json() as { record: CheckinRecord }).record;
  if (record.mood) {
    const moodResponse = await fetch(`${BACKUP_ORIGIN}/api/checkins`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deviceId, id: synced.id, mood: record.mood }),
    });
    if (!moodResponse.ok) throw new Error();
    synced = (await moodResponse.json() as { record: CheckinRecord }).record;
  }
  return synced;
}

declare global {
  interface Window {
    gameUpdater?: {
      onStatus: (callback: (status: DesktopUpdate) => void) => () => void;
      download: () => void;
      install: () => void;
    };
  }
}

const DEFAULT_FURNITURE_POSITIONS: Record<string, Point> = {
  rug: { x: 48, y: 78 },
  plant: { x: 86, y: 62 },
  lamp: { x: 73, y: 61 },
  catbed: { x: 25, y: 77 },
  strawberrybed: { x: 38, y: 79 },
  moonbed: { x: 51, y: 78 },
  bookcase: { x: 14, y: 58 },
  table: { x: 61, y: 77 },
  cushion: { x: 78, y: 81 },
  chest: { x: 90, y: 78 },
};

const foodItems = [
  { id: "driedFish" as FoodId, name: "蝴蝶结小鱼干", detail: "香香脆脆", price: 12, energy: 14, asset: "/game/food-dried-fish.png" },
  { id: "chickenCan" as FoodId, name: "鸡肉肉酱罐头", detail: "软乎乎的肉酱", price: 18, energy: 20, asset: "/game/food-chicken-can.png" },
  { id: "salmonMousse" as FoodId, name: "三文鱼慕斯", detail: "细腻的鱼肉慕斯", price: 24, energy: 26, asset: "/game/food-salmon-mousse.png" },
  { id: "tunaRice" as FoodId, name: "金枪鱼拌饭", detail: "满满的鱼肉碎", price: 28, energy: 30, asset: "/game/food-tuna-rice.png" },
  { id: "chickenCubes" as FoodId, name: "冻干鸡肉粒", detail: "一口一个咔嚓脆", price: 22, energy: 24, asset: "/game/food-chicken-cubes.png" },
  { id: "catnipBiscuits" as FoodId, name: "猫薄荷饼干", detail: "快乐的小爪饼干", price: 16, energy: 17, asset: "/game/food-catnip-biscuits.png" },
];

const furnitureItems = [
  { id: "rug", name: "草莓地毯", detail: "柔软的大地毯", price: 35, asset: "/game/furniture-rug.png", standHeight: 0 },
  { id: "plant", name: "薄荷盆栽", detail: "让房间有一点绿意", price: 48, asset: "/game/furniture-plant.png", standHeight: null },
  { id: "lamp", name: "蘑菇夜灯", detail: "晚上会暖暖发光", price: 60, asset: "/game/furniture-lamp.png", standHeight: null },
  { id: "catbed", name: "云朵猫窝", detail: "软绵绵的基础小窝", price: 45, asset: "/game/furniture-catbed.png", standHeight: 4, rest: 30 },
  { id: "strawberrybed", name: "草莓篮子窝", detail: "暖红色的莓果小窝", price: 95, asset: "/game/furniture-catbed.png", standHeight: 4, rest: 55 },
  { id: "moonbed", name: "星空甜甜圈窝", detail: "适合睡一场长长的觉", price: 120, asset: "/game/furniture-catbed.png", standHeight: 4, rest: 80 },
  { id: "bookcase", name: "草莓书柜", detail: "摆满绘本和小收藏", price: 82, asset: "/game/furniture-bookcase.png", standHeight: null },
  { id: "table", name: "莓果小圆桌", detail: "一起坐下吃点心", price: 58, asset: "/game/furniture-table.png", standHeight: 8 },
  { id: "cushion", name: "爱心软垫", detail: "软绵绵的休息角", price: 42, asset: "/game/furniture-cushion.png", standHeight: 2 },
  { id: "chest", name: "木制玩具箱", detail: "收好猫咪的小玩具", price: 68, asset: "/game/furniture-chest.png", standHeight: 5 },
];

const pets = [
  {
    id: "mitao" as PetId, name: "蜜桃", kind: "橘子猫", nature: "热情的小太阳",
    walkFrames: [1, 2, 3, 4].map((frame) => `/game/cat-orange-walk-fixed-${frame}.png`), idle: "/game/cat-orange-idle.png", sleep: "/game/cat-orange-sleep.png", wake: "/game/cat-orange-wake.png",
    wakeYawnFrames: [1, 2, 3, 4].map((frame) => `/game/cat-orange-wake-yawn-${frame}.png`),
    groomFrames: [1, 2, 3, 4].map((frame) => `/game/cat-orange-groom-fixed-${frame}.png`),
  },
  {
    id: "doubao" as PetId, name: "豆包", kind: "奶牛猫", nature: "安静的陪跑员",
    walkFrames: [1, 2, 3, 4].map((frame) => `/game/cat-cow-walk-fixed-${frame}.png`), idle: "/game/cat-cow-idle.png", sleep: "/game/cat-cow-sleep.png", wake: "/game/cat-cow-wake.png",
    wakeYawnFrames: [1, 2, 3, 4].map((frame) => `/game/cat-cow-wake-yawn-${frame}.png`),
    groomFrames: [1, 2, 3, 4].map((frame) => `/game/cat-cow-groom-fixed-${frame}.png`),
  },
  {
    id: "xueqiu" as PetId, name: "雪球", kind: "白绒猫", nature: "爱撒娇的鼓励师",
    walkFrames: [1, 2, 3, 4].map((frame) => `/game/cat-white-walk-fixed-${frame}.png`), idle: "/game/cat-white-idle.png", sleep: "/game/cat-white-sleep.png", wake: "/game/cat-white-wake.png",
    wakeYawnFrames: [1, 2, 3, 4].map((frame) => `/game/cat-white-wake-yawn-${frame}.png`),
    groomFrames: [1, 2, 3, 4].map((frame) => `/game/cat-white-groom-fixed-${frame}.png`),
  },
];

const INITIAL_INVENTORY: Record<FoodId, number> = {
  driedFish: 2,
  chickenCan: 0,
  salmonMousse: 0,
  tunaRice: 0,
  chickenCubes: 0,
  catnipBiscuits: 0,
};

const INITIAL_GAME: GameState = {
  statModelVersion: 2,
  berries: 48,
  streak: 0,
  lastCheckin: null,
  lastActivity: null,
  pet: "mitao",
  petNames: { mitao: "蜜桃", doubao: "豆包", xueqiu: "雪球" },
  purchased: [],
  inventory: INITIAL_INVENTORY,
  energy: 72,
  sleepiness: 24,
  statsUpdatedAt: 0,
  catPosition: { x: 56, y: 72 },
  catFurniture: null,
  sleepEndsAt: null,
  sleepRest: 0,
  furniturePositions: DEFAULT_FURNITURE_POSITIONS,
};

const milestones = [
  { day: 3, bonus: 6 },
  { day: 7, bonus: 20 },
  { day: 14, bonus: 40 },
  { day: 30, bonus: 100 },
];

const WAKE_YAWN_SEQUENCE = [0, 1, 2, 3, 3, 2, 1, 0];
const WAKE_SEQUENCE_LENGTH = WAKE_YAWN_SEQUENCE.length + 3;
const WALK_FRAME_MS = 90;
const WALK_CYCLE_MS = WALK_FRAME_MS * 4;
const STATUS_IDLE_MS = 8000;

function localDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function Home() {
  const [overlay, setOverlay] = useState<OverlayId>(null);
  const [shopCategory, setShopCategory] = useState<ShopCategory>("food");
  const [selectedFood, setSelectedFood] = useState<FoodId>("driedFish");
  const [activityText, setActivityText] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [deviceId, setDeviceId] = useState("");
  const [history, setHistory] = useState<CheckinRecord[]>([]);
  const [historyPage, setHistoryPage] = useState(0);
  const [savingCheckin, setSavingCheckin] = useState(false);
  const [game, setGame] = useState<GameState>(INITIAL_GAME);
  const [ready, setReady] = useState(false);
  const [today, setToday] = useState("");
  const [dateLabel, setDateLabel] = useState("");
  const [toast, setToast] = useState("");
  const [decorating, setDecorating] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [walking, setWalking] = useState(false);
  const [jumping, setJumping] = useState(false);
  const [walkFrame, setWalkFrame] = useState(0);
  const [walkDuration, setWalkDuration] = useState(550);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("noon");
  const [weather, setWeather] = useState<{ kind: WeatherKind; label: string }>({ kind: "clear", label: "晴" });
  const [catStatus, setCatStatus] = useState<CatStatusId>(() => getCatStatus(INITIAL_GAME.energy, INITIAL_GAME.sleepiness));
  const [statusFrame, setStatusFrame] = useState(0);
  const [statusIdle, setStatusIdle] = useState(true);
  const [statusTransition, setStatusTransition] = useState<CatAnimationFrame[] | null>(null);
  const [statusTransitionTarget, setStatusTransitionTarget] = useState<CatStatusId | null>(null);
  const [resting, setResting] = useState(false);
  const [sleepRemainingMs, setSleepRemainingMs] = useState(0);
  const [interruptConfirm, setInterruptConfirm] = useState(false);
  const [wakingUp, setWakingUp] = useState(false);
  const [wakeFrame, setWakeFrame] = useState(0);
  const [headShaking, setHeadShaking] = useState(false);
  const [desktopUpdate, setDesktopUpdate] = useState<DesktopUpdate | null>(null);
  const [desktopApp, setDesktopApp] = useState(false);
  const [desktopBackupAccepted, setDesktopBackupAccepted] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const roomRef = useRef<HTMLDivElement>(null);
  const walkingTimer = useRef<number | undefined>(undefined);
  const headShakeTimer = useRef<number | undefined>(undefined);
  const sleepInterruptReadyAt = useRef(0);
  const animationImages = useRef<HTMLImageElement[]>([]);
  const desiredCatStatus = getCatStatus(game.energy, game.sleepiness);

  useEffect(() => {
    const now = new Date();
    const current = localDate(now);
    setToday(current);
    setDateLabel(now.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" }));
    setDesktopApp(navigator.userAgent.includes("BerryWorkoutDesktop"));
    setDesktopBackupAccepted(window.localStorage.getItem("berry-workout-backup-consent") === "accepted");

    const saved = window.localStorage.getItem("berry-workout-game");
    let savedDeviceId = window.localStorage.getItem("berry-workout-device");
    if (!savedDeviceId) {
      savedDeviceId = crypto.randomUUID();
      window.localStorage.setItem("berry-workout-device", savedDeviceId);
    }
    setDeviceId(savedDeviceId);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<GameState> & { food?: number };
        const legacyFood = typeof parsed.food === "number" ? parsed.food : INITIAL_INVENTORY.driedFish;
        const inventory = { ...INITIAL_INVENTORY, ...(parsed.inventory ?? {}) };
        if (!parsed.inventory) inventory.driedFish = legacyFood;
        const merged: GameState = {
          ...INITIAL_GAME,
          ...parsed,
          inventory,
          purchased: Array.isArray(parsed.purchased) ? parsed.purchased : [],
          petNames: { ...INITIAL_GAME.petNames, ...(parsed.petNames ?? {}) },
          catPosition: clampCatPosition(parsed.catPosition ?? INITIAL_GAME.catPosition),
          furniturePositions: { ...DEFAULT_FURNITURE_POSITIONS, ...(parsed.furniturePositions ?? {}) },
        };
        if (parsed.statModelVersion !== 2) {
          merged.sleepiness = 100 - clamp(merged.sleepiness, 0, 100);
          merged.statModelVersion = 2;
        }
        if (merged.lastCheckin) {
          const previous = new Date(`${merged.lastCheckin}T00:00:00`);
          const midnight = new Date(now);
          midnight.setHours(0, 0, 0, 0);
          if (Math.round((midnight.getTime() - previous.getTime()) / 86400000) > 1) merged.streak = 0;
        }
        if (merged.lastCheckin === current && merged.lastActivity) setActivityText(merged.lastActivity);
        const nowMs = now.getTime();
        merged.statsUpdatedAt = typeof parsed.statsUpdatedAt === "number" && parsed.statsUpdatedAt > 0 ? parsed.statsUpdatedAt : nowMs;
        const sleepRemaining = getSleepRemainingMs(merged.sleepEndsAt, nowMs);
        if (merged.sleepEndsAt && sleepRemaining === 0) {
          merged.sleepiness = Math.max(0, merged.sleepiness - merged.sleepRest);
          merged.sleepEndsAt = null;
          merged.sleepRest = 0;
          merged.statsUpdatedAt = nowMs;
        } else if (sleepRemaining > 0) {
          merged.statsUpdatedAt = nowMs;
          setResting(true);
          setSleepRemainingMs(sleepRemaining);
        } else {
          Object.assign(merged, decayPetStatsByTime(merged.energy, merged.sleepiness, merged.statsUpdatedAt, nowMs));
        }
        setGame(merged);
      } catch {
        setGame(INITIAL_GAME);
      }
    } else setGame({ ...INITIAL_GAME, statsUpdatedAt: now.getTime() });
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !deviceId) return;
    let cancelled = false;
    const loadHistory = async () => {
      if (navigator.userAgent.includes("BerryWorkoutDesktop")) {
        const records = JSON.parse(window.localStorage.getItem("berry-workout-history") ?? "[]") as CheckinRecord[];
        if (!cancelled) setHistory(records);
        if (window.localStorage.getItem("berry-workout-backup-consent") === "accepted") {
          try {
            const synced = await Promise.all(records.map((record) => syncDesktopRecord(deviceId, record)));
            if (!cancelled) {
              window.localStorage.setItem("berry-workout-history", JSON.stringify(synced));
              setHistory(synced);
            }
          } catch {
            if (!cancelled) setToast("本机记录已保留，云备份会稍后重试");
          }
        }
        return;
      }
      try {
        const response = await fetch(`/api/checkins?device=${encodeURIComponent(deviceId)}`);
        if (!response.ok) throw new Error();
        const data = await response.json() as { records: CheckinRecord[] };
        let records = data.records;
        if (!records.length && game.lastCheckin && game.lastActivity) {
          const migrated = await fetch("/api/checkins", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ deviceId, date: game.lastCheckin, activity: game.lastActivity, minutes: null }),
          });
          if (migrated.ok) records = [(await migrated.json() as { record: CheckinRecord }).record];
        }
        if (!cancelled) {
          setHistory(records);
          const todayRecord = records.find((record) => record.date === today);
          if (todayRecord?.minutes) setDurationMinutes(todayRecord.minutes);
        }
      } catch {
        if (!cancelled) setToast("历史记录暂时无法载入");
      }
    };
    loadHistory();
    return () => { cancelled = true; };
  }, [deviceId, ready]);

  useEffect(() => {
    const syncTimePeriod = () => setTimePeriod(getTimePeriod());
    syncTimePeriod();
    const timer = window.setInterval(syncTimePeriod, 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const labels: Record<WeatherKind, string> = { clear: "晴", cloudy: "多云", rain: "小雨", thunderstorm: "雷暴雨" };
    const syncWeather = async () => {
      try {
        const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=23.0215&longitude=113.1214&current=weather_code,cloud_cover,precipitation&timezone=Asia%2FShanghai");
        if (!response.ok) throw new Error();
        const data = await response.json() as { current: { weather_code: number; cloud_cover: number; precipitation: number } };
        const kind = getWeatherKind(data.current.weather_code, data.current.precipitation, data.current.cloud_cover);
        if (!cancelled) setWeather({ kind, label: labels[kind] });
      } catch {
        try {
          const response = await fetch("https://wttr.in/Foshan?format=j1");
          if (!response.ok) throw new Error();
          const data = await response.json() as { current_condition: Array<{ cloudcover: string; precipMM: string; weatherDesc: Array<{ value: string }> }> };
          const current = data.current_condition[0];
          const description = current.weatherDesc[0]?.value.toLowerCase() ?? "";
          const code = description.includes("thunder") ? 95 : description.includes("rain") || description.includes("drizzle") || description.includes("shower") ? 61 : description.includes("cloud") || description.includes("overcast") ? 3 : 0;
          const kind = getWeatherKind(code, Number(current.precipMM), Number(current.cloudcover));
          if (!cancelled) setWeather({ kind, label: labels[kind] });
        } catch {
          if (!cancelled) setWeather((current) => ({ ...current, label: "天气暂时无法同步" }));
        }
      }
    };
    syncWeather();
    const timer = window.setInterval(syncWeather, 15 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem("berry-workout-game", JSON.stringify(game));
  }, [game, ready]);

  useEffect(() => window.gameUpdater?.onStatus(setDesktopUpdate), []);

  useEffect(() => {
    if (!ready || resting) return;
    const syncStats = () => setGame((current) => ({
      ...current,
      ...decayPetStatsByTime(current.energy, current.sleepiness, current.statsUpdatedAt),
    }));
    syncStats();
    const timer = window.setInterval(syncStats, PET_STAT_DECAY_MS);
    const syncVisibleStats = () => { if (document.visibilityState === "visible") syncStats(); };
    window.addEventListener("focus", syncStats);
    document.addEventListener("visibilitychange", syncVisibleStats);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", syncStats);
      document.removeEventListener("visibilitychange", syncVisibleStats);
    };
  }, [ready, resting]);

  useEffect(() => {
    if (!ready || !game.sleepEndsAt) {
      setSleepRemainingMs(0);
      setResting(false);
      setInterruptConfirm(false);
      return;
    }
    const updateSleep = () => {
      const remaining = getSleepRemainingMs(game.sleepEndsAt);
      setSleepRemainingMs(remaining);
      if (remaining > 0) {
        setResting(true);
        return;
      }
      setResting(false);
      setGame((current) => {
        if (!current.sleepEndsAt || getSleepRemainingMs(current.sleepEndsAt) > 0) return current;
        return {
          ...current,
          sleepiness: Math.max(0, current.sleepiness - current.sleepRest),
          statsUpdatedAt: Date.now(),
          sleepEndsAt: null,
          sleepRest: 0,
        };
      });
      setToast(`睡醒啦，困倦值降低 ${game.sleepRest}`);
    };
    updateSleep();
    const timer = window.setInterval(updateSleep, 1000);
    return () => window.clearInterval(timer);
  }, [game.sleepEndsAt, game.sleepRest, ready]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const frames = pets.flatMap((item) => [item.idle, item.sleep, item.wake, ...item.wakeYawnFrames, ...item.walkFrames, ...item.groomFrames]);
    animationImages.current = frames.map((src) => {
      const image = new Image();
      image.src = src;
      image.decode().catch(() => undefined);
      return image;
    });
    return () => { animationImages.current = []; };
  }, []);

  useEffect(() => {
    if (!walking) {
      setWalkFrame(0);
      return;
    }
    const timer = window.setInterval(() => setWalkFrame((frame) => (frame + 1) % 4), WALK_FRAME_MS);
    return () => window.clearInterval(timer);
  }, [walking]);

  useEffect(() => {
    if (!wakingUp) return;
    let frame = 0;
    setWakeFrame(0);
    const timer = window.setInterval(() => {
      frame += 1;
      if (frame >= WAKE_SEQUENCE_LENGTH) {
        window.clearInterval(timer);
        setWakeFrame(0);
        setWakingUp(false);
        setStatusIdle(true);
        setToast("已经打完哈欠，可以继续活动了");
        return;
      }
      setWakeFrame(frame);
    }, 280);
    return () => window.clearInterval(timer);
  }, [wakingUp]);

  useEffect(() => {
    if (overlay || walking || decorating || resting || wakingUp) return;
    if (statusIdle) {
      const timer = window.setTimeout(() => {
        if (desiredCatStatus !== catStatus) {
          setStatusTransition(getCatStatusTransition(catStatus, desiredCatStatus));
          setStatusTransitionTarget(desiredCatStatus);
        }
        setStatusFrame(0);
        setStatusIdle(false);
      }, STATUS_IDLE_MS);
      return () => window.clearTimeout(timer);
    }
    const frames = statusTransition ?? CAT_STATUS_ANIMATIONS[catStatus].frames;
    const currentFrame = frames[statusFrame] ?? frames[0];
    const timer = window.setTimeout(() => {
      if (statusFrame < frames.length - 1) {
        setStatusFrame((frame) => frame + 1);
        return;
      }
      if (statusTransition) {
        setCatStatus(statusTransitionTarget ?? desiredCatStatus);
        setStatusTransition(null);
        setStatusTransitionTarget(null);
        setStatusFrame(0);
        setStatusIdle(true);
        return;
      }
      setStatusFrame(0);
      setStatusIdle(true);
    }, currentFrame.duration);
    return () => window.clearTimeout(timer);
  }, [catStatus, decorating, desiredCatStatus, overlay, resting, statusFrame, statusIdle, statusTransition, statusTransitionTarget, wakingUp, walking]);

  useEffect(() => {
    if (overlay || decorating) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, [contenteditable='true']")) return;
      const moves: Record<string, Point> = {
        ArrowLeft: { x: -3, y: 0 }, a: { x: -3, y: 0 }, A: { x: -3, y: 0 },
        ArrowRight: { x: 3, y: 0 }, d: { x: 3, y: 0 }, D: { x: 3, y: 0 },
        ArrowUp: { x: 0, y: -3 }, w: { x: 0, y: -3 }, W: { x: 0, y: -3 },
        ArrowDown: { x: 0, y: 3 }, s: { x: 0, y: 3 }, S: { x: 0, y: 3 },
      };
      const move = moves[event.key];
      if (!move) return;
      event.preventDefault();
      if (refuseMovement()) return;
      if (move.x) setDirection(move.x < 0 ? "left" : "right");
      setWalkDuration(WALK_CYCLE_MS);
      setGame((current) => ({
        ...current,
        catPosition: clampCatPosition({
          x: current.catPosition.x + move.x,
          y: current.catPosition.y + move.y,
        }),
        catFurniture: null,
      }));
      resetStatusAnimation();
      setResting(false);
      setJumping(false);
      setWalking(true);
      finishWalkAfter(WALK_CYCLE_MS);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [decorating, game.energy, overlay, resting, sleepRemainingMs, wakingUp]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOverlay(null);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const moveFurniture = (event: PointerEvent) => {
      const rect = roomRef.current?.getBoundingClientRect();
      if (!rect) return;
      const point = {
        x: clamp(((event.clientX - rect.left) / rect.width) * 100, 2, 98),
        y: clamp(((event.clientY - rect.top) / rect.height) * 100, 8, 95),
      };
      setGame((current) => ({
        ...current,
        furniturePositions: { ...current.furniturePositions, [dragging]: point },
      }));
    };
    const stopDragging = () => setDragging(null);
    window.addEventListener("pointermove", moveFurniture);
    window.addEventListener("pointerup", stopDragging, { once: true });
    window.addEventListener("pointercancel", stopDragging, { once: true });
    return () => {
      window.removeEventListener("pointermove", moveFurniture);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [dragging]);

  useEffect(() => () => {
    window.clearTimeout(walkingTimer.current);
    window.clearTimeout(headShakeTimer.current);
  }, []);

  const checkedToday = Boolean(today && game.lastCheckin === today);
  const basePet = pets.find((item) => item.id === game.pet) ?? pets[0];
  const pet = { ...basePet, name: game.petNames[basePet.id] };
  const nextStreak = game.streak + (checkedToday ? 0 : 1);
  const streakBonus = milestones.find((item) => item.day === nextStreak)?.bonus ?? 0;
  const checkinReward = 8 + streakBonus;
  const estimatedCalories = estimateCalories(activityText, durationMinutes);
  const nextMilestone = milestones.find((item) => item.day > game.streak);
  const ownedFurniture = furnitureItems.filter((item) => game.purchased.includes(item.id));
  const totalFood = foodItems.reduce((total, item) => total + game.inventory[item.id], 0);
  const selectedFoodItem = foodItems.find((item) => item.id === selectedFood) ?? foodItems[0];
  const historyPageCount = Math.max(1, Math.ceil(history.length / 2));
  const historyPageRecords = history.slice(historyPage * 2, historyPage * 2 + 2);
  const statusFrames = statusTransition ?? CAT_STATUS_ANIMATIONS[catStatus].frames;
  const currentStatusFrame: CatAnimationFrame = statusIdle
    ? { pose: catStatus === "low-high" ? "sleep" : "idle", duration: STATUS_IDLE_MS }
    : statusFrames[statusFrame] ?? statusFrames[0];
  const poseFrame = currentStatusFrame.frame ?? 0;
  const statusAsset = currentStatusFrame.pose === "walk"
    ? pet.walkFrames[poseFrame]
    : currentStatusFrame.pose === "groom"
      ? pet.groomFrames[poseFrame]
      : currentStatusFrame.pose === "yawn"
        ? pet.wakeYawnFrames[poseFrame]
        : currentStatusFrame.pose === "sleep"
          ? pet.sleep
          : currentStatusFrame.pose === "wake"
            ? pet.wake
            : pet.idle;
  const wakeSequenceAssets = [pet.sleep, pet.wake, ...WAKE_YAWN_SEQUENCE.map((frame) => pet.wakeYawnFrames[frame]), pet.idle];
  const activePose: CatPose = resting ? "sleep" : wakingUp ? "wake" : walking ? "walk" : currentStatusFrame.pose;
  const catAsset = resting ? pet.sleep : wakingUp ? wakeSequenceAssets[wakeFrame] : walking ? pet.walkFrames[walkFrame] : statusAsset;
  const motionX = walking || resting || wakingUp ? 0 : (currentStatusFrame.x ?? 0) * (direction === "left" ? -1 : 1);
  const motionY = walking || resting || wakingUp ? 0 : currentStatusFrame.y ?? 0;

  function openOverlay(id: Exclude<OverlayId, null>) {
    setDecorating(false);
    if (id === "bag") {
      const firstOwned = foodItems.find((item) => game.inventory[item.id] > 0);
      if (firstOwned) setSelectedFood(firstOwned.id);
    }
    setOverlay(id);
  }

  function resetStatusAnimation() {
    setCatStatus(desiredCatStatus);
    setStatusFrame(0);
    setStatusIdle(true);
    setStatusTransition(null);
    setStatusTransitionTarget(null);
  }

  function finishWalkAfter(duration: number, onFinished?: () => void) {
    window.clearTimeout(walkingTimer.current);
    walkingTimer.current = window.setTimeout(() => {
      setWalking(false);
      setJumping(false);
      onFinished?.();
    }, duration + 60);
  }

  async function saveMood(id: number, mood: string) {
    if (!deviceId) return;
    if (navigator.userAgent.includes("BerryWorkoutDesktop")) {
      const updated = history.map((record) => record.id === id ? { ...record, mood } : record);
      window.localStorage.setItem("berry-workout-history", JSON.stringify(updated));
      setHistory(updated);
      try {
        const record = updated.find((item) => item.id === id);
        if (desktopBackupAccepted && record) {
          const synced = await syncDesktopRecord(deviceId, record);
          const backedUp = updated.map((item) => item.id === id ? synced : item);
          window.localStorage.setItem("berry-workout-history", JSON.stringify(backedUp));
          setHistory(backedUp);
        }
        setToast(desktopBackupAccepted ? "心情已经写进手账并备份" : "心情已经写进本机手账");
      } catch {
        setToast("心情已保存在本机，云备份会稍后重试");
      }
      return;
    }
    try {
      const response = await fetch("/api/checkins", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ deviceId, id, mood }),
      });
      if (!response.ok) throw new Error();
      setToast("心情已经写进手账");
    } catch {
      setToast("心情暂时无法保存");
    }
  }

  function requestSleepInterrupt() {
    if (!resting || wakingUp || interruptConfirm || Date.now() < sleepInterruptReadyAt.current) return;
    setInterruptConfirm(true);
  }

  function continueSleeping() {
    setInterruptConfirm(false);
    sleepInterruptReadyAt.current = Date.now() + 1200;
  }

  function interruptSleep() {
    setInterruptConfirm(false);
    setResting(false);
    setSleepRemainingMs(0);
    resetStatusAnimation();
    setWakeFrame(0);
    setWakingUp(true);
    setGame((current) => ({ ...current, statsUpdatedAt: Date.now(), sleepEndsAt: null, sleepRest: 0 }));
    setToast("睡眠已打断，本次不会降低困倦值");
  }

  function refuseMovement(allowNoEnergy = false) {
    if (wakingUp) {
      setToast("正在打哈欠起床，请稍等一下");
      return true;
    }
    if (resting) {
      setToast(`${pet.name}正在睡觉，还剩 ${formatSleepRemaining(sleepRemainingMs)}`);
      return true;
    }
    if (allowNoEnergy || canPetMove(game.energy)) return false;
    setWalking(false);
    resetStatusAnimation();
    setHeadShaking(true);
    window.clearTimeout(headShakeTimer.current);
    headShakeTimer.current = window.setTimeout(() => setHeadShaking(false), 650);
    setToast(`${pet.name}没有活力了，先喂点食物吧`);
    return true;
  }

  function moveCat(event: React.PointerEvent<HTMLDivElement>) {
    if (decorating || overlay || (event.target as HTMLElement).closest("[data-furniture]")) return;
    if (refuseMovement()) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const { x, y } = clampCatPosition({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
    const distance = Math.hypot(x - game.catPosition.x, y - game.catPosition.y);
    const duration = Math.round(clamp(distance * 14, WALK_CYCLE_MS * 2, 900));
    setDirection(x < game.catPosition.x ? "left" : "right");
    setWalkDuration(duration);
    setGame((current) => ({ ...current, catPosition: { x, y }, catFurniture: null }));
    resetStatusAnimation();
    setResting(false);
    setJumping(false);
    setWalking(true);
    finishWalkAfter(duration);
    event.currentTarget.focus();
  }

  function moveCatToFurniture(item: (typeof furnitureItems)[number], position: Point) {
    if (refuseMovement(Boolean(item.rest))) return;
    const target = getFurnitureTarget(position, item.standHeight);
    const distance = Math.hypot(target.x - game.catPosition.x, target.y - game.catPosition.y);
    const duration = Math.round(clamp(distance * 14, WALK_CYCLE_MS * 2, 900));
    setDirection(target.x < game.catPosition.x ? "left" : "right");
    setWalkDuration(duration);
    resetStatusAnimation();
    setResting(false);
    setJumping(target.jumping);
    setWalking(true);
    setGame((current) => ({
      ...current,
      catPosition: { x: target.x, y: target.y },
      catFurniture: target.onTop ? item.id : null,
    }));
    finishWalkAfter(duration, () => {
      if (item.rest) {
        const sleepEndsAt = Date.now() + SLEEP_DURATION_MS;
        setResting(true);
        setSleepRemainingMs(SLEEP_DURATION_MS);
        sleepInterruptReadyAt.current = Date.now() + 900;
        setGame((current) => ({ ...current, statsUpdatedAt: Date.now(), sleepEndsAt, sleepRest: item.rest }));
        setToast(`${pet.name}开始在${item.name}睡觉，3小时后困倦值降低 ${item.rest}`);
      }
    });
  }

  async function checkIn(event: React.FormEvent) {
    event.preventDefault();
    const completedActivity = activityText.trim();
    if (!ready || checkedToday || !completedActivity || !deviceId || savingCheckin || (desktopApp && !desktopBackupAccepted)) return;
    const next = game.streak + 1;
    const bonus = milestones.find((item) => item.day === next)?.bonus ?? 0;
    const reward = 8 + bonus;
    let backupPending = false;
    setSavingCheckin(true);
    try {
      let record: CheckinRecord;
      if (navigator.userAgent.includes("BerryWorkoutDesktop")) {
        record = { id: Date.now(), date: today, activity: completedActivity, minutes: durationMinutes, calories: estimatedCalories, mood: null };
        const records = [record, ...history.filter((item) => item.date !== record.date)];
        window.localStorage.setItem("berry-workout-history", JSON.stringify(records));
        try {
          record = await syncDesktopRecord(deviceId, record);
          window.localStorage.setItem("berry-workout-history", JSON.stringify([record, ...records.filter((item) => item.date !== record.date)]));
        } catch {
          backupPending = true;
        }
      } else {
        const response = await fetch("/api/checkins", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ deviceId, date: today, activity: completedActivity, minutes: durationMinutes }),
        });
        if (!response.ok) throw new Error();
        record = (await response.json() as { record: CheckinRecord }).record;
      }
      setHistory((records) => [record, ...records.filter((item) => item.date !== record.date)]);
      setGame((current) => ({
        ...current,
        berries: current.berries + reward,
        streak: next,
        lastCheckin: today,
        lastActivity: completedActivity,
        energy: Math.min(100, current.energy + 8),
        sleepiness: Math.max(0, current.sleepiness - 8),
      }));
      setToast(backupPending ? "记录已保存在本机，云备份会稍后重试" : bonus ? `连续 ${next} 天！获得 ${reward} 颗草莓` : `记录成功！获得 ${reward} 颗草莓`);
    } catch {
      setToast("记录保存失败，请稍后再试");
    } finally {
      setSavingCheckin(false);
    }
  }

  function buyFood(item: (typeof foodItems)[number]) {
    if (game.berries < item.price) {
      setToast("草莓不够，再完成几次运动吧！");
      return;
    }
    setGame((current) => ({
      ...current,
      berries: current.berries - item.price,
      inventory: { ...current.inventory, [item.id]: current.inventory[item.id] + 1 },
    }));
    setToast(`${item.name} 已放进背包`);
  }

  function buyFurniture(item: (typeof furnitureItems)[number]) {
    if (game.purchased.includes(item.id)) return;
    if (game.berries < item.price) {
      setToast("草莓不够，再完成几次运动吧！");
      return;
    }
    setGame((current) => ({
      ...current,
      berries: current.berries - item.price,
      purchased: [...current.purchased, item.id],
      furniturePositions: { ...current.furniturePositions, [item.id]: DEFAULT_FURNITURE_POSITIONS[item.id] },
    }));
    setToast(`${item.name} 已送到小屋`);
  }

  function feedPet(foodId: FoodId) {
    const item = foodItems.find((food) => food.id === foodId)!;
    if (!game.inventory[foodId]) {
      setToast("背包里没有这种食物了");
      return;
    }
    if (game.energy >= 100) {
      setToast(`${pet.name} 现在精神满满！`);
      return;
    }
    setGame((current) => ({
      ...current,
      inventory: { ...current.inventory, [foodId]: current.inventory[foodId] - 1 },
      energy: Math.min(100, current.energy + item.energy),
    }));
    if (resting) {
      setOverlay(null);
      setInterruptConfirm(true);
    }
    setToast(`${pet.name} 吃掉了${item.name}，活力 +${item.energy}`);
  }

  async function enableDesktopBackup() {
    window.localStorage.setItem("berry-workout-backup-consent", "accepted");
    setDesktopBackupAccepted(true);
    try {
      const synced = await Promise.all(history.map((record) => syncDesktopRecord(deviceId, record)));
      window.localStorage.setItem("berry-workout-history", JSON.stringify(synced));
      setHistory(synced);
      setToast("云备份已开启，原有记录也已备份");
    } catch {
      setToast("云备份已开启，记录会在联网后自动重试");
    }
  }

  function adoptPet(id: PetId) {
    const chosen = pets.find((item) => item.id === id)!;
    setGame((current) => ({ ...current, pet: id }));
    setToast(`${chosen.name} 已经住进你的小屋啦！`);
  }

  function resetFurniture() {
    setGame((current) => ({ ...current, furniturePositions: { ...DEFAULT_FURNITURE_POSITIONS } }));
    setToast("家具已经恢复到推荐位置");
  }

  return (
    <main className="game-page">
      {desktopUpdate && (
        <aside className="update-notice" role="status">
          {desktopUpdate.phase !== "downloading" && <button className="update-close" onClick={() => setDesktopUpdate(null)} aria-label="关闭更新提示">×</button>}
          <small>GAME UPDATE</small>
          <b>{desktopUpdate.name ?? (desktopUpdate.phase === "error" ? "更新失败" : "正在下载新版")}</b>
          <p>{desktopUpdate.phase === "downloading" ? `下载进度 ${Math.round(desktopUpdate.percent ?? 0)}%` : desktopUpdate.message ?? desktopUpdate.notes}</p>
          {desktopUpdate.phase === "available" && <button onClick={() => window.gameUpdater?.download()}>在游戏内下载</button>}
          {desktopUpdate.phase === "downloaded" && <button onClick={() => window.gameUpdater?.install()}>安装并重启游戏</button>}
        </aside>
      )}
      <section className="game-stage" aria-label="莓好运动岛全屏游戏">
        <div
          className={`game-room ${decorating ? "decorating" : ""}`}
          data-period={timePeriod}
          data-weather={weather.kind}
          ref={roomRef}
          tabIndex={0}
          onPointerDown={moveCat}
          onPointerMove={requestSleepInterrupt}
          aria-label="全屏像素小屋。点击地面或使用方向键移动猫咪。"
        >
          <img className="room-background" src={getRoomAsset(weather.kind, timePeriod)} alt={`像素风猫咪小屋的${weather.label}场景`} draggable={false} />
          <div className="room-vignette" />
          {ownedFurniture.map((item) => {
            const position = game.furniturePositions[item.id] ?? DEFAULT_FURNITURE_POSITIONS[item.id];
            return (
              <button
                key={item.id}
                type="button"
                data-furniture={item.id}
                className={`placed-furniture furniture-${item.id} ${dragging === item.id ? "dragging" : ""}`}
                style={{ left: `${position.x}%`, top: `${position.y}%`, zIndex: Math.round(position.y) }}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (decorating) setDragging(item.id);
                  else moveCatToFurniture(item, position);
                }}
                aria-label={`${item.name}${decorating ? "，拖动可调整位置" : item.rest ? "，睡觉3小时" : item.standHeight === null ? "，走到旁边" : item.standHeight ? "，跳上去" : "，走上去"}`}
              >
                <img src={item.asset} alt="" draggable={false} />
                {decorating && <span>拖动</span>}
              </button>
            );
          })}

          <div
            className={`walking-cat ${walking ? "walking" : "status-animation"} ${jumping ? "jumping" : ""} ${resting ? "resting" : ""} ${wakingUp ? "waking-up" : ""} ${headShaking ? "head-shaking" : ""} ${direction === "left" ? "facing-left" : ""}`}
            data-cat-status={desiredCatStatus}
            data-active-status={catStatus}
            style={{ left: `${game.catPosition.x}%`, top: `${game.catPosition.y}%`, zIndex: game.catFurniture ? Math.round((game.furniturePositions[game.catFurniture] ?? DEFAULT_FURNITURE_POSITIONS[game.catFurniture]).y) + 2 : Math.round(game.catPosition.y) + 2, transitionDuration: `${walkDuration}ms` }}
          >
            <img className={`cat-base cat-pose-${activePose}`} src={catAsset} alt={`${pet.name}正在小屋里`} decoding="sync" draggable={false} style={{ transform: `scaleX(${direction === "left" ? -1 : 1})`, translate: `${motionX}px ${motionY}px` }} />
            <b>{headShaking ? "太困啦…" : wakingUp ? "起床中…" : resting ? `还剩 ${formatSleepRemaining(sleepRemainingMs)}` : pet.name}</b>
          </div>

        </div>

        {interruptConfirm && (
          <div className="sleep-interrupt-layer">
            <section className="sleep-interrupt-dialog" role="dialog" aria-modal="true" aria-label="睡眠打断确认">
              <span>💤</span>
              <h2>是否要打断睡眠？</h2>
              <p>现在叫醒猫咪，本次睡眠不会降低困倦值。</p>
              <div>
                <button type="button" onClick={continueSleeping}>继续睡觉</button>
                <button type="button" className="interrupt-button" onClick={interruptSleep}>打断睡眠</button>
              </div>
            </section>
          </div>
        )}

        <header className="game-hud">
          <button className="game-logo" onClick={() => setOverlay(null)} aria-label="关闭窗口回到小屋">
            <span>🍓</span><b>莓好运动岛</b>
          </button>
          <div className="hud-counters">
            <div><span>🔥</span><small>连续</small><b>{game.streak} 天</b></div>
            <div><span>🍓</span><small>草莓</small><b>{game.berries}</b></div>
          </div>
        </header>

        <aside className="pet-status">
          <img src={pet.idle} alt="" />
          <div className="pet-meters">
            <div><small><span>{pet.name}的活力</span><b>{game.energy}</b></small><div className="energy"><i style={{ width: `${game.energy}%` }} /></div></div>
            <div><small><span>{pet.name}的困倦值</span><b>{game.sleepiness}</b></small><div className="sleepiness"><i style={{ width: `${game.sleepiness}%` }} /></div></div>
          </div>
          <button onClick={() => openOverlay("bag")}>喂食</button>
        </aside>

        {decorating && (
          <div className="decorate-tools">
            <b>布置模式</b>
            <button onClick={resetFurniture}>恢复布局</button>
            <button onClick={() => setDecorating(false)}>完成</button>
          </div>
        )}

        <nav className="game-dock" aria-label="游戏菜单">
          <button className={overlay === "quest" || overlay === "history" ? "active" : ""} onClick={() => openOverlay("quest")}><span>📋</span><b>任务</b></button>
          <button className={overlay === "bag" ? "active" : ""} onClick={() => openOverlay("bag")}><span>🎒</span><b>背包</b><i>{totalFood}</i></button>
          <button className={overlay === "shop" ? "active" : ""} onClick={() => openOverlay("shop")}><span>🛒</span><b>商店</b></button>
          <button className={overlay === "pets" ? "active" : ""} onClick={() => openOverlay("pets")}><span>🐾</span><b>伙伴</b></button>
          <button className={decorating ? "active" : ""} onClick={() => { setOverlay(null); setDecorating((value) => !value); setJumping(false); resetStatusAnimation(); }}><span>🪑</span><b>布置</b></button>
        </nav>

        {overlay && (
          <div className="window-layer" onPointerDown={() => setOverlay(null)}>
            <section className={`game-window ${overlay}-window`} onPointerDown={(event) => event.stopPropagation()}>
              <button className="window-close" onClick={() => setOverlay(null)} aria-label="关闭窗口">×</button>

              {overlay === "quest" && (
                <>
                  <div className="window-heading"><small>TODAY&apos;S QUEST</small><h1>今日运动任务</h1><p>{dateLabel || "今天"}</p></div>
                  <form className="activity-entry" onSubmit={checkIn}>
                    <label htmlFor="today-activity">今天做了什么运动？</label>
                    <div>
                      <textarea id="today-activity" value={activityText} onChange={(event) => setActivityText(event.target.value)} placeholder="例如：跳绳、爬楼梯、打篮球……" maxLength={40} rows={3} disabled={checkedToday} />
                      <small>{activityText.trim().length}/40</small>
                    </div>
                    <label className="duration-field">运动时长 <span><input type="number" min="1" max="600" value={durationMinutes} onChange={(event) => setDurationMinutes(Math.min(600, Math.max(1, Number(event.target.value) || 1)))} disabled={checkedToday} /> 分钟</span></label>
                    <div className="calorie-estimate"><span>✨ 智能估算消耗</span><b>{estimatedCalories || "—"} 千卡</b><small>按运动项目、时长和 50–55 kg 参考区间估算，仅供参考</small></div>
                    {checkedToday && game.lastActivity && <p>✓ 今天完成：{game.lastActivity}</p>}
                    <div className="reward-line"><span>{checkedToday ? "今天已收获" : "记录即可获得"}</span><b>🍓 +{checkinReward}</b></div>
                    {desktopApp && <div className="backup-consent"><p>桌面版会把运动记录和心情备份给屋主。你只能看到自己的记录，屋主可以查看所有下载者的备份。</p>{desktopBackupAccepted ? <b>✓ 已知情并开启云备份</b> : <button type="button" onClick={enableDesktopBackup}>我知道并同意开启</button>}</div>}
                    <button className="primary-button" type="submit" disabled={!ready || checkedToday || !activityText.trim() || savingCheckin || (desktopApp && !desktopBackupAccepted)}>{checkedToday ? "✓ 今天已完成" : savingCheckin ? "正在保存……" : "记录运动，领取草莓"}</button>
                  </form>
                  <div className="streak-card">
                    <div><span><small>连续记录</small><b>{game.streak} 天</b></span><em>下一份奖励</em></div>
                    <div className="week-track">{[1, 2, 3, 4, 5, 6, 7].map((day) => <i key={day} className={day <= Math.min(game.streak, 7) ? "done" : ""}>{day <= Math.min(game.streak, 7) ? "✓" : day}</i>)}</div>
                    <p>{nextMilestone ? <>再坚持 <b>{nextMilestone.day - game.streak} 天</b>，奖励 🍓 {nextMilestone.bonus}</> : "30 天里程碑已达成！"}</p>
                  </div>
                  <button className="history-link" type="button" onClick={() => { setHistoryPage(0); setOverlay("history"); }}>
                    <span>CHECK-IN HISTORY</span><b>{history.length} 次　→</b>
                  </button>
                </>
              )}

              {overlay === "history" && (
                <>
                  <div className="notebook-heading">
                    <button type="button" onClick={() => setOverlay("quest")}>← 返回今日任务</button>
                    <small>CHECK-IN HISTORY</small><h1>运动手账</h1><p>每一页收藏两天的运动和心情</p>
                  </div>
                  {history.length ? (
                    <>
                      <section className="notebook-page" aria-label={`运动手账第 ${historyPage + 1} 页`}>
                        {[0, 1].map((slot) => {
                          const record = historyPageRecords[slot];
                          return record ? (
                            <article className="notebook-entry" key={record.id}>
                              <time dateTime={record.date}>{record.date.replaceAll("-", ".")}</time>
                              <div className="notebook-stats">
                                <span><small>运动</small><b>{record.activity}</b></span>
                                <span><small>时长</small><b>{record.minutes ? `${record.minutes} 分钟` : "未记录"}</b></span>
                                <span><small>卡路里</small><b>{record.calories == null ? "—" : `${record.calories} kcal`}</b></span>
                              </div>
                              <label>今日心情
                                <textarea
                                  value={record.mood ?? ""}
                                  onChange={(event) => setHistory((records) => records.map((item) => item.id === record.id ? { ...item, mood: event.target.value } : item))}
                                  onBlur={(event) => saveMood(record.id, event.currentTarget.value)}
                                  placeholder="写下运动后的心情……"
                                  maxLength={200}
                                  rows={6}
                                />
                              </label>
                            </article>
                          ) : <div className="notebook-blank" key={slot}>下一次运动会写在这里</div>;
                        })}
                      </section>
                      <nav className="notebook-pagination" aria-label="手账翻页">
                        <button type="button" onClick={() => setHistoryPage((page) => Math.max(0, page - 1))} disabled={historyPage === 0}>← 上一页</button>
                        <span>第 {historyPage + 1} / {historyPageCount} 页</span>
                        <button type="button" onClick={() => setHistoryPage((page) => Math.min(historyPageCount - 1, page + 1))} disabled={historyPage === historyPageCount - 1}>下一页 →</button>
                      </nav>
                    </>
                  ) : <div className="notebook-empty">完成第一次运动打卡后，手账会从这里开始。</div>}
                </>
              )}

              {overlay === "bag" && (
                <>
                  <div className="window-heading"><small>MY BACKPACK</small><h1>我的背包</h1><p>选择一种食物喂给 {pet.name}</p></div>
                  <div className="backpack-layout">
                    <div className="inventory-grid">
                      {foodItems.map((item) => (
                        <button key={item.id} className={`${selectedFood === item.id ? "selected" : ""} ${game.inventory[item.id] ? "" : "empty"}`} onClick={() => setSelectedFood(item.id)}>
                          <img src={item.asset} alt="" /><b>{item.name}</b><span>×{game.inventory[item.id]}</span>
                        </button>
                      ))}
                    </div>
                    <div className="feed-card">
                      <img src={selectedFoodItem.asset} alt={selectedFoodItem.name} />
                      <small>已选择</small><h2>{selectedFoodItem.name}</h2><p>{selectedFoodItem.detail} · 活力 +{selectedFoodItem.energy}</p>
                      <button className="primary-button" onClick={() => feedPet(selectedFoodItem.id)} disabled={!game.inventory[selectedFoodItem.id] || game.energy >= 100}>
                        {game.energy >= 100 ? "活力已经满啦" : game.inventory[selectedFoodItem.id] ? `喂给 ${pet.name}` : "背包里没有了"}
                      </button>
                      {!totalFood && <button className="text-button" onClick={() => { setShopCategory("food"); setOverlay("shop"); }}>去商店买食物 →</button>}
                    </div>
                  </div>
                  <div className="bag-furniture"><b>家具收藏 {ownedFurniture.length}/{furnitureItems.length}</b><div>{ownedFurniture.map((item) => <img key={item.id} src={item.asset} alt={item.name} />)}</div></div>
                </>
              )}

              {overlay === "shop" && (
                <>
                  <div className="window-heading with-wallet"><span><small>BERRY MINI MALL</small><h1>莓果小商店</h1><p>食物放进背包，家具送进小屋</p></span><b>🍓 {game.berries}</b></div>
                  <div className="shop-tabs">
                    <button className={shopCategory === "food" ? "active" : ""} onClick={() => setShopCategory("food")}>猫咪食物</button>
                    <button className={shopCategory === "furniture" ? "active" : ""} onClick={() => setShopCategory("furniture")}>小屋家具</button>
                  </div>
                  <div className="store-grid">
                    {shopCategory === "food" ? foodItems.map((item) => (
                      <article key={item.id}>
                        <div className="store-art"><img src={item.asset} alt="" /><i>背包 ×{game.inventory[item.id]}</i></div>
                        <div><small>补充活力 +{item.energy}</small><h2>{item.name}</h2><p>{item.detail}</p></div>
                        <button onClick={() => buyFood(item)}>🍓 {item.price}</button>
                      </article>
                    )) : furnitureItems.map((item) => {
                      const owned = game.purchased.includes(item.id);
                      return (
                        <article key={item.id} className={`${owned ? "owned" : ""} furniture-card-${item.id}`}>
                          <div className="store-art"><img src={item.asset} alt="" /></div>
                          <div><small>{item.rest ? `睡眠3小时 · 困倦值 -${item.rest}` : "可自由拖动"}</small><h2>{item.name}</h2><p>{item.detail}</p></div>
                          <button onClick={() => buyFurniture(item)} disabled={owned}>{owned ? "✓ 已拥有" : `🍓 ${item.price}`}</button>
                        </article>
                      );
                    })}
                  </div>
                </>
              )}

              {overlay === "pets" && (
                <>
                  <div className="window-heading"><small>PAW PAW FRIENDS</small><h1>选择猫咪伙伴</h1><p>每位伙伴都有完整的走路、舔毛和打哈欠动画</p></div>
                  <div className="pet-grid">
                    {pets.map((item) => (
                      <article key={item.id} className={game.pet === item.id ? "chosen" : ""}>
                        <div><span>{item.kind}</span><img src={item.idle} alt={`${game.petNames[item.id]}，${item.kind}`} /></div>
                        <small>{item.nature}</small><h2>{game.petNames[item.id]}</h2>
                        <label className="pet-name-field">名字<input value={game.petNames[item.id]} maxLength={12} onChange={(event) => setGame((current) => ({ ...current, petNames: { ...current.petNames, [item.id]: event.target.value } }))} onBlur={() => setGame((current) => ({ ...current, petNames: { ...current.petNames, [item.id]: current.petNames[item.id].trim() || INITIAL_GAME.petNames[item.id] } }))} /></label>
                        <button onClick={() => adoptPet(item.id)} disabled={game.pet === item.id}>{game.pet === item.id ? "✓ 正在陪伴你" : "带它回家"}</button>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </section>
      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">{toast}</div>
    </main>
  );
}
