"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getPushHistoryAction } from "@/actions/push-actions";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function PushHistoryList({ orgId }: { orgId: number }) {
  const [history, setHistory] = useState<any[]>([]);
  const [page, setPage] = useState(0); // 🌟 첫 로드 시 0페이지부터 시작
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // 🌟 1. 초기 데이터 로드 (컴포넌트 마운트 시 딱 한 번 실행)
  useEffect(() => {
    let isMounted = true; // 언마운트 시 상태 업데이트 방지

    const fetchInitialData = async () => {
      setIsLoading(true);
      const result = await getPushHistoryAction(orgId, 0);

      if (isMounted && result.success && result.data) {
        setHistory(result.data); // 덮어쓰기
        setPage(1);
        if (result.data.length < 10) setHasMore(false);
      }
      if (isMounted) setIsLoading(false);
    };

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, [orgId]);

  // 🌟 2. 옵저버 로직 (중복 필터링 및 즉시 차단 적용)
  const observer = useRef<IntersectionObserver | null>(null);
  const lastHistoryElementRef = useCallback(
    (node: HTMLTableRowElement) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(async (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          // 🚀 핵심 1: 감지되자마자 즉시 옵저버를 끊어서 0.1초 뒤 연속 실행되는 것을 막습니다.
          if (observer.current) observer.current.disconnect();

          setIsLoading(true);
          const nextPage = page;

          const result = await getPushHistoryAction(orgId, nextPage);

          if (result.success && result.data) {
            setHistory((prev) => {
              // 🚀 핵심 2: 궁극의 방어 코드. 기존 배열에 없는(id가 겹치지 않는) 새 데이터만 걸러서 추가합니다.
              const newItems = result.data.filter(
                (newItem) => !prev.some((oldItem) => oldItem.id === newItem.id),
              );
              return [...prev, ...newItems];
            });

            setPage(nextPage + 1);
            if (result.data.length < 10) setHasMore(false);
          } else {
            setHasMore(false);
          }
          setIsLoading(false);
        }
      });

      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore, page, orgId],
  );

  return (
    // 🌟 3. 회원 테이블의 테이블 래퍼(max-h 및 overflow) 스타일 완벽 적용
    <div className="rounded-md border border-slate-200 [&>div]:max-h-[calc(100vh-400px)] [&>div]:overflow-auto relative bg-white">
      <Table>
        <TableHeader className="sticky top-0 z-20 bg-slate-50 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[180px] pl-6 py-4 text-slate-800 font-bold">
              발송 일시
            </TableHead>
            <TableHead className="py-4 text-slate-800 font-bold">
              알림 내용
            </TableHead>
            <TableHead className="w-[120px] py-4 text-slate-800 font-bold text-center">
              발송자
            </TableHead>
            <TableHead className="w-[160px] py-4 text-slate-800 font-bold text-center">
              발송 결과
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {history.map((item, index) => {
            // 🌟 4. 배열의 마지막 요소인지 확인
            const isLastElement = history.length === index + 1;
            console.log(item);
            return (
              <TableRow
                key={item.id}
                // 🌟 5. 마지막 요소에만 ref 달아주기
                ref={isLastElement ? lastHistoryElementRef : null}
                className="hover:bg-slate-50/50 transition-colors"
              >
                <TableCell className="pl-6 py-4 text-sm text-slate-600">
                  {format(new Date(item.createdAt), "yyyy. MM. dd.")}
                  <br />
                  <span className="text-xs text-slate-400">
                    {format(new Date(item.createdAt), "HH:mm:ss")}
                  </span>
                </TableCell>

                <TableCell className="py-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-slate-900">
                      {item.title}
                    </span>
                    <span className="text-sm text-slate-500 line-clamp-2">
                      {item.body}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="py-4 text-center text-sm text-slate-600">
                  {item.sender?.name || "관리자"}
                </TableCell>

                <TableCell className="py-4 text-center">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">
                      성공 {item.successCount}
                    </span>
                    {item.failCount > 0 && (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100">
                        실패 {item.failCount}
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* 🌟 6. 로딩 및 데이터 없음 UI 처리 */}
      {isLoading && (
        <div className="flex justify-center items-center py-4 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm font-medium">데이터를 불러오는 중...</span>
        </div>
      )}

      {history.length === 0 && !isLoading && (
        <div className="py-20 text-center text-slate-400 text-sm">
          발송된 푸시 알림 내역이 없습니다.
        </div>
      )}
    </div>
  );
}
