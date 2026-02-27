"use client";

import { useState, useTransition, useRef, useCallback, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { MemberDetailSheet } from "@/components/admin/member-detail-sheet";
import { Trash2, Loader2 } from "lucide-react";
import {
  bulkDeleteMembersAction,
  getMoreMembersAction,
} from "@/actions/member-actions";

interface MemberTableProps {
  initialMembers: any[];
  searchParams: {
    q?: string;
    orgId?: string;
    genId?: string;
    status?: string;
  };
}

export function MemberTable({
  initialMembers,
  searchParams,
}: MemberTableProps) {
  const [members, setMembers] = useState(initialMembers);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isPending, startTransition] = useTransition();

  // 무한 스크롤 상태
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialMembers.length === 20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 검색 필터가 변경되면 상태 초기화
  useEffect(() => {
    setMembers(initialMembers);
    setPage(1);
    setHasMore(initialMembers.length === 20);
    setSelectedIds([]);
  }, [initialMembers, searchParams]);

  // 마지막 요소 옵저버 (스크롤 바닥 감지)
  const observer = useRef<IntersectionObserver | null>(null);
  const lastMemberElementRef = useCallback(
    (node: HTMLTableRowElement) => {
      if (isLoadingMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(async (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setIsLoadingMore(true);
          const nextPage = page + 1;

          const result = await getMoreMembersAction({
            ...searchParams,
            page: nextPage,
          });

          if (result.success && result.data) {
            setMembers((prev) => [...prev, ...result.data]);
            setPage(nextPage);
            if (result.data.length < 20) setHasMore(false);
          }
          setIsLoadingMore(false);
        }
      });

      if (node) observer.current.observe(node);
    },
    [isLoadingMore, hasMore, page, searchParams]
  );

  // 다중 선택 관리
  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(members.map((m) => m.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) setSelectedIds((prev) => [...prev, id]);
    else
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
  };

  // 일괄 삭제
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (
      !confirm(
        `정말 선택한 ${selectedIds.length}명의 회원을 완전히 삭제하시겠습니까? (복구 불가)`
      )
    )
      return;

    startTransition(async () => {
      const result = await bulkDeleteMembersAction(selectedIds);
      if (result.success) {
        setSelectedIds([]);
        // 삭제 성공 후 프론트엔드 목록에서도 즉시 제거 (부드러운 UX)
        setMembers((prev) => prev.filter((m) => !selectedIds.includes(m.id)));
        alert("성공적으로 삭제되었습니다.");
      } else {
        alert(result.error);
      }
    });
  };

  return (
    <div>
      {/* 다중 선택 시 나타나는 상단 액션 바 */}
      {selectedIds.length > 0 && (
        <div className="bg-red-50 p-3 flex items-center justify-between border-b border-red-100 transition-all">
          <span className="text-sm font-bold text-red-600 ml-2">
            {selectedIds.length}명 선택됨
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            선택 일괄 삭제
          </Button>
        </div>
      )}

      <div className="rounded-md border border-slate-200 [&>div]:max-h-[calc(100vh-320px)] [&>div]:overflow-auto relative">
        <Table>
          {/* 🌟 2. TableHeader에 sticky top-0 과 z-20, 그리고 배경색을 줍니다. 
                 shadow를 주면 스크롤될 때 헤더 아래에 예쁜 그림자/경계선이 생겨서 훨씬 고급스럽습니다. */}
          <TableHeader className="sticky top-0 z-20 bg-slate-50 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[50px] pl-6">
                <Checkbox
                  checked={
                    selectedIds.length === members.length && members.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-[200px]">이름 / 연락처</TableHead>
              <TableHead className="w-[180px]">소속</TableHead>
              <TableHead>기수 및 직책</TableHead>
              <TableHead className="w-[120px]">최근 활동일</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {members.map((member, index) => {
              const isLastElement = members.length === index + 1;

              return (
                <TableRow
                  key={member.id}
                  ref={isLastElement ? lastMemberElementRef : null}
                  className="hover:bg-slate-50/30 transition-colors group"
                >
                  <TableCell className="pl-6">
                    <Checkbox
                      checked={selectedIds.includes(member.id)}
                      onCheckedChange={(checked) =>
                        handleSelectOne(member.id, checked as boolean)
                      }
                      aria-label={`Select ${member.name}`}
                    />
                  </TableCell>

                  <TableCell className="font-medium">
                    <MemberDetailSheet member={member}>
                      <div className="flex flex-col cursor-pointer group-hover:text-blue-600 transition-colors">
                        <span className="text-slate-900 font-bold group-hover:underline underline-offset-4">
                          {member.name}
                        </span>
                        <span className="text-xs text-slate-400 font-normal">
                          {member.phone || "연락처 미등록"}
                        </span>
                      </div>
                    </MemberDetailSheet>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-1.5">
                      {member.affiliations.map((aff: any) => (
                        <span
                          key={`org-${aff.id}`}
                          className={`text-sm font-semibold ${
                            aff.status === "ACTIVE"
                              ? "text-slate-700"
                              : "text-slate-400"
                          }`}
                        >
                          {aff.organization.name}
                        </span>
                      ))}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-1.5">
                      {member.affiliations.map((aff: any) => (
                        <div
                          key={`gen-${aff.id}`}
                          className="flex items-center gap-1.5 min-h-[20px]"
                        >
                          <span
                            className={`text-sm ${
                              aff.status === "ACTIVE"
                                ? "text-slate-600"
                                : "text-slate-400"
                            }`}
                          >
                            {aff.generation.name}
                          </span>
                          {aff.Position && (
                            <Badge className="h-4 px-1.5 text-[10px] bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200">
                              {aff.Position.name}
                            </Badge>
                          )}
                          {aff.status === "PENDING" && (
                            <span className="animate-pulse text-orange-500 font-bold text-[11px] ml-1">
                              ● 승인대기
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-slate-500">
                    {member.affiliations[0]
                      ? new Date(
                          member.affiliations[0].createdAt
                        ).toLocaleDateString()
                      : "-"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* 무한 스크롤 로딩 표시기 */}
        {isLoadingMore && (
          <div className="flex justify-center items-center py-6 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm font-medium">데이터를 불러오는 중...</span>
          </div>
        )}

        {members.length === 0 && (
          <div className="py-20 text-center text-slate-400 text-sm">
            검색 결과에 해당하는 회원이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
