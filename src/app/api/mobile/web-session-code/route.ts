import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomToken, verifyAccessToken } from "@/lib/auth/tokens";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const authz = req.headers.get("authorization") || "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : null;

  if (!token) {
    return NextResponse.json({ message: "missing token" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await verifyAccessToken(token);
  } catch {
    return NextResponse.json({ message: "invalid token" }, { status: 401 });
  }

  const memberId = Number(payload.sub);
  if (!Number.isInteger(memberId) || memberId <= 0) {
    return NextResponse.json({ message: "invalid sub" }, { status: 401 });
  }

  // ✅ 기존 미사용 코드 정리(선택이지만 강추)
  await prisma.loginCode.deleteMany({
    where: { memberId, usedAt: null },
  });

  const code = randomToken(32);
  const expiresAt = new Date(Date.now() + 90 * 1000);

  await prisma.loginCode.create({ data: { code, memberId, expiresAt } });

  return NextResponse.json({ code, expiresAt });
}
