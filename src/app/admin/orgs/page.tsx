import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateGenForm, CreateOrgForm, DeleteButton } from "./form";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { GenerationItem } from "./generation-item";
// 👇 방금 만든 폼 컴포넌트들을 가져옵니다

export default async function AdminOrgsPage() {
  const session = await auth();

  // 1. 관리자 권한 체크
  const myAffiliation = await prisma.affiliation.findFirst({
    where: { memberId: Number(session?.user?.id) },
  });
  if (myAffiliation?.role !== "ADMIN") redirect("/");

  // 2. 데이터 조회
  const organizations = await prisma.organization.findMany({
    where: { deletedAt: null },
    include: {
      generations: {
        where: { deletedAt: null },
        include: {
          affiliations: {
            where: { status: "ACTIVE" },
            include: { member: true, greeting: true },
          },
        },
        orderBy: { name: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 bg-slate-100 min-h-screen space-y-8">
      {/* 상단: 새 소속 추가하기 */}
      <Card>
        <CardHeader>
          <CardTitle>새로운 단체 만들기</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 👇 클라이언트 컴포넌트로 교체 */}
          <CreateOrgForm />
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {organizations.map((org) => (
          <Card
            key={org.id}
            className="flex flex-col hover:ring-2 ring-brand-main transition-colors"
          >
            <CardHeader className="bg-slate-50 border-b pb-3 flex flex-row justify-between items-center">
              <CardTitle className="text-lg">{org.name}</CardTitle>
              <div className="flex gap-2">
                {/* 🌟 바로 조직도 관리로 넘어가는 단축키 버튼 */}
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/org-chart/${org.id}`}>
                    조직도 관리 <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
                <DeleteButton id={org.id} type="org" />
              </div>
            </CardHeader>

            <CardContent className="pt-4 flex-1 space-y-4">
              {/* 기수 리스트 */}
              <div className="flex flex-wrap gap-2 items-center">
                {org.generations.length > 0 ? (
                  org.generations.map((gen) => (
                    <GenerationItem key={gen.id} orgId={org.id} gen={gen} />
                  ))
                ) : (
                  <span className="text-sm text-gray-400">
                    등록된 기수가 없습니다.
                  </span>
                )}
              </div>

              {/* 하단: 기수 추가 폼 */}
              <div className="pt-4 border-t">
                {/* 👇 클라이언트 컴포넌트로 교체 */}
                <CreateGenForm orgId={org.id} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
