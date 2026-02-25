import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  Users,
  Network,
  FileText,
  Bell,
  ChevronRight,
  Megaphone,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  params: { id: string };
}

export default async function OrgHomePage({ params }: Props) {
  const session = await auth();
  const { id } = await params;
  const orgId = Number(id);

  // 1. 현재 접속한 단체의 내 소속 정보 조회
  const myAffiliation = await prisma.affiliation.findFirst({
    where: {
      organizationId: orgId,
      memberId: Number(session?.user?.id),
      status: "ACTIVE",
    },
    include: { organization: true, generation: true, Position: true },
    orderBy: { createdAt: "desc" },
  });

  // 소속이 아니면 로비로 쫓아냄
  if (!myAffiliation) redirect("/");

  console.log(myAffiliation);
  // 2. 최신 공지사항 5개 가져오기 (Post 모델이 있다고 가정)
  // 아직 Post 모델이 없다면 빈 배열로 처리됨
  const recentPosts = await prisma.post
    .findMany({
      where: {
        organizationId: orgId, // 해당 단체의 게시판 글만   // type: "NOTICE" // 공지사항만 가져오려면 필터 추가
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true } } },
    })
    .catch(() => []); // Post 모델 없을 때 에러 방지용

  // 퀵 메뉴 설정 (아이콘 및 이동 경로)
  const quickMenus = [
    { label: "회장인사말", icon: Users, href: `/org/${orgId}/greeting` },
    { label: "조직도", icon: Network, href: `/org/${orgId}/org-chart` },
    { label: "회칙", icon: FileText, href: `/org/${orgId}/rules` },
    { label: "회비수납", icon: Megaphone, href: `/org/${orgId}/dues` },
    { label: "공지사항", icon: Bell, href: `/org/${orgId}/community` },
    { label: "관리자모드", icon: Bell, href: `/admin` },
  ];

  return (
    <div className="min-h-screen">
      {/* 1. 히어로 섹션 (배경 이미지 + 타이틀) */}
      <div className="relative h-[280px] w-full bg-slate-900 text-white overflow-hidden">
        {/* 배경 이미지 (public/campus-bg.jpg 파일 필요, 없으면 색상만 나옴) */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60 transition-transform hover:scale-105 duration-700"
          style={{ backgroundImage: "url('/main_bg.webp')" }}
        />
        {/* 그라데이션 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black-20" />

        {/* 메인 텍스트 */}
        <div className="absolute bottom-20 z-10 px-6 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm">
              {myAffiliation.generation.name}
            </Badge>
            {myAffiliation.Position?.name && (
              <Badge
                variant="outline"
                className="text-yellow-300 border-yellow-300/50"
              >
                {myAffiliation.Position.name}
              </Badge>
            )}
          </div>
          <h2 className="text-3xl font-bold leading-tight drop-shadow-md">
            {myAffiliation.organization.name}
          </h2>
          <p className="text-white/80 mt-2 text-sm font-light">
            {session?.user?.name}님, 오늘도 좋은 하루 되세요!
          </p>
        </div>
      </div>

      {/* 2. 퀵 메뉴 그리드 (파란색 박스) */}
      <div className="relative -mt-12 mx-4 z-20">
        <div className="bg-green-600 rounded-2xl shadow-xl shadow-brand-main/20 p-5">
          <div className="grid grid-cols-3 gap-y-6">
            {quickMenus.map((menu, idx) => (
              <Link
                key={idx}
                href={menu.href}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="p-2.5 rounded-full bg-black/20 group-hover:bg-white/20 transition-all group-active:scale-95">
                  <menu.icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>
                <span className="text-xs font-medium text-white/90 group-hover:text-white">
                  {menu.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 3. 최신 공지사항 리스트 */}
      <div className="mt-6 px-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-3">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-brand-main" />
              <h3 className="text-lg font-bold text-slate-800">최신 소식</h3>
            </div>
            <Link
              href={`/org/${orgId}/community`}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center"
            >
              더보기 <ChevronRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {recentPosts.length > 0 ? (
              recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/org/${orgId}/community/${post.id}`}
                  className="block group"
                >
                  <div className="flex justify-between items-start gap-4">
                    <p className="text-[15px] font-medium text-slate-700 line-clamp-1 group-hover:text-brand-main transition-colors">
                      {post.title}
                    </p>
                    {/* 새 글이면 N 뱃지 표시 (옵션) */}
                    {new Date(post.createdAt).getTime() >
                      Date.now() - 86400000 && (
                      <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-500 mt-2" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400 font-light">
                    <span className="text-slate-500">{post.author.name}</span>
                    <span className="w-[1px] h-2 bg-slate-200" />
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">
                등록된 공지사항이 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. 하단 홍보 배너 (선택사항) */}
      <div className="mt-6 px-4">
        <a href="https://forest119.com/shop/">
          <div
            className="w-full h-40 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-sm bg-cover bg-center"
            style={{ backgroundImage: "url('/banner/main_banner.png')" }}
          ></div>
        </a>
      </div>
    </div>
  );
}
