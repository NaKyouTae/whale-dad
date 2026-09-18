/**
 * 환경변수 읽기 도우미.
 *
 * Render 같은 플랫폼은 값을 비워두면 변수를 지우는 게 아니라 **빈 문자열**로 넣는다.
 * `??` 는 빈 문자열을 폴백하지 않으므로(`"" ?? "기본값"` → `""`) 반드시 이 함수를 쓸 것.
 */
export function envValue(name: string): string | undefined {
  const raw = process.env[name];
  if (typeof raw !== "string") return undefined;

  // 대시보드에서 붙여넣을 때 앞뒤 공백·줄바꿈이 섞여 들어오는 일이 잦다
  const value = raw.trim();
  return value.length > 0 ? value : undefined;
}

export function envString(name: string, fallback: string): string {
  return envValue(name) ?? fallback;
}

export function envNumber(name: string, fallback: number): number {
  const value = envValue(name);
  if (value === undefined) return fallback;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
