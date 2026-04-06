import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const memberId = Number(session.user.id);
  // 권한 체크
  const myAffiliation = await prisma.affiliation.findFirst({
    where: { memberId },
    select: { role: true, organizationId: true },
  });

  const isSuperAdmin = myAffiliation?.role == "ADMIN";

  // 일반 유저는 접근 금지
  if (!isSuperAdmin) {
    // 본인이 소속된 단체 중 MANAGER나 ADMIN 권한이 있는 곳이 하나라도 있는지 확인
    const isManager = myAffiliation?.role == "ADMIN";

    if (isManager) {
      // 🌟 단체 매니저라면, 본인이 관리하는 첫 번째 단체의 매니저 홈으로 쫓아냄!
      redirect(`/manager/${myAffiliation.organizationId}/members`);
    } else {
      // 아무 권한도 없는 일반 유저라면 메인(유저) 페이지로 쫓아냄
      redirect("/");
    }
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* 1. PC용 사이드바 (md 이상에서만 보임) */}
      <AdminNav role={myAffiliation.role} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 2. 모바일용 헤더 (md 미만에서만 보임) */}
        <header className="md:hidden bg-white border-b p-4 flex items-center justify-between">
          <span className="font-bold text-lg">관리자 대시보드</span>
          <AdminNav role={myAffiliation.role} mobile={true} />
        </header>

        {/* 3. 메인 컨텐츠 영역 */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
