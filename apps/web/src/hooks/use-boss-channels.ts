"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BossChannel,
  BossChannelListResponse,
  BossChannelSyncResult,
} from "@whale-dad/shared";
import { api } from "@/lib/api";

const QUERY_KEY = ["boss-channels"] as const;

export function useBossChannels() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => api<BossChannelListResponse>("/boss-channels"),
  });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });
}

/** 처치 기록 — 타이머 시작 */
export function useRecordKill() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: ({ channel, killedAt }: { channel: number; killedAt?: string }) =>
      api<BossChannel>(`/boss-channels/${channel}/kill`, {
        method: "POST",
        body: JSON.stringify(killedAt ? { killedAt } : {}),
      }),
    onSuccess: invalidate,
  });
}

/** 타이머 초기화 — 처치 기록을 지운다 */
export function useResetTimer() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: (channel: number) =>
      api<BossChannel>(`/boss-channels/${channel}/kill`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

/** 채널 범위 일괄 동기화 (예: 0~231) */
export function useSyncChannels() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: (body: { from: number; to: number; deactivateOutside?: boolean }) =>
      api<BossChannelSyncResult>("/boss-channels/sync", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: invalidate,
  });
}
