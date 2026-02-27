import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgIdParam = searchParams.get("orgId");

  const orgId = orgIdParam ? Number(orgIdParam) : null;
  const orgIdValid = Number.isInteger(orgId) && (orgId as number) > 0;

  if (!orgIdValid) {
    return NextResponse.json(
      { success: false, message: "INVALID_ORG_ID" },
      { status: 400 }
    );
  }

  const posts = await prisma.post.findMany({
    where: {
      organizationId: orgId as number,
      type: "NOTICE",
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
      organizationId: true,
    },
    orderBy: { createdAt: "desc" },
    take: 2,
  });

  return NextResponse.json({
    success: true,
    data: {
      notices: posts.map((p) => ({
        id: p.id,
        title: p.title,
        createdAt: p.createdAt,
        organizationId: p.organizationId,
      })),
    },
  });
}
