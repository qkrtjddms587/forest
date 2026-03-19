import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/tokens";

export async function POST(req: Request) {
  try {
    // 1. Authorization 헤더에서 Access Token 추출
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "인증 토큰이 없습니다." },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    // 2. 토큰 검증 및 payload에서 유저 식별자 추출
    let payload;
    try {
      payload = await verifyAccessToken(token);
    } catch (e) {
      return NextResponse.json(
        { success: false, message: "유효하지 않거나 만료된 토큰입니다." },
        { status: 401 }
      );
    }

    const memberId = Number(payload.sub);

    // 3. 바디에서 새 비밀번호 받기
    const body = await req.json();
    const { newPassword } = body;

    if (!newPassword) {
      return NextResponse.json(
        { success: false, message: "새로 설정할 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    // 4. 유저 및 가입 상태 조회
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { affiliations: true },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, message: "존재하지 않는 계정입니다." },
        { status: 404 }
      );
    }

    // 🌟 5. 첫 번째(index 0) 가입 정보가 PENDING인지 검증
    const firstAffiliation = member.affiliations[0];

    if (!firstAffiliation || firstAffiliation.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          message: "승인 대기(PENDING) 상태의 가입 정보가 없습니다.",
        },
        { status: 403 }
      );
    }

    // 6. 새 비밀번호 강력 암호화
    const hashedNewPassword = await bcrypt.hash(String(newPassword), 10);

    // 🌟 7. DB 업데이트 (member 비밀번호 변경 + 정확히 index 0번의 affiliation만 ACTIVE로 변경)
    await prisma.$transaction([
      prisma.member.update({
        where: { id: memberId },
        data: { password: hashedNewPassword },
      }),
      prisma.affiliation.update({
        where: { id: firstAffiliation.id }, // 👈 index 0번의 고유 ID로 콕 집어서 업데이트!
        data: { status: "ACTIVE" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message:
        "비밀번호가 성공적으로 설정되었으며, 정식 회원으로 활성화되었습니다.",
    });
  } catch (error) {
    console.error("[INIT_PASSWORD_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
