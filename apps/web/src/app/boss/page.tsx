"use client";

import { useMemo, useState } from "react";
import { Loader2, Settings2 } from "lucide-react";
import { ChannelCard } from "@/components/boss/channel-card";
import { ChannelSettingsModal } from "@/components/boss/channel-settings-modal";
import { GradeLegend } from "@/components/boss/grade-legend";
import { KillConfirmDialog } from "@/components/boss/kill-confirm-dialog";
import { AuthModal } from "@/components/auth/auth-modal";
import { useCurrentUser } from "@/hooks/use-auth";
import { useNow } from "@/hooks/use-now";
import { useBossChannels, useRecordKill, useSyncChannels } from "@/hooks/use-boss-channels";
import { getTiming } from "@/lib/boss";
import { ApiErrorCard } from "@/components/boss/api-error-card";

/** 한 줄에 보여줄 채널 수 */
const COLUMNS = 10;
/** 카드 최소 폭 — 이보다 좁아지면 그리드를 가로 스크롤시킨다 */
const MIN_CARD_WIDTH = 62;
const GAP = 4;

export default function BossPage() {
  const { data, isPending, isError, error } = useBossChannels();
  const { data: user } = useCurrentUser();
  const recordKill = useRecordKill();
  const syncChannels = useSyncChannels();

  const [openedId, setOpenedId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  // 서버 시각을 넘겨 기기 시계가 틀어져 있어도 타이머가 맞도록 보정한다.
  const now = useNow(data?.serverNow);

  // 채널 위치는 항상 고정 — 서버가 채널 번호 오름차순으로 주는 순서를 그대로 쓴다.
  const rows = useMemo(
    () => data?.channels.map((channel) => ({ channel, timing: getTiming(channel, now) })) ?? [],
    [data, now],
  );

  const busy = recordKill.isPending;
  // 모달이 열려 있는 동안에도 카운트다운이 계속 흐르도록 rows 에서 매초 다시 집어온다.
  const opened = openedId ? rows.find((row) => row.channel.id === openedId) : undefined;

  if (isPending) {
    return (
      <div className="flex h-60 items-center justify-center text-grey-500">
        <Loader2 className="animate-spin" size={20} />
      </div>
    );
  }

  if (isError) {
    return <ApiErrorCard error={error} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-title text-grey-900">여두목 보스</h1>
          <p className="text-caption text-grey-600">
            처치 후 {data.spawn.minHours}시간이 지나면 출현해요. 채널을 눌러 처치를 기록하세요.
          </p>
        </div>

        <div className="mt-0.5 flex shrink-0 items-center gap-1.5">
          <GradeLegend />

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="채널 설정"
            title="채널 설정"
            className="press flex size-9 items-center justify-center rounded-sm border border-grey-200 bg-white text-grey-600 hover:bg-grey-50"
          >
            <Settings2 size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))`,
            gap: GAP,
            minWidth: COLUMNS * MIN_CARD_WIDTH + (COLUMNS - 1) * GAP,
          }}
        >
          {rows.map(({ channel, timing }) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              timing={timing}
              onOpen={(ch) => setOpenedId(ch.id)}
            />
          ))}
        </div>
      </div>

      {opened && (
        <KillConfirmDialog
          // 채널이 바뀌면 새로 마운트해 입력값을 다시 채운다.
          key={opened.channel.id}
          channel={opened.channel}
          timing={opened.timing}
          busy={busy}
          onClose={() => setOpenedId(null)}
          user={user ?? null}
          onKillNow={(ch) =>
            recordKill.mutate({ channel: ch }, { onSuccess: () => setOpenedId(null) })
          }
          onRequestSignIn={() => {
            setOpenedId(null);
            setAuthOpen(true);
          }}
        />
      )}

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      {settingsOpen && (
        <ChannelSettingsModal
          activeCount={data.channels.length}
          busy={syncChannels.isPending}
          onClose={() => setSettingsOpen(false)}
          onSync={(input) => syncChannels.mutate(input)}
          result={
            syncChannels.data
              ? `신규 ${syncChannels.data.created}개 · 다시 켬 ${syncChannels.data.activated}개 · 숨김 ${syncChannels.data.deactivated}개 · 현재 ${syncChannels.data.total}개`
              : undefined
          }
        />
      )}
    </div>
  );
}
