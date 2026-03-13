"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function recalculateRanks(generationId: number) {
  // 1. 해당 기수의 모든 직책을 가져옵니다.
  const allPositions = await prisma.position.findMany({
    where: { generationId },
    orderBy: { rank: "asc" }, // 기존 rank 기준으로 일단 정렬
  });

  // 2. 부모 ID를 기준으로 자식들을 묶어줍니다 (Adjacency List 구조)
  const childrenMap = new Map<number | null, typeof allPositions>();
  allPositions.forEach((pos) => {
    const parentId = pos.parentId;
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    childrenMap.get(parentId)!.push(pos);
  });

  let currentRank = 1;
  const updates: { id: number; rank: number }[] = [];

  // 3. DFS(깊이 우선 탐색) 방식으로 트리를 순회하며 새로운 rank를 부여합니다.
  function traverse(parentId: number | null) {
    const children = childrenMap.get(parentId) || [];
    for (const child of children) {
      updates.push({ id: child.id, rank: currentRank++ });
      traverse(child.id); // 자식이 있으면 파고 들어감
    }
  }

  traverse(null); // 최상위(parentId가 null인 노드)부터 탐색 시작!

  // 4. 계산된 새로운 rank로 DB를 일괄 업데이트합니다.
  // Prisma는 다중 update 쿼리를 트랜잭션으로 처리하는 것이 성능에 좋습니다.
  await prisma.$transaction(
    updates.map((update) =>
      prisma.position.update({
        where: { id: update.id },
        data: { rank: update.rank },
      })
    )
  );
}

// 1. 직책 생성 (부모 직책 ID를 받음)
export async function createPositionAction(data: CreatePositionInput) {
  try {
    // 1. 일단 직책을 생성합니다. (rank는 임시로 9999 등 아주 큰 값을 줍니다)
    await prisma.position.create({
      data: {
        generationId: data.generationId,
        name: data.name,
        parentId: data.parentId,
        isExecutive: data.isExecutive,
        duesCycle: data.duesCycle as any,
        duesAmount: data.duesAmount,
        rank: 9999, // 임시 랭크
      },
    });

    // 🌟 2. 방금 추가된 노드를 포함하여 전체 트리의 Rank를 다시 계산하고 덮어씁니다!
    await recalculateRanks(data.generationId);

    revalidatePath(`/admin/generations/${data.generationId}`);
    return { success: true };
  } catch (error) {
    console.error("[CREATE_POSITION_ERROR]", error);
    return { success: false, message: "직책 생성에 실패했습니다." };
  }
}

interface CreatePositionInput {
  generationId: number;
  name: string;
  parentId: number | null;
  isExecutive: boolean;
  duesCycle: string;
  duesAmount: number;
}

// 2. 직책 삭제 (하위 직책이 있으면 삭제 불가 처리 추천)
export async function deletePositionAction(id: number) {
  try {
    const target = await prisma.position.findUnique({ where: { id } });
    if (!target) return { success: false, message: "직책을 찾을 수 없습니다." };

    // 자식 직책이 있는지 확인 (있으면 삭제 불가)
    const hasChildren = await prisma.position.count({
      where: { parentId: id },
    });
    if (hasChildren > 0) {
      return {
        success: false,
        message:
          "하위 직책이 존재하여 삭제할 수 없습니다. 하위 직책부터 삭제해주세요.",
      };
    }

    // 1. 직책 삭제
    await prisma.position.delete({ where: { id } });

    // 🌟 2. 이가 빠진 자리를 메우기 위해 전체 트리의 Rank를 다시 계산합니다!
    await recalculateRanks(target.generationId);

    revalidatePath(`/admin/generations/${target.generationId}`);
    return { success: true };
  } catch (error) {
    console.error("[DELETE_POSITION_ERROR]", error);
    return { success: false, message: "직책 삭제에 실패했습니다." };
  }
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
