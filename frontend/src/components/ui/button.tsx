"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border text-sm font-medium transition-[background-color,border-color,color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ui-background-canvas)] disabled:pointer-events-none disabled:opacity-55",
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-[var(--ui-brand)] text-[var(--ui-brand-foreground)] shadow-[var(--ui-shadow-xs)] hover:bg-[var(--ui-brand-hover)]",
        secondary:
          "border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] text-[var(--ui-text)] shadow-[var(--ui-shadow-xs)] hover:border-[var(--ui-border-strong)] hover:bg-[var(--ui-surface-hover)]",
        subtle:
          "border-transparent bg-[var(--ui-surface-soft)] text-[var(--ui-text)] hover:bg-[var(--ui-surface-hover)]",
        ghost: "border-transparent text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-muted)] hover:text-[var(--ui-text-strong)]",
        danger:
          "border-transparent bg-[var(--ui-danger)] text-white shadow-[var(--ui-shadow-xs)] hover:bg-[var(--ui-danger-hover)]",
      },
      size: {
        default: "h-11 px-4 text-sm",
        sm: "h-9 px-3.5 text-sm",
        lg: "h-12 px-5 text-[15px]",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);

Button.displayName = "Button";
