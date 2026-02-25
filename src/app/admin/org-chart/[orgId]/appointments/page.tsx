import { prisma } from "@/lib/prisma";
import { GenSelector } from "../gen-selector"; // 아까 만든 표 컴포넌트
import { RoleAssignmentBoard } from "./role-appointment-board";

interface Props {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ gen?: string }>;
}

export default async function AppointmentsPage({
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

  // 직책 목록
  const positions = await prisma.position.findMany({
    where: { generationId: currentGenId },
    orderBy: { rank: "asc" },
  });

  // 해당 기수에 가입된 회원 목록
  const members = await prisma.affiliation.findMany({
    where: {
      organizationId: Number(orgId),
      generationId: currentGenId,
      status: "ACTIVE",
    },
    include: { member: true, generation: true, Position: true },
    orderBy: { member: { name: "asc" } },
  });

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">회원 임명 관리</h2>
      <p className="text-sm text-slate-500 mb-6">
        회원들에게 직책을 배정하세요. 직책을 변경하면 즉시 저장됩니다.
      </p>

      <GenSelector
        generations={generations}
        currentGenId={String(currentGenId)}
      />

      <RoleAssignmentBoard members={members} positions={positions} />
    </div>
  );
}
