import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  getPomodoroRemaining,
  INITIAL_POMODORO,
  POMODORO_BREAK_MS,
  POMODORO_FOCUS_MS,
} from "../app/game/pomodoro";
import { PomodoroClockFace, type PomodoroMiniSnapshot } from "../app/pomodoro-mini-window";
import "../app/globals.css";

const initialSnapshot: PomodoroMiniSnapshot = {
  state: INITIAL_POMODORO,
  remaining: INITIAL_POMODORO.remainingMs,
  progress: 1,
};

type MiniBridge = {
  onState: (callback: (snapshot: PomodoroMiniSnapshot) => void) => () => void;
  action: (action: "start" | "pause") => void;
  startDrag: (point: { x: number; y: number }) => void;
  moveDrag: (point: { x: number; y: number }) => void;
  endDrag: () => void;
};

const getMiniBridge = () => (window as Window & { gameUpdater?: { pomodoroMini?: MiniBridge } }).gameUpdater?.pomodoroMini;

function DesktopPomodoroMini() {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [dragging, setDragging] = useState(false);

  useEffect(() => getMiniBridge()?.onState(setSnapshot), []);

  useEffect(() => {
    if (snapshot.state.status !== "running" || snapshot.state.endsAt === null) return;
    const updateRemaining = () => {
      setSnapshot((current) => {
        if (current.state.status !== "running" || current.state.endsAt === null) return current;
        const remaining = getPomodoroRemaining(current.state, Date.now());
        const duration = current.state.phase === "focus" ? POMODORO_FOCUS_MS : POMODORO_BREAK_MS;
        return { ...current, remaining, progress: Math.min(1, Math.max(0, remaining / duration)) };
      });
    };
    updateRemaining();
    const timer = window.setInterval(updateRemaining, 250);
    window.addEventListener("focus", updateRemaining);
    document.addEventListener("visibilitychange", updateRemaining);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", updateRemaining);
      document.removeEventListener("visibilitychange", updateRemaining);
    };
  }, [snapshot.state.endsAt, snapshot.state.phase, snapshot.state.status]);

  return <main className={`pomodoro-mini desktop-pomodoro-mini phase-${snapshot.state.phase} ${dragging ? "is-dragging" : ""}`}>
    <section className="pomodoro-clock-card">
      <span
        className="pomodoro-drag-handle"
        aria-hidden="true"
        title="拖动小窗"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
          getMiniBridge()?.startDrag({ x: event.screenX, y: event.screenY });
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
          if ((event.buttons & 1) === 0) {
            event.currentTarget.releasePointerCapture(event.pointerId);
            setDragging(false);
            getMiniBridge()?.endDrag();
            return;
          }
          getMiniBridge()?.moveDrag({ x: event.screenX, y: event.screenY });
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
          setDragging(false);
          getMiniBridge()?.endDrag();
        }}
        onPointerCancel={() => { setDragging(false); getMiniBridge()?.endDrag(); }}
        onLostPointerCapture={() => { setDragging(false); getMiniBridge()?.endDrag(); }}
      />
      <PomodoroClockFace {...snapshot} onToggle={() => getMiniBridge()?.action(snapshot.state.status === "running" ? "pause" : "start")} />
    </section>
  </main>;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode><DesktopPomodoroMini /></React.StrictMode>,
);
