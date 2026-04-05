"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn, initials } from "@/lib/utils";

export const Avatar = AvatarPrimitive.Root;
export const AvatarImage = AvatarPrimitive.Image;
export const AvatarFallback = AvatarPrimitive.Fallback;

export function UserAvatar({
  name,
  color,
  imageUrl,
  className,
  imageClassName,
}: {
  name: string;
  color?: string | null;
  imageUrl?: string | null;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <Avatar className={cn("flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl", className)}>
      {imageUrl ? (
        <AvatarImage
          src={imageUrl}
          alt={name}
          className={cn("h-full w-full bg-[var(--ui-surface-muted)] object-contain p-2", imageClassName)}
          referrerPolicy="no-referrer"
        />
      ) : null}
      <AvatarFallback
        className="flex h-full w-full items-center justify-center text-xs font-semibold text-white"
        style={{ background: color ?? "#2154FF" }}
      >
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
