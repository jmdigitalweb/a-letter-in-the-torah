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
};

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
    <div ref={stageRef} className="sefer-stage">
      <div className="sefer-roller left">
        <div className="sefer-bundle left" ref={lBundle} />
        <div className="sefer-pole">
          <div className="sefer-pole-grain" ref={lGrain} />
        </div>
        <div className="sefer-cap top" />
        <div className="sefer-cap bottom" />
        <div className="sefer-finial top" />
        <div className="sefer-finial bottom" />
      </div>

      <div className="sefer-roller right">
        <div className="sefer-bundle right" ref={rBundle} />
        <div className="sefer-pole">
          <div className="sefer-pole-grain" ref={rGrain} />
        </div>
        <div className="sefer-cap top" />
        <div className="sefer-cap bottom" />
        <div className="sefer-finial top" />
        <div className="sefer-finial bottom" />
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
            variant="sefer"
          />
        </div>
      </div>

      <div className="sefer-hint">Scroll to roll the sefer →</div>
    </div>
  );
}

export const SeferStage = memo(SeferStageImpl);
