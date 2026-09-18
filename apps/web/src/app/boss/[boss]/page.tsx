import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BOSS_DEFINITIONS, findBossBySlug } from "@whale-dad/shared";
import { BossBoard } from "@/components/boss/boss-board";

interface BossPageProps {
  params: Promise<{ boss: string }>;
}

/** 보스 수가 적고 고정이라 전부 미리 만들어 둔다 */
export function generateStaticParams() {
  return BOSS_DEFINITIONS.map((boss) => ({ boss: boss.slug }));
}

export async function generateMetadata({ params }: BossPageProps): Promise<Metadata> {
  const { boss: slug } = await params;
  const boss = findBossBySlug(slug);

  return { title: boss ? `${boss.name} — whale-dad` : "whale-dad" };
}

export default async function BossPage({ params }: BossPageProps) {
  const { boss: slug } = await params;
  const boss = findBossBySlug(slug);

  if (!boss) notFound();

  return <BossBoard boss={boss} />;
}
