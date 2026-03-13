"use client";

import { useState } from "react";
import { deletePostAction } from "@/actions/post-actions";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface DeletePostButtonProps {
  postId: number;
  orgId: number;
}

export function DeletePostButton({ postId, orgId }: DeletePostButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("정말로 이 게시글을 삭제하시겠습니까?")) return;

    setIsDeleting(true);
    try {
      const result = await deletePostAction(postId, orgId);

      // 🌟 서버가 성공했다고 하면 클라이언트가 직접 이동!
      if (result.success) {
        // alert("삭제되었습니다."); // 원한다면 여기서 알림 띄우기 가능
        router.push(`/m/org/${orgId}/community`);
        router.refresh(); // 변경된 캐시를 화면에 즉시 반영
      }
    } catch (error) {
      alert("삭제 중 오류가 발생했습니다.");
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-700 transition-colors px-2 py-1 rounded-md hover:bg-red-50 disabled:opacity-50"
    >
      <Trash2 className="w-3.5 h-3.5" />
      {isDeleting ? "삭제 중..." : "삭제"}
    </button>
  );
}
