import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { randomToken, sha256, signAccessToken } from "@/lib/auth/tokens";

const REFRESH_DAYS = 90;

export async function POST(req: Request) {
  // 🌟 1. 전체 로직을 try...catch로 감쌉니다!
  try {
    const body = await req.json();
    const { loginId, password, deviceId, userAgent } = body;

    if (!loginId || !password) {
      return NextResponse.json(
        { success: false, message: "아이디와 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    // 유저 조회
    const member = await prisma.member.findUnique({
      where: { loginId: String(loginId) },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, message: "존재하지 않는 계정입니다." },
        { status: 401 }
      );
    }

    // 🌟 2. 비밀번호가 없는 유저(소셜 로그인 등) 예외 처리
    if (!member.password) {
      return NextResponse.json(
        { success: false, message: "비밀번호가 설정되지 않은 계정입니다." },
        { status: 401 }
      );
    }

    // 비밀번호 검증
    const ok = await bcrypt.compare(String(password), member.password);
    if (!ok) {
      return NextResponse.json(
        { success: false, message: "비밀번호가 일치하지 않습니다." },
        { status: 401 }
      );
    }

    // 토큰 생성
    const accessToken = await signAccessToken({ sub: String(member.id) });
    const refreshToken = randomToken(48);
    const tokenHash = sha256(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);

    // Refresh Token 저장
    await prisma.refreshToken.create({
      data: {
        memberId: member.id,
        tokenHash,
        deviceId: deviceId ? String(deviceId) : null,
        userAgent: userAgent ? String(userAgent) : null,
        expiresAt,
      },
    });

    // 성공 응답
    return NextResponse.json({
      success: true,
      accessToken,
      refreshToken,
      member: { id: member.id, name: member.name, loginId: member.loginId },
    });
  } catch (error) {
    // 🌟 3. 에러가 나면 서버가 죽지 않고, 콘솔에 원인을 친절하게 찍어줍니다.
    console.error("[LOGIN_API_ERROR]", error);

    // 클라이언트(앱)에게는 JSON 형태로 500 에러를 내려줍니다.
    return NextResponse.json(
      { success: false, message: "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
