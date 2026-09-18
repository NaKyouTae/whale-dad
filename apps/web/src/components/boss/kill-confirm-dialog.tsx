"use client";

import { LogIn } from "lucide-react";
import type { AuthUser, BossChannel } from "@whale-dad/shared";
import { Button, Modal } from "@/components/ui";
import { formatDuration, GRADE_LABEL, GRADE_STYLE, type BossTiming } from "@/lib/boss";
import { cn } from "@/lib/utils";

function currentStateText(timing: BossTiming): string {
  switch (timing.grade) {
    case "UNKNOWN":
      return "처치 기록이 없어요";
    case "SPAWNED":
      return `출현한 지 ${formatDuration(timing.elapsedMs ?? 0)} 지났어요`;
    default:
      return `출현까지 ${formatDuration(timing.remainingMs ?? 0)} 남았어요`;
  }
}

function killedAtText(channel: BossChannel): string | null {
  if (!channel.lastKilledAt) return null;

  const at = new Date(channel.lastKilledAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  const when = `${at.getMonth() + 1}월 ${at.getDate()}일 ${pad(at.getHours())}:${pad(at.getMinutes())}`;

  return channel.lastKilledBy ? `${when} · ${channel.lastKilledBy.username}` : when;
}

interface KillConfirmDialogProps {
  /** 항상 값이 있는 채널. 호출부에서 key={channel.id} 로 감싸 채널이 바뀌면 새로 마운트한다. */
  channel: BossChannel;
  timing: BossTiming;
  /** 로그인한 계정. null 이면 기록할 수 없고 로그인을 안내한다 */
  user: AuthUser | null;
  onClose: () => void;
  /** 지금 처치한 것으로 기록 */
  onKillNow: (channel: number) => void;
  /** 로그인 모달 열기 */
  onRequestSignIn: () => void;
  busy?: boolean;
}

/**
 * 채널을 눌렀을 때 뜨는 처치 확인 모달.
 * 카드 클릭만으로 바로 기록하면 실수로 눌렀을 때 타이머가 날아가므로 여기서 한 번 확인한다.
 */
export function KillConfirmDialog({
  channel,
  timing,
  user,
  onClose,
  onKillNow,
  onRequestSignIn,
  busy,
}: KillConfirmDialogProps) {
  const style = GRADE_STYLE[timing.grade];
  const killedAt = killedAtText(channel);

  return (
    <Modal
      title={`${channel.channel}채널`}
      onClose={onClose}
      footer={
        <div className="flex w-full flex-col gap-2">
          {user ? (
            <Button
              variant="primary"
              full
              disabled={busy}
              onClick={() => onKillNow(channel.channel)}
            >
              지금 처치함
            </Button>
          ) : (
            <Button variant="primary" full onClick={onRequestSignIn}>
              <LogIn size={15} />
              로그인하고 기록하기
            </Button>
          )}

          <Button variant="secondary" full onClick={onClose}>
            닫기
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {/* 지금 상태를 먼저 보여줘 실수로 누른 건지 판단할 수 있게 한다 */}
        <div className={cn("flex items-center gap-2 rounded-md border px-3 py-2.5", style.card)}>
          <span className={cn("text-caption font-bold", style.time)}>
            {GRADE_LABEL[timing.grade]}
          </span>
          <span className="text-caption text-grey-600">{currentStateText(timing)}</span>
        </div>

        {killedAt && (
          <p className="text-caption text-grey-500">
            마지막 처치 <span className="font-semibold text-grey-700">{killedAt}</span>
          </p>
        )}

        {user ? (
          <p className="text-caption text-grey-600">
            방금 잡았다면 <b className="text-grey-800">지금 처치함</b>을 누르세요.{" "}
            <b className="text-grey-800">{user.username}</b> 이름으로 기록돼요.
          </p>
        ) : (
          <p className="text-caption text-grey-600">
            처치를 기록하려면 <b className="text-grey-800">로그인</b>이 필요해요. 계정이 없다면
            로그인 창에서 회원가입하면 바로 시작할 수 있어요.
          </p>
        )}
      </div>
    </Modal>
  );
}
