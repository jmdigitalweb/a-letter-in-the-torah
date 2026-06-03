"use client";

import { memo } from "react";
import { Parsha, isSpace, letterInfo } from "@/lib/torah";

export type Variant = "classic" | "realistic" | "photo" | "sefer" | "sefer-real";

type Props = {
  parsha: Parsha;
  firstLetterId: string;
  cartIds: Set<string>;
  variant: Variant;
};

function ScrollImpl({ parsha, firstLetterId, cartIds, variant }: Props) {
  const nodes: React.ReactNode[] = [];

  parsha.verses.forEach((v, vi) => {
    if (vi > 0) nodes.push(" "); // space between verses
    v.letters.forEach((l, li) => {
      if (isSpace(l)) {
        nodes.push(" ");
        return;
      }
      const info = letterInfo(l.id, l.id === firstLetterId);
      const state = info.sold ? "sold" : cartIds.has(l.id) ? "incart" : "available";
      nodes.push(
        <span
          key={l.id}
          className="letter"
          data-id={l.id}
          data-ch={l.ch}
          data-ref={`${parsha.book} ${v.ref}`}
          data-state={state}
        >
          {l.ch}
        </span>
      );
    });
  });

  const cls =
    variant === "sefer" || variant === "sefer-real"
      ? "stam-shlomo sefer-columns select-none"
      : variant === "photo"
        ? "stam-shlomo select-none"
        : variant === "realistic"
          ? "stam-shlomo klaf-lines select-none"
          : "stam select-none text-[clamp(1.6rem,3.4vw,2.9rem)] text-[var(--ink)]";

  return <div className={cls}>{nodes}</div>;
}

export const Scroll = memo(ScrollImpl);
