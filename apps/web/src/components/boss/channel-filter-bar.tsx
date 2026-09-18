"use client";

import { Search, X } from "lucide-react";
import type { BossChannelGrade } from "@whale-dad/shared";
import { cn } from "@/lib/utils";
import { GRADES, GRADE_SHORT_LABEL, GRADE_STYLE } from "@/lib/boss";
import type { GradeCounts } from "./grade-stats";

/** "전체" 를 포함한 필터 값 */
export type GradeFilter = BossChannelGrade | "ALL";

interface ChannelFilterBarProps {
  counts: GradeCounts;
  grade: GradeFilter;
  onGradeChange: (grade: GradeFilter) => void;
  /** 채널 번호 검색어 */
  query: string;
  onQueryChange: (query: string) => void;
}

/**
 * 등급 카테고리 칩 + 채널 검색.
 *
 * 필터는 **보이는 채널만 줄일 뿐 순서는 바꾸지 않는다** — 채널을 눈으로 찾는 화면이라
 * 위치가 움직이면 못 쓴다 (CLAUDE.md 참고).
 */
export function ChannelFilterBar({
  counts,
  grade,
  onGradeChange,
  query,
  onQueryChange,
}: ChannelFilterBarProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      {/* 카테고리 — 좁은 화면에서는 가로로 밀어서 본다 */}
      <div
        role="group"
        aria-label="등급 필터"
        className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <FilterChip
          active={grade === "ALL"}
          count={counts.total}
          label="전체"
          onClick={() => onGradeChange("ALL")}
        />

        {GRADES.map((g) => (
          <FilterChip
            key={g}
            active={grade === g}
            count={counts[g]}
            label={GRADE_SHORT_LABEL[g]}
            swatch={GRADE_STYLE[g].swatch}
            labelColor={GRADE_STYLE[g].label}
            onClick={() => onGradeChange(g)}
          />
        ))}
      </div>

      <div className="relative shrink-0 sm:w-56">
        <Search
          size={15}
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-grey-400"
        />
        <input
          type="search"
          inputMode="numeric"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="채널 번호 검색"
          aria-label="채널 번호 검색"
          className={cn(
            "h-9 w-full rounded-sm border border-grey-200 bg-white pr-8 pl-9 text-[13px] text-grey-900 outline-none",
            "placeholder:text-grey-400 focus:border-brand-500",
            // iOS 기본 지우기 버튼은 우리 버튼과 겹치므로 숨긴다
            "[&::-webkit-search-cancel-button]:hidden",
          )}
        />
        {query !== "" && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            aria-label="검색어 지우기"
            className="press absolute top-1/2 right-1.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-xs text-grey-400 hover:bg-grey-100 hover:text-grey-600"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

interface FilterChipProps {
  active: boolean;
  label: string;
  count: number;
  /** 등급 색 사각형. "전체" 에는 없다 */
  swatch?: string;
  labelColor?: string;
  onClick: () => void;
}

function FilterChip({ active, label, count, swatch, labelColor, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "press flex h-9 shrink-0 items-center gap-1.5 rounded-sm border px-2.5 text-[13px] font-semibold whitespace-nowrap",
        active
          ? "border-grey-800 bg-grey-800 text-white"
          : "border-grey-200 bg-white text-grey-700 hover:bg-grey-50",
      )}
    >
      {swatch && (
        <span
          aria-hidden
          className={cn(
            "size-2.5 rounded-[2px] border",
            // 선택된 칩은 배경이 짙어 등급 배경색이 묻히므로 테두리만 흰색으로 세운다
            active ? "border-white/70 bg-white/25" : swatch,
          )}
        />
      )}
      <span className={cn(!active && labelColor)}>{label}</span>
      <span className={cn("tabular-nums", active ? "text-white/70" : "text-grey-400")}>
        {count}
      </span>
    </button>
  );
}
