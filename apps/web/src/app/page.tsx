import { redirect } from "next/navigation";
import { DEFAULT_BOSS_SLUG } from "@whale-dad/shared";

export default function HomePage() {
  redirect(`/boss/${DEFAULT_BOSS_SLUG}`);
}
