"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react"; // 🌟 돋보기 아이콘 추가

export function PostFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 현재 URL 파라미터 가져오기
  const currentType = searchParams.get("type") || "ALL";
  const currentQuery = searchParams.get("q") || "";

  // 검색창 내부 상태관리를 위한 State
  const [searchTerm, setSearchTerm] = useState(currentQuery);

  // 🌟 1. 타입(분류) 변경 핸들러
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (value === "ALL") params.delete("type");
    else params.set("type", value);

    router.push(`${pathname}?${params.toString()}`);
  };

  // 🌟 2. 검색어 폼 제출 핸들러 (엔터키 입력 시 작동)
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    if (searchTerm.trim() === "") {
      params.delete("q"); // 검색어가 비었으면 파라미터 날리기
    } else {
      params.set("q", searchTerm.trim());
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      {/* 분류 셀렉트 */}
      <select
        value={currentType}
        onChange={handleTypeChange}
        className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent cursor-pointer"
      >
        <option value="ALL">전체</option>
        <option value="NOTICE">공지사항</option>
        <option value="GALLERY">갤러리</option>
        <option value="EVENT">행사</option>
        <option value="FREE">자유게시판</option>
        <option value="ADS">홍보</option>
      </select>

      {/* 검색 인풋 */}
      <form onSubmit={handleSearch} className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="제목 또는 내용 검색..."
          className="h-10 w-48 sm:w-64 rounded-md border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent transition-all"
        />
        {/* 엔터키 작동을 위한 숨김 버튼 */}
        <button type="submit" className="hidden">
          검색
        </button>
      </form>
    </div>
  );
}
