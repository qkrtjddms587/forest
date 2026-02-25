import { prisma } from "@/lib/prisma";
import { GenSelector } from "../gen-selector";
import { GreetingDashboard } from "./greeting-dashboard";

interface Props {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ gen?: string }>;
}

export default async function GreetingPage({ params, searchParams }: Props) {
  const { orgId } = await params;
  const { gen } = await searchParams;

  const generations = await prisma.generation.findMany({
    where: { organizationId: Number(orgId), deletedAt: null },
    orderBy: [{ isPrimary: "desc" }, { name: "desc" }],
  });

  if (generations.length === 0) return <div>기수를 먼저 생성해주세요.</div>;

  const currentGenId = gen ? Number(gen) : generations[0].id;

  // 🌟 1. 이미 등록된 인사말 목록 (순서대로 정렬)
  const greetings = await prisma.greeting.findMany({
    where: {
      affiliation: { generationId: currentGenId },
    },
    include: {
      affiliation: {
        include: {
          member: { select: { name: true } },
          Position: { select: { name: true } },
        },
      },
    },
    orderBy: { displayOrder: "asc" },
  });

  // 🌟 2. 인사말을 아직 작성하지 않은 활성 임원(회원) 목록
  const availableAffiliations = await prisma.affiliation.findMany({
    where: {
      generationId: currentGenId,
      status: "ACTIVE",
      greeting: null, // 💡 핵심: Greeting이 없는 사람만 필터링!
    },
    include: {
      member: { select: { name: true } },
      Position: { select: { name: true, rank: true } },
    },
    orderBy: [{ Position: { rank: "asc" } }, { member: { name: "asc" } }],
  });

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">인사말 관리</h2>
      <p className="text-sm text-slate-500 mb-6">
        조직도 상단에 노출될 임원(회장, 부회장 등)의 인사말을 대시보드에서
        직관적으로 관리하세요.
      </p>

      <GenSelector
        generations={generations}
        currentGenId={String(currentGenId)}
      />

      {/* 🌟 새로운 대시보드 컴포넌트 렌더링 */}
      <GreetingDashboard
        greetings={greetings}
        availableAffiliations={availableAffiliations as any}
      />
    </div>
  );
}
