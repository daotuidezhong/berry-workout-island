import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { CAT_BOUNDS, clampCatPosition, getFurnitureTarget } from "../app/furniture.ts";
import { getTimePeriod } from "../app/time-period.ts";
import { estimateCalories } from "../app/calories.ts";
import { getRoomAsset, getWeatherKind, ROOM_ASSET_BY_WEATHER } from "../app/weather.ts";
import { getNextIdleAction } from "../app/cat-actions.ts";
import { canPetMove, decayPetStats, formatSleepRemaining, getSleepRemainingMs, PET_STAT_DECAY_MS, SLEEP_DURATION_MS } from "../app/pet-stats.ts";

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

test("only yawns below 40 sleepiness", () => {
  assert.equal(getNextIdleAction(1, 39), "yawn");
  assert.equal(getNextIdleAction(1, 40), "groom");
  assert.equal(getNextIdleAction(0, 20), "groom");
});

test("decays pet stats on a fixed cadence and blocks movement below 10 sleepiness", () => {
  assert.equal(PET_STAT_DECAY_MS, 300000);
  assert.deepEqual(decayPetStats(72, 24), { energy: 71, sleepiness: 23 });
  assert.deepEqual(decayPetStats(0, 0), { energy: 0, sleepiness: 0 });
  assert.equal(canPetMove(9), false);
  assert.equal(canPetMove(10), true);
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
  assert.match(source, /const baseAdjustment = wakingUp \? \{ scale: 1, y: 0 \}/);
  assert.doesNotMatch(css, /walking-cat\.(?:resting|waking-up)[^{]*\{[^}]*\bwidth:/);
});

test("keeps every cat animation loaded and coordinates transitions", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const assets = await readdir(new URL("../public/game", import.meta.url));
  for (const cat of ["orange", "cow", "white"]) {
    assert.equal(assets.filter((name) => new RegExp(`^cat-${cat}-(?:walk-v2|groom|yawn|wake-yawn)-[1-4]\\.png$`).test(name)).length, 16);
    for (const state of ["idle", "sleep", "wake"]) assert.ok(assets.includes(`cat-${cat}-${state}.png`));
  }
  assert.match(source, /await image\.decode\(\)/);
  assert.match(source, /!actionsReady \|\| overlay \|\| walking/);
  assert.match(source, /setWalkDuration\(WALK_CYCLE_MS\)/);
  assert.doesNotMatch(source, /<img key=\{actionAsset\}/);
});

test("shop discloses distinct food and cat-bed recovery values", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /补充活力 \+\{item\.energy\}/);
  assert.match(source, /困倦值 \+\$\{item\.rest\}/);
  assert.match(source, /rest: 30[\s\S]*rest: 55[\s\S]*rest: 80/);
});

test("opens a two-day notebook and saves mood notes with each check-in", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  assert.match(source, /history\.slice\(historyPage \* 2, historyPage \* 2 \+ 2\)/);
  assert.match(source, /CHECK-IN HISTORY[\s\S]*运动手账[\s\S]*写下运动后的心情/);
  assert.match(source, /method: "PATCH"/);
  assert.match(schema, /mood: text\("mood"\)/);
});

test("server-renders the full-screen game without the old movement hint", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /class="game-stage"/);
  assert.match(html, /class="game-room/);
  assert.match(html, /class="cat-base"/);
  assert.match(html, /class="cat-action"/);
  assert.match(html, /aria-label="游戏菜单"/);
  assert.match(html, /的困倦值/);
  assert.doesNotMatch(html, /weather-chip|天气同步中|room-help|点击地面移动/);
});
