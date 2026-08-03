export type WeatherKind = "clear" | "cloudy" | "rain" | "thunderstorm";

export function getWeatherKind(code: number, precipitation: number, cloudCover: number): WeatherKind {
  if (code >= 95) return "thunderstorm";
  if ((code >= 51 && code < 95) || precipitation > 0) return "rain";
  if ((code >= 1 && code <= 48) || cloudCover >= 45) return "cloudy";
  return "clear";
}
