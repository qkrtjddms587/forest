import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/tokens";

export async function GET(req: Request) {
  try {
    // 1. JWT 토큰 검증 및 memberId 추출
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = await verifyAccessToken(token);
    if (!decoded || !decoded.sub) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 401 }
      );
    }
    const memberId = Number(decoded.sub);
    // // 2. 파라미터 확인 및 동적 targetOrgId 설정
    const { searchParams } = new URL(req.url);
    let targetOrgId = searchParams.get("orgId")
      ? Number(searchParams.get("orgId"))
      : null;

    // 파라미터가 없으면 유저의 '대표 소속(isPrimary)'을 찾습니다.
    if (!targetOrgId) {
      const primaryAffiliation = await prisma.affiliation.findFirst({
        where: {
          memberId: memberId,
          isPrimary: true,
          status: "ACTIVE",
        },
        select: { organizationId: true },
      });
      // 대표 소속이 있으면 해당 ID를, 없으면 null(공통 배너만 조회)을 유지합니다.
      if (primaryAffiliation) {
        targetOrgId = primaryAffiliation.organizationId;
      }
    }

    const now = new Date();

    // 3. 배너 조회
    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        // Prisma의 AND 구문을 사용하여 두 가지 조건(기간 조건 + 소속 조건)을 모두 만족하게 합니다.
        AND: [
          {
            // [조건 1] 예약 노출 기간 검증
            OR: [
              { startDate: null, endDate: null },
              { startDate: { lte: now }, endDate: null },
              { startDate: null, endDate: { gte: now } },
              { startDate: { lte: now }, endDate: { gte: now } },
            ],
          },
          {
            // 🌟 [조건 2] 핵심: 앱 전체 공통 배너(null)와 내 대표 단체 배너를 동시에 가져옵니다!
            OR: [
              { organizationId: null },
              ...(targetOrgId ? [{ organizationId: targetOrgId }] : []),
            ],
          },
        ],
      },
      orderBy: { displayOrder: "asc" }, // 정렬 순서대로
    });

    return NextResponse.json({ success: true, data: banners });
  } catch (error) {
    console.error("[BANNERS_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "배너를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
