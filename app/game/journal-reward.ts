const JOURNAL_REWARDS = [6, 8, 10] as const;

export function getJournalReward(recordNumber: number) {
  return JOURNAL_REWARDS[Math.round(recordNumber) - 1] ?? 0;
}
