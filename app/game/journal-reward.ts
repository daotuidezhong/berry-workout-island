const JOURNAL_REWARDS = [10, 15, 18] as const;

export function getJournalReward(recordNumber: number) {
  return JOURNAL_REWARDS[Math.round(recordNumber) - 1] ?? 0;
}
