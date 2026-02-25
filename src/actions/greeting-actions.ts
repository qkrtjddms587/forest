"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. 인사말 저장 (생성/수정)
export async function saveGreeting(
  affiliationId: number,
  data: {
    title: string | null;
    content: string;
    imageUrl: string | null;
    signImageUrl: string | null;
    isActive: boolean;
    displayOrder: number;
  }
) {
  try {
    await prisma.greeting.upsert({
      where: { affiliationId },
      update: { ...data },
      create: { affiliationId, ...data },
    });
    revalidatePath("/admin/org-chart", "layout");
    return { success: true };
  } catch (error) {
    return { success: false, error: "인사말 저장 실패" };
  }
}

// 🌟 2. 인사말 삭제 (추가!)
export async function deleteGreeting(greetingId: number) {
  try {
    await prisma.greeting.delete({
      where: { id: greetingId },
    });
    revalidatePath("/admin/org-chart", "layout");
    return { success: true };
  } catch (error) {
    return { success: false, error: "인사말 삭제 실패" };
  }
}
