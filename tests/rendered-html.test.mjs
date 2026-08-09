import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { CAT_BOUNDS, clampCatPosition, getFurnitureTarget } from "../app/game/furniture.ts";
import { getTimePeriod } from "../app/game/time-period.ts";
import { estimateCalories } from "../app/game/calories.ts";
import { getRoomAsset, getWeatherKind, ROOM_ASSET_BY_WEATHER } from "../app/game/weather.ts";
import { CAT_STATUS_ANIMATIONS, getCatStatus, getCatStatusTransition } from "../app/game/cat-actions.ts";
import { canPetMove, decayPetStats, decayPetStatsByTime, formatSleepRemaining, getSleepRemainingMs, PET_STAT_DECAY_MS, SLEEP_DURATION_MS } from "../app/game/pet-stats.ts";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("maps local hours to four room lighting periods", () => {
  assert.deepEqual(
    [4, 5, 10, 11, 15, 16, 18, 19, 23].map(getTimePeriod),
    ["night", "morning", "morning", "noon", "noon", "evening", "evening", "night", "night"],
  );
});

test("estimates calories from activity and duration", () => {
  assert.equal(estimateCalories("跳绳", 20), 184);
  assert.equal(estimateCalories("瑜伽", 30), 83);
  assert.equal(estimateCalories("", 30), 0);
});

test("uses furniture height to choose walking or jumping", () => {
  assert.equal(CAT_BOUNDS.minY, 43);
  assert.deepEqual(clampCatPosition({ x: 50, y: 24 }), { x: 50, y: 43 });
  assert.deepEqual(clampCatPosition({ x: 100, y: 100 }), { x: 93, y: 88 });
  assert.deepEqual(getFurnitureTarget({ x: 48, y: 78 }, 0), { x: 48, y: 78, jumping: false, onTop: true });
  assert.deepEqual(getFurnitureTarget({ x: 61, y: 77 }, 8), { x: 61, y: 69, jumping: true, onTop: true });
  assert.deepEqual(getFurnitureTarget({ x: 86, y: 62 }, null), { x: 92, y: 62, jumping: false, onTop: false });
});

test("maps Foshan weather codes to room weather states", () => {
  assert.equal(getWeatherKind(0, 0, 8), "clear");
  assert.equal(getWeatherKind(3, 0, 80), "cloudy");
  assert.equal(getWeatherKind(61, 0.4, 95), "rain");
  assert.equal(getWeatherKind(95, 2.2, 100), "thunderstorm");
  assert.deepEqual(Object.values(ROOM_ASSET_BY_WEATHER), [
    "/game/room-v2.png",
    "/game/room-cloudy-v2.png",
    "/game/room-rain.png",
    "/game/room-thunderstorm-v2.png",
  ]);
  assert.equal(getRoomAsset("clear", "morning"), "/game/room-morning.png");
  assert.equal(getRoomAsset("cloudy", "morning"), "/game/room-cloudy-v2.png");
  assert.equal(getRoomAsset("rain", "morning"), "/game/room-rain.png");
  assert.equal(getRoomAsset("clear", "evening"), "/game/room-evening.png");
  assert.equal(getRoomAsset("cloudy", "evening"), "/game/room-cloudy-v2.png");
  assert.equal(getRoomAsset("rain", "evening"), "/game/room-rain.png");
});

test("weather and time preserve the interior colors", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.doesNotMatch(css, /data-weather[^\{]*\{[^\}]*--scene-lighting|not\(\[data-weather="clear"\]\) \.room-vignette/);
  assert.match(css, /data-period="night"\] \{ --scene-lighting: brightness\(\.97\); \}/);
  assert.doesNotMatch(css, /data-period="(?:morning|evening|night)"[^\}]*\b(?:sepia|saturate|hue-rotate)\(/);
  assert.doesNotMatch(css, /data-period="night"\] \.room-vignette/);
});

test("uses the pixel cat paw cursor throughout the game", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const cursor = await readFile(new URL("../public/game/cursor-cat-paw.png", import.meta.url));
  assert.match(css, /\.game-stage \{[^}]*cursor: url\("\/game\/cursor-cat-paw\.png"\) 15 15, auto;/);
  assert.match(css, /\.game-stage \* \{ cursor: inherit !important; \}/);
  assert.equal(cursor.subarray(1, 4).toString(), "PNG");
  assert.equal(cursor.readUInt32BE(16), 32);
  assert.equal(cursor.readUInt32BE(20), 32);
});

test("maps the two pet stats to all nine animation states", () => {
  assert.deepEqual(
    [
      [85, 12], [85, 50], [85, 88],
      [50, 12], [50, 50], [50, 88],
      [12, 12], [12, 50], [12, 88],
    ].map(([energy, sleepiness]) => getCatStatus(energy, sleepiness)),
    ["high-low", "high-medium", "high-high", "medium-low", "medium-medium", "medium-high", "low-low", "low-medium", "low-high"],
  );
  assert.equal(getCatStatus(30, 30), "low-low");
  assert.equal(getCatStatus(31, 31), "medium-medium");
  assert.equal(getCatStatus(71, 71), "high-high");
  assert.equal(Object.keys(CAT_STATUS_ANIMATIONS).length, 9);
  for (const [status, animation] of Object.entries(CAT_STATUS_ANIMATIONS)) {
    assert.ok(animation.frames.length >= 5);
    assert.ok(animation.frames.every((frame) => frame.duration >= 90 && !("scale" in frame)));
    assert.ok(animation.frames.every((frame) => frame.pose !== "wake"));
    const restingPose = status === "low-high" ? "sleep" : "idle";
    assert.equal(animation.frames[0].pose, restingPose);
    assert.equal(animation.frames.at(-1).pose, restingPose);
  }
  assert.equal(getCatStatusTransition("high-low", "low-high").at(-1).pose, "sleep");
  assert.equal(getCatStatusTransition("low-high", "high-low").at(-1).pose, "idle");
  assert.ok(getCatStatusTransition("high-high", "high-low").every((frame) => frame.pose !== "wake"));
  assert.ok(getCatStatusTransition("low-high", "high-low").some((frame) => frame.pose === "wake"));
});

test("drains energy, raises sleepiness, and allows movement while energy remains", () => {
  assert.equal(PET_STAT_DECAY_MS, 300000);
  assert.deepEqual(decayPetStats(72, 24), { energy: 71, sleepiness: 25 });
  assert.deepEqual(decayPetStats(0, 100), { energy: 0, sleepiness: 100 });
  assert.deepEqual(decayPetStatsByTime(72, 24, 1_000_000, 1_900_001), { energy: 69, sleepiness: 27, statsUpdatedAt: 1_900_000 });
  assert.deepEqual(decayPetStatsByTime(72, 24, 0, 1_000_000), { energy: 72, sleepiness: 24, statsUpdatedAt: 1_000_000 });
  assert.equal(canPetMove(42), true);
  assert.equal(canPetMove(0), false);
});

test("keeps cat-bed sleep active for three hours and formats the countdown", () => {
  const now = 1_700_000_000_000;
  assert.equal(SLEEP_DURATION_MS, 10800000);
  assert.equal(getSleepRemainingMs(now + SLEEP_DURATION_MS, now), SLEEP_DURATION_MS);
  assert.equal(getSleepRemainingMs(now - 1, now), 0);
  assert.equal(formatSleepRemaining(SLEEP_DURATION_MS), "3:00:00");
  assert.equal(formatSleepRemaining(3661000), "1:01:01");
});

test("sleep interruption clears the pending reward before the wake-up animation", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const start = source.indexOf("function interruptSleep()");
  const end = source.indexOf("\n  function", start + 1);
  const interruptBody = source.slice(start, end);
  assert.match(source, /onPointerMove=\{requestSleepInterrupt\}/);
  assert.match(source, /是否要打断睡眠？/);
  assert.match(interruptBody, /sleepEndsAt: null, sleepRest: 0/);
  assert.match(interruptBody, /setWakingUp\(true\)/);
  assert.doesNotMatch(interruptBody, /sleepiness/);
  assert.match(source, /cat-orange-wake\.png[\s\S]*cat-cow-wake\.png[\s\S]*cat-white-wake\.png/);
  assert.doesNotMatch(source, /frameAdjustments|baseAdjustment/);
  assert.doesNotMatch(css, /walking-cat\.(?:resting|waking-up)[^{]*\{[^}]*\bwidth:/);
  assert.doesNotMatch(css, /@keyframes cat-rest[^\n]*\bscale:/);
  assert.doesNotMatch(css, /@keyframes cat-head-shake[^\n]*\brotate:/);
});

test("feeding a sleeping cat opens the sleep interruption confirmation", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const start = source.indexOf("function feedPet(");
  const end = source.indexOf("\n  function", start + 1);
  const feedBody = source.slice(start, end);
  assert.match(feedBody, /if \(resting\) \{[\s\S]*setOverlay\(null\);[\s\S]*setInterruptConfirm\(true\);/);
});

test("keeps every cat animation loaded and coordinates transitions", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const assets = await readdir(new URL("../public/game", import.meta.url));
  for (const cat of ["orange", "cow", "white"]) {
    assert.equal(assets.filter((name) => new RegExp(`^cat-${cat}-(?:walk-v2|groom|yawn|wake-yawn)-[1-4]\\.png$`).test(name)).length, 16);
    const fixedFrames = assets.filter((name) => new RegExp(`^cat-${cat}-(?:walk|groom)-fixed-[1-4]\\.png$`).test(name));
    assert.equal(fixedFrames.length, 8);
    for (const frame of fixedFrames) {
      const png = await readFile(new URL(`../public/game/${frame}`, import.meta.url));
      assert.equal(png.readUInt32BE(16), 418);
      assert.equal(png.readUInt32BE(20), 418);
    }
    for (const state of ["idle", "sleep", "wake"]) assert.ok(assets.includes(`cat-${cat}-${state}.png`));
  }
  assert.match(source, /animationImages\.current = frames\.map/);
  assert.match(source, /image\.decode\(\)\.catch/);
  assert.match(source, /const activePose: CatPose = resting \? "sleep"/);
  assert.match(source, /const catAsset = resting \? pet\.sleep/);
  assert.match(source, /setWalkDuration\(WALK_CYCLE_MS\)/);
  assert.match(source, /clamp\(distance \* 14, WALK_CYCLE_MS \* 2, 900\)/);
  assert.match(source, /const STATUS_IDLE_MS = 8000/);
  assert.match(source, /className=\{`cat-base cat-pose-\$\{activePose\}`\}[\s\S]*decoding="sync"/);
  assert.match(source, /const \[statusIdle, setStatusIdle\] = useState\(true\)/);
  assert.match(source, /statusIdle[\s\S]*setStatusIdle\(false\)[\s\S]*setStatusIdle\(true\)/);
  assert.match(source, /desiredCatStatus !== catStatus[\s\S]*getCatStatusTransition\(catStatus, desiredCatStatus\)/);
  assert.doesNotMatch(source, /<img className="cat-base" key=\{/);
});

test("shop discloses distinct food and cat-bed recovery values", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /补充活力 \+\{item\.energy\}/);
  assert.match(source, /困倦值 -\$\{item\.rest\}/);
  assert.match(source, /rest: 30[\s\S]*rest: 55[\s\S]*rest: 80/);
});

test("opens a two-day notebook and saves mood notes with each check-in", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const api = await readFile(new URL("../app/api/checkins/route.ts", import.meta.url), "utf8");
  const admin = await readFile(new URL("../app/admin/page.tsx", import.meta.url), "utf8");
  assert.match(source, /history\.slice\(historyPage \* 2, historyPage \* 2 \+ 2\)/);
  assert.match(css, /\.notebook-page \{[^}]*height: 430px/);
  assert.match(css, /\.notebook-entry textarea \{[^}]*height: 150px;[^}]*resize: none/);
  assert.match(source, /CHECK-IN HISTORY[\s\S]*运动手账[\s\S]*写下运动后的心情/);
  assert.match(source, /method: "PATCH"/);
  assert.match(source, /berry-workout-backup-consent[\s\S]*我知道并同意开启/);
  const releaseNotes = source.match(/<section className="release-notes"[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.match(releaseNotes, /v0\.2\.1 更新说明[\s\S]*手账[\s\S]*无面部像素草莓/);
  assert.doesNotMatch(releaseNotes, /备份/);
  assert.match(api, /access-control-allow-origin": "\*"/);
  assert.match(admin, /requireChatGPTUser\("\/admin"\)[\s\S]*OWNER_EMAIL[\s\S]*listAllCheckins/);
  assert.match(schema, /mood: text\("mood"\)/);
});

test("server-renders the full-screen game without the old movement hint", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /class="game-stage"/);
  assert.match(html, /class="game-room/);
  assert.match(html, /class="cat-base\b/);
  assert.match(html, /data-cat-status="high-low"/);
  assert.doesNotMatch(html, /class="cat-action"/);
  assert.match(html, /aria-label="游戏菜单"/);
  assert.match(html, /的困倦值/);
  assert.doesNotMatch(html, /weather-chip|天气同步中|room-help|点击地面移动/);
});
