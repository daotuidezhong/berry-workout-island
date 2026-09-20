import { useEffect, useRef } from "react";

type Props = { viewportRef: React.RefObject<HTMLDivElement | null> };

export default function PhotoBoardScrollbar({ viewportRef }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLButtonElement>(null);
  const dragging = useRef<{ pointerX: number; thumbX: number } | null>(null);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!viewport || !track || !thumb) return;
    const sync = () => {
      if (frame.current !== null) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
        const trackWidth = track.clientWidth;
        const width = maxScroll ? Math.max(42, trackWidth * viewport.clientWidth / viewport.scrollWidth) : trackWidth;
        const travel = Math.max(0, trackWidth - width);
        thumb.style.width = `${width}px`;
        thumb.style.transform = `translateX(${maxScroll ? viewport.scrollLeft / maxScroll * travel : 0}px)`;
        track.dataset.disabled = maxScroll ? "false" : "true";
      });
    };
    sync();
    viewport.addEventListener("scroll", sync, { passive: true });
    const observer = new ResizeObserver(sync);
    observer.observe(viewport);
    if (viewport.firstElementChild) observer.observe(viewport.firstElementChild);
    return () => { viewport.removeEventListener("scroll", sync); observer.disconnect(); if (frame.current !== null) cancelAnimationFrame(frame.current); };
  }, [viewportRef]);

  const scrollFromPointer = (clientX: number, direct = false, smooth = false) => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!viewport || !track || !thumb) return;
    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    const travel = track.clientWidth - thumb.offsetWidth;
    if (maxScroll <= 0 || travel <= 0) return;
    const trackLeft = track.getBoundingClientRect().left;
    const raw = direct ? clientX - trackLeft - thumb.offsetWidth / 2 : (dragging.current?.thumbX ?? 0) + clientX - (dragging.current?.pointerX ?? clientX);
    const left = Math.max(0, Math.min(travel, raw)) / travel * maxScroll;
    if (smooth) viewport.scrollTo({ left, behavior: "smooth" });
    else viewport.scrollLeft = left;
  };

  return <div ref={trackRef} className="photo-board-scrollbar" onPointerDown={(event) => { if (event.target === event.currentTarget) scrollFromPointer(event.clientX, true, true); }}>
    <button ref={thumbRef} type="button" aria-label="拖动浏览照片板" onPointerDown={(event) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      const transform = new DOMMatrixReadOnly(getComputedStyle(event.currentTarget).transform);
      dragging.current = { pointerX: event.clientX, thumbX: transform.m41 };
    }} onPointerMove={(event) => { if (dragging.current && event.currentTarget.hasPointerCapture(event.pointerId)) scrollFromPointer(event.clientX); }} onPointerUp={(event) => { dragging.current = null; event.currentTarget.releasePointerCapture(event.pointerId); }} />
  </div>;
}
