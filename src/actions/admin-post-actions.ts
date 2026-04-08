"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. 게시글 영구 삭제 (DB에서 완전히 날리기)
export async function deletePostAction(postId: number, orgId: number) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "권한이 없습니다." };

    await prisma.post.delete({
      where: { id: postId },
    });

    // 🌟 해당 org의 게시글 관리 페이지 캐시만 초기화
    revalidatePath(`/admin/org-chart/${orgId}/posts`);
    return { success: true, message: "게시글이 영구 삭제되었습니다." };
  } catch (error) {
    console.error("게시글 삭제 에러:", error);
    return {
      success: false,
      error: "게시글 삭제 중 서버 오류가 발생했습니다.",
    };
  }
}

// 2. 게시글 숨김 처리 (deletedAt 컬럼 활용 = 소프트 삭제)
export async function togglePostVisibilityAction(
  postId: number,
  isCurrentlyHidden: boolean,
  orgId: number,
) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "권한이 없습니다." };

    await prisma.post.update({
      where: { id: postId },
      data: {
        deletedAt: isCurrentlyHidden ? null : new Date(),
      },
    });

    revalidatePath(`/admin/org-chart/${orgId}/posts`);
    return {
      success: true,
      message: isCurrentlyHidden
        ? "게시글 숨김이 해제되었습니다."
        : "게시글이 숨김 처리되었습니다.",
    };
  } catch (error) {
    console.error("게시글 상태 변경 에러:", error);
    return { success: false, error: "상태 변경 중 서버 오류가 발생했습니다." };
  }
}

export async function createPostAction(data: {
  title: string;
  content: string;
  type: string; // "NOTICE", "FREE", "EVENT" 등
  orgId: number;
}) {
  try {
    const session = await auth();
    const adminId = Number(session?.user?.id);

    if (!adminId) {
      return { success: false, error: "인증되지 않은 사용자입니다." };
    }

    // DB에 게시글 생성
    await prisma.post.create({
      data: {
        title: data.title,
        content: data.content,
        type: data.type,
        organizationId: data.orgId,
        authorId: adminId, // 로그인한 관리자 ID 매핑
      },
    });

    // 작성 후 목록 페이지 캐시 초기화
    revalidatePath(`/admin/org-chart/${data.orgId}/posts`);

    return { success: true, message: "게시글이 성공적으로 등록되었습니다." };
  } catch (error) {
    console.error("게시글 작성 에러:", error);
    return {
      success: false,
      error: "게시글 등록 중 서버 오류가 발생했습니다.",
    };
  }
}

export async function getMorePostsAction({
  orgId,
  type,
  page,
}: {
  orgId: number;
  type?: string;
  page: number;
}) {
  const pageSize = 20; // 한 번에 불러올 개수
  const whereCondition: any = { organizationId: orgId };

  if (type && type !== "ALL") {
    whereCondition.type = type;
  }

  try {
    const posts = await prisma.post.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      skip: page * pageSize,
      take: pageSize,
      include: {
        author: {
          select: { name: true, company: true },
        },
      },
    });

    return { success: true, data: posts };
  } catch (error) {
    console.error("게시글 불러오기 에러:", error);
    return { success: false, data: [] };
  }
}
