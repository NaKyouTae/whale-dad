import {
  BOSS_CAUTION_BEFORE_MS,
  BOSS_DANGER_BEFORE_MS,
  type BossChannel,
  type BossChannelGrade,
} from "@whale-dad/shared";

export interface BossTiming {
  grade: BossChannelGrade;
  /** 출현(처치 +3시간)까지 남은 시간(ms). 이미 출현했거나 기록이 없으면 null */
  remainingMs: number | null;
  /** 출현 시각이 지난 뒤 흐른 시간(ms). 그 외에는 null */
  elapsedMs: number | null;
  /** 처치 → 출현 구간의 진행률 0~1. 기록이 없으면 null */
  progress: number | null;
  /** 처치 시각으로부터 흐른 시간(ms). 0 에서 시작해 계속 늘어난다 */
  sinceKillMs: number | null;
  /** 처치 +3시간 (출현 시각) */
  spawnAt: number | null;
}

/**
 * 채널 등급을 지금 시각 기준으로 계산한다.
 * 서버는 시각만 내려주고 이 계산은 클라이언트가 매초 다시 수행한다.
 *
 * 기준 — 출현 시각(처치 +3시간)까지 남은 시간:
 *   > 1시간        안전
 *   ≤ 1시간        주의
 *   ≤ 10분         위험
 *   ≤ 0            출현
 */
export function getTiming(channel: BossChannel, now: number): BossTiming {
  if (!channel.lastKilledAt || !channel.earliestSpawnAt) {
    return {
      grade: "UNKNOWN",
      remainingMs: null,
      elapsedMs: null,
      progress: null,
      sinceKillMs: null,
      spawnAt: null,
    };
  }

  const killedAt = Date.parse(channel.lastKilledAt);
  const spawnAt = Date.parse(channel.earliestSpawnAt);
  const remainingMs = spawnAt - now;
  const sinceKillMs = Math.max(0, now - killedAt);

  if (remainingMs <= 0) {
    return {
      grade: "SPAWNED",
      remainingMs: null,
      elapsedMs: -remainingMs,
      progress: 1,
      sinceKillMs,
      spawnAt,
    };
  }

  const grade: BossChannelGrade =
    remainingMs <= BOSS_DANGER_BEFORE_MS
      ? "DANGER"
      : remainingMs <= BOSS_CAUTION_BEFORE_MS
        ? "CAUTION"
        : "SAFE";

  return {
    grade,
    remainingMs,
    elapsedMs: null,
    progress: (now - killedAt) / (spawnAt - killedAt),
    sinceKillMs,
    spawnAt,
  };
}

/** ms → "HH:MM:SS" (24시간을 넘으면 "3일 02:30:15") */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const clock = [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":");

  return days > 0 ? `${days}일 ${clock}` : clock;
}

export const GRADE_LABEL: Record<BossChannelGrade, string> = {
  UNKNOWN: "기록 없음",
  SAFE: "안전",
  CAUTION: "주의",
  DANGER: "위험",
  SPAWNED: "출현",
};

export const GRADE_DESCRIPTION: Record<BossChannelGrade, string> = {
  UNKNOWN: "처치 기록 없음",
  SAFE: "처치 후 0~2시간",
  CAUTION: "출현 1시간 전",
  DANGER: "출현 10분 전",
  SPAWNED: "처치 후 3시간 경과",
};

/** 등급별 색상 — 카드와 안내 표가 같은 값을 쓴다 */
export const GRADE_STYLE: Record<
  BossChannelGrade,
  { card: string; num: string; time: string; bar: string; swatch: string; focus: string }
> = {
  SAFE: {
    card: "border-safe-border bg-safe-bg hover:bg-safe-bg-hover",
    num: "text-grey-500",
    time: "text-safe-text",
    bar: "bg-success",
    swatch: "border-safe-border bg-safe-bg",
    focus: "focus-visible:outline-safe-text",
  },
  CAUTION: {
    card: "border-caution-border bg-caution-bg hover:bg-caution-bg-hover",
    num: "text-grey-500",
    time: "text-caution-text",
    bar: "bg-warning",
    swatch: "border-caution-border bg-caution-bg",
    focus: "focus-visible:outline-caution-text",
  },
  DANGER: {
    card: "border-danger-border bg-danger-bg hover:bg-danger-bg-hover",
    num: "text-grey-500",
    time: "text-danger",
    bar: "bg-danger",
    swatch: "border-danger-border bg-danger-bg",
    focus: "focus-visible:outline-danger",
  },
  SPAWNED: {
    // 지금 잡으러 가야 하는 상태라 유일하게 꽉 채운 색을 쓴다
    card: "border-brand-600 bg-brand-500 hover:bg-brand-600",
    num: "text-white/75",
    time: "text-white",
    bar: "bg-transparent",
    swatch: "border-brand-600 bg-brand-500",
    focus: "focus-visible:outline-white",
  },
  UNKNOWN: {
    card: "border-grey-200 bg-grey-50 hover:bg-grey-100",
    num: "text-grey-400",
    time: "text-grey-400",
    bar: "bg-transparent",
    swatch: "border-grey-200 bg-grey-50",
    focus: "focus-visible:outline-grey-500",
  },
};
