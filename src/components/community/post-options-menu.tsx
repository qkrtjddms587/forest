"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MoreVertical,
  Pencil,
  Trash2,
  Flag,
  UserX,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

// 🌟 서버 액션 임포트 (경로를 팀장님 프로젝트에 맞게 확인해주세요)
import { deletePostAction } from "@/actions/post-actions";
import { blockUserAction, reportPostAction } from "@/actions/user-action";

interface PostOptionsMenuProps {
  postId: number;
  orgId: number;
  authorId: number; // 🌟 추가됨: 차단할 대상의 ID
  canEdit: boolean;
  canDelete: boolean;
  isMine: boolean; // 🌟 추가됨: 내 글인지 여부 파악
}

export function PostOptionsMenu({
  postId,
  orgId,
  authorId,
  canEdit,
  canDelete,
  isMine,
}: PostOptionsMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 🌟 버튼별 독립적인 로딩 상태 (따닥! 중복 클릭 방지)
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  // 바깥 영역 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1. 삭제 핸들러 (toast 적용)
  const handleDelete = async () => {
    if (!confirm("정말로 이 게시글을 삭제하시겠습니까?")) return;

    setIsDeleting(true);
    try {
      await deletePostAction(postId, orgId);
      router.replace(`/m/org/${orgId}/community`);
    } catch (error: any) {
      if (
        error?.message === "NEXT_REDIRECT" ||
        error?.digest?.includes("NEXT_REDIRECT")
      ) {
        throw error;
      }
      toast.error("게시글 삭제 중 오류가 발생했습니다.");
      setIsDeleting(false);
    }
  };

  // 2. 🌟 신고 핸들러
  const handleReport = async () => {
    if (!confirm("이 게시글을 부적절한 콘텐츠로 신고하시겠습니까?")) return;

    setIsReporting(true);
    const result = await reportPostAction(postId);

    if (result.success) {
      toast.success(result.message);
      setIsOpen(false);
    } else {
      toast.error(result.error);
    }
    setIsReporting(false);
  };

  // 3. 🌟 차단 핸들러
  const handleBlock = async () => {
    if (
      !confirm(
        "이 작성자를 차단하시겠습니까?\n차단 후에는 이 사용자의 게시글이 보이지 않습니다.",
      )
    )
      return;

    setIsBlocking(true);
    const result = await blockUserAction(authorId);

    if (result.success) {
      toast.success(result.message);
      setIsOpen(false);

      // 차단 성공 시, 즉시 커뮤니티 목록으로 튕겨내고 새로고침하여 글을 블라인드 처리
      router.replace(`/m/org/${orgId}/community`);
    } else {
      toast.error(result.error);
    }
    setIsBlocking(false);
  };

  // 🌟 권한도 없고 남의 글도 아니라면 아예 버튼을 숨김 (안전장치)
  if (!canEdit && !canDelete && isMine) return null;

  return (
    <div className="relative" ref={menuRef}>
      {/* 점 세 개 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
        aria-label="게시글 옵션"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* 🌟 내 글일 때: 수정 / 삭제 노출 */}
          {canEdit && (
            <Link
              href={`/m/org/${orgId}/community/${postId}/edit`}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Pencil className="w-4 h-4" />
              수정
            </Link>
          )}

          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={`flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left ${!isMine ? "border-b border-slate-100" : ""}`}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {isDeleting ? "삭제 중..." : "삭제"}
            </button>
          )}

          {/* 🌟 남의 글일 때: 신고 / 차단 노출 */}
          {!isMine && (
            <>
              <button
                onClick={handleReport}
                disabled={isReporting}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-orange-600 hover:bg-orange-50 transition-colors disabled:opacity-50 text-left"
              >
                {isReporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Flag className="w-4 h-4" />
                )}
                {isReporting ? "처리 중..." : "신고하기"}
              </button>

              <button
                onClick={handleBlock}
                disabled={isBlocking}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 text-left border-t border-slate-100"
              >
                {isBlocking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserX className="w-4 h-4" />
                )}
                {isBlocking ? "처리 중..." : "차단하기"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
