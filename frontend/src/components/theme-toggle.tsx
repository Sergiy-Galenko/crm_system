"use client";

import { Check, Monitor, MoonStar, Palette, SunMedium } from "lucide-react";
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
import { ACCENT_PRESETS, type AccentColor, type ThemePreference } from "@/lib/theme";

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
  const { theme, resolvedTheme, accent, setTheme, setAccent } = useTheme();
  const CurrentThemeIcon = theme === "system" ? Monitor : resolvedTheme === "dark" ? MoonStar : SunMedium;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="secondary" size="icon" aria-label={t("Appearance")} title={t("Appearance")}>
          <CurrentThemeIcon className="h-4 w-4" />
          <span className="sr-only">{t("Appearance")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[20rem] rounded-2xl p-2">
        {/* Theme section */}
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

        {/* Accent colour section */}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-3.5 w-3.5 text-[var(--ui-text-muted)]" />
          {t("Accent color")}
        </DropdownMenuLabel>
        <div className="grid grid-cols-4 gap-2 px-2 py-2">
          {ACCENT_PRESETS.map((preset) => {
            const active = preset.id === accent;

            return (
              <button
                key={preset.id}
                type="button"
                aria-label={t(preset.label)}
                title={t(preset.label)}
                className={cn(
                  "group relative flex flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 transition-all",
                  active
                    ? "bg-[var(--ui-surface-active)] ring-2 ring-[var(--ui-brand)]"
                    : "hover:bg-[var(--ui-surface-hover)]",
                )}
                onClick={() => setAccent(preset.id as AccentColor)}
              >
                <span
                  className={cn(
                    "relative h-7 w-7 rounded-full border-2 transition-transform duration-200",
                    active
                      ? "scale-110 border-white shadow-[0_0_12px_var(--ui-ring)]"
                      : "border-transparent group-hover:scale-105",
                  )}
                  style={{ background: preset.swatch }}
                >
                  {active ? (
                    <Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
                  ) : null}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-medium leading-none transition-colors",
                    active ? "text-[var(--ui-text-strong)]" : "text-[var(--ui-text-soft)]",
                  )}
                >
                  {t(preset.label)}
                </span>
              </button>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
