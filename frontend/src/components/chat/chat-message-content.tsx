"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tokenPattern = /((https?:\/\/|www\.)[^\s<]+|@[a-z0-9_]{3,24})/gi;

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

function renderLine(line: string, tone: "incoming" | "outgoing", mentionableNicknames: Set<string>) {
  const segments: ReactNode[] = [];
  let lastIndex = 0;

  line.replace(tokenPattern, (match, _group, _prefix, offset: number) => {
    if (offset > lastIndex) {
      segments.push(line.slice(lastIndex, offset));
    }

    if (match.startsWith("@")) {
      const nickname = match.slice(1).toLowerCase();

      if (mentionableNicknames.has(nickname)) {
        segments.push(
          <span
            key={`${match}:${offset}`}
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 font-medium",
              tone === "outgoing"
                ? "bg-black/10 text-[var(--ui-brand-foreground)]"
                : "bg-[color-mix(in_srgb,var(--ui-ring)_65%,transparent)] text-[var(--ui-text-strong)]",
            )}
          >
            {match}
          </span>,
        );
        lastIndex = offset + match.length;
        return match;
      }

      segments.push(match);
      lastIndex = offset + match.length;
      return match;
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
  mentionableUsers = [],
}: {
  body: string;
  tone: "incoming" | "outgoing";
  mentionableUsers?: Array<{ nickname?: string | null }>;
}) {
  const lines = body.split("\n");
  const mentionableNicknames = new Set(
    mentionableUsers
      .map((user) => user.nickname?.toLowerCase())
      .filter((nickname): nickname is string => Boolean(nickname)),
  );

  return (
    <p className="whitespace-pre-wrap break-words px-1">
      {lines.map((line, index) => (
        <span key={`${line}:${index}`}>
          {index > 0 ? <br /> : null}
          {renderLine(line, tone, mentionableNicknames)}
        </span>
      ))}
    </p>
  );
}
