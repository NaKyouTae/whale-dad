import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Render 같은 플랫폼은 값을 비워두면 변수를 지우는 게 아니라 **빈 문자열**로 넣는다.
 * `??` 는 빈 문자열을 폴백하지 않으므로(`"" ?? x` → `""`) 직접 걸러낸다.
 * 붙여넣을 때 섞여 들어오는 앞뒤 공백·줄바꿈도 함께 정리한다.
 */
function env(name: string): string | undefined {
  const raw = process.env[name];
  if (typeof raw !== "string") return undefined;

  const value = raw.trim();
  return value.length > 0 ? value : undefined;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: 'ts-node --compilerOptions {"module":"commonjs"} prisma/seed.ts',
  },
  datasource: {
    // Prisma CLI(migrate/studio)용 연결.
    // DIRECT_URL 을 따로 두는 이유: 런타임이 Transaction pooler 를 쓰는 구성에서는
    // 그 연결로 마이그레이션을 돌릴 수 없기 때문. Session pooler 하나만 쓴다면 비워둬도 된다.
    url: env("DIRECT_URL") ?? env("DATABASE_URL"),
    // migrate dev / migrate diff 가 스키마를 대조할 때 쓰는 임시 DB (로컬 전용)
    shadowDatabaseUrl: env("SHADOW_DATABASE_URL"),
  },
});
