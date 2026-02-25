"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings2, UserPlus, Megaphone } from "lucide-react";

export function TabNavigation({ orgId }: { orgId: string }) {
  const pathname = usePathname();

  const tabs = [
    { name: "직책 세팅", href: `/admin/org-chart/${orgId}`, icon: Settings2 },
    {
      name: "회원 임명",
      href: `/admin/org-chart/${orgId}/appointments`,
      icon: UserPlus,
    },
    {
      name: "인사말 관리",
      href: `/admin/org-chart/${orgId}/greeting`,
      icon: Megaphone,
    },
  ];

  return (
    <div className="flex gap-6 mt-6 border-b border-slate-200">
      {tabs.map((tab) => {
        // 정확히 일치하거나 하위 경로일 때 활성화
        const isActive =
          tab.href === `/admin/org-chart/${orgId}`
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              isActive
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
}
