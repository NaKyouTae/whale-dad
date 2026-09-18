"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

/** 접힌 레일 폭(px). sm 이상에서만 본문이 이만큼 비워둔다. */
export const RAIL_WIDTH = 60;
/** 메뉴 아이콘 높이(px). 원본 비율(46x75)을 지켜 폭을 계산한다. */
const ICON_HEIGHT = 34;

interface SidebarProps {
  expanded: boolean;
  onToggle: () => void;
  onCollapse: () => void;
}

/**
 * 좌측 메뉴.
 * - 모바일: 평소엔 화면 밖에 있고 헤더의 햄버거로 열린다 (좁은 화면에서 60px 을 아끼기 위해)
 * - sm 이상: 아이콘만 보이는 레일로 늘 떠 있고, 경계선의 손잡이로 펼친다
 */
export function Sidebar({ expanded, onToggle, onCollapse }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* 펼쳤을 때만 깔리는 배경 — 바깥을 누르면 닫힌다 */}
      <div
        aria-hidden
        onClick={onCollapse}
        className={cn(
          "fixed inset-0 z-30 bg-black/30 transition-opacity duration-200",
          expanded ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed top-14 bottom-0 left-0 z-40 w-54 overflow-hidden border-r border-grey-200 bg-white",
          "transition-[width,transform] duration-200 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
          // 모바일: 닫히면 화면 밖으로 완전히 치운다
          expanded ? "translate-x-0" : "-translate-x-full",
          // sm 이상: 늘 보이고, 폭만 레일 ↔ 패널로 바뀐다
          "sm:translate-x-0",
          expanded ? "sm:w-54" : "sm:w-15",
          expanded && "shadow-float",
        )}
      >
        <nav className="flex flex-col gap-1 p-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const iconWidth = Math.round(
              (item.iconSize.width / item.iconSize.height) * ICON_HEIGHT,
            );

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                onClick={onCollapse}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "press flex h-12 items-center rounded-md text-body font-semibold",
                  active
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                    : "text-grey-700 hover:bg-grey-100 active:bg-grey-200",
                )}
              >
                {/* 접혔을 때 아이콘이 레일 한가운데 오도록 아이콘 칸을 레일 폭으로 고정한다 */}
                <span
                  style={{ width: RAIL_WIDTH - 16 }}
                  className="flex shrink-0 items-center justify-center"
                >
                  <Image
                    src={item.icon}
                    alt={item.label}
                    width={iconWidth}
                    height={ICON_HEIGHT}
                    // 1.7KB 스프라이트라 최적화 파이프라인을 태울 이유가 없다.
                    unoptimized
                  />
                </span>

                <span
                  className={cn(
                    "whitespace-nowrap transition-opacity duration-150",
                    expanded ? "opacity-100" : "opacity-0",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/*
        접기/펼치기 손잡이 — 사이드바 오른쪽 경계선 위, 세로 한가운데.
        모바일에는 레일 자체가 없으므로 헤더의 햄버거가 그 역할을 한다.
        aside 가 overflow-hidden 이라 잘리지 않도록 형제로 두고 left 를 폭에 맞춰 따라가게 한다.
      */}
      <div
        className={cn(
          "pointer-events-none fixed top-14 bottom-0 z-45 hidden -translate-x-1/2 items-center sm:flex",
          "transition-[left] duration-200 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
          expanded ? "left-54" : "left-15",
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-label={expanded ? "메뉴 접기" : "메뉴 펼치기"}
          aria-expanded={expanded}
          className="press pointer-events-auto flex size-6 items-center justify-center rounded-full border border-grey-200 bg-white text-grey-500 shadow-card hover:bg-grey-50 hover:text-grey-700"
        >
          {expanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>
    </>
  );
}
