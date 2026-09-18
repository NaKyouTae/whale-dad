import { redirect } from "next/navigation";
import { DEFAULT_BOSS_SLUG } from "@whale-dad/shared";

/** 보스별 경로가 생기기 전의 주소 — 기본 보스로 넘긴다 (북마크가 살아 있도록) */
export default function BossIndexPage() {
  redirect(`/boss/${DEFAULT_BOSS_SLUG}`);
}
