import type { TimePeriod } from "./time-period";

export type WeatherKind = "clear" | "cloudy" | "rain" | "thunderstorm";

export const ROOM_ASSET_BY_WEATHER: Record<WeatherKind, string> = {
  clear: "/game/room-v2.png",
  cloudy: "/game/room-cloudy-v2.png",
  rain: "/game/room-rain.png",
  thunderstorm: "/game/room-thunderstorm-v2.png",
};

export function getRoomAsset(kind: WeatherKind, period: TimePeriod) {
  const isDry = kind === "clear" || kind === "cloudy";
  if (period === "morning" && isDry) return "/game/room-morning.png";
  if (period === "evening" && isDry) return "/game/room-evening.png";
  return ROOM_ASSET_BY_WEATHER[kind];
}

export function getWeatherKind(code: number, precipitation: number, cloudCover: number): WeatherKind {
  if (code >= 95) return "thunderstorm";
  if ((code >= 51 && code < 95) || precipitation > 0) return "rain";
  if ((code >= 1 && code <= 48) || cloudCover >= 45) return "cloudy";
  return "clear";
}
