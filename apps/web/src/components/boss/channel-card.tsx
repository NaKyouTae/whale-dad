"use client";

import { memo } from "react";
import type { BossChannel } from "@whale-dad/shared";
import { cn } from "@/lib/utils";
import { formatDuration, GRADE_LABEL, GRADE_STYLE, type BossTiming } from "@/lib/boss";

function timeText(timing: BossTiming): string {
  switch (timing.grade) {
    case "UNKNOWN":
      return "--:--:--";
    case "SPAWNED":
      // 출현 시각이 지난 뒤 얼마나 흘렀는지
      return `+${formatDuration(timing.elapsedMs ?? 0)}`;
    default:
      // 출현까지 남은 시간
      return formatDuration(timing.remainingMs ?? 0);
  }
}

interface ChannelCardProps {
  channel: BossChannel;
  timing: BossTiming;
  /**
   * 카드 클릭 = 처치 확인 모달 열기.
   * 클릭만으로 바로 기록하면 실수로 눌렀을 때 타이머가 날아가므로 한 단계 둔다.
   */
  onOpen: (channel: BossChannel) => void;
}

function ChannelCardBase({ channel, timing, onOpen }: ChannelCardProps) {
  const style = GRADE_STYLE[timing.grade];

  return (
    <button
      type="button"
      onClick={() => onOpen(channel)}
      title={[
        `${channel.channel}채널 — ${GRADE_LABEL[timing.grade]}`,
        channel.lastKilledBy ? `마지막 처치: ${channel.lastKilledBy.username}` : null,
        "누르면 처치 기록 창",
      ]
        .filter(Boolean)
        .join(" · ")}
      className={cn(
        // 모바일 터치 영역 확보(44px) + 좁은 화면에서 좌우 여백을 줄여 타이머가 잘리지 않게 한다
        "press relative flex min-h-11 w-full flex-col items-center justify-center gap-0.5 rounded-sm border px-1.5 py-1.5 transition-colors sm:px-2",
        // 기본 포커스 링은 카드 바깥에 떠서 이중 테두리처럼 보인다.
        // 카드 안쪽에 그리고, 등급 배경과 대비되는 색을 쓴다.
        "focus-visible:outline-2 focus-visible:[outline-offset:-3px]",
        style.card,
        style.focus,
      )}
    >
      <span className="flex w-full min-w-0 items-baseline justify-between gap-1">
        <span className={cn("text-[11px] leading-none font-bold tabular-nums", style.num)}>
          {channel.channel}
        </span>
        {channel.lastKilledBy && (
          <span
            className={cn("min-w-0 truncate text-[10px] leading-none font-medium", style.num)}
            title={channel.lastKilledBy.username}
          >
            {channel.lastKilledBy.username}
          </span>
        )}
      </span>
      <span className={cn("text-[13px] leading-none font-bold tabular-nums", style.time)}>
        {timeText(timing)}
      </span>

      {/* 출현까지의 진행바 — 카드 맨 아래 2px 선이라 줄 수를 늘리지 않는다 */}
      <span
        aria-hidden
        className={cn("absolute inset-x-0 bottom-0 h-[2px] rounded-b-sm", style.bar)}
        style={{ width: `${Math.round((timing.progress ?? 0) * 100)}%` }}
      />
    </button>
  );
}

/**
 * 채널이 232개라 매초 전부 리렌더되면 부담이 크다.
 * 표시되는 값(초 단위 카운트다운)이 바뀔 때만 다시 그린다.
 */
export const ChannelCard = memo(ChannelCardBase, (prev, next) => {
  const prevSec = Math.floor((prev.timing.remainingMs ?? prev.timing.elapsedMs ?? 0) / 1000);
  const nextSec = Math.floor((next.timing.remainingMs ?? next.timing.elapsedMs ?? 0) / 1000);

  return (
    prevSec === nextSec &&
    prev.timing.grade === next.timing.grade &&
    prev.channel.lastKilledAt === next.channel.lastKilledAt &&
    prev.channel.lastKilledBy?.username === next.channel.lastKilledBy?.username
  );
});
