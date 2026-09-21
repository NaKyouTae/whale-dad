import {
  BOSS_CAUTION_BEFORE_MS,
  BOSS_DANGER_BEFORE_MS,
  BOSS_STALE_AFTER_MS,
  type BossChannel,
  type BossChannelGrade,
} from "@whale-dad/shared";

export interface BossTiming {
  grade: BossChannelGrade;
  /** 출현까지 남은 시간(ms). 이미 출현했거나 기록이 없으면 null */
  remainingMs: number | null;
  /** 출현 시각이 지난 뒤 흐른 시간(ms). 그 외에는 null */
  elapsedMs: number | null;
  /** 처치 → 출현 구간의 진행률 0~1. 기록이 없으면 null */
  progress: number | null;
  /** 처치 시각으로부터 흐른 시간(ms). 0 에서 시작해 계속 늘어난다 */
  sinceKillMs: number | null;
  /** 출현 시각 (처치 + 보스별 spawnMinHours) */
  spawnAt: number | null;
  /**
   * 처치 기록은 있지만 출현 후 `BOSS_STALE_AFTER_MS` 가 지나 믿을 수 없게 된 상태.
   * 이때 `grade` 는 `UNKNOWN` 이지만 기록 자체는 남아 있어 경과 시간을 계속 보여줄 수 있다.
   */
  isStale: boolean;
}

/**
 * 채널 등급을 지금 시각 기준으로 계산한다.
 * 서버는 시각만 내려주고 이 계산은 클라이언트가 매초 다시 수행한다.
 * 젠 간격은 보스마다 다르지만 서버가 준 `earliestSpawnAt` 만 보므로 여기서는 신경 쓰지 않는다.
 *
 * 기준 — 출현 시각까지 남은 시간:
 *   > 1시간        안전
 *   ≤ 1시간        주의
 *   ≤ 10분         위험
 *   ≤ 0            출현
 *
 * 출현한 채 `BOSS_STALE_AFTER_MS` 가 더 지나면 다시 **미확인**으로 돌아간다 —
 * 그쯤이면 기록에 없는 처치가 있었을 가능성이 커서 타이머를 믿고 움직일 수 없기 때문이다.
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
      isStale: false,
    };
  }

  const killedAt = Date.parse(channel.lastKilledAt);
  const spawnAt = Date.parse(channel.earliestSpawnAt);
  const remainingMs = spawnAt - now;
  const sinceKillMs = Math.max(0, now - killedAt);

  if (remainingMs <= 0) {
    const elapsedMs = -remainingMs;
    // 출현하고도 한참 지난 기록은 못 믿는다 — 등급만 미확인으로 되돌리고 시각은 그대로 둔다.
    const isStale = elapsedMs > BOSS_STALE_AFTER_MS;

    return {
      grade: isStale ? "UNKNOWN" : "SPAWNED",
      remainingMs: null,
      elapsedMs,
      progress: 1,
      sinceKillMs,
      spawnAt,
      isStale,
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
    isStale: false,
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

/**
 * ms → "HH:MM" (24시간을 넘으면 "3일 02:30").
 *
 * 채널 카드용. 초까지 보여줘도 읽히지 않고, 매초 바뀌는 숫자가 232개면 눈만 아프다.
 * 대신 카드가 **분이 바뀔 때만** 리렌더되므로 부담도 줄어든다.
 */
export function formatDurationShort(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  const clock = [hours, minutes].map((n) => String(n).padStart(2, "0")).join(":");

  return days > 0 ? `${days}일 ${clock}` : clock;
}

/** 화면에 보이는 등급 순서 — 통계 줄, 필터 칩, 기준표가 모두 이 순서를 쓴다 */
export const GRADES: BossChannelGrade[] = ["SAFE", "CAUTION", "DANGER", "SPAWNED", "UNKNOWN"];

export const GRADE_LABEL: Record<BossChannelGrade, string> = {
  UNKNOWN: "미확인",
  SAFE: "안전",
  CAUTION: "주의",
  DANGER: "위험",
  SPAWNED: "출현",
};

/**
 * 좁은 카드 안(등급 - 시간)과 통계 줄에 쓰는 짧은 이름.
 * 모바일에서 한 줄에 "등급 - 00:00:00" 이 들어가야 하므로 2~3자로 맞춘다.
 */
export const GRADE_SHORT_LABEL: Record<BossChannelGrade, string> = {
  UNKNOWN: "미확인",
  SAFE: "안전",
  CAUTION: "주의",
  DANGER: "위험",
  SPAWNED: "출현",
};

/**
 * 등급 설명 — 젠 간격이 보스마다 다를 수 있어 시간 수치는 목록 응답의 spawn 에서 가져온다.
 */
export function gradeDescription(
  grade: BossChannelGrade,
  spawn: { minHours: number; maxHours: number },
): string {
  const cautionHours = BOSS_CAUTION_BEFORE_MS / 3_600_000;
  const dangerMinutes = BOSS_DANGER_BEFORE_MS / 60_000;
  const staleHours = BOSS_STALE_AFTER_MS / 3_600_000;

  switch (grade) {
    case "UNKNOWN":
      return `기록 없음 · 출현 후 ${staleHours}시간 경과`;
    case "SAFE":
      return `처치 후 0~${spawn.minHours - cautionHours}시간`;
    case "CAUTION":
      return `출현 ${cautionHours}시간 전`;
    case "DANGER":
      return `출현 ${dangerMinutes}분 전`;
    case "SPAWNED":
      return `처치 후 ${spawn.minHours}시간 경과`;
  }
}

/**
 * 등급별 색상 — 카드·기준표·통계·필터 칩이 모두 여기서 가져간다.
 *
 * `time` 은 **등급 배경 위**에 올라가는 글자색이고, `label` 은 **일반 배경 위**(통계 줄,
 * 필터 칩)에 올라가는 글자색이다. 출현 카드만 배경을 꽉 채우므로 둘이 다르다.
 */
export const GRADE_STYLE: Record<
  BossChannelGrade,
  {
    card: string;
    num: string;
    time: string;
    label: string;
    bar: string;
    swatch: string;
    focus: string;
  }
> = {
  SAFE: {
    card: "border-safe-border bg-safe-bg hover:bg-safe-bg-hover",
    num: "text-grey-500",
    time: "text-safe-text",
    label: "text-safe-text",
    bar: "bg-success",
    swatch: "border-safe-border bg-safe-bg",
    focus: "focus-visible:outline-safe-text",
  },
  CAUTION: {
    card: "border-caution-border bg-caution-bg hover:bg-caution-bg-hover",
    num: "text-grey-500",
    time: "text-caution-text",
    label: "text-caution-text",
    bar: "bg-warning",
    swatch: "border-caution-border bg-caution-bg",
    focus: "focus-visible:outline-caution-text",
  },
  DANGER: {
    card: "border-danger-border bg-danger-bg hover:bg-danger-bg-hover",
    num: "text-grey-500",
    time: "text-danger",
    label: "text-danger",
    bar: "bg-danger",
    swatch: "border-danger-border bg-danger-bg",
    focus: "focus-visible:outline-danger",
  },
  SPAWNED: {
    // 지금 잡으러 가야 하는 상태라 유일하게 꽉 채운 색을 쓴다
    card: "border-brand-600 bg-brand-500 hover:bg-brand-600",
    num: "text-white/75",
    time: "text-white",
    label: "text-brand-600 dark:text-brand-300",
    bar: "bg-transparent",
    swatch: "border-brand-600 bg-brand-500",
    focus: "focus-visible:outline-white",
  },
  UNKNOWN: {
    card: "border-grey-200 bg-grey-50 hover:bg-grey-100",
    num: "text-grey-400",
    time: "text-grey-400",
    label: "text-grey-500",
    bar: "bg-transparent",
    swatch: "border-grey-200 bg-grey-50",
    focus: "focus-visible:outline-grey-500",
  },
};
