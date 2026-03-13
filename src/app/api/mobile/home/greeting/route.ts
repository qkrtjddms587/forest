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

    const memberId = Number(decoded.sub); // 토큰에서 유저 ID 추출

    // 2. 쿼리 파라미터 확인
    const { searchParams } = new URL(req.url);
    let targetOrgId = searchParams.get("orgId")
      ? Number(searchParams.get("orgId"))
      : null;

    // 🌟 3. 동적 orgId 할당: 파라미터로 안 넘어왔다면, 이 유저의 '대표 소속(isPrimary)'을 찾습니다.
    if (!targetOrgId) {
      const primaryAffiliation = await prisma.affiliation.findFirst({
        where: {
          memberId: memberId,
          isPrimary: true,
          status: "ACTIVE", // 승인된 활성 상태인 곳만
        },
        select: { organizationId: true },
      });

      if (!primaryAffiliation) {
        return NextResponse.json(
          { success: false, message: "가입된 대표 단체를 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      targetOrgId = primaryAffiliation.organizationId;
    }

    // 4. 결정된 targetOrgId와 '대표 기수(isPrimary: true)' 조건으로 인사말 조회
    const greetings = await prisma.greeting.findMany({
      where: {
        isActive: true,
        affiliation: {
          organizationId: targetOrgId,
          generation: {
            isPrimary: true,
          },
        },
      },
      include: {
        affiliation: {
          select: {
            member: { select: { name: true, image: true } },
            Position: { select: { name: true } },
            generation: { select: { name: true } },
          },
        },
      },
      orderBy: { displayOrder: "asc" },
    });

    // 5. 프론트엔드용 데이터 가공
    const formattedGreetings = greetings.map((g) => ({
      id: g.id,
      title: g.title,
      content: g.content,
      imageUrl: g.imageUrl,
      signImageUrl: g.signImageUrl,
      author: {
        name: g.affiliation.member.name,
        profileImage: g.affiliation.member.image,
        positionName: g.affiliation.Position?.name || "직책 없음",
        generationName: g.affiliation.generation.name,
      },
    }));

    return NextResponse.json({ success: true, data: formattedGreetings });
  } catch (error) {
    console.error("[GREETINGS_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "인사말을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
