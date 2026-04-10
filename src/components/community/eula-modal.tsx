"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Loader2 } from "lucide-react";
import { agreeEulaAction } from "@/actions/member-actions"; // 🌟 방금 만든 서버 액션

interface EulaModalProps {
  memberId: number;
  hasAgreed: boolean;
  orgId: number;
}

export function EulaModal({ memberId, hasAgreed, orgId }: EulaModalProps) {
  // 이미 동의했으면 모달을 열지 않음
  const [isOpen, setIsOpen] = useState(!hasAgreed);
  const [isPending, setIsPending] = useState(false);

  const handleAgree = async () => {
    setIsPending(true);
    const result = await agreeEulaAction(orgId);

    if (result.success) {
      setIsOpen(false); // 성공 시 모달 닫기
    } else {
      alert(result.error);
      setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* 🌟 interactOutside를 막아서 모달 바깥을 클릭해도 안 꺼지게 만듦 (강제 동의) */}
      <DialogContent
        className="w-[90vw] max-w-md rounded-2xl p-0 overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-6 pb-2 text-left">
          <DialogTitle className="text-xl font-bold">
            커뮤니티 이용 약관 동의
          </DialogTitle>
          <DialogDescription className="text-red-500 font-medium text-sm mt-2">
            * 쾌적한 앱 사용을 위해 아래 약관에 동의하셔야 합니다.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[40vh] px-6 text-sm text-slate-600 leading-relaxed border-y border-slate-100 bg-slate-50">
          <div className="py-4 space-y-4">
            <p>
              <strong>제 1조 (목적)</strong>
              <br />본 약관은 회원이 제공하는 커뮤니티 서비스 이용과 관련하여
              회원과 회사 간의 권리, 의무 및 책임 사항을 규정합니다.
            </p>
            <p>
              <strong>제 2조 (사용자 생성 콘텐츠 기준 및 무관용 원칙)</strong>
              <br />
              <span className="text-red-600 font-bold underline">
                회사는 욕설, 비방, 음란물, 불법 정보 등 부적절한 콘텐츠 게시 및
                타인에게 불쾌감을 주는 악성 사용자에 대해 '무관용 원칙'을
                적용합니다.
              </span>
              <br />
              해당 콘텐츠는 발견 즉시 통보 없이 삭제되며, 이를 작성한 사용자는
              즉각적이고 영구적인 계정 정지 조치가 취해집니다.
            </p>
            <p>
              <strong>제 3조 (신고 및 차단 기능)</strong>
              <br />
              회원은 언제든지 불쾌한 콘텐츠를 신고하거나 해당 작성자를 차단할 수
              있으며, 회사는 신고 접수 후 24시간 이내에 적절한 조치를 취할
              의무가 있습니다.
            </p>
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 sm:justify-center">
          <Button
            onClick={handleAgree}
            disabled={isPending}
            className="w-full bg-brand-main hover:bg-brand-main/90 h-12 text-base font-bold"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Check className="w-5 h-5 mr-2" />
            )}
            동의하고 커뮤니티 시작하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
