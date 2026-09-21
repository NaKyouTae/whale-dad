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

/**
 * 확인 기록 — "가봤는데 보스가 없었다".
 * 처치가 아니므로 타이머는 그대로 두고 누가 언제 다녀갔는지만 남긴다.
 */
export function useRecordCheck(boss: BossDefinition) {
  const invalidate = useInvalidate(boss.slug);

  return useMutation({
    mutationFn: ({ channel, checkedAt }: { channel: number; checkedAt?: string }) =>
      api<BossChannel>(`${basePath(boss.slug)}/${channel}/check`, {
        method: "POST",
        body: JSON.stringify(checkedAt ? { checkedAt } : {}),
      }),
    onSuccess: invalidate,
  });
}

/**
 * 채널을 목록에서 없앤다 — 게임에 실제로 없는 번호를 치울 때 쓴다.
 *
 * **하드 삭제(DELETE)가 아니라 비활성화(`isActive: false`)다.** 서버는 부팅할 때마다
 * 기본 범위(0~231)에서 빠진 채널을 다시 만들기 때문에, 행을 지우면 다음 배포에 되살아난다.
 * 비활성화된 채널은 목록 응답에서 빠지고 부팅 시드도 건드리지 않아 그대로 유지된다.
 */
export function useRemoveChannel(boss: BossDefinition) {
  const invalidate = useInvalidate(boss.slug);

  return useMutation({
    mutationFn: (channel: number) =>
      api<BossChannel>(`${basePath(boss.slug)}/${channel}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: false }),
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
