/**
 * 부팅 시 환경변수 검증. 누락되면 즉시 실패시켜 런타임에서 터지는 것을 막는다.
 *
 * DB 없이는 아무것도 못 하므로 DATABASE_URL 만 필수다.
 * SUPABASE_* 는 Storage 를 쓸 때만 필요하므로 선택 — 없으면 SupabaseService 를 쓸 때 터진다.
 */
const REQUIRED = ["DATABASE_URL", "JWT_SECRET"] as const;

export interface Env {
  NODE_ENV: string;
  PORT: number;
  CORS_ORIGINS: string;
  DATABASE_URL: string;
  DIRECT_URL?: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_STORAGE_BUCKET: string;
}

/** process.env 값은 항상 string 이지만 타입상 unknown 이므로 좁혀서 읽는다. */
function str(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function optionalStr(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function validateEnv(config: Record<string, unknown>): Env {
  const missing = REQUIRED.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(
      [
        `필수 환경변수가 없습니다: ${missing.join(", ")}`,
        "",
        "apps/server/.env 를 만들어 주세요:",
        "  cp apps/server/.env.example apps/server/.env",
        "",
        "로컬 개발용 PostgreSQL 은 이 명령으로 띄울 수 있습니다:",
        "  pnpm db:up",
        "",
        "JWT_SECRET 은 이렇게 만들 수 있습니다:",
        "  openssl rand -hex 32",
      ].join("\n"),
    );
  }

  return {
    NODE_ENV: str(config.NODE_ENV, "development"),
    PORT: Number(config.PORT ?? 20000),
    CORS_ORIGINS: str(config.CORS_ORIGINS, "http://localhost:20001"),
    DATABASE_URL: str(config.DATABASE_URL, ""),
    DIRECT_URL: optionalStr(config.DIRECT_URL),
    JWT_SECRET: str(config.JWT_SECRET, ""),
    JWT_EXPIRES_IN: str(config.JWT_EXPIRES_IN, "30d"),
    SUPABASE_URL: optionalStr(config.SUPABASE_URL),
    SUPABASE_ANON_KEY: optionalStr(config.SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: optionalStr(config.SUPABASE_SERVICE_ROLE_KEY),
    SUPABASE_STORAGE_BUCKET: str(config.SUPABASE_STORAGE_BUCKET, "whale-dad"),
  };
}
