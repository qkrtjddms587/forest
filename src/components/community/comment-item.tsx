"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreVertical, Pencil, Trash2, X, Check } from "lucide-react";
import {
  updateCommentAction,
  deleteCommentAction,
} from "@/actions/comment-actions";

interface CommentItemProps {
  comment: {
    id: number;
    content: string;
    createdAt: Date;
    memberId: number;
    member: { name: string; image: string | null };
  };
  postId: number;
  orgId: number;
  canEdit: boolean; // 부모(CommentSection)에서 계산해서 넘겨줌 (본인인가?)
  canDelete: boolean; // 부모에서 계산해서 넘겨줌 (본인 OR 관리자인가?)
}

export function CommentItem({
  comment,
  postId,
  orgId,
  canEdit,
  canDelete,
}: CommentItemProps) {
  // 상태 관리
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isPending, setIsPending] = useState(false);

  // 드롭다운 메뉴 상태
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🌟 삭제 처리
  const handleDelete = async () => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    setIsPending(true);
    const result = await deleteCommentAction(comment.id, postId, orgId);
    if (!result.success) alert(result.error);
    setIsPending(false);
  };

  // 🌟 수정 저장 처리
  const handleUpdate = async () => {
    if (!editContent.trim()) return alert("내용을 입력해주세요.");
    setIsPending(true);
    const result = await updateCommentAction(
      comment.id,
      postId,
      orgId,
      editContent
    );

    if (result.success) {
      setIsEditing(false); // 수정 모드 종료
    } else {
      alert(result.error);
    }
    setIsPending(false);
  };

  return (
    <div className="flex gap-3 py-2 border-b border-slate-100 last:border-0 group">
      <Avatar className="w-8 h-8">
        <AvatarImage
          src={
            `${process.env.NEXT_PUBLIC_S3_DOMAIN}/${process.env.NEXT_PUBLIC_S3_BUCKET}${comment.member.image}` ||
            ""
          }
        />
        <AvatarFallback className="bg-slate-100 text-xs font-bold">
          {comment.member.name[0]}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-800">
              {comment.member.name}
            </span>
            <span className="text-xs text-slate-400">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* 🌟 옵션 메뉴 (수정 중이 아닐 때만 노출) */}
          {!isEditing && (canEdit || canDelete) && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1 text-slate-400 hover:text-slate-800 rounded-full"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-24 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-10">
                  {canEdit && (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Pencil className="w-3.5 h-3.5" /> 수정
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={handleDelete}
                      disabled={isPending}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 text-left disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> 삭제
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 🌟 렌더링: 수정 모드 VS 일반 텍스트 모드 */}
        {isEditing ? (
          <div className="mt-2 flex flex-col gap-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-brand-main outline-none resize-none"
              rows={2}
            />
            <div className="flex justify-end gap-1.5">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                <X className="w-3 h-3" /> 취소
              </button>
              <button
                onClick={handleUpdate}
                disabled={isPending}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded bg-brand-main text-white hover:bg-brand-main/90"
              >
                <Check className="w-3 h-3" /> 저장
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-700 whitespace-pre-wrap">
            {comment.content}
          </p>
        )}
      </div>
    </div>
  );
}
