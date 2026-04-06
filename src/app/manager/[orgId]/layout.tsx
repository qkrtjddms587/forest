import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { ManagerSidebar } from "../_components/manager-sidebar";

export default async function ManagerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { orgId: orgIdString } = await params;
  const orgId = Number(orgIdString);

  if (isNaN(orgId)) notFound();

  const memberId = Number(session.user.id);

  // 🌟 1. 권한 검증 및 단체 정보 동시 조회 (가장 중요!)
  // 이 유저가 '이 단체(orgId)'의 매니저가 맞는지 DB에서 확인합니다.
  const affiliation = await prisma.affiliation.findFirst({
    where: {
      memberId: memberId,
      organizationId: orgId,
      role: { in: ["MANAGER", "ADMIN"] }, // 권한 체크
      organization: { deletedAt: null }, // 삭제되지 않은 단체인지 체크
    },
    include: {
      organization: {
        select: { name: true }, // 사이드바에 띄워줄 단체 이름
      },
    },
  });

  // 🌟 2. 권한이 없으면 가차 없이 튕겨냅니다. (보안 핵심)
  if (!affiliation) {
    // 권한이 없거나, 주소를 조작해서 들어온 경우 메인으로 쫓아냄
    redirect("/");
  }

  const orgName = affiliation.organization.name;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* 🌟 3. 매니저 전용 사이드바 (LNB) */}
      <ManagerSidebar orgId={orgId} orgName={orgName} />
      {/* 🌟 4. 메인 콘텐츠 영역 (하위 페이지들이 여기에 렌더링됨) */}
      <main className="flex-1 w-full p-10 max-w-[100vw] md:max-w-[calc(100vw-256px)] overflow-x-hidden">
        {/* 모바일용 헤더가 필요하다면 이곳 상단에 추가 */}
        {children}
      </main>
    </div>
  );
}
