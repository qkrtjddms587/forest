import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreateBannerDialog } from "./create-banner-dialog";
// 🌟 새로 만들 수정용 다이얼로그 임포트
import { EditBannerDialog } from "./edit-banner-dialog";

interface Props {
  params: Promise<{ orgId: string }>;
}

export default async function OrgBannersPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { orgId: orgIdString } = await params;
  if (!orgIdString || isNaN(Number(orgIdString))) return notFound();

  const orgId = Number(orgIdString);

  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true },
  });

  if (!organization) return notFound();

  const banners = await prisma.banner.findMany({
    where: { organizationId: orgId },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold mb-2">배너 관리</h2>
          <p className="text-sm text-slate-500">
            {organization.name} 홈 화면에 노출될 배너 이미지를 등록하고
            관리하세요.
          </p>
        </div>
        <div>
          <CreateBannerDialog orgId={orgId} />
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[calc(100vh-250px)] relative [&>div]:max-h-[calc(100vh-250px)] [&>div]:overflow-auto">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">미리보기 및 제목</TableHead>
                  <TableHead className="w-[200px]">노출 기간</TableHead>
                  <TableHead className="w-[100px]">상태</TableHead>
                  {/* 🌟 관리(수정) 버튼을 위한 열 추가 */}
                  <TableHead className="w-[80px] text-center">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-20 text-center text-slate-400"
                    >
                      등록된 배너가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  banners.map((banner) => (
                    <TableRow key={banner.id}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-4">
                          <div className="w-24 h-12 rounded bg-slate-100 overflow-hidden shrink-0 border border-slate-200 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={banner.imageUrl}
                              alt="banner"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">
                              {banner.title || "제목 없음"}
                            </span>
                            {banner.linkUrl && (
                              <span className="text-xs text-blue-500 mt-0.5 truncate max-w-[200px]">
                                {banner.linkUrl}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-slate-500 font-medium">
                        {banner.startDate || banner.endDate ? (
                          <div className="flex flex-col gap-1">
                            <span>
                              시작:{" "}
                              {banner.startDate
                                ? banner.startDate.toLocaleDateString()
                                : "지정 안됨"}
                            </span>
                            <span>
                              종료:{" "}
                              {banner.endDate
                                ? banner.endDate.toLocaleDateString()
                                : "지정 안됨"}
                            </span>
                          </div>
                        ) : (
                          "상시 노출"
                        )}
                      </TableCell>

                      <TableCell>
                        {banner.isActive ? (
                          <Badge className="bg-green-100 text-green-700 border-none">
                            활성
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-slate-100 text-slate-500 border-none"
                          >
                            숨김
                          </Badge>
                        )}
                      </TableCell>

                      {/* 🌟 수정 버튼 렌더링 (배너 데이터를 프롭스로 전달) */}
                      <TableCell className="text-center">
                        <EditBannerDialog banner={banner} orgId={orgId} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
