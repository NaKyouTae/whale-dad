import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  findBossBySlug,
  type AuthUser,
  type BossChannel,
  type BossChannelListResponse,
  type BossChannelSyncResult,
  type BossType,
} from "@whale-dad/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { BossChannelsService } from "./boss-channels.service";
import {
  BossChannelParamDto,
  BossParamDto,
  CreateBossChannelDto,
  ListBossChannelsQueryDto,
  RecordKillDto,
  SyncBossChannelsDto,
  UpdateBossChannelDto,
} from "./dto/boss-channel.dto";

/** URL 의 slug(`yeodumok`)를 DB enum(`YEODUMOK`)으로 옮긴다 */
function toBossType(slug: string): BossType {
  const boss = findBossBySlug(slug);

  if (!boss) {
    throw new NotFoundException(`알 수 없는 보스입니다: ${slug}`);
  }

  return boss.type;
}

@ApiTags("boss-channels")
@Controller("bosses/:boss/channels")
export class BossChannelsController {
  constructor(private readonly service: BossChannelsService) {}

  // 목록은 로그인 없이도 볼 수 있다. 바꾸는 동작만 로그인을 요구한다.
  @Get()
  @ApiOperation({ summary: "보스 채널 목록 + 출현 시각" })
  list(
    @Param() params: BossParamDto,
    @Query() query: ListBossChannelsQueryDto,
  ): Promise<BossChannelListResponse> {
    return this.service.list(toBossType(params.boss), query.includeInactive);
  }

  @Post("sync")
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "채널 범위 일괄 동기화 (예: 0~231) — 로그인 필요" })
  sync(
    @Param() params: BossParamDto,
    @Body() dto: SyncBossChannelsDto,
  ): Promise<BossChannelSyncResult> {
    return this.service.sync(toBossType(params.boss), dto);
  }

  @Post(":channel/kill")
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "처치 기록 (타이머 시작) — 로그인 필요" })
  recordKill(
    @Param() params: BossChannelParamDto,
    @Body() dto: RecordKillDto,
    @CurrentUser() user: AuthUser,
  ): Promise<BossChannel> {
    return this.service.recordKill(toBossType(params.boss), params.channel, user.id, dto.killedAt);
  }

  @Delete(":channel/kill")
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "타이머 초기화 — 로그인 필요" })
  resetTimer(@Param() params: BossChannelParamDto): Promise<BossChannel> {
    return this.service.resetTimer(toBossType(params.boss), params.channel);
  }

  @Patch(":channel")
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "채널 수정 (처치 시각 / 메모 / 노출 여부) — 로그인 필요" })
  update(
    @Param() params: BossChannelParamDto,
    @Body() dto: UpdateBossChannelDto,
    @CurrentUser() user: AuthUser,
  ): Promise<BossChannel> {
    return this.service.update(toBossType(params.boss), params.channel, dto, user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "채널 추가 — 로그인 필요" })
  create(@Param() params: BossParamDto, @Body() dto: CreateBossChannelDto): Promise<BossChannel> {
    return this.service.create(toBossType(params.boss), dto);
  }

  @Delete(":channel")
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "채널 삭제 — 로그인 필요" })
  remove(@Param() params: BossChannelParamDto): Promise<{ channel: number }> {
    return this.service.remove(toBossType(params.boss), params.channel);
  }
}
