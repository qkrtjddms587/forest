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
  data: z.infer<typeof ProfileSchema>
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
