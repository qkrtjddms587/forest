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
import { Trash2, Loader2, CheckCircle } from "lucide-react"; // 🌟 CheckCircle 아이콘 추가
import {
  bulkDeleteMembersAction,
  getMoreMembersAction,
  bulkApproveMembersAction, // 🌟 새로 만든 서버 액션 임포트
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

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialMembers.length === 20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    setMembers(initialMembers);
    setPage(1);
    setHasMore(initialMembers.length === 20);
    setSelectedIds([]);
  }, [initialMembers, searchParams]);

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

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(members.map((m) => m.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) setSelectedIds((prev) => [...prev, id]);
    else
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
  };

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
        setMembers((prev) => prev.filter((m) => !selectedIds.includes(m.id)));
        alert("성공적으로 삭제되었습니다.");
      } else {
        alert(result.error);
      }
    });
  };

  // 🌟 일괄 승인 핸들러 추가
  const handleBulkApprove = () => {
    if (selectedIds.length === 0) return;
    if (
      !confirm(
        `선택한 ${selectedIds.length}명의 회원을 일괄 승인 처리하시겠습니까?`
      )
    )
      return;

    startTransition(async () => {
      const result = await bulkApproveMembersAction(selectedIds);
      if (result.success) {
        setSelectedIds([]);

        // 🌟 삭제처럼 목록에서 지우는 게 아니라, 로컬 상태의 status만 'ACTIVE'로 즉시 변경
        setMembers((prev) =>
          prev.map((m) => {
            if (selectedIds.includes(m.id)) {
              return {
                ...m,
                affiliations: m.affiliations.map((aff: any) => ({
                  ...aff,
                  status: aff.status === "PENDING" ? "ACTIVE" : aff.status,
                })),
              };
            }
            return m;
          })
        );
        alert("성공적으로 승인되었습니다.");
      } else {
        alert(result.error);
      }
    });
  };

  return (
    <div>
      {/* 🌟 다중 선택 액션 바: 파란색 톤으로 변경 및 승인 버튼 추가 */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 p-3 flex items-center justify-between border-b border-blue-100 transition-all">
          <span className="text-sm font-bold text-blue-700 ml-2">
            {selectedIds.length}명 선택됨
          </span>
          <div className="flex gap-2">
            {/* 일괄 승인 버튼 */}
            <Button
              variant="default"
              size="sm"
              onClick={handleBulkApprove}
              disabled={isPending}
              className="bg-brand-main hover:bg-brand-main/90"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              선택 일괄 승인
            </Button>

            {/* 일괄 삭제 버튼 */}
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
        </div>
      )}

      {/* 테이블 영역 (이하 코드는 기존과 완벽히 동일) */}
      <div className="rounded-md border border-slate-200 [&>div]:max-h-[calc(100vh-320px)] [&>div]:overflow-auto relative">
        <Table>
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
