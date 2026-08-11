export function getJournalReward(rating: number) {
  return Math.min(23, 3 + Math.max(1, Math.min(10, Math.round(rating))) * 2);
}
