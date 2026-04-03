"use client";

import { useState, useTransition } from "react";
import { Search, UserMinus } from "lucide-react";
import { updateMemberPosition } from "@/actions/admin-position-actions";
import { useDebouncedCallback } from "use-debounce";

type Props = {
  positions: any[]; // 해당 기수의 직책 목록
  members: any[]; // 해당 기수의 전체 회원 목록
};

export function RoleAssignmentBoard({ positions, members }: Props) {
  const [isPending, startTransition] = useTransition();

  // 1. input 창에 즉시 보여줄 상태 (타이핑 렉 방지)
  const [searchTerms, setSearchTerms] = useState<Record<number, string>>({});

  // 2. 0.3초 뒤에 실제로 필터링에 쓰일 상태
  const [debouncedTerms, setDebouncedTerms] = useState<Record<number, string>>(
    {},
  );

  // 🌟 3. 선생님이 쓰신 useDebouncedCallback 그대로 적용!
  const handleDebouncedSearch = useDebouncedCallback(
    (posId: number, term: string) => {
      setDebouncedTerms((prev) => ({ ...prev, [posId]: term }));
    },
    300,
  );

  // 4. input 창의 onChange 이벤트
  const handleSearchChange = (posId: number, term: string) => {
    setSearchTerms((prev) => ({ ...prev, [posId]: term })); // 화면엔 즉시 반영
    handleDebouncedSearch(posId, term); // 필터링은 0.3초 지연
  };

  // 임명 (직책 부여)
  const handleAssign = (affiliationId: number, positionId: number) => {
    startTransition(async () => {
      const result = await updateMemberPosition(affiliationId, positionId);
      if (!result?.success) alert(result?.error);

      // 검색창 초기화
      setSearchTerms((prev) => ({ ...prev, [positionId]: "" }));
    });
  };

  // 해임 (직책 뺏기 -> null)
  const handleRemove = (affiliationId: number) => {
    startTransition(async () => {
      const result = await updateMemberPosition(affiliationId, null);
      if (!result?.success) alert(result?.error);
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {positions.map((pos) => {
        // 1. 이 직책에 이미 임명된 사람(들) 찾기
        const assignedMembers = members.filter((m) => m.positionId === pos.id);

        // 2. 이 직책의 검색창에 입력된 검색어
        const term = searchTerms[pos.id] || "";

        // 3. 검색어로 회원 찾기 (이름이나 번호) - 임명 안 된 사람 중에서만
        const searchResults =
          term.length > 0
            ? members
                .filter(
                  (m) =>
                    m.positionId !== pos.id && // 이미 이 자리에 있는 사람 제외
                    (m.member.name.includes(term) ||
                      m.member.phone?.includes(term)),
                )
                .slice(0, 5) // 너무 많이 뜨지 않게 5명만 자름
            : [];

        return (
          <div
            key={pos.id}
            className="bg-white border rounded-xl shadow-sm flex flex-col relative"
          >
            {/* 직책 헤더 */}
            <div className="bg-slate-900 px-4 py-3 border-b flex justify-between items-center rounded-t-xl">
              <h3 className="font-bold text-white tracking-wider">
                {pos.name}
              </h3>
              <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
                {assignedMembers.length}명
              </span>
            </div>

            <div className="p-4 flex-1 flex flex-col gap-4 bg-slate-50">
              {/* 현재 임명된 사람 목록 */}
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {assignedMembers.length > 0 ? (
                  assignedMembers.map((aff) => (
                    <div
                      key={aff.id}
                      className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm font-medium border border-blue-200"
                    >
                      {aff.member.name}
                      <button
                        onClick={() => handleRemove(aff.id)}
                        disabled={isPending}
                        className="ml-1 text-blue-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        title="해임하기"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-slate-400 italic flex items-center h-full">
                    공석입니다.
                  </span>
                )}
              </div>

              {/* 사람 검색 및 추가 입력창 */}
              <div className="relative mt-auto pt-2 border-t border-slate-200">
                <div className="absolute inset-y-0 top-2 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="이름 검색 후 임명..."
                  value={term}
                  onChange={(e) =>
                    setSearchTerms({ ...searchTerms, [pos.id]: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:border-brand-main focus:ring-brand-main focus:ring-1 "
                />

                {/* 검색 결과 드롭다운 */}
                {term.length > 0 && (
                  <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-auto">
                    {searchResults.length > 0 ? (
                      searchResults.map((aff) => (
                        <li
                          key={aff.id}
                          onClick={() => handleAssign(aff.id, pos.id)}
                          className="px-3 py-2 hover:bg-green-50 cursor-pointer text-sm flex justify-between items-center group"
                        >
                          <div>
                            <span className="font-medium text-slate-900">
                              {aff.member.name}
                            </span>
                            <span className="text-xs text-slate-500 ml-2">
                              {aff.member.phone?.slice(-4) || "번호없음"}
                            </span>
                          </div>
                          <span className="text-xs text-green-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            임명하기
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="px-3 py-4 text-center text-sm text-slate-500">
                        검색 결과가 없습니다.
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
