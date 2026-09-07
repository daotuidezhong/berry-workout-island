import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { INITIAL_POMODORO } from "../app/game/pomodoro";
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
  startResize: (point: { x: number; y: number }) => void;
  moveResize: (point: { x: number; y: number }) => void;
  endResize: () => void;
};

const getMiniBridge = () => (window as Window & { gameUpdater?: { pomodoroMini?: MiniBridge } }).gameUpdater?.pomodoroMini;

function DesktopPomodoroMini() {
  const [snapshot, setSnapshot] = useState(initialSnapshot);

  useEffect(() => getMiniBridge()?.onState(setSnapshot), []);

  return <main className={`pomodoro-mini desktop-pomodoro-mini phase-${snapshot.state.phase}`}>
    <section className="pomodoro-clock-card">
      <span
        className="pomodoro-drag-handle"
        aria-hidden="true"
        title="拖动小窗"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          getMiniBridge()?.startDrag({ x: event.screenX, y: event.screenY });
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
          if ((event.buttons & 1) === 0) {
            event.currentTarget.releasePointerCapture(event.pointerId);
            getMiniBridge()?.endDrag();
            return;
          }
          getMiniBridge()?.moveDrag({ x: event.screenX, y: event.screenY });
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
          getMiniBridge()?.endDrag();
        }}
        onPointerCancel={() => getMiniBridge()?.endDrag()}
        onLostPointerCapture={() => getMiniBridge()?.endDrag()}
      />
      <PomodoroClockFace {...snapshot} onToggle={() => getMiniBridge()?.action(snapshot.state.status === "running" ? "pause" : "start")} />
      <span
        className="pomodoro-resize-handle"
        aria-hidden="true"
        title="调整小窗大小"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          getMiniBridge()?.startResize({ x: event.screenX, y: event.screenY });
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
          if ((event.buttons & 1) === 0) {
            event.currentTarget.releasePointerCapture(event.pointerId);
            getMiniBridge()?.endResize();
            return;
          }
          getMiniBridge()?.moveResize({ x: event.screenX, y: event.screenY });
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
          getMiniBridge()?.endResize();
        }}
        onPointerCancel={() => getMiniBridge()?.endResize()}
        onLostPointerCapture={() => getMiniBridge()?.endResize()}
      />
    </section>
  </main>;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode><DesktopPomodoroMini /></React.StrictMode>,
);
