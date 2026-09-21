/** 서버 / 프론트가 공유하는 타입 */

/** 모든 API 응답의 공통 래퍼 (TransformInterceptor 참고) */
export interface ApiResponse<T> {
  success: true;
  data: T;
}

/** 에러 응답 (AllExceptionsFilter 참고) */
export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  path: string;
  timestamp: string;
}

/** 커서 기반 페이지네이션 응답 */
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasNext: boolean;
}

export interface CursorPageQuery {
  cursor?: string;
  limit?: number;
}

/** 헬스체크 */
export interface HealthStatus {
  status: "ok" | "error";
  uptime: number;
  database: "up" | "down";
  timestamp: string;
}

// ─────────────────────────────────────────────
// 인증
// ─────────────────────────────────────────────

/** 로그인한 계정. username 이 곧 화면에 보이는 이름이다. */
export interface AuthUser {
  id: string;
  username: string;
}

export interface SignInInput {
  username: string;
  password: string;
}

export type SignUpInput = SignInInput;

// ─────────────────────────────────────────────
// 보스 (여두목 / 천구)
// ─────────────────────────────────────────────

/**
 * 보스 종류. Prisma 의 `BossType` enum 과 값이 같아야 한다.
 * 채널 목록·타이머는 보스마다 따로 관리된다.
 */
export type BossType = "YEODUMOK" | "CHEONGU";

/**
 * 보스 하나의 고정 설정. 화면(메뉴·제목)과 서버(채널 시드·젠 간격)가 같은 값을 쓴다.
 * 새 보스를 추가할 때 `BOSS_DEFINITIONS` 에 한 줄 더하면 라우트·API·시드가 모두 따라온다.
 */
export interface BossDefinition {
  type: BossType;
  /** URL 조각. 웹은 `/boss/<slug>`, API 는 `/api/bosses/<slug>/channels` */
  slug: string;
  /** 화면에 보이는 이름 */
  name: string;
  /** 기본 채널 범위 (포함). 실제 목록은 DB(boss_channels) 가 근거다 */
  channelMin: number;
  channelMax: number;
  /** 처치 후 재출현까지 걸리는 시간 (시간 단위) */
  spawnMinHours: number;
  spawnMaxHours: number;
}

/**
 * 채널 등급. 출현 시각(처치 + 보스별 `spawnMinHours`)까지 남은 시간으로 정한다.
 * 서버는 시각만 내려주고 등급 판정은 클라이언트가 매초 다시 계산한다
 * (서버 응답을 계속 폴링하지 않아도 카운트다운이 살아 있도록).
 */
export type BossChannelGrade =
  /** 미확인 — 처치 기록이 없거나, 출현 후 `BOSS_STALE_AFTER_MS` 가 지나 기록을 믿을 수 없음 */
  | "UNKNOWN"
  /** 안전 — 출현까지 1시간 넘게 남음 */
  | "SAFE"
  /** 주의 — 출현 1시간 전 */
  | "CAUTION"
  /** 위험 — 출현 10분 전 */
  | "DANGER"
  /** 출현 — 출현 시각이 지남 */
  | "SPAWNED";

export interface BossChannel {
  id: string;
  /** 어느 보스의 채널인지 */
  bossType: BossType;
  /** 게임 내 채널 번호 */
  channel: number;
  /** 마지막 처치 시각 (ISO). 기록이 없으면 null */
  lastKilledAt: string | null;
  /** 마지막으로 처치를 기록한 계정. 계정이 지워졌으면 null */
  lastKilledBy: AuthUser | null;
  /** lastKilledAt + 보스별 spawnMinHours. 기록이 없으면 null */
  earliestSpawnAt: string | null;
  /** lastKilledAt + 보스별 spawnMaxHours. 기록이 없으면 null */
  latestSpawnAt: string | null;
  /**
   * 출현 시각이 지난 뒤 **가봤는데 보스가 없었다**고 확인한 시각 (ISO).
   * 처치를 새로 기록하면 지워진다 (새 젠 주기가 시작되므로).
   */
  lastCheckedAt: string | null;
  /** 마지막으로 확인을 기록한 계정. 계정이 지워졌으면 null */
  lastCheckedBy: AuthUser | null;
  memo: string | null;
  /** 목록에서 감출 채널은 false */
  isActive: boolean;
  updatedAt: string;
}

export interface BossChannelListResponse {
  /** 클라이언트와 서버의 시계 오차를 보정하기 위한 서버 기준 시각 (ISO) */
  serverNow: string;
  /** 이 목록이 어느 보스의 것인지 (이름·젠 간격을 화면에서 그대로 쓴다) */
  boss: BossDefinition;
  spawn: {
    minHours: number;
    maxHours: number;
  };
  channels: BossChannel[];
}

export interface BossChannelSyncResult {
  created: number;
  activated: number;
  deactivated: number;
  total: number;
}
