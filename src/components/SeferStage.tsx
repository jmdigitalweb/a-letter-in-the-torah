"use client";

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Parsha } from "@/lib/torah";
import { Scroll } from "./Scroll";

type Props = {
  parsha: Parsha;
  firstLetterId: string;
  cartIds: Set<string>;
  onOver: (e: React.MouseEvent) => void;
  onOut: (e: React.MouseEvent) => void;
  onClick: (e: React.MouseEvent) => void;
  onScroll?: () => void;
  real?: boolean;
};

/* A lathe-turned wooden finial (the handle that caps each etz chaim).
   The silhouette is an SVG baluster; a horizontal gradient fakes the
   roundness of the turned wood, with darker grooves at the necks. */
function SeferFinial({ side }: { side: "top" | "bottom" }) {
  const gid = `fin-${side}`;
  return (
    <svg
      className={`sefer-finial-svg ${side}`}
      viewBox="0 0 60 172"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#34200d" />
          <stop offset="0.16" stopColor="#6f4421" />
          <stop offset="0.36" stopColor="#a8743f" />
          <stop offset="0.5" stopColor="#c89a5f" />
          <stop offset="0.64" stopColor="#9c6736" />
          <stop offset="0.84" stopColor="#5b3617" />
          <stop offset="1" stopColor="#2c1a0a" />
        </linearGradient>
      </defs>
      {/* baluster profile: pointed tip at top, neck at bottom into the cap */}
      <path
        fill={`url(#${gid})`}
        d="M30 4
           C34 6 35 12 35 18
           C40 20 41 28 36 33
           C39 36 39 44 35 47
           C33 49 33 51 35 53
           C44 60 45 82 35 95
           C39 99 40 108 34 113
           C32 116 32 120 34 124
           C30 132 30 150 30 168
           C30 150 30 132 26 124
           C28 120 28 116 26 113
           C20 108 21 99 25 95
           C15 82 16 60 25 53
           C27 51 27 49 25 47
           C21 44 21 36 24 33
           C19 28 20 20 25 18
           C25 12 26 6 30 4 Z"
      />
      {/* groove shadows at the necks */}
      <g fill="rgba(30,18,5,0.5)">
        <ellipse cx="30" cy="33" rx="11" ry="2.4" />
        <ellipse cx="30" cy="50" rx="9" ry="2" />
        <ellipse cx="30" cy="95" rx="11" ry="3" />
        <ellipse cx="30" cy="113" rx="8" ry="2.2" />
      </g>
      {/* highlight running down the lit side of the turned wood */}
      <path
        d="M22 18 C18 40 17 78 22 110 C20 78 21 40 22 18 Z"
        fill="rgba(255,244,222,0.32)"
      />
    </svg>
  );
}

// Roll thickness, narrower on small screens so it never crowds the klaf.
function bundleDims() {
  const narrow = typeof window !== "undefined" && window.innerWidth < 640;
  return narrow ? { base: 14, range: 52 } : { base: 28, range: 118 };
}

const ZOOM_MIN = 0.6;
const ZOOM_MAX = 2.4;
const ZOOM_STEP = 1.2;
const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));

function SeferStageImpl({
  parsha,
  firstLetterId,
  cartIds,
  onOver,
  onOut,
  onClick,
  onScroll,
  real = false,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const lBundle = useRef<HTMLDivElement>(null);
  const rBundle = useRef<HTMLDivElement>(null);
  const lGrain = useRef<HTMLDivElement>(null);
  const rGrain = useRef<HTMLDivElement>(null);

  // All scroll motion lives in a ref so wheel ticks never re-render the spans.
  const s = useRef({ cur: 0, target: 0, max: 0, raf: 0 });

  // Zoom (font scale). State drives the CSS var; ref keeps gesture handlers cheap.
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  const keepFrac = useRef<number | null>(null);

  const paint = useCallback(() => {
    const st = s.current;
    if (stripRef.current)
      stripRef.current.style.transform = `translate3d(${st.cur}px,0,0)`;
    const frac = st.max > 0 ? st.cur / st.max : 0;
    const { base, range } = bundleDims();
    // Reading forward winds the right roller fat, unwinds the left.
    if (rBundle.current)
      rBundle.current.style.width = `${base + frac * range}px`;
    if (lBundle.current)
      lBundle.current.style.width = `${base + (1 - frac) * range}px`;
    if (rGrain.current)
      rGrain.current.style.backgroundPositionX = `${st.cur * 0.7}px`;
    if (lGrain.current)
      lGrain.current.style.backgroundPositionX = `${-st.cur * 0.7}px`;
  }, []);

  const tick = useCallback(() => {
    const st = s.current;
    const d = st.target - st.cur;
    if (Math.abs(d) < 0.5) {
      st.cur = st.target;
      paint();
      st.raf = 0;
      return;
    }
    st.cur += d * 0.18;
    paint();
    st.raf = requestAnimationFrame(tick);
  }, [paint]);

  const ensureRaf = useCallback(() => {
    if (!s.current.raf) s.current.raf = requestAnimationFrame(tick);
  }, [tick]);

  const measure = useCallback(() => {
    const strip = stripRef.current;
    const win = windowRef.current;
    if (!strip || !win) return;
    const letters = strip.querySelectorAll<HTMLElement>(".letter");
    if (!letters.length) {
      s.current.max = 0;
    } else {
      const first = letters[0];
      const last = letters[letters.length - 1];
      const contentRight = first.offsetLeft + first.offsetWidth;
      const contentLeft = last.offsetLeft;
      const contentW = contentRight - contentLeft;
      s.current.max = Math.max(0, contentW - win.clientWidth + 90);
    }
    s.current.target = Math.min(s.current.target, s.current.max);
    s.current.cur = Math.min(s.current.cur, s.current.max);
    paint();
  }, [paint]);

  // Change zoom while keeping the same reading position in the scroll.
  const applyZoom = useCallback((next: number) => {
    const z = clampZoom(next);
    if (z === zoomRef.current) return;
    const st = s.current;
    keepFrac.current = st.max > 0 ? st.cur / st.max : 0;
    zoomRef.current = z;
    setZoom(z);
  }, []);

  // After a zoom re-flows the text, re-measure and restore the position.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      measure();
      const frac = keepFrac.current;
      if (frac != null) {
        s.current.cur = frac * s.current.max;
        s.current.target = s.current.cur;
        keepFrac.current = null;
        paint();
      }
    });
    return () => cancelAnimationFrame(id);
  }, [zoom, measure, paint]);

  // Reset + re-measure when the portion changes (also after the webfont swaps in).
  useLayoutEffect(() => {
    s.current.cur = 0;
    s.current.target = 0;
    measure();
    const t = setTimeout(measure, 350);
    return () => clearTimeout(t);
  }, [parsha, measure]);

  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measure]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (e: WheelEvent) => {
      // Ctrl / ⌘ + wheel (and trackpad pinch, which arrives as ctrl+wheel) zooms.
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        applyZoom(zoomRef.current * (e.deltaY < 0 ? 1.06 : 1 / 1.06));
        return;
      }
      const dom =
        Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (dom === 0) return;
      e.preventDefault();
      const st = s.current;
      st.target = Math.max(0, Math.min(st.max, st.target + dom));
      ensureRaf();
      onScroll?.();
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [ensureRaf, onScroll, applyZoom]);

  // Touch: one finger drags to roll the scroll, two fingers pinch to zoom.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let mode: "none" | "drag" | "pinch" = "none";
    let startX = 0;
    let startTarget = 0;
    let pinchDist = 0;
    let pinchZoom = 1;
    let zRaf = 0;
    let pendingZoom = 0;

    const dist = (t: TouchList) => {
      const dx = t[0].clientX - t[1].clientX;
      const dy = t[0].clientY - t[1].clientY;
      return Math.hypot(dx, dy);
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        mode = "pinch";
        pinchDist = dist(e.touches);
        pinchZoom = zoomRef.current;
      } else if (e.touches.length === 1) {
        mode = "drag";
        startX = e.touches[0].clientX;
        startTarget = s.current.target;
      }
    };
    const onMove = (e: TouchEvent) => {
      if (mode === "pinch" && e.touches.length >= 2) {
        e.preventDefault();
        const factor = dist(e.touches) / (pinchDist || 1);
        pendingZoom = clampZoom(pinchZoom * factor);
        if (!zRaf)
          zRaf = requestAnimationFrame(() => {
            zRaf = 0;
            applyZoom(pendingZoom);
          });
      } else if (mode === "drag" && e.touches.length === 1) {
        e.preventDefault();
        const dx = e.touches[0].clientX - startX;
        const st = s.current;
        st.target = Math.max(0, Math.min(st.max, startTarget - dx * 1.4));
        ensureRaf();
        onScroll?.();
      }
    };
    const onEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) mode = "none";
      else if (e.touches.length === 1) {
        mode = "drag";
        startX = e.touches[0].clientX;
        startTarget = s.current.target;
      }
    };

    stage.addEventListener("touchstart", onStart, { passive: false });
    stage.addEventListener("touchmove", onMove, { passive: false });
    stage.addEventListener("touchend", onEnd);
    stage.addEventListener("touchcancel", onEnd);
    return () => {
      stage.removeEventListener("touchstart", onStart);
      stage.removeEventListener("touchmove", onMove);
      stage.removeEventListener("touchend", onEnd);
      stage.removeEventListener("touchcancel", onEnd);
      if (zRaf) cancelAnimationFrame(zRaf);
    };
  }, [ensureRaf, onScroll, applyZoom]);

  return (
    <div
      ref={stageRef}
      className={`sefer-stage${real ? " sefer-stage--real" : ""}`}
      style={{ ["--sz" as string]: zoom }}
    >
      <div className="sefer-roller left">
        <div className="sefer-bundle left" ref={lBundle} />
        <div className="sefer-pole">
          <div className="sefer-pole-grain" ref={lGrain} />
        </div>
        <div className="sefer-cap top" />
        <div className="sefer-cap bottom" />
        {real ? (
          <>
            <SeferFinial side="top" />
            <SeferFinial side="bottom" />
          </>
        ) : (
          <>
            <div className="sefer-finial top" />
            <div className="sefer-finial bottom" />
          </>
        )}
      </div>

      <div className="sefer-roller right">
        <div className="sefer-bundle right" ref={rBundle} />
        <div className="sefer-pole">
          <div className="sefer-pole-grain" ref={rGrain} />
        </div>
        <div className="sefer-cap top" />
        <div className="sefer-cap bottom" />
        {real ? (
          <>
            <SeferFinial side="top" />
            <SeferFinial side="bottom" />
          </>
        ) : (
          <>
            <div className="sefer-finial top" />
            <div className="sefer-finial bottom" />
          </>
        )}
      </div>

      <div
        ref={windowRef}
        className="sefer-window"
        onMouseOver={onOver}
        onMouseOut={onOut}
        onClick={onClick}
      >
        <div ref={stripRef} className="sefer-strip">
          <Scroll
            parsha={parsha}
            firstLetterId={firstLetterId}
            cartIds={cartIds}
            variant={real ? "sefer-real" : "sefer"}
          />
        </div>
      </div>

      <div className="sefer-zoom">
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => applyZoom(zoomRef.current / ZOOM_STEP)}
          disabled={zoom <= ZOOM_MIN + 0.001}
        >
          −
        </button>
        <button
          type="button"
          aria-label="Reset zoom"
          className="sefer-zoom-reset"
          onClick={() => applyZoom(1)}
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => applyZoom(zoomRef.current * ZOOM_STEP)}
          disabled={zoom >= ZOOM_MAX - 0.001}
        >
          +
        </button>
      </div>

      <div className="sefer-hint">
        <span className="sefer-hint-desktop">Scroll to roll • ⌘/Ctrl-scroll to zoom</span>
        <span className="sefer-hint-touch">Drag to roll • pinch to zoom</span>
      </div>
    </div>
  );
}

export const SeferStage = memo(SeferStageImpl);
