"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"; // 🌟 delete 액션 추가
import { useRouter } from "next/navigation";
import {
  createCommentAction,
  deleteCommentAction,
} from "@/actions/comment-actions";
import { isContentOwner, isOrgAdmin } from "@/lib/auth/auth-utils";
import { CommentItem } from "./comment-item";

export function CommentSection({
  postId,
  comments,
  currentUser,
  isAdmin,
  orgId,
}: any) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // 🌟 댓글 등록 핸들러
  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);

    await createCommentAction(postId, content);

    setContent("");
    setIsSubmitting(false);
    router.refresh();
  };
  // 🌟 댓글 삭제 핸들러
  const handleDelete = async (commentId: number) => {
    if (!window.confirm("이 댓글을 삭제하시겠습니까?")) return;

    try {
      await deleteCommentAction(commentId, postId, orgId); // postId는 새로고침(revalidate)을 위해 넘김
      router.refresh();
    } catch (error) {
      alert("댓글 삭제에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg flex items-center gap-2">
        댓글 <span className="text-brand-main">{comments.length}</span>
      </h3>

      {/* 댓글 리스트 */}
      <div className="space-y-1">
        {comments.map((comment: any) => {
          const isOwner = isContentOwner(currentUser, comment.memberId);
          const isAdmin = isOrgAdmin(currentUser, orgId);

          return (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              orgId={orgId}
              canEdit={isOwner}
              canDelete={isOwner || isAdmin}
            />
          );
        })}
      </div>

      {/* 댓글 입력폼 (기존과 동일) */}
      <div className="flex gap-3 mt-4">
        <Avatar className="w-8 h-8 hidden md:block">
          <AvatarFallback>{currentUser?.name?.[0] || "?"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder={
              currentUser ? "댓글을 남겨보세요." : "로그인이 필요합니다."
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px] resize-none bg-white"
            disabled={!currentUser || isSubmitting}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              className="bg-brand-main hover:bg-brand-main/80"
            >
              {isSubmitting ? "등록 중..." : "등록하기"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
