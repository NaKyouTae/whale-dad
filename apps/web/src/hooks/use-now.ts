"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 1초마다 갱신되는 현재 시각(ms).
 * 카드마다 setInterval 을 두지 않고 최상위에서 한 번만 돌린 뒤 내려준다.
 *
 * @param serverNow 서버 기준 시각(ISO). 주면 기기 시계와의 오차를 보정한다.
 */
export function useNow(serverNow?: string): number {
  const [now, setNow] = useState(() => Date.now());
  const offsetRef = useRef(0);

  // 서버 응답이 올 때마다 시계 오차를 다시 잰다.
  useEffect(() => {
    if (!serverNow) return;
    offsetRef.current = Date.parse(serverNow) - Date.now();
  }, [serverNow]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() + offsetRef.current), 1000);
    return () => clearInterval(id);
  }, []);

  return now;
}
