"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button"; // 서버 액션 경로에 맞게 수정해주세요
import { setPrimaryGeneration } from "@/actions/admin-gen-actions";

interface Props {
  orgId: number;
  genId: number;
}

export function SetPrimaryGenButton({ orgId, genId }: Props) {
  // useTransition을 쓰면 서버와 통신하는 동안 버튼을 비활성화(로딩 상태) 할 수 있습니다.
  const [isPending, startTransition] = useTransition();

  const handleSetPrimary = () => {
    // 실수로 누르는 걸 방지하려면 여기에 confirm()을 넣어도 좋습니다.
    startTransition(async () => {
      const result = await setPrimaryGeneration(orgId, genId);

      if (!result.success) {
        alert(result.error || "대표 기수 설정에 실패했습니다.");
      }
      // 성공하면 서버 액션 안의 revalidatePath가 작동해서 화면이 자동으로 싹 바뀝니다!
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-6 px-2 text-xs text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
      onClick={handleSetPrimary}
      disabled={isPending}
    >
      {isPending ? "설정 중..." : "대표로 설정"}
    </Button>
  );
}
