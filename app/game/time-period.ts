export type TimePeriod = "morning" | "noon" | "evening" | "night";

export function getTimePeriod(hour = new Date().getHours()): TimePeriod {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 16) return "noon";
  if (hour >= 16 && hour < 19) return "evening";
  return "night";
}
