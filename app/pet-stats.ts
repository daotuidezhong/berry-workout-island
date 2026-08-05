export const PET_STAT_DECAY_MS = 5 * 60 * 1000;
export const SLEEP_DURATION_MS = 3 * 60 * 60 * 1000;

export function decayPetStats(energy: number, sleepiness: number) {
  return {
    energy: Math.max(0, energy - 1),
    sleepiness: Math.min(100, sleepiness + 1),
  };
}

export function canPetMove(energy: number) {
  return energy > 0;
}

export function getSleepRemainingMs(sleepEndsAt: number | null, now = Date.now()) {
  return Math.max(0, (sleepEndsAt ?? 0) - now);
}

export function formatSleepRemaining(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
