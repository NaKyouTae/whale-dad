import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import type { AuthUser } from "@whale-dad/shared";
import { AuthService } from "./auth.service";

export const AUTH_COOKIE = "whale_dad_token";

function extractToken(req: Request): string | null {
  // cookie-parser 가 붙여주는 값은 타입상 any 라 unknown 으로 받아 좁힌다
  const fromCookie: unknown = req.cookies?.[AUTH_COOKIE];
  if (typeof fromCookie === "string" && fromCookie.length > 0) return fromCookie;

  // 쿠키를 못 쓰는 환경(예: 다른 도메인 클라이언트)을 위한 대비
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
}

async function resolveUser(req: Request, auth: AuthService): Promise<AuthUser | null> {
  const token = extractToken(req);
  if (!token) return null;

  const payload = auth.verifyToken(token);
  if (!payload) return null;

  // 토큰이 유효해도 계정이 지워졌을 수 있으므로 DB 를 확인한다
  return auth.findById(payload.sub);
}

/** 로그인 필수 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const user = await resolveUser(req, this.auth);

    if (!user) {
      throw new UnauthorizedException("로그인이 필요해요");
    }

    req.user = user;
    return true;
  }
}

/** 로그인해도 되고 안 해도 되는 엔드포인트용 — 있으면 붙여주고 없으면 통과 */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const user = await resolveUser(req, this.auth);
    if (user) req.user = user;
    return true;
  }
}
