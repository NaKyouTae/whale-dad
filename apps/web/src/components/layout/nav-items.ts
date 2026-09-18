export interface NavItem {
  href: string;
  label: string;
  /** public/ 기준 아이콘 이미지 경로 */
  icon: string;
  /** 원본 픽셀 크기 — 픽셀아트라 비율 유지용으로만 쓴다 */
  iconSize: { width: number; height: number };
}

/** 좌측 사이드바 메뉴 */
export const NAV_ITEMS: NavItem[] = [
  {
    href: "/boss",
    label: "여두목 보스",
    icon: "/boss-yeodumok.webp",
    iconSize: { width: 46, height: 75 },
  },
];
