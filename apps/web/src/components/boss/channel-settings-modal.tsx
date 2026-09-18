"use client";

import { useState } from "react";
import type { AuthUser, BossDefinition } from "@whale-dad/shared";
import { Button, Input, Modal } from "@/components/ui";

interface ChannelSettingsModalProps {
  /** 어느 보스의 채널을 손보는지 — 기본 범위가 보스마다 다를 수 있다 */
  boss: BossDefinition;
  activeCount: number;
  /** 로그인한 계정. 채널 변경은 로그인이 필요하다 */
  user: AuthUser | null;
  onClose: () => void;
  onSync: (input: { from: number; to: number; deactivateOutside: boolean }) => void;
  onRequestSignIn: () => void;
  busy?: boolean;
  result?: string;
  /** 적용이 실패했을 때의 오류 */
  error?: unknown;
}

/**
 * 채널 목록은 DB(boss_channels)에 있고, 여기서 범위를 수동으로 바꾼다.
 * 게임 패치로 채널 수가 늘거나 줄었을 때 사용.
 */
export function ChannelSettingsModal({
  boss,
  activeCount,
  user,
  onClose,
  onSync,
  onRequestSignIn,
  busy,
  result,
  error,
}: ChannelSettingsModalProps) {
  const [from, setFrom] = useState(String(boss.channelMin));
  const [to, setTo] = useState(String(boss.channelMax));
  const [deactivateOutside, setDeactivateOutside] = useState(true);

  return (
    <Modal
      title="채널 설정"
      description={`${boss.name} · 현재 ${activeCount}개 채널`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" full onClick={onClose}>
            닫기
          </Button>
          {user ? (
            <Button
              variant="primary"
              full
              disabled={busy || from === "" || to === ""}
              onClick={() => onSync({ from: Number(from), to: Number(to), deactivateOutside })}
            >
              {busy ? "적용 중…" : "적용"}
            </Button>
          ) : (
            <Button variant="primary" full onClick={onRequestSignIn}>
              로그인
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-caption text-grey-600">
          채널 목록은 DB에 저장돼요. 범위를 바꾼 뒤 적용하면 없는 채널은 새로 만들고, 범위 밖 채널은
          목록에서 숨겨요. 이미 기록된 처치 시각은 그대로 둡니다. 다른 보스의 채널은 건드리지
          않아요.
        </p>

        <div className="flex items-end gap-2">
          <Input
            label="시작 채널"
            type="number"
            min={0}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <span className="pb-4 text-grey-400">~</span>
          <Input
            label="끝 채널"
            type="number"
            min={0}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 text-caption text-grey-700">
          <input
            type="checkbox"
            checked={deactivateOutside}
            onChange={(e) => setDeactivateOutside(e.target.checked)}
            className="size-4 accent-brand-500"
          />
          범위 밖 채널은 목록에서 숨기기
        </label>

        {!user && (
          <p className="text-caption text-grey-600">
            채널을 바꾸려면 <b className="text-grey-800">로그인</b>이 필요해요.
          </p>
        )}

        {result && <p className="text-caption text-brand-700 dark:text-brand-300">{result}</p>}

        {/* 실패를 조용히 넘기면 적용을 눌러도 아무 일 없는 것처럼 보인다 */}
        {error != null && (
          <p role="alert" className="text-caption text-danger">
            {error instanceof Error ? error.message : "잠시 후 다시 시도해 주세요"}
          </p>
        )}
      </div>
    </Modal>
  );
}
