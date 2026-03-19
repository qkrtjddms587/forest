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

    // 2. 토큰 검증 및 payload에서 유저 식별자(sub) 추출
    let payload;
    try {
      payload = await verifyAccessToken(token);
    } catch (e) {
      return NextResponse.json(
        { success: false, message: "유효하지 않거나 만료된 토큰입니다." },
        { status: 401 }
      );
    }

    // signAccessToken({ sub: String(member.id) }) 로 구웠으니 id는 payload.sub 에 있습니다.
    const memberId = Number(payload.sub);

    // 3. 바디에서 새 비밀번호만 받기 (기존 비밀번호 생략!)
    const body = await req.json();
    const { newPassword } = body;

    if (!newPassword) {
      return NextResponse.json(
        { success: false, message: "새로 설정할 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    // 4. 유저 및 가입 상태(PENDING) 조회
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

    // 🌟 5. PENDING 상태인지 확실하게 검증 (보안)
    const isPending = member.affiliations.some(
      (aff) => aff.status === "PENDING"
    );
    if (!isPending) {
      return NextResponse.json(
        {
          success: false,
          message: "승인 대기(PENDING) 상태의 회원만 이용할 수 있습니다.",
        },
        { status: 403 }
      );
    }

    // 6. 묻지도 따지지도 않고 새 비밀번호 강력 암호화!
    const hashedNewPassword = await bcrypt.hash(String(newPassword), 10);

    // 7. DB 업데이트
    await prisma.member.update({
      where: { id: memberId },
      data: { password: hashedNewPassword },
    });

    return NextResponse.json({
      success: true,
      message: "비밀번호가 성공적으로 설정되었습니다.",
    });
  } catch (error) {
    console.error("[INIT_PASSWORD_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
