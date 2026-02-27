"use server";

import { auth } from "@/auth";
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

export async function setupInitialPasswordAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return { success: false, error: "로그인이 필요합니다." };

    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!newPassword || newPassword !== confirmPassword) {
      return { success: false, error: "비밀번호가 일치하지 않습니다." };
    }

    if (newPassword.length < 4) {
      return { success: false, error: "비밀번호는 4자리 이상이어야 합니다." };
    }

    const memberId = Number(session.user.id);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 🌟 트랜잭션: 비밀번호 변경과 ACTIVE 전환을 동시에 처리
    await prisma.$transaction(async (tx) => {
      // 1. 멤버 비밀번호 업데이트
      await tx.member.update({
        where: { id: memberId },
        data: { password: hashedPassword },
      });

      // 2. 이 멤버의 모든 PENDING 상태를 ACTIVE로 활성화
      await tx.affiliation.updateMany({
        where: { memberId: memberId, status: "PENDING" },
        data: { status: "ACTIVE" },
      });
    });

    return { success: true };
  } catch (error) {
    console.error("[SETUP_PASSWORD_ERROR]", error);
    return { success: false, error: "비밀번호 설정 중 오류가 발생했습니다." };
  }
}
