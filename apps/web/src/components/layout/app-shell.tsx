"use client";

import { useState } from "react";
import { Header } from "./header";
import { RAIL_WIDTH, Sidebar } from "./sidebar";

/**
 * 상단 헤더 + 좌측 사이드바 레이아웃.
 * 사이드바는 기본이 "접힌 레일"로 아이콘만 보이고, 펼치면 본문 위에 겹쳐 뜬다.
 * 본문은 항상 레일 폭만 비워두므로 펼쳐도 레이아웃이 밀리지 않는다.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="min-h-dvh bg-surface">
      <Header />
      <Sidebar
        expanded={expanded}
        onToggle={() => setExpanded((prev) => !prev)}
        onCollapse={() => setExpanded(false)}
      />

      <main className="pt-14" style={{ paddingLeft: RAIL_WIDTH }}>
        <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6">{children}</div>
      </main>
    </div>
  );
}
