import type { TimePeriod } from "./time-period";
import type { SceneId } from "./scene";

export type WeatherKind = "clear" | "cloudy" | "rain" | "thunderstorm";

export const ROOM_ASSET_BY_WEATHER: Record<WeatherKind, Record<TimePeriod, string>> = {
  clear: {
    morning: "/game/room-v070-clear-morning.png",
    noon: "/game/room-v070-clear-noon.png",
    evening: "/game/room-v060-clear-evening.png",
    night: "/game/room-v070-clear-night.png",
  },
  cloudy: {
    morning: "/game/room-v060-cloudy-morning.png",
    noon: "/game/room-v060-cloudy-noon.png",
    evening: "/game/room-v060-cloudy-evening.png",
    night: "/game/room-v060-cloudy-night.png",
  },
  rain: {
    morning: "/game/room-v060-rain-morning.png",
    noon: "/game/room-v060-rain-noon.png",
    evening: "/game/room-v060-rain-evening.png",
    night: "/game/room-v070-rain-night.png",
  },
  thunderstorm: {
    morning: "/game/room-v060-thunderstorm-morning.png",
    noon: "/game/room-v060-thunderstorm-noon.png",
    evening: "/game/room-v060-thunderstorm-evening.png",
    night: "/game/room-v060-thunderstorm-night.png",
  },
};

export function getRoomAsset(kind: WeatherKind, period: TimePeriod) {
  return ROOM_ASSET_BY_WEATHER[kind][period];
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
