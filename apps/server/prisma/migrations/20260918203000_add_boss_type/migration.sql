-- 보스 종류(여두목 / 천구)를 추가한다.
-- 기존 행은 전부 여두목 보스 채널이므로 DEFAULT 로 채운다.
-- 채널 번호는 보스마다 따로 셈하므로 유니크 키를 (boss_type, channel) 로 바꾼다.

-- CreateEnum
CREATE TYPE "BossType" AS ENUM ('YEODUMOK', 'CHEONGU');

-- AlterTable
ALTER TABLE "boss_channels" ADD COLUMN     "boss_type" "BossType" NOT NULL DEFAULT 'YEODUMOK';

-- DropIndex
DROP INDEX "boss_channels_channel_key";

-- DropIndex
DROP INDEX "boss_channels_is_active_channel_idx";

-- CreateIndex
CREATE UNIQUE INDEX "boss_channels_boss_type_channel_key" ON "boss_channels"("boss_type", "channel");

-- CreateIndex
CREATE INDEX "boss_channels_boss_type_is_active_channel_idx" ON "boss_channels"("boss_type", "is_active", "channel");
