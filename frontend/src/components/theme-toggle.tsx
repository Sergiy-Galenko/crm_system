"use client";

import * as React from "react";
import { MoonStar, SunMedium } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { t } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const title = !mounted ? t("Toggle theme") : theme === "dark" ? t("Switch to light theme") : t("Switch to dark theme");

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      onClick={toggleTheme}
      aria-label={t("Toggle theme")}
      title={title}
    >
      <span className="relative h-4 w-4">
        <SunMedium className="theme-toggle-icon theme-toggle-icon-light absolute inset-0 h-4 w-4" />
        <MoonStar className="theme-toggle-icon theme-toggle-icon-dark absolute inset-0 h-4 w-4" />
      </span>
      <span className="sr-only">{t("Toggle theme")}</span>
    </Button>
  );
}
