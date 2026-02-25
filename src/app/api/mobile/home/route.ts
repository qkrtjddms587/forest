import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const orgIdParam = searchParams.get("orgId");
  const orgId = orgIdParam ? Number(orgIdParam) : null;
  const orgIdValid = Number.isInteger(orgId) && (orgId as number) > 0;

  // 세션에 affiliations가 들어있다는 전제 (네 auth.ts session 콜백에서 넣고 있음)
  const affiliations = (session.user as any)?.affiliations || [];
  const myOrgIds: number[] = affiliations
    .map((a: any) => a.organization?.id)
    .filter((v: any) => Number.isInteger(v));

  // orgId가 있으면 소속/권한 체크 (임의 orgId 접근 방지)
  if (orgIdValid && !myOrgIds.includes(orgId as number)) {
    return NextResponse.json(
      { success: false, message: "FORBIDDEN" },
      { status: 403 }
    );
  }

  // 조회 대상 조직 결정
  const targetOrgIds = orgIdValid ? [orgId as number] : myOrgIds;

  // 소속이 없고 orgId도 없으면 빈 배열
  if (targetOrgIds.length === 0) {
    return NextResponse.json({ success: true, data: { notices: [] } });
  }

  const posts = await prisma.post.findMany({
    where: {
      organizationId: { in: targetOrgIds },
      type: "NOTICE", // ✅ 공지사항은 Post.type으로 구분
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
