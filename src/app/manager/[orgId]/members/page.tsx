import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, ShieldCheck } from "lucide-react";
import { FilterSelect } from "@/components/common/filter-select";
import { SearchInput } from "@/components/common/search-input";
import { BulkCreateMemeberDialog } from "@/app/admin/members/bulk-create-member-dialog";
import { CreateMemberDialog } from "@/app/admin/members/create-member-dialog";
import { MemberTable } from "@/app/admin/members/member-table";

interface Props {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{
    q?: string;
    genId?: string;
    status?: string;
  }>;
}

export default async function OrgMembersPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // 🌟 1. params에서 orgId 추출
  const { orgId: orgIdString } = await params;
  if (!orgIdString || isNaN(Number(orgIdString))) return notFound();

  const orgId = Number(orgIdString);
  const { q, genId, status } = await searchParams;

  // 🌟 2. 해당 단체 정보 및 필요 데이터만 쏙 뽑아오기
  const [organization, generations, positions, stats] = await Promise.all([
    // 현재 단체 이름 가져오기 (타이틀용)
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true },
    }),

    // 이 단체에 속한 기수만 가져오기
    prisma.generation.findMany({
      where: {
        organizationId: orgId,
        deletedAt: null,
      },
      select: { id: true, name: true },
      orderBy: { name: "desc" },
    }),

    prisma.position.findMany({ orderBy: { rank: "asc" } }),

    // 🌟 이 단체(organizationId)의 소속 정보만 통계 내기
    prisma.affiliation.groupBy({
      by: ["status"],
      where: { organizationId: orgId },
      _count: true,
    }),
  ]);

  if (!organization) return notFound();

  const pendingCount = stats.find((s) => s.status === "PENDING")?._count || 0;
  const activeCount = stats.find((s) => s.status === "ACTIVE")?._count || 0;
  const totalCount = pendingCount + activeCount;

  // 🌟 3. Member 조회 (이 단체에 소속된 회원만!)
  const members = await prisma.member.findMany({
    where: {
      name: { contains: q || "" },
      affiliations: {
        some: {
          organizationId: orgId, // 👈 핵심: 이 단체에 소속된 기록이 무조건 있어야 함
          generation: { deletedAt: null },
          ...(genId && { generationId: Number(genId) }),
          ...(status && { status: status as any }),
        },
      },
    },
    include: {
      affiliations: {
        // 테이블에서 보여줄 때도 이 단체의 소속 정보만 보여주도록 필터링
        where: {
          organizationId: orgId,
          generation: { deletedAt: null },
        },
        include: {
          organization: true,
          generation: true,
          Position: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { name: "asc" },
    take: 20,
  });

  // 모달에 넘겨주기 위해 배열 형태로 감싸기 (기존 컴포넌트 재활용)
  const singleOrgArray = [organization];

  return (
    <div className=" bg-slate-50/50 space-y-6 max-w-7xl mx-auto">
      {/* 헤더 타이틀 */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-xl font-bold">회원 관리</span>
        </h2>
        <p className="text-slate-500 mt-2 text-sm">
          {organization.name} 단체에 등록된 회원 목록을 확인하고 권한 및 상태를
          관리하세요.
        </p>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="단체 회원수"
          count={totalCount}
          icon={<Users className="text-blue-600" />}
        />
        <StatCard
          title="미가입 회원수"
          count={pendingCount}
          icon={<UserPlus className="text-orange-500" />}
          highlight={pendingCount > 0}
        />
        <StatCard
          title="활동 회원"
          count={activeCount}
          icon={<ShieldCheck className="text-green-600" />}
        />
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-xl font-bold text-slate-800">
              회원 목록
            </CardTitle>

            <div className="flex flex-wrap items-center gap-2">
              {/* 🌟 소속 필터는 이미 이 페이지가 단체 종속이므로 제거했습니다! */}
              <FilterSelect
                placeholder="기수"
                paramName="genId"
                options={generations}
              />
              <FilterSelect
                placeholder="상태"
                paramName="status"
                options={[
                  { id: "PENDING", name: "승인대기" },
                  { id: "ACTIVE", name: "활동중" },
                ]}
              />
              <SearchInput placeholder="이름 검색..." />

              {/* 모달에 현재 단체(organization) 하나만 배열로 전달하여 고정시킴 */}
              <div className="ml-2 border-l pl-4 space-x-2 border-slate-200">
                <BulkCreateMemeberDialog
                  organizations={singleOrgArray}
                  generations={generations}
                />
                <CreateMemberDialog
                  organizations={singleOrgArray}
                  generations={generations}
                  positions={positions}
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <MemberTable
            initialMembers={members}
            searchParams={{ q, orgId: String(orgId), genId, status }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, count, icon, highlight = false }: any) {
  return (
    <Card
      className={`border-none shadow-sm ${
        highlight ? "bg-orange-50 ring-1 ring-orange-200" : "bg-white"
      }`}
    >
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-slate-900">{count}</span>
            <span className="text-sm font-bold text-slate-400">명</span>
          </div>
        </div>
        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
