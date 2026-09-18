import type { LucideIcon } from "lucide-react";
import { BOSS_DEFINITIONS } from "@whale-dad/shared";

export interface NavItem {
  href: string;
  label: string;
  /** public/ 기준 아이콘 이미지 경로. 없으면 `fallbackIcon` 을 그린다 */
  icon?: string;
  /** 원본 픽셀 크기 — 픽셀아트라 비율 유지용으로만 쓴다 */
  iconSize?: { width: number; height: number };
  /** 스프라이트가 아직 없는 메뉴용 아이콘 */
  fallbackIcon?: LucideIcon;
}

/**
 * 보스 스프라이트. `public/` 에 이미지를 넣고 여기에 slug 를 추가하면
 * 사이드바가 lucide 아이콘 대신 그 이미지를 쓴다.
 */
const BOSS_ICONS: Record<string, Pick<NavItem, "icon" | "iconSize" | "fallbackIcon">> = {
  yeodumok: { icon: "/boss-yeodumok.webp", iconSize: { width: 46, height: 75 } },
  cheongu: { icon: "/boss-cheongu.webp", iconSize: { width: 101, height: 106 } },
};

/** 좌측 사이드바 메뉴 — 보스 목록 순서를 그대로 따른다 */
export const NAV_ITEMS: NavItem[] = BOSS_DEFINITIONS.map((boss) => ({
  href: `/boss/${boss.slug}`,
  label: boss.name,
  ...BOSS_ICONS[boss.slug],
}));
