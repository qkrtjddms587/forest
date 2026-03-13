import { IntroTabs } from "@/components/common/intro-tabs";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ gen?: string }>;
}

export default async function UserOrgChartPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const orgId = Number(id);
  const { gen } = await searchParams;

  if (!id || isNaN(Number(id))) return notFound();

  // 1. 조직 및 기수 로드
  const generations = await prisma.generation.findMany({
    where: { organizationId: Number(id), deletedAt: null },
    orderBy: [{ isPrimary: "desc" }, { name: "desc" }],
    include: { organization: true },
  });

  if (generations.length === 0) {
    return (
      <div className="p-10 text-center text-slate-500">
        등록된 기수가 없습니다.
      </div>
    );
  }

  const currentGenId = gen ? Number(gen) : generations[0].id;
  const currentGen =
    generations.find((g) => g.id === currentGenId) || generations[0];

  // 2. 직책(Position) 및 소속 회원 로드 (rank 오름차순)
  const positionsWithMembers = await prisma.position.findMany({
    where: { generationId: currentGenId },
    orderBy: { rank: "asc" }, // 🌟 DB에서 가져올 때 이미 예쁘게 정렬된 상태!
    include: {
      affiliations: {
        where: { status: "ACTIVE" },
        include: { member: true },
        orderBy: { member: { name: "asc" } },
      },
    },
  });

  // 🌟 3. 핵심 로직: Rank가 아닌 "계층(Depth)"을 계산해서 그룹화합니다!

  // 3-1. 부모를 찾기 위해 전체 직책을 Map에 담아둡니다.
  const posMap = new Map(positionsWithMembers.map((p) => [p.id, p]));

  // 3-2. 이 직책이 조직도의 몇 층(Depth)에 있는지 계산하는 재귀 함수
  const getDepth = (parentId: number | null): number => {
    let depth = 0;
    let currentId = parentId;
    while (currentId) {
      depth++;
      const parent = posMap.get(currentId);
      currentId = parent?.parentId || null;
    }
    return depth; // 회장=0층, 부회장=1층, 부장=2층...
  };

  // 3-3. 층수(depth)를 기준으로 직책들을 그룹화합니다.
  const depthGroups = positionsWithMembers.reduce((acc, pos) => {
    // if (pos.affiliations.length === 0) return acc; // 사람 없는 직책은 화면에서 숨김

    const depth = getDepth(pos.parentId); // 🌟 여기가 핵심!

    if (!acc[depth]) acc[depth] = [];
    acc[depth].push(pos);
    return acc;
  }, {} as Record<number, typeof positionsWithMembers>);

  // 0층, 1층, 2층 순서대로 배열 생성
  const sortedDepths = Object.keys(depthGroups)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="relative">
      <IntroTabs orgId={orgId} currentTab="orgchart" />
      <div className="max-w-4xl mx-auto px-4 py-16 min-h-screen bg-white font-sans">
        {/* ... 타이틀 영역 기존과 동일 ... */}

        {/* 🌟 조직도 트리 영역 */}
        <div className="flex flex-col items-center space-y-8">
          {/* 🌟 sortedRanks 대신 sortedDepths를 순회합니다 */}
          {sortedDepths.map((depth, index) => {
            const positionsInThisDepth = depthGroups[depth];
            const isPresidentRank = index === 0; // 0층(최상단)은 리더로 취급 (빨간 박스)

            return (
              // 같은 층(Depth)에 있는 직책들을 가로로 나란히 배치
              <div
                key={`depth-${depth}`}
                className={`w-full flex justify-center gap-4 md:gap-6 flex-wrap`}
              >
                {positionsInThisDepth.map((position) => (
                  <OrgBox
                    key={position.id}
                    title={position.name}
                    members={position.affiliations}
                    isLeader={isPresidentRank}
                    className={
                      positionsInThisDepth.length === 1
                        ? "w-full max-w-[320px]"
                        : "w-full max-w-[260px] flex-1"
                    }
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// 🎨 이미지 스타일을 완벽 재현한 개별 조직도 박스 컴포넌트
function OrgBox({
  title,
  members,
  isLeader = false,
  className = "",
}: {
  title: string;
  members: any[];
  isLeader?: boolean;
  className?: string;
}) {
  // 🌟 핵심 로직: 3명 이상일 때만 2열(grid-cols-2)로 쪼갭니다.
  const gridCols = members.length >= 3 ? "grid-cols-2" : "grid-cols-1";

  return (
    <div
      className={`rounded-xl overflow-hidden bg-white shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border-2 border-slate-50 flex flex-col ${className}`}
    >
      {/* 박스 헤더 */}
      <div
        className={`py-2 text-center ${
          isLeader ? "bg-brand-main" : "bg-[#18294a]"
        }`}
      >
        <h3 className="text-[17px] font-black text-white tracking-widest">
          {title}
        </h3>
      </div>

      {/* 박스 바디 (멤버 리스트) */}
      {members.length !== 0 ? (
        <div className="py-4 flex-1 flex items-center justify-center">
          {/* 🌟 padding과 gap을 넉넉히 주어 쾌적하게 보이도록 수정 */}
          <div className={`w-full grid ${gridCols} gap-y-4 gap-x-2 px-2`}>
            {members.map((aff) => (
              <div
                key={aff.id}
                className="text-center flex flex-col items-center w-full"
              >
                <div className="flex items-center justify-center gap-1.5 w-full">
                  <span className="text-[15px] font-bold text-slate-800 tracking-wide">
                    {aff.member.name}
                  </span>
                  {/* 🌟 주석 해제 및 디자인 적용: 국장, 차장 등 역할 표시 */}
                  {aff.role && aff.role !== "USER" && (
                    <span className="text-[11px] font-extrabold text-orange-500 mt-0.5">
                      {aff.role}
                    </span>
                  )}
                </div>
                {aff.member.phone && (
                  <span className="text-xs text-slate-500 mt-0.5">
                    {aff.member.phone}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        // 멤버가 0명일 때 박스 안이 찌그러지지 않도록 빈 공간 처리
        <div className="py-6 flex items-center justify-center text-xs text-slate-300">
          공석
        </div>
      )}
    </div>
  );
}
