import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PenSquare, MessageSquare, Eye } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns"; // npm i date-fns (없으면 설치 추천)

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orgId = Number(id);
  const session = await auth();

  // 1. 게시글 조회 (공지사항 우선 정렬)
  const posts = await prisma.post.findMany({
    where: { organizationId: orgId },
    include: {
      author: { select: { name: true } },
      _count: { select: { comments: true } },
    },
    orderBy: [
      { type: "desc" }, // NOTICE(N)가 FREE(F)보다 뒤에 오므로 desc하면 NOTICE가 먼저 옴 (알파벳순) -> 실제로는 type enum 관리가 필요하지만 여기선 간단히
      { createdAt: "desc" },
    ],
  });

  // 간단한 날짜 포맷 함수
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 min-h-screen">
      {/* 헤더 영역 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">커뮤니티</h1>
          <p className="text-slate-500 text-sm mt-1">
            자유롭게 소통하는 공간입니다.
          </p>
        </div>
        <Link href={`/org/${orgId}/community/write`}>
          <Button className="bg-brand-main hover:bg-brand-main/90 gap-2">
            <PenSquare className="w-4 h-4" /> 글쓰기
          </Button>
        </Link>
      </div>

      {/* 게시글 리스트 */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {posts.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            등록된 게시글이 없습니다. 첫 글을 남겨보세요!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/org/${orgId}/community/${post.id}`}
                className={`block p-4 hover:bg-slate-50 transition-colors ${
                  post.type === "NOTICE" ? "bg-slate-50/80" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {post.type === "NOTICE" && (
                        <Badge
                          variant="secondary"
                          className="bg-red-50 text-red-600 border-red-100 px-1.5 py-0 h-5 text-[10px]"
                        >
                          공지
                        </Badge>
                      )}
                      <h3
                        className={`font-medium truncate ${
                          post.type === "NOTICE"
                            ? "text-slate-900 font-bold"
                            : "text-slate-700"
                        }`}
                      >
                        {post.title}
                      </h3>
                      {/* 모바일용 댓글 수 (제목 옆) */}
                      {post._count.comments > 0 && (
                        <span className="text-brand-main text-xs font-bold flex items-center md:hidden">
                          [{post._count.comments}]
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5">
                      <span className="text-slate-600 font-medium">
                        {post.author.name}
                      </span>
                      <span>·</span>
                      <span>{formatDate(post.createdAt)}</span>
                      <span className="hidden md:inline">·</span>
                      <span className="hidden md:flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {post.viewCount}
                      </span>
                    </div>
                  </div>

                  {/* 데스크탑용 댓글/조회수 박스 */}
                  <div className="hidden md:flex flex-col items-end gap-1 text-slate-400 min-w-[60px]">
                    {post._count.comments > 0 && (
                      <div className="flex items-center gap-1 text-brand-main font-bold text-sm bg-blue-50 px-2 py-0.5 rounded-full">
                        <MessageSquare className="w-3 h-3" />{" "}
                        {post._count.comments}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
