"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { sendGroupPushAction } from "@/actions/push-actions";

export function PushForm({ orgId }: { orgId: number }) {
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSending(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const body = formData.get("body") as string;

    try {
      const result = await sendGroupPushAction(orgId, title, body);

      if (result.success) {
        toast.success("성공적으로 푸시 알림을 발송했습니다!", {
          description: result.message,
        });
        (e.target as HTMLFormElement).reset();
        router.refresh();
      } else {
        toast.error(result.error || "발송 실패");
      }
    } catch (error) {
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      // 🌟 모바일은 flex-col(세로), 태블릿 이상(md)부터는 flex-row(가로) 적용!
      className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-end gap-4"
    >
      {/* 제목 (1/3 비율 정도 차지) */}
      <div className="w-full md:w-1/3 space-y-2">
        <Label htmlFor="title" className="text-slate-700 font-semibold">
          알림 제목 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          name="title"
          placeholder="예: [공지] 새로운 소식"
          required
          maxLength={50}
          className="bg-slate-50 h-[46px]" // 🌟 높이 통일
        />
      </div>

      {/* 내용 (남은 공간 모두 차지) */}
      {/* 가로 배열에서는 Textarea보다 Input이 훨씬 UI가 깔끔합니다. */}
      <div className="w-full md:flex-1 space-y-2">
        <Label htmlFor="body" className="text-slate-700 font-semibold">
          알림 내용 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="body"
          name="body"
          placeholder="푸시 알림에 표시될 내용 (최대 100자)"
          required
          maxLength={100}
          className="bg-slate-50 h-[46px]" // 🌟 높이 통일
        />
      </div>

      {/* 발송 버튼 (고정된 너비) */}
      <div className="w-full md:w-auto shrink-0 pt-2 md:pt-0">
        <Button
          type="submit"
          disabled={isSending}
          className="w-full md:w-[140px] h-[46px] text-base bg-brand-main hover:bg-brand-main/90"
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              푸시 발송
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
