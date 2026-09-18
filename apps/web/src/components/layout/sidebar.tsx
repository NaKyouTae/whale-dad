"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

/** 접힌 레일 폭 — 본문이 항상 이만큼 비워둔다 */
export const RAIL_WIDTH = 60;
/** 펼쳤을 때 폭 — 본문 위에 겹쳐 뜨므로 레이아웃이 밀리지 않는다 */
const PANEL_WIDTH = 216;
/** 메뉴 아이콘 높이(px). 원본 비율(46x75)을 지켜 폭을 계산한다. */
const ICON_HEIGHT = 34;

const EASE = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";

interface SidebarProps {
  expanded: boolean;
  onToggle: () => void;
  onCollapse: () => void;
}

export function Sidebar({ expanded, onToggle, onCollapse }: SidebarProps) {
  const pathname = usePathname();
  const width = expanded ? PANEL_WIDTH : RAIL_WIDTH;

  return (
    <>
      {/* 펼쳤을 때만 깔리는 배경 — 바깥을 누르면 접힌다 */}
      <div
        aria-hidden
        onClick={onCollapse}
        className={cn(
          "fixed inset-0 z-30 bg-grey-900/20 transition-opacity duration-200",
          expanded ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        style={{ width, transitionTimingFunction: EASE }}
        className={cn(
          "fixed top-14 bottom-0 left-0 z-40 overflow-hidden border-r border-grey-200 bg-white",
          "transition-[width] duration-200",
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
                    ? "bg-brand-50 text-brand-700"
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
        aside 가 overflow-hidden 이라 잘리지 않도록 형제로 두고 left 를 폭에 맞춰 따라가게 한다.
      */}
      <div
        style={{ left: width, transitionTimingFunction: EASE }}
        className="pointer-events-none fixed top-14 bottom-0 z-45 flex -translate-x-1/2 items-center transition-[left] duration-200"
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
