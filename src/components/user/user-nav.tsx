"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, Building2, MessageSquare, Users } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getOrgNameAction } from "@/actions/org-action";

export function UserNav() {
  const pathname = usePathname();
  const [orgName, setOrgName] = useState("");

  // 1. 현재 URL이 '/org/[숫자]'로 시작하는지 체크하여 소속 ID 추출
  const orgMatch = pathname?.match(/^\/org\/(\d+)/);
  const orgId = orgMatch ? orgMatch[1] : null;

  useEffect(() => {
    if (orgId) {
      getOrgNameAction(Number(orgId)).then((name) => setOrgName(name));
    } else {
      setOrgName("");
    }
  }, [orgId]);

  // 2. 활성화 상태 체크 함수
  const isActive = (href: string) => {
    // Case 1: 로비('/') 이거나 소속 홈('/org/1') 인 경우 -> 정확히 일치해야 함
    if (href === "/" || (orgId && href === `/org/${orgId}`)) {
      return pathname === href;
    }

    // Case 2: 그 외 메뉴 (게시판, 회원명부 등) -> 하위 경로 포함 (startsWith)
    // 예: '/org/1/community/write' 에 있어도 '게시판' 탭 활성화
    return pathname?.startsWith(href) || false;
  };
  // 3. 메뉴 구성
  let menus = [];

  if (orgId) {
    // [Case A] 소속 단체 내부
    menus = [
      { name: "홈", href: `/org/${orgId}`, icon: Home },
      { name: "게시판", href: `/org/${orgId}/community`, icon: MessageSquare },
      { name: "회원명부", href: `/org/${orgId}/search`, icon: Users },
      { name: "내 정보", href: "/profile", icon: User },
    ];
  } else {
    // [Case B] 로비(Lobby)
    menus = [
      { name: "내 소속", href: "/", icon: Building2 },
      { name: "내 정보", href: "/profile", icon: User },
    ];
  }

  return (
    <>
      {/* ============================================================
          1. 상단 헤더 (항상 노출, 네비게이션 링크 제거됨)
         ============================================================ */}
      <header className="bg-white fixed top-0 left-0 right-0 z-50 shadow-sm">
        <div className="flex h-16 border-b items-center justify-between px-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-xl cursor-pointer">
            <Link href="/">
              <div className="flex items-center gap-2 font-extrabold">
                <div className="relative h-12 w-12 flex">
                  <Image
                    src="/logo.webp"
                    alt="Paysm Logo"
                    fill
                    className="object-contain object-left"
                    priority
                    unoptimized
                  />
                </div>
                {/* 로고 옆에 소속 이름 표시 */}
                <div className="text-xl md:text-3xl text-slate-700">
                  {orgName}
                </div>
              </div>
            </Link>
          </div>

          {/* 우측 공간: 필요하다면 알림 아이콘 등을 배치할 수 있음 (현재는 비워둠) */}
          <div className="w-6" />
        </div>
      </header>

      {/* ============================================================
          2. 하단 탭바 (PC/모바일 무관하게 항상 노출)
         ============================================================ */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around max-w-4xl mx-auto h-16 ">
          {menus.map((menu) => {
            const active = isActive(menu.href);
            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`flex flex-col items-center gap-1 w-full h-full justify-center transition-all ${
                  active
                    ? "text-brand-main"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <menu.icon
                  strokeWidth={active ? 2.5 : 2}
                  className={`w-6 h-6 ${active ? "scale-110" : "scale-100"}`}
                />
                <span className="text-[10px] font-medium">{menu.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
