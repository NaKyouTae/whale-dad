import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { envNumber, envValue } from "../config/env";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: Pool;

  constructor() {
    // 풀 크기는 URL 파라미터가 아니라 여기서 정해진다.
    // driver adapter 를 쓰면 Prisma 가 URL 을 파싱하지 않으므로
    // ?connection_limit= / ?pgbouncer= 같은 값은 pg 가 그냥 무시한다.
    const pool = new Pool({
      connectionString: envValue("DATABASE_URL"),
      max: envNumber("DATABASE_POOL_MAX", 10),
    });
    super({ adapter: new PrismaPg(pool) });
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log("Prisma connected to Supabase PostgreSQL");
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }

  /** 헬스체크용 단순 핑 */
  async ping(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error("Database ping failed", error);
      return false;
    }
  }
}
