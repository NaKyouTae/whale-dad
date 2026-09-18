import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: 'ts-node --compilerOptions {"module":"commonjs"} prisma/seed.ts',
  },
  datasource: {
    // Prisma CLI(migrate/studio)는 Supabase Direct connection(5432)을 사용한다.
    // 런타임은 PrismaService 가 DATABASE_URL(pooler, 6543)로 별도 연결.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
    // migrate dev / migrate diff 가 스키마를 대조할 때 쓰는 임시 DB.
    // 로컬은 같은 PostgreSQL 안의 별도 DB, Supabase 는 대시보드에서 따로 만들어 넣는다.
    shadowDatabaseUrl: process.env["SHADOW_DATABASE_URL"],
  },
});
