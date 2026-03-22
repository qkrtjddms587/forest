"use server";

import { auth } from "@/auth";
import { isOrgAdmin } from "@/lib/auth/auth-utils";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdateSchema = z.object({
  affiliationId: z.number(),
  position: z.string().optional(),
  company: z.string().optional(),
  job: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(["USER", "ADMIN"]),
});

export async function updateMemberAction(
  memberId: number,
  data: {
    name: string;
    company?: string;
    job?: string;
    newPassword?: string; // 🌟 프론트에서 넘겨주는 새 비밀번호 필드 추가
  }
) {
  try {
    // 보안 검증: 현재 요청자가 관리자인지 서버에서 재확인
    const session = await auth();
    const adminId = Number(session?.user?.id);

    if (!adminId) {
      return { success: false, error: "인증되지 않은 사용자입니다." };
    }

    const adminAff = await prisma.affiliation.findFirst({
      where: {
        memberId: adminId,
        role: "ADMIN",
      },
    });

    if (!adminAff) {
      return { success: false, error: "관리자 권한이 없습니다." };
    }

    // 🌟 업데이트할 데이터 객체 조립
    const updateData: any = {
      name: data.name,
      company: data.company,
      job: data.job,
    };

    // 🌟 프론트에서 넘어온 비밀번호가 비어있지 않으면 강력 암호화해서 업데이트 대상에 추가!
    if (data.newPassword && data.newPassword.trim() !== "") {
      updateData.password = await bcrypt.hash(data.newPassword, 10);
    }

    // DB 업데이트 실행
    await prisma.member.update({
      where: { id: memberId },
      data: updateData,
    });

    // 페이지 데이터 갱신
    revalidatePath("/admin/member");

    return { success: true };
  } catch (error: any) {
    console.error("Member Update Error:", error);

    if (error.code === "P2002") {
      return { success: false, error: "이미 존재하는 정보입니다." };
    }

    return { success: false, error: "정보 수정 중 서버 오류가 발생했습니다." };
  }
}

export async function updateMemberInfoAction(
  data: z.infer<typeof UpdateSchema>
) {
  const session = await auth();
  // ... 권한 체크

  try {
    // 👇 Affiliation과 Member를 동시에 업데이트
    await prisma.affiliation.update({
      where: { id: data.affiliationId },
      data: {
        // 1. 소속 정보 수정
        role: data.role,

        // 2. 연결된 회원 개인정보 수정 (Nested Update)
        member: {
          update: {
            company: data.company || null,
            job: data.job || null,
            address: data.address || null,
          },
        },
      },
    });

    revalidatePath("/admin/members");
    return { success: true, message: "회원 정보가 수정되었습니다." };
  } catch (error) {
    console.error(error);
    return { success: false, message: "수정 중 오류가 발생했습니다." };
  }
}

export async function approveMemberAction(affiliationId: number) {
  await prisma.affiliation.update({
    where: { id: affiliationId },
    data: { status: "ACTIVE" },
  });
  revalidatePath("/admin/members");
}

export async function rejectMemberAction(affiliationId: number) {
  await prisma.affiliation.update({
    where: { id: affiliationId },
    data: { status: "REJECTED" },
  });
  revalidatePath("/admin/members");
}

export async function updateGreeting(
  affiliationId: number,
  formData: FormData
) {
  try {
    const session = await auth();

    // 1. 보안 검증: 현재 로그인한 사용자가 ADMIN인지 확인
    const adminUser = await prisma.member.findUnique({
      where: { id: Number(session?.user?.id) },
      include: { affiliations: true },
    });

    const isAdmin = adminUser?.affiliations.some((aff) => aff.role === "ADMIN");
    if (!isAdmin) {
      return { success: false, message: "권한이 없습니다." };
    }

    // 2. 데이터 추출 및 기본 정제
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;

    if (!content || content.trim().length < 5) {
      return { success: false, message: "내용을 최소 5자 이상 입력해주세요." };
    }

    // 3. Upsert 실행 (있으면 수정, 없으면 생성)
    // 💡 에디터를 안 쓰므로 \n 문자열이 그대로 DB에 저장됩니다.
    await prisma.greeting.upsert({
      where: { affiliationId: affiliationId },
      update: {
        title: title,
        content: content,
      },
      create: {
        affiliationId: affiliationId,
        title: title,
        content: content,
      },
    });

    // 4. 페이지 데이터 갱신 (관리자 페이지와 메인 페이지 경로)
    revalidatePath("/admin/orgs");
    // revalidatePath("/"); // 메인 페이지에서도 인사말을 쓴다면 추가

    return { success: true };
  } catch (error) {
    console.error("Greeting Update Error:", error);
    return { success: false, message: "서버 오류가 발생했습니다." };
  }
}

export async function adminResetPasswordAction(
  orgId: number,
  targetMemberId: number,
  newPassword: string
) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("로그인이 필요합니다.");

    // 🌟 1. 권한 체크: 호출한 사람이 이 단체의 관리자가 맞는지 확인
    if (!isOrgAdmin(session.user, orgId)) {
      return { success: false, error: "관리자 권한이 없습니다." };
    }

    // 🌟 2. 타겟 유저 검증: 이 유저가 우리 단체 소속이 맞는지 확인 (해킹 방어)
    const targetAffiliation = await prisma.affiliation.findFirst({
      where: {
        memberId: targetMemberId,
        organizationId: orgId,
      },
    });

    if (!targetAffiliation) {
      return { success: false, error: "해당 회원은 이 단체 소속이 아닙니다." };
    }

    // 🌟 3. 새 비밀번호 강력 암호화
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 🌟 4. DB 업데이트 (트랜잭션)
    // 비밀번호를 변경하고, 혹시라도 아직 승인 대기(PENDING) 상태였다면 김에 같이 ACTIVE로 활성화시켜 줍니다.
    await prisma.$transaction(async (tx) => {
      await tx.member.update({
        where: { id: targetMemberId },
        data: { password: hashedNewPassword },
      });

      if (targetAffiliation.status === "ACTIVE") {
        await tx.affiliation.update({
          where: { id: targetAffiliation.id },
          data: { status: "PENDING" },
        });
      }
    });

    // 🌟 5. 관리자 회원 관리 페이지의 캐시를 날려서 변경된 상태(ACTIVE 등)가 즉시 반영되게 함
    revalidatePath(`/m/org/${orgId}/admin/members`);

    return { success: true };
  } catch (error) {
    console.error("[ADMIN_RESET_PASSWORD_ERROR]", error);
    return {
      success: false,
      error: "비밀번호 초기화 중 서버 오류가 발생했습니다.",
    };
  }
}
