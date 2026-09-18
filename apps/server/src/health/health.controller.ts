import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { HealthStatus } from "@whale-dad/shared";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Render 헬스체크 엔드포인트 */
  @Get()
  @ApiOperation({ summary: "서버 / DB 상태 확인" })
  async check(): Promise<HealthStatus> {
    const dbUp = await this.prisma.ping();

    return {
      status: dbUp ? "ok" : "error",
      uptime: Math.floor(process.uptime()),
      database: dbUp ? "up" : "down",
      timestamp: new Date().toISOString(),
    };
  }
}
