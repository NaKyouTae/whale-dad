"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/** 토스 스타일 입력 — 라벨이 위에, 보더는 얇게, 포커스 시 브랜드 컬러 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-caption font-medium text-grey-600">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            "h-13 w-full rounded-md border bg-white px-4 text-body text-grey-900 outline-none",
            "placeholder:text-grey-400",
            "transition-colors duration-150",
            error ? "border-danger focus:border-danger" : "border-grey-200 focus:border-brand-500",
            "disabled:bg-grey-50 disabled:text-grey-400",
            className,
          )}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-caption text-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
