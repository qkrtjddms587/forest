import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AdminPostActionButtons } from "./AdminPostActionButtons";
import { PostTypeFilter } from "./PostTypeFilter";
import { PostWriteDialog } from "./PostWriteDialog";
import { PostDetailDialog } from "./PostDetailDialog";

interface Props {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ type?: string }>;
}

export default async function OrgPostManagePage({
  params,
  searchParams,
}: Props) {
  // 1. 관리자 세션 체크
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // 2. 파라미터 파싱 및 숫자 변환 (Next.js 15+ 방식)
  const { orgId: orgIdString } = await params;
  if (!orgIdString || isNaN(Number(orgIdString))) return notFound();

  const orgId = Number(orgIdString);

  const { type } = await searchParams;

  // 3. 단체 이름 가져오기 (타이틀용)
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true },
  });

  if (!org) return notFound();

  const whereCondition: any = { organizationId: orgId };
  if (type && type !== "ALL") {
    whereCondition.type = type;
  }

  // 4. 해당 단체의 게시글 목록 가져오기
  const posts = await prisma.post.findMany({
    where: whereCondition,
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: { name: true, company: true },
      },
    },
  });

  return (
    <div>
      {/* 🌟 헤더 영역 (배너 페이지와 동일한 레이아웃 적용) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold mb-2">게시글 관리</h2>
          <p className="text-sm text-slate-500">
            {org.name} 커뮤니티에 등록된 모든 게시글을 모니터링하고 관리할 수
            있습니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PostTypeFilter />
          {/* 우측 상단 글쓰기 버튼 */}
          <PostWriteDialog orgId={orgId} />
        </div>
      </div>

      {/* 🌟 테이블 영역 (Card 컴포넌트 및 스크롤 디자인 적용) */}
      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[calc(100vh-250px)] relative [&>div]:max-h-[calc(100vh-250px)] [&>div]:overflow-auto">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6 w-[80px] text-center">
                    ID
                  </TableHead>
                  <TableHead className="w-[80px] text-center">분류</TableHead>
                  <TableHead className="w-[100px]">상태</TableHead>
                  <TableHead className="w-1/2">제목</TableHead>
                  <TableHead className="w-[150px]">작성자</TableHead>
                  <TableHead className="w-[120px]">작성일</TableHead>
                  <TableHead className="w-[120px] text-center">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-20 text-center text-slate-400"
                    >
                      등록된 게시글이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  posts.map((post) => {
                    const isHidden = post.deletedAt !== null;

                    return (
                      <TableRow
                        key={post.id}
                        className={isHidden ? "bg-slate-50/50" : ""}
                      >
                        <TableCell className="text-center font-medium text-slate-500 pl-6">
                          {post.id}
                        </TableCell>
                        <TableCell className="text-center">
                          {post.type === "NOTICE" && (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">
                              공지
                            </Badge>
                          )}
                          {post.type === "GALLERY" && (
                            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none">
                              갤러리
                            </Badge>
                          )}
                          {post.type === "ADS" && (
                            <Badge className="bg-orange-100 text-orange-700 hover:bg-purple-100 border-none">
                              홍보
                            </Badge>
                          )}
                          {post.type === "FREE" && (
                            <Badge
                              variant="outline"
                              className="text-slate-500 font-normal"
                            >
                              자유
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {isHidden ? (
                            <Badge
                              variant="secondary"
                              className="text-slate-500"
                            >
                              숨김됨
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-700 border-none hover:bg-blue-100">
                              정상
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <PostDetailDialog post={post} isHidden={isHidden} />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {post.author?.name || "알 수 없음"}
                            </span>
                            <span className="text-xs text-slate-400">
                              {post.author?.company}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm font-medium">
                          {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                        </TableCell>
                        <TableCell className="text-center">
                          <AdminPostActionButtons
                            postId={post.id}
                            isHidden={isHidden}
                            orgId={orgId}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
