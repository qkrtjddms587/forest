import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Clock } from "lucide-react";
import { CommentSection } from "@/components/community/comment-section";
import { auth } from "@/auth";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string; postId: string }>;
}) {
  const { id, postId } = await params;
  const session = await auth();

  // 1. 게시글 가져오기 (+조회수 증가 로직은 보통 별도 액션이나 useEffect로 처리하지만, 여기선 생략)
  const post = await prisma.post.findUnique({
    where: { id: Number(postId) },
    include: {
      author: {
        select: { name: true, image: true, company: true, job: true },
      },
      comments: {
        include: { member: { select: { name: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!post) notFound();

  // 조회수 증가 (Server Component에서 하는 간단한 방식, 엄밀하진 않음)
  await prisma.post.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  });

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 min-h-screen bg-white shadow-sm md:my-6 md:rounded-xl md:border">
      {/* 1. 게시글 헤더 */}
      <div className="mb-6">
        <div className="flex gap-2 mb-3">
          {post.type === "NOTICE" ? (
            <Badge className="bg-red-600 hover:bg-red-700">공지사항</Badge>
          ) : (
            <Badge variant="outline" className="text-slate-500">
              자유게시판
            </Badge>
          )}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
          {post.title}
        </h1>

        <div className="flex items-center justify-between mt-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border">
              <AvatarImage src={post.author.image || ""} />
              <AvatarFallback>{post.author.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-bold text-sm text-slate-800">
                {post.author.name}
              </div>
              <div className="text-xs text-slate-500">
                {post.author.company || post.author.job
                  ? `${post.author.company || ""} ${post.author.job || ""}`
                  : "소속 정보 없음"}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end text-xs text-slate-400 gap-1">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />{" "}
              {new Date(post.createdAt).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" /> {post.viewCount} 읽음
            </div>
          </div>
        </div>
      </div>

      {/* 2. 본문 내용 */}
      <div className="prose prose-slate max-w-none min-h-[200px] mb-10 whitespace-pre-wrap leading-relaxed text-slate-800">
        {post.content}
      </div>

      <Separator className="my-8" />

      {/* 3. 댓글 영역 */}
      <CommentSection
        postId={post.id}
        comments={post.comments}
        currentUser={session?.user}
      />
    </div>
  );
}
