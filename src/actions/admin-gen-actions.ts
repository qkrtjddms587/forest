"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. 대표 기수 설정
export async function setPrimaryGeneration(
  orgId: number,
  generationId: number
) {
  try {
    await prisma.$transaction([
      prisma.generation.updateMany({
        where: { organizationId: orgId },
        data: { isPrimary: false },
      }),
      prisma.generation.update({
        where: { id: generationId },
        data: { isPrimary: true },
      }),
    ]);
    revalidatePath("/admin/orgs");
    return { success: true };
  } catch (error) {
    return { success: false, error: "대표 기수 설정 실패" };
  }
}

// 2. 🌟 이전 기수 직책 복사하기 (트리 구조 완벽 복제)
export async function copyPositionsToNewGeneration(
  sourceGenId: number,
  targetGenId: number
) {
  try {
    const oldPositions = await prisma.position.findMany({
      where: { generationId: sourceGenId },
    });
    if (oldPositions.length === 0)
      return { success: false, error: "복사할 직책이 없습니다." };

    const idMap = new Map<number, number>(); // 옛날 ID -> 새 ID 매핑 보관소

    // 1) 최상위 부모(회장 등)부터 생성
    const roots = oldPositions.filter((p) => p.parentId === null);
    for (const root of roots) {
      const newRoot = await prisma.position.create({
        data: {
          generationId: targetGenId,
          name: root.name,
          rank: root.rank,
          isExecutive: root.isExecutive,
          duesAmount: root.duesAmount,
          duesCycle: root.duesCycle,
        },
      });
      idMap.set(root.id, newRoot.id);
    }

    // 2) 자식들을 순회하며 새 부모 ID를 찾아 연결 (반복)
    let remaining = oldPositions.filter((p) => p.parentId !== null);
    while (remaining.length > 0) {
      const processable = remaining.filter((p) => idMap.has(p.parentId!));
      if (processable.length === 0) break; // 에러 방지용

      for (const node of processable) {
        const newNode = await prisma.position.create({
          data: {
            generationId: targetGenId,
            name: node.name,
            rank: node.rank,
            isExecutive: node.isExecutive,
            duesAmount: node.duesAmount,
            duesCycle: node.duesCycle,
            parentId: idMap.get(node.parentId!), // 🌟 핵심: 방금 만든 새 부모의 ID를 넣어줌
          },
        });
        idMap.set(node.id, newNode.id);
      }
      remaining = remaining.filter((p) => !idMap.has(p.id));
    }

    revalidatePath(`/admin/org-chart`);
    return { success: true };
  } catch (error) {
    return { success: false, error: "직책 복사 중 오류가 발생했습니다." };
  }
}
