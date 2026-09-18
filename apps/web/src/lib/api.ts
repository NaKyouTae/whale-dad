import type { ApiErrorResponse, ApiResponse } from "@whale-dad/shared";

const LOCAL_FALLBACK = "http://localhost:20000/api";

/**
 * NEXT_PUBLIC_* 은 빌드 시점에 값이 박힌다. 빈 문자열은 `??` 로 걸러지지 않으므로 직접 본다.
 *
 * 서버는 모든 라우트를 `/api` 프리픽스 아래에 둔다.
 * 환경변수에 `/api` 를 빠뜨리고 호스트만 넣는 실수가 잦아, 없으면 붙여준다.
 * (끝 슬래시도 함께 정리한다)
 */
function normalizeBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (trimmed.length === 0) return LOCAL_FALLBACK;
  return /\/api$/.test(trimmed) ? trimmed : `${trimmed}/api`;
}

export const API_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL ?? "");

/** 배포 환경인데 로컬 주소로 떨어졌는지 */
export const IS_LOCAL_FALLBACK = API_BASE_URL === LOCAL_FALLBACK;

export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * 배포 빌드에 NEXT_PUBLIC_API_URL 을 빠뜨리면 localhost 가 박힌 채 나가 모든 요청이 실패한다.
 * 원인을 알기 어려운 네트워크 오류 대신 바로 짚어준다.
 */
function assertConfigured(): void {
  if (!IS_LOCAL_FALLBACK || typeof window === "undefined") return;

  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return;

  throw new ApiError(
    0,
    "NEXT_PUBLIC_API_URL 이 설정되지 않았어요. 배포 환경에 서버 주소를 등록하고 다시 배포해 주세요.",
  );
}

/**
 * NestJS 서버 호출 래퍼.
 * 서버는 성공 시 { success: true, data } 로 감싸서 내려주므로 data 만 꺼내 반환한다.
 */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  assertConfigured();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const body = (await res.json()) as ApiResponse<T> | ApiErrorResponse;

  if (!res.ok || body.success === false) {
    const message = "message" in body ? body.message : `요청에 실패했어요 (${res.status})`;
    throw new ApiError(res.status, message);
  }

  return body.data;
}
