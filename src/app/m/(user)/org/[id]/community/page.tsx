import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Search, PenSquare } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

// 🌟 탭 메뉴 정의
const TABS = [
  { label: "공지사항", value: "NOTICE" },
  { label: "자유게시판", value: "FREE" },
  { label: "갤러리", value: "GALLERY" },
  { label: "홍보", value: "ADS" },
  { label: "행사일정", value: "EVENT" },
];

export default async function CommunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string; q?: string }>;
}) {
  const { id } = await params;
  const orgId = Number(id);
  const session = await auth();

  const resolvedSearchParams = await searchParams;
  const currentType = resolvedSearchParams.type || "NOTICE";
  const searchQuery = resolvedSearchParams.q || "";

  // 게시글 조회
  const posts = await prisma.post.findMany({
    where: {
      organizationId: orgId,
      type: currentType,
      ...(searchQuery && { title: { contains: searchQuery } }),
    },
    include: {
      author: { select: { name: true } },
      _count: { select: { comments: true } },
      // 썸네일용 (갤러리일 때만 유효하게 쓰임)
      images: { take: 1, select: { url: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto bg-white min-h-screen relative pb-20">
      {/* 1. 상단 탭 (셀렉터) */}
      <div className="flex overflow-x-auto border-b border-gray-200 sticky top-0 bg-white z-10 scrollbar-hide">
        {TABS.map((tab) => {
          const isActive = currentType === tab.value;
          return (
            <Link
              key={tab.value}
              href={`/m/org/${orgId}/community?type=${tab.value}`}
              className={`whitespace-nowrap px-4 py-3 font-bold text-base transition-colors ${
                isActive
                  ? "text-brand-main border-b-2 border-brand-main"
                  : "text-slate-700 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="p-4">
        {/* 2. 검색창 */}
        <form className="relative mb-6">
          <input type="hidden" name="type" value={currentType} />
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="검색어를 입력해 보세요."
            className="w-full bg-[#E5F3FF] text-slate-700 placeholder:text-slate-500 rounded-full py-2.5 pl-4 pr-10 outline-none focus:ring-2 focus:ring-brand-main/20"
          />
          <button
            type="submit"
            className="absolute right-4 top-1/2 -translate-y-1/2"
          >
            <Search className="w-5 h-5 text-slate-800" />
          </button>
        </form>

        {/* 3. 게시글 리스트 영역 */}
        {/* 🌟 갤러리일 때는 카드 간격(gap-4)을 주고, 아닐 때는 붙여서(border-b로 구분) 렌더링 */}
        <div
          className={`flex flex-col ${
            currentType === "GALLERY" ? "gap-2" : ""
          }`}
        >
          {posts.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              {searchQuery
                ? "검색 결과가 없습니다."
                : "등록된 게시글이 없습니다."}
            </div>
          ) : (
            posts.map((post) => {
              // ==========================================
              // 🎨 A. 갤러리 타입일 때의 카드 레이아웃
              // ==========================================
              if (currentType === "GALLERY") {
                return (
                  <Link
                    key={post.id}
                    href={`/m/org/${orgId}/community/${post.id}`}
                    className="p-3 border border-gray-200 rounded-xl bg-white shadow-sm flex gap-4"
                  >
                    {/* 썸네일 (왼쪽) */}
                    <div className="shrink-0 w-24 h-24 bg-gray-200 rounded-md overflow-hidden">
                      {post.images?.[0] ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_S3_DOMAIN}/${process.env.NEXT_PUBLIC_S3_BUCKET}${post.images[0].url}`}
                          alt="썸네일"
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>

                    {/* 텍스트 영역 (오른쪽) */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                      {/* 제목: 최대 2줄까지만 허용하고 넘어가면 ... 처리 (line-clamp-2) */}
                      <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                        {post.title}
                      </h3>

                      {/* 하단 메타: 시안처럼 양끝 정렬 (justify-between) */}
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        <span>{format(post.createdAt, "yy.MM.dd")}</span>
                        <div className="flex items-center gap-1.5">
                          <span>댓글 {post._count.comments}</span>
                          <span className="text-slate-300">|</span>
                          <span>조회 {post.viewCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              }

              // ==========================================
              // 🎨 B. 일반 게시판(공지사항 등)일 때의 리스트 레이아웃
              // ==========================================
              return (
                <Link
                  key={post.id}
                  href={`/m/org/${orgId}/community/${post.id}`}
                  className="py-4 border-b border-gray-200 block hover:bg-slate-50 transition-colors"
                >
                  <h3 className="text-[17px] font-bold text-slate-900 mb-2 leading-snug break-words">
                    {post.title}
                  </h3>

                  <div className="flex items-center flex-wrap gap-x-2 text-[13px] text-slate-400">
                    {/* 작성자가 '관리자'로 하드코딩 되어야 한다면 "관리자"로 수정하셔도 됩니다 */}
                    <span>{post.author.name}</span>
                    <span>{format(post.createdAt, "yyyy.MM.dd")}</span>
                    <span className="text-slate-300">|</span>
                    <span>{format(post.createdAt, "HH:mm")}</span>
                    <span className="text-slate-300">|</span>
                    <span>댓글 {post._count.comments}</span>
                    <span className="text-slate-300">|</span>
                    <span>조회 {post.viewCount || 0}</span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* 4. 플로팅 글쓰기 버튼 */}
      <Link href={`/m/org/${orgId}/community/write`}>
        <button className="fixed bottom-24 right-4 bg-brand-main text-white p-4 rounded-full shadow-lg hover:bg-brand-main/80 transition-transform active:scale-95 flex items-center justify-center">
          <PenSquare className="w-6 h-6" />
        </button>
      </Link>
    </div>
  );
}
