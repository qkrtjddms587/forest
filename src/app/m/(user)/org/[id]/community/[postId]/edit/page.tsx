import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { EditPostForm } from "@/components/community/edit-post-form";
import { isContentOwner, isOrgAdmin } from "@/lib/auth/auth-utils";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string; postId: string }>;
}) {
  const { id, postId } = await params;
  const session = await auth();
  const orgId = Number(id);

  if (!session?.user) {
    redirect("/login"); // 비로그인 튕겨내기
  }

  // 1. 수정할 게시글 데이터 불러오기
  const post = await prisma.post.findFirst({
    where: {
      id: Number(postId),
      deletedAt: null,
    },
    select: {
      id: true,
      title: true,
      content: true,
      type: true,
      authorId: true,
      // 🌟 기존에 첨부된 이미지 데이터 가져오기
      images: {
        select: {
          id: true,
          url: true,
        },
        orderBy: {
          id: "asc", // 올렸던 순서대로 예쁘게 정렬해서 가져오기
        },
      },
    },
  });

  if (!post) notFound();

  // 2. 페이지 진입 단계에서부터 작성자 본인인지 철저히 검증!
  const isOwner = isContentOwner(session.user, post.authorId);
  if (!isOwner) {
    // 본인이 아니면 경고창이나 뒤로가기 처리를 위해 목록으로 돌려보냄
    redirect(`/m/org/${orgId}/community/${post.id}`);
  }

  const isAdmin = isOrgAdmin(session.user, orgId);

  return (
    <div className="max-w-2xl mx-auto p-4 pb-16 md:p-8 min-h-screen bg-white shadow-sm md:my-6 md:rounded-xl md:border">
      <div className="mb-6">
        <Link
          href={`/m/org/${id}/community/${postId}`}
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          취소
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6 pb-4 border-b">
        게시글 수정
      </h1>

      {/* 🌟 폼 컴포넌트에 기존 데이터를 넘겨줍니다 */}
      <EditPostForm orgId={orgId} isAdmin={isAdmin} post={post} />
    </div>
  );
}
