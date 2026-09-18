"use client";

import { useState } from "react";
import { BOSS_CHANNEL_MAX, BOSS_CHANNEL_MIN } from "@whale-dad/shared";
import { Button, Input, Modal } from "@/components/ui";

interface ChannelSettingsModalProps {
  activeCount: number;
  onClose: () => void;
  onSync: (input: { from: number; to: number; deactivateOutside: boolean }) => void;
  busy?: boolean;
  result?: string;
}

/**
 * 채널 목록은 DB(boss_channels)에 있고, 여기서 범위를 수동으로 바꾼다.
 * 게임 패치로 채널 수가 늘거나 줄었을 때 사용.
 */
export function ChannelSettingsModal({
  activeCount,
  onClose,
  onSync,
  busy,
  result,
}: ChannelSettingsModalProps) {
  const [from, setFrom] = useState(String(BOSS_CHANNEL_MIN));
  const [to, setTo] = useState(String(BOSS_CHANNEL_MAX));
  const [deactivateOutside, setDeactivateOutside] = useState(true);

  return (
    <Modal
      title="채널 설정"
      description={`현재 ${activeCount}개 채널`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" full onClick={onClose}>
            닫기
          </Button>
          <Button
            variant="primary"
            full
            disabled={busy || !from || !to}
            onClick={() => onSync({ from: Number(from), to: Number(to), deactivateOutside })}
          >
            적용
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-caption text-grey-600">
          채널 목록은 DB에 저장돼요. 범위를 바꾼 뒤 적용하면 없는 채널은 새로 만들고, 범위 밖 채널은
          목록에서 숨겨요. 이미 기록된 처치 시각은 그대로 둡니다.
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

        {result && <p className="text-caption text-brand-700">{result}</p>}
      </div>
    </Modal>
  );
}
