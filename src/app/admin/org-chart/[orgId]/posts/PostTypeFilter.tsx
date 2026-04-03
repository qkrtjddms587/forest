"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function PostTypeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 현재 URL의 type 파라미터 가져오기 (없으면 ALL)
  const currentType = searchParams.get("type") || "ALL";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (value === "ALL") {
      params.delete("type"); // 전체보기면 파라미터 삭제
    } else {
      params.set("type", value); // 선택한 타입으로 변경
    }

    // URL 이동 -> 서버 컴포넌트 재렌더링 트리거
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <select
      value={currentType}
      onChange={handleChange}
      className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent cursor-pointer"
    >
      <option value="ALL">전체</option>
      <option value="NOTICE">공지사항</option>
      <option value="GALLERY">갤러리</option>
      <option value="EVENT">행사</option>
      <option value="FREE">자유게시판</option>
    </select>
  );
}
