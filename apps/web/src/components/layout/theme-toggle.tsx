"use client";

import { Moon, Sun } from "lucide-react";

export const THEME_STORAGE_KEY = "whale-dad-theme";

/**
 * 라이트/다크 전환.
 *
 * 아이콘을 React state 로 고르면 서버 렌더 결과와 어긋난다(서버는 사용자의 취향을 모른다).
 * 그래서 두 아이콘을 모두 그려두고 CSS 로만 하나를 감춘다 — 하이드레이션 불일치가 없다.
 */
export function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";

    root.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // 사생활 보호 모드 등에서 저장이 막혀도 전환 자체는 되게 둔다
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="라이트/다크 테마 전환"
      title="테마 전환"
      className="press flex size-9 items-center justify-center rounded-sm border border-grey-200 bg-white text-grey-600 hover:bg-grey-50"
    >
      <Sun size={16} className="hidden dark:block" />
      <Moon size={16} className="block dark:hidden" />
    </button>
  );
}
