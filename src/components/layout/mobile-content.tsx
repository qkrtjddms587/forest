"use client";

export default function MobileContent({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ 정규식 체크: "/org/숫자" 형식과 정확히 일치할 때만 true
  // (예: /org/1 -> true, /org/1/community -> false)

  return <main className={`min-h-screen`}>{children}</main>;
}
