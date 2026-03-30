"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { isContentOwner, isOrgAdmin } from "@/lib/auth/auth-utils";
import { findBadWord } from "@/lib/filter";

export async function createCommentAction(postId: number, content: string) {
  try {
    const session = await auth();
    // throw Error 대신 프론트에서 처리하기 쉽도록 객체 리턴으로 통일
    if (!session?.user?.id)
      return { success: false, error: "로그인이 필요합니다." };

    // 🍎 [애플 심사용] 댓글 작성 시 금칙어 필터링
    const caughtWord = findBadWord(content);
    if (caughtWord) {
      return {
        success: false,
        error: `[${caughtWord}] 단어는 커뮤니티 가이드라인에 따라 사용할 수 없습니다.`,
      };
    }

    await prisma.comment.create({
      data: {
        content,
        postId,
        memberId: Number(session.user.id),
      },
    });

    // 페이지 갱신
    // (참고: [id] 대신 정확한 orgId를 받아와서 revalidatePath(`/m/org/${orgId}/community/${postId}`) 처럼 쓰는 것이 더 확실하게 캐시를 날릴 수 있습니다.)
    revalidatePath(`/m/org/[id]/community/${postId}`, "page");

    // 🌟 성공 시 결과 리턴
    return { success: true };
  } catch (error) {
    console.error("[CREATE_COMMENT_ERROR]", error);
    return { success: false, error: "댓글 작성 중 오류가 발생했습니다." };
  }
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
    if (!session?.user)
      return { success: false, error: "로그인이 필요합니다." };

    // 🍎 [애플 심사용] 댓글 수정 시 금칙어 필터링
    const caughtWord = findBadWord(content);
    if (caughtWord) {
      return {
        success: false,
        error: `[${caughtWord}] 단어는 커뮤니티 가이드라인에 따라 사용할 수 없습니다.`,
      };
    }

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
    console.error("[UPDATE_COMMENT_ERROR]", error);
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
