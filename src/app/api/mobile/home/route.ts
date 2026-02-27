import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileAuth } from "@/lib/auth/mobileAuth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { memberId } = await requireMobileAuth(request);

    const { searchParams } = new URL(request.url);
    const orgIdParam = searchParams.get("orgId");
    const orgId = orgIdParam ? Number(orgIdParam) : null;
    const orgIdValid = Number.isInteger(orgId) && (orgId as number) > 0;

    const affiliations = await prisma.affiliation.findMany({
      where: { memberId, status: "ACTIVE" },
      select: { organizationId: true },
    });
    const myOrgIds = affiliations.map((a) => a.organizationId);

    if (orgIdValid && !myOrgIds.includes(orgId as number)) {
      return NextResponse.json(
        { success: false, message: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const targetOrgIds = orgIdValid ? [orgId as number] : myOrgIds;
    if (targetOrgIds.length === 0) {
      return NextResponse.json({ success: true, data: { notices: [] } });
    }

    const posts = await prisma.post.findMany({
      where: { organizationId: { in: targetOrgIds }, type: "NOTICE" },
      select: { id: true, title: true, createdAt: true, organizationId: true },
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
  } catch (e: any) {
    const status = e?.status || 401;
    return NextResponse.json(
      { success: false, message: status === 401 ? "UNAUTHORIZED" : "ERROR" },
      { status }
    );
  }
}
