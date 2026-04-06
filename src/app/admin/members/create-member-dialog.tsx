"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2 } from "lucide-react";
import { createMemberAction } from "@/actions/member-actions";

export function CreateMemberDialog({
  organizations,
  generations,
  positions,
}: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createMemberAction(formData);

      if (result.success) {
        setIsOpen(false); // 🌟 성공 시 모달 닫기 (화면은 Server Action의 revalidatePath로 자동 갱신됨)
      } else {
        setErrorMsg(result.error || "등록에 실패했습니다.");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {/* 리스트 페이지 상단에 들어갈 '회원 추가' 버튼 */}
        <Button className="bg-brand-main hover:bg-brand-main/80">
          <UserPlus className="w-4 h-4 mr-2" />
          신규 회원 등록
        </Button>
      </DialogTrigger>

      {/* 모달 내용 */}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">신규 회원 등록</DialogTitle>
          <DialogDescription>
            새로운 회원의 기본 정보와 초기 소속을 입력합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md font-semibold border border-red-100">
              🚨 {errorMsg}
            </div>
          )}

          {/* 1. 기본 정보 */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2">
              기본 정보
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  이름 <span className="text-red-500">*</span>
                </Label>
                <Input name="name" placeholder="홍길동" required />
              </div>
              <div className="space-y-2">
                <Label>
                  전화번호 <span className="text-red-500">*</span>
                </Label>
                <Input name="phone" placeholder="010-0000-0000" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  아이디 <span className="text-red-500">*</span>
                </Label>
                <Input name="loginId" placeholder="영문/숫자" required />
              </div>
              <div className="space-y-2">
                <Label>
                  초기 비밀번호 <span className="text-red-500">*</span>
                </Label>
                <Input name="password" type="password" required />
              </div>
            </div>
          </div>

          {/* 2. 소속 정보 */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2">
              소속 및 직책
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  조직 <span className="text-red-500">*</span>
                </Label>
                <Select name="organizationId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="조직 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org: any) => (
                      <SelectItem key={org.id} value={String(org.id)}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  기수 <span className="text-red-500">*</span>
                </Label>
                <Select name="generationId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="기수 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {generations.map((gen: any) => (
                      <SelectItem key={gen.id} value={String(gen.id)}>
                        {gen.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="pt-4 flex justify-end gap-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {isPending ? "저장 중..." : "등록하기"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
