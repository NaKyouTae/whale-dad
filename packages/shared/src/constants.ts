/** 서버 / 프론트가 공유하는 상수 */

export const PORTS = {
  server: 20000,
  web: 20001,
} as const;

export const API_PREFIX = "/api";

/** 커서 기반 페이지네이션 기본값 */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ─────────────────────────────────────────────
// 여두목 보스
// ─────────────────────────────────────────────

/** 처치 후 재출현까지 걸리는 시간 (시간 단위) */
export const BOSS_SPAWN_MIN_HOURS = 3;
export const BOSS_SPAWN_MAX_HOURS = 5;

/**
 * 등급 경계 — 출현 시각(처치 +3시간)까지 남은 시간 기준.
 *   남음 > 1시간        → 안전
 *   10분 < 남음 ≤ 1시간 → 주의
 *   0 < 남음 ≤ 10분     → 위험
 *   남음 ≤ 0            → 출현
 */
export const BOSS_CAUTION_BEFORE_MS = 60 * 60 * 1000;
export const BOSS_DANGER_BEFORE_MS = 10 * 60 * 1000;

/** 기본 채널 범위. 실제 채널 목록은 DB(boss_channels)에서 관리한다. */
export const BOSS_CHANNEL_MIN = 1;
export const BOSS_CHANNEL_MAX = 231;

export const HOUR_MS = 60 * 60 * 1000;
