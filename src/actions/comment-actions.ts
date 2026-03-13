"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { isContentOwner, isOrgAdmin } from "@/lib/auth/auth-utils";

export async function createCommentAction(postId: number, content: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("로그인이 필요합니다.");

  await prisma.comment.create({
    data: {
      content,
      postId,
      memberId: Number(session.user.id),
    },
  });

  // 페이지 갱신 (경로는 호출하는 쪽에서 revalidatePath를 쓰거나, 여기서 동적으로 처리)
  revalidatePath(`/m/org/[id]/community/${postId}`, "page");
}
// 🌟 1. 댓글 수정 액션
export async function updateCommentAction(
  commentId: number,
  postId: number,
  orgId: number,
  content: string
) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("로그인이 필요합니다.");

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) return { success: false, error: "댓글을 찾을 수 없습니다." };

    // 수정은 무조건 본인만 가능!
    if (!isContentOwner(session.user, comment.memberId)) {
      return { success: false, error: "수정 권한이 없습니다." };
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: { content },
    });

    revalidatePath(`/m/org/${orgId}/community/${postId}`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "댓글 수정 중 오류가 발생했습니다." };
  }
}

// 🌟 2. 댓글 삭제 액션 (하드 딜리트)
export async function deleteCommentAction(
  commentId: number,
  postId: number,
  orgId: number
) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("로그인이 필요합니다.");

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) return { success: false, error: "댓글을 찾을 수 없습니다." };

    // 삭제는 본인 OR 관리자 가능
    const isAdmin = isOrgAdmin(session.user, orgId);
    const isOwner = isContentOwner(session.user, comment.memberId);

    if (!isAdmin && !isOwner) {
      return { success: false, error: "삭제 권한이 없습니다." };
    }

    // 완전 삭제 (Hard Delete)
    await prisma.comment.delete({
      where: { id: commentId },
    });

    revalidatePath(`/m/org/${orgId}/community/${postId}`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "댓글 삭제 중 오류가 발생했습니다." };
  }
}
