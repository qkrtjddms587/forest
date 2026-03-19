import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { randomToken, sha256, signAccessToken } from "@/lib/auth/tokens";

const REFRESH_DAYS = 90;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { loginId, password, deviceId, userAgent } = body;

    if (!loginId || !password) {
      return NextResponse.json(
        { success: false, message: "아이디와 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    // 🌟 1. 유저 조회 시, affiliations(가입 정보)도 함께 가져옵니다!
    const member = await prisma.member.findUnique({
      where: { loginId: String(loginId) },
      include: {
        affiliations: true, // 가입된 단체/기수 정보 모두 포함
      },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, message: "존재하지 않는 계정입니다." },
        { status: 401 }
      );
    }

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

    // 🌟 2. 클라이언트에게 내려줄 status 값을 결정합니다.
    // (보통 주 단체(isPrimary=true)의 상태를 내려주거나, 가장 첫 번째 가입 정보의 상태를 내려줍니다.)
    const primaryAffiliation =
      member.affiliations.find((aff) => aff.isPrimary) ||
      member.affiliations[0];

    // 가입 정보가 아예 없다면 "NONE" 같은 기본값을 줄 수 있습니다.
    const affStatus = primaryAffiliation ? primaryAffiliation.status : "NONE";

    // 성공 응답
    return NextResponse.json({
      success: true,
      accessToken,
      refreshToken,
      member: {
        id: member.id,
        name: member.name,
        loginId: member.loginId,
        affStatus: affStatus, // 👈 가입 상태 정보 추가!
      },
    });
  } catch (error) {
    console.error("[LOGIN_API_ERROR]", error);

    return NextResponse.json(
      { success: false, message: "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
