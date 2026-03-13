"use server";

import { syncMemberToGnuboard } from "@/lib/gnuboard/gnuboard-sync";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

// 🌟 추가: 분리해둔 그누보드 동기화 함수 임포트

interface GetMembersParams {
  q?: string;
  orgId?: string;
  genId?: string;
  status?: string;
  page: number;
}

// ... (getMembersAction, getMoreMembersAction은 기존과 100% 동일하므로 생략 없이 그대로 두시면 됩니다) ...

export async function getMembersAction({
  orgId,
  page = 1,
  query = "",
  generationId,
}: {
  orgId: number;
  page: number;
  query: string;
  generationId: string;
}) {
  const ITEMS_PER_PAGE = 20;

  const whereCondition = {
    organizationId: orgId,
    status: "ACTIVE" as const,
    member: { name: { not: "최고관리자" } }, // 최고관리자 제외
    OR: query
      ? [
          { member: { name: { contains: query } } },
          { member: { phone: { contains: query } } },
          { member: { company: { contains: query } } },
        ]
      : undefined,
    generationId:
      generationId && generationId !== "all" ? Number(generationId) : undefined,
  };

  const members = await prisma.affiliation.findMany({
    where: whereCondition,
    take: ITEMS_PER_PAGE,
    skip: (page - 1) * ITEMS_PER_PAGE,
    include: { member: true, generation: true },
    orderBy: { generation: { name: "desc" } },
  });

  const nextId = members.length === ITEMS_PER_PAGE ? page + 1 : null;
  return { data: members, nextId };
}

export async function getMoreMembersAction(params: GetMembersParams) {
  const limit = 20;
  const skip = (params.page - 1) * limit;

  try {
    const members = await prisma.member.findMany({
      where: {
        name: { contains: params.q || "", not: "최고관리자" }, // 최고관리자 제외
        affiliations: {
          some: {
            organization: { deletedAt: null },
            generation: { deletedAt: null },
            ...(params.orgId && { organizationId: Number(params.orgId) }),
            ...(params.genId && { generationId: Number(params.genId) }),
            ...(params.status && { status: params.status as any }),
          },
        },
      },
      include: {
        affiliations: {
          where: {
            organization: { deletedAt: null },
            generation: { deletedAt: null },
          },
          include: {
            organization: true,
            generation: true,
            Position: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
      take: limit,
      skip: skip,
    });

    return { success: true, data: members };
  } catch (error) {
    console.error("[GET_MORE_MEMBERS_ERROR]", error);
    return { success: false, error: "데이터를 불러오는데 실패했습니다." };
  }
}

// ----------------------------------------------------
// 🌟 단일 회원 생성 액션 (그누보드 연동 적용)
// ----------------------------------------------------
export async function createMemberAction(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const loginId = formData.get("loginId") as string;
    const password = formData.get("password") as string;
    const organizationId = Number(formData.get("organizationId"));
    const generationId = Number(formData.get("generationId"));
    const positionId = formData.get("positionId")
      ? Number(formData.get("positionId"))
      : null;
    const company = formData.get("company") as string;

    if (
      !name ||
      !phone ||
      !loginId ||
      !password ||
      !organizationId ||
      !generationId
    ) {
      return { success: false, error: "필수 항목을 모두 입력해주세요." };
    }

    const existingMember = await prisma.member.findFirst({
      where: { OR: [{ phone }, { loginId }] },
    });

    if (existingMember) {
      if (existingMember.phone === phone)
        return { success: false, error: "이미 가입된 전화번호입니다." };
      if (existingMember.loginId === loginId)
        return { success: false, error: "이미 사용 중인 아이디입니다." };
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const newMember = await prisma.$transaction(async (tx) => {
      // 1. 새 앱: Member 생성
      const member = await tx.member.create({
        data: {
          name,
          phone,
          loginId,
          password: hashedPassword,
          company: company || null,
        },
      });

      // 2. 새 앱: Affiliation 생성
      await tx.affiliation.create({
        data: {
          memberId: member.id,
          organizationId,
          generationId,
          positionId,
          status: "PENDING",
          role: "USER",
        },
      });

      // 🌟 3. 그누보드 동기화 호출 (어댑터 패턴)
      const gnuResult = await syncMemberToGnuboard({
        loginId,
        rawPassword: password,
        name,
      });

      // 동기화 실패 시 에러를 던짐 -> Prisma가 알아서 트랜잭션 전체를 롤백(취소)함!
      if (!gnuResult.success) {
        throw new Error(
          "그누보드 동기화에 실패하여 회원가입이 취소되었습니다."
        );
      }

      return member;
    });

    revalidatePath("/admin/members");
    return { success: true, memberId: newMember.id };
  } catch (error: any) {
    console.error("[CREATE_MEMBER_ERROR]", error);
    // 에러 메시지가 커스텀 에러(그누보드 실패)면 해당 메시지를 띄워줌
    return {
      success: false,
      error: error.message || "서버 오류가 발생했습니다.",
    };
  }
}

// ----------------------------------------------------
// 🌟 일괄 회원 생성 액션 (그누보드 연동 적용)
// ----------------------------------------------------
export async function bulkCreateMembersAction(
  members: any[],
  organizationId: number,
  generationId: number
) {
  let successCount = 0;
  let failCount = 0;
  let errors: string[] = [];

  for (const [index, row] of members.entries()) {
    try {
      const name = row["이름"] || row.name;
      const rawPhone = row["전화번호"] || row.phone;
      const password = row["비밀번호"] || row.password;
      const company = row["회사명"] || row.company || null;
      const address = row["주소"] || row.address || null;

      if (!name || !rawPhone || !password) {
        failCount++;
        errors.push(`${index + 2}번째 행: 필수 정보 누락`);
        continue;
      }

      const phone = String(rawPhone).trim();
      const loginId = phone.replace(/[^0-9]/g, "");

      const existing = await prisma.member.findFirst({
        where: { OR: [{ phone }, { loginId }] },
      });

      if (existing) {
        failCount++;
        errors.push(`${name}(${phone}): 이미 가입된 번호입니다.`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(String(password), 10);

      // 트랜잭션으로 안전하게 묶음
      await prisma.$transaction(async (tx) => {
        // 1. 멤버 생성
        const newMember = await tx.member.create({
          data: {
            name,
            phone,
            loginId,
            password: hashedPassword,
            company,
            address,
          },
        });

        // 2. 소속 연결
        await tx.affiliation.create({
          data: {
            memberId: newMember.id,
            organizationId,
            generationId,
            status: "PENDING",
            role: "USER",
          },
        });

        // 🌟 3. 그누보드 동기화! (실패 시 이 행(row)의 Prisma DB 생성도 자동 롤백)
        const gnuResult = await syncMemberToGnuboard({
          loginId,
          rawPassword: password,
          name,
        });

        if (!gnuResult.success) {
          throw new Error("그누보드 동기화 실패");
        }
      });

      successCount++;
    } catch (err) {
      failCount++;
      errors.push(
        `${
          row["이름"] || index + 2
        }행 처리 중 서버 오류 (또는 그누보드 동기화 실패)`
      );
    }
  }

  revalidatePath("/admin/members");

  return {
    success: true,
    successCount,
    failCount,
    errors,
  };
}
