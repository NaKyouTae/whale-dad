"use client";

import { useState } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

/**
 * 상단 헤더 + 좌측 사이드바 레이아웃.
 *
 * - 모바일: 사이드바를 화면 밖에 두고 헤더의 햄버거로 연다 (좁은 화면을 메뉴에 내주지 않는다)
 * - sm 이상: 아이콘만 보이는 레일이 늘 떠 있고, 펼치면 본문 위에 겹친다
 *
 * 어느 쪽이든 본문 폭은 펼침 여부에 따라 변하지 않는다.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const toggle = () => setExpanded((prev) => !prev);

  return (
    <div className="min-h-dvh bg-surface">
      <Header menuOpen={expanded} onToggleMenu={toggle} />
      <Sidebar expanded={expanded} onToggle={toggle} onCollapse={() => setExpanded(false)} />

      {/* 레일이 있는 sm 이상에서만 왼쪽을 비워둔다 */}
      <main className="pt-14 pl-0 sm:pl-15">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6">{children}</div>
      </main>
    </div>
  );
}
