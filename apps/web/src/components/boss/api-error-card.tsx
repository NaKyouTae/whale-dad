"use client";

import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui";
import { API_BASE_URL, IS_LOCAL_FALLBACK } from "@/lib/api";

/** 로컬 개발 중인지(=localhost 에서 보고 있는지) */
function isLocalHost(): boolean {
  if (typeof window === "undefined") return true;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

export function ApiErrorCard({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "알 수 없는 오류";
  const local = isLocalHost();

  return (
    <Card className="flex items-start gap-3 border-[#ffd9dd] bg-[#fff7f8]">
      <AlertCircle className="mt-0.5 shrink-0 text-danger" size={18} />
      <div className="min-w-0">
        <p className="text-heading text-grey-900">채널을 불러오지 못했어요</p>
        <p className="mt-1 text-caption text-grey-600">{message}</p>

        <p className="mt-2 text-caption text-grey-500">
          호출한 주소: <code className="break-all text-grey-700">{API_BASE_URL}</code>
        </p>

        {local ? (
          <ol className="mt-2 flex list-decimal flex-col gap-0.5 pl-4 text-caption text-grey-500">
            <li>
              DB 실행: <code className="text-grey-700">pnpm db:up</code>
            </li>
            <li>
              스키마·시드:{" "}
              <code className="text-grey-700">pnpm db:migrate &amp;&amp; pnpm db:seed</code>
            </li>
            <li>
              서버 실행: <code className="text-grey-700">pnpm dev:server</code>
            </li>
          </ol>
        ) : (
          // 배포 환경에서 "Failed to fetch" 는 대부분 CORS 또는 주소 설정 문제다
          <ul className="mt-2 flex list-disc flex-col gap-0.5 pl-4 text-caption text-grey-500">
            {IS_LOCAL_FALLBACK ? (
              <li>
                <b className="text-grey-700">NEXT_PUBLIC_API_URL</b> 이 설정되지 않았어요. 배포
                환경에 서버 주소를 등록하고 다시 배포해 주세요.
              </li>
            ) : (
              <>
                <li>
                  서버의 <b className="text-grey-700">CORS_ORIGINS</b> 에 지금 이 주소(
                  <code className="text-grey-700">
                    {typeof window !== "undefined" && window.location.origin}
                  </code>
                  )가 들어 있는지 확인해 주세요.
                </li>
                <li>
                  서버가 켜져 있는지 확인:{" "}
                  <code className="break-all text-grey-700">{API_BASE_URL}/health</code>
                </li>
              </>
            )}
          </ul>
        )}
      </div>
    </Card>
  );
}
