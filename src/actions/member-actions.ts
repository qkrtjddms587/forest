"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

interface GetMembersParams {
  q?: string;
  orgId?: string;
  genId?: string;
  status?: string;
  page: number;
}

// React Query에서 pageParam을 넘겨줄 것입니다.
export async function getMembersAction({
  orgId,
  page = 1, // pageParam이 여기로 들어옴
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
    // status: "ACTIVE" as const,

    // 🌟 핵심 추가: 연결된 member의 이름이 '최고관리자'가 아닌 것만 필터링!
    member: {
      name: {
        not: "최고관리자",
      },
    },

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
    include: {
      member: true,
      generation: true,
      Position: true,
    },
    orderBy: { generation: { name: "desc" } },
  });

  const nextId = members.length === ITEMS_PER_PAGE ? page + 1 : null;

  return {
    data: members,
    nextId,
  };
}

export async function getMoreMembersAction(params: GetMembersParams) {
  const limit = 20; // 한 번에 불러올 데이터 개수
  const skip = (params.page - 1) * limit;

  try {
    const members = await prisma.member.findMany({
      where: {
        name: { contains: params.q || "" },
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

export async function createMemberAction(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const loginId = formData.get("loginId") as string;
    const password = formData.get("password") as string;
    const organizationId = Number(formData.get("organizationId"));
    const generationId = Number(formData.get("generationId"));

    // 선택 사항
    const positionId = formData.get("positionId")
      ? Number(formData.get("positionId"))
      : null;
    const company = formData.get("company") as string;

    // 1. 필수 값 검증
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

    // 2. 중복 검사 (전화번호, 아이디)
    const existingMember = await prisma.member.findFirst({
      where: { OR: [{ phone }, { loginId }] },
    });

    if (existingMember) {
      if (existingMember.phone === phone)
        return { success: false, error: "이미 가입된 전화번호입니다." };
      if (existingMember.loginId === loginId)
        return { success: false, error: "이미 사용 중인 아이디입니다." };
    }

    // 3. 비밀번호 해싱 (실제 적용 시 bcrypt 사용 권장)
    const hashedPassword = await bcrypt.hash(String(password), 10);

    // 🌟 4. 트랜잭션으로 멤버 생성 및 소속 연결을 동시에 처리
    const newMember = await prisma.$transaction(async (tx) => {
      // 4-1. Member 생성
      const member = await tx.member.create({
        data: {
          name,
          phone,
          loginId,
          password: hashedPassword,
          company: company || null,
        },
      });

      // 4-2. Affiliation (소속) 생성 (관리자가 직접 만드므로 상태는 기본 ACTIVE)
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

      return member;
    });

    // 성공 시 캐시 무효화 (회원 목록 새로고침)
    revalidatePath("/admin/members");

    return { success: true, memberId: newMember.id };
  } catch (error) {
    console.error("[CREATE_MEMBER_ERROR]", error);
    return { success: false, error: "서버 오류가 발생했습니다." };
  }
}

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
      const rawPhone = row["전화번호"] || row.phone; // 원본 전화번호 (예: 010-1234-5678)
      const password = row["비밀번호"] || row.password;
      const company = row["회사명"] || row.company || null;
      const address = row["주소"] || row.address || null;

      if (!name || !rawPhone || !password) {
        failCount++;
        errors.push(
          `${index + 2}번째 행: 필수 정보 누락 (이름, 전화번호, 비밀번호)`
        );
        continue;
      }

      // 🌟 핵심 로직: 정규식을 사용해 전화번호에서 하이픈 및 숫자가 아닌 모든 문자 제거
      const phone = String(rawPhone).trim();
      const loginId = phone.replace(/[^0-9]/g, ""); // "010-1234-5678" -> "01012345678"

      // 전화번호 또는 아이디 중복 체크
      const existing = await prisma.member.findFirst({
        where: { OR: [{ phone }, { loginId }] },
      });

      if (existing) {
        failCount++;
        errors.push(`${name}(${phone}): 이미 가입된 번호입니다.`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(String(password), 10);
      // 멤버 및 소속 생성
      await prisma.$transaction(async (tx) => {
        const newMember = await tx.member.create({
          data: {
            name,
            phone, // 원본 전화번호 저장 (하이픈 포함 유지)
            loginId, // 🌟 하이픈이 제거된 번호가 아이디로 저장됨
            password: hashedPassword,
            company,
            address,
          },
        });

        await tx.affiliation.create({
          data: {
            memberId: newMember.id,
            organizationId,
            generationId,
            status: "PENDING",
            role: "USER",
          },
        });
      });

      successCount++;
    } catch (err) {
      failCount++;
      errors.push(`${row["이름"] || index + 2}행 처리 중 서버 오류`);
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

// src/actions/admin-member-actions.ts 에 추가

export async function bulkDeleteMembersAction(memberIds: number[]) {
  if (!memberIds || memberIds.length === 0)
    return { success: false, error: "선택된 회원이 없습니다." };

  try {
    await prisma.$transaction(async (tx) => {
      // 1. 삭제할 멤버들의 모든 소속(Affiliation) ID 추출
      const affiliations = await tx.affiliation.findMany({
        where: { memberId: { in: memberIds } },
        select: { id: true },
      });
      const affiliationIds = affiliations.map((a) => a.id);

      if (affiliationIds.length > 0) {
        // 2. 손자 데이터(회비, 인사말) 일괄 삭제
        await tx.membershipFee.deleteMany({
          where: { affiliationId: { in: affiliationIds } },
        });
        await tx.greeting.deleteMany({
          where: { affiliationId: { in: affiliationIds } },
        });

        // 3. 자식 데이터(소속) 일괄 삭제
        await tx.affiliation.deleteMany({
          where: { memberId: { in: memberIds } },
        });
      }

      // 🌟 [추가된 핵심 로직] 4. Member에 직접 물려있는 인증/디바이스 관련 데이터 싹 지우기!
      // (Post와 Comment는 스키마에 Cascade가 걸려있어서 안 적어도 알아서 날아갑니다)
      await tx.refreshToken.deleteMany({
        where: { memberId: { in: memberIds } },
      });
      await tx.loginCode.deleteMany({
        where: { memberId: { in: memberIds } },
      });
      await tx.devicePushToken.deleteMany({
        where: { memberId: { in: memberIds } },
      });

      // 5. 드디어 최종 부모 데이터(멤버) 일괄 삭제!
      await tx.member.deleteMany({
        where: { id: { in: memberIds } },
      });
    });

    revalidatePath("/admin/members");
    return { success: true };
  } catch (error) {
    console.error("[BULK_DELETE_ERROR]", error);
    return { success: false, error: "일괄 삭제 중 서버 오류가 발생했습니다." };
  }
}

export async function bulkApproveMembersAction(memberIds: number[]) {
  try {
    // 🌟 선택된 회원의 소속(Affiliation) 상태 중 'PENDING'인 것을 'ACTIVE'로 모두 업데이트
    await prisma.affiliation.updateMany({
      where: {
        memberId: { in: memberIds },
        status: "PENDING",
      },
      data: {
        status: "ACTIVE",
      },
    });

    // 경로 캐시 날리기 (목록 새로고침 용도)
    revalidatePath("/admin/members"); // 💡 실제 사용하시는 경로에 맞게 수정하세요.

    return { success: true };
  } catch (error) {
    console.error("[BULK_APPROVE_ERROR]", error);
    return { success: false, error: "일괄 승인 처리 중 오류가 발생했습니다." };
  }
}
