"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

// ✅ 스키마 변경: 단일 ID -> 객체 배열
const registerActionSchema = z.object({
  loginId: z.string().min(4),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string(),
  // [{ orgId: 1, genId: 2 }, { orgId: 3, genId: 4 }] 형태
  affiliations: z
    .array(
      z.object({
        orgId: z.number(),
        genId: z.number(),
      })
    )
    .min(1, "최소 하나의 소속을 선택해야 합니다."),
});

export async function registerMemberAction(
  data: z.infer<typeof registerActionSchema>
) {
  try {
    const existingUser = await prisma.member.findFirst({
      where: { OR: [{ loginId: data.loginId }, { phone: data.phone }] },
    });

    if (existingUser)
      return {
        success: false,
        message: "이미 사용 중인 아이디 또는 전화번호입니다.",
      };

    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 트랜잭션으로 회원 생성 + 소속 n개 생성
    await prisma.$transaction(async (tx) => {
      const newMember = await tx.member.create({
        data: {
          loginId: data.loginId,
          password: hashedPassword,
          name: data.name,
          phone: data.phone,
        },
      });

      // ✅ 반복문으로 소속 정보 여러 개 Insert
      for (const aff of data.affiliations) {
        await tx.affiliation.create({
          data: {
            memberId: newMember.id,
            organizationId: aff.orgId,
            generationId: aff.genId,
            role: "USER",
            status: "ACTIVE",
            updatedAt: new Date(),
          },
        });
      }
    });

    return { success: true, message: "가입 신청 완료! 로그인해주세요." };
  } catch (error) {
    console.error(error);
    return { success: false, message: "서버 오류가 발생했습니다." };
  }
}
