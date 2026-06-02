"use client";

import { formatUSD } from "@/lib/torah";

export type CartItem = {
  id: string;
  ch: string;
  name: string;
  ref: string;
  price: number;
};

type Props = {
  open: boolean;
  items: CartItem[];
  onClose: () => void;
  onRemove: (id: string) => void;
};

export function CartDrawer({ open, items, onClose, onRemove }: Props) {
  const total = items.reduce((s, i) => s + i.price, 0);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-[min(92vw,380px)] flex-col bg-[#fbf3dc] text-[#211405] shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-amber-900/20 px-5 py-4">
          <h2 className="text-lg font-bold">Your dedicated letters</h2>
          <button onClick={onClose} aria-label="Close cart" className="rounded p-1 hover:bg-amber-900/10">
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {items.length === 0 ? (
            <p className="mt-10 text-center text-sm text-amber-900/60">
              No letters yet. Hover the scroll and choose a letter to dedicate.
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((i) => (
                <li
                  key={i.id}
                  className="flex items-center gap-3 rounded-lg border border-amber-900/15 bg-[#f3e7c6] p-2"
                >
                  <span className="stam grid h-11 w-11 shrink-0 place-items-center rounded bg-[#e3cf9c] text-3xl">
                    {i.ch}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{i.name}</div>
                    <div className="text-xs text-amber-900/70">{i.ref}</div>
                  </div>
                  <div className="text-sm font-bold">{formatUSD(i.price)}</div>
                  <button
                    onClick={() => onRemove(i.id)}
                    aria-label="Remove"
                    className="rounded p-1 text-amber-900/50 hover:bg-amber-900/10 hover:text-rose-700"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="border-t border-amber-900/20 px-5 py-4">
          <div className="mb-3 flex items-center justify-between text-base">
            <span className="font-semibold">Total</span>
            <span className="font-bold">{formatUSD(total)}</span>
          </div>
          <button
            disabled={items.length === 0}
            className="w-full rounded-lg bg-amber-800 py-3 font-semibold text-amber-50 shadow hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => alert("Checkout is mocked in this prototype.")}
          >
            Checkout
          </button>
        </footer>
      </aside>
    </>
  );
}
