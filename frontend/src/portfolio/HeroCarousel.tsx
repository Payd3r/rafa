import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Photo } from "../shared/types";
import { SmartImage } from "./SmartImage";

export function HeroCarousel({ photos, mobile, onOpen }: {
  photos: Photo[];
  mobile: boolean;
  onOpen: (index: number) => void;
}) {
  const [frame, setFrame] = useState(0);
  const [width, setWidth] = useState(0);
  const [offset, setOffset] = useState(0);
  const [settling, setSettling] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ id: number; x: number; y: number; moved: boolean; horizontal: boolean } | null>(null);
  const suppressClick = useRef(false);
  const step = width * (mobile ? 0.76 : 0.23);
  // The central image is wider: its neighbours need a different centre distance.
  // 26% + four 17% images + four 1.5% gaps fill the desktop strip exactly.
  const desktopPosition = (position: number) => {
    const distance = Math.abs(position);
    return Math.sign(position) * (Math.min(distance, 1) * 0.23 + Math.max(0, distance - 1) * 0.185) * width;
  };
  const count = photos.length;
  const wrap = (value: number) => (value % count + count) % count;

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(0, entry.contentRect.width - (mobile ? 0 : 24))));
    observer.observe(element);
    return () => observer.disconnect();
  }, [mobile]);

  useEffect(() => {
    if (!settling) return;
    const direction = offset === 0 ? 0 : offset < 0 ? 1 : -1;
    const timer = window.setTimeout(() => {
      setFrame(current => (current + direction + count) % count);
      setOffset(0);
      setSettling(false);
    }, 240);
    return () => window.clearTimeout(timer);
  }, [settling, offset, count]);

  const advance = (direction: number) => {
    if (settling || count < 2) return;
    setOffset(-direction * step);
    setSettling(true);
  };

  return (
    <div
      ref={root}
      className={`hero-gallery interactive-gallery${mobile ? " is-mobile" : ""}${settling ? " is-settling" : ""}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured photographs"
      tabIndex={0}
      onKeyDown={event => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        event.preventDefault();
        advance(event.key === "ArrowRight" ? 1 : -1);
      }}
      onDragStart={event => event.preventDefault()}
      onClickCapture={event => {
        if (suppressClick.current) {
          event.preventDefault();
          event.stopPropagation();
          suppressClick.current = false;
        }
      }}
      onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0 || settling || count < 2) return;
        suppressClick.current = false;
        gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false, horizontal: false };
      }}
      onPointerMove={event => {
        const active = gesture.current;
        if (!active || active.id !== event.pointerId) return;
        const dx = event.clientX - active.x;
        const dy = event.clientY - active.y;
        if (!active.moved && Math.max(Math.abs(dx), Math.abs(dy)) > 7) {
          active.moved = true;
          active.horizontal = Math.abs(dx) > Math.abs(dy);
          suppressClick.current = true;
          if (active.horizontal) {
            event.currentTarget.setPointerCapture(event.pointerId);
            event.currentTarget.classList.add("is-dragging");
          }
        }
        if (active.horizontal) setOffset(Math.max(-step, Math.min(step, dx)));
      }}
      onPointerUp={event => {
        const active = gesture.current;
        if (!active || active.id !== event.pointerId) return;
        gesture.current = null;
        event.currentTarget.classList.remove("is-dragging");
        if (!active.horizontal) return;
        const dx = event.clientX - active.x;
        setOffset(Math.abs(dx) > Math.min(60, step * 0.2) ? (dx < 0 ? -step : step) : 0);
        setSettling(true);
      }}
      onPointerCancel={() => {
        gesture.current = null;
        root.current?.classList.remove("is-dragging");
        setOffset(0);
        setSettling(true);
      }}
      onLostPointerCapture={event => {
        if (event.target !== event.currentTarget || !gesture.current) return;
        gesture.current = null;
        root.current?.classList.remove("is-dragging");
        setOffset(0);
        setSettling(true);
      }}
    >
      {Array.from({ length: mobile ? 5 : 7 }, (_, i) => i - (mobile ? 2 : 3)).map(slot => {
        const photoIndex = wrap(frame + slot);
        const position = slot + (step ? offset / step : 0);
        const distance = Math.min(2, Math.abs(position));
        return (
          <button
            className="hero-shot"
            key={slot}
            tabIndex={slot === 0 ? 0 : -1}
            aria-hidden={Math.abs(slot) > (mobile ? 1 : 2) || undefined}
            aria-label={`Open featured photograph ${photoIndex + 1} of ${count}`}
            onClick={() => onOpen(photoIndex)}
            style={{
              "--shot-x": `${mobile ? slot * step + offset : desktopPosition(position)}px`,
              "--shot-width": mobile ? "72%" : `${width * (0.26 - Math.min(1, distance) * 0.09)}px`,
              "--shot-height": `${100 - distance * (mobile ? 12 : 10)}%`,
            } as CSSProperties}
          >
            <SmartImage photo={photos[photoIndex]} priority={slot === 0} sizes="(max-width:760px) 72vw, 26vw" />
            {!mobile && Math.abs(slot) === 2 && <span aria-hidden="true" className={`hero-decoration corner-${slot < 0 ? "left" : "right"}`} />}
            {!mobile && Math.abs(slot) === 1 && <span aria-hidden="true" className={`hero-decoration line-${slot < 0 ? "left" : "right"}`} />}
            <span className="shot-number">{String(photoIndex + 1).padStart(2, "0")}</span>
          </button>
        );
      })}
      {mobile && (
        <div className="hero-mobile-inserts" aria-hidden="true">
          <span className="hero-insert-line hero-insert-top" />
          <span className="hero-insert-line hero-insert-bottom" />
        </div>
      )}
    </div>
  );
}
