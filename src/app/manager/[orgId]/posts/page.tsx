import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { PostTableList } from "./_components/post-table-list"; // 🌟 방금 만든 클라이언트 컴포넌트

interface Props {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ type?: string; q?: string }>;
}

export default async function OrgPostManagePage({
  params,
  searchParams,
}: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { orgId: orgIdString } = await params;
  if (!orgIdString || isNaN(Number(orgIdString))) return notFound();

  const orgId = Number(orgIdString);
  const { type, q } = await searchParams;

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true },
  });

  if (!org) return notFound();

  const whereCondition: any = { organizationId: orgId };
  if (type && type !== "ALL") {
    whereCondition.type = type;
  }

  if (q) {
    whereCondition.OR = [
      { title: { contains: q } },
      { content: { contains: q } },
    ];
  }

  // 🌟 초기 데이터는 딱 20개만 가져옵니다 (take: 20 추가)
  const initialPosts = await prisma.post.findMany({
    where: whereCondition,
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      author: {
        select: { name: true, company: true },
      },
    },
  });

  return (
    <div>
      {/* 헤더 영역 */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold mb-2">게시글 관리</h2>
          <p className="text-sm text-slate-500">
            {org.name} 커뮤니티에 등록된 모든 게시글을 모니터링하고 관리할 수
            있습니다.
          </p>
        </div>
      </div>

      {/* 🌟 테이블 영역: 클라이언트 컴포넌트에 초기 데이터를 넘깁니다 */}
      <PostTableList initialPosts={initialPosts} orgId={orgId} type={type} />
    </div>
  );
}
