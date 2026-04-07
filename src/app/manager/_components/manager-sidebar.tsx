"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  FileText,
  Image as ImageIcon, // Next.js Image 컴포넌트와 겹치지 않게 별칭 사용
  Megaphone,
  Settings2,
  Crown,
  LogOut,
  BellRing,
} from "lucide-react";
import { logoutAction } from "@/actions/auth-action";

interface ManagerSidebarProps {
  orgId: number;
  orgName: string;
}

export function ManagerSidebar({ orgId, orgName }: ManagerSidebarProps) {
  const pathname = usePathname(); // 🌟 현재 접속 중인 URL 경로 가져오기

  // 메뉴 리스트 배열화 (유지보수 용이)
  const NAV_ITEMS = [
    { href: `/manager/${orgId}/members`, icon: Users, label: "회원 관리" },
    { href: `/manager/${orgId}/posts`, icon: FileText, label: "게시글 관리" },
    { href: `/manager/${orgId}/banners`, icon: ImageIcon, label: "배너 관리" },
    { href: `/manager/${orgId}/push`, icon: BellRing, label: "푸시 발송" },
    {
      href: `/manager/${orgId}/greeting`,
      icon: Megaphone,
      label: "인사말 관리",
    },
    {
      href: `/manager/${orgId}/org-chart`,
      icon: Settings2,
      label: "직책 생성",
    },
    { href: `/manager/${orgId}/appointments`, icon: Crown, label: "직책 임명" },
  ];

  return (
    // 🌟 sticky top-0 h-screen : 스크롤해도 화면 상단에 고정되고 꽉 차게 설정
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen shrink-0">
      {/* 단체 이름 및 타이틀 */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
        <span className="font-bold text-lg text-slate-800 truncate">
          {orgName} <span className="text-brand-main text-sm">매니저</span>
        </span>
      </div>

      {/* 메뉴 리스트 */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-hide">
        {NAV_ITEMS.map((item) => {
          // 🌟 현재 URL이 해당 메뉴의 링크로 시작하는지 검사
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                isActive
                  ? "bg-brand-main/10 text-brand-main" // 선택된 탭 (하이라이트)
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900" // 선택 안 된 탭
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* 하단 영역 */}
      <div className="p-4 border-t border-slate-100 shrink-0">
        <form action={logoutAction} className="w-full">
          <button
            type="submit"
            className="flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:bg-brand-main/10 transition-colors font-medium text-sm"
          >
            <LogOut className="w-5 h-5" />
            로그아웃
          </button>
        </form>
      </div>
    </aside>
  );
}
