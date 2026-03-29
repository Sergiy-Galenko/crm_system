"use client";

import Image from "next/image";
import { Expand } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function ChatImageLightbox({
  src,
  alt,
  className,
  imageClassName,
  aspectClassName,
}: {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  aspectClassName?: string;
}) {
  const { t } = useLocale();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={t("Open image fullscreen")}
          className={cn(
            "group relative block w-full cursor-zoom-in overflow-hidden rounded-[1.25rem] border border-black/5 bg-white/40 text-left transition hover:scale-[1.01]",
            className,
          )}
        >
          <Image
            src={src}
            alt={alt}
            width={1400}
            height={1000}
            unoptimized
            className={cn("w-full object-cover transition duration-300 group-hover:scale-[1.015]", aspectClassName, imageClassName)}
          />
          <span className="pointer-events-none absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/72 text-white opacity-0 shadow-lg transition group-hover:opacity-100">
            <Expand className="h-4 w-4" />
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] overflow-visible border-transparent bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <DialogDescription className="sr-only">{t("Open image fullscreen")}</DialogDescription>
        <div className="flex max-h-[calc(100vh-1rem)] min-h-[20rem] items-center justify-center rounded-[2rem] bg-slate-950/92 p-3 shadow-[0_30px_80px_rgba(15,23,42,0.45)] sm:p-4">
          <Image
            src={src}
            alt={alt}
            width={1800}
            height={1400}
            unoptimized
            className="max-h-[calc(100vh-7rem)] w-auto max-w-full rounded-[1.5rem] object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
