import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image"; // Next.js 이미지 최적화 (선택사항)
import { IntroTabs } from "@/components/common/intro-tabs";

interface Props {
  // URL에서 조직(org)이나 기수(gen) ID를 받는다고 가정합니다.
  params: Promise<{ id: string }>;
  searchParams: Promise<{ gen?: string }>;
}

export default async function UserGreetingPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { gen } = await searchParams;

  // 1. 유효한 기수 가져오기 (gen 파라미터가 없으면 가장 최신/기본 기수)
  const generations = await prisma.generation.findMany({
    where: { organizationId: Number(id), deletedAt: null },
    orderBy: [{ isPrimary: "desc" }, { name: "desc" }],
  });

  if (generations.length === 0) return notFound();
  const currentGenId = gen ? Number(gen) : generations[0].id;

  // 🌟 2. 인사말 데이터 로드 (isActive: true 인 것만, 순서대로!)
  const greetings = await prisma.greeting.findMany({
    where: {
      isActive: true,
      affiliation: {
        generationId: currentGenId,
        status: "ACTIVE", // 승인된 회원의 인사말만
      },
    },
    include: {
      affiliation: {
        include: {
          organization: { select: { name: true } },
          generation: { select: { name: true } },
          member: { select: { name: true } },
          Position: { select: { name: true } },
        },
      },
    },
    orderBy: { displayOrder: "asc" },
  });

  if (greetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <p>등록된 인사말이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <IntroTabs orgId={Number(id)} currentTab="greeting" />
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">
        {/* 인사말 카드 리스트 */}
        <div className="space-y-16">
          {greetings.map((greet, index) => {
            const generateName = greet.affiliation.generation?.name;
            const organizationName = greet.affiliation.organization?.name;
            const positionName = greet.affiliation.Position?.name || "임원";
            const memberName = greet.affiliation.member.name;

            return (
              <section
                key={greet.id}
                className="flex flex-col md:flex-row gap-8 md:gap-12 items-start"
              >
                {/* 1. 좌측: 프로필 이미지 영역 */}
                <div className="w-full md:w-1/3 shrink-0 flex flex-col items-center md:items-start">
                  <div className="w-48 md:w-64 relative rounded-xl overflow-hidden">
                    {greet.imageUrl ? (
                      <img
                        src={greet.imageUrl}
                        alt={`${memberName} 프로필`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100">
                        사진 없음
                      </div>
                    )}
                  </div>

                  {/* 모바일에서만 사진 밑에 바로 이름 띄우기 */}
                  <div className="mt-4 text-center md:hidden w-full">
                    <p className="text-sm font-bold text-blue-600 mb-1"></p>
                    <p className="text-xl font-black text-slate-900">
                      {generateName} {positionName} {memberName}
                    </p>
                  </div>
                </div>

                {/* 2. 우측: 인사말 텍스트 영역 */}
                <div className="w-full md:w-2/3 flex flex-col">
                  {/* PC에서만 보이는 이름/직책 */}
                  <div className="hidden md:block mb-6 border-b border-slate-200 pb-4">
                    <p className="text-sm font-bold text-blue-600 mb-1">
                      {positionName}
                    </p>
                    <h2 className="text-2xl font-black text-slate-900">
                      {memberName}
                    </h2>
                  </div>

                  {/* 인사말 제목 */}
                  {greet.title && (
                    <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-6 leading-snug">
                      "{greet.title}"
                    </h3>
                  )}

                  {/* 인사말 본문 (줄바꿈 유지) */}
                  <div className="text-slate-600 leading-loose whitespace-pre-wrap font-medium text-[15px] md:text-base">
                    {greet.content}
                  </div>

                  {/* 서명/직인 영역 */}
                  <div className="mt-12 flex gap-4">
                    <div className="">
                      <div className="text-lg font-bold text-slate-900 flex gap-1.5 items-center">
                        <span>{organizationName}</span>
                        <span>{generateName}</span>
                        <span>{positionName}</span>
                        <span>{memberName}</span>
                        {greet.signImageUrl && (
                          <div className="w-20 h-20 relative shrink-0 -ml-5">
                            <img
                              src={greet.signImageUrl}
                              alt={`${memberName} 서명`}
                              className="w-full h-full object-contain" // 서명은 잘리지 않게 contain
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
