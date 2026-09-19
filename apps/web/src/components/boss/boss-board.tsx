"use client";

import { useMemo, useState } from "react";
import { Loader2, Settings2 } from "lucide-react";
import type { BossDefinition } from "@whale-dad/shared";
import { ChannelCard } from "@/components/boss/channel-card";
import { ChannelFilterBar, type GradeFilter } from "@/components/boss/channel-filter-bar";
import { ChannelSettingsModal } from "@/components/boss/channel-settings-modal";
import { GradeLegend } from "@/components/boss/grade-legend";
import { GradeStats, type GradeCounts } from "@/components/boss/grade-stats";
import { KillConfirmDialog } from "@/components/boss/kill-confirm-dialog";
import { AuthModal } from "@/components/auth/auth-modal";
import { useCurrentUser } from "@/hooks/use-auth";
import { useNow } from "@/hooks/use-now";
import {
  useBossChannels,
  useRecordCheck,
  useRecordKill,
  useResetTimer,
  useSyncChannels,
} from "@/hooks/use-boss-channels";
import { getTiming } from "@/lib/boss";
import { cn } from "@/lib/utils";
import { ApiErrorCard } from "@/components/boss/api-error-card";

/**
 * 한 줄에 보여줄 채널 수. 넓은 화면은 10개, 좁아질수록 줄여서
 * 카드가 눌릴 만한 크기를 유지한다 (모바일에서 가로 스크롤이 생기지 않도록).
 */
const GRID_COLUMNS = "grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10";

const EMPTY_COUNTS: GradeCounts = {
  total: 0,
  SAFE: 0,
  CAUTION: 0,
  DANGER: 0,
  SPAWNED: 0,
  UNKNOWN: 0,
};

/**
 * 보스 하나의 채널 판. 보스 종류만 다르고 화면은 완전히 같다.
 * (`/boss/yeodumok`, `/boss/cheongu` 가 이 컴포넌트를 공유한다)
 */
export function BossBoard({ boss }: { boss: BossDefinition }) {
  const { data, isPending, isError, error } = useBossChannels(boss);
  const { data: user } = useCurrentUser();
  const recordKill = useRecordKill(boss);
  const recordCheck = useRecordCheck(boss);
  const resetTimer = useResetTimer(boss);
  const syncChannels = useSyncChannels(boss);

  const [openedId, setOpenedId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [grade, setGrade] = useState<GradeFilter>("ALL");
  const [query, setQuery] = useState("");

  // 서버 시각을 넘겨 기기 시계가 틀어져 있어도 타이머가 맞도록 보정한다.
  const now = useNow(data?.serverNow);

  // 채널 위치는 항상 고정 — 서버가 채널 번호 오름차순으로 주는 순서를 그대로 쓴다.
  const rows = useMemo(
    () => data?.channels.map((channel) => ({ channel, timing: getTiming(channel, now) })) ?? [],
    [data, now],
  );

  // 통계는 늘 **전체 채널** 기준이다 (필터를 걸어도 수치는 그대로여야 판단이 된다).
  const counts = useMemo(() => {
    const next: GradeCounts = { ...EMPTY_COUNTS, total: rows.length };
    for (const row of rows) next[row.timing.grade] += 1;
    return next;
  }, [rows]);

  // 필터는 보이는 채널만 줄일 뿐 **순서는 바꾸지 않는다**.
  const visible = useMemo(() => {
    const keyword = query.trim();

    return rows.filter(
      (row) =>
        (grade === "ALL" || row.timing.grade === grade) &&
        (keyword === "" || String(row.channel.channel).includes(keyword)),
    );
  }, [rows, grade, query]);

  const busy = recordKill.isPending || recordCheck.isPending || resetTimer.isPending;
  // 모달이 열려 있는 동안에도 카운트다운이 계속 흐르도록 rows 에서 매초 다시 집어온다.
  // (필터를 건드려도 닫히지 않도록 필터 전 목록에서 찾는다)
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
        <div className="min-w-0">
          <h1 className="text-title text-grey-900">{data.boss.name}</h1>
          <p className="text-caption text-grey-600">
            처치 후 {data.spawn.minHours}시간이 지나면 출현해요. 채널을 눌러 처치를 기록하세요.
          </p>

          {/* 서브 타이틀 밑 — 등급별 채널 수 */}
          <GradeStats counts={counts} />
        </div>

        <div className="mt-0.5 flex shrink-0 items-center gap-1.5">
          <GradeLegend spawn={data.spawn} />

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

      <ChannelFilterBar
        counts={counts}
        grade={grade}
        onGradeChange={setGrade}
        query={query}
        onQueryChange={setQuery}
      />

      {visible.length === 0 ? (
        <p className="rounded-md border border-grey-200 bg-white px-4 py-10 text-center text-caption text-grey-500">
          조건에 맞는 채널이 없어요.
        </p>
      ) : (
        <div className={cn("grid gap-1", GRID_COLUMNS)}>
          {visible.map(({ channel, timing }) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              timing={timing}
              onOpen={(ch) => setOpenedId(ch.id)}
            />
          ))}
        </div>
      )}

      {opened && (
        <KillConfirmDialog
          // 채널이 바뀌면 새로 마운트해 입력값을 다시 채운다.
          key={opened.channel.id}
          channel={opened.channel}
          timing={opened.timing}
          now={now}
          busy={busy}
          onClose={() => setOpenedId(null)}
          user={user ?? null}
          error={recordKill.error ?? recordCheck.error ?? resetTimer.error}
          onKill={(ch, killedAt) =>
            recordKill.mutate({ channel: ch, killedAt }, { onSuccess: () => setOpenedId(null) })
          }
          // 확인 기록은 모달을 닫지 않는다 — 기록된 시각을 바로 눈으로 확인하게 둔다
          onCheck={(ch, checkedAt) => recordCheck.mutate({ channel: ch, checkedAt })}
          onReset={(ch) => resetTimer.mutate(ch, { onSuccess: () => setOpenedId(null) })}
          onRequestSignIn={() => {
            setOpenedId(null);
            setAuthOpen(true);
          }}
        />
      )}

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      {settingsOpen && (
        <ChannelSettingsModal
          boss={data.boss}
          activeCount={data.channels.length}
          user={user ?? null}
          busy={syncChannels.isPending}
          error={syncChannels.error}
          onClose={() => setSettingsOpen(false)}
          onRequestSignIn={() => {
            setSettingsOpen(false);
            setAuthOpen(true);
          }}
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
