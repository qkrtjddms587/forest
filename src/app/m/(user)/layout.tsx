import MainContent from "@/components/layout/main-content";
import { UserNav } from "@/components/user/user-nav";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen max-w-4xl mx-auto bg-slate-50">
      {/* 네비게이션 (PC: 상단, 모바일: 하단) */}
      {/* <UserNav /> */}

      {/* 컨텐츠 영역 */}
      {/* PC에서는 헤더 높이만큼, 모바일에서는 탭바 높이만큼 여백을 줌 */}
      <MainContent>{children}</MainContent>
    </div>
  );
}
