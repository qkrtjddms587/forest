"use client";

import { useState } from "react";
import { sendGroupPushAction } from "@/actions/push-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface AdminPushFormProps {
  orgId: number;
}

export function AdminPushForm({ orgId }: AdminPushFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const body = formData.get("body") as string;

    if (!title.trim() || !body.trim()) {
      alert("푸시 제목과 내용을 모두 입력해주세요.");
      return;
    }

    if (
      !confirm(
        "🚨 정말로 이 단체의 모든 활성 회원에게 푸시 알림을 발송하시겠습니까?"
      )
    )
      return;

    setIsPending(true);
    try {
      // 🌟 서버 액션 호출 (추가 데이터로 커뮤니티 홈 링크를 넘겨줍니다)
      const result = await sendGroupPushAction(orgId, title, body, {
        link: `/m/org/${orgId}/community`,
      });

      if (result.success) {
        alert(`✅ 발송 성공!\n${result.message}`);
        // 발송 완료 후 폼 초기화 또는 관리자 메인으로 이동
        // router.push(`/m/org/${orgId}/test`);
      } else {
        alert(`❌ 발송 실패: ${result.error}`);
      }
    } catch (error) {
      alert("푸시 발송 중 오류가 발생했습니다.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 🌟 관리자 경고/안내 메시지 */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
        <AlertCircle className="w-5 h-5 shrink-0 text-blue-600" />
        <p className="leading-relaxed">
          이 단체에 <strong>'활동 중(ACTIVE)'</strong>인 모든 회원에게 일괄
          발송됩니다.
          <br />
          푸시 알림은 늦은 밤이나 새벽 시간대 발송을 자제해 주세요.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            푸시 제목
          </label>
          <Input
            name="title"
            placeholder="예) 🚨 긴급 공지사항 안내"
            maxLength={50}
            required
            className="text-base py-6"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            푸시 내용 (본문)
          </label>
          <Textarea
            name="body"
            placeholder="회원들에게 보낼 알림 내용을 입력하세요."
            required
            className="min-h-[150px] resize-none text-base leading-relaxed p-4"
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="w-24 bg-slate-50"
        >
          취소
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-brand-main hover:bg-brand-main/90 w-32 flex items-center gap-2"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" /> 발송하기
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
