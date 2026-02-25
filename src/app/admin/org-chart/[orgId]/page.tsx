import { prisma } from "@/lib/prisma";
import { GenSelector } from "./gen-selector";
import { OrgChartEditor } from "@/components/admin/org-chart-editor"; // 기존 컴포넌트

interface Props {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ gen?: string }>;
}

export default async function OrgChartPositionsPage({
  params,
  searchParams,
}: Props) {
  const { orgId } = await params;
  const { gen } = await searchParams;

  const generations = await prisma.generation.findMany({
    where: { organizationId: Number(orgId), deletedAt: null },
    orderBy: [{ isPrimary: "desc" }, { name: "desc" }],
  });

  if (generations.length === 0) return <div>기수를 먼저 생성해주세요.</div>;

  const currentGenId = gen ? Number(gen) : generations[0].id;

  // 해당 기수의 직책 뼈대 가져오기
  const positions = await prisma.position.findMany({
    where: { generationId: currentGenId },
    orderBy: { rank: "asc" },
  });

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">직책 세팅</h2>
      <p className="text-slate-500 mb-6 text-sm">
        이 기수에서 사용할 직책(회장, 국장 등)의 뼈대를 생성합니다.
      </p>

      <GenSelector
        generations={generations}
        currentGenId={String(currentGenId)}
      />

      {/* 직책 에디터 렌더링 */}
      <OrgChartEditor positions={positions} genId={currentGenId} />
    </div>
  );
}
