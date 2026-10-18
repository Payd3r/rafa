import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Photo } from "../shared/types";
import { useConnection } from "../shared/hooks/useConnection";
import "./images.css";

export function SmartImage({
  photo,
  sizes = "(max-width:760px) 44vw, 42vw",
  priority = false,
  fit = "cover",
  className = "",
  viewer = false,
}: {
  photo: Photo;
  sizes?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
  className?: string;
  viewer?: boolean;
}) {
  const { constrained, online } = useConnection();
  const [visible, setVisible] = useState(priority);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (visible) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: constrained ? "80px" : "400px" },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible, constrained]);
  useEffect(() => {
    if (online) {
      setFailed(false);
      setAttempt(0);
    }
  }, [online]);
  useEffect(() => {
    if (!visible || !image.current) return;
    const element = image.current;
    let active = true;
    let firstFrame = 0;
    let secondFrame = 0;
    const reveal = async () => {
      try { await element.decode(); } catch { return; }
      if (!active) return;
      // Paint the preview before starting the fade, including cached images.
      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => { if (active) setLoaded(true); });
      });
    };
    element.addEventListener('load', reveal);
    if (element.complete && element.naturalWidth) void reveal();
    return () => {
      active = false;
      element.removeEventListener('load', reveal);
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [visible, attempt]);
  const limit = constrained ? 640 : viewer ? 1600 : 960;
  const variants = photo.variants;
  const avif = variants?.avif.filter((v) => v.width <= limit);
  const webp = variants?.webp.filter((v) => v.width <= limit);
  const candidates = [
    avif?.at(-1)?.src,
    constrained ? photo.srcSm : photo.src,
    photo.srcSm,
    webp?.at(-1)?.src,
    !variants && !constrained ? photo.originalUrl : undefined,
  ].filter(
    (url, index, array): url is string => !!url && array.indexOf(url) === index,
  );
  const src = candidates[attempt] || photo.src;
  const srcset = (items: typeof avif) =>
    items?.map((v) => `${v.src} ${v.width}w`).join(", ");
  const ratio =
    photo.ratio ||
    (photo.width && photo.height ? photo.width / photo.height : 4 / 5);
  return (
    <span
      ref={ref}
      className={`smart-image ${className} ${loaded ? "is-loaded" : ""} ${failed ? "is-failed" : ""}`}
      style={{
        aspectRatio: ratio,
        "--image-ratio": ratio,
      } as CSSProperties}
      aria-busy={!loaded && !failed}
    >
      {photo.placeholder && !failed && (
        <span className="image-preview" aria-hidden="true" style={{ backgroundImage: `url("${photo.placeholder}")`, backgroundSize: fit }} />
      )}
      {visible && !failed && (
        <picture>
          {attempt === 0 && avif?.length ? (
            <source type="image/avif" srcSet={srcset(avif)} sizes={sizes} />
          ) : null}
          {attempt === 0 && webp?.length ? (
            <source type="image/webp" srcSet={srcset(webp)} sizes={sizes} />
          ) : null}
          <img
            ref={image}
            src={src}
            srcSet={attempt === 0 && !variants ? photo.srcset : undefined}
            sizes={sizes}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "low"}
            decoding="async"
            style={{ objectFit: fit }}
            onError={() => {
              if (attempt + 1 < candidates.length) setAttempt(attempt + 1);
              else setFailed(true);
            }}
          />
        </picture>
      )}
      {viewer && !loaded && !failed && (
        <span className="viewer-image-loading" role="status" aria-label="Caricamento foto">
          <svg className="viewer-image-spinner" viewBox="0 0 32 32" aria-hidden="true">
            <circle className="spinner-track" cx="16" cy="16" r="13" />
            <path d="M16 3a13 13 0 0 1 13 13" />
          </svg>
        </span>
      )}
      {!viewer && !failed && (
        <span className="image-skeleton" aria-hidden="true" />
      )}
      {failed && (
        <span
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              event.stopPropagation();
              setFailed(false);
              setAttempt(0);
            }
          }}
          className="image-retry"
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
            setFailed(false);
            setAttempt(0);
          }}
        >
          Riprova foto
        </span>
      )}
    </span>
  );
}
