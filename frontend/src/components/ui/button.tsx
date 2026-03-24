"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "border-slate-950 bg-slate-950 text-white hover:bg-slate-800",
        secondary:
          "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        subtle:
          "border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200",
        ghost: "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950",
        danger:
          "border-rose-500 bg-rose-500 text-white hover:bg-rose-600",
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
