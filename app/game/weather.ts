import type { TimePeriod } from "./time-period";
import type { SceneId } from "./scene";

export type WeatherKind = "clear" | "cloudy" | "rain" | "thunderstorm";

export const ROOM_ASSET_BY_WEATHER: Record<WeatherKind, string> = {
  clear: "/game/room-kitchen-v3.png",
  cloudy: "/game/room-kitchen-cloudy.png",
  rain: "/game/room-kitchen-rain.png",
  thunderstorm: "/game/room-kitchen-thunderstorm.png",
};

export function getRoomAsset(kind: WeatherKind, period: TimePeriod) {
  if (period === "morning" && kind === "clear") return "/game/room-kitchen-morning.png";
  if (period === "evening" && kind === "clear") return "/game/room-kitchen-evening.png";
  return ROOM_ASSET_BY_WEATHER[kind];
}

export function getYardAsset(kind: WeatherKind, period: TimePeriod) {
  return `/game/yard-${kind}-${period}.png`;
}

export function getSceneAsset(scene: SceneId, kind: WeatherKind, period: TimePeriod) {
  return scene === "room" ? getRoomAsset(kind, period) : getYardAsset(kind, period);
}

export function getWeatherKind(code: number, precipitation: number, cloudCover: number): WeatherKind {
  if (code >= 95) return "thunderstorm";
  if ((code >= 51 && code < 95) || precipitation > 0) return "rain";
  if ((code >= 1 && code <= 48) || cloudCover >= 45) return "cloudy";
  return "clear";
}
