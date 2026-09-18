-- 계정(username) + 비밀번호 로그인 도입, 처치 기록자 추가.
-- users 테이블은 아직 비어 있어 컬럼 교체가 안전하다.

-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable
ALTER TABLE "boss_channels" ADD COLUMN     "last_killed_by_id" UUID;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "avatar_url",
DROP COLUMN "email",
DROP COLUMN "name",
ADD COLUMN     "password_hash" TEXT NOT NULL,
ADD COLUMN     "username" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "boss_channels" ADD CONSTRAINT "boss_channels_last_killed_by_id_fkey" FOREIGN KEY ("last_killed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
