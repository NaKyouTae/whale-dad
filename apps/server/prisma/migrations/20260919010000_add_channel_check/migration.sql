-- 출현 시각이 지났는데 가봤더니 보스가 없더라 — 그 "확인" 을 기록한다.
-- 처치 기록과 달리 타이머를 돌리지는 않고, 언제 누가 가봤는지만 남긴다.

-- AlterTable
ALTER TABLE "boss_channels" ADD COLUMN     "last_checked_at" TIMESTAMP(3),
ADD COLUMN     "last_checked_by_id" UUID;

-- AddForeignKey
ALTER TABLE "boss_channels" ADD CONSTRAINT "boss_channels_last_checked_by_id_fkey" FOREIGN KEY ("last_checked_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
