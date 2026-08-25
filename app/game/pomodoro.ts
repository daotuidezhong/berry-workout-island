export const POMODORO_FOCUS_MS = 25 * 60_000;
export const POMODORO_BREAK_MS = 5 * 60_000;
export const POMODORO_REWARD = 5;

export type PomodoroPhase = "focus" | "break";
export type PomodoroStatus = "idle" | "running" | "paused";

export type PomodoroState = {
  phase: PomodoroPhase;
  status: PomodoroStatus;
  endsAt: number | null;
  remainingMs: number;
  totalCycles: number;
  todayCycles: number;
  todayDate: string;
  earnedBerries: number;
};

export const INITIAL_POMODORO: PomodoroState = {
  phase: "focus",
  status: "idle",
  endsAt: null,
  remainingMs: POMODORO_FOCUS_MS,
  totalCycles: 0,
  todayCycles: 0,
  todayDate: "",
  earnedBerries: 0,
};

export function normalizePomodoro(saved: Partial<PomodoroState> | undefined, today: string): PomodoroState {
  const phase = saved?.phase === "break" ? "break" : "focus";
  const status = saved?.status === "running" || saved?.status === "paused" ? saved.status : "idle";
  const duration = phase === "focus" ? POMODORO_FOCUS_MS : POMODORO_BREAK_MS;
  return {
    phase,
    status,
    endsAt: status === "running" && typeof saved?.endsAt === "number" ? saved.endsAt : null,
    remainingMs: Math.min(duration, Math.max(0, Number(saved?.remainingMs ?? duration))),
    totalCycles: Math.max(0, Math.floor(Number(saved?.totalCycles ?? 0))),
    todayCycles: saved?.todayDate === today ? Math.max(0, Math.floor(Number(saved?.todayCycles ?? 0))) : 0,
    todayDate: today,
    earnedBerries: Math.max(0, Math.floor(Number(saved?.earnedBerries ?? 0))),
  };
}

export function getPomodoroRemaining(state: PomodoroState, now = Date.now()) {
  if (state.status !== "running" || state.endsAt === null) return state.remainingMs;
  return Math.max(0, state.endsAt - now);
}

export function startPomodoro(state: PomodoroState, now = Date.now()): PomodoroState {
  if (state.status === "running") return state;
  const duration = state.phase === "focus" ? POMODORO_FOCUS_MS : POMODORO_BREAK_MS;
  const remainingMs = state.remainingMs > 0 ? state.remainingMs : duration;
  return { ...state, status: "running", endsAt: now + remainingMs, remainingMs };
}

export function pausePomodoro(state: PomodoroState, now = Date.now()): PomodoroState {
  if (state.status !== "running") return state;
  return { ...state, status: "paused", endsAt: null, remainingMs: getPomodoroRemaining(state, now) };
}

export function resetPomodoro(state: PomodoroState): PomodoroState {
  return { ...state, phase: "focus", status: "idle", endsAt: null, remainingMs: POMODORO_FOCUS_MS };
}

export function skipPomodoroBreak(state: PomodoroState): PomodoroState {
  if (state.phase !== "break") return state;
  return { ...state, phase: "focus", status: "idle", endsAt: null, remainingMs: POMODORO_FOCUS_MS };
}

export function settlePomodoro(state: PomodoroState, today: string, now = Date.now()) {
  if (state.status !== "running" || state.endsAt === null || now < state.endsAt) {
    return { state, reward: 0, event: null as "focus" | "break" | null };
  }

  if (state.phase === "break") {
    return {
      state: { ...state, phase: "focus" as const, status: "idle" as const, endsAt: null, remainingMs: POMODORO_FOCUS_MS },
      reward: 0,
      event: "break" as const,
    };
  }

  const todayCycles = state.todayDate === today ? state.todayCycles + 1 : 1;
  const breakEndsAt = state.endsAt + POMODORO_BREAK_MS;
  const breakAlreadyFinished = now >= breakEndsAt;
  return {
    state: {
      ...state,
      phase: breakAlreadyFinished ? "focus" as const : "break" as const,
      status: breakAlreadyFinished ? "idle" as const : "running" as const,
      endsAt: breakAlreadyFinished ? null : breakEndsAt,
      remainingMs: breakAlreadyFinished ? POMODORO_FOCUS_MS : breakEndsAt - now,
      totalCycles: state.totalCycles + 1,
      todayCycles,
      todayDate: today,
      earnedBerries: state.earnedBerries + POMODORO_REWARD,
    },
    reward: POMODORO_REWARD,
    event: "focus" as const,
  };
}

export function formatPomodoroTime(milliseconds: number) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
