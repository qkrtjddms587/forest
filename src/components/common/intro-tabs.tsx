import Link from "next/link";

interface IntroTabsProps {
  orgId: number;
  currentTab: "greeting" | "orgchart" | "rules"; // 현재 선택된 탭
}

export function IntroTabs({ orgId, currentTab }: IntroTabsProps) {
  // 🌟 라우팅 주소는 실제 프로젝트 경로에 맞게 수정하세요!
  const TABS = [
    {
      label: "회장 인사말",
      value: "greeting",
      href: `/m/org/${orgId}/greeting`,
    },
    { label: "조직도", value: "orgchart", href: `/m/org/${orgId}/org-chart` },
    { label: "회칙", value: "rules", href: `/m/org/${orgId}/rules` },
  ];

  return (
    // sticky top-0을 주어 스크롤을 내려도 상단에 고정되게 합니다.
    <div className="flex overflow-x-auto border-b border-gray-200 sticky top-0 bg-white z-50 scrollbar-hide">
      <div className="flex w-full max-w-4xl mx-auto">
        {TABS.map((tab) => {
          const isActive = currentTab === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.href}
              className={`whitespace-nowrap px-4 py-3 font-bold text-base transition-colors ${
                isActive
                  ? "text-red-600 border-b-2 border-red-600"
                  : "text-slate-700 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
