"use client";

import { formatUSD } from "@/lib/torah";

export type ActiveLetter = {
  id: string;
  ch: string;
  name: string;
  ref: string;
  price: number;
  sold: boolean;
  premium: boolean;
  dedication?: string;
  inCart: boolean;
};

type Props = {
  active: ActiveLetter;
  pos: { x: number; y: number };
  pinned: boolean;
  onAdd: () => void;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

export function LetterPopup({ active, pos, pinned, onAdd, onClose, onMouseEnter, onMouseLeave }: Props) {
  // Clamp so the card stays on screen.
  const W = 300;
  const x = Math.min(Math.max(pos.x - W / 2, 12), (typeof window !== "undefined" ? window.innerWidth : 1200) - W - 12);
  const y = pos.y + 22;

  return (
    <div
      role="dialog"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ left: x, top: y, width: W }}
      className="fixed z-50 rounded-xl border border-amber-900/30 bg-[#fbf3dc] text-[#211405] shadow-2xl shadow-black/40"
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className="stam grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-[#e3cf9c] text-5xl text-[#211405]"
          aria-hidden
        >
          {active.ch}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-800">
            {active.ref}
          </div>
          <div className="text-lg font-semibold leading-tight">
            The letter {active.name}
            {active.premium && (
              <span className="ml-2 rounded bg-amber-700 px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase text-amber-50">
                Premium
              </span>
            )}
          </div>
          <p className="mt-1 text-xs leading-snug text-amber-900/80">
            Dedicate this very letter in the Torah scroll. Your name is inscribed with it forever.
          </p>
        </div>
        {pinned && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mt-1 -mr-1 rounded p-1 text-amber-900/60 hover:bg-amber-900/10 hover:text-amber-900"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-amber-900/15 px-4 py-3">
        {active.sold ? (
          <div className="text-sm">
            <div className="font-semibold text-rose-800">Already dedicated</div>
            <div className="text-xs italic text-amber-900/70">{active.dedication}</div>
          </div>
        ) : (
          <>
            <div className="text-xl font-bold">{formatUSD(active.price)}</div>
            {active.inCart ? (
              <span className="rounded-lg bg-emerald-700/15 px-3 py-2 text-sm font-semibold text-emerald-800">
                ✓ In cart
              </span>
            ) : (
              <button
                onClick={onAdd}
                className="rounded-lg bg-amber-800 px-4 py-2 text-sm font-semibold text-amber-50 shadow hover:bg-amber-900 active:scale-95"
              >
                Add to cart
              </button>
            )}
          </>
        )}
      </div>
      {!pinned && !active.sold && (
        <div className="px-4 pb-2 text-center text-[10px] text-amber-900/50">
          click the letter to keep this open
        </div>
      )}
    </div>
  );
}
