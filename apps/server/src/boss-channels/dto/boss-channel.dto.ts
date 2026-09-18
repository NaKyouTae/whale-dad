import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

/** 채널 번호 상한. 게임 패치로 늘어날 수 있어 넉넉히 잡는다. */
const CHANNEL_HARD_MAX = 9999;

export class ChannelParamDto {
  @ApiProperty({ example: 42, description: "게임 내 채널 번호" })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(CHANNEL_HARD_MAX)
  channel!: number;
}

export class RecordKillDto {
  @ApiPropertyOptional({
    description: "처치 시각 (ISO). 생략하면 서버의 현재 시각을 쓴다.",
    example: "2026-09-18T02:30:00.000Z",
  })
  @IsOptional()
  @IsDateString()
  killedAt?: string;
}

export class UpdateBossChannelDto {
  @ApiPropertyOptional({
    description: "마지막 처치 시각 (ISO). null 을 보내면 타이머를 초기화한다.",
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  lastKilledAt?: string | null;

  @ApiPropertyOptional({ description: "메모", nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  memo?: string | null;

  @ApiPropertyOptional({ description: "목록 노출 여부" })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateBossChannelDto {
  @ApiProperty({ example: 232 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(CHANNEL_HARD_MAX)
  channel!: number;

  @ApiPropertyOptional({ description: "메모" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  memo?: string;
}

export class SyncBossChannelsDto {
  @ApiProperty({ example: 0, description: "시작 채널 번호 (포함)" })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(CHANNEL_HARD_MAX)
  from!: number;

  @ApiProperty({ example: 231, description: "끝 채널 번호 (포함)" })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(CHANNEL_HARD_MAX)
  to!: number;

  @ApiPropertyOptional({
    description: "범위 밖 채널을 비활성화할지 여부. 기본 true.",
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  deactivateOutside?: boolean;
}

export class ListBossChannelsQueryDto {
  @ApiPropertyOptional({
    description: "비활성 채널까지 포함할지 여부. 기본 false.",
    default: false,
  })
  @IsOptional()
  // 쿼리스트링은 문자열로 들어오므로 Boolean("false") === true 문제를 피해 직접 파싱한다.
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  includeInactive?: boolean;
}
