import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AutoLogout } from "@/components/auth/auto-logout"; // 🌟 방금 만든 강제 로그아웃 컴포넌트
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ShieldCheck } from "lucide-react";

export default async function LobbyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // 1. 모든 소속 가져오기
  const allMyAffiliations = await prisma.affiliation.findMany({
    where: {
      memberId: Number(session.user.id),
      organization: { deletedAt: null },
    },
    include: { organization: true, generation: true, Position: true },
  });

  // 2. PENDING 검사 (비밀번호 설정 강제 이동)
  const hasPending = allMyAffiliations.some((aff) => aff.status === "PENDING");
  if (hasPending) {
    redirect("/setup-password");
  }

  // 🚀 3. 핵심 필터링: ACTIVE 상태이면서 && (ADMIN 이거나 MANAGER) 인 소속만 남깁니다!
  const managerAffiliations = allMyAffiliations.filter(
    (aff) =>
      aff.status === "ACTIVE" &&
      (aff.role === "ADMIN" || aff.role === "MANAGER"),
  );

  // 🚀 4. 매니저 권한이 있는 단체가 단 1개도 없다면? -> 즉시 강제 로그아웃!
  if (managerAffiliations.length === 0) {
    return <AutoLogout />;
  }

  // 5. 매니저 권한 단체가 딱 1개라면? -> 해당 매니저 페이지로 즉시 납치!
  if (managerAffiliations.length === 1) {
    redirect(`/manager/${managerAffiliations[0].organizationId}/members`);
  }

  // ----------------------------------------------------------------
  // 6. 매니저 권한 단체가 2개 이상일 때 보여줄 로비 화면
  // ----------------------------------------------------------------

  return (
    <div className="bg-slate-50 min-h-screen p-4 pb-20 space-y-6">
      <div className="flex justify-between items-end pt-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">관리 소속 선택</h1>
          <p className="text-sm text-slate-500 mt-1">
            관리할 단체를 선택해주세요.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {managerAffiliations.map((aff) => (
          // 🚀 무조건 매니저 권한만 남았으므로 목적지는 무조건 /manager/[orgId]
          <Link key={aff.id} href={`/manager/${aff.organizationId}`}>
            <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600 group-hover:w-2.5 transition-all" />

              <div className="flex justify-between items-center pl-3">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge
                      variant="secondary"
                      className="bg-slate-100 text-slate-600 font-medium"
                    >
                      {aff.generation.name}
                    </Badge>
                    <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 gap-1 px-2">
                      <ShieldCheck className="w-3 h-3" />
                      운영진
                    </Badge>
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {aff.organization.name}
                  </h2>
                </div>
                <ChevronRight className="text-slate-300 w-6 h-6 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
