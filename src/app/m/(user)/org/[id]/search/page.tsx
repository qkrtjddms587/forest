import { auth } from "@/auth";
import { getMembersAction } from "@/actions/member-actions";
import { InfiniteMemberList } from "@/components/member/infinite-member-list";
import { SearchInput } from "@/components/common/search-input"; // 👈 추가
import { prisma } from "@/lib/prisma";
import { FilterSelect } from "@/components/common/filter-select";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; gen?: string }>;
}

export default async function OrgSearchPage({ params, searchParams }: Props) {
  const session = await auth();

  // 1. 파라미터 언래핑 (await)
  const { id } = await params;
  const { q, gen } = await searchParams;

  const orgId = Number(id);
  const query = q || "";
  const genFilter = gen || "all";

  // 2. [DB 조회] 필터에 넣을 '기수 목록' 가져오기
  const generations = await prisma.generation.findMany({
    where: {
      organizationId: orgId,
      deletedAt: null,
    },
    orderBy: { name: "desc" }, // 최신 기수부터 표시
    select: { id: true, name: true },
  });

  // 3. 첫 페이지 회원 데이터 가져오기
  const firstPageData = await getMembersAction({
    orgId,
    page: 1,
    query,
    generationId: genFilter,
  });

  return (
    <div className="bg-slate-100 min-h-screen flex flex-col pb-20">
      {/* 상단 검색 및 필터 영역 */}
      <div className="fixed top-16 w-full z-30 bg-white shadow-sm border-b p-3 space-y-3 max-w-4xl mx-auto">
        <div className="flex gap-2">
          <FilterSelect
            placeholder="기수 선택"
            paramName="gen"
            options={generations}
          />
          <div className="flex-1">
            <SearchInput placeholder="이름, 회사, 전화번호" />
          </div>
        </div>
      </div>

      {/* 회원 리스트 영역 */}
      <div className="flex-1 pt-20 p-4 overflow-y-auto">
        <InfiniteMemberList
          initialData={firstPageData}
          orgId={orgId}
          searchQuery={query}
          generationId={genFilter}
        />
      </div>
    </div>
  );
}
