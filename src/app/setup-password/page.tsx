"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldAlert } from "lucide-react";
import { setupInitialPasswordAction } from "@/actions/auth-action";

export default function SetupPasswordPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await setupInitialPasswordAction(formData);

      if (result.success) {
        alert("비밀번호 설정이 완료되었습니다. 환영합니다!");
        // 🌟 성공 시 메인 화면(또는 대문)으로 리다이렉트 (이제 ACTIVE 상태이므로 통과됨)
        window.location.href = "/";
      } else {
        setErrorMsg(result.error || "처리 실패");
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-none">
        <CardHeader className="text-center space-y-2 pt-8">
          <div className="mx-auto w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-2">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold">
            초기 비밀번호 변경
          </CardTitle>
          <CardDescription>
            안전한 서비스 이용을 위해 관리자가 발급한 초기 비밀번호를 변경해
            주세요.
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md font-semibold text-center">
                {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">새로운 비밀번호</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  placeholder="새 비밀번호 입력"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="새 비밀번호 다시 입력"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11" disabled={isPending}>
              {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : null}
              {isPending ? "설정 중..." : "비밀번호 변경 및 시작하기"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
