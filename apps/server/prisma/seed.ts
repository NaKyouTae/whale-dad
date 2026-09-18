import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { BOSS_DEFINITIONS } from "@whale-dad/shared";

/** 빈 문자열로 설정된 환경변수는 없는 것으로 취급한다 (prisma.config.ts 와 같은 이유) */
function env(name: string): string | undefined {
  const raw = process.env[name];
  const value = typeof raw === "string" ? raw.trim() : "";
  return value.length > 0 ? value : undefined;
}

const pool = new Pool({ connectionString: env("DIRECT_URL") ?? env("DATABASE_URL") });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  // 보스마다 따로 시드한다 — 채널 번호는 (bossType, channel) 로 유니크하다.
  for (const boss of BOSS_DEFINITIONS) {
    const channels = Array.from(
      { length: boss.channelMax - boss.channelMin + 1 },
      (_, i) => boss.channelMin + i,
    );

    // 이미 있는 채널의 타이머는 건드리지 않는다 (skipDuplicates)
    const { count: created } = await prisma.bossChannel.createMany({
      data: channels.map((channel) => ({ bossType: boss.type, channel })),
      skipDuplicates: true,
    });

    // 범위가 바뀐 뒤 다시 돌려도 목록이 맞도록, 범위 밖은 숨기고 범위 안은 되살린다.
    const inRange = { gte: boss.channelMin, lte: boss.channelMax };

    const { count: activated } = await prisma.bossChannel.updateMany({
      where: { bossType: boss.type, channel: inRange, isActive: false },
      data: { isActive: true },
    });

    const { count: deactivated } = await prisma.bossChannel.updateMany({
      where: { bossType: boss.type, isActive: true, NOT: { channel: inRange } },
      data: { isActive: false },
    });

    console.log(
      `${boss.name} 채널 시드 완료 — ${boss.channelMin}~${boss.channelMax} ` +
        `(신규 ${created}개 · 다시 켬 ${activated}개 · 숨김 ${deactivated}개)`,
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
