"use client";

import { useTransition } from "react";
import { Crown } from "lucide-react"; // 액션 경로 맞게 수정
import { DeleteButton } from "./form"; // 삭제 버튼 경로 맞게 수정
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { setPrimaryGeneration } from "@/actions/admin-gen-actions";

interface Props {
  orgId: number;
  gen: {
    id: number;
    name: string;
    isPrimary: boolean;
  };
}

export function GenerationItem({ orgId, gen }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleSetPrimary = () => {
    startTransition(async () => {
      const result = await setPrimaryGeneration(orgId, gen.id);
      if (!result?.success) {
        alert(result?.error || "대표 기수 설정에 실패했습니다.");
      }
    });
  };

  return (
    <div
      className={`flex items-center border rounded pl-1 pr-1 py-1 shadow-sm gap-1 transition-colors ${
        gen.isPrimary
          ? "bg-green-50 border-green-200"
          : "bg-white hover:border-slate-300"
      }`}
    >
      {gen.isPrimary ? (
        // 👑 1. 대표 기수일 때 (클릭 안 됨, 왕관 표시)
        <div className="flex items-center gap-2 px-2 py-1">
          <Crown className="w-4 h-4 text-brand-main" />
          <span className="text-sm font-bold text-brand-main">{gen.name}</span>
        </div>
      ) : (
        // 👆 2. 일반 기수일 때 (이름 영역 클릭 시 모달 오픈)
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <div className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-slate-50 rounded transition-colors">
              <span className="text-sm text-gray-600 font-medium">
                {gen.name}
              </span>
            </div>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>대표 기수 설정</AlertDialogTitle>
              <AlertDialogDescription>
                <strong>[{gen.name}]</strong>을(를) 이 단체의 대표 기수로
                지정하시겠습니까?
                <br />
                앱에서 회원들이 조직도를 볼 때 가장 먼저 표시됩니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              {/* 버튼 클릭 시 서버 액션 실행 */}
              <AlertDialogAction
                onClick={handleSetPrimary}
                disabled={isPending}
              >
                {isPending ? "설정 중..." : "대표로 지정하기"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* 🗑️ 삭제 버튼 (오른쪽에 분리되어 있어서 겹치지 않음) */}
      <div className="ml-1 border-l pl-1">
        <DeleteButton id={gen.id} type="gen" />
      </div>
    </div>
  );
}
