"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl border text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-slate-950 px-4 py-2.5 text-white shadow-[0_14px_40px_rgba(15,23,40,0.18)] hover:-translate-y-0.5 hover:bg-slate-800",
        secondary:
          "border-white/70 bg-white/80 px-4 py-2.5 text-slate-700 hover:-translate-y-0.5 hover:bg-white",
        subtle:
          "border-transparent bg-slate-100 px-4 py-2.5 text-slate-700 hover:bg-slate-200",
        ghost: "border-transparent px-3 py-2 text-slate-600 hover:bg-white/70 hover:text-slate-950",
        danger:
          "border-transparent bg-rose-500 px-4 py-2.5 text-white shadow-[0_14px_30px_rgba(219,71,88,0.22)] hover:bg-rose-600",
      },
      size: {
        default: "h-11",
        sm: "h-9 rounded-xl px-3 text-xs",
        lg: "h-12 rounded-2xl px-5",
        icon: "h-10 w-10 rounded-2xl",
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
