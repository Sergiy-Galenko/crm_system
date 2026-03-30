"use client";

import { cn } from "@/lib/utils";
import type { ChatBackgroundPreference } from "./chat-types";

function buildSolidBackground(color?: string | null) {
  return {
    background: `
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--ui-surface-solid) 26%, transparent) 0%,
        color-mix(in srgb, var(--ui-background-canvas) 52%, transparent) 100%
      ),
      ${color ?? "#CBD5E1"}
    `,
  };
}

function buildGradientBackground() {
  return {
    background: `
      linear-gradient(
        145deg,
        color-mix(in srgb, var(--ui-background-canvas) 70%, #dbeafe 30%) 0%,
        color-mix(in srgb, var(--ui-surface-solid) 68%, #c4b5fd 32%) 52%,
        color-mix(in srgb, var(--ui-background-canvas) 74%, #bfdbfe 26%) 100%
      )
    `,
  };
}

export function ChatBackgroundLayer({
  preference,
  className,
}: {
  preference: ChatBackgroundPreference;
  className?: string;
}) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      {preference.type === "IMAGE" && preference.imageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preference.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--ui-surface-solid)_38%,transparent),color-mix(in_srgb,var(--ui-background-canvas)_46%,transparent))]" />
          <div className="absolute inset-0 backdrop-blur-[1.5px]" />
        </>
      ) : preference.type === "SOLID" ? (
        <div className="absolute inset-0" style={buildSolidBackground(preference.color)} />
      ) : preference.type === "GRADIENT" ? (
        <>
          <div className="absolute inset-0" style={buildGradientBackground()} />
          <div className="absolute -right-20 top-10 h-64 w-64 rounded-full bg-[color-mix(in_srgb,var(--ui-brand)_10%,transparent)] blur-3xl" />
          <div className="absolute bottom-0 left-[-4rem] h-72 w-72 rounded-full bg-[color-mix(in_srgb,#14b8a6_14%,transparent)] blur-3xl" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--ui-surface-solid)_24%,transparent),color-mix(in_srgb,var(--ui-background-canvas)_58%,transparent))]" />
          <div className="absolute -left-16 top-8 h-64 w-64 rounded-full bg-[color-mix(in_srgb,#60a5fa_18%,transparent)] blur-3xl" />
          <div className="absolute right-[-3rem] top-20 h-72 w-72 rounded-full bg-[color-mix(in_srgb,#c4b5fd_18%,transparent)] blur-3xl" />
          <div className="absolute bottom-[-5rem] left-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-[color-mix(in_srgb,#14b8a6_12%,transparent)] blur-3xl" />
          <div className="absolute inset-x-12 top-14 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--ui-border-strong)_76%,transparent),transparent)]" />
          <div className="absolute inset-x-24 top-28 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--ui-border)_74%,transparent),transparent)]" />
        </>
      )}
    </div>
  );
}
