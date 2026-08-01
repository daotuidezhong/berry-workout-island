"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type PetId = "mitao" | "doubao" | "xueqiu";
type PageId = "home" | "pets" | "shop";
type Point = { x: number; y: number };

type GameState = {
  berries: number;
  streak: number;
  lastCheckin: string | null;
  pet: PetId;
  purchased: string[];
  food: number;
  energy: number;
  catPosition: Point;
  furniturePositions: Record<string, Point>;
};

const DEFAULT_FURNITURE_POSITIONS: Record<string, Point> = {
  rug: { x: 48, y: 76 },
  plant: { x: 86, y: 61 },
  lamp: { x: 73, y: 59 },
  catbed: { x: 25, y: 75 },
};

const INITIAL_GAME: GameState = {
  berries: 48,
  streak: 0,
  lastCheckin: null,
  pet: "mitao",
  purchased: [],
  food: 2,
  energy: 72,
  catPosition: { x: 56, y: 72 },
  furniturePositions: DEFAULT_FURNITURE_POSITIONS,
};

const activities = [
  { id: "walk", icon: "👟", name: "快走", goal: "30 分钟" },
  { id: "run", icon: "🏃", name: "慢跑", goal: "3 公里" },
  { id: "stretch", icon: "🧘", name: "拉伸", goal: "20 分钟" },
];

const pets = [
  { id: "mitao" as PetId, name: "蜜桃", kind: "橘子猫", nature: "热情的小太阳", frames: ["/game/cat-orange-1.png", "/game/cat-orange-2.png"] },
  { id: "doubao" as PetId, name: "豆包", kind: "奶牛猫", nature: "安静的陪跑员", frames: ["/game/cat-cow-1.png", "/game/cat-cow-2.png"] },
  { id: "xueqiu" as PetId, name: "雪球", kind: "白绒猫", nature: "爱撒娇的鼓励师", frames: ["/game/cat-white-1.png", "/game/cat-white-2.png"] },
];

const shopItems = [
  { id: "fish", icon: "🐟", name: "小鱼猫粮", detail: "猫粮 +1", price: 12, type: "food", asset: "" },
  { id: "chicken", icon: "🥫", name: "鸡肉罐头", detail: "猫粮 +1", price: 18, type: "food", asset: "" },
  { id: "rug", icon: "", name: "草莓地毯", detail: "可拖动布置", price: 35, type: "furniture", asset: "/game/furniture-rug.png" },
  { id: "plant", icon: "", name: "薄荷盆栽", detail: "可拖动布置", price: 48, type: "furniture", asset: "/game/furniture-plant.png" },
  { id: "lamp", icon: "", name: "蘑菇夜灯", detail: "可拖动布置", price: 60, type: "furniture", asset: "/game/furniture-lamp.png" },
  { id: "catbed", icon: "", name: "云朵猫窝", detail: "可拖动布置", price: 75, type: "furniture", asset: "/game/furniture-catbed.png" },
];

const milestones = [
  { day: 3, bonus: 6 },
  { day: 7, bonus: 20 },
  { day: 14, bonus: 40 },
  { day: 30, bonus: 100 },
];

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
  const [page, setPage] = useState<PageId>("home");
  const [activity, setActivity] = useState("walk");
  const [game, setGame] = useState<GameState>(INITIAL_GAME);
  const [ready, setReady] = useState(false);
  const [today, setToday] = useState("");
  const [dateLabel, setDateLabel] = useState("");
  const [toast, setToast] = useState("");
  const [decorating, setDecorating] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [walking, setWalking] = useState(false);
  const [walkFrame, setWalkFrame] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const roomRef = useRef<HTMLDivElement>(null);
  const walkingTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const now = new Date();
    const current = localDate(now);
    setToday(current);
    setDateLabel(now.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" }));

    const saved = window.localStorage.getItem("berry-workout-game");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<GameState>;
        const merged: GameState = {
          ...INITIAL_GAME,
          ...parsed,
          purchased: Array.isArray(parsed.purchased) ? parsed.purchased : [],
          catPosition: parsed.catPosition ?? INITIAL_GAME.catPosition,
          furniturePositions: {
            ...DEFAULT_FURNITURE_POSITIONS,
            ...(parsed.furniturePositions ?? {}),
          },
        };
        if (merged.lastCheckin) {
          const previous = new Date(`${merged.lastCheckin}T00:00:00`);
          const midnight = new Date(now);
          midnight.setHours(0, 0, 0, 0);
          const gap = Math.round((midnight.getTime() - previous.getTime()) / 86400000);
          if (gap > 1) merged.streak = 0;
        }
        setGame(merged);
      } catch {
        setGame(INITIAL_GAME);
      }
    }
    setReady(true);
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
    if (!walking) {
      setWalkFrame(0);
      return;
    }
    const timer = window.setInterval(() => setWalkFrame((frame) => (frame ? 0 : 1)), 170);
    return () => window.clearInterval(timer);
  }, [walking]);

  useEffect(() => {
    if (page !== "home" || decorating) return;
    const onKeyDown = (event: KeyboardEvent) => {
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
      setGame((current) => ({
        ...current,
        catPosition: {
          x: clamp(current.catPosition.x + move.x, 7, 93),
          y: clamp(current.catPosition.y + move.y, 36, 86),
        },
      }));
      setWalking(true);
      window.clearTimeout(walkingTimer.current);
      walkingTimer.current = window.setTimeout(() => setWalking(false), 280);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [decorating, page]);

  useEffect(() => {
    if (!dragging) return;
    const moveFurniture = (event: PointerEvent) => {
      const rect = roomRef.current?.getBoundingClientRect();
      if (!rect) return;
      const point = {
        x: clamp(((event.clientX - rect.left) / rect.width) * 100, 6, 94),
        y: clamp(((event.clientY - rect.top) / rect.height) * 100, 38, 87),
      };
      setGame((current) => ({
        ...current,
        furniturePositions: { ...current.furniturePositions, [dragging]: point },
      }));
    };
    const stopDragging = () => setDragging(null);
    window.addEventListener("pointermove", moveFurniture);
    window.addEventListener("pointerup", stopDragging, { once: true });
    return () => {
      window.removeEventListener("pointermove", moveFurniture);
      window.removeEventListener("pointerup", stopDragging);
    };
  }, [dragging]);

  useEffect(() => () => window.clearTimeout(walkingTimer.current), []);

  const checkedToday = Boolean(today && game.lastCheckin === today);
  const pet = pets.find((item) => item.id === game.pet) ?? pets[0];
  const nextStreak = game.streak + (checkedToday ? 0 : 1);
  const streakBonus = milestones.find((item) => item.day === nextStreak)?.bonus ?? 0;
  const checkinReward = 8 + streakBonus;
  const nextMilestone = milestones.find((item) => item.day > game.streak);
  const catAsset = pet.frames[walking ? walkFrame : 0];
  const ownedFurniture = shopItems.filter((item) => item.type === "furniture" && game.purchased.includes(item.id));

  const navItems = useMemo(() => [
    { id: "home" as PageId, icon: "⌂", label: "我的小屋" },
    { id: "pets" as PageId, icon: "🐾", label: "宠物商店" },
    { id: "shop" as PageId, icon: "▦", label: "草莓商场" },
  ], []);

  function moveCat(event: React.PointerEvent<HTMLDivElement>) {
    if (decorating || (event.target as HTMLElement).closest("[data-furniture]")) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 7, 93);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 36, 86);
    setDirection(x < game.catPosition.x ? "left" : "right");
    setGame((current) => ({ ...current, catPosition: { x, y } }));
    setWalking(true);
    window.clearTimeout(walkingTimer.current);
    walkingTimer.current = window.setTimeout(() => setWalking(false), 620);
    event.currentTarget.focus();
  }

  function checkIn() {
    if (!ready || checkedToday) return;
    const next = game.streak + 1;
    const bonus = milestones.find((item) => item.day === next)?.bonus ?? 0;
    const reward = 8 + bonus;
    setGame((current) => ({
      ...current,
      berries: current.berries + reward,
      streak: next,
      lastCheckin: today,
      energy: Math.min(100, current.energy + 8),
    }));
    setToast(bonus ? `连续 ${next} 天！获得 ${reward} 颗草莓` : `打卡成功！获得 ${reward} 颗草莓`);
  }

  function buyItem(item: (typeof shopItems)[number]) {
    const owned = item.type === "furniture" && game.purchased.includes(item.id);
    if (owned) return;
    if (game.berries < item.price) {
      setToast("草莓不够，再完成几次运动吧！");
      return;
    }
    setGame((current) => ({
      ...current,
      berries: current.berries - item.price,
      food: item.type === "food" ? current.food + 1 : current.food,
      purchased: item.type === "furniture" ? [...current.purchased, item.id] : current.purchased,
      furniturePositions: item.type === "furniture"
        ? { ...current.furniturePositions, [item.id]: DEFAULT_FURNITURE_POSITIONS[item.id] }
        : current.furniturePositions,
    }));
    setToast(item.type === "food" ? `${item.name} 已放入背包` : `${item.name} 已送到小屋，可以拖动布置了`);
  }

  function feedPet() {
    if (!game.food) {
      setToast("猫粮吃完啦，去商场补充吧！");
      setPage("shop");
      return;
    }
    if (game.energy >= 100) {
      setToast(`${pet.name} 现在精神满满！`);
      return;
    }
    setGame((current) => ({ ...current, food: current.food - 1, energy: Math.min(100, current.energy + 22) }));
    setToast(`${pet.name} 吃饱啦，开心地蹭了蹭你`);
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
      <div className="app-shell">
        <header className="topbar">
          <button className="brand" onClick={() => setPage("home")} aria-label="回到我的小屋">
            <span className="brand-mark">🍓</span>
            <span><b>莓好运动岛</b><small>把每一次运动，变成家的模样</small></span>
          </button>
          <div className="top-stats">
            <div><span>🔥</span><small>连续</small><b>{game.streak} 天</b></div>
            <div><span>🍓</span><small>草莓</small><b>{game.berries}</b></div>
          </div>
        </header>

        <nav className="world-nav" aria-label="游戏地点">
          {navItems.map((item) => (
            <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => setPage(item.id)}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>

        {page === "home" && (
          <div className="home-layout">
            <aside className="mission-panel">
              <div className="mission-heading">
                <span><small>TODAY&apos;S QUEST</small><b>今日运动</b></span>
                <i>{dateLabel || "今天"}</i>
              </div>
              <div className="activity-list" role="radiogroup" aria-label="选择今天的运动">
                {activities.map((item) => (
                  <button key={item.id} className={activity === item.id ? "selected" : ""} onClick={() => setActivity(item.id)} role="radio" aria-checked={activity === item.id}>
                    <span>{item.icon}</span><b>{item.name}<small>{item.goal}</small></b><i>{activity === item.id ? "✓" : ""}</i>
                  </button>
                ))}
              </div>
              <div className="reward-line"><span>完成可得</span><b>🍓 +{checkinReward}</b></div>
              <button className="checkin-button" onClick={checkIn} disabled={!ready || checkedToday}>
                {checkedToday ? "✓ 今天已打卡" : "完成运动，领取草莓"}
              </button>
              <div className="streak-card">
                <div><span><small>连续记录</small><b>{game.streak} 天</b></span><em>下一份奖励</em></div>
                <div className="week-track">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => <i key={day} className={day <= Math.min(game.streak, 7) ? "done" : ""}>{day <= Math.min(game.streak, 7) ? "✓" : day}</i>)}
                </div>
                <p>{nextMilestone ? <>再坚持 <b>{nextMilestone.day - game.streak} 天</b>，奖励 🍓 {nextMilestone.bonus}</> : "30 天里程碑已达成！"}</p>
              </div>
            </aside>

            <section className="room-section">
              <div className="room-toolbar">
                <span><small>HOME SWEET HOME</small><h1>小莓的家</h1></span>
                <div>
                  {decorating && <button className="reset-button" onClick={resetFurniture}>恢复布局</button>}
                  <button className={`decorate-button ${decorating ? "active" : ""}`} onClick={() => setDecorating((value) => !value)}>
                    {decorating ? "✓ 完成布置" : "✦ 布置小屋"}
                  </button>
                </div>
              </div>

              <div
                className={`game-room ${decorating ? "decorating" : ""}`}
                ref={roomRef}
                tabIndex={0}
                onPointerDown={moveCat}
                aria-label="2D 小屋场景。点击地面或使用方向键移动猫咪。"
              >
                <img className="room-background" src="/game/room-v2.png" alt="温暖的像素风小屋室内" draggable={false} />
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
                        if (!decorating) return;
                        event.stopPropagation();
                        setDragging(item.id);
                      }}
                      aria-label={`${item.name}${decorating ? "，拖动可调整位置" : ""}`}
                    >
                      <img src={item.asset} alt="" draggable={false} />
                      {decorating && <span>拖动</span>}
                    </button>
                  );
                })}

                <div
                  className={`walking-cat ${walking ? "walking" : ""} ${direction === "left" ? "facing-left" : ""}`}
                  style={{ left: `${game.catPosition.x}%`, top: `${game.catPosition.y}%`, zIndex: Math.round(game.catPosition.y) + 2 }}
                >
                  <i />
                  <img src={catAsset} alt={`${pet.name}正在小屋里`} draggable={false} />
                  <b>{pet.name}</b>
                </div>

                <div className="room-help">
                  {decorating ? <><span>✥</span>按住家具拖动，摆成你喜欢的样子</> : <><span>⌁</span>点击地面移动 · 也可以使用方向键 / WASD</>}
                </div>
              </div>

              <div className="room-dock">
                <div className="pet-vitality">
                  <img src={pet.frames[0]} alt="" />
                  <span><b>{pet.name}的活力</b><small>{pet.nature}</small></span>
                  <div className="energy"><i style={{ width: `${game.energy}%` }} /></div>
                  <strong>{game.energy}</strong>
                  <button onClick={feedPet}>喂猫 <small>🐟 ×{game.food}</small></button>
                </div>
                <div className="furniture-inventory">
                  <span><small>我的家具</small><b>{ownedFurniture.length ? "可在布置模式中自由拖动" : "还没有家具"}</b></span>
                  <div>{ownedFurniture.map((item) => <img key={item.id} src={item.asset} alt={item.name} />)}</div>
                  <button onClick={() => setPage("shop")}>{ownedFurniture.length ? "添置家具" : "去商场看看"} →</button>
                </div>
              </div>
            </section>
          </div>
        )}

        {page === "pets" && (
          <section className="store-page pet-store-page">
            <div className="store-heading">
              <span><small>PAW PAW PET SHOP</small><h1>选择你的运动伙伴</h1><p>它会住进小屋，陪你把每一次打卡变成生活。</p></span>
              <i>今日营业 · 伙伴免费</i>
            </div>
            <div className="pet-store-banner"><span>🐾</span><b>爪爪宠物商店</b><small>三位伙伴都在等你回家</small></div>
            <div className="pet-grid">
              {pets.map((item) => (
                <article key={item.id} className={game.pet === item.id ? "chosen" : ""}>
                  <div className="pet-showcase"><span>{item.kind}</span><img src={item.frames[0]} alt={`${item.name}，${item.kind}`} /></div>
                  <div><small>{item.nature}</small><h2>{item.name}</h2><p>喜欢散步、晒太阳，也会在你运动回来时跑到门口迎接。</p></div>
                  <button onClick={() => adoptPet(item.id)} disabled={game.pet === item.id}>{game.pet === item.id ? "✓ 正在陪伴你" : "带它回家"}</button>
                </article>
              ))}
            </div>
          </section>
        )}

        {page === "shop" && (
          <section className="store-page mall-page">
            <div className="store-heading">
              <span><small>BERRY MINI MALL</small><h1>用运动收获，装扮你的家</h1><p>家具购买后会送到小屋，并且可以自由拖动布置。</p></span>
              <div className="wallet"><small>草莓余额</small><b>🍓 {game.berries}</b></div>
            </div>
            <div className="mall-promo"><span>今日推荐</span><b>运动越多，小屋越温暖</b><small>所有家具都是一次购买，永久拥有</small></div>
            <div className="shop-grid">
              {shopItems.map((item) => {
                const owned = item.type === "furniture" && game.purchased.includes(item.id);
                return (
                  <article key={item.id} className={owned ? "owned" : ""}>
                    <div className={`shop-art ${item.type === "food" ? "food-art" : ""}`}>
                      {item.asset ? <img src={item.asset} alt="" /> : <span>{item.icon}</span>}
                    </div>
                    <div><small>{item.type === "food" ? "补给" : "家具"}</small><h2>{item.name}</h2><p>{item.detail}</p></div>
                    <button onClick={() => buyItem(item)} disabled={owned}>{owned ? "✓ 已拥有" : <>🍓 {item.price}</>}</button>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">{toast}</div>
    </main>
  );
}
