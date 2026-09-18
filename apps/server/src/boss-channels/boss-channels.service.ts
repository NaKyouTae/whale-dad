import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleInit,
} from "@nestjs/common";
import type { BossChannel as BossChannelRow, User } from "@prisma/client";
import {
  BOSS_CHANNEL_MAX,
  BOSS_CHANNEL_MIN,
  BOSS_SPAWN_MAX_HOURS,
  BOSS_SPAWN_MIN_HOURS,
  HOUR_MS,
  type BossChannel,
  type BossChannelListResponse,
  type BossChannelSyncResult,
} from "@whale-dad/shared";
import { PrismaService } from "../prisma/prisma.service";
import type {
  CreateBossChannelDto,
  SyncBossChannelsDto,
  UpdateBossChannelDto,
} from "./dto/boss-channel.dto";

/** 채널을 읽을 때 늘 같이 가져오는 처치자 정보 */
const KILLED_BY = { lastKilledBy: { select: { id: true, username: true } } } as const;

@Injectable()
export class BossChannelsService implements OnModuleInit {
  private readonly logger = new Logger(BossChannelsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 기본 범위(0~231)에서 **빠진 채널만** 채운다.
   *
   * 첫 배포에는 전체를 만들고, 이후 배포에는 대개 아무것도 하지 않는다.
   * 이미 있는 채널은 활성/비활성 상태를 그대로 두므로, 화면에서 범위를 좁혀둔 설정을
   * 배포할 때마다 되돌리지 않는다 (좁히기는 삭제가 아니라 비활성화로 동작한다).
   */
  async onModuleInit(): Promise<void> {
    const wanted = Array.from(
      { length: BOSS_CHANNEL_MAX - BOSS_CHANNEL_MIN + 1 },
      (_, i) => BOSS_CHANNEL_MIN + i,
    );

    const existing = await this.prisma.bossChannel.findMany({ select: { channel: true } });
    const existingSet = new Set(existing.map((row) => row.channel));
    const missing = wanted.filter((channel) => !existingSet.has(channel));

    if (missing.length === 0) return;

    const { count } = await this.prisma.bossChannel.createMany({
      data: missing.map((channel) => ({ channel })),
      skipDuplicates: true,
    });

    this.logger.log(
      `기본 범위(${BOSS_CHANNEL_MIN}~${BOSS_CHANNEL_MAX})에서 빠진 채널을 생성했습니다 — ${count}개` +
        (count <= 10 ? ` [${missing.join(", ")}]` : ""),
    );
  }

  async list(includeInactive = false): Promise<BossChannelListResponse> {
    const rows = await this.prisma.bossChannel.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { channel: "asc" },
      include: KILLED_BY,
    });

    return {
      serverNow: new Date().toISOString(),
      spawn: { minHours: BOSS_SPAWN_MIN_HOURS, maxHours: BOSS_SPAWN_MAX_HOURS },
      channels: rows.map((row) => this.toDto(row)),
    };
  }

  /** 처치 기록 — 이 채널의 타이머를 다시 돌린다. 누가 기록했는지도 남긴다. */
  async recordKill(channel: number, userId: string, killedAt?: string): Promise<BossChannel> {
    await this.ensureExists(channel);

    const row = await this.prisma.bossChannel.update({
      where: { channel },
      data: {
        lastKilledAt: killedAt ? new Date(killedAt) : new Date(),
        lastKilledById: userId,
      },
      include: KILLED_BY,
    });

    return this.toDto(row);
  }

  async update(channel: number, dto: UpdateBossChannelDto, userId?: string): Promise<BossChannel> {
    await this.ensureExists(channel);

    const row = await this.prisma.bossChannel.update({
      where: { channel },
      include: KILLED_BY,
      data: {
        // undefined 는 "변경 없음", null 은 "값 비우기" 로 구분한다.
        ...(dto.lastKilledAt !== undefined && {
          lastKilledAt: dto.lastKilledAt === null ? null : new Date(dto.lastKilledAt),
          // 시각을 지우면 기록자도 함께 지운다
          lastKilledById: dto.lastKilledAt === null ? null : (userId ?? undefined),
        }),
        ...(dto.memo !== undefined && { memo: dto.memo }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return this.toDto(row);
  }

  /** 타이머 초기화 — 처치 기록만 지운다. */
  async resetTimer(channel: number): Promise<BossChannel> {
    await this.ensureExists(channel);

    const row = await this.prisma.bossChannel.update({
      where: { channel },
      data: { lastKilledAt: null, lastKilledById: null },
      include: KILLED_BY,
    });

    return this.toDto(row);
  }

  async create(dto: CreateBossChannelDto): Promise<BossChannel> {
    const existing = await this.prisma.bossChannel.findUnique({ where: { channel: dto.channel } });

    if (existing) {
      throw new ConflictException(`이미 존재하는 채널입니다: ${dto.channel}`);
    }

    const row = await this.prisma.bossChannel.create({
      data: { channel: dto.channel, memo: dto.memo },
      include: KILLED_BY,
    });

    return this.toDto(row);
  }

  async remove(channel: number): Promise<{ channel: number }> {
    await this.ensureExists(channel);
    await this.prisma.bossChannel.delete({ where: { channel } });
    return { channel };
  }

  /**
   * 채널 범위를 통째로 맞춘다.
   * 게임 패치로 채널 수가 바뀌었을 때 1~231 같은 범위를 한 번에 재구성하는 용도.
   * 기존 채널의 타이머는 건드리지 않는다.
   */
  async sync(dto: SyncBossChannelsDto): Promise<BossChannelSyncResult> {
    const from = Math.min(dto.from, dto.to);
    const to = Math.max(dto.from, dto.to);
    const wanted = Array.from({ length: to - from + 1 }, (_, i) => from + i);

    const existing = await this.prisma.bossChannel.findMany({ select: { channel: true } });
    const existingSet = new Set(existing.map((row) => row.channel));
    const missing = wanted.filter((channel) => !existingSet.has(channel));

    const { count: created } = await this.prisma.bossChannel.createMany({
      data: missing.map((channel) => ({ channel })),
      skipDuplicates: true,
    });

    const { count: activated } = await this.prisma.bossChannel.updateMany({
      where: { channel: { gte: from, lte: to }, isActive: false },
      data: { isActive: true },
    });

    const deactivateOutside = dto.deactivateOutside ?? true;
    const { count: deactivated } = deactivateOutside
      ? await this.prisma.bossChannel.updateMany({
          where: { isActive: true, NOT: { channel: { gte: from, lte: to } } },
          data: { isActive: false },
        })
      : { count: 0 };

    const total = await this.prisma.bossChannel.count({ where: { isActive: true } });

    return { created, activated, deactivated, total };
  }

  private async ensureExists(channel: number): Promise<void> {
    const found = await this.prisma.bossChannel.findUnique({
      where: { channel },
      select: { id: true },
    });

    if (!found) {
      throw new NotFoundException(`채널을 찾을 수 없습니다: ${channel}`);
    }
  }

  /**
   * 젠 구간은 저장하지 않고 lastKilledAt 에서 계산해 내려준다.
   * 상태(WAITING/WINDOW/OVERDUE) 판정은 클라이언트가 매초 다시 하므로 여기서 하지 않는다.
   */
  private toDto(
    row: BossChannelRow & { lastKilledBy: Pick<User, "id" | "username"> | null },
  ): BossChannel {
    const killedAt = row.lastKilledAt;

    return {
      id: row.id,
      channel: row.channel,
      lastKilledAt: killedAt?.toISOString() ?? null,
      lastKilledBy: row.lastKilledBy,
      earliestSpawnAt: killedAt
        ? new Date(killedAt.getTime() + BOSS_SPAWN_MIN_HOURS * HOUR_MS).toISOString()
        : null,
      latestSpawnAt: killedAt
        ? new Date(killedAt.getTime() + BOSS_SPAWN_MAX_HOURS * HOUR_MS).toISOString()
        : null,
      memo: row.memo,
      isActive: row.isActive,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
