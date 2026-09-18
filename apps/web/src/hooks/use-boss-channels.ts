"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BossChannel,
  BossChannelListResponse,
  BossChannelSyncResult,
  BossDefinition,
} from "@whale-dad/shared";
import { api } from "@/lib/api";

/** 보스마다 캐시를 따로 둔다 — 같은 채널 번호라도 다른 타이머다 */
const queryKey = (slug: string) => ["boss-channels", slug] as const;

/** `/api/bosses/<slug>/channels` */
const basePath = (slug: string) => `/bosses/${slug}/channels`;

export function useBossChannels(boss: BossDefinition) {
  return useQuery({
    queryKey: queryKey(boss.slug),
    queryFn: () => api<BossChannelListResponse>(basePath(boss.slug)),
  });
}

function useInvalidate(slug: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKey(slug) });
}

/** 처치 기록 — 타이머 시작. killedAt 을 주면 그 시각으로 기록한다 */
export function useRecordKill(boss: BossDefinition) {
  const invalidate = useInvalidate(boss.slug);

  return useMutation({
    mutationFn: ({ channel, killedAt }: { channel: number; killedAt?: string }) =>
      api<BossChannel>(`${basePath(boss.slug)}/${channel}/kill`, {
        method: "POST",
        body: JSON.stringify(killedAt ? { killedAt } : {}),
      }),
    onSuccess: invalidate,
  });
}

/** 타이머 초기화 — 처치 기록을 지운다 */
export function useResetTimer(boss: BossDefinition) {
  const invalidate = useInvalidate(boss.slug);

  return useMutation({
    mutationFn: (channel: number) =>
      api<BossChannel>(`${basePath(boss.slug)}/${channel}/kill`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

/** 채널 범위 일괄 동기화 (예: 0~231) */
export function useSyncChannels(boss: BossDefinition) {
  const invalidate = useInvalidate(boss.slug);

  return useMutation({
    mutationFn: (body: { from: number; to: number; deactivateOutside?: boolean }) =>
      api<BossChannelSyncResult>(`${basePath(boss.slug)}/sync`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: invalidate,
  });
}
