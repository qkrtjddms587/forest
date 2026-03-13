"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { deletePostAction } from "@/actions/post-actions";

interface PostOptionsMenuProps {
  postId: number;
  orgId: number;
  canEdit: boolean;
  canDelete: boolean;
}

export function PostOptionsMenu({
  postId,
  orgId,
  canEdit,
  canDelete,
}: PostOptionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 🌟 바깥 영역 클릭 시 메뉴 닫기 로직
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 권한이 아예 없으면 아이콘 자체를 안 그림
  if (!canEdit && !canDelete) return null;

  const handleDelete = async () => {
    if (!confirm("정말로 이 게시글을 삭제하시겠습니까?")) return;

    setIsDeleting(true);
    try {
      await deletePostAction(postId, orgId);
    } catch (error: any) {
      // Next.js 이동 에러 통과 처리
      if (
        error?.message === "NEXT_REDIRECT" ||
        error?.digest?.includes("NEXT_REDIRECT")
      ) {
        throw error;
      }
      alert("삭제 중 오류가 발생했습니다.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* 🌟 점 세 개 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
        aria-label="게시글 옵션"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {/* 🌟 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-28 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
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
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 text-left"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? "삭제 중" : "삭제"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
