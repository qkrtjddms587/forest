"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Send, BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { sendAdminPushAction } from "@/actions/push-actions";

export default function AdminPushPage() {
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSending(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await sendAdminPushAction(formData);

      if (result.success) {
        toast.success("성공적으로 푸시 알림을 발송했습니다!", {
          description: result.message,
        });
        // 전송 후 폼 초기화
        (e.target as HTMLFormElement).reset();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BellRing className="w-6 h-6 text-blue-600" />
          푸시 알림 발송
        </h1>
        <p className="text-slate-500 mt-2 text-sm">
          앱을 설치하고 알림을 허용한 전체 사용자에게 푸시 알림을 발송합니다.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6"
      >
        {/* 제목 입력 */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-slate-700">
            알림 제목 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            name="title"
            placeholder="예: [페이즘] 새로운 공지사항이 등록되었습니다."
            required
            maxLength={50}
            className="bg-slate-50"
          />
        </div>

        {/* 내용 입력 */}
        <div className="space-y-2">
          <Label htmlFor="body" className="text-slate-700">
            알림 내용 <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="body"
            name="body"
            placeholder="푸시 알림에 표시될 본문 내용을 입력해주세요. (최대 100자 권장)"
            required
            rows={4}
            className="bg-slate-50 resize-none"
          />
        </div>

        {/* 이동할 링크 입력 (선택) */}
        <div className="space-y-2">
          <Label htmlFor="link" className="text-slate-700">
            클릭 시 이동할 링크 (선택)
          </Label>
          <Input
            id="link"
            name="link"
            placeholder="예: /m/org/5/post/12 (입력하지 않으면 메인으로 이동)"
            className="bg-slate-50"
          />
          <p className="text-xs text-slate-400">
            * 앱 내부 딥링크 경로를 입력하면 알림 클릭 시 해당 화면으로 바로
            이동합니다.
          </p>
        </div>

        {/* 발송 버튼 */}
        <div className="pt-4 border-t">
          <Button
            type="submit"
            disabled={isSending}
            className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
          >
            {isSending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                발송 중...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                푸시 알림 쏘기
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
