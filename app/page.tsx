"use client";

import { useEffect, useRef, useState } from "react";
import { getFurnitureTarget, type Point } from "./game/furniture";
import { getTimePeriod, type TimePeriod } from "./game/time-period";
import { getSceneAsset, getWeatherKind, type WeatherKind } from "./game/weather";
import { cropItems, EMPTY_FARM, formatCookingTime, formatGrowTime, getCookingProgress, getCropProgress, getCropStage, INITIAL_PRODUCE, INITIAL_SEEDS, waterUnwateredPlots, type CropId, type CropPlotState, type ProduceInventory, type SeedInventory } from "./game/farm";
import { clampToScene, getWalkPath, YARD_OBSTACLES, type Rect, type SceneId } from "./game/scene";
import {
  CAT_STATUS_ANIMATIONS,
  getCatStatus,
  getCatStatusTransition,
  type CatAnimationFrame,
  type CatPose,
  type CatStatusId,
} from "./game/cat-actions";
import { canPetMove, decayPetStatsByTime, formatSleepRemaining, getSleepRemainingMs, PET_STAT_DECAY_MS, SLEEP_DURATION_MS } from "./game/pet-stats";
import { getJournalReward } from "./game/journal-reward";

type PetId = "mitao" | "doubao" | "xueqiu";
type OverlayId = "quest" | "history" | "bag" | "pets" | "shop" | "kitchen" | null;
type ShopCategory = "food" | "furniture";
type JournalCategory = "运动" | "学习" | "工作" | "饮食" | "睡眠" | "其他";
type CheckinRecord = { id: number; date: string; content: string; category: JournalCategory; rating: number | null; reward: number | null; createdAt: string };
type DesktopUpdate = { phase: "available" | "downloading" | "downloaded" | "error"; name?: string; notes?: string; percent?: number; message?: string };
type StoreFoodId = "driedFish" | "chickenCan" | "salmonMousse" | "tunaRice" | "chickenCubes" | "catnipBiscuits";
type CookedFoodId = "strawberryPuree" | "carrotSoup" | "tomatoSoup" | "catnipCookies" | "sunflowerRice" | "pumpkinPuree";
type FoodId = StoreFoodId | CookedFoodId;
type PetStats = { energy: number; sleepiness: number; statsUpdatedAt: number };
type GameState = {
  gameSchemaVersion: 5;
  statModelVersion: 2;
  berries: number;
  streak: number;
  lastCheckin: string | null;
  lastActivity: string | null;
  pet: PetId;
  adoptedPets: PetId[];
  petNames: Record<PetId, string>;
  petStats: Record<PetId, PetStats>;
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
  scene: SceneId;
  farmPlots: CropPlotState[];
  seeds: SeedInventory;
  produce: ProduceInventory;
  cooking: { dishId: CookedFoodId; startedAt: number; endsAt: number } | null;
};

const RELEASE_VERSION = "0.4.1";
const RELEASE_NOTES = [
  { version: "0.4.1", items: ["修复切换状态时猫咪换位和动画被打断的问题", "伙伴页查看状态与喂食目标现在始终对应左下角选中的猫咪"] },
  { version: "0.4.0", items: ["桌面数据新增独立持久化备份，更新后自动恢复旧数据", "修复程序窗口左上角未显示草莓图标", "支持多只猫咪同时入住，并可在左下角切换独立状态", "记录改为每日自评分与智能草莓奖励，单次最高 23 颗"] },
  { version: "0.3.0", items: ["今日运动任务升级为温暖的每日生活日记，支持分类、时长、心情和同日多篇记录", "每日首次记录奖励调整为 20 颗草莓，并修正连续记录的点亮方向", "新增院子种植、厨房烹饪进度和离线计时，丰富家具与猫咪互动", "更新房间、院子与天气场景，优化移动、浇水和收获体验"] },
  { version: "0.2.2", items: ["桌面版生活记录与心情改为仅保存在本机", "更新完成后首次启动会直接弹出累计版本说明"] },
  { version: "0.2.1", items: ["修复手账翻回前一页时尺寸变大的问题", "桌面与安装图标更换为无面部像素草莓", "新增游戏内版本更新说明"] },
];

declare global {
  interface Window {
    gameUpdater?: {
      onStatus: (callback: (status: DesktopUpdate) => void) => () => void;
      download: () => void;
      install: () => void;
      version: () => Promise<string>;
      storage: { load: (key: string) => string | null; save: (key: string, value: string) => void };
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
  strawberrySofa: { x: 44, y: 76 },
  catTree: { x: 16, y: 70 },
  fishFireplace: { x: 88, y: 66 },
  wickerRocker: { x: 63, y: 76 },
  creamVanity: { x: 27, y: 66 },
  grandfatherClock: { x: 92, y: 64 },
  fishScratcher: { x: 74, y: 82 },
  flowerStool: { x: 56, y: 82 },
  teaCart: { x: 37, y: 78 },
  yarnBasket: { x: 84, y: 82 },
};

const storeFoodItems = [
  { id: "driedFish" as StoreFoodId, name: "蝴蝶结小鱼干", detail: "香香脆脆", price: 12, energy: 14, asset: "/game/food-dried-fish.png" },
  { id: "chickenCan" as StoreFoodId, name: "鸡肉肉酱罐头", detail: "软乎乎的肉酱", price: 18, energy: 20, asset: "/game/food-chicken-can.png" },
  { id: "salmonMousse" as StoreFoodId, name: "三文鱼慕斯", detail: "细腻的鱼肉慕斯", price: 24, energy: 26, asset: "/game/food-salmon-mousse.png" },
  { id: "tunaRice" as StoreFoodId, name: "金枪鱼拌饭", detail: "满满的鱼肉碎", price: 28, energy: 30, asset: "/game/food-tuna-rice.png" },
  { id: "chickenCubes" as StoreFoodId, name: "冻干鸡肉粒", detail: "一口一个咔嚓脆", price: 22, energy: 24, asset: "/game/food-chicken-cubes.png" },
  { id: "catnipBiscuits" as StoreFoodId, name: "猫薄荷饼干", detail: "快乐的小爪饼干", price: 16, energy: 17, asset: "/game/food-catnip-biscuits.png" },
];

const cookedDishes = [
  { id: "strawberryPuree" as CookedFoodId, cropId: "strawberry" as CropId, name: "草莓鲜果泥", detail: "新鲜草莓细细打成泥", energy: 18, cookMinutes: 5, asset: "/game/dish-strawberry-puree.png" },
  { id: "carrotSoup" as CookedFoodId, cropId: "carrot" as CropId, name: "胡萝卜浓汤", detail: "暖乎乎的橙色浓汤", energy: 20, cookMinutes: 8, asset: "/game/dish-carrot-soup.png" },
  { id: "tomatoSoup" as CookedFoodId, cropId: "tomato" as CropId, name: "番茄鲜汤", detail: "小番茄煮出的鲜甜汤", energy: 22, cookMinutes: 10, asset: "/game/dish-tomato-soup.png" },
  { id: "catnipCookies" as CookedFoodId, cropId: "catnip" as CropId, name: "猫薄荷鱼饼", detail: "烤成小鱼形的香脆饼", energy: 24, cookMinutes: 12, asset: "/game/dish-catnip-biscuits.png" },
  { id: "sunflowerRice" as CookedFoodId, cropId: "sunflower" as CropId, name: "葵花籽拌饭", detail: "颗粒饱满的营养拌饭", energy: 27, cookMinutes: 15, asset: "/game/dish-sunflower-rice.png" },
  { id: "pumpkinPuree" as CookedFoodId, cropId: "pumpkin" as CropId, name: "金黄南瓜泥", detail: "绵软香甜的南瓜泥", energy: 30, cookMinutes: 20, asset: "/game/dish-pumpkin-puree.png" },
];
const foodItems = [...storeFoodItems, ...cookedDishes];

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
  { id: "strawberrySofa", name: "草莓双人沙发", detail: "和草莓抱枕一起陷进软绵绵里。", price: 105, asset: "/game/furniture-strawberry-sofa.png", standHeight: 7, lounge: true },
  { id: "catTree", name: "原木猫爬架", detail: "沿着原木台阶，一层层看更远。", price: 130, asset: "/game/furniture-cat-tree.png", standHeight: 11, platformHeights: [11, 22] },
  { id: "fishFireplace", name: "小鱼壁炉", detail: "小鱼守着火光，雨夜也暖呼呼。", price: 120, asset: "/game/furniture-fish-fireplace.png", overlay: "/game/furniture-fish-fireplace-overlay.png", standHeight: null },
  { id: "wickerRocker", name: "藤编摇椅", detail: "轻轻摇一摇，把困意晃成好梦。", price: 85, asset: "/game/furniture-wicker-rocker.png", standHeight: 8, lounge: true },
  { id: "creamVanity", name: "奶油梳妆台", detail: "圆镜旁，梳好今天软乎乎的毛。", price: 95, asset: "/game/furniture-cream-vanity.png", standHeight: null },
  { id: "grandfatherClock", name: "复古落地钟", detail: "滴答声慢慢走，屋子也安静下来。", price: 110, asset: "/game/furniture-grandfather-clock.png", overlay: "/game/furniture-grandfather-clock-overlay.png", standHeight: null },
  { id: "fishScratcher", name: "鱼形抓板", detail: "小鱼肚皮正适合磨磨小爪。", price: 55, asset: "/game/furniture-fish-scratcher.png", standHeight: null, action: "scratch" as const },
  { id: "flowerStool", name: "花朵矮凳", detail: "踩上一朵花，歇一会儿再出发。", price: 45, asset: "/game/furniture-flower-stool.png", standHeight: 5 },
  { id: "teaCart", name: "茶点餐车", detail: "蛋糕与热茶，等一个悠闲下午。", price: 88, asset: "/game/furniture-tea-cart.png", standHeight: null },
  { id: "yarnBasket", name: "毛线玩具篮", detail: "彩色毛线滚呀滚，快乐藏在篮子里。", price: 60, asset: "/game/furniture-yarn-basket.png", overlay: "/game/furniture-yarn-basket-overlay.png", standHeight: null, action: "scratch" as const },
];

const pets = [
  {
    id: "mitao" as PetId, name: "蜜桃", kind: "橘子猫", nature: "热情的小太阳",
    walkFrames: [1, 2, 3, 4].map((frame) => `/game/cat-orange-walk-fixed-${frame}.png`), idle: "/game/cat-orange-idle.png", sleep: "/game/cat-orange-sleep.png", wake: "/game/cat-orange-wake.png",
    wakeYawnFrames: [1, 2, 3, 4].map((frame) => `/game/cat-orange-wake-yawn-${frame}.png`),
    groomFrames: [1, 2, 3, 4].map((frame) => `/game/cat-orange-groom-fixed-${frame}.png`),
    scratchFrames: [1, 2, 3, 4].map((frame) => `/game/cat-orange-scratch-${frame}.png`),
  },
  {
    id: "doubao" as PetId, name: "豆包", kind: "奶牛猫", nature: "安静的陪跑员",
    walkFrames: [1, 2, 3, 4].map((frame) => `/game/cat-cow-walk-fixed-${frame}.png`), idle: "/game/cat-cow-idle.png", sleep: "/game/cat-cow-sleep.png", wake: "/game/cat-cow-wake.png",
    wakeYawnFrames: [1, 2, 3, 4].map((frame) => `/game/cat-cow-wake-yawn-${frame}.png`),
    groomFrames: [1, 2, 3, 4].map((frame) => `/game/cat-cow-groom-fixed-${frame}.png`),
    scratchFrames: [1, 2, 3, 4].map((frame) => `/game/cat-cow-scratch-${frame}.png`),
  },
  {
    id: "xueqiu" as PetId, name: "雪球", kind: "白绒猫", nature: "爱撒娇的鼓励师",
    walkFrames: [1, 2, 3, 4].map((frame) => `/game/cat-white-walk-fixed-${frame}.png`), idle: "/game/cat-white-idle.png", sleep: "/game/cat-white-sleep.png", wake: "/game/cat-white-wake.png",
    wakeYawnFrames: [1, 2, 3, 4].map((frame) => `/game/cat-white-wake-yawn-${frame}.png`),
    groomFrames: [1, 2, 3, 4].map((frame) => `/game/cat-white-groom-fixed-${frame}.png`),
    scratchFrames: [1, 2, 3, 4].map((frame) => `/game/cat-white-scratch-${frame}.png`),
  },
];

const INITIAL_INVENTORY: Record<FoodId, number> = {
  driedFish: 2,
  chickenCan: 0,
  salmonMousse: 0,
  tunaRice: 0,
  chickenCubes: 0,
  catnipBiscuits: 0,
  strawberryPuree: 0,
  carrotSoup: 0,
  tomatoSoup: 0,
  catnipCookies: 0,
  sunflowerRice: 0,
  pumpkinPuree: 0,
};

const INITIAL_GAME: GameState = {
  gameSchemaVersion: 5,
  statModelVersion: 2,
  berries: 48,
  streak: 0,
  lastCheckin: null,
  lastActivity: null,
  pet: "mitao",
  adoptedPets: ["mitao"],
  petNames: { mitao: "蜜桃", doubao: "豆包", xueqiu: "雪球" },
  petStats: {
    mitao: { energy: 72, sleepiness: 24, statsUpdatedAt: 0 },
    doubao: { energy: 68, sleepiness: 18, statsUpdatedAt: 0 },
    xueqiu: { energy: 76, sleepiness: 30, statsUpdatedAt: 0 },
  },
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
  scene: "room",
  farmPlots: EMPTY_FARM,
  seeds: INITIAL_SEEDS,
  produce: INITIAL_PRODUCE,
  cooking: null,
};

const milestones = [
  { day: 3, bonus: 6 },
  { day: 7, bonus: 20 },
  { day: 14, bonus: 40 },
  { day: 30, bonus: 100 },
];

const ROOMMATE_POSITIONS: Record<PetId, Point> = {
  mitao: { x: 38, y: 76 }, doubao: { x: 62, y: 73 }, xueqiu: { x: 78, y: 77 },
};

const journalCategories: { name: JournalCategory; icon: string }[] = [
  { name: "运动", icon: "🏃" }, { name: "学习", icon: "📖" }, { name: "工作", icon: "💼" }, { name: "饮食", icon: "🍙" },
  { name: "睡眠", icon: "🌙" }, { name: "其他", icon: "✨" },
];

function readPersisted(key: string) {
  const desktopValue = window.gameUpdater?.storage.load(key);
  if (desktopValue !== undefined && desktopValue !== null) return desktopValue;
  const browserValue = window.localStorage.getItem(key);
  if (browserValue !== null) window.gameUpdater?.storage.save(key, browserValue);
  return browserValue;
}

function writePersisted(key: string, value: string) {
  window.localStorage.setItem(key, value);
  window.gameUpdater?.storage.save(key, value);
}

const PLOT_POSITIONS = [
  { x: 38, y: 45, width: 9.5, height: 8.8 }, { x: 48, y: 45, width: 9.5, height: 8.8 }, { x: 58, y: 45, width: 9.5, height: 8.8 }, { x: 68, y: 45, width: 9.5, height: 8.8 },
  { x: 36, y: 56, width: 10, height: 9.5 }, { x: 46, y: 56, width: 10, height: 9.5 }, { x: 56, y: 56, width: 10, height: 9.5 }, { x: 67, y: 56, width: 10, height: 9.5 },
  { x: 34, y: 70, width: 10.5, height: 10 }, { x: 45, y: 70, width: 10.5, height: 10 }, { x: 56, y: 70, width: 10.5, height: 10 }, { x: 68, y: 70, width: 10.5, height: 10 },
];

const FURNITURE_FOOTPRINTS: Record<string, { halfWidth: number; height: number }> = {
  bookcase: { halfWidth: 5, height: 11 }, table: { halfWidth: 7, height: 6 }, chest: { halfWidth: 5, height: 6 },
  strawberrySofa: { halfWidth: 9, height: 7 }, catTree: { halfWidth: 6, height: 15 }, fishFireplace: { halfWidth: 7, height: 11 },
  wickerRocker: { halfWidth: 6, height: 9 }, creamVanity: { halfWidth: 7, height: 11 }, grandfatherClock: { halfWidth: 4, height: 14 }, teaCart: { halfWidth: 6, height: 8 },
};

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
  const [noteText, setNoteText] = useState("");
  const [category, setCategory] = useState<JournalCategory>("其他");
  const [rating, setRating] = useState(5);
  const [deviceId, setDeviceId] = useState("");
  const [history, setHistory] = useState<CheckinRecord[]>([]);
  const [historyPage, setHistoryPage] = useState(0);
  const [savingCheckin, setSavingCheckin] = useState(false);
  const [game, setGame] = useState<GameState>(INITIAL_GAME);
  const [statusPetId, setStatusPetId] = useState<PetId>("mitao");
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
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [seedStorageOpen, setSeedStorageOpen] = useState(false);
  const [selectedSeed, setSelectedSeed] = useState<CropId | null>(null);
  const [watering, setWatering] = useState(false);
  const [wateringPlot, setWateringPlot] = useState<number | null>(null);
  const [farmNow, setFarmNow] = useState(Date.now());
  const [kitchenNow, setKitchenNow] = useState(Date.now());
  const [sceneTransition, setSceneTransition] = useState(false);
  const [lounging, setLounging] = useState(false);
  const [scratching, setScratching] = useState(false);
  const [scratchFrame, setScratchFrame] = useState(0);
  const [plotEffect, setPlotEffect] = useState<{ index: number; type: "seed" | "water" | "harvest" } | null>(null);
  const roomRef = useRef<HTMLDivElement>(null);
  const walkingTimer = useRef<number | undefined>(undefined);
  const headShakeTimer = useRef<number | undefined>(undefined);
  const sleepInterruptReadyAt = useRef(0);
  const animationImages = useRef<HTMLImageElement[]>([]);
  const scratchTimer = useRef<number | undefined>(undefined);
  const desiredCatStatus = getCatStatus(game.energy, game.sleepiness);

  useEffect(() => {
    const now = new Date();
    const current = localDate(now);
    setToday(current);
    setDateLabel(now.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" }));
    const savedCategory = readPersisted("berry-journal-category") as JournalCategory | null;
    if (journalCategories.some((item) => item.name === savedCategory)) setCategory(savedCategory!);

    const saved = readPersisted("berry-workout-game");
    let savedDeviceId = readPersisted("berry-workout-device");
    if (!savedDeviceId) {
      savedDeviceId = crypto.randomUUID();
      writePersisted("berry-workout-device", savedDeviceId);
    }
    setDeviceId(savedDeviceId);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<GameState> & { food?: number };
        const legacyFood = typeof parsed.food === "number" ? parsed.food : INITIAL_INVENTORY.driedFish;
        const inventory = { ...INITIAL_INVENTORY, ...(parsed.inventory ?? {}) };
        const scene: SceneId = parsed.scene === "yard" ? "yard" : "room";
        if (!parsed.inventory) inventory.driedFish = legacyFood;
        const merged: GameState = {
          ...INITIAL_GAME,
          ...parsed,
          inventory,
          gameSchemaVersion: 5,
          purchased: Array.isArray(parsed.purchased) ? parsed.purchased : [],
          adoptedPets: Array.isArray(parsed.adoptedPets) && parsed.adoptedPets.length ? parsed.adoptedPets : [parsed.pet ?? "mitao"],
          petNames: { ...INITIAL_GAME.petNames, ...(parsed.petNames ?? {}) },
          petStats: { ...INITIAL_GAME.petStats, ...(parsed.petStats ?? {}) },
          catPosition: clampToScene(parsed.catPosition ?? INITIAL_GAME.catPosition, scene, scene === "yard" ? YARD_OBSTACLES : []),
          furniturePositions: { ...DEFAULT_FURNITURE_POSITIONS, ...(parsed.furniturePositions ?? {}) },
          scene,
          farmPlots: Array.from({ length: 12 }, (_, index) => parsed.farmPlots?.[index] ?? null),
          seeds: { ...INITIAL_SEEDS, ...(parsed.seeds ?? {}) },
          produce: { ...INITIAL_PRODUCE, ...(parsed.produce ?? {}) },
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
        merged.petStats[merged.pet] = { energy: merged.energy, sleepiness: merged.sleepiness, statsUpdatedAt: merged.statsUpdatedAt };
        setGame(merged);
        setStatusPetId(merged.pet);
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
        const records = (JSON.parse(readPersisted("berry-workout-history") ?? "[]") as (CheckinRecord & { activity?: string })[]).map((record) => ({
          ...record,
          content: record.content ?? record.activity ?? "",
          category: record.category ?? "其他",
          rating: record.rating ?? null,
          reward: record.reward ?? null,
          createdAt: record.createdAt ?? `${record.date}T00:00:00`,
        }));
        if (!cancelled) setHistory(records);
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
            body: JSON.stringify({ deviceId, date: game.lastCheckin, content: game.lastActivity, category: "其他", rating: null, reward: null }),
          });
          if (migrated.ok) records = [(await migrated.json() as { record: CheckinRecord }).record];
        }
        if (!cancelled) {
          setHistory(records);
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
        if (!cancelled) {
          setWeather({ kind, label: labels[kind] });
          if (kind === "rain" || kind === "thunderstorm") setGame((current) => ({ ...current, farmPlots: waterUnwateredPlots(current.farmPlots) }));
        }
      } catch {
        try {
          const response = await fetch("https://wttr.in/Foshan?format=j1");
          if (!response.ok) throw new Error();
          const data = await response.json() as { current_condition: Array<{ cloudcover: string; precipMM: string; weatherDesc: Array<{ value: string }> }> };
          const current = data.current_condition[0];
          const description = current.weatherDesc[0]?.value.toLowerCase() ?? "";
          const code = description.includes("thunder") ? 95 : description.includes("rain") || description.includes("drizzle") || description.includes("shower") ? 61 : description.includes("cloud") || description.includes("overcast") ? 3 : 0;
          const kind = getWeatherKind(code, Number(current.precipMM), Number(current.cloudcover));
          if (!cancelled) {
            setWeather({ kind, label: labels[kind] });
            if (kind === "rain" || kind === "thunderstorm") setGame((current) => ({ ...current, farmPlots: waterUnwateredPlots(current.farmPlots) }));
          }
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
    if (ready) writePersisted("berry-workout-game", JSON.stringify(game));
  }, [game, ready]);

  useEffect(() => {
    const updateFarm = () => setFarmNow(Date.now());
    const timer = window.setInterval(updateFarm, 60_000);
    window.addEventListener("focus", updateFarm);
    document.addEventListener("visibilitychange", updateFarm);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", updateFarm);
      document.removeEventListener("visibilitychange", updateFarm);
    };
  }, []);

  useEffect(() => {
    if (!game.cooking) return;
    const updateCooking = () => setKitchenNow(Date.now());
    updateCooking();
    const timer = window.setInterval(updateCooking, 1000);
    return () => window.clearInterval(timer);
  }, [game.cooking]);

  useEffect(() => {
    if (!ready || !game.cooking || kitchenNow < game.cooking.endsAt) return;
    const dish = cookedDishes.find((item) => item.id === game.cooking?.dishId);
    if (!dish) return;
    const timer = window.setTimeout(() => {
      setGame((current) => current.cooking?.dishId === dish.id ? {
        ...current,
        cooking: null,
        inventory: { ...current.inventory, [dish.id]: current.inventory[dish.id] + 1 },
      } : current);
      setToast(`${dish.name}做好啦，成品已放进背包`);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [game.cooking, kitchenNow, ready]);

  useEffect(() => {
    const updater = window.gameUpdater;
    if (!updater) return;
    const unsubscribe = updater.onStatus(setDesktopUpdate);
    void updater.version().then((version) => {
      if (version === RELEASE_VERSION && readPersisted("berry-workout-release-notes-seen") !== version) setShowReleaseNotes(true);
    });
    return unsubscribe;
  }, []);

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
    const frames = pets.flatMap((item) => [item.idle, item.sleep, item.wake, ...item.wakeYawnFrames, ...item.walkFrames, ...item.groomFrames, ...item.scratchFrames]);
    animationImages.current = frames.map((src) => {
      const image = new Image();
      image.src = src;
      image.decode().catch(() => undefined);
      return image;
    });
    return () => { animationImages.current = []; };
  }, []);

  useEffect(() => {
    const image = new Image();
    image.src = getSceneAsset(game.scene === "room" ? "yard" : "room", weather.kind, timePeriod);
    image.decode().catch(() => undefined);
  }, [game.scene, timePeriod, weather.kind]);

  useEffect(() => {
    if (!walking) {
      setWalkFrame(0);
      return;
    }
    const timer = window.setInterval(() => setWalkFrame((frame) => (frame + 1) % 4), WALK_FRAME_MS);
    return () => window.clearInterval(timer);
  }, [walking]);

  useEffect(() => {
    if (!scratching) return;
    let frame = 0;
    scratchTimer.current = window.setInterval(() => {
      frame += 1;
      if (frame >= 8) {
        window.clearInterval(scratchTimer.current);
        setScratchFrame(0);
        setScratching(false);
        return;
      }
      setScratchFrame(frame % 4);
    }, 180);
    return () => window.clearInterval(scratchTimer.current);
  }, [scratching]);

  useEffect(() => {
    if (game.scene !== "room" || !game.purchased.includes("yarnBasket") || overlay || decorating || walking || resting || lounging || wakingUp || scratching) return;
    const timer = window.setInterval(() => {
      if (Math.random() >= .2) return;
      const item = furnitureItems.find((furniture) => furniture.id === "yarnBasket")!;
      moveCatToFurniture(item, game.furniturePositions.yarnBasket ?? DEFAULT_FURNITURE_POSITIONS.yarnBasket);
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [decorating, game.catFurniture, game.catPosition.x, game.catPosition.y, game.energy, game.furniturePositions.yarnBasket, game.pet, game.purchased, game.scene, lounging, overlay, resting, scratching, wakingUp, walking]);

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
    if (overlay || walking || decorating || resting || lounging || scratching || wakingUp) return;
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
  }, [catStatus, decorating, desiredCatStatus, lounging, overlay, resting, scratching, statusFrame, statusIdle, statusTransition, statusTransitionTarget, wakingUp, walking]);

  useEffect(() => {
    if (game.scene !== "room" || overlay || decorating || sceneTransition) return;
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
      const obstacles = getSceneObstacles();
      setGame((current) => ({
        ...current,
        catPosition: clampToScene({
          x: current.catPosition.x + move.x,
          y: current.catPosition.y + move.y,
        }, current.scene, obstacles),
        catFurniture: null,
      }));
      resetStatusAnimation();
      setResting(false);
      setLounging(false);
      setScratching(false);
      setJumping(false);
      setWalking(true);
      finishWalkAfter(WALK_CYCLE_MS);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [decorating, game.energy, game.scene, overlay, resting, sceneTransition, sleepRemainingMs, wakingUp]);

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
  const statusPetBase = pets.find((item) => item.id === statusPetId) ?? basePet;
  const statusPet = { ...statusPetBase, name: game.petNames[statusPetBase.id] };
  const statusPetStats = statusPetId === game.pet ? game : game.petStats[statusPetId];
  const nextMilestone = milestones.find((item) => item.day > game.streak);
  const ownedFurniture = furnitureItems.filter((item) => game.purchased.includes(item.id));
  const totalFood = foodItems.reduce((total, item) => total + game.inventory[item.id], 0);
  const totalProduce = cropItems.reduce((total, crop) => total + game.produce[crop.id], 0);
  const selectedFoodItem = foodItems.find((item) => item.id === selectedFood) ?? foodItems[0];
  const historyDates = [...new Set(history.map((record) => record.date))];
  const historyPageCount = Math.max(1, Math.ceil(historyDates.length / 2));
  const historyPageDates = historyDates.slice(historyPage * 2, historyPage * 2 + 2);
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
  const activePose: CatPose = resting || lounging ? "sleep" : wakingUp ? "wake" : walking ? "walk" : currentStatusFrame.pose;
  const catAsset = scratching ? pet.scratchFrames[scratchFrame] : resting || lounging ? pet.sleep : wakingUp ? wakeSequenceAssets[wakeFrame] : walking ? pet.walkFrames[walkFrame] : statusAsset;
  const motionX = walking || resting || lounging || wakingUp || scratching ? 0 : (currentStatusFrame.x ?? 0) * (direction === "left" ? -1 : 1);
  const motionY = walking || resting || lounging || wakingUp || scratching ? 0 : currentStatusFrame.y ?? 0;

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

  function getSceneObstacles(excludeFurniture?: string): Rect[] {
    if (game.scene === "yard") return YARD_OBSTACLES;
    return ownedFurniture.flatMap((item) => {
      if (item.id === excludeFurniture || item.id === game.catFurniture) return [];
      const footprint = FURNITURE_FOOTPRINTS[item.id];
      if (!footprint) return [];
      const position = game.furniturePositions[item.id] ?? DEFAULT_FURNITURE_POSITIONS[item.id];
      return [{ left: position.x - footprint.halfWidth, right: position.x + footprint.halfWidth, top: position.y - footprint.height, bottom: position.y + 2 }];
    });
  }

  function moveCat(event: React.PointerEvent<HTMLDivElement>) {
    if (game.scene !== "room" || decorating || overlay || sceneTransition || (event.target as HTMLElement).closest("[data-interactive], [data-furniture]")) return;
    if (refuseMovement()) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const obstacles = getSceneObstacles();
    const target = clampToScene({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    }, game.scene, obstacles);
    walkCatTo(target);
    event.currentTarget.focus();
  }

  function walkCatTo(target: Point, onFinished?: () => void, shouldJump = false, excludeFurniture?: string) {
    const obstacles = getSceneObstacles(excludeFurniture);
    const path = getWalkPath(game.catPosition, target, game.scene, obstacles);
    let from = game.catPosition;
    resetStatusAnimation();
    setResting(false);
    setLounging(false);
    setScratching(false);
    setJumping(shouldJump);
    setWalking(true);
    const step = (index: number) => {
      const point = path[index];
      const duration = Math.round(clamp(Math.hypot(point.x - from.x, point.y - from.y) * 14, WALK_CYCLE_MS * 2, 900));
      setDirection(point.x < from.x ? "left" : "right");
      setWalkDuration(duration);
      setGame((current) => ({ ...current, catPosition: point, catFurniture: null }));
      from = point;
      window.clearTimeout(walkingTimer.current);
      walkingTimer.current = window.setTimeout(() => {
        if (index + 1 < path.length) step(index + 1);
        else {
          setWalking(false);
          setJumping(false);
          onFinished?.();
        }
      }, duration + 60);
    };
    step(0);
  }

  function moveCatToFurniture(item: (typeof furnitureItems)[number], position: Point, heightOverride?: number) {
    if (refuseMovement(Boolean(item.rest))) return;
    const target = getFurnitureTarget(position, heightOverride ?? item.standHeight);
    walkCatTo(target, () => {
      setGame((current) => ({ ...current, catFurniture: target.onTop ? item.id : null }));
      if (item.rest) {
        const sleepEndsAt = Date.now() + SLEEP_DURATION_MS;
        setResting(true);
        setSleepRemainingMs(SLEEP_DURATION_MS);
        sleepInterruptReadyAt.current = Date.now() + 900;
        setGame((current) => ({ ...current, statsUpdatedAt: Date.now(), sleepEndsAt, sleepRest: item.rest }));
        setToast(`${pet.name}开始在${item.name}睡觉，3小时后困倦值降低 ${item.rest}`);
      } else if ("lounge" in item && item.lounge) {
        setLounging(true);
        setToast(`${pet.name}在${item.name}上安静地休息`);
      } else if ("action" in item && item.action === "scratch") {
        setScratching(true);
        setToast(item.id === "yarnBasket" ? `${pet.name}拨动了彩色毛线球` : `${pet.name}认真磨了磨小爪子`);
      }
    }, target.jumping, item.id);
  }

  async function checkIn(event: React.FormEvent) {
    event.preventDefault();
    const content = noteText.trim();
    if (!ready || !content || !deviceId || savingCheckin) return;
    const next = game.streak + 1;
    const bonus = milestones.find((item) => item.day === next)?.bonus ?? 0;
    const reward = checkedToday ? 0 : Math.min(23, getJournalReward(rating) + bonus);
    setSavingCheckin(true);
    try {
      let record: CheckinRecord;
      if (navigator.userAgent.includes("BerryWorkoutDesktop")) {
        record = { id: Date.now(), date: today, content, category, rating, reward, createdAt: new Date().toISOString() };
        const records = [record, ...history];
        writePersisted("berry-workout-history", JSON.stringify(records));
      } else {
        const response = await fetch("/api/checkins", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ deviceId, date: today, content, category, rating, reward }),
        });
        if (!response.ok) throw new Error();
        record = (await response.json() as { record: CheckinRecord }).record;
      }
      setHistory((records) => [record, ...records]);
      if (!checkedToday) setGame((current) => ({ ...current, berries: current.berries + reward, streak: next, lastCheckin: today, lastActivity: content }));
      setNoteText("");
      writePersisted("berry-journal-category", category);
      setToast("今天的记忆已经收好啦 🍓");
    } catch {
      setToast("记录保存失败，请稍后再试");
    } finally {
      setSavingCheckin(false);
    }
  }

  function buyFood(item: (typeof storeFoodItems)[number]) {
    if (game.berries < item.price) {
      setToast("草莓不够，再写几篇日记吧！");
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
      setToast("草莓不够，再写几篇日记吧！");
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
    if (statusPetStats.energy >= 100) {
      setToast(`${statusPet.name} 现在精神满满！`);
      return;
    }
    setGame((current) => statusPetId === current.pet ? {
      ...current,
      inventory: { ...current.inventory, [foodId]: current.inventory[foodId] - 1 },
      energy: Math.min(100, current.energy + item.energy),
    } : {
      ...current,
      inventory: { ...current.inventory, [foodId]: current.inventory[foodId] - 1 },
      petStats: { ...current.petStats, [statusPetId]: { ...current.petStats[statusPetId], energy: Math.min(100, current.petStats[statusPetId].energy + item.energy), statsUpdatedAt: Date.now() } },
    });
    if (resting && statusPetId === game.pet) {
      setOverlay(null);
      setInterruptConfirm(true);
    }
    setToast(`${statusPet.name} 吃掉了${item.name}，活力 +${item.energy}`);
  }

  function cookDish(dish: (typeof cookedDishes)[number]) {
    if (game.cooking) {
      setToast("灶台正在忙，等这道菜做好吧");
      return;
    }
    if (!game.produce[dish.cropId]) {
      setToast(`背包里没有${cropItems.find((crop) => crop.id === dish.cropId)?.name}了`);
      return;
    }
    const startedAt = Date.now();
    setKitchenNow(startedAt);
    setGame((current) => ({
      ...current,
      produce: { ...current.produce, [dish.cropId]: current.produce[dish.cropId] - 1 },
      cooking: { dishId: dish.id, startedAt, endsAt: startedAt + dish.cookMinutes * 60_000 },
    }));
    setToast(`${dish.name}开始烹饪，${dish.cookMinutes} 分钟后完成`);
  }

  function cyclePet() {
    const index = game.adoptedPets.indexOf(statusPetId);
    setStatusPetId(game.adoptedPets[(index + 1) % game.adoptedPets.length]);
  }

  function adoptPet(id: PetId) {
    const chosen = pets.find((item) => item.id === id)!;
    if (game.adoptedPets.includes(id)) {
      setStatusPetId(id);
      setToast(`已切换查看 ${game.petNames[id]} 的状态`);
      return;
    }
    setGame((current) => ({ ...current, adoptedPets: [...current.adoptedPets, id] }));
    setStatusPetId(id);
    setToast(`${chosen.name} 已经住进你的小屋啦！`);
  }

  function resetFurniture() {
    setGame((current) => ({ ...current, furniturePositions: { ...DEFAULT_FURNITURE_POSITIONS } }));
    setToast("家具已经恢复到推荐位置");
  }

  function changeScene() {
    if (sceneTransition) return;
    if (resting) {
      requestSleepInterrupt();
      return;
    }
    setOverlay(null);
    setDecorating(false);
    setSeedStorageOpen(false);
    setSelectedSeed(null);
    setWatering(false);
    setWateringPlot(null);
    setLounging(false);
    setScratching(false);
    window.clearTimeout(walkingTimer.current);
    setWalking(false);
    setSceneTransition(true);
    window.setTimeout(() => {
      setGame((current) => ({
        ...current,
        scene: current.scene === "room" ? "yard" : "room",
        catPosition: current.scene === "yard" ? { x: 78, y: 61 } : current.catPosition,
        catFurniture: null,
      }));
      window.setTimeout(() => setSceneTransition(false), 80);
    }, 320);
  }

  function buySeed(cropId: CropId) {
    const crop = cropItems.find((item) => item.id === cropId)!;
    if (game.berries < crop.seedPrice) {
      setToast("草莓不够，先完成记录或收获作物吧");
      return;
    }
    setGame((current) => ({
      ...current,
      berries: current.berries - crop.seedPrice,
      seeds: { ...current.seeds, [cropId]: current.seeds[cropId] + 1 },
    }));
    setToast(`买到一包${crop.name}种子`);
  }

  function plantCrop(index: number, cropId: CropId) {
    if (!game.seeds[cropId]) {
      setToast("先买一包种子吧");
      return;
    }
    const now = Date.now();
    const wateredAt = weather.kind === "rain" || weather.kind === "thunderstorm" ? now : null;
    setGame((current) => ({
      ...current,
      seeds: { ...current.seeds, [cropId]: current.seeds[cropId] - 1 },
      farmPlots: current.farmPlots.map((plot, plotIndex) => plotIndex === index ? { cropId, plantedAt: now, wateredAt } : plot),
    }));
    if (game.seeds[cropId] <= 1) setSelectedSeed(null);
    setFarmNow(now);
    setPlotEffect({ index, type: "seed" });
    window.setTimeout(() => setPlotEffect(null), 700);
    setToast(wateredAt ? "种子种下啦，雨水也帮忙浇好了" : "种子种下啦，记得去拿浇水壶");
  }

  function handlePlot(index: number) {
    const plot = game.farmPlots[index];
    if (!plot) {
      if (watering) setToast("这块田还没有播种");
      else if (selectedSeed) plantCrop(index, selectedSeed);
      else setToast("先点击右侧种子仓库选择种子");
      return;
    }
    if (selectedSeed) {
      setToast("这块田已经有作物了，换一块空田吧");
      return;
    }
    if (watering) {
      setWateringPlot(index);
      window.setTimeout(() => setWateringPlot(null), 900);
      if (plot.wateredAt) setToast("这块土已经湿润啦");
      else {
        const now = Date.now();
        setGame((current) => ({ ...current, farmPlots: current.farmPlots.map((item, plotIndex) => plotIndex === index && item ? { ...item, wateredAt: now } : item) }));
        setFarmNow(now);
        setPlotEffect({ index, type: "water" });
        window.setTimeout(() => setPlotEffect(null), 900);
        setToast("浇好水啦，种子开始慢慢长大");
      }
      return;
    }
    if (getCropStage(plot, farmNow) !== "mature") {
      setToast(plot.wateredAt ? "还在慢慢长大，再等等吧" : "还没浇水，种子正在土里等你");
      return;
    }
    const crop = cropItems.find((item) => item.id === plot.cropId)!;
    setGame((current) => ({
      ...current,
      produce: { ...current.produce, [plot.cropId]: current.produce[plot.cropId] + 1 },
      farmPlots: current.farmPlots.map((item, plotIndex) => plotIndex === index ? null : item),
    }));
    setPlotEffect({ index, type: "harvest" });
    window.setTimeout(() => setPlotEffect(null), 700);
    setToast(`收获${crop.name}，成品已放进背包`);
    if (plot.cropId === "catnip" && !resting && !wakingUp) {
      const position = PLOT_POSITIONS[index];
      walkCatTo({ x: position.x - 4, y: position.y + 4 }, () => {
        setStatusIdle(false);
        setToast(`${pet.name}闻到猫薄荷，开心地玩了起来！`);
      });
    }
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
      {showReleaseNotes && (
        <div className="release-modal-layer" role="dialog" aria-modal="true" aria-labelledby="release-title">
          <section className="release-modal">
            <small>UPDATE LOG</small>
            <h1 id="release-title">已更新至 v{RELEASE_VERSION}</h1>
            <p>以下是从首个安装版至今的全部更新内容：</p>
            <div className="release-history">
              {RELEASE_NOTES.map((release) => (
                <section key={release.version}>
                  <b>v{release.version}</b>
                  <ul>{release.items.map((item) => <li key={item}>{item}</li>)}</ul>
                </section>
              ))}
            </div>
            <button onClick={() => { writePersisted("berry-workout-release-notes-seen", RELEASE_VERSION); setShowReleaseNotes(false); }}>知道了</button>
          </section>
        </div>
      )}
      <section className="game-stage" aria-label="OH 像素生活小屋">
        <div
          className={`game-room scene-${game.scene} ${decorating ? "decorating" : ""} ${sceneTransition ? "scene-fading" : ""} ${selectedSeed ? "seed-selected" : ""} ${watering ? "watering-selected" : ""}`}
          data-period={timePeriod}
          data-weather={weather.kind}
          ref={roomRef}
          tabIndex={0}
          onPointerDown={game.scene === "room" ? moveCat : undefined}
          onPointerMove={(event) => {
            requestSleepInterrupt();
            const rect = event.currentTarget.getBoundingClientRect();
            if (selectedSeed) {
              event.currentTarget.style.setProperty("--seed-x", `${event.clientX - rect.left}px`);
              event.currentTarget.style.setProperty("--seed-y", `${event.clientY - rect.top}px`);
            }
            if (watering) {
              event.currentTarget.style.setProperty("--watering-x", `${event.clientX - rect.left}px`);
              event.currentTarget.style.setProperty("--watering-y", `${event.clientY - rect.top}px`);
            }
          }}
          aria-label={game.scene === "room" ? "全屏像素小屋。点击地面或使用方向键移动猫咪。" : "全屏像素院子。点击田地进行种植，或使用导航栏。"}
        >
          <img className="room-background" src={getSceneAsset(game.scene, weather.kind, timePeriod)} alt={`像素风猫咪${game.scene === "room" ? "小屋" : "院子"}的${weather.label}场景`} draggable={false} />
          <div className="room-vignette" />
          <button type="button" data-interactive className={`scene-door scene-door-${game.scene}`} onPointerDown={(event) => { event.stopPropagation(); changeScene(); }} aria-label={game.scene === "room" ? "去院子" : "回到室内"} />
          {game.scene === "room" && <button type="button" data-interactive className="kitchen-hotspot" onPointerDown={(event) => { event.stopPropagation(); openOverlay("kitchen"); }} aria-label="打开左墙厨房烹饪" />}

          {game.scene === "yard" && PLOT_POSITIONS.map((position, index) => {
            const plot = game.farmPlots[index];
            const stage = getCropStage(plot, farmNow);
            const progress = getCropProgress(plot, farmNow);
            return (
              <button key={index} type="button" data-interactive data-plot={index} className={`farm-plot ${stage === "mature" ? "mature" : ""}`} style={{ left: `${position.x}%`, top: `${position.y}%`, width: `${position.width}%`, height: `${position.height}%`, zIndex: Math.round(position.y) }} onPointerDown={(event) => { event.stopPropagation(); handlePlot(index); }} aria-label={plot ? `${cropItems.find((crop) => crop.id === plot.cropId)?.name}，${stage === "mature" ? "点击收获" : plot.wateredAt ? "生长中" : "等待浇水"}` : selectedSeed ? `空田，点击播种${cropItems.find((crop) => crop.id === selectedSeed)?.name}` : "空田，请先从种子仓库选择种子"}>
                {plot && <img className="crop-sprite" src={`/game/crop-${plot.cropId}-${stage}.png`} alt="" />}
                {plot && <span className={`crop-progress ${stage === "mature" ? "complete" : ""}`}><progress max={1} value={progress} /><b>{stage === "mature" ? "已成熟" : plot.wateredAt ? `${Math.round(progress * 100)}%` : "待浇水"}</b></span>}
                {plotEffect?.index === index && <img className="plot-effect" src={`/game/effect-${plotEffect.type}.png`} alt="" />}
              </button>
            );
          })}

          {game.scene === "yard" && <button type="button" data-interactive className="seed-storage" onPointerDown={(event) => { event.stopPropagation(); setSelectedSeed(null); setSeedStorageOpen(true); setWatering(false); setWateringPlot(null); }} aria-label="打开种子仓库"><span>种子仓库</span></button>}
          {game.scene === "yard" && selectedSeed && <img className="seed-cursor" src={`/game/crop-${selectedSeed}-seed.png`} alt="" />}
          {game.scene === "yard" && watering && wateringPlot === null && <img className="watering-cursor" src="/game/watering-can-matched.png" alt="" />}
          {game.scene === "yard" && wateringPlot !== null && <div className="watering-animation" style={{ left: `${PLOT_POSITIONS[wateringPlot].x}%`, top: `${PLOT_POSITIONS[wateringPlot].y}%`, zIndex: Math.round(PLOT_POSITIONS[wateringPlot].y) + 5 }}><img src="/game/watering-can-matched.png" alt="" /><span className="water-spray"><i /><i /><i /><i /><i /></span><span className="water-impact"><i /><i /><i /></span></div>}
          {game.scene === "yard" && <button type="button" data-interactive className={`watering-can ${watering ? "selected" : ""}`} onPointerDown={(event) => { event.stopPropagation(); const rect = roomRef.current?.getBoundingClientRect(); if (rect) { roomRef.current?.style.setProperty("--watering-x", `${event.clientX - rect.left}px`); roomRef.current?.style.setProperty("--watering-y", `${event.clientY - rect.top}px`); } setWatering((value) => !value); setWateringPlot(null); setSeedStorageOpen(false); setSelectedSeed(null); setToast(watering ? "放下浇水壶" : "拿起浇水壶，再点击田地浇水"); }} aria-label={watering ? "放下浇水壶" : "拿起浇水壶"}><span>浇水壶</span></button>}

          {game.scene === "room" && ownedFurniture.map((item) => {
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
                  else {
                    const heights = "platformHeights" in item ? item.platformHeights : undefined;
                    const relativeY = (event.clientY - event.currentTarget.getBoundingClientRect().top) / event.currentTarget.getBoundingClientRect().height;
                    moveCatToFurniture(item, position, heights ? heights[relativeY < .5 ? 1 : 0] : undefined);
                  }
                }}
                aria-label={`${item.name}${decorating ? "，拖动可调整位置" : item.rest ? "，睡觉3小时" : item.standHeight === null ? "，走到旁边" : item.standHeight ? "，跳上去" : "，走上去"}`}
              >
                <img src={item.asset} alt="" draggable={false} />
                {"overlay" in item && item.overlay && <img className="furniture-overlay" src={item.overlay} alt="" draggable={false} />}
                {decorating && <span>拖动</span>}
              </button>
            );
          })}

          {game.scene === "room" && game.adoptedPets.filter((id) => id !== game.pet).map((id) => {
            const roommate = pets.find((item) => item.id === id)!;
            const position = ROOMMATE_POSITIONS[id];
            return <div className="roommate-cat" key={id} style={{ left: `${position.x}%`, top: `${position.y}%`, zIndex: Math.round(position.y) + 1 }}>
              <img src={roommate.idle} alt={`${game.petNames[id]}正在房间里休息`} /><b>{game.petNames[id]}</b>
            </div>;
          })}
          {game.scene === "room" && <div
            className={`walking-cat ${walking ? "walking" : "status-animation"} ${jumping ? "jumping" : ""} ${resting ? "resting" : ""} ${lounging ? "lounging" : ""} ${scratching ? "scratching" : ""} ${wakingUp ? "waking-up" : ""} ${headShaking ? "head-shaking" : ""} ${direction === "left" ? "facing-left" : ""}`}
            data-cat-status={desiredCatStatus}
            data-active-status={catStatus}
            style={{ left: `${game.catPosition.x}%`, top: `${game.catPosition.y}%`, zIndex: game.catFurniture ? Math.round((game.furniturePositions[game.catFurniture] ?? DEFAULT_FURNITURE_POSITIONS[game.catFurniture]).y) + 2 : Math.round(game.catPosition.y) + 2, transitionDuration: `${walkDuration}ms` }}
          >
            <img className={`cat-base cat-pose-${activePose}`} src={catAsset} alt={`${pet.name}正在${game.scene === "room" ? "小屋" : "院子"}里`} decoding="sync" draggable={false} style={{ transform: `scaleX(${direction === "left" ? -1 : 1})`, translate: `${motionX}px ${motionY}px` }} />
            <b>{headShaking ? "太困啦…" : wakingUp ? "起床中…" : resting ? `还剩 ${formatSleepRemaining(sleepRemainingMs)}` : scratching ? "玩耍中…" : lounging ? "休息中…" : pet.name}</b>
          </div>}

        </div>

        {seedStorageOpen && game.scene === "yard" && (
          <div className="seed-layer" onPointerDown={() => setSeedStorageOpen(false)}>
            <section className="seed-panel" role="dialog" aria-modal="true" aria-label="种子仓库" onPointerDown={(event) => event.stopPropagation()}>
              <button className="window-close" onClick={() => setSeedStorageOpen(false)} aria-label="关闭种子仓库">×</button>
              <small>SEED STORAGE</small><h2>种子仓库</h2><p>选择一种种子，再点击想播种的空田。</p>
              <div className="seed-grid">
                {cropItems.map((crop) => (
                  <article key={crop.id}>
                    <img src={`/game/crop-${crop.id}-mature.png`} alt="" />
                    <div><h3>{crop.name}</h3><p>{formatGrowTime(crop.growMs)} · 收获作物 ×1</p><b>种子 ×{game.seeds[crop.id]}</b></div>
                    <button type="button" onClick={() => buySeed(crop.id)}>购买 🍓 {crop.seedPrice}</button>
                    <button type="button" className="plant-button" disabled={!game.seeds[crop.id]} onClick={() => { setSelectedSeed(crop.id); setSeedStorageOpen(false); setWatering(false); setWateringPlot(null); setToast(`已拿起${crop.name}种子，点击空田播种`); }}>播种</button>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

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
          <div className="hud-counters">
            <div><span>🔥</span><small>连续</small><b>{game.streak} 天</b></div>
            <div><span>🍓</span><small>草莓</small><b>{game.berries}</b></div>
          </div>
        </header>

        <aside className="pet-status">
          <img src={statusPet.idle} alt="" />
          <div className="pet-meters">
            <div><small><span>{statusPet.name}的活力</span><b>{statusPetStats.energy}</b></small><div className="energy"><i style={{ width: `${statusPetStats.energy}%` }} /></div></div>
            <div><small><span>{statusPet.name}的困倦值</span><b>{statusPetStats.sleepiness}</b></small><div className="sleepiness"><i style={{ width: `${statusPetStats.sleepiness}%` }} /></div></div>
          </div>
          <div className="pet-status-actions">
            {game.adoptedPets.length > 1 && <button onClick={cyclePet} disabled={resting} title="切换宠物状态">切换</button>}
            <button onClick={() => openOverlay("bag")}>喂食</button>
          </div>
        </aside>

        {decorating && (
          <div className="decorate-tools">
            <b>布置模式</b>
            <button onClick={resetFurniture}>恢复布局</button>
            <button onClick={() => setDecorating(false)}>完成</button>
          </div>
        )}

        <nav className="game-dock" aria-label="游戏菜单">
          <button className={overlay === "quest" || overlay === "history" ? "active" : ""} onClick={() => openOverlay("quest")}><span>📓</span><b>记录</b></button>
          <button className={overlay === "bag" ? "active" : ""} onClick={() => openOverlay("bag")}><span>🎒</span><b>背包</b><i>{totalFood + totalProduce}</i></button>
          <button className={overlay === "shop" ? "active" : ""} onClick={() => openOverlay("shop")}><span>🛒</span><b>商店</b></button>
          <button className={overlay === "pets" ? "active" : ""} onClick={() => openOverlay("pets")}><span>🐾</span><b>伙伴</b></button>
          <button className={decorating ? "active" : ""} disabled={game.scene === "yard"} onClick={() => { setOverlay(null); setDecorating((value) => !value); setJumping(false); resetStatusAnimation(); }}><span>🪑</span><b>{game.scene === "yard" ? "回屋布置" : "布置"}</b></button>
        </nav>

        {overlay && (
          <div className="window-layer" onPointerDown={() => setOverlay(null)}>
            <section className={`game-window ${overlay}-window`} onPointerDown={(event) => event.stopPropagation()}>
              <button className="window-close" onClick={() => setOverlay(null)} aria-label="关闭窗口">×</button>

              {overlay === "quest" && (
                <>
                  <div className="window-heading"><small>TODAY&apos;S NOTE</small><h1>今日记录</h1><p>{dateLabel || "今天"}</p></div>
                  <form className="activity-entry" onSubmit={checkIn}>
                    <label htmlFor="today-note">今天发生了什么？</label>
                    <div>
                      <textarea id="today-note" value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="记录一件今天想留下的事情……" maxLength={300} rows={5} />
                      <small>{noteText.length}/300</small>
                    </div>
                    <fieldset className="journal-options"><legend>记录分类</legend><div className="category-options">{journalCategories.map((item) => <button key={item.name} className={category === item.name ? "selected" : ""} type="button" onClick={() => setCategory(item.name)}><span>{item.icon}</span>{item.name}</button>)}</div></fieldset>
                    <label className="rating-field">今天给自己打几分？<span><input type="range" min="1" max="10" value={rating} onChange={(event) => setRating(Number(event.target.value))} /><b>{rating} 分</b></span></label>
                    <div className="reward-line"><span>{checkedToday ? "今日首条奖励已领取" : "智能换算今日奖励（最高 23）"}</span><b>🍓 +{checkedToday ? 0 : Math.min(23, getJournalReward(rating) + (milestones.find((item) => item.day === game.streak + 1)?.bonus ?? 0))}</b></div>
                    <button className="primary-button" type="submit" disabled={!ready || !noteText.trim() || savingCheckin}>{savingCheckin ? "正在保存……" : "保存今日记录"}</button>
                  </form>
                  <div className="streak-card">
                    <div><span><small>连续记录</small><b>{game.streak} 天</b></span><em>下一份奖励</em></div>
                    <div className="week-track">{[1, 2, 3, 4, 5, 6, 7].map((day) => <i key={day} className={day <= Math.min(game.streak, 7) ? "done" : ""}>{day <= Math.min(game.streak, 7) ? "✓" : day}</i>)}</div>
                    <p>{nextMilestone ? <>再坚持 <b>{nextMilestone.day - game.streak} 天</b>，奖励 🍓 {nextMilestone.bonus}</> : "30 天里程碑已达成！"}</p>
                  </div>
                  <button className="history-link" type="button" onClick={() => { setHistoryPage(0); setOverlay("history"); }}>
                    <span>JOURNAL HISTORY</span><b>{history.length} 篇　→</b>
                  </button>
                </>
              )}

              {overlay === "history" && (
                <>
                  <div className="notebook-heading">
                    <button type="button" onClick={() => setOverlay("quest")}>← 返回今日记录</button>
                    <small>JOURNAL HISTORY</small><h1>往日日记</h1><p>把平凡日子里的小事好好收起来</p>
                  </div>
                  {history.length ? (
                    <>
                      <section className="notebook-page" aria-label={`往日日记第 ${historyPage + 1} 页`}>
                        {historyPageDates.map((date) => <article className="notebook-day" key={date}>
                          <time dateTime={date}>{date.replaceAll("-", ".")}</time>
                          {history.filter((record) => record.date === date).map((record) => {
                            const categoryInfo = journalCategories.find((item) => item.name === record.category) ?? journalCategories.at(-1)!;
                            return <div className="notebook-entry" key={record.id}>
                              <div className="entry-meta"><span>{categoryInfo.icon} {categoryInfo.name}</span><time dateTime={record.createdAt}>{new Date(record.createdAt || `${record.date}T00:00:00`).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</time></div>
                              <p>{record.content}</p>
                              {record.rating && <small>⭐ 今日自评分：{record.rating}/10{record.reward ? `　🍓 +${record.reward}` : ""}</small>}
                            </div>;
                          })}
                        </article>)}
                      </section>
                      <nav className="notebook-pagination" aria-label="手账翻页">
                        <button type="button" onClick={() => setHistoryPage((page) => Math.max(0, page - 1))} disabled={historyPage === 0}>← 上一页</button>
                        <span>第 {historyPage + 1} / {historyPageCount} 页</span>
                        <button type="button" onClick={() => setHistoryPage((page) => Math.min(historyPageCount - 1, page + 1))} disabled={historyPage === historyPageCount - 1}>下一页 →</button>
                      </nav>
                    </>
                  ) : <div className="notebook-empty">保存第一篇今日记录后，日记会从这里开始。</div>}
                </>
              )}

              {overlay === "kitchen" && (
                <>
                  <div className="window-heading"><small>PAW PAW KITCHEN</small><h1>猫爪小厨房</h1><p>每份收获可烹饪一份菜，做好后会放入背包</p></div>
                  <div className="recipe-grid">
                    {cookedDishes.map((dish) => {
                      const crop = cropItems.find((item) => item.id === dish.cropId)!;
                      const count = game.produce[dish.cropId];
                      const cooking = game.cooking?.dishId === dish.id ? game.cooking : null;
                      return (
                        <article key={dish.id}>
                          <img src={dish.asset} alt={dish.name} />
                          <div><small>{crop.name} ×1 · 活力 +{dish.energy} · ⏱ {dish.cookMinutes} 分钟</small><h2>{dish.name}</h2><p>{dish.detail}</p></div>
                          {cooking && <div className="recipe-progress"><i style={{ width: `${getCookingProgress(cooking.startedAt, cooking.endsAt, kitchenNow) * 100}%` }} /><span>烹饪中 · {formatCookingTime(cooking.endsAt, kitchenNow)}</span></div>}
                          <button type="button" onClick={() => cookDish(dish)} disabled={!count || Boolean(game.cooking)}>{cooking ? "正在烹饪……" : count ? `烹饪（原料 ×${count}）` : `缺少${crop.name}`}</button>
                        </article>
                      );
                    })}
                  </div>
                </>
              )}

              {overlay === "bag" && (
                <>
                  <div className="window-heading"><small>MY BACKPACK</small><h1>我的背包</h1><p>收获的作物可以带去厨房烹饪，菜品可以喂给 {statusPet.name}</p></div>
                  <div className="produce-strip">
                    <b>新鲜作物</b>
                    {cropItems.map((crop) => <span key={crop.id} className={game.produce[crop.id] ? "" : "empty"}><img src={`/game/crop-${crop.id}-mature.png`} alt="" /><em>{crop.name}</em><i>×{game.produce[crop.id]}</i></span>)}
                    <button type="button" onClick={() => setOverlay("kitchen")}>去厨房烹饪 →</button>
                  </div>
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
                      <button className="primary-button" onClick={() => feedPet(selectedFoodItem.id)} disabled={!game.inventory[selectedFoodItem.id] || statusPetStats.energy >= 100}>
                        {statusPetStats.energy >= 100 ? "活力已经满啦" : game.inventory[selectedFoodItem.id] ? `喂给 ${statusPet.name}` : "背包里没有了"}
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
                    {shopCategory === "food" ? storeFoodItems.map((item) => (
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
                        <button onClick={() => adoptPet(item.id)} disabled={statusPetId === item.id}>{statusPetId === item.id ? "✓ 正在查看状态" : game.adoptedPets.includes(item.id) ? "查看状态" : "带它回家"}</button>
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
