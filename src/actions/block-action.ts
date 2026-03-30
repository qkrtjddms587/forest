// actions/block.ts
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function blockUserAction(
  targetMemberId: number,
  currentPath: string
) {
  try {
    const session = await auth();
    const myId = Number(session?.user?.id);

    if (!myId) return { success: false, error: "로그인이 필요합니다." };
    if (myId === targetMemberId)
      return { success: false, error: "자기 자신은 차단할 수 없습니다." };

    // DB에 차단 내역 생성 (이미 차단한 경우 에러 방지를 위해 upsert나 ignore 처리 가능)
    await prisma.block.create({
      data: {
        blockerId: myId,
        blockedId: targetMemberId,
      },
    });

    // 🌟 차단 즉시 현재 보고 있는 페이지의 캐시를 날려버림
    revalidatePath(currentPath);

    return { success: true };
  } catch (error) {
    // 이미 차단한 사용자일 경우의 Prisma 에러 코드(P2002) 처리 등
    console.error("[BLOCK_USER_ERROR]", error);
    return { success: false, error: "사용자 차단 중 오류가 발생했습니다." };
  }
}
