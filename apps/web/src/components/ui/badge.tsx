import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-xs px-2 py-0.5 text-caption font-semibold",
  {
    variants: {
      variant: {
        default: "bg-grey-100 text-grey-700",
        brand: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
        success: "bg-safe-bg text-safe-text",
        warning: "bg-caution-bg text-caution-text",
        danger: "bg-danger-bg text-danger",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
