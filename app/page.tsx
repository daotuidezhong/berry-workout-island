"use client";

import { useEffect, useRef, useState } from "react";
import { clampCatPosition, getFurnitureTarget, type Point } from "./furniture";
import { getTimePeriod, type TimePeriod } from "./time-period";

type PetId = "mitao" | "doubao" | "xueqiu";
type OverlayId = "quest" | "bag" | "pets" | "shop" | null;
type IdleAction = "groom" | "yawn";
type ShopCategory = "food" | "furniture";
type FoodId = "driedFish" | "chickenCan" | "salmonMousse" | "tunaRice" | "chickenCubes" | "catnipBiscuits";
type GameState = {
  berries: number;
  streak: number;
  lastCheckin: string | null;
  lastActivity: string | null;
  pet: PetId;
  purchased: string[];
  inventory: Record<FoodId, number>;
  energy: number;
  sleepiness: number;
  catPosition: Point;
  catFurniture: string | null;
  furniturePositions: Record<string, Point>;
};

const DEFAULT_FURNITURE_POSITIONS: Record<string, Point> = {
  rug: { x: 48, y: 78 },
  plant: { x: 86, y: 62 },
  lamp: { x: 73, y: 61 },
  catbed: { x: 25, y: 77 },
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
  { id: "catbed", name: "云朵猫窝", detail: "最适合蜷成一团", price: 75, asset: "/game/furniture-catbed.png", standHeight: 4 },
  { id: "bookcase", name: "草莓书柜", detail: "摆满绘本和小收藏", price: 82, asset: "/game/furniture-bookcase.png", standHeight: null },
  { id: "table", name: "莓果小圆桌", detail: "一起坐下吃点心", price: 58, asset: "/game/furniture-table.png", standHeight: 8 },
  { id: "cushion", name: "爱心软垫", detail: "软绵绵的休息角", price: 42, asset: "/game/furniture-cushion.png", standHeight: 2 },
  { id: "chest", name: "木制玩具箱", detail: "收好猫咪的小玩具", price: 68, asset: "/game/furniture-chest.png", standHeight: 5 },
];

const pets = [
  {
    id: "mitao" as PetId, name: "蜜桃", kind: "橘子猫", nature: "热情的小太阳",
    walkFrames: [1, 2, 3, 4].map((frame) => `/game/cat-orange-walk-v2-${frame}.png`), idle: "/game/cat-orange-idle.png",
    groomFrames: [1, 2, 3, 4].map((frame) => `/game/cat-orange-groom-${frame}.png`),
    yawnFrames: [1, 2, 3, 4].map((frame) => `/game/cat-orange-yawn-${frame}.png`),
    frameAdjustments: {
      walk: { scale: 1.036, y: 5.05 },
      groom: { scale: 1.321, y: 1.68 },
      yawn: { scale: 1.191, y: 1.03 },
    },
  },
  {
    id: "doubao" as PetId, name: "豆包", kind: "奶牛猫", nature: "安静的陪跑员",
    walkFrames: [1, 3, 4, 3].map((frame) => `/game/cat-cow-walk-v2-${frame}.png`), idle: "/game/cat-cow-idle.png",
    groomFrames: [1, 2, 3, 4].map((frame) => `/game/cat-cow-groom-${frame}.png`),
    yawnFrames: [1, 2, 3, 4].map((frame) => `/game/cat-cow-yawn-${frame}.png`),
    frameAdjustments: {
      walk: { scale: 1.073, y: 7.48 },
      groom: { scale: 1.165, y: -6.3 },
      yawn: { scale: 1.079, y: -6.65 },
    },
  },
  {
    id: "xueqiu" as PetId, name: "雪球", kind: "白绒猫", nature: "爱撒娇的鼓励师",
    walkFrames: [1, 2, 3, 4].map((frame) => `/game/cat-white-walk-v2-${frame}.png`), idle: "/game/cat-white-idle.png",
    groomFrames: [1, 2, 3, 4].map((frame) => `/game/cat-white-groom-${frame}.png`),
    yawnFrames: [1, 2, 3, 4].map((frame) => `/game/cat-white-yawn-${frame}.png`),
    frameAdjustments: {
      walk: { scale: 1.07, y: 9.25 },
      groom: { scale: 1.193, y: -12.35 },
      yawn: { scale: 1.115, y: -12.7 },
    },
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
  berries: 48,
  streak: 0,
  lastCheckin: null,
  lastActivity: null,
  pet: "mitao",
  purchased: [],
  inventory: INITIAL_INVENTORY,
  energy: 72,
  sleepiness: 24,
  catPosition: { x: 56, y: 72 },
  catFurniture: null,
  furniturePositions: DEFAULT_FURNITURE_POSITIONS,
};

const milestones = [
  { day: 3, bonus: 6 },
  { day: 7, bonus: 20 },
  { day: 14, bonus: 40 },
  { day: 30, bonus: 100 },
];

const actionSequences = {
  groom: [-1, 0, 1, 2, 3, 2, 3, 2, 1, 0, -1],
  yawn: [-1, 0, 1, 2, 3, 3, 2, 1, 0, -1],
};

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
  const [idleAction, setIdleAction] = useState<IdleAction | null>(null);
  const [idleFrame, setIdleFrame] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const roomRef = useRef<HTMLDivElement>(null);
  const walkingTimer = useRef<number | undefined>(undefined);
  const idleCycle = useRef(0);

  useEffect(() => {
    const now = new Date();
    const current = localDate(now);
    setToday(current);
    setDateLabel(now.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" }));

    const saved = window.localStorage.getItem("berry-workout-game");
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
          catPosition: clampCatPosition(parsed.catPosition ?? INITIAL_GAME.catPosition),
          furniturePositions: { ...DEFAULT_FURNITURE_POSITIONS, ...(parsed.furniturePositions ?? {}) },
        };
        if (merged.lastCheckin) {
          const previous = new Date(`${merged.lastCheckin}T00:00:00`);
          const midnight = new Date(now);
          midnight.setHours(0, 0, 0, 0);
          if (Math.round((midnight.getTime() - previous.getTime()) / 86400000) > 1) merged.streak = 0;
        }
        if (merged.lastCheckin === current && merged.lastActivity) setActivityText(merged.lastActivity);
        setGame(merged);
      } catch {
        setGame(INITIAL_GAME);
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    const syncTimePeriod = () => setTimePeriod(getTimePeriod());
    syncTimePeriod();
    const timer = window.setInterval(syncTimePeriod, 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem("berry-workout-game", JSON.stringify(game));
  }, [game, ready]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    pets.flatMap((item) => [...item.walkFrames, ...item.groomFrames, ...item.yawnFrames]).forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }, []);

  useEffect(() => {
    if (!walking) {
      setWalkFrame(0);
      return;
    }
    const timer = window.setInterval(() => setWalkFrame((frame) => (frame + 1) % 4), 90);
    return () => window.clearInterval(timer);
  }, [walking]);

  useEffect(() => {
    if (!idleAction) return;
    const sequence = actionSequences[idleAction];
    let frame = 0;
    setIdleFrame(0);
    const timer = window.setInterval(() => {
      frame += 1;
      if (frame >= sequence.length) {
        window.clearInterval(timer);
        idleCycle.current += 1;
        setIdleAction(null);
        setIdleFrame(0);
        return;
      }
      setIdleFrame(frame);
    }, idleAction === "groom" ? 250 : 290);
    return () => window.clearInterval(timer);
  }, [idleAction]);

  useEffect(() => {
    if (walking || decorating || idleAction) return;
    const nextAction = idleCycle.current % 2 === 0 ? "groom" : "yawn";
    const timer = window.setTimeout(() => {
      if (nextAction === "yawn") {
        setGame((current) => ({ ...current, sleepiness: Math.min(100, current.sleepiness + 2) }));
      }
      setIdleAction(nextAction);
    }, nextAction === "groom" ? 3800 : 5400);
    return () => window.clearTimeout(timer);
  }, [decorating, idleAction, walking]);

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
      if (move.x) setDirection(move.x < 0 ? "left" : "right");
      setWalkDuration(120);
      setGame((current) => ({
        ...current,
        catPosition: clampCatPosition({
          x: current.catPosition.x + move.x,
          y: current.catPosition.y + move.y,
        }),
        catFurniture: null,
      }));
      setJumping(false);
      setWalking(true);
      window.clearTimeout(walkingTimer.current);
      walkingTimer.current = window.setTimeout(() => {
        setWalking(false);
        setJumping(false);
      }, 180);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [decorating, overlay]);

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

  useEffect(() => () => window.clearTimeout(walkingTimer.current), []);

  const checkedToday = Boolean(today && game.lastCheckin === today);
  const pet = pets.find((item) => item.id === game.pet) ?? pets[0];
  const nextStreak = game.streak + (checkedToday ? 0 : 1);
  const streakBonus = milestones.find((item) => item.day === nextStreak)?.bonus ?? 0;
  const checkinReward = 8 + streakBonus;
  const nextMilestone = milestones.find((item) => item.day > game.streak);
  const ownedFurniture = furnitureItems.filter((item) => game.purchased.includes(item.id));
  const totalFood = foodItems.reduce((total, item) => total + game.inventory[item.id], 0);
  const selectedFoodItem = foodItems.find((item) => item.id === selectedFood) ?? foodItems[0];
  const actionFrame = idleAction ? actionSequences[idleAction][idleFrame] : -1;
  const frameAdjustment = walking
    ? pet.frameAdjustments.walk
    : idleAction && actionFrame >= 0
      ? pet.frameAdjustments[idleAction]
      : { scale: 1, y: 0 };
  const catAsset = walking
    ? pet.walkFrames[walkFrame]
    : idleAction && actionFrame >= 0
      ? (idleAction === "groom" ? pet.groomFrames : pet.yawnFrames)[actionFrame]
      : pet.idle;

  function openOverlay(id: Exclude<OverlayId, null>) {
    setDecorating(false);
    if (id === "bag") {
      const firstOwned = foodItems.find((item) => game.inventory[item.id] > 0);
      if (firstOwned) setSelectedFood(firstOwned.id);
    }
    setOverlay(id);
  }

  function moveCat(event: React.PointerEvent<HTMLDivElement>) {
    if (decorating || overlay || (event.target as HTMLElement).closest("[data-furniture]")) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const { x, y } = clampCatPosition({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
    const distance = Math.hypot(x - game.catPosition.x, y - game.catPosition.y);
    const duration = Math.round(clamp(distance * 14, 420, 900));
    setDirection(x < game.catPosition.x ? "left" : "right");
    setWalkDuration(duration);
    setGame((current) => ({ ...current, catPosition: { x, y }, catFurniture: null }));
    setJumping(false);
    setWalking(true);
    window.clearTimeout(walkingTimer.current);
    walkingTimer.current = window.setTimeout(() => {
      setWalking(false);
      setJumping(false);
    }, duration + 60);
    event.currentTarget.focus();
  }

  function moveCatToFurniture(item: (typeof furnitureItems)[number], position: Point) {
    const target = getFurnitureTarget(position, item.standHeight);
    const distance = Math.hypot(target.x - game.catPosition.x, target.y - game.catPosition.y);
    const duration = Math.round(clamp(distance * 14, 420, 900));
    setDirection(target.x < game.catPosition.x ? "left" : "right");
    setWalkDuration(duration);
    setJumping(target.jumping);
    setWalking(true);
    setGame((current) => ({
      ...current,
      catPosition: { x: target.x, y: target.y },
      catFurniture: target.onTop ? item.id : null,
    }));
    window.clearTimeout(walkingTimer.current);
    walkingTimer.current = window.setTimeout(() => {
      setWalking(false);
      setJumping(false);
    }, duration + 60);
  }

  function checkIn(event: React.FormEvent) {
    event.preventDefault();
    const completedActivity = activityText.trim();
    if (!ready || checkedToday || !completedActivity) return;
    const next = game.streak + 1;
    const bonus = milestones.find((item) => item.day === next)?.bonus ?? 0;
    const reward = 8 + bonus;
    setGame((current) => ({
      ...current,
      berries: current.berries + reward,
      streak: next,
      lastCheckin: today,
      lastActivity: completedActivity,
      energy: Math.min(100, current.energy + 8),
      sleepiness: Math.max(0, current.sleepiness - 8),
    }));
    setToast(bonus ? `连续 ${next} 天！获得 ${reward} 颗草莓` : `记录成功！获得 ${reward} 颗草莓`);
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
    setToast(`${pet.name} 吃掉了${item.name}，活力 +${item.energy}`);
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
      <section className="game-stage" aria-label="莓好运动岛全屏游戏">
        <div
          className={`game-room ${decorating ? "decorating" : ""}`}
          data-period={timePeriod}
          ref={roomRef}
          tabIndex={0}
          onPointerDown={moveCat}
          aria-label="全屏像素小屋。点击地面或使用方向键移动猫咪。"
        >
          <img className="room-background" src="/game/room-v2.png" alt="温暖的像素风猫咪小屋" draggable={false} />
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
                aria-label={`${item.name}${decorating ? "，拖动可调整位置" : item.standHeight === null ? "，走到旁边" : item.standHeight ? "，跳上去" : "，走上去"}`}
              >
                <img src={item.asset} alt="" draggable={false} />
                {decorating && <span>拖动</span>}
              </button>
            );
          })}

          <div
            className={`walking-cat ${walking ? "walking" : ""} ${jumping ? "jumping" : ""} ${direction === "left" ? "facing-left" : ""}`}
            style={{ left: `${game.catPosition.x}%`, top: `${game.catPosition.y}%`, zIndex: game.catFurniture ? Math.round((game.furniturePositions[game.catFurniture] ?? DEFAULT_FURNITURE_POSITIONS[game.catFurniture]).y) + 2 : Math.round(game.catPosition.y) + 2, transitionDuration: `${walkDuration}ms` }}
          >
            <i />
            <img src={catAsset} alt={`${pet.name}正在小屋里`} draggable={false} style={{ transform: `translateY(${frameAdjustment.y}%) scale(${direction === "left" ? -frameAdjustment.scale : frameAdjustment.scale}, ${frameAdjustment.scale})` }} />
            <b>{pet.name}</b>
          </div>

        </div>

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
          <button className={overlay === "quest" ? "active" : ""} onClick={() => openOverlay("quest")}><span>📋</span><b>任务</b></button>
          <button className={overlay === "bag" ? "active" : ""} onClick={() => openOverlay("bag")}><span>🎒</span><b>背包</b><i>{totalFood}</i></button>
          <button className={overlay === "shop" ? "active" : ""} onClick={() => openOverlay("shop")}><span>🛒</span><b>商店</b></button>
          <button className={overlay === "pets" ? "active" : ""} onClick={() => openOverlay("pets")}><span>🐾</span><b>伙伴</b></button>
          <button className={decorating ? "active" : ""} onClick={() => { setOverlay(null); setDecorating((value) => !value); setJumping(false); }}><span>🪑</span><b>布置</b></button>
        </nav>

        {overlay && (
          <div className="window-layer" onPointerDown={() => setOverlay(null)}>
            <section className={`game-window ${overlay}-window`} onPointerDown={(event) => event.stopPropagation()}>
              <button className="window-close" onClick={() => setOverlay(null)} aria-label="关闭窗口">×</button>

              {overlay === "quest" && (
                <>
                  <div className="window-heading"><small>TODAY&apos;S QUEST</small><h1>今日运动任务</h1><p>{dateLabel || "今天"}</p></div>
                  <form className="activity-entry" onSubmit={checkIn}>
                    <label htmlFor="today-activity">今天做了什么？</label>
                    <div>
                      <textarea id="today-activity" value={activityText} onChange={(event) => setActivityText(event.target.value)} placeholder="例如：跳绳 20 分钟、爬楼梯、打了一场球……" maxLength={40} rows={3} disabled={checkedToday} />
                      <small>{activityText.trim().length}/40</small>
                    </div>
                    {checkedToday && game.lastActivity && <p>✓ 今天完成：{game.lastActivity}</p>}
                    <div className="reward-line"><span>{checkedToday ? "今天已收获" : "记录即可获得"}</span><b>🍓 +{checkinReward}</b></div>
                    <button className="primary-button" type="submit" disabled={!ready || checkedToday || !activityText.trim()}>{checkedToday ? "✓ 今天已完成" : "记录运动，领取草莓"}</button>
                  </form>
                  <div className="streak-card">
                    <div><span><small>连续记录</small><b>{game.streak} 天</b></span><em>下一份奖励</em></div>
                    <div className="week-track">{[1, 2, 3, 4, 5, 6, 7].map((day) => <i key={day} className={day <= Math.min(game.streak, 7) ? "done" : ""}>{day <= Math.min(game.streak, 7) ? "✓" : day}</i>)}</div>
                    <p>{nextMilestone ? <>再坚持 <b>{nextMilestone.day - game.streak} 天</b>，奖励 🍓 {nextMilestone.bonus}</> : "30 天里程碑已达成！"}</p>
                  </div>
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
                        <div><small>活力 +{item.energy}</small><h2>{item.name}</h2><p>{item.detail}</p></div>
                        <button onClick={() => buyFood(item)}>🍓 {item.price}</button>
                      </article>
                    )) : furnitureItems.map((item) => {
                      const owned = game.purchased.includes(item.id);
                      return (
                        <article key={item.id} className={owned ? "owned" : ""}>
                          <div className="store-art"><img src={item.asset} alt="" /></div>
                          <div><small>可自由拖动</small><h2>{item.name}</h2><p>{item.detail}</p></div>
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
                        <div><span>{item.kind}</span><img src={item.idle} alt={`${item.name}，${item.kind}`} /></div>
                        <small>{item.nature}</small><h2>{item.name}</h2>
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
