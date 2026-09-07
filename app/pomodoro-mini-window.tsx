"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { formatPomodoroTime, type PomodoroState } from "./game/pomodoro";

type Props = {
  state: PomodoroState;
  remaining: number;
  progress: number;
  onToggle: () => void;
  onReset: () => void;
  onSkip: () => void;
  onReturn: () => void;
};

export type PomodoroMiniSnapshot = Pick<Props, "state" | "remaining" | "progress">;

export function PomodoroClockFace({ state, remaining, progress, onToggle }: PomodoroMiniSnapshot & { onToggle: () => void }) {
  const running = state.status === "running";
  return <div
    className={`pomodoro-dial ${running ? "is-running" : ""}`}
    role="button"
    tabIndex={0}
    aria-label={running ? "暂停橙子专注钟" : "开始橙子专注钟"}
    title={running ? "点击暂停" : "点击开始"}
    onClick={onToggle}
    onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onToggle();
      }
    }}
  >
    <div className="pomodoro-progress-shell" style={{ "--pomodoro-progress": `${progress * 360}deg` } as CSSProperties}>
      <div className="pomodoro-dial-face">
        <span className="pomodoro-phase-label">{state.phase === "focus" ? "专注时间" : "莓果休息站"}</span>
        <img className="pomodoro-orange-mark" src="/game/pomodoro-orange.png" alt="" draggable={false} />
        <strong>{formatPomodoroTime(remaining)}</strong>
        <small>{running ? "计时中" : state.status === "paused" ? "已暂停" : "准备开始"}</small>
      </div>
    </div>
  </div>;
}

export default function PomodoroMiniWindow(props: Props) {
  const [target, setTarget] = useState<Window | null>(null);
  const [notice, setNotice] = useState("");
  const windowRef = useRef<Window | null>(null);
  const opening = useRef(false);

  useEffect(() => () => { windowRef.current?.close(); }, []);

  useEffect(() => {
    let disposed = false;
    const mountChild = (child: Window, fallback = false) => {
      if (disposed) { child.close(); return; }
      child.document.title = "OH · 橙子专注钟";
      const base = child.document.createElement("base");
      base.href = document.baseURI;
      child.document.head.append(base);
      const copyStyles = () => {
        child.document.head.querySelectorAll("[data-pomodoro-style]").forEach((node) => node.remove());
        document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
          const clone = node.cloneNode(true) as HTMLElement;
          clone.setAttribute("data-pomodoro-style", "");
          child.document.head.append(clone);
        });
      };
      copyStyles();
      const observer = new MutationObserver(copyStyles);
      observer.observe(document.head, { subtree: true, childList: true, characterData: true });
      child.document.body.className = "pomodoro-mini-body";
      windowRef.current = child;
      setTarget(child);
      setNotice(fallback ? "已打开独立计时小窗；内置浏览器无法保证始终置顶。" : "");
      child.addEventListener("pagehide", () => {
        observer.disconnect();
        if (windowRef.current === child) { windowRef.current = null; setTarget(null); }
      }, { once: true });
    };
    const open = () => {
      if (opening.current) return;
      if (windowRef.current && !windowRef.current.closed) {
        windowRef.current.focus();
        return;
      }
      const pip = (window as Window & {
        documentPictureInPicture?: { requestWindow: (options: { width: number; height: number }) => Promise<Window> };
      }).documentPictureInPicture;
      const left = Math.max(0, window.screenX + window.outerWidth - 240);
      const top = Math.max(0, window.screenY + 56);
      const fallbackChild = window.open("", "oh-pomodoro-mini", `popup=yes,width=220,height=255,left=${left},top=${top},resizable=yes`);
      if (!pip) {
        if (fallbackChild) mountChild(fallbackChild, true);
        else setNotice("浏览器拦截了小窗，请允许此页面打开弹出式窗口后再试。");
        return;
      }
      opening.current = true;
      let settled = false;
      const fallbackTimer = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        opening.current = false;
        if (fallbackChild) mountChild(fallbackChild, true);
        else setNotice("小窗未能打开，请改用新版 Chrome 或 Edge 打开此页面。");
      }, 900);
      void pip.requestWindow({ width: 210, height: 235 }).then((child) => {
        if (settled) { child.close(); return; }
        settled = true;
        window.clearTimeout(fallbackTimer);
        fallbackChild?.close();
        mountChild(child);
      }).catch(() => {
        if (settled) return;
        settled = true;
        window.clearTimeout(fallbackTimer);
        if (fallbackChild) mountChild(fallbackChild, true);
        else if (!disposed) setNotice("小窗未能打开，请再次点击“小窗模式”，或在 Chrome / Edge 中打开此页面。");
      }).finally(() => {
        if (settled) opening.current = false;
      });
    };
    window.addEventListener("oh:pomodoro-mini", open);
    return () => { disposed = true; window.removeEventListener("oh:pomodoro-mini", open); };
  }, []);

  return <>
    {target && <div className="pomodoro-mini-notice" role="status">置顶小窗已打开，可拖到屏幕旁边。<button onClick={() => { props.onReturn(); target.close(); }}>收回小窗</button></div>}
    {notice && <div className="pomodoro-mini-notice" role="status">{notice}<button onClick={() => setNotice("")}>知道了</button></div>}
    {target && createPortal(<main className={`pomodoro-mini phase-${props.state.phase}`}>
      <section className="pomodoro-clock-card">
        <PomodoroClockFace state={props.state} remaining={props.remaining} progress={props.progress} onToggle={props.onToggle} />
      </section>
    </main>, target.document.body)}
  </>;
}
