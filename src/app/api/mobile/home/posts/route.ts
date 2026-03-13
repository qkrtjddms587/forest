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
    const memberId = Number(decoded.sub);

    // 2. 파라미터 확인 (type 추가!)
    const { searchParams } = new URL(req.url);
    let targetOrgId = searchParams.get("orgId")
      ? Number(searchParams.get("orgId"))
      : null;
    const postType = searchParams.get("type"); // 예: "NOTICE", "FREE", "EVENT" 등
    const limit = searchParams.get("limit")
      ? Number(searchParams.get("limit"))
      : 20;

    // 3. 파라미터로 넘어온 orgId가 없으면 유저의 '대표 소속(isPrimary)'을 찾습니다.
    if (!targetOrgId) {
      const primaryAffiliation = await prisma.affiliation.findFirst({
        where: {
          memberId: memberId,
          isPrimary: true,
          status: "ACTIVE",
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

    // 4. 통합 게시글 조회 로직
    const posts = await prisma.post.findMany({
      where: {
        organizationId: targetOrgId,
        // 🌟 핵심: type 파라미터가 넘어왔을 때만 where 조건에 추가합니다!
        ...(postType && { type: postType }),
      },
      include: {
        author: {
          select: { name: true, image: true },
        },
        images: {
          select: { url: true },
          take: 1, // 목록에서는 성능을 위해 최대 5개까지만 가져오도록 제한 가능
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // 5. 프론트엔드용 데이터 가공
    const formattedPosts = posts.map((post) => ({
      id: post.id,
      type: post.type, // 어떤 타입의 글인지도 같이 내려줍니다
      title: post.title,
      content: post.content,
      viewCount: post.viewCount,
      createdAt: post.createdAt,
      authorName: post.author.name,
      authorImage: post.author.image,
      commentCount: post._count.comments,
      thumbnail:
        `${process.env.NEXT_PUBLIC_S3_DOMAIN}/${process.env.NEXT_PUBLIC_S3_BUCKET}${post.images[0]?.url}` ||
        null,
    }));

    return NextResponse.json({ success: true, data: formattedPosts });
  } catch (error) {
    console.error("[POSTS_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "게시글을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
