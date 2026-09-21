"use client";

import { memo } from "react";
import type { BossChannel } from "@whale-dad/shared";
import { cn } from "@/lib/utils";
import {
  formatDurationShort,
  GRADE_LABEL,
  GRADE_SHORT_LABEL,
  GRADE_STYLE,
  type BossTiming,
} from "@/lib/boss";

/**
 * 카드에는 **처치 후 흐른 시간**을 분 단위로 보여준다.
 * 00:00 에서 시작해 계속 올라가고, 그 보스의 최소 젠 시간을 넘기면 출현 상태(색으로 구분)다.
 * 초는 일부러 뺐다 — 232개가 매초 바뀌면 읽히지 않는다 (정확한 초는 모달에서 본다).
 *
 * **미확인은 늘 `--:--`** — 기록이 없든 출현 후 6시간이 넘어 믿을 수 없게 됐든,
 * 숫자를 보여주면 아직 쓸 수 있는 타이머처럼 읽힌다. 경과 시간은 모달에서 확인한다.
 */
function timeText(timing: BossTiming): string {
  if (timing.grade === "UNKNOWN" || timing.sinceKillMs === null) return "--:--";
  return formatDurationShort(timing.sinceKillMs);
}

/** 카드에 쓰는 "13:20" — 언제 다녀왔는지 */
function clockTime(iso: string): string {
  const at = new Date(iso);
  return `${String(at.getHours()).padStart(2, "0")}:${String(at.getMinutes()).padStart(2, "0")}`;
}

/** 한 줄짜리 "9월 19일 14:30" */
function shortDateTime(iso: string): string {
  const at = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${at.getMonth() + 1}월 ${at.getDate()}일 ${pad(at.getHours())}:${pad(at.getMinutes())}`;
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
        `${channel.channel}채널 — ${GRADE_LABEL[timing.grade]}` +
          (timing.isStale ? " (출현 후 오래돼 기록을 믿기 어려움)" : ""),
        channel.lastKilledBy ? `마지막 처치: ${channel.lastKilledBy.username}` : null,
        channel.lastCheckedAt
          ? `출현 안함: ${shortDateTime(channel.lastCheckedAt)}` +
            (channel.lastCheckedBy ? ` ${channel.lastCheckedBy.username}` : "")
          : null,
        "누르면 처치 기록 창",
      ]
        .filter(Boolean)
        .join(" · ")}
      className={cn(
        // 세 줄(번호·아이디 / 등급 - 시간 / 출현 안함 시각)이 들어가는 높이.
        // 좌우 여백은 칸이 가장 좁은 md(8열, 768px)에서 "출현 안함 13:20" 이 잘리지 않도록
        // 4px 로 두고, 자리가 남는 lg(10열)에서만 넓힌다
        "press relative flex min-h-15 w-full flex-col items-center justify-center gap-0.5 overflow-hidden rounded-sm border px-1 py-1.5 transition-colors lg:px-2",
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

      {/*
        두 번째 줄은 "등급 - 시간". 칸이 가장 좁은 구간은 4열(모바일)이 아니라
        **8열(md, 768px)** 이므로 글자를 키울 때는 거기서 재 볼 것.
        (초를 뺀 "등급 - HH:MM" 은 여유가 있어 타이머를 13px 로 둔다)
      */}
      <span
        className={cn(
          "flex items-baseline gap-[3px] leading-none font-bold whitespace-nowrap",
          style.time,
        )}
      >
        <span className="text-[10px]">{GRADE_SHORT_LABEL[timing.grade]}</span>
        <span aria-hidden className="text-[10px] opacity-60">
          -
        </span>
        <span className="text-[13px] tabular-nums">{timeText(timing)}</span>
      </span>

      {/*
        세 번째 줄 — "가봤는데 출현 안 했다" 고 마지막으로 확인한 **시각**.
        경과가 아니라 시각(13:20)인 이유는 "언제 다녀갔나" 가 궁금한 정보이기 때문이고,
        덕분에 이 줄은 매분 다시 그릴 필요도 없다. 기록이 없으면 줄 자체가 빠진다.
        아이콘 대신 "출현 안함" 이라고 적는다 — 아이콘만으로는 무슨 기록인지 알 수 없다.
        md(8열)에서 한 줄에 겨우 들어가므로 라벨은 9px 로 둔다.
      */}
      {channel.lastCheckedAt && (
        <span
          className={cn(
            "flex max-w-full items-baseline gap-[3px] leading-none font-semibold whitespace-nowrap",
            style.num,
          )}
        >
          <span className="text-[9px]">출현 안함</span>
          <span className="text-[10px] tabular-nums">{clockTime(channel.lastCheckedAt)}</span>
        </span>
      )}

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
 * 표시되는 값(분 단위 타이머)이 바뀔 때만 다시 그린다 — 등급이 바뀌는 순간은 별도로 잡으므로
 * 위험/출현 전환은 분을 기다리지 않고 바로 반영된다.
 */
export const ChannelCard = memo(ChannelCardBase, (prev, next) => {
  const prevMin = Math.floor((prev.timing.sinceKillMs ?? 0) / 60_000);
  const nextMin = Math.floor((next.timing.sinceKillMs ?? 0) / 60_000);

  return (
    prevMin === nextMin &&
    prev.timing.grade === next.timing.grade &&
    prev.channel.lastKilledAt === next.channel.lastKilledAt &&
    prev.channel.lastKilledBy?.username === next.channel.lastKilledBy?.username &&
    prev.channel.lastCheckedAt === next.channel.lastCheckedAt
  );
});
