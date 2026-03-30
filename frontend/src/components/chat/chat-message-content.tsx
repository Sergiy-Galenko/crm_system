"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const urlPattern = /((https?:\/\/|www\.)[^\s<]+)/gi;

function splitTrailingPunctuation(value: string) {
  const match = value.match(/[),.!?:;]+$/);

  if (!match) {
    return {
      cleanUrl: value,
      trailing: "",
    };
  }

  return {
    cleanUrl: value.slice(0, -match[0].length),
    trailing: match[0],
  };
}

function normalizeHref(value: string) {
  return value.startsWith("www.") ? `https://${value}` : value;
}

function renderLine(line: string, tone: "incoming" | "outgoing") {
  const segments: ReactNode[] = [];
  let lastIndex = 0;

  line.replace(urlPattern, (match, _group, _prefix, offset: number) => {
    if (offset > lastIndex) {
      segments.push(line.slice(lastIndex, offset));
    }

    const { cleanUrl, trailing } = splitTrailingPunctuation(match);

    segments.push(
      <a
        key={`${cleanUrl}:${offset}`}
        href={normalizeHref(cleanUrl)}
        target="_blank"
        rel="noreferrer noopener"
        className={cn(
          "break-all underline decoration-current/40 underline-offset-4 transition hover:decoration-current",
          tone === "outgoing"
            ? "text-[var(--ui-brand-foreground)]/95"
            : "text-sky-600 hover:text-sky-700",
        )}
      >
        {cleanUrl}
      </a>,
    );

    if (trailing) {
      segments.push(trailing);
    }

    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < line.length) {
    segments.push(line.slice(lastIndex));
  }

  return segments.length ? segments : [line];
}

export function ChatMessageContent({
  body,
  tone,
}: {
  body: string;
  tone: "incoming" | "outgoing";
}) {
  const lines = body.split("\n");

  return (
    <p className="whitespace-pre-wrap break-words px-1">
      {lines.map((line, index) => (
        <span key={`${line}:${index}`}>
          {index > 0 ? <br /> : null}
          {renderLine(line, tone)}
        </span>
      ))}
    </p>
  );
}
