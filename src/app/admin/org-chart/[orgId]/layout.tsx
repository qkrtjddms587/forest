import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TabNavigation } from "./tab-nav"; // 하단에서 만들 클라이언트 컴포넌트

export default async function OrgDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;

  // 단체 이름 가져오기
  const org = await prisma.organization.findUnique({
    where: { id: Number(orgId) },
    select: { name: true },
  });

  if (!org) notFound();

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <div className="px-8 pt-8 pb-4 bg-white border-b">
        {/* 뒤로가기 (단체 목록으로) */}
        <Link
          href="/admin/orgs"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          다른 단체 선택하기
        </Link>

        {/* 타이틀 */}
        <h1 className="text-2xl font-bold text-slate-900">
          <span className="text-brand-main">[{org.name}]</span> 조직도 관리
        </h1>

        {/* 🌟 탭 네비게이션 (클라이언트 컴포넌트 분리) */}
        <TabNavigation orgId={orgId} />
      </div>

      {/* 하단 컨텐츠 영역 (page.tsx 들이 여기에 렌더링됨) */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 min-h-[500px]">
          {children}
        </div>
      </div>
    </div>
  );
}
