import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { JoinOrgDrawer } from "@/components/user/join-org-drawer";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Building2 } from "lucide-react";

export default async function LobbyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // 🌟 1. 상태(status) 상관없이 이 회원의 모든 소속을 일단 다 가져옵니다.
  const allMyAffiliations = await prisma.affiliation.findMany({
    where: {
      memberId: Number(session.user.id),
      organization: { deletedAt: null },
    },
    include: { organization: true, generation: true, Position: true },
  });

  // 🚀 2. 핵심 추가 로직: 소속 중 단 하나라도 'PENDING' 상태가 있다면 비밀번호 설정으로 강제 납치!
  const hasPending = allMyAffiliations.some((aff) => aff.status === "PENDING");
  if (hasPending) {
    redirect("/setup-password");
  }

  // 3. PENDING 검사를 무사히 통과했다면, 'ACTIVE(승인됨)' 상태인 소속만 추려냅니다.
  const activeAffiliations = allMyAffiliations.filter(
    (aff) => aff.status === "ACTIVE"
  );

  // 🚀 기존 핵심 로직: ACTIVE 상태인 소속이 딱 하나라면 로비를 거치지 않고 바로 입장!
  if (activeAffiliations.length === 1) {
    redirect(`/org/${activeAffiliations[0].organizationId}`);
  }

  // ----------------------------------------------------------------
  // 여기부터는 소속이 0개거나, ACTIVE 소속이 2개 이상일 때 보이는 '로비 화면'입니다.
  // ----------------------------------------------------------------

  const allOrgs = await prisma.organization.findMany({
    where: { deletedAt: null },
    include: {
      generations: { where: { deletedAt: null }, orderBy: { name: "desc" } },
    },
  });

  return (
    <div className="bg-slate-50 min-h-screen p-4 pb-20 space-y-6">
      {/* 헤더 섹션 */}
      <div className="flex justify-between items-end pt-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {activeAffiliations.length > 1 ? "소속 선택" : "환영합니다!"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {activeAffiliations.length > 1
              ? "입장하실 단체를 선택해주세요."
              : "새로운 소속을 추가해보세요."}
          </p>
        </div>
      </div>

      {/* 소속 카드 리스트 */}
      <div className="grid gap-4">
        {activeAffiliations.length > 0 ? (
          activeAffiliations.map((aff) => (
            <Link key={aff.id} href={`/org/${aff.organizationId}`}>
              <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-brand-main hover:shadow-md transition-all cursor-pointer overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-main group-hover:w-2.5 transition-all" />

                <div className="flex justify-between items-center pl-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge
                        variant="secondary"
                        className="bg-slate-100 text-slate-600 font-medium"
                      >
                        {aff.generation.name}
                      </Badge>
                      {aff.Position?.name && (
                        <Badge
                          variant="outline"
                          className="text-brand-main border-brand-main/20 bg-brand-main/5"
                        >
                          {aff.Position.name}
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 group-hover:text-brand-main transition-colors">
                      {aff.organization.name}
                    </h2>
                  </div>
                  <ChevronRight className="text-slate-300 w-6 h-6 group-hover:text-brand-main group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">
              가입된 소속이 없습니다
            </h3>
            <p className="text-slate-500 text-sm mt-1 mb-6">
              아래 버튼을 눌러 단체에 가입해주세요.
            </p>
            <div className="scale-110">
              <JoinOrgDrawer organizations={allOrgs} />
            </div>
          </div>
        )}

        {/* 소속이 이미 있어도 더 추가할 수 있는 버튼 */}
        {activeAffiliations.length > 0 && (
          <div className="mt-2">
            <JoinOrgDrawer organizations={allOrgs} />
          </div>
        )}
      </div>
    </div>
  );
}
