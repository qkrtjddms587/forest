"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. 직책 생성 (부모 직책 ID를 받음)
export async function createPositionAction(data: {
  generationId: number;
  name: string;
  parentId: number | null;
  isExecutive: boolean;
  duesCycle: string;
  duesAmount: number;
}) {
  try {
    // 같은 레벨의 마지막 순서(rank) 찾기
    const lastRank = await prisma.position.findFirst({
      where: { generationId: data.generationId, parentId: data.parentId },
      orderBy: { rank: "desc" },
    });
    const newRank = (lastRank?.rank || 0) + 1;

    await prisma.position.create({
      data: {
        generationId: data.generationId,
        name: data.name,
        parentId: data.parentId,
        rank: newRank,
        isExecutive: data.isExecutive,
        duesCycle: data.duesCycle,
        duesAmount: data.duesAmount,
      },
    });
    revalidatePath("/admin/org-chart");
    return { success: true };
  } catch (e) {
    return { success: false, message: "생성 실패" };
  }
}

// 2. 직책 삭제 (하위 직책이 있으면 삭제 불가 처리 추천)
export async function deletePositionAction(positionId: number) {
  // 하위 직책 체크
  const hasChildren = await prisma.position.count({
    where: { parentId: positionId },
  });
  if (hasChildren > 0) {
    return {
      success: false,
      message:
        "하위 직책이 있어 삭제할 수 없습니다. 하위 직책을 먼저 삭제하세요.",
    };
  }

  await prisma.position.delete({ where: { id: positionId } });
  revalidatePath("/admin/org-chart");
  return { success: true };
}

export async function updateMemberPosition(
  affiliationId: number,
  positionId: number | null
) {
  try {
    // 1. Prisma를 이용해 해당 회원의 직책(positionId)을 업데이트합니다.
    await prisma.affiliation.update({
      where: { id: affiliationId },
      data: { positionId: positionId },
    });

    // 2. Next.js 캐시 무효화 (화면 강제 새로고침)
    // "layout" 옵션을 주면 /admin/org-chart 하위의 모든 탭(직책, 임명 등) 데이터가 싹 새로고침됩니다.
    revalidatePath("/admin/org-chart", "layout");

    return { success: true };
  } catch (error) {
    console.error("직책 업데이트 에러:", error);
    return { success: false, error: "직책을 변경하는 중 오류가 발생했습니다." };
  }
}
