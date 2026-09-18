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
// 여두목 보스
// ─────────────────────────────────────────────

/**
 * 채널 등급. 처치 +3시간(출현 시각)까지 남은 시간으로 정한다.
 * 서버는 시각만 내려주고 등급 판정은 클라이언트가 매초 다시 계산한다
 * (서버 응답을 계속 폴링하지 않아도 카운트다운이 살아 있도록).
 */
export type BossChannelGrade =
  /** 처치 기록 없음 */
  | "UNKNOWN"
  /** 안전 — 처치 후 0~2시간 */
  | "SAFE"
  /** 주의 — 출현 1시간 전 */
  | "CAUTION"
  /** 위험 — 출현 10분 전 */
  | "DANGER"
  /** 출현 — 처치 후 3시간 경과 */
  | "SPAWNED";

export interface BossChannel {
  id: string;
  /** 게임 내 채널 번호 */
  channel: number;
  /** 마지막 처치 시각 (ISO). 기록이 없으면 null */
  lastKilledAt: string | null;
  /** 마지막으로 처치를 기록한 계정. 계정이 지워졌으면 null */
  lastKilledBy: AuthUser | null;
  /** lastKilledAt + 3h. 기록이 없으면 null */
  earliestSpawnAt: string | null;
  /** lastKilledAt + 5h. 기록이 없으면 null */
  latestSpawnAt: string | null;
  memo: string | null;
  /** 목록에서 감출 채널은 false */
  isActive: boolean;
  updatedAt: string;
}

export interface BossChannelListResponse {
  /** 클라이언트와 서버의 시계 오차를 보정하기 위한 서버 기준 시각 (ISO) */
  serverNow: string;
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
