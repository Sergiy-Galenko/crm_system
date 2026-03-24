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
  className,
}: {
  name: string;
  color?: string | null;
  className?: string;
}) {
  return (
    <Avatar className={cn("flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl", className)}>
      <AvatarFallback
        className="flex h-full w-full items-center justify-center text-xs font-semibold text-white"
        style={{ background: color ?? "#2154FF" }}
      >
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
