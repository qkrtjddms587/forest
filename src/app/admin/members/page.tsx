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

  // 1. 필터용 기본 데이터 로드
  const [organizations, generations, stats] = await Promise.all([
    prisma.organization.findMany({
      select: { id: true, name: true },
      where: { deletedAt: null },
    }),
    prisma.generation.findMany({ select: { id: true, name: true } }),
    prisma.affiliation.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  const pendingCount = stats.find((s) => s.status === "PENDING")?._count || 0;
  const activeCount = stats.find((s) => s.status === "ACTIVE")?._count || 0;

  // 2. Member 기준 쿼리 (소속 정보 포함)
  const members = await prisma.member.findMany({
    where: {
      name: { contains: q || "" },
      affiliations: {
        some: {
          // 소속 이력 자체가 유효하고
          organization: { deletedAt: null }, // 🌟 소속된 조직이 삭제되지 않았으며
          generation: { deletedAt: null }, // 🌟 소속된 기수가 삭제되지 않은 경우

          // 필터 조건들
          ...(orgId && { organizationId: Number(orgId) }),
          ...(genId && { generationId: Number(genId) }),
          ...(status && { status: status as any }),
        },
      },
    },
    include: {
      affiliations: {
        where: {
          organization: { deletedAt: null }, // 🌟 결과 목록에서도 삭제된 조직 데이터 제외
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
  });

  return (
    <div className="p-6 bg-slate-50/50 min-h-screen space-y-6">
      {/* 요약 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="전체 회원수"
          count={members.length}
          icon={<Users className="text-blue-600" />}
        />
        <StatCard
          title="승인 대기중"
          count={pendingCount}
          icon={<UserPlus className="text-orange-500" />}
          highlight={pendingCount > 0}
        />
        <StatCard
          title="활동 임원/정회원"
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
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="pl-6 w-[180px]">
                    이름 / 연락처
                  </TableHead>
                  <TableHead>현재 소속 및 활동 이력</TableHead>
                  <TableHead className="w-[120px]">최근 활동일</TableHead>
                  <TableHead className="pr-6 text-right w-[100px]">
                    액션
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow
                    key={member.id}
                    className="hover:bg-slate-50/30 transition-colors group"
                  >
                    <TableCell className="pl-6 font-medium">
                      <div className="flex flex-col">
                        <span className="text-slate-900 font-bold">
                          {member.name}
                        </span>
                        <span className="text-xs text-slate-400 font-normal">
                          {member.phone || "연락처 미등록"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {member.affiliations.map((aff) => (
                          <div
                            key={aff.id}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] font-medium transition-all
                              ${
                                aff.status === "ACTIVE"
                                  ? "bg-white border-slate-200 text-slate-700 shadow-sm"
                                  : "bg-slate-100 text-slate-400 border-transparent opacity-60"
                              }`}
                          >
                            <span
                              className={
                                aff.status === "ACTIVE" ? "text-blue-600" : ""
                              }
                            >
                              {aff.organization.name}
                            </span>
                            <span className="text-slate-400">|</span>
                            <span>{aff.generation.name}</span>

                            {aff.Position && (
                              <Badge className="h-4 px-1 text-[9px] bg-slate-800 hover:bg-slate-800 text-white border-none">
                                {aff.Position.name}
                              </Badge>
                            )}

                            {aff.status === "PENDING" && (
                              <span className="animate-pulse text-orange-500 font-bold ml-1">
                                ● 대기
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-slate-500">
                      {member.affiliations[0]
                        ? new Date(
                            member.affiliations[0].createdAt
                          ).toLocaleDateString()
                        : "-"}
                    </TableCell>

                    <TableCell className="pr-6 text-right">
                      <MemberDetailSheet member={member}>
                        <button className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors underline-offset-4 hover:underline">
                          상세관리
                        </button>
                      </MemberDetailSheet>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {members.length === 0 && (
            <div className="py-20 text-center text-slate-400 text-sm">
              검색 결과에 해당하는 회원이 없습니다.
            </div>
          )}
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
