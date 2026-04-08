"use client";

import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getMorePostsAction } from "@/actions/admin-post-actions";
import { PostDetailDialog } from "../PostDetailDialog";
import { AdminPostActionButtons } from "../AdminPostActionButtons";
import { PostTypeFilter } from "../PostTypeFilter";
import { PostWriteDialog } from "../PostWriteDialog";
import { PostFilterBar } from "./post-filter-bar";

interface PostTableListProps {
  initialPosts: any[];
  orgId: number;
  type?: string;
}

export function PostTableList({
  initialPosts,
  orgId,
  type,
}: PostTableListProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialPosts.length === 20);
  const [isLoading, setIsLoading] = useState(false);

  const { ref, inView } = useInView();

  // 🌟 필터(type)가 바뀌면 상태 초기화
  useEffect(() => {
    setPosts(initialPosts);
    setPage(1);
    setHasMore(initialPosts.length === 20);
  }, [initialPosts, type]);

  const loadMore = async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    const result = await getMorePostsAction({ orgId, type, page });

    if (result.success && result.data) {
      setPosts((prev) => [...prev, ...result.data]);
      setPage((prev) => prev + 1);
      if (result.data.length < 20) setHasMore(false);
    } else {
      setHasMore(false);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (inView) loadMore();
  }, [inView]);

  return (
    <Card className="border-none shadow-sm overflow-hidden bg-white">
      <div className="flex justify-between items-center gap-3 px-5">
        <div className="text-xl font-bold mb-2">게시글 목록</div>
        <div className="flex items-center gap-3 px-3">
          <PostFilterBar />
          <PostWriteDialog orgId={orgId} />
        </div>
      </div>
      <CardContent className="p-0">
        <div className="overflow-auto max-h-[calc(100vh-250px)] relative [&>div]:max-h-[calc(100vh-300px)] [&>div]:overflow-auto">
          <Table>
            <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[80px] text-center">분류</TableHead>
                <TableHead className="w-[100px]">상태</TableHead>
                <TableHead className="w-1/2">제목</TableHead>
                <TableHead className="w-[150px]">작성자</TableHead>
                <TableHead className="w-[120px]">작성일</TableHead>
                <TableHead className="w-[120px] text-center">관리</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {posts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-20 text-center text-slate-400"
                  >
                    등록된 게시글이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post) => {
                  const isHidden = post.deletedAt !== null;

                  return (
                    <TableRow
                      key={post.id}
                      className={isHidden ? "bg-slate-50/50" : ""}
                    >
                      <TableCell className="text-center">
                        {post.type === "NOTICE" && (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">
                            공지
                          </Badge>
                        )}
                        {post.type === "GALLERY" && (
                          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none">
                            갤러리
                          </Badge>
                        )}
                        {post.type === "ADS" && (
                          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">
                            홍보
                          </Badge>
                        )}
                        {post.type === "FREE" && (
                          <Badge
                            variant="outline"
                            className="text-slate-500 font-normal"
                          >
                            자유
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {isHidden ? (
                          <Badge variant="secondary" className="text-slate-500">
                            숨김됨
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-700 border-none hover:bg-blue-100">
                            정상
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <PostDetailDialog post={post} isHidden={isHidden} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {post.author?.name || "알 수 없음"}
                          </span>
                          <span className="text-xs text-slate-400">
                            {post.author?.company}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm font-medium">
                        {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                      </TableCell>
                      <TableCell className="text-center">
                        <AdminPostActionButtons
                          postId={post.id}
                          isHidden={isHidden}
                          orgId={orgId}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}

              {/* 🌟 무한 스크롤 트리거 영역 (테이블 내부 구조 유지) */}
              {(hasMore || isLoading) && (
                <TableRow>
                  <TableCell colSpan={7} className="py-6">
                    <div
                      ref={ref}
                      className="flex justify-center items-center text-slate-500"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          <span className="text-sm font-medium">
                            데이터를 불러오는 중...
                          </span>
                        </>
                      ) : (
                        <div className="h-4" /> // 감지용 빈 공간
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
