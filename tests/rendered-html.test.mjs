import assert from "node:assert/strict";
import test from "node:test";
import { getFurnitureTarget } from "../app/furniture.ts";
import { getTimePeriod } from "../app/time-period.ts";

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

test("uses furniture height to choose walking or jumping", () => {
  assert.deepEqual(getFurnitureTarget({ x: 48, y: 78 }, 0), { x: 48, y: 78, jumping: false, onTop: true });
  assert.deepEqual(getFurnitureTarget({ x: 61, y: 77 }, 8), { x: 61, y: 69, jumping: true, onTop: true });
  assert.deepEqual(getFurnitureTarget({ x: 86, y: 62 }, null), { x: 92, y: 62, jumping: false, onTop: false });
});

test("server-renders the full-screen game without the old movement hint", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /class="game-stage"/);
  assert.match(html, /class="game-room/);
  assert.match(html, /aria-label="游戏菜单"/);
  assert.doesNotMatch(html, /room-help|点击地面移动/);
});
