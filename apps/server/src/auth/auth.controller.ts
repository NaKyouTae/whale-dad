import { Body, Controller, Get, HttpCode, Post, Res, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { CookieOptions, Response } from "express";
import type { AuthUser } from "@whale-dad/shared";
import { AuthService } from "./auth.service";
import { CurrentUser } from "./current-user.decorator";
import { SignInDto, SignUpDto } from "./dto/auth.dto";
import { AUTH_COOKIE, JwtAuthGuard, OptionalJwtAuthGuard } from "./jwt-auth.guard";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post("sign-up")
  @ApiOperation({ summary: "회원가입 (성공 시 곧바로 로그인 상태가 된다)" })
  async signUp(
    @Body() dto: SignUpDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthUser> {
    const { user, token } = await this.auth.signUp(dto);
    res.cookie(AUTH_COOKIE, token, this.cookieOptions());
    return user;
  }

  @Post("sign-in")
  @HttpCode(200)
  @ApiOperation({ summary: "로그인" })
  async signIn(
    @Body() dto: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthUser> {
    const { user, token } = await this.auth.signIn(dto);
    res.cookie(AUTH_COOKIE, token, this.cookieOptions());
    return user;
  }

  @Post("sign-out")
  @HttpCode(200)
  @ApiOperation({ summary: "로그아웃" })
  signOut(@Res({ passthrough: true }) res: Response): { ok: true } {
    // clearCookie 는 maxAge 를 쓰지 않으므로 나머지 속성만 맞춰준다
    res.clearCookie(AUTH_COOKIE, this.cookieOptions(false));
    return { ok: true };
  }

  @Get("me")
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: "현재 로그인한 계정 (로그인 안 했으면 null)" })
  me(@CurrentUser() user?: AuthUser): AuthUser | null {
    return user ?? null;
  }

  @Get("me/strict")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "현재 로그인한 계정 (로그인 안 했으면 401)" })
  meStrict(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }

  private cookieOptions(withMaxAge = true): CookieOptions {
    const isProd = this.config.get<string>("NODE_ENV") === "production";

    return {
      httpOnly: true,
      // 개발은 localhost 끼리라 같은 site(포트만 다름) → lax 로 충분하다.
      // 운영은 Vercel ↔ Render 로 site 가 달라 none + secure 가 필요하다.
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
      path: "/",
      ...(withMaxAge && { maxAge: this.auth.cookieMaxAge }),
    };
  }
}
