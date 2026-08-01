"use client";

import { useEffect, useMemo, useState } from "react";

type PetId = "mitao" | "doubao" | "xueqiu";
type PageId = "home" | "pets" | "shop";

type GameState = {
  berries: number;
  streak: number;
  lastCheckin: string | null;
  pet: PetId;
  purchased: string[];
  food: number;
  energy: number;
};

const INITIAL_GAME: GameState = {
  berries: 48,
  streak: 0,
  lastCheckin: null,
  pet: "mitao",
  purchased: [],
  food: 2,
  energy: 72,
};

const activities = [
  { id: "walk", icon: "👟", name: "快走", goal: "30 分钟" },
  { id: "run", icon: "🏃", name: "慢跑", goal: "3 公里" },
  { id: "stretch", icon: "🧘", name: "拉伸", goal: "20 分钟" },
];

const pets = [
  {
    id: "mitao" as PetId,
    name: "蜜桃",
    kind: "橘子猫",
    nature: "热情的小太阳",
    color: "orange",
  },
  {
    id: "doubao" as PetId,
    name: "豆包",
    kind: "奶牛猫",
    nature: "安静的陪跑员",
    color: "black",
  },
  {
    id: "xueqiu" as PetId,
    name: "雪球",
    kind: "白绒猫",
    nature: "爱撒娇的鼓励师",
    color: "white",
  },
];

const shopItems = [
  { id: "fish", icon: "🐟", name: "小鱼猫粮", detail: "猫粮 +1", price: 12, type: "food" },
  { id: "chicken", icon: "🍗", name: "鸡肉罐头", detail: "猫粮 +1", price: 18, type: "food" },
  { id: "rug", icon: "▰", name: "草莓地毯", detail: "摆进小屋", price: 35, type: "furniture" },
  { id: "plant", icon: "🌿", name: "薄荷盆栽", detail: "摆进小屋", price: 48, type: "furniture" },
  { id: "lamp", icon: "💡", name: "蘑菇夜灯", detail: "摆进小屋", price: 60, type: "furniture" },
  { id: "catbed", icon: "🧺", name: "云朵猫窝", detail: "摆进小屋", price: 75, type: "furniture" },
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

function PixelCat({ color, small = false }: { color: string; small?: boolean }) {
  return (
    <div className={`pixel-cat ${color} ${small ? "small" : ""}`} aria-hidden="true">
      <span className="cat-tail" />
      <span className="cat-body" />
      <span className="cat-head">
        <i className="ear ear-left" />
        <i className="ear ear-right" />
        <i className="eye eye-left" />
        <i className="eye eye-right" />
        <i className="nose" />
      </span>
      <span className="cat-paw paw-left" />
      <span className="cat-paw paw-right" />
    </div>
  );
}

export default function Home() {
  const [page, setPage] = useState<PageId>("home");
  const [activity, setActivity] = useState("walk");
  const [game, setGame] = useState<GameState>(INITIAL_GAME);
  const [ready, setReady] = useState(false);
  const [today, setToday] = useState("");
  const [dateLabel, setDateLabel] = useState("");
  const [toast, setToast] = useState("");
  const [rewardBurst, setRewardBurst] = useState(false);

  useEffect(() => {
    const now = new Date();
    const current = localDate(now);
    setToday(current);
    setDateLabel(
      now.toLocaleDateString("zh-CN", {
        month: "long",
        day: "numeric",
        weekday: "short",
      }),
    );

    const saved = window.localStorage.getItem("berry-workout-game");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as GameState;
        if (parsed.lastCheckin) {
          const previous = new Date(`${parsed.lastCheckin}T00:00:00`);
          const gap = Math.round((now.setHours(0, 0, 0, 0) - previous.getTime()) / 86400000);
          if (gap > 1) parsed.streak = 0;
        }
        setGame(parsed);
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

  const checkedToday = Boolean(today && game.lastCheckin === today);
  const pet = pets.find((item) => item.id === game.pet) ?? pets[0];
  const nextStreak = game.streak + (checkedToday ? 0 : 1);
  const streakBonus = milestones.find((item) => item.day === nextStreak)?.bonus ?? 0;
  const checkinReward = 8 + streakBonus;
  const nextMilestone = milestones.find((item) => item.day > game.streak);
  const weekProgress = Math.min(game.streak, 7);

  const navItems = useMemo(
    () => [
      { id: "home" as PageId, icon: "⌂", label: "我的小屋" },
      { id: "pets" as PageId, icon: "🐾", label: "宠物商店" },
      { id: "shop" as PageId, icon: "▦", label: "草莓商场" },
    ],
    [],
  );

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
    setRewardBurst(true);
    window.setTimeout(() => setRewardBurst(false), 1100);
    setToast(bonus ? `连续 ${next} 天！获得 ${reward} 颗草莓` : `打卡成功！获得 ${reward} 颗草莓`);
  }

  function buyItem(item: (typeof shopItems)[number]) {
    if (item.type === "furniture" && game.purchased.includes(item.id)) return;
    if (game.berries < item.price) {
      setToast("草莓不够，再完成几次运动吧！");
      return;
    }
    setGame((current) => ({
      ...current,
      berries: current.berries - item.price,
      food: item.type === "food" ? current.food + 1 : current.food,
      purchased:
        item.type === "furniture" ? [...current.purchased, item.id] : current.purchased,
    }));
    setToast(item.type === "food" ? `${item.name} 已放入背包` : `${item.name} 已摆进小屋`);
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
    setGame((current) => ({
      ...current,
      food: current.food - 1,
      energy: Math.min(100, current.energy + 22),
    }));
    setToast(`${pet.name} 吃饱啦，开心地蹭了蹭你`);
  }

  function adoptPet(id: PetId) {
    const chosen = pets.find((item) => item.id === id)!;
    setGame((current) => ({ ...current, pet: id }));
    setToast(`${chosen.name} 已经住进你的小屋啦！`);
  }

  return (
    <main className="game-page">
      <div className="cloud cloud-one" />
      <div className="cloud cloud-two" />
      <div className="game-shell">
        <header className="topbar">
          <button className="brand" onClick={() => setPage("home")} aria-label="返回我的小屋">
            <span className="brand-berry">🍓</span>
            <span>
              <b>莓好运动岛</b>
              <small>MOVE · GROW · PURR</small>
            </span>
          </button>
          <div className="top-stats">
            <div className="stat-chip">
              <span>🔥</span>
              <span><small>连续打卡</small><b>{game.streak} 天</b></span>
            </div>
            <div className="stat-chip berry-chip">
              <span>🍓</span>
              <span><small>草莓余额</small><b>{game.berries}</b></span>
            </div>
            <button className="avatar-button" aria-label="玩家小莓的资料">莓</button>
          </div>
        </header>

        <nav className="world-nav" aria-label="游戏地点">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={page === item.id ? "active" : ""}
              onClick={() => setPage(item.id)}
            >
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>

        <div className="game-grid">
          <aside className="quest-panel">
            <div className="wood-sign">
              <span>今日运动任务</span>
              <small>{dateLabel || "今天"}</small>
            </div>

            <div className="activity-list" role="radiogroup" aria-label="选择今天的运动">
              {activities.map((item) => (
                <button
                  key={item.id}
                  className={activity === item.id ? "selected" : ""}
                  onClick={() => setActivity(item.id)}
                  role="radio"
                  aria-checked={activity === item.id}
                >
                  <span className="activity-icon">{item.icon}</span>
                  <span><b>{item.name}</b><small>{item.goal}</small></span>
                  <i>{activity === item.id ? "✓" : ""}</i>
                </button>
              ))}
            </div>

            <div className="reward-preview">
              <span>完成奖励</span>
              <b>🍓 +{checkinReward}</b>
              {streakBonus > 0 && !checkedToday && <small>含连续打卡奖励 +{streakBonus}</small>}
            </div>

            <button className="checkin-button" onClick={checkIn} disabled={!ready || checkedToday}>
              <span>{checkedToday ? "✓" : "✦"}</span>
              {checkedToday ? "今天已打卡" : "完成运动，领取草莓"}
            </button>

            <div className="streak-card">
              <div className="streak-heading">
                <span><b>本轮连续打卡</b><small>坚持会有额外惊喜</small></span>
                <strong>{game.streak}<i>天</i></strong>
              </div>
              <div className="week-row">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <div key={day} className={day <= weekProgress ? "done" : day === weekProgress + 1 ? "today" : ""}>
                    <span>{day <= weekProgress ? "✓" : day}</span>
                    <small>{day === 7 ? "宝箱" : `D${day}`}</small>
                  </div>
                ))}
              </div>
              <p>
                {nextMilestone
                  ? <>再坚持 <b>{nextMilestone.day - game.streak} 天</b>，额外获得 🍓 {nextMilestone.bonus}</>
                  : <>30 天里程碑已达成，你是运动大师！</>}
              </p>
            </div>
          </aside>

          <section className="scene-card">
            {page === "home" && (
              <>
                <div className="scene-title">
                  <span><small>HOME SWEET HOME</small><h1>小莓的家</h1></span>
                  <button onClick={() => setPage("shop")}>＋ 添置家具</button>
                </div>
                <div className="room-scene">
                  <div className="room-wall">
                    <div className="window"><span /><i /></div>
                    <div className="wall-picture">🍓<small>MOVE!</small></div>
                    <div className="shelf"><i /><i /><i /></div>
                  </div>
                  <div className="room-floor" />
                  <div className="base-cabinet"><i /><i /></div>
                  <div className="base-cushion" />
                  {game.purchased.includes("rug") && <div className="furniture rug"><span>♥</span></div>}
                  {game.purchased.includes("plant") && <div className="furniture plant">♣<i /></div>}
                  {game.purchased.includes("lamp") && <div className="furniture lamp"><span>●</span><i /></div>}
                  {game.purchased.includes("catbed") && <div className="furniture catbed">☁</div>}
                  <div className="home-pet">
                    <span className="pet-speech">{checkedToday ? "今天也超棒！" : "运动后一起玩吧！"}</span>
                    <PixelCat color={pet.color} />
                    <b>{pet.name}</b>
                  </div>
                  {rewardBurst && (
                    <div className="berry-burst" aria-hidden="true">
                      <span>🍓</span><span>🍓</span><span>🍓</span>
                    </div>
                  )}
                </div>

                <div className="home-info">
                  <div className="pet-status">
                    <div className="mini-pet"><PixelCat color={pet.color} small /></div>
                    <span><b>{pet.name}的活力</b><small>{pet.nature}</small></span>
                    <div className="energy-wrap"><div><i style={{ width: `${game.energy}%` }} /></div><small>{game.energy}/100</small></div>
                    <button onClick={feedPet}>🐟 喂猫 <small>×{game.food}</small></button>
                  </div>
                  <div className="daily-note">
                    <span>“</span>
                    <p>每一次出发，都会让小屋更温暖一点。<small>—— 蜜莓镇运动手册</small></p>
                  </div>
                </div>
              </>
            )}

            {page === "pets" && (
              <>
                <div className="scene-title pet-shop-title">
                  <span><small>PAW PAW PET SHOP</small><h1>爪爪宠物商店</h1></span>
                  <div className="open-badge">OPEN</div>
                </div>
                <div className="pet-shop-banner">
                  <div className="awning"><i /><i /><i /><i /><i /><i /></div>
                  <div><span>🐾</span><b>选一位运动伙伴</b><small>它会在小屋等你打卡回家</small></div>
                </div>
                <div className="pet-grid">
                  {pets.map((item) => (
                    <article key={item.id} className={game.pet === item.id ? "chosen" : ""}>
                      <div className="pet-window"><PixelCat color={item.color} /></div>
                      <div className="pet-card-copy">
                        <span><small>{item.kind}</small><h2>{item.name}</h2></span>
                        <p>{item.nature}</p>
                      </div>
                      <button onClick={() => adoptPet(item.id)} disabled={game.pet === item.id}>
                        {game.pet === item.id ? "✓ 正在陪伴你" : "带它回家"}
                      </button>
                    </article>
                  ))}
                </div>
                <p className="shop-footnote">宠物伙伴可以随时更换，不会收取草莓。</p>
              </>
            )}

            {page === "shop" && (
              <>
                <div className="scene-title mall-title">
                  <span><small>BERRY MINI MALL</small><h1>草莓商场</h1></span>
                  <div className="wallet">你的钱包 <b>🍓 {game.berries}</b></div>
                </div>
                <div className="mall-banner">
                  <span>本周推荐</span>
                  <b>让运动收获，变成看得见的小幸福</b>
                  <i>家具购买后会直接出现在小屋里</i>
                </div>
                <div className="shop-grid">
                  {shopItems.map((item) => {
                    const owned = item.type === "furniture" && game.purchased.includes(item.id);
                    return (
                      <article key={item.id} className={owned ? "owned" : ""}>
                        <div className={`item-art item-${item.id}`}><span>{item.icon}</span></div>
                        <div className="item-copy"><h2>{item.name}</h2><p>{item.detail}</p></div>
                        <button onClick={() => buyItem(item)} disabled={owned}>
                          {owned ? "✓ 已拥有" : <>🍓 {item.price}</>}
                        </button>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </div>

        <footer>
          <span>🍓 莓好运动岛</span>
          <p>今天动一动，明天的小屋会更可爱。</p>
          <button onClick={() => setPage("pets")}>去看看宠物伙伴 →</button>
        </footer>
      </div>
      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">{toast}</div>
    </main>
  );
}
