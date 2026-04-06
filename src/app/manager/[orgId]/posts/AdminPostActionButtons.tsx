"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EyeOff, Eye, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  deletePostAction,
  togglePostVisibilityAction,
} from "@/actions/admin-post-actions";

interface Props {
  postId: number;
  isHidden: boolean;
  orgId: number; // 🌟 추가됨
}

export function AdminPostActionButtons({ postId, isHidden, orgId }: Props) {
  const [isPending, setIsPending] = useState(false);

  const handleToggleHide = async () => {
    setIsPending(true);
    // 🌟 orgId 파라미터 추가
    const result = await togglePostVisibilityAction(postId, isHidden, orgId);

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.error);
    }
    setIsPending(false);
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "정말로 이 게시글을 영구 삭제하시겠습니까?\nDB에서도 완전히 삭제되며 복구할 수 없습니다.",
      )
    ) {
      return;
    }

    setIsPending(true);
    // 🌟 orgId 파라미터 추가
    const result = await deletePostAction(postId, orgId);

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.error);
    }
    setIsPending(false);
  };

  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggleHide}
        disabled={isPending}
        className={
          isHidden
            ? "text-blue-600 border-blue-200 bg-blue-50"
            : "text-slate-600"
        }
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isHidden ? (
          <>
            <Eye className="w-4 h-4 mr-1" /> 숨김 해제
          </>
        ) : (
          <>
            <EyeOff className="w-4 h-4 mr-1" /> 숨김
          </>
        )}
      </Button>

      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
