export type IdleAction = "groom" | "yawn";

export function getNextIdleAction(cycle: number, sleepiness: number): IdleAction {
  return cycle % 2 === 1 && sleepiness < 40 ? "yawn" : "groom";
}
