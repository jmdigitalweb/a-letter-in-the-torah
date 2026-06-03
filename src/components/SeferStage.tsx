"use client";

import { memo, useCallback, useEffect, useLayoutEffect, useRef } from "react";
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

const BUNDLE_BASE = 28; // px — bare pole roll
const BUNDLE_RANGE = 118; // px — added width when fully wound

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

  const paint = useCallback(() => {
    const st = s.current;
    if (stripRef.current)
      stripRef.current.style.transform = `translate3d(${st.cur}px,0,0)`;
    const frac = st.max > 0 ? st.cur / st.max : 0;
    // Reading forward winds the right roller fat, unwinds the left.
    if (rBundle.current)
      rBundle.current.style.width = `${BUNDLE_BASE + frac * BUNDLE_RANGE}px`;
    if (lBundle.current)
      lBundle.current.style.width = `${BUNDLE_BASE + (1 - frac) * BUNDLE_RANGE}px`;
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
  }, [ensureRaf, onScroll]);

  return (
    <div ref={stageRef} className={`sefer-stage${real ? " sefer-stage--real" : ""}`}>
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

      <div className="sefer-hint">Scroll to roll the sefer →</div>
    </div>
  );
}

export const SeferStage = memo(SeferStageImpl);
