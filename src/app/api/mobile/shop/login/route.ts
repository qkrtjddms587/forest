import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/prisma"; // 🌟 Prisma 추가!

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "토큰이 제공되지 않았습니다." },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = await verifyAccessToken(token);
    } catch (error: any) {
      if (
        error?.code === "ERR_JWT_EXPIRED" ||
        error?.name === "TokenExpiredError"
      ) {
        return NextResponse.json(
          { message: "토큰이 만료되었습니다.", code: "TOKEN_EXPIRED" },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { message: "유효하지 않은 토큰입니다." },
        { status: 401 }
      );
    }

    if (!decoded || !decoded.sub) {
      return NextResponse.json(
        { message: "토큰에 유저 정보가 없습니다." },
        { status: 401 }
      );
    }

    const tokenMemberId = Number(decoded.sub);

    // 🌟 [추가된 핵심 로직] DB에서 sub(member PK) 값으로 loginId 찾아오기!
    const member = await prisma.member.findUnique({
      where: { id: tokenMemberId },
      select: { loginId: true }, // 무거운 전체 데이터 대신 loginId 딱 하나만 가볍게 가져옵니다
    });

    if (!member || !member.loginId) {
      return NextResponse.json(
        { message: "회원 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 🌟 Request Body에서 클라이언트가 보낸 비교용 id 꺼내기
    const body = await req.json();
    const requestLoginId = body.id; // 프론트에서 넘겨준 파라미터가 loginId라고 가정

    if (!requestLoginId) {
      return NextResponse.json(
        { message: "검증할 파라미터(id)가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 🌟 찾아온 DB의 loginId와 파라미터로 넘어온 id 교차 검증!
    if (member.loginId !== requestLoginId) {
      console.warn(
        `[Shop 로그인 경고] DB loginId(${member.loginId})와 요청된 id(${requestLoginId}) 불일치`
      );
      return NextResponse.json(
        { message: "권한이 없습니다. (ID 불일치)" },
        { status: 403 }
      );
    }

    // 완벽하게 일치하면 성공 응답!
    return NextResponse.json(
      {
        success: true,
        message: "본인 인증이 완료되었습니다.",
        loginId: member.loginId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Shop 로그인 검증 에러:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
