import type { ApiErrorResponse, ApiResponse } from "@whale-dad/shared";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:20000/api";

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
 * NestJS 서버 호출 래퍼.
 * 서버는 성공 시 { success: true, data } 로 감싸서 내려주므로 data 만 꺼내 반환한다.
 */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
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
