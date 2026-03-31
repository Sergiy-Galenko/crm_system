"use client";

import { Check, Monitor, MoonStar, SunMedium } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ThemePreference } from "@/lib/theme";

const themeOptions: Array<{
  value: ThemePreference;
  label: string;
  description: string;
  icon: typeof SunMedium;
}> = [
  {
    value: "light",
    label: "Light",
    description: "Always use the light interface",
    icon: SunMedium,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Always use the dark interface",
    icon: MoonStar,
  },
  {
    value: "system",
    label: "System",
    description: "Use your device preference",
    icon: Monitor,
  },
];

export function ThemeToggle() {
  const { t } = useLocale();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const CurrentThemeIcon = theme === "system" ? Monitor : resolvedTheme === "dark" ? MoonStar : SunMedium;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="secondary" size="icon" aria-label={t("Theme")} title={t("Theme")}>
          <CurrentThemeIcon className="h-4 w-4" />
          <span className="sr-only">{t("Theme")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[18rem] rounded-2xl p-2">
        <DropdownMenuLabel>{t("Theme")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themeOptions.map((option) => {
          const active = option.value === theme;
          const OptionIcon = option.icon;

          return (
            <DropdownMenuItem
              key={option.value}
              className="items-start gap-3 rounded-xl px-3 py-3"
              onSelect={(event) => {
                event.preventDefault();
                setTheme(option.value);
              }}
            >
              <span
                className={cn(
                  "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition",
                  active
                    ? "border-transparent bg-[var(--ui-brand)] text-[var(--ui-brand-foreground)] shadow-[var(--ui-shadow-xs)]"
                    : "border-[var(--ui-border)] bg-[var(--ui-surface-muted)] text-[var(--ui-text-muted)]",
                )}
              >
                <OptionIcon className="h-4 w-4" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-semibold text-[var(--ui-text-strong)]">{t(option.label)}</span>
                <span className="mt-0.5 text-xs leading-5 text-[var(--ui-text-muted)]">{t(option.description)}</span>
              </span>
              <Check className={cn("mt-1 h-4 w-4 shrink-0 text-[var(--ui-brand)]", active ? "opacity-100" : "opacity-0")} />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
