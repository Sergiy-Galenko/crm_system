import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em]",
  {
    variants: {
      variant: {
        default: "border-[var(--ui-badge-default-border)] bg-[var(--ui-badge-default-bg)] text-[var(--ui-badge-default-text)]",
        info: "border-[var(--ui-badge-info-border)] bg-[var(--ui-badge-info-bg)] text-[var(--ui-badge-info-text)]",
        success: "border-[var(--ui-badge-success-border)] bg-[var(--ui-badge-success-bg)] text-[var(--ui-badge-success-text)]",
        warning: "border-[var(--ui-badge-warning-border)] bg-[var(--ui-badge-warning-bg)] text-[var(--ui-badge-warning-text)]",
        danger: "border-[var(--ui-badge-danger-border)] bg-[var(--ui-badge-danger-bg)] text-[var(--ui-badge-danger-text)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
