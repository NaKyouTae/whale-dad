"use client";

import type { BossChannelGrade } from "@whale-dad/shared";
import { cn } from "@/lib/utils";
import { GRADES, GRADE_SHORT_LABEL, GRADE_STYLE } from "@/lib/boss";

/** 등급별 채널 수. `total` 은 전체(비어 있는 미확인 포함) */
export type GradeCounts = Record<BossChannelGrade, number> & { total: number };

/**
 * 서브 타이틀 밑에 붙는 작은 통계 줄 — "전체 232 · 안전 12 · … · 미확인 200".
 * 필터 칩에도 같은 수를 쓰므로 계산은 호출부에서 한 번만 한다.
 */
export function GradeStats({ counts }: { counts: GradeCounts }) {
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] leading-4 text-grey-500">
      <span className="font-semibold text-grey-700">전체 {counts.total}</span>

      {GRADES.map((grade) => (
        <span key={grade} className="flex items-center gap-1">
          <span aria-hidden className="text-grey-300">
            ·
          </span>
          <span
            aria-hidden
            className={cn("size-2 rounded-[2px] border", GRADE_STYLE[grade].swatch)}
          />
          <span className={cn("font-semibold", GRADE_STYLE[grade].label)}>
            {GRADE_SHORT_LABEL[grade]} {counts[grade]}
          </span>
        </span>
      ))}
    </p>
  );
}
