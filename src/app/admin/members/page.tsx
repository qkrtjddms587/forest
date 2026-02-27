import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, ShieldCheck } from "lucide-react";
import { FilterSelect } from "@/components/common/filter-select";
import { SearchInput } from "@/components/common/search-input";
import { MemberDetailSheet } from "@/components/admin/member-detail-sheet";
import { CreateMemberDialog } from "./create-member-dialog";
import { BulkCreateMemeberDialog } from "./bulk-create-member-dialog";
import { MemberTable } from "./member-table";

// 🌟 추가된 모달

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    orgId?: string;
    genId?: string;
    status?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { q, orgId, genId, status } = await searchParams;

  // 1. 필터 및 모달용 기본 데이터 로드 (positions 추가)
  const [organizations, generations, positions, stats] = await Promise.all([
    prisma.organization.findMany({
      select: { id: true, name: true },
      where: { deletedAt: null },
    }),

    // 🌟 핵심 변경: orgId가 있으면 해당 소속의 기수만, 없으면 전체 기수를 가져옴
    prisma.generation.findMany({
      where: {
        deletedAt: null,
        ...(orgId && { organizationId: Number(orgId) }), // 👈 여기가 포인트!
      },
      select: { id: true, name: true },
      orderBy: { name: "desc" }, // 기수는 보통 숫자가 큰(최신) 순서대로 보는 게 편합니다.
    }),

    prisma.position.findMany({ orderBy: { rank: "asc" } }),
    prisma.affiliation.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  const pendingCount = stats.find((s) => s.status === "PENDING")?._count || 0;
  const activeCount = stats.find((s) => s.status === "ACTIVE")?._count || 0;

  const totalCount = pendingCount + activeCount;

  // 2. Member 기준 쿼리
  const members = await prisma.member.findMany({
    where: {
      name: { contains: q || "" },
      affiliations: {
        some: {
          organization: { deletedAt: null },
          generation: { deletedAt: null },
          ...(orgId && { organizationId: Number(orgId) }),
          ...(genId && { generationId: Number(genId) }),
          ...(status && { status: status as any }),
        },
      },
    },
    include: {
      affiliations: {
        where: {
          organization: { deletedAt: null },
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
    take: 20, // 👈 무한 스크롤 초기 데이터
  });

  return (
    <div className="p-6 bg-slate-50/50 min-h-screen space-y-6">
      {/* 요약 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="전체 회원수"
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
          title="활동 유료회원"
          count={activeCount}
          icon={<ShieldCheck className="text-green-600" />}
        />
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-xl font-bold text-slate-800">
              회원 통합 관리
            </CardTitle>

            <div className="flex flex-wrap items-center gap-2">
              <FilterSelect
                placeholder="소속"
                paramName="orgId"
                options={organizations}
              />
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

              {/* 🌟 회원 생성 버튼 (모달) 추가 */}
              <div className="ml-2 border-l pl-4 space-x-2 border-slate-200">
                <BulkCreateMemeberDialog
                  organizations={organizations}
                  generations={generations}
                />
                <CreateMemberDialog
                  organizations={organizations}
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
            searchParams={{ q, orgId, genId, status }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// 스태츠 카드 컴포넌트
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
