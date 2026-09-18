"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "press inline-flex items-center justify-center gap-1.5 font-semibold whitespace-nowrap select-none disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700",
        secondary: "bg-grey-100 text-grey-800 hover:bg-grey-200 active:bg-grey-300",
        outline:
          "border border-grey-300 bg-white text-grey-800 hover:bg-grey-50 active:bg-grey-100",
        ghost: "bg-transparent text-grey-700 hover:bg-grey-100 active:bg-grey-200",
        danger: "bg-danger text-white hover:brightness-95 active:brightness-90",
      },
      size: {
        sm: "h-9 rounded-sm px-3 text-[13px]",
        md: "h-11 rounded-md px-4 text-[15px]",
        lg: "h-13 rounded-lg px-5 text-[17px]",
      },
      full: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, full, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size, full }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
