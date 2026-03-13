// src/app/.../page.tsx (상세 페이지 경로에 맞게)
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Clock, ChevronLeft, Pencil } from "lucide-react";
import { CommentSection } from "@/components/community/comment-section";
import { auth } from "@/auth";
import Link from "next/link";
import { ImageSlider } from "@/components/community/image-slider"; // 🌟 슬라이더 컴포넌트 임포트
import { DeletePostButton } from "@/components/community/delete-post-button";
import { isContentOwner, isOrgAdmin } from "@/lib/auth/auth-utils";
import { PostOptionsMenu } from "@/components/community/post-options-menu";
import { includes } from "zod";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string; postId: string }>;
}) {
  const { id, postId } = await params;
  const orgId = +id;
  const session = await auth();

  // 1. 게시글 가져오기 (대표님 스키마 적용!)
  const post = await prisma.post.findUnique({
    where: { id: Number(postId) },
    include: {
      author: {
        select: {
          name: true,
          image: true,
          affiliations: {
            include: { Position: true, generation: { select: { name: true } } },
          },
        },
      },
      images: true, // 🌟 DB의 PostImage[] 데이터를 모두 가져옵니다.
      comments: {
        include: { member: { select: { name: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!post) notFound();

  const genName = post.author.affiliations[0].generation.name;
  const positionName = post.author.affiliations[0].Position?.name;

  const isAdmin = isOrgAdmin(session?.user, orgId);
  const isOwner = isContentOwner(session?.user, post.authorId);
  const canDelete = isOwner || isAdmin;
  const canEdit = isOwner;
  // 조회수 증가
  await prisma.post.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  });

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 min-h-screen bg-white shadow-sm md:my-6 md:rounded-xl md:border relative">
      {/* 뒤로 가기 버튼 */}
      <div className="mb-6">
        <Link
          href={`/m/org/${id}/community`}
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          목록으로
        </Link>
      </div>

      {/* 헤더 (제목, 작성자 등) */}
      <div className="mb-6">
        <div className="flex gap-2 mb-3">
          {post.type === "NOTICE" ? (
            <Badge className="bg-red-600 hover:bg-red-700">공지사항</Badge>
          ) : post.type === "GALLERY" ? (
            <Badge
              variant="outline"
              className="text-slate-500 border-slate-300"
            >
              갤러리
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-slate-500 border-slate-300"
            >
              자유게시판
            </Badge>
          )}

          {/* 🌟 명당자리: 권한이 있을 때만 삭제 버튼 노출 */}
        </div>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
            {post.title}
          </h1>
          <PostOptionsMenu
            postId={post.id}
            orgId={orgId}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </div>

        <div className="flex items-center justify-between mt-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border border-slate-200">
              <AvatarImage
                src={
                  `${process.env.NEXT_PUBLIC_S3_DOMAIN}/${process.env.NEXT_PUBLIC_S3_BUCKET}${post.author.image}` ||
                  ""
                }
              />
              <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">
                {post.author.name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-bold text-sm text-slate-800">
                {post.author.name}
              </div>
              <div className="text-xs text-slate-500">
                {genName}
                {positionName}
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

      {/* 🌟 2. 본문 상단에 이미지 슬라이더 렌더링 (DB에 이미지가 1장이라도 있을 때만 보임) */}
      <ImageSlider images={post.images} />

      {/* 3. 본문 내용 */}
      <div className="prose prose-slate max-w-none mb-10 whitespace-pre-wrap leading-relaxed text-slate-800 text-[15px] md:text-base">
        {post.content}
      </div>

      <div className="flex justify-center mt-10 mb-6">
        <Link
          href={`/m/org/${id}/community`}
          className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-full transition-colors flex items-center gap-2"
        >
          목록으로 돌아가기
        </Link>
      </div>

      <Separator className="my-8" />

      {/* 4. 댓글 영역 */}
      <CommentSection
        postId={post.id}
        comments={post.comments}
        currentUser={session?.user}
        isAdmin={isAdmin}
        orgId={orgId}
      />
    </div>
  );
}
