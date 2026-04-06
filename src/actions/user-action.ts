"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// 유효성 검사 스키마
const ProfileSchema = z.object({
  company: z.string().optional(),
  job: z.string().optional(),
  address: z.string().optional(),
  image: z.string().optional().nullable(), // 🌟 추가: S3에서 받은 경로(string)가 들어옵니다.
});

export async function updateMyProfileAction(
  data: z.infer<typeof ProfileSchema>,
) {
  const session = await auth();
  if (!session?.user?.id)
    return { success: false, message: "로그인이 필요합니다." };

  try {
    await prisma.member.update({
      where: { id: Number(session.user.id) },
      data: {
        company: data.company || null,
        job: data.job || null,
        address: data.address || null,
        // 🌟 이미지 필드 추가
        image: data.image || null,
      },
    });

    // 갱신이 필요한 경로들
    revalidatePath("/profile");
    revalidatePath("/search");
    // 보통 헤더나 사이드바의 아바타도 바뀌어야 하므로 레이아웃 갱신도 고려하세요
    revalidatePath("/", "layout");

    return { success: true, message: "내 정보가 수정되었습니다." };
  } catch (error) {
    console.error(error);
    return { success: false, message: "수정 중 오류가 발생했습니다." };
  }
}

export async function blockUserAction(blockedId: number) {
  try {
    const session = await auth();
    const blockerId = Number(session?.user?.id);

    // 1-1. 기본 예외 처리
    if (!blockerId) return { success: false, error: "로그인이 필요합니다." };
    if (blockerId === blockedId)
      return { success: false, error: "자기 자신을 차단할 수 없습니다." };

    // 1-2. DB에 차단 내역 저장
    await prisma.block.create({
      data: {
        blockerId,
        blockedId,
      },
    });

    return {
      success: true,
      message:
        "해당 사용자를 차단했습니다. 앞으로 이 사용자의 글이 보이지 않습니다.",
    };
  } catch (error: any) {
    // 🌟 1-3. 고유키 제약조건(@@unique) 위반 시 - 즉, 이미 차단한 경우
    if (error.code === "P2002") {
      return { success: false, error: "이미 차단한 사용자입니다." };
    }

    // 기타 서버 에러
    console.error("[차단 에러]:", error);
    return { success: false, error: "차단 처리 중 서버 오류가 발생했습니다." };
  }
}

/**
 * 2. 게시글 신고 액션
 */
export async function reportPostAction(
  postId: number,
  reason: string = "부적절한 게시글 (유저 신고)",
) {
  try {
    const session = await auth();
    const reporterId = Number(session?.user?.id);

    // 2-1. 기본 예외 처리
    if (!reporterId) return { success: false, error: "로그인이 필요합니다." };

    // 2-2. DB에 신고 내역 저장 (방금 만든 Report 테이블 활용!)
    await prisma.report.create({
      data: {
        reporterId,
        postId,
        reason,
        status: "PENDING", // 관리자 미확인 상태
      },
    });

    return {
      success: true,
      message:
        "신고가 정상적으로 접수되었습니다. 관리자 검토 후 조치될 예정입니다.",
    };
  } catch (error: any) {
    // 🌟 2-3. 고유키 제약조건(@@unique([reporterId, postId])) 위반 시 - 이미 이 글을 신고한 경우
    if (error.code === "P2002") {
      return {
        success: false,
        error:
          "이미 신고가 접수된 게시글입니다. 빠른 시일 내에 검토하겠습니다.",
      };
    }

    // 기타 서버 에러
    console.error("[신고 에러]:", error);
    return { success: false, error: "신고 접수 중 서버 오류가 발생했습니다." };
  }
}
