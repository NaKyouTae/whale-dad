"use client";

import { useState } from "react";
import { Clock, LogIn, RotateCcw } from "lucide-react";
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
  const when = `${at.getMonth() + 1}월 ${at.getDate()}일 ${pad(at.getHours())}:${pad(at.getMinutes())}`;

  return channel.lastKilledBy ? `${when} · ${channel.lastKilledBy.username}` : when;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** ms → `<input type="datetime-local">` 이 받는 "YYYY-MM-DDTHH:mm" (기기 로컬 시각) */
function toLocalInputValue(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface KillConfirmDialogProps {
  /** 항상 값이 있는 채널. 호출부에서 key={channel.id} 로 감싸 채널이 바뀌면 새로 마운트한다. */
  channel: BossChannel;
  timing: BossTiming;
  /** 서버 시각으로 보정된 현재 시각(ms). 수기 입력의 기본값·미래 검사에 쓴다 */
  now: number;
  /** 로그인한 계정. null 이면 기록할 수 없고 로그인을 안내한다 */
  user: AuthUser | null;
  onClose: () => void;
  /**
   * 처치 기록. `killedAt`(ISO)을 주면 그 시각으로, 없으면 지금으로 기록한다.
   */
  onKill: (channel: number, killedAt?: string) => void;
  /** 처치 기록을 지워 타이머를 되돌린다 */
  onReset: (channel: number) => void;
  /** 로그인 모달 열기 */
  onRequestSignIn: () => void;
  busy?: boolean;
  /** 기록/초기화가 실패했을 때의 오류 */
  error?: unknown;
}

/**
 * 채널을 눌렀을 때 뜨는 처치 확인 모달.
 * 카드 클릭만으로 바로 기록하면 실수로 눌렀을 때 타이머가 날아가므로 여기서 한 번 확인한다.
 *
 * 놓친 처치를 나중에 적을 수 있도록 **시각을 직접 입력**할 수도 있다.
 */
export function KillConfirmDialog({
  channel,
  timing,
  now,
  user,
  onClose,
  onKill,
  onReset,
  onRequestSignIn,
  busy,
  error,
}: KillConfirmDialogProps) {
  const style = GRADE_STYLE[timing.grade];
  const killedAt = killedAtText(channel);

  const [manual, setManual] = useState(false);
  // 열린 순간의 시각을 기본값으로 둔다. 매초 갱신하면 입력 중에 값이 바뀌어버린다.
  const [manualValue, setManualValue] = useState(() => toLocalInputValue(now));

  const manualMs = manualValue === "" ? NaN : new Date(manualValue).getTime();
  const manualInvalid = Number.isNaN(manualMs);
  // 미래에 잡을 수는 없다. 그대로 보내면 타이머가 음수로 흘러 화면이 이상해진다.
  const manualFuture = !manualInvalid && manualMs > now + 60_000;
  const manualError = manualInvalid
    ? "시각을 입력해 주세요"
    : manualFuture
      ? "미래 시각은 기록할 수 없어요"
      : null;

  const submit = () => {
    if (!manual) {
      onKill(channel.channel);
      return;
    }

    if (manualError) return;
    onKill(channel.channel, new Date(manualMs).toISOString());
  };

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
              disabled={busy || (manual && manualError !== null)}
              onClick={submit}
            >
              {manual ? "입력한 시간으로 기록" : "지금 처치함"}
            </Button>
          ) : (
            <Button variant="primary" full onClick={onRequestSignIn}>
              <LogIn size={15} />
              로그인하고 기록하기
            </Button>
          )}

          <div className="flex gap-2">
            {/* 기록이 있고 로그인한 경우에만 되돌릴 수 있다 */}
            <Button
              variant="outline"
              full
              disabled={busy || !user || !channel.lastKilledAt}
              onClick={() => onReset(channel.channel)}
            >
              <RotateCcw size={14} />
              타이머 초기화
            </Button>
            <Button variant="secondary" full onClick={onClose}>
              닫기
            </Button>
          </div>
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

        {user && (
          <div className="flex flex-col gap-2 rounded-md border border-grey-200 bg-grey-50 p-3">
            <label className="flex items-center gap-2 text-caption font-semibold text-grey-700">
              <input
                type="checkbox"
                checked={manual}
                onChange={(e) => setManual(e.target.checked)}
                className="size-4 accent-brand-500"
              />
              <Clock size={14} className="text-grey-500" />
              시간 직접 입력
            </label>

            {manual ? (
              <>
                <input
                  type="datetime-local"
                  value={manualValue}
                  // 미래는 선택할 수 없게 브라우저 단에서도 막는다 (검증은 아래에서 한 번 더)
                  max={toLocalInputValue(now)}
                  onChange={(e) => setManualValue(e.target.value)}
                  aria-label="처치 시각"
                  aria-invalid={manualError ? true : undefined}
                  className={cn(
                    "h-11 w-full rounded-sm border bg-white px-3 text-body text-grey-900 outline-none",
                    manualError
                      ? "border-danger focus:border-danger"
                      : "border-grey-200 focus:border-brand-500",
                  )}
                />
                {manualError ? (
                  <p role="alert" className="text-caption text-danger">
                    {manualError}
                  </p>
                ) : (
                  <p className="text-caption text-grey-500">
                    놓친 처치를 나중에 적을 때 쓰세요. 이 시각 기준으로 타이머가 다시 계산돼요.
                  </p>
                )}
              </>
            ) : (
              <p className="text-caption text-grey-600">
                방금 잡았다면 그대로 <b className="text-grey-800">지금 처치함</b>을 누르세요.{" "}
                <b className="text-grey-800">{user.username}</b> 이름으로 기록돼요.
              </p>
            )}
          </div>
        )}

        {!user && (
          <p className="text-caption text-grey-600">
            처치를 기록하려면 <b className="text-grey-800">로그인</b>이 필요해요. 계정이 없다면
            로그인 창에서 회원가입하면 바로 시작할 수 있어요.
          </p>
        )}

        {/* 실패를 조용히 넘기면 눌러도 아무 일도 안 일어나는 것처럼 보인다 */}
        {error != null && (
          <p role="alert" className="text-caption text-danger">
            {error instanceof Error ? error.message : "잠시 후 다시 시도해 주세요"}
          </p>
        )}
      </div>
    </Modal>
  );
}
