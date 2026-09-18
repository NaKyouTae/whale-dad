import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type {
  AuthUser,
  BossChannel,
  BossChannelListResponse,
  BossChannelSyncResult,
} from "@whale-dad/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { BossChannelsService } from "./boss-channels.service";
import {
  ChannelParamDto,
  CreateBossChannelDto,
  ListBossChannelsQueryDto,
  RecordKillDto,
  SyncBossChannelsDto,
  UpdateBossChannelDto,
} from "./dto/boss-channel.dto";

@ApiTags("boss-channels")
@Controller("boss-channels")
export class BossChannelsController {
  constructor(private readonly service: BossChannelsService) {}

  // 목록은 로그인 없이도 볼 수 있다. 바꾸는 동작만 로그인을 요구한다.
  @Get()
  @ApiOperation({ summary: "여두목 보스 채널 목록 + 출현 시각" })
  list(@Query() query: ListBossChannelsQueryDto): Promise<BossChannelListResponse> {
    return this.service.list(query.includeInactive);
  }

  @Post(":channel/kill")
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "처치 기록 (타이머 시작) — 로그인 필요" })
  recordKill(
    @Param() params: ChannelParamDto,
    @Body() dto: RecordKillDto,
    @CurrentUser() user: AuthUser,
  ): Promise<BossChannel> {
    return this.service.recordKill(params.channel, user.id, dto.killedAt);
  }

  @Delete(":channel/kill")
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "타이머 초기화 — 로그인 필요" })
  resetTimer(@Param() params: ChannelParamDto): Promise<BossChannel> {
    return this.service.resetTimer(params.channel);
  }

  @Patch(":channel")
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "채널 수정 (처치 시각 / 메모 / 노출 여부) — 로그인 필요" })
  update(
    @Param() params: ChannelParamDto,
    @Body() dto: UpdateBossChannelDto,
    @CurrentUser() user: AuthUser,
  ): Promise<BossChannel> {
    return this.service.update(params.channel, dto, user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "채널 추가 — 로그인 필요" })
  create(@Body() dto: CreateBossChannelDto): Promise<BossChannel> {
    return this.service.create(dto);
  }

  @Delete(":channel")
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "채널 삭제 — 로그인 필요" })
  remove(@Param() params: ChannelParamDto): Promise<{ channel: number }> {
    return this.service.remove(params.channel);
  }

  @Post("sync")
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "채널 범위 일괄 동기화 (예: 1~231) — 로그인 필요" })
  sync(@Body() dto: SyncBossChannelsDto): Promise<BossChannelSyncResult> {
    return this.service.sync(dto);
  }
}
