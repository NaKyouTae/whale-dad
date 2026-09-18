"use client";

import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import type { BossChannelGrade } from "@whale-dad/shared";
import { cn } from "@/lib/utils";
import { GRADE_DESCRIPTION, GRADE_LABEL, GRADE_STYLE } from "@/lib/boss";

const GRADES: BossChannelGrade[] = ["SAFE", "CAUTION", "DANGER", "SPAWNED", "UNKNOWN"];

/** 등급 기준표를 info 아이콘 옆 레이어로 띄운다 */
export function GradeLegend() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="등급 기준 보기"
        aria-expanded={open}
        title="등급 기준"
        className={cn(
          "press flex size-9 items-center justify-center rounded-sm border",
          open
            ? "border-brand-300 bg-brand-50 text-brand-600 dark:border-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
            : "border-grey-200 bg-white text-grey-600 hover:bg-grey-50",
        )}
      >
        <Info size={16} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="등급 기준"
          className="absolute top-11 right-0 z-50 w-[min(260px,calc(100vw-2rem))] rounded-lg border border-grey-200 bg-white p-4 shadow-float"
        >
          <p className="text-heading text-grey-900">등급 기준</p>
          <p className="mt-0.5 text-caption text-grey-500">처치 후 3시간이 지나면 출현해요.</p>

          <ul className="mt-3 flex flex-col gap-2">
            {GRADES.map((grade) => (
              <li key={grade} className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className={cn("size-5 shrink-0 rounded-xs border", GRADE_STYLE[grade].swatch)}
                />
                <span className="w-12 shrink-0 text-caption font-bold text-grey-800">
                  {GRADE_LABEL[grade]}
                </span>
                <span className="text-caption text-grey-500">{GRADE_DESCRIPTION[grade]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
