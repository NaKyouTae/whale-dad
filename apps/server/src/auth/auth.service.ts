import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { AuthUser } from "@whale-dad/shared";
import { PrismaService } from "../prisma/prisma.service";
import { hashPassword, verifyPassword } from "./password";
import type { SignInDto, SignUpDto } from "./dto/auth.dto";

export interface JwtPayload {
  sub: string;
  username: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** 회원가입 후 곧바로 로그인 상태가 되도록 토큰까지 함께 돌려준다 */
  async signUp(dto: SignUpDto): Promise<{ user: AuthUser; token: string }> {
    const exists = await this.prisma.user.findUnique({
      where: { username: dto.username },
      select: { id: true },
    });

    if (exists) {
      throw new ConflictException("이미 쓰고 있는 계정이에요");
    }

    const user = await this.prisma.user.create({
      data: { username: dto.username, passwordHash: await hashPassword(dto.password) },
      select: { id: true, username: true },
    });

    return { user, token: this.sign(user) };
  }

  async signIn(dto: SignInDto): Promise<{ user: AuthUser; token: string }> {
    const found = await this.prisma.user.findUnique({
      where: { username: dto.username },
      select: { id: true, username: true, passwordHash: true },
    });

    // 계정이 없는 경우와 비밀번호가 틀린 경우를 구분해 알려주지 않는다
    if (!found || !(await verifyPassword(dto.password, found.passwordHash))) {
      throw new UnauthorizedException("계정 또는 비밀번호가 맞지 않아요");
    }

    const user: AuthUser = { id: found.id, username: found.username };
    return { user, token: this.sign(user) };
  }

  async findById(id: string): Promise<AuthUser | null> {
    return this.prisma.user.findUnique({ where: { id }, select: { id: true, username: true } });
  }

  verifyToken(token: string): JwtPayload | null {
    try {
      return this.jwt.verify<JwtPayload>(token);
    } catch {
      return null;
    }
  }

  /** 쿠키 만료와 토큰 만료를 맞추기 위한 값 (ms) */
  get cookieMaxAge(): number {
    // 빈 문자열도 "없음"으로 보려면 ?? 가 아니라 || 를 써야 한다
    const raw = this.config.get<string>("JWT_EXPIRES_IN") || "30d";
    const match = /^(\d+)([smhd])$/.exec(raw);
    if (!match) return 30 * 24 * 60 * 60 * 1000;

    const unit = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2]] ?? 86_400_000;
    return Number(match[1]) * unit;
  }

  private sign(user: AuthUser): string {
    const payload: JwtPayload = { sub: user.id, username: user.username };
    return this.jwt.sign(payload);
  }
}
