/** 서버 / 프론트가 공유하는 상수 */

import type { BossDefinition, BossType } from "./types";

export const PORTS = {
  server: 20000,
  web: 20001,
} as const;

export const API_PREFIX = "/api";

/** 커서 기반 페이지네이션 기본값 */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ─────────────────────────────────────────────
// 보스 (여두목 / 천구)
// ─────────────────────────────────────────────

/**
 * 기본 채널 범위. 실제 채널 목록은 DB(boss_channels)에서 관리한다.
 * 재출현 간격은 보스마다 달라서 공통 상수가 없다 — 각 정의의 `spawnMinHours/MaxHours` 를 볼 것.
 */
export const BOSS_CHANNEL_MIN = 0;
export const BOSS_CHANNEL_MAX = 231;

/**
 * 보스 목록 — 메뉴 순서와 같다.
 *
 * 여기 한 줄을 더하면 사이드바 메뉴 / 웹 라우트(`/boss/<slug>`) /
 * API(`/api/bosses/<slug>/channels`) / 부팅 시드가 전부 따라온다.
 */
export const BOSS_DEFINITIONS: readonly BossDefinition[] = [
  {
    type: "YEODUMOK",
    slug: "yeodumok",
    name: "여두목 보스",
    channelMin: BOSS_CHANNEL_MIN,
    channelMax: BOSS_CHANNEL_MAX,
    // 처치 후 3~5시간
    spawnMinHours: 3,
    spawnMaxHours: 5,
  },
  {
    type: "CHEONGU",
    slug: "cheongu",
    name: "천구 보스",
    channelMin: BOSS_CHANNEL_MIN,
    channelMax: BOSS_CHANNEL_MAX,
    // 처치 후 6~8시간 — 여두목보다 두 배 길다
    spawnMinHours: 6,
    spawnMaxHours: 8,
  },
];

/** 기본 보스 — `/boss` 로 들어오면 여기로 보낸다 */
export const DEFAULT_BOSS_SLUG = "yeodumok";

/** URL 조각(slug)으로 보스를 찾는다. 없는 slug 면 undefined */
export function findBossBySlug(slug: string): BossDefinition | undefined {
  return BOSS_DEFINITIONS.find((boss) => boss.slug === slug);
}

/** 보스 종류로 정의를 찾는다. 스키마 enum 과 목록이 어긋나면 undefined */
export function findBossByType(type: BossType): BossDefinition | undefined {
  return BOSS_DEFINITIONS.find((boss) => boss.type === type);
}

/**
 * 등급 경계 — **출현 시각까지 남은 시간** 기준. 보스마다 젠 간격이 달라도 경계는 같다.
 *   남음 > 1시간        → 안전
 *   10분 < 남음 ≤ 1시간 → 주의
 *   0 < 남음 ≤ 10분     → 위험
 *   남음 ≤ 0            → 출현
 */
export const BOSS_CAUTION_BEFORE_MS = 60 * 60 * 1000;
export const BOSS_DANGER_BEFORE_MS = 10 * 60 * 1000;

export const HOUR_MS = 60 * 60 * 1000;
