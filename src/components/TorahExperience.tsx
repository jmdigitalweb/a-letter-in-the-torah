"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Parsha, isSpace, letterInfo, letterName } from "@/lib/torah";
import { Scroll, Variant } from "./Scroll";
import { SeferStage } from "./SeferStage";
import { LetterPopup, ActiveLetter } from "./LetterPopup";
import { CartDrawer, CartItem } from "./CartDrawer";

export function TorahExperience({
  parshiyot,
  variant = "classic",
}: {
  parshiyot: Parsha[];
  variant?: Variant;
}) {
  const realistic = variant === "realistic";
  const photo = variant === "photo";
  const seferReal = variant === "sefer-real";
  const sefer = variant === "sefer" || seferReal;
  const [parshaId, setParshaId] = useState(parshiyot[0].id);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [active, setActive] = useState<ActiveLetter | null>(null);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeElRef = useRef<HTMLElement | null>(null);

  const parsha = useMemo(
    () => parshiyot.find((p) => p.id === parshaId)!,
    [parshiyot, parshaId]
  );

  const firstLetterId = useMemo(() => {
    for (const v of parsha.verses)
      for (const l of v.letters) if (!isSpace(l)) return l.id;
    return "";
  }, [parsha]);

  const cartIds = useMemo(() => new Set(cart.map((i) => i.id)), [cart]);

  const highlight = useCallback((el: HTMLElement | null) => {
    if (activeElRef.current && activeElRef.current !== el)
      activeElRef.current.removeAttribute("data-active");
    if (el) el.setAttribute("data-active", "true");
    activeElRef.current = el;
  }, []);

  const buildActive = useCallback(
    (el: HTMLElement): ActiveLetter => {
      const id = el.dataset.id!;
      const ch = el.dataset.ch!;
      const ref = el.dataset.ref!;
      const info = letterInfo(id, id === firstLetterId);
      return {
        id,
        ch,
        ref,
        name: letterName(ch),
        price: info.price,
        sold: info.sold,
        premium: info.premium,
        dedication: info.dedication,
        inCart: cartIds.has(id),
      };
    },
    [firstLetterId, cartIds]
  );

  const clearClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };

  const close = useCallback(() => {
    clearClose();
    setActive(null);
    setPinned(false);
    highlight(null);
  }, [highlight]);

  const onOver = useCallback(
    (e: React.MouseEvent) => {
      if (pinned) return;
      const el = (e.target as HTMLElement).closest<HTMLElement>(".letter");
      if (!el) return;
      clearClose();
      setPos({ x: e.clientX, y: e.clientY });
      setActive(buildActive(el));
      highlight(el);
    },
    [pinned, buildActive, highlight]
  );

  const onOut = useCallback(
    (e: React.MouseEvent) => {
      if (pinned) return;
      const to = e.relatedTarget as HTMLElement | null;
      if (to && to.closest && to.closest(".letter")) return; // moved to another letter
      clearClose();
      closeTimer.current = setTimeout(() => close(), 120);
    },
    [pinned, close]
  );

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>(".letter");
      if (!el) {
        if (pinned) close();
        return;
      }
      const a = buildActive(el);
      if (a.sold) return;
      clearClose();
      setPos({ x: e.clientX, y: e.clientY });
      setActive(a);
      setPinned(true);
      highlight(el);
    },
    [pinned, close, buildActive, highlight]
  );

  const addToCart = useCallback(() => {
    if (!active || active.sold || active.inCart) return;
    setCart((c) => [...c, { id: active.id, ch: active.ch, name: active.name, ref: active.ref, price: active.price }]);
    setActive((a) => (a ? { ...a, inCart: true } : a));
  }, [active]);

  const removeFromCart = useCallback((id: string) => {
    setCart((c) => c.filter((i) => i.id !== id));
    setActive((a) => (a && a.id === id ? { ...a, inCart: false } : a));
  }, []);

  // Switching parsha resets the popup.
  useEffect(() => {
    close();
  }, [parshaId, close]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        setCartOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const total = cart.reduce((s, i) => s + i.price, 0);

  return (
    <div className={`${seferReal ? "sefer-bg-real" : sefer ? "sefer-bg" : photo ? "parchment-photo" : realistic ? "parchment-real" : "parchment"} flex h-screen flex-col`}>
      <header className="z-30 flex items-center gap-2 border-b border-amber-900/25 bg-[#d8c089]/80 px-3 py-3 backdrop-blur sm:gap-4 sm:px-6">
        <div className="mr-auto min-w-0">
          <h1 className="truncate text-base font-bold leading-none text-amber-950 sm:text-xl">
            A Letter in the Torah
          </h1>
          <p className="truncate text-[11px] text-amber-900/70 sm:text-xs">
            <span className="hidden sm:inline">Hover</span>
            <span className="sm:hidden">Tap</span> any letter • {parsha.letterCount.toLocaleString()} letters
          </p>
        </div>

        <div className="hidden overflow-hidden rounded-lg border border-amber-900/30 text-xs font-semibold sm:flex">
          <Link
            href="/crowned"
            className={`px-3 py-2 ${variant === "classic" ? "bg-amber-800 text-amber-50" : "bg-[#fbf3dc] text-amber-900 hover:bg-amber-100"}`}
          >
            Crowned
          </Link>
          <Link
            href="/realistic"
            className={`border-l border-amber-900/30 px-3 py-2 ${realistic ? "bg-amber-800 text-amber-50" : "bg-[#fbf3dc] text-amber-900 hover:bg-amber-100"}`}
          >
            Clean hand
          </Link>
          <Link
            href="/v3"
            className={`border-l border-amber-900/30 px-3 py-2 ${photo ? "bg-amber-800 text-amber-50" : "bg-[#fbf3dc] text-amber-900 hover:bg-amber-100"}`}
          >
            Real klaf
          </Link>
          <Link
            href="/"
            className={`border-l border-amber-900/30 px-3 py-2 ${variant === "sefer" ? "bg-amber-800 text-amber-50" : "bg-[#fbf3dc] text-amber-900 hover:bg-amber-100"}`}
          >
            Sefer
          </Link>
          <Link
            href="/v4"
            className={`border-l border-amber-900/30 px-3 py-2 ${seferReal ? "bg-amber-800 text-amber-50" : "bg-[#fbf3dc] text-amber-900 hover:bg-amber-100"}`}
          >
            Sefer HD
          </Link>
        </div>

        <label className="flex shrink items-center gap-2 text-sm">
          <span className="hidden text-amber-900/80 sm:inline">Portion</span>
          <select
            value={parshaId}
            onChange={(e) => setParshaId(e.target.value)}
            className="max-w-[34vw] truncate rounded-lg border border-amber-900/30 bg-[#fbf3dc] px-2 py-2 text-xs font-semibold text-amber-950 shadow-sm outline-none sm:max-w-none sm:px-3 sm:text-sm"
          >
            {parshiyot.map((p) => (
              <option key={p.id} value={p.id}>
                {p.en} — {p.he}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={() => setCartOpen(true)}
          className="relative shrink-0 rounded-lg bg-amber-800 px-3 py-2 text-sm font-semibold text-amber-50 shadow hover:bg-amber-900 sm:px-4"
        >
          Cart
          {cart.length > 0 && (
            <span className="ml-2 rounded-full bg-amber-50 px-1.5 py-0.5 text-xs font-bold text-amber-900">
              {cart.length}
            </span>
          )}
        </button>
      </header>

      {sefer ? (
        <main className="relative flex-1 overflow-hidden">
          <SeferStage
            parsha={parsha}
            firstLetterId={firstLetterId}
            cartIds={cartIds}
            onOver={onOver}
            onOut={onOut}
            onClick={onClick}
            onScroll={close}
            real={seferReal}
          />
          {cart.length > 0 && (
            <div className="pointer-events-none absolute bottom-4 right-4 z-20">
              <span className="pointer-events-auto rounded-full bg-amber-950/90 px-4 py-2 text-sm font-semibold text-amber-50 shadow-lg">
                {cart.length} letter{cart.length > 1 ? "s" : ""} · {total.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
              </span>
            </div>
          )}
        </main>
      ) : (
        <main className="scroll-area relative flex-1 overflow-y-auto px-4 py-8 sm:px-8 sm:py-12">
          <div
            className={`mx-auto max-w-3xl rounded-md px-6 py-10 sm:px-12 ${
              photo
                ? "klaf-photo shadow-[0_2px_44px_rgba(50,32,6,0.35)] ring-1 ring-amber-950/25"
                : realistic
                  ? "bg-[#e2cd9a]/30 shadow-[0_2px_40px_rgba(60,40,10,0.25)] ring-1 ring-amber-950/15"
                  : "bg-[#e9d9af]/50 ring-1 ring-amber-900/10"
            }`}
            onMouseOver={onOver}
            onMouseOut={onOut}
            onClick={onClick}
          >
            <Scroll parsha={parsha} firstLetterId={firstLetterId} cartIds={cartIds} variant={variant} />
          </div>
          {cart.length > 0 && (
            <div className="pointer-events-none sticky bottom-4 mt-6 flex justify-center">
              <span className="pointer-events-auto rounded-full bg-amber-950/90 px-4 py-2 text-sm font-semibold text-amber-50 shadow-lg">
                {cart.length} letter{cart.length > 1 ? "s" : ""} · {total.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
              </span>
            </div>
          )}
        </main>
      )}

      {active && (
        <LetterPopup
          active={active}
          pos={pos}
          pinned={pinned}
          onAdd={addToCart}
          onClose={close}
          onMouseEnter={clearClose}
          onMouseLeave={() => {
            if (!pinned) closeTimer.current = setTimeout(() => close(), 120);
          }}
        />
      )}

      <CartDrawer open={cartOpen} items={cart} onClose={() => setCartOpen(false)} onRemove={removeFromCart} />
    </div>
  );
}
